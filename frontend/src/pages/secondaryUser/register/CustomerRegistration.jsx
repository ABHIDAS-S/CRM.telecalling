import React from "react"
import CustomerAdd from "../../../components/secondaryUser/CustomerAdd"
import api from "../../../api/api"
import { toast } from "react-toastify"
import { useNavigate } from "react-router-dom"
function CustomerRegistration() {
  const navigate = useNavigate()
  const userData = localStorage.getItem("user")
  const user = JSON.parse(userData)
  const handleSubmit = async (customerData, tabledata) => {
    try {
      const response = await api.post(
        "/customer/customerRegistration",
        { customerData, tabledata },
        {
          withCredentials: true
        }
      )
      if (response.status === 200 || response.status === 201) {
        // Display success toast and navigate
        toast.success(response.data.message)
        if (user.role === "Admin") {
          navigate("/admin/masters/customer")
        } else if (user.role === "Staff") {
          navigate("/staff/masters/customer")
        }
      } else {
        // Handle unexpected status codes (other than 200 or 201)
        toast.error("Unexpected response from the server")
      }
    } catch (error) {
      console.error("Error creating customer:", error.message)
      toast.error("error saving customer")
    }
  }
  return (
    <div>
      <CustomerAdd process="Registration" handleCustomerData={handleSubmit} />
    </div>
  )
}

export default CustomerRegistration
