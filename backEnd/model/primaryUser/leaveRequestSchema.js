
import mongoose from "mongoose"
const { Schema } = mongoose

const leaveRequestSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff", // Reference to the user who made the request
      required: true
    },
    assignedto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true
    },
    leaveDate: {
      type: Date,
      required: true
    },

    leaveType: {
      type: String,
      enum: ["Half Day", "Full Day"],
      required: true
    },
    leaveCategory: {
      type: String,
      enum: [
        "casual Leave",
        "privileage Leave",
        "compensatory Leave",
        "other Leave"
      ],
      // required: true
    },
    halfDayPeriod: {
      type: String,
      enum: ["Morning", "Afternoon"],
      required: function () {
        return this.leaveType === "Half Day" // Only required if leaveType is Half Day
      }
    },
    reason: {
      type: String,
      required: function () {
        return !this.onsite // `reason` is required only if `onsite` is false
      }
    },
    description: {
      type: String
    },
    onsite: {
      type: Boolean,
      default: false
    },
    onsitestatus: {
      type: String,
      enum: ["Not Approved", "Approved"],
      default: "Not Approved"
    },
    onsiteData: [],

    adminverified: {
      type: Boolean,
      default: false
    },
    departmentverified: { type: Boolean, default: false },
    departmentstatus: {
      type: String,
      enum: ["Not Approved", "Dept Approved", "Dept Rejected"],
      default: "Not Approved"
    },
    hrstatus: {
      type: String,
      enum: ["Not Approved", "HR/Onsite Approved", "HR Rejected"],
      default: "Not Approved"
    },
    cancelstatus: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt fields
  }
)

// Supports the monthly Leave Summary lookup for all staff in a branch.
leaveRequestSchema.index({ userId: 1, leaveDate: 1 })

const LeaveRequest = mongoose.model("LeaveRequest", leaveRequestSchema)

export default LeaveRequest
