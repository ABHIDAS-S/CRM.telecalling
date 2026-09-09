
// import mongoose from "mongoose";

// const toNullableNumber = (v) => {
//   if (v === "" || v === null || v === undefined) return null;
//   if (typeof v === "string" && v.trim() === "") return null;
//   const num = Number(v);
//   return Number.isNaN(num) ? null : num;
// };

// const toZeroNumber = (v) => {
//   if (v === "" || v === null || v === undefined) return 0;
//   const num = Number(v);
//   return Number.isNaN(num) ? 0 : num;
// };

// const paymentEntrySchema = new mongoose.Schema(
//   {
//     productorServiceId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Product",
//       required: true,
//     },
//     productorServicemodel: {
//       type: String,
//       trim: true,
//     },
//     netAmount: {
//       type: Number,
//       required: true,
//     },
//     receivedAmount: {
//       type: Number,
//       required: true,
//     },
//     balanceAmount: {
//       type: Number,
//       required: true,
//     },
//   },
//   { _id: false }
// );

// const LicenseNumberItemSchema = new mongoose.Schema(
//   {
//     licenseNumber: {
//       type: Number,
//       default: null,
//       set: toNullableNumber,
//     },
//     productorServiceId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Product",
//       default: null,
//     },
//     productorServiceName: {
//       type: String,
//       trim: true,
//       default: "",
//     },
//     sourceIndex: {
//       type: Number,
//       default: undefined,
//     },
//   },
//   { _id: false }
// );

// const TaggedDataSchema = new mongoose.Schema(
//   {
//     licensenumber: { type: Number, default: null, set: toNullableNumber },
//     nextDue: { type: Date, default: null },
//     productAmount: { type: Number, default: 0, set: toZeroNumber },
//     taxinclusiveamount: { type: Number, default: 0, set: toZeroNumber },
//     taxexclusiveAmount: { type: Number, default: 0, set: toZeroNumber },
//     discountAmount: { type: Number, default: 0, set: toZeroNumber },
//     hsn: { type: Number, default: 0, set: toZeroNumber },
//     noofusers: { type: Number, default: 0, set: toZeroNumber },
//     serialNumber: {
//       type: String,
//       default: null,
//     },
//     nextDueAmount: { type: Number, default: 0, set: toZeroNumber },
//     originalHsn: { type: Number, default: 0, set: toZeroNumber },
//     leadAmount: { type: Number, default: 0, set: toZeroNumber },
//     totalleadAmount: { type: Number, default: 0, set: toZeroNumber },
//     totalnextDueAmount: { type: Number, default: 0, set: toZeroNumber },
//     leadTax: { type: Number, default: 0, set: toZeroNumber },
//     nextDueTax: { type: Number, default: 0, set: toZeroNumber },
//   },
//   { _id: false }
// );

// const leadForItemSchema = new mongoose.Schema(
//   {
//     productorServiceId: {
//       type: mongoose.Schema.Types.ObjectId,
//       refPath: "productorServicemodel",
//       default: null,
//     },
//     productorservicetype: {
//       type: String,
//       trim: true,
//       default: "",
//     },
//     company_id: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Company",
//       default: null,
//     },
//     branch_id: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Branch",
//       default: null,
//     },
//     productorServicemodel: {
//       type: String,
//       enum: ["Product", "Service"],
//       trim: true,
//       default: "Product",
//     },
//     productorServiceName: {
//       type: String,
//       trim: true,
//       default: "",
//     },
//     licenseNumber: {
//       type: Number,
//       default: null,
//       set: toNullableNumber,
//     },
//     productPrice: {
//       type: Number,
//       default: 0,
//       set: toZeroNumber,
//     },
//     taxAmount: {
//       type: Number,
//       default: 0,
//       set: toZeroNumber,
//     },
//     hsn: {
//       type: Number,
//       default: 0,
//       set: toZeroNumber,
//     },
//     netAmount: {
//       type: Number,
//       default: 0,
//       set: toZeroNumber,
//     },
//     price: {
//       type: Number,
//       default: null,
//       set: toNullableNumber,
//     },
//     licenseNumbers: {
//       type: [LicenseNumberItemSchema],
//       default: [],
//     },
//     taggeddata: {
//       type: [TaggedDataSchema],
//       default: [],
//     },
//     applicationDate: {
//       type: Date,
//       default: null,
//     },
//     softwareTrade: {
//       type: String,
//       trim: true,
//       default: "",
//     },
//     nextDue: {
//       type: Date,
//       default: null,
//     },
//     noofusers: {
//       type: Number,
//       default: 0,
//       set: toZeroNumber,
//     },
//     version: {
//       type: mongoose.Schema.Types.Mixed,
//       default: null,
//     },
//     isActive: {
//       type: String,
//       trim: true,
//       default: "Running",
//     },
//     status: {
//       type: String,
//       trim: true,
//       default: "Running",
//     },
//     actualproductPrice: {
//       type: Number,
//       default: 0,
//       set: toZeroNumber,
//     },
//     actualHsn: {
//       type: Number,
//       default: 0,
//       set: toZeroNumber,
//     },
//     actualNetAmount: {
//       type: Number,
//       default: 0,
//       set: toZeroNumber,
//     },
//     parentPrimaryProductId: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Product",
//       default: null,
//     },
//     isDefaultService: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   { _id: false }
// );

// const leadSchema = new mongoose.Schema(
//   {
//     leadId: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     leadDate: {
//       type: Date,
//       default: null,
//     },
//     customerName: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Customer",
//       default: null,
//     },
//     mobile: {
//       type: String,
//       trim: true,
//       default: "",
//     },
//     phone: {
//       type: String,
//       trim: true,
//       default: "",
//     },
//     email: {
//       type: String,
//       trim: true,
//       default: "",
//     },
//     location: {
//       type: String,
//       trim: true,
//       default: "",
//     },
//     pincode: {
//       type: String,
//       trim: true,
//       default: "",
//     },
//     trade: {
//       type: String,
//       trim: true,
//       default: "",
//     },
//     partner: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Partner",
//       default: null,
//     },
//     leadConfirmed: {
//       type: Boolean,
//       default: false,
//     },
//     leadClosed: {
//       type: Boolean,
//       default: false,
//     },
//     leadClosedDate: {
//       type: Date,
//       default: null,
//     },
//     leadLostDate: {
//       type: Date,
//       default: null,
//     },
//     leadConvertedDate: {
//       type: Date,
//       default: null,
//     },
//     forcefullyClosedTarget: {
//       type: Boolean,
//       default: false,
//     },
//     leadLost: {
//       type: Boolean,
//       default: false,
//     },
//     leadBranch: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Branch",
//       default: null,
//     },
//     dueDate: {
//       type: Date,
//       default: null,
//     },
//     paymentVerified: {
//       type: Boolean,
//       default: false,
//     },
//     source: {
//       type: String,
//       trim: true,
//       default: "",
//     },
//     excessPaidAmount: {
//       type: Number,
//       default: 0,
//       set: toZeroNumber,
//     },
//     leadFor: {
//       type: [leadForItemSchema],
//       default: [],
//     },
//     leadBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       refPath: "assignedtoleadByModel",
//       default: null,
//     },
//     leadClosedModel: {
//       type: String,
//       enum: ["Staff", "Admin"],
//       trim: true,
//       default: null,
//     },
//     leadByModel: {
//       type: String,
//       enum: ["Staff", "Admin"],
//       trim: true,
//       default: null,
//     },
//     taxableAmount: {
//       type: Number,
//       default: 0,
//       set: toZeroNumber,
//     },
//     taxAmount: {
//       type: Number,
//       default: 0,
//       set: toZeroNumber,
//     },
//     netAmount: {
//       type: Number,
//       default: 0,
//       set: toZeroNumber,
//     },
//     discountAmount: {
//       type: Number,
//       default: 0,
//       set: toZeroNumber,
//     },
//     balanceAmount: {
//       type: Number,
//       default: 0,
//       set: toZeroNumber,
//     },
//     totalPaidAmount: {
//       type: Number,
//       default: 0,
//       set: toZeroNumber,
//     },
//     remark: {
//       type: String,
//       trim: true,
//       default: "",
//     },
//     paymentHistory: [
//       {
//         paymentDate: { type: Date, default: null },
//         paymentVerified: { type: Boolean, default: false },
//         paymentVerifiedBy: {
//           type: mongoose.Schema.Types.ObjectId,
//           refPath: "paymentverifiedModel",
//           default: null,
//         },
//         paymentverifiedModel: {
//           type: String,
//           enum: ["Staff", "Admin"],
//           trim: true,
//           default: null,
//         },
//         verifiedAt: { type: Date, default: null },
//         receivedAmount: { type: Number, default: 0, set: toZeroNumber },
//         paymentEntries: {
//           type: [paymentEntrySchema],
//           default: [],
//         },
//         receivedBy: {
//           type: mongoose.Schema.Types.ObjectId,
//           refPath: "recievedModel",
//           default: null,
//         },
//         receivedModel: {
//           type: String,
//           enum: ["Staff", "Admin"],
//           trim: true,
//           default: null,
//         },
//         bankRemarks: {
//           type: String,
//           trim: true,
//           default: "",
//         },
//         remarks: {
//           type: String,
//           trim: true,
//           default: "",
//         },
//       },
//     ],
//     reallocatedTo: {
//       type: Boolean,
//       default: false,
//     },
//     activityLog: [
//       {
//         submissionDate: { type: Date, default: null },
//         submittedUser: {
//           type: mongoose.Schema.Types.ObjectId,
//           refPath: "submissiondoneByModel",
//           default: null,
//         },
//         submissiondoneByModel: {
//           type: String,
//           enum: ["Staff", "Admin"],
//           trim: true,
//           default: null,
//         },
//         taskallocatedBy: {
//           type: mongoose.Schema.Types.ObjectId,
//           refPath: "taskallocatedByModel",
//           default: null,
//         },
//         taskallocatedByModel: {
//           type: String,
//           enum: ["Staff", "Admin"],
//           trim: true,
//           default: null,
//         },
//         taskallocatedTo: {
//           type: mongoose.Schema.Types.ObjectId,
//           refPath: "taskallocatedToModel",
//           default: null,
//         },
//         taskallocatedToModel: {
//           type: String,
//           enum: ["Staff", "Admin"],
//           trim: true,
//           default: null,
//         },
//         remarks: {
//           type: String,
//           trim: true,
//           default: "",
//         },
//         taskBy: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Task",
//           default: null,
//         },
//         taskTo: {
//           type: String,
//           trim: true,
//           default: "",
//         },
//         taskId: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Task",
//           default: null,
//         },
//         taskDescription: {
//           type: String,
//           trim: true,
//           default: "",
//         },
//  taskrejectDescription: {
//           type: String,
//           trim: true,
//           default: "",
//         },
//         reallocatedTo: {
//           type: Boolean,
//           default: false,
//         },
//         taskClosed: {
//           type: Boolean,
//           default: false,
//         },
//         followupClosed: {
//           type: Boolean,
//           default: false,
//         },
//         allocatedClosed: {
//           type: Boolean,
//           default: false,
//         },
//         allocationlist: {
//           type: Boolean,
//           default: false,
//         },
//         followUpDate: {
//           type: Date,
//           default: null,
//         },
//         nextFollowUpDate: {
//           type: Date,
//           default: null,
//         },
//         allocationDate: {
//           type: Date,
//           default: null,
//         },
//         taskSubmissionDate: {
//           type: Date,
//           default: null,
//         },
//         taskfromFollowup: {
//           type: Boolean,
//           default: false,
//         },
//         allocationChanged: {
//           type: Boolean,
//           default: false,
//         },
//         changeReason: {
//           type: String,
//           trim: true,
//           default: "",
//         },
//       },
//     ],
//     followupClosed: {
//       type: Boolean,
//       default: false,
//     },
//     allocationType: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Task",
//       default: null,
//     },
//     selfAllocationType: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Task",
//       default: null,
//     },
//     selfAllocationDueDate: {
//       type: Date,
//       default: null,
//     },
//     selfAllocation: {
//       type: Boolean,
//       default: false,
//     },
//     taskfromFollowup: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   { timestamps: true }
// );

// leadSchema.index({ leadBranch: 1, leadLost: 1, createdAt: -1 });
// leadSchema.index({ leadBranch: 1, leadConvertedDate: 1 });
// leadSchema.index({ leadBranch: 1, "activityLog.taskTo": 1, "activityLog.followupClosed": 1 });
// leadSchema.index({ leadBranch: 1, "paymentHistory.paymentVerified": 1 });
// leadSchema.index({ leadBy: 1, leadByModel: 1 });
// leadSchema.index({ customerName: 1 });
// leadSchema.index({ partner: 1 });
// leadSchema.index({ leadBranch: 1, reallocatedTo: 1, leadConfirmed: 1 });
// leadSchema.index({ "leadFor.productorServiceId": 1 });
// leadSchema.index({
//   leadBranch: 1,
//   "activityLog.taskTo": 1,
//   "activityLog.submittedUser": 1,
//   "activityLog.taskallocatedTo": 1,
//   "activityLog.allocationChanged": 1,
//   "activityLog.allocatedClosed": 1,
//   "activityLog.taskClosed": 1,
//   "activityLog.followupClosed": 1,
// });
// leadSchema.index({
//   "leadFor.productorServiceId": 1,
//   "leadFor.branch_id": 1,
// });

// export default mongoose.model("LeadMaster", leadSchema);




////uddated validation schema validation on 7-08-2026

import mongoose from "mongoose";

const toNullableNumber = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
};

const toZeroNumber = (value) => {
  if (value === "" || value === null || value === undefined) return 0;
  const number = Number(value);
  return Number.isNaN(number) ? 0 : number;
};

const paymentEntrySchema = new mongoose.Schema(
  {
    productorServiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productorServicemodel: { type: String, trim: true },
    netAmount: { type: Number, required: true },
    receivedAmount: { type: Number, required: true },
    balanceAmount: { type: Number, required: true },
  },
  { _id: false }
);

const licenseNumberItemSchema = new mongoose.Schema(
  {
    licenseNumber: { type: Number, default: null, set: toNullableNumber },
    productorServiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    productorServiceName: { type: String, trim: true, default: "" },
    sourceIndex: { type: Number, default: undefined },
  },
  { _id: false }
);

const taggedDataSchema = new mongoose.Schema(
  {
    licensenumber: { type: Number, default: null, set: toNullableNumber },
    nextDue: { type: Date, default: null },
    productAmount: { type: Number, default: 0, set: toZeroNumber },
    taxinclusiveamount: { type: Number, default: 0, set: toZeroNumber },
    taxexclusiveAmount: { type: Number, default: 0, set: toZeroNumber },
    discountAmount: { type: Number, default: 0, set: toZeroNumber },
    hsn: { type: Number, default: 0, set: toZeroNumber },
    noofusers: { type: Number, default: 0, set: toZeroNumber },
    serialNumber: { type: String, default: null },
    nextDueAmount: { type: Number, default: 0, set: toZeroNumber },
    originalHsn: { type: Number, default: 0, set: toZeroNumber },
    leadAmount: { type: Number, default: 0, set: toZeroNumber },
    totalleadAmount: { type: Number, default: 0, set: toZeroNumber },
    totalnextDueAmount: { type: Number, default: 0, set: toZeroNumber },
    leadTax: { type: Number, default: 0, set: toZeroNumber },
    nextDueTax: { type: Number, default: 0, set: toZeroNumber },
  },
  { _id: false }
);

const leadForItemSchema = new mongoose.Schema(
  {
    productorServiceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "productorServicemodel",
      default: null,
      required: [true, "leadFor.productorServiceId is required"]
    },
    productorservicetype: {
      type: String,
      trim: true,
      required: [true, "leadFor.productorservicetype is required"],
    },
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: [true, "leadFor.company_id is required"],
    },
    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: [true, "leadFor.branch_id is required"],
    },
    productorServicemodel: {
      type: String,
      enum: ["Product", "Service"],
      trim: true,
      default: "Product",
    },
    productorServiceName: { type: String, trim: true, default: "" },
    licenseNumber: { type: Number, default: null, set: toNullableNumber },
    productPrice: { type: Number, default: 0, set: toZeroNumber },
    taxAmount: { type: Number, default: 0, set: toZeroNumber },
    hsn: { type: Number, default: 0, set: toZeroNumber },
    netAmount: { type: Number, default: 0, set: toZeroNumber },
    price: { type: Number, default: null, set: toNullableNumber },
    licenseNumbers: { type: [licenseNumberItemSchema], default: [] },
    taggeddata: { type: [taggedDataSchema], default: [] },
    applicationDate: { type: Date, default: null },
    softwareTrade: { type: String, trim: true, default: "" },
    nextDue: { type: Date, default: null },
    noofusers: { type: Number, default: 0, set: toZeroNumber },
    version: { type: mongoose.Schema.Types.Mixed, default: null },
    isActive: { type: String, trim: true, default: "Running" },
    status: { type: String, trim: true, default: "Running" },
    actualproductPrice: { type: Number, default: 0, set: toZeroNumber },
    actualHsn: { type: Number, default: 0, set: toZeroNumber },
    actualNetAmount: { type: Number, default: 0, set: toZeroNumber },
    parentPrimaryProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    isDefaultService: { type: Boolean, default: false },
  },
  { _id: false }
);

const activityLogItemSchema = new mongoose.Schema(
  {
    assignmentRevision: { type: Number, default: 0 },
    // Correct incentive ownership without rewriting who submitted the activity.
    incentiveAssignedUser: { type: mongoose.Schema.Types.ObjectId, default: null },
    incentiveAssignedUserModel: { type: String, enum: ["Staff", "Admin"], default: null },
    submissionDate: { type: Date, default: null },
    submittedUser: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "submissiondoneByModel",
      default: null,
    },
    submissiondoneByModel: {
      type: String,
      enum: ["Staff", "Admin"],
      trim: true,
      default: null,
    },
    taskallocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "taskallocatedByModel",
      default: null,
    },
    taskallocatedByModel: {
      type: String,
      enum: ["Staff", "Admin"],
      trim: true,
      default: null,
    },
    taskallocatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "taskallocatedToModel",
      default: null,
    },
    taskallocatedToModel: {
      type: String,
      enum: ["Staff", "Admin"],
      trim: true,
      default: null,
    },
    remarks: { type: String, trim: true, default: "" },
    taskBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    taskTo: { type: String, trim: true, default: "" },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    taskDescription: { type: String, trim: true, default: "" },
    taskrejectDescription: { type: String, trim: true, default: "" },
    reallocatedTo: { type: Boolean, default: false },
    taskClosed: { type: Boolean, default: false },
    followupClosed: { type: Boolean, default: false },
    allocatedClosed: { type: Boolean, default: false },
    allocationlist: { type: Boolean, default: false },
    followUpDate: { type: Date, default: null },
    nextFollowUpDate: { type: Date, default: null },
    allocationDate: { type: Date, default: null },
    taskSubmissionDate: { type: Date, default: null },
    taskfromFollowup: { type: Boolean, default: false },
    allocationChanged: { type: Boolean, default: false },
    changeReason: { type: String, trim: true, default: "" },
  },
  { _id: true, timestamps: false }
);

const leadSchema = new mongoose.Schema(
  {
    assignmentCorrections: [{
      assignmentId: { type: mongoose.Schema.Types.ObjectId, required: true },
      previousUser: mongoose.Schema.Types.ObjectId,
      previousUserModel: { type: String, enum: ["Staff", "Admin"], default: null },
      previousIncentiveUser: mongoose.Schema.Types.ObjectId,
      previousIncentiveUserModel: { type: String, enum: ["Staff", "Admin"], default: null },
      newUser: { type: mongoose.Schema.Types.ObjectId, required: true },
      newUserModel: { type: String, enum: ["Staff", "Admin"], required: true },
      changedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
      changedByModel: { type: String, enum: ["Staff", "Admin"], required: true },
      changedAt: { type: Date, required: true },
    }],
    leadId: { type: String, required: true, trim: true,unique: true, },
    leadDate: { type: Date, default: null },
    customerName: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
    },
    mobile: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    pincode: { type: String, trim: true, default: "" },
    trade: { type: String, trim: true, default: "" },
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      default: null,
    },
    leadConfirmed: { type: Boolean, default: false },
    leadClosed: { type: Boolean, default: false },
    leadClosedDate: { type: Date, default: null },
    leadLostDate: { type: Date, default: null },
    leadConvertedDate: { type: Date, default: null },
    forcefullyClosedTarget: { type: Boolean, default: false },
    leadLost: { type: Boolean, default: false },
    leadBranch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },
    dueDate: { type: Date, default: null },
    paymentVerified: { type: Boolean, default: false },
    source: { type: String, trim: true, default: "" },
    excessPaidAmount: { type: Number, default: 0, set: toZeroNumber },
    leadFor: { type: [leadForItemSchema], default: [] },
    leadBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "leadByModel",
      default: null,
    },
    leadClosedModel: {
      type: String,
      enum: ["Staff", "Admin"],
      trim: true,
      default: null,
    },
    leadByModel: {
      type: String,
      enum: ["Staff", "Admin"],
      trim: true,
      default: null,
    },
    taxableAmount: { type: Number, default: 0, set: toZeroNumber },
    taxAmount: { type: Number, default: 0, set: toZeroNumber },
    netAmount: { type: Number, default: 0, set: toZeroNumber },
    discountAmount: { type: Number, default: 0, set: toZeroNumber },
    balanceAmount: { type: Number, default: 0, set: toZeroNumber },
    totalPaidAmount: { type: Number, default: 0, set: toZeroNumber },
    remark: { type: String, trim: true, default: "" },
    paymentHistory: [
      {
        paymentDate: { type: Date, default: null },
        paymentVerified: { type: Boolean, default: false },
        paymentVerifiedBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "paymentverifiedModel",
          default: null,
        },
        paymentverifiedModel: {
          type: String,
          enum: ["Staff", "Admin"],
          trim: true,
          default: null,
        },
        verifiedAt: { type: Date, default: null },
        receivedAmount: { type: Number, default: 0, set: toZeroNumber },
        paymentEntries: { type: [paymentEntrySchema], default: [] },
        receivedBy: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: "receivedModel",
          default: null,
        },
        receivedModel: {
          type: String,
          enum: ["Staff", "Admin"],
          trim: true,
          default: null,
        },
        bankRemarks: { type: String, trim: true, default: "" },
        remarks: { type: String, trim: true, default: "" },
      },
    ],
    reallocatedTo: { type: Boolean, default: false },
    activityLog: {
      type: [activityLogItemSchema],
      default: [],
      validate: {
        validator(logs) {
          return (
            Array.isArray(logs) &&
            logs.every((log) => log !== null && log !== undefined && typeof log === "object")
          );
        },
        message: "activityLog cannot contain null or undefined entries",
      },
    },
    followupClosed: { type: Boolean, default: false },
    allocationType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    selfAllocationType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    selfAllocationDueDate: { type: Date, default: null },
    selfAllocation: { type: Boolean, default: false },
    taskfromFollowup: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const rejectUnsafeActivityLogUpdate = function (next) {
  const update = this.getUpdate() || {};
  const setData = update.$set || {};

  const usesNumericActivityLogPath = Object.keys(setData).some((path) =>
    /^activityLog\.\d+(?:\.|$)/.test(path)
  );

  if (usesNumericActivityLogPath) {
    return next(
      new Error(
        "Direct activityLog numeric-index updates are blocked. Update activity logs by subdocument _id using arrayFilters."
      )
    );
  }

  if (Object.prototype.hasOwnProperty.call(setData, "activityLog")) {
    const logs = setData.activityLog;
    if (!Array.isArray(logs) || logs.some((log) => log === null || log === undefined)) {
      return next(new Error("activityLog cannot contain null or undefined entries"));
    }
  }

  const pushedLog = update.$push?.activityLog;
  const entries = pushedLog?.$each ? pushedLog.$each : pushedLog === undefined ? [] : [pushedLog];

  if (entries.some((entry) => entry === null || entry === undefined)) {
    return next(new Error("Cannot push null or undefined into activityLog"));
  }

  next();
};

// leadSchema.pre("updateOne", rejectUnsafeActivityLogUpdate);
// leadSchema.pre("updateMany", rejectUnsafeActivityLogUpdate);
// leadSchema.pre("findOneAndUpdate", rejectUnsafeActivityLogUpdate);
// leadSchema.pre("findByIdAndUpdate", rejectUnsafeActivityLogUpdate);

leadSchema.index({ leadBranch: 1, leadLost: 1, createdAt: -1 });
leadSchema.index({ leadBranch: 1, leadConvertedDate: 1 });
leadSchema.index({ leadBranch: 1, "activityLog.taskTo": 1, "activityLog.followupClosed": 1 });
leadSchema.index({ leadBranch: 1, "paymentHistory.paymentVerified": 1 });
leadSchema.index({ leadBy: 1, leadByModel: 1 });
leadSchema.index({ customerName: 1 });
leadSchema.index({ partner: 1 });
leadSchema.index({ leadBranch: 1, reallocatedTo: 1, leadConfirmed: 1 });
leadSchema.index({ "leadFor.productorServiceId": 1 });
leadSchema.index({
  leadBranch: 1,
  "activityLog.taskTo": 1,
  "activityLog.submittedUser": 1,
  "activityLog.taskallocatedTo": 1,
  "activityLog.allocationChanged": 1,
  "activityLog.allocatedClosed": 1,
  "activityLog.taskClosed": 1,
  "activityLog.followupClosed": 1,
});
leadSchema.index({ "leadFor.productorServiceId": 1, "leadFor.branch_id": 1 });

export default mongoose.model("LeadMaster", leadSchema)
