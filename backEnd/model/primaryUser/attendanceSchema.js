import mongoose from "mongoose"
const { Schema } = mongoose

const attendanceSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff", // Reference to the user who made the request
      required: true
    },
 
    misspunchVerified: { type: Boolean, default: false },
    attendanceId: {
      type: Number,
      required: true
    },

    attendanceDate: {
      type: Date,
      required: true
    },
    attendanceType: {
      type: String,
      enum: ["Half Day", "Full Day"]
    },
    halfDayPeriod: {
      type: String,
      enum: ["Morning", "Afternoon"],
      required: function () {
        return this.attendaneType === "Half Day" // Only required if leaveType is Half Day
      }
    },
    inTime: {
      type: String
    },
    edited: {
      type: Boolean,
      default: false
    },
    excel: {
      type: Boolean,
      default: false
    },
    description: {
      type: String
    },
    onsiteData: [],
    adminverified: {
      type: Boolean,
      default: false
    },
    rejected: {
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
    outTime: {
      type: String
    }
  },
  { timestamps: true } // Enables createdAt and updatedAt fields)
)

// Supports the monthly Leave Summary lookup for all staff in a branch.
attendanceSchema.index({ userId: 1, attendanceDate: 1 })

const Attendance = mongoose.model("Attendance", attendanceSchema)

export default Attendance
