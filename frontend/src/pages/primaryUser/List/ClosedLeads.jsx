import React, { forwardRef, useEffect, useState, useMemo, useCallback, useRef } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
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
  ChevronRight,
  Check
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

const CalendarDateInput = forwardRef(({ value, onClick, ariaLabel }, ref) => (
  <button
    ref={ref}
    type="button"
    onClick={onClick}
    aria-label={ariaLabel}
    className="flex min-w-0 w-full items-center gap-2 rounded-md bg-transparent text-left text-xs font-medium text-slate-700 outline-none transition hover:text-blue-700 focus:ring-2 focus:ring-blue-100"
  >
    <Calendar className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden="true" />
    <span className="min-w-0 flex-1 truncate">{value}</span>
  </button>
))

CalendarDateInput.displayName = "CalendarDateInput"

const getLeadProductNames = (lead) =>
  (Array.isArray(lead?.leadFor) ? lead.leadFor : [])
    .map((leadForItem) => {
      const productOrService =
        leadForItem?.prodproductorServiceId || leadForItem?.productorServiceId

      if (typeof productOrService === "string") {
        return leadForItem?.productorServiceName || ""
      }

      return (
        productOrService?.shortName ||
        leadForItem?.productorServiceId?.productName ||
        productOrService?.productName ||
        productOrService?.serviceName ||
        productOrService?.name ||
        leadForItem?.productorServiceName ||
        ""
      )
    })
    .filter(Boolean)

export default function ClosedLeads() {
  console.log("hh")
  const [showFullName, setShowFullName] = useState(false)
  const [tableData, setTableData] = useState([])
  const [filteredLeads, setFilteredLeads] = useState([])
  const [searchInitialized, setSearchInitialized] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState("all")
  const [isProductFilterOpen, setIsProductFilterOpen] = useState(false)
  const productFilterRef = useRef(null)
  const loadMoreSentinelRef = useRef(null)
  const tableScrollRef = useRef(null)
  const loadingNextPageRef = useRef(false)
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
  const [closedLeadsPage, setClosedLeadsPage] = useState(1)

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
  const selectedreduxbranch = useSelector(
    (branch) => branch.companyBranch.selectedBranch
  )
  console.log(selectedreduxbranch)
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
      endDate: closedDateRange.endDate,
      page: String(closedLeadsPage),
      limit: "50"
    })

    return `/lead/closedleads?${params.toString()}`
  }, [
    selectedreduxbranch,
    closedDateRange.startDate,
    closedDateRange.endDate,
    closedLeadsPage
  ])
  const {
    data: closedleads,
    loading: closedLeadsLoading,
    refreshHook: refreshClosedLeads
  } = UseFetch(closedLeadsUrl, { cacheTime: 30_000 })
  const pageLoading = closedLeadsLoading && closedLeadsPage === 1
  // Product data is only used by the inactive performance drill-down handlers;
  // do not fetch an entire branch catalogue when opening Closed Leads.
  const branchProduct = useMemo(() => [], [])
  console.log(closedleads)

  useEffect(() => {
    const userData = getLocalStorageItem("user")
    if (!userData) return

    setisdepartmentAccountant(userData.department?.code === "DEPARTMENT2")
    setLoggedUser(userData)
    setloggedUserBranches(
      (userData.selected || []).map((branch) => ({
        value: branch.branch_id,
        label: branch.branchName
      }))
    )
  }, [])
  useEffect(() => {
    setClosedLeadsPage(1)
    loadingNextPageRef.current = false
    setTableData([])
    setFilteredLeads([])
    setSearchInitialized(false)
  }, [
    selectedreduxbranch,
    closedDateRange.startDate,
    closedDateRange.endDate
  ])
  const hasNextClosedLeadsPage = Boolean(closedleads?.pagination?.hasNextPage)
  const loadNextClosedLeadsPage = useCallback(() => {
    if (
      !hasNextClosedLeadsPage ||
      closedLeadsLoading ||
      loadingNextPageRef.current
    ) {
      return
    }

    loadingNextPageRef.current = true
    setClosedLeadsPage((page) => page + 1)
  }, [hasNextClosedLeadsPage, closedLeadsLoading])
  const handleClosedLeadsScroll = useCallback(
    (event) => {
      const { scrollTop, clientHeight, scrollHeight } = event.currentTarget
      if (scrollTop + clientHeight >= scrollHeight - 300) {
        loadNextClosedLeadsPage()
      }
    },
    [loadNextClosedLeadsPage]
  )

  useEffect(() => {
    if (!closedLeadsLoading) {
      loadingNextPageRef.current = false
    }
  }, [closedLeadsLoading])

  useEffect(() => {
    const sentinel = loadMoreSentinelRef.current
    if (!sentinel || !hasNextClosedLeadsPage) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadNextClosedLeadsPage()
      },
      { rootMargin: "300px 0px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextClosedLeadsPage, loadNextClosedLeadsPage])
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
    if (!paymenthistoryModal || !selectedLeadId) return

    const selectedLead = closedleads?.closedLeads?.find(
      (item) => item.leadId === selectedLeadId
    )
    if (!selectedLead) return

    setselectedCollection(selectedLead)
    setpaymentHistoryList(selectedLead.paymentHistory || [])
    setBalanceAmount(selectedLead.balanceAmount)
  }, [paymenthistoryModal, closedleads, selectedLeadId])
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
    if (!closedleads?.closedLeads) return

    setTableData((currentGroups) => {
      const currentLeads = currentGroups.flatMap((group) => group?.leads || [])
      const nextLeads =
        closedLeadsPage === 1
          ? closedleads.closedLeads
          : [
              ...currentLeads,
              ...closedleads.closedLeads.filter(
                (lead) =>
                  !currentLeads.some(
                    (currentLead) => String(currentLead._id) === String(lead._id)
                  )
              )
            ]

      return normalizeTableData(nextLeads)
    })
  }, [closedleads, closedLeadsPage])
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
        refreshClosedLeads()
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

  const productOptions = useMemo(() => {
    const products = new Map()

    ;(sourceGroupedData || [])
      .flatMap((group) => group?.leads || [])
      .flatMap(getLeadProductNames)
      .forEach((productName) => {
        const key = productName.trim().toLowerCase()
        if (key && !products.has(key)) products.set(key, productName.trim())
      })

    return [...products.entries()]
      .sort(([, first], [, second]) => first.localeCompare(second))
      .map(([value, label]) => ({ value, label }))
  }, [sourceGroupedData])

  const selectedProductLabel = useMemo(
    () =>
      selectedProduct === "all"
        ? "All Products"
        : productOptions.find((product) => product.value === selectedProduct)
            ?.label || "All Products",
    [productOptions, selectedProduct]
  )

  useEffect(() => {
    const closeProductFilter = (event) => {
      if (!productFilterRef.current?.contains(event.target)) {
        setIsProductFilterOpen(false)
      }
    }

    document.addEventListener("mousedown", closeProductFilter)
    return () => document.removeEventListener("mousedown", closeProductFilter)
  }, [])

  const leadsForSearch = useMemo(() => {
    const leads = (sourceGroupedData || []).flatMap((group) => group?.leads || [])

    if (selectedProduct === "all") return leads

    return leads.filter((lead) =>
      getLeadProductNames(lead).some(
        (productName) => productName.trim().toLowerCase() === selectedProduct
      )
    )
  }, [sourceGroupedData, selectedProduct])

  const handleFilteredLeads = useCallback((leads) => {
    setFilteredLeads(leads)
    setSearchInitialized(true)
  }, [])
  console.log(forcefullyclosedLeads)
  const renderTable = (data) => {
    const LeadRow = ({ item, index }) => {
      const [open, setOpen] = useState(false)
      const isAdditionalService = item?.leadFor?.filter(
        (item) => item.productorservicetype === "Additionalservice"
      )
      let taggedlicense = null
      if (isAdditionalService && isAdditionalService.length) {
        taggedlicense = (isAdditionalService || []).flatMap((item) =>
          (item.taggeddata || []).map((tag) => tag.licensenumber)
        )
      }
      const lastLog = item.activityLog[item.activityLog.length - 1]
      const followupDate = lastLog?.nextFollowUpDate
        ? new Date(lastLog.nextFollowUpDate)
            .toLocaleDateString("en-GB")
            .split("/")
            .join("-")
        : "-"
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
    relative z-40 mx-2 shrink-0 overflow-visible rounded-xl border border-white/60
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

            <div ref={productFilterRef} className="relative min-w-[175px]">
              <button
                type="button"
                onClick={() => setIsProductFilterOpen((open) => !open)}
                aria-expanded={isProductFilterOpen}
                aria-haspopup="listbox"
                className={`group flex h-9 w-full items-center gap-2 rounded-lg border bg-white px-2 text-left shadow-sm transition-all hover:border-slate-300 hover:shadow focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                  isProductFilterOpen
                    ? "border-blue-500 ring-1 ring-blue-500"
                    : "border-slate-200"
                }`}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[10px] font-bold text-blue-600">
                  P
                </span>
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Product
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-slate-700">
                  {selectedProductLabel}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
                    isProductFilterOpen ? "rotate-180 text-blue-600" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>

              {isProductFilterOpen && (
                <div
                  role="listbox"
                  aria-label="Filter closed leads by product"
                  className="absolute right-0 z-50 mt-1.5 w-full min-w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/15"
                >
                  <p className="px-2.5 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Select product
                  </p>
                  <div className="max-h-56 overflow-y-auto pr-0.5">
                    {[{ value: "all", label: "All Products" }, ...productOptions].map(
                      (product) => {
                        const isSelected = selectedProduct === product.value

                        return (
                          <button
                            key={product.value}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setSelectedProduct(product.value)
                              setIsProductFilterOpen(false)
                            }}
                            className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-semibold transition-colors ${
                              isSelected
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                          >
                            <span className="min-w-0 flex-1 truncate">
                              {product.label}
                            </span>
                            {isSelected && (
                              <Check className="h-3.5 w-3.5 shrink-0" />
                            )}
                          </button>
                        )
                      }
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="flex min-w-[10rem] flex-col gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Start date
                </span>
                <span className="flex items-center gap-2">
                  <DatePicker
                    selected={new Date(`${closedDateRange.startDate}T00:00:00`)}
                    maxDate={
                      closedDateRange.endDate
                        ? new Date(`${closedDateRange.endDate}T00:00:00`)
                        : undefined
                    }
                    onChange={(date) =>
                      date &&
                      setClosedDateRange((previous) => ({
                        ...previous,
                        startDate: formatDateForInput(date)
                      }))
                    }
                    dateFormat="dd MMM yyyy"
                    ariaLabel="Closed from date"
                    customInput={<CalendarDateInput ariaLabel="Open closed from date calendar" />}
                    calendarClassName="!rounded-xl !border-slate-200 !font-sans !shadow-xl"
                    popperPlacement="bottom-start"
                  />
                </span>
              </label>
              <label className="flex min-w-[10rem] flex-col gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  End date
                </span>
                <span className="flex items-center gap-2">
                  <DatePicker
                    selected={new Date(`${closedDateRange.endDate}T00:00:00`)}
                    minDate={
                      closedDateRange.startDate
                        ? new Date(`${closedDateRange.startDate}T00:00:00`)
                        : undefined
                    }
                    maxDate={new Date()}
                    onChange={(date) =>
                      date &&
                      setClosedDateRange((previous) => ({
                        ...previous,
                        endDate: formatDateForInput(date)
                      }))
                    }
                    dateFormat="dd MMM yyyy"
                    ariaLabel="Closed to date"
                    customInput={<CalendarDateInput ariaLabel="Open closed to date calendar" />}
                    calendarClassName="!rounded-xl !border-slate-200 !font-sans !shadow-xl"
                    popperPlacement="bottom-start"
                  />
                </span>
              </label>
            </div>

            
          </div>
        </section>
        <section className="relative z-0 flex min-h-0 flex-1 flex-col p-2 md:p-3">
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
            <div
              ref={tableScrollRef}
              onScroll={handleClosedLeadsScroll}
              className="relative min-h-0 flex-1 overflow-auto bg-slate-100/70"
            >
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

                      {closedleads?.pagination?.hasNextPage && (
                        <div
                          ref={loadMoreSentinelRef}
                          className="flex justify-center border-t border-slate-100 bg-slate-50/60 p-3"
                        >
                          <button
                            type="button"
                            disabled={closedLeadsLoading}
                            onClick={loadNextClosedLeadsPage}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {closedLeadsLoading
                              ? "Loading more…"
                              : `Scroll to load more (${leadsForSearch.length} of ${closedleads.pagination.totalRecords})`}
                          </button>
                        </div>
                      )}
                      <div className="min-h-[40px] border-t border-slate-100 bg-slate-50/60" />
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
          refresh={refreshClosedLeads}
          setdata={setTableData}
          verifiedLead={verifiedLead}
          isdepartmentisAccountant={isdepartmentisAccountant}
        />
      )}
    </div>
  )
}
