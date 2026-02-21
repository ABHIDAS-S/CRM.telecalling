import { useState, useEffect, useRef } from "react"
import React from "react"

import {} from "lucide-react"
import { formatDate } from "../../../utils/dateUtils"
import MyDatePicker from "../../../components/common/MyDatePicker"
import { FaSpinner } from "react-icons/fa"
import { LeadhistoryModal } from "../../../components/primaryUser/LeadhistoryModal"
import { CollectionupdateModal } from "../../../components/primaryUser/CollectionupdateModal"

import { BsFilterLeft } from "react-icons/bs"
import {
  Eye,
  Phone,
  Mail,
  User,
  Calendar,
  Clock,
  UserPlus,
  UserCheck,
  IndianRupee,
  BellRing, // Follow-up
  History, // Event Log,
  ChevronDown,
  ChevronRight,
  X
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import BarLoader from "react-spinners/BarLoader"
import api from "../../../api/api"
import { toast } from "react-toastify"
import UseFetch from "../../../hooks/useFetch"
const LeadFollowUp = () => {
  const [selectedLeadId, setSelectedLeadId] = useState(null)

  const [demoerror, setDemoError] = useState({
    selectStaff: "",
    allocationDate: "",
    demoDescription: ""
  })
  // Add this state (outside component or use useState)
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [selectedData, setselectedData] = useState(null)
  const [collectionupdateModal, setcollectionUpdateModal] = useState(false)
  const [partner, setPartner] = useState([])
  const [isdemofollownotClosed, setisdemofollowedNotClosed] = useState(false)
  const [ishavePayment, setishavePayment] = useState(false)
  const [showfollowupModal, setshowFollowupModal] = useState(false)
  const [isdropdownOpen, setIsdropdownOpen] = useState(false)
  const [taskClosed, setfollowupClosed] = useState(false)
  const [dates, setDates] = useState({ startDate: "", endDate: "" })
  const [editdemoIndex, setdemoEditIndex] = useState(null)
  const [
    editfollowUpDatesandRemarksEditIndex,
    setfollowUpDatesandRemarksEditIndex
  ] = useState(null)
  const [netTotalAmount, setnetTotalAmount] = useState(0)
  const [filterOpen, setfilterOpen] = useState(false)
  const [statusAll, setstatusAll] = useState(false)
  const [isAllocated, setIsAllocated] = useState(false) //for set allocation or not
  const [isOwner, setOwner] = useState(false)
  const [statusAllocated, setstatusAllocated] = useState(false)
  const [pending, setPending] = useState(true)
  const [allocatedLeads, setAllocatedLeads] = useState([])
  const [loader, setLoader] = useState(false)
  const [allocationOptions, setAllocationOptions] = useState([])
  const [selectedCompanyBranch, setselectedCompanyBranch] = useState("")
  const [isHaveEditchoice, setIsEditable] = useState(false)
  const [selectedDocId, setselectedDocid] = useState(null)
  const [selectedTab, setselectedTab] = useState("")
  const [hasOwnLeads, setHasownLeads] = useState(false)
  const [ownFollowUp, setOwnFollowUp] = useState(true)
  const [historyList, setHistoryList] = useState([])
  const [loggedUser, setloggedUser] = useState(null)
  const [loggedUserBranches, setloggedUserBranches] = useState([])
  const [followupDateLoader, setfollowupDateLoader] = useState(false)
  const [input, setInput] = useState("")
  const [showFullRemarks, setShowFullRemarks] = useState("")
  // const [selectedAllocates, setSelectedAllocates] = useState({})
  const [errors, setErrors] = useState({})
  const [demosubmitError, setDemofollowersubmitError] = useState({})
  const [showModal, setShowModal] = useState(false)
  const [debouncedValue, setDebouncedValue] = useState("")
  const [followupDateModal, setfollowupDateModal] = useState(false)
  const [showFullName, setShowFullName] = useState(false)
  const [showFullEmail, setShowFullEmail] = useState(false)
  const [selectedLead, setselectedLead] = useState([])
  const dropdownRef = useRef(null)
  const [tableData, setTableData] = useState([])
  const [formData, setFormData] = useState({
    followUpDate: "",
    nextfollowUpDate: "",
    followedId: "",
    followupType: "infollowup",
    Remarks: ""
  })

  const [demoData, setDemodata] = useState({
    demoallocatedTo: "",
    demoallocatedDate: "",
    demoDescription: "",
    selectedType: ""
  })
  const navigate = useNavigate()
  const { data: partners } = UseFetch("/customer/getallpartners")
  const { data: branches } = UseFetch("/branch/getBranch")
  const { data } = UseFetch("/auth/getallUsers")
  const {
    data: loggedusersallocatedleads,
    loading,
    refreshHook
  } = UseFetch(
    loggedUser &&
      selectedCompanyBranch &&
      `/lead/getallLeadFollowUp?branchSelected=${selectedCompanyBranch}&loggeduserid=${loggedUser._id}&role=${loggedUser.role}&pendingfollowup=${pending}`
  )
  useEffect(() => {
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1) // 1st day of current month
    const endDate = new Date() // 0th day of next month = last day of current

    setDates({ startDate, endDate })
  }, [statusAll])
  useEffect(() => {
    if (data && selectedCompanyBranch && partners && partners.length > 0) {
      setPartner(partners)
      const { allusers = [], allAdmins = [] } = data

      const filteredSelectedBranchStaffs = allusers.filter((user) =>
        user.selected.some((sel) => sel.branch_id === selectedCompanyBranch)
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
  useEffect(() => {
    if (branches) {
      const userData = localStorage.getItem("user")
      const user = JSON.parse(userData)
      if (user.role === "Admin") {
        if (user?.selected) {
          const branches = user.selected.map((branch) => {
            return {
              value: branch.branch_id,
              label: branch.branchName
            }
          })
          setloggedUserBranches(branches)
        } else {
          const staffbranches = branches.map((branch) => {
            return {
              value: branch._id,
              label: branch.branchName
            }
          })

          setloggedUserBranches(staffbranches)
        }
      } else {
        const branches = user.selected.map((branch) => {
          return {
            value: branch.branch_id,
            label: branch.branchName
          }
        })
        setloggedUserBranches(branches)
      }

      setloggedUser(user)
    }
  }, [branches])
  // Close dropdown on outside click
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
  useEffect(() => {
    if (loggedUserBranches && loggedUserBranches.length > 0) {
      const defaultbranch = loggedUserBranches[0]
      setselectedCompanyBranch(defaultbranch.value)
    }
  }, [loggedUserBranches, dates])
  // Close when clicking outside
  const formatdate = (date) => new Date(date).toISOString().split("T")[0]
  const getLocalDate = (date) => {
    const local = new Date(date)
    local.setMinutes(date.getMinutes() - date.getTimezoneOffset())
    return local.toISOString().split("T")[0] // e.g., "2025-06-12"
  }

  useEffect(() => {
    if (loggedusersallocatedleads && dates.endDate && loggedUser) {
      if (pending && ownFollowUp) {
        const ownFollow = loggedusersallocatedleads.followupLeads.filter(
          (lead) =>
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
        const allocatedData = normalizeTableData(nonsubmittedtakleads)
        setAllocatedLeads(allocatedData)

        const mergedall = [
          ...neverfollowupedLeads,
          ...uniqueoverdueAndcurrentdate,
          ...postdatefollowup,
          ...taskSubmittedLeads
        ]
        const Data = normalizeTableData(mergedall)
        // then store it in state
        setnetTotalAmount(TotalAmount(mergedall))

        // mergedall.forEach((item)=>)
        setTableData(Data)
      } else if (pending && !ownFollowUp) {
        const currentDate = new Date()
        const endDateLocal = getLocalDate(new Date(dates.endDate))
        formatdate(currentDate)
        const fulldatecurrent =
          formatdate(currentDate) === endDateLocal
            ? // formatdate(dates.endDate)
              formatdate(currentDate)
            : endDateLocal
        const neverfollowupedLeads =
          loggedusersallocatedleads.followupLeads.filter(
            (lead) => lead.neverfollowuped
          )
        const havenextFollowup = loggedusersallocatedleads.followupLeads.filter(
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
          ...new Set([...overdueFollowups, ...filteredcurrentdatefollowupLeads])
        ]

        const taskSubmittedLeads =
          loggedusersallocatedleads.followupLeads.filter(
            (lead) => lead.allocatedfollowup && lead.allocatedTaskClosed
          )
        const nonsubmittedtakleads =
          loggedusersallocatedleads.followupLeads.filter(
            (lead) =>
              lead.allocatedfollowup && lead.allocatedTaskClosed === false
          )
        setAllocatedLeads(nonsubmittedtakleads)

        const mergedall = [
          ...neverfollowupedLeads,
          ...uniqueoverdueAndcurrentdate,
          ...postdatefollowup,
          ...taskSubmittedLeads
        ]
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
      } else if (!pending && ownFollowUp) {
        const ownFollow = loggedusersallocatedleads.followupLeads.filter(
          (lead) =>
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
                entry.taskTo === "followup" && entry.followupClosed === true
            )
        )

        // then store it in state
        setnetTotalAmount(TotalAmount(clearedLeads))
        setTableData(clearedLeads)
      } else if (!pending && !ownFollowUp) {
        const clearedLeads = loggedusersallocatedleads.followupLeads.filter(
          (lead) =>
            Array.isArray(lead.activityLog) &&
            lead.activityLog.some(
              (entry) =>
                entry.taskTo === "followup" && entry.followupClosed === true
            )
        )

        // then store it in state
        setnetTotalAmount(TotalAmount(clearedLeads))
        setTableData(clearedLeads)
      }

      setHasownLeads(loggedusersallocatedleads.ischekCollegueLeads)
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

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(input) // this is your debounced result
    }, 2000) // 500ms debounce delay

    return () => {
      clearTimeout(handler) // cleanup
    }
  }, [input])

  const TotalAmount = (data) => {
    const total = data.reduce((total, lead) => {
      if (!Array.isArray(lead.leadFor)) return total

      // safely sum all valid netAmount values
      const leadTotal = lead.leadFor.reduce((sum, item) => {
        const amount = Number(item?.netAmount ?? 0)
        return sum + (isNaN(amount) ? 0 : amount)
      }, 0)

      return total + leadTotal
    }, 0)
    return Number(total.toFixed(2))
  }

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
      setErrors((prev) => ({ ...prev, [name]: "" })) //Clear error
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
  const handleHistory = (
    history,
    leadid,
    docId,
    allocatedTo,
    taskfromFollowup
  ) => {
    const owner = loggedUser._id === allocatedTo
    setOwner(owner)
    const isHaveDemo = taskfromFollowup ? history[history.length - 1] : null
    if (isHaveDemo) {
      const demoassignedDate = formatDate(isHaveDemo.submissionDate)
      setdemoEditIndex(history.length - 1)
      setfollowUpDatesandRemarksEditIndex(history.length - 1)
      setDemodata({
        selectedType: isHaveDemo?.taskTo,
        demoallocatedTo: isHaveDemo?.taskallocatedTo?._id,
        demoallocatedDate: isHaveDemo?.allocationDate.toString().split("T")[0],
        demoassignedDate,
        demoDescription: isHaveDemo?.remarks
      })

      // setisdemofollowedNotClosed(true)
      setIsEditable(true)
      setIsAllocated(true)
    }

    const userFollowups = history.filter(
      (item) =>
        item.submittedUser._id === loggedUser._id && item.taskBy === "followup"
    )

    const isAllFollowupsClosed =
      userFollowups.length > 0 &&
      userFollowups.every((item) => item.taskClosed === true)
    setfollowupClosed(!pending)

    setselectedDocid(docId)
    setselectedTab("History")
    setShowModal(!showModal)
    setHistoryList(history)
    setSelectedLeadId(leadid)
  }
  const handlefollowupdate = (Id, docId) => {
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
  const handleCollectionUpdate = async (formData) => {
    try {
      const response = await api.post("/lead/collectionUPdate", formData)
      if (response.status === 200) {
        return response
      }
    } catch (error) {
      toast.error("something went wrong")
      console.log("error", error.message)
    }
  }
  const handleDemoSubmit = async () => {
    if (isdemofollownotClosed) {
      setDemoError((prev) => ({
        ...prev,
        submiterror: "Cant submit, demo is not closed",
        demoDescription: ""
      }))
      return
    }
    const newError = {}
    if (demoData.demoallocatedDate === "") {
      newError.allocationDate = "Completion Date is  Required"
    }
    if (demoData.demoDescription === "") {
      newError.demoDescription = "Remarks is Required"
    }
    if (demoData.demoallocatedTo === "") {
      newError.selectStaff = "Staff is Required"
    }
    if (demoData.selectedType === "") {
      newError.allocationTyperror = "Allocation Type is Required"
    }
    if (Object.keys(newError).length > 0) {
      setDemoError(newError)
      return
    }

    try {
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
      setDemodata((prev) => ({
        ...prev,
        demoallocatedTo: "",
        demoallocatedDate: "",
        demoDescription: "",
        selectedType: ""
      }))
      refreshHook()
      toast.success(response.data.message)
      setshowFollowupModal(false)
    } catch (error) {
      toast.error("something went wrong ")
      console.log(error)
    }
  }
  const handleFollowUpDateSubmit = async () => {
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

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }
      setfollowupDateLoader(!followupDateLoader)

      const response = await api.put(
        `/lead/followupDateUpdate?selectedleaddocId=${selectedDocId}&loggeduserid=${loggedUser._id}`,
        formData
      )
      if (response.status === 200) {
        toast.success("Followup updated successfully")

        setIsEditable(false)

        setselectedDocid(null)
        setSelectedLeadId(null)
        setHistoryList([])
        setshowFollowupModal(false)
        setfollowupDateModal(false)
        setFormData((prev) => ({
          ...prev,
          followUpDate: "",
          nextfollowUpDate: "",
          netAmount: "",
          balanceAmount: "",
          followupType: "infollowup",
          Remarks: ""
        }))
        refreshHook()
        setfollowupDateLoader(false)
        return response
      } else {
        setfollowupDateLoader(false)
        toast.error("something went wrong")
      }
    } catch (error) {
      setIsEditable(false)
      setfollowupDateLoader(false)
      console.log("error:", error.message)
    }
  }
  const handleFollowUp = (Item) => {
    setshowFollowupModal(true)
    setFormData((prev) => ({
      ...prev,
      netAmount: Item.netAmount,
      balanceAmount: Item.balanceAmount,
      followUpDate: new Date().toISOString().split("T")[0]
    }))
    setselectedData(Item)

    const ishaveAllocation = Item.taskfromFollowup
      ? Item.activityLog[Item.activityLog.length - 1]
      : null
    if (ishaveAllocation) {
      setdemoEditIndex(Item.activityLog.length - 1)
      setDemodata({
        selectedType: ishaveAllocation?.taskTo,
        demoallocatedTo: ishaveAllocation?.taskallocatedTo?._id,
        demoallocatedDate: ishaveAllocation?.allocationDate
          .toString()
          .split("T")[0],
        demoassignedDate: formatDate(ishaveAllocation.submissionDate),
        demoDescription: ishaveAllocation?.remarks
      })
      // setisdemofollowedNotClosed(true)
      setIsEditable(true)
      setIsAllocated(true)
    }
    setfollowupClosed(!pending)
    setselectedDocid(Item._id)
    setSelectedLeadId(Item.leadId)
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
  const handlecloseModal = () => {
    setSelectedLeadId(null)
    setShowModal(false)
    setHistoryList([])
  }
// const renderTable = (data) => {
//   const LeadRow = ({ item, index }) => {
//     const [open, setOpen] = useState(false)

//     const lastLog = item.activityLog[item.activityLog.length - 1]
//     const followupDate =
//       pending && lastLog?.nextFollowUpDate
//         ? new Date(lastLog.nextFollowUpDate)
//             .toLocaleDateString("en-GB")
//             .split("/")
//             .join("-")
//         : "-"

//     const isAllocatedToeditable = item.activityLog.some(
//       (it) =>
//         it?.taskallocatedTo?._id === loggedUser._id &&
//         it?.taskClosed === false
//     )

//     // Total columns = 1(chevron) + 1(name) + 1(mobile) + 1(remark) + 1(followup)
//     //               + 1(eventlog) + 1(view) + (ownFollowUp?1:0) + 1(amount)
//     const totalCols = ownFollowUp ? 9 : 8

//     return (
//       <>
//         {/* ── Main row ── */}
//         <tr
//           onClick={() => setOpen((v) => !v)}
//           className="cursor-pointer bg-white hover:bg-blue-50 transition-colors border border-gray-300"
//         >
//           <td className="pl-2 pr-1 py-2 w-5 border border-gray-300">
//             {open
//               ? <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
//               : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
//           </td>
//           <td className="px-3 py-2 font-semibold text-gray-900 text-sm border border-gray-300 whitespace-nowrap">
//             {item.customerName.customerName}
//           </td>
//           <td className="px-3 py-2 text-gray-700 text-sm border border-gray-300 whitespace-nowrap">
//             {item?.mobile}
//           </td>
//           <td className="px-3 py-2 text-sm border border-gray-300 max-w-[200px]">
//             <span className="text-red-600 font-medium truncate block" title={lastLog?.remarks}>
//               {lastLog?.remarks || "-"}
//             </span>
//           </td>
//           <td className="px-3 py-2 text-sm text-gray-700 border border-gray-300 whitespace-nowrap">
//             {followupDate}
//           </td>
//           <td className="px-2 py-2 border border-gray-300" onClick={(e) => e.stopPropagation()}>
//             <button
//               type="button"
//               onClick={() => handleHistory(item?.activityLog, item.leadId, item?._id, item?.allocatedTo?._id, item?.taskfromFollowup)}
//               className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors w-full justify-center"
//             >
//               <BellRing className="w-3.5 h-3.5" />
//             </button>
//           </td>
//           <td className="px-2 py-2 border border-gray-300" onClick={(e) => e.stopPropagation()}>
//             <button
//               type="button"
//               onClick={() =>
//                 loggedUser.role === "Admin"
//                   ? navigate("/admin/transaction/lead/leadEdit", { state: { leadId: item._id, isReadOnly: !isAllocatedToeditable } })
//                   : navigate("/staff/transaction/lead/leadEdit", { state: { leadId: item._id, isReadOnly: !isAllocatedToeditable } })
//               }
//               className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors w-full justify-center"
//             >
//               <Eye className="w-3.5 h-3.5" /> 
//             </button>
//           </td>
//           {ownFollowUp && (
//             <td className="px-2 py-2 border border-gray-300" onClick={(e) => e.stopPropagation()}>
//               <button
//                 type="button"
//                 onClick={() => handleFollowUp(item)}
//                 className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-amber-500 rounded hover:bg-amber-600 transition-colors w-full justify-center"
//               >
//                 <History className="w-3.5 h-3.5" /> 
//               </button>
//             </td>
//           )}
//           <td className="px-3 py-2 text-sm font-semibold text-green-700 border border-gray-300 whitespace-nowrap text-right">
//             <span className="inline-flex items-center gap-0.5 justify-end">
//               <IndianRupee className="w-3.5 h-3.5" />
//               {item.netAmount?.toLocaleString("en-IN")}
//             </span>
//           </td>
//         </tr>

//         {/* ── Expanded rows ── */}
//         {open && (
//           <>
//             {/* Sub-header row */}
//             {/* Columns: chevron | leadby | assignedto | assignedby | followups | leaddate | leadid(blue) | phone(blue) | email(blue) */}
//             <tr className="text-xs font-medium border border-gray-300">
//               <td className="border border-gray-300 bg-gray-100" />
//               <td className="px-3 py-1 border border-gray-300 bg-gray-100 text-gray-600">
//                 <div className="flex items-center gap-1">
//                   <User className="w-3.5 h-3.5 text-blue-600" />
//                   <span>Lead by</span>
//                 </div>
//               </td>
//               <td className="px-3 py-1 border border-gray-300 bg-gray-100 text-gray-600">
//                 <div className="flex items-center gap-1">
//                   <UserCheck className="w-3.5 h-3.5 text-green-600" />
//                   <span>Assigned to</span>
//                 </div>
//               </td>
//               <td className="px-3 py-1 border border-gray-300 bg-gray-100 text-gray-600">
//                 <div className="flex items-center gap-1">
//                   <UserPlus className="w-3.5 h-3.5 text-purple-600" />
//                   <span>Assigned by</span>
//                 </div>
//               </td>
//               <td className="px-3 py-1 border border-gray-300 bg-gray-100 text-gray-600">
//                 <div className="flex items-center gap-1">
//                   <Clock className="w-3.5 h-3.5 text-orange-600" />
//                   <span>No. of Followups</span>
//                 </div>
//               </td>
//               <td className="px-3 py-1 border border-gray-300 bg-gray-100 text-gray-600">
//                 <div className="flex items-center gap-1">
//                   <Calendar className="w-3.5 h-3.5 text-blue-500" />
//                   <span>Lead Date</span>
//                 </div>
//               </td>
//               <td className="px-3 py-1 border border-gray-300 bg-blue-600 text-white">
//                 <span>Lead ID</span>
//               </td>
//               <td className="px-3 py-1 border border-gray-300 bg-blue-600 text-white">
//                 <div className="flex items-center gap-1">
//                   <Phone className="w-3.5 h-3.5" />
//                   <span>Phone</span>
//                 </div>
//               </td>
//               <td className="px-3 py-1 border border-gray-300 bg-blue-600 text-white">
//                 <div className="flex items-center gap-1">
//                   <Mail className="w-3.5 h-3.5" />
//                   <span>Email</span>
//                 </div>
//               </td>
//             </tr>

//             {/* Sub-data row */}
//             <tr className="bg-white text-xs border border-b-2 border-gray-300 border-b-gray-400">
//               <td className="border border-gray-300" />
//               <td className="px-3 py-1.5 border border-gray-300 text-gray-800 font-medium">
//                 {item?.leadBy?.name || "-"}
//               </td>
//               <td className="px-3 py-1.5 border border-gray-300 text-gray-700">
//                 {item?.allocatedTo?.name || "-"}
//               </td>
//               <td className="px-3 py-1.5 border border-gray-300 text-gray-700">
//                 {item?.allocatedBy?.name || "-"}
//               </td>
//               <td className="px-3 py-1.5 border border-gray-300 text-gray-700">
//                 {item.activityLog.length}
//               </td>
//               <td className="px-3 py-1.5 border border-gray-300 text-gray-700">
//                 {item.leadDate?.toString().split("T")[0] || "-"}
//               </td>
//               <td className="px-3 py-1.5 border border-gray-300 font-bold text-blue-700">
//                 {item?.leadId}
//               </td>
//               <td className="px-3 py-1.5 border border-gray-300 text-gray-700">
//                 {item?.phone || "-"}
//               </td>
//               <td className="px-3 py-1.5 border border-gray-300 text-gray-600">
//                 {item?.email || "-"}
//               </td>
//             </tr>
//           </>
//         )}
//       </>
//     )
//   }

//   return (
//     <table className="border-collapse border border-gray-300 w-full text-sm">
//       <thead className="whitespace-nowrap bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-30 text-xs">
//         <tr>
//           <th className="border border-gray-300 w-5" />
//           <th className="border border-gray-300 px-3 py-1 text-left">
//             <div className="flex items-center gap-1.5"><User className="w-3 h-3" /><span>Name</span></div>
//           </th>
//           <th className="border border-gray-300 px-3 py-1 text-left min-w-[130px]">
//             <div className="flex items-center gap-1.5"><Phone className="w-3 h-3" /><span>Mobile</span></div>
//           </th>
//           <th className="border border-gray-300 px-3 py-1 text-left">
//             <span>Last Remark</span>
//           </th>
//           <th className="border border-gray-300 px-3 py-1 text-left">
//             <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /><span>Followup Date</span></div>
//           </th>
//           <th className="border border-gray-300 px-3 py-1 text-center">Event Log</th>
//           <th className="border border-gray-300 px-3 py-1 text-center">View/Modify</th>
//           {ownFollowUp && <th className="border border-gray-300 px-3 py-1 text-center">Follow Up</th>}
//           <th className="border border-gray-300 px-3 py-1 text-right">
//             <div className="flex items-center gap-1.5 justify-end"><IndianRupee className="w-3 h-3" /><span>Net Amount</span></div>
//           </th>
//         </tr>
//       </thead>
//       <tbody>
//         {data?.length > 0 ? (
//           data.map((item, index) => (
//             <LeadRow key={item._id ?? index} item={item} index={index} />
//           ))
//         ) : (
//           <tr>
//             <td colSpan={9} className="text-center text-gray-500 py-6">
//               {loading ? (
//                 <div className="flex justify-center">
//                   <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
//                 </div>
//               ) : (
//                 <div>No Leads</div>
//               )}
//             </td>
//           </tr>
//         )}
//       </tbody>
//     </table>
//   )
// }//selected wtih lead datae


  

  ///
  const renderTable = (data) => (
    <table className="border-collapse border border-gray-300 w-full text-sm">
      <thead className="whitespace-nowrap bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-30 text-xs">
        <tr>
          <th className="border border-gray-300 px-3 py-1 text-left">
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3" />
              <span>Name</span>
            </div>
          </th>
          <th className="border border-gray-300 px-3 py-2 min-w-[140px] text-left">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3" />
              <span>Mobile</span>
            </div>
          </th>
          <th className="border border-gray-300 px-3 py-2 text-left">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3" />
              <span>Phone</span>
            </div>
          </th>
          <th className="border border-gray-300 px-3 py-1 text-left">
            <div className="flex items-center gap-1.5">
              <Mail className="w-3 h-3" />
              <span>Email</span>
            </div>
          </th>
          <th className="border border-gray-300 px-3 py-1 min-w-[90px] text-left">
            Lead Id
          </th>
          <th className="border border-gray-300 px-3 py-1">
            <div className="flex items-center gap-1.5 justify-center">
              <Calendar className="w-3 h-3" />
              <span>Followup Date</span>
            </div>
          </th>
          <th className="border border-gray-300 px-3 py-1 min-w-[90px]">
            Action
          </th>
          <th className="border border-gray-300 px-3 py-1">Net Amount</th>
        </tr>
      </thead>
      <tbody>
        {data?.length > 0 ? (
          data.map((item, index) => (
            <React.Fragment key={index}>
              <tr className="bg-white border border-b-0 border-gray-300 hover:bg-blue-50 transition-colors">
                <td
                  onClick={() => setShowFullName(!showFullName)}
                  className={`px-3 min-w-[120px] py-1 cursor-pointer overflow-hidden font-medium text-gray-900 ${
                    showFullName
                      ? "whitespace-normal max-h-[3em]"
                      : "truncate whitespace-nowrap max-w-[120px]"
                  }`}
                  style={{ lineHeight: "1.5em" }}
                >
                  {item.customerName.customerName}
                </td>
                <td className="px-3 py-1 text-gray-700">{item?.mobile}</td>
                <td className="px-3 py-1 text-gray-700">{item?.phone}</td>
                <td className="px-3 py-1 text-gray-600 truncate max-w-[180px]">
                  {item?.email}
                </td>
                <td className="px-3 py-1 font-medium text-blue-700">
                  {item?.leadId}
                </td>
                <td className="border border-b-0 border-gray-300 px-3 py-1"></td>
                <td className="border border-b-0 border-gray-300 px-2 py-1 text-center">
                  <button
                    // onClick={() => handleViewModify(item)}
                    type="button"
                    onClick={() =>
                      handleHistory(
                        item?.activityLog,
                        item.leadId, //like 00001
                        item?._id, //lead doc id
                        item?.allocatedTo?._id,
                        item?.taskfromFollowup
                      )
                    }
                    className="inline-flex items-center gap-1 px-2  py-1 text-xs font-semibold text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors w-full justify-center"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    Event Log
                  </button>
                </td>
                <td className="border border-b-0 border-gray-300 px-3 py-1"></td>
              </tr>

              <tr className="font-medium bg-gradient-to-r from-gray-100 to-gray-50 text-xs text-gray-600">
                <td className="px-3 py-1 border-t border-gray-200">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Lead by</span>
                  </div>
                </td>
                <td className="px-3 py-1 border-t border-gray-200">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-green-600" />
                    <span>Assigned to</span>
                  </div>
                </td>
                <td className="px-3 py-1 border-t border-gray-200 text-nowrap">
                  <div className="flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-purple-600" />
                    <span>Assigned by</span>
                  </div>
                </td>
                <td className="px-3 py-1 border-t border-gray-200">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-600" />
                    <span>No. of Followups</span>
                  </div>
                </td>
                <td className="px-3 py-1 border-t border-gray-200 min-w-[120px]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Lead Date</span>
                  </div>
                </td>
                <td className="border border-t-0 border-b-0 border-gray-300 px-3  bg-white text-center text-lg font-semibold">
                  {pending &&
                  item.activityLog[item.activityLog.length - 1]
                    ?.nextFollowUpDate
                    ? new Date(
                        item.activityLog[
                          item.activityLog.length - 1
                        ]?.nextFollowUpDate
                      )
                        .toLocaleDateString("en-GB")
                        .split("/")
                        .join("-")
                    : "-"}
                </td>
                <td className="border border-t-0 border-b-0 border-gray-300 px-2 py-1 bg-white">
                  <button
                    onClick={() => {
                      const isAllocatedToeditable = item.activityLog.some(
                        (it) =>
                          it?.taskallocatedTo?._id === loggedUser._id &&
                          it?.taskClosed === false
                      )

                      loggedUser.role === "Admin"
                        ? navigate("/admin/transaction/lead/leadEdit", {
                            state: {
                              leadId: item._id,
                              isReadOnly: !isAllocatedToeditable
                            }
                          })
                        : navigate("/staff/transaction/lead/leadEdit", {
                            state: {
                              leadId: item._id,
                              isReadOnly: !isAllocatedToeditable
                            }
                          })
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors w-full justify-center"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View/Modify
                  </button>
                </td>
                <td className="border border-t-0 border-b-0 border-gray-300 px-3  bg-white font-semibold">
                  <div className="flex items-center justify-center">
                    <IndianRupee className="w-4 h-3.5 text-green-600 mr-1" />
                    <span className="text-lg font-semibold">
                      {" "}
                      {item.netAmount}
                    </span>
                  </div>
                </td>
              </tr>

              <tr className="bg-white">
                <td className="border border-t-0 border-gray-300 px-3 py-1.5 text-gray-900">
                  {item?.leadBy?.name}
                </td>
                <td className="border border-t-0 border-gray-300 px-3 py-1.5 text-gray-700">
                  {item?.allocatedTo?.name || "-"}
                </td>
                <td className="border border-t-0 border-gray-300 px-3 py-1.5 text-gray-700">
                  {item.allocatedBy?.name || "-"}
                </td>
                <td className="border border-t-0 border-gray-300 px-3 py-1.5 text-gray-700"></td>
                <td className="border border-t-0 border-gray-300 px-3 py-1.5 text-gray-900">
                  {item.leadDate?.toString().split("T")[0]}
                </td>
                <td className="border border-t-0 border-b-0 border-gray-300 px-3 py-1.5"></td>
                <td className="border border-t-0 border-b-0 border-gray-300 px-2 py-1.5">
                  {ownFollowUp && (
                    <button
                      onClick={() => handleFollowUp(item)}
                      className="inline-flex items-center gap-1 px-2  py-1 text-xs font-semibold text-white bg-amber-500 rounded hover:bg-amber-600 transition-colors w-full justify-center"
                    >
                      <History className="w-3.5 h-3.5" />
                      Follow Up
                    </button>
                  )}
                </td>
                <td className="border border-t-0 border-b-0 border-gray-300 px-3 py-1.5"></td>
              </tr>
              {pending && (
                <tr className="font-medium bg-gradient-to-r from-gray-100 to-gray-50 text-xs text-gray-600">
                  <td
                    colSpan={5}
                    className="px-3 py-1 border-t border-gray-200"
                  >
                    <span>Last Remark :</span>
                    <span className="ml-2 text-red-600">
                      {
                        item?.activityLog[item?.activityLog?.length - 1]
                          ?.remarks
                      }
                    </span>
                  </td>

                  <td className="border border-t-0 border-b-0 border-gray-300 px-3 bg-white"></td>
                  <td className="border border-t-0 border-b-0 border-gray-300 px-2 py-1 bg-white"></td>
                  <td className="border border-t-0 border-b-0 border-gray-300 px-3 bg-white"></td>
                </tr>
              )}

              {index !== tableData.length - 1 && (
                <tr>
                  <td colSpan="8" className="bg-gray-300">
                    <div className="h-[2px]"></div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))
        ) : (
          <tr>
            <td colSpan={8} className="text-center text-gray-500 py-6">
              {loading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
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
  

  return (
    <div className="h-full flex flex-col ">
      {loading && (
        <BarLoader
          cssOverride={{ width: "100%", height: "4px" }} // Tailwind's `h-4` corresponds to `16px`
          color="#4A90E2" // Change color as needed
        />
      )}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mx-3 md:mx-5 mt-3 mb-3 gap-4">
        {/* Title */}
        <h2 className="text-lg font-bold">Lead Follow Up</h2>

        {/* Right Section */}
        <div className="grid grid-cols-2 md:flex md:flex-nowrap md:gap-6 gap-3 md:items-center w-full md:w-auto">
          {/* Date Picker */}
          {dates.startDate && (
            <div className="w-full ">
              <MyDatePicker setDates={setDates} dates={dates} />
            </div>
          )}
          {/* Filter Button */}
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
              <div className="absolute top-full right-0 mt-2 w-72 bg-white  border border-gray-200 rounded-xl shadow-2xl z-50 p-4 space-y-5 animate-fade-in-down">
                <h3 className="text-base font-semibold text-gray-800 border-b pb-2">
                  Filters
                </h3>

                {/* Filter Toggles */}
                {[
                  {
                    label: statusAll ? "All Leads" : "Filtered Leads",
                    value: statusAll,
                    toggle: () => {
                      setstatusAll(!statusAll)
                      setTableData([])
                      setAllocatedLeads([])
                    },
                    show: false
                  },
                  {
                    label: "Task Allocated Followups",

                    value: statusAllocated,
                    toggle: () => {
                      setstatusAllocated(!statusAllocated)
                      setTableData([])
                      setAllocatedLeads([])
                    },
                    show: pending === true // 👈 show only when pending is true
                  },
                  {
                    label: pending ? "Pending Followup" : "Cleared Followup",
                    value: pending,
                    toggle: () => {
                      setPending(!pending)
                      setTableData([])
                      setAllocatedLeads([])
                    },
                    show: true
                  },
                  {
                    label: ownFollowUp ? "Own Followup" : "All Followup",
                    value: ownFollowUp,
                    toggle: () => {
                      setOwnFollowUp(!ownFollowUp)
                      setTableData([])
                      setAllocatedLeads([])
                    },
                    show: loggedUser?.role !== "Staff" //hide for staff
                  }
                ]
                  .filter((item) => item.show) //only show allowed toggles
                  .map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm font-medium text-gray-700 group"
                    >
                      <span
                        className={`transition ${
                          // Apply blur ONLY for Allocated Leads when inactive
                          item.label === "Task Allocated Followups" &&
                          !item.value
                            ? "text-gray-400 opacity-60 blur-[1px]"
                            : "text-gray-700 group-hover:text-black"
                        }`}
                      >
                        {item.label}
                      </span>
                      <button
                        onClick={item.toggle}
                        className={`${
                          item.value ? "bg-emerald-400" : "bg-gray-300"
                        } w-8 h-5 flex items-center rounded-full transition-colors duration-300`}
                      >
                        <div
                          className={`${
                            item.value ? "translate-x-3" : "translate-x-0"
                          } w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300`}
                        />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
          {/* Branch Dropdown */}
          <select
            value={selectedCompanyBranch || ""}
            onChange={(e) => setselectedCompanyBranch(e.target.value)}
            className="border border-gray-300 py-0.5 rounded-md px-2 focus:outline-none w-36 md:min-w-[120px] cursor-pointer"
          >
            {loggedUserBranches?.map((branch) => (
              <option key={branch.value} value={branch.value}>
                {branch.label}
              </option>
            ))}
          </select>
          {/* New Lead Button */}
          <div className="flex justify-end">
            {" "}
            <button
              onClick={() =>
                loggedUser.role === "Admin"
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
      <div className="flex justify-end mr-5">
        <span className="text-blue-700">Total Amount -</span>
        <div className="flex items-center ml-1">
          <IndianRupee className="w-3 h-3 text-green-600 mr-1" />
          <span>{netTotalAmount}</span>
        </div>
      </div>
      {/* Responsive Table Container */}
      <div className="flex-1 overflow-x-auto rounded-lg overflow-y-auto shadow-xl mx-2 md:mx-3 mb-3">
        <>
          {(() => {
            const currentData = statusAllocated ? allocatedLeads : tableData
            const hasLeads =
              Array.isArray(currentData) &&
              currentData.some(
                (group) => Array.isArray(group.leads) && group.leads.length > 0
              )

            if (!hasLeads) {
              return (
                <div className="text-center text-gray-500 py-6">
                  No Leads Available
                </div>
              )
            }

            return currentData.map(({ staffName, leads }, index) => (
              <div key={staffName || `group-${index}`} className="mb-6">
                {staffName && (
                  <h3 className="text-base font-semibold text-gray-800 mb-2">
                    {staffName}{" "}
                    <span className="text-sm text-gray-500">
                      ({leads?.length || 0} Leads)
                    </span>
                  </h3>
                )}

                {/* only render table if there are leads */}
                {leads.length > 0 ? (
                  renderTable(leads)
                ) : (
                  <div className="text-center text-gray-400 py-3 text-sm">
                    No leads under {staffName || "this group"}.
                  </div>
                )}
              </div>
            ))
          })()}
        </>
      </div>
      {showModal && (
        <LeadhistoryModal
          historyList={historyList}
          selectedLeadId={selectedLeadId}
          handlecloseModal={handlecloseModal}
        />
      )}

      {showfollowupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-gray-50">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Follow-Up Management
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Update and manage follow-up details
                </p>
              </div>
              <div className="text-lg font-semibol">
                <span>Lead ID :</span>

                <span className="ml-1">{selectedLeadId}</span>
              </div>

              <button
                type="button"
                onClick={() => setshowFollowupModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-2">
                {/* Follow Up Date - Read Only */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Follow Up Date
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={
                          demoData.demoassignedDate
                            ? demoData.demoassignedDate.toString().split("T")[0]
                            : formData?.followUpDate
                              ? new Date(formData.followUpDate)
                                  .toLocaleDateString("en-GB") // this gives dd/mm/yyyy
                                  .replace(/\//g, "-") // change / to -
                              : ""
                        }
                        className="w-full px-4 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium cursor-not-allowed focus:outline-none"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">
                      Status
                    </label>
                    <div className="relative">
                      <select
                        disabled={isAllocated}
                        value={formData.followupType}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            followupType: e.target.value
                          }))
                        }
                        onFocus={() => setIsdropdownOpen(true)}
                        onBlur={() => setIsdropdownOpen(false)}
                        className="w-full appearance-none px-4 py-1.5 pr-10 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        <option value="infollowup">In Follow-up</option>
                        <option value="closed">Closed</option>
                        <option value="lost">Lost</option>
                      </select>
                      <ChevronDown
                        className={`absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none transition-transform duration-200 ${
                          isdropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Allocation Checkbox */}
                {formData.followupType === "infollowup" && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-2">
                    <label className="flex items-start cursor-pointer group">
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
                        className="mt-0.5 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                          Enable Allocation
                        </span>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Assign a Task to a team member
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                {/* Allocation Details */}
                {isAllocated && (
                  <div className="border-2 border-blue-200 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <h3 className="text-sm font-bold text-gray-800 mb-1 flex items-center">
                      <div className="w-1 h-5 bg-blue-600 rounded mr-2"></div>
                      Allocation Details
                    </h3>

                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Allocation Type
                        </label>
                        <select
                          // disabled={isdemofollownotClosed}
                          value={demoData.selectedType}
                          onChange={(e) => {
                            setDemodata((prev) => ({
                              ...prev,
                              selectedType: e.target.value
                            }))
                            setDemoError((prev) => ({
                              ...prev,
                              allocationTyperror: ""
                            }))
                          }}
                          className="w-full px-4 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">Select allocation type...</option>
                          <option value="programming">Programming</option>
                          <option value="testing-&-implementation">
                            Testing & Implementation
                          </option>
                          <option value="coding-&-testing">
                            Coding & Testing
                          </option>
                          <option value="software-services">
                            Software Service
                          </option>
                          <option value="customermeet">Customer Meet</option>
                          <option value="demo">Demo</option>
                          <option value="training">Training</option>
                          <option value="onsite">Onsite</option>
                          <option value="office">Office</option>
                        </select>
                        {demoerror.allocationTyperror && (
                          <p className="mt-1.5 text-xs text-red-600 font-medium">
                            {demoerror.allocationTyperror}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Assign To Staff
                        </label>
                        <select
                          // disabled={isdemofollownotClosed}
                          value={demoData.demoallocatedTo}
                          onChange={(e) => {
                            setDemodata((prev) => ({
                              ...prev,
                              demoallocatedTo: e.target.value
                            }))
                            setDemoError((prev) => ({
                              ...prev,
                              selectStaff: ""
                            }))
                          }}
                          className="w-full px-4 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">Select staff member...</option>
                          {allocationOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        {demoerror.selectStaff && (
                          <p className="mt-1.5 text-xs text-red-600 font-medium">
                            {demoerror.selectStaff}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                          Completion Date
                        </label>
                        <input
                          type="date"
                          // disabled={isdemofollownotClosed}
                          value={demoData.demoallocatedDate}
                          onChange={handleDataChange}
                          name="allocationDate"
                          className="w-full px-4 py-1.5 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                      Next Follow Up Date
                    </label>
                    <input
                      type="date"
                      disabled={isdemofollownotClosed}
                      value={formData.nextfollowUpDate}
                      onChange={handleDataChange}
                      name="nextfollowUpDate"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    {errors.nextfollowUpDate && (
                      <p className="mt-1.5 text-xs text-red-600 font-medium">
                        {errors.nextfollowUpDate}
                      </p>
                    )}
                  </div>
                )}

                {/* Payment Section */}
                {formData.followupType === "closed" && (
                  <div className="border-2 border-green-200 rounded-xl p-5 bg-gradient-to-br from-green-50 to-emerald-50">
                    <label className="flex items-start cursor-pointer group mb-4">
                      <input
                        type="checkbox"
                        checked={ishavePayment}
                        onChange={() => {
                          setcollectionUpdateModal(true)
                          setishavePayment(!ishavePayment)
                        }}
                        className="mt-0.5 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-2 focus:ring-green-500"
                      />
                      <div className="ml-3">
                        <span className="text-sm font-semibold text-gray-800 group-hover:text-green-700 transition-colors">
                          Payment Received
                        </span>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Check if payment has been collected
                        </p>
                      </div>
                    </label>

                    {ishavePayment &&
                      selectedData &&
                      collectionupdateModal &&
                      partner &&
                      partner.length > 0 && (
                        <CollectionupdateModal
                          data={selectedData}
                          closemodal={setcollectionUpdateModal}
                          partnerlist={partner}
                          loggedUser={loggedUser}
                          setishavePayment={setishavePayment}
                          handleCollectionUpdate={handleCollectionUpdate}
                        />
                        // <div className="space-y-4 pt-3 border-t border-green-200">
                        //   <div className="grid grid-cols-2 gap-4">
                        //     <div>
                        //       <label className="block text-xs font-semibold text-gray-700 mb-2">
                        //         Net Amount
                        //       </label>
                        //       <input
                        //         type="number"
                        //         disabled
                        //         value={formData.netAmount}
                        //         className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 font-semibold cursor-not-allowed"
                        //       />
                        //     </div>

                        //     <div>
                        //       <label className="block text-xs font-semibold text-gray-700 mb-2">
                        //         Balance Amount
                        //       </label>
                        //       <input
                        //         type="number"
                        //         disabled
                        //         value={formData.balanceAmount}
                        //         className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 font-semibold cursor-not-allowed"
                        //       />
                        //     </div>
                        //   </div>

                        //   <div>
                        //     <label className="block text-xs font-semibold text-gray-700 mb-2">
                        //       Received Amount
                        //     </label>
                        //     <input
                        //       type="number"
                        //       value={formData.recievedAmount}
                        //       onChange={(e) => {
                        //         if (errors.recievedAmount) {
                        //           setErrors((prev) => ({
                        //             ...prev,
                        //             recievedAmount: ""
                        //           }))
                        //         }
                        //         setFormData((prev) => ({
                        //           ...prev,
                        //           recievedAmount: e.target.value
                        //         }))
                        //       }}
                        //       className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        //       placeholder="Enter received amount..."
                        //     />
                        //     {errors.recievedAmount && (
                        //       <p className="mt-1.5 text-xs text-red-600 font-medium">
                        //         {errors.recievedAmount}
                        //       </p>
                        //     )}
                        //   </div>
                        // </div>
                      )}
                  </div>
                )}

                {/* Remarks */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
                    Remarks
                  </label>
                  <textarea
                    rows={4}
                    // disabled={isdemofollownotClosed}
                    name="Remarks"
                    value={formData.Remarks || demoData.demoDescription}
                    onChange={handleDataChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
            <div className="flex items-center justify-end gap-3 px-6 py-2 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={() => setshowFollowupModal(false)}
                className="px-6 py-1.5 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 hover:border-gray-400 transition-all"
              >
                Cancel
              </button>
              {/* <button className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all">
                Save Changes
              </button> */}

              <button
                onClick={
                  isAllocated ? handleDemoSubmit : handleFollowUpDateSubmit
                }
                className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all"
              >
                {followupDateLoader || loader ? (
                  <div className="flex items-center">
                    Processing
                    <FaSpinner className="animate-spin h-5 w-5  text-white ml-2" />
                  </div>
                ) : (
                  <div>{isHaveEditchoice ? "UPDATE" : "SUBMIT"}</div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeadFollowUp
