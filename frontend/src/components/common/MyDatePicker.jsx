import { forwardRef } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { FaCalendarAlt } from "react-icons/fa"
const MyDatePicker = ({ setDates, dates, onClear, loader }) => {

  const handleDateRange = (date) => {
  
      setDates({
        startDate: date[0] ? date[0] : null,
        endDate: date[1] ? date[1]: null
      }) 

  }

  const CustomInput = forwardRef(({ value, onClick }, ref) => (
    <div
      ref={ref} // Attach ref here
      className="flex items-center border border-gray-300 px-2 py-0.5 rounded-md cursor-pointer w-[220px] md:w-[250px] gap-2"
      onClick={onClick}
    >
      <FaCalendarAlt className="text-gray-600 md:mr-2" />
      <span className={`text-md ${value ? "text-gray-900" : "text-gray-500"}`}>
        {value || "Select a date range"}
      </span>
    </div>
  ))

  return (
    <div className="z-50 relative">
      <DatePicker
        // selected={endDate}
        onChange={handleDateRange}
        startDate={dates.startDate}
        endDate={dates.endDate}
        selectsRange
        dateFormat="dd/MM/yyyy"
        customInput={<CustomInput />}
        // isClearable
      />
    </div>
  )
}

export default MyDatePicker
