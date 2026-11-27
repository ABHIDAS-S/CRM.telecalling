import express from "express"
import mongoose from "mongoose"
import authMiddleware from "../middleware/authMiddleware.js"
import models from "../model/auth/authSchema.js"
import AssignCustomer from "../model/secondaryUser/assignCustomerSchema.js"
import Customer from "../model/secondaryUser/tallyCustomerSchema.js"
import CustomerCall, { callOutcomes } from "../model/secondaryUser/customerCallSchema.js"
import { TALLY_COMPANY } from "../config/tally.js"

const router = express.Router()
const isId = value => typeof value === "string" && /^[a-f0-9]{24}$/i.test(value)
const pageSize = 50
const noCallsOutcome = "Not Yet Called"
const customerFields = "_id Customer Company Contactperson Mobilenumber ContactNumber Emailid Address address2 address3 location State Pincode Tallyserialno"

router.use(authMiddleware, async (req, res, next) => {
  try {
    if (!isId(req.owner?.userId) || !await models.Staff.exists({ _id: req.owner.userId })) {
      return res.status(403).json({ message: "A staff account is required." })
    }
    next()
  } catch {
    res.status(503).json({ message: "Unable to verify your staff account." })
  }
})

router.get("/", async (req, res) => {
  const after = req.query.after
  if (after !== undefined && !isId(after)) return res.status(400).json({ message: "Invalid customer cursor." })
  try {
    const scope = { staffId: req.owner.userId }
    const filter = after ? { ...scope, _id: { $gt: after } } : scope
    const [total, assignments] = await Promise.all([
      AssignCustomer.countDocuments(scope),
      AssignCustomer.find(filter).select("_id").sort({ _id: 1 }).limit(pageSize + 1).lean(),
    ])
    const page = assignments.slice(0, pageSize)
    const customers = await Customer.find({ _id: { $in: page.map(row => row._id) }, sourceCompanyId: TALLY_COMPANY })
      .select(customerFields).select({ name: 1 }).sort({ _id: 1 }).lean()
    for (const customer of customers) customer.Customer = customer.name || customer.Customer
    res.json({ data: customers, total, outcomes: callOutcomes, nextCursor: assignments.length > pageSize ? page.at(-1)._id : null })
  } catch {
    res.status(503).json({ message: "Unable to load your assigned customers." })
  }
})

router.get("/calls", async (req, res) => {
  const { outcome, before } = req.query
  if ((outcome !== undefined && outcome !== noCallsOutcome && !callOutcomes.includes(outcome)) ||
      (before !== undefined && (!outcome || !isId(before)))) {
    return res.status(400).json({ message: "Invalid call history filter." })
  }
  try {
    const staffId = new mongoose.Types.ObjectId(req.owner.userId)
    const [counts, calledCustomerIds] = await Promise.all([
      CustomerCall.aggregate([{ $match: { staffId } }, { $group: { _id: "$outcome", count: { $sum: 1 } } }]),
      CustomerCall.distinct("customerId", { staffId }),
    ])
    const noCallScope = { staffId, ...(calledCustomerIds.length ? { _id: { $nin: calledCustomerIds } } : {}) }
    const noCallCount = await AssignCustomer.countDocuments(noCallScope)
    const calls = outcome === noCallsOutcome
      ? await AssignCustomer.find({ ...noCallScope, ...(before ? { _id: { $lt: before } } : {}) })
        .select("_id").sort({ _id: -1 }).limit(pageSize + 1).lean()
      : outcome ? await CustomerCall.find({ staffId, outcome, ...(before ? { _id: { $lt: before } } : {}) })
        .select("customerId outcome followUpDate remarks").sort({ _id: -1 }).limit(pageSize + 1).lean()
      : []
    const page = calls.slice(0, pageSize)
    const customerIds = page.map(call => outcome === noCallsOutcome ? call._id : call.customerId)
    const customers = await Customer.find({
      _id: { $in: customerIds }, sourceCompanyId: TALLY_COMPANY,
    }).select(customerFields).select({ name: 1 }).lean()
    const customersById = new Map(customers.map(customer => {
      customer.Customer = customer.name || customer.Customer
      return [String(customer._id), customer]
    }))
    const countByOutcome = Object.fromEntries(counts.map(row => [row._id, row.count]))
    countByOutcome[noCallsOutcome] = noCallCount
    res.json({
      counts: countByOutcome,
      data: page.map(call => {
        const customerId = outcome === noCallsOutcome ? call._id : call.customerId
        const customer = customersById.get(String(customerId))
        return {
          ...call,
          customerId,
          outcome: outcome === noCallsOutcome ? noCallsOutcome : call.outcome,
          followUpDate: outcome === noCallsOutcome ? null : call.followUpDate,
          customer,
          customerName: customer?.Contactperson || customer?.Customer || "Customer unavailable",
        }
      }),
      nextCursor: calls.length > pageSize ? page.at(-1)._id : null,
    })
  } catch {
    res.status(503).json({ message: "Unable to load your call history." })
  }
})

router.post("/:customerId/calls", async (req, res) => {
  const { customerId } = req.params
  const { outcome, followUpDate = null, primeAttention = false, remarks = "" } = req.body || {}
  if (!isId(customerId) || !callOutcomes.includes(outcome) || typeof primeAttention !== "boolean" ||
      typeof remarks !== "string" || remarks.trim().length > 4000 ||
      (followUpDate !== null && (typeof followUpDate !== "string" || !Number.isFinite(Date.parse(followUpDate))))) {
    return res.status(400).json({ message: "Enter a valid call outcome, follow-up date and remarks." })
  }
  const staffId = req.owner.userId
  try {
    const [assignment, customer] = await Promise.all([
      AssignCustomer.exists({ _id: customerId, staffId }),
      Customer.exists({ _id: customerId, sourceCompanyId: TALLY_COMPANY }),
    ])
    if (!assignment || !customer) return res.status(404).json({ message: "This customer is no longer assigned to you." })
    const call = await CustomerCall.create({ customerId, staffId, outcome, followUpDate, primeAttention, remarks })
    res.status(201).json({ id: call._id })
  } catch {
    res.status(503).json({ message: "Unable to save call details." })
  }
})

export default router
