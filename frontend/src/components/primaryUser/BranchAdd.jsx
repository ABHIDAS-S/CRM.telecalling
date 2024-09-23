import React, { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import UseFetch from "../../hooks/useFetch"
import { toast } from "react-toastify"
const BranchAdd = ({
  process,
  BranchData,
  handleBranchData,
  handleEditedData,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm()

  const [companies, SetCompanies] = useState([])

  const { data: companyData, loading, error } = UseFetch("/company/getCompany")

  useEffect(() => {
    if (companyData) {
      SetCompanies(companyData)
    }
  }, [companyData])

  useEffect(() => {
    if (error) {
      if (error.response) {
        toast.error(error.response.data.message)
      } else {
        toast.error("Something went wrong!")
      }
    }
  }, [error])

  const onSubmit = (data) => {
    if (process === "Registration") {
      handleBranchData(data)
    } else if (process === "Edit") {
      handleEditedData(data)
    }
  }
  console.log(companies)

  return (
    <div className="container justify-center items-center min-h-screen py-8 bg-gray-100">
      <div className="w-5/6 bg-white shadow-lg rounded p-8 mx-auto">
        <h2 className="text-2xl font-semibold mb-6">Branch Registration</h2>

        <form
          className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div>
            <label
              htmlFor="company"
              className="block text-sm font-medium text-gray-700"
            >
              Select Company
            </label>
            <select
              id="company"
              {...register("company", {
                required: "Company name is required",
              })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm focus:border-gray-500 outline-none"
            >
              <option value="">-- Select a comapany --</option>
              {companies.map((company) => (
                <option key={company._id} value={company._id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Branch Name
            </label>
            <input
              type="text"
              {...register("branchName", {
                required: "Branch name is required",
              })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm focus:border-gray-500 outline-none"
              placeholder="Enter a branch Name"
            />
            {errors.name && (
              <span className="mt-2 text-sm text-red-600">
                {errors.name.message}
              </span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Address 1
            </label>
            <input
              type="text"
              {...register("address1")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm outline-none focus:border-gray-500"
              placeholder="Address"
            />
            {errors.address1 && (
              <span className="mt-2 text-sm text-red-600">
                {errors.address1.message}
              </span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Address 2
            </label>
            <input
              type="text"
              {...register("address2")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm outline-none focus:border-gray-500"
              placeholder="Address"
            />
            {errors.address2 && (
              <span className="mt-2 text-sm text-red-600">
                {errors.address2.message}
              </span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              {...register("city")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm focus:border-gray-500 outline-none"
              placeholder="City"
            />
            {errors.city && (
              <span className="mt-2 text-sm text-red-600">
                {errors.city.message}
              </span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Pincode
            </label>
            <input
              type="text"
              {...register("pincode")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm focus:border-gray-500 outline-none"
              placeholder="Pincode"
            />
            {errors.pincode && (
              <span className="mt-2 text-sm text-red-600">
                {errors.pincode.message}
              </span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Country
            </label>
            <input
              type="text"
              {...register("country")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm focus:border-gray-500 outline-none"
              placeholder="Country"
            />
            {errors.country && (
              <span className="mt-2 text-sm text-red-600">
                {errors.country.message}
              </span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              State
            </label>
            <input
              type="text"
              {...register("state")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm focus:border-gray-500 outline-none"
              placeholder="State"
            />
            {errors.state && (
              <span className="mt-2 text-sm text-red-600">
                {errors.state.message}
              </span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: "Invalid email address",
                },
              })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm focus:border-gray-500 outline-none"
              placeholder="Email"
            />
            {errors.email && (
              <span className="mt-2 text-sm text-red-600">
                {errors.email.message}
              </span>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <input
              type="tel"
              {...register("mobile")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm focus:border-gray-500 outline-none"
              placeholder="Phone"
            />
            {errors.mobile && (
              <span className="mt-2 text-sm text-red-600">
                {errors.mobile.message}
              </span>
            )}
          </div>
          <div className="">
            <label className="block text-sm font-medium text-gray-700">
              Website
            </label>
            <input
              type="url"
              {...register("website")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm focus:border-gray-500 outline-none"
              placeholder="Website"
            />
            {errors.website && (
              <span className="mt-2 text-sm text-red-600">
                {errors.website.message}
              </span>
            )}
          </div>
          <div className="">
            <label className="block text-sm font-medium text-gray-700">
              Landline
            </label>
            <input
              type="text"
              {...register("landlineno")}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm focus:border-gray-500 outline-none"
              placeholder="Landline"
            />
            {errors.landlineno && (
              <span className="mt-2 text-sm text-red-600">
                {errors.landlineno.message}
              </span>
            )}
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BranchAdd
