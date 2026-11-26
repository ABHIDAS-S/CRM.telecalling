import React, { useState, useEffect, useCallback, useRef, useMemo } from "react"
import debounce from "lodash.debounce"
import { useSelector } from "react-redux"
import io from "socket.io-client"
import { FaSearch, FaPhone } from "react-icons/fa"
import Tiles from "../../../components/common/Tiles"
import { useNavigate } from "react-router-dom"
import {toast} from "react-toastify"
import { PropagateLoader } from "react-spinners"
import AnnouncementBanner from "../../../components/primaryUser/AnnouncementBanner"
import AnnouncementModal from "../../../components/primaryUser/AnnouncementModal"
import BirthdayGreetingPopup from "../../../components/common/BirthdayGreetingPopup"
import UseFetch from "../../../hooks/useFetch"
import { getLocalStorageItem } from "../../../helper/localstorage"
import { StaticSidebar } from "../../../components/primaryUser/StaticSidebar"
import AdminHeader from "../../../header/AdminHeader"
import StaffHeader from "../../../header/StaffHeader"
import api from "../../../api/api"
import { PerformanceModal } from "../../../components/primaryUser/PerformanceModal"
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
  ChevronDown,
  ChevronRight,
  X,
  Bell,
  PhoneCall,
  PhoneMissed,
  PhoneIncoming,
  BadgeCheck
} from "lucide-react"
import { all } from "axios"
import { getCallDescription, isWebsiteComplaint } from "../../../utils/callDescription"
import "../../../components/secondaryUser/WebsiteComplaintRow.css"

const CallregistrationList = () => {
  const navigate = useNavigate()
const userRole=useSelector((user)=>user.auth.user.role)
  const [activeUserId, setActiveUserId] = useState(null)
  const [loggedUserBranches, setLoggeduserBranches] = useState([])
  const [today, setToday] = useState(null)
  const [userBranch, setUserBranch] = useState(null)
const [annoucementsubmitloader,setannouncementLoader]=useState(false)
  console.log(userBranch)
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUser] = useState(null)
  const [expandedRows, setExpandedRows] = useState({})
  const [userCallStatus, setUserCallstatus] = useState([])
  const [callList, setCallList] = useState([])
  const [filteredCalls, setFilteredCalls] = useState([])
  console.log(filteredCalls?.length)
  const [loading, setLoading] = useState(false)
  const [selectedCompanyBranch, setSelectedCompanyBranch] = useState(null)
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false)
  const branchMenuRef = useRef(null)
  const [selectedcompanybranchId, setselectedcompanybranchId] = useState(null)
  const [showNotification, setShowNotification] = useState(false)
  const [oldPendingCallsCount, setoldpendingCallCount] = useState(0)
  const [todaypendingCallsCount, settodayPendingCallsCount] = useState(0)
  console.log(todaypendingCallsCount)
  const [todayCallsCount, setTodayCallsCount] = useState(0)
  const [solvedCallsCount, setTodaysSolvedCount] = useState(0)
  const [branchids, setbranchids] = useState(null)
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
  const [activeFilter, setActiveFilter] = useState("All")
  const [openannoucementpopup, setopenannoucementpopup] = useState(false)
console.log(openannoucementpopup)
  const { data: branches } = UseFetch("/branch/getbranch")
  const callListEndpoint = selectedCompanyBranch
    ? `/customer/getcallregistrationlist?branchName=${encodeURIComponent(selectedCompanyBranch)}`
    : null
  const { data: callscount, loading: loadingcounts } = UseFetch(
    callListEndpoint
  )
console.log(users)
console.log("users")
  const { data: branchProduct } = UseFetch(
    selectedcompanybranchId &&
      `/product/getallbranchProduct?branch=${selectedcompanybranchId}`
  )
  const { data: announcementlist,refreshHook:announcementrefresh } = UseFetch(
    "/dashboard/getcurrentAnnouncement"
  )
console.log("ddddddddddddddddddd",announcementlist)

  const socketRef = useRef(null)

  useEffect(() => {
    if (!isBranchMenuOpen) return undefined

    const closeBranchMenu = (event) => {
      if (!branchMenuRef.current?.contains(event.target)) {
        setIsBranchMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", closeBranchMenu)
    return () => document.removeEventListener("mousedown", closeBranchMenu)
  }, [isBranchMenuOpen])

  useEffect(() => {
    if (selectedCategory) {
      const Datas = targetData?.userWiseResults || []

      const filteredList = (branchProduct || [])
        .filter(
          (item) =>
            item.selected?.some(
              (selectedItem) =>
                String(selectedItem.category_id) ===
                String(selectedCategory?.Id)
            ) || String(item.category_id) === String(selectedCategory?.Id)
        )
        .map((item) => item.productName || item.serviceName)

      setproductList(filteredList)

      const filteredselectedCategory = Datas.flatMap(
        (user) => user.categories || []
      ).filter((item) => item.categoryId === selectedCategory?.Id)

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

      if (filteredselectedCategory.length) {
        setacheivedProducts([
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
  }, [targetData, selectedCategory, branchProduct])

  useEffect(() => {
    if (branches && branches.length > 0) {
      const userData = getLocalStorageItem("user")
      if (userData?.role === "Admin") {
        const isselctedArray = userData?.selected
        if (isselctedArray) {
          const loggeduserBranches = userData.selected.map((item) => ({
            value: item.branch_id,
            label: item.branchName
          }))
          setLoggeduserBranches(loggeduserBranches)
          setSelectedCompanyBranch(loggeduserBranches[0].label)
        } else {
          const loggeduserBranches = branches.map((item) => ({
            value: item._id,
            label: item.branchName
          }))
          setLoggeduserBranches(loggeduserBranches)
          setSelectedCompanyBranch(loggeduserBranches[0].label)
        }
      } else {
        const loggeduserBranches = (userData?.selected || []).map((item) => ({
          value: item.branch_id,
          label: item.branchName
        }))
        setLoggeduserBranches(loggeduserBranches)
        if (loggeduserBranches.length) {
          setSelectedCompanyBranch(loggeduserBranches[0].label)
        }
      }

      setbranchids(userData?.selected?.map((item) => item.branch_id))
      const branch = userData?.selected?.map((item) => item.branchName)
      setUserBranch(branch)
      setselectedcompanybranchId(userData?.selected?.[0]?.branch_id)
      setUser(userData)
    }
  }, [branches])

  const handleMoreClick = (id, name) => {
    const Datas = targetData?.userWiseResults || []

    const filteredList = (branchProduct || [])
      .filter(
        (item) =>
          item.selected?.some(
            (selectedItem) => String(selectedItem.category_id) === String(id)
          ) || String(item.category_id) === String(id)
      )
      .map((item) => item.productName || item.serviceName)

    setproductList(filteredList)
    setselectedCategory({ Id: id, categoryName: name })

    const filteredselectedCategory = Datas.flatMap(
      (user) => user.categories || []
    ).filter((item) => item.categoryId === id)

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

    if (filteredselectedCategory.length) {
      setacheivedProducts([
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

    const filteredloggedUserItem = targetData?.userWiseResults?.filter(
      (item) => item.userId === userId
    )

    const filteredselectedCategory =
      filteredloggedUserItem?.[0]?.categories?.filter(
        (item) => item.categoryId === category.Id
      ) || []

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

    if (filteredselectedCategory.length) {
      setacheivedProducts(
        filteredselectedCategory[0]?.products?.map((product) => ({
          productname: product.name,
          amount: product.achieved
        })) || []
      )
    } else {
      setacheivedProducts([])
    }
  }

  const filterCallData = useCallback(() => {
    const allCallRegistrations = (callList || []).flatMap(
      (call) => call.callregistration || []
    )
    console.log(allCallRegistrations.length)
    const pending = allCallRegistrations.filter(
      (call) => call.formdata?.status?.toLowerCase() === "pending"
    )
    const todaysSolvedCount = getTodaysSolved(callList || [])
    const todaysPendingCount = getTodaysPending(pending)
    console.log(todaysPendingCount)
    const todaysCallsCount = getTodaysCalls(callList || [])
    console.log(todaysCallsCount)
    settodayPendingCallsCount(todaysPendingCount.todaysPendingCount)
    const oldpendingCallCount = getOldPending(pending)
    console.log(pending)
    console.log(oldpendingCallCount)
    setoldpendingCallCount(oldpendingCallCount.oldPendingCount)

    // setPendingCallsCount(pending.length)
    setTodayCallsCount(todaysCallsCount)
    setTodaysSolvedCount(todaysSolvedCount.todaysSolvedCount)
  }, [callList])

  useEffect(() => {
    if (selectedCompanyBranch && callscount) {
      console.log(callscount)
      const a = callscount.filter((t) => t.customerName === "abhidas")
      console.log(a)
      const brancharray = [selectedCompanyBranch]
      const filtered = callscount.filter(
        (call) =>
          Array.isArray(call?.callregistration) &&
          call.callregistration.some((registration) => {
            const hasMatchingBranch =
              Array.isArray(registration?.branchName) &&
              registration.branchName.some((branch) =>
                brancharray.includes(branch)
              )

            return hasMatchingBranch
          })
      )
      setCallList(filtered)
    }
  }, [callscount, selectedCompanyBranch])

  useEffect(() => {
    if (callList && callList.length > 0 && users) {
      const today = new Date().toISOString().split("T")[0]
      setToday(today)
      const stats = getCallStats(callList, users.name)
      setUserCallstatus(stats)
      filterCallData()
      setLoading(false)
    }
  }, [callList, users, filterCallData])

  const getTodaysSolved = (calls) => {
    let todaysSolvedCount = 0
    let arr = []
    console.log(calls)
    calls.forEach((customer) => {
      customer.callregistration?.forEach((call) => {
        // The list endpoint supplies solved calls only when they were solved
        // today, so do not exclude a valid result based on a different date
        // field such as the original call end time.
        if (call.formdata?.status?.toLowerCase() === "solved") {
          todaysSolvedCount++
          arr.push(call.timedata?.token)
        }
      })
    })

    return { todaysSolvedCount, arr }
  }
  const getTodaysPending = (calls) => {
    const today = new Date().toISOString().split("T")[0]
    let todaysPendingCount = 0
    let arr = []
    console.log(calls)

    calls?.forEach((call) => {
      if (call.formdata?.status === "pending") {
        const callDate = call.timedata?.endTime?.split("T")[0]
        console.log(calls)
        if (callDate === today) {
          todaysPendingCount++
          arr.push(call.timedata?.token)
        }
      }
    })

    return { todaysPendingCount, arr }
  }
  const getOldPending = (calls) => {
    const today = new Date().toISOString().split("T")[0]
    console.log(today)
    let oldPendingCount = 0
    let arr = []
    console.log(calls)

    calls.forEach((call) => {
      if (call.formdata?.status === "pending") {
        const callDate = call.timedata?.endTime?.split("T")[0]
        console.log(callDate)
        if (callDate < today) {
          oldPendingCount++
          arr.push(call.timedata?.token)
        }
      }
    })

    return { oldPendingCount, arr }
  }

  const getCallStats = (calls, userName) => {
    let totalCalls = 0
    let pendingCalls = 0
    let solvedCalls = 0
    let collegeSolvedCalls = 0
    let totalDuration = 0
    const today = new Date().toISOString().split("T")[0]

    calls.forEach((call) => {
      call.callregistration?.forEach((registration) => {
        const { formdata, timedata } = registration
        const callDate = timedata?.endTime?.split("T")[0]

        if (callDate === today) {
          const lastAttended = formdata?.attendedBy?.length
            ? formdata?.attendedBy[formdata.attendedBy.length - 1]
            : null

          if (lastAttended?.callerId?.name === userName) {
            totalCalls++

            if (formdata.status === "pending") {
              pendingCalls++
            }

            if (formdata.status === "solved") {
              if (
                formdata?.completedBy?.length &&
                formdata?.completedBy[formdata?.completedBy?.length - 1]
                  .name === userName
              ) {
                solvedCalls++
              }

              if (
                formdata?.completedBy?.length &&
                lastAttended?.callerId?.name !==
                  formdata?.completedBy[formdata?.completedBy?.length - 1].name
              ) {
                collegeSolvedCalls++
              }
            }

            if (
              lastAttended &&
              lastAttended.duration &&
              lastAttended?.callerId?.name === userName
            ) {
              totalDuration += lastAttended.duration
            }
          }
        }
      })
    })

    return {
      totalCalls,
      pendingCalls,
      solvedCalls,
      collegeSolvedCalls,
      totalDuration
    }
  }
  console.log(callList)
  const getTodaysCalls = (calls) => {
    console.log(calls)
    const a = calls.filter((i) => i.customerName === "abhidas")
    console.log(a)
    const today = new Date().toISOString().split("T")[0]
    let todaysCallsCount = 0

    calls.forEach((customer) => {
      customer.callregistration?.forEach((call) => {
        const callDate = call?.timedata?.endTime?.split("T")[0]
        if (callDate === today) {
          todaysCallsCount++
        }
      })
    })

    return todaysCallsCount
  }

  const setDateandTime = (dateString) => {
    const dateObj = new Date(dateString)
    const date = dateObj.toLocaleDateString("en-GB")
    const time = dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    })
    return `${date}`
  }

  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) {
      return "0 hr 0 min 0 sec"
    }
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs} hr ${mins} min ${secs} sec`
  }
  const getBaseRow = useMemo(() => {
    const todayDate = new Date().toISOString().split("T")[0]

    const filteredCallList = callList.flatMap((calls) =>
      (calls.callregistration || [])
        .filter((item) => item.branchName?.includes(null)) // get only null branch calls
        .map((item) => ({
          ...item,
          calls
        }))
    )

    console.log("Null branch calls", filteredCallList)

    return filteredCallList
  }, [callList])
  const getBaseRows = useMemo(() => {
    const todayDate = new Date().toISOString().split("T")[0]
    const branchArray = selectedCompanyBranch
      ? [selectedCompanyBranch]
      : userBranch || []
    console.log(callList.length)
    console.log(callList)
    return (callList || [])
      .flatMap((calls) =>
        (calls.callregistration || []).map((item) => ({
          ...item,
          calls
        }))
      )
      .filter((item) => {
        if (!branchArray.length) return true
        return branchArray.some((branch) => item.branchName?.includes(branch))
      })
      .filter((item) => {
        if (!searchTerm || !searchTerm.trim()) return true
        const q = searchTerm.toLowerCase().trim()
        return (
          item?.calls?.customerName?.toLowerCase().includes(q) ||
          item?.calls?.mobile?.toString().includes(q) ||
          item?.license?.toString().includes(q) ||
          item?.formdata?.incomingNumber?.toString().includes(q) ||
          item?.branchName?.some((branch) => branch?.toLowerCase().includes(q))
        )
      })
      .filter((item) => {
        if (activeFilter === "All") return true
        const status = item?.formdata?.status?.toLowerCase()
        const callDate =
          item?.timedata?.endTime?.split("T")[0] ||
          item?.timedata?.startTime?.split("T")[0]
        if (activeFilter === "Pending") return status === "pending"
        if (activeFilter === "Solved") return status === "solved"
        if (activeFilter === "Today") {
          return status === "pending" && callDate === todayDate
        }
        if (activeFilter === "online") return status === "online"
        return true
      })
  }, [
    callList,
    selectedCompanyBranch,
    userBranch,
    searchTerm,
    activeFilter
  ])

  const onlineCallsCount = useMemo(() => {
    const branchArray = selectedCompanyBranch
      ? [selectedCompanyBranch]
      : userBranch || []

    return (callList || [])
      .flatMap((call) => call.callregistration || [])
      .filter((call) =>
        !branchArray.length ||
        branchArray.some((branch) => call.branchName?.includes(branch))
      )
      .filter(
        (call) => call?.formdata?.status?.toLowerCase() === "online"
      ).length
  }, [callList, selectedCompanyBranch, userBranch])

  useEffect(() => {
    console.log("h")
    console.log(getBaseRows.length)
    setFilteredCalls(getBaseRows)
    console.log(getBaseRow)
  }, [getBaseRows])

  const handleSearch = debounce((search) => {
    setSearchTerm(search || "")
  }, 300)

  const handleChange = (e) => handleSearch(e.target.value)

  const applyFilter = (filterName) => {
    setActiveFilter(filterName)
  }
const handleAnnouncementSubmit = async (annoucementtext) => {
console.log(annoucementtext)
console.log(announcement)
    setannouncementLoader(true)
    try {
      const response = await api.post("/dashboard/updateAnnouncement", {
        annoucementtext
      })
console.log(response.data)
      // setAnnouncementText(response.data.data.announcement)
      toast.success(response.data.message)
announcementrefresh()
    } catch (error) {
      console.log("error:", error.message)
    } finally {
      setannouncementLoader(false)
    }
  }
  const renderRows = (statusType) => {
    const today = new Date().toISOString().split("T")[0]

    return filteredCalls
      .filter((item) => {
        const status = item?.formdata?.status?.toLowerCase()
        return statusType === "solved" ? status === "solved" : status !== "solved"
      })
      .sort((a, b) => {
        const aDate = a?.timedata?.endTime?.split("T")[0] || ""
        const bDate = b?.timedata?.endTime?.split("T")[0] || ""
        if (statusType === "pending") {
          if (aDate === today && bDate !== today) return -1
          if (aDate !== today && bDate === today) return 1
        }
        const endTimeA = new Date(a?.timedata?.endTime).getTime()
        const endTimeB = new Date(b?.timedata?.endTime).getTime()
        const startTimeA = new Date(a?.timedata?.startTime).getTime()
        const startTimeB = new Date(b?.timedata?.startTime).getTime()
        return endTimeB - endTimeA || startTimeB - startTimeA
      })
  }
const DEFAULT_ANNOUNCEMENT = {
  announcementTitle: "Announcements",
  announcement: "There are no announcements at the moment.",
  announcementType: "general",
  badge: "",
  postedBy: "CAMET CRM",
};

const announcement =
  announcementlist?.[0]?.announcement
    ? announcementlist[0]
    : DEFAULT_ANNOUNCEMENT;
  return (
    <div className="h-full overflow-hidden bg-[#ADD8E6]">
      <div className="flex h-full w-full overflow-hidden">
        {/* <StaticSidebar
          handleMoreClick={handleMoreClick}
          selectedCompanyBranch={selectedcompanybranchId}
          setselectedCompanyBranch={setselectedcompanybranchId}
          parenttargetData={settargetData}
          parentperiodmode={periodMode}
          parentyear={selectedYear}
          setselectedPeriod={setselectedPeriod}
        /> */}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 items-center justify-between ">
            {/* {users?.role?.toLowerCase() === "admin" ? (
              <AdminHeader hide={true} />
            ) : (
              <StaffHeader hide={true} />
            )} */}

            {/* <div className="flex h-full items-center gap-1.5 pr-3">
              <button className="rounded-full bg-slate-100 p-1.5 transition">
                <Mail size={15} strokeWidth={2.2} />
              </button>

              <div className="relative">
                <button
                  //  onClick={() => setShowNotification(true)}
                  className="rounded-full bg-slate-100 p-1.5 transition"
                >
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
                  }}
                  className="rounded-full bg-slate-100 p-1.5 transition"
                >
                  <User size={15} strokeWidth={2.2} />
                </button>
              </div>
            </div> */}
          </header>
 {openannoucementpopup && (
        <AnnouncementModal
          open={openannoucementpopup}
isAdmin={userRole==="Admin"}
announcements={announcement}
          onClose={() => setopenannoucementpopup(false)}
 onSubmit={handleAnnouncementSubmit}
          onSuccess={(saved) =>
            setopenannoucementpopup(false)
          }
        />
      )}
          <BirthdayGreetingPopup />
          {showNotification && (
            <NotificationPopup onClose={() => setShowNotification(false)} />
          )}
          <div className="px-2 md:px-3">
            
                <AnnouncementBanner
                  announcementlist={announcement}
                  setopenannoucementpopup={setopenannoucementpopup}
                  action={users?.role === "Admin"}
show={true}
                />
              
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-1.5 md:p-2">
            <div className="flex min-h-0 flex-1 flex-col rounded-xl bg-neutral-50 p-2 shadow-lg md:p-2.5">
              <div className="mb-1 flex shrink-0 flex-col gap-1.5 px-0.5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex w-full flex-col gap-1.5 lg:max-w-2xl">
                  <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        onChange={handleChange}
                        className="h-8 w-full rounded-full border border-gray-300 py-1 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Search for..."
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          `/${users?.role?.toLowerCase()}/transaction/call-registration`
                        )
                      }
                      className="h-8 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-md transition-all hover:bg-blue-700"
                    >
                      Call
                    </button>

                    <div ref={branchMenuRef} className="relative min-w-[170px]">
                      <button
                        type="button"
                        onClick={() => setIsBranchMenuOpen((open) => !open)}
                        className="flex h-8 w-full items-center justify-between gap-2 rounded-md border border-blue-200 bg-gradient-to-r from-blue-50 to-white px-2.5 text-left text-xs font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        aria-haspopup="listbox"
                        aria-expanded={isBranchMenuOpen}
                      >
                        <span className="min-w-0 truncate"><span className="mr-1 text-[9px] font-bold uppercase tracking-wide text-blue-500">Branch</span>{selectedCompanyBranch || "Select branch"}</span>
                        <ChevronDown size={14} className={`shrink-0 text-blue-600 transition-transform ${isBranchMenuOpen ? "rotate-180" : ""}`} />
                      </button>
                      {isBranchMenuOpen && <div role="listbox" className="absolute left-0 top-10 z-50 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                        <p className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-slate-400">Available branches</p>
                        <div className="max-h-56 overflow-y-auto">
                          {loggedUserBranches?.map((branch) => {
                            const isSelected = branch.label === selectedCompanyBranch
                            return <button
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              key={branch.value || branch.label}
                              onClick={() => { setLoading(true); setFilteredCalls([]); setSelectedCompanyBranch(branch.label); setIsBranchMenuOpen(false) }}
                              className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition ${isSelected ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-blue-400"}`} />
                              <span className="truncate">{branch.label}</span>
                            </button>
                          })}
                        </div>
                      </div>}
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-auto">
                  <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                    <table className="min-w-max text-center text-xs md:text-sm">
                      <tbody>
                        <tr className="border-b bg-gray-50">
                          <td className="px-2 py-1 font-bold text-[#010bff]">
                            Total Calls
                          </td>
                          <td className="px-2 py-1 font-bold text-purple-700">
                            Colleague Solved
                          </td>
                          <td className="px-2 py-1 font-bold text-red-600">
                            Pending Calls
                          </td>
                          <td className="px-2 py-1 font-bold text-green-600">
                            Solved Calls
                          </td>
                          <td className="px-2 py-1 font-bold text-gray-600">
                            Total Duration
                          </td>
                        </tr>
                        <tr>
                          <td className="px-2 py-1 text-[#010bff]">
                            {userCallStatus?.totalCalls}
                          </td>
                          <td className="px-2 py-1 text-purple-700">
                            {userCallStatus?.collegeSolvedCalls}
                          </td>
                          <td className="px-2 py-1 text-red-600">
                            {userCallStatus?.pendingCalls}
                          </td>
                          <td className="px-2 py-1 text-green-600">
                            {userCallStatus?.solvedCalls}
                          </td>
                          <td className="px-2 py-1 text-gray-600">
                            {formatDuration(userCallStatus?.totalDuration)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <hr className="mb-1 shrink-0 border-t border-gray-300" />

              <div className="mb-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyFilter("All")}
                  className={`rounded-md border px-3 py-1 text-xs font-semibold transition ${
                    activeFilter === "All"
                      ? "border-slate-800 bg-slate-800 text-white"
                      : "border-slate-300 bg-white text-slate-700"
                  }`}
                >
                  All
                </button>
              </div>

              <div className="mb-1 grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
                <Tiles
                  title="Pending Calls"
                  compact
                  count={oldPendingCallsCount}
                  subtitle="Awaiting follow-up"
                  icon={<PhoneMissed size={12} strokeWidth={2.2} />}
                  style={{
                    background:
                      "linear-gradient(135deg, #be123c 0%, #f43f5e 52%, #fda4af 100%)"
                  }}
                  onClick={() => applyFilter("Pending")}
                  active={activeFilter === "Pending"}
                />

                <Tiles
                  title="Today Pending Calls"
                  compact
                  count={todaypendingCallsCount}
                  subtitle="Scheduled today"
                  icon={<PhoneIncoming size={12} strokeWidth={2.2} />}
                  style={{
                    background:
                      "linear-gradient(135deg, #c2410c 0%, #f59e0b 52%, #fde68a 100%)"
                  }}
                  onClick={() => applyFilter("Today")}
                  active={activeFilter === "Today"}
                />

                <Tiles
                  title="Solved Calls"
                  compact
                  count={solvedCallsCount}
                  subtitle="Resolved"
                  icon={<BadgeCheck size={12} strokeWidth={2.2} />}
                  style={{
                    background:
                      "linear-gradient(135deg, #047857 0%, #34d399 52%, #99f6e4 100%)"
                  }}
                  onClick={() => applyFilter("Solved")}
                  active={activeFilter === "Solved"}
                />

                <Tiles
                  title="Online Calls"
                  compact
                  count={onlineCallsCount}
                  subtitle="Online"
                  icon={<PhoneCall size={12} strokeWidth={2.2} />}
                  style={{
                    background:
                      "linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #93c5fd 100%)"
                  }}
                  onClick={() => applyFilter("online")}
                  active={activeFilter === "online"}
                />
              </div>

              <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-300 bg-slate-50 shadow-[0_8px_24px_rgba(15,23,42,0.10)]">
                <div className="h-full overflow-y-auto">
                  <table className="w-full table-fixed border-separate border-spacing-0 text-[11px] text-slate-700 md:text-xs">
                    <thead className="sticky top-0 z-40 bg-slate-200">
                      <tr className="bg-gradient-to-r from-slate-300 via-slate-200 to-slate-100 shadow-[inset_0_-1px_0_rgba(100,116,139,0.35)]">
                        <th className="w-[5%] border-b border-slate-300 px-2 py-2 text-center font-bold text-slate-700"></th>
                        <th className="w-[20%] border-b border-slate-300 px-2 py-2 text-left font-bold text-slate-700">
                          Customer Name
                        </th>
                        <th className="w-[21%] border-b border-slate-300 px-2 py-2 text-left font-bold text-slate-700">
                          Product Name
                        </th>
                        <th className="w-[11%] border-b border-slate-300 px-2 py-2 text-left font-bold text-slate-700">
                          License No
                        </th>
                        <th className="w-[13%] border-b border-slate-300 px-2 py-2 text-left font-bold text-slate-700">
                          Description
                        </th>
                        <th className="w-[11%] border-b border-slate-300 px-2 py-2 text-left font-bold text-slate-700">
                          Incoming No
                        </th>
                        <th className="w-[9%] border-b border-slate-300 px-2 py-2 text-center font-bold text-slate-700">
                          Call
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredCalls?.length > 0 ? (
                        <>
                          {renderRows("pending").map((item, index) => {
                            const today = new Date().toISOString().split("T")[0]
                            const callDate = item?.timedata?.endTime
                              ? new Date(item.timedata.endTime)
                                  .toISOString()
                                  .split("T")[0]
                              : item?.timedata?.startTime
                                ? new Date(item.timedata.startTime)
                                    .toISOString()
                                    .split("T")[0]
                                : null

                            if (
                              userBranch?.some((branch) =>
                                item.branchName?.includes(branch)
                              )
                            ) {
                              const isTodayPending = callDate === today
                              const rowKey = `${item.calls?._id}-${item?.timedata?.token}-${index}`
                              const isExpanded = expandedRows?.[rowKey]

                              return (
                                <React.Fragment key={rowKey}>
                                  <tr
                                    className={`transition-all duration-150 ${isWebsiteComplaint(item) ? "website-complaint-row" : ""} ${
                                      isTodayPending
                                        ? "bg-gradient-to-r from-amber-300 via-orange-200 to-yellow-100 hover:from-amber-400 hover:via-orange-300 hover:to-yellow-200"
                                        : "bg-gradient-to-r from-rose-300 via-red-200 to-pink-100 hover:from-rose-400 hover:via-red-300 hover:to-pink-200"
                                    }`}
                                  >
                                    <td className="border-b border-slate-300 px-1 py-1 text-center align-middle">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedRows((prev) => ({
                                            ...prev,
                                            [rowKey]: !prev?.[rowKey]
                                          }))
                                        }
                                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 bg-white/90 text-[9px] font-bold text-slate-700 shadow-sm transition hover:bg-white"
                                      >
                                        <span
                                          className={`transition-transform duration-200 ${
                                            isExpanded ? "rotate-180" : ""
                                          }`}
                                        >
                                          ▼
                                        </span>
                                      </button>
                                    </td>

                                    <td className="break-words border-b border-slate-300 px-2 py-1 align-top text-slate-900">
                                      {item.calls?.customerName?.toUpperCase() ||
                                        "N/A"}
                                    </td>

                                    <td className="break-words border-b border-slate-300 px-2 py-1 align-top text-slate-900">
                                      {item?.calls?.productDetails?.[0]
                                        ?.productName || "N/A"}
                                    </td>

                                    <td className="truncate border-b border-slate-300 px-2 py-1 align-top text-slate-800">
                                      {item?.license || "N/A"}
                                    </td>

                                    <td className="border-b border-slate-300 px-2 py-1 align-top text-slate-800">
                                      <div className="group relative max-w-full">
                                        <div className="truncate rounded-md px-1 py-0.5 text-slate-800 cursor-pointer">
                                          {getCallDescription(item?.formdata?.description) || "N/A"}
                                        </div>

                                        {item?.formdata?.description && (
                                          <div className="pointer-events-none absolute left-0 top-full z-50 mt-2 w-72 translate-y-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] leading-relaxed text-slate-700 opacity-0 shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                                            <div className="whitespace-normal break-words text-slate-800">
                                              {getCallDescription(item.formdata.description)}
                                            </div>
                                            <div className="absolute -top-1.5 left-4 h-3 w-3 rotate-45 border-l border-t border-slate-200 bg-white" />
                                          </div>
                                        )}
                                      </div>
                                    </td>

                                    <td className="truncate border-b border-slate-300 px-2 py-1 align-top text-slate-800">
                                      {item?.formdata?.incomingNumber || "N/A"}
                                    </td>

                                    <td className="border-b border-slate-300 px-2 py-1 text-center align-middle">
                                      {item?.formdata?.status !== "solved" ? (
                                        <button
                                          type="button"
                                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-b from-blue-600 to-indigo-700 text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)] transition hover:scale-105 hover:from-blue-700 hover:to-indigo-800 active:scale-95"
                                          onClick={() =>
                                            users.role === "Admin"
                                              ? navigate(
                                                  "/admin/transaction/call-registration",
                                                  {
                                                    state: {
                                                      calldetails:
                                                        item.calls._id,
                                                      token: item.timedata.token
                                                    }
                                                  }
                                                )
                                              : navigate(
                                                  "/staff/transaction/call-registration",
                                                  {
                                                    state: {
                                                      calldetails:
                                                        item?.calls._id,
                                                      token:
                                                        item?.timedata?.token
                                                    }
                                                  }
                                                )
                                          }
                                        >
                                          <FaPhone className="text-[11px]" />
                                        </button>
                                      ) : null}
                                    </td>
                                  </tr>

                                  {isExpanded && (
                                    <tr className="bg-slate-100">
                                      <td className="border-b border-slate-300 px-1 py-0.5"></td>
                                      <td
                                        colSpan="2"
                                        className="border-b border-slate-300 px-2 py-1 align-top"
                                      >
                                        <div className="text-[9px] font-bold uppercase tracking-wide text-slate-600">
                                          Solution
                                        </div>
                                        <span
                                          className={`mt-0.5 inline-flex rounded-full px-2 py-[2px] text-[9px] font-bold uppercase tracking-wide leading-none shadow-sm ${
                                            isTodayPending
                                              ? "bg-orange-600 text-white"
                                              : "bg-rose-600 text-white"
                                          }`}
                                        >
                                          {item?.formdata?.solution || "N/A"}
                                        </span>
                                      </td>
                                      <td className="border-b border-slate-300 px-2 py-1 align-top">
                                        <div className="text-[9px] font-bold uppercase tracking-wide text-slate-600">
                                          Call Date
                                        </div>
                                        <div className="mt-0.5 text-[10px] leading-tight text-slate-900">
                                          {setDateandTime(
                                            item?.timedata?.startTime
                                          )}
                                        </div>
                                      </td>
                                      <td
                                        colSpan="2"
                                        className="border-b border-slate-300 px-2 py-1 align-top"
                                      >
                                        <div className="text-[9px] font-bold uppercase tracking-wide text-slate-600">
                                          Attended By
                                        </div>
                                        <div className="mt-0.5 text-[10px] leading-tight text-slate-900">
                                          {Array.isArray(
                                            item?.formdata?.attendedBy
                                          )
                                            ? item.formdata.attendedBy.length >
                                              0
                                              ? item.formdata.attendedBy[
                                                  item.formdata.attendedBy
                                                    .length - 1
                                                ]?.callerId?.name ||
                                                item.formdata.attendedBy[
                                                  item.formdata.attendedBy
                                                    .length - 1
                                                ]?.name ||
                                                item.formdata.attendedBy[
                                                  item.formdata.attendedBy
                                                    .length - 1
                                                ]
                                              : "N/A"
                                            : item?.formdata?.attendedBy
                                                ?.callerId?.name || "N/A"}
                                        </div>
                                      </td>
                                      <td className="border-b border-slate-300 px-2 py-1 align-top">
                                        <div className="text-[9px] font-bold uppercase tracking-wide text-slate-600">
                                          Completed By
                                        </div>
                                        <div className="mt-0.5 text-[10px] leading-tight text-slate-900">
                                          N/A
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              )
                            }

                            return null
                          })}

                          {renderRows("solved").map((item, index) => {
                            if (
                              userBranch?.some((branch) =>
                                item.branchName?.includes(branch)
                              )
                            ) {
                              const rowKey = `${item.calls?._id}-solved-${item?.timedata?.token}-${index}`
                              const isExpanded = expandedRows?.[rowKey]

                              return (
                                <React.Fragment key={rowKey}>
                                  <tr className={`bg-gradient-to-r from-emerald-300 via-green-200 to-teal-100 transition-all duration-150 hover:from-emerald-400 hover:via-green-300 hover:to-teal-200 ${isWebsiteComplaint(item) ? "website-complaint-row" : ""}`}>
                                    <td className="border-b border-slate-300 px-1 py-1 text-center align-middle">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedRows((prev) => ({
                                            ...prev,
                                            [rowKey]: !prev?.[rowKey]
                                          }))
                                        }
                                        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 bg-white/90 text-[9px] font-bold text-slate-700 shadow-sm transition hover:bg-white"
                                      >
                                        <span
                                          className={`transition-transform duration-200 ${
                                            isExpanded ? "rotate-180" : ""
                                          }`}
                                        >
                                          ▼
                                        </span>
                                      </button>
                                    </td>

                                    <td className="break-words border-b border-slate-300 px-2 py-1 align-top text-slate-900">
                                      {item.calls?.customerName?.toUpperCase() ||
                                        "N/A"}
                                    </td>

                                    <td className="break-words border-b border-slate-300 px-2 py-1 align-top text-slate-900">
                                      {item?.calls?.productDetails?.[0]
                                        ?.productName || "N/A"}
                                    </td>

                                    <td className="truncate border-b border-slate-300 px-2 py-1 align-top text-slate-800">
                                      {item?.license || "N/A"}
                                    </td>

                                    <td className="border-b border-slate-300 px-2 py-1 align-top text-slate-800">
                                      <div className="group relative max-w-full">
                                        <div className="truncate rounded-md px-1 py-0.5 text-slate-800 cursor-pointer">
                                          {getCallDescription(item?.formdata?.description) || "N/A"}
                                        </div>

                                        {item?.formdata?.description && (
                                          <div className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-72 -translate-y-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] leading-relaxed text-slate-700 opacity-0 shadow-[0_12px_30px_rgba(15,23,42,0.18)] transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
                                            <div className="whitespace-normal break-words text-slate-800">
                                              {getCallDescription(item.formdata.description)}
                                            </div>
                                            <div className="absolute -bottom-1.5 left-4 h-3 w-3 rotate-45 border-b border-r border-slate-200 bg-white" />
                                          </div>
                                        )}
                                      </div>
                                    </td>

                                    <td className="truncate border-b border-slate-300 px-2 py-1 align-top text-slate-800">
                                      {item?.formdata?.incomingNumber || "N/A"}
                                    </td>

                                    <td className="border-b border-slate-300 px-2 py-1 text-center align-middle"></td>
                                  </tr>

                                  {isExpanded && (
                                    <tr className="bg-emerald-100/80">
                                      <td className="border-b border-slate-300 px-1 py-0.5"></td>
                                      <td
                                        colSpan="2"
                                        className="border-b border-slate-300 px-2 py-1 align-top"
                                      >
                                        <div className="text-[9px] font-bold uppercase tracking-wide text-slate-700">
                                          Solution
                                        </div>
                                        <span className="mt-0.5 inline-flex rounded-full bg-emerald-700 px-2 py-[2px] text-[9px] font-bold uppercase tracking-wide leading-none text-white shadow-sm">
                                          {item?.formdata?.solution || "N/A"}
                                        </span>
                                      </td>
                                      <td className="border-b border-slate-300 px-2 py-1 align-top">
                                        <div className="text-[9px] font-bold uppercase tracking-wide text-slate-700">
                                          Call Date
                                        </div>
                                        <div className="mt-0.5 text-[10px] leading-tight text-slate-900">
                                          {setDateandTime(
                                            item?.timedata?.startTime
                                          )}
                                        </div>
                                      </td>
                                      <td
                                        colSpan="2"
                                        className="border-b border-slate-300 px-2 py-1 align-top"
                                      >
                                        <div className="text-[9px] font-bold uppercase tracking-wide text-slate-700">
                                          Attended By
                                        </div>
                                        <div className="mt-0.5 text-[10px] leading-tight text-slate-900">
                                          {Array.isArray(
                                            item?.formdata?.attendedBy
                                          )
                                            ? item.formdata.attendedBy.length >
                                              0
                                              ? item.formdata.attendedBy[
                                                  item.formdata.attendedBy
                                                    .length - 1
                                                ]?.callerId?.name ||
                                                item.formdata.attendedBy[
                                                  item.formdata.attendedBy
                                                    .length - 1
                                                ]?.name ||
                                                item.formdata.attendedBy[
                                                  item.formdata.attendedBy
                                                    .length - 1
                                                ]
                                              : "N/A"
                                            : item?.formdata?.attendedBy
                                                ?.callerId?.name || "N/A"}
                                        </div>
                                      </td>
                                      <td className="border-b border-slate-300 px-2 py-1 align-top">
                                        <div className="text-[9px] font-bold uppercase tracking-wide text-slate-700">
                                          Completed By
                                        </div>
                                        <div className="mt-0.5 text-[10px] leading-tight text-slate-900">
                                          {Array.isArray(
                                            item?.formdata?.completedBy
                                          )
                                            ? item.formdata.completedBy.length >
                                              0
                                              ? item.formdata.completedBy[
                                                  item.formdata.completedBy
                                                    .length - 1
                                                ]?.callerId?.name ||
                                                item.formdata.completedBy[
                                                  item.formdata.completedBy
                                                    .length - 1
                                                ]?.name
                                              : "N/A"
                                            : item?.formdata?.completedBy
                                                ?.callerId?.name ||
                                              item?.formdata?.completedBy
                                                ?.name ||
                                              "N/A"}
                                        </div>
                                      </td>
                                    </tr>
                                  )}
                                </React.Fragment>
                              )
                            }

                            return null
                          })}
                        </>
                      ) : (
                        <tr>
                          <td
                            colSpan="7"
                            className="px-3 py-8 text-center text-xs text-slate-500"
                          >
                            {loadingcounts ? (
                              <div className="justify center">
                                <PropagateLoader color="#3b82f6" size={10} />
                              </div>
                            ) : (
                              <div className="font-medium">No Calls</div>
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <PerformanceModal
          modalOpen={openModal}
          splitType={targetData?.selectedMeasurementType}
          selectedperiod={selectedPeriod}
          allperiods={targetData?.periods}
          onselectedPeriodChange={(val, val2) => {
            setSelectedYear(val2)
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
          loggedUser={users}
          selectedUser={selectedUserName}
          category={selectedCategory}
          handleSelectedUser={handleSelectedUser}
          activeUserId={activeUserId}
        />
      </div>
    </div>
  )
}

export default CallregistrationList
function NotificationPopup({ onClose }) {
  const [showTasks, setShowTasks] = useState(false)
  const [showFollowups, setShowFollowups] = useState(false)
  const notifications = [
    {
      type: "news",
      title: "New Notification",
      unread: true,

      data: {
        tasks: [
          {
            taskName: "System and study",
            remark: "Make it clear vision about the system",
            dueDate: "14 Jul 2026"
          },
          {
            taskName: "Coding",
            remark: "Customized coding needed",
            dueDate: "15 Jul 2026"
          }
        ],
        followups: [
          {
            customerName: "ABC Traders",
            lastRemark: "Requested demo next week"
          },
          {
            customerName: "XYZ Industries",
            lastRemark: "Waiting for quotation approval"
          }
        ]
      }
    },
    {
      type: "leave",
      title: "Today's Leave",
      unread: true,
      data: [{ name: "Rahul" }, { name: "Arun" }, { name: "Sneha" }]
    },
    {
      type: "birthday",
      title: "Today's Birthdays",
      unread: false,
      data: [
        { name: "Rahul", dob: "11 Jul" },
        { name: "Anu", dob: "11 Jul" }
      ]
    },
    {
      type: "holiday",
      title: "Monthly Holidays",
      unread: false,
      data: [
        { holiday: "Bakrid", date: "12 Jul" },
        { holiday: "Independence Day", date: "15 Aug" }
      ]
    },
    {
      type: "quarterly",
      title: "Quarterly Achievers",
      unread: false,
      data: [
        {
          name: "Rahul",
          photo: "https://i.pravatar.cc/100?img=1"
        },
        {
          name: "Arun",
          photo: "https://i.pravatar.cc/100?img=2"
        }
      ]
    },
    {
      type: "yearly",
      title: "Yearly Achievers",
      unread: false,
      data: [
        {
          name: "Sneha",
          photo: "https://i.pravatar.cc/100?img=3"
        }
      ]
    }
  ]

  return (
    <div className="fixed bottom-3 right-3 z-50 flex w-72 max-h-[calc(100vh-24px)] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 bg-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/15">
            <Bell size={16} className="text-blue-400" />
          </div>

          <span className="text-sm font-semibold text-white">
            Notifications
          </span>
        </div>

        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-700 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      {/* Notification List */}
      <div className="flex-1 overflow-y-auto bg-slate-900 p-3 space-y-3">
        {/* Read Notifications */}
        {/* {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-slate-700 bg-slate-800 p-3 transition-all duration-200 hover:bg-slate-700"
          >
            <p className="text-sm font-semibold text-white">
              Task Assigned
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-300">
              A new support ticket has been assigned to you.
            </p>

            <p className="mt-2 text-[11px] text-slate-500">
              {index + 1} hour ago
            </p>
          </div>
        ))} */}
        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-900 ">
          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-900 ">
            {notifications.map((item, index) => (
              <div
                key={index}
                className={`rounded-lg border p-2 transition-colors ${
                  item.unread
                    ? "border-blue-500/20 bg-slate-800"
                    : "border-slate-700 bg-slate-800"
                }`}
              >
                {/* Header */}
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold tracking-wide text-white">
                    {item.title}
                  </h3>

                  {item.unread && (
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                  )}
                </div>
                {item.type === "news" && (
                  <div className="space-y-2">
                    {/* Pending Tasks */}
                    <div className="rounded-md border border-orange-500/20 bg-slate-700/40">
                      <button
                        onClick={() => setShowTasks(!showTasks)}
                        className="flex w-full items-center justify-between px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span>📋</span>

                          <span className="text-[11px] font-semibold text-orange-300">
                            Pending Tasks
                          </span>

                          <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] text-orange-300">
                            {item.data.tasks.length}
                          </span>
                        </div>

                        {showTasks ? (
                          <ChevronUp size={15} className="text-slate-400" />
                        ) : (
                          <ChevronDown size={15} className="text-slate-400" />
                        )}
                      </button>

                      {showTasks && (
                        <div className="space-y-1 border-t border-slate-600 px-2 py-2">
                          {item.data.tasks.map((task, i) => (
                            <div
                              key={i}
                              className="rounded bg-slate-800 px-2 py-1.5"
                            >
                              <div className="flex items-center justify-between">
                                <p className="truncate text-[11px] font-medium text-white">
                                  {task.taskName}
                                </p>

                                <span className="text-[10px] font-medium text-red-400">
                                  {task.dueDate}
                                </span>
                              </div>

                              <p className="mt-0.5 truncate text-[10px] text-slate-400">
                                {task.remark}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Pending Follow-ups */}
                    <div className="rounded-md border border-blue-500/20 bg-slate-700/40">
                      <button
                        onClick={() => setShowFollowups(!showFollowups)}
                        className="flex w-full items-center justify-between px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <span>📞</span>

                          <span className="text-[11px] font-semibold text-blue-300">
                            Pending Follow-ups
                          </span>

                          <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-300">
                            {item.data.followups.length}
                          </span>
                        </div>

                        {showFollowups ? (
                          <ChevronUp size={15} className="text-slate-400" />
                        ) : (
                          <ChevronDown size={15} className="text-slate-400" />
                        )}
                      </button>

                      {showFollowups && (
                        <div className="space-y-1 border-t border-slate-600 px-2 py-2">
                          {item.data.followups.map((followup, i) => (
                            <div
                              key={i}
                              className="rounded bg-slate-800 px-2 py-1.5"
                            >
                              <p className="truncate text-[11px] font-medium text-white">
                                {followup.customerName}
                              </p>

                              <p className="mt-0.5 truncate text-[10px] text-slate-400">
                                {followup.lastRemark}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* {item.type === "news" && (
  <div className="space-y-2">

  
    <div className="rounded-md border border-orange-500/20 bg-slate-700/40 p-2">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[11px] font-semibold text-orange-300">
          📋 Pending Tasks
        </p>
        <span className="rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] text-orange-300">
          {item.data.tasks.length}
        </span>
      </div>

      <div className="space-y-1">
        {item.data.tasks.map((task, i) => (
          <div
            key={i}
            className="flex items-start justify-between rounded bg-slate-800 px-2 py-1"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-white">
                {task.taskName}
              </p>

              <p className="truncate text-[10px] text-slate-400">
                {task.remark}
              </p>
            </div>

            <span className="ml-2 whitespace-nowrap text-[10px] text-red-400">
              {task.dueDate}
            </span>
          </div>
        ))}
      </div>
    </div>

    
    <div className="rounded-md border border-blue-500/20 bg-slate-700/40 p-2">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[11px] font-semibold text-blue-300">
          📞 Pending Follow-ups
        </p>

        <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-300">
          {item.data.followups.length}
        </span>
      </div>

      <div className="space-y-1">
        {item.data.followups.map((followup, i) => (
          <div
            key={i}
            className="rounded bg-slate-800 px-2 py-1"
          >
            <p className="truncate text-[11px] font-medium text-white">
              {followup.customerName}
            </p>

            <p className="truncate text-[10px] text-slate-400">
              {followup.lastRemark}
            </p>
          </div>
        ))}
      </div>
    </div>

  </div>
)} */}

                {/* Leave */}
                {item.type === "leave" && (
                  <div className="space-y-1">
                    {item.data.map((staff, i) => (
                      <div
                        key={i}
                        className="rounded-md bg-slate-700 px-2 py-1 text-xs text-slate-200"
                      >
                        {staff.name}
                      </div>
                    ))}
                  </div>
                )}

                {/* Birthday */}
                {item.type === "birthday" && (
                  <div className="space-y-1">
                    {item.data.map((staff, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-md bg-slate-700 px-2 py-1"
                      >
                        <span className="text-xs text-white">
                          🎂 {staff.name}
                        </span>

                        <span className="text-[10px] text-slate-300">
                          {staff.dob}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Holidays */}
                {item.type === "holiday" && (
                  <div className="space-y-1">
                    {item.data.map((holiday, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-md bg-slate-700 px-2 py-1"
                      >
                        <span className="text-xs text-white">
                          📅 {holiday.holiday}
                        </span>

                        <span className="text-[10px] text-slate-300">
                          {holiday.date}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quarterly & Yearly */}
                {(item.type === "quarterly" || item.type === "yearly") && (
                  <div className="space-y-1">
                    {item.data.map((staff, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-md bg-slate-700 px-2 py-1"
                      >
                        <img
                          src={staff.photo}
                          alt={staff.name}
                          className="h-8 w-8 rounded-full border border-yellow-400 object-cover"
                        />

                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium text-white">
                            {staff.name}
                          </p>

                          <p className="text-[10px] text-yellow-400">
                            🏆 Achiever
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
