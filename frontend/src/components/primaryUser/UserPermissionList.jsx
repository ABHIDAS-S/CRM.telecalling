import { useState, useEffect, useMemo } from "react"
import { Search, Check, X, Shield, ChevronDown, ChevronUp } from "lucide-react"
import api from "../../api/api"

const UserPermissionList = ({ user, closeModal, refresh }) => {
  const [userPermissions, setUserPermissions] = useState({
    Company: false,
    Branch: false,
    Customer: false,
    Services: false,
    CallNotes: false,
    UsersAndPasswords: false,
    MenuRights: false,
    VoucherMaster: false,
    Target: false,
    Product: false,
    Inventory: false,
    Partners: false,
    Department: false,
    Brand: false,
    TaskLevel: false,
    Category: false,
    HSN: false,
    Lead: false,
    LeadAllocation: false,
    LeadFollowUp: false,
    LostLeads: false,
    OwnLead: false,
    CallRegistration: false,
    SupportDepartment: false,
    LeaveApplication: false,
    SignUpCustomer: false,
    ProductMerge: false,
    ProductAllocationPending: false,
    LeaveApprovalPending: false,
    WorkAllocation: false,
    ExcelConverter: false,
    Summary: false,
    ExpiryRegister: false,
    FollowupSummary: false,
    ProductWiseReport: false,
    SalesFunnel: false,
    DailyStaffActivity: false,
    AccountSearch: false,
    LeaveSummary: false,
    LeadReallocation: false,
    ProductandServices: false,
    Employee: false,
    CollectionUpdate: false
  })

  const [selectAll, setSelectAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    Masters: true,
    Transactions: true,
    Reports: true,
    Task: true,
    ProductandServices: true,
    Employee: true
  })

  const productAndServiceChildren = [
    "Product",
    "Services",
    "Brand",
    "Category",
    "HSN",
    "CallNotes",
    "TaskLevel"
  ]
  const employeeChildren = [
    "UsersAndPasswords",
    "MenuRights",
    "Target",
    "VoucherMaster"
  ]

  const permissionGroups = useMemo(
    () => [
      {
        key: "Masters",
        label: "Masters",
        items: [
          { key: "Company", label: "Company" },
          { key: "Branch", label: "Branch" },
          { key: "Department", label: "Department" },
          {
            key: "ProductandServices",
            label: "Product & Service",
            children: productAndServiceChildren
          },
          { key: "Customer", label: "Customer" },
          {
            key: "Employee",
            label: "Employee",
            children: employeeChildren
          },
          { key: "Partners", label: "Partners" },
          { key: "Inventory", label: "Inventory" }
        ]
      },
      {
        key: "Transactions",
        label: "Transactions",
        items: [
          { key: "CallRegistration", label: "Call Registration" },
          { key: "SupportDepartment", label: "Support Department" },
          { key: "LeaveApplication", label: "Leave Application" },
          { key: "Lead", label: "New Lead" },
          { key: "CollectionUpdate", label: "Collection Update" }
        ]
      },
      {
        key: "Reports",
        label: "Reports",
        subgroups: [
          {
            label: "Marketing",
            items: [
              { key: "FollowupSummary", label: "Followup Summary" },
              { key: "ProductWiseReport", label: "Lead (Staff / Product)" },
              { key: "SalesFunnel", label: "Sales Funnel" },
              { key: "LeadFollowUp", label: "In Follow-Up" },
              { key: "OwnLead", label: "Own Lead" },
              { key: "LostLeads", label: "Lost Leads" },
              { key: "ClosedLeads", label: "Closed Leads" }
            ]
          },
          {
            label: "Service",
            items: [
              { key: "Summary", label: "Call Summary" },
              { key: "ExpiryRegister", label: "Expiry Register" },
              { key: "AccountSearch", label: "Account Search" }
            ]
          },
          {
            label: "My Activities",
            items: [
              { key: "LeaveSummary", label: "Attendance Summary" },
              { key: "DailyStaffActivity", label: "Daily Staff Activity" }
            ]
          }
        ]
      },
      {
        key: "Task",
        label: "Task",
        items: [
          { key: "LeadReallocation", label: "Task Allocation" },
          { key: "LeadAllocation", label: "Follow-Up Allocation" },
          { key: "WorkAllocation", label: "Task Pending" },
          { key: "LeaveApprovalPending", label: "Leave Approval Pending" },
          {
            key: "ExcelConverter",
            label: "Customer Converter (Excel to JSON)"
          },
          {
            key: "ProductAllocationPending",
            label: "Product Allocation Pending"
          },
          { key: "SignUpCustomer", label: "Sign Up Customer" },
          { key: "ProductMerge", label: "Product Merge" }
        ]
      }
    ],
    []
  )

  useEffect(() => {
    if (user && user.permissions?.length > 0) {
      const updatedPermissions = { ...userPermissions }
      user.permissions.forEach((permissionObj) => {
        Object.keys(permissionObj).forEach((key) => {
          if (key !== "_id" && typeof permissionObj[key] === "boolean") {
            updatedPermissions[key] = permissionObj[key]
          }
        })
      })

      const allPermissionsTrue = Object.keys(updatedPermissions).every(
        (key) => updatedPermissions[key] === true
      )
      setSelectAll(allPermissionsTrue)
      setUserPermissions(updatedPermissions)
    }
  }, [user])

  const handleChange = (e) => {
    const { name, checked } = e.target
    const updatedPermissions = { ...userPermissions, [name]: checked }

    // Auto-toggle children when parent is toggled
    if (name === "ProductandServices") {
      productAndServiceChildren.forEach((child) => {
        updatedPermissions[child] = checked
      })
    } else if (name === "Employee") {
      employeeChildren.forEach((child) => {
        updatedPermissions[child] = checked
      })
    } else if (productAndServiceChildren.includes(name)) {
      updatedPermissions.ProductandServices = productAndServiceChildren.every(
        (child) => (child === name ? checked : updatedPermissions[child])
      )
    } else if (employeeChildren.includes(name)) {
      updatedPermissions.Employee = employeeChildren.every((child) =>
        child === name ? checked : updatedPermissions[child]
      )
    }

    setUserPermissions(updatedPermissions)

    const allPermissionsTrue = Object.keys(updatedPermissions).every(
      (key) => updatedPermissions[key] === true
    )
    setSelectAll(allPermissionsTrue)
  }

  const handleSelectAll = (e) => {
    const checked = e.target.checked
    setSelectAll(checked)

    const updatedPermissions = Object.keys(userPermissions).reduce(
      (acc, key) => {
        acc[key] = checked
        return acc
      },
      {}
    )
    setUserPermissions(updatedPermissions)
  }

  const handleSubmit = async () => {
    try {
      setLoading(true)
      const response = await api.post(
        `/auth/userPermissionUpdate?Userid=${user?._id}`,
        userPermissions
      )

      if (response.status === 200 || response.status === 201) {
        setLoading(false)
        setShowSuccess(true)

        setTimeout(() => {
          setShowSuccess(false)
          closeModal()
          refresh()
        }, 1500)
      }
    } catch (error) {
      setLoading(false)
      console.error("Error updating permissions:", error)
    }
  }

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const filteredPermissionGroups = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()
    if (!query) return permissionGroups

    const matches = (item) =>
      item.label.toLowerCase().includes(query) ||
      item.key.toLowerCase().includes(query)

    return permissionGroups
      .map((group) => {
        const groupMatches = group.label.toLowerCase().includes(query)
        if (groupMatches) return group

        if (group.subgroups) {
          const subgroups = group.subgroups
            .map((subgroup) => ({
              ...subgroup,
              items: subgroup.items.filter(matches)
            }))
            .filter(
              (subgroup) =>
                subgroup.label.toLowerCase().includes(query) ||
                subgroup.items.length > 0
            )
          return { ...group, subgroups }
        }

        const items = group.items
          .map((item) => {
            if (!item.children) return item
            const matchingChildren = item.children.filter((child) =>
              child.toLowerCase().includes(query)
            )
            return matches(item) || matchingChildren.length
              ? {
                  ...item,
                  children: matchingChildren.length
                    ? matchingChildren
                    : item.children
                }
              : null
          })
          .filter((item) => (item && matches(item)) || item?.children?.length)

        return { ...group, items }
      })
      .filter((group) => group.items?.length > 0 || group.subgroups?.length > 0)
  }, [searchTerm, permissionGroups])

  const enabledCount = Object.values(userPermissions).filter(Boolean).length
  const totalCount = Object.keys(userPermissions).length

  const renderPermission = (item, nested = false) => {
    const children = item.children || []
    const isExpanded = expandedSections[item.key]

    return (
      <div
        key={item.key}
        className={`${nested ? "ml-3" : ""} overflow-hidden rounded-lg border border-gray-200 bg-white`}
      >
        <div className="flex items-center gap-2 px-3 py-2 transition-colors hover:bg-gray-50">
          {children.length > 0 && (
            <button
              type="button"
              onClick={() => toggleSection(item.key)}
              className="rounded p-1 text-gray-500 hover:bg-gray-200"
              aria-label={`${isExpanded ? "Collapse" : "Expand"} ${item.label}`}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          )}
          <label className="flex flex-1 cursor-pointer items-center justify-between">
            <span
              className={`${nested ? "text-sm" : "font-medium"} text-gray-700`}
            >
              {item.label}
            </span>
            <input
              type="checkbox"
              name={item.key}
              className="h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={Boolean(userPermissions[item.key])}
              onChange={handleChange}
            />
          </label>
        </div>

        {children.length > 0 && isExpanded && (
          <div className="space-y-2 border-t border-gray-200 bg-blue-50/50 p-3">
            {children.map((child) =>
              renderPermission(
                {
                  key: child,
                  label: child.replace(/([A-Z])/g, " $1").trim()
                },
                true
              )
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    // <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 p-4 backdrop-blur-sm">
    //   <div className="bg-[#ADD8E6] rounded-2xl shadow-2xl max-w-2xl w-full max-h-full overflow-y-auto relative overflow-hidden transform transition-all">
    //     {/* Success Overlay */}
    //     {showSuccess && (
    //       <div className="absolute inset-0 bg-green-500 z-50 flex items-center justify-center">
    //         <div className="text-center text-white animate-bounce">
    //           <Check className="w-20 h-20 mx-auto mb-4" />
    //           <p className="text-2xl font-bold">Permissions Updated!</p>
    //         </div>
    //       </div>
    //     )}

    //     {/* Header */}
    //     <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-2 text-white">
    //       <div className="flex items-center justify-between">
    //         <div className="flex items-center gap-3">
    //           <Shield className="w-8 h-8" />
    //           <div>
    //             <h2 className="text-2xl font-bold">User Permissions</h2>
    //             <p className="text-blue-100 text-sm">{user?.name || "User"}</p>
    //           </div>
    //         </div>
    //         <button
    //           onClick={closeModal}
    //           className="hover:bg-white/20 p-2 rounded-full transition-colors"
    //         >
    //           <X className="w-6 h-6" />
    //         </button>
    //       </div>

    //       {/* Stats */}
    //       <div className="mt-1 flex items-center gap-4 text-sm">
    //         <div className="bg-white/20 px-3 py-1 rounded-full">
    //           {enabledCount} / {totalCount} enabled
    //         </div>
    //         <div className="flex-1 bg-white/20 rounded-full h-2 overflow-hidden">
    //           <div
    //             className="bg-white h-full transition-all duration-500"
    //             style={{ width: `${(enabledCount / totalCount) * 100}%` }}
    //           />
    //         </div>
    //       </div>
    //     </div>

    //     {/* Content */}
    //     <div className="p-3">
    //       {/* Search Bar */}
    //       <div className="relative mb-2">
    //         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
    //         <input
    //           type="text"
    //           placeholder="Search permissions..."
    //           value={searchTerm}
    //           onChange={(e) => setSearchTerm(e.target.value)}
    //           className="w-full pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
    //         />
    //       </div>

    //       {/* Select All */}
    //       <label className="flex items-center justify-between px-4 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors mb-4">
    //         <span className="font-semibold text-gray-700">
    //           Select All Permissions
    //         </span>
    //         <input
    //           type="checkbox"
    //           className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
    //           checked={selectAll}
    //           onChange={handleSelectAll}
    //         />
    //       </label>

    //       {/* Permissions List */}
    //       <div className=" md:max-h-80 lg:max-h-96 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
    //         {filteredPermissions.map((key) => (
    //           <div
    //             key={key}
    //             className="bg-white border border-gray-200 rounded-lg overflow-hidden"
    //           >
    //             <label className="flex items-center justify-between px-3 py-1 cursor-pointer hover:bg-gray-50 transition-colors">
    //               <span className="font-medium text-gray-700">
    //                 {key.replace(/([A-Z])/g, " $1").trim()}
    //               </span>
    //               <input
    //                 type="checkbox"
    //                 name={key}
    //                 className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
    //                 checked={userPermissions[key]}
    //                 onChange={handleChange}
    //               />
    //             </label>

    //             {/* Product & Services Children */}
    //             {key === "ProductandServices" && (
    //               <div className="border-t border-gray-200">
    //                 <button
    //                   onClick={() => toggleSection("ProductandServices")}
    //                   className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
    //                 >
    //                   <span className="text-sm font-medium text-gray-600">
    //                     Sub-permissions
    //                   </span>
    //                   {expandedSections.ProductandServices ? (
    //                     <ChevronUp className="w-4 h-4" />
    //                   ) : (
    //                     <ChevronDown className="w-4 h-4" />
    //                   )}
    //                 </button>
    //                 {expandedSections.ProductandServices && (
    //                   <div className="p-3 bg-blue-50/50 space-y-2">
    //                     {productAndServiceChildren.map((child) => (
    //                       <label
    //                         key={child}
    //                         className="flex items-center justify-between p-2 bg-white rounded cursor-pointer hover:bg-blue-50 transition-colors"
    //                       >
    //                         <span className="text-sm text-gray-700">
    //                           {child.replace(/([A-Z])/g, " $1").trim()}
    //                         </span>
    //                         <input
    //                           type="checkbox"
    //                           name={child}
    //                           className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
    //                           checked={userPermissions[child]}
    //                           onChange={handleChange}
    //                         />
    //                       </label>
    //                     ))}
    //                   </div>
    //                 )}
    //               </div>
    //             )}

    //             {/* Employee Children */}
    //             {key === "Employee" && (
    //               <div className="border-t border-gray-200">
    //                 <button
    //                   onClick={() => toggleSection("Employee")}
    //                   className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
    //                 >
    //                   <span className="text-sm font-medium text-gray-600">
    //                     Sub-permissions
    //                   </span>
    //                   {expandedSections.Employee ? (
    //                     <ChevronUp className="w-4 h-4" />
    //                   ) : (
    //                     <ChevronDown className="w-4 h-4" />
    //                   )}
    //                 </button>
    //                 {expandedSections.Employee && (
    //                   <div className="p-3 bg-purple-50/50 space-y-2">
    //                     {employeeChildren.map((child) => (
    //                       <label
    //                         key={child}
    //                         className="flex items-center justify-between p-2 bg-white rounded cursor-pointer hover:bg-purple-50 transition-colors"
    //                       >
    //                         <span className="text-sm text-gray-700">
    //                           {child.replace(/([A-Z])/g, " $1").trim()}
    //                         </span>
    //                         <input
    //                           type="checkbox"
    //                           name={child}
    //                           className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
    //                           checked={userPermissions[child]}
    //                           onChange={handleChange}
    //                         />
    //                       </label>
    //                     ))}
    //                   </div>
    //                 )}
    //               </div>
    //             )}
    //           </div>
    //         ))}
    //       </div>
    //     </div>

    //     {/* Footer */}
    //     <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
    //       <button
    //         onClick={closeModal}
    //         disabled={loading}
    //         className="px-6 py-1 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    //       >
    //         Cancel
    //       </button>
    //       <button
    //         onClick={handleSubmit}
    //         disabled={loading}
    //         className="px-6 py-1 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    //       >
    //         {loading ? (
    //           <>
    //             <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
    //             Updating...
    //           </>
    //         ) : (
    //           <>
    //             <Check className="w-5 h-5" />
    //             Save Changes
    //           </>
    //         )}
    //       </button>
    //     </div>
    //   </div>

    //   <style>{`
    //     .custom-scrollbar::-webkit-scrollbar {
    //       width: 8px;
    //     }
    //     .custom-scrollbar::-webkit-scrollbar-track {
    //       background: #f1f1f1;
    //       border-radius: 10px;
    //     }
    //     .custom-scrollbar::-webkit-scrollbar-thumb {
    //       background: #cbd5e1;
    //       border-radius: 10px;
    //     }
    //     .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    //       background: #94a3b8;
    //     }
    //   `}</style>
    // </div>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-[#ADD8E6] shadow-2xl">
        {/* Success Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-green-500">
            <div className="animate-bounce text-center text-white">
              <Check className="mx-auto mb-4 h-20 w-20" />
              <p className="text-2xl font-bold">Permissions Updated!</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 p-2 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">User Permissions</h2>
                <p className="text-sm text-blue-100">{user?.name || "User"}</p>
              </div>
            </div>

            <button
              onClick={closeModal}
              className="rounded-full p-2 transition-colors hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Stats */}
          <div className="mt-1 flex items-center gap-4 text-sm">
            <div className="rounded-full bg-white/20 px-3 py-1">
              {enabledCount} / {totalCount} enabled
            </div>

            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${(enabledCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex min-h-0 flex-1 flex-col p-3">
          {/* Search Bar */}
          <div className="relative mb-2 shrink-0">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border-2 border-gray-200 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Select All */}
          <label className="mb-4 flex shrink-0 cursor-pointer items-center justify-between rounded-lg bg-gray-50 px-4 py-2 transition-colors hover:bg-gray-100">
            <span className="font-semibold text-gray-700">
              Select All Permissions
            </span>
            <input
              type="checkbox"
              className="h-5 w-5 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={selectAll}
              onChange={handleSelectAll}
            />
          </label>

          {/* Permissions List - Only this scrolls */}
          <div className="custom-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto pr-2">
            {filteredPermissionGroups.map((group) => (
              <section
                key={group.key}
                className="overflow-hidden rounded-xl border border-slate-300 bg-slate-50"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(group.key)}
                  className="flex w-full items-center justify-between bg-[#1B2A4A] px-4 py-2.5 text-left text-sm font-semibold text-white"
                >
                  <span>{group.label}</span>
                  {expandedSections[group.key] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {expandedSections[group.key] && (
                  <div className="space-y-2 p-3">
                    {group.items?.map((item) => renderPermission(item))}

                    {group.subgroups?.map((subgroup) => (
                      <div
                        key={subgroup.label}
                        className="rounded-lg border border-slate-200 bg-white p-2"
                      >
                        <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wide text-slate-500">
                          {subgroup.label}
                        </p>
                        <div className="space-y-2">
                          {subgroup.items.map((item) =>
                            renderPermission(item, true)
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 flex shrink-0 justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-3">
          <button
            onClick={closeModal}
            disabled={loading}
            className="rounded-lg border-2 border-gray-300 px-6 py-1 font-medium text-gray-700 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-1 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Updating...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }
  `}</style>
    </div>
  )
}
export default UserPermissionList
