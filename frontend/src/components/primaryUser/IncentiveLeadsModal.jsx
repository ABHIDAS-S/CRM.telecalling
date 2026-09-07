// // import { useEffect, useState } from "react"
// // import { X, Search, FileSpreadsheet } from "lucide-react"

// // export default function IncentiveLeadsModal({
// //   user,
// //   allocation,
// //   month,
// //   year,
// //   monthLabel,
// //   fetchIncentiveLeads,
// //   onClose
// // }) {
// //   const [loading, setLoading] = useState(true)
// //   const [leads, setLeads] = useState([])
// //   const [search, setSearch] = useState("")

// //   useEffect(() => {
// //     let active = true
// //     const load = async () => {
// //       setLoading(true)
// //       try {
// //         const res = await fetchIncentiveLeads({
// //           userId: user.userId,
// //           allocationKey: allocation.key,
// //           month,
// //           year
// //         })
// //         if (active) setLeads(res || [])
// //       } catch (e) {
// //         console.log(e)
// //       } finally {
// //         if (active) setLoading(false)
// //       }
// //     }
// //     load()
// //     return () => {
// //       active = false
// //     }
// //   }, [user, allocation, month, year])

// //   const filtered = leads.filter(
// //     (l) =>
// //       l.leadId?.toLowerCase().includes(search.toLowerCase()) ||
// //       l.partyName?.toLowerCase().includes(search.toLowerCase())
// //   )

// //   const total = filtered.reduce((sum, l) => sum + (l.amount || 0), 0)

// //   return (
// //     <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-[60] p-3 sm:p-4">
// //       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
// //         {/* Header */}
// //         <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100">
// //           <div className="flex items-start justify-between gap-4">
// //             <div>
// //               <h2 className="text-base font-bold text-gray-900">{allocation.label}</h2>
// //               <p className="text-xs text-gray-500 mt-0.5">
// //                 {user.name} · {monthLabel} {year}
// //               </p>
// //             </div>
// //             <button
// //               onClick={onClose}
// //               className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors flex-shrink-0"
// //             >
// //               <X className="w-5 h-5" />
// //             </button>
// //           </div>

// //           <div className="flex items-center justify-between mt-3 gap-3">
// //             <div className="relative flex-1 max-w-xs">
// //               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
// //               <input
// //                 value={search}
// //                 onChange={(e) => setSearch(e.target.value)}
// //                 placeholder="Search lead ID or party..."
// //                 className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
// //               />
// //             </div>
// //             <div className="text-xs font-semibold text-gray-500 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full whitespace-nowrap">
// //               ₹{total.toLocaleString()} total
// //             </div>
// //           </div>
// //         </div>

// //         {/* Table */}
// //         <div className="flex-1 overflow-y-auto">
// //           {loading ? (
// //             <div className="p-6 space-y-2">
// //               {Array.from({ length: 5 }).map((_, i) => (
// //                 <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
// //               ))}
// //             </div>
// //           ) : filtered.length === 0 ? (
// //             <div className="flex flex-col items-center justify-center py-16 text-gray-400">
// //               <FileSpreadsheet className="w-8 h-8 mb-2" />
// //               <p className="text-sm font-medium">No leads found</p>
// //             </div>
// //           ) : (
// //             <table className="min-w-full">
// //               <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
// //                 <tr>
// //                   <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
// //                     Lead ID
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
// //                     Party Name
// //                   </th>
// //                   <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
// //                     Date
// //                   </th>
// //                   <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
// //                     Amount
// //                   </th>
// //                 </tr>
// //               </thead>
// //               <tbody className="divide-y divide-gray-50">
// //                 {filtered.map((lead, i) => (
// //                   <tr key={`${lead.leadId}-${i}`} className="hover:bg-blue-50/40 transition-colors">
// //                     <td className="px-6 py-3.5 text-sm font-semibold text-blue-700">
// //                       {lead.leadId}
// //                     </td>
// //                     <td className="px-6 py-3.5 text-sm text-gray-800">{lead.partyName}</td>
// //                     <td className="px-6 py-3.5 text-sm text-gray-500">
// //                       {lead.date
// //                         ? new Date(lead.date).toLocaleDateString("en-GB", {
// //                             day: "2-digit",
// //                             month: "short",
// //                             year: "numeric"
// //                           })
// //                         : "—"}
// //                     </td>
// //                     <td className="px-6 py-3.5 text-sm font-semibold text-gray-900 text-right">
// //                       ₹{Number(lead.amount || 0).toLocaleString()}
// //                     </td>
// //                   </tr>
// //                 ))}
// //               </tbody>
// //             </table>
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   )
// // }


// import { useEffect, useState } from "react"
// import { X, Search, FileSpreadsheet } from "lucide-react"

// export default function IncentiveLeadsModal({
//   user,
//   allocation,
//   month,
//   year,
//   monthLabel,
//   fetchIncentiveLeads,
//   onClose
// }) {
//   const [loading, setLoading] = useState(true)
//   const [leads, setLeads] = useState([])
//   const [search, setSearch] = useState("")

//   useEffect(() => {
//     let active = true
//     const load = async () => {
//       setLoading(true)
//       try {
//         const res = await fetchIncentiveLeads({
//           userId: user.userId,
//           allocationKey: allocation.key,
//           month,
//           year
//         })
//         if (active) setLeads(res || [])
//       } catch (e) {
//         console.log(e)
//       } finally {
//         if (active) setLoading(false)
//       }
//     }
//     load()
//     return () => {
//       active = false
//     }
//   }, [user, allocation, month, year, fetchIncentiveLeads])

//   const filtered = leads.filter(
//     (l) =>
//       l.leadId?.toLowerCase().includes(search.toLowerCase()) ||
//       l.partyName?.toLowerCase().includes(search.toLowerCase())
//   )
// console.log(leads)
// console.log(filtered)
//   const total = filtered.reduce((sum, l) => sum + (l.amount || 0), 0)

//   return (
//     <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-[60] p-3 sm:p-4">
//       <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
//         {/* Header */}
//         <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100">
//           <div className="flex items-start justify-between gap-4">
//             <div>
//               <h2 className="text-base font-bold text-gray-900">{allocation.label}</h2>
//               <p className="text-xs text-gray-500 mt-0.5">
//                 {user.name} · {monthLabel} {year}
//               </p>
//             </div>
//             <button
//               onClick={onClose}
//               className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-1.5 transition-colors flex-shrink-0"
//             >
//               <X className="w-5 h-5" />
//             </button>
//           </div>

//           <div className="flex items-center justify-between mt-3 gap-3">
//             <div className="relative flex-1 max-w-xs">
//               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
//               <input
//                 value={search}
//                 onChange={(e) => setSearch(e.target.value)}
//                 placeholder="Search lead ID or party..."
//                 className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
//               />
//             </div>
//             <div className="text-xs font-semibold text-gray-500 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full whitespace-nowrap">
//               ₹{total.toLocaleString()} total
//             </div>
//           </div>
//         </div>

//         {/* Table */}
//         <div className="flex-1 overflow-y-auto">
//           {loading ? (
//             <div className="p-6 space-y-2">
//               {Array.from({ length: 5 }).map((_, i) => (
//                 <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
//               ))}
//             </div>
//           ) : filtered.length === 0 ? (
//             <div className="flex flex-col items-center justify-center py-16 text-gray-400">
//               <FileSpreadsheet className="w-8 h-8 mb-2" />
//               <p className="text-sm font-medium">No leads found</p>
//             </div>
//           ) : (
//             <table className="min-w-full">
//               <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
//                 <tr>
//                   <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
//                     Lead ID
//                   </th>
//                   <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
//                     Party Name
//                   </th>
//                   <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
//                     Date
//                   </th>
//                   <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
//                     Amount
//                   </th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-50">
//                 {filtered.map((lead, i) => (
//                   <tr
//                     key={`${lead.leadId}-${i}`}
//                     className="hover:bg-blue-50/40 transition-colors"
//                   >
//                     <td className="px-6 py-3.5 text-sm font-semibold text-blue-700">
//                       {lead.leadId}
//                     </td>
//                     <td className="px-6 py-3.5 text-sm text-gray-800">
//                       {lead.partyName}
//                     </td>
//                     <td className="px-6 py-3.5 text-sm text-gray-500">
//                       {lead.date
//                         ? new Date(lead.date).toLocaleDateString("en-GB", {
//                             day: "2-digit",
//                             month: "short",
//                             year: "numeric"
//                           })
//                         : "—"}
//                     </td>
//                     <td className="px-6 py-3.5 text-sm font-semibold text-gray-900 text-right">
//                       ₹{Number(lead.amount || 0).toLocaleString()}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>
//     </div>
//   )
// }
import { useMemo, useState } from "react"
import { X, Search, FileSpreadsheet } from "lucide-react"
import UseFetch from "../../hooks/useFetch"
import PropTypes from "prop-types"

export default function IncentiveLeadsModal({
  user,
  allocation,
  year,
  period,
  selectedBranch,
  onClose = () => {}
}) {
  const [search, setSearch] = useState("")
  const detailsUrl =
    user?.userId && selectedBranch && period && year && allocation?.key
      ? `/target/getIncentiveLeads?userId=${user.userId}&year=${year}&period=${encodeURIComponent(period)}&selectedBranch=${selectedBranch}&allocationId=${allocation.key}`
      : null
  const { data, loading, error } = UseFetch(detailsUrl)
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
      String(l.leadId || "").toLowerCase().includes(search.toLowerCase()) ||
      String(l.partyName || "").toLowerCase().includes(search.toLowerCase())
  )

  const total = filtered.reduce(
    (sum, lead) => sum + Number(lead.totalAmount || 0),
    0
  )
  const formatAmount = (value) =>
    `₹${Number(value || 0).toLocaleString("en-IN")}`

  return (
    <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm flex items-center justify-center z-[60] p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-gray-900">{allocation.label}</h2>
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

          <div className="flex items-center justify-between mt-3 gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search lead ID or party..."
                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="text-xs font-semibold text-gray-500 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full whitespace-nowrap">
              {formatAmount(total)} total
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-red-500">
              <p className="text-sm font-medium">Unable to load incentive leads</p>
              <p className="mt-1 text-xs">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <FileSpreadsheet className="w-8 h-8 mb-2" />
              <p className="text-sm font-medium">No leads found</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 p-3 md:hidden">
                {filtered.map((lead) => (
                  <article
                    key={lead.leadMongoId || lead.leadId}
                    className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-blue-700">
                          {lead.leadId || "—"}
                        </p>
                        <p className="truncate text-xs text-gray-700">
                          {lead.partyName || "—"}
                        </p>
                        <p className="mt-0.5 text-[11px] text-gray-400">
                          {lead.date
                            ? new Date(lead.date).toLocaleDateString("en-GB")
                            : "—"}
                        </p>
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
                          <div key={column.key} className="rounded-lg bg-gray-50 p-2">
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
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full whitespace-nowrap">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    Lead ID
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    Party Name
                  </th>
                  <th className="px-6 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    Date
                  </th>
                  {allocationColumns.map((column) => (
                    <th
                      key={column.key}
                      className="px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500"
                    >
                      {column.label}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((lead) => (
                  <tr
                    key={lead.leadMongoId || lead.leadId}
                    className="hover:bg-blue-50/40 transition-colors"
                  >
                    <td className="px-6 py-3.5 text-sm font-semibold text-blue-700">
                      {lead.leadId}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-800">
                      {lead.partyName}
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-500">
                      {lead.date
                        ? new Date(lead.date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })
                        : "—"}
                    </td>
                    {allocationColumns.map((column) => {
                      const item = (lead.allocations || []).find(
                        (entry) => entry.allocationId === column.key
                      )
                      return (
                        <td
                          key={column.key}
                          className="px-4 py-3.5 text-center text-sm font-semibold text-gray-700"
                        >
                          {formatAmount(item?.amount)}
                        </td>
                      )
                    })}
                    <td className="px-6 py-3.5 text-sm font-semibold text-gray-900 text-right">
                      {formatAmount(lead.totalAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
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
  onClose: PropTypes.func
}
