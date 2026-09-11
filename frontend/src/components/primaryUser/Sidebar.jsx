
///new code in git
import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Layers,
  Building2,
  CalendarRange,
  Users,
  BadgeDollarSign,
  CheckCircle2
} from "lucide-react"
import { CustomSelect } from "../common/CustomSelect"

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

const SHORT_MONTH_MAP = {
  january: "Jan",
  february: "Feb",
  march: "Mar",
  april: "Apr",
  may: "May",
  june: "Jun",
  july: "Jul",
  august: "Aug",
  september: "Sep",
  october: "Oct",
  november: "Nov",
  december: "Dec"
}

const CATEGORY_THEMES = [
  {
    icon: Users,
    softBg: "bg-emerald-50/95",
    iconColor: "text-emerald-600",
    progress: "from-emerald-400 to-green-500",
    pill: "bg-emerald-50 text-emerald-700"
  },
  {
    icon: Building2,
    softBg: "bg-blue-50/95",
    iconColor: "text-blue-600",
    progress: "from-blue-400 to-blue-600",
    pill: "bg-blue-50 text-blue-700"
  },
  {
    icon: BadgeDollarSign,
    softBg: "bg-amber-50/95",
    iconColor: "text-amber-600",
    progress: "from-amber-400 to-orange-500",
    pill: "bg-amber-50 text-amber-700"
  },
  {
    icon: CheckCircle2,
    softBg: "bg-violet-50/95",
    iconColor: "text-violet-600",
    progress: "from-violet-400 to-purple-500",
    pill: "bg-violet-50 text-violet-700"
  }
]

const formatAmount = (num = 0) => `${Number(num || 0)}`

const getShortMonth = (monthName = "") => {
  const key = String(monthName).trim().toLowerCase()
  return SHORT_MONTH_MAP[key] || String(monthName).slice(0, 3)
}

const getPeriodRange = (periodLabel) => {
  if (!periodLabel) return null
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
    displayLabel: `${getShortMonth(startMonthName)} - ${getShortMonth(endMonthName)}`
  }
}

const SidebarBlock = ({ className = "", children }) => (
  <div
    className={`relative overflow-visible rounded-[16px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.075),rgba(255,255,255,0.035))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_18px_rgba(0,49,53,0.14)] ${className}`}
  >
    {children}
  </div>
)

const CategoryCard = ({ item, index, onClick }) => {
  console.log(item)
  const theme = CATEGORY_THEMES[index % CATEGORY_THEMES.length]
  const Icon = theme.icon
  const achieved = Number(item?.achievedamount || item?.achieved || 0)
  const target = Number(item?.targetamount || item?.target || 0)
  const percentage = target > 0 ? Math.min((achieved / target) * 100, 100) : 0

  return (
    <button
      type="button"
      onClick={() => onClick?.(item?.categoryId, item?.categoryName)}
      className="group flex w-full items-center gap-2.5 rounded-[14px] bg-white px-2.5 py-2.5 text-left shadow-[0_6px_14px_rgba(3,58,64,0.08)] transition hover:-translate-y-[1px]"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${theme.softBg}`}
      >
        <Icon size={16} className={theme.iconColor} strokeWidth={2} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate text-[12px] font-semibold text-slate-800">
            {item?.categoryName}
          </div>
          <div
            className={`rounded-full px-2 py-0.5 text-[9px] font-semibold ${theme.pill}`}
          >
            {percentage.toFixed(0)}%
          </div>
        </div>

        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${theme.progress}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="text-[11px] font-bold text-slate-800">
            {formatAmount(achieved)}
          </div>
          <ChevronRight size={14} className="text-slate-400" />
        </div>
      </div>
    </button>
  )
}

const CategoryListIconFirst = ({
  categorylist,
  handleMoreClick,
  sidebarOpen
}) => {
  return (
    <div
      className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-0.5 ${
        sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <div className="space-y-2">
        {categorylist?.length ? (
          categorylist.map((item, index) => (
            <CategoryCard
              key={`${item.categoryId || item.categoryName}-${index}`}
              item={item}
              index={index}
              onClick={(categoryId, categoryName) =>
                handleMoreClick?.(categoryId, categoryName)
              }
            />
          ))
        ) : (
          <div className="rounded-[14px] bg-white/95 px-3 py-5 text-center text-[11px] text-slate-500">
            No categories available
          </div>
        )}
      </div>
    </div>
  )
}

const Sidebar = ({
  handleMoreClick,
  targetData,
  onselectedPeriodChange,
  achievedPoints,
  sidebarOpen,
  toggleSidebar,
  user,
  selectedBranch,
  setselectedBranch,
  branchOptions,
  categorylist,
  targetLoading,
  BranchSelect,
  SkeletonTable,
  selectedYear,
  setSelectedYear,
  onavataropenClick,
  isMobile
}) => {
  const navigate = useNavigate()
  const [localSelectedPeriod, setLocalSelectedPeriod] = useState(
    targetData?.selectedPeriodName || ""
  )

  useEffect(() => {
    setLocalSelectedPeriod(targetData?.selectedPeriodName || "")
  }, [targetData?.selectedPeriodName])

  const normalizedCategories = useMemo(() => {
    return (categorylist || []).map((item) => {
      const target = Number(item.targetamount || 0)
      const achieved = Number(item.achievedamount || 0)
      const percent = target > 0 ? Math.min((achieved / target) * 100, 100) : 0
      return { ...item, target, achieved, percent }
    })
  }, [categorylist])
console.log(normalizedCategories)
  const periodOptions = useMemo(() => {
    return (targetData?.periods || []).map((period) => {
      const parsed = getPeriodRange(period)
      return {
        value: period,
        label: parsed?.displayLabel || String(period).replace(/\s+\d{4}$/, "")
      }
    })
  }, [targetData?.periods])

  const yearOptions = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const year = new Date().getFullYear() - i
      return { value: String(year), label: String(year) }
    })
  }, [])

  const handlePeriodChange = (value) => {
    setLocalSelectedPeriod(value)
    const parsed = getPeriodRange(value)
    const firstMonthNumber = parsed?.startNum || null
    if (firstMonthNumber && onselectedPeriodChange) {
      onselectedPeriodChange(value, firstMonthNumber)
    }
  }

  const handleScoreBoardClick = () => {
    const reportPath =
      user?.role === "Admin"
        ? "/admin/reports/incentiveReport"
        : "/staff/reports/incentiveReport"

    navigate(reportPath, { state: { incentiveScope: "self" } })
  }

  const companyName = user?.activeCompany?.companyName || "CAMET CRM"
  const companyShort = companyName?.slice(0, 1)?.toUpperCase() || "C"

  const SafeBranchSelect = BranchSelect || null
  const SafeSkeletonTable = SkeletonTable || null

  return (
    <aside
      className={`
        relative flex h-full flex-col overflow-visible text-white
        bg-[radial-gradient(circle_at_top_left,rgba(18,143,142,0.24),transparent_28%),linear-gradient(180deg,#04545c_0%,#044d55_35%,#04444b_100%)]
        shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.08),0_16px_32px_rgba(0,68,74,0.18)]
        transition-[width] duration-300 ease-out lg:flex-shrink-0
        ${sidebarOpen ? "w-full lg:w-[256px]" : "w-full lg:w-[64px]"}
      `}
    >
      <div className="pointer-events-none absolute inset-0 rounded-[22px] bg-[linear-gradient(135deg,rgba(255,255,255,0.04),transparent_42%,transparent_72%,rgba(255,255,255,0.025))]" />

      <div className="relative flex items-center justify-between px-2.5 pt-2.5 pb-2">
        <div
          className={`flex min-w-0 items-center gap-2.5 transition-opacity duration-200 ${
            sidebarOpen ? "opacity-100" : "lg:opacity-0"
          }`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(180deg,#2f8dff_0%,#1c5fe8_100%)] text-[16px] font-bold text-white shadow-[0_8px_18px_rgba(28,95,232,0.28)]">
            {companyShort}
          </div>

          <div className="min-w-0">
            <div className="truncate text-[13px] font-bold tracking-tight text-white">
              {companyName}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleSidebar}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_6px_14px_rgba(0,46,50,0.14)] transition hover:scale-[1.02]"
        >
          {isMobile ? (
            <Menu size={18} strokeWidth={2.2} />
          ) : sidebarOpen ? (
            <ChevronLeft size={16} />
          ) : (
            <ChevronRight size={16} />
          )}
        </button>
      </div>

      {sidebarOpen && (
        <div className="relative min-h-0 flex-1 space-y-2.5 overflow-y-auto px-2.5 pb-2.5">
          <SidebarBlock className="px-2.5 py-2.5">
            <button
              type="button"
              onClick={onavataropenClick}
              className="flex w-full items-center gap-2.5 text-left"
            >
              <div className="relative h-[60px] w-[60px] shrink-0 overflow-hidden rounded-full bg-white shadow-[0_6px_14px_rgba(0,0,0,0.1)]">
                {user?.profileUrl ? (
                  <img
                    src={user.profileUrl}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[16px] font-bold text-slate-700">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <span className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.45)]" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-bold text-white">
                  {user?.name?.toUpperCase() || "User"}
                </div>
                <div className="mt-0.5 truncate text-[10px] text-white/68">
                  {user?.role || user?.designation || "Administrator"}
                </div>
              </div>

              <ChevronRight size={16} className="shrink-0 text-white/75" />
            </button>
          </SidebarBlock>

          <SidebarBlock className="overflow-visible px-2.5 py-2.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <Building2 size={16} />
              </div>

              <div className="min-w-0 flex-1 overflow-visible">
                <div className="text-[10px] text-white/68">Branch</div>
                <div className="relative z-50 mt-0.5 overflow-visible">
                  {SafeBranchSelect ? (
                    <SafeBranchSelect
                      value={selectedBranch}
                      onChange={setselectedBranch}
                      className="sidebar-branch-select w-full min-w-0"
                      options={branchOptions}
                    />
                  ) : (
                    <div className="text-[11px] text-white/85">
                      {selectedBranch?.label || "Main Branch"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SidebarBlock>

          <div
            onClick={handleScoreBoardClick}
            className="rounded-[14px] bg-black px-2.5 py-2.5 shadow-sm hover:cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-300">
                Score Board
              </span>
              <span className="text-[9px] font-medium text-slate-400">
                {categorylist?.length || 0}
              </span>
            </div>

            <div className="mt-1 flex items-center justify-between">
              <span className="text-[10px] font-medium leading-4 text-slate-200">
                Achieved Points
              </span>
              <span className="text-[14px] font-semibold leading-none text-white">
                {achievedPoints}
              </span>
            </div>
          </div>

          <SidebarBlock className="overflow-visible px-2.5 py-2.5">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-semibold text-white">
              <CalendarRange size={15} className="text-white/90" />
              Select Period
            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_80px] gap-1.5 overflow-visible">
              <div className="relative z-50 overflow-visible">
                <CustomSelect
                  value={localSelectedPeriod}
                  onChange={handlePeriodChange}
                  options={periodOptions}
                  className="sidebar-custom-select w-full min-w-0"
                  placeholder="Period"
                />
              </div>

              <div className="relative z-50 overflow-visible">
                <CustomSelect
                  value={selectedYear}
                  onChange={setSelectedYear}
                  options={yearOptions}
                  className="sidebar-custom-select w-full min-w-0"
                  placeholder="Year"
                />
              </div>
            </div>
          </SidebarBlock>

          <SidebarBlock className="min-h-0 flex flex-1 flex-col px-2 py-2.5">
            <div className="mb-2.5 flex items-center justify-between px-1">
              <div className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-white">
                <Layers size={15} className="text-white/90" />
                Categories
              </div>

              {/* <button
                type="button"
                onClick={() => handleMoreClick?.()}
                className="rounded-lg bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] px-2.5 py-1 text-[10px] font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition hover:opacity-90"
              >
                View All
              </button> */}
            </div>

            {targetLoading && SafeSkeletonTable ? (
              <SafeSkeletonTable rows={8} columns={2} />
            ) : (
              <CategoryListIconFirst
                categorylist={normalizedCategories}
                handleMoreClick={handleMoreClick}
                sidebarOpen={sidebarOpen}
              />
            )}
          </SidebarBlock>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
