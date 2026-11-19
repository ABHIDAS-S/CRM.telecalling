import { useState, useEffect, useRef } from "react"
import { useLocation } from "react-router-dom"
import React from "react"
import { toast } from "react-toastify"
import { PropagateLoader } from "react-spinners"
import { FaSpinner } from "react-icons/fa"
import SkeletonTable from "../../../components/loader/SkeletonTable"
import NoDataAvailable from "../../../components/NodataAvailable"
import { useNavigate, useParams } from "react-router-dom"
import BarLoader from "react-spinners/BarLoader"
import { useSelector } from "react-redux"
import api from "../../../api/api"
import Select, { components } from "react-select"
import { CollectionupdateModal } from "../../../components/primaryUser/CollectionupdateModal"
import UseFetch from "../../../hooks/useFetch"
import { PerformanceModal } from "../../../components/primaryUser/PerformanceModal"
import { StaticSidebar } from "../../../components/primaryUser/StaticSidebar"
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
  BellRing,
  History,
  ClipboardCheck,
  ChevronDown,
  ChevronRight,
  X
} from "lucide-react"
import AdminHeader from "../../../header/AdminHeader"
import StaffHeader from "../../../header/StaffHeader"
import { getLocalStorageItem } from "../../../helper/localstorage"

const CODING_AND_QC_TASK_ID = "689c23493e94902039b97743"

const CloseOnMouseLeaveMenu = (props) => (
  <components.Menu
    {...props}
    innerProps={{
      ...props.innerProps,
      onMouseLeave: () => props.selectProps.onMenuMouseLeave?.()
    }}
  />
)

const ReallocationTable = () => {
  const reduxselectedBranch = useSelector(
    (branch) => branch.companyBranch.selectedBranch
  )
  console.log(reduxselectedBranch)
  console.log("hd")
  const { label } = useParams()
  console.log(label)
  // A lead is completed only when its current Reallocation task has a completed
  // activity-log entry. A missing task entry is deliberately treated as pending.
  const [status, setStatus] = useState("completed")
  const [openSelectId, setOpenSelectId] = useState(null)

  const [toggleLoading, setToggleLoading] = useState(false)
  const [isClosed, setIsclosed] = useState(false)
  console.log(isClosed)
  const [selectedLeadId, setselectedLeadId] = useState(null)
  const [selectedType, setselectedType] = useState(null)
  const [selectedData, setselectedData] = useState({})
  const [showModal, setShowmodal] = useState(false)
  const [partner, setpartner] = useState([])
  const [submiterror, setsubmitError] = useState("")
  const [selectedAllocationType, setselectedAllocationType] = useState({})
  const [selectedAllocationtypeNames, setselectedallocatiotypeNames] = useState(
    {}
  )
  const [activeUserId, setActiveUserId] = useState(null)
  const [validateError, setValidateError] = useState({})
  const [validatetypeError, setValidatetypeError] = useState({})
  const [loggedUserBranches, setLoggeduserBranches] = useState([])
  const [selectedCompanyBranch, setSelectedCompanyBranch] = useState(null)
  const [showFullEmail, setShowFullEmail] = useState(false)
  const [approvedToggleStatus, setapprovedToggleStatus] = useState(false)
  const [submitLoading, setsubmitLoading] = useState(false)
  const [allocationOptions, setAllocationOptions] = useState([])
  const [rndAllocationOptions, setRndAllocationOptions] = useState([])
  const [selectedAllocates, setSelectedAllocates] = useState({})
  const [loggedUser, setLoggedUser] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [tableData, setTableData] = useState([])
  const [lostLead, setLostLead] = useState(null)
  const [lostRemarks, setLostRemarks] = useState("")
  const [lostError, setLostError] = useState("")
  const [lostSubmitting, setLostSubmitting] = useState(false)
  const [selectedCategory, setselectedCategory] = useState(null)
  const [selectedDatapopup, setselectedDataPopup] = useState({})
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))
  const [periodMode, setperiodMode] = useState("all")
  const [targetData, settargetData] = useState([])
  console.log(targetData)
  const [openModal, setOpenModal] = useState(false)
  const [productlist, setproductList] = useState([])
  const [achievedproducts, setacheivedProducts] = useState([])
  const [selectedPeriod, setselectedPeriod] = useState("")
  const [selectedUserName, setselecteduserName] = useState(null)
  const { data: branches } = UseFetch("/branch/getBranch")
  const location = useLocation()
  const { id } = location.state || {}
  const [formData, setFormData] = useState({
    allocationDate: "",
    allocationDescription: ""
  })
  const {
    data: leadreallocation,
    loading,
    refreshHook
  } = UseFetch(
    loggedUser &&
      reduxselectedBranch &&
      `/lead/getallreallocatedLead?selectedBranch=${reduxselectedBranch}&role=${loggedUser.role}`
  )
  const { data: branchProduct } = UseFetch(
    `/product/getallbranchProduct?branch=${reduxselectedBranch}`
  )
  const { data: tasks } = UseFetch("/lead/getallTask")
  console.log(tasks)
  console.log(leadreallocation)
  const { data } = UseFetch("/auth/getallUsers")
  const { data: partners } = UseFetch("/customer/getallpartners")
  const navigate = useNavigate()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    const user = JSON.parse(userData)
    setLoggedUser(user)
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
    if (loggedUser && branches && branches.length > 0) {
      if (loggedUser.role === "Admin") {
        const isselctedArray = loggedUser?.selected
        if (isselctedArray) {
          const loggeduserBranches = loggedUser.selected.map((item) => {
            return { value: item.branch_id, label: item.branchName }
          })
          setLoggeduserBranches(loggeduserBranches)
          setSelectedCompanyBranch(id)
        } else {
          const loggeduserBranches = branches.map((item) => {
            return { value: item._id, label: item.branchName }
          })
          setLoggeduserBranches(loggeduserBranches)
          setSelectedCompanyBranch(id)
        }
      } else {
        const loggeduserBranches = loggedUser.selected.map((item) => {
          return { value: item.branch_id, label: item.branchName }
        })
        setLoggeduserBranches(loggeduserBranches)
        setSelectedCompanyBranch(id)
      }
    }
  }, [loggedUser, branches])
  useEffect(() => {
    if (data && selectedCompanyBranch) {
      const { allusers = [], allAdmins = [] } = data

      // Combine allusers and allAdmins

      const filter = allusers.filter(
        (staff) =>
          staff.isVerified === true 
          // staff.selected.some((s) => selectedCompanyBranch === s.branch_id)
      )
      const combinedUsers = [...filter, ...allAdmins]
      setAllocationOptions(
        combinedUsers.map((item) => ({
          value: item._id,
          label: item.name
        }))
      )

      setRndAllocationOptions(
        allusers
          .filter(
            (staff) =>
              staff.isVerified === true &&
              staff.department?.department?.trim().toLowerCase() ===
                "research and development"
          )
          .map((staff) => ({ value: staff._id, label: staff.name }))
      )
    }
  }, [data, selectedCompanyBranch])
  useEffect(() => {
    // Clear branch-specific rows and row selections before the next branch's
    // request completes so the old branch can never remain on screen.
    setTableData([])
    setSelectedItem(null)
    setselectedAllocationType({})
    setSelectedAllocates({})
    setValidateError({})
    setValidatetypeError({})
  }, [reduxselectedBranch])

  useEffect(() => {
    if (!leadreallocation) return

    const filteredLeads = filterLeadsByLastTaskLabel(
      leadreallocation,
      label,
      status
    )
    setTableData(filteredLeads)
    setpartner(partners || [])
  }, [leadreallocation, partners, label, status])

  const isDesiredTaskCompleted = (lead) => {
    const desiredTaskId = lead?.isZeroAmountLead
      ? lead?.allocationType
      : lead?.lasttask?._id

    if (!desiredTaskId) return false

    return (lead?.activityLog || []).some((activity) => {
      const isDesiredTask =
        String(activity?.taskId || "") === String(desiredTaskId) ||
        String(activity?.taskBy || "") === String(desiredTaskId)

      return (
        isDesiredTask &&
        (activity?.taskClosed === true ||
          activity?.taskStatus === "Completed" ||
          Boolean(activity?.taskCompletedAt))
      )
    })
  }

  const filterLeadsByLastTaskLabel = (leads, label, selectedStatus) => {
    return leads.filter((lead) => {
      const taskName = lead?.lasttask?.taskName
      const isMatchingCategory =
        taskName?.toLowerCase() === String(label || "").toLowerCase()
      const completed = isDesiredTaskCompleted(lead)

      return (
        isMatchingCategory &&
        (selectedStatus === "completed" ? completed : !completed)
      )
    })
  }

  useEffect(() => {
    if (!leadreallocation || !tasks) return

    setselectedAllocationType((previous) => {
      const next = { ...previous }

      leadreallocation.forEach((lead) => {
        if (lead.firstStageFollowupReallocation) {
          next[lead._id] = lead.firstStageFollowupReallocation
        }
      })

      return next
    })
  }, [leadreallocation, tasks])

  const handleSelectedAllocates = (item, value) => {
    console.log(item)
    console.log(value)
    setTableData((prevLeads) =>
      prevLeads.map((lead) =>
        lead._id === item._id ? { ...lead, allocatedTo: value } : lead
      )
    )
  }

  const handleSubmit = async () => {
    try {
      const selectedTaskId = selectedAllocationType[selectedItem._id]
      const isCodingAndQc = selectedTaskId === CODING_AND_QC_TASK_ID
      const selectedTask = tasks?.find((task) => task._id === selectedTaskId)

      if (
        !isCodingAndQc &&
        !Object.prototype.hasOwnProperty.call(selectedAllocates, selectedItem._id)
      ) {
        setValidateError((prev) => ({
          ...prev,
          [selectedItem._id]: "Allocate to Someone"
        }))
        return
      }
      if (
        !Object.prototype.hasOwnProperty.call(
          selectedAllocationType,
          selectedItem._id
        )
      ) {
        setValidatetypeError((prev) => ({
          ...prev,
          [selectedItem._id]: "Select Type"
        }))
        return
      }
      const selected = selectedTaskId
      console.log(selectedType)
      console.log(selected)
      console.log(selectedItem?.allocatedTo)
      console.log(formData)
      setsubmitLoading(true)

      if (isCodingAndQc) {
        if (
          !formData.allocatedTo ||
          !formData.allocationDate ||
          !formData.allocationTime ||
          !formData.taskTitle?.trim() ||
          !formData.allocationDescription?.trim()
        ) {
          setsubmitError({
            submissionerror:
              "Assigned developer, allocation date/time, task title, and task description are required"
          })
          setsubmitLoading(false)
          return
        }

        const response = await api.post("/lead/rnd-allocation", {
          leadDocId: selectedItem._id,
          allocatedTo: formData.allocatedTo,
          allocationDate: formData.allocationDate,
          allocationTime: formData.allocationTime,
          expectedCompletionDate: formData.expectedCompletionDate || undefined,
          taskTitle: formData.taskTitle,
          allocationDescription: formData.allocationDescription
        })

        toast.success(response.data.message)
        setsubmitLoading(false)
        setShowmodal(false)
        setFormData({ allocationDate: "", allocationDescription: "" })
        refreshHook()
        setTableData([])
        return
      }

      const response = await api.post(
        `/lead/leadReallocation?allocationTypeId=${encodeURIComponent(
          selected
        )}&allocatedBy=${loggedUser._id}&allocationName=${encodeURIComponent(selectedTask?.taskName || selectedType || "")}`,
        { selectedItem, formData }
      )
      toast.success(response.data.message)
      setsubmitLoading(false)
      setFormData({
        allocationDate: "",
        allocationDescription: ""
      })
      setShowmodal(false)
      refreshHook()
      setTableData([])
    } catch (error) {
      setsubmitError({
        submissionerror:
          error.response?.data?.message || "Unable to reallocate this lead"
      })
      setsubmitLoading(false)
      console.log(error.message)
    }
  }
  const handleCollectionUpdate = async (formData) => {
    try {
      const isfrom = "reallocation"
      const response = await api.post(
        `/lead/collectionUPdate?isFrom=${isfrom}`,
        formData
      )
      if (response.status === 200) {
        refreshHook()
        return response
      }
    } catch (error) {
      toast.error("something went wrong")
      console.log("error", error.message)
    }
  }
  const handleClosed = async () => {
    if (!formData.recievedAmount) {
      setsubmitError((prev) => ({
        ...prev,
        recievedAmount: "Plase add closing amount"
      }))
      return
    }
    // return
    const allocationType = "lead Closed"
    const response = await api.post(
      `/lead/leadClosingAmount?allocationType=${encodeURIComponent(
        allocationType
      )}&allocatedBy=${loggedUser._id}&leadId=${selectedLeadId}`,
      { formData }
    )
    toast.success(response.data.message)
    setsubmitLoading(false)

    setIsclosed(false)
    refreshHook()
    setTableData([])
  }
  const openLostLead = (lead) => {
    setLostLead(lead)
    setLostRemarks("")
    setLostError("")
  }

  const closeLostLead = () => {
    if (lostSubmitting) return
    setLostLead(null)
    setLostRemarks("")
    setLostError("")
  }

  const submitLostLead = async () => {
    const remarks = lostRemarks.trim()
    if (!remarks) {
      setLostError("Remarks are required when marking a lead as lost")
      return
    }
    if (!lostLead?._id || !loggedUser?._id) return

    try {
      setLostSubmitting(true)
      const response = await api.put(
        `/lead/followupDateUpdate?selectedleaddocId=${lostLead._id}&loggeduserid=${loggedUser._id}`,
        {
          formData: {
            followUpDate: new Date().toISOString().split("T")[0],
            nextfollowUpDate: "",
            followupType: "lost",
            Remarks: remarks
          },
          collectionupdatedata: {}
        }
      )

      toast.success(response.data?.message || "Lead marked as lost")
      setTableData((previous) =>
        previous.filter((lead) => String(lead?._id) !== String(lostLead._id))
      )
      setLostLead(null)
      setLostRemarks("")
      setLostError("")
      refreshHook()
    } catch (error) {
      setLostError(
        error?.response?.data?.message || "Unable to mark this lead as lost"
      )
    } finally {
      setLostSubmitting(false)
    }
  }
  const openAllocationModal = (item) => {
    const isCodingAndQc =
      selectedAllocationType[item._id] === CODING_AND_QC_TASK_ID
    if (
      !isCodingAndQc &&
      !Object.prototype.hasOwnProperty.call(selectedAllocates, item._id)
    ) {
      setValidateError((prev) => ({
        ...prev,
        [item._id]: "Allocate to Someone"
      }))
      return
    }
    if (!Object.prototype.hasOwnProperty.call(selectedAllocationType, item._id)) {
      setValidatetypeError((prev) => ({
        ...prev,
        [item._id]: "Please select a type"
      }))
      return
    }

    setselectedLeadId(item.leadId)
    setShowmodal(true)
    setSelectedItem(item)
    setsubmitError({ submissionerror: "" })
    setFormData({
      allocationDate: new Date().toISOString().slice(0, 10),
      allocationTime: new Date().toTimeString().slice(0, 5),
      allocatedTo: "",
      priority: "Medium",
      expectedCompletionDate: "",
      taskTitle: "",
      allocationDescription: ""
    })
  }
  const openLeadClosing = (item) => {
    const breadcrumb = [
      { label: "Lead", path: "", state: "" },
      {
        label: "Re Allocation List",
        path:
          loggedUser?.role === "Admin"
            ? "/admin/transaction/lead/leadReallocation"
            : "/staff/transaction/lead/leadReallocation"
      },
      { label: "Lead Closed", path: "" }
    ]
    navigate(
      loggedUser?.role === "Admin"
        ? "/admin/transaction/lead/leadClosed"
        : "/staff/transaction/lead/leadClosed",
      {
        state: {
          leadId: item._id,
          breadcrumb,
          closingOrigin: "reallocation"
        }
      }
    )
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
  const isCodingAndQcModal =
    selectedAllocationType[selectedItem?._id] === CODING_AND_QC_TASK_ID

  return (
    <div className="h-full  bg-[#ADD8E6] overflow-hidden">
      <div className="flex h-full flex-row">
        {/* <StaticSidebar
          handleMoreClick={handleMoreClick}
          selectedCompanyBranch={selectedCompanyBranch}
          setselectedCompanyBranch={setSelectedCompanyBranch}
          parenttargetData={settargetData}
          parentperiodmode={periodMode}
          parentyear={selectedYear}
          setselectedPeriod={setselectedPeriod}
        /> */}
        <div className="flex flex-1 flex-col overflow-hidden min-h-0">
          {/* <header className="flex items-center justify-between bg-[#ADD8E6]">
            {loggedUser?.role?.toLowerCase() === "admin" ? (
              <AdminHeader hide={true} />
            ) : (
              <StaffHeader hide={true} />
            )}

            <div className="flex items-center gap-1.5  bg-[#ADD8E6] pr-3 h-full">
              <button className="rounded-full p-1.5 transition bg-slate-100">
                <Mail size={15} strokeWidth={2.2} />
              </button>
              <div className="relative">
                <button className="rounded-full p-1.5 transition bg-slate-100">
                  <MessageSquareText size={15} strokeWidth={2.2} />
                </button>
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
              </div>
              <button className="rounded-full p-1.5 transition bg-slate-100">
                <Settings size={15} strokeWidth={2.2} />
              </button>
              <button className="rounded-full p-1.5 transition bg-slate-100">
                <User size={15} strokeWidth={2.2} />
              </button>

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowUserMenu((prev) => !prev)
                  }}
                  className="rounded-full p-1.5 transition bg-slate-100"
                >
                  <User size={15} strokeWidth={2.2} />
                </button>

                {showUserMenu && (
                  <div
                    onClick={(e) => e.stopPropagation()} 
                    className="absolute right-0 mt-2 w-32 bg-white border border-slate-200 rounded-md shadow-lg z-50"
                  >
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header> */}
          {(submitLoading || loading) && (
            <BarLoader
              cssOverride={{ width: "100%", height: "4px" }} // Tailwind's `h-4` corresponds to `16px`
              color="#4A90E2" // Change color as needed
            />
          )}
          <div className="flex min-h-0 flex-1 flex-col bg-[#ADD8E6]">
            <div className="mx-3 mb-4 mt-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm md:mx-5">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                    <History size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold tracking-tight text-slate-900">Reallocation List</h2>
                    <p className="text-xs text-slate-500">Assign and manage follow-up leads.</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-36">
                  <Select
                    value={[
                      { value: "completed", label: "Completed" },
                      { value: "pending", label: "Pending" }
                    ].find((option) => option.value === status)}
                    onChange={(option) => setStatus(option?.value || "completed")}
                    options={[
                      { value: "completed", label: "Completed" },
                      { value: "pending", label: "Pending" }
                    ]}
                    isSearchable={false}
                    aria-label="Reallocation task status"
                    components={{ Menu: CloseOnMouseLeaveMenu }}
                    menuIsOpen={openSelectId === "status"}
                    onMenuOpen={() => setOpenSelectId("status")}
                    onMenuClose={() => setOpenSelectId(null)}
                    onMenuMouseLeave={() => setOpenSelectId(null)}
                    className="text-xs"
                    styles={{
                      control: (base) => ({
                        ...base,
                        minHeight: "32px",
                        borderColor: "#cbd5e1",
                        borderRadius: "8px",
                        boxShadow: "none",
                        cursor: "pointer"
                      }),
                      valueContainer: (base) => ({ ...base, padding: "0 8px" }),
                      indicatorsContainer: (base) => ({ ...base, height: "32px" }),
                      menuPortal: (base) => ({ ...base, zIndex: 120 })
                    }}
                    menuPortalTarget={document.body}
                  />
                </div>
                <span className="hidden rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 sm:inline-flex">
                  {tableData.length} lead{tableData.length === 1 ? "" : "s"}
                </span>
                <button
                  onClick={() =>
                    loggedUser.role === "Admin"
                      ? navigate("/admin/transaction/lead")
                      : navigate("/staff/transaction/lead")
                  }
                  className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                >
                  New Lead
                </button>
              </div>
            </div>

            {/* Responsive Table Container */}
            <div className="mx-3 mb-3 overflow-auto rounded-2xl border border-slate-200 bg-white text-center shadow-sm md:mx-5">
              {tableData?.length > 0 ? (
              <table className="w-full min-w-[1320px] text-sm">
                <thead className="sticky top-0 z-30 whitespace-nowrap bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white shadow-sm">
                  <tr>
                    <th className="w-14 px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-blue-100">
                      S.No.
                    </th>
                    <th className="min-w-52 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-blue-100">
                      Name
                    </th>
                    <th className="min-w-32 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-blue-100">
                      Contact
                    </th>
                    <th className="min-w-56 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-blue-100">
                      Email
                    </th>
                    <th className="min-w-28 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-blue-100">
                      Lead ID
                    </th>
                    {/* <th className="border  border-l-0 border-t-0 border-gray-400 px-4  min-w-[100px]">
                      Description
                    </th> */}
                    <th className="min-w-44 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-blue-100">
                      Assigned to
                    </th>
                    <th className="min-w-24 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-blue-100">
                      Follow-ups
                    </th>
                    <th className="min-w-40 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-blue-100">
                      Allocation Type
                    </th>
                    <th className="min-w-40 px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-blue-100">
                      Action
                    </th>
                    <th className="min-w-28 px-3 py-3 text-right text-[10px] font-bold uppercase tracking-wider text-blue-100">
                      Net Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((item, index) => (
                      <React.Fragment key={item._id}>
                        <tr className="group border-b border-slate-100 bg-white transition-colors hover:bg-blue-50/40">
                          <td className="px-3 py-3 text-xs font-semibold text-slate-400">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[11px] text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-left">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 text-xs font-bold text-blue-700">
                                {(item?.customerName?.customerName || "-").charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="max-w-44 truncate text-xs font-bold text-slate-800" title={item?.customerName?.customerName || ""}>
                                  {item?.customerName?.customerName || "-"}
                                </p>
                                <p className="mt-0.5 max-w-44 truncate text-[10px] text-slate-500" title={item?.leadBy?.name || ""}>
                                  Lead by {item?.leadBy?.name || "-"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-left">
                            <div className="space-y-0.5 text-xs font-medium text-slate-700">
                              <span className="flex items-center gap-1.5 whitespace-nowrap"><Phone size={12} className="text-blue-500" />{item?.mobile || "-"}</span>
                              <span className="flex items-center gap-1.5 whitespace-nowrap text-[10px] text-slate-500"><Phone size={11} />{item?.phone || "-"}</span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-left">
                            <span className="inline-flex max-w-52 items-center gap-1.5 text-xs text-slate-600">
                              <Mail size={13} className="shrink-0 text-slate-400" />
                              <span className="truncate" title={item?.email || ""}>{item?.email || "-"}</span>
                            </span>
                          </td>
                          <td className="px-3 py-3 text-left">
                            <p className="w-fit rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700">{item?.leadId || "-"}</p>
                            <p className="mt-1 inline-flex items-center gap-1 text-[10px] text-slate-500">
                              <Calendar size={11} />
                              {item?.leadDate ? new Date(item.leadDate).toLocaleDateString() : "-"}
                            </p>
                          </td>
                          <td className="px-3 py-2">
                            <Select
                              options={allocationOptions}
                              value={selectedAllocates[item._id] || null}
                              onChange={(selectedOption) => {
                                setSelectedAllocates((prev) => ({ ...prev, [item._id]: selectedOption }))
                                handleSelectedAllocates(item, selectedOption.value)
                                setValidateError((prev) => ({ ...prev, [item._id]: "" }))
                              }}
                              placeholder="Select staff"
                              components={{ Menu: CloseOnMouseLeaveMenu }}
                              menuIsOpen={openSelectId === `staff-${item._id}`}
                              onMenuOpen={() => setOpenSelectId(`staff-${item._id}`)}
                              onMenuClose={() => setOpenSelectId(null)}
                              onMenuMouseLeave={() => setOpenSelectId(null)}
                              className="w-40 text-xs"
                              styles={{ control: (base, state) => ({ ...base, minHeight: "34px", borderColor: validateError[item._id] ? "#f87171" : state.isFocused ? "#2563eb" : "#cbd5e1", borderRadius: "8px", boxShadow: state.isFocused ? "0 0 0 2px rgba(37, 99, 235, 0.12)" : "none", cursor: "pointer" }), valueContainer: (base) => ({ ...base, padding: "0 8px" }), indicatorsContainer: (base) => ({ ...base, height: "34px" }), menu: (base) => ({ ...base, overflow: "hidden", borderRadius: "10px", border: "1px solid #dbeafe", boxShadow: "0 12px 28px rgba(15, 23, 42, 0.16)" }), menuList: (base) => ({ ...base, padding: "4px" }), option: (base, state) => ({ ...base, borderRadius: "6px", cursor: "pointer", fontSize: "12px", backgroundColor: state.isSelected ? "#2563eb" : state.isFocused ? "#eff6ff" : "white", color: state.isSelected ? "white" : "#334155" }), menuPortal: (base) => ({ ...base, zIndex: 120 }) }}
                              menuPlacement="auto"
                              menuPortalTarget={document.body}
                              menuShouldScrollIntoView={false}
                            />
                            {validateError[item._id] && <p className="mt-1 text-[10px] text-red-500">{validateError[item._id]}</p>}
                          </td>
                          <td className="px-3 py-2 text-left">
                            <p className="font-semibold text-slate-700">{item?.activityLog?.length || 0}</p>
                            <p className="max-w-24 truncate text-[10px] text-slate-500" title={item?.lasttask?.taskName || ""}>{item?.lasttask?.taskName || "-"}</p>
                          </td>
                          <td className="px-3 py-2">
                            <Select
                              options={(tasks || []).map((task) => ({
                                value: task._id,
                                label: task.taskName
                              }))}
                              value={(tasks || [])
                                .map((task) => ({ value: task._id, label: task.taskName }))
                                .find((option) => option.value === selectedAllocationType[item._id]) || null}
                              isDisabled={Boolean(item.firstStageFollowupReallocation)}
                              onChange={(selectedOption) => {
                                const selectedtask = tasks?.find((task) => task._id === selectedOption?.value)
                                setselectedAllocationType((prev) => ({ ...prev, [item._id]: selectedOption?.value || "" }))
                                setselectedallocatiotypeNames((prev) => ({ ...prev, [item._id]: selectedtask }))
                                setselectedType(selectedtask?.taskName)
                                setValidatetypeError((prev) => ({ ...prev, [item._id]: "" }))
                              }}
                              placeholder="Select type"
                              isSearchable
                              components={{ Menu: CloseOnMouseLeaveMenu }}
                              menuIsOpen={openSelectId === `type-${item._id}`}
                              onMenuOpen={() => setOpenSelectId(`type-${item._id}`)}
                              onMenuClose={() => setOpenSelectId(null)}
                              onMenuMouseLeave={() => setOpenSelectId(null)}
                              className="min-w-40 text-xs"
                              styles={{ control: (base, state) => ({ ...base, minHeight: "34px", borderColor: validatetypeError[item._id] ? "#f87171" : state.isFocused ? "#2563eb" : "#cbd5e1", borderRadius: "8px", boxShadow: state.isFocused ? "0 0 0 2px rgba(37, 99, 235, 0.12)" : "none", cursor: "pointer" }), valueContainer: (base) => ({ ...base, padding: "0 8px" }), indicatorsContainer: (base) => ({ ...base, height: "34px" }), menu: (base) => ({ ...base, overflow: "hidden", borderRadius: "10px", border: "1px solid #dbeafe", boxShadow: "0 12px 28px rgba(15, 23, 42, 0.16)" }), menuList: (base) => ({ ...base, padding: "4px" }), option: (base, state) => ({ ...base, borderRadius: "6px", cursor: "pointer", fontSize: "12px", backgroundColor: state.isSelected ? "#2563eb" : state.isFocused ? "#eff6ff" : "white", color: state.isSelected ? "white" : "#334155" }), menuPortal: (base) => ({ ...base, zIndex: 120 }) }}
                              menuPlacement="auto"
                              menuPortalTarget={document.body}
                              menuShouldScrollIntoView={false}
                            />
                            {validatetypeError[item._id] && <p className="mt-1 text-[10px] text-red-500">{validatetypeError[item._id]}</p>}
                          </td>

                          <td className="px-3 py-2 text-left">
                            <div className="grid grid-cols-2 gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    loggedUser.role === "Admin"
                                      ? "/admin/transaction/lead/leadEdit"
                                      : "/staff/transaction/lead/leadEdit",
                                    { state: { leadId: item._id, isReadOnly: false } }
                                  )
                                }
                                className="inline-flex items-center justify-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-1.5 py-1 text-[10px] font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                              >
                                <Eye size={11} />
                                View
                              </button>
                              <button type="button" onClick={() => openAllocationModal(item)} className="rounded-md border border-amber-200 bg-amber-50 px-1.5 py-1 text-[10px] font-semibold text-amber-700 transition hover:bg-amber-100">
                                Allocate
                              </button>
                              <button type="button" onClick={() => openLostLead(item)} className="rounded-md border border-rose-200 bg-rose-50 px-1.5 py-1 text-[10px] font-semibold text-rose-600 transition hover:bg-rose-100">
                                Lost
                              </button>
                              <button type="button" onClick={() => openLeadClosing(item)} className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100">
                                Close
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">
                              <IndianRupee size={12} />
                              {Number(item?.netAmount || 0).toLocaleString("en-IN")}
                            </span>
                          </td>
                        </tr>

                        <tr className="hidden bg-slate-100 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                          <td className="border-y border-slate-200 px-3 py-1.5">{index + 1}</td>
                          <td className="border-y border-slate-200 px-3 py-1.5 text-left">Lead by</td>
                          <td className="border-y border-slate-200 px-3 py-1.5 text-left">Assigned to</td>
                          <td className="border-y border-slate-200 px-3 py-1.5 text-left">Assigned by</td>
                          <td className="border-y border-slate-200 px-3 py-1.5 text-left">Follow-ups</td>
                          <td className="border-y border-slate-200 px-3 py-1.5 text-left">Lead date</td>
                          <td className="border-y border-slate-200 px-2 py-1">
                            <select
                              value={selectedAllocationType[item._id] || ""}
                              disabled={Boolean(item.firstStageFollowupReallocation)}
                              onChange={(e) => {
                                const selectedtask = tasks.find((task) => task._id === e.target.value)
                                setselectedAllocationType((prev) => ({ ...prev, [item._id]: e.target.value }))
                                setselectedallocatiotypeNames((prev) => ({ ...prev, [item._id]: selectedtask }))
                                setselectedType(selectedtask?.taskName)
                                setValidatetypeError((prev) => ({ ...prev, [item._id]: "" }))
                              }}
                              className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-[11px] font-medium normal-case text-slate-700 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100"
                            >
                              <option value="">Select type</option>
                              {tasks?.filter((task) => String(task.taskName || "").trim().toLowerCase() !== "followup").map((task) => (
                                <option key={task._id} value={task._id}>{task?.taskName}</option>
                              ))}
                            </select>
                            {validatetypeError[item._id] && <p className="mt-1 normal-case text-red-500">{validatetypeError[item._id]}</p>}
                          </td>
                          <td className="border-y border-slate-200 px-2 py-1">
                            <div className="flex justify-center gap-1">
                              <button type="button" onClick={() => openAllocationModal(item)} className="rounded-md bg-amber-500 px-2 py-1 text-[10px] font-semibold normal-case text-white transition hover:bg-amber-600">Allocate</button>
                              <button type="button" onClick={() => openLostLead(item)} className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold normal-case text-rose-600 transition hover:bg-rose-100">Lost</button>
                            </div>
                          </td>
                          <td className="border-y border-slate-200" />
                        </tr>
                        <tr className="hidden border-b-4 border-slate-200 bg-white text-xs text-slate-700">
                          <td className="px-3 py-2" />
                          <td className="px-3 py-2 text-left font-semibold">{item?.leadBy?.name || "-"}</td>
                          <td className="px-3 py-2 text-left">
                            <Select
                              options={allocationOptions}
                              value={selectedAllocates[item._id] || null}
                              onChange={(selectedOption) => {
                                setSelectedAllocates((prev) => ({ ...prev, [item._id]: selectedOption }))
                                handleSelectedAllocates(item, selectedOption.value)
                                setValidateError((prev) => ({ ...prev, [item._id]: "" }))
                              }}
                              placeholder="Select staff"
                              className="w-40 text-xs"
                              styles={{ control: (base) => ({ ...base, minHeight: "30px", borderColor: validateError[item._id] ? "#f87171" : "#cbd5e1", boxShadow: "none", cursor: "pointer" }), valueContainer: (base) => ({ ...base, padding: "0 7px" }), indicatorsContainer: (base) => ({ ...base, height: "30px" }), menuPortal: (base) => ({ ...base, zIndex: 120 }) }}
                              menuPlacement="auto"
                              menuPortalTarget={document.body}
                              menuShouldScrollIntoView={false}
                            />
                            {validateError[item._id] && <p className="mt-1 text-[10px] text-red-500">{validateError[item._id]}</p>}
                          </td>
                          <td className="px-3 py-2 text-left">{item?.allocatedBy?.name || "-"}</td>
                          <td className="px-3 py-2 text-left">{item?.activityLog?.length || 0}</td>
                          <td className="px-3 py-2 text-left">{item?.leadDate ? new Date(item.leadDate).toLocaleDateString() : "-"}</td>
                          <td className="px-3 py-2" />
                          <td className="px-3 py-2">
                            <button type="button" onClick={() => openLeadClosing(item)} className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-700 transition hover:bg-slate-100">Close</button>
                          </td>
                          <td className="px-3 py-2" />
                        </tr>
                        <tr className="hidden border-b-4 border-slate-100 bg-blue-50/50 text-xs text-slate-600">
                          <td className="px-4 py-1.5" />
                          <td className="px-3 py-1.5 text-left font-semibold text-slate-700" colSpan={5}>
                            {item?.submittedUser?.name || "-"} <span className="mx-1 text-slate-300">•</span> {item?.lasttask?.taskName || "-"} <span className="mx-1 text-slate-300">•</span> {item?.activityLog?.[item.activityLog.length - 1]?.remarks || "No remarks"}
                          </td>
                          <td className="px-3 py-1.5" colSpan={3} />
                        </tr>

                        <tr className="hidden font-semibold bg-gray-100">
                          <td className=" px-4 border border-b-0 border-t-0 border-r-0 border-gray-400 ">
                            {index + 1}
                          </td>
                          <td className=" px-4 border border-b-0 border-t-0 border-r-0 border-gray-400 ">
                            Leadby
                          </td>
                          <td className=" px-4">Assignedto</td>
                          <td className=" px-4 ">Assignedby</td>
                          <td className="px-4 ">No. of Followups</td>
                          <td className="px-4 min-w-[120px]">Lead Date</td>
                          {/* <td className="px-4 min-w-[120px] border border-t-0 border-b-0 border-gray-400 whitespace-nowrap">
                          
<span className="mx-2 relative group inline-block max-w-[220px] align-middle">
  <span className="block truncate text-[12px] text-slate-700">
    {item?.activityLog?.[item.activityLog.length - 1]?.remarks || "-"}
  </span>

  {item?.activityLog?.[item.activityLog.length - 1]?.remarks && (
    <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden w-80 rounded-md border border-slate-200 bg-slate-700 px-3 py-2 shadow-lg group-hover:block">
      <p className="text-[11px] leading-4 text-white whitespace-normal break-words">
        {item?.activityLog?.[item.activityLog.length - 1]?.remarks}
      </p>
    </div>
  )}
</span>
                          </td> */}
                          <td className=" border border-t-0 border-b-0 border-gray-400 px-1 bg-white ">
                            <select
                              value={selectedAllocationType[item._id] || ""}
                              disabled={Boolean(item.firstStageFollowupReallocation)}
                              onChange={(e) => {
                                const selectedtask = tasks.find(
                                  (item) => item._id === e.target.value
                                )

                                setselectedAllocationType((prev) => ({
                                  ...prev,
                                  [item._id]: e.target.value
                                }))
                                setselectedallocatiotypeNames((prev) => ({
                                  ...prev,
                                  [item._id]: selectedtask
                                }))
                                setselectedType(selectedtask?.taskName)
                                setValidatetypeError((prev) => ({
                                  ...prev,
                                  [item._id]: ""
                                }))
                              }}
                              className="py-1 border border-gray-400 rounded-md  w-full focus:outline-none cursor-pointer disabled:cursor-not-allowed disabled:bg-slate-100"
                            >
                              <option>Select Type</option>

                              {tasks &&
                                tasks
                                  .filter(
                                    (task) =>
                                      String(task.taskName || "")
                                        .trim()
                                        .toLowerCase() !== "followup"
                                  )
                                  .map((task) => (
                                  <option key={task._id} value={task._id}>
                                    {task?.taskName}
                                  </option>
                                  ))}
                            </select>
                            {validatetypeError[item._id] && (
                              <p className="text-red-500 text-sm">
                                {validatetypeError[item._id]}
                              </p>
                            )}
                          </td>
                          <td
                            className="border border-t-0 border-b-0 border-gray-400 bg-white px-2 py-1 text-center"
                            onClick={() => {
                              const isCodingAndQc =
                                selectedAllocationType[item._id] ===
                                CODING_AND_QC_TASK_ID
                              if (
                                !isCodingAndQc &&
                                !Object.prototype.hasOwnProperty.call(
                                  selectedAllocates,
                                  item._id
                                )
                              ) {
                                setValidateError((prev) => ({
                                  ...prev,
                                  [item._id]: "Allocate to Someone"
                                }))
                                return
                              }
                              if (
                                !Object.prototype.hasOwnProperty.call(
                                  selectedAllocationType,
                                  item._id
                                )
                              ) {
                                setValidatetypeError((prev) => ({
                                  ...prev,
                                  [item._id]: "please select a Type"
                                }))
                                return
                              }
                              setselectedLeadId(item.leadId)
                              setShowmodal(true)
                              setSelectedItem(item)
                              setsubmitError({ submissionerror: "" })
                              setFormData({
                                allocationDate: new Date().toISOString().slice(0, 10),
                                allocationTime: new Date().toTimeString().slice(0, 5),
                                allocatedTo: "",
                                priority: "Medium",
                                expectedCompletionDate: "",
                                taskTitle: "",
                                allocationDescription: ""
                              })
                            }}
                          >
                            <span className="inline-flex min-w-[96px] items-center justify-center rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100">
                              Allocate
                            </span>
                          </td>
                          <td className=" border border-t-0 border-b-0 border-gray-400 px-4 bg-white ">
                            {" "}
                            {item?.netAmount}
                          </td>
                        </tr>

                        <tr className="hidden bg-white">
                          <td className="border border-t-0 border-r-0 border-b-0 border-gray-400 px-2 py-1 text-xs font-semibold text-slate-600">
                            {index + 1}
                          </td>
                          <td className="border border-t-0 border-r-0 border-b-0 border-gray-400 px-2 py-1 text-left text-xs text-slate-700">
                            <span className="block text-[10px] font-semibold uppercase text-slate-400">Lead by</span>
                            <span className="block truncate">{item?.leadBy?.name || "-"}</span>
                          </td>
                          <td className="border border-t-0 border-r-0 border-l-0 border-b-0 border-gray-400 px-2 py-1">
                            <span className="mb-1 block text-left text-[10px] font-semibold uppercase text-slate-400">Assigned to</span>
                            <div className="text-center">
                              <div className="inline-block">
                                <Select
                                  options={allocationOptions}
                                  value={selectedAllocates[item._id] || null}
                                  onChange={(selectedOption) => {
                                    setSelectedAllocates((prev) => ({
                                      ...prev,
                                      [item._id]: selectedOption
                                    }))
                                    handleSelectedAllocates(
                                      item,
                                      selectedOption.value
                                    )
                                    setValidateError((prev) => ({
                                      ...prev,
                                      [item._id]: ""
                                    }))
                                  }}
                                  className="w-40 focus:outline-red-500"
                                  styles={{
                                    control: (base) => ({
                                      ...base,
                                      minHeight: "28px",
                                      height: "28px",
                                      boxShadow: "none", // removes blue glow
                                      borderColor: "red",
                                      cursor: "pointer",
                                      "&:hover": {
                                        borderColor: "red" // optional hover styling
                                      }
                                    }),
                                    option: (base, state) => ({
                                      ...base,
                                      cursor: "pointer", // 👈 ensures pointer on option hover
                                      backgroundColor: state.isFocused
                                        ? "#f0f0f0"
                                        : "white", // optional styling
                                      color: "black"
                                    }),
                                    valueContainer: (base) => ({
                                      ...base,
                                      paddingTop: "2px", // Reduce vertical padding
                                      paddingBottom: "2px"
                                    }),
                                    indicatorsContainer: (base) => ({
                                      ...base,
                                      height: "28px"
                                    }),
                                    menu: (provided) => ({
                                      ...provided,
                                      maxHeight: "200px", // Set dropdown max height
                                      overflowY: "auto" // Enable scrolling
                                    }),
                                    menuList: (provided) => ({
                                      ...provided,
                                      maxHeight: "200px", // Ensures dropdown scrolls internally
                                      overflowY: "auto"
                                    })
                                  }}
                                  menuPlacement="auto"
                                  menuPosition="absolute"
                                  menuPortalTarget={document.body} // Prevents nested scrolling issues
                                  menuShouldScrollIntoView={false}
                                />

                                {validateError[item._id] && (
                                  <p className="text-red-500 text-sm">
                                    {validateError[item._id]}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="border border-t-0 border-r-0 border-l-0 border-b-0 border-gray-400 px-2 py-1 text-left text-xs text-slate-700">
                            <span className="block text-[10px] font-semibold uppercase text-slate-400">Assigned by</span>
                            <span className="block truncate">{item?.allocatedBy?.name || "-"}</span>
                          </td>
                          <td className="border border-t-0 border-r-0 border-l-0 border-b-0 border-gray-400 px-2 py-1 text-left text-xs text-slate-700">
                            <span className="block text-[10px] font-semibold uppercase text-slate-400">Follow-ups</span>
                            <span>{item?.activityLog?.length || 0}</span>
                          </td>
                          <td className="border border-t-0 border-r-0 border-l-0 border-b-0 border-gray-400 px-2 py-1 text-left text-xs text-slate-700">
                            <span className="block text-[10px] font-semibold uppercase text-slate-400">Lead date</span>
                            <span>{item?.leadDate ? new Date(item.leadDate).toLocaleDateString() : "-"}</span>
                          </td>
                          {/* <td className="border  border-t-0 border-r-0 border-b-0 border-gray-400 px-4 py-0.5 "></td> */}
                          <td className="border border-t-0 border-b-0 border-gray-400   px-4 py-0.5 "></td>
                          <td className="border border-t-0 border-b-0 border-gray-400 px-2 py-2 text-center">
                            <div className="flex flex-col items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openAllocationModal(item)}
                                className="inline-flex min-w-[96px] items-center justify-center rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
                              >
                                Allocate
                              </button>
                              <button
                                type="button"
                                onClick={() => openLostLead(item)}
                                className="inline-flex min-w-[96px] items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100 hover:text-rose-700"
                              >
                                Lost
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  console.log("hhh")
                                  const breadcrumb = [
                                    { label: "Lead", path: "", state: "" },
                                    {
                                      label: "Re Allocation List",
                                      path:
                                        loggedUser?.role === "Admin"
                                          ? "/admin/transaction/lead/leadReallocation"
                                          : "/staff/transaction/lead/leadReallocation"
                                    },
                                    { label: "Lead Closed", path: "" }
                                  ]
                                  loggedUser.role === "Admin"
                                    ? navigate(
                                        "/admin/transaction/lead/leadClosed",
                                        {
                                          state: {
                                            leadId: item._id,
                                            breadcrumb,
                                            closingOrigin: "reallocation"
                                          }
                                        }
                                      )
                                    : navigate(
                                        "/staff/transaction/lead/leadClosed",
                                        {
                                          state: {
                                            leadId: item._id,
                                            breadcrumb,
                                            closingOrigin: "reallocation"
                                          }
                                        }
                                      )
                                }}
                                className="inline-flex min-w-[96px] items-center justify-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-800"
                              >
                                Closed
                              </button>
                            </div>
                          </td>
                          <td className="border border-t-0 border-b-0 border-gray-400   px-4 py-0.5"></td>
                        </tr>
                        <tr className="hidden bg-gray-100">
                          <td className="border border-l-1 border-t-0 border-gray-400 "></td>
                          <td
                            colSpan={5}
                            className="text-center py-1 font-semibold border border-t-0 border-gray-400"
                          >
                            <div className="flex  w-full">
                              {/* <span className="min-w-[100px]"></span> */}
                              <span className="mx-2">
                                {item?.submittedUser?.name} -
                              </span>
                              <span className="mx-2">
                                {item?.lasttask?.taskName}-
                              </span>
                              {/* <span>
                                {
                                  item?.activityLog[item.activityLog.length - 1]
                                    ?.remarks
                                }
                              </span> */}
                              <span className="mx-2 relative group inline-block max-w-[220px] align-middle">
                                <span className="block truncate text-[12px] text-slate-700">
                                  {item?.activityLog?.[
                                    item.activityLog.length - 1
                                  ]?.remarks || "-"}
                                </span>

                                {item?.activityLog?.[
                                  item.activityLog.length - 1
                                ]?.remarks && (
                                  <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden w-80 rounded-md border border-slate-200 bg-slate-700 px-3 py-2 shadow-lg group-hover:block">
                                    <p className="text-[11px] leading-4 text-white whitespace-normal break-words">
                                      {
                                        item?.activityLog?.[
                                          item.activityLog.length - 1
                                        ]?.remarks
                                      }
                                    </p>
                                  </div>
                                )}
                              </span>
                            </div>
                          </td>
                          {/* <td className="border border-t-0 border-gray-400 "></td> */}
                          <td className="border border-t-0 border-gray-400 "></td>
                          <td className="border border-t-0 border-gray-400"></td>
                          <td className="border border-t-0 border-gray-400 "></td>
                        </tr>
                        <tr>
                          <td colSpan="100%" className="bg-gray-300">
                            <div className="h-1"></div>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                </tbody>
              </table>
              ) : loading || toggleLoading ? (
                <div className="flex min-h-48 items-center justify-center">
                  <SkeletonTable color="#3b82f6" size={10} />
                </div>
              ) : (
                <NoDataAvailable
                  title={`No ${status} reallocation leads`}
                  message="There are no leads matching this task category and status."
                />
              )}
              {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6">
                  <div className={`relative flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/20 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.35)] ${isCodingAndQcModal ? "max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-3rem)]" : ""}`}>
                    {submitLoading && <BarLoader cssOverride={{ width: "100%", height: "4px" }} color="#2563eb" />}
                    <button type="button" onClick={() => { setShowmodal(false); setsubmitError({ submissionerror: "" }) }} className="absolute right-4 top-4 z-20 grid h-9 w-9 place-items-center rounded-xl border border-slate-200 bg-white/95 text-slate-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600" aria-label="Close task allocation dialog" title="Close"><X size={19} /></button>

                    <div className={isCodingAndQcModal ? "min-h-0 flex-1 overflow-y-auto overscroll-contain" : "flex-1 overflow-visible"}>
                    {isCodingAndQcModal ? (
                      <div className="space-y-5 p-5">
                        <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-xs text-slate-600 sm:grid-cols-3">
                          <span><strong className="block text-slate-800">{selectedItem?.customerName?.customerName || "-"}</strong>Customer</span>
                          <span><strong className="block text-slate-800">{selectedLeadId || "-"}</strong>Lead ID</span>
                          <span><strong className="block text-slate-800">R&amp;D</strong>Department</span>
                          <span><strong className="block text-slate-800">{formData.allocationDate || "-"}</strong>Allocation date</span>
                          <span><strong className="block text-slate-800">{formData.allocationTime || "-"}</strong>Allocation time</span>
                          <span><strong className="block text-slate-800">Pending</strong>Initial status</span>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className="!text-left block text-xs font-semibold text-slate-700">Assigned by<input readOnly value={loggedUser?.name || "-"} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-normal text-slate-600" /></label>
                          <label className="!text-left block text-xs font-semibold text-slate-700">Assigned developer<StyledSelect value={formData.allocatedTo || ""} onChange={(value) => setFormData((prev) => ({ ...prev, allocatedTo: value }))} placeholder="Select R&amp;D staff" options={rndAllocationOptions} /></label>
                          <label className="!text-left block text-xs font-semibold text-slate-700">Allocation date<input required type="date" value={formData.allocationDate || ""} onChange={(e) => setFormData((prev) => ({ ...prev, allocationDate: e.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal" /></label>
                          <label className="!text-left block text-xs font-semibold text-slate-700">Allocation time<input required type="time" value={formData.allocationTime || ""} onChange={(e) => setFormData((prev) => ({ ...prev, allocationTime: e.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal" /></label>
                          <label className="!text-left block text-xs font-semibold text-slate-700">Priority<StyledSelect value={formData.priority || "Medium"} onChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))} options={[{ value: "Medium", label: "Medium" }, { value: "High", label: "High" }, { value: "Low", label: "Low" }]} /></label>
                          <label className="!text-left block text-xs font-semibold text-slate-700">Expected completion date<input type="date" min={formData.allocationDate || undefined} value={formData.expectedCompletionDate || ""} onChange={(e) => setFormData((prev) => ({ ...prev, expectedCompletionDate: e.target.value }))} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal" /></label>
                        </div>
                        <label className="!text-left block text-xs font-semibold text-slate-700">Task title<input required value={formData.taskTitle || ""} onChange={(e) => setFormData((prev) => ({ ...prev, taskTitle: e.target.value }))} placeholder="Enter a clear task title" className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm font-normal" /></label>
                        <label className="!text-left block text-xs font-semibold text-slate-700">Task description<textarea required rows="5" value={formData.allocationDescription || ""} onChange={(e) => setFormData((prev) => ({ ...prev, allocationDescription: e.target.value }))} placeholder="Describe the work to be completed..." className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal" /></label>
                      </div>
                    ) : (
                      <div className="bg-slate-50/70 p-4 sm:p-5">
                        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm sm:p-4">
                          <div className="mb-3 flex items-center gap-2 pr-10">
                            <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600"><ClipboardCheck size={16} /></div>
                            <div>
                              <h2 className="text-sm font-bold text-slate-800">Allocation details</h2>
                              <p className="text-[11px] text-slate-500">Set a date and concise work instructions.</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="!text-left flex flex-col gap-2 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50/70 p-3 transition focus-within:border-blue-400 sm:flex-row sm:items-center sm:justify-between">
                              <span className="flex items-center gap-2">
                                <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white"><Calendar size={15} /></span>
                                <span><span className="block text-xs font-bold text-slate-700">Expected completion</span><span className="block text-[10px] text-slate-500">Promised delivery date</span></span>
                              </span>
                              <input value={formData.allocationDate || ""} type="date" onChange={(e) => setFormData((prev) => ({ ...prev, allocationDate: e.target.value }))} className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-500 sm:w-48" />
                            </label>
                            <label className="!text-left block">
                              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700"><MessageSquareText size={14} className="text-blue-600" /> Task description</span>
                              <textarea value={formData.allocationDescription || ""} onChange={(e) => setFormData((prev) => ({ ...prev, allocationDescription: e.target.value }))} placeholder="Describe the work to be completed..." className="mt-2 min-h-24 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100" />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                    </div>

                    {submiterror.submissionerror && <p className="px-4 pb-2 text-sm text-rose-600 sm:px-6">{submiterror.submissionerror}</p>}
                    <div className="sticky bottom-0 z-10 flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-white/95 px-4 py-3 backdrop-blur sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:py-4">
                      <button type="button" onClick={() => { setShowmodal(false); setsubmitError({ submissionerror: "" }) }} className="h-11 rounded-xl px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">Cancel</button>
                      <button type="button" disabled={submitLoading} onClick={handleSubmit} className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-60">{submitLoading && <FaSpinner className="h-4 w-4 animate-spin" />}{isCodingAndQcModal ? "Allocate task" : "Submit allocation"}</button>
                    </div>
                  </div>
                </div>
              )}
              {lostLead && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
                  <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                    <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">
                          Lead outcome
                        </p>
                        <h2 className="mt-1 text-lg font-bold text-slate-900">
                          Mark lead as lost
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          {lostLead?.customerName?.customerName || "Lead"} · {lostLead?.leadId || "-"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={closeLostLead}
                        disabled={lostSubmitting}
                        className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
                        aria-label="Close lost lead dialog"
                      >
                        <X size={18} />
                      </button>
                    </div>

                    <div className="space-y-4 p-5">
                      <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
                        This action uses the same lost-lead workflow as Lead Follow-Up and removes the lead from the active reallocation list.
                      </div>
                      <label className="block text-sm font-semibold text-slate-700">
                        Remarks <span className="text-rose-600">*</span>
                        <textarea
                          rows={4}
                          value={lostRemarks}
                          onChange={(event) => {
                            setLostRemarks(event.target.value)
                            if (lostError) setLostError("")
                          }}
                          placeholder="Explain why this lead is lost..."
                          disabled={lostSubmitting}
                          className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-700 outline-none transition focus:border-rose-400 focus:ring-4 focus:ring-rose-100 disabled:bg-slate-50"
                        />
                      </label>
                      {lostError && <p className="text-sm text-rose-600">{lostError}</p>}
                    </div>

                    <div className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4">
                      <button
                        type="button"
                        onClick={closeLostLead}
                        disabled={lostSubmitting}
                        className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={submitLostLead}
                        disabled={lostSubmitting}
                        className="flex min-w-28 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {lostSubmitting && <FaSpinner className="h-4 w-4 animate-spin" />}
                        Mark as lost
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {isClosed && (
                <CollectionupdateModal
                  isClosed={true}
                  data={selectedData}
                  closemodal={setIsclosed}
                  partnerlist={partner}
                  loggedUser={loggedUser}
                  handleCollectionUpdate={handleCollectionUpdate}
                />
              )}
            </div>
          </div>
        </div>
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

function StyledSelect({ value, onChange, options, placeholder = "Select an option" }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const selected = options.find((option) => String(option.value) === String(value))

  useEffect(() => {
    if (!open) return undefined

    const closeOnOutsideClick = (event) => {
      if (!dropdownRef.current?.contains(event.target)) setOpen(false)
    }

    document.addEventListener("mousedown", closeOnOutsideClick)
    return () => document.removeEventListener("mousedown", closeOnOutsideClick)
  }, [open])

  return (
    <div ref={dropdownRef} className="relative mt-1.5">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 text-left text-sm shadow-sm outline-none transition ${open ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200 hover:border-slate-300"}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected ? "text-slate-700" : "text-slate-400"}>
          {selected?.label || placeholder}
        </span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-[120] max-h-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-slate-900/5" role="listbox">
          {options.length ? options.map((option) => {
            const isSelected = String(option.value) === String(value)
            return (
              <button
                type="button"
                key={option.value}
                onClick={() => { onChange(option.value); setOpen(false) }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition ${isSelected ? "bg-blue-50 font-semibold text-blue-700" : "text-slate-700 hover:bg-slate-50"}`}
                role="option"
                aria-selected={isSelected}
              >
                {option.label}
                {isSelected && <span className="text-xs text-blue-600">Selected</span>}
              </button>
            )
          }) : <p className="px-3 py-2.5 text-sm text-slate-400">No options available</p>}
        </div>
      )}
    </div>
  )
}

export default ReallocationTable
