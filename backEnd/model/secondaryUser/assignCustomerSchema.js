import mongoose from "mongoose"

const schema = new mongoose.Schema({
  _id: { type: mongoose.Schema.Types.ObjectId, ref: "TallyCustomer" },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, required: true },
}, { timestamps: true, collection: "assigncustomer" })

export default mongoose.model("AssignCustomer", schema)
