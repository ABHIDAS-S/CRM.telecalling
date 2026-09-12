


// import ChangePasswordModal from "./ChangePasswordModal"
// import { useState, useEffect } from "react"
// import { useLocation, useNavigate } from "react-router-dom"

// export const ChangePassword = () => {
//   const [passwordOpen, setchangepasswordOpen] = useState(true)
//   const [navigateurl, setnavigateurl] = useState(null)
//   const [pendingData, setPendingData] = useState(null)
// console.log(pendingData)
//   const location = useLocation()
//   const navigate = useNavigate()
  
//   useEffect(() => {
//     // Get data from navigation state or localStorage
//     const stateData = location?.state
//     const storedData = localStorage.getItem("pendingPasswordReset")
//     const data = stateData || (storedData ? JSON.parse(storedData) : null)
    
//     if (!data) {
//       // No password reset data, redirect to login
//       navigate("/login")
//       return
//     }
    
//     setPendingData(data)
    
//     // Determine redirect URL based on role/department
//     if (data?.role === "Admin") {
//       setnavigateurl("/admin/dashboard")
//     } else {
//       switch (data?.department?.code) {
//         case "DEPARTMENT1":
//         case "DEPARTMENT2":
//           setnavigateurl("/staff/dashboard")
//           break
//         case "DEPARTMENT3":
//           setnavigateurl("/staff/reports/markettingdashboard")
//           break
//         case "DEPARTMENT4":
//           setnavigateurl("/staff/support&department")
//           break
//         default:
//           setnavigateurl("/staff/dashboard")
//       }
//     }
//   }, [location?.state, navigate])
  
//   const handleClose = () => {
//     setchangepasswordOpen(false)
//     // Clean up localStorage after modal closes
//     localStorage.removeItem("pendingPasswordReset")
//   }
  
//   return (
//     pendingData && navigateurl && (
//       <ChangePasswordModal
//         open={passwordOpen}
//         onClose={handleClose}
//         navigateurl={navigateurl}
//         pendingData={pendingData}
//       />
//     )
//   )
// }

// import ChangePasswordModal from "./ChangePasswordModal"
// import { useEffect, useState } from "react"
// import { useLocation, useNavigate } from "react-router-dom"

// export const ChangePassword = () => {
//   const [passwordOpen, setPasswordOpen] = useState(true)
//   const [navigateurl, setNavigateurl] = useState(null)
//   const [pendingData, setPendingData] = useState(null)
//   const [isLoading, setIsLoading] = useState(true)

//   const location = useLocation()
//   const navigate = useNavigate()

//   useEffect(() => {
//     let data = location.state

//     /*
//       location.state exists immediately after:
//       navigate("/change-password", { state: {...} })

//       localStorage is the fallback when the user refreshes this page.
//     */
//     if (!data) {
//       const storedData = localStorage.getItem("pendingPasswordReset")

//       if (storedData) {
//         try {
//           data = JSON.parse(storedData)
//         } catch (error) {
//           console.error("Invalid pendingPasswordReset data:", error)
//           localStorage.removeItem("pendingPasswordReset")
//         }
//       }
//     }

//     if (!data?.userId) {
//       navigate("/login", { replace: true })
//       return
//     }

//     setPendingData(data)

//     if (data.role === "Admin") {
//       setNavigateurl("/admin/dashboard")
//     } else {
//       switch (data?.department?.code) {
//         case "DEPARTMENT1":
//         case "DEPARTMENT2":
//           setNavigateurl("/staff/dashboard")
//           break

//         case "DEPARTMENT3":
//           setNavigateurl("/staff/reports/markettingdashboard")
//           break

//         case "DEPARTMENT4":
//           setNavigateurl("/staff/support&department")
//           break

//         default:
//           setNavigateurl("/staff/dashboard")
//           break
//       }
//     }

//     setIsLoading(false)
//   }, [location.state, navigate])

//   useEffect(() => {
//     /*
//       Prevent scrolling of the white route/page behind the modal.
//       This cleanup restores the previous body overflow value
//       when this component unmounts.
//     */
//     const previousOverflow = document.body.style.overflow
//     document.body.style.overflow = "hidden"

//     return () => {
//       document.body.style.overflow = previousOverflow
//     }
//   }, [])

  // const handleClose = () => {
  //   /*
  //     For an expired-password flow, do not leave the user on
  //     /change-password with a closed modal.

  //     They must either update the password successfully, or return
  //     to the login page.
  //   */
  //   localStorage.removeItem("pendingPasswordReset")

  //   setPasswordOpen(false)

  //   navigate("/login", { replace: true })
  // }

//   if (isLoading) {
//     return (
//       <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
//         <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
//       </div>
//     )
//   }

//   if (!pendingData || !navigateurl) {
//     return null
//   }

//   return (
//     /*
//       This is the full page behind ChangePasswordModal.

//       It ensures that /change-password never exposes the white
//       application page behind the semi-transparent modal overlay.
//     */
//     <main className="fixed inset-0 min-h-screen overflow-hidden bg-slate-950">
//       <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950" />

//       <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />

//       <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

//       <ChangePasswordModal
//         open={passwordOpen}
//         onClose={handleClose}
//         navigateurl={navigateurl}
//         pendingData={pendingData}
//       />
//     </main>
//   )
// }


import ChangePasswordModal from "./ChangePasswordModal"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"

export const ChangePassword = () => {
  const [passwordOpen, setPasswordOpen] = useState(true)
  const [navigateurl, setNavigateurl] = useState(null)
  const [pendingData, setPendingData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    let data = location.state

    /*
      When the user refreshes /change-password,
      React Router location.state is lost.

      localStorage acts as a fallback.
    */
    if (!data) {
      const storedData = localStorage.getItem("pendingPasswordReset")

      if (storedData) {
        try {
          data = JSON.parse(storedData)
        } catch (error) {
          console.error("Invalid pendingPasswordReset data:", error)
          localStorage.removeItem("pendingPasswordReset")
        }
      }
    }

    /*
      This route should be opened only from an expired-password login response.
    */
    if (!data?.userId) {
      navigate("/login", { replace: true })
      return
    }

    setPendingData(data)

    if (data.role === "Admin") {
      setNavigateurl("/admin/dashboard")
    } else {
      switch (data?.department?.code) {
        case "DEPARTMENT1":
        case "DEPARTMENT2":
          setNavigateurl("/staff/dashboard")
          break

        case "DEPARTMENT3":
          setNavigateurl("/staff/reports/markettingdashboard")
          break

        case "DEPARTMENT4":
          setNavigateurl("/staff/support&department")
          break

        default:
          setNavigateurl("/staff/dashboard")
          break
      }
    }

    setIsLoading(false)
  }, [location.state, navigate])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  /*
    `onClose` is triggered by:
    - Backdrop click
    - X icon
    - Escape key

    During an expired-password flow, ignore it.
  */
  // const handleClose = () => {
  //   return
  // }

  const handleClose = () => {
    /*
      For an expired-password flow, do not leave the user on
      /change-password with a closed modal.

      They must either update the password successfully, or return
      to the login page.
    */
    localStorage.removeItem("pendingPasswordReset")

    setPasswordOpen(false)

    navigate("/login", { replace: true })
  }

  /*
    This is passed only to the Cancel button.
  */
  const handleCancel = () => {
    localStorage.removeItem("pendingPasswordReset")

    setPasswordOpen(false)

    navigate("/login", { replace: true })
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      </div>
    )
  }

  if (!pendingData || !navigateurl) {
    return null
  }

  return (
    <main className="fixed inset-0 min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950" />

      <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />

      <div className="absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />

      <ChangePasswordModal
        open={passwordOpen}
        onClose={handleClose}
        onCancel={handleCancel}
        navigateurl={navigateurl}
        pendingData={pendingData}
      />
    </main>
  )
}