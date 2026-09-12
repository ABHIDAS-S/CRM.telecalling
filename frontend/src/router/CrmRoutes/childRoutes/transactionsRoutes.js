import LeaveApplication from "../../../components/primaryUser/LeaveApplication"
// import ComingSoon from "../../../pages/common/ComingSoon"
import CallRegistration from "../../../pages/primaryUser/register/CallRegistration"
import LeadRegister from "../../../pages/primaryUser/register/LeadRegister"
import LeadAllocationTable from "../../../pages/primaryUser/List/LeadAllocationTable"
import LeadEdit from "../../../pages/primaryUser/edit/LeadEdit"
import LeadFollowUp from "../../../pages/primaryUser/List/LeadFollowUp"
import OwnLeadList from "../../../pages/common/OwnLeadList"
import LeadTask from "../../../pages/primaryUser/List/LeadTask"
import Reallocation from "../../../pages/primaryUser/List/Reallocation"
import TaskAnalysis from "../../../pages/primaryUser/List/TaskAnalysis"
import TaskAnalysisTable from "../../../pages/primaryUser/List/TaskAnalysisTable"
import ReallocationTable from "../../../pages/primaryUser/List/ReallocationTable"
import LostLeads from "../../../pages/common/LostLeads"

import CollectionUpdate from "../../../pages/primaryUser/List/CollectionUpdate"
import LeadClosed from "../../../pages/primaryUser/edit/LeadClosed"
const transactionsRoutes = [
  { path: "/admin/transaction/lead", component: LeadRegister },
  {path:"/admin/transaction/lead/leadClosed",component:LeadClosed},
  { path: "/admin/transaction/lead/leadEdit", component: LeadEdit },

  { path: "/admin/transaction/call-registration", component: CallRegistration },
  { path: "/admin/transaction/lead/ownedLeadlist", component: OwnLeadList },

  { path: "/admin/transaction/lead/taskanalysisTable/:label", component: TaskAnalysisTable },
  { path: "/admin/transaction/lead/taskAnalysis", component: TaskAnalysis },
  { path: "/admin/transaction/leave-application", component: LeaveApplication },
  {
    path: "/admin/transaction/lead/leadAllocation",
    component: LeadAllocationTable
  },
  { path: "/admin/transaction/lead/leadTask", component: LeadTask },
  { path: "/admin/transaction/lead/leadReallocation", component: Reallocation },
  { path: "/admin/transaction/lead/reallocationTable/:label", component: ReallocationTable },

  { path: "/admin/transaction/lead/leadFollowUp", component: LeadFollowUp },
  { path: "/admin/transaction/lead/lostLeads", component: LostLeads },
  { path: "/admin/transaction/lead/collectionUpdate", component: CollectionUpdate }
]

export default transactionsRoutes
