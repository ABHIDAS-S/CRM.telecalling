# Tally customer integration

## 1. Configuration

Set backend environment variables (never frontend variables):

- `MONGO_URI`: existing CRM MongoDB connection, also used by the worker.
- `TALLY_API_KEY_SHA256`: SHA-256 hexadecimal hash of a random API key (generate at least 32 random bytes).

Give the original key securely to the Tally sender. Store only its hash in backend configuration. Never log keys or commit them. Deploy over HTTPS. Rotate/revoke by replacing/removing the hash and restarting the backend. One source company is supported; multiple sources require separate credentials and access mappings.

Start the existing API normally. In a separate process, from `backEnd`, run `npm run worker:tally`. Keep both services running under your deployment process manager. Jobs and checkpoints are stored in MongoDB; Redis is not required. Required indexes are created before uploads/processing. Provision them before high-volume rollout if the collection already contains data. No live configuration or database was changed during implementation.

## 2. Customer matching

Only the eight agreed fields are accepted: `Customer`, `Address`, `Contactperson`, `ContactNumber`, `Mobilenumber`, `Emailid`, `Tallyserialno`, and `Gstno`. No externalCustomerId is required or accepted.

Match on the exact combination of `Customer` + `Tallyserialno` + `Mobilenumber`, after trimming leading/trailing whitespace. All three must be non-empty strings. A matching combination updates address, email, contact person, contact number and GST. Changing any matching field creates a new record and retains the old one, as agreed. Case, internal whitespace and phone formatting are preserved and therefore significant; no automatic fuzzy merging occurs.

Many customers can share a Tally serial number. A unique compound database index on the internal company namespace and all three matching fields prevents duplicate matches. The company namespace is fixed internally; no company header/environment setting is required. If pre-existing data has duplicate matching combinations, index creation fails safely; reconcile those records before rollout instead of silently deleting data. This implementation does not automatically migrate or delete existing duplicates. Old externalCustomerId metadata/indexes can remain in MongoDB but are no longer used by this importer.

## 3. Stream an upload

Verify credentials: `GET /api/integrations/tally/v1/status`, header `X-Tally-API-Key: <original-key>`.

Submit `POST /api/integrations/tally/v1/imports` with:

```text
Content-Type: application/json
X-Tally-API-Key: <original-key>
# Optional retry headers (provide both together):
Idempotency-Key: <unique-id-for-this-sync-run>
X-Content-SHA256: <sha256-of-exact-body-bytes>
```

Only `X-Tally-API-Key` is required as a custom header. Content-Type still describes the body. If retry headers are omitted, the server generates an import ID and calculates the checksum; repeated uploads still upsert by the three matching fields, but create separate import jobs. If supplying `Idempotency-Key`, also supply `X-Content-SHA256` to bind retries to content.

The recommended body is a data wrapper: {"data": [customer objects]}. A single object in {"data": {...}} is also accepted. Only the data property is allowed at the wrapper level. Direct customer objects and direct arrays remain supported. Large arrays are parsed incrementally and split into batches without buffering the entire array. NDJSON is also supported for existing senders using Content-Type: application/x-ndjson. Example application/json payload for the Tally team:

```json
{
  "data": [
    {
      "Customer": "ABC Traders",
      "Address": "Kochi, Kerala",
      "Contactperson": "Ravi Kumar",
      "ContactNumber": "04840001234",
      "Mobilenumber": "9876543210",
      "Emailid": "accounts@example.com",
      "Tallyserialno": "000123456",
      "Gstno": "32ABCDE1234F1Z5"
    }
  ]
}
```

All fields must be strings. `Customer`, `Tallyserialno` and `Mobilenumber` must be non-empty. Other fields may be omitted and become empty strings: each line replaces the complete business-field values, not a partial patch. An empty string clears a field. Unknown fields, including company overrides, are rejected. Email receives basic structural validation if present. Phone numbers are preserved without assuming one country's format.

Limits: 512 MiB per upload, 1,000,000 rows, 16 KiB per customer record, 500 rows per batch. Fields also have length limits. Compressed uploads are unsupported. One active import per source company provides backpressure; overlapping uploads return 409. Configure the reverse proxy to allow this route's body size and upload duration. Normal Express JSON parsing is bypassed. Standard JSON arrays are accepted directly; XML requires an adapter. Tally custom JSON mapping depends on the installed version and sender/TDL configuration.

Checksum covers exact bytes, including UTF-8 encoding and line endings. Invalid records or mismatched checksums fail the entire upload before any customer writes. Already-staged batches are temporary and never processed for a failed upload. The response is sent only after the entire upload is stored and validated; network/proxy upload timeouts still apply.

## 4. Retry and progress

Successful upload returns 202 with `id`, `status`, `total`, `processed`, `batchCount`, and `completedBatches`. This means queued, not finished. Poll `GET /api/integrations/tally/v1/imports/:id` with the same API key.

| HTTP status | Meaning |
| --- | --- |
| 200 | Status/read or existing import replay |
| 202 | Upload accepted durably |
| 400 | Invalid headers or identifier |
| 401 | Missing/invalid key |
| 409 | Active import, existing upload in progress, or idempotency conflict |
| 413 | Byte/line/row limit exceeded |
| 415 | Unsupported format/encoding |
| 422 | Invalid row, empty upload, or checksum mismatch |
| 503 | Configuration/database temporarily unavailable |

On network error, retry the SAME sync with the same idempotency key/checksum. Matching existing jobs are returned; changed content under the same key returns 409. An upload already in progress returns its job ID with 409: poll instead of repeatedly sending the body. A failed/interrupted upload requires a NEW idempotency key when resubmitted. Back off on temporary errors/active imports; correct validation failures first.

The worker bulk-upserts each batch and checkpoints only after success. Crash/retry replays writes safely. Duplicate matching combinations resolve to the last row in upload order. `processed` counts input rows, not distinct customers or inserts. Generation/batch checks prevent stale workers overwriting newer data. Temporary writes retry up to five claims; persistent failures mark the job failed. Earlier successful batches remain applied. Resending corrected data with a new key updates those rows safely.

Abandoned uploads fail after 30 minutes without a staged-batch heartbeat. Worker leases expire after five minutes for crash recovery. Temporary batch payloads expire after seven days; expired payloads require resubmission. Job metadata is retained for status/idempotency; plan a metadata archival policy if indefinite retention is unsuitable.

## 5. Customer report

Open `/admin/reports/customer-contacts`: eight business columns including GST number, pages of 50, exact serial filtering, latest ten imports in expandable sync activity, and five-second progress polling. Refresh customer rows after completion. API access requires a valid CRM JWT and an existing account in the Admin or Staff collection with database role `Admin`. This version exposes the single configured source to CRM administrators; it does not grant staff or multi-tenant access.

Endpoints: `GET /api/reports/tally-customers?limit=50&after=<cursor>&serial=<exact-serial>` and `GET /api/reports/tally-customers/imports`.

This is upsert sync, not snapshot replacement: customers absent from later uploads remain, and the report may show partially applied imports. It does not delete operational CRM customers, modify call data, or merge by phone/name alone. Confirm full-snapshot/deletion semantics before adding reconciliation or atomic snapshot activation.

## 6. Verification and rollout

From `backEnd`: `npm run test:tally`. Tests use a separate temporary MongoDB instance, not `MONGO_URI`. Set `MONGOD_BINARY` for installations outside the default Windows path. Coverage includes batches, repeated syncs, validation, checksums, idempotency, access control, cursors, partial-write recovery, and stale writes. From `frontend`: `npm run build`.

Before production, obtain source samples using the agreed three-field matching rule, configure credentials, start the worker, and test representative lakh-scale imports on staging while measuring memory, throughput, database latency, and CRM response times. The automated test uses 1,001 rows to cross batch boundaries; it is not a production capacity benchmark.
