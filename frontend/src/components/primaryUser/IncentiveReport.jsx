
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { Search, TrendingUp, Users } from "lucide-react";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { BranchSelect } from "./BranchSelect";
import { CustomSelect } from "../common/CustomSelect";
import useCachedFetch from "../../hooks/useCachedFetch";
import { formatDisplayCurrency } from "../../helper/formatDisplayNumber";
import PropTypes from "prop-types";

const formatAmount = formatDisplayCurrency;

const getUserTotal = (allocations = []) =>
  allocations.reduce(
    (sum, allocation) => sum + Number(allocation?.achieved || 0),
    0
  );

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

const IncentiveLeadsModal = lazy(() => import("./IncentiveLeadsModal"));

function useDebouncedValue(value, delay = 350) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

function IncentiveTableSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-gray-100">
      <div className="h-11 bg-blue-100" />
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="grid grid-cols-[220px_repeat(5,minmax(90px,1fr))_120px] items-center gap-3 border-t border-gray-100 px-4 py-3"
        >
          <div className="h-8 w-40 rounded bg-gray-200" />
          {Array.from({ length: 6 }).map((__, cellIndex) => (
            <div key={cellIndex} className="h-4 rounded bg-gray-100" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function IncentiveReport({ selectedYear, selectedPeriod }) {
  const loggeduser = useSelector((state) => state.auth.user);
  const location = useLocation();
  const selectedBranch = useSelector(
    (state) => state.companyBranch.selectedBranch
  );
  const isAdmin = loggeduser?.role === "Admin";

  const [search, setSearch] = useState("");
  const [reportBranch, setReportBranch] = useState(selectedBranch || "");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedAllocation, setSelectedAllocation] = useState(null);
  const [showLeadsModal, setShowLeadsModal] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  const isScoreBoardReport = location.state?.incentiveScope === "self";
  const isSelfReport = isScoreBoardReport && Boolean(loggeduser?._id);
  const isNavbarReport = location.state?.incentiveEntry === "navbar";
  const [navbarYear, setNavbarYear] = useState(
    String(selectedYear || new Date().getFullYear())
  );
  const [navbarPeriod, setNavbarPeriod] = useState("");

  useEffect(() => {
    setReportBranch(selectedBranch || "");
  }, [selectedBranch]);

  const branchOptions = useMemo(() => {
    const options = (loggeduser?.selected || [])
      .filter((branch) => branch?.branch_id)
      .map((branch) => ({ id: branch.branch_id, label: branch.branchName }));

    if (reportBranch && !options.some((branch) => String(branch.id) === String(reportBranch))) {
      options.push({ id: reportBranch, label: "Selected branch" });
    }

    return [...new Map(options.map((branch) => [String(branch.id), branch])).values()];
  }, [loggeduser?.selected, reportBranch]);

  const navbarPeriodsUrl =
    isNavbarReport && reportBranch && navbarYear
      ? `/target/gettargetresult?month=1&year=${navbarYear}&periodMode=all&selectedBranch=${reportBranch}`
      : null;
  const { data: navbarTargetData } = useCachedFetch(navbarPeriodsUrl);
  const navbarPeriodOptions = useMemo(
    () =>
      [...new Set(navbarTargetData?.periods || [])],
    [navbarTargetData]
  );

  useEffect(() => {
    if (!isNavbarReport || !navbarPeriodOptions.length) return;
    if (!navbarPeriodOptions.includes(navbarPeriod)) {
      setNavbarPeriod(
        navbarTargetData?.selectedPeriodName || navbarPeriodOptions[0]
      );
    }
  }, [isNavbarReport, navbarPeriod, navbarPeriodOptions, navbarTargetData]);

  const reportYear = isNavbarReport ? navbarYear : selectedYear;
  const reportPeriod = isNavbarReport ? navbarPeriod : selectedPeriod;

  const incentiveReportUrl =
    reportBranch && reportYear && reportPeriod
      ? `/target/getIncentiveReport?year=${reportYear}&period=${encodeURIComponent(reportPeriod)}&selectedBranch=${reportBranch}`
      : null;
  const {
    data: incentiveData,
    loading,
    isRefreshing,
    error,
    isOffline,
    refresh: refreshReport,
  } = useCachedFetch(incentiveReportUrl);
  const branches = useMemo(
    () =>
      Array.isArray(incentiveData?.branches) ? incentiveData.branches : [],
    [incentiveData]
  );

  const filteredBranches = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();

    return branches
      .map((branch) => ({
        ...branch,
        users: (branch?.users || []).filter((user) => {
          const matchesLoggedUser =
            !isSelfReport || String(user?.userId) === String(loggeduser?._id);
          const matchesSearch =
            !keyword ||
            `${user?.name || ""} ${user?.designation || ""}`
              .toLowerCase()
              .includes(keyword);

          return matchesLoggedUser && matchesSearch;
        }),
      }))
      .filter((branch) => branch.users.length > 0);
  }, [branches, isSelfReport, loggeduser?._id, debouncedSearch]);

  const handleOpenUserLeads = useCallback((user) => {
    const total = getUserTotal(user?.allocations);

    setSelectedUser(user);
    setSelectedAllocation({
      key: "all",
      label: "All allocations",
      achieved: total,
      allocations: user?.allocations || [],
    });
    setShowLeadsModal(true);
  }, []);

  const closeLeadsModal = useCallback(() => {
    setShowLeadsModal(false);
    setSelectedUser(null);
    setSelectedAllocation(null);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#ADD8E6] p-2 sm:p-3">
      <section className="mb-2 shrink-0 rounded-xl bg-white px-4 py-4 shadow-sm ring-1 ring-black/5 sm:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600/10">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-gray-900 sm:text-xl">
                Incentive Report
              </h1>
              <p className="text-xs text-gray-500">
                {isSelfReport ? "Your incentive achievement" : "Branch-wise incentive achievement"}
                <span className="mx-1.5 text-gray-300">•</span>
                {reportPeriod || "Select a period"} {reportYear || ""}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-wrap gap-2 lg:w-auto">
            {isNavbarReport && (
              <>
                <CustomSelect
                  label="Period"
                  labletrue
                  value={navbarPeriod}
                  onChange={setNavbarPeriod}
                  placeholder="Select period"
                  className="min-w-36 flex-1 sm:w-44 lg:w-48"
                  options={navbarPeriodOptions.map((period) => ({
                    value: period,
                    label: String(period).replace(/\s+\d{4}$/, "")
                  }))}
                />
                <CustomSelect
                  label="Year"
                  labletrue
                  value={navbarYear}
                  onChange={(year) => {
                      setNavbarYear(year);
                      setNavbarPeriod("");
                  }}
                  className="min-w-28 flex-1 sm:w-32 lg:w-36"
                  options={Array.from({ length: 6 }, (_, index) => {
                      const year = String(new Date().getFullYear() - index);
                      return { value: year, label: year };
                    })}
                />
                <CustomSelect
                  label="Branch"
                  labletrue
                  value={reportBranch}
                  onChange={setReportBranch}
                  placeholder="Select branch"
                  className="min-w-44 flex-1 sm:w-52 lg:w-56"
                  options={branchOptions.map((branch) => ({
                    value: branch.id,
                    label: branch.label
                  }))}
                />
              </>
            )}
            {!isNavbarReport && !isSelfReport && (
              <div className="min-w-48 flex-1 sm:w-56 lg:w-64">
                <BranchSelect
                  value={reportBranch}
                  onChange={setReportBranch}
                  options={branchOptions}
                  label="Branch"
                  labletrue
                  className="w-full"
                />
              </div>
            )}
            <div className="relative min-w-48 flex-1 sm:w-56 lg:w-64">
              <label
                htmlFor="incentive-staff-search"
                className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-transparent select-none"
              >
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  id="incentive-staff-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search staff..."
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-white p-3 shadow-sm ring-1 ring-black/5 sm:p-4">
        {(isRefreshing || isOffline) && branches.length > 0 && (
          <div className="mb-3 flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
            <span>{isOffline ? "Offline — showing the last loaded report." : "Updating report…"}</span>
            {isOffline && (
              <button type="button" onClick={refreshReport} className="font-semibold underline">
                Retry
              </button>
            )}
          </div>
        )}
        {loading && branches.length === 0 ? (
          <IncentiveTableSkeleton />
        ) : error && branches.length === 0 ? (
          <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-red-200 bg-red-50 px-4 text-center">
            <div>
              <p className="text-sm font-semibold text-red-700">
                Failed to load incentive report
              </p>
              <p className="mt-1 text-xs text-red-500">{error}</p>
              <button
                type="button"
                onClick={refreshReport}
                className="mt-3 rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Retry
              </button>
            </div>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 text-center">
            <div>
              <Users className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-2 text-sm font-semibold text-gray-600">
                No incentive data found
              </p>
              <p className="mt-1 text-xs text-gray-400">
                Try changing the selected period, branch, or staff search.
              </p>
            </div>
          </div>
        ) : (
          filteredBranches.map((branch) => {
            const users = Array.isArray(branch?.users) ? branch.users : [];
            const columns = users[0]?.allocations || [];

            return (
              <section key={branch.branchId} className="mb-5 last:mb-0">
                {!isSelfReport && (
                  <div className="mb-2 flex items-center justify-between px-1">
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                      {branch.branchName || "Unnamed branch"}
                    </h2>
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                      {users.length} staff
                    </span>
                  </div>
                )}

                <div className="space-y-2 lg:hidden">
                  {users.map((user) => {
                    const total = getUserTotal(user?.allocations);

                    return (
                      <button
                        key={user.userId}
                        type="button"
                        onClick={() => handleOpenUserLeads(user)}
                        className="w-full rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-300"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white">
                              {getInitials(user?.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900">
                                {user?.name || "—"}
                              </p>
                              <p className="truncate text-[11px] text-gray-400">
                                {user?.designation || "—"}
                              </p>
                            </div>
                          </div>

                          <p className="shrink-0 text-sm font-bold text-gray-900">
                            {formatAmount(total)}
                          </p>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-gray-100 pt-3">
                          {columns.map((column) => {
                            const allocation = user?.allocations?.find(
                              (item) => item.key === column.key
                            );

                            return (
                              <div key={column.key} className="min-w-0">
                                <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                                  {column.label}
                                </p>
                                <p className="mt-0.5 text-center text-xs font-semibold text-gray-700">
                                  {formatAmount(allocation?.achieved)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="hidden overflow-x-auto rounded-xl border border-gray-200 lg:block">
                  <table className="w-full min-w-[860px] table-fixed border-collapse text-sm">
                    <thead className="bg-blue-100 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="w-56 px-4 py-3 text-left">Staff</th>
                        {columns.map((column) => (
                          <th
                            key={column.key}
                            className="min-w-[90px] px-2 py-3 text-center"
                          >
                            {column.label}
                          </th>
                        ))}
                        <th className="w-28 px-4 py-3 text-right">Amount</th>
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((user) => {
                        const total = getUserTotal(user?.allocations);

                        return (
                          <tr
                            key={user.userId}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleOpenUserLeads(user)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                handleOpenUserLeads(user);
                              }
                            }}
                            className="cursor-pointer border-t border-gray-100 bg-white transition-colors hover:bg-blue-50/70 focus:bg-blue-50/70 focus:outline-none"
                          >
                            <td className="px-4 py-3">
                              <div className="flex min-w-0 items-center gap-2.5">
                                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-[10px] font-bold text-white">
                                  {getInitials(user?.name)}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-xs font-semibold text-gray-900">
                                    {user?.name || "—"}
                                  </p>
                                  <p className="truncate text-[10px] text-gray-400">
                                    {user?.designation || "—"}
                                  </p>
                                </div>
                              </div>
                            </td>

                            {columns.map((column) => {
                              const allocation = user?.allocations?.find(
                                (item) => item.key === column.key
                              );

                              return (
                                <td
                                  key={column.key}
                                  className="px-2 py-3 text-center text-xs font-semibold text-gray-700"
                                >
                                  {formatAmount(allocation?.achieved)}
                                </td>
                              );
                            })}

                            <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                              {formatAmount(total)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })
        )}
      </main>

      {showLeadsModal && selectedUser && selectedAllocation && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black/20" />}>
          <IncentiveLeadsModal
            key={`${reportBranch}:${reportYear}:${reportPeriod}:${selectedUser.userId}`}
            user={selectedUser}
            allocation={selectedAllocation}
            year={Number(reportYear)}
            period={reportPeriod}
            selectedBranch={reportBranch}
            canEditAssignments={isAdmin || (loggeduser?.role === "Staff" && loggeduser?.isVerified === true &&
              loggeduser?.permissions?.some((permission) => permission.LeadReallocation === true)) || false}
            onClose={closeLeadsModal}
            onAssignmentUpdated={refreshReport}
          />
        </Suspense>
      )}
    </div>
  );
}

IncentiveReport.propTypes = {
  selectedYear: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selectedPeriod: PropTypes.string
};
