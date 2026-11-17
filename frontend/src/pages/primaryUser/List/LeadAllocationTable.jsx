

import { useState, useEffect } from "react"
import PopUp from "../../../components/common/PopUp"
import {
  X,
  Calendar,
  FileText,
  AlertCircle,
  IndianRupee,
  Mail,
  MessageSquareText,
  Settings,
  User,
  Users,
  Send,
  TrendingUp,
  Menu,
  ChevronLeft,
  ChevronRight,
  Eye,
  ChevronDown,
  BellRing
} from "lucide-react"
import NodataAvailable from "../../../components/NodataAvailable"
import AdminHeader from "../../../header/AdminHeader"
import StaffHeader from "../../../header/StaffHeader"
import { getLocalStorageItem } from "../../../helper/localstorage"
import { useSelector } from "react-redux"
import React from "react"
import { toast } from "react-toastify"
import { PropagateLoader } from "react-spinners"
import { useNavigate } from "react-router-dom"
import BarLoader from "react-spinners/BarLoader"
import api from "../../../api/api"
import Select from "react-select"
import UseFetch from "../../../hooks/useFetch"
import { PerformanceModal } from "../../../components/primaryUser/PerformanceModal"
import SkeletonTable from "../../../components/loader/SkeletonTable"
import { StaticSidebar } from "../../../components/primaryUser/StaticSidebar"
const LeadAllocationTable = () => {
const reduxselectedBranch=useSelector((branch)=>branch.companyBranch.selectedBranch)
console.log(reduxselectedBranch)
  const [status, setStatus] = useState("Pending")
  const [popupOpen, setpopupOpen] = useState(false)
  const [submiterror, setsubmitError] = useState("")
  const [warningMessage, setWarningMessage] = useState(null)
  const [toggleLoading, setToggleLoading] = useState(false)
  const [selectedLeadId, setselectedLeadId] = useState(null)
  const [showModal, setShowmodal] = useState(false)
  const [achievedproducts, setacheivedProducts] = useState([])
  const [selectedPeriod, setselectedPeriod] = useState("")
  const [showeventLog, setshoweventLog] = useState(false)
  const [selectedAllocationType, setselectedAllocationType] = useState({})

  const [selectedAllocationtypeNames, setselectedallocatiotypeNames] = useState(
    {}
  )
  const [selectedCategory, setselectedCategory] = useState(null)
  const [selectedDatapopup, setselectedDataPopup] = useState({})
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))
  console.log(selectedYear)
  const [periodMode, setperiodMode] = useState("all")
  const [targetData, settargetData] = useState([])
  console.log(targetData)
  const [openModal, setOpenModal] = useState(false)
  const [productlist, setproductList] = useState([])
  console.log("Hh")
  const [validateError, setValidateError] = useState({})
  const [selectedUserName, setselecteduserName] = useState(null)
  const [validatetypeError, setValidatetypeError] = useState({})
  const [loggedUserBranches, setLoggeduserBranches] = useState([])
  const [selectedCompanyBranch, setSelectedCompanyBranch] = useState(null)
  const [showFullName, setShowFullName] = useState(false)
  const [showFullEmail, setShowFullEmail] = useState(false)
  const [approvedToggleStatus, setapprovedToggleStatus] = useState(false)
  const [submitLoading, setsubmitLoading] = useState(false)
  const [allocationOptions, setAllocationOptions] = useState([])
  const [selectedAllocates, setSelectedAllocates] = useState({})
  const [loggedUser, setLoggedUser] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [tableData, setTableData] = useState([])
  const [activeUserId, setActiveUserId] = useState(null)
  const [selectedData, setselectedData] = useState([])
  console.log(selectedData)
  const { data: branches } = UseFetch("/branch/getBranch")
  const [formData, setFormData] = useState({
    allocationDate: "",
    allocationDescription: ""
  })
  const today = new Date().toISOString().split("T")[0]
  const [filteredtasklist, setfilteredtasklist] = useState([])
  const { data: tasks } = UseFetch("/lead/getallTask")
  console.log(tasks)
  const { data: leadPendinglist, loading } = UseFetch(
    status &&
      loggedUser &&
      selectedCompanyBranch &&
      `/lead/getallLead?Status=${status}&selectedBranch=${reduxselectedBranch}&role=${loggedUser.role}&optimized=true`,
    { cacheTime: 30_000 }
  )
console.log(leadPendinglist)
  const { data: branchProduct } = UseFetch(
    `/product/getallbranchProduct?branch=${reduxselectedBranch}`
  )
  console.log(selectedAllocationType)
  console.log(selectedItem)
  console.log("hhhh")
  const { data: alluserdata } = UseFetch("/auth/getallUsers")
  const navigate = useNavigate()
  useEffect(() => {
    const userData = getLocalStorageItem("user")
    setselecteduserName(userData?.name)
    setLoggedUser(userData)
  }, [])
  useEffect(() => {
    if (tasks) {
      console.log(tasks)
      const filteredtask = tasks.filter((item) => item.taskName === "Followup")
      console.log(filteredtask)
      setfilteredtasklist(filteredtask)
    }
  }, [tasks])
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
      console.log(loggedUser?._id)
      const filteredloggedUserItem = Datas.filter(
        (item) => item.userId === loggedUser._id
      )
      console.log("hhh")

      console.log(Datas)
      console.log("hhhh")
      console.log(filteredloggedUserItem)

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

  useEffect(() => {
    if (loggedUser && branches && branches.length > 0) {
      if (loggedUser.role === "Admin") {
        const isselctedArray = loggedUser?.selected
        if (isselctedArray) {
          const loggeduserBranches = loggedUser.selected.map((item) => {
            return { value: item.branch_id, label: item.branchName }
          })
          setLoggeduserBranches(loggeduserBranches)
          setSelectedCompanyBranch(loggeduserBranches[0].value)
        } else {
          const loggeduserBranches = branches.map((item) => {
            return { value: item._id, label: item.branchName }
          })
          setLoggeduserBranches(loggeduserBranches)
          setSelectedCompanyBranch(loggeduserBranches[0].value)
        }
      } else {
        const loggeduserBranches = loggedUser.selected.map((item) => {
          return { value: item.branch_id, label: item.branchName }
        })
        setLoggeduserBranches(loggeduserBranches)
        setSelectedCompanyBranch(loggeduserBranches[0].value)
      }
    }
  }, [loggedUser, branches])
  useEffect(() => {
    if (alluserdata && reduxselectedBranch) {
      const { allusers = [], allAdmins = [] } = alluserdata

      // Combine allusers and allAdmins
      console.log(allusers)
      // const filter = allusers.filter((staff) =>
      //   staff.selected.some((s) => selectedCompanyBranch === s.branch_id)
      // )
      const filter = allusers.filter(
        (staff) =>
          staff.isVerified === true &&
          staff.selected.some((s) => reduxselectedBranch === s.branch_id)
      )
      console.log(filter)
      const combinedUsers = [...filter, ...allAdmins]
      setAllocationOptions(
        combinedUsers.map((item) => ({
          value: item._id,
          label: item.name
        }))
      )
    }
  }, [alluserdata, reduxselectedBranch])
  const getgroupingData = (data) => {
    const groupedLeads = {}
    let grandTotal = 0
    data.forEach((lead) => {
      const leadBy = lead?.leadBy?.name
      const amount = lead?.netAmount || 0
      grandTotal += amount
      if (!groupedLeads[leadBy]) {
        groupedLeads[leadBy] = []
      }

      groupedLeads[leadBy].push(lead)
    })
groupedLeads
    setTableData(groupedLeads)
  }
  useEffect(() => {
    if (leadPendinglist) {
      getgroupingData(leadPendinglist)

      if (status === "Approved") {
        const selectedAllocations = {}
        const allocationTypes = {}

        leadPendinglist.forEach((item) => {
          allocationTypes[item._id] = item.allocationType

          if (item.allocatedTo?._id) {
            const allocatedUserId = String(item.allocatedTo._id)
            selectedAllocations[item._id] =
              allocationOptions.find(
                (option) => String(option.value) === allocatedUserId
              ) || {
                value: allocatedUserId,
                label: item.allocatedTo.name || "Unassigned"
              }
          }
        })

        setselectedAllocationType(allocationTypes)
        setSelectedAllocates(selectedAllocations)
      } else {
        setSelectedAllocates({})
      }
    }
  }, [leadPendinglist, status, allocationOptions])

  console.log(selectedAllocationType)
  const toggleStatus = async () => {
    setTableData([])
    setShowFullEmail(false)
    setShowFullName(false)
    const nextApprovedStatus = !approvedToggleStatus
    setapprovedToggleStatus(nextApprovedStatus)
    setStatus(nextApprovedStatus ? "Approved" : "Pending")
    setSelectedAllocates({})
  }
  const onClose = () => {
    setpopupOpen(false)
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
  console.log(openModal)
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
    console.log(filteredloggedUserItem)
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
    console.log(filteredselectedCategory)
    console.log(summary)
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
  // const handleSelectedAllocates = (item, value, label) => {
  //   setTableData((prevLeads) =>
  //     prevLeads.map((lead) =>
  //       lead._id === item._id
  //         ? { ...lead, allocatedTo: value, allocatedName: label }
  //         : lead
  //     )
  //   )
  // }
  // const handleSelectedAllocates = (item, value, label) => {
  //   setTableData((prevData) => {
  //     const leadOwner = item.leadBy?.name
  //     if (!leadOwner || !prevData[leadOwner]) return prevData

  //     return {
  //       ...prevData,
  //       [leadOwner]: prevData[leadOwner].map((lead) =>
  //         lead._id === item._id
  //           ? { ...lead, allocatedTo: value, allocatedName: label }
  //           : lead
  //       )
  //     }
  //   })
  // }
  // const handleSelectedAllocates = (item, selectedOption) => {
  //   setTableData(prevData => {
  //     const updated = { ...prevData };

  //     Object.keys(updated).forEach(groupKey => {
  //       updated[groupKey] = updated[groupKey].map(lead =>
  //         lead.id === item.id
  //           ? {
  //               ...lead,
  //               allocatedTo: {
  //                 id: selectedOption?.value,
  //                 name: selectedOption?.label,
  //               },
  //             }
  //           : lead
  //       );
  //     });

  //     return updated;
  //   });
  // };
  // const handleSelectedAllocates = (item, selectedOption) => {
  //   setTableData((prevData) => {
  //     const updatedData = { ...prevData };

  //     Object.keys(updatedData).forEach((groupKey) => {
  //       updatedData[groupKey] = updatedData[groupKey].map((lead) =>
  //         lead.id === item.id
  //           ? {
  //               ...lead,
  //               allocatedTo: {
  //                 id: selectedOption?.value,
  //                 name: selectedOption?.label,
  //               },
  //             }
  //           : lead
  //       );
  //     });

  //     return updatedData;
  //   });

  //   setValidateError((prev) => ({
  //     ...prev,
  //     [item.id]: "",
  //   }));
  // };
  const handleSelectedAllocates = (item, selectedOption) => {
    setTableData((prevData) => {
      const updatedData = {}

      Object.keys(prevData).forEach((groupKey) => {
        updatedData[groupKey] = prevData[groupKey].map((lead) =>
          lead._id === item._id
            ? {
                ...lead,
                allocatedTo: selectedOption
                  ? {
                      id: selectedOption.value,
                      name: selectedOption.label
                    }
                  : null
              }
            : lead
        )
      })

      return updatedData
    })

    setValidateError((prev) => ({
      ...prev,
      [item._id]: ""
    }))
  }
  console.log(tableData)
  const findLeadById = (data, leadId) => {
    console.log(data)
    console.log(leadId)
    for (const groupKey of Object.keys(data)) {
      const found = data[groupKey].find((lead) => lead._id === leadId)
      if (found) return found
    }
    return null
  }
  const getRemainingDays = (dueDate) => {
    const today = new Date()
    const target = new Date(dueDate)
    today.setHours(0, 0, 0, 0)
    target.setHours(0, 0, 0, 0)
    const diffTime = target - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }
  console.log(selectedAllocationType)
  const selected = selectedAllocationType[selectedItem?._id]
  console.log(selected)
  console.log(selectedAllocationType)
const removeLeadFromGroupedTable = (groupedData, submittedLeadId) => {
  const updatedData = {};

  Object.entries(groupedData).forEach(([groupKey, leads]) => {
    const filteredLeads = leads.filter((lead) => lead._id !== submittedLeadId);

    if (filteredLeads.length > 0) {
      updatedData[groupKey] = filteredLeads;
    }
  });

  return updatedData;
};
console.log(allocationOptions)
console.log(filteredtasklist)
// console.log(allocationType)
  const handleSubmit = async () => {
    const matchingIndex = selectedItem.activityLog.findIndex(
      (log) =>
        log.reallocatedTo === false &&
        log.taskClosed === false &&
        // log.followupClosed === false &&
        log.allocatedClosed === false &&
        log.allocationChanged === false &&
        log.taskTo // ensures the field exists
    )
    console.log(matchingIndex)
    console.log(selectedItem)
    console.log(selectedItem.allocatedTo._id||selectedItem.allocatedTo)
    console.log(selectedItem?.activityLog[matchingIndex]?.taskallocatedTo)
    console.log(
      selectedItem?.activityLog[matchingIndex]?.taskallocatedTo ===(selectedItem?.allocatedTo?._id||selectedItem?.allocatedTo)
    )
    console.log("Hhh")
    if (
      selectedItem?.activityLog[matchingIndex]?.taskallocatedTo ===(selectedItem?.allocatedTo?._id||selectedItem?.allocatedTo)
    ) {
      console.log("hhhhh")
      setWarningMessage("The selected staff member is the same. Please change the staff member")
      setpopupOpen(true)
      return
    }
    // if(selectedItem.allocatedTo===selectedItem)

    if (submitLoading) {
      return
    }
    console.log(selectedItem)
    const latestSelectedItem = findLeadById(tableData, selectedItem._id)
    console.log(latestSelectedItem)
    

    if (!latestSelectedItem?.allocatedTo?.id) {
      toast.error("Please select staff")
      return
    }
    console.log("hh")
    // sanitize all string fields
    const cleanedData = Object.fromEntries(
      Object.entries(formData).map(([key, value]) => [
        key,
        typeof value === "string" ? value.trim() : value
      ])
    )

    // validate on cleaned data
    if (!cleanedData.allocationDescription) {
      setValidateError((prev) => ({
        ...prev,
        descriptionError: "Please fill it"
      }))
      return
    }
    if (!cleanedData.allocationDate) {
      setValidateError((prev) => ({
        ...prev,
        allocationDateError: "Please select a date"
      }))
      return
    }
    console.log(selectedAllocationType)

    try {
      if (selectedAllocationType) {
        const selected = selectedAllocationType[selectedItem._id]
console.log(selected)
console.log(selectedAllocationtypeNames)
        const allocationname =
          selectedAllocationtypeNames[selectedItem._id]?.taskName
console.log(allocationname)
        setsubmitLoading(true)

        let response
        if (approvedToggleStatus) {
          console.log("hhhh")
const taskId=filteredtasklist[0]?._id
const taskName=filteredtasklist[0]?.taskName
console.log(taskId)
console.log(taskName)
          response = await api.post(
            //change allocation to another staff means reassigning to another one
            `/lead/leadAllocation?allocationpending=${!approvedToggleStatus}&selectedbranch=${reduxselectedBranch}&allocationTypeName=${encodeURIComponent(
              taskName
            )}&allocationtypeId=${taskId}&allocatedBy=${loggedUser._id}`,
            { selectedItem, cleanedData }
          )
console.log(response)
console.log(response.status)
          if (response.status >= 200 && response.status < 300) {
console.log("hhhh")
            getgroupingData(response.data.data)
            // setTableData(response.data.data)
            setsubmitLoading(false)
          }
        } else {
          console.log("hhhh")
          //set allocation to respected staff from allocation pending page
          response = await api.post(
            `/lead/leadAllocation?allocationpending=${!approvedToggleStatus}&selectedbranch=${reduxselectedBranch}&allocationTypeName=${encodeURIComponent(
              allocationname
            )}&allocationtypeId=${selected}&allocatedBy=${loggedUser._id}`,
            { selectedItem, cleanedData }
          )

          if (response.status >= 200 && response.status < 300) {
            setSelectedAllocates((prev) => {
              const updated = { ...prev }
              delete updated[selectedItem._id]
              return updated
            })
            setTableData((prev) =>
              removeLeadFromGroupedTable(prev, latestSelectedItem._id)
            )
            console.log(response.data.data)
            // getgroupingData(response.data.data)
            // setTableData(response.data.data)
            setsubmitLoading(false)
          }
        }
        setShowmodal(false)
        toast.success(response.data.message)
        setsubmitLoading(false)
      }
    } catch (error) {
      if (error.response) {
        const { status, data } = error.response

        if (status === 409) {
          // ⚠️ custom business-rule warning
          toast.warning(
            data.message ||
              "Cannot change task name. It's already running.only possible to change the user"
          )
          setsubmitError({ submissionerror: data.message })
        } else if (status === 400) {
          toast.error(data.message || "Invalid request")
        } else if (status === 500) {
          toast.error("Internal Server Error. Please try again later.")
        } else {
          toast.error(data.message || "Something went wrong")
        }
      } else {
        // if error.response doesn’t exist (like network failure)
        toast.error("Network error. Please check your connection.")
      }

      setsubmitLoading(false)
      console.log("error:", error.message)
    }
  }
  // const getSelectedOption = (item) => {
  // console.log(item)
  //   if (!item?.allocatedTo) return null;
  // console.log(allocationOptions)
  //   return allocationOptions.find(opt => opt.value === item.allocatedTo.id) || {
  //     value: item.allocatedTo.id,
  //     label: item.allocatedTo.name,
  //   };
  // };
  const getSelectedAllocateOption = (item) => {
    console.log(item)
const itemid=item?.allocatedTo?.id??item?.allocatedTo?._id
    if (!itemid) return null
    console.log(item)
    return (
      allocationOptions.find((opt) => opt.value === item.allocatedTo.id||opt.value===item.allocatedTo?._id) || {
        value: item?.allocatedTo?.id||item?.allocatedTo?._id,
        label: item.allocatedTo.name
      }
    )
  }
  console.log(
    getSelectedAllocateOption({
      _id: "6a46235738ffe68302e40df7",
      leadId: "00050",
      leadDate: "2026-07-02T08:37:42.690Z",
      customerName: { _id: "6a45c111d739fa9b09c31a58", customerName: "temble" },
      mobile: "",
      email: "temble@gmail.com",
      partner: "67ea79b82f4cdf76744c0f09",
      leadConfirmed: false,
      leadClosed: false,
      leadLost: false,
      leadBranch: "66f7b26c1e7129afd9aee189",
      paymentVerified: false,
      source: "whatsapp",
      leadBy: { _id: "67220ce51c400b86242fe178", name: "abhidas" },
      leadByModel: "Staff",
      taxableAmount: 18000,
      taxAmount: 3240,
      netAmount: 21240,
      balanceAmount: 21240,
      totalPaidAmount: 0,
      remark: "",
      reallocatedTo: false,
      activityLog: [
        {
          submissionDate: "2026-07-02T08:37:42.690Z",
          submittedUser: "67220ce51c400b86242fe178",
          submissiondoneByModel: "Staff",
          taskallocatedTo: null,
          remarks: "",
          taskBy: "69671b0ee2872bca1b9e60e7",
          reallocatedTo: false,
          taskClosed: false,
          followupClosed: false,
          allocatedClosed: false,
          _id: "6a46235738ffe68302e40df8"
        }
      ],
      followupClosed: false,
      taskfromFollowup: false,
      leadFor: [
        {
          productorServiceId: "66fbcf08461da9401f1cb7f6",
          productorservicetype: "Primaryproduct",
          company_id: "66f7b0b7ecbbc22fa88a9126",
          branch_id: "66f7b26c1e7129afd9aee189",
          productorServicemodel: "Product",
          licenseNumber: null,
          productPrice: 18000,
          hsn: 18,
          netAmount: 21240,
          licenseNumbers: [],
          _id: "6a46235738ffe68302e40df9",
          taggeddata: []
        }
      ],
      paymentHistory: [],
      createdAt: "2026-07-02T08:37:43.089Z",
      updatedAt: "2026-07-02T08:37:43.089Z",
      __v: 0,
      allocatedTo: { id: "67220ce51c400b86242fe178", name: "abhidas" }
    })
  )
  // const handleAllocate = (item) => {
  //   console.log(item)
  //   if (!selectedAllocates.hasOwnProperty(item._id)) {
  //     setValidateError((prev) => ({
  //       ...prev,
  //       [item._id]: "Allocate to Someone"
  //     }))
  //     return
  //   }
  //   if (!selectedAllocationType.hasOwnProperty(item._id)) {
  //     setValidatetypeError((prev) => ({
  //       ...prev,
  //       [item._id]: "please select a Type"
  //     }))
  //     return
  //   }
  //   setselectedLeadId(item.leadId)
  //   setShowmodal(true)
  //   setSelectedItem(item)

  //   setFormData((prev) => ({
  //     ...prev,
  //     allocationDate: new Date()
  //   }))
  // }
  // const handleAllocate = (item) => {
  //   if (!item?.allocatedTo?.id) {
  //     setValidateError((prev) => ({
  //       ...prev,
  //       [item.id]: "Allocate to Someone",
  //     }));
  //     return;
  //   }

  //   if (!selectedAllocationType.hasOwnProperty(item.id)) {
  //     setValidatetypeError((prev) => ({
  //       ...prev,
  //       [item.id]: "please select a Type",
  //     }));
  //     return;
  //   }

  //   setselectedLeadId(item.leadId);
  //   setShowmodal(true);
  //   setSelectedItem(item);
  //   setFormData((prev) => ({
  //     ...prev,
  //     allocationDate: today,
  //   }));
  // };
  const handleAllocate = (item) => {
    if (!item?.allocatedTo?.id) {
      setValidateError((prev) => ({
        ...prev,
        [item._id]: "Allocate to Someone"
      }))
      return
    }

    if (!selectedAllocationType.hasOwnProperty(item._id)) {
      setValidatetypeError((prev) => ({
        ...prev,
        [item._id]: "please select a Type"
      }))
      return
    }
    setselectedLeadId(item.leadId)
    setShowmodal(true)
    setSelectedItem(item)
    setFormData((prev) => ({
      ...prev,
      allocationDate: today
    }))
  }
  console.log(formData)
  console.log(tasks)
  console.log(reduxselectedBranch)
  return (
    <div className="flex h-full overflow-hidden bg-[#ADD8E6]">
      {/* <StaticSidebar
        handleMoreClick={handleMoreClick}
        selectedCompanyBranch={selectedCompanyBranch}
        setselectedCompanyBranch={setSelectedCompanyBranch}
        parenttargetData={settargetData}
        parentperiodmode={periodMode}
        parentyear={selectedYear}
        setselectedPeriod={setselectedPeriod}
      /> */}

      {/* Main Container: Sidebar + Content */}
      <div className="flex flex-1  flex-col overflow-hidden min-h-0">
        {/* <header className="flex items-center justify-between bg-[#ADD8E6]">
          {loggedUser?.role?.toLowerCase() === "admin" ? (
            <AdminHeader hide={true} />
          ) : (
            <StaffHeader hide={true} />
          )}
          <div className="flex items-center gap-1.5 pr-3 h-full">
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

        {/* Loading Bar */}
        {loading && (
          <BarLoader
            cssOverride={{ width: "100%", height: "4px" }}
            color="#4A90E2"
          />
        )}

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden bg-[#ADD8E6] p-2 sm:p-4">
          {/* Top Bar with Title and Controls */}
          <div className="mb-2 flex shrink-0 flex-col gap-2 rounded-xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-4 py-2.5 text-white shadow-md sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 sm:flex sm:items-baseline sm:gap-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-sky-300">Lead management</p>
              <h2 className="text-base font-bold tracking-tight sm:text-lg">
                {approvedToggleStatus ? "Approved" : "Pending"} Allocation List
              </h2>
              <p className="hidden text-[11px] text-slate-300 lg:block">Review and assign incoming leads.</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {/* Branch Dropdown */}
              {/* <select
                onChange={(e) => {
                  setSelectedCompanyBranch(e.target.value)
                  setStatus(approvedToggleStatus ? "Approved" : "Pending")
                }}
                className="border border-gray-300 py-1 rounded-md px-2 focus:outline-none min-w-[120px] cursor-pointer"
              >
                {loggedUserBranches?.map((branch) => (
                  <option key={branch._id} value={branch.value}>
                    {branch.label}
                  </option>
                ))}
              </select> */}
              <button
                aria-pressed={approvedToggleStatus}
                aria-label="Toggle Approval Status"
                onClick={toggleStatus}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
              >
                <span>{approvedToggleStatus ? "Approved" : "Pending"}</span>
                <span className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${approvedToggleStatus ? "bg-emerald-400" : "bg-slate-500"}`}><span className={`h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${approvedToggleStatus ? "translate-x-4" : "translate-x-0"}`} /></span>
              </button>
              <button
                onClick={() =>
                  loggedUser.role === "Admin"
                    ? navigate("/admin/transaction/lead", {
                        state: {
                          from: "leadEdit",
                          isReadOnly: true
                        }
                      })
                    : navigate("/staff/transaction/lead", {
                        state: {
                          from: "leadEdit",
                          isReadOnly: true
                        }
                      })
                }
                className="rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300"
              >
                <span className="inline-flex items-center gap-1.5"><Users size={14} /> New Lead</span>
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200/80 bg-white/70 p-2 shadow-sm sm:p-3">
            <div>
              {loading || toggleLoading ? (
                <SkeletonTable rows={5} columns={8} />
              ) : tableData && Object.keys(tableData).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(tableData).map(([staffName, leads]) => (
                    <div
                      key={staffName}
                      className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.08)]"
                    >
                      {/* Group header */}
                      <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 px-4 py-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-700">{String(staffName || "?").slice(0, 1).toUpperCase()}</span><h3 className="text-sm font-bold text-slate-800">
                            {staffName}
                          </h3></div>
                          <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                            {leads.length} Lead{leads.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      {/* Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] border-collapse table-fixed text-sm text-slate-700">
                          <thead className="whitespace-nowrap bg-slate-900 text-white">
                            <tr className="[&>th]:!border [&>th]:!border-slate-500 [&>th]:!px-3 [&>th]:!py-1.5 [&>th]:text-center [&>th]:text-xs [&>th]:font-bold [&>th]:uppercase [&>th]:tracking-wide">
                              <th className="w-[54px] border border-r-0 border-gray-400 px-4 py-2">
                                SNO.
                              </th>
                              <th className="w-[150px] border border-r-0 border-gray-400 px-4 py-2">
                                Name
                              </th>
                              <th className="w-[150px] border border-r-0 border-l-0 border-gray-400 px-4 py-2">
                                Mobile
                              </th>
                              <th className="w-[125px] border border-r-0 border-l-0 border-gray-400 px-4 py-2">
                                Phone
                              </th>
                              {/* <th className="border border-r-0 border-l-0 border-gray-400 px-4 py-2">
                                Email
                              </th> */}
                              <th className="w-[100px] border border-r-0 border-l-0 border-gray-400 px-4 py-2">
                                Lead Id
                              </th>
                              <th className="w-[135px] border border-t-0">
                                Allocation Type
                              </th>
                              <th className="w-[100px] border border-gray-400 px-4 py-2 text-nowrap">
                                Action
                              </th>
                              <th className="w-[110px] border border-gray-400 px-4 py-2">
                                Net Amount
                              </th>
                              {/* <th className="border border-r-0 border-l-0 border-gray-400 px-4 py-2 w-32">
                                B.Amount
                              </th> */}
                            </tr>
                          </thead>

                          <tbody>
                            {leads.map((item, index) => (
                              <React.Fragment key={item._id}>
                                {/* Row 1 */}
                                <tr className="bg-white text-center align-middle transition-colors hover:bg-indigo-50/40 [&>td]:!border [&>td]:!border-slate-300 [&>td]:!px-3 [&>td]:!py-1">
                                  <td className="px-4 border border-b-0 border-gray-400" />
                                  <td
                                    onClick={() =>
                                      setShowFullName(!showFullName)
                                    }
                                    className={`px-4 cursor-pointer overflow-hidden text-black ${
                                      showFullName
                                        ? "whitespace-normal max-h-[3em]"
                                        : "truncate whitespace-nowrap max-w-[120px]"
                                    }`}
                                    style={{ lineHeight: "1.5em" }}
                                  >
                                    {item?.customerName?.customerName}
                                  </td>
                                  <td className="px-4 text-black">
                                    {item?.mobile}
                                  </td>
                                  <td className="px-4 text-black">
                                    {item?.phone}
                                  </td>
                                  {/* <td className="px-4 text-black">
                                    {item?.email}
                                  </td> */}
                                  <td className="px-4 text-black">
                                    {item?.leadId}
                                  </td>
                                  <td className="border border-b-0 border-gray-400 px-4" />
                                  <td className="border border-b-0 border-gray-400 px-1 text-yellow-500 font-semibold text-md">
                                    <button
                                      onClick={() =>
                                        loggedUser.role === "Admin"
                                          ? navigate(
                                              "/admin/transaction/lead/leadEdit",
                                              {
                                                state: {
                                                  leadId: item._id,
                                                  isReadOnly: true
                                                }
                                              }
                                            )
                                          : navigate(
                                              "/staff/transaction/lead/leadEdit",
                                              {
                                                state: {
                                                  leadId: item._id,
                                                  isReadOnly: true
                                                }
                                              }
                                            )
                                      }
                                      className="hover:text-blue-500 cursor-pointer transition-colors"
                                    >
                                      View
                                    </button>
                                  </td>
                                  <td className="border border-b-0 border-gray-400 px-4" />
                                </tr>

                                {/* Row 2 (labels) */}
                                <tr className="bg-slate-100 text-center align-middle font-semibold text-slate-700 [&>td]:!border [&>td]:!border-slate-300 [&>td]:!px-3 [&>td]:!py-0.5 [&>td]:text-xs">
                                  <td className="px-4 border border-b-0 border-t-0 border-gray-400 text-black">
                                    {index + 1}
                                  </td>
                                  <td className="px-4 text-black">LeadBy</td>
                                  <td className="px-4 text-black">
                                    AssignedTo
                                  </td>
                                  <td className="px-4 text-black">
                                    AssignedBy
                                  </td>
                                  {/* <td className="px-4 text-black">
                                    No.of FollowuUps
                                  </td> */}
                                  <td className="px-4 font-medium">LeadDate</td>

                                  <td className="border border-t-0 border-b-0 border-gray-400">
                                    <select
                                      value={selectedAllocationType?.[item._id]}
                                      onChange={(e) => {
                                        const selectedtask =
                                          filteredtasklist.find(
                                            (t) => t._id === e.target.value
                                          )
                                        setselectedAllocationType((prev) => ({
                                          ...prev,
                                          [item._id]: e.target.value
                                        }))
                                        setselectedallocatiotypeNames(
                                          (prev) => ({
                                            ...prev,
                                            [item._id]: selectedtask
                                          })
                                        )
                                        setValidatetypeError((prev) => ({
                                          ...prev,
                                          [item._id]: ""
                                        }))
                                      }}
                                      className="h-7 w-full rounded-md border border-slate-300 bg-white px-2 text-xs font-semibold text-slate-700 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                                    >
                                      <option>Select Type</option>
                                      {filteredtasklist &&
                                        filteredtasklist.map((task) => (
                                          <option
                                            key={task._id}
                                            value={task._id}
                                          >
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
                                  <td className="border border-t-0 border-b-0 border-gray-400 px-4 text-blue-400 hover:text-blue-500 hover:cursor-pointer text-nowrap">
                                    {approvedToggleStatus && (
                                      <button
                                        onClick={() => {
                                          setselectedData(item?.activityLog)
                                          setselectedLeadId(item?.leadId)
                                          setshoweventLog(true)
                                        }}
                                        type="button"
                                      >
                                        Event Log
                                      </button>
                                    )}
                                  </td>
                                  <td className="border border-t-0 border-b-0 border-gray-400 px-4 text-black">
                                    <div className="flex items-center justify-center">
                                      <IndianRupee className="w-3 h-3 text-green-600 mr-1" />
                                      <span>
                                        {item.netAmount?.toLocaleString()}
                                      </span>
                                    </div>
                                  </td>
                                  {/* <td className="border border-t-0 border-b-0 border-gray-400 px-4 text-black">
                                    <div className="flex items-center justify-center">
                                      <IndianRupee className="w-3 h-3 text-red-600 mr-1" />
                                      <span>{item?.balanceAmount}</span>
                                    </div>
                                  </td> */}
                                </tr>

                                {/* Row 3 (values) */}
                                <tr className="bg-white text-center align-middle text-slate-700 [&>td]:!border [&>td]:!border-slate-300 [&>td]:!px-3 [&>td]:!py-0.5">
                                  <td className="border border-t-0 border-r-0 border-b-0 border-gray-400 px-4 py-0.5" />
                                  <td className="border border-t-0 border-r-0 border-b-0 border-gray-400 px-4 py-0.5 text-black">
                                    {item?.leadBy?.name || "-"}
                                  </td>
                                  <td className="border border-t-0 border-r-0 border-l-0 border-b-0 border-gray-400 px-4 py-0.5 text-md">
                                    <div className="text-center">
                                      <div className="w-full min-w-0">
                                        {/* <Select
                                          options={allocationOptions}
                                          value={
                                            selectedAllocates[item._id] || null
                                          }
                                          onChange={(selectedOption) => {
                                            setSelectedAllocates((prev) => ({
                                              ...prev,
                                              [item._id]: selectedOption
                                            }))
                                            handleSelectedAllocates(
                                              item,
                                              selectedOption.value,
                                              selectedOption.label
                                            )
                                            setValidateError((prev) => ({
                                              ...prev,
                                              [item._id]: ""
                                            }))
                                          }}
                                          className="w-full min-w-0"
                                          styles={{
                                            control: (base) => ({
                                              ...base,
                                              minHeight: "26px",
                                              height: "26px",
                                              boxShadow: "none",
                                              borderColor: "#cbd5e1",
                                              paddingTop: "0px",
                                              paddingBottom: "0px",
                                              cursor: "pointer",
                                              "&:hover": { borderColor: "#818cf8" }
                                            }),
                                            option: (base, state) => ({
                                              ...base,
                                              cursor: "pointer",
                                              backgroundColor: state.isFocused
                                                ? "#f0f0f0"
                                                : "white",
                                              color: "black"
                                            }),
                                            valueContainer: (base) => ({
                                              ...base,
                                              paddingTop: "2px",
                                              paddingBottom: "2px"
                                            }),
                                            indicatorsContainer: (base) => ({
                                              ...base,
                                              height: "26px"
                                            }),
                                            menu: (provided) => ({
                                              ...provided,
                                              maxHeight: "200px",
                                              overflowY: "auto"
                                            }),
                                            menuList: (provided) => ({
                                              ...provided,
                                              maxHeight: "200px",
                                              overflowY: "auto"
                                            })
                                          }}
                                          menuPlacement="auto"
                                          menuPosition="absolute"
                                          menuPortalTarget={document.body}
                                          menuShouldScrollIntoView={false}
                                        /> */}
                                        <Select
                                          options={allocationOptions}
                                          value={getSelectedAllocateOption(
                                            item
                                          )}
                                          onChange={(selectedOption) => {
                                            setSelectedAllocates((prev) => ({
                                              ...prev,
                                              [item._id]: selectedOption
                                            }))
                                            handleSelectedAllocates(
                                              item,
                                              selectedOption
                                            )
                                            setValidateError((prev) => ({
                                              ...prev,
                                              [item._id]: ""
                                            }))
                                          }}
                                          className="w-full min-w-0"
                                          styles={{
                                            control: (base) => ({
                                              ...base,
                                              minHeight: "26px",
                                              height: "26px",
                                              boxShadow: "none",
                                              borderColor: "#cbd5e1",
                                              paddingTop: "0px",
                                              paddingBottom: "0px",
                                              cursor: "pointer",
                                              "&:hover": { borderColor: "#818cf8" }
                                            }),
                                            option: (base, state) => ({
                                              ...base,
                                              cursor: "pointer",
                                              backgroundColor: state.isFocused
                                                ? "#f0f0f0"
                                                : "white",
                                              color: "black"
                                            }),
                                            valueContainer: (base) => ({
                                              ...base,
                                              paddingTop: "2px",
                                              paddingBottom: "2px"
                                            }),
                                            indicatorsContainer: (base) => ({
                                              ...base,
                                              height: "26px"
                                            }),
                                            menu: (provided) => ({
                                              ...provided,
                                              maxHeight: "200px",
                                              overflowY: "auto"
                                            }),
                                            menuList: (provided) => ({
                                              ...provided,
                                              maxHeight: "200px",
                                              overflowY: "auto"
                                            })
                                          }}
                                          menuPlacement="auto"
                                          menuPosition="absolute"
                                          menuPortalTarget={document.body}
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
                                  <td className="border border-t-0 border-r-0 border-l-0 border-b-0 border-gray-400 px-4 py-0.5 text-md">
                                    {item?.allocatedBy?.name || "-"}
                                  </td>
                                  {/* <td className="border border-t-0 border-r-0 border-l-0 border-b-0 border-gray-400 px-4 py-0.5 text-black" /> */}
                                  <td className="border border-t-0 border-r-0 border-l-0 border-b-0 border-gray-400 px-4 py-0.5 text-black">
                                    {new Date(item.leadDate).toLocaleDateString(
                                      "en-GB"
                                    )}
                                  </td>
                                  <td className="border border-t-0 border-b-0 border-gray-400 px-4 py-0.5" />
                                  <td
                                    onClick={() => handleAllocate(item)}
                                    className="border border-t-0 border-gray-400 border-b-0 px-4 py-0.5 text-red-400 hover:text-red-500 hover:cursor-pointer font-semibold"
                                  >
                                    Allocate
                                  </td>
                                  {/* <td className="border border-t-0 border-b-0 border-gray-400 px-4 py-0.5" /> */}
                                </tr>
                              </React.Fragment>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <NodataAvailable
                  title="No data available"
                  message="There are no leads to display for the selected filters or date range."
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task Allocation Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform transition-all max-h-[95vh] flex flex-col">
            {submitLoading && (
              <div className="h-1 bg-blue-500 rounded-t-xl animate-pulse" />
            )}

            <div className="relative border-b border-gray-200 px-4 py-3">
              <button
                onClick={() => {
                  setShowmodal(false)
                  setFormData((prev) => ({
                    ...prev,
                    allocationDate: "",
                    allocationDescription: "",
                    reason: ""
                  }))
                  setsubmitError({
                    submissionerror: ""
                  })
                  setsubmitLoading(false)
                }}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
              >
                <X size={18} />
              </button>
              <h2 className="text-xl font-bold text-gray-800 mb-1.5">
                Task Allocation
              </h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-medium text-xs">
                  {selectedAllocationType[selectedItem._id]}
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600 font-medium text-xs">
                  LEAD ID-{selectedLeadId}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  <FileText size={14} className="text-blue-500" />
                  Allocated To
                </label>
                <input
                  readOnly
                  value={
                    selectedItem.allocatedName ||
                    selectedItem?.allocatedTo?.name
                  }
                  type="text"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  <Calendar size={14} className="text-blue-500" />
                  Completion Date
                </label>
                {/* <input
                  type="date"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-700"
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      allocationDate: e.target.value
                    }))
                    setValidateError((prev) => ({
                      ...prev,
                      allocationDateError: ""
                    }))
                  }}
                /> */}
                <input
                  type="date"
                  min={today}
                  value={formData.allocationDate || ""}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-700"
                  onChange={(e) => {
                    const selectedDate = e.target.value

                    if (selectedDate && selectedDate < today) {
                      setValidateError((prev) => ({
                        ...prev,
                        allocationDateError:
                          "Completion date cannot be less than current date"
                      }))
                      return
                    }

                    setFormData((prev) => ({
                      ...prev,
                      allocationDate: selectedDate
                    }))

                    setValidateError((prev) => ({
                      ...prev,
                      allocationDateError: ""
                    }))
                  }}
                />
                {validateError.allocationDateError && (
                  <div className="flex items-center gap-1.5 text-red-600 text-xs bg-red-50 px-2.5 py-1.5 rounded-lg">
                    <AlertCircle size={14} />
                    <span>{validateError.allocationDateError}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                  <FileText size={14} className="text-blue-500" />
                  Description
                </label>
                <textarea
                  value={formData.allocationDescription || ""}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      allocationDescription: e.target.value
                    }))
                    if (validateError.descriptionError) {
                      setValidateError((prev) => ({
                        ...prev,
                        descriptionError: ""
                      }))
                    }
                  }}
                  rows="3"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none text-gray-700"
                  placeholder="Provide detailed task description..."
                />
                {validateError.descriptionError && (
                  <div className="flex items-center gap-1.5 text-red-600 text-xs bg-red-50 px-2.5 py-1.5 rounded-lg">
                    <AlertCircle size={14} />
                    <span>{validateError.descriptionError}</span>
                  </div>
                )}
              </div>

              {approvedToggleStatus && (
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                    <FileText size={14} className="text-blue-500" />
                    Reason For Changing Staff
                  </label>
                  <textarea
                    value={formData.reason || ""}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        reason: e.target.value
                      }))
                      if (validateError.reasonError) {
                        setValidateError((prev) => ({
                          ...prev,
                          reasonError: ""
                        }))
                      }
                    }}
                    rows="3"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none text-gray-700"
                    placeholder="Provide reason for changing..."
                  />
                  {validateError.reasonError && (
                    <div className="flex items-center gap-1.5 text-red-600 text-xs bg-red-50 px-2.5 py-1.5 rounded-lg">
                      <AlertCircle size={14} />
                      <span>{validateError.reasonError}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-center">
                {submiterror.submissionerror && (
                  <p className="text-red-500 text-sm">
                    {submiterror.submissionerror}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5">
                <p className="text-xs text-blue-700 flex items-start gap-1.5">
                  <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                  <span>
                    Please ensure all information is accurate before submitting.
                    This task will be assigned immediately.
                  </span>
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 rounded-b-xl">
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <button
                  onClick={() => {
                    setShowmodal(false)
                    setFormData((prev) => ({
                      ...prev,
                      allocationDate: "",
                      allocationDescription: "",
                      reason: ""
                    }))
                    setsubmitError({
                      submiterror: ""
                    })
                  }}
                  disabled={submitLoading}
                  className="w-full sm:w-auto px-5 py-2 text-sm border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitLoading}
                  className="w-full sm:w-auto px-5 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Task"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event Log Modal */}
      {showeventLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-40">
          <div className="relative overflow-x-auto overflow-y-auto md:max-h-90v lg:max-h-90v shadow-xl rounded-lg mx-3 md:mx-5 px-7 p-3 bg-white w-full md:max-w-4/6">
            <button
              onClick={() => {
                setselectedLeadId(null)
                setselectedData([])
                setshoweventLog(false)
              }}
              className="absolute top-2 right-2 text-red-500 font-bold hover:text-red-600 text-lg"
            >
              ✕
            </button>

            <div className="flex justify-center text-xl font-bold gap-2 mb-3">
              <span>Lead Id:</span>
              <span className="text-indigo-600">{selectedLeadId}</span>
            </div>

            <table className="w-full text-sm border-collapse text-center">
              <thead className="text-center sticky top-0 z-10">
                <tr className="bg-indigo-100">
                  <th className="border border-indigo-200 p-2 min-w-[100px]">
                    Date
                  </th>
                  <th className="border border-indigo-200 p-2 min-w-[100px]">
                    User
                  </th>
                  <th className="border border-indigo-200 p-2 min-w-[100px]">
                    Task
                  </th>
                  <th className="border border-indigo-200 p-2 w-fit min-w-[200px]">
                    Remark
                  </th>
                  <th className="border border-indigo-200 p-2 min-w-[100px]">
                    Next Follow Up Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedData && selectedData.length > 0 ? (
                  selectedData.map((item, index) => {
                    const hasFollowerData =
                      Array.isArray(item.folowerData) &&
                      item.folowerData.length > 0
                    console.log(item?.taskallocatedTo)
                    return hasFollowerData ? (
                      item.folowerData.map((subItem, subIndex) => (
                        <tr
                          key={`${index}-${subIndex}`}
                          className={
                            (index + subIndex) % 2 === 0
                              ? "bg-gray-50"
                              : "bg-white"
                          }
                        >
                          {loggedUser?.role === "Admin" && (
                            <td className="border border-gray-200 p-2">
                              {item?.followedId?.name}
                            </td>
                          )}
                          <td className="border border-gray-200 p-2">
                            {new Date(subItem.followerDate)
                              .toLocaleDateString("en-GB")
                              .split("/")
                              .join("-")}
                          </td>
                          <td className="border border-gray-200 p-2">
                            {subItem?.followerDescription || "N/A"}
                          </td>
                          <td className="border border-gray-200 p-2"></td>
                        </tr>
                      ))
                    ) : (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}
                      >
                        <td className="border border-gray-200 p-2">
                          {new Date(item.submissionDate)
                            .toLocaleDateString("en-GB")
                            .split("/")
                            .join("-")}
                        </td>
                        <td className="border border-gray-200 p-2">
                          {item?.submittedUser?.name}
                        </td>
                        <td className="border border-gray-200 p-2 min-w-[160px]">
                          <div>
                            {item?.taskallocatedTo ? (
                              <>
                                <span>{item?.taskBy?.taskName || "N/A"}</span>
                                <span className="text-red-500">
                                  {" "}
                                  - {item?.taskallocatedTo?.name || ""}
                                </span>
                                <br />
                                <span className="text-red-500">
                                  {item.taskId?.taskName}
                                </span>
                                {item.allocationDate && (
                                  <span>
                                    {" "}
                                    - on(
                                    {new Date(
                                      item.allocationDate
                                    ).toLocaleDateString("en-GB")}
                                    )
                                  </span>
                                )}
                              </>
                            ) : (
                              <span>{item.taskBy?.taskName}</span>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-200 p-2">
                          {item?.remarks || "N/A"}
                        </td>
                        <td className="border border-gray-200 p-2">
                          {item?.nextfollowUpDate
                            ? new Date(item.nextfollowUpDate)
                                .toLocaleDateString("en-GB")
                                .split("/")
                                .join("-")
                            : "-"}
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="text-center bg-white p-3 text-gray-500 italic"
                    >
                      No followUps
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {popupOpen && (
        <PopUp isOpen={popupOpen} onClose={onClose} message={warningMessage} />
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
          setcategorylist([])
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

export default LeadAllocationTable
