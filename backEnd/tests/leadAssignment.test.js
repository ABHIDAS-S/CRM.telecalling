import { test, before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname, resolve, basename } from "node:path";
import net from "node:net";
import { once } from "node:events";
import mongoose from "mongoose";
import express from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import authMiddleware from "../middleware/authMiddleware.js";
import { getLeadAssignments, updateLeadAssignment } from "../controller/primaryUserController/leadAssignmentController.js";
import { getIncentiveLeads, getIncentiveReport } from "../controller/primaryUserController/targetController.js";
import Lead from "../model/primaryUser/leadmasterSchema.js";
import Branch from "../model/primaryUser/branchSchema.js";
import Task from "../model/primaryUser/taskSchema.js";
import Product from "../model/primaryUser/productSchema.js";
import { TargetConfiguration } from "../model/primaryUser/targetSchema.js";
import models from "../model/auth/authSchema.js";
import { incentiveOwnerId, incentiveOwnerModel } from "../helper/incentiveOwner.js";

const { Staff, Admin } = models;
const oid = () => new mongoose.Types.ObjectId();
let mongo, directory, server, base, ids;

before(async () => {
  // Always start a private disposable database. Never read the application .env.
  const portProbe = net.createServer();
  portProbe.listen(0, "127.0.0.1");
  await once(portProbe, "listening");
  const port = portProbe.address().port;
  await new Promise((resolve) => portProbe.close(resolve));
  directory = await mkdtemp(join(tmpdir(), "crm-assignment-test-"));
  mongo = spawn(process.env.MONGOD_BINARY || "mongod", ["--dbpath", directory, "--port", String(port), "--bind_ip", "127.0.0.1", "--quiet"], { windowsHide: true, stdio: "ignore" });
  let spawnError;
  mongo.on("error", (error) => { spawnError = error; });
  let connected = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (spawnError) throw spawnError;
    try {
      await mongoose.connect(`mongodb://127.0.0.1:${port}/assignment_test`, { serverSelectionTimeoutMS: 400, autoIndex: false });
      connected = true; break;
    } catch { await new Promise((resolve) => setTimeout(resolve, 100)); }
  }
  assert.ok(connected, "Private MongoDB did not start");
  process.env.JWT_SECRET_KEY = "isolated-assignment-test-secret";
  const app = express();
  app.use(express.json(), cookieParser());
  app.get("/leads/:leadId/assignments", authMiddleware, getLeadAssignments);
  app.patch("/leads/:leadId/assignments/:assignmentId", authMiddleware, updateLeadAssignment);
  app.get("/details", authMiddleware, getIncentiveLeads);
  app.get("/report", authMiddleware, getIncentiveReport);
  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  if (mongo?.pid && mongo.exitCode === null) {
    const exited = once(mongo, "exit");
    mongo.kill();
    await exited;
  }
  if (directory) {
    assert.equal(dirname(resolve(directory)), resolve(tmpdir()));
    assert.ok(basename(directory).startsWith("crm-assignment-test-"));
    await rm(directory, { recursive: true, force: true });
  }
});

beforeEach(async () => {
  await Promise.all([Lead, Branch, Task, Product, TargetConfiguration, Staff, Admin].map((model) => model.deleteMany({})));
  ids = Object.fromEntries(["lead", "branch", "otherBranch", "company", "otherCompany", "admin", "editor", "old", "replacement", "outsider", "inactive", "task", "otherTask", "first", "second", "product", "category"].map((key) => [key, oid()]));
  await Branch.collection.insertMany([
    { _id: ids.branch, companyName: ids.company, branchName: "Main" },
    { _id: ids.otherBranch, companyName: ids.otherCompany, branchName: "Other" },
  ]);
  await Admin.collection.insertOne({ _id: ids.admin, role: "Admin", name: "Admin" });
  await Staff.collection.insertMany(["editor", "old", "replacement", "outsider", "inactive"].map((key) => ({
    _id: ids[key], role: "Staff", name: key, isVerified: key !== "inactive",
    permissions: [{ LeadReallocation: key === "editor" || key === "outsider" }],
    selected: [{ company_id: key === "outsider" ? ids.otherCompany : ids.company, branch_id: key === "outsider" ? ids.otherBranch : ids.branch }],
  })));
  await Task.collection.insertMany([{ _id: ids.task, taskName: "Demo" }, { _id: ids.otherTask, taskName: "Follow up" }]);
  await Lead.collection.insertOne({
    _id: ids.lead, leadId: "LEAD-TEST", leadBranch: ids.branch, leadDate: new Date("2026-09-08"),
    paymentVerified: true, netAmount: 100, totalPaidAmount: 100, balanceAmount: 0,
    leadFor: [{ productorServiceId: ids.product, productorServicemodel: "Product" }],
    paymentHistory: [{ paymentVerified: true, paymentEntries: [{ productorServiceId: ids.product, productorServicemodel: "Product", receivedAmount: 100 }] }],
    activityLog: [ids.first, ids.second].map((_id) => ({
      _id, taskBy: ids.task, taskallocatedTo: ids.old, taskallocatedToModel: "Staff",
      submittedUser: ids.old, submissiondoneByModel: "Staff", taskClosed: true,
      remarks: "Preserve history", allocationDate: new Date("2026-09-08"),
    })),
  });
});

async function request(path, { actor = "admin", method = "GET", body, company } = {}) {
  const token = actor ? jwt.sign({ userId: String(ids[actor]), ...(company ? { cmp_id: String(company) } : {}) }, process.env.JWT_SECRET_KEY) : null;
  const response = await fetch(`${base}${path}`, { method,
    headers: { "Content-Type": "application/json", ...(token ? { Cookie: `jwt_primary=${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, ...(await response.json()) };
}
const path = () => `/leads/${ids.lead}/assignments`;
async function patchOptions(overrides = {}) {
  const details = await request(path());
  return { method: "PATCH", body: { userId: String(ids.replacement), userModel: "Staff", expected: details.data.assignments[0].expected, ...overrides } };
}

test("authentication and database permissions reject missing auth and ordinary staff", async () => {
  assert.equal((await request(path(), { actor: null })).status, 401);
  assert.equal((await request(path(), { actor: "old" })).status, 403);
  assert.equal((await request(path(), { actor: "editor" })).status, 200);
  const opts = await patchOptions();
  assert.equal((await request(`${path()}/${ids.first}`, { ...opts, actor: "old" })).status, 403);
  assert.equal((await request(`${path()}/${ids.first}`, { ...opts, actor: null })).status, 401);
});

test("company/branch scope is enforced on reads and writes", async () => {
  const opts = await patchOptions();
  for (const scope of [{ actor: "outsider" }, { actor: "admin", company: ids.otherCompany }]) {
    assert.equal((await request(path(), scope)).status, 403);
    assert.equal((await request(`${path()}/${ids.first}`, { ...opts, ...scope })).status, 403);
  }
  // Company and branch must belong to the SAME selected entry.
  await Staff.updateOne({ _id: ids.editor }, { $set: { selected: [
    { company_id: ids.company, branch_id: ids.otherBranch },
    { company_id: ids.otherCompany, branch_id: ids.branch },
  ] } });
  assert.equal((await request(path(), { actor: "editor" })).status, 403);
});

test("editor exposes persistent duplicate task identities and only eligible users", async () => {
  const result = await request(path());
  assert.deepEqual(result.data.assignments.map((item) => item.assignmentId), [String(ids.first), String(ids.second)]);
  assert.equal(result.data.assignments[0].label, result.data.assignments[1].label);
  assert.ok(result.data.users.some((user) => user.userId === String(ids.replacement)));
  assert.ok(!result.data.users.some((user) => [String(ids.outsider), String(ids.inactive)].includes(user.userId)));
  assert.ok(result.data.users.every((user) => Object.keys(user).sort().join() === "model,name,userId"));
});

test("one duplicate allocation changes atomically with an audit; history and other tasks survive", async () => {
  const beforeLead = await Lead.findById(ids.lead).lean();
  const result = await request(`${path()}/${ids.first}`, { ...await patchOptions(), actor: "editor" });
  assert.equal(result.status, 200);
  const lead = await Lead.findById(ids.lead).lean();
  assert.equal(String(lead.activityLog[0].taskallocatedTo), String(ids.replacement));
  assert.equal(String(lead.activityLog[0].submittedUser), String(ids.old));
  assert.equal(lead.activityLog[0].assignmentRevision, 1);
  assert.deepEqual(lead.activityLog[1], beforeLead.activityLog[1]);
  for (const field of ["leadDate", "leadBranch", "netAmount", "paymentHistory", "leadFor"]) assert.deepEqual(lead[field], beforeLead[field]);
  for (const field of ["taskBy", "remarks", "allocationDate", "taskClosed"]) assert.deepEqual(lead.activityLog[0][field], beforeLead.activityLog[0][field]);
  assert.equal(lead.assignmentCorrections.length, 1);
  assert.equal(String(lead.assignmentCorrections[0].changedBy), String(ids.editor));
  assert.equal(String(lead.assignmentCorrections[0].assignmentId), String(ids.first));
  assert.equal(String(lead.assignmentCorrections[0].previousUser), String(ids.old));
  assert.ok(lead.assignmentCorrections[0].changedAt instanceof Date);
});

test("concurrent edits and duplicate submissions allow only one change", async () => {
  const opts = await patchOptions();
  const results = await Promise.all([request(`${path()}/${ids.first}`, opts), request(`${path()}/${ids.first}`, opts)]);
  assert.deepEqual(results.map((result) => result.status).sort(), [200, 409]);
  assert.equal((await request(`${path()}/${ids.first}`, opts)).status, 409);
  assert.equal((await Lead.findById(ids.lead).lean()).assignmentCorrections.length, 1);
});

test("same-person save is a no-op and creates no audit or revision", async () => {
  const result = await request(`${path()}/${ids.first}`, await patchOptions({ userId: String(ids.old) }));
  assert.equal(result.status, 200);
  assert.equal(result.data.changed, false);
  const lead = await Lead.findById(ids.lead).lean();
  assert.equal(lead.assignmentCorrections?.length || 0, 0);
  assert.equal(lead.activityLog[0].assignmentRevision, undefined);
});

test("invalid IDs, unknown records, missing or ineligible users are rejected without writes", async () => {
  assert.equal((await request("/leads/bad/assignments")).status, 400);
  assert.equal((await request(`/leads/${oid()}/assignments`)).status, 404);
  const opts = await patchOptions();
  assert.equal((await request(`${path()}/${oid()}`, opts)).status, 404);
  for (const userId of ["bad", String(oid()), String(ids.inactive), String(ids.outsider)]) {
    assert.equal((await request(`${path()}/${ids.first}`, { ...opts, body: { ...opts.body, userId } })).status, 400);
  }
  assert.equal((await request(`${path()}/${ids.first}`, { ...opts, body: { ...opts.body, expected: {} } })).status, 400);
  assert.equal((await Lead.findById(ids.lead).lean()).assignmentCorrections?.length || 0, 0);
});

test("incentive details and report move rewards to the corrected owner and preserve formulas", async () => {
  await Lead.updateOne({ _id: ids.lead }, { $set: { "activityLog.$[entry].taskBy": ids.otherTask } }, { arrayFilters: [{ "entry._id": ids.second }] });
  await Product.collection.insertOne({ _id: ids.product, selected: [{ category_id: ids.category }] });
  await TargetConfiguration.collection.insertOne({
    branch: ids.branch, year: 2026, periodName: "September", categoryId: ids.category,
    startDate: new Date("2026-09-01"), endDate: new Date("2026-09-30"),
    allocationValues: [{ allocationId: ids.task, value: 25, incentiveType: "percentage" }], monthlyTargets: [],
  });
  const query = `year=2026&period=September&selectedBranch=${ids.branch}`;
  let report = await request(`/report?${query}`);
  assert.equal(report.data.branches[0].users[0].userId, String(ids.old));
  assert.equal(report.data.summary.totalAmount, 25);
  assert.equal((await request(`${path()}/${ids.first}`, await patchOptions())).status, 200);
  report = await request(`/report?${query}`);
  assert.equal(report.data.branches[0].users[0].userId, String(ids.replacement));
  assert.equal(report.data.summary.totalAmount, 25);
  const oldDetails = await request(`/details?${query}&userId=${ids.old}&allocationId=all`);
  const newDetails = await request(`/details?${query}&userId=${ids.replacement}&allocationId=all`);
  assert.deepEqual(oldDetails.data.leads, []);
  assert.equal(newDetails.data.leads[0].totalAmount, 25);
  const lead = await Lead.findById(ids.lead).lean();
  assert.equal(String(incentiveOwnerId(lead.activityLog[0])), String(ids.replacement));
  assert.equal(incentiveOwnerModel(lead.activityLog[0]), "Staff");
  assert.equal(String(incentiveOwnerId(lead.activityLog[1])), String(ids.old));
});
