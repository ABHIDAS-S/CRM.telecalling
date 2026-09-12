import { useEffect, useState, useMemo, useRef, useLayoutEffect } from "react"
import { useLocation } from "react-router-dom"
import { createPortal } from "react-dom"
import { useSelector } from "react-redux"
import { useDispatch } from "react-redux"
import { parsePhoneNumberFromString } from "libphonenumber-js/mobile"
import { Country, State } from "country-state-city"
import BarLoader from "react-spinners/BarLoader"
import { FaSpinner } from "react-icons/fa"
import Select from "react-select"
import { useForm, Controller } from "react-hook-form"
import PopUp from "../../components/common/PopUp"
import { toast } from "react-toastify"
import UseFetch from "../../hooks/useFetch"
import api from "../../api/api"
import { useNavigate } from "react-router-dom"
import Breadcrumb from "../../components/common/Breadcrumb"
import { Loader } from "lucide-react"
import { setsliceselectedBranch } from "../../../slices/companyBranchSlice"
import FullScreenLoader from "../../components/common/FullScreenLoader"

let leadRowSequence = 0
const createLeadRowId = () => {
  leadRowSequence += 1
  return `lead-row-${Date.now()}-${leadRowSequence}`
}
// import { parse } from "path"
// ─────────────────────────────────────────────────────────────────────────────
// DropdownPortal — keeps dropdown aligned on scroll/resize
// ─────────────────────────────────────────────────────────────────────────────
function DropdownPortal({ anchorEl, children }) {
  const [coords, setCoords] = useState(null)

  const reposition = () => {
    if (!anchorEl) return
    const rect = anchorEl.getBoundingClientRect()
    setCoords({
      top: rect.bottom + window.scrollY + 2,
      left: rect.left + window.scrollX,
      width: rect.width
    })
  }

  useLayoutEffect(() => {
    if (!anchorEl) return
    reposition()

    const handleScrollOrResize = () => reposition()

    window.addEventListener("scroll", handleScrollOrResize, true)
    window.addEventListener("resize", handleScrollOrResize)

    let ro
    if (window.ResizeObserver) {
      ro = new ResizeObserver(() => reposition())
      ro.observe(anchorEl)
    }

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true)
      window.removeEventListener("resize", handleScrollOrResize)
      if (ro && anchorEl) ro.unobserve(anchorEl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorEl])

  if (!coords) return null

  return createPortal(
    <div
      data-lead-portal="true"
      style={{
        position: "absolute",
        top: coords.top,
        left: coords.left,
        minWidth: Math.max(coords.width, 220),
        zIndex: 9999
      }}
    >
      {children}
    </div>,
    document.body
  )
}

function LicenseDropdown({
  index,
  item,
  isReadOnly,
  customerTableData,
  selectedleadlist,
  setSelectedLeadList,
  setunselectedtaggedlicense,
  setTakenLicense
}) {
  console.log(item)
  const isMulti =
    String(item?.productorservicetype || "").toLowerCase() ===
    "additionalservice"

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const dropdownId = `license-dropdown-${index}`

  const selectedLicenses = isMulti ? item?.licenseNumbers || [] : []

  const multiDisplayValue = selectedLicenses.length
    ? String(selectedLicenses[0]?.licenseNumber ?? "")
    : ""

  useEffect(() => {
    if (isMulti) {
      setSearch("")
    } else {
      setSearch(String(item?.licenseNumber ?? ""))
    }
  }, [item?.licenseNumber, item?.productorServiceId, isMulti])

  useEffect(() => {
    const handlePointerDown = (event) => {
      const target = event.target
      const wrapperEl = wrapperRef.current
      const dropdownEl = document.getElementById(dropdownId)

      const clickedInsideWrapper = wrapperEl && wrapperEl.contains(target)
      const clickedInsideDropdown = dropdownEl && dropdownEl.contains(target)

      if (!clickedInsideWrapper && !clickedInsideDropdown) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handlePointerDown)
    document.addEventListener("touchstart", handlePointerDown)

    return () => {
      document.removeEventListener("mousedown", handlePointerDown)
      document.removeEventListener("touchstart", handlePointerDown)
    }
  }, [dropdownId])
  console.log(customerTableData)
  const filtered = (customerTableData || []).filter((lic) => {
    const q = String(search || "")
      .toLowerCase()
      .trim()
    if (!q) return true

    const license = String(lic?.licenseNumber ?? "").toLowerCase()
    const product = String(
      lic?.productName || lic?.productorServiceName || ""
    ).toLowerCase()

    return license.includes(q) || product.includes(q)
  })

  const updateRow = (newRow) => {
    setSelectedLeadList((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              ...newRow
            }
          : row
      )
    )
  }

  const addLicense = (lic) => {
    if (!lic) return

    if (isMulti) {
      updateRow({
        licenseNumbers: [
          {
            licenseNumber: lic?.licenseNumber,
            productorServiceId: item?.productorServiceId || "",
            productorServiceName: item?.productorServiceName || "",
            sourceIndex: lic?.sourceIndex
          }
        ]
      })

      setTakenLicense((prev) => ({
        ...prev,
        [item?.productorServiceName]: [String(lic?.licenseNumber)]
      }))

      return
    }

    updateRow({
      licenseNumber: lic?.licenseNumber || ""
    })

    setSearch(String(lic?.licenseNumber ?? ""))
    setOpen(false)
  }

  const removeLicense = (licenseNumber) => {
    if (!isMulti) return

    updateRow({
      licenseNumbers: (item?.licenseNumbers || []).filter(
        (x) => String(x?.licenseNumber) !== String(licenseNumber)
      )
    })

    setTakenLicense((prev) => {
      const updated = { ...prev }
      delete updated[item?.productorServiceName]
      return updated
    })
  }

  const handleInputChange = (e) => {
    setSearch(e.target.value)
    setOpen(true)
  }

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        disabled={isReadOnly}
        value={isMulti ? (open ? search : multiDisplayValue) : search}
        onChange={handleInputChange}
        onClick={() => {
          if (!isReadOnly) setOpen(true)
        }}
        placeholder={
          isMulti ? "Search / Add License" : "Search / Select License"
        }
        className={`w-full px-2 py-1 border border-gray-200 rounded text-xs bg-[#EEF2F8] outline-none ${
          isReadOnly ? "cursor-not-allowed opacity-70" : "cursor-text"
        }`}
      />

      {open && (
        <DropdownPortal anchorEl={inputRef.current}>
          <div
            id={dropdownId}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="max-h-52 overflow-hidden rounded border border-gray-200 bg-white shadow-xl"
          >
            <ul className="max-h-52 overflow-y-auto text-xs">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 italic text-gray-400">
                  No results found
                </li>
              ) : (
                filtered.map((lic, i) => {
                  const valStr = String(lic?.licenseNumber ?? "")
                  const productName =
                    lic?.productName || lic?.productorServiceName || ""

                  const alreadyAdded = isMulti
                    ? (item?.licenseNumbers || []).some(
                        (x) => String(x?.licenseNumber) === valStr
                      )
                    : false

                  return (
                    <li
                      key={lic?._id || `${lic?.licenseNumber}-${i}`}
                      className={`flex items-center justify-between gap-2 px-3 py-2 hover:bg-blue-50 ${
                        alreadyAdded
                          ? "bg-blue-50 font-semibold text-[#1B2A4A]"
                          : "text-gray-700"
                      }`}
                    >
                      {isMulti ? (
                        <label className="flex w-full cursor-pointer items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <input
                              type="checkbox"
                              checked={alreadyAdded}
                              disabled={isReadOnly}
                              onChange={(e) => {
                                const checkedvalue = e.target.checked
                                const productKey = item?.productorServiceName
                                const productId = item?.productorServiceId

                                setunselectedtaggedlicense((prev) => {
                                  const updated = { ...prev }
                                  delete updated[productId]
                                  return updated
                                })

                                if (checkedvalue) {
                                  updateRow({
                                    licenseNumbers: [
                                      {
                                        licenseNumber: lic?.licenseNumber,
                                        productorServiceId:
                                          item?.productorServiceId || "",
                                        productorServiceName:
                                          item?.productorServiceName || "",
                                        sourceIndex: lic?.sourceIndex
                                      }
                                    ]
                                  })

                                  setTakenLicense((prev) => ({
                                    ...prev,
                                    [productKey]: [String(lic?.licenseNumber)]
                                  }))
                                } else {
                                  updateRow({
                                    licenseNumbers: []
                                  })

                                  setTakenLicense((prev) => {
                                    const updated = { ...prev }
                                    delete updated[productKey]
                                    return updated
                                  })
                                }
                              }}
                              className="h-3.5 w-3.5 cursor-pointer accent-blue-600"
                            />
                            <span className="font-medium">{valStr}</span>
                          </div>

                          <span className="truncate text-gray-400">
                            {productName}
                          </span>
                        </label>
                      ) : (
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onMouseDown={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            addLicense(lic)
                          }}
                          className="flex w-full items-center justify-between gap-2 text-left"
                        >
                          <span className="font-medium">{valStr}</span>
                          <span className="truncate text-gray-400">
                            {productName}
                          </span>
                        </button>
                      )}
                    </li>
                  )
                })
              )}
            </ul>
          </div>
        </DropdownPortal>
      )}
    </div>
  )
}

function ProductDropdown({
  index,
  item,
  process,
  from,
  isReadOnly,
  leadList,
  selectedleadlist,
  setSelectedLeadList,
  selectedBranch,
  selectedCustomer,
  setTakenLicense,
  setCustomerTableData
}) {
  console.log(index)
  console.log(isReadOnly)
  const emptyRow = {
    licenseNumber: "",
    licenseNumbers: [],
    productorServiceId: "",
    productorServiceName: "",
    productPrice: "",
    hsn: "",
    netAmount: ""
  }

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState(item.productorServiceName || "")
  const inputRef = useRef(null)
  const [selectionMessage, setselectionMessage] = useState({})

  useEffect(() => {
    setSearch(item.productorServiceName || "")
  }, [item.productorServiceName])

  useEffect(() => {
    const handler = (e) => {
      const portals = document.querySelectorAll("[data-lead-portal]")
      const inPortal = Array.from(portals).some((p) => p.contains(e.target))
      if (!inPortal && !inputRef.current?.contains(e.target)) {
        setOpen(false)
      }
    }

    if (open) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const filtered = (leadList || []).filter((prod) => {
    if (!search) return true
    const q = search.toLowerCase()
    const name =
      prod.productName?.toLowerCase() || prod.serviceName?.toLowerCase() || ""
    return name.includes(q)
  })
  console.log(filtered)

  const clearPreviousTakenLicense = (previousProductKey) => {
    if (!previousProductKey || !setTakenLicense) return

    setTakenLicense((prev) => {
      const updated = { ...prev }
      delete updated[previousProductKey]
      return updated
    })
  }

  const getRowId = (value) => {
    return String(value?._id || value?.id || value || "")
  }

  const getRowType = (row) =>
    String(row?.productorservicetype || "").toLowerCase()

  const getCleanProductRow = (overrides = {}) => ({
    ...emptyRow,
    rowId: item?.rowId || createLeadRowId(),
    itemType: "",
    productPrice: "",
    productorservicetype: "",
    hsn: "",
    netAmount: "",
    actualHsn: "",
    actualproductPrice: "",
    actualNetAmount: "",
    softwareTrade: "",
    applicationDate: "",
    status: "Running",
    isActive: "Running",
    nextDue: "",
    quantityUsers: "",
    noofusers: "",
    serialNumber: "",
    amount: "",
    discountAmount: "",
    taggeddata: [],
    company_id: "",
    branch_id: "",
    ...overrides
  })

  const removeAttachedAdditionalServiceRows = (rows, rowIndex) => {
    const productId = getRowId(rows?.[rowIndex]?.productorServiceId)
    const removedRows = []
    let reachedNextPrimary = false

    const filteredRows = (rows || []).filter((row, idx) => {
      if (idx <= rowIndex) return true
      if (reachedNextPrimary) return true

      const rowType = getRowType(row)
      if (rowType === "primaryproduct") {
        reachedNextPrimary = true
        return true
      }

      const parentId = getRowId(row?.parentPrimaryProductId)
      const shouldRemove =
        rowType === "additionalservice" &&
        (!parentId || parentId === productId || row?.isDefaultService)

      if (shouldRemove) {
        removedRows.push(row)
        return false
      }

      return true
    })

    return { filteredRows, removedRows }
  }

  const clearTakenLicensesForRows = (rows) => {
    if (!rows?.length || !setTakenLicense) return

    setTakenLicense((prev) => {
      const updated = { ...prev }

      rows.forEach((row) => {
        const serviceName = row?.productorServiceName || ""
        const keyToDelete = Object.keys(updated).find(
          (key) => key.toLowerCase() === serviceName.toLowerCase()
        )

        if (keyToDelete) delete updated[keyToDelete]
      })

      return updated
    })
  }

  const removeOldLicensesFromCustomerTable = () => {
    console.log("hh")
    const oldSingleLicense = item?.licenseNumber
    const oldMultiLicenses = (item?.licenseNumbers || []).map((lic) =>
      String(lic?.licenseNumber)
    )

    const licensesToRemove = [
      ...(oldSingleLicense ? [String(oldSingleLicense)] : []),
      ...oldMultiLicenses
    ]
    console.log(licensesToRemove)
    console.log(oldSingleLicense)
    console.log(oldMultiLicenses)
    if (!licensesToRemove.length || !setCustomerTableData) return

    setCustomerTableData((prev) =>
      (prev || []).filter(
        (row) => !licensesToRemove.includes(String(row?.licenseNumber))
      )
    )
  }

  const applySelection = (prod) => {
    console.log(prod)
    const previousProductKey = item?.productorServiceName || ""

    const branchdata = (prod?.selected || [])
      .filter((entry) => entry.branch_id === selectedBranch)
      .map((entry) => ({
        company_id: entry.company_id,
        branch_id: entry.branch_id
      }))

    if (
      selectedCustomer === null ||
      selectedCustomer === undefined ||
      selectedCustomer === ""
    ) {
      setselectionMessage({
        productmessage: "Please select the customer first"
      })

      setTimeout(() => {
        setselectionMessage({ productmessage: "" })
      }, 3000)

      return
    }

    const base = selectedleadlist?.length
      ? [...selectedleadlist]
      : [{ ...emptyRow }]

    let updated = [...base]
    const { filteredRows, removedRows } = removeAttachedAdditionalServiceRows(
      updated,
      index
    )
    updated = filteredRows
    clearTakenLicensesForRows(removedRows)
    console.log("hhh")
    if (!prod) {
      console.log("hhh")
      clearPreviousTakenLicense(previousProductKey)
      // removeOldLicensesFromCustomerTable()

      updated[index] = getCleanProductRow({
        productorServiceId: "",
        productorServiceName: "",
        licenseNumber: "",
        licenseNumbers: []
      })

      setSearch("")
      setSelectedLeadList(updated)
      return
    }

    const filteredbranch = prod?.selected?.filter(
      (entry) => entry.branch_id === selectedBranch
    )

    const igstRate = filteredbranch?.[0]?.hsn_id?.onValue?.igstRate
    const price = Number(prod?.productPrice || 0)
    const igst = Number(igstRate || 0)
    const rawNet = price + (igst / 100) * price
    const netAmount = Math.round(rawNet)

    clearPreviousTakenLicense(previousProductKey)
    console.log("hhhh")
    // removeOldLicensesFromCustomerTable()

    updated[index] = getCleanProductRow({
      productorServiceId: prod._id,
      productorServiceName: prod.productName || prod.serviceName,
      itemType: prod.productName ? "Product" : "Service",
      productPrice: prod.productPrice || 0,
      productorservicetype: prod?.productorservicetype,
      hsn: igstRate || 0,
      netAmount,
      company_id: branchdata?.[0]?.company_id || "",
      branch_id: branchdata?.[0]?.branch_id || "",
      actualHsn: igstRate,
      actualproductPrice: prod?.productPrice,
      actualNetAmount: netAmount,
      licenseNumber: "",
      licenseNumbers: []
    })

    const shouldAddDefaultServices =
      process === "closing" || from === "closedlead"

    if (prod?.defaultservices?.length > 0 && shouldAddDefaultServices) {
      const primaryId = getRowId(prod)
      const primaryLicense = updated[index]?.licenseNumber || ""

      const defaultServiceRows = prod.defaultservices.map((service) => {
        const matchbranchrate = service.selected?.find(
          (b) => b.branch_id === selectedBranch
        )

        const rawRate = matchbranchrate?.hsn_id?.onValue?.igstRate ?? 0
        const hsn = Number(rawRate) || 0
        const servicePrice = Number(service.productPrice) || 0

        const actualNetAmount =
          hsn > 0
            ? Number((servicePrice * (1 + hsn / 100)).toFixed(2))
            : servicePrice

        return {
          ...emptyRow,
          rowId: createLeadRowId(),
          licenseNumber: "",
          licenseNumbers: primaryLicense
            ? [
                {
                  licenseNumber: primaryLicense,
                  productorServiceId: getRowId(service),
                  productorServiceName:
                    service?.productName || service?.serviceName || "",
                  sourceIndex: index
                }
              ]
            : [],
          productorServiceId: getRowId(service),
          productorServiceName:
            service?.productName || service?.serviceName || "",
          itemType: service?.productName ? "Product" : "Service",
          productPrice: 0,
          hsn: 0,
          productorservicetype:
            service?.productorservicetype || "Additionalservice",
          netAmount: 0,
          isDefaultService: true,
          parentPrimaryProductId: primaryId,
          taggeddata: primaryLicense
            ? [
                {
                  licensenumber: primaryLicense,
                  nextDue: "",
                  noofusers: "",
                  serialNumber: "",
                  nextDueAmount: service?.productPrice || 0,
                  totalnextDueAmount: actualNetAmount,
                  nextDueTax: hsn,
                  productAmount: actualNetAmount,
                  taxexclusiveAmount: servicePrice,
                  taxinclusiveamount: actualNetAmount,
                  hsn,
                  originalHsn: hsn,
                  leadAmount: servicePrice,
                  totalleadAmount: actualNetAmount,
                  leadTax: hsn,
                  sourceIndex: index
                }
              ]
            : [],
          actualHsn: hsn,
          actualproductPrice: service?.productPrice,
          actualNetAmount,
          company_id: branchdata?.[0]?.company_id || "",
          branch_id: branchdata?.[0]?.branch_id || ""
        }
      })

      updated.splice(index + 1, 0, ...defaultServiceRows)

      if (primaryLicense) {
        setTakenLicense((prevTaken) => {
          const nextTaken = { ...prevTaken }
          defaultServiceRows.forEach((serviceRow) => {
            nextTaken[serviceRow?.productorServiceName] = [primaryLicense]
          })
          return nextTaken
        })
      }
    }

    setSearch(prod.productName || prod.serviceName || "")
    setSelectedLeadList(updated)
    setOpen(false)
  }

  const handleInputChange = (e) => {
    console.log(index)
    if (index > 0) return
    const value = e.target.value
    setSearch(value)
    setOpen(true)

    const exact = (leadList || []).find(
      (p) => p.productName === value || p.serviceName === value
    )

    if (exact) applySelection(exact)
    else if (!value) applySelection(null)
  }

  const handleClear = () => {
    applySelection(null)
    setOpen(false)
  }

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        disabled={isReadOnly}
        value={search}
        onChange={handleInputChange}
        onClick={() => !isReadOnly && setOpen(true)}
        placeholder="Search / Select Product"
        className={`w-full px-2 py-1 border border-gray-200 rounded text-xs bg-[#EEF2F8] outline-none ${
          isReadOnly ? "cursor-not-allowed opacity-70" : "cursor-text"
        }`}
      />

      {selectionMessage?.productmessage && (
        <p className="text-red-400">{selectionMessage.productmessage}</p>
      )}

      {search && !isReadOnly && index === 0 && (
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault()
            handleClear()
          }}
          className="absolute right-1.5 top-1.5 text-gray-400 hover:text-red-500 text-[10px]"
        >
          ✕
        </button>
      )}

      {open && (
        <DropdownPortal anchorEl={inputRef.current}>
          <div className="bg-white border border-gray-200 rounded shadow-xl overflow-hidden max-h-52">
            <ul className="max-h-52 overflow-y-auto text-xs">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-gray-400 italic">
                  No results found
                </li>
              ) : (
                filtered.map((prod) => (
                  <li
                    key={prod._id}
                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-2 text-gray-700"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      applySelection(prod)
                    }}
                  >
                    <span className="font-medium text-[#1B2A4A]">
                      {prod.productName || prod.serviceName}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </DropdownPortal>
      )}
    </div>
  )
} //third
// ─────────────────────────────────────────────────────────────────────────────
// LeadMaster
// ─────────────────────────────────────────────────────────────────────────────
const LeadMaster = ({
  process,
  Data = null,
  Breadcrumblist,
  isReadOnly = false,
  from = null,
  handleleadData,
  handleEditData,
  handleclosingData,
  loadingState,
  setLoadingState,
  editloadingState,
  seteditLoadingState,
  showmessage,
  showpopupMessage,
  selectedcompanyBranch
}) => {
  console.log(process)
  console.log(Breadcrumblist)
  console.log(from)
  console.log(Data)
  if (Data == null) {
    console.log("hhh")
  }
  console.log(isReadOnly)
  console.log("abhidas")
  const isClosedLeadEdit = from === "closedlead"
  const isClosingFlow = process === "closing" || isClosedLeadEdit

  const {
    register: registerMain,
    handleSubmit: handleSubmitMain,
    setValue: setValueMain,
    watch: watchMain,
    control: controlMain,
    reset: resetMain,

    clearErrors: clearMainerrors,
    formState: { errors: errorsMain }
  } = useForm()

  const {
    register: registerModal,
    handleSubmit: handleSubmitModal,
    setValue: setValueModal,
    getValues: getValuesModal,
    watch: watchModal,
    control: controlModal,
    setError,
    clearErrors: clearmodalErros,
    formState: { errors: errorsModal },
    reset: resetModal,
    watch
  } = useForm()
  const dispatch = useDispatch()
  const loggeduserBranch = useSelector(
    (branch) => branch.companyBranch.loggeduserbranches
  )

  const [productOrserviceSelections, setProductorServiceSelections] = useState(
    {}
  )
  const mobileRegister = registerMain("mobile")
  const today = new Date().toISOString().split("T")[0]
  console.log(Data?.[0]?.customerName)
  console.log(Data?.[0]?.customerName?._id)
  const [previousLeadCustomer, setpreviousLeadCustomer] = useState(null)
  const [isCustomerChanged, setiscustomerChanged] = useState(false)
  console.log(previousLeadCustomer)
  const [takenLicenses, setTakenLicense] = useState([])
  console.log(takenLicenses)
  const [warningErrors, setwarningError] = useState({})
  const [haveprimaryProduct, sethaveprimaryProduct] = useState(false)
  console.log(haveprimaryProduct)
  const [unselectedtaggedlicense, setunselectedtaggedlicense] = useState({})
  console.log(unselectedtaggedlicense)
  console.log(warningErrors)
  const [licenseloading, setlicenseloading] = useState(false)
  const [checknewcustomer, setchecknewcustomer] = useState(false)
  console.log(checknewcustomer)
  const [leadList, setLeadList] = useState([])
  const [submitLoading, setsubmitLoading] = useState(false)
  const [popupOpen, setPopupOpen] = useState(false)
  const [formData, setFormData] = useState(null)
  const [restrictionMessage, setrestrictMessage] = useState()
  const [isEligible, setIseligible] = useState(false)
  const [openLicenseDropdown, setOpenLicenseDropdown] = useState(null)
  const [openProductDropdown, setOpenProductDropdown] = useState(null)
  const [popupMessage, setPopupMessage] = useState("")
  const [warningMessage, setwarningMessage] = useState("")
  console.log(warningErrors)
  const [showdetailsopen, setdetailsopen] = useState(false)
  console.log(showdetailsopen)
  const [detailsItem, setDetailsItem] = useState(null)
  const [detailsIndex, setDetailsIndex] = useState(null)
  const [detailsRowId, setDetailsRowId] = useState(null)
  const [detailsForm, setDetailsForm] = useState({
    name: "",
    licenseNumber: "",
    softwareTrade: "",
    applicationDate: "",
    status: "Running",
    nextDue: "",
    quantityUsers: "",
    productAmount: "",
    taggeddata: []
  })
  console.log(detailsForm?.length)
  console.log(detailsForm)
  console.log(warningMessage)
  const [ispopupModalOpen, setIspopupModalOpen] = useState(false)
  const [isSelfAllocationChangable, setselfAllocationChangable] = useState(true)
  const [modalloader, setModalLoader] = useState(false)
  const [selfAllocation, setselfAllocation] = useState(false)
  const [partner, setPartner] = useState([])
  const [editMode, setEditMode] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [licensewithoutProductSelection, setlicenseWithoutProductSelection] =
    useState({})
  const [iscustomerchangeandbranch, setcustomerchangeandbranch] =
    useState(isReadOnly)
  const [selectedState, setSelectedState] = useState(null)
  const [selectedleadlist, setSelectedLeadList] = useState([])
  console.log(selectedleadlist)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedLicense, setSelectedLicense] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [customerOptions, setCustomerOptions] = useState([])
  const [isleadForOpen, setIsleadForOpen] = useState(false)
  const [isLicenseOpen, setIslicenseOpen] = useState(false)
  const [branches, setBranches] = useState([])
  const [originalCustomerTableData, setOriginalCustomerTableData] = useState([])
  const [temporaryCustomerTableData, setTemporaryCustomerTableData] = useState(
    []
  )
  const [customerTableData, setcustomerTableData] = useState([])
  console.log(customerTableData)
  const [validateError, setValidateError] = useState({})
  const [loggeduser, setloggedUser] = useState(null)
  const [allstaff, setallStaffs] = useState([])
  const [selectedBranch, setSelectedBranch] = useState(selectedcompanyBranch)
  console.log(selectedBranch)
  const showInput =
    Array.isArray(loggeduserBranch) && loggeduserBranch.includes(selectedBranch)
  console.log(showInput)
  const [tasklist, settasklist] = useState([])
  const [allcustomer, setallcustomer] = useState([])
  const [selectedUserName, setselecteduserName] = useState(null)
  const [selectedCategory, setselectedCategory] = useState(null)
  const [selectedDatapopup, setselectedDataPopup] = useState({})
  const [selectedYear, setSelectedYear] = useState(null)
  const [periodMode, setperiodMode] = useState("all")
  const [targetData, settargetData] = useState([])
  const [openModal, setOpenModal] = useState(false)
  const [productlist, setproductList] = useState([])
  const [achievedproducts, setacheivedProducts] = useState([])
  const [selectedPeriod, setselectedPeriod] = useState("")
  const [customerapichange, setcustomerapichange] = useState(true)
  const dropdownLicenseRef = useRef(null)
  const dropdownLeadforRef = useRef(null)
  const registrationType = watchModal("registrationType")
  const selectedCountrymodal = watchModal("country")
  const navigate = useNavigate()
  const location = useLocation()
  const mobileValue = watchModal("mobile")
  const mobileMainValue = watchMain("mobile")
  const customerNameValue = watchModal("customerName")
  const customerMainValue = watchMain("customerName")
  const customerIdValue = watchModal("customerid")
  const customerMainIdValule = watchMain("customerid")
  const [isTradeOpen, setIsTradeOpen] = useState(false)
  const discountAmount = watchMain("discamnt")
  const tradeDropdownRef = useRef(null)
  const isFirstRender = useRef(true)
  const isMobileTypedByUser = useRef(false)
  console.log(mobileValue)
  console.log(customerNameValue)
  console.log(customerIdValue)
  const [duplicateWarning, setDuplicateWarning] = useState("")
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)
  const { data: productData, loading: productLoading } = UseFetch(
    loggeduser &&
      selectedBranch &&
      selectedBranch.length &&
      `/product/getallProducts?branchselected=${encodeURIComponent(
        JSON.stringify(selectedBranch)
      )}`
  )
  console.log(selectedBranch)
  console.log(productData)
  const filter = productData?.filter(
    (item) => item.productName === "MARG ERP NANO"
  )
  console.log(filter)
  const { data: tasks } = UseFetch("lead/getallTask")
  const { data: companybranches } = UseFetch("/branch/getBranch")
  const { data: partners } = UseFetch("/customer/getallpartners")
  const { data: serviceData } = UseFetch(
    loggeduser &&
      selectedBranch &&
      `/product/getallServices?branchselected=${selectedBranch}`
  )
  console.log(haveprimaryProduct)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        tradeDropdownRef.current &&
        !tradeDropdownRef.current.contains(event.target)
      ) {
        setIsTradeOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

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

  const { data: alluser, loading: usersLoading } = UseFetch("/auth/getallUsers")
  const {
    data: customerData,
    loading: customerLoading,
    refreshHook
  } = UseFetch(
    loggeduser &&
      selectedBranch &&
      `/customer/getallCustomer?branchSelected=${selectedBranch}`
  )
  console.log(customerData)
  // Track timers for each row index
  const debounceTimersRef = useRef({})
  console.log(selectedleadlist)
  const emptyRow = {
    rowId: createLeadRowId(),
    licenseNumber: "",
    productorServiceId: "",
    productorServiceName: "",
    productPrice: "",
    hsn: "",
    netAmount: ""
  }

  const canSelfAllocate =
    loggeduser?.department?.code === "DEPARTMENT3" || console.log(loggeduser)
  useEffect(() => {
    console.log("jjjj")
    setSelectedBranch(selectedcompanyBranch)
  }, [selectedcompanyBranch])
  // useEffect(() => {
  //   if (!selfAllocation) {
  //     setValueMain("allocationType", undefined);
  //     setValueMain("dueDate", undefined);
  //   }
  // }, [selfAllocation]);
  // useEffect(() => {
  //   if (!selfAllocation) {
  //     unregister("allocationType");
  //     unregister("dueDate");
  //   }
  // }, [selfAllocation, unregister]);
  useEffect(() => {
    const cleanedMobile = String(mobileValue || "")
      .replace(/^\+?91/, "")
      .replace(/\D/g, "")
    console.log(cleanedMobile)
    const cleanedName = String(customerNameValue || "").trim()

    if (cleanedMobile.length !== 10 || !cleanedName) {
      setDuplicateWarning("")
      return
    }
    console.log("hh")
    const timer = setTimeout(async () => {
      try {
        setCheckingDuplicate(true)

        const res = await api.post("/lead/check-customer-duplicate", {
          mobile: cleanedMobile,
          customerName: cleanedName,
          customerId: customerIdValue || ""
        })
        console.log(res)
        if (res?.data?.exists) {
          setDuplicateWarning(res.data.message)
        } else {
          setDuplicateWarning("")
        }
      } catch (error) {
        setDuplicateWarning("")
      } finally {
        setCheckingDuplicate(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [mobileValue, customerNameValue, customerIdValue])
  console.log(duplicateWarning)
  console.log(mobileValue)
  console.log(customerNameValue)
  console.log(customerIdValue)
  useEffect(() => {
    if (isFirstRender.current) {
      console.log(isFirstRender)
      isFirstRender.current = false
      return
    }
    console.log(isMobileTypedByUser)
    if (!isMobileTypedByUser.current) return
    const cleanedMobile = String(mobileMainValue || "")
      .replace(/^\+?91/, "")
      .replace(/\D/g, "")
    const selectedCustomerOption =
      customerOptions.find((o) => o.value === customerMainValue) || null

    const customerName = selectedCustomerOption?.label || ""
    console.log(cleanedMobile)
    const cleanedName = String(customerName || "").trim()
    console.log(cleanedName)

    if (cleanedMobile.length !== 10 || !cleanedName) {
      setDuplicateWarning("")
      return
    }
    console.log("hh")
    const timer = setTimeout(async () => {
      try {
        setCheckingDuplicate(true)

        const res = await api.post("/lead/check-customer-duplicate", {
          mobile: cleanedMobile,
          customerName: cleanedName,
          customerId: customerMainIdValule || ""
        })
        console.log(res)
        if (res?.data?.exists) {
          setDuplicateWarning(res.data.message)
        } else {
          setDuplicateWarning("")
        }
      } catch (error) {
        setDuplicateWarning("")
      } finally {
        setCheckingDuplicate(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [mobileMainValue])
  console.log(duplicateWarning)
  useEffect(() => {
    if (!selectedleadlist || selectedleadlist.length === 0) {
      console.log(selectedleadlist)
      console.log("hh")
      setSelectedLeadList([{ ...emptyRow }])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const taxableAmount = Number(watch("taxableAmount") || 0)
  const taxAmount = Number(watch("taxAmount") || 0)

  useEffect(() => {
    console.log("hhh")
    const exactTotal = taxableAmount + taxAmount
    const net = +exactTotal.toFixed(2)
    setValueMain("netAmount", net, { shouldValidate: true })
  }, [taxableAmount, taxAmount, setValueMain])

  useEffect(() => {
    console.log("hhhh")
    const userData = localStorage.getItem("user")
    if (userData) {
      const user = JSON.parse(userData)
      setloggedUser(user)
      if (user.role === "Staff" || user.role === "Manager") {
        const branch = user.selected.map((branch) => branch.branch_id)
        const branches = JSON.stringify(branch)
        setBranches(branches)
      }
    }
  }, [])

  useEffect(() => {
    if (tasks) {
      console.log("hhhh")
      settasklist(tasks.filter((item) => item.taskName === "Followup"))
    }
  }, [tasks])

  useEffect(() => {
    console.log("jjj")
    if (showmessage) {
      setIspopupModalOpen(true)
    }
  }, [showmessage])

  useEffect(() => {
    console.log("jj")
    if (selectedBranch) {
      setValueMain("leadBranch", selectedBranch)
    }
  }, [selectedBranch])

  useEffect(() => {
    console.log("hhhh")
    if (
      loggeduser &&
      productData &&
      productData.length &&
      serviceData &&
      serviceData.length &&
      partners &&
      selectedBranch
    ) {
      const filteredPartners = partners.filter((partner) =>
        partner.relationBranches.some((branch) =>
          selectedBranch.includes(branch?.branchName?._id)
        )
      )
      setPartner(filteredPartners)
      const combinedlead = [...productData]
      // const productsWithType = productData.filter(
      //   (item) =>
      //     item?.productorservicetype !== null &&
      //     item?.productorservicetype !== undefined &&
      //     String(item?.productorservicetype).trim() !== ""&&item?.status==="Active"
      // )
      const productsWithType = productData.filter(
        (item) =>
          item?.productorservicetype != null &&
          String(item.productorservicetype).trim() !== "" &&
          (item.status === undefined ||
            item.status === null ||
            item.status === "" ||
            item.status === "Active")
      )
      console.log(productsWithType)
      setLeadList(productsWithType)
    }
  }, [loggeduser, branches, productData, serviceData, partners, selectedBranch])

  useEffect(() => {
    console.log("hhhh")
    const handleClickOutside = (event) => {
      if (
        dropdownLicenseRef.current &&
        !dropdownLicenseRef.current.contains(event.target)
      ) {
        setIslicenseOpen(false)
      }
      if (
        dropdownLeadforRef.current &&
        !dropdownLeadforRef.current.contains(event.target)
      ) {
        setIsleadForOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])
  useEffect(() => {
    console.log("hhhh")
    if (loggeduser?._id) {
      if (Data && Data.length) {
        setValueMain("leadBy", Data[0].leadBy._id)
      } else {
        setValueMain("leadBy", loggeduser._id)
      }
    }
  }, [loggeduser, setValueMain, Data])

  useEffect(() => {
    console.log("hhh")
    if (
      Data &&
      Data.length > 0 &&
      customerOptions &&
      customerOptions.length &&
      loggeduser
    ) {
      if (Data[0]?.selfAllocation) {
        setselfAllocationChangable(false)
      }
      setpreviousLeadCustomer(Data[0]?.customerName?._id)
      setValueMain("leadId", Data[0]?.leadId)
      setValueMain("partner", Data[0]?.partner)
      setValueMain("remark", Data[0].remark)
      setValueMain(
        "selfAllocation",
        Data[0]?.selfAllocation === true ? "true" : "false"
      )

      if (Data[0].selfAllocation === true) {
        setselfAllocation(true)
        setValueMain("allocationType", Data[0].selfAllocationType)
        const formattedDate = Data[0].selfAllocationDueDate
          ? Data[0].selfAllocationDueDate.split("T")[0]
          : ""
        setValueMain("dueDate", formattedDate)
      }
      console.log(Data[0])
      setValueMain("source", Data[0]?.source || "")
      setValueMain("customerName", Data[0]?.customerName?._id)
      setValueMain("mobile", Data[0]?.customerName?.mobile)
      setValueMain("phone", Data[0]?.customerName?.phone)
      setValueMain("email", Data[0]?.customerName?.email)
      setValueMain("phone", Data[0].customerName.landline)
      console.log(Data[0].customerName.landline)
      setValueMain("remark", Data[0].remark)
      setSelectedCustomer(Data[0]?.customerName)
      console.log(Data[0].leadFor)
      let currentPrimaryLicense = ""
      let leadData = Data[0]?.leadFor.map((item, index) => {
        const itemType = String(item?.productorservicetype || "").toLowerCase()
        const isPrimaryProduct = itemType === "primaryproduct"
        const isAdditionalService = itemType === "additionalservice"

        if (isPrimaryProduct && item?.licenseNumber) {
          currentPrimaryLicense = item.licenseNumber
        }

        const fallbackTaggedLicense = isAdditionalService
          ? item?.licenseNumber || currentPrimaryLicense
          : ""

        let taggeddata = Array.isArray(item?.taggeddata)
          ? item.taggeddata.map((tag) => ({
              ...tag,
              licensenumber: tag?.licensenumber || tag?.licenseNumber || "",
              nextDue: tag?.nextDue ? String(tag.nextDue).split("T")[0] : ""
            }))
          : []

        if (!taggeddata.length && fallbackTaggedLicense) {
          taggeddata = [
            {
              licensenumber: fallbackTaggedLicense,
              nextDue: item?.nextDue ? String(item.nextDue).split("T")[0] : "",
              noofusers: item?.noofusers || "",
              serialNumber: item?.serialNumber || "",
              nextDueAmount:
                item?.nextDueAmount ??
                item?.actualproductPrice ??
                item?.productPrice ??
                0,
              totalnextDueAmount:
                item?.totalnextDueAmount ??
                item?.actualNetAmount ??
                item?.netAmount ??
                0,
              nextDueTax: item?.nextDueTax ?? item?.actualHsn ?? item?.hsn ?? 0
            }
          ]
        }

        const licenseNumbers =
          Array.isArray(item?.licenseNumbers) && item.licenseNumbers.length
            ? item.licenseNumbers
            : taggeddata
                .filter((tag) =>
                  String(tag?.licensenumber || tag?.licenseNumber || "").trim()
                )
                .map((tag) => ({
                  licenseNumber: tag?.licensenumber || tag?.licenseNumber || "",
                  productorServiceId: item?.productorServiceId?._id || "",
                  productorServiceName:
                    item?.productorServiceId?.productName ||
                    item?.productorServiceId?.serviceName ||
                    "",
                  sourceIndex: index
                }))

        return {
          rowId: item?.rowId || item?._id || createLeadRowId(),
          licenseNumber: item?.licenseNumber,
          licenseNumbers,
          productorServiceName:
            item?.productorServiceId?.productName ||
            item?.productorServiceId?.serviceName ||
            item?.productorServiceName,
          softwareTrade: item?.softwareTrade,
          applicationDate: item?.applicationDate
            ? String(item.applicationDate).split("T")[0]
            : "",
          status: item?.status || item?.isActive,
          nextDue: item?.nextDue ? String(item.nextDue).split("T")[0] : "",
          quantityUsers: item?.quantityUsers,
          noofusers: item?.noofusers,
          serialNumber: item?.serialNumber,
          amount: item?.amount,
          discountAmount: item?.discountAmount,
          taggeddata,
          productorServiceId: item?.productorServiceId?._id,
          itemType: item?.productorServicemodel,
          productPrice: item?.productPrice,
          hsn: item?.hsn,
          actualHsn: item?.actualHsn,
          netAmount: item?.netAmount,
          actualNetAmount: item?.actualNetAmount,
          actualproductPrice: item?.actualproductPrice,
          price: item?.price,
          company_id: item?.company_id,
          branch_id: item?.branch_id,
          productorservicetype: item?.productorservicetype,
          parentPrimaryProductId: item?.parentPrimaryProductId,
          isDefaultService: Boolean(item?.isDefaultService),
          version: item?.version
        }
      })
      leadData = normalizeLeadRows(leadData)
      console.log(leadData)
      const fetchedLicenses = leadData
        .filter(
          (item) =>
            item?.licenseNumber &&
            String(item?.productorservicetype || "").toLowerCase() !==
              "additionalservice"
        )
        .map((item, index) => ({
          licenseNumber: item.licenseNumber,
          productName: item.productorServiceName,
          productorServiceName: item.productorServiceName,
          productorServiceId: item.productorServiceId,
          sourceIndex: index
        }))

      setOriginalCustomerTableData(fetchedLicenses)
      const taggedLicensesByService = leadData.reduce((acc, item) => {
        const isAdditionalService =
          String(item?.productorservicetype || "").toLowerCase() ===
          "additionalservice"
        if (!isAdditionalService) return acc

        const licenses = (item?.licenseNumbers || [])
          .map((lic) => String(lic?.licenseNumber || "").trim())
          .filter(Boolean)

        if (licenses.length) {
          acc[item?.productorServiceName || item?.productorServiceId] = licenses
        }

        return acc
      }, {})
      setTakenLicense(taggedLicensesByService)
      console.log(leadData)
      console.log(process)
      const ihaveprimaryproduct =
        String(leadData[0]?.productorservicetype || "").toLowerCase() ===
        "primaryproduct"
      if (
        isClosingFlow &&
        String(leadData[0]?.productorservicetype || "").toLowerCase() ===
          "primaryproduct"
      ) {
        sethaveprimaryProduct(true)
        const primary = leadData[0]
        console.log("hhddd")
        const primaryProductId = getRowId(primary?.productorServiceId)
        const primaryProduct = getPrimaryProductFromLeadList(primary)
        console.log(primaryProduct)
        if (!primaryProduct) {
          toast.error("Primary product details not found")
          return
        }

        const defaultServices = Array.isArray(primaryProduct?.defaultservices)
          ? primaryProduct.defaultservices
          : []

        // Always initialize with the lead data first
        setSelectedLeadList((prev) => {
          const rows = [...leadData]

          // If there are no default services, just return the lead data.
          if (!defaultServices.length) {
            return normalizeLeadRows(rows)
          }

          const existingIds = getExistingAdditionalServiceIdsForPrimary(
            rows,
            0,
            primaryProductId
          )

          const servicesToAdd = defaultServices.filter((service) => {
            const serviceId = getRowId(service)
            return serviceId && !existingIds.has(serviceId)
          })

          if (!servicesToAdd.length) {
            return normalizeLeadRows(rows)
          }

          const newRows = servicesToAdd.map((service) => {
            const serviceId = getRowId(service)
            const igstRate = getBranchIgstRate(service)
            const productPrice = Number(service?.productPrice ?? 0)
            const taxAmount = (productPrice * igstRate) / 100
            const actualNetAmount = productPrice + taxAmount
            const primaryLicense = primary?.licenseNumber || ""
            console.log(service)
            console.log(igstRate)
            console.log(productPrice)
            console.log(taxAmount)
            return {
              ...emptyRow,
              rowId: createLeadRowId(),
              licenseNumber: "",
              licenseNumbers: primaryLicense
                ? [
                    {
                      licenseNumber: primaryLicense,
                      productorServiceId: serviceId,
                      productorServiceName:
                        service?.shortName || service?.productName || "",
                      sourceIndex: 0
                    }
                  ]
                : [],
              productorServiceId: serviceId,
              productorServiceName:
                service?.shortName || service?.productName || "",
              itemType: service?.productName ? "Product" : "Service",
              productorservicetype:
                service?.productorservicetype || "Additionalservice",
              productPrice: 0,
              hsn: 0,
              netAmount: 0,
              isDefaultService: true,
              parentPrimaryProductId: primaryProductId,
              taggeddata: primaryLicense
                ? [
                    {
                      licensenumber: primaryLicense,
                      nextDue: "",
                      noofusers: "",
                      serialNumber: "",
                      nextDueAmount: productPrice,
                      totalnextDueAmount: actualNetAmount,
                      nextDueTax: igstRate,
                      productAmount: actualNetAmount,
                      taxexclusiveAmount: productPrice,
                      taxinclusiveamount: actualNetAmount,
                      hsn: igstRate,
                      originalHsn: igstRate,
                      leadAmount: productPrice,
                      totalleadAmount: actualNetAmount,
                      leadTax: igstRate,
                      sourceIndex: 0
                    }
                  ]
                : [],
              company_id: service?.selected?.[0]?.company_id,
              branch_id: service?.selected?.[0]?.branch_id,
              actualproductPrice: productPrice,
              actualHsn: igstRate,
              actualNetAmount: Number(productPrice + taxAmount)
            }
          })

          let insertAt = 1

          while (insertAt < rows.length) {
            const nextType = String(
              rows[insertAt]?.productorservicetype || ""
            ).toLowerCase()

            if (nextType === "primaryproduct") break

            insertAt++
          }

          rows.splice(insertAt, 0, ...newRows)

          return normalizeLeadRows(rows)
        })
      } else {
        sethaveprimaryProduct(false)
        console.log(leadData)
        setSelectedLeadList(leadData)
      }

      const productListwithoutlicenseOnEdit = leadList?.map((product) => {
        const match = Data[0].leadFor?.find((lead) => {
          return (
            lead.productorServiceId._id === product._id &&
            !Object.prototype.hasOwnProperty.call(lead, "licenseNumber")
          )
        })
        return {
          ...product,
          selected: !!match,
          selectedArray: product.selected
        }
      })
      setlicenseWithoutProductSelection(productListwithoutlicenseOnEdit)

      const groupedByLicenseNumber = {}
      Data[0].leadFor.forEach((lead) => {
        if (lead.licenseNumber) {
          if (!groupedByLicenseNumber[lead.licenseNumber]) {
            groupedByLicenseNumber[lead.licenseNumber] = []
          }
          leadList?.forEach((product) => {
            const existingIndex = groupedByLicenseNumber[
              lead.licenseNumber
            ].findIndex((item) => item._id === product._id)
            if (existingIndex !== -1) {
              if (lead.productorServiceId._id === product._id) {
                groupedByLicenseNumber[lead.licenseNumber][
                  existingIndex
                ].selected = product._id === lead.productorServiceId._id
              }
            } else {
              const item = {
                ...product,
                selected: product._id === lead.productorServiceId._id,
                selectedArray: product.selected
              }
              groupedByLicenseNumber[lead.licenseNumber].push(item)
            }
          })
        }
      })
      setProductorServiceSelections(groupedByLicenseNumber)
      console.log(ihaveprimaryproduct)
      if (!ihaveprimaryproduct) {
        console.log(Data[0])
        const selectedcustomerlicenseandproduct =
          Data[0]?.customerName?.selected
            ?.filter(
              (sel) =>
                sel?.licensenumber != null &&
                String(sel.licensenumber).trim() !== ""
            )
            .map((sel) => ({
              licenseNumber: sel.licensenumber,
              productName: sel?.product_id?.productName || "Unknown",
              productorServiceId: sel?.product_id?._id
            })) || []

        console.log("d")
        console.log(selectedcustomerlicenseandproduct)
        setOriginalCustomerTableData(selectedcustomerlicenseandproduct)
        setTemporaryCustomerTableData([])
        setcustomerTableData(selectedcustomerlicenseandproduct)
      }
    }
  }, [customerOptions, Data])

  useEffect(() => {
    if (customerData && customerData.length > 0) {
      setallcustomer(customerData)
      setcustomerapichange(false)
    }
  }, [customerData])
  useEffect(() => {
    const merged = [
      ...(originalCustomerTableData || []),
      ...(temporaryCustomerTableData || [])
    ]

    const unique = merged.filter(
      (item, index, arr) =>
        index ===
        arr.findIndex(
          (x) => String(x?.licenseNumber) === String(item?.licenseNumber)
        )
    )

    setcustomerTableData(unique)
  }, [originalCustomerTableData, temporaryCustomerTableData])
  console.log(customerData)
  useEffect(() => {
    if (customerData && customerData.length && selectedBranch) {
      const options = customerData.map((item) => {
        const matchingSelected = item.selected?.find(
          (sel) => sel.branch_id === selectedBranch
        )
        console.log(item?.partner)
        console.log(item?.country)
        if (item?.country) {
          console.log(item?.country)
        }
        return {
          value: item?._id,
          label: item?.customerName,
          address: item?.address1,
          mobile: item?.mobile || "",
          license: matchingSelected?.licensenumber || "",
          email: item?.email,
          phone: item?.landline,
          partner: item?.partner,
          country: item?.country,
          state: item?.state,
          registrationType: item?.registrationType,
          city: item?.city,
          pincode: item?.pincode,
          contactPerson: item?.contactPerson,
          selected: item?.selected
        }
      })
      setCustomerOptions(options)
    }
  }, [customerData])

  useEffect(() => {
    console.log("hhh")
    if (selectedCustomer) {
      console.log(selectedCustomer)
      setValueMain("mobile", selectedCustomer.mobile)
      setValueMain("phone", selectedCustomer.landline)
      setValueMain("email", selectedCustomer.email)
      setValueMain(
        "partner",
        selectedCustomer?.partner?._id
          ? selectedCustomer?.partner?._id
          : selectedCustomer?.partner
      )
    }
  }, [selectedCustomer])

  useEffect(() => {
    console.log("hhh")
    if (alluser) {
      const { allusers = [], allAdmins = [] } = alluser
      const combinedUsers = [...allusers, ...allAdmins]
      setallStaffs(combinedUsers)
    }
  }, [alluser])

  // useEffect(() => {
  //   console.log("hhh")
  //   setValueMain("netAmount", calculateTotalAmount())
  //   setValueMain("taxAmount", calculatetaxAmount())
  //   setValueMain("taxableAmount", calculatetaxableAmount())
  // }, [selectedleadlist])
  useEffect(() => {
    const total = Number(calculateTotalAmount()) || 0
    const discount = Number(discountAmount) || 0
    console.log(discount)
    setValueMain("taxAmount", calculatetaxAmount())
    setValueMain("taxableAmount", calculatetaxableAmount())
    console.log(selectedleadlist)
    setValueMain("netAmount", Math.max(total - discount, 0).toFixed(2))
  }, [selectedleadlist, discountAmount])

  useEffect(() => {
    if (selectedleadlist && selectedleadlist.length) {
      console.log(selectedleadlist)
      if (!haveprimaryProduct) {
        setSelectedLeadList((prev) =>
          prev.map((lead) => {
            if (
              lead.productorservicetype !== "Additionalservice" ||
              !Array.isArray(lead.taggeddata)
            ) {
              return lead
            }

            return {
              ...lead,
              taggeddata: lead.taggeddata.map((row) => {
                const taxExclusive = Number(row.taxexclusiveAmount || 0)
                const taxRate = Number(row.leadTax || 0)
                const discount = Number(discountAmount || 0)
                console.log(discount)
                const taxAmount = (taxExclusive * taxRate) / 100
                console.log(taxAmount)
                console.log(taxExclusive)
                return {
                  ...row,
                  taxinclusiveamount: Number(
                    (taxExclusive + taxAmount - discount).toFixed(2)
                  ),
                  discountAmount: discount
                }
              })
            }
          })
        )
      }
    }
  }, [discountAmount])
  useEffect(() => {
    console.log("hhh")
    if (!selectedLicense && leadList && leadList.length > 0 && !Data) {
      const initialProductListwithoutlicense = leadList?.map((product) => ({
        ...product,
        selectedArray: product.selected,
        selected: false
      }))
      setlicenseWithoutProductSelection(initialProductListwithoutlicense)
    }
  }, [leadList])

  const countryOptions = useMemo(
    () =>
      Country.getAllCountries().map((country) => ({
        label: country.name,
        value: country.isoCode
      })),
    []
  )
console.log(countryOptions)
const e=countryOptions.filter((item)=>item.label==="Oman")
console.log(e)
  const addTemporaryLicense = (newLicense) => {
    setTemporaryCustomerTableData((prev) => {
      const exists = prev.some(
        (item) =>
          String(item?.licenseNumber) === String(newLicense?.licenseNumber)
      )

      if (exists) return prev

      return [...prev, newLicense]
    })
  }

  const removeTemporaryLicense = (licenseNumber) => {
    setTemporaryCustomerTableData((prev) =>
      prev.filter(
        (item) => String(item?.licenseNumber) !== String(licenseNumber)
      )
    )
  }
  // const updateLicense = (index, licenseNumber) => {
  //   setSelectedLeadList((prev) =>
  //     prev.map((row, i) =>
  //       i === index
  //         ? {
  //             ...row,
  //             licenseNumber
  //           }
  //         : row
  //     )
  //   )
  // }
  const createServiceTagForLicense = (row, licenseNumber, sourceIndex) => {
    const amount = Number(row?.actualproductPrice ?? row?.productPrice ?? 0)
    const tax = Number(row?.actualHsn ?? row?.hsn ?? 0)
    const total =
      Number(row?.actualNetAmount || row?.netAmount) ||
      amount + (amount * tax) / 100

    return {
      sourceIndex,
      licensenumber: licenseNumber,
      nextDue: "",
      noofusers: row?.noofusers || "",
      serialNumber: row?.serialNumber || "",
      nextDueAmount: amount,
      totalnextDueAmount: total,
      nextDueTax: tax,
      productAmount: total,
      taxexclusiveAmount: amount,
      taxinclusiveamount: total,
      hsn: tax,
      originalHsn: tax,
      leadAmount: amount,
      totalleadAmount: total,
      leadTax: tax,
      discountAmount: row?.discountAmount ?? 0
    }
  }

  const updateLicense = (index, licenseNumber) => {
    console.log(licenseNumber)
    console.log(selectedleadlist)
    console.log(index)
    const previousLicense = selectedleadlist?.[index]?.licenseNumber || ""
    const hasPreviousLicense = String(previousLicense).trim() !== ""
    const primaryProductId = getRowId(
      selectedleadlist?.[index]?.productorServiceId
    )
    setSelectedLeadList((prev) =>
      prev.map((row, i) => {
        if (i === index) {
          return {
            ...row,
            licenseNumber
          }
        }

        const rowType = String(row?.productorservicetype || "").toLowerCase()
        const parentId = getRowId(row?.parentPrimaryProductId)
        const isAttachedAdditionalService =
          rowType === "additionalservice" && parentId === primaryProductId

        if (!isAttachedAdditionalService) {
          return {
            ...row,
            licenseNumbers: (row.licenseNumbers || []).map((lic) =>
              String(lic?.sourceIndex) === String(index) ||
              (hasPreviousLicense &&
                String(lic?.licenseNumber) === String(previousLicense))
                ? {
                    ...lic,
                    licenseNumber
                  }
                : lic
            ),
            taggeddata: Array.isArray(row?.taggeddata)
              ? row.taggeddata.map((tag) =>
                  String(tag?.sourceIndex) === String(index) ||
                  (hasPreviousLicense &&
                    String(tag?.licensenumber || tag?.licenseNumber) ===
                      String(previousLicense))
                    ? {
                        ...tag,
                        licensenumber: licenseNumber
                      }
                    : tag
                )
              : row?.taggeddata
          }
        }

        const serviceLicense = {
          licenseNumber,
          productorServiceId: row?.productorServiceId || "",
          productorServiceName: row?.productorServiceName || "",
          sourceIndex: index
        }
        const updatedTaggedData = Array.isArray(row?.taggeddata)
          ? row.taggeddata.map((tag) =>
              String(tag?.sourceIndex) === String(index) ||
              (hasPreviousLicense &&
                String(tag?.licensenumber || tag?.licenseNumber) ===
                  String(previousLicense))
                ? {
                    ...tag,
                    licensenumber: licenseNumber
                  }
                : tag
            )
          : []
        const hasLinkedTag = updatedTaggedData.some(
          (tag) =>
            String(tag?.sourceIndex) === String(index) ||
            String(tag?.licensenumber || tag?.licenseNumber) ===
              String(licenseNumber)
        )

        return {
          ...row,
          licenseNumbers: licenseNumber ? [serviceLicense] : [],
          taggeddata: licenseNumber
            ? hasLinkedTag
              ? updatedTaggedData
              : [
                  createServiceTagForLicense(row, licenseNumber, index),
                  ...updatedTaggedData
                ]
            : []
        }
      })
    )

    setTakenLicense((prev) => {
      const updated = { ...prev }
      Object.keys(updated).forEach((key) => {
        updated[key] = (updated[key] || []).map((value) =>
          hasPreviousLicense && String(value) === String(previousLicense)
            ? licenseNumber
            : value
        )
      })

      selectedleadlist.forEach((row) => {
        const rowType = String(row?.productorservicetype || "").toLowerCase()
        const parentId = getRowId(row?.parentPrimaryProductId)
        if (rowType !== "additionalservice" || parentId !== primaryProductId) {
          return
        }

        const serviceName = row?.productorServiceName || ""
        if (!serviceName) return

        if (licenseNumber) {
          updated[serviceName] = [licenseNumber]
        } else {
          delete updated[serviceName]
        }
      })

      return updated
    })
  }
  console.log(selectedleadlist)

  console.log(detailsForm)
  const processLicenseChange = async (index, licenseValue, item) => {
    console.log("hh")
    const isValid = await handleLicenseBlur(index, licenseValue)

    if (!isValid) return

    setDetailsForm((prev) => {
      const tagged = prev.taggeddata || []
      const existingIndex = tagged.findIndex((x) => x.sourceIndex === index)

      const newEntry = {
        sourceIndex: index,
        licensenumber: licenseValue,
        nextDue: ""
      }

      const updatedTagged =
        existingIndex !== -1
          ? tagged.map((x) => (x?.sourceIndex === index ? newEntry : x))
          : [...tagged, newEntry]
      console.log(updatedTagged)
      return {
        ...prev,
        taggeddata: updatedTagged
      }
    })

    setSelectedLeadList((prev) =>
      prev.map((row) => ({
        ...row,
        licenseNumbers: (row.licenseNumbers || []).map((lic) =>
          lic.sourceIndex === index
            ? {
                ...lic,
                licenseNumber: licenseValue,
                nextDue: ""
              }
            : lic
        )
      }))
    )
    console.log(index)
    console.log(customerTableData)
    // setcustomerTableData((prev) => {
    //   const existingIndex = prev.findIndex((row) => row?.sourceIndex === index)

    //   const newRow = {
    //     licenseNumber: licenseValue,
    //     productName: item?.productorServiceName,
    //     productorServiceId: item?.productorServiceId,
    //     sourceIndex: index
    //   }

    //   if (existingIndex !== -1) {
    //     return prev.map((row, i) =>
    //       i === existingIndex ? { ...row, ...newRow } : row
    //     )
    //   }

    //   return [...prev, newRow]
    // })
    // setcustomerTableData((prev) => [
    //   ...prev,
    //   {
    //     licenseNumber: licenseValue,
    //     productName: item?.productorServiceName,
    //     productorServiceId: item?.productorServiceId,
    //     sourceIndex: index,
    //   },
    // ])
    console.log(customerTableData)
    setcustomerTableData((prev) => {
      const newRow = {
        licenseNumber: licenseValue,
        productName: item?.productorServiceName,
        productorServiceId: item?.productorServiceId,
        sourceIndex: index + 1
      }

      // return [...prev, newRow]

      return prev.length > 0 ? [newRow, ...prev.slice(1)] : [newRow]
    })
  }
  console.log(customerTableData)
  const handleLicenseBlur = async (index, licenseNumber) => {
    if (!String(licenseNumber).trim()) return false

    try {
      setlicenseloading(true)

      const { data } = await api.get(
        `/customer/checkLicense?licenseNumber=${licenseNumber}&leadDocId=${Data[0]?._id}`
      )

      if (data.exists) {
        toast.error(`License ${licenseNumber} already exists`)
        return false
      }
      toast.success(`License ${licenseNumber} available `)
      return true
    } catch (error) {
      console.error(error)
      toast.error("Failed to validate license")
      return false
    } finally {
      setlicenseloading(false)
    }
  }
  const stateOptions = selectedCountry
    ? State.getStatesOfCountry(selectedCountry.value).map((state) => ({
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
    console.log("hhh")
    if (defaultCountry) {
      setSelectedCountry(defaultCountry)
      console.log(defaultCountry)
      console.log(defaultCountry.value)
      setValueModal("country", defaultCountry.value)
    }
  }, [defaultCountry])

  useEffect(() => {
    console.log("hhh")
    const currentState = getValuesModal("state")
    console.log("defaultState:", defaultState)
    console.log("currentState:", currentState)
    console.log("condition:", defaultState && !currentState)
    if (defaultState && !currentState) {
      console.log("jjjj")
      setSelectedState(defaultState)
      setValueModal("state", defaultState.value)
    }
  }, [defaultState, getValuesModal, setValueModal])

  const handleOpenmodal = (text = null) => {
    console.log(selectedCustomer)
    console.log(text)
    if (text) {
      setchecknewcustomer(true)
    }
    console.log("h")
    setModalOpen(true)
    clearMainerrors()
    console.log(Data)
    if (Data && Data.length && text === null) {
      console.log("hhh")
      setValueModal("customerName", selectedCustomer?.customerName)
      setValueModal("customerid", selectedCustomer?._id)
      setValueModal("leadid", Data[0]?._id)
      setValueModal("email", selectedCustomer?.email)
      setValueModal("mobile", selectedCustomer?.mobile)
      setValueModal("landline", selectedCustomer?.landline)
      setValueModal("contactPerson", selectedCustomer?.contactPerson)
      setValueModal("address1", selectedCustomer?.address1)
      setValueModal("pincode", selectedCustomer?.pincode)
      setValueModal("partner", selectedCustomer?.partner?._id)
      setValueModal("registrationType", selectedCustomer?.registrationType)
      setValueModal("gstNo", selectedCustomer?.gstNo)
      setValueModal("city", selectedCustomer?.city)
      setValueModal("country", selectedCustomer?.country)
      console.log("hhh")
    }
  }

  const Industries = [
    "Whole sailor/Distributors",
    "Retailer",
    "Manufacturer",
    "Service",
    "Works Contact"
  ]

  const handleLicenseSelect = (license) => {
    if (license && !productOrserviceSelections[license]) {
      const initialProductList = leadList.map((product) => ({
        ...product,
        selectedArray: product.selected,
        selected: false
      }))
      setProductorServiceSelections((prev) => ({
        ...prev,
        [license]: initialProductList
      }))
    }
    setIslicenseOpen(false)
    setSelectedLicense(license)
  }
  const getBranchIgstRate = (prod) => {
    const filteredbranch = prod?.selected?.filter(
      (item) => item?.branch_id === selectedBranch
    )
    console.log(prod.selected)
    console.log(selectedBranch)
    console.log(filteredbranch[0])
    return Number(filteredbranch?.[0]?.hsn_id?.onValue?.igstRate || 0)
  }

  // const getRowId = (value) => {
  //   console.log(value)
  //   return String(value?._id || value?.id || value || "")
  // }//old
  const getRowId = (value) => {
    console.log(value)
    if (!value) return ""

    return String(value._id ?? value.id ?? value).trim()
  } //new code

  const getRowType = (row) =>
    String(row?.productorservicetype || "").toLowerCase()

  const mergeUniqueBy = (primary = [], secondary = [], keyGetter) => {
    const merged = []
    const seen = new Set()

    ;[...(primary || []), ...(secondary || [])].forEach((item) => {
      const key = String(keyGetter(item) || "").trim()
      if (!key || seen.has(key)) return

      seen.add(key)
      merged.push(item)
    })

    return merged
  }

  const mergeAdditionalServiceRows = (existing, duplicate) => ({
    ...duplicate,
    ...existing,
    licenseNumbers: mergeUniqueBy(
      existing?.licenseNumbers,
      duplicate?.licenseNumbers,
      (item) => item?.licenseNumber
    ),
    taggeddata: mergeUniqueBy(
      existing?.taggeddata,
      duplicate?.taggeddata,
      (item) => item?.licensenumber || item?.licenseNumber
    )
  })

  const normalizeLeadRows = (rows = []) => {
    const normalized = []
    const serviceIndexByBlock = new Map()
    const usedRowIds = new Set()
    let currentPrimaryProductId = ""

    rows.forEach((sourceRow) => {
      const requestedRowId = sourceRow?.rowId
      const rowId =
        requestedRowId && !usedRowIds.has(requestedRowId)
          ? requestedRowId
          : createLeadRowId()
      usedRowIds.add(rowId)
      const row = { ...sourceRow, rowId }
      const rowType = getRowType(row)

      if (rowType === "primaryproduct") {
        currentPrimaryProductId = getRowId(row?.productorServiceId)
        normalized.push(row)
        return
      }

      if (rowType !== "additionalservice") {
        normalized.push(row)
        return
      }

      const serviceId = getRowId(row?.productorServiceId)
      if (!serviceId) {
        normalized.push(row)
        return
      }

      const parentId = getRowId(row?.parentPrimaryProductId)
      const blockKey = parentId || currentPrimaryProductId || "no-primary"
      const duplicateKey = `${blockKey}:${serviceId}`

      if (serviceIndexByBlock.has(duplicateKey)) {
        const existingIndex = serviceIndexByBlock.get(duplicateKey)
        normalized[existingIndex] = mergeAdditionalServiceRows(
          normalized[existingIndex],
          row
        )
        return
      }

      serviceIndexByBlock.set(duplicateKey, normalized.length)
      normalized.push({
        ...row,
        parentPrimaryProductId: parentId || currentPrimaryProductId
      })
    })

    return normalized
  }

  const toLeadPayloadRows = (rows = []) =>
    rows.map(({ rowId, ...row }) => row)

  const getPrimaryProductFromLeadList = (row) => {
    const primaryProductId = getRowId(row?.productorServiceId)
    console.log(leadList)
    return (leadList || []).find((prod) => {
      const prodId = getRowId(prod)
      const prodType = String(prod?.productorservicetype || "").toLowerCase()
      return prodId === primaryProductId && prodType === "primaryproduct"
    })
  }

  // const getExistingAdditionalServiceIdsForPrimary = (
  //   rows,
  //   rowIndex,
  //   primaryProductId
  // ) => {
  //   const existingIds = new Set()
  //   console.log(rows)
  //   console.log(rowIndex)
  //   console.log(primaryProductId)
  //   rows.forEach((item) => {
  //     const itemType = String(item?.productorservicetype || "").toLowerCase()
  //     const parentId = getRowId(item?.parentPrimaryProductId)

  //     if (itemType === "additionalservice" && parentId === primaryProductId) {
  //       existingIds.add(getRowId(item?.productorServiceId))
  //     }
  //   })

  //   let pointer = rowIndex + 1
  //   while (pointer < rows.length) {
  //     const nextRow = rows[pointer]
  //     const nextType = String(nextRow?.productorservicetype || "").toLowerCase()

  //     if (nextType === "primaryproduct") break

  //     if (nextType === "additionalservice") {
  //       existingIds.add(getRowId(nextRow?.productorServiceId))
  //     }

  //     pointer++
  //   }

  //   return existingIds
  // }
  const getExistingAdditionalServiceIdsForPrimary = (
    rows,
    rowIndex,
    primaryProductId
  ) => {
    const existingIds = new Set()

    let pointer = rowIndex + 1

    while (pointer < rows.length) {
      const row = rows[pointer]
      const rowType = getRowType(row)

      // Stop when the next primary product starts
      if (rowType === "primaryproduct") break

      if (rowType === "additionalservice") {
        existingIds.add(getRowId(row?.productorServiceId))
      }

      pointer++
    }
    // console.log(existingIds)
    return existingIds
  }
  const getRemainingAdditionalServicesCount = (row, rowIndex) => {
    const primaryProduct = getPrimaryProductFromLeadList(row)
    console.log(primaryProduct)
    if (!primaryProduct) return 0

    const primaryProductId = getRowId(row?.productorServiceId)
    const defaultServices = Array.isArray(primaryProduct?.defaultservices)
      ? primaryProduct.defaultservices
      : []
    console.log(!defaultServices.length)
    if (!defaultServices.length) return 0
    console.log("hhhhh")
    const existingIds = getExistingAdditionalServiceIdsForPrimary(
      selectedleadlist || [],
      rowIndex,
      primaryProductId
    )

    return defaultServices.filter((service) => {
      const serviceId = getRowId(service)
      console.log(serviceId)
      console.log(existingIds)
      console.log(serviceId && !existingIds.has(serviceId))
      return serviceId && !existingIds.has(serviceId)
    }).length
  }

  const addAdditionalServicesForPrimaryRow = (row, rowIndex) => {
    console.log(row)

    if (!row?.productorServiceId) return

    const primaryProductId = getRowId(row?.productorServiceId)
    const primaryLicense = row?.licenseNumber || ""
    const primaryProduct = getPrimaryProductFromLeadList(row)
    console.log(primaryProduct)
    if (!primaryProduct) {
      toast.error("Primary product details not found")
      return
    }

    const defaultServices = Array.isArray(primaryProduct?.defaultservices)
      ? primaryProduct.defaultservices
      : []
    console.log(defaultServices)

    if (!defaultServices.length) {
      toast.info("No additional services available for this primary product")
      return
    }
    console.log(selectedleadlist)

    setSelectedLeadList((prev) => {
      const rows = Array.isArray(prev) ? [...prev] : []

      const existingIds = getExistingAdditionalServiceIdsForPrimary(
        rows,
        rowIndex,
        primaryProductId
      )

      const servicesToAdd = defaultServices.filter((service) => {
        const serviceId = getRowId(service)
        return serviceId && !existingIds.has(serviceId)
      })

      if (!servicesToAdd.length) {
        toast.info("Additional services already added for this primary product")
        return prev
      }
      console.log(row)
      console.log(servicesToAdd)

      const newRows = servicesToAdd.map((service) => {
        console.log(service)
        const serviceId = getRowId(service)
        const igstRate = getBranchIgstRate(service)
        const productPrice = Number(service?.productPrice ?? 0)
        const taxAmount = (productPrice * igstRate) / 100
        const actualNetAmount = productPrice + taxAmount
        return {
          ...emptyRow,
          rowId: createLeadRowId(),
          licenseNumber: "",
          licenseNumbers: primaryLicense
            ? [
                {
                  licenseNumber: primaryLicense,
                  productorServiceId: serviceId,
                  productorServiceName:
                    service?.productName || service?.serviceName || "",
                  sourceIndex: rowIndex
                }
              ]
            : [],
          productorServiceId: serviceId,
          productorServiceName:
            service?.productName || service?.serviceName || "",
          itemType: service?.productName ? "Product" : "Service",
          productorservicetype:
            service?.productorservicetype || "Additionalservice",
          productPrice: 0,
          hsn: igstRate || 0,
          netAmount: 0,
          isDefaultService: true,
          parentPrimaryProductId: primaryProductId,
          taggeddata: primaryLicense
            ? [
                {
                  licensenumber: primaryLicense,
                  nextDue: "",
                  noofusers: "",
                  serialNumber: "",
                  nextDueAmount: productPrice,
                  totalnextDueAmount: actualNetAmount,
                  nextDueTax: igstRate,
                  productAmount: actualNetAmount,
                  taxexclusiveAmount: productPrice,
                  taxinclusiveamount: actualNetAmount,
                  hsn: igstRate,
                  originalHsn: igstRate,
                  leadAmount: productPrice,
                  totalleadAmount: actualNetAmount,
                  leadTax: igstRate,
                  sourceIndex: rowIndex
                }
              ]
            : [],
          company_id: service?.selected[0]?.company_id,
          branch_id: service?.selected[0]?.branch_id,
          actualproductPrice: productPrice,
          actualHsn: igstRate,
          actualNetAmount
        }
      })

      let insertAt = rowIndex + 1
      while (insertAt < rows.length) {
        const nextType = String(
          rows[insertAt]?.productorservicetype || ""
        ).toLowerCase()
        if (nextType === "primaryproduct") break
        insertAt++
      }
      console.log(newRows)
      rows.splice(insertAt, 0, ...newRows)

      if (primaryLicense) {
        setTakenLicense((prevTaken) => {
          const updated = { ...prevTaken }
          newRows.forEach((serviceRow) => {
            updated[serviceRow?.productorServiceName] = [primaryLicense]
          })
          return updated
        })
      }

      return normalizeLeadRows(rows)
    })
  }
  console.log(selectedleadlist)
  const handleProductORserviceSelect = (productId) => {
    if (selectedLicense) {
      if (
        selectedleadlist.some(
          (item) =>
            item.productId === productId &&
            item.licenseNumber === selectedLicense
        )
      )
        return
      const updatedProductList = productOrserviceSelections[
        selectedLicense
      ].map((product) =>
        product._id === productId
          ? {
              ...product,
              selected: !product.selected,
              selectedArray: product?.selectedArray
            }
          : product
      )
      setProductorServiceSelections((prev) => ({
        ...prev,
        [selectedLicense]: updatedProductList
      }))
    } else {
      if (
        selectedleadlist
          .filter((items) => !items.licenseNumber)
          .some((item) => item.productId === productId)
      )
        return
      const updatedProductList = licensewithoutProductSelection.map(
        (product) =>
          product._id === productId
            ? { ...product, selected: !product.selected }
            : product
      )
      setlicenseWithoutProductSelection(updatedProductList)
    }
  }

  const handleToggleDropdown = () => {
    setIsleadForOpen((prev) => !prev)
  }
  console.log(detailsForm)

  console.log(detailsForm)
  console.log(selectedleadlist)

  const handleTaggedDueChange = (rowIndex, value, term, hsn, productType) => {
    console.log("hhh")
    console.log(value)
    console.log(term)
    console.log(hsn)
    console.log(productType)
    console.log(detailsForm)
    setDetailsForm((prev) => ({
      ...prev,
      taggeddata: (prev.taggeddata || []).map((row, i) => {
        if (i !== rowIndex) return row

        const originalHsn = Number(
          row?.originalHsn ?? row?.actualHsn ?? row?.hsn ?? 0
        )
        // console.log(row.actualHsn)
        const currentLeadAmount = Number(row?.taxexclusiveAmount || 0)
        const currentNextDueAmount = Number(row?.nextDueAmount || 0)
        const currentTotalLeadAmount = Number(row?.taxinclusiveamount || 0)
        const currentTotalNextDueAmount = Number(row?.totalnextDueAmount || 0)
        const updatedRow = {
          ...row
        }

        if (term === "nextDue") {
          updatedRow.nextDue = value || ""
          return updatedRow
        }

        if (term === "serialNumber") {
          updatedRow.serialNumber = value
          return updatedRow
        }

        if (term === "noofusers") {
          updatedRow.noofusers = value
          return updatedRow
        }

        if (term === "taxexclusiveAmount") {
          if (Number(value) < row?.discountAmount) {
            toast.warning(
              "Lead amount cannot be less than the Discount amount."
            )
            return updatedRow
          }
          console.log(row.leadTax)
          const updatedtax = row?.leadTax > 0 ? Number(hsn / 100) * value : 0
          updatedRow.taxexclusiveAmount = value === "" ? "" : Number(value)
          const discount = Number(row?.discountAmount ?? 0)
          updatedRow.taxinclusiveamount = Number(value) + updatedtax - discount
          return updatedRow
        }

        if (term === "nextDueAmount") {
          const updatedtax = row?.nextDueTax > 0 ? Number(hsn / 100) * value : 0
          updatedRow.nextDueAmount = value === "" ? "" : Number(value)
          updatedRow.totalnextDueAmount = Number(value) + updatedtax
          return updatedRow
        }

        if (term === "discountAmount") {
          const discountValue = value === "" ? 0 : Number(value)
          console.log(value)
          console.log(discountValue)
          console.log(currentTotalLeadAmount)

          const updatedTotal =
            currentLeadAmount + Number(row?.leadTax / 100) * currentLeadAmount
          if (discountValue > updatedTotal) {
            toast.warning(
              "Discount amount cannot be greater than the total amount."
            )
            return updatedRow
          }
          console.log(updatedTotal)
          updatedRow.discountAmount = discountValue
          updatedRow.taxinclusiveamount =
            value === "" ? updatedTotal : updatedTotal - discountValue
          return updatedRow
        }

        if (term === "leadTax") {
          const checked = !!value
          console.log(checked)
          if (!checked) {
            const taxAmount = (originalHsn / 100) * currentLeadAmount
            console.log(taxAmount)
            console.log(originalHsn)
            console.log(taxAmount)
            console.log(currentTotalLeadAmount)
            updatedRow.leadTax = 0
            updatedRow.taxinclusiveamount = Math.max(
              0,
              Number((currentTotalLeadAmount - taxAmount).toFixed(2))
            )
          } else {
            const taxAmount = (originalHsn / 100) * currentLeadAmount
            updatedRow.leadTax = originalHsn

            const discount = Number(row?.discountAmount ?? 0)

            updatedRow.taxinclusiveamount =
              Number((currentLeadAmount + taxAmount).toFixed(2)) - discount
          }

          return updatedRow
        }

        if (term === "nextDueTax") {
          const checked = !!value

          if (!checked) {
            const taxAmount = (originalHsn / 100) * currentNextDueAmount
            updatedRow.nextDueTax = 0
            updatedRow.totalnextDueAmount = Math.max(
              0,
              Number((currentTotalNextDueAmount - taxAmount).toFixed(2))
            )
          } else {
            const taxAmount = (originalHsn / 100) * currentNextDueAmount
            updatedRow.nextDueTax = originalHsn
            updatedRow.totalnextDueAmount = Number(
              (currentNextDueAmount + taxAmount).toFixed(2)
            )
          }

          return updatedRow
        }

        if (term === "taxexclusiveAmount") {
          const amount = value === "" ? 0 : Number(value)
          updatedRow.taxexclusiveAmount = amount

          if (String(productType || "").toLowerCase() === "additionalservice") {
            const taxAmount = (originalHsn / 100) * amount
            updatedRow.leadTax = amount > 0 ? originalHsn : 0
            updatedRow.taxinclusiveamount = Number(
              (amount + taxAmount).toFixed(2)
            )
            updatedRow.productAmount = Number((amount + taxAmount).toFixed(2))
          }

          return updatedRow
        }

        updatedRow[term] = value
        return updatedRow
      })
    }))
  }
  console.log(selectedleadlist)
  console.log(detailsForm)
  const handleSelectedCustomer = (option) => {
    console.log(option)
    console.log(previousLeadCustomer)
    if (option?.value !== previousLeadCustomer) {
      setiscustomerChanged(true)
    }
    setValueModal("customerName", option?.label)
    setValueModal("customerid", option?.value)
    setValueModal("email", option?.email)

    setValueModal("address1", option?.address1)
    setValueModal("mobile", option?.mobile)
    setValueModal("landline", option?.landline)
    setValueModal("contactPerson", option?.contactPerson)
    setValueModal("pincode", option?.pincode)
    setValueModal("partner", option?.partner)
    setValueModal("registrationType", option?.registrationType)
    setValueModal("gstNo", option?.gstNo)
    setValueModal("city", option?.city)
    setValueModal("country", option?.country)

    console.log(allcustomer)
    const matchedCustomer = allcustomer?.find((item) => {
      return item?._id === option?.value
    })
    console.log(matchedCustomer)

    setSelectedCustomer(option)

    const customerLicense =
      matchedCustomer?.selected?.find(
        (sel) => String(sel.branch_id) === String(selectedBranch)
      )?.licensenumber || ""
    console.log(matchedCustomer)
    setcustomerTableData(
      matchedCustomer?.selected
        ?.filter(
          (sel) =>
            String(sel.branch_id) === String(selectedBranch) &&
            sel?.licensenumber != null &&
            String(sel.licensenumber).trim() !== ""
        )
        ?.map((sel) => ({
          licenseNumber: sel.licensenumber || "",
          productName: sel.productName || "Unknown",
          productorServiceId: sel?.product_id
        })) || []
    )

    setSelectedLeadList((prev) => {
      const rows = prev?.length ? [...prev] : [{ ...emptyRow }]
      return rows.map((row, index) =>
        index === 0
          ? {
              ...row,
              licenseNumber: ""
            }
          : row
      )
    })

    setSelectedLicense(customerLicense || "")
  }

  const handlePriceChange = (index, newPrice) => {
    setSelectedLeadList((prevList) =>
      prevList.map((product, i) => {
        if (i !== index) return product

        const price = Number(newPrice || 0)
        const igst = Number(product.hsn || 0)
        const rawNet = price + (igst / 100) * price
        const netAmount = Math.round(rawNet)

        return {
          ...product,
          productPrice: newPrice,
          netAmount
        }
      })
    )
  }

  const handleHsnChange = (index, newHsn) => {
    setSelectedLeadList((prevList) =>
      prevList.map((product, i) => {
        if (i !== index) return product

        const price = Number(product.productPrice || 0)
        const igst = Number(newHsn || 0)
        const rawNet = price + (igst / 100) * price
        const netAmount = Math.round(rawNet)

        return {
          ...product,
          hsn: newHsn,
          netAmount
        }
      })
    )
  }

  const handleDeletetableData = (item, indexNum) => {
    console.log(item)
    console.log(takenLicenses)
    const productId = item.productorServiceId || item?.productId
    const isPrimaryProduct = getRowType(item) === "primaryproduct"
    const primaryProductId = getRowId(item?.productorServiceId)
    const rowsToRemove = []
    let reachedNextPrimary = false
    const filteredLeadlist = selectedleadlist.filter((row, index) => {
      if (index === indexNum) {
        rowsToRemove.push(row)
        return false
      }

      if (!isPrimaryProduct || index < indexNum) return true
      if (reachedNextPrimary) return true

      const rowType = getRowType(row)
      if (rowType === "primaryproduct") {
        reachedNextPrimary = true
        return true
      }

      const parentId = getRowId(row?.parentPrimaryProductId)
      const shouldRemove =
        rowType === "additionalservice" &&
        (!parentId || parentId === primaryProductId)

      if (shouldRemove) {
        rowsToRemove.push(row)
        return false
      }

      return true
    })

    setunselectedtaggedlicense((prev) => {
      const updated = { ...prev }
      rowsToRemove.forEach((row) => {
        delete updated[row?.productorServiceId || row?.productId]
      })
      return updated
    })
    setTakenLicense((prev) => {
      const updated = { ...prev }

      rowsToRemove.forEach((row) => {
        const serviceName = row?.productorServiceName || ""
        const keyToDelete = Object.keys(updated).find(
          (key) => key.toLowerCase() === serviceName.toLowerCase()
        )

        if (keyToDelete) {
          delete updated[keyToDelete]
        }
      })

      return updated
    })

    if (item?.licenseNumber) {
      const updatedProductList = (
        productOrserviceSelections[item.licenseNumber] || []
      ).map((product) =>
        String(product?.id) === String(productId)
          ? { ...product, selected: false }
          : product
      )

      setProductorServiceSelections((prev) => ({
        ...prev,
        [item.licenseNumber]: updatedProductList
      }))
    } else {
      const updatedProductList = (licensewithoutProductSelection || []).map(
        (product) =>
          String(product?.id) === String(productId)
            ? { ...product, selected: false }
            : product
      )
      setlicenseWithoutProductSelection(updatedProductList)
    }

    setSelectedLeadList(
      filteredLeadlist.length ? filteredLeadlist : [{ ...emptyRow }]
    )
  }
  const customFilter = (option, inputValue) => {
    if (!inputValue) return true
    const searchValue = inputValue.toLowerCase()
    const label = option.label ? String(option.label).toLowerCase() : ""
    const mobile = option.data?.mobile ? option.data?.mobile.toLowerCase() : ""
    return label.includes(searchValue) || mobile.includes(searchValue)
  }

  const calculateTotalAmount = () => {
    return selectedleadlist
      .reduce((total, product) => {
        return total + (Number(product.netAmount) || 0)
      }, 0)
      .toFixed(2)
  }

  const calculatetaxAmount = () => {
    return (
      Math.round(
        selectedleadlist.reduce((total, product) => {
          return (
            total + (Number(product.netAmount) - Number(product.productPrice))
          )
        }, 0) * 100
      ) / 100
    )
  }

  const calculatetaxableAmount = () => {
    return selectedleadlist.reduce((total, product) => {
      return total + Number(product.productPrice)
    }, 0)
  }

  const handleAddRowFromTable = () => {
    setwarningMessage(
      "You can’t add more products; this is limited to a single product."
    )
    setTimeout(() => {
      setwarningMessage("")
    }, 3000)
    return
  }

  const hasDuplicateLeadRows = (rows) => {
    const seen = new Set()
    for (const row of rows) {
      if (!row.productorServiceId) continue
      const key =
        row.licenseNumber && row.licenseNumber !== ""
          ? `LIC:${row.licenseNumber}|PROD:${row.productorServiceId}`
          : `NO_LIC|PROD:${row.productorServiceId}`
      if (seen.has(key)) {
        return true
      }
      seen.add(key)
    }
    return false
  }

  const validateLeadData = async (leadData, selectedleadlist, role) => {
    const result = await api.get("/lead/checkexistinglead", {
      params: { leadData, selectedleadlist, role }
    })
    // if (
    //   result.data.message ===
    //     "This customer already has a lead with the same product."
    // ) {
    //   return {
    //     eligible: false,
    //     message: `${result.data.message},You can't make leads`
    //   }
    // } else
    console.log(result.data.message)
    if (
      result.data.message ===
      "This customer already has a lead with the same product."
    ) {
      return { eligible: true, message: result.data.message }
    } else if (
      result.data.message ===
      "No existing lead for this customer. Safe to create new lead."
    ) {
      return { eligible: true, message: "" }
    } else if (
      result.data.message ===
      "This customer already has a lead, but with different product(s)."
    ) {
      return {
        eligible: true,
        message:
          "This customer already has a lead, but with different product(s)."
      }
    }
    setPopupMessage(result.data.message)
    return isEligible
  }

  const resetLeadForm = () => {
    const defaultBranch =
      Array.isArray(companybranches) && companybranches.length > 0
        ? companybranches[0]?._id || companybranches[0]?.id
        : ""

    resetMain({
      customerName: "",
      leadBranch: selectedBranch || "",
      email: "",
      phone: "",
      mobile: "",
      source: "",
      partner: "",
      allocationType: null,
      dueDate: "",
      remark: "",
      taxableAmount: "",
      taxAmount: "",
      netAmount: "",
      selfAllocation: false,
      leadId: "",
      leadBy: loggeduser?._id || loggeduser?.id || ""
    })
    setTakenLicense([])
    clearMainerrors()
    setValidateError({})
    setwarningMessage("")
    setSelectedCustomer(null)
    setSelectedLicense(null)
    setcustomerTableData([])
    setSelectedLeadList([{ ...emptyRow }])
    setProductorServiceSelections({})
    setlicenseWithoutProductSelection([])
    setselfAllocation(false)
    setPopupMessage("")
    setPopupOpen(false)
    setIseligible(false)

    if (defaultBranch) {
      setValueMain("leadBranch", selectedBranch)
    }
  }
  const tradeOptions = [
    { value: "Wholesale Trading", label: "Wholesale Trading" },
    { value: "Retail Trading", label: "Retail Trading" },
    { value: "Import & Export", label: "Import & Export" },
    { value: "Distribution / Dealers", label: "Distribution / Dealers" },
    {
      value: "E-commerce / Online Trading",
      label: "E-commerce / Online Trading"
    },
    { value: "IT Services", label: "IT Services" },
    { value: "Web Design & Development", label: "Web Design & Development" },
    { value: "Cyber Security Services", label: "Cyber Security Services" },
    { value: "Hardware & Networking", label: "Hardware & Networking" },
    { value: "Construction Companies", label: "Construction Companies" },
    {
      value: "Pharmaceutical Manufacturing",
      label: "Pharmaceutical Manufacturing"
    },
    { value: "Food Manufacturing", label: "Food Manufacturing" },
    {
      value: "Textile / Garment Manufacturing",
      label: "Textile / Garment Manufacturing"
    },
    { value: "Chemical Manufacturing", label: "Chemical Manufacturing" },
    { value: "Plastic Manufacturing", label: "Plastic Manufacturing" },
    {
      value: "Steel / Metal Manufacturing",
      label: "Steel / Metal Manufacturing"
    },
    { value: "Furniture Manufacturing", label: "Furniture Manufacturing" },
    { value: "Building Contractors", label: "Building Contractors" },
    { value: "Real Estate Developers", label: "Real Estate Developers" },
    {
      value: "Electrical Equipment Manufacturing",
      label: "Electrical Equipment Manufacturing"
    },
    { value: "Electronics Manufacturing", label: "Electronics Manufacturing" },
    { value: "Automobile Manufacturing", label: "Automobile Manufacturing" },
    { value: "Hospitals", label: "Hospitals" },
    { value: "Clinics", label: "Clinics" },
    { value: "Medical Laboratories", label: "Medical Laboratories" },
    {
      value: "Medical Equipment Suppliers",
      label: "Medical Equipment Suppliers"
    },
    {
      value: "Pharmacies / Medical Stores",
      label: "Pharmacies / Medical Stores"
    },
    { value: "Interior Design", label: "Interior Design" },
    { value: "Vehicle Dealers", label: "Vehicle Dealers" },
    {
      value: "Automobile Service Centres",
      label: "Automobile Service Centres"
    },
    { value: "Insurance Companies", label: "Insurance Companies" },
    { value: "Spare Parts Dealers", label: "Spare Parts Dealers" },
    { value: "Transport & Logistics", label: "Transport & Logistics" },
    { value: "Banks", label: "Banks" },
    { value: "Finance Companies", label: "Finance Companies" },
    { value: "Hotels & Resorts", label: "Hotels & Resorts" },
    { value: "Schools", label: "Schools" },
    { value: "Colleges", label: "Colleges" },
    { value: "Training Institutes", label: "Training Institutes" },
    { value: "Coaching Centers", label: "Coaching Centers" },
    { value: "Educational Consultants", label: "Educational Consultants" },
    { value: "Software Development", label: "Software Development" },
    { value: "Restaurants / Cafes", label: "Restaurants / Cafes" },
    { value: "Travel Agencies", label: "Travel Agencies" },
    { value: "Tourism Operators", label: "Tourism Operators" },
    {
      value: "Advertising & Marketing Agencies",
      label: "Advertising & Marketing Agencies"
    },
    { value: "Event Management", label: "Event Management" },
    { value: "Security Services", label: "Security Services" },
    {
      value: "Cleaning / Facility Management",
      label: "Cleaning / Facility Management"
    },
    {
      value: "Chartered Accountants / Audit Firms",
      label: "Chartered Accountants / Audit Firms"
    },
    { value: "Tax Consultants", label: "Tax Consultants" },
    {
      value: "NGOs / Non-Profit Organizations",
      label: "NGOs / Non-Profit Organizations"
    },
    { value: "Government Organizations", label: "Government Organizations" }
  ]
  console.log(haveprimaryProduct)
  console.log(selectedleadlist)
  const validateSelectedLeadList = (selectedleadlist = []) => {
    const hasAdditionalService = selectedleadlist.some(
      (row) =>
        String(row?.productorservicetype || "").toLowerCase() ===
        "additionalservice"
    )
    console.log(selectedleadlist)
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
      const rowNo = i + 1
      const type = String(row?.productorservicetype || "").toLowerCase()

      const hasCompany = !!(
        row?.company_id ||
        row?.companyid ||
        row?.companyName
      )
      const hasBranch = !!(row?.branch_id || row?.branchid || row?.branchName)

      if (!hasCompany) {
        return `Company is required in row ${rowNo}`
      }

      if (!hasBranch) {
        return `Branch is required in row ${rowNo}`
      }
      console.log(row)
      const productPrice = Number(
        row?.productprice ?? row?.productPrice ?? row?.amount ?? 0
      )
      console.log(type)
      console.log(productPrice)
      const netAmount = Number(row?.netamount ?? row?.netAmount ?? 0)
      console.log(
        !String(row?.licensenumber || row?.licenseNumber || "").trim()
      )
      if (type === "primaryproduct") {
        if (!String(row?.licensenumber || row?.licenseNumber || "").trim()) {
          console.log("hhh")
          return `License number is required for  ${row?.productorServiceName || row?.productName}`
        }
        if (!row.applicationDate) {
          return `Application date is requiered for  ${row?.productName || row?.productorServiceName},please add details`
        }
        if (!row?.softwareTrade) {
          return `SoftwareTrade is required for ${row?.productName || row?.productorServiceName}`
        }
        if (!(productPrice > 0)) {
          console.log("hhh")
          return `Product price must be greater than 0 for ${row?.productName || row?.productorServiceName}`
        }

        if (!(netAmount > 0)) {
          return `Net amount is required for ${row?.productName || row?.productorServiceName}`
        }
      }

      if (type === "additionalservice") {
        console.log(row)
        const taggeddata = Array.isArray(row?.taggeddata) ? row.taggeddata : []
        const outerLicense = String(
          row?.licensenumber || row?.licenseNumber || ""
        ).trim()
        const hasTaggedLicense = taggeddata.some((tag) =>
          String(tag?.licensenumber || tag?.licenseNumber || "").trim()
        )

        const hasAnyLicense = !!outerLicense || hasTaggedLicense
        console.log(!hasAdditionalService)
        console.log(!hasAdditionalService && !(productPrice > 0))
        if (!hasAdditionalService && !(productPrice > 0)) {
          console.log("jjjj")
          return `Product price must be greater than 0 for ${row?.productName}`
        }

        if (!hasAdditionalService && !(netAmount > 0)) {
          return `Net amount is required for  ${row?.productName || row?.productorServiceName}`
        }
        console.log(taggeddata)

        if (taggeddata.length > 0) {
          for (let j = 0; j < taggeddata.length; j++) {
            const tag = taggeddata[j]
            console.log(tag)
            const tagLicense = String(
              tag?.licensenumber || tag?.licenseNumber || ""
            ).trim()
            const due = parseDateOnly(tag?.nextDue)
            const productAmount = Number(tag?.taxexclusiveAmount)
            const nextDueAmount = Number(tag?.nextDueAmount)
            console.log(productAmount)
            console.log(!productAmount > 0)
            if (!tagLicense) {
              console.log("hh")
              return `Tagged license number is required for ${row?.productName || row?.productorServiceName}`
            }
            // if (!productAmount > 0) {
            //   console.log("hh")
            //   return `Lead amount is required for ${row?.productName || row?.productorServiceName} ${tag?.licensenumber},not less than 0`
            // }
            if (Number(productAmount) <= 0 && !haveprimaryProduct) {
              console.log("hh")
              return `Lead amount is required for ${
                row?.productName || row?.productorServiceName
              } (${tag?.licensenumber}). It must be greater than 0.`
            }
            if (Number(nextDueAmount) <= 0) {
              console.log("hh")
              return `NextDueAmount is required for ${
                row?.productName || row?.productorServiceName
              } (${tag?.licensenumber}). It must be greater than 0.`
            }
            if (!due) {
              return `Next due is required for  ${row?.productName || row?.productorServiceName}`
            }

            if (due < today) {
              return `Next due cannot be less than current date for ${row?.productName || row?.productorServiceName}`
            }
          }
        } else {
          console.log(taggeddata)
          if (!row.nextDue) {
            console.log("hh")
            return `Additonal service  ${row?.productName || row?.productorServiceName} must have a nextDue please add Details`
          }
          if (!outerLicense && taggeddata.length === 0) {
            console.log("hhh")
            return `Additional service  ${row?.productName || row?.productorServiceName} must have a license number or tagged license`
          }

          const due = parseDateOnly(row?.nextDue)
          if (!due) {
            return `Next due is required for ${row?.productName || row?.productorServiceName}`
          }

          if (due < today) {
            return `Next due cannot be less than current date for ${row?.productName || row?.productorServiceName}`
          }
        }

        if (!hasAnyLicense) {
          console.log("Hhh")
          return `Additional service ${row?.productName || row?.productorServiceName} must have a license number or tagged license`
        }
      }
    }

    const primaryProducts = selectedleadlist.filter(
      (row) =>
        String(row?.productorservicetype || "").toLowerCase() ===
        "primaryproduct"
    )

    const additionalServices = selectedleadlist.filter(
      (row) =>
        String(row?.productorservicetype || "").toLowerCase() ===
        "additionalservice"
    )

    if (primaryProducts.length > 0 && additionalServices.length > 0) {
      for (let i = 0; i < additionalServices.length; i++) {
        const row = additionalServices[i]
        const rowNo = selectedleadlist.findIndex((x) => x === row) + 1
        const taggeddata = Array.isArray(row?.taggeddata) ? row.taggeddata : []
        const outerLicense = String(
          row?.licensenumber || row?.licenseNumber || ""
        ).trim()
        const hasTaggedLicense = taggeddata.some((tag) =>
          String(tag?.licensenumber || tag?.licenseNumber || "").trim()
        )

        if (!outerLicense && !hasTaggedLicense) {
          return `Additional service  ${row?.productName || row?.productorServiceName} should have any one license number or tagged license number`
        }
      }
    }

    return null
  }
  const onSubmit = async (data) => {
    console.log(data)
    console.log(duplicateWarning)
    if (duplicateWarning) return
    if (submitLoading) return
    setsubmitLoading(true)
    if (duplicateWarning) return
    const submitData = { ...data }

    if (!selfAllocation) {
      delete submitData.allocationType
      delete submitData.dueDate
    }
    try {
      const cleanedSelectedLeadList = normalizeLeadRows(selectedleadlist)

      if (cleanedSelectedLeadList.length !== selectedleadlist.length) {
        setSelectedLeadList(cleanedSelectedLeadList)
      }

      if (hasDuplicateLeadRows(cleanedSelectedLeadList)) {
        setValidateError((prev) => ({
          ...prev,
          duplicate:
            "Duplicate product found for same license or same product without license. Please remove duplicates."
        }))
        setsubmitLoading(false)
        return
      } else if (validateError.duplicate) {
        setValidateError((prev) => ({ ...prev, duplicate: "" }))
      }

      if (process === "Registration") {
        console.log("HHH")
        const filteredleadlist = toLeadPayloadRows(
          cleanedSelectedLeadList.filter(
            (item) => item.productorServiceId && item.productorServiceId !== ""
          )
        )
        if (filteredleadlist.length === 0) {
          setValidateError((prev) => ({
            ...prev,
            emptyleadData: "No Lead generated do it"
          }))
          setsubmitLoading(false)
          return
        }
        const validation = await validateLeadData(
          submitData,
          filteredleadlist,
          loggeduser.role
        )
        console.log(validation)
        setFormData(submitData)
        setPopupMessage(validation.message)
        if (validation.message === "") {
          const saved = await handlePopupOk(true, submitData)
          if (saved) {
            if (process === "Registration") {
              toast.success("lead created successfully")
            }
          }
        } else {
          setPopupOpen(true)
        }
        setIseligible(validation.eligible)
      } else if (
        process === "edit" ||
        (isClosedLeadEdit && process !== "closing")
      ) {
        if (isReadOnly) {
          setValidateError((prev) => ({
            ...prev,
            readonlyError:
              "Can't make changes unless the user is the leadBy or allocatedTo"
          }))
          setsubmitLoading(false)
          return
        }
        // const validationMessage = validateSelectedLeadList(selectedleadlist)
        // console.log(validationMessage)
        // if (validationMessage) {
        //   toast.warning(validationMessage)
        //   return
        // }
        seteditLoadingState(true)
        const updated = await handleEditData(
          data,
          toLeadPayloadRows(cleanedSelectedLeadList),
          Data[0]?._id,
          from,
          previousLeadCustomer,
          isCustomerChanged
        )
      } else if (process === "closing") {
        const validationMessage = validateSelectedLeadList(
          cleanedSelectedLeadList
        )
        console.log(validationMessage)
        if (validationMessage) {
          toast.warning(validationMessage)
          return
        }

        console.log(cleanedSelectedLeadList)
        console.log(loggeduser)
        console.log(data)

        seteditLoadingState(true)
        const updated = await handleclosingData(
          data,
          toLeadPayloadRows(cleanedSelectedLeadList),
          Data[0]?._id,
          loggeduser._id,
          loggeduser?.role
        )
      }
    } catch (error) {
      toast.error("Failed to add product!")
    } finally {
      setsubmitLoading(false)
    }
  }
  console.log(selectedleadlist)
  const handlePopupOk = async (ischek = false, leadData = null) => {
    console.log(formData)
    console.log(leadData)
    setPopupOpen(false)
    const cleanedSelectedLeadList = normalizeLeadRows(selectedleadlist)
    const filteredleadlist = toLeadPayloadRows(
      cleanedSelectedLeadList.filter(
        (item) => item.productorServiceId && item.productorServiceId !== ""
      )
    )
    console.log(filteredleadlist)
    let response
    if (isEligible && leadData === null) {
      response = await handleleadData(
        formData,
        filteredleadlist,
        loggeduser.role
      )
    } else if (ischek && leadData) {
      response = await handleleadData(
        leadData,
        filteredleadlist,
        loggeduser.role
      )
    }
    if (response?.success) {
      resetLeadForm()
    }
  }
  const handleDetailsChange = (e) => {
    const { name, value } = e.target
    setDetailsForm((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const updateSelectedLeadItem = (rowId, getUpdates, transformRows) => {
    if (!rowId) return

    setSelectedLeadList((prev) => {
      const updatedRows = prev.map((row) => {
        if (row?.rowId !== rowId) return row

        const updates =
          typeof getUpdates === "function" ? getUpdates(row) : getUpdates
        return { ...row, ...updates }
      })

      return transformRows ? transformRows(updatedRows) : updatedRows
    })
  }
  console.log(selectedleadlist)
  console.log(detailsForm)
  const handleDetailsSave = () => {
    const itemType = String(
      detailsItem?.productorservicetype || ""
    ).toLowerCase()
    console.log("hha")
    console.log(detailsForm)
    console.log(detailsForm.taggeddata)
    console.log(selectedleadlist)

    const cleanedTaggedData = Array.isArray(detailsForm.taggeddata)
      ? detailsForm.taggeddata
          .map((tag) => ({
            licensenumber: String(tag?.licensenumber || "").trim(),
            nextDue: String(tag?.nextDue || "").trim(),
            productAmount:
              tag?.productAmount ??
              tag?.taxinclusiveamount ??
              tag?.totalleadAmount ??
              0,
            taxexclusiveAmount: tag?.taxexclusiveAmount,
            taxinclusiveamount: tag?.taxinclusiveamount,
            hsn: tag?.hsn,
            noofusers: tag?.noofusers,
            serialNumber: tag?.serialNumber,
            nextDueAmount: tag?.nextDueAmount,
            originalHsn: tag?.originalHsn,
            leadAmount: tag?.leadAmount,
            totalleadAmount: tag?.totalleadAmount,
            totalnextDueAmount: tag?.totalnextDueAmount,
            leadTax: tag?.leadTax,
            nextDueTax: tag?.nextDueTax,
            discountAmount: tag?.discountAmount
          }))
          .filter((tag) => tag.licensenumber !== "")
      : []

    if (itemType === "primaryproduct") {
      if (!String(detailsForm.softwareTrade || "").trim()) {
        toast.warning("Software Trade is required")
        return
      }

      if (!detailsForm.applicationDate) {
        toast.warning("Application Date is required")
        return
      }
    }

    if (itemType === "additionalservice") {
      if (cleanedTaggedData.length > 0) {
        const invalidTag = cleanedTaggedData.find((tag) => {
          const missingLeadAmount =
            !haveprimaryProduct && Number(tag?.taxexclusiveAmount) <= 0
          return (
            !tag?.licensenumber ||
            !tag?.nextDue ||
            Number(tag?.nextDueAmount) <= 0 ||
            missingLeadAmount
          )
        })

        if (invalidTag) {
          const licenseLabel = invalidTag?.licensenumber
            ? ` for ${invalidTag.licensenumber}`
            : ""

          if (!invalidTag?.licensenumber) {
            toast.warning("Tagged license number is required")
          } else if (
            !haveprimaryProduct &&
            Number(invalidTag?.taxexclusiveAmount) <= 0
          ) {
            toast.warning(`Lead Amount must be greater than 0${licenseLabel}`)
          } else if (!invalidTag?.nextDue) {
            toast.warning(`Next Due is required${licenseLabel}`)
          } else {
            toast.warning(
              `Next Due Amount must be greater than 0${licenseLabel}`
            )
          }
          return
        }
      } else if (!detailsForm.nextDue) {
        toast.warning("Next Due is required")
        return
      }
    }
    console.log(detailsForm)
    const totaltaxexclusiveAmount = detailsForm?.taggeddata.reduce(
      (sum, item) => {
        const amount = Number(item.taxexclusiveAmount) || 0 // safely handle invalid/empty
        return sum + amount
      },
      0
    )
    const totaldiscount = cleanedTaggedData.reduce((sum, item) => {
      const amount = Number(item?.discountAmount) || 0

      return sum + amount
    }, 0)
    console.log(cleanedTaggedData)
    const totaltaxinclusiveAmount = cleanedTaggedData.reduce((sum, item) => {
      const amount = Number(item?.taxinclusiveamount) || 0
      return sum + amount
    }, 0)
    console.log(totaltaxinclusiveAmount)
    const taxamount =
      (Number(detailsForm?.taggeddata[0]?.leadTax) / 100) *
      totaltaxexclusiveAmount
    const updatedNetAmount = Math.round(
      Number(totaltaxexclusiveAmount) + taxamount
    )
    console.log(taxamount)
    console.log(totaltaxexclusiveAmount)
    console.log(updatedNetAmount)
    console.log(selectedleadlist)
    console.log(detailsForm)
    const isClosingPrimary =
      itemType === "primaryproduct" &&
      String(detailsForm.status || "").toLowerCase() === "closed"
    const primaryProductId = getRowId(detailsItem?.productorServiceId)
    const closingPrimaryRowsToRemove = []

    if (isClosingPrimary) {
      let reachedNextPrimary = false
      selectedleadlist.forEach((row, i) => {
        if (i <= detailsIndex || reachedNextPrimary) return

        const rowType = getRowType(row)
        if (rowType === "primaryproduct") {
          reachedNextPrimary = true
          return
        }

        const parentId = getRowId(row?.parentPrimaryProductId)
        if (
          rowType === "additionalservice" &&
          (!parentId || parentId === primaryProductId)
        ) {
          closingPrimaryRowsToRemove.push(row)
        }
      })

      setunselectedtaggedlicense((prev) => {
        const updated = { ...prev }
        closingPrimaryRowsToRemove.forEach((row) => {
          delete updated[row?.productorServiceId || row?.productId]
        })
        return updated
      })

      setTakenLicense((prev) => {
        const updated = { ...prev }
        closingPrimaryRowsToRemove.forEach((row) => {
          const serviceName = row?.productorServiceName || ""
          const keyToDelete = Object.keys(updated).find(
            (key) => key.toLowerCase() === serviceName.toLowerCase()
          )

          if (keyToDelete) delete updated[keyToDelete]
        })
        return updated
      })
    }

    updateSelectedLeadItem(
      detailsRowId,
      (row) => {
        if (itemType === "additionalservice") {
          const hasTaggedLicenses = cleanedTaggedData.length > 0

          return {
            applicationDate: detailsForm.applicationDate,
            productPrice: haveprimaryProduct
              ? row?.productPrice
              : totaltaxexclusiveAmount,
            netAmount: haveprimaryProduct ? row?.netAmount : updatedNetAmount,
            noofusers: detailsForm.noofusers,
            amount: detailsForm.amount,
            status: detailsForm.status,
            isActive: detailsForm.status,
            nextDue: hasTaggedLicenses ? "" : detailsForm.nextDue,
            taggeddata: hasTaggedLicenses ? cleanedTaggedData : [],
            licenseNumber: hasTaggedLicenses
              ? row?.licenseNumber || ""
              : detailsForm.licenseNumber || row?.licenseNumber || ""
          }
        }

        return {
          applicationDate: detailsForm.applicationDate,
          softwareTrade: detailsForm.softwareTrade,
          status: detailsForm.status,
          isActive: detailsForm.status
        }
      },
      (rows) => {
      let reachedNextPrimary = false

        const filteredRows = rows.filter((row, i) => {
          if (!isClosingPrimary || i <= detailsIndex) return true
          if (reachedNextPrimary) return true

          const rowType = getRowType(row)
          if (rowType === "primaryproduct") {
            reachedNextPrimary = true
            return true
          }

          const parentId = getRowId(row?.parentPrimaryProductId)
          return !(
            rowType === "additionalservice" &&
            (!parentId || parentId === primaryProductId)
          )
        })

        return filteredRows.length ? filteredRows : [{ ...emptyRow }]
      }
    )

    setValueMain("discamnt", totaldiscount)
    setdetailsopen(false)
  }
  console.log(detailsForm)
  console.log(selectedleadlist)
  const isRowPriceLocked = (row) => {
    if (!row) return false

    const currentType = String(row?.productorservicetype || "").toLowerCase()
    const hasPrimaryProduct = selectedleadlist.some(
      (item) =>
        String(item?.productorservicetype || "").toLowerCase() ===
        "primaryproduct"
    )
    console.log(hasPrimaryProduct)
    if (!hasPrimaryProduct) return false
    console.log(!hasPrimaryProduct)
    console.log("k")
    if (currentType === "primaryproduct") return false
    if (currentType === "additionalservice") return true

    return false
  }
  const normalizeMobile = (number) => {
    if (!number) return ""
    return number.replace(/\D/g, "").slice(-10)
  }

  const isMobileExists = (
    inputMobile,
    existingCustomers,
    customerid = null
  ) => {
    console.log(customerid)
    console.log(existingCustomers)
    console.log(inputMobile)
    const normalizedInput = normalizeMobile(inputMobile)
    if (customerid) {
      console.log("h")
      return existingCustomers.some((customer) => {
        const normalizedStored = normalizeMobile(customer.mobile)
        return (
          normalizedStored === normalizedInput && customer._id !== customerid
        )
      })
    }
    return existingCustomers.some((customer) => {
      const normalizedStored = normalizeMobile(customer.mobile)
      return normalizedStored === normalizedInput
    })
  }
  console.log(duplicateWarning)
  const onmodalsubmit = async (data) => {
    console.log(data)
    console.log("hhhh")
    console.log(duplicateWarning)
    if (duplicateWarning) return
    console.log(duplicateWarning)

    if (modalloader) return
    console.log(checknewcustomer)
    console.log(data?.customerid)
    console.log(data)
    console.log(data?.customerid && !checknewcustomer)
    if (data?.customerid) {
      console.log("hhhhh")
    }

    try {
      setModalLoader(true)
      console.log(data)
      let response
      console.log(checknewcustomer)
      if (data?.customerid) {
        if (checknewcustomer) return
        console.log("hhh")
        response = await api.post("/customer/customereditonlead", {
          customerData: data
        })
      } else {
        const createdFrom = "lead"
        console.log("hhhh")
        response = await api.post(
          `/customer/customerRegistration?createdfrom=${createdFrom}`,
          {
            customerData: data
          }
        )
      }
      if (data?.customerid && response.status === 200) {
        console.log("hhhh")
        setcustomerapichange(true)
        refreshHook()
        toast.success("Customer updated successfully")
        setModalLoader(false)
        setModalOpen(false)
        setchecknewcustomer(false)
        loggeduser?.role === "Admin"
          ? navigate("/admin/transaction/lead/leadEdit", {
              state: {
                leadId: Data[0]?._id,
                isReadOnly: false,
                refreshKey: Date.now()
              }
            })
          : navigate("/staff/transaction/lead/leadEdit", {
              state: {
                leadId: Data[0]?._id,
                isReadOnly: false,
                refreshKey: Date.now()
              }
            })
      } else if (response.status === 200) {
        refreshHook()
        setModalLoader(false)
        resetModal()
        toast.success(response.data.message)
        setModalOpen(false)
        clearmodalErros()
        resetModal()
        setchecknewcustomer(false)
      }
    } catch (error) {
      toast.error("something went wrong")
      setModalLoader(false)
    }
  }
  console.log(process)
  console.log(warningErrors)
  console.log(detailsForm)
  console.log(selectedleadlist)
  const getPositiveInteger = (...values) => {
    return values.find((value) => {
      const number = Number(value)
      return Number.isInteger(number) && number > 0
    })
  }
  const handleDetails = (item, index) => {
    console.log("k")
    console.log(selectedCustomer)
    console.log(item)
    console.log(leadList)
    const productId = item.productorServiceId
    if (
      String(item?.productorservicetype || "").toLowerCase() ===
      "additionalservice"
    ) {
      const hasTaggedLicenses =
        item?.licenseNumbers?.length || item?.taggeddata?.length

      if (!hasTaggedLicenses) {
        setunselectedtaggedlicense((prev) => ({
          ...prev,
          [productId]: "Please tag any of the license"
        }))
      } else {
        setunselectedtaggedlicense((prev) => {
          const updated = { ...prev }
          delete updated[productId]
          return updated
        })
      }
    }

    const isAdditionalService =
      String(item?.productorservicetype || "").toLowerCase() ===
      "additionalservice"
    console.log(isAdditionalService)
    console.log(item)
    console.log(selectedCustomer)
    console.log(item?.productorServiceId)
    const filteredproduct =
      selectedCustomer?.selected?.filter(
        (it) => it?.product_id?._id === item?.productorServiceId
      ) || []
    console.log(filteredproduct)
    console.log(item?.productorServiceId)
    const a = leadList.map((item) => item.productName)
    console.log(a)
    const newproduct = leadList.filter(
      (it) => it?._id === item?.productorServiceId
    )
    console.log(newproduct)

    console.log(filteredproduct)
    console.log(leadList)
    console.log(item)
    const normalizedTaggedData =
      isAdditionalService &&
      Array.isArray(item?.licenseNumbers) &&
      item.licenseNumbers.length > 0
        ? item.licenseNumbers.map((lic) => {
            const existing = Array.isArray(item?.taggeddata)
              ? item.taggeddata.find(
                  (tag) =>
                    String(tag?.licensenumber) === String(lic?.licenseNumber)
                )
              : null
            console.log(existing)
            // 1. Pick the one WALLET product row (or all, but you showed one)
            const primaryProduct = Array.isArray(filteredproduct)
              ? filteredproduct[0] // or a .find if there are many
              : null
            console.log(filteredproduct[0])

            // 2. Find tag inside that primary product’s taggeddata
            const shouldUseCustomerTag =
              !item?.isDefaultService && !getRowId(item?.parentPrimaryProductId)
            const existingTag =
              shouldUseCustomerTag &&
              primaryProduct &&
              Array.isArray(primaryProduct.taggeddata)
                ? primaryProduct.taggeddata.find(
                    (tag) =>
                      String(tag?.licensenumber) === String(lic?.licenseNumber)
                  )
                : null
            console.log(existing?.productAmount)
            console.log(existingTag?.productAmount)
            console.log(item?.actualNetAmount)
            console.log(item?.netAmount)
            console.log(existing)
            console.log(existingTag)
            // 3. Decide productAmount
            const productAmount =
              existing?.productAmount ??
              item?.actualNetAmount ??
              item?.netAmount ??
              existingTag?.productAmount ??
              0
            console.log(productAmount)
            console.log(existing?.nextDueTax)
            console.log(existingTag?.nextDueTax)
            console.log(item?.hsn)
            console.log(item?.actualHsn)
            const r =
              getPositiveInteger(
                existing?.nextDueTax,
                existingTag?.nextDueTax,
                item?.hsn,
                item?.actualHsn
              ) ?? 0
            console.log(r)
            return {
              licensenumber: lic?.licenseNumber || "",
              nextDue: existing?.nextDue ?? "",
              noofusers:
                existing?.noofusers ??
                existingTag?.noofusers ??
                item?.noofusers ??
                0,
              nextDueAmount:
                existing?.nextDueAmount ??
                item?.actualproductPrice ??
                item?.productPrice ??
                existingTag?.nextDueAmount ??
                0,
              sourceIndex: lic?.sourceIndex,
              productAmount,
              taxexclusiveAmount:
                existing?.taxexclusiveAmount ??
                item?.actualproductPrice ??
                item?.productPrice ??
                existingTag?.taxexclusiveAmount ??
                0,
              taxinclusiveamount:
                existing?.taxinclusiveamount ??
                item?.actualNetAmount ??
                item?.netAmount ??
                existingTag?.taxinclusiveamount ??
                0,
              hsn:
               

                getPositiveInteger(
                  existing?.hsn,
                  item?.actualHsn,
                  item?.hsn,
                  existingTag?.hsn
                ) ?? 0,
              originalHsn: item?.actualHsn ?? item?.hsn,
              leadAmount:
                existing?.leadAmount ??
                item?.actualproductPrice ??
                item?.productPrice ??
                existingTag?.leadAmount ??
                0,
              totalleadAmount:
                existing?.totalleadAmount ??
                item?.actualNetAmount ??
                item?.netAmount ??
                existingTag?.totalleadAmount ??
                0,
              totalnextDueAmount:
                existing?.totalnextDueAmount ??
                item?.actualNetAmount ??
                item?.netAmount ??
                existingTag?.totalnextDueAmount ??
                0,
              leadTax: existing?.leadTax ?? existing?.hsn ?? item?.actualHsn ?? item?.hsn ?? existingTag?.hsn,
              nextDueTax:
                // existing?.nextDueTax ??
                // existingTag?.nextDueTax ??
                // item?.hsn ??
                // item?.actualHsn,
                getPositiveInteger(
                  existing?.nextDueTax,
                  item?.hsn,
                  item?.actualHsn,
                  existingTag?.nextDueTax
                ) ?? 0,
              discountAmount:
                existing?.discountAmount ?? item?.discountAmount ?? 0,
              noofusers:
                existing?.noofusers ??
                existingTag?.noofusers ??
                item?.noofusers,
              serialNumber:
                existing?.serialNumber ??
                existingTag?.serialNumber ??
                item?.serialNumber
            }
          })
        : Array.isArray(item?.taggeddata)
          ? item.taggeddata.map((tag) => ({
              licensenumber: tag?.licensenumber || tag?.licenseNumber || "",
              nextDue: tag?.nextDue ? String(tag.nextDue).split("T")[0] : "",
              noofusers: tag?.noofusers ?? item?.noofusers ?? "",
              serialNumber: tag?.serialNumber ?? item?.serialNumber ?? "",
              productAmount:
                tag?.productAmount ??
                item?.actualNetAmount ??
                item?.netAmount ??
                0,
              taxexclusiveAmount:
                tag?.taxexclusiveAmount ??
                tag?.leadAmount ??
                item?.actualproductPrice ??
                item?.productPrice ??
                0,
              taxinclusiveamount:
                tag?.taxinclusiveamount ??
                tag?.totalleadAmount ??
                item?.actualNetAmount ??
                item?.netAmount ??
                0,
              hsn: tag?.hsn ?? tag?.leadTax ?? item?.actualHsn ?? item?.hsn,
              originalHsn: tag?.originalHsn ?? item?.actualHsn ?? item?.hsn,
              leadAmount: tag?.leadAmount ?? item?.productPrice,
              totalleadAmount: tag?.totalleadAmount ?? item?.netAmount,
              nextDueAmount:
                tag?.nextDueAmount ??
                item?.actualproductPrice ??
                item?.productPrice ??
                0,
              totalnextDueAmount:
                tag?.totalnextDueAmount ??
                item?.actualNetAmount ??
                item?.netAmount ??
                0,
              leadTax: tag?.leadTax ?? tag?.hsn ?? item?.hsn,
              nextDueTax: tag?.nextDueTax ?? item?.actualHsn ?? item?.hsn,
              discountAmount: tag?.discountAmount ?? item?.discountAmount ?? 0,
              actualNetAmount: item?.netAmount
            }))
          : []
    console.log(item)
    console.log(normalizedTaggedData)
    const rowId = item?.rowId || createLeadRowId()
    if (!item?.rowId) {
      setSelectedLeadList((prev) =>
        prev.map((row, rowIndex) =>
          rowIndex === index ? { ...row, rowId } : row
        )
      )
    }

    setDetailsItem({ ...item, rowId })
    setDetailsIndex(index)
    setDetailsRowId(rowId)
    console.log("hhh")
    setDetailsForm({
      name: item?.productorServiceName || "",
      licenseNumber: item?.licenseNumber || "",
      softwareTrade: item?.softwareTrade || "",
      applicationDate: item?.applicationDate || "",
      status: item?.status || item?.isActive || "Running",
      nextDue: item?.nextDue || "",
      quantityUsers: item?.quantityUsers || "",
      productAmount: item?.actualNetAmount || 0,
      taggeddata: normalizedTaggedData,
      productType: item?.productorservicetype
    })
    console.log("Hh")
    console.log(showdetailsopen)
    setdetailsopen(true)
  }
  console.log(detailsForm)
  console.log(showdetailsopen)
  const tableRows = selectedleadlist || []
  console.log(tableRows)
  console.log(selectedCustomer)

  const handledownloadexcel = async () => {
    try {
      const companyId = "66f7b0b7ecbbc22fa88a9126"

      const response = await api.get("lead/export-branch-wise-product-usage", {
        params: { companyId },
        responseType: "blob"
      })

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      })

      const fileName = "Branch_Wise_Product_Usage_Report.xlsx"

      const url = window.URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = fileName

      document.body.appendChild(link)
      link.click()

      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error(error)

      toast.error("Failed to download Excel report.")
    }
  }
  console.log(modalloader)
  console.log(submitLoading)
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-[#ADD8E6]">
      <h1>abhida</h1>
      <button
        type="button"
        className="m-3 w-fit rounded bg-[#1B2A4A] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#243660]"
      >
        press
      </button>
      {(modalloader ||
        loadingState ||
        editloadingState ||
        productLoading ||
        usersLoading ||
        customerLoading ||
        submitLoading) && (
        <BarLoader
          cssOverride={{ width: "100%", height: "4px" }}
          color="#4A90E2"
        />
      )}
      <Breadcrumb items={Breadcrumblist} />

      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        <div
          className="mx-auto w-full max-w-4xl rounded bg-white shadow-xl"
          style={{
            opacity:
              productLoading || usersLoading || customerLoading ? 0.2 : 1,
            pointerEvents:
              productLoading || usersLoading || customerLoading
                ? "none"
                : "auto",
            transition: "opacity 0.3s ease-in-out"
          }}
        >
          {showmessage && (
            <PopUp
              isOpen={ispopupModalOpen}
              onClose={() => {
                setIspopupModalOpen(false)
                showpopupMessage("")
              }}
              message={showmessage}
            />
          )}
          {licenseloading && <FullScreenLoader text="Checking..." />}

          <form
            onSubmit={handleSubmitMain(onSubmit)}
            className="bg-white p-4"
            style={{ fontFamily: "'Segoe UI', sans-serif" }}
          >
            <div className="bg-white rounded-lg border border-gray-300 shadow-md overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-300">
                <div className="text-sm font-bold px-4 py-1 rounded border-2 text-red-600 border-red-500 bg-white">
                  {process === "Registration" ? "New Lead" : "Edit Lead"}
                </div>
                {/* <button
type="button"
onClick={handledownloadexcel}
>
convertexcel
</button> */}
              </div>

              <div className="p-3 md:p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.8fr)_auto] gap-3">
                  <div className="flex flex-col">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Customer Name
                    </label>
                    <div className="flex gap-2 items-stretch">
                      <div className="flex-1 min-w-0">
                        <Select
                          options={customerOptions}
                          isDisabled={isReadOnly}
                          value={
                            customerOptions.length > 0
                              ? (customerOptions.find(
                                  (o) => o.value === watchMain("customerName")
                                ) ?? null)
                              : null
                          }
                          getOptionLabel={(o) =>
                            `${o.label}-(${o.mobile})-(${o.license})`
                          }
                          getOptionValue={(o) => o._id}
                          filterOption={customFilter}
                          {...registerMain("customerName", {
                            required: "Customer is Required"
                          })}
                          onBlur={() => {
                            const selected = customerOptions.find(
                              (o) => o.value === watchMain("customerName")
                            )
                            if (selected)
                              setValueMain("customerName", selected.value)
                          }}
                          onChange={(sel) => {
                            console.log("hhh")
                            handleSelectedCustomer(sel)
                            console.log("uu")
                            setSelectedCustomer(sel)
                            console.log("hhhhhh")
                            setValueMain("customerName", sel.value, {
                              shouldValidate: true
                            })
                            setValueMain("netAmount", "")
                            setSelectedLicense(null)
                            console.log("hhhh")
                          }}
                          styles={{
                            control: (base, state) => ({
                              ...base,
                              backgroundColor: "#EEF2F8",
                              borderColor: "#D1D5DB",
                              minHeight: 34,
                              cursor: state.isDisabled
                                ? "not-allowed"
                                : "pointer",
                              opacity: state.isDisabled ? 1 : 1
                            }),
                            menuList: (base) => ({
                              ...base,
                              maxHeight: 200
                            })
                          }}
                          menuPortalTarget={document.body}
                          menuShouldScrollIntoView={false}
                          className="w-full"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenmodal()}
                        disabled={isReadOnly}
                        className={`bg-[#1B2A4A] hover:bg-[#243660] text-white text-xs font-bold px-4 rounded flex items-center justify-center ${
                          isReadOnly ? "cursor-not-allowed opacity-70" : ""
                        }`}
                      >
                        {Data ? "UPDATE CUSTOMER" : "NEW CUSTOMER"}
                      </button>
                      {Data && from !== "closedlead" && (
                        <button
                          type="button"
                          onClick={() => handleOpenmodal("NEW CUSTOMER")}
                          className="bg-[#1B2A4A] hover:bg-[#243660] text-white text-xs font-bold px-4 rounded flex items-center justify-center hover:cursor-pointer"
                        >
                          NEW CUSTOMER
                        </button>
                      )}
                    </div>
                    {errorsMain.customerName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errorsMain.customerName.message}
                      </p>
                    )}
                  </div>

                  <div className="flex md:justify-end items-end">
                    <select
                      {...registerMain("leadBranch")}
                      value={selectedBranch}
                      disabled={isReadOnly}
                      onChange={(e) => {
                        console.log(e.target.value)
                        setDuplicateWarning("")
                        setSelectedBranch(e.target.value)
                        console.log("hhh")
                        //           dispatch(setsliceselectedBranch(e.target.value))
                        // console.log("hhh")
                        setValueMain("customerName", "")
                        setSelectedCustomer(null)
                        setcustomerTableData([])
                        console.log(emptyRow)
                        setSelectedLeadList([{ ...emptyRow }])
                        setValueMain("netAmount", "")
                        setSelectedLicense(null)
                        resetMain({
                          customerName: "",
                          email: "",
                          phone: "",
                          mobile: "",
                          source: "",
                          partner: "",
                          allocationType: null,
                          dueDate: "",
                          remark: "",
                          taxableAmount: "",
                          taxAmount: "",
                          netAmount: "",
                          selfAllocation: false,
                          leadId: ""
                        })
                      }}
                      className={`border border-gray-300 rounded px-3 py-[6px] text-sm bg-[#1B2A4A] hover:bg-[#243660] text-white outline-none min-w-[140px]  ${isReadOnly ? "cursor-not-allowed" : "cursor-pointer "}`}
                    >
                      {companybranches?.map((b, i) => (
                        <option key={i} value={b._id}>
                          {b.branchName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* keep the rest of your JSX exactly as in your original file */}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Email id
                    </label>
                    <input
                      {...registerMain("email")}
                      disabled={isReadOnly}
                      placeholder="Email..."
                      className={`w-full border border-gray-300 rounded px-3 py-[7px] text-sm outline-none bg-[#EEF2F8] ${
                        isReadOnly ? "cursor-not-allowed opacity-70" : ""
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Phone Number
                    </label>
                    <input
                      {...registerMain("phone")}
                      disabled={isReadOnly}
                      placeholder="Landline..."
                      className={`w-full border border-gray-300 rounded px-3 py-[7px] text-sm outline-none bg-[#EEF2F8] ${
                        isReadOnly ? "cursor-not-allowed opacity-70" : ""
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Mobile Number
                    </label>
                    <input
                      {...mobileRegister}
                      readOnly={isReadOnly}
                      placeholder="Mobile..."
                      onChange={(e) => {
                        isMobileTypedByUser.current = true
                        mobileRegister.onChange(e)
                      }}
                      className={`w-full border border-gray-300 rounded px-3 py-[7px] text-sm outline-none bg-[#EEF2F8] ${
                        isReadOnly ? "cursor-not-allowed opacity-70" : ""
                      }`}
                    />
                    {duplicateWarning && (
                      <p className="mt-1 text-xs font-medium text-red-500">
                        {duplicateWarning}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Source of Lead
                    </label>
                    <select
                      disabled={isReadOnly}
                      {...registerMain("source", {
                        required: "Source is Required"
                      })}
                      className={`w-full border border-gray-300 rounded px-3 py-[7px] text-sm outline-none bg-[#EEF2F8] ${isReadOnly ? "cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <option value="">Select Source</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="Direct">Direct</option>
                      <option value="justDial">Just Dial</option>
                    </select>
                    {errorsMain.source && (
                      <p className="text-red-500 text-xs mt-1">
                        {errorsMain.source.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Associate with
                    </label>
                    <select
                      {...registerMain("partner", {
                        required: "Partnership is Required"
                      })}
                      disabled={isReadOnly}
                      className={`w-full border border-gray-300 rounded px-3 py-[7px] text-sm outline-none bg-[#EEF2F8] ${
                        isReadOnly
                          ? "cursor-not-allowed opacity-70"
                          : "cursor-pointer"
                      }`}
                    >
                      <option value="">Select Partner</option>
                      {partner?.map((p, i) => (
                        <option key={i} value={p._id}>
                          {p.partner}
                        </option>
                      ))}
                    </select>
                    {errorsMain.partner && (
                      <p className="text-red-500 text-xs mt-1">
                        {errorsMain.partner.message}
                      </p>
                    )}
                  </div>
                </div>

                {process === "Registration" && selfAllocation && showInput && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Allocation Type
                      </label>
                      <select
                        disabled={!isSelfAllocationChangable}
                        {...registerMain("allocationType", {
                          required: "Allocation type is required"
                        })}
                        className={`w-full border border-gray-300 rounded px-3 py-[7px] text-sm outline-none bg-[#EEF2F8] ${
                          !isSelfAllocationChangable
                            ? "cursor-not-allowed opacity-70"
                            : ""
                        }`}
                      >
                        <option value="followup">Followup</option>
                      </select>
                      {errorsMain.allocationType && (
                        <p className="text-red-500 text-xs mt-1">
                          {errorsMain.allocationType.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Due Date
                      </label>
                      <input
                        type="date"
                        {...registerMain("dueDate", {
                          required: "Due Date is required"
                        })}
                        className="w-full border border-gray-300 rounded px-3 py-[7px] text-sm outline-none bg-[#EEF2F8]"
                      />
                      {errorsMain.dueDate && (
                        <p className="text-red-500 text-xs mt-1">
                          {errorsMain.dueDate.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="border border-gray-300 rounded">
                  <table className="w-full border-collapse text-xs table-fixed">
                    <colgroup>
                      <col style={{ width: "22%" }} />
                      <col style={{ width: "22%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "12%" }} />
                      <col style={{ width: "15%" }} />
                      <col style={{ width: "7%" }} />
                      {isClosingFlow && <col style={{ width: "7%" }} />}
                    </colgroup>
                    <thead>
                      <tr className="bg-[#1B2A4A] text-white">
                        <th
                          rowSpan={2}
                          className="border border-blue-900 px-2 py-2 text-left text-xs"
                        >
                          Product / Service
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-blue-900 px-2 py-2 text-left text-xs"
                        >
                          License No
                        </th>
                        <th
                          colSpan={3}
                          className="border border-blue-900 px-2 py-2 text-center text-xs"
                        >
                          Price Details
                        </th>
                        <th
                          rowSpan={2}
                          className="border border-blue-900 px-2 py-2 text-center text-xs"
                        >
                          Action
                        </th>
                        {isClosingFlow && (
                          <th
                            rowSpan={2}
                            className="border border-blue-900 px-2 py-2 text-center text-xs"
                          >
                            Details
                          </th>
                        )}
                      </tr>
                      <tr className="bg-[#1B2A4A] text-white">
                        <th className="border border-blue-900 px-2 py-1 text-center text-xs">
                          Amount
                        </th>
                        <th className="border border-blue-900 px-2 py-1 text-center text-xs">
                          Tax %
                        </th>
                        <th className="border border-blue-900 px-2 py-1 text-center text-xs">
                          Net Amt
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {tableRows.map((item, index) => {
                        console.log(item)
                        const showLicenseDropdown =
                          String(
                            item?.productorservicetype || ""
                          ).toLowerCase() === "additionalservice"
                        console.log("jjj")
                        console.log(showLicenseDropdown)
                        const isAmountLocked =
                          isReadOnly || isRowPriceLocked(item)
                        console.log(isAmountLocked)
                        console.log(isReadOnly)
                        const isTaxLocked = isReadOnly || isRowPriceLocked(item)
                        console.log(isReadOnly)
                        console.log(isAmountLocked)
                        const a = isRowPriceLocked(item)
                        console.log(a)
                        const isPrimaryProduct =
                          String(
                            item?.productorservicetype || ""
                          ).toLowerCase() === "primaryproduct"
                        const isEnhancedService =
                          String(
                            item?.productorservicetype || ""
                          ).toLowerCase() === "enhancedservice"
                        console.log(item)
                        console.log(isPrimaryProduct)
                        const remainingAdditionalServicesCount =
                          isPrimaryProduct
                            ? getRemainingAdditionalServicesCount(item, index)
                            : 0
                        console.log(process)
                        console.log(remainingAdditionalServicesCount)
                        return (
                          <tr
                            key={item?.rowId || index}
                            className="border-b even:bg-blue-50 bg-white hover:bg-blue-50 transition-colors"
                          >
                            <td className="border border-gray-300 px-1 py-1">
                              <ProductDropdown
                                index={index}
                                item={item}
                                process={process}
                                from={from}
                                isReadOnly={isReadOnly}
                                leadList={leadList}
                                selectedleadlist={selectedleadlist}
                                setSelectedLeadList={setSelectedLeadList}
                                selectedBranch={selectedBranch}
                                selectedCustomer={selectedCustomer}
                                setTakenLicense={setTakenLicense}
                                setCustomerTableData={setcustomerTableData}
                                addTemporaryLicense={addTemporaryLicense}
                                removeTemporaryLicense={removeTemporaryLicense}
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              {showLicenseDropdown ? (
                                <LicenseDropdown
                                  key={`${index}-${item?.productorServiceId || "no-product"}`}
                                  index={index}
                                  item={item}
                                  isReadOnly={isReadOnly}
                                  customerTableData={customerTableData}
                                  selectedleadlist={selectedleadlist}
                                  setSelectedLeadList={setSelectedLeadList}
                                  setunselectedtaggedlicense={
                                    setunselectedtaggedlicense
                                  }
                                  setTakenLicense={setTakenLicense}
                                />
                              ) : (
                                <input
                                  value={item.licenseNumber}
                                  readOnly={isReadOnly}
                                  className={`py-1 border pl-2 rounded-md border-gray-500 w-full text-xs ${
                                    isReadOnly ? "cursor-not-allowed" : ""
                                  }`}
                                  onChange={(e) => {
                                    const licenseValue = e.target.value

                                    updateLicense(index, licenseValue)

                                    if (debounceTimersRef.current[index]) {
                                      clearTimeout(
                                        debounceTimersRef.current[index]
                                      )
                                    }

                                    debounceTimersRef.current[index] =
                                      setTimeout(async () => {
                                        await processLicenseChange(
                                          index,
                                          licenseValue,
                                          item
                                        )
                                        const currentValue =
                                          selectedleadlist[index]?.licenseNumber

                                        if (
                                          String(currentValue) !==
                                          String(licenseValue)
                                        ) {
                                          return
                                        }
                                        delete debounceTimersRef.current[index]
                                      }, 1000)
                                  }}
                                  placeholder="Enter License Number"
                                />
                              )}
                            </td>

                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="number"
                                readOnly={isAmountLocked}
                                value={item.productPrice}
                                onChange={(e) =>
                                  handlePriceChange(index, e.target.value)
                                }
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder="0.00"
                                className={`w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none text-right ${
                                  isAmountLocked
                                    ? "cursor-not-allowed bg-gray-100"
                                    : "bg-white"
                                } [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0`}
                              />
                            </td>

                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="number"
                                readOnly={isTaxLocked}
                                value={item.hsn}
                                onChange={(e) =>
                                  handleHsnChange(index, e.target.value)
                                }
                                onWheel={(e) => e.currentTarget.blur()}
                                placeholder="Tax"
                                className={`w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none text-center ${
                                  isTaxLocked
                                    ? "cursor-not-allowed bg-gray-100"
                                    : "bg-white"
                                } [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0`}
                              />
                            </td>

                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="text"
                                readOnly
                                value={item.netAmount}
                                placeholder="0.00"
                                className="w-full px-2 py-1 border border-gray-200 rounded text-xs outline-none text-right cursor-not-allowed bg-gray-100"
                              />
                            </td>

                            <td className="border border-gray-300 px-1 py-1 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {isPrimaryProduct &&
                                  isClosingFlow &&
                                  remainingAdditionalServicesCount > 0 && (
                                    <button
                                      type="button"
                                      disabled={isReadOnly}
                                      onClick={() =>
                                        addAdditionalServicesForPrimaryRow(
                                          item,
                                          index
                                        )
                                      }
                                      title={`Add ${remainingAdditionalServicesCount} additional service${
                                        remainingAdditionalServicesCount > 1
                                          ? "s"
                                          : ""
                                      }`}
                                      className="h-6 w-6 rounded-full bg-green-100 text-green-700 hover:bg-green-200 flex items-center justify-center font-bold text-sm"
                                    >
                                      +
                                    </button>
                                  )}

                                <button
                                  type="button"
                                  disabled={isReadOnly}
                                  onClick={() => {
                                    console.log(item)
                                    console.log(selectedleadlist)
                                    if (selectedleadlist.length === 1) return
                                    console.log("jjjjj")
                                    handleDeletetableData(item, index)
                                  }}
                                  className={`h-6 w-6 rounded-full flex items-center justify-center text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors ${
                                    isReadOnly
                                      ? "cursor-not-allowed opacity-30"
                                      : ""
                                  }`}
                                  title="Delete row"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-3.5 w-3.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                  >
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                            {(process === "closing" ||
                              from === "closedlead") &&
                              !isEnhancedService && (
                              <td className="border border-gray-300 px-1 py-1 text-center">
                                <div className="relative inline-block group">
                                  <button
                                    type="button"
                                    disabled={isReadOnly}
                                    onClick={() => handleDetails(item, index)}
                                    className={`ml-2 font-bold text-blue-500 ${
                                      isReadOnly
                                        ? "cursor-not-allowed"
                                        : "cursor-pointer"
                                    }`}
                                  >
                                    Add
                                  </button>
                                  {/* {warningErrors?.taggedlicenseError && (
                                    <div className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 hidden whitespace-nowrap rounded bg-red-500 px-2 py-1 text-[11px] text-white shadow-lg group-hover:block">
                                      {warningErrors.taggedlicenseError}
                                    </div>
                                  )} */}
                                  {unselectedtaggedlicense[
                                    item.productorServiceId
                                  ] && (
                                    <div className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 hidden whitespace-nowrap rounded bg-red-500 px-2 py-1 text-[11px] text-white shadow-lg group-hover:block">
                                      {
                                        unselectedtaggedlicense[
                                          item.productorServiceId
                                        ]
                                      }
                                    </div>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {warningMessage && (
                  <p className="text-red-500 text-sm mt-0">{warningMessage}</p>
                )}
                <div className="">
                  {Object.entries(takenLicenses).map(
                    ([productName, licenses]) => (
                      <div
                        key={productName}
                        className="rounded-xl border border-gray-200 bg-white p-1 shadow-sm"
                      >
                        {/* Product Name */}
                        <div className="flex">
                          <div className=" flex items-center gap-3 w-auto">
                            <div className="h-3 w-1 rounded-full bg-blue-600"></div>

                            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-800 ">
                              {productName}
                            </h2>
                          </div>

                          <div className="flex flex-wrap gap-3 ml-2">
                            {licenses.map((license) => (
                              <button
                                key={license}
                                type="button"
                                disabled
                                className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-0.5 text-sm font-medium text-gray-700 shadow-sm cursor-default min-w-[128px]"
                              >
                                <span className="h-3 w-3 rounded-full border-2 border-blue-600 flex items-center justify-center">
                                  <span className="h-1.5 w-1.5 rounded-full bg-blue-600"></span>
                                </span>

                                {license}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Remark
                    </label>
                    <textarea
                      {...registerMain("remark")}
                      rows={4}
                      disabled={isReadOnly}
                      placeholder="Remarks..."
                      className={`w-full border border-gray-300 rounded px-3 py-2 text-sm outline-none bg-[#EEF2F8] resize-none ${
                        isReadOnly ? "cursor-not-allowed opacity-70" : ""
                      }`}
                    />
                  </div>
                  <div className="flex flex-col gap-2 md:justify-end md:pt-5 w-64">
                    {[
                      {
                        label: "Taxable Amount",
                        field: "taxableAmount",
                        viewonly: true
                      },
                      {
                        label: "Tax Amount",
                        field: "taxAmount",
                        viewonly: true
                      },
                      ...(isClosingFlow
                        ? [
                            {
                              label: "Disc.Amount",
                              field: "discamnt",
                              viewonly: false
                            }
                          ]
                        : []),
                      {
                        label: "Net Amount",
                        field: "netAmount",
                        viewonly: true
                      }
                    ].map(({ label, field, viewonly }) => (
                      <div key={field} className="flex items-center">
                        <span className="text-xs font-bold text-white px-3 py-[7px] bg-[#1B2A4A] rounded-l w-[130px] text-right whitespace-nowrap flex-shrink-0">
                          {label}
                        </span>
                        <input
                          type="number"
                          {...registerMain(field)}
                          onFocus={(e) => {
                            if (field === "discamnt" && !haveprimaryProduct) {
                              console.log("hh")
                              const isInvalid = selectedleadlist.some(
                                (lead) =>
                                  !lead.taggeddata?.length ||
                                  lead.taggeddata.some(
                                    (tag) =>
                                      Number(tag.taxexclusiveAmount || 0) <= 0
                                  )
                              )
                              console.log(selectedleadlist)
                              if (isInvalid) {
                                console.log("hhh")
                                toast.warning(
                                  "Please tag a license and enter the Lead Amount in Details PopUp first."
                                )
                                e.target.blur() // Prevent editing
                              }
                            }
                          }}
                          onWheel={(e) => e.currentTarget.blur()}
                          onKeyDown={(e) => {
                            if (["-", "+", "e", "E"].includes(e.key)) {
                              e.preventDefault()
                            }
                          }}
                          readOnly={viewonly}
                          className={`flex-1 min-w-0 border border-gray-300 rounded-r px-3 py-[6px] text-sm text-right bg-white outline-none ${viewonly ? "cursor-not-allowed" : ""} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {validateError?.duplicate && (
                  <p className="text-red-500 text-xs">
                    {validateError.duplicate}
                  </p>
                )}
                {/* Self allocation / Lead Id + Lead by in same line */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 pt-2">
                  {/* left: self allocation or lead id */}
                  <div className="w-full sm:w-1/2">
                    {process === "Registration" && showInput ? (
                      <>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Self Allocation / Other
                        </label>

                        <select
                          disabled={!isSelfAllocationChangable}
                          {...registerMain("selfAllocation", {
                            setValueAs: (v) => v === "true",
                            validate: (v) =>
                              v === true || v === false
                                ? true
                                : "This field is required",
                            onChange: (e) => {
                              setValueMain("allocationType", "followup")
                              setselfAllocation(e.target.value === "true")
                            }
                          })}
                          defaultValue="false" // default is Allocate To Other
                          className={`w-full border border-gray-300 rounded px-3 py-[7px] text-sm outline-none bg-[#EEF2F8] ${
                            !isSelfAllocationChangable
                              ? "cursor-not-allowed opacity-70"
                              : "cursor-pointer"
                          }`}
                        >
                          {/* always allow 'Allocate To Other' */}
                          {canSelfAllocate && (
                            <option value="true">Self Allocate</option>
                          )}
                          <option value="false">Allocate To Other</option>
                        </select>
                        {errorsMain.selfAllocation && (
                          <p className="text-red-500 text-xs mt-1">
                            {errorsMain.selfAllocation.message}
                          </p>
                        )}
                      </>
                    ) : (
                      <>
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Lead Id
                        </label>
                        <input
                          {...registerMain("leadId")}
                          disabled
                          placeholder="Lead Id..."
                          className="w-full border border-gray-300 rounded px-3 py-[7px] text-sm outline-none bg-[#EEF2F8] cursor-not-allowed opacity-70"
                        />
                      </>
                    )}
                  </div>

                  {/* right: lead by */}
                  <div className="w-full sm:w-1/2 flex justify-start sm:justify-end">
                    {editMode ? (
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-gray-600 italic whitespace-nowrap">
                          Lead by:
                        </label>
                        <select
                          {...registerMain("leadBy")}
                          className="border border-gray-300 rounded px-2 py-1 text-sm bg-[#EEF2F8] outline-none"
                        >
                          {allstaff?.map((u) => (
                            <option key={u._id} value={u._id}>
                              {u.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <input type="hidden" {...registerMain("leadBy")} />
                        <p className="text-sm text-gray-500 whitespace-nowrap uppercase">
                          Lead by:{" "}
                          <span className="font-semibold text-[#1B2A4A]">
                            {Data && Data.length
                              ? Data[0]?.leadBy?.name
                              : loggeduser?.name}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-2">
                  <div>
                    {validateError?.emptyleadData && (
                      <p className="text-red-500 text-xs">
                        {validateError.emptyleadData}
                      </p>
                    )}
                    {validateError?.readonlyError && (
                      <p className="text-red-500 text-xs">
                        {validateError.readonlyError}
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={isReadOnly}
                      className={`bg-[#1B2A4A] hover:bg-[#243660] text-white py-2 px-8 rounded text-sm font-semibold tracking-wide transition-colors mt-1 ${isReadOnly ? "cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      {process === "Registration"
                        ? "SUBMIT LEAD"
                        : process === "closing"
                          ? "Closing Lead"
                          : "UPDATE LEAD"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {popupOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
              <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 shadow-sm">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 9v4m0 4h.01M10.29 3.86l-7.5 13A1 1 0 003.66 18h16.68a1 1 0 00.87-1.5l-7.5-13a1 1 0 00-1.74 0z"
                        />
                      </svg>
                    </div>

                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-slate-800">
                        Confirmation
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {popupMessage}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setPopupOpen(false)}
                      className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handlePopupOk}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/*new ui*/}
          {showdetailsopen && (
            <div className="fixed inset-0 z-[9999] bg-slate-950/60 backdrop-blur-[2px]">
              <div className="flex min-h-dvh items-end justify-center p-0 sm:items-center sm:p-4 lg:p-6">
                <div
                  role="dialog"
                  aria-modal="true"
                  className={`flex h-[94dvh] w-full flex-col overflow-hidden border border-slate-200 bg-white shadow-2xl sm:h-auto sm:max-h-[92dvh] sm:rounded-2xl transition-all ${
                    String(
                      detailsItem?.productorservicetype || ""
                    ).toLowerCase() === "primaryproduct"
                      ? "sm:max-w-xl"
                      : detailsForm?.taggeddata?.length > 0
                        ? haveprimaryProduct
                          ? "sm:max-w-2xl"
                          : "sm:max-w-4xl"
                        : "sm:max-w-2xl"
                  }`}
                >
                  {/* Header */}
                  <div className="sticky top-0 z-20 border-b border-slate-200 bg-[#1B2A4A] text-white">
                    <div className="flex items-start justify-between gap-3 px-5 py-4">
                      <div className="min-w-0">
                        <h2 className="text-base font-semibold leading-5">
                          {String(
                            detailsItem?.productorservicetype || ""
                          ).toLowerCase() === "primaryproduct"
                            ? "Primary Product Details"
                            : "Additional Service Details"}
                        </h2>
                        <p className="mt-1 text-[11px] leading-4 text-slate-300">
                          Update the selected item details
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setdetailsopen(false)}
                        aria-label="Close"
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-base text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
                      >
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto bg-slate-50">
                    <div className="space-y-4 p-4 sm:p-5">
                      {String(
                        detailsItem?.productorservicetype || ""
                      ).toLowerCase() === "primaryproduct" ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                          <h3 className="mb-4 text-sm font-semibold text-slate-800">
                            Product Information
                          </h3>

                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Name
                              </label>
                              <input
                                type="text"
                                name="name"
                                readOnly
                                value={detailsForm.name}
                                onChange={handleDetailsChange}
                                placeholder="List of Primary Products"
                                className="h-10 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 outline-none"
                              />
                            </div>

                            <div className="relative" ref={tradeDropdownRef}>
                              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Software Trade
                              </label>

                              <button
                                type="button"
                                onClick={() => setIsTradeOpen((prev) => !prev)}
                                className="flex h-10 w-full items-center justify-between rounded-lg border border-slate-300 bg-white px-3 text-left text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
                              >
                                <span
                                  className={
                                    detailsForm.softwareTrade
                                      ? "text-slate-800"
                                      : "text-slate-400"
                                  }
                                >
                                  {detailsForm.softwareTrade ||
                                    "Select Software Trade"}
                                </span>

                                <svg
                                  className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${
                                    isTradeOpen ? "rotate-180" : ""
                                  }`}
                                  viewBox="0 0 20 20"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path
                                    d="M5 7.5L10 12.5L15 7.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>

                              {isTradeOpen && (
                                <div className="absolute z-30 mt-1.5 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                                  <div className="max-h-56 overflow-y-auto p-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setDetailsForm((prev) => ({
                                          ...prev,
                                          softwareTrade: ""
                                        }))
                                        setIsTradeOpen(false)
                                      }}
                                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                                        !detailsForm.softwareTrade
                                          ? "bg-[#1B2A4A]/10 font-medium text-[#1B2A4A]"
                                          : "text-slate-700 hover:bg-slate-50"
                                      }`}
                                    >
                                      <span>Select Software Trade</span>
                                    </button>

                                    {softwareTrades.map((trade, index) => (
                                      <button
                                        key={index}
                                        type="button"
                                        onClick={() => {
                                          setDetailsForm((prev) => ({
                                            ...prev,
                                            softwareTrade: trade
                                          }))
                                          setIsTradeOpen(false)
                                        }}
                                        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                                          detailsForm.softwareTrade === trade
                                            ? "bg-[#1B2A4A]/10 font-medium text-[#1B2A4A]"
                                            : "text-slate-700 hover:bg-slate-50"
                                        }`}
                                      >
                                        <span>{trade}</span>
                                        {detailsForm.softwareTrade ===
                                          trade && (
                                          <svg
                                            className="h-4 w-4 text-[#1B2A4A]"
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                          >
                                            <path
                                              d="M5 10.5L8.5 14L15 7.5"
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                            />
                                          </svg>
                                        )}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            <div>
                              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Application Date
                              </label>
                              <input
                                type="date"
                                name="applicationDate"
                                value={detailsForm.applicationDate?.split("T")[0] || ""}
                                onChange={handleDetailsChange}
                                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
                              />
                            </div>

                            <div>
                              <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                Status
                              </label>
                              <select
                                name="status"
                                value={detailsForm.status}
                                onChange={handleDetailsChange}
                                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
                              >
                                <option value="Running">Active</option>
                                <option value="Deactive">DE active</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h3 className="mb-4 text-sm font-semibold text-slate-800">
                              Service Information
                            </h3>

                            {/* Product Name + Status (+ Next Due when no tagged rows) always sit side by side */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <div>
                                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                  Product Name
                                </label>
                                <input
                                  type="text"
                                  name="productName"
                                  readOnly
                                  value={detailsForm.name}
                                  onChange={handleDetailsChange}
                                  placeholder="List of additional service"
                                  className="h-10 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-500 outline-none"
                                />
                              </div>

                              {!detailsForm?.taggeddata?.length && (
                                <div>
                                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                    Next Due
                                  </label>
                                  <input
                                    type="date"
                                    name="nextDue"
                                    value={detailsForm.nextDue}
                                    onChange={handleDetailsChange}
                                    className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
                                  />
                                </div>
                              )}

                              <div>
                                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                                  Status
                                </label>
                                <select
                                  name="status"
                                  value={detailsForm.status}
                                  onChange={handleDetailsChange}
                                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
                                >
                                  <option value="Running">Active</option>
                                  <option value="Deactive">DE active</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {detailsForm?.taggeddata?.length ? (
                            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                              <div className="border-b border-slate-200 bg-white px-4 py-3">
                                <h3 className="text-sm font-semibold text-slate-800">
                                  Tagged License Due Details
                                </h3>
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                  {detailsForm.taggeddata.length} license
                                  {detailsForm.taggeddata.length > 1
                                    ? "s"
                                    : ""}{" "}
                                  tagged to this service
                                </p>
                              </div>

                              {/* table-fixed + percentage colgroup = width always matches the container, no horizontal scroll on laptop (12in / ~1024px+) */}
                              <div className="w-full">
                                <table className="w-full table-fixed border-collapse">
                                  <colgroup>
                                    {!haveprimaryProduct ? (
                                      <>
                                        <col style={{ width: "10%" }} />
                                        <col style={{ width: "5%" }} />
                                        <col style={{ width: "10%" }} />
                                        <col style={{ width: "6%" }} />
                                        <col style={{ width: "6%" }} />
                                        <col style={{ width: "6%" }} />
                                        <col style={{ width: "8%" }} />
                                        <col style={{ width: "6%" }} />
                                        <col style={{ width: "4%" }} />
                                      </>
                                    ) : (
                                      <>
                                        <col style={{ width: "19%" }} />
                                        <col style={{ width: "12%" }} />
                                        <col style={{ width: "18%" }} />
                                        <col style={{ width: "17%" }} />
                                        <col style={{ width: "16%" }} />
                                        <col style={{ width: "8%" }} />
                                      </>
                                    )}
                                  </colgroup>

                                  <thead className="bg-slate-100">
                                    <tr className="text-[10px] font-semibold uppercase leading-tight tracking-wide text-slate-500">
                                      <th className="border-b border-slate-200 px-2 py-2.5 text-center">
                                        License No.
                                      </th>
                                      <th className="border-b border-slate-200 px-1.5 py-2.5 text-center">
                                        Users
                                      </th>
                                      <th className="border-b border-slate-200 px-1.5 py-2.5 text-center">
                                        Serial No
                                      </th>

                                      {!haveprimaryProduct && (
                                        <>
                                          <th className="border-b border-slate-200 px-1.5 py-2.5 text-center">
                                            Lead Amt
                                          </th>
                                          <th className="border-b border-slate-200 px-1.5 py-2.5 text-center">
                                            {" "}
                                            Lead Tax
                                          </th>
                                          <th className="border-b border-slate-200 px-1.5 py-2.5 text-center">
                                            Discount
                                          </th>
                                        </>
                                      )}

                                      <th className="border-b border-slate-200 px-1.5 py-2.5 text-center">
                                        Next Due
                                      </th>
                                      <th className="border-b border-slate-200 px-1.5 py-2.5 text-center">
                                        Next Due Amt
                                      </th>
                                      <th className="border-b border-slate-200 px-1.5 py-2.5 text-center">
                                        Due Tax
                                      </th>
                                    </tr>
                                  </thead>

                                  <tbody className="divide-y divide-slate-100">
                                    {detailsForm.taggeddata.map(
                                      (tag, rowIndex) => (
                                        <tr
                                          key={`${tag?.licensenumber}-${rowIndex}`}
                                          className="align-top odd:bg-white even:bg-slate-50/60"
                                        >
                                          <td className="px-2 py-2">
                                            <input
                                              value={tag?.licensenumber || ""}
                                              readOnly
                                              title={tag?.licensenumber || ""}
                                              className="h-7 w-full cursor-not-allowed truncate rounded-md border border-slate-200 bg-slate-100 px-2 text-[11px] text-slate-500 outline-none"
                                            />
                                          </td>

                                          <td className="px-1.5 py-2">
                                            <input
                                              type="number"
                                              value={tag?.noofusers ?? ""}
                                              onChange={(e) => {
                                                handleTaggedDueChange(
                                                  rowIndex,
                                                  e.target.value,
                                                  "noofusers",
                                                  null,
                                                  detailsForm?.productType
                                                )
                                              }}
                                              onWheel={(e) =>
                                                e.currentTarget.blur()
                                              }
                                              className="h-7 w-full rounded-md border border-slate-200 bg-white px-1.5 text-center text-[11px] text-slate-700 outline-none transition focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A]/10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                            />
                                          </td>

                                          <td className="px-1.5 py-2">
                                            <input
                                              type="text"
                                              value={tag?.serialNumber || ""}
                                              onChange={(e) => {
                                                handleTaggedDueChange(
                                                  rowIndex,
                                                  e.target.value,
                                                  "serialNumber",
                                                  null,
                                                  detailsForm?.productType
                                                )
                                              }}
                                              onWheel={(e) =>
                                                e.currentTarget.blur()
                                              }
                                              className="h-7 w-full rounded-md border border-slate-200 bg-white px-1.5 text-right text-[11px] text-slate-700 outline-none transition focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A]/10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                            />
                                          </td>

                                          {!haveprimaryProduct && (
                                            <>
                                              <td className="px-1.5 py-2">
                                                <div className="space-y-0.5">
                                                  <input
                                                    type="number"
                                                    value={
                                                      tag?.taxexclusiveAmount ||
                                                      ""
                                                    }
                                                    onWheel={(e) =>
                                                      e.currentTarget.blur()
                                                    }
                                                    onKeyDown={(e) => {
                                                      if (
                                                        [
                                                          "-",
                                                          "+",
                                                          "e",
                                                          "E"
                                                        ].includes(e.key)
                                                      ) {
                                                        e.preventDefault()
                                                      }
                                                    }}
                                                    onChange={(e) => {
                                                      handleTaggedDueChange(
                                                        rowIndex,
                                                        e.target.value,
                                                        "taxexclusiveAmount",
                                                        tag?.originalHsn,
                                                        detailsForm?.productType
                                                      )
                                                    }}
                                                    className="h-7 w-full rounded-md border border-slate-200 bg-white px-1.5 text-right text-[11px] text-slate-700 outline-none transition focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A]/10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                  />
                                                  <p className="truncate text-right text-[12px] text-slate-600">
                                                    {Number(
                                                      tag?.taxinclusiveamount ||
                                                        0
                                                    ).toFixed(2)}
                                                  </p>
                                                </div>
                                              </td>

                                              <td className="px-1.5 py-2">
                                                <div className="flex justify-center pt-1">
                                                  <label className="inline-flex cursor-pointer items-center justify-center">
                                                    <input
                                                      type="checkbox"
                                                      checked={
                                                        Number(
                                                          tag?.leadTax || 0
                                                        ) > 0
                                                      }
                                                      onChange={(e) => {
                                                        handleTaggedDueChange(
                                                          rowIndex,
                                                          e.target.checked,
                                                          "leadTax",
                                                          e.target.checked
                                                            ? tag?.leadTax
                                                            : 0,
                                                          detailsForm?.productType
                                                        )
                                                      }}
                                                      className="sr-only"
                                                    />
                                                    <span
                                                      className={`flex h-5 w-5 items-center justify-center rounded border text-[11px] shadow-sm transition-all duration-200 ${
                                                        Number(
                                                          tag?.leadTax || 0
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

                                              <td className="px-1.5 py-2">
                                                <input
                                                  type="number"
                                                  value={
                                                    tag?.discountAmount || ""
                                                  }
                                                  onWheel={(e) =>
                                                    e.currentTarget.blur()
                                                  }
                                                  onKeyDown={(e) => {
                                                    if (
                                                      [
                                                        "-",
                                                        "+",
                                                        "e",
                                                        "E"
                                                      ].includes(e.key)
                                                    ) {
                                                      e.preventDefault()
                                                    }
                                                  }}
                                                  onChange={(e) => {
                                                    handleTaggedDueChange(
                                                      rowIndex,
                                                      e.target.value,
                                                      "discountAmount",
                                                      null,
                                                      detailsForm?.productType
                                                    )
                                                  }}
                                                  className="h-7 w-full rounded-md border border-slate-200 bg-white px-1.5 text-right text-[11px] text-slate-700 outline-none transition focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A]/10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                />
                                              </td>
                                            </>
                                          )}

                                          <td className="px-1.5 py-2">
                                            <input
                                              type="date"
                                              min={today}
                                              value={tag?.nextDue || ""}
                                              onChange={(e) => {
                                                const selectedDate =
                                                  e.target.value

                                                if (
                                                  selectedDate &&
                                                  selectedDate < today
                                                ) {
                                                  setwarningError((prev) => ({
                                                    ...prev,
                                                    nextduewarning: {
                                                      ...(prev.nextduewarning ||
                                                        {}),
                                                      [rowIndex]:
                                                        "Due date must be today or later."
                                                    }
                                                  }))
                                                  return
                                                }

                                                setwarningError((prev) => ({
                                                  ...prev,
                                                  nextduewarning: {
                                                    ...(prev.nextduewarning ||
                                                      {}),
                                                    [rowIndex]: ""
                                                  }
                                                }))

                                                handleTaggedDueChange(
                                                  rowIndex,
                                                  selectedDate,
                                                  "nextDue"
                                                )
                                              }}
                                              className={`h-7 w-full rounded-md border bg-white px-1.5 text-[11px] text-slate-700 outline-none transition ${
                                                warningErrors?.nextduewarning?.[
                                                  rowIndex
                                                ]
                                                  ? "border-red-400 focus:ring-1 focus:ring-red-100"
                                                  : "border-slate-200 focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A]/10"
                                              }`}
                                            />
                                            {warningErrors?.nextduewarning?.[
                                              rowIndex
                                            ] && (
                                              <p className="mt-1 text-[9px] leading-tight text-red-500">
                                                {
                                                  warningErrors.nextduewarning[
                                                    rowIndex
                                                  ]
                                                }
                                              </p>
                                            )}
                                          </td>

                                          <td className="px-1.5 py-2">
                                            <div className="space-y-0.5">
                                              <input
                                                type="number"
                                                value={tag?.nextDueAmount || ""}
                                                onWheel={(e) =>
                                                  e.currentTarget.blur()
                                                }
                                                onKeyDown={(e) => {
                                                  if (
                                                    [
                                                      "-",
                                                      "+",
                                                      "e",
                                                      "E"
                                                    ].includes(e.key)
                                                  ) {
                                                    e.preventDefault()
                                                  }
                                                }}
                                                onChange={(e) => {
                                                  handleTaggedDueChange(
                                                    rowIndex,
                                                    e.target.value,
                                                    "nextDueAmount",
                                                    tag?.originalHsn,
                                                    detailsForm?.productType
                                                  )
                                                }}
                                                className="h-7 w-full rounded-md border border-slate-200 bg-white px-1.5 text-right text-[11px] text-slate-700 outline-none transition focus:border-[#1B2A4A] focus:ring-1 focus:ring-[#1B2A4A]/10 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                              />
                                              <p className="truncate text-right text-[12px] text-slate-600">
                                                {Number(
                                                  tag?.totalnextDueAmount || 0
                                                ).toFixed(2)}
                                              </p>
                                            </div>
                                          </td>

                                          <td className="px-1.5 py-2">
                                            <div className="flex justify-center pt-1">
                                              <label className="inline-flex cursor-pointer items-center justify-center">
                                                <input
                                                  type="checkbox"
                                                  checked={
                                                    Number(
                                                      tag?.nextDueTax || 0
                                                    ) > 0
                                                  }
                                                  onChange={(e) => {
                                                    console.log(tag?.nextDueTax)
                                                    handleTaggedDueChange(
                                                      rowIndex,
                                                      e.target.checked,
                                                      "nextDueTax",
                                                      tag?.nextDueTax,
                                                      detailsForm?.productType
                                                    )
                                                  }}
                                                  className="sr-only"
                                                />
                                                <span
                                                  className={`flex h-5 w-5 items-center justify-center rounded border text-[11px] shadow-sm transition-all duration-200 ${
                                                    Number(tag?.nextDueTax) > 0
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
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
                              <h3 className="text-sm font-semibold text-slate-800">
                                Additional Service Details
                              </h3>
                              <p className="mt-1 text-[12px] text-slate-500">
                                No tagged license rows are available for this
                                item.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="sticky bottom-0 border-t border-slate-200 bg-white px-5 py-3.5">
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                      <button
                        type="button"
                        onClick={() => setdetailsopen(false)}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={handleDetailsSave}
                        className="inline-flex h-10 items-center justify-center rounded-lg bg-[#1B2A4A] px-5 text-sm font-semibold text-white transition hover:bg-[#243660] focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/40"
                      >
                        Save Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-3 sm:p-4">
              <div className="flex w-full max-w-4xl max-h-[88vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                {/* Header */}
                <div className="flex shrink-0 items-start justify-between border-b border-slate-200 bg-[#1B2A4A] px-5 py-3.5 sm:px-6">
                  <div>
                    <h2 className="text-sm font-semibold tracking-wide text-white sm:text-base">
                      {checknewcustomer
                        ? "Add New Customer"
                        : "Update Customer Details"}
                    </h2>
                    {!Data && (
                      <p className="mt-0.5 text-[11px] text-blue-200">
                        Fill in the details to register a new customer
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false)
                      clearmodalErros()
                      resetModal()
                    }}
                    className="rounded-full p-1.5 text-blue-200 transition hover:bg-white/10 hover:text-white"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Form */}
                <form
                  onSubmit={handleSubmitModal(onmodalsubmit)}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  {/* Scrollable body only */}
                  <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
                    <input
                      type="hidden"
                      {...registerModal("customerid")}
                      onBlur={(e) =>
                        setValueModal("customerid", e.target.value.trim())
                      }
                    />

                    <input
                      type="hidden"
                      {...registerModal("leadid")}
                      onBlur={(e) =>
                        setValueModal("leadid", e.target.value.trim())
                      }
                    />

                    {/* Basic Information */}
                    <div className="mb-4">
                      <p className="mb-2 border-b border-slate-200 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B2A4A]">
                        Basic Information
                      </p>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                            Customer Name
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            {...registerModal("customerName", {
                              required: "Customer Name is required"
                            })}
                            onBlur={(e) =>
                              setValueModal(
                                "customerName",
                                e.target.value.trim()
                              )
                            }
                            placeholder="Customer Name"
                            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
                          />
                          {errorsModal.customerName && (
                            <p className="mt-1 text-[11px] text-red-500">
                              {errorsModal.customerName.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                            Email
                          </label>
                          <input
                            type="email"
                            {...registerModal("email")}
                            placeholder="Email"
                            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                            Mobile <span className="text-red-500">*</span>
                          </label>
                          {/* <input
                            type="tel"
                            {...registerModal("mobile", {
                              required: "Mobile is Required",
                              validate: (value) => {
                                const cleaned = value
                                  .replace(/^\+?91/, "")
                                  .replace(/\D/g, "")
                                if (cleaned.length !== 10) {
                                  return "Must be 10 digits after country code"
                                }
                                return true
                              }
                            })}
                            onBlur={(e) =>
                              setValueModal("mobile", e.target.value.trim())
                            }
                            placeholder="Mobile"
                            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
                          /> */}
                          <input
                            type="tel"
                            {...registerModal("mobile", {
                              required: "Mobile is Required",

                              validate: (value) => {
                                const phone = String(value ?? "").trim()

                                if (!phone) {
                                  return "Mobile number is required"
                                }

                                const country =
                                  typeof selectedCountrymodal === "string"
                                    ? selectedCountrymodal.trim().toUpperCase()
                                    : selectedCountrymodal?.value
                                        ?.trim()
                                        ?.toUpperCase() ||
                                      selectedCountrymodal?.code
                                        ?.trim()
                                        ?.toUpperCase() ||
                                      ""

                                // Country selection is required for every number.
                                if (!country) {
                                  return "Select a country before entering a mobile number"
                                }

                                try {
                                  const parsed = phone.startsWith("+")
                                    ? parsePhoneNumberFromString(phone)
                                    : parsePhoneNumberFromString(phone, country)

                                  if (!parsed) {
                                    return `Enter a valid mobile number for ${country}`
                                  }

                                  if (!parsed.isPossible()) {
                                    return `Mobile number is too short or too long for ${country}`
                                  }

                                  if (!parsed.isValid()) {
                                    return `Enter a valid mobile number for ${country}`
                                  }

                                  // Ensures +91... cannot be accepted when user selected AE, US, etc.
                                  if (
                                    parsed.country &&
                                    parsed.country !== country
                                  ) {
                                    return `Mobile number does not match the selected country (${country})`
                                  }

                                  return true
                                } catch (error) {
                                  console.error("Mobile validation failed:", {
                                    phone,
                                    country,
                                    error: error?.message
                                  })

                                  return `Unable to validate the mobile number for ${country}`
                                }
                              }
                            })}
                            onBlur={(e) =>
                              setValueModal("mobile", e.target.value.trim())
                            }
                            placeholder="Mobile"
                            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
                          />
                          {duplicateWarning && (
                            <p className="mt-1 text-xs font-medium text-red-500">
                              {duplicateWarning}
                            </p>
                          )}
                          {errorsModal.mobile && (
                            <p className="mt-1 text-[11px] text-red-500">
                              {errorsModal.mobile.message}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                            Landline
                          </label>
                          <input
                            type="tel"
                            {...registerModal("landline")}
                            onBlur={(e) =>
                              setValueModal("landline", e.target.value.trim())
                            }
                            placeholder="Landline"
                            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                            Contact Person{" "}
                            <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            {...registerModal("contactPerson", {
                              required: "Contact person is Required"
                            })}
                            onBlur={(e) =>
                              setValueModal(
                                "contactPerson",
                                e.target.value.trim()
                              )
                            }
                            placeholder="Contact Person"
                            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
                          />
                          {errorsModal.contactPerson && (
                            <p className="mt-1 text-[11px] text-red-500">
                              {errorsModal.contactPerson.message}
                            </p>
                          )}
                        </div>

                        <div className="md:col-span-2">
                          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                            Address
                          </label>
                          <textarea
                            {...registerModal("address1")}
                            onBlur={(e) =>
                              setValueModal("address1", e.target.value.trim())
                            }
                            placeholder="Address"
                            rows={2}
                            className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none transition focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10 resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="mb-4">
                      <p className="mb-2 border-b border-slate-200 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B2A4A]">
                        Location
                      </p>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                            Country
                          </label>
                          <Controller
                            name="country"
                            control={controlModal}
                            render={({ field }) => (
                              <Select
                                options={countryOptions}
                                value={
                                  countryOptions.find(
                                    (opt) => opt.value === field.value
                                  ) || null
                                }
                                onChange={(option) =>
                                  field.onChange(option?.value || "")
                                }
                                getOptionLabel={(o) => o.label}
                                getOptionValue={(o) => o.value}
                              />
                            )}
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                            State
                          </label>
                          <Controller
                            name="state"
                            control={controlModal}
                            render={({ field }) => (
                              <Select
                                options={stateOptions}
                                value={
                                  stateOptions.find(
                                    (opt) => opt.value === field.value
                                  ) || null
                                }
                                onChange={(option) => {
                                  field.onChange(option?.value || "")
                                  setSelectedState(option)
                                }}
                                isDisabled={!selectedCountry}
                              />
                            )}
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                            City
                          </label>
                          <input
                            type="text"
                            {...registerModal("city")}
                            onBlur={(e) =>
                              setValueModal("city", e.target.value.trim())
                            }
                            placeholder="City"
                            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                            Pincode
                          </label>
                          <input
                            type="text"
                            {...registerModal("pincode")}
                            onBlur={(e) =>
                              setValueModal("pincode", e.target.value.trim())
                            }
                            placeholder="Pincode"
                            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Business Information */}
                    <div>
                      <p className="mb-2 border-b border-slate-200 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1B2A4A]">
                        Business Information
                      </p>

                      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                            Partnership Type
                          </label>
                          <select
                            {...registerModal("partner")}
                            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
                          >
                            <option value="">Select Partner</option>
                            {partner?.map((p, i) => (
                              <option key={i} value={p._id}>
                                {p.partner}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                            Registration Type
                          </label>
                          <select
                            {...registerModal("registrationType")}
                            className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
                          >
                            <option value="">Select Type</option>
                            <option value="unregistered">
                              Unregistered / Consumer
                            </option>
                            <option value="regular">Regular</option>
                          </select>
                        </div>

                        {registrationType === "regular" && (
                          <div>
                            <label className="mb-1 block text-[11px] font-semibold text-slate-600">
                              GSTIN / UIN{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              {...registerModal("gstNo", {
                                required: "GST is required"
                              })}
                              placeholder="e.g. 22AAAAA0000A1Z5"
                              className="h-10 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
                            />
                            {errorsModal.gstNo && (
                              <p className="mt-1 text-[11px] text-red-500">
                                {errorsModal.gstNo.message}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Fixed footer */}
                  <div className="flex shrink-0 items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-3 sm:px-6">
                    <button
                      type="button"
                      onClick={() => {
                        console.log("hhhhh")
                        setModalOpen(false)
                        clearmodalErros()
                        resetModal()
                        setchecknewcustomer(false)
                        console.log("hhh")
                      }}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="rounded-lg bg-[#1B2A4A] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#243660]"
                    >
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LeadMaster
