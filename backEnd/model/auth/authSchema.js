import mongoose from "mongoose"
import bcrypt from "bcrypt"

const { Schema } = mongoose

const staffSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "name is required"]
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [/\S+@\S+\.\S+/, "Please use a valid email address"]
    },
    mobile: {
      type: String,

      match: /^[0-9]{10}$/ // Example for a 10-digit Indian number
    },
    passwordExpiryAt: { type: Date },

    password: {
      type: String,

      required: [true, "Password is required"]
    },
    role: {
      type: String
    },
    activeRole: { type: String },
    privilegeleavestartsfrom: {
      type: String
    },
    casualleavestartsfrom: {
      type: String
    },
    sickleavestartsfrom: {
      type: String
    },

    isVerified: {
      type: Boolean,
      default: true
    },
    dateofbirth: {
      type: String
    },
    bloodgroup: {
      type: String
    },
    gender: {
      type: String
    },
    address: {
      type: String
    },
    country: {
      type: String
    },
    state: {
      type: String
    },
    pincode: {
      type: String
    },
    joiningdate: {
      type: String
    },
    designation: {
      type: String
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: false, // This makes it optional
      default: null
    },
    assignedto: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "assignedtoModel" // Reference model is dynamically set
    },
    assignedtoModel: {
      type: String,
      enum: ["Staff", "Admin"] // Only these two models are allowed
    },
    profileUrl: {
      type: [String]
    },
    documentUrl: {
      type: [String]
    },
    attendanceId: { type: Number, unique: true, index: true },
    callstatus: {
      totalCall: { type: Number, default: 0 },
      solvedCalls: { type: Number, default: 0 },
      colleagueSolved: { type: Number, default: 0 },
      pendingCalls: { type: Number, default: 0 },
      totalDuration: { type: Number, default: 0 }
    },
    permissions: [
      {
        Company: Boolean,
        Branch: Boolean,
        Customer: Boolean,
        CallNotes: Boolean,
        UsersAndPasswords: Boolean,
        MenuRights: Boolean,
        Services: Boolean,
        VoucherMaster: Boolean,
        Target: Boolean,
        Product: Boolean,
        Inventory: Boolean,
        Partners: Boolean,
        Department: Boolean,
        Brand: Boolean,
        Category: Boolean,
        HSN: Boolean,
        Lead: Boolean,
        LeadAllocation: Boolean,
        LeadFollowUp: Boolean,
        LostLeads: Boolean,
        OwnLead: Boolean,
        CallRegistration: Boolean,
        SupportDepartment: Boolean,
        FollowupSummary: Boolean,
        ProductWiseReport: Boolean,
        SalesFunnel: Boolean,
        IncentiveReport: { type: Boolean, default: false },
        ClosedLeads: Boolean,
        LeaveApplication: { type: Boolean, default: true },
        SignUpCustomer: Boolean,
        ProductMerge: Boolean,
        ProductAllocationPending: Boolean,
        LeaveApprovalPending: Boolean,
        WorkAllocation: Boolean,
        ExcelConverter: Boolean,
        Summary: Boolean,
        ExpiryRegister: Boolean,
        DailyStaffActivity: Boolean,
        ExpiredCustomerCalls: Boolean,
        CustomerCallsSummary: Boolean,
        CustomerContacts: Boolean,
        CustomerActionSummary: Boolean,
        AccountSearch: Boolean,
        LeaveSummary: Boolean,
        TaskAnalysis: Boolean,
        TaskLevel: Boolean,
        LeadReallocation: Boolean,
        Employee: Boolean,
        ProductandServices: Boolean,
        CollectionUpdate: Boolean
      }

    ],
    permissionLevel: [
      {
        level1: { type: Boolean, default: true },
        level2: Boolean
      }
    ],
    selected: [
      {
        company_id: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
        companyName: { type: String },
        branch_id: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
        branchName: { type: String }
      }
    ]
    // Other staff-specific fields
  },
  { timestamps: true }
)

const adminSchema = new Schema(
  {
    name: {
      type: String
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [/\S+@\S+\.\S+/, "Please use a valid email address"]
    },

    mobileno: {
      type: String,

      match: /^[0-9]{10}$/ // Example for a 10-digit Indian number
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: false, // This makes it optional
      default: null
    },
    password: {
      type: String,
      required: [true, "Password is required"]
    },
    passwordExpiryAt: { type: Date },
    role: {
      type: String,
      required: [true, "Role is required"],
      enum: ["Staff", "Admin"]
    },
    activeRole: { type: String },
    verified: {
      type: Boolean,
      default: false
    },
    callstatus: {
      totalCall: { type: Number, default: 0 },
      solvedCalls: { type: Number, default: 0 },
      colleagueSolved: { type: Number, default: 0 },
      pendingCalls: { type: Number, default: 0 },
      totalDuration: { type: Number, default: 0 }
    }
    // Other admin-specific fieldss
  },
  { timestamps: true }
)

// Pre-save hook for password hashing
staffSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next()
  }
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

adminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next()
  }
  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})
// Create models
const Staff = mongoose.model("Staff", staffSchema)
const Admin = mongoose.model("Admin", adminSchema)
// Ensure indexes are created when the application starts
const ensureIndexes = async () => {
  try {
    await Staff.createIndexes()
    await Admin.createIndexes()
  } catch (error) {
    console.error("Error creating indexes:", error)
  }
}

// Call this function after connecting to MongoDB
export { ensureIndexes }

export default {
  Staff,
  Admin
}
