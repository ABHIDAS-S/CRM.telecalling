import { useMemo, useState } from "react"
import { X, Search, FileSpreadsheet } from "lucide-react"
import UseFetch from "../../hooks/useFetch"
import PropTypes from "prop-types"
import LeadAssignmentEditor from "./LeadAssignmentEditor"

const incentiveGroups = [
  { key: "lead", label: "Lead", fields: ["Lead Nos", "Lead Amt", "Incentive"] },
  { key: "followup", label: "Follow-Up Closing", fields: ["Lead Nos", "Lead Amt", "Incentive"] },
  { key: "systemStudy", label: "System Study & Demo", fields: ["Lead Nos", "Lead Amt", "Incentive Amt"] },
  { key: "testing", label: "Testing & Implementation", fields: ["Lead Nos", "Lead Amt", "Incentive Amt"] },
  { key: "coding", label: "Coding & QC", fields: ["Lead Nos", "Lead Amt", "Incentive Amt"] }
]

const getAllocationGroup = (allocation = {}) => {
  const value = `${allocation?.label || ""} ${allocation?.allocationId || ""}`.toLowerCase()
  if (value.includes("follow") && value.includes("clos")) return "followup"
  if (value.includes("system") || value.includes("demo")) return "systemStudy"
  if (value.includes("testing") || value.includes("implement")) return "testing"
  if (value.includes("coding") || value.includes("qc")) return "coding"
  if (value.includes("lead")) return "lead"
  return null
}

const getGroupMetrics = (allocations = [], groupKey) =>
  allocations.reduce((metrics, allocation) => {
    if (getAllocationGroup(allocation) !== groupKey) return metrics
    metrics.count += Number(allocation?.count || 1)
    metrics.amount += Number(allocation?.percentageBaseAmount || 0)
    metrics.incentive += Number(allocation?.amount || 0)
    return metrics
  }, { count: 0, amount: 0, incentive: 0 })

const taskFieldsForView = (group, viewMode) =>
  viewMode === "products" ? group.fields : ["Incentive Amt"]

const getLeadAmount = (lead = {}) => {
  const netAmount = Number(lead.netAmount)
  const taxAmount = Number(lead.taxAmount)
  const calculatedAmount = Number.isFinite(netAmount) && Number.isFinite(taxAmount)
    ? Math.max(netAmount - taxAmount, 0)
    : null

  return calculatedAmount !== null ? calculatedAmount : Number(lead.leadAmount || 0)
}

const TruncatedTooltip = ({ value, className = "" }) => {
  const text = String(value || "—")

  return (
    <div className="relative min-w-0">
      <span tabIndex={0} className={`peer block truncate outline-none ${className}`}>
        {text}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-[70] mt-1 w-max max-w-[22rem] -translate-y-1 whitespace-normal rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium normal-case tracking-normal text-white opacity-0 shadow-lg ring-1 ring-slate-700 transition-all duration-150 peer-hover:translate-y-0 peer-hover:opacity-100 peer-focus:translate-y-0 peer-focus:opacity-100"
      >
        {text}
        <span className="absolute -top-1 left-3 h-2 w-2 rotate-45 bg-slate-900" />
      </span>
    </div>
  )
}

TruncatedTooltip.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  className: PropTypes.string
}

export default function IncentiveLeadsModal({
  user,
  allocation,
  year,
  period,
  selectedBranch,
  canEditAssignments = false,
  onAssignmentUpdated = () => {},
  onClose = () => {}
}) {
  const [search, setSearch] = useState("")
  const [editingLead, setEditingLead] = useState(null)
  const [success, setSuccess] = useState("")
  const [viewMode, setViewMode] = useState("leads")
  const detailsUrl =
    user?.userId && selectedBranch && period && year && allocation?.key
      ? `/target/getIncentiveLeads?userId=${user.userId}&year=${year}&period=${encodeURIComponent(period)}&selectedBranch=${selectedBranch}&allocationId=${allocation.key}`
      : null
  const { data, loading, error, refreshHook } = UseFetch(detailsUrl)
  // Older detail responses omit the capability flag. Use the logged-in user's
  // permission in that case; an explicit server denial always takes precedence.
  const editingAllowed = data?.canEditAssignments ?? canEditAssignments
  const editButton = (lead) => (
    <button
      type="button"
      onClick={() => {
        setSuccess("")
        setEditingLead(lead)
      }}
      disabled={!editingAllowed || !lead.leadMongoId}
      title={
        !editingAllowed
          ? "Requires Admin or LeadReallocation permission"
          : !lead.leadMongoId
            ? "This lead has no assignment record ID"
            : "Change the assigned person"
      }
      aria-label={`Edit assigned person for lead ${lead.leadId}`}
      className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      Edit
    </button>
  )
  const leads = useMemo(
    () => (Array.isArray(data?.leads) ? data.leads : []),
    [data]
  )

  const allocationColumns = useMemo(() => {
    const columns = new Map()
    leads.forEach((lead) => {
      const allocations = lead?.allocations || []
      allocations.forEach((item) => {
        if (item?.allocationId && !columns.has(item.allocationId)) {
          columns.set(item.allocationId, {
            key: item.allocationId,
            label: item.label || "Allocation"
          })
        }
      })
    })
    return [...columns.values()]
  }, [leads])

  const filtered = leads.filter(
    (l) =>
      String(l.leadId || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      String(l.partyName || "")
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      String(l.productName || "")
        .toLowerCase()
        .includes(search.toLowerCase())
  )

  const productRows = useMemo(() => {
    const products = new Map()

    filtered.forEach((lead) => {
      const productName = lead.productName || "Unspecified product"
      if (!products.has(productName)) {
        products.set(productName, {
          productName,
          leadCount: 0,
          totalAmount: 0,
          allocationMap: new Map()
        })
      }

      const product = products.get(productName)
      product.leadCount += 1
      product.totalAmount += Number(lead.totalAmount || 0)
      ;(lead.allocations || []).forEach((allocation) => {
        const current = product.allocationMap.get(allocation.allocationId)
        if (current) {
          current.count += 1
          current.amount += Number(allocation.amount || 0)
          current.percentageBaseAmount += Number(allocation.percentageBaseAmount || 0)
        } else {
          product.allocationMap.set(allocation.allocationId, {
            ...allocation,
            count: 1,
            amount: Number(allocation.amount || 0),
            percentageBaseAmount: Number(allocation.percentageBaseAmount || 0)
          })
        }
      })
    })

    return [...products.values()]
      .map(({ allocationMap, ...product }) => ({
        ...product,
        allocations: [...allocationMap.values()]
      }))
      .sort((left, right) => left.productName.localeCompare(right.productName))
  }, [filtered])

  const rows = viewMode === "products" ? productRows : filtered

  const total = rows.reduce(
    (sum, row) => sum + Number(row.totalAmount || 0),
    0
  )
  const formatAmount = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/70 p-1.5 backdrop-blur-sm sm:p-2">
      <div className="flex max-h-[94vh] w-max max-w-[calc(100vw-0.75rem)] flex-col overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/10">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-slate-200 bg-white px-3 py-2.5 sm:px-4 sm:py-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {allocation.label}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {user.name} · {period} {year}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={viewMode === "products" ? "Search product..." : "Search lead ID or party..."}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px] font-semibold">
                <button type="button" onClick={() => setViewMode("leads")} className={`rounded-md px-2 py-1 transition ${viewMode === "leads" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Lead List</button>
                <button type="button" onClick={() => setViewMode("products")} className={`rounded-md px-2 py-1 transition ${viewMode === "products" ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Product List</button>
              </div>
              <div className="whitespace-nowrap rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">{formatAmount(total)} total</div>
            </div>
          </div>
          {success && (
            <p role="status" className="mt-2 text-sm text-green-700">
              {success}
            </p>
          )}
          {!loading && !error && !editingAllowed && (
            <p className="mt-2 text-xs text-gray-500">
              Editing assignments requires Admin or LeadReallocation permission.
            </p>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto overscroll-contain">
          {loading ? (
            <div className="p-6 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-10 rounded-lg bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-500">
              <p className="text-sm font-medium">
                Unable to load incentive leads
              </p>
              <p className="mt-1 text-xs">{error}</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FileSpreadsheet className="w-8 h-8 mb-2" />
              <p className="text-sm font-medium">No leads found</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 p-3 md:hidden">
                {rows.map((lead) => (
                  <article
                    key={viewMode === "products" ? lead.productName : lead.leadMongoId || lead.leadId}
                    className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-blue-700">
                          {viewMode === "products" ? `${lead.leadCount} leads` : lead.leadId || "—"}
                        </p>
                        <div className="text-xs text-gray-700">
                          <TruncatedTooltip value={viewMode === "products" ? lead.productName : lead.partyName} />
                        </div>
                        {viewMode === "leads" && <><div className="text-[11px] text-gray-500"><TruncatedTooltip value={lead.productName} /></div><p className="mt-0.5 text-[11px] text-gray-400">{lead.date
                            ? new Date(lead.date).toLocaleDateString("en-GB")
                            : "—"}</p><div className="mt-2 grid grid-cols-2 gap-2 text-[11px]"><span className="rounded bg-slate-50 px-2 py-1 text-slate-600">Lead amt <b className="float-right text-slate-900">{formatAmount(getLeadAmount(lead))}</b></span><span className="rounded bg-slate-50 px-2 py-1 text-slate-600">Discount <b className="float-right text-slate-900">{formatAmount(lead.discountAmount)}</b></span></div></>}
                      </div>
                      <p className="shrink-0 text-sm font-bold text-gray-900">
                        {formatAmount(lead.totalAmount)}
                      </p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3">
                      {allocationColumns.map((column) => {
                        const item = (lead.allocations || []).find(
                          (entry) => entry.allocationId === column.key
                        )
                        return (
                          <div
                            key={column.key}
                            className="rounded-lg bg-gray-50 p-2"
                          >
                            <p className="truncate text-[10px] font-semibold uppercase text-gray-400">
                              {column.label}
                            </p>
                            <p className="mt-0.5 text-xs font-semibold text-gray-800">
                              {formatAmount(item?.amount)}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                    <div className="mt-3 flex justify-end">
                      {viewMode === "leads" && editButton(lead)}
                    </div>
                  </article>
                ))}
              </div>

              <div className="hidden min-w-full md:block">
                <table className={`w-full table-fixed border-separate border-spacing-0 text-xs tabular-nums ${viewMode === "products" ? "min-w-[1600px]" : "min-w-[1250px]"}`}>
                  <colgroup>
                    {viewMode === "products" ? <col className="w-72" /> : <><col className="w-[72px]" /><col className="w-40" /><col className="w-32" /></>}
                    {incentiveGroups.flatMap((group) => taskFieldsForView(group, viewMode).map((field) => <col key={`${group.key}-${field}`} className={field === "Lead Nos" ? "w-16" : "w-[92px]"} />))}
                    <col className="w-28" />
                    {viewMode === "leads" && <><col className="w-28" /><col className="w-20" /></>}
                    {viewMode === "leads" && <col className="w-16" />}
                  </colgroup>
                  <thead className="border-b-2 border-slate-300 text-[9px] font-semibold uppercase tracking-wide text-slate-600">
                    <tr>
                      {viewMode === "products" ? <th rowSpan="2" className="sticky left-0 top-0 z-30 h-12 whitespace-nowrap border-r border-slate-300 bg-amber-300 px-2 py-0.5 text-left text-[8px] font-semibold uppercase tracking-wide text-slate-900 shadow-[4px_0_8px_-6px_rgba(15,23,42,0.45)]">Product Name</th> : <><th rowSpan="2" className="sticky left-0 top-0 z-30 h-12 whitespace-nowrap border-r border-slate-300 bg-amber-300 px-1.5 py-0.5 text-left text-[8px] font-semibold uppercase tracking-wide text-slate-900 shadow-[4px_0_8px_-6px_rgba(15,23,42,0.45)]">Lead ID</th><th rowSpan="2" className="sticky left-[72px] top-0 z-30 h-12 whitespace-nowrap border-r border-slate-300 bg-amber-300 px-1.5 py-0.5 text-left text-[8px] font-semibold uppercase tracking-wide text-slate-900 shadow-[4px_0_8px_-6px_rgba(15,23,42,0.45)]">Party Name</th><th rowSpan="2" className="sticky left-[232px] top-0 z-30 h-12 whitespace-nowrap border-r border-slate-300 bg-amber-300 px-1.5 py-0.5 text-left text-[8px] font-semibold uppercase tracking-wide text-slate-900 shadow-[4px_0_8px_-6px_rgba(15,23,42,0.45)]">Product Name</th></>}
                      {incentiveGroups.map((group, index) => (
                        <th
                          key={group.key}
                          colSpan={taskFieldsForView(group, viewMode).length}
                          className={`sticky top-0 z-20 h-6 whitespace-nowrap border-r border-slate-300 px-1 py-0 text-center text-[8px] font-semibold uppercase tracking-wide text-slate-900 ${index === 0 ? "bg-orange-200" : index === 1 ? "bg-emerald-100" : index === 2 ? "bg-slate-300" : index === 3 ? "bg-amber-200" : "bg-orange-100"}`}
                        >
                          {group.label}
                        </th>
                      ))}
                      <th rowSpan="2" className={`sticky ${viewMode === "leads" ? "right-64" : "right-0"} top-0 z-30 h-12 whitespace-nowrap bg-indigo-100 px-1.5 py-0.5 text-right text-[8px] font-semibold uppercase tracking-wide text-slate-900 shadow-[-4px_0_8px_-6px_rgba(15,23,42,0.45)]`}>
                        Total Incentive Amt
                      </th>
                      {viewMode === "leads" && <><th rowSpan="2" className="sticky right-36 top-0 z-30 h-12 whitespace-nowrap border-r border-slate-300 bg-indigo-100 px-1.5 py-0.5 text-right text-[8px] font-semibold uppercase tracking-wide text-slate-900">Lead Amt</th><th rowSpan="2" className="sticky right-16 top-0 z-30 h-12 whitespace-nowrap border-r-2 border-slate-300 bg-indigo-100 px-1.5 py-0.5 text-right text-[8px] font-semibold uppercase tracking-wide text-slate-900">Discount</th></>}
                      {viewMode === "leads" && <th rowSpan="2" className="sticky right-0 top-0 z-30 h-12 whitespace-nowrap bg-indigo-100 px-1.5 py-0.5 text-right text-[8px] font-semibold uppercase tracking-wide text-slate-900">Actions</th>}
                    </tr>
                    <tr>
                      {incentiveGroups.flatMap((group, groupIndex) => taskFieldsForView(group, viewMode).map((field, fieldIndex, fields) => (
                        <th key={`${group.key}-${field}`} className={`sticky top-6 z-20 h-6 whitespace-nowrap border-r border-slate-300 px-1 py-0 text-center text-[8px] font-semibold uppercase ${groupIndex === 0 ? "bg-orange-100" : groupIndex === 1 ? "bg-emerald-50" : groupIndex === 2 ? "bg-slate-200" : groupIndex === 3 ? "bg-amber-100" : "bg-orange-50"} ${fieldIndex === fields.length - 1 ? "border-r-2" : ""}`}>{field}</th>
                      ))) }
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((lead) => (
                      <tr
                        key={viewMode === "products" ? lead.productName : lead.leadMongoId || lead.leadId}
                        className="group relative z-0 border-t border-slate-200 bg-white transition-colors hover:z-40 hover:bg-blue-50/70"
                      >
                        {viewMode === "products" ? <td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-2 py-2.5 text-xs font-medium text-slate-800 shadow-[4px_0_8px_-6px_rgba(15,23,42,0.45)] transition-colors hover:z-50 focus-within:z-50 group-hover:bg-blue-50/70"><TruncatedTooltip value={lead.productName} /></td> : <><td className="sticky left-0 z-10 border-r border-slate-200 bg-white px-3 py-3.5 text-xs font-semibold text-blue-700 shadow-[4px_0_8px_-6px_rgba(15,23,42,0.45)] transition-colors group-hover:bg-blue-50/70">{lead.leadId || "—"}</td><td className="sticky left-[72px] z-10 border-r border-slate-200 bg-white px-2 py-2.5 text-xs text-slate-800 transition-colors hover:z-50 focus-within:z-50 group-hover:bg-blue-50/70"><TruncatedTooltip value={lead.partyName} className="font-medium" /></td><td className="sticky left-[232px] z-10 border-r border-slate-200 bg-white px-2 py-2.5 text-xs text-slate-700 shadow-[4px_0_8px_-6px_rgba(15,23,42,0.45)] transition-colors hover:z-50 focus-within:z-50 group-hover:bg-blue-50/70"><TruncatedTooltip value={lead.productName} /></td></>}
                        {incentiveGroups.flatMap((group) => {
                          const metrics = getGroupMetrics(lead.allocations, group.key)
                          return taskFieldsForView(group, viewMode).map((field, fieldIndex, fields) => <td key={`${group.key}-${field}`} className={`whitespace-nowrap border-r border-slate-200 px-1.5 py-3.5 text-right ${field === "Incentive Amt" || field === "Incentive" ? "font-semibold text-slate-900" : "font-medium text-slate-700"} ${fieldIndex === fields.length - 1 ? "border-r-2 border-slate-300" : ""}`}>{field === "Lead Nos" ? metrics.count : field === "Lead Amt" ? formatAmount(metrics.amount) : formatAmount(metrics.incentive)}</td>)
                        })}
                        <td className={`sticky ${viewMode === "leads" ? "right-64" : "right-0"} z-10 whitespace-nowrap bg-white px-2 py-2.5 text-right text-xs font-bold text-slate-900 shadow-[-4px_0_8px_-6px_rgba(15,23,42,0.45)] transition-colors group-hover:bg-blue-50/70`}>
                          {formatAmount(lead.totalAmount)}
                        </td>
                        {viewMode === "leads" && <><td className="sticky right-36 z-10 whitespace-nowrap border-r border-slate-200 bg-white px-1.5 py-2.5 text-right text-xs font-medium text-slate-700 transition-colors group-hover:bg-blue-50/70">{formatAmount(getLeadAmount(lead))}</td><td className="sticky right-16 z-10 whitespace-nowrap border-r-2 border-slate-300 bg-white px-1.5 py-2.5 text-right text-xs font-medium text-slate-700 transition-colors group-hover:bg-blue-50/70">{formatAmount(lead.discountAmount)}</td></>}
                        {viewMode === "leads" && <td className="sticky right-0 z-10 bg-white px-2 py-3 text-right transition-colors group-hover:bg-blue-50/70">{editButton(lead)}</td>}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-slate-400 bg-slate-50 text-xs font-bold text-slate-800">
                    <tr>
                      {viewMode === "products" ? <td className="sticky left-0 z-10 whitespace-nowrap bg-slate-50 px-3 py-3 shadow-[4px_0_8px_-6px_rgba(15,23,42,0.45)]">Total</td> : <><td className="sticky left-0 z-10 whitespace-nowrap bg-slate-50 px-3 py-3 shadow-[4px_0_8px_-6px_rgba(15,23,42,0.45)]">Total</td><td className="sticky left-[72px] z-10 bg-slate-50 px-2 py-2.5" /><td className="sticky left-[232px] z-10 bg-slate-50 px-2 py-2.5 shadow-[4px_0_8px_-6px_rgba(15,23,42,0.45)]" /></>}
                      {incentiveGroups.flatMap((group) => {
                        const metrics = rows.reduce((totalMetrics, lead) => {
                          const leadMetrics = getGroupMetrics(lead.allocations, group.key)
                          totalMetrics.count += leadMetrics.count
                          totalMetrics.amount += leadMetrics.amount
                          totalMetrics.incentive += leadMetrics.incentive
                          return totalMetrics
                        }, { count: 0, amount: 0, incentive: 0 })
                        return taskFieldsForView(group, viewMode).map((field, fieldIndex, fields) => <td key={`${group.key}-total-${field}`} className={`whitespace-nowrap border-r border-slate-200 px-1.5 py-3 text-right ${fieldIndex === fields.length - 1 ? "border-r-2 border-slate-300" : ""}`}>{field === "Lead Nos" ? metrics.count : field === "Lead Amt" ? formatAmount(metrics.amount) : formatAmount(metrics.incentive)}</td>)
                      })}
                      <td className={`sticky ${viewMode === "leads" ? "right-64" : "right-0"} z-10 whitespace-nowrap bg-slate-50 px-2 py-2.5 text-right shadow-[-4px_0_8px_-6px_rgba(15,23,42,0.45)]`}>{formatAmount(total)}</td>
                      {viewMode === "leads" && <><td className="sticky right-36 z-10 whitespace-nowrap border-r border-slate-200 bg-slate-50 px-1.5 py-3 text-right">{formatAmount(rows.reduce((sum, lead) => sum + getLeadAmount(lead), 0))}</td><td className="sticky right-16 z-10 whitespace-nowrap border-r-2 border-slate-300 bg-slate-50 px-1.5 py-3 text-right">{formatAmount(rows.reduce((sum, lead) => sum + Number(lead.discountAmount || 0), 0))}</td></>}
                      {viewMode === "leads" && <td className="sticky right-0 z-10 bg-slate-50 px-2 py-3" />}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      {editingLead && (
        <LeadAssignmentEditor
          key={editingLead.leadMongoId}
          lead={editingLead}
          onClose={() => setEditingLead(null)}
          onSaved={() => {
            setEditingLead(null)
            setSuccess(
              "Assigned person updated. Incentive reports are refreshing."
            )
            refreshHook()
            onAssignmentUpdated()
          }}
        />
      )}
    </div>
  )
}

IncentiveLeadsModal.propTypes = {
  user: PropTypes.shape({
    userId: PropTypes.string.isRequired,
    name: PropTypes.string
  }).isRequired,
  allocation: PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.string
  }).isRequired,
  year: PropTypes.number.isRequired,
  period: PropTypes.string.isRequired,
  selectedBranch: PropTypes.string.isRequired,
  canEditAssignments: PropTypes.bool,
  onAssignmentUpdated: PropTypes.func,
  onClose: PropTypes.func
}
