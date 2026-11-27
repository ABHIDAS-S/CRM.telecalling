import { useEffect, useState } from "react"
import { FiCalendar, FiCornerUpRight, FiPhone, FiPhoneIncoming, FiThumbsDown, FiThumbsUp } from "react-icons/fi"
import api from "../../../api/api"

const metrics = [
  { label: "Total calls", icon: FiPhone, tone: "bg-indigo-100 text-indigo-800" },
  { label: "Interested", outcome: "Interested", icon: FiThumbsUp, tone: "bg-emerald-100 text-emerald-800" },
  { label: "Callback Requested", outcome: "Callback Requested", icon: FiPhoneIncoming, tone: "bg-violet-100 text-violet-800" },
  { label: "Follow-up Needed", outcome: "Follow-up Needed", icon: FiCalendar, tone: "bg-amber-100 text-amber-900" },
  { label: "Not Interested", outcome: "Not Interested", icon: FiThumbsDown, tone: "bg-rose-100 text-rose-800" },
  { label: "Convert to Lead", outcome: "Convert to Lead", icon: FiCornerUpRight, tone: "bg-sky-100 text-sky-800" },
]

function countFor(row, outcome) {
  if (!row) return "—"
  return (outcome ? row.outcomes[outcome] ?? 0 : row.total).toLocaleString()
}

const dateFilters = [
  ["all", "All time"],
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["this-week", "This week"],
  ["this-month", "This month"],
  ["month", "Choose a month"],
  ["date", "Choose a date"],
]

export default function TallyCallSummary() {
  const [report, setReport] = useState(null)
  const [error, setError] = useState("")
  const [period, setPeriod] = useState("all")
  const [date, setDate] = useState("")
  const needsDate = period === "month" || period === "date"
  const ready = !needsDate || Boolean(date)

  function updateFilter(nextPeriod, nextDate) {
    setReport(null)
    setError("")
    setPeriod(nextPeriod)
    setDate(nextDate)
  }

  useEffect(() => {
    if (!ready) return
    const controller = new AbortController()
    api.get("/reports/tally-customers/call-summary", {
      params: { period, date: needsDate ? date : undefined },
      signal: controller.signal,
    })
      .then(({ data }) => {
        if (controller.signal.aborted) return
        if (!Array.isArray(data?.staff) || !data.totals?.outcomes) throw new Error("Invalid call summary response.")
        setReport(data)
      })
      .catch(err => {
        if (!controller.signal.aborted) setError(err.response?.data?.message || "Unable to load the call summary.")
      })
    return () => controller.abort()
  }, [period, date, needsDate, ready])

  return (
    <section className="h-full overflow-y-auto bg-slate-50 p-4 text-slate-900 md:p-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-xl font-extrabold tracking-tight text-indigo-950">Customer Call Summary</h1>
        <div className="flex flex-wrap gap-3">
          <label className="grid gap-1 text-xs font-semibold text-slate-700">
            Date filter
            <select value={period} onChange={event => updateFilter(event.target.value, "")}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
              {dateFilters.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          {needsDate && (
            <label className="grid gap-1 text-xs font-semibold text-slate-700">
              {period === "month" ? "Month" : "Date"}
              <input type={period} value={date} onChange={event => updateFilter(period, event.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
            </label>
          )}
        </div>
      </header>
      <dl className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {metrics.map(({ label, outcome, icon: Icon, tone }) => (
          <div key={label} className="flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tone}`}><Icon aria-hidden="true" /></span>
            <div className="min-w-0">
              <dt className="text-xs font-semibold text-slate-600">{label}</dt>
              <dd className="mt-0.5 text-xl font-bold leading-none tabular-nums">{countFor(report?.totals, outcome)}</dd>
            </div>
          </div>
        ))}
      </dl>
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm" aria-busy={ready && !report && !error}>
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold">Calls by staff</h2>
        {error ? <p role="alert" className="px-4 py-6 text-sm text-red-700">{error}</p>
          : !ready ? <p className="px-4 py-6 text-sm text-slate-600">Select a {period} to see call counts.</p>
          : !report ? <p role="status" className="px-4 py-6 text-sm text-slate-600">Loading call summary…</p>
          : !report.staff.length ? <p className="px-4 py-6 text-sm text-slate-600">No staff accounts found.</p>
          : <div className="min-h-0 flex-1 overflow-auto" tabIndex={0} role="region" aria-label="Staff call counts">
            <table className="w-full min-w-[740px] text-sm">
              <thead className="bg-slate-100 text-xs text-slate-700"><tr>
                <th scope="col" className="px-4 py-3 text-left">Staff member</th>
                {metrics.map(({ label }) => <th key={label} scope="col" className="px-3 py-3 text-right">{label}</th>)}
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {report.staff.map(member => <tr key={member._id} className="even:bg-slate-50">
                  <th scope="row" className="px-4 py-2.5 text-left font-medium">{member.name || "Unnamed staff member"}</th>
                  {metrics.map(({ label, outcome }) => <td key={label} className="px-3 py-2.5 text-right tabular-nums">{countFor(member, outcome)}</td>)}
                </tr>)}
              </tbody>
            </table>
          </div>}
      </section>
    </section>
  )
}
