import mongoose from "mongoose"

const CallRegistrationSchema = new mongoose.Schema(
  {
    customerid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true
    },
    customerName: {
      type: String
    },
    callregistration: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product", // Reference to Product schema
          set: v => (v === "" ? null : v)
        },
        license: Number,
        branchName: [],
        timedata: {
          startTime: Date,
          endTime: Date,
          duration: String,
          token: String,
          time: String
        },
        formdata: {
          incomingNumber: String,
          token: String,
          description: String,
          callnote: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Callnote" // Reference to callnote schema
          },
          solution: String,
          status: String,
          attendedBy: [],
          completedBy: []
        }
      }
    ]
  },
  {
    timestamps: true
  }
)
// References
CallRegistrationSchema.index({ customerid: 1 });
CallRegistrationSchema.index({ customerName: "text" });

// callregistration array fields
CallRegistrationSchema.index({ "callregistration.product": 1 });
CallRegistrationSchema.index({ "callregistration.branchName": 1 });
CallRegistrationSchema.index({ "callregistration.formdata.status": 1 });
CallRegistrationSchema.index({ "callregistration.formdata.attendedBy": 1 });
CallRegistrationSchema.index({ "callregistration.formdata.completedBy": 1 });
CallRegistrationSchema.index({ "callregistration.timedata.startTime": 1 });

export default mongoose.model("CallRegistration", CallRegistrationSchema)
