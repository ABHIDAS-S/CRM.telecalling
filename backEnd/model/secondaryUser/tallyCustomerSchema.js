import mongoose from "mongoose"

const TallyCustomerSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    Address: { type: String, trim: true, default: "" },
    address2: { type: String, trim: true, default: "" },
    address3: { type: String, trim: true, default: "" },
    tin: { type: String, trim: true, default: "" },
    location: { type: String, trim: true, default: "" },
    State: { type: String, trim: true, default: "" },
    Country: { type: String, trim: true, default: "" },
    Pincode: { type: String, trim: true, default: "" },
    Company: { type: String, trim: true, default: "" },
    Contactperson: { type: String, trim: true, default: "" },
    ContactNumber: { type: String, trim: true, default: "" },
    Mobilenumber: { type: String, trim: true, default: "" },
    Emailid: { type: String, trim: true, default: "" },
    Tallyserialno: { type: String, trim: true },
    Gstno: { type: String, trim: true, default: "" },

    // Internal single-company namespace; not supplied in the request.
    // sourceCompanyId must identify the source company across integrations.
    sourceCompanyId: { type: String, trim: true, minlength: 1 },
    syncGeneration: { type: Number, default: 0 },
    syncBatch: { type: Number, default: 0 },
    lastImportId: { type: mongoose.Schema.Types.ObjectId },
  },
  { timestamps: true, strict: "throw", collection: "tallyCustomers" }
)

TallyCustomerSchema.index({ sourceCompanyId: 1, _id: 1 })
TallyCustomerSchema.index(
  { sourceCompanyId: 1, name: 1, Mobilenumber: 1 },
  { unique: true, name: "tally_customer_name_mobile", partialFilterExpression: { name: { $gt: "" } } }
)

// Retain the indexes for legacy serial-based imports.
TallyCustomerSchema.index({ sourceCompanyId: 1, Tallyserialno: 1, _id: 1 })

// Database enforcement keeps repeat and concurrent syncs duplicate-safe.
TallyCustomerSchema.index(
  { sourceCompanyId: 1, Customer: 1, Tallyserialno: 1, Mobilenumber: 1 },
  {
    unique: true,
    name: "tally_customer_match",
    partialFilterExpression: {
      sourceCompanyId: { $type: "string" },
      Customer: { $type: "string" },
      Tallyserialno: { $type: "string" },
      Mobilenumber: { $type: "string" },
    },
  }
)

export default mongoose.model("TallyCustomer", TallyCustomerSchema)
