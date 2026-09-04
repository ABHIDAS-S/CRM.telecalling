// import { useEffect, useMemo, useRef, useState } from "react"
// import { useLocation, useNavigate } from "react-router-dom"
// import { toast } from "react-toastify"
// import { useSelector } from "react-redux"
// import api from "../api/api"
// import ReportBugButton from "../components/developer/ReportBugButton"
// import { useUnsavedChanges } from "../context/UnsavedChangesContext"
// import {
//   FiMenu,
//   FiX,
//   FiChevronDown,
//   FiChevronRight,
//   FiLogOut,
//   FiRepeat,
//   FiBox,
//   FiClock,
//   FiFilter,
//   FiPhoneCall,
//   FiCalendar,
//   FiSearch,
//   FiClipboard,
//   FiActivity,
//   FiUserCheck,
//   FiUserX
// } from "react-icons/fi"
// import {
//   MessageSquareText,
//   Bell,
//   Settings,
//   User,
//   ChevronDown
// } from "lucide-react"
// import { FaUserCircle } from "react-icons/fa"

// /**
//  * StaffHeader
//  *
//  * Profile display rule (matches the two reference states):
//  *  - When the sidebar is expanded and already shows a profile card,
//  *    pass `sidebarHasProfile` (defaults to true) so the header does NOT
//  *    duplicate the avatar/name.
//  *  - When the sidebar is collapsed to icons-only (no profile card
//  *    visible anywhere else), pass `sidebarHasProfile={false}` and the
//  *    header shows the avatar + name + role + a dropdown menu instead.
//  *
//  * Usage:
//  *   <StaffHeader
//  *     sidebarHasProfile={sidebarExpanded}
//  *     onNotificationClick={() => setShowNotifications(true)}
//  *     notificationCount={3}
//  *     messageCount={2}
//  *   />
//  */
// export default function StaffHeader({
//   onNotificationClick,
//   sidebarHasProfile = true,
//   notificationCount = 0,
//   messageCount = 0
// }) {
//   const [user, setUser] = useState(null)
//   const [mobileOpen, setMobileOpen] = useState(false)
//   const [mobileMenu, setMobileMenu] = useState(null)
//   const [mobileChildMenu, setMobileChildMenu] = useState(null)
//   const [showUserMenu, setShowUserMenu] = useState(false)

//   const navigate = useNavigate()
//   const location = useLocation()
//   const { requestNavigation } = useUnsavedChanges()
//   const activeCompany = useSelector((state) => state.auth.activeCompany)

//   const userMenuRef = useRef(null)

//   useEffect(() => {
//     const storedUser = localStorage.getItem("user")
//     if (storedUser) {
//       try {
//         setUser(JSON.parse(storedUser))
//       } catch {
//         setUser(null)
//       }
//     }
//   }, [])

//   // Close the profile dropdown on outside click / Escape — the old code
//   // referenced a "user-menu-container" class as if this existed but
//   // never actually wired it up.
//   useEffect(() => {
//     if (!showUserMenu) return

//     const handleClickOutside = (e) => {
//       if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
//         setShowUserMenu(false)
//       }
//     }
//     const handleEscape = (e) => {
//       if (e.key === "Escape") setShowUserMenu(false)
//     }

//     document.addEventListener("mousedown", handleClickOutside)
//     document.addEventListener("keydown", handleEscape)
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside)
//       document.removeEventListener("keydown", handleEscape)
//     }
//   }, [showUserMenu])

//   const permissions = user?.permissions?.[0] || {}

//   const masters = useMemo(
//     () => [
//       { to: "/staff/masters/company", label: "Company", control: permissions.Company ?? false },
//       { to: "/staff/masters/branch", label: "Branch", control: permissions.Branch ?? false },
//       { to: "/staff/masters/department", label: "Department", control: permissions.Department ?? false },
//       { label: "Product & Service", hasChildren: true, control: permissions.ProductandServices ?? false },
//       { to: "/staff/masters/customer", label: "Customer", control: permissions.Customer ?? false },
//       { label: "Employee", hasChildren: true, control: permissions.Employee ?? false },
//       { to: "/staff/masters/leavemaster", label: "Leave Master", control: permissions.Leavemaster ?? false },
//       { to: "/staff/masters/partners", label: "Partners", control: permissions.Partners ?? false }
//     ],
//     [permissions]
//   )

//   const productAndServices = useMemo(
//     () => [
//       { to: "/staff/masters/product", label: "Product", control: permissions.Product ?? false },
//       { to: "/staff/masters/servicesRegistration", label: "Services", control: permissions.Services ?? false },
//       { to: "/staff/masters/inventory/brandRegistration", label: "Brand", control: permissions.Brand ?? false },
//       { to: "/staff/masters/inventory/categoryRegistration", label: "Category", control: permissions.Category ?? false },
//       { to: "/staff/masters/inventory/hsnlist", label: "HSN", control: permissions.HSN ?? false },
//       { to: "/staff/masters/callnotes", label: "Call Notes", control: permissions.CallNotes ?? false },
//       { to: "/staff/masters/taskRegistration", label: "Task Level", control: permissions.TaskLevel ?? false }
//     ],
//     [permissions]
//   )

//   const employeeMenu = useMemo(
//     () => [
//       { to: "/staff/masters/users-&-passwords", label: "Users & Passwords", control: permissions.UsersAndPasswords ?? false },
//       { to: "/staff/masters/menuRights", label: "Menu Rights", control: permissions.MenuRights ?? false },
//       { to: "/staff/masters/target", label: "Target", control: permissions.Target ?? false },
//       { to: "/staff/masters/voucherMaster", label: "Voucher Master", control: permissions.VoucherMaster ?? false }
//     ],
//     [permissions]
//   )

//   const transactions = useMemo(
//     () => [
//       { to: "/staff/transaction/call-registration", label: "Call Registration", control: permissions.CallRegistration ?? false },
//       { to: "/staff/support&department", label: "Support Department", control: permissions.SupportDepartment ?? false },
//       { to: "/staff/transaction/leave-application", label: "Leave Application", control: permissions.LeaveApplication ?? false },
//       { to: "/staff/transaction/lead", label: "New Lead", control: true },
//       { to: "/staff/transaction/lead/collectionUpdate", label: "Collection Update", control: permissions.CollectionUpdate ?? false }
//     ],
//     [permissions]
//   )

//   const tasks = useMemo(
//     () => [
//       { to: "/staff/transaction/lead/leadReallocation", label: "Task Allocation", control: permissions.LeadReallocation ?? false },
//       { to: "/staff/transaction/lead/leadAllocation", label: "Follow-Up Allocation", control: permissions.LeadAllocation ?? false },
//       { to: "/staff/transaction/lead/leadTask", label: "Task Pending", control: true },
//       { to: "/staff/tasks/leaveApproval-pending", label: "Leave Approval Pending", control: permissions.LeaveApprovalPending ?? false },
//       { to: "/staff/tasks/excelconverter", label: "Customer Converter (Excel to JSON)", control: permissions.ExcelConverter ?? false },
//       { to: "/staff/tasks/attendanceExcelconverter", label: "Attendance Converter", control: permissions.AttendanceExcelConverter ?? false }
//     ],
//     [permissions]
//   )

//   const reports = useMemo(
//     () => [
//       {
//         group: "Marketing",
//         items: [
//           { to: "/staff/reports/follow-up-summary", label: "Followup Summary", icon: FiRepeat, control: permissions.FollowupSummary ?? false },
//           { to: "/staff/reports/product-wise-report", label: "Lead ( Staff / Product )", icon: FiBox, control: permissions.ProductWiseReport ?? false },
//           { to: "/staff/reports/sales-funel", label: "Sales Funnel", icon: FiFilter, control: permissions.SalesFunnel ?? false },
//           { to: "/staff/transaction/lead/leadFollowUp", label: "In Follow-Up", icon: FiClock, control: permissions.LeadFollowUp ?? false },
//           { to: "/staff/transaction/lead/ownedLeadlist", label: "Own Lead", icon: FiUserCheck, control: true },
//           { to: "/staff/transaction/lead/lostLeads", label: "Lost Leads", icon: FiUserX, control: permissions.LostLeads ?? false }
//         ]
//       },
//       {
//         group: "Service",
//         items: [
//           { to: "/staff/reports/summary", label: "Call Summary", icon: FiPhoneCall, control: permissions.Summary ?? false },
//           { to: "/staff/reports/expiry-register", label: "Expiry Register", icon: FiCalendar, control: permissions.ExpiryRegister ?? false },
//           { to: "/staff/reports/account-search", label: "Account Search", icon: FiSearch, control: permissions.AccountSearch ?? false }
//         ]
//       },
//       {
//         group: "My Activities",
//         items: [
//           { to: "/staff/reports/leave-summary", label: "Attendance Summary", icon: FiClipboard, control: permissions.LeaveSummary ?? false },
//           { to: "/staff/reports/dailystaffactivity", label: "Daily Staff Activity", icon: FiActivity, control: permissions.DailyStaffActivity ?? false }
//         ]
//       }
//     ],
//     [permissions]
//   )

//   const menuGroups = useMemo(
//     () => [
//       { label: "Masters", items: masters },
//       { label: "Transactions", items: transactions },
//       { label: "Reports", items: reports },
//       { label: "Tasks", items: tasks }
//     ],
//     [masters, transactions, reports, tasks]
//   )

//   const getChildItems = (label) => {
//     if (label === "Product & Service") return productAndServices.filter((i) => i.control)
//     if (label === "Employee") return employeeMenu.filter((i) => i.control)
//     return []
//   }

//   const getVisibleReportItems = () =>
//     reports.flatMap((groupItem) => groupItem.items).filter((i) => i.control)

//   const handleSafeNavigate = (path, options = {}) => {
//     requestNavigation(() => {
//       setMobileOpen(false)
//       setMobileMenu(null)
//       setMobileChildMenu(null)
//       navigate(path, options)
//     })
//   }

//   const isPathActive = (path) => location.pathname === path

//   const isGroupActive = (items) =>
//     items.some((item) => {
//       if (item.to && location.pathname === item.to) return true
//       if (item.hasChildren) {
//         return getChildItems(item.label).some((child) => location.pathname === child.to)
//       }
//       return false
//     })

//   const isReportsGroupActive = () =>
//     reports.some((groupItem) => groupItem.items.some((child) => location.pathname === child.to))

//   const getDashboardPath = () => {
//     if (!user) return "/staff/dashBoard"
//     if (user.role === "Admin") return "/admin/dashboard"

//     switch (user.department?.code) {
//       case "DEPARTMENT1":
//       case "DEPARTMENT2":
//         return "/staff/dashboard"
//       case "DEPARTMENT3":
//         return "/staff/reports/markettingdashboard"
//       case "DEPARTMENT4":
//         return "/staff/support&department"
//       default:
//         return "/staff/dashboard"
//     }
//   }

//   const logout = async () => {
//     try {
//       const res = await api.post("/auth/logout")
//       if (res.status === 200 && res.data?.message === "Logged out successfully") {
//         localStorage.removeItem("authToken")
//         localStorage.removeItem("user")
//         localStorage.removeItem("timer")
//         localStorage.removeItem("wish")
//         toast.success("Logout successfully")
//         navigate("/")
//       } else {
//         toast.error("Logout failed on server")
//       }
//     } catch (err) {
//       console.error(err)
//       toast.error("Logout failed, please try again")
//     }
//   }

//   const DesktopLeafLink = ({ to, label }) => (
//     <button
//       type="button"
//       onClick={() => handleSafeNavigate(to)}
//       className={`block w-full rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${
//         isPathActive(to)
//           ? "bg-[#243145] text-white"
//           : "text-slate-100 hover:bg-[#1E293B] hover:text-white"
//       }`}
//     >
//       {label}
//     </button>
//   )

//   const DesktopChildPanel = ({ items }) => (
//     <div className="invisible absolute left-[calc(100%+8px)] top-0 z-50 min-w-[240px] translate-x-1 rounded-2xl border border-white/10 bg-[#162033] p-2 opacity-0 shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition-all duration-150 group-hover/child:visible group-hover/child:translate-x-0 group-hover/child:opacity-100 group-focus-within/child:visible group-focus-within/child:translate-x-0 group-focus-within/child:opacity-100">
//       {items.map((child) => (
//         <DesktopLeafLink key={child.to} to={child.to} label={child.label} />
//       ))}
//     </div>
//   )

//   const DesktopDropdown = ({ items }) => (
//     <div className="invisible absolute left-0 top-[calc(100%+10px)] z-50 min-w-[260px] translate-y-1 rounded-2xl border border-white/10 bg-[#162033] p-2 opacity-0 shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition-all duration-150 group-hover/menu:visible group-hover/menu:translate-y-0 group-hover/menu:opacity-100 group-focus-within/menu:visible group-focus-within/menu:translate-y-0 group-focus-within/menu:opacity-100">
//       {items
//         .filter((item) => item.control)
//         .map((item) => {
//           if (!item.hasChildren) {
//             return <DesktopLeafLink key={item.to} to={item.to} label={item.label} />
//           }
//           const childItems = getChildItems(item.label)
//           if (!childItems.length) return null
//           return (
//             <div key={item.label} className="group/child relative">
//               <button
//                 type="button"
//                 className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-slate-100 transition hover:bg-[#1E293B]"
//               >
//                 <span>{item.label}</span>
//                 <FiChevronRight className="text-slate-400" size={14} />
//               </button>
//               <DesktopChildPanel items={childItems} />
//             </div>
//           )
//         })}
//     </div>
//   )

//   const DesktopReportsDropdown = ({ groups }) => (
//     <div className="invisible absolute left-0 top-[calc(100%+10px)] z-50 w-64 translate-y-1 rounded-2xl border border-white/10 bg-[#162033] p-2 py-2 opacity-0 shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition-all duration-150 group-hover/menu:visible group-hover/menu:translate-y-0 group-hover/menu:opacity-100 group-focus-within/menu:visible group-focus-within/menu:translate-y-0 group-focus-within/menu:opacity-100">
//       {groups.map((groupItem, idx) => {
//         const visible = groupItem.items.filter((i) => i.control)
//         if (!visible.length) return null
//         return (
//           <div key={groupItem.group} className={idx !== 0 ? "mt-1 border-t border-white/10 pt-2" : ""}>
//             <div className="px-3 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-wider text-sky-400">
//               {groupItem.group}
//             </div>
//             {visible.map((child) => {
//               const ChildIcon = child.icon
//               return (
//                 <button
//                   key={child.to}
//                   type="button"
//                   onClick={() => handleSafeNavigate(child.to)}
//                   className={`flex w-full items-center gap-1.5 rounded-xl px-3 py-1 text-left text-[13px] font-medium transition ${
//                     isPathActive(child.to)
//                       ? "bg-[#243145] text-white"
//                       : "text-slate-100 hover:bg-[#1E293B] hover:text-white"
//                   }`}
//                 >
//                   {ChildIcon && (
//                     <ChildIcon
//                       className={`h-4 w-4 shrink-0 ${isPathActive(child.to) ? "text-sky-400" : "text-slate-400"}`}
//                     />
//                   )}
//                   <span>{child.label}</span>
//                 </button>
//               )
//             })}
//           </div>
//         )
//       })}
//     </div>
//   )

//   const IconBadge = ({ count }) =>
//     count > 0 ? (
//       <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
//         {count > 9 ? "9+" : count}
//       </span>
//     ) : null

//   return (
//     <>
//       <header className="sticky top-0 z-50 bg-[#0B1220] text-white shadow-[0_2px_10px_rgba(0,0,0,0.25)]">
//         <div className="relative mx-auto flex h-16 w-full items-center gap-3 px-3 sm:px-4 lg:px-6">
//           {/* Logo + mobile menu toggle */}
//           <div className="flex min-w-0 items-center gap-3">
//             <button
//               onClick={() => setMobileOpen(true)}
//               className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#162033] text-slate-200 transition hover:bg-[#1E293B] xl:hidden"
//               aria-label="Open menu"
//             >
//               <FiMenu size={18} />
//             </button>

//             <button
//               type="button"
//               onClick={() => handleSafeNavigate(getDashboardPath())}
//               className="flex items-center gap-2.5"
//             >
//               <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-lg font-bold shadow-[0_6px_18px_rgba(56,189,248,0.35)]">
//                 C
//               </div>
//               <div className="hidden text-left sm:block">
//                 <div className="text-[15px] font-bold leading-4 tracking-wide">CAMET</div>
//                 <div className="text-[10px] font-medium leading-4 text-slate-400">CRM</div>
//               </div>
//             </button>
//           </div>

//           {/* Desktop nav — absolutely centered on the header so it stays
//               visually centered no matter how wide the logo or icon row
//               on either side are (a plain flex/1fr split only centers
//               within its own column, which drifts once the two sides
//               are unequal widths). Also means adding more tabs later
//               doesn't require re-balancing anything. */}
//           <nav className="absolute left-1/2 top-0 hidden h-full -translate-x-1/2 items-center gap-1 xl:flex">
//             <button
//               type="button"
//               onClick={() => handleSafeNavigate(getDashboardPath())}
//               className={`border-b-2 px-1 py-5 text-[14px] font-semibold transition ${
//                 isPathActive("/staff/dashBoard") || isPathActive(getDashboardPath())
//                   ? "border-sky-400 text-sky-400"
//                   : "border-transparent text-slate-300 hover:text-white"
//               }`}
//             >
//               Dashboard
//             </button>

//             {menuGroups.map((group) => {
//               const isReports = group.label === "Reports"
//               const visibleItems = isReports ? getVisibleReportItems() : group.items.filter((i) => i.control)
//               if (!visibleItems.length) return null

//               const activeGroup = isReports ? isReportsGroupActive() : isGroupActive(group.items)

//               return (
//                 <div key={group.label} className="group/menu relative ml-5">
//                   <button
//                     type="button"
//                     className={`flex items-center gap-1.5 border-b-2 py-5 text-[14px] font-semibold transition ${
//                       activeGroup
//                         ? "border-sky-400 text-sky-400"
//                         : "border-transparent text-slate-300 hover:text-white"
//                     }`}
//                   >
//                     <span>{group.label}</span>
//                     <FiChevronDown size={13} />
//                   </button>
//                   {isReports ? <DesktopReportsDropdown groups={reports} /> : <DesktopDropdown items={group.items} />}
//                 </div>
//               )
//             })}
//           </nav>

//           {/* Icon row */}
//           <div className="ml-auto flex items-center gap-1.5 pl-1">
//             <div className="relative">
//               <button
//                 type="button"
//                 onClick={onNotificationClick}
//                 title="Notifications"
//                 className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-200 transition hover:bg-white/20"
//               >
//                 <Bell size={15} strokeWidth={2.2} />
//                 <IconBadge count={notificationCount} />
//               </button>
//             </div>

//             <div className="relative">
//               <button
//                 type="button"
//                 onClick={onNotificationClick}
//                 title="Messages"
//                 className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-200 transition hover:bg-white/20"
//               >
//                 <MessageSquareText size={15} strokeWidth={2.2} />
//                 <IconBadge count={messageCount} />
//               </button>
//             </div>

//             <button
//               type="button"
//               onClick={() => handleSafeNavigate("/staff/settings")}
//               title="Settings"
//               className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-slate-200 transition hover:bg-white/20"
//             >
//               <Settings size={15} strokeWidth={2.2} />
//             </button>

//             <ReportBugButton api={api} />

//             {/* Profile in header ONLY when the sidebar isn't already showing one */}
//             {!sidebarHasProfile && (
//               <div className="relative ml-1" ref={userMenuRef}>
//                 <button
//                   type="button"
//                   onClick={() => setShowUserMenu((prev) => !prev)}
//                   className="flex items-center gap-2 rounded-full bg-white/10 py-1 pl-1 pr-2.5 transition hover:bg-white/20"
//                 >
//                   {user?.profileUrl ? (
//                     <img
//                       src={user.profileUrl}
//                       alt="Profile"
//                       className="h-8 w-8 rounded-full object-cover ring-1 ring-white/20"
//                     />
//                   ) : (
//                     <FaUserCircle className="text-[28px] text-slate-300" />
//                   )}
//                   <div className="hidden text-left sm:block">
//                     <div className="max-w-[110px] truncate text-[12.5px] font-semibold leading-4 text-white">
//                       {user?.name || "Staff User"}
//                     </div>
//                     <div className="max-w-[110px] truncate text-[10.5px] leading-4 text-slate-400">
//                       {user?.role || "Staff"}
//                     </div>
//                   </div>
//                   <ChevronDown
//                     size={14}
//                     className={`hidden text-slate-400 transition-transform sm:block ${showUserMenu ? "rotate-180" : ""}`}
//                   />
//                 </button>

//                 {showUserMenu && (
//                   <div className="absolute right-0 top-[calc(100%+8px)] z-[9999] w-52 overflow-hidden rounded-xl border border-white/10 bg-[#162033] py-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
//                     <div className="border-b border-white/10 px-3.5 py-2.5 sm:hidden">
//                       <div className="truncate text-[13px] font-semibold text-white">{user?.name || "Staff User"}</div>
//                       <div className="truncate text-[11px] text-slate-400">{user?.role || "Staff"}</div>
//                     </div>
//                     <button
//                       type="button"
//                       onClick={() => {
//                         setShowUserMenu(false)
//                         handleSafeNavigate("/staff/profile")
//                       }}
//                       className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-slate-100 transition hover:bg-[#1E293B]"
//                     >
//                       <User size={15} className="text-slate-400" />
//                       My Profile
//                     </button>
//                     <button
//                       type="button"
//                       onClick={() => {
//                         setShowUserMenu(false)
//                         handleSafeNavigate("/staff/settings")
//                       }}
//                       className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-slate-100 transition hover:bg-[#1E293B]"
//                     >
//                       <Settings size={15} className="text-slate-400" />
//                       Settings
//                     </button>
//                     <button
//                       type="button"
//                       onClick={() => {
//                         setShowUserMenu(false)
//                         handleSafeNavigate("/staff/change-password")
//                       }}
//                       className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-slate-100 transition hover:bg-[#1E293B]"
//                     >
//                       <FiLogOut size={15} className="rotate-180 text-slate-400" />
//                       Change Password
//                     </button>
//                     <div className="my-1 border-t border-white/10" />
//                     <button
//                       type="button"
//                       onClick={() => {
//                         setShowUserMenu(false)
//                         logout()
//                       }}
//                       className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-rose-300 transition hover:bg-rose-500/10"
//                     >
//                       <FiLogOut size={15} />
//                       Logout
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       </header>

//       {/* Mobile drawer */}
//       {mobileOpen && (
//         <>
//           <div
//             className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm xl:hidden"
//             onClick={() => setMobileOpen(false)}
//           />

//           <aside className="fixed left-0 top-0 z-50 h-screen w-[88%] max-w-[360px] overflow-y-auto border-r border-white/10 bg-[#0F172A] text-white shadow-[0_20px_80px_rgba(0,0,0,0.55)] xl:hidden">
//             <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
//               <div className="flex items-center gap-3">
//                 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-[15px] font-bold">
//                   C
//                 </div>
//                 <div>
//                   <div className="text-[14px] font-bold text-white">CAMET</div>
//                   <div className="text-[10px] text-slate-400">CRM</div>
//                 </div>
//               </div>
//               <button
//                 onClick={() => setMobileOpen(false)}
//                 className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#162033]"
//                 aria-label="Close menu"
//               >
//                 <FiX size={18} />
//               </button>
//             </div>

//             {/* Profile card always shows in the mobile drawer regardless of
//                 sidebarHasProfile — on mobile there's no separate sidebar to
//                 rely on, so this is the one place it belongs. */}
//             <div className="border-b border-white/10 px-4 py-4">
//               <div className="flex items-center gap-3">
//                 {user?.profileUrl ? (
//                   <img
//                     src={user.profileUrl}
//                     alt="Profile"
//                     className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/10"
//                   />
//                 ) : (
//                   <FaUserCircle className="text-[36px] text-slate-400" />
//                 )}
//                 <div className="min-w-0">
//                   <div className="truncate text-[14px] font-semibold">{user?.name || "Staff User"}</div>
//                   <div className="truncate text-[12px] text-slate-400">
//                     {user?.selected?.[0]?.branchName || user?.role || "Branch"}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="p-3">
//               <button
//                 type="button"
//                 onClick={() => handleSafeNavigate(getDashboardPath())}
//                 className={`mb-2 block w-full rounded-2xl px-4 py-3 text-left text-[14px] font-medium ${
//                   isPathActive("/staff/dashBoard")
//                     ? "bg-[#243145] text-white"
//                     : "text-slate-200 hover:bg-[#1E293B]"
//                 }`}
//               >
//                 Dashboard
//               </button>

//               {menuGroups.map((group) => {
//                 const isReports = group.label === "Reports"
//                 const visibleItems = isReports ? getVisibleReportItems() : group.items.filter((i) => i.control)
//                 if (!visibleItems.length) return null

//                 return (
//                   <div key={group.label} className="mb-1 rounded-2xl border border-white/10 bg-[#162033]">
//                     <button
//                       onClick={() => setMobileMenu(mobileMenu === group.label ? null : group.label)}
//                       className="flex w-full items-center justify-between px-4 py-3 text-[14px] font-medium text-slate-200"
//                     >
//                       <span>{group.label}</span>
//                       {mobileMenu === group.label ? (
//                         <FiChevronDown size={16} className="text-slate-400" />
//                       ) : (
//                         <FiChevronRight size={16} className="text-slate-400" />
//                       )}
//                     </button>

//                     {mobileMenu === group.label && (
//                       <div className="border-t border-white/10 px-2 pb-1">
//                         {isReports
//                           ? reports.map((groupItem) => {
//                               const visible = groupItem.items.filter((i) => i.control)
//                               if (!visible.length) return null
//                               return (
//                                 <div key={groupItem.group} className="mb-1">
//                                   <div className="px-3 pb-0 pt-2 text-[11px] font-bold uppercase tracking-wider text-sky-400">
//                                     {groupItem.group}
//                                   </div>
//                                   {visible.map((child) => {
//                                     const ChildIcon = child.icon
//                                     return (
//                                       <button
//                                         key={child.to}
//                                         type="button"
//                                         onClick={() => handleSafeNavigate(child.to)}
//                                         className={`flex w-full items-center gap-1.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium ${
//                                           isPathActive(child.to)
//                                             ? "bg-[#243145] text-white"
//                                             : "text-slate-300 hover:bg-[#1E293B]"
//                                         }`}
//                                       >
//                                         {ChildIcon && (
//                                           <ChildIcon
//                                             className={`h-4 w-4 shrink-0 ${
//                                               isPathActive(child.to) ? "text-sky-400" : "text-slate-400"
//                                             }`}
//                                           />
//                                         )}
//                                         <span>{child.label}</span>
//                                       </button>
//                                     )
//                                   })}
//                                 </div>
//                               )
//                             })
//                           : visibleItems.map((item) => {
//                               if (!item.hasChildren) {
//                                 return (
//                                   <button
//                                     key={item.to}
//                                     type="button"
//                                     onClick={() => handleSafeNavigate(item.to)}
//                                     className={`block w-full rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${
//                                       isPathActive(item.to)
//                                         ? "bg-[#243145] text-white"
//                                         : "text-slate-300 hover:bg-[#1E293B]"
//                                     }`}
//                                   >
//                                     {item.label}
//                                   </button>
//                                 )
//                               }

//                               const childItems = getChildItems(item.label)
//                               if (!childItems.length) return null

//                               return (
//                                 <div key={item.label}>
//                                   <button
//                                     onClick={() =>
//                                       setMobileChildMenu(mobileChildMenu === item.label ? null : item.label)
//                                     }
//                                     className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-300 hover:bg-[#1E293B]"
//                                   >
//                                     <span>{item.label}</span>
//                                     {mobileChildMenu === item.label ? (
//                                       <FiChevronDown size={14} className="text-slate-500" />
//                                     ) : (
//                                       <FiChevronRight size={14} className="text-slate-500" />
//                                     )}
//                                   </button>

//                                   {mobileChildMenu === item.label && (
//                                     <div className="ml-3 border-l border-white/10 pl-2">
//                                       {childItems.map((child) => (
//                                         <button
//                                           key={child.to}
//                                           type="button"
//                                           onClick={() => handleSafeNavigate(child.to)}
//                                           className={`block w-full rounded-xl px-3 py-2.5 text-left text-[13px] transition ${
//                                             isPathActive(child.to)
//                                               ? "bg-[#243145] text-white"
//                                               : "text-slate-300 hover:bg-[#1E293B]"
//                                           }`}
//                                         >
//                                           {child.label}
//                                         </button>
//                                       ))}
//                                     </div>
//                                   )}
//                                 </div>
//                               )
//                             })}
//                       </div>
//                     )}
//                   </div>
//                 )
//               })}

//               <button
//                 onClick={logout}
//                 className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-[14px] font-semibold text-rose-300"
//               >
//                 <FiLogOut size={15} />
//                 Logout
//               </button>
//             </div>
//           </aside>
//         </>
//       )}
//     </>
//   )
// }

// import { useEffect, useMemo, useRef, useState } from "react"
// import { useLocation, useNavigate } from "react-router-dom"
// import { toast } from "react-toastify"
// import { useSelector } from "react-redux"
// import api from "../api/api"
// import ReportBugButton from "../components/developer/ReportBugButton"
// import { useUnsavedChanges } from "../context/UnsavedChangesContext"
// import {
//   FiMenu,
//   FiX,
//   FiChevronDown,
//   FiChevronRight,
//   FiLogOut,
//   FiRepeat,
//   FiBox,
//   FiClock,
//   FiFilter,
//   FiPhoneCall,
//   FiCalendar,
//   FiSearch,
//   FiClipboard,
//   FiActivity,
//   FiUserCheck,
//   FiUserX
// } from "react-icons/fi"
// import {
//   MessageSquareText,
//   Bell,
//   Settings,
//   User,
//   ChevronDown
// } from "lucide-react"
// import { FaUserCircle } from "react-icons/fa"

// export default function StaffHeader({
//   onNotificationClick,
//   onpasswordClick,

//   sidebarHasProfile = true,
//   notificationCount = 0,
//   messageCount = 0
// }) {
//   console.log(sidebarHasProfile)
//   const [user, setUser] = useState(null)
//   const [mobileOpen, setMobileOpen] = useState(false)
//   console.log(mobileOpen)
//   const [mobileMenu, setMobileMenu] = useState(null)
//   const [mobileChildMenu, setMobileChildMenu] = useState(null)
//   const [showUserMenu, setShowUserMenu] = useState(false)

//   const navigate = useNavigate()
//   const location = useLocation()
//   const { requestNavigation } = useUnsavedChanges()
//   const activeCompany = useSelector((state) => state.auth.activeCompany)

//   const userMenuRef = useRef(null)

//   useEffect(() => {
//     const storedUser = localStorage.getItem("user")
//     if (storedUser) {
//       try {
//         setUser(JSON.parse(storedUser))
//       } catch {
//         setUser(null)
//       }
//     }
//   }, [])

//   useEffect(() => {
//     if (!showUserMenu) return

//     const handleClickOutside = (e) => {
//       if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
//         setShowUserMenu(false)
//       }
//     }

//     const handleEscape = (e) => {
//       if (e.key === "Escape") setShowUserMenu(false)
//     }

//     document.addEventListener("mousedown", handleClickOutside)
//     document.addEventListener("keydown", handleEscape)

//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside)
//       document.removeEventListener("keydown", handleEscape)
//     }
//   }, [showUserMenu])

//   const permissions = user?.permissions?.[0] || {}

//   const masters = useMemo(
//     () => [
//       {
//         to: "/staff/masters/company",
//         label: "Company",
//         control: permissions.Company ?? false
//       },
//       {
//         to: "/staff/masters/branch",
//         label: "Branch",
//         control: permissions.Branch ?? false
//       },
//       {
//         to: "/staff/masters/department",
//         label: "Department",
//         control: permissions.Department ?? false
//       },
//       {
//         label: "Product & Service",
//         hasChildren: true,
//         control: permissions.ProductandServices ?? false
//       },
//       {
//         to: "/staff/masters/customer",
//         label: "Customer",
//         control: permissions.Customer ?? false
//       },
//       {
//         label: "Employee",
//         hasChildren: true,
//         control: permissions.Employee ?? false
//       },
//       {
//         to: "/staff/masters/leavemaster",
//         label: "Leave Master",
//         control: permissions.Leavemaster ?? false
//       },
//       {
//         to: "/staff/masters/partners",
//         label: "Partners",
//         control: permissions.Partners ?? false
//       }
//     ],
//     [permissions]
//   )

//   const productAndServices = useMemo(
//     () => [
//       {
//         to: "/staff/masters/product",
//         label: "Product",
//         control: permissions.Product ?? false
//       },
//       {
//         to: "/staff/masters/servicesRegistration",
//         label: "Services",
//         control: permissions.Services ?? false
//       },
//       {
//         to: "/staff/masters/inventory/brandRegistration",
//         label: "Brand",
//         control: permissions.Brand ?? false
//       },
//       {
//         to: "/staff/masters/inventory/categoryRegistration",
//         label: "Category",
//         control: permissions.Category ?? false
//       },
//       {
//         to: "/staff/masters/inventory/hsnlist",
//         label: "HSN",
//         control: permissions.HSN ?? false
//       },
//       {
//         to: "/staff/masters/callnotes",
//         label: "Call Notes",
//         control: permissions.CallNotes ?? false
//       },
//       {
//         to: "/staff/masters/taskRegistration",
//         label: "Task Level",
//         control: permissions.TaskLevel ?? false
//       }
//     ],
//     [permissions]
//   )

//   const employeeMenu = useMemo(
//     () => [
//       {
//         to: "/staff/masters/users-&-passwords",
//         label: "Users & Passwords",
//         control: permissions.UsersAndPasswords ?? false
//       },
//       {
//         to: "/staff/masters/menuRights",
//         label: "Menu Rights",
//         control: permissions.MenuRights ?? false
//       },
//       {
//         to: "/staff/masters/target",
//         label: "Target",
//         control: permissions.Target ?? false
//       },
//       {
//         to: "/staff/masters/voucherMaster",
//         label: "Voucher Master",
//         control: permissions.VoucherMaster ?? false
//       }
//     ],
//     [permissions]
//   )

//   const transactions = useMemo(
//     () => [
//       {
//         to: "/staff/transaction/call-registration",
//         label: "Call Registration",
//         control: permissions.CallRegistration ?? false
//       },
//       {
//         to: "/staff/support&department",
//         label: "Support Department",
//         control: permissions.SupportDepartment ?? false
//       },
//       {
//         to: "/staff/transaction/leave-application",
//         label: "Leave Application",
//         control: permissions.LeaveApplication ?? false
//       },
//       { to: "/staff/transaction/lead", label: "New Lead", control: true },
//       {
//         to: "/staff/transaction/lead/collectionUpdate",
//         label: "Collection Update",
//         control: permissions.CollectionUpdate ?? false
//       }
//     ],
//     [permissions]
//   )

//   const tasks = useMemo(
//     () => [
//       {
//         to: "/staff/transaction/lead/leadReallocation",
//         label: "Task Allocation",
//         control: permissions.LeadReallocation ?? false
//       },
//       {
//         to: "/staff/transaction/lead/leadAllocation",
//         label: "Follow-Up Allocation",
//         control: permissions.LeadAllocation ?? false
//       },
//       {
//         to: "/staff/transaction/lead/leadTask",
//         label: "Task Pending",
//         control: true
//       },
//       {
//         to: "/staff/tasks/leaveApproval-pending",
//         label: "Leave Approval Pending",
//         control: permissions.LeaveApprovalPending ?? false
//       },
//       {
//         to: "/staff/tasks/excelconverter",
//         label: "Customer Converter (Excel to JSON)",
//         control: permissions.ExcelConverter ?? false
//       },
//       {
//         to: "/staff/tasks/attendanceExcelconverter",
//         label: "Attendance Converter",
//         control: permissions.AttendanceExcelConverter ?? false
//       }
//     ],
//     [permissions]
//   )

//   const reports = useMemo(
//     () => [
//       {
//         group: "Marketing",
//         items: [
//           {
//             to: "/staff/reports/follow-up-summary",
//             label: "Followup Summary",
//             icon: FiRepeat,
//             control: permissions.FollowupSummary ?? false
//           },
//           {
//             to: "/staff/reports/product-wise-report",
//             label: "Lead ( Staff / Product )",
//             icon: FiBox,
//             control: permissions.ProductWiseReport ?? false
//           },
//           {
//             to: "/staff/reports/sales-funel",
//             label: "Sales Funnel",
//             icon: FiFilter,
//             control: permissions.SalesFunnel ?? false
//           },
//           {
//             to: "/staff/transaction/lead/leadFollowUp",
//             label: "In Follow-Up",
//             icon: FiClock,
//             control: permissions.LeadFollowUp ?? false
//           },
//           {
//             to: "/staff/transaction/lead/ownedLeadlist",
//             label: "Own Lead",
//             icon: FiUserCheck,
//             control: true
//           },
//           {
//             to: "/staff/transaction/lead/lostLeads",
//             label: "Lost Leads",
//             icon: FiUserX,
//             control: permissions.LostLeads ?? false
//           }
//         ]
//       },
//       {
//         group: "Service",
//         items: [
//           {
//             to: "/staff/reports/summary",
//             label: "Call Summary",
//             icon: FiPhoneCall,
//             control: permissions.Summary ?? false
//           },
//           {
//             to: "/staff/reports/expiry-register",
//             label: "Expiry Register",
//             icon: FiCalendar,
//             control: permissions.ExpiryRegister ?? false
//           },
//           {
//             to: "/staff/reports/account-search",
//             label: "Account Search",
//             icon: FiSearch,
//             control: permissions.AccountSearch ?? false
//           }
//         ]
//       },
//       {
//         group: "My Activities",
//         items: [
//           {
//             to: "/staff/reports/leave-summary",
//             label: "Attendance Summary",
//             icon: FiClipboard,
//             control: permissions.LeaveSummary ?? false
//           },
//           {
//             to: "/staff/reports/dailystaffactivity",
//             label: "Daily Staff Activity",
//             icon: FiActivity,
//             control: permissions.DailyStaffActivity ?? false
//           }
//         ]
//       }
//     ],
//     [permissions]
//   )

//   const menuGroups = useMemo(
//     () => [
//       { label: "Masters", items: masters },
//       { label: "Transactions", items: transactions },
//       { label: "Reports", items: reports },
//       { label: "Tasks", items: tasks }
//     ],
//     [masters, transactions, reports, tasks]
//   )

//   const getChildItems = (label) => {
//     if (label === "Product & Service")
//       return productAndServices.filter((i) => i.control)
//     if (label === "Employee") return employeeMenu.filter((i) => i.control)
//     return []
//   }

//   const getVisibleReportItems = () =>
//     reports.flatMap((groupItem) => groupItem.items).filter((i) => i.control)

//   const handleSafeNavigate = (path, options = {}) => {
//     requestNavigation(() => {
//       setMobileOpen(false)
//       setMobileMenu(null)
//       setMobileChildMenu(null)
//       setShowUserMenu(false)
//       navigate(path, options)
//     })
//   }

//   const isPathActive = (path) => location.pathname === path

//   const isGroupActive = (items) =>
//     items.some((item) => {
//       if (item.to && location.pathname === item.to) return true
//       if (item.hasChildren) {
//         return getChildItems(item.label).some(
//           (child) => location.pathname === child.to
//         )
//       }
//       return false
//     })

//   const isReportsGroupActive = () =>
//     reports.some((groupItem) =>
//       groupItem.items.some((child) => location.pathname === child.to)
//     )

//   const getDashboardPath = () => {
//     if (!user) return "/staff/dashBoard"
//     if (user.role === "Admin") return "/admin/dashboard"

//     switch (user.department?.code) {
//       case "DEPARTMENT1":
//       case "DEPARTMENT2":
//         return "/staff/dashboard"
//       case "DEPARTMENT3":
//         return "/staff/reports/markettingdashboard"
//       case "DEPARTMENT4":
//         return "/staff/support&department"
//       default:
//         return "/staff/dashboard"
//     }
//   }

//   const logout = async () => {
//     try {
//       console.log("hhh")
//       const res = await api.post("/auth/logout")
//       if (
//         res.status === 200 &&
//         res.data?.message === "Logged out successfully"
//       ) {
//         localStorage.removeItem("authToken")
//         localStorage.removeItem("user")
//         localStorage.removeItem("timer")
//         localStorage.removeItem("wish")
//         toast.success("Logout successfully")
//         navigate("/")
//       } else {
//         toast.error("Logout failed on server")
//       }
//     } catch (err) {
//       console.error(err)
//       toast.error("Logout failed, please try again")
//     }
//   }

//   const DesktopLeafLink = ({ to, label }) => (
//     <button
//       type="button"
//       onClick={() => handleSafeNavigate(to)}
//       className={`block w-full rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${
//         isPathActive(to)
//           ? "bg-[#243145] text-white"
//           : "text-slate-100 hover:bg-[#1E293B] hover:text-white"
//       }`}
//     >
//       {label}
//     </button>
//   )

//   const DesktopChildPanel = ({ items }) => (
//     <div className="invisible absolute left-[calc(100%+8px)] top-0 z-50 min-w-[240px] translate-x-1 rounded-2xl border border-white/10 bg-[#162033] p-2 opacity-0 shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition-all duration-150 group-hover/child:visible group-hover/child:translate-x-0 group-hover/child:opacity-100 group-focus-within/child:visible group-focus-within/child:translate-x-0 group-focus-within/child:opacity-100">
//       {items.map((child) => (
//         <DesktopLeafLink key={child.to} to={child.to} label={child.label} />
//       ))}
//     </div>
//   )

//   const DesktopDropdown = ({ items }) => (
//     <div className="invisible absolute left-0 top-[calc(100%+10px)] z-50 min-w-[260px] translate-y-1 rounded-2xl border border-white/10 bg-[#162033] p-2 opacity-0 shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition-all duration-150 group-hover/menu:visible group-hover/menu:translate-y-0 group-hover/menu:opacity-100 group-focus-within/menu:visible group-focus-within/menu:translate-y-0 group-focus-within/menu:opacity-100">
//       {items
//         .filter((item) => item.control)
//         .map((item) => {
//           if (!item.hasChildren) {
//             return (
//               <DesktopLeafLink key={item.to} to={item.to} label={item.label} />
//             )
//           }
//           const childItems = getChildItems(item.label)
//           if (!childItems.length) return null
//           return (
//             <div key={item.label} className="group/child relative">
//               <button
//                 type="button"
//                 className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-slate-100 transition hover:bg-[#1E293B]"
//               >
//                 <span>{item.label}</span>
//                 <FiChevronRight className="text-slate-400" size={14} />
//               </button>
//               <DesktopChildPanel items={childItems} />
//             </div>
//           )
//         })}
//     </div>
//   )

//   const DesktopReportsDropdown = ({ groups }) => (
//     <div className="invisible absolute left-0 top-[calc(100%+10px)] z-50 w-64 translate-y-1 rounded-2xl border border-white/10 bg-[#162033] p-2 py-2 opacity-0 shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition-all duration-150 group-hover/menu:visible group-hover/menu:translate-y-0 group-hover/menu:opacity-100 group-focus-within/menu:visible group-focus-within/menu:translate-y-0 group-focus-within/menu:opacity-100">
//       {groups.map((groupItem, idx) => {
//         const visible = groupItem.items.filter((i) => i.control)
//         if (!visible.length) return null
//         return (
//           <div
//             key={groupItem.group}
//             className={idx !== 0 ? "mt-1 border-t border-white/10 pt-2" : ""}
//           >
//             <div className="px-3 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-wider text-sky-400">
//               {groupItem.group}
//             </div>
//             {visible.map((child) => {
//               const ChildIcon = child.icon
//               return (
//                 <button
//                   key={child.to}
//                   type="button"
//                   onClick={() => handleSafeNavigate(child.to)}
//                   className={`flex w-full items-center gap-1.5 rounded-xl px-3 py-1 text-left text-[13px] font-medium transition ${
//                     isPathActive(child.to)
//                       ? "bg-[#243145] text-white"
//                       : "text-slate-100 hover:bg-[#1E293B] hover:text-white"
//                   }`}
//                 >
//                   {ChildIcon && (
//                     <ChildIcon
//                       className={`h-4 w-4 shrink-0 ${isPathActive(child.to) ? "text-sky-400" : "text-slate-400"}`}
//                     />
//                   )}
//                   <span>{child.label}</span>
//                 </button>
//               )
//             })}
//           </div>
//         )
//       })}
//     </div>
//   )

//   const IconBadge = ({ count }) =>
//     count > 0 ? (
//       <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
//         {count > 9 ? "9+" : count}
//       </span>
//     ) : null

//   return (
//     <>

// <header className="sticky top-0 z-50 border-b border-slate-300/40 bg-[#ADD8E6]">
//   <div className="mx-auto grid h-16 w-full grid-cols-[1fr_auto_1fr] items-center px-3 sm:px-4 lg:px-6">
//     {/* Left */}
//     <div className="flex min-w-0 items-center gap-3">
//       <button
//         onClick={() => setMobileOpen(true)}
//         className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#162033] text-slate-100 transition hover:bg-[#1E293B] xl:hidden"
//         aria-label="Open menu"
//       >
//         <FiMenu size={18} />
//       </button>

//       {!sidebarHasProfile && (
//         <button
//           type="button"
//           onClick={() => handleSafeNavigate(getDashboardPath())}
//           className="flex min-w-0 items-center gap-2.5"
//         >
//           <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-lg font-bold text-white shadow-[0_6px_18px_rgba(56,189,248,0.35)]">
//             C
//           </div>

//           <div className="hidden min-w-0 text-left sm:block">
//             <div className="truncate text-[15px] font-bold leading-4 tracking-wide text-white">
//               CAMET
//             </div>
//             <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-100/80">
//               CRM
//             </div>
//           </div>
//         </button>
//       )}
//     </div>

//     {/* Center navbar */}
//     <div className="hidden justify-self-center xl:block">
//       <nav className="flex h-12 items-center gap-1 rounded-full border border-white/10 bg-[#081224] px-2 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
//         <button
//           type="button"
//           onClick={() => handleSafeNavigate(getDashboardPath())}
//           className={`rounded-full px-5 py-2 text-[14px] font-semibold transition ${
//             isPathActive("/staff/dashBoard") || isPathActive(getDashboardPath())
//               ? "bg-sky-500/15 text-sky-300"
//               : "text-slate-300 hover:bg-white/5 hover:text-white"
//           }`}
//         >
//           Dashboard
//         </button>

//         {menuGroups.map((group) => {
//           const isReports = group.label === "Reports"
//           const visibleItems = isReports
//             ? getVisibleReportItems()
//             : group.items.filter((i) => i.control)

//           if (!visibleItems.length) return null

//           const activeGroup = isReports
//             ? isReportsGroupActive()
//             : isGroupActive(group.items)

//           return (
//             <div key={group.label} className="group/menu relative">
//               <button
//                 type="button"
//                 className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-[14px] font-semibold transition ${
//                   activeGroup
//                     ? "bg-sky-500/15 text-sky-300"
//                     : "text-slate-300 hover:bg-white/5 hover:text-white"
//                 }`}
//               >
//                 <span>{group.label}</span>
//                 <FiChevronDown size={13} />
//               </button>

//               {isReports ? (
//                 <DesktopReportsDropdown groups={reports} />
//               ) : (
//                 <DesktopDropdown items={group.items} />
//               )}
//             </div>
//           )
//         })}
//       </nav>
//     </div>

//     {/* Right unified capsule */}
//     <div className="hidden min-w-0 justify-self-end xl:flex">
//       <div className="flex h-12 items-center rounded-full border border-white/10 bg-[#081224] pl-2 pr-2 shadow-[0_10px_30px_rgba(0,0,0,0.22)]">
//         <button
//           type="button"
//           onClick={onNotificationClick}
//           title="Notifications"
//           className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/5 hover:text-white"
//         >
//           <Bell size={16} strokeWidth={2.2} />
//           <IconBadge count={notificationCount} />
//         </button>

//         <div className="ml-1 flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/5 hover:text-white">
//           <ReportBugButton api={api} />
//         </div>

//         <div className="mx-2 h-6 w-px bg-white/10" />

//         <div className="relative" ref={userMenuRef}>
//           <button
//             type="button"
//             onClick={() => setShowUserMenu((prev) => !prev)}
//             className="flex h-10 items-center gap-2.5 rounded-full pl-1 pr-2 text-white transition hover:bg-white/5"
//             aria-haspopup="menu"
//             aria-expanded={showUserMenu}
//           >
//             {user?.profileUrl ? (
//               <img
//                 src={user.profileUrl}
//                 alt="Profile"
//                 className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-white/20"
//               />
//             ) : (
//               <FaUserCircle className="shrink-0 text-[28px] text-slate-300" />
//             )}

//             <div className="min-w-[96px] max-w-[130px] text-left">
//               <div className="truncate text-[12.5px] font-semibold leading-4 text-white">
//                 {user?.name?.toUpperCase() || "STAFF USER"}
//               </div>
//               <div className="mt-0.5 truncate text-[10.5px] leading-4 text-slate-400">
//                 {user?.department?.department || "Staff"}
//               </div>
//             </div>

//             <ChevronDown
//               size={14}
//               className={`shrink-0 text-slate-400 transition-transform ${
//                 showUserMenu ? "rotate-180" : ""
//               }`}
//             />
//           </button>

//           {showUserMenu && (
//             <div className="absolute right-0 top-[calc(100%+10px)] z-[9999] w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#162033] py-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
//               <div className="border-b border-white/10 px-3.5 py-3">
//                 <div className="truncate text-[13px] font-semibold text-white">
//                   {user?.name || "Staff User"}
//                 </div>
//                 <div className="truncate text-[11px] text-slate-400">
//                   {user?.selected?.[0]?.branchName || user?.role || "Staff"}
//                 </div>
//               </div>

//               <button
//                 type="button"
//                 className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-slate-100 transition hover:bg-[#1E293B]"
//               >
//                 <User size={15} className="text-slate-400" />
//                 My Profile
//               </button>

//               <button
//                 type="button"
//                 onClick={() => handleSafeNavigate("/staff/settings")}
//                 className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-slate-100 transition hover:bg-[#1E293B]"
//               >
//                 <Settings size={15} className="text-slate-400" />
//                 Settings
//               </button>

//               <button
//                 type="button"
//                 onClick={onpasswordClick}
//                 className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-slate-100 transition hover:bg-[#1E293B]"
//               >
//                 <FiLogOut size={15} className="rotate-180 text-slate-400" />
//                 Change Password
//               </button>

//               <div className="my-1 border-t border-white/10" />

//               <button
//                 type="button"
//                 onClick={() => {
//                   setShowUserMenu(false)
//                   logout()
//                 }}
//                 className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-rose-300 transition hover:bg-rose-500/10"
//               >
//                 <FiLogOut size={15} />
//                 Logout
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>

//     {/* Mobile right */}
//     <div className="flex min-w-0 justify-self-end xl:hidden">
//       <div className="relative" ref={userMenuRef}>
//         <button
//           type="button"
//           onClick={() => setShowUserMenu((prev) => !prev)}
//           className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#081224] text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
//           aria-haspopup="menu"
//           aria-expanded={showUserMenu}
//         >
//           {user?.profileUrl ? (
//             <img
//               src={user.profileUrl}
//               alt="Profile"
//               className="h-8 w-8 rounded-full object-cover ring-1 ring-white/20"
//             />
//           ) : (
//             <FaUserCircle className="text-[28px] text-slate-300" />
//           )}
//         </button>
//       </div>
//     </div>
//   </div>
// </header>
//       {mobileOpen && (
//         <>
//           <div
//             className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm xl:hidden"
//             onClick={() => setMobileOpen(false)}
//           />

//           <aside className="fixed left-0 top-0 z-50 h-screen w-[88%] max-w-[360px] overflow-y-auto border-r border-white/10 bg-[#0F172A] text-white shadow-[0_20px_80px_rgba(0,0,0,0.55)] xl:hidden">
//             <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
//               <div className="flex items-center gap-3">
//                 <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-[15px] font-bold">
//                   C
//                 </div>
//                 <div>
//                   <div className="text-[14px] font-bold text-white">CAMET</div>
//                   <div className="text-[10px] text-slate-400">CRM</div>
//                 </div>
//               </div>
//               <button
//                 onClick={() => setMobileOpen(false)}
//                 className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#162033]"
//                 aria-label="Close menu"
//               >
//                 <FiX size={18} />
//               </button>
//             </div>

//             <div className="border-b border-white/10 px-4 py-4">
//               <div className="flex items-center gap-3">
//                 {user?.profileUrl ? (
//                   <img
//                     src={user.profileUrl}
//                     alt="Profile"
//                     className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/10"
//                   />
//                 ) : (
//                   <FaUserCircle className="text-[36px] text-slate-400" />
//                 )}
//                 <div className="min-w-0">
//                   <div className="truncate text-[14px] font-semibold">
//                     {user?.name || "Staff User"}
//                   </div>
//                   <div className="truncate text-[12px] text-slate-400">
//                     {user?.selected?.[0]?.branchName || user?.role || "Branch"}
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="p-3">
//               <button
//                 type="button"
//                 onClick={() => handleSafeNavigate(getDashboardPath())}
//                 className={`mb-2 block w-full rounded-2xl px-4 py-3 text-left text-[14px] font-medium ${
//                   isPathActive("/staff/dashBoard")
//                     ? "bg-[#243145] text-white"
//                     : "text-slate-200 hover:bg-[#1E293B]"
//                 }`}
//               >
//                 Dashboards
//               </button>

//               {menuGroups.map((group) => {
//                 const isReports = group.label === "Reports"
//                 const visibleItems = isReports
//                   ? getVisibleReportItems()
//                   : group.items.filter((i) => i.control)
//                 if (!visibleItems.length) return null

//                 return (
//                   <div
//                     key={group.label}
//                     className="mb-1 rounded-2xl border border-white/10 bg-[#162033]"
//                   >
//                     <button
//                       onClick={() =>
//                         setMobileMenu(
//                           mobileMenu === group.label ? null : group.label
//                         )
//                       }
//                       className="flex w-full items-center justify-between px-4 py-3 text-[14px] font-medium text-slate-200"
//                     >
//                       <span>{group.label}</span>
//                       {mobileMenu === group.label ? (
//                         <FiChevronDown size={16} className="text-slate-400" />
//                       ) : (
//                         <FiChevronRight size={16} className="text-slate-400" />
//                       )}
//                     </button>

//                     {mobileMenu === group.label && (
//                       <div className="border-t border-white/10 px-2 pb-1">
//                         {isReports
//                           ? reports.map((groupItem) => {
//                               const visible = groupItem.items.filter(
//                                 (i) => i.control
//                               )
//                               if (!visible.length) return null
//                               return (
//                                 <div key={groupItem.group} className="mb-1">
//                                   <div className="px-3 pb-0 pt-2 text-[11px] font-bold uppercase tracking-wider text-sky-400">
//                                     {groupItem.group}
//                                   </div>
//                                   {visible.map((child) => {
//                                     const ChildIcon = child.icon
//                                     return (
//                                       <button
//                                         key={child.to}
//                                         type="button"
//                                         onClick={() =>
//                                           handleSafeNavigate(child.to)
//                                         }
//                                         className={`flex w-full items-center gap-1.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium ${
//                                           isPathActive(child.to)
//                                             ? "bg-[#243145] text-white"
//                                             : "text-slate-300 hover:bg-[#1E293B]"
//                                         }`}
//                                       >
//                                         {ChildIcon && (
//                                           <ChildIcon
//                                             className={`h-4 w-4 shrink-0 ${
//                                               isPathActive(child.to)
//                                                 ? "text-sky-400"
//                                                 : "text-slate-400"
//                                             }`}
//                                           />
//                                         )}
//                                         <span>{child.label}</span>
//                                       </button>
//                                     )
//                                   })}
//                                 </div>
//                               )
//                             })
//                           : visibleItems.map((item) => {
//                               if (!item.hasChildren) {
//                                 return (
//                                   <button
//                                     key={item.to}
//                                     type="button"
//                                     onClick={() => handleSafeNavigate(item.to)}
//                                     className={`block w-full rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${
//                                       isPathActive(item.to)
//                                         ? "bg-[#243145] text-white"
//                                         : "text-slate-300 hover:bg-[#1E293B]"
//                                     }`}
//                                   >
//                                     {item.label}
//                                   </button>
//                                 )
//                               }

//                               const childItems = getChildItems(item.label)
//                               if (!childItems.length) return null

//                               return (
//                                 <div key={item.label}>
//                                   <button
//                                     onClick={() =>
//                                       setMobileChildMenu(
//                                         mobileChildMenu === item.label
//                                           ? null
//                                           : item.label
//                                       )
//                                     }
//                                     className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-300 hover:bg-[#1E293B]"
//                                   >
//                                     <span>{item.label}</span>
//                                     {mobileChildMenu === item.label ? (
//                                       <FiChevronDown
//                                         size={14}
//                                         className="text-slate-500"
//                                       />
//                                     ) : (
//                                       <FiChevronRight
//                                         size={14}
//                                         className="text-slate-500"
//                                       />
//                                     )}
//                                   </button>

//                                   {mobileChildMenu === item.label && (
//                                     <div className="ml-3 border-l border-white/10 pl-2">
//                                       {childItems.map((child) => (
//                                         <button
//                                           key={child.to}
//                                           type="button"
//                                           onClick={() =>
//                                             handleSafeNavigate(child.to)
//                                           }
//                                           className={`block w-full rounded-xl px-3 py-2.5 text-left text-[13px] transition ${
//                                             isPathActive(child.to)
//                                               ? "bg-[#243145] text-white"
//                                               : "text-slate-300 hover:bg-[#1E293B]"
//                                           }`}
//                                         >
//                                           {child.label}
//                                         </button>
//                                       ))}
//                                     </div>
//                                   )}
//                                 </div>
//                               )
//                             })}
//                       </div>
//                     )}
//                   </div>
//                 )
//               })}

//               <button
//                 onClick={logout}
//                 className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-[14px] font-semibold text-rose-300"
//               >
//                 <FiLogOut size={15} />
//                 Logout
//               </button>
//             </div>
//           </aside>
//         </>
//       )}
//     </>
//   )
// }

////current git code ui//
import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { useSelector } from "react-redux"
import api from "../api/api"
import ReportBugButton from "../components/developer/ReportBugButton"
import { useUnsavedChanges } from "../context/UnsavedChangesContext"
import {
  FiMenu,
  FiX,
  FiChevronDown,
  FiChevronRight,
  FiLogOut,
  FiRepeat,
  FiBox,
  FiClock,
  FiFilter,
  FiPhoneCall,
  FiCalendar,
  FiSearch,
  FiClipboard,
  FiActivity,
  FiUserCheck,
  FiUserX
} from "react-icons/fi"
import {
  MessageSquareText,
  Bell,
  Settings,
  User,
  ChevronDown
} from "lucide-react"
import { FaUserCircle } from "react-icons/fa"

export default function StaffHeader({
  onNotificationClick,
  onpasswordClick,
  sidebarHasProfile = true,
  notificationCount = 0,
  messageCount = 0
}) {
  const [user, setUser] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(null)
  const [mobileChildMenu, setMobileChildMenu] = useState(null)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const { requestNavigation } = useUnsavedChanges()
  const activeCompany = useSelector((state) => state.auth.activeCompany)

  const userMenuRef = useRef(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    console.log(storedUser)
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        setUser(null)
      }
    }
  }, [])
  console.log(user)
  useEffect(() => {
    if (!showUserMenu) return

    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false)
      }
    }

    const handleEscape = (e) => {
      if (e.key === "Escape") setShowUserMenu(false)
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleEscape)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleEscape)
    }
  }, [showUserMenu])

  const permissions = user?.permissions?.[0] || {}

  const masters = useMemo(
    () => [
      {
        to: "/staff/masters/company",
        label: "Company",
        control: permissions.Company ?? false
      },
      {
        to: "/staff/masters/branch",
        label: "Branch",
        control: permissions.Branch ?? false
      },
      {
        to: "/staff/masters/department",
        label: "Department",
        control: permissions.Department ?? false
      },
      {
        label: "Product & Service",
        hasChildren: true,
        control: permissions.ProductandServices ?? false
      },
      {
        to: "/staff/masters/customer",
        label: "Customer",
        control: permissions.Customer ?? false
      },
      {
        label: "Employee",
        hasChildren: true,
        control: permissions.Employee ?? false
      },
      {
        to: "/staff/masters/leavemaster",
        label: "Leave Master",
        control: permissions.Leavemaster ?? false
      },
      {
        to: "/staff/masters/partners",
        label: "Partners",
        control: permissions.Partners ?? false
      }
    ],
    [permissions]
  )

  const productAndServices = useMemo(
    () => [
      {
        to: "/staff/masters/product",
        label: "Product",
        control: permissions.Product ?? false
      },
      {
        to: "/staff/masters/servicesRegistration",
        label: "Services",
        control: permissions.Services ?? false
      },
      {
        to: "/staff/masters/inventory/brandRegistration",
        label: "Brand",
        control: permissions.Brand ?? false
      },
      {
        to: "/staff/masters/inventory/categoryRegistration",
        label: "Category",
        control: permissions.Category ?? false
      },
      {
        to: "/staff/masters/inventory/hsnlist",
        label: "HSN",
        control: permissions.HSN ?? false
      },
      {
        to: "/staff/masters/callnotes",
        label: "Call Notes",
        control: permissions.CallNotes ?? false
      },
      {
        to: "/staff/masters/taskRegistration",
        label: "Task Level",
        control: permissions.TaskLevel ?? false
      }
    ],
    [permissions]
  )

  const employeeMenu = useMemo(
    () => [
      {
        to: "/staff/masters/users-&-passwords",
        label: "Users & Passwords",
        control: permissions.UsersAndPasswords ?? false
      },
      {
        to: "/staff/masters/menuRights",
        label: "Menu Rights",
        control: permissions.MenuRights ?? false
      },
      {
        to: "/staff/masters/target",
        label: "Target",
        control: permissions.Target ?? false
      },
      {
        to: "/staff/masters/voucherMaster",
        label: "Voucher Master",
        control: permissions.VoucherMaster ?? false
      }
    ],
    [permissions]
  )

  const transactions = useMemo(
    () => [
      {
        to: "/staff/transaction/call-registration",
        label: "Call Registration",
        control: permissions.CallRegistration ?? false
      },
      {
        to: "/staff/support&department",
        label: "Support Department",
        control: permissions.SupportDepartment ?? false
      },
      {
        to: "/staff/transaction/leave-application",
        label: "Leave Application",
        control: permissions.LeaveApplication ?? false
      },
      { to: "/staff/transaction/lead", label: "New Lead", control: true },
      {
        to: "/staff/transaction/lead/collectionUpdate",
        label: "Collection Update",
        control: permissions.CollectionUpdate ?? false
      }
    ],
    [permissions]
  )

  const tasks = useMemo(
    () => [
      {
        to: "/staff/transaction/lead/leadReallocation",
        label: "Task Allocation",
        control: permissions.LeadReallocation ?? false
      },
      {
        to: "/staff/transaction/lead/leadAllocation",
        label: "Follow-Up Allocation",
        control: permissions.LeadAllocation ?? false
      },
      {
        to: "/staff/transaction/lead/leadTask",
        label: "Task Pending",
        control: true
      },
      {
        to: "/staff/tasks/leaveApproval-pending",
        label: "Leave Approval Pending",
        control: permissions.LeaveApprovalPending ?? false
      },
      {
        to: "/staff/tasks/excelconverter",
        label: "Customer Converter (Excel to JSON)",
        control: permissions.ExcelConverter ?? false
      },
      {
        to: "/staff/tasks/attendanceExcelconverter",
        label: "Attendance Converter",
        control: permissions.AttendanceExcelConverter ?? false
      }
    ],
    [permissions]
  )

  const reports = useMemo(
    () => [
      {
        group: "Marketing",
        items: [
          {
            to: "/staff/reports/follow-up-summary",
            label: "Followup Summary",
            icon: FiRepeat,
            control: permissions.FollowupSummary ?? false
          },
          {
            to: "/staff/reports/product-wise-report",
            label: "Lead ( Staff / Product )",
            icon: FiBox,
            control: permissions.ProductWiseReport ?? false
          },
          {
            to: "/staff/reports/sales-funel",
            label: "Sales Funnel",
            icon: FiFilter,
            control: permissions.SalesFunnel ?? false
          },
          {
            to: "/staff/transaction/lead/leadFollowUp",
            label: "In Follow-Up",
            icon: FiClock,
            control: permissions.LeadFollowUp ?? false
          },
          {
            to: "/staff/transaction/lead/ownedLeadlist",
            label: "Own Lead",
            icon: FiUserCheck,
            control: true
          },
          {
            to: "/staff/transaction/lead/lostLeads",
            label: "Lost Leads",
            icon: FiUserX,
            control: permissions.LostLeads ?? false
          },
          {
            to: "/staff/transaction/lead/closed-leads",
            label: "Closed Leads",
            icon: FiUserX,
            control: permissions.ClosedLeads ?? false
          }
        ]
      },
      {
        group: "Service",
        items: [
          {
            to: "/staff/reports/summary",
            label: "Call Summary",
            icon: FiPhoneCall,
            control: permissions.Summary ?? false
          },
          {
            to: "/staff/reports/expiry-register",
            label: "Expiry Register",
            icon: FiCalendar,
            control: permissions.ExpiryRegister ?? false
          },
          {
            to: "/staff/reports/account-search",
            label: "Account Search",
            icon: FiSearch,
            control: permissions.AccountSearch ?? false
          }
        ]
      },
      {
        group: "My Activities",
        items: [
          {
            to: "/staff/reports/leave-summary",
            label: "Attendance Summary",
            icon: FiClipboard,
            control: permissions.LeaveSummary ?? false
          },
          {
            to: "/staff/reports/dailystaffactivity",
            label: "Daily Staff Activity",
            icon: FiActivity,
            control: permissions.DailyStaffActivity ?? false
          }
        ]
      }
    ],
    [permissions]
  )

  const menuGroups = useMemo(
    () => [
      { label: "Masters", items: masters },
      { label: "Transactions", items: transactions },
      { label: "Reports", items: reports },
      { label: "Tasks", items: tasks }
    ],
    [masters, transactions, reports, tasks]
  )

  const getChildItems = (label) => {
    if (label === "Product & Service")
      return productAndServices.filter((i) => i.control)
    if (label === "Employee") return employeeMenu.filter((i) => i.control)
    return []
  }

  const getVisibleReportItems = () =>
    reports.flatMap((groupItem) => groupItem.items).filter((i) => i.control)

  const handleSafeNavigate = (path, options = {}) => {
    requestNavigation(() => {
      setMobileOpen(false)
      setMobileMenu(null)
      setMobileChildMenu(null)
      setShowUserMenu(false)
      navigate(path, options)
    })
  }

  const isPathActive = (path) => location.pathname === path

  const isGroupActive = (items) =>
    items.some((item) => {
      if (item.to && location.pathname === item.to) return true
      if (item.hasChildren) {
        return getChildItems(item.label).some(
          (child) => location.pathname === child.to
        )
      }
      return false
    })

  const isReportsGroupActive = () =>
    reports.some((groupItem) =>
      groupItem.items.some((child) => location.pathname === child.to)
    )

  const getDashboardPath = () => {
    if (!user) return "/staff/dashBoard"
    if (user.role === "Admin") return "/admin/dashboard"

    switch (user.department?.code) {
      case "DEPARTMENT1":
      case "DEPARTMENT2":
        return "/staff/dashboard"
      case "DEPARTMENT3":
        return "/staff/reports/markettingdashboard"
      case "DEPARTMENT4":
        return "/staff/support&department"
      default:
        return "/staff/dashboard"
    }
  }

  const logout = async () => {
    try {
      const res = await api.post("/auth/logout")
      if (
        res.status === 200 &&
        res.data?.message === "Logged out successfully"
      ) {
        localStorage.removeItem("authToken")
        localStorage.removeItem("user")
        localStorage.removeItem("timer")
        localStorage.removeItem("wish")
        toast.success("Logout successfully")
        navigate("/")
      } else {
        toast.error("Logout failed on server")
      }
    } catch (err) {
      console.error(err)
      toast.error("Logout failed, please try again")
    }
  }

  const DesktopLeafLink = ({ to, label }) => (
    <button
      type="button"
      onClick={() => handleSafeNavigate(to)}
      className={`block w-full rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${
        isPathActive(to)
          ? "bg-[#243145] text-white"
          : "text-slate-100 hover:bg-[#1E293B] hover:text-white"
      }`}
    >
      {label}
    </button>
  )

  const DesktopChildPanel = ({ items }) => (
    <div className="invisible absolute left-[calc(100%+8px)] top-0 z-50 min-w-[240px] translate-x-1 rounded-2xl border border-white/10 bg-[#162033] p-2 opacity-0 shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition-all duration-150 group-hover/child:visible group-hover/child:translate-x-0 group-hover/child:opacity-100 group-focus-within/child:visible group-focus-within/child:translate-x-0 group-focus-within/child:opacity-100">
      {items.map((child) => (
        <DesktopLeafLink key={child.to} to={child.to} label={child.label} />
      ))}
    </div>
  )

  const DesktopDropdown = ({ items }) => (
    <div className="invisible absolute left-0 top-[calc(100%+12px)] z-50 min-w-[260px] translate-y-1 rounded-2xl border border-white/10 bg-[#162033] p-2 opacity-0 shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition-all duration-150 group-hover/menu:visible group-hover/menu:translate-y-0 group-hover/menu:opacity-100 group-focus-within/menu:visible group-focus-within/menu:translate-y-0 group-focus-within/menu:opacity-100">
      {items
        .filter((item) => item.control)
        .map((item) => {
          if (!item.hasChildren) {
            return (
              <DesktopLeafLink key={item.to} to={item.to} label={item.label} />
            )
          }
          const childItems = getChildItems(item.label)
          if (!childItems.length) return null
          return (
            <div key={item.label} className="group/child relative">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-[13px] font-medium text-slate-100 transition hover:bg-[#1E293B]"
              >
                <span>{item.label}</span>
                <FiChevronRight className="text-slate-400" size={14} />
              </button>
              <DesktopChildPanel items={childItems} />
            </div>
          )
        })}
    </div>
  )

  const DesktopReportsDropdown = ({ groups }) => (
    <div className="invisible absolute left-0 top-[calc(100%+12px)] z-50 w-64 translate-y-1 rounded-2xl border border-white/10 bg-[#162033] p-2 opacity-0 shadow-[0_20px_60px_rgba(0,0,0,0.45)] transition-all duration-150 group-hover/menu:visible group-hover/menu:translate-y-0 group-hover/menu:opacity-100 group-focus-within/menu:visible group-focus-within/menu:translate-y-0 group-focus-within/menu:opacity-100">
      {groups.map((groupItem, idx) => {
        const visible = groupItem.items.filter((i) => i.control)
        if (!visible.length) return null
        return (
          <div
            key={groupItem.group}
            className={idx !== 0 ? "mt-1 border-t border-white/10 pt-2" : ""}
          >
            <div className="px-3 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-wider text-sky-400">
              {groupItem.group}
            </div>
            {visible.map((child) => {
              const ChildIcon = child.icon
              return (
                <button
                  key={child.to}
                  type="button"
                  onClick={() => handleSafeNavigate(child.to)}
                  className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition ${
                    isPathActive(child.to)
                      ? "bg-[#243145] text-white"
                      : "text-slate-100 hover:bg-[#1E293B] hover:text-white"
                  }`}
                >
                  {ChildIcon && (
                    <ChildIcon
                      className={`h-4 w-4 shrink-0 ${
                        isPathActive(child.to)
                          ? "text-sky-400"
                          : "text-slate-400"
                      }`}
                    />
                  )}
                  <span>{child.label}</span>
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )

  const IconBadge = ({ count }) =>
    count > 0 ? (
      <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
        {count > 9 ? "9+" : count}
      </span>
    ) : null

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#ADD8E6] px-4 py-1 lg:px-6">
        <div className="grid h-16 w-full grid-cols-[auto_1fr_auto] items-center gap-4">
          {/* Left */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#162033] text-slate-200 transition hover:bg-[#1E293B] xl:hidden"
              aria-label="Open menu"
            >
              <FiMenu size={18} />
            </button>

            {!sidebarHasProfile && (
              <button
                type="button"
                onClick={() => handleSafeNavigate(getDashboardPath())}
                className="flex min-w-0 items-center gap-2.5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-lg font-bold text-white shadow-[0_6px_18px_rgba(56,189,248,0.35)]">
                  C
                </div>

                <div className="hidden text-left sm:block">
                  <div className="text-[15px] font-bold leading-4 tracking-wide text-white">
                    CAMET
                  </div>
                  <div className="text-[10px] font-medium leading-4 text-slate-100/80">
                    CRM
                  </div>
                </div>
              </button>
            )}
          </div>

          {/* Center */}
          <div className="hidden xl:flex justify-center">
            <nav className="flex h-10 items-center gap-1 rounded-full border border-white/10 bg-[#081224] px-2 shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
              <button
                type="button"
                onClick={() => handleSafeNavigate(getDashboardPath())}
                className={`rounded-full px-5 py-1 text-[14px] font-semibold transition ${
                  isPathActive("/staff/dashBoard") ||
                  isPathActive(getDashboardPath())
                    ? "bg-[#0F3A68] text-sky-300"
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                Dashboard
              </button>

              {menuGroups.map((group) => {
                const isReports = group.label === "Reports"
                const visibleItems = isReports
                  ? getVisibleReportItems()
                  : group.items.filter((i) => i.control)

                if (!visibleItems.length) return null

                const activeGroup = isReports
                  ? isReportsGroupActive()
                  : isGroupActive(group.items)

                return (
                  <div key={group.label} className="group/menu relative">
                    <button
                      type="button"
                      className={`flex items-center gap-1.5 rounded-full px-4 py-1 text-[14px] font-semibold transition ${
                        activeGroup
                          ? "bg-[#0F3A68] text-sky-300"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span>{group.label}</span>
                      <FiChevronDown size={13} />
                    </button>

                    {isReports ? (
                      <DesktopReportsDropdown groups={reports} />
                    ) : (
                      <DesktopDropdown items={group.items} />
                    )}
                  </div>
                )
              })}
            </nav>
          </div>

          {/* Right */}
          <div className="ml-auto flex items-center gap-3">
            {/* Icons */}
            <div className="hidden xl:flex h-10 items-center gap-1 rounded-full border border-white/10 bg-[#081224] px-2 shadow-[0_8px_24px_rgba(0,0,0,0.22)]">
              <button
                type="button"
                onClick={onNotificationClick}
                title="Notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition hover:bg-white hover:text-black"
              >
                <Bell size={15} strokeWidth={2.2} />
                <IconBadge count={notificationCount} />
              </button>

              {/* <button
          type="button"
          title="Messages"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          <MessageSquareText size={15} strokeWidth={2.2} />
          <IconBadge count={messageCount} />
        </button> */}

              <div className="mx-1 h-5 w-px bg-white/10" />

              <div className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/5 hover:text-white">
                <ReportBugButton api={api} />
              </div>

              {/* <button
          type="button"
          onClick={() => handleSafeNavigate("/staff/settings")}
          title="Settings"
          className="flex h-9 w-9 items-center justify-center rounded-full text-slate-300 transition hover:bg-white/5 hover:text-white"
        >
          <Settings size={15} strokeWidth={2.2} />
        </button> */}
            </div>

            {/* Profile */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu((prev) => !prev)}
                className="flex h-10 items-center gap-2 rounded-full border border-white/10 bg-[#081224] pl-1.5 pr-3 text-white shadow-[0_8px_24px_rgba(0,0,0,0.22)] transition hover:bg-[#0d1830]"
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
              >
                {user?.profileUrl ? (
                  <img
                    src={user.profileUrl}
                    alt="Profile"
                    className="h-9 w-9 rounded-full object-cover ring-1 ring-white/20"
                  />
                ) : (
                  <FaUserCircle className="text-[30px] text-slate-300" />
                )}

                <div className="hidden w-18 text-left sm:block">
                  <div className="truncate text-[12.5px] font-semibold leading-4 text-white">
                    {user?.name?.toUpperCase() || "STAFF USER"}
                  </div>
                  <div className="truncate text-[10.5px] leading-4 text-slate-400">
                    {user?.department?.department || "Staff"}
                  </div>
                </div>

                <ChevronDown
                  size={14}
                  className={`hidden text-slate-400 transition-transform sm:block ${
                    showUserMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-[calc(100%+10px)] z-[9999] w-56 overflow-hidden rounded-2xl border border-white/10 bg-[#162033] py-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                  <div className="border-b border-white/10 px-3.5 py-3">
                    <div className="truncate text-[13px] font-semibold text-white">
                      {user?.name || "Staff User"}
                    </div>
                    <div className="truncate text-[11px] text-slate-400">
                      {user?.selected?.[0]?.branchName || user?.role || "Staff"}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-slate-100 transition hover:bg-[#1E293B]"
                  >
                    <User size={15} className="text-slate-400" />
                    My Profile
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSafeNavigate("/staff/settings")}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-slate-100 transition hover:bg-[#1E293B]"
                  >
                    <Settings size={15} className="text-slate-400" />
                    Settings
                  </button>

                  <button
                    type="button"
                    onClick={onpasswordClick}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-slate-100 transition hover:bg-[#1E293B]"
                  >
                    <FiLogOut size={15} className="rotate-180 text-slate-400" />
                    Change Password
                  </button>

                  <div className="my-1 border-t border-white/10" />

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserMenu(false)
                      logout()
                    }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] font-medium text-rose-300 transition hover:bg-rose-500/10"
                  >
                    <FiLogOut size={15} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm xl:hidden"
            onClick={() => setMobileOpen(false)}
          />

          <aside className="fixed left-0 top-0 z-50 h-screen w-[88%] max-w-[360px] overflow-y-auto border-r border-white/10 bg-[#0F172A] text-white shadow-[0_20px_80px_rgba(0,0,0,0.55)] xl:hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-[15px] font-bold">
                  C
                </div>
                <div>
                  <div className="text-[14px] font-bold">
                    {activeCompany?.name || "CAMET"}
                  </div>
                  <div className="text-[10px] text-slate-400">CRM</div>
                </div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#162033]"
                aria-label="Close menu"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="border-b border-white/10 px-4 py-4">
              <div className="flex items-center gap-3">
                {user?.profileUrl ? (
                  <img
                    src={user.profileUrl}
                    alt="Profile"
                    className="h-11 w-11 rounded-2xl object-cover ring-1 ring-white/10"
                  />
                ) : (
                  <FaUserCircle className="text-[36px] text-slate-400" />
                )}
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-semibold">
                    {user?.name || "Staff User"}
                  </div>
                  <div className="truncate text-[12px] text-slate-400">
                    {user?.selected?.[0]?.branchName || user?.role || "Branch"}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3">
              <button
                type="button"
                onClick={() => handleSafeNavigate(getDashboardPath())}
                className={`mb-2 block w-full rounded-2xl px-4 py-3 text-left text-[14px] font-medium ${
                  isPathActive("/staff/dashBoard") ||
                  isPathActive(getDashboardPath())
                    ? "bg-[#243145] text-white"
                    : "text-slate-200 hover:bg-[#1E293B]"
                }`}
              >
                Dashboard
              </button>

              {menuGroups.map((group) => {
                const isReports = group.label === "Reports"
                const visibleItems = isReports
                  ? getVisibleReportItems()
                  : group.items.filter((i) => i.control)
                if (!visibleItems.length) return null

                return (
                  <div
                    key={group.label}
                    className="mb-1 rounded-2xl border border-white/10 bg-[#162033]"
                  >
                    <button
                      onClick={() =>
                        setMobileMenu(
                          mobileMenu === group.label ? null : group.label
                        )
                      }
                      className="flex w-full items-center justify-between px-4 py-3 text-[14px] font-medium text-slate-200"
                    >
                      <span>{group.label}</span>
                      {mobileMenu === group.label ? (
                        <FiChevronDown size={16} className="text-slate-400" />
                      ) : (
                        <FiChevronRight size={16} className="text-slate-400" />
                      )}
                    </button>

                    {mobileMenu === group.label && (
                      <div className="border-t border-white/10 px-2 pb-1">
                        {isReports
                          ? reports.map((groupItem) => {
                              const visible = groupItem.items.filter(
                                (i) => i.control
                              )
                              if (!visible.length) return null
                              return (
                                <div key={groupItem.group} className="mb-1">
                                  <div className="px-3 pb-0 pt-2 text-[11px] font-bold uppercase tracking-wider text-sky-400">
                                    {groupItem.group}
                                  </div>
                                  {visible.map((child) => {
                                    const ChildIcon = child.icon
                                    return (
                                      <button
                                        key={child.to}
                                        type="button"
                                        onClick={() =>
                                          handleSafeNavigate(child.to)
                                        }
                                        className={`flex w-full items-center gap-1.5 rounded-xl px-3 py-2 text-left text-[13px] font-medium ${
                                          isPathActive(child.to)
                                            ? "bg-[#243145] text-white"
                                            : "text-slate-300 hover:bg-[#1E293B]"
                                        }`}
                                      >
                                        {ChildIcon && (
                                          <ChildIcon
                                            className={`h-4 w-4 shrink-0 ${
                                              isPathActive(child.to)
                                                ? "text-sky-400"
                                                : "text-slate-400"
                                            }`}
                                          />
                                        )}
                                        <span>{child.label}</span>
                                      </button>
                                    )
                                  })}
                                </div>
                              )
                            })
                          : visibleItems.map((item) => {
                              if (!item.hasChildren) {
                                return (
                                  <button
                                    key={item.to}
                                    type="button"
                                    onClick={() => handleSafeNavigate(item.to)}
                                    className={`block w-full rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${
                                      isPathActive(item.to)
                                        ? "bg-[#243145] text-white"
                                        : "text-slate-300 hover:bg-[#1E293B]"
                                    }`}
                                  >
                                    {item.label}
                                  </button>
                                )
                              }

                              const childItems = getChildItems(item.label)
                              if (!childItems.length) return null

                              return (
                                <div key={item.label}>
                                  <button
                                    onClick={() =>
                                      setMobileChildMenu(
                                        mobileChildMenu === item.label
                                          ? null
                                          : item.label
                                      )
                                    }
                                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[13px] font-medium text-slate-300 hover:bg-[#1E293B]"
                                  >
                                    <span>{item.label}</span>
                                    {mobileChildMenu === item.label ? (
                                      <FiChevronDown
                                        size={14}
                                        className="text-slate-500"
                                      />
                                    ) : (
                                      <FiChevronRight
                                        size={14}
                                        className="text-slate-500"
                                      />
                                    )}
                                  </button>

                                  {mobileChildMenu === item.label && (
                                    <div className="ml-3 border-l border-white/10 pl-2">
                                      {childItems.map((child) => (
                                        <button
                                          key={child.to}
                                          type="button"
                                          onClick={() =>
                                            handleSafeNavigate(child.to)
                                          }
                                          className={`block w-full rounded-xl px-3 py-2.5 text-left text-[13px] transition ${
                                            isPathActive(child.to)
                                              ? "bg-[#243145] text-white"
                                              : "text-slate-300 hover:bg-[#1E293B]"
                                          }`}
                                        >
                                          {child.label}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                      </div>
                    )}
                  </div>
                )
              })}

              <button
                onClick={logout}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-[14px] font-semibold text-rose-300"
              >
                <FiLogOut size={15} />
                Logout
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
