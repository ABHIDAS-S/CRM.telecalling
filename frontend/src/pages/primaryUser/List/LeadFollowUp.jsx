import { useState, useEffect, useRef } from "react"
import { Pencil } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"

import { useSelector } from "react-redux"
import Breadcrumb from "../../../components/common/Breadcrumb"
import { formatDate } from "../../../utils/dateUtils"
import MyDatePicker from "../../../components/common/MyDatePicker"
import { FaSpinner } from "react-icons/fa"
import { useQuery } from "@tanstack/react-query"
import { LeadhistoryModal } from "../../../components/primaryUser/LeadhistoryModal"
import NoDataAvailable from "../../../components/NodataAvailable"
import { CollectionupdateModal } from "../../../components/primaryUser/CollectionupdateModal"
import { BsFilterLeft } from "react-icons/bs"
import { SearchableSelect } from "../../../components/common/SearchableSelect"
import {
  Eye,
  Phone,
  Mail,
  Package,
  Settings,
  MessageSquareText,
  User,
  Users,
  Calendar,
  Clock,
  UserPlus,
  UserCheck,
  IndianRupee,
  BellRing,
  History,
  ChevronDown,
  ChevronRight,
  X,
  Search
} from "lucide-react"
import BarLoader from "react-spinners/BarLoader"
import AdminHeader from "../../../header/AdminHeader"
import StaffHeader from "../../../header/StaffHeader"
import { getLocalStorageItem } from "../../../helper/localstorage"
import { PerformanceModal } from "../../../components/primaryUser/PerformanceModal"
import api from "../../../api/api"
import SkeletonTable from "../../../components/loader/SkeletonTable"
import { StaticSidebar } from "../../../components/primaryUser/StaticSidebar"
import { toast } from "react-toastify"
import UseFetch from "../../../hooks/useFetch"
import React from "react"

const LeadFollowUp = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const reduxselectedBranch = useSelector(
    (branch) => branch.companyBranch.selectedBranch
  )
  const safeState = location?.state || {}
  const nav = [
    { label: "Lead", path: "" },
    { label: "Lead follow-up", path: "" }
  ]
  const Breadcrumblist = location?.state?.breadcrumb
    ? location?.state?.breadcrumb
    : nav

  const checkedownfollowup = safeState?.ownfollowp //its from


  const [selectedLeadId, setSelectedLeadId] = useState(null)
  const [demoerror, setDemoError] = useState({
    selectStaff: "",
    allocationDate: "",
    demoDescription: ""
  })
  const today = new Date().toISOString().split("T")[0]
  const [selectedUserName, setselecteduserName] = useState(null)
  const [selectedCategory, setselectedCategory] = useState(null)
  const [selectedDatapopup, setselectedDataPopup] = useState({})
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))
  const [periodMode, setperiodMode] = useState("all")
  const [targetData, settargetData] = useState([])
  const [openModal, setOpenModal] = useState(false)
  const [productlist, setproductList] = useState([])
  const [achievedproducts, setacheivedProducts] = useState([])
  const [selectedPeriod, setselectedPeriod] = useState("")

  const [expandedRows, setExpandedRows] = useState(new Set())
  const [selectedData, setselectedData] = useState(null)

  const [collectionData, setcollectionData] = useState({})
  console.log(collectionData)
  const [collectionupdateModal, setcollectionUpdateModal] = useState(false)
  const [partner, setPartner] = useState([])
  const [isdemofollownotClosed, setisdemofollowedNotClosed] = useState(false)
  console.log(isdemofollownotClosed)
  const [ischangeallocationfortask, setischangeallocationfortask] =
    useState(false)
  console.log(ischangeallocationfortask)
  const [ishavePayment, setishavePayment] = useState(false)
  console.log(ishavePayment)
  const [collectionupdatedata, setcollectionupdateData] = useState({})
  console.log(collectionupdatedata)
  const [showfollowupModal, setshowFollowupModal] = useState(false)
  const [isdropdownOpen, setIsdropdownOpen] = useState(false)
  const [taskClosed, setfollowupClosed] = useState(false)
  const [dates, setDates] = useState({ startDate: "", endDate: "" })
  const [editdemoIndex, setdemoEditIndex] = useState(null)
  const [
    editfollowUpDatesandRemarksEditIndex,
    setfollowUpDatesandRemarksEditIndex
  ] = useState(null)

  const [startMonth, setStartMonth] = useState(new Date())
  const [endMonth, setEndMonth] = useState(new Date())
  const [netTotalAmount, setnetTotalAmount] = useState(0)
  const [allocatednetAmount, setallocatednetAmount] = useState(0)
  const [filterOpen, setfilterOpen] = useState(false)
  const [statusAll, setstatusAll] = useState(false)
  const [isAllocated, setIsAllocated] = useState(false)
  const [isOwner, setOwner] = useState(false)
  const [statusAllocated, setstatusAllocated] = useState(false)
  const [pending, setPending] = useState(true)
  console.log(pending)
  const [allocatedLeads, setAllocatedLeads] = useState([])
  const [loader, setLoader] = useState(false)
  const [productwiseloader, setproductwiseloader] = useState(false)
  const [allocationOptions, setAllocationOptions] = useState([])
  const [selectedCompanyBranch, setselectedCompanyBranch] = useState("")
  console.log(selectedCompanyBranch)
  const [isHaveEditchoice, setIsEditable] = useState(false)
  const [selectedDocId, setselectedDocid] = useState(null)
  console.log(selectedDocId)
  const [selectedTab, setselectedTab] = useState("")
  const [hasOwnLeads, setHasownLeads] = useState(false)
  // const result =
  //   safeState?.ownlead
  //     ? true
  //     : safeState?.staffId
  //       ? false
  //       : !!safeState?.ownfollowup ?? true;
  const result = safeState?.ownlead
    ? true
    : safeState?.staffId
      ? false
      : (safeState?.ownfollowup ?? true)
  console.log(safeState)
  console.log(result)
  const [ownFollowUp, setOwnFollowUp] = useState(result)
  console.log(ownFollowUp)
  console.log(safeState?.ownlead)
  console.log(safeState?.ownfollowup)
  console.log(safeState?.staffId)
  console.log(safeState)
  console.log(ownFollowUp)
  console.log(safeState)
  console.log(ownFollowUp)
  console.log(ownFollowUp)
  console.log(safeState?.staffId ? false : true)
  console.log(safeState)
  const [historyList, setHistoryList] = useState([])
  const [loggedUser, setloggedUser] = useState(null)
  const [originalloggeduser, setoriginalloggeduser] = useState(null)
  console.log(originalloggeduser)
  const [loggedUserBranches, setloggedUserBranches] = useState([])
  const [followupDateLoader, setfollowupDateLoader] = useState(false)
  const [input, setInput] = useState("")
  const [followupSearch, setFollowupSearch] = useState("")
  const [showFullRemarks, setShowFullRemarks] = useState("")
  const [errors, setErrors] = useState({})
  const [demosubmitError, setDemofollowersubmitError] = useState({})
  const [showModal, setShowModal] = useState(false)

  const [debouncedValue, setDebouncedValue] = useState("")
  const [followupDateModal, setfollowupDateModal] = useState(false)
  const [showFullName, setShowFullName] = useState(false)
  const [showFullEmail, setShowFullEmail] = useState(false)
  const [selectedLead, setselectedLead] = useState([])
  const dropdownRef = useRef(null)
  const [taskList, settaskList] = useState([])
  const [tableData, setTableData] = useState([])

  const [activeUserId, setActiveUserId] = useState(null)
  // NEW: Track if payment was updated in current session
  const [paymentUpdatedInSession, setPaymentUpdatedInSession] = useState(false)

  const [formData, setFormData] = useState({
    followUpDate: "",
    nextfollowUpDate: "",
    followedId: "",
    followupType: "infollowup",
    Remarks: ""
  })
  console.log(ownFollowUp)
  console.log(pending)
  console.log(checkedownfollowup)

  const [demoData, setDemodata] = useState({
    demoallocatedTo: "",
    demoallocatedDate: "",
    demoDescription: "",
    selectedType: "",
    selectedTypeName: "",
    demoassignedDate: ""
  })
  console.log(demoData)
  const { data: tasks } = UseFetch(`/lead/getallTask?removefollowup=true`)
  console.log(tasks)
  const { data: partners } = UseFetch("/customer/getallpartners")
  const { data: branches } = UseFetch("/branch/getBranch")
  const { data } = UseFetch("/auth/getallUsers")
  const { data: branchProduct } = UseFetch(
    selectedCompanyBranch &&
      `/product/getallbranchProduct?branch=${selectedCompanyBranch}`
  )
  const { data: productwiseResponse, isLoading: productloader } = useQuery({
    queryKey: [
      "productwise-followups",
      safeState?.branchId,
      safeState?.staffId,
      safeState?.productId,
      safeState?.pending,
      dates.startDate,
      dates.endDate,
      safeState?.header
    ],
    enabled:
      safeState?.viewMode === "product" &&
      !!loggedUser &&
      !!safeState?.branchId,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // keep cache 05 minutes
    queryFn: async () => {
      const res = await api.get(
        `/lead/getallLeadFollowUpforselectedProduct?branchSelected=${safeState.branchId}` +
          `&loggeduserid=${safeState.staffId}` +
          `&role=${loggedUser.role}` +
          `&pendingfollowup=${safeState.pending}` +
          `&selectedproductId=${safeState.productId}` +
          `&startDate=${dates.startDate}` +
          `&endDate=${dates.endDate}` +
          `&viewmode=${safeState.viewMode}` +
          `&header=${safeState.header}`
      )

      return res.data
    }
  })
  console.log(dates)
  console.log(tasks)
  useEffect(() => {
    if (tasks) {
      const updatedTasks = tasks.map((task) => ({
        ...task,
        taskName: task.taskName.toUpperCase()
      }))
      console.log(updatedTasks)
      settaskList(updatedTasks)
    }
  }, [tasks])
  useEffect(() => {
    if (!productwiseResponse?.followupLeads) return

    const productwisedata = productwiseResponse.followupLeads

    // keep all your existing processing code here
  }, [productwiseResponse, pending, ownFollowUp, loggedUser, dates.endDate])
  console.log(selectedCompanyBranch)
  console.log(pending)
  // console.log((ownFollowUp && pending) || (checkedownfollowup &&pending))
  // [Keep all your existing useEffect hooks here - they remain the same]
  // ... (all the existing useEffect hooks from line 92 to line 600+)
  console.log(ownFollowUp)
  console.log(pending)
  useEffect(() => {
    if (selectedCategory) {
      console.log("jj")
      const Datas = targetData?.userWiseResults
      console.log(selectedCategory)
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
      console.log(Datas)

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
  console.log(safeState?.viewMode !== "product")
  console.log(safeState?.viewMode !== "product" || !loggedUser)
  console.log(safeState?.viewMode)

  useEffect(() => {
    if (safeState?.viewMode !== "product" || !loggedUser) return

    setselectedCompanyBranch(safeState.branchId)
    console.log("hh")
    setPending(safeState.pending)

    setOwnFollowUp(safeState.staffId?.toString() === loggedUser._id?.toString())
  }, [safeState, loggedUser])
  useEffect(() => {
    if (safeState?.viewMode !== "product") return
    if (!productwiseResponse?.followupLeads) return
    if (!loggedUser) return

    const productwisedata = productwiseResponse.followupLeads

    const filteredLeads = productwisedata.filter((lead) => {
      const followupAllocations =
        lead.activityLog?.filter(
          (log) =>
            log.taskTo === "followup" &&
            log.taskallocatedTo &&
            log.allocationChanged === false
        ) || []

      if (!followupAllocations.length) return false

      const lastFollowupAllocation =
        followupAllocations[followupAllocations.length - 1]

      return (
        lastFollowupAllocation?.taskallocatedTo?._id?.toString() ===
        safeState?.staffId?.toString()
      )
    })

    if (!filteredLeads.length || !dates.endDate) {
      setTableData([])
      setAllocatedLeads([])
      setnetTotalAmount(0)
      return
    }

    // ==========================================
    // TOTAL LEADS
    // ==========================================

    if (safeState?.header === "Total Leads") {
      const groupedLeads = {}

      filteredLeads.forEach((lead) => {
        const assignedTo = lead?.allocatedTo?.name || "Unassigned"

        if (!groupedLeads[assignedTo]) {
          groupedLeads[assignedTo] = []
        }

        groupedLeads[assignedTo].push(lead)
      })
      console.log(groupedLeads)
      setnetTotalAmount(TotalAmount(filteredLeads))
      setTableData(normalizeTableData(groupedLeads))
      return
    }

    // ==========================================
    // PENDING + OWN FOLLOWUP
    // ==========================================

    if (pending && ownFollowUp) {
      const ownFollow = filteredLeads.filter((lead) =>
        lead.activityLog?.some(
          (log) =>
            log.taskTo === "followup" &&
            log.taskallocatedTo?._id === loggedUser._id &&
            log.followupClosed === false &&
            log.allocationChanged === false
        )
      )

      const currentDate = new Date()
      const endDateLocal = getLocalDate(new Date(dates.endDate))

      const fulldatecurrent =
        formatdate(currentDate) === endDateLocal
          ? formatdate(currentDate)
          : endDateLocal

      const neverfollowupedLeads = ownFollow.filter(
        (lead) => lead.neverfollowuped && lead.allocatedfollowup === false
      )

      const havenextFollowup = ownFollow.filter((lead) => lead.Nextfollowup)

      const filteredcurrentdatefollowupLeads = havenextFollowup.filter(
        (lead) => formatdate(lead.nextFollowUpDate) === fulldatecurrent
      )

      const iscurrent =
        fulldatecurrent === endDateLocal ? fulldatecurrent : endDateLocal

      const overdueFollowups = havenextFollowup.filter(
        (lead) => formatdate(lead.nextFollowUpDate) < iscurrent
      )

      const postdatefollowup = havenextFollowup.filter(
        (lead) => formatdate(lead.nextFollowUpDate) > iscurrent
      )

      const uniqueoverdueAndcurrentdate = [
        ...new Set([...overdueFollowups, ...filteredcurrentdatefollowupLeads])
      ]

      const taskSubmittedLeads = ownFollow.filter(
        (lead) => lead.allocatedfollowup && lead.allocatedTaskClosed
      )

      const nonsubmittedtakleads = ownFollow.filter(
        (lead) => lead.allocatedfollowup && lead.allocatedTaskClosed === false
      )

      setAllocatedLeads(normalizeTableData(nonsubmittedtakleads))

      const mergedall = ownFollow.filter(
        (lead) => lead.taskfromFollowup === false
      )
      console.log(mergedall)
      setnetTotalAmount(TotalAmount(mergedall))
      setTableData(normalizeTableData(mergedall))

      return
    }

    // ==========================================
    // PENDING + COLLEAGUE FOLLOWUP
    // ==========================================

    if (pending && !ownFollowUp) {
      const currentDate = new Date()
      const endDateLocal = getLocalDate(new Date(dates.endDate))

      const fulldatecurrent =
        formatdate(currentDate) === endDateLocal
          ? formatdate(currentDate)
          : endDateLocal

      const neverfollowupedLeads = filteredLeads.filter(
        (lead) => lead.neverfollowuped
      )

      const havenextFollowup = filteredLeads.filter((lead) => lead.Nextfollowup)

      const filteredcurrentdatefollowupLeads = havenextFollowup.filter(
        (lead) => formatdate(lead.nextFollowUpDate) === fulldatecurrent
      )

      const iscurrent =
        fulldatecurrent === endDateLocal ? fulldatecurrent : endDateLocal

      const overdueFollowups = havenextFollowup.filter(
        (lead) => formatdate(lead.nextFollowUpDate) < iscurrent
      )

      const postdatefollowup = havenextFollowup.filter(
        (lead) => formatdate(lead.nextFollowUpDate) > iscurrent
      )

      const uniqueoverdueAndcurrentdate = [
        ...new Set([...overdueFollowups, ...filteredcurrentdatefollowupLeads])
      ]

      const taskSubmittedLeads = filteredLeads.filter(
        (lead) => lead.allocatedfollowup && lead.allocatedTaskClosed
      )

      const nonsubmittedtakleads = filteredLeads.filter(
        (lead) => lead.allocatedfollowup && lead.allocatedTaskClosed === false
      )

      setAllocatedLeads(nonsubmittedtakleads)

      const mergedall = filteredLeads.filter(
        (lead) => lead.taskfromFollowup === false
      )

      const groupedLeads = {}

      mergedall.forEach((lead) => {
        const assignedTo = lead?.allocatedTo?.name || "Unassigned"

        if (!groupedLeads[assignedTo]) {
          groupedLeads[assignedTo] = []
        }

        groupedLeads[assignedTo].push(lead)
      })
      console.log(groupedLeads)
      setnetTotalAmount(TotalAmount(mergedall))
      setTableData(normalizeTableData(groupedLeads))

      return
    }

    // ==========================================
    // CLEARED OWN FOLLOWUP
    // ==========================================

    if (!pending && ownFollowUp) {
      const ownFollow = filteredLeads.filter((lead) =>
        lead.activityLog?.some(
          (log) =>
            log.taskTo === "followup" &&
            log.taskallocatedTo?._id === loggedUser._id &&
            log.followupClosed === true
        )
      )

      const clearedLeads = ownFollow.filter(
        (lead) =>
          Array.isArray(lead.activityLog) &&
          lead.activityLog.some(
            (entry) =>
              entry.taskBy?.taskName?.trim() === "Follow-Up Closing" &&
              entry.followupClosed === true &&
              entry.submissionDate
          )
      )
      console.log(clearedLeads)
      setnetTotalAmount(TotalAmount(clearedLeads))
      setTableData(normalizeTableData(clearedLeads))

      return
    }

    // ==========================================
    // CLEARED COLLEAGUE FOLLOWUP
    // ==========================================

    if (!pending && !ownFollowUp) {
      const isFollowupActivity = (log) =>
        log?.taskBy?.taskName?.trim() === "Follow-Up Closing" &&
        log?.followupClosed === true &&
        log?.submissionDate

      const getLatestSubmissionDate = (lead) => {
        const datesArr = (lead.activityLog || [])
          .filter(isFollowupActivity)
          .map((log) => new Date(log.submissionDate).getTime())

        return datesArr.length ? Math.max(...datesArr) : null
      }

      const clearedLeads = []

      filteredLeads.forEach((lead) => {
        const latest = getLatestSubmissionDate(lead)

        if (latest) {
          clearedLeads.push({
            ...lead,
            latestSubmissionTime: latest
          })
        }
      })

      clearedLeads.sort(
        (a, b) => b.latestSubmissionTime - a.latestSubmissionTime
      )

      const groupedLeads = {}

      clearedLeads.forEach((lead) => {
        const assignedTo = lead?.allocatedTo?.name || "Unassigned"

        if (!groupedLeads[assignedTo]) {
          groupedLeads[assignedTo] = []
        }

        groupedLeads[assignedTo].push(lead)
      })
      console.log(groupedLeads)
      setnetTotalAmount(TotalAmount(clearedLeads))
      setTableData(normalizeTableData(groupedLeads))
    }

    setHasownLeads(productwiseResponse?.ischekCollegueLeads)
  }, [
    productwiseResponse,
    pending,
    ownFollowUp,
    loggedUser,
    dates.endDate,
    safeState
  ])
  // const {
  //   data: productwiseResponse,
  //   isLoading: productwiseLoader,
  //   refetch: refetchProductFollowups,
  // } = useQuery({
  //   queryKey: [
  //     "product-followups",
  //     safeState?.branchId,
  //     safeState?.staffId,
  //     safeState?.productId,
  //     pending,
  //     dates.startDate,
  //     dates.endDate,
  //     safeState?.header,
  //     safeState?.viewMode,
  //   ],
  //   queryFn: async () => {
  //     const res = await api.get(
  //       `/lead/getallLeadFollowUpforselectedProduct?branchSelected=${safeState?.branchId}` +
  //         `&loggeduserid=${safeState?.staffId}` +
  //         `&role=${loggedUser.role}` +
  //         `&pendingfollowup=${pending}` +
  //         `&selectedproductId=${safeState?.productId}` +
  //         `&startDate=${dates.startDate}` +
  //         `&endDate=${dates.endDate}` +
  //         `&viewmode=${safeState?.viewMode}` +
  //         `&header=${safeState?.header}`
  //     );

  //     return res.data;
  //   },
  //   enabled:
  //     !!safeState?.branchId &&
  //     !!safeState?.staffId &&
  //     !!safeState?.productId &&
  //     !!loggedUser,
  // });
  // useEffect(() => {
  //   // run only when location.state or selectedCompanyBranch / loggedUser change
  //   //this from productwisereport
  //   if (safeState?.viewMode !== "product" || !loggedUser) return
  //   console.log("HHH")
  //   const selectedbranch = safeState?.branchId

  //     const fulldatecurrent =
  //       formatdate(currentDate) === endDateLocal
  //         ? formatdate(currentDate)
  //         : endDateLocal;

  //     const neverfollowupedLeads = ownFollow.filter(
  //       (lead) =>
  //         lead.neverfollowuped &&
  //         lead.allocatedfollowup === false
  //     );

  //     const havenextFollowup = ownFollow.filter(
  //       (lead) => lead.Nextfollowup
  //     );

  //     const filteredcurrentdatefollowupLeads =
  //       havenextFollowup.filter(
  //         (lead) =>
  //           formatdate(lead.nextFollowUpDate) ===
  //           fulldatecurrent
  //       );

  //     const iscurrent =
  //       fulldatecurrent === endDateLocal
  //         ? fulldatecurrent
  //         : endDateLocal;

  //     const overdueFollowups = havenextFollowup.filter(
  //       (lead) =>
  //         formatdate(lead.nextFollowUpDate) < iscurrent
  //     );

  //     const postdatefollowup = havenextFollowup.filter(
  //       (lead) =>
  //         formatdate(lead.nextFollowUpDate) > iscurrent
  //     );

  //     const uniqueoverdueAndcurrentdate = [
  //       ...new Set([
  //         ...overdueFollowups,
  //         ...filteredcurrentdatefollowupLeads,
  //       ]),
  //     ];

  //     const taskSubmittedLeads = ownFollow.filter(
  //       (lead) =>
  //         lead.allocatedfollowup &&
  //         lead.allocatedTaskClosed
  //     );

  //     const nonsubmittedtakleads = ownFollow.filter(
  //       (lead) =>
  //         lead.allocatedfollowup &&
  //         lead.allocatedTaskClosed === false
  //     );

  //     setAllocatedLeads(
  //       normalizeTableData(nonsubmittedtakleads)
  //     );

  //     const mergedall = [
  //       ...neverfollowupedLeads,
  //       ...uniqueoverdueAndcurrentdate,
  //       ...postdatefollowup,
  //       ...(safeState?.viewMode ? [] : taskSubmittedLeads),
  //     ];

  //     setnetTotalAmount(TotalAmount(mergedall));
  //     setTableData(normalizeTableData(mergedall));

  //     return;
  //   }

  //   // ==========================================
  //   // PENDING + COLLEAGUE FOLLOWUP
  //   // ==========================================

  //   if (pending && !ownFollowUp) {
  //     const currentDate = new Date();
  //     const endDateLocal = getLocalDate(new Date(dates.endDate));

  //     const fulldatecurrent =
  //       formatdate(currentDate) === endDateLocal
  //         ? formatdate(currentDate)
  //         : endDateLocal;

  //     const neverfollowupedLeads = filteredLeads.filter(
  //       (lead) => lead.neverfollowuped
  //     );

  //     const havenextFollowup = filteredLeads.filter(
  //       (lead) => lead.Nextfollowup
  //     );

  //     const filteredcurrentdatefollowupLeads =
  //       havenextFollowup.filter(
  //         (lead) =>
  //           formatdate(lead.nextFollowUpDate) ===
  //           fulldatecurrent
  //       );

  //     const iscurrent =
  //       fulldatecurrent === endDateLocal
  //         ? fulldatecurrent
  //         : endDateLocal;

  //     const overdueFollowups = havenextFollowup.filter(
  //       (lead) =>
  //         formatdate(lead.nextFollowUpDate) < iscurrent
  //     );

  //     const postdatefollowup = havenextFollowup.filter(
  //       (lead) =>
  //         formatdate(lead.nextFollowUpDate) > iscurrent
  //     );

  //     const uniqueoverdueAndcurrentdate = [
  //       ...new Set([
  //         ...overdueFollowups,
  //         ...filteredcurrentdatefollowupLeads,
  //       ]),
  //     ];

  //     const taskSubmittedLeads = filteredLeads.filter(
  //       (lead) =>
  //         lead.allocatedfollowup &&
  //         lead.allocatedTaskClosed
  //     );

  //     const nonsubmittedtakleads = filteredLeads.filter(
  //       (lead) =>
  //         lead.allocatedfollowup &&
  //         lead.allocatedTaskClosed === false
  //     );

  //     setAllocatedLeads(nonsubmittedtakleads);

  //     const mergedall = [
  //       ...neverfollowupedLeads,
  //       ...uniqueoverdueAndcurrentdate,
  //       ...postdatefollowup,
  //       ...(safeState?.viewMode ? [] : taskSubmittedLeads),
  //     ];

  //     const groupedLeads = {};

  //     mergedall.forEach((lead) => {
  //       const assignedTo =
  //         lead?.allocatedTo?.name || "Unassigned";

  //       if (!groupedLeads[assignedTo]) {
  //         groupedLeads[assignedTo] = [];
  //       }

  //       groupedLeads[assignedTo].push(lead);
  //     });

  //     setnetTotalAmount(TotalAmount(mergedall));
  //     setTableData(normalizeTableData(groupedLeads));

  //     return;
  //   }

  //   // ==========================================
  //   // CLEARED OWN FOLLOWUP
  //   // ==========================================

  //   if (!pending && ownFollowUp) {
  //     const ownFollow = filteredLeads.filter((lead) =>
  //       lead.activityLog?.some(
  //         (log) =>
  //           log.taskTo === "followup" &&
  //           log.taskallocatedTo?._id === loggedUser._id &&
  //           log.followupClosed === true
  //       )
  //     );

  //     const clearedLeads = ownFollow.filter(
  //       (lead) =>
  //         Array.isArray(lead.activityLog) &&
  //         lead.activityLog.some(
  //           (entry) =>
  //             entry.taskTo === "followup" &&
  //             entry.followupClosed === true
  //         )
  //     );

  //     setnetTotalAmount(TotalAmount(clearedLeads));
  //     setTableData(normalizeTableData(clearedLeads));

  //     return;
  //   }

  //   // ==========================================
  //   // CLEARED COLLEAGUE FOLLOWUP
  //   // ==========================================

  //   if (!pending && !ownFollowUp) {
  //     const isFollowupActivity = (log) =>
  //       log?.taskId?.taskName === "Followup" &&
  //       log?.followupClosed === true &&
  //       log?.submissionDate;

  //     const getLatestSubmissionDate = (lead) => {
  //       const datesArr = (lead.activityLog || [])
  //         .filter(isFollowupActivity)
  //         .map((log) =>
  //           new Date(log.submissionDate).getTime()
  //         );

  //       return datesArr.length
  //         ? Math.max(...datesArr)
  //         : null;
  //     };

  //     const clearedLeads = [];

  //     filteredLeads.forEach((lead) => {
  //       const latest = getLatestSubmissionDate(lead);

  //       if (latest) {
  //         clearedLeads.push({
  //           ...lead,
  //           latestSubmissionTime: latest,
  //         });
  //       }
  //     });

  //     clearedLeads.sort(
  //       (a, b) =>
  //         b.latestSubmissionTime -
  //         a.latestSubmissionTime
  //     );

  //     const groupedLeads = {};

  //     clearedLeads.forEach((lead) => {
  //       const assignedTo =
  //         lead?.allocatedTo?.name || "Unassigned";

  //       if (!groupedLeads[assignedTo]) {
  //         groupedLeads[assignedTo] = [];
  //       }

  //       groupedLeads[assignedTo].push(lead);
  //     });

  //     setnetTotalAmount(TotalAmount(clearedLeads));
  //     setTableData(normalizeTableData(groupedLeads));
  //   }

  //   setHasownLeads(
  //     productwiseResponse?.ischekCollegueLeads
  //   );

  // }, [
  //   productwiseResponse,
  //   pending,
  //   ownFollowUp,
  //   loggedUser,
  //   dates.endDate,
  //   safeState,
  // ]);

  useEffect(() => {
    // run only when location.state or selectedCompanyBranch / loggedUser change
    //this from productwisereport
    if (safeState?.viewMode !== "product" || !loggedUser) return
    console.log("HHH")
    const selectedbranch = safeState?.branchId

    setselectedCompanyBranch(selectedbranch)
    const fetchFollowups = async () => {
      console.log("hhhh")
      const staffIdFromState = location.state.staffId
      const pendingFromState = location.state.pending
      // console.log(location.state.istotal)
      // console.log(pendingFromState)
      const selectedproductId = location.state.productId
      console.log(location.state)
      // console.log(staffIdFromState)
      // console.log(selectedproductId)
      // console.log(pendingFromState)
      setPending(pendingFromState)
      // keep full loggedUser object, just compare ids
      setOwnFollowUp(staffIdFromState === loggedUser._id)
      console.log(staffIdFromState === loggedUser._id)
      setproductwiseloader(true)
      try {
        const res = await api.get(
          `/lead/getallLeadFollowUpforselectedProduct?branchSelected=${selectedbranch}` +
            `&loggeduserid=${staffIdFromState}` +
            `&role=${loggedUser.role}` +
            `&pendingfollowup=${pendingFromState}` +
            `&selectedproductId=${selectedproductId}` +
            `&startDate=${safeState?.viewMode ? dates.startDate : null}` +
            `&endDate=${safeState?.viewMode ? dates.endDate : null}` +
            `&viewmode=${safeState?.viewMode}` +
            `&header=${safeState?.header}`
        )
        console.log(res.data)
        // console.log(res.data.followupLeads)
        const productwisedata = res.data.followupLeads
        console.log(productwisedata)
        const a = productwisedata.map((item) => item.leadId)
        console.log(a)
        const filteredLeads = productwisedata.filter((lead) => {
          // 1️⃣ Get only followup allocation logs
          const followupAllocations = lead.activityLog.filter(
            (log) =>
              log.taskTo === "followup" &&
              log.taskallocatedTo && // must exist
              log.allocationChanged === false
          )

          // 2️⃣ If no followup allocations → skip
          if (followupAllocations.length === 0) return false

          // 3️⃣ Take LAST followup allocation
          const lastFollowupAllocation =
            followupAllocations[followupAllocations.length - 1]
          console.log(lastFollowupAllocation)
          // 4️⃣ Match with user
          return lastFollowupAllocation
          return (
            lastFollowupAllocation.taskallocatedTo?._id.toString() ===
            safeState?.staffId?.toString()
          )
        })
        console.log(filteredLeads)
        if (
          filteredLeads &&
          filteredLeads.length &&
          dates.endDate &&
          loggedUser
        ) {
          if (safeState?.header === "Total Leads") {
            const groupedLeads = {}
            let grandTotal = 0
            filteredLeads.forEach((lead) => {
              const assignedTo = lead?.allocatedTo?.name
              const amount = lead?.netAmount || 0
              grandTotal += amount
              if (!groupedLeads[assignedTo]) {
                groupedLeads[assignedTo] = []
              }
              groupedLeads[assignedTo].push(lead)
            })
            const groupedData = normalizeTableData(groupedLeads)
            // console.log(groupedData)
            setnetTotalAmount(TotalAmount(filteredLeads))
            console.log(groupedData)
            setTableData(groupedData)
          } else {
            if (pending && ownFollowUp) {
              console.log("hhhhh")
              const ownFollow = filteredLeads.filter((lead) =>
                lead.activityLog?.some(
                  (log) =>
                    log.taskTo === "followup" &&
                    log.taskallocatedTo?._id === loggedUser._id &&
                    log.followupClosed === false &&
                    log.allocationChanged === false
                )
              )

              const currentDate = new Date()
              const endDateLocal = getLocalDate(new Date(dates.endDate))
              formatdate(currentDate)
              const fulldatecurrent =
                formatdate(currentDate) === endDateLocal
                  ? // formatdate(dates.endDate)
                    formatdate(currentDate)
                  : endDateLocal
              const neverfollowupedLeads = ownFollow.filter(
                (lead) =>
                  lead.neverfollowuped && lead.allocatedfollowup == false
              )
              const havenextFollowup = ownFollow.filter(
                (lead) => lead.Nextfollowup
              )
              const filteredcurrentdatefollowupLeads = havenextFollowup.filter(
                (lead) => formatdate(lead.nextFollowUpDate) === fulldatecurrent
              )
              const iscurrent =
                fulldatecurrent === endDateLocal
                  ? fulldatecurrent
                  : endDateLocal
              const overdueFollowups = havenextFollowup.filter(
                (lead) => formatdate(lead.nextFollowUpDate) < iscurrent
              )
              const postdatefollowup = havenextFollowup.filter(
                (lead) => formatdate(lead.nextFollowUpDate) > iscurrent
              )
              const uniqueoverdueAndcurrentdate = [
                ...new Set([
                  ...overdueFollowups,
                  ...filteredcurrentdatefollowupLeads
                ])
              ]
              const taskSubmittedLeads = ownFollow.filter(
                (lead) => lead.allocatedfollowup && lead.allocatedTaskClosed
              )
              // console.log(ownFollow)
              const nonsubmittedtakleads = ownFollow.filter(
                (lead) =>
                  lead.allocatedfollowup && lead.allocatedTaskClosed === false
              )
              const allocatedData = normalizeTableData(nonsubmittedtakleads)
              setAllocatedLeads(allocatedData)

              const mergedall = ownFollow.filter(
                (lead) => lead.taskfromFollowup === false
              )
              console.log(mergedall)
              const Data = normalizeTableData(mergedall)
              // then store it in state
              setnetTotalAmount(TotalAmount(mergedall))
              // console.log(Data)
              // mergedall.forEach((item)=>)

              setTableData(Data)
            } else if (pending && !ownFollowUp) {
              console.log("h")
              const currentDate = new Date()
              const endDateLocal = getLocalDate(new Date(dates.endDate))
              formatdate(currentDate)
              const fulldatecurrent =
                formatdate(currentDate) === endDateLocal
                  ? // formatdate(dates.endDate)
                    formatdate(currentDate)
                  : endDateLocal
              const neverfollowupedLeads = filteredLeads.filter(
                (lead) => lead.neverfollowuped
              )

              const havenextFollowup = filteredLeads.filter(
                (lead) => lead.Nextfollowup
              )
              console.log(havenextFollowup)
              const filteredcurrentdatefollowupLeads = havenextFollowup.filter(
                (lead) => formatdate(lead.nextFollowUpDate) === fulldatecurrent
              )
              console.log(filteredcurrentdatefollowupLeads)

              const iscurrent =
                fulldatecurrent === endDateLocal
                  ? fulldatecurrent
                  : endDateLocal
              const overdueFollowups = havenextFollowup.filter(
                (lead) => formatdate(lead.nextFollowUpDate) < iscurrent
              )
              const postdatefollowup = havenextFollowup.filter(
                (lead) => formatdate(lead.nextFollowUpDate) > iscurrent
              )
              const uniqueoverdueAndcurrentdate = [
                ...new Set([
                  ...overdueFollowups,
                  ...filteredcurrentdatefollowupLeads
                ])
              ]

              const taskSubmittedLeads = filteredLeads.filter(
                (lead) => lead.allocatedfollowup && lead.allocatedTaskClosed
              )
              const nonsubmittedtakleads = productwisedata.filter(
                (lead) =>
                  lead.allocatedfollowup && lead.allocatedTaskClosed === false
              )
              setAllocatedLeads(nonsubmittedtakleads)
              console.log(neverfollowupedLeads)
              console.log(uniqueoverdueAndcurrentdate)
              console.log(postdatefollowup)
              console.log(safeState?.viewMode ? [] : taskSubmittedLeads)
              const mergedall = filteredLeads.filter(
                (lead) => lead.taskfromFollowup === false
              )
              const groupedLeads = {}
              let grandTotal = 0
              mergedall.forEach((lead) => {
                const assignedTo = lead?.allocatedTo?.name
                const amount = lead?.netAmount || 0
                grandTotal += amount
                if (!groupedLeads[assignedTo]) {
                  groupedLeads[assignedTo] = []
                }
                groupedLeads[assignedTo].push(lead)
              })
              const groupedData = normalizeTableData(groupedLeads)

              setnetTotalAmount(TotalAmount(mergedall))
              setTableData(groupedData)
              console.log(groupedData)
            } else if (!pending && ownFollowUp) {
              console.log("h")
              const ownFollow = filteredLeads.filter((lead) =>
                lead.activityLog?.some(
                  (log) =>
                    log.taskTo === "followup" &&
                    log.taskallocatedTo._id === loggedUser._id &&
                    log.followupClosed === true
                )
              )
              // console.log(ownFollow)
              const clearedLeads = ownFollow.filter(
                (lead) =>
                  Array.isArray(lead.activityLog) &&
                  lead.activityLog.some(
                    (entry) =>
                      entry.taskBy?.taskName?.trim() === "Follow-Up Closing" &&
                      entry.followupClosed === true &&
                      entry.submissionDate
                  )
              )
              // console.log(clearedLeads)

              // then store it in state
              setnetTotalAmount(TotalAmount(clearedLeads))
              const Data = normalizeTableData(clearedLeads)
              console.log(Data)
              setTableData(Data)
            } else if (!pending && !ownFollowUp) {
              console.log("H")

              // console.log(productwisedata)
              // helpers
              const isFollowupActivity = (log) =>
                log?.taskBy?.taskName?.trim() === "Follow-Up Closing" &&
                log?.followupClosed === true &&
                log?.submissionDate

              const getLatestSubmissionDate = (lead) => {
                console.log(lead)
                const dates = (lead.activityLog || [])
                  .filter(isFollowupActivity)
                  .map((log) => new Date(log.submissionDate).getTime())
                if (!dates.length) return null
                return Math.max(...dates) // latest
              }

              const followupLeads = filteredLeads || []
              const clearedLeads = []
              console.log(followupLeads)
              followupLeads.forEach((lead) => {
                const latest = getLatestSubmissionDate(lead)
                console.log(latest)
                if (latest) {
                  // cleared
                  clearedLeads.push({ ...lead, latestSubmissionTime: latest })
                }
              })

              // sort cleared leads: latest cleared first
              clearedLeads.sort(
                (a, b) => b.latestSubmissionTime - a.latestSubmissionTime
              )
              console.log(clearedLeads)
              // optional: group by allocatedTo
              const groupedLeads = {}
              let grandTotal = 0
              clearedLeads.forEach((lead) => {
                const assignedTo = lead?.allocatedTo?.name || "Unassigned"
                const amount = lead?.netAmount || 0
                grandTotal += amount
                if (!groupedLeads[assignedTo]) groupedLeads[assignedTo] = []
                groupedLeads[assignedTo].push(lead)
              })
              const groupedData = normalizeTableData(groupedLeads)
              console.log(groupedData)
              // console.log(groupedData)
              // then store it in state
              setnetTotalAmount(TotalAmount(clearedLeads))
              setTableData(groupedData)
            }
          }

          setHasownLeads(filteredLeads?.ischekCollegueLeads)
        }

        console.log("hh")
        setproductwiseloader(false)
        // console.log(pending)
        // console.log(ownFollowUp)
        // console.log(res.data.followupLeads.length)
        // handle res.data here (set state, etc.)
      } catch (err) {
        console.error(err)
      }
    }
    console.log("hhh")
    fetchFollowups()
  }, [safeState?.state, selectedCompanyBranch, loggedUser])

  console.log(pending)
  console.log(ownFollowUp)

  const handletoogle = (status) => {
    if (!safeState.branchId) return

    setselectedCompanyBranch(safeState.branchId)

    const pendingorcleared = !status

    setPending(pendingorcleared)

    setOwnFollowUp(safeState?.staffId === loggedUser?._id)
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

  // const shouldFetch =
  //   (safeState.istotal &&
  //   safeState.staffId &&
  //   safeState.viewMode !== "product" )
  //   loggedUser &&
  //   selectedCompanyBranch
  // console.log(safeState.istotal)
  console.log(safeState)
  const shouldFetch =
    !!loggedUser &&
    !!reduxselectedBranch &&
    ((safeState?.viewMode !== "product" &&
      safeState?.istotal &&
      !!safeState?.staffId) ||
      safeState?.staffId == null) &&
    pending !== undefined
  console.log(shouldFetch)
  console.log(!!loggedUser)
  console.log(!!safeState.istotal)
  console.log(safeState?.staffId)

  const finalPending = pending !== undefined ? pending : safeState?.pending

  // const followupUrl =
  //   shouldFetch
  //     ? `/lead/getallLeadFollowUp?branchSelected=${selectedCompanyBranch}` +
  //       `&loggeduserid=${safeState.istotal ? safeState.staffId : loggedUser._id}` +
  //       `&role=${safeState.istotal ? safeState.staffRole : loggedUser.role}` +
  //       `&pendingfollowup=${finalPending}` +
  //       `&viewmode=${safeState?.viewMode ? "true" : null}` +
  //       `&startDate=${safeState?.viewMode ? dates.startDate : null}` +
  //       `&endDate=${safeState?.viewMode ? dates.endDate : null}` +
  //       `&header=${safeState?.header}` +
  //       `&from=${safeState?.from ?? null}`
  //     : null;
  console.log(shouldFetch)
  const followupUrl = shouldFetch
    ? `/lead/getallLeadFollowUp?branchSelected=${reduxselectedBranch}` +
      `&loggeduserid=${safeState.istotal ? safeState.staffId : loggedUser._id}` +
      `&role=${safeState.istotal ? safeState.staffRole : loggedUser.role}` +
      `&pendingfollowup=${finalPending}` +
      `${safeState?.viewMode ? `&viewmode=true` : ""}` +
      // `&startDate=${safeState?.viewMode ? dates.startDate : null}` +
      // `&endDate=${safeState?.viewMode ? dates.endDate : null}` +
      `&startDate=${safeState?.viewMode || pending === false ? dates.startDate : null}` +
      `&endDate=${safeState?.viewMode || pending === false ? dates.endDate : null}` +
      `${safeState?.header ? `&header=${safeState.header}` : ""}` +
      `${safeState?.from ? `&from=${safeState.from}` : ""}`
    : null
  console.log(dates)
  console.log(safeState)
  console.log(followupUrl)
  // '/lead/getallLeadFollowUp?branchSelected=66f7b26c1e7129afd9aee189&loggeduserid=67220ce51c400b86242fe178&role=undefined&pendingfollowup=true&viewmode=true&startDate=2026-07-01&endDate=2026-07-31&header=Total Leads&from=followupReport'

  const isQueryReady = Boolean(followupUrl)
  const {
    data: loggedusersallocatedleads,
    isLoading: loading,
    isPending,
    isFetching,
    isError,
    error,
    refetch: refreshHook
  } = useQuery({
    queryKey: [
      "followups",
      reduxselectedBranch,
      safeState?.staffId || "",
      finalPending,
      dates.startDate || "",
      dates.endDate || "",
      safeState?.header || "",
      safeState?.from || ""
    ],
    queryFn: async () => {
      const res = await api.get(followupUrl)
      console.log(res)
      return res.data?.data
    },
    enabled: isQueryReady,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // keep cache 05 minutes

    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false
  })
  const showInitialSkeleton =
    !isQueryReady || isPending || (isFetching && !loggedusersallocatedleads)
  console.log(showInitialSkeleton)
  console.log(loggedusersallocatedleads)
  // console.log(url)
  console.log(loggedusersallocatedleads?.followupLeads?.length)

  // Initial loggedUser + branches from dashboard
  useEffect(() => {
    if (!safeState.branchId || !branches || !data) return
    console.log(safeState.branchId)
    console.log(safeState)
    console.log("Hhh")
    const { allusers = [], allAdmins = [] } = data
    const mergeduser = [...allusers, ...allAdmins]
    if (safeState.staffId) {
      const filtereduser = mergeduser.find(
        (item) => item._id === safeState.staffId
      )
      if (filtereduser) {
        setloggedUser(filtereduser)
      }
    }
    setselectedCompanyBranch(safeState.branchId)
    const loggeduserbranchesinproductwise = branches
      .filter((branch) => safeState.branchId === branch._id)
      .map((branch) => ({
        value: branch._id,
        label: branch.branchName
      }))
    setPending(safeState.pending ?? pending)
    setloggedUserBranches(loggeduserbranchesinproductwise)
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    setDates({
      startDate: safeState?.filterRange?.startDate,
      endDate: safeState?.filterRange?.endDate
    })
  }, [branches, data, safeState.branchId, safeState.staffId])
  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) return
    const user = JSON.parse(userData)
    setoriginalloggeduser(user)
  }, [])
  // When no staffId in state (normal followup screen)
  useEffect(() => {
    if (!branches || safeState.staffId) return
    const userData = localStorage.getItem("user")
    if (!userData) return
    const user = JSON.parse(userData)
    let branchesForUser = []
    if (user.role === "Admin") {
      if (user?.selected?.length) {
        branchesForUser = user.selected.map((branch) => ({
          value: branch.branch_id,
          label: branch.branchName
        }))
      } else {
        branchesForUser = branches.map((branch) => ({
          value: branch._id,
          label: branch.branchName
        }))
      }
    } else {
      branchesForUser = (user.selected || []).map((branch) => ({
        value: branch.branch_id,
        label: branch.branchName
      }))
    }
    setloggedUserBranches(branchesForUser)
    setloggedUser(user)
  }, [branches, safeState.staffId])

  // default selected branch
  useEffect(() => {
    if (
      loggedUserBranches &&
      loggedUserBranches.length > 0 &&
      !safeState.staffId
    ) {
      const defaultbranch = loggedUserBranches[0]
      setselectedCompanyBranch(defaultbranch.value)
    }
  }, [loggedUserBranches])

  // default dates
  useEffect(() => {
    if (!safeState?.staffId) {
      //       const now = new Date()
      //       const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      //       const endDate = new Date()
      // console.log(startDate)
      // console.log(endDate)
      //       setDates({ startDate, endDate })
      const now = new Date()

      const formatDate = (date) => {
        const day = String(date.getDate()).padStart(2, "0")
        const month = String(date.getMonth() + 1).padStart(2, "0")
        const year = date.getFullYear()

        return `${year}-${month}-${day}`
      }

      const startDate = formatDate(
        new Date(now.getFullYear(), now.getMonth(), 1)
      )
      const endDate = formatDate(now)

      console.log(startDate) // 01-08-2026
      console.log(endDate) // 08-08-2026

      setDates({ startDate, endDate })
    }
  }, [statusAll])

  // partners + allocation options
  useEffect(() => {
    if (data && selectedCompanyBranch && partners && partners.length > 0) {
      setPartner(partners)
      const { allusers = [], allAdmins = [] } = data
      // const filteredSelectedBranchStaffs = allusers.filter((user) =>

      //   user.selected?.some((sel) => sel.branch_id === selectedCompanyBranch)
      // )
      const filteredSelectedBranchStaffs = allusers.filter(
        (staff) => staff.isVerified === true
        // staff.selected.some((s) => selectedCompanyBranch === s.branch_id)
      )
      const filtereduserandadmin = [
        ...filteredSelectedBranchStaffs,
        ...allAdmins
      ]
      setAllocationOptions(
        filtereduserandadmin.map((item) => ({
          value: item?._id,
          label: item?.name
        }))
      )
    }
  }, [data, selectedCompanyBranch, partners])

  // close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setfilterOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])
  // debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(input)
    }, 2000)
    return () => clearTimeout(handler)
  }, [input])

  const formatdate = (date) => new Date(date).toISOString().split("T")[0]
  const getLocalDate = (date) => {
    const local = new Date(date)
    local.setMinutes(date.getMinutes() - date.getTimezoneOffset())
    return local.toISOString().split("T")[0]
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
  const TotalAmount = (dataArr) => {
    const total = (dataArr || []).reduce((total, lead) => {
      if (!Array.isArray(lead.leadFor)) return total
      const leadTotal = lead.leadFor.reduce((sum, item) => {
        const amount = Number(item?.netAmount ?? 0)
        return sum + (isNaN(amount) ? 0 : amount)
      }, 0)
      return total + leadTotal
    }, 0)
    return Number(total.toFixed(2))
  }

  // This mirrors the Marketing Dashboard's active follow-up rules. A lead
  // stops being a follow-up item once it is closed, converted/lost, or moved
  // to another staff task after the latest active follow-up allocation.
  const getDashboardFollowupStatus = (lead, asOfDate) => {
    const logs = Array.isArray(lead?.activityLog) ? lead.activityLog : []
    const asOf = new Date(asOfDate)
    asOf.setHours(23, 59, 59, 999)

    const activeAllocation = logs
      .map((log, index) => ({ log, index }))
      .filter(({ log }) => {
        const submittedAt = new Date(log?.submissionDate)
        return (
          log?.taskTo === "followup" &&
          log?.taskallocatedTo &&
          log?.allocationChanged !== true &&
          !Number.isNaN(submittedAt.getTime()) &&
          submittedAt <= asOf
        )
      })
      .at(-1)

    if (!activeAllocation) return null

    const entriesAfterAllocation = logs
      .slice(activeAllocation.index + 1)
      .filter((log) => {
        const submittedAt = new Date(log?.submissionDate)
        return !Number.isNaN(submittedAt.getTime()) && submittedAt <= asOf
      })
    const nextFollowupEntries = entriesAfterAllocation.filter((log) => {
      const nextDue = new Date(log?.nextFollowUpDate)
      return (
        log?.nextFollowUpDate &&
        !Number.isNaN(nextDue.getTime()) &&
        nextDue > new Date("2000-01-01T00:00:00.000Z")
      )
    })
    const latestNextFollowup = nextFollowupEntries.at(-1)
    const hasClosedFollowup =
      Boolean(activeAllocation.log?.followupClosed) ||
      entriesAfterAllocation.some((log) => Boolean(log?.followupClosed))
    const hasTaskAfterFollowup = entriesAfterAllocation.some(
      (log) =>
        log?.taskallocatedTo &&
        ["Staff", "Admin"].includes(log?.taskallocatedToModel)
    )

    if (
      lead?.leadClosed ||
      lead?.leadLost ||
      lead?.leadLostDate ||
      lead?.leadConvertedDate ||
      hasClosedFollowup ||
      hasTaskAfterFollowup ||
      !latestNextFollowup
    ) {
      return null
    }

    const nextDue = new Date(latestNextFollowup.nextFollowUpDate)
    nextDue.setHours(0, 0, 0, 0)
    const asOfDay = new Date(asOf)
    asOfDay.setHours(0, 0, 0, 0)

    if (nextDue < asOfDay) return "overdue"
    if (nextDue.getTime() === asOfDay.getTime()) return "dueToday"
    return "future"
  }

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

  // main followup data from loggedusersallocatedleads
  useEffect(() => {
    // if (!loggedusersallocatedleads || !dates.endDate || !loggedUser) return
    if (loggedusersallocatedleads && dates.endDate && loggedUser) {
      const leads = loggedusersallocatedleads.followupLeads
      console.log(leads)
      const aaa = leads.filter((item) => item.leadId === "00085")
      console.log(aaa)
      console.log(safeState?.header)
      if (safeState?.header === "Total Leads") {
        const lea = leads.map((item) => item.leadId)

        // The dashboard's "All branch leads" scope has already been
        // restricted to the selected branch by the API. Do not apply the
        // selected staff member filter a second time, otherwise every lead
        // assigned to another staff member disappears from this drill-down.
        const filteredLeads = safeState?.from === "dashboardAll"
          ? leads
          : leads.filter((lead) => {
              // 1️⃣ Get only followup allocation logs
              const followupAllocations = lead.activityLog.filter(
                (log) =>
                  log.taskTo === "followup" &&
                  log.taskallocatedTo && // must exist
                  log.allocationChanged === false
              )

              // 2️⃣ If no followup allocations → skip
              if (followupAllocations.length === 0) return false

              // 3️⃣ Take LAST followup allocation
              const lastFollowupAllocation =
                followupAllocations[followupAllocations.length - 1]

              // 4️⃣ Match with user
              return (
                (
                  lastFollowupAllocation.taskallocatedTo?._id ||
                  lastFollowupAllocation.taskallocatedTo
                ).toString() === safeState?.staffId?.toString()
              )
            })

        const groupedLeads = {}
        console.log(filteredLeads)
        let grandTotal = 0
        filteredLeads.forEach((lead) => {
          const assignedTo = lead?.allocatedTo?.name
          const amount = lead?.netAmount || 0
          grandTotal += amount
          if (!groupedLeads[assignedTo]) {
            groupedLeads[assignedTo] = []
          }
          groupedLeads[assignedTo].push(lead)
        })
        const groupedData = normalizeTableData(groupedLeads)
        console.log(groupedData)
        setnetTotalAmount(TotalAmount(filteredLeads))
        console.log("Hhh")
        setTableData(groupedData)
      } else {
        if (safeState?.viewMode === "overDue") {
          const overdueLeads = leads.filter(
            (lead) =>
              getDashboardFollowupStatus(
                lead,
                dates.endDate || new Date()
              ) === "overdue"
          )

          const groupedLeads = {}
          let grandTotal = 0
          overdueLeads.forEach((lead) => {
            const assignedTo = lead?.allocatedTo?.name
            const amount = lead?.netAmount || 0
            grandTotal += amount
            if (!groupedLeads[assignedTo]) {
              groupedLeads[assignedTo] = []
            }
            groupedLeads[assignedTo].push(lead)
          })
          const groupedData = normalizeTableData(groupedLeads)
          setnetTotalAmount(TotalAmount(overdueLeads))
          console.log("h")
          setTableData(groupedData)
        } else if (safeState?.viewMode === "dueToday") {
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          const dueTodayLeads = leads.filter((lead) => {
            // 1️⃣ Get logs having nextFollowUpDate
            const followupLogs = lead.activityLog.filter(
              (log) =>
                log.nextFollowUpDate &&
                new Date(log.nextFollowUpDate) > new Date("2000-01-01")
            )

            // 2️⃣ If no followups → NOT overdue
            if (followupLogs.length === 0) return false

            // 3️⃣ Get last followup log
            const lastFollowup = followupLogs[followupLogs.length - 1]

            const nextDate = new Date(lastFollowup.nextFollowUpDate)
            nextDate.setHours(0, 0, 0, 0)

            // 4️⃣ Check overdue
            return (
              nextDate.getTime() === today.getTime() &&
              !lead.leadConvertedDate &&
              !lead.leadLost
            )
          })
          const groupedLeads = {}
          let grandTotal = 0
          dueTodayLeads.forEach((lead) => {
            const assignedTo = lead?.allocatedTo?.name
            const amount = lead?.netAmount || 0
            grandTotal += amount
            if (!groupedLeads[assignedTo]) {
              groupedLeads[assignedTo] = []
            }
            groupedLeads[assignedTo].push(lead)
          })
          const groupedData = normalizeTableData(groupedLeads)
          console.log(groupedData)
          setnetTotalAmount(TotalAmount(dueTodayLeads))
          setTableData(groupedData)
        } else if (safeState?.viewMode === "future") {
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          const futureLeads = leads.filter((lead) => {
            // 1️⃣ Get logs having nextFollowUpDate
            const followupLogs = lead.activityLog.filter(
              (log) =>
                log.nextFollowUpDate &&
                new Date(log.nextFollowUpDate) > new Date("2000-01-01")
            )

            // 2️⃣ If no followups → NOT overdue
            if (followupLogs.length === 0) return false

            // 3️⃣ Get last followup log
            const lastFollowup = followupLogs[followupLogs.length - 1]

            const nextDate = new Date(lastFollowup.nextFollowUpDate)
            nextDate.setHours(0, 0, 0, 0)

            // 4️⃣ Check overdue
            return nextDate > today && !lead.leadConvertedDate && !lead.leadLost
          })

          const groupedLeads = {}
          let grandTotal = 0
          futureLeads.forEach((lead) => {
            const assignedTo = lead?.allocatedTo?.name
            const amount = lead?.netAmount || 0
            grandTotal += amount
            if (!groupedLeads[assignedTo]) {
              groupedLeads[assignedTo] = []
            }
            groupedLeads[assignedTo].push(lead)
          })
          const groupedData = normalizeTableData(groupedLeads)
          console.log(groupedData)
          setnetTotalAmount(TotalAmount(futureLeads))
          setTableData(groupedData)
        } else if (safeState?.viewMode === "converted") {
          const convertedLeads = leads.filter((lead) => {
            if (safeState?.from === "salesFunnel") {
              const start = new Date(dates.startDate)
              start.setHours(0, 0, 0, 0)
              const end = new Date(dates.endDate)
              end.setHours(23, 59, 59, 999)

              const convertedAt = new Date(lead.leadConvertedDate)
              const isConvertedInRange =
                !Number.isNaN(convertedAt.getTime()) &&
                convertedAt >= start &&
                convertedAt <= end

              return (
                !lead.leadLost &&
                isConvertedInRange &&
                (lead.activityLog || []).some((log) => log?.followupClosed)
              )
            }

            return lead.leadConvertedDate && !lead.leadLost
          })

          const groupedLeads = {}
          let grandTotal = 0
          convertedLeads.forEach((lead) => {
            const assignedTo = lead?.allocatedTo?.name
            const amount = lead?.netAmount || 0
            grandTotal += amount
            if (!groupedLeads[assignedTo]) {
              groupedLeads[assignedTo] = []
            }
            groupedLeads[assignedTo].push(lead)
          })
          const groupedData = normalizeTableData(groupedLeads)
          setnetTotalAmount(TotalAmount(convertedLeads))
          setTableData(groupedData)
        } else if (safeState?.viewMode === "neverfollowup") {
          const neverFollowupLeads = leads.filter((lead) => {
            const logs = lead.activityLog || []

            // Use the same definition as the Marketing Dashboard: the most
            // recent active follow-up allocation with no follow-up activity
            // and no task allocation after it.
            const lastFollowupAllocation = [...logs]
              .map((log, index) => ({ ...log, index }))
              .filter(
                (log) =>
                  log.taskTo === "followup" &&
                  log.taskallocatedTo &&
                  log.allocationChanged !== true
              )
              .pop()

            if (!lastFollowupAllocation) return false

            const logsAfterFollowup = logs.slice(lastFollowupAllocation.index + 1)

            const hasNextFollowupDate = logsAfterFollowup.some(
              (log) =>
                log.nextFollowUpDate &&
                new Date(log.nextFollowUpDate) > new Date("2000-01-01")
            )
            const hasTaskAllocationAfterFollowup = logsAfterFollowup.some(
              (log) => Boolean(log.taskallocatedTo)
            )
            const followupWasClosed =
              Boolean(lastFollowupAllocation.followupClosed) ||
              logsAfterFollowup.some((log) => Boolean(log.followupClosed))

            return (
              !hasNextFollowupDate &&
              !hasTaskAllocationAfterFollowup &&
              !followupWasClosed &&
              !lead.leadConvertedDate &&
              !lead.leadLost &&
              !lead.leadClosed
            )
          })
          const groupedLeads = {}
          let grandTotal = 0
          neverFollowupLeads.forEach((lead) => {
            const assignedTo = lead?.allocatedTo?.name
            const amount = lead?.netAmount || 0
            grandTotal += amount
            if (!groupedLeads[assignedTo]) {
              groupedLeads[assignedTo] = []
            }
            groupedLeads[assignedTo].push(lead)
          })
          const groupedData = normalizeTableData(groupedLeads)
          setnetTotalAmount(TotalAmount(neverFollowupLeads))
          setTableData(groupedData)
        } else {
          if (pending && ownFollowUp) {
            const ownFollow = leads.filter((lead) =>
              lead.activityLog?.some(
                (log) =>
                  log.taskTo === "followup" &&
                  log.taskallocatedTo?._id === loggedUser._id &&
                  log.followupClosed === false &&
                  log.allocationChanged === false
              )
            )
            const currentDate = new Date()
            const endDateLocal = getLocalDate(new Date(dates.endDate))
            formatdate(currentDate)
            const fulldatecurrent =
              formatdate(currentDate) === endDateLocal
                ? // formatdate(dates.endDate)
                  formatdate(currentDate)
                : endDateLocal
            const neverfollowupedLeads = ownFollow.filter(
              (lead) => lead.neverfollowuped && lead.allocatedfollowup == false
            )
            const havenextFollowup = ownFollow.filter(
              (lead) => lead.Nextfollowup
            )
            const filteredcurrentdatefollowupLeads = havenextFollowup.filter(
              (lead) => formatdate(lead.nextFollowUpDate) === fulldatecurrent
            )
            const iscurrent =
              fulldatecurrent === endDateLocal ? fulldatecurrent : endDateLocal
            const overdueFollowups = havenextFollowup.filter(
              (lead) => formatdate(lead.nextFollowUpDate) < iscurrent
            )
            const postdatefollowup = havenextFollowup.filter(
              (lead) => formatdate(lead.nextFollowUpDate) > iscurrent
            )
            const uniqueoverdueAndcurrentdate = [
              ...new Set([
                ...overdueFollowups,
                ...filteredcurrentdatefollowupLeads
              ])
            ]
            const taskSubmittedLeads = ownFollow.filter(
              (lead) => lead.allocatedfollowup && lead.allocatedTaskClosed
            )
            const nonsubmittedtakleads = ownFollow.filter(
              (lead) =>
                lead.allocatedfollowup && lead.allocatedTaskClosed === false
            )
            console.log(nonsubmittedtakleads)
            const bb = nonsubmittedtakleads.filter(
              (item) => item.leadId === "00058"
            )
            console.log(bb)
            console.log(ownFollow)
            const aa = ownFollow.filter((item) => item.leadId === "00058")
            console.log(aa)
            const allocatedData = normalizeTableData(nonsubmittedtakleads)
            setallocatednetAmount(TotalAmount(nonsubmittedtakleads))
            setAllocatedLeads(allocatedData)

            const mergedall = ownFollow.filter(
              (lead) => lead.taskfromFollowup === false
            )
            const Data = normalizeTableData(mergedall)
            console.log(Data)
            // then store it in state
            setnetTotalAmount(TotalAmount(mergedall))
            console.log("Hhh")
            setTableData(Data)
          } else if (pending && !ownFollowUp) {
            if (safeState?.staffId) {
              const filterLeadsByConvertedDate = (
                leads,
                startDate,
                endDate
              ) => {
                const start = new Date(startDate)
                start.setHours(0, 0, 0, 0)

                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)

                return leads.filter((lead) => {
                  // ❌ Skip if converted OR lost
                  if (lead.leadConvertedDate) return false
                  if (lead.leadLost === true) return false

                  // ✅ Check followup activity within date range
                  const hasFollowupInRange = lead.activityLog?.some((log) => {
                    if (!log.taskallocatedTo) return false
                    if (log.taskTo !== "followup") return false
                    if (!log.submissionDate) return false

                    const submissionDate = new Date(log.submissionDate)

                    return submissionDate >= start && submissionDate <= end
                  })

                  return hasFollowupInRange
                })
              }

              const filteredpending = filterLeadsByConvertedDate(
                leads,
                dates.startDate,
                dates.endDate
              )
              const groupedLeads = {}
              let grandTotal = 0
              filteredpending.forEach((lead) => {
                const assignedTo = lead?.allocatedTo?.name
                const amount = lead?.netAmount || 0
                grandTotal += amount
                if (!groupedLeads[assignedTo]) {
                  groupedLeads[assignedTo] = []
                }
                groupedLeads[assignedTo].push(lead)
              })
              const groupedData = normalizeTableData(groupedLeads)
              setnetTotalAmount(TotalAmount(filteredpending))
              setTableData(groupedData)
            } else {
              const currentDate = new Date()
              const endDateLocal = getLocalDate(new Date(dates.endDate))
              formatdate(currentDate)
              const fulldatecurrent =
                formatdate(currentDate) === endDateLocal
                  ? // formatdate(dates.endDate)
                    formatdate(currentDate)
                  : endDateLocal

              const neverfollowupedLeads = leads.filter(
                (lead) => lead.neverfollowuped
              )
              const havenextFollowup =
                loggedusersallocatedleads.followupLeads.filter(
                  (lead) => lead.Nextfollowup
                )

              const filteredcurrentdatefollowupLeads = havenextFollowup.filter(
                (lead) => formatdate(lead.nextFollowUpDate) === fulldatecurrent
              )

              const iscurrent =
                fulldatecurrent === endDateLocal
                  ? fulldatecurrent
                  : endDateLocal
              const overdueFollowups = havenextFollowup.filter(
                (lead) => formatdate(lead.nextFollowUpDate) < iscurrent
              )
              const postdatefollowup = havenextFollowup.filter(
                (lead) => formatdate(lead.nextFollowUpDate) > iscurrent
              )
              const uniqueoverdueAndcurrentdate = [
                ...new Set([
                  ...overdueFollowups,
                  ...filteredcurrentdatefollowupLeads
                ])
              ]

              const taskSubmittedLeads =
                loggedusersallocatedleads.followupLeads.filter(
                  (lead) => lead.allocatedfollowup && lead.allocatedTaskClosed
                )
              const nonsubmittedtakleads = leads.filter(
                (lead) =>
                  lead.allocatedfollowup && lead.allocatedTaskClosed === false
              )
              setallocatednetAmount(TotalAmount(nonsubmittedtakleads))
              const groupedallocatedleads = {}
              nonsubmittedtakleads.forEach((lead) => {
                const assignedTo = lead?.allocatedTo?.name

                if (!groupedallocatedleads[assignedTo]) {
                  groupedallocatedleads[assignedTo] = []
                }
                groupedallocatedleads[assignedTo].push(lead)
              })
              const groupedallocatedData = normalizeTableData(
                groupedallocatedleads
              )
              setAllocatedLeads(groupedallocatedData)

              const mergedall = leads.filter(
                (lead) => lead.taskfromFollowup === false
              )
              const groupedLeads = {}
              let grandTotal = 0
              mergedall.forEach((lead) => {
                const assignedTo = lead?.allocatedTo?.name
                const amount = lead?.netAmount || 0
                grandTotal += amount
                if (!groupedLeads[assignedTo]) {
                  groupedLeads[assignedTo] = []
                }
                groupedLeads[assignedTo].push(lead)
              })
              const groupedData = normalizeTableData(groupedLeads)
              setnetTotalAmount(TotalAmount(mergedall))
              setTableData(groupedData)
            }
          } else if (!pending && ownFollowUp) {
            const ownFollow = leads.filter((lead) =>
              lead.activityLog?.some(
                (log) =>
                  log.taskTo === "followup" &&
                  log.taskallocatedTo._id === loggedUser._id &&
                  log.followupClosed === true
              )
            )

            const clearedLeads = ownFollow.filter(
              (lead) =>
                Array.isArray(lead.activityLog) &&
                lead.activityLog.some(
                  (entry) =>
                    entry.taskBy?.taskName?.trim() === "Follow-Up Closing" &&
                    entry.followupClosed === true &&
                    entry.submissionDate
                )
            )

            // then store it in state
            setnetTotalAmount(TotalAmount(clearedLeads))
            const Data = normalizeTableData(clearedLeads)

            setTableData(Data)
          } else if (!pending && !ownFollowUp) {
            const followupLeads = leads || []
            if (safeState?.staffId) {
              const filterLeadsByConvertedDate = (
                leads,
                startDate,
                endDate
              ) => {
                const start = new Date(startDate)

                start.setHours(0, 0, 0, 0)

                const end = new Date(endDate)
                end.setHours(23, 59, 59, 999)
                return leads.filter((lead) => {
                  // 1️⃣ Check converted date
                  if (!lead.leadConvertedDate) return false
                  const convertedDate = new Date(lead.leadConvertedDate)
                  const isConvertedInRange =
                    convertedDate >= start && convertedDate <= end

                  if (!isConvertedInRange) return false

                  // 2️⃣ Check activityLog for followup allocation within same range
                  const hasValidFollowupAllocation = lead.activityLog?.some(
                    (log) => {
                      if (!log.taskallocatedTo) return false
                      if (log.taskTo !== "followup") return false
                      if (!log.submissionDate) return false

                      const submissionDate = new Date(log.submissionDate)

                      return submissionDate >= start && submissionDate <= end
                    }
                  )

                  return hasValidFollowupAllocation
                })
              }
              const filteredLeads = filterLeadsByConvertedDate(
                followupLeads,
                dates.startDate,
                dates.endDate
              )

              // optional: group by allocatedTo
              const groupedLeads = {}
              let grandTotal = 0
              filteredLeads.forEach((lead) => {
                const assignedTo = lead?.allocatedTo?.name || "Unassigned"
                const amount = lead?.netAmount || 0
                grandTotal += amount
                if (!groupedLeads[assignedTo]) groupedLeads[assignedTo] = []
                groupedLeads[assignedTo].push(lead)
              })
              const groupedData = normalizeTableData(groupedLeads)
              // then store it in state
              setnetTotalAmount(TotalAmount(filteredLeads))
              setTableData(groupedData)
            } else {
              // helpers
              const isFollowupActivity = (log) =>
                log?.taskBy?.taskName?.trim() === "Follow-Up Closing" &&
                log?.followupClosed === true &&
                log?.submissionDate
              const getLatestSubmissionDate = (lead) => {
                const dates = (lead.activityLog || [])
                  .filter(isFollowupActivity)
                  .map((log) => new Date(log.submissionDate).getTime())
                if (!dates.length) return null
                return Math.max(...dates) // latest
              }

              const clearedLeads = []
              followupLeads.forEach((lead) => {
                const latest = getLatestSubmissionDate(lead)
                if (latest) {
                  // cleared
                  clearedLeads.push({ ...lead, latestSubmissionTime: latest })
                }
              })

              // sort cleared leads: latest cleared first
              clearedLeads.sort(
                (a, b) => b.latestSubmissionTime - a.latestSubmissionTime
              )
              // optional: group by allocatedTo
              const groupedLeads = {}
              let grandTotal = 0
              clearedLeads.forEach((lead) => {
                const assignedTo = lead?.allocatedTo?.name || "Unassigned"
                const amount = lead?.netAmount || 0
                grandTotal += amount
                if (!groupedLeads[assignedTo]) groupedLeads[assignedTo] = []
                groupedLeads[assignedTo].push(lead)
              })
              const groupedData = normalizeTableData(groupedLeads)
              // then store it in state
              setnetTotalAmount(TotalAmount(clearedLeads))
              setTableData(groupedData)
            }
          }
        }
      }

      setHasownLeads(loggedusersallocatedleads.ischekCollegueLeads)
    } else {
      setTableData([])
    }
  }, [
    loggedusersallocatedleads,
    dates,
    pending,
    ownFollowUp,
    loggedUser,
    statusAllocated
  ])
  useEffect(() => {
    if (loggedUser) {
      setFormData((prev) => ({
        ...prev,
        followedId: loggedUser?._id
      }))
    }
  }, [loggedUser])

  const handleDataChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
    if (isAllocated) {
      setDemodata((prev) => ({
        ...prev,
        ...(name === "nextfollowUpDate" || name === "allocationDate"
          ? { demoallocatedDate: value }
          : { demoDescription: value })
      }))
    }
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
    if (name === "Remarks") {
      if (demoerror.demoDescription) {
        setDemoError((prev) => ({ ...prev, demoDescription: "" }))
      }
    } else if (name === "nextfollowUpDate") {
      if (errors.nextfollowUpDate) {
        setErrors((prev) => ({
          ...prev,
          nextfollowUpDate: ""
        }))
      }
    } else if (name === "allocationDate") {
      if (demoerror.allocationDate) {
        setDemoError((prev) => ({
          ...prev,
          allocationDate: ""
        }))
      }
    }
  }
  const hasCollectionData =
    collectionData && Object.keys(collectionupdatedata).length > 0

  const handleHistory = (
    history,
    leadid,
    docId,
    allocatedTo,
    taskfromFollowup
  ) => {
    if (!loggedUser) return // NEW: guard
    const owner = loggedUser._id === allocatedTo
    setOwner(owner)
    const isHaveDemo = taskfromFollowup ? history[history.length - 1] : null
    // if (isHaveDemo) {
    //   const demoassignedDate = formatDate(isHaveDemo.submissionDate)
    //   setdemoEditIndex(history.length - 1)
    //   setfollowUpDatesandRemarksEditIndex(history.length - 1)
    //   setDemodata({
    //     selectedType: isHaveDemo?.taskTo,
    //     demoallocatedTo: isHaveDemo?.taskallocatedTo?._id,
    //     demoallocatedDate: isHaveDemo?.allocationDate.toString().split("T")[0],
    //     demoassignedDate,
    //     demoDescription: isHaveDemo?.remarks,
    //     selectedTypeName: isHaveDemo?.taskTo
    //   })
    //   setIsEditable(true)
    //   setIsAllocated(true)
    // }

    setfollowupClosed(!pending)
    setselectedDocid(docId)
    setselectedTab("History")
    setShowModal(true)
    setHistoryList(history)
    setSelectedLeadId(leadid)
  }
  console.log(selectedDocId)
  const handlefollowupdate = (Id, docId) => {
    console.log("hhhffff")
    setfollowupDateModal(true)
    setSelectedLeadId(Id)
    setselectedDocid(docId)
    if (!demoData.demoallocatedTo) {
      setFormData((prev) => ({
        ...prev,
        followUpDate: new Date().toISOString().split("T")[0]
      }))
    }
  }
  // MODIFIED: Fetch updated lead data after collection update
  const fetchUpdatedLeadData = async (leadDocId) => {
    try {
      const response = await api.get(`/lead/getLeadById/${leadDocId}`)
      if (response.status === 200) {
        setselectedData(response.data.lead)
        return response.data.lead
      }
    } catch (error) {
      console.error("Error fetching updated lead data:", error)
      toast.error("Failed to refresh lead data")
    }
  }
  console.log(formData)
  // MODIFIED: Handle collection update with refresh
  const handleCollectionUpdate = (formData) => {
    console.log(formData)
    console.log(paymentUpdatedInSession)

    // Add flag to indicate if this is an update within the same session
    const requestData = {
      ...formData,
      overwriteLastPayment: paymentUpdatedInSession // Send flag to backend
    }
    console.log(requestData)
    console.log(requestData)
    setcollectionupdateData(requestData)
    setcollectionUpdateModal(false)
  }
  console.log(collectionData)
  const handleDemoSubmit = async () => {
    console.log("hhh")
    console.log(isdemofollownotClosed)
    console.log(loader)
    if (loader) return

    const newError = {}
    if (!demoData.demoallocatedDate) {
      newError.allocationDate = "Completion Date is Required"
    }
    if (!demoData.demoDescription) {
      newError.demoDescription = "Remarks is Required"
      toast.error("Remark is required")
    }
    if (!demoData.demoallocatedTo) {
      newError.selectStaff = "Staff is Required"
    }
    if (!demoData.selectedType) {
      newError.allocationTyperror = "Allocation Type is Required"
    }
    console.log(newError)
    if (Object.keys(newError).length > 0) {
      setDemoError(newError)
      return
    }
    console.log(selectedDocId)
    console.log(loggedUser)
    try {
      if (!loggedUser || !selectedDocId) return
      console.log(demoData)
      console.log(selectedDocId)
      console.log(editdemoIndex)

      setLoader(true)

      const response = await api.post(
        `/lead/setdemolead?demoallocatedBy=${loggedUser._id}&leaddocId=${selectedDocId}&editIndex=${editdemoIndex}`,
        demoData
      )

      setLoader(false)
      setFormData((prev) => ({
        ...prev,
        followUpDate: "",
        nextfollowUpDate: "",
        followedId: "",
        Remarks: ""
      }))
      setIsAllocated(false)
      setDemodata({
        demoallocatedTo: "",
        demoallocatedDate: "",
        demoDescription: "",
        selectedType: "",
        selectedTypeName: "",
        demoassignedDate: ""
      })

      // Reset payment session flag
      setPaymentUpdatedInSession(false)

      refreshHook()
      toast.success(response.data.message)
      setshowFollowupModal(false)
    } catch (error) {
      toast.error("something went wrong")
      console.log(error)
      setLoader(false)
    }
  }
  console.log(formData)
  const handleFollowUpDateSubmit = async () => {
    console.log(formData)
    console.log(collectionupdatedata)
    console.log(followupDateLoader)
    if (followupDateLoader) return
    const shouldOpenLeadClosing =
      formData.followupType === "followup_closed_and_lead_closed"
    const leadDocumentId = selectedDocId
    try {
      let newErrors = {}
      if (!formData.followUpDate)
        newErrors.followUpDate = "Follow Up Date is required"
      if (formData.followupType === "infollowup") {
        if (!formData.nextfollowUpDate) {
          newErrors.nextfollowUpDate = "Next Follow Up Date Is Required"
        }
      }
      if (!formData.Remarks) newErrors.Remarks = "Remarks is Required"
      console.log(newErrors)
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }
      console.log(loggedUser)
      console.log(selectedDocId)
      if (!loggedUser || !selectedDocId) return

      setfollowupDateLoader(true)

      const response = await api.put(
        `/lead/followupDateUpdate?selectedleaddocId=${selectedDocId}&loggeduserid=${loggedUser._id}`,
        { formData, collectionupdatedata }
      )

      if (response.status === 200) {
        toast.success(response?.data?.message)
        setcollectionupdateData({})
        setIsEditable(false)
        setselectedDocid(null)
        setSelectedLeadId(null)
        setHistoryList([])
        setshowFollowupModal(false)
        setfollowupDateModal(false)
        setFormData({
          followUpDate: "",
          nextfollowUpDate: "",
          netAmount: "",
          balanceAmount: "",
          followupType: "infollowup",
          Remarks: ""
        })

        // Reset payment session flag
        setPaymentUpdatedInSession(false)

        setTableData([])
        refreshHook()
        setfollowupDateLoader(false)

        if (shouldOpenLeadClosing) {
          navigate(
            loggedUser?.role === "Admin"
              ? "/admin/transaction/lead/leadClosed"
              : "/staff/transaction/lead/leadClosed",
            {
              state: {
                leadId: leadDocumentId,
                closingOrigin: "followup",
                closingRemark: formData.Remarks,
                closingFollowUpDate: formData.followUpDate,
                pendingCollection: collectionupdatedata
              }
            }
          )
        }
      } else {
        setfollowupDateLoader(false)
        toast.error("something went wrong")
      }
    } catch (error) {
      toast.error("Something went wrong")
      setIsEditable(false)
      setfollowupDateLoader(false)
      console.log("error:", error.message)
    }
  }

  const handleFollowUp = (Item) => {
    console.log(Item)

    setshowFollowupModal(true)
    setFormData((prev) => ({
      ...prev,
      netAmount: Item.netAmount,
      followupType: "infollowup",
      balanceAmount: Item.balanceAmount,
      customerName: Item?.customerName?.customerName,
      followUpDate: new Date().toISOString().split("T")[0]
    }))

    setselectedData(Item)

    // Reset payment session flag when opening new follow-up
    setPaymentUpdatedInSession(false)
    console.log(Item.taskfromFollowup)
    const ishaveAllocation = Item.taskfromFollowup
      ? (Array.isArray(Item.activityLog) &&
          Item.activityLog[Item.activityLog.length - 1]) ||
        null
      : null
    if (ishaveAllocation) {
      console.log(ishaveAllocation)
      console.log(taskList)
      setdemoEditIndex(Item.activityLog.length - 1)
      console.log("hhhh")
      console.log(ishaveAllocation?.allocationDate?.toString()?.split("T")[0])
      console.log(ishaveAllocation?.allocationDate.toString().split("T")[0])
      console.log("jjjj")
      setDemodata({
        selectedType: ishaveAllocation?.taskId?._id,
        selectedTypeName: ishaveAllocation?.taskTo.toUpperCase(),
        demoallocatedTo: ishaveAllocation?.taskallocatedTo?._id,
        demoallocatedDate: ishaveAllocation?.allocationDate
          .toString()
          .split("T")[0],
        demoassignedDate: formatDate(ishaveAllocation.submissionDate),
        demoDescription: ishaveAllocation?.remarks
      })
      console.log("hhh")
      console.log("hhh")
      setisdemofollowedNotClosed(true)

      setIsEditable(true)
      setIsAllocated(true)
      console.log("hhh")
    }
    setfollowupClosed(!pending)
    console.log("hh")
    setselectedDocid(Item._id)
    setSelectedLeadId(Item.leadId)
  }
console.log("hhh")
  console.log(!!safeState.staffId || !!safeState?.viewdate)
  const handleeditcollection = () => {
    console.log("dd")
    setcollectionUpdateModal(true)
  }
console.log("jjj")
  const handlecloseModal = () => {
    setSelectedLeadId(null)
    setShowModal(false)
    setHistoryList([])
    // Reset payment session flag
    setPaymentUpdatedInSession(false)
    setcollectionupdateData({})
  }
console.log("hhh")
  console.log(formData?.followupType)
  // MODIFIED: Reset payment session flag when closing follow-up modal
  const handleCloseFollowupModal = () => {
    console.log(formData)
    setshowFollowupModal(false)
    setPaymentUpdatedInSession(false)
    setishavePayment(false)
    setcollectionUpdateModal(false)
    setisdemofollowedNotClosed(false)
    setcollectionupdateData({})
  }

  // [Keep all your existing component code - LeadRow, renderTable, etc.]
  // ... (LeadRow component and renderTable function remain the same)
  const toSafeUpper = (value) =>
    String(value ?? "")
      .trim()
      .toUpperCase()
  const LeadRow = ({ item, index }) => {
    console.log(item)
    if (item.leadId === "00108") {
      console.log("hhh")
      console.log(item?.taskfromFollowup)
    }
    const [open, setOpen] = useState(false)

    const lastLog =
      Array.isArray(item.activityLog) && item.activityLog.length
        ? item.activityLog[item.activityLog.length - 1]
        : null

    const followupDate =
      pending && lastLog?.nextFollowUpDate
        ? new Date(lastLog.nextFollowUpDate)
            .toLocaleDateString("en-GB")
            .split("/")
            .join("-")
        : "-"

    const isAllocatedToeditable = Array.isArray(item.activityLog)
      ? item.activityLog.some(
          (it) =>
            (it?.taskallocatedTo?._id === loggedUser?._id ||
              it?.taskallocatedTo === loggedUser?._id) &&
            it?.taskClosed === false
        )
      : false
    const isleadclosed = item?.leadConfirmed

    // const customerName = item?.customerName?.customerName.toUpperCase()
    // const shouldShowTooltipCustomer = customerName.length > 20
    // const shouldShowTooltipEmail = item?.email.length > 5

    const customerName = String(
      item?.customerName?.customerName ?? ""
    ).toUpperCase()
    const shouldShowTooltipCustomer = customerName.length > 20

    const email = String(item?.email ?? "")
    const shouldShowTooltipEmail = email.length > 5

    return (
      <>
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
          {/* <td className="px-3 py-2 font-semibold text-gray-900 text-sm border border-gray-300 whitespace-nowrap">
            {item.customerName.customerName.toUpperCase()}
          </td> */}
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
                <div className="pointer-events-none absolute left-0 top-full z-50 mt-2 w-max max-w-xs rounded-xl bg-gray-900 px-3 py-2 text-xs font-medium text-white opacity-0 shadow-xl ring-1 ring-white/10 transition-all duration-200 translate-y-1 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  {customerName}
                  <div className="absolute -top-1 left-4 h-2 w-2 rotate-45 bg-gray-900"></div>
                </div>
              )}
            </div>
          </td>
          <td className="px-3 py-2 text-gray-700 text-sm border border-gray-300 whitespace-nowrap">
            {item?.mobile}
          </td>
          <td className="px-3 py-2 text-sm border border-gray-300 max-w-[200px] whitespace-nowrap">
            <div className="relative group">
              <span className="block truncate text-xs uppercase text-red-600 font-medium">
                {lastLog?.remarks || "-"}
              </span>
              {lastLog?.remarks && (
                <div className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 z-20 hidden group-hover:block">
                  <div className="max-w-xs rounded-md bg-[#ADD8E6] px-2.5 py-1.5 shadow-lg border border-blue-200">
                    <p className="text-[11px] leading-snug text-slate-700">
                      {lastLog.remarks}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </td>
          <td className="px-3 py-2 text-sm text-gray-700 border border-gray-300 whitespace-nowrap text-center">
            {followupDate}
          </td>
          <td
            className="px-2 py-2 border border-gray-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() =>
                handleHistory(
                  item?.activityLog,
                  item.leadId,
                  item?._id,
                  item?.allocatedTo?._id,
                  item?.taskfromFollowup
                )
              }
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors w-full justify-center"
            >
              <BellRing className="w-3.5 h-3.5" />
            </button>
          </td>
          <td
            className="px-2 py-2 border border-gray-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                console.log("hh")
                const breadcrumb = [
                  { label: "Lead", path: "", state: "" },
                  {
                    label: "Lead Follow-Up",
                    path:
                      originalloggeduser?.role === "Admin"
                        ? "/admin/transaction/lead/leadFollowUp"
                        : "/staff/transaction/lead/leadFollowUp",
                    state: { ownfollowup: ownFollowUp, pending }
                  },
                  { label: "New Lead", path: "" }
                ]
                console.log("Hh")
                console.log(!isAllocatedToeditable)
                originalloggeduser?.role === "Admin"
                  ? navigate("/admin/transaction/lead/leadEdit", {
                      state: {
                        leadId: item._id,
                        isReadOnly: !isAllocatedToeditable,
                        breadcrumb
                      }
                    })
                  : navigate("/staff/transaction/lead/leadEdit", {
                      state: {
                        leadId: item._id,
                        isReadOnly: !isAllocatedToeditable,
                        breadcrumb
                      }
                    })
                console.log("hhh")
              }}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors w-full justify-center"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </td>

          {((ownFollowUp && pending) || (checkedownfollowup && pending)) && (
            <td
              className="px-2 py-2 border border-gray-300"
              onClick={(e) => e.stopPropagation()}
            >
              {!isleadclosed && (
                <button
                  type="button"
                  onClick={() => handleFollowUp(item)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-amber-500 rounded hover:bg-amber-600 transition-colors w-full justify-center"
                >
                  <History className="w-3.5 h-3.5" />
                </button>
              )}
            </td>
          )}
          <td className="px-3 py-2 text-sm font-semibold text-green-700 border border-gray-300 whitespace-nowrap text-right">
            <span className="inline-flex items-center gap-0.5 justify-end">
              <IndianRupee className="w-3.5 h-3.5" />
              {item.netAmount?.toLocaleString("en-IN")}
            </span>
          </td>
        </tr>

        {open && (
          <>
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
                  <span>No. of Calls</span>
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
              {ownFollowUp && checkedownfollowup && (
                <td className="px-3 py-1 border border-gray-300 bg-gray-100 text-gray-600">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Phone</span>
                  </div>
                </td>
              )}

              <td className="px-3 py-1 border border-gray-300 bg-gray-100 text-gray-600">
                <div className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </div>
              </td>
              <td className="px-3 py-1 border border-gray-300 bg-gray-100 text-gray-600">
                <div className="flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  <span>Product Name</span>
                </div>
              </td>
            </tr>
            <tr className="bg-white text-xs border border-b-2 border-gray-300 border-b-gray-400">
              <td className="border border-gray-300" />
              <td className="px-3 py-1.5 border border-gray-300 text-gray-800 font-medium">
                {item?.leadBy?.name || "-"}
              </td>
              <td className="px-3 py-1.5 border border-gray-300 text-gray-700">
                {item?.allocatedTo?.name || "-"}
              </td>
              <td className="px-3 py-1.5 border border-gray-300 text-gray-700">
                {item?.allocatedBy?.name || "-"}
              </td>
              <td className="px-3 py-1.5 border border-gray-300 text-gray-700 text-center">
                {item?.activityLog?.filter(
                  (log) =>
                    log?.taskBy?.taskName?.toLowerCase() === "followup" &&
                    log?.nextFollowUpDate
                ).length || 0}
              </td>
              <td className="px-3 py-1.5 border border-gray-300 text-gray-700">
                {item.leadDate?.toString().split("T")[0] || "-"}
              </td>
              <td className="px-3 py-1.5 border border-gray-300 font-bold text-blue-700">
                {item?.leadId}
              </td>
              {ownFollowUp && checkedownfollowup && (
                <td className="px-3 py-1.5 border border-gray-300 text-gray-700">
                  {item?.phone || "-"}
                </td>
              )}

              <td className="px-3 py-2 font-semibold text-gray-900 text-sm border border-gray-300 whitespace-nowrap">
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

              <td className="px-3 py-1.5 border border-gray-300 text-blue-500 font-medium whitespace-nowrap">
                {item?.leadFor[0]?.productorServiceId?.shortName?.toUpperCase() ||
                  item?.leadFor[0]?.productorServiceId?.productName?.toUpperCase() ||
                  "-"}
              </td>
            </tr>
          </>
        )}
      </>
    )
  }

  const renderTable = (groupedData) => (
    <table className="border-collapse border border-gray-300 w-full text-sm h-auto">
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
          <th className="border border-gray-300 px-3 py-1 text-left">
            <span>Last Remark</span>
          </th>
          <th className="border border-gray-300 px-3 py-1 text-left">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              <span>Followup Date</span>
            </div>
          </th>
          <th className="border border-gray-300 px-3 py-1 text-center">
            Event Log
          </th>
          <th className="border border-gray-300 px-3 py-1 text-center">
            View/Modify
          </th>
          {(ownFollowUp && pending) || (pending && checkedownfollowup) ? (
            <>
              <th className="border border-gray-300 px-3 py-1 text-center">
                Follow Up
              </th>
              <th className="border border-gray-300 px-3 py-1 text-right">
                <div className="flex items-center gap-1.5 justify-end">
                  <IndianRupee className="w-3 h-3" />
                  <span>Net Amount</span>
                </div>
              </th>
            </>
          ) : ownFollowUp ? (
            <th className="border border-gray-300 px-3 py-1 text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <IndianRupee className="w-3 h-3" />
                <span>Net Amount</span>
              </div>
            </th>
          ) : (
            <th className="border border-gray-300 px-3 py-1 text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <IndianRupee className="w-3 h-3" />
                <span>Net Amount</span>
              </div>
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {groupedData?.length > 0 ? (
          groupedData.map((group, idx) =>
            (group.leads || []).map((item, index) => (
              <LeadRow key={item._id ?? `${idx}-${index}`} item={item} />
            ))
          )
        ) : (
          <tr>
            <td colSpan={9} className="text-center text-gray-500 py-6">
              {loading ? (
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
  const currentData = statusAllocated ? allocatedLeads : tableData

  const normalizedFollowupSearch = followupSearch.trim().toLowerCase()
  const visibleData = normalizedFollowupSearch
    ? (currentData || [])
        .map((group) => ({
          ...group,
          leads: (group?.leads || []).filter((lead) => {
            const customerName =
              lead?.customerName?.customerName ||
              lead?.customerName?.name ||
              lead?.customerName ||
              ""
            const productNames = (lead?.leadFor || []).map(
              (product) =>
                product?.productorServiceName ||
                product?.productorServiceId?.shortName ||
                product?.productorServiceId?.productName ||
                product?.productorServiceId?.serviceName ||
                product?.productName ||
                ""
            )

            return [customerName, ...productNames].some((value) =>
              String(value).toLowerCase().includes(normalizedFollowupSearch)
            )
          })
        }))
        .filter((group) => group.leads.length > 0)
    : currentData

  const visibleLeadCount = Array.isArray(visibleData)
    ? visibleData.reduce(
        (count, group) => count + (Array.isArray(group?.leads) ? group.leads.length : 0),
        0
      )
    : 0

  const hasLeads = () => {
    if (!Array.isArray(visibleData) || visibleData.length === 0) return false
    return visibleData.some(
      (group) => Array.isArray(group?.leads) && group.leads.length > 0
    )
  }
  console.log(currentData)
  return (
    <div className="h-full  bg-[#ADD8E6] overflow-hidden">
      <div className="flex h-full  flex-row">
        <div className="flex flex-1 flex-col overflow-hidden min-h-0">
          {(loading || productwiseloader) && (
            <BarLoader
              cssOverride={{ width: "100%", height: "4px" }}
              color="#4A90E2"
            />
          )}
          <div className="flex flex-col flex-1 bg-[#ADD8E6] min-h-0">
            <Breadcrumb items={Breadcrumblist} />
            <div className="flex flex-col gap-3 px-4 py-1 md:flex-row md:items-end">
              <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
                <h2 className="text-lg font-bold text-slate-900">
                  Lead Follow Up
                </h2>
                <span className="inline-flex items-center gap-1 rounded-md border border-blue-200/80 bg-white/80 px-2 py-1 text-xs font-semibold text-blue-800 shadow-sm">
                  <Users className="h-3.5 w-3.5 text-blue-600" />
                  {visibleLeadCount} listed
                </span>
                <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200/80 bg-white/80 px-2 py-1 text-xs font-semibold text-emerald-800 shadow-sm">
                  <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Total net amount:</span>
                  <span className="tabular-nums">
                    {statusAllocated ? allocatednetAmount : netTotalAmount}
                  </span>
                </span>
              </div>

              <div className="flex flex-1 flex-wrap items-end justify-end gap-3">
                <div className="relative w-full sm:w-52 lg:w-56">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={followupSearch}
                    onChange={(event) => setFollowupSearch(event.target.value)}
                    placeholder="Search customer or product..."
                    className="h-8 w-full rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-8 text-xs text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
                  />
                  {followupSearch && (
                    <button
                      type="button"
                      onClick={() => setFollowupSearch("")}
                      className="absolute right-1.5 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      title="Clear search"
                      aria-label="Clear search"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                {dates.startDate && (
                  <div className="w-full sm:w-auto">
                    <MyDatePicker
                      setDates={setDates}
                      dates={dates}
                      view={!!safeState.staffId || !!safeState?.viewdate}
                      compact
                      inlineOnMobile
                    />
                  </div>
                )}
                {!safeState?.staffId && (
                  <div className="relative flex justify-end " ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setfilterOpen(!filterOpen)}
                      className="p-1 rounded-md bg-gray-100 md:bg-white border border-gray-300 shadow-sm hover:shadow-md hover:bg-gray-50 transition"
                      title="Filter Options"
                    >
                      <BsFilterLeft className="text-md md:text-xl text-gray-800 md:text-gray-700 hover:text-black" />
                    </button>

                    {filterOpen && (
                      <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 p-4 space-y-5 animate-fade-in-down">
                        <h3 className="text-base font-semibold text-gray-800 border-b pb-2">
                          Filters
                        </h3>

                        {[
                          {
                            label: statusAll ? "All Leads" : "Filtered Leads",
                            value: statusAll,
                            toggle: () => {
                              setstatusAll(!statusAll)
                              setTableData([])
                              setAllocatedLeads([])
                            },
                            show: false,
                            disabled: false
                          },
                          {
                            label: "Task Allocated Followups",
                            value: statusAllocated,
                            toggle: () => {
                              setstatusAllocated(!statusAllocated)
                              setTableData([])
                              setAllocatedLeads([])
                            },
                            show: safeState.staffId ? false : pending === true
                            // disabled: safeState.staffId && safeState.istotal
                          },
                          {
                            label: pending
                              ? "Pending Followup"
                              : "Cleared Followup",
                            value: pending,
                            toggle: () => {
                              setPending(!pending)
                              setTableData([])
                              setAllocatedLeads([])
                              if (safeState.staffId && !safeState.istotal) {
                                console.log("hhh")
                                handletoogle(pending)
                              }
                            },
                            show: true
                            //  disabled: safeState.staffId && safeState.istotal
                          },
                          {
                            label: ownFollowUp
                              ? "Own Followup"
                              : "All Followup",
                            value: ownFollowUp,
                            toggle: () => {
                              console.log(ownFollowUp)
                              setOwnFollowUp(!ownFollowUp)
                              setTableData([])
                              setAllocatedLeads([])
                            },
                            show: safeState.staffId
                              ? false
                              : loggedUser?.role !== "Staff"
                            // disabled: safeState.staffId && safeState.istotal
                          }
                        ]
                          .filter((item) => item.show)
                          .map((item, idx) => {
                            const isDisabled = item.disabled
                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-sm font-medium text-gray-700 group"
                              >
                                <span
                                  className={`transition ${
                                    item.label === "Task Allocated Followups" &&
                                    !item.value
                                      ? "text-gray-400 opacity-60 blur-[1px]"
                                      : isDisabled
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-gray-700 group-hover:text-black"
                                  }`}
                                >
                                  {item.label}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isDisabled) return
                                    item.toggle()
                                  }}
                                  className={`${
                                    item.value
                                      ? "bg-emerald-400"
                                      : "bg-gray-300"
                                  } w-8 h-5 flex items-center rounded-full transition-colors duration-300 ${
                                    isDisabled
                                      ? "cursor-not-allowed opacity-60"
                                      : "cursor-pointer"
                                  }`}
                                >
                                  <div
                                    className={`${
                                      item.value
                                        ? "translate-x-3"
                                        : "translate-x-0"
                                    } w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300`}
                                  />
                                </button>
                              </div>
                            )
                          })}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex shrink-0 justify-end">
                  <button
                    onClick={() =>
                      loggedUser?.role === "Admin"
                        ? navigate("/admin/transaction/lead")
                        : navigate("/staff/transaction/lead")
                    }
                    className="bg-black text-white py-0.5 px-3 rounded-lg shadow-lg hover:bg-gray-600 w-24"
                  >
                    New Lead
                  </button>
                </div>
              </div>
            </div>
            {/* <div className=" min-h-0 overflow-auto rounded-lg shadow-xl mx-2 md:mx-3 mb-3 bg-white">
              {loading ? (
                <SkeletonTable rows={7} />
              ) : hasLeads() ? (
                renderTable(visibleData)
              ) : (
                <NoDataAvailable
                  message={
                    normalizedFollowupSearch
                      ? "No matching customer or product found"
                      : undefined
                  }
                />
              )}
            </div> */}
            <div className="relative min-h-0 overflow-auto rounded-lg bg-white mx-2 mb-3 shadow-xl md:mx-3">
              {showInitialSkeleton ? (
                <SkeletonTable rows={7} />
              ) : isError ? (
                <div className="flex min-h-40 flex-col items-center justify-center gap-2 px-4 text-center">
                  <p className="text-sm font-semibold text-red-600">
                    Failed to load follow-up leads
                  </p>

                  <p className="text-xs text-gray-500">
                    {error?.response?.data?.message ||
                      error?.message ||
                      "Please try again."}
                  </p>

                  <button
                    type="button"
                    onClick={() => refreshHook()}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    Retry
                  </button>
                </div>
              ) : hasLeads() ? (
                renderTable(visibleData)
              ) : (
                <NoDataAvailable
                  message={
                    normalizedFollowupSearch
                      ? "No matching customer or product found"
                      : undefined
                  }
                />
              )}

              {/* Background refresh overlay: old data remains visible */}
              {isFetching && !showInitialSkeleton && hasLeads() && (
                <div className="absolute inset-0 z-20 grid place-items-center bg-white/35 backdrop-blur-[1px]">
                  <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-xs font-medium text-blue-700 shadow-md">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    Refreshing leads...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {showModal && (
          <LeadhistoryModal
            open={showModal}
            handlecloseModal={handlecloseModal}
            historyList={historyList}
            selectedLeadId={selectedLeadId}
            isOwner={isOwner}
            loggedUser={loggedUser}
          />
        )}

        {showfollowupModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#ADD8E6] rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border border-white/40">
              {/* Header */}
              <div className="flex items-center justify-between px-7 py-4 bg-white/40 backdrop-blur-md border-b border-white/50">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                    Follow-Up
                  </h2>
                  <p className="text-sm text-blue-700 font-semibold mt-0.5">
                    {toSafeUpper(formData?.customerName)}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-sm bg-white/70 px-3 py-1.5 rounded-full font-semibold text-gray-700 shadow-sm">
                    Lead ID{" "}
                    <span className="text-blue-700 ml-1">{selectedLeadId}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCloseFollowupModal}
                    className="p-2 hover:bg-white/70 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Body - Scrollable */}
              <div className="flex-1 overflow-y-auto px-7 py-6 bg-white/30">
                <div className="space-y-4">
                  {/* Follow Up Date + Status */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                        Follow Up Date
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          readOnly
                          value={
                            demoData.demoassignedDate
                              ? demoData.demoassignedDate
                                  .toString()
                                  .split("T")[0]
                              : formData?.followUpDate
                                ? new Date(formData.followUpDate)
                                    .toLocaleDateString("en-GB")
                                    .replace(/\//g, "-")
                                : ""
                          }
                          className="w-full px-4 py-2.5 bg-white/70 border border-gray-200 rounded-xl text-gray-700 font-medium cursor-not-allowed focus:outline-none"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                        Status
                      </label>
                      <div className="relative">
                        {(() => {
                          const statusOptions = [
                            {
                              value: "closed",
                              title: "Follow-up Successful",
                              description:
                                "Transfer to the next stage"
                            },
                            {
                              value: "lost",
                              title: "Lead Lost",
                              description: "Lead ends as Lost"
                            },
                            {
                              value: "infollowup",
                              title: "In Follow-up",
                              description: "Keep the lead active for follow-up"
                            },
                            {
                              value: "followup_closed_and_lead_closed",
                              title: "Close Lead",
                              description: "Lead ends as Fully Closed"
                            }
                          ]
                          const selectedStatus =
                            statusOptions.find(
                              (option) => option.value === formData.followupType
                            ) || statusOptions[0]

                          const selectStatus = (followupType) => {
                            setFormData((prev) => ({
                              ...prev,
                              followupType,
                              nextfollowUpDate:
                                followupType ===
                                "followup_closed_and_lead_closed"
                                  ? ""
                                  : prev.nextfollowUpDate
                            }))

                            if (followupType !== "infollowup") {
                              setIsAllocated(false)
                            }
                            setIsdropdownOpen(false)
                          }

                          return (
                            <>
                              <button
                                type="button"
                                disabled={isAllocated}
                                onClick={() =>
                                  setIsdropdownOpen((isOpen) => !isOpen)
                                }
                                className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-left text-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed disabled:bg-gray-100"
                                aria-haspopup="listbox"
                                aria-expanded={isdropdownOpen}
                              >
                                <span className="text-sm font-medium">
                                  {selectedStatus.title}
                                </span>
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              </button>

                              {isdropdownOpen && !isAllocated && (
                                <div
                                  role="listbox"
                                  className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl"
                                >
                                  {statusOptions.map((option) => (
                                    <button
                                      key={option.value}
                                      type="button"
                                      role="option"
                                      aria-selected={
                                        option.value === formData.followupType
                                      }
                                      onClick={() => selectStatus(option.value)}
                                      className="w-full px-4 py-2.5 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                                    >
                                      <span className="block text-sm font-semibold text-gray-800">
                                        {option.title}
                                      </span>
                                      <span className="mt-0.5 block text-xs text-gray-500">
                                        {option.description}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    </div>
                  </div>

                  {formData.followupType ===
                    "followup_closed_and_lead_closed" && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      This will close the follow-up and lead, then open Lead
                      Closed.
                    </div>
                  )}

                  {/* Allocation Checkbox */}
                  {formData.followupType === "infollowup" && (
                    <label className="flex items-start gap-3 cursor-pointer bg-white/70 rounded-xl p-3.5 border border-white hover:bg-white transition-colors group">
                      <input
                        type="checkbox"
                        disabled={isdemofollownotClosed}
                        checked={isAllocated}
                        onChange={() => {
                          if (
                            formData.followupType === "closed" ||
                            formData.followupType === "lost"
                          )
                            return
                          setIsAllocated(!isAllocated)
                          setFormData((prev) => ({
                            ...prev,
                            Remarks: "",
                            nextfollowUpDate: ""
                          }))
                        }}
                        className="mt-0.5 w-4.5 h-4.5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-400 disabled:cursor-not-allowed"
                      />
                      <div>
                        <span className="text-sm font-semibold text-gray-800">
                          Enable Allocation
                        </span>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Assign a task to a team member
                        </p>
                      </div>
                    </label>
                  )}

                  {/* Allocation Details */}
                  {isAllocated && (
                    <div className="rounded-2xl p-5 bg-white/80 border border-white shadow-sm">
                      <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                        Allocation Details
                      </h3>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Allocation Type
                          </label>
                          <SearchableSelect
                            placeholder="Select type..."
                            value={demoData.selectedType}
                            options={
                              taskList
                                ?.filter((task) =>
                                  task.listed === true &&
                                  String(task.taskName || "")
                                    .replace(/[^a-z]/gi, "")
                                    .toLowerCase() !== "followup"
                                )
                                .map((task) => ({
                                  value: task._id,
                                  label: task.taskName
                                })) || []
                            }
                            onChange={(id) => {
                              const task = taskList.find((t) => t._id === id)
                              setDemodata((prev) => ({
                                ...prev,
                                selectedType: id,
                                selectedTypeName: task?.taskName
                              }))
                              setDemoError((prev) => ({
                                ...prev,
                                allocationTyperror: ""
                              }))
                            }}
                            error={demoerror.allocationTyperror}
                          />
                          {demoerror.allocationTyperror && (
                            <p className="mt-1.5 text-xs text-red-600 font-medium">
                              {demoerror.allocationTyperror}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Assign To Staff
                          </label>
                          <SearchableSelect
                            placeholder="Select staff member..."
                            value={demoData.demoallocatedTo}
                            options={allocationOptions}
                            onChange={(val) => {
                              setDemodata((prev) => ({
                                ...prev,
                                demoallocatedTo: val
                              }))
                              setDemoError((prev) => ({
                                ...prev,
                                selectStaff: ""
                              }))
                            }}
                            error={demoerror.selectStaff}
                          />
                          {demoerror.selectStaff && (
                            <p className="mt-1.5 text-xs text-red-600 font-medium">
                              {demoerror.selectStaff}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                            Completion Date
                          </label>
                          <input
                            type="date"
                            min={today}
                            value={demoData.demoallocatedDate}
                            onChange={handleDataChange}
                            name="allocationDate"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          />
                          {demoerror.allocationDate && (
                            <p className="mt-1.5 text-xs text-red-600 font-medium">
                              {demoerror.allocationDate}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Next Follow Up Date */}
                  {formData.followupType === "infollowup" && !isAllocated && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                        Next Follow Up Date
                      </label>
                      <input
                        type="date"
                        disabled={isdemofollownotClosed}
                        value={formData.nextfollowUpDate}
                        onChange={handleDataChange}
                        name="nextfollowUpDate"
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      {errors.nextfollowUpDate && (
                        <p className="mt-1.5 text-xs text-red-600 font-medium">
                          {errors.nextfollowUpDate}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Payment Section */}
                  {(formData.followupType === "closed" ||
                    formData.followupType ===
                      "followup_closed_and_lead_closed") && (
                    <div className="rounded-2xl p-5 bg-white/80 border border-white shadow-sm">
                      <label className="flex items-start gap-3 cursor-pointer group mb-1">
                        <input
                          type="checkbox"
                          checked={ishavePayment}
                          onChange={() => {
                            setcollectionUpdateModal(true)
                            setishavePayment(!ishavePayment)
                            if (ishavePayment) {
                              setcollectionupdateData({})
                            }
                          }}
                          className="mt-0.5 w-4.5 h-4.5 text-emerald-600 border-gray-300 rounded focus:ring-2 focus:ring-emerald-400"
                        />
                        <div>
                          <span className="text-sm font-semibold text-gray-800">
                            Collection Advance
                          </span>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Check if payment has been collected
                          </p>
                        </div>
                      </label>

                      {ishavePayment &&
                        selectedData &&
                        collectionupdateModal &&
                        partner &&
                        partner.length > 0 && (
                          <div className="mt-4">
                            <CollectionupdateModal
                              data={selectedData}
                              from="followup"
                              closemodal={setcollectionUpdateModal}
                              setishavePayment={setishavePayment}
                              partnerlist={partner}
                              loggedUser={loggedUser}
                              handleCollectionUpdate={handleCollectionUpdate}
                              isUpdateMode={paymentUpdatedInSession}
                            />
                          </div>
                        )}
                    </div>
                  )}

                  {/* Remarks */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                      Remarks
                    </label>
                    <textarea
                      rows={4}
                      name="Remarks"
                      value={formData.Remarks || demoData.demoDescription}
                      onChange={handleDataChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder="Add detailed remarks or notes here..."
                    />
                    {errors.Remarks && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium">
                        {errors.Remarks}
                      </p>
                    )}
                    {demoerror.demoDescription && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium">
                        {demoerror.demoDescription}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 px-7 py-4 bg-white/40 backdrop-blur-md border-t border-white/50">
                <button
                  type="button"
                  onClick={handleCloseFollowupModal}
                  className="px-6 py-2 rounded-xl text-gray-700 font-semibold bg-white/80 hover:bg-white border border-gray-200 transition-all"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    isAllocated ? handleDemoSubmit : handleFollowUpDateSubmit
                  }
                  className="px-6 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 shadow-md hover:shadow-lg transition-all disabled:opacity-60"
                >
                  {followupDateLoader || loader ? (
                    <div className="flex items-center gap-2">
                      Processing
                      <FaSpinner className="animate-spin h-4 w-4 text-white" />
                    </div>
                  ) : (
                    <span>{isHaveEditchoice ? "UPDATE" : "SUBMIT"}</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LeadFollowUp
