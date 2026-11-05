// import React from "react"

// const ResponsiveTable = ({
//   attendee,
//   user,
//   handleAttendance,
//   handleLeave,
//   handleOnsite,
//   handleScroll,
//   modalOpen,
//   sundays,
//   holiday
// }) => {
//   console.log(attendee)
//   console.log(!modalOpen)
//   return (
//     <div
// className="flex h-full min-h-0 flex-col rounded-lg border border-gray-300 bg-white"
// // className="relative overflow-x-auto  overflow-y-auto rounded-lg  h-full min-h-0 flex-col m-2"
// >
//       <div
//         className="flex-1 min-h-0 overflow-auto"
//         onScroll={handleScroll}
//       >
//         <table className="w-full min-w-max border-separate border-spacing-0 text-sm">
//           {/* <thead className={`sticky top-0 z-20 bg-white}> */}
//           <thead>
//             <tr>
//               <th
//                 rowSpan={2}
//                 className={`border border-gray-400 bg-blue-200 p-2 font-semibold ${
//                   !modalOpen ? "sticky top-0 left-0 z-30" : ""
//                 }`}
//               >
//                 Dates
//               </th>

//               <th
//                 colSpan={2}
//                 className={`border border-gray-400 bg-blue-200 p-2 font-semibold ${
//                   !modalOpen ? "sticky top-0 z-20" : ""
//                 }`}
//               >
//                 Present
//               </th>

//               <th
//                 colSpan={4}
//                 className={`border border-gray-400 bg-blue-200 p-2 font-semibold ${
//                   !modalOpen ? "sticky top-0 z-20" : ""
//                 }`}
//               >
//                 Leave
//               </th>

//               <th
//                 rowSpan={2}
//                 className={`border border-gray-400 bg-blue-200 p-2 font-semibold ${
//                   !modalOpen ? "sticky top-0 z-20" : ""
//                 }`}
//               >
//                 Early Out
//               </th>

//               <th
//                 rowSpan={2}
//                 className={`border border-gray-400 bg-blue-200 p-2 font-semibold ${
//                   !modalOpen ? "sticky top-0 z-20" : ""
//                 }`}
//               >
//                 Late In
//               </th>

//               <th
//                 rowSpan={2}
//                 className={`border border-gray-400 bg-blue-200 p-2 font-semibold ${
//                   !modalOpen ? "sticky top-0 z-20" : ""
//                 }`}
//               >
//                 Not Marked
//               </th>

//               <th
//                 colSpan={4}
//                 className={`border border-gray-400 bg-blue-200 p-2 font-semibold ${
//                   !modalOpen ? "sticky top-0 z-20" : ""
//                 }`}
//               >
//                 Onsite
//               </th>
//             </tr>

//             <tr>
//               <th
//                 className={`border border-gray-400 bg-blue-200 p-2  font-semibold ${
//                   !modalOpen ? "sticky top-[42px] z-20" : ""
//                 }`}
//               >
//                 In Time
//               </th>
//               <th
//                 className={`border border-gray-400 bg-blue-200 p-2 font-semibold ${
//                   !modalOpen ? "sticky top-[42px] z-20" : ""
//                 }`}
//               >
//                 Out Time
//               </th>
//               <th
//                 className={`border border-gray-400 bg-blue-200 p-2 font-semibold ${
//                   !modalOpen ? "sticky top-[42px] z-20" : ""
//                 }`}
//               >
//                 CL
//               </th>
//               <th
//                 className={`border border-gray-400 bg-blue-200 p-2 font-semibold ${
//                   !modalOpen ? "sticky top-[42px] z-20" : ""
//                 }`}
//               >
//                 PL
//               </th>
//               <th
//                 className={`border border-gray-400 bg-blue-200 p-2 font-semibold ${
//                   !modalOpen ? "sticky top-[42px] z-20" : ""
//                 }`}
//               >
//                 Comp.leave
//               </th>
//               <th
//                 className={`border border-gray-400 bg-blue-200 p-2 font-semibold ${
//                   !modalOpen ? "sticky top-[42px] z-20" : ""
//                 }`}
//               >
//                 Others
//               </th>
//               <th
//                 className={`border border-gray-400 bg-blue-200 p-2 font-semibold ${
//                   !modalOpen ? "sticky top-[42px] z-20" : ""
//                 }`}
//               >
//                 Place
//               </th>
//               <th
//                 className={`border border-gray-400 bg-blue-200 p-2 font-semibold ${
//                   !modalOpen ? "sticky top-[42px] z-20" : ""
//                 }`}
//               >
//                 Site Name
//               </th>
//               <th
//                 className={`border border-gray-400 bg-blue-200 p-2 font-semibold ${
//                   !modalOpen ? "sticky top-[42px] z-20" : ""
//                 }`}
//               >
//                 Onsite Type
//               </th>
//               <th
//                 className={`border border-gray-400 bg-blue-200 p-2 font-semibold ${
//                   !modalOpen ? "sticky top-[42px] z-20" : ""
//                 }`}
//               >
//                 Period
//               </th>
//             </tr>
//           </thead>
//           {/* <thead
//             className={` ${
//               !modalOpen && " text-sm sticky top-0 z-20 bg-blue-200"
//             }`}
//           >
//             <tr>
//               <th
//                 rowSpan="2"
//                 className={`border border-gray-400 p-2 ${
//                   !modalOpen ? "sticky left-0 z-20 bg-blue-200" : " bg-blue-200"
//                 } `}
//                 // className={`border border-gray-300 p-2 sticky ${ !modalOpen&&left-0  z-10 }bg-gray-100`}
//               >
//                 Dates
//               </th>
//               <th colSpan="2" className="border  border-gray-400 p-1">
//                 Present
//               </th>
//               <th colSpan="4" className="border border-gray-400 p-1 ">
//                 Leave
//               </th>
//               <th rowSpan="2" className="border border-gray-400 p-2">
//                 Early Out
//               </th>
//               <th rowSpan="2" className="border border-gray-400 p-2">
//                 Late In
//               </th>
//               <th rowSpan="2" className="border border-gray-400 p-2">
//                 Not Marked
//               </th>
//               <th colSpan="4" className="border border-gray-400 p-1">
//                 Onsite
//               </th>
//             </tr>
//             <tr>
//               <th className="border border-gray-400 p-1">In Time</th>
//               <th className="border  border-gray-400 p-2">Out Time</th>
//               <th className="border border-gray-400 p-2">CL</th>
//               <th className="border border-gray-400 p-2">PL</th>
//               <th className="border border-gray-400 p-1 ">Comp.leave</th>
//               <th className="border border-gray-400 p-1">Others</th>
//               <th className="border border-gray-400 p-1 ">Place</th>
//               <th className="border border-gray-400 p-1 ">Site Name</th>
//               <th className="border border-gray-400 p-1">Onsite Type</th>
//               <th className="border border-gray-400 p-1">Period</th>
//             </tr>
//           </thead> */}
//           <tbody>
//             {Object.entries(attendee.attendancedates).map(
//               ([date, details], idx) => {
//                 const currentDate = new Date(date)
//                 const isSunday = currentDate.getDay() === 0 // 0 represents Sunday
//                 const isHolidayAbsent = holiday.some((holy) => {
//                   if (holy.date !== date) return false
//                   const matchedItem = attendee.attendancedates[holy.date]
//                   if (!matchedItem) return false

//                   const notMarkedEmpty = matchedItem.notMarked === ""
//                   const hasLeave =
//                     matchedItem.compensatoryLeave !== "" ||
//                     matchedItem.casualLeave !== "" ||
//                     matchedItem.otherLeave !== "" ||
//                     matchedItem.privilegeLeave !== ""
//                   const notMarkedOne = matchedItem.notMarked === 1

//                   return (notMarkedEmpty && hasLeave) || notMarkedOne
//                 })

//                 const isSundayAbsent = sundays.some((sunday) => {
//                   const matched = date === sunday

//                   if (!matched) return false
//                   if (matched) {
//                     const matchedItem = attendee.attendancedates[date]
//                     const notMarkedEmpty = matchedItem.notMarked === ""
//                     const hasLeave =
//                       matchedItem.compensatoryLeave !== "" ||
//                       matchedItem.casualLeave !== "" ||
//                       matchedItem.otherLeave !== "" ||
//                       matchedItem.privilegeLeave !== ""
//                     const notMarkedOne = matchedItem.notMarked === 1

//                     return (notMarkedEmpty && hasLeave) || notMarkedOne
//                   }
//                 })

//                 const holidayName =
//                   holiday.find((h) => h.date === date)?.holyname || null

//                 const highlightClass =
//                   isSundayAbsent || isHolidayAbsent
//                     ? "bg-red-500"
//                     : "bg-green-300" // Light green background

//                 return (
//                   <tr key={idx} className="hover:bg-gray-50 text-center">
//                     <td className="border border-gray-400 p-2 sticky left-0 bg-white">
//                       {date}
//                     </td>
//                     <td
//                       className="border border-gray-400 p-2 hover:cursor-pointer"
//                       onClick={() => {
//                         if (user?.role === "Admin") {
//                           handleAttendance(
//                             date,
//                             "Attendance",
//                             details?.inTime,
//                             details?.outTime
//                           )
//                         }
//                       }}
//                     >
//                       {details?.inTime || "-"}
//                     </td>
//                     <td
//                       className="border border-gray-400 p-2 hover:cursor-pointer"
//                       onClick={() => {
//                         if (user?.role === "Admin") {
//                           handleAttendance(
//                             date,
//                             "Attendance",
//                             details?.inTime,
//                             details?.outTime
//                           )
//                         }
//                       }}
//                     >
//                       {details?.outTime || "-"}
//                     </td>
//                     {/* If it's Sunday or Holiday, merge the columns and display text in center */}
//                     {isSunday || holidayName ? (
//                       <>
//                         <td
//                           onClick={() => {
//                             if (user?.role === "Admin") {
//                               handleLeave(
//                                 date,
//                                 "Leave",

//                                 details?.leaveDetails,
//                                 "casual Leave"
//                               )
//                             }
//                           }}
//                           className={` p-2 text-center hover:cursor-pointer border border-r-0 border-gray-400 text-white font-semibold ${highlightClass}`}
//                         >
//                           {/* {isSunday ? "SUNDAY" : holidayName} */}
//                           {details?.casualLeave}
//                         </td>
//                         <td
//                           onClick={() => {
//                             if (user?.role === "Admin") {
//                               handleLeave(
//                                 date,
//                                 "Leave",

//                                 details?.leaveDetails,
//                                 "privileage Leave"
//                               )
//                             }
//                           }}
//                           className={` p-2 text-center hover:cursor-pointer border border-r-0 border-l-0 border-gray-400 text-white font-semibold ${highlightClass}`}
//                         >
//                           {/* {isSunday ? "SUNDAY" : holidayName} */}
//                           {details?.privilegeLeave}
//                         </td>
//                         <td
//                           onClick={() => {
//                             if (user?.role === "Admin") {
//                               handleLeave(
//                                 date,
//                                 "Leave",

//                                 details?.leaveDetails,
//                                 "compensatory Leave"
//                               )
//                             }
//                           }}
//                           className={` p-2 text-center hover:cursor-pointer border border-l-0 border-r-0 border-gray-400 text-white font-semibold ${highlightClass}`}
//                         >
//                           {/* {isSunday ? "SUNDAY" : holidayName} */}
//                           {details?.compensatoryLeave}
//                         </td>
//                         <td
//                           onClick={() => {
//                             if (user?.role === "Admin") {
//                               handleLeave(
//                                 date,
//                                 "Leave",

//                                 details?.leaveDetails,
//                                 "other Leave"
//                               )
//                             }
//                           }}
//                           className={` p-2 text-center hover:cursor-pointer border border-l-0 border-r-0 border-gray-400 text-white font-semibold ${highlightClass}`}
//                         >
//                           {/* {isSunday ? "SUNDAY" : holidayName} */}
//                           {details?.otherLeave}
//                         </td>
//                         <td
//                           className={`p-2  border font-bold border-r-0 border-l-0 border-gray-400 ${highlightClass}`}
//                         >
//                           {isSunday ? "SUNDAY" : holidayName}
//                         </td>
//                         <td
//                           className={`p-2 text-white  border border-r-0 border-l-0 border-gray-400 ${highlightClass}`}
//                         ></td>
//                         <td
//                           className={`p-2  border border-l-0 border-gray-400 ${highlightClass}`}
//                         >
//                           {details.notMarked}
//                         </td>
//                       </>
//                     ) : (
//                       <>
//                         <td
//                           className="border border-gray-400  hover:cursor-pointer p-2 "
//                           onClick={() => {
//                             if (user?.role === "Admin") {
//                               const leaveFields = [
//                                 { key: "casualLeave", label: "Casual Leave" },
//                                 {
//                                   key: "compensatoryLeave",
//                                   label: "Compensatory Leave"
//                                 },
//                                 {
//                                   // key: "privileageLeave",
//                                   key: "privilegeLeave",
//                                   label: "Privileage Leave"
//                                 },
//                                 { key: "otherLeave", label: "Other Leave" }
//                               ]

//                               const leaves = leaveFields
//                                 .filter(({ key }) => details?.[key])
//                                 .map(({ key, label }) => ({
//                                   type: label,
//                                   value: details[key]
//                                 }))
//                               handleLeave(
//                                 date,
//                                 "Leave",

//                                 details?.leaveDetails,
//                                 "casual Leave"
//                               )
//                             }
//                           }}
//                         >
//                           {details?.casualLeave || "-"}
//                         </td>
//                         <td
//                           className="border border-gray-400 p-2  hover:cursor-pointer"
//                           onClick={() => {
//                             if (user?.role === "Admin") {
//                               handleLeave(
//                                 date,
//                                 "Leave",

//                                 details?.leaveDetails,
//                                 "privileage Leave"
//                               )
//                             }
//                           }}
//                         >
//                           {details?.privilegeLeave || "-"}
//                         </td>
//                         <td
//                           className="border border-gray-400 p-2  hover:cursor-pointer"
//                           onClick={() => {
//                             if (user?.role === "Admin") {
//                               handleLeave(
//                                 date,
//                                 "Leave",

//                                 details?.leaveDetails,
//                                 "compensatory Leave"
//                               )
//                             }
//                           }}
//                         >
//                           {details?.compensatoryLeave || "-"}
//                         </td>
//                         <td
//                           className="border border-gray-400 p-2 hover:cursor-pointer"
//                           onClick={() => {
//                             if (user?.role === "Admin") {
//                               handleLeave(
//                                 date,
//                                 "Leave",

//                                 details?.leaveDetails,
//                                 "other Leave"
//                               )
//                             }
//                           }}
//                         >
//                           {details?.otherLeave || "-"}
//                         </td>
//                         <td className="border border-gray-400 p-2">
//                           {details?.early ? `${details.early} minutes` : "-"}
//                         </td>
//                         <td className="border border-gray-400 p-2">
//                           {details?.late ? `${details.late} minutes` : "-"}
//                         </td>
//                         <td className="border border-gray-400 p-2 ">
//                           {details?.notMarked}
//                         </td>
//                       </>
//                     )}

//                     {/* Remaining columns without highlight */}
//                     <td
//                       className="border border-gray-400 p-2 hover:cursor-pointer"
//                       onClick={() => {
//                         if (
//                           user?.role === "Admin" &&
//                           details.onsite.length > 0
//                         ) {
//                           handleOnsite(
//                             date,
//                             "Onsite",
//                             details?.onsite?.[0]?.onsiteType,

//                             details?.onsite?.[0]?.halfDayperiod,

//                             details?.onsite?.[0]?.description
//                           )
//                         }
//                       }}
//                     >
//                       {details?.onsite?.[0]?.place || "-"}
//                     </td>
//                     <td
//                       className="border border-gray-400 p-2 hover:cursor-pointer"
//                       onClick={() => {
//                         if (
//                           user?.role === "Admin" &&
//                           details.onsite.length > 0
//                         ) {
//                           handleOnsite(
//                             date,
//                             "Onsite",
//                             details?.onsite?.[0]?.onsiteType,

//                             details?.onsite?.[0]?.halfDayperiod,

//                             details?.onsite?.[0]?.description
//                           )
//                         }
//                       }}
//                     >
//                       {details?.onsite?.[0]?.siteName || "-"}
//                     </td>
//                     <td
//                       className="border border-gray-400 p-2 hover:cursor-pointer"
//                       onClick={() => {
//                         if (
//                           user?.role === "Admin" &&
//                           details.onsite.length > 0
//                         ) {
//                           handleOnsite(
//                             date,
//                             "Onsite",
//                             details?.onsite?.[0]?.onsiteType,

//                             details?.onsite?.[0]?.halfDayperiod,

//                             details?.onsite?.[0]?.description
//                           )
//                         }
//                       }}
//                     >
//                       {details?.onsite?.[0]?.onsiteType || "-"}
//                     </td>
//                     <td
//                       className="border border-gray-400 p-2 hover:cursor-pointer"
//                       onClick={() => {
//                         if (
//                           user?.role === "Admin" &&
//                           details.onsite.length > 0
//                         ) {
//                           handleOnsite(
//                             date,
//                             "Onsite",
//                             details?.onsite?.[0]?.onsiteType,

//                             details?.onsite?.[0]?.halfDayperiod,

//                             details?.onsite?.[0]?.description
//                           )
//                         }
//                       }}
//                     >
//                       {details?.onsite?.[0]?.onsiteType === "Half Day"
//                         ? details?.onsite?.[0].halfDayPeriod
//                         : "-"}
//                     </td>
//                   </tr>
//                 )
//               }
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   )
// }

// export default React.memo(ResponsiveTable)

import React from "react"
import Tooltip from "@mui/material/Tooltip"
const ResponsiveTable = ({
  attendee,
  user,
  handleAttendance,
  handleLeave,
  handleOnsite,
  handleScroll,
  modalOpen,
  sundays,
  holiday
}) => {
  console.log(attendee)
  return (
    <div className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-300 bg-white">
      <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto" onScroll={handleScroll}>
        <table className="w-full min-w-max border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-30 bg-blue-200 shadow-sm">
            <tr>
              <th
                rowSpan={2}
                className={`border border-gray-400 bg-blue-200 p-2 font-semibold ${
                  !modalOpen ? "sticky left-0 z-40" : ""
                }`}
              >
                Dates
              </th>

              <th
                colSpan={2}
                className="border border-gray-400 bg-blue-200 p-2 font-semibold"
              >
                Present
              </th>

              <th
                colSpan={4}
                className="border border-gray-400 bg-blue-200 p-2 font-semibold"
              >
                Leave
              </th>

              <th
                rowSpan={2}
                className="border border-gray-400 bg-blue-200 p-2 font-semibold"
              >
                Early Out
              </th>

              <th
                rowSpan={2}
                className="border border-gray-400 bg-blue-200 p-2 font-semibold"
              >
                Late In
              </th>

              <th
                rowSpan={2}
                className="border border-gray-400 bg-blue-200 p-2 font-semibold"
              >
                Not Marked
              </th>

              <th
                colSpan={4}
                className="border border-gray-400 bg-blue-200 p-2 font-semibold"
              >
                Onsite
              </th>
            </tr>

            <tr>
              <th className="border border-gray-400 bg-blue-200 p-2 font-semibold">
                In Time
              </th>
              <th className="border border-gray-400 bg-blue-200 p-2 font-semibold">
                Out Time
              </th>
              <th className="border border-gray-400 bg-blue-200 p-2 font-semibold">
                CL
              </th>
              <th className="border border-gray-400 bg-blue-200 p-2 font-semibold">
                PL
              </th>
              <th className="border border-gray-400 bg-blue-200 p-2 font-semibold">
                Comp.leave
              </th>
              <th className="border border-gray-400 bg-blue-200 p-2 font-semibold">
                Others
              </th>
              <th className="border border-gray-400 bg-blue-200 p-2 font-semibold">
                Place
              </th>
              <th className="border border-gray-400 bg-blue-200 p-2 font-semibold">
                Site Name
              </th>
              <th className="border border-gray-400 bg-blue-200 p-2 font-semibold">
                Onsite Type
              </th>
              <th className="border border-gray-400 bg-blue-200 p-2 font-semibold">
                Period
              </th>
            </tr>
          </thead>

          <tbody>
            {Object.entries(attendee.attendancedates).map(
              ([date, details], idx) => {
                const currentDate = new Date(date)
                const isSunday = currentDate.getDay() === 0

                const isHolidayAbsent = holiday.some((holy) => {
                  if (holy.date !== date) return false
                  const matchedItem = attendee.attendancedates[holy.date]
                  if (!matchedItem) return false

                  const notMarkedEmpty = matchedItem.notMarked === ""
                  const hasLeave =
                    matchedItem.compensatoryLeave !== "" ||
                    matchedItem.casualLeave !== "" ||
                    matchedItem.otherLeave !== "" ||
                    matchedItem.privilegeLeave !== ""
                  const notMarkedOne = matchedItem.notMarked === 1

                  return (notMarkedEmpty && hasLeave) || notMarkedOne
                })

                const isSundayAbsent = sundays.some((sunday) => {
                  const matched = date === sunday
                  console.log(date)
                  if (!matched) return false

                  const matchedItem = attendee.attendancedates[date]
                  const notMarkedEmpty =
                    matchedItem.notMarked === "" || matchedItem.notMarked === 0
                  // const hasLeave =
                  //   matchedItem.compensatoryLeave !== "" ||
                  //   matchedItem.casualLeave !== "" ||
                  //   matchedItem.otherLeave !== "" ||
                  //   matchedItem.privilegeLeave !== ""
                  const hasLeave =
                    [0.5, 1].includes(Number(matchedItem.compensatoryLeave)) ||
                    [0.5, 1].includes(Number(matchedItem.casualLeave)) ||
                    [0.5, 1].includes(Number(matchedItem.otherLeave)) ||
                    [0.5, 1].includes(Number(matchedItem.privilegeLeave))
                  if (date === "2026-07-05") {
                    console.log(hasLeave)
                    console.log(matchedItem)
                    console.log(matchedItem.notMarked)
                  }
                  const notMarkedOne = matchedItem.notMarked === 1

                  return (notMarkedEmpty && hasLeave) || notMarkedOne
                })

                const holidayName =
                  holiday.find((h) => h.date === date)?.holyname || null

                const highlightClass =
                  isSundayAbsent || isHolidayAbsent
                    ? "bg-red-500"
                    : "bg-green-300"

                return (
                  <tr key={idx} className="text-center hover:bg-gray-50">
                    <td
                      className={`border border-gray-400 p-2 bg-white ${
                        !modalOpen ? "sticky left-0 z-20" : ""
                      }`}
                    >
                      {date}
                    </td>

                    <td
                      className="border border-gray-400 p-2 hover:cursor-pointer"
                      onClick={() => {
                        if (user?.role === "Admin") {
                          handleAttendance(
                            date,
                            "Attendance",
                            details?.inTime,
                            details?.outTime
                          )
                        }
                      }}
                    >
                      {details?.inTime || "-"}
                    </td>

                    <td
                      className="border border-gray-400 p-2 hover:cursor-pointer"
                      onClick={() => {
                        if (user?.role === "Admin") {
                          handleAttendance(
                            date,
                            "Attendance",
                            details?.inTime,
                            details?.outTime
                          )
                        }
                      }}
                    >
                      {details?.outTime || "-"}
                    </td>

                    {isSunday || holidayName ? (
                      <>
                        <td
                          onClick={() => {
                            if (user?.role === "Admin") {
                              handleLeave(
                                date,
                                "Leave",
                                details?.leaveDetails,
                                "casual Leave"
                              )
                            }
                          }}
                          className={`border border-r-0 border-gray-400 p-2 text-center font-semibold text-white hover:cursor-pointer ${highlightClass}`}
                        >
                          {details?.casualLeave}
                        </td>

                        <td
                          onClick={() => {
                            if (user?.role === "Admin") {
                              handleLeave(
                                date,
                                "Leave",
                                details?.leaveDetails,
                                "privileage Leave"
                              )
                            }
                          }}
                          className={`border border-l-0 border-r-0 border-gray-400 p-2 text-center font-semibold text-white hover:cursor-pointer ${highlightClass}`}
                        >
                          {details?.privilegeLeave}
                        </td>

                        <td
                          onClick={() => {
                            if (user?.role === "Admin") {
                              handleLeave(
                                date,
                                "Leave",
                                details?.leaveDetails,
                                "compensatory Leave"
                              )
                            }
                          }}
                          className={`border border-l-0 border-r-0 border-gray-400 p-2 text-center font-semibold text-white hover:cursor-pointer ${highlightClass}`}
                        >
                          {details?.compensatoryLeave}
                        </td>

                        <td
                          onClick={() => {
                            if (user?.role === "Admin") {
                              handleLeave(
                                date,
                                "Leave",
                                details?.leaveDetails,
                                "other Leave"
                              )
                            }
                          }}
                          className={`border border-l-0 border-r-0 border-gray-400 p-2 text-center font-semibold text-white hover:cursor-pointer ${highlightClass}`}
                        >
                          {details?.otherLeave}
                        </td>

                        <td
                          className={`border border-l-0 border-r-0 border-gray-400 p-2 font-bold ${highlightClass}`}
                        >
                          {isSunday ? "SUNDAY" : holidayName}
                        </td>

                        <td
                          className={`border border-l-0 border-r-0 border-gray-400 p-2 text-white ${highlightClass}`}
                        ></td>

                        <td
                          className={`border border-l-0 border-gray-400 p-2 ${highlightClass}`}
                        >
                          {details.notMarked}
                        </td>
                      </>
                    ) : (
                      <>
                        <td
                          className="border border-gray-400 p-2 hover:cursor-pointer"
                          onClick={() => {
                            if (user?.role === "Admin") {
                              handleLeave(
                                date,
                                "Leave",
                                details?.leaveDetails,
                                "casual Leave"
                              )
                            }
                          }}
                        >
                          {details?.casualLeave || "-"}
                        </td>

                        <td
                          className="border border-gray-400 p-2 hover:cursor-pointer"
                          onClick={() => {
                            if (user?.role === "Admin") {
                              handleLeave(
                                date,
                                "Leave",
                                details?.leaveDetails,
                                "privileage Leave"
                              )
                            }
                          }}
                        >
                          {details?.privilegeLeave || "-"}
                        </td>

                        <td
                          className="border border-gray-400 p-2 hover:cursor-pointer"
                          onClick={() => {
                            if (user?.role === "Admin") {
                              handleLeave(
                                date,
                                "Leave",
                                details?.leaveDetails,
                                "compensatory Leave"
                              )
                            }
                          }}
                        >
                          {details?.compensatoryLeave || "-"}
                        </td>

                        <td
                          className="border border-gray-400 p-2 hover:cursor-pointer"
                          onClick={() => {
                            if (user?.role === "Admin") {
                              handleLeave(
                                date,
                                "Leave",
                                details?.leaveDetails,
                                "other Leave"
                              )
                            }
                          }}
                        >
                          {details?.otherLeave || "-"}
                        </td>

                        <td className="border border-gray-400 p-2">
                          {details?.early ? `${details.early} minutes` : "-"}
                        </td>

                        <td className="border border-gray-400 p-2">
                          {details?.late ? `${details.late} minutes` : "-"}
                        </td>

                        <td className="border border-gray-400 p-2">
                          {details?.notMarked}
                        </td>
                      </>
                    )}
                    {/* <td
                      className="border border-gray-400 p-2 hover:cursor-pointer"
                      onClick={() => {
                        if (
                          user?.role === "Admin" &&
                          details.onsite.length > 0
                        ) {
                          handleOnsite(date, "Onsite", details?.onsite)
                        }
                      }}
                    >
                      {details?.onsite?.length > 0
                        ? details.onsite.map((item, index) => (
                            <div key={index}>{item.place || "-"}</div>
                          ))
                        : "-"}
                    </td> */}

                    <td
                      className="border border-gray-400 p-2 hover:cursor-pointer max-w-[120px] w-[120px]"
                      onClick={() => {
                        if (
                          user?.role === "Admin" &&
                          details?.onsite?.length > 0
                        ) {
                          handleOnsite(date, "Onsite", details?.onsite)
                        }
                      }}
                    >
                      {details?.onsite?.length > 0 ? (
                        <Tooltip
                          arrow
                          title={
                            <div>
                              {details.onsite.map((item, index) => (
                                <div key={index}>{item.place || "-"}</div>
                              ))}
                            </div>
                          }
                        >
                          <span className="block truncate">
                            {details.onsite[0]?.place || "-"}
                            {details.onsite.length > 1 &&
                              ` +${details.onsite.length - 1}`}
                          </span>
                        </Tooltip>
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* <td className="border border-gray-400 p-2 hover:cursor-pointer">
                      {details?.onsite?.length > 0
                        ? details.onsite.map((item, index) => (
                            <div key={index}>{item.siteName || "-"}</div>
                          ))
                        : "-"}
                    </td> */}
                    <td className="border border-gray-400 p-2 hover:cursor-pointer max-w-[120px] w-[120px]">
                      {details?.onsite?.length > 0 ? (
                        <Tooltip
                          arrow
                          title={
                            <div>
                              {details.onsite.map((item, index) => (
                                <div key={index}>{item.siteName || "-"}</div>
                              ))}
                            </div>
                          }
                        >
                          <span className="block truncate">
                            {details.onsite[0]?.siteName || "-"}
                            {details.onsite.length > 1 &&
                              ` +${details.onsite.length - 1}`}
                          </span>
                        </Tooltip>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td className="border border-gray-400 p-2 hover:cursor-pointer">
                      {details?.onsite?.length > 0
                        ? details.onsite.map((item, index) => (
                            <div key={index}>{item.onsiteType || "-"}</div>
                          ))
                        : "-"}
                    </td>

                    <td className="border border-gray-400 p-2 hover:cursor-pointer">
                      {details?.onsite?.length > 0
                        ? details.onsite.map((item, index) => (
                            <div key={index}>
                              {item.onsiteType === "Half Day"
                                ? item.halfDayPeriod
                                : "-"}
                            </div>
                          ))
                        : "-"}
                    </td>

                    {/* <td
                    className="border border-gray-400 p-2 hover:cursor-pointer"
                    onClick={() => {
                      if (user?.role === "Admin" && details.onsite.length > 0) {
                        handleOnsite(
                          date,
                          "Onsite",
                          details?.onsite?.[0]?.onsiteType,
                          details?.onsite?.[0]?.halfDayperiod,
                          details?.onsite?.[0]?.description
                        );
                      }
                    }}
                  >
                    {details?.onsite?.[0]?.place || "-"}
                  </td>

                  <td
                    className="border border-gray-400 p-2 hover:cursor-pointer"
                    onClick={() => {
                      if (user?.role === "Admin" && details.onsite.length > 0) {
                        handleOnsite(
                          date,
                          "Onsite",
                          details?.onsite?.[0]?.onsiteType,
                          details?.onsite?.[0]?.halfDayperiod,
                          details?.onsite?.[0]?.description
                        );
                      }
                    }}
                  >
                    {details?.onsite?.[0]?.siteName || "-"}
                  </td>

                  <td
                    className="border border-gray-400 p-2 hover:cursor-pointer"
                    onClick={() => {
                      if (user?.role === "Admin" && details.onsite.length > 0) {
                        handleOnsite(
                          date,
                          "Onsite",
                          details?.onsite?.[0]?.onsiteType,
                          details?.onsite?.[0]?.halfDayperiod,
                          details?.onsite?.[0]?.description
                        );
                      }
                    }}
                  >
                    {details?.onsite?.[0]?.onsiteType || "-"}
                  </td>

                  <td
                    className="border border-gray-400 p-2 hover:cursor-pointer"
                    onClick={() => {
                      if (user?.role === "Admin" && details.onsite.length > 0) {
                        handleOnsite(
                          date,
                          "Onsite",
                          details?.onsite?.[0]?.onsiteType,
                          details?.onsite?.[0]?.halfDayperiod,
                          details?.onsite?.[0]?.description
                        );
                      }
                    }}
                  >
                    {details?.onsite?.[0]?.onsiteType === "Half Day"
                      ? details?.onsite?.[0]?.halfDayPeriod
                      : "-"}
                  </td> */}
                  </tr>
                )
              }
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default React.memo(ResponsiveTable)
