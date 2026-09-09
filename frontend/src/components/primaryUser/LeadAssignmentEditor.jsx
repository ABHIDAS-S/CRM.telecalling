import { useEffect, useRef, useState } from "react"
import PropTypes from "prop-types"
import api from "../../api/api"

export default function LeadAssignmentEditor({ lead, onClose, onSaved }) {
  const [details, setDetails] = useState(null)
  const [assignmentId, setAssignmentId] = useState("")
  const [person, setPerson] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [conflict, setConflict] = useState(false)
  const [reload, setReload] = useState(0)
  const active = useRef(false)
  const saveLock = useRef(false)
  const dialog = useRef(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    active.current = true
    const previousFocus = document.activeElement
    dialog.current?.focus()
    return () => { active.current = false; previousFocus?.focus() }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError("")
    api.get(`/target/leads/${lead.leadMongoId}/assignments`, { signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted) return
        setDetails(data.data)
        setAssignmentId("")
        setPerson("")
        setConflict(false)
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.response?.data?.message || "Unable to load assignments. Please try again.")
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [lead.leadMongoId, reload])

  const assignment = details?.assignments.find((item) => item.assignmentId === assignmentId)
  const selectedUser = details?.users.find((user) => `${user.model}:${user.userId}` === person)
  const unchanged = assignment && selectedUser &&
    assignment.expected.assignedUserId === selectedUser.userId &&
    assignment.expected.assignedUserModel === selectedUser.model

  const save = async (event) => {
    event.preventDefault()
    if (saveLock.current || !assignment || !selectedUser || unchanged || conflict || loading) return
    saveLock.current = true
    setSaving(true)
    setError("")
    try {
      await api.patch(`/target/leads/${lead.leadMongoId}/assignments/${assignment.assignmentId}`, {
        userId: selectedUser.userId, userModel: selectedUser.model, expected: assignment.expected,
      })
      if (active.current) onSaved()
    } catch (err) {
      if (!active.current) return
      setConflict(err.response?.status === 409)
      setError(err.response?.data?.message || "Unable to save. Check your connection and try again.")
    } finally {
      saveLock.current = false
      if (active.current) setSaving(false)
    }
  }

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation()
      if (!saveLock.current) closeRef.current()
    }
    if (event.key === "Tab") {
      const items = [...dialog.current.querySelectorAll("button:not(:disabled), select:not(:disabled), input:not(:disabled)")]
      const first = items[0], last = items.at(-1)
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
        event.preventDefault(); last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus()
      }
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/70 p-3">
      <form ref={dialog} tabIndex={-1} onKeyDown={onKeyDown} onSubmit={save}
        role="dialog" aria-modal="true" aria-labelledby="assignment-title"
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
        <h2 id="assignment-title" className="text-base font-bold text-gray-900">Edit assigned person</h2>
        <p className="mt-1 text-sm text-gray-600">{lead.leadId} · {lead.partyName}</p>
        <p className="mt-2 text-xs text-gray-500">Choose one task record. Saving also corrects its incentive owner; the original submission history is preserved.</p>
        {loading ? <p role="status" className="py-6 text-sm">Loading assignments…</p> : details && (
          <>
            <label className="mt-4 block text-sm font-medium" htmlFor="assignment-record">Allocation / task record</label>
            <select id="assignment-record" value={assignmentId} disabled={saving || conflict}
              onChange={(event) => { setAssignmentId(event.target.value); setPerson(""); setError("") }}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm">
              <option value="">Select a record</option>
              {details.assignments.map((item) => (
                <option key={item.assignmentId} value={item.assignmentId}>
                  {item.label} · {item.assignedUserName} · {item.date ? new Date(item.date).toLocaleString("en-GB") : "No date"} · {item.assignmentId}
                </option>
              ))}
            </select>
            {!details.assignments.length && <p className="mt-2 text-sm text-gray-500">No editable task records found.</p>}
            {assignment && <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm">
              <p className="mb-1 break-all text-xs text-gray-500">Record: {assignment.assignmentId}</p>
              <p>Assigned person: {assignment.assignedUserName}</p>
              <p>Incentive owner: {assignment.incentiveUserName}</p>
              <p>Status: {assignment.completed ? "Completed" : "Open"}</p>
            </div>}
            <label className="mt-4 block text-sm font-medium" htmlFor="assignment-person">Replacement person</label>
            <select id="assignment-person" value={person} disabled={!assignment || saving || conflict}
              onChange={(event) => setPerson(event.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm">
              <option value="">Select a person</option>
              {details.users.map((user) => <option key={`${user.model}:${user.userId}`} value={`${user.model}:${user.userId}`}>{user.name} ({user.model})</option>)}
            </select>
          </>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
        {unchanged && <p className="mt-2 text-xs text-gray-500">This person is already assigned.</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          {(conflict || (!details && !loading)) && <button type="button" disabled={saving || loading} onClick={() => setReload((value) => value + 1)} className="rounded-lg border px-3 py-2 text-sm">Reload assignments</button>}
          <button type="button" disabled={saving} onClick={onClose} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-50">Cancel</button>
          <button type="submit" disabled={saving || loading || conflict || !assignment || !selectedUser || unchanged}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
        </div>
      </form>
    </div>
  )
}

LeadAssignmentEditor.propTypes = {
  lead: PropTypes.shape({ leadMongoId: PropTypes.string.isRequired, leadId: PropTypes.string, partyName: PropTypes.string }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
}
