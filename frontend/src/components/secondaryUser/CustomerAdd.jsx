import React, { useEffect, useMemo, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import Select from "react-select"
import { Country, State } from "country-state-city"
import { useSelector } from "react-redux"
import { useForm, Controller } from "react-hook-form"
import { toast } from "react-toastify"
import FullScreenLoader from "../common/FullScreenLoader"
import api from "../../api/api"
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

import { getLocalStorageItem } from "../../helper/localstorage"
import UseFetch from "../../hooks/useFetch"
import useDebounce from "../../hooks/useDebounce"
// import { UnsavedChanges } from "../../context/UnsavedChangesContext"
import { useUnsavedChanges } from "../../context/UnsavedChangesContext"
import useUnsavedChangesPrompt from "../../hooks/useUnsavedChangesPrompt"
import UnsavedChangesModal from "../common/UnsavedChangesModal"
const CustomerAdd = ({
  navigatebackto,
  process,
  handleCustomerData,
  handleEditedData,
  customer = null
}) => {
  console.log(customer)
  const navigate = useNavigate()
  const { setHasUnsavedChanges, requestNavigation } = useUnsavedChanges()
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
    formState: { errors, isSubmitting, isDirty }
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
      isPartner: false,
      partner: "",
      partnerSelection: "",
      industry: "",
      registrationType: "",
      gstNo: "",
      licensenumber: "",
      softwareTrade: "",
      applicationDate: "",
      nextDue: "",
      noofusers: "",
      productAmount: "",
      customerIsActive: "Running",
      isActive: "Running",
      taggedLicenses: [],
      taggedLicenseDueDates: {}
    }
  })

  const loggeduserBranch = useSelector(
    (state) => state.companyBranch.loggeduserbranches
  )
  const [licenseRemoveConfirm, setLicenseRemoveConfirm] = useState({
    open: false,
    licenseNo: null
  })
const [dummyTableData,setDummyTableData]=useState([])
  const [detailsData, setdetailsData] = useState({})
  const [isSaved, setIsSaved] = useState(false)
  const [duplicatelicense, setduplicatelicense] = useState(null)
  const debounceTimersRef = useRef({})
  const [submissionloader, setsubmissionloader] = useState(false)
  const [licenseloading, setlicenseloading] = useState(false)
  const [productOptions, setProductOptions] = useState([])
  const [companyOptions, setCompanyOptions] = useState([])
  const [branchOptions, setBranchOptions] = useState([])
  const [partner, setPartner] = useState([])
  const [license, setLicense] = useState([])
  const [tableData, setTableData] = useState([])
  const [initialTableData, setInitialTableData] = useState([])
  const [licenseAvailable, setLicenseAvailable] = useState(true)
console.log(licenseAvailable)
  const [showProductPopup, setShowProductPopup] = useState(false)
  const [popupType, setPopupType] = useState("")
  const [editIndex, setEditIndex] = useState(null)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const selectedProduct = watch("productName")
  const registrationType = watch("registrationType")
  const watchedLicense = watch("licensenumber")
  const watchedTaggedLicenses = watch("taggedLicenses") || []
  const selectedCountry = watch("country")
  const isPartnerCustomer = watch("isPartner")
  const watchedTaggedLicenseDueDates = watch("taggedLicenseDueDates") || {}
  const hasTaggedLicenses =
    popupType === "Additionalservice" && watchedTaggedLicenses.length > 0

  const { data: licensenumber } = UseFetch("customer/getLicensenumber")
  const { data: partners } = UseFetch("customer/getallpartners")
  const { data: partnerCustomers } = UseFetch("customer/getPartnerCustomers")
  const { data: productData, error: productError } = UseFetch(
    loggeduserBranch &&
      `/product/getallProducts?branchselected=${encodeURIComponent(
        JSON.stringify(loggeduserBranch)
      )}`
  )

  const debouncedLicenseNo = useDebounce(watchedLicense, 1000)
  const isTableDirty =
    JSON.stringify(tableData) !== JSON.stringify(initialTableData)

  const hasUnsavedChanges = isDirty || isTableDirty
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
    "Pipes, Tubes Fittings",
    "Wholesale Trading",
    "Retail Trading",
    "Import & Export",
    "Distribution / Dealers",
    "E-commerce / Online Trading",
    "IT Services",
    "Web Design & Development",
    "Cyber Security Services",
    "Hardware & Networking",
    "Construction Companies",
    "Spare Parts Dealers",
    "Banks",
    "Printing & Publishing",
    "Pharmaceutical Manufacturing",
    "Food Manufacturing",
    "Textile / Garment Manufacturing",
    "Chemical Manufacturing",
    "Plastic Manufacturing",
    "Steel / Metal Manufacturing",
    "Furniture Manufacturing",
    "Building Contractors",
    "Real Estate Developers",
    "Property Management",
    "Transport & Logistics",
    "Finance Companies",
    "Electrical Equipment Manufacturing",
    "Electronics Manufacturing",
    "Automobile Manufacturing",
    "Hospitals",
    "Clinics",
    "Medical Laboratories",
    "Medical Equipment Suppliers",
    "Pharmacies / Medical Stores",
    "Interior Design",
    "Vehicle Dealers",
    "Automobile Service Centres",
    "Insurance Companies",
    "Chartered Accountants / Audit Firms",
    "Tax Consultants",
    "Hotels & Resorts",
    "Schools",
    "Colleges",
    "Training Institutes",
    "Coaching Centers",
    "Educational Consultants",
    "Software Development",
    "Restaurants / Cafes",
    "Travel Agencies",
    "Tourism Operators",
    "Advertising & Marketing Agencies",
    "Event Management",
    "Security Services",
    "Cleaning / Facility Management",
    "NGOs / Non-Profit Organizations",
    "Government Organizations"
  ]

  const industries = [
    "Whole sailor/Distributors",
    "Retailer",
    "Manufacturer",
    "Service",
    "Works Contract"
  ]

  useEffect(() => {
    const user = getLocalStorageItem("user")
    if (user) {
    }
  }, [])

  const countryOptions = useMemo(
    () =>
      Country.getAllCountries().map((country) => ({
        label: country.name,
        value: country.isoCode
      })),
    []
  )
  console.log(countryOptions)
  const stateOptions = selectedCountry
    ? State.getStatesOfCountry(selectedCountry).map((state) => ({
        label: state.name,
        value: state.isoCode
      }))
    : []
  const defaultCountry = useMemo(
    () => countryOptions.find((country) => country.value === "IN"),
    [countryOptions]
  )

  const defaultState = useMemo(
    () => stateOptions.find((state) => state.value === "KL"),
    [stateOptions]
  )
  useEffect(() => {
    if (defaultCountry && !customer) {
      setValue("country", defaultCountry.value)
    }
  }, [defaultCountry])
  useEffect(() => {
    if (defaultState && !customer) {
      setValue("state", defaultState.value)
    }
  }, [defaultState])

  useEffect(() => {
    if (partners) {
      setPartner(partners)
    }
  }, [partners])

  useEffect(() => {
    if (productData) {
      setProductOptions(
        productData.map((product) => {
          const basePrice = Number(product?.productPrice || 0)
          const igstRate = Number(
            product?.selected?.[0]?.hsn_id?.onValue?.igstRate || 0
          )

          const gstAmount = (basePrice * igstRate) / 100
          const totalPrice = basePrice + gstAmount

          return {
            label: product.productName,
            value: product._id,
            shortName: product?.shortName,
            productorservicetype: product.productorservicetype,
            defaultservices: product?.defaultservices || [],
            company_id: product?.selected?.[0]?.company_id,
            companyName: product?.selected?.[0]?.companyName,
            branch_id: product?.selected?.[0]?.branch_id,
            branchName: product?.selected?.[0]?.branchName,
            productprice: totalPrice,
            basePrice,
            igstRate,
            gstAmount
          }
        })
      )
    }
  }, [productData])

  useEffect(() => {
    setHasUnsavedChanges(hasUnsavedChanges)

    return () => {
      setHasUnsavedChanges(false)
    }
  }, [hasUnsavedChanges, setHasUnsavedChanges])
  useEffect(() => {
    if (licensenumber) {
      setLicense(licensenumber)
    }
  }, [licensenumber])

  useEffect(() => {
    if (productError) {
      toast.error(
        productError?.response?.data?.message || "Something went wrong!"
      )
    }
  }, [productError])

  const formatDateToDDMMYYYY = (dateValue) => {
    if (!dateValue) return ""
    const date = new Date(dateValue)
    if (Number.isNaN(date.getTime())) return ""
    const day = String(date.getDate()).padStart(2, "0")
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const year = date.getFullYear()
    return `${day}-${month}-${year}`
  }

  // Customer APIs can return `partner` as either an ObjectId string or a
  // populated Partner document. The select control always needs the ID.
  const getPartnerId = (partnerValue) => {
    if (!partnerValue) return ""
    if (typeof partnerValue === "object") {
      return String(partnerValue?._id || partnerValue?.id || "")
    }
    return String(partnerValue)
  }

  useEffect(() => {
    if (customer && process === "edit" && !isSaved) {
      console.log("hhhh")
      console.log(customer.country)
      const partnerId = getPartnerId(customer?.partner)
      reset({
        customerName: customer?.customerName || "",
        address1: customer?.address1 || "",
        address2: customer?.address2 || "",
        country: customer?.country || "",
        state: customer?.state || "",
        city: customer?.city || "",
        pincode: customer?.pincode || "",
        contactPerson: customer?.contactPerson || "",
        email: customer?.email || "",
        mobile: customer?.mobile || "",
        landline: customer?.landline || "",
        // Older customers may not have this flag. A linked partner means that
        // they should continue to appear as a partner customer when edited.
        isPartner: customer?.isPartner ?? Boolean(partnerId),
        partner: partnerId,
        partnerSelection: getPartnerId(customer?.partnerSelection),
        industry: customer?.industry || "",
        registrationType: customer?.registrationType || "",
        gstNo: customer?.gstNo || "",
        productName: null,
        companyName: null,
        branchName: null,
        licensenumber: "",
        softwareTrade: "",
        applicationDate: "",
        nextDue: "",
        noofusers: "",
        productAmount: "",
        customerIsActive: customer?.isActive || "Running",
        isActive: "Running",
        taggedLicenses: [],
        taggedLicenseDueDates: {}
      })

      const selectedData =
        customer?.selected?.map((sel) => ({
          company_id: sel?.company_id?._id,
          companyName: sel?.company_id?.companyName,
          branch_id: sel?.branch_id?._id,
          branchName: sel?.branch_id?.branchName,
          product_id: sel?.product_id?._id,
          productName: sel?.product_id?.productName,
          brandName: sel?.brandName,
          categoryName: sel?.categoryName,
          shortName: sel?.product_id?.shortName,
          licensenumber: sel?.licensenumber,
          softwareTrade: sel?.softwareTrade,
          version: sel?.version,
          customerAddDate: sel?.customerAddDate,
          amcstartDate: sel?.amcstartDate,
          amcendDate: sel?.amcendDate,
          amcAmount: sel?.amcAmount,
          amcDescription: sel?.amcDescription,
          licenseExpiryDate: sel?.licenseExpiryDate,
          productamountDescription: sel?.productamountDescription,
          tvuexpiryDate: sel?.tvuexpiryDate,
          tvuAmount: sel?.tvuAmount,
          tvuamountDescription: sel?.tvuamountDescription,
          reasonofStatus: sel?.reasonofStatus,
          applicationDate: sel?.customerAddDate
            ? sel?.customerAddDate
            : sel?.applicationDate,
          nextDue: sel?.nextDue,
          noofusers: sel?.noofusers,
          productAmount: sel?.productAmount,
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
      setInitialTableData(selectedData)
    } else {
      console.log("hhhh")
      setInitialTableData([])
    }
  }, [customer, reset])
  console.log(tableData)
  console.log(initialTableData)
  useEffect(() => {
    if (!debouncedLicenseNo || !String(debouncedLicenseNo).trim()) return
    console.log("hhh")
    // const checkLicense = license.find(
    //   (item) => String(item?.licensenumber) === String(debouncedLicenseNo)&&!item?.products
    // )
    const hasProductValue = (value) =>
      value !== undefined && value !== null && String(value).trim() !== ""
    const checkLicense = (license || []).find(
      (item) =>
        String(item?.licensenumber || "").trim() ===
          String(debouncedLicenseNo || "").trim() &&
        hasProductValue(item?.products)
    )
    console.log(checkLicense)
    console.log(license)
    const currentEditing = editIndex !== null ? tableData[editIndex] : null
    console.log(currentEditing)
    console.log(debouncedLicenseNo)
    const isSameEditingLicense =
      currentEditing &&
      String(currentEditing?.licensenumber) === String(debouncedLicenseNo)
    console.log(isSameEditingLicense)
    console.log(licenseAvailable)
    setLicenseAvailable(!(checkLicense && !isSameEditingLicense))
  }, [debouncedLicenseNo, license, editIndex, tableData])
  console.log(licenseAvailable)
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

  const primaryLicenseOptions = useMemo(() => {
    const uniqueMap = new Map()

    tableData
      .filter(
        (item) =>
          String(item?.productorservicetype).toLowerCase() === "primaryproduct"
      )
      .forEach((item) => {
        const licenseNo = String(item?.licensenumber || "").trim()

        if (licenseNo && !uniqueMap.has(licenseNo)) {
          uniqueMap.set(licenseNo, {
            licenseNo,
            productName: item?.productName || ""
          })
        }
      })

    return Array.from(uniqueMap.values())
  }, [tableData])

  const handleProductChange = (selectedOption) => {
console.log(detailsData)
console.log(tableData)
const filteredTableData = tableData.filter(
  (item) => String(item.licensenumber) !== String(detailsData.licensenumber)
);

console.log(filteredTableData);
setDummyTableData(filteredTableData)
    setValue("productName", selectedOption, { shouldDirty: true })
    setValue("shortName", selectedOption?.shortName, { shouldDirty: true })
    setValue("productAmount", selectedOption?.productprice, {
      shouldDirty: true
    })
    setValue("companyName", null, { shouldDirty: true })
    setValue("branchName", null, { shouldDirty: true })
    setValue("licensenumber", "", { shouldDirty: true })
    setValue("taggedLicenses", [], { shouldDirty: true })
    setValue("taggedLicenseDueDates", {}, { shouldDirty: true })
    setCompanyOptions(getCompaniesForProduct(selectedOption?.value))
    setBranchOptions([])
  }

  const handleCompanyChange = (selectedCompanyOption) => {
    setValue("companyName", selectedCompanyOption, { shouldDirty: true })
    setValue("branchName", null, { shouldDirty: true })

    const branches = getBranchesForCompany(
      getValues("productName")?.value,
      selectedCompanyOption?.value
    )
    setBranchOptions(branches)
  }

  const handleBranchChange = (selectedBranchOption) => {
    setValue("branchName", selectedBranchOption, { shouldDirty: true })
  }

  const openAddPopup = (type) => {
    setPopupType(type)
    setEditIndex(null)

    reset({
      ...getValues(),
      productName: null,
      companyName: null,
      branchName: null,
      licensenumber: "",
      shortName: null,
      softwareTrade: "",
      applicationDate: "",
      nextDue: "",
      noofusers: "",
      productAmount: "",
      isActive: "Running",
      taggedLicenses: [],
      taggedLicenseDueDates: {}
    })

    setCompanyOptions([])
    setBranchOptions([])
    setShowProductPopup(true)
  }

  const closePopup = () => {
    setShowProductPopup(false)
    setPopupType("")
    setEditIndex(null)
    clearErrors()
    setduplicatelicense(null)
    setdetailsData([])
  }
  // const handleCancelNavigation = () => {
  //   if (hasUnsavedChanges) {
  //     const confirmLeave = window.confirm(
  //       "You have unsaved customer details. Leaving this page without saving will discard the data. Do you want to continue?"
  //     )
  //     if (!confirmLeave) return
  //   }

  //   if (navigatebackto) {
  //     navigate(navigatebackto)
  //   } else {
  //     navigate(-1)
  //   }
  // }
  // const handleCancelNavigation = () => {
  //   openUnsavedWarning(() => {
  //     if (navigatebackto) {
  //       navigate(navigatebackto)
  //     } else {
  //       navigate(-1)
  //     }
  //   })
  // }
  const handleCancelNavigation = () => {
    requestNavigation(() => {
      if (navigatebackto) {
        navigate(navigatebackto)
      } else {
        navigate(-1)
      }
    })
  }
  console.log(licenseAvailable)
console.log(tableData)
  const handleLicenseBlur = async (licenseNumber) => {
    if (!String(licenseNumber).trim()) return

    try {
      console.log(tableData)
      console.log(licenseNumber)
console.log(dummyTableData)
      // const matchingLicenseRow = (dummyTableData || []).find(
      //   (row) =>
      //     String(row?.licensenumber || "").trim() ===
      //     String(licenseNumber || "").trim()
      // )
const matchingLicenseRow =
  editIndex !== null && editIndex !== undefined
    ? true
    : (dummyTableData || []).find(
        (row) =>
          String(row?.licensenumber || "").trim() ===
          String(licenseNumber || "").trim()
      );
      console.log(matchingLicenseRow)
      /*
    License exists in tableData.
    Check whether that existing table row has product_id.
  */
      if (matchingLicenseRow) {
        console.log("hhhh")
        const hasProductId =
          matchingLicenseRow.product_id !== undefined &&
          matchingLicenseRow.product_id !== null &&
          String(matchingLicenseRow.product_id).trim() !== ""

        if (hasProductId) {
          toast.error(`License ${licenseNumber} already exists with a product`)

          setduplicatelicense(true)
          return
        }

        /*
      License exists in tableData, but product_id is empty/undefined.
      It is allowed for product selection.
      Do not call the API.
    */
        setduplicatelicense(false)
        toast.success(
          `License ${licenseNumber} is available for product selection`
        )
        console.log("hhhh")
        setLicenseAvailable(true)
        return
      }

      /*
    License does not exist in current tableData.
    Check the database through API.
  */
      setlicenseloading(true)
      const { data } = await api.get(
        `/customer/checkLicense?licenseNumber=${licenseNumber}`
      )

      if (data.exists) {
        toast.error(`License ${licenseNumber} already exists`)
        setduplicatelicense(true)
        return
      } else {
        setduplicatelicense(null)
      }

      toast.success("License available")
    } catch (error) {
      toast.error("Failed to validate license")
    } finally {
      setlicenseloading(false)
    }
  }
console.log(detailsData)
console.log(editIndex)
  const handleEdit = (item, index) => {
    console.log(item)

    setdetailsData(item)
    setPopupType(item?.productorservicetype)
    setEditIndex(index)

    const productOption = productOptions.find(
      (p) => p.value === item?.product_id
    ) || {
      label: item?.productName,
      value: item?.product_id
    }

    const companyOption = item?.company_id
      ? { label: item?.companyName, value: item?.company_id }
      : null

    const branchOption = item?.branch_id
      ? { label: item?.branchName, value: item?.branch_id }
      : null

    const taggedLicensesFromData =
      item?.taggeddata?.map((entry) => String(entry?.licensenumber)) ||
      item?.taggedLicenses ||
      []
    console.log(item.taggeddata)
    const taggedLicenseDueDatesFromData =
      item?.taggeddata?.reduce((acc, entry) => {
        if (entry?.licensenumber) {
          acc[String(entry.licensenumber)] = {
            nextDue: entry?.nextDue || "",
            productAmount: entry?.productAmount ?? "",
            taxexclusiveAmount: entry?.taxexclusiveAmount ?? 0,
            taxinclusiveamount: entry?.taxinclusiveamount ?? 0,
            hsn: entry?.hsn ?? 0,
            nextDueTax: entry?.nextDueTax ?? 0,
            originalHsn: entry?.originalHsn ?? 0,
            serialNumber: entry?.serialNumber ?? "",
            noofusers: entry?.noofusers ?? 0
          }
        }
        return acc
      }, {}) || {}

    setCompanyOptions(getCompaniesForProduct(item?.product_id))
    setBranchOptions(getBranchesForCompany(item?.product_id, item?.company_id))

    reset({
      ...getValues(),
      productName: productOption,
      companyName: companyOption,
      branchName: branchOption,
      licensenumber: item?.licensenumber || "",
      softwareTrade: item?.softwareTrade || "",
      applicationDate: item?.applicationDate || "",
      nextDue: item?.nextDue || "",
      shortName: item?.shortName || "",
      noofusers: item?.noofusers || "",
      productAmount: item?.productAmount || "",
      isActive: item?.isActive || "Running",
      taggedLicenses: taggedLicensesFromData,
      taggedLicenseDueDates: taggedLicenseDueDatesFromData
    })

    setShowProductPopup(true)
  }

  const handleDelete = (index) => {
    setTableData((prev) => prev.filter((_, i) => i !== index))
  }
  console.log(tableData)
  console.log("hhhh")
  const validateSelectedLeadList = (selectedleadlist = []) => {
    console.log(selectedleadlist)
    const hasAdditionalService = selectedleadlist.some(
      (row) =>
        String(row?.productorservicetype || "").toLowerCase() ===
        "additionalservice"
    )
    console.log(hasAdditionalService)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const parseDateOnly = (value) => {
      if (!value) return null
      const d = new Date(value)
      if (Number.isNaN(d.getTime())) return null
      d.setHours(0, 0, 0, 0)
      return d
    }

    for (let i = 0; i < selectedleadlist.length; i++) {
      const row = selectedleadlist[i]
      const type = String(row?.productorservicetype || "").toLowerCase()

      const hasCompany = !!(
        row?.company_id ||
        row?.companyid ||
        row?.companyName
      )
      const hasBranch = !!(row?.branch_id || row?.branchid || row?.branchName)

      if (!hasCompany) {
        return `Company is required for ${row?.productName}`
      }

      if (!hasBranch) {
        return `Branch is required for ${row?.productName}`
      }

      const productPrice = Number(
        row?.productAmount ?? row?.productPrice ?? row?.amount ?? 0
      )

      if (type === "primaryproduct") {
        if (!String(row?.licensenumber || row?.licenseNumber || "").trim()) {
          return `License number is required for ${row?.productName}`
        }
        if (!row.applicationDate) {
          return `Application date is requiered for ${row?.productName}, please add details`
        }
        if (!(productPrice > 0)) {
          return `Product price must be greater than 0 for ${row?.productName}`
        }
      }

      if (type === "additionalservice") {
        const taggeddata = Array.isArray(row?.taggeddata) ? row.taggeddata : []
        const outerLicense = String(
          row?.licensenumber || row?.licenseNumber || ""
        ).trim()
        const hasTaggedLicense = taggeddata.some((tag) =>
          String(tag?.licensenumber || tag?.licenseNumber || "").trim()
        )
        const hasAnyLicense = !!outerLicense || hasTaggedLicense

        if (!hasAdditionalService && !(productPrice > 0)) {
          return `Product price must be greater than 0 for additional service ${row.productName}`
        }

        if (taggeddata.length > 0) {
          for (let j = 0; j < taggeddata.length; j++) {
            const tag = taggeddata[j]
            const tagLicense = String(
              tag?.licensenumber || tag?.licenseNumber || ""
            ).trim()
            const due = parseDateOnly(tag?.nextDue)

            if (!tagLicense) {
              return `Tagged license number is required in ${row?.productName}`
            }

            if (!due) {
              return `Next due is required for tagged license ${tagLicense} for ${row?.productName}`
            }

            // if (due < today) {
            //   return `Next due cannot be less than current date for tagged license ${tagLicense} for ${row?.productName}`
            // }
          }
        } else {
          if (!row.nextDue) {
            return `Additional service ${row?.productName} must have a next Due, please add details`
          }
          if (!outerLicense && taggeddata.length === 0) {
            return `Additional service ${row?.productName} must have a license number or tagged license`
          }

          const due = parseDateOnly(row?.nextDue)
          if (!due) {
            return `Next due is required for additional service ${row?.productName}`
          }

          if (due < today) {
            return `Next due cannot be less than current date for additional service ${row?.productName}`
          }
        }

        if (!hasAnyLicense) {
          return `Additional service ${row?.productName} must have a license number or tagged license`
        }
      }
    }

    return null
  }

  const savePopupData = () => {
    if (popupType === "Additionalservice") {
      const selectedLicenses = getValues("taggedLicenses") || []

      if (selectedLicenses.length === 0) {
        console.log("Hhh")
        console.log(tableData)
        setError("taggedLicenses", {
          type: "manual",
          message:
            "Select at least one tagged license number for the additional service."
        })
        return
      }

      clearErrors("taggedLicenses")
    }
    console.log("hhhh")
    console.log(duplicatelicense)
    if (duplicatelicense) {
      // console.log()
      toast.error("License already exists")
      return
    }

    const values = getValues()
    console.log(values)
    if (!values?.productName?.value) {
      toast.error("Please select product/service")
      return
    }
    console.log("hhh")
    if (
      popupType === "Primaryproduct" &&
      !String(values?.licensenumber || "").trim()
    ) {
      setError("licensenumber", {
        type: "manual",
        message: "License number is required for primary product"
      })
      return
    }
    console.log(popupType)
    console.log(licenseAvailable)
    if (
      popupType === "Primaryproduct" &&
      String(values?.licensenumber || "").trim() &&
      !licenseAvailable
    ) {
      console.log("hhh")
      setError("licensenumber", {
        type: "manual",
        message: "License number already exists"
      })
      return
    }
    console.log("hhh")
    const selectedTaggedLicenses =
      popupType === "Additionalservice" ? values?.taggedLicenses || [] : []

    const dueMap =
      popupType === "Additionalservice"
        ? values?.taggedLicenseDueDates || {}
        : {}

    if (
      popupType === "Additionalservice" &&
      selectedTaggedLicenses.length > 0
    ) {
      const hasEmptyDueDate = selectedTaggedLicenses.some(
        (licenseNo) => !String(dueMap[String(licenseNo)]?.nextDue || "").trim()
      )

      if (hasEmptyDueDate) {
        toast.error("Please enter due date for all tagged licenses")
        return
      }
    }
    console.log(dueMap)
    const taggeddata =
      popupType === "Additionalservice" && selectedTaggedLicenses.length > 0
        ? selectedTaggedLicenses.map((licenseNo) => ({
            licensenumber: Number(licenseNo),
            nextDue: dueMap[String(licenseNo)]?.nextDue || "",
            productAmount: Number(
              dueMap[String(licenseNo)]?.productAmount || 0
            ),
            taxexclusiveAmount: Number(
              dueMap[String(licenseNo)]?.taxexclusiveAmount || 0
            ),
            noofusers: Number(dueMap[String(licenseNo)]?.noofusers || 0),
            nextDueTax: Number(dueMap[String(licenseNo)]?.nextDueTax || 0),
            actualHsn: Number(dueMap[String(licenseNo)]?.originalHsn || 0),
            originalHsn: Number(dueMap[String(licenseNo)]?.originalHsn || 0),
            leadTax: Number(dueMap[String(licenseNo)]?.nextDueTax || 0),
            serialNumber: dueMap[String(licenseNo)]?.serialNumber,
            hsn: Number(dueMap[String(licenseNo)]?.hsn || 0),

            taxinclusiveamount: Number(
              dueMap[String(licenseNo)]?.taxinclusiveamount || 0
            )
          }))
        : []

    const baseRow = editIndex !== null ? tableData[editIndex] : {}

    const row = {
      ...baseRow,
      company_id: values?.productName?.company_id,
      companyName: values?.productName?.companyName,
      branch_id: values?.productName?.branch_id,
      branchName: values?.productName?.branchName,
      product_id: values?.productName?.value,
      productName: values?.productName?.label,
      shortName: values?.shortName,
      licensenumber:
        popupType === "Additionalservice" && taggeddata.length > 0
          ? null
          : values?.licensenumber
            ? Number(values.licensenumber)
            : null,
      softwareTrade:
        popupType === "Primaryproduct" ? values?.softwareTrade : "",
      applicationDate:
        popupType === "Primaryproduct" ? values?.applicationDate : "",
      nextDue:
        popupType === "Additionalservice" && taggeddata.length > 0
          ? null
          : values?.nextDue || "",
      noofusers: values?.noofusers ? Number(values.noofusers) : 0,
      productAmount: values?.productAmount ? Number(values.productAmount) : 0,
      isActive: values?.isActive || "Running",
      productorservicetype: popupType,
      taggeddata,
      taggedLicenses: selectedTaggedLicenses
    }

    const selectedProductObj = productOptions?.find(
      (p) => p.value === values?.productName?.value
    )

    const defaultServiceRows =
      popupType === "Primaryproduct" &&
      selectedProductObj?.defaultservices?.length
        ? selectedProductObj.defaultservices.map((service) => ({
            company_id: values?.productName?.company_id,
            companyName: values?.productName?.companyName,
            branch_id: values?.productName?.branch_id,
            branchName: values?.productName?.branchName,
            product_id: service?._id,
            productName: service?.productName,
            shortName: service?.shortName || "",
            licensenumber: null,
            softwareTrade: "",
            applicationDate: "",
            nextDue: "",
            noofusers: service?.noofusers,
            productAmount: service?.productPrice
              ? Number(service.productPrice)
              : 0,
            isActive: values?.isActive || "Running",
            productorservicetype: "Additionalservice",
            taggeddata: [],
            taggedLicenses: [],
            parentProductId: values?.productName?.value,
            parentProductName: values?.productName?.label,
            autoAddedFromDefaultService: true
          }))
        : []
console.log(editIndex)
console.log(tableData)
console.log(row)
//     setTableData((prev) => {
//       if (editIndex !== null) {
//         const updated = [...prev]
//         updated[editIndex] = row
//         // return updated
//       }

//       const existingAdditionalServiceIds = new Set(
//         prev
//           .filter(
//             (item) =>
//               String(item.productorservicetype).toLowerCase() ===
//               "additionalservice"
//           )
//           .map((item) => String(item.product_id))
//       )

//       const newDefaultServices = defaultServiceRows.filter(
//         (service) =>
//           !existingAdditionalServiceIds.has(String(service.product_id))
//       )
// console.log(prev)
// console.log(row)
// console.log(newDefaultServices)
//       return [...prev, row, ...newDefaultServices]
//     })
setTableData((prev) => {
  const isEditMode = editIndex !== null && editIndex !== undefined;

  const baseRows = isEditMode
    ? prev.map((item, index) => (index === editIndex ? row : item))
    : [...prev, row];

  const existingAdditionalServiceIds = new Set(
    baseRows
      .filter(
        (item) =>
          String(item?.productorservicetype || "").toLowerCase() ===
          "additionalservice"
      )
      .map((item) => String(item?.product_id))
  );

  const newDefaultServices = defaultServiceRows.filter(
    (service) =>
      !existingAdditionalServiceIds.has(String(service?.product_id))
  );

  return [...baseRows, ...newDefaultServices];
});

    closePopup()
  }

  const filteredOptionsByType = useMemo(() => {
    let options = productOptions.filter(
      (item) =>
        String(item?.productorservicetype).toLowerCase() ===
        String(popupType).toLowerCase()
    )

    if (String(popupType).toLowerCase() === "additionalservice") {
      const existingServiceIds = new Set(
        tableData
          .filter(
            (item) =>
              String(item?.productorservicetype).toLowerCase() ===
              "additionalservice"
          )
          .map((item) => String(item.product_id))
      )

      options = options.filter(
        (item) => !existingServiceIds.has(String(item.value))
      )
    }

    return options
  }, [productOptions, popupType, tableData])

  const primaryProducts = useMemo(() => {
    return tableData.filter(
      (item) =>
        String(item?.productorservicetype).toLowerCase() === "primaryproduct"
    )
  }, [tableData])

  const additionalServices = useMemo(() => {
    return tableData.filter(
      (item) =>
        String(item?.productorservicetype).toLowerCase() === "additionalservice"
    )
  }, [tableData])

  const formatDateForInput = (date) => {
    if (!date) return ""
    return String(date).split("T")[0]
  }

 
  useUnsavedChangesPrompt({
    when: hasUnsavedChanges,
    onBlock: ({ proceed, stay }) => {
      setPendingAction(() => ({
        proceed,
        stay
      }))
      setShowUnsavedModal(true)
    }
  })
  const openUnsavedWarning = (action) => {
    if (!hasUnsavedChanges) {
      action()
      return
    }

    setPendingAction(() => ({
      proceed: action,
      stay: () => {}
    }))
    setShowUnsavedModal(true)
  }

  const handleStayOnPage = () => {
    pendingAction?.stay?.()
    setShowUnsavedModal(false)
    setPendingAction(null)
  }

  const handleLeavePage = () => {
    setShowUnsavedModal(false)
    const action = pendingAction?.proceed
    setPendingAction(null)
    action?.()
  }
  const requestTaggedLicenseRemoval = (licenseNo) => {
    setLicenseRemoveConfirm({
      open: true,
      licenseNo: String(licenseNo)
    })
  }

  const cancelTaggedLicenseRemoval = () => {
    setLicenseRemoveConfirm({
      open: false,
      licenseNo: null
    })
  }

  // const confirmTaggedLicenseRemoval = () => {
  //   const licenseNo = licenseRemoveConfirm.licenseNo

  //   if (!licenseNo) {
  //     cancelTaggedLicenseRemoval()
  //     return
  //   }

  //   const previousLicenses = watch("taggedLicenses") || []
  //   const previousDueMap = watch("taggedLicenseDueDates") || {}

  //   const updatedLicenses = previousLicenses.filter(
  //     (item) => String(item) !== String(licenseNo)
  //   )

  //   const updatedDueMap = { ...previousDueMap }
  //   delete updatedDueMap[licenseNo]

  //   setValue("taggedLicenses", updatedLicenses, {
  //     shouldDirty: true,
  //     shouldValidate: true
  //   })

  //   setValue("taggedLicenseDueDates", updatedDueMap, {
  //     shouldDirty: true,
  //     shouldValidate: true
  //   })

  //   // Optional: clear license number if no tagged license remains.
  //   if (updatedLicenses.length === 0) {
  //     setValue("licensenumber", "", {
  //       shouldDirty: true,
  //       shouldValidate: true
  //     })
  //   }

  //   /*
  //     Put your API/action function here if removing a tagged license
  //     must immediately update backend data.

  //     Example:
  //     await removeTaggedLicenseFromService(licenseNo)
  //   */

  //   cancelTaggedLicenseRemoval()
  // }
  const confirmTaggedLicenseRemoval = () => {
    const licenseNo = String(licenseRemoveConfirm.licenseNo || "")

    if (!licenseNo) {
      cancelTaggedLicenseRemoval()
      return
    }

    const currentValues = getValues()
    const previousLicenses = currentValues.taggedLicenses || []
    const previousDueMap = currentValues.taggedLicenseDueDates || {}
    const selectedAdditionalServiceId = currentValues?.productName?.value

    // Remove the license from React Hook Form values.
    const updatedLicenses = previousLicenses.filter(
      (item) => String(item) !== licenseNo
    )

    const updatedDueMap = { ...previousDueMap }
    delete updatedDueMap[licenseNo]

    setValue("taggedLicenses", updatedLicenses, {
      shouldDirty: true,
      shouldValidate: true
    })

    setValue("taggedLicenseDueDates", updatedDueMap, {
      shouldDirty: true,
      shouldValidate: true
    })

    // Keep the popup state clean when its last tagged license is removed.
    if (updatedLicenses.length === 0) {
      setValue("licensenumber", "", {
        shouldDirty: true,
        shouldValidate: true
      })
    }

    // Remove the license from taggeddata and taggedLicenses in the saved table row.
    // If no tag remains, remove the entire Additional Service row.
    setTableData((previousRows) => {
      if (!Array.isArray(previousRows)) return previousRows

      return previousRows
        .map((row) => {
          const isSelectedAdditionalService =
            row?.productorservicetype === "Additionalservice" &&
            String(row?.product_id) === String(selectedAdditionalServiceId)

          if (!isSelectedAdditionalService) {
            return row
          }

          const updatedRowTaggedLicenses = (row.taggedLicenses || []).filter(
            (taggedLicense) => String(taggedLicense) !== licenseNo
          )

          const updatedRowTaggedData = (row.taggeddata || []).filter(
            (taggedItem) => String(taggedItem?.licensenumber) !== licenseNo
          )

          return {
            ...row,
            taggedLicenses: updatedRowTaggedLicenses,
            taggeddata: updatedRowTaggedData
          }
        })
        .filter((row) => {
          if (row?.productorservicetype !== "Additionalservice") {
            return true
          }

          // Delete an Additional Service row if it has no tagged license left.
          return (row?.taggeddata || []).length > 0
        })
    })

    cancelTaggedLicenseRemoval()
  }

  console.log(tableData)
  const taggedLicenseCheckboxOnChange = (event, option) => {
    const licenseNo = String(option.licenseNo)

    // Do not remove immediately. Keep checkbox checked and ask for confirmation.
    if (!event.target.checked) {
      requestTaggedLicenseRemoval(licenseNo)
      return
    }

    const previousLicenses = watch("taggedLicenses") || []
    const previousDueMap = watch("taggedLicenseDueDates") || {}
    const currentValues = getValues()

    if (!previousLicenses.includes(licenseNo)) {
      setValue("taggedLicenses", [...previousLicenses, licenseNo], {
        shouldDirty: true,
        shouldValidate: true
      })
    }

    setValue("licensenumber", "", {
      shouldDirty: true
    })

    clearErrors("taggedLicenses")

    const matched = detailsData?.taggeddata?.find(
      (item) => String(item?.licensenumber) === licenseNo
    )

    if (matched) {
      setValue(
        "taggedLicenseDueDates",
        {
          ...previousDueMap,
          [licenseNo]: {
            nextDue: matched.nextDue || "",
            productAmount: matched.productAmount ?? "",
            taxexclusiveAmount: matched.taxexclusiveAmount ?? "",
            taxinclusiveamount: matched.taxinclusiveamount ?? "",
            hsn: matched.hsn ?? "",
            originalHsn: matched.originalHsn ?? matched.hsn ?? "",
            nextDueTax: matched.nextDueTax ?? matched.hsn ?? 0,
            noofusers: matched.noofusers ?? "",
            serialNumber: matched.serialNumber ?? ""
          }
        },
        {
          shouldDirty: true,
          shouldValidate: true
        }
      )

      return
    }

    const selectedProduct = productOptions.find(
      (item) => item.value === currentValues?.productName?.value
    )

    setValue(
      "taggedLicenseDueDates",
      {
        ...previousDueMap,
        [licenseNo]: {
          nextDue: "",
          productAmount: "",
          taxexclusiveAmount: selectedProduct?.basePrice || 0,
          taxinclusiveamount: selectedProduct?.productprice || 0,
          hsn: selectedProduct?.igstRate || 0,
          originalHsn: selectedProduct?.igstRate || 0,
          nextDueTax: selectedProduct?.igstRate || 0,
          noofusers: "",
          serialNumber: ""
        }
      },
      {
        shouldDirty: true,
        shouldValidate: true
      }
    )
  }
  const onSubmit = async (data) => {
    const validationMessage = validateSelectedLeadList(tableData)
    console.log(validationMessage)
    if (validationMessage) {
      toast.error(validationMessage)
      return
    }

    if (submissionloader) return

    setsubmissionloader(true)
    try {
      // Keep the customer-level status separate from the product-popup status
      // field, then send it to the API using the persisted `isActive` name.
      const { customerIsActive, ...customerFormData } = data
      const customerPayload = {
        ...customerFormData,
        isActive: customerIsActive || "Running",
        isPartner: Boolean(data.isPartner),
        partner: data.isPartner ? data.partner : "",
        partnerSelection: data.partnerSelection || ""
      }

      if (process === "Registration") {
        await handleCustomerData(customerPayload, tableData)
        reset()
        setTableData([])
        setIsSaved(true)
        setInitialTableData([])
        console.log("")
      } else if (process === "edit") {
        console.log(data)
        console.log(tableData)
        console.log(customer?.index)
        await handleEditedData(customerPayload, tableData, customer?.index)

        reset({
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
          isPartner: false,
          partner: "",
          partnerSelection: "",
          industry: "",
          registrationType: "",
          gstNo: "",
          productName: null,
          companyName: null,
          branchName: null,
          licensenumber: "",
          softwareTrade: "",
          applicationDate: "",
          nextDue: "",
          noofusers: "",
          productAmount: "",
          customerIsActive: "Running",
          isActive: "Running",
          taggedLicenses: [],
          taggedLicenseDueDates: {}
        })
        console.log("hhh")
        setTableData([])
        setInitialTableData([])
        setIsSaved(true)
        // navigate(-1)
        console.log("hhh")
      }
    } catch (error) {
      toast.error("Failed to save customer!")
    } finally {
      setsubmissionloader(false)
    }
  }

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
      zIndex: 9999
    })
  }

  return (
    <div className="min-h-screen bg-[#ADD8E6] px-3 py-6 md:px-6">
      <div className="mx-auto max-w-[1180px]">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="rounded-[20px] border border-[#edf1f7] bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.05)] md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef5ff] text-[#4b87ff]">
                  <FaUser size={14} />
                </div>
                <div>
                  <h2 className="text-[16px] font-semibold text-[#162033]">
                    Customer Details
                  </h2>
                  <p className="text-[12px] text-[#7f8aa3]">
                    Fill customer master information
                  </p>
                </div>
              </div>

              <button
                type="button"
                // onClick={() =>
                //   navigatebackto ? navigate(navigatebackto) : navigate(-1)
                // }
                // onClick={() => navigatebackto ? navigate(navigatebackto) : navigate(-1)}
                onClick={handleCancelNavigation}
                className="rounded-md border border-[#e6ebf3] bg-white px-3 py-2 text-[12px] font-medium text-[#6d7890] hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <InfoInputCard
                icon={<FaUser size={12} />}
                iconBg="bg-[#edf6ff]"
                iconColor="text-[#5aa2ff]"
                label="Customer Name"
                error={errors.customerName?.message}
              >
                <input
                  type="text"
                  {...register("customerName", {
                    required: "Customer name is required"
                  })}
                  onBlur={(e) =>
                    setValue("customerName", e.target.value.trim(), {
                      shouldDirty: true
                    })
                  }
                  className={tileInputClass}
                  placeholder="Enter customer name"
                />
              </InfoInputCard>

              <InfoInputCard
                icon={<FaHashtag size={12} />}
                iconBg="bg-[#f4efff]"
                iconColor="text-[#8a5eff]"
                label="Pincode"
              >
                <input
                  type="number"
                  {...register("pincode")}
                  onBlur={(e) =>
                    setValue("pincode", e.target.value.trim(), {
                      shouldDirty: true
                    })
                  }
                  onWheel={(e) => e.currentTarget.blur()}
                  className={`${tileInputClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0`}
                  placeholder="Pincode"
                />
              </InfoInputCard>

              <InfoInputCard
                icon={<FaBuilding size={12} />}
                iconBg="bg-[#fff4ea]"
                iconColor="text-[#f0a24d]"
                label="City"
              >
                <input
                  type="text"
                  {...register("city")}
                  onBlur={(e) =>
                    setValue("city", e.target.value.trim(), {
                      shouldDirty: true
                    })
                  }
                  className={tileInputClass}
                  placeholder="City"
                />
              </InfoInputCard>

              <InfoInputCard
                icon={<FaEnvelope size={12} />}
                iconBg="bg-[#eefbf2]"
                iconColor="text-[#4cbf73]"
                label="Email"
                error={errors.email?.message}
              >
                <input
                  type="email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /\S+@\S+\.\S+/,
                      message: "Invalid email address"
                    }
                  })}
                  onBlur={(e) =>
                    setValue("email", e.target.value.trim(), {
                      shouldDirty: true
                    })
                  }
                  className={tileInputClass}
                  placeholder="Email"
                />
              </InfoInputCard>

              <InfoInputCard
                icon={<FaMapMarkerAlt size={12} />}
                iconBg="bg-[#fff0f8]"
                iconColor="text-[#ef7db2]"
                label="Address 1"
              >
                <input
                  type="text"
                  {...register("address1")}
                  onBlur={(e) =>
                    setValue("address1", e.target.value.trim(), {
                      shouldDirty: true
                    })
                  }
                  className={tileInputClass}
                  placeholder="Address line 1"
                />
              </InfoInputCard>

              <InfoInputCard
                icon={<FaUser size={12} />}
                iconBg="bg-[#ebfbfb]"
                iconColor="text-[#43c7cb]"
                label="Contact Person"
              >
                <input
                  type="text"
                  {...register("contactPerson")}
                  onBlur={(e) =>
                    setValue("contactPerson", e.target.value.trim(), {
                      shouldDirty: true
                    })
                  }
                  className={tileInputClass}
                  placeholder="Contact person"
                />
              </InfoInputCard>

              <InfoInputCard
                icon={<FaPhone size={12} />}
                iconBg="bg-[#edf9f0]"
                iconColor="text-[#45bf6b]"
                label="Mobile No"
              >
                <input
                  type="tel"
                  {...register("mobile")}
                  onBlur={(e) =>
                    setValue("mobile", e.target.value.trim(), {
                      shouldDirty: true
                    })
                  }
                  className={tileInputClass}
                  placeholder="Mobile number"
                />
              </InfoInputCard>

              <InfoInputCard
                icon={<FaMapMarkerAlt size={12} />}
                iconBg="bg-[#eef5ff]"
                iconColor="text-[#3879f2]"
                label="Address 2"
              >
                <input
                  type="text"
                  {...register("address2")}
                  onBlur={(e) =>
                    setValue("address2", e.target.value.trim(), {
                      shouldDirty: true
                    })
                  }
                  className={tileInputClass}
                  placeholder="Address line 2"
                />
              </InfoInputCard>
              <InfoInputCard
                icon={<FaGlobeAsia size={12} />}
                iconBg="bg-[#fff2e8]"
                iconColor="text-[#ef9a47]"
                label="Country"
              >
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={countryOptions}
                      value={
                        countryOptions.find(
                          (opt) => opt.value === field.value
                        ) || null
                      }
                      onChange={(option) => field.onChange(option?.value || "")}
                      getOptionLabel={(o) => o.label}
                      getOptionValue={(o) => o.value}
                      placeholder="Select country"
                      isSearchable
                      classNamePrefix="rs"
                      unstyled
                      menuPortalTarget={
                        typeof document !== "undefined" ? document.body : null
                      }
                      menuPosition="fixed"
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: "auto",
                          padding: 0,
                          border: "none",
                          boxShadow: "none",
                          backgroundColor: "transparent",
                          cursor: "pointer"
                        }),
                        valueContainer: (base) => ({
                          ...base,
                          padding: 0
                        }),
                        input: (base) => ({
                          ...base,
                          margin: 0,
                          padding: 0,
                          color: "#374151",
                          fontSize: "0.8125rem"
                        }),
                        placeholder: (base) => ({
                          ...base,
                          margin: 0,
                          color: "#9ca3af",
                          fontSize: "0.8125rem"
                        }),
                        singleValue: (base) => ({
                          ...base,
                          margin: 0,
                          color: "#374151",
                          fontWeight: 600,
                          fontSize: "0.8125rem"
                        }),
                        indicatorsContainer: (base) => ({
                          ...base,
                          paddingRight: 2
                        }),
                        dropdownIndicator: (base, state) => ({
                          ...base,
                          padding: 0,
                          color: "#9ca3af",
                          transition: "transform 150ms ease",
                          transform: state.selectProps.menuIsOpen
                            ? "rotate(180deg)"
                            : "rotate(0deg)"
                        }),
                        indicatorSeparator: () => ({ display: "none" }),

                        // 👇 this is the fix — explicit solid background + elevation
                        menuPortal: (base) => ({
                          ...base,
                          zIndex: 9999
                        }),
                        menu: (base) => ({
                          ...base,
                          marginTop: 6,
                          backgroundColor: "#ffffff",
                          borderRadius: "0.75rem",
                          border: "1px solid #e5e7eb",
                          boxShadow:
                            "0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.05)",
                          overflow: "hidden"
                        }),
                        menuList: (base) => ({
                          ...base,
                          padding: 4,
                          maxHeight: 220,
                          backgroundColor: "#ffffff"
                        }),
                        option: (base, state) => ({
                          ...base,
                          borderRadius: "0.5rem",
                          padding: "8px 10px",
                          fontSize: "0.8125rem",
                          fontWeight: state.isSelected ? 600 : 500,
                          color: state.isSelected ? "#ef9a47" : "#374151",
                          backgroundColor: state.isSelected
                            ? "#fff2e8"
                            : state.isFocused
                              ? "#fff8f2"
                              : "#ffffff",
                          cursor: "pointer"
                        }),
                        noOptionsMessage: (base) => ({
                          ...base,
                          backgroundColor: "#ffffff",
                          fontSize: "0.8125rem",
                          color: "#9ca3af",
                          padding: "10px"
                        })
                      }}
                    />
                  )}
                />
              </InfoInputCard>

              <InfoInputCard
                icon={<FaBuilding size={12} />}
                iconBg="bg-[#edf7ff]"
                iconColor="text-[#4f98ff]"
                label="State"
              >
                <Controller
                  name="state"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={stateOptions}
                      value={
                        stateOptions.find((opt) => opt.value === field.value) ||
                        null
                      }
                      onChange={(option) => {
                        field.onChange(option?.value || "")
                        setSelectedState(option)
                      }}
                      isDisabled={!selectedCountry}
                      getOptionLabel={(o) => o.label}
                      getOptionValue={(o) => o.value}
                      placeholder="Select state"
                      isSearchable
                      classNamePrefix="rs"
                      unstyled
                      menuPortalTarget={
                        typeof document !== "undefined" ? document.body : null
                      }
                      menuPosition="fixed"
                      styles={{
                        control: (base) => ({
                          ...base,
                          minHeight: "auto",
                          padding: 0,
                          border: "none",
                          boxShadow: "none",
                          backgroundColor: "transparent",
                          cursor: "pointer"
                        }),
                        valueContainer: (base) => ({
                          ...base,
                          padding: 0
                        }),
                        input: (base) => ({
                          ...base,
                          margin: 0,
                          padding: 0,
                          color: "#374151",
                          fontSize: "0.8125rem"
                        }),
                        placeholder: (base) => ({
                          ...base,
                          margin: 0,
                          color: "#9ca3af",
                          fontSize: "0.8125rem"
                        }),
                        singleValue: (base) => ({
                          ...base,
                          margin: 0,
                          color: "#374151",
                          fontWeight: 600,
                          fontSize: "0.8125rem"
                        }),
                        indicatorsContainer: (base) => ({
                          ...base,
                          paddingRight: 2
                        }),
                        dropdownIndicator: (base, state) => ({
                          ...base,
                          padding: 0,
                          color: "#9ca3af",
                          transition: "transform 150ms ease",
                          transform: state.selectProps.menuIsOpen
                            ? "rotate(180deg)"
                            : "rotate(0deg)"
                        }),
                        indicatorSeparator: () => ({ display: "none" }),

                        // 👇 this is the fix — explicit solid background + elevation
                        menuPortal: (base) => ({
                          ...base,
                          zIndex: 9999
                        }),
                        menu: (base) => ({
                          ...base,
                          marginTop: 6,
                          backgroundColor: "#ffffff",
                          borderRadius: "0.75rem",
                          border: "1px solid #e5e7eb",
                          boxShadow:
                            "0 10px 25px -5px rgba(0,0,0,0.08), 0 8px 10px -6px rgba(0,0,0,0.05)",
                          overflow: "hidden"
                        }),
                        menuList: (base) => ({
                          ...base,
                          padding: 4,
                          maxHeight: 220,
                          backgroundColor: "#ffffff"
                        }),
                        option: (base, state) => ({
                          ...base,
                          borderRadius: "0.5rem",
                          padding: "8px 10px",
                          fontSize: "0.8125rem",
                          fontWeight: state.isSelected ? 600 : 500,
                          color: state.isSelected ? "#ef9a47" : "#374151",
                          backgroundColor: state.isSelected
                            ? "#fff2e8"
                            : state.isFocused
                              ? "#fff8f2"
                              : "#ffffff",
                          cursor: "pointer"
                        }),
                        noOptionsMessage: (base) => ({
                          ...base,
                          backgroundColor: "#ffffff",
                          fontSize: "0.8125rem",
                          color: "#9ca3af",
                          padding: "10px"
                        })
                      }}
                    />
                  )}
                />
              </InfoInputCard>
              {/* 
              <InfoInputCard
                icon={<FaGlobeAsia size={12} />}
                iconBg="bg-[#fff2e8]"
                iconColor="text-[#ef9a47]"
                label="Country"
              >
                <Controller
                  name="country"
                  control={control}
                  render={({ field }) => (
                    <Select
                      options={countryOptions}
                      value={
                        countryOptions.find(
                          (opt) => opt.value === field.value
                        ) || null
                      }
                      onChange={(option) => field.onChange(option?.value || "")}
                      getOptionLabel={(o) => o.label}
                      getOptionValue={(o) => o.value}
                    />
                  )}
                />
              </InfoInputCard> */}

              <InfoInputCard
                icon={<FaPhone size={12} />}
                iconBg="bg-[#fff1f6]"
                iconColor="text-[#f07ab1]"
                label="Landline No"
              >
                <input
                  type="tel"
                  {...register("landline")}
                  onBlur={(e) =>
                    setValue("landline", e.target.value.trim(), {
                      shouldDirty: true
                    })
                  }
                  className={tileInputClass}
                  placeholder="Landline"
                />
              </InfoInputCard>

              <InfoInputCard
                icon={<FaHashtag size={12} />}
                iconBg="bg-[#f5f0ff]"
                iconColor="text-[#9967ff]"
                label="Registration Type"
                error={errors.registrationType?.message}
              >
                <select
                  {...register("registrationType", {
                    required: "RegistrationType is required"
                  })}
                  className={tileInputClass}
                >
                  <option value="">Select RegistrationType</option>
                  <option value="unregistered">Unregistered/Consumer</option>
                  <option value="regular">Regular</option>
                </select>
              </InfoInputCard>

              <InfoInputCard
                  icon={<FaLandmark size={12} />}
                  iconBg="bg-[#fff8df]"
                  iconColor="text-[#d1a91b]"
                  label="Partner Selection"
                >
                  <Controller
                    name="partnerSelection"
                    control={control}
                    render={({ field }) => (
                      <select
                        value={getPartnerId(field.value)}
                        onChange={(event) => field.onChange(event.target.value)}
                        className={tileInputClass}
                      >
                        <option value="">Select partner customer</option>
                        {partnerCustomers?.map((customer) => {
                          const customerId = getPartnerId(customer)
                          return (
                            <option key={customerId} value={customerId}>
                              {customer.customerName}
                              {customer.mobile ? ` - ${customer.mobile}` : ""}
                            </option>
                          )
                        })}
                      </select>
                    )}
                  />
                </InfoInputCard>

              <InfoInputCard
                icon={<FaHashtag size={12} />}
                iconBg="bg-[#eefbf2]"
                iconColor="text-[#4cbf73]"
                label="Status"
              >
                <select {...register("customerIsActive")} className={tileInputClass}>
                  <option value="Running">Running</option>
                  <option value="Deactive">Deactive</option>
                </select>
              </InfoInputCard>

              {registrationType === "regular" && (
                <InfoInputCard
                  icon={<FaLandmark size={12} />}
                  iconBg="bg-[#fff1f7]"
                  iconColor="text-[#ee82a9]"
                  label="GSTIN / UIN"
                >
                  <input
                    type="text"
                    {...register("gstNo")}
                    onBlur={(e) =>
                      setValue("gstNo", e.target.value.trim(), {
                        shouldDirty: true
                      })
                    }
                    className={tileInputClass}
                    placeholder="Enter GSTIN"
                  />
                </InfoInputCard>
              )}
            </div>

            <div className="mt-4 border-t border-[#edf1f7] pt-4">
              <div className="grid max-w-md grid-cols-1 gap-3">
                <InfoInputCard
                  icon={<FaLandmark size={12} />}
                  iconBg="bg-[#fff8df]"
                  iconColor="text-[#d1a91b]"
                  label="Is this customer also a partner?"
                >
                  <Controller
                    name="isPartner"
                    control={control}
                    render={({ field }) => (
                      <div className="inline-flex w-full rounded-lg border border-[#dce3ee] bg-[#f7f9fc] p-1">
                        <button
                          type="button"
                          aria-pressed={!field.value}
                          onClick={() => {
                            field.onChange(false)
                            setValue("partner", "", { shouldDirty: true })
                          }}
                          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                            !field.value
                              ? "bg-white text-[#1b2a4a] shadow-sm"
                              : "text-[#8390a6] hover:text-[#526079]"
                          }`}
                        >
                          No
                        </button>
                        <button
                          type="button"
                          aria-pressed={Boolean(field.value)}
                          onClick={() => field.onChange(true)}
                          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                            field.value
                              ? "bg-[#1b2a4a] text-white shadow-sm"
                              : "text-[#8390a6] hover:text-[#526079]"
                          }`}
                        >
                          Yes
                        </button>
                      </div>
                    )}
                  />
                </InfoInputCard>

                {isPartnerCustomer && (
                  <InfoInputCard
                    icon={<FaLandmark size={12} />}
                    iconBg="bg-[#fff8df]"
                    iconColor="text-[#d1a91b]"
                    label="Partner Type"
                    error={errors.partner?.message}
                  >
                    <Controller
                      name="partner"
                      control={control}
                      rules={{ required: "Select a partner type" }}
                      render={({ field }) => (
                        <select
                          value={getPartnerId(field.value)}
                          onChange={(event) => field.onChange(event.target.value)}
                          className={tileInputClass}
                        >
                          <option value="">Select Partner</option>
                          {partner?.map((partnr) => {
                            const partnerId = getPartnerId(partnr)
                            return (
                              <option key={partnerId} value={partnerId}>
                                {partnr.partner}
                              </option>
                            )
                          })}
                        </select>
                      )}
                    />
                  </InfoInputCard>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[14px] border border-[#edf1f7] bg-white shadow-[0_6px_24px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between border-b border-[#f1f4f8] px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#eef5ff] text-[#3a7afe]">
                    <FaBuilding size={10} />
                  </div>
                  <h3 className="text-[13px] font-semibold text-[#1b2437]">
                    Primary Products
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => openAddPopup("Primaryproduct")}
                  className="text-[11px] font-medium text-[#2f80ed] hover:underline"
                >
                  Add Products
                </button>
              </div>

              <div className="min-h-[180px] px-4 py-5">
                {primaryProducts.length > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    {primaryProducts.map((item) => {
                      const actualIndex = tableData.findIndex((x) => x === item)
                      const isDeactive =
                        String(item?.isActive).toLowerCase() === "deactive"

                      return (
                        <ProductCircleCard
                          key={`primary-${actualIndex}`}
                          item={item}
                          productType="Primaryproduct"
                          actualIndex={actualIndex}
                          variant={isDeactive ? "danger" : "success"}
                          topBadgeIcon={<FaBuilding size={10} />}
                          line1={
                            item?.shortName
                              ? item?.shortName
                              : item?.productName
                          }
                          line2={item?.licensenumber}
                          line3={
                            item?.applicationDate
                              ? formatDateToDDMMYYYY(item?.applicationDate)
                              : ""
                          }
                          line4={isDeactive ? "De Active" : "Active"}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex h-[140px] items-center justify-center rounded-[12px] border border-dashed border-[#e7ebf4] bg-[#fbfcff] text-[12px] text-[#8a95ab]">
                    No primary products added.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[14px] border border-[#edf1f7] bg-white shadow-[0_6px_24px_rgba(15,23,42,0.05)]">
              <div className="flex items-center justify-between border-b border-[#f1f4f8] px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md bg-[#eef5ff] text-[#3a7afe]">
                    <FaBuilding size={10} />
                  </div>
                  <h3 className="text-[13px] font-semibold text-[#1b2437]">
                    Additional Services
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => openAddPopup("Additionalservice")}
                  className="text-[11px] font-medium text-[#2f80ed] hover:underline"
                >
                  Add Service
                </button>
              </div>

              <div className="min-h-[180px] px-4 py-5">
                {additionalServices.length > 0 ? (
                  <div className="flex flex-wrap gap-4">
                    {additionalServices.map((item) => {
                      const actualIndex = tableData.findIndex((x) => x === item)
                      const isDeactive =
                        String(item?.isActive).toLowerCase() === "deactive"
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)

                      const selectedTagged = Array.isArray(item?.taggeddata)
                        ? (() => {
                            const tagged = [...item.taggeddata].sort(
                              (a, b) =>
                                new Date(a.nextDue) - new Date(b.nextDue)
                            )

                            const overdue = tagged.find((x) => {
                              const d = new Date(x.nextDue)
                              d.setHours(0, 0, 0, 0)
                              return d < today
                            })

                            if (overdue) return overdue

                            const todayItem = tagged.find((x) => {
                              const d = new Date(x.nextDue)
                              d.setHours(0, 0, 0, 0)
                              return d.getTime() === today.getTime()
                            })

                            if (todayItem) return todayItem
                            return tagged[0] || null
                          })()
                        : null
                      console.log(selectedTagged)
                      const dueDate = selectedTagged?.nextDue || item?.nextDue

                      const isCurrentMonthExpiry = (() => {
                        if (!dueDate) return false
                        const date = new Date(dueDate)
                        const today = new Date()

                        return (
                          date.getFullYear() === today.getFullYear() &&
                          date.getMonth() === today.getMonth()
                        )
                      })()

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
                          line3={
                            selectedTagged
                              ? formatDateToDDMMYYYY(selectedTagged.nextDue)
                              : item?.nextDue
                                ? formatDateToDDMMYYYY(item.nextDue)
                                : ""
                          }
                          line4={isDeactive ? "De Active" : "Active"}
                          c={item?.taggeddata}
                          line5={
                            selectedTagged
                              ? selectedTagged.productAmount
                              : item?.productAmount
                          }
                          isCurrentMonthExpiry={isCurrentMonthExpiry}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex h-[140px] flex-col items-center justify-center rounded-[12px] border border-dashed border-[#e7ebf4] bg-[#fbfcff] text-center">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f4f8] text-[#9ca8be]">
                      <FaBuilding size={12} />
                    </div>
                    <p className="text-[12px] text-[#76839d]">
                      No additional services added.
                    </p>
                    <p className="mt-1 text-[11px] text-[#a0abc0]">
                      Click Add Service to get started.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              // onClick={() =>
              //   navigatebackto ? navigate(navigatebackto) : navigate(-1)
              // }
              onClick={handleCancelNavigation}
              className="rounded-lg border border-[#f1c7cc] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#d65b68] hover:bg-[#fff6f7]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-[#1f2937] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#111827] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? "Submitting..."
                : process === "Registration"
                  ? "Save Customer"
                  : "Update Customer"}
            </button>
          </div>
        </form>
      </div>

      {licenseloading && <FullScreenLoader text="Checking..." />}
      <UnsavedChangesModal
        open={showUnsavedModal}
        onClose={handleStayOnPage}
        onConfirm={handleLeavePage}
        title="Leave without saving?"
        description="You have unsaved customer details. If you continue, the entered data will be lost."
      />
      {showProductPopup && (
        <div className="fixed inset-0 z-50 bg-black/30 p-2 sm:p-3">
          <div className="flex min-h-full items-center justify-center">
            <div
              className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-[14px] bg-white shadow-2xl transition-all ${
                popupType === "Additionalservice" && hasTaggedLicenses
                  ? "max-w-4xl"
                  : "max-w-3xl"
              }`}
            >
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

                  {popupType === "Primaryproduct" && (
                    <PopupField
                      label="License Number"
                      error={
                        errors.licensenumber?.message ||
                        (!licenseAvailable && watchedLicense
                          ? "License number already exists"
                          : "")
                      }
                    >
                      <input
                        {...register("licensenumber")}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        readOnly={hasTaggedLicenses}
                        className={`${compactPopupInputClass} ${
                          hasTaggedLicenses
                            ? "cursor-not-allowed bg-[#f3f6fb]"
                            : ""
                        }`}
                        placeholder="Enter license number"
                        onKeyDown={(e) => {
                          if (hasTaggedLicenses) return

                          const allowedKeys = [
                            "Backspace",
                            "Delete",
                            "Tab",
                            "ArrowLeft",
                            "ArrowRight",
                            "Home",
                            "End",
                            "Control",
                            "Meta"
                          ]
                          // allow shortcuts like Ctrl+C, Ctrl+V, Ctrl+A
                          if (
                            (e.ctrlKey || e.metaKey) &&
                            ["a", "c", "v", "x"].includes(e.key.toLowerCase())
                          ) {
                            return
                          }

                          if (allowedKeys.includes(e.key)) return

                          if (!/^\d$/.test(e.key)) {
                            e.preventDefault()
                          }
                        }}
                        onChange={(e) => {
                          if (hasTaggedLicenses) return

                          const numericValue = e.target.value.replace(/\D/g, "")
                          setValue("licensenumber", numericValue, {
                            shouldValidate: true,
                            shouldDirty: true
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

                          debounceTimersRef.current[index] = setTimeout(() => {
                            handleLicenseBlur(numericValue)
                            delete debounceTimersRef.current[index]
                          }, 1000)

                          clearErrors("licensenumber")
                        }}
                      />
                    </PopupField>
                  )}

                  {popupType === "Primaryproduct" && (
                    <PopupField label="Software Trade">
                      <select
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
                        onWheel={(e) => e.currentTarget.blur()}
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
                    <select
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
                            {primaryLicenseOptions.map((option) => {
                              const selectedTaggedLicenses =
                                watch("taggedLicenses") || []
                              const checked = selectedTaggedLicenses.includes(
                                String(option.licenseNo)
                              )

                              return (
                                <label
                                  key={option.licenseNo}
                                  className="flex items-center gap-2 rounded-md border border-[#edf1f7] bg-white px-2 py-1.5 text-[11px] text-[#4f5d78]"
                                >
                                  {/* <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) => {
                                      const licenseNo = String(option.licenseNo)
                                      const prev = watch("taggedLicenses") || []
                                      const dueMap =
                                        watch("taggedLicenseDueDates") || {}
                                      console.log(dueMap)
                                      if (e.target.checked) {
                                        setValue(
                                          "taggedLicenses",
                                          [...prev, licenseNo],
                                          {
                                            shouldDirty: true
                                          }
                                        )
                                        setValue("licensenumber", "", {
                                          shouldDirty: true
                                        })
                                        setValue(
                                          "taggedLicenseDueDates",
                                          {
                                            ...dueMap,
                                            [licenseNo]: dueMap[licenseNo] || ""
                                          },
                                          { shouldDirty: true }
                                        )
                                        console.log(detailsData.taggeddata)
                                        const matched =
                                          detailsData?.taggeddata?.find(
                                            (item) =>
                                              String(item.licensenumber) ===
                                              licenseNo
                                          )
                                        console.log(matched)

                                        if (matched) {
                                          console.log("hh")
                                          const currentValues = getValues()

                                          reset({
                                            ...currentValues,
                                            taggedLicenseDueDates: {
                                              ...currentValues.taggedLicenseDueDates,
                                              [licenseNo]: {
                                                nextDue: matched.nextDue || "",
                                                productAmount:
                                                  matched.productAmount ?? "",
                                                taxexclusiveAmount:
                                                  matched.taxexclusiveAmount ??
                                                  "",
                                                taxinclusiveamount:
                                                  matched.taxinclusiveamount ??
                                                  "",
                                                hsn: matched.hsn ?? ""
                                              }
                                            }
                                          })
                                        } else {
                                          const currentValues = getValues()
                                          const filteredproduct =
                                            productOptions.filter(
                                              (item) =>
                                                item.value ===
                                                currentValues?.productName
                                                  ?.value
                                            )

                                          reset({
                                            ...currentValues,
                                            taggedLicenseDueDates: {
                                              ...currentValues.taggedLicenseDueDates,
                                              [licenseNo]: {
                                                nextDue: "",
                                                productAmount: "",
                                                taxexclusiveAmount:
                                                  filteredproduct[0]
                                                    ?.basePrice || 0,
                                                taxinclusiveamount:
                                                  filteredproduct[0]
                                                    ?.productprice || 0,
                                                hsn:
                                                  filteredproduct[0]
                                                    ?.igstRate || 0,
                                                nextDueTax:
                                                  filteredproduct[0]
                                                    ?.igstRate || 0
                                              }
                                            }
                                          })
                                        }
                                      } else {
                                        const updatedLicenses = prev.filter(
                                          (item) => String(item) !== licenseNo
                                        )

                                        const updatedDueMap = { ...dueMap }
                                        delete updatedDueMap[licenseNo]

                                        setValue(
                                          "taggedLicenses",
                                          updatedLicenses,
                                          { shouldDirty: true }
                                        )
                                        setValue(
                                          "taggedLicenseDueDates",
                                          updatedDueMap,
                                          {
                                            shouldDirty: true
                                          }
                                        )

                                        if (updatedLicenses.length === 0) {
                                          setValue("licensenumber", "", {
                                            shouldDirty: true
                                          })
                                        }
                                      }
                                    }}
                                  /> */}

                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(event) =>
                                      taggedLicenseCheckboxOnChange(
                                        event,
                                        option
                                      )
                                    }
                                  />

                                  <span>{option.licenseNo}</span>
                                  <span className="text-[#7b879c]">
                                    - {option.productName}
                                  </span>
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
                      {/* Put the validation message here */}
                      {errors.taggedLicenses?.message && (
                        <p className="mt-1 text-[11px] text-red-500">
                          {errors.taggedLicenses.message}
                        </p>
                      )}
                    </div>
                  )}

                  {popupType === "Additionalservice" && hasTaggedLicenses && (
                    <div className="md:col-span-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="border-b border-slate-200 px-4 py-3">
                        <h3 className="text-sm font-semibold text-slate-800">
                          Tagged License Due Details
                        </h3>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {watchedTaggedLicenses.length} license
                          {watchedTaggedLicenses.length > 1 ? "s" : ""} tagged
                          to this service
                        </p>
                      </div>

                      <div className="w-full">
                        <table className="w-full table-fixed border-collapse">
                          <colgroup>
                            <col style={{ width: "22%" }} /> {/* License No */}
                            <col style={{ width: "12%" }} /> {/* Users */}
                            <col style={{ width: "16%" }} /> {/* Serial No */}
                            <col style={{ width: "20%" }} /> {/* Next Due */}
                            <col style={{ width: "20%" }} />{" "}
                            {/* Next Due Amt */}
                            <col style={{ width: "10%" }} /> {/* Due Tax */}
                          </colgroup>

                          <thead className="bg-slate-100">
                            <tr className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-500">
                              <th className="border-b border-slate-200 px-2 py-2.5 text-left">
                                License No.
                              </th>
                              <th className="border-b border-slate-200 px-1.5 py-2.5 text-center">
                                Users
                              </th>
                              <th className="border-b border-slate-200 px-1.5 py-2.5 text-center">
                                Serial No
                              </th>
                              <th className="border-b border-slate-200 px-1.5 py-2.5 text-center">
                                Next Due
                              </th>
                              <th className="border-b border-slate-200 px-1.5 py-2.5 text-right">
                                Next Due Amt
                              </th>
                              <th className="border-b border-slate-200 px-1.5 py-2.5 text-center">
                                Tax
                              </th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">
                            {watchedTaggedLicenses.map((licenseNo) => (
                              <tr
                                key={licenseNo}
                                className="align-top odd:bg-white even:bg-slate-50/60"
                              >
                                {/* License No */}
                                <td className="px-2 py-2">
                                  <input
                                    value={licenseNo}
                                    readOnly
                                    title={licenseNo}
                                    className="h-7 w-full cursor-not-allowed truncate rounded-md border border-slate-200 bg-slate-100 px-2 text-[11px] text-slate-500 outline-none"
                                  />
                                </td>

                                {/* Users */}
                                <td className="px-1.5 py-2">
                                  <input
                                    type="number"
                                    value={
                                      watchedTaggedLicenseDueDates?.[licenseNo]
                                        ?.noofusers ?? ""
                                    }
                                    onChange={(e) => {
                                      const dueMap =
                                        watch("taggedLicenseDueDates") || {}

                                      setValue(
                                        "taggedLicenseDueDates",
                                        {
                                          ...dueMap,
                                          [licenseNo]: {
                                            ...dueMap[licenseNo],
                                            noofusers: e.target.value
                                          }
                                        },
                                        { shouldDirty: true }
                                      )
                                    }}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    className="h-7 w-full rounded-md border border-slate-200 bg-white px-1.5 text-center text-[11px] text-slate-700 outline-none transition focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A]/10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                  />
                                </td>

                                {/* Serial No */}
                                <td className="px-1.5 py-2">
                                  <input
                                    type="text"
                                    value={
                                      watchedTaggedLicenseDueDates?.[licenseNo]
                                        ?.serialNumber ?? ""
                                    }
                                    onChange={(e) => {
                                      const dueMap =
                                        watch("taggedLicenseDueDates") || {}

                                      setValue(
                                        "taggedLicenseDueDates",
                                        {
                                          ...dueMap,
                                          [licenseNo]: {
                                            ...dueMap[licenseNo],
                                            serialNumber: e.target.value
                                          }
                                        },
                                        { shouldDirty: true }
                                      )
                                    }}
                                    className="h-7 w-full rounded-md border border-slate-200 bg-white px-1.5 text-center text-[11px] text-slate-700 outline-none transition focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A]/10"
                                  />
                                </td>

                                {/* Next Due (date) */}
                                <td className="px-1.5 py-2">
                                  <input
                                    type="date"
                                    value={formatDateForInput(
                                      watchedTaggedLicenseDueDates?.[licenseNo]
                                        ?.nextDue
                                    )}
                                    onChange={(e) => {
                                      const dueMap =
                                        watch("taggedLicenseDueDates") || {}

                                      setValue(
                                        "taggedLicenseDueDates",
                                        {
                                          ...dueMap,
                                          [licenseNo]: {
                                            ...dueMap[licenseNo],
                                            nextDue: e.target.value
                                          }
                                        },
                                        { shouldDirty: true }
                                      )
                                    }}
                                    className="h-7 w-full rounded-md border border-slate-200 bg-white px-1.5 text-center text-[11px] text-slate-700 outline-none transition focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A]/10"
                                  />
                                </td>

                                {/* Next Due Amount (+ inclusive total underneath) — old tax-calc logic, no handleTaggedDueChange */}
                                <td className="px-1.5 py-2">
                                  <div className="space-y-0.5">
                                    <input
                                      type="number"
                                      value={
                                        watchedTaggedLicenseDueDates?.[
                                          licenseNo
                                        ]?.taxexclusiveAmount ?? ""
                                      }
                                      onWheel={(e) => e.currentTarget.blur()}
                                      onKeyDown={(e) => {
                                        if (
                                          ["-", "+", "e", "E"].includes(e.key)
                                        ) {
                                          e.preventDefault()
                                        }
                                      }}
                                      onChange={(e) => {
                                        const inputValue = e.target.value
                                        const dueMap =
                                          watch("taggedLicenseDueDates") || {}
                                        const matchedData = dueMap[licenseNo]

                                        const isTaxApplied =
                                          Number(matchedData?.nextDueTax || 0) >
                                          0
                                        const taxAmount = isTaxApplied
                                          ? (Number(
                                              matchedData?.hsn ||
                                                matchedData?.originalHsn ||
                                                0
                                            ) /
                                              100) *
                                            Number(inputValue || 0)
                                          : 0
                                        const total = Math.round(
                                          Number(inputValue || 0) + taxAmount
                                        )

                                        setValue(
                                          "taggedLicenseDueDates",
                                          {
                                            ...dueMap,
                                            [licenseNo]: {
                                              ...matchedData,
                                              taxexclusiveAmount: inputValue,
                                              taxinclusiveamount: total,
                                              productAmount: total
                                            }
                                          },
                                          { shouldDirty: true }
                                        )
                                      }}
                                      className="h-7 w-full rounded-md border border-slate-200 bg-white px-1.5 text-right text-[11px] text-slate-700 outline-none transition focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A]/10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                    />
                                    <p className="truncate text-right text-[12px] text-slate-600">
                                      {Number(
                                        watchedTaggedLicenseDueDates?.[
                                          licenseNo
                                        ]?.taxinclusiveamount || 0
                                      ).toFixed(2)}
                                    </p>
                                  </div>
                                </td>

                                {/* Due Tax — same watch/setValue pattern, recalculates the amount fields when toggled */}
                                <td className="px-1.5 py-2">
                                  <div className="flex justify-center pt-1">
                                    <label className="inline-flex cursor-pointer items-center justify-center">
                                      <input
                                        type="checkbox"
                                        checked={
                                          Number(
                                            watchedTaggedLicenseDueDates?.[
                                              licenseNo
                                            ]?.nextDueTax || 0
                                          ) > 0
                                        }
                                        onChange={(e) => {
                                          const checked = e.target.checked
                                          console.log(checked)
                                          const dueMap =
                                            watch("taggedLicenseDueDates") || {}
                                          const matchedData = dueMap[licenseNo]
                                          const hsn = Number(
                                            matchedData?.hsn ||
                                              matchedData?.originalHsn ||
                                              0
                                          )
                                          console.log(hsn)
                                          const exclusiveAmount = Number(
                                            matchedData?.taxexclusiveAmount || 0
                                          )

                                          const taxAmount = checked
                                            ? (hsn / 100) * exclusiveAmount
                                            : 0
                                          const total = Math.round(
                                            exclusiveAmount + taxAmount
                                          )

                                          setValue(
                                            "taggedLicenseDueDates",
                                            {
                                              ...dueMap,
                                              [licenseNo]: {
                                                ...matchedData,
                                                nextDueTax: checked ? hsn : 0,
                                                taxinclusiveamount: total,
                                                productAmount: total
                                              }
                                            },
                                            { shouldDirty: true }
                                          )
                                        }}
                                        className="sr-only"
                                      />
                                      <span
                                        className={`flex h-5 w-5 items-center justify-center rounded border text-[11px] shadow-sm transition-all duration-200 ${
                                          Number(
                                            watchedTaggedLicenseDueDates?.[
                                              licenseNo
                                            ]?.nextDueTax || 0
                                          ) > 0
                                            ? "border-[#1B2A4A] bg-[#1B2A4A] text-white"
                                            : "border-slate-300 bg-white text-transparent"
                                        }`}
                                      >
                                        ✓
                                      </span>
                                    </label>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
                <button
                  type="button"
                  onClick={savePopupData}
                  className="rounded-md bg-[#2f80ed] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#246cd0]"
                >
                  Save Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

     

      {licenseRemoveConfirm.open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-license-title"
            className="w-full max-w-md rounded-xl bg-white shadow-2xl"
          >
            <div className="border-b border-slate-200 px-5 py-4">
              <h3
                id="remove-license-title"
                className="text-sm font-semibold text-slate-800"
              >
                Remove tagged license?
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                License number{" "}
                <span className="font-semibold text-slate-700">
                  {licenseRemoveConfirm.licenseNo}
                </span>{" "}
                will be removed from this additional service. Its due date,
                users, serial number, and amount details will also be removed.
              </p>
            </div>

            <div className="flex justify-end gap-2 px-5 py-4">
              <button
                type="button"
                onClick={cancelTaggedLicenseRemoval}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmTaggedLicenseRemoval}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-red-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const InfoInputCard = ({ icon, iconBg, iconColor, label, children, error }) => {
  return (
    <div className="rounded-[14px] border border-[#edf1f7] bg-white px-3 py-3 transition hover:border-[#dbe6ff]">
      <div className="flex items-start gap-3">
        <div
          className={`mt-[2px] flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${iconBg} ${iconColor}`}
        >
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[11px] font-medium text-[#8c96ad]">{label}</p>
          {children}
          {error ? (
            <p className="mt-1 text-[11px] text-red-500">{error}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const PopupField = ({ label, children, error }) => {
  console.log(label)
  if (label === "License Number") {
    console.log(error)
  }
  console.log(error)
  return (
    <div>
      <label className="mb-1 block text-[12px] font-medium text-[#5d6983]">
        {label}
      </label>
      {children}
      {/* {error ? <p className="mt-1 text-[11px] text-red-500">{error}</p> : null} */}
    </div>
  )
}

const ProductCircleCard = ({
  item,
  actualIndex,
  productType,
  variant,
  topBadgeIcon,
  line1,
  line2,
  line3,
  line4,
  line5,
  onEdit,
  onDelete,
  c,
  isCurrentMonthExpiry
}) => {
  const variantClass =
    variant === "danger"
      ? "bg-[#ffdedd] border-[#f4c6c2]"
      : variant === "service"
        ? "bg-[#fff3c9] border-[#f0e1a2]"
        : "bg-[#dff3d2] border-[#cce6bc]"

  return (
    <div className="group relative">
      <button
        type="button"
        onClick={() => onEdit(item, actualIndex)}
        className={`relative flex h-[120px] w-[120px] flex-col items-center justify-center overflow-hidden rounded-full border text-center shadow-sm transition hover:scale-[1.02] ${variantClass} ${
          isCurrentMonthExpiry
            ? "animate-pulse ring-4 ring-red-500 ring-offset-2"
            : ""
        }`}
      >
        <div className="mr-1 flex w-[90px] flex-col items-center justify-center">
          <p className="line-clamp-2 w-full overflow-hidden break-words text-center text-[10px] font-medium leading-[12px] text-[#1e293b]">
            {line1}
          </p>

          {line2 ? (
            <p className="mt-1 w-full truncate text-center text-[10px] font-medium leading-[12px] text-[#4b5563]">
              {line2}
            </p>
          ) : null}

          {line3 ? (
            <p className="mt-1 w-full whitespace-nowrap text-center text-[10px] font-semibold leading-[10px] text-[#d35c5c]">
              {productType === "Primaryproduct" ? "Date" : "Due"} : {line3}
            </p>
          ) : null}

          {line4 ? (
            <p
              className={`mt-1 w-full truncate text-center text-[9px] font-bold leading-[11px] ${
                line4 === "Active" ? "text-green-600" : "text-orange-500"
              }`}
            >
              {line4}
            </p>
          ) : null}

          {line5 ? (
            <p className="mt-1 w-full truncate text-center text-[9px] font-bold leading-[11px] text-[#0b66e6]">
              Amount : {line5}
            </p>
          ) : null}
        </div>
      </button>

      <div className="absolute -right-2 -top-2 hidden gap-1 group-hover:flex">
        <button
          type="button"
          onClick={() => onEdit(item, actualIndex)}
          className="rounded-full bg-white p-2 text-green-600 shadow"
        >
          <FaEdit size={10} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(actualIndex)}
          className="rounded-full bg-white p-2 text-red-600 shadow"
        >
          <FaTrash size={10} />
        </button>
      </div>
    </div>
  )
}

const tileInputClass =
  "w-full border-0 bg-transparent p-0 text-[12px] font-medium text-[#1f2a3d] outline-none placeholder:text-[#c0c8d8]"

const compactPopupInputClass =
  "w-full rounded-[8px] border border-[#dfe5ee] px-2.5 py-1.5 text-[12px] text-[#1f2a3d] outline-none focus:border-[#7ba7ff]"

export default CustomerAdd
