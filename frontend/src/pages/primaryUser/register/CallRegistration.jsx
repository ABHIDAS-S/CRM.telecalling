import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useLocation, Link } from "react-router-dom"
import BarLoader from "react-spinners/BarLoader"
import "react-quill/dist/quill.snow.css" // Import Quill styles
import ClipLoader from "react-spinners/ClipLoader"
import io from "socket.io-client"
import { formatDate } from "../../../utils/dateUtils"
import { getCallDescription } from "../../../utils/callDescription"
import CallDataExtendedTable from "../../../components/secondaryUser/callDataExtendedTable"
// import { useForm } from "react-hook-form"
import { parseISO, differenceInDays } from "date-fns"
import { useSelector } from "react-redux"
import { useForm, Controller } from "react-hook-form"
import Select from "react-select"
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
  Check
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
import api from "../../../api/api"
import { PerformanceModal } from "../../../components/primaryUser/PerformanceModal"
import { StaticSidebar } from "../../../components/primaryUser/StaticSidebar"
import AdminHeader from "../../../header/AdminHeader"
import StaffHeader from "../../../header/StaffHeader"
import UseFetch from "../../../hooks/useFetch"
import Timer from "../../../components/primaryUser/Timer"
import PopUp from "../../../components/common/PopUp"
import { toast } from "react-toastify"
import { getLocalStorageItem } from "../../../helper/localstorage"

// const socket = io("https://crm.camet.in")
const socket = io("http://localhost:9000")

export default function CallRegistration() {
  // const {
  //   register,
  //   handleSubmit,

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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [afterCallsubmitting, setafterCallSubmitting] = useState(false)
  const [loggeduserCurrentDateCalls, setloggeduserCurrentDateCalls] = useState(
    []
  )
  const [callupdate, setcallupdate] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [licenseAvailable, setLicenseAvailable] = useState(true)
  const [productOptions, setProductOptions] = useState([])
  const [companyOptions, setCompanyOptions] = useState([])
  const [branchOptions, setBranchOptions] = useState([])
  const [editIndex, setEditIndex] = useState(null)
  const [popupType, setPopupType] = useState("")
  const watchedLicense = watch("licensenumber")
  const watchedTaggedLicenses = watch("taggedLicenses") || []
  const watchedTaggedLicenseDueDates = watch("taggedLicenseDueDates") || {}
  const hasTaggedLicenses =
    popupType === "Additionalservice" && watchedTaggedLicenses.length > 0
  const selectedProduct = watch("productName")
  const [tableData, setTableData] = useState([])
  const [selectedLicenseNumber, setselectedlicense] = useState(null)
  const [issamecallnote, setissamecallnote] = useState(null)
  const [showCustomerDetails, setShowCustomerDetails] = useState(false)
  const [loader, setLoader] = useState(false)
  const [showIncomingNumberToast, setshowinComingnumberToast] = useState(false)
  const [callreport, setcallReport] = useState({})
  const [customerData, setCustomerData] = useState([])
  console.log(customerData)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [loading, setloading] = useState(false)
  const [message, setMessage] = useState("")
  const [callList, setCallList] = useState([])
  const [productDetails, setProductDetails] = useState([])
  console.log(productDetails)
  const [user, setUser] = useState(false)
  const [searching, setSearching] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [isRunning, setIsRunning] = useState(false) // Start with the timer running
  const [startTime, setStartTime] = useState(Date.now())
  const [formData, setFormData] = useState(null)
  const [callData, setCallData] = useState([])
  const [branch, setBranches] = useState([])
  const [callnote, setCallnotes] = useState([])
  const [selectedUserName, setselecteduserName] = useState(null)
  const [selectedCategory, setselectedCategory] = useState(null)
  const [selectedDatapopup, setselectedDataPopup] = useState({})
  const [activeUserId, setActiveUserId] = useState(null)
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))
  const [periodMode, setperiodMode] = useState("all")
  const [targetData, settargetData] = useState([])
  console.log(targetData)
  const [showProductPopup, setShowProductPopup] = useState(false)
  console.log(showProductPopup)
  const [openModal, setOpenModal] = useState(false)
  const [productlist, setproductList] = useState([])
  const [achievedproducts, setacheivedProducts] = useState([])
  const [selectedPeriod, setselectedPeriod] = useState("")
  const debounceTimeoutRef = useRef(null)
  const location = useLocation()
  const [selectedcompanyBranch, setselectedcompanyBranch] = useState(null)
  const { calldetails, token } = location?.state || {}

  const { data: registeredCall, refreshHook } = UseFetch(
    selectedCustomer?._id &&
      `/customer/getcallregister?customerid=${selectedCustomer?._id || null}`
  )
  const loggeduserBranch = useSelector(
    (state) => state.companyBranch.loggeduserbranches
  )
  console.log(loggeduserBranch)
  const { data: productData, error: productError } = UseFetch(
    loggeduserBranch &&
      `/product/getallProducts?branchselected=${encodeURIComponent(
        JSON.stringify(loggeduserBranch)
      )}`
  )
  console.log(productData)
  const { data: branchProduct } = UseFetch(
    selectedcompanyBranch &&
      `/product/getallbranchProduct?branch=${selectedcompanyBranch}`
  )
  const { data } = UseFetch(
    user._id && `/customer/getloggeduserCurrentCalls?loggedUserId=${user._id}`
  )
  // const { data: callscount } = UseFetch("/customer/getcallregistrationlist")
  const { data: callnotes } = UseFetch("/customer/getallcallNotes")
  const handleQuillChange = (value) => {
    setValue("description", value, { shouldValidate: true }) // Update React Hook Form's value
  }
  useEffect(() => {
    setloggeduserCurrentDateCalls(data)
  }, [data])
  useEffect(() => {
    if (productData) {
      console.log(productData)
      setProductOptions(
        productData.map((product) => ({
          label: product.productName,
          value: product._id,
          shortName: product?.shortName,
          productorservicetype: product.productorservicetype
        }))
      )
    }
  }, [productData])
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
  console.log(showCustomerDetails)
  useEffect(() => {
    const submitCallRegistration = async () => {
      try {
        if (afterCallsubmitting) {
          const response = await api.get(
            `/customer/getloggeduserCurrentCalls?loggedUserId=${user._id}`
          )
          const data = response.data.data
          if (response.status === 200) setloggeduserCurrentDateCalls(data)
        }
      } catch (error) {
        console.error("Error submitting call registration:", error)
      }
    }

    submitCallRegistration()
  }, [afterCallsubmitting]) // Dependency array ensures it runs when 'afterCallsubmitting' changes
  useEffect(() => {
    if (callnotes && callnotes?.length > 0) {
      const userData = getLocalStorageItem("user")
      setselectedcompanyBranch(userData.selected[0].branch_id)

      if (userData.role !== "Admin") {
        const branches = userData.selected.map((branch) => branch.branch_id)

        setBranches(branches)
      }

      setUser(userData)
      setCallnotes(callnotes)
    }
  }, [callnotes])
  // useEffect(() => {
  //   if (user && callscount) {
  //     if (user?.role === "Admin") {
  //       setCallList(callscount)
  //     } else {
  //       const userBranchName = new Set(
  //         user?.selected?.map((branch) => branch.branchName)
  //       )

  //       const branchNamesArray = Array.from(userBranchName)

  //       const filtered = callscount.filter(
  //         (call) =>
  //           Array.isArray(call?.callregistration) && // Check if callregistration is an array
  //           call.callregistration.some((registration) => {
  //             const hasMatchingBranch =
  //               Array.isArray(registration?.branchName) && // Check if branchName is an array
  //               registration.branchName.some(
  //                 (branch) => branchNamesArray.includes(branch) // Check if any branch matches user's branches
  //               )

  //             // If user has only one branch, ensure it matches exactly and no extra branches
  //             if (branchNamesArray.length === 1) {
  //               return (
  //                 hasMatchingBranch &&
  //                 registration.branchName.length === 1 &&
  //                 registration.branchName[0] === branchNamesArray[0]
  //               )
  //             }

  //             // If user has more than one branch, just check for any match
  //             return hasMatchingBranch
  //           })
  //       )

  //       setCallList(filtered)
  //     }
  //   }
  // }, [user, callscount])
  // useEffect(() => {
  //   if (user) {
  //     const userId = user._id
  //     socket.emit("updatedCalls", userId)
  //     // Listen for initial data from the server
  //     socket.on("updatedCalls", ({ calls, user }) => {
  //       if (user?.role === "Admin") {
  //         setCallList(calls)
  //       } else {
  //         const userBranchName = new Set(
  //           user?.selected?.map((branch) => branch.branchName)
  //         )

  //         const branchNamesArray = Array.from(userBranchName)

  //         const filtered = calls.filter(
  //           (call) =>
  //             Array.isArray(call?.callregistration) && // Check if callregistration is an array
  //             call.callregistration.some((registration) => {
  //               const hasMatchingBranch =
  //                 Array.isArray(registration?.branchName) && // Check if branchName is an array
  //                 registration.branchName.some(
  //                   (branch) => branchNamesArray.includes(branch) // Check if any branch matches user's branches
  //                 )

  //               // If user has only one branch, ensure it matches exactly and no extra branches
  //               if (branchNamesArray.length === 1) {
  //                 return (
  //                   hasMatchingBranch &&
  //                   registration.branchName.length === 1 &&
  //                   registration.branchName[0] === branchNamesArray[0]
  //                 )
  //               }

  //               // If user has more than one branch, just check for any match
  //               return hasMatchingBranch
  //             })
  //         )

  //         setCallList(filtered)
  //       }
  //     })

  //     //Cleanup the socket connection when the component unmounts
  //     return () => {
  //       socket.off("updatedCalls")
  //       socket.disconnect()
  //     }
  //   }
  // }, [user])
  // Cleanup the timeout if the component unmounts
  useEffect(() => {
    return () => clearTimeout(debounceTimeoutRef.current)
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => {
      if (search && !selectedCustomer) {
        console.log("H")
console.log(search)
        fetchCustomerData(search)
        setloading(true)
      } else {
        setloading(false)
        setCustomerData([])
      }
    }, 500)

    return () => {
      clearTimeout(handler) // Cleanup the timeout on unmount or before the next call
    }
  }, [search]) // Only re-run the effect if search changes
  useEffect(() => {
    if (calldetails) {
      console.log(calldetails)
      // Fetch the call details using the ID
      fetchCallDetails(calldetails)
        .then((callData) => {
          console.log("hhh")
          console.log(callData)
          console.log(callData.callDetails.callregistration)
          const matchingRegistration =
            callData.callDetails.callregistration.find(
              (registration) => registration.timedata.token === token
            )

          console.log("hhh")
          // /// If a matching registration is found, extract the product details
          const productId = matchingRegistration?.product?._id
          const license = matchingRegistration?.license
          setselectedlicense(license)
          console.log(matchingRegistration)
          console.log(productId)
          console.log(callData.callDetails?.customerid?.selected)
          const matchingProducts =
            callData.callDetails?.customerid?.selected.filter(
              (product) =>
                product?.product_id === productId &&
                product?.licensenumber === license
            )
          console.log(matchingProducts)
          setSearch(callData?.callDetails?.customerid?.customerName)
          setSelectedCustomer(callData?.callDetails?.customerid)
          console.log("hhh")
          console.log(matchingProducts)
console.log(matchingRegistration)
          if (matchingProducts.length === 0 && productId) {
            console.log("hhh")
            setProductDetails([
              {
                product_id: matchingRegistration.product._id,
                licensenumber: matchingRegistration.license,
                productName: matchingRegistration.product.productName,
                branchName: matchingRegistration.product.selected[0].branchName,
                note: "The product has been upgraded or changed after your previous call and no longer exists for this customer."
              }
            ])
          } else if (productId === undefined) {
console.log(
"hh")
            const matchedLicenseofthecustomer = matchingRegistration.license

            const matchingproducts =
              callData.callDetails.customerid.selected.filter(
                (item) => item.licensenumber === matchedLicenseofthecustomer
              )
            setProductDetails(matchingproducts)
          } else {
console.log(matchingProducts)
            setProductDetails(matchingProducts)
          }
          console.log("hhh")
          const editData = {
            incomingNumber: matchingRegistration?.formdata?.incomingNumber,
            token: matchingRegistration?.timedata?.token,
            description: getCallDescription(matchingRegistration?.formdata?.description),
            solution: matchingRegistration?.formdata?.solution,
            status: matchingRegistration?.formdata?.status,
            callnote: matchingRegistration?.formdata?.callnote
              ? `${matchingRegistration?.formdata?.callnote._id}|${matchingRegistration?.formdata?.callnote?.callNotes}`
              : ""
          }
          console.log("hhhh")
          console.log(callData)
          console.log(callData?.callDetails?.customerid.selected)
          const selectedData =
            callData?.callDetails?.customerid.selected?.map((sel) => ({
              company_id: sel?.company_id,
              companyName: sel?.companyName,
              amcEndDate: sel?.amcEndDate,
              branch_id: sel?.branch_id,
              branchName: sel?.branchName,
              product_id: sel?.product_id,
              productName: sel?.productName,
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
              productorservicetype: sel?.productorservicetype,
              taggedLicenses:
                sel?.taggedLicenses ||
                sel?.licenseNumbers ||
                sel?.taggeddata?.map((item) => String(item?.licensenumber)) ||
                [],
              taggeddata: sel?.taggeddata || [],
              selected: sel?.licensenumber === license
            })) || []
          console.log(selectedData)
          setcallupdate(true)
          console.log(selectedData)
          setTableData(selectedData)
          setLoader(false)
          reset(editData)
          setIsRunning(true)

          setStartTime(new Date())
          refreshHook()
        })
        .catch((error) => {
          console.error("Error fetching call details:", error)
        })
    }
  }, [calldetails])

  const fetchCallDetails = async (callId) => {
    setLoader(true)
    const response = await api.get(`/customer/getcallregister/${callId}`)
    return response.data
  }

  useEffect(() => {
    if (registeredCall) {
      const sortedData = registeredCall.callregistration.sort((a, b) => {
        if (a.formdata.status === "pending" && b.formdata.status === "solved") {
          return -1
        }
        if (a.formdata.status === "solved" && b.formdata.status === "pending") {
          return 1
        }
        return 0 // No sorting for calls with the same status
      })
      setCallData(sortedData)
      setSubmitLoading(false)
    }
    // else if (registeredCall && afterCallsubmitting) {
    // }
  }, [registeredCall])

  useEffect(() => {
    // Set the default product if there's only one
    if (productDetails?.length === 1) {
console.log(productDetails)
      setSelectedProducts([productDetails[0]])
    }
  }, [productDetails])

  const handleCheckboxChange = (e, product) => {
    if (e.target.checked) {
      // setSelectedProducts(product)
      setSelectedProducts([product])
    } else if (selectedProducts.productName === product.productName) {
      setSelectedProducts([]) // Deselect if it was previously selected
    }
  }
  const formatDateToDDMMYYYY = (dateValue) => {
    if (!dateValue) return ""
    const date = new Date(dateValue)
    if (Number.isNaN(date.getTime())) return ""
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }
  const formatDateForInput = (date) => {
    if (!date) return ""
    return String(date).split("T")[0]
  }
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
    const filteredloggedUserItem = data?.userWiseResults.filter(
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
  function generateUniqueNumericToken(length = 10) {
    const timestamp = Math.floor(Date.now() / 1000) // Current time in seconds
    const randomPart = Math.floor(Math.random() * 10 ** (length - 6)) // Random number with remaining digits
    const token = `${timestamp % 10 ** 6}${randomPart
      .toString()
      .padStart(length - 6, "0")}` // Ensure length

    return token
  }
  function timeStringToSeconds(timeString) {
    const [hours, minutes, seconds] = timeString.split(":").map(Number)
    return hours * 3600 + minutes * 60 + seconds
  }

  const setDateandTime = (dateString) => {
    const dateObj = new Date(dateString)

    const date = dateObj.toLocaleDateString("en-GB") // Format: DD/MM/YYYY
    const time = dateObj.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true // ✅ Enables 12-hour format with AM/PM
    })

    return `${date} ${time}` // Example: "03/02/2025 02:48:57 PM"
  }
  console.log(selectedLicenseNumber)
  const stopTimer = async (time, product) => {
    if (!product) {
      toast.error("No product selected.")
      return
    }
    console.log(product)

    setSubmitLoading(true)

    const userData = localStorage.getItem("user")
    const user = JSON.parse(userData)

    const endTime = new Date().toISOString()
    const durationInSeconds = timeStringToSeconds(time)
    // Save timer value in local storage
    if (!token) {
      const branchName = product?.branch_id?.branchName

      const uniqueToken = generateUniqueNumericToken()

      const timeData = {
        startTime: startTime.toISOString(),
        endTime: endTime,
        duration: durationInSeconds,
        time,
        token: uniqueToken
      }

      const updatedformData = { ...formData }
      const [selectedId, selectedText] = updatedformData.callnote.split("|")
      updatedformData.callnote = selectedId

      if (updatedformData.status === "pending") {
        updatedformData.attendedBy = {
          callerId: user._id,
          role: user.role,
          duration: timeData.duration,
          calldate: startTime
        }

        updatedformData.completedBy = [] // Clear completedBy if status is pending
      } else if (updatedformData.status === "solved") {
        updatedformData.attendedBy = {
          callerId: user._id,
          role: user?.role,
          duration: timeData?.duration,
          calldate: startTime
        }
        updatedformData.completedBy = {
          callerId: user._id,
          role: user.role,
          duration: timeData?.duration,
          calldate: startTime
        }
        // Set both attendedBy and completedBy if status is solved
      }
      const calldata = {
        product: selectedProducts[0]?.product_id,
        license: selectedProducts[0]?.licensenumber,
        branchName: Array.isArray(selectedProducts[0]?.branch_id?.branchName)
          ? selectedProducts[0]?.branch_id?.branchName
          : [selectedProducts[0]?.branch_id?.branchName],

        timedata: timeData,
        formdata: updatedformData,
        customeremail: selectedCustomer?.email,
        customerName: selectedCustomer?.customerName,
        productName: selectedProducts[0]?.productName
      }

      setcallReport(calldata)

      if (!calldata.branchName) {
        console.log(calldata.branchName)
        alert("Unable to load branch details. Please refresh and try again.")

        return
      }
      console.log(calldata)

      const response = await api.post(
        `/customer/callRegistration?customerid=${selectedCustomer._id}&customer=${selectedCustomer.customerName}&branchName=${branchName}&username=${user.name}`,
        calldata,

        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json" // Ensure the correct content type
          }
        }
      )
      if (response.status === 200) {
        toast.success(response.data.message)
        setSubmitLoading(false)

        setSelectedProducts([])
        setSelectedCustomer(null)
        setCustomerData([])
        setSearching(false)
        // socket.emit("updatedCalls")
        sendWhatapp(calldata, selectedText)
        setSearch("")
      } else if (response.status === 207) {
        setSubmitLoading(false)
        toast.success(response.data.message)
        setSelectedProducts([])
        setSelectedCustomer(null)
        setCustomerData([])
        setSearching(false)
        // socket.emit("updatedCalls")
        sendWhatapp(calldata, selectedText)
        setSearch("")
      } else {
        toast.error(response.data.message)
      }
    } else {
console.log(product)
console.log(selectedProducts)

      const branchName = product?.branchName
      console.log(branchName)
      const timeData = {
        startTime: startTime.toISOString(),
        endTime: endTime,
        duration: durationInSeconds,
        time,
        token: token
      }

      const updatedformData = { ...formData }
      const [selectedId, selectedText] = updatedformData.callnote.split("|")
      updatedformData.callnote = selectedId

      if (updatedformData.status === "pending") {
        updatedformData.attendedBy = {
          callerId: user._id,
          role: user.role,
          duration: timeData.duration,
          calldate: startTime
        }

        updatedformData.completedBy = "" // Clear completedBy if status is pending
      } else if (updatedformData.status === "solved") {
        updatedformData.attendedBy = {
          callerId: user._id,
          role: user.role,
          duration: timeData.duration,
          calldate: startTime
        }
        updatedformData.completedBy = {
          callerId: user._id,
          role: user.role,
          duration: timeData.duration,
          calldate: startTime
        }
        // Set both attendedBy and completedBy if status is solved
      }

      const calldata = {
        product: selectedProducts[0]?.product_id,
        license: selectedProducts[0]?.licensenumber,

        branchName: Array.isArray(selectedProducts[0]?.branchName)
          ? selectedProducts[0]?.branchName
          : [selectedProducts[0]?.branchName],
        timedata: timeData,
        formdata: updatedformData,
        customeremail: selectedCustomer.email,
        customerName: selectedCustomer.customerName,
        productName: selectedProducts[0]?.productName
      }

      setcallReport(calldata)
      if (!calldata.branchName) {
        console.log("if branchname is null", calldata.branchName)
        alert("Unable to load branch details. Please refresh and try again.")

        return
      }
      console.log(calldata)

      const response = await api.post(
        `/customer/callRegistration?customerid=${selectedCustomer._id}&customer=${selectedCustomer.customerName}&branchName=${branchName}&username=${user.name}`,
        calldata,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "application/json" // Ensure the correct content type
          }
        }
      )
      if (response.status === 200) {
        toast.success(response.data.message)
        setSubmitLoading(false)
        setCustomerData([])
        setSearch("")
        setSearching(false)
        setSelectedCustomer(null)
        setSelectedProducts([])
        // socket.emit("updatedCalls")
        sendWhatapp(calldata, selectedText)
      } else if (response.status === 207) {
        setSubmitLoading(false)
        setCustomerData([])
        setSearch("")
        setSearching(false)
        setSelectedCustomer(null)
        setSelectedProducts([])
        // socket.emit("updatedCalls")
        sendWhatapp(calldata, selectedText)
        toast.success(response.data.message)
      } else {
        toast.error(response.data.message)
      }
    }
    setselectedlicense(null)
  }
  const closePopup = () => {
    setShowProductPopup(false)
    setPopupType("")
    setEditIndex(null)
    // clearErrors()
  }

  const handleSelectCard = (item, index) => {
    console.log(item)
    const checkedlicense = item?.licensenumber
    setselectedlicense(checkedlicense)
    const filteredlicenseproduct = productDetails.filter(
      (item) => item.licensenumber === checkedlicense
    )
    console.log(productDetails)
    setSelectedProducts(filteredlicenseproduct)
    // setSelectedCard((prev) => (prev === index ? null : index))
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

    const companyOption = item?.company_id
      ? { label: item?.company_id?.companyName, value: item?.company_id }
      : null

    const branchOption = item?.branch_id
      ? { label: item?.branch_id?.branchName, value: item?.branch_id }
      : null

    const taggedLicensesFromData =
      item?.taggeddata?.map((entry) => String(entry?.licensenumber)) ||
      item?.taggedLicenses ||
      []

    // const taggedLicenseDueDatesFromData =
    //   item?.taggeddata?.reduce((acc, entry) => {
    //     if (entry?.licensenumber) {
    //       acc[String(entry.licensenumber)] = entry?.nextDue || ""
    //     }
    //     return acc
    //   }, {}) || {}
    const taggedLicenseDueDatesFromData =
      item?.taggeddata?.reduce((acc, entry) => {
        if (entry?.licensenumber) {
          acc[String(entry.licensenumber)] = {
            nextDue: entry?.nextDue || "",
            productAmount: entry?.productAmount ?? "",
            taxexclusiveAmount: entry?.taxexclusiveAmount ?? "",
            taxinclusiveamount: entry?.taxinclusiveamount ?? "",
            hsn: entry?.hsn ?? ""
          }
        }
        return acc
      }, {}) || {}

    setCompanyOptions(getCompaniesForProduct(item?.productid))
    setBranchOptions(getBranchesForCompany(item?.productid, item?.companyid))
    console.log(item)
    const a = formatDateToDDMMYYYY(item?.applicationDate)
    console.log(a)
    const inputDateFormat = item?.applicationDate
      ? new Date(item.applicationDate).toISOString().split("T")[0]
      : ""
    reset({
      ...getValues(),
      productName: productOption,
      companyName: companyOption,
      branchName: branchOption,
      licensenumber: item?.licensenumber || "",
      softwareTrade: item?.softwareTrade || "",
      applicationDate: inputDateFormat,
      nextDue: item?.nextDue || "",
      shortName: item?.shortName,
      noofusers: item?.noofusers || "",
      productAmount: item?.productAmount || "",
      isActive: item?.isActive || "Running",
      taggedLicenses: taggedLicensesFromData,
      taggedLicenseDueDates: taggedLicenseDueDatesFromData
    })

    setShowProductPopup(true)
  }
  console.log(selectedLicenseNumber)
  const formatTableToText = (calldata, selectedText) => {
    const date = formatDate(calldata.timedata.startTime)
    return `
    Date:       \t${date}
Token:      \t${calldata?.timedata?.token}
Organization:\t${calldata?.customerName}
Contact No: \t+91 ${calldata?.formdata?.incomingNumber}
Product Name:\t${calldata?.productName}
Serial No:  \t${calldata?.license}
Call Status:\t${
      calldata.formdata.status === "solved"
        ? "Closed"
        : calldata?.formdata?.status
    }
Problem:    \t${selectedText}
  `.trim()
  }
  const sendWhatapp = (calldata, callnote) => {
    if (
      !calldata?.formdata?.incomingNumber ||
      calldata?.formdata?.status === "solved"
    ) {
      setafterCallSubmitting(true)
      console.error("Incoming number is missing in calldata.")
      return
    }

    // let whatsappWindow
    let whatsappUrl
    const phoneNumber = `+91${calldata.formdata.incomingNumber}`
    const Description = getCallDescription(calldata.formdata.description)
    const textToShare = `${calldata.customerName} - ${phoneNumber}\nCallnote: ${callnote}\nDescription:${Description}`

    // if (calldata.formdata.status === "solved") {
    //   const message = formatTableToText(calldata, selectedText)

    //   whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(
    //     message
    //   )}&phone=${phoneNumber}`

    // } else {
    //   // Open WhatsApp Web with the message
    //   whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(
    //     textToShare
    //   )}`
    // }
    // const isMobile = /iPhone|Android/i.test(navigator.userAgent)

    whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(
      textToShare
    )}`
    const userConfirmed = window.confirm(
      "Do you have WhatsApp Web open and logged in? Click OK to continue, or Cancel to abort."
    )

    if (!userConfirmed) {
      console.log("userconfirmed", userConfirmed)
      setafterCallSubmitting(true)
      return
    }

    const whatsappWindow = window.open(whatsappUrl, "_blank")

    if (!whatsappWindow) {
      console.log(whatsappUrl)
      alert("whats app web is not connected please connect.")
    } else {
      console.log(whatsappUrl)
      setafterCallSubmitting(true)
    }
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
  const fetchCustomerData = async (query) => {
    try {
      const params = { search: query, role: user.role }
      if (user.role !== "Admin") params.userBranch = JSON.stringify(branch)
      const { data: result } = await api.get("/customer/getCustomer", { params })
      setCustomerData(result.data || [])
      setMessage(result.data?.length ? "" : result.message)
      setSearching(true)
      const userData = localStorage.getItem("user")
      setUser(JSON.parse(userData))
    } catch (error) {
      setCustomerData([])
      setMessage(error.response?.data?.message || "Unable to search customers. Please try again.")
      console.error("Error fetching customer data:", error.message)
    } finally {
      setloading(false)
    }
  }

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
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) {
      return "0 hr 0 min 0 sec"
    }
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hrs} hr ${mins} min ${secs} sec`
  }

  const handleInputChange = useCallback((e) => {
    setselectedlicense(null)
    setafterCallSubmitting(false)
    setSelectedCustomer(null)

    const value = e.target.value

    setSearch(value)

    // Clear the existing timeout whenever the user types
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Set a new timeout to update `message` and `customerData`
    debounceTimeoutRef.current = setTimeout(() => {
      if (value === "") {
        setMessage("")
        setCustomerData([])
      }
    }, 300) // Adjust the delay time to your preference (e.g., 300 ms)
  }, [])
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
        console.log(data[0].selected)
        const selectedData =
          data[0].selected?.map((sel) => ({
            company_id: sel?.company_id?._id,
            companyName: sel?.company_id?.companyName,
            amcendDate: sel?.amcendDate,
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
        console.log(selectedData)
        setTableData(selectedData)
        const filteredlicenseproduct = data[0].selected.filter(
          (item) => item.licensenumber === lic
        )
        console.log(filteredlicenseproduct)
        setSelectedProducts(filteredlicenseproduct)
        setselectedlicense(lic)
        // For example, set it to state to display in a modal or another component
        // setSelectedCustomer(data);
      } catch (error) {
        console.error("Error fetching customer:", error)
      }
    }

    fetchCustomer()
    setSearching(false)
    setCallData([])

    if (customer) {
      reset({
        incomingNumber: "",
        token: "",
        description: "",
        solution: ""
      })
      setIsRunning(true)
      const currentTime = new Date()

      setStartTime(currentTime)
      // refreshHook()
    } else {
      setIsRunning(false)
    }

    // Additional actions can be performed here (e.g., populate form fields)
  }
  const hanldeCheckforsamecallnoteforsamecustomer = (data) => {
    const callnoteId = data.split("|")[0]

    const checkcallnote = async () => {
      try {
        const response = await api.get(
          `/customer/checkexistsamecallnote?customerId=${selectedCustomer._id}&callNoteId=${callnoteId}`
        )
        setissamecallnote(response.data.exists)

        setIsModalOpen(response.data.exists)

        console.log("checkcallnotexists", response.data.exists)
      } catch (error) {
        console.log("error", error)
      }
    }
    checkcallnote()
  }
  const primaryProducts = useMemo(() => {
    return tableData.filter(
      (item) =>
        String(item?.productorservicetype).toLowerCase() === "primaryproduct"
    )
  }, [tableData])
  console.log(tableData)
  console.log(primaryProducts)
  const additionalServices = useMemo(() => {
    return tableData.filter(
      (item) =>
        String(item?.productorservicetype).toLowerCase() === "additionalservice"
    )
  }, [tableData])

  console.log(primaryProducts)
  const onSubmit = async (data) => {
    if (selectedProducts && selectedProducts?.length === 0) {
      // alert("please select aprodut")
      toast.error("Please select a product", {
        position: "top-center",
        autoClose: 3000 // 3 seconds
      })
      return
    } else if (issamecallnote) {
      setIsModalOpen(true)
    } else {
      setIsRunning(false)
    }

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
  }) => {
    return (
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
  }
  // const ProductCircleCard = ({
  //   item,
  //   actualIndex,
  //   productType,
  //   variant,
  //   line1,
  //   line2,
  //   line3,
  //   line4,
  //   line5,
  //   onEdit,
  //   onDelete,
  //   isSelected,
  //   onSelect,
  //   isreadonly = false
  // }) => {
  //   console.log(line5)
  //   console.log(isSelected)
  //   const variantClass =
  //     variant === "danger"
  //       ? "bg-[#ffdedd] border-[#f4c6c2]"
  //       : variant === "service"
  //         ? "bg-[#fff3c9] border-[#f0e1a2]"
  //         : "bg-[#dff3d2] border-[#cce6bc]"

  //   return (
  //     <div className="group relative inline-block">
  //       {isSelected && (
  //         <div className="absolute -right-1 -top-1 z-20 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white shadow-md">
  //           <Check size={15} strokeWidth={3} />
  //         </div>
  //       )}

  //       <button
  //         type="button"
  //         onClick={() => {
  //           console.log(callupdate)
  //           if (callupdate) return
  //           onSelect(item, actualIndex)
  //         }}
  //         className={`relative flex h-[120px] w-[124px] flex-col items-center justify-center rounded-full border text-center shadow-sm transition hover:scale-[1.02] ${variantClass} ${
  //           isSelected ? "ring-2 ring-emerald-500 ring-offset-2" : ""
  //         }`}
  //       >
  //         <div className="flex w-[90px] flex-col items-center justify-center">
  //           <p className="w-full break-words text-center text-[10px] font-medium leading-[12px] text-[#1e293b] line-clamp-2">
  //             {line1}
  //           </p>

  //           {line2 ? (
  //             <p className="mt-1 w-full truncate text-center text-[10px] font-medium leading-[12px] text-[#4b5563]">
  //               {line2}
  //             </p>
  //           ) : null}

  //           {line3 ? (
  //             <p className="mt-1 w-full whitespace-nowrap text-center text-[10px] font-semibold leading-[10px] text-[#d35c5c]">
  //               {productType === "Primaryproduct" ? "Date" : "Due"} : {line3}
  //             </p>
  //           ) : null}

  //           {line4 ? (
  //             <p
  //               className={`mt-1 w-full truncate text-center text-[9px] font-bold leading-[11px] ${
  //                 line4 === "Active" ? "text-green-600" : "text-orange-500"
  //               }`}
  //             >
  //               {line4}
  //             </p>
  //           ) : null}

  //           {line5 ? (
  //             <p className="mt-1 w-full truncate text-center text-[9px] font-bold leading-[11px] text-[#0b66e6]">
  //               Amount : {line5}
  //             </p>
  //           ) : null}
  //         </div>
  //       </button>

  //       <div className="absolute -right-2 -top-2 z-30 hidden gap-1 group-hover:flex">
  //         <button
  //           type="button"
  //           onClick={() => onEdit(item, actualIndex)}
  //           className="rounded-full bg-white p-2 text-green-600 shadow"
  //         >
  //           <FaEdit size={10} />
  //         </button>
         
  //       </div>
  //     </div>
  //   )
  // }
const ProductCircleCard = ({
  item,
  actualIndex,
  productType,
  variant,
  line1,
  line2,
  line3,
  line4,
  line5,
  onEdit,
  onDelete,
  isSelected,
  onSelect,
  isreadonly = false
}) => {
  const variantClass =
    variant === "danger"
      ? "bg-[#ffdedd] border-[#f4c6c2]"
      : variant === "service"
      ? "bg-[#fff3c9] border-[#f0e1a2]"
      : "bg-[#dff3d2] border-[#cce6bc]";

  return (
    <div className="group relative inline-block">
      {/* Selected Tick */}
      {isSelected && (
        <div className="absolute -left-1 -top-1 z-20 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-white shadow-lg">
          <Check size={15} strokeWidth={3} />
        </div>
      )}

      {/* Card */}
      <button
        type="button"
        onClick={() => {
          if (callupdate) return;
          onSelect(item, actualIndex);
        }}
        className={`relative flex h-[120px] w-[124px] flex-col items-center justify-center rounded-full border text-center shadow-sm transition duration-200 hover:scale-[1.02] ${variantClass} ${
          isSelected ? "ring-2 ring-emerald-500 ring-offset-2" : ""
        }`}
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
              {productType === "Primaryproduct" ? "Date" : "Due"} : {line3}
            </p>
          )}

          {line4 && (
            <p
              className={`mt-1 w-full truncate text-center text-[9px] font-bold leading-[11px] ${
                line4 === "Active"
                  ? "text-green-600"
                  : "text-orange-500"
              }`}
            >
              {line4}
            </p>
          )}

          {line5 && (
            <p className="mt-1 w-full truncate text-center text-[9px] font-bold leading-[11px] text-[#0b66e6]">
              Amount : {line5}
            </p>
          )}
        </div>
      </button>

      {/* Edit Button */}
      {isreadonly && (
        <div className="absolute -bottom-2 -right-2 z-30 hidden group-hover:flex">
          <button
            type="button"
            onClick={() => onEdit(item, actualIndex)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-green-600 shadow-lg transition hover:scale-110 hover:bg-green-50"
          >
            <Eye size={11} />
          </button>
        </div>
      )}
    </div>
  );
};

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
      padding: "0 8px"
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: "36px"
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
      overflow: "hidden",
      borderRadius: "10px",
      border: "1px solid #dfe5ee",
      boxShadow: "0 14px 30px rgba(15, 23, 42, 0.14)"
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    menuList: (base) => ({ ...base, padding: "4px" }),
    option: (base, state) => ({
      ...base,
      borderRadius: "7px",
      padding: "8px 10px",
      fontSize: "12px",
      backgroundColor: state.isSelected
        ? "#e0ecff"
        : state.isFocused
          ? "#f1f5f9"
          : "white",
      color: state.isSelected ? "#1d4ed8" : "#334155"
    })
  }
  const renderRows = (statusType) => {
    const today = new Date().toISOString().split("T")[0]

    return callData
      .filter((item) =>
        statusType === "pending"
          ? item?.formdata?.status === "pending"
          : item?.formdata?.status === "solved"
      )
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
  const formattedCallData =
    loggeduserCurrentDateCalls?.flatMap((customer) =>
      customer.callregistration.map((call) => ({
        ...call,

        // Add customer name if you need it later
        customerName: customer.customerName,

        // Convert productDetails -> product
        product: call.product || {
          productName: call.productDetails?.[0]?.productName || "N/A"
        }
      }))
    ) || []
  return (
    <div className="h-full bg-[#ADD8E6] overflow-hidden">
      <div className="flex h-full flex-row overflow-hidden">
        {/* <StaticSidebar
          handleMoreClick={handleMoreClick}
          selectedCompanyBranch={selectedcompanyBranch}
          setselectedCompanyBranch={setselectedcompanyBranch}
          parenttargetData={settargetData}
          parentperiodmode={periodMode}
          parentyear={selectedYear}
          setselectedPeriod={setselectedPeriod}
        /> */}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {/* <header className="flex shrink-0 items-center justify-between bg-[#ADD8E6]">
            {user?.role?.toLowerCase() === "admin" ? (
              <AdminHeader hide={true} />
            ) : (
              <StaffHeader hide={true} />
            )}

            <div className="flex h-full items-center gap-1.5 bg-[#ADD8E6] px-3">
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

          {loader && (
            <BarLoader
              cssOverride={{ width: "100%", height: "4px" }}
              color="#4A90E2"
            />
          )}

          <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden ">
            <div className="flex min-h-0 min-w-0 flex-1 justify-center overflow-y-auto p-2 sm:p-3 lg:p-4">
              <div className="flex h-fit min-h-full w-full max-w-7xl flex-col rounded-xl bg-[#ADD8E6] p-3  sm:p-4 lg:p-5">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold sm:text-xl">
                    Call Registration
                  </h2>

                  <div className="flex justify-start sm:justify-end">
                    <Link
                      to={
                        user?.role === "Admin" ? "/admin/home" : "/staff/home"
                      }
                      className="inline-flex items-center rounded-md bg-gradient-to-r from-blue-500 to-blue-700 px-3 py-1.5 text-xs font-medium text-white shadow-lg transition hover:from-blue-600 hover:to-blue-800"
                    >
                      Go Home
                    </Link>
                  </div>
                </div>

                <hr className="mb-3 border-t-2 border-black" />

                {/* -------------------- SEARCH INPUT -------------------- */}
                <div className="w-full md:max-w-xl">
                  <div className="relative">
                    <label
                      htmlFor="customerName"
                      className="block text-xs font-medium text-gray-700"
                    >
                      Search Customer
                    </label>

                    <div className="relative">
                      <input
                        type="text"
                        id="customerName"
                        name="customer-search"
                        value={search}
                        onChange={handleInputChange}
                        autoComplete="off"
                        spellCheck={false}
                        aria-autocomplete="none"
                        className="mt-1 block w-full rounded-md border border-gray-300 p-1.5 pr-10 text-sm shadow-sm outline-none focus:border-gray-500"
                        placeholder="Enter name or license..."
                      />

                      {loading && (
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                          <ClipLoader
                            color="#36D7B7"
                            loading={loading}
                            size={18}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* -------------------- TODAY'S CALL LIST -------------------- */}
                {!search &&
                  loggeduserCurrentDateCalls &&
                  loggeduserCurrentDateCalls?.length > 0 && (
                    <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50/60 p-3 shadow-sm">
                      <h1 className="mb-2 inline-block border-b-2 border-black text-sm font-semibold sm:text-base">
                        Your Today's Call list
                      </h1>
                      <CallDataExtendedTable
                        callData={formattedCallData}
                        from="callregistration"
                        maxHeight="500px"
                      />
                    </div>
                  )}

                {/* -------------------- SEARCH RESULTS -------------------- */}
                {searching && customerData?.length > 0 ? (
                  <div className="mt-3 w-full max-w-xl overflow-hidden rounded-lg border border-gray-200 shadow-md">
                    <div className="max-h-52 overflow-auto">
                      <table className="min-w-full bg-white">
                        <thead className="sticky top-0 z-20 border-b border-green-300 bg-green-300 shadow">
                          <tr>
                            <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                              Customer Name
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
                              License No
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider text-gray-600">
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
                                    handleRowClick(
                                      customer,
                                      item?.licensenumber
                                    )
                                  }
                                  className="cursor-pointer transition-colors hover:bg-gray-50"
                                >
                                  <td className="px-3 py-2 text-center text-sm text-gray-700">
                                    {customer?.customerName}
                                  </td>
                                  <td className="px-3 py-2 text-center text-sm text-gray-700">
                                    {item?.licensenumber}
                                  </td>
                                  <td className="px-3 py-2 text-center text-sm text-gray-700">
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
                  <div className="ml-1 mt-2 text-sm text-red-500">
                    {message}
                  </div>
                )}

                {selectedCustomer && (
                  <>
                    {/* ==================== CUSTOMER DETAILS CARD ==================== */}
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
                          onClick={() =>
                            setShowCustomerDetails((prev) => !prev)
                          }
                          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-blue-700"
                        >
                          {showCustomerDetails
                            ? "Hide Details"
                            : "Expand Details"}
                        </button>
                      </div>

                      <div className="bg-white p-3 md:p-4">
                        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-4">
                          <InfoInputCard
                            icon={<FaUser size={12} />}
                            iconBg="bg-[#edf6ff]"
                            iconColor="text-[#5aa2ff]"
                            label="Customer Name"
                            error={errors.customerName?.message}
                          >
                            <input
                              type="text"
                              value={
                                typeof selectedCustomer?.customerName ===
                                "string"
                                  ? selectedCustomer?.customerName?.toUpperCase()
                                  : selectedCustomer?.customerName || ""
                              }
                              className={tileInputClass}
                            />
                          </InfoInputCard>

                          {showCustomerDetails && (
                            <InfoInputCard
                              icon={<FaHashtag size={12} />}
                              iconBg="bg-[#f4efff]"
                              iconColor="text-[#8a5eff]"
                              label="Pincode"
                            >
                              <input
                                type="number"
                                value={selectedCustomer?.pincode}
                                className={tileInputClass}
                              />
                            </InfoInputCard>
                          )}

                          {showCustomerDetails && (
                            <InfoInputCard
                              icon={<FaBuilding size={12} />}
                              iconBg="bg-[#fff4ea]"
                              iconColor="text-[#f0a24d]"
                              label="City"
                            >
                              <input
                                type="text"
                                value={selectedCustomer?.city}
                                className={tileInputClass}
                                placeholder="City"
                              />
                            </InfoInputCard>
                          )}

                          {showCustomerDetails && (
                            <InfoInputCard
                              icon={<FaEnvelope size={12} />}
                              iconBg="bg-[#eefbf2]"
                              iconColor="text-[#4cbf73]"
                              label="Email"
                              error={errors.email?.message}
                            >
                              <input
                                type="email"
                                value={selectedCustomer?.email}
                                className={tileInputClass}
                              />
                            </InfoInputCard>
                          )}

                          {showCustomerDetails && (
                            <InfoInputCard
                              icon={<FaMapMarkerAlt size={12} />}
                              iconBg="bg-[#fff0f8]"
                              iconColor="text-[#ef7db2]"
                              label="Address 1"
                            >
                              <input
                                value={selectedCustomer?.address1}
                                className={tileInputClass}
                              />
                            </InfoInputCard>
                          )}

                          {showCustomerDetails && (
                            <InfoInputCard
                              icon={<FaUser size={12} />}
                              iconBg="bg-[#ebfbfb]"
                              iconColor="text-[#43c7cb]"
                              label="Contact Person"
                            >
                              <input
                                type="text"
                                value={selectedCustomer?.contactPerson}
                                className={tileInputClass}
                              />
                            </InfoInputCard>
                          )}

                          <InfoInputCard
                            icon={<FaPhone size={12} />}
                            iconBg="bg-[#edf9f0]"
                            iconColor="text-[#45bf6b]"
                            label="Mobile No"
                          >
                            <input
                              type="tel"
                              value={selectedCustomer?.mobile}
                              className={tileInputClass}
                            />
                          </InfoInputCard>

                          <InfoInputCard
                            icon={<FaLandmark size={12} />}
                            iconBg="bg-[#fff8df]"
                            iconColor="text-[#d1a91b]"
                            label="Partnership"
                          >
                            <input
                              type="text"
                              value={
                                selectedCustomer?.partner?.[0]?.partner ||
                                selectedCustomer?.partner?.partner ||
                                "N/A"
                              }
                              className={tileInputClass}
                            />
                          </InfoInputCard>

                          {showCustomerDetails && (
                            <InfoInputCard
                              icon={<FaMapMarkerAlt size={12} />}
                              iconBg="bg-[#eef5ff]"
                              iconColor="text-[#3879f2]"
                              label="Address 2"
                            >
                              <input
                                type="text"
                                value={selectedCustomer?.address2}
                                className={tileInputClass}
                              />
                            </InfoInputCard>
                          )}

                          {showCustomerDetails && (
                            <InfoInputCard
                              icon={<FaBuilding size={12} />}
                              iconBg="bg-[#edf7ff]"
                              iconColor="text-[#4f98ff]"
                              label="State"
                            >
                              <input
                                type="text"
                                value={selectedCustomer?.state}
                                className={tileInputClass}
                              />
                            </InfoInputCard>
                          )}

                          {showCustomerDetails && (
                            <InfoInputCard
                              icon={<FaGlobeAsia size={12} />}
                              iconBg="bg-[#fff2e8]"
                              iconColor="text-[#ef9a47]"
                              label="Country"
                            >
                              <input
                                type="text"
                                value={selectedCustomer?.country}
                                className={tileInputClass}
                              />
                            </InfoInputCard>
                          )}

                          {showCustomerDetails && (
                            <InfoInputCard
                              icon={<FaPhone size={12} />}
                              iconBg="bg-[#fff1f6]"
                              iconColor="text-[#f07ab1]"
                              label="Landline No"
                            >
                              <input
                                type="tel"
                                value={selectedCustomer?.landline}
                                className={tileInputClass}
                              />
                            </InfoInputCard>
                          )}

                          {/* {showCustomerDetails && (
                            <InfoInputCard
                              icon={<FaStar size={12} />}
                              iconBg="bg-[#eef4ff]"
                              iconColor="text-[#6d86ff]"
                              label="Industry"
                            >
                              <input
                                type="text"
                                value={selectedCustomer?.industry}
                                className={tileInputClass}
                              />
                            </InfoInputCard>
                          )} */}

                          {showCustomerDetails && (
                            <InfoInputCard
                              icon={<FaHashtag size={12} />}
                              iconBg="bg-[#f5f0ff]"
                              iconColor="text-[#9967ff]"
                              label="Registration Type"
                              error={errors.registrationType?.message}
                            >
                              <input
                                type="text"
                                value={selectedCustomer?.registrationType}
                                className={tileInputClass}
                              />
                            </InfoInputCard>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* ==================== PRODUCT DETAILS CARD ==================== */}
                    <div className="mt-3 rounded-lg border border-slate-200 bg-gray-50 p-3 shadow-sm">
                      <div className="mb-2.5 border-b border-slate-200 pb-2">
                        <h3 className="text-sm font-semibold text-slate-800">
                          Product Details
                        </h3>
                        <p className="text-xs text-slate-500">
                          Primary products and additional services for this
                          customer
                        </p>
                      </div>

                      <div className="flex flex-col gap-3 xl:flex-row">
                        <div className="min-h-[140px] w-full rounded-lg border border-slate-100 bg-white px-3 py-4 xl:w-1/2">
                          <h2 className="mb-3 text-sm font-medium">
                            Primary Products
                          </h2>
                          {/* {primaryProducts.length > 0 ? (
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,120px))] justify-center gap-x-6 gap-y-6 sm:justify-start">
                              {primaryProducts.map((item, index) => {
                                const actualIndex = primaryProducts.findIndex(
                                  (x) => x === item
                                )
                                const isDeactive =
                                  String(item?.isActive).toLowerCase() ===
                                  "deactive"
                                console.log(item)
                                console.log(item?.licensenumber)
                                console.log(selectedLicenseNumber)
                                const isSelected =
                                  String(item?.licensenumber ?? "") ===
                                  String(selectedLicenseNumber ?? "")
                                console.log(isSelected)
                                // const matchedamc=item?.selected.find((item)=>item?.product_id?.branch_id)
                                return (
                                  <>
                                    <ProductCircleCard
                                      key={`primary-${actualIndex}`}
                                      item={item}
                                      actualIndex={actualIndex}
                                      productType="Primaryproduct"
                                      variant={
                                        isDeactive ? "danger" : "success"
                                      }
                                      topBadgeIcon={<FaBuilding size={10} />}
                                      line1={
                                        item?.shortName
                                          ? item?.shortName
                                          : item?.productName
                                      }
                                      line2={item?.licensenumber}
                                      line3={
                                        item?.applicationDate
                                          ? formatDateToDDMMYYYY(
                                              item?.applicationDate
                                            )
                                          : ""
                                      }
                                      line4={
                                        isDeactive ? "De Active" : "Active"
                                      }
                                      isSelected={isSelected}
                                      isreadonly={true}
                                      onEdit={handleEdit}
                                      onSelect={handleSelectCard}
                                    />
                                    <div>
                                      <span>amcendDate:</span>

                                      <span>{item?.amcendDate}</span>
                                    </div>
                                  </>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="flex h-[110px] items-center justify-center rounded-[12px] border border-dashed border-[#e7ebf4] bg-[#fbfcff] text-[12px] text-[#8a95ab]">
                              No primary products added.
                            </div>
                          )} */}
<div className="grid grid-cols-[repeat(auto-fill,minmax(100px,120px))] justify-center gap-x-6 gap-y-6 sm:justify-start">
  {primaryProducts.map((item) => {
    const actualIndex = primaryProducts.findIndex((x) => x === item);

    const isDeactive =
      String(item?.isActive).toLowerCase() === "deactive";

    const isSelected =
      String(item?.licensenumber ?? "") ===
      String(selectedLicenseNumber ?? "");

    return (
      <div
        key={`primary-${actualIndex}`}
        className="flex flex-col items-center"
      >
        <ProductCircleCard
          item={item}
          actualIndex={actualIndex}
          productType="Primaryproduct"
          variant={isDeactive ? "danger" : "success"}
          topBadgeIcon={<FaBuilding size={10} />}
          line1={item?.shortName || item?.productName}
          line2={item?.licensenumber}
          line3={
            item?.applicationDate
              ? formatDateToDDMMYYYY(item?.applicationDate)
              : ""
          }
          line4={isDeactive ? "De Active" : "Active"}
          isSelected={isSelected}
          isreadonly={true}
          onEdit={handleEdit}
          onSelect={handleSelectCard}
        />

        {/* AMC End Date */}
        <div className="mt-3 w-full rounded-lg bg-gray-100 px-2 py-1 text-center shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            AMC End
          </p>
          <p
            className={`text-xs font-bold ${
              item?.amcendDate
                ? "text-red-600"
                : "text-gray-400"
            }`}
          >
            {item?.amcendDate
              ? formatDateToDDMMYYYY(item.amcendDate)
              : "--"}
          </p>
        </div>
      </div>
    );
  })}
</div>
                        </div>

                        <div className="min-h-[140px] w-full rounded-lg border border-slate-100 bg-white px-3 py-4 xl:w-1/2">
                          <h2 className="mb-3 text-sm font-medium">
                            Additional Services
                          </h2>
                          {additionalServices.length > 0 ? (
                            <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,120px))] justify-center gap-x-6 gap-y-6 sm:justify-start">
                              {additionalServices.map((item) => {
                                const actualIndex =
                                  additionalServices.findIndex(
                                    (x) => x === item
                                  )
                                const isDeactive =
                                  String(item?.isActive).toLowerCase() ===
                                  "deactive"
                                const today = new Date()
                                today.setHours(0, 0, 0, 0)

                                const selectedTagged = Array.isArray(
                                  item?.taggeddata
                                )
                                  ? (() => {
                                      const tagged = [...item.taggeddata].sort(
                                        (a, b) =>
                                          new Date(a.nextDue) -
                                          new Date(b.nextDue)
                                      )

                                      // 1. Oldest overdue
                                      const overdue = tagged.find((x) => {
                                        const d = new Date(x.nextDue)
                                        d.setHours(0, 0, 0, 0)
                                        return d < today
                                      })

                                      if (overdue) return overdue

                                      // 2. Today
                                      const todayItem = tagged.find((x) => {
                                        const d = new Date(x.nextDue)
                                        d.setHours(0, 0, 0, 0)
                                        return d.getTime() === today.getTime()
                                      })

                                      if (todayItem) return todayItem

                                      // 3. Nearest future
                                      return tagged[0] || null
                                    })()
                                  : null
                                return (
                                  <ProductCircleCard
                                    key={`additional-${actualIndex}`}
                                    item={item}
                                    productType="Additionalservice"
                                    actualIndex={actualIndex}
                                    variant="service"
                                    topBadgeIcon={<FaBuilding size={10} />}
                                    line1={
                                      item?.shortName
                                        ? item?.shortName
                                        : item?.productName
                                    }
                                    line2={
                                      Array.isArray(item?.taggeddata) &&
                                      item.taggeddata.length > 0
                                        ? item.taggeddata
                                            .map((x) => x.licensenumber)
                                            .join(", ")
                                            .slice(0, 18)
                                        : item?.licensenumber
                                    }
                                    // line3={
                                    //   item?.taggeddata?.length > 0
                                    //     ? formatDateToDDMMYYYY(
                                    //         item?.taggeddata?.[0]?.nextDue
                                    //       )
                                    //     : item?.nextDue
                                    //       ? formatDateToDDMMYYYY(item?.nextDue)
                                    //       : ""
                                    // }
                                    line3={
                                      selectedTagged
                                        ? formatDateToDDMMYYYY(
                                            selectedTagged.nextDue
                                          )
                                        : item?.nextDue
                                          ? formatDateToDDMMYYYY(item.nextDue)
                                          : ""
                                    }
                                    line4={isDeactive ? "De Active" : "Active"}
                                    // line5={item?.productAmount}
                                    line5={
                                      selectedTagged
                                        ? selectedTagged.productAmount
                                        : item?.productAmount
                                    }
                                    onEdit={handleEdit}
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

                    {/* ==================== CALL INPUT CARD ==================== */}
                    <div className="mt-3 rounded-lg border border-slate-200 bg-gray-50 p-3 shadow-sm">
                      <div className="mb-3 flex flex-col items-center justify-center gap-3 border-b border-slate-200 pb-3">
                        <Timer
                          isRunning={isRunning}
                          startTime={startTime}
                          productDetails={productDetails}
                          selectedProducts={selectedProducts}
                          onStop={stopTimer}
                        />

                        <PopUp
                          isOpen={isModalOpen}
                          report={callreport}
                          onClose={() => setIsModalOpen(false)}
                          handleWhatsapp={sendWhatapp}
                          message="This customer already has a same call note with pending status please cleared that !"
                        />
                      </div>

                      <form onSubmit={handleSubmit(onSubmit)}>
                        <div className="grid grid-cols-1 gap-3 rounded-lg bg-white p-3 md:grid-cols-2 xl:grid-cols-3">
                          <div className="relative">
                            {showIncomingNumberToast && (
                              <div className="absolute -top-12 left-0 z-10 rounded-md bg-blue-500 px-3 py-1 text-xs text-white shadow-md sm:text-sm">
                                Please enter the customer's incoming number.
                                This number will be sent to the customer's email
                              </div>
                            )}

                            <label
                              htmlFor="incomingNumber"
                              className="block text-xs font-medium text-gray-700"
                            >
                              Incoming Number
                            </label>
                            <input
                              type="number"
                              id="incomingNumber"
                              {...register("incomingNumber", {
                                required: "Incoming number is required",
                                onChange: () => setshowinComingnumberToast(true)
                              })}
                              className="mt-1 block w-full rounded-md border border-gray-300 p-1.5 text-sm shadow-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0"
                              placeholder="Enter Incoming Number"
                            />
                            {errors.incomingNumber && (
                              <span className="mt-1 block text-xs text-red-600">
                                {errors.incomingNumber.message}
                              </span>
                            )}
                          </div>

                          {token && (
                            <div>
                              <label
                                htmlFor="token"
                                className="block text-xs font-medium text-gray-700"
                              >
                                Token
                              </label>
                              <input
                                disabled
                                type="text"
                                id="token"
                                {...register("token", {})}
                                className="mt-1 block w-full cursor-not-allowed rounded-md border border-gray-300 p-1.5 text-sm shadow-sm outline-none"
                              />
                            </div>
                          )}

                          <div>
                            <label
                              htmlFor="callnote"
                              className="block text-xs font-medium text-gray-700"
                            >
                              Call Notes
                            </label>

                            <Controller
                              name="callnote"
                              control={control}
                              rules={{ required: "please select a callnote" }}
                              defaultValue=""
                              render={({ field }) => {
                                const options = callnote.map((note) => ({
                                  value: `${note._id}|${note.callNotes}`,
                                  label: note.callNotes
                                }))
                                return (
                                  <Select
                                    inputId="callnote"
                                    className="mt-1"
                                    options={options}
                                    value={options.find((option) => option.value === field.value) || null}
                                    onChange={(option) => {
                                      const value = option?.value || ""
                                      field.onChange(value)
                                      hanldeCheckforsamecallnoteforsamecustomer(value)
                                    }}
                                    placeholder="Select call note"
                                    styles={compactSelectStyles}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                  />
                                )
                              }}
                            />

                            {errors.callnote && (
                              <span className="mt-1 block text-xs text-red-600">
                                {errors.callnote.message}
                              </span>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor="description"
                              className="block text-xs font-medium text-gray-700"
                            >
                              Description
                            </label>
                            <textarea
                              id="description"
                              rows="2"
                              {...register("description", {
                                maxLength: {
                                  value: 500,
                                  message:
                                    "Description cannot exceed 500 characters"
                                }
                              })}
                              className="mt-1 block w-full rounded-md border border-gray-300 p-1.5 text-sm shadow-sm outline-none focus:border-gray-500"
                              placeholder="Enter a description..."
                            />
                            {errors.description && (
                              <span className="mt-1 block text-xs text-red-600">
                                {errors.description.message}
                              </span>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor="solution"
                              className="block text-xs font-medium text-gray-700"
                            >
                              Solution
                            </label>
                            <textarea
                              id="solution"
                              rows="2"
                              {...register("solution", {
                                maxLength: {
                                  value: 500,
                                  message:
                                    "Solution cannot exceed 500 characters"
                                }
                              })}
                              className="mt-1 block w-full rounded-md border border-gray-300 p-1.5 text-sm shadow-sm outline-none focus:border-gray-500"
                              placeholder="Enter a solution..."
                            />
                            {errors.solution && (
                              <span className="mt-1 block text-xs text-red-600">
                                {errors.solution.message}
                              </span>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor="status"
                              className="block text-xs font-medium text-gray-700"
                            >
                              Status
                            </label>
                            <Controller
                              name="status"
                              control={control}
                              rules={{ required: true }}
                              defaultValue="pending"
                              render={({ field }) => {
                                const options = [
                                  { value: "pending", label: "Pending" },
                                  { value: "solved", label: "Solved" }
                                ]
                                return <Select inputId="status" className="mt-1" options={options} value={options.find((option) => option.value === field.value) || options[0]} onChange={(option) => field.onChange(option?.value)} styles={compactSelectStyles} menuPortalTarget={document.body} menuPosition="fixed" />
                              }}
                            />
                          </div>
                        </div>

                        {selectedCustomer && (
                          <div className="mt-4 flex justify-center">
                            <button
                              type="submit"
                              className="rounded-md bg-gradient-to-r from-red-500 to-red-700 px-4 py-1.5 text-sm font-medium text-white shadow-md transition-shadow duration-200 hover:shadow-lg focus:outline-none"
                            >
                              {submitLoading ? (
                                <div className="flex items-center gap-2">
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                  <span>Loading...</span>
                                </div>
                              ) : (
                                <span>End call</span>
                              )}
                            </button>
                          </div>
                        )}
                      </form>

                      <div className="mt-3 flex flex-col gap-3 border-t border-slate-200 pt-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="font-semibold text-gray-700">
                          <label
                            htmlFor="emailSend"
                            className="block text-xs font-medium text-gray-700"
                          >
                            Email Send
                          </label>
                          <Controller
                            name="emailSend"
                            control={control}
                            rules={{ required: true }}
                            defaultValue="true"
                            render={({ field }) => {
                              const options = [
                                { value: "true", label: "Yes" },
                                { value: "false", label: "No" }
                              ]
                              return <Select inputId="emailSend" className="mt-1 w-28" options={options} value={options.find((option) => option.value === String(field.value)) || options[0]} onChange={(option) => field.onChange(option?.value)} styles={compactSelectStyles} menuPortalTarget={document.body} menuPosition="fixed" />
                            }}
                          />
                        </div>

                        <Link
                          to={
                            user?.role === "Admin"
                              ? "/admin/home"
                              : "/staff/home"
                          }
                          className="text-sm font-medium text-blue-600"
                        >
                          Go Home
                        </Link>
                      </div>
                    </div>

                    {/* ==================== CALL HISTORY TABLE CARD ==================== */}
                    {callData?.length > 0 && (
                      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-gray-50 p-3 shadow-sm">
                        <div className="mb-2 border-b border-slate-200 pb-2">
                          <h3 className="text-sm font-semibold text-slate-800">
                            Call History
                          </h3>
                        </div>

                        <CallDataExtendedTable callData={callData} />
                      </div>
                    )}
                  </>
                )}
              </div>
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
                      {/* <div>
                        <label className="mb-1 block text-[11px] font-medium text-[#5d6983]">
                          Product / Service
                        </label>
                        <Controller
                          name="productName"
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              disabled={true}
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
                      </div> */}
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-[#5d6983]">
                          Product / Service
                        </label>
                        <Controller
                          name="productName"
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              isDisabled={true} // 🌟 Changed from disabled={true}
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
                      <PopupField label="Short Name">
                        <input
                          readOnly
                          {...register("shortName")}
                          className="w-full rounded-[8px] border border-[#dfe5ee] bg-[#f3f6fb] px-2.5 py-1.5 text-[12px] text-[#1f2a3d] outline-none"
                          placeholder="Enter Short Name"
                        />
                      </PopupField>

                      {popupType === "Primaryproduct" && (
                        <PopupField label="License Number">
                          <input
                            type="text"
                            inputMode="numeric"
                            {...register("licensenumber")}
                            pattern="[0-9]*"
                            readOnly={true}
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
                            onKeyDown={(e) => {
                              if (hasTaggedLicenses) return

                              const allowedKeys = [
                                "Backspace",
                                "Delete",
                                "Tab",
                                "ArrowLeft",
                                "ArrowRight",
                                "Home",
                                "End"
                              ]

                              if (allowedKeys.includes(e.key)) return

                              if (!/^\d$/.test(e.key)) {
                                e.preventDefault()
                              }
                            }}
                            onChange={(e) => {
                              console.log(hasTaggedLicenses)
                              if (hasTaggedLicenses) return

                              const numericValue = e.target.value.replace(
                                /\D/g,
                                ""
                              )
                              setValue("licensenumber", numericValue, {
                                shouldValidate: true
                              })

                              let index = 0
                              if (popupType === "Primaryproduct") {
                                if (primaryProducts.length > 0) index++
                              } else if (popupType === "Additionalservice") {
                                if (additionalServices.length > 0) index++
                              }

                              if (debounceTimersRef.current[index]) {
                                clearTimeout(debounceTimersRef.current[index])
                              }

                              debounceTimersRef.current[index] = setTimeout(
                                () => {
                                  handleLicenseBlur(numericValue)
                                  delete debounceTimersRef.current[index]
                                },
                                1000
                              )

                              clearErrors("licensenumber")
                            }}
                          />
                        </PopupField>
                      )}

                      {popupType === "Primaryproduct" && (
                        <PopupField label="Software Trade">
                          <Controller
                            name="softwareTrade"
                            control={control}
                            render={({ field }) => {
                              const options = softwareTrades.map((trade) => ({ value: trade, label: trade }))
                              return <Select inputId="softwareTrade" isDisabled options={options} value={options.find((option) => option.value === field.value) || null} styles={compactSelectStyles} />
                            }}
                          />
                        </PopupField>
                      )}

                      {popupType === "Primaryproduct" && (
                        <PopupField label="Application Date">
                          <input
                            type="date"
                            {...register("applicationDate")}
                            className={compactPopupInputClass}
                          />
                        </PopupField>
                      )}

                      {popupType === "Additionalservice" && (
                        <PopupField label="No of Quantity / Users">
                          <input
                            type="number"
                            {...register("noofusers")}
                            className={`${compactPopupInputClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0`}
                          />
                        </PopupField>
                      )}
                      {popupType === "Primaryproduct" && (
                        <PopupField label="Amount">
                          <input
                            type="number"
                            {...register("productAmount")}
                            className={`${compactPopupInputClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0`}
                          />
                        </PopupField>
                      )}

                      <PopupField label="Status">
                        <Controller
                          name="isActive"
                          control={control}
                          render={({ field }) => {
                            const options = [
                              { value: "Running", label: "Active" },
                              { value: "Deactive", label: "Deactive" }
                            ]
                            return <Select inputId="isActive" options={options} value={options.find((option) => option.value === field.value) || options[0]} onChange={(option) => field.onChange(option?.value)} styles={compactSelectStyles} menuPortalTarget={document.body} menuPosition="fixed" />
                          }}
                        />
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
                                  const checked =
                                    selectedTaggedLicenses.includes(
                                      String(licenseNo)
                                    )

                                  return (
                                    <label
                                      key={licenseNo}
                                      className="flex items-center gap-2 rounded-md border border-[#edf1f7] bg-white px-2 py-1.5 text-[11px] text-[#4f5d78]"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={(e) => {
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
                                                String(item) !==
                                                String(licenseNo)
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

                      {popupType === "Additionalservice" &&
                        hasTaggedLicenses && (
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
                                      <th className="border-b border-[#e7ebf4] px-2.5 py-1.5 text-left text-[11px] font-semibold text-[#43506a]">
                                        Product Amount
                                      </th>
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {watchedTaggedLicenses.map((licenseNo) => (
                                      <tr key={licenseNo}>
                                        <td className="border-b border-[#eef2f7] px-2.5 py-1.5">
                                          <input
                                            value={licenseNo}
                                            readOnly
                                            className="w-full cursor-not-allowed rounded-[7px] border border-[#dfe5ee] bg-[#f3f6fb] px-2 py-1.5 text-[11px] text-[#1f2a3d] outline-none"
                                          />
                                        </td>

                                        <td className="border-b border-[#eef2f7] px-2.5 py-1.5 ">
                                          <input
                                            type="date"
                                            value={formatDateForInput(
                                              watchedTaggedLicenseDueDates?.[
                                                licenseNo
                                              ]?.nextDue
                                            )}
                                            onChange={(e) => {
                                              const dueMap =
                                                watch(
                                                  "taggedLicenseDueDates"
                                                ) || {}

                                              setValue(
                                                "taggedLicenseDueDates",
                                                {
                                                  ...dueMap,
                                                  [licenseNo]: {
                                                    ...dueMap[licenseNo],
                                                    nextDue: e.target.value
                                                  }
                                                }
                                              )
                                            }}
                                            className={compactPopupInputClass}
                                          />
                                        </td>

                                        <td className="border-b border-[#eef2f7] px-2.5 py-1.5">
                                          <input
                                            type="number"
                                            value={
                                              watchedTaggedLicenseDueDates?.[
                                                licenseNo
                                              ]?.productAmount ?? ""
                                            }
                                            onChange={(e) => {
                                              const dueMap =
                                                watch(
                                                  "taggedLicenseDueDates"
                                                ) || {}

                                              setValue(
                                                "taggedLicenseDueDates",
                                                {
                                                  ...dueMap,
                                                  [licenseNo]: {
                                                    ...dueMap[licenseNo],
                                                    productAmount:
                                                      e.target.value
                                                  }
                                                }
                                              )
                                            }}
                                            className={`${compactPopupInputClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0`}
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
    </div>
  )
}
const tileInputClass =
  "w-full border-0 bg-transparent p-0 text-[12px] font-medium text-[#1f2a3d] outline-none placeholder:text-[#c0c8d8]"

const compactPopupInputClass =
  "w-full rounded-[8px] border border-[#dfe5ee] bg-white px-2.5 py-1.5 text-[12px] text-[#1f2a3d] outline-none focus:border-[#7ba7ff]"
