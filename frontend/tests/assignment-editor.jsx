// Open /tests/assignment-editor.html on the Vite dev server. All API calls are
// intercepted here; this fixture never reads or modifies application data.
// Add ?failure=network or ?failure=conflict to exercise recoverable save errors.
import { useState } from "react"
import { createRoot } from "react-dom/client"
import api from "../src/api/api"
import IncentiveLeadsModal from "../src/components/primaryUser/IncentiveLeadsModal"
import "../src/tailwind.css"

const leadId = "111111111111111111111111"
const oldUser = "222222222222222222222222"
const newUser = "333333333333333333333333"
const assignmentIds = ["444444444444444444444444", "555555555555555555555555"]
let saved = false
let failOnce = new URLSearchParams(window.location.search).get("failure")
api.defaults.adapter = async (config) => {
  await new Promise((resolve) => setTimeout(resolve, 250))
  let data
  if (config.method === "patch") {
    if (failOnce) {
      const failure = failOnce
      failOnce = null
      throw Object.assign(new Error("Simulated network failure"), failure === "conflict" ? {
        response: { status: 409, data: { message: "Assignment changed. Reload the assignments before saving again" } },
      } : {})
    }
    saved = true
    data = { changed: true }
  } else if (config.url.includes("/assignments")) {
    data = {
      assignments: assignmentIds.map((assignmentId) => ({
        assignmentId, label: "Demo", assignedUserName: "Original person", incentiveUserName: "Original person",
        date: "2026-09-08T09:00:00Z", completed: true,
        expected: { assignedUserId: oldUser, assignedUserModel: "Staff", incentiveUserId: null, incentiveUserModel: null, revision: 0 },
      })),
      users: [{ userId: oldUser, name: "Original person", model: "Staff" }, { userId: newUser, name: "Replacement person", model: "Staff" }],
    }
  } else {
    data = { canEditAssignments: true, leads: saved ? [] : [{ leadMongoId: leadId,
      leadId: "LEAD-001", partyName: "Sample customer", date: "2026-09-08", totalAmount: 100,
      allocations: [{ allocationId: "demo", label: "Demo", amount: 100 }],
    }] }
  }
  return { data: { success: true, data }, status: 200, statusText: "OK", headers: {}, config }
}

export default function Fixture() {
  const [refreshes, setRefreshes] = useState(0)
  return <>
    <p className="fixed bottom-0 z-[80] bg-white p-1 text-xs">Parent refreshes: {refreshes}</p>
    <IncentiveLeadsModal user={{ userId: oldUser, name: "Original person" }} allocation={{ key: "all", label: "All allocations" }}
      year={2026} period="September" selectedBranch="666666666666666666666666"
      onAssignmentUpdated={() => setRefreshes((value) => value + 1)} />
  </>
}
createRoot(document.getElementById("root")).render(<Fixture />)
