import React, { useEffect, useState } from "react"
import { toast } from "react-toastify"
import dayjs from "dayjs"
import { FaArrowRight } from "react-icons/fa"
import BarLoader from "react-spinners/BarLoader"
import { HiChevronLeft, HiChevronRight } from "react-icons/hi" // Impo
import UseFetch from "../../hooks/useFetch"
import api from "../../api/api"

function LeaveApplication() {
  const [events, setEvents] = useState([])
  // const [ownCalander,setOwnCalander]=useState()
  const [edit, setEdit] = useState(null)
  const [isHaveCompensatoryleave, setcompensatoryLeave] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [visibleDays, setVisibleDays] = useState([])
  const [BalanceprivilegeleaveCount, setBalanceprivilegeLeaveCount] =
    useState(0)
  const [BalancesickleaveCount, setBalansickLeaveCount] = useState(0)
  const [visibleMonth, setVisibleMonth] = useState("")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [leaveBalance, setLeaveBalance] = useState({})
  const [BalancedcasualleaveCount, setBalancecasualLeaveCount] = useState(0)
  const [BalancecompensatoryleaveCount, setBalancecompensatoryLeaveCount] =
    useState(0)
  const [allleaves, setAllleaves] = useState([])
  const [allOnsites, setAllOnsite] = useState([])
  const [errors, setErrors] = useState({})

  const [MonthData, setMonthData] = useState({})
  const [currentMonthData, setcurrentMonthData] = useState({})
  const [currentMonth, setCurrentMonth] = useState(null)
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [message, setMessage] = useState({
    top: "",
    bottom: ""
  })
  const [showModal, setShowModal] = useState(false)
  const [pastDate, setPastDate] = useState(null)
  const [selectedTab, setSelectedTab] = useState("Leave")
  const [formData, setFormData] = useState({
    leaveDate: "",
    onsiteDate: "",
    leaveType: "Full Day",
    onsiteType: "Full Day",

    halfDayPeriod: "Morning",
    onsite: false,
    leaveCategory: "",
    reason: "",
    description: "",
    eventId: null
  })

  const [isOnsite, setIsOnsite] = useState(false)
  const [loader, setLoader] = useState(false)
  const [tableRows, setTableRows] = useState([])
  const [clickedDate, setclickedDate] = useState(null)
  const [currentmonthleaveData, setcurrentmonthLeaveData] = useState([])
  const [currentmonthonsiteData, setcurrentmonthOnsiteData] = useState([])
  const userData = localStorage.getItem("user")
  const tabs = ["Leave", "Onsite"]
  const user = JSON.parse(userData)
console.log(user)
  const { data: leaves, refreshHook } = UseFetch(
    user && `/auth/getallLeave?userid=${user._id}`
  )
  const { data: compensatoryleaves, refreshHook: refreshHookCompensatory } =
    UseFetch(user && `/auth/getallcompensatoryleave?userid=${user._id}`)
  const { data: monthlyHoly } = UseFetch(
    currentMonth &&
      `/customer/getallCurrentmonthHoly?currentmonth=${currentMonth}`
  )
  const { data: allonsite, refreshHook: refreshHookOnsite } = UseFetch(
    user && `/auth/getallOnsite?userid=${user._id}`
  )
  const { data: leavemasterleavecount } = UseFetch(
    "/auth/getleavemasterleavecount"
  )
  useEffect(() => {
    if (MonthData && currentMonth) {
      setcurrentMonthData(MonthData[currentMonth])
    }
  }, [currentMonth, MonthData])

  useEffect(() => {
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, "0") // Convert to "01-12" format
    setCurrentMonth(`${year}-${month}`)
  }, [currentDate])
  useEffect(() => {
    const filteredcurrentmonthlyLeaves = allleaves?.filter((leaves) => {
      ///leavedate is iso format like "2025-03-03T12:00:00Z" so here slice 0 takes the first part and get the first 7 means 2025-03 because current month includes year also 2025-03
      const leaveMonth = leaves.leaveDate.split("T")[0].slice(0, 7)
      //here currentMonth have year and month no date
      return leaveMonth === currentMonth
    })
    setcurrentmonthLeaveData(filteredcurrentmonthlyLeaves)
  }, [allleaves, currentDate, currentMonth])
  useEffect(() => {
    if ((leaves && leaves.length > 0) || (allonsite && allonsite.length) > 0) {
      setAllleaves(leaves)
      setAllOnsite(allonsite)
    }
  }, [leaves, allonsite])
  useEffect(() => {
    if (allOnsites && allOnsites.length > 0) {
      const filteredcurrentmonthlyOnsites = allOnsites?.filter((onsites) => {
        ///onsitedate is iso format like "2025-03-03T12:00:00Z" so here slice 0 takes the first part and get the first 7 means 2025-03 because current month includes year also 2025-03
        const onsiteMonth = onsites.onsiteDate.split("T")[0].slice(0, 7)

        //here currentMonth have year and month no date
        return onsiteMonth === currentMonth
      })
      setcurrentmonthOnsiteData(filteredcurrentmonthlyOnsites)
    }
  }, [allOnsites, currentMonth])
  useEffect(() => {
    const days = []

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth() + 1
    setCurrentYear(year)

    // Set month name
    setVisibleMonth(
      `${currentDate.toLocaleString("default", { month: "long" })} ${year}`
    )

    // Get last day of the month
    const lastDay = new Date(year, month, 0).getDate()

    // Generate all days in the month
    for (let i = 1; i <= lastDay; i++) {
      const date = new Date(year, month - 1, i + 1)

      days.push({
        fullDate: date.toISOString().split("T")[0], // Format: YYYY-MM-DD
        fullMonthDay: date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          timeZone: "UTC"
        }), // Format: 07 March 2025
        day: date
      })
    }

    setVisibleDays(days)
  }, [currentDate])
  useEffect(() => {
    const today = dayjs().format("YYYY-MM-DD") // Get today's date in YYYY-MM-DD format

    const isPastDate =
      formData?.leaveDate && dayjs(formData.leaveDate).isBefore(today)

    setPastDate(isPastDate)
  }, [formData])
console.log(allleaves)
  useEffect(() => {
    if (
      allleaves &&
      allleaves.length > 0 &&
      leavemasterleavecount &&
      compensatoryleaves >= 0
    ) {
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()
      const currentmonth = currentDate.getMonth() + 1
      const leaveDate = formData?.leaveDate
        ? new Date(formData?.leaveDate)
        : new Date()
      const leaveYear = leaveDate.getFullYear()

      const privileageDate = new Date(user?.privilegeleavestartsfrom)
      const privileagestartYear = privileageDate.getFullYear()
      const privileagestartmonth = privileageDate.getMonth() + 1 // 1-based month
      const casualstartDate = new Date(user?.casualleavestartsfrom)
      const casualstartYear = casualstartDate.getFullYear()
      const casualstartmonth = casualstartDate.getMonth() + 1 // 1-based month
console.log(casualstartDate)
      const totalprivilegeLeave = leavemasterleavecount?.totalprivilegeLeave
      const privilegePerMonth = totalprivilegeLeave / 12
      const totalcasualLeave = leavemasterleavecount?.totalcasualleave
      const casualPerMonth = totalcasualLeave / 12
      let ownedprivilegeCount = 0
      let ownedcasualCount = 0
console.log(casualstartYear)
console.log(currentYear)
      if (casualstartYear < currentYear) {
        let casualCount

        if (casualstartYear < leaveYear && leaveYear < currentYear) {
          casualCount = casualPerMonth
        } else if (casualstartYear < leaveYear) {
          casualCount = casualPerMonth
        } else if (casualstartYear === leaveYear) {
          casualCount = casualPerMonth
        }
        ownedcasualCount = casualCount
      } else if (casualstartYear === currentYear) {
console.log(currentmonth)
console.log(casualstartmonth)
        // If privilege started this year, give leaves from start month to current month
        if (currentmonth >= casualstartmonth) {
          ownedcasualCount = casualPerMonth
        } else {
          ownedcasualCount = 0
        }
      } else {
        ownedcasualCount = 0
      }

      if (privileagestartYear < currentYear) {
        let privilegeCount

        if (privileagestartYear < leaveYear && leaveYear < currentYear) {
          privilegeCount = 12 * privilegePerMonth
        } else if (privileagestartYear < leaveYear) {
          privilegeCount = currentmonth * privilegePerMonth
        } else if (privileagestartYear === leaveYear) {
          const monthsRemainingInStartYear = 12 - privileagestartmonth + 1 // Calculate remaining months including startMonth
          privilegeCount = monthsRemainingInStartYear * privilegePerMonth
        }
        ownedprivilegeCount = privilegeCount
      } else if (privileagestartYear === currentYear) {
        // If privilege started this year, give leaves from start month to current month
        if (currentmonth >= privileagestartmonth) {
          ownedprivilegeCount =
            (currentmonth - privileagestartmonth + 1) * privilegePerMonth
        } else {
          ownedprivilegeCount = 0 // Not eligible yet
        }
      } else {
        // If privilege starts in a future year, no leaves yet
        ownedprivilegeCount = 0
      }
      const filteredcurrentmonthlyLeaves = allleaves.filter((leaves) => {
        ///leavedate is iso format like "2025-03-03T12:00:00Z" so here slice 0 takes the first part and get the first 7 means 2025-03 because current month includes year also 2025-03
        const leaveMonth = leaves.leaveDate.split("T")[0].slice(0, 7)
        //here currentMonth have year and month no date
        return leaveMonth === currentMonth
      })
      setcurrentmonthLeaveData(filteredcurrentmonthlyLeaves)

      const usedCasualCount = allleaves?.reduce((count, leave) => {
        if (!leave.leaveDate) return count
        const leaveDate = new Date(formData.leaveDate)
        const leaveMonthYear = `${leaveDate.getFullYear()}-${String(
          leaveDate.getMonth() + 1
        ).padStart(2, "0")}`

        const leaveDateObj = new Date(leave.leaveDate)
        const leaveMonthYearFromData = `${leaveDateObj.getFullYear()}-${String(
          leaveDateObj.getMonth() + 1
        ).padStart(2, "0")}`
        if (
          leave.leaveCategory === "casual Leave" &&
          leaveMonthYear === leaveMonthYearFromData
        ) {
          return count + (leave.leaveType === "Half Day" ? 0.5 : 1)
        }

        return count
      }, 0)

      const takenPrivilegeCount = allleaves?.reduce((count, leave) => {
        if (!leave.leaveDate) return count

        const leaveYear = new Date(formData.leaveDate).getFullYear()
        const leaveYearFromData = new Date(leave.leaveDate).getFullYear()

        if (
          leave.leaveCategory === "privileage Leave" &&
          leaveYear === leaveYearFromData
        ) {
          return count + (leave.leaveType === "Half Day" ? 0.5 : 1)
        }

        return count
      }, 0)
console.log(ownedcasualCount)
      const balancecasualcount = ownedcasualCount - usedCasualCount
      const balanceprivilege = ownedprivilegeCount - takenPrivilegeCount

      setBalanceprivilegeLeaveCount(Math.max(balanceprivilege, 0))
      setBalancecasualLeaveCount(Math.max(balancecasualcount, 0))
      setBalancecompensatoryLeaveCount(compensatoryleaves)
      setLeaveBalance({
        ...leaveBalance,
        casual: Math.max(balancecasualcount, 0),
        privilege: Math.max(balanceprivilege, 0),
        sick: BalancesickleaveCount,
        compensatory: compensatoryleaves
      })
    } else if (
      (!allleaves && leavemasterleavecount) ||
      (allleaves && allleaves.length === 0 && leavemasterleavecount) ||
      compensatoryleaves >= 0
    ) {
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()
      const currentmonth = currentDate.getMonth() + 1
      const leaveDate = formData.leaveDate
        ? new Date(formData.leaveDate)
        : new Date()
      const leaveYear = leaveDate.getFullYear()
      const privileagestartDate = new Date(user?.privilegeleavestartsfrom)
      const privileagestartYear = privileagestartDate.getFullYear()
      const privileagestartmonth = privileagestartDate.getMonth() + 1 // 1-based month
      const casualstartDate = new Date(user?.privilegeleavestartsfrom)
      const casualstartYear = casualstartDate.getFullYear()
      const casualstartmonth = casualstartDate.getMonth() + 1 // 1-based month
      const totalprivilegeLeave =
        leavemasterleavecount?.totalprivilegeLeave || 0
      const privilegePerMonth = totalprivilegeLeave / 12 // 1 or 2 per month
      const totalcasualLeave = leavemasterleavecount?.totalcasualleave || 0
      const casualPerMonth = totalcasualLeave / 12

      let ownedprivilegeCount = 0
      let ownedcasualCount = 0
      if (casualstartYear < currentYear) {
        let casualCount
        if (casualstartYear < leaveYear && leaveYear < currentYear) {
          casualCount = casualPerMonth
        } else if (casualstartYear < leaveYear) {
          casualCount = casualPerMonth
        } else if (casualstartYear === leaveYear) {
          casualCount = casualPerMonth
        }
        ownedcasualCount = casualCount
      } else if (casualstartYear === currentYear) {
        // If privilege started this year, give leaves from start month to current month
        if (currentmonth >= casualstartmonth) {
          ownedcasualCount = casualPerMonth
        } else {
          ownedcasualCount = 0
        }
      } else {
        ownedcasualCount = 0
      }
      if (privileagestartYear < currentYear) {
        let privilegeCount
        if (privileagestartYear < leaveYear && leaveYear < currentYear) {
          privilegeCount = 12 * privilegePerMonth
        } else if (privileagestartYear < leaveYear) {
          privilegeCount = currentmonth * privilegePerMonth
        } else if (privileagestartYear === leaveYear) {
          const monthsRemainingInStartYear = 12 - privileagestartmonth + 1 // Calculate remaining months including startMonth
          privilegeCount = monthsRemainingInStartYear * privilegePerMonth
        }
        ownedprivilegeCount = privilegeCount
      } else if (privileagestartYear === currentYear) {
        // If privilege started this year, give leaves from start month to current month
        if (currentmonth >= privileagestartmonth) {
          ownedprivilegeCount =
            (currentmonth - privileagestartmonth + 1) * privilegePerMonth
        } else {
          ownedprivilegeCount = 0 // Not eligible yet
        }
      } else {
        // If privilege starts in a future year, no leaves yet
        ownedprivilegeCount = 0
      }

      setBalanceprivilegeLeaveCount(ownedprivilegeCount)
      setBalancecasualLeaveCount(ownedcasualCount)
      setBalancecompensatoryLeaveCount(compensatoryleaves)
      setLeaveBalance({
        ...leaveBalance,
        casual: ownedcasualCount,
        privilege: ownedprivilegeCount,
        sick: BalancesickleaveCount,
        compensatory: compensatoryleaves
      })
    }
  }, [
    currentMonth,
    allleaves,
    leavemasterleavecount,
    formData,
    compensatoryleaves
  ])

  useEffect(() => {
    if (isOnsite) {
      setFormData((prev) => ({
        ...prev,
        onsite: true
      }))
    }
  }, [isOnsite])

  useEffect(() => {
    if (
      allleaves &&
      allleaves.length > 0 &&
      allOnsites &&
      allOnsites.length > 0
    ) {
      const events = [...allleaves, ...allOnsites]
      setEvents(events)
    } else if (
      (allleaves && allleaves.length > 0) ||
      (allOnsites && allOnsites.length > 0)
    ) {
      if (allleaves) {
        setEvents(allleaves)
      } else if (allOnsites) {
        setEvents(allOnsites)
      }
    }
  }, [allleaves, allOnsites])

  useEffect(() => {
    if (!showModal) {
      setIsOnsite(false)
    }
  }, [showModal])
  useEffect(() => {
    if (isOnsite && clickedDate) {
      // Find the event that matches the clicked date
      const existingEvent = events.filter((event) => {
        const eventDate = event?.onsiteDate
        if (!eventDate) return false
        return (
          event.onsiteDate.toString().split("T")[0] === clickedDate &&
          event.onsiteData
        )
      })

      // If a matching event is found and it has onsite data
      if (existingEvent && existingEvent.length > 0) {
        const matchedOnsiteData = existingEvent[0]?.onsiteData
          ?.flat()
          ?.map((status) => ({
            siteName: status.siteName,
            place: status.place,
            Start: status.Start,
            End: status.End,
            km: status.km,
            kmExpense: status.kmExpense,
            foodExpense: status.foodExpense
          }))

        // Now set the table rows with the matched onsite data and an empty row for new input
        setTableRows(matchedOnsiteData)
      }
    }
  }, [isOnsite, clickedDate])

  const addRow = () => {
    setTableRows([
      ...tableRows,
      {
        siteName: "",
        place: "",
        Start: "",
        End: "",
        km: "",
        kmExpense: "",
        foodExpense: ""
      }
    ])
  }
  const handledelete = async (data) => {
    try {
      setLoader(true)
      const payload = {
        ...(data.leaveType
          ? {
              leaveType: data.leaveType,
              reason: data.reason,
              leaveDate: data.leaveDate,
              leaveCategory: data.leaveCategory,
              prevCategory: formData.prevCategory
            }
          : {
              docId: data?.onsiteId,
              onsiteType: data.onsiteType,
              description: data.description,
              onsiteDate: data.onsiteDate
            })
      }
      const isLeave = "leaveType" in payload
      const isOnsite = "onsiteType" in payload
      let type = ""
      if (isLeave) {
        type = "leave"
        const response = await api.post(
          `/auth/deleteEvent?type=${type}&userid=${user._id}`,
          payload
        )
        const data = response?.data?.data

        if (response.status === 200) {
          setLoader(false)

          setAllleaves(data)
          setShowModal(false)
          setFormData({
            startDate: "",

            leaveType: "Full Day",
            onsiteType: "Full Day",

            halfDayPeriod: "",
            onsite: false,
            leaveCategory: "",
            reason: "",
            description: ""
          })
          setSelectedTab("Leave")
          toast.success(response.data.message)
        } else if (response.status === 201) {
          setLoader(false)
          setAllleaves(data)
          setAllleaves([])
          setShowModal(false)
          setSelectedTab("Leave")
          setFormData({
            startDate: "",

            leaveType: "Full Day",
            onsiteType: "Full Day",

            halfDayPeriod: "",
            onsite: false,
            leaveCategory: "",
            reason: "",
            description: ""
          })
          setSelectedTab("Leave")
          toast.success(response.data.message)
        }
      } else if (isOnsite) {
        type = "onsite"
        const response = await api.post(
          `/auth/deleteEvent?type=${type}&userid=${user._id}`,
          payload
        )
        const data = response.data.data
        if (response.status === 200) {
          setLoader(false)
          setMessage({ top: "", bottom: "" })
          setAllOnsite(data)
          refreshHook()
          refreshHookCompensatory()

          setTableRows([])
          setSelectedTab("Leave")
          setShowModal(false)
          setFormData({
            startDate: "",

            leaveType: "Full Day",
            onsiteType: "Full Day",

            halfDayPeriod: "",
            onsite: false,
            leaveCategory: "",
            reason: "",
            description: ""
          })
          setSelectedTab("Leave")
          toast.success(response.data.message)
        } else if (response.status === 201) {
          setLoader(false)
          setAllOnsite(data)
          setShowModal(false)
          setMessage({ top: "", bottom: "" })
          setAllOnsite([])
          setTableRows([])
          setFormData({
            startDate: "",

            leaveType: "Full Day",
            onsiteType: "Full Day",

            halfDayPeriod: "",
            onsite: false,
            leaveCategory: "",
            reason: "",
            description: ""
          })
          setSelectedTab("Leave")
          toast.success(response.data.message)
        }
      }
    } catch (error) {
      setLoader(false)
      setMessage((prev) => ({ ...prev, bottom: error.response.data.message }))
      console.log(error.response.data.message)
    }
  }

  const handleDateClick = (date) => {
    setclickedDate(date)
    const clickedDate = date
    const dayOfWeek = new Date(clickedDate).getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const isSunday = dayOfWeek === 0

    const isHoliday = monthlyHoly?.some((holiday) => {
      const formattedHolyDate = holiday.holyDate.split("T")[0] // Extract YYYY-MM-DD
      return formattedHolyDate === date
    })
    if (isHoliday || isSunday) {
      setcompensatoryLeave(true)
    }

    const existingEvent = events?.filter((event) => {
      const eventDate = event?.leaveDate // Normalize to YYYY-MM-DD

      if (!eventDate) return false
      return eventDate.toString().split("T")[0] === clickedDate // Compare only the date part
    })

    if (existingEvent && existingEvent.length > 0) {
      setFormData({
        ...formData,
        leaveDate: existingEvent[0]?.leaveDate.toString().split("T")[0],
        halfDayPeriod: existingEvent?.halfDayPeriod || "",
        leaveType: existingEvent?.leaveType || "Full Day",

        reason: existingEvent?.reason || ""
      })

      // Set the form data dynamically based on the relevant event
    } else {
      setFormData({
        ...formData,
        leaveDate: clickedDate,
        leaveType: "Full Day",
        reason: "",
        description: ""
      })
    }

    setShowModal(true)
  }

  // Check if a date is the currently selected date
  const isSelected = (date) => {
    return date.toDateString() === selectedDate.toDateString()
  }

  // Check if a date is today
  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // Navigate to previous month
  const prevMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  // Navigate to next month
  const nextMonth = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  // Go to current month
  const goToToday = () => {
    setCurrentDate(new Date())
  }
  const handleDataChange = (e) => {
    setMessage((prev) => ({
      ...prev,
      top: "",
      bottom: ""
    }))
    const { name, value } = e.target
    if (name === "onsiteDate") {
      const dayOfWeek = new Date(value).getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
      const isSunday = dayOfWeek === 0

      const isHoliday = monthlyHoly?.some((holiday) => {
        const formattedHolyDate = holiday.holyDate.split("T")[0] // Extract YYYY-MM-DD
        return formattedHolyDate === value
      })
      if (isHoliday || isSunday) {
        setcompensatoryLeave(true)
      } else {
        setcompensatoryLeave(false)
      }
    }
    // Access current values for leave type & category
    const selectedCategory =
      name === "leaveCategory" ? value : formData.leaveCategory

    // Define leave balances (you may already have these as props or state)
    const balances = {
      "casual Leave": BalancedcasualleaveCount,
      "privileage Leave": BalanceprivilegeleaveCount,
      "compensatory Leave": BalancecompensatoryleaveCount,
      "sick Leave": BalancesickleaveCount,
      "other Leave": 1
    }

    // Get selected balance
    const selectedBalance = balances[selectedCategory] ?? 0

    // Check if switching to Full Day requires >= 1 leave
    if (
      name === "leaveType" &&
      value === "Full Day" &&
      selectedCategory &&
      (edit && formData.prevCategory === selectedCategory
        ? selectedBalance + 0.5 < 1
        : selectedBalance < 1)
    ) {
      setMessage((prev) => ({
        ...prev,
        top: `You don't have enough ${selectedCategory} for a Full Day leave.`
      }))
      // setMessage(
      //   `You don't have enough ${selectedCategory} for a Full Day leave.`
      // )
      return
    }
    if (value === "Half Day") {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        halfDayPeriod: "Morning"
      }))
    } else {
      if (message) setMessage("")
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }))
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" })) // ✅ Clear error
    }
  }
  const handleTimeChange = (type, field, value) => {
    setselectedAttendance((prev) => {
      // Ensure the nested object exists for `type`
      const currentType = prev[type] || { hours: "", minutes: "", amPm: "" }

      return {
        ...prev,
        [type]: {
          ...currentType, // Preserve existing fields
          [field]: value // Update the specific field
        }
      }
    })
  }
  const handleSubmit = async (tab) => {
    try {
      if (tab === "New Leave" || tab === "Edit Leave") {
        const dayOfWeek = new Date(formData.leaveDate).getDay() // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const isSunday = dayOfWeek === 0

        const isHoliday = monthlyHoly?.some((holiday) => {
          const formattedHolyDate = holiday.holyDate.split("T")[0] // Extract YYYY-MM-DD
          return formattedHolyDate === formData.leaveDate
        })

        if (isSunday || isHoliday) {
          setMessage((prev) => ({
            ...prev,
            bottom: "It's a holiday—you can't request leave."
          }))
          return
        }
      }

      if (tab === "Leave" || tab === "New Leave" || tab === "Edit Leave") {
        // Validation
        let newErrors = {}
        if (!formData.leaveType) newErrors.leaveType = "Shift is required"
        if (formData.leaveType === "Half Day" && !formData.halfDayPeriod)
          newErrors.halfDayPeriod = "Please select Half Day period"
        if (!formData.leaveDate) newErrors.leaveDate = "Leave Date is required"
        if (!formData.leaveCategory)
          newErrors.leaveCategory = "Leave Type is required"
        if (!formData.reason) newErrors.reason = "Reason is required"
        if (Object.keys(newErrors).length > 0) {
          console.log(newErrors)
          setErrors(newErrors)
          return
        }
        let isApprovedLeave
        if (formData.leaveId) {
          isApprovedLeave = allleaves?.find((leave) => {
            const matchedid = leave._id === formData.leaveId

            return (
              matchedid && (leave.adminverified || leave.departmentverified)
            )
          })
        }

        if (isApprovedLeave) {
          setMessage((prev) => ({
            ...prev,
            bottom: "This leave is already approved. Do not make any changes."
          }))
        } else {
          setMessage({ top: "", bottom: "" })

          //Assuming you have an API endpoint for creating leave requests
          // const response = await fetch(
          //   `http://localhost:9000/api/auth/leave?selectedid=${user._id}&assignedto=${user.assignedto}`,
          //   {
          //     method: "POST",
          //     headers: {
          //       "Content-Type": "application/json"
          //     },
          //     body: JSON.stringify(formData),
          //     credentials: "include"
          //   }
          // )

          const response = await fetch(
            `https://www.crm.camet.in/api/auth/leave?selectedid=${user._id}&assignedto=${user.assignedto}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify(formData),
              credentials: "include"
            }
          )

          const responseData = await response.json()

          if (!response.ok) {
            throw new Error("Failed to apply for leave")
          } else {
            setLoader(false)
            setEdit(false)
            if (response.status === 200) {
              setSelectedTab("Leave")
              refreshHook()
              refreshHookCompensatory()

              setFormData({
                leaveDate: "",

                leaveType: "Full Day",
                onsiteType: "Full Day",

                halfDayPeriod: "Morning",
                onsite: false,
                leaveCategory: "",
                reason: "",
                description: ""
              })
              setErrors("")
              setShowModal(false)
              toast.success(responseData.message)
            } else if (response.status === 201) {
              setMessage((prev) => ({
                ...prev,
                bottom: responseData.message
              }))
            }
          }
        }
      } else if (tab === "New Onsite" || tab === "Edit Onsite") {
        // Validation
        let newErrors = {}
        if (!formData.onsiteType) newErrors.onsiteType = "Shift is required"
        if (formData.onsiteType === "Half Day" && !formData.halfDayPeriod)
          newErrors.halfDayPeriod = "Please select Half Day period"
        if (!formData.onsiteDate)
          newErrors.onsiteDate = "Onsite Date is required"
        if (tableRows.length === 0)
          newErrors.tabledataError = "Please add table data"
        if (!formData.description)
          newErrors.description = "Description is required"
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors)
          return
        }
        const formStartDate = new Date(formData.onsiteDate)

        // Find a leave matching the date (ignoring time) and adminverified or departmentverified is true
        const existingOnsite = allOnsites?.find((onsite) => {
          const onsiteDate = new Date(onsite.onsiteDate) // Convert leave.leaveDate to Date object
          // Compare the year, month, and day only (ignoring time)
          const isSameDate =
            onsiteDate.getFullYear() === formStartDate.getFullYear() &&
            onsiteDate.getMonth() === formStartDate.getMonth() &&
            onsiteDate.getDate() === formStartDate.getDate()

          // Check if adminverified or departmentverified is true
          return (
            isSameDate && (onsite.adminverified || onsite.departmentverified)
          )
        })

        if (existingOnsite) {
          setMessage(
            "This onsite is already approved. Do not make any changes."
          )
        } else {
          console.log(formData)

          setLoader(true)
          // const response = await api.post(
          //   `http://localhost:9000/api/auth/onsiteRegister?selectedid=${user._id}&assignedto=${user.assignedto}&compensatoryLeave=${isHaveCompensatoryleave}`,
          //   { formData, tableRows }
          // )

          const response = await api.post(
            `https://www.crm.camet.in/api/auth/onsiteRegister?selectedid=${user._id}&assignedto=${user.assignedto}&compensatoryLeave=${isHaveCompensatoryleave}`,
            { formData, tableRows }
          )

          if (response.status === 200) {
            setcompensatoryLeave(false)
            setLoader(false)
            toast.success("Onsite applied successfully")
            setSelectedTab("Leave")
            setFormData((prev) => ({
              ...prev,
              leaveDate: "",
              description: "",
              onsite: false,
              halfDayPeriod: "Morning",
              onsiteType: "Full Day",
              leaveType: "Full Day"
            }))
            setTableRows((prev) => [
              {
                ...prev,
                siteName: "",
                place: "",
                Start: "",
                End: "",
                km: "",
                kmExpense: "",
                foodExpense: ""
              }
            ])
            setShowModal(false)
            refreshHook()
            refreshHookOnsite()
            refreshHookCompensatory()
          } else if (response.status === 201) {
            setLoader(false)
            setMessage((prev) => ({
              ...prev,
              bottom: response.data.message
            }))
          }
        }
      }
    } catch (error) {
      setLoader(false)
      setMessage((prev) => ({
        ...prev,
        bottom: error?.response?.data?.message
      }))
      console.log("error:", error.message)
    }
  }
  const selectedTabContent = (value) => {
    let existingEvent
    switch (true) {
      case value === "Leave":
        existingEvent = events?.filter((event) => {
          const eventDate = event?.leaveDate
          if (!eventDate) return false
          return eventDate === clickedDate // Compare only the date part
        })
        if (existingEvent && existingEvent.length > 0) {
          setFormData({
            ...formData,
            leaveDate: existingEvent?.leaveDate,
            halfDayPeriod: existingEvent?.halfDayPeriod || "",
            leaveType: existingEvent?.leaveType || "",
            reason: existingEvent?.reason || "",
            onsite: false
          })
        } else {
          setFormData({
            ...formData,
            leaveDate: clickedDate,

            leaveType: "Full Day",
            reason: "",
            onsiteType: "",
            onsite: false
          })
        }

        // Handle the case where the fields are missing or falsy
        break

      case value === "Onsite":
        existingEvent = events?.filter((event) => {
          const eventDate = event?.onsiteDate
          if (!eventDate) return false
          return eventDate.toString().split("T")[0] === clickedDate // Compare only the date part
        })
        if (existingEvent && existingEvent.length > 0) {
          // Set the form data dynamically based on the relevant event
          setFormData({
            onsiteDate: existingEvent[0]?.onsiteDate.toString().split("T")[0],

            onsiteType: existingEvent[0]?.onsiteType || "",
            halfDayPeriod: existingEvent[0]?.halfDayPeriod || "",
            description: existingEvent[0]?.description || "",
            onsite: true
          })
        } else {
          setFormData({
            ...formData,
            onsiteDate: clickedDate,

            onsiteType: "Full Day",
            leaveType: "",
            description: "",
            onsite: true
          })
        }

        break

      default:
        console.log("Default case: None of the above conditions met.")
      // Handle other cases
    }
  }
  const renderContent = () => {
    switch (selectedTab) {
      case "Leave":
        return (
          <div className=" rounded-lg shadow-lg max-w-[380px]  min-w-[300px] z-40 border border-gray-300 overflow-hidden">
            {/* Leave Balance Section */}
            <div className="p-2">
              <h2 className="text-gray-600 font-semibold text-lg ">
                Leave Balance
              </h2>
              <p className="text-2xl font-bold text-gray-800">
                {BalanceprivilegeleaveCount +
                  BalancedcasualleaveCount +
                  BalancecompensatoryleaveCount}
                leaves
              </p>
              <div className="grid grid-cols-2 gap-1 border border-gray-300 rounded-lg p-2 bg-gray-50">
                <div className="font-semibold text-gray-700 text-left">
                  Category
                </div>
                <div className="font-semibold text-gray-700 text-right">
                  Balance
                </div>

                {Object.entries(leaveBalance).map(([category, balance]) => (
                  <React.Fragment key={category}>
                    <div className="capitalize text-gray-600 text-left">
                      {category} Leave
                    </div>
                    <div className="text-gray-600 text-right font-medium">
                      {balance}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300"></div>

            {/* Upcoming Leaves */}
            <div className="p-2 text-center">
              {currentmonthleaveData?.length > 0 && (
                <h2 className="text-gray-600 font-semibold text-sm mb-2">
                  Upcoming Leaves
                </h2>
              )}

              <div className="space-y-3 max-h-36 overflow-y-auto">
                {currentmonthleaveData?.length > 0 ? (
                  currentmonthleaveData.map((leave, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 border border-gray-300 p-3 rounded-lg shadow-sm hover:cursor-pointer"
                    >
                      {/* Date */}
                      <div className="text-gray-700 font-semibold w-24 text-sm">
                        {leave.leaveDate
                          .split("T")[0]
                          .split("-")
                          .reverse()
                          .join("-")}
                      </div>

                      {/* Full/Half Day & Category */}
                      <div className="flex flex-col text-gray-600">
                        <span className="text-sm">{leave?.leaveType}</span>
                        <span className="text-sm font-semibold">
                          {leave?.leaveCategory}
                        </span>
                      </div>

                      {/* Status: Oval Badge */}
                      <div
                        className={`px-3 py-1 text-sm rounded-full text-white ${
                          leave.departmentstatus === "Dept Approved" ||
                          leave.hrstatus === "HR/Onsite Approved"
                            ? "bg-green-500"
                            : leave.departmentstatus === "Not Approved" &&
                              leave.hrstatus === "Not Approved"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      >
                        {leave.departmentstatus === "Dept Approved" ||
                        leave.hrstatus === "HR/Onsite Approved"
                          ? "Approved"
                          : leave.departmentstatus === "Not Approved" &&
                            leave.hrstatus === "Not Approved"
                          ? "Pending"
                          : ""}
                      </div>

                      {/* Forward Arrow */}
                      <FaArrowRight
                        className=" ml-2 text-gray-500 cursor-pointer transition-transform duration-200 ease-in-out hover:scale-125"
                        onClick={() => {
                          setSelectedTab("Edit Leave")
                          setEdit(true)

                          setFormData({
                            leaveId: leave._id,
                            leaveDate: leave.leaveDate.toString().split("T")[0],
                            leaveType: leave.leaveType,
                            halfDayPeriod:
                              leave.leaveType === "Half Day"
                                ? leave.halfDayPeriod
                                : undefined,
                            leaveCategory: leave.leaveCategory,
                            prevCategory: leave.leaveCategory,
                            reason: leave.reason
                          })
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm italic text-center">
                    "No Upcoming Leaves"
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      case "Onsite":
        return (
          <div className="p-2  text-center border border-gray-300 rounded-lg min-w-[320px] max-w-[380px] ">
            {currentmonthonsiteData?.length > 0 && (
              <h2 className="text-gray-600 font-semibold text-sm mb-2">
                Upcoming Onsite
              </h2>
            )}

            <div className="space-y-3 max-h-96  min-h-36 overflow-y-auto">
              {currentmonthonsiteData?.length > 0 ? (
                [...currentmonthonsiteData]
                  .sort(
                    (a, b) => new Date(a.onsiteDate) - new Date(b.onsiteDate)
                  )
                  .map((onsite, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 border border-gray-300 p-3 rounded-lg shadow-sm hover:cursor-pointer"
                    >
                      {/* Date */}
                      <div className="text-gray-700 font-semibold w-24 text-sm">
                        {onsite.onsiteDate
                          .split("T")[0]
                          .split("-")
                          .reverse()
                          .join("-")}
                      </div>

                      {/* Full/Half Day & Category */}
                      <div className="flex flex-col text-gray-600">
                        <span className="text-sm">{onsite?.onsiteType}</span>
                        {/* <span className="text-sm font-semibold">
                          {leave?.leaveCategory}
                        </span> */}
                      </div>

                      {/* Status: Oval Badge */}
                      <div
                        className={`px-3 py-1 text-sm rounded-full text-white ${
                          onsite.departmentstatus === "Dept Approved" ||
                          onsite.hrstatus === "HR/Onsite Approved"
                            ? "bg-green-500"
                            : onsite.departmentstatus === "Not Approved" &&
                              onsite.hrstatus === "Not Approved"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                      >
                        {onsite.departmentstatus === "Dept Approved" ||
                        onsite.hrstatus === "HR/Onsite Approved"
                          ? "Approved"
                          : onsite.departmentstatus === "Not Approved" &&
                            onsite.hrstatus === "Not Approved"
                          ? "Pending"
                          : ""}
                      </div>

                      {/* Forward Arrow */}
                      <FaArrowRight
                        className="text-gray-500 cursor-pointer transition-transform duration-200 ease-in-out hover:scale-125"
                        onClick={() => {
                          setSelectedTab("Edit Onsite")
                          setEdit(true)

                          setFormData({
                            onsiteId: onsite._id,
                            onsiteDate: onsite.onsiteDate
                              .toString()
                              .split("T")[0],
                            onsiteType: onsite.onsiteType,
                            halfDayPeriod:
                              onsite.onsiteType === "Half Day"
                                ? onsite.halfDayPeriod
                                : undefined,

                            description: onsite.description
                          })
                          if (
                            onsite.onsiteData &&
                            onsite.onsiteData.length > 0
                          ) {
                            const matchedOnsiteData = onsite.onsiteData[0]
                              ?.flat()
                              ?.map((status) => ({
                                siteName: status.siteName,
                                place: status.place,
                                Start: status.Start,
                                End: status.End,
                                km: status.km,
                                kmExpense: status.kmExpense,
                                foodExpense: status.foodExpense
                              }))
                            // Now set the table rows with the matched onsite data and an empty row for new input
                            setTableRows(matchedOnsiteData)
                          }
                        }}
                      />
                    </div>
                  ))
              ) : (
                <p className="text-gray-500 text-sm italic text-center">
                  No Upcoming Onsites
                </p>
              )}
            </div>
          </div>
        )
      case "New Onsite":
      case "Edit Onsite":
        return (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <div>
                <label className="block mb-1">Onsite Date</label>
                <input
                  type="date"
                  name="onsiteDate"
                  defaultValue={formData.onsiteDate}
                  onChange={handleDataChange}
                  className="border p-2 rounded w-full"
                />
              </div>

              <div>
                <label className="block mb-1">Onsite Type</label>
                <select
                  name="onsiteType"
                  defaultValue={formData.onsiteType}
                  onChange={handleDataChange}
                  className="border p-2 rounded w-full"
                >
                  <option value="Full Day">Full Day</option>
                  <option value="Half Day">Half Day</option>
                </select>
              </div>
              {errors.onsiteType && (
                <p className="text-red-500">{errors.onsiteType}</p>
              )}
              {formData.onsiteType === "Half Day" && (
                <>
                  <div className="">
                    <label className="block mb-1">Select Half Day Period</label>
                    <select
                      name="halfDayPeriod"
                      defaultValue={formData.halfDayPeriod}
                      onChange={handleDataChange}
                      className="border p-2 rounded w-full appearance-none"
                    >
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                    </select>
                  </div>
                  {errors.halfDayPeriod && (
                    <p className="text-red-500">{errors.halfDayPeriod}</p>
                  )}
                </>
              )}
            </div>
            <div className="mb-4">
              <div className="overflow-x-auto overflow-y-auto ">
                <table className=" border border-gray-200 text-center w-full">
                  <thead className="text-sm overflow-x-auto">
                    <tr>
                      <th className="border px-2 py-1 min-w-[150px]">
                        Site Name
                      </th>
                      <th className="border px-2 py-1 min-w-[150px]">Place</th>
                      <th className="border px-2 py-1  min-w-[80px]">Start</th>
                      <th className="border px-2 py-1  min-w-[80px]">End</th>
                      <th className="border px-2 py-1 min-w-[80px] ">KM</th>
                      <th className="border px-2 py-1  min-w-[100px]">TA</th>
                      <th className="border px-2 py-1  min-w-[100px]">Food </th>
                      <th className="border px-2 py-1  min-w-[80px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows?.map((row, index) => (
                      <tr key={index}>
                        <td className="border p-1.5 ">
                          <input
                            type="text"
                            value={row.siteName}
                            onChange={(e) => {
                              const updatedRows = [...tableRows]
                              updatedRows[index].siteName = e.target.value
                              setTableRows(updatedRows)
                              setErrors((prev) => ({
                                ...prev,
                                tabledataError: ""
                              }))
                            }}
                            className="border p-1 rounded w-full"
                          />
                        </td>
                        <td className="border p-1.5 ">
                          <input
                            type="text"
                            value={row.place}
                            onChange={(e) => {
                              const updatedRows = [...tableRows]
                              updatedRows[index].place = e.target.value
                              setTableRows(updatedRows)
                              setErrors((prev) => ({
                                ...prev,
                                tabledataError: ""
                              }))
                            }}
                            className="border p-1 rounded "
                          />
                        </td>
                        <td className="border p-1.5">
                          <input
                            type="number"
                            value={row.Start}
                            onChange={(e) => {
                              const updatedRows = [...tableRows]
                              updatedRows[index].Start = e.target.value
                              setTableRows(updatedRows)
                              setErrors((prev) => ({
                                ...prev,
                                tabledataError: ""
                              }))
                            }}
                            className="border p-1 rounded w-full"
                          />
                        </td>
                        <td className="border p-1.5">
                          <input
                            type="number"
                            value={row.End}
                            onChange={(e) => {
                              const updatedRows = [...tableRows]
                              updatedRows[index].End = e.target.value
                              setTableRows(updatedRows)
                              setErrors((prev) => ({
                                ...prev,
                                tabledataError: ""
                              }))
                            }}
                            className="border p-1 rounded w-full"
                          />
                        </td>
                        <td className="border p-1.5">
                          <input
                            type="number"
                            value={row.km}
                            onChange={(e) => {
                              const updatedRows = [...tableRows]
                              updatedRows[index].km = e.target.value
                              setTableRows(updatedRows)
                              setErrors((prev) => ({
                                ...prev,
                                tabledataError: ""
                              }))
                            }}
                            className="border p-1 rounded w-full"
                          />
                        </td>
                        <td className="border p-1.5">
                          <input
                            type="number"
                            value={row.kmExpense}
                            onChange={(e) => {
                              const updatedRows = [...tableRows]
                              updatedRows[index].kmExpense = e.target.value
                              setTableRows(updatedRows)
                              setErrors((prev) => ({
                                ...prev,
                                tabledataError: ""
                              }))
                            }}
                            className="border p-1 rounded w-full"
                          />
                        </td>
                        <td className="border p-1.5 ">
                          <input
                            type="number"
                            value={row.foodExpense}
                            onChange={(e) => {
                              const updatedRows = [...tableRows]
                              updatedRows[index].foodExpense = e.target.value
                              setTableRows(updatedRows)
                              setErrors((prev) => ({
                                ...prev,
                                tabledataError: ""
                              }))
                            }}
                            className="border p-1 rounded w-full"
                          />
                        </td>
                        <td className="border p-1.5">
                          <button
                            onClick={() => {
                              const updatedRows = [...tableRows]
                              updatedRows.splice(index, 1)
                              setTableRows(updatedRows)
                            }}
                            className="text-red-500"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={addRow}
                className="mt-2 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Add Row
              </button>
            </div>
            {errors.tabledataError && (
              <p className="text-red-500">{errors.tabledataError}</p>
            )}
            <div className="mb-4">
              <label className="block mb-2">Description</label>
              <textarea
                name="description"
                defaultValue={formData?.description}
                onChange={handleDataChange}
                rows="4"
                className="border p-2 rounded w-full"
              ></textarea>
            </div>

            {errors.description && (
              <p className="text-red-500">{errors.description}</p>
            )}
            <div className="text-center text-red-700 ">
              <p>{message.bottom}</p>
            </div>
          </div>
        )
      case "New Leave":
      case "Edit Leave":
        return (
          <div className="bg-white rounded-lg shadow-lg max-w-[380px] min-w-[300px] z-40 border border-gray-100 px-5">
            <h2 className="text-xl font-semibold text-center">
              Leave Application
            </h2>
            <p className="mt-2 text-center text-red-600">{message.top}</p>
            <div className="mt-4">
              {/* Full Day / Half Day Selection */}
              <div className="flex gap-4">
                <label>
                  <input
                    name="leaveType"
                    type="radio"
                    value="Full Day"
                    checked={formData.leaveType === "Full Day"}
                    onChange={handleDataChange}
                  />
                  Full Day
                </label>
                <label>
                  <input
                    name="leaveType"
                    type="radio"
                    value="Half Day"
                    checked={formData.leaveType === "Half Day"}
                    onChange={handleDataChange}
                  />
                  Half Day
                </label>
                {errors.leaveType && (
                  <p className="text-red-500">{errors.leaveType}</p>
                )}
                {formData.leaveType === "Half Day" && (
                  <>
                    <select
                      name="halfDayPeriod"
                      className="border p-2 rounded w-auto"
                      value={formData?.halfDayPeriod}
                      // onChange={(e) => setLeaveOption(e.target.value)}
                      // onChange={(e) => {
                      //   setFormData((prev) => ({
                      //     ...prev,
                      //     halfDayPeriod: e.target.value // Replace newDate with the actual value you want to set
                      //   }))
                      // }}
                      onChange={handleDataChange}
                    >
                      <option value="">Select Period</option>
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                    </select>
                    {errors.halfDayPeriod && (
                      <p className="text-red-500">{errors.halfDayPeriod}</p>
                    )}
                  </>
                )}
              </div>
              {/* Leave Dates */}
              {formData.leaveType === "Full Day" ? (
                <>
                  <div className="mt-1 flex flex-col">
                    <label className="text-sm font-semibold">Leave Date</label>
                    <input
                      name="leaveDate"
                      type="date"
                      value={formData?.leaveDate}
                      onChange={handleDataChange}
                      className="border p-2 rounded"
                    />
                  </div>
                  {errors.leaveDate && (
                    <p className="text-red-500">{errors.leaveDate}</p>
                  )}
                </>
              ) : (
                <>
                  <div className="mt-1">
                    <label className="text-sm font-semibold">Leave Date</label>
                    <input
                      name="leaveDate"
                      type="date"
                      value={formData?.leaveDate}
                      onChange={handleDataChange}
                      className="border p-2 rounded w-full"
                    />
                  </div>
                  {errors.leaveDate && (
                    <p className="text-red-500">{errors.leaveDate}</p>
                  )}
                </>
              )}
              {/* Leave Type Dropdown */}
              <div className="mt-1 w-full">
                <label className="text-sm font-semibold">Leave Type</label>
                <select
                  name="leaveCategory"
                  className="border p-2 rounded w-full min-w-full"
                  value={formData?.leaveCategory || ""}
                  onChange={handleDataChange}
                >
                  <option value="">Select Leave Type</option>
                  {/* If the selected leave date is in the past, only show "Other Leave" */}
                  {pastDate ? (
                    <>
                      <option value="other Leave">Other Leave</option>
                      {formData.leaveCategory === "casual Leave" && (
                        <option value="casual Leave">Casual Leave</option>
                      )}
                      {formData.leaveCategory === "privileage Leave" && (
                        <option value="privileage Leave">
                          Privileage Leave
                        </option>
                      )}
                      {formData.leaveCategory === "compensatory Leave" && (
                        <option value="compensatory Leave">
                          Compensatory Leave
                        </option>
                      )}
                      {formData.leaveCategory === "sick Leave" && (
                        <option value="sick Leave">Sick Leave</option>
                      )}
                    </>
                  ) : (
                    <>
                      {((formData.leaveType === "Full Day" &&
                        BalancedcasualleaveCount >= 1) ||
                        (formData.leaveType === "Half Day" &&
                          BalancedcasualleaveCount >= 0.5) ||
                        formData.leaveCategory === "casual Leave") && (
                        <option value="casual Leave">Casual Leave</option>
                      )}
                      {((formData.leaveType === "Full Day" &&
                        BalanceprivilegeleaveCount >= 1) ||
                        (formData.leaveType === "Half Day" &&
                          BalanceprivilegeleaveCount >= 0.5) ||
                        formData.leaveCategory === "privileage Leave") && (
                        <option value="privileage Leave">
                          Privilege Leave
                        </option>
                      )}
                      {((formData.leaveType === "Full Day" &&
                        BalancecompensatoryleaveCount >= 1) ||
                        (formData.leaveType === "Half Day" &&
                          BalancecompensatoryleaveCount >= 0.5) ||
                        formData.leaveCategory === "compensatory Leave") && (
                        <option value="compensatory Leave">
                          Compensatory Leave
                        </option>
                      )}
                      {((formData.leaveType === "Full Day" &&
                        BalancesickleaveCount >= 1) ||
                        (formData.leaveType === "Half Day" &&
                          BalancesickleaveCount >= 0.5) ||
                        formData.leaveCategory === "sick Leave") && (
                        <option value="sick Leave">Sick Leave</option>
                      )}
                      <option value="other Leave">Other Leave</option>
                    </>
                  )}
                </select>
              </div>
              {errors.leaveCategory && (
                <p className="text-red-500">{errors.leaveCategory}</p>
              )}
              {/* Reason */}
              <div className="mt-1">
                <label className="text-sm font-semibold">Reason</label>
                <textarea
                  name="reason"
                  className="border p-2 rounded w-full"
                  rows="3"
                  placeholder="Enter reason"
                  value={formData?.reason}
                  onChange={handleDataChange}
                ></textarea>
              </div>
              {errors.reason && <p className="text-red-500">{errors.reason}</p>}
              <div className="text-center text-red-700 py-3">
                <p>{message.bottom}</p>
              </div>
                        
            </div>
          </div>
        )
      default:
        return <p>Select a tab to view the content.</p>
    }
  }
  return (
    <div className="w-full ">
      <div className="flex items-center justify-between sticky top-0 py-3 px-4 z-30 bg-white">
        <h2 className="text-xl font-semibold">{visibleMonth}</h2>
        <div className="flex space-x-2">
          {/* <div className="flex items-center gap-2">
            <span className="text-sm whitespace-nowrap">
             {ownFollowUp ? "Own FollowUp" : "Colleague FollowUp"}
            </span>
            <button
              onClick={() => setOwnCalander(!ownCalander)}
              className={`${
                ownCalender ? "bg-green-500" : "bg-gray-300"
              } w-11 h-6 flex items-center rounded-full transition-colors duration-300`}
            >
              <div
                className={`${
                  ownCalender ? "translate-x-5" : "translate-x-0"
                } w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300`}
              ></div>
            </button>
          </div>  */}
          <button
            onClick={prevMonth}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            <HiChevronLeft className="w-5 h-5" /> {/* Backward Icon */}
          </button>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Today
          </button>
          <button
            onClick={nextMonth}
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            <HiChevronRight className="w-5 h-5" /> {/* Forward Icon */}
          </button>
        </div>
      </div>

      <div className="overflow-y-auto border rounded-lg mx-4">
        {visibleDays.map((date, index) => (
          <div
            key={index}
            onClick={() => {
              setSelectedDate(date)
              handleDateClick(date.fullDate)
            }}
            className="flex justify-between items-center px-4 py-2 mb-2  cursor-pointer bg-gray-200"
          >
            <div className="">
              <div className=" flex-shrink-0 flex items-center justify-center rounded-full border mr-4 font-bold  text-sm sm:text-lg">
                {date.fullMonthDay}
              </div>
              <div>
                <div className="font-medium">
                  {new Date(date.fullDate).toLocaleString("default", {
                    weekday: "long"
                  })}
                </div>
              </div>
            </div>

            <div className="flex flex-col">
              {currentmonthleaveData?.length > 0
                ? currentmonthleaveData
                    .filter(
                      (leave) =>
                        new Date(leave.leaveDate)
                          .toISOString()
                          .split("T")[0] === date.fullDate
                    ) // Matching dates correctly
                    .map((leave, index) => (
                      <div
                        key={index}
                        className="flex  items-center justify-between hover:cursor-pointer  mb-1"
                      >
                        <div className="flex flex-col text-gray-600">
                          <span className="text-sm">{leave?.leaveType}</span>
                          <span className="text-sm font-semibold">
                            {leave?.leaveCategory}
                          </span>
                        </div>

                        <div
                          className={`px-3 ml-2 py-1 text-sm rounded-full text-white ${
                            leave.departmentstatus === "Dept Approved" ||
                            leave.hrstatus === "HR/Onsite Approved"
                              ? "bg-green-500"
                              : leave.departmentstatus === "Not Approved" &&
                                leave.hrstatus === "Not Approved"
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                        >
                          {leave.departmentstatus === "Dept Approved" ||
                          leave.hrstatus === "HR/Onsite Approved"
                            ? "Approved"
                            : leave.departmentstatus === "Not Approved" &&
                              leave.hrstatus === "Not Approved"
                            ? "Pending"
                            : ""}
                        </div>
                      </div>
                    ))
                : ""}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Popup */}
      {showModal && leaveBalance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center  z-50">
          <div
            className={` bg-white rounded-lg shadow-lg  sm:w-auto mx-4 max-h-[90vh] overflow-y-auto flex flex-col  ${
              selectedTab === "New Onsite" ? "md:w-3/4" : ""
            }`}
          >
            {loader && (
              <BarLoader
                cssOverride={{ width: "100%", height: "6px" }} // Tailwind's `h-4` corresponds to `16px`
                color="#4A90E2" // Change color as needed
                // loader={true}
              />
            )}
            <div className="p-3 w-full  ">
              {/* Tab Navigation */}
              <div className="flex justify-center space-x-4 ">
                {tabs?.map((tab) => (
                  <span
                    key={tab}
                    onClick={() => {
                      setSelectedTab(tab)
                      setMessage("")
                      selectedTabContent(tab)

                      setIsOnsite(tab === "Onsite")
                    }}
                    className={`cursor-pointer ${
                      selectedTab === tab
                        ? "text-blue-500 font-semibold underline"
                        : "text-black"
                    }`}
                  >
                    {tab}
                  </span>
                ))}
              </div>

              <div className="mt-2">
                <div>{renderContent()}</div>

                {selectedTab === "Leave" ? (
                  <div className=" flex justify-center mt-3 mb-3">
                    <button
                      className="bg-blue-800 rounded-lg px-4 py-1 text-white hover:bg-blue-700"
                      onClick={() => {
                        setSelectedTab("New Leave")
                        setFormData((prev) => ({
                          ...prev,
                          leaveType: "Full Day",
                          leaveCategory: "",
                          halfDayPeriod: "",
                          reason: ""
                        }))
                      }}
                    >
                      Apply New Leaves
                    </button>
                    <button
                      className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 ml-3"
                      onClick={() => {
                        setShowModal(false)
                        setcompensatoryLeave(false)
                        setEdit(false)
                        setFormData({
                          description: "",
                          onsite: false,
                          halfDayPeriod: "",
                          leaveType: "Full Day"
                        })

                        setSelectedTab("Leave")
                        setTableRows([])
                        setMessage("")
                        setErrors("")
                      }}
                    >
                      Close
                    </button>
                  </div>
                ) : selectedTab === "Edit Onsite" ||
                  selectedTab === "Edit Leave" ||
                  selectedTab === "New Leave" ||
                  selectedTab === "New Onsite" ? (
                  <div className="col-span-2 gap-4 flex justify-center mt-4 mb-3">
                    <button
                      className="bg-gradient-to-b from-blue-400 to-blue-500 px-3 py-1 hover:from-blue-400 hover:to-blue-600 text-white rounded"
                      onClick={() => handleSubmit(selectedTab)}
                    >
                      {selectedTab === "Edit Onsite" ||
                      selectedTab === "Edit Leave"
                        ? "Update"
                        : "Submit"}
                    </button>
                    <button
                      className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                      onClick={() => {
                        setShowModal(false)
                        setcompensatoryLeave(false)
                        setFormData({
                          description: "",
                          onsite: false,
                          halfDayPeriod: "",
                          leaveType: "Full Day"
                        })

                        setSelectedTab("Leave")
                        setTableRows([])
                        setMessage("")
                        setErrors("")
                      }}
                    >
                      Close
                    </button>
                    <button
                      className="bg-red-600 px-4 py-2 rounded-md text-white font-semibold shadow-lg hover:bg-red-700 active:shadow-md active:translate-y-[2px] transition-all duration-200"
                      onClick={() => handledelete(formData)}
                    >
                      Delete
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <button
                      onClick={() => {
                        setSelectedTab("New Onsite")
                        setFormData((prev) => ({
                          ...prev,
                          onsiteType: "Full Day",
                          halfDayPeriod: "",
                          description: ""
                        }))
                        setTableRows([])
                      }}
                      className="py-2 m-2 bg-blue-800 shadow-lg text-white rounded-lg px-2 hover:bg-blue-900"
                    >
                      Apply New Onsite
                    </button>
                    <button
                      className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
                      onClick={() => {
                        setShowModal(false)
                        setcompensatoryLeave(false)
                        setFormData({
                          description: "",
                          onsite: false,
                          halfDayPeriod: "",
                          leaveType: "Full Day"
                        })

                        setSelectedTab("Leave")
                        setTableRows([])
                        setMessage("")
                        setErrors("")
                      }}
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default LeaveApplication
