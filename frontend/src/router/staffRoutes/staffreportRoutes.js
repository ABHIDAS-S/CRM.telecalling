import ComingSoon from "../../pages/common/ComingSoon"
import Summary from "../../pages/primaryUser/List/Summary"
import ExpiredCustomer from "../../pages/primaryUser/List/ExpiredCustomer"
import AccountSearch from "../../pages/primaryUser/List/AccountSearch"
import leaveSummary from "../../components/primaryUser/LeaveSummary"
import MarketingDashboard from "../../components/primaryUser/MarketingDashboard"
import ProductWiseleadReport from "../../pages/primaryUser/List/ProductWiseleadReport"
import FollowupSummaryDashboard from "../../pages/primaryUser/List/FollowupSummaryDashboard"
import SalesFunnel from "../../pages/primaryUser/List/SalesFunnel"
import DailyStaffActivity from "../../pages/primaryUser/List/DailyStaffActivity"
import IncentiveReport from "../../components/primaryUser/IncentiveReport"
const staffreportsRoutes = [
  { path: "/staff/reports/summary", component: Summary },
  { path: "/staff/reports/expiry-register", component: ExpiredCustomer },

  { path: "/staff/reports/customer-contact", component: ComingSoon },

  { path: "/staff/reports/account-search", component: AccountSearch },
  { path: "/staff/reports/leave-summary", component: leaveSummary },
 { path: "/staff/reports/markettingdashboard", component: MarketingDashboard },
 {
    path: "/staff/reports/product-wise-report",
    component: ProductWiseleadReport,
  },
  {
    path: "/staff/reports/follow-up-summary",
    component: FollowupSummaryDashboard,
  },
  { path: "/staff/reports/sales-funel", component: SalesFunnel },
  { path: "/staff/reports/dailystaffactivity", component: DailyStaffActivity },
  { path: "/staff/reports/incentiveReport", component: IncentiveReport }
]

export default staffreportsRoutes
