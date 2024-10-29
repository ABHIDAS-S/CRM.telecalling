import React from "react"
import { useLocation } from "react-router-dom"

import UserAdd from "../../../components/primaryUser/UserAdd"
import api from "../../../api/api"
import { toast } from "react-toastify"
import { useNavigate } from "react-router-dom"

function UserEdit() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, selected } = location.state || {}
  

  const handleSubmit = async (userData, userId, tabledata) => {
    try {
      const response = await api.post(
        "/auth/userEdit",
        { userData,userId,tabledata},
        {
          withCredentials: true
        }
      )
      if (response) {
        toast.success("User updated successfully:")
        navigate("/admin/masters/users-&-passwords")
      }
    } catch (error) {
      toast.error("Error in updating")
      console.error("Error updating branch:", error)
    }
  }
  return (
    <div>
      <UserAdd
        process={"Edit"}
        handleEditedData={handleSubmit}
        User={user}
        Selected={selected}
      />
    </div>
  )
}

export default UserEdit
