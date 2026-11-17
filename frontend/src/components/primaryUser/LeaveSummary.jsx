import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import BarLoader from "react-spinners/BarLoader"
import ResponsiveTable from "./ResponsiveTable"
import { CardSkeletonLoader } from "../common/CardSkeletonLoader"
import { PerformanceModal } from "./PerformanceModal"
import { StaticSidebar } from "./StaticSidebar"
import AdminHeader from "../../header/AdminHeader"
import StaffHeader from "../../header/StaffHeader"
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
  Search,
  X
} from "lucide-react"
import Modal from "./Modal"
import api from "../../api/api"
import BranchDropdown from "./BranchDropdown"
import UseFetch from "../../hooks/useFetch"
import { toast } from "react-toastify"
import { getLocalStorageItem } from "../../helper/localstorage"
import Select from "react-select"
const LeaveSummary = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [warningMessage, setWarningMessage] = useState("")
  const [newattende, setnewattendee] = useState([])
  const [selectedName, setSelectedName] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [userBranches, setuserBranches] = useState([])
const [activeUserId, setActiveUserId] = useState(null)
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1 // JavaScript months are 0-based, so adding 1
  const [selectedStaff, setselectedStaff] = useState("")
const now=new Date()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)
  const [formData, setFormData] = useState({})
  const [selectedDate, setselectedDate] = useState(null)
  const [type, setType] = useState("")
  const [user, setUser] = useState(null)
  const [holiday, setHoly] = useState(null)
  const [currentmonthSundays, setCurrentmonthSundays] = useState(null)
  const [selectedBranch, setselectedBranch] = useState(null)
  const [selectedCompanyBranch, setselectedCompanyBranch] = useState(null)
  const [leavesummaryList, setleaveSummary] = useState([])

  const [selectedUserName, setselecteduserName] = useState(null)
  const [selectedCategory, setselectedCategory] = useState(null)
  const [selectedDatapopup, setselectedDataPopup] = useState({})
  // const [selectedYear, setSelectedYear] = useState(null)
  const [periodMode, setperiodMode] = useState("all")
  const [targetData, settargetData] = useState([])
  console.log(targetData)
  const [openModal, setOpenModal] = useState(false)
  const [productlist, setproductList] = useState([])
  const [achievedproducts, setacheivedProducts] = useState([])
  const [selectedPeriod, setselectedPeriod] = useState("")
  const listRef = useRef(null)
  const isFirstRender = useRef(true)

  const leaveSummaryUrl = useMemo(() => {
    const params = new URLSearchParams({
      year: String(selectedYear),
      month: String(selectedMonth)
    })

    if (selectedBranch && selectedBranch !== "All") {
      params.set("selectedBranch", selectedBranch)
    }

    return `/auth/getsomeall?${params.toString()}`
  }, [selectedYear, selectedMonth, selectedBranch])

  // Fetch only the active branch when one is selected.
  const {
    data,

    loading
  } = UseFetch(leaveSummaryUrl)
  console.log(data)
  const { data: branchProduct } = UseFetch(
    `/product/getallbranchProduct?branch=${selectedCompanyBranch}`
  )
const aaa=data?.staffAttendanceStats?.filter((item)=>item?.name==="Muhammed Rasik K.M")
console.log(aaa)
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
    const userData = getLocalStorageItem("user")
    if (userData.selected && userData.selected.length > 1) {
      setselectedBranch("All")
    } else {
      setselectedBranch(userData.selected[0]?.branch_id)
    }
    // setselectedBranch(userData.selected[0].branch_id)
    userData.selected.forEach((branch) => {
      setuserBranches((prev) => [
        ...prev,
        {
          id: branch.branch_id,
          branchName: branch.branchName
        }
      ])
    })
    console.log(userData.selected[0].branch_id)
    setselectedCompanyBranch(userData?.selected[0].branch_id)
    setUser(userData)
  }, [])
  useEffect(() => {
    if (data) {
      const { staffAttendanceStats, listofHolidays, sundayFulldate } = data
      console.log(staffAttendanceStats)
      const a = staffAttendanceStats.filter(
        (item) => item.name === "Fathima Nazrin CM"
      )
      console.log(a)
      setnewattendee(staffAttendanceStats)
      setHoly(listofHolidays)
      setCurrentmonthSundays(sundayFulldate)
      setleaveSummary(
        filterAttendance(staffAttendanceStats, searchTerm, selectedBranch, user)
      )
    }
  }, [data, searchTerm])
  useEffect(() => {
    if (isFirstRender.current) {
      // 🚀 Skip first render
      isFirstRender.current = false
      return
    }
    if (newattende && newattende.length > 0) {
      setleaveSummary(
        filterAttendance(newattende, searchTerm, selectedBranch, user)
      )
    }
  }, [selectedBranch])

  // Restore scroll position after render
  useEffect(() => {
    const storedScrollPosition = sessionStorage.getItem("scrollPosition")
    if (storedScrollPosition && listRef.current) {
      listRef.current.scrollTop = parseInt(storedScrollPosition, 10)
      // sessionStorage.removeItem("scrollPosition") // Optional: Clear after restoring
    }
  }, [selectedName]) // Restore when selectedIndex changes
  const filterAttendance = (attendance, searchTerm, selectedBranch, user) => {
    let filtered = attendance
    // Role based filtering
    if (user.role === "Admin") {
      if (searchTerm) {
        filtered = filtered.filter((staff) =>
          staff.name.toLowerCase().startsWith(searchTerm.toLowerCase())
        )
      }
    } else {
      filtered = filtered.filter(
        (staff) => staff.userId === user._id || staff.assignedto === user._id
      )

      if (searchTerm) {
        filtered = filtered.filter((staff) =>
          staff.name.toLowerCase().startsWith(searchTerm.toLowerCase())
        )
      }
    }

    // Branch filtering
    if (selectedBranch !== "All") {
      filtered = filtered.filter((staff) =>
        staff.branches.some((b) => b.branch_id === selectedBranch)
      )
    }

    return filtered
  }

  const handleBranchChange = (e) => {
    setselectedBranch(e)
  }

  const years = Array.from({ length: 10 }, (_, i) => currentYear - i)
  const months = [
    { name: "January", value: 1 },
    { name: "February", value: 2 },
    { name: "March", value: 3 },
    { name: "April", value: 4 },
    { name: "May", value: 5 },
    { name: "June", value: 6 },
    { name: "July", value: 7 },
    { name: "August", value: 8 },
    { name: "September", value: 9 },
    { name: "October", value: 10 },
    { name: "November", value: 11 },
    { name: "December", value: 12 }
  ]
  const periodSelectStyles = useMemo(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: "40px",
        borderRadius: "10px",
        borderColor: state.isFocused ? "#2563eb" : "#cbd5e1",
        backgroundColor: "#ffffff",
        boxShadow: state.isFocused ? "0 0 0 3px rgba(37, 99, 235, 0.14)" : "0 1px 2px rgba(15, 23, 42, 0.04)",
        cursor: "pointer",
        "&:hover": { borderColor: state.isFocused ? "#2563eb" : "#94a3b8" }
      }),
      valueContainer: (base) => ({ ...base, padding: "0 10px" }),
      singleValue: (base) => ({ ...base, color: "#1e293b", fontSize: "13px", fontWeight: 600 }),
      indicatorSeparator: () => ({ display: "none" }),
      dropdownIndicator: (base) => ({ ...base, color: "#475569", padding: "7px" }),
      menuPortal: (base) => ({ ...base, zIndex: 80 }),
      menu: (base) => ({ ...base, marginTop: "6px", borderRadius: "10px", overflow: "hidden", border: "1px solid #dbe5f1", boxShadow: "0 14px 30px rgba(15, 23, 42, 0.16)" }),
      menuList: (base) => ({ ...base, maxHeight: "220px", padding: "4px" }),
      option: (base, state) => ({ ...base, borderRadius: "7px", margin: "1px 0", padding: "8px 10px", fontSize: "13px", fontWeight: state.isSelected ? 600 : 500, backgroundColor: state.isSelected ? "#2563eb" : state.isFocused ? "#eff6ff" : "white", color: state.isSelected ? "#ffffff" : "#334155", cursor: "pointer" })
    }),
    []
  )
  const yearOptions = years.map((year) => ({ value: year, label: String(year) }))
  const monthOptions = months.map((month) => ({ value: month.value, label: month.name }))
  const selectedUser = (attendeeid) => {
    const filteredAttendance = newattende.filter((id) => {
      return id.userId === attendeeid
    })
    setselectedStaff(filteredAttendance)
  }
  // Handle onsite type change

  const handleAttendance = useCallback((date, type, inTime, outTime) => {
    setModalOpen(true)
    setselectedDate(date)
    setType(type)
    if (type === "Attendance") {
      setFormData({
        attendanceDate: date,
        inTime,
        outTime
      })
    }
  }, [])
  const handleSelectAttendee = (attendee) => {
    if (listRef.current) {
      sessionStorage.setItem("scrollPosition", listRef.current.scrollTop)
    }

    setSelectedName(selectedName === attendee.name ? null : attendee.name)
    if (selectedName === attendee.name) {
      setselectedStaff("")
    } else {
      selectedUser(attendee.userId)
    }

    setFormData(
      Object.fromEntries(Object.keys(formData).map((key) => [key, ""]))
    )
  }
  const handleOnsite = (date, type, onsiteType, halfDayperiod, description) => {
    setModalOpen(true)

    setselectedDate(date)
    setType(type)
    if (type === "Onsite") {
      setFormData({
        onsiteDate: date,
        onsiteType: onsiteType,
        halfDayPeriod: halfDayperiod ? halfDayperiod : null,
        description
      })
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
    console.log(user?._id)
  
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
  const handleLeave = (
    date,
    type,

    leaveData,
    leavetype
  ) => {
    console.log(leaveData)
    // Find the matching leave entry
    const matchingLeave = Object.values(leaveData).find(
      (entry) => entry.leaveCategory === leavetype
    )

    setModalOpen(true)
    setselectedDate(date)
    setType(type)

    if (type === "Leave" && matchingLeave) {
      setFormData({
        leaveId: matchingLeave._id,
        leaveDate: matchingLeave.leaveDate,
        reason: matchingLeave.reason,
        leaveCategory: matchingLeave.leaveCategory,
        prevCategory: matchingLeave.leaveCategory,
        leaveType: matchingLeave.leaveType,

        halfDayPeriod: matchingLeave.halfDayPeriod
          ? matchingLeave.halfDayPeriod
          : null
      })
    } else {
      setFormData({ leaveDate: date, leaveType: "Full Day" })
    }
  }

  const handleScroll = (event) => {
    const tables = document.querySelectorAll(".scroll-container")
    tables.forEach((table) => {
      table.scrollLeft = event.target.scrollLeft
    })
  }
  const handleClose = (setMessage) => {
    setModalOpen(false)
    setMessage("")
  }

  const handleApply = async (staffId, selected, setIsApplying, type) => {
    console.log("adddd")
    console.log(type)

    try {
      if (type === "Leave") {
        const matchedStaff = leavesummaryList.find(
          (staff) => staff.userId === staffId
        )
        const assignedTo = matchedStaff ? matchedStaff.assignedto : null
        const response = await api.post(
          `/auth/editLeave?userid=${staffId}&assignedto=${assignedTo}`,
          selected
        )

        const data = response?.data?.data?.data
        const holy = response?.data?.data?.fulldateholiday
        if (response.status === 200) {
          toast.success("leave edited sucessfully")
          setleaveSummary(data)
          setHoly(holy)
          setIsApplying(false)
          handleClose()
        } else if (response.status === 201) {
          setWarningMessage(response.data.message)
          setIsApplying(false)
        } else {
          toast.error("error in updating")
        }
      } else if (type === "Attendance") {
        const matchedStaff = leavesummaryList.find(
          (staff) => staff.userId === staffId
        )
        const attendanceid = matchedStaff ? matchedStaff.attendanceId : null
        const response = await api.post(
          `/auth/editAttendance?userid=${staffId}&attendanceid=${attendanceid}`,
          selected
        )
        const data = response.data.data.data
        const holy = response.data.data.fulldateholiday

        if (response.status === 200) {
          toast.success("Attendance edited sucessfully")
          setleaveSummary(data)
          setHoly(holy)
          setIsApplying(false)
          handleClose()
        } else {
          toast.error("error in updating")
        }
      } else if (type === "Onsite") {
console.log(selected)
console.log(staffId)
        const response = await api.post(
          `/auth/editOnsite?userid=${staffId}`,
          selected
        )
        const data = response.data.data.data
        const holy = response.data.data.fulldateholiday
        if (response.status === 200) {
          toast.success("Onsite edited successfully")
          setleaveSummary(data)
          setHoly(holy)
          setIsApplying(false)
          handleClose()
        }
      }
    } catch (error) {
      console.log(error.response.data.message)
      toast.error(error.response.data.message)
    }
  }

  const handleDownload = (data) => {
    // Using ExcelJS instead of XLSX for better styling control
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Attendance")

    // Define column structure with widths
    worksheet.columns = [
      { header: "Employ_Name", key: "name", width: 25 },
      { header: "EMP_ID", key: "staffId", width: 15 },
      { header: "Casual_Leave", key: "casualLeave", width: 15 },
      { header: "Privilege_Leave", key: "privLeave", width: 15 },
      { header: "Comp_Leave", key: "compLeave", width: 15 },
      { header: "Other_Leave", key: "otherLeave", width: 15 },
      { header: "Late_Cutting", key: "lateCutting", width: 15 },
      { header: "lateOrEarlyCount", key: "lateEarlyCount", width: 15 },
      { header: "Total Present", key: "totalPresent", width: 15 }
    ]

    // Style the header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF0000" } // Light grey background
      }
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } } // Black bold text
      cell.alignment = { horizontal: "center", vertical: "middle" }
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      }
    })

    // Process and add data
    let dataToProcess = []

    if (user?.role === "Staff") {
      dataToProcess = newattende.filter(
        (item) => item.userId === user?._id || item?.assignedto === user._id
      )
    } else if (user?.role === "Admin") {
      dataToProcess = data
    }

    // Add data rows
    dataToProcess.forEach((user) => {
      let casualLeave = 0,
        privilegeLeave = 0,
        compensatoryLeave = 0,
        otherLeave = 0

      Object.values(user.attendancedates).forEach((details) => {
        casualLeave += details.casualLeave || 0
        privilegeLeave += details.privilegeLeave || 0
        compensatoryLeave += details.compensatoryLeave || 0
        otherLeave += details.otherLeave || 0
      })

      const totalEarlyOrLateCount = user.late + user.earlyGoing || 0

      const row = worksheet.addRow({
        name: user.name,
        staffId: user.staffId,
        casualLeave: casualLeave,
        privLeave: privilegeLeave,
        compLeave: compensatoryLeave,
        otherLeave: otherLeave,
        lateCutting: user.latecutting,
        lateEarlyCount: totalEarlyOrLateCount,
        totalPresent: user.present
      })

      // Style data cells
      row.eachCell((cell, colNumber) => {
        // Center-align all cells except the name column (first column)
        if (colNumber > 1) {
          cell.alignment = { horizontal: "center", vertical: "middle" }
        }

        // Add borders to all cells
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        }

        // Apply zebra striping for better readability
        if (row.number % 2 === 0) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFAFAFA" } // Very light grey for even rows
          }
        }
      })
    })

    // Write to buffer and download
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      })
      saveAs(blob, "Attendance_Report.xlsx")
    })
  }
  return (
    // <div className="h-full bg-[#ADD8E6] overflow-hidden">
    //   <div className="flex h-full flex-row">
    //     <StaticSidebar
    //       handleMoreClick={handleMoreClick}
    //       selectedCompanyBranch={selectedCompanyBranch}
    //       setselectedCompanyBranch={setselectedCompanyBranch}
    //       parenttargetData={settargetData}
    //       parentperiodmode={setperiodMode}
    //       parentyear={setSelectedYear}
    //       setselectedPeriod={setselectedPeriod}
    //     />
    //     <div className="flex flex-1 flex-col overflow-hidden">
    //       <header className="flex items-center justify-between border-b border-white/10 bg-[#0F172A]/95">
    //         {user?.role?.toLowerCase() === "admin" ? (
    //           <AdminHeader hide={true} />
    //         ) : (
    //           <StaffHeader hide={true} />
    //         )}

    //         <div className="flex items-center gap-1.5  border-b border-white/10 bg-[#0F172A]/95 pr-3 h-full">
    //           <button className="rounded-full p-1.5 transition bg-slate-100">
    //             <Mail size={15} strokeWidth={2.2} />
    //           </button>
    //           <div className="relative">
    //             <button className="rounded-full p-1.5 transition bg-slate-100">
    //               <MessageSquareText size={15} strokeWidth={2.2} />
    //             </button>
    //             <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
    //           </div>
    //           <button className="rounded-full p-1.5 transition bg-slate-100">
    //             <Settings size={15} strokeWidth={2.2} />
    //           </button>
    //           {/* <button className="rounded-full p-1.5 transition bg-slate-100">
    //             <User size={15} strokeWidth={2.2} />
    //           </button> */}

    //           <div className="relative">
    //             <button
    //               onClick={(e) => {
    //                 e.stopPropagation()
    //                 setShowUserMenu((prev) => !prev)
    //               }}
    //               className="rounded-full p-1.5 transition bg-slate-100"
    //             >
    //               <User size={15} strokeWidth={2.2} />
    //             </button>

    //             {/* {showUserMenu && (
    //               <div
    //                 onClick={(e) => e.stopPropagation()}
    //                 className="absolute right-0 mt-2 w-32 bg-white border border-slate-200 rounded-md shadow-lg z-50"
    //               >
    //                 <button
    //                   onClick={handleLogout}
    //                   className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
    //                 >
    //                   Logout
    //                 </button>
    //               </div>
    //             )} */}
    //           </div>
    //         </div>
    //       </header>
    //       {loading && (
    //         <BarLoader
    //           cssOverride={{ width: "100%", height: "4px" }} // Tailwind's `h-4` corresponds to `16px`
    //           color="#4A90E2" // Change color as needed
    //         />
    //       )}
    //       <div className="flex flex-col flex-1 bg-[#ADD8E6]">
    //         <div className=" text-center">
    //           <h1 className=" sm:text-md md:text-2xl font-bold mb-1">
    //             User Leave Summary
    //           </h1>
    //           <div className="grid grid-cols-2 md:flex md:flex-row md:items-center md:justify-end gap-2 md:gap-4 mb-3 md:mr-8 mx-5">
    //             {leavesummaryList && leavesummaryList.length > 0 && (
    //               // If more than one leave summary exists,
    //               // it means the logged-in user is a manager/super manager
    //               // and has staff under them. Show branch dropdown in this case.
    //               <BranchDropdown
    //                 branches={userBranches}
    //                 onBranchChange={handleBranchChange}
    //                 branchSelected={selectedBranch}
    //               />
    //             )}

    //             {/* Search Input */}
    //             <div className="w-full md:w-auto">
    //               <input
    //                 value={
    //                   selectedStaff !== "" ? selectedStaff[0]?.name : searchTerm
    //                 }
    //                 onChange={(e) => {
    //                   if (selectedStaff !== "") {
    //                     setSelectedName(null)
    //                     setselectedStaff("") // Clear selected staff
    //                   }
    //                   setSearchTerm(e.target.value)
    //                 }}
    //                 placeholder="Search..."
    //                 className="appearance-none border border-gray-400 rounded px-3 py-2 w-full md:w-auto bg-white text-sm placeholder-gray-400 text-gray-700 focus:outline-none"
    //               />
    //             </div>

    //             {/* Download Button */}
    //             <button
    //               className="bg-blue-600 rounded px-3 py-2 text-white text-sm"
    //               onClick={() => handleDownload(newattende)}
    //             >
    //               Download to Excel
    //             </button>

    //             {/* Year Select */}
    //             <select
    //               value={selectedYear}
    //               onChange={(e) => setSelectedYear(Number(e.target.value))}
    //               className="border p-2 rounded w-full md:w-auto"
    //             >
    //               {years.map((year) => (
    //                 <option key={year} value={year}>
    //                   {year}
    //                 </option>
    //               ))}
    //             </select>

    //             {/* Month Select */}
    //             <select
    //               value={selectedMonth}
    //               onChange={(e) => setSelectedMonth(Number(e.target.value))}
    //               className="border p-2 rounded w-full md:w-auto"
    //             >
    //               {months.map((month) => (
    //                 <option key={month.value} value={month.value}>
    //                   {month.name}
    //                 </option>
    //               ))}
    //             </select>
    //           </div>
    //         </div>
    //         {/* Main Content */}
    //         {loading ? (
    //           <CardSkeletonLoader count={5} />
    //         ) : (
    //           <>
    //             <div className="flex-1 flex flex-col overflow-y-auto mx-4 mb-4  shadow-xl rounded-lg">
    //               {leavesummaryList && leavesummaryList.length > 0 ? (
    //                 leavesummaryList?.map((attendee, index) => (
    //                   <div key={index}>
    //                     {selectedName === null ||
    //                     selectedName === attendee.name ? (
    //                       <div
    //                         ref={listRef}
    //                         // className={`${
    //                         //   selectedName === attendee.name && !modalOpen
    //                         //     ? "sticky top-0 z-20 "
    //                         //     : ""
    //                         // }`}
    //                       >
    //                         <div
    //                           className={` md:h-20 md:mr-4 shadow-lg rounded-lg w-full border cursor-pointer
    //                   ${
    //                     selectedName === attendee.name
    //                       ? "bg-gray-200 sticky top-0 z-40"
    //                       : "bg-gray-200 mb-2"
    //                   }`}
    //                           onClick={() => handleSelectAttendee(attendee)}
    //                         >
    //                           <div className="md:flex w-full">
    //                             <div className=" text-sm md:text-md font-semibold text-gray-800 w-full  md:w-[225px] p-2">
    //                               {attendee.name}
    //                             </div>
    //                             <div className="w-full overflow-x-auto">
    //                               <table className="w-full ">
    //                                 <thead className="bg-gray-200 text-gray-800">
    //                                   <tr>
    //                                     {[
    //                                       "Present",
    //                                       "Leave",
    //                                       "Late Cutting",
    //                                       "Not Marked",
    //                                       "Onsite"
    //                                     ].map((label, idx) => (
    //                                       <th
    //                                         key={idx}
    //                                         className="s py-1 text-gray-800 text-sm font-medium text-center min-w-[100px]"
    //                                       >
    //                                         {label}
    //                                       </th>
    //                                     ))}
    //                                   </tr>
    //                                 </thead>
    //                                 <tbody>
    //                                   <tr className="bg-gray-200 text-gray-800">
    //                                     {[
    //                                       attendee.present,
    //                                       attendee.absent,
    //                                       attendee.latecutting,
    //                                       attendee.notMarked,
    //                                       attendee.onsite
    //                                     ].map((value, idx) => (
    //                                       <td
    //                                         key={idx}
    //                                         className="px-4 py-2 text-lg font-semibold text-center "
    //                                       >
    //                                         {value}
    //                                       </td>
    //                                     ))}
    //                                   </tr>
    //                                 </tbody>
    //                               </table>
    //                             </div>
    //                           </div>
    //                         </div>
    //                         {selectedName === attendee.name &&
    //                           currentmonthSundays &&
    //                           holiday && (
    //                             <div className="flex-1  ">
    //                               <ResponsiveTable
    //                                 attendee={attendee}
    //                                 user={user}
    //                                 handleAttendance={handleAttendance}
    //                                 handleOnsite={handleOnsite}
    //                                 handleLeave={handleLeave}
    //                                 handleScroll={handleScroll}
    //                                 modalOpen={modalOpen}
    //                                 sundays={currentmonthSundays}
    //                                 holiday={holiday}
    //                               />
    //                             </div>
    //                           )}
    //                       </div>
    //                     ) : null}
    //                   </div>
    //                 ))
    //               ) : (
    //                 <div className="text-blue-500 text-center">
    //                   {loading ? "" : "Oops! No staff found."}
    //                 </div>
    //               )}
    //             </div>
    //           </>
    //         )}
    //       </div>
    //     </div>
    //   </div>

    //   {/* Header Section */}

    //   {modalOpen && (
    //     <Modal
    //       type={type}
    //       onClose={handleClose}
    //       selectedDate={selectedDate}
    //       isOpen={modalOpen}
    //       formData={formData}
    //       staffId={selectedStaff[0]?.userId}
    //       assignedto={selectedStaff[0]?.assignedto}
    //       staffName={selectedStaff[0]?.name}
    //       casualleavestartsfrom={selectedStaff[0]?.casualleavestartsfrom}
    //       sickleavestartsfrom={selectedStaff[0]?.sickleavestartsfrom}
    //       privilegeleavestartsfrom={selectedStaff[0]?.privilegeleavestartsfrom}
    //       handleApply={handleApply}
    //       errorMessage={warningMessage}
    //       setErrorMessage={setWarningMessage}
    //     />
    //   )}
    // </div>
    <div className="h-[calc(100dvh-64px)] min-h-0 overflow-hidden bg-[#ADD8E6]">
      <div className="flex h-full min-h-0 flex-row overflow-hidden">
        {/* <StaticSidebar
          handleMoreClick={handleMoreClick}
          selectedCompanyBranch={selectedCompanyBranch}
          setselectedCompanyBranch={setselectedCompanyBranch}
          parenttargetData={settargetData}
          parentperiodmode={periodMode}
          parentyear={selectedYear}
          setselectedPeriod={setselectedPeriod}
        /> */}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {/* <header className="flex items-center justify-between bg-[#ADD8E6]">
            {user?.role?.toLowerCase() === "admin" ? (
              <AdminHeader hide={true} />
            ) : (
              <StaffHeader hide={true} />
            )}

            <div className="flex h-full items-center gap-1.5 bg-[#ADD8E6] pr-3">
              <button className="rounded-full bg-slate-100 p-1.5 transition">
                <Mail size={15} strokeWidth={2.2} />
              </button>

              <div className="relative">
                <button className="rounded-full bg-slate-100 p-1.5 transition">
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
                    setShowUserMenu((prev) => !prev)
                  }}
                  className="rounded-full bg-slate-100 p-1.5 transition"
                >
                  <User size={15} strokeWidth={2.2} />
                </button>

              
              </div>
            </div>
          </header> */}

          {loading && (
            <BarLoader
              cssOverride={{ width: "100%", height: "4px" }}
              color="#4A90E2"
            />
          )}

          <div className="flex flex-1 min-h-0 flex-col bg-[#ADD8E6]">
            <div className="shrink-0 px-3 pb-3 pt-2 text-center sm:px-5 sm:pt-3">
              <h1 className="mb-2 text-lg font-bold leading-tight text-slate-900 md:text-xl">
                User Leave Summary
              </h1>

              <div className="mx-auto flex max-w-6xl flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:flex-nowrap lg:justify-end">
                {leavesummaryList && leavesummaryList.length > 0 && (
                  <BranchDropdown
                    branches={userBranches}
                    onBranchChange={handleBranchChange}
                    branchSelected={selectedBranch}
                  />
                )}

                <div className="relative w-full sm:w-56">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    value={
                      selectedStaff !== "" ? selectedStaff[0]?.name : searchTerm
                    }
                    onChange={(e) => {
                      if (selectedStaff !== "") {
                        setSelectedName(null)
                        setselectedStaff("")
                      }
                      setSearchTerm(e.target.value)
                    }}
                    placeholder="Search staff..."
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm font-medium text-slate-700 shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-400 hover:border-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <button
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
                  onClick={() => handleDownload(newattende)}
                >
                  Download to Excel
                </button>

                <div className="w-full sm:w-28">
                  <Select
                    aria-label="Select year"
                    classNamePrefix="leave-period-select"
                    options={yearOptions}
                    value={yearOptions.find((option) => option.value === selectedYear) || null}
                    onChange={(option) => setSelectedYear(Number(option?.value || currentYear))}
                    styles={periodSelectStyles}
                    isSearchable={false}
                    menuPortalTarget={document.body}
                    menuShouldScrollIntoView={false}
                  />
                </div>

                <div className="w-full sm:w-40">
                  <Select
                    aria-label="Select month"
                    classNamePrefix="leave-period-select"
                    options={monthOptions}
                    value={monthOptions.find((option) => option.value === selectedMonth) || null}
                    onChange={(option) => setSelectedMonth(Number(option?.value || currentMonth))}
                    styles={periodSelectStyles}
                    isSearchable={false}
                    menuPortalTarget={document.body}
                    menuShouldScrollIntoView={false}
                  />
                </div>
              </div>
            </div>

            {loading ? (
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                <CardSkeletonLoader count={5} />
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-hidden">
                <div className={`h-full min-h-0 min-w-0 px-3 pb-3 sm:px-4 ${selectedName ? "overflow-hidden" : "overflow-y-auto"}`}>
                  <div className={`min-w-0 rounded-xl shadow-sm ${selectedName ? "flex h-full min-h-0 flex-col overflow-hidden" : ""}`}>
                    {leavesummaryList && leavesummaryList.length > 0 ? (
                      leavesummaryList.map((attendee, index) => (
                        <div key={index} className={selectedName === attendee.name ? "h-full min-h-0 min-w-0" : ""}>
                          {selectedName === null ||
                          selectedName === attendee.name ? (
                            <div
                              ref={
                                selectedName === attendee.name ? listRef : null
                              }
                              className={selectedName === attendee.name ? "flex h-full min-h-0 flex-col" : ""}
                            >
                              <div
                                className={`w-full shrink-0 cursor-pointer rounded-lg border bg-white shadow-lg ${
                                  selectedName === attendee.name
                                    ? "sticky top-0 z-20 md:mr-3"
                                    : "mb-1.5"
                                } md:h-16`}
                                onClick={() => handleSelectAttendee(attendee)}
                              >
                                <div className="w-full md:flex">
                                  <div className="flex w-full items-center p-2 text-sm font-semibold text-gray-800 md:w-[225px]">
                                    {attendee.name}
                                  </div>

                                  <div className="w-full overflow-x-auto">
                                    <table className="w-full min-w-[520px]">
                                      <thead className="bg-white text-gray-800">
                                        <tr>
                                          {[
                                            "Present",
                                            "Leave",
                                            "Late Cutting",
                                            "Not Marked",
                                            "Onsite"
                                          ].map((label, idx) => (
                                            <th
                                              key={idx}
                                              className="min-w-[100px] py-0.5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500"
                                            >
                                              {label}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        <tr className="bg-white text-gray-800">
                                          {[
                                            attendee.present,
                                            attendee.absent,
                                            attendee.latecutting,
                                            attendee.notMarked,
                                            attendee.onsite
                                          ].map((value, idx) => (
                                            <td
                                              key={idx}
                                              className="px-4 py-1 text-center text-base font-bold text-slate-800"
                                            >
                                              {value}
                                            </td>
                                          ))}
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>

                              {selectedName === attendee.name &&
                                currentmonthSundays &&
                                holiday && (
                                  <div className="mt-2 flex min-h-0 min-w-0 flex-1">
                                    <ResponsiveTable
                                      attendee={attendee}
                                      user={user}
                                      handleAttendance={handleAttendance}
                                      handleOnsite={handleOnsite}
                                      handleLeave={handleLeave}
                                      handleScroll={handleScroll}
                                      modalOpen={modalOpen}
                                      sundays={currentmonthSundays}
                                      holiday={holiday}
                                    />
                                  </div>
                                )}
                            </div>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-blue-500">
                        {loading ? "" : "Oops! No staff found."}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalOpen && (
        <Modal
          type={type}
          onClose={handleClose}
          selectedDate={selectedDate}
          isOpen={modalOpen}
          formData={formData}
          staffId={selectedStaff[0]?.userId}
          assignedto={selectedStaff[0]?.assignedto}
          staffName={selectedStaff[0]?.name}
          casualleavestartsfrom={selectedStaff[0]?.casualleavestartsfrom}
          sickleavestartsfrom={selectedStaff[0]?.sickleavestartsfrom}
          privilegeleavestartsfrom={selectedStaff[0]?.privilegeleavestartsfrom}
          handleApply={handleApply}
          errorMessage={warningMessage}
          setErrorMessage={setWarningMessage}
        />
      )}
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
        loggedUser={user}
        selectedUser={selectedUserName}
        category={selectedCategory}
        handleSelectedUser={handleSelectedUser}
 activeUserId={activeUserId}
      />
    </div>
  )
}

export default LeaveSummary
