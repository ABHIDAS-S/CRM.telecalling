
import { Fragment, useEffect, useRef, useState } from "react"
import MyDatePicker from "../../../components/common/MyDatePicker"
import { PropagateLoader } from "react-spinners"
import { BarLoader } from "react-spinners"
import api from "../../../api/api"
import UseFetch from "../../../hooks/useFetch"
import { PerformanceModal } from "../../../components/primaryUser/PerformanceModal"
import { StaticSidebar } from "../../../components/primaryUser/StaticSidebar"
import SkeletonTable from "../../../components/loader/SkeletonTable"
import AdminHeader from "../../../header/AdminHeader"
import StaffHeader from "../../../header/StaffHeader"
import BranchDropdown from "../../../components/primaryUser/BranchDropdown"
import Tiles from "../../../components/common/Tiles"
import {
  Eye,
  BadgeCheck,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
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
  Search,
  CircleCheck
} from "lucide-react"

const getCallTone = (call) => {
  const status = String(call?.formdata?.status || "").toLowerCase()
  if (status === "online") return "bg-gradient-to-r from-blue-300 via-sky-100 to-blue-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.85),inset_0_-1px_0_rgba(30,64,175,0.20)] hover:from-blue-400 hover:via-sky-200 hover:to-blue-300"
  if (status === "solved") return "bg-gradient-to-r from-emerald-300 via-emerald-100 to-teal-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(6,95,70,0.20)] hover:from-emerald-400 hover:via-emerald-200 hover:to-teal-300"

  const startDate = call?.timedata?.startTime
    ? new Date(call.timedata.startTime).toISOString().slice(0, 10)
    : ""
  const today = new Date().toISOString().slice(0, 10)
  return startDate === today
    ? "bg-gradient-to-r from-amber-300 via-yellow-100 to-amber-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(146,64,14,0.20)] hover:from-amber-400 hover:via-yellow-200 hover:to-amber-300"
    : "bg-gradient-to-r from-rose-300 via-rose-100 to-red-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),inset_0_-1px_0_rgba(159,18,57,0.20)] hover:from-rose-400 hover:via-rose-200 hover:to-red-300"
}

const formatCallDateTime = (value) => {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return `${date.toLocaleDateString("en-GB")} ${date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  })}`
}

const formatCallDuration = (startTime, endTime) => {
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  if (!startTime || !endTime || Number.isNaN(start) || Number.isNaN(end) || end < start) return "—"

  const totalSeconds = Math.floor((end - start) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours} hr ${minutes} min ${seconds} sec`
}

const formatTotalDuration = (value) => {
  const totalSeconds = Math.max(0, Number(value) || 0)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours} hr ${minutes} min ${seconds} sec`
}

const toApiDate = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${date.getFullYear()}-${month}-${day}`
}

const Summary = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [totalcalls, setTotalCalls] = useState(0)
  const [selectedUser, setSelectedUser] = useState(null)
  const [cachedsummary, setCachedsummary] = useState([])
  const [cachedUserlistsummary, setcacheduserSummary] = useState([])
  const [Calls, setCalls] = useState([])
  const [searchTerm, setSearchTerm] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedCallRows, setExpandedCallRows] = useState({})
  const [customerSummary, setCustomerSummary] = useState([])
  const [customerCalls, setCustomerCalls] = useState([])
  const [userCalls, setUserCalls] = useState([])
  const [callList, setCallList] = useState([])
  const [result, setResult] = useState({})
  const [userList, setUserList] = useState([])
  const [branch, setBranch] = useState([])
  const [indiviDualCallList, setIndividualCallList] = useState([])
  const [loggedusers, setloggedUsers] = useState(null)
  const [selectedBranch, setSelectedBranch] = useState("All")
const [selectedCompanyBranch,setselectedCompanyBranch]=useState(null)
  const [selectedbranchName, setselectedBranchName] = useState(null)
  const [isToggled, setIsToggled] = useState(false)
  const [dates, setDates] = useState({ startDate: "", endDate: "" })
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [summaryPage, setSummaryPage] = useState(1)
  const [hasMoreSummaryPages, setHasMoreSummaryPages] = useState(true)
  const summaryLoadMoreRef = useRef(null)
  const [selectedUserName, setselecteduserName] = useState(null)
  const [selectedCategory, setselectedCategory] = useState(null)
  const [selectedDatapopup, setselectedDataPopup] = useState({})
 const [activeUserId, setActiveUserId] = useState(null)
const now=new Date()
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))
  const [periodMode, setperiodMode] = useState("all")
  const [targetData, settargetData] = useState([])
  console.log(targetData)
  const [performanceopenModal, setperformanceOpenModal] = useState(false)
  const [productlist, setproductList] = useState([])
  const [achievedproducts, setacheivedProducts] = useState([])
  const [selectedPeriod, setselectedPeriod] = useState("")
  const { data: branches, loading: branchLoader } =
    UseFetch("/branch/getBranch")
  const { data: staffCallList, loading: staffLoader } = UseFetch(
    isToggled &&
      dates.startDate &&
      dates.endDate &&
      `/auth/staffcallList?startDate=${dates.startDate}&endDate=${dates.endDate}`
  )
 const { data: branchProduct } = UseFetch(
    `/product/getallbranchProduct?branch=${selectedCompanyBranch}`
  )
  console.log(staffCallList)
  console.log("l")
  useEffect(() => {
    if (branches && branches.length > 0) {
      const userData = localStorage.getItem("user")
      const user = JSON.parse(userData)
      setloggedUsers(user)

setselectedCompanyBranch(user.selected[0].branch_id)
      user.selected.forEach((branches) =>
        setBranch((prev) => [
          ...prev,
          { id: branches.branch_id, branchName: branches.branchName }
        ])
      )
    }
  }, [branches])
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
    if (staffCallList) {
      setIndividualCallList(staffCallList)
    }
  }, [staffCallList])
  useEffect(() => {
    const startDate = new Date()

    setDates({ startDate, endDate: startDate })

    // Last date of the month
  }, [])
  useEffect(() => {
    if (dates.startDate && dates.endDate && selectedBranch) {
      const fetchUserList = async () => {
        try {
          const query = `startDate=${dates.startDate}&endDate=${dates.endDate}`
          const response = await api.get(`/auth/getStaffCallStatus?${query}`)

          const result = response.data.data
          if (result) {
            const processDataAndUpdateList = (data) => {
              setUserList((prevList) => {
                const updatedList = []

                if (!Array.isArray(data)) {
                  console.error("Data is not an array", data)
                  return prevList // keep existing list if something went wrong
                }

                // Step 2: Flatten the nested `data` array
                const flattenedData = data.flat() // Flattens one level deep
                // Pick dataset based on branch selection
                const dataset =
                  selectedBranch === "All"
                    ? flattenedData
                    : flattenedData.filter((call) =>
                        call.selected?.some(
                          (sel) => selectedBranch === sel.branch_id
                        )
                      )

                dataset.forEach((item) => {
                  const call = item // first call in the group

                  const existingEntry = updatedList.find(
                    (entry) => entry._id === call.callerId
                  )

                  if (existingEntry) {
                    existingEntry.solvedCalls += call.solvedCalls || 0
                    existingEntry.pendingCalls += call.pendingCalls || 0
                    existingEntry.colleagueSolved += call.colleagueSolved || 0
                    existingEntry.todaysCalls += call.todaysCalls || 0
                    existingEntry.datecalls += call.datecalls || 0
                  existingEntry.totalDurationSeconds += call.totalDurationSeconds || 0
                  } else {
                    updatedList.push({
                      _id: call.callerId,
                      name: call.callerName,
                      solvedCalls: call.solvedCalls || 0,
                      pendingCalls: call.pendingCalls || 0,
                      colleagueSolved: call.colleagueSolved || 0,
                      datecalls: call.datecalls || 0,
                      totalDurationSeconds: call.totalDurationSeconds || 0,
                      todaysCalls: call.todaysCalls || 0,
                      selected: call.selected || []
                    })
                  }
                })
                return updatedList
              })
              setcacheduserSummary((prevList) => {
                const updatedList = []

                if (!Array.isArray(data)) {
                  console.error("Data is not an array", data)
                  return prevList // keep existing list if something went wrong
                }
                const branchIds = branch.map((b) => b.branch_id)

                // Step 2: Flatten the nested `data` array
                const flattenedData = data.flat() // Flattens one level deep
                // Step 3: Filter calls that have any selected branch matching `branchIds`
                const filtered = flattenedData.filter((call) =>
                  call.selected?.some((sel) =>
                    branchIds.includes(sel.branch_id)
                  )
                )
                filtered.forEach((item) => {
                  const call = item // first call in the group

                  const existingEntry = updatedList.find(
                    (entry) => entry._id === call.callerId
                  )

                  if (existingEntry) {
                    existingEntry.solvedCalls += call.solvedCalls || 0
                    existingEntry.pendingCalls += call.pendingCalls || 0
                    existingEntry.colleagueSolved += call.colleagueSolved || 0
                    existingEntry.todaysCalls += call.todaysCalls || 0
                    existingEntry.datecalls += call.datecalls || 0
                  existingEntry.totalDurationSeconds += call.totalDurationSeconds || 0
                  } else {
                    updatedList.push({
                      _id: call.callerId,
                      name: call.callerName,
                      solvedCalls: call.solvedCalls || 0,
                      pendingCalls: call.pendingCalls || 0,
                      colleagueSolved: call.colleagueSolved || 0,
                      datecalls: call.datecalls || 0,
                      totalDurationSeconds: call.totalDurationSeconds || 0,
                      todaysCalls: call.todaysCalls || 0,
                      selected: call.selected || []
                    })
                  }
                })

                return updatedList
              })
            }
            processDataAndUpdateList(result)
            setLoading(false)
          }
        } catch (error) {
          console.error("Error fetching user list:", error)
        }
      }
      if (isToggled) {
        setTotalCalls(0)
        fetchUserList()
        setLoading(true)
      } else {
        if (callList && callList.length > 0 && selectedBranch) {
          const customerSummaries = callList
            .map((customer) => {
              const startDate = toApiDate(dates.startDate)
              const endDate = toApiDate(dates.endDate)

              const filteredCalls = (customer.callregistration || []).filter((call) => {
                const callDate = call?.timedata?.startTime
                  ? new Date(call.timedata.startTime).toISOString().split("T")[0]
                  : null
                const isInRange = callDate && callDate >= startDate && callDate <= endDate
                const isInSelectedBranch =
                  selectedBranch === "All" || call?.branchName?.includes(selectedbranchName)
                return isInRange && isInSelectedBranch
              })

              if (!filteredCalls.length) return null

              const totalCalls = filteredCalls.length
              const totalDurationSeconds = filteredCalls.reduce((total, call) => {
                const start = new Date(call?.timedata?.startTime).getTime()
                const end = new Date(call?.timedata?.endTime).getTime()
                return total + (!Number.isNaN(start) && !Number.isNaN(end) && end >= start
                  ? Math.floor((end - start) / 1000)
                  : 0)
              }, 0)

              const solvedCalls = filteredCalls.filter((call) => {
                const callDate = new Date(call.timedata.startTime)
                  .toISOString()
                  .split("T")[0]
                return (
                  call.formdata.status === "solved" && // Check if status is solved
                  callDate >= startDate &&
                  callDate <= endDate // Check if within date range
                )
              }).length

              const pendingCalls = totalCalls - solvedCalls
              const today = new Date().toISOString().split("T")[0]

              const todaysCalls = filteredCalls.filter((call) => {
                const callDate = new Date(call?.timedata?.startTime)
                  .toISOString()
                  .split("T")[0] // Convert call's startTime to a Date object
                const isInDateRange =
                  callDate >= startDate && callDate <= endDate // Check if within date range
                const isToday = callDate === today // Check if the call is for today
                return isInDateRange && isToday // Only include calls that match both criteria
              }).length
              // Extract unique last 3 mobile numbers (incomingNumber)
              const uniqueIncomingNumbers = []
              for (const call of filteredCalls) {
                const num = call?.formdata?.incomingNumber
                if (num && !uniqueIncomingNumbers.includes(num)) {
                  uniqueIncomingNumbers.push(num)
                }
                if (uniqueIncomingNumbers.length === 3) break
              }
              // Extract unique last 3 mobile numbers (incomingNumber)
              const uniqueSerialNumbers = []
              for (const call of filteredCalls) {
                const license = call?.license
                if (license && !uniqueSerialNumbers.includes(license)) {
                  uniqueSerialNumbers.push(license)
                }
              }
              return {
                customerId: customer._id,
                customerName: customer.customerName,
                totalCalls,
                totalDurationSeconds,
                solvedCalls,
                pendingCalls,
                todaysCalls,
                mobileNumbers: uniqueIncomingNumbers,
                serialNumbers: uniqueSerialNumbers
              }
            })
            .filter(Boolean)
          if (customerSummaries) {
            setCustomerSummary(customerSummaries)
            setCachedsummary(customerSummaries)
          }
        } else {
          setCustomerSummary([])
          setCachedsummary([])
        }
      }
    }
  }, [callList, selectedBranch, selectedbranchName, isToggled, dates])

  useEffect(() => {
    const list = isToggled ? userList : customerSummary
    const key = isToggled ? "datecalls" : "totalCalls"
    setTotalCalls(
      Array.isArray(list)
        ? list.reduce((total, item) => total + Number(item?.[key] || 0), 0)
        : 0
    )
  }, [customerSummary, isToggled, userList])
  useEffect(() => {
    if (searchTerm === null) return

    const searchValue = searchTerm.trim().toLowerCase()
    if (isToggled) {
      const source = cachedUserlistsummary || []
      setUserList(
        searchValue
          ? source.filter((call) => call.name?.toLowerCase().includes(searchValue))
          : source
      )
      return
    }

    const source = cachedsummary || []
    setCustomerSummary(
      searchValue
        ? source.filter((call) => call.customerName?.toLowerCase().includes(searchValue))
        : source
    )
  }, [searchTerm, cachedsummary, cachedUserlistsummary, isToggled])

  useEffect(() => {
    if (isModalOpen && selectedCustomer) {
      const selectedCustomerRecord =
        callList.find(
          (customer) =>
            String(customer._id) === String(selectedCustomer.id) &&
            customer.customerName === selectedCustomer.name
        ) ||
        callList.find((customer) => customer.customerName === selectedCustomer.name)

      const customerData = selectedCustomerRecord
        ? [selectedCustomerRecord]
        .map((customer) => {
          const today = new Date().toISOString().slice(0, 10) // Get today's date in YYYY-MM-DD format

          const startDate = toApiDate(dates.startDate)
          const endDate = toApiDate(dates.endDate)

          // Keep the popup consistent with the selected customer, branch, and date range.
          const allCalls = (customer.callregistration || []).filter((call) => {
            const callDate = call?.timedata?.startTime
              ? new Date(call.timedata.startTime).toISOString().split("T")[0]
              : null
            const isInRange = callDate && callDate >= startDate && callDate <= endDate
            const isInSelectedBranch =
              selectedBranch === "All" || call?.branchName?.includes(selectedbranchName)
            return isInRange && isInSelectedBranch
          })

          // Calculate summary counts
          const totalCalls = allCalls.length
          const solvedCalls = allCalls.filter(
            (call) => call.formdata?.status === "solved"
          ).length
          const pendingCalls = totalCalls - solvedCalls
          const todaysCalls = allCalls.filter((call) => {
            const callDate = new Date(call?.timedata?.startTime)
              .toISOString()
              .split("T")[0] // Extracts only the date
            return callDate === today
          }).length

          return {
            customerName: customer.customerName,
            totalCalls,
            solvedCalls,
            pendingCalls,
            todaysCalls,
            allCalls // Detailed call records for listing in a table
          }
        })[0]
        : null

      if (!customerData) {
        setCustomerCalls(null)
        setCalls([])
        return
      }

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().slice(0, 10)
      // Sort calls: pending calls first, today's calls second, and solved calls last
      const sortedCalls = (customerData?.allCalls || []).sort((a, b) => {
        const isAPending = a.formdata?.status === "pending"
        const isBPending = b.formdata?.status === "pending"
        const isAToday = a.timedata?.startTime?.slice(0, 10) === today
        const isBToday = b.timedata?.startTime?.slice(0, 10) === today
        const isASolved = a.formdata?.status === "solved"
        const isBSolved = b.formdata?.status === "solved"

        if (isAPending && !isBPending) return -1
        if (!isAPending && isBPending) return 1
        if (isAToday && !isBToday) return -1
        if (!isAToday && isBToday) return 1
        if (isASolved && !isBSolved) return 1
        if (!isASolved && isBSolved) return -1

        return 0
      })

      setCustomerCalls(customerData)
      setCalls(sortedCalls)
    }
    if (isModalOpen && selectedUser) {
      const today = new Date().toISOString().split("T")[0] // Today's date in 'YYYY-MM-DD' format
      const filteredCalls = indiviDualCallList
        .map((item) => {
          const matchedCallregistration = item.callregistration.filter((call) =>
            call.formdata.attendedBy.some(
              (attendee) => attendee.callerId === selectedUser
            )
          )

          if (matchedCallregistration.length > 0) {
            return {
              ...item, // Include other fields of the item
              callregistration: matchedCallregistration // Include only matched calls
            }
          }

          return null // Exclude calls without matches
        })
        .filter((item) => item !== null) // Remove `null` entries from the final array

      const result = filteredCalls.reduce(
        (acc, item) => {
          item.callregistration.forEach((call) => {
            const startTimeRaw = call?.timedata?.startTime
            const callDate = startTimeRaw
              ? new Date(startTimeRaw.split(" ")[0]).toISOString().split("T")[0]
              : null
            acc.totalCalls++ // Increment total calls

            if (today === callDate) {
              acc.todaysCall++
            }

            if (call.formdata.status.toLowerCase() === "solved") {
              const attendedByCallerIds = call.formdata.completedBy.map(
                (attendee) => attendee.callerId === selectedUser
              )
              if (attendedByCallerIds) {
                acc.solvedCalls++
              } else {
                acc.colleagueSolvedCalls++
              }
            } else {
              acc.pendingCalls++ // Increment pending calls
            }
          })
          return acc
        },
        {
          totalCalls: 0,
          solvedCalls: 0,
          pendingCalls: 0,
          todaysCall: 0,
          colleagueSolvedCalls: 0
        } // Initialize counters
      )

      setResult(result)

      // Helper function to check if a date is today's date
      const isToday = (dateString) => {
        const today = new Date()
        const date = new Date(dateString)
        return (
          today.getFullYear() === date.getFullYear() &&
          today.getMonth() === date.getMonth() &&
          today.getDate() === date.getDate()
        )
      }
      // Sort calls
      const sortedCalls = filteredCalls
        .map((call) => {
          // Flatten call registrations with their parent
          return call.callregistration.map((registration) => ({
            ...registration,
            customerName: call?.customerName,
            customerId: call?.customerid,
            productName: call?.productDetails[0]?.productName
          }))
        })
        .flat()
        .sort((a, b) => {
          // Priority: Pending, Today's Calls, Solved
          const getPriority = (registration) => {
            if (registration.formdata.status !== "solved") return 1 // Pending
            if (isToday(registration.timedata.startTime)) return 2 // Today's calls
            return 3 // Solved
          }

          return getPriority(a) - getPriority(b)
        })
      // Group back by customer
      const groupedCalls = sortedCalls.reduce((acc, registration) => {
        const customerId = registration.customerId
        if (!acc[customerId]) {
          acc[customerId] = {
            customerid: {
              _id: customerId,
              customerName: registration.customerName
            },
            callregistration: []
          }
        }
        acc[customerId].callregistration.push(registration)
        return acc
      }, {})

      const finalResult = Object.values(groupedCalls)

      if (finalResult) {
        setCustomerCalls(result)
        setUserCalls(finalResult)

        setLoading(false)
      }
    }
  }, [isModalOpen, selectedUser, selectedCustomer, callList, dates, selectedBranch, selectedbranchName])
  useEffect(() => {
    if (!isToggled) {
      setSummaryPage(1)
      setHasMoreSummaryPages(true)
      setCallList([])
    }
  }, [dates.startDate, dates.endDate, isToggled])

  useEffect(() => {
    const fetchCalls = async () => {
        const startDate = toApiDate(dates.startDate)
        const endDate = toApiDate(dates.endDate)
        if (!startDate || !endDate) {
          setLoading(false)
          return
        }

      try {
        const isFirstPage = summaryPage === 1
        if (isFirstPage) {
          setLoading(true)
          setTotalCalls(0)
        } else {
          setLoadingMore(true)
        }
        const response = await api.get("/customer/getselectedDateCalls", {
          params: { startDate, endDate, page: summaryPage, limit: 50 }
        })
        const data = Array.isArray(response.data?.data) ? response.data.data : []
        setHasMoreSummaryPages(Boolean(response.data?.pagination?.hasMore))

        if (loggedusers?.role === "Admin") {
          setCallList((currentCalls) => {
            if (isFirstPage) return data
            const existingIds = new Set(currentCalls.map((customer) => String(customer._id)))
            return [...currentCalls, ...data.filter((customer) => !existingIds.has(String(customer._id)))]
          })
        } else {
          const userBranchName = new Set(
            loggedusers?.selected.map((branch) => branch.branchName)
          )
          const branchNamesArray = Array.from(userBranchName)

          const filtered = data.filter(
            (call) =>
              Array.isArray(call?.callregistration) && // Check if callregistration is an array
              call.callregistration.some((registration) => {
                const hasMatchingBranch =
                  Array.isArray(registration?.branchName) && // Check if branchName is an array
                  registration.branchName.some(
                    (branch) => branchNamesArray.includes(branch) // Check if any branch matches user's branches
                  )

                // If user has only one branch, ensure it matches exactly and no extra branches
                if (branchNamesArray.length === 1) {
                  return (
                    hasMatchingBranch &&
                    registration.branchName.length === 1 &&
                    registration.branchName[0] === branchNamesArray[0]
                  )
                }

                // If user has more than one branch, just check for any match
                return hasMatchingBranch
              })
          )

          setCallList((currentCalls) => {
            if (isFirstPage) return filtered
            const existingIds = new Set(currentCalls.map((customer) => String(customer._id)))
            return [...currentCalls, ...filtered.filter((customer) => !existingIds.has(String(customer._id)))]
          })
        }
        } catch (error) {
          console.error("Error fetching calls:", error)
          if (summaryPage === 1) setCallList([])
          setHasMoreSummaryPages(false)
        } finally {
          if (summaryPage === 1) setLoading(false)
          else setLoadingMore(false)
        }
    }
    if (
      branch &&
      branch.length > 0 &&
      dates.startDate &&
      dates.endDate &&
      loggedusers &&
      !isToggled
    ) {
      fetchCalls()
    } else {
      return
    }
  }, [branch, loggedusers, dates, isToggled, summaryPage])

  useEffect(() => {
    if (isToggled || searchTerm?.trim() || loading || loadingMore || !hasMoreSummaryPages) return
    const sentinel = summaryLoadMoreRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setSummaryPage((page) => page + 1)
      },
      { rootMargin: "240px 0px" }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [isToggled, searchTerm, loading, loadingMore, hasMoreSummaryPages, summaryPage])
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
    console.log(loggedusers?._id)
   
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
    setperformanceOpenModal(true)
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
  const handleBranchChange = (id, branchName) => {
    setTotalCalls(0)
    setselectedBranchName(branchName)
    setSelectedBranch(id)
  }

  const toggle = () => {
    setIsToggled(!isToggled)
    setTotalCalls(0)
  }
  const openModal = (item) => {
    setExpandedCallRows({})
    setCalls([])
    setUserCalls([])
    setCustomerCalls(null)
    setResult({})
    if (isToggled) {
      setSelectedUser(item)
    } else {
      setSelectedCustomer({ id: item.customerId, name: item.customerName })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    // setLoading(true)
    setIsModalOpen(false)
    setSelectedCustomer(null)
    setSelectedUser(null)
  }
  console.log(isModalOpen)
  const callfor = (e) => {
    console.log(e?.attendedBy)
  }
console.log(selectedBranch)
  return (
    <div className="h-full overflow-hidden bg-[#ADD8E6]">
      <div className="flex h-full flex-row">
        {/* <StaticSidebar
          handleMoreClick={handleMoreClick}
          selectedCompanyBranch={selectedCompanyBranch}
          setselectedCompanyBranch={setselectedCompanyBranch}
          parenttargetData={settargetData}
          parentperiodmode={periodMode}
          parentyear={selectedYear}
          setselectedPeriod={setselectedPeriod}
        /> */}
        <div className="flex flex-1 flex-col overflow-hidden min-h-0">
          {/* <header className="flex items-center justify-between bg-[#ADD8E6]">
            {loggedusers?.role?.toLowerCase() === "admin" ? (
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
          {loading && (
            <div>
              <BarLoader
                cssOverride={{ width: "100%", height: "4px" }} // Tailwind's `h-4` corresponds to `16px`
                color="#4A90E2" // Change color as needed
                // loader={true}
              />
            </div>
          )}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[#ADD8E6] p-2 sm:p-3 lg:p-4">
            <section className="mx-auto flex w-full max-w-[1600px] min-h-0 flex-1 flex-col gap-2.5">
              <div className="rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-4 py-2.5 shadow-md sm:px-5">
                <div className="flex flex-col justify-between gap-2 lg:flex-row lg:items-center">
                  <div>
                    <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">
                      {isToggled ? "User Call Summary" : "Customer Call Summary"}
                    </h1>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-white/10 px-2 py-1 text-[11px] font-semibold text-slate-200">{isToggled ? "Staff" : "Customers"}: <strong className="text-white">{isToggled ? userList.length : customerSummary.length}</strong></span>
                    <span className="rounded-md bg-emerald-400/15 px-2 py-1 text-[11px] font-semibold text-emerald-200">Calls: <strong className="text-white">{totalcalls}</strong></span>
                    <button
                      onClick={toggle}
                      className="group inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-sky-400"
                      aria-pressed={isToggled}
                    >
                      <span className="text-slate-300">{isToggled ? "Users" : "Customers"}</span>
                      <span className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${isToggled ? "bg-emerald-400" : "bg-slate-500"}`}>
                        <span className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${isToggled ? "translate-x-4" : "translate-x-0"}`} />
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm sm:p-2">
                <div className="grid gap-1.5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
                  <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-[190px_minmax(220px,1fr)]">
                    <label className="block [&_button]:h-8 [&_button]:rounded-lg [&_button]:px-2.5 [&_button]:text-xs [&_svg]:h-4 [&_svg]:w-4">
                      <span className="sr-only">Branch</span>
                      <BranchDropdown
                        branches={branch}
                        onBranchChange={handleBranchChange}
                        branchSelected={selectedBranch}
                      />
                    </label>
                    <label className="block">
                      <span className="sr-only">Search directory</span>
                      <span className="relative block">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <input
                          value={searchTerm || ""}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 py-1 pl-8 pr-2.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                          placeholder={`Search ${isToggled ? "users" : "customers"}`}
                        />
                      </span>
                    </label>
                  </div>
                  <div className="min-w-0">
                    {dates.startDate && <MyDatePicker setDates={setDates} dates={dates} compact inlineOnMobile />}
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
              {loading || branchLoader || (isToggled && staffLoader) ? (
                <SkeletonTable rows={12} columns={isToggled ? 6 : 9} />
              ) : (
              <table className="min-w-[960px] w-full text-left">
                <thead className="sticky top-0 z-30 bg-slate-900">
                  <tr>
                    <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                      {isToggled ? "User Name" : "Customer Name"}
                    </th>
                    {!isToggled && (
                      <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                        Total Calls
                      </th>
                    )}
                    {!isToggled && (
                      <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                        Mobile No
                      </th>
                    )}
                    {!isToggled && (
                      <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                        License No
                      </th>
                    )}

                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                      Solved Calls
                    </th>
                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                      Pending Calls
                    </th>
                    {isToggled && (
                      <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                        Colleague Solved
                      </th>
                    )}
                    {!isToggled && (
                      <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                        Today's Calls
                      </th>
                    )}
                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                      Duration
                    </th>
                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-300">
                      View
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Array.isArray(isToggled ? userList : customerSummary) &&
                    ((isToggled ? userList : customerSummary).length > 0 ? (
                      (isToggled ? userList : customerSummary).map((item) => (
                        <tr key={item._id || item.customerId} className="group border-b border-slate-100 transition-colors hover:bg-slate-50">
                          <td className="px-3 py-2.5 text-xs font-medium text-slate-800">
                            {isToggled ? item.name : item.customerName}
                          </td>
                          {!isToggled && (
                            <td className="px-3 py-2.5 text-center text-xs text-slate-600">
                              {item.totalCalls}
                            </td>
                          )}
                          {!isToggled && (
                            <td className="px-3 py-2.5 text-center text-xs text-slate-600">
                              {item.mobileNumbers?.join(", ")}
                            </td>
                          )}
                          {!isToggled && (
                            <td className="px-3 py-2.5 text-center text-xs text-slate-600">
                              {item.serialNumbers?.join(", ")}
                            </td>
                          )}

                          <td className="px-3 py-2.5 text-center text-xs font-medium text-emerald-700">
                            {isToggled ? item.solvedCalls : item.solvedCalls}
                          </td>
                          <td className="px-3 py-2.5 text-center text-xs font-medium text-amber-700">
                            {isToggled ? item.pendingCalls : item.pendingCalls}
                          </td>
                          {isToggled && (
                            <td className="px-3 py-2.5 text-center text-xs text-slate-600">
                              {item.colleagueSolved}
                            </td>
                          )}
                          {!isToggled && (
                            <td className="px-3 py-2.5 text-center text-xs text-slate-600">
                              {item.todaysCalls}
                            </td>
                          )}
                          <td className="whitespace-nowrap px-3 py-2.5 text-center text-xs font-medium text-slate-700">
                            {formatTotalDuration(item.totalDurationSeconds)}
                          </td>
                          <td className="px-3 py-2.5 text-center text-xs">
                            <button
                              onClick={() =>
                                openModal(isToggled ? item.name : item)
                              }
                              className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-1 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-100 hover:text-indigo-900"
                            >
                              <Eye className="h-3.5 w-3.5" /> View calls
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={isToggled ? 6 : 9} className="p-10 text-center">
                          {loading || branchLoader || staffLoader ? (
                            <div className="justify center">
                              <PropagateLoader color="#3b82f6" size={10} />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-500">
                              <CircleCheck className="h-7 w-7 text-slate-300" />
                              <span>No records found for the selected filters.</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              )}
              {!isToggled && !loading && (
                <div ref={summaryLoadMoreRef} className="flex min-h-10 items-center justify-center border-t border-slate-100 bg-white px-3 py-2 text-xs">
                  {loadingMore ? (
                    <span className="inline-flex items-center gap-2 text-slate-500"><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />Loading more customers…</span>
                  ) : searchTerm?.trim() ? (
                    <span className="text-slate-400">Showing matching customers</span>
                  ) : hasMoreSummaryPages ? (
                    <span className="text-slate-400">Scroll to load more customers</span>
                  ) : callList.length > 0 ? (
                    <span className="text-slate-400">All customers loaded</span>
                  ) : null}
                </div>
              )}
              </div>
            </section>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5">
          <div className="flex h-[calc(100dvh-1.5rem)] w-full max-w-[1500px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:h-[calc(100dvh-2.5rem)]">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-900 to-indigo-950 px-4 py-3 text-white sm:px-5">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300">Call activity</p>
                <h2 className="truncate text-lg font-bold sm:text-xl">{isToggled ? selectedUser : customerCalls?.customerName || "Customer"} <span className="font-medium text-slate-300">Call Summary</span></h2>
              </div>
              <button type="button" onClick={closeModal} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-slate-100 transition hover:bg-white/20" aria-label="Close call summary"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-slate-300 bg-slate-100 p-3 sm:grid-cols-4">
              <Tiles title="Pending Calls" compact count={isToggled ? result?.pendingCalls : customerCalls?.pendingCalls} subtitle="Awaiting follow-up" icon={<PhoneMissed size={12} strokeWidth={2.2} />} style={{ background: "linear-gradient(135deg, #be123c 0%, #f43f5e 52%, #fda4af 100%)" }} />
              <Tiles title="Solved Calls" compact count={isToggled ? result?.solvedCalls : customerCalls?.solvedCalls} subtitle="Resolved" icon={<BadgeCheck size={12} strokeWidth={2.2} />} style={{ background: "linear-gradient(135deg, #047857 0%, #34d399 52%, #99f6e4 100%)" }} />
              <Tiles title="Today Pending Calls" compact count={isToggled ? result?.todaysCall : customerCalls?.todaysCalls} subtitle="Scheduled today" icon={<PhoneIncoming size={12} strokeWidth={2.2} />} style={{ background: "linear-gradient(135deg, #c2410c 0%, #f59e0b 52%, #fde68a 100%)" }} />
              <Tiles title={isToggled ? "Colleague Solved" : "Online Calls"} compact count={isToggled ? result?.colleagueSolvedCalls : 0} subtitle={isToggled ? "Colleague resolved" : "Online"} icon={<PhoneCall size={12} strokeWidth={2.2} />} style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #93c5fd 100%)" }} />
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-slate-100 p-3 sm:p-4">
              <div className="h-full overflow-auto rounded-xl border border-slate-400 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.16)]">
              <table className="min-w-[1280px] w-full table-fixed border-separate border-spacing-0 text-[11px] text-slate-700 md:text-xs">
                <thead className="sticky top-0 z-40 bg-slate-900">
                  <tr className="bg-gradient-to-r from-slate-950 via-slate-800 to-slate-900 shadow-[inset_0_-1px_0_rgba(255,255,255,0.12)]">
                    <th className="w-[4%] border-b border-slate-600 px-2 py-2 text-center text-[11px] font-bold text-slate-100"></th>
                    <th className="w-[14%] border-b border-slate-600 px-2 py-2 text-left text-[11px] font-bold text-slate-100">Customer Name</th>
                    <th className="w-[14%] border-b border-slate-600 px-2 py-2 text-left text-[11px] font-bold text-slate-100">Product Name</th>
                    <th className="w-[9%] border-b border-slate-600 px-2 py-2 text-left text-[11px] font-bold text-slate-100">License No</th>
                    <th className="w-[15%] border-b border-slate-600 px-2 py-2 text-left text-[11px] font-bold text-slate-100">Description</th>
                    <th className="w-[11%] border-b border-slate-600 px-2 py-2 text-left text-[11px] font-bold text-slate-100">Incoming No</th>
                    <th className="w-[12%] border-b border-slate-600 px-2 py-2 text-left text-[11px] font-bold text-slate-100">Start Date &amp; Time</th>
                    <th className="w-[12%] border-b border-slate-600 px-2 py-2 text-left text-[11px] font-bold text-slate-100">End Date &amp; Time</th>
                    <th className="w-[9%] border-b border-slate-600 px-2 py-2 text-left text-[11px] font-bold text-slate-100">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-gray-200">
                  {isToggled ? (
                    userCalls?.length > 0 ? (
                      userCalls?.map((call, customerIndex) =>
                        call?.callregistration.map((reg, registrationIndex) => {
                          const rowKey = `user-${reg?._id || reg?.timedata?.token || `${call?.customerid?._id || customerIndex}-${reg?.timedata?.startTime || registrationIndex}`}`
                          return (
                            <Fragment key={rowKey}>
                              <tr className={`transition-colors ${getCallTone(reg)}`}>
                                <td className="border-b border-slate-300 px-1 py-1 text-center align-middle">
                                  <button type="button" onClick={() => setExpandedCallRows((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }))} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 bg-white/90 text-[9px] font-bold text-slate-700 shadow-sm transition hover:bg-white">
                                    <span className={`transition-transform ${expandedCallRows[rowKey] ? "rotate-180" : ""}`}>▼</span>
                                  </button>
                                </td>
                                <td className="break-words border-b border-slate-300 px-2 py-1 align-top text-slate-900">{call?.customerid?.customerName || "N/A"}</td>
                                <td className="break-words border-b border-slate-300 px-2 py-1 align-top text-slate-900">{reg?.productName || "N/A"}</td>
                                <td className="truncate border-b border-slate-300 px-2 py-1 align-top text-slate-800">{reg?.license || "N/A"}</td>
                                <td className="border-b border-slate-300 px-2 py-1 align-top text-slate-800"><div className="truncate" title={reg?.formdata?.description || "N/A"}>{reg?.formdata?.description || "N/A"}</div></td>
                                <td className="truncate border-b border-slate-300 px-2 py-1 align-top text-slate-800">{reg?.formdata?.incomingNumber || "N/A"}</td>
                                <td className="whitespace-nowrap border-b border-slate-300 px-2 py-1 align-top text-slate-800">{formatCallDateTime(reg?.timedata?.startTime)}</td>
                                <td className="whitespace-nowrap border-b border-slate-300 px-2 py-1 align-top text-slate-800">{formatCallDateTime(reg?.timedata?.endTime)}</td>
                                <td className="whitespace-nowrap border-b border-slate-300 px-2 py-1 align-top font-medium text-slate-800">{formatCallDuration(reg?.timedata?.startTime, reg?.timedata?.endTime)}</td>
                              </tr>
                              {expandedCallRows[rowKey] && <tr className="bg-slate-200 text-left">
                                <td colSpan={9} className="border-b border-slate-300 px-3 py-2">
                                  <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                                    <div className="min-w-0"><span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500">Description</span><span className="block truncate text-slate-800" title={reg?.formdata?.description || "N/A"}>{reg?.formdata?.description || "N/A"}</span></div>
                                    <div><span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500">Status</span><span className="font-medium capitalize text-slate-800">{reg?.formdata?.status || "Pending"}</span></div>
                                    <div className="min-w-0"><span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500">Solution</span><span className="block truncate text-slate-800" title={reg?.formdata?.solution || "N/A"}>{reg?.formdata?.solution || "N/A"}</span></div>
                                  </div>
                                </td>
                              </tr>}
                            </Fragment>
                          )
                        })
                      )
                    ) : (
                      <tr>
                        <td colSpan={9}>
                          {loading ? "Loading..." : "No calls"}
                        </td>
                      </tr>
                    )
                  ) : (
                    Calls.map((call, index) => {
                      const rowKey = `customer-${call?._id || call?.timedata?.token || `${call?.timedata?.startTime || "call"}-${index}`}`
                      return (
                        <Fragment key={rowKey}>
                          <tr className={`transition-colors ${getCallTone(call)}`}>
                            <td className="border-b border-slate-300 px-1 py-1 text-center align-middle">
                              <button type="button" onClick={() => setExpandedCallRows((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }))} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 bg-white/90 text-[9px] font-bold text-slate-700 shadow-sm transition hover:bg-white">
                                <span className={`transition-transform ${expandedCallRows[rowKey] ? "rotate-180" : ""}`}>▼</span>
                              </button>
                            </td>
                            <td className="break-words border-b border-slate-300 px-2 py-1 align-top text-slate-900">{customerCalls?.customerName || "N/A"}</td>
                            <td className="break-words border-b border-slate-300 px-2 py-1 align-top text-slate-900">{call?.productdetails?.productName || "N/A"}</td>
                            <td className="truncate border-b border-slate-300 px-2 py-1 align-top text-slate-800">{call?.license || "N/A"}</td>
                            <td className="border-b border-slate-300 px-2 py-1 align-top text-slate-800"><div className="truncate" title={call?.formdata?.description || "N/A"}>{call?.formdata?.description || "N/A"}</div></td>
                            <td className="truncate border-b border-slate-300 px-2 py-1 align-top text-slate-800">{call?.formdata?.incomingNumber || "N/A"}</td>
                            <td className="whitespace-nowrap border-b border-slate-300 px-2 py-1 align-top text-slate-800">{formatCallDateTime(call?.timedata?.startTime)}</td>
                            <td className="whitespace-nowrap border-b border-slate-300 px-2 py-1 align-top text-slate-800">{formatCallDateTime(call?.timedata?.endTime)}</td>
                            <td className="whitespace-nowrap border-b border-slate-300 px-2 py-1 align-top font-medium text-slate-800">{formatCallDuration(call?.timedata?.startTime, call?.timedata?.endTime)}</td>
                          </tr>
                          {expandedCallRows[rowKey] && <tr className="bg-slate-200 text-left">
                            <td colSpan={9} className="border-b border-slate-300 px-3 py-2">
                              <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                                <div className="min-w-0"><span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500">Description</span><span className="block truncate text-slate-800" title={call?.formdata?.description || "N/A"}>{call?.formdata?.description || "N/A"}</span></div>
                                <div><span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500">Status</span><span className="font-medium capitalize text-slate-800">{call?.formdata?.status || "Pending"}</span></div>
                                <div className="min-w-0"><span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500">Solution</span><span className="block truncate text-slate-800" title={call?.formdata?.solution || "N/A"}>{call?.formdata?.solution || "N/A"}</span></div>
                              </div>
                            </td>
                          </tr>}
                        </Fragment>
                      )
                    })
                  )}
                </tbody>
              </table>
              </div>
            </div>
          </div>
        </div>
      )}
  <PerformanceModal
          modalOpen={performanceopenModal}
          splitType={targetData?.selectedMeasurementType}
          selectedperiod={selectedPeriod}
          allperiods={targetData?.periods}
          onselectedPeriodChange={(val, val2) => {
            setperiodMode(val2)
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
            setperformanceOpenModal(false)
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
          loggedUser={loggedusers}
          selectedUser={selectedUserName}
          category={selectedCategory}
          handleSelectedUser={handleSelectedUser}
  activeUserId={activeUserId}
        />
    </div>
  )
}

export default Summary

