import React, { useState, useCallback, useEffect } from "react"
import { CiEdit } from "react-icons/ci"
import { useNavigate } from "react-router-dom"
import {
  FaUserPlus,
  FaSearch,
  FaRegFileExcel,
  FaFilePdf,
  FaPrint,
} from "react-icons/fa"
import { Link } from "react-router-dom"
import _ from "lodash"

const CompanyListForm = ({ companies }) => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredCompanies, setFilteredCompanies] = useState(companies)

  const handleSearch = useCallback(
    _.debounce(query => {
      const lowerCaseQuery = query.toLowerCase()
      setFilteredCompanies(
        companies.filter(company =>
          company.name.toLowerCase().includes(lowerCaseQuery)
        )
      )
    }, 300),
    [companies]
  )

  useEffect(() => {
    handleSearch(searchQuery)
  }, [searchQuery, handleSearch])

  return (
    <div className="container mx-auto min-h-screen py-8 bg-gray-100">
      <div className="w-auto  bg-white shadow-lg rounded p-8  h-screen mx-8">
        <div className="flex justify-between items-center px-4 lg:px-6 xl:px-8 mb-4">
          <h3 className="text-2xl text-black font-bold">CompanyList</h3>
          {/* Search Bar for large screens */}
          <div className="mx-4 md:block">
            <div className="relative">
              <FaSearch className="absolute w-5 h-5 left-2 top-3 text-gray-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className=" w-full border border-gray-300 rounded-full py-2 px-4 pl-10 focus:outline-none"
              placeholder="Search for..."
            />
          </div>
        </div>

        <hr className="border-t-2 border-gray-300 mb-4" />
        <div className="flex flex-wrap space-x-4 mb-4">
          <Link
            to="/admin/masters/companyRegistration"
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
          {/* <Link to="/admin/masters/companyRefresh">
            <button className="hover:bg-gray-100 text-black font-bold py-2 px-2 rounded inline-flex items-center">
              <FaSyncAlt className="mr-2" />
            </button>
          </Link> */}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b border-gray-300 text-left">
                  Company Name
                </th>
                <th className="py-2 px-4 border-b border-gray-300 text-left">
                  Address
                </th>
                <th className="py-2 px-4 border-b border-gray-300 text-left">
                  City
                </th>
                <th className="py-2 px-4 border-b border-gray-300 text-left">
                  Pin code
                </th>
                <th className="py-2 px-4 border-b border-gray-300 text-left">
                  Mobile
                </th>
                <th className="py-2 px-4 border-b border-gray-300 text-left">
                  Telephone
                </th>
                <th className="py-2 px-4 border-b border-gray-300 text-left">
                  Email
                </th>
                <th className="py-2 px-4 border-b border-gray-300 text-left">
                  Website
                </th>
                <th className="py-2 px-4 border-b border-gray-300 text-left">
                  Status
                </th>
                <th className="py-2 px-4 border-b border-gray-300 text-left"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCompanies?.length > 0 ? (
                filteredCompanies.map(company => (
                  <tr key={company?._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {company?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {company?.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {company?.city}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {company?.pincode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {company?.mobile}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {company?.landlineno}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                      {company?.email}
                    </td>

                    <Link to="https://www.flipkart.com/">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-700">
                        {company?.website}
                      </td>
                    </Link>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm ${
                        company?.status === "Active"
                          ? "text-blue-700"
                          : "text-red-700"
                      }`}
                    >
                      {company?.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xl text-black">
                      <CiEdit
                        onClick={() =>
                          navigate("", {
                            state: { company: company },
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
                    No companies found
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

export default CompanyListForm
