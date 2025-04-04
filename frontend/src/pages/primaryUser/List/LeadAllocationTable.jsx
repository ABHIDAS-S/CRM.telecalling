import { useState, useEffect } from "react"
import { PropagateLoader } from "react-spinners"
import { useNavigate } from "react-router-dom"
import Select from "react-select"
import UseFetch from "../../../hooks/useFetch"
import { formatDate } from "../../../utils/dateUtils"
const LeadAllocationTable = () => {
  const [status, setStatus] = useState("Pending")
  const [allocationOptions, setAllocationOptions] = useState([])
  const [selectedAllocates, setSelectedAllocates] = useState({})
  const [allStaffs, setallStaffs] = useState([])
  const [loader, setloader] = useState(true)
  const [tableData, setTableData] = useState([])
  const { data: leadPendinglist, loading } = UseFetch(
    status && `/lead/getallLead?Status=${status}`
  )
  const { data } = UseFetch("/auth/getallUsers")

  console.log(leadPendinglist)
  useEffect(() => {
    if (data) {
      console.log("h")
      const { allusers = [], allAdmins = [] } = data
      console.log(allusers)

      // Combine allusers and allAdmins
      const combinedUsers = [...allusers, ...allAdmins]

      // Set combined names to state
      // setallStaffs(combinedUsers)

      setAllocationOptions(
        combinedUsers.map((item) => ({
          value: item?._id,
          label: item?.name
        }))
      )
    }
  }, [data])
  console.log(allocationOptions)
  console.log(allStaffs)
  useEffect(() => {
    if (leadPendinglist) {
      setTableData(leadPendinglist)
    }
  }, [leadPendinglist])
  const toggleStatus = () => {
    setStatus(
      status === "Pending Allocation"
        ? "Approved Allocation"
        : "Pending Allocation"
    )
  }
  ;("")

  console.log(tableData)

  return (
    <div className="p-4">
      {/* Toggle Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">{status} Allocation List</h2>
        {/* <button
          onClick={toggleStatus}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Toggle Allocation
        </button> */}
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto rounded-lg text-center">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-blue-500 text-white text-sm">
            <tr>
              <th className="px-4 py-2 text-center">Lead Date</th>
              <th className="px-4 py-2 text-center">Lead ID</th>
              <th className="px-4 py-2 text-center">Customer Name</th>
              <th className="px-4 py-2 text-center">Mobile Number</th>
              <th className="px-4 py-2 text-center">Phone Number</th>
              <th className="px-4 py-2 text-center">Email Id</th>
              <th className="px-2 py-2 text-center">Product/Services</th>
              <th className="px-4 py-2 text-center">Net Amount</th>
              <th className="px-4 py-2 text-center">Lead By</th>
              <th className="px-4 py-2 text-center">Allocated To</th>
              <th className="px-4 py-2 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="text-center divide-gray-200 bg-gray-200">
            {tableData && tableData.length > 0 ? (
              tableData.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-100">
                  <td className="px-1 border border-gray-300">
                    {formatDate(item.leadDate)}
                  </td>
                  <td className="px-4  border border-gray-300">
                    {item?.leadId}
                  </td>
                  <td className="px-4  border border-gray-300">
                    {item?.customerName?.customerName}
                  </td>
                  <td className="px-4  border border-gray-300">
                    {item?.mobile}
                  </td>
                  <td className="px-4  border border-gray-300">{item.phone}</td>
                  <td className="px-4  border border-gray-300">
                    {item?.email}
                  </td>
                  <td className="px-4  border border-gray-300">
                    <button
                      // onClick={}
                      className="bg-blue-700 hover:bg-blue-800 text-white rounded-lg px-4 shadow-md"
                    >
                      View
                    </button>
                  </td>
                  <td className="px-4  border border-gray-300">
                    {item?.netAmount}
                  </td>
                  <td className="px-4  border border-gray-300">
                    {item?.leadBy.name}
                  </td>
                  <td className="  border border-gray-300">
                    <Select
                      options={allocationOptions}
                      value={selectedAllocates[item._id] || null}
                      onChange={(selectedOption) => {
                        console.log(selectedOption)
                        setSelectedAllocates((prev) => ({
                          ...prev,
                          [item._id]: selectedOption
                        }))
                        // handleSelectedC(item._id, selectedOption.value)
                      }}
                      className="w-44 focus:outline-none"
                      styles={{
                        control: (base, state) => ({
                          ...base,
                          boxShadow: "none", // removes blue glow
                          borderColor: state.isFocused
                            ? "#ccc"
                            : base.borderColor, // optional: neutral border on focus
                          "&:hover": {
                            borderColor: "#ccc" // optional hover styling
                          }
                        }),
                        menu: (provided) => ({
                          ...provided,
                          maxHeight: "200px", // Set dropdown max height
                          overflowY: "auto" // Enable scrolling
                        }),
                        menuList: (provided) => ({
                          ...provided,
                          maxHeight: "200px", // Ensures dropdown scrolls internally
                          overflowY: "auto"
                        })
                      }}
                      menuPortalTarget={document.body} // Prevents nested scrolling issues
                      menuShouldScrollIntoView={false}
                    />
                  </td>
                  <td className="px-4  border border-gray-300">
                    {item.department}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="px-4 py-4 text-center bg-gray-100">
                  {loading ? (
                    <div className="flex justify-center items-center gap-2">
                      <PropagateLoader color="#3b82f6" size={10} />
                    </div>
                  ) : (
                    "No Allocation Pending"
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default LeadAllocationTable
