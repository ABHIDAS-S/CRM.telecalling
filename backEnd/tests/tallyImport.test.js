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
import assignedCustomerRoutes from "../routes/assignedCustomerRoutes.js"
import Customer from "../model/secondaryUser/tallyCustomerSchema.js"
import AssignCustomer from "../model/secondaryUser/assignCustomerSchema.js"
import CustomerCall from "../model/secondaryUser/customerCallSchema.js"
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
  app.use("/report", express.json(), tallyReportRoutes)
  app.use("/assigned", express.json(), assignedCustomerRoutes)
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

test("report imports Excel rows and allocates the union of numeric range and checked customers", async () => {
  const headers = { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" }
  const post = (path, body) => fetch(`${base}/report/${path}`, { method: "POST", headers, body: JSON.stringify(body) })
  const { insertedId: staffId } = await models.Staff.collection.insertOne({ name: "Allocation staff", role: "Staff" })
  const staff = await (await fetch(`${base}/report/staff`, { headers })).json()
  assert.ok(staff.data.some(member => member._id === String(staffId)))
  const imported = await post("imports", { data: ["2", "10", "11", "100", "3A"].map(serial =>
    record(serial, { Pincode: "001234", Company: "Example Company" })
  ) })
  assert.equal(imported.status, 202)
  await processNextTallyImport()
  const rows = await Customer.find().lean()
  assert.equal(rows.length, 5)
  assert.equal(rows[0].Pincode, "001234")
  assert.equal(rows[0].Company, "Example Company")
  const checked = rows.filter(row => ["10", "100"].includes(row.Tallyserialno))
  const selection = { staffId, start: "2", end: "11", customerIds: checked.map(row => row._id) }
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await post("assign", selection)
    assert.equal(response.status, 200)
    assert.equal((await response.json()).assigned, 4)
  }
  const allocations = await AssignCustomer.find({ staffId }).lean()
  assert.deepEqual(
    rows.filter(row => allocations.some(allocation => allocation._id.equals(row._id)))
      .map(row => row.Tallyserialno).sort(),
    ["10", "100", "11", "2"]
  )
  const staffToken = jwt.sign({ userId: String(staffId) }, process.env.JWT_SECRET_KEY)
  const staffHeaders = { Authorization: `Bearer ${staffToken}`, "Content-Type": "application/json" }
  const response = await fetch(`${base}/assigned`, { headers: staffHeaders })
  assert.equal(response.status, 200)
  const report = await response.json()
  assert.equal(report.total, 4)
  assert.deepEqual(report.data.map(row => row.Tallyserialno).sort(), ["10", "100", "11", "2"])
  const logCall = (id, draft) => fetch(`${base}/assigned/${id}/calls`, {
    method: "POST", headers: staffHeaders, body: JSON.stringify(draft),
  })
  assert.ok(report.outcomes.includes("Convert to Lead"))
  const draft = { outcome: "Convert to Lead", followUpDate: "2026-12-01T10:30:00.000Z", primeAttention: true, remarks: "Requested pricing." }
  assert.equal((await logCall(rows.find(row => row.Tallyserialno === "3A")._id, draft)).status, 404)
  assert.equal((await logCall(report.data[0]._id, { ...draft, outcome: "Invalid" })).status, 400)
  const saved = await logCall(report.data[0]._id, draft)
  assert.equal(saved.status, 201)
  const call = await CustomerCall.findById((await saved.json()).id).lean()
  assert.equal(String(call.staffId), String(staffId))
  assert.equal(String(call.customerId), report.data[0]._id)
  assert.equal(call.outcome, draft.outcome)
  assert.equal(call.followUpDate.toISOString(), draft.followUpDate)
  assert.equal(call.primeAttention, true)
  assert.equal(call.remarks, draft.remarks)
  await CustomerCall.create({ customerId: call.customerId, staffId: new mongoose.Types.ObjectId(), outcome: draft.outcome })
  const callsResponse = await fetch(`${base}/assigned/calls?outcome=Convert%20to%20Lead`, { headers: staffHeaders })
  assert.equal(callsResponse.status, 200)
  const history = await callsResponse.json()
  assert.equal(history.counts[draft.outcome], 1)
  assert.equal(history.data.length, 1)
  assert.equal(history.data[0].customerName, "Same customer")
  assert.equal(history.data[0].outcome, draft.outcome)
  assert.equal(history.data[0].followUpDate, draft.followUpDate)
  const { insertedId: idleStaffId } = await models.Staff.collection.insertOne({ name: "No calls", role: "Staff", email: "idle@example.test", attendanceId: 101 })
  await CustomerCall.create({ customerId: call.customerId, staffId, outcome: "Wrong Number" })
  const summaryUrl = `${base}/report/call-summary`
  assert.equal((await fetch(summaryUrl, { headers: staffHeaders })).status, 403)
  const summaryResponse = await fetch(summaryUrl, { headers })
  assert.equal(summaryResponse.status, 200)
  const summary = await summaryResponse.json()
  assert.equal(summary.totals.total, 2)
  assert.equal(summary.totals.outcomes[draft.outcome], 1)
  assert.equal(summary.staff.find(member => member._id === String(staffId)).total, 2)
  assert.equal(summary.staff.find(member => member._id === String(idleStaffId)).total, 0)
})

test("Tally push accepts the new customer fields without a serial or mobile", async () => {
  const row = { name: "Example shop", address1: "Main Road", address2: "Floor 2", address3: "Market", pin: "001234", email: "shop@example.com", contact: "Asha", phone1: "0123456", mobile: "", tin: "00123", state: "Kerala", country: "India", location: "Kochi" }
  assert.equal((await upload([row])).status, 202)
  await processNextTallyImport()
  const saved = await Customer.findOne({ name: row.name }).lean()
  assert.equal(saved.Pincode, row.pin)
  assert.equal(saved.address2, row.address2)
  assert.equal(saved.address3, row.address3)
  assert.equal(saved.location, row.location)
  assert.equal(saved.tin, row.tin)
  assert.equal(Object.hasOwn(saved, "Tallyserialno"), false)
  assert.equal((await upload([{ ...row, location: "Updated location" }], "repeat-no-serial")).status, 202)
  await processNextTallyImport()
  assert.equal(await Customer.countDocuments({ name: row.name }), 1)
  assert.equal((await Customer.findById(saved._id).lean()).location, "Updated location")
  assert.equal((await upload([{ ...row, Tallyserialno: "000123" }], "push-with-serial")).status, 202)
  await processNextTallyImport()
  assert.ok(await Customer.exists({ Customer: row.name, Tallyserialno: "000123" }))
  const excelUpload = await fetch(`${base}/report/imports`, {
    method: "POST",
    headers: { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ data: [
      { ...row, Tallyserialno: "000124", pin: "110001", state: "", country: "", location: "" },
      { name: "Blank tax and PIN", Tallyserialno: "000125" },
      { name: "Explicit location", Tallyserialno: "000126", pin: "110001", location: "Existing location" },
      { name: "Unknown PIN", Tallyserialno: "000127", pin: "999999" },
      { name: "TIN lookup", Tallyserialno: "000128", tin: "29123456789" },
      { name: "GSTIN lookup", Tallyserialno: "000129", Gstno: "33ABCDE1234F1Z5" },
      { name: "Explicit state and country", Tallyserialno: "000130", state: "Ontario", country: "Canada" },
    ] }),
  })
  assert.equal(excelUpload.status, 202)
  await processNextTallyImport()
  assert.equal((await Customer.findOne({ Tallyserialno: "000124" }).lean()).location, "Central Delhi")
  assert.equal((await Customer.findOne({ Tallyserialno: "000125" }).lean()).Country, "India")
  assert.equal((await Customer.findOne({ Tallyserialno: "000126" }).lean()).location, "Existing location")
  assert.equal((await Customer.findOne({ Tallyserialno: "000127" }).lean()).location, "")
  for (const [serial, state, country] of [
    ["000124", "Delhi", "India"],
    ["000125", "Kerala", "India"],
    ["000127", "", ""],
    ["000128", "Karnataka", "India"],
    ["000129", "Tamil Nadu", "India"],
    ["000130", "Ontario", "Canada"],
  ]) {
    const customer = await Customer.findOne({ Tallyserialno: serial }).lean()
    assert.equal(customer.State, state)
    assert.equal(customer.Country, country)
  }
  assert.equal((await upload([{ name: "Tally push without country" }], "push-without-country")).status, 202)
  await processNextTallyImport()
  assert.equal((await Customer.findOne({ name: "Tally push without country" }).lean()).Country, "")
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

test("data wrappers accept single and bulk customers without buffering the whole array", async () => {
  const payloads = [
    { data: record("wrapped-one", { State: " Kerala ", Country: " India " }) },
    { data: Array.from({ length: 1001 }, (_, i) => record(`wrapped-${i}`)) },
  ]
  for (const payload of payloads) {
    const response = await fetch(`${base}/integration/imports`, { method: "POST", headers: {
      "Content-Type": "application/json", "X-Tally-API-Key": key,
    }, body: JSON.stringify(payload, null, 2) })
    assert.equal(response.status, 202)
    const job = await response.json()
    assert.equal(job.total, Array.isArray(payload.data) ? 1001 : 1)
    if (Array.isArray(payload.data)) assert.equal(job.batchCount, 3)
    await processNextTallyImport()
  }
  assert.equal(await Customer.countDocuments(), 1002)
  const located = await Customer.findOne({ Tallyserialno: "wrapped-one" }).lean()
  assert.equal(located.State, "Kerala")
  assert.equal(located.Country, "India")
  const repeat = await fetch(`${base}/integration/imports`, { method: "POST", headers: {
    "Content-Type": "application/json", "X-Tally-API-Key": key,
  }, body: JSON.stringify({ data: { ...record("wrapped-one"), Address: "Updated through wrapper", State: "Tamil Nadu", Country: "India" } }) })
  assert.equal(repeat.status, 202)
  await processNextTallyImport()
  assert.equal(await Customer.countDocuments(), 1002)
  assert.equal((await Customer.findOne({ Tallyserialno: "wrapped-one" }).lean()).Address, "Updated through wrapper")
  assert.equal((await Customer.findById(located._id).lean()).State, "Tamil Nadu")
  const received = []
  const reader = createTallyJsonReader(async value => received.push(value))
  for (const byte of Buffer.from(JSON.stringify({ data: [record("split")] }))) await reader.write(Buffer.from([byte]))
  await reader.end()
  assert.deepEqual(received, [record("split")])
  for (const invalid of ['{"data":null}', '{"data":123}', '{"data":[{},]}', '{"data":[{}]', '{"data":{},"extra":1}', '{"data":{},"data":{}}']) {
    const malformed = createTallyJsonReader(async () => {})
    await assert.rejects(async () => { await malformed.write(Buffer.from(invalid)); await malformed.end() })
  }
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
  assert.throws(() => normalizeTallyRecord(record("bad-state", { State: 123 }), 1), /State must be a string/)
  assert.throws(() => normalizeTallyRecord(record("bad-country", { Country: "x".repeat(151) }), 1), /Country exceeds 150/)
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
  const write = (row, importJob) => Customer.bulkWrite([tallyUpsert(normalizeTallyRecord(row, 1), importJob)], { strict: false })
  await write(newer, job)
  await write(record("one", { Address: "Old batch" }), { ...job, nextBatch: 0 })
  await write(record("one", { Address: "Old import" }), { ...job, generation: 1, nextBatch: 100 })
  assert.equal((await Customer.findOne({ Tallyserialno: "one" }).lean()).Address, "$literal-address")
})

test("admin report uses scoped cursors, serial filter and denies ordinary users", async () => {
  await upload([record("one", { Tallyserialno: "shared", Gstno: "32ABCDE1234F1Z5", State: "Kerala", Country: "India" }), record("two", { Customer: "Different customer", Tallyserialno: "shared", Gstno: "32ABCDE1234F1Z5", State: "Kerala", Country: "India" }), record("three")])
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
  assert.equal(first.data[0].State, "Kerala")
  assert.equal(first.data[0].Country, "India")
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
