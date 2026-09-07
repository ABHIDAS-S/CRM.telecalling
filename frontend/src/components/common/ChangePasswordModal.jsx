// import { X } from "lucide-react"
// import { useSelector } from "react-redux"
// import PasswordField from "./PasswordField"
// import { useNavigate } from "react-router-dom"
// import { useState, useMemo, useEffect } from "react"
// import { toast } from "react-toastify"
// import api from "../../api/api"
// export default function ChangePasswordModal({
//   open,
//   onClose,
//   navigateurl = null
// }) {
//   console.log(navigateurl)
//   const loggeduser = useSelector((state) => state.auth.user)

//   const [savingPassword, setSavingPassword] = useState(false)
//   const [passwordForm, setPasswordForm] = useState({
//     currentPassword: "",
//     newPassword: "",
//     confirmPassword: ""
//   })

//   const [passwordErrors, setPasswordErrors] = useState({})
//   const [showPassword, setShowPassword] = useState({
//     current: false,
//     next: false,
//     confirm: false
//   })
//   const navigate = useNavigate()

//   const expiryDate = useMemo(() => {
//     const now = new Date()
//     const next = new Date(now)
//     next.setMonth(next.getMonth() + 2)
//     return next.toLocaleDateString("en-GB", {
//       day: "2-digit",
//       month: "short",
//       year: "numeric"
//     })
//   }, [])

//   useEffect(() => {
//     if (!open) return

//     const handleKeyDown = (e) => {
//       if (e.key === "Escape") {
//         e.stopPropagation()
//         onClose?.()
//       }
//     }

//     window.addEventListener("keydown", handleKeyDown)
//     return () => window.removeEventListener("keydown", handleKeyDown)
//   }, [open, onClose])

//   const sanitizePasswordValue = (value) => {
//     return String(value ?? "")
//       .replace(/\s/g, "")
//       .trim()
//   }
//   const handlepasswordChange = async (payload) => {
//     try {
//       const updatepassword = await api.put("/auth/updatepassword", payload)

//       if (updatepassword.status === 200) {
//         toast.success(updatepassword.data.message)
//         if (navigateurl) {
//           navigate(navigateurl)
//         }
//       } else {
//         toast.error("Something went wrong")
//       }
//     } catch (error) {
//       toast.error(error?.response?.data?.message || "Failed to update password")
//       throw error
//     }
//   }
//   const handlePasswordInput = (field, value) => {
//     const cleaned = sanitizePasswordValue(value)
//     setPasswordForm((prev) => ({
//       ...prev,
//       [field]: cleaned
//     }))
//     setPasswordErrors((prev) => ({
//       ...prev,
//       [field]: "",
//       submit: ""
//     }))
//   }

//   const validatePasswordForm = () => {
//     const errors = {}
//     const currentPassword = passwordForm.currentPassword.trim()
//     const newPassword = passwordForm.newPassword.trim()
//     const confirmPassword = passwordForm.confirmPassword.trim()

//     if (!currentPassword) {
//       errors.currentPassword = "Current password is required"
//     }

//     if (!newPassword) {
//       errors.newPassword = "New password is required"
//     } else if (newPassword.length < 8) {
//       errors.newPassword = "Password must be at least 8 characters"
//     } else if (!/[A-Z]/.test(newPassword)) {
//       errors.newPassword = "Include at least one uppercase letter"
//     } else if (!/[a-z]/.test(newPassword)) {
//       errors.newPassword = "Include at least one lowercase letter"
//     } else if (!/[0-9]/.test(newPassword)) {
//       errors.newPassword = "Include at least one number"
//     } else if (!/[!@#$%^&*(),.?":{}|<>_\-\\[\]/+=~`]/.test(newPassword)) {
//       errors.newPassword = "Include at least one special character"
//     } else if (/\s/.test(newPassword)) {
//       errors.newPassword = "Spaces are not allowed"
//     }

//     if (!confirmPassword) {
//       errors.confirmPassword = "Confirm password is required"
//     } else if (newPassword !== confirmPassword) {
//       errors.confirmPassword = "Passwords do not match"
//     }

//     if (currentPassword && newPassword && currentPassword === newPassword) {
//       errors.newPassword =
//         "New password must be different from current password"
//     }

//     setPasswordErrors(errors)
//     return Object.keys(errors).length === 0
//   }

//   const handlePasswordSubmit = async (e) => {
//     e.preventDefault()

//     if (!validatePasswordForm()) return

//     try {
//       setSavingPassword(true)

//       const payload = {
//         userId: loggeduser?.id || loggeduser?._id,
//         currentPassword: passwordForm.currentPassword.trim(),
//         newPassword: passwordForm.newPassword.trim(),
//         confirmPassword: passwordForm.confirmPassword.trim(),
//         passwordExpiryAt: (() => {
//           const d = new Date()
//           d.setMonth(d.getMonth() + 2)
//           return d.toISOString()
//         })()
//       }

//       handlepasswordChange(payload)

//       setPasswordForm({
//         currentPassword: "",
//         newPassword: "",
//         confirmPassword: ""
//       })
//       setPasswordErrors({})
//       setShowPassword({
//         current: false,
//         next: false,
//         confirm: false
//       })
//       toast.success("Password Updated Successfully")
//       onClose?.()
//     } catch (error) {
//       console.log(error)
//       toast.error(error.message)
//       setPasswordErrors((prev) => ({
//         ...prev,
//         submit:
//           error?.response?.data?.message ||
//           error?.message ||
//           "Failed to update password"
//       }))
//     } finally {
//       setSavingPassword(false)
//     }
//   }

//   const passwordChecks = [
//     {
//       label: "Minimum 8 characters",
//       valid: passwordForm.newPassword.length >= 8
//     },
//     {
//       label: "One uppercase letter",
//       valid: /[A-Z]/.test(passwordForm.newPassword)
//     },
//     {
//       label: "One lowercase letter",
//       valid: /[a-z]/.test(passwordForm.newPassword)
//     },
//     {
//       label: "One number",
//       valid: /[0-9]/.test(passwordForm.newPassword)
//     },
//     {
//       label: "One special character",
//       valid: /[!@#$%^&*(),.?":{}|<>_\-\\[\]/+=~`]/.test(
//         passwordForm.newPassword
//       )
//     },
//     {
//       label: "No spaces",
//       valid:
//         passwordForm.newPassword.length > 0 &&
//         !/\s/.test(passwordForm.newPassword)
//     }
//   ]

//   if (!open) return null

//   return (
//     <div
//       className="fixed inset-0 z-[70] bg-slate-950/55 p-2 sm:p-3"
//       onClick={onClose}
//     >
//       <div className="flex min-h-full items-center justify-center">
//         <div
//           className="flex w-full max-w-sm max-h-screen flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
//           onClick={(e) => e.stopPropagation()}
//           role="dialog"
//           aria-modal="true"
//           aria-labelledby="change-password-title"
//         >
//           <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-3 py-2.5">
//             <div>
//               <h3
//                 id="change-password-title"
//                 className="text-[14px] font-semibold text-slate-900"
//               >
//                 Update password
//               </h3>
//               <p className="mt-0.5 text-[11px] text-slate-500">
//                 Expires automatically after 2 months
//               </p>
//             </div>

//             <button
//               type="button"
//               onClick={onClose}
//               className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
//             >
//               <X size={14} />
//             </button>
//           </div>

//           <form
//             onSubmit={handlePasswordSubmit}
//             className="flex min-h-0 flex-1 flex-col"
//           >
//             <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2.5">
//               <div className="space-y-3">
//                 <PasswordField
//                   label="Current Password"
//                   value={passwordForm.currentPassword}
//                   onChange={(e) =>
//                     handlePasswordInput("currentPassword", e.target.value)
//                   }
//                   error={passwordErrors.currentPassword}
//                   placeholder="Enter current password"
//                   autoComplete="current-password"
//                   visible={showPassword.current}
//                   onToggle={() =>
//                     setShowPassword((prev) => ({
//                       ...prev,
//                       current: !prev.current
//                     }))
//                   }
//                 />

//                 <PasswordField
//                   label="New Password"
//                   value={passwordForm.newPassword}
//                   onChange={(e) =>
//                     handlePasswordInput("newPassword", e.target.value)
//                   }
//                   error={passwordErrors.newPassword}
//                   placeholder="Enter new password"
//                   autoComplete="new-password"
//                   visible={showPassword.next}
//                   onToggle={() =>
//                     setShowPassword((prev) => ({
//                       ...prev,
//                       next: !prev.next
//                     }))
//                   }
//                 />

//                 <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
//                   <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
//                     Rules
//                   </p>

//                   <div className="grid grid-cols-1 gap-1">
//                     {passwordChecks.map((item) => (
//                       <div
//                         key={item.label}
//                         className={`text-[11px] leading-4 ${
//                           item.valid ? "text-emerald-600" : "text-slate-500"
//                         }`}
//                       >
//                         {item.valid ? "✓" : "•"} {item.label}
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 <PasswordField
//                   label="Confirm Password"
//                   value={passwordForm.confirmPassword}
//                   onChange={(e) =>
//                     handlePasswordInput("confirmPassword", e.target.value)
//                   }
//                   error={passwordErrors.confirmPassword}
//                   placeholder="Re-enter new password"
//                   autoComplete="new-password"
//                   visible={showPassword.confirm}
//                   onToggle={() =>
//                     setShowPassword((prev) => ({
//                       ...prev,
//                       confirm: !prev.confirm
//                     }))
//                   }
//                 />

//                 <div className="rounded-lg border border-teal-100 bg-teal-50 px-2.5 py-2">
//                   <p className="text-[11px] font-medium text-teal-800">
//                     Expiry: {expiryDate}
//                   </p>
//                 </div>

//                 {passwordErrors.submit ? (
//                   <div className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-[11px] text-red-600">
//                     {passwordErrors.submit}
//                   </div>
//                 ) : null}
//               </div>
//             </div>

//             <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-white px-3 py-2.5">
//               <button
//                 type="button"
//                 onClick={onClose}
//                 className="rounded-md border border-slate-300 px-3 py-1.5 text-[12px] font-medium text-slate-700 transition hover:bg-slate-50"
//               >
//                 Cancel
//               </button>

//               <button
//                 type="submit"
//                 disabled={savingPassword}
//                 className="rounded-md bg-teal-700 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
//               >
//                 {savingPassword ? "Updating..." : "Update"}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   )
// }
import { X } from "lucide-react"
import { useSelector } from "react-redux"
import PasswordField from "./PasswordField"
import { useNavigate } from "react-router-dom"
import { useState, useMemo, useEffect } from "react"
import { toast } from "react-toastify"
import api from "../../api/api"
import { useDispatch } from "react-redux"
import { loginSuccess } from "../../../slices/authSlice"
import {
  setsliceselectedBranch,
  selectedCompany as setSelectedCompany,
  setloggeduserBranchOptions,
  loggeduserBranches,
  setBranches
} from "../../../slices/companyBranchSlice"
import { setLocalStorageItem } from "../../helper/localstorage"
export default function ChangePasswordModal({
  open,
  onClose,
  navigateurl = null,
  pendingData
}) {
  console.log(pendingData)
  const loggeduser = useSelector((state) => state.auth.user)

  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })

  const [passwordErrors, setPasswordErrors] = useState({})
  const [showPassword, setShowPassword] = useState({
    current: false,
    next: false,
    confirm: false
  })
  const navigate = useNavigate()
const dispatch = useDispatch()
  const expiryDate = useMemo(() => {
    const now = new Date()
    const next = new Date(now)
    next.setMonth(next.getMonth() + 2)
    return next.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
  }, [])

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose?.()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  const sanitizePasswordValue = (value) => {
    return String(value ?? "")
      .replace(/\s/g, "")
      .trim()
  }

  const handlepasswordChange = async (payload) => {
    try {
      const updatepassword = await api.put("/auth/updatepassword", payload)

      if (updatepassword.status === 200) {
        toast.success(updatepassword.data.message)
        if (navigateurl) {
          console.log(updatepassword?.data)
          const datas = updatepassword.data
          console.log(datas)
          const { token, user, passwordExpiryWarning, leavemasterdata } = datas
          console.log(token)
          console.log(user)
          console.log(leavemasterdata)
          const selectedCompany = user?.selected[0]
          const res = await api.get("/branch/getBranch")

          const allcompanybranches = res.data?.data?.map((b) => b._id) || []
          const loggeduserbranches = user?.selected?.map((a) => a.branch_id)
          localStorage.setItem("authToken", token)
          localStorage.setItem("user", JSON.stringify(user))
          const uniqueBranches = (user?.selected || []).map((branch) => ({
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
              user: user,
              activeCompany: {
                company_id: selectedCompany.company_id,
                branch_id: selectedCompany.branch_id
              },
              checkInTime: leavemasterdata[0]?.checkIn
            })
          )

          console.log("hh")
          toast.success(updatepassword.data.message, {
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

          navigate(navigateurl)
        }
        return true
      } else {
        toast.error("Something went wrong")
        return false
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update password")
      throw error
    }
  }

  const handlePasswordInput = (field, value) => {
    const cleaned = sanitizePasswordValue(value)
    setPasswordForm((prev) => ({
      ...prev,
      [field]: cleaned
    }))
    setPasswordErrors((prev) => ({
      ...prev,
      [field]: "",
      submit: ""
    }))
  }

  const validatePasswordForm = () => {
    const errors = {}
    const currentPassword = passwordForm.currentPassword.trim()
    const newPassword = passwordForm.newPassword.trim()
    const confirmPassword = passwordForm.confirmPassword.trim()

    if (!currentPassword) {
      errors.currentPassword = "Current password is required"
    }

    if (!newPassword) {
      errors.newPassword = "New password is required"
    } else if (newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters"
    } else if (!/[A-Z]/.test(newPassword)) {
      errors.newPassword = "Include at least one uppercase letter"
    } else if (!/[a-z]/.test(newPassword)) {
      errors.newPassword = "Include at least one lowercase letter"
    } else if (!/[0-9]/.test(newPassword)) {
      errors.newPassword = "Include at least one number"
    } else if (!/[!@#$%^&*(),.?":{}|<>_\-\\[\]/+=~`]/.test(newPassword)) {
      errors.newPassword = "Include at least one special character"
    } else if (/\s/.test(newPassword)) {
      errors.newPassword = "Spaces are not allowed"
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirm password is required"
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match"
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      errors.newPassword =
        "New password must be different from current password"
    }

    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    if (!validatePasswordForm()) return

    try {
      setSavingPassword(true)
console.log(loggeduser)
console.log(pendingData)
console.log(passwordForm)
      const payload = {
        userId: loggeduser?.id || loggeduser?._id || pendingData?.userId,
        currentPassword: passwordForm.currentPassword.trim(),
        newPassword: passwordForm.newPassword.trim(),
        confirmPassword: passwordForm.confirmPassword.trim(),
        passwordExpiryAt: (() => {
          const d = new Date()
          d.setMonth(d.getMonth() + 2)
          return d.toISOString()
        })()
      }

      // Await the password change before proceeding
      await handlepasswordChange(payload)

      // Clear form and close modal
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      })
      setPasswordErrors({})
      setShowPassword({
        current: false,
        next: false,
        confirm: false
      })
      onClose?.()
    } catch (error) {
      console.log(error?.response?.data?.message)
      setPasswordErrors((prev) => ({
        ...prev,
        submit:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to update password"
      }))
    } finally {
      setSavingPassword(false)
    }
  }

  const passwordChecks = [
    {
      label: "Minimum 8 characters",
      valid: passwordForm.newPassword.length >= 8
    },
    {
      label: "One uppercase letter",
      valid: /[A-Z]/.test(passwordForm.newPassword)
    },
    {
      label: "One lowercase letter",
      valid: /[a-z]/.test(passwordForm.newPassword)
    },
    {
      label: "One number",
      valid: /[0-9]/.test(passwordForm.newPassword)
    },
    {
      label: "One special character",
      valid: /[!@#$%^&*(),.?":{}|<>_\-\\[\]/+=~`]/.test(
        passwordForm.newPassword
      )
    },
    {
      label: "No spaces",
      valid:
        passwordForm.newPassword.length > 0 &&
        !/\s/.test(passwordForm.newPassword)
    }
  ]

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[70] bg-slate-950/55 p-2 sm:p-3"
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center">
        <div
          className="flex w-full max-w-sm max-h-screen flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="change-password-title"
        >
          <div className="flex shrink-0 items-start justify-between border-b border-slate-200 px-3 py-2.5">
            <div>
              <h3
                id="change-password-title"
                className="text-[14px] font-semibold text-slate-900"
              >
                Update password
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Expires automatically after 2 months
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={14} />
            </button>
          </div>

          <form
            onSubmit={handlePasswordSubmit}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2.5">
              <div className="space-y-3">
                <PasswordField
                  label="Current Password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    handlePasswordInput("currentPassword", e.target.value)
                  }
                  error={passwordErrors.currentPassword}
                  placeholder="Enter current password"
                  autoComplete="current-password"
                  visible={showPassword.current}
                  onToggle={() =>
                    setShowPassword((prev) => ({
                      ...prev,
                      current: !prev.current
                    }))
                  }
                />

                <PasswordField
                  label="New Password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    handlePasswordInput("newPassword", e.target.value)
                  }
                  error={passwordErrors.newPassword}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  visible={showPassword.next}
                  onToggle={() =>
                    setShowPassword((prev) => ({
                      ...prev,
                      next: !prev.next
                    }))
                  }
                />

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Rules
                  </p>

                  <div className="grid grid-cols-1 gap-1">
                    {passwordChecks.map((item) => (
                      <div
                        key={item.label}
                        className={`text-[11px] leading-4 ${
                          item.valid ? "text-emerald-600" : "text-slate-500"
                        }`}
                      >
                        {item.valid ? "✓" : "•"} {item.label}
                      </div>
                    ))}
                  </div>
                </div>

                <PasswordField
                  label="Confirm Password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    handlePasswordInput("confirmPassword", e.target.value)
                  }
                  error={passwordErrors.confirmPassword}
                  placeholder="Re-enter new password"
                  autoComplete="new-password"
                  visible={showPassword.confirm}
                  onToggle={() =>
                    setShowPassword((prev) => ({
                      ...prev,
                      confirm: !prev.confirm
                    }))
                  }
                />

                <div className="rounded-lg border border-teal-100 bg-teal-50 px-2.5 py-2">
                  <p className="text-[11px] font-medium text-teal-800">
                    Expiry: {expiryDate}
                  </p>
                </div>

                {passwordErrors.submit ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-2 text-[11px] text-red-600">
                    {passwordErrors.submit}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-white px-3 py-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-[12px] font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={savingPassword}
                className="rounded-md bg-teal-700 px-3 py-1.5 text-[12px] font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingPassword ? "Updating..." : "Update"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
