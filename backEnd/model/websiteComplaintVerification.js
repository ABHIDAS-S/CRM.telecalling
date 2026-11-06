import mongoose from "mongoose";

const schema = new mongoose.Schema({
  challengeId: { type: String, required: true, unique: true },
  customerid: { type: mongoose.Schema.Types.ObjectId, required: true },
  licenceNumber: Number,
  email: String,
  otpHash: String,
  otpExpiresAt: Date,
  attempts: { type: Number, default: 0 },
  verifiedAt: { type: Date, default: null },
  verifiedUntil: Date,
  verificationHash: String,
  submission: { type: new mongoose.Schema({ contactNumber: String, description: String, callNoteId: String }, { _id: false }), default: null },
  submittedAt: Date,
  notificationStatus: { type: String, default: "pending" },
  notificationStartedAt: Date,
  deleteAfter: { type: Date, expires: 0 }
}, { timestamps: true });

const rateSchema = new mongoose.Schema({ _id: String, count: Number, deleteAfter: { type: Date, expires: 0 } });
export const ComplaintVerification = mongoose.model("WebsiteComplaintVerification", schema);
export const ComplaintRateLimit = mongoose.model("WebsiteComplaintRateLimit", rateSchema);
