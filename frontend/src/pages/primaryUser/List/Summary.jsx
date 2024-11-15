import { useEffect, useState } from "react"
import { FaSearch, FaPhone } from "react-icons/fa"
import Tiles from "../../../components/common/Tiles"
import UseFetch from "../../../hooks/useFetch"
import io from "socket.io-client" // Import Socket.IO client
// const socket = io("http://localhost:9000")

const Summary = () => {
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [pendingCallsCount, setPendingCallsCount] = useState(0)
  const [todayCallsCount, setTodayCallsCount] = useState(0)
  const [solvedCallsCount, setTodaysSolvedCount] = useState(0)
  const [Calls, setCalls] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [customerSummary, setCustomerSummary] = useState([])
  const [customerCalls, setCustomerCalls] = useState([])
  const [callList, setCallList] = useState([])
  const [branch, setBranch] = useState([])
  const { data: branches } = UseFetch("/branch/getBranch")
  const [users, setUsers] = useState(null)
  const [selectedBranch, setSelectedBranch] = useState("All")
  const [isToggled, setIsToggled] = useState(false)

  useEffect(() => {
    if (branches) {
      const userData = localStorage.getItem("user")
      const user = JSON.parse(userData)
      setUsers(user)
      setBranch(branches)
    }
  }, [branches])

  useEffect(() => {
    if(isToggled){
      

    }else{
      const customerSummaries = callList
      .filter(
        (customer) =>
          selectedBranch === "All" ||
          customer.callregistration.some((call) =>
            call.branchName.includes(selectedBranch)
          )
      )
      .map((customer) => {
        const totalCalls = customer.callregistration.length
        const solvedCalls = customer.callregistration.filter(
          (call) => call.formdata.status === "solved"
        ).length

        const pendingCalls = totalCalls - solvedCalls
        const today = new Date().toISOString().split("T")[0]
        console.log(today)
        const todaysCalls = customer.callregistration.filter(
          (call) =>
            new Date(call?.timedata?.startTime).toISOString().split("T")[0] ===
            today
        ).length
        console.log(todaysCalls)

        return {
          customerId: customer._id,
          customerName: customer.customerName,
          totalCalls,
          solvedCalls,
          pendingCalls,
          todaysCalls
        }
      })

    setCustomerSummary(customerSummaries)
    }
   
  }, [callList, selectedBranch, isToggled])
  
  useEffect(() => {
    if (isModalOpen && selectedCustomer) {
      const customerData = callList
        .filter((customer) => customer._id === selectedCustomer) // Filter for the selected customer
        .map((customer) => {
          const today = new Date().toISOString().slice(0, 10) // Get today's date in YYYY-MM-DD format
          console.log(today)
          // Get all calls for the selected customer
          const allCalls = customer.callregistration.map((call) => call)
          console.log(allCalls)
          // Calculate summary counts
          const totalCalls = allCalls.length
          const solvedCalls = allCalls.filter(
            (call) => call.formdata?.status === "solved"
          ).length
          const pendingCalls = totalCalls - solvedCalls
          const todaysCalls = allCalls.filter((call) => {
            const callDate = new Date(call?.timedata?.startTime)
              .toISOString()
              .split("T")[0] // Extracts only the date
            return callDate === today
          }).length

          return {
            customerName: customer.customerName,
            totalCalls,
            solvedCalls,
            pendingCalls,
            todaysCalls,
            allCalls // Detailed call records for listing in a table
          }
        })[0] // Assuming there's only one customer with this name
      console.log(customerData)
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().slice(0, 10)
      // Sort calls: pending calls first, today's calls second, and solved calls last
      const sortedCalls = customerData.allCalls.sort((a, b) => {
        const isAPending = a.formdata?.status === "pending"
        const isBPending = b.formdata?.status === "pending"
        const isAToday = a.timedata?.startTime?.slice(0, 10) === today
        const isBToday = b.timedata?.startTime?.slice(0, 10) === today
        const isASolved = a.formdata?.status === "solved"
        const isBSolved = b.formdata?.status === "solved"

        if (isAPending && !isBPending) return -1
        if (!isAPending && isBPending) return 1
        if (isAToday && !isBToday) return -1
        if (!isAToday && isBToday) return 1
        if (isASolved && !isBSolved) return 1
        if (!isASolved && isBSolved) return -1

        return 0
      })
      setCustomerCalls(customerData)
      setCalls(sortedCalls)

      console.log(sortedCalls)
    }
  }, [isModalOpen])
  console.log(customerCalls)
  console.log(customerSummary)
  useEffect(() => {
    if (branch) {
      socket.emit("updatedCalls")
      // Listen for initial data from the server
      socket.on("updatedCalls", (data) => {
        if (users.role === "Admin") {
          setCallList(data.calls)
        } else {
          const userBranchName = new Set(
            users.selected.map((branch) => branch.branchName)
          )
          const branchNamesArray = Array.from(userBranchName)
          const filtered = data.calls.filter((call) =>
            call.callregistration.some((registration) => {
              const hasMatchingBranch = registration.branchName.some((branch) =>
                branchNamesArray.includes(branch)
              )
              // If user has only one branch, ensure it matches exactly and no extra branches
              if (branchNamesArray.length === 1) {
                return (
                  hasMatchingBranch &&
                  registration.branchName.length === 1 &&
                  registration.branchName[0] === branchNamesArray[0]
                )
              }
              // If user has more than one branch, just check for any match
              return hasMatchingBranch
            })
          )
          setCallList(filtered)
        }
      })

      // Cleanup the socket connection when the component unmounts
      return () => {
        socket.off("updatedCalls")
      }
    }
  }, [branch, users])
  console.log(customerSummary)
  const handleChange = (event) => {
    const selected = event.target.value
    if (selected === "All") {
      setSelectedBranch("All")
    } else {
      const branchDetails = branch.find((item) => item._id === selected)
      setSelectedBranch(branchDetails ? branchDetails.branchName : "All")
    }
  }
  console.log(customerSummary)
  const toggle = () => setIsToggled(!isToggled)
  const openModal = (customerid) => {
    console.log(customerid)
    setSelectedCustomer(customerid)
    setIsModalOpen(true)
  }
  console.log(customerSummary)

  const closeModal = () => {
    console.log("hii")
    setIsModalOpen(false)
    setSelectedCustomer(null)
  }

  return (
    <div className="antialiased font-sans container mx-auto px-4 sm:px-8">
      <div className="py-8">
        <h2 className="text-2xl font-semibold leading-tight">Branches</h2>

        <div className="my-2 flex sm:flex-row flex-col">
          <div className="flex flex-row mb-1 sm:mb-0">
            <div className="relative">
              <select
                onChange={handleChange}
                className="h-full rounded-r border-t sm:rounded-r-none sm:border-r-0 border-r border-b block appearance-none w-full bg-white border-gray-400 text-gray-700 py-2 px-4 pr-8 leading-tight focus:outline-none focus:border-l focus:border-r focus:bg-white focus:border-gray-500"
              >
                <option value="All">All</option>
                {branches?.map((branch) => (
                  <option key={branch._id} value={branch._id}>
                    {branch.branchName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="block relative">
            <input
              placeholder="Search"
              className="appearance-none rounded-r rounded-l sm:rounded-l-none border border-gray-400 border-b block pl-8 pr-6 py-2 w-full bg-white text-sm placeholder-gray-400 text-gray-700 focus:bg-white focus:placeholder-gray-600 focus:text-gray-700 focus:outline-none"
            />
          </div>
          <div className="flex justify-end flex-grow">
            <span className="text-gray-600 mr-4 font-bold">User</span>
            <button
              onClick={toggle}
              className={`${
                isToggled ? "bg-green-500" : "bg-gray-300"
              } w-16 h-8 flex items-center rounded-full p-1 transition-colors duration-300`}
            >
              <div
                className={`${
                  isToggled ? "translate-x-8" : "translate-x-0"
                } w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300`}
              ></div>
            </button>
          </div>
        </div>
        <div className="flex justify-between">
          <div className="text-blue-700">
            {customerSummary.length} Total Customers
          </div>
          <div></div>
        </div>

        <div className="w-full mx-auto shadow-lg mt-6">
          <div className="inline-block w-full mx-auto shadow rounded-lg overflow-x-auto lg:max-h-[440px] overflow-y-auto md:max-h-[390px]">
            <table className="min-w-full leading-normal text-left max-w-7xl mx-auto">
              <thead className="sticky top-0 z-30 bg-purple-300">
                <tr>
                  <th className="px-5 py-3 border-b-2 border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">
                    Total Calls
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">
                    Solved Calls
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">
                    Pending Calls
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">
                    Today's Calls
                  </th>
                  <th className="px-5 py-3 border-b-2 border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider text-center">
                    View
                  </th>
                </tr>
              </thead>
              <tbody>
                {customerSummary.map((customer) => (
                  <tr key={customer.customerName}>
                    <td className="px-5 py-3 border-b border-gray-200 bg-white text-sm">
                      {customer.customerName}
                    </td>
                    <td className="px-5 py-3 border-b border-gray-200 bg-white text-center text-sm">
                      {customer.totalCalls}
                    </td>
                    <td className="px-5 py-3 border-b border-gray-200 bg-white text-center text-sm">
                      {customer.solvedCalls}
                    </td>
                    <td className="px-5 py-3 border-b border-gray-200 bg-white text-center text-sm">
                      {customer.pendingCalls}
                    </td>
                    <td className="px-5 py-3 border-b border-gray-200 bg-white text-center text-sm">
                      {customer.todaysCalls}
                    </td>
                    <td className="px-5 py-3 border-b border-gray-200 bg-white text-center text-sm">
                      <button
                        onClick={() => openModal(customer.customerId)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        View Calls
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 h-screen">
          <div className="container mx-auto  p-8  h-screen">
            <div className="w-auto  bg-white shadow-lg rounded p-4  h-full ">
              <div className="flex justify-between items-center px-4 lg:px-6 xl:px-8 mb-2">
                {/* Search Bar for large screens */}
                <div className="mx-4 md:block items-center">
                  <div className="relative">
                    <FaSearch className="absolute w-5 h-5 left-2 top-2 text-gray-500" />
                  </div>
                  <input
                    type="text"
                    // value={searchQuery}
                    // onChange={handleChange}
                    className=" w-full border border-gray-300 rounded-full py-1 px-4 pl-10 focus:outline-none"
                    placeholder="Search for..."
                  />
                </div>
              </div>
              <hr className="border-t-2 border-gray-300 mb-2 " />
              {/* <Tiles datas={registeredcalllist?.alltokens} /> */}
              <div className="flex justify-around">
                <Tiles
                  title="Pending Calls"
                  count={customerCalls.pendingCalls}
                  style={{
                    background: `linear-gradient(135deg, rgba(255, 0, 0, 1), rgba(255, 128, 128, 1))` // Adjust gradient here
                  }}
                  // onClick={() => {
                  //   setActiveFilter("Pending")
                  //   setFilteredCalls(applyFilter()) // Update filteredCalls when tile is clicked
                  // }}
                />

                <Tiles
                  title="Solved Calls"
                  color="bg-green-500"
                  count={customerCalls.solvedCalls}
                  style={{
                    background: `linear-gradient(135deg, rgba(0, 140, 0, 1), rgba(128, 255, 128,1 ))`
                  }}
                  // onClick={() => {
                  //   setActiveFilter("Solved")
                  //   setFilteredCalls(applyFilter()) // Update filteredCalls when tile is clicked
                  // }}
                />
                <Tiles
                  title="Today's Calls"
                  color="bg-yellow-500"
                  count={customerCalls.todaysCalls}
                  style={{
                    background: `linear-gradient(135deg, rgba(255, 255, 1, 1), rgba(255, 255, 128, 1))`
                  }}
                  // onClick={() => {
                  //   setActiveFilter("Today")
                  //   setFilteredCalls(applyFilter()) // Update filteredCalls when tile is clicked
                  // }}
                />
                <Tiles
                  title="Online Call"
                  color="bg-blue-500"
                  count={"0"}
                  style={{
                    background: `linear-gradient(135deg, rgba(0, 0, 270, 0.8), rgba(128, 128, 255, 0.8))`
                  }}
                  // onClick={() => {
                  //   setActiveFilter("Online")
                  //   setFilteredCalls(applyFilter()) // Update filteredCalls when tile is clicked
                  // }}
                />
              </div>
              <div className="overflow-y-auto overflow-x-auto max-h-60 sm:max-h-80 md:max-h-[380px] lg:max-h-[398px] shadow-md rounded-lg mt-2 ">
                <table className="divide-y divide-gray-200 w-full text-center">
                  <thead className="bg-purple-300 sticky top-0 z-40  ">
                    <tr>
                      <th className="px-2 py-3 border-b border-gray-300 text-sm text-center whitespace-nowrap">
                        Token No
                      </th>

                      <th className="px-2 py-3 border-b border-gray-300 text-sm text-center whitespace-nowrap">
                        Product Name
                      </th>
                      <th className="px-2 py-3 border-b border-gray-300 text-sm text-center whitespace-nowrap">
                        License No
                      </th>

                      <th className="px-10 py-3 border-b border-gray-300 text-sm text-center whitespace-nowrap">
                        Start <br />
                        (D-M-Y)
                      </th>
                      <th className="px-10 py-3 border-b border-gray-300 text-sm text-center whitespace-nowrap">
                        End <br />
                        (D-M-Y)
                      </th>
                      <th className="px-2 py-3 border-b border-gray-300 text-sm text-center whitespace-nowrap">
                        Incoming No
                      </th>
                      <th className="px-2 py-3 border-b border-gray-300 text-sm text-center whitespace-nowrap">
                        Status
                      </th>

                      <th className="px-2 py-3 border-b border-gray-300 text-sm text-center whitespace-nowrap">
                        Attended By
                      </th>
                      <th className="px-2 py-3 border-b border-gray-300 text-sm text-center whitespace-nowrap">
                        Completed By
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-gray-200">
                    {Calls.map((call) => {
                      const startTimeRaw = call?.timedata?.startTime
                      const callDate = startTimeRaw
                        ? new Date(startTimeRaw.split(" ")[0])
                            .toISOString()
                            .split("T")[0]
                        : null
                      const today = new Date().toISOString().split("T")[0]

                      const isToday = callDate === today

                      const isCompletedToday = call.formdata.status === "solved"
                      const isPast = callDate < today
                      console.log(isCompletedToday)
                      console.log(isToday)
                      console.log(isPast)
                      // Determine row color based on conditions
                      const rowColor = isCompletedToday
                        ? "linear-gradient(135deg, rgba(0, 140, 0, 1), rgba(128, 255, 128, 1))"
                        : isToday
                        ? "linear-gradient(135deg,rgba(255,255,1,1),rgba(255,255,128,1))"
                        : isPast
                        ? "linear-gradient(135deg,rgba(255,0,0,1),rgba(255,128,128,1))"
                        : ""

                      return (
                        <>
                          <tr
                            key={call._id}
                            style={{ background: rowColor }}
                            className="border border-b-0 "
                          >
                            <td className="px-2 py-2 text-sm w-12 text-[#010101]">
                              {call?.timedata?.token}
                            </td>
                            <td className="px-2 py-2 text-sm w-12 text-[#010101]">
                              {call?.product?.productName}
                            </td>
                            <td className="px-2 py-2 text-sm w-12 text-[#010101]">
                              {call?.license}
                            </td>
                            <td className="px-2 py-2 text-sm w-12 text-[#010101]">
                              {new Date(
                                call?.timedata?.startTime
                              ).toLocaleDateString("en-GB", {
                                timeZone: "UTC",
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric"
                              })}
                            </td>
                            <td className="px-2 py-2 text-sm w-12 text-[#010101]">
                              {call?.formdata?.status === "solved"
                                ? new Date(
                                    call?.timedata?.endTime
                                  ).toLocaleDateString("en-GB", {
                                    timeZone: "UTC",
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric"
                                  })
                                : ""}
                            </td>
                            <td className="px-2 py-2 text-sm w-12 text-[#010101]">
                              {call?.formdata?.incomingNumber}
                            </td>
                            <td className="px-2 py-2 text-sm w-12 text-[#010101]">
                              {call?.formdata?.status}
                            </td>
                            <td className="px-2 py-2 text-sm w-12 text-[#010101]">
                              {call?.formdata?.attendedBy}
                            </td>
                            <td className="px-2 py-2 text-sm w-12 text-[#010101]">
                              {call?.formdata?.completedBy}
                            </td>
                          </tr>
                          <tr
                            className={`text-center border-t-0 border-gray-300 ${
                              call?.formdata?.status === "solved"
                                ? "bg-[linear-gradient(135deg,_rgba(0,140,0,1),_rgba(128,255,128,1))]"
                                : call?.formdata?.status === "pending"
                                ? callDate === today
                                  ? "bg-[linear-gradient(135deg,_rgba(255,255,1,1),_rgba(255,255,128,1))]"
                                  : "bg-[linear-gradient(135deg,_rgba(255,0,0,1),_rgba(255,128,128,1))]"
                                : "bg-[linear-gradient(135deg,_rgba(255,0,0,1),_rgba(255,128,128,1))]"
                            }`}
                            style={{ height: "5px" }}
                          >
                            <td
                              colSpan="4"
                              className="py-2 px-8 text-sm text-black text-left"
                            >
                              <strong>Description:</strong>{" "}
                              {call?.formdata?.description || "N/A"}
                            </td>

                            <td
                              colSpan="2"
                              className="py-2 px-8 text-sm text-black text-left"
                            >
                              <strong>Duration:</strong>{" "}
                              <span className="ml-2">
                                {`${Math.floor(
                                  (new Date(
                                    call?.formdata?.status === "solved"
                                      ? call.timedata?.endTime // Use end date if the call is solved
                                      : new Date().setHours(0, 0, 0, 0) // Use today's date at midnight if not solved
                                  ) -
                                    new Date(
                                      new Date(
                                        call.timedata?.startTime
                                      ).setHours(0, 0, 0, 0)
                                    )) /
                                    (1000 * 60 * 60 * 24)
                                )} days`}
                              </span>
                              <span className="ml-1">
                                {call?.timedata?.duration || "N/A"}
                              </span>
                            </td>
                            <td
                              colSpan="6"
                              className="py-2 px-12 text-sm text-black text-right"
                            >
                              <strong>Solution:</strong>{" "}
                              {call?.formdata?.solution || "N/A"}
                            </td>
                          </tr>
                        </>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-center items-center mt-8">
                <button
                  className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 p-2 text-white rounded-lg"
                  onClick={closeModal}
                >
                  CLOSE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Summary