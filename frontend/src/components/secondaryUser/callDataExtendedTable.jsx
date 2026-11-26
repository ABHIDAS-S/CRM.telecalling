
import React, { useState, useMemo } from "react"
import { FaPhone } from "react-icons/fa"
import { PropagateLoader } from "react-spinners"
import { getCallDescription, isWebsiteComplaint } from "../../utils/callDescription"
import "./WebsiteComplaintRow.css"

// Production Reusable Cell Architecture for handling Truncation and Clean Tooltips
const TruncatedTooltipCell = ({ value, className = "" }) => {
  const displayValue = value || "N/A"
  
  return (
    <td className={`border-b border-slate-300 px-2 py-1.5 align-middle text-slate-800 ${className}`}>
      <div className="group relative max-w-full">
        <div className="truncate px-0.5 py-0.5 cursor-pointer">
          {displayValue}
        </div>
        {value && (
          <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-72 -translate-y-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] leading-relaxed text-slate-700 opacity-0 shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
            <div className="whitespace-normal break-words text-slate-800">
              {value}
            </div>
            <div className="absolute -bottom-1.5 left-4 h-3 w-3 rotate-45 border-b border-r border-slate-200 bg-white" />
          </div>
        )}
      </div>
    </td>
  )
}

// Stacked Layout Renderer to optimize screen space for timestamps
const CompactDateTimeCell = ({ dateString, isSolved = true }) => {
  const parsed = useMemo(() => {
    if (!isSolved || !dateString) return { date: "", time: "" }
    const dateObj = new Date(dateString)
    if (isNaN(dateObj.getTime())) return { date: "Invalid", time: "" }

    return {
      date: dateObj.toLocaleDateString("en-GB"), // DD/MM/YYYY
      time: dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      })
    }
  }, [dateString, isSolved])

  if (!isSolved || !dateString) return <td className="border-b border-slate-300 px-2 py-1.5 text-center text-slate-400">—</td>

  return (
    <td className="border-b border-slate-300 px-2 py-1.5 align-middle whitespace-nowrap">
      <div className="flex flex-col leading-tight">
        <span className="font-medium text-slate-800">{parsed.date}</span>
        <span className="text-[10px] text-slate-500 font-normal">{parsed.time}</span>
      </div>
    </td>
  )
}

export default function CallDataExtendedTable({
  from = null,
  callData,
  isModalOpen,
  userBranch,
  maxHeight = "500px",
  users,
  navigate,
  loadingcounts,
  viewcall = false
}) {
  const [expandedRows, setExpandedRows] = useState({})
  const showCustomerColumn = from === "callregistration"

  // Mathematical allocation engine ensuring total structural width adds up precisely to 100%
  const layoutConfiguration = useMemo(() => {
    const baseConfig = {
      toggle: "w-[4%]",
      token: "w-[10%]",
      product: "w-[16%]",
      startDate: "w-[10%]",
      endDate: "w-[10%]",
      duration: "w-[9%]",
      description: "w-[18%]",
      incomingNo: "w-[13%]",
      status: "w-[10%]"
    }

    let columnsCount = 9

    if (showCustomerColumn) {
      columnsCount += 1
      baseConfig.token = "w-[8%]"
      baseConfig.customer = "w-[12%]"
      baseConfig.product = "w-[13%]"
      baseConfig.description = "w-[13%]"
    }

    if (viewcall) {
      columnsCount += 1
      baseConfig.callAction = "w-[7%]"
      // Adjust remaining metrics to balance out the view action column footprint
      if (!showCustomerColumn) {
        baseConfig.description = "w-[15%]"
        baseConfig.incomingNo = "w-[11%]"
      } else {
        baseConfig.incomingNo = "w-[10%]"
      }
    }

    return { widths: baseConfig, totalColumns: columnsCount }
  }, [showCustomerColumn, viewcall])

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0h 0m 0s"
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs}h ${mins}m ${secs}s`
  }

  const sortedCallData = useMemo(() => {
    if (!callData) return []
    return [...callData].sort((a, b) => {
      if (a.formdata?.status === "pending" && b.formdata?.status !== "pending") return -1
      if (a.formdata?.status !== "pending" && b.formdata?.status === "pending") return 1

      const timeA = new Date(a.timedata?.startTime || 0).getTime()
      const timeB = new Date(b.timedata?.startTime || 0).getTime()
      return timeB - timeA
    })
  }, [callData])

  return (
    <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-300 bg-slate-50 shadow-[0_8px_24px_rgba(15,23,42,0.10)]">
      {/* Container level enforcement protecting overflow layouts */}
      <div className="overflow-x-hidden overflow-y-auto" style={{ maxHeight }}>
        <table className="w-full table-fixed border-separate border-spacing-0 text-[11px] text-slate-700 md:text-xs">
          <thead className={`sticky top-0 ${isModalOpen ? "z-10" : "z-40"} bg-slate-200`}>
            <tr className="bg-gradient-to-r from-slate-300 via-slate-200 to-slate-100 shadow-[inset_0_-1px_0_rgba(100,116,139,0.35)] select-none">
              <th className={`${layoutConfiguration.widths.toggle} border-b border-slate-300 px-2 py-2.5 text-center font-bold text-slate-700`}></th>
              <th className={`${layoutConfiguration.widths.token} border-b border-slate-300 px-2 py-2.5 text-left font-bold text-slate-700`}>Token No</th>
              {showCustomerColumn && (
                <th className={`${layoutConfiguration.widths.customer} border-b border-slate-300 px-2 py-2.5 text-left font-bold text-slate-700 whitespace-nowrap`}>Customer</th>
              )}
              <th className={`${layoutConfiguration.widths.product} border-b border-slate-300 px-2 py-2.5 text-left font-bold text-slate-700`}>Product Name</th>
              <th className={`${layoutConfiguration.widths.startDate} border-b border-slate-300 px-2 py-2.5 text-left font-bold text-slate-700`}>Start Date</th>
              <th className={`${layoutConfiguration.widths.endDate} border-b border-slate-300 px-2 py-2.5 text-left font-bold text-slate-700`}>End Date</th>
              <th className={`${layoutConfiguration.widths.duration} border-b border-slate-300 px-2 py-2.5 text-left font-bold text-slate-700`}>Duration</th>
              <th className={`${layoutConfiguration.widths.description} border-b border-slate-300 px-2 py-2.5 text-left font-bold text-slate-700`}>Description</th>
              <th className={`${layoutConfiguration.widths.incomingNo} border-b border-slate-300 px-2 py-2.5 text-left font-bold text-slate-700`}>Incoming No</th>
              <th className={`${layoutConfiguration.widths.status} border-b border-slate-300 px-2 py-2.5 text-left font-bold text-slate-700`}>Status</th>
              {viewcall && (
                <th className={`${layoutConfiguration.widths.callAction} border-b border-slate-300 px-2 py-2.5 text-center font-bold text-slate-700`}>Call</th>
              )}
            </tr>
          </thead>

          <tbody>
            {sortedCallData?.length > 0 ? (
              sortedCallData.map((call, index) => {
                if (userBranch && !userBranch.some((branch) => call.branchName?.includes(branch))) {
                  return null
                }

                const today = new Date().toISOString().split("T")[0]
                const startTimeRaw = call?.timedata?.startTime
                const callDate = startTimeRaw ? startTimeRaw.split(" ")[0] : null

                const isSolved = call.formdata?.status === "solved"
                const isPending = call.formdata?.status === "pending"
                const isTodayPending = isPending && callDate === today

                const rowKey = `${call?.timedata?.token || "token"}-${index}`
                const isExpanded = !!expandedRows[rowKey]

                const rowClass = isSolved
                  ? "bg-gradient-to-r from-emerald-300/90 via-green-200/90 to-teal-100/90 hover:from-emerald-400 hover:via-green-300 hover:to-teal-200"
                  : isTodayPending
                    ? "bg-gradient-to-r from-amber-300/90 via-orange-200/90 to-yellow-100/90 hover:from-amber-400 hover:via-orange-300 hover:to-yellow-200"
                    : "bg-gradient-to-r from-rose-300/90 via-red-200/90 to-pink-100/90 hover:from-rose-400 hover:via-red-300 hover:to-pink-200"

                return (
                  <React.Fragment key={rowKey}>
                    <tr className={`transition-all duration-150 ${rowClass} ${isWebsiteComplaint(call) ? "website-complaint-row" : ""}`}>
                      <td className="border-b border-slate-300 px-1 py-1 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => setExpandedRows((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }))}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 bg-white/90 text-[9px] font-bold text-slate-700 shadow-sm transition hover:bg-white active:scale-95"
                        >
                          <span className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}>▼</span>
                        </button>
                      </td>

                      <td className="break-words border-b border-slate-300 px-2 py-1.5 align-middle text-slate-900 font-semibold tracking-wide">
                        {call.timedata?.token || "N/A"}
                      </td>
                      {showCustomerColumn && <TruncatedTooltipCell value={call?.customerName} className="text-slate-900 font-medium" />}
                      
                      <td className="break-words border-b border-slate-300 px-2 py-1.5 align-middle text-slate-900 leading-tight">
                        {call.product?.productName || call?.productDetails?.[0]?.productName || "N/A"}
                      </td>

                      <CompactDateTimeCell dateString={call.timedata?.startTime} isSolved={true} />
                      <CompactDateTimeCell dateString={call.timedata?.endTime} isSolved={isSolved} />

                      <TruncatedTooltipCell value={formatDuration(call?.timedata?.duration)} className="font-medium text-slate-700" />
                      <TruncatedTooltipCell value={getCallDescription(call?.formdata?.description)} />
                      <TruncatedTooltipCell value={call.formdata?.incomingNumber} className="font-mono tracking-tight" />

                      <td className="whitespace-nowrap border-b border-slate-300 px-2 py-1.5 align-middle capitalize text-slate-900 font-bold">
                        {call.formdata?.status || "N/A"}
                      </td>

                      {viewcall && (
                        <td className="border-b border-slate-300 px-2 py-1.5 text-center align-middle">
                          {!isSolved && (
                            <button
                              type="button"
                              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-b from-blue-600 to-indigo-700 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)] transition hover:scale-105 hover:from-blue-700 hover:to-indigo-800 active:scale-95"
                              onClick={() => {
                                const routePrefix = users?.role === "Admin" ? "/admin" : "/staff"
                                if (navigate) {
                                  navigate(`${routePrefix}/transaction/call-registration`, {
                                    state: { calldetails: call?._id, token: call?.timedata?.token }
                                  })
                                }
                              }}
                            >
                              <FaPhone className="text-[10px]" />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>

                    {isExpanded && (
                      <tr className={isSolved ? "bg-emerald-100/60" : "bg-slate-100/80"}>
                        <td className="border-b border-slate-300 px-1 py-0.5"></td>
                        <td colSpan={showCustomerColumn ? 3 : 2} className="border-b border-slate-300 px-3 py-2 align-top">
                          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Solution</div>
                          <span className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shadow-sm ${
                            isSolved ? "bg-emerald-700 text-white" : isTodayPending ? "bg-orange-600 text-white" : "bg-rose-600 text-white"
                          }`}>
                            {call?.formdata?.solution || "N/A"}
                          </span>
                        </td>
                        <td colSpan={3} className="border-b border-slate-300 px-3 py-2 align-top">
                          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Attended By</div>
                          <div className="mt-1 text-[11px] font-medium text-slate-800">
                            {Array.isArray(call?.formdata?.attendedBy)
                              ? call.formdata.attendedBy.map((att) => att?.callerId?.name || att?.name).join(", ") || "N/A"
                              : call?.formdata?.attendedBy?.callerId?.name || "N/A"}
                          </div>
                        </td>
                        <td colSpan={viewcall ? 4 : 3} className="border-b border-slate-300 px-3 py-2 align-top">
                          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Completed By</div>
                          <div className="mt-1 text-[11px] font-medium text-slate-800">
                            {isSolved
                              ? Array.isArray(call?.formdata?.completedBy)
                                ? call.formdata.completedBy.map((comp) => comp?.callerId?.name || comp?.name).join(", ") || "N/A"
                                : call?.formdata?.completedBy?.callerId?.name || "N/A"
                              : "N/A"}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })
            ) : (
              <tr>
                <td colSpan={layoutConfiguration.totalColumns} className="px-3 py-12 text-center text-xs text-slate-400">
                  {loadingcounts ? (
                    <div className="flex justify-center py-2">
                      <PropagateLoader color="#3b82f6" size={10} />
                    </div>
                  ) : (
                    <div className="font-semibold tracking-wide text-slate-500 bg-slate-200/50 inline-block px-4 py-2 rounded-lg border border-slate-300/60">
                      No Calls Found
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
