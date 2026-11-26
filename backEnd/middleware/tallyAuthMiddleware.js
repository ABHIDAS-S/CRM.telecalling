import { createHash, timingSafeEqual } from "node:crypto"
import { TALLY_COMPANY } from "../config/tally.js"

export default function tallyAuthMiddleware(req, res, next) {
  const keyHash = process.env.TALLY_API_KEY_SHA256 || ""
  if (!/^[a-f0-9]{64}$/i.test(keyHash)) {
    return res.status(503).json({ message: "Tally integration is not configured." })
  }

  const supplied = req.get("X-Tally-API-Key")
  if (typeof supplied !== "string" || supplied.length < 32 || supplied.length > 512) {
    return res.status(401).json({ message: "Unauthorized Tally request." })
  }
  const suppliedHash = createHash("sha256").update(supplied).digest()
  if (!timingSafeEqual(Buffer.from(keyHash, "hex"), suppliedHash)) {
    return res.status(401).json({ message: "Unauthorized Tally request." })
  }

  // Scope comes from server configuration, never from the request payload.
  req.tallyIntegration = { sourceCompanyId: TALLY_COMPANY }
  next()
}
