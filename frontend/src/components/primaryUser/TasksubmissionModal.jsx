// import { useState } from "react"
// import api from "../../api/api"
// import { toast } from "react-toastify"
// import { PropagateLoader } from "react-spinners"
// export default function TasksubmissionModal({
//   task,
//   refresh,
//   pending,
//   setShowComponent
// }) {
//   console.log(task)
//   const [isOpen, setIsOpen] = useState(true)
//   const [submitloading, setsubmitLoading] = useState(false)
//   const [taskDetails, setTaskDetails] = useState({
//     leadId: task?.leadId,
//     taskassignedBy: task?.matchedlog?.submittedUser?.name,
//     taskassignedmodel: task?.matchedlog?.submissiondoneByModel,
//     taskassignedDate: task?.matchedlog?.allocationDate,
//     taskDescriptionByassigner: task?.matchedlog?.remarks,
//     taskName: task?.matchedlog?.taskId?._id,
// task:task?.matchedlog?.taskId?.taskName,
//     submissionDate: new Date(),
//     leadDocId: task?.leadDocId,
//     allocatedTo: task?.allocatedTo,
//     allocatedtomodel: task?.matchedlog?.taskallocatedToModel,
//     taskfromFollowup: task?.matchedlog?.taskfromFollowup,
//     taskDescription: task?.matchedlog?.taskDescription
//   })
// console.log(taskDetails)
//   const [error, setError] = useState({
//     descriptionerror: ""
//   })
//   //   const [pending, setPending] = useState(true)

//   const handleSubmit = async () => {
//     if (!taskDetails.taskDescription.trim()) {
//       setError({ descriptionerror: "Description is required" })
//       return
//     }
//     try {
//       console.log(taskDetails)
// if(submitloading)return
// console.log(taskDetails)

//       setsubmitLoading(true)
//       const response = await api.post("/lead/taskSubmission", taskDetails)
//       toast.success(response.data.message)
//       setsubmitLoading(false)
//       setShowComponent(false)
//       refresh()
//     } catch (error) {
//       setsubmitLoading(false)
//       toast.error("something went wrong")
//       console.log(error)
//     }
//     setIsOpen(false)
//   }

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//       <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
//         {/* Modal Header */}
//         <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-t-xl">
//           <div className="flex items-center justify-between">
//             <h2 className="text-xl font-bold">Task Details</h2>
//             <div className="text-xl font-semibold">
//               <span className="mr-1">LEAD ID :</span>
//               <span>{taskDetails?.leadId}</span>
//             </div>

//             <button
//               onClick={() => setShowComponent(false)}
//               className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
//             >
//               <svg
//                 className="w-6 h-6"
//                 fill="none"
//                 viewBox="0 0 24 24"
//                 stroke="currentColor"
//               >
//                 <path
//                   strokeLinecap="round"
//                   strokeLinejoin="round"
//                   strokeWidth={2}
//                   d="M6 18L18 6M6 6l12 12"
//                 />
//               </svg>
//             </button>
//           </div>
//         </div>
//         {submitloading && (
//           <div className="flex justify-center mt-1">
//             <PropagateLoader color="#3b82f6" size={10} />
//           </div>
//         )}

//         {/* Modal Body */}
//         <div className="p-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
//             {/* Task Assigned By */}
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 Task Assigned By
//               </label>
//               <input
//                 type="text"
//                 value={taskDetails?.taskassignedBy?.toUpperCase() || ""}
//                 className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed focus:outline-none"
//                 readOnly
//               />
//             </div>
//   <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 Task Name
//               </label>
//               <input
//                 type="text"
//                 value={taskDetails?.task?.toUpperCase() || ""}
//                 className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed focus:outline-none"
//                 readOnly
//               />
//             </div>

//             {/* Completion Date */}
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 Completion Date
//               </label>
//               <input
//                 type="date"
//                 value={
//                   taskDetails?.taskassignedDate?.toString().split("T")[0] || ""
//                 }
//                 readOnly
//                 className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed focus:outline-none"
//               />
//             </div>

//             {/* Description By Assigner */}
//             <div className="md:col-span-2">
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 Description By Assigner
//               </label>
//               <textarea
//                 readOnly
//                 value={taskDetails?.taskDescriptionByassigner || ""}
//                 rows={3}
//                 className="w-full border border-gray-300 px-3 py-2 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed focus:outline-none resize-none"
//               />
//             </div>

//             {/* Task Submission Date */}
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 Task Submission Date
//               </label>
//               <input
//                 type="text"
//                 readOnly
//                 value={
//                   taskDetails?.submissionDate
//                     ?.toLocaleDateString("en-GB")
//                     .split("/")
//                     .join("-") || ""
//                 }
//                 className={`w-full border px-3 py-2 rounded-lg text-sm focus:outline-none ${
//                   pending
//                     ? "bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
//                     : "bg-gray-50 border-gray-300 text-gray-600 cursor-not-allowed"
//                 }`}
//               />
//             </div>

//             {/* Description */}
//             <div className="md:col-span-2">
//               <label className="block text-sm font-semibold text-gray-700 mb-2">
//                 Description
//               </label>
//               <textarea
//                 rows={4}
//                 value={taskDetails?.taskDescription || ""}
//                 readOnly={!pending}
//                 onChange={(e) => {
//                   setTaskDetails((prev) => ({
//                     ...prev,
//                     taskDescription: e.target.value
//                   }))
//                   if (error.descriptionerror) {
//                     setError((prev) => ({
//                       ...prev,
//                       descriptionerror: ""
//                     }))
//                   }
//                 }}
//                 className={`w-full border px-3 py-2 rounded-lg text-sm focus:outline-none resize-none ${
//                   pending
//                     ? "bg-white border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
//                     : "bg-gray-50 border-gray-300 text-gray-600 cursor-not-allowed"
//                 }`}
//                 placeholder={pending ? "Enter description..." : ""}
//               />
//               {error.descriptionerror && (
//                 <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
//                   <svg
//                     className="w-4 h-4"
//                     fill="currentColor"
//                     viewBox="0 0 20 20"
//                   >
//                     <path
//                       fillRule="evenodd"
//                       d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
//                       clipRule="evenodd"
//                     />
//                   </svg>
//                   {error.descriptionerror}
//                 </p>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Modal Footer */}

//         <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-xl border-t border-gray-200">
//           <div className="flex justify-end gap-3">
//             <button
//               onClick={() => setShowComponent(false)}
//               className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
//             >
//               Cancel
//             </button>
//             {pending && (
//               <button
//                 onClick={handleSubmit}
//                 className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
//               >
//                 Submit Task
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

import { useEffect, useState } from "react"
import api from "../../api/api"
import { toast } from "react-toastify"
import { PropagateLoader } from "react-spinners"
import {
  X,
  CalendarDays,
  User,
  ClipboardList,
  CheckCircle2,
  XCircle,
  FileText
} from "lucide-react"

export default function TasksubmissionModal({
  task,
  refresh,
  pending,
  setShowComponent
}) {
  const [submitloading, setsubmitLoading] = useState(false)
  const [status, setStatus] = useState("submitted") // submitted | rejected

  const [taskDetails, setTaskDetails] = useState({
    leadId: task?.leadId,
    taskassignedBy: task?.matchedlog?.submittedUser?.name,
    taskassignedmodel: task?.matchedlog?.submissiondoneByModel,
    taskassignedDate: task?.matchedlog?.allocationDate,
    taskDescriptionByassigner: task?.matchedlog?.remarks,
    taskName: task?.matchedlog?.taskId?._id,
    task: task?.matchedlog?.taskId?.taskName,
    submissionDate: new Date(),
    leadDocId: task?.leadDocId,
    activityLogId: task?.matchedlog?._id,
    allocatedTo: task?.allocatedTo,
    allocatedtomodel: task?.matchedlog?.taskallocatedToModel,
    taskfromFollowup: task?.matchedlog?.taskfromFollowup,
    taskDescription: "",
    rejectionReason: ""
  })

  const [error, setError] = useState({
    descriptionerror: "",
    rejectionerror: ""
  })

  useEffect(() => {
    setError({
      descriptionerror: "",
      rejectionerror: ""
    })
  }, [status])

  const handleAction = async () => {
    if (status === "submitted" && !taskDetails.taskDescription.trim()) {
      setError((prev) => ({
        ...prev,
        descriptionerror: "Description is required"
      }))
      return
    }

    if (status === "rejected" && !taskDetails.rejectionReason.trim()) {
      setError((prev) => ({
        ...prev,
        rejectionerror: "Rejection reason is required"
      }))
      return
    }

    try {
      if (submitloading) return
      setsubmitLoading(true)

      const payload = {
        ...taskDetails,
        status
      }

      const endpoint =
        status === "submitted" ? "/lead/taskSubmission" : "/lead/taskRejection"
console.log(endpoint)
console.log(payload)
      const response = await api.post(endpoint, payload)
      toast.success(response.data.message)
      refresh()
      setShowComponent(false)
    } catch (error) {
      console.log(error)
      toast.error("Something went wrong")
    } finally {
      setsubmitLoading(false)
    }
  }

  return (
    // <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4">
    //   <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
    //     {/* Header */}
    //     <div className="relative flex-shrink-0 bg-gradient-to-r from-blue-600 to-blue-700 px-5 sm:px-7 py-4 sm:py-5">
    //       <div className="flex items-start justify-between gap-4">
    //         <div className="min-w-0">
    //           <div className="flex items-center gap-2 text-blue-100 text-xs font-semibold uppercase tracking-wide mb-1">
    //             <ClipboardList className="w-3.5 h-3.5" />
    //             Task Details
    //           </div>
    //           <h2 className="text-lg sm:text-xl font-bold text-white truncate">
    //             Lead #{taskDetails?.leadId}
    //           </h2>
    //         </div>

    //         <button
    //           onClick={() => setShowComponent(false)}
    //           className="flex-shrink-0 text-white/90 hover:text-white hover:bg-white/15 rounded-full p-1.5 transition-colors"
    //         >
    //           <X className="w-5 h-5" />
    //         </button>
    //       </div>
    //     </div>

    //     {submitloading && (
    //       <div className="absolute inset-x-0 top-[64px] flex justify-center z-10">
    //         <div className="bg-white shadow-md rounded-full px-4 py-1.5">
    //           <PropagateLoader color="#2563eb" size={8} />
    //         </div>
    //       </div>
    //     )}

    //     {/* Body - Scrollable */}
    //     <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6">
    //       {/* Context Card — read only info */}
    //       <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 sm:p-5">
    //         <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
    //           Assignment Info
    //         </p>

    //         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    //           <div className="flex items-start gap-2.5">
    //             <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
    //             <div className="min-w-0">
    //               <p className="text-[11px] text-gray-400 font-medium">
    //                 Assigned By
    //               </p>
    //               <p className="text-sm font-semibold text-gray-800 truncate">
    //                 {taskDetails?.taskassignedBy?.toUpperCase() || "—"}
    //               </p>
    //             </div>
    //           </div>

    //           <div className="flex items-start gap-2.5">
    //             <ClipboardList className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
    //             <div className="min-w-0">
    //               <p className="text-[11px] text-gray-400 font-medium">
    //                 Task Name
    //               </p>
    //               <p className="text-sm font-semibold text-gray-800 truncate">
    //                 {taskDetails?.task?.toUpperCase() || "—"}
    //               </p>
    //             </div>
    //           </div>

    //           <div className="flex items-start gap-2.5 sm:col-span-2">
    //             <CalendarDays className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
    //             <div className="min-w-0">
    //               <p className="text-[11px] text-gray-400 font-medium">
    //                 Completion Date
    //               </p>
    //               <p className="text-sm font-semibold text-gray-800">
    //                 {taskDetails?.taskassignedDate
    //                   ? new Date(taskDetails.taskassignedDate).toLocaleDateString(
    //                       "en-GB",
    //                       { day: "2-digit", month: "short", year: "numeric" }
    //                     )
    //                   : "—"}
    //               </p>
    //             </div>
    //           </div>

    //           {taskDetails?.taskDescriptionByassigner && (
    //             <div className="flex items-start gap-2.5 sm:col-span-2">
    //               <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
    //               <div className="min-w-0 w-full">
    //                 <p className="text-[11px] text-gray-400 font-medium mb-1">
    //                   Description By Assigner
    //                 </p>
    //                 <p className="text-sm text-gray-700 leading-relaxed bg-white border border-gray-100 rounded-lg px-3 py-2">
    //                   {taskDetails.taskDescriptionByassigner}
    //                 </p>
    //               </div>
    //             </div>
    //           )}
    //         </div>
    //       </div>

    //       {/* Action Selector */}
    //       <div>
    //         <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
    //           Action
    //         </label>

    //         {pending ? (
    //           <div className="grid grid-cols-2 gap-2.5 p-1 bg-gray-100 rounded-xl">
    //             <button
    //               type="button"
    //               onClick={() => setStatus("submitted")}
    //               className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
    //                 status === "submitted"
    //                   ? "bg-white text-blue-700 shadow-sm"
    //                   : "text-gray-500 hover:text-gray-700"
    //               }`}
    //             >
    //               <CheckCircle2 className="w-4 h-4" />
    //               Submit Completion
    //             </button>
    //             <button
    //               type="button"
    //               onClick={() => setStatus("rejected")}
    //               className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
    //                 status === "rejected"
    //                   ? "bg-white text-red-600 shadow-sm"
    //                   : "text-gray-500 hover:text-gray-700"
    //               }`}
    //             >
    //               <XCircle className="w-4 h-4" />
    //               Reject Task
    //             </button>
    //           </div>
    //         ) : (
    //           <div
    //             className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold ${
    //               status === "submitted"
    //                 ? "bg-blue-50 text-blue-700"
    //                 : "bg-red-50 text-red-600"
    //             }`}
    //           >
    //             {status === "submitted" ? (
    //               <CheckCircle2 className="w-4 h-4" />
    //             ) : (
    //               <XCircle className="w-4 h-4" />
    //             )}
    //             {status === "submitted" ? "Submit Completion" : "Reject Task"}
    //           </div>
    //         )}
    //       </div>

    //       {/* Notes / Rejection Reason */}
    //       {status === "submitted" ? (
    //         <div>
    //           <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
    //             Completion Notes
    //           </label>
    //           <textarea
    //             rows={4}
    //             value={taskDetails.taskDescription}
    //             onChange={(e) => {
    //               setTaskDetails((prev) => ({
    //                 ...prev,
    //                 taskDescription: e.target.value
    //               }))
    //               if (error.descriptionerror) {
    //                 setError((prev) => ({
    //                   ...prev,
    //                   descriptionerror: ""
    //                 }))
    //               }
    //             }}
    //             readOnly={!pending}
    //             placeholder="Enter completion details..."
    //             className={`w-full border px-4 py-3 rounded-xl text-sm resize-none transition-colors focus:outline-none ${
    //               pending
    //                 ? `bg-white border-gray-200 focus:ring-2 ${
    //                     error.descriptionerror
    //                       ? "border-red-300 focus:ring-red-200"
    //                       : "focus:border-blue-400 focus:ring-blue-100"
    //                   }`
    //                 : "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
    //             }`}
    //           />
    //           {error.descriptionerror && (
    //             <p className="text-red-500 text-xs font-medium mt-1.5">
    //               {error.descriptionerror}
    //             </p>
    //           )}
    //         </div>
    //       ) : (
    //         <div>
    //           <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
    //             Rejection Reason
    //           </label>
    //           <textarea
    //             rows={4}
    //             value={taskDetails.rejectionReason}
    //             onChange={(e) => {
    //               setTaskDetails((prev) => ({
    //                 ...prev,
    //                 rejectionReason: e.target.value
    //               }))
    //               if (error.rejectionerror) {
    //                 setError((prev) => ({
    //                   ...prev,
    //                   rejectionerror: ""
    //                 }))
    //               }
    //             }}
    //             readOnly={!pending}
    //             placeholder="Enter rejection reason..."
    //             className={`w-full border px-4 py-3 rounded-xl text-sm resize-none transition-colors focus:outline-none ${
    //               pending
    //                 ? `bg-white border-gray-200 focus:ring-2 ${
    //                     error.rejectionerror
    //                       ? "border-red-300 focus:ring-red-200"
    //                       : "focus:border-red-400 focus:ring-red-100"
    //                   }`
    //                 : "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed"
    //             }`}
    //           />
    //           {error.rejectionerror && (
    //             <p className="text-red-500 text-xs font-medium mt-1.5">
    //               {error.rejectionerror}
    //             </p>
    //           )}
    //         </div>
    //       )}
    //     </div>

    //     {/* Footer */}
    //     <div className="flex-shrink-0 flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 px-5 sm:px-7 py-4 border-t border-gray-100 bg-gray-50">
    //       <button
    //         onClick={() => setShowComponent(false)}
    //         className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors font-semibold text-sm"
    //       >
    //         Cancel
    //       </button>

    //       {pending && (
    //         <button
    //           onClick={handleAction}
    //           disabled={submitloading}
    //           className={`px-5 py-2.5 rounded-xl text-white font-semibold text-sm shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
    //             status === "submitted"
    //               ? "bg-blue-600 hover:bg-blue-700"
    //               : "bg-red-600 hover:bg-red-700"
    //           }`}
    //         >
    //           {status === "submitted" ? "Submit Task" : "Reject Task"}
    //         </button>
    //       )}
    //     </div>
    //   </div>
    // </div>
<div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-2 sm:p-4 backdrop-blur-[2px]">
  <div className="flex w-full max-w-xl max-h-[calc(100dvh-1rem)] flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl">
    <div className="flex shrink-0 items-center justify-between gap-3 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-blue-100">
          <ClipboardList className="h-3.5 w-3.5" />
          Task details
        </p>
        <h2 className="mt-0.5 truncate text-base font-bold text-white sm:text-lg">
          Lead #{taskDetails?.leadId || "—"}
        </h2>
      </div>

      <button
        type="button"
        onClick={() => setShowComponent(false)}
        aria-label="Close task modal"
        className="shrink-0 rounded-lg p-1.5 text-white/90 transition hover:bg-white/15 hover:text-white"
      >
        <X className="h-5 w-5" />
      </button>
    </div>

    {submitloading && (
      <div className="absolute left-1/2 top-14 z-10 -translate-x-1/2 rounded-full bg-white px-3 py-1 shadow-md sm:top-16">
        <PropagateLoader color="#2563eb" size={7} />
      </div>
    )}

    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4">
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-gray-100 pb-3 sm:gap-x-6">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Assigned by
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-gray-800">
            {taskDetails?.taskassignedBy?.toUpperCase() || "—"}
          </p>
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Task
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-gray-800">
            {taskDetails?.task?.toUpperCase() || "—"}
          </p>
        </div>

        <div className="col-span-2 min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
            Completion date
          </p>
          <p className="mt-0.5 text-sm font-medium text-gray-700">
            {taskDetails?.taskassignedDate
              ? new Date(taskDetails.taskassignedDate).toLocaleDateString(
                  "en-GB",
                  { day: "2-digit", month: "short", year: "numeric" }
                )
              : "—"}
          </p>
        </div>

        {taskDetails?.taskDescriptionByassigner && (
          <div className="col-span-2 min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Assigner note
            </p>
            <p className="mt-1 max-h-20 overflow-y-auto rounded-md bg-gray-50 px-2.5 py-2 text-sm leading-5 text-gray-700">
              {taskDetails.taskDescriptionByassigner}
            </p>
          </div>
        )}
      </div>

      <div className="pt-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          Action
        </p>

        {pending ? (
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => setStatus("submitted")}
              className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                status === "submitted"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              Complete
            </button>

            <button
              type="button"
              onClick={() => setStatus("rejected")}
              className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                status === "rejected"
                  ? "bg-white text-red-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <XCircle className="h-4 w-4" />
              Reject
            </button>
          </div>
        ) : (
          <div
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold ${
              status === "submitted"
                ? "bg-blue-50 text-blue-700"
                : "bg-red-50 text-red-600"
            }`}
          >
            {status === "submitted" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            {status === "submitted" ? "Completed" : "Rejected"}
          </div>
        )}
      </div>

      <div className="pt-3">
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-gray-500">
          {status === "submitted" ? "Completion notes" : "Rejection reason"}
        </label>

        <textarea
          rows={3}
          value={
            status === "submitted"
              ? taskDetails.taskDescription || ""
              : taskDetails.rejectionReason || ""
          }
          onChange={(e) => {
            const field =
              status === "submitted" ? "taskDescription" : "rejectionReason";
            const errorField =
              status === "submitted" ? "descriptionerror" : "rejectionerror";

            setTaskDetails((prev) => ({
              ...prev,
              [field]: e.target.value,
            }));

            if (error[errorField]) {
              setError((prev) => ({
                ...prev,
                [errorField]: "",
              }));
            }
          }}
          readOnly={!pending}
          placeholder={
            status === "submitted"
              ? "Enter completion details..."
              : "Enter rejection reason..."
          }
          className={`w-full resize-none rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 ${
            pending
              ? status === "submitted"
                ? error.descriptionerror
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-gray-200 focus:border-blue-400 focus:ring-blue-100"
                : error.rejectionerror
                  ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                  : "border-gray-200 focus:border-red-400 focus:ring-red-100"
              : "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-500"
          }`}
        />

        {status === "submitted" && error.descriptionerror && (
          <p className="mt-1 text-xs font-medium text-red-500">
            {error.descriptionerror}
          </p>
        )}

        {status === "rejected" && error.rejectionerror && (
          <p className="mt-1 text-xs font-medium text-red-500">
            {error.rejectionerror}
          </p>
        )}
      </div>
    </div>

    <div className="flex shrink-0 justify-end gap-2 border-t border-gray-100 bg-gray-50 px-4 py-3 sm:px-5">
      <button
        type="button"
        onClick={() => setShowComponent(false)}
        className="rounded-lg border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
      >
        Cancel
      </button>

      {pending && (
        <button
          type="button"
          onClick={handleAction}
          disabled={submitloading}
          className={`rounded-lg px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
            status === "submitted"
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {status === "submitted" ? "Submit" : "Reject"}
        </button>
      )}
    </div>
  </div>
</div>
  )
}
