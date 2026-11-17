import { useState, useEffect, useRef } from "react"
import { X, IndianRupee, ClipboardCheck, Lock, Check, ChevronDown } from "lucide-react"
import { BarLoader } from "../../components/loader/BarLoader"
import PopUp from "../common/PopUp"
import { toast } from "react-toastify"
import UseFetch from "../../hooks/useFetch"
/* ─── helpers ─── */
const safeNumber = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

const todayString = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

const CAMET_BRANCH_ID = "66ffb2fb39904d78447cfaec"
const ACCUANET_BRANCH_ID = "66f7b26c1e7129afd9aee189"

const PAYMENT_MODES_BY_BRANCH = {
  [ACCUANET_BRANCH_ID]: [
    { value: "PUNJAB NATIONAL BANK - ACCUANET", label: "Punjab National Bank" },
    { value: "INDIAN OVERSEAS BANK - ACCUANET", label: "Indian Overseas Bank" },
    { value: "CASH - ACCUANET", label: "Cash" },
    { value: "BANK OF BARODA - ACCUANET", label: "Bank of Baroda" }
  ],
  [CAMET_BRANCH_ID]: [
    { value: "SOUTH INDIAN BANK - CAMET", label: "South Indian Bank" },
    { value: "CASH - CAMET", label: "Cash" },
    { value: "HDFC BANK - MET", label: "HDFC Bank" }
  ]
}

const emptyRow = () => ({
  id: crypto.randomUUID(),
  label: "",
  netAmount: "",
  receivedAmount: "",
  _balance: undefined,
  _baseBalance: 0,
  _netAmt: 0,
  _paidSoFar: 0,
  _isEditRow: false
})

/* ══════════════════════════════════════════════════════
   TOOLTIP COMPONENT
══════════════════════════════════════════════════════ */
function Tooltip({ text, children }) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef(null)
  const tooltipRef = useRef(null)

  const show = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setPos({
      top: rect.top - 8,
      left: rect.left + rect.width / 2
    })
    setVisible(true)
  }

  const hide = () => setVisible(false)

  useEffect(() => {
    if (!visible || !tooltipRef.current || !triggerRef.current) return
    const tr = triggerRef.current.getBoundingClientRect()
    const tt = tooltipRef.current.getBoundingClientRect()
    const top = tr.top - tt.height - 8
    let left = tr.left + tr.width / 2 - tt.width / 2
    const pad = 8
    left = Math.max(pad, Math.min(left, window.innerWidth - tt.width - pad))
    setPos({ top, left })
  }, [visible, text])

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        style={{ minWidth: 0, width: "100%" }}
      >
        {children}
      </div>

      {visible && (
        <div
          ref={tooltipRef}
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            transform: "translateX(-50%)",
            zIndex: 9999,
            pointerEvents: "none",
            background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            color: "#f1f5f9",
            fontSize: 11.5,
            fontWeight: 500,
            lineHeight: 1.4,
            padding: "7px 12px",
            borderRadius: 8,
            border: "1px solid rgba(99,102,241,0.35)",
            boxShadow:
              "0 4px 16px rgba(0,0,0,0.35), 0 0 0 1px rgba(99,102,241,0.15)",
            whiteSpace: "nowrap",
            maxWidth: 280,
            overflow: "hidden",
            textOverflow: "ellipsis",
            animation: "tooltipFadeIn 0.12s ease"
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: 32,
              height: 2,
              borderRadius: "0 0 4px 4px",
              background: "linear-gradient(90deg,#6366f1,#818cf8)"
            }}
          />
          {text}
          <span
            style={{
              position: "absolute",
              bottom: -6,
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderTop: "6px solid #1e293b"
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes tooltipFadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(4px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </>
  )
}

/* ─── sub-components ─── */
function SectionTitle({ children }) {
  return (
    <div
      style={{
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: "0.09em",
        textTransform: "uppercase",
        color: "#64748b",
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 6
      }}
    >
      <span
        style={{
          flex: 1,
          height: 1,
          background: "linear-gradient(90deg,#e2e8f0,transparent)"
        }}
      />
      {children}
      <span
        style={{
          flex: 1,
          height: 1,
          background: "linear-gradient(270deg,#e2e8f0,transparent)"
        }}
      />
    </div>
  )
}

function Field({ label, error, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <label
        style={{
          fontSize: 9.5,
          fontWeight: 600,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: "#374151"
        }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p style={{ fontSize: 10.5, color: "#ef4444", marginTop: 1 }}>
          {error}
        </p>
      )}
    </div>
  )
}

function ModernSelect({
  name,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  menuPlacement = "bottom",
  searchable = false
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const selectRef = useRef(null)
  const selectedOption = options.find((option) => String(option.value) === String(value))
  const visibleOptions = searchable
    ? options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.trim().toLowerCase())
    )
    : options

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!selectRef.current?.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener("mousedown", closeOnOutsideClick)
    return () => document.removeEventListener("mousedown", closeOnOutsideClick)
  }, [])

  const selectOption = (optionValue) => {
    onChange({ target: { name, value: optionValue } })
    setSearchQuery("")
    setIsOpen(false)
  }

  return (
    <div
      ref={selectRef}
      style={{
        position: "relative",
        minWidth: 0,
        zIndex: isOpen ? 50 : "auto"
      }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((open) => {
          if (open) setSearchQuery("")
          return !open
        })}
        style={{
          width: "100%",
          minWidth: 0,
          height: 31,
          padding: "0 9px",
          border: `1px solid ${isOpen ? "#6366f1" : "#dbe3ef"}`,
          borderRadius: 8,
          background: disabled ? "#f1f5f9" : "linear-gradient(180deg,#ffffff,#f8fafc)",
          color: selectedOption ? "#1e293b" : "#94a3b8",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          cursor: disabled ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          fontSize: 11.5,
          fontWeight: 600,
          boxShadow: isOpen ? "0 0 0 3px rgba(99,102,241,0.12)" : "0 1px 1px rgba(15,23,42,0.02)",
          transition: "border-color .15s, box-shadow .15s"
        }}
      >
        <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "left" }}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown
          size={15}
          style={{ flexShrink: 0, color: "#64748b", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .15s" }}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            zIndex: 40,
            top: menuPlacement === "bottom" ? "calc(100% + 5px)" : "auto",
            bottom: menuPlacement === "top" ? "calc(100% + 5px)" : "auto",
            left: 0,
            width: "100%",
            minWidth: 0,
            maxHeight: 196,
            overflowY: "auto",
            padding: 4,
            borderRadius: 9,
            border: "1px solid #dbe3ef",
            background: "#fff",
            boxShadow: "0 12px 28px rgba(15,23,42,0.16)"
          }}
        >
          {searchable && (
            <input
              type="search"
              value={searchQuery}
              autoFocus
              onChange={(event) => setSearchQuery(event.target.value)}
              onClick={(event) => event.stopPropagation()}
              placeholder="Search customer..."
              style={{
                width: "100%",
                marginBottom: 4,
                padding: "7px 8px",
                border: "1px solid #dbe3ef",
                borderRadius: 6,
                outline: "none",
                color: "#334155",
                fontFamily: "inherit",
                fontSize: 11
              }}
            />
          )}
          {visibleOptions.map((option) => {
            const selected = String(option.value) === String(value)
            return (
              <button
                key={option.value || "empty"}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => selectOption(option.value)}
                style={{
                  width: "100%",
                  minWidth: 0,
                  border: 0,
                  borderRadius: 6,
                  padding: "7px 8px",
                  background: selected ? "#eef2ff" : "transparent",
                  color: selected ? "#4338ca" : "#334155",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 11,
                  fontWeight: selected ? 700 : 500,
                  textAlign: "left"
                }}
              >
                <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{option.label}</span>
                {selected && <Check size={13} style={{ flexShrink: 0 }} />}
              </button>
            )
          })}
          {visibleOptions.length === 0 && (
            <p style={{ margin: 0, padding: "7px 8px", color: "#64748b", fontSize: 11 }}>
              No customer found
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function AmtInput({ value, onChange, highlight }) {
  return (
    <div style={{ position: "relative" }}>
      <IndianRupee
        size={9}
        style={{
          position: "absolute",
          left: 5,
          top: "50%",
          transform: "translateY(-50%)",
          color: "#94a3b8",
          pointerEvents: "none"
        }}
      />
      <input
        type="number"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
        onWheel={(e) => e.currentTarget.blur()}
        className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0"
        style={{
          width: "100%",
          paddingLeft: 16,
          paddingRight: 4,
          paddingTop: 4,
          paddingBottom: 4,
          fontSize: 11,
          border: `1px solid ${highlight ? "#bfdbfe" : "#e2e8f0"}`,
          borderRadius: 6,
          background: highlight ? "#eff6ff" : "#f8fafc",
          outline: "none",
          color: "#1e293b",
          fontFamily: "inherit"
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#6366f1"
        }}
        onBlur={(e) => {
          e.target.style.borderColor = highlight ? "#bfdbfe" : "#e2e8f0"
        }}
      />
    </div>
  )
}

function TotalCell({ value, color, green, abs }) {
  const display = abs ? Math.abs(value) : value
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        color,
        ...(green
          ? {
              background: "#dcfce7",
              border: "1px solid #86efac",
              borderRadius: 6,
              padding: "3px 6px"
            }
          : {}),
        display: "flex",
        alignItems: "center",
        gap: 2
      }}
    >
      <IndianRupee size={9} />
      {display.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
    </span>
  )
}

function SummaryChip({ label, value, color, bg, border, suffix = "" }) {
  return (
    <div
      style={{
        display: "flex",
        minWidth: 0,
        flexDirection: "column",
        alignItems: "flex-start",
        gap: 2,
        padding: "5px 7px",
        borderRadius: 8,
        background: bg,
        border: `1px solid ${border}`
      }}
    >
      <span style={{ fontSize: 9, fontWeight: 700, color, opacity: 0.8, textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color,
          display: "flex",
          alignItems: "center",
          gap: 3
        }}
      >
        <IndianRupee size={9} />
        {value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
        {suffix && <span style={{ fontSize: 9.5 }}>{suffix}</span>}
      </span>
    </div>
  )
}

/* ══════════════════════════════════════════════════════
   MAIN MODAL
══════════════════════════════════════════════════════ */
export function CollectionupdateModal({
  data,
  closemodal,
  setishavePayment,
  loggedUser,
  handleCollectionUpdate,
  from,
  hasCollectionData,
  editData
}) {
  const { data: partnerCustomers } = UseFetch("/customer/getPartnerCustomers")
  const [error, setError] = useState({})
  const [ishaveprimaryProduct, setIsHavePrimaryProduct] = useState(false)
  const [popupOpen, setpopupOpen] = useState(false)
  console.log(popupOpen)
  const [submitLoader, setsubmitLoader] = useState(false)
  const [formData, setFormData] = useState({
    submissionDate: todayString(),
    bankRemark: "",
    paymentMode: "",
    registrationType: "",
    registrationNo: "",
    customerName: "",
    address: "",
    mobile: "",
    email: "",
    pin: "",
    country: "",
    state: "",
    city: "",
    partnerSelection: "",
    customerId: ""
  })
  const [paymentRows, setPaymentRows] = useState([emptyRow()])
  console.log(paymentRows)
  const leadBranchId = String(
    data?.leadBranch?._id ?? data?.leadBranch ?? data?.branch_id?._id ?? data?.branch_id ?? ""
  )
  const paymentModeOptions = PAYMENT_MODES_BY_BRANCH[leadBranchId] || []
  const base = {
    width: "100%",
    padding: "5px 9px",
    fontSize: 12,
    border: "1px solid #e2e8f0",
    borderRadius: 7,
    background: "#f8fafc",
    outline: "none",
    color: "#1e293b",
    transition: "border 0.15s, box-shadow 0.15s",
    fontFamily: "inherit"
  }

  const readonly = {
    ...base,
    background: "#f1f5f9",
    color: "#94a3b8",
    cursor: "not-allowed"
  }

  const focusOn = (e) => {
    e.target.style.borderColor = "#6366f1"
    e.target.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)"
  }

  const focusOff = (e) => {
    e.target.style.borderColor = "#e2e8f0"
    e.target.style.boxShadow = "none"
  }

  useEffect(() => {
    if (!data) return

    setFormData((prev) => ({
      ...prev,
      customerId: data?.customerName?._id ?? "",
      bankRemark: data.bankRemark ?? "",
      paymentMode: editData?.paymentMode ?? "",
      totalpaidAmountBefore: data?.totalPaidAmount,
      registrationType: data.customerName?.registrationType ?? "",
      registrationNo: data.customerName?.registrationNo ?? "",
      customerName: data.customerName?.customerName ?? "",
      address: data.customerName?.address1 ?? "",
      mobile: data.mobile ?? "",
      email: data.email ?? "",
      pin: data.customerName?.pincode ?? "",
      country: data.customerName?.country ?? "",
      state: data.customerName?.state ?? "",
      city: data.customerName?.city ?? "",
      partnerSelection:
        editData?.partnerSelection?._id ??
        editData?.partnerSelection ??
        "",
      receivedBy: loggedUser?._id,
      receivedModel: loggedUser?.role === "Admin" ? "Admin" : "Staff"
    }))
    console.log(data)
    const history = Array.isArray(data.paymentHistory)
      ? data.paymentHistory
      : []

    console.log(data?.originalpaymentHistory)
    const originalPaymentHistory = Array.isArray(data?.originalpaymentHistory)
      ? data.originalpaymentHistory
      : history
    const lastPayment = originalPaymentHistory.length
      ? originalPaymentHistory[originalPaymentHistory.length - 1]
      : null
    console.log(history)
    const hasPaymentEntries =
      lastPayment &&
      Array.isArray(lastPayment.paymentEntries) &&
      lastPayment.paymentEntries.length > 0
    console.log(hasCollectionData)
    console.log(hasCollectionData && editData?.paymentEntries)
    console.log(hasPaymentEntries)
    console.log(data?.leadFor)

    if (hasCollectionData && editData?.paymentEntries?.length > 0) {
      console.log("hhh")
      setPaymentRows(
        editData.paymentEntries.map((p) => {
          const net = safeNumber(p.netAmount)
          const received = safeNumber(p.receivedAmount)
          const balance = safeNumber(p.balanceAmount)
          console.log(p)
          return {
            id: crypto.randomUUID(),
            label: p.label ?? "Product",
            productorServiceId: p.productorServiceId,
            productorServicemodel: p.productorServicemodel,
            netAmount: String(net),
            productorservicetype: p?.productorservicetype,
            receivedAmount: String(received),
            _balance: balance,
            _baseBalance: balance,
            _netAmt: net,
            _paidSoFar: received,
            _isEditRow: true
          }
        })
      )
    } else if (hasPaymentEntries) {
      console.log("hhh")
      setPaymentRows(
        lastPayment.paymentEntries.map((p) => {
          const net = safeNumber(p.netAmount)
          const currentBalance = safeNumber(p.balanceAmount)
          const paid = net - currentBalance
          console.log(p)
          return {
            id: crypto.randomUUID(),
            label: p.productorServiceId?.productName ?? "Product",
            productorServiceId:
              p.productorServiceId?._id || p?.productorServiceId,
            productorServicemodel: p.productorServicemodel ?? "Product",
            netAmount: String(net),
            receivedAmount: "",
            productorservicetype: p?.productorservicetype,
            _balance: currentBalance,
            _baseBalance: currentBalance,
            _netAmt: net,
            _paidSoFar: paid,
            _isEditRow: false
          }
        })
      )
    } else if (Array.isArray(data.leadFor) && data.leadFor.length > 0) {
      console.log(data.leadFor)
      const hasPrimaryProduct = data?.leadFor?.some(
        (item) => item.productorservicetype === "Primaryproduct"
      )
      const leadForNetTotal = data.leadFor.reduce(
        (total, item) => total + safeNumber(item.netAmount ?? item.productPrice),
        0
      )
      const leadNetAmount = safeNumber(data.netAmount)
      const useLeadNetFallback = leadForNetTotal === 0 && leadNetAmount > 0
      console.log(hasPrimaryProduct)

      setIsHavePrimaryProduct(hasPrimaryProduct)
      setPaymentRows(
        data.leadFor.map((p, index) => {
          const net = useLeadNetFallback && index === 0
            ? leadNetAmount
            : safeNumber(p.netAmount ?? p.productPrice)
          console.log(p)
          return {
            id: crypto.randomUUID(),
            label: p.productorServiceId?.productName ?? "Product",
            productorServiceId:
              p.productorServiceId?._id ?? p.productorServiceId,
            productorServicemodel: p.productorServicemodel,
            netAmount: String(net),
            productorservicetype: p?.productorservicetype,
            receivedAmount: "",
            _balance: net,
            _baseBalance: net,
            _netAmt: net,
            _paidSoFar: 0,
            _isEditRow: false
          }
        })
      )
    } else {
      const net = safeNumber(data.netAmount)
      const paid = safeNumber(data.totalPaidAmount)
      const balance = net - paid
      console.log("hhh")
      setPaymentRows([
        {
          id: crypto.randomUUID(),
          label: data.customerName?.customerName ?? "Payment",
          productorServiceId: null,
          productorServicemodel: null,
          netAmount: String(net),
          receivedAmount: "",
          productorservicetype: "",
          _balance: balance,
          _baseBalance: balance,
          _netAmt: net,
          _paidSoFar: paid,
          _isEditRow: false
        }
      ])
    }
  }, [data, hasCollectionData, editData, loggedUser])

  const updateRow = (id, field, value) =>
    setPaymentRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const updated = { ...r, [field]: value }
        console.log(value)
        console.log(field)
        console.log(r._isEditRow)
        // Validation
        if (field === "receivedAmount") {
          const received = safeNumber(value)
          const net = safeNumber(r.netAmount)
          console.log(r)
          console.log(received)
          console.log(net)
          if (received > net || received > r._balance) {
            toast.warning("Received amount cannot be greater than Net Amount")
            return r // Don't update
          }
        }
        if (field === "netAmount") {
          console.log(value)
          const net = safeNumber(value)
          updated._netAmt = net

          if (r._isEditRow) {
            const received = safeNumber(updated.receivedAmount)
            updated._balance = net - received
          } else {
            updated._balance = net - safeNumber(r._paidSoFar ?? 0)
          }
        }

        if (field === "receivedAmount" && r._isEditRow) {
          console.log(value)
          const net = safeNumber(updated.netAmount)
          const received = safeNumber(value)
          updated._balance = net - received
        }

        return updated
      })
    )

  const rowBalance = (r) => {
    if (r._isEditRow) {
      return safeNumber(r.netAmount) - safeNumber(r.receivedAmount)
    }
    return safeNumber(r._baseBalance) - safeNumber(r.receivedAmount)
  }

  const isRowLocked = (r) => {
    if (r._isEditRow) return false
    return safeNumber(r._baseBalance) <= 0
  }

  const totalNet = paymentRows.reduce((s, r) => s + safeNumber(r.netAmount), 0)
  const totalReceived = paymentRows.reduce(
    (s, r) => s + safeNumber(r.receivedAmount),
    0
  )
  const totalBalance = paymentRows.reduce((s, r) => s + rowBalance(r), 0)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (name === "email") {
      setError((p) => ({
        ...p,
        email:
          value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
            ? "Invalid email"
            : ""
      }))
      return
    }

    if (name === "mobile") {
      let msg = ""
      if (!value) msg = "Required"
      else if (!/^\d+$/.test(value)) msg = "Digits only"
      else if (value.length !== 10) msg = "10 digits required"
      else if (!/^[6-9]\d{9}$/.test(value)) msg = "Invalid number"
      setError((p) => ({ ...p, mobile: msg }))
      return
    }

    setError((p) => ({ ...p, [name]: "" }))
  }
  const onClose = () => {
    setpopupOpen(false)
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    console.log(totalReceived)
    console.log(totalNet)
    console.log(paymentRows)
    if (totalReceived < 1) {
      setpopupOpen(true)
      return
    }
    if (!formData.paymentMode) {
      setError((previous) => ({ ...previous, paymentMode: "Select a mode of payment" }))
      toast.warning("Select a mode of payment")
      return
    }

    console.log("hhh")
    const payload = {
      leadId: data?.leadId,
      leadDocId: data?._id,
      ...formData,
      paymentEntries: paymentRows.map((r) => ({
        label: r.label,
        productorServiceId: r.productorServiceId,
        productorServicemodel: r.productorServicemodel,
        netAmount: safeNumber(r.netAmount),
        receivedAmount: safeNumber(r.receivedAmount),
        balanceAmount: rowBalance(r)
      })),
      totalNetAmount: totalNet,
      totalReceivedAmount: totalReceived,
      paymentMode: formData.paymentMode,
      updatedBy: loggedUser?._id
    }
    console.log(payload)

    const res = await handleCollectionUpdate(
      payload,
      setsubmitLoader,
      submitLoader
    )
    if (res?.status === 200) closemodal(false)
  }

  const isRegular = formData.registrationType === "regular"
  const balColor =
    totalBalance > 0 ? "#b45309" : totalBalance < 0 ? "#be123c" : "#166534"
  const toSafeUpper = (value) =>
    String(value ?? "")
      .trim()
      .toUpperCase()
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(4px)",
        background: "rgba(15,23,42,0.55)"
      }}
    >
      <style>{`
        @media (max-width: 900px) {
          .collection-update-form {
            grid-template-columns: minmax(0, 1fr) minmax(210px, 0.7fr) !important;
          }
          .collection-payment-panel {
            grid-column: 1 / -1;
            min-height: 240px;
          }
        }
        @media (max-width: 640px) {
          .collection-update-form {
            grid-template-columns: minmax(0, 1fr) !important;
          }
          .collection-customer-panel,
          .collection-details-panel,
          .collection-payment-panel {
            grid-column: auto;
          }
        }
      `}</style>
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "calc(100vw - 24px)",
          maxWidth: 1120,
          maxHeight: "97vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: 18,
          overflow: "hidden",
          background: "#f1f5f9",
          boxShadow:
            "0 0 0 1px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.22), 0 40px 80px rgba(0,0,0,0.16)"
        }}
      >
        {/* ── HEADER ── */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "9px 16px",
            background:
              "linear-gradient(130deg,#0c1e3d 0%,#1a3560 55%,#1e4480 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.07)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <ClipboardCheck size={15} color="rgba(255,255,255,0.85)" />
            </div>
            <div>
              <div
                style={{ fontSize: 13.5, fontWeight: 700, color: "#f1f5f9" }}
              >
                Collection Update
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.4)",
                  marginTop: 1
                }}
              >
                Update payment and collection details
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 11px",
                borderRadius: 99,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                fontSize: 11,
                fontWeight: 700,
                color: "#7dd3fc"
              }}
            >
              Lead ID:{" "}
              <span style={{ color: "#38bdf8" }}>{data?.leadId ?? "—"}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                console.log("Hhdf")
                // setishavePayment(false)
                closemodal(false)
                setishavePayment(false)
                console.log("hhh")
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.2)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.1)"
              }}
            >
              <X size={13} color="rgba(255,255,255,0.85)" />
            </button>
          </div>
        </div>

        {submitLoader && <BarLoader />}

        {/* ── 3-COLUMN BODY ── */}
        <form
          id="collection-form"
          className="collection-update-form"
          onSubmit={handleSubmit}
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) minmax(230px,260px) minmax(0,1fr)",
            gap: 8,
            padding: 10,
            overflow: "hidden",
            minHeight: 0,
            alignItems: "start",
            alignContent: "start"
          }}
        >
          {/* COL 1 — Customer Information */}
          <div
            className="collection-customer-panel"
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              gap: 7,
              overflow: "hidden",
              minWidth: 0
            }}
          >
            <SectionTitle>Customer Information</SectionTitle>

            <Field label="Customer Name">
              <input
                value={toSafeUpper(formData.customerName)}
                readOnly
                style={readonly}
              />
            </Field>
            <Field label="Address">
              <input
                name="address"
                value={formData.address}
                onChange={handleChange}
                style={base}
                onFocus={focusOn}
                onBlur={focusOff}
              />
            </Field>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 7
              }}
            >
              <Field label="Mobile" error={error.mobile}>
                <input
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  style={base}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </Field>
              <Field label="Email" error={error.email}>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={base}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </Field>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 7
              }}
            >
              <Field label="Pin">
                <input
                  name="pin"
                  value={formData.pin}
                  onChange={handleChange}
                  style={base}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </Field>
              <Field label="Country">
                <input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  style={base}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </Field>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 7
              }}
            >
              <Field label="State">
                <input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  style={base}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </Field>
              <Field label="City">
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  style={base}
                  onFocus={focusOn}
                  onBlur={focusOff}
                />
              </Field>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 7
              }}
            >
              <Field label="Reg. Type">
                <ModernSelect
                  name="registrationType"
                  value={formData.registrationType}
                  onChange={handleChange}
                  placeholder="Select registration type"
                  menuPlacement="top"
                  options={[
                    { value: "", label: "Select registration type" },
                    { value: "unregistered", label: "Unregistered" },
                    { value: "regular", label: "Regular" }
                  ]}
                />
              </Field>
              <Field label="Reg. No">
                <input
                  name="registrationNo"
                  value={formData.registrationNo}
                  onChange={handleChange}
                  style={isRegular ? base : readonly}
                  readOnly={!isRegular}
                  disabled={!isRegular}
                  onFocus={(e) => {
                    if (isRegular) focusOn(e)
                  }}
                  onBlur={focusOff}
                />
              </Field>
            </div>
          </div>

          {/* COL 2 — Date + Partner + Remark + Summary */}
          <div
            className="collection-details-panel"
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              padding: "10px",
              display: "flex",
              flexDirection: "column",
              gap: 5,
              minWidth: 0,
              position: "relative",
              zIndex: 2
            }}
          >
            <SectionTitle>Details</SectionTitle>

            <Field label="Submission Date">
              <input
                type="date"
                value={formData.submissionDate}
                readOnly
                style={readonly}
              />
            </Field>

            <Field label="Mode of Payment *" error={error.paymentMode}>
              <ModernSelect
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleChange}
                placeholder="Select mode of payment"
                options={[
                  { value: "", label: "Select mode of payment" },
                  ...paymentModeOptions
                ]}
              />
            </Field>

            <Field label="Associate With">
              <ModernSelect
                name="partnerSelection"
                value={formData.partnerSelection}
                onChange={handleChange}
                placeholder="Select partner customer"
                searchable
                options={[
                  { value: "", label: "Select partner customer" },
                  ...(Array.isArray(partnerCustomers) ? partnerCustomers : []).map((customer) => ({
                    value: customer._id,
                    label: customer.customerName || "Unnamed partner"
                  }))
                ]}
              />
            </Field>

            <Field label="Bank Remark">
              <textarea
                name="bankRemark"
                value={formData.bankRemark}
                onChange={handleChange}
                placeholder="Enter bank remarks or notes..."
                rows={2}
                style={{
                  ...base,
                  resize: "vertical",
                  minHeight: 48,
                  lineHeight: 1.5
                }}
                onFocus={focusOn}
                onBlur={focusOff}
              />
            </Field>

            <div
              style={{
                marginTop: "auto",
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 5
              }}
            >
              <SummaryChip
                label="Net Total"
                value={totalNet}
                color="#1e40af"
                bg="#dbeafe"
                border="#93c5fd"
              />
              <SummaryChip
                label="Old Paid"
                value={data?.totalPaidAmount || 0}
                color="#0f766e"
                bg="#ccfbf1"
                border="#5eead4"
              />
              <SummaryChip
                label="Received"
                value={totalReceived}
                color="#166534"
                bg="#dcfce7"
                border="#86efac"
              />
              <SummaryChip
                label="Balance"
                value={Math.abs(totalBalance)}
                color={balColor}
                bg={
                  totalBalance > 0
                    ? "#fffbeb"
                    : totalBalance < 0
                      ? "#fff1f2"
                      : "#f0fdf4"
                }
                border={
                  totalBalance > 0
                    ? "#fde047"
                    : totalBalance < 0
                      ? "#fda4af"
                      : "#86efac"
                }
                suffix={totalBalance < 0 ? " (Excess)" : ""}
              />
            </div>
          </div>

          {/* COL 3 — Payment Table */}
          <div
            className="collection-payment-panel"
            style={{
              background: "#fff",
              borderRadius: 12,
              border: "1px solid #e2e8f0",
              padding: "13px",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              minWidth: 0
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <SectionTitle>Payment Entries</SectionTitle>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 82px 78px 82px",
                gap: 5,
                padding: "5px 7px",
                background: "#f8fafc",
                borderRadius: "8px 8px 0 0",
                border: "1px solid #e2e8f0",
                borderBottom: "none"
              }}
            >
              {["Description", "Net Amt", "Balance", "Received"].map((h, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em"
                  }}
                >
                  {h}
                </span>
              ))}
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                border: "1px solid #e2e8f0",
                borderTop: "none",
                borderRadius: "0 0 10px 10px"
              }}
            >
              {paymentRows.map((row, idx) => {
                console.log(row)
                if (
                  row?.productorservicetype === "Additionalservice" &&
                  ishaveprimaryProduct
                )
                  return
                const locked = isRowLocked(row)
                const bal = rowBalance(row)
                const bc = bal > 0 ? "#b45309" : bal < 0 ? "#be123c" : "#166534"
                const bb = bal > 0 ? "#fffbeb" : bal < 0 ? "#fff1f2" : "#f0fdf4"
                const bbd =
                  bal > 0 ? "#fde068" : bal < 0 ? "#fca5a5" : "#86efac"

                return (
                  <div
                    key={row.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 82px 78px 82px",
                      gap: 5,
                      alignItems: "center",
                      padding: "6px 7px",
                      background: locked
                        ? "#f8faff"
                        : idx % 2 === 0
                          ? "#fff"
                          : "#fafbff",
                      borderBottom:
                        idx < paymentRows.length - 1
                          ? "1px solid #f1f5f9"
                          : "none"
                    }}
                  >
                    <Tooltip text={row.label}>
                      <div
                        style={{
                          padding: "4px 7px",
                          fontSize: 11,
                          border: "1px solid #e2e8f0",
                          borderRadius: 6,
                          background: "#f1f5f9",
                          color: "#374151",
                          fontFamily: "inherit",
                          fontWeight: 500,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          cursor: "default",
                          borderLeft: "3px solid #818cf8"
                        }}
                      >
                        {row.label}
                      </div>
                    </Tooltip>

                    <AmtInput
                      value={row.netAmount}
                      onChange={(v) => updateRow(row.id, "netAmount", v)}
                    />

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "4px 6px",
                        borderRadius: 6,
                        color: bc,
                        background: bb,
                        border: `1px solid ${bbd}`,
                        whiteSpace: "nowrap",
                        overflow: "hidden"
                      }}
                    >
                      <IndianRupee size={9} />
                      <span
                        style={{ overflow: "hidden", textOverflow: "ellipsis" }}
                      >
                        {Math.abs(bal).toLocaleString("en-IN", {
                          maximumFractionDigits: 0
                        })}
                      </span>
                    </div>

                    {locked ? (
                      <div
                        title="Fully paid — no balance remaining"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 3,
                          fontSize: 10,
                          fontWeight: 700,
                          color: "#166534",
                          background: "#dcfce7",
                          border: "1px solid #86efac",
                          borderRadius: 6,
                          padding: "4px 5px",
                          cursor: "not-allowed"
                        }}
                      >
                        <Lock size={9} /> Paid
                      </div>
                    ) : (
                      <AmtInput
                        value={row.receivedAmount}
                        onChange={(v) => updateRow(row.id, "receivedAmount", v)}
                        highlight
                      />
                    )}
                  </div>
                )
              })}
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 82px 78px 82px",
                gap: 5,
                padding: "6px 7px",
                background: "#f0f9ff",
                border: "1px solid #bae6fd",
                borderRadius: "0 0 10px 10px",
                marginTop: 4
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "#0369a1" }}>
                Total
              </span>
              <TotalCell value={totalNet} color="#0369a1" />
              <TotalCell value={totalBalance} color={balColor} abs />
              <TotalCell value={totalReceived} color="#166534" green />
            </div>
          </div>
        </form>

        {/* ── FOOTER ── */}
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 10,
            padding: "8px 14px",
            borderTop: "1px solid #e2e8f0",
            background: "#f8fafc"
          }}
        >
          <button
            type="button"
            onClick={() => {
              closemodal(false)

              setishavePayment(false)
            }}
            style={{
              padding: "7px 18px",
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
              background: "#fff",
              border: "1.5px solid #e2e8f0",
              cursor: "pointer"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f1f5f9"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff"
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="collection-form"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 22px",
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(37,99,235,0.35)"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(135deg,#1e40af,#1d4ed8)"
              e.currentTarget.style.boxShadow =
                "0 4px 14px rgba(37,99,235,0.45)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(135deg,#1d4ed8,#2563eb)"
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(37,99,235,0.35)"
            }}
          >
            <ClipboardCheck size={13} />
            {from === "followup" ? "Continue" : "Update Collection"}
          </button>
        </div>
        {popupOpen && (
          <PopUp
            isOpen={popupOpen}
            onClose={onClose}
            message={
              "Amount must be a positive number greater than 0. Please do not enter empty, negative, or invalid values."
            }
          />
        )}
      </div>
    </div>
  )
}
