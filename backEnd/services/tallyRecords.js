const limits = { Customer: 300, Company: 300, Address: 2000, address2: 2000, address3: 2000, State: 150, Country: 150, Pincode: 30, Contactperson: 300, ContactNumber: 100, Mobilenumber: 100, Emailid: 320, Tallyserialno: 200, Gstno: 30, tin: 50, location: 300 }
export const tallyFields = Object.keys(limits)
const aliases = {
  name: "Customer", address1: "Address", pin: "Pincode", email: "Emailid",
  contact: "Contactperson", phone1: "ContactNumber", mobile: "Mobilenumber",
  state: "State", country: "Country",
}

export function normalizeTallyRecord(input, line, { staged = false } = {}) {
  const fail = message => { throw Object.assign(new Error(`Line ${line}: ${message}`), { status: 422 }) }
  if (!input || typeof input !== "object" || Array.isArray(input)) fail("expected an object")
  const record = Object.fromEntries(tallyFields.map(field => [field, ""]))
  const supplied = new Set()
  for (const [key, value] of Object.entries(input)) {
    const field = Object.hasOwn(aliases, key) ? aliases[key] : key
    if (!Object.hasOwn(limits, field)) fail(`unsupported field ${key.slice(0, 60)}`)
    if (supplied.has(field)) fail(`provide only one value for ${field}`)
    if (typeof value !== "string") fail(`${key} must be a string`)
    supplied.add(field)
    record[field] = value.trim()
    if (record[field].length > limits[field]) fail(`${key} exceeds ${limits[field]} characters`)
  }
  const required = staged || Object.hasOwn(input, "name") ? ["Customer"] : ["Customer", "Tallyserialno", "Mobilenumber"]
  for (const field of required) {
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
  const { Customer, Tallyserialno, Mobilenumber, ...details } = record
  const scope = { sourceCompanyId: job.sourceCompanyId, Mobilenumber }
  const filter = Tallyserialno
    ? { ...scope, Customer, Tallyserialno }
    : { ...scope, $or: [{ name: Customer }, { Customer, Tallyserialno: "" }] }
  const identity = Tallyserialno ? { Customer, Tallyserialno } : { name: Customer }
  const values = { ...details, ...scope, ...identity, syncGeneration: job.generation, syncBatch: job.nextBatch, lastImportId: job._id }
  const set = Object.fromEntries(Object.entries(values).map(([field, value]) => [field, { $cond: [apply, { $literal: value }, `$${field}`] }]))
  if (!Tallyserialno) set.Tallyserialno = { $cond: [apply, "$$REMOVE", "$Tallyserialno"] }
  set.createdAt = { $ifNull: ["$createdAt", "$$NOW"] }
  set.updatedAt = { $cond: [apply, "$$NOW", "$updatedAt"] }
  return { updateOne: {
    filter,
    update: [{ $set: set }], upsert: true, timestamps: false,
  } }
}
