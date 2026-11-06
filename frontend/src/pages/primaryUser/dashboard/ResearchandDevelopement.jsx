import { useEffect, useState } from "react"
import { useSelector } from "react-redux"
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  ClipboardList,
  Clock3,
  FolderKanban,
  SlidersHorizontal,
  LoaderCircle,
  Play,
  Pencil,
  Save,
  Square,
  UserRoundCheck,
  X
} from "lucide-react"
import api from "../../../api/api"
import { toast } from "react-toastify"
import UseFetch from "../../../hooks/useFetch"
import AnnouncementBanner from "../../../components/primaryUser/AnnouncementBanner"
import AnnouncementModal from "../../../components/primaryUser/AnnouncementModal"

const workStatuses = [
  { label: "All", count: 0, icon: FolderKanban, accent: "slate" },
  { label: "New", count: 8, icon: ClipboardList, accent: "blue" },
  { label: "In Progress", count: 12, icon: LoaderCircle, accent: "violet" },
  { label: "Pending", count: 5, icon: Clock3, accent: "amber" },
  { label: "Overdue", count: 3, icon: CircleAlert, accent: "rose" },
  { label: "Completed", count: 6, icon: CheckCircle2, accent: "emerald" }
]

const accentStyles = {
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  blue: "bg-blue-50 text-blue-600 ring-blue-100",
  violet: "bg-violet-50 text-violet-600 ring-violet-100",
  amber: "bg-amber-50 text-amber-600 ring-amber-100",
  rose: "bg-rose-50 text-rose-600 ring-rose-100",
  emerald: "bg-emerald-50 text-emerald-600 ring-emerald-100"
}

const priorityStyles = {
  High: "bg-rose-50 text-rose-600",
  Medium: "bg-amber-50 text-amber-600",
  Low: "bg-emerald-50 text-emerald-600"
}

const statusStyles = {
  All: "bg-slate-100 text-slate-600",
  New: "bg-blue-50 text-blue-600",
  "In Progress": "bg-violet-50 text-violet-600",
  Pending: "bg-amber-50 text-amber-600",
  Hold: "bg-orange-50 text-orange-600",
  Completed: "bg-emerald-50 text-emerald-600"
}

const getToday = () => new Date().toISOString().slice(0, 10)
const getCurrentTime = () => new Date().toTimeString().slice(0, 5)
const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const formatWorkDate = (value) => {
  if (!value) return "-"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      })
}

const formatTime = (value) => {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: true })
}

const to24HourTime = (hour, minute, period) => {
  if (!hour || !minute || !period) return "00:00"
  const normalizedHour = (Number(hour) % 12) + (period === "PM" ? 12 : 0)
  return `${String(normalizedHour).padStart(2, "0")}:${minute}`
}

const isResearchAndDevelopmentDepartment = (department) => {
  if (department?.code === "DEPARTMENT5") return true
  const departmentName = String(department?.department || department?.name || department || "")
    .replace(/[^a-z]/gi, "")
    .toLowerCase()
  return departmentName === "researchanddevelopment"
}

const getWorkedDuration = (sessions = [], activeStartedAt) => {
  const now = Date.now()
  const total = sessions.reduce((sum, session) => {
    const startedAt = new Date(session.startedAt).getTime()
    const endedAt = session.endedAt ? new Date(session.endedAt).getTime() : now
    return sum + (Number.isNaN(startedAt) ? 0 : Math.max(0, endedAt - startedAt))
  }, 0) || (activeStartedAt ? Math.max(0, now - new Date(activeStartedAt).getTime()) : 0)
  const minutes = Math.floor(total / 60000)
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`
}

const toDateInputValue = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return getToday()

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const formatDate = (value) => value ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value)) : "-"

const getRemainingDays = (status, expectedCompletionDate) => {
  if (status !== "In Progress" || !expectedCompletionDate) return "-"
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const completion = new Date(expectedCompletionDate)
  completion.setHours(0, 0, 0, 0)
  const days = Math.ceil((completion - today) / 86400000)
  if (days < 0) return `${Math.abs(days)}d overdue`
  return days === 0 ? "Due today" : `${days}d left`
}

const isOverdue = (item) => {
  if (item.status !== "In Progress" || !item.expectedCompletionDate) return false
  const expectedDate = new Date(item.expectedCompletionDate)
  expectedDate.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return expectedDate < today
}

const getCompletedAt = (item) => item.taskCompletedAt || [...(item.taskTimeline || [])]
  .reverse()
  .find((event) => event.event === "Development Completed")?.at

const isCompletedInSelectedPeriod = (item, month, year) => {
  const completedAt = getCompletedAt(item)
  if (!completedAt) return false

  const completedDate = new Date(completedAt)
  return completedDate.getFullYear() === Number(year)
    && months[completedDate.getMonth()] === month
}

const codingAndQcTaskId = "689c23493e94902039b97743"

const getIdValue = (value) => String(value?._id || value || "")

/*
  /rnd-leads intentionally exposes the current Coding & QC allocation only.
  The lead-detail endpoint already exposes the complete activity log, so use
  its Coding & QC entries to build one chronological history on the client.
*/
const getMergedRndTimeline = (activityLog = [], fallbackTimeline = []) => {
  const events = activityLog
    .filter((log) =>
      getIdValue(log?.taskId) === codingAndQcTaskId ||
      getIdValue(log?.taskBy) === codingAndQcTaskId
    )
    .flatMap((log) =>
      (log.taskTimeline || []).map((event) => ({
        ...event,
        allocatedTo: log.taskallocatedTo?.name || "",
        allocatedBy: log.taskallocatedBy?.name || "",
        isSelfAllocated:
          getIdValue(log.taskallocatedTo) === getIdValue(log.taskallocatedBy)
      }))
    )

  return events.length ? events : fallbackTimeline
}

const toWorkItem = (lead) => ({
  id: lead.leadId,
  leadDocId: lead.leadDocId,
  customer: lead.customerName || "-",
  work:
    lead.products
      ?.map((product) => product.shortName || product.productName)
      .filter(Boolean)
      .join(", ") || "Coding & QC",
  taskTitle: lead.taskTitle || "",
  allocationDescription: lead.allocationDescription || "",
  priority: "Medium",
  due: formatWorkDate(lead.followupClosedDate),
  followupClosedDate: toDateInputValue(lead.followupClosedDate),
  status: lead.assignedDeveloper ? lead.taskStatus || "Pending" : "New",
  progress: 0,
  assignedDeveloper: lead.assignedDeveloper || "",
  assignedDeveloperId: lead.assignedDeveloperId || "",
  allocatedBy: lead.allocatedBy || "",
  allocatedTo: lead.allocatedTo || lead.assignedDeveloper || "",
  isSelfAllocated: Boolean(lead.isSelfAllocated),
  taskRemark: lead.taskRemark || "",
  nextAllocationTask: lead.nextAllocationTask || "",
  taskStartedAt: lead.taskStartedAt || "",
  taskEndedAt: lead.taskEndedAt || "",
  taskCompletedAt: lead.taskCompletedAt || "",
  taskSessions: lead.taskSessions || [],
  allocationDate: lead.allocationDate || "",
  allocationTime: lead.allocationTime || "",
  expectedCompletionDate: lead.expectedCompletionDate || "",
  taskTimeline: lead.taskTimeline || [],
  assignedTask: lead.assignedTask,
  latestActivityLog: lead.latestActivityLog
})

export default function ResearchandDevelopement() {
  const today = new Date()
  const [, setTimerTick] = useState(0)
  const selectedBranch = useSelector(
    (state) => state.companyBranch.selectedBranch
  )
  const [loggedUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null")
    } catch {
      return null
    }
  })
  const [month, setMonth] = useState(months[today.getMonth()])
  const [year, setYear] = useState(String(today.getFullYear()))
  const [workItems, setWorkItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [developmentStaff, setDevelopmentStaff] = useState([])
  const [nextAllocationTasks, setNextAllocationTasks] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedWork, setSelectedWork] = useState(null)
  const [modal, setModal] = useState(null)
  const [allocation, setAllocation] = useState({})
  const [update, setUpdate] = useState({})
  const [endTaskWork, setEndTaskWork] = useState(null)
  const [taskDescription, setTaskDescription] = useState("")
  const [timelineWork, setTimelineWork] = useState(null)
  const [descriptionWork, setDescriptionWork] = useState(null)
  const [activeStatusFilter, setActiveStatusFilter] = useState("New")
  const [completedFilterMenu, setCompletedFilterMenu] = useState(null)
  const [leadScope, setLeadScope] = useState("All")
  const [openAnnouncementPopup, setOpenAnnouncementPopup] = useState(false)
  const { data: announcementList, refreshHook: refreshAnnouncements } = UseFetch("/dashboard/getcurrentAnnouncement")

  useEffect(() => {
    let active = true

    const fetchWorkItems = async () => {
      setIsLoading(true)
      setLoadError("")

      try {
        const response = await api.get("/lead/rnd-leads", {
          params: selectedBranch ? { branchId: selectedBranch } : undefined
        })

        if (active) {
          const items = (response.data?.data || []).map(toWorkItem)
          const ownedItems = items.filter((item) => String(item.assignedDeveloperId) === String(loggedUser?._id))
          const preferredStatus = ["Pending", "In Progress", "Overdue", "Completed"].find((status) =>
            ownedItems.some((item) => status === "Overdue" ? isOverdue(item) : item.status === status)
          )
          setWorkItems(items)
          setLeadScope(
            isResearchAndDevelopmentDepartment(loggedUser?.department)
              ? "Owned"
              : "All"
          )
          setActiveStatusFilter(preferredStatus || "Pending")
        }
      } catch (error) {
        if (active) {
          setWorkItems([])
          setLoadError(
            error.response?.data?.message || "Unable to load R&D leads"
          )
        }
      } finally {
        if (active) setIsLoading(false)
      }
    }

    fetchWorkItems()
    return () => {
      active = false
    }
  }, [selectedBranch, refreshKey])

  useEffect(() => {
    let active = true

    const fetchDevelopmentStaff = async () => {
      try {
        const response = await api.get("/auth/getallUsers?isVerified=true")
        const users = response.data?.data?.allusers || []
        const researchAndDevelopmentUsers = users.filter(
          (user) =>
            user.department?.department?.trim().toLowerCase() ===
            "research and development"
        )

        if (active) setDevelopmentStaff(researchAndDevelopmentUsers)
      } catch {
        if (active) setDevelopmentStaff([])
      }
    }

    fetchDevelopmentStaff()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setTimerTick((tick) => tick + 1), 60000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let active = true

    api.get("/lead/getallTask")
      .then((response) => {
        const tasks = (response.data?.data || []).filter(
          (task) => task.listed && task._id !== "689c23493e94902039b97743"
        )
        if (active) setNextAllocationTasks(tasks)
      })
      .catch(() => {
        if (active) setNextAllocationTasks([])
      })

    return () => {
      active = false
    }
  }, [])

  const scopedWorkItems = workItems.filter((item) =>
    leadScope !== "Owned" || String(item.assignedDeveloperId) === String(loggedUser?._id)
  )

  const matchesStatus = (item, status) => {
    if (status === "Completed") {
      // The month selector is an all-leads report filter. A developer's own
      // completed work remains visible regardless of when it was completed.
      return item.status === "Completed"
        && (leadScope === "Owned" || isCompletedInSelectedPeriod(item, month, year))
    }
    if (status === "Overdue") return isOverdue(item)
    // An overdue task is shown in the Overdue bucket, not counted twice as
    // both In Progress and Overdue.
    if (status === "In Progress") return item.status === status && !isOverdue(item)
    return item.status === status
  }

  const statusCounts = workStatuses.map((status) => {
    const count = status.label === "All"
      ? workStatuses
        .filter((item) => item.label !== "All")
        .reduce((total, item) => total + scopedWorkItems.filter((work) => matchesStatus(work, item.label)).length, 0)
      : scopedWorkItems.filter((item) => matchesStatus(item, status.label)).length

    return { ...status, count }
  })
  const filteredWorkItems = scopedWorkItems.filter((item) =>
    activeStatusFilter === "All" || matchesStatus(item, activeStatusFilter)
  ).sort((left, right) => {
    if (!["In Progress", "Pending", "Overdue"].includes(activeStatusFilter)) return 0
    const leftTime = new Date(left.expectedCompletionDate).getTime()
    const rightTime = new Date(right.expectedCompletionDate).getTime()
    if (Number.isNaN(leftTime)) return Number.isNaN(rightTime) ? 0 : 1
    if (Number.isNaN(rightTime)) return -1
    return leftTime - rightTime
  })
  const showAllocationColumns = activeStatusFilter !== "New"
  const announcement = announcementList?.[0]?.announcement
    ? announcementList[0]
    : { announcementTitle: "Announcements", announcement: "There are no announcements at the moment.", postedBy: "CAMET CRM" }

  const saveAnnouncement = async (annoucementtext) => {
    const response = await api.post("/dashboard/updateAnnouncement", { annoucementtext })
    toast.success(response.data?.message || "Announcement updated")
    refreshAnnouncements?.()
    return response.data
  }

  const openAllocation = (item) => {
    setSelectedWork(item)
    setAllocation({
      allocationDate: item.followupClosedDate,
      allocationTime: getCurrentTime(),
      assignedBy: loggedUser?.name || "",
      assignedDeveloper: item.assignedDeveloper || "",
      priority: item.priority,
      expectedCompletionDate: "",
      expectedCompletionHour: "",
      expectedCompletionMinute: "00",
      expectedCompletionPeriod: "AM",
      taskTitle: "",
      allocationDescription: ""
    })
    setModal("allocation")
  }

  const openUpdate = (item) => {
    setSelectedWork(item)
    setUpdate({
      status: item.status === "New" ? "Pending" : item.status,
      remark: item.taskRemark || "",
      allocationDate: toDateInputValue(item.allocationDate),
      expectedCompletionDate: item.expectedCompletionDate ? toDateInputValue(item.expectedCompletionDate) : "",
      isNeedChangeDate: false,
      isTransfer: false,
      transferredTo: "",
      transferRemark: ""
    })
    setModal("update")
  }

  const openTimeline = async (item) => {
    // Show the current allocation immediately while the complete lead history
    // is being loaded. This keeps the modal responsive on slower connections.
    setTimelineWork({ ...item, timelineLoading: true })
    setModal("timeline")

    try {
      const response = await api.get("/lead/getSelectedLead", {
        params: { leadId: item.leadDocId }
      })
      const lead = response.data?.data?.[0]
      const taskTimeline = getMergedRndTimeline(
        lead?.activityLog,
        item.taskTimeline
      )

      setTimelineWork((current) =>
        current?.leadDocId === item.leadDocId
          ? { ...current, taskTimeline, timelineLoading: false }
          : current
      )
    } catch {
      // The current allocation's timeline remains usable if detail loading fails.
      setTimelineWork((current) =>
        current?.leadDocId === item.leadDocId
          ? { ...current, timelineLoading: false }
          : current
      )
    }
  }

  const saveAllocation = async (event) => {
    event.preventDefault()
    try {
      await api.post("/lead/rnd-allocation", {
        leadDocId: selectedWork.leadDocId,
        allocatedTo: allocation.assignedDeveloper,
        allocationDate: allocation.allocationDate,
        allocationTime: allocation.allocationTime,
        expectedCompletionDate: allocation.expectedCompletionDate
          ? `${allocation.expectedCompletionDate}T${to24HourTime(allocation.expectedCompletionHour, allocation.expectedCompletionMinute, allocation.expectedCompletionPeriod)}`
          : "",
        taskTitle: allocation.taskTitle,
        allocationDescription: allocation.allocationDescription
      })

      toast.success("Coding & QC task allocated")
      setModal(null)
      setRefreshKey((current) => current + 1)
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to allocate Coding & QC task"
      )
    }
  }

  const startTask = async (item) => {
    try {
      const response = await api.post("/lead/rnd-task-update", {
        leadDocId: item.leadDocId,
        action: "start"
      })
      const task = response.data?.data || {}
      setWorkItems((items) => items.map((workItem) => workItem.id === item.id ? { ...workItem, status: task.taskStatus || "In Progress", taskStartedAt: task.taskStartedAt, taskEndedAt: task.taskEndedAt || "", taskSessions: task.taskSessions || workItem.taskSessions, taskTimeline: task.taskTimeline || workItem.taskTimeline } : workItem))
      toast.success("Task start time saved")
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to start task")
    }
  }

  const openEndTask = (item) => {
    setEndTaskWork(item)
    setTaskDescription("")
    setModal("end-task")
  }

  const saveEndTask = async (event) => {
    event.preventDefault()
    try {
      const response = await api.post("/lead/rnd-task-update", {
        leadDocId: endTaskWork.leadDocId,
        action: "end",
        taskDescription
      })
      const task = response.data?.data || {}
      setWorkItems((items) => items.map((item) => item.id === endTaskWork.id ? { ...item, taskEndedAt: task.taskEndedAt, taskSessions: task.taskSessions || item.taskSessions, taskTimeline: task.taskTimeline || item.taskTimeline } : item))
      setModal(null)
      setEndTaskWork(null)
      toast.success("Task end time and description saved")
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to end task")
    }
  }

  const saveUpdate = async (event) => {
    event.preventDefault()
    try {
      if (update.isTransfer) {
        const response = await api.post("/lead/rnd-task-transfer", {
          leadDocId: selectedWork.leadDocId,
          transferredTo: update.transferredTo,
          transferRemark: update.transferRemark,
          expectedCompletionDate: update.expectedCompletionDate || undefined
        })
        const transferredTask = response.data?.data || {}

        // A transfer is a new allocation for the receiving developer.
        // Reflect its Pending state immediately while the list refreshes.
        setWorkItems((items) => items.map((item) =>
          item.id === selectedWork.id
            ? {
                ...item,
                assignedDeveloper:
                  transferredTask.assignedDeveloper || item.assignedDeveloper,
                assignedDeveloperId:
                  transferredTask.assignedDeveloperId || item.assignedDeveloperId,
                status: transferredTask.taskStatus || "Pending",
                expectedCompletionDate:
                  transferredTask.expectedCompletionDate || item.expectedCompletionDate,
                taskTimeline: transferredTask.taskTimeline || item.taskTimeline
              }
            : item
        ))
        setActiveStatusFilter("Pending")
        toast.success("Coding & QC task transferred")
        setModal(null)
        setRefreshKey((current) => current + 1)
        return
      }

      const response = await api.post("/lead/rnd-task-update", {
        leadDocId: selectedWork.leadDocId,
        action: "status",
        status: update.status,
        remark: update.remark,
        isNeedChangeDate: update.isNeedChangeDate,
        expectedCompletionDate: update.isNeedChangeDate ? update.expectedCompletionDate : undefined
      })
      const task = response.data?.data || {}
      setWorkItems((items) => items.map((item) => item.id === selectedWork.id ? { ...item, status: task.taskStatus, taskRemark: task.taskRemark, expectedCompletionDate: task.expectedCompletionDate || item.expectedCompletionDate, taskCompletedAt: task.taskCompletedAt || item.taskCompletedAt, taskTimeline: task.taskTimeline || item.taskTimeline } : item))
      setModal(null)
      toast.success("Task status updated")
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to update task status")
    }
  }

  const rejectTask = async (item) => {
    if (!window.confirm(`Reject the Coding & QC task for lead ${item.id}?`)) return

    try {
      await api.post("/lead/rnd-task-update", {
        leadDocId: item.leadDocId,
        action: "reject"
      })
      setWorkItems((items) => items.filter((workItem) => workItem.id !== item.id))
      setRefreshKey((current) => current + 1)
      toast.success("Coding & QC task rejected and previous allocation restored")
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to reject Coding & QC task")
    }
  }

  return (
    <main className="h-full min-h-0 overflow-hidden bg-[#ADD8E6] p-3 sm:px-5 sm:pb-5 lg:px-6  lg:pb-6 pt-0">
      <div className="mx-auto flex h-full min-h-0 max-w-7xl flex-col">
        <AnnouncementBanner announcementlist={announcement} setopenannoucementpopup={setOpenAnnouncementPopup} />

        <header className="mb-3 shrink-0 border-l-2 border-blue-500 pl-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-600 sm:text-xs">Research & Development</p>
          <div className="mt-0.5 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-2.5">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">My Work Summary</h1>
            <p className="text-xs text-slate-500 sm:text-sm">A quick view of your current work status.</p>
          </div>
        </header>

        <section aria-label="Work status" className="grid shrink-0 grid-cols-2 gap-6 md:grid-cols-6">
          {statusCounts.map(({ label, count, icon: Icon, accent }) => {
            const isActive = activeStatusFilter === label
            return <button type="button" key={label} onClick={() => { setActiveStatusFilter(label); setCompletedFilterMenu(null) }} aria-pressed={isActive} className={`group flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-blue-300 ${isActive ? "border-blue-400 bg-blue-50 shadow-md ring-1 ring-blue-200" : "border-slate-100 bg-white hover:-translate-y-0.5 hover:shadow-md"}`}>
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg ring-1 ${accentStyles[accent]}`}><Icon size={15} strokeWidth={2.2} /></span>
              <p className="min-w-0 flex-1 truncate text-xs font-medium text-slate-600">{label}</p>
              <span className="text-lg font-bold leading-none tracking-tight text-slate-900">{String(count).padStart(2, "0")}</span>
            </button>
          })}
        </section>

        <section className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600"><FolderKanban size={18} /></span>
              <div><h2 className="text-sm font-semibold text-slate-900">{activeStatusFilter} leads</h2><p className="text-xs text-slate-500">Click a status tile to change the list</p></div>
            </div>
            <div className="flex w-full items-center gap-2 sm:w-auto">
              <div className="relative min-w-0 flex-1 sm:w-28 sm:flex-none"><button type="button" onClick={() => setCompletedFilterMenu(completedFilterMenu === "scope" ? null : "scope")} className="flex h-8 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"><span className="inline-flex items-center gap-1.5"><SlidersHorizontal size={13} className="text-blue-600" />{leadScope}</span><ChevronRight size={14} className={`transition ${completedFilterMenu === "scope" ? "-rotate-90 text-blue-600" : "rotate-90 text-slate-400"}`} /></button>{completedFilterMenu === "scope" && <div className="absolute right-0 top-10 z-30 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"><p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Lead visibility</p>{["All", "Owned"].map((scope) => <button type="button" key={scope} onClick={() => { setLeadScope(scope); setCompletedFilterMenu(null) }} className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition ${leadScope === scope ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}><span>{scope === "All" ? "All leads" : "Assigned to me"}</span>{leadScope === scope && <CheckCircle2 size={13} />}</button>)}</div>}</div>
            {activeStatusFilter === "Completed" && leadScope === "All" && <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-500"><CalendarDays size={15} /></span>
              <div className="relative min-w-0 flex-1 sm:w-32 sm:flex-none"><button type="button" onClick={() => setCompletedFilterMenu(completedFilterMenu === "month" ? null : "month")} className="flex h-8 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"><span>{month}</span><ChevronRight size={14} className={`transition ${completedFilterMenu === "month" ? "-rotate-90 text-blue-600" : "rotate-90 text-slate-400"}`} /></button>{completedFilterMenu === "month" && <div className="absolute right-0 top-10 z-30 grid w-64 grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl"><p className="col-span-3 px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Select month</p>{months.map((item) => <button type="button" key={item} onClick={() => { setMonth(item); setCompletedFilterMenu(null) }} className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${month === item ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}>{item.slice(0, 3)}</button>)}</div>}</div>
              <div className="relative w-24 shrink-0"><button type="button" onClick={() => setCompletedFilterMenu(completedFilterMenu === "year" ? null : "year")} className="flex h-8 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-100"><span>{year}</span><ChevronRight size={14} className={`transition ${completedFilterMenu === "year" ? "-rotate-90 text-blue-600" : "rotate-90 text-slate-400"}`} /></button>{completedFilterMenu === "year" && <div className="absolute right-0 top-10 z-30 w-28 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">{[2025, 2026, 2027, 2028].map((item) => <button type="button" key={item} onClick={() => { setYear(String(item)); setCompletedFilterMenu(null) }} className={`w-full rounded-lg px-2 py-2 text-left text-xs font-semibold transition ${year === String(item) ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}>{item}</button>)}</div>}</div>
            </div>}</div>
          </div>

          <div className="hidden min-h-0 flex-1 overflow-y-auto overflow-x-hidden md:block">
            <table className="w-full table-fixed text-left text-xs">
              <thead className="sticky top-0 z-20 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500 shadow-sm"><tr><th className="w-[60px] whitespace-nowrap bg-slate-50 px-3 py-2 font-semibold">Lead ID</th><th className="w-[120px] whitespace-nowrap bg-slate-50 px-3 py-2 font-semibold">Customer</th>{showAllocationColumns && <><th className="w-[160px] whitespace-nowrap bg-slate-50 px-3 py-2 font-semibold">Task title</th><th className="hidden w-[110px] whitespace-nowrap bg-slate-50 px-3 py-2 font-semibold lg:table-cell">Developer</th><th className="hidden w-[80px] whitespace-nowrap bg-slate-50 px-3 py-2 font-semibold xl:table-cell">Priority</th><th className="hidden w-[80px] whitespace-nowrap bg-slate-50 px-3 py-2 font-semibold xl:table-cell">Remaining</th></>}<th className="w-[90px] whitespace-nowrap bg-slate-50 px-3 py-2 font-semibold">Status</th><th className="w-[110px] whitespace-nowrap bg-slate-50 px-3 py-2 text-center font-semibold">Start</th><th className="w-[52px] whitespace-nowrap bg-slate-50 px-3 py-2 text-center font-semibold">End</th><th className="hidden w-[52px] whitespace-nowrap bg-slate-50 px-3 py-2 text-center font-semibold xl:table-cell">Timeline</th><th className="w-[90px] whitespace-nowrap bg-slate-50 px-2 py-2 text-center font-semibold">Action</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan="11" className="px-5 py-10 text-center text-sm text-slate-500">Loading R&D leads...</td></tr>
                ) : loadError ? (
                  <tr><td colSpan="11" className="px-5 py-10 text-center text-sm text-rose-600">{loadError}</td></tr>
                ) : filteredWorkItems.length === 0 ? (
                  <tr><td colSpan="11" className="px-5 py-10 text-center text-sm text-slate-500">No {activeStatusFilter.toLowerCase()} leads found.</td></tr>
                ) : (
                  filteredWorkItems.map((item) => <WorkRow key={item.leadDocId} item={item} showAllocationColumns={showAllocationColumns} canOperate={String(item.assignedDeveloperId) === String(loggedUser?._id)} isActive={Boolean(item.taskStartedAt && !item.taskEndedAt)} onAllocate={openAllocation} onUpdate={openUpdate} onStart={startTask} onEnd={openEndTask} onReject={rejectTask} onDescription={(work) => { setDescriptionWork(work); setModal("description") }} onTimeline={openTimeline} />)
                )}
              </tbody>
            </table>
          </div>
          <div className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto md:hidden">
            {isLoading && <p className="p-5 text-center text-sm text-slate-500">Loading R&D leads...</p>}
            {!isLoading && loadError && <p className="p-5 text-center text-sm text-rose-600">{loadError}</p>}
            {!isLoading && !loadError && filteredWorkItems.length === 0 && <p className="p-5 text-center text-sm text-slate-500">No {activeStatusFilter.toLowerCase()} leads found.</p>}
            {!isLoading && !loadError && filteredWorkItems.map((item) => <WorkCard key={item.leadDocId} item={item} canOperate={String(item.assignedDeveloperId) === String(loggedUser?._id)} isActive={Boolean(item.taskStartedAt && !item.taskEndedAt)} onAllocate={openAllocation} onUpdate={openUpdate} onStart={startTask} onEnd={openEndTask} onReject={rejectTask} onDescription={(work) => { setDescriptionWork(work); setModal("description") }} onTimeline={openTimeline} />)}
          </div>
        </section>
      </div>
      {modal === "allocation" && <AllocationModal work={selectedWork} value={allocation} developmentStaff={developmentStaff} onChange={setAllocation} onClose={() => setModal(null)} onSubmit={saveAllocation} />}
      {modal === "update" && <WorkUpdateModal work={selectedWork} value={update} developmentStaff={developmentStaff} onChange={setUpdate} onClose={() => setModal(null)} onSubmit={saveUpdate} />}
      {modal === "end-task" && <EndTaskModal work={endTaskWork} value={taskDescription} onChange={setTaskDescription} onClose={() => setModal(null)} onSubmit={saveEndTask} />}
      {modal === "timeline" && <TaskTimelineModal work={timelineWork} onClose={() => setModal(null)} />}
      {modal === "description" && <WorkDescriptionModal work={descriptionWork} onClose={() => setModal(null)} />}
      {openAnnouncementPopup && <AnnouncementModal open={openAnnouncementPopup} isAdmin={loggedUser?.role === "Admin"} announcements={announcement} onSubmit={saveAnnouncement} onClose={() => setOpenAnnouncementPopup(false)} onSuccess={() => setOpenAnnouncementPopup(false)} />}
    </main>
  )
}

function CellTooltip({ value, className = "" }) {
  return <span className="group relative block min-w-0"><span className={`block truncate ${className}`}>{value}</span><span role="tooltip" className="pointer-events-none invisible absolute left-0 top-[calc(100%+6px)] z-30 max-w-64 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium normal-case text-white opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">{value}</span></span>
}

function WorkRow({ item, showAllocationColumns, canOperate, isActive, onAllocate, onUpdate, onStart, onEnd, onReject, onDescription, onTimeline }) {
  const isAllocated = Boolean(item.assignedDeveloper) && item.status !== "New"
  const isStartEndBlocked = ["Hold", "Completed"].includes(item.status)
  const disabledClass = "cursor-not-allowed bg-slate-100 text-slate-300"
  const remainingDays = getRemainingDays(item.status, item.expectedCompletionDate)
  const startedAt = formatTime(item.taskStartedAt)
  const workedDuration = getWorkedDuration(item.taskSessions, item.taskStartedAt)
  const startDisabled = !isAllocated || !canOperate || isActive || isStartEndBlocked
  const endDisabled = !isAllocated || !canOperate || !isActive || isStartEndBlocked
  const startClass = startedAt && startDisabled
    ? "cursor-not-allowed bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
    : startDisabled
      ? disabledClass
      : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
  const blockedTitle = isStartEndBlocked ? "Tasks on hold or completed cannot be started or ended" : !isAllocated ? "Allocate a developer first" : "Only the assigned developer can start or end this task"
  const title = item.taskTitle || item.work
  return <tr className="text-slate-600 transition hover:bg-slate-50/80"><td className="whitespace-nowrap px-3 py-2 font-semibold text-blue-600">{item.id}</td><td className="px-3 py-2"><CellTooltip value={item.customer} className="font-medium uppercase text-slate-700" /></td>{showAllocationColumns && <><td className="px-3 py-2">{isAllocated && <span className="group relative block min-w-0"><button type="button" onClick={() => onDescription(item)} className="block w-full truncate text-left font-semibold text-blue-600 transition hover:text-blue-800 hover:underline" title="View task description">{title}</button><span role="tooltip" className="pointer-events-none invisible absolute left-0 top-[calc(100%+6px)] z-30 max-w-64 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">{title}</span></span>}</td><td className="hidden px-3 py-2 lg:table-cell">{isAllocated && <CellTooltip value={item.assignedDeveloper || "-"} className="font-medium text-slate-700" />}</td><td className="hidden px-3 py-2 xl:table-cell">{isAllocated && <Badge className={priorityStyles[item.priority]}>{item.priority}</Badge>}</td><td className="hidden whitespace-nowrap px-3 py-2 font-semibold text-slate-600 xl:table-cell">{isAllocated && remainingDays}</td></>}<td className="px-3 py-2"><Badge className={statusStyles[item.status]}>{item.status}</Badge></td><td className="px-3 py-2 text-center"><button type="button" disabled={startDisabled} onClick={() => onStart(item)} title={startDisabled ? blockedTitle : "Start task"} className={`inline-flex h-8 max-w-full items-center gap-1 truncate rounded-md px-2 text-xs font-bold transition ${startClass}`}><Play size={13} strokeWidth={2.5} /><span className="truncate">{startedAt ? `Running · ${workedDuration}` : "Start"}</span></button></td><td className="px-3 py-2 text-center"><button type="button" disabled={endDisabled} onClick={() => onEnd(item)} title={endDisabled ? blockedTitle : "End task"} className={`inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-semibold transition ${endDisabled ? disabledClass : "bg-rose-50 text-rose-600 hover:bg-rose-100"}`}><Square size={12} />End</button></td><td className="hidden px-3 py-2 text-center xl:table-cell"><button type="button" disabled={!isAllocated} onClick={() => onTimeline(item)} title={isAllocated ? "View Coding & QC timeline" : "Allocate a developer first"} className={`inline-grid h-8 w-8 place-items-center rounded-md transition ${isAllocated ? "bg-violet-50 text-violet-600 hover:bg-violet-100" : disabledClass}`}><Clock3 size={14} /></button></td><td className="px-2 py-2 text-center"><div className="flex justify-center gap-1.5"><button type="button" onClick={() => isAllocated ? onUpdate(item) : onAllocate(item)} title={isAllocated ? "Task status" : "Allocate work"} className="inline-grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300">{isAllocated ? <Pencil size={17} /> : <UserRoundCheck size={18} />}</button>{(isAllocated || item.status === "New") && <button type="button" onClick={() => onReject(item)} title="Reject Coding & QC task" className="inline-grid h-9 w-9 place-items-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100 focus:outline-none focus:ring-2 focus:ring-rose-200"><X size={17} strokeWidth={2.5} /></button>}</div></td></tr>
}

function WorkCard({ item, canOperate, isActive, onAllocate, onUpdate, onStart, onEnd, onReject, onDescription, onTimeline }) {
  const isAllocated = Boolean(item.assignedDeveloper) && item.status !== "New"
  const isStartEndBlocked = ["Hold", "Completed"].includes(item.status)
  const startedAt = formatTime(item.taskStartedAt)
  const workedDuration = getWorkedDuration(item.taskSessions, item.taskStartedAt)
  const startDisabled = !isAllocated || !canOperate || isActive || isStartEndBlocked
  const startClass = startedAt && startDisabled
    ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 disabled:cursor-not-allowed"
    : "bg-emerald-50 text-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300"
  return <article className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-xs font-semibold text-blue-600">{item.id}</p><button type="button" onClick={() => onDescription(item)} className="mt-1 text-left text-sm font-semibold text-blue-600 hover:underline">{item.taskTitle || item.work}</button><p className="mt-1 text-xs text-slate-500">{item.customer}{item.assignedDeveloper ? ` · ${item.assignedDeveloper}` : ""}</p></div><Badge className={priorityStyles[item.priority]}>{item.priority}</Badge></div><div className="mt-3 flex items-center justify-between gap-3 text-xs"><span className="text-slate-500">Due: <strong className="font-medium text-slate-700">{item.due}</strong></span><Badge className={statusStyles[item.status]}>{item.status}</Badge></div><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={startDisabled} onClick={() => onStart(item)} className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-bold ${startClass}`}><Play size={13} strokeWidth={2.5} />{startedAt ? `Running · ${workedDuration}` : "Start"}</button><button type="button" disabled={!isAllocated || !canOperate || !isActive || isStartEndBlocked} onClick={() => onEnd(item)} className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-300"><Square size={12} />End</button>{isAllocated && <button type="button" onClick={() => onTimeline(item)} className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-600"><Clock3 size={13} />Timeline</button>}<button type="button" onClick={() => isAllocated ? onUpdate(item) : onAllocate(item)} className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-100">{isAllocated ? <Pencil size={13} /> : <UserRoundCheck size={13} />}{isAllocated ? "Task acceptance" : "Allocate work"}</button>{(isAllocated || item.status === "New") && <button type="button" onClick={() => onReject(item)} className="inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 transition hover:bg-rose-100"><X size={13} />Reject</button>}</div></article>
}

function ModalShell({ title, subtitle, children, onClose, scrollable = true }) {
  return <div className="fixed inset-0 z-50 flex items-end bg-slate-950/40 p-0 backdrop-blur-[1px] sm:items-center sm:justify-center sm:p-4"><section role="dialog" aria-modal="true" aria-label={title} className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-2xl sm:rounded-2xl"><header className="z-10 shrink-0 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4"><div><p className="text-sm font-bold text-slate-900">{title}</p><p className="mt-0.5 text-xs text-slate-500">{subtitle}</p></div><button type="button" onClick={onClose} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button></header><div className={scrollable ? "min-h-0 flex-1 overflow-y-auto" : "contents"}>{children}</div></section></div>
}

function Field({ label, children }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>{children}</label>
}

const inputClass = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
const selectClass = "h-10 w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

function AllocationModal({ work, value, developmentStaff, onChange, onClose, onSubmit }) {
  const set = (key, nextValue) => onChange((current) => ({ ...current, [key]: nextValue }))
  return <ModalShell title="Allocate development work" subtitle={`${work.id} · ${work.work}`} onClose={onClose} scrollable={false}>
    <form onSubmit={onSubmit} className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        <div className="grid gap-x-4 gap-y-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-3">
          <span><strong className="block text-slate-800">{work.customer}</strong>Customer</span>
          <span><strong className="block text-slate-800">{work.id}</strong>Lead Id</span>
          <span><strong className="block text-slate-800">R&D</strong>Department</span>
          <span><strong className="block text-slate-800">{formatDate(value.allocationDate)}</strong>Allocation date</span>
          <span><strong className="block text-slate-800">{value.allocationTime || "-"}</strong>Allocation time</span>
          <span><strong className="block text-slate-800">Pending</strong>Initial status</span>
        </div>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <Field label="Assigned by"><input readOnly value={value.assignedBy || "-"} className={inputClass} /></Field>
          <Field label="Assigned developer"><select required value={value.assignedDeveloper} onChange={(e) => set("assignedDeveloper", e.target.value)} className={selectClass} disabled={developmentStaff.length === 0}><option value="">{developmentStaff.length ? "Select R&D staff" : "No R&D staff available"}</option>{developmentStaff.map((staff) => <option key={staff._id} value={staff._id}>{staff.name}</option>)}</select></Field>
          <Field label="Priority"><select value={value.priority} onChange={(e) => set("priority", e.target.value)} className={selectClass}>{["High", "Medium", "Low"].map((priority) => <option key={priority}>{priority}</option>)}</select></Field>
          <section className="sm:col-span-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-white shadow-sm"><CalendarDays size={14} /></span><div><p className="text-xs font-bold text-slate-800">Delivery schedule</p><p className="text-[10px] text-slate-500">Set the expected completion date and time.</p></div></div>
              <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700">12-hour time</span>
            </div>
            <div className="grid min-w-0 gap-3 sm:grid-cols-2">
              <label className="block min-w-0"><span className="mb-1.5 block text-[11px] font-semibold text-slate-600">Target date</span><input type="date" min={toDateInputValue(value.allocationDate)} value={value.expectedCompletionDate} onChange={(e) => set("expectedCompletionDate", e.target.value)} className="h-10 min-w-0 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
              <div className="min-w-0"><span className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-slate-600"><Clock3 size={12} className="text-blue-600" /> Target time</span><div className="flex h-10 min-w-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 transition focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100"><label className="min-w-0 flex-1"><span className="sr-only">Expected completion hour</span><select value={value.expectedCompletionHour} onChange={(e) => set("expectedCompletionHour", e.target.value)} className="h-8 w-full min-w-0 bg-transparent px-1 text-center text-sm font-semibold text-slate-800 outline-none"><option value="">HH</option>{Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0")).map((hour) => <option key={hour} value={hour}>{hour}</option>)}</select></label><span className="text-base font-semibold text-slate-300">:</span><label className="min-w-0 flex-1"><span className="sr-only">Expected completion minute</span><select value={value.expectedCompletionMinute} onChange={(e) => set("expectedCompletionMinute", e.target.value)} className="h-8 w-full min-w-0 bg-transparent px-1 text-center text-sm font-semibold text-slate-800 outline-none">{["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((minute) => <option key={minute} value={minute}>{minute}</option>)}</select></label><span className="h-5 w-px bg-slate-200" /><label className="min-w-0 flex-[1.15]"><span className="sr-only">Expected completion period</span><select value={value.expectedCompletionPeriod} onChange={(e) => set("expectedCompletionPeriod", e.target.value)} className="h-8 w-full min-w-0 bg-transparent px-1 text-center text-xs font-bold text-blue-700 outline-none"><option>AM</option><option>PM</option></select></label></div></div>
            </div>
          </section>
        </div>

        <Field label="Task title"><input required value={value.taskTitle} onChange={(e) => set("taskTitle", e.target.value)} placeholder="Enter a clear task title" className={inputClass} /></Field>
        <Field label="Task description"><textarea required rows="5" value={value.allocationDescription} onChange={(e) => set("allocationDescription", e.target.value)} placeholder="Describe the work to be completed..." className="min-h-[120px] w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></Field>
      </div>
      <footer className="z-20 shrink-0 flex justify-end gap-3 border-t border-slate-100 bg-white/95 px-5 py-4 shadow-[0_-8px_20px_rgba(15,23,42,0.06)] backdrop-blur"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">Cancel</button><button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"><Save size={15} /> Allocate task</button></footer>
    </form>
  </ModalShell>
}

function WorkUpdateModal({ work, value, developmentStaff, onChange, onClose, onSubmit }) {
  const set = (key, nextValue) => onChange((current) => ({ ...current, [key]: nextValue }))
  const canManageDates = ["Pending", "In Progress"].includes(value.status)
  const canTransfer = value.status === "In Progress"
  const availableStaff = developmentStaff.filter(
    (staff) => String(staff._id) !== String(work.assignedDeveloperId)
  )
  return <ModalShell title="Update task status" subtitle={`${work.id} · ${work.work}`} onClose={onClose}>
    <form onSubmit={onSubmit}>
      <div className="space-y-5 p-5">
        <Field label="Task status"><select value={value.status} onChange={(e) => onChange((current) => ({ ...current, status: e.target.value, isNeedChangeDate: ["Pending", "In Progress"].includes(e.target.value) ? current.isNeedChangeDate : false }))} className={selectClass}>{["Pending", "In Progress", "Hold", "Completed"].map((status) => <option key={status}>{status}</option>)}</select></Field>
        {canManageDates && <div className="space-y-4"><Field label="Allocation date"><input readOnly type="date" value={value.allocationDate} className={inputClass} /></Field><label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700"><input type="checkbox" checked={Boolean(value.isNeedChangeDate)} onChange={(e) => set("isNeedChangeDate", e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" /><span>Need to change the expected completion date?</span></label>{value.isNeedChangeDate && <Field label="Expected completion date"><input required type="date" min={value.allocationDate} value={value.expectedCompletionDate} onChange={(e) => set("expectedCompletionDate", e.target.value)} className={inputClass} /></Field>}</div>}
        {canTransfer && <section className="rounded-xl border border-violet-100 bg-violet-50/70 p-3.5"><label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-800"><input type="checkbox" checked={Boolean(value.isTransfer)} onChange={(event) => set("isTransfer", event.target.checked)} className="h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500" /><span>Transfer this task to another developer</span></label><p className="mt-1 pl-7 text-xs leading-5 text-slate-500">Leave this off to keep the current developer and save a normal status update.</p>{value.isTransfer && <div className="mt-4 space-y-4 border-t border-violet-100 pt-4"><Field label="Transfer to"><select required value={value.transferredTo} onChange={(event) => set("transferredTo", event.target.value)} className={selectClass} disabled={availableStaff.length === 0}><option value="">{availableStaff.length ? "Select R&D staff" : "No other R&D staff available"}</option>{availableStaff.map((staff) => <option key={staff._id} value={staff._id}>{staff.name}</option>)}</select></Field><Field label="Transfer reason"><textarea required rows="3" value={value.transferRemark} onChange={(event) => set("transferRemark", event.target.value)} placeholder="Explain why this task is being transferred..." className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></Field></div>}</section>}
        <Field label="Remark"><textarea rows="4" value={value.remark} onChange={(e) => set("remark", e.target.value)} placeholder="Add a remark about this status update..." className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></Field>
      </div>
      <footer className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Close</button><button type="submit" className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${value.isTransfer ? "bg-violet-600 hover:bg-violet-700" : "bg-blue-600 hover:bg-blue-700"}`}><Save size={15} /> {value.isTransfer ? "Transfer task" : "Save status"}</button></footer>
    </form>
  </ModalShell>
}

function EndTaskModal({ work, value, onChange, onClose, onSubmit }) {
  return <ModalShell title="End task" subtitle={`${work.id} · ${work.work}`} onClose={onClose}><form onSubmit={onSubmit}><div className="space-y-5 p-5"><Field label="Task description"><textarea required rows="5" value={value} onChange={(event) => onChange(event.target.value)} placeholder="Describe the work completed in this task session..." className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" /></Field></div><footer className="flex justify-end gap-3 border-t border-slate-100 px-5 py-4"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</button><button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"><Square size={14} /> End task</button></footer></form></ModalShell>
}

function WorkDescriptionModal({ work, onClose }) {
  const title = work?.taskTitle || work?.work || "Task description"
  const description = work?.allocationDescription || "No allocation description was provided for this task."
  return <ModalShell title={title} subtitle={`${work?.id || ""} · Task details`} onClose={onClose}><div className="p-5"><p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">{description}</p><div className="mt-6 flex justify-end"><button type="button" onClick={onClose} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-200">Close</button></div></div></ModalShell>
}

function TaskTimelineModal({ work, onClose }) {
  const events = [...(work?.taskTimeline || [])].sort(
    (left, right) => new Date(left.at) - new Date(right.at)
  )
  const formatTimelineTime = (value) => new Date(value).toLocaleString("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", hour12: true
  })
  const eventDetail = (event) => {
    if (event.event !== "Work Allocated") return event.detail
    if (event.isSelfAllocated) return "Self allocated"
    return `Allocated by ${event.allocatedBy || work.allocatedBy || "Unknown"} · Received by ${event.allocatedTo || work.allocatedTo || "Unknown"}`
  }

  return <ModalShell title="Coding & QC timeline" subtitle={`${work.id} · ${work.work}`} onClose={onClose}><div className="p-5">{work.timelineLoading && <p className="mb-4 text-xs font-medium text-slate-500">Loading complete task history...</p>}{events.length === 0 ? <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">No Coding & QC activity has been recorded yet.</p> : <ol className="space-y-0">{events.map((event, index) => <li key={`${event.at}-${index}`} className="relative grid grid-cols-[112px_20px_1fr] gap-3 pb-6 last:pb-0"><time className="pt-0.5 text-right text-xs font-semibold leading-5 text-slate-500">{formatTimelineTime(event.at)}</time><div className="relative flex justify-center"><span className="z-10 mt-1 h-3 w-3 rounded-full border-[3px] border-white bg-blue-600 shadow-sm" />{index < events.length - 1 && <span className="absolute top-4 h-full w-px bg-slate-200" />}</div><div><p className="text-sm font-semibold text-slate-800">{event.event}</p>{eventDetail(event) && <p className="mt-1 text-xs leading-5 text-slate-500">{eventDetail(event)}</p>}</div></li>)}</ol>}</div></ModalShell>
}

function Badge({ children, className }) {
  return <span className={`inline-flex whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-semibold ${className}`}>{children}</span>
}
