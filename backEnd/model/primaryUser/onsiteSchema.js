import mongoose from "mongoose"
const { Schema } = mongoose

const onsiteSchema = new Schema(
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

    onsiteDate: {
      type: Date,
      required: true
    },
    onsiteType: {
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
    ishaveCompensatory: { type: Boolean, default: false }
  },
  { timestamps: true } // Enables createdAt and updatedAt fields)
)

// Supports the monthly Leave Summary lookup for all staff in a branch.
onsiteSchema.index({ userId: 1, onsiteDate: 1 })

const Onsite = mongoose.model("Onsite", onsiteSchema)

export default Onsite
