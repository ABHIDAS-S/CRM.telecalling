import nodemailer from "nodemailer";
import Branch from "../model/primaryUser/branchSchema.js";

export async function sendComplaintMail({ to, subject, text }) {
  const env = process.env;
  let sender, config;
  if (env.COMPLAINT_SMTP_USER && env.COMPLAINT_SMTP_PASS) {
    sender = env.COMPLAINT_SMTP_USER;
    const port = Number(env.COMPLAINT_SMTP_PORT || 587);
    config = env.COMPLAINT_SMTP_HOST
      ? { host: env.COMPLAINT_SMTP_HOST, port, secure: port === 465 }
      : { service: "gmail" };
    config.auth = { user: sender, pass: env.COMPLAINT_SMTP_PASS };
  } else {
    const branch = await Branch.findOne({ branchName: env.COMPLAINT_BRANCH_NAME || "CAMET" }).select("notificationemail mailpassword").lean();
    if (!branch?.notificationemail || !branch?.mailpassword) throw new Error("Complaint email is not configured");
    sender = branch.notificationemail;
    config = { service: "gmail", auth: { user: sender, pass: branch.mailpassword } };
  }
  const transport = nodemailer.createTransport({ ...config, connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000 });
  try { await transport.sendMail({ from: sender, to, subject, text }); }
  finally { transport.close(); }
}
