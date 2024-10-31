import ComingSoon from "../../pages/common/ComingSoon"
import SiteVisit from "../../pages/common/SiteVisit"

const stafftasksRoutes = [
  { path: "/staff/tasks/signup-customer", component: ComingSoon },
  { path: "/staff/tasks/productMerge", component: ComingSoon },

  {
    path: "/staff/tasks/productAllocation-Pending",
    component: ComingSoon
  },
  {
    path: "/staff/tasks/leaveApproval-pending",
    component: ComingSoon
  },
  { path: "/staff/tasks/workAllocation", component: ComingSoon },
  { path: "/staff/tasks/location", component: SiteVisit }
]

export default stafftasksRoutes
