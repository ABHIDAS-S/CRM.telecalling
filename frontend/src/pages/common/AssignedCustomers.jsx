import { useEffect, useState } from "react"
import { FiMail, FiMapPin, FiPhone, FiUser } from "react-icons/fi"
import api from "../../api/api"

const endpoint = "/reports/assigned-customers"
const notYetCalledOutcome = "Not Yet Called"
const emptyCall = { outcome: "", followUpDate: "", primeAttention: false, remarks: "" }
const outcomeTiles = [
  [notYetCalledOutcome, "border-slate-300 bg-slate-100 text-slate-900"],
  ["Interested", "border-emerald-200 bg-emerald-50 text-emerald-900"],
  ["Not Interested", "border-rose-200 bg-rose-50 text-rose-900"],
  ["Callback Requested", "border-violet-200 bg-violet-50 text-violet-900"],
  ["Follow-up Needed", "border-amber-200 bg-amber-50 text-amber-900"],
  ["Convert to Lead", "border-sky-200 bg-sky-50 text-sky-900"],
]
const inputClass = "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
const avatarTones = [
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-800",
  "bg-sky-100 text-sky-800",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-800",
]

export default function AssignedCustomers() {
  const [report, setReport] = useState({ data: [], total: 0, outcomes: [], nextCursor: null })
  const [cursors, setCursors] = useState([null])
  const [selected, setSelected] = useState(null)
  const [draft, setDraft] = useState(emptyCall)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState("")
  const [saveError, setSaveError] = useState("")
  const [notice, setNotice] = useState("")
  const [historyOutcome, setHistoryOutcome] = useState(notYetCalledOutcome)
  const [historyCursors, setHistoryCursors] = useState([null])
  const [history, setHistory] = useState({ data: [], counts: {}, nextCursor: null })
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyError, setHistoryError] = useState("")
  const [historyRefresh, setHistoryRefresh] = useState(0)
  const historyCursor = historyCursors.at(-1)
  const cursor = cursors.at(-1)
  const visibleCustomers = historyOutcome ? history.data.map(call => call.customer).filter(Boolean) : report.data
  const visibleCustomerCount = historyOutcome ? history.counts[historyOutcome] ?? 0 : report.total
  const showCallTable = Boolean(historyOutcome && historyOutcome !== notYetCalledOutcome)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError("")
    api.get(endpoint, { params: { after: cursor || undefined }, signal: controller.signal })
      .then(({ data }) => {
        if (!Array.isArray(data?.data) || !Array.isArray(data.outcomes)) throw new Error("Invalid report response.")
        setReport(data)
      })
      .catch(error => {
        if (!controller.signal.aborted) setLoadError(error.response?.data?.message || "Unable to load your assigned customers.")
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [cursor])

  useEffect(() => {
    const controller = new AbortController()
    setHistoryLoading(true)
    setHistoryError("")
    api.get(`${endpoint}/calls`, {
      params: { outcome: historyOutcome || undefined, before: historyCursor || undefined },
      signal: controller.signal,
    }).then(({ data }) => {
      if (!Array.isArray(data?.data) || !data.counts) throw new Error("Invalid call history response.")
      setHistory(data)
    }).catch(error => {
      if (!controller.signal.aborted) setHistoryError(error.response?.data?.message || "Unable to load your call history.")
    }).finally(() => {
      if (!controller.signal.aborted) setHistoryLoading(false)
    })
    return () => controller.abort()
  }, [historyOutcome, historyCursor, historyRefresh])

  function openCall(customer) {
    setSelected(customer)
    setDraft(emptyCall)
    setSaveError("")
    setNotice("")
  }

  function changePage(next) {
    openCall(null)
    setCursors(next)
  }

  async function saveCall(event) {
    event.preventDefault()
    if (saving) return
    setSaving(true)
    setSaveError("")
    try {
      const { data } = await api.post(`${endpoint}/${selected._id}/calls`, {
        ...draft,
        followUpDate: draft.followUpDate ? new Date(draft.followUpDate).toISOString() : null,
      })
      if (!data?.id) throw new Error("Call save was not confirmed.")
      setNotice(`Call saved for ${selected.Contactperson || selected.Customer}.`)
      setHistoryCursors([null])
      setHistoryRefresh(value => value + 1)
      setDraft(emptyCall)
      setSelected(null)
    } catch (error) {
      setSaveError(error.response?.data?.message || "Unable to save call details.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-[#ADD8E6] p-4 text-slate-900 md:p-6">
      <h1 className="mb-4 shrink-0 text-xl font-extrabold tracking-tight text-indigo-950">My Assigned Customers</h1>
      {notice && <p role="status" className="mb-4 shrink-0 text-emerald-700">{notice}</p>}
      <div className="mb-4 shrink-0 grid auto-rows-fr grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-label="Call outcomes">
        {outcomeTiles.map(([outcome, tone]) => (
          <button key={outcome} type="button" aria-pressed={historyOutcome === outcome}
            onClick={() => {
              setHistoryOutcome(current => current === outcome ? "" : outcome)
              setHistoryCursors([null])
            }}
            className={`flex min-h-16 min-w-0 flex-col justify-between gap-1 rounded-xl border px-3 py-2.5 text-left shadow-sm hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${tone} ${historyOutcome === outcome ? "ring-2 ring-indigo-600" : ""}`}>
            <span className="block text-xs font-semibold">{outcome}</span>
            <span className="text-xl font-bold tabular-nums">{history.counts[outcome] ?? (historyLoading || historyError ? "—" : 0)}</span>
          </button>
        ))}
      </div>
      {historyError && <p role="alert" className="mb-3 shrink-0 text-sm text-red-700">{historyError}</p>}
      <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-[minmax(240px,320px)_minmax(0,1fr)]">
        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <h2 className="flex items-center justify-between gap-2 bg-indigo-950 px-4 py-3 text-sm font-semibold text-white">
            {historyOutcome ? `${historyOutcome} Customers` : "My Calling List"}
            {!loadError && (!loading || report.total > 0) && <span className="rounded-full bg-indigo-700 px-2.5 py-0.5 text-xs tabular-nums">{visibleCustomerCount.toLocaleString()}</span>}
          </h2>
          {loadError ? <p role="alert" className="p-4 text-red-700">{loadError}</p>
            : historyOutcome && historyLoading ? <p role="status" className="p-4">Loading customers…</p>
            : loading ? <p role="status" className="p-4">Loading customers…</p>
            : !visibleCustomers.length ? <p className="p-4 text-slate-600">{historyOutcome ? "No customers with this outcome." : "No customers on this page."}</p>
            : <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
              {visibleCustomers.map((customer, index) => (
                <li key={customer._id} className={`flex items-center justify-between gap-2 rounded-lg border-l-2 px-2.5 py-2 transition-colors ${selected?._id === customer._id ? "border-indigo-600 bg-indigo-50" : "border-transparent bg-white hover:bg-slate-50"}`}>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${avatarTones[index % avatarTones.length]}`}>
                      <FiUser aria-hidden="true" />
                    </span>
                    <div className="min-w-0 break-words">
                      <p className="text-sm font-semibold">{customer.Contactperson || customer.Customer}</p>
                      <p className="text-xs text-slate-600">{[customer.Company || (customer.Contactperson && customer.Customer), customer.Mobilenumber || customer.ContactNumber].filter(Boolean).join(" · ")}</p>
                    </div>
                  </div>
                  <button type="button" disabled={saving} aria-pressed={selected?._id === customer._id} aria-label={`Call ${customer.Contactperson || customer.Customer}`} onClick={() => { setHistoryOutcome(""); setHistoryCursors([null]); if (selected?._id !== customer._id) openCall(customer) }} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-800 transition-colors hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:opacity-50">
                    <FiPhone aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>}
          {(!loading && (cursors.length > 1 || report.nextCursor)) && <div className="flex shrink-0 justify-between border-t px-4 py-3 text-sm">
            <button type="button" disabled={saving || cursors.length === 1} onClick={() => changePage(cursors.slice(0, -1))} className="text-blue-700 disabled:text-slate-400">Previous</button>
            <span>Page {cursors.length}</span>
            <button type="button" disabled={saving || !report.nextCursor || Boolean(loadError)} onClick={() => changePage([...cursors, report.nextCursor])} className="text-blue-700 disabled:text-slate-400">Next</button>
          </div>}
        </section>

        {showCallTable ? <section className="order-first flex min-h-0 min-w-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:order-none">
          <h2 className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold">{historyOutcome}</h2>
          {historyLoading ? <p role="status" className="p-4 text-sm">Loading calls…</p> : !historyError && (
            history.data.length ? <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="sticky top-0 bg-slate-100 text-xs text-slate-700"><tr>
                  <th scope="col" className="px-4 py-2">Customer name</th>
                  <th scope="col" className="px-4 py-2">Status</th>
                  <th scope="col" className="px-4 py-2">Follow-up date</th>
                  <th scope="col" className="px-4 py-2">Remarks</th>
                </tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {history.data.map(call => <tr key={call._id}>
                    <td className="px-4 py-2 font-medium">{call.customerName}</td>
                    <td className="px-4 py-2">{call.outcome}</td>
                    <td className="px-4 py-2">{call.followUpDate ? new Date(call.followUpDate).toLocaleString() : "—"}</td>
                    <td className="max-w-xs px-4 py-2 whitespace-pre-wrap break-words text-slate-600">{call.remarks || "—"}</td>
                  </tr>)}
                </tbody>
              </table>
            </div> : <p className="p-4 text-sm text-slate-600">No calls with this outcome.</p>
          )}
          {!historyLoading && !historyError && (historyCursors.length > 1 || history.nextCursor) && (
            <div className="flex shrink-0 justify-end gap-4 border-t px-4 py-2 text-sm">
              <button type="button" disabled={historyCursors.length === 1} onClick={() => setHistoryCursors(value => value.slice(0, -1))} className="text-indigo-700 disabled:text-slate-400">Previous calls</button>
              <button type="button" disabled={!history.nextCursor} onClick={() => setHistoryCursors(value => [...value, history.nextCursor])} className="text-indigo-700 disabled:text-slate-400">Next calls</button>
            </div>
          )}
        </section> : historyOutcome === notYetCalledOutcome ? <div className="flex items-center justify-center rounded-xl border border-dashed border-slate-400 bg-white/70 px-4 py-10 text-center text-sm text-slate-700">
          Customers in the calling list have not been contacted yet. Select a phone icon to record their first call.
        </div> : selected ? <section className="min-h-0 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <header className="rounded-t-xl border-b border-indigo-100 bg-gradient-to-r from-indigo-50 to-teal-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-100 text-indigo-700"><FiUser aria-hidden="true" /></span>
              <div className="min-w-0 break-words">
                <h2 className="text-lg font-semibold leading-tight">{selected.Contactperson || selected.Customer}</h2>
                <p className="text-sm text-slate-600">{selected.Company || (selected.Contactperson && selected.Customer)}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-700">
              {(selected.Mobilenumber || selected.ContactNumber) && <span className="inline-flex items-center gap-1.5 rounded-md bg-teal-100 px-2.5 py-1.5 font-medium text-teal-900"><FiPhone aria-hidden="true" className="shrink-0" />{selected.Mobilenumber || selected.ContactNumber}</span>}
              {selected.Emailid && <span className="inline-flex min-w-0 items-center gap-1.5 break-all rounded-md bg-violet-100 px-2.5 py-1.5 font-medium text-violet-900"><FiMail aria-hidden="true" className="shrink-0" />{selected.Emailid}</span>}
              {(selected.location || selected.Address || selected.address2 || selected.address3) && <span className="inline-flex min-w-0 items-center gap-1.5 break-words rounded-md bg-sky-100 px-2.5 py-1.5 font-medium text-sky-900"><FiMapPin aria-hidden="true" className="shrink-0" />{[selected.Address, selected.address2, selected.address3, selected.location].filter(Boolean).join(", ")}</span>}
            </div>
          </header>
          <form onSubmit={saveCall} className="p-5">
            <fieldset disabled={saving} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">Call outcome / status
                  <select required value={draft.outcome} onChange={event => setDraft({ ...draft, outcome: event.target.value })} className={inputClass}>
                    <option value="">Select outcome</option>
                    {report.outcomes.map(outcome => <option key={outcome}>{outcome}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium">Follow-up date
                  <input type="datetime-local" value={draft.followUpDate} onChange={event => setDraft({ ...draft, followUpDate: event.target.value })} className={inputClass} />
                </label>
              </div>
              <label className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                <input type="checkbox" className="accent-amber-700" checked={draft.primeAttention} onChange={event => setDraft({ ...draft, primeAttention: event.target.checked })} /> Prime Attention
              </label>
              <label className="block text-sm font-medium">Remarks / call notes
                <textarea rows={4} maxLength={4000} value={draft.remarks} onChange={event => setDraft({ ...draft, remarks: event.target.value })} className={inputClass} />
              </label>
              {saveError && <p role="alert" className="text-sm text-red-700">{saveError}</p>}
              <div className="flex justify-end">
                <button type="submit" className="rounded-lg bg-indigo-700 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
              </div>
            </fieldset>
          </form>
        </section> : <div className="hidden rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center text-sm text-slate-600 md:block">
          Select a customer’s phone icon to open the call form.
        </div>}
      </div>
    </section>
  )
}
