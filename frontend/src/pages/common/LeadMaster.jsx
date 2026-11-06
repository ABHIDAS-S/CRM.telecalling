import { useEffect, useState, useMemo, useRef, useLayoutEffect } from "react"
import { useLocation } from "react-router-dom"
import { createPortal } from "react-dom"
import { useSelector } from "react-redux"
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
import * as XLSX from "xlsx"
import FullScreenLoader from "../../components/common/FullScreenLoader"
// import { parse } from "path"
// ─────────────────────────────────────────────────────────────────────────────
// DropdownPortal — keeps dropdown aligned on scroll/resize
// ─────────────────────────────────────────────────────────────────────────────
function DropdownPortal({ anchorEl, children, matchWidth = false }) {
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
        width: matchWidth ? coords.width : undefined,
        minWidth: matchWidth ? coords.width : Math.max(coords.width, 220),
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
  const itemType = String(item?.productorservicetype || "").toLowerCase()
  const isMulti = itemType === "additionalservice"
  const isEnhancedService = itemType === "enhancedservice"

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const dropdownId = `license-dropdown-${index}`

  // Older closing records can keep the tag licence under `licensenumber`
  // while the dropdown uses `licenseNumber`. Normalise both sources so a
  // saved tag remains available and checked after a page refresh.
  const selectedLicenses = isMulti
    ? [...(item?.licenseNumbers || []), ...(item?.taggeddata || [])]
        .map((license) => ({
          ...license,
          licenseNumber: license?.licenseNumber ?? license?.licensenumber
        }))
        .filter(
          (license, licenseIndex, licenses) =>
            String(license?.licenseNumber || "").trim() &&
            licenseIndex ===
              licenses.findIndex(
                (candidate) =>
                  String(candidate?.licenseNumber || "") ===
                  String(license?.licenseNumber || "")
              )
        )
    : []

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
  // Include restored selected licences as dropdown options. The customer
  // option list can load after the lead, and otherwise the restored licence
  // value appears in the input but is absent from the menu.
  const licenseOptions = [
    ...(customerTableData || []),
    ...selectedLicenses.map((license) => ({
      ...license,
      productName:
        license?.productName ||
        license?.productorServiceName ||
        item?.productorServiceName || ""
    }))
  ].filter(
    (license, licenseIndex, licenses) =>
      String(license?.licenseNumber ?? license?.licensenumber ?? "").trim() &&
      licenseIndex ===
        licenses.findIndex(
          (candidate) =>
            String(candidate?.licenseNumber ?? candidate?.licensenumber ?? "") ===
            String(license?.licenseNumber ?? license?.licensenumber ?? "")
        )
  )

  const filtered = licenseOptions.filter((lic) => {
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
      licenseNumber: lic?.licenseNumber || "",
      ...(isEnhancedService
        ? { licenseNumbers: [], taggeddata: [] }
        : {})
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
                    ? selectedLicenses.some(
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

    const selectedBranchId = String(
      selectedBranch?._id || selectedBranch || ""
    )
    const branchdata = (prod?.selected || [])
      .filter(
        (entry) =>
          String(entry?.branch_id?._id || entry?.branch_id || "") ===
          selectedBranchId
      )
      .map((entry) => ({
        company_id: entry?.company_id?._id || entry?.company_id || "",
        branch_id: entry?.branch_id?._id || entry?.branch_id || ""
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

    const getRowId = (value) => {
      return String(value?._id || value?.id || value || "")
    }

    const base = selectedleadlist?.length
      ? [...selectedleadlist]
      : [{ ...emptyRow }]

    let updated = [...base]

    updated = updated.filter(
      (row, idx) => idx === index || !row?.isDefaultService
    )
    console.log("hhh")
    if (!prod) {
      console.log("hhh")
      clearPreviousTakenLicense(previousProductKey)
      // removeOldLicensesFromCustomerTable()

      updated[index] = {
        ...updated[index],
        productorServiceId: "",
        productorServiceName: "",
        itemType: "",
        productPrice: "",
        productorservicetype: "",
        hsn: "",
        netAmount: "",
        actualHsn: "",
        actualproductPrice: "",
        actualNetAmount: "",
        licenseNumber: "",
        licenseNumbers: [],
        company_id: "",
        branch_id: ""
      }

      setSearch("")
      setSelectedLeadList(updated)
      return
    }

    const filteredbranch = prod?.selected?.filter(
      (entry) =>
        String(entry?.branch_id?._id || entry?.branch_id || "") ===
        selectedBranchId
    )

    const igstRate = filteredbranch?.[0]?.hsn_id?.onValue?.igstRate
    const price = Number(prod?.productPrice || 0)
    const igst = Number(igstRate || 0)
    const rawNet = price + (igst / 100) * price
    const netAmount = Math.round(rawNet)

    clearPreviousTakenLicense(previousProductKey)
    console.log("hhhh")
    // removeOldLicensesFromCustomerTable()

    updated[index] = {
      ...updated[index],
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
    }

    if (prod?.defaultservices?.length > 0 && process === "closing") {
      const primaryId = getRowId(prod)

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
          licenseNumber: "",
          licenseNumbers: [],
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
          actualHsn: hsn,
          actualproductPrice: service?.productPrice,
          actualNetAmount,
          company_id: branchdata?.[0]?.company_id || "",
          branch_id: branchdata?.[0]?.branch_id || ""
        }
      })

      updated.splice(index + 1, 0, ...defaultServiceRows)
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
        title={search}
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

const createBulkProductRow = () => ({
  id: `bulk-product-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  productId: "",
  license: "",
  amount: "",
  tax: ""
})

// Bulk leads are saved in whole rupees. Keep the calculated amount shown in
// every bulk layout consistent with the value persisted by the API.
const calculateBulkNetAmount = (amount, tax) => {
  const price = Number(amount) || 0
  const taxRate = Number(tax) || 0
  return Math.round(price + (price * taxRate) / 100 + Number.EPSILON)
}

const createBulkCustomerRow = () => ({
  id: `bulk-customer-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  customerId: "",
  customerName: "",
  mobile: "",
  email: "",
  source: "",
  partner: "",
  products: [createBulkProductRow()]
})

const BulkLeadSelect = ({
  className = "",
  value,
  options = [],
  placeholder,
  disabled = false,
  onChange
}) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const selectedOption = options.find(
    (option) => String(option.value) === String(value)
  )
  const visibleOptions = options.filter((option) =>
    String(option.label || "")
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  )
  const isSearchable = options.length > 8

  useEffect(() => {
    if (!open) return undefined

    const closeOnOutsideClick = (event) => {
      if (
        !triggerRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick)
    document.addEventListener("touchstart", closeOnOutsideClick)
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick)
      document.removeEventListener("touchstart", closeOnOutsideClick)
    }
  }, [open])

  const chooseOption = (option) => {
    onChange?.({ target: { value: option.value } })
    setSearch("")
    setOpen(false)
  }

  return (
    <div className={`min-w-0 ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((current) => !current)}
        className={`flex min-h-7 w-full items-center gap-1.5 rounded-md border px-2 py-1 text-left text-[11px] font-medium outline-none transition ${
          open
            ? "border-[#1B2A4A] bg-white ring-2 ring-[#1B2A4A]/10"
            : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
        } disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className={`min-w-0 flex-1 break-words leading-tight ${selectedOption ? "text-slate-700" : "text-slate-400"}`}>
          {selectedOption?.label || placeholder}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`mt-0.5 h-3 w-3 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>

      {open && (
        <DropdownPortal anchorEl={triggerRef.current} matchWidth>
          <div
            ref={menuRef}
            role="listbox"
            className="overflow-hidden rounded-lg border border-slate-200 bg-white p-1 shadow-xl ring-1 ring-slate-950/5"
          >
            {isSearchable && (
              <div className="border-b border-slate-100 p-1 pb-2">
                <input
                  autoFocus
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search..."
                  className="h-7 w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-[11px] text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#1B2A4A] focus:bg-white"
                />
              </div>
            )}
            <div className="max-h-56 overflow-y-auto py-0.5">
              {selectedOption && placeholder && (
                <button
                  type="button"
                  onClick={() => chooseOption({ value: "" })}
                  className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-[11px] text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                >
                  Clear selection
                </button>
              )}
              {visibleOptions.length ? (
                visibleOptions.map((option) => {
                  const isSelected = String(option.value) === String(value)
                  return (
                    <button
                      key={option.optionId || option.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => chooseOption(option)}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] transition ${
                        isSelected
                          ? "bg-blue-50 font-semibold text-[#1B2A4A]"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="min-w-0 flex-1 break-words leading-tight">{option.label}</span>
                      {isSelected && <span className="text-xs text-[#1B2A4A]">✓</span>}
                    </button>
                  )
                })
              ) : (
                <p className="px-2 py-3 text-center text-[11px] text-slate-400">No matches found</p>
              )}
            </div>
          </div>
        </DropdownPortal>
      )}
    </div>
  )
}

const BulkLeadWorkspace = ({
  customers,
  setCustomers,
  expandedCustomerIds,
  setExpandedCustomerIds,
  productOptions = [],
  customerOptions = [],
  partners = [],
  commonValues,
  setCommonValues,
  isMarketingStaff,
  selectedBranch,
  branches = [],
  onBranchChange,
  onCreate,
  submitting,
  isReadOnly
}) => {
  const [isReviewOpen, setIsReviewOpen] = useState(false)
  const updateCustomer = (customerId, field, value) => {
    setCustomers((current) =>
      current.map((customer) =>
        customer.id === customerId ? { ...customer, [field]: value } : customer
      )
    )
  }

  const selectBulkCustomer = (customerId, selectedCustomerId) => {
    const selectedCustomer = customerOptions.find(
      (customer) => String(customer.value) === String(selectedCustomerId)
    )
    setCustomers((current) =>
      current.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              customerId: selectedCustomerId,
              customerName: selectedCustomer?.label || "",
              mobile: selectedCustomer?.mobile || "",
              email: selectedCustomer?.email || ""
            }
          : customer
      )
    )
  }

  const updateProduct = (customerId, productId, field, value) => {
    setCustomers((current) =>
      current.map((customer) =>
        customer.id === customerId
          ? {
              ...customer,
              products: customer.products.map((product) =>
                product.id === productId ? { ...product, [field]: value } : product
              )
            }
          : customer
      )
    )
  }

  const selectBulkProduct = (customerId, productId, selectedProductId) => {
    const selectedProduct = productOptions.find(
      (option) => String(option.value) === String(selectedProductId)
    )

    setCustomers((current) => {
      const isInitialProductSelection = !current.some((customer) =>
        customer.products.some((product) => product.productId)
      )
      const productValues = {
        productId: selectedProductId,
        amount: selectedProduct ? String(selectedProduct.amount) : "",
        tax: selectedProduct ? String(selectedProduct.tax) : ""
      }

      return current.map((customer) => {
        if (isInitialProductSelection) {
          return {
            ...customer,
            products: customer.products.map((product, index) =>
              index === 0 ? { ...product, ...productValues } : product
            )
          }
        }

        return customer.id === customerId
          ? {
              ...customer,
              products: customer.products.map((product) =>
                product.id === productId ? { ...product, ...productValues } : product
              )
            }
          : customer
      })
    })
  }

  const addCustomer = () => {
    setCustomers((current) => {
      if (current.length >= 100) return current

      const initiallySelectedProduct = current
        .flatMap((customer) => customer.products || [])
        .find((product) => product.productId)
      const nextCustomer = createBulkCustomerRow()

      if (initiallySelectedProduct) {
        nextCustomer.products = [
          {
            ...createBulkProductRow(),
            productId: initiallySelectedProduct.productId,
            amount: initiallySelectedProduct.amount,
            tax: initiallySelectedProduct.tax
          }
        ]
      }

      return [...current, nextCustomer]
    })
  }

  const removeCustomer = (customerId) => {
    if (customers.length === 1) return
    setCustomers((current) => current.filter((customer) => customer.id !== customerId))
  }

  const addProduct = (customerId) => {
    setCustomers((current) =>
      current.map((customer) =>
        customer.id === customerId
          ? { ...customer, products: [...customer.products, createBulkProductRow()] }
          : customer
      )
    )
  }

  const removeProduct = (customerId, productId) => {
    setCustomers((current) =>
      current.map((customer) => {
        if (customer.id !== customerId || customer.products.length === 1) return customer
        return {
          ...customer,
          products: customer.products.filter((product) => product.id !== productId)
        }
      })
    )
  }

  const bulkCustomerOptions = customerOptions.map((option) => ({
    value: option.value,
    optionId: option.optionId,
    license: option.license,
    label: `${option.label}${option.mobile ? ` - ${option.mobile}` : ""}${
      option.license ? ` - License: ${option.license}` : ""
    }`
  }))
  const duplicateProductSelections = useMemo(() => {
    const selections = new Map()

    customers.forEach((customer) => {
      const customerProducts = customer.products || []
      customerProducts.forEach((product) => {
        if (!customer.customerId || !product.productId) return
        const key = `${customer.customerId}:${product.productId}`
        const current = selections.get(key) || {
          customerName: customer.customerName || "Selected customer",
          productName:
            productOptions.find((option) => String(option.value) === String(product.productId))?.label ||
            "selected product",
          count: 0
        }
        selections.set(key, { ...current, count: current.count + 1 })
      })
    })

    return [...selections.values()].filter((selection) => selection.count > 1)
  }, [customers, productOptions])
  const duplicateProductKeys = useMemo(() => {
    const counts = new Map()
    customers.forEach((customer) => {
      ;(customer.products || []).forEach((product) => {
        if (!customer.customerId || !product.productId) return
        const key = `${customer.customerId}:${product.productId}`
        counts.set(key, (counts.get(key) || 0) + 1)
      })
    })
    return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key))
  }, [customers])
  const reviewRows = useMemo(() => customers.flatMap((customer, customerIndex) => {
    const mobile = String(customer.mobile || "").replace(/^\+?91/, "").replace(/\D/g, "")
    return (customer.products || [])
      .filter((product) => customer.customerId || customer.mobile || product.productId)
      .map((product, productIndex) => {
        const issues = []
        if (!customer.customerId) issues.push("Customer is required")
        if (!product.productId) issues.push("Product is required")
        if ((customer.customerId || customer.mobile) && mobile.length !== 10) issues.push("Valid 10-digit mobile is required")
        return {
          id: `${customer.id}:${product.id}`,
          label: `Row ${customerIndex + 1}${productIndex ? ` · Product ${productIndex + 1}` : ""}`,
          customerName: customer.customerName || "Customer not selected",
          productName: productOptions.find((option) => String(option.value) === String(product.productId))?.label || "Product not selected",
          duplicate: duplicateProductKeys.has(`${customer.customerId}:${product.productId}`),
          issues
        }
      })
  }), [customers, duplicateProductKeys, productOptions])
  const hasBlockingReviewIssue = reviewRows.some((row) => row.issues.length > 0)
  const invalidMobileCustomers = customers.filter((customer) => {
    const mobile = String(customer.mobile || "")
      .replace(/^\+?91/, "")
      .replace(/\D/g, "")
    return (customer.customerId || customer.mobile) && mobile.length !== 10
  })

  return (
    <section className="space-y-3 bg-slate-50 p-3 md:p-4">
      <div className="flex justify-end">
        <select
          value={selectedBranch || ""}
          disabled={isReadOnly}
          onChange={(event) => onBranchChange?.(event.target.value)}
          className="h-8 min-w-[150px] rounded-md border border-gray-300 bg-[#1B2A4A] px-3 text-xs font-semibold text-white outline-none transition hover:bg-[#243660] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {branches.map((branch) => (
            <option key={branch._id} value={branch._id}>
              {branch.branchName}
            </option>
          ))}
        </select>
      </div>
      <datalist id="bulk-lead-product-options">
        {productOptions.map((product) => (
          <option key={product.value} value={product.label} />
        ))}
      </datalist>
      <div className="space-y-2">
        {customers.map((customer, customerIndex) => {
          const mobile = String(customer.mobile || "")
            .replace(/^\+?91/, "")
            .replace(/\D/g, "")
          const isMobileInvalid = Boolean(customer.customerId || customer.mobile) && mobile.length !== 10
          const hasDuplicateProduct = (customer.products || []).some((product) =>
            duplicateProductKeys.has(`${customer.customerId}:${product.productId}`)
          )

          return (
          <article key={customer.id} className={`grid grid-cols-[minmax(0,1.65fr)_minmax(90px,.8fr)_minmax(0,1.5fr)_minmax(0,.9fr)_minmax(60px,.55fr)_minmax(45px,.45fr)_minmax(60px,.55fr)_auto] items-center gap-1.5 rounded-lg border bg-white p-2 shadow-sm ${hasDuplicateProduct ? "border-amber-300 bg-amber-50/30" : "border-slate-200"}`}>
            <div className="contents">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1B2A4A] text-[11px] font-bold text-white">{customerIndex + 1}</span>
                <BulkLeadSelect className="flex-1" value={customer.customerId} options={bulkCustomerOptions} placeholder="Select customer" disabled={isReadOnly} onChange={(event) => selectBulkCustomer(customer.id, event.target.value)} />
                {hasDuplicateProduct && <span title="Duplicate customer-product row. It will still be created after review." className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-500 text-[11px] font-bold text-white">!</span>}
              </div>
              <input
                value={customer.mobile || ""}
                disabled={isReadOnly}
                inputMode="numeric"
                aria-invalid={isMobileInvalid}
                onChange={(event) => updateCustomer(customer.id, "mobile", event.target.value)}
                placeholder="Mobile number"
                className={`h-7 min-w-0 rounded-md border bg-slate-50 px-2 text-[11px] font-medium text-slate-600 outline-none placeholder:text-slate-400 focus:bg-white focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 ${
                  isMobileInvalid
                    ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                    : "border-slate-200 focus:border-[#1B2A4A] focus:ring-[#1B2A4A]/10"
                }`}
              />
            </div>
            <div className="contents">
              {customer.products.map((product) => {
                const netAmount = calculateBulkNetAmount(product.amount, product.tax)
                return (
                  <div key={product.id} className="contents">
                    <div className={duplicateProductKeys.has(`${customer.customerId}:${product.productId}`) ? "rounded-md ring-1 ring-amber-400" : ""}><BulkLeadSelect value={product.productId} options={productOptions} placeholder="Product / Service" disabled={isReadOnly} onChange={(event) => selectBulkProduct(customer.id, product.id, event.target.value)} /></div>
                    <input value={product.license} disabled={isReadOnly} onChange={(event) => updateProduct(customer.id, product.id, "license", event.target.value)} placeholder="License No." className="h-7 min-w-0 rounded border border-slate-200 px-2 text-[11px] outline-none focus:border-[#1B2A4A]" />
                    <input type="number" min="0" value={product.amount} disabled={isReadOnly} onWheel={(event) => event.currentTarget.blur()} onChange={(event) => updateProduct(customer.id, product.id, "amount", event.target.value)} placeholder="Amount" className="h-7 min-w-0 rounded border border-slate-200 px-2 text-right text-[11px] outline-none focus:border-[#1B2A4A] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                    <input type="number" min="0" value={product.tax} disabled={isReadOnly} onWheel={(event) => event.currentTarget.blur()} onChange={(event) => updateProduct(customer.id, product.id, "tax", event.target.value)} placeholder="Tax %" className="h-7 min-w-0 rounded border border-slate-200 px-2 text-right text-[11px] outline-none focus:border-[#1B2A4A] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                    <div className="flex h-7 min-w-0 items-center justify-end rounded border border-slate-100 bg-slate-50 px-2 text-[11px] font-semibold text-slate-700">₹{netAmount}</div>
                    <div className="flex h-7 items-center gap-0.5">
                      <button type="button" disabled={isReadOnly || customers.length === 1} onClick={() => removeCustomer(customer.id)} className="h-7 rounded px-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40">Remove</button>
                    </div>
                  </div>
                )
              })}
            </div>
          </article>
          )
        })}
        <div className="flex justify-end pt-0.5">
          <button
            type="button"
            title="Add customer"
            aria-label="Add customer"
            disabled={isReadOnly || customers.length >= 100}
            onClick={addCustomer}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-[#1B2A4A] bg-white text-base font-bold text-[#1B2A4A] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
        {duplicateProductSelections.map((selection) => (
          <p
            key={`${selection.customerName}-${selection.productName}`}
            className="rounded-md border border-red-100 bg-red-50 px-2 py-1.5 text-[11px] font-medium text-red-600"
          >
            {selection.customerName} is selected {selection.count} times with {selection.productName}. Duplicate leads are allowed and will be highlighted during review.
          </p>
        ))}
        {invalidMobileCustomers.map((customer) => (
          <p
            key={`invalid-mobile-${customer.id}`}
            className="rounded-md border border-red-100 bg-red-50 px-2 py-1.5 text-[11px] font-medium text-red-600"
          >
            {customer.customerName || "Selected customer"} must have a valid 10-digit mobile number.
          </p>
        ))}
      </div>
      <div className={`grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm ${isMarketingStaff ? "md:grid-cols-[minmax(0,1fr)_minmax(340px,.62fr)_auto]" : "md:grid-cols-[minmax(0,1fr)_auto]"} md:items-end`}>
        <div className="min-w-0">
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Common Remark</label>
          <textarea value={commonValues.remark} disabled={isReadOnly} onChange={(event) => setCommonValues((current) => ({ ...current, remark: event.target.value }))} rows={2} placeholder="Remark for all selected leads..." className="h-[60px] w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#1B2A4A] focus:bg-white focus:ring-2 focus:ring-[#1B2A4A]/10" />
        </div>
        {isMarketingStaff && <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="min-w-0">
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Allocation</label>
            <BulkLeadSelect
              value={commonValues.selfAllocation}
              options={[
                { value: "false", label: "Allocate To Other" },
                { value: "true", label: "Self Allocate" }
              ]}
              disabled={isReadOnly}
              onChange={(event) => setCommonValues((current) => ({ ...current, selfAllocation: event.target.value }))}
            />
          </div>
          {commonValues.selfAllocation === "true" && (
            <div className="min-w-0">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-slate-500">Due Date</label>
              <input type="date" value={commonValues.dueDate} disabled={isReadOnly} onChange={(event) => setCommonValues((current) => ({ ...current, dueDate: event.target.value }))} className="h-7 w-full rounded-md border border-slate-200 bg-slate-50 px-2 text-xs text-slate-700 outline-none transition focus:border-[#1B2A4A] focus:bg-white focus:ring-2 focus:ring-[#1B2A4A]/10" />
            </div>
          )}
        </div>}
        <button type="button" disabled={isReadOnly || submitting || !reviewRows.length || (isReviewOpen && hasBlockingReviewIssue)} onClick={() => { if (isReviewOpen) { setIsReviewOpen(false); onCreate({ customers, commonValues }) } else { setIsReviewOpen(true) } }} className="h-8 whitespace-nowrap rounded-md bg-[#1B2A4A] px-4 text-xs font-bold text-white shadow-sm transition hover:bg-[#243660] focus:outline-none focus:ring-2 focus:ring-[#1B2A4A]/20 disabled:cursor-not-allowed disabled:opacity-50">
          {submitting ? "Creating..." : isReviewOpen ? `Create ${reviewRows.length} Lead${reviewRows.length === 1 ? "" : "s"}` : `Review ${reviewRows.length} Lead${reviewRows.length === 1 ? "" : "s"}`}
        </button>
      </div>
      <div className="hidden">
        <table className="min-w-[920px] w-full table-fixed text-xs">
          <thead className="bg-[#1B2A4A] text-white">
            <tr>
              <th className="w-10 px-1.5 py-2 text-center">#</th>
              <th className="w-[22%] px-2 py-2 text-left">Customer</th>
              <th className="w-[10%] px-2 py-2 text-left">Source</th>
              <th className="w-[13%] px-2 py-2 text-left">Associate with</th>
              <th className="w-[18%] px-2 py-2 text-left">Product / Service</th>
              <th className="w-[11%] px-2 py-2 text-left">License No.</th>
              <th className="w-[8%] px-2 py-2 text-right">Amount</th>
              <th className="w-[6%] px-2 py-2 text-right">Tax %</th>
              <th className="w-[8%] px-2 py-2 text-right">Net Amt</th>
              <th className="w-[6%] px-2 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {customers.flatMap((customer, customerIndex) =>
              customer.products.map((product, productIndex) => {
                const netAmount = calculateBulkNetAmount(product.amount, product.tax)
                const isFirstProduct = productIndex === 0
                return (
                  <tr key={product.id} className="border-t border-slate-200 align-top">
                    {isFirstProduct && (
                      <td rowSpan={customer.products.length} className="px-1.5 py-2 text-center font-bold text-slate-500">
                        {customerIndex + 1}
                      </td>
                    )}
                    {isFirstProduct && (
                      <td rowSpan={customer.products.length} className="p-1.5">
                        <select value={customer.customerId} disabled={isReadOnly} onChange={(event) => selectBulkCustomer(customer.id, event.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-1.5 text-[11px] outline-none focus:border-[#1B2A4A]">
                          <option value="">Select customer</option>
                          {bulkCustomerOptions.map((option) => (
                            <option key={option.optionId || option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                    {isFirstProduct && (
                      <td rowSpan={customer.products.length} className="p-1.5">
                        <select value={customer.source} disabled={isReadOnly} onChange={(event) => updateCustomer(customer.id, "source", event.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-1.5 text-[11px] outline-none focus:border-[#1B2A4A]">
                          <option value="">Select</option><option value="whatsapp">WhatsApp</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="Direct">Direct</option><option value="justDial">Just Dial</option>
                        </select>
                      </td>
                    )}
                    {isFirstProduct && (
                      <td rowSpan={customer.products.length} className="p-1.5">
                        <select value={customer.partner} disabled={isReadOnly} onChange={(event) => updateCustomer(customer.id, "partner", event.target.value)} className="h-7 w-full rounded border border-slate-200 bg-white px-1.5 text-[11px] outline-none focus:border-[#1B2A4A]">
                          <option value="">Select</option>{partners.map((partner) => <option key={partner._id} value={partner._id}>{partner.partner}</option>)}
                        </select>
                      </td>
                    )}
                    <td className="p-1.5"><input list="bulk-lead-product-options" value={product.product} disabled={isReadOnly} onChange={(event) => updateProduct(customer.id, product.id, "product", event.target.value)} placeholder="Search / Select Product" className="h-7 w-full rounded border border-slate-200 px-2 text-[11px] outline-none focus:border-[#1B2A4A]" /></td>
                    <td className="p-1.5"><input value={product.license} disabled={isReadOnly} onChange={(event) => updateProduct(customer.id, product.id, "license", event.target.value)} placeholder="License number" className="h-7 w-full rounded border border-slate-200 px-2 text-[11px] outline-none focus:border-[#1B2A4A]" /></td>
                    <td className="p-1.5"><input type="number" min="0" value={product.amount} disabled={isReadOnly} onChange={(event) => updateProduct(customer.id, product.id, "amount", event.target.value)} placeholder="0.00" className="h-7 w-full rounded border border-slate-200 px-1.5 text-right text-[11px] outline-none focus:border-[#1B2A4A]" /></td>
                    <td className="p-1.5"><input type="number" min="0" value={product.tax} disabled={isReadOnly} onChange={(event) => updateProduct(customer.id, product.id, "tax", event.target.value)} placeholder="Tax" className="h-7 w-full rounded border border-slate-200 px-1.5 text-right text-[11px] outline-none focus:border-[#1B2A4A]" /></td>
                    <td className="px-1.5 py-2 text-right font-semibold text-slate-700">{netAmount}</td>
                    <td className="p-1 text-center">
                      <div className="flex justify-center gap-0.5">
                        {isFirstProduct && <button type="button" disabled={isReadOnly} onClick={() => addProduct(customer.id)} title="Add product" className="rounded px-1.5 py-1 text-[#1B2A4A] hover:bg-blue-50 disabled:opacity-40">+</button>}
                        <button type="button" disabled={isReadOnly || customer.products.length === 1} onClick={() => removeProduct(customer.id, product.id)} title="Remove product" className="rounded px-1.5 py-1 text-red-600 hover:bg-red-50 disabled:opacity-40">⌫</button>
                        {isFirstProduct && <button type="button" disabled={isReadOnly || customers.length === 1} onClick={() => removeCustomer(customer.id)} title="Remove customer" className="rounded px-1.5 py-1 text-red-600 hover:bg-red-50 disabled:opacity-40">×</button>}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="hidden">
        {customers.map((customer, customerIndex) => {
          const expanded = expandedCustomerIds[customer.id] !== false
          const productCount = customer.products.filter((product) => product.product).length
          return (
            <article key={customer.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2">
                <button
                  type="button"
                  onClick={() => setExpandedCustomerIds((current) => ({ ...current, [customer.id]: !expanded }))}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1B2A4A] text-[11px] font-bold text-white">
                    {customerIndex + 1}
                  </span>
                  <span className="truncate text-xs font-bold text-slate-700">
                    {customer.customerName || "New customer"}
                  </span>
                  <span className="hidden text-[11px] text-slate-400 sm:inline">
                    {customer.mobile || "No mobile"} · {productCount} product{productCount === 1 ? "" : "s"}
                  </span>
                  <span className="ml-auto text-slate-500">{expanded ? "⌃" : "⌄"}</span>
                </button>
                <button
                  type="button"
                  disabled={isReadOnly || customers.length === 1}
                  onClick={() => removeCustomer(customer.id)}
                  className="rounded px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Remove
                </button>
              </div>

              {expanded && (
                <div className="space-y-3 p-3">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
                    <input
                      value={customer.customerName}
                      disabled={isReadOnly}
                      onChange={(event) => updateCustomer(customer.id, "customerName", event.target.value)}
                      placeholder="Customer name *"
                      className="h-9 rounded border border-slate-300 bg-white px-2.5 text-xs outline-none focus:border-[#1B2A4A] xl:col-span-1"
                    />
                    <input
                      value={customer.mobile}
                      disabled={isReadOnly}
                      onChange={(event) => updateCustomer(customer.id, "mobile", event.target.value)}
                      placeholder="Mobile *"
                      inputMode="numeric"
                      className="h-9 rounded border border-slate-300 bg-white px-2.5 text-xs outline-none focus:border-[#1B2A4A]"
                    />
                    <input
                      value={customer.email}
                      disabled={isReadOnly}
                      onChange={(event) => updateCustomer(customer.id, "email", event.target.value)}
                      placeholder="Email"
                      className="h-9 rounded border border-slate-300 bg-white px-2.5 text-xs outline-none focus:border-[#1B2A4A]"
                    />
                    <select
                      value={customer.source}
                      disabled={isReadOnly}
                      onChange={(event) => updateCustomer(customer.id, "source", event.target.value)}
                      className="h-9 rounded border border-slate-300 bg-white px-2.5 text-xs outline-none focus:border-[#1B2A4A]"
                    >
                      <option value="">Source *</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="instagram">Instagram</option>
                      <option value="facebook">Facebook</option>
                      <option value="Direct">Direct</option>
                      <option value="justDial">Just Dial</option>
                    </select>
                    <select
                      value={customer.partner}
                      disabled={isReadOnly}
                      onChange={(event) => updateCustomer(customer.id, "partner", event.target.value)}
                      className="hidden"
                    >
                      <option value="">Associate with</option>
                      {partners.map((partner) => (
                        <option key={partner._id} value={partner._id}>{partner.partner}</option>
                      ))}
                    </select>
                  </div>

                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-[720px] w-full table-fixed text-xs">
                      <thead className="bg-[#1B2A4A] text-white">
                        <tr>
                          <th className="w-[30%] px-2 py-2 text-left">Product / Service</th>
                          <th className="w-[20%] px-2 py-2 text-left">License No.</th>
                          <th className="w-[16%] px-2 py-2 text-right">Amount</th>
                          <th className="w-[12%] px-2 py-2 text-right">Tax %</th>
                          <th className="w-[16%] px-2 py-2 text-right">Net Amt</th>
                          <th className="w-[6%] px-2 py-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customer.products.map((product) => {
                          const netAmount = calculateBulkNetAmount(product.amount, product.tax)
                          return (
                            <tr key={product.id} className="border-t border-slate-200">
                              <td className="p-1.5"><input list="bulk-lead-product-options" value={product.product} disabled={isReadOnly} onChange={(event) => updateProduct(customer.id, product.id, "product", event.target.value)} placeholder="Search / Select Product" className="h-8 w-full rounded border border-slate-200 px-2 text-xs outline-none focus:border-[#1B2A4A]" /></td>
                              <td className="p-1.5"><input value={product.license} disabled={isReadOnly} onChange={(event) => updateProduct(customer.id, product.id, "license", event.target.value)} placeholder="License number" className="h-8 w-full rounded border border-slate-200 px-2 text-xs outline-none focus:border-[#1B2A4A]" /></td>
                              <td className="p-1.5"><input type="number" min="0" value={product.amount} disabled={isReadOnly} onChange={(event) => updateProduct(customer.id, product.id, "amount", event.target.value)} placeholder="0.00" className="h-8 w-full rounded border border-slate-200 px-2 text-right text-xs outline-none focus:border-[#1B2A4A]" /></td>
                              <td className="p-1.5"><input type="number" min="0" value={product.tax} disabled={isReadOnly} onChange={(event) => updateProduct(customer.id, product.id, "tax", event.target.value)} placeholder="Tax" className="h-8 w-full rounded border border-slate-200 px-2 text-right text-xs outline-none focus:border-[#1B2A4A]" /></td>
                              <td className="p-1.5 text-right font-semibold text-slate-700">{netAmount}</td>
                              <td className="p-1.5 text-center"><button type="button" disabled={isReadOnly || customer.products.length === 1} onClick={() => removeProduct(customer.id, product.id)} className="rounded px-2 py-1 text-red-600 hover:bg-red-50 disabled:opacity-40">⌫</button></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center justify-between">
                    <button type="button" disabled={isReadOnly} onClick={() => addProduct(customer.id)} className="rounded-md border border-[#1B2A4A] px-2.5 py-1.5 text-xs font-semibold text-[#1B2A4A] transition hover:bg-blue-50 disabled:opacity-50">+ Add product</button>
                    <span className="text-xs font-bold text-slate-700">Customer total: ₹{customer.products.reduce((total, product) => total + calculateBulkNetAmount(product.amount, product.tax), 0)}</span>
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
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
  selectedcompanyBranch,
  closingDraft = null,
  initialClosingRemark = "",
  onClosingDraftChange
}) => {
  console.log(process)
  console.log(Breadcrumblist)
  console.log(from)
  console.log(Data)
  if (Data == null) {
    console.log("hhh")
  }
  console.log(isReadOnly)

  const {
    register: registerMain,
    handleSubmit: handleSubmitMain,
    setValue: setValueMain,
    watch: watchMain,
    control: controlMain,
    reset: resetMain,
    getValues: getValuesMain,

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
  const loggeduserBranch = useSelector(
    (branch) => branch.companyBranch.loggeduserbranches
  )

  const [productOrserviceSelections, setProductorServiceSelections] = useState(
    {}
  )
  const mobileRegister = registerMain("mobile", {
    validate: (value) =>
      process !== "closing" || String(value || "").trim()
        ? true
        : "Mobile number is required to close the lead"
  })
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
  const [leadCreationMode, setLeadCreationMode] = useState("single")
  const [bulkLeadCustomers, setBulkLeadCustomers] = useState(() => [
    createBulkCustomerRow(),
    createBulkCustomerRow(),
    createBulkCustomerRow()
  ])
  const [expandedBulkCustomerIds, setExpandedBulkCustomerIds] = useState({})
  const [bulkCommonValues, setBulkCommonValues] = useState({
    remark: "",
    selfAllocation: "false",
    dueDate: ""
  })
  const hasPrimaryProductInLead = selectedleadlist.some(
    (lead) =>
      String(lead?.productorservicetype || "").toLowerCase() ===
      "primaryproduct"
  )
  const isClosingFlow = process === "closing" || from === "closedlead"
  console.log(selectedleadlist)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedLicense, setSelectedLicense] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [customerOptions, setCustomerOptions] = useState([])
  const [isleadForOpen, setIsleadForOpen] = useState(false)
  const [isLicenseOpen, setIslicenseOpen] = useState(false)
  const [branches, setBranches] = useState([])
  const [originalCustomerTableData, setOriginalCustomerTableData] = useState([])
console.log(originalCustomerTableData)
  const [temporaryCustomerTableData, setTemporaryCustomerTableData] = useState(
    []
  )
  const [customerTableData, setcustomerTableData] = useState([])
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
  const [tradeSearch, setTradeSearch] = useState("")
  const discountAmount = watchMain("discamnt")
  const tradeDropdownRef = useRef(null)
  const isFirstRender = useRef(true)
  const isMobileTypedByUser = useRef(false)
  const initialDetailsDiscountRef = useRef(0)
  // Existing leads store both the original row values and the discounted
  // document totals. Keep the saved totals during the initial hydration so
  // the discount is not applied to those totals a second time.
  const existingLeadTotalsRef = useRef(null)
  const isHydratingExistingLeadRef = useRef(false)
  const closingDraftRestoredRef = useRef(false)
  const closingDraftSaveReadyRef = useRef(false)
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
  const bulkProductOptions = useMemo(
    () =>
      (leadList || [])
        .map((item) => {
          const branchId = Array.isArray(selectedBranch)
            ? selectedBranch[0]
            : selectedBranch
          const branchSelection = item?.selected?.find(
            (selection) =>
              String(selection?.branch_id?._id || selection?.branch_id) ===
              String(branchId)
          )

          return {
            value: item?._id,
            label: item?.productName || item?.serviceName,
            amount: Number(item?.productPrice || 0),
            tax: Number(branchSelection?.hsn_id?.onValue?.igstRate || 0)
          }
        })
        .filter((item) => item.value && item.label),
    [leadList, selectedBranch]
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

  const filteredSoftwareTrades = softwareTrades.filter((trade) =>
    trade.toLowerCase().includes(tradeSearch.trim().toLowerCase())
  )

  const { data: alluser, loading: usersLoading } = UseFetch("/auth/getallUsers")
  const { data: partnerCustomers } = UseFetch("/customer/getPartnerCustomers")
  const {
    data: customerData,
    loading: customerLoading,
    refreshHook
  } = UseFetch(
    loggeduser &&
      selectedBranch &&
      `/customer/getallCustomer?branchSelected=${selectedBranch}`,
    { cacheTime: 5 * 60 * 1000 }
  )
  // Partner Selection uses customer records that are explicitly marked as
  // partners. The selected customer ID is stored separately on the lead.
  const partnerCustomerOptions = useMemo(
    () =>
      (Array.isArray(partnerCustomers) ? partnerCustomers : [])
        .filter((customer) => customer?.isPartner === true)
        .map((customer) => ({
          customerId: String(customer._id),
          value: String(customer._id),
          label: customer.customerName || "Unnamed partner",
          mobile: customer.mobile || ""
        })),
    [partnerCustomers]
  )
  // Track timers for each row index
  const debounceTimersRef = useRef({})
  console.log(selectedleadlist)
  const emptyRow = {
    licenseNumber: "",
    productorServiceId: "",
    productorServiceName: "",
    productPrice: "",
    hsn: "",
    netAmount: ""
  }

  const canSelfAllocate =
    loggeduser?.department?.code === "DEPARTMENT3" || console.log(loggeduser)
  const isMarketingStaff =
    String(loggeduser?.role || "").toLowerCase() === "staff" &&
    (loggeduser?.department?.code === "DEPARTMENT3" ||
      String(loggeduser?.department?.department || "")
        .toLowerCase()
        .includes("marketing"))
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
      setValueMain("partnerSelection", Data[0]?.partnerSelection || "")
      setValueMain("remark", Data[0].remark)
      setValueMain("discamnt", Data[0]?.discountAmount || 0)
      existingLeadTotalsRef.current = {
        taxableAmount: Data[0]?.taxableAmount,
        taxAmount: Data[0]?.taxAmount,
        netAmount: Data[0]?.netAmount
      }
      isHydratingExistingLeadRef.current = true
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
      const sourceLeadItems = Array.isArray(Data[0]?.leadFor)
        ? Data[0].leadFor
        : []
      const isClosedLeadEdit = from === "closedlead"
      const hasPrimaryProduct = sourceLeadItems.some(
        (item) =>
          String(item?.productorservicetype || "").toLowerCase() ===
          "primaryproduct"
      )
      const savedLeadDiscount = Number(Data[0]?.discountAmount || 0)
      const shouldRestoreDiscountedRows =
        (process === "edit" || process === "closing") &&
        savedLeadDiscount > 0
      const isHiddenAdditionalCharge = (item) =>
        isClosedLeadEdit &&
        hasPrimaryProduct &&
        String(item?.productorservicetype || "").toLowerCase() ===
          "additionalservice"
      const visibleLeadItems = sourceLeadItems
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => !isHiddenAdditionalCharge(item))
      const savedVisibleNetAmount = visibleLeadItems.reduce(
        (sum, { item }) => sum + (Number(item?.netAmount) || 0),
        0
      )
      // Edited leads persist line values after the lead discount is applied.
      // Rebuild their pre-discount table values proportionally so the table
      // total is the saved total plus the displayed lead discount.
      const restoredTableValues = new Map()
      if (shouldRestoreDiscountedRows && savedVisibleNetAmount > 0) {
        let restoredNetTotal = 0

        visibleLeadItems.forEach(({ item, index }, visibleIndex) => {
          const savedNetAmount = Number(item?.netAmount) || 0
          const isLastVisibleItem =
            visibleIndex === visibleLeadItems.length - 1
          const restoredNetAmount = isLastVisibleItem
            ? Number(
                (
                  savedVisibleNetAmount +
                  savedLeadDiscount -
                  restoredNetTotal
                ).toFixed(2)
              )
            : Number(
                (
                  savedNetAmount +
                  (savedNetAmount / savedVisibleNetAmount) *
                    savedLeadDiscount
                ).toFixed(2)
              )
          const taxRate = Number(item?.hsn ?? item?.actualHsn ?? 0)
          const restoredProductPrice =
            taxRate > 0
              ? Number((restoredNetAmount / (1 + taxRate / 100)).toFixed(2))
              : restoredNetAmount

          restoredNetTotal += restoredNetAmount
          restoredTableValues.set(index, {
            productPrice: restoredProductPrice,
            netAmount: restoredNetAmount
          })
        })
      }
      // `productPrice`, `hsn`, and `netAmount` are the amounts saved on the
      // lead. The `actual*` fields preserve the Product Master values from
      // when the row was selected, so they must only be used for legacy leads
      // that do not have a saved lead value.
      const savedLeadValueOrFallback = (leadValue, fallbackValue) =>
        leadValue !== undefined && leadValue !== null && leadValue !== ""
          ? leadValue
          : fallbackValue

      const leadData = sourceLeadItems.map((item, itemIndex) => {
        const hideAdditionalServiceCharge = isHiddenAdditionalCharge(item)
        const restoredValues = restoredTableValues.get(itemIndex)
        const leadTaggedData = Array.isArray(item?.taggeddata)
          ? item.taggeddata
          : []
        const taggeddata = leadTaggedData
        const leadLicenseNumbers = Array.isArray(item?.licenseNumbers)
          ? item.licenseNumbers
          : []
        const existingLicenseNumbers = leadLicenseNumbers.length
          ? leadLicenseNumbers
          : item?.licenseNumber
            ? [{ licenseNumber: item.licenseNumber }]
            : []
        const derivedLicenseNumbers = taggeddata
          .filter((tag) => tag?.licensenumber !== undefined && tag?.licensenumber !== null && String(tag.licensenumber).trim() !== "")
          .map((tag, sourceIndex) => ({
            licenseNumber: tag.licensenumber,
            productorServiceId: item?.productorServiceId?._id,
            productorServiceName:
              item?.productorServiceId?.productName ||
              item?.productorServiceId?.serviceName ||
              "",
            sourceIndex
          }))

        return {
          licenseNumber: item?.licenseNumber,
          licenseNumbers: [
            ...existingLicenseNumbers,
            ...derivedLicenseNumbers
          ].filter(
            (license, licenseIndex, licenses) =>
              licenseIndex ===
              licenses.findIndex(
                (candidate) =>
                  String(candidate?.licenseNumber ?? "") ===
                  String(license?.licenseNumber ?? "")
              )
          ),
          taggeddata,
          productorServiceName:
            item?.productorServiceId?.productName ||
            item?.productorServiceId?.serviceName,
          softwareTrade: item?.softwareTrade,
          applicationDate: item?.applicationDate,
          status: item?.status || item?.isActive,
          nextDue: item?.nextDue,
          noofusers: item?.noofusers,
          serialNumber: item?.serialNumber,
          productorServiceId: item?.productorServiceId?._id,
          itemType: item?.productorServicemodel,
          productPrice: hideAdditionalServiceCharge
            ? 0
            : (restoredValues?.productPrice ??
              savedLeadValueOrFallback(
                item?.productPrice,
                item?.actualproductPrice
              )),
          actualproductPrice: item?.actualproductPrice,
          hsn: hideAdditionalServiceCharge
            ? 0
            : savedLeadValueOrFallback(item?.hsn, item?.actualHsn),
          actualHsn: item?.actualHsn,
          netAmount: hideAdditionalServiceCharge
            ? 0
            : (restoredValues?.netAmount ??
              savedLeadValueOrFallback(item?.netAmount, item?.actualNetAmount)),
          actualNetAmount: item?.actualNetAmount,
          price: item?.price,
          company_id: item?.company_id,
          branch_id: item?.branch_id,
          productorservicetype: item?.productorservicetype
        }
      })
      console.log(leadData)
      const fetchedLicenses = leadData.flatMap((item) => {
        const licenses = item?.licenseNumbers?.length
          ? item.licenseNumbers
          : item?.licenseNumber
            ? [{ licenseNumber: item.licenseNumber }]
            : []
console.log(licenses)
        return licenses.map((license, licenseIndex) => ({
          licenseNumber: license?.licenseNumber,
          productName: item.productorServiceName,
          productorServiceName: item.productorServiceName,
          productorServiceId: item.productorServiceId,
          // `sourceIndex` is persisted as a Number.  The composite value
          // (`0-0`, `1-0`, …) was only a UI identifier and caused lead
          // closing to fail when it reached MongoDB.
          sourceIndex: Number.isFinite(Number(license?.sourceIndex))
            ? Number(license.sourceIndex)
            : licenseIndex
        }))
      })

      setOriginalCustomerTableData(fetchedLicenses)
      console.log(leadData)
      console.log(process)
      const ihaveprimaryproduct =
        leadData[0]?.productorservicetype === "Primaryproduct"
      if (
        process === "closing" &&
        leadData[0]?.productorservicetype === "Primaryproduct"
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
            return rows
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
            return rows
          }

          const newRows = servicesToAdd.map((service) => {
            const serviceId = getRowId(service)
            const igstRate = getBranchIgstRate(service)
            const productPrice = Number(service?.productPrice ?? 0)
            const taxAmount = (productPrice * igstRate) / 100
            const actualNetAmount = productPrice + taxAmount
            console.log(service)
            console.log(igstRate)
            console.log(productPrice)
            console.log(taxAmount)
            return {
              ...emptyRow,
              licenseNumber: "",
              licenseNumbers: [],
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

          return rows
        })
      } else {
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
  }, [customerOptions, Data, from])

  // A lead-closing page can safely be refreshed. Restore the in-progress
  // inputs only after the normal saved-lead hydration is complete, so the
  // supporting customer/product data still comes from the server.
  useEffect(() => {
    if (
      process !== "closing" ||
      closingDraftRestoredRef.current ||
      !closingDraft ||
      !Data?.length ||
      !customerOptions?.length ||
      !loggeduser
    ) {
      return
    }

    if (closingDraft.formValues && typeof closingDraft.formValues === "object") {
      resetMain({ ...getValuesMain(), ...closingDraft.formValues })
    }

    if (Array.isArray(closingDraft.selectedleadlist)) {
      setSelectedLeadList(closingDraft.selectedleadlist)
    }

    closingDraftRestoredRef.current = true
  }, [
    closingDraft,
    customerOptions,
    Data,
    getValuesMain,
    loggeduser,
    process,
    resetMain
  ])

  useEffect(() => {
    if (
      process === "closing" &&
      initialClosingRemark &&
      !closingDraft &&
      Data?.length
    ) {
      setValueMain("remark", initialClosingRemark)
    }
  }, [closingDraft, Data, initialClosingRemark, process, setValueMain])

  useEffect(() => {
    if (
      process === "closing" &&
      !closingDraftRestoredRef.current &&
      Data?.length &&
      customerOptions?.length &&
      loggeduser
    ) {
      // No previous draft exists, so the freshly hydrated saved lead becomes
      // the starting point for a new refresh-safe draft.
      closingDraftRestoredRef.current = true
    }
  }, [customerOptions, Data, loggeduser, process])

  // Keep a session-only snapshot while closing. It is intentionally not sent
  // to the server and disappears once the lead is successfully closed.
  useEffect(() => {
    if (
      process !== "closing" ||
      !onClosingDraftChange ||
      !closingDraftRestoredRef.current
    ) {
      return
    }

    if (!closingDraftSaveReadyRef.current) {
      closingDraftSaveReadyRef.current = true
      return
    }

    onClosingDraftChange({
      formValues: getValuesMain(),
      selectedleadlist
    })
  }, [
    getValuesMain,
    onClosingDraftChange,
    process,
    selectedleadlist
  ])

  useEffect(() => {
    if (
      process !== "closing" ||
      !onClosingDraftChange ||
      !closingDraftRestoredRef.current ||
      !closingDraftSaveReadyRef.current
    ) {
      return undefined
    }

    const subscription = watchMain((formValues) => {
      onClosingDraftChange({ formValues, selectedleadlist })
    })

    return () => subscription.unsubscribe()
  }, [onClosingDraftChange, process, selectedleadlist, watchMain])

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
  useEffect(() => {
    if (customerData && customerData.length && selectedBranch) {
      const primaryProductIds = new Set(
        (leadList || [])
          .filter(
            (product) =>
              String(product?.productorservicetype || "").toLowerCase() ===
              "primaryproduct"
          )
          .map((product) => String(product?._id || ""))
          .filter(Boolean)
      )

      const options = customerData.flatMap((item) => {
        const branchProducts = (item.selected || []).filter(
          (sel) => {
            const productId = String(
              sel?.product_id?._id || sel?.product_id || ""
            )
            const isPrimaryProduct =
              String(sel?.productorservicetype || "").toLowerCase() ===
                "primaryproduct" || primaryProductIds.has(productId)

            return (
              String(sel?.branch_id?._id || sel?.branch_id || "") ===
                String(selectedBranch || "") && isPrimaryProduct
            )
          }
        )
        const customerFields = {
          value: item?._id,
          label: item?.customerName,
          address: item?.address1,
          mobile: item?.mobile || "",
          email: item?.email,
          phone: item?.landline,
          partner: item?.partner,
          partnerSelection: item?.partnerSelection,
          country: item?.country,
          state: item?.state,
          registrationType: item?.registrationType,
          city: item?.city,
          pincode: item?.pincode,
          contactPerson: item?.contactPerson,
          selected: item?.selected
        }

        const productOptions = branchProducts.flatMap((sel, productIndex) => {
            const productName =
              sel?.productName ||
              sel?.productorServiceName ||
              sel?.product_id?.productName ||
              sel?.product_id?.serviceName ||
              "Unknown product"
            const licenses = [
              sel?.licensenumber,
              ...(sel?.licenseNumbers || []).map(
                (license) => license?.licenseNumber
              ),
              ...(sel?.taggeddata || []).map(
                (tag) => tag?.licensenumber ?? tag?.licenseNumber
              )
            ]

            const licenseDetails = licenses
              .filter(
                (license) =>
                  license !== null &&
                  license !== undefined &&
                  String(license).trim() !== ""
              )
              .map((license) => ({
                licenseNumber: String(license),
                productName
              }))
              .filter(
                (detail, detailIndex, details) =>
                  detailIndex ===
                  details.findIndex(
                    (candidate) =>
                      candidate.licenseNumber === detail.licenseNumber
                  )
              )

            const rows = licenseDetails.length
              ? licenseDetails
              : [{ licenseNumber: "", productName }]

            return rows.map((detail, licenseIndex) => ({
              ...customerFields,
              optionId: `${item?._id}-${sel?._id || sel?.product_id || productIndex}-${detail.licenseNumber || "no-license"}-${licenseIndex}`,
              license: detail.licenseNumber,
              productName: detail.productName,
              searchText: [
                item?.customerName,
                item?.mobile,
                detail.productName,
                detail.licenseNumber
              ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
            }))
          })

        // Lead Master should list only customers that have a primary product
        // for the selected branch; additional and enhanced services are not
        // customer-list entries in this flow.
        return productOptions
      })
      setCustomerOptions(options)
    }
  }, [customerData, leadList, selectedBranch])

  useEffect(() => {
    console.log("hhh")
    if (selectedCustomer) {
      console.log(selectedCustomer)
      setValueMain("mobile", selectedCustomer.mobile)
      setValueMain(
        "phone",
        selectedCustomer.phone || selectedCustomer.landline || ""
      )
      setValueMain("email", selectedCustomer.email)
      setValueMain(
        "partnerSelection",
        selectedCustomer?.partnerSelection?._id
          ? selectedCustomer?.partnerSelection?._id
          : selectedCustomer?.partnerSelection || ""
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
    if (isHydratingExistingLeadRef.current) {
      // Wait for the fetched rows to reach the table. The discount field is
      // set in the same hydration pass and can otherwise run this effect
      // before the rows are available.
      if (!selectedleadlist?.length) return

      const savedTotals = existingLeadTotalsRef.current
      if (savedTotals) {
        setValueMain("taxableAmount", savedTotals.taxableAmount ?? 0)
        setValueMain("taxAmount", savedTotals.taxAmount ?? 0)
        setValueMain("netAmount", savedTotals.netAmount ?? 0)
      }
      isHydratingExistingLeadRef.current = false
      return
    }

    const total = Number(calculateTotalAmount()) || 0
    const discount = Number(discountAmount) || 0
    const discountedNetAmount = Math.max(total - discount, 0)
    const discountFactor = total > 0 ? discountedNetAmount / total : 0
    const taxableAmount = Number(calculatetaxableAmount()) || 0
    const taxAmount = Number(calculatetaxAmount()) || 0

    console.log(discount)
    setValueMain("taxableAmount", (taxableAmount * discountFactor).toFixed(2))
    setValueMain("taxAmount", (taxAmount * discountFactor).toFixed(2))
    console.log(selectedleadlist)
    setValueMain("netAmount", discountedNetAmount.toFixed(2))
  }, [selectedleadlist, discountAmount])

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
  const updateLicense = (index, licenseNumber) => {
    console.log(licenseNumber)
    console.log(selectedleadlist)
    console.log(index)
    setSelectedLeadList((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              licenseNumber
            }
          : row
      )
    )
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
      const rowType = String(row?.productorservicetype || "").toLowerCase()

      // Stop when the next primary product starts
      if (rowType === "primaryproduct") break

      if (
        rowType === "additionalservice" &&
        getRowId(row?.parentPrimaryProductId) === getRowId(primaryProductId)
      ) {
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
          licenseNumber: "",
          licenseNumbers: [],
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
          company_id: service?.selected[0]?.company_id,
          branch_id: service?.selected[0]?.branch_id,
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
      return rows
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
          updatedRow.taxinclusiveamount = Math.round(
            Math.max(Number(value) + updatedtax - discount, 0)
          )
          return updatedRow
        }

        if (term === "nextDueAmount") {
          const updatedtax = row?.nextDueTax > 0 ? Number(hsn / 100) * value : 0
          updatedRow.nextDueAmount = value === "" ? "" : Number(value)
          updatedRow.totalnextDueAmount = Math.round(Number(value) + updatedtax)
          return updatedRow
        }

        if (term === "discountAmount") {
          const discountValue = value === "" ? 0 : Number(value)
          console.log(value)
          console.log(discountValue)
          console.log(currentTotalLeadAmount)

          const updatedTotal = Math.round(
            currentLeadAmount + Number(row?.leadTax / 100) * currentLeadAmount
          )
          if (discountValue > updatedTotal) {
            toast.warning(
              "Discount amount cannot be greater than the total amount."
            )
            return updatedRow
          }
          console.log(updatedTotal)
          updatedRow.discountAmount = discountValue
          updatedRow.taxinclusiveamount = Math.round(
            Math.max(updatedTotal - discountValue, 0)
          )
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

            updatedRow.taxinclusiveamount = Math.round(
              Math.max(currentLeadAmount + taxAmount - discount, 0)
            )
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
              Math.round(currentTotalNextDueAmount - taxAmount)
            )
          } else {
            const taxAmount = (originalHsn / 100) * currentNextDueAmount
            updatedRow.nextDueTax = originalHsn
            updatedRow.totalnextDueAmount = Math.round(
              currentNextDueAmount + taxAmount
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

  const syncAdditionalOnlyTaggedData = (
    row,
    rows,
    productPrice,
    taxRate,
    netAmount
  ) => {
    const isAdditionalOnly =
      String(row?.productorservicetype || "").toLowerCase() ===
        "additionalservice" &&
      !rows.some(
        (lead) =>
          String(lead?.productorservicetype || "").toLowerCase() ===
          "primaryproduct"
      )

    if (!isAdditionalOnly || !Array.isArray(row?.taggeddata)) {
      return row?.taggeddata
    }

    return row.taggeddata.map((tag) => ({
      ...tag,
      taxexclusiveAmount: productPrice,
      taxinclusiveamount: netAmount,
      productAmount: netAmount,
      leadAmount: productPrice,
      totalleadAmount: netAmount,
      leadTax: taxRate,
      originalHsn: taxRate
    }))
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
          netAmount,
          taggeddata: syncAdditionalOnlyTaggedData(
            product,
            prevList,
            price,
            igst,
            netAmount
          )
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
          netAmount,
          taggeddata: syncAdditionalOnlyTaggedData(
            product,
            prevList,
            price,
            igst,
            netAmount
          )
        }
      })
    )
  }

  const handleDeletetableData = (item, indexNum) => {
    console.log(item)
    console.log(takenLicenses)
    const productId = item.productorServiceId || item?.productId
    setunselectedtaggedlicense((prev) => {
      const updated = { ...prev }
      delete updated[productId]
      return updated
    })
    setTakenLicense((prev) => {
      const updated = { ...prev }

      const keyToDelete = Object.keys(updated).find(
        (key) => key.toLowerCase() === item.productorServiceName.toLowerCase()
      )

      if (keyToDelete) {
        delete updated[keyToDelete]
      }

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

    const filteredLeadlist = selectedleadlist.filter(
      (row, index) => index !== indexNum
    )
    setSelectedLeadList(
      filteredLeadlist.length ? filteredLeadlist : [{ ...emptyRow }]
    )
  }
  const customFilter = (option, inputValue) => {
    const searchValue = String(inputValue || "").trim().toLowerCase()
    // Keep the full compact list available on opening. This is friendlier for
    // users who prefer browsing, while the simplified option layout avoids
    // the expensive multi-license rendering used previously.
    if (!searchValue) return true
    const label = option.label ? String(option.label).toLowerCase() : ""
    const mobile = option.data?.mobile ? option.data?.mobile.toLowerCase() : ""
    const customerProducts = option.data?.searchText
      ? String(option.data.searchText).toLowerCase()
      : ""
    return (
      label.includes(searchValue) ||
      mobile.includes(searchValue) ||
      customerProducts.includes(searchValue)
    )
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
      partnerSelection: "",
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
            if (Number(productAmount) <= 0 && !hasPrimaryProductInLead) {
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
  // Existing-lead rows stay undiscounted in the table. This creates the
  // discounted copy used only by edit/closing save requests.
  const buildDiscountSynchronizedLeadData = (rows, leadDiscount) => {
    const roundAmount = (value) => Number((Number(value) || 0).toFixed(2))
    const typeOf = (item) =>
      String(item?.productorservicetype || "").toLowerCase()
    const discount = Math.max(0, roundAmount(leadDiscount))
    const copiedRows = rows.map((row) => ({
      ...row,
      taggeddata: Array.isArray(row?.taggeddata)
        ? row.taggeddata.map((tag) => ({ ...tag }))
        : row?.taggeddata
    }))
    const additionalOnly =
      copiedRows.length > 0 &&
      !copiedRows.some((row) => typeOf(row) === "primaryproduct") &&
      copiedRows.every((row) => typeOf(row) === "additionalservice")

    if (additionalOnly) {
      const entries = copiedRows.flatMap((row, rowIndex) =>
        (Array.isArray(row.taggeddata) ? row.taggeddata : []).map(
          (tag, tagIndex) => {
            const taxable = roundAmount(tag?.taxexclusiveAmount)
            const taxRate = Number(tag?.leadTax || 0)
            const undiscountedNetAmount = Math.round(
              taxable + (taxable * taxRate) / 100
            )
            const netAmount = roundAmount(
              undiscountedNetAmount || tag?.taxinclusiveamount || 0
            )
            return { rowIndex, tagIndex, taxable, netAmount }
          }
        )
      )
      const gross = roundAmount(
        entries.reduce((sum, entry) => sum + entry.netAmount, 0)
      )

      if (gross > 0 && entries.length) {
        let appliedDiscount = 0
        entries.forEach((entry, index) => {
          const tagDiscount =
            index === entries.length - 1
              ? roundAmount(Math.min(discount, gross) - appliedDiscount)
              : roundAmount((Math.min(discount, gross) * entry.netAmount) / gross)
          appliedDiscount = roundAmount(appliedDiscount + tagDiscount)
          const netAmount = Math.round(Math.max(entry.netAmount - tagDiscount, 0))
          const taxable = roundAmount(
            entry.netAmount > 0 ? (entry.taxable * netAmount) / entry.netAmount : 0
          )
          const tag = copiedRows[entry.rowIndex].taggeddata[entry.tagIndex]
          copiedRows[entry.rowIndex].taggeddata[entry.tagIndex] = {
            ...tag,
            taxexclusiveAmount: taxable,
            taxinclusiveamount: netAmount,
            productAmount: netAmount,
            leadAmount: taxable,
            totalleadAmount: netAmount,
            discountAmount: tagDiscount
          }
        })

        return copiedRows.map((row) => {
          const tags = Array.isArray(row.taggeddata) ? row.taggeddata : []
          const productPrice = roundAmount(
            tags.reduce((sum, tag) => sum + (Number(tag?.taxexclusiveAmount) || 0), 0)
          )
          const netAmount = roundAmount(
            tags.reduce((sum, tag) => sum + (Number(tag?.taxinclusiveamount) || 0), 0)
          )
          return {
            ...row,
            productPrice,
            netAmount,
            taxAmount: roundAmount(netAmount - productPrice)
          }
        })
      }
    }

    const discountableRows = copiedRows.filter(
      (row) => typeOf(row) !== "enhancedservice" && Number(row?.netAmount) > 0
    )
    const gross = roundAmount(
      discountableRows.reduce((sum, row) => sum + (Number(row?.netAmount) || 0), 0)
    )
    let appliedDiscount = 0
    let rowIndex = 0

    return copiedRows.map((row) => {
      if (typeOf(row) === "enhancedservice" || Number(row?.netAmount) <= 0 || gross <= 0) {
        return row
      }
      const originalNetAmount = roundAmount(row.netAmount)
      const originalProductPrice = roundAmount(row.productPrice)
      const rowDiscount =
        rowIndex === discountableRows.length - 1
          ? roundAmount(Math.min(discount, gross) - appliedDiscount)
          : roundAmount((Math.min(discount, gross) * originalNetAmount) / gross)
      rowIndex += 1
      appliedDiscount = roundAmount(appliedDiscount + rowDiscount)
      const netAmount = roundAmount(Math.max(originalNetAmount - rowDiscount, 0))
      const productPrice = roundAmount(
        originalNetAmount > 0
          ? (originalProductPrice * netAmount) / originalNetAmount
          : 0
      )

      return {
        ...row,
        productPrice,
        netAmount,
        taxAmount: roundAmount(netAmount - productPrice)
      }
    })
  }

  const handleBulkBranchChange = (branchId) => {
    if (!branchId || String(branchId) === String(selectedBranch)) return

    setSelectedBranch(branchId)
    setValueMain("leadBranch", branchId)
    setDuplicateWarning("")
    setCustomerOptions([])
    setLeadList([])
    setBulkLeadCustomers([
      createBulkCustomerRow(),
      createBulkCustomerRow(),
      createBulkCustomerRow()
    ])
    setBulkCommonValues({ remark: "", selfAllocation: "false", dueDate: "" })
  }

  const downloadBulkSkippedLeadReport = (skippedRows = []) => {
    if (!skippedRows.length) return

    const reportRows = skippedRows.map((row) => ({
      "Bulk Row": row.row || "",
      Customer: row.customerName || "",
      "Mobile Number": row.mobile || "",
      "Product / Service": row.productName || "",
      Reason: row.reason || "Lead was not created"
    }))
    const worksheet = XLSX.utils.json_to_sheet(reportRows)
    worksheet["!cols"] = [
      { wch: 10 },
      { wch: 28 },
      { wch: 18 },
      { wch: 32 },
      { wch: 58 }
    ]
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Not Created")
    XLSX.writeFile(workbook, "Bulk_Leads_Not_Created.xlsx")
  }

  const handleBulkLeadCreate = async ({ customers, commonValues }) => {
    if (!isMarketingStaff) {
      toast.error("Bulk lead creation is available only to Marketing staff")
      return
    }

    const branchId = Array.isArray(selectedBranch)
      ? selectedBranch[0]
      : selectedBranch
    const leads = customers
      .filter((customer) =>
        customer.customerId ||
        customer.mobile ||
        (customer.products || []).some((product) => product.productId)
      )
      .map((customer) => ({
        customerId: customer.customerId,
        mobile: String(customer.mobile || "").replace(/^\+?91/, "").replace(/\D/g, ""),
        source: "Direct",
        products: (customer.products || []).map((product) => ({
          productId: product.productId,
          productName: bulkProductOptions.find(
            (option) => String(option.value) === String(product.productId)
          )?.label || "",
          license: product.license,
          amount: product.amount,
          tax: product.tax
        }))
      }))

    if (!branchId || !leads.length) {
      toast.warning("Select at least one customer and product for bulk lead creation.")
      return
    }

    const selfAllocation = isMarketingStaff && commonValues.selfAllocation === "true"
    if (selfAllocation && !commonValues.dueDate) {
      toast.warning("Select a due date for self allocation.")
      return
    }

    setsubmitLoading(true)
    try {
      const response = await api.post("/lead/bulkLeadRegister", {
        leadBranch: branchId,
        leads,
        remark: commonValues.remark,
        selfAllocation,
        dueDate: selfAllocation ? commonValues.dueDate : null
      })
      toast.success(response.data?.message || "Bulk leads created successfully")
      if (response.data?.skipped?.length) {
        toast.warning(`${response.data.skipped.length} row(s) were skipped.`, {
          autoClose: 5000
        })
        downloadBulkSkippedLeadReport(response.data.skipped)
      }
      setBulkLeadCustomers([
        createBulkCustomerRow(),
        createBulkCustomerRow(),
        createBulkCustomerRow()
      ])
      setBulkCommonValues({ remark: "", selfAllocation: "false", dueDate: "" })
    } catch (error) {
      const skippedRows = error.response?.data?.skipped || []
      if (skippedRows.length) {
        downloadBulkSkippedLeadReport(skippedRows)
        toast.warning(`No lead was created. Downloaded a report for ${skippedRows.length} skipped row(s).`, {
          autoClose: 5000
        })
      } else {
        toast.error(error.response?.data?.message || "Unable to create bulk leads")
      }
    } finally {
      setsubmitLoading(false)
    }
  }

  const onSubmit = async (data) => {
    console.log(data)
    console.log(duplicateWarning)
    if (duplicateWarning) return
    if (submitLoading) return
    setsubmitLoading(true)
    if (duplicateWarning) return
    const submitData = { ...data }
    const synchronizedLeadData = buildDiscountSynchronizedLeadData(
      selectedleadlist,
      submitData.discamnt
    )

    if (!selfAllocation) {
      delete submitData.allocationType
      delete submitData.dueDate
    }
    try {
      if (hasDuplicateLeadRows(selectedleadlist)) {
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
        const filteredleadlist = selectedleadlist.filter(
          (item) => item.productorServiceId && item.productorServiceId !== ""
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
      } else if (process === "edit") {
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
          { ...submitData, discountSynchronized: true },
          synchronizedLeadData,
          Data[0]?._id,
          from,
          previousLeadCustomer,
          isCustomerChanged
        )
      } else if (process === "closing") {
        const validationMessage = validateSelectedLeadList(selectedleadlist)
        console.log(validationMessage)
        if (validationMessage) {
          // Missing data in any product/service detail popup is a normal
          // client-side validation error. Keep the lead in the closing page
          // and tell the user exactly what to complete; do not reverse the
          // follow-up unless the completed close request itself fails.
          toast.warning(validationMessage)
          return
        }

        console.log(selectedleadlist)
        console.log(loggeduser)
        console.log(data)

        seteditLoadingState(true)
        const updated = await handleclosingData(
          { ...submitData, discountSynchronized: true },
          synchronizedLeadData,
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
    const filteredleadlist = selectedleadlist.filter(
      (item) => item.productorServiceId && item.productorServiceId !== ""
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
            productAmount: tag?.totalnextDueAmount, //tax inclusive if have tax
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
    console.log(detailsForm)
    const totaldiscount = cleanedTaggedData.reduce((sum, item) => {
      const amount = Number(item?.discountAmount) || 0

      return sum + amount
    }, 0)
    console.log(cleanedTaggedData)
    console.log(selectedleadlist)
    console.log(detailsForm)
    setSelectedLeadList((prev) =>
      prev.map((row, i) => {
        if (i !== detailsIndex) return row

        if (itemType === "additionalservice") {
          const hasTaggedLicenses = cleanedTaggedData.length > 0

          return {
            ...row,
            applicationDate: detailsForm.applicationDate,
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
          ...row,
          applicationDate: detailsForm.applicationDate,
          softwareTrade: detailsForm.softwareTrade,
          status: detailsForm.status,
          isActive: detailsForm.status
        }
      })
    )

    // A primary-product details popup does not manage the lead discount.
    // For an additional service, apply only the change made in this popup so
    // an untouched tagged discount cannot overwrite the lead-level discount.
    if (itemType === "additionalservice") {
      const discountDifference = Number(
        (totaldiscount - initialDetailsDiscountRef.current).toFixed(2)
      )
      if (discountDifference !== 0) {
        const currentLeadDiscount = Number(discountAmount || 0)
        setValueMain(
          "discamnt",
          Math.max(0, currentLeadDiscount + discountDifference).toFixed(2)
        )
      }
    }
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
  const handleDetails = (row, index) => {
    const item = selectedleadlist[index] || row
    const applicationDateValue = item?.applicationDate
      ? String(item.applicationDate).slice(0, 10)
      : ""
    console.log("k")
    console.log(selectedCustomer)
    console.log(item)
    console.log(leadList)
    const productId = item.productorServiceId
    if (item?.productorservicetype === "Additionalservice") {
      // A saved additional service can carry its selected licence either in
      // `licenseNumbers` (newer records) or `taggeddata` (older/existing
      // records). The dropdown already renders both as checked, so the
      // details popup must accept both as a valid tag as well.
      const hasTaggedLicense = [
        ...(Array.isArray(item?.licenseNumbers) ? item.licenseNumbers : []),
        ...(Array.isArray(item?.taggeddata) ? item.taggeddata : [])
      ].some((license) => {
        const licenseNumber = license?.licenseNumber ?? license?.licensenumber
        return (
          licenseNumber !== null &&
          licenseNumber !== undefined &&
          String(licenseNumber).trim() !== ""
        )
      })

      if (!hasTaggedLicense) {
        setunselectedtaggedlicense((prev) => ({
          ...prev,
          [productId]: "Please tag any of the license"
        }))
        return
      }

      setunselectedtaggedlicense((prev) => {
        const updated = { ...prev }
        delete updated[productId]
        return updated
      })
    }

    const isAdditionalService =
      String(item?.productorservicetype || "").toLowerCase() ===
      "additionalservice"
    console.log(isAdditionalService)
    console.log(item)
    console.log(selectedCustomer)
    console.log(item?.productorServiceId)
    const itemProductId = String(
      item?.productorServiceId?._id ?? item?.productorServiceId ?? ""
    )
    const selectedCustomerId = String(
      selectedCustomer?._id ?? selectedCustomer?.value ?? ""
    )
    const customerWithProducts = Array.isArray(selectedCustomer?.selected)
      ? selectedCustomer
      : allcustomer?.find(
          (customer) => String(customer?._id ?? "") === selectedCustomerId
        )
    const filteredproduct =
      customerWithProducts?.selected?.filter(
        (it) =>
          String(it?.product_id?._id ?? it?.product_id ?? "") ===
          itemProductId
      ) || []
    console.log(filteredproduct)
    console.log(item?.productorServiceId)
    const a = leadList.map((item) => item.productName)
    console.log(a)
    const newproduct = leadList.filter(
      (it) => String(it?._id ?? "") === itemProductId
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
            // The selected-customer state may be only a dropdown option during
            // closing, so resolve the customer record above before reading its
            // tagged license data.
            const customerProduct = Array.isArray(filteredproduct)
              ? filteredproduct[0]
              : null
            console.log(filteredproduct[0])

            // Find the exact customer tag for the license selected on this row.
            const existingTag =
              customerProduct && Array.isArray(customerProduct.taggeddata)
                ? customerProduct.taggeddata.find(
                    (tag) =>
                      String(tag?.licensenumber ?? tag?.licenseNumber) ===
                      String(lic?.licenseNumber)
                  )
                : null
            const masterProduct = newproduct[0] || null
            const priceSources = [
              existing,
              existingTag,
              customerProduct,
              masterProduct,
              item
            ]
            // Lead Closing may recalculate the row price. Prefer that current
            // row for lead amounts so this popup always matches the lead table.
            const leadPriceSources = [
              item,
              existing,
              existingTag,
              customerProduct,
              masterProduct
            ]
            const getFirstValue = (...fields) => {
              for (const source of priceSources) {
                for (const field of fields) {
                  const value = source?.[field]
                  if (value !== undefined && value !== null && value !== "") {
                    return value
                  }
                }
              }
              return undefined
            }
            const getFirstPositiveValue = (...fields) => {
              for (const source of priceSources) {
                for (const field of fields) {
                  const value = Number(source?.[field])
                  if (Number.isFinite(value) && value > 0) return value
                }
              }
              return 0
            }
            const getFirstLeadValue = (...fields) => {
              for (const source of leadPriceSources) {
                for (const field of fields) {
                  const value = source?.[field]
                  if (value !== undefined && value !== null && value !== "") {
                    return value
                  }
                }
              }
              return undefined
            }
            const getFirstPositiveLeadValue = (...fields) => {
              for (const source of leadPriceSources) {
                for (const field of fields) {
                  const value = Number(source?.[field])
                  if (Number.isFinite(value) && value > 0) return value
                }
              }
              return 0
            }
            // Prefer a due record saved in this lead so reopening the popup
            // shows the user's latest edits. Empty lead values still fall
            // through to the customer's tagged license, then product master.
            const dueDetailSources = [existing, existingTag, masterProduct]
            const getDueDetailValue = (...fields) => {
              for (const source of dueDetailSources) {
                for (const field of fields) {
                  const value = source?.[field]
                  if (value !== undefined && value !== null && value !== "") {
                    return value
                  }
                }
              }
              return undefined
            }
            const getPositiveDueDetailValue = (...fields) => {
              for (const source of dueDetailSources) {
                for (const field of fields) {
                  const value = Number(source?.[field])
                  if (Number.isFinite(value) && value > 0) return value
                }
              }
              return 0
            }
            console.log(existing?.productAmount)
            console.log(existingTag?.productAmount)
            console.log(item?.actualNetAmount)
            console.log(item?.netAmount)
            console.log(existing)
            console.log(existingTag)
            // 3. Decide productAmount
            const productAmount =
              getFirstValue(
                "productAmount",
                "actualNetAmount",
                "netAmount",
                "amount"
              ) ?? 0
            console.log(productAmount)
            const nextDue = getDueDetailValue("nextDue") || ""
            const nextDueAmount = getPositiveDueDetailValue(
                "nextDueAmount",
                "actualproductPrice",
                "productPrice",
                "amount"
            )
            const totalNextDueAmount = getPositiveDueDetailValue(
              "totalnextDueAmount",
              "actualNetAmount",
              "netAmount"
            )
            // A product master's HSN is stored on the matching branch entry,
            // not as a flat `hsn`/`actualHsn` property on the product itself.
            const masterBranch = masterProduct?.selected?.find(
              (branch) =>
                String(branch?.branch_id ?? "") === String(selectedBranch ?? "")
            )
            const hsnNameTaxMatch = String(masterBranch?.hsnName || "").match(
              /(\d+(?:\.\d+)?)\s*%/
            )
            const masterTaxRate = Number(
              masterBranch?.hsn_id?.onValue?.igstRate ||
                hsnNameTaxMatch?.[1] ||
                0
            )
            const configuredTax = getPositiveDueDetailValue(
              "nextDueTax",
              "actualHsn",
              "hsn"
            )
            const inferredTax =
              nextDueAmount > 0 && totalNextDueAmount > nextDueAmount
                ? Number(
                    (
                      ((totalNextDueAmount - nextDueAmount) / nextDueAmount) *
                      100
                    ).toFixed(2)
                  )
                : 0
            const nextDueTax = configuredTax || inferredTax || masterTaxRate
            const calculatedTotalNextDueAmount = Math.round(
              nextDueAmount * (1 + nextDueTax / 100)
            )
            const taxexclusiveAmount = Number(
              getFirstLeadValue(
                "taxexclusiveAmount",
                "productPrice",
                "actualproductPrice",
                "amount"
              ) ?? 0
            )
            const leadTax = getFirstPositiveLeadValue(
              "leadTax",
              "hsn",
              "actualHsn"
            )
            const existingTaxinclusiveAmount = Math.round(Number(
              getFirstLeadValue(
                "taxinclusiveamount",
                "totalleadAmount",
                "netAmount",
                "actualNetAmount"
              ) ?? 0
            ))
            const calculatedTaxinclusiveAmount = Math.round(
              taxexclusiveAmount * (1 + leadTax / 100)
            )
            return {
              licensenumber: lic?.licenseNumber || "",
              nextDue: String(nextDue).slice(0, 10),
              noofusers: getFirstValue("noofusers") ?? 0,
              nextDueAmount,
              sourceIndex: lic?.sourceIndex,
              productAmount,
              taxexclusiveAmount,
              taxinclusiveamount:
                existingTaxinclusiveAmount > 0
                  ? existingTaxinclusiveAmount
                  : calculatedTaxinclusiveAmount,
              hsn:
                getFirstPositiveValue("hsn", "actualHsn"),
              originalHsn: getFirstPositiveValue(
                "originalHsn",
                "actualHsn",
                "hsn"
              ),
              leadAmount:
                getFirstLeadValue(
                  "leadAmount",
                  "productPrice",
                  "actualproductPrice"
                ) ??
                0,
              totalleadAmount:
                existingTaxinclusiveAmount > 0
                  ? existingTaxinclusiveAmount
                  : calculatedTaxinclusiveAmount,
              totalnextDueAmount:
                totalNextDueAmount > 0
                  ? totalNextDueAmount
                  : calculatedTotalNextDueAmount,
              leadTax,
              nextDueTax,
              discountAmount:
                getFirstValue("discountAmount") ?? 0,
              serialNumber: getFirstValue("serialNumber")
            }
          })
        : Array.isArray(item?.taggeddata)
          ? item.taggeddata.map((tag) => ({
              licensenumber: tag?.licensenumber || "",
              nextDue: tag?.nextDue || "",
              productAmount:
                tag?.productAmount ??
                item?.actualNetAmount ??
                item?.netAmount ??
                0,
              actualNetAmount: item?.netAmount
            }))
          : []
    initialDetailsDiscountRef.current = normalizedTaggedData.reduce(
      (sum, tag) => sum + (Number(tag?.discountAmount) || 0),
      0
    )
    console.log(item)
    console.log(normalizedTaggedData)
    if (isAdditionalService && normalizedTaggedData.length > 0) {
      setSelectedLeadList((prev) =>
        prev.map((lead, leadIndex) => {
          if (leadIndex !== index) return lead

          const existingLicenseNumbers = Array.isArray(lead?.licenseNumbers)
            ? lead.licenseNumbers
            : []
          const derivedLicenseNumbers = normalizedTaggedData.map(
            (tag, sourceIndex) => ({
              licenseNumber: tag?.licensenumber,
              productorServiceId: lead?.productorServiceId || "",
              productorServiceName: lead?.productorServiceName || "",
              sourceIndex
            })
          )

          return {
            ...lead,
            taggeddata: normalizedTaggedData,
            licenseNumbers:
              existingLicenseNumbers.length > 0
                ? existingLicenseNumbers
                : derivedLicenseNumbers
          }
        })
      )
    }
    setDetailsItem(item)
    setDetailsIndex(index)
    console.log("hhh")
    setDetailsForm({
      name: item?.productorServiceName || "",
      licenseNumber: item?.licenseNumber || "",
      softwareTrade: item?.softwareTrade || "",
      applicationDate: applicationDateValue,
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
  const hasRowsWithDetails = tableRows.some(
    (item) =>
      String(item?.productorservicetype || "").toLowerCase() !==
      "enhancedservice"
  )
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
          className={`mx-auto w-full rounded bg-white shadow-xl ${
            process === "Registration" && !Data && isMarketingStaff && leadCreationMode === "bulk"
              ? "max-w-[1500px]"
              : "max-w-4xl"
          }`}
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
                {process === "Registration" && !Data && isMarketingStaff && (
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setLeadCreationMode("single")}
                      className={`rounded-md px-3 py-1.5 transition ${
                        leadCreationMode === "single"
                          ? "bg-[#1B2A4A] text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Single lead
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeadCreationMode("bulk")}
                      className={`rounded-md px-3 py-1.5 transition ${
                        leadCreationMode === "bulk"
                          ? "bg-[#1B2A4A] text-white shadow-sm"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      Bulk leads
                    </button>
                  </div>
                )}
                {/* <button
type="button"
onClick={handledownloadexcel}
>
convertexcel
</button> */}
              </div>

              {process === "Registration" && !Data && isMarketingStaff && leadCreationMode === "bulk" && (
                <BulkLeadWorkspace
                  customers={bulkLeadCustomers}
                  setCustomers={setBulkLeadCustomers}
                  expandedCustomerIds={expandedBulkCustomerIds}
                  setExpandedCustomerIds={setExpandedBulkCustomerIds}
                  productOptions={bulkProductOptions}
                  customerOptions={customerOptions}
                  partners={partner}
                  commonValues={bulkCommonValues}
                  setCommonValues={setBulkCommonValues}
                  isMarketingStaff={isMarketingStaff}
                  selectedBranch={selectedBranch}
                  branches={companybranches}
                  onBranchChange={handleBulkBranchChange}
                  onCreate={handleBulkLeadCreate}
                  submitting={submitLoading}
                  isReadOnly={isReadOnly}
                />
              )}

              <div
                className={
                  process === "Registration" && !Data && isMarketingStaff && leadCreationMode === "bulk"
                    ? "hidden"
                    : "p-3 md:p-4 space-y-3"
                }
              >
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
                          isSearchable
                          placeholder="Search customer, mobile, product or license..."
                          noOptionsMessage={() => "No matching customer found"}
                          value={
                            customerOptions.length > 0
                              ? (customerOptions.find(
                                  (o) => o.value === watchMain("customerName")
                                ) ?? null)
                              : null
                          }
                          getOptionLabel={(o) => o.label}
                          getOptionValue={(o) => o.optionId}
                          filterOption={customFilter}
                          formatOptionLabel={(option, { context }) =>
                            context === "menu" ? (
                              <div className="flex min-w-0 items-center justify-between gap-3 py-0.5">
                                <div className="min-w-0">
                                  <p className="truncate font-semibold text-slate-800">
                                    {option.label}
                                  </p>
                                  <p className="truncate text-[11px] text-slate-500">
                                    {option.mobile || "No mobile"}
                                    {option.productName && ` · ${option.productName}`}
                                  </p>
                                </div>
                                <span className="shrink-0 rounded-md bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
                                  {option.license || "No license"}
                                </span>
                              </div>
                            ) : (
                              `${option.label}${
                                option.mobile ? ` - ${option.mobile}` : ""
                              }`
                            )
                          }
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
                              minHeight: 38,
                              borderRadius: 8,
                              borderColor: state.isFocused ? "#1B2A4A" : "#CBD5E1",
                              backgroundColor: state.isDisabled ? "#F1F5F9" : "#FFFFFF",
                              boxShadow: state.isFocused
                                ? "0 0 0 3px rgba(27, 42, 74, 0.12)"
                                : "0 1px 2px rgba(15, 23, 42, 0.05)",
                              "&:hover": {
                                borderColor: "#1B2A4A"
                              },
                              cursor: state.isDisabled
                                ? "not-allowed"
                                : "pointer",
                              opacity: state.isDisabled ? 0.7 : 1
                            }),
                            valueContainer: (base) => ({
                              ...base,
                              padding: "0 10px"
                            }),
                            placeholder: (base) => ({
                              ...base,
                              color: "#94A3B8",
                              fontSize: 13
                            }),
                            singleValue: (base) => ({
                              ...base,
                              color: "#1E293B",
                              fontSize: 13,
                              fontWeight: 600
                            }),
                            input: (base) => ({
                              ...base,
                              color: "#1E293B",
                              fontSize: 13
                            }),
                            indicatorSeparator: () => ({ display: "none" }),
                            dropdownIndicator: (base, state) => ({
                              ...base,
                              color: state.isFocused ? "#1B2A4A" : "#64748B",
                              padding: 7,
                              "&:hover": { color: "#1B2A4A" }
                            }),
                            menu: (base) => ({
                              ...base,
                              marginTop: 8,
                              overflow: "hidden",
                              borderRadius: 12,
                              border: "1px solid #E2E8F0",
                              boxShadow: "0 16px 36px rgba(15, 23, 42, 0.16)"
                            }),
                            menuList: (base) => ({
                              ...base,
                              maxHeight: 240,
                              padding: 4
                            }),
                            option: (base, state) => ({
                              ...base,
                              marginBottom: 2,
                              borderRadius: 7,
                              padding: "7px 9px",
                              color: "#1E293B",
                              backgroundColor: state.isSelected
                                ? "#DBEAFE"
                                : state.isFocused
                                  ? "#F1F5F9"
                                  : "#FFFFFF",
                              cursor: "pointer",
                              ":active": { backgroundColor: "#DBEAFE" }
                            }),
                            menuPortal: (base) => ({ ...base, zIndex: 9999 })
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
                          partnerSelection: "",
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
                      className={`h-[38px] min-w-[140px] rounded border border-gray-300 bg-[#1B2A4A] px-3 text-sm text-white outline-none hover:bg-[#243660] ${isReadOnly ? "cursor-not-allowed" : "cursor-pointer"}`}
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
                    {errorsMain.mobile && (
                      <p className="mt-1 text-xs font-medium text-red-500">
                        {errorsMain.mobile.message}
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
                      Partner
                    </label>
                    <select
                      {...registerMain("partnerSelection")}
                      disabled={isReadOnly}
                      className={`w-full border border-gray-300 rounded px-3 py-[7px] text-sm outline-none bg-[#EEF2F8] ${
                        isReadOnly
                          ? "cursor-not-allowed opacity-70"
                          : "cursor-pointer"
                      }`}
                    >
                      <option value="">Select Partner</option>
                      {partnerCustomerOptions.map((partnerCustomer) => (
                        <option
                          key={partnerCustomer.customerId}
                          value={partnerCustomer.value}
                        >
                          {partnerCustomer.label}
                          {partnerCustomer.mobile
                            ? ` - ${partnerCustomer.mobile}`
                            : ""}
                        </option>
                      ))}
                    </select>
                    {errorsMain.partnerSelection && (
                      <p className="text-red-500 text-xs mt-1">
                        {errorsMain.partnerSelection.message}
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
                      <col style={{ width: "27%" }} />
                      <col style={{ width: "20%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "11%" }} />
                      <col style={{ width: "14%" }} />
                      <col style={{ width: "7%" }} />
                      {isClosingFlow && hasRowsWithDetails && (
                        <col style={{ width: "7%" }} />
                      )}
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
                        {isClosingFlow && hasRowsWithDetails && (
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
                        const itemType = String(
                          item?.productorservicetype || ""
                        ).toLowerCase()
                        const showLicenseDropdown =
                          itemType === "additionalservice" ||
                          (process === "closing" &&
                            itemType === "enhancedservice")
                        console.log("jjj")
                        console.log(showLicenseDropdown)
                        // Amount and tax can be adjusted in editable lead flows.
                        // Read-only views remain protected.
                        const isAmountLocked = isReadOnly
                        console.log(isAmountLocked)
                        console.log(isReadOnly)
                        const isTaxLocked = isReadOnly
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
                            key={index}
                            className="border-b even:bg-blue-50 bg-white hover:bg-blue-50 transition-colors"
                          >
                            <td className="border border-gray-300 px-1 py-1">
                              <ProductDropdown
                                index={index}
                                item={item}
                                process={process}
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
                                  process === "closing" &&
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
                                    if (
                                      item?.productorservicetype.toLowerCase() ===
                                      "primaryproduct"
                                    )
                                      return
                                    console.log(selectedleadlist)
                                    if (selectedleadlist.length === 1) return
                                    console.log("jjjjj")
                                    handleDeletetableData(item, index)
                                  }}
                                  className={`h-7 w-7 rounded-md border border-red-200 bg-red-50 flex items-center justify-center text-red-600 shadow-sm transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-700 ${
                                    isReadOnly
                                      ? "cursor-not-allowed opacity-30"
                                      : ""
                                  }`}
                                  title="Delete row"
                                >
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4"
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
                            {isClosingFlow &&
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
                      ...(process === "closing" || process === "edit"
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
                            if (
                              isClosingFlow &&
                              field === "discamnt" &&
                              !hasPrimaryProductInLead
                            ) {
                              console.log("hh")
                              const isInvalid = selectedleadlist.some(
                                (lead) => {
                                  const isAdditionalService =
                                    String(
                                      lead?.productorservicetype || ""
                                    ).toLowerCase() === "additionalservice"

                                  return (
                                    isAdditionalService &&
                                    (!lead.taggeddata?.length ||
                                      lead.taggeddata.some(
                                        (tag) =>
                                          Number(tag.taxexclusiveAmount || 0) <=
                                          0
                                      ))
                                  )
                                }
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
                        ? hasPrimaryProductInLead
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

                              <div className="relative">
                                <input
                                  type="search"
                                  value={
                                    isTradeOpen
                                      ? tradeSearch
                                      : detailsForm.softwareTrade
                                  }
                                  onFocus={() => {
                                    if (!isTradeOpen) {
                                      setTradeSearch("")
                                      setIsTradeOpen(true)
                                    }
                                  }}
                                  onChange={(event) => {
                                    setTradeSearch(event.target.value)
                                    setIsTradeOpen(true)
                                  }}
                                  placeholder="Search software trade..."
                                  aria-label="Search software trades"
                                  aria-expanded={isTradeOpen}
                                  aria-haspopup="listbox"
                                  className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 pr-10 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-[#1B2A4A] focus:ring-2 focus:ring-[#1B2A4A]/10"
                                />
                                <svg
                                  className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-transform ${
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
                              </div>

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
                                        setTradeSearch("")
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

                                    {filteredSoftwareTrades.map((trade) => (
                                      <button
                                        key={trade}
                                        type="button"
                                        onClick={() => {
                                          setDetailsForm((prev) => ({
                                            ...prev,
                                            softwareTrade: trade
                                          }))
                                          setTradeSearch("")
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

                                    {filteredSoftwareTrades.length === 0 && (
                                      <p className="px-3 py-5 text-center text-sm text-slate-500">
                                        No software trade found.
                                      </p>
                                    )}
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
                                value={detailsForm.applicationDate}
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
                                    {!hasPrimaryProductInLead ? (
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

                                      {!hasPrimaryProductInLead && (
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

                                          {!hasPrimaryProductInLead && (
                                            <>
                                              <td className="px-1.5 py-2">
                                                <div className="space-y-0.5">
                                                  <input
                                                    type="number"
                                                    value={
                                                      tag?.taxexclusiveAmount ||
                                                      ""
                                                    }
                                                    readOnly
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
                                                    className="h-7 w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-1.5 text-right text-[11px] text-slate-500 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                                                    readOnly
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
                                                  className="h-7 w-full cursor-not-allowed rounded-md border border-slate-200 bg-slate-100 px-1.5 text-right text-[11px] text-slate-500 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
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
                      <div className="hidden">
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
