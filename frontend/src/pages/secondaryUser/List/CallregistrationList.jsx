import React, { useState, useEffect, useCallback } from "react"

import io from "socket.io-client" // Import Socket.IO client
import { FaSearch, FaPhone } from "react-icons/fa"
import Tiles from "../../../components/common/Tiles" // Import the Tile component
import { useNavigate } from "react-router-dom"
const socket = io("https://www.crm.camet.in")
// const socket = io("http://localhost:9000") // Adjust the URL to your backend

const CallregistrationList = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [callList, setCallList] = useState([])
  const [filteredCalls, setFilteredCalls] = useState([])
  const [user, setUser] = useState("")

  // Define states for filtered call counts
  const [pendingCallsCount, setPendingCallsCount] = useState(0)
  const [todayCallsCount, setTodayCallsCount] = useState(0)
  const [solvedCallsCount, setSolvedCallsCount] = useState(0)

  // State to track the active filter
  const [activeFilter, setActiveFilter] = useState("All")

  const filterCallData = useCallback((calls) => {
    console.log("callsinfunction", calls)
    const allCallRegistrations = calls.flatMap((call) => call.callregistration)

    // Filter based on status
    const pending = allCallRegistrations.filter(
      (call) => call.formdata.status.toLowerCase() === "pending"
    )
    console.log("pendingfuction", pending.length)
    const solved = allCallRegistrations.filter(
      (call) => call.formdata.status.toLowerCase() === "solved"
    )
    const todaysCallsCount = getTodaysCalls(calls)

    setPendingCallsCount(pending?.length)
    setTodayCallsCount(todaysCallsCount)
    setSolvedCallsCount(solved?.length)
  }, [])

  useEffect(() => {
    if (callList.length > 0) {
      console.log("calllist", callList)
      filterCallData(callList) // Filter call data for counts
      setFilteredCalls(callList)
    }
  }, [callList])

  useEffect(() => {
    const userData = localStorage.getItem("user")
    const user = JSON.parse(userData)
    console.log("hiii")
    setUser(user)

    socket.emit("updatedCalls")
    // Listen for initial data from the server
    socket.on("updatedCalls", (data) => {
      console.log("Received updated data:", data)
      setCallList(data.calls) // Set the received data to your call list
      // Set all calls initially
    })

    //Cleanup the socket connection when the component unmounts
    return () => {
      socket.off("updatedCalls")
      // socket.disconnect()
    }
  }, [])

  const handleSearch = useCallback(
    (query) => {
      const lowerCaseQuery = query.toLowerCase()
      setFilteredCalls(
        applyFilter().filter((calls) =>
          calls.customerName.toLowerCase().includes(lowerCaseQuery)
        )
      )
    },
    [callList, activeFilter]
  )
  useEffect(() => {
    handleSearch(searchQuery)
  }, [searchQuery, handleSearch])

  // Update the filteredCalls whenever activeFilter changes
  useEffect(() => {
    setFilteredCalls(applyFilter())
  }, [activeFilter, callList])

  const getTodaysCalls = (calls) => {
    const today = new Date().toISOString().split("T")[0] // Get today's date in 'YYYY-MM-DD' format

    let todaysCallsCount = 0

    calls.forEach((customer) => {
      customer.callregistration.forEach((call) => {
        const callDate = call.timedata.startTime.split("T")[0] // Get the call date in 'YYYY-MM-DD' format
        if (callDate === today) {
          todaysCallsCount++
        }
      })
    })
    console.log("todayscall", todaysCallsCount)

    return todaysCallsCount
  }

  // Function to filter calls based on the active tile clicked
  const applyFilter = () => {
    if (activeFilter === "Pending") {
      return callList.filter((call) => call.status === "Pending")
    } else if (activeFilter === "Solved") {
      return callList.filter((call) => call.status === "Solved")
    } else if (activeFilter === "Today") {
      const todayDate = new Date().toISOString().slice(0, 10) // Format today's date as YYYY-MM-DD
      return callList.filter(
        (call) =>
          new Date(call.callDate).toISOString().slice(0, 10) === todayDate
      )
    }
    return callList // Return all if no specific filter is applied
  }

  return (
    <div className="container mx-auto h-screen p-4 bg-gray-300 ">
      <div className="w-auto  bg-white shadow-lg rounded p-4  h-full ">
        <div className="flex justify-between items-center px-4 lg:px-6 xl:px-8 mb-2">
          {/* Search Bar for large screens */}
          <div className="mx-4 md:block items-center">
            <div className="relative">
              <FaSearch className="absolute w-5 h-5 left-2 top-2 text-gray-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
            count={pendingCallsCount}
            style={{
              background: `linear-gradient(135deg, rgba(255, 0, 0, 1), rgba(255, 128, 128, 1))` // Adjust gradient here
            }}
            onClick={() => {
              setActiveFilter("Pending")
              setFilteredCalls(applyFilter()) // Update filteredCalls when tile is clicked
            }}
          />

          <Tiles
            title="Solved Calls"
            color="bg-green-500"
            count={solvedCallsCount}
            style={{
              background: `linear-gradient(135deg, rgba(0, 140, 0, 1), rgba(128, 255, 128,1 ))`
            }}
            onClick={() => {
              setActiveFilter("Solved")
              setFilteredCalls(applyFilter()) // Update filteredCalls when tile is clicked
            }}
          />
          <Tiles
            title="Today's Calls"
            color="bg-yellow-500"
            count={todayCallsCount}
            style={{
              background: `linear-gradient(135deg, rgba(255, 255, 1, 1), rgba(255, 255, 128, 1))`
            }}
            onClick={() => {
              setActiveFilter("Today")
              setFilteredCalls(applyFilter()) // Update filteredCalls when tile is clicked
            }}
          />
          <Tiles
            title="Online Call"
            color="bg-blue-500"
            count={"0"}
            style={{
              background: `linear-gradient(135deg, rgba(0, 0, 270, 0.8), rgba(128, 128, 255, 0.8))`
            }}
            onClick={() => {
              setActiveFilter("Online")
              setFilteredCalls(applyFilter()) // Update filteredCalls when tile is clicked
            }}
          />
        </div>

        <div className="overflow-y-auto max-h-96 shadow-md rounded-lg mt-2">
          <table className="divide-y divide-gray-200 w-full">
            <thead className="bg-gray-400 sticky top-0 z-40">
              <tr>
                {user.role === "Admin" && (
                  <th className="px-4 py-3 border-b border-gray-300 text-center">
                    Branch Name
                  </th>
                )}
                <th className="px-4 py-3 border-b border-gray-300 text-center">
                  Token No
                </th>
                <th className="px-4 py-3 border-b border-gray-300 text-center">
                  Customer Name
                </th>
                <th className="px-4 py-3 border-b border-gray-300 text-center">
                  Product Name
                </th>
                <th className="px-4 py-3 border-b border-gray-300 text-center">
                  License No
                </th>

                <th className="px-9 py-3 border-b border-gray-300 text-center">
                  Start
                </th>
                <th className="px-10 py-3 border-b border-gray-300 text-center">
                  End
                </th>
                <th className="px-4 py-3 border-b border-gray-300 text-center">
                  Incoming No
                </th>
                <th className="px-4 py-3 border-b border-gray-300 text-center">
                  Status
                </th>

                <th className="px-4 py-3 border-b border-gray-300 text-center">
                  Attended By
                </th>
                <th className="px-4 py-3 border-b border-gray-300 text-center">
                  Completed By
                </th>
                <th className="px-4 py-3 border-b border-gray-300 text-center">
                  Call
                </th>
              </tr>
            </thead>
            <tbody className="divide-gray-200">
              {/* {filteredCalls?.length > 0 ? (
                filteredCalls.map((calls) =>
                  calls.callregistration.map((item) => {
                    const today = new Date().toISOString().split("T")[0]
                    const startTimeRaw = item?.timedata?.startTime
                    const callDate = startTimeRaw
                      ? new Date(startTimeRaw.split(" ")[0])
                          .toISOString()
                          .split("T")[0]
                      : null

                    return (
                      <>
                        <tr
                          key={calls?._id}
                          className={`text-center border border-b-0 border-gray-300 ${
                            item?.formdata?.status === "solved"
                              ? "bg-green-400"
                              : item?.formdata?.status === "pending"
                              ? callDate === today
                                ? "bg-yellow-400"
                                : "bg-red-400"
                              : "bg-red-400"
                          }`}
                        >
                          {user.role === "Admin" && (
                            <td className="px-4 py-2 text-sm text-[#010101]">
                              {item.branchName}
                            </td>
                          )}

                          <td className="px-4 py-2 text-sm text-[#010101]">
                            {item?.timedata.token}
                          </td>
                          <td className="px-4 py-2 text-sm text-[#010101]">
                            {calls?.customerName}
                          </td>
                          <td className="px-4 py-2 text-sm text-[#010101]">
                            {item?.product?.productName}
                          </td>
                          <td className="px-4 py-2 text-sm text-[#010101]">
                            {item?.license}
                          </td>
                          <td className="px-4 py-2 text-sm text-[#010101]">
                        
                            {new Date(
                              item?.timedata?.startTime
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit"
                            })}
                          </td>
                          <td className="px-4 py-2 text-sm text-[#010101]">
                            
                            {new Date(
                              item?.timedata?.endTime
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit"
                            })}
                          </td>
                          <td className="px-4 py-2 text-sm text-[#010101']">
                            {item?.formdata?.incomingNumber}
                          </td>
                          <td className="px-4 py-2 text-sm text-[#010101]">
                            {item?.formdata?.status}
                          </td>
                         
                          <td className="px-4 py-2 text-sm text-[#010101]">
                            {item?.formdata?.attendedBy}
                          </td>
                          <td className="px-4 py-2 text-sm text-[#010101]">
                            {item?.formdata?.completedBy}
                          </td>
                          <td className="px-4 py-2 text-xl text-blue-800">
                            {item?.formdata?.status !== "solved" ? (
                              <FaPhone
                                onClick={() =>
                                  user.role === "Admin"
                                    ? navigate(
                                        "/admin/transaction/call-registration",
                                        {
                                          state: {
                                            calldetails: calls._id,
                                            token: item.timedata.token
                                          }
                                        }
                                      )
                                    : navigate(
                                        "/staff/transaction/call-registration",
                                        {
                                          state: {
                                            calldetails: calls._id,
                                            token: item.timedata.token
                                          }
                                        }
                                      )
                                }
                              />
                            ) : (
                              ""
                            )}
                          </td>
                        </tr>
                        <tr
                          className={`text-center border-t-0 border-gray-300 ${
                            item?.formdata?.status === "solved"
                              ? "bg-green-400"
                              : item?.formdata?.status === "pending"
                              ? callDate === today
                                ? "bg-yellow-400"
                                : "bg-red-400"
                              : "bg-red-400"
                          }`}
                          style={{ height: "5px" }}
                        >
                          <td
                            colSpan="6"
                            className="py-1 px-8 text-sm text-black text-left"
                          >
                            <strong>Description:</strong>{" "}
                            {item?.formdata?.description || "N/A"}
                          </td>
                          <td
                            colSpan="6"
                            className="py-1 px-12 text-sm text-black text-right"
                          >
                            <strong>Solution:</strong>{" "}
                            {item?.formdata?.solution || "N/A"}
                          </td>
                        </tr>
                      </>
                    )
                  })
                )
              ) : (
                <tr>
                  <td
                    colSpan="10"
                    className="px-4 py-4 text-center text-sm text-gray-500"
                  >
                    No calls found
                  </td>
                </tr>
              )} */}
              {filteredCalls?.length > 0 ? (
                <>
                  {/* Filter and display pending calls first */}
                  {filteredCalls
                    .flatMap((calls) =>
                      calls.callregistration.map((item) => ({ ...item, calls }))
                    )
                    .filter((item) => item?.formdata?.status === "pending")
                    .map((item) => {
                      const today = new Date().toISOString().split("T")[0]
                      const startTimeRaw = item?.timedata?.startTime
                      const callDate = startTimeRaw
                        ? new Date(startTimeRaw.split(" ")[0])
                            .toISOString()
                            .split("T")[0]
                        : null

                      return (
                        <>
                          <tr
                            key={item.calls?._id}
                            className={`text-center border border-b-0 border-gray-300 ${
                              callDate === today
                                ? "bg-yellow-400"
                                : "bg-red-400"
                            }`}
                          >
                            {/* Add your table columns for pending calls */}

                            {user.role === "Admin" && (
                              <td className="px-4 py-2 text-sm text-[#010101]">
                                {item.branchName}
                              </td>
                            )}
                            <td className="px-4 py-2 text-sm text-[#010101]">
                              {item?.timedata.token}
                            </td>
                            <td className="px-4 py-2 text-sm text-[#010101]">
                              {item.calls?.customerName}
                            </td>
                            <td className="px-4 py-2 text-sm text-[#010101]">
                              {item?.product?.productName}
                            </td>
                            <td className="px-4 py-2 text-sm text-[#010101]">
                              {item?.license}
                            </td>
                            <td className="px-4 py-2 text-sm text-[#010101]">
                              {/* {new Date(
                                item?.timedata?.startTime
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                              })} */}

                              {item.calls?.createdAt
                                ? new Date(item.calls?.createdAt)
                                    .toISOString()
                                    .split("T")[0]
                                : "N/A"}
                            </td>
                            <td className="px-4 py-2 text-sm text-[#010101]">
                              {/* {new Date(
                                item?.timedata?.endTime
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                              })} */}
                              {/* {item.calls?.updatedAt
                                ? new Date(item.calls?.updatedAt)
                                    .toISOString()
                                    .split("T")[0]
                                : "N/A"} */}
                            </td>
                            <td className="px-4 py-2 text-sm text-[#010101]">
                              {item?.formdata?.incomingNumber}
                            </td>
                            <td className="px-4 py-2 text-sm text-[#010101]">
                              {item?.formdata?.status}
                            </td>
                            <td className="px-4 py-2 text-sm text-[#010101]">
                              {item?.formdata?.attendedBy}
                            </td>
                            <td className="px-4 py-2 text-sm text-[#010101]">
                              {item?.formdata?.completedBy}
                            </td>
                            <td className="px-4 py-2 text-xl text-blue-800">
                              {item?.formdata?.status !== "solved" ? (
                                <FaPhone
                                  onClick={() =>
                                    user.role === "Admin"
                                      ? navigate(
                                          "/admin/transaction/call-registration",
                                          {
                                            state: {
                                              calldetails: item.calls._id,
                                              token: item.timedata.token
                                            }
                                          }
                                        )
                                      : navigate(
                                          "/staff/transaction/call-registration",
                                          {
                                            state: {
                                              calldetails: item.calls._id,
                                              token: item.timedata.token
                                            }
                                          }
                                        )
                                  }
                                />
                              ) : (
                                ""
                              )}
                            </td>
                          </tr>
                          <tr
                            className={`text-center border-t-0 border-gray-300 ${
                              item?.formdata?.status === "solved"
                                ? "bg-green-400"
                                : item?.formdata?.status === "pending"
                                ? callDate === today
                                  ? "bg-yellow-400"
                                  : "bg-red-400"
                                : "bg-red-400"
                            }`}
                            style={{ height: "5px" }}
                          >
                            <td
                              colSpan="4"
                              className="py-1 px-8 text-sm text-black text-left"
                            >
                              <strong>Description:</strong>{" "}
                              {item?.formdata?.description || "N/A"}
                            </td>

                            <td
                              colSpan="4"
                              className="py-1 px-8 text-sm text-black text-left"
                            >
                              <strong>Duration:</strong>{" "}
                              {/* {item?.timedata?.duration || "N/A"} */}
                              <span className="ml-2">{`${Math.floor(
                                (new Date() - new Date(item.calls?.createdAt)) /
                                  (1000 * 60 * 60 * 24)
                              )} days`}</span>
                              <span className="ml-1">
                                {item?.timedata?.duration || "N/A"}
                              </span>
                            </td>
                            <td
                              colSpan="4"
                              className="py-1 px-12 text-sm text-black text-right"
                            >
                              <strong>Solution:</strong>{" "}
                              {item?.formdata?.solution || "N/A"}
                            </td>
                          </tr>
                        </>
                      )
                    })}

                  {/* Now filter and display solved calls */}
                  {filteredCalls
                    .flatMap((calls) =>
                      calls.callregistration.map((item) => ({ ...item, calls }))
                    )
                    .filter((item) => item?.formdata?.status === "solved")
                    .map((item) => {
                      return (
                        <>
                          <tr
                            key={item.calls?._id}
                            className="text-center border border-b-0 border-gray-300 bg-green-400"
                          >
                            {/* Add your table columns for solved calls */}
                            {user.role === "Admin" && (
                              <td className="px-4 py-2 text-sm text-[#010101]">
                                {item.branchName}
                              </td>
                            )}
                            <td className="px-4 py-2 text-sm text-[#010101]">
                              {item?.timedata.token}
                            </td>
                            <td className="px-4 py-2 text-sm text-[#010101]">
                              {item.calls?.customerName}
                            </td>
                            <td className="px-4 py-2 text-sm text-[#010101]">
                              {item?.product?.productName}
                            </td>
                            <td className="px-4 py-2 text-sm text-[#010101]">
                              {item?.license}
                            </td>
                            <td className="px-4 py-2 text-sm text-[#010101]">
                              {/* {new Date(
                                item?.timedata?.startTime
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                              })} */}
                              {item?.calls?.createdAt
                                ? new Date(item.calls?.createdAt)
                                    .toISOString()
                                    .split("T")[0]
                                : "N/A"}
                            </td>
                            <td className="px-4 py-2 text-sm text-[#010101]">
                              {/* {new Date(
                                item?.timedata?.endTime
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit"
                              })} */}
                              {item?.calls?.updatedAt
                                ? new Date(item.calls?.updatedAt)
                                    .toISOString()
                                    .split("T")[0]
                                : "N/A"}
                            </td>
                            <td className="px-4 py-2 text-sm text-[#010101]">
                              {item?.formdata?.incomingNumber}
                            </td>
                            <td className="px-4 py-2 text-sm text-[#010101]">
                              {item?.formdata?.status}
                            </td>
                            <td className="px-4 py-2 text-sm text-[#010101]">
                              {item?.formdata?.attendedBy}
                            </td>
                            <td className="px-4 py-2 text-sm text-[#010101]">
                              {item?.formdata?.completedBy}
                            </td>
                            <td className="px-4 py-2 text-xl text-blue-800"></td>
                          </tr>
                          <tr
                            className={`text-center border-t-0 border-gray-300 ${
                              item?.formdata?.status === "solved"
                                ? "bg-green-400"
                                : item?.formdata?.status === "pending"
                                ? callDate === today
                                  ? "bg-yellow-400"
                                  : "bg-red-400"
                                : "bg-red-400"
                            }`}
                            style={{ height: "5px" }}
                          >
                            <td
                              colSpan="4"
                              className="py-1 px-8 text-sm text-black text-left"
                            >
                              <strong>Description:</strong>{" "}
                              {item?.formdata?.description || "N/A"}
                            </td>
                            <td
                              colSpan="4"
                              className="py-1 px-8 text-sm text-black text-left"
                            >
                              <strong>Duration:</strong>
                              {""}
                              <span className="ml-2">{`${Math.floor(
                                (new Date(item.calls?.updatedAt) -
                                  new Date(item.calls?.createdAt)) /
                                  (1000 * 60 * 60 * 24)
                              )} days`}</span>
                              <span className="ml-1">
                                {item?.timedata?.duration || "N/A"}
                              </span>
                            </td>
                            <td
                              colSpan="4"
                              className="py-1 px-12 text-sm text-black text-right"
                            >
                              <strong>Solution:</strong>{" "}
                              {item?.formdata?.solution || "N/A"}
                            </td>
                          </tr>
                        </>
                      )
                    })}
                </>
              ) : (
                <tr>
                  <td
                    colSpan="10"
                    className="px-4 py-4 text-center text-sm text-gray-500"
                  >
                    No calls found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default CallregistrationList
