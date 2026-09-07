import React from "react"
import { useState, useEffect } from "react"
import { Routes, Route } from "react-router-dom"
//import Home from "../pages/Home"

import Login from "../pages/primaryUser/authentication/Login.jsx"
//import Register from "../pages/primaryUser/authentication/Register.jsx"
import mastersRoutes from "./CrmRoutes/childRoutes/mastersRoutes.js"
import reportsRoutes from "./CrmRoutes/childRoutes/reportsRoutes.js"
import tasksRoutes from "./CrmRoutes/childRoutes/tasksRoutes.js"
import transactionsRoutes from "./CrmRoutes/childRoutes/transactionsRoutes.js"
import dashBoardRoutes from "./CrmRoutes/dashBoardRoute.js"
// import ProductList from "../components/common/ProductList.jsx"
import { ChangePassword } from "../components/common/ChangePassword.jsx"
import stafftransactionsRoutes from "./staffRoutes/stafftransactionRoutes.js"
import CallregistrationList from "../pages/secondaryUser/List/CallregistrationList.jsx"
import stafftasksRoutes from "./staffRoutes/stafftaskRoutes.js"
import staffmastersRoutes from "./staffRoutes/staffmasterRoutes.js"
import staffreportsRoutes from "./staffRoutes/staffreportRoutes.js"
import PropTypes from "prop-types"

const Mainrouter = ({ selectedYear, selectedPeriod }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768) // Mobile view if width < 768px
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])
  const allRoutes = [
    ...mastersRoutes,
    ...reportsRoutes,
    ...tasksRoutes,
    ...transactionsRoutes,
    ...staffmastersRoutes,
    ...stafftransactionsRoutes,
    ...stafftasksRoutes,
    ...staffreportsRoutes,
    ...dashBoardRoutes
  ]
  return (
    <div className="overflow-auto h-full">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/change-password" element={<ChangePassword />} />
        {/* <Route path="/admin/productlist" element={<ProductList />} /> */}
        {/* <Route path="/admin/home" element={<CallregistrationList />} /> */}

        <Route path="/admin/home" element={<CallregistrationList />} />

        <Route path="/staff/home" element={<CallregistrationList />} />

        {allRoutes.map((route, index) => {
          const { path, component: Component, title } = route
          return (
            <Route
              key={index}
              path={path}
              element={
                <Component
                  selectedYear={selectedYear}
                  selectedPeriod={selectedPeriod}
                />
              }
              title={title}
            />
          )
        })}
      </Routes>
    </div>
  )
}

Mainrouter.propTypes = {
  selectedYear: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  selectedPeriod: PropTypes.string
}

export default Mainrouter
