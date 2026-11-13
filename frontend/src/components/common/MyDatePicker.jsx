// import { forwardRef } from "react"
// import DatePicker from "react-datepicker"
// import "react-datepicker/dist/react-datepicker.css"
// import { FaCalendarAlt } from "react-icons/fa"
// const MyDatePicker = ({ setDates, dates, onClear, loader, view = false }) => {
//   console.log(view)

//   const handleDateRange = (date) => {
//     setDates({
//       startDate: date[0] ? date[0] : null,
//       endDate: date[1] ? date[1] : null
//     })
//   }

//   const CustomInput = forwardRef(({ value, onClick }, ref) => (
//     <div
//       ref={ref} // Attach ref here
//       className="flex items-center border border-gray-300 px-2 py-0.5 rounded-md cursor-pointer w-[220px] md:w-[250px] gap-2 bg-white"
//       onClick={onClick}
//     >
//       <FaCalendarAlt className="text-gray-600 md:mr-2" />
//       <span className={`text-md ${value ? "text-gray-900" : "text-gray-500"}`}>
//         {value || "Select a date range"}
//       </span>
//     </div>
//   ))

//   return (
//     <div className="z-40 relative">
//       <DatePicker
//         // selected={endDate}
//         onChange={handleDateRange}
//         startDate={dates.startDate}
//         endDate={dates.endDate}
//         selectsRange
//         dateFormat="dd/MM/yyyy"
//         customInput={<CustomInput />}

//       />
//     </div>
//   )
// }

// export default MyDatePicker
import { forwardRef } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { FaCalendarAlt } from "react-icons/fa"

const MyDatePicker = ({
  setDates,
  dates,
  onChange,
  onClear,
  loader,
  view = false,
  fullWidth = false,
  compact = false,
  inlineOnMobile = false,
  hideLabels = false,
  paymentHistoryStyle = false
}) => {
  const toPickerDate = (value) => {
    if (!value) return null
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value

    const dateParts = String(value).match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
    if (dateParts) {
      const [, day, month, year] = dateParts
      return new Date(Number(year), Number(month) - 1, Number(day))
    }

    const parsedDate = new Date(value)
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
  }

  const handleDateChange = (field, date) => {
    if (view) return // block changes in view mode
    setDates((currentDates) => ({ ...currentDates, [field]: date || null }))
    onChange?.()
  }

  const CustomInput = forwardRef(({ value, onClick, placeholder }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={view ? undefined : onClick}
      disabled={view}
      className={`flex ${compact ? "h-8 gap-1.5 px-2 text-xs" : "h-10 gap-2 px-3 text-sm"} w-full items-center border text-left transition ${
        view
          ? "rounded-lg cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500"
          : paymentHistoryStyle
            ? "rounded-md border-slate-300 bg-white text-slate-700 shadow-none hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            : "rounded-lg border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-100"
      }`}
    >
      <FaCalendarAlt className="shrink-0 text-slate-500" />
      <span className={value ? "text-slate-800" : "text-slate-400"}>
        {value || placeholder}
      </span>
    </button>
  ))

  const pickerWidth = inlineOnMobile
    ? "min-w-0 flex-1"
    : fullWidth
      ? "w-full"
      : compact
        ? "w-full sm:w-[13rem]"
        : "w-full sm:w-[14rem]"

  return (
    <div
      className={`z-40 flex gap-2 ${
        inlineOnMobile ? "flex-row items-end" : "flex-col sm:flex-row sm:items-end"
      } ${fullWidth ? "w-full" : ""}`}
    >
      <label className={`${pickerWidth} flex flex-col ${compact ? "gap-0.5" : "gap-1"}`}>
        <span className={`${hideLabels ? "sr-only" : `${compact ? "text-[9px]" : "text-[10px]"} font-semibold uppercase tracking-wide text-slate-500`}`}>
          Start date
        </span>
        <DatePicker
          selected={toPickerDate(dates?.startDate)}
          onChange={(date) => handleDateChange("startDate", date)}
          dateFormat={paymentHistoryStyle ? "dd MMM yyyy" : "dd/MM/yyyy"}
          placeholderText="Start date"
          customInput={<CustomInput />}
          wrapperClassName="w-full"
          popperClassName="!z-[9999]"
          popperProps={{ strategy: "fixed" }}
          popperPlacement="bottom-start"
          showPopperArrow={paymentHistoryStyle ? false : undefined}
          calendarClassName={
            paymentHistoryStyle ? "!rounded-xl !border-slate-200 !shadow-xl" : undefined
          }
          disabled={view}
        />
      </label>
      <label className={`${pickerWidth} flex flex-col ${compact ? "gap-0.5" : "gap-1"}`}>
        <span className={`${hideLabels ? "sr-only" : `${compact ? "text-[9px]" : "text-[10px]"} font-semibold uppercase tracking-wide text-slate-500`}`}>
          End date
        </span>
        <DatePicker
          selected={toPickerDate(dates?.endDate)}
          onChange={(date) => handleDateChange("endDate", date)}
          dateFormat={paymentHistoryStyle ? "dd MMM yyyy" : "dd/MM/yyyy"}
          placeholderText="End date"
          customInput={<CustomInput />}
          wrapperClassName="w-full"
          popperClassName="!z-[9999]"
          popperProps={{ strategy: "fixed" }}
          popperPlacement="bottom-end"
          showPopperArrow={paymentHistoryStyle ? false : undefined}
          calendarClassName={
            paymentHistoryStyle ? "!rounded-xl !border-slate-200 !shadow-xl" : undefined
          }
          disabled={view}
        />
      </label>
    </div>
  )
}

export default MyDatePicker
