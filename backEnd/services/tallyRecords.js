export const tallyFields = ["Customer", "Address", "Contactperson", "ContactNumber", "Mobilenumber", "Emailid", "Tallyserialno", "Gstno"]
const limits = { Customer: 300, Address: 2000, Contactperson: 300, ContactNumber: 100, Mobilenumber: 100, Emailid: 320, Tallyserialno: 200, Gstno: 30 }

export function normalizeTallyRecord(input, line) {
  const fail = message => { throw Object.assign(new Error(`Line ${line}: ${message}`), { status: 422 }) }
  if (!input || typeof input !== "object" || Array.isArray(input)) fail("expected an object")
  for (const key of Object.keys(input)) {
    if (!tallyFields.includes(key)) fail(`unsupported field ${key.slice(0, 60)}`)
  }
  const record = {}
  for (const field of tallyFields) {
    if (input[field] !== undefined && typeof input[field] !== "string") fail(`${field} must be a string`)
    // Each line is a complete current record: omitted fields become empty strings.
    record[field] = (input[field] || "").trim()
    if (record[field].length > limits[field]) fail(`${field} exceeds ${limits[field]} characters`)
  }
  for (const field of ["Customer", "Tallyserialno", "Mobilenumber"]) {
    if (!record[field]) fail(`${field} is required for matching existing customers`)
  }
  if (record.Emailid && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.Emailid)) fail("Emailid is invalid")
  return record
}

export function tallyIdentity(record) {
  // Tuple encoding avoids collisions from delimiters inside customer names.
  return JSON.stringify([record.Customer, record.Tallyserialno, record.Mobilenumber])
}

// Pipeline updates fence out writes from older imports, including a stale worker.
// $literal is essential: user values beginning with '$' are data, not expressions.
export function tallyUpsert(record, job) {
  const generation = { $ifNull: ["$syncGeneration", -1] }
  const apply = { $or: [
    { $lt: [generation, job.generation] },
    { $and: [{ $eq: [generation, job.generation] }, { $lte: [{ $ifNull: ["$syncBatch", -1] }, job.nextBatch] }] },
  ] }
  const values = { ...record, sourceCompanyId: job.sourceCompanyId, syncGeneration: job.generation, syncBatch: job.nextBatch, lastImportId: job._id }
  const set = Object.fromEntries(Object.entries(values).map(([field, value]) => [field, { $cond: [apply, { $literal: value }, `$${field}`] }]))
  set.createdAt = { $ifNull: ["$createdAt", "$$NOW"] }
  set.updatedAt = { $cond: [apply, "$$NOW", "$updatedAt"] }
  return { updateOne: {
    filter: { sourceCompanyId: job.sourceCompanyId, Customer: record.Customer, Tallyserialno: record.Tallyserialno, Mobilenumber: record.Mobilenumber },
    update: [{ $set: set }], upsert: true, timestamps: false,
  } }
}
