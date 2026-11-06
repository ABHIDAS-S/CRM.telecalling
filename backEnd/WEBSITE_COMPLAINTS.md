# Website complaint registration

The contact page's **Raise a Complaint** button opens an independent form. Existing contact email submission and staff CRM registration are unchanged.

Flow: licence lookup → send OTP to the CRM customer's registered email → verify OTP → contact number, CRM call notes and description → pending CRM call registration → notification to Camet.

## Backend configuration

Camet `backend/.env`:

```dotenv
CRM_COMPLAINT_API_URL=http://127.0.0.1:9000/api/website-complaints
CAMET_COMPLAINT_API_KEY=<same private random key as CRM, at least 32 characters>
```

CRM `backEnd/.env`:

```dotenv
CAMET_COMPLAINT_API_KEY=<same private random key as Camet>
COMPLAINT_BRANCH_NAME=CAMET
COMPLAINT_NOTIFY_EMAIL=Admin@camet.in
```

The installer uses the CRM's actual local PORT and Camet's CONTACT_EMAIL_TO if set. Both keys stay in backend environment files. They must never be added to VITE environment variables. Existing secrets are not printed.

Email uses the configured CAMET branch's `notificationemail` and `mailpassword`. Alternatively set the separate CRM variables `COMPLAINT_SMTP_USER`, `COMPLAINT_SMTP_PASS`, optional `COMPLAINT_SMTP_HOST`, and `COMPLAINT_SMTP_PORT` (default 587). With no host, Gmail is used. TLS certificate validation remains enabled. The branch must exist for call routing.

For production, configure the Camet backend URL to the CRM's HTTPS API endpoint and put the matching private key in both hosting environments. Restart/redeploy both backends after environment changes. No public browser-to-CRM CORS change is needed. For multiple Camet backend instances, use a shared gateway rate limit in addition to the CRM's database-backed OTP limits. Express's default direct IP is used by the public limiter; configure trusted proxy hops for the actual hosting setup before relying on per-client IP limits behind a proxy.

## CRM changes

New controller, routes, email helper, verification/rate-limit models, tests, and two server lines mounting `/api/website-complaints`. The existing CallRegistration schema **already makes product optional**. Website complaints omit product through a dedicated endpoint; no global validation relaxation or existing staff controller change is needed.

Records append to `CallRegistration.callregistration`, use `pending`, route to CAMET, preserve customer history, and leave staff counters untouched because no staff member has attended the complaint yet. Descriptions start with `[Website complaint]`. Staff may select a product during their normal follow-up. Existing reports may require a selected product or staff attendance for their own totals; the pending-call list and customer history can show these unassigned calls.

The OTP expires in 10 minutes, allows five guesses, and can be used once. A verification grants 15 minutes to submit. Resending invalidates earlier unverified codes. OTP email is limited to one per customer per minute and five per hour. Only OTP hashes and verification-token hashes are stored. Temporary records expire after 24 hours. The public API returns a masked email, never full customer details before verification.

Each verification creates at most one complaint. Network retries reuse the same reference and cannot overwrite the saved payload. If notification fails, the complaint remains saved and the form offers **Retry email notification**. Failed notification status is stored on the verification record; there is no background email worker. Do not assume a failed email means the complaint was not saved.

## Verification

- Camet: `node --test backend/tests/complaints.test.js`
- CRM from backEnd: `node --test tests/websiteComplaint.test.js` (set MONGOD_BINARY if mongod is not on PATH).
- Frontend: `npm run build` and targeted ESLint on `src/components/ComplaintRegistration.jsx`.

CRM tests start a separate temporary MongoDB instance and inject a fake mailbox. They do not load application environment files, connect to the running database, or send real emails.

After deployment, verify with a known customer: check licence → receive OTP → verify → select note → submit → check pending call and customer history → confirm Camet email. A real mailbox delivery check requires the configured CRM mailbox and an actual registered customer; automated tests deliberately avoid that live write.
