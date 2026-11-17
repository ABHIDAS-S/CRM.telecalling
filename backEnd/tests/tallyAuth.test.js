import { test } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import tallyAuth from "../middleware/tallyAuthMiddleware.js"

test("Tally authentication fails closed and binds valid keys to configured scope", () => {
  const previousHash = process.env.TALLY_API_KEY_SHA256
  const key = "test-only-key-with-more-than-32-characters"
  const invoke = supplied => {
    const req = { get: () => supplied, body: { sourceCompanyId: "untrusted" } }
    const result = { next: false }
    const res = { status(code) { result.status = code; return this }, json(body) { result.body = body; return this } }
    tallyAuth(req, res, () => { result.next = true })
    return { ...result, scope: req.tallyIntegration }
  }
  try {
    delete process.env.TALLY_API_KEY_SHA256
    assert.equal(invoke(key).status, 503)
    process.env.TALLY_API_KEY_SHA256 = createHash("sha256").update(key).digest("hex")
    for (const invalid of [undefined, "", "short", "x".repeat(40), "x".repeat(513)]) {
      const result = invoke(invalid)
      assert.equal(result.status, 401)
      assert.equal(result.next, false)
    }
    assert.deepEqual(invoke(key), { next: true, scope: { sourceCompanyId: "camet-tally" } })
  } finally {
    if (previousHash === undefined) delete process.env.TALLY_API_KEY_SHA256
    else process.env.TALLY_API_KEY_SHA256 = previousHash
  }
})
