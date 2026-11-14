import { useEffect, useState, useMemo } from "react"
import { toast } from "react-toastify"
import { useForm, Controller } from "react-hook-form"
import { Country, State } from "country-state-city"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons"
import { FaEdit, FaTrash, FaUserPlus, FaUserCircle, FaSitemap, FaCamera } from "react-icons/fa"
import Select from "react-select"
import ImageInput from "../common/ImageInput"
import { getProfileImageUrl } from "../../helper/profileImage"
import UseFetch from "../../hooks/useFetch"
import PropTypes from "prop-types"

const ModernSelect = ({ name, control, options, placeholder, styles, onValueChange, isDisabled = false, rules }) => (
  <Controller
    name={name}
    control={control}
    rules={rules}
    render={({ field }) => (
      <Select
        className="user-add-select-root"
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

  const profileImageUrl = useMemo(() => {
    const firstUrl = (value) => (Array.isArray(value) ? value[0] : value)

    return firstUrl(imageData.profileUrl) || firstUrl(User?.profileUrl) || ""
  }, [imageData.profileUrl, User?.profileUrl])

  const selectStyles = useMemo(
    () => ({
      control: (base, state) => ({
        ...base,
        minHeight: "32px",
        height: "32px",
        borderRadius: "6px",
        borderColor: state.isFocused ? "#3b82f6" : "#e2e8f0",
        backgroundColor: state.isDisabled ? "#f8fafc" : "#f8fafc",
        boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.14)" : "0 1px 2px rgba(15, 23, 42, 0.03)",
        cursor: state.isDisabled ? "not-allowed" : "pointer",
        "&:hover": { borderColor: state.isFocused ? "#3b82f6" : "#cbd5e1" }
      }),
      valueContainer: (base) => ({ ...base, height: "30px", minWidth: 0, padding: "0 10px" }),
      placeholder: (base) => ({
        ...base,
        margin: 0,
        color: "#94a3b8",
        fontSize: "12px",
        fontWeight: 400,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }),
      indicatorSeparator: () => ({ display: "none" }),
      dropdownIndicator: (base) => ({ ...base, color: "#64748b", padding: "5px" }),
      indicatorsContainer: (base) => ({ ...base, height: "30px" }),
      menuPortal: (base) => ({ ...base, zIndex: 80 }),
      menu: (base) => ({ ...base, marginTop: "6px", borderRadius: "12px", overflow: "hidden", border: "1px solid #dbe5f1", backgroundColor: "#ffffff", boxShadow: "0 14px 32px rgba(15, 23, 42, 0.16)" }),
      menuList: (base) => ({ ...base, maxHeight: "200px", padding: "5px", overflowY: "auto", backgroundColor: "#ffffff" }),
      option: (base, state) => ({ ...base, borderRadius: "8px", margin: "2px 0", padding: "9px 10px", fontSize: "13px", fontWeight: state.isSelected ? 600 : 500, backgroundColor: state.isSelected ? "#2563eb" : state.isFocused ? "#eff6ff" : "transparent", color: state.isSelected ? "#ffffff" : "#334155", cursor: "pointer", transition: "background-color 120ms ease, color 120ms ease" }),
      singleValue: (base) => ({ ...base, margin: 0, color: "#1e293b", fontSize: "12px", fontWeight: 500 }),
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
      setValue("canSelfAllocateLeads", Boolean(User.canSelfAllocateLeads))

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
        department: data.department || null,
        canSelfAllocateLeads:
          data.canSelfAllocateLeads === true ||
          data.canSelfAllocateLeads === "true"
      }
      handleUserData(formattedData, imageData, tableData)
    } else if (process === "Edit") {
      handleEditedData(data, User?._id, tableData, imageData)
    }
  }
  return (
    <div
      className="min-h-screen bg-[#ADD8E6] p-2 sm:p-2.5 lg:p-3"
      // style={{ backgroundImage: "url('/userbackground.jpg')" }}
    >
      <div className="mx-auto w-full max-w-[1680px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-400/20">
        <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-indigo-50 px-3 py-2 sm:px-4">
          <div className="absolute -right-14 -top-16 h-44 w-80 rounded-full bg-indigo-200/30 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600 text-white shadow-sm shadow-indigo-200"><FaUserPlus size={16} /></span>
            <div>
              <h2 className="text-base font-bold tracking-tight text-slate-900">{isEditMode ? "Edit user" : "Add a new user"}</h2>
              <p className="text-xs text-slate-500">Create a professional profile and define branch access.</p>
            </div>
          </div>
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
        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" className="space-y-2 p-2 sm:p-2.5 [&_label]:mb-0.5 [&_label]:block [&_label]:text-[10px] [&_label]:font-semibold [&_label]:uppercase [&_label]:tracking-[0.05em] [&_label]:text-slate-600 [&_input]:!mt-0 [&_input]:!min-h-8 [&_input]:!w-full [&_input]:!rounded-md [&_input]:!border-slate-200 [&_input]:!bg-slate-50 [&_input]:!px-2.5 [&_input]:!py-1 [&_input]:!text-xs [&_input]:!text-slate-800 [&_input]:!shadow-none [&_input]:!outline-none [&_input]:!transition [&_input]:hover:!border-slate-300 [&_input]:focus:!border-indigo-500 [&_input]:focus:!bg-white [&_input]:focus:!ring-2 [&_input]:focus:!ring-indigo-100 [&_select]:!mt-0 [&_select]:!min-h-8 [&_select]:!w-full [&_select]:!rounded-md [&_select]:!border-slate-200 [&_select]:!bg-slate-50 [&_select]:!px-2.5 [&_select]:!py-1 [&_select]:!text-xs [&_select]:!text-slate-800 [&_select]:!shadow-none [&_select]:!outline-none [&_select]:!transition [&_select]:hover:!border-slate-300 [&_select]:focus:!border-indigo-500 [&_select]:focus:!bg-white [&_select]:focus:!ring-2 [&_select]:focus:!ring-indigo-100">
          <div className="grid gap-2 xl:grid-cols-[128px_minmax(0,1fr)] xl:items-start">
            <aside className="flex flex-row items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-1.5 xl:flex-col xl:bg-transparent xl:p-0">
              <div className="relative rounded-full border-4 border-white bg-gradient-to-br from-indigo-100 to-blue-100 p-1 shadow-md shadow-indigo-100">
                {profileImageUrl ? (
                  <img
                    src={getProfileImageUrl(profileImageUrl, 160)}
                    alt="User profile"
                    decoding="async"
                    className="h-16 w-16 rounded-full object-cover sm:h-[72px] sm:w-[72px]"
                  />
                ) : (
                  <span className="grid h-16 w-16 place-items-center rounded-full bg-slate-100 text-2xl font-bold text-indigo-500 sm:h-[72px] sm:w-[72px]">
                    {(watch("name") || "U").trim().charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="absolute bottom-0 right-0 grid h-6 w-6 place-items-center rounded-full border-2 border-white bg-blue-600 text-white shadow-sm"><FaCamera size={10} /></span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 xl:mt-1 xl:text-center">Profile photo</p>
            </aside>
            <div className="min-w-0 space-y-2">
          <div className="grid grid-cols-1 gap-x-2 gap-y-1.5 rounded-lg border border-violet-100 bg-violet-50/60 p-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="col-span-full flex items-center gap-1.5 border-b border-slate-200 pb-1 text-xs font-bold text-slate-800"><FaUserCircle className="text-indigo-600" /> Personal information</div>
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
                className="user-add-select-root"
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
                className="user-add-select-root"
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
          </div>

          <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
            <section className="order-1 grid grid-cols-1 gap-x-2 gap-y-1.5 rounded-lg border border-blue-100 bg-blue-50/60 p-2 sm:grid-cols-2">
            <div className="col-span-full flex items-center gap-1.5 border-b border-blue-100 pb-1 text-xs font-bold text-blue-900"><FaUserCircle className="text-blue-600" /> Employment details</div>
            <div>
              <label htmlFor="department" className="block mb-1 font-semibold">
                Department
              </label>

              <ModernSelect name="department" control={control} placeholder="Select department" styles={selectStyles} onValueChange={setSelectedDepartment} options={(departments || []).map((department) => ({ value: department._id, label: department.department || "Unnamed department" }))} />
            </div>
            <div>
              <label htmlFor="role" className="block mb-1 font-semibold">Role</label>
              <ModernSelect name="role" control={control} placeholder="Select role" styles={selectStyles} rules={{ required: "Role is required" }} options={["Staff", "Admin", "Manager", "Team Leader"].map((value) => ({ value, label: value }))} />
            </div>
            <div>
              <label className="block mb-1 font-semibold">
                Can self-allocate leads?
              </label>
              <select {...register("canSelfAllocateLeads")}>
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
              <p className="mt-1 text-[10px] normal-case tracking-normal text-slate-500">
                Allow this user to create and work on self-allocated leads.
              </p>
            </div>
            <div>
              <label htmlFor="assignedto" className="block mb-1 font-semibold">Assigned to</label>
              <ModernSelect name="assignedto" control={control} placeholder="Select reporting manager" styles={selectStyles} rules={{ required: "Assigned to is required" }} options={(users || []).map((staff) => ({ value: staff._id, label: staff.name || "Unnamed user" }))} />
              {errors.assignedto && <p className="text-red-500 text-sm">{errors.assignedto.message}</p>}
            </div>
            <div>
              <label className="block mb-1 font-semibold">Account status</label>
              <ModernSelect name="isVerified" control={control} placeholder="Select account status" styles={selectStyles} rules={{ validate: (value) => typeof value === "boolean" || "Account status is required" }} options={[{ value: true, label: "Active" }, { value: false, label: "Inactive" }]} />
              {errors.isVerified && <p className="mt-1 text-sm text-red-500">{errors.isVerified.message}</p>}
            </div>
            </section>

            <section className="order-3 grid grid-cols-1 gap-x-2 gap-y-1.5 rounded-lg border border-teal-100 bg-teal-50/60 p-2 sm:grid-cols-2">
            <div className="col-span-full flex items-center gap-1.5 border-b border-teal-100 pb-1 text-xs font-bold text-teal-900"><FaUserCircle className="text-teal-600" /> Access &amp; security</div>
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

                <button
                  type="button"
                  aria-label={passwordVisible ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-1 flex items-center rounded-md px-2 text-slate-500 transition hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  onClick={() => setPasswordVisible(!passwordVisible)}
                >
                  <FontAwesomeIcon
                    icon={passwordVisible ? faEyeSlash : faEye}
                  />
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-1 font-semibold">Staff ID</label>
              <input
                type="number"
                {...register("attendanceId", {
                  required: "Staff ID is required",
                  valueAsNumber: true,
                  min: { value: 1, message: "Staff ID must be greater than 0" },
                  validate: (value) => Number.isInteger(value) || "Staff ID must be a whole number"
                })}
                placeholder="Enter Staff ID"
                onWheel={(e) => e.currentTarget.blur()}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 sm:text-sm outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:m-0 [&::-webkit-outer-spin-button]:m-0"
              />
              {errors.attendanceId && <p className="text-red-500 text-sm">{errors.attendanceId.message}</p>}
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

            </section>

            <section className="order-2 grid grid-cols-1 gap-x-2 gap-y-1.5 rounded-lg border border-violet-100 bg-violet-50/60 p-2 sm:grid-cols-2">
            <div className="col-span-full flex items-center gap-1.5 border-b border-violet-100 pb-1 text-xs font-bold text-violet-900"><FaUserCircle className="text-violet-600" /> Leave configuration</div>
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

            </section>

            <section className="order-4 grid grid-cols-1 gap-x-2 gap-y-1.5 rounded-lg border border-orange-100 bg-orange-50/60 p-2 sm:grid-cols-2">
            <div className="col-span-full flex items-center gap-1.5 border-b border-orange-100 pb-1 text-xs font-bold text-orange-900"><FaUserCircle className="text-orange-600" /> Uploads</div>
            <ImageInput onSelect={profileImage} tag={"UploadProfile"} compact profilePhoto />
            <ImageInput onSelect={documentImage} tag={"UploadDocument"} compact />
          </section>
          </div>

          <div className="rounded-lg border border-violet-100 bg-white p-2 shadow-sm shadow-violet-100/50">
            <div className="mb-1 flex flex-wrap items-baseline gap-x-2">
              <h3 className="flex items-center gap-1.5 text-sm font-bold text-slate-800"><FaSitemap className="text-indigo-600" /> Branch access</h3>
              <p className="text-xs text-slate-500">Select each company and branch this user can access.</p>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
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
              {showTable && (
                <button
                  type="button"
                  onClick={handleTableData}
                  className="inline-flex h-8 items-center justify-center rounded-md bg-violet-600 px-4 text-xs font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-violet-200"
                >
                  <span className="mr-1 text-base font-bold">+</span>
                  {isEditMode ? "Update To Table" : "Add To Table"}
                </button>
              )}
            </div>
            {showTable && (
              <div>
                <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
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

          <div className="flex justify-center gap-2 border-t border-slate-200 pt-2">
            <button
              type="button"
              onClick={() => reset()}
              className="inline-flex min-h-10 min-w-28 justify-center rounded-lg border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-700 shadow-sm transition hover:bg-violet-50 focus:outline-none focus:ring-4 focus:ring-violet-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex min-h-11 min-w-36 justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-indigo-100"
            >
              {isEditMode ? "Update" : "Register"}
            </button>
          </div>
          </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserAdd
