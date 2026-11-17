import { useEffect, useState } from "react"
import api from "../../../api/api"

const columns = [
  ["Customer", "Customer"], ["Address", "Address"], ["Contactperson", "Contact person"],
  ["ContactNumber", "Contact number"], ["Mobilenumber", "Mobile number"],
  ["Emailid", "Email ID"], ["Tallyserialno", "Tally serial no."], ["Gstno", "GST no."],
]

export default function TallyCustomers() {
  const [rows, setRows] = useState([])
  const [jobs, setJobs] = useState([])
  const [serial, setSerial] = useState("")
  const [filter, setFilter] = useState("")
  const [cursors, setCursors] = useState([null])
  const [nextCursor, setNextCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [progressError, setProgressError] = useState("")
  const [refresh, setRefresh] = useState(0)
  const cursor = cursors[cursors.length - 1]

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError("")
    setNextCursor(null)
    api.get("/reports/tally-customers", { params: { limit: 50, after: cursor || undefined, serial: filter || undefined }, signal: controller.signal })
      .then(({ data }) => { setRows(data.data); setNextCursor(data.nextCursor) })
      .catch(err => { if (!controller.signal.aborted) { setRows([]); setError(err.response?.data?.message || "Unable to load customer details.") } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [cursor, filter, refresh])

  useEffect(() => {
    const controller = new AbortController()
    let timer
    const load = async () => {
      try {
        const { data } = await api.get("/reports/tally-customers/imports", { signal: controller.signal })
        setJobs(data.data)
        setProgressError("")
      } catch (err) {
        if (!controller.signal.aborted) setProgressError(err.response?.data?.message || "Unable to load import progress.")
      }
      if (!controller.signal.aborted) timer = setTimeout(load, 5000)
    }
    load()
    return () => { controller.abort(); clearTimeout(timer) }
  }, [])

  return (
    <section className="h-full overflow-y-auto bg-slate-50 p-4 md:p-6 text-slate-900">
      

      <form className="mb-4 ml-auto flex w-full flex-wrap items-end justify-end gap-3 sm:w-fit" onSubmit={event => { event.preventDefault(); setCursors([null]); setFilter(serial.trim()); setRefresh(value => value + 1) }}>
        <div className="flex min-w-0 flex-col gap-1.5">
          <label htmlFor="tally-serial" className="text-xs font-semibold text-slate-600">Tally serial number</label>
          <input id="tally-serial" value={serial} maxLength={200} onChange={event => setSerial(event.target.value)} placeholder="Enter exact serial number" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm sm:w-72 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100" />
        </div>
        <button type="submit" className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800">Search</button>
        <button type="button" className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100" onClick={() => { setSerial(""); setFilter(""); setCursors([null]); setRefresh(value => value + 1) }}>Clear filters</button>
      </form>
      {error && <p role="alert" className="mb-3 text-red-700">{error}</p>}
      <div className="max-h-[65vh] overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm" aria-busy={loading} tabIndex={0} role="region" aria-label="Tally customer details table">
        <table className="w-full min-w-[1500px] text-left text-sm">
          <caption className="sr-only">Customer, address, contact person, contact number, mobile number, email ID, Tally serial number and GST number</caption>
          <thead className="sticky top-0 z-10 bg-slate-100 text-xs uppercase tracking-wide text-slate-600"><tr><th scope="col" className="p-4">Sl. No.</th>{columns.map(([key, label]) => <th scope="col" key={key} className="p-4 whitespace-nowrap">{label}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={columns.length + 1} className="p-10 text-center text-slate-500">Loading customer details…</td></tr> : rows.length ? rows.map((row, index) => (
              <tr key={row._id} className="border-t border-slate-100 align-top even:bg-slate-50/60 hover:bg-blue-50/60"><td className="p-4 tabular-nums text-slate-400">{(cursors.length - 1) * 50 + index + 1}</td>{columns.map(([key]) => <td key={key} className={`p-4 break-words ${key === "Address" ? "min-w-56 max-w-xs whitespace-pre-wrap text-slate-600" : key === "Customer" ? "min-w-44 max-w-xs font-semibold" : ["Tallyserialno", "Gstno", "ContactNumber", "Mobilenumber"].includes(key) ? "font-mono text-xs whitespace-nowrap" : "min-w-36 max-w-xs"}`}>{row[key] || <span className="text-slate-400">—</span>}</td>)}</tr>
            )) : <tr><td colSpan={columns.length + 1} className="p-10 text-center"><p className="font-medium">{error ? "Customer details unavailable" : filter ? "No matching customers" : "No Tally customers yet"}</p><p className="mt-2 text-sm text-slate-500">{error ? "Try refreshing the report." : filter ? "Clear the filter to view all imported customers." : "Customer details will appear here after the first import is processed."}</p></td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Different serial records may share the same customer name or contact number.</p>
        <div className="flex items-center gap-3">
        <button disabled={loading || cursors.length === 1} onClick={() => setCursors(value => value.slice(0, -1))} className="rounded border bg-white px-3 py-2 disabled:opacity-40">Previous</button>
        <span className="text-sm">Page {cursors.length}</span>
        <button disabled={loading || !nextCursor} onClick={() => setCursors(value => [...value, nextCursor])} className="rounded border bg-white px-3 py-2 disabled:opacity-40">Next</button>
        </div>
      </div>
      <details className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold">Sync activity <span className="ml-2 font-normal text-slate-500">View recent imports and progress</span></summary>
        {progressError && <p role="alert" className="mt-2 text-red-700">{progressError}</p>}
        {!jobs.length && !progressError && <p className="mt-2 text-sm text-slate-500">No imports received yet.</p>}
        <ul className="mt-2 space-y-3">
          {jobs.map(job => (
            <li key={job.id} className="border-b pb-2 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <span>{new Date(job.createdAt).toLocaleString()} · <strong>{job.status}</strong></span>
                <span>{job.processed.toLocaleString()} / {job.total.toLocaleString()} rows processed</span>
              </div>
              <progress className="mt-2 w-full" aria-label={`Import ${job.status}`} max={Math.max(job.total, 1)} value={job.processed} />
              {job.error && <p className="text-red-700">{job.error}</p>}
            </li>
          ))}
        </ul>
      </details>
    </section>
  )
}
