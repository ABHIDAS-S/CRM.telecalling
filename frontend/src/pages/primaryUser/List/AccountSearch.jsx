import React, { useState, useEffect, useCallback, useMemo } from "react"

import { flushSync } from "react-dom"
import ClipLoader from "react-spinners/ClipLoader"
import { useSelector } from "react-redux"
import { formatDate } from "../../../utils/dateUtils"
import { useForm, Controller } from "react-hook-form"
import Select from "react-select"
import {
  formatDistanceStrict,
  parseISO,
  differenceInDays,
  format
} from "date-fns"
import api from "../../../api/api"
import { formatTime } from "../../../utils/timeUtils"
// import debounce from "lodash.debounce"
import UseFetch from "../../../hooks/useFetch"
import Timer from "../../../components/primaryUser/Timer"
import { toast } from "react-toastify"
import { StaticSidebar } from "../../../components/primaryUser/StaticSidebar"
import AdminHeader from "../../../header/AdminHeader"
import StaffHeader from "../../../header/StaffHeader"
import { PerformanceModal } from "../../../components/primaryUser/PerformanceModal"
import {
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
} from "lucide-react"
import {
  FaEdit,
  FaTrash,
  FaTimes,
  FaUser,
  FaHashtag,
  FaBuilding,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhone,
  FaGlobeAsia,
  FaStar,
  FaLandmark
} from "react-icons/fa"
import { getLocalStorageItem } from "../../../helper/localstorage"
export default function AccountSearch() {
  // const {
  //   register,
  //   handleSubmit,
  //   setError,
  //   clearErrors,
  //   setValue,
  //   reset,
  //   formState: { errors }
  // } = useForm()
  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    clearErrors,
    getValues,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      productName: null,
      companyName: null,
      branchName: null,
      customerName: "",
      address1: "",
      address2: "",
      country: "",
      state: "",
      city: "",
      pincode: "",
      contactPerson: "",
      email: "",
      mobile: "",
      landline: "",
      partner: "",
      industry: "",
      registrationType: "",
      gstNo: "",
      licensenumber: "",
      softwareTrade: "",
      applicationDate: "",
      nextDue: "",
      noofusers: "",
      productAmount: "",
      isActive: "Running",
      taggedLicenses: [],
      taggedLicenseDueDates: {}
    }
  })
  const [licenseAvailable, setLicenseAvailable] = useState(true)
  const [popupType, setPopupType] = useState("")
  const watchedLicense = watch("licensenumber")
  const watchedTaggedLicenses = watch("taggedLicenses") || []
  const watchedTaggedLicenseDueDates = watch("taggedLicenseDueDates") || {}
  const hasTaggedLicenses =
    popupType === "Additionalservice" && watchedTaggedLicenses.length > 0
  const selectedProduct = watch("productName")
  const [showProductPopup, setShowProductPopup] = useState(false)
  const [companyOptions, setCompanyOptions] = useState([])
  const [branchOptions, setBranchOptions] = useState([])
  const [productOptions, setProductOptions] = useState([])
  const [customerData, setCustomerData] = useState([])
  const [tableData, setTableData] = useState([])
  console.log(customerData)
  const [editIndex, setEditIndex] = useState(null)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [loader, setLoader] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [productDetails, setProductDetails] = useState([])
  const [user, setUser] = useState(false)
  const [searching, setSearching] = useState(false)
  const [search, setSearch] = useState("")
  const [showCustomerDetails, setShowCustomerDetails] = useState(false)
  const [activeUserId, setActiveUserId] = useState(null)
  const [branches, setBranches] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [selectedcompanyBranch, setselectedcompanyBranch] = useState(null)
  const [selectedUserName, setselecteduserName] = useState(null)
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
  const { data: branchProduct } = UseFetch(
    `/product/getallbranchProduct?branch=${selectedcompanyBranch}`
  )
  const loggeduserBranch = useSelector(
    (state) => state.companyBranch.loggeduserbranches
  )
const selectedbranch=useSelector((branch)=>branch.companyBranch.selectedBranch)
console.log(selectedbranch)
  const { data: productData, error: productError } = UseFetch(
    loggeduserBranch &&
      `/product/getallProducts?branchselected=${encodeURIComponent(
        JSON.stringify(loggeduserBranch)
      )}`
  )
  useEffect(() => {
    const userData = getLocalStorageItem("user")
    setselectedcompanyBranch(userData.selected[0].branch_id)

    if (userData.role !== "Admin") {
      const branches = userData.selected.map((branch) => branch.branch_id)
      setBranches(branches)
    }

    setUser(userData)
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
    // Set the default product if there's only one
    if (productDetails.length === 1) {
      setSelectedProducts(productDetails[0])
    }
  }, [productDetails])

  const calculateRemainingDays = (expiryDate) => {
    if (!expiryDate) return "N/A"
    const expiry = parseISO(expiryDate) // Parse the expiry date
    const today = new Date() // Get current date
    const totalDays = differenceInDays(expiry, today) // Calculate total days difference

    if (totalDays <= 0) return "Expired" // If the date is past or today

    const months = Math.floor(totalDays / 30) // Approximate months by dividing by 30
    const days = totalDays % 30 // Remaining days after months

    let result = ""
    if (months > 0) result += `${months} month${months > 1 ? "s" : ""} `
    if (days > 0) result += `${days} day${days > 1 ? "s" : ""}`

    return result.trim()
  }

  function timeStringToSeconds(timeString) {
    const [hours, minutes, seconds] = timeString.split(":").map(Number)
    return hours * 3600 + minutes * 60 + seconds
  }

  const formatDateTime = (date) => {
    const year = date.getFullYear()

    const month = date.toLocaleString("default", { month: "long" })

    const day = String(date.getDate()).padStart(2, "0")

    const hours = String(date.getHours()).padStart(2, "0")

    const minutes = String(date.getMinutes()).padStart(2, "0")

    const seconds = String(date.getSeconds()).padStart(2, "0")

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }

  // const fetchCustomerData = useCallback(
  //   debounce(async (query) => {
  //     const url = `http://localhost:9000/api/customer/getCustomer?search=${encodeURIComponent(
  //       query
  //     )}`
  //     // const url = `https://crm.camet.in/api/customer/getCustomer?search=${encodeURIComponent(
  //     //   query
  //     // )}`

  //     try {
  //       const response = await fetch(url, {
  //         method: "GET",
  //         credentials: "include"
  //       })

  //       if (response.ok) {
  //         const result = await response.json()
  //         setMessage("")
  //         setCustomerData(result.data)
  //         setSearching(true)
  //       } else {
  //         const errorData = await response.json()
  //         setCustomerData(errorData.data)
  //         setMessage(errorData.message)
  //         console.error("Error fetching customer data:", errorData.message)
  //       }
  //     } catch (error) {
  //       console.error("Error fetching customer data:", error.message)
  //     } finally {
  //       setloading(false)
  //       // setSearching(false)
  //     }
  //   }, 300),
  //   [] // The empty dependency array ensures that debounce is created only once
  // )
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) {
      return "0 hr 0 min 0 sec"
    }
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs} hr ${mins} min ${secs} sec`
  }

  const fetchCustomerData = useCallback(async (query) => {
    const isAdmin = user?.role === "Admin"
    const selectedBranches = Array.isArray(selectedbranch)
      ? selectedbranch
      : selectedbranch
        ? [selectedbranch]
        : branches
    const branchIds = selectedBranches
      .map((branch) => branch?._id || branch?.branch_id || branch)
      .filter(Boolean)

    if (!isAdmin && branchIds.length === 0) {
      setCustomerData([])
      setMessage("Your branch access is still loading. Please try again.")
      return
    }

    try {
      setLoading(true)
      const params = { search: query, role: user?.role }
      if (!isAdmin) params.userBranch = JSON.stringify(branchIds)

      const { data: result } = await api.get("/customer/getCustomer", { params })
      const customers = Array.isArray(result?.data) ? result.data : []
      setCustomerData(customers)
      setMessage(customers.length ? "" : result?.message || "No customers found")
      setSearching(true)
    } catch (error) {
      setCustomerData([])
      setMessage(
        error.response?.data?.message ||
          "Unable to search customers. Please try again."
      )
      console.error("Error fetching customer data:", error)
    } finally {
      setLoading(false)
    }
  }, [branches, selectedbranch, user?.role])

  const handleChange = (e) => {
    const value = e.target.value
    setSearch(value)
    setSelectedCustomer(null)
    setSelectedProducts([])
    setMessage("")
    setSearching(Boolean(value.trim()))
  }

  useEffect(() => {
    const query = search.trim()
    if (!query) {
      setCustomerData([])
      setLoading(false)
      return
    }

    const timeout = setTimeout(() => fetchCustomerData(query), 350)
    return () => clearTimeout(timeout)
  }, [search, fetchCustomerData])
  const closePopup = () => {
    setShowProductPopup(false)
    setPopupType("")
    setEditIndex(null)
    // clearErrors()
  }
  const handleEdit = (item, index) => {
    console.log(item)
    console.log(index)
    setPopupType(item?.productorservicetype)
    setEditIndex(index)

    const productOption = productOptions.find(
      (p) => p.value === item?.product_id
    ) || {
      label: item?.product_id?.productName,
      value: item?.product_id
    }
    console.log(productOption)
    const companyOption = item?.company_id
      ? { label: item?.company_id?.companyName, value: item?.company_id }
      : null
    console.log(companyOption)
    const branchOption = item?.branch_id
      ? { label: item?.branch_id?.branchName, value: item?.branch_id }
      : null
    console.log(branchOption)
    const taggedLicensesFromData =
      item?.taggeddata?.map((entry) => String(entry?.licensenumber)) ||
      item?.taggedLicenses ||
      []

    const taggedLicenseDueDatesFromData =
      item?.taggeddata?.reduce((acc, entry) => {
        if (entry?.licensenumber) {
          acc[String(entry.licensenumber)] = entry?.nextDue || ""
        }
        return acc
      }, {}) || {}
    console.log(item)
    setCompanyOptions(getCompaniesForProduct(item?.productid))
    setBranchOptions(getBranchesForCompany(item?.productid, item?.companyid))
    console.log(item)
    reset({
      ...getValues(),
      productName: productOption,
      companyName: companyOption,
      branchName: branchOption,
      licensenumber: item?.licensenumber || "",
      softwareTrade: item?.softwareTrade || "",
      applicationDate: item?.applicationDate || "",
      nextDue: item?.nextDue || "",
      noofusers: item?.noofusers || "",
      productAmount: item?.productAmount || "",
      isActive: item?.isActive || "Running",
      taggedLicenses: taggedLicensesFromData,
      taggedLicenseDueDates: taggedLicenseDueDatesFromData
    })
    console.log("hhh")
    setShowProductPopup(true)
  }
  console.log(showProductPopup)
  //   const handleRowClick = (customer) => {
  // console.log(customer)
  //     setSelectedCustomer(customer)
  //     setSearch(customer.customerName)
  //     setProductDetails(customer.selected)
  //     setSearching(false)

  //     // Additional actions can be performed here (e.g., populate form fields)
  //   }
  const softwareTrades = [
    "Agriculture",
    "Business Services",
    "Computer Hardware Software",
    "Electronics Electrical Supplies",
    "FMCG-Fast Moving Consumable Goods",
    "Garment,Fashion Apparel",
    "Health Beauty",
    "Industrial Supplies",
    "Jewelry Gemstones",
    "Mobile Accessories",
    "Pharmaceutical Chemicals",
    "Textiles Chemicals",
    "Textiles Fabrics",
    "Others",
    "Restaurant, Food And Beverage",
    "Accounts Chartered Account",
    "Stationery, Printing Publishing",
    "Hotel",
    "Pipes, Tubes Fittings"
  ]
  const formatDateToDDMMYYYY = (dateValue) => {
    if (!dateValue) return ""
    const date = new Date(dateValue)
    if (Number.isNaN(date.getTime())) return ""
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }
  const getCompaniesForProduct = (productId) => {
    const product = productData?.find((item) => item._id === productId)
    if (!product) return []

    const seen = new Set()
    return product.selected.reduce((acc, company) => {
      if (!seen.has(company.company_id)) {
        seen.add(company.company_id)
        acc.push({
          label: company.companyName,
          value: company.company_id
        })
      }
      return acc
    }, [])
  }
  const primaryLicenseOptions = useMemo(() => {
    return [
      ...new Set(
        tableData
          .filter(
            (item) =>
              String(item?.productorservicetype).toLowerCase() ===
              "primaryproduct"
          )
          .map((item) => String(item?.licensenumber).trim())
          .filter(Boolean)
      )
    ]
  }, [tableData])
  const getBranchesForCompany = (productId, companyId) => {
    const product = productData?.find((item) => item._id === productId)
    if (!product) return []

    return product.selected
      .filter((c) => c.company_id === companyId)
      .map((branch) => ({
        label: branch.branchName,
        value: branch.branch_id
      }))
  }
  const handleRowClick = (customer, lic) => {
    console.log(customer)
    console.log(lic)
    const fetchCustomer = async () => {
      try {
        setLoader(true)
        // Replace with your actual API endpoint and customer id
        const response = await api.get(
          `/customer/getselectedcustomerforCall/${customer._id}`
        )
        setLoader(false)
        const data = response.data.data
        setSelectedCustomer(data[0])
        setSearch(data[0].customerName)

        // Do something with the fetched data
        console.log("Fetched customer:", response.data.data)
        setProductDetails(data[0].selected)
        const selectedData =
          data[0].selected?.map((sel) => ({
            company_id: sel?.company_id?._id,
            companyName: sel?.company_id?.companyName,
            branch_id: sel?.branch_id?._id,
            branchName: sel?.branch_id?.branchName,
            product_id: sel?.product_id?._id,
            productName: sel?.product_id?.productName,
            shortName: sel?.product_id?.shortName,
            licensenumber: sel?.licensenumber,
            softwareTrade: sel?.softwareTrade,
            applicationDate: sel?.applicationDate || sel?.customerAddDate,
            nextDue:
              sel?.nextDue ||
              sel?.amcendDate ||
              sel?.licenseExpiryDate ||
              sel?.tvuexpiryDate,
            noofusers: sel?.noofusers,
            productAmount:
              sel?.amount ||
              sel?.productAmount ||
              sel?.amcAmount ||
              sel?.tvuAmount,
            isActive: sel?.isActive || "Running",
            productorservicetype: sel?.product_id?.productorservicetype,
            taggedLicenses:
              sel?.taggedLicenses ||
              sel?.licenseNumbers ||
              sel?.taggeddata?.map((item) => String(item?.licensenumber)) ||
              [],
            taggeddata: sel?.taggeddata || []
          })) || []
        setTableData(selectedData)
        const filteredlicenseproduct = data[0].selected.filter(
          (item) => item.licensenumber === lic
        )
        console.log(filteredlicenseproduct)
        setSelectedProducts(filteredlicenseproduct)
        // For example, set it to state to display in a modal or another component
        // setSelectedCustomer(data);
      } catch (error) {
        console.error("Error fetching customer:", error)
      }
    }

    fetchCustomer()
    setSearching(false)
    // setCallData([])

    // if (customer) {
    //   reset({
    //     incomingNumber: "",
    //     token: "",
    //     description: "",
    //     solution: ""
    //   })
    //   setIsRunning(true)
    //   const currentTime = new Date()

    //   setStartTime(currentTime)
    //   // refreshHook()
    // } else {
    //   setIsRunning(false)
    // }

    // Additional actions can be performed here (e.g., populate form fields)
  }
  console.log(productDetails)
  console.log(selectedCustomer)
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
  const primaryProducts = useMemo(() => {
    return productDetails.filter(
      (item) =>
        String(item?.productorservicetype).toLowerCase() === "primaryproduct"
    )
  }, [productDetails])
  console.log(primaryProducts)
  const additionalServices = useMemo(() => {
    return productDetails.filter(
      (item) =>
        String(item?.productorservicetype).toLowerCase() === "additionalservice"
    )
  }, [productDetails])
  const onSubmit = async (data) => {
    if (selectedProducts && selectedProducts.length === 0) {
      // alert("please select aprodut")
      toast.error("Please select a product", {
        position: "top-center",
        autoClose: 3000 // 3 seconds
      })
      return
    } else {
      setIsRunning(false)
    }

    // let updatedData = { ...data }
    setFormData(data)
  }
  const PopupField = ({ label, children, error }) => {
    return (
      <div>
        <label className="mb-1 block text-[12px] font-medium text-[#5d6983]">
          {label}
        </label>
        {children}
        {error ? (
          <p className="mt-1 text-[11px] text-red-500">{error}</p>
        ) : null}
      </div>
    )
  }
  const InfoInputCard = ({
    icon,
    iconBg,
    iconColor,
    label,
    children,
    error
  }) => (
    <div className="rounded-[14px] border border-[#edf1f7] bg-white px-3 py-3 transition hover:border-[#dbe6ff]">
      <div className="flex items-start gap-3">
        <div
          className={`mt-[2px] flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${iconBg} ${iconColor}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[11px] font-medium text-[#8c96ad]">
            {label}
          </p>
          {children}
          {error ? (
            <p className="mt-1 text-[11px] text-red-500">{error}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
  const ProductCircleCard = ({
    productType,
    variant,
    line1,
    line2,
    line3,
    line4,
    line5
  }) => {
    const variantClass =
      variant === "danger"
        ? "bg-[#ffdedd] border-[#f4c6c2]"
        : variant === "service"
          ? "bg-[#fff3c9] border-[#f0e1a2]"
          : "bg-[#dff3d2] border-[#cce6bc]"
    return (
      <div
        className={`flex h-[120px] w-[124px] flex-col items-center justify-center rounded-full border text-center shadow-sm ${variantClass}`}
      >
          <div className="flex w-[90px] flex-col items-center justify-center">
            <p className="w-full break-words text-center text-[10px] font-medium leading-[12px] text-[#1e293b] line-clamp-2">
              {line1}
            </p>
            {line2 && (
              <p className="mt-1 w-full truncate text-center text-[10px] font-medium leading-[12px] text-[#4b5563]">
                {line2}
              </p>
            )}
            {line3 && (
              <p className="mt-1 w-full whitespace-nowrap text-center text-[10px] font-semibold leading-[10px] text-[#d35c5c]">
                {productType === "Primaryproduct" ? "Date" : "Due"}: {line3}
              </p>
            )}
            {line4 && (
              <p className={`mt-1 w-full truncate text-center text-[9px] font-bold leading-[11px] ${line4 === "Active" ? "text-green-600" : "text-orange-500"}`}>
                {line4}
              </p>
            )}
            {line5 && (
              <p className="mt-1 w-full truncate text-center text-[9px] font-bold leading-[11px] text-[#0b66e6]">
                Amount: {line5}
              </p>
            )}
          </div>
      </div>
    )
  }
  const filteredOptionsByType = useMemo(() => {
    return productOptions.filter(
      (item) =>
        String(item?.productorservicetype).toLowerCase() ===
        String(popupType).toLowerCase()
    )
  }, [productOptions, popupType])
  const compactSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "36px",
      cursor: "not-allowed",
      borderRadius: "8px",
      borderColor: state.isFocused ? "#7ba7ff" : "#dfe5ee",
      boxShadow: "none",
      fontSize: "12px",
      "&:hover": {
        borderColor: "#7ba7ff"
      }
    }),
    valueContainer: (base) => ({
      ...base,
      padding: "0 8px",
      cursor: "not-allowed"
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: "36px"
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999
    })
  }
  //   return (
  //     <div className="h-full bg-[#ADD8E6] overflow-hidden">
  //       <div className="flex h-full flex-row">
  //         <StaticSidebar
  //           handleMoreClick={handleMoreClick}
  //           selectedCompanyBranch={selectedcompanyBranch}
  //           setselectedCompanyBranch={setselectedcompanyBranch}
  //           parenttargetData={settargetData}
  //           parentperiodmode={periodMode}
  //           parentyear={selectedYear}
  //           setselectedPeriod={setselectedPeriod}
  //         />
  //         <div className="flex flex-1 flex-col overflow-hidden">
  //           <header className="flex items-center justify-between bg-[#ADD8E6]">
  //             {user?.role?.toLowerCase() === "admin" ? (
  //               <AdminHeader hide={true} />
  //             ) : (
  //               <StaffHeader hide={true} />
  //             )}

  //             <div className="flex items-center gap-1.5  bg-[#ADD8E6] pr-3 h-full">
  //               <button className="rounded-full p-1.5 transition bg-slate-100">
  //                 <Mail size={15} strokeWidth={2.2} />
  //               </button>
  //               <div className="relative">
  //                 <button className="rounded-full p-1.5 transition bg-slate-100">
  //                   <MessageSquareText size={15} strokeWidth={2.2} />
  //                 </button>
  //                 <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
  //               </div>
  //               <button className="rounded-full p-1.5 transition bg-slate-100">
  //                 <Settings size={15} strokeWidth={2.2} />
  //               </button>
  //               {/* <button className="rounded-full p-1.5 transition bg-slate-100">
  //                 <User size={15} strokeWidth={2.2} />
  //               </button> */}

  //               <div className="relative">
  //                 <button
  //                   onClick={(e) => {
  //                     e.stopPropagation()
  //                     setShowUserMenu((prev) => !prev)
  //                   }}
  //                   className="rounded-full p-1.5 transition bg-slate-100"
  //                 >
  //                   <User size={15} strokeWidth={2.2} />
  //                 </button>

  //                 {/* {showUserMenu && (
  //                   <div
  //                     onClick={(e) => e.stopPropagation()}
  //                     className="absolute right-0 mt-2 w-32 bg-white border border-slate-200 rounded-md shadow-lg z-50"
  //                   >
  //                     <button
  //                       onClick={handleLogout}
  //                       className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
  //                     >
  //                       Logout
  //                     </button>
  //                   </div>
  //                 )} */}
  //               </div>
  //             </div>
  //           </header>
  //           <div className="w-96 ml-5">
  //             <div className="relative">
  //               <label
  //                 htmlFor="customerName"
  //                 className="block text-sm font-medium text-gray-700"
  //               >
  //                 Search Customer
  //               </label>
  //               <div className="relative">
  //                 <input
  //                   type="text"
  //                   id="customerName"
  //                   // value={search}

  //                   onChange={handleChange}
  //                   className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 pr-10 sm:text-sm focus:border-gray-500 outline-none"
  //                   placeholder="Enter name or license..."
  //                 />
  //                 {loading && (
  //                   <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
  //                     <ClipLoader color="#36D7B7" loading={loading} size={20} />
  //                   </div>
  //                 )}
  //               </div>
  //             </div>
  //           </div>

  //           {searching && customerData && customerData.length > 0 ? (
  //             <div className="ml-5 w-96 max-h-40 overflow-y-auto overflow-x-auto  mt-4 border border-gray-200 shadow-md rounded-lg">
  //               {/* Wrap the table in a div with border */}
  //               <table className="min-w-full bg-white">
  //                 <thead className="sticky top-0 z-30 bg-green-300 border-b border-green-300 shadow">
  //                   {/* Add a bottom border to the <thead> */}
  //                   <tr>
  //                     <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
  //                       Customer Name
  //                     </th>
  //                     <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
  //                       License
  //                     </th>
  //                     <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
  //                       Mobile No
  //                     </th>
  //                   </tr>
  //                 </thead>
  //                 <tbody className="divide-y divide-gray-200">
  //                   {customerData?.map((customer, index) =>
  //                     customer.selected.map((item, subIndex) => (
  //                       <tr
  //                         key={`${index}-${subIndex}`} // Ensure unique key for each row
  //                         onClick={() => handleRowClick(customer,item?.licensenumber)}
  //                         className="cursor-pointer hover:bg-gray-50 transition-colors"
  //                       >
  //                         <td className="px-4 py-3 text-center text-sm text-gray-700">
  //                           {customer?.customerName}
  //                         </td>
  //                         <td className="px-4 py-3 text-center text-sm text-gray-700">
  //                           {item?.licensenumber}
  //                         </td>
  //                         <td className="px-4 py-3 text-center text-sm text-gray-700">
  //                           {customer?.mobile}
  //                         </td>
  //                       </tr>
  //                     ))
  //                   )}
  //                 </tbody>
  //               </table>
  //             </div>
  //           ) : (
  //             <div className="text-red-500 ml-5">{message}</div>
  //           )}

  //           {selectedCustomer && (
  //             <>
  //               <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 m-5 bg-[#4888b9] shadow-md rounded p-5">
  //                 <div className="">
  //                   <h4 className="text-md font-bold text-white">
  //                     Customer Name
  //                   </h4>
  //                   <p className="text-white">{selectedCustomer.customerName}</p>
  //                 </div>
  //                 <div className="">
  //                   <h4 className="text-md font-bold text-white">Email</h4>
  //                   <p className="text-white">{selectedCustomer.email}</p>
  //                 </div>
  //                 <div className="">
  //                   <h4 className="text-md font-bold text-white">Mobile</h4>
  //                   <p className="text-white">{selectedCustomer.mobile}</p>
  //                 </div>
  //                 <div className=" ">
  //                   <h4 className="text-md font-bold text-white">Address 1</h4>
  //                   <p className="text-white">{selectedCustomer.address1}</p>
  //                 </div>
  //                 <div className="">
  //                   <h4 className="text-md font-bold text-white">Address 2</h4>
  //                   <p className="text-white">{selectedCustomer.address2}</p>
  //                 </div>
  //                 <div className="">
  //                   <h4 className="text-md font-bold text-white">City</h4>
  //                   <p className="text-white">{selectedCustomer.city}</p>
  //                 </div>
  //                 <div className="">
  //                   <h4 className="text-md font-bold text-white">State</h4>
  //                   <p className="text-white">{selectedCustomer.state}</p>
  //                 </div>
  //                 <div className=" ">
  //                   <h4 className="text-md font-bold text-white">Country</h4>
  //                   <p className="text-white">{selectedCustomer.country}</p>
  //                 </div>
  //                 <div className="">
  //                   <h4 className="text-md font-bold text-white">Pincode</h4>
  //                   <p className="text-white">{selectedCustomer.pincode}</p>
  //                 </div>
  //                 <div className="">
  //                   <h4 className="text-md font-bold text-white">Landline</h4>
  //                   <p className="text-white">
  //                     {selectedCustomer.landline || "N/A"}
  //                   </p>
  //                 </div>
  //                 <div className="">
  //                   <h4 className="text-md font-bold text-white">Status</h4>
  //                   <p
  //                     className={`bg-clip-text text-transparent ${
  //                       selectedCustomer.selected.some(
  //                         (item) => item.isActive === "Running"
  //                       )
  //                         ? "bg-gradient-to-r from-lime-400 via-green-500 to-emerald-600"
  //                         : "bg-gradient-to-r from-red-400 via-red-500 to-orange-600"
  //                     } text-lg font-bold `}
  //                   >
  //                     {selectedCustomer.selected.some(
  //                       (item) => item.isActive === "Running"
  //                     )
  //                       ? "Active"
  //                       : "Inactive"}
  //                   </p>
  //                 </div>
  //                 <div className="">
  //                   <h4 className="text-md font-bold text-white">
  //                     Reason of Status
  //                   </h4>
  //                   <p className="text-white">
  //                     {selectedCustomer.reasonofStatus || "N/A"}
  //                   </p>
  //                 </div>
  //               </div>
  //   {/* <div className="m-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
  //                       <div className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
  //                         <div>
  //                           <h3 className="text-sm font-semibold text-slate-800">
  //                             Customer Summary
  //                           </h3>
  //                           <p className="text-xs text-slate-500">
  //                             Basic customer information
  //                           </p>
  //                         </div>

  //                         <button
  //                           type="button"
  //                           onClick={() =>
  //                             setShowCustomerDetails((prev) => !prev)
  //                           }
  //                           className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
  //                         >
  //                           {showCustomerDetails
  //                             ? "Hide Details"
  //                             : "Expand Details"}
  //                         </button>
  //                       </div>

  //                       <div className="grid grid-cols-1 gap-3 bg-[#4888b9] p-4 sm:grid-cols-2 lg:grid-cols-4">
  //                         <div>
  //                           <h4 className="text-xs font-semibold uppercase tracking-wide text-blue-100">
  //                             Customer Name
  //                           </h4>
  //                           <p className="mt-1 break-words text-sm font-medium text-white">
  //                             {selectedCustomer.customerName || "N/A"}
  //                           </p>
  //                         </div>

  //                         <div>
  //                           <h4 className="text-xs font-semibold uppercase tracking-wide text-blue-100">
  //                             Mobile
  //                           </h4>
  //                           <p className="mt-1 break-words text-sm font-medium text-white">
  //                             {selectedCustomer.mobile || "N/A"}
  //                           </p>
  //                         </div>

  //                         <div>
  //                           <h4 className="text-xs font-semibold uppercase tracking-wide text-blue-100">
  //                             Partnership
  //                           </h4>
  //                           <p className="mt-1 break-words text-sm font-medium text-white">
  //                             {selectedCustomer?.partner?.[0]?.partner ||
  //                               selectedCustomer?.partner?.partner ||
  //                               "N/A"}
  //                           </p>
  //                         </div>

  //                         <div>
  //                           <h4 className="text-xs font-semibold uppercase tracking-wide text-blue-100">
  //                             Status
  //                           </h4>
  //                           <p
  //                             className={`mt-1 text-sm font-bold ${
  //                               selectedCustomer?.selected?.some(
  //                                 (item) => item.isActive === "Running"
  //                               )
  //                                 ? "text-lime-200"
  //                                 : "text-red-200"
  //                             }`}
  //                           >
  //                             {selectedCustomer?.selected?.some(
  //                               (item) => item.isActive === "Running"
  //                             )
  //                               ? "Active"
  //                               : "Inactive"}
  //                           </p>
  //                         </div>
  //                       </div>

  //                       {showCustomerDetails && (
  //                         <div className="grid grid-cols-1 gap-3 border-t border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
  //                           <div>
  //                             <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
  //                               Email
  //                             </h4>
  //                             <p className="mt-1 break-words text-sm text-slate-700">
  //                               {selectedCustomer.email || "N/A"}
  //                             </p>
  //                           </div>

  //                           <div>
  //                             <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
  //                               Address 1
  //                             </h4>
  //                             <p className="mt-1 break-words text-sm text-slate-700">
  //                               {selectedCustomer.address1 || "N/A"}
  //                             </p>
  //                           </div>

  //                           <div>
  //                             <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
  //                               Address 2
  //                             </h4>
  //                             <p className="mt-1 break-words text-sm text-slate-700">
  //                               {selectedCustomer.address2 || "N/A"}
  //                             </p>
  //                           </div>

  //                           <div>
  //                             <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
  //                               City
  //                             </h4>
  //                             <p className="mt-1 break-words text-sm text-slate-700">
  //                               {selectedCustomer.city || "N/A"}
  //                             </p>
  //                           </div>

  //                           <div>
  //                             <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
  //                               State
  //                             </h4>
  //                             <p className="mt-1 break-words text-sm text-slate-700">
  //                               {selectedCustomer.state || "N/A"}
  //                             </p>
  //                           </div>

  //                           <div>
  //                             <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
  //                               Country
  //                             </h4>
  //                             <p className="mt-1 break-words text-sm text-slate-700">
  //                               {selectedCustomer.country || "N/A"}
  //                             </p>
  //                           </div>

  //                           <div>
  //                             <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
  //                               Pincode
  //                             </h4>
  //                             <p className="mt-1 break-words text-sm text-slate-700">
  //                               {selectedCustomer.pincode || "N/A"}
  //                             </p>
  //                           </div>

  //                           <div>
  //                             <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
  //                               Landline
  //                             </h4>
  //                             <p className="mt-1 break-words text-sm text-slate-700">
  //                               {selectedCustomer.landline || "N/A"}
  //                             </p>
  //                           </div>

  //                           <div>
  //                             <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
  //                               Industry
  //                             </h4>
  //                             <p className="mt-1 break-words text-sm text-slate-700">
  //                               {selectedCustomer.industry || "N/A"}
  //                             </p>
  //                           </div>

  //                           <div className="sm:col-span-2 lg:col-span-2">
  //                             <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
  //                               Reason of Status
  //                             </h4>
  //                             <p className="mt-1 break-words text-sm text-slate-700">
  //                               {selectedCustomer.reasonofStatus || "N/A"}
  //                             </p>
  //                           </div>
  //                         </div>
  //                       )}
  //                     </div> */}
  //               <div className="mt-6 w-lg ">
  //                 <div className="mb-2 ml-5">
  //                   <h3 className="text-lg font-medium text-gray-900">
  //                     Product Details List
  //                   </h3>
  //                   {/* <button onClick={fetchData}>update</button>c */}
  //                 </div>
  //  <div className="min-h-[180px] px-4 py-5">
  //                         <h2 className="mb-2 font-medium">Prmimary Products</h2>
  //                         {primaryProducts.length > 0 ? (
  //                           <div className="flex flex-wrap gap-4">
  //                             {primaryProducts.map((item) => {
  //                               const actualIndex = primaryProducts.findIndex(
  //                                 (x) => x === item
  //                               )
  //                               const isDeactive =
  //                                 String(item?.isActive).toLowerCase() ===
  //                                 "deactive"
  //                               const isSelected =
  //                                 String(item?.licensenumber ?? "") ===
  //                                 String(selectedLicenseNumber ?? "")

  //                               return (
  //                                 <ProductCircleCard
  //                                   key={`primary-${actualIndex}`}
  //                                   item={item}
  //                                   actualIndex={actualIndex}
  //                                   isSelected={isSelected}
  //                                   variant={isDeactive ? "danger" : "success"}
  //                                   topBadgeIcon={<FaBuilding size={10} />}
  //                                   line1={
  //                                     item?.shortName
  //                                       ? item?.shortName
  //                                       : item?.product_id?.productName
  //                                   }
  //                                   line2={item?.licensenumber}
  //                                   line3={
  //                                     item?.nextDue
  //                                       ? formatDateToDDMMYYYY(item?.nextDue)
  //                                       : ""
  //                                   }
  //                                   line4={isDeactive ? "De Active" : ""}
  //                                   onEdit={handleEdit}
  //                                   // onDelete={handleDelete}
  //                                 />
  //                               )
  //                             })}
  //                           </div>
  //                         ) : (
  //                           <div className="flex h-[140px] items-center justify-center rounded-[12px] border border-dashed border-[#e7ebf4] bg-[#fbfcff] text-[12px] text-[#8a95ab]">
  //                             No primary products added.
  //                           </div>
  //                         )}
  //                       </div>
  //                       <div className="min-h-[180px] px-4 py-5">
  //                         <h2 className="mb-2 font-medium">
  //                           Additional Services
  //                         </h2>
  //                         {additionalServices.length > 0 ? (
  //                           <div className="flex flex-wrap gap-4">
  //                             {additionalServices.map((item) => {
  //                               const actualIndex = additionalServices.findIndex(
  //                                 (x) => x === item
  //                               )

  //                               return (
  //                                 <ProductCircleCard
  //                                   key={`additional-${actualIndex}`}
  //                                   item={item}
  //                                   actualIndex={actualIndex}
  //                                   variant="service"
  //                                   topBadgeIcon={<FaBuilding size={10} />}
  //                                   line1={
  //                                     item?.shortName
  //                                       ? item?.shortName
  //                                       : item?.productName
  //                                   }
  //                                   line2={
  //                                     item?.amount ? `Rs. ${item.amount}` : ""
  //                                   }
  //                                   // line3={
  //                                   //   item?.taggeddata?.length > 0
  //                                   //     ? `Tagged ${item.taggeddata.length}`
  //                                   //     : item[0]?.nextDue
  //                                   //       ? formatDateToDDMMYYYY(item[0]?.nextDue)
  //                                   //       : ""
  //                                   // }

  //                                   line3={
  //                                     Array.isArray(item?.taggeddata) &&
  //                                     item.taggeddata.length > 0
  //                                       ? item.taggeddata
  //                                           .map((x) => x.licensenumber)
  //                                           .join(", ")
  //                                           .slice(0, 18)
  //                                       : ""
  //                                   }
  //                                   line4={
  //                                     item?.taggeddata?.length > 0
  //                                       ? formatDateToDDMMYYYY(
  //                                           item?.taggeddata?.[0]?.nextDue
  //                                         )
  //                                       : item?.nextDue
  //                                         ? formatDateToDDMMYYYY(item?.nextDue)
  //                                         : ""
  //                                   }
  //                                   onEdit={handleEdit}
  //                                   // onDelete={handleDelete}
  //                                 />
  //                               )
  //                             })}
  //                           </div>
  //                         ) : (
  //                           <div className="flex h-[140px] flex-col items-center justify-center rounded-[12px] border border-dashed border-[#e7ebf4] bg-[#fbfcff] text-center">
  //                             <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f4f8] text-[#9ca8be]">
  //                               <FaBuilding size={12} />
  //                             </div>
  //                             <p className="text-[12px] text-[#76839d]">
  //                               No additional services added.
  //                             </p>
  //                             <p className="mt-1 text-[11px] text-[#a0abc0]">
  //                               Click Add Service to get started.
  //                             </p>
  //                           </div>
  //                         )}
  //                       </div>
  //                 {/* <div className="m-5 w-lg max-h-30 overflow-x-auto text-center overflow-y-auto">
  //                   <table className=" m-w-full divide-y divide-gray-200 shadow">
  //                     <thead className="sticky  top-0 z-30 bg-green-300">
  //                       <tr>
  //                         <th className="px-4 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                           select
  //                         </th>
  //                         <th className="px-4 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                           Product Name
  //                         </th>
  //                         <th className="px-4 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                           Installed Date
  //                         </th>
  //                         <th className="px-4 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                           License No
  //                         </th>
  //                         <th className="px-4 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                           License expiry
  //                         </th>
  //                         <th className="px-4 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                           License Remaing
  //                         </th>

  //                         <th className="px-4 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                           Amc startDate <br /> (D-M-Y)
  //                         </th>
  //                         <th className="px-4 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                           Amc endDate <br /> (D-M-Y)
  //                         </th>
  //                         <th className="px-4 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                           Amc Remaining
  //                         </th>

  //                         <th className="px-4 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                           Tvu expiry
  //                         </th>
  //                         <th className="px-4 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                           Tvu Remaining
  //                         </th>
  //                         <th className="px-4 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                           No.of Users
  //                         </th>
  //                         <th className="px-4 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                           Version
  //                         </th>

  //                         {user.role === "Admin" && (
  //                           <>
  //                             <th className="px-4 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                               Company Name
  //                             </th>
  //                             <th className="px-4 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                               Branch Name
  //                             </th>
  //                             <th className="px-4 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                               Product Amount
  //                             </th>
  //                             <th className="px-4 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                               Tvu Amount
  //                             </th>
  //                             <th className="px-4 py-3  text-xs font-medium text-gray-500 uppercase tracking-wider">
  //                               Amc Amount
  //                             </th>
  //                           </>
  //                         )}
  //                       </tr>
  //                     </thead>
  //                     <tbody className="bg-white divide-y divide-gray-200">
  //                       {productDetails?.map((product, index) => (
  //                         <tr key={index}>
  //                           <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
  //                             <input
  //                               className="form-checkbox h-4 w-4 text-blue-600 hover:bg-blue-200 focus:ring-blue-500 cursor-pointer"
  //                               checked={
  //                                 selectedProducts?.productName ===
  //                                 product?.productName
  //                               }
  //                               type="checkbox"
  //                               onChange={(e) => handleCheckboxChange(e, product)}
  //                             />
  //                           </td>
  //                           <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
  //                             {product?.productName}
  //                           </td>
  //                           <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
  //                             {formatDate(product?.customerAddDate)}
  //                           </td>
  //                           <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
  //                             {product?.licensenumber}
  //                           </td>
  //                           <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
  //                             {formatDate(product?.licenseExpiryDate)}
  //                           </td>
  //                           <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
  //                             {product?.licenseExpiryDate
  //                               ? calculateRemainingDays(
  //                                   product?.licenseExpiryDate
  //                                 )
  //                               : ""}
  //                           </td>

  //                           <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
  //                             {formatDate(product?.amcstartDate)}
  //                           </td>
  //                           <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
  //                             {formatDate(product?.amcendDate)}
  //                           </td>

  //                           <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
  //                             {calculateRemainingDays(product?.amcendDate)}
  //                           </td>
  //                           <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
  //                             {product?.tvuexpiryDate}
  //                           </td>
  //                           <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
  //                             {calculateRemainingDays(product?.tvuexpiryDate)}
  //                           </td>

  //                           <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
  //                             {product?.noofusers}
  //                           </td>
  //                           <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
  //                             {product?.version}
  //                           </td>
  //                           {user.role === "Admin" && (
  //                             <>
  //                               <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
  //                                 {product?.companyName}
  //                               </td>
  //                               <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
  //                                 {product?.branchName}
  //                               </td>
  //                               <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
  //                                 {product?.productAmount}
  //                               </td>
  //                               <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
  //                                 {product?.tvuAmount}
  //                               </td>
  //                               <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
  //                                 {product?.amcAmount}
  //                               </td>
  //                             </>
  //                           )}
  //                         </tr>
  //                       ))}
  //                     </tbody>
  //                   </table>
  //                 </div> */}
  //               </div>
  //             </>
  //           )}
  //         </div>
  //  <PerformanceModal
  //           modalOpen={openModal}
  //           splitType={targetData?.selectedMeasurementType}
  //           selectedperiod={selectedPeriod}
  //           allperiods={targetData?.periods}
  //           onselectedPeriodChange={(val, val2) => {
  //             setSelectedMonth(val2)
  //             setselectedPeriod(val)
  //           }}
  //           onMonthChange={(val) => {
  //             setacheivedProducts([])
  //             setselectedDataPopup([])
  //             setperiodMode(val)
  //  setselecteduserName(null)
  //           }}
  //           onYearChange={(val) => {
  //             setacheivedProducts([])
  //             setselectedDataPopup([])
  //             setSelectedYear(val)
  //  setselecteduserName(null)
  //           }}
  //           productlist={productlist}
  //           onClose={() => {
  //             setselecteduserName(user?.name)
  //             setacheivedProducts([])
  //             setOpenModal(false)
  //  setActiveUserId(null)
  //           }}
  //           selectedMonth={periodMode}
  //           selectedYear={selectedYear}
  //           summary={{
  //             target: selectedDatapopup?.target,
  //             achieved: selectedDatapopup?.achieved,
  //             balance:
  //               selectedDatapopup?.achieved > selectedDatapopup?.target
  //                 ? 0
  //                 : selectedDatapopup?.balance
  //           }}
  //           products={achievedproducts}
  //           targetData={targetData?.userWiseResults}
  //           loggedUser={user}
  //           selectedUser={selectedUserName}
  //           category={selectedCategory}
  //           handleSelectedUser={handleSelectedUser}
  //   activeUserId={activeUserId}
  //         />
  //       </div>
  //     </div>
  //   )
  return (
    <div className="h-full min-h-0 bg-[#ADD8E6] overflow-hidden">
      <div className="flex h-full flex-row">
        {/* <StaticSidebar
          handleMoreClick={handleMoreClick}
          selectedCompanyBranch={selectedcompanyBranch}
          setselectedCompanyBranch={setselectedcompanyBranch}
          parenttargetData={settargetData}
          parentperiodmode={periodMode}
          parentyear={selectedYear}
          setselectedPeriod={setselectedPeriod}
        /> */}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {/* <header className="flex shrink-0 items-center justify-between bg-[#ADD8E6]">
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

          <div className="sticky top-0 z-40 shrink-0 bg-[#ADD8E6] px-5 pb-4 pt-2">
            <nav
              aria-label="Breadcrumb"
              className="mb-2 flex items-center gap-1.5 text-xs text-slate-600"
            >
              <span>Reports</span>
              <ChevronRight size={14} aria-hidden="true" className="text-slate-400" />
              <span className="font-semibold text-slate-800">Account Search</span>
            </nav>
            <div className="w-full max-w-md">
              <div className="relative">
                <label
                  htmlFor="customerName"
                  className="block text-sm font-medium text-gray-700"
                >
                  Search Customer
                </label>

                <div className="relative">
                  <input
                    type="text"
                    id="customerName"
                    name="customer-search"
                    value={search}
                    onChange={handleChange}
                    autoComplete="off"
                    spellCheck={false}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 pr-10 shadow-sm outline-none focus:border-gray-500 sm:text-sm"
                    placeholder="Enter name or license..."
                  />

                  {loading && (
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                      <ClipLoader color="#36D7B7" loading={loading} size={20} />
                    </div>
                  )}
                </div>
              </div>

              {searching && customerData?.length > 0 ? (
                <div className="mt-3 w-full max-w-xl overflow-hidden rounded-lg border border-gray-200 shadow-md">
                  <div className="max-h-52 overflow-auto">
                  <table className="min-w-full bg-white">
                    <thead className="sticky top-0 z-20 border-b border-green-300 bg-green-300 shadow">
                      <tr>
                        <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                          Customer Name
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                          License
                        </th>
                        <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                          Mobile No
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {customerData?.map((customer, index) =>
                        customer?.selected
                          ?.filter(
                            (item) =>
                              item?.product_id?.productorservicetype ===
                              "Primaryproduct"
                          )
                          .map((item, subIndex) => (
                          <tr
                            key={`${index}-${subIndex}`}
                            onClick={() =>
                              handleRowClick(customer, item?.licensenumber)
                            }
                            className="cursor-pointer transition-colors hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 text-center text-sm text-gray-700">
                              {customer?.customerName}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-700">
                              {item?.licensenumber}
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-700">
                              {customer?.mobile}
                            </td>
                          </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                  </div>
                </div>
              ) : (
                <div className="mt-2 text-red-500">{message}</div>
              )}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-5 pb-6">
            {selectedCustomer && (
              <>
                <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-slate-50/60 shadow-sm">
                  <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-100/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">
                        Customer Summary
                      </h3>
                      <p className="text-xs text-slate-500">
                        Basic customer information
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCustomerDetails((prev) => !prev)}
                      className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
                    >
                      {showCustomerDetails ? "Hide Details" : "Expand Details"}
                    </button>
                  </div>

                  <div className="bg-white p-3 md:p-4">
                    <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                      <InfoInputCard icon={<FaUser size={12} />} iconBg="bg-[#edf6ff]" iconColor="text-[#5aa2ff]" label="Customer Name">
                        <input readOnly value={typeof selectedCustomer?.customerName === "string" ? selectedCustomer.customerName.toUpperCase() : selectedCustomer?.customerName || ""} className={tileInputClass} />
                      </InfoInputCard>
                      <InfoInputCard icon={<FaPhone size={12} />} iconBg="bg-[#edf9f0]" iconColor="text-[#45bf6b]" label="Mobile No">
                        <input readOnly type="tel" value={selectedCustomer?.mobile || ""} className={tileInputClass} />
                      </InfoInputCard>
                      <InfoInputCard icon={<FaLandmark size={12} />} iconBg="bg-[#fff8df]" iconColor="text-[#d1a91b]" label="Partnership">
                        <input readOnly value={selectedCustomer?.partner?.[0]?.partner || selectedCustomer?.partner?.partner || "N/A"} className={tileInputClass} />
                      </InfoInputCard>

                      {showCustomerDetails && <>
                        <InfoInputCard icon={<FaHashtag size={12} />} iconBg="bg-[#f4efff]" iconColor="text-[#8a5eff]" label="Pincode">
                          <input readOnly value={selectedCustomer?.pincode || ""} className={tileInputClass} />
                        </InfoInputCard>
                        <InfoInputCard icon={<FaBuilding size={12} />} iconBg="bg-[#fff4ea]" iconColor="text-[#f0a24d]" label="City">
                          <input readOnly value={selectedCustomer?.city || ""} className={tileInputClass} />
                        </InfoInputCard>
                        <InfoInputCard icon={<FaEnvelope size={12} />} iconBg="bg-[#eefbf2]" iconColor="text-[#4cbf73]" label="Email">
                          <input readOnly type="email" value={selectedCustomer?.email || ""} className={tileInputClass} />
                        </InfoInputCard>
                        <InfoInputCard icon={<FaMapMarkerAlt size={12} />} iconBg="bg-[#fff0f8]" iconColor="text-[#ef7db2]" label="Address 1">
                          <input readOnly value={selectedCustomer?.address1 || ""} className={tileInputClass} />
                        </InfoInputCard>
                        <InfoInputCard icon={<FaUser size={12} />} iconBg="bg-[#ebfbfb]" iconColor="text-[#43c7cb]" label="Contact Person">
                          <input readOnly value={selectedCustomer?.contactPerson || ""} className={tileInputClass} />
                        </InfoInputCard>
                        <InfoInputCard icon={<FaMapMarkerAlt size={12} />} iconBg="bg-[#eef5ff]" iconColor="text-[#3879f2]" label="Address 2">
                          <input readOnly value={selectedCustomer?.address2 || ""} className={tileInputClass} />
                        </InfoInputCard>
                        <InfoInputCard icon={<FaBuilding size={12} />} iconBg="bg-[#edf7ff]" iconColor="text-[#4f98ff]" label="State">
                          <input readOnly value={selectedCustomer?.state || ""} className={tileInputClass} />
                        </InfoInputCard>
                        <InfoInputCard icon={<FaGlobeAsia size={12} />} iconBg="bg-[#fff2e8]" iconColor="text-[#ef9a47]" label="Country">
                          <input readOnly value={selectedCustomer?.country || ""} className={tileInputClass} />
                        </InfoInputCard>
                        <InfoInputCard icon={<FaPhone size={12} />} iconBg="bg-[#fff1f6]" iconColor="text-[#f07ab1]" label="Landline No">
                          <input readOnly type="tel" value={selectedCustomer?.landline || ""} className={tileInputClass} />
                        </InfoInputCard>
                        <InfoInputCard icon={<FaHashtag size={12} />} iconBg="bg-[#f5f0ff]" iconColor="text-[#9967ff]" label="Registration Type">
                          <input readOnly value={selectedCustomer?.registrationType || ""} className={tileInputClass} />
                        </InfoInputCard>
                      </>}
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-slate-200 bg-gray-50 p-3 shadow-sm">
                  <div className="mb-2.5 border-b border-slate-200 pb-2">
                    <h3 className="text-sm font-semibold text-slate-800">
                      Product Details
                    </h3>
                    <p className="text-xs text-slate-500">
                      Primary products and additional services for this customer
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 xl:flex-row">
                    <div className="min-h-[140px] w-full rounded-lg border border-slate-100 bg-white px-3 py-4 xl:w-1/2">
                      <h2 className="mb-3 text-sm font-medium">Primary Products</h2>
                    {primaryProducts.length > 0 ? (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,120px))] justify-center gap-x-6 gap-y-6 sm:justify-start">
                        {primaryProducts.map((item) => {
                          const actualIndex = primaryProducts.findIndex(
                            (x) => x === item
                          )
                          const isDeactive =
                            String(item?.isActive).toLowerCase() === "deactive"
                          return (
                            <div key={`primary-${actualIndex}`} className="flex flex-col items-center">
                              <ProductCircleCard
                                productType="Primaryproduct"
                                variant={isDeactive ? "danger" : "success"}
                                line1={item?.shortName || item?.productName || item?.product_id?.productName}
                                line2={item?.licensenumber}
                                line3={item?.applicationDate ? formatDateToDDMMYYYY(item.applicationDate) : ""}
                                line4={isDeactive ? "De Active" : "Active"}
                              />
                              <div className="mt-3 w-full rounded-lg bg-gray-100 px-2 py-1 text-center shadow-sm">
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">AMC End</p>
                                <p className={`text-xs font-bold ${item?.amcendDate ? "text-red-600" : "text-gray-400"}`}>
                                  {item?.amcendDate ? formatDateToDDMMYYYY(item.amcendDate) : "--"}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex h-[140px] items-center justify-center rounded-[12px] border border-dashed border-[#e7ebf4] bg-[#fbfcff] text-[12px] text-[#8a95ab]">
                        No primary products added.
                      </div>
                    )}
                  </div>

                    <div className="min-h-[140px] w-full rounded-lg border border-slate-100 bg-white px-3 py-4 xl:w-1/2">
                      <h2 className="mb-3 text-sm font-medium">Additional Services</h2>
                    {additionalServices.length > 0 ? (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,120px))] justify-center gap-x-6 gap-y-6 sm:justify-start">
                        {additionalServices.map((item) => {
                          const actualIndex = additionalServices.findIndex(
                            (x) => x === item
                          )
                          const isDeactive =
                            String(item?.isActive).toLowerCase() === "deactive"
                          const today = new Date()
                          today.setHours(0, 0, 0, 0)
                          const selectedTagged = Array.isArray(item?.taggeddata)
                            ? [...item.taggeddata]
                                .sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue))
                                .find((tagged) => {
                                  const dueDate = new Date(tagged.nextDue)
                                  dueDate.setHours(0, 0, 0, 0)
                                  return dueDate <= today
                                }) ||
                              [...item.taggeddata]
                                .sort((a, b) => new Date(a.nextDue) - new Date(b.nextDue))[0]
                            : null

                          return (
                            <ProductCircleCard
                              key={`additional-${actualIndex}`}
                              productType="Additionalservice"
                              variant={isDeactive ? "danger" : "service"}
                              line1={item?.shortName || item?.productName || item?.product_id?.productName}
                              line2={Array.isArray(item?.taggeddata) && item.taggeddata.length > 0 ? item.taggeddata.map((tagged) => tagged.licensenumber).join(", ").slice(0, 18) : item?.licensenumber}
                              line3={selectedTagged ? formatDateToDDMMYYYY(selectedTagged.nextDue) : item?.nextDue ? formatDateToDDMMYYYY(item.nextDue) : ""}
                              line4={isDeactive ? "De Active" : "Active"}
                              line5={selectedTagged?.productAmount || item?.productAmount || item?.amount}
                            />
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex h-[110px] flex-col items-center justify-center rounded-[12px] border border-dashed border-[#e7ebf4] bg-[#fbfcff] text-center">
                        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-[#f2f4f8] text-[#9ca8be]">
                          <FaBuilding size={12} />
                        </div>
                        <p className="text-[12px] text-[#76839d]">
                          No additional services added.
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#a0abc0]">
                          Click Add Service to get started.
                        </p>
                      </div>
                    )}
                  </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
        {showProductPopup && (
          <div className="fixed inset-0 z-50 bg-black/30 p-2 sm:p-3">
            <div className="flex min-h-full items-center justify-center">
              <div className="flex w-full max-w-3xl max-h-[92vh] flex-col overflow-hidden rounded-[14px] bg-white shadow-2xl">
                <div className="flex shrink-0 items-center justify-between border-b border-[#edf1f7] px-3 py-2.5">
                  <div>
                    <h3 className="text-[14px] font-semibold text-[#162033]">
                      {popupType === "Primaryproduct"
                        ? "Primary Product"
                        : "Additional Service"}
                    </h3>
                    <p className="text-[10px] text-[#7f8aa3]">
                      Add product or service details
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closePopup}
                    className="rounded-full p-1 text-[#7f8aa3] hover:bg-[#f4f7fb]"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-2.5">
                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-[#5d6983]">
                        Product / Service
                      </label>
                      <Controller
                        name="productName"
                        readOnly
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            options={filteredOptionsByType}
                            value={field.value}
                            onChange={(option) => {
                              field.onChange(option)
                              handleProductChange(option)
                            }}
                            placeholder="Select name"
                            styles={compactSelectStyles}
                          />
                        )}
                      />
                    </div>

                    <PopupField
                      label="Short Name"
                      error={errors.shortName?.message}
                    >
                      <input
                        readOnly
                        {...register("shortName")}
                        className="w-full cursor-not-allowed rounded-[8px] border border-[#dfe5ee] bg-[#f3f6fb] px-2.5 py-1.5 text-[12px] text-[#1f2a3d] outline-none"
                        placeholder="Enter Short Name"
                      />
                    </PopupField>

                    <PopupField label="Company">
                      <Controller
                        name="companyName"
                        readOnly
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            options={companyOptions}
                            value={field.value}
                            onChange={(option) => {
                              field.onChange(option)
                              handleCompanyChange(option)
                            }}
                            placeholder="Select company"
                            isDisabled={!selectedProduct}
                            styles={compactSelectStyles}
                          />
                        )}
                      />
                    </PopupField>

                    <PopupField label="Branch">
                      <Controller
                        name="branchName"
                        readOnly
                        control={control}
                        render={({ field }) => (
                          <Select
                            {...field}
                            options={branchOptions}
                            value={field.value}
                            onChange={(option) => {
                              field.onChange(option)
                              handleBranchChange(option)
                            }}
                            placeholder="Select branch"
                            isDisabled={!watch("companyName")}
                            styles={compactSelectStyles}
                          />
                        )}
                      />
                    </PopupField>

                    <PopupField
                      label="License Number"
                      readOnly
                      error={
                        errors.licensenumber?.message ||
                        (!licenseAvailable && watchedLicense
                          ? "License number already exists"
                          : "")
                      }
                    >
                      <input
                        {...register("licensenumber")}
                        readOnly
                        className={`${compactPopupInputClass} ${
                          hasTaggedLicenses
                            ? "cursor-not-allowed bg-[#f3f6fb]"
                            : ""
                        }`}
                        placeholder={
                          popupType === "Primaryproduct"
                            ? "Enter license number"
                            : hasTaggedLicenses
                              ? "Auto handled by tagged licenses"
                              : "Enter license number"
                        }
                        onChange={(e) => {
                          console.log(primaryProducts.length)
                          console.log(additionalServices.length)
                          console.log(hasTaggedLicenses)
                          if (hasTaggedLicenses) return
                          let index = 0
                          if (popupType === "Primaryproduct") {
                            if (primaryProducts.length > 0) {
                              index++
                            }
                            console.log("hhh")
                          } else if (popupType === "Additionalservice") {
                            console.log("hh")
                            if (additionalServices.length > 0) {
                              index++
                            }
                          }
                          setValue("licensenumber", e.target.value)
                          console.log(index)
                          if (debounceTimersRef.current[index]) {
                            clearTimeout(debounceTimersRef.current[index])
                          }
                          const licenseValue = e.target.value
                          console.log(licenseValue)
                          debounceTimersRef.current[index] = setTimeout(() => {
                            handleLicenseBlur(licenseValue)
                            delete debounceTimersRef.current[index]
                          }, 1000)
                          clearErrors("licensenumber")
                        }}
                      />
                    </PopupField>

                    {popupType === "Primaryproduct" && (
                      <PopupField label="Software Trade">
                        <select
                          disabled
                          {...register("softwareTrade")}
                          className={compactPopupInputClass}
                        >
                          <option value="">Select Software Trade</option>
                          {softwareTrades.map((trade, index) => (
                            <option key={index} value={trade}>
                              {trade}
                            </option>
                          ))}
                        </select>
                      </PopupField>
                    )}

                    {popupType === "Primaryproduct" && (
                      <PopupField label="Application Date">
                        <input
                          type="date"
                          readOnly
                          {...register("applicationDate")}
                          className={compactPopupInputClass}
                        />
                      </PopupField>
                    )}

                    {popupType === "Additionalservice" &&
                      !hasTaggedLicenses && (
                        <PopupField label="Next Due">
                          <input
                            type="date"
                            {...register("nextDue")}
                            className={compactPopupInputClass}
                          />
                        </PopupField>
                      )}

                    <PopupField label="No of Quantity / Users">
                      <input
                        type="number"
                        readOnly
                        {...register("noofusers")}
                        // className={`${compactPopupInputClass} no-spinner`}
                        className={`${compactPopupInputClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0`}
                      />
                    </PopupField>

                    <PopupField label="Amount">
                      <input
                        type="number"
                        readOnly
                        {...register("productAmount")}
                        // className={compactPopupInputClass}
                        className={`${compactPopupInputClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0`}
                      />
                    </PopupField>

                    <PopupField label="Status">
                      <select
                        disabled
                        {...register("isActive")}
                        className={compactPopupInputClass}
                      >
                        <option value="Running">Active</option>
                        <option value="Deactive">Deactive</option>
                      </select>
                    </PopupField>

                    {popupType === "Additionalservice" && (
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-[11px] font-medium text-[#5d6983]">
                          Tagged License Numbers
                        </label>

                        <div className="max-h-28 overflow-y-auto rounded-[8px] border border-[#e7ebf4] bg-[#fafcff] p-2">
                          {primaryLicenseOptions.length > 0 ? (
                            <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
                              {primaryLicenseOptions.map((licenseNo) => {
                                const selectedTaggedLicenses =
                                  watch("taggedLicenses") || []
                                const checked = selectedTaggedLicenses.includes(
                                  String(licenseNo)
                                )

                                return (
                                  <label
                                    key={licenseNo}
                                    className="flex items-center gap-2 rounded-md border border-[#edf1f7] bg-white px-2 py-1.5 text-[11px] text-[#4f5d78]"
                                  >
                                    <input
                                      type="checkbox"
                                      disabled
                                      checked={checked}
                                      onChange={(e) => {
console.log("hhh")
                                        const prev =
                                          watch("taggedLicenses") || []
                                        const dueMap =
                                          watch("taggedLicenseDueDates") || {}

                                        if (e.target.checked) {
                                          setValue("taggedLicenses", [
                                            ...prev,
                                            String(licenseNo)
                                          ])
                                          setValue("licensenumber", "")
                                          setValue("taggedLicenseDueDates", {
                                            ...dueMap,
                                            [String(licenseNo)]:
                                              dueMap[String(licenseNo)] || ""
                                          })
                                        } else {
                                          const updatedLicenses = prev.filter(
                                            (item) =>
                                              String(item) !== String(licenseNo)
                                          )

                                          const updatedDueMap = { ...dueMap }
                                          delete updatedDueMap[
                                            String(licenseNo)
                                          ]

                                          setValue(
                                            "taggedLicenses",
                                            updatedLicenses
                                          )
                                          setValue(
                                            "taggedLicenseDueDates",
                                            updatedDueMap
                                          )

                                          if (updatedLicenses.length === 0) {
                                            setValue("licensenumber", "")
                                          }
                                        }
                                      }}
                                    />
                                    <span>{licenseNo}</span>
                                  </label>
                                )
                              })}
                            </div>
                          ) : (
                            <p className="text-[11px] italic text-[#96a0b5]">
                              No primary product license numbers available.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {popupType === "Additionalservice" && hasTaggedLicenses && (
                      <div className="md:col-span-2">
                        <label className="mb-1.5 block text-[11px] font-medium text-[#5d6983]">
                          Tagged License Due Details
                        </label>

                        <div className="overflow-hidden rounded-[8px] border border-[#e7ebf4]">
                          <div className="max-h-40 overflow-y-auto">
                            <table className="w-full border-collapse">
                              <thead className="sticky top-0 bg-[#f8fafc]">
                                <tr>
                                  <th className="border-b border-[#e7ebf4] px-2.5 py-1.5 text-left text-[11px] font-semibold text-[#43506a]">
                                    License Number
                                  </th>
                                  <th className="border-b border-[#e7ebf4] px-2.5 py-1.5 text-left text-[11px] font-semibold text-[#43506a]">
                                    Next Due
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {watchedTaggedLicenses.map((licenseNo) => (
                                  <tr key={licenseNo}>
                                    <td className="border-b border-[#eef2f7] px-2.5 py-1.5">
                                      <input
                                        readOnly
                                        value={licenseNo}
                                        className="w-full cursor-not-allowed rounded-[7px] border border-[#dfe5ee] bg-[#f3f6fb] px-2 py-1.5 text-[11px] text-[#1f2a3d] outline-none"
                                      />
                                    </td>
                                    <td className="border-b border-[#eef2f7] px-2.5 py-1.5">
                                      <input
                                        type="date"
                                        readOnly
                                        value={
                                          watchedTaggedLicenseDueDates?.[
                                            licenseNo
                                          ] || ""
                                        }
                                        onChange={(e) => {
                                          const dueMap =
                                            watch("taggedLicenseDueDates") || {}
                                          setValue("taggedLicenseDueDates", {
                                            ...dueMap,
                                            [licenseNo]: e.target.value
                                          })
                                        }}
                                        className={compactPopupInputClass}
                                      />
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 justify-end gap-2 border-t border-[#edf1f7] bg-white px-3 py-2.5">
                  <button
                    type="button"
                    onClick={closePopup}
                    className="rounded-md border border-[#e4e9f2] px-3 py-1.5 text-[12px] text-[#5c6981] hover:bg-[#f8fafc]"
                  >
                    Cancel
                  </button>
                  {/* <button
                      type="button"
                      onClick={savePopupData}
                      className="rounded-md bg-[#2f80ed] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#246cd0]"
                    >
                      {editIndex !== null ? "Update" : "Save"}
                    </button> */}
                </div>
              </div>
            </div>
          </div>
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
            setselecteduserName(user?.name)
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
    </div>
  )
}

const tileInputClass =
  "w-full border-0 bg-transparent p-0 text-[12px] font-medium text-[#1f2a3d] outline-none placeholder:text-[#c0c8d8]"

const compactPopupInputClass =
  "w-full rounded-[8px] border border-[#dfe5ee] bg-white px-2.5 py-1.5 text-[12px] text-[#1f2a3d] outline-none focus:border-[#7ba7ff] cursor-not-allowed"
