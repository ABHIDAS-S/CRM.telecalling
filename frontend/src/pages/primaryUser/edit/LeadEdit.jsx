import { useEffect, useState } from "react"
import { useLocation } from "react-router-dom"
import BarLoader from "react-spinners/BarLoader"
import Breadcrumb from "../../../components/common/Breadcrumb"
import LeadMaster from "../../common/LeadMaster"
import api from "../../../api/api"
import { toast } from "react-toastify"
import { getLocalStorageItem } from "../../../helper/localstorage"
import { PerformanceModal } from "../../../components/primaryUser/PerformanceModal"
import { StaticSidebar } from "../../../components/primaryUser/StaticSidebar"
import AdminHeader from "../../../header/AdminHeader"
import StaffHeader from "../../../header/StaffHeader"
import { useNavigate } from "react-router-dom"
import {
  Eye,
  Phone,
  Mail,
  Settings,
  MessageSquareText,
  User,
  Calendar,
  Clock,
  UserPlus,
  UserCheck,
  IndianRupee,
  BellRing,
  History,
  ChevronDown,
  ChevronRight,
  X
} from "lucide-react"
import UseFetch from "../../../hooks/useFetch"
function LeadEdit() {
  const [fetcheddata, setfetchedData] = useState([])
  console.log(fetcheddata)
  const [loader, setLoader] = useState(false)
  const navigate = useNavigate()

  const location = useLocation()
  const { leadId, isReadOnly, refreshKey, from } = location.state || {}
  console.log(from)
  console.log(location?.state)
  console.log(isReadOnly)
  console.log(location?.state)
  const nav = [
    { label: "Lead", path: "" },
    {
      label: "New Lead",
      path: ""
    }
  ]
  const Breadcrumblist = location?.state ? location?.state?.breadcrumb : nav
  console.log(Breadcrumblist)
  const userData = getLocalStorageItem("user")
  const [selectedUserName, setselecteduserName] = useState(null)
  const [selectedcompanyBranch, setselectedcompanyBranch] = useState(
    userData?.selected[0]?.branch_id
  )
  const [selectedleadbranch, setselectedleadbranch] = useState(null)
  const [activeUserId, setActiveUserId] = useState(null)
  const [selectedCategory, setselectedCategory] = useState(null)
  const [selectedDatapopup, setselectedDataPopup] = useState({})
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))
  const [periodMode, setperiodMode] = useState("all")
  const [targetData, settargetData] = useState([])
  console.log(targetData)
  const [openModal, setOpenModal] = useState(false)
  const [productlist, setproductList] = useState([])
  const [achievedproducts, setacheivedProducts] = useState([])
  const [selectedPeriod, setselectedPeriod] = useState("")

  const { data: branchProduct } = UseFetch(
    selectedcompanyBranch &&
      `/product/getallbranchProduct?branch=${selectedcompanyBranch}`
  )
  console.log(selectedcompanyBranch)
  useEffect(() => {
    if (selectedCategory) {
      console.log("jj")
      const Datas = targetData?.userWiseResults

      const filteredList = branchProduct
        .filter(
          (item) =>
            item.selected?.some(
              (selectedItem) =>
                String(selectedItem.category_id) ===
                String(selectedCategory?.Id)
            ) || String(item.category_id) === String(selectedCategory?.Id)
        )
        .map((item) => item.productName || item.serviceName)
      console.log(filteredList)
      setproductList(filteredList)
      console.log("J")
      console.log(targetData)

      console.log("hhh")

      console.log(Datas)
      console.log("hhhh")

      const filteredselectedCategory = Datas.flatMap(
        (user) => user.categories || []
      ).filter((item) => item.categoryId === selectedCategory?.Id)
      console.log(filteredselectedCategory)
      console.log("Hh")
      const summary = filteredselectedCategory.reduce(
        (acc, cur) => {
          acc.target += Number(cur.target || 0)
          acc.achieved += Number(cur.achieved || 0)
          acc.balance += Number(cur.balance || 0)
          return acc
        },
        { target: 0, achieved: 0, balance: 0 }
      )
      console.log("hhh")
      setselectedDataPopup(summary)
      console.log(filteredselectedCategory && filteredselectedCategory.length)
      if (filteredselectedCategory && filteredselectedCategory.length) {
        console.log("hh")
        console.log(filteredselectedCategory)
        setacheivedProducts((prev) => [
          ...prev,
          ...filteredselectedCategory.flatMap((item) =>
            (item?.products || []).map((product) => ({
              productname: product.name,
              amount: product.achieved
            }))
          )
        ])
      } else {
        setacheivedProducts([])
      }
    }
  }, [targetData])
  console.log(leadId)
  useEffect(() => {
    console.log("hhhh")
    if (leadId) {
      console.log(leadId)
      const fetchselectedLeadData = async () => {
        const response = await api.get(`/lead/getSelectedLead?leadId=${leadId}`)

        if (response.status >= 200 && response.status < 300) {
          console.log("hhhh")
          console.log(response.data.data)
          setselectedleadbranch(response.data.data[0].leadBranch)
          setfetchedData(response.data.data)
        }
      }
      fetchselectedLeadData()
    }
  }, [leadId, refreshKey])
  const handleMoreClick = (id, name) => {
    const Datas = targetData?.userWiseResults
    console.log(id)
    console.log(name)
    console.log("hh")
    const filteredList = branchProduct
      .filter(
        (item) =>
          item.selected?.some(
            (selectedItem) => String(selectedItem.category_id) === String(id)
          ) || String(item.category_id) === String(id)
      )
      .map((item) => item.productName || item.serviceName)
    console.log(filteredList)
    setproductList(filteredList)
    setselectedCategory({ Id: id, categoryName: name })
    console.log("J")
    console.log(targetData)
    console.log(userData?._id)

    // const filteredselectedCategory =
    //   filteredloggedUserItem[0].categories.filter(
    //     (item) => item.categoryId === id
    //   )
    const filteredselectedCategory = Datas.flatMap(
      (user) => user.categories || []
    ).filter((item) => item.categoryId === id)
    console.log("Hh")
    const summary = filteredselectedCategory.reduce(
      (acc, cur) => {
        acc.target += Number(cur.target || 0)
        acc.achieved += Number(cur.achieved || 0)
        acc.balance += Number(cur.balance || 0)
        return acc
      },
      { target: 0, achieved: 0, balance: 0 }
    )
    console.log("hhh")
    setselectedDataPopup(summary)
    console.log(filteredselectedCategory && filteredselectedCategory.length)
    if (filteredselectedCategory && filteredselectedCategory.length) {
      setacheivedProducts((prev) => [
        ...prev,
        ...filteredselectedCategory.flatMap((item) =>
          (item?.products || []).map((product) => ({
            productname: product.name,
            amount: product.achieved
          }))
        )
      ])
    } else {
      setacheivedProducts([])
    }
    setOpenModal(true)
  }
  const handleSelectedUser = (category, userId, userName) => {
    setActiveUserId(userId)
    setselecteduserName(userName)
    setselectedCategory({
      Id: category.Id,
      categoryName: category.categoryName
    })
    const filteredloggedUserItem = data?.userWiseResults.filter(
      (item) => item.userId === userId
    )
    const filteredselectedCategory =
      filteredloggedUserItem[0].categories.filter(
        (item) => item.categoryId === category.Id
      )
    const summary = filteredselectedCategory.reduce(
      (acc, cur) => {
        acc.target += Number(cur.target || 0)
        acc.achieved += Number(cur.achieved || 0)
        acc.balance += Number(cur.balance || 0)
        return acc
      },
      { target: 0, achieved: 0, balance: 0 }
    )

    setselectedDataPopup(summary)
    if (filteredselectedCategory && filteredselectedCategory.length) {
      setacheivedProducts(
        filteredselectedCategory[0]?.products?.map((product) => ({
          productname: product.name,
          amount: product.achieved
        })) || []
      )
    } else {
      setacheivedProducts([])
    }
  }
  console.log(leadId)

  const handleSubmit = async (
    data,
    leadData,
    objectId,
    from = null,
    previousLeadCustomer,
    isCustomerChanged
  ) => {
    console.log(data)
    console.log(leadData)
    console.log(from)
    console.log(isCustomerChanged)
    console.log(previousLeadCustomer)

    const newnetamount = leadData.reduce(
      (sum, item) => sum + Number(item.netAmount || 0),
      0
    )
    console.log(newnetamount)

    console.log(objectId)

    try {
      setLoader(true)
      const response = await api.put(
        `/lead/leadRegisterUpdate?docID=${objectId}&previousCustomer=${previousLeadCustomer}`,
        {
          data,
          leadData,
          from,
          previousleadCustomer: previousLeadCustomer,
          isCustomerChanged
        }
      )
      if (response.status === 200) {
        toast.success(response.data.message)
        setLoader(false)
      }
      console.log(response)
      console.log(response?.data)
      navigate(-1)
    } catch (error) {
      setLoader(false)
      toast.error("Something went wrong")
      console.error("error:", error)
    }
  }
  console.log("hhhh")
  console.log(fetcheddata)
  return (
    <div className="h-full bg-[#ADD8E6 overflow-hidden">
      <div className="flex h-full flex-row overflow-hidden">
        <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden justify-center">
          <div className="flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden  w-full justify-center  bg-[#ADD8E6]">
            <LeadMaster
              process="edit"
              handleEditData={handleSubmit}
              editloadingState={loader}
              seteditLoadingState={setLoader}
              Data={fetcheddata}
              isReadOnly={isReadOnly}
              Breadcrumblist={Breadcrumblist}
              from={from}
              selectedcompanyBranch={selectedleadbranch}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LeadEdit
