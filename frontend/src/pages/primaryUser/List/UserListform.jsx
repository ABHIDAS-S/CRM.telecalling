import { useState, useEffect } from "react"
import { CiEdit } from "react-icons/ci"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import { PropagateLoader } from "react-spinners"
import { useNavigate } from "react-router-dom"
import api from "../../../api/api"
import DeleteAlert from "../../../components/common/DeleteAlert"
import {
  FaUserPlus,
  FaSearch,
  FaRegFileExcel,
  FaFilePdf,
  FaPrint,
  FaChevronDown,
  FaBuilding
} from "react-icons/fa"
import { Link } from "react-router-dom"
import debounce from "lodash.debounce"
import UseFetch from "../../../hooks/useFetch"
import { getLocalStorageItem } from "../../../helper/localstorage"

const UserListform = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUser] = useState([])
  console.log(users)
  const [allusers, setallusers] = useState([])
  const [selectedBranch, setselectedBranch] = useState(null)
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false)
  const [loggeduser, setloggeduser] = useState(null)
  const { data, loading } = UseFetch("/auth/getallUsers")
  console.log(data)
  useEffect(() => {
    if (data) {
      const logged = getLocalStorageItem("user")
      const { allusers } = data

      setallusers(allusers)
      const filteredusers = allusers.filter((user) =>
        user.selected
          .map((branch) => branch.branch_id)
          .includes(logged.selected[0].branch_id)
      )

      setUser(sortByVerified(filteredusers))
      setloggeduser(logged)
      setselectedBranch(logged.selected[0].branch_id)
    }
  }, [data])
  const sortByVerified = (arr) => {
    return arr.sort((a, b) => (b.isVerified === true) - (a.isVerified === true))
  }

  const handleSearch = debounce((query) => {
    console.log("d")
    const { allusers } = data
    const input = query.trim()
    setUser([])
    setSearchQuery(input)

    const lowerCaseQuery = input.toLowerCase()

    const filteredName = allusers.filter((user) =>
      user.name.toLowerCase().startsWith(lowerCaseQuery)
    )
    const filteredMobile = allusers.filter((user) =>
      user.mobile.toString().toLowerCase().startsWith(lowerCaseQuery)
    )

    if (filteredName.length > 0) {
      const filtereusersbranchwise = filteredName.filter((user) =>
        user.selected.map((branch) => branch.branch_id).includes(selectedBranch)
      )

      setUser(sortByVerified(filtereusersbranchwise))
    } else if (filteredMobile.length > 0) {
      const filtereusersbranchwise = filteredMobile.filter((user) =>
        user.selected.map((branch) => branch.branch_id).includes(selectedBranch)
      )

      setUser(sortByVerified(filtereusersbranchwise))
    }

    // Reset to initial count after filtering
  }, 300)
  const handlebranchChange = (value) => {
    const [id] = value.split("||")
    setselectedBranch(id)
    if (searchQuery) {
      const filteredbyquery = allusers.filter((user) =>
        user.name.toLowerCase().startsWith(searchQuery.toLocaleLowerCase())
      )
      const filtereusersbranchwise = filteredbyquery.filter((user) =>
        user.selected.map((branch) => branch.branch_id).includes(id)
      )
      setUser(sortByVerified(filtereusersbranchwise))
    } else {
      const filtereusersbranchwise = allusers.filter((user) =>
        user.selected.map((branch) => branch.branch_id).includes(id)
      )
      setUser(sortByVerified(filtereusersbranchwise))
    }
  }
  const handleDelete = async (id) => {
    try {
      await api.delete(`/auth/userDelete?id=${id}`)

      // Remove the deleted item from the items array
      setUser((prevItems) =>
        sortByVerified(prevItems.filter((item) => item._id !== id))
      )
    } catch (error) {
      console.error("Failed to delete item", error)
      // toast.error("Failed to delete item. Please try again.")
    }
  }
  const handleDownload = (data) => {
    // Using ExcelJS instead of XLSX for better styling control
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("UserReport")

    // Define column structure with widths
    worksheet.columns = [
      { header: "Branch", key: "branch", width: 25 },
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 35 },
      { header: "Dob", key: "dob", width: 15 },
      { header: "Blood Group", key: "bloodgroup", width: 15 },
      { header: "Gender", key: "gender", width: 15 },
      { header: "Address", key: "address", width: 45 },
      { header: "Pincode", key: "pincode", width: 15 },
      { header: "Joining Date", key: "joiningdate", width: 15 },
      { header: "Designation", key: "designation", width: 25 },
      { header: "Department", key: "department", width: 20 },
      {
        header: "Privilege leave Starts",
        key: "privileageleavestartfrom",
        width: 25
      },
      { header: "Casual leave Starts", key: "casualleavestartfrom", width: 25 },
      { header: "AssignedTo", key: "assignedto", width: 25 }
    ]

    // Style the header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF0000" } // Light grey background
      }
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } } // Black bold text
      cell.alignment = { horizontal: "center", vertical: "middle" }
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      }
    })

    // Add data rows
    data.forEach((user) => {
      const branchNames = Array.isArray(user?.selected)
        ? user.selected
            .map((item) => item?.branchName)
            .filter(Boolean) // removes null/undefined
            .join(", ")
        : ""
      const row = worksheet.addRow({
        branch: branchNames,
        name: user?.name,
        email: user?.email,
        dob: user?.dateofbirth,
        bloodgroup: user?.bloodgroup,
        gender: user?.gender,
        address: user?.address,
        pincode: user.pincode,
        joiningdate: user?.joiningdate,
        designation: user?.designation,
        department: user?.department?.department,
        privileageleavestartfrom: user?.privilegeleavestartsfrom || "-",
        casualleavestartfrom: user?.casualleavestartsfrom || "-",
        assignedto: user?.assignedto?.name
      })

      // Style data cells
      row.eachCell((cell, colNumber) => {
        // Center-align all cells except the name column (first column)
        if (colNumber > 1) {
          cell.alignment = { horizontal: "center", vertical: "middle" }
        }

        // Add borders to all cells
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        }

        // Apply zebra striping for better readability
        if (row.number % 2 === 0) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFAFAFA" } // Very light grey for even rows
          }
        }
      })
    })

    // Write to buffer and download
    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      })
      saveAs(blob, "User_Report.xlsx")
    })
  }
  return (
    // <div className="h-full flex flex-col bg-gray-50">
    //   {/* Header Section - Sticky */}
    //   <div className="bg-white shadow-sm border-b sticky top-0 z-20 flex-shrink-0">
    //     {/* Title and Search Bar */}
    //     <div className="px-3 py-2">
    //       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    //         <h1 className="text-2xl font-bold text-gray-900">Users List</h1>

    //         {/* Search Bar */}
    //         <div className="relative w-full sm:w-80">
    //           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
    //             <FaSearch className="h-4 w-4 text-gray-400" />
    //           </div>
    //           <input
    //             type="text"
    //             onChange={(e) => handleSearch(e.target.value)}
    //             className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none
                         
    //                      placeholder-gray-400 text-sm transition-colors duration-200"
    //             placeholder="Search users..."
    //           />
    //         </div>
    //       </div>
    //     </div>

    //     {/* Action Buttons */}
    //     <div className="px-3 pb-2">
    //       <div className="flex md:flex-wrap gap-2 justify-between md:justify-start md:gap-2">
    //         <Link
    //           to={
    //             loggeduser?.role === "Admin"
    //               ? "/admin/masters/userRegistration"
    //               : "/staff/masters/userRegistration"
    //           }
    //           className="inline-flex items-center px-3 py-2 border border-gray-300 
    //                    rounded-md text-sm font-medium text-gray-700 bg-white 
    //                    hover:bg-gray-50 focus:outline-none focus:ring-2 
    //                    focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
    //         >
    //           <FaUserPlus className="w-4 h-4 mr-2" />
    //           <span className="hidden sm:inline">Add User</span>
    //         </Link>

    //         <button
    //           onClick={() => handleDownload(users)}
    //           className="inline-flex items-center px-3 py-2 border border-gray-300 
    //                          rounded-md text-sm font-medium text-gray-700 bg-white 
    //                          hover:bg-gray-50 focus:outline-none focus:ring-2 
    //                          focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
    //         >
    //           <FaRegFileExcel className="w-4 h-4 mr-2 text-green-600" />
    //           <span className="hidden sm:inline">Excel</span>
    //         </button>

    //         <button
    //           className="inline-flex items-center px-3 py-2 border border-gray-300 
    //                          rounded-md text-sm font-medium text-gray-700 bg-white 
    //                          hover:bg-gray-50 focus:outline-none focus:ring-2 
    //                          focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
    //         >
    //           <FaFilePdf className="w-4 h-4 mr-2 text-red-600" />
    //           <span className="hidden sm:inline">PDF</span>
    //         </button>

    //         <button
    //           className="inline-flex items-center px-3 py-2 border border-gray-300 
    //                          rounded-md text-sm font-medium text-gray-700 bg-white 
    //                          hover:bg-gray-50 focus:outline-none focus:ring-2 
    //                          focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
    //         >
    //           <FaPrint className="w-4 h-4 mr-2" />
    //           <span className="hidden sm:inline">Print</span>
    //         </button>
    //         <select
    //           onChange={(e) => handlebranchChange(e)}
    //           className="w-30 md:w-auto px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none  text-gray-700 bg-white"
    //         >
    //           {loggeduser &&
    //             loggeduser?.selected?.map((branch) => (
    //               <option
    //                 key={branch._id}
    //                 value={`${branch.branch_id}||${branch.branchName}`}
    //               >
    //                 {branch?.branchName}
    //               </option>
    //             ))}
    //         </select>
    //       </div>
    //     </div>
    //   </div>
    //   <div className="flex-1 overflow-hidden p-3">
    //     <div className="bg-white rounded-xl shadow overflow-hidden h-full flex flex-col">
    //       <div className="flex-1 overflow-auto">
    //         <table className="min-w-full divide-y divide-gray-200">
    //           <thead className="bg-green-300">
    //             <tr>
    //               <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-16 bg-green-300">
    //                 No
    //               </th>
    //               <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-32 bg-green-300">
    //                 Branch
    //               </th>
    //               <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-40 bg-green-300">
    //                 User Name
    //               </th>
    //               <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-24 bg-green-300">
    //                 ID
    //               </th>
    //               <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-48 bg-green-300">
    //                 User ID
    //               </th>
    //               <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-32 bg-green-300">
    //                 Mobile
    //               </th>
    //               <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-32 bg-green-300">
    //                 Department
    //               </th>
    //               <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-32 bg-green-300">
    //                 Designation
    //               </th>

    //               <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-24 bg-green-300">
    //                 Role
    //               </th>
    //               <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-32 bg-green-300">
    //                 Assigned To
    //               </th>
    //               <th className="sticky top-0 z-10 px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider min-w-32 bg-green-300">
    //                 Status
    //               </th>
    //               <th className="sticky top-0 z-10 px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider min-w-24 bg-green-300">
    //                 Actions
    //               </th>
    //             </tr>
    //           </thead>

    //           <tbody className="bg-white divide-y divide-gray-200">
    //             {/* map rows here */}
    //             {users?.length > 0 ? (
    //               users.map((user, index) => {
    //                 if (user?.selected?.length > 0) {
    //                   return user.selected.map((item, itemIndex) => (
    //                     <tr
    //                       key={`${user._id}-${itemIndex}`}
    //                       className="hover:bg-gray-50 transition-colors duration-150"
    //                     >
    //                       <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
    //                         {itemIndex === 0 ? index + 1 : ""}
    //                       </td>
    //                       <td className="px-4 py-4 whitespace-nowrap">
    //                         <div className="text-sm text-gray-900">
    //                           {item?.branchName}
    //                         </div>
    //                       </td>
    //                       <td className="px-4 py-4 whitespace-nowrap">
    //                         <div className="text-sm font-medium text-gray-900">
    //                           {user?.name}
    //                         </div>
    //                       </td>
    //                       <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
    //                         {user?.attendanceId}
    //                       </td>
    //                       <td className="px-4 py-4 whitespace-nowrap">
    //                         <div className="text-sm text-gray-900">
    //                           {user?.email}
    //                         </div>
    //                       </td>
    //                       <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
    //                         {user?.mobile}
    //                       </td>
    //                       <td className="px-4 py-4 whitespace-nowrap">
    //                         <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
    //                           {user?.department?.department}
    //                         </span>
    //                       </td>
    //                       <td className="px-4 py-4 whitespace-nowrap">
    //                         <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
    //                           {user?.designation}
    //                         </span>
    //                       </td>

    //                       <td className="px-4 py-4 whitespace-nowrap">
    //                         <span
    //                           className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
    //                             user?.role === "Admin"
    //                               ? "bg-purple-100 text-purple-800"
    //                               : user?.role === "Manager"
    //                                 ? "bg-green-100 text-green-800"
    //                                 : "bg-gray-100 text-gray-800"
    //                           }`}
    //                         >
    //                           {user?.role}
    //                         </span>
    //                       </td>
    //                       <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
    //                         {user.assignedto ? (
    //                           user.assignedto?.name
    //                         ) : (
    //                           <span className="text-gray-400 italic">
    //                             Not assigned
    //                           </span>
    //                         )}
    //                       </td>
    //                       <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
    //                         <span
    //                           className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
    //                             user?.isVerified
    //                               ? "bg-green-100 text-green-500"
    //                               : "bg-red-100 text-red-500"
    //                           }`}
    //                         >
    //                           {user.isVerified ? "Active" : "Deactive"}
    //                         </span>
    //                       </td>
    //                       <td className="px-4 py-4 whitespace-nowrap text-center">
    //                         <div className="flex items-center justify-center space-x-2">
    //                           <button
    //                             onClick={() => {
    //                               if (loggeduser?.role === "Admin") {
    //                                 navigate("/admin/masters/userEdit", {
    //                                   state: { user, selected: item }
    //                                 })
    //                               } else if (
    //                                 loggeduser?.role === "Staff" ||
    //                                 loggeduser?.role === "Manager"
    //                               ) {
    //                                 navigate("/staff/masters/userEdit", {
    //                                   state: { user, selected: item }
    //                                 })
    //                               }
    //                             }}
    //                             className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors duration-200"
    //                             title="Edit User"
    //                           >
    //                             <CiEdit className="w-5 h-5" />
    //                           </button>
    //                           <DeleteAlert
    //                             onDelete={handleDelete}
    //                             Id={user._id}
    //                           />
    //                         </div>
    //                       </td>
    //                     </tr>
    //                   ))
    //                 } else {
    //                   return (
    //                     <tr
    //                       key={user._id}
    //                       className="hover:bg-gray-50 transition-colors duration-150"
    //                     >
    //                       <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
    //                         {index + 1}
    //                       </td>
    //                       <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">
    //                         -
    //                       </td>
    //                       <td className="px-4 py-4 whitespace-nowrap">
    //                         <div className="text-sm font-medium text-gray-900">
    //                           {user?.name}
    //                         </div>
    //                       </td>
    //                       <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
    //                         {user?.attendanceId}
    //                       </td>
    //                       <td className="px-4 py-4 whitespace-nowrap">
    //                         <div className="text-sm text-gray-900">
    //                           {user?.email}
    //                         </div>
    //                       </td>
    //                       <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
    //                         {user?.mobile}
    //                       </td>
    //                       <td className="px-4 py-4 whitespace-nowrap">
    //                         <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
    //                           {user?.designation}
    //                         </span>
    //                       </td>
    //                       <td className="px-4 py-4 whitespace-nowrap">
    //                         <span
    //                           className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
    //                             user?.role === "Admin"
    //                               ? "bg-purple-100 text-purple-800"
    //                               : user?.role === "Manager"
    //                                 ? "bg-green-100 text-green-800"
    //                                 : "bg-gray-100 text-gray-800"
    //                           }`}
    //                         >
    //                           {user?.role}
    //                         </span>
    //                       </td>
    //                       <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
    //                         {user.assignedto ? (
    //                           user.assignedto.name
    //                         ) : (
    //                           <span className="text-gray-400 italic">
    //                             Not assigned
    //                           </span>
    //                         )}
    //                       </td>
    //                       <td className="px-4 py-4 whitespace-nowrap text-center">
    //                         <div className="flex items-center justify-center space-x-2">
    //                           <button
    //                             onClick={() => {
    //                               if (loggeduser?.role === "Admin") {
    //                                 navigate("/admin/masters/userEdit", {
    //                                   state: { user }
    //                                 })
    //                               } else if (loggeduser?.role === "Staff") {
    //                                 navigate("/staff/masters/userEdit", {
    //                                   state: { user }
    //                                 })
    //                               }
    //                             }}
    //                             className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors duration-200"
    //                             title="Edit User"
    //                           >
    //                             <CiEdit className="w-5 h-5" />
    //                           </button>
    //                           <DeleteAlert
    //                             onDelete={handleDelete}
    //                             Id={user._id}
    //                           />
    //                         </div>
    //                       </td>
    //                     </tr>
    //                   )
    //                 }
    //               })
    //             ) : (
    //               <tr>
    //                 <td colSpan="10" className="px-4 py-12 text-center">
    //                   {loading ? (
    //                     <div className="flex justify-center items-center">
    //                       <PropagateLoader color="#3b82f6" size={10} />
    //                     </div>
    //                   ) : (
    //                     <div className="text-gray-500">
    //                       <div className="text-lg font-medium mb-2">
    //                         No users found
    //                       </div>
    //                       <div className="text-sm">
    //                         Try adjusting your search criteria
    //                       </div>
    //                     </div>
    //                   )}
    //                 </td>
    //               </tr>
    //             )}
    //           </tbody>
    //         </table>
    //       </div>
    //     </div>
    //   </div>
    // </div>
<div className="flex h-full min-w-0 flex-col overflow-hidden" style={{ backgroundColor: "#ADD8E6" }}>
  {/* Header Section - Sticky */}
  <div className="sticky top-0 z-20 mx-2 mt-2 shrink-0 rounded-xl bg-white shadow-md md:mx-3 md:mt-3">
    {/* Title and Search Bar */}
    <div className="px-3 pt-3 md:px-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-lg font-bold text-gray-900 md:text-xl">Users List</h1>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FaSearch className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            onChange={(e) => handleSearch(e.target.value)}
            className="block h-9 w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-3
                       focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-sky-400
                       placeholder-gray-400 text-sm transition-colors duration-200"
            placeholder="Search users..."
          />
        </div>
      </div>
    </div>

    {/* Action Buttons */}
    <div className="px-3 pb-3 pt-2 md:px-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link
          to={
            loggeduser?.role === "Admin"
              ? "/admin/masters/userRegistration"
              : "/staff/masters/userRegistration"
          }
          className="inline-flex h-8 items-center whitespace-nowrap rounded-lg px-3 text-xs font-medium
                     text-white bg-sky-500 hover:bg-sky-600 shadow-sm
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-400
                     transition-colors duration-200"
        >
          <FaUserPlus className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Add User</span>
        </Link>

        <button
          onClick={() => handleDownload(users)}
          className="inline-flex h-8 items-center whitespace-nowrap rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-700 bg-white
                     hover:bg-gray-50 shadow-sm focus:outline-none focus:ring-2
                     focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
        >
          <FaRegFileExcel className="w-4 h-4 mr-2 text-green-600" />
          <span className="hidden sm:inline">Excel</span>
        </button>

        <button
          className="inline-flex h-8 items-center whitespace-nowrap rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-700 bg-white
                     hover:bg-gray-50 shadow-sm focus:outline-none focus:ring-2
                     focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
        >
          <FaFilePdf className="w-4 h-4 mr-2 text-red-600" />
          <span className="hidden sm:inline">PDF</span>
        </button>

        <button
          className="inline-flex h-8 items-center whitespace-nowrap rounded-lg border border-gray-200 px-3 text-xs font-medium text-gray-700 bg-white
                     hover:bg-gray-50 shadow-sm focus:outline-none focus:ring-2
                     focus:ring-offset-2 focus:ring-gray-400 transition-colors duration-200"
        >
          <FaPrint className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Print</span>
        </button>

        <div className="relative w-full sm:ml-auto sm:w-56">
          <button
            type="button"
            onClick={() => setIsBranchMenuOpen((open) => !open)}
            className="flex h-9 w-full items-center gap-2 rounded-lg border border-sky-200 bg-gradient-to-r from-sky-50 to-white px-3 text-left text-xs font-semibold text-slate-700 shadow-sm transition hover:border-sky-300 hover:shadow focus:outline-none focus:ring-2 focus:ring-sky-300"
            aria-expanded={isBranchMenuOpen}
            aria-haspopup="listbox"
          >
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-sky-100 text-sky-600"><FaBuilding className="h-3 w-3" /></span>
            <span className="min-w-0 flex-1"><span className="mr-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">Branch</span><span className="truncate">{loggeduser?.selected?.find((branch) => String(branch.branch_id) === String(selectedBranch))?.branchName || "Select branch"}</span></span>
            <FaChevronDown className={`h-3 w-3 shrink-0 text-sky-600 transition-transform ${isBranchMenuOpen ? "rotate-180" : ""}`} />
          </button>
          {isBranchMenuOpen && <div role="listbox" className="absolute right-0 top-11 z-40 w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
            <p className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Choose a branch</p>
            <div className="max-h-56 overflow-y-auto">
              {loggeduser?.selected?.map((branch) => {
                const isSelected = String(branch.branch_id) === String(selectedBranch)
                return <button
                  key={branch._id || branch.branch_id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => { handlebranchChange(`${branch.branch_id}||${branch.branchName}`); setIsBranchMenuOpen(false) }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold transition ${isSelected ? "bg-sky-500 text-white shadow-sm" : "text-slate-600 hover:bg-sky-50 hover:text-sky-700"}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-sky-400"}`} />
                  <span className="truncate">{branch.branchName}</span>
                </button>
              })}
            </div>
          </div>}
        </div>
      </div>
    </div>
  </div>

  {/* Table Section */}
  <div className="min-w-0 flex-1 overflow-hidden px-2 pb-2 pt-2 md:px-3 md:pb-3">
    <div className="flex h-full min-w-0 flex-col overflow-hidden rounded-xl bg-white shadow-md">
      <div className="min-w-0 flex-1 overflow-x-auto overflow-y-auto">
        <table className="min-w-[980px] w-full divide-y divide-gray-100">
          <thead>
            <tr>
              <th className="sticky top-0 z-10 px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-16 bg-sky-50 border-b border-gray-200">
                No
              </th>
              <th className="sticky top-0 z-10 px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-32 bg-sky-50 border-b border-gray-200">
                Branch
              </th>
              <th className="sticky top-0 z-10 px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-40 bg-sky-50 border-b border-gray-200">
                User Name
              </th>
              <th className="sticky top-0 z-10 px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-24 bg-sky-50 border-b border-gray-200">
                ID
              </th>
              <th className="sticky top-0 z-10 px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-48 bg-sky-50 border-b border-gray-200">
                User ID
              </th>
              <th className="sticky top-0 z-10 px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-32 bg-sky-50 border-b border-gray-200">
                Mobile
              </th>
              <th className="sticky top-0 z-10 px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-32 bg-sky-50 border-b border-gray-200">
                Department
              </th>
              <th className="sticky top-0 z-10 px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-32 bg-sky-50 border-b border-gray-200">
                Designation
              </th>
              <th className="sticky top-0 z-10 px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-24 bg-sky-50 border-b border-gray-200">
                Role
              </th>
              <th className="sticky top-0 z-10 px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-32 bg-sky-50 border-b border-gray-200">
                Assigned To
              </th>
              <th className="sticky top-0 z-10 px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-32 bg-sky-50 border-b border-gray-200">
                Status
              </th>
              <th className="sticky top-0 z-10 px-4 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-24 bg-sky-50 border-b border-gray-200">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {users?.length > 0 ? (
              users.map((user, index) => {
                if (user?.selected?.length > 0) {
                  return user.selected.map((item, itemIndex) => (
                    <tr
                      key={`${user._id}-${itemIndex}`}
                      className="hover:bg-sky-50/50 transition-colors duration-150"
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">
                        {itemIndex === 0 ? index + 1 : ""}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{item?.branchName}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">
                        {user?.attendanceId}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{user?.email}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">
                        {user?.mobile}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                          {user?.department?.department}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                          {user?.designation}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                            user?.role === "Admin"
                              ? "bg-purple-50 text-purple-700"
                              : user?.role === "Manager"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user?.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">
                        {user.assignedto ? (
                          user.assignedto?.name
                        ) : (
                          <span className="text-gray-400 italic">Not assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm">
                        <span
                          className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                            user?.isVerified
                              ? "bg-green-50 text-green-600"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {user.isVerified ? "Active" : "Deactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => {
                              if (loggeduser?.role === "Admin") {
                                navigate("/admin/masters/userEdit", {
                                  state: { user, selected: item }
                                })
                              } else if (
                                loggeduser?.role === "Staff" ||
                                loggeduser?.role === "Manager"
                              ) {
                                navigate("/staff/masters/userEdit", {
                                  state: { user, selected: item }
                                })
                              }
                            }}
                            className="text-sky-600 hover:text-sky-800 hover:bg-sky-50 p-1.5 rounded-md transition-colors duration-200"
                            title="Edit User"
                          >
                            <CiEdit className="w-5 h-5" />
                          </button>
                          <DeleteAlert onDelete={handleDelete} Id={user._id} />
                        </div>
                      </td>
                    </tr>
                  ))
                } else {
                  return (
                    <tr
                      key={user._id}
                      className="hover:bg-sky-50/50 transition-colors duration-150"
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-400">-</td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user?.name}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">
                        {user?.attendanceId}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="text-sm text-gray-700">{user?.email}</div>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">
                        {user?.mobile}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                          {user?.designation}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                            user?.role === "Admin"
                              ? "bg-purple-50 text-purple-700"
                              : user?.role === "Manager"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user?.role}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-sm text-gray-700">
                        {user.assignedto ? (
                          user.assignedto.name
                        ) : (
                          <span className="text-gray-400 italic">Not assigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => {
                              if (loggeduser?.role === "Admin") {
                                navigate("/admin/masters/userEdit", { state: { user } })
                              } else if (loggeduser?.role === "Staff") {
                                navigate("/staff/masters/userEdit", { state: { user } })
                              }
                            }}
                            className="text-sky-600 hover:text-sky-800 hover:bg-sky-50 p-1.5 rounded-md transition-colors duration-200"
                            title="Edit User"
                          >
                            <CiEdit className="w-5 h-5" />
                          </button>
                          <DeleteAlert onDelete={handleDelete} Id={user._id} />
                        </div>
                      </td>
                    </tr>
                  )
                }
              })
            ) : (
              <tr>
                <td colSpan="12" className="px-4 py-14 text-center">
                  {loading ? (
                    <div className="flex justify-center items-center">
                      <PropagateLoader color="#0ea5e9" size={10} />
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      <div className="text-lg font-medium mb-2">No users found</div>
                      <div className="text-sm">Try adjusting your search criteria</div>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
  )
}

export default UserListform
