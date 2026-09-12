import React, { useEffect, useState, useMemo, useCallback } from "react"
import UseFetch from "../../../hooks/useFetch"
import { useNavigate } from "react-router-dom"
import { PaymentHistoryModal } from "../../../components/primaryUser/PaymentHistoryModal"
import { LeadhistoryModal } from "../../../components/primaryUser/LeadhistoryModal"
import { CollectionupdateModal } from "../../../components/primaryUser/CollectionupdateModal"
import api from "../../../api/api"
import { useSelector } from "react-redux"
import SearchBar from "../../../components/common/SearchBar"
import SkeletonTable from "../../../components/loader/SkeletonTable"
import {
  Eye,
  Phone,
  Mail,
  Settings,
  MessageSquareText,
  User,
  Calendar,
  Clock,
  UserPlus,
  UserCheck,
  IndianRupee,
  BellRing, // Follow-up
  History,
  CreditCard, // Payment History
  ClipboardCheck, // Collection Update,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { getLocalStorageItem } from "../../../helper/localstorage"
import AdminHeader from "../../../header/AdminHeader"
import StaffHeader from "../../../header/StaffHeader"
import { StaticSidebar } from "../../../components/primaryUser/StaticSidebar"
import { PerformanceModal } from "../../../components/primaryUser/PerformanceModal"
import { PropagateLoader } from "react-spinners"
import { toast } from "react-toastify"

const formatDateForInput = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function ClosedLeads() {
  console.log("hh")
  const [showFullName, setShowFullName] = useState(false)
  const [tableData, setTableData] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [searchInitialized, setSearchInitialized] = useState(false)
  console.log(tableData)
  console.log(tableData)
  const [forcefullyclosedLeads, setforcefullyClosedLeads] = useState([])
  const [isforcefullyclosed, setisforcefullyclosed] = useState(false)
  console.log(tableData)
  const [isdepartmentisAccountant, setisdepartmentAccountant] = useState(false)
  console.log(isdepartmentisAccountant)
  const [loggedUser, setLoggedUser] = useState(null)
  const [leadId, setleadId] = useState(null)
  const [leadDocId, setleadDocId] = useState(null)
  const [activeUserId, setActiveUserId] = useState(null)
  const [partner, setPartner] = useState([])
  const [showFullEmail, setShowFullEmail] = useState(false)
  const [paymenthistoryModal, setpaymentHistoryModal] = useState(false)
  const [collectionupdateModal, setcollectionUpdateModal] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedData, setselectedData] = useState(null)
  const [closedDateRange, setClosedDateRange] = useState(() => {
    const today = new Date()
    const firstDayOfCurrentMonth = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )

    return {
      startDate: formatDateForInput(firstDayOfCurrentMonth),
      endDate: formatDateForInput(today)
    }
  })

  console.log(selectedData)
  const [selectedLeadId, setselectedLeadId] = useState(null)
  console.log(selectedLeadId)
  const [verifiedLead, setverifiedLead] = useState(false)
  console.log(verifiedLead)
  const [companyBranches, setcompanyBranches] = useState(null)
  const [balanceAmount, setBalanceAmount] = useState(null)
  const [isChecked, setIsChecked] = useState(false)
  const [selectedCompanyBranch, setselectedCompanyBranch] = useState(null)
  const [showhistoryModal, sethistoryModal] = useState(false)
  const [paymentHistoryList, setpaymentHistoryList] = useState([])
  const [historyList, setHistoryList] = useState([])
  const [loggedUserBranches, setloggedUserBranches] = useState([])
  const [selectedUserName, setselecteduserName] = useState(null)
  const [selectedCategory, setselectedCategory] = useState(null)
  const [selectedDatapopup, setselectedDataPopup] = useState({})
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))
  const [periodMode, setperiodMode] = useState("all")
  const [targetData, settargetData] = useState([])
  console.log(targetData)
  const [openModal, setOpenModal] = useState(false)
  const [selectedCollection, setselectedCollection] = useState({})
  const [productlist, setproductList] = useState([])
  const [achievedproducts, setacheivedProducts] = useState([])
  const [selectedPeriod, setselectedPeriod] = useState("")
  const navigate = useNavigate()
  const { data: companybranches } = UseFetch("/branch/getBranch")
  // const {data}=UseFetch("/lead/fix-leadverified")
  const selectedreduxbranch = useSelector(
    (branch) => branch.companyBranch.selectedBranch
  )
  console.log(selectedreduxbranch)
  const {
    data: collectionlead,
    loading,
    refreshHook
  } = UseFetch(
    selectedreduxbranch &&
      loggedUser &&
      `/lead/collectionLeads?selectedBranch=${selectedreduxbranch}&verified=${verifiedLead}&isAccountant=${isdepartmentisAccountant}&loggeduserby=${loggedUser._id}`
  )
  const closedLeadsUrl = useMemo(() => {
    if (
      !selectedreduxbranch ||
      !closedDateRange.startDate ||
      !closedDateRange.endDate
    ) {
      return null
    }

    const params = new URLSearchParams({
      selectedBranch: selectedreduxbranch,
      startDate: closedDateRange.startDate,
      endDate: closedDateRange.endDate
    })

    return `/lead/closedleads?${params.toString()}`
  }, [selectedreduxbranch, closedDateRange.startDate, closedDateRange.endDate])
  const { data: closedleads, loading: closedLeadsLoading } =
    UseFetch(closedLeadsUrl)
  const pageLoading = loading || closedLeadsLoading
  console.log(closedleads)

  const a = collectionlead?.filter((item) => item.null)
  console.log(a)
  const { data: branchProduct } = UseFetch(
    selectedreduxbranch &&
      `/product/getallbranchProduct?branch=${selectedreduxbranch}`
  )

  const { data: partners } = UseFetch("/customer/getallpartners")

  useEffect(() => {
    if (companybranches && companybranches.length > 0) {
      const userData = getLocalStorageItem("user")
      console.log(userData.department?.department)
      if (userData.department?.code === "DEPARTMENT2") {
        setisdepartmentAccountant(true)
      }

      setLoggedUser(userData)
      if (userData.role === "Admin") {
        if (userData?.selected) {
          const branches = userData.selected.map((branch) => {
            return {
              value: branch.branch_id,
              label: branch.branchName
            }
          })
          setloggedUserBranches(branches)
        } else {
          const staffbranches = companybranches.map((branch) => {
            return {
              value: branch._id,
              label: branch.branchName
            }
          })

          setloggedUserBranches(staffbranches)
        }
      } else {
        const branches = userData.selected.map((branch) => {
          return {
            value: branch.branch_id,
            label: branch.branchName
          }
        })
        setloggedUserBranches(branches)
      }
    }
  }, [companybranches])
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

      console.log("hhh")

      console.log(Datas)
      console.log("hhhh")

      const filteredselectedCategory = Datas.flatMap(
        (user) => user.categories || []
      ).filter((item) => item.categoryId === selectedCategory?.Id)
      console.log(filteredselectedCategory)
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
        console.log("hh")
        console.log(filteredselectedCategory)
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
  useEffect(() => {
    if (paymenthistoryModal && collectionlead && selectedLeadId) {
      console.log("hh")
      const updatedhistorylist = collectionlead.filter(
        (item) => item.leadId === selectedLeadId
      )

      console.log(updatedhistorylist)
      console.log(updatedhistorylist[0]?.paymentHistory)
      setselectedCollection(updatedhistorylist[0])
      setpaymentHistoryList(updatedhistorylist[0]?.paymentHistory)
      console.log(updatedhistorylist[0])
      setBalanceAmount(updatedhistorylist[0].balanceAmount)
    }
  })
  console.log(paymentHistoryList)
  useEffect(() => {
    if (loggedUserBranches && loggedUserBranches.length > 0) {
      const defaultbranch = loggedUserBranches[0]
      setselectedCompanyBranch(defaultbranch.value)
    }
  }, [loggedUserBranches])
  console.log("Hh")
  useEffect(() => {
    console.log(closedleads)
    if (closedleads?.closedLeads && closedleads?.closedLeads?.length > 0) {
      setTableData(normalizeTableData(closedleads?.closedLeads))

      setPartner(partners)
    } else {
      setTableData([])
    }
  }, [closedleads])
  const normalizeTableData = (data) => {
    if (Array.isArray(data)) {
      return [{ staffName: null, leads: data }]
    } else if (typeof data === "object" && data !== null) {
      return Object.entries(data).map(([staffName, leads]) => ({
        staffName,
        leads
      }))
    }
    return []
  }

  const checkIsForcefullyClosed = (dateString, balance, isverified) => {
    console.log(balance)
    console.log(isverified)
    const checkelibleforForcefullyclosed = Number(balance) > 0 && !isverified
    console.log(checkelibleforForcefullyclosed)
    console.log(dateString)
    console.log(dateString)
    const d = new Date(dateString) // e.g. "2026-04-17T09:32:29.127Z"
    if (isNaN(d)) return // invalid date guard

    const now = new Date()

    const sameMonth =
      d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() // month is 0-based

    console.log(sameMonth)
    console.log(d.getMonth())
    console.log(now.getMonth())
    console.log(d.toLocaleDateString())
    const monthName = d.toLocaleString("default", { month: "long" })
    console.log(monthName)
    // If same month as current → not previous target
    if (sameMonth) {
      console.log("hhh")
      // setIsChecked(false)
      setIsChecked({ month: monthName, checked: true })
    } else {
      console.log("hhh")
      setIsChecked({ month: monthName, checked: true })
    }
  }
  const handleCollection = (item) => {
    console.log(item)
    console.log("hh")
    setcollectionUpdateModal(true)
    setselectedData(item)
  }
  const handlecloseModal = () => {
    setHistoryList([])
    sethistoryModal(false)
    setselectedLeadId(null)
  }
  const handleHistory = (Item) => {
    console.log(Item)
    console.log("hh")
    setselectedData(Item.activityLog)
    setHistoryList(Item.activityLog)
    setselectedLeadId(Item.leadId)
    sethistoryModal(true)
  }

  const getDisplayAmount = (item) => {
    console.log(item)
    console.log(isdepartmentisAccountant)
    console.log("h")
    console.log(verifiedLead)
    console.log(isdepartmentisAccountant)
    if (isdepartmentisAccountant) {
      if (verifiedLead) {
        console.log("hhh")
        return (item || [])
          .filter((history) => history?.paymentVerified === true)
          .reduce(
            (sum, history) => sum + Number(history?.receivedAmount || 0),
            0
          )
      } else {
        return (item || [])
          .filter((history) => history?.paymentVerified === false)
          .reduce(
            (sum, history) => sum + Number(history?.receivedAmount || 0),
            0
          )
      }
    } else {
      console.log("hhh")
      return (item || []).reduce(
        (sum, history) => sum + Number(history?.receivedAmount || 0),
        0
      )
    }
  }
  const handleCollectionUpdate = async (
    formData,
    setsubmitLoader,
    submitLoader
  ) => {
    console.log("H")
    if (submitLoader) return
    console.log("Hh")
    setsubmitLoader(true)
    console.log(formData)

    try {
      const response = await api.post("/lead/collectionUPdate", formData)
      if (response.status === 200) {
        setsubmitLoader(false)
        toast.success("payment updated successfully")
        refreshHook()
        return response
      }
    } catch (error) {
      toast.error("something went wrong")
      console.log("error", error.message)
    }
  }
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

  const sourceGroupedData = useMemo(() => {
    return isforcefullyclosed ? forcefullyclosedLeads : tableData
  }, [isforcefullyclosed, forcefullyclosedLeads, tableData])

  const leadsForSearch = useMemo(() => {
    return (sourceGroupedData || []).flatMap((group) => group?.leads || [])
  }, [sourceGroupedData])

  const handleFilteredLeads = useCallback((leads) => {
    setFilteredLeads(leads)
    setSearchInitialized(true)
  }, [])
  console.log(forcefullyclosedLeads)
  const renderTable = (data) => {
    const LeadRow = ({ item, index }) => {
      console.log(item)
      if (item?.leadId === "00017") {
        console.log(item)
      }
      const [open, setOpen] = useState(false)
      const isAdditionalService = item?.leadFor?.filter(
        (item) => item.productorservicetype === "Additionalservice"
      )
      let taggedlicense = null
      if (isAdditionalService && isAdditionalService.length) {
        console.log("h")
        console.log(isAdditionalService)

        taggedlicense = (isAdditionalService || []).flatMap((item) =>
          (item.taggeddata || []).map((tag) => tag.licensenumber)
        )
        console.log(taggedlicense)
      }
      const lastLog = item.activityLog[item.activityLog.length - 1]
      const followupDate = lastLog?.nextFollowUpDate
        ? new Date(lastLog.nextFollowUpDate)
            .toLocaleDateString("en-GB")
            .split("/")
            .join("-")
        : "-"
      console.log(item?.customerName)
      const customerName = item?.customerName?.customerName.toUpperCase()
      const shouldShowTooltipCustomer = customerName?.length > 20
      const shouldShowTooltipEmail = item?.email.length > 5
      const productOrServiceNames = Array.from(
        new Set(
          (item?.leadFor || [])
            .map(
              (leadItem) =>
                leadItem?.productorServiceId?.shortName ||
                leadItem?.productorServiceId?.productName
            )
            .filter(Boolean)
        )
      ).join(", ")
      return (
        <>
          {/* ── Main row ── */}
          <tr
            onClick={() => setOpen((v) => !v)}
            className="cursor-pointer bg-white hover:bg-blue-50 transition-colors border border-gray-300"
          >
            <td className="pl-2 pr-1 py-2 w-5 border border-gray-300">
              {open ? (
                <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              )}
            </td>

            <td className="px-3 py-2 font-semibold text-gray-900 text-sm border border-gray-300 whitespace-nowrap">
              <div className="relative group w-[180px]">
                <span
                  tabIndex={0}
                  className="block truncate cursor-pointer"
                  aria-label={customerName}
                >
                  {customerName}
                </span>

                {shouldShowTooltipCustomer && (
                  <div className="pointer-events-none absolute left-0 top-full z-50 mt-2 w-max  rounded-xl bg-gray-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-xl ring-1 ring-white/10 transition-all duration-200 translate-y-1 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    {customerName}
                    <div className="absolute -top-1 left-4 h-2 w-2 rotate-45 bg-gray-900"></div>
                  </div>
                )}
              </div>
            </td>
            <td className="px-3 py-2 text-gray-700 text-sm border border-gray-300 whitespace-nowrap">
              {item?.mobile}
            </td>

            <td className="whitespace-nowrap border border-blue-300 px-3 py-2 text-center text-sm font-medium text-red-500">
              {isAdditionalService?.length
                ? taggedlicense.join(", ")
                : item?.leadFor?.[0]?.licenseNumber}
            </td>
            <td className="px-3 py-2 text-sm font-medium text-blue-700 border border-blue-300 whitespace-nowrap text-center">
              {productOrServiceNames.toUpperCase()}
            </td>
            <td
              className="px-2 py-2 border border-gray-300"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => handleHistory(item)}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors w-full justify-center"
              >
                <BellRing className="w-3.5 h-3.5" />
              </button>
            </td>

            <td className="px-2 py-2 border border-gray-300">
              <button
                type="button"
                onClick={() => {
                  console.log("hh")
                  //   const breadcrumb = [
                  //     { label: "Lead", path: "", state: "" },
                  //     {
                  //       label: "Lead Follow-Up",
                  //       path:
                  //         loggedUser?.role === "Admin"
                  //           ? "/admin/transaction/lead/leadEdit"
                  //           : "/staff/transaction/lead/leadEdit",
                  //       state: { ownfollowup: ownFollowUp, pending }
                  //     },
                  //     { label: "New Lead", path: "" }
                  //   ]
                  console.log("Hh")
                  loggedUser?.role === "Admin"
                    ? navigate("/admin/transaction/lead/leadEdit", {
                        state: {
                          leadId: item._id,
                          isReadOnly: false,
                          from: "closedlead"
                        }
                      })
                    : navigate("/staff/transaction/lead/leadEdit", {
                        state: {
                          leadId: item._id,
                          isReadOnly: false,
                          from: "closedlead"
                        }
                      })
                  console.log("hhh")
                }}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors w-full justify-center"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
            </td>

            <td className="px-3 py-2 text-sm font-semibold text-green-700 border border-gray-300 whitespace-nowrap text-right">
              <span className="inline-flex items-center gap-0.5 justify-end">
                <IndianRupee className="w-3.5 h-3.5" />

                {item?.netAmount}
              </span>
            </td>
          </tr>

          {/* ── Expanded rows ── */}
          {open && (
            <>
              {/* Sub-header row */}
              {/* Columns: chevron | leadby | assignedto | assignedby | followups | leaddate | leadid(blue) | phone(blue) | email(blue) */}
              <tr className="text-xs font-medium border border-gray-300 whitespace-nowrap">
                <td className="border border-gray-300 bg-gray-100" />
                <td className="px-3 py-1 border border-gray-300 bg-gray-100 text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Lead by</span>
                  </div>
                </td>
                <td className="px-3 py-1 border border-gray-300 bg-gray-100 text-gray-600">
                  <div className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-green-600" />
                    <span>Assigned to</span>
                  </div>
                </td>
                <td className="px-3 py-1 border border-gray-300 bg-gray-100 text-gray-600">
                  <div className="flex items-center gap-1">
                    <UserPlus className="w-3.5 h-3.5 text-purple-600" />
                    <span>Assigned by</span>
                  </div>
                </td>
                <td className="px-3 py-1 border border-gray-300 bg-gray-100 text-gray-600">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-orange-600" />
                    <span>No. of Followups</span>
                  </div>
                </td>
                <td className="px-3 py-1 border border-gray-300 bg-gray-100 text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-500" />
                    <span>Lead Date</span>
                  </div>
                </td>
                <td className="px-3 py-1 border border-gray-300 bg-gray-100 text-gray-600">
                  <span>Lead ID</span>
                </td>
                <td className="px-3 py-1 border border-gray-300 bg-gray-100 text-gray-600">
                  <div className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </div>
                </td>
              </tr>

              {/* Sub-data row */}
              <tr className="bg-white text-xs border border-b-2 border-gray-300 border-b-gray-400 whitespace-nowrap">
                <td className="border border-gray-300" />
                <td className="px-3 py-1.5 border border-gray-300 text-gray-800 font-medium">
                  {item?.leadBy?.name || "-"}
                </td>
                <td className="px-3 py-1.5 border border-gray-300 text-gray-700 ">
                  {item?.taskallocatedTo?.name || "-"}
                </td>
                <td className="px-3 py-1.5 border border-gray-300 text-gray-700">
                  {item?.taskallocatedBy?.name || "-"}
                </td>
                <td className="px-3 py-1.5 border border-gray-300 text-gray-700">
                  {/* {item.activityLog.length} */}
                </td>
                <td className="px-3 py-1.5 border border-gray-300 text-gray-700">
                  {item.leadDate?.toString().split("T")[0] || "-"}
                </td>
                <td className="px-3 py-1.5 border border-gray-300  text-gray-700">
                  {item?.leadId}
                </td>
                <td className="px-3 py-2  text-gray-700 text-sm border border-gray-300 whitespace-nowrap">
                  <div className="relative group w-[100px]">
                    <span
                      tabIndex={0}
                      className="block truncate cursor-pointer"
                      aria-label={item?.email}
                    >
                      {item?.email}
                    </span>

                    {shouldShowTooltipEmail && (
                      <div className="pointer-events-none absolute left-0 top-full z-50 mt-2 w-max max-w-xs rounded-xl bg-gray-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-xl ring-1 ring-white/10 transition-all duration-200 translate-y-1 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                        {item?.email}
                        <div className="absolute -top-1 left-4 h-2 w-2 rotate-45 bg-gray-900"></div>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            </>
          )}
        </>
      )
    }

    return (
      <table className="border-collapse border border-gray-300 w-full text-sm">
        <thead className="whitespace-nowrap bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-30 text-xs">
          <tr>
            <th className="border border-gray-300 w-5" />
            <th className="border border-gray-300 px-3 py-1 text-left">
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3" />
                <span>Name</span>
              </div>
            </th>
            <th className="border border-gray-300 px-3 py-1 text-left min-w-[130px]">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3 h-3" />
                <span>Mobile</span>
              </div>
            </th>
            <th className="border border-gray-300 px-3 py-1 text-center">
              <span>License No.</span>
            </th>
            <th className="border border-gray-300 px-3 py-1 text-center">
              <span>Product Name</span>
            </th>
            <th className="border border-gray-300 px-3 py-1 text-center">
              Event Log
            </th>

            <th className="border border-gray-300 px-3 py-1 text-center">
              View/Modify
            </th>

            <th className="border border-gray-300 px-3 py-1 text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <IndianRupee className="w-3 h-3" />
                <span>Net Amount</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          {data?.length > 0 ? (
            data.map((item, index) => (
              <LeadRow key={item._id ?? index} item={item} index={index} />
            ))
          ) : (
            <tr>
              <td colSpan={9} className="text-center text-gray-500 py-6">
                {pageLoading ? (
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                  </div>
                ) : (
                  <div>No Leads</div>
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    )
  }
  return (
    <div className="flex h-full overflow-hidden bg-[#ADD8E6]">
      {/* Keep your existing sidebar component outside/alongside this main area.
        Sidebar wrapper should use: h-screen shrink-0 overflow-y-auto */}

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <section
          className="
    mx-2 shrink-0 rounded-xl border border-white/60
    bg-white/90 px-2.5 py-2 shadow-sm backdrop-blur
    sm:mx-3 sm:px-3
  "
        >
          {/* Row 1: title and action */}
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <span className="h-5 w-1 shrink-0 rounded-full bg-blue-600" />

              <h2 className="truncate text-sm font-bold text-slate-900">
                Closed Leads
              </h2>

              <span className="hidden shrink-0 text-xs font-semibold text-slate-400 sm:inline">
                {leadsForSearch.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                loggedUser?.role === "Admin"
                  ? navigate("/admin/transaction/lead")
                  : navigate("/staff/transaction/lead")
              }
              className="
        inline-flex h-7 shrink-0 items-center justify-center gap-1
        rounded-md bg-slate-900 px-2 text-[11px] font-semibold
        text-white shadow-sm transition hover:bg-slate-700
      "
            >
              <span className="text-sm leading-none">+</span>
              New Lead
            </button>
          </div>

          {/* Row 2: search and filters. Responsive grid, never scrolls */}
          <div
            className="
      mt-2 grid grid-cols-1 gap-1.5
      sm:grid-cols-[minmax(0,1fr)_auto]
      lg:grid-cols-[minmax(220px,1fr)_auto_auto_auto]
    "
          >
            <div className="min-w-0">
              <SearchBar
                data={leadsForSearch}
                onFilteredData={handleFilteredLeads}
                placeholder="Search customer, mobile, license or product..."
              />
            </div>

            <div className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-500 " />
              <input
                type="date"
                aria-label="Closed from date"
                value={closedDateRange.startDate}
                max={closedDateRange.endDate || undefined}
                onChange={(event) =>
                  setClosedDateRange((previous) => ({
                    ...previous,
                    startDate: event.target.value
                  }))
                }
                className="min-w-0 bg-transparent text-[11px] text-slate-700 outline-none "
              />
              <span className="text-[10px] text-slate-400">to</span>
              <input
                type="date"
                aria-label="Closed to date"
                value={closedDateRange.endDate}
                min={closedDateRange.startDate || undefined}
                onChange={(event) =>
                  setClosedDateRange((previous) => ({
                    ...previous,
                    endDate: event.target.value
                  }))
                }
                className="min-w-0 bg-transparent text-[11px] text-slate-700 outline-none"
              />
             
            </div>

            
          </div>
        </section>
        <section className="flex min-h-0 flex-1 flex-col p-2 md:p-3">
          <div
            className="
      flex min-h-0 flex-1 flex-col overflow-hidden
      rounded-xl border border-white/70 bg-white
      shadow-md shadow-slate-900/10
    "
          >
            {/* Table card header */}
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500" />

                <p className="text-xs font-semibold text-slate-700">
                  Closed Records
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
                {leadsForSearch.length} total
              </span>
            </div>

            {/* Table takes all remaining page height and scrolls internally */}
            <div className="relative min-h-0 flex-1 overflow-auto bg-slate-100/70">
              <div className="min-h-full bg-white">
                {(() => {
                  const sourceData = sourceGroupedData

                  const leadIdsToShow = new Set(
                    (searchInitialized ? filteredLeads : leadsForSearch).map(
                      (lead) => String(lead._id)
                    )
                  )

                  const currentData = (sourceData || [])
                    .map((group) => ({
                      ...group,
                      leads: (group?.leads || []).filter((lead) =>
                        leadIdsToShow.has(String(lead._id))
                      )
                    }))
                    .filter((group) => group.leads.length > 0)

                  const hasLeads = currentData.some(
                    (group) => group?.leads?.length > 0
                  )

                  if (pageLoading) {
                    return <SkeletonTable />
                  }

                  if (!hasLeads) {
                    return (
                      <div className="flex min-h-[220px] items-center justify-center">
                        <div className="text-center">
                          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                            <span className="text-lg">⌕</span>
                          </div>

                          <p className="text-sm font-semibold text-slate-600">
                            No records found
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Try changing the search or filters.
                          </p>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <>
                      {currentData.map(({ staffName, leads }, index) => (
                        <div
                          key={staffName || `group-${index}`}
                          className="border-b border-slate-100 last:border-b-0"
                        >
                          {staffName && (
                            <div className="sticky top-0 z-10 flex items-center bg-slate-50 px-3 py-1.5">
                              <h3 className="text-xs font-semibold text-slate-700">
                                {staffName}

                                <span className="ml-1.5 font-medium text-slate-400">
                                  ({leads.length} Leads)
                                </span>
                              </h3>
                            </div>
                          )}

                          {/* Keep your existing table exactly unchanged */}
                          {renderTable(leads)}
                        </div>
                      ))}

                      {/* Shows only when rows do not fill the full available height */}
                      <div className="min-h-[110px] border-t border-slate-100 bg-slate-50/60" />
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        </section>
      </main>

      {showhistoryModal && historyList && historyList.length > 0 && (
        <LeadhistoryModal
          selectedLeadId={selectedLeadId}
          historyList={historyList}
          handlecloseModal={handlecloseModal}
        />
      )}

      {paymenthistoryModal && (
        <PaymentHistoryModal
          data={paymentHistoryList}
          selectedLead={selectedCollection}
          isChecked={isChecked}
          isforcefullyclosed={isforcefullyclosed}
          balanceAmount={balanceAmount}
          onClose={setpaymentHistoryModal}
          leadid={leadId}
          setselectedLeadId={setselectedLeadId}
          leadDocId={leadDocId}
          loggedUser={loggedUser}
          refresh={refreshHook}
          setdata={setTableData}
          verifiedLead={verifiedLead}
          isdepartmentisAccountant={isdepartmentisAccountant}
        />
      )}
    </div>
  )
}
