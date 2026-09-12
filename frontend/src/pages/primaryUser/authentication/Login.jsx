import { useState } from "react"
import { useForm } from "react-hook-form"
import api from "../../../api/api"
import { useDispatch } from "react-redux"
import { useNavigate } from "react-router-dom"
import { FaSpinner } from "react-icons/fa"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons"
import { toast } from "react-toastify"
import { setLocalStorageItem } from "../../../helper/localstorage"
import { loginSuccess } from "../../../../slices/authSlice.js"
import {
  setBranches,
  loggeduserBranches,
  setloggeduserBranchOptions,
  setsliceselectedBranch,
  selectedCompany as setSelectedCompany
} from "../../../../slices/companyBranchSlice.js"
const Login = () => {
  console.log("hhhh")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()
  const navigate = useNavigate()
  console.log("hhhhh")
  const onSubmit = async (data) => {
    console.log("hhh")
    if (loading) return
    try {
      setLoading(true)
      const response = await api.post(`/auth/login`, data)
      const datas = response.data
      const { token, User, passwordExpiryWarning, leavemasterdata } = datas
      console.log(leavemasterdata)

      if (response.status === 200) {
        const selectedCompany = User.selected[0]
        const res = await api.get("/branch/getBranch")
        if (res.status === 200) {
          const allcompanybranches = res.data?.data?.map((b) => b._id) || []
          const loggeduserbranches = User.selected?.map((a) => a.branch_id)
          localStorage.setItem("authToken", token)
          localStorage.setItem("user", JSON.stringify(User))
          const uniqueBranches = (User.selected || []).map((branch) => ({
            id: branch.branch_id,
            label: branch.branchName
          }))
          console.log(leavemasterdata[0]?.checkIn)
          // Save to localStorage
          setLocalStorageItem("selectedCompany", selectedCompany)
          setLocalStorageItem("selectedBranch", selectedCompany.branch_id)
          setLocalStorageItem("loggeduserbranches", loggeduserbranches)
          setLocalStorageItem("companybranches", allcompanybranches)
          setLocalStorageItem("loggeduserBranchOptions", uniqueBranches)
          setLocalStorageItem("checkinTime", leavemasterdata[0]?.checkIn)

          dispatch(setSelectedCompany(selectedCompany))
          dispatch(setsliceselectedBranch(selectedCompany.branch_id))
          dispatch(loggeduserBranches(loggeduserbranches))
          dispatch(setBranches(allcompanybranches))
          dispatch(setloggeduserBranchOptions(uniqueBranches))
          dispatch(
            loginSuccess({
              token,
              user: User,
              activeCompany: {
                company_id: selectedCompany.company_id,
                branch_id: selectedCompany.branch_id
              },
              checkInTime: leavemasterdata[0]?.checkIn
            })
          )

          console.log("hh")
          toast.success(response.data.message, {
            icon: "🚀",
            style: {
              backgroundColor: "#fff", // White background
              color: "#000", // Black text for better contrast
              boxShadow:
                "0px 4px 10px rgba(0, 0, 0, 0.3), 0px 1px 3px rgba(0, 0, 0, 0.1)", // 3D shadow effect
              borderRadius: "8px", // Rounded corners for a polished look
              padding: "10px 15px", // Comfortable padding
              fontWeight: "bold" // Bold text for prominence
            }
          })
          if (passwordExpiryWarning) {
            toast.warn(passwordExpiryWarning)
          }

          if (User.role === "Admin") {
            navigate("/admin/dashboard")
          } else {
            switch (User.department?.code) {
              case "DEPARTMENT1":
                navigate("/staff/dashboard")
                break

              case "DEPARTMENT2":
                navigate("/staff/dashboard")
                break

              case "DEPARTMENT3":
                navigate("/staff/reports/markettingdashboard")
                break
              case "DEPARTMENT4":
                navigate("/staff/support&department")
                break

              default:
                navigate("/staff/dashboard")
            }
          }
        }
      }
    } catch (error) {
      console.log(error)
      const expired = error?.response?.data?.passwordExpired
      console.log(expired)
      const message = error?.response?.data?.message || "Something went wrong"
      console.log(error?.response?.data)
      if (expired) {
        toast.error(message)
        // Store minimal required data for password change flow
        localStorage.setItem(
          "pendingPasswordReset",
          JSON.stringify({
            userId: error?.response?.data?.userId,
            role: error?.response?.data?.role,
            department: error?.response?.data?.department,
            expired: true
          })
        )
        // Option 1: redirect to a dedicated reset/change password page
        navigate("/change-password", {
          state: {
            userId: error?.response?.data?.userId,
            role: error?.response?.data?.role,
            department: error?.response?.data?.department,
            expired: true
          }
        })

        return
      }
      setLoading(false)
      toast.error("something went wrong")
      console.error(
        "Login failed:",
        error.response?.data?.message || error.message
      )
    }
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: "url('/background.jpg')" }}
    >
      <div className=" w-[350px] md:w-[400px] p-8 space-y-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold text-center">Login</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label
              htmlFor="emailOrMobile"
              className="block text-sm font-medium text-gray-700"
            >
              Email or Mobile
            </label>
            <input
              type="text"
              id="emailOrMobile"
              {...register("emailOrMobile", {
                required: "Email or mobile number is required",
                validate: (value) => {
                  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                  const isValidMobile = /^[0-9]{10}$/.test(value)
                  if (!isValidEmail && !isValidMobile) {
                    return "Invalid email or mobile number"
                  }
                }
              })}
              className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="off"
            />
            {errors.emailOrMobile && (
              <p className="mt-2 text-sm text-red-600">
                {errors.emailOrMobile.message}
              </p>
            )}
          </div>

          <div className="mb-4 relative">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                id="password"
                {...register("password", { required: "Password is required" })}
                className="w-full px-3 py-2 mt-1 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
              />
              <span
                className="absolute inset-y-0 right-0 flex items-center px-2 cursor-pointer"
                onClick={() => setPasswordVisible(!passwordVisible)}
              >
                <FontAwesomeIcon icon={passwordVisible ? faEyeSlash : faEye} />
              </span>
            </div>
            {errors.password && (
              <p className="mt-2 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center  px-4 py-2 font-semibold text-white bg-indigo-500 rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {/* {loading ? "Loading..." : "Login"} */}
            {loading ? (
              <FaSpinner className="animate-spin h-5 w-5  text-white " />
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login
