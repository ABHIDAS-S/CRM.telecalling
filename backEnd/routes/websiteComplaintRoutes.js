import express from "express";
import crypto from "node:crypto";
import { createWebsiteComplaintController } from "../controller/websiteComplaintController.js";

export function complaintServiceAuth(req, res, next) {
  const secret = process.env.CAMET_COMPLAINT_API_KEY;
  if (!secret || secret.length < 32) return res.status(503).json({ success: false, message: "Complaint integration is not configured." });
  const supplied = req.get("X-Camet-Complaint-Key") || "";
  const digest = value => crypto.createHash("sha256").update(value).digest();
  if (!crypto.timingSafeEqual(digest(secret), digest(supplied))) return res.status(401).json({ success: false, message: "Unauthorized complaint request." });
  next();
}

const router = express.Router();
const controller = createWebsiteComplaintController();
router.use(complaintServiceAuth);
router.post("/check-license", controller.checkLicense);
router.post("/send-otp", controller.sendOtp);
router.post("/verify-otp", controller.verifyOtp);
router.post("/submit", controller.submitComplaint);
export default router;
