import { randomUUID } from "node:crypto"
import Customer from "../model/secondaryUser/tallyCustomerSchema.js"
import { TallyBatch, TallyImport } from "../model/tallyImportSchema.js"
import { ensureTallyIndexes } from "./tallyImportService.js"
import { tallyIdentity, tallyUpsert, tallyFields, normalizeTallyRecord } from "./tallyRecords.js"

const LEASE_MS = 5 * 60000

export async function processNextTallyImport() {
  await ensureTallyIndexes()
  // Interrupted uploads are never processed. Release their active slot.
  await TallyImport.updateMany({ status: "uploading", heartbeatAt: { $lt: new Date(Date.now() - 30 * 60000) } }, {
    $set: { status: "failed", active: false, error: "Upload interrupted or idle for 30 minutes; resend with a new key." },
  })
  const leaseToken = randomUUID()
  const job = await TallyImport.findOneAndUpdate({ $or: [
    { status: "queued" }, { status: "processing", leaseUntil: { $lt: new Date() } },
  ] }, { $set: { status: "processing", leaseToken, leaseUntil: new Date(Date.now() + LEASE_MS) }, $inc: { attempts: 1 } }, { sort: { createdAt: 1 }, new: true }).lean()
  if (!job) return false
  const owned = { _id: job._id, status: "processing", leaseToken }
  try {
    if (job.attempts > 5) throw new Error("retry-limit")
    while (job.nextBatch < job.batchCount) {
      const renewed = await TallyImport.updateOne(owned, { $set: { leaseUntil: new Date(Date.now() + LEASE_MS) } })
      if (!renewed.matchedCount) return true
      const batch = await TallyBatch.findOne({ jobId: job._id, sequence: job.nextBatch }).lean()
      if (!batch) throw new Error("missing-batch")
      // Last occurrence wins within this batch. Later batches also take precedence.
      // Project agreed fields to support batches staged by the older importer.
      const normalized = batch.records.map((record, index) => normalizeTallyRecord(
        Object.fromEntries(tallyFields.map(field => [field, record[field] ?? (field === "Gstno" ? record.gstNo : undefined) ?? ""])), index + 1, { staged: true }
      ))
      const records = [...new Map(normalized.map(record => [tallyIdentity(record), record])).values()]
      // Explicit validation happened before durable acceptance. Pipeline writes do
      // not depend on Mongoose save hooks or implicit update validators.
      await Customer.bulkWrite(records.map(record => tallyUpsert(record, job)), { ordered: false, strict: false })
      const checkpoint = await TallyImport.updateOne({ ...owned, nextBatch: job.nextBatch }, {
        $inc: { nextBatch: 1, processed: batch.records.length },
        $set: { leaseUntil: new Date(Date.now() + LEASE_MS) },
      })
      if (!checkpoint.matchedCount) return true
      job.nextBatch++
    }
    await TallyImport.updateOne(owned, { $set: { status: "completed", active: false }, $unset: { error: 1, leaseToken: 1, leaseUntil: 1 } })
  } catch (error) {
    const missingBatch = error.message === "missing-batch"
    const terminal = job.attempts >= 5 || missingBatch
    const code = error.code || error.name
    let message = "Temporary processing failure; retrying automatically."
    if (terminal) {
      if (missingBatch) message = "The staged import batch is missing. Submit the file or payload again."
      else if (code === 11000) message = "A database uniqueness rule blocked the customer save (11000). Check the Tally customer indexes before retrying."
      else if (error.status === 422) message = "The worker rejected a staged customer row. Check that the API and worker are running the same version."
      else message = `The worker could not save this import (${code}). Check the worker log for this job before retrying.`
    }
    await TallyImport.updateOne(owned, { $set: {
      status: terminal ? "failed" : "queued", active: !terminal,
      error: message,
    }, $unset: { leaseToken: 1, leaseUntil: 1 } })
    console.error("Tally worker batch failed", { jobId: String(job._id), batch: job.nextBatch, attempt: job.attempts, code })
  }
  return true
}

// Separate process: no per-request tasks or unbounded Promise.all.
export function startTallyWorker() {
  let timer, stopped = false
  const tick = async () => {
    let busy = false
    try { busy = await processNextTallyImport() }
    catch (error) { console.error("Tally worker unavailable", { code: error.code || error.name }) }
    if (!stopped) timer = setTimeout(tick, busy ? 1000 : 5000)
  }
  tick()
  return () => { stopped = true; clearTimeout(timer) }
}
