import express from "express";
import authMiddleware from "../../middleware/authMiddleware.js";
import {
  LeadRegister,
  BulkLeadRegister,
  BulkCreateAdditionalServiceLeads,
  GetAllservices,
  GetallLead,
  UpadateOrLeadAllocationRegister,
  GetselectedLeadData,
  UpdateLeadfollowUpDate,
  ReopenFollowupAfterClosingFailure,
  UpdateLeadRegister,
  GetownLeadList,
  GetallfollowupList,
  SetDemoallocation,
  GetrepecteduserDemo,
  UpdaeOrSubmitdemofollowByfollower,
  GetdemoleadCount,
  GetrespectedleadTask,
  UpdateOrleadallocationTask,
  UpdateOrSubmittaskByfollower,
  GetallReallocatedLead,
  UpdateLeadTask,
  updateReallocation,
  GetallTask,
  GetalltaskanalysisLeads,
  LeadClosingAmount,
  TaskRegistration,
  TaskDelete,
  TaskEdit,
  Checkexistinglead,
  GetallleadOwned,
  GetlostLeads,
  GetcollectionLeads,
  UpdateCollection,
  UpdatereceivedAmount,
  RejectCollectionPayment,
  UpdatepaymentVerification,
  fixLeadVerifiedField,
  ChecktodeleteTask,
  GetallproductwiseReport,
  GetfollowupsummaryReport,
  Getallsalesfunnels,
  Getdailystaffreport,
  Getalltasktoreport,
  GetallselectedproductFollowup,
  getAlltasktoTarget,
GetleadById,
ApprovedforcefullyClosedTarget,
ReverseforcefullyClosedTarget,
Leadclosing,
Checkduplicatecustomer,
// exportBranchWiseProductUsage,
getBranchwiseMarketingPendingTasks,
getTodayVerifiedCollection,
getverifiedCollectionLeads,
getNotificationData,
RejectTask,
  GetclosedLeads,
  GetResearchAndDevelopmentLeads,
  UpdateResearchAndDevelopmentTask,
  AllocateResearchAndDevelopmentTask,
  TransferResearchAndDevelopmentTask
} from "../../controller/primaryUserController/leadController.js";
const router = express.Router();
// router.get("/export-branch-wise-product-usage",exportBranchWiseProductUsage)
router.get("/getstaffdailyreports", authMiddleware, Getdailystaffreport)
router.get("/getnotificationData",authMiddleware,getNotificationData)
router.get("/closedleads",authMiddleware,GetclosedLeads)
router.get("/getsalesfunnels", authMiddleware, Getallsalesfunnels)
router.get(
  "/branchwise-marketing-pending-tasks",
  authMiddleware,
  getBranchwiseMarketingPendingTasks
)
router.get("/getrespecteddemolead", authMiddleware, GetrepecteduserDemo);
router.get("/getrespectedleadTask", authMiddleware, GetrespectedleadTask);
router.get("/demoleadcount", authMiddleware, GetdemoleadCount);
router.get("/collectionLeads", authMiddleware, GetcollectionLeads);
router.get("/getallLead", authMiddleware, GetallLead);
router.get("/getAllleadowned", authMiddleware, GetallleadOwned); //for getting allleads in own lead page
router.get("/getallreallocatedLead", authMiddleware, GetallReallocatedLead);
router.get("/getalltaskAnalysisLeads", authMiddleware, GetalltaskanalysisLeads);
router.get("/getallLeadFollowUp", authMiddleware, GetallfollowupList);
router.get("/getLeadById",authMiddleware,GetleadById)
router.get("/getallLeadFollowUpforselectedProduct", authMiddleware, GetallselectedproductFollowup)
router.get("/getallServices", authMiddleware, GetAllservices);
router.get("/ownregisteredLead", authMiddleware, GetownLeadList);
router.get("/lostlead", authMiddleware, GetlostLeads);
router.get("/getSelectedLead", authMiddleware, GetselectedLeadData);
router.get("/getalltasktoreport", authMiddleware, Getalltasktoreport)
router.get("/getAlltasktoTarget", authMiddleware, getAlltasktoTarget)
router.get("/getallTask", authMiddleware, GetallTask);
router.get("/rnd-leads", authMiddleware, GetResearchAndDevelopmentLeads);
router.get("/checkexistinglead", authMiddleware, Checkexistinglead);
router.get("/verifiedcollectionLeads",authMiddleware,getverifiedCollectionLeads)
router.get("/getTodayVerifiedCollection",authMiddleware,getTodayVerifiedCollection)
router.get("/getallproductwisereport", authMiddleware, GetallproductwiseReport);
router.get("/getfollowupsummaryReport", authMiddleware, GetfollowupsummaryReport)


router.put("/followupDateUpdate", authMiddleware, UpdateLeadfollowUpDate);
router.put("/reopenFollowupAfterClosingFailure", authMiddleware, ReopenFollowupAfterClosingFailure);
router.put("/leadRegisterUpdate", authMiddleware, UpdateLeadRegister);
router.put("/taskEdit", authMiddleware, TaskEdit);
router.put("/closingleads",authMiddleware,Leadclosing)
router.put("/fix-leadverified", authMiddleware, fixLeadVerifiedField);
router.put("/paymentverification", authMiddleware, UpdatepaymentVerification);
router.put("/paymentunverify",authMiddleware,UpdatepaymentVerification)
router.delete("/taskDelete", authMiddleware, TaskDelete);

router.post("/leadClosingAmount", authMiddleware, LeadClosingAmount);
router.post("/leadAllocation", authMiddleware, UpadateOrLeadAllocationRegister);
router.post("/leadReallocation", authMiddleware, updateReallocation);
router.post("/leadAllocationtask", authMiddleware, UpdateOrleadallocationTask);
router.post("/setdemolead", authMiddleware, SetDemoallocation);
router.post("/leadRegister", authMiddleware, LeadRegister);
router.post("/bulkLeadRegister", authMiddleware, BulkLeadRegister);
router.post("/bulkAdditionalServiceLeads", authMiddleware, BulkCreateAdditionalServiceLeads);
router.post("/collectionUpdate", authMiddleware, UpdateCollection);
router.post("/updatereceivedAmount", authMiddleware, UpdatereceivedAmount);
router.post("/rejectCollectionPayment", authMiddleware, RejectCollectionPayment);
router.post("/taskRegistration", authMiddleware, TaskRegistration);
router.post("/taskSubmission", authMiddleware, UpdateLeadTask);
router.post("/taskRejection",authMiddleware,RejectTask)
router.post("/check-customer-duplicate",authMiddleware,Checkduplicatecustomer)
router.post(
  "/demosubmitbyfollower",
  authMiddleware,
  UpdaeOrSubmitdemofollowByfollower
);
router.post(
  "/tasksubmitbyfollower",
  authMiddleware,
  UpdateOrSubmittaskByfollower
);
router.post("/approveforcefullyclosetarget",authMiddleware,ApprovedforcefullyClosedTarget)
router.post("/reverseforcefullyclosetarget",authMiddleware,ReverseforcefullyClosedTarget)
router.post("/rnd-allocation", authMiddleware, AllocateResearchAndDevelopmentTask)
router.post("/rnd-task-update", authMiddleware, UpdateResearchAndDevelopmentTask)
router.post("/rnd-task-transfer", authMiddleware, TransferResearchAndDevelopmentTask)

export default router;
