import mongoose from "mongoose"

const leadSchema = new mongoose.Schema(
  {
    leadId: { type: String, required: true },
    leadDate: { type: Date },
    customerName: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    mobile: { type: String },
    phone: { type: String },
    email: { type: String },
    location: { type: String },
    pincode: { type: String },
    trade: { type: String },
    partner: { type: mongoose.Schema.Types.ObjectId, ref: " Partner" },
    leadConfirmed: { type: Boolean, default: false },
    leadClosed: { type: Boolean, default: false },
    leadLost: { type: Boolean, default: false },
    leadBranch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    leadFor: [
      {
        productorServiceId: {
          type: mongoose.Schema.Types.ObjectId,
          refpath: "productorServicemodel",
          default: null
        },
        productorServicemodel: { type: String, enum: ["Product", "Service"] },
        licenseNumber: { type: Number },
        price: { type: Number }
      }
    ],

    leadBy: {
      type: mongoose.Schema.Types.ObjectId,
      refpath: "assignedtoleadByModel"
    },
    leadByModel: {
      //this for getting lead done by the user
      type: String,
      enum: ["Staff", "Admin"]
    },
    netAmount: {
      type: Number
    },
    remark: { type: String },
    reallocatedTo: { type: Boolean, default: false },
    activityLog: [{
      submissionDate: { type: Date },
      submittedUser: { type: mongoose.Schema.Types.ObjectId, refpath: "submissiondoneByModel", default: null },
      submissiondoneByModel: { type: String, enum: ["Staff", "Admin"] },
      taskallocatedBy: { type: mongoose.Schema.Types.ObjectId, refpath: "taskallocatedByModel" },
      taskallocatedByModel: { type: String, enum: ["Staff", "Admin"] },
      taskallocatedTo: { type: mongoose.Schema.Types.ObjectId, refpath: "taskallocatedToModel", default: null },
      taskallocatedToModel: { type: String, enum: ["Staff", "Admin"] },
      remarks: { type: String },
      taskBy: { type: String },
      taskTo: { type: String },
      taskDescription: { type: String },
      reallocatedTo: { type: Boolean, default: false },
      taskClosed: { type: Boolean, default: false },
      followupClosed: { type: Boolean },
      allocatedClosed: { type: Boolean, default: false },//block for previously allocated user 
      followUpDate: { type: Date },
      nextFollowUpDate: { type: Date },
      allocationDate: { type: Date },
      taskSubmissionDate: { type: Date },
      taskfromFollowup: { type: Boolean }

    }],
    allocationType: { type: String },
    selfAllocation: { type: Boolean },
    taskfromFollowup: { type: Boolean, default: false }
  },
  { timestamps: true }
)

export default mongoose.model("LeadMaster", leadSchema)
