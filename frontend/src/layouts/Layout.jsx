import React from "react"
import { useEffect, useRef, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { useLocation, matchPath } from "react-router-dom"
import { toast } from "react-toastify"
import AdminHeader from "../header/AdminHeader"
import StaffHeader from "../header/StaffHeader"
import { updateUser } from "../../slices/authSlice"
import ChangePasswordModal from "../components/common/ChangePasswordModal"
import { StaticSidebar } from "../components/primaryUser/StaticSidebar"
import { NotificationPopup } from "../components/primaryUser/NotificationPopup"
import GlobalUnsavedChangesModal from "../components/common/GlobalUnsavedChangesModal"
import AvatarEditor from "../components/common/AvatarEditor"
import Mainrouter from "../router/Mainrouter"
import { PerformanceModal } from "../components/primaryUser/PerformanceModal"
import useAutoLogout from "../hooks/useAutoLogout"
import UseFetch from "../hooks/useFetch"
import api from "../api/api"
import {
  getLocalStorageItem,
  setLocalStorageItem
} from "../helper/localstorage"
import useIdleLogout from "../components/common/useIdleLogout"
const Layout = () => {
  useIdleLogout()
  const location = useLocation()
  const dispatch = useDispatch()
  const headerRef = useRef(null)
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(
    String(now.getMonth() + 1).padStart(2, "0")
  )
  console.log(selectedMonth)
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))
  console.log(selectedMonth)
  const [categorylist, setcategorylist] = useState([])
  const [achievedproducts, setacheivedProducts] = useState([])
  console.log(achievedproducts)
  const [selectedDatapopup, setselectedDataPopup] = useState({})
  const [periodMode, setperiodMode] = useState("all")
  console.log(periodMode)
  const [selectedPeriod, setselectedPeriod] = useState("")
  const [headerHeight, setHeaderHeight] = useState(0)
  const [notificationPopup, setNotificationPopup] = useState(false)
  // const [loggedUser, setLoggedUser] = useState(null)
  // console.log(loggedUser)
  const [productlist, setproductList] = useState([])
  console.log(productlist)
  const [selectedCategory, setselectedCategory] = useState(null)
  console.log(selectedCategory)
  const [changepasswordOpen, setchangepasswordOpen] = useState(false)
  const [performanceModalOpen, setperformanceModalOpen] = useState(false)
  const [categoryId, setcategoryId] = useState(null)
  console.log(categoryId)
  console.log(selectedCategory)
  console.log(performanceModalOpen)
  const isAuthPage = location.pathname === "/"
  const [targetData, setTargetData] = useState([])
  console.log(targetData)
  const [avatarOpen, setAvatarOpen] = useState(false)
  useAutoLogout(!isAuthPage)

  const isAdmin = location.pathname.startsWith("/admin")
  const isStaff = location.pathname.startsWith("/staff")

  const selectedBranch = useSelector(
    (state) => state.companyBranch.selectedBranch
  )
  console.log(selectedBranch)
  const loggedUser = useSelector((state) => state.auth.user)
  console.log(loggedUser)
  const hideHeaderRoutes = [
    "/staff/home",
    "/admin/home",
    "/staff/reports/markettingdashboard",
    "/admin/reports/markettingdashboard",
    "/staff/transaction/lead/ownedLeadlist",
    "/admin/transaction/lead/ownedLeadlist",
    "/staff/transaction/lead/leadAllocation",
    "/admin/transaction/lead/leadAllocation",
    "/staff/transaction/lead/leadFollowUp",
    "/admin/transaction/lead/leadFollowUp",
    "/admin//reports/incentiveReport",
    "/staff/transaction/lead/leadTask",
    "/admin/transaction/lead/leadTask",
    "/staff/transaction/lead/leadReallocation",
    "/admin/transaction/lead/leadReallocation",
    "/staff/transaction/lead/reallocationTable/*",
    "/admin/transaction/lead/reallocationTable/*",
    "/staff/transaction/lead/taskAnalysis",
    "/admin/transaction/lead/taskAnalysis",
    "/staff/transaction/lead/taskanalysisTable/*",
    "/admin/transaction/lead/taskanalysisTable/*",
    "/staff/transaction/lead/collectionUpdate",
    "/admin/transaction/lead/collectionUpdate",
    "/staff/transaction/lead/lostLeads",
    "/admin/transaction/lead/lostLeads",
    "/admin/reports/closed-leads",
    "/staff/reports/summary",
    "/admin/reports/summary",
    "/staff/reports/expiry-register",
    "/admin/reports/expiry-register",
    "/staff/reports/leave-summary",
    "/admin/reports/leave-summary",
    "/staff/reports/product-wise-report",
    "/admin/reports/product-wise-report",
    "/staff/reports/follow-up-summary",
    "/admin/reports/follow-up-summary",
    "/staff/reports/sales-funel",
    "/admin/reports/sales-funel",
    "/staff/reports/dailystaffactivity",
    "/admin/reports/dailystaffactivity",
    "/staff/transaction/call-registration",
    "/admin/transaction/call-registration",
    "/staff/transaction/leave-application",
    "/admin/transaction/leave-application",
    "/staff/reports/account-search",
    "/staff/transaction/lead/closed-leads",
    "/admin/reports/account-search",
    "/staff/transaction/lead",
    "/admin/transaction/lead",
    "/staff/support&department",
    "/admin/support&department",
    "/staff/transaction/lead/leadEdit",
    "/admin/transaction/lead/leadEdit",
    "/admin/transaction/lead/leadClosed",
    "/staff/transaction/lead/leadClosed",
    "staff/transaction/lead/verifiedCollections"
  ]

  const shouldshowSidebar = hideHeaderRoutes.some((route) =>
    matchPath({ path: route, end: true }, location.pathname)
  )
  console.log(shouldshowSidebar)
  //   useEffect(() => {
  // const a=localStorage.getItem("user")
  // console.log(a)
  // const c=getLocalStorageItem("user")
  // console.log(c)
  //     setLoggedUser(getLocalStorageItem("user"))
  //   }, [])

  const { data: notificationData } = UseFetch(
    loggedUser &&
      selectedBranch &&
      `/lead/getnotificationData?loggedUser=${loggedUser._id}&branchSelected=${selectedBranch}`
  )
  console.log(notificationData)

  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight)
    }
  }, [location.pathname])

  if (isAuthPage) {
    return <Mainrouter />
  }
  console.log(loggedUser)
  const handleAvatarUploaded = async (url) => {
    try {
      const updateurl = await api.post(
        `/auth/uploadimage?userId=${loggedUser?._id}`,
        { url }
      )

      if (updateurl.status === 200) {
        toast.success("Profile updated successfully")
        //         setLoggedUser((prev) => {
        //           const updated = { ...(prev || {}), profileUrl: url }
        //           // setLocalStorageItem("user", JSON.stringify(updated))
        // setLocalStorageItem("user", updated)   // ✅ no JSON.stringify here
        //           return updated
        //         })
        const updated = { ...(loggedUser || {}), profileUrl: url }
        dispatch(updateUser(updated)) // ✅ updates Redux state AND localStorage together
      }
    } catch (error) {
      console.log("error", error)
      toast.error("Profile not uploaded")
    }
  }
  return (
    <>
      <div className="h-screen flex overflow-hidden">
        {/* Sidebar */}
        {shouldshowSidebar && (
          <StaticSidebar
            onpasswordClick={() => setchangepasswordOpen(true)}
            onperformanceModalClick={() => setperformanceModalOpen(true)}
            onavataropenClick={() => setAvatarOpen(true)}
            setTargetData={setTargetData}
            targetData={targetData}
            selectedMonths={selectedMonth}
            yearSelected={selectedYear}
            onYearChange={setSelectedYear}
            setselectedCategory={setselectedCategory}
            selectedCategory={selectedCategory}
            setproductList={setproductList}
            setcategoryId={setcategoryId}
            parentperiodmode={periodMode}
            onselectedPeriodChange={(val, val2) => {
              setSelectedMonth(val2)
              setselectedPeriod(val)
            }}
            setacheivedProducts={setacheivedProducts}
            achievedproducts={achievedproducts}
          />
        )}

        {/* Right Side */}

        <div className="flex flex-col flex-1 overflow-hidden">
          <div ref={headerRef} className="flex-shrink-0 z-50">
            {isAdmin && (
              <AdminHeader
                sidebarHasProfile={shouldshowSidebar}
                onNotificationClick={() => setNotificationPopup(true)}
                onpasswordClick={() => setchangepasswordOpen(true)}
              />
            )}

            {isStaff && (
              <StaffHeader
                sidebarHasProfile={shouldshowSidebar}
                onNotificationClick={() => setNotificationPopup(true)}
                onpasswordClick={() => setchangepasswordOpen(true)}
              />
            )}
          </div>
          {/* <Header /> */}

          <main className="flex-1 overflow-auto">
            <Mainrouter
              selectedYear={selectedYear}
              selectedPeriod={selectedPeriod}
            />
          </main>
        </div>
      </div>
      <NotificationPopup
        open={notificationPopup}
        onClose={() => setNotificationPopup(false)}
        notificationData={notificationData}
      />
      <PerformanceModal
        open={performanceModalOpen}
        onClose={() => {
          setperformanceModalOpen(false)
          setselectedCategory(null)
          setproductList([])
          setacheivedProducts([])
        }}
        targetData={targetData}
        onselectedPeriodChange={(val, val2) => {
          setSelectedMonth(val2)
          setselectedPeriod(val)
        }}
        setproductList={setproductList}
        productlist={productlist}
        products={achievedproducts}
        category={selectedCategory}
        loggedUser={loggedUser}
        categoryId={categoryId}
        onMonthChange={(val) => {
          setcategorylist([])
          setacheivedProducts([])
          setselectedDataPopup([])
          setperiodMode(val)
        }}
        onYearChange={(val) => {
          setcategorylist([])
          setacheivedProducts([])
          setselectedDataPopup([])
          console.log(val)
          setSelectedYear(val)
        }}
        periodmode={periodMode}
        yearSelected={selectedYear}
      />

      <ChangePasswordModal
        open={changepasswordOpen}
        onClose={() => setchangepasswordOpen(false)}
      />
      <AvatarEditor
        open={avatarOpen}
        onClose={() => setAvatarOpen(false)}
        onUploaded={handleAvatarUploaded}
      />

      <GlobalUnsavedChangesModal />
    </>
  )
}

export default Layout
