import mongoose from "mongoose"

const jobSchema = new mongoose.Schema({
  sourceCompanyId: { type: String, required: true },
  requestId: { type: String, required: true },
  checksum: { type: String, required: true },
  generation: { type: Number, required: true },
  active: { type: Boolean, default: true },
  status: { type: String, enum: ["uploading", "queued", "processing", "completed", "failed"], default: "uploading" },
  total: { type: Number, default: 0 },
  processed: { type: Number, default: 0 },
  batchCount: { type: Number, default: 0 },
  nextBatch: { type: Number, default: 0 },
  attempts: { type: Number, default: 0 },
  leaseToken: String,
  leaseUntil: Date,
  heartbeatAt: { type: Date, default: Date.now },
  error: String,
}, { timestamps: true })
jobSchema.index({ sourceCompanyId: 1, requestId: 1 }, { unique: true })
jobSchema.index({ sourceCompanyId: 1, active: 1 }, { unique: true, partialFilterExpression: { active: true } })
jobSchema.index({ status: 1, leaseUntil: 1, createdAt: 1 })
jobSchema.index({ sourceCompanyId: 1, createdAt: -1 })

const batchSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, required: true },
  sequence: { type: Number, required: true },
  records: { type: [mongoose.Schema.Types.Mixed], required: true },
  expiresAt: { type: Date, required: true },
})
batchSchema.index({ jobId: 1, sequence: 1 }, { unique: true })
batchSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const sequenceSchema = new mongoose.Schema({ _id: String, value: { type: Number, default: 0 } })
export const TallyImport = mongoose.model("TallyImport", jobSchema)
export const TallyBatch = mongoose.model("TallyBatch", batchSchema)
export const TallySequence = mongoose.model("TallySequence", sequenceSchema)
