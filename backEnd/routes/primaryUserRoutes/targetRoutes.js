import express from "express"
import authMiddleware from "../../middleware/authMiddleware.js"
import { getLeadAssignments, updateLeadAssignment } from "../../controller/primaryUserController/leadAssignmentController.js"

import { createOrUpdateTargetConfiguration,getTargetConfigurations,gettargetResult,deleteTargetConfiguration,getIncentiveReport,getIncentiveLeads } from "../../controller/primaryUserController/targetController.js"
const router = express.Router()
router.get("/leads/:leadId/assignments", authMiddleware, getLeadAssignments)
router.patch("/leads/:leadId/assignments/:assignmentId", authMiddleware, updateLeadAssignment)
router.get("/getregisteredTarget",authMiddleware,getTargetConfigurations)
router.get("/gettargetresult",authMiddleware,gettargetResult)
router.get("/getIncentiveReport",authMiddleware,getIncentiveReport)
router.get("/getIncentiveLeads",authMiddleware,getIncentiveLeads)
router.post("/createOrUpdateTargetConfiguration", authMiddleware, createOrUpdateTargetConfiguration)
router.delete("/deleteTargetConfiguration",authMiddleware,deleteTargetConfiguration)
export default router
