# Lead assignment corrections

The incentive leads modal now has an Edit action on desktop rows and mobile cards.
The editor loads individual `activityLog` records and eligible users on demand,
allows one replacement, and refreshes the modal and parent report after saving.

## API contract

Both routes use the existing `jwt_primary` cookie authentication:

- `GET /api/target/leads/:leadId/assignments`
- `PATCH /api/target/leads/:leadId/assignments/:assignmentId`

`leadId` is the MongoDB lead `_id` (`leadMongoId` in incentive details).
`assignmentId` is the persistent `activityLog._id`, never the task type ID.

GET returns `{ success: true, data: { assignments, users } }`. Each assignment
contains `assignmentId`, `label`, `assignedUserName`, `incentiveUserName`, `date`,
`completed`, and `expected`. Each user contains only `userId`, `name`, and `model`.
Send the selected record's **unchanged `expected` object** back in PATCH:

```json
{
  "userId": "333333333333333333333333",
  "userModel": "Staff",
  "expected": {
    "assignedUserId": "222222222222222222222222",
    "assignedUserModel": "Staff",
    "incentiveUserId": null,
    "incentiveUserModel": null,
    "revision": 0
  }
}
```

Success returns `{ success: true, data: { changed: true }, message }`.
Choosing the current assignee returns `changed: false` without writing an audit.
Validation errors use 400, missing authentication 401, forbidden access 403,
missing lead/record 404, stale snapshots 409, and unexpected server errors 500.
A duplicate submission with an old snapshot receives 409 and performs no second
write. Reload before retrying a conflict; do not silently overwrite it.

`getIncentiveLeads` also returns `data.canEditAssignments` so the UI can hide
editing for users without permission. Both new endpoints independently enforce
authorization; this UI capability flag is not a security boundary.

## Ownership and access

- Actor identity comes from the JWT and permissions are reloaded from the database.
- The existing Admin model has no tenant/branch membership: Admin-role accounts
  retain application-wide access. If a JWT carries `cmp_id`, that company scope is
  enforced. This does not introduce tenant-specific admin ownership.
- Staff need `role: Staff`, `isVerified: true`, `LeadReallocation: true`, and one
  `selected` entry matching both the lead branch and its actual company.
- Replacement staff must be verified and have the same company/branch membership.
  Admin-role accounts remain eligible under the existing global-admin model.
- The existing generic user endpoint returns unrestricted user documents, so the
  editor uses a scoped, minimal user list returned with its assignment details.

The update changes only the selected record's assignee/model, its explicit
incentive-owner override/model, and correction revision, plus lead audit metadata.
`submittedUser` remains the original historical submitter. Both incentive
calculation paths use the explicit correction when present, otherwise retain
their original submitter-based behavior. Amounts, completion flags, dates,
other records, and incentive formulas are unchanged. Existing reward
deduplication by configuration/lead/user/allocation is retained; with repeated
allocation types, moving a record between users can change deduplication outcomes.

An atomic conditional MongoDB update matches the subdocument ID, old owner/model,
old override/model, and revision and appends `assignmentCorrections` on the same
lead. No multi-document transaction is needed. Missing revisions are treated as
zero, so existing records need no migration. Historical records lacking persistent
subdocument IDs are not exposed for editing.

## Files

- `controller/primaryUserController/leadAssignmentController.js`: scoped GET/PATCH.
- `routes/primaryUserRoutes/targetRoutes.js`: authenticated routes.
- `model/primaryUser/leadmasterSchema.js`: correction fields and audit schema.
- `helper/incentiveOwner.js`: shared ownership fallback.
- `controller/primaryUserController/targetController.js`: incentive ownership and UI capability.
- `../frontend/src/components/primaryUser/LeadAssignmentEditor.jsx`: editor and error recovery.
- `../frontend/src/components/primaryUser/IncentiveLeadsModal.jsx`: desktop/mobile edit actions.
- `../frontend/src/components/primaryUser/IncentiveReport.jsx`: parent refresh and filter-scoped modal lifecycle.
- `tests/leadAssignment.test.js`: isolated MongoDB/API regression tests.
- `../frontend/tests/assignment-editor.html` and `.jsx`: browser smoke-test fixture with mock API responses.

## Verification

From `backEnd`, run `node --test tests/leadAssignment.test.js`. Tests launch their
own disposable local MongoDB process and never load application database settings.
Install MongoDB locally or set `MONGOD_BINARY` to an existing executable to run.

Eight integration tests passed: authentication/permissions, company/branch scope,
eligible-user filtering, duplicate-task identity and isolated updates, concurrent
and duplicate saves, no-op saves, invalid references, and incentive report/detail
ownership transfer with the original submitter preserved.

The changed frontend components pass ESLint, and the Vite production build passes.
Existing build warnings remain for duplicate JSX/object keys in unrelated files,
old Browserslist data, and large bundles.

For browser verification, run Vite and open `/tests/assignment-editor.html`.
The fixture intercepts every API request and never touches application data.
Add `?failure=network` or `?failure=conflict` to simulate one failed save.
Desktop and 390px mobile checks passed for Edit, unchanged-selection disabling,
successful save, parent refresh, empty old-owner results, network retry, and
conflict/reload recovery. These UI checks use mocked responses; the separate
integration suite exercises the real API and MongoDB, not a production database.
