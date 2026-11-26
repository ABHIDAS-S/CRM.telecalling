import dotenv from "dotenv"
import mongoose from "mongoose"
import { startTallyWorker } from "./services/tallyWorker.js"

dotenv.config()
if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required")
await mongoose.connect(process.env.MONGO_URI)
console.log("Tally import worker connected")
startTallyWorker()
// On process termination MongoDB leases allow another worker to resume safely.
