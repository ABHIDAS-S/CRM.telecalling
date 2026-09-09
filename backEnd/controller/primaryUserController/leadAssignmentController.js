import LeadMaster from "../../model/primaryUser/leadmasterSchema.js";
import Branch from "../../model/primaryUser/branchSchema.js";
import Task from "../../model/primaryUser/taskSchema.js";
import models from "../../model/auth/authSchema.js";

const { Staff, Admin } = models;
const id = (value) => value ? String(value) : null;
const validId = (value) => typeof value === "string" && /^[a-f\d]{24}$/i.test(value);
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };

// Admin accounts are application-wide in the existing schema (no selected scopes).
// Staff access always requires a matching company AND branch in the same entry.
export async function getAssignmentActor(req) {
  if (!validId(req.owner?.userId)) return null;
  const admin = await Admin.findById(req.owner.userId).select("role").lean();
  if (admin?.role === "Admin") return { ...admin, model: "Admin" };
  const staff = await Staff.findById(req.owner.userId)
    .select("role isVerified permissions selected").lean();
  if (staff?.role === "Staff" && staff.isVerified === true &&
      staff.permissions?.some((permission) => permission.LeadReallocation === true)) {
    return { ...staff, model: "Staff" };
  }
  return null;
}

async function context(req) {
  const actor = await getAssignmentActor(req);
  if (!actor) fail(403, "You do not have permission to correct assignments");
  if (!validId(req.params.leadId)) fail(400, "Invalid lead ID");
  const lead = await LeadMaster.findById(req.params.leadId)
    .select("leadId leadBranch activityLog").lean();
  if (!lead) fail(404, "Lead not found");
  const branch = await Branch.findById(lead.leadBranch).select("companyName").lean();
  if (!branch) fail(404, "Lead branch not found");
  if ((req.cmp_id && id(req.cmp_id) !== id(branch.companyName)) ||
      (actor.model !== "Admin" && !actor.selected?.some((scope) =>
        id(scope.branch_id) === id(branch._id) && id(scope.company_id) === id(branch.companyName)))) {
    fail(403, "You do not have access to this lead's company and branch");
  }
  return { actor, lead, branch };
}

const staffScope = (branch) => ({
  role: "Staff",
  isVerified: true,
  selected: { $elemMatch: { branch_id: branch._id, company_id: branch.companyName } },
});

const snapshot = (record) => ({
  assignedUserId: id(record.taskallocatedTo),
  assignedUserModel: record.taskallocatedToModel || null,
  incentiveUserId: id(record.incentiveAssignedUser),
  incentiveUserModel: record.incentiveAssignedUserModel || null,
  revision: record.assignmentRevision || 0,
});

function handleError(res, error) {
  if (!error.status) console.error("Lead assignment error:", error);
  return res.status(error.status || 500).json({ success: false,
    message: error.status ? error.message : "Unable to update lead assignment" });
}

export async function getLeadAssignments(req, res) {
  try {
    const { lead, branch } = await context(req);
    const records = (lead.activityLog || []).filter((record) => record?._id && (record.taskBy || record.taskId));
    const userIds = [...new Set(records.flatMap((record) =>
      [record.taskallocatedTo, record.submittedUser, record.incentiveAssignedUser].filter(Boolean).map(String)))];
    const taskIds = [...new Set(records.flatMap((record) => [record.taskBy, record.taskId].filter(Boolean).map(String)))];
    const [staff, admins, eligibleStaff, tasks] = await Promise.all([
      Staff.find({ _id: { $in: userIds } }).select("name").lean(),
      Admin.find({ role: "Admin" }).select("name").lean(),
      Staff.find(staffScope(branch)).select("name").sort({ name: 1, _id: 1 }).lean(),
      Task.find({ _id: { $in: taskIds } }).select("taskName").lean(),
    ]);
    const names = new Map([...staff, ...admins].map((user) => [id(user._id), user.name]));
    const taskNames = new Map(tasks.map((task) => [id(task._id), task.taskName]));
    return res.json({ success: true, data: {
      assignments: records.map((record) => ({
        assignmentId: id(record._id),
        label: [taskNames.get(id(record.taskBy)), taskNames.get(id(record.taskId))].filter(Boolean).join(" → ") || "Allocation",
        assignedUserName: names.get(id(record.taskallocatedTo)) || (record.taskallocatedTo ? "Unavailable user" : "Unassigned"),
        incentiveUserName: names.get(id(record.incentiveAssignedUser || record.submittedUser)) || "Unassigned",
        date: record.allocationDate || record.submissionDate,
        completed: Boolean(record.taskClosed || record.followupClosed || record.allocatedClosed),
        expected: snapshot(record),
      })),
      users: [...eligibleStaff.map((user) => ({ userId: id(user._id), name: user.name, model: "Staff" })),
        ...admins.map((user) => ({ userId: id(user._id), name: user.name, model: "Admin" }))],
    } });
  } catch (error) { return handleError(res, error); }
}

export async function updateLeadAssignment(req, res) {
  try {
    const { actor, lead, branch } = await context(req);
    const { assignmentId } = req.params;
    const { userId, userModel, expected } = req.body || {};
    if (!validId(assignmentId) || !validId(userId) || !["Staff", "Admin"].includes(userModel) ||
        !expected || !Number.isSafeInteger(expected.revision) || expected.revision < 0 ||
        !["assignedUserId", "incentiveUserId"].every((key) => expected[key] === null || validId(expected[key])) ||
        !["assignedUserModel", "incentiveUserModel"].every((key) => expected[key] === null || ["Staff", "Admin"].includes(expected[key]))) {
      fail(400, "Valid assignment, replacement user and expected assignment snapshot are required");
    }
    const record = lead.activityLog?.find((entry) => id(entry?._id) === assignmentId);
    if (!record || !(record.taskBy || record.taskId)) fail(404, "Assignment not found on this lead");
    const replacement = userModel === "Staff"
      ? await Staff.findOne({ _id: userId, ...staffScope(branch) }).select("_id").lean()
      : await Admin.findOne({ _id: userId, role: "Admin" }).select("_id").lean();
    if (!replacement) fail(400, "Selected person is not eligible for this branch");
    const current = snapshot(record);
    if (Object.keys(current).some((key) => current[key] !== expected[key])) {
      fail(409, "Assignment changed. Reload the assignments before saving again");
    }
    if (current.assignedUserId === userId && current.assignedUserModel === userModel) {
      return res.json({ success: true, data: { changed: false }, message: "Person is already assigned" });
    }
    const match = {
      _id: record._id,
      taskallocatedTo: expected.assignedUserId,
      taskallocatedToModel: expected.assignedUserModel,
      incentiveAssignedUser: expected.incentiveUserId,
      incentiveAssignedUserModel: expected.incentiveUserModel,
      // Older records have no revision. Missing and zero both mean unedited.
      assignmentRevision: expected.revision === 0 ? { $in: [null, 0] } : expected.revision,
    };
    const result = await LeadMaster.updateOne({
      _id: lead._id, leadBranch: branch._id, activityLog: { $elemMatch: match },
    }, {
      $set: {
        "activityLog.$[assignment].taskallocatedTo": userId,
        "activityLog.$[assignment].taskallocatedToModel": userModel,
        "activityLog.$[assignment].incentiveAssignedUser": userId,
        "activityLog.$[assignment].incentiveAssignedUserModel": userModel,
        "activityLog.$[assignment].assignmentRevision": expected.revision + 1,
      },
      $push: { assignmentCorrections: {
        assignmentId: record._id,
        previousUser: record.taskallocatedTo || null,
        previousUserModel: record.taskallocatedToModel || null,
        previousIncentiveUser: record.incentiveAssignedUser || record.submittedUser || null,
        previousIncentiveUserModel: record.incentiveAssignedUserModel || record.submissiondoneByModel || null,
        newUser: userId, newUserModel: userModel,
        changedBy: actor._id, changedByModel: actor.model, changedAt: new Date(),
      } },
    }, {
      arrayFilters: [Object.fromEntries(Object.entries(match).map(([key, value]) => [`assignment.${key}`, value]))],
      runValidators: true,
    });
    if (!result.matchedCount) fail(409, "Assignment changed. Reload the assignments before saving again");
    return res.json({ success: true, data: { changed: true }, message: "Assigned person updated" });
  } catch (error) { return handleError(res, error); }
}
