import express from "express"
import mongoose from "mongoose"
import { getPincodeData } from "@optiwari.india/pincode-india"
import authMiddleware from "../middleware/authMiddleware.js"
import models from "../model/auth/authSchema.js"
import Customer from "../model/secondaryUser/tallyCustomerSchema.js"
import CustomerCall from "../model/secondaryUser/customerCallSchema.js"
import AssignCustomer from "../model/secondaryUser/assignCustomerSchema.js"
import { TallyImport } from "../model/tallyImportSchema.js"
import { publicJob, stageTallyImport } from "../services/tallyImportService.js"
import { tallyFields } from "../services/tallyRecords.js"
import { TALLY_COMPANY } from "../config/tally.js"

const router = express.Router()
router.use(authMiddleware)
// The current integration is a single configured company and admin-only report.
router.use(async (req, res, next) => {
  try {
    const userId = req.owner?.userId
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(403).json({ message: "Administrator access is required." })
    }
    // Login resolves users from both collections. Staff registration also
    // supports the Admin role; collection membership alone is not the role.
    const adminAccount = await models.Admin.findById(userId).select("role").lean()
    const account = adminAccount || await models.Staff.findById(userId).select("role").lean()
    if (account?.role !== "Admin") {
      return res.status(403).json({ message: "Administrator access is required." })
    }
    req.tallySourceCompanyId = TALLY_COMPANY
    next()
  } catch { res.status(503).json({ message: "Report service is temporarily unavailable." }) }
})
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 50))
    const filter = { sourceCompanyId: req.tallySourceCompanyId }
    if (req.query.after) {
      if (typeof req.query.after !== "string" || !/^[a-f0-9]{24}$/i.test(req.query.after)) return res.status(400).json({ message: "Invalid cursor." })
      filter._id = { $gt: new mongoose.Types.ObjectId(req.query.after) }
    }
    if (req.query.serial) {
      if (typeof req.query.serial !== "string" || req.query.serial.length > 200) return res.status(400).json({ message: "Invalid serial number." })
      filter.Tallyserialno = req.query.serial.trim()
    }
    if (req.query.search !== undefined) {
      if (typeof req.query.search !== "string" || req.query.search.length > 100) {
        return res.status(400).json({ message: "Invalid customer search." })
      }
      const query = req.query.search.trim()
      if (query) {
        const pattern = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        filter.$or = ["name", "Customer", "Contactperson", "Mobilenumber", "ContactNumber", "Emailid", "Tallyserialno"]
          .map(field => ({ [field]: { $regex: pattern, $options: "i" } }))
      }
    }
    const projection = Object.fromEntries(tallyFields.map(field => [field, 1]))
    projection.Customer = { $ifNull: ["$name", "$Customer"] }
    // Keep GST visible for rows imported before the agreed field capitalization.
    projection.Gstno = { $ifNull: ["$Gstno", "$gstNo"] }
    const rows = await Customer.find(filter).select(projection).sort({ _id: 1 }).limit(limit + 1).lean()
    const hasMore = rows.length > limit
    const data = rows.slice(0, limit)
    const assignments = await AssignCustomer.find({ _id: { $in: data.map(row => row._id) } })
      .select("_id staffId").populate({ path: "staffId", select: "name" }).lean()
    const assignmentByCustomerId = new Map(assignments.map(assignment => [
      String(assignment._id), assignment.staffId?.name || "Assigned staff",
    ]))
    for (const customer of data) {
      const assignedTo = assignmentByCustomerId.get(String(customer._id))
      if (assignedTo) customer.assignedTo = assignedTo
    }
    res.json({ data, nextCursor: hasMore ? String(data[data.length - 1]._id) : null })
  } catch { res.status(503).json({ message: "Report service is temporarily unavailable." }) }
})
const indiaOffset = (5 * 60 + 30) * 60 * 1000

function callSummaryDateRange(period, date) {
  // Use UTC calendar arithmetic on the India-local date.
  const start = new Date(Date.now() + indiaOffset)
  start.setUTCHours(0, 0, 0, 0)

  switch (period) {
    case "today": break
    case "yesterday": start.setUTCDate(start.getUTCDate() - 1); break
    case "this-week": start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7); break
    case "this-month": start.setUTCDate(1); break
    case "month":
    case "date": {
      const pattern = period === "month" ? /^\d{4}-\d{2}$/ : /^\d{4}-\d{2}-\d{2}$/
      if (typeof date !== "string" || !pattern.test(date)) return null
      const day = period === "month" ? `${date}-01` : date
      start.setTime(Date.parse(`${day}T00:00:00Z`))
      if (!Number.isFinite(start.getTime()) || start.toISOString().slice(0, 10) !== day) return null
      break
    }
    default: return null
  }

  const end = new Date(start)
  if (period === "month" || period === "this-month") end.setUTCMonth(end.getUTCMonth() + 1)
  else end.setUTCDate(end.getUTCDate() + (period === "this-week" ? 7 : 1))

  return { $gte: new Date(start.getTime() - indiaOffset), $lt: new Date(end.getTime() - indiaOffset) }
}

router.get("/call-summary", async (req, res) => {
  try {
    const { period = "all", date } = req.query
    const pipeline = []
    if (period !== "all") {
      const range = callSummaryDateRange(period, date)
      if (!range) return res.status(400).json({ message: "Choose a valid date filter." })
      pipeline.push({ $match: { createdAt: range } })
    }
    pipeline.push({ $group: { _id: { staffId: "$staffId", outcome: "$outcome" }, count: { $sum: 1 } } })
    const [staff, counts] = await Promise.all([
      models.Staff.find().select("name").sort({ name: 1, _id: 1 }).lean(),
      CustomerCall.aggregate(pipeline),
    ])
    const staffRows = new Map(staff.map(member => [
      String(member._id), { ...member, total: 0, outcomes: {} },
    ]))
    const totals = { total: 0, outcomes: {} }
    for (const { _id: { staffId, outcome }, count } of counts) {
      const row = staffRows.get(String(staffId))
      if (!row) continue
      row.total += count
      row.outcomes[outcome] = count
      totals.total += count
      totals.outcomes[outcome] = (totals.outcomes[outcome] || 0) + count
    }
    res.json({ staff: [...staffRows.values()], totals })
  } catch {
    res.status(503).json({ message: "Unable to load the call summary." })
  }
})

router.get("/staff", async (req, res) => {
  try {
    const data = await models.Staff.find().select("name").sort({ name: 1, _id: 1 }).lean()
    res.json({ data })
  } catch { res.status(503).json({ message: "Unable to load staff." }) }
})

router.post("/assign", async (req, res) => {
  const { start, end, customerIds = [], staffId } = req.body || {}
  const isId = value => typeof value === "string" && /^[a-f0-9]{24}$/i.test(value)
  const isSerial = value => typeof value === "string" && /^\d{1,200}$/.test(value)
  if (!isId(staffId) || !Array.isArray(customerIds) || !customerIds.every(isId)) {
    return res.status(400).json({ message: "Select a staff member and valid customers." })
  }
  const selectors = []
  if (start !== undefined || end !== undefined) {
    if (!isSerial(start) || !isSerial(end) || BigInt(start) > BigInt(end)) {
      return res.status(400).json({ message: "Enter a valid start and end serial number in ascending order." })
    }
    selectors.push({ Tallyserialno: { $regex: /^\d+$/, $gte: start, $lte: end } })
  }
  if (customerIds.length) selectors.push({ _id: { $in: customerIds } })
  if (!selectors.length) return res.status(400).json({ message: "Select customers or enter a serial range." })

  let assigned = 0
  try {
    if (!await models.Staff.exists({ _id: staffId })) {
      return res.status(404).json({ message: "Staff member was not found." })
    }
    const customers = Customer.find({ sourceCompanyId: req.tallySourceCompanyId, $or: selectors })
      .collation({ locale: "en", numericOrdering: true })
      .select("_id").sort({ _id: 1 }).lean().cursor()
    await customers.eachAsync(async batch => {
      await AssignCustomer.bulkWrite(batch.map(({ _id }) => ({
        updateOne: {
          filter: { _id },
          update: { $set: { staffId, assignedBy: req.owner.userId } },
          upsert: true,
        },
      })))
      assigned += batch.length
    }, { batchSize: 500 })
    if (!assigned) return res.status(404).json({ message: "No matching customers found." })
    res.json({ assigned })
  } catch {
    res.status(503).json({ message: "Allocation could not finish. Retry the same selection to complete it." })
  }
})

const taxStates = {
  "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab",
  "04": "Chandigarh", "05": "Uttarakhand", "06": "Haryana", "07": "Delhi",
  "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim",
  "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur",
  "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam",
  "19": "West Bengal", "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh",
  "23": "Madhya Pradesh", "24": "Gujarat", "26": "Dadra and Nagar Haveli and Daman and Diu",
  "27": "Maharashtra", "29": "Karnataka", "30": "Goa", "31": "Lakshadweep",
  "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry",
  "35": "Andaman and Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh",
}

function stateFromTaxNumber(number) {
  const prefix = number.slice(0, 2)
  if (/^\d{11}$/.test(number)) {
    if (prefix === "25") return "Daman and Diu"
    if (prefix === "26") return "Dadra and Nagar Haveli"
    if (prefix === "28") return "Andhra Pradesh"
    return taxStates[prefix]
  }
  if (/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i.test(number)) {
    return prefix === "38" ? "Ladakh" : taxStates[prefix]
  }
}

function enrichExcelCustomer(record) {
  if (record.Country && record.Country.toLowerCase() !== "india") return record
  const postal = /^[1-9]\d{5}$/.test(record.Pincode) ? getPincodeData(record.Pincode) : null
  const postalState = postal?.state?.toLowerCase().replace(/\b[a-z]/g, letter => letter.toUpperCase())
  const useDefault = !record.Pincode && !record.tin && !record.Gstno
  const inferredState = postalState || stateFromTaxNumber(record.tin) || stateFromTaxNumber(record.Gstno) || (useDefault ? "Kerala" : "")
  record.State ||= inferredState
  if (inferredState) record.Country ||= "India"
  record.location ||= postal?.district || ""
  return record
}

router.post("/imports", (req, res) => {
  if (!Array.isArray(req.body?.data) || !req.body.data.length || req.body.data.length > 10000) {
    return res.status(400).json({ message: "Provide 1 to 10,000 Excel customer rows." })
  }
  req.tallyIntegration = { sourceCompanyId: req.tallySourceCompanyId }
  return stageTallyImport(req, res, [Buffer.from(JSON.stringify(req.body))], enrichExcelCustomer)
})

router.get("/imports", async (req, res) => {
  try {
    const jobs = await TallyImport.find({ sourceCompanyId: req.tallySourceCompanyId }).sort({ createdAt: -1 }).limit(10).lean()
    res.json({ data: jobs.map(publicJob) })
  } catch { res.status(503).json({ message: "Report service is temporarily unavailable." }) }
})
export default router
