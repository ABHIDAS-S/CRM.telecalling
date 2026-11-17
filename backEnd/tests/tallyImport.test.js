import { test, before, after, beforeEach } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { spawn } from "node:child_process"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import { once } from "node:events"
import net from "node:net"
import express from "express"
import mongoose from "mongoose"
import jwt from "jsonwebtoken"
import tallyRoutes from "../routes/tallyRoutes.js"
import tallyReportRoutes from "../routes/tallyReportRoutes.js"
import Customer from "../model/secondaryUser/tallyCustomerSchema.js"
import models from "../model/auth/authSchema.js"
import { TallyImport, TallyBatch, TallySequence } from "../model/tallyImportSchema.js"
import { ensureTallyIndexes } from "../services/tallyImportService.js"
import { processNextTallyImport } from "../services/tallyWorker.js"
import { normalizeTallyRecord, tallyUpsert } from "../services/tallyRecords.js"
import { createTallyJsonReader } from "../services/tallyJsonReader.js"

let mongo, directory, server, base, adminToken
const key = "test-only-tally-key-more-than-32-characters"
const environment = Object.fromEntries(["TALLY_API_KEY_SHA256", "JWT_SECRET_KEY"].map(name => [name, process.env[name]]))
const sha = body => createHash("sha256").update(body).digest("hex")
const record = (id, extra = {}) => ({ Customer: "Same customer", ContactNumber: "0012345", Mobilenumber: "+919876543210", Tallyserialno: id, ...extra })
const bodyFor = rows => rows.map(row => JSON.stringify(row)).join("\n") + "\n"
async function upload(rows, requestId = "test-import", overrides = {}) {
  const body = typeof rows === "string" ? rows : bodyFor(rows)
  const response = await fetch(`${base}/integration/imports`, { method: "POST", headers: {
    "Content-Type": "application/x-ndjson", "X-Tally-API-Key": key,
    "Idempotency-Key": requestId, "X-Content-SHA256": sha(body), ...overrides,
  }, body })
  return { status: response.status, data: await response.json() }
}

before(async () => {
  const probe = net.createServer()
  probe.listen(0, "127.0.0.1"); await once(probe, "listening")
  const port = probe.address().port
  await new Promise(resolve => probe.close(resolve))
  directory = await mkdtemp(join(tmpdir(), "crm-tally-test-"))
  mongo = spawn(process.env.MONGOD_BINARY || "C:/Program Files/MongoDB/Server/6.0/bin/mongod.exe", ["--dbpath", directory, "--port", String(port), "--bind_ip", "127.0.0.1", "--quiet"], { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] })
  let diagnostic = "", connectionError = ""
  const capture = chunk => { diagnostic = (diagnostic + chunk.toString()).slice(-3500) }
  mongo.stdout.on("data", capture)
  mongo.stderr.on("data", capture)
  let spawnError
  mongo.on("error", error => { spawnError = error })
  let connected = false
  for (let attempt = 0; attempt < 80; attempt++) {
    if (spawnError) throw spawnError
    try { await mongoose.connect(`mongodb://127.0.0.1:${port}/tally_test`, { serverSelectionTimeoutMS: 300 }); connected = true; break }
    catch (error) { connectionError = error.message; await new Promise(resolve => setTimeout(resolve, 100)) }
  }
  assert.ok(connected, `Isolated MongoDB did not start: ${connectionError}\n${diagnostic}`)
  await ensureTallyIndexes()
  process.env.TALLY_API_KEY_SHA256 = sha(key)
  process.env.JWT_SECRET_KEY = "test-only-jwt-secret"
  const app = express()
  app.use("/integration", tallyRoutes) // deliberately no JSON parser
  app.use("/report", tallyReportRoutes)
  server = app.listen(0, "127.0.0.1"); await once(server, "listening")
  base = `http://127.0.0.1:${server.address().port}`
  const id = new mongoose.Types.ObjectId()
  await models.Admin.collection.insertOne({ _id: id, role: "Admin" })
  adminToken = jwt.sign({ userId: String(id) }, process.env.JWT_SECRET_KEY)
})
beforeEach(async () => {
  await Promise.all([Customer.deleteMany({}), TallyImport.deleteMany({}), TallyBatch.deleteMany({}), TallySequence.deleteMany({})])
})
after(async () => {
  if (server) { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)) }
  await mongoose.disconnect()
  if (mongo?.pid && mongo.exitCode === null) { const exited = once(mongo, "exit"); mongo.kill(); await exited }
  if (directory && resolve(directory).startsWith(resolve(tmpdir()) + "\\")) await rm(directory, { recursive: true, force: true })
  for (const [name, value] of Object.entries(environment)) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
})

test("stream upload creates bounded durable batches, worker upserts and repeated sync updates", async () => {
  const rows = Array.from({ length: 1001 }, (_, i) => record(`id-${i}`, { Gstno: "32ABCDE1234F1Z5" }))
  const result = await upload(rows)
  assert.equal(result.status, 202)
  assert.equal(result.data.batchCount, 3)
  assert.deepEqual((await TallyBatch.find({}).sort({ sequence: 1 }).lean()).map(batch => batch.records.length), [500, 500, 1])
  assert.equal(await Customer.countDocuments(), 0)
  await processNextTallyImport()
  assert.equal(await Customer.countDocuments(), 1001)
  const first = await Customer.findOne({ Tallyserialno: "id-0" }).lean()
  assert.equal(first.ContactNumber, "0012345")
  assert.equal(first.Gstno, "32ABCDE1234F1Z5")
  const replay = await upload(rows)
  assert.equal(replay.status, 200)
  assert.equal(replay.data.replay, true)
  assert.equal(await TallyImport.countDocuments(), 1)
  assert.equal((await upload([record("id-0", { Address: "Updated address", Gstno: "32ABCDE1234F1Z6" })], "second-import")).status, 202)
  await processNextTallyImport()
  assert.equal(await Customer.countDocuments(), 1001)
  assert.equal((await Customer.findById(first._id).lean()).Address, "Updated address")
  assert.equal((await Customer.findById(first._id).lean()).Gstno, "32ABCDE1234F1Z6")
  const completed = await TallyImport.findById(result.data.id).lean()
  assert.equal(completed.status, "completed")
  assert.equal(completed.processed, 1001)
})

test("normal JSON objects and arrays stream into batches and reject malformed arrays", async () => {
  for (const payload of [record("normal-one", { Gstno: "32ABCDE1234F1Z5" }), Array.from({ length: 501 }, (_, i) => record(`json-${i}`))]) {
    const response = await fetch(`${base}/integration/imports`, { method: "POST", headers: {
      "Content-Type": "application/json", "X-Tally-API-Key": key,
    }, body: JSON.stringify(payload, null, 2) })
    assert.equal(response.status, 202)
    await processNextTallyImport()
  }
  assert.equal(await Customer.countDocuments(), 502)
  assert.equal((await Customer.findOne({ Tallyserialno: "normal-one" }).lean()).Gstno, "32ABCDE1234F1Z5")
  for (const invalid of ['[{"Customer":"x"},]', '[', '{}{}', '[null]', '{bad}', '[] trailing']) {
    const reader = createTallyJsonReader(async () => {})
    await assert.rejects(async () => { await reader.write(Buffer.from(invalid)); await reader.end() })
  }
  const received = []
  const reader = createTallyJsonReader(async value => received.push(value))
  const unicode = { Customer: 'കസ്റ്റമർ "quoted" \\ text {[]}' }
  const encoded = Buffer.from(JSON.stringify([unicode]))
  for (const byte of encoded) await reader.write(Buffer.from([byte]))
  await reader.end()
  assert.deepEqual(received, [unicode])
})

test("agreed eight-field matching updates details and inserts when any matching field changes", async () => {
  const original = record("shared-installation", { Customer: "ABC Traders", Address: "Old address", Emailid: "old@example.com" })
  assert.equal((await upload([original], "original")).status, 202)
  await processNextTallyImport()
  const first = await Customer.findOne({ Customer: "ABC Traders" }).lean()
  const updated = { ...original, Address: "New address", Emailid: "new@example.com", Contactperson: "New contact", ContactNumber: "0019999", Gstno: "32ABCDE1234F1Z5" }
  assert.equal((await upload([updated], "details-update")).status, 202)
  await processNextTallyImport()
  assert.equal(await Customer.countDocuments(), 1)
  const saved = await Customer.findById(first._id).lean()
  for (const field of ["Address", "Emailid", "Contactperson", "ContactNumber", "Gstno"]) assert.equal(saved[field], updated[field])
  const variants = [
    { ...updated, Customer: "Different customer" },
    { ...updated, Mobilenumber: "+919876543211" },
    { ...updated, Tallyserialno: "different-installation" },
  ]
  assert.equal((await upload(variants, "new-matches")).status, 202)
  await processNextTallyImport()
  assert.equal(await Customer.countDocuments(), 4)
  assert.equal(await Customer.countDocuments({ Tallyserialno: "shared-installation" }), 3)
  assert.equal((await upload([updated, ...variants], "repeat-all")).status, 202)
  await processNextTallyImport()
  assert.equal(await Customer.countDocuments(), 4)
  for (const field of ["Customer", "Mobilenumber", "Tallyserialno"]) {
    assert.throws(() => normalizeTallyRecord({ ...original, [field]: "  " }, 1), new RegExp(`${field} is required`))
  }
  await assert.rejects(Customer.collection.insertOne({ ...saved, _id: new mongoose.Types.ObjectId() }), error => error.code === 11000)
})

test("API key is the only required custom header; repeat uploads still upsert", async () => {
  const body = bodyFor([record("key-only")])
  for (let i = 0; i < 2; i++) {
    const response = await fetch(`${base}/integration/imports`, { method: "POST", headers: {
      "Content-Type": "application/x-ndjson", "X-Tally-API-Key": key,
    }, body })
    assert.equal(response.status, 202)
    const result = await response.json()
    const stored = await TallyImport.findById(result.id).lean()
    assert.equal(stored.checksum, sha(body))
    await processNextTallyImport()
  }
  assert.equal(await Customer.countDocuments(), 1)
})

test("duplicates within and across batches use the last record while preserving different matching combinations", async () => {
  const rows = Array.from({ length: 501 }, (_, i) => record(`id-${i}`))
  rows[1] = record("id-0", { Address: "Within batch" })
  rows[500] = record("id-0", { Address: "Last occurrence" })
  assert.equal((await upload(rows)).status, 202)
  await processNextTallyImport()
  assert.equal(await Customer.countDocuments(), 499)
  assert.equal((await Customer.findOne({ Tallyserialno: "id-0" }).lean()).Address, "Last occurrence")
})

test("invalid records and checksum failures never become eligible for processing", async () => {
  const invalid = await upload([...Array.from({ length: 500 }, (_, i) => record(`id-${i}`)), record("bad", { ContactNumber: 123 })])
  assert.equal(invalid.status, 422)
  assert.match(invalid.data.message, /Line 501/)
  assert.equal(await processNextTallyImport(), false)
  assert.equal(await Customer.countDocuments(), 0)
  const mismatch = await upload([record("valid")], "bad-hash", { "X-Content-SHA256": "0".repeat(64) })
  assert.equal(mismatch.status, 422)
  assert.equal(await processNextTallyImport(), false)
  assert.throws(() => normalizeTallyRecord(record("x", { sourceCompanyId: "spoof" }), 1), /unsupported field/)
  assert.throws(() => normalizeTallyRecord(record("", {}), 1), /Tallyserialno/)
  assert.throws(() => normalizeTallyRecord(record("bad-gst", { Gstno: 123 }), 1), /Gstno must be a string/)
})

test("authentication, idempotency conflicts and source-level backpressure", async () => {
  assert.equal((await upload([record("one")], "unauthorized", { "X-Tally-API-Key": "incorrect" })).status, 401)
  assert.equal((await upload([record("one")])).status, 202)
  assert.equal((await upload([record("different")])).status, 409)
  assert.equal((await upload([record("two")], "overlapping")).status, 409)
  assert.equal(await TallyImport.countDocuments(), 1)
})

test("worker resumes an expired lease and replay of partially applied writes stays idempotent", async () => {
  const result = await upload([record("one"), record("two")])
  await TallyImport.updateOne({ _id: result.data.id }, { $set: { status: "processing", leaseUntil: new Date(0), leaseToken: "crashed" } })
  const bulk = Customer.bulkWrite
  Customer.bulkWrite = async function (ops, options) {
    await bulk.call(this, ops.slice(0, 1), options)
    throw new Error("simulated disconnect after partial commit")
  }
  try { await processNextTallyImport() } finally { Customer.bulkWrite = bulk }
  assert.equal((await TallyImport.findById(result.data.id).lean()).processed, 0)
  assert.equal(await Customer.countDocuments(), 1)
  await processNextTallyImport()
  assert.equal(await Customer.countDocuments(), 2)
  assert.equal((await TallyImport.findById(result.data.id).lean()).processed, 2)
})

test("stale generations and batches cannot overwrite newer writes; dollar values remain literal", async () => {
  const _id = new mongoose.Types.ObjectId()
  const job = { _id, sourceCompanyId: "camet-tally", generation: 2, nextBatch: 1 }
  const newer = record("one", { Address: "$literal-address" })
  await Customer.bulkWrite([tallyUpsert(normalizeTallyRecord(newer, 1), job)])
  await Customer.bulkWrite([tallyUpsert(normalizeTallyRecord(record("one", { Address: "Old batch" }), 1), { ...job, nextBatch: 0 })])
  await Customer.bulkWrite([tallyUpsert(normalizeTallyRecord(record("one", { Address: "Old import" }), 1), { ...job, generation: 1, nextBatch: 100 })])
  assert.equal((await Customer.findOne({ Tallyserialno: "one" }).lean()).Address, "$literal-address")
})

test("admin report uses scoped cursors, serial filter and denies ordinary users", async () => {
  await upload([record("one", { Tallyserialno: "shared", Gstno: "32ABCDE1234F1Z5" }), record("two", { Customer: "Different customer", Tallyserialno: "shared", Gstno: "32ABCDE1234F1Z5" }), record("three")])
  await processNextTallyImport()
  const headers = { Authorization: `Bearer ${adminToken}` }
  assert.equal((await fetch(`${base}/report`)).status, 401)
  const staffToken = jwt.sign({ userId: String(new mongoose.Types.ObjectId()) }, process.env.JWT_SECRET_KEY)
  assert.equal((await fetch(`${base}/report`, { headers: { Authorization: `Bearer ${staffToken}` } })).status, 403)
  const staffAdminId = new mongoose.Types.ObjectId()
  const ordinaryStaffId = new mongoose.Types.ObjectId()
  await models.Staff.collection.insertMany([
    { _id: staffAdminId, email: "admin-in-staff@example.test", role: "Admin", attendanceId: 90001 },
    { _id: ordinaryStaffId, email: "ordinary-staff@example.test", role: "Staff", activeRole: "Admin", attendanceId: 90002 },
  ])
  const staffAdminToken = jwt.sign({ userId: String(staffAdminId) }, process.env.JWT_SECRET_KEY)
  const ordinaryStaffToken = jwt.sign({ userId: String(ordinaryStaffId) }, process.env.JWT_SECRET_KEY)
  assert.equal((await fetch(`${base}/report`, { headers: { Authorization: `Bearer ${staffAdminToken}` } })).status, 200)
  assert.equal((await fetch(`${base}/report/imports`, { headers: { Authorization: `Bearer ${staffAdminToken}` } })).status, 200)
  assert.equal((await fetch(`${base}/report`, { headers: { Authorization: `Bearer ${ordinaryStaffToken}` } })).status, 403)
  let response = await fetch(`${base}/report?serial=shared&limit=1`, { headers })
  assert.equal(response.status, 200)
  const first = await response.json()
  assert.equal(first.data.length, 1)
  assert.equal(first.data[0].Gstno, "32ABCDE1234F1Z5")
  assert.ok(first.nextCursor)
  response = await fetch(`${base}/report?serial=shared&limit=1&after=${first.nextCursor}`, { headers })
  const second = await response.json()
  assert.equal(second.data.length, 1)
  assert.notEqual(second.data[0]._id, first.data[0]._id)
  assert.equal(second.nextCursor, null)
  assert.equal((await fetch(`${base}/report?after=invalid`, { headers })).status, 400)
  const jobs = await (await fetch(`${base}/report/imports`, { headers })).json()
  assert.equal(jobs.data[0].status, "completed")
  const foreign = await TallyImport.create({ sourceCompanyId: "other-company", requestId: "foreign", checksum: "0".repeat(64), generation: 1, status: "completed", active: false })
  assert.equal((await fetch(`${base}/integration/imports/${foreign._id}`, { headers: { "X-Tally-API-Key": key } })).status, 404)
  assert.equal((await (await fetch(`${base}/report`, { headers })).json()).data.length, 3)
})
