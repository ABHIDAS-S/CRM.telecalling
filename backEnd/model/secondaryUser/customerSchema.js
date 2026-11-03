


import mongoose from "mongoose";

const toNullableNumber = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "string" && v.trim() === "") return null;

  const num = Number(v);
  return Number.isNaN(num) ? null : num;
};

const toZeroNumber = (v) => {
  if (v === "" || v === null || v === undefined) return 0;
  const num = Number(v);
  return Number.isNaN(num) ? 0 : num;
};

const LicenseNumberItemSchema = new mongoose.Schema(
  {
    licenseNumber: {
      type: Number,
      default: null,
      set: toNullableNumber,
    },
    productorServiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    productorServiceName: {
      type: String,
      trim: true,
      default: "",
    },
    sourceIndex: {
      type: Number,
      default: undefined,
    },
  },
  { _id: false }
);

const TaggedDataSchema = new mongoose.Schema(
  {
    licensenumber: {
      type: Number,
      default: null,
      set: toNullableNumber,
    },
    nextDue: {
      type: Date,
      default: null,
    },

    productAmount: {
      type: Number,
      default: 0,
      set: toZeroNumber,
    },

    taxinclusiveamount: {
      type: Number,
      default: 0,
      set: toZeroNumber,
    },

    taxexclusiveAmount: {
      type: Number,
      default: 0,
      set: toZeroNumber,
    },

    discountAmount: {
      type: Number,
      default: 0,
      set: toZeroNumber,
    },

    hsn: {
      type: Number,
      default: 0,
      set: toZeroNumber,
    },

    noofusers: {
      type: Number,
      default: 0,
      set: toZeroNumber,
    },

    serialNumber: {
      type: String,
      default: null,

    },

    nextDueAmount: {
      type: Number,
      default: 0,
      set: toZeroNumber,
    },

    originalHsn: {
      type: Number,
      default: 0,
      set: toZeroNumber,
    },

    leadAmount: {
      type: Number,
      default: 0,
      set: toZeroNumber,
    },

    totalleadAmount: {
      type: Number,
      default: 0,
      set: toZeroNumber,
    },

    totalnextDueAmount: {
      type: Number,
      default: 0,
      set: toZeroNumber,
    },

    leadTax: {
      type: Number,
      default: 0,
      set: toZeroNumber,
    },

    nextDueTax: {
      type: Number,
      default: 0,
      set: toZeroNumber,
    },
  },
  { _id: false }
);

const SelectedItemSchema = new mongoose.Schema(
  {
    company_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      default: null,
    },

    companyName: {
      type: String,
      trim: true,
      default: "",
    },

    createdFrom: {
      type: String,
      trim: true,
      default: "",
    },

    productAddedDate: {
      type: Date,
      default: null,
    },

    branch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
    },

    branchName: {
      type: String,
      trim: true,
      default: "",
    },

    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    productName: {
      type: String,
      trim: true,
      default: "",
    },

    brandName: {
      type: String,
      trim: true,
      default: "",
    },

    categoryName: {
      type: String,
      trim: true,
      default: "",
    },

    licensenumber: {
      type: Number,
      default: null,
      set: toNullableNumber,
    },

    noofusers: {
      type: Number,
      default: 0,
      set: toZeroNumber,
    },

    version: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },

    customerAddDate: {
      type: Date,
      default: null,
    },

    applicationDate: {
      type: Date,
      default: null,
    },

    nextDue: {
      type: Date,
      default: null,
    },

    licenseNumbers: {
      type: [LicenseNumberItemSchema],
      default: [],
    },

    taggeddata: {
      type: [TaggedDataSchema],
      default: [],
    },
    previousTaggedData: [],

    amcstartDate: {
      type: Date,
      default: null,
    },

    amcendDate: {
      type: Date,
      default: null,
    },

    amcAmount: {
      type: Number,
      default: null,
      set: toNullableNumber,
    },

    amcDescription: {
      type: String,
      trim: true,
      default: "",
    },

    licenseExpiryDate: {
      type: Date,
      default: null,
    },

    productAmount: {
      type: Number,
      default: null,
      set: toNullableNumber,
    },

    productPrice: {
      type: Number,
      default: null,
      set: toNullableNumber,
    },

    taxAmount: {
      type: Number,
      default: null,
      set: toNullableNumber,
    },

    hsn: {
      type: Number,
      default: null,
      set: toNullableNumber,
    },

    productamountDescription: {
      type: String,
      trim: true,
      default: "",
    },

    tvuexpiryDate: {
      type: Date,
      default: null,
    },

    tvuAmount: {
      type: Number,
      default: null,
      set: toNullableNumber,
    },

    tvuamountDescription: {
      type: String,
      trim: true,
      default: "",
    },

    isActive: {
      type: String,
      trim: true,
      enum: ["Running", "Deactive"],
      default: "Running",
    },

    reasonofStatus: {
      type: String,
      trim: true,
      default: "",
    },

    softwareTrade: {
      type: String,
      trim: true,
      default: "",
    },

    taggedLicenses: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      default: [],
    },

    taggedLicenseDueDates: {
      type: Map,
      of: Date,
      default: {},
    },

    productorservicetype: {
      type: String,
      trim: true,
      default: "",
    },

    parentPrimaryProductId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },

    isDefaultService: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const CustomerSchema = new mongoose.Schema(
  {
    customerName: {
      type: mongoose.Schema.Types.Mixed,
    },

    address1: {
      type: String,
      trim: true,
      default: "",
    },

    address2: {
      type: String,
      trim: true,
      default: "",
    },

    country: {
      type: String,
      trim: true,
      default: "",
    },

    registrationType: {
      type: String,
      trim: true,
      default: "",
    },

    gstNo: {
      type: String,
      trim: true,
      default: "",
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    pincode: {
      type: String,
      trim: true,
      default: "",
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    incomingNumber: {
      type: String,
      trim: true,
      default: "",
    },

    mobile: {
      type: String,
      trim: true,
      default: "",
    },

    landline: {
      type: String,
      trim: true,
      default: "",
    },

    industry: {
      type: String,
      trim: true,
      default: "",
    },

    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      default: null,
      set: (v) => (v === "" ? null : v),
    },

    isPartner: {
      type: Boolean,
      default: false,
    },

    partnerSelection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null,
      set: (v) => (v === "" ? null : v),
    },

    contactPerson: {
      type: String,
      trim: true,
      default: "",
    },

    isActive: {
      type: String,
      trim: true,
      enum: ["Running", "Deactive"],
      default: "Running",
    },

    selected: {
      type: [SelectedItemSchema],
      default: [],
    },

    createdFrom: {
      type: String,
      trim: true,
      default: "",
    },

    callregistration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CallRegistration",
      default: null,
    },
  },
  { timestamps: true }
);

CustomerSchema.index({ mobile: 1, email: 1 });
CustomerSchema.index({ gstNo: 1 });
CustomerSchema.index({ customerName: "text" });
CustomerSchema.index({ partner: 1 });
CustomerSchema.index({ callregistration: 1 });
CustomerSchema.index({ "selected.licensenumber": 1 });
CustomerSchema.index({ "selected.company_id": 1 });
CustomerSchema.index({ "selected.branch_id": 1 });
CustomerSchema.index({ "selected.product_id": 1 });
CustomerSchema.index({
  "selected.isActive": 1,
  "selected.licenseExpiryDate": 1,
});
CustomerSchema.index({
  "selected.amcstartDate": 1,
  "selected.amcendDate": 1,
});
CustomerSchema.index({ "selected.tvuexpiryDate": 1 });

export default mongoose.model("Customer", CustomerSchema);
