// import ChangePasswordModal from "./ChangePasswordModal"
// import { useState, useEffect } from "react"
// import { useLocation } from "react-router-dom"
// import { useNavigate } from "react-router-dom"
// export const ChangePassword = () => {
//   const [passwordOpen, setchangepasswordOpen] = useState(true)
//   const [navigateurl, setnavigateurl] = useState(null)
//   const location = useLocation()
//   const navigate = useNavigate()
//   console.log(location?.state)
//   useEffect(() => {
//     if (location?.state?.role === "Admin") {
//       console.log("hhh")
//       setnavigateurl("/admin/dashboard")
//     } else {
//       switch (location?.state?.department?.code) {
//         case "DEPARTMENT1":
//           setnavigateurl("/staff/dashboard")
//           break

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
//   }, [location?.state])
//   return (
//     navigateurl && (
//       <ChangePasswordModal
//         open={passwordOpen}
//         onClose={() => setchangepasswordOpen(false)}
//         navigateurl={navigateurl}
//       />
//     )
//   )
// }



import ChangePasswordModal from "./ChangePasswordModal"
import { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"

export const ChangePassword = () => {
  const [passwordOpen, setchangepasswordOpen] = useState(true)
  const [navigateurl, setnavigateurl] = useState(null)
  const [pendingData, setPendingData] = useState(null)
console.log(pendingData)
  const location = useLocation()
  const navigate = useNavigate()
  
  useEffect(() => {
    // Get data from navigation state or localStorage
    const stateData = location?.state
    const storedData = localStorage.getItem("pendingPasswordReset")
    const data = stateData || (storedData ? JSON.parse(storedData) : null)
    
    if (!data) {
      // No password reset data, redirect to login
      navigate("/login")
      return
    }
    
    setPendingData(data)
    
    // Determine redirect URL based on role/department
    if (data?.role === "Admin") {
      setnavigateurl("/admin/dashboard")
    } else {
      switch (data?.department?.code) {
        case "DEPARTMENT1":
        case "DEPARTMENT2":
          setnavigateurl("/staff/dashboard")
          break
        case "DEPARTMENT3":
          setnavigateurl("/staff/reports/markettingdashboard")
          break
        case "DEPARTMENT4":
          setnavigateurl("/staff/support&department")
          break
        default:
          setnavigateurl("/staff/dashboard")
      }
    }
  }, [location?.state, navigate])
  
  const handleClose = () => {
    setchangepasswordOpen(false)
    // Clean up localStorage after modal closes
    localStorage.removeItem("pendingPasswordReset")
  }
  
  return (
    pendingData && navigateurl && (
      <ChangePasswordModal
        open={passwordOpen}
        onClose={handleClose}
        navigateurl={navigateurl}
        pendingData={pendingData}
      />
    )
  )
}
