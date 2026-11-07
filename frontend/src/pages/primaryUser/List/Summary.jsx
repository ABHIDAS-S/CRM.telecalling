
import { useEffect, useState } from "react"
import MyDatePicker from "../../../components/common/MyDatePicker"
import { PropagateLoader } from "react-spinners"
import { BarLoader } from "react-spinners"
import api from "../../../api/api"
import UseFetch from "../../../hooks/useFetch"
import { PerformanceModal } from "../../../components/primaryUser/PerformanceModal"
import { StaticSidebar } from "../../../components/primaryUser/StaticSidebar"
import AdminHeader from "../../../header/AdminHeader"
import StaffHeader from "../../../header/StaffHeader"
import BranchDropdown from "../../../components/primaryUser/BranchDropdown"
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
  Search,
  CircleCheck
} from "lucide-react"

// eslint-disable-next-line react/prop-types
const ModalStat = ({ label, value, tone }) => (
  <div className={`rounded-lg border px-3 py-2 ${tone}`}>
    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
    <p className="mt-0.5 text-xl font-bold leading-none">{value ?? 0}</p>
  </div>
)

const getCallTone = (call) => {
  const status = String(call?.formdata?.status || "").toLowerCase()
  if (status === "online") return "bg-blue-50 hover:bg-blue-100"
  if (status === "solved") return "bg-emerald-50 hover:bg-emerald-100"

  const startDate = call?.timedata?.startTime
    ? new Date(call.timedata.startTime).toISOString().slice(0, 10)
    : ""
  const today = new Date().toISOString().slice(0, 10)
  return startDate === today
    ? "bg-amber-50 hover:bg-amber-100"
    : "bg-rose-50 hover:bg-rose-100"
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
console.log(user.selected[0].branch_id)
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
                  } else {
                    updatedList.push({
                      _id: call.callerId,
                      name: call.callerName,
                      solvedCalls: call.solvedCalls || 0,
                      pendingCalls: call.pendingCalls || 0,
                      colleagueSolved: call.colleagueSolved || 0,
                      datecalls: call.datecalls || 0,
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
                  } else {
                    updatedList.push({
                      _id: call.callerId,
                      name: call.callerName,
                      solvedCalls: call.solvedCalls || 0,
                      pendingCalls: call.pendingCalls || 0,
                      colleagueSolved: call.colleagueSolved || 0,
                      datecalls: call.datecalls || 0,
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
            .filter(
              (customer) =>
                selectedBranch === "All" ||
                customer?.callregistration?.some((call) =>
                  call?.branchName?.includes(selectedbranchName)
                )
            )
            .map((customer) => {
              const totalCalls = customer.callregistration.length
              const startDate = new Date(dates.startDate)
                .toISOString()
                .split("T")[0] // Convert start date to a Date object
              const endDate = new Date(dates.endDate)
                .toISOString()
                .split("T")[0] // Convert end date to a Date object

              const dateCalls = customer.callregistration.filter((call) => {
                const callDate = new Date(call.timedata.startTime)
                  .toISOString()
                  .split("T")[0] // Convert call's startTime to a Date object

                return callDate >= startDate && callDate <= endDate // Check if call is within the range
              }).length

              const solvedCalls = customer.callregistration.filter((call) => {
                const callDate = new Date(call.timedata.startTime)
                  .toISOString()
                  .split("T")[0] // Convert call's startTime to a Date object
                return (
                  call.formdata.status === "solved" && // Check if status is solved
                  callDate >= startDate &&
                  callDate <= endDate // Check if within date range
                )
              }).length

              const pendingCalls = dateCalls - solvedCalls
              const today = new Date().toISOString().split("T")[0]

              const todaysCalls = customer.callregistration.filter((call) => {
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
              for (const call of customer.callregistration) {
                const num = call?.formdata?.incomingNumber
                if (num && !uniqueIncomingNumbers.includes(num)) {
                  uniqueIncomingNumbers.push(num)
                }
                if (uniqueIncomingNumbers.length === 3) break
              }
              // Extract unique last 3 mobile numbers (incomingNumber)
              const uniqueSerialNumbers = []
              for (const call of customer.callregistration) {
                const license = call?.license
                if (license && !uniqueSerialNumbers.includes(license)) {
                  uniqueSerialNumbers.push(license)
                }
              }
              return {
                customerId: customer._id,
                customerName: customer.customerName,
                totalCalls,
                solvedCalls,
                pendingCalls,
                todaysCalls,
                dateCalls,
                mobileNumbers: uniqueIncomingNumbers,
                serialNumbers: uniqueSerialNumbers
              }
            })
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
  }, [callList, selectedBranch, isToggled, dates])

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
    if (cachedsummary && cachedsummary.length > 0) {
      if (isToggled) {
        if (searchTerm === null) {
          return
        } else if (searchTerm === "") {
          setUserList(cachedUserlistsummary)
        } else if (searchTerm) {
          const filteredCalls = cachedUserlistsummary.filter((call) =>
            call.name.toLowerCase().includes(searchTerm.toLowerCase())
          )
          setUserList(filteredCalls)
        }
      } else {
        if (searchTerm === null) {
          return
        } else if (searchTerm === "") {
          setCustomerSummary(cachedsummary)
        } else if (searchTerm) {
          const filteredCalls = cachedsummary.filter((call) =>
            call.customerName.toLowerCase().includes(searchTerm.toLowerCase())
          )
          setCustomerSummary(filteredCalls)
        }
      }
    }
  }, [searchTerm])

  useEffect(() => {
    if (isModalOpen && selectedCustomer) {
      const customerData = callList
        .filter((customer) => customer._id === selectedCustomer) // Filter for the selected customer
        .map((customer) => {
          const today = new Date().toISOString().slice(0, 10) // Get today's date in YYYY-MM-DD format

          // Get all calls for the selected customer
          const allCalls = customer.callregistration.map((call) => call)

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
        })[0] // Assuming there's only one customer with this name

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().slice(0, 10)
      // Sort calls: pending calls first, today's calls second, and solved calls last
      const sortedCalls = customerData.allCalls.sort((a, b) => {
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
  }, [isModalOpen, selectedUser, selectedCustomer])
  useEffect(() => {
    const fetchCalls = async () => {
      try {
        const today = new Date().toISOString().split("T")[0]
        if (today < dates.endDate) {
          return
        }
        setLoading(true)
        setTotalCalls(0)
        const query = `startDate=${dates.startDate}&endDate=${dates.endDate}`
        const response = await api.get(
          `/customer/getselectedDateCalls?${query}`
        ) // Replace with your API endpoint
        const data = response.data.data

        setLoading(false)
        if (loggedusers?.role === "Admin") {
          setCallList(data)
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

          setCallList(filtered)
        }
      } catch (error) {
        console.error("Error fetching calls:", error)
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
      setCallList([])
      fetchCalls()
    } else {
      return
    }
  }, [branch, loggedusers, dates])
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
  const openModal = (id) => {
    if (isToggled) {
      setSelectedUser(id)
    } else {
      setSelectedCustomer(id)
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

              <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm">
                <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[200px_minmax(240px,1fr)]">
                    <label className="block">
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
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                          value={searchTerm || ""}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-50"
                          placeholder={`Search ${isToggled ? "users" : "customers"}`}
                        />
                      </span>
                    </label>
                  </div>
                  <div className="min-w-0">
                    {dates.startDate && <MyDatePicker setDates={setDates} dates={dates} />}
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                      date Calls
                    </th>
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

                          <td className="px-3 py-2.5 text-center text-xs font-medium text-slate-700">
                            {isToggled ? item.datecalls : item.dateCalls}
                          </td>
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
                          <td className="px-3 py-2.5 text-center text-xs">
                            <button
                              onClick={() =>
                                openModal(
                                  isToggled ? item.name : item.customerId
                                )
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
                        <td colSpan="9" className="p-10 text-center">
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
                <h2 className="truncate text-lg font-bold sm:text-xl">{isToggled ? selectedUser : customerCalls.customerName} <span className="font-medium text-slate-300">Call Summary</span></h2>
              </div>
              <button type="button" onClick={closeModal} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-slate-100 transition hover:bg-white/20" aria-label="Close call summary"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid shrink-0 grid-cols-2 gap-2 border-b border-slate-200 bg-slate-50 p-3 sm:grid-cols-4">
              <ModalStat label="Pending" value={isToggled ? result?.pendingCalls : customerCalls?.pendingCalls} tone="border-rose-100 bg-rose-50 text-rose-700" />
              <ModalStat label="Solved" value={isToggled ? result?.solvedCalls : customerCalls?.solvedCalls} tone="border-emerald-100 bg-emerald-50 text-emerald-700" />


              <ModalStat label="Today" value={isToggled ? result?.todaysCall : customerCalls?.todaysCalls} tone="border-amber-100 bg-amber-50 text-amber-700" />
              <ModalStat label={isToggled ? "Colleague solved" : "Online calls"} value={isToggled ? result?.colleagueSolvedCalls : 0} tone="border-indigo-100 bg-indigo-50 text-indigo-700" />
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-slate-50 p-3 sm:p-4">
              <div className="h-full overflow-auto rounded-xl border border-slate-300 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.10)]">
              <table className="min-w-[900px] w-full table-fixed border-separate border-spacing-0 text-[11px] text-slate-700 md:text-xs">
                <thead className="sticky top-0 z-40 bg-slate-200">
                  <tr className="bg-gradient-to-r from-slate-300 via-slate-200 to-slate-100 shadow-[inset_0_-1px_0_rgba(100,116,139,0.35)]">
                    <th className="w-[5%] border-b border-slate-300 px-2 py-2 text-center text-[11px] font-bold text-slate-700"></th>
                    <th className="w-[23%] border-b border-slate-300 px-2 py-2 text-left text-[11px] font-bold text-slate-700">Customer Name</th>
                    <th className="w-[23%] border-b border-slate-300 px-2 py-2 text-left text-[11px] font-bold text-slate-700">Product Name</th>
                    <th className="w-[16%] border-b border-slate-300 px-2 py-2 text-left text-[11px] font-bold text-slate-700">License No</th>
                    <th className="w-[20%] border-b border-slate-300 px-2 py-2 text-left text-[11px] font-bold text-slate-700">Description</th>
                    <th className="w-[13%] border-b border-slate-300 px-2 py-2 text-left text-[11px] font-bold text-slate-700">Incoming No</th>
                  </tr>
                </thead>
                <tbody className="divide-gray-200">
                  {isToggled ? (
                    userCalls?.length > 0 ? (
                      userCalls?.map((call) =>
                        call?.callregistration.map((reg) => {
                          return (
                            <>
                              <tr key={reg._id} className={`transition-colors ${getCallTone(reg)}`}>
                                <td className="border-b border-slate-300 px-1 py-1 text-center align-middle">
                                  <button type="button" onClick={() => setExpandedCallRows((prev) => ({ ...prev, [`user-${reg._id}`]: !prev[`user-${reg._id}`] }))} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 bg-white/90 text-[9px] font-bold text-slate-700 shadow-sm transition hover:bg-white">
                                    <span className={`transition-transform ${expandedCallRows[`user-${reg._id}`] ? "rotate-180" : ""}`}>▼</span>
                                  </button>
                                </td>
                                <td className="break-words border-b border-slate-300 px-2 py-1 align-top text-slate-900">{call?.customerid?.customerName || "N/A"}</td>
                                <td className="break-words border-b border-slate-300 px-2 py-1 align-top text-slate-900">{reg?.productName || "N/A"}</td>
                                <td className="truncate border-b border-slate-300 px-2 py-1 align-top text-slate-800">{reg?.license || "N/A"}</td>
                                <td className="border-b border-slate-300 px-2 py-1 align-top text-slate-800"><div className="truncate" title={reg?.formdata?.description || "N/A"}>{reg?.formdata?.description || "N/A"}</div></td>
                                <td className="truncate border-b border-slate-300 px-2 py-1 align-top text-slate-800">{reg?.formdata?.incomingNumber || "N/A"}</td>
                              </tr>
                              {expandedCallRows[`user-${reg._id}`] && <tr className="bg-slate-100 text-left">
                                <td colSpan={6} className="border-b border-slate-300 px-3 py-2">
                                  <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                                    <div className="min-w-0"><span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500">Description</span><span className="block truncate text-slate-800" title={reg?.formdata?.description || "N/A"}>{reg?.formdata?.description || "N/A"}</span></div>
                                    <div><span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500">Status</span><span className="font-medium capitalize text-slate-800">{reg?.formdata?.status || "Pending"}</span></div>
                                    <div className="min-w-0"><span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500">Solution</span><span className="block truncate text-slate-800" title={reg?.formdata?.solution || "N/A"}>{reg?.formdata?.solution || "N/A"}</span></div>
                                  </div>
                                </td>
                              </tr>}
                            </>
                          )
                        })
                      )
                    ) : (
                      <tr>
                        <td colSpan={5}>
                          {loading ? "Loading..." : "No calls"}
                        </td>
                      </tr>
                    )
                  ) : (
                    Calls.map((call) => {
                      return (
                        <>
                          <tr key={call._id} className={`transition-colors ${getCallTone(call)}`}>
                            <td className="border-b border-slate-300 px-1 py-1 text-center align-middle">
                              <button type="button" onClick={() => setExpandedCallRows((prev) => ({ ...prev, [`customer-${call._id}`]: !prev[`customer-${call._id}`] }))} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-400 bg-white/90 text-[9px] font-bold text-slate-700 shadow-sm transition hover:bg-white">
                                <span className={`transition-transform ${expandedCallRows[`customer-${call._id}`] ? "rotate-180" : ""}`}>▼</span>
                              </button>
                            </td>
                            <td className="break-words border-b border-slate-300 px-2 py-1 align-top text-slate-900">{customerCalls?.customerName || "N/A"}</td>
                            <td className="break-words border-b border-slate-300 px-2 py-1 align-top text-slate-900">{call?.productdetails?.productName || "N/A"}</td>
                            <td className="truncate border-b border-slate-300 px-2 py-1 align-top text-slate-800">{call?.license || "N/A"}</td>
                            <td className="border-b border-slate-300 px-2 py-1 align-top text-slate-800"><div className="truncate" title={call?.formdata?.description || "N/A"}>{call?.formdata?.description || "N/A"}</div></td>
                            <td className="truncate border-b border-slate-300 px-2 py-1 align-top text-slate-800">{call?.formdata?.incomingNumber || "N/A"}</td>
                          </tr>
                          {expandedCallRows[`customer-${call._id}`] && <tr className="bg-slate-100 text-left">
                            <td colSpan={6} className="border-b border-slate-300 px-3 py-2">
                              <div className="grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                                <div className="min-w-0"><span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500">Description</span><span className="block truncate text-slate-800" title={call?.formdata?.description || "N/A"}>{call?.formdata?.description || "N/A"}</span></div>
                                <div><span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500">Status</span><span className="font-medium capitalize text-slate-800">{call?.formdata?.status || "Pending"}</span></div>
                                <div className="min-w-0"><span className="block text-[9px] font-bold uppercase tracking-wide text-slate-500">Solution</span><span className="block truncate text-slate-800" title={call?.formdata?.solution || "N/A"}>{call?.formdata?.solution || "N/A"}</span></div>
                              </div>
                            </td>
                          </tr>}
                        </>
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

