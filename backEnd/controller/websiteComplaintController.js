import crypto from "node:crypto";
import Customer from "../model/secondaryUser/customerSchema.js";
import License from "../model/secondaryUser/licenseSchema.js";
import CallNote from "../model/secondaryUser/callNotesSchema.js";
import CallRegistration from "../model/secondaryUser/CallRegistrationSchema.js";
import Branch from "../model/primaryUser/branchSchema.js";
import { ComplaintVerification, ComplaintRateLimit } from "../model/websiteComplaintVerification.js";
import { sendComplaintMail } from "../helper/websiteComplaintEmail.js";

const hash = value => crypto.createHash("sha256").update(value).digest("hex");
const fail = (status, message) => Object.assign(new Error(message), { status });
const clean = value => typeof value === "string" ? value.trim() : "";
export const maskEmail = email => {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 1)}***@${domain}`;
};
const licenseValue = value => {
  const text = clean(value);
  if (!/^\d{1,15}$/.test(text) || !Number.isSafeInteger(Number(text)) || Number(text) <= 0) {
    throw fail(400, "Enter a valid licence number (up to 15 digits).");
  }
  return Number(text);
};

// Separate controllers: the staff call-registration endpoint is unchanged.
export function createWebsiteComplaintController({ mail = sendComplaintMail } = {}) {
  const wrap = fn => async (req, res) => {
    res.set("Cache-Control", "no-store");
    try { await fn(req, res); }
    catch (error) {
      if (!error.status) console.error("Website complaint failed:", error.code || error.name);
      res.status(error.status || 503).json({ success: false, message: error.status ? error.message : "Complaint service is temporarily unavailable. Please try again." });
    }
  };

  async function findCustomer(value) {
    const number = licenseValue(value);
    // Check customer records as well as the separate licence index, including tagged licences.
    let matches = await Customer.find({ $or: [
      { "selected.licensenumber": number },
      { "selected.taggeddata.licensenumber": number },
      { "selected.licenseNumbers.licenseNumber": number },
      { "selected.taggedLicenses": String(number) }
    ] }).limit(2).lean();
    if (!matches.length) {
      const license = await License.findOne({ licensenumber: number }).lean();
      const customer = license && await Customer.findById(license.customerName).lean();
      matches = customer ? [customer] : [];
    }
    if (!matches.length) throw fail(404, "No customer found with this licence number. Please check the number or contact Camet support.");
    if (matches.length > 1) throw fail(409, "This licence needs to be checked by Camet support. Please contact us.");
    return { customer: matches[0], number };
  }

  async function verified(body, allowSubmitted = false) {
    const id = clean(body.challengeId);
    const token = clean(body.verificationToken);
    if (!/^[a-f0-9]{64}$/.test(id) || !/^[a-f0-9]{64}$/.test(token)) throw fail(401, "Verify your email before continuing.");
    const challenge = await ComplaintVerification.findOne({ challengeId: id, verificationHash: hash(token) }).lean();
    if (!challenge || !challenge.verifiedAt || (!allowSubmitted || !challenge.submittedAt) && challenge.verifiedUntil <= new Date()) {
      throw fail(401, "Your verification has expired. Please verify your email again.");
    }
    return challenge;
  }

  async function limit(key, max, seconds) {
    const window = Math.floor(Date.now() / (seconds * 1000));
    const doc = await ComplaintRateLimit.findOneAndUpdate({ _id: `${key}:${window}` }, {
      $inc: { count: 1 }, $setOnInsert: { deleteAfter: new Date((window + 2) * seconds * 1000) }
    }, { upsert: true, new: true });
    if (doc.count > max) throw fail(429, "Too many OTP requests. Please wait before trying again.");
  }

  const checkLicense = wrap(async (req, res) => {
    const { customer } = await findCustomer(req.body.licenceNumber);
    res.json({ success: true, exists: true, canSendOtp: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email || ""), message: "Customer found." });
  });

  const sendOtp = wrap(async (req, res) => {
    const { customer, number } = await findCustomer(req.body.licenceNumber);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email || "")) throw fail(422, "No valid email is registered for this customer. Please contact Camet support.");
    await limit(`minute:${customer._id}`, 1, 60);
    await limit(`hour:${customer._id}`, 5, 3600);
    const otp = crypto.randomInt(100000, 1000000).toString();
    const challengeId = crypto.randomBytes(32).toString("hex");
    const challenge = await ComplaintVerification.create({
      challengeId, customerid: customer._id, licenceNumber: number, email: customer.email,
      otpHash: hash(`${challengeId}:${otp}`), otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      deleteAfter: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
    try {
      await mail({ to: customer.email, subject: "Your Camet complaint verification code", text: `Your Camet complaint verification code is ${otp}. It expires in 10 minutes. Do not share this code. If you did not request it, ignore this email.` });
    } catch (error) {
      await ComplaintVerification.deleteOne({ _id: challenge._id });
      throw error;
    }
    await ComplaintVerification.updateMany({ customerid: customer._id, _id: { $ne: challenge._id }, verifiedAt: null }, { $set: { otpExpiresAt: new Date() } });
    res.json({ success: true, challengeId, maskedEmail: maskEmail(customer.email), message: "OTP sent to your registered email.", expiresIn: 600 });
  });

  const verifyOtp = wrap(async (req, res) => {
    const id = clean(req.body.challengeId);
    const otp = clean(req.body.otp);
    if (!/^[a-f0-9]{64}$/.test(id) || !/^\d{6}$/.test(otp)) throw fail(400, "Enter the six-digit OTP sent to your registered email.");
    // Atomic increment also counts concurrent guesses, with at most five attempts.
    const challenge = await ComplaintVerification.findOneAndUpdate({
      challengeId: id, verifiedAt: null, attempts: { $lt: 5 }, otpExpiresAt: { $gt: new Date() }
    }, { $inc: { attempts: 1 } }, { new: true });
    if (!challenge || challenge.otpHash !== hash(`${id}:${otp}`)) throw fail(400, "Invalid or expired OTP. You have at most five attempts; request a new code if needed.");
    const token = crypto.randomBytes(32).toString("hex");
    const updated = await ComplaintVerification.findOneAndUpdate({ _id: challenge._id, verifiedAt: null }, {
      $set: { verifiedAt: new Date(), verifiedUntil: new Date(Date.now() + 15 * 60 * 1000), verificationHash: hash(token) }, $unset: { otpHash: 1 }
    }, { new: true });
    if (!updated) throw fail(400, "This OTP has already been used. Please request another code.");
    const customer = await Customer.findById(challenge.customerid).lean();
    if (!customer || customer.email !== challenge.email) throw fail(401, "Customer details changed. Please start again.");
    const notes = await CallNote.find().select("callNotes").sort({ callNotes: 1 }).lean();
    res.json({ success: true, verificationToken: token, contactNumber: customer.incomingNumber || customer.mobile || customer.landline || "", callNotes: notes });
  });

  async function notify(challenge, reference, customer, body) {
    const lease = await ComplaintVerification.findOneAndUpdate({ _id: challenge._id, $or: [
      { notificationStatus: { $in: ["pending", "failed"] } },
      { notificationStatus: "sending", notificationStartedAt: { $lt: new Date(Date.now() - 120000) } }
    ] }, { $set: { notificationStatus: "sending", notificationStartedAt: new Date() } });
    if (!lease) return challenge.notificationStatus === "sent";
    try {
      const note = await CallNote.findById(body.callNoteId).lean();
      await mail({ to: process.env.COMPLAINT_NOTIFY_EMAIL || "Admin@camet.in", subject: `Website complaint raised - ${reference}`, text: `A complaint was raised on the Camet website.\n\nReference: ${reference}\nCustomer: ${String(customer.customerName || "Customer")}\nLicence: ${challenge.licenceNumber}\nRegistered email: ${challenge.email}\nContact number: ${body.contactNumber}\nCall note: ${note?.callNotes || ""}\nDescription: ${body.description}\n\nThe complaint is saved in CRM call registration with pending status.` });
      await ComplaintVerification.updateOne({ _id: challenge._id }, { $set: { notificationStatus: "sent" } });
      return true;
    } catch (error) {
      console.error("Website complaint notification failed:", error.code || error.name);
      await ComplaintVerification.updateOne({ _id: challenge._id }, { $set: { notificationStatus: "failed" } });
      return false;
    }
  }

  const submitComplaint = wrap(async (req, res) => {
    const challenge = await verified(req.body, true);
    const reference = `WEB-${challenge._id.toString().toUpperCase()}`;
    const customer = await Customer.findById(challenge.customerid).lean();
    if (!customer || customer.email !== challenge.email) throw fail(401, "Customer details changed. Please start again.");
    let payload = challenge.submission;
    if (!payload) {
      const contactNumber = clean(req.body.contactNumber);
      const description = clean(req.body.description);
      const callNoteId = clean(req.body.callNoteId);
      if (!/^[+\d\s()-]{7,20}$/.test(contactNumber) || contactNumber.replace(/\D/g, "").length < 7) throw fail(400, "Enter a valid contact number.");
      if (description.length < 10 || description.length > 5000) throw fail(400, "Enter a description between 10 and 5000 characters.");
      if (!/^[a-f0-9]{24}$/i.test(callNoteId) || !await CallNote.exists({ _id: callNoteId })) throw fail(400, "Select a valid call note.");
      // Persist the first submitted payload. A retry cannot change a saved complaint.
      const locked = await ComplaintVerification.findOneAndUpdate({ _id: challenge._id, submission: null }, {
        $set: { submission: { contactNumber, description, callNoteId } }
      }, { new: true });
      payload = locked?.submission || (await ComplaintVerification.findById(challenge._id).lean()).submission;
    }
    const branch = await Branch.findOne({ branchName: process.env.COMPLAINT_BRANCH_NAME || "CAMET" }).select("branchName").lean();
    if (!branch) throw fail(503, "Complaint routing is not configured. Please contact Camet support.");
    const existing = await CallRegistration.findOne({ customerid: customer._id }).select("_id").lean();
    // Deterministic parent ID prevents concurrent website requests creating duplicate parents.
    const parentId = existing?._id || customer._id;
    await CallRegistration.updateOne({ _id: parentId }, { $setOnInsert: { customerid: customer._id, customerName: String(customer.customerName || "Customer") } }, { upsert: true, runValidators: true });
    const startTime = challenge.createdAt;
    await CallRegistration.updateOne({ _id: parentId, "callregistration._id": { $ne: challenge._id } }, { $push: { callregistration: {
      _id: challenge._id,
      // Website complaints deliberately omit product. It is already optional in the schema.
      license: challenge.licenceNumber, branchName: [branch.branchName],
      timedata: { startTime, token: reference, duration: "0", time: "00:00:00" },
      formdata: { incomingNumber: payload.contactNumber, token: reference, description: `[Website complaint]\n${payload.description}`, callnote: payload.callNoteId, solution: "", status: "pending", attendedBy: [], completedBy: [] }
    } } }, { runValidators: true });
    await Customer.updateOne({ _id: customer._id, callregistration: null }, { $set: { callregistration: parentId } });
    await ComplaintVerification.updateOne({ _id: challenge._id }, { $set: { submittedAt: challenge.submittedAt || new Date() } });
    const notificationSent = await notify(challenge, reference, customer, payload);
    res.status(challenge.submittedAt ? 200 : 201).json({ success: true, reference, notificationSent, message: "Your complaint has been registered successfully." });
  });

  return { checkLicense, sendOtp, verifyOtp, submitComplaint };
}
