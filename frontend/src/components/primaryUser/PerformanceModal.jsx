import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import PropTypes from "prop-types"
import { BellRing, Eye } from "lucide-react"
import api from "../../api/api"
import { LeadhistoryModal } from "./LeadhistoryModal"

import { FancySelect } from "../common/FancySelect"
export function PerformanceModal({
  modalOpen,
  open,
  periodmode,
  categoryId,
  loggedUser,
  splitType,
  selectedperiod,
  allperiods,
  onselectedPeriodChange,
  productlist,
setproductList,
  onClose,
  summary,
  products,
  selectedMonth,
  // selectedYear,
  onMonthChange,
  onYearChange,
  targetData,
  yearSelected,
  // loggedUser,
  category,
  handleSelectedUser,
  selectedUser,
  activeUserId
}) {
console.log(productlist)
console.log(products)
  console.log(periodmode)
  console.log(selectedperiod)
  console.log(selectedMonth)
  console.log(category)
  console.log(selectedUser)
  console.log(targetData)
  console.log(open)
  console.log(modalOpen)
  console.log(loggedUser)
  console.log(selectedUser)
  console.log(selectedUser)
  console.log(productlist)
  console.log(modalOpen)
  console.log(targetData)
  console.log(selectedperiod)
  console.log(allperiods)
  const [selectedDatapopup, setselectedDataPopup] = useState({})
  const [achievedLeadDrilldown, setAchievedLeadDrilldown] = useState(null)
  const [historyDialog, setHistoryDialog] = useState(null)
  const [activeMetric, setActiveMetric] = useState("achieved")
  const [allusersData, setallusersData] = useState([])
  const [userwisetargetData, setuserwisetargetdata] = useState({})
  const [localSelectedPeriod, setLocalSelectedPeriod] = useState(
    targetData?.selectedPeriodName || ""
  )
  const now = new Date()
  const [periodMode, setperiodMode] = useState(periodmode)
  console.log(periodMode)
  const [selectedYear, setSelectedYear] = useState(yearSelected)
  console.log(targetData?.selectedPeriodName)
  console.log(localSelectedPeriod)
  const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ]

  const MONTH_NAME_TO_NUM = {
    january: 1,
    february: 2,
    march: 3,
    april: 4,
    may: 5,
    june: 6,
    july: 7,
    august: 8,
    september: 9,
    october: 10,
    november: 11,
    december: 12
  }

  const getPeriodRange = (periodLabel) => {
    if (!periodLabel) return null
    console.log("hhh")
    const cleaned = String(periodLabel).trim()
    const match = cleaned.match(/^([A-Za-z]+)\s*-\s*([A-Za-z]+)\s+(\d{4})$/)

    if (!match) return null

    const [, startMonthName, endMonthName, year] = match
    const startNum = MONTH_NAME_TO_NUM[startMonthName.toLowerCase()]
    const endNum = MONTH_NAME_TO_NUM[endMonthName.toLowerCase()]

    if (!startNum || !endNum) return null

    return {
      startNum,
      endNum,
      year: Number(year),
      displayLabel: `${startMonthName} - ${endMonthName}`
    }
  }

  useEffect(() => {
    setLocalSelectedPeriod(targetData?.selectedPeriodName || "")
    setperiodMode(periodmode)
    setSelectedYear(yearSelected)
  }, [targetData?.selectedPeriodName, periodmode, yearSelected])
  console.log(categoryId)
  console.log(targetData)
  const userWiseResults = Array.isArray(targetData?.userWiseResults)
    ? targetData.userWiseResults
    : []
  useEffect(() => {
    if (
      categoryId &&
      targetData &&
      typeof targetData === "object" &&
      !Array.isArray(targetData)
    ) {
      const filteredselectedCategory = userWiseResults
        .flatMap((user) => user.categories || [])
        .filter((item) => item.categoryId === categoryId)
      console.log("Hh")
      const summary = filteredselectedCategory.reduce(
        (acc, cur) => {
          acc.target += Number(cur.target || 0)
          acc.achieved += Number(cur.achieved || 0)
          acc.balance += Number(cur.balance || 0)
          return acc
        },
        { target: 0, achieved: 0, balance: 0 }
      )
      console.log(summary)
      setselectedDataPopup(summary)
     
    }
  }, [targetData, categoryId, userWiseResults])

  const periodOptions = useMemo(() => {
    return (targetData?.periods || []).map((period) => {
      const parsed = getPeriodRange(period)
      return {
        value: period,
        label: parsed?.displayLabel || String(period).replace(/\s+\d{4}$/, "")
      }
    })
  }, [targetData?.periods])
  console.log(periodOptions)
  const monthOptions = useMemo(() => {
    const parsed = getPeriodRange(localSelectedPeriod)

    if (!parsed) {
      return [{ value: "all", label: "All" }]
    }

    const options = [{ value: "all", label: "All" }]

    for (let i = parsed.startNum; i <= parsed.endNum; i++) {
      options.push({
        value: String(i),
        label: MONTHS[i - 1]
      })
    }

    return options
  }, [localSelectedPeriod])

  const yearOptions = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const year = new Date().getFullYear() - i
      return { value: String(year), label: String(year) }
    })
  }, [])
  console.log(targetData)
  // const handleMetricTab = (tab) => {
  //   setActiveMetric(tab)
  //   console.log(tab)
  //   const result =
  //     targetData?.userWiseResults
  //       ?.filter((user) =>
  //         user.categories?.some(
  //           (cat) => String(cat.categoryId) === String(categoryId)&&cat.measurementType !== "incentive"
  //         )
  //       )
  //       .map((user) => {
  //         const matchedCategories = (user.categories || []).filter(
  //           (cat) => String(cat.categoryId) === String(category?.Id)&& cat.measurementType !== "incentive"
  //         )

  //         const aggregated = matchedCategories.reduce(
  //           (acc, cat) => {
  //             acc.target += Number(cat.target || 0)
  //             acc.achieved += Number(cat.achieved || 0)
  //             acc.balance += Number(cat.balance || 0)
  //             return acc
  //           },
  //           { target: 0, achieved: 0, balance: 0 }
  //         )

  //         let amount = 0

  //         if (tab === "achieved") {
  //           amount = aggregated.achieved
  //         } else if (tab === "balance") {
  //           amount =
  //             aggregated.achieved > aggregated.target ? 0 : aggregated.balance
  //         } else {
  //           amount = aggregated.target
  //         }

  //         return {
  //           userId: user.userId,
  //           userName: user.userName,
  //           amount: Number(amount || 0)
  //         }
  //       }) || []
  //   console.log(result)
  //   setallusersData(result)
  // }
const handleMetricTab = (tab) => {
  setActiveMetric(tab);

  const currentCategoryId = String(categoryId || "");

  if (!currentCategoryId) {
    setallusersData([]);
    return;
  }

  const result = (targetData?.userWiseResults || [])
    .filter((user) =>
      (user.categories || []).some(
        (cat) =>
          String(cat.categoryId) === currentCategoryId &&
          cat.measurementType !== "incentive"
      )
    )
    .map((user) => {
      const matchedCategories = (user.categories || []).filter(
        (cat) =>
          String(cat.categoryId) === currentCategoryId &&
          cat.measurementType !== "incentive"
      );

      const aggregated = matchedCategories.reduce(
        (acc, cat) => {
          acc.target += Number(cat.target || 0);
          acc.achieved += Number(cat.achieved || 0);
          acc.balance += Number(cat.balance || 0);

          return acc;
        },
        {
          target: 0,
          achieved: 0,
          balance: 0,
        }
      );

      let amount = 0;

      if (tab === "achieved") {
        amount = aggregated.achieved;
      } else if (tab === "balance") {
        amount = Math.max(0, aggregated.balance);
      } else {
        amount = aggregated.target;
      }

      return {
        userId: user.userId,
        userName: user.userName,
        designation: user.designation || "",
        achievedLeads: matchedCategories.flatMap((cat) =>
          Array.isArray(cat.achievedLeads) ? cat.achievedLeads : []
        ),

        amount: Number(amount || 0),

        target: Number(aggregated.target || 0),
        achieved: Number(aggregated.achieved || 0),
        balance: Math.max(
          0,
          Number(aggregated.balance || 0)
        ),

        months: matchedCategories.map((cat) => ({
          month: cat.month,
          year: cat.year,
          target: Number(cat.target || 0),
          achieved: Number(cat.achieved || 0),
          balance: Math.max(0, Number(cat.balance || 0)),
        })),
      };
    });

  console.log("Target / achieved / balance users:", result);

  setallusersData(result);
};

  useEffect(() => {
    handleMetricTab("achieved")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetData, category])

  const handlePeriodChange = (value) => {
    setLocalSelectedPeriod(value)
    console.log(value)
    const parsed = getPeriodRange(value)
    const firstMonthNumber = parsed?.startNum || null

    if (firstMonthNumber && onselectedPeriodChange) {
      onselectedPeriodChange(value, firstMonthNumber)
    }
  }

  const getActiveLabel = () => {
    if (activeMetric === "target") return "Target"
    if (activeMetric === "balance") return "Balance"
    return "Achieved"
  }

  const { target, achieved, balance } = selectedDatapopup || {}
  console.log(selectedDatapopup)
  console.log(open)
  console.log(targetData)
  if (!open || !targetData?.userWiseResults?.length) return null
  console.log(open)
  console.log(targetData)

  const isAmountMode = splitType === "amount"

  const formatValue = (val) => {
    const num = Number(val || 0)

    if (isAmountMode) {
      return `₹ ${num.toLocaleString("en-IN")}`
    }

    return `Q: ${num.toLocaleString("en-IN")}`
  }

  const openAchievedLeadHistory = async (lead) => {
    if (!lead?.leadMongoId) return
    const drilldown = achievedLeadDrilldown
    setAchievedLeadDrilldown(null)
    setHistoryDialog({ leadId: lead.leadId, history: [], loading: true, drilldown })
    try {
      const response = await api.get(`/lead/getSelectedLead?leadId=${lead.leadMongoId}`)
      setHistoryDialog((current) => current && ({
        ...current,
        history: response.data?.data?.[0]?.activityLog || [],
        loading: false,
      }))
    } catch {
      setHistoryDialog((current) => current && ({ ...current, loading: false, error: "Unable to load event log." }))
    }
  }

  const closeAchievedLeadHistory = () => {
    const drilldown = historyDialog?.drilldown || null
    setHistoryDialog(null)
    setAchievedLeadDrilldown(drilldown)
  }

  // Keep all hooks above this guard. This component is mounted by Layout on
  // every route, so rendering its overlay while closed hides the destination
  // page (including LeadMaster after a View navigation).
  if (!open && !modalOpen) return null

  const handleAchievedLeadView = () => {
    setHistoryDialog(null)
    setAchievedLeadDrilldown(null)
    onClose?.()
  }

  console.log("hhh")
  return (
    // <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 backdrop-blur-sm">
    //   <div className="w-full max-w-4xl rounded-2xl bg-slate-50 shadow-2xl ring-1 ring-slate-900/10 ">
    //     <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-end sm:justify-between">
    //       <div>
    //         <h2 className="text-base font-semibold text-slate-900">
    //           Performance Summary{" "}
    //           <span className="text-slate-500">
    //             {/* ({category?.categoryName?.toUpperCase() || ""}) */}
    //           </span>
    //         </h2>
    //         <p className="mt-0.5 text-xs text-slate-500">
    //           Target vs Achieved with product-wise breakdown
    //         </p>
    //       </div>

    //       <div className="flex flex-wrap items-end gap-2">
    //         <FancySelect
    //           label="Period"
    //           value={localSelectedPeriod || ""}
    //           options={periodOptions}
    //           onChange={handlePeriodChange}
    //           width="min-w-[180px]"
    //         />

    //         <FancySelect
    //           label="Month"
    //           value={String(periodMode ?? "all")}
    //           options={monthOptions}
    //           onChange={onMonthChange}
    //           width="min-w-[140px]"
    //         />

    //         <FancySelect
    //           label="Year"
    //           value={String(selectedYear || "")}
    //           options={yearOptions}
    //           onChange={onYearChange}
    //           width="min-w-[110px]"
    //         />

    //         <button
    //           type="button"
    //           onClick={onClose}
    //           className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
    //         >
    //           Close
    //         </button>
    //       </div>
    //     </div>

    //     <div className="border-b border-slate-200 bg-slate-100/60 px-5 py-3">
    //       <div className="mb-2 flex items-center justify-between">
    //         <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
    //           {/* {loggedUser?.name || ""} */}
    //         </span>
    //       </div>

    //       <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
    //         <SummaryPill
    //           label="Target"
    //           value={target}
    //           tone="slate"
    //           active={activeMetric === "target"}
    //           onClick={() => handleMetricTab("target")}
    //           isAmountMode={isAmountMode}
    //         />
    //         <SummaryPill
    //           label="Achieved"
    //           value={achieved}
    //           tone="emerald"
    //           active={activeMetric === "achieved"}
    //           onClick={() => handleMetricTab("achieved")}
    //           isAmountMode={isAmountMode}
    //         />
    //         <SummaryPill
    //           label="Balance"
    //           value={balance}
    //           tone="amber"
    //           active={activeMetric === "balance"}
    //           onClick={() => handleMetricTab("balance")}
    //           isAmountMode={isAmountMode}
    //         />
    //       </div>
    //     </div>

    //     {activeMetric && allusersData?.length > 0 && (
    //       <>
    //         <div className="px-5 pt-3">
    //           <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
    //             <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
    //             {getActiveLabel()} – Summary (All Users)
    //           </div>
    //         </div>

    //         <div className="px-5 pb-3 pt-2">
    //           <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    //             <table className="min-w-full border-collapse text-xs">
    //               <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
    //                 <tr>
    //                   <th className="px-3 py-2 text-left">Name</th>
    //                   <th className="px-3 py-2 text-right">
    //                     {getActiveLabel()}{" "}
    //                     {isAmountMode ? "Amount" : "Quantity"}
    //                   </th>
    //                 </tr>
    //               </thead>

    //               <tbody className="divide-y divide-slate-100 bg-white">
    //                 {allusersData.map((item, index) => {
    //                   const isActive =
    //                     String(activeUserId) === String(item.userId)
    //                   console.log(isActive)
    //                   return (
    //                     <tr
    //                       key={item.userId || index}
    //                       onClick={() =>
    //                         handleSelectedUser(
    //                           category,
    //                           item.userId,
    //                           item.userName
    //                         )
    //                       }
    //                       className={`cursor-pointer transition-colors ${
    //                         isActive ? "bg-blue-100" : "hover:bg-blue-200"
    //                       }`}
    //                     >
    //                       <td
    //                         className={`px-3 py-2 text-[12px] font-semibold ${
    //                           isActive
    //                             ? "border-l-2 border-emerald-500 text-emerald-900"
    //                             : "text-slate-800"
    //                         }`}
    //                       >
    //                         {item?.userName?.toUpperCase()}
    //                       </td>

    //                       <td className="px-3 py-2 text-right text-[12px] font-semibold text-slate-900">
    //                         {formatValue(item?.amount)}
    //                       </td>
    //                     </tr>
    //                   )
    //                 })}
    //               </tbody>
    //             </table>
    //           </div>
    //         </div>
    //       </>
    //     )}

    //     {activeMetric && (
    //       <div className="px-5 pb-4 pt-2">
    //         <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
    //           <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
    //           {activeMetric === "target"
    //             ? `Product List - ${category?.categoryName?.toUpperCase() || ""}`
    //             : `Product-wise Report - ${
    //                 selectedUser?.toUpperCase() || "All users"
    //               }`}
    //         </div>

    //         <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    //           {activeMetric === "target" ? (
    //             <div className="max-h-[150px] overflow-y-auto px-3 py-3">
    //               {productlist?.length > 0 ? (
    //                 <div className="space-y-2">
    //                   {productlist.map((product, index) => (
    //                     <div
    //                       key={`${product}-${index}`}
    //                       className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[12px] font-medium text-slate-700"
    //                     >
    //                       {product.toUpperCase()}
    //                     </div>
    //                   ))}
    //                 </div>
    //               ) : (
    //                 <div className="py-6 text-center text-[12px] text-slate-400">
    //                   No products configured.
    //                 </div>
    //               )}
    //             </div>
    //           ) : (
    //             <div className="max-h-[260px] overflow-auto">
    //               <table className="min-w-full border-collapse text-xs">
    //                 <thead className="sticky top-0 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
    //                   <tr>
    //                     <th className="px-3 py-2 text-left">Product</th>
    //                     <th className="px-3 py-2 text-right">
    //                       {activeMetric === "balance"
    //                         ? isAmountMode
    //                           ? "Balance Amount"
    //                           : "Balance Quantity"
    //                         : isAmountMode
    //                           ? "Achieved Amount"
    //                           : "Achieved Quantity"}
    //                     </th>
    //                   </tr>
    //                 </thead>

    //                 <tbody className="divide-y divide-slate-100 bg-white">
    //                   {products?.map((p, index) => (
    //                     <tr
    //                       key={p.productname || index}
    //                       className="font-semibold transition-colors hover:bg-slate-50/80"
    //                     >
    //                       <td className="px-3 py-2 text-[12px] text-slate-700">
    //                         {p.productname?.toUpperCase()}
    //                       </td>
    //                       <td className="px-3 py-2 text-right text-[12px] text-slate-900">
    //                         {formatValue(p.amount)}
    //                       </td>
    //                     </tr>
    //                   ))}

    //                   {(!products || products.length === 0) && (
    //                     <tr>
    //                       <td
    //                         colSpan={2}
    //                         className="px-3 py-6 text-center text-[12px] text-slate-400"
    //                       >
    //                         No achieved data available.
    //                       </td>
    //                     </tr>
    //                   )}
    //                 </tbody>
    //               </table>
    //             </div>
    //           )}
    //         </div>
    //       </div>
    //     )}
    //   </div>
    // </div>
<>
<div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 p-3 backdrop-blur-sm sm:p-5">
  <div className="flex min-h-full items-center justify-center">
    <div className="flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-2xl ring-1 ring-slate-900/10 sm:max-h-[calc(100dvh-2.5rem)]">
      
      {/* Fixed header */}
      <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Performance Summary{" "}
              <span className="text-slate-500">
                {/* ({category?.categoryName?.toUpperCase() || ""}) */}
              </span>
            </h2>

            <p className="mt-0.5 text-xs text-slate-500">
              Target vs Achieved with product-wise breakdown
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <FancySelect
              label="Period"
              value={localSelectedPeriod || ""}
              options={periodOptions}
              onChange={handlePeriodChange}
              width="min-w-[180px]"
            />

            <FancySelect
              label="Month"
              value={String(periodMode ?? "all")}
              options={monthOptions}
              onChange={onMonthChange}
              width="min-w-[140px]"
            />

            <FancySelect
              label="Year"
              value={String(selectedYear || "")}
              options={yearOptions}
              onChange={onYearChange}
              width="min-w-[110px]"
            />

            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable modal body */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        
        {/* Summary cards */}
        <div className="border-b border-slate-200 bg-slate-100/60 px-5 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              {/* {loggedUser?.name || ""} */}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <SummaryPill
              label="Target"
              value={target}
              tone="slate"
              active={activeMetric === "target"}
              onClick={() => handleMetricTab("target")}
              isAmountMode={isAmountMode}
            />

            <SummaryPill
              label="Achieved"
              value={achieved}
              tone="emerald"
              active={activeMetric === "achieved"}
              onClick={() => handleMetricTab("achieved")}
              isAmountMode={isAmountMode}
            />

            <SummaryPill
              label="Balance"
              value={balance}
              tone="amber"
              active={activeMetric === "balance"}
              onClick={() => handleMetricTab("balance")}
              isAmountMode={isAmountMode}
            />
          </div>
        </div>

        {/* User summary */}
        {activeMetric && allusersData?.length > 0 && (
          <>
            <div className="px-5 pt-3">
              <div className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {getActiveLabel()} – Summary (All Users)
              </div>
            </div>

            <div className="px-5 pb-3 pt-2">
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full border-collapse text-xs">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">
                        Name
                      </th>

                      <th className="px-3 py-2 text-right">
                        {getActiveLabel()}{" "}
                        {isAmountMode
                          ? "Amount"
                          : "Quantity"}
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {allusersData.map((item, index) => {
                      const isActive =
                        String(activeUserId) ===
                        String(item.userId);

                      return (
                        <tr
                          key={item.userId || index}
                          onClick={() =>
                            handleSelectedUser(
                              category,
                              item.userId,
                              item.userName
                            )
                          }
                          className={`cursor-pointer transition-colors ${
                            isActive
                              ? "bg-blue-100"
                              : "hover:bg-blue-200"
                          }`}
                        >
                          <td
                            className={`px-3 py-2 text-[12px] font-semibold ${
                              isActive
                                ? "border-l-2 border-emerald-500 text-emerald-900"
                                : "text-slate-800"
                            }`}
                          >
                            {item?.userName?.toUpperCase()}
                          </td>

                          <td className="px-3 py-2 text-right text-[12px] font-semibold text-slate-900">
                            {activeMetric === "achieved" && Number(item?.amount) > 0 ? (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setAchievedLeadDrilldown({ userName: item.userName, leads: item.achievedLeads })
                                }}
                                className="rounded px-1 text-emerald-700 underline decoration-emerald-300 underline-offset-2 transition hover:bg-emerald-50 hover:text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                                aria-label={`View achieved leads for ${item.userName}`}
                              >
                                {formatValue(item?.amount)}
                              </button>
                            ) : formatValue(item?.amount)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Product report */}
        {activeMetric && (
          <div className="px-5 pb-4 pt-2">
            <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

              {activeMetric === "target"
                ? `Product List - ${
                    category?.categoryName?.toUpperCase() ||
                    ""
                  }`
                : `Product-wise Report - ${
                    selectedUser?.toUpperCase() ||
                    "All users"
                  }`}
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              {activeMetric === "target" ? (
                <div className="max-h-[180px] overflow-y-auto px-3 py-3">
                  {productlist?.length > 0 ? (
                    <div className="space-y-2">
                      {productlist.map((product, index) => (
                        <div
                          key={`${product}-${index}`}
                          className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[12px] font-medium text-slate-700"
                        >
                          {product.toUpperCase()}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-[12px] text-slate-400">
                      No products configured.
                    </div>
                  )}
                </div>
              ) : (
                <div className="max-h-[300px] overflow-auto">
                  <table className="min-w-full border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-3 py-2 text-left">
                          Product
                        </th>

                        <th className="px-3 py-2 text-right">
                          {activeMetric === "balance"
                            ? isAmountMode
                              ? "Balance Amount"
                              : "Balance Quantity"
                            : isAmountMode
                            ? "Achieved Amount"
                            : "Achieved Quantity"}
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 bg-white">
                      {products?.map((product, index) => (
                        <tr
                          key={
                            product.productname ||
                            product.productName ||
                            index
                          }
                          className="font-semibold transition-colors hover:bg-slate-50/80"
                        >
                          <td className="px-3 py-2 text-[12px] text-slate-700">
                            {(
                              product.productname ||
                              product.productName ||
                              "—"
                            ).toUpperCase()}
                          </td>

                          <td className="px-3 py-2 text-right text-[12px] text-slate-900">
                            {formatValue(product.amount)}
                          </td>
                        </tr>
                      ))}

                      {(!products || products.length === 0) && (
                        <tr>
                          <td
                            colSpan={2}
                            className="px-3 py-6 text-center text-[12px] text-slate-400"
                          >
                            No achieved data available.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
</div>
{achievedLeadDrilldown && (
  <AchievedLeadsModal
    userName={achievedLeadDrilldown.userName}
    leads={achievedLeadDrilldown.leads}
    loggedUser={loggedUser}
    onClose={() => setAchievedLeadDrilldown(null)}
    onEventLog={openAchievedLeadHistory}
    onViewLead={handleAchievedLeadView}
  />
)}
{historyDialog?.loading && (
  <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-900/50 p-4">
    <p className="rounded-xl bg-white px-5 py-4 text-sm font-medium text-slate-700 shadow-xl">Loading event log…</p>
  </div>
)}
{historyDialog && !historyDialog.loading && (
  historyDialog.error ? (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-900/50 p-4">
      <div className="rounded-xl bg-white p-5 text-center shadow-xl"><p className="text-sm text-red-600">{historyDialog.error}</p><button type="button" onClick={closeAchievedLeadHistory} className="mt-3 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white">Back</button></div>
    </div>
  ) : <LeadhistoryModal selectedLeadId={historyDialog.leadId} historyList={historyDialog.history} handlecloseModal={closeAchievedLeadHistory} />
)}
</>
  )
}

function AchievedLeadsModal({ userName, leads, loggedUser, onClose, onEventLog, onViewLead }) {
  const navigate = useNavigate()
  const location = useLocation()
  const uniqueLeads = [...new Map((leads || []).filter((lead) => lead?.leadMongoId)
    .map((lead) => [lead.leadMongoId, lead])).values()]

  const viewLeadMaster = (lead) => {
    const leadMongoId = lead?.leadMongoId || lead?._id
    if (!leadMongoId) return
    const isAdmin = loggedUser?.role === "Admin" || location.pathname.startsWith("/admin")
    const breadcrumb = [
      { label: "Lead", path: "", state: "" },
      { label: "Achieved Records", path: location.pathname, state: location.state || {} },
      { label: "New Lead", path: "" },
    ]
    navigate(
      isAdmin ? "/admin/transaction/lead/leadEdit" : "/staff/transaction/lead/leadEdit",
      { state: { leadId: leadMongoId, breadcrumb, isReadOnly: true, from: "Ownleadlist" } }
    )
    onViewLead()
  }

  return (

<div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Achieved leads">
  <div className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-800">
          <span className="mr-2 text-blue-500">●</span>Achieved Records
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{userName || "Selected user"}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
          {uniqueLeads.length} total
        </span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Close
        </button>
      </div>
    </div>

    <div className="overflow-auto p-4">
      {uniqueLeads.length ? (
        <div className="overflow-hidden border border-slate-300">
          <table className="min-w-[1000px] w-full table-fixed border-collapse text-xs">
            <thead className="bg-blue-600 text-[11px] uppercase tracking-wide text-white">
              <tr>
                <th className="w-56 border-r border-blue-400 px-3 py-2 text-left">Name</th>
                <th className="border-r border-blue-400 px-3 py-2 text-left">Lead ID</th>
                <th className="border-r border-blue-400 px-3 py-2 text-left">Mobile</th>
                <th className="border-r border-blue-400 px-3 py-2 text-center">License No.</th>
                <th className="border-r border-blue-400 px-3 py-2 text-center">Product Name</th>
                <th className="border-r border-blue-400 px-3 py-2 text-center">Event Log</th>
                <th className="border-r border-blue-400 px-3 py-2 text-center">View</th>
                <th className="px-3 py-2 text-right">₹ Net Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {uniqueLeads.map((lead) => {
                const displayName = lead.customerName || lead.leadId || "—";
                const showTooltip = displayName !== "—" && displayName.length > 20; // adjust threshold as needed

                return (
                  <tr key={lead.leadMongoId} className="hover:bg-slate-50">
                    {/* Name with custom tooltip (positioned above) */}
                    <td className="border-r border-slate-200 px-3 py-2">
                      <div className="group relative block max-w-full">
                        {/* Visible truncated name */}
                        <div className="truncate font-semibold text-slate-800">
                          {displayName}
                        </div>

                        {/* Tooltip */}
                        {showTooltip && (
                          <div
                            className="pointer-events-none absolute bottom-full left-0 z-50 mb-1 hidden w-max max-w-[min(24rem,calc(100vw-3rem))] whitespace-normal break-words rounded-md bg-slate-900 px-2 py-1 text-xs text-white shadow-lg group-hover:block"
                            role="tooltip"
                          >
                            {displayName}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="border-r border-slate-200 px-3 py-2 font-semibold text-slate-700">
                      {lead.leadId || "—"}
                    </td>
                    <td className="border-r border-slate-200 px-3 py-2 text-slate-700">
                      {lead.mobile || "—"}
                    </td>
                    <td className="border-r border-slate-200 px-3 py-2 text-center font-medium text-red-500">
                      {(lead.categoryItems || [])
                        .map((item) => item.licenseNumber)
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td className="border-r border-slate-200 px-3 py-2 text-center font-medium text-blue-700">
                      {(lead.categoryItems || [])
                        .map((item) => item.name)
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td className="border-r border-slate-200 px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => onEventLog(lead)}
                        className="inline-flex rounded bg-indigo-600 px-3 py-1 text-white transition hover:bg-indigo-700"
                        aria-label={`View event log for ${lead.leadId || "lead"}`}
                      >
                        <BellRing className="h-3.5 w-3.5" />
                      </button>
                    </td>
                    <td className="border-r border-slate-200 px-3 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => viewLeadMaster(lead)}
                        className="inline-flex items-center gap-1 rounded bg-blue-600 px-4 py-1 text-xs font-semibold text-white transition hover:bg-blue-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-semibold text-green-700">
                      ₹ {Number(lead.netAmount || 0).toLocaleString("en-IN")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-slate-500">
          No achieved leads found for this user.
        </p>
      )}
    </div>
  </div>
</div>
  )
}

AchievedLeadsModal.propTypes = {
  userName: PropTypes.string,
  leads: PropTypes.array,
  loggedUser: PropTypes.shape({ role: PropTypes.string }),
  onClose: PropTypes.func.isRequired,
  onEventLog: PropTypes.func.isRequired,
  onViewLead: PropTypes.func.isRequired,
}

function SummaryPill({ label, value, tone, active, onClick, isAmountMode }) {
  const toneMap = {
    slate: {
      base: "bg-slate-50 text-slate-700 ring-slate-200",
      active:
        "bg-slate-900 text-white ring-slate-900 shadow-sm shadow-slate-300/60"
    },
    emerald: {
      base: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      active:
        "bg-emerald-600 text-white ring-emerald-500 shadow-sm shadow-emerald-300/60"
    },
    amber: {
      base: "bg-amber-50 text-amber-700 ring-amber-100",
      active:
        "bg-amber-500 text-white ring-amber-400 shadow-sm shadow-amber-300/60"
    }
  }

  const styles = toneMap[tone] || toneMap.slate
  const num = Number(value || 0)

  const displayValue = isAmountMode
    ? `₹ ${num.toLocaleString("en-IN")}`
    : `Q: ${num.toLocaleString("en-IN")}`

  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group relative flex flex-col justify-between rounded-xl px-4 py-3 text-left ring-1
        transition-all duration-200
        hover:-translate-y-[1px] hover:shadow-md
        ${active ? styles.active : styles.base}
      `}
    >
      <span
        className={`text-[11px] font-medium ${
          active ? "text-white/80" : "text-slate-600"
        }`}
      >
        {label}
      </span>

      <span className="mt-1 text-[15px] font-semibold tracking-tight">
        {displayValue}
      </span>

      <span
        className={`
          absolute right-3 top-3 h-2 w-2 rounded-full transition-all
          ${
            active
              ? "bg-white/90 shadow-[0_0_0_4px_rgba(255,255,255,0.25)]"
              : "bg-current/20"
          }
        `}
      />
    </button>
  )
}
