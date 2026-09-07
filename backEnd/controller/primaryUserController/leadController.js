import LeadMaster from "../../model/primaryUser/leadmasterSchema.js";
import Partner from "../../model/secondaryUser/partnerSchema.js";
import Product from "../../model/primaryUser/productSchema.js"
import { isValidObjectId } from "mongoose";
import util from "util";
import Holymaster from "../../model/secondaryUser/holydaymasterSchema.js";
import QuarterlyAchiever from "../../model/primaryUser/quarterlyAchieversSchema.js";
import YearlyAchiever from "../../model/primaryUser/yearylyAchieversSchema.js";
import mongoose from "mongoose";
import models from "../../model/auth/authSchema.js";
const { Staff, Admin } = models;
import LeaveRequest from "../../model/primaryUser/leaveRequestSchema.js";
import Customer from "../../model/secondaryUser/customerSchema.js";
import Task from "../../model/primaryUser/taskSchema.js";

import LeadId from "../../model/primaryUser/leadIdSchema.js";
import Service from "../../model/primaryUser/servicesSchema.js";
import getLeadMetricsForSingleDay from "../../helper/leadandtaskcount.js";
import { getCallMetricsForSingleDay } from "../../helper/callcount.js";
import { formatDate } from "../../../frontend/src/utils/dateUtils.js";
import License from "../../model/secondaryUser/licenseSchema.js";

////


import Branch from "../../model/primaryUser/branchSchema.js";
import CallRegistration from "../../model/secondaryUser/CallRegistrationSchema.js";

//////




// const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const toIdString = (v) => {
  if (!v) return null;
  if (typeof v === "string") return v;
  if (v instanceof mongoose.Types.ObjectId) return v.toString();
  if (typeof v === "object" && v._id) return String(v._id);
  return String(v);
};

const uniqueIds = (values = []) => [...new Set(values.filter(Boolean).map(String))];

const addEndOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const batchFetchByModel = async (modelName, ids, select = "name") => {
  if (!modelName || !mongoose.models[modelName] || !ids?.length) return new Map();
  const Model = mongoose.model(modelName);
  const docs = await Model.find({ _id: { $in: ids } }).select(select).lean();
  return new Map(docs.map((doc) => [String(doc._id), doc]));
};


export const GetallfollowupList = async (req, res) => {
  try {
    const {
      loggeduserid,
      branchSelected,
      role,
      pendingfollowup,
      viewmode,
      startDate,
      endDate,
      header,
      from = null,
    } = req.query;
// await Customer.updateMany(
//   {
//     "selected.product_id": ObjectId("66fbcf92461da9401f1cb821")
//   },
//   {
//     $set: {
//       "selected.$[product].product_id": ObjectId(67777960368e039b61196ef2)
//     }
//   },
//   {
//     arrayFilters: [
//       {
//         "product.product_id": ObjectId("66fbcf92461da9401f1cb821")
//       }
//     ]
//   }
// )
await Customer.updateMany(
  {
    "selected.product_id": new mongoose.Types.ObjectId(
      "66fbcfb7461da9401f1cb836"
    ),
  },
  {
    $set: {
      "selected.$[product].product_id": new mongoose.Types.ObjectId(
        "67777960368e039b61196ef2"
      ),
    },
  },
  {
    arrayFilters: [
      {
        "product.product_id": new mongoose.Types.ObjectId(
          "66fbcfb7461da9401f1cb836"
        ),
      },
    ],
  }
);

    if (!isValidObjectId(loggeduserid) || !isValidObjectId(branchSelected)) {
      return res.status(400).json({
        message: "Invalid loggeduserid or branchSelected",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(loggeduserid);
    const branchObjectId = new mongoose.Types.ObjectId(branchSelected);

    const parsedStart = startDate ? new Date(startDate) : null;
    const parsedEnd = endDate ? addEndOfDay(endDate) : null;

    const start =
      parsedStart && !Number.isNaN(parsedStart.getTime()) ? parsedStart : null;

    const end = parsedEnd && !Number.isNaN(parsedEnd.getTime()) ? parsedEnd : null;

    const isViewMode = viewmode === "true";
    const hasValidHeader = Boolean(
      header && header !== "null" && header !== "undefined"
    );
    const hasValidDates = Boolean(start && end);
    console.log("hasvalidates", hasValidDates)
    const hasFrom = Boolean(from && from !== "null" && from !== "undefined");
    const isNewMode = isViewMode || hasValidHeader
    const isClosedFollowupMode = pendingfollowup === "false" && !isViewMode;

    let query = {};

    if (isViewMode) {
      const baseElemMatch = {
        taskTo: "followup",
        taskallocatedTo: userObjectId,
        allocationChanged: false,
      };

      query = {
        activityLog: { $elemMatch: baseElemMatch },
        leadBranch: branchObjectId,
      };

      if (header === "Converted") {
        query.leadConvertedDate = hasValidDates
          ? { $ne: null, $gte: start, $lte: end }
          : { $ne: null };
      } else if (header === "Lost Leads" || header === "Lost") {
        query.leadLostDate = hasValidDates
          ? { $ne: null, $gte: start, $lte: end }
          : { $ne: null };
        query.leadLost = true;
      } else if (header === "Total Leads") {
        if (hasValidDates) {
          query.$or = [
            { leadConvertedDate: null, leadLostDate: null },
            { leadConvertedDate: { $gte: start, $lte: end } },
            { leadLostDate: { $gte: start, $lte: end } },
          ];
        }
      } else {
        query.leadConvertedDate = null;
        query.leadLost = false;
      }
    } else if (pendingfollowup === "true") {
      const followupMatch = {
        taskTo: "followup",
        allocationChanged: false,
        allocatedClosed: false,
        taskClosed: false,
        followupClosed: false,
      };

      if (role !== "Admin") {
        followupMatch.$or = [
          { submittedUser: userObjectId },
          { taskallocatedTo: userObjectId },
        ];
      }

      /* Pending report date = follow-up allocation date. */
      if (hasValidDates) {
        followupMatch.submissionDate = { $gte: start, $lte: end };
      }

      query = {
        activityLog: { $elemMatch: followupMatch },
        leadBranch: branchObjectId,
        reallocatedTo: false,
        leadLost: false,
      };
    } else if (pendingfollowup === "false") {
      const followupMatch = {
        taskTo: "followup",
        allocationChanged: false,
        // allocatedClosed: false,
        followupClosed: true,
      };

      if (role !== "Admin") {
        followupMatch.$or = [
          { submittedUser: userObjectId },
          { taskallocatedTo: userObjectId },
        ];
      }



      query = {
        activityLog: { $elemMatch: followupMatch },
        leadBranch: branchObjectId,
        leadLost: false,
      };
      /* Closed report date = actual follow-up closing date. */
      if (hasValidDates) {
        query.leadConvertedDate = hasValidDates
          ? { $ne: null, $gte: start, $lte: end }
          : { $ne: null };
      }
    } else {
      return res.status(400).json({
        message: "pendingfollowup must be true or false",
      });
    }
    // console.log("queryyy", query)
    // console.dir(query, {
    //   depth: null,
    //   colors: true,
    // });
    const selectedfollowup = await LeadMaster.find(query)
      .select([
        "leadId",
        "leadDate",
        "customerName",
        "mobile",
        "phone",
        "email",
        "location",
        "pincode",
        "trade",
        "partner",
        "leadConfirmed",
        "leadClosed",
        "leadClosedDate",
        "leadLostDate",
        "leadConvertedDate",
        "forcefullyClosedTarget",
        "leadLost",
        "leadBranch",
        "dueDate",
        "paymentVerified",
        "source",
        "excessPaidAmount",
        "leadFor",
        "leadBy",
        "leadByModel",
        "taxableAmount",
        "taxAmount",
        "netAmount",
        "discountAmount",
        "balanceAmount",
        "totalPaidAmount",
        "remark",
        "paymentHistory",
        "reallocatedTo",
        "activityLog",
        "followupClosed",
        "allocationType",
        "selfAllocationType",
        "selfAllocationDueDate",
        "selfAllocation",
        "taskfromFollowup",
      ].join(" "))
      .populate({
        path: "customerName",
        model: Customer,
        options: { lean: true },
      })
      .populate({
        path: "partner",
        model: Partner,
        options: { lean: true },
      })
      .lean();
    console.log("selecefolloowp", selectedfollowup.length)

    const followupLeads = [];
    const leadByBuckets = {};
    const allocatedToBuckets = {};
    const allocatedByBuckets = {};
    const submittedUserBuckets = {};
    const taskIds = new Set();
    const taskByIds = new Set();
    const leadForBuckets = {};
    const paymentEntryBuckets = {};
    const receivedByBuckets = {};
    const preprocessedLeads = [];

    const isDateInRange = (value) => {
      if (!hasValidDates) return true;
      if (!value) return false;

      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return false;

      return date >= start && date <= end;
    };

    for (const lead of selectedfollowup) {
      const activity = Array.isArray(lead.activityLog)
        ? lead.activityLog.filter(Boolean)
        : [];

      let matchedAllocations = activity
        .map((item, index) => ({ ...item, index }))
        .filter((item) => {
          if (item.taskTo !== "followup") return false;
          if (item.allocationChanged !== false) return false;

          /*
            In normal closed-follow-up mode, use followupClosedDate.
            submissionDate is the original allocation date and must not be
            used for a closed report date range.
          */
          // if (isClosedFollowupMode) {
          //   if (item.taskClosed !== true || item.followupClosed !== true) {
          //     return false;
          //   }

          //   return isDateInRange(item.followupClosedDate);
          // }

          /*
            Pending follow-up report date = assignment/submission date.
            View/dashboard mode retains its original submission-date behavior.
          */
          if (isNewMode && !hasFrom && hasValidDates) {
            return isDateInRange(item.submissionDate);
          }

          return true;
        });
      console.log("length", matchedAllocations.length)
      if (matchedAllocations.length === 0) continue;
      console.log("matcchedallocationsss", matchedAllocations)
      const lastAlloc = matchedAllocations[matchedAllocations.length - 1];
      const lastIndex = lastAlloc.index;

      if (isNewMode) {
        if (header === "Pending") {
          if (lead.leadConvertedDate || lead.leadLostDate || lead.leadLost) {
            continue;
          }
        }

        if (header === "Converted") {
          if (!lead.leadConvertedDate) continue;
          if (!isDateInRange(lead.leadConvertedDate)) continue;
        }

        if (header === "Lost" || header === "Lost Leads") {
          if (!lead.leadLostDate) continue;
          if (!isDateInRange(lead.leadLostDate)) continue;
        }
      }

      if (lead.leadByModel && lead.leadBy) {
        leadByBuckets[lead.leadByModel] ||= new Set();
        leadByBuckets[lead.leadByModel].add(String(lead.leadBy));
      }

      if (lastAlloc.taskallocatedToModel && lastAlloc.taskallocatedTo) {
        allocatedToBuckets[lastAlloc.taskallocatedToModel] ||= new Set();
        allocatedToBuckets[lastAlloc.taskallocatedToModel].add(
          String(lastAlloc.taskallocatedTo)
        );
      }

      if (lastAlloc.taskallocatedByModel && lastAlloc.taskallocatedBy) {
        allocatedByBuckets[lastAlloc.taskallocatedByModel] ||= new Set();
        allocatedByBuckets[lastAlloc.taskallocatedByModel].add(
          String(lastAlloc.taskallocatedBy)
        );
      }

      for (const log of activity) {
        if (log.submissiondoneByModel && log.submittedUser) {
          submittedUserBuckets[log.submissiondoneByModel] ||= new Set();
          submittedUserBuckets[log.submissiondoneByModel].add(
            String(log.submittedUser)
          );
        }

        if (log.taskallocatedToModel && log.taskallocatedTo) {
          submittedUserBuckets[log.taskallocatedToModel] ||= new Set();
          submittedUserBuckets[log.taskallocatedToModel].add(
            String(log.taskallocatedTo)
          );
        }

        if (log.taskallocatedByModel && log.taskallocatedBy) {
          submittedUserBuckets[log.taskallocatedByModel] ||= new Set();
          submittedUserBuckets[log.taskallocatedByModel].add(
            String(log.taskallocatedBy)
          );
        }

        if (log.taskId) taskIds.add(String(log.taskId));
        if (log.taskBy) taskByIds.add(String(log.taskBy));
      }

      for (const item of lead.leadFor || []) {
        if (item.productorServicemodel && item.productorServiceId) {
          leadForBuckets[item.productorServicemodel] ||= new Set();
          leadForBuckets[item.productorServicemodel].add(
            String(item.productorServiceId)
          );
        }
      }

      for (const history of lead.paymentHistory || []) {
        if (history.receivedModel && history.receivedBy) {
          receivedByBuckets[history.receivedModel] ||= new Set();
          receivedByBuckets[history.receivedModel].add(
            String(history.receivedBy)
          );
        }

        for (const entry of history.paymentEntries || []) {
          if (entry.productorServicemodel && entry.productorServiceId) {
            paymentEntryBuckets[entry.productorServicemodel] ||= new Set();
            paymentEntryBuckets[entry.productorServicemodel].add(
              String(entry.productorServiceId)
            );
          }
        }
      }

      preprocessedLeads.push({
        lead,
        activity,
        matchedAllocations,
        lastAlloc,
        lastIndex,
      });
    }

    const bucketFetcher = async (buckets, select = "name") => {
      const entries = await Promise.all(
        Object.entries(buckets).map(async ([modelName, idsSet]) => {
          const map = await batchFetchByModel(modelName, [...idsSet], select);
          return [modelName, map];
        })
      );

      return new Map(entries);
    };

    const [
      leadByMaps,
      allocatedToMaps,
      allocatedByMaps,
      submittedUserMaps,
      leadForMaps,
      paymentEntryMaps,
      receivedByMaps,
      taskMap,
      taskByMap,
    ] = await Promise.all([
      bucketFetcher(leadByBuckets, "name"),
      bucketFetcher(allocatedToBuckets, "name"),
      bucketFetcher(allocatedByBuckets, "name"),
      bucketFetcher(submittedUserBuckets, "name"),
      bucketFetcher(leadForBuckets, "productName name"),
      bucketFetcher(paymentEntryBuckets, "productName name"),
      bucketFetcher(receivedByBuckets, "name"),
      Task.find({ _id: { $in: [...taskIds] } }).select("taskName").lean(),
      Task.find({ _id: { $in: [...taskByIds] } }).select("taskName").lean(),
    ]);

    const taskIdMap = new Map(taskMap.map((doc) => [String(doc._id), doc]));
    const taskByIdMap = new Map(
      taskByMap.map((doc) => [String(doc._id), doc])
    );

    for (const row of preprocessedLeads) {
      const { lead, activity, lastAlloc, lastIndex } = row;

      const leadBy =
        leadByMaps.get(lead.leadByModel)?.get(String(lead.leadBy)) ||
        lead.leadBy ||
        null;

      const allocatedTo =
        allocatedToMaps
          .get(lastAlloc.taskallocatedToModel)
          ?.get(String(lastAlloc.taskallocatedTo)) || null;

      const allocatedBy =
        allocatedByMaps
          .get(lastAlloc.taskallocatedByModel)
          ?.get(String(lastAlloc.taskallocatedBy)) || null;

      // let populatedActivityLog = activity;


      const populatedActivityLog = activity.map((log) => {
        const submittedUser =
          submittedUserMaps
            .get(log.submissiondoneByModel)
            ?.get(String(log.submittedUser)) || log.submittedUser;

        const taskallocatedTo =
          submittedUserMaps
            .get(log.taskallocatedToModel)
            ?.get(String(log.taskallocatedTo)) || log.taskallocatedTo;

        const taskallocatedBy =
          submittedUserMaps
            .get(log.taskallocatedByModel)
            ?.get(String(log.taskallocatedBy)) || log.taskallocatedBy;

        const taskId = log.taskId
          ? taskIdMap.get(String(log.taskId)) || null
          : null;

        const taskBy = log.taskBy
          ? taskByIdMap.get(String(log.taskBy)) || null
          : null;

        return {
          ...log,
          taskBy,
          submittedUser,
          taskallocatedBy,
          taskallocatedTo,
          taskId,
        };
      });


      const populatedLeadFor = (lead.leadFor || []).map((item) => {
        const populated =
          leadForMaps
            .get(item.productorServicemodel)
            ?.get(String(item.productorServiceId)) || null;

        return {
          ...item,
          productorServiceId: populated,
        };
      });

      const populatedpaymentHistory = (lead.paymentHistory || []).map(
        (history) => {
          const populatedhistory = { ...history };

          if (history.receivedModel && history.receivedBy) {
            populatedhistory.receivedBy =
              receivedByMaps
                .get(history.receivedModel)
                ?.get(String(history.receivedBy)) || null;
          }

          if (Array.isArray(history.paymentEntries)) {
            populatedhistory.paymentEntries = history.paymentEntries.map(
              (entry) => {
                const populatedEntry = { ...entry };

                if (entry.productorServicemodel && entry.productorServiceId) {
                  populatedEntry.productorServiceId =
                    paymentEntryMaps
                      .get(entry.productorServicemodel)
                      ?.get(String(entry.productorServiceId)) || null;
                }

                return populatedEntry;
              }
            );
          }

          return populatedhistory;
        }
      );

      const lastActivity = activity[activity.length - 1] || {};
      let neverfollowuped = false;
      let Nextfollowup = false;
      let allocatedfollowup = false;
      let allocatedTaskClosed = false;

      if (!isNewMode) {
        const lastMatchedClosed = Boolean(lastAlloc.followupClosed);

        if (lastMatchedClosed) {
          neverfollowuped = true;
        } else {
          const afterLogs = activity.slice(lastIndex + 1);
          const foundNextFollowUp = afterLogs.some(
            (log) => Boolean(log.nextFollowUpDate)
          );

          neverfollowuped = foundNextFollowUp
            ? false
            : !lastAlloc.nextFollowUpDate;
        }

        Nextfollowup = Boolean(lastActivity.nextFollowUpDate);
        allocatedfollowup = Boolean(lastActivity.taskfromFollowup);
        allocatedTaskClosed = Boolean(lastActivity.allocatedClosed);
      }

      const leadObject = {
        ...lead,
        leadBy,
        paymentHistory: populatedpaymentHistory,
        originalpaymentHistory: populatedpaymentHistory,
        leadFor: populatedLeadFor,
        allocatedTo,
        allocatedBy,
        matchedlog: lastAlloc,
        // Always return populated activityLog
        activityLog: populatedActivityLog,
        nextFollowUpDate: lastActivity.nextFollowUpDate ?? null,
      };

      if (!isNewMode) {
        // leadObject.activityLog = populatedActivityLog;
        leadObject.neverfollowuped = neverfollowuped;
        leadObject.Nextfollowup = Nextfollowup;
        leadObject.allocatedfollowup = allocatedfollowup;
        leadObject.allocatedTaskClosed = allocatedTaskClosed;
      }

      followupLeads.push(leadObject);
    }

    const ischekCollegueLeads = followupLeads.some(
      (item) =>
        item.allocatedBy?._id?.toString() === userObjectId.toString()
    );

    if (followupLeads.length > 0) {
      return res.status(201).json({
        message: "leadfollowup found",
        data: { followupLeads, ischekCollegueLeads },
      });
    }

    return res.status(200).json({
      message: "leadfollowup not found",
      data: { followupLeads, ischekCollegueLeads },
    });
  } catch (error) {
    console.error("GetallfollowupList error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};//datewise converted leads ,and this is git code

// export const GetallfollowupList = async (req, res) => {
//   try {

//     const deletedata = await LeadMaster.find(
//       {
//         activityLog: { $elemMatch: { $eq: null } }
//       },
//       {
//         leadId: 1,
//         activityLog: 1
//       }
//     )
//     console.log("dateeeeeeeeeeeeeeeeee", deletedata)
//     const {
//       loggeduserid,
//       branchSelected,
//       role,
//       pendingfollowup,
//       viewmode,
//       startDate,
//       endDate,
//       header,
//       from = null,
//     } = req.query;

//     if (!isValidObjectId(loggeduserid) || !isValidObjectId(branchSelected)) {
//       return res.status(400).json({ message: "Invalid loggeduserid or branchSelected" });
//     }

//     const userObjectId = new mongoose.Types.ObjectId(loggeduserid);
//     console.log("userobjectiddd", userObjectId)
//     const branchObjectId = new mongoose.Types.ObjectId(branchSelected);

//     const start = startDate ? new Date(startDate) : null;
//     const end = endDate ? addEndOfDay(endDate) : null;
//     console.log("start", start)
//     console.log("end", end)
//     const isViewMode = viewmode === "true";
//     const hasValidHeader = header && header !== "null" && header !== "undefined";
//     const hasValidDates =
//       startDate &&
//       endDate &&
//       startDate !== "null" &&
//       endDate !== "null" &&
//       startDate !== "undefined" &&
//       endDate !== "undefined";

//     const isNewMode = isViewMode || hasValidHeader || hasValidDates;

//     let query = {};
//     console.log("isviewmodoe", isViewMode)

//     if (isViewMode) {
//       const hasRange = !!(start && end);

//       const baseElemMatch = {
//         taskTo: "followup",
//         taskallocatedTo: userObjectId,
//         allocationChanged: false,
//         // $or: [{ submittedUser: userObjectId }, { taskallocatedTo: userObjectId }],
//         // allocatedClosed: false,
//       };

//       query = {
//         activityLog: { $elemMatch: baseElemMatch },
//         leadBranch: branchObjectId,
//       };
//       console.log("headernamee", header)
//       if (header === "Converted") {
//         // Only leads that actually converted, and — if a date range was given —
//         // only if the conversion itself happened inside that range. Ignores
//         // leadLost entirely since a converted lead can't also be lost.
//         console.log("hasrange", hasRange)
//         query.leadConvertedDate = hasRange
//           ? { $ne: null, $gte: start, $lte: end }
//           : { $ne: null };
//       } else if (header === "Lost Leads" || header === "Lost") {
//         // Symmetric to Converted, but on leadLostDate.
//         query.leadLostDate = hasRange
//           ? { $ne: null, $gte: start, $lte: end }
//           : { $ne: null };
//         query.leadLost = true;
//       } else if (header === "Total Leads") {
//         // Show everything assigned to me, but if a date range is given, a
//         // converted/lost lead should only count in that range if ITS OWN
//         // conversion/loss date falls inside it — a still-pending lead (neither
//         // converted nor lost) is unaffected by the date range and always shows.
//         if (hasRange) {
//           query.$or = [
//             { leadConvertedDate: null, leadLostDate: null }, // still pending
//             { leadConvertedDate: { $gte: start, $lte: end } }, // converted in range
//             { leadLostDate: { $gte: start, $lte: end } }, // lost in range
//           ];
//         }
//         // no range → no extra filter, matches everything ever assigned (as before)
//       } else {
//         // Default / "Pending": only leads that are genuinely still open —
//         // never converted, never lost. Date range doesn't apply here since
//         // there's no conversion/loss event to range-check; the assignment
//         // itself is what matters.
//         query.leadConvertedDate = null;
//         query.leadLost = false;
//       }
//     } else {
//       if (pendingfollowup === "true") {
//         if (role === "Admin") {
//           query = {
//             activityLog: {
//               $elemMatch: {
//                 taskTo: "followup",
//                 allocationChanged: false,
//                 allocatedClosed: false,
//                 taskClosed: false,
//                 followupClosed: false,
//               },
//             },
//             leadBranch: branchObjectId,
//             reallocatedTo: false,
//             leadLost: false,
//           };
//         } else {
//           query = {
//             activityLog: {
//               $elemMatch: {
//                 taskTo: "followup",
//                 $or: [{ submittedUser: userObjectId }, { taskallocatedTo: userObjectId }],
//                 allocationChanged: false,
//                 allocatedClosed: false,
//                 taskClosed: false,
//                 followupClosed: false,
//               },
//             },
//             leadBranch: branchObjectId,
//             reallocatedTo: false,
//             leadLost: false,
//           };
//         }
//       } else if (pendingfollowup === "false") {
//         if (role === "Admin") {
//           query = {
//             activityLog: {
//               $elemMatch: {
//                 taskTo: "followup",
//                 allocationChanged: false,
//                 allocatedClosed: false,
//                 taskClosed: true,
//                 followupClosed: true,
//               },
//             },
//             leadBranch: branchObjectId,
//             leadLost: false,
//           };
//         } else {
//           query = {
//             activityLog: {
//               $elemMatch: {
//                 taskTo: "followup",
//                 $or: [{ submittedUser: userObjectId }, { taskallocatedTo: userObjectId }],
//                 taskClosed: true,
//               },
//             },
//             leadBranch: branchObjectId,
//             leadLost: false,
//           };
//         }
//       }
//     }
//     console.log("quwery", query)
//     const selectedfollowup = await LeadMaster.find(query)
//       .select([
//         "leadId",
//         "leadDate",
//         "customerName",
//         "mobile",
//         "phone",
//         "email",
//         "location",
//         "pincode",
//         "trade",
//         "partner",
//         "leadConfirmed",
//         "leadClosed",
//         "leadClosedDate",
//         "leadLostDate",
//         "leadConvertedDate",
//         "forcefullyClosedTarget",
//         "leadLost",
//         "leadBranch",
//         "dueDate",
//         "paymentVerified",
//         "source",
//         "excessPaidAmount",
//         "leadFor",
//         "leadBy",
//         "leadByModel",
//         "taxableAmount",
//         "taxAmount",
//         "netAmount",
//         "discountAmount",
//         "balanceAmount",
//         "totalPaidAmount",
//         "remark",
//         "paymentHistory",
//         "reallocatedTo",
//         "activityLog",
//         "followupClosed",
//         "allocationType",
//         "selfAllocationType",
//         "selfAllocationDueDate",
//         "selfAllocation",
//         "taskfromFollowup",
//       ].join(" "))
//       .populate({ path: "customerName", model: Customer, options: { lean: true } })
//       .populate({ path: "partner", model: Partner, options: { lean: true } })
//       .lean();
//     // console.log("selectedfollowp",selectedfollowup)
//     // const dddd=selectedfollowup.map((item)=>item.leadId)
//     // console.log("ddddd",dddd)
//     const followupLeads = [];

//     const leadByBuckets = {};
//     const allocatedToBuckets = {};
//     const allocatedByBuckets = {};
//     const submittedUserBuckets = {};
//     const taskIds = new Set();
//     const taskByIds = new Set();
//     const leadForBuckets = {};
//     const paymentEntryBuckets = {};
//     const receivedByBuckets = {};

//     const preprocessedLeads = [];
//     // console.log("selectedfolowps",selectedfollowup)
//     for (const lead of selectedfollowup) {
//       const activity = Array.isArray(lead.activityLog) ? lead.activityLog : [];

//       let matchedAllocations;

//       if (isNewMode) {
//         matchedAllocations = activity
//           .map((item, index) => ({ ...item, index }))
//           .filter((item) => {
//             if (item.taskTo !== "followup") return false;
//             if (item.allocationChanged !== false) return false;
//             if (!item.submissionDate) return false;

//             const hasFrom = from && from !== "null" && from !== "undefined";
//             if (hasFrom) return true;

//             if (start && end) {
//               const subDate = new Date(item.submissionDate);
//               return subDate >= start && subDate <= end;
//             }

//             return true;
//           });
//       } else {
//         matchedAllocations = activity
//           .map((item, index) => ({ ...item, index }))
//           .filter((item) => item.taskTo === "followup");
//       }

//       if (matchedAllocations.length === 0) continue;

//       const lastAlloc = matchedAllocations[matchedAllocations.length - 1];
//       const lastIndex = lastAlloc.index;

//       if (isNewMode) {
//         if (header === "Pending") {
//           if (lead.leadConvertedDate || lead.leadLostDate || lead.leadLost === true) {
//             continue;
//           }
//         }

//         if (header === "Converted") {
//           if (!lead.leadConvertedDate) continue;
//           const convDate = new Date(lead.leadConvertedDate);
//           if (start && end && (convDate < start || convDate > end)) continue;
//         }
//       }

//       if (lead.leadByModel && lead.leadBy) {
//         leadByBuckets[lead.leadByModel] ||= new Set();
//         leadByBuckets[lead.leadByModel].add(String(lead.leadBy));
//       }

//       if (lastAlloc?.taskallocatedToModel && lastAlloc?.taskallocatedTo) {
//         allocatedToBuckets[lastAlloc.taskallocatedToModel] ||= new Set();
//         allocatedToBuckets[lastAlloc.taskallocatedToModel].add(String(lastAlloc.taskallocatedTo));
//       }

//       if (lastAlloc?.taskallocatedByModel && lastAlloc?.taskallocatedBy) {
//         allocatedByBuckets[lastAlloc.taskallocatedByModel] ||= new Set();
//         allocatedByBuckets[lastAlloc.taskallocatedByModel].add(String(lastAlloc.taskallocatedBy));
//       }

//       for (const log of activity) {
//         if (log.submissiondoneByModel && log.submittedUser) {
//           submittedUserBuckets[log.submissiondoneByModel] ||= new Set();
//           submittedUserBuckets[log.submissiondoneByModel].add(String(log.submittedUser));
//         }

//         if (log.taskallocatedToModel && log.taskallocatedTo) {
//           submittedUserBuckets[log.taskallocatedToModel] ||= new Set();
//           submittedUserBuckets[log.taskallocatedToModel].add(String(log.taskallocatedTo));
//         }

//         if (log.taskallocatedByModel && log.taskallocatedBy) {
//           submittedUserBuckets[log.taskallocatedByModel] ||= new Set();
//           submittedUserBuckets[log.taskallocatedByModel].add(String(log.taskallocatedBy));
//         }

//         if (log.taskId) taskIds.add(String(log.taskId));
//         if (log.taskBy) taskByIds.add(String(log.taskBy));
//       }

//       for (const item of lead.leadFor || []) {
//         if (item.productorServicemodel && item.productorServiceId) {
//           leadForBuckets[item.productorServicemodel] ||= new Set();
//           leadForBuckets[item.productorServicemodel].add(String(item.productorServiceId));
//         }
//       }

//       for (const history of lead.paymentHistory || []) {
//         if (history.receivedModel && history.receivedBy) {
//           receivedByBuckets[history.receivedModel] ||= new Set();
//           receivedByBuckets[history.receivedModel].add(String(history.receivedBy));
//         }

//         for (const entry of history.paymentEntries || []) {
//           if (entry.productorServicemodel && entry.productorServiceId) {
//             paymentEntryBuckets[entry.productorServicemodel] ||= new Set();
//             paymentEntryBuckets[entry.productorServicemodel].add(String(entry.productorServiceId));
//           }
//         }
//       }

//       preprocessedLeads.push({ lead, activity, matchedAllocations, lastAlloc, lastIndex });
//     }

//     const bucketFetcher = async (buckets, select = "name") => {
//       const entries = await Promise.all(
//         Object.entries(buckets).map(async ([modelName, idsSet]) => {
//           const map = await batchFetchByModel(modelName, [...idsSet], select);
//           return [modelName, map];
//         })
//       );
//       return new Map(entries);
//     };

//     const [
//       leadByMaps,
//       allocatedToMaps,
//       allocatedByMaps,
//       submittedUserMaps,
//       leadForMaps,
//       paymentEntryMaps,
//       receivedByMaps,
//       taskMap,
//       taskByMap,
//     ] = await Promise.all([
//       bucketFetcher(leadByBuckets, "name"),
//       bucketFetcher(allocatedToBuckets, "name"),
//       bucketFetcher(allocatedByBuckets, "name"),
//       bucketFetcher(submittedUserBuckets, "name"),
//       bucketFetcher(leadForBuckets, "productName name"),
//       bucketFetcher(paymentEntryBuckets, "productName name"),
//       bucketFetcher(receivedByBuckets, "name"),
//       Task.find({ _id: { $in: [...taskIds] } }).select("taskName").lean(),
//       Task.find({ _id: { $in: [...taskByIds] } }).lean(),
//     ]);

//     const taskIdMap = new Map(taskMap.map((doc) => [String(doc._id), doc]));
//     const taskByIdMap = new Map(taskByMap.map((doc) => [String(doc._id), doc]));

//     for (const row of preprocessedLeads) {
//       const { lead, activity, lastAlloc, lastIndex } = row;

//       const leadBy =
//         leadByMaps.get(lead.leadByModel)?.get(String(lead.leadBy)) || lead.leadBy || null;

//       const allocatedTo =
//         allocatedToMaps.get(lastAlloc.taskallocatedToModel)?.get(String(lastAlloc.taskallocatedTo)) ||
//         null;

//       const allocatedBy =
//         allocatedByMaps.get(lastAlloc.taskallocatedByModel)?.get(String(lastAlloc.taskallocatedBy)) ||
//         null;

//       let populatedActivityLog = activity;

//       if (!isNewMode) {
//         populatedActivityLog = activity.map((log) => {
//           const submittedUser =
//             submittedUserMaps.get(log.submissiondoneByModel)?.get(String(log.submittedUser)) ||
//             log.submittedUser;

//           const taskallocatedTo =
//             submittedUserMaps.get(log.taskallocatedToModel)?.get(String(log.taskallocatedTo)) ||
//             log.taskallocatedTo;

//           const taskallocatedBy =
//             submittedUserMaps.get(log.taskallocatedByModel)?.get(String(log.taskallocatedBy)) ||
//             log.taskallocatedBy;

//           const taskId = log.taskId ? taskIdMap.get(String(log.taskId)) || null : null;
//           const taskBy = log.taskBy ? taskByIdMap.get(String(log.taskBy)) || null : null;

//           return {
//             ...log,
//             taskBy,
//             submittedUser,
//             taskallocatedBy,
//             taskallocatedTo,
//             taskId,
//           };
//         });
//       }

//       const populatedLeadFor = (lead.leadFor || []).map((item) => {
//         const populated =
//           leadForMaps.get(item.productorServicemodel)?.get(String(item.productorServiceId)) || null;

//         return {
//           ...item,
//           productorServiceId: populated,
//         };
//       });

//       const populatedpaymentHistory = (lead.paymentHistory || []).map((history) => {
//         const populatedhistory = { ...history };

//         if (history.receivedModel && history.receivedBy) {
//           populatedhistory.receivedBy =
//             receivedByMaps.get(history.receivedModel)?.get(String(history.receivedBy)) || null;
//         }

//         if (Array.isArray(history.paymentEntries)) {
//           populatedhistory.paymentEntries = history.paymentEntries.map((entry) => {
//             const populatedEntry = { ...entry };

//             if (entry.productorServicemodel && entry.productorServiceId) {
//               populatedEntry.productorServiceId =
//                 paymentEntryMaps
//                   .get(entry.productorServicemodel)
//                   ?.get(String(entry.productorServiceId)) || null;
//             }

//             return populatedEntry;
//           });
//         }

//         return populatedhistory;
//       });

//       const lastActivity = activity[activity.length - 1] || {};

//       let neverfollowuped = false;
//       let Nextfollowup = false;
//       let allocatedfollowup = false;
//       let allocatedTaskClosed = false;

//       if (!isNewMode) {
//         const lastMatched = lastAlloc;
//         const lastMatchedClosed = !!lastMatched.followupClosed;

//         if (lastMatchedClosed) {
//           neverfollowuped = true;
//         } else {
//           const afterLogs = activity.slice(lastIndex + 1);
//           const foundNextFollowUp = afterLogs.some((log) => !!log.nextFollowUpDate);

//           if (foundNextFollowUp) {
//             neverfollowuped = false;
//           } else {
//             neverfollowuped = !lastMatched.nextFollowUpDate;
//           }
//         }

//         Nextfollowup = !!lastActivity.nextFollowUpDate;
//         allocatedfollowup = !!lastActivity.taskfromFollowup;
//         allocatedTaskClosed = !!lastActivity.allocatedClosed;
//       }

//       const leadObject = {
//         ...lead,
//         leadBy,
//         paymentHistory: populatedpaymentHistory,
//         leadFor: populatedLeadFor,
//         allocatedTo,
//         allocatedBy,
//         nextFollowUpDate: lastActivity.nextFollowUpDate ?? null,
//       };

//       if (!isNewMode) {
//         leadObject.activityLog = populatedActivityLog;
//         leadObject.neverfollowuped = neverfollowuped;
//         leadObject.Nextfollowup = Nextfollowup;
//         leadObject.allocatedfollowup = allocatedfollowup;
//         leadObject.allocatedTaskClosed = allocatedTaskClosed;
//       }

//       followupLeads.push(leadObject);
//     }

//     const ischekCollegueLeads = followupLeads.some(
//       (item) => item.allocatedBy?._id?.toString() === userObjectId.toString()
//     );

//     if (followupLeads.length > 0) {
//       return res.status(201).json({
//         messge: "leadfollowup found",
//         data: { followupLeads, ischekCollegueLeads },
//       });
//     }

//     return res.status(200).json({
//       message: "leadfollowp not found",
//       data: { followupLeads, ischekCollegueLeads },
//     });
//   } catch (error) {
//     console.log("error:", error.message);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };//new code

// export const exportBranchWiseProductUsage = async (req, res) => {
//   try {
//     const { companyId } = req.query;

//     if (!companyId) {
//       return res.status(400).json({ message: "companyId is required" });
//     }

//     const companyObjectId = new mongoose.Types.ObjectId(companyId);

//     // 1. Load branches for this company
//     const branches = await Branch.find({ companyName: companyObjectId })
//       .select("_id branchName")
//       .lean();

//     if (!branches || branches.length === 0) {
//       return res.status(404).json({ message: "No branches found for company" });
//     }


// const products = await Product.find({
//   selected: {
//     $elemMatch: {
//       company_id: companyObjectId.toString(),
//     },
//   },
// })
//   .select("productName selected")
//   .lean();
// console.log("productsss",products)


// const productsByBranch = new Map();

// for (const product of products) {
//   (product.selected || []).forEach((sel) => {
//     const branchId = String(sel.branch_id || "");

//     if (!productsByBranch.has(branchId)) {
//       productsByBranch.set(branchId, []);
//     }

//     productsByBranch.get(branchId).push({
//       _id: product._id,
//       productName: product.productName,
//       branch_id: sel.branch_id,
//       branchName: sel.branchName,
//       company_id: sel.company_id,
//       companyName: sel.companyName,
//     });
//   });
// }

//     // Prepare workbook
//     // const workbook = new ExcelJS.Workbook();
//     // const sheet = workbook.addWorksheet("Branch Product Usage");

//     // // Column setup (we’ll use simple 3 columns to match your layout)
//     // sheet.columns = [
//     //   { header: "Branch", key: "branch", width: 30 },
//     //   { header: "Type", key: "type", width: 20 },
//     //   { header: "Product", key: "product", width: 50 },
//     // ];

//     // // Helper to add branch section
//     // const addBranchSection = (branchName, usedProducts, unusedProducts) => {
//     //   // Blank row between branches (optional)
//     //   if (sheet.rowCount > 0) {
//     //     sheet.addRow(["", "", ""]);
//     //   }

//     //   // Branch heading
//     //   sheet.addRow([branchName, "", ""]);

//     //   // Used products
//     //   sheet.addRow(["", "Used Products", ""]);
//     //   if (usedProducts.length === 0) {
//     //     sheet.addRow(["", "", "(none)"]);
//     //   } else {
//     //     for (const p of usedProducts) {
//     //       sheet.addRow(["", "", p]);
//     //     }
//     //   }

//     //   // Unused products
//     //   sheet.addRow(["", "Unused Products", ""]);
//     //   if (unusedProducts.length === 0) {
//     //     sheet.addRow(["", "", "(none)"]);
//     //   } else {
//     //     for (const p of unusedProducts) {
//     //       sheet.addRow(["", "", p]);
//     //     }
//     //   }
//     // };
// // ================= Workbook =================
// const workbook = new ExcelJS.Workbook();

// workbook.creator = "CRM";
// workbook.created = new Date();

// const sheet = workbook.addWorksheet("Branch Wise Product Usage", {
//   properties: { defaultRowHeight: 22 },
//   views: [{ showGridLines: false }],
// });

// sheet.columns = [
//   { header: "No", key: "no", width: 8 },
//   { header: "Product Name", key: "product", width: 45 },
// ];
// // Hide all remaining columns
// for (let i = 3; i <= 50; i++) {
//   sheet.getColumn(i).hidden = true;
// }

// // Report Title
// sheet.mergeCells("A1:B1");
// const title = sheet.getCell("A1");
// title.value = "Branch Wise Product Usage Report";
// title.font = {
//   bold: true,
//   size: 18,
//   color: { argb: "FFFFFFFF" },
// };
// title.alignment = {
//   vertical: "middle",
//   horizontal: "center",
// };
// title.fill = {
//   type: "pattern",
//   pattern: "solid",
//   fgColor: { argb: "1F4E78" },
// };

// sheet.getRow(1).height = 30;

// let currentRow = 3;

// // const styleTableHeader = (row) => {
// //   row.font = {
// //     bold: true,
// //     color: { argb: "FFFFFFFF" },
// //   };

// //   row.alignment = {
// //     horizontal: "center",
// //     vertical: "middle",
// //   };

// //   row.fill = {
// //     type: "pattern",
// //     pattern: "solid",
// //     fgColor: { argb: "4472C4" },
// //   };

// //   row.eachCell((cell) => {
// //     cell.border = {
// //       top: { style: "thin" },
// //       left: { style: "thin" },
// //       right: { style: "thin" },
// //       bottom: { style: "thin" },
// //     };
// //   });
// // };

// // const styleDataRow = (row) => {
// //   row.eachCell((cell) => {
// //     cell.border = {
// //       top: { style: "thin", color: { argb: "D9D9D9" } },
// //       left: { style: "thin", color: { argb: "D9D9D9" } },
// //       right: { style: "thin", color: { argb: "D9D9D9" } },
// //       bottom: { style: "thin", color: { argb: "D9D9D9" } },
// //     };

// //     cell.alignment = {
// //       vertical: "middle",
// //       horizontal: cell.col === 1 ? "center" : "left",
// //     };
// //   });
// // };
// const styleTableHeader = (row) => {
//   // Only A and B
//   for (let i = 1; i <= 2; i++) {
//     const cell = row.getCell(i);

//     cell.font = {
//       bold: true,
//       color: { argb: "FFFFFFFF" },
//     };

//     cell.alignment = {
//       horizontal: "center",
//       vertical: "middle",
//     };

//     cell.fill = {
//       type: "pattern",
//       pattern: "solid",
//       fgColor: { argb: "4472C4" },
//     };

//     cell.border = {
//       top: { style: "thin" },
//       left: { style: "thin" },
//       right: { style: "thin" },
//       bottom: { style: "thin" },
//     };
//   }
// };
// // const styleDataRow = (row, fillColor = "FFFFFF") => {
// //   // Fill the entire visible row (A to Q)
// //   for (let i = 1; i <= 17; i++) {
// //     const cell = row.getCell(i);

// //     cell.fill = {
// //       type: "pattern",
// //       pattern: "solid",
// //       fgColor: { argb: fillColor },
// //     };

// //     cell.border = {
// //       top: { style: "thin", color: { argb: "D9D9D9" } },
// //       left: { style: "thin", color: { argb: "D9D9D9" } },
// //       right: { style: "thin", color: { argb: "D9D9D9" } },
// //       bottom: { style: "thin", color: { argb: "D9D9D9" } },
// //     };

// //     cell.alignment = {
// //       vertical: "middle",
// //       horizontal: i === 1 ? "center" : "left",
// //     };
// //   }
// // };
// const styleDataRow = (row) => {
//   for (let i = 1; i <= 2; i++) {
//     const cell = row.getCell(i);

//     cell.border = {
//       top: { style: "thin", color: { argb: "D9D9D9" } },
//       left: { style: "thin", color: { argb: "D9D9D9" } },
//       right: { style: "thin", color: { argb: "D9D9D9" } },
//       bottom: { style: "thin", color: { argb: "D9D9D9" } },
//     };

//     cell.alignment = {
//       vertical: "middle",
//       horizontal: i === 1 ? "center" : "left",
//     };
//   }
// };
// const addBranchSection = (branchName, usedProducts, unusedProducts) => {

//   // Space
//   currentRow++;

//   // Branch Heading
//   sheet.mergeCells(`A${currentRow}:B${currentRow}`);

//   const branchCell = sheet.getCell(`A${currentRow}`);

//   branchCell.value = branchName;

//   branchCell.font = {
//     bold: true,
//     size: 15,
//     color: { argb: "FFFFFF" },
//   };

//   branchCell.fill = {
//     type: "pattern",
//     pattern: "solid",
//     fgColor: { argb: "2F75B5" },
//   };

//   branchCell.alignment = {
//     horizontal: "center",
//     vertical: "middle",
//   };

//   currentRow += 2;

//   // ================= USED =================

//   sheet.mergeCells(`A${currentRow}:B${currentRow}`);

//   const usedHeading = sheet.getCell(`A${currentRow}`);

//   usedHeading.value = "USED PRODUCTS";

//   usedHeading.font = {
//     bold: true,
//     size: 13,
//     color: { argb: "FFFFFF" },
//   };

//   usedHeading.fill = {
//     type: "pattern",
//     pattern: "solid",
//     fgColor: { argb: "70AD47" },
//   };

//   currentRow++;

//   const usedHeader = sheet.getRow(currentRow);
//   usedHeader.values = ["No", "Product Name"];
//   styleTableHeader(usedHeader);

//   currentRow++;

//   if (usedProducts.length) {

//     usedProducts.forEach((name, index) => {

//       const row = sheet.getRow(currentRow);

//       row.values = [index + 1, name];

//       styleDataRow(row);

//       currentRow++;
//     });

//   } else {

//     const row = sheet.getRow(currentRow);

//     row.values = ["", "No Used Products"];

//     styleDataRow(row);

//     currentRow++;
//   }

//   currentRow++;

//   // ================= UNUSED =================

//   sheet.mergeCells(`A${currentRow}:B${currentRow}`);

//   const unusedHeading = sheet.getCell(`A${currentRow}`);

//   unusedHeading.value = "UNUSED PRODUCTS";

//   unusedHeading.font = {
//     bold: true,
//     size: 13,
//     color: { argb: "FFFFFF" },
//   };

//   unusedHeading.fill = {
//     type: "pattern",
//     pattern: "solid",
//     fgColor: { argb: "C00000" },
//   };

//   currentRow++;

//   const unusedHeader = sheet.getRow(currentRow);

//   unusedHeader.values = ["No", "Product Name"];

//   styleTableHeader(unusedHeader);

//   currentRow++;

//   if (unusedProducts.length) {

//     unusedProducts.forEach((name, index) => {

//       const row = sheet.getRow(currentRow);

//       row.values = [index + 1, name];

//       styleDataRow(row);

//       currentRow++;

//     });

//   } else {

//     const row = sheet.getRow(currentRow);

//     row.values = ["", "No Unused Products"];

//     styleDataRow(row);

//     currentRow++;

//   }

//   currentRow += 2;
// };

//     // 3. For each branch, compute used and unused products
//     for (const branch of branches) {
//       const branchIdStr = String(branch._id);
// console.log("branchstr",branchIdStr)
//       // All products for this branch
//       const branchProducts = productsByBranch.get(branchIdStr) || [];
//       const allProductIds = branchProducts.map((p) => String(p._id));

//       // 3a. Used products from CallRegistration
//       // Your CallRegistration sample:
//       // callregistration.formdata.product = Product ObjectId
//       const callRegs = await CallRegistration.find({
//         "callregistration.formdata.product": { $exists: true },
//         "callregistration.branchName": branch.branchName, // adapt if branch is stored differently
//       })
//         .select("callregistration")
//         .lean();

//       const usedFromCalls = new Set();
//       for (const reg of callRegs) {
//         const list = Array.isArray(reg.callregistration) ? reg.callregistration : [];
//         for (const cr of list) {
//           const productId = cr?.product;
//           if (productId) {
//             usedFromCalls.add(String(productId));
//           }
//         }
//       }

//       // 3b. Used products from Customer.selected
//       const customers = await Customer.find({
//         "selected.branch_id": branch._id,
//       })
//         .select("selected")
//         .lean();

//       const usedFromCustomers = new Set();
//       for (const cust of customers) {
//         const selected = Array.isArray(cust.selected) ? cust.selected : [];
//         for (const s of selected) {
//           if (String(s.branch_id || "") === branchIdStr && s.product_id) {
//             usedFromCustomers.add(String(s.product_id));
//           }
//           // Also consider defaultservices/enhanced services if needed
//         }
//       }

//       // 3c. Used products from LeadMaster.leadFor for this branch
//       const leads = await LeadMaster.find({
//         leadBranch: branch._id,

//       })
//         .select("leadFor")
//         .lean();

//       const usedFromLeads = new Set();
//       for (const lead of leads) {
//         const leadFor = Array.isArray(lead.leadFor) ? lead.leadFor : [];
//         for (const lf of leadFor) {
//           if (String(lf.branch_id || "") === branchIdStr && lf.productorServiceId) {
//             usedFromLeads.add(String(lf.productorServiceId));
//           }
//         }
//       }

//       // 3d. Combine used product ids
//       const usedProductIds = new Set([
//         ...usedFromCalls,
//         ...usedFromCustomers,
//         ...usedFromLeads,
//       ]);

//       // 3e. Split used/unused lists based on all branch products
//       const usedProducts = [];
//       const unusedProducts = [];
// console.log("branchproducts",branchProducts)
//       for (const p of branchProducts) {
//         if (usedProductIds.has(String(p._id))) {
//           usedProducts.push(p.productName || "");
//         } else {
//           unusedProducts.push(p.productName || "");
//         }
//       }

//       // 4. Add to Excel sheet
//       addBranchSection(branch.branchName, usedProducts, unusedProducts);
//     }

//     // 5. Send Excel file as response
//     res.setHeader(
//       "Content-Disposition",
//       "attachment; filename=branch_product_usage_report.xlsx"
//     );
//     res.setHeader(
//       "Content-Type",
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
//     );

//     await workbook.xlsx.write(res);
//     res.end();
//   } catch (error) {
//     console.error("exportBranchWiseProductUsage error:", error);
//     return res.status(500).json({
//       message: "Something went wrong while generating unused product report",
//       error: {
//         name: error?.name || "Error",
//         message: error?.message || "Unknown error",
//       },
//     });
//   }
// };


export const LeadRegister = async (req, res) => {
  const session = await mongoose.startSession()

  try {
    const { leadData, selectedtableLeadData, role } = req.body

    const {
      customerName,
      mobile,
      phone,
      email,
      location,
      source,
      pincode,
      remark,
      dueDate,
      taxAmount,
      taxableAmount,
      netAmount,
      partner,
      allocationType = null,
      selfAllocation,
      leadBy,
      leadBranch,
    } = leadData
    const leadDate = new Date()
    const lastLead = await LeadId.findOne().sort({ leadId: -1 }).session(session)

    let newLeadId = "00001"

    if (lastLead) {
      const lastId = parseInt(lastLead.leadId, 10)
      newLeadId = String(lastId + 1).padStart(5, "0")
    }

    let leadByModel = null

    const isStaff = await Staff.findById(leadBy).lean().session(session)

    if (isStaff) {
      leadByModel = "Staff"
    } else {
      const isAdmin = await Admin.findById(leadBy).lean().session(session)
      if (isAdmin) {
        leadByModel = "Admin"
      }
    }

    if (!leadByModel) {
      await session.endSession()
      return res.status(400).json({ message: "Invalid leadBy reference" })
    }

    await session.startTransaction()

    const leadtask = await Task.findOne({ taskName: "Lead" }).session(session)

    let allocationtask = null
    if (allocationType) {
      allocationtask = await Task.findOne({ taskName: "Allocation" }).session(session)
    }

    const activityLog = [
      {
        submissionDate: leadDate,
        submittedUser: leadBy,
        submissiondoneByModel: leadByModel,
        remarks: remark,
        taskBy: leadtask?._id,
      },
    ]

    const allocationName = await Task.findOne({
      taskName: { $regex: new RegExp(`^${allocationType}$`, "i") },
    }).session(session)

    if (allocationType) {
      activityLog.push({
        submissionDate: leadDate,
        submittedUser: leadBy,
        submissiondoneByModel: leadByModel,
        taskallocatedBy: leadBy,
        taskallocatedByModel: leadByModel,
        taskallocatedTo: leadBy,
        taskallocatedToModel: leadByModel,
        remarks: remark,
        taskBy: allocationtask?._id,
        taskTo: allocationName?.taskName.toLowerCase(),
        taskId: allocationName?._id,
        allocationChanged: false,
        followupClosed: false,
        taskfromFollowup: false,
        allocationDate: dueDate,
      })
    }

    const lead = new LeadMaster({
      leadId: newLeadId,
      leadDate,
      customerName,
      mobile,
      phone,
      email,
      location,
      pincode,
      dueDate,
      source,
      partner,
      leadBranch,
      remark,
      leadBy,
      leadByModel,
      taxAmount: Number(taxAmount),
      taxableAmount: Number(taxableAmount),
      netAmount: Number(netAmount),
      balanceAmount: Number(netAmount),
      selfAllocation: selfAllocation,
      ...(allocationType && { allocationType: allocationName?._id }),
      ...(selfAllocation && {
        selfAllocationType: allocationName?._id,
        selfAllocationDueDate: dueDate,
      }),
      activityLog,
    })
    // const filteredLeadData =
    //   selectedtableLeadData?.length > 1
    //     ? selectedtableLeadData.filter(
    //       (item) =>
    //         String(item?.productorservicetype || "").toLowerCase() === "primaryproduct"
    //     )
    //     : selectedtableLeadData
    selectedtableLeadData.forEach((item) =>
      lead.leadFor.push({
        productorServiceId: item.productorServiceId,
        productorServicemodel: item.itemType,
        licenseNumber: item.licenseNumber,
        productPrice: item.productPrice,
        hsn: item.hsn,
        actualHsn: item?.actualHsn,
        productorservicetype: item.productorservicetype,
        netAmount: item.netAmount,
        price: item.price,
        company_id: item.company_id,
        branch_id: item.branch_id,
        licenseNumbers: item?.licenseNumbers
      })
    )

    await lead.save({ session })

    const leadidonly = new LeadId({
      leadId: newLeadId,
      leadBy,
      assignedtoleadByModel: leadByModel,
    })

    await leadidonly.save({ session })

    await Customer.findByIdAndUpdate(
      customerName,
      {
        $set: {
          mobile: mobile,
          landline: phone,
          email: email,
          partner: partner
        },
      },
      { session, new: true }
    )

    await session.commitTransaction()
    await session.endSession()

    return res.status(200).json({
      success: true,
      message: "Lead created successfully",
    })
  } catch (error) {
    await session.abortTransaction()
    await session.endSession()
    console.log("error:", error)
    // return res.status(500).json({ message: "Internal server error",data:error })

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
          : error.message, // or omit this entirely
    });
  }
}
export const Checkexistinglead = async (req, res) => {
  try {
    const { leadData, role, selectedleadlist } = req.query;

    const productIds = selectedleadlist
      .filter(item => item.productorServiceId && item.productorServiceId !== "")
      .map(item => item.productorServiceId);


    const [customerLeads, anyLeads] = await Promise.all([
      LeadMaster.find(
        {
          customerName: leadData.customerName,
          "leadFor.productorServiceId": { $in: productIds },
        },
        { leadFor: 1, customerName: 1, leadId: 1 }
      ).populate({ path: "customerName", select: "customerName" }),

      LeadMaster.exists({ customerName: leadData.customerName }),
    ]);

    const existingProductIds = customerLeads.flatMap((lead) =>
      lead.leadFor.map((item) => item.productorServiceId.toString())
    );
    const duplicateProducts = productIds.filter((id) =>
      existingProductIds.includes(id)
    );

    if (duplicateProducts.length > 0) {
      // Same customer + same product
      return res.status(200).json({
        message: "This customer already has a lead with the same product.",
        exists: true,
        eligible: false,
      });
    } else if (anyLeads) {
      // Same customer + different products
      return res.status(200).json({
        message:
          "This customer already has a lead, but with different product(s).",
        exists: false,
      });
    } else {
      // No lead at all for this customer
      return res.status(200).json({
        message: "No existing lead for this customer. Safe to create new lead.",
        exists: false,
      });
    }
    // return res.status(2001).json({ message: "Already a lead with same product" })
  } catch (error) {
    console.log("error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const getAlltasktoTarget = async (req, res) => {
  try {

    const tasks = await Task.find({});
    if (tasks) {
      return res.status(200).json({ message: "Task found", data: tasks });
    } else {
      return res.status(404).json({ message: "NO tasks found" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
}
export const GetallTask = async (req, res) => {
  try {
    const { istaskregistration = false, removefollowup = false } = req.query
    let query = {}
    if (istaskregistration === "false" || istaskregistration === false) {
      query = { listed: true }
      if (removefollowup === "true" || removefollowup === true) {
        query.taskName = { $ne: "Followup" };
      }
    }
    const tasks = await Task.find(query);
    if (tasks) {
      return res.status(200).json({ message: "Task found", data: tasks });
    } else {
      return res.status(404).json({ message: "NO tasks found" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const TaskDelete = async (req, res) => {
  try {
    const { id } = req.query;
    const result = await Task.findByIdAndDelete({ _id: id });
    if (result) {
      return res.status(200).json({ message: "Deleted successfully" });
    } else {
      return res.status(404).json({ message: "cant deletet" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const TaskEdit = async (req, res) => {
  try {
    const { id } = req.query;
    const formData = req.body;
    const result = await Task.findByIdAndUpdate(
      id,
      { taskName: formData.task },
      { new: true }
    );
    if (result) {
      return res.status(200).json({ message: "Deleted succesfully" });
    } else {
      return res.status(404).json(404).json({ message: "cant find task" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const UpdatereceivedAmount = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { leadDocId, index } = req.query;
    const editedData = req.body;

    const paymentIndex = Number(index);

    const lead = await LeadMaster.findById(leadDocId).session(session);
    if (!lead) throw new Error("Lead not found");

    if (
      Number.isNaN(paymentIndex) ||
      paymentIndex < 0 ||
      paymentIndex >= lead.paymentHistory.length
    ) {
      throw new Error("Invalid payment history index");
    }

    const payment = lead.paymentHistory[paymentIndex];
    if (!payment) throw new Error("Payment record not found");

    const newReceived = Number(editedData.receivedAmount);
    if (Number.isNaN(newReceived) || newReceived < 0) {
      throw new Error("Invalid received amount");
    }

    const oldReceived = Number(payment.receivedAmount || 0);
    const diff = newReceived - oldReceived;

    payment.receivedAmount = newReceived;
    payment.paymentDate = editedData.paymentDate;

    if (Array.isArray(payment.paymentEntries)) {
      if (payment.paymentEntries.length === 1) {
        payment.paymentEntries[0].receivedAmount = newReceived;
      } else {
        const totalOldEntryReceived = payment.paymentEntries.reduce(
          (sum, entry) => sum + Number(entry.receivedAmount || 0),
          0
        );

        payment.paymentEntries.forEach((entry) => {
          const oldEntryReceived = Number(entry.receivedAmount || 0);
          const updatedEntryReceived =
            totalOldEntryReceived > 0
              ? (oldEntryReceived / totalOldEntryReceived) * newReceived
              : 0;

          entry.receivedAmount = Number(updatedEntryReceived.toFixed(2));
        });

        const sumExceptLast = payment.paymentEntries
          .slice(0, -1)
          .reduce((sum, entry) => sum + Number(entry.receivedAmount || 0), 0);

        payment.paymentEntries[payment.paymentEntries.length - 1].receivedAmount =
          Number((newReceived - sumExceptLast).toFixed(2));
      }
    }

    lead.totalPaidAmount = Number(lead.totalPaidAmount || 0) + diff;
    if (lead.totalPaidAmount < 0) {
      lead.totalPaidAmount = 0;
    }

    for (let i = paymentIndex;i < lead.paymentHistory.length;i++) {
      const currentPayment = lead.paymentHistory[i];
      if (!Array.isArray(currentPayment.paymentEntries)) continue;

      for (let j = 0;j < currentPayment.paymentEntries.length;j++) {
        const currentEntry = currentPayment.paymentEntries[j];
        const currentNetAmount = Number(currentEntry.netAmount || 0);
        const currentReceived = Number(currentEntry.receivedAmount || 0);

        if (i === 0) {
          currentEntry.balanceAmount = currentNetAmount - currentReceived;
        } else {
          const prevPayment = lead.paymentHistory[i - 1];

          const prevMatchingEntry = (prevPayment?.paymentEntries || []).find(
            (entry) =>
              String(entry.productorServiceId) ===
              String(currentEntry.productorServiceId)
          );

          const previousBalance = Number(
            prevMatchingEntry?.balanceAmount ?? currentNetAmount
          );

          currentEntry.balanceAmount = previousBalance - currentReceived;
        }

        if (currentEntry.balanceAmount < 0) {
          currentEntry.balanceAmount = 0;
        }
      }

      currentPayment.receivedAmount = (currentPayment.paymentEntries || []).reduce(
        (sum, entry) => sum + Number(entry.receivedAmount || 0),
        0
      );
    }

    const lastPayment = lead.paymentHistory[lead.paymentHistory.length - 1];
    if (lastPayment?.paymentEntries?.length) {
      const totalLastBalance = lastPayment.paymentEntries.reduce(
        (sum, entry) => sum + Number(entry.balanceAmount || 0),
        0
      );
      lead.balanceAmount = totalLastBalance;
    } else {
      lead.balanceAmount = 0;
    }

    if (lead.balanceAmount < 0) {
      lead.balanceAmount = 0;
    }

    await lead.save({ session });
    await session.commitTransaction();

    return res.status(200).json({
      message: "Payment updated successfully",
      data: lead,
    });
  } catch (error) {
    await session.abortTransaction();
    return res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
};
export const UpdatepaymentVerification = async (req, res) => {
  try {
    const {
      leadId,
      index,
      isverified,
      verifiedBy,
      unVerify = false,
    } = req.body;

    // Find lead
    const lead = await LeadMaster.findById(leadId);

    if (!lead) {
      return res.status(404).json({
        message: "Lead not found",
      });
    }

    // Validate index
    if (
      index === undefined ||
      index < 0 ||
      index >= lead.paymentHistory.length
    ) {
      return res.status(400).json({
        message: "Invalid payment index",
      });
    }

    const payment = lead.paymentHistory[index];

    // =========================
    // UNVERIFY PAYMENT
    // =========================
    if (unVerify === true) {
      payment.paymentVerified = false;
      payment.paymentVerifiedBy = null;
      payment.paymentverifiedModel = null;
      payment.verifiedAt = null;
    }

    // =========================
    // VERIFY PAYMENT
    // =========================
    else {
      if (!verifiedBy) {
        return res.status(400).json({
          message: "verifiedBy is required",
        });
      }

      // Find verifier model
      const isStaff = await Staff.exists({ _id: verifiedBy });

      let verifiedModel;

      if (isStaff) {
        verifiedModel = "Staff";
      } else {
        const isAdmin = await Admin.exists({ _id: verifiedBy });

        if (isAdmin) {
          verifiedModel = "Admin";
        }
      }

      if (!verifiedModel) {
        return res.status(400).json({
          message: "Invalid verifier",
        });
      }

      payment.paymentVerified = isverified;
      payment.paymentVerifiedBy = verifiedBy;
      payment.paymentverifiedModel = verifiedModel;
      payment.verifiedAt = new Date();
    }

    // =========================
    // UPDATE OVERALL PAYMENT STATUS
    // =========================

    const allVerified = lead.paymentHistory.every(
      (p) => p.paymentVerified === true
    );

    lead.paymentVerified =
      allVerified &&
      Number(lead.totalPaidAmount) === Number(lead.netAmount);

    await lead.save();

    return res.status(200).json({
      message: unVerify
        ? "Payment unverified successfully"
        : "Payment verified successfully",
    });
  } catch (error) {
    console.error("Update payment verification error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// export const getNotificationData = async (req, res) => {
//   try {
//     const { loggedUser, branchSelected, today = true } = req.query
//     const userObjectId = new mongoose.Types.ObjectId(loggedUser);
//     const branchObjectId = new mongoose.Types.ObjectId(branchSelected);

//     const query = {
//       // leadBranch: branchObjectId,
//       activityLog: {
//         $elemMatch: {
//           taskallocatedTo: userObjectId,
//           allocationChanged: false,
//           taskTo: { $ne: "followup" },
//         },
//       },
//     };

//     const selectedLeads = await LeadMaster.find(query)
//       .populate({
//         path: "customerName",
//         select: "customerName",
//       })
//       .lean();
//     console.log("selectedlead", selectedLeads)

//     const taskLeads = [];

//     for (const lead of selectedLeads) {
//       const matchedAllocation = lead.activityLog.filter(
//         (item) =>
//           item?.taskallocatedTo?.equals(userObjectId) &&
//           item?.taskTo !== "followup" &&
//           !item?.allocationChanged
//       );

//       if (matchedAllocation.length === 0) continue;

//       const leadByModel = mongoose.model(lead.leadByModel);

//       const populatedLeadBy = await leadByModel
//         .findById(lead.leadBy)
//         .select("name")
//         .lean();

//       let populatedAllocatedTo = null;
//       let populatedAllocatedBy = null;

//       if (
//         matchedAllocation[0].taskallocatedToModel &&
//         mongoose.models[matchedAllocation[0].taskallocatedToModel]
//       ) {
//         const model = mongoose.model(
//           matchedAllocation[0].taskallocatedToModel
//         );

//         populatedAllocatedTo = await model
//           .findById(matchedAllocation[0].taskallocatedTo)
//           .select("name")
//           .lean();
//       }

//       if (
//         matchedAllocation[0].taskallocatedByModel &&
//         mongoose.models[matchedAllocation[0].taskallocatedByModel]
//       ) {
//         const model = mongoose.model(
//           matchedAllocation[0].taskallocatedByModel
//         );

//         populatedAllocatedBy = await model
//           .findById(matchedAllocation[0].taskallocatedBy)
//           .select("name")
//           .lean();
//       }

//       const populatedActivityLog = await Promise.all(
//         lead.activityLog.map(async (log) => {
//           let populatedSubmittedUser = null;
//           let populatedTaskAllocatedTo = null;
//           let populatedTask = null;
//           let populatedTaskBy = null;

//           if (
//             log.submittedUser &&
//             log.submissiondoneByModel &&
//             mongoose.models[log.submissiondoneByModel]
//           ) {
//             const model = mongoose.model(log.submissiondoneByModel);

//             populatedSubmittedUser = await model
//               .findById(log.submittedUser)
//               .select("name")
//               .lean();
//           }

//           if (
//             log.taskallocatedTo &&
//             log.taskallocatedToModel &&
//             mongoose.models[log.taskallocatedToModel]
//           ) {
//             const model = mongoose.model(log.taskallocatedToModel);

//             populatedTaskAllocatedTo = await model
//               .findById(log.taskallocatedTo)
//               .select("name")
//               .lean();
//           }

//           if (log.taskId) {
//             populatedTask = await Task.findById(log.taskId)
//               .select("taskName")
//               .lean();
//           }

//           if (log.taskBy && isValidObjectId(log.taskBy)) {
//             populatedTaskBy = await Task.findById(log.taskBy)
//               .select("taskName")
//               .lean();
//           }

//           return {
//             ...log,
//             taskBy: populatedTaskBy,
//             taskId: populatedTask,
//             submittedUser: populatedSubmittedUser || log.submittedUser,
//             taskallocatedTo:
//               populatedTaskAllocatedTo || log.taskallocatedTo,
//           };
//         })
//       );

//       const populatedLeadFor = await Promise.all(
//         lead.leadFor.map(async (item) => {
//           let populatedProduct = null;

//           if (
//             item.productorServicemodel &&
//             mongoose.models[item.productorServicemodel]
//           ) {
//             const model = mongoose.model(item.productorServicemodel);

//             populatedProduct = await model
//               .findById(item.productorServiceId)
//               .lean()
//               .catch(() => null);
//           }

//           return {
//             ...item,
//             productorServiceId:
//               populatedProduct || item.productorServiceId,
//           };
//         })
//       );
//       let pendingTask = null;

//       if (matchedAllocation[0]?.taskId) {
//         pendingTask = await Task.findById(matchedAllocation[0].taskId)
//           .select("taskName")
//           .lean();
//       }
//       taskLeads.push({
//         ...lead,
//         leadBy: populatedLeadBy,
//         taskallocatedTo: populatedAllocatedTo,
//         taskallocatedBy: populatedAllocatedBy,
//         activityLog: populatedActivityLog,
//         leadFor: populatedLeadFor,
//         pendingTask, // <-- Add this
//       });
//     }



//     ///

//     const followupquery = {
//       // leadBranch: branchObjectId,
//       activityLog: {
//         $elemMatch: {
//           taskallocatedTo: userObjectId,
//           taskTo: "followup",
//           followupClosed: false,
//         },
//       },
//     };

//     const leads = await LeadMaster.find(followupquery)
//       .populate({
//         path: "customerName",
//         select: "customerName",
//       })
//       .lean();

//     const followupLeads = [];

//     for (const lead of leads) {
//       const leadByModel = mongoose.model(lead.leadByModel);

//       const populatedLeadBy = await leadByModel
//         .findById(lead.leadBy)
//         .select("name")
//         .lean();

//       let latestFollowup = null;

//       const populatedActivityLog = await Promise.all(
//         lead.activityLog.map(async (activity) => {
//           if (
//             activity.taskTo === "followup" &&
//             activity.taskallocatedTo?.equals(userObjectId) &&
//             !activity.followupClosed
//           ) {
//             latestFollowup = activity;
//           }

//           let submittedUser = null;
//           let taskAllocatedTo = null;
//           let taskAllocatedBy = null;
//           let task = null;
//           let taskBy = null;

//           if (
//             activity.submittedUser &&
//             activity.submissiondoneByModel &&
//             mongoose.models[activity.submissiondoneByModel]
//           ) {
//             const model = mongoose.model(activity.submissiondoneByModel);

//             submittedUser = await model
//               .findById(activity.submittedUser)
//               .select("name")
//               .lean();
//           }

//           if (
//             activity.taskallocatedTo &&
//             activity.taskallocatedToModel &&
//             mongoose.models[activity.taskallocatedToModel]
//           ) {
//             const model = mongoose.model(activity.taskallocatedToModel);

//             taskAllocatedTo = await model
//               .findById(activity.taskallocatedTo)
//               .select("name")
//               .lean();
//           }

//           if (
//             activity.taskallocatedBy &&
//             activity.taskallocatedByModel &&
//             mongoose.models[activity.taskallocatedByModel]
//           ) {
//             const model = mongoose.model(activity.taskallocatedByModel);

//             taskAllocatedBy = await model
//               .findById(activity.taskallocatedBy)
//               .select("name")
//               .lean();
//           }

//           if (activity.taskId) {
//             task = await Task.findById(activity.taskId)
//               .select("taskName")
//               .lean();
//           }

//           if (activity.taskBy && isValidObjectId(activity.taskBy)) {
//             taskBy = await Task.findById(activity.taskBy)
//               .select("taskName")
//               .lean();
//           }

//           return {
//             ...activity,
//             taskId: task,
//             taskBy: taskBy,
//             submittedUser: submittedUser || activity.submittedUser,
//             taskallocatedTo: taskAllocatedTo || activity.taskallocatedTo,
//             taskallocatedBy: taskAllocatedBy || activity.taskallocatedBy,
//           };
//         })
//       );

//       if (!latestFollowup) continue;

//       const populatedLeadFor = await Promise.all(
//         lead.leadFor.map(async (item) => {
//           let product = null;

//           if (
//             item.productorServicemodel &&
//             mongoose.models[item.productorServicemodel]
//           ) {
//             const model = mongoose.model(item.productorServicemodel);

//             product = await model
//               .findById(item.productorServiceId)
//               .lean()
//               .catch(() => null);
//           }

//           return {
//             ...item,
//             productorServiceId: product || item.productorServiceId,
//           };
//         })
//       );

//       let allocatedTo = null;
//       let allocatedBy = null;

//       if (
//         latestFollowup.taskallocatedTo &&
//         latestFollowup.taskallocatedToModel
//       ) {
//         const model = mongoose.model(latestFollowup.taskallocatedToModel);

//         allocatedTo = await model
//           .findById(latestFollowup.taskallocatedTo)
//           .select("name")
//           .lean();
//       }

//       if (
//         latestFollowup.taskallocatedBy &&
//         latestFollowup.taskallocatedByModel
//       ) {
//         const model = mongoose.model(latestFollowup.taskallocatedByModel);

//         allocatedBy = await model
//           .findById(latestFollowup.taskallocatedBy)
//           .select("name")
//           .lean();
//       }

//       followupLeads.push({
//         ...lead,
//         leadBy: populatedLeadBy,
//         taskallocatedTo: allocatedTo,
//         taskallocatedBy: allocatedBy,
//         activityLog: populatedActivityLog,
//         leadFor: populatedLeadFor,
//       });
//     }


//     /////////


//     let leavelist
//     if (today === true) {
//       const today = new Date()
//       today.setHours(0, 0, 0, 0) // 00:00:00 of today

//       const tomorrow = new Date(today)
//       tomorrow.setDate(today.getDate() + 1) // 00:00:00 of next day

//       leavelist = await LeaveRequest.find({
//         leaveDate: {
//           $gte: today,
//           $lt: tomorrow
//         }
//       })
//         .populate("userId", "name") // Populates userId with the name field only
//         .lean() // Converts to plain JavaScript objects (instead of Mongoose docs)
//       const grouped = {};

//       leavelist.forEach((item) => {
//         const name = item.userId?.name;
//         if (!name) return;

//         if (!grouped[name]) {
//           grouped[name] = {
//             hasFullDay: false,
//             hasMorning: false,
//             hasAfternoon: false,
//           };
//         }

//         if (item.leaveType === "Full Day") {
//           grouped[name].hasFullDay = true;
//         } else if (item.leaveType === "Half Day") {
//           if (item.halfDayPeriod === "Morning") {
//             grouped[name].hasMorning = true;
//           }
//           if (item.halfDayPeriod === "Afternoon") {
//             grouped[name].hasAfternoon = true;
//           }
//         }
//       });
//       const result = Object.entries(grouped).map(([name, status]) => {
//         if (status.hasFullDay || (status.hasMorning && status.hasAfternoon)) {
//           return { name, leaveStatus: "Full Day" };
//         }
//         if (status.hasMorning) {
//           return { name, leaveStatus: "Half Day (Morning)" };
//         }
//         if (status.hasAfternoon) {
//           return { name, leaveStatus: "Half Day (Afternoon)" };
//         }
//         return { name, leaveStatus: "Unknown" };
//       });
//       /////

//       const currentMonth = new Date().toISOString().slice(5, 7) // "04"


//       const staffbirthdays = await Staff.find({
//         isVerified: true,
//         dateofbirth: { $regex: `^\\d{4}-${currentMonth}-\\d{2}$` }
//       })

//       const adminbirthdays = await Admin.find({
//         dateofbirth: { $regex: `^\\d{4}-${currentMonth}-\\d{2}$` }
//       })

//       const currentmonthBirthDays = [...staffbirthdays, ...adminbirthdays].map(
//         (item) => ({
//           name: item.name,
//           dateofbirth: item.dateofbirth,
//           profileUrl: item.profileUrl
//         })
//       )

//       /////


//       const data = {}
//       const currentquarterlyachiever = await QuarterlyAchiever.find({
//         verified: true
//       }).populate("achieverId", "name profileUrl title")
//       const currentyearlyachiever = await YearlyAchiever.find({
//         verified: true
//       }).populate("achieverId", "name profileUrl title")
//       data.quarterlyachiever = currentquarterlyachiever
//       data.yearlyachiever = currentyearlyachiever



// const startOfMonth = new Date();
// startOfMonth.setDate(1);
// startOfMonth.setHours(0, 0, 0, 0);

// const endOfMonth = new Date();
// endOfMonth.setMonth(endOfMonth.getMonth() + 1);
// endOfMonth.setDate(0);
// endOfMonth.setHours(23, 59, 59, 999);

// const holydata = await Holymaster.find({
//   holyDate: {
//     $gte: startOfMonth,
//     $lte: endOfMonth,
//   },
// });
// console.log("holddddddddddddddddddddd",holydata)
//       const notificationData = {
//         pendingTasks: taskLeads,
//         pendingFollowups: followupLeads,
//         leaves: result || [],
//         birthdays: currentmonthBirthDays || [],
//         holidays: holydata, // Add your holiday data here when you implement it
//         quarterlyAchievers: data?.quarterlyachiever || [],
//         yearlyAchievers: data?.yearlyachiever || [],
//       };
//       return res.status(200).json({
//         success: true,
//         message: "Notification data fetched successfully",
//         data: notificationData,
//       });

//     }
//   } catch (error) {
//     console.log("error", error.message)
//     return res.status(500).json({ message: "Internal server error" })
//   }
// }


export const getNotificationData = async (req, res) => {
  try {
    const { loggedUser, branchSelected, today = true } = req.query;

    if (!mongoose.isValidObjectId(loggedUser)) {
      return res.status(400).json({
        success: false,
        message: "Valid loggedUser is required",
      });
    }

    if (!mongoose.isValidObjectId(branchSelected)) {
      return res.status(400).json({
        success: false,
        message: "Valid branchSelected is required",
      });
    }

    const userObjectId = new mongoose.Types.ObjectId(loggedUser);
    const branchObjectId = new mongoose.Types.ObjectId(branchSelected);

    const objects = (value) =>
      Array.isArray(value)
        ? value.filter(
          (item) =>
            item !== null &&
            item !== undefined &&
            typeof item === "object"
        )
        : [];

    const sameObjectId = (value, objectId) => {
      if (!value || !objectId) return false;
      return String(value) === String(objectId);
    };

    /*
      Today is calculated in Asia/Kolkata.
      MongoDB stores Date values in UTC, so this creates the correct
      UTC range for the current IST calendar day.
    */
    const now = new Date();
    const istDateText = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
    }).format(now);

    const [istYear, istMonth, istDay] = istDateText
      .split("-")
      .map(Number);

    const startOfToday = new Date(
      Date.UTC(istYear, istMonth - 1, istDay - 1, 18, 30, 0, 0)
    );

    const startOfTomorrow = new Date(
      Date.UTC(istYear, istMonth - 1, istDay, 18, 30, 0, 0)
    );

    const isTodayFollowup = (dateValue) => {
      if (!dateValue) return false;

      const date = new Date(dateValue);

      return (
        !Number.isNaN(date.getTime()) &&
        date >= startOfToday &&
        date < startOfTomorrow
      );
    };

    const getModelDocument = async (modelName, documentId, fields = "name") => {
      if (!modelName || !documentId || !mongoose.models[modelName]) {
        return null;
      }

      return mongoose
        .model(modelName)
        .findById(documentId)
        .select(fields)
        .lean()
        .catch(() => null);
    };

    const getTaskDocument = async (taskId) => {
      if (!taskId || !mongoose.isValidObjectId(taskId)) return null;

      return Task.findById(taskId)
        .select("taskName")
        .lean()
        .catch(() => null);
    };

    const populateLeadFor = async (leadFor) => {
      return Promise.all(
        objects(leadFor).map(async (item) => {
          const productOrService = await getModelDocument(
            item.productorServicemodel,
            item.productorServiceId,
            "productName serviceName name shortName"
          );

          return {
            ...item,
            productorServiceId:
              productOrService || item.productorServiceId,
          };
        })
      );
    };

    const populateActivityLog = async (activityLog) => {
      return Promise.all(
        objects(activityLog).map(async (activity) => {
          const [
            submittedUser,
            taskAllocatedTo,
            taskAllocatedBy,
            task,
            taskBy,
          ] = await Promise.all([
            getModelDocument(
              activity.submissiondoneByModel,
              activity.submittedUser
            ),
            getModelDocument(
              activity.taskallocatedToModel,
              activity.taskallocatedTo
            ),
            getModelDocument(
              activity.taskallocatedByModel,
              activity.taskallocatedBy
            ),
            getTaskDocument(activity.taskId),
            getTaskDocument(activity.taskBy),
          ]);

          return {
            ...activity,
            taskId: task || activity.taskId,
            taskBy: taskBy || activity.taskBy,
            submittedUser: submittedUser || activity.submittedUser,
            taskallocatedTo:
              taskAllocatedTo || activity.taskallocatedTo,
            taskallocatedBy:
              taskAllocatedBy || activity.taskallocatedBy,
          };
        })
      );
    };

    const enrichLead = async (lead, allocation) => {
      const [leadBy, allocatedTo, allocatedBy, activityLog, leadFor, pendingTask] =
        await Promise.all([
          getModelDocument(lead.leadByModel, lead.leadBy),
          getModelDocument(
            allocation?.taskallocatedToModel,
            allocation?.taskallocatedTo
          ),
          getModelDocument(
            allocation?.taskallocatedByModel,
            allocation?.taskallocatedBy
          ),
          populateActivityLog(lead.activityLog),
          populateLeadFor(lead.leadFor),
          getTaskDocument(allocation?.taskId),
        ]);

      return {
        ...lead,
        leadBy,
        taskallocatedTo: allocatedTo,
        taskallocatedBy: allocatedBy,
        activityLog,
        leadFor,
        pendingTask,
      };
    };

    /* Pending non-follow-up tasks */
    // const taskQuery = {
    //   leadBranch: branchObjectId,
    //   activityLog: {
    //     $elemMatch: {
    //       taskallocatedTo: userObjectId,
    //       allocationChanged: false,
    //       taskTo: { $ne: "followup" },
    //     },
    //   },
    // };
    const taskQuery = {
      leadBranch: branchObjectId,

      activityLog: {
        $elemMatch: {
          taskallocatedTo: userObjectId,

          taskTo: { $ne: "followup" },

          allocationChanged: { $ne: true },

          taskClosed: { $ne: true },

          allocatedClosed: { $ne: true },

          followupClosed: { $ne: true },

          $or: [
            {
              taskId: {
                $exists: true,
                $ne: null,
              },
            },
            {
              taskBy: {
                $exists: true,
                $ne: null,
              },
            },
          ],
        },
      },
    };

    const selectedLeads = await LeadMaster.find(taskQuery)
      .populate({
        path: "customerName",
        select: "customerName",
      })
      .lean();

    const taskLeads = [];

    for (const lead of selectedLeads) {
      const matchedAllocation = objects(lead.activityLog).filter(
        (item) =>
          sameObjectId(item?.taskallocatedTo, userObjectId) &&
          item?.taskTo !== "followup" &&
          item?.allocationChanged === false
      );

      if (!matchedAllocation.length) continue;

      const enrichedLead = await enrichLead(
        lead,
        matchedAllocation.at(-1)
      );

      taskLeads.push(enrichedLead);
    }

    /*
      Pending follow-ups due TODAY only.

      All $elemMatch conditions must match the same activityLog item:
      - assigned to logged user
      - follow-up task
      - not closed
      - nextFollowUpDate is within today's IST range
    */
    const followupQuery = {
      leadBranch: branchObjectId,
      activityLog: {
        $elemMatch: {
          taskallocatedTo: userObjectId,
          taskTo: "followup",
          followupClosed: false,
          nextFollowUpDate: {
            $gte: startOfToday,
            $lt: startOfTomorrow,
          },
        },
      },
    };

    const followupSourceLeads = await LeadMaster.find(followupQuery)
      .populate({
        path: "customerName",
        select: "customerName",
      })
      .lean();
    console.log("branhddddddddd", branchObjectId)
    console.log("hhhhhhhhhhhhhhhh", followupSourceLeads)
    const followupLeads = [];

    for (const lead of followupSourceLeads) {
      /*
        Do not use the last pending follow-up from all dates.
        Select only an open follow-up assigned to this user and due today.
      */
      const todayPendingFollowups = objects(lead.activityLog).filter(
        (activity) =>
          activity?.taskTo === "followup" &&
          sameObjectId(activity?.taskallocatedTo, userObjectId) &&
          activity?.followupClosed === false &&
          isTodayFollowup(activity?.nextFollowUpDate)
      );

      if (!todayPendingFollowups.length) continue;

      const latestFollowup = todayPendingFollowups.at(-1);
      const enrichedLead = await enrichLead(lead, latestFollowup);

      /* Helpful to the frontend: exact pending follow-up due today */
      enrichedLead.pendingFollowup = latestFollowup;

      followupLeads.push(enrichedLead);
    }

    let leaves = [];
    let birthdays = [];
    let holidays = [];
    let quarterlyAchievers = [];
    let yearlyAchievers = [];

    if (String(today) === "true") {
      const leaveList = await LeaveRequest.find({
        leaveDate: {
          $gte: startOfToday,
          $lt: startOfTomorrow,
        },
      })
        .populate("userId", "name")
        .lean();

      const groupedLeaves = {};

      for (const item of leaveList) {
        const name = item?.userId?.name;
        if (!name) continue;

        if (!groupedLeaves[name]) {
          groupedLeaves[name] = {
            hasFullDay: false,
            hasMorning: false,
            hasAfternoon: false,
          };
        }

        if (item.leaveType === "Full Day") {
          groupedLeaves[name].hasFullDay = true;
        }

        if (item.leaveType === "Half Day") {
          if (item.halfDayPeriod === "Morning") {
            groupedLeaves[name].hasMorning = true;
          }

          if (item.halfDayPeriod === "Afternoon") {
            groupedLeaves[name].hasAfternoon = true;
          }
        }
      }

      leaves = Object.entries(groupedLeaves).map(([name, status]) => {
        if (status.hasFullDay || (status.hasMorning && status.hasAfternoon)) {
          return { name, leaveStatus: "Full Day" };
        }

        if (status.hasMorning) {
          return { name, leaveStatus: "Half Day (Morning)" };
        }

        if (status.hasAfternoon) {
          return { name, leaveStatus: "Half Day (Afternoon)" };
        }

        return { name, leaveStatus: "Unknown" };
      });

      const currentMonth = String(istMonth).padStart(2, "0");

      const [staffBirthdays, adminBirthdays] = await Promise.all([
        Staff.find({
          isVerified: true,
          dateofbirth: { $regex: `^\\d{4}-${currentMonth}-\\d{2}$` },
        })
          .select("name dateofbirth profileUrl")
          .lean(),

        Admin.find({
          dateofbirth: { $regex: `^\\d{4}-${currentMonth}-\\d{2}$` },
        })
          .select("name dateofbirth profileUrl")
          .lean(),
      ]);

      birthdays = [...staffBirthdays, ...adminBirthdays].map((item) => ({
        name: item.name,
        dateofbirth: item.dateofbirth,
        profileUrl: item.profileUrl,
      }));

      const startOfMonth = new Date(
        Date.UTC(istYear, istMonth - 1, 0, 18, 30, 0, 0)
      );

      const startOfNextMonth = new Date(
        Date.UTC(istYear, istMonth, 0, 18, 30, 0, 0)
      );

      const [holidayData, currentQuarterlyAchievers, currentYearlyAchievers] =
        await Promise.all([
          Holymaster.find({
            holyDate: {
              $gte: startOfMonth,
              $lt: startOfNextMonth,
            },
          }).lean(),

          QuarterlyAchiever.find({ verified: true })
            .populate("achieverId", "name profileUrl title")
            .lean(),

          YearlyAchiever.find({ verified: true })
            .populate("achieverId", "name profileUrl title")
            .lean(),
        ]);

      holidays = holidayData;
      quarterlyAchievers = currentQuarterlyAchievers;
      yearlyAchievers = currentYearlyAchievers;
    }

    return res.status(200).json({
      success: true,
      message: "Notification data fetched successfully",
      data: {
        pendingTasks: taskLeads,
        pendingFollowups: followupLeads,
        leaves,
        birthdays,
        holidays,
        quarterlyAchievers,
        yearlyAchievers,
      },
    });
  } catch (error) {
    console.error("getNotificationData error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


export const getBranchwiseMarketingPendingTasks = async (req, res) => {
  try {
    const { branchId } = req.query;

    if (!branchId) {
      return res.status(400).json({
        message: "Branch Id is required",
        data: []
      });
    }

    // Only populate the static ref here — taskId works fine as-is
    const leads = await LeadMaster.find({ leadBranch: branchId })
      .populate("activityLog.taskId")
      .lean(); // lean() is fine since we're manually attaching taskallocatedTo below

    // 1. Collect all taskallocatedTo ids, grouped by their model
    const idsByModel = { Staff: new Set(), Admin: new Set() };

    leads.forEach((lead) => {
      lead.activityLog.forEach((activity) => {
        if (activity.taskallocatedTo && activity.taskallocatedToModel) {
          idsByModel[activity.taskallocatedToModel]?.add(
            activity.taskallocatedTo.toString()
          );
        }
      });
    });

    // 2. Batch fetch each model's docs in one query per model
    const [staffDocs, adminDocs] = await Promise.all([
      Staff.find({ _id: { $in: [...idsByModel.Staff] } })
        .select("staffName name userName")
        .lean(),
      Admin.find({ _id: { $in: [...idsByModel.Admin] } })
        .select("staffName name userName")
        .lean()
    ]);

    // 3. Build a single lookup map: id -> doc
    const userMap = new Map();
    staffDocs.forEach((doc) => userMap.set(doc._id.toString(), doc));
    adminDocs.forEach((doc) => userMap.set(doc._id.toString(), doc));

    // 4. Build pending tasks, resolving the name from the map
    const pendingTasks = [];

    leads.forEach((lead) => {
      lead.activityLog.forEach((activity) => {
        if (
          activity.allocationChanged === false &&
          activity.taskClosed === false &&
          activity.taskTo !== "followup" &&
          activity.allocationDate
        ) {
          const allocatedUser = activity.taskallocatedTo
            ? userMap.get(activity.taskallocatedTo.toString())
            : null;

          pendingTasks.push({
            staffName:
              allocatedUser?.staffName ||
              allocatedUser?.name ||
              allocatedUser?.userName ||
              "N/A",
            taskName: activity.taskId?.taskName || "N/A",
            completionDate: activity.allocationDate
          });
        }
      });
    });

    pendingTasks.sort(
      (a, b) => new Date(a.completionDate) - new Date(b.completionDate)
    );

    return res.status(200).json({
      message: "Pending tasks fetched successfully",
      data: pendingTasks
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal server error",
      data: []
    });
  }
};
export const getTodayVerifiedCollection = async (req, res) => {
  try {
    const { selectedBranch } = req.query
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const matchQuery = {
      "paymentHistory.paymentVerified": true,
      "paymentHistory.verifiedAt": {
        $gte: startDate,
        $lte: endDate,
      },
    };

    if (selectedBranch) {
      matchQuery.leadBranch = new mongoose.Types.ObjectId(selectedBranch);
    }
    console.log("matchauery", matchQuery)
    const result = await LeadMaster.aggregate([
      {
        $unwind: "$paymentHistory",
      },
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: null,
          totalVerifiedCollection: {
            $sum: "$paymentHistory.receivedAmount",
          },
        },
      },
    ]);
    console.log("resut", result)

    return res.status(200).json({
      success: true,
      data:
        result.length > 0 ? result[0].totalVerifiedCollection : 0,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
export const Getallsalesfunnels = async (req, res) => {
  try {
    const { startDate, endDate, selectedBranch } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);
    const branchObjectId = new mongoose.Types.ObjectId(selectedBranch)

    // 1️⃣ Aggregation Pipeline
    const result = await LeadMaster.aggregate([
      // Unwind activityLog
      { $unwind: "$activityLog" },

      // Filter by date range
      {
        $match: {
          "activityLog.submissionDate": {
            $gte: start,
            $lte: end
          },
          leadBranch: branchObjectId
        }
      },

      // Classify funnel stage
      {
        $addFields: {
          stage: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $eq: ["$activityLog.allocationChanged", false] },
                      { $eq: ["$activityLog.taskTo", "followup"] }
                    ]
                  },
                  then: "Contacted"
                },
                {
                  case: { $eq: ["$activityLog.taskfromFollowup", true] },
                  then: "System Study"
                },
                {
                  case: { $eq: ["$leadLost", true] },
                  then: "Lost"
                },
                {
                  case: { $eq: ["$activityLog.followupClosed", true] },
                  then: "Converted"
                }
              ],
              default: "New Leads"
            }
          }
        }
      },

      // Group by stage
      {
        $group: {
          _id: "$stage",
          count: { $sum: 1 },
          value: { $sum: "$netAmount" }
        }
      }
    ]);

    // 2️⃣ Define funnel order
    const FUNNEL_STAGES = [
      "New Leads",
      "Contacted",
      "System Study",
      "Lost",
      "Converted"
    ];

    // 3️⃣ Convert aggregation result to map
    const stageMap = result.reduce((acc, item) => {
      acc[item._id] = {
        count: item.count,
        value: item.value
      };
      return acc;
    }, {});

    // 4️⃣ Build final response with default 0 values
    let previousCount = null;

    const formatted = FUNNEL_STAGES.map((stage) => {
      const count = stageMap[stage]?.count || 0;
      const value = stageMap[stage]?.value || 0;

      const conversion =
        previousCount === null || previousCount === 0
          ? "0%"
          : `${((count / previousCount) * 100).toFixed(1)}%`;

      previousCount = count;

      return {
        stage,
        count,
        value,
        conversion
      };
    });


    return res.status(200).json({ message: "data found", data: formatted });

  } catch (error) {
    console.log("error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const UpdateCollection = async (req, res) => {

  const { isFrom = null } = req.query
  const {
    overwriteLastPayment = false,
    paymentData = null,
    ...formData
  } = req.body

  let model = null
  let session = null

  try {
    const isAdmin = await Admin.findById(formData.receivedBy).lean()
    if (isAdmin) {
      model = "Admin"
    } else {
      const isStaff = await Staff.findById(formData.receivedBy).lean()
      if (isStaff) {
        model = "Staff"
      }
    }


    if (!formData?.leadDocId) {
      return res.status(400).json({ message: "Missing leadid" })
    }

    if (!formData?.customerId) {
      return res.status(400).json({ message: "Missing customerId" })
    }

    const customerId = formData.customerId
    const leadDocId = formData.leadDocId

    session = await mongoose.startSession()

    await session.withTransaction(async () => {
      const updateCustomer = await Customer.findByIdAndUpdate(
        customerId,
        {
          $set: {
            customerName: formData.customerName,
            address1: formData.address,
            email: formData.email,
            mobile: formData?.mobile,
            registrationType: formData?.registrationType,
            partner: formData?.partner,
            country: formData?.country,
            state: formData?.state,
            city: formData?.city,
            pincode: formData?.pincode
          }
        },
        { new: true, session }
      )

      if (!updateCustomer) {
        throw new Error("Customer not found")
      }

      const lead = await LeadMaster.findById(leadDocId).session(session)

      if (!lead) {
        throw new Error("Lead not found")
      }

      const receivedAmount = Number(
        paymentData?.receivedAmount ??
        formData?.totalReceivedAmount ??
        0
      )

      const currentPaidAmount = Number(
        lead.totalPaidAmount ??
        formData.totalpaidAmountBefore ??
        0
      )

      let newTotalPaid = currentPaidAmount
      let previousPaymentAmount = 0

      const normalizedPaymentEntries = (
        paymentData?.paymentEntries ||
        formData?.paymentEntries ||
        []
      ).map((e) => ({
        productorServiceId: e.productorServiceId,
        productorServicemodel: e.productorServicemodel,
        netAmount: Number(e.netAmount || 0),
        receivedAmount: Number(e.receivedAmount || 0),
        balanceAmount: Number(e.balanceAmount || 0)
      }))

      const paymentRecord = {
        paymentDate: paymentData?.paymentDate
          ? new Date(paymentData.paymentDate)
          : new Date(),
        receivedAmount,
        paymentVerified: false,
        paymentEntries: normalizedPaymentEntries,
        receivedBy: paymentData?.receivedBy || formData?.receivedBy,
        receivedModel:
          paymentData?.receivedModel || model || formData?.receivedModel,
        bankRemarks:
          paymentData?.bankRemarks ?? formData?.bankRemarks ?? "",
        updatedAt: new Date()
      }

      if (!Array.isArray(lead.paymentHistory)) {
        lead.paymentHistory = []
      }

      if (overwriteLastPayment && lead.paymentHistory.length > 0) {
        const lastPayment = lead.paymentHistory[lead.paymentHistory.length - 1]

        previousPaymentAmount = Number(lastPayment?.receivedAmount || 0)

        lead.paymentHistory[lead.paymentHistory.length - 1] = {
          ...(typeof lastPayment?.toObject === "function"
            ? lastPayment.toObject()
            : lastPayment),
          ...paymentRecord
        }

        newTotalPaid = currentPaidAmount - previousPaymentAmount + receivedAmount
      } else {
        lead.paymentHistory.push({
          ...paymentRecord,
          createdAt: new Date()
        })

        newTotalPaid = currentPaidAmount + receivedAmount
      }

      const totalNetAmount = Number(
        formData?.totalNetAmount ?? lead.totalNetAmount ?? 0
      )

      const newBalance = Math.max(0, totalNetAmount - newTotalPaid)

      let allocation = null
      if (isFrom === "reallocation") {
        allocation = await Task.findOne({ taskName: "Leadclosed" }).session(session)
      }

      lead.totalPaidAmount = newTotalPaid
      lead.partner = formData.partner
      lead.balanceAmount = newBalance

      if (isFrom === "reallocation") {
        lead.leadClosed = true
        lead.leadClosedBy = formData?.receivedBy
        lead.leadClosedModel = formData?.receivedModel || model
        lead.reallocatedTo = false
        lead.allocationType = allocation?._id || lead.allocationType
      }

      await lead.save({ session })

      await LeadMaster.updateMany(
        { customerName: lead.customerName },
        {
          $set: {
            email: formData?.email,
            mobile: formData?.mobile,
            pincode: formData?.pincode,
            partner: formData?.partner
          }
        },
        { session }
      )
    })

    return res.status(200).json({
      success: true,
      message: overwriteLastPayment
        ? "Payment overwritten successfully"
        : "Payment added successfully"
    })
  } catch (error) {
    console.log("error", error)
    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error"
    })
  } finally {
    if (session) {
      session.endSession()
    }
  }
}

export const ChecktodeleteTask = async (req, res) => {
  try {
    const { id } = req.query
    const objectId = new mongoose.Types.ObjectId(id)
    const result = await LeadMaster.find({
      "activityLog.taskId": objectId
    })
    if (result && result.length > 0) {
      return res.status(200).json({ message: "found task", data: false })
    } else {
      return res.status(200).json({ message: "not found to delete", data: true })
    }

  } catch (error) {
    console.log("error:", error.message)
    return res.status(500).json({ message: "Internal server error" })
  }
}
export const TaskRegistration = async (req, res) => {
  try {
    const formData = req.body;
    const existingItem = await Task.findOne({
      taskName: formData.task,
      code: formData.task,
    });
    if (existingItem) {
      return res.status(400).json({ message: "Task is already registere" });
    }

    // Create and save new item
    const collection = new Task({
      taskName: formData.task,
    });
    await collection.save();

    res.status(200).json({
      status: true,
      message: "Task created successfully",
      data: collection,
    });
  } catch (error) {
    return res.status(500).json({ message: "internal server error" });
  }
};


export const Checkduplicatecustomer = async (req, res) => {
  try {
    const { mobile, customerName, customerId } = req.body;

    const cleanedMobile = String(mobile || "")
      .replace(/^\+?91/, "")
      .replace(/\D/g, "");

    const cleanedName = String(customerName || "").trim();

    if (!cleanedMobile || cleanedMobile.length !== 10 || !cleanedName) {
      return res.json({
        exists: false,
        message: "",
      });
    }

    const query = {
      mobile: cleanedMobile,
      customerName: { $regex: `^${cleanedName}$`, $options: "i" },
    };

    if (customerId) {
      query._id = { $ne: customerId };
    }

    const existingCustomer = await Customer.findOne(query).select(
      "_id customerName mobile"
    );

    if (existingCustomer) {
      return res.json({
        exists: true,
        message: "A customer already exists with the same name and mobile number.",
        customer: existingCustomer,
      });
    }

    return res.json({
      exists: false,
      message: "",
    });
  } catch (error) {
    console.error("check-customer-duplicate error", error);
    return res.status(500).json({
      exists: false,
      message: "Something went wrong while checking customer duplicate",
    });
  }
}

// export const Leadclosing = async (req, res) => {
//   const session = await mongoose.startSession();

//   const toNum = (value, fallback = 0) => {
//     const n = Number(value);
//     return Number.isFinite(n) ? n : fallback;
//   };

//   const round2 = (value) => Number(toNum(value).toFixed(2));

//   const isNonEmpty = (value) =>
//     value !== null &&
//     value !== undefined &&
//     String(value).trim() !== "";

//   const normalizeString = (value) =>
//     value === null || value === undefined ? "" : String(value).trim();

//   const isAdditionalService = (item) =>
//     String(item?.productorservicetype || "").toLowerCase() ===
//     "additionalservice";

//   const isPrimaryProduct = (item) =>
//     String(item?.productorservicetype || "").toLowerCase() ===
//     "primaryproduct";

//   const normalizeLicenseNumberValue = (value) => {
//     if (!isNonEmpty(value)) return null;
//     const n = Number(value);
//     return Number.isFinite(n) ? n : null;
//   };

//   const buildCustomerTaggedDataForAdditionalOnly = (taggeddata = []) => {
//     return (Array.isArray(taggeddata) ? taggeddata : []).map((tag) => {
//       const totalNextDueAmount = round2(
//         tag?.totalnextDueAmount ?? tag?.taxinclusiveamount ?? 0
//       );
//       const nextDueAmount = round2(
//         tag?.nextDueAmount ?? tag?.taxexclusiveAmount ?? 0
//       );

//       const nextDueTax = toNum(tag?.nextDueTax ?? 0, 0);

//       return {
//         ...(tag?.toObject ? tag.toObject() : tag),
//         licensenumber: normalizeLicenseNumberValue(tag?.licensenumber),
//         nextDue: tag?.nextDue || "",
//         hsn: nextDueTax,
//         originalHsn: toNum(tag?.originalHsn ?? tag?.hsn ?? 0, 0),
//         noofusers: toNum(tag?.noofusers, 0),
//         serialNumber: tag?.serialNumber ?? null,
//         nextDueAmount,
//         totalnextDueAmount: totalNextDueAmount,
//         taxexclusiveAmount: nextDueAmount,
//         taxinclusiveamount: totalNextDueAmount,
//         productAmount: totalNextDueAmount,
//         leadAmount: totalNextDueAmount,
//         totalleadAmount: totalNextDueAmount,
//         leadTax: nextDueTax,
//         nextDueTax,
//         discountAmount: toNum(tag?.discountAmount, 0),
//       };
//     });
//   };

//   const buildLeadMasterTaggedData = (taggeddata = []) => {
//     return (Array.isArray(taggeddata) ? taggeddata : []).map((tag) => ({
//       ...(tag?.toObject ? tag.toObject() : tag),
//       licensenumber: normalizeLicenseNumberValue(tag?.licensenumber),
//       nextDue: tag?.nextDue || "",
//       productAmount: round2(tag?.productAmount ?? tag?.totalnextDueAmount ?? 0),
//       taxexclusiveAmount: round2(tag?.taxexclusiveAmount ?? 0),
//       taxinclusiveamount: round2(tag?.taxinclusiveamount ?? 0),
//       hsn: toNum(tag?.hsn, 0),
//       noofusers: toNum(tag?.noofusers, 0),
//       serialNumber: tag?.serialNumber ?? null,
//       nextDueAmount: round2(tag?.nextDueAmount ?? 0),
//       originalHsn: toNum(tag?.originalHsn ?? tag?.hsn, 0),
//       leadAmount: round2(tag?.leadAmount ?? 0),
//       totalleadAmount: round2(tag?.totalleadAmount ?? 0),
//       totalnextDueAmount: round2(tag?.totalnextDueAmount ?? 0),
//       leadTax: toNum(tag?.leadTax, 0),
//       nextDueTax: toNum(tag?.nextDueTax, 0),
//       discountAmount: toNum(tag?.discountAmount, 0),
//     }));
//   };

//   const mergeLicenseNumbers = (existingLicenses = [], incomingLicenses = []) => {
//     const merged = [
//       ...(Array.isArray(existingLicenses) ? existingLicenses : []),
//     ].map((item) => (item?.toObject ? item.toObject() : item));

//     for (const license of Array.isArray(incomingLicenses) ? incomingLicenses : []) {
//       const normalizedLicense = {
//         ...(license?.toObject ? license.toObject() : license),
//         licenseNumber: normalizeLicenseNumberValue(license?.licenseNumber),
//         productorServiceId: license?.productorServiceId || null,
//         productorServiceName: license?.productorServiceName || "",
//         sourceIndex: license?.sourceIndex,
//       };

//       const exists = merged.some(
//         (l) =>
//           String(l?.licenseNumber ?? "") ===
//           String(normalizedLicense.licenseNumber ?? "") &&
//           String(l?.productorServiceId || "") ===
//           String(normalizedLicense.productorServiceId || "")
//       );

//       if (!exists) merged.push(normalizedLicense);
//     }

//     return merged;
//   };

//   const mergeTaggedData = (existingTagged = [], incomingTagged = []) => {
//     const merged = [
//       ...(Array.isArray(existingTagged) ? existingTagged : []),
//     ].map((item) => (item?.toObject ? item.toObject() : item));

//     for (const tag of Array.isArray(incomingTagged) ? incomingTagged : []) {
//       const normalizedTag = {
//         ...(tag?.toObject ? tag.toObject() : tag),
//         licensenumber: normalizeLicenseNumberValue(tag?.licensenumber),
//       };

//       const index = merged.findIndex(
//         (t) =>
//           String(t?.licensenumber ?? "") ===
//           String(normalizedTag.licensenumber ?? "")
//       );

//       if (index === -1) {
//         merged.push(normalizedTag);
//       } else {
//         merged[index] = {
//           ...merged[index],
//           ...normalizedTag,
//         };
//       }
//     }

//     return merged;
//   };

//   try {
//     const { data, leadData, userId, role } = req.body;
//     const { docID } = req.query;

//     if (!docID) {
//       return res.status(400).json({ message: "docID is required" });
//     }

//     if (!data) {
//       return res.status(400).json({ message: "data is required" });
//     }

//     if (!Array.isArray(leadData) || leadData.length === 0) {
//       return res
//         .status(400)
//         .json({ message: "leadData must be a non-empty array" });
//     }

//     if (!data?.customerName) {
//       return res.status(400).json({ message: "Customer id is required" });
//     }

//     const objectId = new mongoose.Types.ObjectId(docID);
//     let responsePayload = null;

//     await session.withTransaction(async () => {
//       const matchedDoc = await LeadMaster.findById(objectId).session(session);
//       if (!matchedDoc) {
//         throw new Error("Lead not found");
//       }

//       const hasPrimaryProduct = leadData.some(isPrimaryProduct);
//       const onlyAdditionalServices =
//         !hasPrimaryProduct && leadData.every(isAdditionalService);

//       const discountAmount = round2(data?.discamnt || 0);
//       const inputTaxableAmount = round2(data?.taxableAmount || 0);
//       const inputTaxAmount = round2(data?.taxAmount || 0);
//       const inputNetAmount = round2(data?.netAmount || 0);

//       const grossAmount = round2(
//         leadData.reduce((sum, item) => sum + toNum(item?.netAmount, 0), 0)
//       );

//       let newTaxableAmount = inputTaxableAmount;
//       let newTaxAmount = inputTaxAmount;
//       let newNetAmount = inputNetAmount;

//       let adjustedItems = [];

//       if (onlyAdditionalServices) {
//         adjustedItems = leadData.map((item) => {
//           const originalProductPrice = round2(
//             item?.actualproductPrice ?? item?.productPrice ?? 0
//           );
//           const originalNetAmount = round2(
//             item?.actualNetAmount ?? item?.netAmount ?? 0
//           );
//           const originalTaxAmount = round2(
//             originalNetAmount - originalProductPrice
//           );

//           return {
//             item,
//             originalNetAmount,
//             finalNetAmount: originalNetAmount,
//             scaledProductPrice: originalProductPrice,
//             scaledTaxAmount: originalTaxAmount,
//           };
//         });

//         newTaxableAmount = inputTaxableAmount;
//         newTaxAmount = inputTaxAmount;
//         newNetAmount = inputNetAmount;
//       } else {
//         newNetAmount = round2(
//           data?.netAmount ?? grossAmount - discountAmount
//         );

//         let runningTotal = 0;

//         adjustedItems = leadData.map((item, index) => {
//           const originalNetAmount = round2(item?.netAmount || 0);
//           const ratio = grossAmount > 0 ? originalNetAmount / grossAmount : 0;

//           let finalNetAmount = round2(
//             originalNetAmount - ratio * discountAmount
//           );

//           const isLastItem = index === leadData.length - 1;
//           if (isLastItem) {
//             finalNetAmount = round2(newNetAmount - runningTotal);
//           }

//           runningTotal = round2(runningTotal + finalNetAmount);

//           const originalProductPrice = round2(item?.productPrice || 0);
//           const scaleFactor =
//             originalNetAmount > 0 ? finalNetAmount / originalNetAmount : 0;

//           const scaledProductPrice = round2(originalProductPrice * scaleFactor);
//           const scaledTaxAmount = round2(finalNetAmount - scaledProductPrice);

//           return {
//             item,
//             originalNetAmount,
//             finalNetAmount,
//             scaledProductPrice,
//             scaledTaxAmount,
//           };
//         });

//         newTaxableAmount = inputTaxableAmount;
//         newTaxAmount = inputTaxAmount;
//       }

//       const mappedleadData = adjustedItems.map(
//         ({ item, finalNetAmount, scaledProductPrice, scaledTaxAmount }) => ({
//           licenseNumber: normalizeLicenseNumberValue(item?.licenseNumber),
//           licenseNumbers: Array.isArray(item?.licenseNumbers)
//             ? item.licenseNumbers.map((license) => ({
//               ...(license?.toObject ? license.toObject() : license),
//               licenseNumber: normalizeLicenseNumberValue(license?.licenseNumber),
//               productorServiceId: license?.productorServiceId || null,
//               productorServiceName: license?.productorServiceName || "",
//               sourceIndex: license?.sourceIndex,
//             }))
//             : [],
//           taggeddata: buildLeadMasterTaggedData(item?.taggeddata),
//           productorServiceName: item?.productorServiceName || "",
//           productorServiceId: item?.productorServiceId || null,
//           productorServicemodel: item?.itemType || "",
//           price: item?.price ?? null,
//           productPrice: scaledProductPrice,
//           hsn: toNum(item?.hsn || 0, 0),
//           netAmount: round2(finalNetAmount),
//           taxAmount: round2(scaledTaxAmount),
//           productorservicetype: item?.productorservicetype || "",
//           company_id: item?.company_id || null,
//           branch_id: item?.branch_id || null,
//           applicationDate: item?.applicationDate || "",
//           softwareTrade: item?.softwareTrade || "",
//           nextDue: item?.nextDue || "",
//           noofusers: toNum(item?.noofusers, 0),
//           isActive: item?.status ?? item?.isActive,
//           version: item?.version,
//           status: item?.status,
//           actualproductPrice: toNum(item?.actualproductPrice, 0),
//           actualHsn: toNum(item?.actualHsn, 0),
//           actualNetAmount: toNum(item?.actualNetAmount, 0),
//           parentPrimaryProductId: item?.parentPrimaryProductId || null,
//           isDefaultService: !!item?.isDefaultService,
//         })
//       );

//       const mappedproductData = adjustedItems.map(
//         ({ item, finalNetAmount, scaledProductPrice, scaledTaxAmount }) => {
//           const normalizedTaggedData = buildCustomerTaggedDataForAdditionalOnly(item?.taggeddata)


//           return {
//             company_id: item?.company_id || null,
//             branch_id: item?.branch_id || null,
//             product_id: item?.productorServiceId || null,
//             productName: item?.productorServiceName || "",
//             productorServiceName: item?.productorServiceName || "",
//             productorservicetype: item?.productorservicetype || "",
//             licensenumber: normalizeLicenseNumberValue(item?.licenseNumber),
//             noofusers: toNum(item?.noofusers, 0),
//             applicationDate: item?.applicationDate || "",
//             productAmount: round2(
//               onlyAdditionalServices
//                 ? item?.actualNetAmount ?? item?.netAmount ?? finalNetAmount
//                 : finalNetAmount
//             ),
//             productPrice: round2(
//               onlyAdditionalServices
//                 ? item?.actualproductPrice ??
//                 item?.productPrice ??
//                 scaledProductPrice
//                 : scaledProductPrice
//             ),
//             taxAmount: round2(
//               onlyAdditionalServices
//                 ? (item?.actualNetAmount ?? item?.netAmount ?? finalNetAmount) -
//                 (item?.actualproductPrice ??
//                   item?.productPrice ??
//                   scaledProductPrice)
//                 : scaledTaxAmount
//             ),
//             hsn: toNum(
//               onlyAdditionalServices ? item?.actualHsn ?? item?.hsn : item?.hsn,
//               0
//             ),
//             softwareTrade: item?.softwareTrade || "",
//             nextDue: item?.nextDue || "",
//             licenseNumbers: Array.isArray(item?.licenseNumbers)
//               ? item.licenseNumbers.map((license) => ({
//                 ...(license?.toObject ? license.toObject() : license),
//                 licenseNumber: normalizeLicenseNumberValue(license?.licenseNumber),
//                 productorServiceId: license?.productorServiceId || null,
//                 productorServiceName: license?.productorServiceName || "",
//                 sourceIndex: license?.sourceIndex,
//               }))
//               : [],
//             taggeddata: normalizedTaggedData,
//             isActive: item?.status ?? item?.isActive,
//             version: item?.version,
//             parentPrimaryProductId: item?.parentPrimaryProductId || null,
//             isDefaultService: !!item?.isDefaultService,
//             createdFrom: "Lead",
//             productAddedDate: new Date(),
//           };
//         }
//       );

//       const totalPaidAmount = round2(matchedDoc.totalPaidAmount || 0);
//       const rawBalanceAmount = round2(newNetAmount - totalPaidAmount);
//       const newBalanceAmount = rawBalanceAmount < 0 ? 0 : rawBalanceAmount;
//       const excessPaidAmount =
//         rawBalanceAmount < 0 ? Math.abs(rawBalanceAmount) : 0;

//       const Product =
//         mappedleadData.length > 1
//           ? mappedleadData.find((item) => isPrimaryProduct(item))
//           : mappedleadData[0] || null;

//       const primaryProductId = Product?.productorServiceId || null;
//       const primaryProductModel =
//         Product?.productorServicemodel || "Product";

//       const existingPaymentHistory = Array.isArray(matchedDoc.paymentHistory)
//         ? matchedDoc.paymentHistory
//         : [];

//       const updatedPaymentHistory = existingPaymentHistory.map((history) => {
//         const paymentEntries = Array.isArray(history.paymentEntries)
//           ? history.paymentEntries
//           : [];

//         const updatedEntries = paymentEntries.map((entry) => {
//           const existingReceivedAmount = round2(entry?.receivedAmount || 0);

//           return {
//             ...(entry?.toObject ? entry.toObject() : entry),
//             productorServiceId: primaryProductId,
//             productorServicemodel: primaryProductModel,
//             receivedAmount: existingReceivedAmount,
//             netAmount: newNetAmount,
//             balanceAmount: Math.max(
//               round2(newNetAmount - existingReceivedAmount),
//               0
//             ),
//           };
//         });

//         return {
//           ...(history?.toObject ? history.toObject() : history),
//           paymentEntries: updatedEntries,
//         };
//       });

//       const taskName = await Task.findOne({ taskName: "Lead Closing" }).lean();

//       const activityLogEntry = {
//         submissionDate: new Date(),
//         submittedUser: userId,
//         submissiondoneByModel: role === "Admin" ? "Admin" : "Staff",
//         remarks: data?.remark,
//         taskBy: taskName?._id,
//       };

//       const leadUpdatePayload = {
//         ...data,
//         discountAmount,
//         leadConfirmed: true,
//         taxableAmount: newTaxableAmount,
//         taxAmount: newTaxAmount,
//         netAmount: newNetAmount,
//         balanceAmount: newBalanceAmount,
//         excessPaidAmount,
//         leadFor: mappedleadData,
//         paymentHistory: updatedPaymentHistory,
//       };

//       const updatedLead = await LeadMaster.findByIdAndUpdate(
//         objectId,
//         {
//           $push: { activityLog: activityLogEntry },
//           $set: leadUpdatePayload,
//         },
//         { new: true, runValidators: true, session }
//       );

//       if (!updatedLead) {
//         throw new Error("Lead update failed");
//       }

//       const custobjectId = new mongoose.Types.ObjectId(data.customerName);
//       const existingCustomer = await Customer.findById(custobjectId).session(
//         session
//       );

//       if (!existingCustomer) {
//         throw new Error("Customer not found");
//       }

//       const directLicenseNumbers = leadData
//         .filter((item) => isNonEmpty(item?.licenseNumber))
//         .map((item) => ({
//           licensenumber: normalizeLicenseNumberValue(item.licenseNumber),
//           productid:
//             item?.productid ||
//             item?.product_id ||
//             item?.productorServiceId ||
//             null,
//         }))
//         .filter((item) => item.licensenumber !== null);

//       const uniqueLicenseMap = new Map();
//       for (const item of directLicenseNumbers) {
//         if (!uniqueLicenseMap.has(String(item.licensenumber))) {
//           uniqueLicenseMap.set(String(item.licensenumber), item);
//         }
//       }

//       const uniqueLicenses = Array.from(uniqueLicenseMap.values());
//       const licenseNumbers = uniqueLicenses.map((item) => item.licensenumber);

//       if (licenseNumbers.length > 0) {
//         const existingLicenses = await License.find({
//           customerName: existingCustomer._id,
//           licensenumber: { $in: licenseNumbers },
//         })
//           .select("licensenumber")
//           .session(session);

//         const existingLicenseSet = new Set(
//           existingLicenses.map((item) => String(item.licensenumber))
//         );

//         const newLicenses = uniqueLicenses.filter(
//           (item) => !existingLicenseSet.has(String(item.licensenumber))
//         );

//         if (newLicenses.length > 0) {
//           const licenseDocs = newLicenses.map((item) => ({
//             products: item.productid,
//             customerName: existingCustomer._id,
//             licensenumber: item.licensenumber,
//           }));

//           await License.insertMany(licenseDocs, { session });
//         }
//       }

//       const customerDoc = await Customer.findById(data.customerName).session(
//         session
//       );

//       if (!customerDoc) {
//         throw new Error("Customer not found while saving selected products");
//       }

//       const selected = Array.isArray(customerDoc.selected)
//         ? customerDoc.selected.map((item) =>
//           item?.toObject ? item.toObject() : item
//         )
//         : [];

//       for (const item of mappedproductData) {
//         if (!isAdditionalService(item)) {
//           selected.push(item);
//           continue;
//         }

//         const existingIndex = selected.findIndex(
//           (s) =>
//             String(s?.product_id || "") === String(item?.product_id || "") &&
//             String(s?.productorservicetype || "").toLowerCase() ===
//             "additionalservice"
//         );

//         if (existingIndex === -1) {
//           selected.push(item);
//           continue;
//         }

//         const existing = selected[existingIndex];

//         const mergedLicenseNumbers = mergeLicenseNumbers(
//           existing?.licenseNumbers,
//           item?.licenseNumbers
//         );

//         const mergedTagged = mergeTaggedData(
//           existing?.taggeddata,
//           item?.taggeddata
//         );

//         selected[existingIndex] = {
//           ...existing,
//           ...item,
//           licenseNumbers: mergedLicenseNumbers,
//           taggeddata: mergedTagged,
//         };
//       }

//       customerDoc.mobile = data.mobile;
//       customerDoc.email = data.email;
//       customerDoc.landline = data.phone;
//       customerDoc.partner = data.partner;
//       // customerDoc.createdFrom = "Lead";
//       customerDoc.selected = selected;

//       const updatedcustomer = await customerDoc.save({ session });
//       if (!updatedcustomer) {
//         throw new Error("Customer update failed");
//       }

//       responsePayload = {
//         message: "Lead Closed successfully",
//         lead: updatedLead,
//         customer: updatedcustomer,
//         extra: {
//           scenario: onlyAdditionalServices
//             ? "additional-service-only"
//             : "primary-with-optional-additional-services",
//           newTaxableAmount,
//           newTaxAmount,
//           newNetAmount,
//           totalPaidAmount,
//           balanceAmount: newBalanceAmount,
//           excessPaidAmount,
//           primaryProductId,
//         },
//       };
//     });

//     return res.status(200).json(responsePayload);
//   } catch (error) {
//     console.error("Leadclosing error:", error);
//     return res.status(500).json({
//       message: error?.message || "Something went wrong while closing lead",
//       error: {
//         name: error?.name || "Error",
//         message: error?.message || "Unknown error",
//       },
//     });
//   } finally {
//     await session.endSession();
//   }
// };
export const Leadclosing = async (req, res) => {
  const session = await mongoose.startSession();

  const toNum = (value, fallback = 0) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const round2 = (value) => Number(toNum(value).toFixed(2));

  const isNonEmpty = (value) =>
    value !== null &&
    value !== undefined &&
    String(value).trim() !== "";

  const normalizeString = (value) =>
    value === null || value === undefined ? "" : String(value).trim();

  const isAdditionalService = (item) =>
    String(item?.productorservicetype || "").toLowerCase() ===
    "additionalservice";

  const isPrimaryProduct = (item) =>
    String(item?.productorservicetype || "").toLowerCase() ===
    "primaryproduct";

  const normalizeLicenseNumberValue = (value) => {
    if (!isNonEmpty(value)) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const buildCustomerTaggedDataForAdditionalOnly = (taggeddata = []) => {
    return (Array.isArray(taggeddata) ? taggeddata : []).map((tag) => {
      const totalNextDueAmount = round2(
        tag?.totalnextDueAmount ?? tag?.taxinclusiveamount ?? 0
      );
      const nextDueAmount = round2(
        tag?.nextDueAmount ?? tag?.taxexclusiveAmount ?? 0
      );

      const nextDueTax = toNum(tag?.nextDueTax ?? 0, 0);

      return {
        ...(tag?.toObject ? tag.toObject() : tag),
        licensenumber: normalizeLicenseNumberValue(tag?.licensenumber),
        nextDue: tag?.nextDue || "",
        hsn: nextDueTax,
        originalHsn: toNum(tag?.originalHsn ?? tag?.hsn ?? 0, 0),
        noofusers: toNum(tag?.noofusers, 0),
        serialNumber: tag?.serialNumber ?? null,
        nextDueAmount,
        totalnextDueAmount: totalNextDueAmount,
        taxexclusiveAmount: nextDueAmount,
        taxinclusiveamount: totalNextDueAmount,
        productAmount: totalNextDueAmount,
        leadAmount: totalNextDueAmount,
        totalleadAmount: totalNextDueAmount,
        leadTax: nextDueTax,
        nextDueTax,
        discountAmount: toNum(tag?.discountAmount, 0),
      };
    });
  };

  const buildLeadMasterTaggedData = (taggeddata = []) => {
    return (Array.isArray(taggeddata) ? taggeddata : []).map((tag) => ({
      ...(tag?.toObject ? tag.toObject() : tag),
      licensenumber: normalizeLicenseNumberValue(tag?.licensenumber),
      nextDue: tag?.nextDue || "",
      productAmount: round2(tag?.productAmount ?? tag?.totalnextDueAmount ?? 0),
      taxexclusiveAmount: round2(tag?.taxexclusiveAmount ?? 0),
      taxinclusiveamount: round2(tag?.taxinclusiveamount ?? 0),
      hsn: toNum(tag?.hsn, 0),
      noofusers: toNum(tag?.noofusers, 0),
      serialNumber: tag?.serialNumber ?? null,
      nextDueAmount: round2(tag?.nextDueAmount ?? 0),
      originalHsn: toNum(tag?.originalHsn ?? tag?.hsn, 0),
      leadAmount: round2(tag?.leadAmount ?? 0),
      totalleadAmount: round2(tag?.totalleadAmount ?? 0),
      totalnextDueAmount: round2(tag?.totalnextDueAmount ?? 0),
      leadTax: toNum(tag?.leadTax, 0),
      nextDueTax: toNum(tag?.nextDueTax, 0),
      discountAmount: toNum(tag?.discountAmount, 0),
    }));
  };

  const mergeLicenseNumbers = (existingLicenses = [], incomingLicenses = []) => {
    const merged = [
      ...(Array.isArray(existingLicenses) ? existingLicenses : []),
    ].map((item) => (item?.toObject ? item.toObject() : item));

    for (const license of Array.isArray(incomingLicenses) ? incomingLicenses : []) {
      const normalizedLicense = {
        ...(license?.toObject ? license.toObject() : license),
        licenseNumber: normalizeLicenseNumberValue(license?.licenseNumber),
        productorServiceId: license?.productorServiceId || null,
        productorServiceName: license?.productorServiceName || "",
        sourceIndex: license?.sourceIndex,
      };

      const exists = merged.some(
        (l) =>
          String(l?.licenseNumber ?? "") ===
          String(normalizedLicense.licenseNumber ?? "") &&
          String(l?.productorServiceId || "") ===
          String(normalizedLicense.productorServiceId || "")
      );

      if (!exists) merged.push(normalizedLicense);
    }

    return merged;
  };

  // Merges incoming taggeddata into existing taggeddata by `licensenumber`.
  // In addition to the merged array, it now also returns the list of
  // pre-overwrite records ("overwritten") so callers can preserve them in
  // `previousTaggedData` instead of silently losing the old data.
  const mergeTaggedData = (existingTagged = [], incomingTagged = []) => {
    const merged = [
      ...(Array.isArray(existingTagged) ? existingTagged : []),
    ].map((item) => (item?.toObject ? item.toObject() : item));

    const overwritten = [];

    for (const tag of Array.isArray(incomingTagged) ? incomingTagged : []) {
      const normalizedTag = {
        ...(tag?.toObject ? tag.toObject() : tag),
        licensenumber: normalizeLicenseNumberValue(tag?.licensenumber),
      };

      const index = merged.findIndex(
        (t) =>
          String(t?.licensenumber ?? "") ===
          String(normalizedTag.licensenumber ?? "")
      );

      if (index === -1) {
        merged.push(normalizedTag);
      } else {
        // Snapshot the exact pre-overwrite state before it gets replaced.
        const previousRecord = { ...merged[index] };
        overwritten.push(previousRecord);

        merged[index] = {
          ...merged[index],
          ...normalizedTag,
        };
      }
    }

    return { taggeddata: merged, overwritten };
  };

  try {
    const { data, leadData, userId, role } = req.body;
    const { docID } = req.query;

    if (!docID) {
      return res.status(400).json({ message: "docID is required" });
    }

    if (!data) {
      return res.status(400).json({ message: "data is required" });
    }

    if (!Array.isArray(leadData) || leadData.length === 0) {
      return res
        .status(400)
        .json({ message: "leadData must be a non-empty array" });
    }

    if (!data?.customerName) {
      return res.status(400).json({ message: "Customer id is required" });
    }

    const objectId = new mongoose.Types.ObjectId(docID);
    let responsePayload = null;

    await session.withTransaction(async () => {
      const matchedDoc = await LeadMaster.findById(objectId).session(session);
      if (!matchedDoc) {
        throw new Error("Lead not found");
      }

      const hasPrimaryProduct = leadData.some(isPrimaryProduct);
      const onlyAdditionalServices =
        !hasPrimaryProduct && leadData.every(isAdditionalService);

      const discountAmount = round2(data?.discamnt || 0);
      const inputTaxableAmount = round2(data?.taxableAmount || 0);
      const inputTaxAmount = round2(data?.taxAmount || 0);
      const inputNetAmount = round2(data?.netAmount || 0);

      const grossAmount = round2(
        leadData.reduce((sum, item) => sum + toNum(item?.netAmount, 0), 0)
      );

      let newTaxableAmount = inputTaxableAmount;
      let newTaxAmount = inputTaxAmount;
      let newNetAmount = inputNetAmount;

      let adjustedItems = [];

      if (onlyAdditionalServices) {
        adjustedItems = leadData.map((item) => {
          const originalProductPrice = round2(
            item?.actualproductPrice ?? item?.productPrice ?? 0
          );
          const originalNetAmount = round2(
            item?.actualNetAmount ?? item?.netAmount ?? 0
          );
          const originalTaxAmount = round2(
            originalNetAmount - originalProductPrice
          );

          return {
            item,
            originalNetAmount,
            finalNetAmount: originalNetAmount,
            scaledProductPrice: originalProductPrice,
            scaledTaxAmount: originalTaxAmount,
          };
        });

        newTaxableAmount = inputTaxableAmount;
        newTaxAmount = inputTaxAmount;
        newNetAmount = inputNetAmount;
      } else {
        newNetAmount = round2(
          data?.netAmount ?? grossAmount - discountAmount
        );

        let runningTotal = 0;

        adjustedItems = leadData.map((item, index) => {
          const originalNetAmount = round2(item?.netAmount || 0);
          const ratio = grossAmount > 0 ? originalNetAmount / grossAmount : 0;

          let finalNetAmount = round2(
            originalNetAmount - ratio * discountAmount
          );

          const isLastItem = index === leadData.length - 1;
          if (isLastItem) {
            finalNetAmount = round2(newNetAmount - runningTotal);
          }

          runningTotal = round2(runningTotal + finalNetAmount);

          const originalProductPrice = round2(item?.productPrice || 0);
          const scaleFactor =
            originalNetAmount > 0 ? finalNetAmount / originalNetAmount : 0;

          const scaledProductPrice = round2(originalProductPrice * scaleFactor);
          const scaledTaxAmount = round2(finalNetAmount - scaledProductPrice);

          return {
            item,
            originalNetAmount,
            finalNetAmount,
            scaledProductPrice,
            scaledTaxAmount,
          };
        });

        newTaxableAmount = inputTaxableAmount;
        newTaxAmount = inputTaxAmount;
      }

      const mappedleadData = adjustedItems.map(
        ({ item, finalNetAmount, scaledProductPrice, scaledTaxAmount }) => ({
          licenseNumber: normalizeLicenseNumberValue(item?.licenseNumber),
          licenseNumbers: Array.isArray(item?.licenseNumbers)
            ? item.licenseNumbers.map((license) => ({
              ...(license?.toObject ? license.toObject() : license),
              licenseNumber: normalizeLicenseNumberValue(license?.licenseNumber),
              productorServiceId: license?.productorServiceId || null,
              productorServiceName: license?.productorServiceName || "",
              sourceIndex: license?.sourceIndex,
            }))
            : [],
          taggeddata: buildLeadMasterTaggedData(item?.taggeddata),
          productorServiceName: item?.productorServiceName || "",
          productorServiceId: item?.productorServiceId || null,
          productorServicemodel: item?.itemType || "",
          price: item?.price ?? null,
          productPrice: scaledProductPrice,
          hsn: toNum(item?.hsn || 0, 0),
          netAmount: round2(finalNetAmount),
          taxAmount: round2(scaledTaxAmount),
          productorservicetype: item?.productorservicetype || "",
          company_id: item?.company_id || null,
          branch_id: item?.branch_id || null,
          applicationDate: item?.applicationDate || "",
          softwareTrade: item?.softwareTrade || "",
          nextDue: item?.nextDue || "",
          noofusers: toNum(item?.noofusers, 0),
          isActive: item?.status ?? item?.isActive,
          version: item?.version,
          status: item?.status,
          actualproductPrice: toNum(item?.actualproductPrice, 0),
          actualHsn: toNum(item?.actualHsn, 0),
          actualNetAmount: toNum(item?.actualNetAmount, 0),
          parentPrimaryProductId: item?.parentPrimaryProductId || null,
          isDefaultService: !!item?.isDefaultService,
        })
      );

      const mappedproductData = adjustedItems.map(
        ({ item, finalNetAmount, scaledProductPrice, scaledTaxAmount }) => {
          const normalizedTaggedData = buildCustomerTaggedDataForAdditionalOnly(item?.taggeddata)


          return {
            company_id: item?.company_id || null,
            branch_id: item?.branch_id || null,
            product_id: item?.productorServiceId || null,
            productName: item?.productorServiceName || "",
            productorServiceName: item?.productorServiceName || "",
            productorservicetype: item?.productorservicetype || "",
            licensenumber: normalizeLicenseNumberValue(item?.licenseNumber),
            noofusers: toNum(item?.noofusers, 0),
            applicationDate: item?.applicationDate || "",
            productAmount: round2(
              onlyAdditionalServices
                ? item?.actualNetAmount ?? item?.netAmount ?? finalNetAmount
                : finalNetAmount
            ),
            productPrice: round2(
              onlyAdditionalServices
                ? item?.actualproductPrice ??
                item?.productPrice ??
                scaledProductPrice
                : scaledProductPrice
            ),
            taxAmount: round2(
              onlyAdditionalServices
                ? (item?.actualNetAmount ?? item?.netAmount ?? finalNetAmount) -
                (item?.actualproductPrice ??
                  item?.productPrice ??
                  scaledProductPrice)
                : scaledTaxAmount
            ),
            hsn: toNum(
              onlyAdditionalServices ? item?.actualHsn ?? item?.hsn : item?.hsn,
              0
            ),
            softwareTrade: item?.softwareTrade || "",
            nextDue: item?.nextDue || "",
            licenseNumbers: Array.isArray(item?.licenseNumbers)
              ? item.licenseNumbers.map((license) => ({
                ...(license?.toObject ? license.toObject() : license),
                licenseNumber: normalizeLicenseNumberValue(license?.licenseNumber),
                productorServiceId: license?.productorServiceId || null,
                productorServiceName: license?.productorServiceName || "",
                sourceIndex: license?.sourceIndex,
              }))
              : [],
            taggeddata: normalizedTaggedData,
            // Newly created additional-service entries start with an empty
            // previousTaggedData array. If the incoming payload already
            // carries one (e.g. re-submission), it's preserved as-is.
            previousTaggedData: Array.isArray(item?.previousTaggedData)
              ? item.previousTaggedData
              : [],
            isActive: item?.status ?? item?.isActive,
            version: item?.version,
            parentPrimaryProductId: item?.parentPrimaryProductId || null,
            isDefaultService: !!item?.isDefaultService,
            createdFrom: "Lead",
            productAddedDate: new Date(),
          };
        }
      );

      const totalPaidAmount = round2(matchedDoc.totalPaidAmount || 0);
      const rawBalanceAmount = round2(newNetAmount - totalPaidAmount);
      const newBalanceAmount = rawBalanceAmount < 0 ? 0 : rawBalanceAmount;
      const excessPaidAmount =
        rawBalanceAmount < 0 ? Math.abs(rawBalanceAmount) : 0;

      const Product =
        mappedleadData.length > 1
          ? mappedleadData.find((item) => isPrimaryProduct(item))
          : mappedleadData[0] || null;

      const primaryProductId = Product?.productorServiceId || null;
      const primaryProductModel =
        Product?.productorServicemodel || "Product";

      const existingPaymentHistory = Array.isArray(matchedDoc.paymentHistory)
        ? matchedDoc.paymentHistory
        : [];

      const updatedPaymentHistory = existingPaymentHistory.map((history) => {
        const paymentEntries = Array.isArray(history.paymentEntries)
          ? history.paymentEntries
          : [];

        const updatedEntries = paymentEntries.map((entry) => {
          const existingReceivedAmount = round2(entry?.receivedAmount || 0);

          return {
            ...(entry?.toObject ? entry.toObject() : entry),
            productorServiceId: primaryProductId,
            productorServicemodel: primaryProductModel,
            receivedAmount: existingReceivedAmount,
            netAmount: newNetAmount,
            balanceAmount: Math.max(
              round2(newNetAmount - existingReceivedAmount),
              0
            ),
          };
        });

        return {
          ...(history?.toObject ? history.toObject() : history),
          paymentEntries: updatedEntries,
        };
      });

      const taskName = await Task.findOne({ taskName: "Lead Closing" }).lean();

      const activityLogEntry = {
        submissionDate: new Date(),
        submittedUser: userId,
        submissiondoneByModel: role === "Admin" ? "Admin" : "Staff",
        remarks: data?.remark,
        taskBy: taskName?._id,
      };

      const leadUpdatePayload = {
        ...data,
        leadClosedDate: isNonEmpty(data?.leadClosedDate)
          ? data.leadClosedDate
          : new Date(),
        discountAmount,
        leadConfirmed: true,
        taxableAmount: newTaxableAmount,
        taxAmount: newTaxAmount,
        netAmount: newNetAmount,
        balanceAmount: newBalanceAmount,
        excessPaidAmount,
        leadFor: mappedleadData,
        paymentHistory: updatedPaymentHistory,
      };

      const updatedLead = await LeadMaster.findByIdAndUpdate(
        objectId,
        {
          $push: { activityLog: activityLogEntry },
          $set: leadUpdatePayload,
        },
        { new: true, runValidators: true, session }
      );

      if (!updatedLead) {
        throw new Error("Lead update failed");
      }

      const custobjectId = new mongoose.Types.ObjectId(data.customerName);
      const existingCustomer = await Customer.findById(custobjectId).session(
        session
      );

      if (!existingCustomer) {
        throw new Error("Customer not found");
      }

      const directLicenseNumbers = leadData
        .filter((item) => isNonEmpty(item?.licenseNumber))
        .map((item) => ({
          licensenumber: normalizeLicenseNumberValue(item.licenseNumber),
          productid:
            item?.productid ||
            item?.product_id ||
            item?.productorServiceId ||
            null,
        }))
        .filter((item) => item.licensenumber !== null);

      const uniqueLicenseMap = new Map();
      for (const item of directLicenseNumbers) {
        if (!uniqueLicenseMap.has(String(item.licensenumber))) {
          uniqueLicenseMap.set(String(item.licensenumber), item);
        }
      }

      const uniqueLicenses = Array.from(uniqueLicenseMap.values());
      const licenseNumbers = uniqueLicenses.map((item) => item.licensenumber);

      if (licenseNumbers.length > 0) {
        const existingLicenses = await License.find({
          customerName: existingCustomer._id,
          licensenumber: { $in: licenseNumbers },
        })
          .select("licensenumber")
          .session(session);

        const existingLicenseSet = new Set(
          existingLicenses.map((item) => String(item.licensenumber))
        );

        const newLicenses = uniqueLicenses.filter(
          (item) => !existingLicenseSet.has(String(item.licensenumber))
        );

        if (newLicenses.length > 0) {
          const licenseDocs = newLicenses.map((item) => ({
            products: item.productid,
            customerName: existingCustomer._id,
            licensenumber: item.licensenumber,
          }));

          await License.insertMany(licenseDocs, { session });
        }
      }

      const customerDoc = await Customer.findById(data.customerName).session(
        session
      );

      if (!customerDoc) {
        throw new Error("Customer not found while saving selected products");
      }

      const selected = Array.isArray(customerDoc.selected)
        ? customerDoc.selected.map((item) =>
          item?.toObject ? item.toObject() : item
        )
        : [];

      for (const item of mappedproductData) {
        if (!isAdditionalService(item)) {
          selected.push(item);
          continue;
        }

        const existingIndex = selected.findIndex(
          (s) =>
            String(s?.product_id || "") === String(item?.product_id || "") &&
            String(s?.productorservicetype || "").toLowerCase() ===
            "additionalservice"
        );

        if (existingIndex === -1) {
          // Brand new additional service for this customer: nothing was
          // overwritten yet, so previousTaggedData stays empty (already
          // initialized to [] in mappedproductData above).
          selected.push(item);
          continue;
        }

        const existing = selected[existingIndex];

        const mergedLicenseNumbers = mergeLicenseNumbers(
          existing?.licenseNumbers,
          item?.licenseNumbers
        );

        const { taggeddata: mergedTagged, overwritten } = mergeTaggedData(
          existing?.taggeddata,
          item?.taggeddata
        );

        // Preserve whatever previousTaggedData already existed, and append
        // only the records that were actually overwritten in this pass
        // (matched by licensenumber). Existing history is never dropped or
        // rewritten wholesale.
        const existingPreviousTaggedData = Array.isArray(
          existing?.previousTaggedData
        )
          ? existing.previousTaggedData.map((p) =>
            p?.toObject ? p.toObject() : p
          )
          : [];

        const mergedPreviousTaggedData = [
          ...existingPreviousTaggedData,
          ...overwritten,
        ];

        selected[existingIndex] = {
          ...existing,
          ...item,
          licenseNumbers: mergedLicenseNumbers,
          taggeddata: mergedTagged,
          previousTaggedData: mergedPreviousTaggedData,
        };
      }

      customerDoc.mobile = data.mobile;
      customerDoc.email = data.email;
      customerDoc.landline = data.phone;
      customerDoc.partner = data.partner;
      // customerDoc.createdFrom = "Lead";
      customerDoc.selected = selected;

      const updatedcustomer = await customerDoc.save({ session });
      if (!updatedcustomer) {
        throw new Error("Customer update failed");
      }

      responsePayload = {
        message: "Lead Closed successfully",
        lead: updatedLead,
        customer: updatedcustomer,
        extra: {
          scenario: onlyAdditionalServices
            ? "additional-service-only"
            : "primary-with-optional-additional-services",
          newTaxableAmount,
          newTaxAmount,
          newNetAmount,
          totalPaidAmount,
          balanceAmount: newBalanceAmount,
          excessPaidAmount,
          primaryProductId,
        },
      };
    });

    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error("Leadclosing error:", error);
    return res.status(500).json({
      message: error?.message || "Something went wrong while closing lead",
      error: {
        name: error?.name || "Error",
        message: error?.message || "Unknown error",
      },
    });
  } finally {
    await session.endSession();
  }
};



export const UpdateLeadRegister = async (req, res) => {
  const session = await mongoose.startSession();

  const isValidValue = (value) =>
    value !== undefined &&
    value !== null &&
    value !== "null" &&
    value !== "undefined" &&
    String(value).trim() !== "";

  const toNumber = (value) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const toPlainObject = (value) =>
    value && typeof value.toObject === "function" ? value.toObject() : value;

  const toObjectIdOrNull = (value) => {
    if (!isValidValue(value)) return null;
    return mongoose.Types.ObjectId.isValid(value)
      ? new mongoose.Types.ObjectId(value)
      : null;
  };

  const safeString = (value) => (isValidValue(value) ? String(value).trim() : "");

  // Normalizes a license number to a comparable Number, or null when absent/invalid.
  const toLicenseNumber = (value) => {
    if (!isValidValue(value)) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };

  const buildItemIdentityKeys = (item = {}) => {
    const id = item.productorServiceId ? String(item.productorServiceId) : "";
    const model = safeString(item.productorServicemodel || item.itemType);
    const licenseNumber = safeString(item.licenseNumber);
    const serviceName = safeString(item.productorServiceName).toLowerCase();
    const serviceType = safeString(item.productorservicetype).toLowerCase();

    const keys = [];

    if (id && model) keys.push(`ID_MODEL:${id}:${model}`);
    if (licenseNumber) keys.push(`LICENSE:${licenseNumber}`);
    if (serviceName && serviceType) keys.push(`NAME_TYPE:${serviceName}:${serviceType}`);
    if (serviceName) keys.push(`NAME:${serviceName}`);

    return keys;
  };

  const findBestMatchedLeadItem = (sourceItem, newItems, usedIndexes = new Set()) => {
    const keys = buildItemIdentityKeys(sourceItem);

    for (const key of keys) {
      const index = newItems.findIndex((item, idx) => {
        if (usedIndexes.has(idx)) return false;
        return buildItemIdentityKeys(item).includes(key);
      });

      if (index !== -1) {
        usedIndexes.add(index);
        return newItems[index];
      }
    }

    const fallbackIndex = newItems.findIndex((_, idx) => !usedIndexes.has(idx));
    if (fallbackIndex !== -1) {
      usedIndexes.add(fallbackIndex);
      return newItems[fallbackIndex];
    }

    return null;
  };

  const round2 = (value) => Number(toNumber(value).toFixed(2));

  // Normalizes an additional-service taggeddata array the same way
  // Leadclosing does when writing it onto Customer.selected, so tagged
  // records added/merged here stay consistent with records created at
  // lead-closing time.
  const buildCustomerTaggedDataForAdditionalOnly = (taggeddata = []) => {
    return (Array.isArray(taggeddata) ? taggeddata : []).map((tag) => {
      const totalNextDueAmount = round2(
        tag?.totalnextDueAmount ?? tag?.taxinclusiveamount ?? 0
      );
      const nextDueAmount = round2(
        tag?.nextDueAmount ?? tag?.taxexclusiveAmount ?? 0
      );
      const nextDueTax = toNumber(tag?.nextDueTax ?? 0);

      return {
        ...(tag?.toObject ? tag.toObject() : tag),
        licensenumber: toLicenseNumber(tag?.licensenumber),
        nextDue: tag?.nextDue || "",
        hsn: nextDueTax,
        originalHsn: toNumber(tag?.originalHsn ?? tag?.hsn ?? 0),
        noofusers: toNumber(tag?.noofusers),
        serialNumber: tag?.serialNumber ?? null,
        nextDueAmount,
        totalnextDueAmount: totalNextDueAmount,
        taxexclusiveAmount: nextDueAmount,
        taxinclusiveamount: totalNextDueAmount,
        productAmount: totalNextDueAmount,
        leadAmount: totalNextDueAmount,
        totalleadAmount: totalNextDueAmount,
        leadTax: nextDueTax,
        nextDueTax,
        discountAmount: toNumber(tag?.discountAmount),
      };
    });
  };

  const mergeLicenseNumbers = (existingLicenses = [], incomingLicenses = []) => {
    const merged = [
      ...(Array.isArray(existingLicenses) ? existingLicenses : []),
    ].map((item) => (item?.toObject ? item.toObject() : item));

    for (const license of Array.isArray(incomingLicenses) ? incomingLicenses : []) {
      const normalizedLicense = {
        ...(license?.toObject ? license.toObject() : license),
        licenseNumber: toLicenseNumber(license?.licenseNumber),
        productorServiceId: license?.productorServiceId || null,
        productorServiceName: license?.productorServiceName || "",
        sourceIndex: license?.sourceIndex,
      };

      const exists = merged.some(
        (l) =>
          String(l?.licenseNumber ?? "") ===
          String(normalizedLicense.licenseNumber ?? "") &&
          String(l?.productorServiceId || "") ===
          String(normalizedLicense.productorServiceId || "")
      );

      if (!exists) merged.push(normalizedLicense);
    }

    return merged;
  };

  // Merges incoming taggeddata into existing taggeddata by `licensenumber`,
  // same semantics as Leadclosing's mergeTaggedData: also returns the
  // pre-overwrite records so the caller can preserve them in
  // previousTaggedData instead of losing them.
  const mergeTaggedData = (existingTagged = [], incomingTagged = []) => {
    const merged = [
      ...(Array.isArray(existingTagged) ? existingTagged : []),
    ].map((item) => (item?.toObject ? item.toObject() : item));

    const overwritten = [];

    for (const tag of Array.isArray(incomingTagged) ? incomingTagged : []) {
      const normalizedTag = {
        ...(tag?.toObject ? tag.toObject() : tag),
        licensenumber: toLicenseNumber(tag?.licensenumber),
      };

      const index = merged.findIndex(
        (t) => toLicenseNumber(t?.licensenumber) === normalizedTag.licensenumber
      );

      if (index === -1) {
        merged.push(normalizedTag);
      } else {
        const previousRecord = { ...merged[index] };
        overwritten.push(previousRecord);

        merged[index] = {
          ...merged[index],
          ...normalizedTag,
        };
      }
    }

    return { taggeddata: merged, overwritten };
  };

  // Reverses the products/additional-service tagged data that Leadclosing
  // previously wrote onto the PREVIOUS customer for this lead, so that when
  // a closed lead is edited and reassigned to a different customer, the old
  // customer no longer carries products/licenses that belonged to this lead.
  //
  // - Primary product entries (matched by licensenumber) are removed outright
  //   from the previous customer's `selected` array.
  // - Additional service entries are NOT removed outright. For each license
  //   number this lead had tagged, we look at that service's
  //   `previousTaggedData` (the history of records overwritten by
  //   Leadclosing merges) and restore the most recent prior record back into
  //   `taggeddata`, removing it from `previousTaggedData`. If there is no
  //   prior record for that license (meaning this lead created it fresh),
  //   the license's taggeddata entry is removed instead. If an additional
  //   service ends up with no taggeddata left, the whole entry is dropped.
  const reversePreviousCustomerProducts = async ({
    previousCustomerId,
    oldLeadFor,
    dbSession,
  }) => {
    console.log(
      "[reverse] called | previousCustomerId:", previousCustomerId,
      "| oldLeadFor count:", Array.isArray(oldLeadFor) ? oldLeadFor.length : 0
    );

    if (!isValidValue(previousCustomerId) || !mongoose.Types.ObjectId.isValid(previousCustomerId)) {
      console.log("[reverse] SKIPPED - invalid/missing previousCustomerId:", previousCustomerId);
      return;
    }

    const previousCustomerDoc = await Customer.findById(previousCustomerId).session(dbSession);
    if (!previousCustomerDoc) {
      console.log("[reverse] SKIPPED - previous customer not found for id:", previousCustomerId);
      return;
    }

    const previousSelected = Array.isArray(previousCustomerDoc.selected)
      ? previousCustomerDoc.selected.map((item) => toPlainObject(item))
      : [];

    console.log(
      "[reverse] previousCustomer found:", String(previousCustomerDoc._id),
      "| selected.length BEFORE:", previousSelected.length
    );

    for (const oldItem of Array.isArray(oldLeadFor) ? oldLeadFor : []) {
      const oldType = safeString(oldItem?.productorservicetype).toLowerCase();
      const oldLicenseNumber = toLicenseNumber(oldItem?.licenseNumber);
      const oldProductId = oldItem?.productorServiceId ? String(oldItem.productorServiceId) : "";

      console.log(
        "[reverse] processing oldItem -> type:", oldType,
        "| licenseNumber:", oldLicenseNumber,
        "| productId:", oldProductId
      );

      if (oldType === "primaryproduct") {
        if (oldLicenseNumber === null) {
          console.log("[reverse] primary SKIP - no license number on oldItem");
          continue;
        }

        // Strict match: license number AND type both agree.
        let removeIndex = previousSelected.findIndex(
          (sel) =>
            toLicenseNumber(sel?.licensenumber) === oldLicenseNumber &&
            safeString(sel?.productorservicetype).toLowerCase() === "primaryproduct"
        );

        if (removeIndex === -1) {
          // Fallback: match by license number alone. Covers cases where
          // productorservicetype is missing/blank/differently-cased on the
          // customer's selected primary entry.
          const looseIndex = previousSelected.findIndex(
            (sel) => toLicenseNumber(sel?.licensenumber) === oldLicenseNumber
          );

          if (looseIndex !== -1) {
            console.log(
              "[reverse] primary STRICT match failed, LOOSE license-only match found at index",
              looseIndex,
              "| sel.productorservicetype was:",
              previousSelected[looseIndex]?.productorservicetype
            );
            removeIndex = looseIndex;
          }
        }

        console.log("[reverse] primary removeIndex resolved to:", removeIndex);

        if (removeIndex !== -1) {
          previousSelected.splice(removeIndex, 1);
          console.log(
            "[reverse] primary REMOVED license", oldLicenseNumber,
            "| selected.length now:", previousSelected.length
          );
        } else {
          console.log(
            "[reverse] primary NOT FOUND for license", oldLicenseNumber,
            "- nothing removed. Available primary licenses in previousSelected:",
            previousSelected
              .filter((s) => safeString(s?.productorservicetype).toLowerCase() === "primaryproduct")
              .map((s) => s?.licensenumber)
          );
        }

        continue;
      }

      if (oldType === "additionalservice") {
        const serviceIndex = previousSelected.findIndex(
          (sel) =>
            String(sel?.product_id || "") === oldProductId &&
            safeString(sel?.productorservicetype).toLowerCase() === "additionalservice"
        );

        console.log("[reverse] additionalservice serviceIndex:", serviceIndex, "for productId:", oldProductId);

        if (serviceIndex === -1) {
          console.log(
            "[reverse] additionalservice NOT FOUND for productId", oldProductId,
            "- nothing reverted. Available service product_ids in previousSelected:",
            previousSelected
              .filter((s) => safeString(s?.productorservicetype).toLowerCase() === "additionalservice")
              .map((s) => String(s?.product_id || ""))
          );
          continue;
        }

        const serviceItem = { ...previousSelected[serviceIndex] };

        const taggeddata = Array.isArray(serviceItem.taggeddata)
          ? serviceItem.taggeddata.map((t) => toPlainObject(t))
          : [];

        const previousTaggedData = Array.isArray(serviceItem.previousTaggedData)
          ? serviceItem.previousTaggedData.map((t) => toPlainObject(t))
          : [];

        const licenseNumbers = Array.isArray(serviceItem.licenseNumbers)
          ? serviceItem.licenseNumbers.map((l) => toPlainObject(l))
          : [];

        // Collect every license number this lead touched for this service:
        // the item-level licenseNumber plus every taggeddata record's
        // licensenumber recorded on the OLD leadFor entry.
        const licenseNumbersToRevert = new Set();
        if (oldLicenseNumber !== null) {
          licenseNumbersToRevert.add(oldLicenseNumber);
        }
        for (const tag of Array.isArray(oldItem?.taggeddata) ? oldItem.taggeddata : []) {
          const tagLicense = toLicenseNumber(tag?.licensenumber);
          if (tagLicense !== null) {
            licenseNumbersToRevert.add(tagLicense);
          }
        }

        for (const licenseNumber of licenseNumbersToRevert) {
          const taggedIndex = taggeddata.findIndex(
            (t) => toLicenseNumber(t?.licensenumber) === licenseNumber
          );

          // Find the most recently overwritten previous record for this
          // license (last match in the array), representing the state
          // immediately before this lead's overwrite.
          let prevIndex = -1;
          for (let i = previousTaggedData.length - 1;i >= 0;i--) {
            if (toLicenseNumber(previousTaggedData[i]?.licensenumber) === licenseNumber) {
              prevIndex = i;
              break;
            }
          }

          if (prevIndex !== -1) {
            const restoredRecord = previousTaggedData[prevIndex];

            if (taggedIndex !== -1) {
              taggeddata[taggedIndex] = restoredRecord;
            } else {
              taggeddata.push(restoredRecord);
            }

            previousTaggedData.splice(prevIndex, 1);
          } else if (taggedIndex !== -1) {
            taggeddata.splice(taggedIndex, 1);
          }

          const licenseNumbersIndex = licenseNumbers.findIndex(
            (l) => toLicenseNumber(l?.licenseNumber) === licenseNumber
          );
          if (licenseNumbersIndex !== -1 && prevIndex === -1) {
            licenseNumbers.splice(licenseNumbersIndex, 1);
          }
        }

        serviceItem.taggeddata = taggeddata;
        serviceItem.previousTaggedData = previousTaggedData;
        serviceItem.licenseNumbers = licenseNumbers;

        if (taggeddata.length === 0) {
          previousSelected.splice(serviceIndex, 1);
        } else {
          previousSelected[serviceIndex] = serviceItem;
        }
      }
    }

    console.log("[reverse] selected.length AFTER processing:", previousSelected.length);

    previousCustomerDoc.selected = previousSelected;
    const saved = await previousCustomerDoc.save({ session: dbSession });
    console.log(
      "[reverse] SAVE complete for customer", String(saved._id),
      "| final selected.length in saved doc:", Array.isArray(saved.selected) ? saved.selected.length : "n/a"
    );
  };

  // Syncs the CURRENT customer's `selected` products/services with the
  // latest leadData for a closed-lead edit. This mirrors what Leadclosing
  // does when a lead is first closed:
  // - primary products are added if not already present (matched by
  //   licensenumber + type), never duplicated.
  // - additional services are merged by product_id: if new for this
  //   customer, added fresh with previousTaggedData: []; if already
  //   present, taggeddata is merged by licensenumber and whatever gets
  //   overwritten is appended onto previousTaggedData (never dropped).
  const syncCurrentCustomerProducts = async ({ customerId, leadItems, dbSession }) => {
    console.log(
      "[sync] called | customerId:", customerId,
      "| leadItems count:", Array.isArray(leadItems) ? leadItems.length : 0
    );

    if (!isValidValue(customerId) || !mongoose.Types.ObjectId.isValid(customerId)) {
      console.log("[sync] SKIPPED - invalid/missing customerId:", customerId);
      return;
    }

    const customerDoc = await Customer.findById(customerId).session(dbSession);
    if (!customerDoc) {
      console.log("[sync] SKIPPED - customer not found for id:", customerId);
      return;
    }

    const selected = Array.isArray(customerDoc.selected)
      ? customerDoc.selected.map((item) => toPlainObject(item))
      : [];

    console.log(
      "[sync] customer found:", String(customerDoc._id),
      "| selected.length BEFORE:", selected.length
    );

    const mappedProductDataForCustomer = (Array.isArray(leadItems) ? leadItems : []).map(
      (item) => {
        const netAmount = toNumber(item?.netAmount);
        const productPrice = toNumber(item?.productPrice);

        return {
          company_id: toObjectIdOrNull(item?.company_id),
          branch_id: toObjectIdOrNull(item?.branch_id),
          product_id: toObjectIdOrNull(item?.productorServiceId),
          productName: safeString(item?.productorServiceName),
          productorServiceName: safeString(item?.productorServiceName),
          productorservicetype: safeString(item?.productorservicetype),
          licensenumber: toLicenseNumber(item?.licenseNumber),
          noofusers: toNumber(item?.noofusers),
          applicationDate: item?.applicationDate || "",
          productAmount: netAmount,
          productPrice,
          taxAmount: round2(netAmount - productPrice),
          hsn: toNumber(item?.hsn),
          softwareTrade: item?.softwareTrade || "",
          nextDue: item?.nextDue || "",
          licenseNumbers: Array.isArray(item?.licenseNumbers)
            ? item.licenseNumbers.map((license) => ({
              ...(license?.toObject ? license.toObject() : license),
              licenseNumber: toLicenseNumber(license?.licenseNumber),
              productorServiceId: license?.productorServiceId || null,
              productorServiceName: license?.productorServiceName || "",
              sourceIndex: license?.sourceIndex,
            }))
            : [],
          taggeddata: buildCustomerTaggedDataForAdditionalOnly(item?.taggeddata),
          // A brand-new additional service starts with no history. If the
          // incoming payload already carries previousTaggedData (e.g. it
          // originated from a customer.selected round-trip), keep it.
          previousTaggedData: Array.isArray(item?.previousTaggedData)
            ? item.previousTaggedData
            : [],
          isActive: item?.status ?? item?.isActive,
          version: item?.version,
          parentPrimaryProductId: toObjectIdOrNull(item?.parentPrimaryProductId),
          isDefaultService: !!item?.isDefaultService,
          createdFrom: "Lead",
          productAddedDate: new Date(),
        };
      }
    );

    for (const item of mappedProductDataForCustomer) {
      const itemType = safeString(item?.productorservicetype).toLowerCase();

      if (itemType !== "additionalservice") {
        const alreadyExists = selected.some(
          (s) =>
            item.licensenumber !== null &&
            toLicenseNumber(s?.licensenumber) === item.licensenumber &&
            safeString(s?.productorservicetype).toLowerCase() === itemType
        );

        if (alreadyExists) {
          console.log(
            "[sync] primary/other ALREADY EXISTS for license", item.licensenumber,
            "- skipping duplicate add"
          );
          continue;
        }

        selected.push(item);
        console.log(
          "[sync] primary/other ADDED license", item.licensenumber,
          "| product:", item.productorServiceName
        );
        continue;
      }

      const existingIndex = selected.findIndex(
        (s) =>
          String(s?.product_id || "") === String(item?.product_id || "") &&
          safeString(s?.productorservicetype).toLowerCase() === "additionalservice"
      );

      if (existingIndex === -1) {
        selected.push(item);
        console.log(
          "[sync] additionalservice NEW entry added for product:", String(item.product_id)
        );
        continue;
      }

      const existing = selected[existingIndex];

      const mergedLicenseNumbers = mergeLicenseNumbers(
        existing?.licenseNumbers,
        item?.licenseNumbers
      );

      const { taggeddata: mergedTagged, overwritten } = mergeTaggedData(
        existing?.taggeddata,
        item?.taggeddata
      );

      const existingPreviousTaggedData = Array.isArray(existing?.previousTaggedData)
        ? existing.previousTaggedData.map((p) => (p?.toObject ? p.toObject() : p))
        : [];

      const mergedPreviousTaggedData = [
        ...existingPreviousTaggedData,
        ...overwritten,
      ];

      selected[existingIndex] = {
        ...existing,
        ...item,
        licenseNumbers: mergedLicenseNumbers,
        taggeddata: mergedTagged,
        previousTaggedData: mergedPreviousTaggedData,
      };

      console.log(
        "[sync] additionalservice MERGED for product:", String(item.product_id),
        "| overwritten count:", overwritten.length
      );
    }

    customerDoc.selected = selected;
    const saved = await customerDoc.save({ session: dbSession });
    console.log(
      "[sync] SAVE complete for customer", String(saved._id),
      "| final selected.length:", Array.isArray(saved.selected) ? saved.selected.length : "n/a"
    );
  };

  try {
    const transactionResult = await session.withTransaction(async () => {
      const {
        data = {},
        leadData = [],
        from,
        previousleadCustomer,
        isCustomerChanged,
      } = req.body;
      const { docID } = req.query;

      if (!isValidValue(docID) || !mongoose.Types.ObjectId.isValid(docID)) {
        throw Object.assign(new Error("docID is required or invalid"), { statusCode: 400 });
      }

      if (!Array.isArray(leadData) || leadData.length === 0) {
        throw Object.assign(new Error("leadData is required"), { statusCode: 400 });
      }

      const objectId = new mongoose.Types.ObjectId(docID);

      const matchedDoc = await LeadMaster.findById(objectId).session(session);

      if (!matchedDoc) {
        throw Object.assign(new Error("Lead not found"), { statusCode: 404 });
      }

      const existingLeadFor = Array.isArray(matchedDoc.leadFor)
        ? matchedDoc.leadFor.map((item) => toPlainObject(item))
        : [];

      // Closed-lead edit with a customer reassignment: undo whatever
      // Leadclosing previously wrote onto the previous customer's `selected`
      // products/services for this lead, before proceeding with the rest of
      // the update.
      console.log(
        "[reverse-gate] from:", from,
        "| isCustomerChanged:", isCustomerChanged, `(${typeof isCustomerChanged})`,
        "| previousleadCustomer:", previousleadCustomer,
        "| data.customerName:", data?.customerName
      );

      const isCustomerChangedFlag =
        isCustomerChanged === true || isCustomerChanged === "true";

      if (from === "closedlead") {
        if (isCustomerChangedFlag) {
          if (String(previousleadCustomer || "") === String(data?.customerName || "")) {
            console.log(
              "[reverse-gate] SKIPPED - previousleadCustomer equals the new customerName, nothing to reverse:",
              previousleadCustomer
            );
          } else {
            await reversePreviousCustomerProducts({
              previousCustomerId: previousleadCustomer,
              oldLeadFor: existingLeadFor,
              dbSession: session,
            });
          }
        } else {
          console.log("[reverse-gate] SKIPPED reverse - isCustomerChanged is not true");
        }

        // Whether or not the customer changed, the CURRENT customer's
        // selected products/services must reflect the latest leadData for
        // this closed-lead edit: primary products added if missing,
        // additional services merged with previousTaggedData preserved.
        await syncCurrentCustomerProducts({
          customerId: data?.customerName,
          leadItems: leadData,
          dbSession: session,
        });
      } else {
        console.log("[reverse-gate] SKIPPED - from !== 'closedlead'");
      }

      const mappedLeadData = leadData.map((item) => {
        const productPrice = toNumber(item?.productPrice);
        const netAmount = toNumber(item?.netAmount);
        const hsn = toNumber(item?.hsn);
        const actualHsn = toNumber(item?.actualHsn);
        const taxAmount = netAmount - productPrice;

        return {
          licenseNumber: item?.licenseNumber ?? null,
          productorServiceName: safeString(item?.productorServiceName),
          productorServiceId: toObjectIdOrNull(item?.productorServiceId),
          productorServicemodel: safeString(item?.itemType || item?.productorServicemodel),
          price: item?.price ?? null,
          productPrice,
          hsn,
          actualHsn,
          netAmount,
          taxAmount,
          productorservicetype: safeString(item?.productorservicetype),
          company_id: toObjectIdOrNull(item?.company_id),
          branch_id: toObjectIdOrNull(item?.branch_id),
        };
      });

      const newTaxableAmount = mappedLeadData.reduce(
        (sum, item) => sum + toNumber(item.productPrice),
        0
      );

      const newNetAmount = mappedLeadData.reduce(
        (sum, item) => sum + toNumber(item.netAmount),
        0
      );

      const newTaxAmount = newNetAmount - newTaxableAmount;

      const totalPaidAmount = toNumber(matchedDoc.totalPaidAmount);
      const rawBalanceAmount = newNetAmount - totalPaidAmount;
      const newBalanceAmount = rawBalanceAmount < 0 ? 0 : rawBalanceAmount;
      const excessPaidAmount = rawBalanceAmount < 0 ? Math.abs(rawBalanceAmount) : 0;

      const oldItemsUsed = new Set();
      const oldToNewItemMap = new Map();

      for (const oldItem of existingLeadFor) {
        const matchedNewItem = findBestMatchedLeadItem(oldItem, mappedLeadData, oldItemsUsed);
        if (matchedNewItem) {
          for (const key of buildItemIdentityKeys(oldItem)) {
            if (!oldToNewItemMap.has(key)) {
              oldToNewItemMap.set(key, matchedNewItem);
            }
          }
        }
      }

      const updatedPaymentHistory = (Array.isArray(matchedDoc.paymentHistory)
        ? matchedDoc.paymentHistory
        : []
      ).map((history) => {
        const historyObj = toPlainObject(history);

        const updatedEntries = (Array.isArray(historyObj.paymentEntries)
          ? historyObj.paymentEntries
          : []
        ).map((entry) => {
          const entryObj = toPlainObject(entry);
          const receivedAmount = toNumber(entryObj?.receivedAmount);

          let matchedLeadItem = null;
          for (const key of buildItemIdentityKeys(entryObj)) {
            if (oldToNewItemMap.has(key)) {
              matchedLeadItem = oldToNewItemMap.get(key);
              break;
            }
          }

          if (!matchedLeadItem) {
            matchedLeadItem = findBestMatchedLeadItem(entryObj, mappedLeadData, new Set()) || null;
          }

          if (!matchedLeadItem) {
            return {
              ...entryObj,
              receivedAmount,
              netAmount: 0,
              balanceAmount: 0,
            };
          }

          const updatedEntryNetAmount = toNumber(matchedLeadItem.netAmount);
          const updatedEntryBalanceAmount = Math.max(updatedEntryNetAmount - receivedAmount, 0);

          return {
            ...entryObj,
            licenseNumber: matchedLeadItem.licenseNumber ?? null,
            productorServiceName: matchedLeadItem.productorServiceName || "",
            productorServiceId: matchedLeadItem.productorServiceId,
            productorServicemodel: matchedLeadItem.productorServicemodel || "",
            productorservicetype: matchedLeadItem.productorservicetype || "",
            receivedAmount,
            netAmount: updatedEntryNetAmount,
            balanceAmount: updatedEntryBalanceAmount,
          };
        });

        return {
          ...historyObj,
          paymentEntries: updatedEntries,
        };
      });

      const updatePayload = {
        ...data,
        taxableAmount: newTaxableAmount,
        taxAmount: newTaxAmount,
        netAmount: newNetAmount,
        balanceAmount: newBalanceAmount,
        excessPaidAmount,
        leadFor: mappedLeadData,
        paymentHistory: updatedPaymentHistory,
      };

      const updatedLead = await LeadMaster.findByIdAndUpdate(
        objectId,
        { $set: updatePayload },
        {
          new: true,
          runValidators: true,
          session,
        }
      );

      if (!updatedLead) {
        throw Object.assign(new Error("Failed to update lead"), { statusCode: 500 });
      }

      if (
        isValidValue(data.customerName) &&
        mongoose.Types.ObjectId.isValid(data.customerName)
      ) {
        await Customer.findByIdAndUpdate(
          data.customerName,
          {
            $set: {
              mobile: data.mobile,
              email: data.email,
              landline: data.phone,
              partner: data.partner,
            },
          },
          { new: true, runValidators: true, session }
        );
      }

      return updatedLead;
    });

    const refreshedLead = await LeadMaster.findById(transactionResult?._id).lean();

    return res.status(200).json({
      message: "Lead Updated Successfully",
      data: refreshedLead,
    });
  } catch (error) {
    console.log("error:", error.message);
    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Internal server error",
      error: error.message,
    });
  } finally {
    await session.endSession();
  }
}



//closed leads code but currrent customer wont gets productxs
// export const UpdateLeadRegister = async (req, res) => {
//   const session = await mongoose.startSession();

//   const isValidValue = (value) =>
//     value !== undefined &&
//     value !== null &&
//     value !== "null" &&
//     value !== "undefined" &&
//     String(value).trim() !== "";

//   const toNumber = (value) => {
//     const num = Number(value);
//     return Number.isFinite(num) ? num : 0;
//   };

//   const toPlainObject = (value) =>
//     value && typeof value.toObject === "function" ? value.toObject() : value;

//   const toObjectIdOrNull = (value) => {
//     if (!isValidValue(value)) return null;
//     return mongoose.Types.ObjectId.isValid(value)
//       ? new mongoose.Types.ObjectId(value)
//       : null;
//   };

//   const safeString = (value) => (isValidValue(value) ? String(value).trim() : "");

//   // Normalizes a license number to a comparable Number, or null when absent/invalid.
//   const toLicenseNumber = (value) => {
//     if (!isValidValue(value)) return null;
//     const n = Number(value);
//     return Number.isFinite(n) ? n : null;
//   };

//   const buildItemIdentityKeys = (item = {}) => {
//     const id = item.productorServiceId ? String(item.productorServiceId) : "";
//     const model = safeString(item.productorServicemodel || item.itemType);
//     const licenseNumber = safeString(item.licenseNumber);
//     const serviceName = safeString(item.productorServiceName).toLowerCase();
//     const serviceType = safeString(item.productorservicetype).toLowerCase();

//     const keys = [];

//     if (id && model) keys.push(`ID_MODEL:${id}:${model}`);
//     if (licenseNumber) keys.push(`LICENSE:${licenseNumber}`);
//     if (serviceName && serviceType) keys.push(`NAME_TYPE:${serviceName}:${serviceType}`);
//     if (serviceName) keys.push(`NAME:${serviceName}`);

//     return keys;
//   };

//   const findBestMatchedLeadItem = (sourceItem, newItems, usedIndexes = new Set()) => {
//     const keys = buildItemIdentityKeys(sourceItem);

//     for (const key of keys) {
//       const index = newItems.findIndex((item, idx) => {
//         if (usedIndexes.has(idx)) return false;
//         return buildItemIdentityKeys(item).includes(key);
//       });

//       if (index !== -1) {
//         usedIndexes.add(index);
//         return newItems[index];
//       }
//     }

//     const fallbackIndex = newItems.findIndex((_, idx) => !usedIndexes.has(idx));
//     if (fallbackIndex !== -1) {
//       usedIndexes.add(fallbackIndex);
//       return newItems[fallbackIndex];
//     }

//     return null;
//   };

//   // Reverses the products/additional-service tagged data that Leadclosing
//   // previously wrote onto the PREVIOUS customer for this lead, so that when
//   // a closed lead is edited and reassigned to a different customer, the old
//   // customer no longer carries products/licenses that belonged to this lead.
//   //
//   // - Primary product entries (matched by licensenumber) are removed outright
//   //   from the previous customer's `selected` array.
//   // - Additional service entries are NOT removed outright. For each license
//   //   number this lead had tagged, we look at that service's
//   //   `previousTaggedData` (the history of records overwritten by
//   //   Leadclosing merges) and restore the most recent prior record back into
//   //   `taggeddata`, removing it from `previousTaggedData`. If there is no
//   //   prior record for that license (meaning this lead created it fresh),
//   //   the license's taggeddata entry is removed instead. If an additional
//   //   service ends up with no taggeddata left, the whole entry is dropped.
//   const reversePreviousCustomerProducts = async ({
//     previousCustomerId,
//     oldLeadFor,
//     dbSession,
//   }) => {
//     console.log(
//       "[reverse] called | previousCustomerId:", previousCustomerId,
//       "| oldLeadFor count:", Array.isArray(oldLeadFor) ? oldLeadFor.length : 0
//     );

//     if (!isValidValue(previousCustomerId) || !mongoose.Types.ObjectId.isValid(previousCustomerId)) {
//       console.log("[reverse] SKIPPED - invalid/missing previousCustomerId:", previousCustomerId);
//       return;
//     }

//     const previousCustomerDoc = await Customer.findById(previousCustomerId).session(dbSession);
//     if (!previousCustomerDoc) {
//       console.log("[reverse] SKIPPED - previous customer not found for id:", previousCustomerId);
//       return;
//     }

//     const previousSelected = Array.isArray(previousCustomerDoc.selected)
//       ? previousCustomerDoc.selected.map((item) => toPlainObject(item))
//       : [];

//     console.log(
//       "[reverse] previousCustomer found:", String(previousCustomerDoc._id),
//       "| selected.length BEFORE:", previousSelected.length
//     );

//     for (const oldItem of Array.isArray(oldLeadFor) ? oldLeadFor : []) {
//       const oldType = safeString(oldItem?.productorservicetype).toLowerCase();
//       const oldLicenseNumber = toLicenseNumber(oldItem?.licenseNumber);
//       const oldProductId = oldItem?.productorServiceId ? String(oldItem.productorServiceId) : "";

//       console.log(
//         "[reverse] processing oldItem -> type:", oldType,
//         "| licenseNumber:", oldLicenseNumber,
//         "| productId:", oldProductId
//       );

//       if (oldType === "primaryproduct") {
//         if (oldLicenseNumber === null) {
//           console.log("[reverse] primary SKIP - no license number on oldItem");
//           continue;
//         }

//         // Strict match: license number AND type both agree.
//         let removeIndex = previousSelected.findIndex(
//           (sel) =>
//             toLicenseNumber(sel?.licensenumber) === oldLicenseNumber &&
//             safeString(sel?.productorservicetype).toLowerCase() === "primaryproduct"
//         );

//         if (removeIndex === -1) {
//           // Fallback: match by license number alone. Covers cases where
//           // productorservicetype is missing/blank/differently-cased on the
//           // customer's selected primary entry.
//           const looseIndex = previousSelected.findIndex(
//             (sel) => toLicenseNumber(sel?.licensenumber) === oldLicenseNumber
//           );

//           if (looseIndex !== -1) {
//             console.log(
//               "[reverse] primary STRICT match failed, LOOSE license-only match found at index",
//               looseIndex,
//               "| sel.productorservicetype was:",
//               previousSelected[looseIndex]?.productorservicetype
//             );
//             removeIndex = looseIndex;
//           }
//         }

//         console.log("[reverse] primary removeIndex resolved to:", removeIndex);

//         if (removeIndex !== -1) {
//           previousSelected.splice(removeIndex, 1);
//           console.log(
//             "[reverse] primary REMOVED license", oldLicenseNumber,
//             "| selected.length now:", previousSelected.length
//           );
//         } else {
//           console.log(
//             "[reverse] primary NOT FOUND for license", oldLicenseNumber,
//             "- nothing removed. Available primary licenses in previousSelected:",
//             previousSelected
//               .filter((s) => safeString(s?.productorservicetype).toLowerCase() === "primaryproduct")
//               .map((s) => s?.licensenumber)
//           );
//         }

//         continue;
//       }

//       if (oldType === "additionalservice") {
//         const serviceIndex = previousSelected.findIndex(
//           (sel) =>
//             String(sel?.product_id || "") === oldProductId &&
//             safeString(sel?.productorservicetype).toLowerCase() === "additionalservice"
//         );

//         console.log("[reverse] additionalservice serviceIndex:", serviceIndex, "for productId:", oldProductId);

//         if (serviceIndex === -1) {
//           console.log(
//             "[reverse] additionalservice NOT FOUND for productId", oldProductId,
//             "- nothing reverted. Available service product_ids in previousSelected:",
//             previousSelected
//               .filter((s) => safeString(s?.productorservicetype).toLowerCase() === "additionalservice")
//               .map((s) => String(s?.product_id || ""))
//           );
//           continue;
//         }

//         const serviceItem = { ...previousSelected[serviceIndex] };

//         const taggeddata = Array.isArray(serviceItem.taggeddata)
//           ? serviceItem.taggeddata.map((t) => toPlainObject(t))
//           : [];

//         const previousTaggedData = Array.isArray(serviceItem.previousTaggedData)
//           ? serviceItem.previousTaggedData.map((t) => toPlainObject(t))
//           : [];

//         const licenseNumbers = Array.isArray(serviceItem.licenseNumbers)
//           ? serviceItem.licenseNumbers.map((l) => toPlainObject(l))
//           : [];

//         // Collect every license number this lead touched for this service:
//         // the item-level licenseNumber plus every taggeddata record's
//         // licensenumber recorded on the OLD leadFor entry.
//         const licenseNumbersToRevert = new Set();
//         if (oldLicenseNumber !== null) {
//           licenseNumbersToRevert.add(oldLicenseNumber);
//         }
//         for (const tag of Array.isArray(oldItem?.taggeddata) ? oldItem.taggeddata : []) {
//           const tagLicense = toLicenseNumber(tag?.licensenumber);
//           if (tagLicense !== null) {
//             licenseNumbersToRevert.add(tagLicense);
//           }
//         }

//         for (const licenseNumber of licenseNumbersToRevert) {
//           const taggedIndex = taggeddata.findIndex(
//             (t) => toLicenseNumber(t?.licensenumber) === licenseNumber
//           );

//           // Find the most recently overwritten previous record for this
//           // license (last match in the array), representing the state
//           // immediately before this lead's overwrite.
//           let prevIndex = -1;
//           for (let i = previousTaggedData.length - 1; i >= 0; i--) {
//             if (toLicenseNumber(previousTaggedData[i]?.licensenumber) === licenseNumber) {
//               prevIndex = i;
//               break;
//             }
//           }

//           if (prevIndex !== -1) {
//             const restoredRecord = previousTaggedData[prevIndex];

//             if (taggedIndex !== -1) {
//               taggeddata[taggedIndex] = restoredRecord;
//             } else {
//               taggeddata.push(restoredRecord);
//             }

//             previousTaggedData.splice(prevIndex, 1);
//           } else if (taggedIndex !== -1) {
//             taggeddata.splice(taggedIndex, 1);
//           }

//           const licenseNumbersIndex = licenseNumbers.findIndex(
//             (l) => toLicenseNumber(l?.licenseNumber) === licenseNumber
//           );
//           if (licenseNumbersIndex !== -1 && prevIndex === -1) {
//             licenseNumbers.splice(licenseNumbersIndex, 1);
//           }
//         }

//         serviceItem.taggeddata = taggeddata;
//         serviceItem.previousTaggedData = previousTaggedData;
//         serviceItem.licenseNumbers = licenseNumbers;

//         if (taggeddata.length === 0) {
//           previousSelected.splice(serviceIndex, 1);
//         } else {
//           previousSelected[serviceIndex] = serviceItem;
//         }
//       }
//     }

//     console.log("[reverse] selected.length AFTER processing:", previousSelected.length);

//     previousCustomerDoc.selected = previousSelected;
//     const saved = await previousCustomerDoc.save({ session: dbSession });
//     console.log(
//       "[reverse] SAVE complete for customer", String(saved._id),
//       "| final selected.length in saved doc:", Array.isArray(saved.selected) ? saved.selected.length : "n/a"
//     );
//   };

//   try {
//     const transactionResult = await session.withTransaction(async () => {
//       const {
//         data = {},
//         leadData = [],
//         from,
//         previousleadCustomer,
//         isCustomerChanged,
//       } = req.body;
//       const { docID } = req.query;

//       if (!isValidValue(docID) || !mongoose.Types.ObjectId.isValid(docID)) {
//         throw Object.assign(new Error("docID is required or invalid"), { statusCode: 400 });
//       }

//       if (!Array.isArray(leadData) || leadData.length === 0) {
//         throw Object.assign(new Error("leadData is required"), { statusCode: 400 });
//       }

//       const objectId = new mongoose.Types.ObjectId(docID);

//       const matchedDoc = await LeadMaster.findById(objectId).session(session);

//       if (!matchedDoc) {
//         throw Object.assign(new Error("Lead not found"), { statusCode: 404 });
//       }

//       const existingLeadFor = Array.isArray(matchedDoc.leadFor)
//         ? matchedDoc.leadFor.map((item) => toPlainObject(item))
//         : [];

//       // Closed-lead edit with a customer reassignment: undo whatever
//       // Leadclosing previously wrote onto the previous customer's `selected`
//       // products/services for this lead, before proceeding with the rest of
//       // the update.
//       console.log(
//         "[reverse-gate] from:", from,
//         "| isCustomerChanged:", isCustomerChanged, `(${typeof isCustomerChanged})`,
//         "| previousleadCustomer:", previousleadCustomer,
//         "| data.customerName:", data?.customerName
//       );

//       const isCustomerChangedFlag =
//         isCustomerChanged === true || isCustomerChanged === "true";

//       if (from === "closedlead" && isCustomerChangedFlag) {
//         if (String(previousleadCustomer || "") === String(data?.customerName || "")) {
//           console.log(
//             "[reverse-gate] SKIPPED - previousleadCustomer equals the new customerName, nothing to reverse:",
//             previousleadCustomer
//           );
//         } else {
//           await reversePreviousCustomerProducts({
//             previousCustomerId: previousleadCustomer,
//             oldLeadFor: existingLeadFor,
//             dbSession: session,
//           });
//         }
//       } else {
//         console.log("[reverse-gate] SKIPPED - condition not met (from/isCustomerChanged mismatch)");
//       }

//       const mappedLeadData = leadData.map((item) => {
//         const productPrice = toNumber(item?.productPrice);
//         const netAmount = toNumber(item?.netAmount);
//         const hsn = toNumber(item?.hsn);
//         const actualHsn = toNumber(item?.actualHsn);
//         const taxAmount = netAmount - productPrice;

//         return {
//           licenseNumber: item?.licenseNumber ?? null,
//           productorServiceName: safeString(item?.productorServiceName),
//           productorServiceId: toObjectIdOrNull(item?.productorServiceId),
//           productorServicemodel: safeString(item?.itemType || item?.productorServicemodel),
//           price: item?.price ?? null,
//           productPrice,
//           hsn,
//           actualHsn,
//           netAmount,
//           taxAmount,
//           productorservicetype: safeString(item?.productorservicetype),
//           company_id: toObjectIdOrNull(item?.company_id),
//           branch_id: toObjectIdOrNull(item?.branch_id),
//         };
//       });

//       const newTaxableAmount = mappedLeadData.reduce(
//         (sum, item) => sum + toNumber(item.productPrice),
//         0
//       );

//       const newNetAmount = mappedLeadData.reduce(
//         (sum, item) => sum + toNumber(item.netAmount),
//         0
//       );

//       const newTaxAmount = newNetAmount - newTaxableAmount;

//       const totalPaidAmount = toNumber(matchedDoc.totalPaidAmount);
//       const rawBalanceAmount = newNetAmount - totalPaidAmount;
//       const newBalanceAmount = rawBalanceAmount < 0 ? 0 : rawBalanceAmount;
//       const excessPaidAmount = rawBalanceAmount < 0 ? Math.abs(rawBalanceAmount) : 0;

//       const oldItemsUsed = new Set();
//       const oldToNewItemMap = new Map();

//       for (const oldItem of existingLeadFor) {
//         const matchedNewItem = findBestMatchedLeadItem(oldItem, mappedLeadData, oldItemsUsed);
//         if (matchedNewItem) {
//           for (const key of buildItemIdentityKeys(oldItem)) {
//             if (!oldToNewItemMap.has(key)) {
//               oldToNewItemMap.set(key, matchedNewItem);
//             }
//           }
//         }
//       }

//       const updatedPaymentHistory = (Array.isArray(matchedDoc.paymentHistory)
//         ? matchedDoc.paymentHistory
//         : []
//       ).map((history) => {
//         const historyObj = toPlainObject(history);

//         const updatedEntries = (Array.isArray(historyObj.paymentEntries)
//           ? historyObj.paymentEntries
//           : []
//         ).map((entry) => {
//           const entryObj = toPlainObject(entry);
//           const receivedAmount = toNumber(entryObj?.receivedAmount);

//           let matchedLeadItem = null;
//           for (const key of buildItemIdentityKeys(entryObj)) {
//             if (oldToNewItemMap.has(key)) {
//               matchedLeadItem = oldToNewItemMap.get(key);
//               break;
//             }
//           }

//           if (!matchedLeadItem) {
//             matchedLeadItem = findBestMatchedLeadItem(entryObj, mappedLeadData, new Set()) || null;
//           }

//           if (!matchedLeadItem) {
//             return {
//               ...entryObj,
//               receivedAmount,
//               netAmount: 0,
//               balanceAmount: 0,
//             };
//           }

//           const updatedEntryNetAmount = toNumber(matchedLeadItem.netAmount);
//           const updatedEntryBalanceAmount = Math.max(updatedEntryNetAmount - receivedAmount, 0);

//           return {
//             ...entryObj,
//             licenseNumber: matchedLeadItem.licenseNumber ?? null,
//             productorServiceName: matchedLeadItem.productorServiceName || "",
//             productorServiceId: matchedLeadItem.productorServiceId,
//             productorServicemodel: matchedLeadItem.productorServicemodel || "",
//             productorservicetype: matchedLeadItem.productorservicetype || "",
//             receivedAmount,
//             netAmount: updatedEntryNetAmount,
//             balanceAmount: updatedEntryBalanceAmount,
//           };
//         });

//         return {
//           ...historyObj,
//           paymentEntries: updatedEntries,
//         };
//       });

//       const updatePayload = {
//         ...data,
//         taxableAmount: newTaxableAmount,
//         taxAmount: newTaxAmount,
//         netAmount: newNetAmount,
//         balanceAmount: newBalanceAmount,
//         excessPaidAmount,
//         leadFor: mappedLeadData,
//         paymentHistory: updatedPaymentHistory,
//       };

//       const updatedLead = await LeadMaster.findByIdAndUpdate(
//         objectId,
//         { $set: updatePayload },
//         {
//           new: true,
//           runValidators: true,
//           session,
//         }
//       );

//       if (!updatedLead) {
//         throw Object.assign(new Error("Failed to update lead"), { statusCode: 500 });
//       }

//       if (
//         isValidValue(data.customerName) &&
//         mongoose.Types.ObjectId.isValid(data.customerName)
//       ) {
//         await Customer.findByIdAndUpdate(
//           data.customerName,
//           {
//             $set: {
//               mobile: data.mobile,
//               email: data.email,
//               landline: data.phone,
//               partner: data.partner,
//             },
//           },
//           { new: true, runValidators: true, session }
//         );
//       }

//       return updatedLead;
//     });

//     const refreshedLead = await LeadMaster.findById(transactionResult?._id).lean();

//     return res.status(200).json({
//       message: "Lead Updated Successfully",
//       data: refreshedLead,
//     });
//   } catch (error) {
//     console.log("error:", error.message);
//     return res.status(error.statusCode || 500).json({
//       message: error.statusCode ? error.message : "Internal server error",
//       error: error.message,
//     });
//   } finally {
//     await session.endSession();
//   }
// }

// export const UpdateLeadRegister = async (req, res) => {
//   const session = await mongoose.startSession();

//   const isValidValue = (value) =>
//     value !== undefined &&
//     value !== null &&
//     value !== "null" &&
//     value !== "undefined" &&
//     String(value).trim() !== "";

//   const toNumber = (value) => {
//     const num = Number(value);
//     return Number.isFinite(num) ? num : 0;
//   };

//   const toPlainObject = (value) =>
//     value && typeof value.toObject === "function" ? value.toObject() : value;

//   const toObjectIdOrNull = (value) => {
//     if (!isValidValue(value)) return null;
//     return mongoose.Types.ObjectId.isValid(value)
//       ? new mongoose.Types.ObjectId(value)
//       : null;
//   };

//   const safeString = (value) => (isValidValue(value) ? String(value).trim() : "");

//   const buildItemIdentityKeys = (item = {}) => {
//     const id = item.productorServiceId ? String(item.productorServiceId) : "";
//     const model = safeString(item.productorServicemodel || item.itemType);
//     const licenseNumber = safeString(item.licenseNumber);
//     const serviceName = safeString(item.productorServiceName).toLowerCase();
//     const serviceType = safeString(item.productorservicetype).toLowerCase();

//     const keys = [];

//     if (id && model) keys.push(`ID_MODEL:${id}:${model}`);
//     if (licenseNumber) keys.push(`LICENSE:${licenseNumber}`);
//     if (serviceName && serviceType) keys.push(`NAME_TYPE:${serviceName}:${serviceType}`);
//     if (serviceName) keys.push(`NAME:${serviceName}`);

//     return keys;
//   };

//   const findBestMatchedLeadItem = (sourceItem, newItems, usedIndexes = new Set()) => {
//     const keys = buildItemIdentityKeys(sourceItem);

//     for (const key of keys) {
//       const index = newItems.findIndex((item, idx) => {
//         if (usedIndexes.has(idx)) return false;
//         return buildItemIdentityKeys(item).includes(key);
//       });

//       if (index !== -1) {
//         usedIndexes.add(index);
//         return newItems[index];
//       }
//     }

//     const fallbackIndex = newItems.findIndex((_, idx) => !usedIndexes.has(idx));
//     if (fallbackIndex !== -1) {
//       usedIndexes.add(fallbackIndex);
//       return newItems[fallbackIndex];
//     }

//     return null;
//   };

//   try {
//     const transactionResult = await session.withTransaction(async () => {
//       const { data = {}, leadData = [] } = req.body;
//       const { docID } = req.query;

//       if (!isValidValue(docID) || !mongoose.Types.ObjectId.isValid(docID)) {
//         throw Object.assign(new Error("docID is required or invalid"), { statusCode: 400 });
//       }

//       if (!Array.isArray(leadData) || leadData.length === 0) {
//         throw Object.assign(new Error("leadData is required"), { statusCode: 400 });
//       }

//       const objectId = new mongoose.Types.ObjectId(docID);

//       const matchedDoc = await LeadMaster.findById(objectId).session(session);

//       if (!matchedDoc) {
//         throw Object.assign(new Error("Lead not found"), { statusCode: 404 });
//       }

//       const existingLeadFor = Array.isArray(matchedDoc.leadFor)
//         ? matchedDoc.leadFor.map((item) => toPlainObject(item))
//         : [];

//       const mappedLeadData = leadData.map((item) => {
//         const productPrice = toNumber(item?.productPrice);
//         const netAmount = toNumber(item?.netAmount);
//         const hsn = toNumber(item?.hsn);
//         const actualHsn = toNumber(item?.actualHsn);
//         const taxAmount = netAmount - productPrice;

//         return {
//           licenseNumber: item?.licenseNumber ?? null,
//           productorServiceName: safeString(item?.productorServiceName),
//           productorServiceId: toObjectIdOrNull(item?.productorServiceId),
//           productorServicemodel: safeString(item?.itemType || item?.productorServicemodel),
//           price: item?.price ?? null,
//           productPrice,
//           hsn,
//           actualHsn,
//           netAmount,
//           taxAmount,
//           productorservicetype: safeString(item?.productorservicetype),
//           company_id: toObjectIdOrNull(item?.company_id),
//           branch_id: toObjectIdOrNull(item?.branch_id),
//         };
//       });

//       const newTaxableAmount = mappedLeadData.reduce(
//         (sum, item) => sum + toNumber(item.productPrice),
//         0
//       );

//       const newNetAmount = mappedLeadData.reduce(
//         (sum, item) => sum + toNumber(item.netAmount),
//         0
//       );

//       const newTaxAmount = newNetAmount - newTaxableAmount;

//       const totalPaidAmount = toNumber(matchedDoc.totalPaidAmount);
//       const rawBalanceAmount = newNetAmount - totalPaidAmount;
//       const newBalanceAmount = rawBalanceAmount < 0 ? 0 : rawBalanceAmount;
//       const excessPaidAmount = rawBalanceAmount < 0 ? Math.abs(rawBalanceAmount) : 0;

//       const oldItemsUsed = new Set();
//       const oldToNewItemMap = new Map();

//       for (const oldItem of existingLeadFor) {
//         const matchedNewItem = findBestMatchedLeadItem(oldItem, mappedLeadData, oldItemsUsed);
//         if (matchedNewItem) {
//           for (const key of buildItemIdentityKeys(oldItem)) {
//             if (!oldToNewItemMap.has(key)) {
//               oldToNewItemMap.set(key, matchedNewItem);
//             }
//           }
//         }
//       }

//       const updatedPaymentHistory = (Array.isArray(matchedDoc.paymentHistory)
//         ? matchedDoc.paymentHistory
//         : []
//       ).map((history) => {
//         const historyObj = toPlainObject(history);

//         const updatedEntries = (Array.isArray(historyObj.paymentEntries)
//           ? historyObj.paymentEntries
//           : []
//         ).map((entry) => {
//           const entryObj = toPlainObject(entry);
//           const receivedAmount = toNumber(entryObj?.receivedAmount);

//           let matchedLeadItem = null;
//           for (const key of buildItemIdentityKeys(entryObj)) {
//             if (oldToNewItemMap.has(key)) {
//               matchedLeadItem = oldToNewItemMap.get(key);
//               break;
//             }
//           }

//           if (!matchedLeadItem) {
//             matchedLeadItem = findBestMatchedLeadItem(entryObj, mappedLeadData, new Set()) || null;
//           }

//           if (!matchedLeadItem) {
//             return {
//               ...entryObj,
//               receivedAmount,
//               netAmount: 0,
//               balanceAmount: 0,
//             };
//           }

//           const updatedEntryNetAmount = toNumber(matchedLeadItem.netAmount);
//           const updatedEntryBalanceAmount = Math.max(updatedEntryNetAmount - receivedAmount, 0);

//           return {
//             ...entryObj,
//             licenseNumber: matchedLeadItem.licenseNumber ?? null,
//             productorServiceName: matchedLeadItem.productorServiceName || "",
//             productorServiceId: matchedLeadItem.productorServiceId,
//             productorServicemodel: matchedLeadItem.productorServicemodel || "",
//             productorservicetype: matchedLeadItem.productorservicetype || "",
//             receivedAmount,
//             netAmount: updatedEntryNetAmount,
//             balanceAmount: updatedEntryBalanceAmount,
//           };
//         });

//         return {
//           ...historyObj,
//           paymentEntries: updatedEntries,
//         };
//       });

//       const updatePayload = {
//         ...data,
//         taxableAmount: newTaxableAmount,
//         taxAmount: newTaxAmount,
//         netAmount: newNetAmount,
//         balanceAmount: newBalanceAmount,
//         excessPaidAmount,
//         leadFor: mappedLeadData,
//         paymentHistory: updatedPaymentHistory,
//       };

//       const updatedLead = await LeadMaster.findByIdAndUpdate(
//         objectId,
//         { $set: updatePayload },
//         {
//           new: true,
//           runValidators: true,
//           session,
//         }
//       );

//       if (!updatedLead) {
//         throw Object.assign(new Error("Failed to update lead"), { statusCode: 500 });
//       }

//       if (
//         isValidValue(data.customerName) &&
//         mongoose.Types.ObjectId.isValid(data.customerName)
//       ) {
//         await Customer.findByIdAndUpdate(
//           data.customerName,
//           {
//             $set: {
//               mobile: data.mobile,
//               email: data.email,
//               landline: data.phone,
//               partner: data.partner,
//             },
//           },
//           { new: true, runValidators: true, session }
//         );
//       }

//       return updatedLead;
//     });

//     const refreshedLead = await LeadMaster.findById(transactionResult?._id).lean();

//     return res.status(200).json({
//       message: "Lead Updated Successfully",
//       data: refreshedLead,
//     });
//   } catch (error) {
//     console.log("error:", error.message);
//     return res.status(error.statusCode || 500).json({
//       message: error.statusCode ? error.message : "Internal server error",
//       error: error.message,
//     });
//   } finally {
//     await session.endSession();
//   }
// };//git code




export const GetAllservices = async (req, res) => {
  try {
    const allservices = await Service.find({}).populate("company").populate("branch")
    return res
      .status(200)
      .json({ message: "Services found", data: allservices });
  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const GetallselectedproductFollowup = async (req, res) => {
  try {

    // const { loggeduserid, branchSelected, role, pendingfollowup, selectedproductId } = req.query;
    const { loggeduserid, branchSelected, role, pendingfollowup, selectedproductId, viewmode = null, header = null, startDate, endDate } = req.query

    // const userObjectId = new mongoose.Types.ObjectId(loggeduserid)
    const branchObjectId = new mongoose.Types.ObjectId(branchSelected)
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    const productObjectId = selectedproductId ? new mongoose.Types.ObjectId(selectedproductId) : null

    let query
    if (viewmode) {
      query = {
        activityLog: {
          $elemMatch: {
            taskTo: "followup",
            allocationChanged: false,

          },
        },
        leadBranch: branchObjectId,

      }
      if (header !== "Total Leads") {
        query.leadLost = false

      }

    } else {
      if (pendingfollowup === "true") {

        query = {
          activityLog: {
            $elemMatch: {
              taskTo: "followup",
              allocationChanged: false,
              allocatedClosed: false,
              taskClosed: false,
              followupClosed: false,
            },
          },
          leadBranch: branchObjectId,
          reallocatedTo: false,
          leadLost: false,
        }


      } else if (pendingfollowup === "false") {

        query = {
          activityLog: {
            $elemMatch: {
              taskTo: "followup",
              allocationChanged: false,
              allocatedClosed: false,
              taskClosed: true,
              followupClosed: true,
            },
          },
          leadBranch: branchObjectId,
          leadLost: false,
        }


      }
    }


    // optional: add product filter at DB level if provided
    if (productObjectId) {
      query["leadFor.productorServiceId"] = productObjectId
    }
    const selectedfollowup = await LeadMaster.find(query)
      .populate({ path: "customerName" })
      .populate({ path: "partner" })
      .lean()

    const followupLeads = []

    for (const lead of selectedfollowup) {

      const leadForArray = Array.isArray(lead.leadFor) ? lead.leadFor : []

      const hasSelectedProduct = leadForArray.some(
        (lf) =>
          lf.productorServiceId &&
          lf.productorServiceId.toString() === productObjectId.toString()
      )

      if (productObjectId && !hasSelectedProduct) {
        continue
      }


      const activity = Array.isArray(lead.activityLog) ? lead.activityLog : []
      const matchedAllocations = activity
        .map((item, index) => ({ ...item, index }))
        .filter((item) => {
          if (item.taskTo !== "followup") return false;
          if (item.allocationChanged !== false) return false;
          if (!item.submissionDate) return false
          const subDate = new Date(item.submissionDate);

          if (start && end) {
            if (subDate < start || subDate > end) return false;
          }

          return true;
        })

      if (matchedAllocations.length === 0) continue

      const lastAlloc = matchedAllocations[matchedAllocations.length - 1]
      const lastIndex = lastAlloc.index

      if (
        !lead.leadByModel ||
        !mongoose.models[lead.leadByModel] ||
        !lastAlloc.taskallocatedToModel ||
        !mongoose.models[lastAlloc.taskallocatedToModel] ||
        !lastAlloc.taskallocatedByModel ||
        !mongoose.models[lastAlloc.taskallocatedByModel]
      ) {

        console.error(
          `Model missing for lead ${lead._id}:`,
          lead.leadByModel,
          lastAlloc.taskallocatedToModel,
          lastAlloc.taskallocatedByModel
        )
        continue
      }

      const leadByModel = mongoose.model(lead.leadByModel)
      const allocatedToModel = mongoose.model(lastAlloc.taskallocatedToModel)
      const allocatedByModel = mongoose.model(lastAlloc.taskallocatedByModel)

      const [popLeadBy, popAllocatedTo, popAllocatedBy] = await Promise.all([
        leadByModel
          .findById(lead.leadBy)
          .select("name")
          .lean()
          .catch(() => null),
        allocatedToModel
          .findById(lastAlloc.taskallocatedTo)
          .select("name")
          .lean()
          .catch(() => null),
        allocatedByModel
          .findById(lastAlloc.taskallocatedBy)
          .select("name")
          .lean()
          .catch(() => null),
      ])

      const populatedActivityLog = await Promise.all(
        activity.map(async (log) => {
          let populatedSubmittedUser = null
          let populatedTaskAllocatedTo = null
          let populatedTaskAllocatedBy = null
          let populatedTask = null
          let populatedTaskBy = null

          if (
            log.submittedUser &&
            log.submissiondoneByModel &&
            mongoose.models[log.submissiondoneByModel]
          ) {
            const model = mongoose.model(log.submissiondoneByModel)
            populatedSubmittedUser = await model
              .findById(log.submittedUser)
              .select("name")
              .lean()
              .catch(() => null)
          }

          if (
            log.taskallocatedBy &&
            log.taskallocatedByModel &&
            mongoose.models[log.taskallocatedByModel]
          ) {
            const model = mongoose.model(log.taskallocatedByModel)
            populatedTaskAllocatedBy = await model
              .findById(log.taskallocatedBy)
              .select("name")
              .lean()
              .catch(() => null)
          }

          if (
            log.taskallocatedTo &&
            log.taskallocatedToModel &&
            mongoose.models[log.taskallocatedToModel]
          ) {
            const model = mongoose.model(log.taskallocatedToModel)
            populatedTaskAllocatedTo = await model
              .findById(log.taskallocatedTo)
              .select("name")
              .lean()
              .catch(() => null)
          }

          if (log?.taskId) {
            populatedTask = await Task.findById(log.taskId)
              .select("taskName")
              .lean()
              .catch(() => null)
          }

          if (log?.taskBy) {
            populatedTaskBy = await Task.findById(log.taskBy)
          }

          return {
            ...log,
            taskBy: populatedTaskBy,
            submittedUser: populatedSubmittedUser || log.submittedUser,
            taskallocatedBy: populatedTaskAllocatedBy || log.taskallocatedBy,
            taskallocatedTo: populatedTaskAllocatedTo || log.taskallocatedTo,
            taskId: populatedTask,
          }
        })
      )

      const lastMatched = lastAlloc
      const lastMatchedClosed = !!lastMatched.followupClosed

      // let neverfollowuped = false

      // if (lastMatchedClosed) {
      //   neverfollowuped = true
      // } else {
      //   const afterLogs = activity.slice(lastIndex + 1)
      //   const foundNextFollowUp = afterLogs.some(
      //     (log) => !!log.nextFollowUpDate
      //   )
      //   if (foundNextFollowUp) {
      //     neverfollowuped = false
      //   } else {
      //     if (lastMatched.nextFollowUpDate) neverfollowuped = false
      //     else neverfollowuped = true
      //   }
      // }
      // 1️⃣ Get all followup allocations
      const followupLogs = activity
        .map((item, index) => ({ ...item, index }))
        .filter((item) => item.taskTo === "followup")

      if (followupLogs.length === 0) return

      // 2️⃣ Take LAST followup allocation
      const lastFollowup = followupLogs[followupLogs.length - 1]

      // 3️⃣ Apply your conditions
      let neverfollowuped = false

      if (
        lastFollowup.allocationChanged === false &&
        lastFollowup.followupClosed === false
      ) {
        // 4️⃣ Check logs AFTER this index
        const afterLogs = activity.slice(lastFollowup.index + 1)

        const hasNextFollowUpDate = afterLogs.some(
          (log) => log.nextFollowUpDate
        )

        if (!hasNextFollowUpDate) {
          neverfollowuped = true
        }
      }

      const lastActivity = activity[activity.length - 1] || {}
      const Nextfollowup = !!lastActivity.nextFollowUpDate
      const allocatedfollowup = !!lastActivity.taskfromFollowup
      const allocatedTaskClosed = !!lastActivity.allocatedClosed

      followupLeads.push({
        ...lead,
        leadBy: popLeadBy || lead.leadBy,
        allocatedTo: popAllocatedTo,
        allocatedBy: popAllocatedBy,
        activityLog: populatedActivityLog,
        nextFollowUpDate: lastActivity.nextFollowUpDate ?? null,
        neverfollowuped,
        Nextfollowup,
        allocatedfollowup,
        allocatedTaskClosed,
      })
    }

    return res.status(200).json({ followupLeads })


  } catch (error) {
    // console.log("error", error)
    console.log("eroorrr", error.message)
    return res.status(500).json({ message: "Internal server error" })
  }
}


// export const GetallfollowupList = async (req, res) => {
//   try {
//     const { loggeduserid, branchSelected, role, pendingfollowup, viewmode = null, startDate, endDate, header } = req.query;
//     console.log("isssssssssssssstotal", viewmode)

//     const userObjectId = new mongoose.Types.ObjectId(loggeduserid);
//     const branchObjectId = new mongoose.Types.ObjectId(branchSelected);
//     // const
//     let query;
//     if (viewmode) {
//       query = {
//         activityLog: {
//           $elemMatch: {
//             taskTo: "followup",
//             $or: [
//               { submittedUser: userObjectId },
//               { taskallocatedTo: userObjectId },
//             ],
//             allocationChanged: false,
//             allocatedClosed: false
//           }
//         },
//         leadBranch: branchObjectId,
//         leadLost: false
//       }
//     } else {
//       if (pendingfollowup === "true") {
//         if (role === "Admin") {
//           query = {
//             activityLog: {
//               $elemMatch: {
//                 taskTo: "followup",

//                 allocationChanged: false,
//                 allocatedClosed: false,
//                 taskClosed: false,
//                 followupClosed: false,
//               },
//             },
//             leadBranch: branchObjectId,
//             reallocatedTo: false,
//             leadLost: false,
//           };
//         } else {
//           query = {
//             activityLog: {
//               $elemMatch: {
//                 taskTo: "followup",
//                 $or: [
//                   { submittedUser: userObjectId },
//                   { taskallocatedTo: userObjectId },
//                 ],
//                 allocationChanged: false,
//                 allocatedClosed: false,
//                 taskClosed: false,
//                 followupClosed: false,
//               },
//             },
//             leadBranch: branchObjectId,
//             reallocatedTo: false,
//             leadLost: false,
//           };
//         }
//       } else if (pendingfollowup === "false") {
//         if (role === "Admin") {
//           query = {
//             activityLog: {
//               $elemMatch: {
//                 taskTo: "followup",
//                 allocationChanged: false,
//                 allocatedClosed: false,
//                 taskClosed: true,
//                 followupClosed: true,
//               },
//             },
//             leadBranch: branchObjectId,

//             leadLost: false,
//           };
//         } else {
//           query = {
//             activityLog: {
//               $elemMatch: {
//                 taskTo: "followup",
//                 $or: [
//                   { submittedUser: userObjectId },
//                   { taskallocatedTo: userObjectId },
//                 ],
//                 taskClosed: true,
//               },
//             },
//             leadBranch: branchObjectId,
//             leadLost: false,
//           };
//         }
//       }
//     }

//     const selectedfollowup = await LeadMaster.find(query)
//       .populate({ path: "customerName" })
//       .populate({ path: "partner" })
//       .lean();
//     console.log("selelltttt", selectedfollowup)
//     const followupLeads = [];
//     for (const lead of selectedfollowup) {
//       // Build matchedAllocations = activityLog entries where taskTo === 'followup'
//       const activity = Array.isArray(lead.activityLog) ? lead.activityLog : [];
//       const matchedAllocations = activity
//         .map((item, index) => ({ ...item, index }))
//         .filter((item) => item.taskTo === "followup");

//       // If no matchedAllocation, skip this lead (or push with flags false if needed)
//       if (matchedAllocations.length === 0) {
//         continue;
//       }

//       // Safety: ensure model names exist before doing mongoose.model(...) calls
//       const lastAlloc = matchedAllocations[matchedAllocations.length - 1];

//       const lastIndex = lastAlloc.index;

//       if (
//         !lead.leadByModel ||
//         !mongoose.models[lead.leadByModel] ||
//         !lastAlloc.taskallocatedToModel ||
//         !mongoose.models[lastAlloc.taskallocatedToModel] ||
//         !lastAlloc.taskallocatedByModel ||
//         !mongoose.models[lastAlloc.taskallocatedByModel]
//       ) {
//         console.log("leadby", lead.leadByModel)
//         console.log("taskallocatedtomodel", lastAlloc.taskallocatedToModel)
//         console.log("taskallocatedy", lastAlloc.taskallocatedByModel)
//         console.error(
//           `Model missing for lead ${lead._id}:`,
//           lead.leadByModel,
//           lastAlloc.taskallocatedToModel,
//           lastAlloc.taskallocatedByModel
//         );
//         // skip this lead (don't `return` from whole function)
//         continue;
//       }

//       // Populate outer fields (await as needed)
//       const leadByModel = mongoose.model(lead.leadByModel);
//       const allocatedToModel = mongoose.model(lastAlloc.taskallocatedToModel);
//       const allocatedByModel = mongoose.model(lastAlloc.taskallocatedByModel);

//       const [popLeadBy, popAllocatedTo, popAllocatedBy] = await Promise.all([
//         leadByModel
//           .findById(lead.leadBy)
//           .select("name")
//           .lean()
//           .catch(() => null),
//         allocatedToModel
//           .findById(lastAlloc.taskallocatedTo)
//           .select("name")
//           .lean()
//           .catch(() => null),
//         allocatedByModel
//           .findById(lastAlloc.taskallocatedBy)
//           .select("name")
//           .lean()
//           .catch(() => null),
//       ]);

//       // Populate activityLog fields that reference other models (submittedUser, taskallocatedTo)
//       const populatedActivityLog = await Promise.all(
//         activity.map(async (log) => {
//           let populatedSubmittedUser = null;
//           let populatedTaskAllocatedTo = null;
//           let populatedTaskAllocatedBy = null
//           let populatedTask = null;
//           let populatedTaskBy = null
//           if (
//             log.submittedUser &&
//             log.submissiondoneByModel &&
//             mongoose.models[log.submissiondoneByModel]
//           ) {
//             const model = mongoose.model(log.submissiondoneByModel);
//             populatedSubmittedUser = await model
//               .findById(log.submittedUser)
//               .select("name")
//               .lean()
//               .catch(() => null);
//           }
//           if (log.taskallocatedBy && log.taskallocatedByModel && mongoose.models[log.taskallocatedByModel]) {
//             const model = mongoose.model(log.taskallocatedByModel);
//             populatedTaskAllocatedBy = await model
//               .findById(log.taskallocatedBy)
//               .select("name")
//               .lean()
//               .catch(() => null);

//           }

//           if (
//             log.taskallocatedTo &&
//             log.taskallocatedToModel &&
//             mongoose.models[log.taskallocatedToModel]
//           ) {
//             const model = mongoose.model(log.taskallocatedToModel);
//             populatedTaskAllocatedTo = await model
//               .findById(log.taskallocatedTo)
//               .select("name")
//               .lean()
//               .catch(() => null);
//           }
//           if (log?.taskId) {
//             populatedTask = await Task.findById(log.taskId)
//               .select("taskName")
//               .lean()
//               .catch(() => null);
//           }
//           if (log?.taskBy) {
//             populatedTaskBy = await Task.findById(log.taskBy)
//           }

//           return {
//             ...log,
//             taskBy: populatedTaskBy,
//             submittedUser: populatedSubmittedUser || log.submittedUser,
//             taskallocatedBy: populatedTaskAllocatedBy || log.taskallocatedBy,
//             taskallocatedTo: populatedTaskAllocatedTo || log.taskallocatedTo,
//             taskId: populatedTask,
//           };
//         })
//       );
//       const populatedLeadFor = await Promise.all(
//         lead.leadFor.map(async (item) => {
//           const productorserviceModel = mongoose.model(
//             item.productorServicemodel
//           );
//           const populatedProductorService = await productorserviceModel
//             .findById(item.productorServiceId)
//             .lean(); // Use lean() to get plain JavaScript objects

//           return { ...item, productorServiceId: populatedProductorService };
//         })
//       );

//       // Determine neverfollowuped:
//       // - If the last matched allocation itself has followupClosed === true => NOT neverfollowuped
//       // - Else, check logs AFTER the lastAlloc.index: if any has nextFollowUpDate (non-null) => NOT neverfollowuped
//       // - Otherwise => neverfollowuped = true
//       const lastMatched = lastAlloc;
//       const lastMatchedClosed = !!lastMatched.followupClosed; // closed flag(s)
//       let neverfollowuped = false;

//       if (lastMatchedClosed) {
//         neverfollowuped = true;
//       } else {
//         const afterLogs = activity.slice(lastIndex + 1);
//         const foundNextFollowUp = afterLogs.some(
//           (log) => !!log.nextFollowUpDate
//         );
//         if (foundNextFollowUp) {
//           neverfollowuped = false;
//         } else {
//           // also, if the matched allocation itself had nextFollowUpDate, treat as not neverfollowuped
//           if (lastMatched.nextFollowUpDate) neverfollowuped = false;
//           else neverfollowuped = true;
//         }
//       }

//       // currentdateNextfollowup: whether the very last activity log entry has nextFollowUpDate (or you can define differently)
//       const lastActivity = activity[activity.length - 1] || {};
//       const Nextfollowup = !!lastActivity.nextFollowUpDate;

//       // allocatedfollowup: whether the last activity entry was created from followup task (taskfromFollowup flag)
//       const allocatedfollowup = !!lastActivity.taskfromFollowup;

//       // allocatedTaskClosed: whether last activity entry's allocatedClosed === true
//       const allocatedTaskClosed = !!lastActivity.allocatedClosed;

//       // push enriched lead
//       followupLeads.push({
//         ...lead,
//         leadBy: popLeadBy || lead.leadBy,
//         leadFor: populatedLeadFor,
//         allocatedTo: popAllocatedTo,
//         allocatedBy: popAllocatedBy,
//         activityLog: populatedActivityLog,
//         nextFollowUpDate: lastActivity.nextFollowUpDate ?? null, //to show the nextfollowupdate in the list
//         neverfollowuped, //to check whether the lead is ever followuped
//         Nextfollowup,
//         allocatedfollowup, //to know whether the lead have any task from followup
//         allocatedTaskClosed, //to know the the task from followup is closed or not
//       });
//     }


//     const ischekCollegueLeads = followupLeads.some((item) =>
//       item.allocatedBy._id.equals(userObjectId)
//     );

//     if (followupLeads && followupLeads.length > 0) {
//       return res.status(201).json({
//         messge: "leadfollowup found",
//         data: { followupLeads, ischekCollegueLeads },
//       });
//     } else {
//       return res
//         .status(404)
//         .json({ message: "leadfollowp not found", data: {} });
//     }
//   } catch (error) {
//     console.log("error:", error.message);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };///old code
export const GetleadById = async (req, res) => {
  const { leadDocId } = req.query
}

export const ApprovedforcefullyClosedTarget = async (req, res) => {
  try {
    const { leadDocId } = req.query

    if (!leadDocId) {
      return res
        .status(400)
        .json({ success: false, message: "leadDocId is required" })
    }

    const result = await LeadMaster.updateOne(
      { _id: leadDocId },
      { $set: { forcefullyClosedTarget: true } }
    )

    // result.matchedCount: how many docs matched filter
    // result.modifiedCount: how many docs actually changed
    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Lead not found" })
    }

    return res.status(200).json({
      success: true,
      message: "Target forcefully closed successfully",
      data: {
        leadDocId,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      }
    })
  } catch (error) {
    console.error("ApprovedforcefullyClosedTarget error:", error)
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" })
  }
}

// export const GetallfollowupList = async (req, res) => {
//   try {
//     const {
//       loggeduserid,
//       branchSelected,
//       role,
//       pendingfollowup,
//       viewmode,
//       startDate,
//       endDate,
//       header,
//       from = null
//     } = req.query;
//     const userObjectId = new mongoose.Types.ObjectId(loggeduserid);
//     const branchObjectId = new mongoose.Types.ObjectId(branchSelected);

//     const start = startDate ? new Date(startDate) : null;
//     const end = endDate ? new Date(endDate) : null;

//     // Check if viewmode is the string "true"
//     const isViewMode = viewmode === "true";
//     // Check for valid header and date params
//     const hasValidHeader = header && header !== "null" && header !== "undefined";
//     const hasValidDates = startDate && endDate &&
//       startDate !== "null" && endDate !== "null" &&
//       startDate !== "undefined" && endDate !== "undefined";


//     const isNewMode = isViewMode || hasValidHeader || hasValidDates;
//     // console.log("hasvalidhaeader", hasValidHeader)
//     // console.log("hasvaliddate", hasValidDates)
//     // console.log("isnewmodeeee", isNewMode)
//     // console.log("isviewmode", isViewMode)
//     let query;

//     // ✅ VIEW MODE
//     if (isViewMode) {

//       query = {
//         activityLog: {
//           $elemMatch: {
//             taskTo: "followup",
//             $or: [
//               { submittedUser: userObjectId },
//               { taskallocatedTo: userObjectId },
//             ],
//             allocationChanged: false,
//             allocatedClosed: false,
//           },
//         },
//         leadBranch: branchObjectId,

//       };
//       // ✅ Add condition only when needed
//       if (header !== "Total Leads") {
//         query.leadLost = false
//       }
//     } else {

//       // ✅ OLD NORMAL CONDITIONS
//       if (pendingfollowup === "true") {
//         if (role === "Admin") {
//           query = {
//             activityLog: {
//               $elemMatch: {
//                 taskTo: "followup",
//                 allocationChanged: false,
//                 allocatedClosed: false,
//                 taskClosed: false,
//                 followupClosed: false,
//               },
//             },
//             leadBranch: branchObjectId,
//             reallocatedTo: false,
//             leadLost: false,
//           };
//         } else {
//           query = {
//             activityLog: {
//               $elemMatch: {
//                 taskTo: "followup",
//                 $or: [
//                   { submittedUser: userObjectId },
//                   { taskallocatedTo: userObjectId },
//                 ],
//                 allocationChanged: false,
//                 allocatedClosed: false,
//                 taskClosed: false,
//                 followupClosed: false,
//               },
//             },
//             leadBranch: branchObjectId,
//             reallocatedTo: false,
//             leadLost: false,
//           };
//         }
//       } else if (pendingfollowup === "false") {
//         if (role === "Admin") {
//           query = {
//             activityLog: {
//               $elemMatch: {
//                 taskTo: "followup",
//                 allocationChanged: false,
//                 allocatedClosed: false,
//                 taskClosed: true,
//                 followupClosed: true,
//               },
//             },
//             leadBranch: branchObjectId,
//             leadLost: false,
//           };
//         } else {
//           query = {
//             activityLog: {
//               $elemMatch: {
//                 taskTo: "followup",
//                 $or: [
//                   { submittedUser: userObjectId },
//                   { taskallocatedTo: userObjectId },
//                 ],
//                 taskClosed: true,
//               },
//             },
//             leadBranch: branchObjectId,
//             leadLost: false,
//           };
//         }
//       }
//     }

//     const selectedfollowup = await LeadMaster.find(query)
//       .populate({ path: "customerName" })
//       .populate({ path: "partner" })
//       .lean();

//     const followupLeads = [];
//     // console.log("selctedfollowups",selectedfollowup)
//     for (const lead of selectedfollowup) {
//       const activity = Array.isArray(lead.activityLog) ? lead.activityLog : [];

//       let matchedAllocations;

//       // ✅ NEW LOGIC ONLY WHEN REQUIRED
//       if (isNewMode) {
//         matchedAllocations = activity
//           .map((item, index) => ({ ...item, index }))
//           .filter((item) => {
//             if (item.taskTo !== "followup") return false;
//             if (item.allocationChanged !== false) return false;
//             if (!item.submissionDate) return false;
//             //             if (from) {
//             //               return true;
//             //             }
//             // console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh")
//             //             const subDate = new Date(item.submissionDate);

//             //             if (start && end) {
//             //               if (subDate < start || subDate > end) return false;
//             //             }
//             //             return true
//             // Skip date filtering when from exists
//             //             if (from) return true;

//             //             if (start && end) {
//             // console.log("Hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh")
//             //               const subDate = new Date(item.submissionDate);
//             //               return subDate >= start && subDate <= end;
//             //             }

//             //             return true;
//             const hasFrom =
//               from &&
//               from !== "null" &&
//               from !== "undefined";

//             if (hasFrom) return true;

//             if (start && end) {
//               const subDate = new Date(item.submissionDate);
//               return subDate >= start && subDate <= end;
//             }
//             return true


//           });
//       } else {

//         // ✅ OLD LOGIC (NO DATE FILTER)
//         matchedAllocations = activity
//           .map((item, index) => ({ ...item, index }))
//           .filter((item) => item.taskTo === "followup");
//       }
//       if (matchedAllocations.length === 0) continue;
//       const lastAlloc = matchedAllocations[matchedAllocations.length - 1];
//       const lastIndex = lastAlloc.index;
//       // ✅ HEADER FILTER ONLY IN NEW MODE
//       if (isNewMode) {
//         if (header === "Pending") {
//           if (
//             lead.leadConvertedDate ||
//             lead.leadLostDate ||
//             lead.leadLost === true
//           ) {
//             continue;
//           }
//         }

//         if (header === "Converted") {
//           if (!lead.leadConvertedDate) continue;

//           const convDate = new Date(lead.leadConvertedDate);

//           if (start && end) {
//             if (convDate < start || convDate > end) continue;
//           }
//         }
//       }
//       // ✅ SAFE POPULATION
//       const leadByModel =
//         lead.leadByModel && mongoose.models[lead.leadByModel]
//           ? mongoose.model(lead.leadByModel)
//           : null;

//       const allocatedToModel =
//         lastAlloc.taskallocatedToModel &&
//           mongoose.models[lastAlloc.taskallocatedToModel]
//           ? mongoose.model(lastAlloc.taskallocatedToModel)
//           : null;

//       const allocatedByModel =
//         lastAlloc.taskallocatedByModel &&
//           mongoose.models[lastAlloc.taskallocatedByModel]
//           ? mongoose.model(lastAlloc.taskallocatedByModel)
//           : null;

//       const [popLeadBy, popAllocatedTo, popAllocatedBy] = await Promise.all([
//         leadByModel
//           ? leadByModel
//             .findById(lead.leadBy)
//             .select("name")
//             .lean()
//             .catch(() => null)
//           : null,
//         allocatedToModel
//           ? allocatedToModel
//             .findById(lastAlloc.taskallocatedTo)
//             .select("name")
//             .lean()
//             .catch(() => null)
//           : null,
//         allocatedByModel
//           ? allocatedByModel
//             .findById(lastAlloc.taskallocatedBy)
//             .select("name")
//             .lean()
//             .catch(() => null)
//           : null,
//       ]);
//       // ✅ POPULATE activityLog (only in old mode for detailed view)
//       let populatedActivityLog = activity;
//       if (!isNewMode) {
//         populatedActivityLog = await Promise.all(
//           activity.map(async (log) => {
//             let populatedSubmittedUser = null;
//             let populatedTaskAllocatedTo = null;
//             let populatedTaskAllocatedBy = null;
//             let populatedTask = null;
//             let populatedTaskBy = null;

//             if (
//               log.submittedUser &&
//               log.submissiondoneByModel &&
//               mongoose.models[log.submissiondoneByModel]
//             ) {
//               const model = mongoose.model(log.submissiondoneByModel);
//               populatedSubmittedUser = await model
//                 .findById(log.submittedUser)
//                 .select("name")
//                 .lean()
//                 .catch(() => null);
//             }

//             if (
//               log.taskallocatedBy &&
//               log.taskallocatedByModel &&
//               mongoose.models[log.taskallocatedByModel]
//             ) {
//               const model = mongoose.model(log.taskallocatedByModel);
//               populatedTaskAllocatedBy = await model
//                 .findById(log.taskallocatedBy)
//                 .select("name")
//                 .lean()
//                 .catch(() => null);
//             }

//             if (
//               log.taskallocatedTo &&
//               log.taskallocatedToModel &&
//               mongoose.models[log.taskallocatedToModel]
//             ) {
//               const model = mongoose.model(log.taskallocatedToModel);
//               populatedTaskAllocatedTo = await model
//                 .findById(log.taskallocatedTo)
//                 .select("name")
//                 .lean()
//                 .catch(() => null);
//             }

//             if (log?.taskId) {
//               populatedTask = await Task.findById(log.taskId)
//                 .select("taskName")
//                 .lean()
//                 .catch(() => null);
//             }

//             if (log?.taskBy) {
//               populatedTaskBy = await Task.findById(log.taskBy)
//                 .lean()
//                 .catch(() => null);
//             }

//             return {
//               ...log,
//               taskBy: populatedTaskBy,
//               submittedUser: populatedSubmittedUser || log.submittedUser,
//               taskallocatedBy: populatedTaskAllocatedBy || log.taskallocatedBy,
//               taskallocatedTo: populatedTaskAllocatedTo || log.taskallocatedTo,
//               taskId: populatedTask,
//             };
//           })
//         );
//       }
//       // ✅ POPULATE leadFor
//       const populatedLeadFor = await Promise.all(
//         lead.leadFor.map(async (item) => {
//           const model = mongoose.model(item.productorServicemodel);
//           const populated = await model
//             .findById(item.productorServiceId)
//             .lean()
//             .catch(() => null);

//           return { ...item, productorServiceId: populated };
//         })
//       );
//       const populatedpaymentHistory = lead?.paymentHistory?.length
//         ? await Promise.all(
//           lead.paymentHistory.map(async (history) => {
//             const populatedhistory = { ...history.toObject?.() ?? history }

//             // populate receivedBy (existing)
//             if (history.receivedModel && history.receivedBy) {
//               const recvModel = mongoose.model(history.receivedModel)
//               populatedhistory.receivedBy = await recvModel
//                 .findById(history.receivedBy)
//                 .select("name")
//                 .lean()
//             }

//             // populate each paymentEntries[].productId via productorServicemodel
//             if (Array.isArray(history.paymentEntries)) {
//               populatedhistory.paymentEntries = await Promise.all(
//                 history.paymentEntries.map(async (entry) => {
//                   const populatedEntry = { ...entry }

//                   if (entry.productorServicemodel && entry.productorServiceId) {
//                     try {
//                       const ProdModel = mongoose.model(entry.productorServicemodel)
//                       const doc = await ProdModel
//                         .findById(entry.productorServiceId)
//                         .select("productName name")
//                         .lean()

//                       populatedEntry.productorServiceId = doc
//                     } catch (err) {
//                       populatedEntry.productorServiceId = null
//                     }
//                   }

//                   return populatedEntry
//                 })
//               )
//             }

//             return populatedhistory
//           })
//         )
//         : []
//       const lastActivity = activity[activity.length - 1] || {};

//       // ✅ CALCULATE FLAGS (only in old mode)
//       let neverfollowuped = false;
//       let Nextfollowup = false;
//       let allocatedfollowup = false;
//       let allocatedTaskClosed = false;

//       if (!isNewMode) {
//         const lastMatched = lastAlloc;
//         const lastMatchedClosed = !!lastMatched.followupClosed;

//         if (lastMatchedClosed) {
//           neverfollowuped = true;
//         } else {
//           const afterLogs = activity.slice(lastIndex + 1);
//           const foundNextFollowUp = afterLogs.some(
//             (log) => !!log.nextFollowUpDate
//           );
//           if (foundNextFollowUp) {
//             neverfollowuped = false;
//           } else {
//             if (lastMatched.nextFollowUpDate) neverfollowuped = false;
//             else neverfollowuped = true;
//           }
//         }

//         Nextfollowup = !!lastActivity.nextFollowUpDate;
//         allocatedfollowup = !!lastActivity.taskfromFollowup;
//         allocatedTaskClosed = !!lastActivity.allocatedClosed;
//       }
//       // ✅ BUILD LEAD OBJECT
//       const leadObject = {
//         ...lead,
//         leadBy: popLeadBy || lead.leadBy,
//         paymentHistory: populatedpaymentHistory,
//         leadFor: populatedLeadFor,
//         allocatedTo: popAllocatedTo,
//         allocatedBy: popAllocatedBy,
//         nextFollowUpDate: lastActivity.nextFollowUpDate ?? null,
//       };

//       // Add detailed fields only in old mode
//       if (!isNewMode) {

//         leadObject.activityLog = populatedActivityLog;
//         leadObject.neverfollowuped = neverfollowuped;
//         leadObject.Nextfollowup = Nextfollowup;
//         leadObject.allocatedfollowup = allocatedfollowup;
//         leadObject.allocatedTaskClosed = allocatedTaskClosed;
//       }

//       followupLeads.push(leadObject);
//     }

//     const ischekCollegueLeads = followupLeads.some(
//       (item) =>
//         item.allocatedBy?._id?.toString() === userObjectId.toString()
//     );


//     if (followupLeads.length > 0) {
//       return res.status(201).json({
//         messge: "leadfollowup found",
//         data: { followupLeads, ischekCollegueLeads },
//       });
//     } else {
//       return res.status(200).json({ message: "leadfollowp not found", data: { followupLeads, ischekCollegueLeads } });
//     }
//   } catch (error) {
//     console.log("error:", error.message);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };old code




// export const SetDemoallocation = async (req, res) => {
//   try {
// console.log("dddddddddddddddddddddddddddddddddddd")
//     const { demoallocatedBy, leaddocId, editIndex } = req.query;
//     const demoData = req.body;
//     const { demoallocatedTo } = demoData;

//     const allocatedToObjectId = new mongoose.Types.ObjectId(demoallocatedTo);
//     const allocatedByObjectId = new mongoose.Types.ObjectId(demoallocatedBy);

//     let taskallocatedByModel;
//     let taskallocatedToModel;

//     const isallocatedbyStaff = await Staff.findOne({ _id: allocatedByObjectId });
//     if (isallocatedbyStaff) taskallocatedByModel = "Staff";
//     else {
//       const isallocatedbyAdmin = await Admin.findOne({ _id: allocatedByObjectId });
//       if (isallocatedbyAdmin) taskallocatedByModel = "Admin";
//     }

//     const isallocatedtoStaff = await Staff.findOne({ _id: allocatedToObjectId });
//     if (isallocatedtoStaff) taskallocatedToModel = "Staff";
//     else {
//       const isallocatedtoAdmin = await Admin.findOne({ _id: allocatedToObjectId });
//       if (isallocatedtoAdmin) taskallocatedToModel = "Admin";
//     }

//     const allocationtask = await Task.findOne({ taskName: "Allocation" });

//     if (!taskallocatedByModel || !taskallocatedToModel) {
//       return res.status(400).json({
//         message: "Invalid allocatedBy or allocatedTo ID"
//       });
//     }

//     const updates = [];

//     if (editIndex !== undefined && editIndex !== null) {
//       updates.push(
//         LeadMaster.updateOne(
//           { _id: leaddocId },
//           {
//             $set: {
//               [`activityLog.${Number(editIndex)}.allocationChanged`]: true
//             }
//           }
//         )
//       );
//     }

//     updates.push(
//       LeadMaster.updateOne(
//         { _id: leaddocId },
//         {
//           $push: {
//             activityLog: {
//               submissionDate: new Date(),
//               allocationDate: demoData.demoallocatedDate,
//               submittedUser: demoallocatedBy,
//               submissiondoneByModel: taskallocatedByModel,
//               taskallocatedBy: demoallocatedBy,
//               taskallocatedByModel,
//               taskallocatedTo: demoallocatedTo,
//               taskallocatedToModel,
//               remarks: demoData.demoDescription,
//               taskBy: allocationtask?._id,
//               taskTo: demoData?.selectedTypeName,
//               taskId: demoData?.selectedType,
//               taskfromFollowup: true,
//               allocationChanged: false
//             }
//           },
//           $set: { taskfromFollowup: true }
//         }
//       )
//     );

//     updates.push(
//       LeadMaster.updateOne(
//         { _id: leaddocId, "activityLog.taskTo": "followup", "activityLog.followupClosed": false },
//         {
//           $set: {
//             "activityLog.$[log].allocationlist": true
//           }
//         },
//         {
//           arrayFilters: [
//             {
//               "log.taskTo": "followup",
//               "log.followupClosed": false
//             }
//           ]
//         }
//       )
//     );

//     const results = await Promise.all(updates);
//     console.log(results);

//     return res.status(200).json({
//       message: "Demo added successfully",
//       results
//     });
//   } catch (error) {
//     console.log("error:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };
export const SetDemoallocation = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { demoallocatedBy, leaddocId, editIndex } = req.query;
    const {
      demoallocatedTo,
      demoallocatedDate,
      demoDescription,
      selectedTypeName,
      selectedType,
    } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(demoallocatedBy) ||
      !mongoose.Types.ObjectId.isValid(demoallocatedTo) ||
      !mongoose.Types.ObjectId.isValid(leaddocId) ||
      !mongoose.Types.ObjectId.isValid(selectedType)
    ) {
      return res.status(400).json({
        message: "Invalid allocated user, lead, or task ID",
      });
    }

    if (!selectedTypeName?.trim()) {
      return res.status(400).json({
        message: "Demo task type is required",
      });
    }

    const allocatedByObjectId = new mongoose.Types.ObjectId(demoallocatedBy);
    const allocatedToObjectId = new mongoose.Types.ObjectId(demoallocatedTo);
    const leadObjectId = new mongoose.Types.ObjectId(leaddocId);
    const taskObjectId = new mongoose.Types.ObjectId(selectedType);

    const [
      allocatedByStaff,
      allocatedByAdmin,
      allocatedToStaff,
      allocatedToAdmin,
      allocationTask,
    ] = await Promise.all([
      Staff.findById(allocatedByObjectId).lean(),
      Admin.findById(allocatedByObjectId).lean(),
      Staff.findById(allocatedToObjectId).lean(),
      Admin.findById(allocatedToObjectId).lean(),
      Task.findOne({ taskName: "Allocation" }).lean(),
    ]);

    const taskallocatedByModel = allocatedByStaff
      ? "Staff"
      : allocatedByAdmin
        ? "Admin"
        : null;

    const taskallocatedToModel = allocatedToStaff
      ? "Staff"
      : allocatedToAdmin
        ? "Admin"
        : null;

    if (!taskallocatedByModel || !taskallocatedToModel) {
      return res.status(400).json({
        message: "Invalid allocatedBy or allocatedTo ID",
      });
    }

    if (!allocationTask) {
      return res.status(404).json({
        message: "Allocation task not found",
      });
    }

    await session.withTransaction(async () => {
      const lead = await LeadMaster.findById(leadObjectId)
        .select("activityLog")
        .session(session);

      if (!lead) {
        throw Object.assign(new Error("Lead not found"), {
          statusCode: 404,
        });
      }

      let previousActivityLogId = null;
      const hasEditIndex =
        editIndex !== undefined && editIndex !== "undefined" && editIndex !== null && editIndex !== "null" && editIndex !== "";

      /*
       * Keep editIndex for now, but never use it in a MongoDB update path.
       * Convert the verified index to the existing subdocument _id.
       */
      if (hasEditIndex) {
        const index = Number(editIndex);


        if (
          !Number.isInteger(index) ||
          index < 0 ||
          index >= lead.activityLog.length ||
          !lead.activityLog[index] ||
          !lead.activityLog[index]._id
        ) {
          throw Object.assign(new Error("Invalid activity log index"), {
            statusCode: 400,
          });
        }

        previousActivityLogId = lead.activityLog[index]._id;
      }

      /*
       * Same allocation means: same allocated user + same task, and the log
       * is still active. Remove the taskId condition only if your business
       * rule says the same user must overwrite even for a different task.
       */
      const sameAllocationLog = [...lead.activityLog]
        .reverse()
        .find(
          (log) =>
            log &&
            log._id &&
            String(log.taskallocatedTo) === String(allocatedToObjectId) &&
            String(log.taskId) === String(taskObjectId) &&
            log.allocationChanged !== true &&
            log.taskClosed !== true &&
            log.allocatedClosed !== true
        );

      /* Mark prior open follow-up records before updating/pushing demo data. */
      await LeadMaster.updateOne(
        { _id: leadObjectId },
        {
          $set: {
            "activityLog.$[followupLog].allocationlist": true,
          },
        },
        {
          arrayFilters: [
            {
              "followupLog.taskTo": "followup",
              "followupLog.followupClosed": false,
            },
          ],
          runValidators: true,
          session,
        }
      );

      if (sameAllocationLog) {
        /*
         * Do not add another activityLog item. Update the latest matching
         * active allocation, while preserving its existing _id.
         */
        const result = await LeadMaster.updateOne(
          {
            _id: leadObjectId,
            "activityLog._id": sameAllocationLog._id,
          },
          {
            $set: {
              taskfromFollowup: true,
              "activityLog.$[sameLog].submissionDate": new Date(),
              "activityLog.$[sameLog].allocationDate": demoallocatedDate || null,
              "activityLog.$[sameLog].submittedUser": allocatedByObjectId,
              "activityLog.$[sameLog].submissiondoneByModel": taskallocatedByModel,
              "activityLog.$[sameLog].taskallocatedBy": allocatedByObjectId,
              "activityLog.$[sameLog].taskallocatedByModel": taskallocatedByModel,
              "activityLog.$[sameLog].taskallocatedTo": allocatedToObjectId,
              "activityLog.$[sameLog].taskallocatedToModel": taskallocatedToModel,
              "activityLog.$[sameLog].remarks": demoDescription || "",
              "activityLog.$[sameLog].taskBy": allocationTask._id,
              "activityLog.$[sameLog].taskTo": selectedTypeName.trim(),
              "activityLog.$[sameLog].taskId": taskObjectId,
              "activityLog.$[sameLog].taskfromFollowup": true,
              "activityLog.$[sameLog].allocationChanged": false,
            },
          },
          {
            arrayFilters: [
              {
                "sameLog._id": sameAllocationLog._id,
              },
            ],
            runValidators: true,
            session,
          }
        );

        if (result.matchedCount === 0) {
          throw Object.assign(new Error("Existing allocation was not found"), {
            statusCode: 409,
          });
        }

        return;
      }

      /*
       * Mark the previous selected log changed. The stored subdocument _id is
       * used instead of activityLog.<index>, so no null array placeholders
       * can be created.
       */
      if (previousActivityLogId) {
        const previousLogResult = await LeadMaster.updateOne(
          {
            _id: leadObjectId,
            "activityLog._id": previousActivityLogId,
          },
          {
            $set: {
              "activityLog.$[previousLog].allocationChanged": true,
            },
          },
          {
            arrayFilters: [
              {
                "previousLog._id": previousActivityLogId,
              },
            ],
            runValidators: true,
            session,
          }
        );

        if (previousLogResult.matchedCount === 0) {
          throw Object.assign(new Error("Previous activity log was not found"), {
            statusCode: 409,
          });
        }
      }

      const newDemoActivityLog = {
        _id: new mongoose.Types.ObjectId(),
        submissionDate: new Date(),
        allocationDate: demoallocatedDate || null,
        submittedUser: allocatedByObjectId,
        submissiondoneByModel: taskallocatedByModel,
        taskallocatedBy: allocatedByObjectId,
        taskallocatedByModel,
        taskallocatedTo: allocatedToObjectId,
        taskallocatedToModel,
        remarks: demoDescription || "",
        taskBy: allocationTask._id,
        taskTo: selectedTypeName.trim(),
        taskId: taskObjectId,
        taskfromFollowup: true,
        allocationChanged: false,
      };

      await LeadMaster.updateOne(
        { _id: leadObjectId },
        {
          $set: {
            taskfromFollowup: true,
          },
          $push: {
            activityLog: newDemoActivityLog,
          },
        },
        {
          runValidators: true,
          session,
        }
      );
    });

    const updatedLead = await LeadMaster.findById(leadObjectId).lean();

    return res.status(200).json({
      message: "Demo allocation saved successfully",
      data: updatedLead,
    });
  } catch (error) {
    console.error("SetDemoallocation error:", error);

    return res.status(error.statusCode || 500).json({
      message: error.statusCode ? error.message : "Internal server error",
    });
  } finally {
    await session.endSession();
  }
};
export const GetdemoleadCount = async (req, res) => {
  try {
    const { loggeduserid } = req.query;
    const objectid = new mongoose.Types.ObjectId(loggeduserid);
    const followupCount = await LeadMaster.find({
      "demofollowUp.demoallocatedTo": objectid,
    });
    const pendingDemoCount = followupCount.filter((item) =>
      item.demofollowUp.some(
        (demo) =>
          demo.demoallocatedTo.equals(objectid) &&
          demo.demofollowerDate === null
      )
    ).length;
    return res
      .status(200)
      .json({ message: "found mathch", data: pendingDemoCount });
  } catch (error) {
    console.log("error:", error.message);
    return res.status(500).json({ message: "internal server error" });
  }
};
export const GetrepecteduserDemo = async (req, res) => {
  try {
    const { userid, selectedBranch, role } = req.query;
    const userObjectId = new mongoose.Types.ObjectId(userid);
    const branchObjectId = new mongoose.Types.ObjectId(selectedBranch);
    let matchStage = {
      leadBranch: branchObjectId,
    };

    if (role === "Staff") {
      matchStage = {
        leadBranch: branchObjectId,
        $or: [
          {
            demofollowUp: {
              $elemMatch: { demoallocatedTo: userObjectId },
            },
          },
          {
            demofollowUp: {
              $elemMatch: { demoallocatedBy: userObjectId },
            },
          },
        ],
      };
    } else if (role === "Admin") {
      matchStage.$and = [
        { demofollowUp: { $exists: true } },
        { demofollowUp: { $ne: [] } },
      ];
    }

    const matchedLeads = await LeadMaster.aggregate([
      {
        $match: matchStage,
      },

      {
        $addFields: {
          demofollowUp: {
            $cond: {
              if: { $eq: [role, "Staff"] },
              then: {
                $filter: {
                  input: "$demofollowUp",
                  as: "demo",
                  cond: {
                    $or: [
                      { $eq: ["$$demo.demoallocatedTo", userObjectId] },
                      { $eq: ["$$demo.demoallocatedBy", userObjectId] },
                    ],
                  },
                },
              },
              else: {
                $cond: {
                  if: { $isArray: "$demofollowUp" },
                  then: "$demofollowUp",
                  else: [],
                },
              }, // Admin gets first entry
            },
          },
        },
      },
      {
        $set: {
          demofollowUp: {
            $map: {
              input: "$demofollowUp",
              as: "item",
              in: {
                $mergeObjects: [
                  "$$item",
                  { index: { $indexOfArray: ["$demofollowUp", "$$item"] } },
                ],
              },
            },
          },
        },
      },
      {
        $unwind: "$demofollowUp",
      },
      {
        $facet: {
          staff: [
            {
              $match: {
                "demofollowUp.demoallocatedByModel": "Staff",
              },
            },
            {
              $lookup: {
                from: "staffs",
                let: { userId: "$demofollowUp.demoallocatedBy" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$_id", "$$userId"] },
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                    },
                  },
                ],
                as: "demoallocatedByDetails",
              },
            },
            {
              $lookup: {
                from: "staffs",
                let: { userId: "$demofollowUp.demoallocatedTo" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$_id", "$$userId"] },
                    },
                  },
                  {
                    $project: { _id: 1, name: 1 },
                  },
                ],
                as: "demoallocatedToDetails",
              },
            },
          ],
          admin: [
            {
              $match: {
                "demofollowUp.demoallocatedByModel": "Admin",
              },
            },
            {
              $lookup: {
                from: "admins",
                let: { userId: "$demofollowUp.demoallocatedBy" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$_id", "$$userId"] },
                    },
                  },
                  {
                    $project: {
                      _id: 1,
                      name: 1,
                    },
                  },
                ],
                as: "demoallocatedByDetails",
              },
            },
            {
              $lookup: {
                from: "staffs", // Assuming `demoallocatedToModel` for Admin also refers to staff
                let: { userId: "$demofollowUp.demoallocatedTo" },
                pipeline: [
                  {
                    $match: {
                      $expr: { $eq: ["$_id", "$$userId"] },
                    },
                  },
                  {
                    $project: { _id: 1, name: 1 },
                  },
                ],
                as: "demoallocatedToDetails",
              },
            },
          ],
        },
      },
      {
        $project: {
          results: {
            $concatArrays: ["$staff", "$admin"],
          },
        },
      },
      {
        $unwind: "$results",
      },
      {
        $replaceRoot: {
          newRoot: "$results",
        },
      },
      {
        $unwind: {
          path: "$demoallocatedByDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: "$demoallocatedToDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $set: {
          "demofollowUp.demoallocatedBy": {
            _id: "$demoallocatedByDetails._id",
            name: "$demoallocatedByDetails.name",
          },
          "demofollowUp.demoallocatedTo": {
            _id: "$demoallocatedToDetails._id",
            name: "$demoallocatedToDetails.name",
          },
        },
      },
      {
        $unset: ["demoallocatedByDetails", "demoallocatedToDetails"],
      },
      // 🔍 Lookup customerName from customers collection
      {
        $lookup: {
          from: "customers",
          localField: "customerName",
          foreignField: "_id",
          as: "customerTmp",
        },
      },
      {
        $unwind: {
          path: "$customerTmp",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $set: {
          customerName: {
            customerName: "$customerTmp.customerName",
            email: "$customerTmp.email",
            mobile: "$customerTmp.mobile",
            landline: "$customerTmp.landline",
          },
        },
      },
      { $unset: "customerTmp" },
      ////Lookup on allocatedby////
      // 1. Lookup from both possible sources (staffs/admins)

      {
        $lookup: {
          from: "staffs",
          localField: "allocatedBy",
          foreignField: "_id",
          as: "allocatedByStaff",
        },
      },
      {
        $lookup: {
          from: "admins",
          localField: "allocatedBy",
          foreignField: "_id",
          as: "allocatedByAdmin",
        },
      },

      // 2. Merge the result based on the model
      {
        $addFields: {
          allocatedByTemp: {
            $cond: [
              { $eq: ["$allocatedByModel", "Staff"] },
              { $arrayElemAt: ["$allocatedByStaff", 0] },
              { $arrayElemAt: ["$allocatedByAdmin", 0] },
            ],
          },
        },
      },

      // 3. Replace original field
      {
        $set: {
          allocatedBy: { name: "$allocatedByTemp.name" },
        },
      },

      // 4. Clean up temp fields
      {
        $unset: ["allocatedByTemp", "allocatedByStaff", "allocatedByAdmin"],
      },
      // 🔍 Lookup allocatedTo (assumes Staff, adapt if needed)
      {
        $lookup: {
          from: "staffs",
          let: { id: "$allocatedTo", model: "$allocatedToModel" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$_id", "$$id"] },
                    { $eq: ["$$model", "Staff"] },
                  ],
                },
              },
            },
            { $project: { _id: 0, name: 1 } },
          ],
          as: "allocatedToTmp",
        },
      },
      {
        $unwind: {
          path: "$allocatedToTmp",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $set: { allocatedTo: "$allocatedToTmp" } },
      { $unset: "allocatedToTmp" },
      // 🔍 Lookup leadBy (assumes Staff, adapt if needed)
      {
        $lookup: {
          from: "staffs",
          let: { id: "$leadBy", model: "$assignedtoleadByModel" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$_id", "$$id"] },
                    { $eq: ["$$model", "Staff"] },
                  ],
                },
              },
            },
            { $project: { _id: 0, name: 1 } },
          ],
          as: "leadByTmp",
        },
      },
      {
        $unwind: {
          path: "$leadByTmp",
          preserveNullAndEmptyArrays: true,
        },
      },
      { $set: { leadBy: "$leadByTmp" } },
      { $unset: "leadByTmp" },

      {
        $group: {
          _id: "$_id",
          leadId: { $first: "$leadId" },
          customerName: { $first: "$customerName" },
          leadDate: { $first: "$leadDate" },
          leadFor: { $first: "$leadFor" },
          leadBy: { $first: "$leadBy" },
          leadBranch: { $first: "$leadBranch" },
          demofollowUp: { $push: "$demofollowUp" },
          followUpDatesandRemarks: { $first: "$followUpDatesandRemarks" },
          netAmount: { $first: "$netAmount" },
          remark: { $first: "$remark" },
          allocatedTo: { $first: "$allocatedTo" },
          allocatedBy: { $first: "$allocatedBy" },
        },
      },
    ]);
    return res
      .status(200)
      .json({ message: "Matched demo found", data: matchedLeads });
  } catch (error) { }
};
export const UpdateOrSubmittaskByfollower = async (req, res) => {
  try {
    const taskDetails = req.body;

    const updatedLead = await LeadMaster.updateOne(
      { _id: taskDetails.leadDocId },
      {
        $set: {
          [`task.${taskDetails.matchedtaskindex}.taskDate`]:
            taskDetails.taskDate,
          [`task.${taskDetails.matchedtaskindex}.taskRemarks`]:
            taskDetails.Remarks,
        },
        reallocation: true,
        allocatedTo: null,
        allocatedToModel: null,
      }
    );
    if (updatedLead.modifiedCount > 0) {
      return res.status(201).json({ message: "Demo submitted Succesfully" });
    } else if (
      updatedLead.matchedCount > 0 &&
      updatedLead.modifiedCount === 0
    ) {
      return res.status(304).json({ message: "Match found ,not submitted" });
    } else {
      return res.status(404).json({ message: "not submitted" });
    }
  } catch (error) {
    console.log("error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const UpdaeOrSubmitdemofollowByfollower = async (req, res) => {
  try {
    const demoDetails = req.body;
    const {
      matcheddemoindex,
      mathchedfollowUpDatesandRemarksIndex,
      leadDocId,
      followerDate,
      followerDescription,
    } = demoDetails;
    const followerData = {
      matcheddemoindex: demoDetails.matcheddemoindex,
      demoAssignedBy: demoDetails.demoAssignedBy,
      demoAssignedDate: demoDetails.demoAssignedDate,
      followerDate: demoDetails.followerDate,
      followerDescription: demoDetails.followerDescription,
    };

    const updatedLead = await LeadMaster.updateOne(
      { _id: leadDocId },
      {
        $set: {
          [`demofollowUp.${matcheddemoindex}.demofollowerDate`]: new Date(
            followerDate
          ),
          [`demofollowUp.${matcheddemoindex}.demofollowerDescription`]:
            followerDescription,
        },
        $push: {
          [`followUpDatesandRemarks.${mathchedfollowUpDatesandRemarksIndex}.folowerData`]:
            followerData,
        },
      }
    );
    if (updatedLead.modifiedCount > 0) {
      return res.status(201).json({ message: "Demo submitted Succesfully" });
    } else if (
      updatedLead.matchedCount > 0 &&
      updatedLead.modifiedCount === 0
    ) {
      return res.status(304).json({ message: "Match found ,not submitted" });
    } else {
      return res.status(404).json({ message: "not submitted" });
    }
  } catch (error) {
    console.log("error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const GetalltaskanalysisLeads = async (req, res) => {
  try {
    const { selectedBranch } = req.query;
    const result = await LeadMaster.find({
      leadBranch: selectedBranch,
      leadClosed: false,
      leadLost: false,
      reallocatedTo: false,
    })
      .populate({ path: "customerName", select: "customerName" })
      .lean();

    const alltaskanalysisleads = [];

    // filter leads that have more than 1 activity
    const filtered = result.filter((item) => item.activityLog.length > 1);

    for (const lead of filtered) {
      // ✅ populate all submittedUser in activityLog
      const populatedActivityLogs = [];
      for (const activity of lead.activityLog) {
        let populatedtaskBy = null;
        let populatedtask = null;
        if (activity.submittedUser && activity.submissiondoneByModel) {
          const SubmittedModel = mongoose.model(activity.submissiondoneByModel);
          const populatedSubmittedUser = await SubmittedModel.findById(
            activity.submittedUser
          )
            .select("name")
            .lean();
          if (activity.taskId && isValidObjectId(activity.taskId)) {
            populatedtask = await Task.findById(activity.taskId)
              .select("taskName")
              .lean();
          }
          if (activity.taskBy && isValidObjectId(activity.taskBy)) {
            populatedtaskBy = await Task.findById(activity.taskBy);
          }

          populatedActivityLogs.push({
            ...activity,
            taskId: populatedtask,
            taskBy: populatedtaskBy,
            submittedUser: populatedSubmittedUser,
          });
        } else {
          populatedActivityLogs.push(activity);
        }
      }

      // ✅ find last activity and resolve allocatedTo
      const lastActivity =
        populatedActivityLogs[populatedActivityLogs.length - 1];

      const taskallocatedtoid = lastActivity?.taskallocatedTo
        ? lastActivity.taskallocatedTo
        : lastActivity.submittedUser?._id; // careful: populated now

      const tasksubmittedmodel = lastActivity?.taskallocatedTo
        ? lastActivity.taskallocatedToModel
        : lastActivity.submissiondoneByModel;

      let populatedtaskAllocatedTo = null;
      if (taskallocatedtoid && tasksubmittedmodel) {
        const TaskAllocatedModel = mongoose.model(tasksubmittedmodel);
        populatedtaskAllocatedTo = await TaskAllocatedModel.findById(
          taskallocatedtoid
        )
          .select("name")
          .lean();
      }

      // ✅ push to final array
      alltaskanalysisleads.push({
        ...lead,
        activityLog: populatedActivityLogs,
        allocatedTo: populatedtaskAllocatedTo,
      });
    }

    if (result && result.length) {
      return res
        .status(200)
        .json({ message: "lead found", data: alltaskanalysisleads });
    } else {
      return res
        .status(404)
        .json({ message: "no leads founds for match", data: [] });
    }
  } catch (error) {
    console.log("error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const GetallReallocatedLead = async (req, res) => {
  try {
    const { selectedBranch } = req.query
    const branchObjectId = new mongoose.Types.ObjectId(selectedBranch)

    const query = {
      leadBranch: branchObjectId,
      reallocatedTo: true,
      leadConfirmed: false
    }

    const reallocatedLeads = await LeadMaster.find(query)
      .select({
        customerName: 1,
        partner: 1,
        leadBy: 1,
        leadByModel: 1,
        activityLog: 1,
        leadId: 1,
        leadDate: 1,
        mobile: 1,
        phone: 1,
        email: 1,
        location: 1,
        pincode: 1,
        trade: 1,
        remark: 1,
        reallocatedTo: 1,
        leadConfirmed: 1,
        leadBranch: 1,
        createdAt: 1
      })
      .populate({ path: "customerName", select: "customerName mobile email" })
      .populate({ path: "partner", select: "name" })
      .lean()

    if (!reallocatedLeads.length) {
      return res.status(200).json({
        message: "reallocated leads found",
        data: []
      })
    }

    const staffIds = new Set()
    const adminIds = new Set()
    const taskIds = new Set()

    for (const lead of reallocatedLeads) {
      if (lead?.leadBy) {
        if (lead.leadByModel === "Staff") staffIds.add(String(lead.leadBy))
        if (lead.leadByModel === "Admin") adminIds.add(String(lead.leadBy))
      }

      const lastActivity = lead?.activityLog?.[lead.activityLog.length - 1]

      if (lastActivity?.submittedUser) {
        if (lastActivity.submissiondoneByModel === "Staff") {
          staffIds.add(String(lastActivity.submittedUser))
        }
        if (lastActivity.submissiondoneByModel === "Admin") {
          adminIds.add(String(lastActivity.submittedUser))
        }
      }

      if (lastActivity?.taskBy) {
        taskIds.add(String(lastActivity.taskBy))
      }
    }

    const [staffDocs, adminDocs, taskDocs] = await Promise.all([
      staffIds.size
        ? mongoose.model("Staff").find({ _id: { $in: [...staffIds] } }).select("name").lean()
        : [],
      adminIds.size
        ? mongoose.model("Admin").find({ _id: { $in: [...adminIds] } }).select("name").lean()
        : [],
      taskIds.size
        ? Task.find({ _id: { $in: [...taskIds] } }).select("taskName").lean()
        : []
    ])

    const staffMap = new Map(staffDocs.map((doc) => [String(doc._id), doc]))
    const adminMap = new Map(adminDocs.map((doc) => [String(doc._id), doc]))
    const taskMap = new Map(taskDocs.map((doc) => [String(doc._id), doc]))

    const getUserByModel = (id, model) => {
      if (!id || !model) return null
      const key = String(id)
      if (model === "Staff") return staffMap.get(key) || null
      if (model === "Admin") return adminMap.get(key) || null
      return null
    }

    const populatedreallocatedLeads = reallocatedLeads.map((lead) => {
      const lastActivity = lead?.activityLog?.[lead.activityLog.length - 1] || null

      return {
        ...lead,
        leadBy: getUserByModel(lead?.leadBy, lead?.leadByModel),
        lasttask: lastActivity?.taskBy
          ? taskMap.get(String(lastActivity.taskBy)) || null
          : null,
        submittedUser: getUserByModel(
          lastActivity?.submittedUser,
          lastActivity?.submissiondoneByModel
        )
      }
    })

    return res.status(200).json({
      message: "reallocated leads found",
      data: populatedreallocatedLeads
    })
  } catch (error) {
    console.log("error:", error.message)
    return res.status(500).json({ message: "Internal server error" })
  }
}

export const GetallleadOwned = async (req, res) => {
  try {
    const { selectedBranch } = req.query;
  } catch (error) {
    console.log("error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const GetallLead = async (req, res) => {
  try {
    const { Status, selectedBranch, role } = req.query
    const branchObjectId = new mongoose.Types.ObjectId(selectedBranch)

    if (!Status && !role) {
      return res
        .status(400)
        .json({ message: "Status or role is missing " })
    }

    if (Status === "Pending") {
      // pending leads: activityLog size 1
      const query = { leadBranch: branchObjectId, activityLog: { $size: 1 } }

      const pendingLeads = await LeadMaster.find(query)
        .populate({ path: "customerName", select: "customerName" })
        .lean()

      const populatedPendingLeads = await Promise.all(
        pendingLeads.map(async (lead) => {
          if (!lead.leadByModel || !mongoose.models[lead.leadByModel]) {
            console.error(`Model ${lead.leadByModel} is not registered (leadId: ${lead.leadId})`)
            return lead
          }

          const assignedModel = mongoose.model(lead.leadByModel)
          const populatedLeadBy = await assignedModel
            .findById(lead.leadBy)
            .select("name")

          return { ...lead, leadBy: populatedLeadBy }
        })
      )

      return res.status(200).json({
        message: "pending leads found",
        data: populatedPendingLeads
      })
    }

    if (Status === "Approved") {
      const query = {
        leadBranch: branchObjectId,
        reallocatedTo: false,
        $and: [{ leadLost: { $ne: true } }, { leadClosed: { $ne: true } }],
        activityLog: { $exists: true, $not: { $size: 0 } },
        $expr: { $gte: [{ $size: "$activityLog" }, 2] }
      }

      const approvedAllocatedLeads = await LeadMaster.find(query)
        .populate({ path: "customerName", select: "customerName" })
        .lean()

      const leadIds = approvedAllocatedLeads.map((item) => item.leadId)
      console.log("Approved leadIds:", leadIds)

      const populatedApprovedLeads = await Promise.all(
        approvedAllocatedLeads.map(async (lead) => {
          try {
            // find last allocation entry (non-followup)
            const lastMatchingActivity = [...(lead.activityLog || [])]
              .reverse()
              .find(
                (log) =>
                  log &&
                  log.taskallocatedTo &&
                  log.taskallocatedBy &&
                  !log.taskfromFollowup
              )

            if (
              !lead.leadByModel ||
              !mongoose.models[lead.leadByModel] ||
              !lastMatchingActivity?.taskallocatedBy ||
              !lastMatchingActivity?.taskallocatedByModel ||
              !lastMatchingActivity?.taskallocatedTo ||
              !lastMatchingActivity?.taskallocatedToModel
            ) {
              console.error(`Lead ${lead.leadId}: missing models or allocation fields`, {
                leadByModel: lead.leadByModel,
                lastMatchingActivity
              })
              return lead
            }

            // referenced models
            const leadByModel = mongoose.model(lead.leadByModel)
            const allocatedToModel = mongoose.model(
              lastMatchingActivity.taskallocatedToModel
            )
            const allocatedByModel = mongoose.model(
              lastMatchingActivity.taskallocatedByModel
            )

            const populatedLeadBy = await leadByModel
              .findById(lead.leadBy)
              .select("name")
            const populatedAllocatedTo = await allocatedToModel
              .findById(lastMatchingActivity.taskallocatedTo)
              .select("name")
            const populatedAllocatedBy = await allocatedByModel
              .findById(lastMatchingActivity.taskallocatedBy)
              .select("name")

            // populate each log safely
            const populatedActivityLog = await Promise.all(
              (lead.activityLog || []).map(async (log, index) => {
                // log itself might be null/undefined
                if (!log) {
                  console.warn("Null/undefined log found", {
                    leadId: lead.leadId,
                    index
                  })
                  return log
                }

                // debug: see raw log with taskallocatedTo
                if (log.taskallocatedTo === null) {
                  console.warn("log.taskallocatedTo is null", {
                    leadId: lead.leadId,
                    index,
                    log
                  })
                }

                if (!log.submissiondoneByModel) {
                  return log
                }

                if (!mongoose.models[log.submissiondoneByModel]) {
                  console.error(
                    `Model ${log.submissiondoneByModel} not registered (leadId: ${lead.leadId}, logIndex: ${index})`
                  )
                  return log
                }

                const submissionUserModel = mongoose.model(
                  log.submissiondoneByModel
                )
                const populatedSubmissionUser = await submissionUserModel
                  .findById(log.submittedUser)
                  .select("name")

                let populatetaskBy = null
                let populateTask = null
                let populateTaskallocatedToUser = null

                if (log.taskBy) {
                  populatetaskBy = await Task.findById(log.taskBy)
                    .select("taskName")
                    .lean()
                }

                if (log.taskId) {
                  populateTask = await Task.findById(log.taskId)
                    .select("taskName")
                    .lean()
                }

                if (log.taskallocatedTo && log.taskallocatedToModel) {
                  const TaskAllocatedToModel = mongoose.model(
                    log.taskallocatedToModel
                  )

                  populateTaskallocatedToUser = await TaskAllocatedToModel
                    .findById(log.taskallocatedTo)
                    .select("name")
                    .lean()

                  if (!populateTaskallocatedToUser) {
                    console.warn("taskallocatedTo user not found", {
                      leadId: lead.leadId,
                      logIndex: index,
                      taskallocatedToId: log.taskallocatedTo,
                      taskallocatedToModel: log.taskallocatedToModel
                    })
                  }
                }

                // IMPORTANT: keep original taskallocatedTo (ObjectId),
                // store populated doc separately to avoid null property errors.
                return {
                  ...log,
                  taskBy: populatetaskBy,
                  taskId: populateTask,
                  taskallocatedToUser: populateTaskallocatedToUser,
                  submittedUser: populatedSubmissionUser
                }
              })
            )

            return {
              ...lead,
              leadBy: populatedLeadBy,
              allocatedTo: populatedAllocatedTo,
              allocatedBy: populatedAllocatedBy,
              activityLog: populatedActivityLog
            }
          } catch (err) {
            console.error("Error populating approved lead", {
              leadId: lead.leadId,
              error: err.message
            })
            // rethrow to see in global catch
            throw err
          }
        })
      )

      return res.status(200).json({
        message: "Approved leads found",
        data: populatedApprovedLeads
      })
    }

    return res.status(400).json({ message: "Invalid Status" })
  } catch (error) {
    console.log(error)
    console.log("error:", error.message)
    return res.status(500).json({ message: "Internal server error" })
  }
}

export const UpdateLeadfollowUpDate = async (req, res) => {
  try {
    const { formData, collectionupdatedata } = req.body;
    const { selectedleaddocId, loggeduserid } = req.query;

    if (!selectedleaddocId || !loggeduserid) {
      return res.status(400).json({
        message: "Missing lead or user reference"
      });
    }

    if (!formData || !formData.followupType) {
      return res.status(400).json({
        message: "Missing followup data"
      });
    }

    // 1) Resolve followedByModel
    let followedByModel = null;

    const isStaff = await Staff.findById(loggeduserid).lean();

    if (isStaff) {
      followedByModel = "Staff";
    } else {
      const isAdmin = await Admin.findById(loggeduserid).lean();

      if (isAdmin) {
        followedByModel = "Admin";
      }
    }

    if (!followedByModel) {
      return res.status(400).json({
        message: "Invalid followed user reference"
      });
    }

    // 2) Close previous open followup if lead closed
    if (formData.followupType === "closed") {
      await LeadMaster.updateOne(
        { _id: selectedleaddocId },
        {
          $set: {
            "activityLog.$[elem].reallocatedTo": true,
            "activityLog.$[elem].taskClosed": true,
            "activityLog.$[elem].followupClosed": true
          }
        },
        {
          arrayFilters: [
            {
              "elem.taskTo": { $exists: true },
              "elem.reallocatedTo": false,
              "elem.taskClosed": false,
              "elem.followupClosed": false
            }
          ]
        }
      );
    }
    // 3) Build activity entry
    let allocationTask = null
    if (formData.followupType === "closed") {
      allocationTask = await Task.findOne({
        taskName: "Follow-Up Closing"
      }).lean();
    } else if (formData.followupType === "lost") {
      allocationTask = await Task.findOne({
        taskName: "Lost"
      })

    } else {
      allocationTask = await Task.findOne({
        taskName: "Followup"
      }).lean();
    }


    const activityEntry = {
      submissionDate: formData.followUpDate,
      submittedUser: loggeduserid,
      submissiondoneByModel: followedByModel,
      taskBy: allocationTask?._id || null,
      nextFollowUpDate: formData?.nextfollowUpDate,
      remarks: formData.Remarks,
      taskfromFollowup: false
    };

    if (formData.followupType === "closed") {
      activityEntry.taskClosed = true;
      activityEntry.followupClosed = true;
      activityEntry.reallocatedTo = true;
    } else if (formData.followupType === "lost") {
      activityEntry.taskClosed = true;
    }

    // 4) Payment handling
    let paymentRecord = null;
    let receivedAmount = 0;

    if (
      collectionupdatedata &&
      Array.isArray(collectionupdatedata.paymentEntries)
    ) {
      const normalizedPaymentEntries =
        collectionupdatedata.paymentEntries.map((e) => ({
          productorServiceId: e.productorServiceId,
          productorServicemodel: e.productorServicemodel,
          netAmount: Number(e.netAmount || 0),
          receivedAmount: Number(e.receivedAmount || 0),
          balanceAmount: Number(e.balanceAmount || 0)
        }));

      receivedAmount = Number(
        collectionupdatedata?.totalReceivedAmount ?? 0
      );

      if (
        normalizedPaymentEntries.length > 0 ||
        receivedAmount > 0
      ) {
        paymentRecord = {
          paymentDate: new Date(),
          receivedAmount,
          paymentVerified: false,
          paymentEntries: normalizedPaymentEntries,
          receivedBy:
            collectionupdatedata?.receivedBy || null,
          receivedModel:
            collectionupdatedata?.receivedModel || null,
          bankRemarks:
            collectionupdatedata?.bankRemark ??
            formData?.bankRemarks ??
            "",
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
    }

    // 5) Get existing lead
    const existingLead = await LeadMaster.findById(
      selectedleaddocId
    );

    if (!existingLead) {
      return res.status(404).json({
        message: "Lead not found"
      });
    }

    // 6) Calculate updated amounts
    const currentPaid = Number(
      existingLead.totalPaidAmount || 0
    );

    const leadNetAmount = Number(
      existingLead.netAmount || 0
    );

    const updatedTotalPaid =
      currentPaid + receivedAmount;

    const updatedBalance =
      leadNetAmount - updatedTotalPaid

    // 7) Build update doc
    const updateDoc = {
      $push: {
        activityLog: activityEntry
      },
      $set: {
        totalPaidAmount: updatedTotalPaid,
        balanceAmount: updatedBalance,
        followupClosed: formData?.followupType === "closed" ? true : false
      }
    };

    // lead closed
    if (formData.followupType === "closed") {
      updateDoc.$set.reallocatedTo = true;
      updateDoc.$set.leadConvertedDate = new Date();
      updateDoc.$set.leadClosed = true;
      // updateDoc.$set.leadClosedDate = new Date();
    }

    // lead lost
    if (formData.followupType === "lost") {
      updateDoc.$set.leadLost = true;
      updateDoc.$set.leadLostDate = new Date();
    }

    // payment fully completed
    if (updatedBalance <= 0) {
      updateDoc.$set.paymentVerified = true;
    }

    // add payment history
    if (paymentRecord) {
      updateDoc.$push.paymentHistory = paymentRecord;
    }

    // remove empty operators
    if (Object.keys(updateDoc.$set).length === 0) {
      delete updateDoc.$set;
    }

    if (Object.keys(updateDoc.$push).length === 0) {
      delete updateDoc.$push;
    }

    // 8) Update lead
    const updatedLead =
      await LeadMaster.findOneAndUpdate(
        { _id: selectedleaddocId },
        updateDoc,
        {
          new: true
        }
      );

    return res.status(200).json({
      message: formData.followupType === "lost" ? "Lead losted" : formData.followupType === "closed" ? "Followup Closed" : "Next follow up updated",
      data: updatedLead
    });
  } catch (error) {
    console.log(
      "UpdateLeadfollowUpDate error:",
      error
    );

    return res.status(500).json({
      message: "Internal server error"
    });
  }
};
export const LeadClosingAmount = async (req, res) => {
  try {
    const { leadId, allocationType, allocatedBy } = req.query;
    const { formData } = req.body;
    const isStaff = await Staff.findOne({ _id: allocatedBy });
    const isAdmin = await Admin.findOne({ _id: allocatedBy });
    let leadClosedModel;
    if (isStaff) {
      leadClosedModel = "Staff";
    } else {
      if (isAdmin) {
        leadClosedModel = "Admin";
      }
    }

    const result = await LeadMaster.updateOne(
      { _id: leadId },
      {
        $inc: { balanceAmount: -Number(formData.recievedAmount || 0) },
        leadClosed: true,
        leaClosedBy: allocatedBy,
        leadClosedModel,
        reallocatedTo: false,
        allocationType: allocationType,
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "No lead found" });
    }

    if (result.modifiedCount === 0) {
      return res.status(400).json({ message: "Balance amount not changed" });
    }

    return res
      .status(200)
      .json({ message: "Lead closed successfully with payment" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const UpdateOrleadallocationTask = async (req, res) => {
  try {
    const { allocationpending, allocatedBy, allocationType } = req.query;

    const allocatedbyObjectid = new mongoose.Types.ObjectId(allocatedBy);
    const { selectedItem, formData } = req.body;

    let allocatedToModel;
    let allocatedByModel;

    const isStaffallocatedtomodel = await Staff.findOne({
      _id: selectedItem.allocatedTo,
    });

    if (isStaffallocatedtomodel) {
      allocatedToModel = "Staff";
    } else {
      const isAdminallocatedtomodel = await Admin.findOne({
        _id: selectedItem.allocatedTo,
      });
      if (isAdminallocatedtomodel) {
        allocatedToModel = "Admin";
      }
    }
    const isStaffallocatedbymodel = await Staff.findOne({
      _id: allocatedbyObjectid,
    });
    if (isStaffallocatedbymodel) {
      allocatedByModel = "Staff";
    } else {
      const isAdminallocatedbymodel = await Admin.findOne({
        _id: allocatedbyObjectid,
      });
      if (isAdminallocatedbymodel) {
        allocatedByModel = "Admin";
      }
    }

    if (!allocatedToModel || !allocatedByModel) {
      return res
        .status(400)
        .json({ message: "Invalid allocated/allocatedby reference" });
    }
    const updatedLead = await LeadMaster.findByIdAndUpdate(
      {
        _id: selectedItem._id,
      },
      {
        allocatedTo: selectedItem.allocatedTo,
        allocatedBy,
        allocatedToModel,
        allocatedByModel,
        allocationType,
        task: [
          {
            allocationDate: formData.allocationDate,
            allocatedTo: selectedItem.allocatedTo,
            taskallocatedToModel: allocatedToModel,
            allocatedBy,
            taskallocatedByModel: allocatedByModel,
            allocationDescription: formData.allocationDescription,
          },
        ],
      },
      { new: true }
    );
    if (allocationpending === "true" && updatedLead) {
      const pendingLeads = await LeadMaster.find({
        allocatedTo: null,
      })
        .populate({ path: "customerName", select: "customerName" })
        .lean();

      const populatedLeads = await Promise.all(
        pendingLeads.map(async (lead) => {
          if (
            !lead.leadByModel ||
            !mongoose.models[lead.leadByModel]
          ) {
            console.error(
              `Model ${lead.leadByModel} is not registered`
            );
            return lead; // Return lead as-is if model is invalid
          }

          // Fetch the referenced document manually
          const assignedModel = mongoose.model(lead.assignedtoleadByModel);
          const populatedLeadBy = await assignedModel
            .findById(lead.leadBy)
            .select("name");

          return { ...lead, leadBy: populatedLeadBy }; // Merge populated data
        })
      );
      return res
        .status(201)
        .json({ message: "pending leads found", data: populatedLeads });
    } else if (allocationpending === "false") {
      const allocatedLeads = await LeadMaster.find({
        allocatedTo: { $ne: null },
      })
        .populate({ path: "customerName", select: "customerName" })
        .lean();

      const populatedLeads = await Promise.all(
        allocatedLeads.map(async (lead) => {
          if (
            !lead.assignedtoleadByModel ||
            !mongoose.models[lead.assignedtoleadByModel]
          ) {
            console.error(
              `Model ${lead.assignedtoleadByModel} is not registered`
            );
            return lead; // Return lead as-is if model is invalid
          }

          // Fetch the referenced document manually
          const assignedModel = mongoose.model(lead.assignedtoleadByModel);
          const populatedLeadBy = await assignedModel
            .findById(lead.leadBy)
            .select("name");

          return { ...lead, leadBy: populatedLeadBy }; // Merge populated data
        })
      );
      return res
        .status(201)
        .json({ message: "updated allocation", data: populatedLeads });
    }
  } catch (error) {
    console.log("error:", error.message);
  }
  return res.status(500).json({ message: "Internal server error" });
};
export const updateReallocation = async (req, res) => {
  try {
    const { allocatedBy, selectedbranch, allocationTypeId, allocationName } = req.query;
    const allocatedbyObjectid = new mongoose.Types.ObjectId(allocatedBy);
    // const branchObjectId = new mongoose.Types.ObjectId(selectedbranch)
    const { selectedItem, formData } = req.body;
    let allocatedToModel;
    let allocatedByModel;
    const isStaffallocatedtomodel = await Staff.findOne({
      _id: selectedItem.allocatedTo,
    });
    if (isStaffallocatedtomodel) {
      allocatedToModel = "Staff";
    } else {
      const isAdminallocatedtomodel = await Admin.findOne({
        _id: selectedItem.allocatedTo,
      });
      if (isAdminallocatedtomodel) {
        allocatedToModel = "Admin";
      }
    }
    const isStaffallocatedbymodel = await Staff.findOne({
      _id: allocatedbyObjectid,
    });
    if (isStaffallocatedbymodel) {
      allocatedByModel = "Staff";
    } else {
      const isAdminallocatedbymodel = await Admin.findOne({
        _id: allocatedbyObjectid,
      });
      if (isAdminallocatedbymodel) {
        allocatedByModel = "Admin";
      }
    }
    if (!allocatedToModel || !allocatedByModel) {
      return res
        .status(400)
        .json({ message: "Invalid allocated/allocatedby reference" });
    }

    const matchedTask = await Task.findOne({ taskName: "Reallocation" })
    const activityLogEntry = {
      submissionDate: new Date(),
      submittedUser: allocatedBy,
      submissiondoneByModel: allocatedByModel,
      taskallocatedBy: allocatedBy,
      taskallocatedByModel: allocatedByModel,
      taskallocatedTo: selectedItem.allocatedTo,
      taskallocatedToModel: allocatedToModel,
      allocationDate: formData?.allocationDate,
      remarks: formData.allocationDescription,
      taskBy: matchedTask?._id,
      taskTo: allocationName.toLowerCase(),
      taskId: allocationTypeId,
      allocationChanged: false,
      taskfromFollowup: false,
    };
    if (allocationName.toLowerCase() === "followup") {
      activityLogEntry.followupClosed = false;
    }
    // return
    const updatedLead = await LeadMaster.findByIdAndUpdate(
      {
        _id: selectedItem._id,
      },

      {
        $push: {
          activityLog: activityLogEntry,
        },
        $set: {
          allocationType: allocationTypeId, // Set outside the activityLog array
          reallocatedTo: false,
          dueDate: formData.allocationDate,
        },
      },

      { new: true }
    );
    if (updatedLead) {
      return res.status(200).json({ message: "Re allocated successfully" });
    } else {
      return res.status(404).json({ message: "something went wrong" });
    }
  } catch (error) {
    console.log("error:", error.message);
    return res.status(500).json({ message: "internal server error" });
  }
};
export const UpadateOrLeadAllocationRegister = async (req, res) => {
  try {
    const {
      allocationpending,
      allocatedBy,
      allocationTypeName,
      selectedbranch,
      allocationtypeId,
    } = req.query;

    const allocatedbyObjectid = new mongoose.Types.ObjectId(allocatedBy);
    const branchObjectId = new mongoose.Types.ObjectId(selectedbranch);
    const { selectedItem, cleanedData } = req.body;

    let allocatedToModel;
    let allocatedByModel;
    const allocatedToId =
      typeof selectedItem?.allocatedTo === "object"
        ? selectedItem?.allocatedTo?._id || selectedItem?.allocatedTo?.id
        : selectedItem?.allocatedTo


    const isStaffallocatedtomodel = await Staff.findOne({
      _id: allocatedToId,
    });
    if (isStaffallocatedtomodel) {
      allocatedToModel = "Staff";
    } else {
      const isAdminallocatedtomodel = await Admin.findOne({
        _id: allocatedToId,
      });
      if (isAdminallocatedtomodel) {
        allocatedToModel = "Admin";
      }
    }
    const isStaffallocatedbymodel = await Staff.findOne({
      _id: allocatedbyObjectid,
    });
    if (isStaffallocatedbymodel) {
      allocatedByModel = "Staff";
    } else {
      const isAdminallocatedbymodel = await Admin.findOne({
        _id: allocatedbyObjectid,
      });
      if (isAdminallocatedbymodel) {
        allocatedByModel = "Admin";
      }
    }

    if (!allocatedToModel || !allocatedByModel) {
      return res
        .status(400)
        .json({ message: "Invalid allocated/allocatedby reference" });
    }

    const matchLead = await LeadMaster.findOne({ _id: selectedItem._id });
    const allocationTask = await Task.findOne({ taskName: "Allocation" });
    if (!allocationTask) {
      return res.status(404).json({ message: "allocation taskname not found" });
    }
    if (matchLead.activityLog.length === 1) {
      // Create base activity log
      const activityLogEntry = {
        submissionDate: new Date(),
        submittedUser: allocatedBy,
        submissiondoneByModel: allocatedByModel,
        taskallocatedBy: allocatedBy,
        taskallocatedByModel: allocatedByModel,
        taskallocatedTo: selectedItem.allocatedTo?.id,
        taskallocatedToModel: allocatedToModel,
        remarks: cleanedData.allocationDescription,
        taskBy: allocationTask?._id,
        taskTo: allocationTypeName.toLowerCase(),
        taskId: allocationtypeId,

        allocationChanged: false,
        taskfromFollowup: false,
      };

      // Conditionally add allocationDate
      if (allocationTypeName.toLowerCase() !== "followup") {
        activityLogEntry.allocationDate = cleanedData.allocationDate;
        // activityLogEntry.taskfromFollowup = false
      } else if (allocationTypeName.toLowerCase() === "followup") {
        activityLogEntry.followupClosed = false;
      }
      await LeadMaster.findByIdAndUpdate(
        { _id: selectedItem._id },
        {
          $push: {
            activityLog: activityLogEntry,
          },
          $set: {
            allocationType: allocationtypeId,
            taskfromFollowup: false,
            dueDate: cleanedData.allocationDate,
          },
        },
        { new: true }
      );
    } else if (matchLead.activityLog.length >= 2) {
      // Find index in activityLog that matches the criteria
      const matchingIndex = matchLead.activityLog.findIndex(
        (log) =>
          log.reallocatedTo === false &&
          log.taskClosed === false &&
          // log.followupClosed === false &&
          log.allocatedClosed === false && log?.allocationChanged === false &&
          log.taskTo // ensures the field exists
      );

      const task = matchLead.activityLog[matchingIndex]?.taskId;

      if (!task?.equals(allocationtypeId)) {
        return res.status(409).json({
          message:
            "Cannot change task name. It's already running.only possible to change the allocatedUser",
        });
      }

      if (matchingIndex !== -1) {
        // ✅ Update the matched log
        matchLead.activityLog[matchingIndex].allocationChanged = true;
      }

      // Important for deep changes in arrays
      // matchLead.markModified('activityLog');
      const activityLogEntry = {
        submissionDate: new Date(),
        submittedUser: allocatedBy,
        submissiondoneByModel: allocatedByModel,
        taskallocatedBy: allocatedBy,
        taskallocatedByModel: allocatedByModel,
        taskallocatedTo: allocatedToId,
        taskallocatedToModel: allocatedToModel,
        remarks: cleanedData.allocationDescription,
        taskBy: allocationTask?._id,
        taskTo: allocationTypeName.toLowerCase(),
        taskId: allocationtypeId,
        taskfromFollowup: false,
        taskClosed: false,
        followupClosed: false,
        allocatedClosed: false,
        allocationChanged: false,
      };
      if (allocationTypeName.toLowerCase() !== "followup") {
        activityLogEntry.allocationDate = cleanedData.allocationDate;
        // activityLogEntry.taskfromFollowup = false
      }
      if (cleanedData?.reason) {
        activityLogEntry.changeReason = cleanedData.reason
      }
      matchLead.dueDate = cleanedData.allocationDate;

      // Push new log
      matchLead.activityLog.push(activityLogEntry);

      await matchLead.save();
    }

    if (allocationpending === "true") {

      const pendingLeads = await LeadMaster.find({
        leadBranch: branchObjectId,
        activityLog: { $size: 1 },
      })
        .populate({ path: "customerName", select: "customerName" })
        .lean();

      const populatedLeads = await Promise.all(
        pendingLeads.map(async (lead) => {
          if (!lead.leadByModel || !mongoose.models[lead.leadByModel]) {
            console.error(`Model ${lead.leadByModel} is not registered`);
            return lead; // Return lead as-is if model is invalid
          }

          // Fetch the referenced document manually
          const assignedModel = mongoose.model(lead.leadByModel);
          const populatedLeadBy = await assignedModel
            .findById(lead.leadBy)
            .select("name");

          return { ...lead, leadBy: populatedLeadBy }; // Merge populated data
        })
      );
      return res
        .status(201)
        .json({ message: "Allocate successfully", data: populatedLeads });
    } else if (allocationpending === "false") {
      const allocatedLeads = await LeadMaster.find({
        allocatedTo: { $ne: null },
      })
        .populate({ path: "customerName", select: "customerName" })
        .lean();
      const populatedLeads = await Promise.all(
        allocatedLeads.map(async (lead) => {
          if (!lead.leadByModel || !mongoose.models[lead.leadByModel]) {
            console.error(`Model ${lead.leadByModel} is not registered`);
            return lead; // Return lead as-is if model is invalid
          }

          // Fetch the referenced document manually
          const assignedModel = mongoose.model(lead.leadByModel);
          const populatedLeadBy = await assignedModel
            .findById(lead.leadBy)
            .select("name");

          return { ...lead, leadBy: populatedLeadBy }; // Merge populated data
        })
      );
      return res
        .status(201)
        .json({ message: "updated allocation", data: populatedLeads });
    }
  } catch (error) {
    console.log("error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const RejectTask = async (req, res) => {
  try {
    const taskDetails = req.body;
    const { leadDocId, taskName, rejectionReason } = taskDetails;

    if (!leadDocId || !taskName) {
      return res.status(400).json({ message: "leadDocId and taskName are required" });
    }

    if (!rejectionReason?.trim()) {
      return res.status(400).json({ message: "rejectionReason is required" });
    }

    const leadObjectId = new mongoose.Types.ObjectId(leadDocId);
    const lead = await LeadMaster.findById(leadObjectId);

    if (!lead) {
      return res.status(404).json({ message: "Lead not found" });
    }

    const activityLog = lead.activityLog || [];

    const matchedIndex = activityLog.findIndex(
      (log) =>
        String(log.taskId) === String(taskName) &&
        log.taskClosed === false
    );

    if (matchedIndex === -1) {
      return res.status(404).json({
        message: "Matching pending task not found, or it is already closed"
      });
    }

    // 1) update existing log entry
    const updateResult = await LeadMaster.updateOne(
      { _id: leadObjectId },
      {
        $set: {
          [`activityLog.${matchedIndex}.allocationChanged`]: true,
          taskfromFollowup: false
        }
      }
    );
    const rejectionTask = await Task.findOne({ taskName: "Task Rejection" })

    // 2) push rejection entry
    const activityLogEntry = {
      submissionDate: taskDetails.submissionDate || new Date(),
      submittedUser: taskDetails.allocatedTo,
      submissiondoneByModel: taskDetails.allocatedtomodel,
      changeReason: rejectionReason,
      taskBy: rejectionTask,

      allocationChanged: false,
      actionType: "rejected"
    };

    const pushResult = await LeadMaster.updateOne(
      { _id: leadObjectId },
      {
        $push: {
          activityLog: activityLogEntry
        }
      }
    );

    if (updateResult.modifiedCount === 0 && pushResult.modifiedCount === 0) {
      return res.status(400).json({ message: "No changes were made" });
    }

    return res.status(200).json({ message: "Task rejected successfully" });
  } catch (error) {
    console.log("error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//infinite scrolling closing leads
// export const GetclosedLeads = async (req, res) => {
//   try {
//     const {
//       selectedBranch,
//       page = 1,
//       limit = 20,
//     } = req.query;

//     if (!selectedBranch) {
//       return res.status(400).json({
//         success: false,
//         message: "selectedBranch is required",
//       });
//     }

//     if (!mongoose.isValidObjectId(selectedBranch)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid selectedBranch ID",
//       });
//     }

//     const pageNumber = Math.max(Number(page) || 1, 1);
//     const limitNumber = Math.min(
//       Math.max(Number(limit) || 20, 1),
//       100
//     );

//     const skip = (pageNumber - 1) * limitNumber;

//     const query = {
//       leadBranch: new mongoose.Types.ObjectId(selectedBranch),
//       leadConfirmed: true,
//       leadClosed: true,
//     };

//     const [closedLeads, totalClosedLeads] = await Promise.all([
//       LeadMaster.find(query)
//         .select(`
//           leadId
//           leadDate
//           customerName
//           mobile
//           phone
//           email
//           leadConfirmed
//           leadClosed
//           leadClosedDate
//           leadConvertedDate
//           leadLost
//           leadBranch
//           leadBy
//           leadByModel
//           leadClosedModel
//           netAmount
//           taxableAmount
//           taxAmount
//           discountAmount
//           balanceAmount
//           totalPaidAmount
//           paymentVerified
//           forcefullyClosedTarget
//           source
//           leadFor
//           paymentHistory
//           activityLog
//           createdAt
//           updatedAt
//         `)
//         .populate({
//           path: "customerName",
//           select: "name customerName mobile phone email",
//         })
//         .populate({
//           path: "leadFor.productorServiceId",
//           select: `
//         productName
//         serviceName
//         name
//         productCode
//         serviceCode
//         selected
//         category_id
//         categoryId
//         productPrice
//         price
//       `,
//         })
//         .sort({
//           leadClosedDate: -1,
//           leadConvertedDate: -1,
//           leadDate: -1,
//         })
//         .skip(skip)
//         .limit(limitNumber)
//         .lean(),

//       LeadMaster.countDocuments(query),
//     ]);

//     const totalPages = Math.ceil(
//       totalClosedLeads / limitNumber
//     );

//     console.log(
//       `Closed leads fetched: ${closedLeads.length} | Branch: ${selectedBranch}`
//     );

//     return res.status(200).json({
//       success: true,
//       message: "Closed leads fetched successfully",
//       data: {
//         closedLeads,
//         pagination: {
//           totalRecords: totalClosedLeads,
//           currentPage: pageNumber,
//           totalPages,
//           limit: limitNumber,
//           hasNextPage: pageNumber < totalPages,
//           hasPreviousPage: pageNumber > 1,
//         },
//       },
//     });
//   } catch (error) {
//     console.error("getClosedLeads error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };



export const GetclosedLeads = async (req, res) => {
  try {
    const { selectedBranch, startDate, endDate } = req.query;

    if (!selectedBranch) {
      return res.status(400).json({
        success: false,
        message: "selectedBranch is required",
      });
    }

    if (!mongoose.isValidObjectId(selectedBranch)) {
      return res.status(400).json({
        success: false,
        message: "Invalid selectedBranch ID",
      });
    }

    const query = {
      leadBranch: new mongoose.Types.ObjectId(selectedBranch),
      leadConfirmed: true,
      leadClosed: true,
    };

    if (startDate || endDate) {
      const closedDateRange = {};

      if (startDate) {
        const parsedStartDate = new Date(
          `${startDate}T00:00:00.000+05:30`
        );
        if (Number.isNaN(parsedStartDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid startDate",
          });
        }
        closedDateRange.$gte = parsedStartDate;
      }

      if (endDate) {
        const parsedEndDate = new Date(`${endDate}T23:59:59.999+05:30`);
        if (Number.isNaN(parsedEndDate.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid endDate",
          });
        }
        closedDateRange.$lte = parsedEndDate;
      }

      if (
        closedDateRange.$gte &&
        closedDateRange.$lte &&
        closedDateRange.$gte > closedDateRange.$lte
      ) {
        return res.status(400).json({
          success: false,
          message: "startDate cannot be after endDate",
        });
      }

      query.leadClosedDate = closedDateRange;
    }

    const closedLeads = await LeadMaster.find(query)
      .select(`
        leadId
        leadDate
        customerName
        mobile
        phone
        email
        leadConfirmed
        leadClosed
        leadClosedDate
        leadConvertedDate
        leadLost
        leadBranch
        leadBy
        leadByModel
        leadClosedModel
        netAmount
        taxableAmount
        taxAmount
        discountAmount
        balanceAmount
        totalPaidAmount
        paymentVerified
        forcefullyClosedTarget
        source
        leadFor
        paymentHistory
        activityLog
        createdAt
        updatedAt
      `)
      .populate({
        path: "customerName",
        select: `
          name
          customerName
          mobile
          phone
          email
        `,
      })
      .populate({
        path: "leadBy",
        select: "name",
      })
      .populate({
        path: "leadFor.productorServiceId",
        model: Product,
        select: "productName shortName",
      })
      .populate({
        path: "activityLog.taskBy",
        select: "taskName code listed",
      })
      .populate({
        path: "activityLog.taskId",
        select: "taskName code listed",
      })
      .sort({
        leadClosedDate: -1,
        leadConvertedDate: -1,
        leadDate: -1,
      })
      .lean();

    const activityUserFields = [
      { path: "submittedUser", modelPath: "submissiondoneByModel" },
      { path: "taskallocatedBy", modelPath: "taskallocatedByModel" },
      { path: "taskallocatedTo", modelPath: "taskallocatedToModel" },
    ];
    const activityUserIds = {
      Staff: new Set(),
      Admin: new Set(),
    };

    closedLeads.forEach((lead) => {
      (lead.activityLog || []).forEach((log) => {
        activityUserFields.forEach(({ path, modelPath }) => {
          const modelName = log?.[modelPath];
          const userId = toIdString(log?.[path]);

          if (
            userId &&
            mongoose.isValidObjectId(userId) &&
            activityUserIds[modelName]
          ) {
            activityUserIds[modelName].add(userId);
          }
        });
      });
    });

    const [activityStaff, activityAdmins] = await Promise.all([
      Staff.find({ _id: { $in: [...activityUserIds.Staff] } })
        .select("name email role department")
        .lean(),
      Admin.find({ _id: { $in: [...activityUserIds.Admin] } })
        .select("name email role department")
        .lean(),
    ]);
    const activityUsersByModel = {
      Staff: new Map(
        activityStaff.map((user) => [String(user._id), user])
      ),
      Admin: new Map(
        activityAdmins.map((user) => [String(user._id), user])
      ),
    };

    closedLeads.forEach((lead) => {
      lead.activityLog = (lead.activityLog || []).map((log) => {
        const populatedLog = { ...log };

        activityUserFields.forEach(({ path, modelPath }) => {
          const currentValue = log?.[path];
          if (!currentValue) return;

          const modelName = log?.[modelPath];
          const userId = toIdString(currentValue);
          populatedLog[path] =
            activityUsersByModel[modelName]?.get(userId) || null;
        });

        return populatedLog;
      });
    });

    console.log(
      `Closed leads fetched: ${closedLeads.length} | Branch: ${selectedBranch}`
    );

    return res.status(200).json({
      success: true,
      message: "Closed leads fetched successfully",
      data: {
        closedLeads,
        totalRecords: closedLeads.length,
      },
    });
  } catch (error) {
    console.error("GetclosedLeads error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const UpdateLeadTask = async (req, res) => {
  try {
    const taskDetails = req.body;
    console.log("taskdetails", taskDetails)

    const leadObjectId = new mongoose.Types.ObjectId(taskDetails.leadDocId);
    const lead = await LeadMaster.findById(leadObjectId);
    const activityLog = [...lead.activityLog];
    const Index = activityLog.length - 1;
    const updateFields = {
      [`activityLog.${Index}.taskSubmissionDate`]: taskDetails.submissionDate,
      [`activityLog.${Index}.taskDescription`]: taskDetails.taskDescription,
      [`activityLog.${Index}.taskClosed`]: true,
    };

    // Conditionally add a field
    if (!taskDetails.taskfromFollowup) {
      updateFields[`activityLog.${Index}.reallocatedTo`] = true;
    }
    await LeadMaster.updateOne({ _id: leadObjectId }, { $set: updateFields });
    const isTaskfromFollowup = taskDetails.taskfromFollowup ? true : false;
    // 2️⃣ 🔑 UPDATE allocationlist = false for matching followup tasks
    await LeadMaster.collection.updateOne(
      { _id: leadObjectId },
      {
        $set: {
          "activityLog.$[log].allocationlist": false  // Set to false
        }
      },
      {
        arrayFilters: [
          {
            "log.taskTo": "followup",
            "log.taskClosed": false,      // ✅ Your condition
            "log.allocationlist": true    // ✅ Your condition
          }
        ]
      }
    );

    // Build the activity log entry
    const activityLogEntry = {
      submissionDate: taskDetails.submissionDate,
      submittedUser: taskDetails.allocatedTo,
      submissiondoneByModel: taskDetails.allocatedtomodel,
      remarks: taskDetails.taskDescription,
      taskBy: taskDetails.taskName,
      taskClosed: true,
      taskfromFollowup: isTaskfromFollowup,
      allocatedClosed: isTaskfromFollowup,
      reallocatedTo: !isTaskfromFollowup,
    };

    const updateleadTask = await LeadMaster.findByIdAndUpdate(leadObjectId, {
      $push: {
        activityLog: activityLogEntry,
      },
      $set: {
        taskfromFollowup: false,
        reallocatedTo: !isTaskfromFollowup,
      },
    });
    if (updateleadTask) {
      return res.status(201).json({ message: "submitted succesfully" });
    } else {
      return res.status(404).json({ message: "something went wrong" });
    }
  } catch (error) {
    console.log("error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};



const { Types } = mongoose;

const toObjectId = (value) =>
  isValidObjectId(value) ? new Types.ObjectId(value) : null;



const getRegisteredModel = (modelName) => {
  if (!modelName) return null;
  return mongoose.models[modelName] || null;
};

const batchFetchByModels = async (modelName, ids, select) => {
  const Model = getRegisteredModel(modelName);
  if (!Model || !ids?.size) return [];

  return Model.find({ _id: { $in: [...ids] } })
    .select(select)
    .lean();
};

const buildMap = (docs) =>
  new Map(docs.map((doc) => [String(doc._id), doc]));

export const GetrespectedleadTask = async (req, res) => {
  try {
    const { userid, branchSelected, role, ownTask } = req.query;

    const userObjectId = toObjectId(userid);
    const branchObjectId = toObjectId(branchSelected);

    if (!userObjectId) {
      return res.status(400).json({
        message: "Invalid userid",
      });
    }

    if (!branchObjectId) {
      return res.status(400).json({
        message: "Invalid branchSelected",
      });
    }

    const isAdmin = role === "Admin";
    const isManager = role === "Manager";
    const isOwnTask = ownTask === "true";

    /*
      allowedUserIds rules:

      ownTask=true:
        [logged-in user only]

      Admin and ownTask=false:
        null = no taskallocatedTo restriction

      Manager and ownTask=false:
        [manager id + ids of staff assigned under manager]

      Staff:
        [logged-in user only]
    */
    let allowedUserIds = [];

    if (isOwnTask) {
      // Highest priority: return only the user's own tasks.
      allowedUserIds = [userObjectId];
    } else if (isAdmin) {
      // Admin can access every valid task in the selected branch.
      allowedUserIds = null;
    } else if (isManager) {
      /*
        Change Staff to the exact model that contains:
        {
          assignedto: ObjectId
        }
      */
      const assignedStaff = await Staff.find({
        assignedto: userObjectId,
      })
        .select("_id")
        .lean();

      const assignedStaffIds = assignedStaff.map((staff) => staff._id);

      // Manager's own tasks + direct subordinate staff tasks.
      allowedUserIds = [userObjectId, ...assignedStaffIds];
    } else {
      // Normal staff only get their own tasks.
      allowedUserIds = [userObjectId];
    }

    const elemMatch = {
      allocationChanged: false,
      taskTo: { $ne: "followup" },
      ...(allowedUserIds
        ? {
          taskallocatedTo: {
            $in: allowedUserIds,
          },
        }
        : {}),
    };

    const query = {
      leadBranch: branchObjectId,
      activityLog: {
        $elemMatch: elemMatch,
      },
    };

    const selectedfollowup = await LeadMaster.find(query)
      .select({
        leadId: 1,
        leadDate: 1,
        customerName: 1,
        netAmount: 1,
        mobile: 1,
        phone: 1,
        email: 1,
        location: 1,
        pincode: 1,
        trade: 1,
        partner: 1,
        leadConfirmed: 1,
        leadClosed: 1,
        leadLost: 1,
        dueDate: 1,
        leadFor: 1,
        leadBy: 1,
        leadByModel: 1,
        activityLog: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .populate({
        path: "customerName",
        select: "customerName",
      })
      .lean();

    if (!selectedfollowup.length) {
      return res.status(200).json({
        message: "No Task found",
        data: [],
      });
    }

    const userIdsByModel = {};
    const taskIds = new Set();
    const productIds = new Set();
    const serviceIds = new Set();

    for (const lead of selectedfollowup) {
      if (lead?.leadBy && lead?.leadByModel) {
        userIdsByModel[lead.leadByModel] ??= new Set();
        userIdsByModel[lead.leadByModel].add(String(lead.leadBy));
      }

      for (const log of lead.activityLog || []) {
        if (log?.submittedUser && log?.submissiondoneByModel) {
          userIdsByModel[log.submissiondoneByModel] ??= new Set();
          userIdsByModel[log.submissiondoneByModel].add(
            String(log.submittedUser)
          );
        }

        if (log?.taskallocatedTo && log?.taskallocatedToModel) {
          userIdsByModel[log.taskallocatedToModel] ??= new Set();
          userIdsByModel[log.taskallocatedToModel].add(
            String(log.taskallocatedTo)
          );
        }

        if (log?.taskallocatedBy && log?.taskallocatedByModel) {
          userIdsByModel[log.taskallocatedByModel] ??= new Set();
          userIdsByModel[log.taskallocatedByModel].add(
            String(log.taskallocatedBy)
          );
        }

        if (log?.taskId) {
          taskIds.add(String(log.taskId));
        }

        if (log?.taskBy && isValidObjectId(log.taskBy)) {
          taskIds.add(String(log.taskBy));
        }
      }

      for (const item of lead.leadFor || []) {
        if (!item?.productorServiceId || !item?.productorServicemodel) {
          continue;
        }

        if (item.productorServicemodel === "Product") {
          productIds.add(String(item.productorServiceId));
        }

        if (item.productorServicemodel === "Service") {
          serviceIds.add(String(item.productorServiceId));
        }
      }
    }

    const userModelEntries = Object.entries(userIdsByModel);

    const userFetchPromises = userModelEntries.map(
      ([modelName, ids]) =>
        batchFetchByModels(modelName, ids, "name").then((docs) => [
          modelName,
          buildMap(docs),
        ])
    );

    const [userMapsEntries, taskDocs, productDocs, serviceDocs] =
      await Promise.all([
        Promise.all(userFetchPromises),

        taskIds.size
          ? Task.find({
            _id: {
              $in: [...taskIds],
            },
          })
            .select("taskName")
            .lean()
          : [],

        productIds.size
          ? mongoose
            .model("Product")
            .find({
              _id: {
                $in: [...productIds],
              },
            })
            .select("productName")
            .lean()
          : [],

        serviceIds.size
          ? mongoose
            .model("Service")
            .find({
              _id: {
                $in: [...serviceIds],
              },
            })
            .select("serviceName productName")
            .lean()
          : [],
      ]);

    const userMaps = new Map(userMapsEntries);
    const taskMap = buildMap(taskDocs);
    const productMap = buildMap(productDocs);
    const serviceMap = buildMap(serviceDocs);

    const resolveUser = (id, modelName) => {
      const key = toIdString(id);

      if (!key || !modelName) {
        return id ?? null;
      }

      const modelMap = userMaps.get(modelName);

      return modelMap?.get(key) || id;
    };

    const resolveTask = (id) => {
      const key = toIdString(id);

      if (!key) {
        return id ?? null;
      }

      return taskMap.get(key) || id;
    };

    const resolveProductOrService = (id, modelName) => {
      const key = toIdString(id);

      if (!key || !modelName) {
        return id ?? null;
      }

      if (modelName === "Product") {
        return productMap.get(key) || id;
      }

      if (modelName === "Service") {
        return serviceMap.get(key) || id;
      }

      return id;
    };

    /*
      This filters activityLog before sending data to the client.

      Example:
      A Manager with ownTask=false may receive:
      - tasks allocated to the manager
      - tasks allocated to the manager's assigned staff

      A Manager with ownTask=true receives:
      - only tasks allocated directly to the manager
    */
    const hasTaskAccess = (log) => {
      if (!log?.taskallocatedTo) {
        return false;
      }

      if (log?.allocationChanged) {
        return false;
      }

      if (log?.taskTo === "followup") {
        return false;
      }

      // Highest priority: ownTask returns only the logged-in user's tasks.
      if (isOwnTask) {
        return (
          String(log.taskallocatedTo) === String(userObjectId)
        );
      }

      // Admin, when ownTask=false, can access all valid branch tasks.
      if (isAdmin) {
        return true;
      }

      // Manager/staff: use allowed allocation IDs.
      return allowedUserIds.some(
        (allowedId) =>
          String(allowedId) === String(log.taskallocatedTo)
      );
    };

    const taskLeads = [];

    for (const lead of selectedfollowup) {
      const activityLog = Array.isArray(lead.activityLog)
        ? lead.activityLog
        : [];

      const leadFor = Array.isArray(lead.leadFor)
        ? lead.leadFor
        : [];

      /*
        Do not return unrelated allocation activity logs.
        Only send the logs the current user has permission to view.
      */
      const accessibleActivityLog = activityLog.filter(hasTaskAccess);

      if (!accessibleActivityLog.length) {
        continue;
      }

      const lastAccessibleAllocation =
        accessibleActivityLog[accessibleActivityLog.length - 1];

      const populatedActivityLog = accessibleActivityLog.map((log) => ({
        ...log,
        taskBy: resolveTask(log?.taskBy),
        taskId: resolveTask(log?.taskId),

        submittedUser: resolveUser(
          log?.submittedUser,
          log?.submissiondoneByModel
        ),

        taskallocatedTo: resolveUser(
          log?.taskallocatedTo,
          log?.taskallocatedToModel
        ),

        taskallocatedBy: resolveUser(
          log?.taskallocatedBy,
          log?.taskallocatedByModel
        ),
      }));

      const populatedLeadFor = leadFor.map((item) => ({
        ...item,
        productorServiceId: resolveProductOrService(
          item?.productorServiceId,
          item?.productorServicemodel
        ),
      }));

      taskLeads.push({
        ...lead,

        leadBy: resolveUser(
          lead?.leadBy,
          lead?.leadByModel
        ),

        taskallocatedTo: resolveUser(
          lastAccessibleAllocation?.taskallocatedTo,
          lastAccessibleAllocation?.taskallocatedToModel
        ),

        taskallocatedBy: resolveUser(
          lastAccessibleAllocation?.taskallocatedBy,
          lastAccessibleAllocation?.taskallocatedByModel
        ),

        activityLog: populatedActivityLog,
        leadFor: populatedLeadFor,
      });
    }

    if (!taskLeads.length) {
      return res.status(200).json({
        message: "No Task found",
        data: [],
      });
    }

    return res.status(200).json({
      message: "Task found",
      data: taskLeads,
    });
  } catch (error) {
    console.error("GetrespectedleadTask error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};




// export const GetrespectedleadTask = async (req, res) => {
//   try {
//     const { userid, branchSelected, role, ownTask } = req.query;

//     const userObjectId = toObjectId(userid);
//     const branchObjectId = toObjectId(branchSelected);

//     if (!userObjectId) {
//       return res.status(400).json({ message: "Invalid userid" });
//     }

//     if (!branchObjectId) {
//       return res.status(400).json({ message: "Invalid branchSelected" });
//     }

//     const isAdmin = role === "Admin";
//     const isManager = role === "Manager";

//     /*
//       Access rules:
//       Admin:
//         - Can see every active task in the selected branch.

//       Manager:
//         - Can see tasks allocated to the manager.
//         - Can see tasks allocated to staff where staff.assignedto = manager _id.

//       Other staff:
//         - Can see only their own allocated tasks.
//     */

//     let allowedUserIds = [];

//     if (isAdmin) {
//       // No allocation-user restriction for Admin.
//       allowedUserIds = null;
//     } else if (isManager) {
//       // IMPORTANT:
//       // Change Staff to your real Mongoose staff model if needed.
//       const managerStaff = await Staff.find({
//         assignedto: userObjectId,
//       })
//         .select("_id")
//         .lean();

//       const assignedStaffIds = managerStaff.map((staff) => staff._id);

//       // Manager can see their own tasks + their assigned staff tasks.
//       allowedUserIds = [userObjectId, ...assignedStaffIds];
//     } else {
//       // Normal staff can only see their own assigned tasks.
//       allowedUserIds = [userObjectId];
//     }

//     const elemMatch = {
//       allocationChanged: false,
//       taskTo: { $ne: "followup" },
//       ...(allowedUserIds
//         ? { taskallocatedTo: { $in: allowedUserIds } }
//         : {}),
//     };

//     const query = {
//       leadBranch: branchObjectId,
//       activityLog: { $elemMatch: elemMatch },
//     };

//     const selectedfollowup = await LeadMaster.find(query)
//       .select({
//         leadId: 1,
//         leadDate: 1,
//         customerName: 1,
//         netAmount: 1,
//         mobile: 1,
//         phone: 1,
//         email: 1,
//         location: 1,
//         pincode: 1,
//         trade: 1,
//         partner: 1,
//         leadConfirmed: 1,
//         leadClosed: 1,
//         leadLost: 1,
//         dueDate: 1,
//         leadFor: 1,
//         leadBy: 1,
//         leadByModel: 1,
//         activityLog: 1,
//         createdAt: 1,
//         updatedAt: 1,
//       })
//       .populate({
//         path: "customerName",
//         select: "customerName",
//       })
//       .lean();

//     if (!selectedfollowup.length) {
//       return res.status(200).json({
//         message: "No Task found",
//         data: [],
//       });
//     }

//     const userIdsByModel = {};
//     const taskIds = new Set();
//     const productIds = new Set();
//     const serviceIds = new Set();

//     for (const lead of selectedfollowup) {
//       if (lead?.leadBy && lead?.leadByModel) {
//         userIdsByModel[lead.leadByModel] ??= new Set();
//         userIdsByModel[lead.leadByModel].add(String(lead.leadBy));
//       }

//       for (const log of lead.activityLog || []) {
//         if (log?.submittedUser && log?.submissiondoneByModel) {
//           userIdsByModel[log.submissiondoneByModel] ??= new Set();
//           userIdsByModel[log.submissiondoneByModel].add(
//             String(log.submittedUser)
//           );
//         }

//         if (log?.taskallocatedTo && log?.taskallocatedToModel) {
//           userIdsByModel[log.taskallocatedToModel] ??= new Set();
//           userIdsByModel[log.taskallocatedToModel].add(
//             String(log.taskallocatedTo)
//           );
//         }

//         if (log?.taskallocatedBy && log?.taskallocatedByModel) {
//           userIdsByModel[log.taskallocatedByModel] ??= new Set();
//           userIdsByModel[log.taskallocatedByModel].add(
//             String(log.taskallocatedBy)
//           );
//         }

//         if (log?.taskId) {
//           taskIds.add(String(log.taskId));
//         }

//         if (log?.taskBy && isValidObjectId(log.taskBy)) {
//           taskIds.add(String(log.taskBy));
//         }
//       }

//       for (const item of lead.leadFor || []) {
//         if (!item?.productorServiceId || !item?.productorServicemodel) {
//           continue;
//         }

//         if (item.productorServicemodel === "Product") {
//           productIds.add(String(item.productorServiceId));
//         }

//         if (item.productorServicemodel === "Service") {
//           serviceIds.add(String(item.productorServiceId));
//         }
//       }
//     }

//     const userModelEntries = Object.entries(userIdsByModel);

//     const userFetchPromises = userModelEntries.map(([modelName, ids]) =>
//       batchFetchByModels(modelName, ids, "name").then((docs) => [
//         modelName,
//         buildMap(docs),
//       ])
//     );

//     const [userMapsEntries, taskDocs, productDocs, serviceDocs] =
//       await Promise.all([
//         Promise.all(userFetchPromises),

//         taskIds.size
//           ? Task.find({
//               _id: { $in: [...taskIds] },
//             })
//               .select("taskName")
//               .lean()
//           : [],

//         productIds.size
//           ? mongoose
//               .model("Product")
//               .find({
//                 _id: { $in: [...productIds] },
//               })
//               .select("productName")
//               .lean()
//           : [],

//         serviceIds.size
//           ? mongoose
//               .model("Service")
//               .find({
//                 _id: { $in: [...serviceIds] },
//               })
//               .select("serviceName productName")
//               .lean()
//           : [],
//       ]);

//     const userMaps = new Map(userMapsEntries);
//     const taskMap = buildMap(taskDocs);
//     const productMap = buildMap(productDocs);
//     const serviceMap = buildMap(serviceDocs);

//     const resolveUser = (id, modelName) => {
//       const key = toIdString(id);

//       if (!key || !modelName) {
//         return id ?? null;
//       }

//       const modelMap = userMaps.get(modelName);

//       return modelMap?.get(key) || id;
//     };

//     const resolveTask = (id) => {
//       const key = toIdString(id);

//       if (!key) {
//         return id ?? null;
//       }

//       return taskMap.get(key) || id;
//     };

//     const resolveProductOrService = (id, modelName) => {
//       const key = toIdString(id);

//       if (!key || !modelName) {
//         return id ?? null;
//       }

//       if (modelName === "Product") {
//         return productMap.get(key) || id;
//       }

//       if (modelName === "Service") {
//         return serviceMap.get(key) || id;
//       }

//       return id;
//     };

//     const hasTaskAccess = (log) => {
//       if (!log?.taskallocatedTo) {
//         return false;
//       }

//       if (log?.allocationChanged) {
//         return false;
//       }

//       if (log?.taskTo === "followup") {
//         return false;
//       }

//       // Admin can access all valid tasks in the selected branch.
//       if (isAdmin) {
//         return true;
//       }

//       // Manager can access own tasks and assigned staff tasks.
//       // Normal staff can access only own tasks.
//       return allowedUserIds.some(
//         (allowedId) =>
//           String(allowedId) === String(log.taskallocatedTo)
//       );
//     };

//     const taskLeads = [];

//     for (const lead of selectedfollowup) {
//       const activityLog = Array.isArray(lead.activityLog)
//         ? lead.activityLog
//         : [];

//       const leadFor = Array.isArray(lead.leadFor)
//         ? lead.leadFor
//         : [];

//       /*
//         Return only activity logs the current user is authorized to see.
//         This prevents a manager/staff member from receiving unrelated
//         allocation history in the API response.
//       */
//       const accessibleActivityLogs = activityLog.filter(hasTaskAccess);

//       if (!accessibleActivityLogs.length) {
//         continue;
//       }

//       const lastAccessibleAllocation =
//         accessibleActivityLogs[accessibleActivityLogs.length - 1];

//       const populatedActivityLog = accessibleActivityLogs.map((log) => ({
//         ...log,
//         taskBy: resolveTask(log?.taskBy),
//         taskId: resolveTask(log?.taskId),
//         submittedUser: resolveUser(
//           log?.submittedUser,
//           log?.submissiondoneByModel
//         ),
//         taskallocatedTo: resolveUser(
//           log?.taskallocatedTo,
//           log?.taskallocatedToModel
//         ),
//         taskallocatedBy: resolveUser(
//           log?.taskallocatedBy,
//           log?.taskallocatedByModel
//         ),
//       }));

//       const populatedLeadFor = leadFor.map((item) => ({
//         ...item,
//         productorServiceId: resolveProductOrService(
//           item?.productorServiceId,
//           item?.productorServicemodel
//         ),
//       }));

//       taskLeads.push({
//         ...lead,
//         leadBy: resolveUser(lead?.leadBy, lead?.leadByModel),

//         taskallocatedTo: resolveUser(
//           lastAccessibleAllocation?.taskallocatedTo,
//           lastAccessibleAllocation?.taskallocatedToModel
//         ),

//         taskallocatedBy: resolveUser(
//           lastAccessibleAllocation?.taskallocatedBy,
//           lastAccessibleAllocation?.taskallocatedByModel
//         ),

//         activityLog: populatedActivityLog,
//         leadFor: populatedLeadFor,
//       });
//     }

//     if (!taskLeads.length) {
//       return res.status(200).json({
//         message: "No Task found",
//         data: [],
//       });
//     }

//     return res.status(200).json({
//       message: "Task found",
//       data: taskLeads,
//     });
//   } catch (error) {
//     console.error("GetrespectedleadTask error:", error);

//     return res.status(500).json({
//       message: "Internal server error",
//     });
//   }
// };

// export const GetrespectedleadTask = async (req, res) => {
//   try {
//     const { userid, branchSelected, role, ownTask } = req.query;

//     const userObjectId = toObjectId(userid);
//     const branchObjectId = toObjectId(branchSelected);



//     if (ownTask === "true" && !userObjectId) {
//       return res.status(400).json({ message: "Invalid userid" });
//     }

//     const isAdminOrManager = role === "Admin" || role === "Manager";

//     const elemMatch = {
//       allocationChanged: false,
//       taskTo: { $ne: "followup" },
//       ...(isAdminOrManager ? {} : { taskallocatedTo: userObjectId }),
//     };

//     const query = {
//       leadBranch: branchObjectId,
//       activityLog: { $elemMatch: elemMatch },
//     };

//     const selectedfollowup = await LeadMaster.find(query)
//       .select({
//         leadId: 1,
//         leadDate: 1,
//         customerName: 1,
//         netAmount: 1,
//         mobile: 1,
//         phone: 1,
//         email: 1,
//         location: 1,
//         pincode: 1,
//         trade: 1,
//         partner: 1,
//         leadConfirmed: 1,
//         leadClosed: 1,
//         leadLost: 1,
//         dueDate: 1,
//         leadFor: 1,
//         leadBy: 1,
//         leadByModel: 1,
//         activityLog: 1,
//         createdAt: 1,
//         updatedAt: 1,
//       })
//       .populate({ path: "customerName", select: "customerName" })
//       .lean();

//     if (!selectedfollowup.length) {
//       return res.status(200).json({ message: "No Task found", data: [] });
//     }

//     const userIdsByModel = {};
//     const taskIds = new Set();
//     const productIds = new Set();
//     const serviceIds = new Set();

//     for (const lead of selectedfollowup) {
//       if (lead?.leadBy && lead?.leadByModel) {
//         userIdsByModel[lead.leadByModel] ??= new Set();
//         userIdsByModel[lead.leadByModel].add(String(lead.leadBy));
//       }

//       for (const log of lead.activityLog || []) {
//         if (log?.submittedUser && log?.submissiondoneByModel) {
//           userIdsByModel[log.submissiondoneByModel] ??= new Set();
//           userIdsByModel[log.submissiondoneByModel].add(String(log.submittedUser));
//         }

//         if (log?.taskallocatedTo && log?.taskallocatedToModel) {
//           userIdsByModel[log.taskallocatedToModel] ??= new Set();
//           userIdsByModel[log.taskallocatedToModel].add(String(log.taskallocatedTo));
//         }

//         if (log?.taskallocatedBy && log?.taskallocatedByModel) {
//           userIdsByModel[log.taskallocatedByModel] ??= new Set();
//           userIdsByModel[log.taskallocatedByModel].add(String(log.taskallocatedBy));
//         }

//         if (log?.taskId) taskIds.add(String(log.taskId));
//         if (log?.taskBy && isValidObjectId(log.taskBy)) {
//           taskIds.add(String(log.taskBy));
//         }
//       }

//       for (const item of lead.leadFor || []) {
//         if (!item?.productorServiceId || !item?.productorServicemodel) continue;

//         if (item.productorServicemodel === "Product") {
//           productIds.add(String(item.productorServiceId));
//         } else if (item.productorServicemodel === "Service") {
//           serviceIds.add(String(item.productorServiceId));
//         }
//       }
//     }

//     const userModelEntries = Object.entries(userIdsByModel);

//     const userFetchPromises = userModelEntries.map(([modelName, ids]) =>
//       batchFetchByModels(modelName, ids, "name")
//         .then((docs) => [modelName, buildMap(docs)])
//     );

//     const [userMapsEntries, taskDocs, productDocs, serviceDocs] = await Promise.all([
//       Promise.all(userFetchPromises),
//       taskIds.size
//         ? Task.find({ _id: { $in: [...taskIds] } }).select("taskName").lean()
//         : [],
//       productIds.size
//         ? mongoose.model("Product").find({ _id: { $in: [...productIds] } }).select("productName").lean()
//         : [],
//       serviceIds.size
//         ? mongoose.model("Service").find({ _id: { $in: [...serviceIds] } }).select("serviceName productName").lean()
//         : [],
//     ]);

//     const userMaps = new Map(userMapsEntries);
//     const taskMap = buildMap(taskDocs);
//     const productMap = buildMap(productDocs);
//     const serviceMap = buildMap(serviceDocs);

//     const resolveUser = (id, modelName) => {
//       const key = toIdString(id);
//       if (!key || !modelName) return id ?? null;
//       const modelMap = userMaps.get(modelName);
//       return modelMap?.get(key) || id;
//     };

//     const resolveTask = (id) => {
//       const key = toIdString(id);
//       if (!key) return id ?? null;
//       return taskMap.get(key) || id;
//     };

//     const resolveProductOrService = (id, modelName) => {
//       const key = toIdString(id);
//       if (!key || !modelName) return id ?? null;
//       if (modelName === "Product") return productMap.get(key) || id;
//       if (modelName === "Service") return serviceMap.get(key) || id;
//       return id;
//     };

//     const taskLeads = [];

//     for (const lead of selectedfollowup) {
//       const activityLog = Array.isArray(lead.activityLog) ? lead.activityLog : [];
//       const leadFor = Array.isArray(lead.leadFor) ? lead.leadFor : [];

//       let lastAllocatedItem = null;
//       for (const item of activityLog) {
//         if (item?.taskallocatedTo) {
//           lastAllocatedItem = item;
//         }
//       }

//       if (ownTask === "true") {
//         const matchedallocation = activityLog.filter(
//           (item) =>
//             String(item?.taskallocatedTo) === String(userid) &&
//             item?.taskTo !== "followup" &&
//             !item?.allocationChanged
//         );

//         if (!matchedallocation.length) continue;

//         const firstMatched = matchedallocation[0];

//         const populatedActivityLog = activityLog.map((log) => ({
//           ...log,
//           taskBy: resolveTask(log?.taskBy),
//           taskId: resolveTask(log?.taskId),
//           submittedUser: resolveUser(log?.submittedUser, log?.submissiondoneByModel),
//           taskallocatedTo: resolveUser(log?.taskallocatedTo, log?.taskallocatedToModel),
//         }));

//         const populatedLeadFor = leadFor.map((item) => ({
//           ...item,
//           productorServiceId: resolveProductOrService(
//             item?.productorServiceId,
//             item?.productorServicemodel
//           ),
//         }));

//         taskLeads.push({
//           ...lead,
//           leadBy: resolveUser(lead?.leadBy, lead?.leadByModel),
//           taskallocatedTo: resolveUser(
//             firstMatched?.taskallocatedTo,
//             firstMatched?.taskallocatedToModel
//           ),
//           taskallocatedBy: resolveUser(
//             firstMatched?.taskallocatedBy,
//             firstMatched?.taskallocatedByModel
//           ),
//           activityLog: populatedActivityLog,
//           leadFor: populatedLeadFor,
//         });

//         continue;
//       }

//       const populatedActivityLog = activityLog.map((item) => ({
//         ...item,
//         taskBy: resolveTask(item?.taskBy),
//         taskId: resolveTask(item?.taskId),
//         submittedUser: resolveUser(item?.submittedUser, item?.submissiondoneByModel),
//         taskallocatedTo: resolveUser(item?.taskallocatedTo, item?.taskallocatedToModel),
//       }));

//       const populatedLeadFor = leadFor.map((item) => ({
//         ...item,
//         productorServiceId: resolveProductOrService(
//           item?.productorServiceId,
//           item?.productorServicemodel
//         ),
//       }));

//       taskLeads.push({
//         ...lead,
//         leadBy: resolveUser(lead?.leadBy, lead?.leadByModel),
//         taskallocatedTo: lastAllocatedItem
//           ? resolveUser(lastAllocatedItem?.taskallocatedTo, lastAllocatedItem?.taskallocatedToModel)
//           : null,
//         taskallocatedBy: lastAllocatedItem
//           ? resolveUser(lastAllocatedItem?.taskallocatedBy, lastAllocatedItem?.taskallocatedByModel)
//           : null,
//         activityLog: populatedActivityLog,
//         leadFor: populatedLeadFor,
//       });
//     }

//     if (!taskLeads.length) {
//       return res.status(200).json({ message: "No Task found", data: [] });
//     }

//     return res.status(200).json({ message: "Task found", data: taskLeads });
//   } catch (error) {
//     console.error("GetrespectedleadTask error:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };



export const GetselectedLeadData = async (req, res) => {
  try {
    const { leadId } = req.query;
    if (!leadId) {
      return res.status(400).json({ message: "No leadid reference exists" });
    }
    const selectedLead = await LeadMaster.findById({ _id: leadId })
      .populate({
        path: "customerName",
        populate: [
          {
            path: "partner",
          },
          {
            path: "selected.product_id",
          },
        ],
      })
      .lean();

    if (
      !selectedLead.leadByModel ||
      !mongoose.models[selectedLead.leadByModel]
    ) {
      console.error(
        `Model ${selectedLead.assignedtoleadByModel} is not registered`
      );
      console.error(`Model ${selectedLead.allocatedToModel} is not registered`);
      // return selectedLead
      const populatedLeads = await Promise.all(
        selectedLead.leadFor.map(async (item) => {
          const productorserviceModel = mongoose.model(
            item.productorServicemodel
          );
          const populatedProductorService = await productorserviceModel
            .findById(item.productorServiceId)
            .lean(); // Use lean() to get plain JavaScript objects

          return { ...item, productorServiceId: populatedProductorService };
        })
      );

      const mergedleads = { ...selectedLead, leadFor: populatedLeads };
      return res
        .status(200)
        .json({ message: "matched lead found", data: [mergedleads] });
    } else {
      // Fetch the referenced document manually
      const assignedModel = mongoose.model(selectedLead.leadByModel);

      const populatedLeadBy = await assignedModel
        .findById(selectedLead.leadBy)
        .select("name");

      const populatedLeadFor = await Promise.all(
        selectedLead.leadFor.map(async (item) => {
          const productorserviceModel = mongoose.model(
            item.productorServicemodel
          );
          const populatedProductorService = await productorserviceModel
            .findById(item.productorServiceId)
            .lean(); // Use lean() to get plain JavaScript objects

          return { ...item, productorServiceId: populatedProductorService };
        })
      );

      const populatedApprovedLead = {
        ...selectedLead, // convert Mongoose doc to plain object
        leadFor: populatedLeadFor,
        leadBy: populatedLeadBy,
      };
      if (populatedApprovedLead) {
        return res.status(200).json({
          message: "matched lead found",
          data: [populatedApprovedLead],
        });
      }
    }
  } catch (error) {
    console.log("error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const GetallfollowupListfromFollowupSummary = async (req, res) => {
  try {
    const {
      loggeduserid,
      branchSelected,
      role,
      pendingfollowup,
      type          // 'dueToday' | 'overdue' | 'future' | 'converted' | 'lost'
    } = req.query

    const userObjectId = new mongoose.Types.ObjectId(loggeduserid)
    const branchObjectId = new mongoose.Types.ObjectId(branchSelected)

    // base query for leads (same as your old find query)
    let baseMatch
    if (pendingfollowup === "true") {
      if (role === "Admin") {
        baseMatch = {
          activityLog: {
            $elemMatch: {
              taskTo: "followup",
              allocationChanged: false,
              allocatedClosed: false,
              taskClosed: false,
              followupClosed: false
            }
          },
          leadBranch: branchObjectId,
          reallocatedTo: false,
          leadLost: false
        }
      } else {
        baseMatch = {
          activityLog: {
            $elemMatch: {
              taskTo: "followup",
              $or: [
                { submittedUser: userObjectId },
                { taskallocatedTo: userObjectId }
              ],
              allocationChanged: false,
              allocatedClosed: false,
              taskClosed: false,
              followupClosed: false
            }
          },
          leadBranch: branchObjectId,
          reallocatedTo: false,
          leadLost: false
        }
      }
    } else if (pendingfollowup === "false") {
      if (role === "Admin") {
        baseMatch = {
          activityLog: {
            $elemMatch: {
              taskTo: "followup",
              allocationChanged: false,
              allocatedClosed: false,
              taskClosed: true,
              followupClosed: true
            }
          },
          leadBranch: branchObjectId,
          leadLost: false
        }
      } else {
        baseMatch = {
          activityLog: {
            $elemMatch: {
              taskTo: "followup",
              $or: [
                { submittedUser: userObjectId },
                { taskallocatedTo: userObjectId }
              ],
              taskClosed: true
            }
          },
          leadBranch: branchObjectId,
          leadLost: false
        }
      }
    } else {
      // default: no pending filter
      baseMatch = {
        leadBranch: branchObjectId
      }
    }

    const start = new Date(req.query.startDate)
    start.setHours(0, 0, 0, 0)

    const end = new Date(req.query.endDate)
    end.setHours(23, 59, 59, 999)

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    // map query type -> flag field
    const flagFieldMap = {
      dueToday: "dueToday",
      overdue: "overdue",
      future: "future",
      converted: "isConverted",
      lost: "isLost"
    }
    const flagField = type ? flagFieldMap[type] : null

    // aggregation: compute flags at lead level and filter by flagField if given
    const leadsWithFlags = await LeadMaster.aggregate([
      { $match: baseMatch },

      // pick only followup logs
      {
        $addFields: {
          followupLogs: {
            $filter: {
              input: "$activityLog",
              as: "log",
              cond: { $eq: ["$$log.taskTo", "followup"] }
            }
          }
        }
      },

      // last followup log
      {
        $addFields: {
          lastActivity: { $arrayElemAt: ["$followupLogs", -1] }
        }
      },

      {
        $addFields: {
          nextFollowupDate: "$lastActivity.nextFollowUpDate"
        }
      },

      // compute flags (your requested block)
      {
        $addFields: {
          dueToday: {
            $cond: [
              {
                $and: [
                  { $gte: ["$nextFollowupDate", todayStart] },
                  { $lte: ["$nextFollowupDate", todayEnd] }
                ]
              },
              1,
              0
            ]
          },
          overdue: {
            $cond: [{ $lt: ["$nextFollowupDate", todayStart] }, 1, 0]
          },
          future: {
            $cond: [{ $gt: ["$nextFollowupDate", todayEnd] }, 1, 0]
          },
          isConverted: {
            $cond: [
              {
                $and: [
                  { $ne: ["$leadConvertedDate", null] },
                  { $gte: ["$leadConvertedDate", start] },
                  { $lte: ["$leadConvertedDate", end] }
                ]
              },
              1,
              0
            ]
          },
          isLost: {
            $cond: [
              {
                $and: [
                  { $ne: ["$leadLostDate", null] },
                  { $gte: ["$leadLostDate", start] },
                  { $lte: ["$leadLostDate", end] }
                ]
              },
              1,
              0
            ]
          }
        }
      },

      // filter by flag if type is given
      ...(flagField
        ? [
          {
            $match: {
              [flagField]: 1
            }
          }
        ]
        : []),

      // we still want full LeadMaster docs for populate & post-processing
      { $project: { /* keep everything */ } }
    ])

    // now reuse your old enrichment logic on leadsWithFlags instead of find(query)
    const followupLeads = []
    for (const lead of leadsWithFlags) {
      // === your existing code from selectedfollowup loop, unchanged ===
      const activity = Array.isArray(lead.activityLog) ? lead.activityLog : []
      const matchedAllocations = activity
        .map((item, index) => ({ ...item, index }))
        .filter((item) => item.taskTo === "followup")

      if (matchedAllocations.length === 0) continue

      const lastAlloc = matchedAllocations[matchedAllocations.length - 1]
      const lastIndex = lastAlloc.index

      if (
        !lead.leadByModel ||
        !mongoose.models[lead.leadByModel] ||
        !lastAlloc.taskallocatedToModel ||
        !mongoose.models[lastAlloc.taskallocatedToModel] ||
        !lastAlloc.taskallocatedByModel ||
        !mongoose.models[lastAlloc.taskallocatedByModel]
      ) {
        continue
      }

      const leadByModel = mongoose.model(lead.leadByModel)
      const allocatedToModel = mongoose.model(lastAlloc.taskallocatedToModel)
      const allocatedByModel = mongoose.model(lastAlloc.taskallocatedByModel)

      const [popLeadBy, popAllocatedTo, popAllocatedBy] = await Promise.all([
        leadByModel
          .findById(lead.leadBy)
          .select("name")
          .lean()
          .catch(() => null),
        allocatedToModel
          .findById(lastAlloc.taskallocatedTo)
          .select("name")
          .lean()
          .catch(() => null),
        allocatedByModel
          .findById(lastAlloc.taskallocatedBy)
          .select("name")
          .lean()
          .catch(() => null)
      ])

      const populatedActivityLog = await Promise.all(
        activity.map(async (log) => {
          let populatedSubmittedUser = null
          let populatedTaskAllocatedTo = null
          let populatedTaskAllocatedBy = null
          let populatedTask = null
          let populatedTaskBy = null

          if (
            log.submittedUser &&
            log.submissiondoneByModel &&
            mongoose.models[log.submissiondoneByModel]
          ) {
            const model = mongoose.model(log.submissiondoneByModel)
            populatedSubmittedUser = await model
              .findById(log.submittedUser)
              .select("name")
              .lean()
              .catch(() => null)
          }

          if (
            log.taskallocatedBy &&
            log.taskallocatedByModel &&
            mongoose.models[log.taskallocatedByModel]
          ) {
            const model = mongoose.model(log.taskallocatedByModel)
            populatedTaskAllocatedBy = await model
              .findById(log.taskallocatedBy)
              .select("name")
              .lean()
              .catch(() => null)
          }

          if (
            log.taskallocatedTo &&
            log.taskallocatedToModel &&
            mongoose.models[log.taskallocatedToModel]
          ) {
            const model = mongoose.model(log.taskallocatedToModel)
            populatedTaskAllocatedTo = await model
              .findById(log.taskallocatedTo)
              .select("name")
              .lean()
              .catch(() => null)
          }

          if (log?.taskId) {
            populatedTask = await Task.findById(log.taskId)
              .select("taskName")
              .lean()
              .catch(() => null)
          }

          if (log?.taskBy) {
            populatedTaskBy = await Task.findById(log.taskBy)
          }

          return {
            ...log,
            taskBy: populatedTaskBy,
            submittedUser: populatedSubmittedUser || log.submittedUser,
            taskallocatedBy: populatedTaskAllocatedBy || log.taskallocatedBy,
            taskallocatedTo:
              populatedTaskAllocatedTo || log.taskallocatedTo,
            taskId: populatedTask
          }
        })
      )

      const lastMatched = lastAlloc
      const lastMatchedClosed = !!lastMatched.followupClosed
      let neverfollowuped = false

      if (lastMatchedClosed) {
        neverfollowuped = true
      } else {
        const afterLogs = activity.slice(lastIndex + 1)
        const foundNextFollowUp = afterLogs.some(
          (log) => !!log.nextFollowUpDate
        )
        if (foundNextFollowUp) {
          neverfollowuped = false
        } else {
          if (lastMatched.nextFollowUpDate) neverfollowuped = false
          else neverfollowuped = true
        }
      }

      const lastActivity = activity[activity.length - 1] || {}
      const Nextfollowup = !!lastActivity.nextFollowUpDate
      const allocatedfollowup = !!lastActivity.taskfromFollowup
      const allocatedTaskClosed = !!lastActivity.allocatedClosed

      followupLeads.push({
        ...lead,
        leadBy: popLeadBy || lead.leadBy,
        allocatedTo: popAllocatedTo,
        allocatedBy: popAllocatedBy,
        activityLog: populatedActivityLog,
        nextFollowUpDate: lastActivity.nextFollowUpDate ?? null,
        neverfollowuped,
        Nextfollowup,
        allocatedfollowup,
        allocatedTaskClosed
      })
    }

    const ischekCollegueLeads = followupLeads.some((item) =>
      item.allocatedBy?._id?.equals(userObjectId)
    )

    if (followupLeads && followupLeads.length > 0) {
      return res.status(201).json({
        messge: "leadfollowup found",
        data: { followupLeads, ischekCollegueLeads }
      })
    } else {
      return res
        .status(404)
        .json({ message: "leadfollowp not found", data: {} })
    }
  } catch (error) {
    console.log("error:", error.message)
    return res.status(500).json({ message: "Internal server error" })
  }
}


export const GetfollowupsummaryReport = async (req, res) => {
  try {
    const { branchId, startDate, endDate } = req.query
    const REPORT_TIMEZONE = "Asia/Kolkata"
    const NIMMI_STAFF_ID = new mongoose.Types.ObjectId("692ecf498d8c2e6bf33636f3")

    const isValidValue = (v) =>
      v !== undefined &&
      v !== null &&
      v !== "null" &&
      v !== "undefined" &&
      String(v).trim() !== ""

    const hasBranch = isValidValue(branchId)
    const hasValidDateRange = isValidValue(startDate) && isValidValue(endDate)

    if (hasBranch && !mongoose.Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({ message: "Invalid branchId" })
    }

    let rangeStart = null
    let rangeEnd = null
    let reportDateKey = null

    if (hasValidDateRange) {
      rangeStart = new Date(`${startDate}T00:00:00.000+05:30`)
      rangeEnd = new Date(`${endDate}T23:59:59.999+05:30`)
      reportDateKey = endDate

      if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
        return res.status(400).json({ message: "Invalid startDate or endDate" })
      }

      if (rangeStart > rangeEnd) {
        return res.status(400).json({ message: "startDate cannot be greater than endDate" })
      }
    } else {

      console.log("mohanlalllllllllllllllllllllll")
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()

      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)

      const firstDayStr = `${year}-${String(month + 1).padStart(2, "0")}-01`
      const lastDayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        lastDay.getDate()
      ).padStart(2, "0")}`

      rangeStart = new Date(`${firstDayStr}T00:00:00.000+05:30`)
      rangeEnd = new Date(`${lastDayStr}T23:59:59.999+05:30`)
      reportDateKey = lastDayStr
    }

    const asOfDate = hasValidDateRange ? new Date(rangeEnd) : new Date()

    const matchStage = {}
    if (hasBranch) {
      matchStage.leadBranch = new mongoose.Types.ObjectId(branchId)
    }

    const pipeline = [
      ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),

      {
        $addFields: {
          leadAmount: {
            $sum: {
              $map: {
                input: { $ifNull: ["$leadFor", []] },
                as: "item",
                in: { $ifNull: ["$$item.netAmount", 0] }
              }
            }
          },
          safeConvertedDate: { $ifNull: ["$leadConvertedDate", null] },
          safeLostDate: { $ifNull: ["$leadLostDate", null] }
        }
      },

      {
        $addFields: {
          isEverConverted: { $ne: ["$safeConvertedDate", null] },
          isEverLost: { $ne: ["$safeLostDate", null] },
          convertedInRange: hasValidDateRange
            ? {
              $and: [
                { $ne: ["$safeConvertedDate", null] },
                { $gte: ["$safeConvertedDate", rangeStart] },
                { $lte: ["$safeConvertedDate", rangeEnd] }
              ]
            }
            : { $ne: ["$safeConvertedDate", null] },
          lostInRange: hasValidDateRange
            ? {
              $and: [
                { $ne: ["$safeLostDate", null] },
                { $gte: ["$safeLostDate", rangeStart] },
                { $lte: ["$safeLostDate", rangeEnd] }
              ]
            }
            : { $ne: ["$safeLostDate", null] }
        }
      },

      {
        $addFields: {
          activityLogIndexed: {
            $map: {
              input: { $range: [0, { $size: { $ifNull: ["$activityLog", []] } }] },
              as: "i",
              in: {
                idx: "$$i",
                log: { $arrayElemAt: ["$activityLog", "$$i"] }
              }
            }
          }
        }
      },

      {
        $addFields: {
          followupAssignEntries: {
            $filter: {
              input: "$activityLogIndexed",
              as: "item",
              cond: {
                $and: [
                  { $eq: ["$$item.log.taskTo", "followup"] },
                  { $ne: ["$$item.log.taskallocatedTo", null] },
                  { $ne: ["$$item.log.taskallocatedToModel", null] },
                  { $in: ["$$item.log.taskallocatedToModel", ["Staff", "Admin"]] },
                  { $eq: [{ $ifNull: ["$$item.log.allocationChanged", false] }, false] },
                  { $ne: ["$$item.log.submissionDate", null] },
                  { $lte: ["$$item.log.submissionDate", asOfDate] }
                ]
              }
            }
          }
        }
      },

      {
        $addFields: {
          assignEntry: { $arrayElemAt: ["$followupAssignEntries", -1] }
        }
      },

      {
        $addFields: {
          assignLog: "$assignEntry.log",
          assignIdx: "$assignEntry.idx",
          hasAssignLog: { $ne: ["$assignEntry", null] }
        }
      },

      {
        $addFields: {
          entriesAfterAssign: {
            $cond: [
              "$hasAssignLog",
              {
                $filter: {
                  input: "$activityLogIndexed",
                  as: "item",
                  cond: { $gt: ["$$item.idx", "$assignIdx"] }
                }
              },
              []
            ]
          }
        }
      },

      {
        $addFields: {
          nextFollowupEntries: {
            $filter: {
              input: "$entriesAfterAssign",
              as: "item",
              cond: {
                $and: [
                  { $ne: ["$$item.log.nextFollowUpDate", null] },
                  { $gt: ["$$item.log.nextFollowUpDate", new Date("2000-01-01T00:00:00.000Z")] },
                  { $ne: ["$$item.log.submissionDate", null] },
                  { $lte: ["$$item.log.submissionDate", asOfDate] }
                ]
              }
            }
          },
          closedEntriesAfterAssign: {
            $filter: {
              input: "$entriesAfterAssign",
              as: "item",
              cond: {
                $and: [
                  { $eq: [{ $ifNull: ["$$item.log.followupClosed", false] }, true] },
                  { $ne: ["$$item.log.submissionDate", null] },
                  { $lte: ["$$item.log.submissionDate", asOfDate] }
                ]
              }
            }
          }
        }
      },

      {
        $addFields: {
          lastNextFollowupEntry: { $arrayElemAt: ["$nextFollowupEntries", -1] },
          hasNextFollowup: { $gt: [{ $size: "$nextFollowupEntries" }, 0] },
          hasClosedEntryAfterAssign: { $gt: [{ $size: "$closedEntriesAfterAssign" }, 0] }
        }
      },

      {
        $addFields: {
          nextFollowupDate: { $ifNull: ["$lastNextFollowupEntry.log.nextFollowUpDate", null] },
          finalStaffId: "$assignLog.taskallocatedTo",
          finalStaffModel: "$assignLog.taskallocatedToModel",
          isLeadClosed: { $eq: ["$leadClosed", true] },
          isLeadLost: { $eq: ["$leadLost", true] },
          isAssignFollowupClosed: {
            $eq: [{ $ifNull: ["$assignLog.followupClosed", false] }, true]
          },
          isClosedLeadOutsideWindow: {
            $and: [
              {
                $or: [
                  { $ne: ["$safeConvertedDate", null] },
                  { $ne: ["$safeLostDate", null] }
                ]
              },
              { $not: ["$convertedInRange"] },
              { $not: ["$lostInRange"] }
            ]
          }
        }
      },

      {
        $match: {
          hasAssignLog: true,
          finalStaffId: { $ne: null },
          finalStaffModel: { $in: ["Staff", "Admin"] }
        }
      },

      {
        $addFields: {
          nextFollowupDateOnly: {
            $cond: [
              { $ne: ["$nextFollowupDate", null] },
              {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$nextFollowupDate",
                  timezone: REPORT_TIMEZONE
                }
              },
              null
            ]
          },
          asOfDateOnly: reportDateKey
        }
      },

      {
        $addFields: {
          isOverdueDate: {
            $and: [
              { $ne: ["$nextFollowupDateOnly", null] },
              { $lt: ["$nextFollowupDateOnly", "$asOfDateOnly"] }
            ]
          },
          isDueTodayDate: {
            $and: [
              { $ne: ["$nextFollowupDateOnly", null] },
              { $eq: ["$nextFollowupDateOnly", "$asOfDateOnly"] }
            ]
          },
          isFutureDate: {
            $and: [
              { $ne: ["$nextFollowupDateOnly", null] },
              { $gt: ["$nextFollowupDateOnly", "$asOfDateOnly"] }
            ]
          }
        }
      },

      {
        $addFields: {
          statusBucket: {
            $switch: {
              branches: [
                { case: "$convertedInRange", then: "converted" },
                { case: "$lostInRange", then: "lost" },
                { case: "$isLeadClosed", then: "excluded" },
                { case: "$isLeadLost", then: "excluded" },
                { case: "$isAssignFollowupClosed", then: "excluded" },
                { case: "$hasClosedEntryAfterAssign", then: "excluded" },
                { case: "$isClosedLeadOutsideWindow", then: "excluded" },
                {
                  case: {
                    $or: [
                      { $eq: ["$hasAssignLog", false] },
                      { $eq: ["$finalStaffId", null] },
                      { $eq: ["$finalStaffModel", null] }
                    ]
                  },
                  then: "excluded"
                },
                { case: { $eq: ["$hasNextFollowup", false] }, then: "neverFollowup" },
                { case: "$isOverdueDate", then: "overdue" },
                { case: "$isDueTodayDate", then: "dueToday" },
                { case: "$isFutureDate", then: "future" }
              ],
              default: "excluded"
            }
          }
        }
      },

      {
        $match: {
          statusBucket: { $in: ["converted", "lost", "neverFollowup", "overdue", "dueToday", "future"] }
        }
      },

      {
        $addFields: {
          isConverted: { $cond: [{ $eq: ["$statusBucket", "converted"] }, 1, 0] },
          isLost: { $cond: [{ $eq: ["$statusBucket", "lost"] }, 1, 0] },
          isNeverFollowup: { $cond: [{ $eq: ["$statusBucket", "neverFollowup"] }, 1, 0] },
          isOverdue: { $cond: [{ $eq: ["$statusBucket", "overdue"] }, 1, 0] },
          isDueToday: { $cond: [{ $eq: ["$statusBucket", "dueToday"] }, 1, 0] },
          isFuture: { $cond: [{ $eq: ["$statusBucket", "future"] }, 1, 0] },

          convertedAmount: { $cond: [{ $eq: ["$statusBucket", "converted"] }, "$leadAmount", 0] },
          lostAmount: { $cond: [{ $eq: ["$statusBucket", "lost"] }, "$leadAmount", 0] },
          neverFollowupAmount: { $cond: [{ $eq: ["$statusBucket", "neverFollowup"] }, "$leadAmount", 0] },
          overdueAmount: { $cond: [{ $eq: ["$statusBucket", "overdue"] }, "$leadAmount", 0] },
          dueTodayAmount: { $cond: [{ $eq: ["$statusBucket", "dueToday"] }, "$leadAmount", 0] },
          futureAmount: { $cond: [{ $eq: ["$statusBucket", "future"] }, "$leadAmount", 0] },

          nimmiOverdueLeadId: {
            $cond: [
              {
                $and: [
                  { $eq: ["$finalStaffId", NIMMI_STAFF_ID] },
                  { $eq: ["$statusBucket", "overdue"] }
                ]
              },
              "$leadId",
              null
            ]
          }
        }
      },

      {
        $group: {
          _id: { staffId: "$finalStaffId", staffModel: "$finalStaffModel" },
          leadIds: { $addToSet: "$leadId" },
          branchIds: { $addToSet: "$leadBranch" },

          totalConverted: { $sum: "$isConverted" },
          totalLost: { $sum: "$isLost" },
          totalNeverFollowup: { $sum: "$isNeverFollowup" },
          totalOverdue: { $sum: "$isOverdue" },
          totalDueToday: { $sum: "$isDueToday" },
          totalFuture: { $sum: "$isFuture" },

          totalLeadAmount: { $sum: "$leadAmount" },
          convertedAmount: { $sum: "$convertedAmount" },
          lostAmount: { $sum: "$lostAmount" },
          neverFollowupAmount: { $sum: "$neverFollowupAmount" },
          overdueAmount: { $sum: "$overdueAmount" },
          dueTodayAmount: { $sum: "$dueTodayAmount" },
          futureAmount: { $sum: "$futureAmount" },

          overdueLeadIdsForNimmiRaw: { $addToSet: "$nimmiOverdueLeadId" }
        }
      },

      { $lookup: { from: "staffs", localField: "_id.staffId", foreignField: "_id", as: "staff" } },
      { $lookup: { from: "admins", localField: "_id.staffId", foreignField: "_id", as: "admin" } },

      {
        $addFields: {
          user: {
            $cond: [
              { $eq: ["$_id.staffModel", "Admin"] },
              { $arrayElemAt: ["$admin", 0] },
              { $arrayElemAt: ["$staff", 0] }
            ]
          }
        }
      },

      {
        $project: {
          _id: 0,
          staffId: "$_id.staffId",
          staffModel: "$_id.staffModel",
          staffName: { $ifNull: ["$user.name", "Unknown"] },
          staffRole: "$user.role",
          branchIds: 1,
          leadIds: 1,
          totalConverted: 1,
          totalLost: 1,
          totalNeverFollowup: 1,
          totalOverdue: 1,
          totalDueToday: 1,
          totalFuture: 1,
          totalLeadAmount: 1,
          convertedAmount: 1,
          lostAmount: 1,
          neverFollowupAmount: 1,
          overdueAmount: 1,
          dueTodayAmount: 1,
          futureAmount: 1,
          overdueLeadIdsForNimmi: {
            $cond: [
              { $eq: ["$_id.staffId", NIMMI_STAFF_ID] },
              {
                $filter: {
                  input: "$overdueLeadIdsForNimmiRaw",
                  as: "leadId",
                  cond: { $ne: ["$$leadId", null] }
                }
              },
              []
            ]
          }
        }
      },

      { $sort: { staffName: 1 } }
    ]

    const result = await LeadMaster.aggregate(pipeline).allowDiskUse(true)

    const structuredData = result.map((item) => {
      const converted = item.totalConverted || 0
      const lost = item.totalLost || 0
      const neverFollowup = item.totalNeverFollowup || 0
      const overDue = item.totalOverdue || 0
      const dueToday = item.totalDueToday || 0
      const future = item.totalFuture || 0
      const leadCount = converted + lost + neverFollowup + overDue + dueToday + future

      return {
        staffId: item.staffId,
        staffRole: item.staffRole,
        branchIds: item.branchIds || [],
        leadIds: item.leadIds || [],
        Staff: item.staffName,
        leadCount,
        converted,
        lost,
        neverFollowup,
        overDue,
        dueToday,
        future,
        leadAmount: item.totalLeadAmount || 0,
        convertedAmount: item.convertedAmount || 0,
        lostAmount: item.lostAmount || 0,
        neverFollowupAmount: item.neverFollowupAmount || 0,
        overDueAmount: item.overdueAmount || 0,
        dueTodayAmount: item.dueTodayAmount || 0,
        futureAmount: item.futureAmount || 0,
        convertedPercentage:
          leadCount > 0 ? Number(((converted / leadCount) * 100).toFixed(2)) : 0,
        overdueLeadIdsForNimmi: item.overdueLeadIdsForNimmi || []
      }
    })

    if (structuredData.length > 0) {
      return res.status(200).json({
        message: "summary found",
        data: structuredData,
        meta: {
          branchId: hasBranch ? branchId : null,
          startDate: hasValidDateRange ? rangeStart : null,
          endDate: hasValidDateRange ? rangeEnd : null,
          asOfDate,
          timezone: REPORT_TIMEZONE,
          reportDateKey,
          nimmiStaffId: NIMMI_STAFF_ID
        }
      })
    }

    return res.status(404).json({ message: "No data found" })
  } catch (error) {
    console.log("error:", error.message)
    return res.status(500).json({
      message: "Internal server error",
      error: error.message
    })
  }
}
export const Getalltasktoreport = async (req, res) => {
  try {
    const result = await Task.find({ listed: true })
    return res.status(200).json({ message: "result found", data: result })
  } catch (error) {
    console.log("error:", error.message)
    res.status(500).json({ message: "Internal server error" })
  }
}
export const Getdailystaffreport = async (req, res) => {
  try {
    const { startDate, endDate, selectedBranch } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate required" });
    }
    const allTasks = await Task.find({ listed: true }, { taskName: 1, _id: 0 }).lean();
    const taskNames = allTasks.map(t => t.taskName);

    // Use FULL date range from req.query
    const reportStart = new Date(startDate);
    const reportEnd = new Date(endDate);
    reportEnd.setHours(23, 59, 59, 999);


    // **DAILY LOOP** - Process each day between startDate & endDate
    const dailyReports = [];
    let currentDate = new Date(reportStart);


    const dateStr = currentDate.toLocaleDateString('en-IN'); // "25-1-2026"

    // Pass ONLY the day's date to helper - it handles start/end of day
    const leadMetrics = await getLeadMetricsForSingleDay(currentDate, reportEnd, selectedBranch);
    const callMetrics = await getCallMetricsForSingleDay(currentDate, reportEnd)

    const dayReport = leadMetrics.map(lead => {
      const callsData = callMetrics.find(
        call => String(call.staffId) === String(lead.staffId)
      );


      // 🔹 Base object
      const row = {
        Date: dateStr,
        staffName: lead.staffName,
        Calls: callsData ? callsData.Calls : 0,
        newlead: lead.newlead || 0
      };

      // 🔹 Add ALL tasks dynamically
      taskNames.forEach(taskName => {
        row[taskName] = lead.tasks?.[taskName] || 0;
      });

      return row;
    });

    dailyReports.push(...dayReport);
    currentDate.setDate(currentDate.getDate() + 1);
    return res.status(200).json({ messaage: "daily report found", data: dailyReports })

  } catch (error) {
    console.log("error:", error.message)
    return res.status(500).json({ message: "Internal server error" })
  }
}

export const getverifiedCollectionLeads = async (req, res) => {
  try {
    const { selectedBranch, isAccountant, loggeduserby, verified, startDate, endDate } = req.query;
    const verifiedBool = verified === "true";
    const accountantMode = isAccountant === "true";
    // const fromDate = startDate ? new Date(startDate) : null;
    // const toDate = endDate ? new Date(endDate) : null;

    // if (toDate) {
    //   toDate.setHours(23, 59, 59, 999);
    // }
    const fromDate = new Date(startDate);
    fromDate.setHours(0, 0, 0, 0);

    const toDate = new Date(endDate);
    toDate.setHours(23, 59, 59, 999);
    const matchedCollectionlead = await LeadMaster.aggregate([
      {
        $match: {
          leadBranch: new mongoose.Types.ObjectId(selectedBranch),
        },
      },
      {
        $addFields: {
          followupActivities: {
            $filter: {
              input: "$activityLog",
              as: "activity",
              cond: { $eq: ["$$activity.taskTo", "followup"] },
            },
          },
        },
      },
      {
        $addFields: {
          latestFollowupActivity: {
            $arrayElemAt: ["$followupActivities", -1],
          },
        },
      },
      {
        $match: {
          "latestFollowupActivity.followupClosed": true,
        },
      },
    ]);

    const populatedLeads = await LeadMaster.populate(matchedCollectionlead, [
      { path: "customerName" },
      { path: "partner" },
    ]);

    const populatedcollectionLeads = await Promise.all(
      populatedLeads.map(async (lead) => {
        if (!lead.leadByModel || !mongoose.models[lead.leadByModel]) {
          console.error(`Model ${lead.leadByModel} is not registered`);
          return null;
        }

        const assignedModel = mongoose.model(lead.leadByModel);
        const populatedLeadBy = await assignedModel
          .findById(lead.leadBy)
          .select("name")
          .lean();

        let lasttaskallocatedto = null;
        let lasttaskallocatedBy = null;

        const populatedActivityLog = await Promise.all(
          (lead.activityLog || []).map(async (activity) => {
            const populatedActivity = { ...activity };

            if (activity.submissiondoneByModel && activity.submittedUser) {
              const model = mongoose.model(activity.submissiondoneByModel);
              populatedActivity.submittedUser = await model
                .findById(activity.submittedUser)
                .select("name")
                .lean();
            }
            // console.log("taskbjyuyyyyyyyyyyyyy",activity?.taskBy)
            if (activity?.taskBy) {
              populatedActivity.taskBy = await Task.findById(activity?.taskBy).select("taskName").lean()
            }
            if (activity?.taskTo) {
              populatedActivity.taskId = await Task.findById(activity?.taskId).select("taskName").lean()
            }

            if (activity.taskallocatedByModel && activity.taskallocatedBy) {
              const model = mongoose.model(activity.taskallocatedByModel);
              lasttaskallocatedBy = populatedActivity.taskallocatedBy =
                await model.findById(activity.taskallocatedBy).select("name").lean();
            }

            if (activity.taskallocatedToModel && activity.taskallocatedTo) {
              const model = mongoose.model(activity.taskallocatedToModel);
              lasttaskallocatedto = populatedActivity.taskallocatedTo =
                await model.findById(activity.taskallocatedTo).select("name").lean();
            }

            return populatedActivity;
          })
        );


        const latestFollowupActivity = [...(lead.activityLog || [])]
          .filter((activity) => activity?.taskTo === "followup")
          .at(-1);

        const isFollowupClosed = latestFollowupActivity?.followupClosed === true;

        if (!isFollowupClosed) {
          return null;
        }

        const populatedLeadFor = await Promise.all(
          (lead.leadFor || []).map(async (item) => {
            const populatedItem = { ...item };

            if (item.productorServicemodel && item.productorServiceId) {
              try {
                const model = mongoose.model(item.productorServicemodel);
                const productDoc = await model
                  .findById(item.productorServiceId)
                  .select("productName name title")
                  .lean();

                populatedItem.productorServiceId = productDoc;
              } catch (err) {
                populatedItem.productorServiceId = null;
              }
            }

            return populatedItem;
          })
        );

        const paymentHistoryWithIndex = (lead?.paymentHistory || []).map(
          (history, index) => ({
            ...history,
            originalIndex: index,
          })
        );

        // let filteredPaymentHistory = paymentHistoryWithIndex;

        // if (accountantMode) {
        //   filteredPaymentHistory = filteredPaymentHistory.filter(
        //     (history) => history?.paymentVerified === verifiedBool
        //   );
        // } else {
        //   filteredPaymentHistory = filteredPaymentHistory.filter((history) => {
        //     const receivedByMatch = loggeduserby
        //       ? String(history?.receivedBy) === String(loggeduserby)
        //       : true;

        //     return receivedByMatch;
        //   });
        // }
        let filteredPaymentHistory = paymentHistoryWithIndex;
        if (verifiedBool) {
          filteredPaymentHistory = filteredPaymentHistory.filter((history) => {
            if (!history.paymentVerified) return false;

            if (!history.verifiedAt) return false;

            const verifiedAt = new Date(history.verifiedAt);


            return (
              verifiedAt >= fromDate &&
              verifiedAt <= toDate
            );


          });
        } else {
          filteredPaymentHistory = filteredPaymentHistory.filter((history) => {
            const receivedByMatch = loggeduserby
              ? String(history.receivedBy) === String(loggeduserby)
              : true;

            return receivedByMatch;
          });
        }

        if (filteredPaymentHistory.length === 0) {
          return null;
        }

        const populatedpaymentHistory = filteredPaymentHistory.length
          ? await Promise.all(
            filteredPaymentHistory.map(async (history) => {
              const populatedhistory = { ...history };

              if (history.receivedModel && history.receivedBy) {
                const recvModel = mongoose.model(history.receivedModel);
                populatedhistory.receivedBy = await recvModel
                  .findById(history.receivedBy)
                  .select("name")
                  .lean();
              }

              if (history.paymentverifiedModel && history.paymentVerifiedBy) {
                const verifiedModel = mongoose.model(
                  history.paymentverifiedModel
                );
                populatedhistory.paymentVerifiedBy = await verifiedModel
                  .findById(history.paymentVerifiedBy)
                  .select("name")
                  .lean();
              }

              if (Array.isArray(history.paymentEntries)) {
                populatedhistory.paymentEntries = await Promise.all(
                  history.paymentEntries.map(async (entry) => {
                    const populatedEntry = { ...entry };

                    if (
                      entry.productorServicemodel &&
                      entry.productorServiceId
                    ) {
                      try {
                        const ProdModel = mongoose.model(
                          entry.productorServicemodel
                        );
                        const doc = await ProdModel.findById(
                          entry.productorServiceId
                        )
                          .select("productName name title")
                          .lean();

                        populatedEntry.productorServiceId = doc;
                      } catch (err) {
                        populatedEntry.productorServiceId = null;
                      }
                    }

                    return populatedEntry;
                  })
                );
              }

              return populatedhistory;
            })
          )
          : [];


        const lastActivity =
          populatedActivityLog[populatedActivityLog.length - 1];

        return {
          ...lead,
          leadBy: populatedLeadBy,
          paymentHistory: populatedpaymentHistory,
          leadFor: populatedLeadFor,
          activityLog: populatedActivityLog,
          taskallocatedTo: lasttaskallocatedto || null,
          taskallocatedBy: lasttaskallocatedBy || null,
          leadclosedBy: lastActivity?.submittedUser || null,
          followupClosed: isFollowupClosed,
        };
      })
    );

    const finalLeads = populatedcollectionLeads.filter(Boolean);

    if (finalLeads.length > 0) {
      return res.status(201).json({
        message: "lead found",
        data: finalLeads,
      });
    } else {
      return res.status(200).json({
        message: "lead not found",
        data: [],
      });
    }
  } catch (error) {
    console.log("error", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export const GetcollectionLeads = async (req, res) => {
  try {
    const { selectedBranch, isAccountant, loggeduserby, verified } = req.query;


    if (!mongoose.Types.ObjectId.isValid(selectedBranch)) {
      return res.status(400).json({
        message: "Invalid branch id"
      });
    }

    const branchId = new mongoose.Types.ObjectId(selectedBranch);
    const accountantMode = isAccountant === "true";
    const verifiedBool = verified === "true";

    // Removes null, undefined, strings, numbers, etc. from arrays.
    const validObjects = (value) => {
      if (!Array.isArray(value)) return [];

      return value.filter(
        (item) =>
          item !== null &&
          item !== undefined &&
          typeof item === "object" &&
          !Array.isArray(item)
      );
    };

    const leads = await LeadMaster.find({
      leadBranch: branchId,
      activityLog: {
        $elemMatch: {
          taskTo: "followup",
          followupClosed: true
        }
      }
    })
      .select({
        leadId: 1,
        leadDate: 1,
        customerName: 1,
        partner: 1,
        balanceAmount: 1,
        leadBy: 1,
        leadByModel: 1,
        leadFor: 1,
        paymentHistory: 1,
        activityLog: 1,
        leadBranch: 1,
        mobile: 1,
        email: 1,
        location: 1,
        remark: 1,
        createdAt: 1
      })
      .lean();

    if (!leads.length) {
      return res.status(200).json({
        message: "lead not found",
        data: []
      });
    }

    const ids = {
      customers: new Set(),
      partners: new Set(),
      tasks: new Set(),
      staff: new Set(),
      admin: new Set(),
      products: new Set(),
      services: new Set()
    };

    for (const lead of leads) {
      if (!lead) continue;

      if (lead.customerName) ids.customers.add(String(lead.customerName));
      if (lead.partner) ids.partners.add(String(lead.partner));

      if (lead.leadBy && lead.leadByModel === "Staff") {
        ids.staff.add(String(lead.leadBy));
      }

      if (lead.leadBy && lead.leadByModel === "Admin") {
        ids.admin.add(String(lead.leadBy));
      }

      const leadFor = validObjects(lead.leadFor);

      for (const item of leadFor) {
        if (
          item.productorServiceId &&
          item.productorServicemodel === "Product"
        ) {
          ids.products.add(String(item.productorServiceId));
        }

        if (
          item.productorServiceId &&
          item.productorServicemodel === "Service"
        ) {
          ids.services.add(String(item.productorServiceId));
        }
      }

      // Null activityLog entries are ignored safely here.
      const activityLogs = validObjects(lead.activityLog);

      for (const act of activityLogs) {
        if (act.taskBy) ids.tasks.add(String(act.taskBy));
        if (act.taskId) ids.tasks.add(String(act.taskId));

        if (
          act.submittedUser &&
          act.submissiondoneByModel === "Staff"
        ) {
          ids.staff.add(String(act.submittedUser));
        }

        if (
          act.submittedUser &&
          act.submissiondoneByModel === "Admin"
        ) {
          ids.admin.add(String(act.submittedUser));
        }

        if (
          act.taskallocatedBy &&
          act.taskallocatedByModel === "Staff"
        ) {
          ids.staff.add(String(act.taskallocatedBy));
        }

        if (
          act.taskallocatedBy &&
          act.taskallocatedByModel === "Admin"
        ) {
          ids.admin.add(String(act.taskallocatedBy));
        }

        if (
          act.taskallocatedTo &&
          act.taskallocatedToModel === "Staff"
        ) {
          ids.staff.add(String(act.taskallocatedTo));
        }

        if (
          act.taskallocatedTo &&
          act.taskallocatedToModel === "Admin"
        ) {
          ids.admin.add(String(act.taskallocatedTo));
        }
      }

      const paymentHistory = validObjects(lead.paymentHistory);

      for (const pay of paymentHistory) {
        if (pay.receivedBy && pay.receivedModel === "Staff") {
          ids.staff.add(String(pay.receivedBy));
        }

        if (pay.receivedBy && pay.receivedModel === "Admin") {
          ids.admin.add(String(pay.receivedBy));
        }

        if (
          pay.paymentVerifiedBy &&
          pay.paymentverifiedModel === "Staff"
        ) {
          ids.staff.add(String(pay.paymentVerifiedBy));
        }

        if (
          pay.paymentVerifiedBy &&
          pay.paymentverifiedModel === "Admin"
        ) {
          ids.admin.add(String(pay.paymentVerifiedBy));
        }

        for (const entry of validObjects(pay.paymentEntries)) {
          if (
            entry.productorServiceId &&
            entry.productorServicemodel === "Product"
          ) {
            ids.products.add(String(entry.productorServiceId));
          }

          if (
            entry.productorServiceId &&
            entry.productorServicemodel === "Service"
          ) {
            ids.services.add(String(entry.productorServiceId));
          }
        }
      }
    }

    const [
      customers,
      partners,
      tasks,
      staffs,
      admins,
      products,
      services
    ] = await Promise.all([
      Customer.find({ _id: { $in: [...ids.customers] } })
        .select("customerName")
        .lean(),

      Partner.find({ _id: { $in: [...ids.partners] } })
        .select("name")
        .lean(),

      Task.find({ _id: { $in: [...ids.tasks] } })
        .select("taskName")
        .lean(),

      Staff.find({ _id: { $in: [...ids.staff] } })
        .select("name")
        .lean(),

      Admin.find({ _id: { $in: [...ids.admin] } })
        .select("name")
        .lean(),

      Product.find({ _id: { $in: [...ids.products] } })
        .select("productName name title")
        .lean(),

      Service.find({ _id: { $in: [...ids.services] } })
        .select("productName name title")
        .lean()
    ]);

    const toMap = (items) =>
      new Map(items.map((item) => [String(item._id), item]));

    const customerMap = toMap(customers);
    const partnerMap = toMap(partners);
    const taskMap = toMap(tasks);
    const staffMap = toMap(staffs);
    const adminMap = toMap(admins);
    const productMap = toMap(products);
    const serviceMap = toMap(services);

    const getUser = (id, model) => {
      if (!id) return null;

      const key = String(id);

      if (model === "Staff") return staffMap.get(key) || null;
      if (model === "Admin") return adminMap.get(key) || null;

      return null;
    };

    const getServiceProduct = (id, model) => {
      if (!id) return null;

      const key = String(id);

      if (model === "Product") return productMap.get(key) || null;
      if (model === "Service") return serviceMap.get(key) || null;

      return null;
    };

    const finalLeads = leads
      .map((lead) => {
        const activityLogs = validObjects(lead.activityLog);
        const paymentHistory = validObjects(lead.paymentHistory);
        const leadFor = validObjects(lead.leadFor);

        const latestFollowup = activityLogs
          .filter((activity) => activity.taskTo === "followup")
          .at(-1);

        if (!latestFollowup?.followupClosed) return null;

        const filteredPaymentHistory = paymentHistory
          .map((history, originalIndex) => ({
            ...history,
            originalIndex
          }))
          .filter((history) => {
            if (accountantMode) {
              return history.paymentVerified === verifiedBool;
            }
            // return history.paymentVerified === verifiedBool;
            return history
            // return loggeduserby
            //   ? String(history.receivedBy) === String(loggeduserby)
            //   : true;
          });

        const hydratedActivityLog = activityLogs.map((activity) => ({
          ...activity,
          submittedUser: getUser(
            activity.submittedUser,
            activity.submissiondoneByModel
          ),
          taskallocatedBy: getUser(
            activity.taskallocatedBy,
            activity.taskallocatedByModel
          ),
          taskallocatedTo: getUser(
            activity.taskallocatedTo,
            activity.taskallocatedToModel
          ),
          taskBy: activity.taskBy
            ? taskMap.get(String(activity.taskBy)) || null
            : null,
          taskId: activity.taskId
            ? taskMap.get(String(activity.taskId)) || null
            : null
        }));

        const hydratedLeadFor = leadFor.map((item) => ({
          ...item,
          productorServiceId: getServiceProduct(
            item.productorServiceId,
            item.productorServicemodel
          )
        }));

        const hydratedPayments = filteredPaymentHistory.map((history) => ({
          ...history,
          receivedBy: getUser(history.receivedBy, history.receivedModel),
          paymentVerifiedBy: getUser(
            history.paymentVerifiedBy,
            history.paymentverifiedModel
          ),
          paymentEntries: validObjects(history.paymentEntries).map((entry) => ({
            ...entry,
            productorServiceId: getServiceProduct(
              entry.productorServiceId,
              entry.productorServicemodel
            )
          }))
        }));

        const lastActivity = hydratedActivityLog.at(-1);

        const lastAllocatedActivity = [...hydratedActivityLog]
          .reverse()
          .find(
            (activity) =>
              activity.taskallocatedTo || activity.taskallocatedBy
          );

        return {
          ...lead,
          customerName: customerMap.get(String(lead.customerName)) || null,
          partner: partnerMap.get(String(lead.partner)) || null,
          leadBy: getUser(lead.leadBy, lead.leadByModel),
          leadFor: hydratedLeadFor,
          paymentHistory: hydratedPayments,
          originalpaymentHistory: lead?.paymentHistory,
          activityLog: hydratedActivityLog,
          taskallocatedTo: lastAllocatedActivity?.taskallocatedTo || null,
          taskallocatedBy: lastAllocatedActivity?.taskallocatedBy || null,
          leadclosedBy: lastActivity?.submittedUser || null,
          followupClosed: true
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      message: finalLeads.length ? "lead found" : "lead not found",
      data: finalLeads
    });
  } catch (error) {
    console.error("GetcollectionLeads error:", error);
    return res.status(500).json({
      message: "Internal server error"
    });
  }
};//safer version ,even any index of the activitylog have null values ,its wont care to discontinue the code

// export const GetcollectionLeads = async (req, res) => {
//   try {
//     const { selectedBranch, isAccountant, loggeduserby, verified } = req.query;

//     const branchId = new mongoose.Types.ObjectId(selectedBranch);
//     const accountantMode = isAccountant === "true";
//     const verifiedBool = verified === "true";

//     const leads = await LeadMaster.find({
//       leadBranch: branchId,
//       activityLog: {
//         $elemMatch: {
//           taskTo: "followup",
//           followupClosed: true
//         }
//       }
//     })

//       .select({
//         leadId: 1,
//         leadDate: 1,
//         customerName: 1,
//         partner: 1,
//         balanceAmount: 1,
//         leadBy: 1,
//         leadByModel: 1,
//         leadFor: 1,
//         paymentHistory: 1,
//         activityLog: 1,
//         leadBranch: 1,
//         mobile: 1,
//         email: 1,
//         location: 1,
//         remark: 1,
//         createdAt: 1
//       })
//       .lean();

//     if (!leads.length) {
//       return res.status(200).json({ message: "lead not found", data: [] });
//     }

//     const ids = {
//       customers: new Set(),
//       partners: new Set(),
//       tasks: new Set(),
//       staff: new Set(),
//       admin: new Set(),
//       products: new Set(),
//       services: new Set()
//     };

//     for (const lead of leads) {
//       if (lead.customerName) ids.customers.add(String(lead.customerName));
//       if (lead.partner) ids.partners.add(String(lead.partner));
//       if (lead.leadBy && lead.leadByModel === "Staff") ids.staff.add(String(lead.leadBy));
//       if (lead.leadBy && lead.leadByModel === "Admin") ids.admin.add(String(lead.leadBy));

//       for (const item of lead.leadFor || []) {
//         if (item.productorServiceId && item.productorServicemodel === "Product") {
//           ids.products.add(String(item.productorServiceId));
//         }
//         if (item.productorServiceId && item.productorServicemodel === "Service") {
//           ids.services.add(String(item.productorServiceId));
//         }
//       }

//       for (const act of lead.activityLog || []) {
//         if (act.taskBy) ids.tasks.add(String(act.taskBy));
//         if (act.taskId) ids.tasks.add(String(act.taskId));

//         if (act.submittedUser && act.submissiondoneByModel === "Staff") ids.staff.add(String(act.submittedUser));
//         if (act.submittedUser && act.submissiondoneByModel === "Admin") ids.admin.add(String(act.submittedUser));

//         if (act.taskallocatedBy && act.taskallocatedByModel === "Staff") ids.staff.add(String(act.taskallocatedBy));
//         if (act.taskallocatedBy && act.taskallocatedByModel === "Admin") ids.admin.add(String(act.taskallocatedBy));

//         if (act.taskallocatedTo && act.taskallocatedToModel === "Staff") ids.staff.add(String(act.taskallocatedTo));
//         if (act.taskallocatedTo && act.taskallocatedToModel === "Admin") ids.admin.add(String(act.taskallocatedTo));
//       } for (const act of lead.activityLog || []) {
//         if (act.taskBy) ids.tasks.add(String(act.taskBy));
//         if (act.taskId) ids.tasks.add(String(act.taskId));

//         if (act.submittedUser && act.submissiondoneByModel === "Staff") ids.staff.add(String(act.submittedUser));
//         if (act.submittedUser && act.submissiondoneByModel === "Admin") ids.admin.add(String(act.submittedUser));

//         if (act.taskallocatedBy && act.taskallocatedByModel === "Staff") ids.staff.add(String(act.taskallocatedBy));
//         if (act.taskallocatedBy && act.taskallocatedByModel === "Admin") ids.admin.add(String(act.taskallocatedBy));

//         if (act.taskallocatedTo && act.taskallocatedToModel === "Staff") ids.staff.add(String(act.taskallocatedTo));
//         if (act.taskallocatedTo && act.taskallocatedToModel === "Admin") ids.admin.add(String(act.taskallocatedTo));
//       }

//       for (const pay of lead.paymentHistory || []) {
//         if (pay.receivedBy && pay.receivedModel === "Staff") ids.staff.add(String(pay.receivedBy));
//         if (pay.receivedBy && pay.receivedModel === "Admin") ids.admin.add(String(pay.receivedBy));
//         if (pay.paymentVerifiedBy && pay.paymentverifiedModel === "Staff") ids.staff.add(String(pay.paymentVerifiedBy));
//         if (pay.paymentVerifiedBy && pay.paymentverifiedModel === "Admin") ids.admin.add(String(pay.paymentVerifiedBy));

//         for (const entry of pay.paymentEntries || []) {
//           if (entry.productorServiceId && entry.productorServicemodel === "Product") {
//             ids.products.add(String(entry.productorServiceId));
//           }
//           if (entry.productorServiceId && entry.productorServicemodel === "Service") {
//             ids.services.add(String(entry.productorServiceId));
//           }
//         }
//       }
//     }

//     const [
//       customers,
//       partners,
//       tasks,
//       staffs,
//       admins,
//       products,
//       services
//     ] = await Promise.all([
//       Customer.find({ _id: { $in: [...ids.customers] } }).select("customerName").lean(),
//       Partner.find({ _id: { $in: [...ids.partners] } }).select("name").lean(),
//       Task.find({ _id: { $in: [...ids.tasks] } }).select("taskName").lean(),
//       Staff.find({ _id: { $in: [...ids.staff] } }).select("name").lean(),
//       Admin.find({ _id: { $in: [...ids.admin] } }).select("name").lean(),
//       Product.find({ _id: { $in: [...ids.products] } }).select("productName name title").lean(),
//       Service.find({ _id: { $in: [...ids.services] } }).select("productName name title").lean()
//     ]);

//     const toMap = (arr) => new Map(arr.map((x) => [String(x._id), x]));
//     const customerMap = toMap(customers);
//     const partnerMap = toMap(partners);
//     const taskMap = toMap(tasks);
//     const staffMap = toMap(staffs);
//     const adminMap = toMap(admins);
//     const productMap = toMap(products);
//     const serviceMap = toMap(services);

//     const getUser = (id, model) => {
//       if (!id || !model) return null;
//       const key = String(id);
//       return model === "Staff" ? staffMap.get(key) || null : adminMap.get(key) || null;
//     };

//     const getServiceProduct = (id, model) => {
//       if (!id || !model) return null;
//       const key = String(id);
//       return model === "Product"
//         ? productMap.get(key) || null
//         : serviceMap.get(key) || null;
//     };

//     const finalLeads = leads.map((lead) => {
//       const latestFollowup = [...(lead.activityLog || [])]
//         .filter((a) => a?.taskTo === "followup")
//         .at(-1);

//       if (!latestFollowup || latestFollowup.followupClosed !== true) return null;


//       const filteredPaymentHistory = (lead.paymentHistory || [])
//         .map((history, originalIndex) => ({
//           ...history,
//           originalIndex
//         }))
//         .filter((history) => {
//           if (accountantMode) return history?.paymentVerified === verifiedBool;
//           return loggeduserby ? String(history?.receivedBy) === String(loggeduserby) : true;
//         });

//       const hydratedActivityLog = (lead.activityLog || []).map((activity) => ({
//         ...activity,
//         submittedUser: getUser(activity.submittedUser, activity.submissiondoneByModel),
//         taskallocatedBy: getUser(activity.taskallocatedBy, activity.taskallocatedByModel),
//         taskallocatedTo: getUser(activity.taskallocatedTo, activity.taskallocatedToModel),
//         taskBy: activity.taskBy ? taskMap.get(String(activity.taskBy)) || null : null,
//         taskId: activity.taskId ? taskMap.get(String(activity.taskId)) || null : null
//       }));

//       const hydratedLeadFor = (lead.leadFor || []).map((item) => ({
//         ...item,
//         productorServiceId: getServiceProduct(item.productorServiceId, item.productorServicemodel)
//       }));

//       // const hydratedPayments = filteredPaymentHistory.map((history, index) => ({
//       //   ...history,
//       //   originalIndex: index,
//       //   receivedBy: getUser(history.receivedBy, history.receivedModel),
//       //   paymentVerifiedBy: getUser(history.paymentVerifiedBy, history.paymentverifiedModel),
//       //   paymentEntries: (history.paymentEntries || []).map((entry) => ({
//       //     ...entry,
//       //     productorServiceId: getServiceProduct(entry.productorServiceId, entry.productorServicemodel)
//       //   }))
//       // }));
//       const hydratedPayments = filteredPaymentHistory.map((history) => ({
//         ...history,
//         receivedBy: getUser(history.receivedBy, history.receivedModel),
//         paymentVerifiedBy: getUser(history.paymentVerifiedBy, history.paymentverifiedModel),
//         paymentEntries: (history.paymentEntries || []).map((entry) => ({
//           ...entry,
//           productorServiceId: getServiceProduct(entry.productorServiceId, entry.productorServicemodel)
//         }))
//       }));

//       const lastActivity = hydratedActivityLog.at(-1);
//       const lastAllocatedActivity = [...hydratedActivityLog]
//         .reverse()
//         .find((a) => a?.taskallocatedTo || a?.taskallocatedBy);

//       return {
//         ...lead,
//         customerName: customerMap.get(String(lead.customerName)) || null,
//         partner: partnerMap.get(String(lead.partner)) || null,
//         leadBy: getUser(lead.leadBy, lead.leadByModel),
//         leadFor: hydratedLeadFor,
//         paymentHistory: hydratedPayments,
//         activityLog: hydratedActivityLog,
//         taskallocatedTo: lastAllocatedActivity?.taskallocatedTo || null,
//         taskallocatedBy: lastAllocatedActivity?.taskallocatedBy || null,
//         leadclosedBy: lastActivity?.submittedUser || null,
//         followupClosed: true
//       };
//     }).filter(Boolean);

//     return res.status(finalLeads.length ? 201 : 200).json({
//       message: finalLeads.length ? "lead found" : "lead not found",
//       data: finalLeads
//     });
//   } catch (error) {
//     console.log("error", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// };

export const GetlostLeads = async (req, res) => {
  try {
    const { selectedBranch, startDate = null, endDate = nul, } = req.query

    if (!selectedBranch || !mongoose.Types.ObjectId.isValid(selectedBranch)) {
      return res.status(400).json({ message: "Invalid selectedBranch" })
    }

    const query = {
      leadBranch: new mongoose.Types.ObjectId(selectedBranch),
      leadLost: true,
    }


    if (startDate && endDate) {
      const lostStartDate = new Date(`${startDate}T00:00:00.000+05:30`)
      const lostEndDate = new Date(`${endDate}T23:59:59.999+05:30`)

      if (isNaN(lostStartDate.getTime()) || isNaN(lostEndDate.getTime())) {
        return res.status(400).json({ message: "Invalid startDate or endDate" })
      }

      if (lostStartDate > lostEndDate) {
        return res.status(400).json({ message: "startDate cannot be greater than endDate" })
      }

      query.leadLostDate = {
        $gte: lostStartDate,
        $lte: lostEndDate,
      }
    }
    console.log("quereyyy", query)
    const matchedlostLead = await LeadMaster.find(query)
      .populate({ path: "customerName", select: "customerName" })
      .lean()

    const populatedlostLeads = await Promise.all(
      matchedlostLead.map(async (lead) => {
        if (!lead.leadByModel || !mongoose.models[lead.leadByModel]) {
          console.error(`Model ${lead.leadByModel} is not registered`)
          return lead
        }

        const assignedModel = mongoose.model(lead.leadByModel)
        const populatedLeadBy = await assignedModel
          .findById(lead.leadBy)
          .select("name")
          .lean()

        let lasttaskallocatedto = null
        let lasttaskallocatedBy = null

        const populatedActivityLog = await Promise.all(
          (lead.activityLog || []).map(async (activity) => {
            const populatedActivity = { ...activity }

            if (activity.submissiondoneByModel && activity.submittedUser) {
              const model = mongoose.model(activity.submissiondoneByModel)
              populatedActivity.submittedUser = await model
                .findById(activity.submittedUser)
                .select("name")
                .lean()
            }

            if (activity.taskallocatedByModel && activity.taskallocatedBy) {
              const model = mongoose.model(activity.taskallocatedByModel)
              lasttaskallocatedBy = populatedActivity.taskallocatedBy = await model
                .findById(activity.taskallocatedBy)
                .select("name")
                .lean()
            }

            if (activity.taskallocatedToModel && activity.taskallocatedTo) {
              const model = mongoose.model(activity.taskallocatedToModel)
              lasttaskallocatedto = populatedActivity.taskallocatedTo = await model
                .findById(activity.taskallocatedTo)
                .select("name")
                .lean()
            }

            return populatedActivity
          })
        )

        const lastActivity =
          populatedActivityLog[populatedActivityLog.length - 1]

        return {
          ...lead,
          leadBy: populatedLeadBy,
          activityLog: populatedActivityLog,
          taskallocatedTo: lasttaskallocatedto || null,
          taskallocatedBy: lasttaskallocatedBy || null,
          leadclosedBy: lastActivity?.submittedUser || null,
        }
      })
    )

    if (populatedlostLeads.length > 0) {
      return res.status(200).json({
        message: "lead found",
        data: populatedlostLeads,
      })
    } else {
      return res.status(200).json({
        message: "lead not found",
        data: [],
      })
    }
  } catch (error) {
    console.log("error:", error)
    return res.status(500).json({ message: "Internal server error" })
  }
}
export const GetallproductwiseReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = new Date(startDate);
    const end = new Date(endDate);


    const result = await LeadMaster.aggregate([

      // 1️⃣ Unwind activityLog
      { $unwind: "$activityLog" },

      // 2️⃣ Only followup allocations
      {
        $match: {
          "activityLog.taskallocatedTo": { $exists: true, $ne: null },
          "activityLog.taskTo": "followup",
          "activityLog.allocationChanged": false,
          "activityLog.submissionDate": {
            $gte: start,
            $lte: end,
          },
        },
      },

      // 3️⃣ Sort latest first
      {
        $sort: {
          "activityLog.submissionDate": -1,
        },
      },

      // 4️⃣ Unwind leadFor
      { $unwind: "$leadFor" },

      // 5️⃣ 🔥 KEEP BRANCH (IMPORTANT FIX)
      {
        $addFields: {
          branchId: "$leadBranch"
        }
      },

      // 6️⃣ 🔥 FIRST GROUP (dedup fix + branch included)
      {
        $group: {
          _id: {
            leadId: "$leadId",
            staffId: "$activityLog.taskallocatedTo",
            staffModel: "$activityLog.taskallocatedToModel",
            productId: "$leadFor.productorServiceId",
            productModel: "$leadFor.productorServicemodel",
            submissionDate: "$activityLog.submissionDate",
            branchId: "$branchId"   // ✅ FIXED
          },

          leadLost: { $first: "$leadLost" },
          leadLostDate: { $first: "$leadLostDate" },
          leadConvertedDate: { $first: "$leadConvertedDate" },

          netAmount: { $first: "$leadFor.netAmount" }
        }
      },

      // 7️⃣ STATUS
      {
        $addFields: {
          status: {
            $cond: [
              {
                $and: [
                  { $eq: ["$leadLost", true] },
                  { $ne: ["$leadLostDate", null] },
                ],
              },
              "LOST",
              {
                $cond: [
                  { $ne: ["$leadConvertedDate", null] },
                  "CONVERTED",
                  "PENDING",
                ],
              },
            ],
          },
        },
      },

      // 8️⃣ FLAGS
      {
        $addFields: {
          isLost: { $cond: [{ $eq: ["$status", "LOST"] }, 1, 0] },
          isConverted: { $cond: [{ $eq: ["$status", "CONVERTED"] }, 1, 0] },
          isPending: { $cond: [{ $eq: ["$status", "PENDING"] }, 1, 0] },
        },
      },

      // 9️⃣ AMOUNT CALC
      {
        $addFields: {
          entryTotalAmount: { $ifNull: ["$netAmount", 0] },

          entryConvertedAmount: {
            $cond: [{ $eq: ["$isConverted", 1] }, "$netAmount", 0],
          },

          entryLostAmount: {
            $cond: [{ $eq: ["$isLost", 1] }, "$netAmount", 0],
          },

          entryPendingAmount: {
            $cond: [{ $eq: ["$isPending", 1] }, "$netAmount", 0],
          },
        },
      },

      // 🔟 FINAL GROUP (PRODUCT + BRANCH WISE)
      {
        $group: {
          _id: {
            productId: "$_id.productId",
            productModel: "$_id.productModel",
            branchId: "$_id.branchId"   // ✅ FIXED
          },

          leadCount: { $sum: 1 },

          totalConverted: { $sum: "$isConverted" },
          totalLost: { $sum: "$isLost" },
          totalPending: { $sum: "$isPending" },

          totalNetAmount: { $sum: "$entryTotalAmount" },
          convertedNetAmount: { $sum: "$entryConvertedAmount" },
          lostNetAmount: { $sum: "$entryLostAmount" },
          totalPendingAmount: { $sum: "$entryPendingAmount" }
        }
      },

      // 1️⃣1️⃣ PRODUCT LOOKUP
      {
        $lookup: {
          from: "products",
          localField: "_id.productId",
          foreignField: "_id",
          as: "product"
        }
      },

      // 1️⃣2️⃣ SERVICE LOOKUP
      {
        $lookup: {
          from: "services",
          localField: "_id.productId",
          foreignField: "_id",
          as: "service"
        }
      },

      // 1️⃣3️⃣ RESOLVE PRODUCT NAME
      {
        $addFields: {
          productName: {
            $cond: [
              { $eq: ["$_id.productModel", "Product"] },
              { $arrayElemAt: ["$product.productName", 0] },
              { $arrayElemAt: ["$service.serviceName", 0] }
            ]
          }
        }
      },

      // 1️⃣4️⃣ FINAL OUTPUT
      {
        $project: {
          _id: 0,

          productId: "$_id.productId",
          productModel: "$_id.productModel",
          branch: "$_id.branchId",   // ✅ FIXED

          productName: 1,

          leadCount: 1,
          totalConverted: 1,
          totalLost: 1,
          totalPending: 1,

          totalNetAmount: 1,
          convertedNetAmount: 1,
          lostNetAmount: 1,
          totalPendingAmount: 1
        }
      },

      // 1️⃣5️⃣ SORT
      {
        $sort: {
          productName: 1
        }
      }
    ]);




    ///stqfffwisereport 
    const re = await LeadMaster.aggregate([
      // 1️⃣ Unwind activity log
      { $unwind: "$activityLog" },

      // 2️⃣ Filter followup tasks
      {
        $match: {
          "activityLog.taskallocatedTo": { $exists: true, $ne: null },
          "activityLog.taskTo": "followup",
          "activityLog.allocationChanged": false,
        },
      },

      // 3️⃣ Sort by latest assignment
      {
        $sort: {
          "activityLog.submissionDate": -1,
        },
      },

      // 4️⃣ One record per lead (latest assignment)
      {
        $group: {
          _id: "$leadId",

          leadId: { $first: "$leadId" },
          branch: { $first: "$leadBranch" },

          leadConvertedDate: { $first: "$leadConvertedDate" },
          leadLostDate: { $first: "$leadLostDate" },
          leadLostFlag: { $first: "$leadLost" },

          netAmount: { $first: "$netAmount" },

          staffId: { $first: "$activityLog.taskallocatedTo" },
          model: { $first: "$activityLog.taskallocatedToModel" },

          assignmentDate: { $first: "$activityLog.submissionDate" },
        },
      },

      // 5️⃣ 🔥 BASE FILTER (THIS IS THE KEY FIX)
      {
        $match: {
          assignmentDate: { $gte: start, $lte: end },
        },
      },

      // 6️⃣ LOST
      {
        $addFields: {
          isLost: {
            $cond: [
              {
                $and: [
                  { $eq: ["$leadLostFlag", true] },
                  { $ne: ["$leadLostDate", null] },
                  { $gte: ["$leadLostDate", start] },
                  { $lte: ["$leadLostDate", end] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },

      // 7️⃣ CONVERTED
      {
        $addFields: {
          isConverted: {
            $cond: [
              {
                $and: [
                  { $eq: ["$isLost", 0] },
                  { $ne: ["$leadConvertedDate", null] },
                  { $gte: ["$leadConvertedDate", start] },
                  { $lte: ["$leadConvertedDate", end] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },

      // 8️⃣ PENDING
      {
        $addFields: {
          isPending: {
            $cond: [
              {
                $and: [
                  { $eq: ["$isLost", 0] },
                  { $eq: ["$isConverted", 0] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },

      // 9️⃣ Group per staff
      {
        $group: {
          _id: {
            staffId: "$staffId",
            branch: "$branch",
            model: "$model",
          },

          leadCount: { $sum: 1 }, // ✅ SAME dataset

          totalConverted: { $sum: "$isConverted" },
          totalLost: { $sum: "$isLost" },
          totalPending: { $sum: "$isPending" },

          totalNetAmount: { $sum: { $ifNull: ["$netAmount", 0] } },

          convertedNetAmount: {
            $sum: {
              $cond: [
                { $eq: ["$isConverted", 1] },
                { $ifNull: ["$netAmount", 0] },
                0,
              ],
            },
          },

          lostNetAmount: {
            $sum: {
              $cond: [
                { $eq: ["$isLost", 1] },
                { $ifNull: ["$netAmount", 0] },
                0,
              ],
            },
          },

          pendingNetAmount: {
            $sum: {
              $cond: [
                { $eq: ["$isPending", 1] },
                { $ifNull: ["$netAmount", 0] },
                0,
              ],
            },
          },
        },
      },

      // 🔟 Lookup staff/admin
      {
        $lookup: {
          from: "staffs",
          localField: "_id.staffId",
          foreignField: "_id",
          as: "staffData",
        },
      },
      {
        $lookup: {
          from: "admins",
          localField: "_id.staffId",
          foreignField: "_id",
          as: "adminData",
        },
      },

      // 1️⃣1️⃣ Resolve user
      {
        $addFields: {
          user: {
            $cond: [
              { $eq: ["$_id.model", "Admin"] },
              { $arrayElemAt: ["$adminData", 0] },
              { $arrayElemAt: ["$staffData", 0] },
            ],
          },
        },
      },

      // 1️⃣2️⃣ Final projection
      {
        $project: {
          _id: 0,
          branch: "$_id.branch",
          staffId: "$_id.staffId",

          staffName: { $ifNull: ["$user.name", "Unknown"] },
          staffRole: { $ifNull: ["$user.role", "Unknown"] },

          leadCount: 1,
          totalConverted: 1,
          totalLost: 1,
          totalPending: 1,

          totalNetAmount: 1,
          convertedNetAmount: 1,
          lostNetAmount: 1,
          pendingNetAmount: 1,
        },
      },

      // 1️⃣3️⃣ Sort
      {
        $sort: { staffName: 1 },
      },
    ]);





    const mappeddata = result.map((item) => ({
      staffId: item.staffId,
      productId: item.productId,
      branch: item?.branch,
      staffName: item.staffName,
      staffRole: item.staffRole,
      productName: item.productName,
      leadCount: item.leadCount,
      totalConverted: item.totalConverted,
      totalLost: item.totalLost,
      totalPending: item.totalPending,
      totalNetAmount: item.totalNetAmount,
      convertedNetAmount: item.convertedNetAmount,
      totalPendingAmount: item.totalPendingAmount,
      lostNetAmount: item.lostNetAmount
    }))


    if (result && result.length > 0) {
      return res.status(200).json({ message: "lead found", data: { mappeddata, re } })
    } else {
      return res.status(200).json({ message: "lead found", data: { mappeddata, re } })
    }
  } catch (error) {
    console.log("error", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const GetownLeadList = async (req, res) => {
  try {
    const { userId, selectedBranch, role, ownlead, startDate, endDate } = req.query;

    const objectId = new mongoose.Types.ObjectId(userId);

    let query
    if (ownlead === "true") {
      query = {

        leadBranch: new mongoose.Types.ObjectId(selectedBranch),
        leadBy: objectId,
      };
    } else if (ownlead === "false" && role !== "Staff") {
      query = {

        leadBranch: new mongoose.Types.ObjectId(selectedBranch)
      };
    }
    const parsedStart = startDate ? new Date(startDate) : null
    const parsedEnd = endDate ? new Date(endDate) : null

    if (parsedStart && !isNaN(parsedStart.getTime()) && parsedEnd && !isNaN(parsedEnd.getTime())) {
      parsedStart.setHours(0, 0, 0, 0)
      parsedEnd.setHours(0, 0, 0, 0)
      parsedEnd.setDate(parsedEnd.getDate() + 1)

      query.leadDate = {
        $gte: parsedStart,
        $lt: parsedEnd,
      }
    }
    const matchedLead = await LeadMaster.find(query)
      .populate({ path: "customerName", select: "customerName mobile email" })
      .lean();

    const populatedOwnLeads = await Promise.all(
      matchedLead.map(async (lead) => {
        if (!lead.leadByModel || !mongoose.models[lead.leadByModel]) {
          console.error(`Model ${lead.leadByModel} is not registered`);
          return lead;
        }

        // Fetch leadBy name
        const assignedModel = mongoose.model(lead.leadByModel);
        const populatedLeadBy = await assignedModel
          .findById(lead.leadBy)
          .select("name")
          .lean();
        let taskallocatedTo;
        let taskallocatedBy;
        // ✅ Populate activityLog fields
        const populatedActivityLog = await Promise.all(
          (lead.activityLog || []).map(async (activity) => {
            const populatedActivity = { ...activity };

            // Populate taskallocatedTo
            if (activity.submissiondoneByModel && activity.submittedUser && activity?.taskallocatedTo && activity?.allocationChanged === false) {
              const model = mongoose.model(activity.taskallocatedToModel);
              taskallocatedTo = populatedActivity.taskallocatedTo = await model
                .findById(activity.taskallocatedTo)
                .select("name")
                .lean();
            }

            // // Populate taskallocatedBy
            if (activity.taskallocatedByModel && activity.taskallocatedBy && activity?.allocationChanged === false) {
              const model = mongoose.model(activity.taskallocatedByModel);
              taskallocatedBy = populatedActivity.taskallocatedBy = await model
                .findById(activity.taskallocatedBy)
                .select("name")
                .lean();
            }
            if (activity.submittedUser) {
              const model = mongoose.model(activity.submissiondoneByModel);
              populatedActivity.submittedUser = await model.findById(activity.submittedUser).select("name").lean()
            }
            if (activity.taskId && isValidObjectId(activity.taskId)) {
              populatedActivity.taskId = await Task.findById(activity.taskId)
                .select("taskName")
                .lean();
            }

            // ✅ Populate submissionDoneBy
            if (activity.taskallocatedToModel && activity.taskallocatedTo) {
              const model = mongoose.model(activity.taskallocatedToModel);
              populatedActivity.taskallocatedTo = await model
                .findById(activity.taskallocatedTo)
                .select("name")
                .lean();
            }
            if (activity.taskBy && isValidObjectId(activity.taskBy)) {
              populatedActivity.taskBy = await Task.findById(activity.taskBy).select("taskName").lean()
            }
            if (activity.taskId && isValidObjectId(activity.taskId)) {
              populatedActivity.taskId = await Task.findById(activity.taskId).select("taskName").lean()
            }

            return populatedActivity;
          })
        );
        let populatedProduct
        const populateleadFor = await Promise.all(
          (lead.leadFor || []).map(async (item) => {
            const populatedItem = { ...item }
            if (item?.productorServiceId) {
              const model = mongoose.model(item.productorServicemodel)
              populatedProduct = populatedItem.productorServiceId = await model.findById(item.productorServiceId).select("productName shortName").lean()
            }
            return populatedItem
          }))

        // ✅ Get last activity
        const lastActivity =
          populatedActivityLog[populatedActivityLog.length - 1];

        return {
          ...lead,
          leadBy: populatedLeadBy,
          leadFor: populateleadFor,
          activityLog: populatedActivityLog, // include fully populated activity logs
          taskallocatedTo: taskallocatedTo || null,
          taskallocatedBy: taskallocatedBy || null,
        };
      })
    );
    if (populatedOwnLeads && populatedOwnLeads.length > 0) {
      return res
        .status(201)
        .json({ message: "lead found", data: populatedOwnLeads });
    } else {
      return res
        .status(200)
        .json({ message: "lead  not found", data: populatedOwnLeads });
    }
  } catch (error) {
    console.log("error:", error.message);
    return res.status(500).json({ message: "Internal server error" });
  }
};
export const fixLeadVerifiedField = async (req, res) => {
  try {
    // 1️⃣ Rename the field 'leadVarified' -> 'leadVerified'
    await LeadMaster.updateMany(
      { leadVerified: { $exists: true } },
      {
        $rename: { leadVerified: "paymentVerified" },
      }
    );

    // 2️⃣ Set all documents' leadVerified to false (including newly renamed ones)
    const result = await LeadMaster.updateMany(
      {},
      { $set: { paymentVerified: false } }
    );
    if (result.acknowledged && result.modifiedCount > 0) {
      console.log(`✅ Successfully updated ${result.modifiedCount} leads.`);
      return res.status(200).json({ message: "update all" });
    } else if (result.acknowledged && result.modifiedCount === 0) {
      console.log(
        "ℹ️ No leads were modified — they may already have leadVerified: false."
      );
    } else {
      console.log("❌ Update failed.");
    }

    console.log(
      "✅ Field renamed to 'leadVerified' and set to false for all documents."
    );
  } catch (error) {
    console.error("❌ Error updating field:", error);
  }
};
