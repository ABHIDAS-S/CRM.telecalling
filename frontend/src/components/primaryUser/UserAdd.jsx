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
import PropTypes from "prop-types"

const ModernSelect = ({ name, control, options, placeholder, styles, onValueChange, isDisabled = false, rules }) => (
  <Controller
    name={name}
    control={control}
    rules={rules}
    render={({ field }) => (
      <Select
        classNamePrefix="user-add-select"
        options={options}
        value={options.find((option) => String(option.value) === String(field.value)) || null}
        onChange={(option) => {
          const value = option?.value ?? ""
          field.onChange(value)
          onValueChange?.(value)
        }}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isSearchable
        styles={styles}
        menuPortalTarget={document.body}
        menuShouldScrollIntoView={false}
      />
    )}
  />
)

ModernSelect.propTypes = {
  name: PropTypes.string.isRequired,
  control: PropTypes.object.isRequired,
  options: PropTypes.array.isRequired,
  placeholder: PropTypes.string.isRequired,
  styles: PropTypes.object.isRequired,
  onValueChange: PropTypes.func,
  isDisabled: PropTypes.bool,
  rules: PropTypes.object
}

const UserAdd = ({
  process,
  User,
  Selected,
  handleUserData,
  handleEditedData
}) => {
  console.log(User)
  console.log(Selected)
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

  const selectStyles = useMemo(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: "38px",
        borderRadius: "12px",
        borderColor: state.isFocused ? "#3b82f6" : "#e2e8f0",
        backgroundColor: state.isDisabled ? "#f8fafc" : "#f8fafc",
        boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.14)" : "0 1px 2px rgba(15, 23, 42, 0.03)",
        cursor: state.isDisabled ? "not-allowed" : "pointer",
        "&:hover": { borderColor: state.isFocused ? "#3b82f6" : "#cbd5e1" }
      }),
      valueContainer: (base) => ({ ...base, padding: "0 12px" }),
      placeholder: (base) => ({ ...base, color: "#94a3b8" }),
      indicatorSeparator: () => ({ display: "none" }),
      dropdownIndicator: (base) => ({ ...base, color: "#64748b", padding: "8px" }),
      menuPortal: (base) => ({ ...base, zIndex: 80 }),
      menu: (base) => ({ ...base, marginTop: "6px", borderRadius: "12px", overflow: "hidden", border: "1px solid #dbe5f1", backgroundColor: "#ffffff", boxShadow: "0 14px 32px rgba(15, 23, 42, 0.16)" }),
      menuList: (base) => ({ ...base, maxHeight: "200px", padding: "5px", overflowY: "auto", backgroundColor: "#ffffff" }),
      option: (base, state) => ({ ...base, borderRadius: "8px", margin: "2px 0", padding: "9px 10px", fontSize: "13px", fontWeight: state.isSelected ? 600 : 500, backgroundColor: state.isSelected ? "#2563eb" : state.isFocused ? "#eff6ff" : "transparent", color: state.isSelected ? "#ffffff" : "#334155", cursor: "pointer", transition: "background-color 120ms ease, color 120ms ease" }),
      singleValue: (base) => ({ ...base, color: "#1e293b", fontSize: "14px", fontWeight: 500 }),
      noOptionsMessage: (base) => ({ ...base, padding: "12px", color: "#94a3b8", fontSize: "13px" }),
      loadingMessage: (base) => ({ ...base, padding: "12px", color: "#64748b", fontSize: "13px" })
    }),
    []
  )

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
    : [selectedCountry]
console.log(stateOptions)
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

  const handleCompanyChange = (companyId) => {
    if (isEditMode) {
      // settableEdit(true)
    }
    setSelectedCompany(companyId)

    setValue("companyName", companyId)
    trigger("companyName")
    const foundCompany = company.find((company) => company._id === companyId)

    setTableObject((prev) => ({
      ...prev,
      company_id: companyId,
      companyName: foundCompany?.companyName
    }))
  }

  const handleBranchChange = (branchId) => {
    if (isEditMode) {
      // settableEdit(true)
    }
    setSelectedBranch(branchId)
    setShowTable(true)
    setValue("branchName", branchId)
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
console.log(url)
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
        ;(data.name.trim(),
          data.email.trim(),
          data.mobile.trim(),
          data.password.trim(),
          data.address.trim(),
          data.pincode.trim(),
          data.designation.trim())
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
      className="flex min-h-screen items-center justify-center bg-[#ADD8E6] p-3 sm:p-5"
      // style={{ backgroundImage: "url('/userbackground.jpg')" }}
    >
      <div className="w-full max-w-[1500px] rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xl shadow-slate-300/30 sm:p-6">
        <div className="mb-4 border-b border-slate-100 pb-3 text-center">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          User Registration
        </h2>
        <p className="mt-1 text-sm text-slate-500">Create a professional user profile and assign branch access.</p>
        </div>
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
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" className="space-y-5 [&_label]:mb-1 [&_label]:block [&_label]:text-[11px] [&_label]:font-semibold [&_label]:uppercase [&_label]:tracking-wide [&_label]:text-slate-600 [&>div>div>input]:!mt-0 [&>div>div>input]:!w-full [&>div>div>input]:!rounded-xl [&>div>div>input]:!border-slate-200 [&>div>div>input]:!bg-slate-50 [&>div>div>input]:!px-3 [&>div>div>input]:!py-2 [&>div>div>input]:!text-sm [&>div>div>input]:!text-slate-800 [&>div>div>input]:!shadow-sm [&>div>div>input]:!outline-none [&>div>div>input]:!transition [&>div>div>input]:focus:!border-blue-500 [&>div>div>input]:focus:!bg-white [&>div>div>input]:focus:!ring-4 [&>div>div>input]:focus:!ring-blue-100 [&>div>div>div>input]:!rounded-xl [&>div>div>div>input]:!border-slate-200 [&>div>div>div>input]:!bg-slate-50 [&>div>div>div>input]:!px-3 [&>div>div>div>input]:!py-2 [&>div>div>div>input]:focus:!border-blue-500 [&>div>div>div>input]:focus:!bg-white [&>div>div>div>input]:focus:!ring-4 [&>div>div>div>input]:focus:!ring-blue-100 [&_select]:!mt-0 [&_select]:!w-full [&_select]:!rounded-xl [&_select]:!border-slate-200 [&_select]:!bg-slate-50 [&_select]:!px-3 [&_select]:!py-2 [&_select]:!text-sm [&_select]:!text-slate-800 [&_select]:!shadow-sm [&_select]:!outline-none [&_select]:!transition [&_select]:focus:!border-blue-500 [&_select]:focus:!bg-white [&_select]:focus:!ring-4 [&_select]:focus:!ring-blue-100">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
              <ModernSelect name="bloodgroup" control={control} placeholder="Select blood group" styles={selectStyles} options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((value) => ({ value, label: value }))} />
              {errors.bloodgroup && (
                <p className="text-red-500 text-sm">
                  {errors.bloodgroup.message}
                </p>
              )}
            </div>
            {/* Gender Field */}
            <div>
              <label className="block mb-1 font-semibold">Gender</label>
              <ModernSelect name="gender" control={control} placeholder="Select gender" styles={selectStyles} rules={{ required: "Gender is required" }} options={["Male", "Female"].map((value) => ({ value, label: value }))} />
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
                classNamePrefix="user-add-select"
                options={countryOptions}
                value={selectedCountry}
                {...register("country")}
                onChange={(option) => {
                  setSelectedCountry(option)
                  setValue("country", option.value)
                }}
                styles={selectStyles}
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
                classNamePrefix="user-add-select"
                options={stateOptions}
                value={selectedState}
                onChange={(option) => {
                  setSelectedState(option)
                  setValue("state", option.value)
                }}
                isDisabled={!selectedCountry}
                styles={selectStyles}
                menuPortalTarget={document.body}
                menuShouldScrollIntoView={false}
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

              <ModernSelect name="department" control={control} placeholder="Select department" styles={selectStyles} onValueChange={setSelectedDepartment} options={(departments || []).map((department) => ({ value: department._id, label: department.department || "Unnamed department" }))} />
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
              <ModernSelect name="role" control={control} placeholder="Select role" styles={selectStyles} rules={{ required: "Role is required" }} options={["Staff", "Admin", "Manager", "Team Leader"].map((value) => ({ value, label: value }))} />
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

              <ModernSelect name="assignedto" control={control} placeholder="Select reporting manager" styles={selectStyles} rules={{ required: "Assigned to is required" }} options={(users || []).map((staff) => ({ value: staff._id, label: staff.name || "Unnamed user" }))} />
              {errors.assignedto && (
                <p className="text-red-500 text-sm">
                  {errors.assignedto.message}
                </p>
              )}
            </div>
            {/* Verified Field */}
            <div>
              <label className="block mb-1 font-semibold">Account status</label>
              <ModernSelect
                name="isVerified"
                control={control}
                placeholder="Select account status"
                styles={selectStyles}
                rules={{
                  validate: (value) =>
                    typeof value === "boolean" || "Account status is required"
                }}
                options={[
                  { value: true, label: "Active" },
                  { value: false, label: "Inactive" }
                ]}
              />
              {errors.isVerified && (
                <p className="mt-1 text-sm text-red-500">{errors.isVerified.message}</p>
              )}
            </div>

            <ImageInput onSelect={profileImage} tag={"UploadProfile"} />
            <ImageInput onSelect={documentImage} tag={"UploadDocument"} />
            {/* <div>
              <label className="block mb-1 font-semibold">Staff Id</label>
              <input
                type="Number"
                {...register("attendanceId", { required: "Id is required" })}
                placeholder="Enter an address"
 onWheel={(e) => e.currentTarget.blur()}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0"
              />
              {errors.attendanceId && (
                <p className="text-red-500 text-sm">
                  {errors.attendanceId.message}
                </p>
              )}
            </div> */}
<div>
  <label className="block mb-1 font-semibold">Staff ID</label>

  <input
    type="number"
    {...register("attendanceId", {
      required: "Staff ID is required",
      valueAsNumber: true,
      min: {
        value: 1,
        message: "Staff ID must be greater than 0",
      },
      validate: (value) =>
        Number.isInteger(value) || "Staff ID must be a whole number",
    })}
    placeholder="Enter Staff ID"
    onWheel={(e) => e.currentTarget.blur()}
    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0"
  />

  {errors.attendanceId && (
    <p className="text-red-500 text-sm">
      {errors.attendanceId.message}
    </p>
  )}
</div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5 sm:p-4">
            <div className="mb-3">
              <h3 className="text-sm font-bold text-slate-800">Branch access</h3>
              <p className="mt-0.5 text-xs text-slate-500">Select the company and branch this user can access.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div>
                <label
                  htmlFor="companyName"
                  className="block mb-1 font-semibold"
                >
                  Select Company
                </label>

                <ModernSelect name="companyName" control={control} placeholder="Select company" styles={selectStyles} rules={{ required: "Company is required" }} onValueChange={handleCompanyChange} options={(company || []).map((item) => ({ value: item._id, label: item.companyName || "Unnamed company" }))} />
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

                <ModernSelect name="branchName" control={control} placeholder="Select branch" styles={selectStyles} rules={{ required: "Branch is required" }} onValueChange={handleBranchChange} options={(branches || []).map((branch) => ({ value: branch._id, label: branch.branchName || "Unnamed branch" }))} />
                {errors.branchName && (
                  <p className="text-red-500 text-sm">
                    {errors.branchName.message}
                  </p>
                )}
              </div>
            </div>
            {showTable && (
              <div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleTableData}
                    className="inline-flex items-center rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-blue-100"
                  >
                    {isEditMode ? (
                      <>
                        <span className="text-xl font-bold mr-1">+</span>Update
                        To Table
                      </>
                    ) : (
                      <>
                        <span className="text-xl font-bold">+</span> Add to
                        Table
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full min-w-[620px] divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Company Name
                        </th>
                        <th className="px-4 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Branch Name
                        </th>

                        <th className="px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Edit
                        </th>
                        <th className="px-4 py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Delete
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {tableData && tableData.length > 0 ? (
                        tableData?.map((item, index) => (
                          <tr key={index} className="transition-colors hover:bg-blue-50/60">
                            <td className="whitespace-nowrap px-4 py-2.5 text-sm font-medium text-slate-700">
                              {item?.companyName}
                            </td>

                            <td className="whitespace-nowrap px-4 py-2.5 text-sm text-slate-600">
                              {item?.branchName}
                            </td>

                            <td className="whitespace-nowrap px-4 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleEdit(item.branch_id)}
                                aria-label={`Edit ${item?.branchName || "branch"}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition hover:bg-emerald-100 hover:text-emerald-700"
                              >
                                <FaEdit />
                              </button>
                            </td>

                            <td className="whitespace-nowrap px-4 py-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleDelete(index)}
                                aria-label={`Remove ${item?.branchName || "branch"}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100 hover:text-rose-700"
                              >
                                <FaTrash />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-4 py-8 text-center text-sm text-slate-400"
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

          <div className="flex justify-center border-t border-slate-100 pt-2">
            <button
              type="submit"
              className="mt-3 inline-flex min-w-36 justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-100"
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
