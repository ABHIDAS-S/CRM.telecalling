import React, { useState, useCallback, useEffect } from "react"
import { CiEdit } from "react-icons/ci"
import { useNavigate } from "react-router-dom"
import {
  FaUserPlus,
  FaSearch,
  FaRegFileExcel,
  FaFilePdf,
  FaPrint
} from "react-icons/fa"
import { Link } from "react-router-dom"
import _ from "lodash"
import UseFetch from "../../../hooks/useFetch"

const UserListform = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUser] = useState([])
  const { data: allusers } = UseFetch("/auth/getallUsers")
  useEffect(() => {
    if (allusers) {
      setUser(allusers)
    }
  }, [allusers])
  console.log("usersssssss", users)
  const handleSearch = useCallback(
    _.debounce((query) => {
      const lowerCaseQuery = query.toLowerCase()
      setFilteredBranches(
        users.filter((user) => user.name.toLowerCase().includes(lowerCaseQuery))
      )
    }, 300),
    [allusers]
  )

  useEffect(() => {
    handleSearch(searchQuery)
  }, [searchQuery, handleSearch])

  return (
    <div className="container mx-auto min-h-screen py-8 bg-gray-100">
      <div className="w-auto  bg-white shadow-lg rounded p-8  h-screen mx-8">
        <div className="flex justify-between items-center px-4 lg:px-6 xl:px-8 mb-4">
          <h3 className="text-2xl text-black font-bold">Users List</h3>
          {/* Search Bar for large screens */}
          <div className="mx-4 md:block">
            <div className="relative">
              <FaSearch className="absolute w-5 h-5 left-2 top-3 text-gray-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className=" w-full border border-gray-300 rounded-full py-2 px-4 pl-10 focus:outline-none"
              placeholder="Search for..."
            />
          </div>
        </div>

        <hr className="border-t-2 border-gray-300 mb-4" />
        <div className="flex flex-wrap space-x-4 mb-4">
          <Link
            to="/admin/masters/userRegistration"
            className="hover:bg-gray-100 text-black font-bold py-2 px-2 rounded inline-flex items-center"
          >
            <FaUserPlus className="mr-2" />
          </Link>
          <button className="hover:bg-gray-100 text-black font-bold py-2 px-2 rounded inline-flex items-center">
            <FaRegFileExcel className="mr-2" />
          </button>
          <button className="hover:bg-gray-100 text-black font-bold py-2 px-2 rounded inline-flex items-center">
            <FaFilePdf className="mr-2" />
          </button>
          <button className="hover:bg-gray-100 text-black font-bold py-2 px-2 rounded inline-flex items-center">
            <FaPrint className="mr-2" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead className="text-center">
              <tr>
                <th className="py-2 px-4 border-b border-gray-300 ">
                  Department
                </th>
                <th className="py-2 px-4 border-b border-gray-300 ">
                  User Name
                </th>
                <th className="py-2 px-4 border-b border-gray-300 ">UserId</th>
                <th className="py-2 px-4 border-b border-gray-300 ">Mobile</th>

                <th className="py-2 px-4 border-b border-gray-300 ">
                  Designation
                </th>
                <th className="py-2 px-4 border-b border-gray-300 ">Role</th>
                <th className="py-2 px-4 border-b border-gray-300 ">
                  AssingnedTo
                </th>
                <th className="py-2 px-4 border-b border-gray-300 ">Edit</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 text-center">
              {users?.length > 0 ? (
                users.map((user) => (
                  <tr key={user?._id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-black">
                      {user.department}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-black">
                      {user?.name}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-black">
                      {user?.email}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-black">
                      {user?.mobileno}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-sm text-black">
                      {user?.designation}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-black">
                      {user?.role}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-black">
                      {user?.assignedto}
                    </td>

                    <td className="px-4 py-4 whitespace-nowrap text-xl text-black">
                      <CiEdit
                        onClick={() =>
                          navigate("/admin/primaryUser/masters/branchEdit", {
                            state: { user: user }
                          })
                        }
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="10"
                    className="px-6 py-4 text-center text-sm text-gray-500"
                  >
                    No users found in
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

export default UserListform
