import mongoose from "mongoose"

const productSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  shortName: { type: String },
  productPrice: { type: Number },
  firstStage: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
  description: { type: String },
  productorservicetype: { type: String, required: true },
  defaultservices: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  serviceid: [{ type: mongoose.Schema.Types.ObjectId, ref: "Service" }],
status:{type:String,enum:["Active","Inactive"]},
  selected: [{
    hsn_id: { type: mongoose.Schema.Types.ObjectId, ref: "Hsn", set: v => (v === "" ? undefined : v) },
    hsnName: { type: String },
    company_id: { type: String, ref: "Company" },
    companyName: { type: String },
    branch_id: {
      type: String
    },
    branchName: { type: String },
    brand_id: { type: mongoose.Schema.ObjectId, ref: "Brand", set: v => (v === "" ? undefined : v) },
    brandName: { type: String },
    category_id: { type: mongoose.Schema.ObjectId, ref: "Category", set: v => (v === "" ? undefined : v) },
    categoryName: { type: String },
  }],
  GSTIN: String
}, { timestamps: true })

// Supports branch/category lookups used by the Own Lead List filters.
productSchema.index({ "selected.branch_id": 1, "selected.category_id": 1 })

export default mongoose.model("Product", productSchema)
