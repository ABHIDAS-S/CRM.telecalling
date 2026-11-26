import express from "express"
import tallyAuthMiddleware from "../middleware/tallyAuthMiddleware.js"
import mongoose from "mongoose"
import { TallyImport } from "../model/tallyImportSchema.js"
import { publicJob, receiveTallyImport } from "../services/tallyImportService.js"

const router = express.Router()
router.use(tallyAuthMiddleware)
router.get("/status", (req, res) => {
  res.json({ authenticated: true, sourceCompanyId: req.tallyIntegration.sourceCompanyId })
})
router.post("/imports", receiveTallyImport)
router.get("/imports/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid import ID." })
    const job = await TallyImport.findOne({ _id: req.params.id, sourceCompanyId: req.tallyIntegration.sourceCompanyId }).lean()
    if (!job) return res.status(404).json({ message: "Import not found." })
    res.json(publicJob(job))
  } catch { res.status(503).json({ message: "Import service is temporarily unavailable." }) }
})
router.use((req, res) => {
  res.status(404).json({ message: "Tally endpoint not found." })
})

export default router
