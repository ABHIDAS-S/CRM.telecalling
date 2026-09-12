import ComingSoon from "../../../pages/common/ComingSoon";
import Summary from "../../../pages/primaryUser/List/Summary";
import ExpiredCustomer from "../../../pages/primaryUser/List/ExpiredCustomer";
import AccountSearch from "../../../pages/primaryUser/List/AccountSearch";
import LeaveSummary from "../../../components/primaryUser/LeaveSummary";
import ProductWiseleadReport from "../../../pages/primaryUser/List/ProductWiseleadReport";
import FollowupSummaryDashboard from "../../../pages/primaryUser/List/FollowupSummaryDashboard";
import SalesFunnel from "../../../pages/primaryUser/List/SalesFunnel";
import DailyStaffActivity from "../../../pages/primaryUser/List/DailyStaffActivity";
import MarketingDashboard from "../../../components/primaryUser/MarketingDashboard";
import IncentiveReport from "../../../components/primaryUser/IncentiveReport";
import ClosedLeads from "../../../pages/primaryUser/List/ClosedLeads";
const reportsRoutes = [
  { path: "/admin/reports/summary", component: Summary },
  { path: "/admin/reports/closed-leads", component: ClosedLeads },

  { path: "/admin/reports/expiry-register", component: ExpiredCustomer },

  { path: "/admin/reports/customer-contacts", component: ComingSoon },

  { path: "/admin/reports/account-search", component: AccountSearch },

  { path: "/admin/reports/leave-summary", component: LeaveSummary },
  { path: "/admin/reports/markettingdashboard", component: MarketingDashboard },
  {
    path: "/admin/reports/product-wise-report",
    component: ProductWiseleadReport,
  },
  {
    path: "/admin/reports/follow-up-summary",
    component: FollowupSummaryDashboard,
  },
  { path: "/admin/reports/sales-funel", component: SalesFunnel },
  { path: "/admin/reports/dailystaffactivity", component: DailyStaffActivity },
  { path: "/admin/reports/incentiveReport", component: IncentiveReport }

];

export default reportsRoutes;
