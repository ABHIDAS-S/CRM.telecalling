import { useEffect, useState, useMemo } from "react"
import { toast } from "react-toastify"
import { useForm, Controller } from "react-hook-form"
import { Country, State } from "country-state-city"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons"
import { FaEdit, FaTrash } from "react-icons/fa"
import Select from "react-select"
import ImageInput from "../common/ImageInput"
import UseFetch from "../../hooks/useFetch"

const UserAdd = ({
  process,
  User,
  Selected,
  handleUserData,
  handleEditedData
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    control,
    getValues,
    reset,
    watch,
    trigger
  } = useForm({
    defaultValues: {
      permissionLevel: [] // Initialize as an array
    }
  })

  const [formMessage, setFormMessage] = useState("")

  const [showTable, setShowTable] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [tableEdit, settableEdit] = useState(false)
  const [editIndex, setEditIndex] = useState(null)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [departments, setDepartment] = useState([])
  const [company, setCompanies] = useState([])
  const [branches, setBranches] = useState([])
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [selectedBranch, setSelectedBranch] = useState(null)
  const [users, setUsers] = useState([])
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [selectedState, setSelectedState] = useState(null)
  const [tableData, setTableData] = useState([])

  const [imageData, setImageData] = useState({
    profileUrl: [],
    documentUrl: []
  })

  const [tableObject, setTableObject] = useState({
    company_id: "",
    companyName: "",
    branch_id: "",
    branchName: ""
  })
  const { data: companies } = UseFetch("/company/getCompany")
  const { data: alldepartment } = UseFetch("/master/getDepartmentList")
  const { data: section } = UseFetch("/inventory/getBrand")
  const { data } = UseFetch("/auth/getallUsers")

  useEffect(() => {
    if (alldepartment || companies) {
      setDepartment(alldepartment)

      setCompanies(companies)
      // setUsers(use)
    }
  }, [alldepartment, section, companies])

  useEffect(() => {
    if (data) {
      const { allusers = [], allAdmins = [] } = data

      // Combine allusers and allAdmins
      const combinedUsers = [...allusers, ...allAdmins]

      // Set combined names to state
      setUsers(combinedUsers)
    }
  }, [data])

  const countryOptions = useMemo(
    () =>
      Country.getAllCountries().map((country) => ({
        label: country.name,
        value: country.isoCode
      })),
    [User, Selected]
  )

  useEffect(() => {
    if (selectedCompany) {
      setValue("companyName", selectedCompany)
      const matchingCompany = company.find(
        (company) => company._id === selectedCompany
      )

      if (matchingCompany) {
        const branch = matchingCompany.branches

        setBranches(branch)
      }
    }
    if (selectedBranch) {
      setValue("branchName", selectedBranch)
    }
  }, [selectedCompany, selectedBranch])

  const defaultCountry = useMemo(
    () => countryOptions.find((country) => country.value === "IN"),
    [countryOptions]
  )

  const stateOptions = selectedCountry
    ? State.getStatesOfCountry(selectedCountry.value).map((state) => ({
        label: state.name,
        value: state.isoCode
      }))
    : []

  const handleTableData = () => {
    if (tableObject.company_id.trim() === "") {
      toast.error("please select a company")
      return
    } else if (tableObject.branch_id.trim() === "") {
      toast.error("please select a branch")
      return
    }
  
    const isIncluded = tableData.some(
      (item) => JSON.stringify(item) === JSON.stringify(tableObject)
    )
    if (isIncluded) {
      toast.error("Branch already exists")
      return
    }

    if (tableEdit) {
      setTableData((prev) => {
        const newData = [...prev]
        newData[editIndex] = tableObject // Update the specific item
        return newData
      })

      setEditIndex(null)
      settableEdit(false) // Reset the edit index
    } else {
      // Otherwise, add a new item

      const isIncluded = tableData.some(
        (item) => JSON.stringify(item) === JSON.stringify(tableObject)
      )

      if (isIncluded) {
        toast.error("Branch already exists")
        return
      }

      setTableData((prev) => [...prev, tableObject])
    }
  }

  const handleCompanyChange = (e) => {
    if (isEditMode) {
      // settableEdit(true)
    }
    const companyId = e.target.value
    setSelectedCompany(companyId)

    setValue("companyName", e.target.value)
    trigger("companyName")
    const foundCompany = company.find((company) => company._id === companyId)

    setTableObject((prev) => ({
      ...prev,
      company_id: companyId,
      companyName: foundCompany?.companyName
    }))
  }

  const handleBranchChange = (e) => {
    if (isEditMode) {
      // settableEdit(true)
    }
    const branchId = e.target.value
    setSelectedBranch(branchId)
    setShowTable(true)
    setValue("branchName", e.target.value)
    trigger("branchName")
    const foundBranch = branches.find((branch) => branch._id === branchId)

    setTableObject((prev) => ({
      ...prev,
      branch_id: branchId,
      branchName: foundBranch.branchName
    }))
  }

  useEffect(() => {
    if (defaultCountry) {
      setSelectedCountry(defaultCountry)
      setValue("country", defaultCountry.value)
    }
  }, [defaultCountry])
  useEffect(() => {
    if (
      User &&
      countryOptions.length > 0 &&
      departments &&
      departments.length > 0 &&
      company &&
      company.length > 0 &&
      users &&
      users.length > 0
    ) {
      setIsEditMode(true)
      setValue("name", User.name)
      setValue("role", User.role)
      setValue("email", User.email)
      setValue("mobile", User.mobile)
      setValue("privilegeleavestartsfrom", User.privilegeleavestartsfrom)
console.log(User.casualleavestartsfrom)
      setValue("casualleavestartsfrom", User.casualleavestartsfrom)
      setValue("sickleavestartsfrom", User.sickleavestartsfrom)
      setValue("address", User.address)
      setValue("department", User.department?._id)
      setValue("assignedto", User.assignedto?._id)
      setValue("bloodgroup", User.bloodgroup)
      setValue("dateofbirth", User.dateofbirth)
      setValue("designation", User.designation)
      setValue("gender", User.gender)
      setValue("isVerified", User.isVerified)
      setValue("joiningdate", User.joiningdate)
      setValue("pincode", User.pincode)
      setValue("attendanceId", User.attendanceId)

      Object.entries(User).forEach(([key, value]) => {
        if (key === "country") {
          const country = countryOptions.find((c) => c.value === value)
          setSelectedCountry(country)
        }
        if (key === "state") {
          const state = stateOptions.find((s) => s.value === value)
          setSelectedState(state)
        }
      })
    }
    if (
      Selected &&
      company &&
      company.length > 0 &&
      users &&
      users.length > 0 &&
      countryOptions.length > 0
    ) {
      setShowTable(true)

      setTableData(
        User.selected.map((item) => ({
          company_id: item.company_id,
          companyName: item.companyName,
          branch_id: item.branch_id,
          branchName: item.branchName
        }))
      )
      setTableObject({
        company_id: Selected.company_id || "",
        companyName: Selected.companyName || "",
        branch_id: Selected.branch_id || "",
        branchName: Selected.branchName || ""
      })

      Object.entries(Selected).forEach(([key, value]) => {
        if (key === "company_id") {
          const matchingCompany = company.find(
            (company) => company._id === value
          )

          if (matchingCompany) {
            setSelectedCompany(value)
          }
        }
        if (key === "branchName") {
          const branch = branches.find(
            (branch) => branch._id === Selected.branch_id
          )

          if (branch) {
            setSelectedBranch(branch._id)
            setValue(key, branch._id)
          }
        }
      })
    }
  }, [User, departments, company, selectedCompany, branches, users, setValue])
  const handleEdit = (id) => {
    settableEdit(true) // Close the edit state (or handle according to your logic)

    const itemToEdit = tableData.find((item) => item.branch_id === id)

    if (itemToEdit) {
      // Set the form values
      const fieldsToSet = {
        company_id: itemToEdit.company_id,
        companyName: itemToEdit.companyName,
        branch_id: itemToEdit.branch_id,
        branchName: itemToEdit.branchName
      }

      setSelectedCompany(fieldsToSet.company_id)
      setSelectedBranch(fieldsToSet.branch_id)

      // Find index of the item being edited and set it to the state
      const index = tableData.findIndex((item) => item.branch_id === id)
      setEditIndex(index)
    }
  }

  const handleDelete = (id) => {
    const filtereddData = tableData.filter((item, index) => {
      return index !== id
    })

    setTableData(filtereddData)
  }

  const profileImage = (url) => {
    setImageData((prevData) => ({
      ...prevData,
      profileUrl: url
    }))
  }

  const documentImage = (url) => {
    setImageData((prevData) => ({
      ...prevData,
      documentUrl: Array.isArray(url)
        ? [...prevData.documentUrl, ...url] // Append if 'urls' is an array
        : [...prevData.documentUrl, url] // Add the single URL if it's not an array
    }))
  }
  const onSubmit = (data) => {
    if (process === "Registration") {
      if (data) {
        data.name.trim(),
          data.email.trim(),
          data.mobile.trim(),
          data.password.trim(),
          data.address.trim(),
          data.pincode.trim(),
          data.designation.trim()
      }

      const formattedData = {
        ...data,
        department: data.department || null
      }
      handleUserData(formattedData, imageData, tableData)
    } else if (process === "Edit") {
      handleEditedData(data, User?._id, tableData, imageData)
    }
  }
  return (
    <div
      className="flex flex-col justify-center items-center min-h-screen p-8 bg-gray-100"
      // style={{ backgroundImage: "url('/userbackground.jpg')" }}
    >
      <div className="w-full p-8 border rounded-lg shadow-lg  bg-white ">
        <h2 className="text-2xl font-bold text-center mb-2">
          User Registration
        </h2>
        {/* Display Form Message */}
        {formMessage && (
          <div
            className={`mb-4 ${
              formMessage.includes("successful")
                ? "text-green-500"
                : "text-red-500"
            }`}
          >
            {formMessage}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
            <div>
              <label className="block mb-1 font-semibold">Name</label>
              <input
                type="text"
                {...register("name", { required: "Name is required" })}
                autoComplete="new-name"
                placeholder="Enter a name"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm outline-none"
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name.message}</p>
              )}
            </div>
            {/* Email Field */}
            <div>
              <label className="block mb-1 font-semibold">Email</label>
              <input
                type="email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: "Please enter a valid email address."
                  }
                })}
                autoComplete="new-email"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm outline-none"
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email.message}</p>
              )}
            </div>
            {/* Mobile Field */}
            <div>
              <label className="block mb-1 font-semibold">Mobile</label>
              <input
                type="tel"
                {...register("mobile", {
                  pattern: {
                    value: /^[0-9]{10}$/,

                    message: "Please enter a valid mobile number"
                  }
                })}
                autoComplete="new-mobile"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm outline-none"
              />
              {errors.mobile && (
                <p className="text-red-500 text-sm">{errors.mobile.message}</p>
              )}
            </div>
            {/* Date of Birth Field */}
            <div>
              <label className="block mb-1 font-semibold">D.O.B</label>
              <input
                type="date"
                {...register("dateofbirth")}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm focus:border-gray-500 outline-none"
              />
              {errors.dateofbirth && (
                <span className="text-red-500 text-sm">
                  {errors.dateofbirth.message}
                </span>
              )}
            </div>
            {/* Blood Group Field */}
            <div>
              <label className="block mb-1 font-semibold">Blood Group</label>
              <select
                {...register("bloodgroup")}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm outline-none"
              >
                <option value="">Select a blood group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
              {errors.bloodgroup && (
                <p className="text-red-500 text-sm">
                  {errors.bloodgroup.message}
                </p>
              )}
            </div>
            {/* Gender Field */}
            <div>
              <label className="block mb-1 font-semibold">Gender</label>
              <select
                {...register("gender", { required: "Gender is required" })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm outline-none"
              >
                <option value="">Select a gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-sm">{errors.gender.message}</p>
              )}
            </div>
            {/* Address Field */}
            <div>
              <label className="block mb-1 font-semibold">Address</label>
              <input
                type="text"
                {...register("address")}
                placeholder="Enter an address"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm outline-none"
              />
              {errors.address && (
                <p className="text-red-500 text-sm">{errors.address.message}</p>
              )}
            </div>
            {/* Country Field */}
            <div>
              <label className="block mb-1 font-semibold">Country</label>
              <Select
                options={countryOptions}
                value={selectedCountry}
                {...register("country")}
                onChange={(option) => {
                  setSelectedCountry(option)
                  setValue("country", option.value)
                }}
                styles={{
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
              {errors.country && (
                <p className="text-red-500 text-xs mt-1">Country is required</p>
              )}
            </div>
            {/* State Field */}
            <div>
              <label className="block mb-1 font-semibold">State</label>
              <Select
                options={stateOptions}
                value={selectedState}
                onChange={(option) => {
                  setSelectedState(option)
                  setValue("state", option.value)
                }}
                isDisabled={!selectedCountry}
              />
              {errors.state && (
                <p className="text-red-500 text-xs mt-1">State is required</p>
              )}
            </div>
            {/* Pincode Field */}
            <div>
              <label className="block mb-1 font-semibold">Pincode</label>
              <input
                type="number"
                {...register("pincode")}
                placeholder="Enter a pincode"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm outline-none"
              />
              {errors.pincode && (
                <p className="text-red-500 text-sm">{errors.pincode.message}</p>
              )}
            </div>
            {/* Joining Date Field */}
            <div>
              <label className="block mb-1 font-semibold">Joining Date</label>
              <input
                type="date"
                {...register("joiningdate")}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-2 py-1 sm:text-md focus:border-gray-500 outline-none"
              />
              {errors.joiningdate && (
                <span className="text-red-500 text-sm">
                  {errors.joiningdate.message}
                </span>
              )}
            </div>
            {/* Resignation Field */}
            <div>
              <label htmlFor="designation" className="block mb-1 font-semibold">
                Designation
              </label>
              <input
                type="text"
                {...register("designation")}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm focus:border-gray-500 outline-none"
              />
              {errors.designation && (
                <span className="text-red-500 text-sm">
                  {errors.designation.message}
                </span>
              )}
            </div>
            <div>
              <label htmlFor="department" className="block mb-1 font-semibold">
                Department
              </label>

              <select
                id="department"
                {...register("department")}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm focus:border-gray-500 outline-none"
              >
                <option value="">-- Select a department --</option>

                {departments?.map((department) => (
                  <option key={department._id} value={department._id}>
                    {department.department}
                  </option>
                ))}
              </select>
            </div>
            <div className="relative">
              <label htmlFor="password" className="block mb-1 font-semibold">
                Password
              </label>
              <div className="relative">
                <input
                  type={passwordVisible ? "text" : "password"}
                  id="password"
                  {...register("password", {
                    // Conditionally required: true only in register mode
                    required: !isEditMode && "Password is Required",
                    // Optionally, you can add minLength or other rules based on your use case
                    minLength: !isEditMode && {
                      value: 6,
                      message: "Password must be at least 6 characters"
                    }
                  })}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm outline-none"
                />
                {/* Only show the eye icon if it's not in edit mode */}

                <span
                  className="absolute inset-y-0 right-0 flex items-center px-2 cursor-pointer"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  <FontAwesomeIcon
                    icon={passwordVisible ? faEyeSlash : faEye}
                  />
                </span>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="role" className="block mb-1 font-semibold">
                Role
              </label>
              <select
                {...register("role", { required: true })}
                className="w-full mt-1 block border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm outline-none"
              >
                <option value="Staff">Staff</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
              </select>
            </div>

            {/* <div>
              <label className="block mb-1 font-semibold">
                Permission Level
              </label>

              <button
                type="button"
                className="flex justify-between border border-gray-300 py-2 w-full rounded-md text-left px-3 mb-1"
                onClick={() => setPermissionOpen(!permissionOpen)}
              >
                Select Permission
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 transition-transform duration-200"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {permissionOpen && (
                <div className="flex flex-col space-y-2 border rounded-lg px-2 bg-white">
                  {["Level 1", "Level 2", "Level 3"].map((level, index) => {
                    const value = level.toLowerCase().replace(/\s+/g, "") // Convert "Level 1" → "level1"
                    return (
                      <label
                        key={index}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          value={value}
                          key={level}
                          checked={
                            watch("permissionLevel")?.includes(value) || false
                          }
                          onChange={handleChangeLevelPermission}
                          {...register("permissionLevel", {
                            onChange: handleChangeLevelPermission
                          })}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring focus:ring-blue-300"
                        />
                        <span>{level}</span>
                      </label>
                    )
                  })}
                </div>
              )}
            </div> */}

            <div>
              <label className="block mb-1 font-semibold">
                Privilege Leave Starts From
              </label>
              <input
                type="date"
                {...register("privilegeleavestartsfrom")}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-2 py-1 sm:text-md focus:border-gray-500 outline-none"
              />
              {errors.privilegeleavestartsfrom && (
                <span className="text-red-500 text-sm">
                  {errors.privilegeleavestartsfrom.message}
                </span>
              )}
            </div>
            <div>
              <label className="block mb-1 font-semibold">
                Casul Leave Starts From
              </label>
              <input
                type="date"
                {...register("casualleavestartsfrom")}
                // value={User && User.joiningdate}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-2 py-1 sm:text-md focus:border-gray-500 outline-none"
              />
              {errors.casualleavestartsfrom && (
                <span className="text-red-500 text-sm">
                  {errors.casualleavestartsfrom.message}
                </span>
              )}
            </div>
            <div>
              <label className="block mb-1 font-semibold">
                Sick Leave Starts From
              </label>
              <input
                type="date"
                {...register("sickleavestartsfrom")}
                // value={User && User.joiningdate}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-2 py-1 sm:text-md focus:border-gray-500 outline-none"
              />
              {errors.sickleavestartsfrom && (
                <span className="text-red-500 text-sm">
                  {errors.sickleavestartsfrom.message}
                </span>
              )}
            </div>

            <div>
              <label htmlFor="assignedto" className="block mb-1 font-semibold">
                Assigned to
              </label>

              <select
                {...register("assignedto", {
                  required: "Assigned to is Required"
                })}
                className="w-full mt-1 block border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm outline-none max-h-40 overflow-y-auto"
              >
                <option value="">-assignedto --</option>

                {users &&
                  users.length > 0 &&
                  users?.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
              </select>
              {errors.assignedto && (
                <p className="text-red-500 text-sm">
                  {errors.assignedto.message}
                </p>
              )}
            </div>
            {/* Verified Field */}
            <div>
              <label className="block mb-1 font-semibold">Verified</label>
              <select
                {...register("isVerified", { required: true })}
                className="w-full mt-1 block border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm outline-none"
              >
                <option value={true}>True</option>
                <option value={false}>False</option>
              </select>
            </div>

            <ImageInput onSelect={profileImage} tag={"UploadProfile"} />
            <ImageInput onSelect={documentImage} tag={"UploadDocument"} />
            <div>
              <label className="block mb-1 font-semibold">Staff Id</label>
              <input
                type="Number"
                {...register("attendanceId", { required: "Id is required" })}
                placeholder="Enter an address"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm outline-none"
              />
              {errors.attendanceId && (
                <p className="text-red-500 text-sm">
                  {errors.attendanceId.message}
                </p>
              )}
            </div>
          </div>

          <div className="mt-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ">
              <div>
                <label
                  htmlFor="companyName"
                  className="block mb-1 font-semibold"
                >
                  Select Company
                </label>

                <select
                  id="companyName"
                  {...register("companyName", {
                    required: "Company is required"
                  })}
                  onChange={handleCompanyChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm focus:border-gray-500 outline-none"
                >
                  <option value="">-- Select a company --</option>

                  {company?.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.companyName}
                    </option>
                  ))}
                </select>
                {errors.companyName && (
                  <p className="text-red-500 text-sm">
                    {errors.companyName.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="branchName"
                  className="block mb-1 font-semibold"
                >
                  Select Branch
                </label>

                <select
                  id="branchName"
                  {...register("branchName", {
                    required: "branch is required"
                  })}
                  onChange={handleBranchChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm focus:border-gray-500 outline-none"
                >
                  <option value="">-- Select a Branch--</option>

                  {branches?.map((branch) => (
                    <option key={branch._id} value={branch._id}>
                      {branch.branchName}
                    </option>
                  ))}
                </select>
                {errors.branchName && (
                  <p className="text-red-500 text-sm">
                    {errors.branchName.message}
                  </p>
                )}
              </div>
            </div>
            {showTable && (
              <div>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleTableData}
                    className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                  >
                    {isEditMode ? (
                      <>
                        <span className="text-xl font-bold mr-1">+</span>Update To
                        Table
                      </>
                    ) : (
                      <>
                        <span className="text-xl font-bold">+</span> Add to
                        Table
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-6 w-lg overflow-y-auto">
                  <table className="bg-green-300 w-full divide-y divide-gray-200  ">
                    <thead>
                      <tr className="text-center">
                        <th className="  py-3 text-left px-4 text-sm font-medium text-gray-500 uppercase tracking-wide">
                          Company Name
                        </th>
                        <th className=" px-4 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Branch Name
                        </th>

                        <th className="pr-10  py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Edit
                        </th>
                        <th className="pr-8  py-3 text-right text-sm font-medium text-gray-500 uppercase tracking-wider">
                          Delete
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 ">
                      {tableData && tableData.length > 0 ? (
                        tableData?.map((item, index) => (
                          <tr key={index} className="text-center">
                            <td className=" py-4 whitespace-nowrap text-sm text-gray-500 text-left px-4">
                              {item?.companyName}
                            </td>

                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-left">
                              {item?.branchName}
                            </td>

                            <td className=" py-4 whitespace-nowrap text-sm font-medium text-right pr-10">
                              <button
                                type="button"
                                className="text-green-600 hover:text-green-900 mr-2" // Adjust styles as needed
                              >
                                <FaEdit
                                  onClick={() => handleEdit(item.branch_id)}
                                />
                              </button>
                            </td>

                            <td className=" py-4 whitespace-nowrap text-sm font-medium text-right pr-10">
                              <button
                                type="button"
                                className="text-blue-600 hover:text-blue-900 mr-2"
                              >
                                <FaTrash onClick={() => handleDelete(index)} />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="py-4 text-center text-sm text-gray-500"
                          >
                            No branch selected
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className=" mt-7 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
            >
              {isEditMode ? "Update" : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserAdd
