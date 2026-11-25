import mongoose from "mongoose"

export const callOutcomes = [
  "Interested", "Not Interested", "Callback Requested", "Follow-up Needed",
  "Switched Off", "Unreachable", "Busy", "No Answer", "Wrong Number",
  "Convert to Lead",
]

const schema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "TallyCustomer", required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
  outcome: { type: String, enum: callOutcomes, required: true },
  followUpDate: { type: Date, default: null },
  primeAttention: { type: Boolean, default: false },
  remarks: { type: String, trim: true, maxlength: 4000, default: "" },
}, { timestamps: true, collection: "customercall" })

schema.index({ staffId: 1, outcome: 1, _id: -1 })

export default mongoose.model("CustomerCall", schema)
