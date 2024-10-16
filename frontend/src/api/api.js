import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:9000/api",
  // baseURL: "https://www.crm.camet.in/api",
  withCredentials: true
})
export default api
