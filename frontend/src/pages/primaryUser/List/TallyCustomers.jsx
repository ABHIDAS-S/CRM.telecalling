import { useEffect, useRef, useState } from "react"
import { FiChevronLeft, FiChevronRight, FiDownload, FiSearch } from "react-icons/fi"
import api from "../../../api/api"

const columns = [
  ["Customer", "Name"], ["Address", "Address 1"],
  ["address2", "Address 2"], ["address3", "Address 3"], ["location", "Location"],
  ["State", "State"], ["Country", "Country"], ["Pincode", "Pincode"], ["Contactperson", "Contact person"],
  ["ContactNumber", "Contact number"], ["Mobilenumber", "Mobile number"],
  ["Emailid", "Email ID"], ["tin", "TIN"], ["Tallyserialno", "Tally serial number"],
]

const importColumns = [
  ...columns, ["Customer", "Customer"], ["Address", "Address"],
  ["Company", "Company"], ["Tallyserialno", "Tally serial no."],
  ["Gstno", "GST no."],
]

const excelFields = ["name", "address1", "address2", "address3", "pin", "email", "contact", "phone1", "mobile", "state", "country", "tin", "location"]
const fieldClass = "h-8 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:bg-slate-100"
const pageButtonClass = "grid size-8 place-items-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40"

function reportList(payload) {
  if (!Array.isArray(payload?.data)) throw new Error("Unexpected Tally report response.")
  return payload.data
}

function reportLoadError(error, fallback) {
  if (error.response?.status === 401) return "Sign in to this CRM server again to load the report."
  if (error.response?.status === 403) return "An administrator account is required to load this report."
  const message = error.response?.data?.message
  return typeof message === "string" && message ? message : fallback
}

export default function TallyCustomers() {
  const [rows, setRows] = useState([])
  const [jobs, setJobs] = useState([])
  const [cursors, setCursors] = useState([null])
  const [search, setSearch] = useState("")
  const [nextCursor, setNextCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [progressError, setProgressError] = useState("")
  const [refresh, setRefresh] = useState(0)
  const [selected, setSelected] = useState(new Set())
  const [staff, setStaff] = useState([])
  const [staffId, setStaffId] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState("")
  const [notice, setNotice] = useState("")
  const pendingImport = useRef(null)
  const pageCheckbox = useRef(null)
  const pageSelected = rows.filter(row => selected.has(row._id)).length
  const cursor = cursors[cursors.length - 1]

  useEffect(() => {
    if (pageCheckbox.current) {
      pageCheckbox.current.indeterminate = pageSelected > 0 && pageSelected < rows.length
    }
  }, [pageSelected, rows.length])

  useEffect(() => {
    const controller = new AbortController()
    api.get("/auth/getallStaffs", { signal: controller.signal })
      .then(({ data }) => {
        const members = reportList(data)
        setStaff([...members].sort((first, second) =>
          (first.name || "").localeCompare(second.name || "")
        ))
      })
      .catch(error => {
        if (!controller.signal.aborted) setActionError(reportLoadError(error, "Unable to load staff."))
      })
    return () => controller.abort()
  }, [])

  function toggleSelection(ids, checked) {
    setSelected(previous => {
      const next = new Set(previous)
      for (const id of ids) checked ? next.add(id) : next.delete(id)
      return next
    })
  }

  async function allocate() {
    const firstSerial = start.trim()
    const lastSerial = end.trim()
    const hasRange = Boolean(firstSerial || lastSerial)
    setActionError("")
    setNotice("")
    if (hasRange && (!/^\d+$/.test(firstSerial) || !/^\d+$/.test(lastSerial) || BigInt(firstSerial) > BigInt(lastSerial))) {
      setActionError("Enter numeric Tally serial numbers in both fields, with Start from at or below End to.")
      return
    }
    setBusy(true)
    try {
      const { data } = await api.post("/reports/tally-customers/assign", {
        staffId, customerIds: [...selected],
        ...(hasRange ? { start: firstSerial, end: lastSerial } : {}),
      })
      if (!Number.isInteger(data?.assigned) || data.assigned < 1) {
        setActionError("The CRM API did not confirm the allocation. Check that the connected backend has the Tally allocation update.")
        return
      }
      setNotice(`Allocated ${data.assigned} customer(s) to ${staff.find(member => member._id === staffId)?.name}.`)
      setSelected(new Set())
      setStart("")
      setEnd("")
      setRefresh(value => value + 1)
    } catch (err) {
      const response = err.response
      const message = response?.data?.message
      if (typeof message === "string" && message) {
        setActionError(message)
      } else if (response?.status === 404 || response?.status === 405) {
        setActionError("Tally allocation is unavailable on the connected CRM backend. Deploy the Tally allocation update to that backend.")
      } else if (!response) {
        setActionError("Could not reach the CRM API to confirm allocation. Check your connection and try again.")
      } else {
        setActionError(`The CRM API could not confirm allocation (HTTP ${response.status}).`)
      }
    } finally { setBusy(false) }
  }

  async function importExcel(event) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setBusy(true)
    setNotice("")
    setActionError("")
    try {
      if (file.size > 10 * 1024 * 1024) throw new Error("Choose an Excel file up to 10 MiB.")
      const XLSX = await import("xlsx")
      const workbook = XLSX.read(await file.arrayBuffer(), { sheets: 0, sheetRows: 10002 })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      if (!sheet) throw new Error("The workbook has no worksheets.")
      const [headers = [], ...records] = XLSX.utils.sheet_to_json(sheet, {
        header: 1, raw: false, defval: "", blankrows: false,
      })
      if (XLSX.utils.decode_range(sheet["!fullref"] || sheet["!ref"] || "A1").e.r >= 10001) {
        throw new Error("Excel import supports up to 10,000 rows below the header.")
      }
      const normalizedHeaders = headers.map(header => String(header).trim().toLowerCase())
      const keys = normalizedHeaders.map(header => excelFields.includes(header) ? header : importColumns.find(([key, label]) =>
        [key.toLowerCase(), label.toLowerCase()].includes(header)
      )?.[0])
      const newFormat = keys.includes("name")
      if (!newFormat && !["Customer", "Tallyserialno", "Mobilenumber"].every(key => keys.includes(key))) {
        throw new Error("Excel needs a name column, or Customer, Tallyserialno and Mobilenumber columns.")
      }
      if (new Set(keys.filter(Boolean)).size !== keys.filter(Boolean).length) {
        throw new Error("Remove duplicate customer column headers from the workbook.")
      }
      const ledgerIndex = normalizedHeaders.indexOf("ledger")
      const cityIndex = normalizedHeaders.indexOf("city")
      const rows = records.map(row => {
        const record = Object.fromEntries(keys.flatMap((key, index) => key ? [[key, row[index] || ""]] : []))
        if (newFormat && !record.name.trim() && ledgerIndex >= 0) record.name = row[ledgerIndex] || ""
        if (newFormat && !record.location && cityIndex >= 0) record.location = row[cityIndex] || ""
        return record
      })
      const { data } = await api.post("/reports/tally-customers/imports", { data: rows })
      pendingImport.current = data.id
      setNotice("Excel import queued.")
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || "Unable to import Excel file.")
      setBusy(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError("")
    setNextCursor(null)
    api.get("/reports/tally-customers", { params: { limit: 50, after: cursor || undefined, search: search.trim() || undefined }, signal: controller.signal })
      .then(({ data }) => { setRows(reportList(data)); setNextCursor(data.nextCursor) })
      .catch(err => {
        if (!controller.signal.aborted) {
          setRows([])
          setError(reportLoadError(err, "Unable to load customer details."))
        }
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [cursor, refresh, search])

  useEffect(() => {
    const controller = new AbortController()
    let timer
    const load = async () => {
      try {
        const { data } = await api.get("/reports/tally-customers/imports", { signal: controller.signal })
        const recentJobs = reportList(data)
        setJobs(recentJobs)
        setProgressError("")
        const job = recentJobs.find(item => item.id === pendingImport.current)
        if (job && ["completed", "failed"].includes(job.status)) {
          pendingImport.current = null
          setBusy(false)
          setCursors([null])
          setRefresh(value => value + 1)
          if (job.status === "completed") setNotice(`Excel import completed. ${job.processed} row(s) processed.`)
          else {
            setNotice("")
            setActionError(job.error || "Excel import failed.")
          }
        }
      } catch (err) {
        if (!controller.signal.aborted) setProgressError(err.response?.data?.message || "Unable to load import progress.")
      }
      if (!controller.signal.aborted) timer = setTimeout(load, 5000)
    }
    load()
    return () => { controller.abort(); clearTimeout(timer) }
  }, [])

  return (
    <section className="flex h-full min-h-0 flex-col overflow-y-auto bg-[#ADD8E6] p-3 text-xs text-slate-900 md:p-4">
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-extrabold uppercase tracking-wide text-slate-950">Customer Detail</h1>
          <p className="mt-0.5 text-xs font-medium text-sky-900">Allocated customers are highlighted in blue.</p>
        </div>
        <label className="relative w-full sm:w-80">
          <FiSearch aria-hidden="true" className="pointer-events-none absolute left-2.5 top-2.5 text-slate-500" />
          <span className="sr-only">Search Tally customers</span>
          <input type="search" value={search} maxLength={100} placeholder="Search name, phone, email or serial" className={`${fieldClass} w-full pl-8`} onChange={event => { setSearch(event.target.value); setCursors([null]) }} />
        </label>
      </div>
      <div className="mb-3 flex shrink-0 flex-wrap items-end gap-2 rounded-lg border border-slate-200 bg-white p-2.5 shadow-sm">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">Start from
          <input type="text" inputMode="numeric" maxLength={200} value={start} disabled={busy} onChange={event => setStart(event.target.value)} placeholder="First Tally serial no." className={`${fieldClass} w-36 font-normal`} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">End to
          <input type="text" inputMode="numeric" maxLength={200} value={end} disabled={busy} onChange={event => setEnd(event.target.value)} placeholder="Last Tally serial no." className={`${fieldClass} w-36 font-normal`} />
        </label>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-slate-600">Allocated to
          <select value={staffId} disabled={busy} onChange={event => setStaffId(event.target.value)} className={`${fieldClass} w-40 font-normal`}>
            <option value="">Select staff</option>
            {staff.map(member => <option key={member._id} value={member._id}>{member.name}</option>)}
          </select>
        </label>
        <button type="button" disabled={busy || !staffId || (!selected.size && !start.trim() && !end.trim())} onClick={allocate} className="h-8 rounded-lg bg-blue-700 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-40">Allocate</button>
        {selected.size > 0 && <span className="self-end py-2 text-xs text-slate-600">{selected.size} checked</span>}
        <label className={`relative ml-auto inline-flex h-8 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 ${busy ? "opacity-40" : "hover:bg-slate-50"}`}>
          <FiDownload aria-hidden="true" />
          Import
          <input aria-label="Import Excel" type="file" accept=".xlsx,.xls" disabled={busy} onChange={importExcel} className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-default" />
        </label>
      </div>
      {notice && <p role="status" className="mb-3 text-slate-700">{notice}</p>}
      {actionError && <p role="alert" className="mb-3 text-red-700">{actionError}</p>}
      {error && <p role="alert" className="mb-3 text-red-700">{error}</p>}
      <div className="min-h-32 flex-1 overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm" aria-busy={loading} tabIndex={0} role="region" aria-label="Tally customer details table">
        <table className="w-full min-w-[1200px] text-left text-xs">
          <caption className="sr-only">Tally customer contact and address details</caption>
          <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-100 text-xs font-semibold text-slate-700"><tr><th scope="col" className="pl-3"><input ref={pageCheckbox} type="checkbox" className="size-4 accent-blue-700" aria-label="Select all customers on this page" disabled={loading || busy || !rows.length} checked={rows.length > 0 && pageSelected === rows.length} onChange={event => toggleSelection(rows.map(row => row._id), event.target.checked)} /></th><th scope="col" className="px-2.5 py-2">Sl. No.</th>{columns.map(([key, label]) => <th scope="col" key={key} className="whitespace-nowrap px-2.5 py-2">{label}</th>)}</tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={columns.length + 2} className="p-10 text-center text-slate-500">Loading customer details…</td></tr> : rows.length ? rows.map((row, index) => (
              <tr key={row._id} className={`border-t border-slate-100 align-middle ${row.assignedTo ? "bg-sky-100 hover:bg-sky-200" : "even:bg-slate-50/70 hover:bg-blue-50"}`}><td className="py-2 pl-3"><input type="checkbox" className="size-4 accent-blue-700" aria-label={`Select ${row.Customer}`} disabled={busy} checked={selected.has(row._id)} onChange={event => toggleSelection([row._id], event.target.checked)} /></td><td className="px-2.5 py-2 tabular-nums text-slate-400">{(cursors.length - 1) * 50 + index + 1}</td>{columns.map(([key]) => <td key={key} className={`px-2.5 py-2 break-words ${key === "Address" ? "min-w-36 max-w-48 whitespace-pre-wrap text-slate-600" : key === "Customer" ? "min-w-32 max-w-44 font-semibold" : ["tin", "ContactNumber", "Mobilenumber"].includes(key) ? "font-mono text-xs whitespace-nowrap" : "min-w-20 max-w-40"}`}>{key === "Customer" && row.assignedTo && <span className="mb-1 inline-flex rounded-full bg-sky-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">Allocated: {row.assignedTo}</span>}{(key === "tin" ? row.tin || row.Gstno : row[key]) || <span className="text-slate-400">—</span>}</td>)}</tr>
            )) : <tr><td colSpan={columns.length + 2} className="p-10 text-center"><p className="font-medium">{error ? "Customer details unavailable" : search.trim() ? "No matching customers" : "No Tally customers yet"}</p><p className="mt-2 text-xs text-slate-500">{error ? "Try refreshing the report." : search.trim() ? "Try a different search term." : "Customer details will appear here after the first import is processed."}</p></td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex shrink-0 items-center justify-end gap-2">
        <button type="button" aria-label="Previous page" disabled={loading || cursors.length === 1} onClick={() => setCursors(value => value.slice(0, -1))} className={pageButtonClass}><FiChevronLeft aria-hidden="true" /></button>
        <span className="px-2 text-xs font-medium text-slate-700">Page {cursors.length}</span>
        <button type="button" aria-label="Next page" disabled={loading || !nextCursor} onClick={() => setCursors(value => [...value, nextCursor])} className={pageButtonClass}><FiChevronRight aria-hidden="true" /></button>
      </div>
      <details className="mt-2 shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2">
        <summary className="cursor-pointer text-xs font-semibold">Sync activity <span className="ml-2 font-normal text-slate-500">View recent imports and progress</span></summary>
        {progressError && <p role="alert" className="mt-2 text-red-700">{progressError}</p>}
        {!jobs.length && !progressError && <p className="mt-2 text-xs text-slate-500">No imports received yet.</p>}
        <ul className="mt-2 max-h-40 space-y-2 overflow-y-auto">
          {jobs.map(job => (
            <li key={job.id} className="border-b pb-2 text-xs">
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
