import { useEffect, useMemo, useState } from "react"
import UseFetch from "../../hooks/useFetch"
import Breadcrumb from "../../components/common/Breadcrumb"
import { useLocation, useNavigate } from "react-router-dom"
import { LeadhistoryModal } from "../../components/primaryUser/LeadhistoryModal"
import { PerformanceModal } from "../../components/primaryUser/PerformanceModal"
import SkeletonTable from "../../components/loader/SkeletonTable"
import NodataAvailable from "../../components/NodataAvailable"
import MyDatePicker from "../../components/common/MyDatePicker"
import { CustomSelect } from "../../components/common/CustomSelect"
import api from "../../api/api"
import {
  Mail,
  MessageSquareText,
  Settings,
  User,
  Users,
  Send,
  TrendingUp,
  Menu,
  ChevronLeft,
  ChevronRight,
  Eye,
  IndianRupee,
  ChevronDown,
  BellRing,
  Search,
  X
} from "lucide-react"

import AdminHeader from "../../header/AdminHeader"
import StaffHeader from "../../header/StaffHeader"
import { StaticSidebar } from "../../components/primaryUser/StaticSidebar"
import { getLocalStorageItem } from "../../helper/localstorage"
import { useQuery } from "@tanstack/react-query"
import { useSelector } from "react-redux"
export default function OwnLeadList() {
  const location = useLocation()
  const reduxSelectedBranch = useSelector(
    (state) => state.companyBranch.selectedBranch
  )
  const [selectedCategory, setselectedCategory] = useState(null)
  const [selectedUserName, setselecteduserName] = useState(null)
  const [tableData, setTableData] = useState([])
  const [dates, setDates] = useState({ startDate: "", endDate: "" })
  console.log(dates)
  const [targetData, settargetData] = useState([])
  console.log(targetData)
  const [periodMode, setperiodMode] = useState("all")
  const [productlist, setproductList] = useState([])
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))
  console.log(selectedYear)
  const [selectedDatapopup, setselectedDataPopup] = useState({})
  const [selectedPeriod, setselectedPeriod] = useState("")
  const [openModal, setOpenModal] = useState(false)
  const [loggedUser, setLoggedUser] = useState(null)
  const [selectedLeadId, setselectedLeadId] = useState(null)
  console.log(location?.state)
  const [ownLead, setownLead] = useState(!!location?.state?.ownLead)
  console.log(ownLead)
  console.log("hhhhh")
  console.log(!!location?.state?.ownLead)
  console.log(ownLead)
  const [achievedproducts, setacheivedProducts] = useState([])
  const selecteduserBranch = reduxSelectedBranch
  console.log(location?.state?.selecteduserBranch)
  console.log(selecteduserBranch)
  const [showhistoryModal, sethistoryModal] = useState(false)
  const [historyList, setHistoryList] = useState([])
  const [openRow, setOpenRow] = useState(null)
  const [activeUserId, setActiveUserId] = useState(null)
  const [leadSearch, setLeadSearch] = useState("")
  const [selectedProductFilter, setSelectedProductFilter] = useState("")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("")
  const [leadStatusFilter, setLeadStatusFilter] = useState("all")

  const nav = [
    { label: "Lead", path: "" },
    { label: "Own Lead", path: "" }
  ]
  const navigate = useNavigate()
  console.log(location?.state)
  const Breadcrumblist = location?.state?.breadcrumb
    ? location?.state?.breadcrumb
    : nav
  // const { data: companybranches } = UseFetch("/branch/getBranch")

  // const { data: ownedlead, loading } = UseFetch(
  //   loggedUser &&
  //     selecteduserBranch &&
  //     dates.startDate &&
  //     `/lead/ownregisteredLead?userId=${loggedUser._id}&role=${
  //       location?.state?.role ? location?.state?.role : loggedUser.role
  //     }&selectedBranch=${selecteduserBranch}&ownlead=${
  //       location?.state?.role ? false : ownLead
  //     }&startDate=${dates.startDate}&endDate=${dates.endDate}`
  // )
  const useOwnedLead = ({
    loggedUser,
    selecteduserBranch,
    dates,
    location,
    ownLead,
    selectedProductFilter,
    selectedCategoryFilter,
    leadStatusFilter
  }) => {
    const [productModel = "", productId = ""] = selectedProductFilter.split(":")

    return useQuery({
      queryKey: [
        "ownedlead",
        loggedUser?._id,
        selecteduserBranch,
        dates?.startDate,
        dates?.endDate,
        ownLead,
        location?.state?.role,
        location?.state?.newLeadOnly,
        location?.state?.salesFunnelStage,
        productId,
        productModel,
        selectedCategoryFilter,
        leadStatusFilter
      ],
      queryFn: async () => {
        const res = await api.get(`/lead/ownregisteredLead`, {
          params: {
            userId: loggedUser._id,
            role: location?.state?.role
              ? location?.state?.role
              : loggedUser.role,
            selectedBranch: selecteduserBranch,
            ownlead: location?.state?.role ? false : ownLead,
            startDate: dates.startDate,
            endDate: dates.endDate,
            newLeadOnly: location?.state?.newLeadOnly === true,
            salesFunnelStage: location?.state?.salesFunnelStage || "",
            productId,
            productModel,
            categoryId: selectedCategoryFilter,
            status: leadStatusFilter
          }
        })
        console.log(res.data.data)
        return res.data.data
      },
      enabled:
        !!loggedUser &&
        !!selecteduserBranch &&
        !!dates?.startDate &&
        !!dates?.endDate,
      staleTime: 1000 * 60 * 5
    })
  }
  const { data: ownedlead, isLoading: loading } = useOwnedLead({
    loggedUser,
    selecteduserBranch,
    dates,
    location,
    ownLead,
    selectedProductFilter,
    selectedCategoryFilter,
    leadStatusFilter
  })
  const { data: branchProduct = [] } = UseFetch(
    selecteduserBranch &&
      `/product/getallbranchProduct?branch=${selecteduserBranch}`
  )
  const productFilterOptions = useMemo(() => {
    const uniqueProducts = new Map()

    ;(Array.isArray(branchProduct) ? branchProduct : []).forEach((item) => {
      const productId = String(item?._id || "")
      if (!productId) return

      const productModel = item?.serviceName ? "Service" : "Product"
      const label = item?.shortName || item?.productName || item?.serviceName
      if (!label) return

      uniqueProducts.set(`${productModel}:${productId}`, { label, productModel, productId })
    })

    return [...uniqueProducts.values()].sort((left, right) =>
      left.label.localeCompare(right.label)
    )
  }, [branchProduct])

  const categoryFilterOptions = useMemo(() => {
    const categories = new Map()
    const branchId = String(selecteduserBranch || "")

    ;(Array.isArray(branchProduct) ? branchProduct : []).forEach((product) => {
      ;(product?.selected || []).forEach((selection) => {
        const selectionBranchId = String(selection?.branch_id?._id || selection?.branch_id || "")
        const categoryId = String(selection?.category_id?._id || selection?.category_id || "")
        if (!categoryId || (branchId && selectionBranchId !== branchId)) return

        categories.set(categoryId, selection?.categoryName || "Unnamed category")
      })
    })

    return [...categories.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((left, right) => left.label.localeCompare(right.label))
  }, [branchProduct, selecteduserBranch])
  useEffect(() => {
    const now = new Date()

    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }

    const today = formatDate(now)
    if (location?.state?.dates) {
      console.log("hhh")
      setDates({
        startDate: location?.state?.dates?.startDate,
        endDate: location?.state?.dates?.endDate
      })
    } else {
      setDates({ startDate: now, endDate: now })
    }
  }, [])
  useEffect(() => {
    if (selectedCategory) {
      console.log("jj")
      const Datas = targetData?.userWiseResults

      const filteredList = branchProduct
        .filter(
          (item) =>
            item.selected?.some(
              (selectedItem) =>
                String(selectedItem.category_id) ===
                String(selectedCategory?.Id)
            ) || String(item.category_id) === String(selectedCategory?.Id)
        )
        .map((item) => item.productName || item.serviceName)
      console.log(filteredList)
      setproductList(filteredList)
      console.log("J")
      console.log(targetData)
      console.log(loggedUser?._id)

      const filteredselectedCategory = Datas.flatMap(
        (user) => user.categories || []
      ).filter((item) => item.categoryId === selectedCategory?.Id)
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
      console.log("hhh")
      setselectedDataPopup(summary)
      console.log(filteredselectedCategory && filteredselectedCategory.length)
      if (filteredselectedCategory && filteredselectedCategory.length) {
        setacheivedProducts((prev) => [
          ...prev,
          ...filteredselectedCategory.flatMap((item) =>
            (item?.products || []).map((product) => ({
              productname: product.name,
              amount: product.achieved
            }))
          )
        ])
      } else {
        setacheivedProducts([])
      }
    }
  }, [targetData])
  console.log(dates)
  console.log(selecteduserBranch)
  useEffect(() => {
    setLoggedUser(getLocalStorageItem("user"))
    if (!location?.state) setownLead(true)
  }, [location?.state])

  useEffect(() => {
    if (ownedlead && ownedlead.length > 0) {
      if (ownLead) {
        setTableData(normalizeTableData(ownedlead))
      } else {
        const groupedLeads = {}
        ownedlead.forEach((lead) => {
          const assignedTo = lead?.leadBy?.name || "Unknown"
          if (!groupedLeads[assignedTo]) groupedLeads[assignedTo] = []
          groupedLeads[assignedTo].push(lead)
        })
        setTableData(normalizeTableData(groupedLeads))
      }
    } else {
      setTableData([])
    }
  }, [ownedlead, ownLead])

  const normalizeTableData = (data) => {
    if (Array.isArray(data)) return [{ staffName: null, leads: data }]
    if (typeof data === "object")
      return Object.entries(data).map(([staffName, leads]) => ({
        staffName,
        leads
      }))
    return []
  }

  const handleHistory = (item) => {
    setHistoryList(item.activityLog)
    setselectedLeadId(item.leadId)
    sethistoryModal(true)
  }
  const handleSelectedUser = (category, userId, userName) => {
    setActiveUserId(userId)
    setselecteduserName(userName)
    setselectedCategory({
      Id: category.Id,
      categoryName: category.categoryName
    })
    const filteredloggedUserItem = targetData?.userWiseResults.filter(
      (item) => item.userId === userId
    )
    const filteredselectedCategory =
      filteredloggedUserItem[0].categories.filter(
        (item) => item.categoryId === category.Id
      )
    const summary = filteredselectedCategory.reduce(
      (acc, cur) => {
        acc.target += Number(cur.target || 0)
        acc.achieved += Number(cur.achieved || 0)
        acc.balance += Number(cur.balance || 0)
        return acc
      },
      { target: 0, achieved: 0, balance: 0 }
    )

    setselectedDataPopup(summary)
    if (filteredselectedCategory && filteredselectedCategory.length) {
      // setacheivedProducts(
      //   filteredselectedCategory[0]?.products?.map((product) => ({
      //     productname: product.name,
      //     amount: product.achieved
      //   })) || []
      // )
      setacheivedProducts(
        filteredselectedCategory.flatMap((item) =>
          (item.products || []).map((product) => ({
            productname: product.name,
            amount: product.achieved
          }))
        )
      )
    } else {
      setacheivedProducts([])
    }
  }
  console.log(targetData)
  const handleMoreClick = (id, name) => {
    const Datas = targetData?.userWiseResults
    console.log(id)
    console.log(name)
    console.log("hh")
    const filteredList = branchProduct
      .filter(
        (item) =>
          item.selected?.some(
            (selectedItem) => String(selectedItem.category_id) === String(id)
          ) || String(item.category_id) === String(id)
      )
      .map((item) => item.productName || item.serviceName)
    console.log(filteredList)
    setproductList(filteredList)
    setselectedCategory({ Id: id, categoryName: name })
    console.log("J")
    console.log(targetData)
    console.log(loggedUser?._id)
    const filteredloggedUserItem = Datas.filter(
      (item) => item.userId === loggedUser._id
    )
    console.log("hhh")

    console.log(Datas)
    console.log("hhhh")
    console.log(filteredloggedUserItem)
    console.log(id)
    // const filteredselectedCategory =
    //   filteredloggedUserItem[0].categories.filter(
    //     (item) => item.categoryId === id
    //   )
    const filteredselectedCategory = Datas.flatMap(
      (user) => user.categories || []
    ).filter((item) => item.categoryId === id)
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
    console.log("hhh")
    setselectedDataPopup(summary)
    console.log(filteredselectedCategory && filteredselectedCategory.length)
    if (filteredselectedCategory && filteredselectedCategory.length) {
      setacheivedProducts((prev) => [
        ...prev,
        ...filteredselectedCategory.flatMap((item) =>
          (item?.products || []).map((product) => ({
            productname: product.name,
            amount: product.achieved
          }))
        )
      ])
    } else {
      setacheivedProducts([])
    }
    setOpenModal(true)
  }
  const LeadRow = ({ item }) => {
    console.log(item)
if(item?.leadId==="00037"){
console.log(item)}

console.log(item?.mobile)
    const open = openRow === item._id
    const lastLog = item.activityLog?.[item.activityLog.length - 1]

    const followupDate = lastLog?.nextFollowUpDate
      ? new Date(lastLog.nextFollowUpDate)
          .toLocaleDateString("en-GB")
          .split("/")
          .join("-")
      : "-"
    console.log(item)
    const isAllocatedToeditable = Array.isArray(item.activityLog)
      ? item.activityLog.some(
          (it) =>
            it?.taskallocatedTo?._id === loggedUser?._id &&
            it?.taskClosed === false
        )
      : false
    console.log(isAllocatedToeditable)

    console.log(item?.leadBy)
    console.log(loggedUser)
    const isManager = loggedUser?.role === "Manager" ? true : false
    console.log(isManager)
    console.log(isAllocatedToeditable)
    console.log(
      item?.activityLog?.length === 1
        ? item?.leadBy?._id !== loggedUser?._id
        : "0"
    )
    console.log(item)
    console.log(
      item?.activityLog?.length === 1
        ? item?.leadBy?._id !== loggedUser?._id
        : isManager
          ? !isManager
          : !isAllocatedToeditable
    )
    return (
      <>
        {/* MAIN ROW */}
        <tr
          onClick={() =>
            setOpenRow((prev) => (prev === item._id ? null : item._id))
          }
          className={`cursor-pointer border transition-colors ${
            item?.leadLost
              ? "border-red-300 bg-red-100 hover:bg-red-200 [&>td]:border-red-200 [&>td]:bg-red-100 [&>td:first-child]:border-l-4 [&>td:first-child]:border-l-red-600"
              : item?.leadConfirmed
              ? "border-emerald-400 bg-emerald-100 hover:bg-emerald-200 [&>td]:border-emerald-300 [&>td]:bg-emerald-100 [&>td:first-child]:border-l-4 [&>td:first-child]:border-l-emerald-600"
              : "border-gray-200 bg-white hover:bg-blue-50"
          }`}
        >
          <td className="pl-2 pr-1 py-2 w-5 border border-gray-200">
            {open ? (
              <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            )}
          </td>

          <td className="px-3 py-2 border border-gray-200 whitespace-nowrap uppercase text-xs">
            {item.customerName?.customerName || item.customerName}
          </td>

          <td className="px-3 py-2 border border-gray-200 text-xs">
            {item?.customerName?.mobile}
          </td>

          <td className="px-3 py-2 border border-gray-200 max-w-[200px] text-xs">
            <span
              className="text-red-500 font-medium truncate block"
              title={lastLog?.remarks}
            >
              {lastLog?.remarks || "-"}
            </span>
          </td>

          <td className="px-3 py-2 border border-gray-200 text-xs text-center">
            {followupDate}
          </td>

          <td
            className="px-2 py-2 border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => handleHistory(item)}
              className="bg-indigo-600 text-white px-2 py-1 rounded flex justify-center w-full"
            >
              <BellRing className="w-3.5 h-3.5" />
            </button>
          </td>

          <td
            className="px-2 py-2 border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                console.log("hhhh")
                console.log(ownLead)
                console.log(isManager)
                console.log(isAllocatedToeditable)
                const breadcrumb = [
                  { label: "Lead", path: "", state: "" },
                  {
                    label: "Own Lead",
                    path:
                      loggedUser?.role === "Admin"
                        ? "/admin/transaction/lead/ownedLeadlist"
                        : "/staff/transaction/lead/ownedLeadlist",
                    state: { dates, ownLead, selecteduserBranch }
                  },
                  { label: "New Lead", path: "" }
                ]

                console.log(item)
                console.log(loggedUser)
                const hasOpenTaskForLoggedUser = item?.activityLog?.some(
                  (log) =>
                    log?.followupClosed === false &&
                    log?.taskallocatedTo?._id === loggedUser?._id
                )
                const hasFollowupTaskForLoggedUser = item?.activityLog?.some(
                  (log) =>
                    log?.followupClosed === false &&
                    log?.taskallocatedTo?._id === loggedUser?._id &&
                    log?.taskTo === "followup"
                )
                console.log(hasOpenTaskForLoggedUser)
              
                console.log(item)
                // const isReadOnly = item?.leadConfirmed
                //   ? true
                //   : item?.leadLost
                //     ? true
                //     : item?.reallocatedTo
                //       ? loggedUser?.role === "Admin" ||
                //         loggedUser?.role === "Manager"
                //         ? false
                //         : !hasOpenTaskForLoggedUser // if hasOpenTaskForLoggedUser === true → readonly false
                //       : hasFollowupTaskForLoggedUser
                //         ? false // non-reallocated + followup assigned to user → readonly false
                //         : item?.leadBy?._id !== loggedUser?._id
// const isReadOnly = item?.leadConfirmed
//   ? true
//   : item?.leadLost
//     ? true
//     : item?.reallocatedTo
//       ? loggedUser?.role === "Admin" || loggedUser?.role === "Manager"
//         ? false
//         : !hasOpenTaskForLoggedUser
//       : !hasFollowupTaskForLoggedUser;



const isLeadOwner =
  item?.leadBy?._id?.toString() === loggedUser?._id?.toString();

const isReadOnly = item?.leadConfirmed || item?.leadLost
  ? true
  : item?.reallocatedTo
    ? loggedUser?.role === "Admin" || loggedUser?.role === "Manager"
      ? false
      : !hasOpenTaskForLoggedUser
    : hasFollowupTaskForLoggedUser
      ? false
      : !isLeadOwner;
console.log(item?.leadLost)
console.log(item?.leadConfirmed)
console.log(item?.reallocatedTo)
console.log(hasOpenTaskForLoggedUser)
console.log(hasFollowupTaskForLoggedUser)
console.log(loggedUser?._id)
console.log(item?.leadBy?._id)
                console.log(isReadOnly)

                loggedUser.role === "Admin"
                  ? navigate("/admin/transaction/lead/leadEdit", {
                      state: {
                        leadId: item._id,
                        breadcrumb,
                        isReadOnly,
                        from: "Ownleadlist"
                      }
                    })
                  : navigate("/staff/transaction/lead/leadEdit", {
                      state: {
                        leadId: item._id,
                        breadcrumb,
                        isReadOnly,
                        from: "Ownleadlist"
                      }
                    })
              }}
              className="bg-blue-600 text-white px-2 py-1 rounded flex justify-center w-full"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </td>

          <td className="px-3 py-2 text-right border border-gray-200 whitespace-nowrap text-xs">
            <span className="inline-flex items-center gap-0.5">
              <IndianRupee className="w-3 h-3" />
              {item.netAmount?.toLocaleString("en-IN")}
            </span>
          </td>
        </tr>

        {/* SECONDARY ROWS */}
        {open && (
          <>
            <tr className="text-xs font-semibold bg-blue-50 border border-gray-200">
              <td className="border border-gray-200 px-3 py-1" />
              <td className="border border-gray-200 px-3 py-1">Lead By</td>
              <td className="border border-gray-200 px-3 py-1">Assigned To</td>
              <td className="border border-gray-200 px-3 py-1">Assigned By</td>
              <td className="border border-gray-200 px-3 py-1 text-center">No.of Calls</td>
              <td className="border border-gray-200 px-3 py-1">Lead Date</td>
              <td className="border border-gray-200 px-3 py-1">Lead ID</td>
              <td className="border border-gray-200 px-3 py-1">Product Name</td>
            </tr>

            <tr className="bg-slate-50 text-xs text-gray-600 border border-gray-200 whitespace-nowrap">
              <td className="border border-gray-200 px-3 py-1" />
              <td className="border border-gray-200 px-3 py-1">
                {item?.leadBy?.name || "-"}
              </td>
              <td className="border border-gray-200 px-3 py-1">
                {item?.taskallocatedTo?.name || "-"}
              </td>
              <td className="border border-gray-200 px-3 py-1">
                {item?.taskallocatedBy?.name || "-"}
              </td>
              <td className="border border-gray-200 px-3 py-1 text-center">
                {item?.activityLog?.filter(
                  (log) =>
                    log?.taskBy?.taskName?.toLowerCase() === "followup" &&
                    log?.nextFollowUpDate
                ).length || 0}
              </td>
              <td className="border border-gray-200 px-3 py-1">
                {item.leadDate?.toString().split("T")[0] || "-"}
              </td>
              <td className="border border-gray-200 px-3 py-1">
                {item?.leadId || "-"}
              </td>
              <td className="border border-gray-200 px-3 py-1 text-blue-600 font-medium text-left">
                {(item?.leadFor[0]?.productorServiceId?.shortName||item?.leadFor[0]?.productorServiceId?.productName).toUpperCase()}
              </td>
            </tr>
          </>
        )}
      </>
    )
  }
  console.log("hhh")
  const getNetAmountTotal = (leads = []) =>
    leads.reduce((total, lead) => {
      const amount = Number(lead?.netAmount)
      return total + (Number.isFinite(amount) ? amount : 0)
    }, 0)

  const normalizedLeadSearch = leadSearch.trim().toLowerCase()
  const visibleTableData = normalizedLeadSearch
    ? tableData
        .map((group) => ({
          ...group,
          leads: (group?.leads || []).filter((lead) => {
            const customerName =
              lead?.customerName?.customerName || lead?.customerName || ""
            const productNames = (lead?.leadFor || []).map((product) =>
              [
                product?.productorServiceName,
                product?.productorServiceId?.shortName,
                product?.productorServiceId?.productName,
                product?.productorServiceId?.serviceName,
                product?.productName
              ]
                .filter(Boolean)
                .join(" ")
            )

            return [customerName, ...productNames].some((value) =>
              String(value).toLowerCase().includes(normalizedLeadSearch)
            )
          })
        }))
        .filter((group) => group.leads.length > 0)
    : tableData

  const totalNetAmount = visibleTableData.reduce(
    (total, group) => total + getNetAmountTotal(group?.leads),
    0
  )

  const renderTable = (groups) => (
    <table className="w-full border-collapse border border-gray-200 text-sm">
      <thead className="bg-blue-600 text-white text-xs sticky top-0 z-10">
        <tr>
          <th className="border border-blue-500 w-5" />
          <th className="border border-blue-500 px-3 py-2 text-left">Name</th>
          <th className="border border-blue-500 px-3 py-2 text-left">Mobile</th>
          <th className="border border-blue-500 px-3 py-2 text-left">
            Last Remark
          </th>
          <th className="border border-blue-500 px-3 py-2 text-center">
            Follow-Up Date
          </th>
          <th className="border border-blue-500 px-3 py-2 text-center">
            Event
          </th>
          <th className="border border-blue-500 px-3 py-2 text-center">View</th>
          <th className="border border-blue-500 px-3 py-2 text-right">
            Net Amount
          </th>
        </tr>
      </thead>
      <tbody>
        {groups.flatMap(({ staffName, leads }, groupIndex) => {
          const rows = []
          const staffNetAmount = getNetAmountTotal(leads)

          if (staffName) {
            rows.push(
              <tr key={`staff-${staffName}-${groupIndex}`} className="bg-slate-100">
                <td
                  colSpan={8}
                  className="border border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span>
                      {staffName}
                      <span className="ml-1 font-normal text-slate-500">
                        ({leads?.length || 0} Leads)
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                      Net Amount
                      <IndianRupee className="h-3 w-3" />
                      {staffNetAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </td>
              </tr>
            )
          }

          rows.push(
            ...(Array.isArray(leads)
              ? leads.map((item) => <LeadRow key={item._id} item={item} />)
              : [])
          )

          return rows
        })}
      </tbody>
    </table>
  )

  const hasLeads =
    Array.isArray(visibleTableData) &&
    visibleTableData.some(
      (group) => Array.isArray(group.leads) && group.leads.length > 0
    )
  return (
    <div className="h-full overflow-hidden bg-[#ADD8E6]">
      <div className="flex h-full overflow-hidden lg:flex-row">
        {/* {selecteduserBranch && (
          <StaticSidebar
            handleMoreClick={handleMoreClick}
            selectedCompanyBranch={selecteduserBranch}
            parenttargetData={settargetData}
            parentperiodmode={periodMode}
            parentyear={selectedYear}
            setselectedPeriod={setselectedPeriod}
          />
        )} */}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* <header className="flex items-center justify-between ">
            {loggedUser?.role?.toLowerCase() === "admin" ? (
              <AdminHeader hide={true} />
            ) : (
              <StaffHeader hide={true} />
            )}

            <div className="flex h-full items-center gap-1.5 pr-3">
              <button className="rounded-full bg-slate-100 p-1.5 transition">
                <Mail size={15} strokeWidth={2.2} />
              </button>

              <div className="relative">
                <button className="rounded-full bg-slate-100 p-1.5 transition">
                  <MessageSquareText size={15} strokeWidth={2.2} />
                </button>
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
              </div>

              <button className="rounded-full bg-slate-100 p-1.5 transition">
                <Settings size={15} strokeWidth={2.2} />
              </button>

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowUserMenu((prev) => !prev)
                  }}
                  className="rounded-full bg-slate-100 p-1.5 transition"
                >
                  <User size={15} strokeWidth={2.2} />
                </button>
              </div>
            </div>
          </header> */}

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <Breadcrumb items={Breadcrumblist} />
            <div className="m-2 shrink-0 rounded-lg border border-slate-200 bg-white/70 px-3 py-2 shadow-sm md:m-3">
              <div>
                <div className="grid w-full grid-cols-1 items-center gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(10rem,1.1fr)_repeat(3,minmax(8rem,0.9fr))_minmax(16rem,1.3fr)_auto]">
                  <div className="relative w-full">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={leadSearch}
                      onChange={(event) => setLeadSearch(event.target.value)}
                      placeholder="Search customer or product"
                      className="h-8 w-full rounded-md border border-slate-200 bg-white py-1 pl-8 pr-8 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    {leadSearch && (
                      <button
                        type="button"
                        onClick={() => setLeadSearch("")}
                        aria-label="Clear lead search"
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <CustomSelect
                    value={selectedProductFilter}
                    onChange={setSelectedProductFilter}
                    placeholder="All products"
                    className="w-full"
                    options={[
                      { value: "", label: "All products" },
                      ...productFilterOptions.map((product) => ({
                        value: `${product.productModel}:${product.productId}`,
                        label: product.label
                      }))
                    ]}
                  />
                  <CustomSelect
                    value={selectedCategoryFilter}
                    onChange={setSelectedCategoryFilter}
                    placeholder="All categories"
                    className="w-full"
                    options={[
                      { value: "", label: "All categories" },
                      ...categoryFilterOptions
                    ]}
                  />
                  <CustomSelect
                    value={leadStatusFilter}
                    onChange={setLeadStatusFilter}
                    className="w-full"
                    options={[
                      { value: "all", label: "All leads" },
                      { value: "other", label: "Other leads" },
                      { value: "lost", label: "Lost leads" },
                      { value: "completed", label: "Completed leads" }
                    ]}
                  />
                  {dates.startDate && (
                    <div className="w-full sm:col-span-2 lg:col-span-1">
                      <MyDatePicker
                        setDates={setDates}
                        dates={dates}
                        compact
                        fullWidth
                        inlineOnMobile
                        hideLabels
                        paymentHistoryStyle
                      />
                    </div>
                  )}

                  <button
                    onClick={() =>
                      loggedUser?.role === "Admin"
                        ? navigate("/admin/transaction/lead")
                        : navigate("/staff/transaction/lead")
                    }
                    className="inline-flex h-8 w-full items-center justify-center rounded-md bg-slate-900 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 sm:col-span-2 sm:justify-self-end sm:w-auto lg:col-span-1"
                  >
                    New Lead
                  </button>
                </div>
              </div>
            </div>

            <div className="mx-2 mb-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg bg-white shadow-xl md:mx-3">
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 py-2 shadow-sm">
                {loggedUser?.role !== "Staff" ? (
                  <div className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 shadow-sm">
                    <span
                      className={`min-w-[4.5rem] text-xs font-semibold transition-colors ${
                        ownLead ? "text-emerald-700" : "text-slate-700"
                      }`}
                    >
                      {ownLead ? "Own Leads" : "All Leads"}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={ownLead}
                      aria-label={ownLead ? "Show all leads" : "Show own leads"}
                      onClick={() => {
                        setTableData([])
                        setownLead((prev) => !prev)
                      }}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 ${
                        ownLead ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    >
                      <span
                        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                          ownLead ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                ) : (
                  <span />
                )}

                {hasLeads && (
                  <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                    <span>Total Net Amount</span>
                    <span className="flex items-center gap-0.5 rounded-md bg-white/15 px-2 py-0.5 text-sm">
                      <IndianRupee className="h-3.5 w-3.5" />
                      {totalNetAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>
              {loading ? (
                <div className="p-4">
                  <SkeletonTable rows={5} columns={8} />
                </div>
              ) : !hasLeads ? (
                <div className="p-4">
                  <NodataAvailable
                    title="No Lead Available"
                    message="There are no leads to display for the selected filters."
                  />
                </div>
              ) : (
                <>
                  <div className="min-h-0 flex-1 overflow-auto">
                    {renderTable(visibleTableData)}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {showhistoryModal && historyList.length > 0 && (
          <LeadhistoryModal
            selectedLeadId={selectedLeadId}
            historyList={historyList}
            handlecloseModal={() => sethistoryModal(false)}
          />
        )}

        <PerformanceModal
          modalOpen={openModal}
          splitType={targetData?.selectedMeasurementType}
          selectedperiod={selectedPeriod}
          allperiods={targetData?.periods}
          onselectedPeriodChange={(val, val2) => {
            setSelectedMonth(val2)
            setselectedPeriod(val)
          }}
          onMonthChange={(val) => {
            setacheivedProducts([])
            setselectedDataPopup([])
            setperiodMode(val)
            setselecteduserName(null)
          }}
          onYearChange={(val) => {
            setacheivedProducts([])
            setselectedDataPopup([])
            setSelectedYear(val)
            setselecteduserName(null)
          }}
          productlist={productlist}
          onClose={() => {
            setselecteduserName(null)
            setacheivedProducts([])
            setOpenModal(false)
            setActiveUserId(null)
          }}
          selectedMonth={periodMode}
          selectedYear={selectedYear}
          summary={{
            target: selectedDatapopup?.target,
            achieved: selectedDatapopup?.achieved,
            balance:
              selectedDatapopup?.achieved > selectedDatapopup?.target
                ? 0
                : selectedDatapopup?.balance
          }}
          products={achievedproducts}
          targetData={targetData?.userWiseResults}
          loggedUser={loggedUser}
          selectedUser={selectedUserName}
          category={selectedCategory}
          handleSelectedUser={handleSelectedUser}
          activeUserId={activeUserId}
        />
      </div>
    </div>
  )
}
