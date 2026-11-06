import { useEffect, useState } from "react"
import { X, Edit2, Save, DollarSign, Trash2 } from "lucide-react"
import { PropagateLoader } from "react-spinners"
import { toast } from "react-toastify"
import api from "../../api/api"
import { AlertTriangle, CheckCircle2, ShieldAlert, Receipt } from "lucide-react"
export const PaymentHistoryModal = ({
  data,
  showAction = true,
  balanceAmount,
  isforcefullyclosed,
  isChecked,
  leadid,
  onClose,
  leadDocId,
  loggedUser,
  refresh,
  setdata,
  verifiedLead,
  selectedLead,
  setselectedLeadId,
  isdepartmentisAccountant = false
}) => {
  console.log(isdepartmentisAccountant)
  console.log(selectedLead)
  console.log(showAction)
  console.log(verifiedLead)
  console.log(data)
  console.log(leadDocId)
  console.log(isChecked)
  console.log(balanceAmount)
  const [messageRowIndex, setMessageRowIndex] = useState(null)
  console.log(messageRowIndex)
  const [originalReceivedAmount, setoriginalReceivedAmount] = useState(0)
  console.log(originalReceivedAmount)
  const [originalIndex, setOriginalIndex] = useState(null)
  const [editingRow, setEditingRow] = useState(null)
  const [editmessage, seteditMessage] = useState("")
  console.log(editmessage)
  const [message, setMessage] = useState({})
  console.log(message)
  const [excessamountWarning, setexcessAmountWarning] = useState(null)
  const [editedData, setEditedData] = useState({})
  const [checkverified, setcheckverified] = useState({})
  console.log(checkverified)
  const [ispermissionEdit, setispermissionEdit] = useState(false)

  const [submitLoading, setsubmitLoading] = useState(false)
  const [verifyDate, setVerifyDate] = useState("")

  const toDateInputValue = (date) => {
    if (!date) return ""

    const parsedDate = new Date(date)
    if (Number.isNaN(parsedDate.getTime())) return ""

    return [
      parsedDate.getFullYear(),
      String(parsedDate.getMonth() + 1).padStart(2, "0"),
      String(parsedDate.getDate()).padStart(2, "0")
    ].join("-")
  }

  useEffect(() => {
    if (!verifiedLead) {
      setVerifyDate("")
      return
    }

    const verifiedPayments = data.filter((payment) => payment?.paymentVerified)
    const paymentForDefaultDate =
      verifiedPayments[verifiedPayments.length - 1] || data[data.length - 1]

    setVerifyDate(toDateInputValue(paymentForDefaultDate?.paymentDate))
  }, [data, verifiedLead])

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0
    }).format(amount)
  }
  console.log(messageRowIndex)
  const handleEdit = (row, originalIndex, index) => {
    console.log(index)
    console.log("hh")
    setMessageRowIndex(index)
    if (row.paymentVerified) {
      console.log("hh")
      seteditMessage("Amount is verified, can't edit")

      setTimeout(() => {
        seteditMessage("")
        setMessageRowIndex(null)
      }, 2000)

      return
    }
    console.log("hh")
    seteditMessage("")
    // setMessageRowIndex(null)
    const checkpermission = loggedUser?._id === row.receivedBy._id
    console.log(row.receivedBy)
    setispermissionEdit(checkpermission)
    console.log(checkpermission)
    if (!checkpermission) {
      const receiverName = row.receivedBy?.name?.toUpperCase()

      setMessage((prev) => ({
        ...prev,
        warning: `You cannot edit this payment. Only ${receiverName} can make changes.`
      }))
      setTimeout(() => {
        setMessage({})
        setMessageRowIndex(null)
      }, 2000)
      return
    }
    if (message.warning) {
      setMessage((prev) => ({
        ...prev,
        warning: ""
      }))
    }
    setEditingRow(index)
    setOriginalIndex(originalIndex)
    setEditedData({
      paymentDate: new Date(),
      receivedAmount: row.receivedAmount,
      remarks: row.remarks,
      bankRemarks: row.bankRemarks
    })
    setoriginalReceivedAmount(row.receivedAmount)
    console.log("hhh")
  }
  console.log(editedData)
  const handleSave = async () => {
    try {
      setoriginalReceivedAmount(0)
      setsubmitLoading(true)
      const response = await api.post(
        `/lead/updatereceivedAmount?leadDocId=${leadDocId}&index=${originalIndex}`,
        editedData
      )
      if (response.status === 200) {
        setsubmitLoading(false)
        setEditedData({})
        setEditingRow(null)
        setOriginalIndex(null)
        setispermissionEdit(false)
        toast.success("payment updated succesfully")
        refresh()
      }
    } catch (error) {
      console.log("error", error.messgae)
      toast.error("something went wrong")
      setsubmitLoading(false)
    }
  }

  const handleCancel = () => {
    setEditingRow(null)
    setOriginalIndex(null)
    setEditedData({})
    setoriginalReceivedAmount(0)
  }
  console.log("h")
  const handleInputChange = (field, value) => {
    console.log(totalAmount)
    console.log(editedData)
    console.log(balanceAmount)
    const numericValue = Number(value)
    const maxAllowed = Number(originalReceivedAmount) + Number(balanceAmount)
    console.log(maxAllowed)
    console.log(numericValue)
    console.log(originalReceivedAmount)

    if (numericValue > maxAllowed) {
      toast.warning(`Received amount cannot be greater than ${maxAllowed}`)
      return
    }

    setEditedData((prev) => ({
      ...prev,
      [field]: value
    }))
  }
  const handleSaveVerifyDate = async () => {
    if (!verifyDate) {
      toast.error("Select a verify date")
      return
    }

    const paymentHistoryIndexes = data
      .filter((payment) => payment?.paymentVerified)
      .map((payment, index) => payment?.originalIndex ?? index)

    try {
      setsubmitLoading(true)
      await api.post(
        `/lead/approveforcefullyclosetarget?leadDocId=${leadDocId}`,
        { verifyDate, paymentHistoryIndexes }
      )
      toast.success("Verify date saved successfully")
      refresh()
    } catch (error) {
      console.error("Unable to save verify date", error)
      toast.error("Unable to save verify date")
    } finally {
      setsubmitLoading(false)
    }
  }

  const handleVerify = async (index, isCurrentlyVerified) => {
    console.log(index)
    console.log(!isCurrentlyVerified)
    console.log(loggedUser?._id)

    try {
      setsubmitLoading(true)
      const payload = {
        isverified: !isCurrentlyVerified,
        index: index,
        leadId: leadDocId,
        verifiedBy: loggedUser?._id
      }
      const response = await api.put("/lead/paymentverification", payload)
      console.log(response.status)
      if (response.status === 200) {
        refresh()
        setdata([])
        setsubmitLoading(false)
        setcheckverified((prev) => ({
          ...prev,
          [index]: !isCurrentlyVerified
        }))
      }
      if (isCurrentlyVerified) {
        toast.success("Payment univerified succssfully")
      } else {
        toast.success("Payment verified successfully")
      }
    } catch (error) {
      console.log(error)
      toast.error("Something went wrong")
      setsubmitLoading(false)
    }
  }
  const handleUnverify = async (index) => {
    console.log(index)

    try {
      setsubmitLoading(true)
      const payload = {
        index: index,
        leadId: leadDocId,
        unVerify: true
      }
      const response = await api.put("/lead/paymentunverify", payload)
      if (response.status === 200) {
        refresh()
        setdata([])
        setsubmitLoading(false)
        setcheckverified((prev) => ({
          ...prev,
          [index]: false
        }))
      }

      toast.success("Payment unverified succssfully")
    } catch (error) {
      console.log(error)
      toast.error("Something went wrong")
      setsubmitLoading(false)
    }
  }

  const handleRejectCollection = async (paymentIndex, amount) => {
    const confirmed = window.confirm(
      `Reject the ${formatAmount(amount)} collection? This removes it from payment history and recalculates the lead balance.`
    )
    if (!confirmed) return

    try {
      setsubmitLoading(true)
      const response = await api.post("/lead/rejectCollectionPayment", {
        leadDocId,
        paymentIndex
      })

      toast.success(response.data?.message || "Collection rejected successfully")
      onClose(false)
      setselectedLeadId(null)
      refresh()
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to reject collection")
    } finally {
      setsubmitLoading(false)
    }
  }

  const totalAmount = data.reduce(
    (sum, item) => sum + (item.receivedAmount || 0),
    0
  )
  const hasExcessAmount = selectedLead?.excessAmount > 0
  console.log(data)
  return (
    // <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
    //   <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden ring-1 ring-black/5">
    //     {/* Header */}
    //     <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 px-4 sm:px-6 py-3 md:py-4 flex items-center justify-between">
    //       <div className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
    //       <div className="relative flex items-center gap-3">
    //         <span className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
    //           <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
    //         </span>
    //         <div>
    //           <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
    //             Payment History
    //           </h2>
    //           <p className="text-xs sm:text-sm text-blue-100">
    //             Lead ID: {leadid}
    //           </p>
    //         </div>
    //       </div>
    //       <button
    //         onClick={() => {
    //           setMessage((prev) => ({ ...prev, warning: "" }))
    //           onClose(false)
    //           setselectedLeadId(null)
    //           setoriginalReceivedAmount(0)
    //         }}
    //         className="relative text-white/90 hover:bg-white/15 rounded-full p-2 transition-colors"
    //       >
    //         <X className="w-5 h-5 sm:w-6 sm:h-6" />
    //       </button>
    //     </div>

    //     {submitLoading && (
    //       <div className="flex justify-center py-3">
    //         <PropagateLoader color="#3b82f6" size={10} />
    //       </div>
    //     )}

    //     {/* Summary Card */}
    //     <div className="bg-gradient-to-r from-emerald-50 via-white to-emerald-50 border-b border-emerald-100 px-4 sm:px-6 py-3.5">
    //       <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 sm:gap-3">
    //         <div className="flex items-center gap-2 justify-self-start">
    //           <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100">
    //             <Receipt className="w-4 h-4 text-emerald-600" />
    //           </span>
    //           <div>
    //             <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">
    //               Total Received
    //             </p>
    //             <p className="text-lg font-bold text-emerald-700">
    //               {formatAmount(totalAmount)}
    //             </p>
    //           </div>
    //         </div>

    //         <div className="justify-self-center">
    //           {hasExcessAmount && (
    //             <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 border border-red-200 px-3 py-1.5 text-xs sm:text-sm font-medium text-red-600">
    //               <AlertTriangle className="w-3.5 h-3.5 flex-none" />
    //               ⚠️ This lead has an excess amount of{" "}
    //               <b>₹{selectedLead.excessAmount}</b>. Please edit the lead and
    //               adjust the excess amount before proceeding.
    //             </span>
    //           )}
    //         </div>

    //         <div className="flex items-center gap-2 justify-self-start sm:justify-self-end">
    //           <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100">
    //             <ShieldAlert className="w-4 h-4 text-blue-600" />
    //           </span>
    //           <div>
    //             <p className="text-[11px] uppercase tracking-wide text-gray-400 font-medium">
    //               Balance Amount
    //             </p>
    //             <p className="text-lg font-bold text-blue-700">
    //               {formatAmount(balanceAmount)}
    //             </p>
    //           </div>
    //         </div>
    //       </div>
    //     </div>

    //     {/* Table Container */}
    //     <div className="flex-1 p-3 sm:p-6 overflow-hidden flex flex-col">
    //       <div className="overflow-x-auto overflow-y-auto rounded-xl border border-gray-200">
    //         <table className="w-full border-collapse min-w-[800px]">
    //           <thead className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white z-10">
    //             <tr>
    //               <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">
    //                 Payment Date
    //               </th>
    //               <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">
    //                 Payment Done By
    //               </th>
    //               <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">
    //                 Payment Amount
    //               </th>
    //               <th className="px-3 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold whitespace-nowrap">
    //                 Bank Remarks
    //               </th>
    //               {!verifiedLead && showAction && (
    //                 <th className="px-3 sm:px-4 py-3 text-center text-xs sm:text-sm font-semibold whitespace-nowrap">
    //                   Actions
    //                 </th>
    //               )}
    //             </tr>
    //           </thead>
    //           <tbody>
    //             {data.map((row, index) => {
    //               const isEditing = editingRow === index
    //               return (
    //                 <tr
    //                   key={row._id}
    //                   className={`border-b border-gray-100 hover:bg-blue-50/40 transition-colors ${
    //                     index % 2 === 0 ? "bg-white" : "bg-gray-50/60"
    //                   }`}
    //                 >
    //                   <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-600 whitespace-nowrap">
    //                     {formatDate(row.paymentDate)}
    //                   </td>
    //                   <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm whitespace-nowrap">
    //                     <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium ring-1 ring-blue-100">
    //                       {row?.receivedBy?.name?.toUpperCase()}
    //                     </span>
    //                   </td>
    //                   <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm whitespace-nowrap">
    //                     {isEditing && ispermissionEdit ? (
    //                       <input
    //                         type="number"
    //                         value={editedData.receivedAmount}
    //                         onChange={(e) =>
    //                           handleInputChange(
    //                             "receivedAmount",
    //                             parseFloat(e.target.value)
    //                           )
    //                         }
    //                         className="w-32 px-2 py-1.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0"
    //                       />
    //                     ) : (
    //                       <span
    //                         className={`font-semibold ${
    //                           row.receivedAmount > 0
    //                             ? "text-emerald-600"
    //                             : "text-gray-400"
    //                         }`}
    //                       >
    //                         {formatAmount(row.receivedAmount)}
    //                       </span>
    //                     )}
    //                   </td>

    //                   <td className="px-3 sm:px-4 py-3 text-sm sm:text-xs">
    //                     {isEditing && ispermissionEdit ? (
    //                       <input
    //                         type="text"
    //                         value={editedData.bankRemarks}
    //                         onChange={(e) =>
    //                           handleInputChange("bankRemarks", e.target.value)
    //                         }
    //                         className="w-full px-2 py-1.5 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
    //                         placeholder="Enter bank remarks"
    //                       />
    //                     ) : (
    //                       <span className="text-gray-600 block max-w-xs whitespace-normal break-all">
    //                         {row.bankRemarks || ""}
    //                       </span>
    //                     )}
    //                   </td>

    //                   {!verifiedLead && showAction && (
    //                     <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-center">
    //                       {isEditing ? (
    //                         <div className="flex items-center justify-center gap-2">
    //                           <button
    //                             onClick={() => handleSave()}
    //                             className="p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
    //                             title="Save"
    //                           >
    //                             <Save className="w-4 h-4" />
    //                           </button>
    //                           <button
    //                             onClick={handleCancel}
    //                             className="p-1.5 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors shadow-sm"
    //                             title="Cancel"
    //                           >
    //                             <X className="w-4 h-4" />
    //                           </button>
    //                         </div>
    //                       ) : (
    //                         !isdepartmentisAccountant && (
    //                           <div className="flex flex-col items-center gap-1">
    //                             <button
    //                               onClick={() =>
    //                                 handleEdit(row, row.originalIndex, index)
    //                               }
    //                               className="p-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
    //                               title="Edit"
    //                             >
    //                               <Edit2 className="w-4 h-4" />
    //                             </button>

    //                             {/* {editmessage &&
    //                               messageRowIndex === row.originalIndex && (
    //                                 <span className="text-xs text-red-600 font-medium">
    //                                   {editmessage}
    //                                 </span>
    //                               )} */}
    //                             {message &&message.warning&&
    //                               messageRowIndex === row.originalIndex && (
    //                                 <span className="text-xs text-red-600 font-medium">
    //                                   {message?.warning}
    //                                 </span>
    //                               )}
    //                           </div>
    //                         )
    //                       )}
    //                       {isdepartmentisAccountant && (
    //                         <button
    //                           onClick={() =>
    //                             handleVerify(row.originalIndex, checkverified)
    //                           }
    //                           className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white transition-colors ml-2 font-semibold text-xs sm:text-sm shadow-sm ${
    //                             checkverified?.[row.originalIndex]
    //                               ? "bg-emerald-500 hover:bg-emerald-600"
    //                               : "bg-orange-400 hover:bg-orange-500"
    //                           }`}
    //                         >
    //                           {checkverified?.[row.originalIndex] ? (
    //                             <CheckCircle2 className="w-3.5 h-3.5" />
    //                           ) : (
    //                             <AlertTriangle className="w-3.5 h-3.5" />
    //                           )}
    //                           {checkverified?.[row.originalIndex]
    //                             ? "Verified"
    //                             : "Not Verified"}
    //                         </button>
    //                       )}
    //                     </td>
    //                   )}
    //                 </tr>
    //               )
    //             })}
    //           </tbody>
    //         </table>
    //       </div>

    //       {data.length === 0 && (
    //         <div className="text-center py-14">
    //           <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 ring-1 ring-gray-100">
    //             <Receipt className="w-5 h-5 text-gray-300" />
    //           </span>
    //           <p className="text-gray-500 text-sm sm:text-base">
    //             No payment history available
    //           </p>
    //         </div>
    //       )}
    //     </div>

    //     {/* Footer */}
    //     <div className="bg-gray-50 px-4 sm:px-6 py-3 border-t border-gray-200 flex flex-wrap justify-between items-center gap-3">
    //       <p className="text-xs sm:text-sm text-gray-600">
    //         Total Records:{" "}
    //         <span className="font-semibold text-gray-800">{data.length}</span>
    //       </p>

    //       {isdepartmentisAccountant &&
    //         warningMessage &&
    //         !isforcefullyclosed && (
    //           <div className="flex items-center gap-3">
    //             <p className="text-red-500 text-sm font-medium flex items-center gap-1.5">
    //               <AlertTriangle className="w-4 h-4" />
    //               {warningMessage}
    //             </p>
    //             <button
    //               onClick={() => handleCloseTarget()}
    //               className="px-4 py-2 bg-orange-400 text-white rounded-lg hover:bg-orange-500 transition-colors text-sm font-medium shadow-sm"
    //             >
    //               Closed Target
    //             </button>
    //           </div>
    //         )}

    //       <button
    //         onClick={() => {
    //           onClose(false)
    //           setMessage((prev) => ({ ...prev, warning: "" }))
    //           setselectedLeadId(null)
    //           setoriginalReceivedAmount(0)
    //         }}
    //         className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium shadow-sm"
    //       >
    //         Close
    //       </button>
    //     </div>
    //   </div>
    // </div>
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-history-title"
    >
      <div className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-6xl sm:rounded-2xl">
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-700 px-4 py-3 sm:px-6 sm:py-4">
          <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 sm:h-11 sm:w-11">
                <DollarSign className="h-5 w-5 text-white sm:h-6 sm:w-6" />
              </span>

              <div className="min-w-0">
                <h2
                  id="payment-history-title"
                  className="truncate text-base font-bold text-white sm:text-xl"
                >
                  Payment History
                </h2>

                <p className="truncate text-xs text-blue-100 sm:text-sm">
                  Lead ID: {leadid || "—"}
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close payment history"
              onClick={() => {
                setMessage((prev) => ({ ...prev, warning: "" }))
                onClose(false)
                setselectedLeadId(null)
                setoriginalReceivedAmount(0)
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/60"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Loading indicator */}
        {submitLoading && (
          <div className="shrink-0 border-b border-blue-100 bg-blue-50 px-4 py-2.5">
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-blue-700">
              <PropagateLoader color="#2563eb" size={7} />
              <span>Updating payment details...</span>
            </div>
          </div>
        )}

        {/* Overall warning */}
        {message?.warning && messageRowIndex === null && (
          <div
            role="alert"
            className="mx-4 mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 sm:mx-6"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="break-words">{message.warning}</p>
          </div>
        )}

        {/* Summary */}
        <div className="shrink-0 border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-blue-50 px-4 py-3 sm:px-6">
          {/* <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:items-center">

        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
            <Receipt className="h-4 w-4 text-emerald-600" />
          </span>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-[11px]">
              Total received
            </p>
            <p className="truncate text-base font-bold text-emerald-700 sm:text-lg">
              {formatAmount(totalAmount)}
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2 lg:justify-self-end">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100">
            <ShieldAlert className="h-4 w-4 text-blue-600" />
          </span>

          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-[11px]">
              Balance amount
            </p>
            <p className="truncate text-base font-bold text-blue-700 sm:text-lg">
              {formatAmount(balanceAmount)}
            </p>
          </div>
        </div>

        {hasExcessAmount && (
          <div
            role="alert"
            className="col-span-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 lg:col-span-1 lg:justify-self-center"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

            <p className="leading-5">
              Excess amount:{" "}
              <span className="font-bold">
                {formatAmount(selectedLead?.excessAmount || 0)}
              </span>
              . Edit the lead and adjust it before proceeding.
            </p>
          </div>
        )}
      </div> */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                <Receipt className="h-4 w-4 text-emerald-600" />
              </span>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Total received
                </p>
                <p className="text-lg font-bold text-emerald-700">
                  {formatAmount(totalAmount)}
                </p>
              </div>
            </div>

            {hasExcessAmount && (
              <div
                role="alert"
                className="flex max-w-xl items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:mx-4"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p>
                  Excess amount:{" "}
                  <span className="font-bold">
                    {formatAmount(selectedLead?.excessAmount || 0)}
                  </span>
                  . Please edit the lead and adjust it before proceeding.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 sm:ml-auto">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                <ShieldAlert className="h-4 w-4 text-blue-600" />
              </span>

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  Balance amount
                </p>
                <p className="text-lg font-bold text-blue-700">
                  {formatAmount(balanceAmount)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-5">
          {data.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-14 text-center">
              <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Receipt className="h-6 w-6 text-slate-400" />
              </span>

              <p className="text-base font-semibold text-slate-700">
                No payment history available
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Payment records will appear here after a payment is received.
              </p>
            </div>
          ) : (
            <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[900px] table-fixed border-collapse text-sm">
                <colgroup>
                  <col
                    className={
                      showAction ? "w-[18%]" : "w-[20%]"
                    }
                  />
                  {verifiedLead && <col className={showAction ? "w-[16%]" : "w-[18%]"} />}
                  <col
                    className={
                      showAction ? "w-[18%]" : "w-[20%]"
                    }
                  />
                  <col
                    className={
                      showAction ? "w-[14%]" : "w-[16%]"
                    }
                  />
                  <col className={verifiedLead ? (showAction ? "w-[22%]" : "w-[26%]") : (showAction ? "w-[38%]" : "w-[44%]")} />

                  {showAction && <col className="w-[12%]" />}
                </colgroup>

                <thead className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                      Payment date
                    </th>

                    {verifiedLead && <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">Verified date</th>}

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                      Received by
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">
                      Amount
                    </th>

                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">
                      Bank remarks
                    </th>

                    {showAction && <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide">Actions</th>}
                  </tr>
                </thead>

                <tbody>
                  {data.map((row, index) => {
                    const isEditing = editingRow === index
                    console.log(row)
                    const receivedByName =
                      row?.receivedBy?.name?.trim()?.toUpperCase() || "—"

                    const rowKey =
                      row?._id ||
                      `${row?.originalIndex ?? index}-${row?.paymentDate ?? "payment"}`

                    const rowOriginalIndex = row?.originalIndex ?? index
                    // `paymentVerified` comes from the database. The local map
                    // only overrides it immediately after an action, before the
                    // refreshed collection list returns.
                    const isPaymentVerified =
                      checkverified?.[rowOriginalIndex] ??
                      Boolean(row?.paymentVerified)
                    const verifiedDate =
                      isPaymentVerified && row?.verifiedAt
                        ? formatDate(row.verifiedAt)
                        : "—"

                    return (
                      <tr
                        key={rowKey}
                        className={`border-b border-slate-100 align-middle transition-colors hover:bg-blue-50/60 ${
                          index % 2 === 0 ? "bg-white" : "bg-slate-50/70"
                        }`}
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                          {formatDate(row?.paymentDate)}
                        </td>

                        {verifiedLead && <td className="whitespace-nowrap px-4 py-3 text-sm">
                          {isPaymentVerified && row?.verifiedAt ? (
                            <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                              {verifiedDate}
                            </span>
                          ) : (
                            <span className="text-slate-400">{verifiedDate}</span>
                          )}
                        </td>}

                        <td className="px-4 py-3">
                          <span
                            title={receivedByName}
                            className="inline-flex max-w-full truncate rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100"
                          >
                            {receivedByName}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right">
                          {isEditing && ispermissionEdit ? (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={editedData?.receivedAmount ?? ""}
                              onChange={(event) => {
                                const value = event.target.value

                                handleInputChange(
                                  "receivedAmount",
                                  value === "" ? "" : Number(value)
                                )
                              }}
                              className="ml-auto block w-full max-w-[140px] rounded-lg border border-blue-300 px-2 py-1.5 text-right text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                              aria-label="Payment amount"
                            />
                          ) : (
                            <span
                              className={`font-bold ${
                                Number(row?.receivedAmount) > 0
                                  ? "text-emerald-600"
                                  : "text-slate-400"
                              }`}
                            >
                              {formatAmount(row?.receivedAmount || 0)}
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          {isEditing && ispermissionEdit ? (
                            <input
                              type="text"
                              value={editedData?.bankRemarks ?? ""}
                              onChange={(event) =>
                                handleInputChange(
                                  "bankRemarks",
                                  event.target.value
                                )
                              }
                              className="block w-full rounded-lg border border-blue-300 px-2 py-1.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                              placeholder="Enter bank remarks"
                              aria-label="Bank remarks"
                            />
                          ) : (
                            <p
                              title={
                                row?.bankRemarks?.trim() || "No bank remarks"
                              }
                              className="line-clamp-2 break-words text-sm leading-5 text-slate-600"
                            >
                              {row?.bankRemarks?.trim() || "—"}
                            </p>
                          )}
                        </td>

                        {!verifiedLead && showAction && (
                          <td className="px-3 py-3 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              {isEditing ? (
                                ispermissionEdit ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={handleSave}
                                      disabled={submitLoading}
                                      className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                      title="Save changes"
                                    >
                                      <Save className="h-3.5 w-3.5" />
                                      Save
                                    </button>

                                    <button
                                      type="button"
                                      onClick={handleCancel}
                                      disabled={submitLoading}
                                      className="inline-flex h-8 items-center gap-1 rounded-lg bg-slate-500 px-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                                      title="Cancel editing"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-xs font-medium text-slate-500">
                                    Editing is not permitted
                                  </span>
                                )
                              ) : (
                                <>
                                  {!isdepartmentisAccountant &&
                                    (row.paymentVerified ? (
                                      <span className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        Verified
                                      </span>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleEdit(
                                            row,
                                            rowOriginalIndex,
                                            index
                                          )
                                        }
                                        disabled={submitLoading}
                                        className="inline-flex h-8 items-center gap-1 rounded-lg bg-blue-600 px-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                        title="Edit payment"
                                      >
                                        <Edit2 className="h-3.5 w-3.5" />
                                        Edit
                                      </button>
                                    ))}

                                  {isdepartmentisAccountant && (
                                    <>
                                      {isPaymentVerified ? (
                                        <span className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                          <CheckCircle2 className="h-3.5 w-3.5" />
                                          Verified
                                        </span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleVerify(rowOriginalIndex, false)
                                          }
                                          disabled={submitLoading}
                                          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-500 px-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                          <AlertTriangle className="h-3.5 w-3.5" />
                                          Verify
                                        </button>
                                      )}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRejectCollection(
                                            rowOriginalIndex,
                                            row?.receivedAmount
                                          )
                                        }
                                        disabled={submitLoading}
                                        className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                        title="Reject and remove collection"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Reject
                                      </button>
                                    </>
                                  )}
                                </>
                              )}

                              {message?.warning &&
                                messageRowIndex === rowOriginalIndex && (
                                  <p
                                    role="alert"
                                    className="w-full max-w-[210px] rounded-md border border-red-200 bg-red-50 px-2 py-1 text-left text-xs leading-4 text-red-700"
                                  >
                                    {message.warning}
                                  </p>
                                )}
                              {editmessage &&
                                messageRowIndex === row.originalIndex && (
                                  <span className="text-xs text-red-600 font-medium">
                                    {editmessage}
                                  </span>
                                )}
                            </div>
                          </td>
                        )}
                        {verifiedLead && showAction && (
                          <td className="px-3 py-3 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                              {isdepartmentisAccountant && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUnverify(rowOriginalIndex)
                                    }
                                    disabled={submitLoading}
                                    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-amber-500 px-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Unverify
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRejectCollection(
                                        rowOriginalIndex,
                                        row?.receivedAmount
                                      )
                                    }
                                    disabled={submitLoading}
                                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    title="Reject and remove collection"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Reject
                                  </button>
                                </>
                              )}

                              {message?.warning &&
                                messageRowIndex === rowOriginalIndex && (
                                  <p
                                    role="alert"
                                    className="w-full max-w-[210px] rounded-md border border-red-200 bg-red-50 px-2 py-1 text-left text-xs leading-4 text-red-700"
                                  >
                                    {message.warning}
                                  </p>
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
          )}
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 sm:px-6">
          <p className="text-sm text-slate-600">
            Total records:{" "}
            <span className="font-bold text-slate-800">{data.length}</span>
          </p>

          <div className="ml-auto flex flex-wrap items-center justify-end gap-2 sm:gap-3">
            {isdepartmentisAccountant && verifiedLead && (
              <div className="flex flex-wrap items-end gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                <label className="flex flex-col gap-1 text-xs font-semibold text-emerald-800">
                  Verify date
                  <input
                    type="date"
                    value={verifyDate}
                    onChange={(event) => setVerifyDate(event.target.value)}
                    disabled={submitLoading}
                    className="h-8 rounded-md border border-emerald-200 bg-white px-2 text-sm font-medium text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                </label>
                <button
                  type="button"
                  onClick={handleSaveVerifyDate}
                  disabled={submitLoading || !verifyDate}
                  className="inline-flex h-8 items-center rounded-md bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Save verify date
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                onClose(false)
                setMessage((prev) => ({ ...prev, warning: "" }))
                setselectedLeadId(null)
                setoriginalReceivedAmount(0)
              }}
              disabled={submitLoading}
              className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
