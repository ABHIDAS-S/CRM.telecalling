import express from "express"
import mongoose from "mongoose"
import authMiddleware from "../middleware/authMiddleware.js"
import models from "../model/auth/authSchema.js"
import Customer from "../model/secondaryUser/tallyCustomerSchema.js"
import { TallyImport } from "../model/tallyImportSchema.js"
import { publicJob } from "../services/tallyImportService.js"
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
    const projection = Object.fromEntries(tallyFields.map(field => [field, 1]))
    // Keep GST visible for rows imported before the agreed field capitalization.
    projection.Gstno = { $ifNull: ["$Gstno", "$gstNo"] }
    const rows = await Customer.find(filter).select(projection).sort({ _id: 1 }).limit(limit + 1).lean()
    const hasMore = rows.length > limit
    const data = rows.slice(0, limit)
    res.json({ data, nextCursor: hasMore ? String(data[data.length - 1]._id) : null })
  } catch { res.status(503).json({ message: "Report service is temporarily unavailable." }) }
})
router.get("/imports", async (req, res) => {
  try {
    const jobs = await TallyImport.find({ sourceCompanyId: req.tallySourceCompanyId }).sort({ createdAt: -1 }).limit(10).lean()
    res.json({ data: jobs.map(publicJob) })
  } catch { res.status(503).json({ message: "Report service is temporarily unavailable." }) }
})
export default router
