import React, { forwardRef, useEffect, useState } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import UseFetch from "../../hooks/useFetch"
import { useNavigate } from "react-router-dom"
import { useLocation } from "react-router-dom"
import { LeadhistoryModal } from "../../components/primaryUser/LeadhistoryModal"
import { PropagateLoader } from "react-spinners"
import { useSelector } from "react-redux"
import SkeletonTable from "../../components/loader/SkeletonTable"
import {
  Eye,
  MessageSquareText,
  Settings,
  Phone,
  Mail,
  User,
  Calendar,
  Clock,
  UserPlus,
  UserCheck,
  ChevronDown,
  ChevronRight,
  IndianRupee,
  BellRing, // Follow-up
  History, // Event Log
  FileSearch
} from "lucide-react"
import { getLocalStorageItem } from "../../helper/localstorage"
import AdminHeader from "../../header/AdminHeader"
import StaffHeader from "../../header/StaffHeader"
import { StaticSidebar } from "../../components/primaryUser/StaticSidebar"
import { PerformanceModal } from "../../components/primaryUser/PerformanceModal"

const formatDateForRequest = (date) => {
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
    className="flex min-w-[125px] items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-left text-xs font-medium text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
  >
    <Calendar className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden="true" />
    <span className="whitespace-nowrap">{value}</span>
  </button>
))

CalendarDateInput.displayName = "CalendarDateInput"

const EmptyLostLeads = ({ startDate, endDate }) => (
  <div className="flex min-h-[380px] items-center justify-center bg-slate-50/70 p-6">
    <section className="w-full max-w-xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_30px_-22px_rgba(15,23,42,0.4)]">
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-5 py-3">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Lost lead report</span>
        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-600">0 results</span>
      </div>
      <div className="px-6 py-8 text-center sm:px-10">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600">
          <FileSearch className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">No lost leads for this period</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
          No records matched the reporting period selected above.
        </p>
        <div className="mt-5 inline-flex max-w-full items-center rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
          <Calendar className="mr-2 h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden="true" />
          <span className="truncate">
            {startDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
            <span className="mx-2 text-slate-300">—</span>
            {endDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        </div>
        <p className="mt-5 text-xs text-slate-400">
          Adjust the date range above to review a different period.
        </p>
      </div>
    </section>
  </div>
)

export default function LostLeads() {
  const [showFullName, setShowFullName] = useState(false)
  const location = useLocation()
  const [tableData, setTableData] = useState([])
  const [TotalAmount, settotalAmount] = useState(0)
  const [loggedUser, setLoggedUser] = useState(null)
  const [showFullEmail, setShowFullEmail] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedData, setselectedData] = useState([])
  const [selectedLeadId, setselectedLeadId] = useState(null)
  const [ownLead, setownLead] = useState(true)
  const [companyBranches, setcompanyBranches] = useState(null)
  const [selectedCompanyBranch, setselectedCompanyBranch] = useState(null)
  console.log(selectedCompanyBranch)
  const [showhistoryModal, sethistoryModal] = useState(false)
  const [historyList, setHistoryList] = useState([])
  const [selectedUserName, setselecteduserName] = useState(null)
  const [selectedCategory, setselectedCategory] = useState(null)
  const [selectedDatapopup, setselectedDataPopup] = useState({})
  const [activeUserId, setActiveUserId] = useState(null)
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))
  const [periodMode, setperiodMode] = useState("all")
  const [targetData, settargetData] = useState([])
  console.log(targetData)
  const [openModal, setOpenModal] = useState(false)
  const [productlist, setproductList] = useState([])
  const [achievedproducts, setacheivedProducts] = useState([])
  const [selectedPeriod, setselectedPeriod] = useState("")
  const [lostDateRange, setLostDateRange] = useState(() => {
    const today = new Date()
    return {
      startDate: new Date(today.getFullYear(), today.getMonth(), 1),
      endDate: new Date(today.getFullYear(), today.getMonth() + 1, 0)
    }
  })
  const navigate = useNavigate()
  const selbranch = useSelector((branch) => branch.companyBranch.selectedBranch)
  console.log(selbranch)
  const combranches = useSelector((branch) => branch.companyBranch.branches)
  console.log(combranches)
  console.log(selbranch)
  const { data: companybranches } = UseFetch("/branch/getBranch")
  const { data: branchProduct } = UseFetch(
    `/product/getallbranchProduct?branch=${selectedCompanyBranch}`
  )
  const shouldFetch = loggedUser && selectedCompanyBranch
  console.log(loggedUser)
  console.log(companyBranches)
  console.log(selectedCompanyBranch)
console.log(location?.state?.endDate)
  const url = shouldFetch
    ? location?.state?.staffId
      ? `/lead/lostlead?userId=${loggedUser._id}&role=${loggedUser.role}&selectedBranch=${location?.state?.branchId}&ownlead=${ownLead}&startDate=${formatDateForRequest(lostDateRange.startDate)}&endDate=${formatDateForRequest(lostDateRange.endDate)}`
      : `/lead/lostlead?userId=${loggedUser._id}&role=${loggedUser.role}&selectedBranch=${selectedCompanyBranch}&ownlead=${ownLead}&startDate=${formatDateForRequest(lostDateRange.startDate)}&endDate=${formatDateForRequest(lostDateRange.endDate)}`
    : null
  console.log(selectedCompanyBranch)
  console.log(location?.state)
  console.log(url)
  const { data: lostlead, loading, error, refreshHook } = UseFetch(url)
  console.log(lostlead)
  // const { data: lostlead, loading } = UseFetch(
  //   loggedUser &&
  //     selectedCompanyBranch &&
  //     `/lead/lostlead?userId=${loggedUser._id}&role=${loggedUser.role}&selectedBranch=${selectedCompanyBranch}&ownlead=${ownLead}`
  // )
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
    if (selbranch && companybranches && companybranches.length > 0) {
      const userData = getLocalStorageItem("user")
      const branch = companybranches?.map((branch) => {
        return {
          value: branch._id,
          label: branch.branchName
        }
      })
      setcompanyBranches(branch)
      setselectedCompanyBranch(selbranch)
      setLoggedUser(userData)
    }
  }, [selbranch, companybranches])
  useEffect(() => {
    if (!Array.isArray(lostlead) || lostlead.length === 0) {
      setTableData([])
      settotalAmount(0)
      return
    }

    {
      console.log(lostlead)
      console.log(location?.state)
      let filteredLeads = []
      if (location?.state?.viewMode) {
        // const filteredleads=lostlead.filter((item)=>item.staffId)
        console.log(lostlead)
        const addd = lostlead.map((item) => item.leadId)
        const tt = lostlead.filter((item) => item.leadId === "00107")
        console.log(tt)
        console.log(addd)
        filteredLeads = lostlead.filter((lead) => {
          // 1️⃣ Get only followup allocation logs
          const followupAllocations = lead.activityLog.filter(
            (log) =>
              log.taskTo === "followup" &&
              log.taskallocatedTo && // must exist
              log.allocationChanged === false
          )
          console.log(followupAllocations)
          // 2️⃣ If no followup allocations → skip
          if (followupAllocations.length === 0) return false
          if (lead.leadId === "00170") {
            console.log(followupAllocations)
          }
          // 3️⃣ Take LAST followup allocation
          const lastFollowupAllocation =
            followupAllocations[followupAllocations.length - 1]
          console.log(location.state.staffId)
          console.log(lastFollowupAllocation)
          // 4️⃣ Match with user
          return (
            lastFollowupAllocation.taskallocatedTo?._id.toString() ===
            location?.state?.staffId?.toString()
          )
        })
        console.log(filteredLeads)
      }
console.log(filteredLeads)

//       const groupedLeads = {}
//       let grandTotal = 0
//       location?.state?.viewMode
//         ? filteredLeads
//         : lostlead.forEach((lead) => {
//             const assignedTo = lead?.leadclosedBy?.name
// console.log(assignedTo)
//             const amount = lead?.netAmount || 0
//             grandTotal += amount
//             if (!groupedLeads[assignedTo]) {
//               groupedLeads[assignedTo] = []
//             }
//             groupedLeads[assignedTo].push(lead)
//           })
      // const groupedLeads = {}
      // let grandTotal = 0
      // lostlead.forEach((lead) => {
      //   const assignedTo = lead?.leadclosedBy?.name
      //   const amount = lead?.netAmount || 0
      //   grandTotal += amount
      //   if (!groupedLeads[assignedTo]) {
      //     groupedLeads[assignedTo] = []
      //   }
      //   groupedLeads[assignedTo].push(lead)
      // })
// const viewmode = location?.state?.viewmode

// const groupedLeads =
//   typeof viewmode === "string" && viewmode.trim() !== ""
//     ? filteredlead.reduce((acc, item) => {
//         const key = item?.taskallocatedTo?.name || "Unknown"
//         if (!acc[key]) acc[key] = []
//         acc[key].push(item)
//         return acc
//       }, {})
//     : {}
// const groupedLeads = {}
// let grandTotal = 0
// location?.state?.viewMode?filteredLeads:lostleads&&
// lostlead.forEach((lead) => {
//   const assignedTo = lead?.leadclosedBy?.name
//   const amount = lead?.netAmount || 0
//   grandTotal += amount

//   if (!groupedLeads[assignedTo]) {
//     groupedLeads[assignedTo] = []
//   }

//   groupedLeads[assignedTo].push(lead)
// })
const groupedLeads = {}
let grandTotal = 0

const leadsToGroup = location?.state?.viewMode ? filteredLeads : lostlead

leadsToGroup.forEach((lead) => {
  const assignedTo = lead?.leadclosedBy?.name || "Unknown"
  const amount = lead?.netAmount || 0

  grandTotal += amount

  if (!groupedLeads[assignedTo]) {
    groupedLeads[assignedTo] = []
  }

  groupedLeads[assignedTo].push(lead)
})
      console.log(groupedLeads)
      const Data = normalizeTableData(groupedLeads)
      settotalAmount(grandTotal)
      setTableData(Data)
    }
  }, [lostlead])
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
    setHistoryList([])
    sethistoryModal(false)
    setselectedLeadId(null)
  }
  const handleHistory = (Item) => {
    setselectedData(Item.activityLog)
    setHistoryList(Item.activityLog)
    setselectedLeadId(Item.leadId)
    sethistoryModal(true)
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
  const renderTable = (data) => (
    <table className="w-full border-collapse border border-gray-300 text-xs leading-tight">
      <thead className="whitespace-nowrap bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0 z-30 text-xs">
        <tr>
          <th className="border border-gray-300 px-2 py-1 text-left">
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3" />
              <span>Name</span>
            </div>
          </th>
          <th className="border border-gray-300 px-2 py-1 min-w-[130px] text-left">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3" />
              <span>Mobile</span>
            </div>
          </th>
          <th className="border border-gray-300 px-2 py-1 text-left">
            <div className="flex items-center gap-1.5">
              <Phone className="w-3 h-3" />
              <span>Phone</span>
            </div>
          </th>
          <th className="border border-gray-300 px-2 py-1 text-left">
            <div className="flex items-center gap-1.5">
              <Mail className="w-3 h-3" />
              <span>Email</span>
            </div>
          </th>
          <th className="border border-gray-300 px-2 py-1 min-w-[80px] text-left">
            Lead Id
          </th>

          <th className="border border-gray-300 px-2 py-1 min-w-[96px]">
            Action
          </th>
          <th className="border border-gray-300 px-2 py-1 whitespace-nowrap">Net Amount</th>
        </tr>
      </thead>
      <tbody>
        {data?.length > 0 ? (
          data.map((item, index) => (
            <React.Fragment key={index}>
              <tr className="bg-white border border-b-0 border-gray-300 hover:bg-blue-50 transition-colors">
                <td
                  onClick={() => setShowFullName(!showFullName)}
                  className={`px-2 min-w-[110px] py-1 cursor-pointer overflow-hidden font-medium text-gray-900 ${
                    showFullName
                      ? "whitespace-normal max-h-[3em]"
                      : "truncate whitespace-nowrap max-w-[120px]"
                  }`}
                  style={{ lineHeight: "1.5em" }}
                >
                  {item?.customerName?.customerName || item?.customerName}
                </td>
                <td className="px-2 py-1 text-gray-700">{item?.mobile}</td>
                <td className="px-2 py-1 text-gray-700">{item?.phone}</td>
                <td className="max-w-[160px] truncate px-2 py-1 text-gray-600">
                  {item?.email}
                </td>
                <td className="px-2 py-1 font-medium text-blue-700">
                  {item?.leadId}
                </td>

                <td className="border border-b-0 border-gray-300 px-1.5 py-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleHistory(item)}
                    className="inline-flex w-full min-w-[82px] items-center justify-center gap-1 whitespace-nowrap rounded bg-indigo-600 px-1.5 py-1 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
                  >
                    <BellRing className="w-3.5 h-3.5" />
                    <span className="whitespace-nowrap">Event Log</span>
                  </button>
                </td>
                <td className="border border-b-0 border-gray-300 px-2 py-1"></td>
              </tr>

              <tr className="font-medium bg-gradient-to-r from-gray-100 to-gray-50 text-xs text-gray-600">
                <td className="px-2 py-0.5 border-t border-gray-200">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Lead by</span>
                  </div>
                </td>
                <td className="px-2 py-0.5 border-t border-gray-200">
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-green-600" />
                    <span>Assigned to</span>
                  </div>
                </td>
                <td className="px-2 py-0.5 border-t border-gray-200 text-nowrap">
                  <div className="flex items-center gap-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-purple-600" />
                    <span>Assigned by</span>
                  </div>
                </td>
                <td className="px-2 py-0.5 border-t border-gray-200">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-600" />
                    <span>No. of Followups</span>
                  </div>
                </td>
                <td className="min-w-[110px] border-t border-gray-200 px-2 py-0.5">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    <span>Lead Date</span>
                  </div>
                </td>

                <td className="border border-t-0 border-b-0 border-gray-300 px-1.5 py-0.5 bg-white"></td>
                <td className="border border-t-0 border-b-0 border-gray-300 px-2 bg-white font-semibold">
                  <div className="flex items-center justify-start">
                    <IndianRupee className="w-4 h-3.5 text-green-600 mr-1" />
                    <span className="text-base font-semibold">
                      {" "}
                      {item.netAmount}
                    </span>
                  </div>
                </td>
              </tr>

              <tr className="bg-white">
                <td className="border border-t-0 border-gray-300 px-2 py-0.5 text-gray-900">
                  {item?.leadBy?.name}
                </td>
                <td className="border border-t-0 border-gray-300 px-2 py-0.5 text-gray-700">
                  {item?.taskallocatedTo?.name || "-"}
                </td>
                <td className="border border-t-0 border-gray-300 px-2 py-0.5 text-gray-700">
                  {item?.taskallocatedBy?.name || "-"}
                </td>
                <td className="border border-t-0 border-gray-300 px-2 py-0.5 text-gray-700"></td>
                <td className="border border-t-0 border-gray-300 px-2 py-0.5 text-gray-900">
                  {item.leadDate?.toString().split("T")[0]}
                </td>

                <td className="border border-t-0 border-b-0 border-gray-300 px-1.5 py-0.5">
                  {" "}
                  {/* {pending && item.sameUser && (
                    <button
                      onClick={() => {
                        setShowComponent(true)
                        setselectedData(item)
                      }}
                      className="inline-flex items-center gap-1 px-2  py-1 text-xs font-semibold text-white bg-amber-500 rounded hover:bg-amber-600 transition-colors w-full justify-center"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                      Update
                    </button>
                  )} */}
                </td>
                <td className="border border-t-0 border-b-0 border-gray-300 px-2 py-0.5"></td>
              </tr>

              <tr className="font-medium bg-gradient-to-r from-gray-100 to-gray-50 text-xs text-gray-600">
                <td colSpan={5} className="px-2 py-0.5 border-t border-gray-200">
                  <span>Remark :</span>
                  <span className="ml-2 text-red-500">
                    {item?.activityLog[item?.activityLog?.length - 1]?.remarks}
                  </span>
                </td>

                {/* <td className="border border-t-0 border-b-0 border-gray-300 px-3 bg-white"></td> */}
                <td className="border border-t-0 border-b-0 border-gray-300 px-1.5 py-0.5 bg-white"></td>
                <td className="border border-t-0 border-b-0 border-gray-300 px-2 bg-white"></td>
              </tr>

              {index !== data.length - 1 && (
                <tr>
                  <td colSpan="9" className="bg-gray-300">
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
  console.log(loggedUser)
  return (
    <div className=" h-full  bg-[#ADD8E6]">
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

        <div className="flex flex-1 flex-col overflow-hidden">
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
          <div className="m-2 mb-0.5 flex items-center justify-between">
            <h2 className="text-base font-bold">Lost Leads</h2>
            <div className="flex items-center justify-end gap-2">
              {/* <select
                value={selectedCompanyBranch || ""}
                onChange={(e) => {
                  setTableData([])
                  setselectedCompanyBranch(e.target.value)
                }}
                className="border border-gray-300 py-1 rounded-md px-2 focus:outline-none min-w-[150px] mr-2 cursor-pointer"
              >
                {companyBranches?.map((branch) => (
                  <option key={branch.value} value={branch.value}>
                    {branch.label}
                  </option>
                ))}
              </select> */}

              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
                <DatePicker
                  selected={lostDateRange.startDate}
                  onChange={(date) => {
                    if (!date) return
                    setLostDateRange((current) => ({
                      startDate: date,
                      endDate: date > current.endDate ? date : current.endDate
                    }))
                  }}
                  maxDate={lostDateRange.endDate}
                  dateFormat="dd MMM yyyy"
                  ariaLabel="Lost leads start date"
                  customInput={<CalendarDateInput ariaLabel="Open lost leads start date calendar" />}
                  calendarClassName="!rounded-xl !border-slate-200 !font-sans !shadow-xl"
                  popperPlacement="bottom-end"
                />
                <span className="text-xs font-medium text-slate-400">to</span>
                <DatePicker
                  selected={lostDateRange.endDate}
                  onChange={(date) => {
                    if (!date) return
                    setLostDateRange((current) => ({
                      startDate: date < current.startDate ? date : current.startDate,
                      endDate: date
                    }))
                  }}
                  minDate={lostDateRange.startDate}
                  dateFormat="dd MMM yyyy"
                  ariaLabel="Lost leads end date"
                  customInput={<CalendarDateInput ariaLabel="Open lost leads end date calendar" />}
                  calendarClassName="!rounded-xl !border-slate-200 !font-sans !shadow-xl"
                  popperPlacement="bottom-end"
                />
              </div>
              <button
                onClick={() =>
                  loggedUser?.role === "Admin"
                    ? navigate("/admin/transaction/lead")
                    : navigate("/staff/transaction/lead")
                }
                className="rounded-md bg-black px-2.5 py-1 text-sm text-white shadow hover:bg-gray-600"
              >
                New Lead
              </button>
            </div>
          </div>
          {tableData && tableData.length > 0 && (
            <div className="mr-2 flex justify-end whitespace-nowrap text-sm font-semibold text-blue-700 md:mx-3">
              <span>Total Amount :</span>
              <span className="ml-1 flex items-center">
                <IndianRupee className="w-4 h-4 mr-1 text-blue-700" />
                {TotalAmount}
              </span>
            </div>
          )}
          {/* Responsive Table Container this is the newest design*/}
          <div className="mx-2 mb-2 flex-1 overflow-x-auto overflow-y-auto rounded-md bg-white shadow-md md:mx-2">
            <>
              {/* {(() => {
                const hasLeads =
                  Array.isArray(tableData) &&
                  tableData.some(
                    (group) =>
                      Array.isArray(group.leads) && group.leads.length > 0
                  )

                if (!hasLeads || tableData.length === 0) {
                  return (
                    <div className="text-center text-gray-500 py-6">
                      No Lost Leads Available
                    </div>
                  )
                }

                return tableData.map(({ staffName, leads }, index) => (
                    <div key={staffName || `group-${index}`} className="mb-2">
                    {staffName && (
                      <h3 className="text-base font-semibold text-gray-800 mb-2 ml-1">
                        {staffName}{" "}
                        <span className="text-sm text-gray-500">
                          ({leads?.length || 0} Leads)
                        </span>
                      </h3>
                    )}

                  
                    {leads.length > 0 ? (
                      renderTable(leads)
                    ) : (
                      <div className="text-center text-gray-400 py-3 text-sm">
                        No Lead under {staffName || "this group"}.
                      </div>
                    )}
                  </div>
                ))
              })()} */}
              {(() => {
                // 1. Loading
                if (loading) {
                  return <SkeletonTable />
                }

                // 2. Check if there is at least one lead
                const hasLeads =
                  Array.isArray(tableData) &&
                  tableData.some(
                    ({ leads }) => Array.isArray(leads) && leads.length > 0
                  )

                // 3. Empty state
                if (!hasLeads) {
                  return (
                    <EmptyLostLeads
                      startDate={lostDateRange.startDate}
                      endDate={lostDateRange.endDate}
                    />
                  )
                }

                // 4. Render grouped data
                return tableData.map(({ staffName, leads = [] }, index) => (
                  <div key={staffName || `group-${index}`} className="mb-2">
                    {staffName && (
                      <h3 className="mb-1 px-1 text-sm font-semibold text-gray-800">
                        {staffName}{" "}
                        <span className="text-sm font-normal text-gray-500">
                          ({leads.length} Leads)
                        </span>
                      </h3>
                    )}

                    {leads.length > 0 ? (
                      renderTable(leads)
                    ) : (
                      <div className="py-3 text-center text-sm text-gray-400">
                        No Leads under {staffName || "this group"}.
                      </div>
                    )}
                  </div>
                ))
              })()}
            </>
          </div>
        </div>
      </div>

      {showhistoryModal && historyList && historyList.length > 0 && (
        <LeadhistoryModal
          selectedLeadId={selectedLeadId}
          historyList={historyList}
          handlecloseModal={handlecloseModal}
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
        loggedUser={loggedUser}
        selectedUser={selectedUserName}
        category={selectedCategory}
        handleSelectedUser={handleSelectedUser}
        activeUserId={activeUserId}
      />
    </div>
  )
}
