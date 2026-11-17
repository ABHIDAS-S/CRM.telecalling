import { createHash, randomUUID } from "node:crypto";
import {
  TallyImport,
  TallyBatch,
  TallySequence,
} from "../model/tallyImportSchema.js";
import Customer from "../model/secondaryUser/tallyCustomerSchema.js";
import { normalizeTallyRecord } from "./tallyRecords.js";
import { createTallyJsonReader } from "./tallyJsonReader.js";

export const BATCH_SIZE = 500;
const MAX_LINE = 16384;
const MAX_BYTES = 512 * 1024 * 1024;
const RETENTION_MS = 7 * 86400000;
const httpError = (status, message) =>
  Object.assign(new Error(message), { status });
let readiness;
export function ensureTallyIndexes() {
  if (!readiness) {
    readiness = Promise.all([
      Customer.createIndexes(),
      TallyImport.createIndexes(),
      TallyBatch.createIndexes(),
    ]).catch((error) => {
      readiness = undefined;
      throw error;
    });
  }
  return readiness;
}

export function publicJob(job) {
  return {
    id: job._id,
    status: job.status,
    total: job.total,
    processed: job.processed,
    batchCount: job.batchCount,
    completedBatches: job.nextBatch,
    error: job.error || null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

export async function receiveTallyImport(req, res) {
  let job;
  try {
    const isJson = Boolean(req.is("application/json"));
    if (!isJson && !req.is("application/x-ndjson"))
      throw httpError(
        415,
        "Use application/json with a customer object or array.",
      );
    if (
      req.get("content-encoding") &&
      req.get("content-encoding") !== "identity"
    )
      throw httpError(415, "Compressed uploads are not supported.");
    const suppliedRequestId = req.get("Idempotency-Key");
    const requestId = suppliedRequestId || randomUUID();
    const checksum = (req.get("X-Content-SHA256") || "").toLowerCase();
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(requestId))
      throw httpError(
        400,
        "Provide an Idempotency-Key (1–100 letters, digits, underscores or hyphens).",
      );
    if (checksum && !/^[a-f0-9]{64}$/.test(checksum))
      throw httpError(
        400,
        "X-Content-SHA256 must be a SHA-256 hexadecimal digest.",
      );
    if (suppliedRequestId && !checksum)
      throw httpError(
        400,
        "When using optional Idempotency-Key, also provide X-Content-SHA256.",
      );
    if (Number(req.get("content-length")) > MAX_BYTES)
      throw httpError(413, "Upload exceeds 512 MiB.");
    await ensureTallyIndexes();
    const sourceCompanyId = req.tallyIntegration.sourceCompanyId;
    const existing = await TallyImport.findOne({
      sourceCompanyId,
      requestId,
    }).lean();
    if (existing) {
      if (existing.checksum !== checksum)
        throw httpError(
          409,
          "This idempotency key was used for different content.",
        );
      return res
        .status(existing.status === "uploading" ? 409 : 200)
        .json({ ...publicJob(existing), replay: true });
    }
    const sequence = await TallySequence.findOneAndUpdate(
      { _id: sourceCompanyId },
      { $inc: { value: 1 } },
      { upsert: true, new: true },
    );
    job = await TallyImport.create({
      sourceCompanyId,
      requestId,
      checksum: checksum || "pending",
      generation: sequence.value,
    });
    const hash = createHash("sha256");
    let pending = Buffer.alloc(0),
      records = [],
      count = 0,
      batchCount = 0,
      bytes = 0,
      line = 0;
    const flush = async () => {
      if (!records.length) return;
      await TallyBatch.create({
        jobId: job._id,
        sequence: batchCount++,
        records,
        expiresAt: new Date(Date.now() + RETENTION_MS),
      });
      records = [];
      const result = await TallyImport.updateOne(
        { _id: job._id, status: "uploading" },
        { $set: { total: count, batchCount, heartbeatAt: new Date() } },
      );
      if (!result.matchedCount)
        throw httpError(
          409,
          "Upload expired; retry with a new idempotency key.",
        );
    };
    const acceptRecord = async (value, position) => {
      records.push(normalizeTallyRecord(value, position));
      if (++count > 1000000)
        throw httpError(413, "Upload exceeds 1,000,000 records.");
      if (records.length === BATCH_SIZE) await flush();
    };
    const jsonReader = isJson
      ? createTallyJsonReader(acceptRecord, MAX_LINE)
      : null;
    const accept = async (buffer) => {
      line++;
      if (buffer.length > MAX_LINE)
        throw httpError(413, `Line ${line} exceeds 16 KiB.`);
      const text = buffer.toString("utf8").trim();
      if (!text) return;
      let value;
      try {
        value = JSON.parse(text);
      } catch {
        throw httpError(422, `Line ${line}: invalid JSON.`);
      }
      await acceptRecord(value, line);
    };
    // This route is mounted before express.json: memory stays bounded by a batch.
    for await (const chunk of req) {
      bytes += chunk.length;
      if (bytes > MAX_BYTES) throw httpError(413, "Upload exceeds 512 MiB.");
      hash.update(chunk);
      if (jsonReader) {
        await jsonReader.write(chunk);
        continue;
      }
      pending = Buffer.concat([pending, chunk]);
      let start = 0,
        end;
      while ((end = pending.indexOf(10, start)) !== -1) {
        await accept(pending.subarray(start, end));
        start = end + 1;
      }
      pending = Buffer.from(pending.subarray(start));
      if (pending.length > MAX_LINE)
        throw httpError(413, "A line exceeds 16 KiB.");
    }
    if (jsonReader) await jsonReader.end();
    else if (pending.length) await accept(pending);
    if (!count) throw httpError(422, "Upload contains no customer records.");
    const actualChecksum = hash.digest("hex");
    if (checksum && actualChecksum !== checksum)
      throw httpError(422, "Upload checksum does not match.");
    await flush();
    const queued = await TallyImport.findOneAndUpdate(
      { _id: job._id, status: "uploading" },
      {
        $set: {
          status: "queued",
          checksum: actualChecksum,
          total: count,
          batchCount,
        },
      },
      { new: true },
    ).lean();
    if (!queued)
      throw httpError(409, "Upload expired; retry with a new idempotency key.");
    return res.status(202).json(publicJob(queued));
  } catch (error) {
    if (job) {
      await TallyImport.updateOne(
        { _id: job._id, status: "uploading" },
        {
          $set: {
            status: "failed",
            active: false,
            error: error.status
              ? error.message
              : "Upload storage failed; retry with a new key.",
          },
        },
      ).catch(() => {});
    }
    const status = error.code === 11000 ? 409 : error.status || 503;
    if (!res.destroyed)
      res
        .status(status)
        .json({
          message:
            error.code === 11000
              ? "An import is already active for this source company. Check its status before retrying."
              : error.status
                ? error.message
                : "Import service is temporarily unavailable.",
        });
  }
}
