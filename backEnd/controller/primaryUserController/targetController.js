import mongoose from "mongoose";
import { TargetAchievement, Allocation, User, TargetCategory, TargetConfiguration } from "../../model/primaryUser/targetSchema.js";
import { Category } from "../../model/primaryUser/productSubDetailsSchema.js";
import Task from "../../model/primaryUser/taskSchema.js";
import LeadMaster from "../../model/primaryUser/leadmasterSchema.js";
import models from "../../model/auth/authSchema.js";
const { Staff, Admin } = models
import Product from "../../model/primaryUser/productSchema.js";
import Service from "../../model/primaryUser/servicesSchema.js";
import Branch from "../../model/primaryUser/branchSchema.js";
import Customer from "../../model/secondaryUser/customerSchema.js";
import { ObjectId } from "bson";



// export const gettargetResult = async (req, res) => {
//   try {
//     const { month, year, periodMode = "all", selectedBranch } = req.query;

//     const monthNumber = Number(month);
//     const yearNumber = Number(year);

//     const mode = String(periodMode).trim().toLowerCase();

//     if (
//       !Number.isInteger(monthNumber) ||
//       monthNumber < 1 ||
//       monthNumber > 12 ||
//       !Number.isInteger(yearNumber) ||
//       !selectedBranch
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid month, year and selectedBranch are required",
//       });
//     }

//     const objects = (value) => {
//       if (!Array.isArray(value)) return [];

//       return value.filter(
//         (item) =>
//           item !== null &&
//           item !== undefined &&
//           typeof item === "object" &&
//           !Array.isArray(item)
//       );
//     };

//     const num = (value) => Number(value) || 0;

//     const getMonthKey = (yearValue, monthValue) => {
//       return `${yearValue}-${monthValue}`;
//     };

//     const getMonthRange = (yearValue, startMonth, endMonth) => {
//       return {
//         $gte: new Date(Date.UTC(yearValue, startMonth - 1, 1)),
//         $lte: new Date(
//           Date.UTC(yearValue, endMonth, 0, 23, 59, 59, 999)
//         ),
//       };
//     };

//     const [allTargetConfigs, closingTask] = await Promise.all([
//       TargetConfiguration.find({
//         branch: selectedBranch,
//       })
//         .select(`
//           periodName branch startDate endDate categoryId categoryName
//           measurementType allocationValues monthlyTargets
//         `)
//         .populate("categoryId", "category")
//         .populate("monthlyTargets.userTargets.userId", "name email")
//         .lean(),

//       Task.findOne({
//         taskName: "Follow-Up Closing",
//       })
//         .select("_id")
//         .lean(),
//     ]);

//     const allPeriods = [
//       ...new Set(
//         allTargetConfigs
//           .map((item) => String(item.periodName || "").trim())
//           .filter(Boolean)
//       ),
//     ];

//     const selectedMonth =
//       mode === "all" ? monthNumber : Number(mode);

//     if (
//       !Number.isInteger(selectedMonth) ||
//       selectedMonth < 1 ||
//       selectedMonth > 12
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "periodMode must be all or a valid month number",
//       });
//     }

//     const hasSelectedMonth = (config) => {
//       return objects(config.monthlyTargets).some(
//         (monthlyTarget) =>
//           num(monthlyTarget.month) === selectedMonth &&
//           num(monthlyTarget.year) === yearNumber
//       );
//     };

//     const requestedStart = new Date(
//       Date.UTC(yearNumber, selectedMonth - 1, 1)
//     );

//     const requestedEnd = new Date(
//       Date.UTC(yearNumber, selectedMonth, 0, 23, 59, 59, 999)
//     );

//     const targetConfigs = allTargetConfigs.filter((config) => {
//       const configStart = new Date(config.startDate);
//       const configEnd = new Date(config.endDate);

//       const overlapsRequestedMonth =
//         configStart <= requestedEnd && configEnd >= requestedStart;

//       return overlapsRequestedMonth && hasSelectedMonth(config);
//     });

//     if (!targetConfigs.length) {
//       return res.json({
//         success: true,
//         data: {
//           userWiseResults: [],
//           summary: {
//             target: 0,
//             achieved: 0,
//             balance: 0,
//             incentive: 0,
//           },
//           periods: allPeriods,
//           measurementTypes: [],
//           selectedMeasurementType: "",
//           selectedPeriodName: "",
//           selectedMonth,
//           selectedYear: yearNumber,
//         },
//       });
//     }

//     const activeMonths = [
//       ...new Set(
//         targetConfigs.flatMap((config) =>
//           objects(config.monthlyTargets)
//             .filter(
//               (monthlyTarget) =>
//                 num(monthlyTarget.year) === yearNumber
//             )
//             .map((monthlyTarget) => num(monthlyTarget.month))
//         )
//       ),
//     ].filter(Boolean);

//     const startMonth = Math.min(...activeMonths);
//     const endMonth = Math.max(...activeMonths);

//     const leads = await LeadMaster.find({
//       leadBranch: selectedBranch,
//       leadDate: getMonthRange(yearNumber, startMonth, endMonth),
//     })
//       .select(`
//         leadId leadDate netAmount balanceAmount forcefullyClosedTarget
//         leadFor paymentHistory activityLog
//       `)
//       .lean();

//     const closingTaskId = String(closingTask?._id || "");


//     const productIds = new Set();
//     const serviceIds = new Set();

// const staffIds = new Set();
// const adminIds = new Set();

//     for (const lead of leads) {
//       const leadItems = objects(lead.leadFor);

//       const paymentEntries = objects(lead.paymentHistory).flatMap(
//         (payment) => objects(payment.paymentEntries)
//       );

//       const allItems = [...leadItems, ...paymentEntries];

//       for (const item of allItems) {
//         if (!item?.productorServiceId) continue;

//         if (item.productorServicemodel === "Product") {
//           productIds.add(String(item.productorServiceId));
//         }

//         if (item.productorServicemodel === "Service") {
//           serviceIds.add(String(item.productorServiceId));
//         }
//       }




//   /*
//     Collect every user who submitted an activity.

//     These users can receive incentive even when they
//     are not configured in monthlyTargets.userTargets.
//   */
//   for (const activity of objects(lead.activityLog)) {
//     if (!activity?.submittedUser) continue;

//     if (activity.submissiondoneByModel === "Admin") {
//       adminIds.add(
//         String(activity.submittedUser)
//       );
//     } else {
//       staffIds.add(
//         String(activity.submittedUser)
//       );
//     }
//   }
//     }

//     const [products, services,staffs,admins] = await Promise.all([
//       Product.find({
//         _id: { $in: [...productIds] },
//       })
//         .select("productName name selected.category_id")
//         .lean(),

//       Service.find({
//         _id: { $in: [...serviceIds] },
//       })
//         .select(`
//           serviceName name selected.category_id
//           category_id categoryId
//         `)
//         .lean(),
//    Staff.find({
//       _id: { $in: [...staffIds] },
//     })
//       .select("name designation")
//       .lean(),

//     Admin.find({
//       _id: { $in: [...adminIds] },
//     })
//       .select("name designation")
//       .lean(),
//     ]);

//     const productMap = new Map(
//       products.map((product) => {
//         const categoryId = product?.selected?.[0]?.category_id
//           ? String(product.selected[0].category_id)
//           : "";

//         return [
//           String(product._id),
//           {
//             name: product.productName || product.name || "Product",
//             categoryId,
//           },
//         ];
//       })
//     );

//     const serviceMap = new Map(
//       services.map((service) => {
//         const categoryId = service?.selected?.[0]?.category_id
//           ? String(service.selected[0].category_id)
//           : service?.category_id
//             ? String(service.category_id)
//             : service?.categoryId
//               ? String(service.categoryId)
//               : "";

//         return [
//           String(service._id),
//           {
//             name: service.serviceName || service.name || "Service",
//             categoryId,
//           },
//         ];
//       })
//     );

// const staffMap = new Map(
//   staffs.map((staff) => [
//     String(staff._id),
//     staff,
//   ])
// );

// const adminMap = new Map(
//   admins.map((admin) => [
//     String(admin._id),
//     admin,
//   ])
// );

// const resolveUser = (userId, userModel) => {
//   if (!userId) return null;

//   const id = String(userId);

//   if (
//     userModel === "Admin" &&
//     adminMap.has(id)
//   ) {
//     return {
//       ...adminMap.get(id),
//       model: "Admin",
//     };
//   }

//   if (
//     userModel === "Staff" &&
//     staffMap.has(id)
//   ) {
//     return {
//       ...staffMap.get(id),
//       model: "Staff",
//     };
//   }

//   // Handles legacy logs with missing/wrong model.
//   if (staffMap.has(id)) {
//     return {
//       ...staffMap.get(id),
//       model: "Staff",
//     };
//   }

//   if (adminMap.has(id)) {
//     return {
//       ...adminMap.get(id),
//       model: "Admin",
//     };
//   }

//   return null;
// };




//     const getItemMeta = (item) => {
//       if (!item?.productorServiceId) return null;

//       const itemId = String(item.productorServiceId);

//       if (item.productorServicemodel === "Product") {
//         return productMap.get(itemId) || null;
//       }

//       if (item.productorServicemodel === "Service") {
//         return serviceMap.get(itemId) || null;
//       }

//       return null;
//     };

//     const getLeadCategoryItems = (lead, configCategoryId) => {
//       const entries = [];

//       for (const item of objects(lead.leadFor)) {
//         const meta = getItemMeta(item);

//         if (!meta?.categoryId) continue;

//         if (String(meta.categoryId) !== String(configCategoryId)) {
//           continue;
//         }

//         entries.push({
//           id: String(item.productorServiceId),
//           model: item.productorServicemodel,
//           name: meta.name,
//         });
//       }

//       return entries;
//     };

//     const getVerifiedAmountForCategory = (lead, configCategoryId) => {
//       let total = 0;

//       for (const payment of objects(lead.paymentHistory)) {
//         if (payment.paymentVerified !== true) continue;

//         for (const entry of objects(payment.paymentEntries)) {
//           const meta = getItemMeta(entry);

//           if (!meta?.categoryId) continue;

//           if (String(meta.categoryId) !== String(configCategoryId)) {
//             continue;
//           }

//           total += num(entry.receivedAmount);
//         }
//       }

//       return total;
//     };

//     const isLeadFullyVerified = (lead) => {
//       const payments = objects(lead.paymentHistory);

//       return (
//         payments.length > 0 &&
//         payments.every(
//           (payment) => payment.paymentVerified === true
//         )
//       );
//     };

//     // const isLeadEligibleForIncentive = (lead) => {
//     //   return (
//     //     lead.forcefullyClosedTarget === true ||
//     //     num(lead.balanceAmount) === 0 ||
//     //     isLeadFullyVerified(lead)
//     //   );
//     // };
//     // const isLeadEligibleForIncentive = (lead) => {
//     //   const netAmount = Number(lead.netAmount || 0);

//     //   const hasValidBillAmount = netAmount > 0;

//     //   const hasZeroBalance =
//     //     lead.balanceAmount !== null &&
//     //     lead.balanceAmount !== undefined &&
//     //     lead.balanceAmount !== "" &&
//     //     Number(lead.balanceAmount) === 0;

//     //   const isFullyPaid = hasValidBillAmount && hasZeroBalance;

//     //   const isForcefullyClosedWithAmount =
//     //     lead.forcefullyClosedTarget === true &&
//     //     hasValidBillAmount;

//     //   const isFullyVerifiedWithAmount =
//     //     hasValidBillAmount &&
//     //     isLeadFullyVerified(lead);

//     //   return (
//     //     isForcefullyClosedWithAmount ||
//     //     isFullyPaid ||
//     //     isFullyVerifiedWithAmount
//     //   );
//     // };
//     const isLeadEligibleForIncentive = (lead) => {
//       const netAmount = Number(lead.netAmount || 0);
//       const totalPaidAmount = Number(lead.totalPaidAmount || 0);

//       // Main protection:
//       // zero-value leads never count as achievement.
//       if (netAmount <= 0) {
//         return false;
//       }

//       const hasZeroBalance =
//         lead.balanceAmount !== null &&
//         lead.balanceAmount !== undefined &&
//         lead.balanceAmount !== "" &&
//         Number(lead.balanceAmount) === 0;

//       const isFullyPaid =
//         hasZeroBalance &&
//         totalPaidAmount >= netAmount;

//       const isForcefullyClosed =
//         lead.forcefullyClosedTarget === true;

//       const isFullyVerified =
//         isLeadFullyVerified(lead);

//       return (
//         isFullyPaid ||
//         isForcefullyClosed ||
//         isFullyVerified
//       );
//     };

//     const getLatestClosingUserId = (lead) => {
//       const closingLogs = objects(lead.activityLog).filter(
//         (log) =>
//           String(log.taskBy || "") === closingTaskId &&
//           log.followupClosed === true &&
//           log.submittedUser
//       );

//       const latestClosingLog = closingLogs.at(-1);

//       return latestClosingLog?.submittedUser
//         ? String(latestClosingLog.submittedUser)
//         : null;
//     };

//     const leadsByMonth = new Map();

//     for (const lead of leads) {
//       const date = new Date(lead.leadDate);

//       if (Number.isNaN(date.getTime())) continue;

//       const leadMonth = date.getUTCMonth() + 1;
//       const leadYear = date.getUTCFullYear();

//       const monthKey = getMonthKey(leadYear, leadMonth);

//       if (!leadsByMonth.has(monthKey)) {
//         leadsByMonth.set(monthKey, []);
//       }

//       leadsByMonth.get(monthKey).push(lead);
//     }

//     const userWiseMap = new Map();

// //     const ensureUser = (userId, userName = "Unknown User") => {
// // // console.log("uddddddddddddddd",userName)
// //       const id = String(userId);

// //       if (!userWiseMap.has(id)) {
// //         userWiseMap.set(id, {
// //           userId: id,
// //           userName,
// //           target: 0,
// //           achieved: 0,
// //           balance: 0,
// //           incentive: 0,
// //           categories: [],
// //         });
// //       }

// //       return userWiseMap.get(id);
// //     };



// const ensureUser = (
//   userId,
//   suppliedName = null,
//   userModel = null
// ) => {
//   const id = String(userId);

//   const resolvedUser = resolveUser(
//     id,
//     userModel
//   );

//   const resolvedName =
//     suppliedName ||
//     resolvedUser?.name ||
//     `Unknown User (${id})`;

//   const resolvedDesignation =
//     resolvedUser?.designation ||
//     resolvedUser?.model ||
//     userModel ||
//     "Unknown";

//   const existingUser = userWiseMap.get(id);

//   if (existingUser) {
//     const existingName = String(
//       existingUser.userName || ""
//     );

//     const wasUnknown =
//       existingName.toLowerCase().startsWith(
//         "unknown user"
//       ) ||
//       existingName === "un";

//     const hasRealName =
//       !resolvedName.toLowerCase().startsWith(
//         "unknown user"
//       );

//     if (wasUnknown && hasRealName) {
//       existingUser.userName = resolvedName;
//       existingUser.designation =
//         resolvedDesignation;
//     }

//     return existingUser;
//   }

//   const user = {
//     userId: id,
//     userName: resolvedName,
//     designation: resolvedDesignation,
//     target: 0,
//     achieved: 0,
//     balance: 0,
//     incentive: 0,
//     categories: [],
//   };

//   userWiseMap.set(id, user);

//   return user;
// };
//     // Prevents duplicate incentive for the same:
//     // configuration + lead + task + user.
//     const awardedIncentives = new Set();

//     for (const config of targetConfigs) {
//       const configCategoryId = String(
//         config.categoryId?._id || config.categoryId || ""
//       );

//       if (!configCategoryId) continue;

//       const categoryName =
//         config.categoryId?.category ||
//         config.categoryName ||
//         "Category";

//       const monthlyTargets = objects(config.monthlyTargets).filter(
//         (monthlyTarget) =>
//           num(monthlyTarget.year) === yearNumber &&
//           activeMonths.includes(num(monthlyTarget.month))
//       );

//       for (const monthlyTarget of monthlyTargets) {
//         const targetMonth = num(monthlyTarget.month);

//         const currentMonthLeads =
//           leadsByMonth.get(
//             getMonthKey(yearNumber, targetMonth)
//           ) || [];

//         /*
//           TARGET + ACHIEVEMENT:
//           Only target-configured users are included here.
//         */
//         for (const userTarget of objects(monthlyTarget.userTargets)) {
//           const userId = String(
//             userTarget.userId?._id || userTarget.userId || ""
//           );

//           if (!userId) continue;

//           const userName =
//             userTarget.userId?.name || "un"

//           const slabs = objects(userTarget.slabs);

//           const target = slabs.reduce((highest, slab) => {
//             return Math.max(highest, num(slab.toValue));
//           }, 0);

//           const user = ensureUser(userId, userName,"Staff");

//           user.target += target;

//           let achieved = 0;
//           const productWiseMap = new Map();

//           for (const lead of currentMonthLeads) {
//             const closingUserId = getLatestClosingUserId(lead);

//             if (closingUserId !== userId) continue;

//             const categoryItems = getLeadCategoryItems(
//               lead,
//               configCategoryId
//             );

//             if (!categoryItems.length) continue;

//             let leadAchievement = 0;

//             if (config.measurementType === "amount") {
//               leadAchievement =
//                 lead.forcefullyClosedTarget === true
//                   ? num(lead.netAmount)
//                   : getVerifiedAmountForCategory(
//                     lead,
//                     configCategoryId
//                   );
//             } else {
//               leadAchievement = isLeadEligibleForIncentive(lead)
//                 ? 1
//                 : 0;
//             }

//             if (leadAchievement <= 0) continue;

//             achieved += leadAchievement;

//             const itemCount = categoryItems.length || 1;

//             for (const item of categoryItems) {
//               const productKey = `${item.model}-${item.id}`;

//               if (!productWiseMap.has(productKey)) {
//                 productWiseMap.set(productKey, {
//                   id: item.id,
//                   model: item.model,
//                   name: item.name,
//                   achieved: 0,
//                   incentive: 0,
//                 });
//               }

//               const product = productWiseMap.get(productKey);

//               product.achieved +=
//                 config.measurementType === "amount"
//                   ? leadAchievement / itemCount
//                   : 1;
//             }
//           }

//           user.achieved += achieved;

//           user.categories.push({
//             categoryId: configCategoryId,
//             categoryName,
//             periodName: config.periodName || "",
//             month: targetMonth,
//             year: yearNumber,
//             measurementType: config.measurementType,
//             target,
//             slabs,
//             achieved,
//             balance: target - achieved,
//             incentive: 0,
//             products: [...productWiseMap.values()],
//           });
//         }

//         /*
//           INCENTIVE:
//           Any user can receive it. The user does NOT need
//           to exist in monthlyTargets.userTargets.

//           Required TargetConfiguration structure:

//           allocationValues: [
//             {
//               allocationId: taskObjectId,
//               value: 100,
//               incentiveType: "fixed"
//             },
//             {
//               allocationId: anotherTaskObjectId,
//               value: 5,
//               incentiveType: "percentage"
//             }
//           ]
//         */
//         for (const lead of currentMonthLeads) {
//           const categoryItems = getLeadCategoryItems(
//             lead,
//             configCategoryId
//           );

//           if (!categoryItems.length) continue;

//           if (!isLeadEligibleForIncentive(lead)) continue;

//           const percentageBaseAmount =
//             lead.forcefullyClosedTarget === true
//               ? num(lead.netAmount)
//               : getVerifiedAmountForCategory(
//                 lead,
//                 configCategoryId
//               );

//           // for (const activity of objects(lead.activityLog)) {
//           //   const completed =
//           //     activity.taskClosed === true ||
//           //     activity.followupClosed === true ||
//           //     activity.allocatedClosed === true;

//           //   if (!completed) continue;

//           //   const userId = String(
//           //     activity.submittedUser || ""
//           //   );

//           //   if (!userId) continue;

//           //   const taskById = String(activity.taskBy || "");
//           //   const taskId = String(activity.taskId || "");

//           //   const allocationRule = objects(
//           //     config.allocationValues
//           //   ).find((allocation) => {
//           //     const allocationId = String(
//           //       allocation.allocationId || ""
//           //     );

//           //     return (
//           //       allocationId === taskById ||
//           //       allocationId === taskId
//           //     );
//           //   });

//           //   if (!allocationRule) continue;

//           //   const rewardValue = num(allocationRule.value);

//           //   if (rewardValue <= 0) continue;

//           //   const incentiveType = String(
//           //     allocationRule.incentiveType || "fixed"
//           //   )
//           //     .toLowerCase()
//           //     .trim();

//           //   let incentive = 0;

//           //   if (incentiveType === "percentage") {
//           //     if (percentageBaseAmount <= 0) continue;

//           //     incentive =
//           //       (rewardValue / 100) * percentageBaseAmount;
//           //   } else {
//           //     incentive = rewardValue;
//           //   }

//           //   if (incentive <= 0) continue;

//           //   const rewardTaskId = String(
//           //     allocationRule.allocationId || taskById || taskId
//           //   );

//           //   const rewardKey = [
//           //     String(config._id),
//           //     String(lead._id),
//           //     userId,
//           //     rewardTaskId,
//           //   ].join("-");

//           //   if (awardedIncentives.has(rewardKey)) {
//           //     continue;
//           //   }

//           //   awardedIncentives.add(rewardKey);

//           //   const user = ensureUser(userId);

//           //   user.incentive += incentive;

//           //   user.categories.push({
//           //     categoryId: configCategoryId,
//           //     categoryName,
//           //     periodName: config.periodName || "",
//           //     month: targetMonth,
//           //     year: yearNumber,
//           //     measurementType: "incentive",
//           //     target: 0,
//           //     slabs: [],
//           //     achieved: 0,
//           //     balance: 0,
//           //     incentive,
//           //     products: [],
//           //   });
//           // }//old code


//           // for (const activity of objects(lead.activityLog)) {
//           //   const userId = String(activity.submittedUser || "");

//           //   if (!userId) continue;

//           //   const taskById = String(activity.taskBy || "");
//           //   const taskId = String(activity.taskId || "");

//           //   // First: check whether this activity task exists
//           //   // in TargetConfiguration allocationValues.
//           //   const allocationRule = objects(
//           //     config.allocationValues
//           //   ).find((allocation) => {
//           //     const allocationId = String(
//           //       allocation.allocationId || ""
//           //     );

//           //     return (
//           //       allocationId === taskById ||
//           //       allocationId === taskId
//           //     );
//           //   });

//           //   // No configured incentive rule for this task.
//           //   if (!allocationRule) continue;

//           //   const completed =
//           //     activity.taskClosed === true ||
//           //     activity.followupClosed === true ||
//           //     activity.allocatedClosed === true;

//           //   /*
//           //     Default: task must be completed.

//           //     For Lead By / first lead activity, set:
//           //     requiresCompletion: false

//           //     in the Target Configuration allocationValues item.
//           //   */
//           //   const requiresCompletion =
//           //     allocationRule.requiresCompletion !== false;

//           //   if (requiresCompletion && !completed) {
//           //     continue;
//           //   }

//           //   const rewardValue = num(allocationRule.value);

//           //   if (rewardValue <= 0) continue;

//           //   /*
//           //     Your DB currently has `mode: "amount"`.

//           //     amount/fixed = exact incentive amount
//           //     percentage/percent = percentage of eligible lead amount
//           //   */
//           //   const rewardMode = String(
//           //     allocationRule.incentiveType ||
//           //     allocationRule.mode ||
//           //     "amount"
//           //   )
//           //     .toLowerCase()
//           //     .trim();

//           //   const isPercentage =
//           //     rewardMode === "percentage" ||
//           //     rewardMode === "percent";

//           //   let incentive = 0;

//           //   if (isPercentage) {
//           //     if (percentageBaseAmount <= 0) continue;

//           //     incentive =
//           //       (rewardValue / 100) * percentageBaseAmount;
//           //   } else {
//           //     // mode: "amount" gives a fixed amount.
//           //     incentive = rewardValue;
//           //   }

//           //   if (incentive <= 0) continue;

//           //   const rewardTaskId = String(
//           //     allocationRule.allocationId || taskById || taskId
//           //   );

//           //   const rewardKey = [
//           //     String(config._id),
//           //     String(lead._id),
//           //     userId,
//           //     rewardTaskId,
//           //   ].join("-");

//           //   // One user gets one reward for one configured task in one lead.
//           //   if (awardedIncentives.has(rewardKey)) {
//           //     continue;
//           //   }

//           //   awardedIncentives.add(rewardKey);

//           //   const user = ensureUser(userId);

//           //   user.incentive += incentive;

//           //   user.categories.push({
//           //     categoryId: configCategoryId,
//           //     categoryName,
//           //     periodName: config.periodName || "",
//           //     month: targetMonth,
//           //     year: yearNumber,
//           //     measurementType: "incentive",
//           //     target: 0,
//           //     slabs: [],
//           //     achieved: 0,
//           //     balance: 0,
//           //     incentive,

//           //     // Helpful for checking which lead received incentive
//           //     leadId: lead.leadId,
//           //     leadMongoId: String(lead._id),
//           //     taskById,
//           //     taskId,
//           //     allocationId: rewardTaskId,
//           //     incentiveMode: rewardMode,

//           //     products: [],
//           //   });
//           // }new code

//           for (const [activityIndex, activity] of objects(
//             lead.activityLog
//           ).entries()) {
//             const userId = String(activity.submittedUser || "");

//             if (!userId) continue;

//             const taskById = String(activity.taskBy || "");
//             const taskId = String(activity.taskId || "");

//             // Match the activity task with Target Configuration allocationValues.
//             const allocationRule = objects(
//               config.allocationValues
//             ).find((allocation) => {
//               const allocationId = String(
//                 allocation.allocationId || ""
//               );

//               return (
//                 allocationId === taskById ||
//                 allocationId === taskId
//               );
//             });

//             // No allocation rule configured for this task.
//             if (!allocationRule) continue;

//             const completed =
//               activity.taskClosed === true ||
//               activity.followupClosed === true ||
//               activity.allocatedClosed === true;

//             /*
//               First activity log is Lead By / lead-created activity.

//               For index 0:
//               Do not check taskClosed, followupClosed,
//               or allocatedClosed.

//               For every other index:
//               At least one completion flag must be true.
//             */
//             const isFirstActivity = activityIndex === 0;

//             if (!isFirstActivity && !completed) {
//               continue;
//             }

//             const rewardValue = num(allocationRule.value);

//             if (rewardValue <= 0) continue;

//             /*
//               Your current database uses:

//               mode: "amount"

//               amount / fixed = direct incentive amount
//               percentage / percent = percentage incentive
//             */
//             const rewardMode = String(
//               allocationRule.incentiveType ||
//               allocationRule.mode ||
//               "amount"
//             )
//               .toLowerCase()
//               .trim();

//             const isPercentage =
//               rewardMode === "percentage" ||
//               rewardMode === "percent";

//             let incentive = 0;

//             if (isPercentage) {
//               if (percentageBaseAmount <= 0) continue;

//               incentive =
//                 (rewardValue / 100) * percentageBaseAmount;
//             } else {
//               // `mode: "amount"` means fixed incentive amount.
//               incentive = rewardValue;
//             }

//             if (incentive <= 0) continue;

//             const rewardTaskId = String(
//               allocationRule.allocationId ||
//               taskById ||
//               taskId
//             );

//             /*
//               Prevent duplicate incentive.

//               Example:
//               The Coding & QC allocation ID may appear once as
//               activity.taskId and again as activity.taskBy.

//               User gets that task incentive only once per lead.
//             */
//             const rewardKey = [
//               String(config._id),
//               String(lead._id),
//               userId,
//               rewardTaskId,
//             ].join("-");

//             if (awardedIncentives.has(rewardKey)) {
//               continue;
//             }

//             awardedIncentives.add(rewardKey);

//             const user = ensureUser(userId,null,activity.submissiondoneByModel);

//             user.incentive += incentive;

//             user.categories.push({
//               categoryId: configCategoryId,
//               categoryName,
//               periodName: config.periodName || "",
//               month: targetMonth,
//               year: yearNumber,
//               measurementType: "incentive",
//               target: 0,
//               slabs: [],
//               achieved: 0,
//               balance: 0,
//               incentive,

//               // Helps identify exactly which lead/task received incentive.
//               leadId: lead.leadId,
//               leadMongoId: String(lead._id),

//               activityIndex,
//               taskById,
//               taskId,

//               allocationId: rewardTaskId,
//               incentiveMode: rewardMode,

//               products: [],
//             });
//           }

//         }
//       }
//     }

//     const userWiseResults = [...userWiseMap.values()].map((user) => ({
//       ...user,
//       balance: user.target - user.achieved,
//     }));

//     const summary = userWiseResults.reduce(
//       (total, user) => {
//         total.target += num(user.target);
//         total.achieved += num(user.achieved);
//         total.balance += num(user.balance);
//         total.incentive += num(user.incentive);

//         return total;
//       },
//       {
//         target: 0,
//         achieved: 0,
//         balance: 0,
//         incentive: 0,
//       }
//     );

//     const measurementTypes = [
//       ...new Set(
//         targetConfigs
//           .map((config) =>
//             String(config.measurementType || "").trim()
//           )
//           .filter(Boolean)
//       ),
//     ];

//     return res.status(200).json({
//       success: true,
//       data: {
//         userWiseResults,
//         summary,
//         periods: allPeriods,
//         selectedPeriodName: targetConfigs[0]?.periodName || "",
//         measurementTypes,
//         selectedMeasurementType:
//           targetConfigs[0]?.measurementType || "",
//         selectedMonth,
//         selectedYear: yearNumber,
//       },
//     });
//   } catch (error) {
//     console.error("gettargetResult error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// }

// export const gettargetResult = async (req, res) => {
//   try {
//     const {
//       month,
//       year,
//       periodMode = "all",
//       selectedBranch,
//     } = req.query;

//     const monthNumber = Number(month);
//     const yearNumber = Number(year);
//     const mode = String(periodMode).trim().toLowerCase();

//     if (
//       !Number.isInteger(monthNumber) ||
//       monthNumber < 1 ||
//       monthNumber > 12 ||
//       !Number.isInteger(yearNumber) ||
//       !selectedBranch
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "Valid month, year and selectedBranch are required",
//       });
//     }

//     const objects = (value) => {
//       if (!Array.isArray(value)) return [];

//       return value.filter(
//         (item) =>
//           item !== null &&
//           item !== undefined &&
//           typeof item === "object" &&
//           !Array.isArray(item)
//       );
//     };

//     const num = (value) => Number(value) || 0;

//     const getMonthKey = (yearValue, monthValue) =>
//       `${yearValue}-${monthValue}`;

//     const getMonthRange = (yearValue, startMonth, endMonth) => ({
//       $gte: new Date(Date.UTC(yearValue, startMonth - 1, 1)),
//       $lte: new Date(
//         Date.UTC(yearValue, endMonth, 0, 23, 59, 59, 999)
//       ),
//     });

//     const [allTargetConfigs, closingTask] = await Promise.all([
//       TargetConfiguration.find({
//         branch: selectedBranch,
//       })
//         .select(`
//           periodName branch startDate endDate categoryId categoryName
//           measurementType allocationValues monthlyTargets
//         `)
//         .populate("categoryId", "category")
//         .populate("monthlyTargets.userTargets.userId", "name email")
//         .lean(),

//       Task.findOne({
//         taskName: "Follow-Up Closing",
//       })
//         .select("_id")
//         .lean(),
//     ]);

//     const allPeriods = [
//       ...new Set(
//         allTargetConfigs
//           .map((item) => String(item.periodName || "").trim())
//           .filter(Boolean)
//       ),
//     ];

//     const selectedMonth =
//       mode === "all" ? monthNumber : Number(mode);

//     if (
//       !Number.isInteger(selectedMonth) ||
//       selectedMonth < 1 ||
//       selectedMonth > 12
//     ) {
//       return res.status(400).json({
//         success: false,
//         message: "periodMode must be all or a valid month number",
//       });
//     }

//     const hasSelectedMonth = (config) =>
//       objects(config.monthlyTargets).some(
//         (monthlyTarget) =>
//           num(monthlyTarget.month) === selectedMonth &&
//           num(monthlyTarget.year) === yearNumber
//       );

//     const requestedStart = new Date(
//       Date.UTC(yearNumber, selectedMonth - 1, 1)
//     );

//     const requestedEnd = new Date(
//       Date.UTC(yearNumber, selectedMonth, 0, 23, 59, 59, 999)
//     );

//     const targetConfigs = allTargetConfigs.filter((config) => {
//       const configStart = new Date(config.startDate);
//       const configEnd = new Date(config.endDate);

//       const overlapsRequestedMonth =
//         configStart <= requestedEnd &&
//         configEnd >= requestedStart;

//       return overlapsRequestedMonth && hasSelectedMonth(config);
//     });

//     if (!targetConfigs.length) {
//       return res.json({
//         success: true,
//         data: {
//           userWiseResults: [],
//           summary: {
//             target: 0,
//             achieved: 0,
//             balance: 0,
//             incentive: 0,
//           },
//           periods: allPeriods,
//           measurementTypes: [],
//           selectedMeasurementType: "",
//           selectedPeriodName: "",
//           selectedMonth,
//           selectedYear: yearNumber,
//         },
//       });
//     }

//     const activeMonths = [
//       ...new Set(
//         targetConfigs.flatMap((config) =>
//           objects(config.monthlyTargets)
//             .filter(
//               (monthlyTarget) =>
//                 num(monthlyTarget.year) === yearNumber
//             )
//             .map((monthlyTarget) => num(monthlyTarget.month))
//         )
//       ),
//     ].filter(Boolean);

//     const startMonth = Math.min(...activeMonths);
//     const endMonth = Math.max(...activeMonths);

//     const leads = await LeadMaster.find({
//       leadBranch: selectedBranch,
//       leadDate: getMonthRange(
//         yearNumber,
//         startMonth,
//         endMonth
//       ),
//     })
//       .select(`
//         leadId leadDate netAmount balanceAmount totalPaidAmount
//         forcefullyClosedTarget leadFor paymentHistory activityLog paymentVerified
//       `)
//       .lean();

//     const closingTaskId = String(closingTask?._id || "");

//     const productIds = new Set();
//     const serviceIds = new Set();
//     const staffIds = new Set();
//     const adminIds = new Set();

//     for (const lead of leads) {
//       const leadItems = objects(lead.leadFor);

//       const paymentEntries = objects(
//         lead.paymentHistory
//       ).flatMap((payment) => objects(payment.paymentEntries));

//       const allItems = [...leadItems, ...paymentEntries];

//       for (const item of allItems) {
//         if (!item?.productorServiceId) continue;

//         if (item.productorServicemodel === "Product") {
//           productIds.add(String(item.productorServiceId));
//         }

//         if (item.productorServicemodel === "Service") {
//           serviceIds.add(String(item.productorServiceId));
//         }
//       }

//       for (const activity of objects(lead.activityLog)) {
//         if (!activity?.submittedUser) continue;

//         if (activity.submissiondoneByModel === "Admin") {
//           adminIds.add(String(activity.submittedUser));
//         } else {
//           staffIds.add(String(activity.submittedUser));
//         }
//       }
//     }

//     const [products, services, staffs, admins] =
//       await Promise.all([
//         Product.find({
//           _id: { $in: [...productIds] },
//         })
//           .select("productName name selected.category_id")
//           .lean(),

//         Service.find({
//           _id: { $in: [...serviceIds] },
//         })
//           .select(`
//             serviceName name selected.category_id
//             category_id categoryId
//           `)
//           .lean(),

//         Staff.find({
//           _id: { $in: [...staffIds] },
//         })
//           .select("name designation")
//           .lean(),

//         Admin.find({
//           _id: { $in: [...adminIds] },
//         })
//           .select("name designation")
//           .lean(),
//       ]);

//     const productMap = new Map(
//       products.map((product) => {
//         const categoryId = product?.selected?.[0]?.category_id
//           ? String(product.selected[0].category_id)
//           : "";

//         return [
//           String(product._id),
//           {
//             name: product.productName || product.name || "Product",
//             categoryId,
//           },
//         ];
//       })
//     );

//     const serviceMap = new Map(
//       services.map((service) => {
//         const categoryId = service?.selected?.[0]?.category_id
//           ? String(service.selected[0].category_id)
//           : service?.category_id
//             ? String(service.category_id)
//             : service?.categoryId
//               ? String(service.categoryId)
//               : "";

//         return [
//           String(service._id),
//           {
//             name: service.serviceName || service.name || "Service",
//             categoryId,
//           },
//         ];
//       })
//     );

//     const staffMap = new Map(
//       staffs.map((staff) => [String(staff._id), staff])
//     );

//     const adminMap = new Map(
//       admins.map((admin) => [String(admin._id), admin])
//     );

//     const resolveUser = (userId, userModel) => {
//       if (!userId) return null;

//       const id = String(userId);

//       if (userModel === "Admin" && adminMap.has(id)) {
//         return {
//           ...adminMap.get(id),
//           model: "Admin",
//         };
//       }

//       if (userModel === "Staff" && staffMap.has(id)) {
//         return {
//           ...staffMap.get(id),
//           model: "Staff",
//         };
//       }

//       if (staffMap.has(id)) {
//         return {
//           ...staffMap.get(id),
//           model: "Staff",
//         };
//       }

//       if (adminMap.has(id)) {
//         return {
//           ...adminMap.get(id),
//           model: "Admin",
//         };
//       }

//       return null;
//     };

//     const getItemMeta = (item) => {
//       if (!item?.productorServiceId) return null;

//       const itemId = String(item.productorServiceId);

//       if (item.productorServicemodel === "Product") {
//         return productMap.get(itemId) || null;
//       }

//       if (item.productorServicemodel === "Service") {
//         return serviceMap.get(itemId) || null;
//       }

//       return null;
//     };

//     const getLeadCategoryItems = (
//       lead,
//       configCategoryId
//     ) => {
//       const entries = [];

//       for (const item of objects(lead.leadFor)) {
//         const meta = getItemMeta(item);

//         if (!meta?.categoryId) continue;

//         if (
//           String(meta.categoryId) !==
//           String(configCategoryId)
//         ) {
//           continue;
//         }

//         entries.push({
//           id: String(item.productorServiceId),
//           model: item.productorServicemodel,
//           name: meta.name,
//         });
//       }

//       return entries;
//     };

//     const getVerifiedAmountForCategory = (
//       lead,
//       configCategoryId
//     ) => {
//       let total = 0;

//       for (const payment of objects(lead.paymentHistory)) {
//         if (payment.paymentVerified !== true) continue;

//         for (const entry of objects(payment.paymentEntries)) {
//           const meta = getItemMeta(entry);

//           if (!meta?.categoryId) continue;

//           if (
//             String(meta.categoryId) !==
//             String(configCategoryId)
//           ) {
//             continue;
//           }

//           total += num(entry.receivedAmount);
//         }
//       }

//       return total;
//     };

//     const isLeadFullyVerified = (lead) => {
//       const payments = objects(lead.paymentHistory);

//       return (
//         payments.length > 0 &&
//         payments.every(
//           (payment) => payment.paymentVerified === true
//         )
//       );
//     };

//     const isLeadEligibleForIncentive = (lead) => {
//       const netAmount = num(lead.netAmount);
//       const totalPaidAmount = num(lead.totalPaidAmount);

//       // Zero-value leads never count.
//       if (netAmount <= 0) {
//         return false;
//       }

//       const hasZeroBalance =
//         lead.balanceAmount !== null &&
//         lead.balanceAmount !== undefined &&
//         lead.balanceAmount !== "" &&
//         num(lead.balanceAmount) === 0;

//       // Excess payment is allowed:
//       // totalPaidAmount can be equal to or greater than netAmount.
//       const isFullyPaid =
//         hasZeroBalance &&
//         totalPaidAmount >= netAmount;

//       // Outer LeadMaster field must also be verified.
//       const isLeadRootPaymentVerified =
//         lead.paymentVerified === true;

//       // There must be at least one payment,
//       // and every paymentHistory item must be verified.
//       const areAllPaymentsVerified =
//         isLeadFullyVerified(lead);

//       return (
//         isFullyPaid &&
//         isLeadRootPaymentVerified &&
//         areAllPaymentsVerified
//       );
//     };//new codez

   

//     const getLatestClosingUserId = (lead) => {
//       const closingLogs = objects(lead.activityLog).filter(
//         (log) =>
//           String(log.taskBy || "") === closingTaskId &&
//           log.followupClosed === true &&
//           log.submittedUser
//       );

//       const latestClosingLog = closingLogs.at(-1);

//       return latestClosingLog?.submittedUser
//         ? String(latestClosingLog.submittedUser)
//         : null;
//     };

//     const leadsByMonth = new Map();

//     for (const lead of leads) {
//       const date = new Date(lead.leadDate);

//       if (Number.isNaN(date.getTime())) continue;

//       const leadMonth = date.getUTCMonth() + 1;
//       const leadYear = date.getUTCFullYear();

//       const monthKey = getMonthKey(leadYear, leadMonth);

//       if (!leadsByMonth.has(monthKey)) {
//         leadsByMonth.set(monthKey, []);
//       }

//       leadsByMonth.get(monthKey).push(lead);
//     }

//     const userWiseMap = new Map();

//     const ensureUser = (
//       userId,
//       suppliedName = null,
//       userModel = null
//     ) => {
//       const id = String(userId);

//       const resolvedUser = resolveUser(id, userModel);

//       const resolvedName =
//         suppliedName ||
//         resolvedUser?.name ||
//         `Unknown User (${id})`;

//       const resolvedDesignation =
//         resolvedUser?.designation ||
//         resolvedUser?.model ||
//         userModel ||
//         "Unknown";

//       const existingUser = userWiseMap.get(id);

//       if (existingUser) {
//         const existingName = String(
//           existingUser.userName || ""
//         );

//         const wasUnknown =
//           existingName
//             .toLowerCase()
//             .startsWith("unknown user") ||
//           existingName === "un";

//         const hasRealName = !resolvedName
//           .toLowerCase()
//           .startsWith("unknown user");

//         if (wasUnknown && hasRealName) {
//           existingUser.userName = resolvedName;
//           existingUser.designation = resolvedDesignation;
//         }

//         return existingUser;
//       }

//       const user = {
//         userId: id,
//         userName: resolvedName,
//         designation: resolvedDesignation,
//         target: 0,
//         achieved: 0,
//         balance: 0,
//         incentive: 0,
//         categories: [],
//       };

//       userWiseMap.set(id, user);

//       return user;
//     };

//     const awardedIncentives = new Set();

//     for (const config of targetConfigs) {
//       const configCategoryId = String(
//         config.categoryId?._id || config.categoryId || ""
//       );

//       if (!configCategoryId) continue;

//       const categoryName =
//         config.categoryId?.category ||
//         config.categoryName ||
//         "Category";

//       const monthlyTargets = objects(
//         config.monthlyTargets
//       ).filter(
//         (monthlyTarget) =>
//           num(monthlyTarget.year) === yearNumber &&
//           activeMonths.includes(num(monthlyTarget.month))
//       );

//       for (const monthlyTarget of monthlyTargets) {
//         const targetMonth = num(monthlyTarget.month);

//         const currentMonthLeads =
//           leadsByMonth.get(
//             getMonthKey(yearNumber, targetMonth)
//           ) || [];

//         for (const userTarget of objects(
//           monthlyTarget.userTargets
//         )) {
//           const userId = String(
//             userTarget.userId?._id ||
//             userTarget.userId ||
//             ""
//           );

//           if (!userId) continue;

//           const userName =
//             userTarget.userId?.name || "Unknown User";

//           const slabs = objects(userTarget.slabs);

//           const target = slabs.reduce(
//             (highest, slab) =>
//               Math.max(highest, num(slab.toValue)),
//             0
//           );

//           const user = ensureUser(userId, userName, "Staff");

//           user.target += target;

//           let achieved = 0;
//           const productWiseMap = new Map();

//           // Contains only leads that actually contribute
//           // to target achievement for this user/category/month.
//           const achievedLeads = [];

//           for (const lead of currentMonthLeads) {
//             const closingUserId =
//               getLatestClosingUserId(lead);

//             if (closingUserId !== userId) continue;

//             const categoryItems = getLeadCategoryItems(
//               lead,
//               configCategoryId
//             );

//             if (!categoryItems.length) continue;

//             let leadAchievement = 0;

//             if (config.measurementType === "amount") {
//               leadAchievement =
//                 lead.forcefullyClosedTarget === true
//                   ? num(lead.netAmount)
//                   : getVerifiedAmountForCategory(
//                     lead,
//                     configCategoryId
//                   );
//             } else {
//               leadAchievement =
//                 isLeadEligibleForIncentive(lead) ? 1 : 0;
//             }

//             if (leadAchievement <= 0) continue;

//             achieved += leadAchievement;

//             achievedLeads.push({
//               leadId: lead.leadId || "",
//               leadMongoId: String(lead._id),
//               leadDate: lead.leadDate,

//               closingUserId,

//               measurementType: config.measurementType,
//               achievedValue: leadAchievement,

//               netAmount: num(lead.netAmount),
//               balanceAmount: num(lead.balanceAmount),
//               totalPaidAmount: num(lead.totalPaidAmount),

//               forcefullyClosedTarget:
//                 lead.forcefullyClosedTarget === true,

//               isFullyVerified:
//                 isLeadFullyVerified(lead),

//               verifiedCategoryAmount:
//                 getVerifiedAmountForCategory(
//                   lead,
//                   configCategoryId
//                 ),

//               categoryItems: categoryItems.map((item) => ({
//                 id: item.id,
//                 model: item.model,
//                 name: item.name,
//               })),
//             });

//             const itemCount = categoryItems.length || 1;

//             for (const item of categoryItems) {
//               const productKey = `${item.model}-${item.id}`;

//               if (!productWiseMap.has(productKey)) {
//                 productWiseMap.set(productKey, {
//                   id: item.id,
//                   model: item.model,
//                   name: item.name,
//                   achieved: 0,
//                   incentive: 0,
//                 });
//               }

//               const product = productWiseMap.get(productKey);

//               product.achieved +=
//                 config.measurementType === "amount"
//                   ? leadAchievement / itemCount
//                   : 1;
//             }
//           }

//           user.achieved += achieved;

//           user.categories.push({
//             categoryId: configCategoryId,
//             categoryName,
//             periodName: config.periodName || "",
//             month: targetMonth,
//             year: yearNumber,
//             measurementType: config.measurementType,

//             target,
//             slabs,
//             achieved,
//             balance: target - achieved,
//             incentive: 0,

//             // Frontend can use this to inspect all
//             // leads included in target achievement.
//             achievedLeads,

//             products: [...productWiseMap.values()],
//           });
//         }

//         for (const lead of currentMonthLeads) {
//           const categoryItems = getLeadCategoryItems(
//             lead,
//             configCategoryId
//           );

//           if (!categoryItems.length) continue;

//           if (!isLeadEligibleForIncentive(lead)) continue;

//           const percentageBaseAmount =
//             lead.forcefullyClosedTarget === true
//               ? num(lead.netAmount)
//               : getVerifiedAmountForCategory(
//                 lead,
//                 configCategoryId
//               );

//           for (const [activityIndex, activity] of objects(
//             lead.activityLog
//           ).entries()) {
//             const userId = String(activity.submittedUser || "");

//             if (!userId) continue;

//             const taskById = String(activity.taskBy || "");
//             const taskId = String(activity.taskId || "");

//             const allocationRule = objects(
//               config.allocationValues
//             ).find((allocation) => {
//               const allocationId = String(
//                 allocation.allocationId || ""
//               );

//               return (
//                 allocationId === taskById ||
//                 allocationId === taskId
//               );
//             });

//             if (!allocationRule) continue;

//             const completed =
//               activity.taskClosed === true ||
//               activity.followupClosed === true ||
//               activity.allocatedClosed === true;

//             const isFirstActivity = activityIndex === 0;

//             if (!isFirstActivity && !completed) continue;

//             const rewardValue = num(allocationRule.value);

//             if (rewardValue <= 0) continue;

//             const rewardMode = String(
//               allocationRule.incentiveType ||
//               allocationRule.mode ||
//               "amount"
//             )
//               .toLowerCase()
//               .trim();

//             const isPercentage =
//               rewardMode === "percentage" ||
//               rewardMode === "percent";

//             let incentive = 0;

//             if (isPercentage) {
//               if (percentageBaseAmount <= 0) continue;

//               incentive =
//                 (rewardValue / 100) * percentageBaseAmount;
//             } else {
//               incentive = rewardValue;
//             }

//             if (incentive <= 0) continue;

//             const rewardTaskId = String(
//               allocationRule.allocationId ||
//               taskById ||
//               taskId
//             );

//             const rewardKey = [
//               String(config._id),
//               String(lead._id),
//               userId,
//               rewardTaskId,
//             ].join("-");

//             if (awardedIncentives.has(rewardKey)) continue;

//             awardedIncentives.add(rewardKey);

//             const user = ensureUser(
//               userId,
//               null,
//               activity.submissiondoneByModel
//             );

//             user.incentive += incentive;

//             user.categories.push({
//               categoryId: configCategoryId,
//               categoryName,
//               periodName: config.periodName || "",
//               month: targetMonth,
//               year: yearNumber,
//               measurementType: "incentive",
//               target: 0,
//               slabs: [],
//               achieved: 0,
//               balance: 0,
//               incentive,

//               leadId: lead.leadId,
//               leadMongoId: String(lead._id),

//               activityIndex,
//               taskById,
//               taskId,

//               allocationId: rewardTaskId,
//               incentiveMode: rewardMode,

//               products: [],
//             });
//           }
//         }
//       }
//     }

//     const userWiseResults = [...userWiseMap.values()].map(
//       (user) => ({
//         ...user,
//         balance: user.target - user.achieved,
//       })
//     );

//     const summary = userWiseResults.reduce(
//       (total, user) => {
//         total.target += num(user.target);
//         total.achieved += num(user.achieved);
//         total.balance += num(user.balance);
//         total.incentive += num(user.incentive);

//         return total;
//       },
//       {
//         target: 0,
//         achieved: 0,
//         balance: 0,
//         incentive: 0,
//       }
//     );

//     const measurementTypes = [
//       ...new Set(
//         targetConfigs
//           .map((config) =>
//             String(config.measurementType || "").trim()
//           )
//           .filter(Boolean)
//       ),
//     ];
//     const check = await LeadMaster.find({
//       "activityLog.taskallocatedTo": new ObjectId("672072c7a80cc9c3f31d97d0"),
//       balanceAmount: 0,
//       paymentVerified: true,
//       "leadFor.productorServiceId": {
//         $in: [
//           new ObjectId("6a326db3a587143676cf71fb"),
//           new ObjectId("6a326d76a587143676cf6ee7"),
//           new ObjectId("6a326e04a587143676cf7249"),
//           new ObjectId("6a326e27a587143676cf7298")
//         ]
//       },
//       leadBranch: new ObjectId("66f7b26c1e7129afd9aee189")
//     })

//     return res.status(200).json({
//       success: true,
//       data: {
//         userWiseResults,
//         checkvalues: check,
//         summary,
//         periods: allPeriods,
//         selectedPeriodName: targetConfigs[0]?.periodName || "",
//         measurementTypes,
//         selectedMeasurementType:
//           targetConfigs[0]?.measurementType || "",
//         selectedMonth,
//         selectedYear: yearNumber,
//       },
//     });
//   } catch (error) {
//     console.error("gettargetResult error:", error);

//     return res.status(500).json({
//       success: false,
//       message: "Internal server error",
//     });
//   }
// };

export const gettargetResult = async (req, res) => {
  try {
    const {
      month,
      year,
      periodMode = "all",
      selectedBranch,
    } = req.query;

    const monthNumber = Number(month);
    const yearNumber = Number(year);
    const mode = String(periodMode).trim().toLowerCase();

    if (
      !Number.isInteger(monthNumber) ||
      monthNumber < 1 ||
      monthNumber > 12 ||
      !Number.isInteger(yearNumber) ||
      !selectedBranch
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid month, year and selectedBranch are required",
      });
    }

    const objects = (value) => {
      if (!Array.isArray(value)) return [];

      return value.filter(
        (item) =>
          item !== null &&
          item !== undefined &&
          typeof item === "object" &&
          !Array.isArray(item)
      );
    };

    const num = (value) => Number(value) || 0;

    const getMonthKey = (yearValue, monthValue) =>
      `${yearValue}-${monthValue}`;

    const getMonthRange = (yearValue, startMonth, endMonth) => ({
      $gte: new Date(Date.UTC(yearValue, startMonth - 1, 1)),
      $lte: new Date(
        Date.UTC(yearValue, endMonth, 0, 23, 59, 59, 999)
      ),
    });

    const [allTargetConfigs] = await Promise.all([
      TargetConfiguration.find({
        branch: selectedBranch,
      })
        .select(`
          periodName branch startDate endDate categoryId categoryName
          measurementType allocationValues monthlyTargets
        `)
        .populate("categoryId", "category")
        .populate("monthlyTargets.userTargets.userId", "name email")
        .lean(),
    ]);

    const allPeriods = [
      ...new Set(
        allTargetConfigs
          .map((item) => String(item.periodName || "").trim())
          .filter(Boolean)
      ),
    ];

    const selectedMonth =
      mode === "all" ? monthNumber : Number(mode);

    if (
      !Number.isInteger(selectedMonth) ||
      selectedMonth < 1 ||
      selectedMonth > 12
    ) {
      return res.status(400).json({
        success: false,
        message: "periodMode must be all or a valid month number",
      });
    }

    const hasSelectedMonth = (config) =>
      objects(config.monthlyTargets).some(
        (monthlyTarget) =>
          num(monthlyTarget.month) === selectedMonth &&
          num(monthlyTarget.year) === yearNumber
      );

    const requestedStart = new Date(
      Date.UTC(yearNumber, selectedMonth - 1, 1)
    );

    const requestedEnd = new Date(
      Date.UTC(yearNumber, selectedMonth, 0, 23, 59, 59, 999)
    );

    const targetConfigs = allTargetConfigs.filter((config) => {
      const configStart = new Date(config.startDate);
      const configEnd = new Date(config.endDate);

      const overlapsRequestedMonth =
        configStart <= requestedEnd &&
        configEnd >= requestedStart;

      return overlapsRequestedMonth && hasSelectedMonth(config);
    });

    if (!targetConfigs.length) {
      return res.status(200).json({
        success: true,
        data: {
          userWiseResults: [],
          summary: {
            target: 0,
            achieved: 0,
            balance: 0,
            incentive: 0,
          },
          periods: allPeriods,
          measurementTypes: [],
          selectedMeasurementType: "",
          selectedPeriodName: "",
          selectedMonth,
          selectedYear: yearNumber,
        },
      });
    }

    const activeMonths = [
      ...new Set(
        targetConfigs.flatMap((config) =>
          objects(config.monthlyTargets)
            .filter(
              (monthlyTarget) =>
                num(monthlyTarget.year) === yearNumber
            )
            .map((monthlyTarget) => num(monthlyTarget.month))
        )
      ),
    ].filter(Boolean);

    const startMonth = Math.min(...activeMonths);
    const endMonth = Math.max(...activeMonths);

    const leads = await LeadMaster.find({
      leadBranch: selectedBranch,
      leadDate: getMonthRange(
        yearNumber,
        startMonth,
        endMonth
      ),
    })
      .select(`
        leadId leadDate leadClosed paymentVerified
        netAmount balanceAmount totalPaidAmount
        forcefullyClosedTarget leadFor paymentHistory activityLog
      `)
      .lean();

    const productIds = new Set();
    const serviceIds = new Set();
    const staffIds = new Set();
    const adminIds = new Set();

    for (const lead of leads) {
      const leadItems = objects(lead.leadFor);

      const paymentEntries = objects(
        lead.paymentHistory
      ).flatMap((payment) => objects(payment.paymentEntries));

      const allItems = [...leadItems, ...paymentEntries];

      for (const item of allItems) {
        if (!item?.productorServiceId) continue;

        if (item.productorServicemodel === "Product") {
          productIds.add(String(item.productorServiceId));
        }

        if (item.productorServicemodel === "Service") {
          serviceIds.add(String(item.productorServiceId));
        }
      }

      for (const activity of objects(lead.activityLog)) {
        if (!activity?.submittedUser) continue;

        if (activity.submissiondoneByModel === "Admin") {
          adminIds.add(String(activity.submittedUser));
        } else {
          staffIds.add(String(activity.submittedUser));
        }
      }
    }

    const [products, services, staffs, admins] =
      await Promise.all([
        Product.find({
          _id: { $in: [...productIds] },
        })
          .select("productName name selected.category_id")
          .lean(),

        Service.find({
          _id: { $in: [...serviceIds] },
        })
          .select(`
            serviceName name selected.category_id
            category_id categoryId
          `)
          .lean(),

        Staff.find({
          _id: { $in: [...staffIds] },
        })
          .select("name designation")
          .lean(),

        Admin.find({
          _id: { $in: [...adminIds] },
        })
          .select("name designation")
          .lean(),
      ]);

    const productMap = new Map(
      products.map((product) => {
        const categoryId = product?.selected?.[0]?.category_id
          ? String(product.selected[0].category_id)
          : "";

        return [
          String(product._id),
          {
            name: product.productName || product.name || "Product",
            categoryId,
          },
        ];
      })
    );

    const serviceMap = new Map(
      services.map((service) => {
        const categoryId = service?.selected?.[0]?.category_id
          ? String(service.selected[0].category_id)
          : service?.category_id
            ? String(service.category_id)
            : service?.categoryId
              ? String(service.categoryId)
              : "";

        return [
          String(service._id),
          {
            name: service.serviceName || service.name || "Service",
            categoryId,
          },
        ];
      })
    );

    const staffMap = new Map(
      staffs.map((staff) => [String(staff._id), staff])
    );

    const adminMap = new Map(
      admins.map((admin) => [String(admin._id), admin])
    );

    const resolveUser = (userId, userModel) => {
      if (!userId) return null;

      const id = String(userId);

      if (userModel === "Admin" && adminMap.has(id)) {
        return {
          ...adminMap.get(id),
          model: "Admin",
        };
      }

      if (userModel === "Staff" && staffMap.has(id)) {
        return {
          ...staffMap.get(id),
          model: "Staff",
        };
      }

      if (staffMap.has(id)) {
        return {
          ...staffMap.get(id),
          model: "Staff",
        };
      }

      if (adminMap.has(id)) {
        return {
          ...adminMap.get(id),
          model: "Admin",
        };
      }

      return null;
    };

    const getItemMeta = (item) => {
      if (!item?.productorServiceId) return null;

      const itemId = String(item.productorServiceId);

      if (item.productorServicemodel === "Product") {
        return productMap.get(itemId) || null;
      }

      if (item.productorServicemodel === "Service") {
        return serviceMap.get(itemId) || null;
      }

      return null;
    };

    const getLeadCategoryItems = (
      lead,
      configCategoryId
    ) => {
      const entries = [];

      for (const item of objects(lead.leadFor)) {
        const meta = getItemMeta(item);

        if (!meta?.categoryId) continue;

        if (
          String(meta.categoryId) !==
          String(configCategoryId)
        ) {
          continue;
        }

        entries.push({
          id: String(item.productorServiceId),
          model: item.productorServicemodel,
          name: meta.name,
        });
      }

      return entries;
    };

    const getVerifiedAmountForCategory = (
      lead,
      configCategoryId
    ) => {
      let total = 0;

      for (const payment of objects(lead.paymentHistory)) {
        if (payment.paymentVerified !== true) continue;

        for (const entry of objects(payment.paymentEntries)) {
          const meta = getItemMeta(entry);

          if (!meta?.categoryId) continue;

          if (
            String(meta.categoryId) !==
            String(configCategoryId)
          ) {
            continue;
          }

          total += num(entry.receivedAmount);
        }
      }

      return total;
    };

    const isLeadFullyVerified = (lead) => {
      const payments = objects(lead.paymentHistory);

      return (
        payments.length > 0 &&
        payments.every(
          (payment) => payment.paymentVerified === true
        )
      );
    };

    /*
      Finds the staff/admin who actually completed
      the latest follow-up close action.

      We intentionally do not check `taskBy` against a single
      Task document ID because your activityLog uses different
      taskBy IDs for different kinds of follow-up closure entries.
    */
    const getLatestFollowUpCloser = (lead) => {
      const closingLogs = objects(lead.activityLog).filter(
        (activity) =>
          activity.followupClosed === true &&
          activity.taskClosed === true &&
          activity.submittedUser
      );

      const latestClosingLog = closingLogs.at(-1);

      if (!latestClosingLog?.submittedUser) {
        return null;
      }

      return {
        userId: String(latestClosingLog.submittedUser),
        userModel:
          latestClosingLog.submissiondoneByModel || "Staff",
        activity: latestClosingLog,
      };
    };

    const leadsByMonth = new Map();

    for (const lead of leads) {
      const date = new Date(lead.leadDate);

      if (Number.isNaN(date.getTime())) continue;

      const leadMonth = date.getUTCMonth() + 1;
      const leadYear = date.getUTCFullYear();

      const monthKey = getMonthKey(leadYear, leadMonth);

      if (!leadsByMonth.has(monthKey)) {
        leadsByMonth.set(monthKey, []);
      }

      leadsByMonth.get(monthKey).push(lead);
    }

    const userWiseMap = new Map();

    const ensureUser = (
      userId,
      suppliedName = null,
      userModel = null
    ) => {
      const id = String(userId);

      const resolvedUser = resolveUser(id, userModel);

      const resolvedName =
        suppliedName ||
        resolvedUser?.name ||
        `Unknown User (${id})`;

      const resolvedDesignation =
        resolvedUser?.designation ||
        resolvedUser?.model ||
        userModel ||
        "Unknown";

      const existingUser = userWiseMap.get(id);

      if (existingUser) {
        const existingName = String(
          existingUser.userName || ""
        );

        const wasUnknown =
          existingName
            .toLowerCase()
            .startsWith("unknown user") ||
          existingName === "un";

        const hasRealName = !resolvedName
          .toLowerCase()
          .startsWith("unknown user");

        if (wasUnknown && hasRealName) {
          existingUser.userName = resolvedName;
          existingUser.designation = resolvedDesignation;
        }

        return existingUser;
      }

      const user = {
        userId: id,
        userName: resolvedName,
        designation: resolvedDesignation,
        target: 0,
        achieved: 0,
        balance: 0,
        incentive: 0,
        categories: [],
      };

      userWiseMap.set(id, user);

      return user;
    };

    const awardedIncentives = new Set();

    for (const config of targetConfigs) {
      const configCategoryId = String(
        config.categoryId?._id || config.categoryId || ""
      );

      if (!configCategoryId) continue;

      const categoryName =
        config.categoryId?.category ||
        config.categoryName ||
        "Category";

      const monthlyTargets = objects(
        config.monthlyTargets
      ).filter(
        (monthlyTarget) =>
          num(monthlyTarget.year) === yearNumber &&
          activeMonths.includes(num(monthlyTarget.month))
      );

      for (const monthlyTarget of monthlyTargets) {
        const targetMonth = num(monthlyTarget.month);

        const currentMonthLeads =
          leadsByMonth.get(
            getMonthKey(yearNumber, targetMonth)
          ) || [];

        /*
          STEP 1:
          Add only assigned target values to target users.

          Example:
          Saritha has a target of 2.
          Saritha starts with:
          target: 2
          achieved: 0
        */
        for (const userTarget of objects(
          monthlyTarget.userTargets
        )) {
          const userId = String(
            userTarget.userId?._id ||
            userTarget.userId ||
            ""
          );

          if (!userId) continue;

          const userName =
            userTarget.userId?.name || "Unknown User";

          const slabs = objects(userTarget.slabs);

          const target = slabs.reduce(
            (highest, slab) =>
              Math.max(highest, num(slab.toValue)),
            0
          );

          const user = ensureUser(userId, userName, "Staff");

          user.target += target;

          user.categories.push({
            categoryId: configCategoryId,
            categoryName,
            periodName: config.periodName || "",
            month: targetMonth,
            year: yearNumber,
            measurementType: config.measurementType,

            target,
            slabs,
            achieved: 0,
            balance: target,
            incentive: 0,

            achievedLeads: [],
            products: [],
          });
        }

        /*
          STEP 2:
          Add achievement only to the user who actually closed
          the follow-up for the qualifying lead.

          That staff/admin does not need a target configured.
        */
        for (const lead of currentMonthLeads) {
          const categoryItems = getLeadCategoryItems(
            lead,
            configCategoryId
          );

          if (!categoryItems.length) continue;

          const followUpCloser =
            getLatestFollowUpCloser(lead);

          if (!followUpCloser) continue;

          const {
            userId: achievedByUserId,
            userModel: achievedByModel,
            activity: closingActivity,
          } = followUpCloser;

          let leadAchievement = 0;

          if (config.measurementType === "amount") {
            leadAchievement =
              lead.forcefullyClosedTarget === true
                ? num(lead.netAmount)
                : getVerifiedAmountForCategory(
                    lead,
                    configCategoryId
                  );
          } else {
            /*
              Quantity target:
              Count one when the lead is closed and a follow-up
              is marked closed by a staff/admin.

              This does NOT require balanceAmount === 0.
              If you need fully-paid-only quantity targets, replace
              this with your full-payment validation condition.
            */
            leadAchievement =
              lead.leadClosed === true &&
              closingActivity.followupClosed === true
                ? 1
                : 0;
          }

          if (leadAchievement <= 0) continue;

          const achievedByUser = ensureUser(
            achievedByUserId,
            null,
            achievedByModel
          );

          achievedByUser.achieved += leadAchievement;

          const productWiseMap = new Map();
          const itemCount = categoryItems.length || 1;

          for (const item of categoryItems) {
            const productKey = `${item.model}-${item.id}`;

            if (!productWiseMap.has(productKey)) {
              productWiseMap.set(productKey, {
                id: item.id,
                model: item.model,
                name: item.name,
                achieved: 0,
                incentive: 0,
              });
            }

            const product = productWiseMap.get(productKey);

            product.achieved +=
              config.measurementType === "amount"
                ? leadAchievement / itemCount
                : 1;
          }

          achievedByUser.categories.push({
            categoryId: configCategoryId,
            categoryName,
            periodName: config.periodName || "",
            month: targetMonth,
            year: yearNumber,
            measurementType: config.measurementType,

            target: 0,
            slabs: [],
            achieved: leadAchievement,
            balance: -leadAchievement,
            incentive: 0,

            achievedLeads: [
              {
                leadId: lead.leadId || "",
                leadMongoId: String(lead._id),
                leadDate: lead.leadDate,

                achievedByUserId,
                achievedByModel,

                activityId: String(closingActivity._id || ""),
                taskById: String(closingActivity.taskBy || ""),
                taskId: String(closingActivity.taskId || ""),

                measurementType: config.measurementType,
                achievedValue: leadAchievement,

                netAmount: num(lead.netAmount),
                balanceAmount: num(lead.balanceAmount),
                totalPaidAmount: num(lead.totalPaidAmount),

                forcefullyClosedTarget:
                  lead.forcefullyClosedTarget === true,

                isFullyVerified: isLeadFullyVerified(lead),

                verifiedCategoryAmount:
                  getVerifiedAmountForCategory(
                    lead,
                    configCategoryId
                  ),

                categoryItems: categoryItems.map((item) => ({
                  id: item.id,
                  model: item.model,
                  name: item.name,
                })),
              },
            ],

            products: [...productWiseMap.values()],
          });
        }

        /*
          STEP 3:
          Incentives remain assigned to the activity user.
          This is independent of target assignment.
        */
        for (const lead of currentMonthLeads) {
          const categoryItems = getLeadCategoryItems(
            lead,
            configCategoryId
          );

          if (!categoryItems.length) continue;

          const payments = objects(lead.paymentHistory);

          const isFullyVerified =
            payments.length > 0 &&
            payments.every(
              (payment) => payment.paymentVerified === true
            );

          const hasZeroBalance =
            lead.balanceAmount !== null &&
            lead.balanceAmount !== undefined &&
            lead.balanceAmount !== "" &&
            num(lead.balanceAmount) === 0;

          const isFullyPaid =
            hasZeroBalance &&
            num(lead.totalPaidAmount) >= num(lead.netAmount);

          const isLeadEligibleForIncentive =
            num(lead.netAmount) > 0 &&
            lead.paymentVerified === true &&
            isFullyVerified &&
            isFullyPaid;

          if (!isLeadEligibleForIncentive) continue;

          const percentageBaseAmount =
            lead.forcefullyClosedTarget === true
              ? num(lead.netAmount)
              : getVerifiedAmountForCategory(
                  lead,
                  configCategoryId
                );

          for (const [activityIndex, activity] of objects(
            lead.activityLog
          ).entries()) {
            const userId = String(activity.submittedUser || "");

            if (!userId) continue;

            const taskById = String(activity.taskBy || "");
            const taskId = String(activity.taskId || "");

            const allocationRule = objects(
              config.allocationValues
            ).find((allocation) => {
              const allocationId = String(
                allocation.allocationId || ""
              );

              return (
                allocationId === taskById ||
                allocationId === taskId
              );
            });

            if (!allocationRule) continue;

            const completed =
              activity.taskClosed === true ||
              activity.followupClosed === true ||
              activity.allocatedClosed === true;

            const isFirstActivity = activityIndex === 0;

            if (!isFirstActivity && !completed) continue;

            const rewardValue = num(allocationRule.value);

            if (rewardValue <= 0) continue;

            const rewardMode = String(
              allocationRule.incentiveType ||
              allocationRule.mode ||
              "amount"
            )
              .toLowerCase()
              .trim();

            const isPercentage =
              rewardMode === "percentage" ||
              rewardMode === "percent";

            let incentive = 0;

            if (isPercentage) {
              if (percentageBaseAmount <= 0) continue;

              incentive =
                (rewardValue / 100) * percentageBaseAmount;
            } else {
              incentive = rewardValue;
            }

            if (incentive <= 0) continue;

            const rewardTaskId = String(
              allocationRule.allocationId ||
              taskById ||
              taskId
            );

            const rewardKey = [
              String(config._id),
              String(lead._id),
              userId,
              rewardTaskId,
            ].join("-");

            if (awardedIncentives.has(rewardKey)) continue;

            awardedIncentives.add(rewardKey);

            const user = ensureUser(
              userId,
              null,
              activity.submissiondoneByModel
            );

            user.incentive += incentive;

            user.categories.push({
              categoryId: configCategoryId,
              categoryName,
              periodName: config.periodName || "",
              month: targetMonth,
              year: yearNumber,
              measurementType: "incentive",

              target: 0,
              slabs: [],
              achieved: 0,
              balance: 0,
              incentive,

              leadId: lead.leadId || "",
              leadMongoId: String(lead._id),

              activityIndex,
              taskById,
              taskId,

              allocationId: rewardTaskId,
              incentiveMode: rewardMode,

              products: [],
            });
          }
        }
      }
    }

    const userWiseResults = [...userWiseMap.values()].map(
      (user) => ({
        ...user,
        balance: user.target - user.achieved,
      })
    );

    const summary = userWiseResults.reduce(
      (total, user) => {
        total.target += num(user.target);
        total.achieved += num(user.achieved);
        total.balance += num(user.balance);
        total.incentive += num(user.incentive);

        return total;
      },
      {
        target: 0,
        achieved: 0,
        balance: 0,
        incentive: 0,
      }
    );

    const measurementTypes = [
      ...new Set(
        targetConfigs
          .map((config) =>
            String(config.measurementType || "").trim()
          )
          .filter(Boolean)
      ),
    ];

    return res.status(200).json({
      success: true,
      data: {
        userWiseResults,
        summary,
        periods: allPeriods,
        selectedPeriodName: targetConfigs[0]?.periodName || "",
        measurementTypes,
        selectedMeasurementType:
          targetConfigs[0]?.measurementType || "",
        selectedMonth,
        selectedYear: yearNumber,
      },
    });
  } catch (error) {
    console.error("gettargetResult error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const buildIncentiveReportData = async ({
  yearNumber,
  period,
  selectedBranch,
  search = "",
  detailUserId = "",
  detailAllocationId = "all",
}) => {
  const objects = (value) =>
    Array.isArray(value)
      ? value.filter(
          (item) =>
            item && typeof item === "object" && !Array.isArray(item)
        )
      : [];
  const num = (value) => Number(value) || 0;
  const branchQuery =
    selectedBranch === "all" ? {} : { branch: selectedBranch };

  const targetConfigs = await TargetConfiguration.find({
    ...branchQuery,
    year: yearNumber,
    periodName: period,
  })
    .select(
      "branch categoryId allocationValues monthlyTargets startDate endDate"
    )
    .lean();

  const branchIds = [
    ...new Set(targetConfigs.map((config) => String(config.branch))),
  ];
  const allocationIds = [
    ...new Set(
      targetConfigs.flatMap((config) =>
        objects(config.allocationValues)
          .map((allocation) => String(allocation.allocationId || ""))
          .filter(Boolean)
      )
    ),
  ];

  if (!targetConfigs.length) {
    return {
      branches: [],
      details: [],
      selectedYear: yearNumber,
      selectedPeriod: period,
      summary: { users: 0, totalAmount: 0 },
    };
  }

  const periodStart = new Date(
    Math.min(...targetConfigs.map((config) => new Date(config.startDate).getTime()))
  );
  const periodEnd = new Date(
    Math.max(...targetConfigs.map((config) => new Date(config.endDate).getTime()))
  );

  const leads = await LeadMaster.find({
    leadBranch: { $in: branchIds },
    leadDate: { $gte: periodStart, $lte: periodEnd },
  })
    .select(
      `leadId leadDate leadBranch customerName paymentVerified netAmount
       balanceAmount totalPaidAmount forcefullyClosedTarget leadFor
       paymentHistory activityLog`
    )
    .lean();

  const productIds = new Set();
  const serviceIds = new Set();
  const customerIds = new Set();

  for (const lead of leads) {
    if (lead.customerName) customerIds.add(String(lead.customerName));
    const items = [
      ...objects(lead.leadFor),
      ...objects(lead.paymentHistory).flatMap((payment) =>
        objects(payment.paymentEntries)
      ),
    ];

    for (const item of items) {
      if (!item.productorServiceId) continue;
      const id = String(item.productorServiceId);
      if (item.productorServicemodel === "Product") productIds.add(id);
      if (item.productorServicemodel === "Service") serviceIds.add(id);
    }
  }

  const configuredStaffIds = new Set();
  for (const config of targetConfigs) {
    for (const monthlyTarget of objects(config.monthlyTargets)) {
      for (const userTarget of objects(monthlyTarget.userTargets)) {
        const id = String(userTarget.userId?._id || userTarget.userId || "");
        if (id) configuredStaffIds.add(id);
      }
    }
  }

  const [tasks, branches, products, services, customers] = await Promise.all([
    Task.find({ _id: { $in: allocationIds } })
      .select("taskName")
      .lean(),
    Branch.find({ _id: { $in: branchIds } }).select("branchName").lean(),
    Product.find({ _id: { $in: [...productIds] } })
      .select("selected.category_id category_id categoryId")
      .lean(),
    Service.find({ _id: { $in: [...serviceIds] } })
      .select("selected.category_id category_id categoryId")
      .lean(),
    Customer.find({ _id: { $in: [...customerIds] } })
      .select("customerName name")
      .lean(),
  ]);

  const taskMap = new Map(
    tasks.map((task) => [String(task._id), task.taskName || "Allocation"])
  );
  const branchMap = new Map(
    branches.map((branch) => [String(branch._id), branch.branchName])
  );
  const customerMap = new Map(
    customers.map((customer) => [
      String(customer._id),
      customer.customerName || customer.name || "",
    ])
  );
  const categoryMap = new Map();
  const registerCategory = (item) => {
    const categoryId =
      item?.selected?.[0]?.category_id || item?.category_id || item?.categoryId;
    categoryMap.set(String(item._id), categoryId ? String(categoryId) : "");
  };
  products.forEach(registerCategory);
  services.forEach(registerCategory);

  const branchAllocationMap = new Map();
  for (const config of targetConfigs) {
    const branchId = String(config.branch);
    if (!branchAllocationMap.has(branchId)) {
      branchAllocationMap.set(branchId, new Map());
    }
    for (const allocation of objects(config.allocationValues)) {
      const allocationId = String(allocation.allocationId || "");
      if (!allocationId) continue;
      branchAllocationMap.get(branchId).set(allocationId, {
        key: allocationId,
        label:
          taskMap.get(allocationId) ||
          allocation.allocationName ||
          "Allocation",
      });
    }
  }

  const userModels = new Map(
    [...configuredStaffIds].map((id) => [id, "Staff"])
  );
  const earnedByBranch = new Map();
  const details = [];
  const awarded = new Set();

  const getVerifiedCategoryAmount = (lead, categoryId) => {
    let total = 0;
    for (const payment of objects(lead.paymentHistory)) {
      if (payment.paymentVerified !== true) continue;
      for (const entry of objects(payment.paymentEntries)) {
        if (
          categoryMap.get(String(entry.productorServiceId || "")) ===
          String(categoryId)
        ) {
          total += num(entry.receivedAmount);
        }
      }
    }
    return total;
  };

  for (const lead of leads) {
    const payments = objects(lead.paymentHistory);
    const eligible =
      num(lead.netAmount) > 0 &&
      lead.paymentVerified === true &&
      payments.length > 0 &&
      payments.every((payment) => payment.paymentVerified === true) &&
      lead.balanceAmount !== null &&
      lead.balanceAmount !== undefined &&
      lead.balanceAmount !== "" &&
      num(lead.balanceAmount) === 0 &&
      num(lead.totalPaidAmount) >= num(lead.netAmount);

    if (!eligible) continue;
    const branchId = String(lead.leadBranch);
    const branchConfigs = targetConfigs.filter(
      (config) => String(config.branch) === branchId
    );

    for (const config of branchConfigs) {
      const categoryId = String(config.categoryId?._id || config.categoryId);
      const leadHasCategory = objects(lead.leadFor).some(
        (item) =>
          categoryMap.get(String(item.productorServiceId || "")) === categoryId
      );
      if (!leadHasCategory) continue;

      const percentageBaseAmount =
        lead.forcefullyClosedTarget === true
          ? num(lead.netAmount)
          : getVerifiedCategoryAmount(lead, categoryId);
      const rules = new Map(
        objects(config.allocationValues).map((rule) => [
          String(rule.allocationId || ""),
          rule,
        ])
      );

      for (const [activityIndex, activity] of objects(lead.activityLog).entries()) {
        const userId = String(activity.submittedUser || "");
        if (!userId) continue;
        const taskById = String(activity.taskBy || "");
        const taskId = String(activity.taskId || "");
        const allocationId = rules.has(taskById)
          ? taskById
          : rules.has(taskId)
            ? taskId
            : "";
        if (!allocationId) continue;

        const completed =
          activity.taskClosed === true ||
          activity.followupClosed === true ||
          activity.allocatedClosed === true;
        if (activityIndex !== 0 && !completed) continue;

        const rule = rules.get(allocationId);
        const configuredValue = num(rule.value);
        if (configuredValue <= 0) continue;
        const incentiveMode = String(
          rule.incentiveType || rule.mode || "amount"
        )
          .trim()
          .toLowerCase();
        const isPercentage = ["percentage", "percent"].includes(incentiveMode);
        if (isPercentage && percentageBaseAmount <= 0) continue;
        const incentiveAmount = isPercentage
          ? (configuredValue / 100) * percentageBaseAmount
          : configuredValue;
        if (incentiveAmount <= 0) continue;

        const rewardKey = [
          String(config._id),
          String(lead._id),
          userId,
          allocationId,
        ].join("-");
        if (awarded.has(rewardKey)) continue;
        awarded.add(rewardKey);
        userModels.set(
          userId,
          activity.submissiondoneByModel === "Admin" ? "Admin" : "Staff"
        );

        if (!earnedByBranch.has(branchId)) earnedByBranch.set(branchId, new Map());
        const branchUsers = earnedByBranch.get(branchId);
        if (!branchUsers.has(userId)) branchUsers.set(userId, new Map());
        const allocationTotals = branchUsers.get(userId);
        allocationTotals.set(
          allocationId,
          num(allocationTotals.get(allocationId)) + incentiveAmount
        );

        details.push({
          userId,
          branchId,
          leadId: lead.leadId || "",
          leadMongoId: String(lead._id),
          partyName: customerMap.get(String(lead.customerName || "")) || "",
          date: lead.leadDate,
          allocationId,
          allocationLabel:
            taskMap.get(allocationId) || rule.allocationName || "Allocation",
          incentiveMode,
          configuredValue,
          percentageBaseAmount,
          incentiveAmount,
          amount: incentiveAmount,
        });
      }
    }
  }

  const staffIds = [...userModels]
    .filter(([, model]) => model !== "Admin")
    .map(([id]) => id);
  const adminIds = [...userModels]
    .filter(([, model]) => model === "Admin")
    .map(([id]) => id);
  const [staffs, admins] = await Promise.all([
    Staff.find({ _id: { $in: staffIds } }).select("name designation role").lean(),
    Admin.find({ _id: { $in: adminIds } }).select("name designation role").lean(),
  ]);
  const userMap = new Map(
    [...staffs, ...admins].map((user) => [String(user._id), user])
  );
  const keyword = String(search || "").trim().toLowerCase();

  const resultBranches = branchIds.map((branchId) => {
    const allocationColumns = [
      ...(branchAllocationMap.get(branchId)?.values() || []),
    ];
    const branchUsers = earnedByBranch.get(branchId) || new Map();
    const branchConfiguredIds = new Set();
    for (const config of targetConfigs.filter(
      (item) => String(item.branch) === branchId
    )) {
      for (const monthlyTarget of objects(config.monthlyTargets)) {
        objects(monthlyTarget.userTargets).forEach((target) => {
          const id = String(target.userId?._id || target.userId || "");
          if (id) branchConfiguredIds.add(id);
        });
      }
    }
    const ids = new Set([...branchConfiguredIds, ...branchUsers.keys()]);
    const users = [...ids]
      .map((userId) => {
        const user = userMap.get(userId);
        const allocations = allocationColumns.map((column) => ({
          ...column,
          achieved: num(branchUsers.get(userId)?.get(column.key)),
        }));
        return {
          userId,
          name: user?.name || `Unknown User (${userId})`,
          designation: user?.designation || user?.role || userModels.get(userId) || "",
          allocations,
          totalAmount: allocations.reduce(
            (sum, allocation) => sum + num(allocation.achieved),
            0
          ),
        };
      })
      .filter(
        (user) =>
          !keyword ||
          `${user.name} ${user.designation}`.toLowerCase().includes(keyword)
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      branchId,
      branchName: branchMap.get(branchId) || "Unnamed branch",
      users,
    };
  });

  const visibleBranches = resultBranches.filter((branch) => branch.users.length);
  const totalUsers = visibleBranches.reduce(
    (total, branch) => total + branch.users.length,
    0
  );
  const totalAmount = visibleBranches.reduce(
    (total, branch) =>
      total + branch.users.reduce((sum, user) => sum + user.totalAmount, 0),
    0
  );
  const filteredDetails = details.filter(
    (detail) =>
      (!detailUserId || detail.userId === String(detailUserId)) &&
      (detailAllocationId === "all" ||
        detail.allocationId === String(detailAllocationId))
  );

  return {
    branches: visibleBranches,
    details: filteredDetails,
    selectedYear: yearNumber,
    selectedPeriod: period,
    summary: { users: totalUsers, totalAmount },
  };
};

const validateIncentiveRequest = (req, res, requireUser = false) => {
  const yearNumber = Number(req.query.year);
  const period = String(req.query.period || "").trim();
  const selectedBranch = String(req.query.selectedBranch || "");
  const userId = String(req.query.userId || "");
  const isAdmin = req.owner?.role === "Admin";

  if (
    !Number.isInteger(yearNumber) ||
    yearNumber < 2000 ||
    !period ||
    (!mongoose.isValidObjectId(selectedBranch) &&
      !(selectedBranch === "all" && isAdmin)) ||
    (requireUser && !mongoose.isValidObjectId(userId))
  ) {
    res.status(400).json({
      success: false,
      message: requireUser
        ? "Valid year, period, selectedBranch and userId are required"
        : "Valid year, period and selectedBranch are required",
    });
    return null;
  }

  return { yearNumber, period, selectedBranch, userId };
};

export const getIncentiveReport = async (req, res) => {
  try {
    const validated = validateIncentiveRequest(req, res);
    if (!validated) return;
    const data = await buildIncentiveReportData({
      ...validated,
      search: req.query.search,
    });
    delete data.details;
    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("getIncentiveReport error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getIncentiveLeads = async (req, res) => {
  try {
    const validated = validateIncentiveRequest(req, res, true);
    if (!validated) return;
    const allocationId = String(req.query.allocationId || "all");
    if (allocationId !== "all" && !mongoose.isValidObjectId(allocationId)) {
      return res.status(400).json({
        success: false,
        message: "allocationId must be a valid id or all",
      });
    }
    const data = await buildIncentiveReportData({
      ...validated,
      detailUserId: validated.userId,
      detailAllocationId: allocationId,
    });

    const groupedLeads = new Map();

    for (const detail of data.details) {
      const leadKey = detail.leadMongoId || detail.leadId;

      if (!groupedLeads.has(leadKey)) {
        groupedLeads.set(leadKey, {
          leadId: detail.leadId,
          leadMongoId: detail.leadMongoId,
          partyName: detail.partyName,
          date: detail.date,
          allocationMap: new Map(),
        });
      }

      const groupedLead = groupedLeads.get(leadKey);
      const existingAllocation = groupedLead.allocationMap.get(
        detail.allocationId
      );

      if (existingAllocation) {
        existingAllocation.amount += Number(detail.incentiveAmount || 0);
        existingAllocation.configuredValue += Number(
          detail.configuredValue || 0
        );
      } else {
        groupedLead.allocationMap.set(detail.allocationId, {
          allocationId: detail.allocationId,
          label: detail.allocationLabel,
          incentiveMode: detail.incentiveMode,
          configuredValue: Number(detail.configuredValue || 0),
          percentageBaseAmount: Number(detail.percentageBaseAmount || 0),
          amount: Number(detail.incentiveAmount || 0),
        });
      }
    }

    const leads = [...groupedLeads.values()].map((lead) => {
      const allocations = [...lead.allocationMap.values()];

      return {
        leadId: lead.leadId,
        leadMongoId: lead.leadMongoId,
        partyName: lead.partyName,
        date: lead.date,
        allocations,
        totalAmount: allocations.reduce(
          (total, allocation) => total + Number(allocation.amount || 0),
          0
        ),
      };
    });

    return res.status(200).json({ success: true, data: { leads } });
  } catch (error) {
    console.error("getIncentiveLeads error:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

/**

 * Generate months array between start and end dates
 */
const generateMonthsArray = (startDate, endDate) => {
  const months = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    months.push({
      month: current.getMonth() + 1,
      year: current.getFullYear()
    });
    current.setMonth(current.getMonth() + 1);
  }

  return months;
};

/**
 * Validate slab continuity
 */
const validateSlabs = (slabs) => {
  if (!slabs || slabs.length === 0) {
    throw new Error('At least one slab is required');
  }

  // Sort slabs by order
  slabs.sort((a, b) => a.slabOrder - b.slabOrder);

  // First slab must start from 0
  if (slabs[0].fromValue !== 0) {
    throw new Error('First slab must start from 0');
  }

  // Validate continuity
  for (let i = 0;i < slabs.length - 1;i++) {
    if (slabs[i].toValue !== slabs[i + 1].fromValue) {
      throw new Error(
        `Slab discontinuity found between slab ${i + 1} and ${i + 2}`
      );
    }
  }

  return true;
};

// =====================================================
// 1. CREATE TARGET CONFIGURATION
// =====================================================

/**
 * Create a new target configuration with full setup
 * @route POST /api/targets
 */
const createOrUpdateTargetConfiguration = async (req, res) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    const {
      periodName,
      branchId,
      year,
      startDate,
      endDate,
      categoryId,
      measurementType,
      allocations,
      monthlyTargets
    } = req.body

    if (!periodName || !startDate || !endDate || !categoryId || !measurementType) {
      await session.abortTransaction()
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      })
    }

    const category = await Category.findById(categoryId).session(session)
    if (!category) {
      await session.abortTransaction()
      return res.status(404).json({
        success: false,
        message: "Category not found"
      })
    }

    // Build allocationValues from allocations
    const allocationValues = []
    for (const alloc of allocations || []) {
      const allocation = await Task.findById(alloc.allocationId).session(session)
      if (!allocation) {
        throw new Error(`Allocation ${alloc.allocationId} not found`)
      }

      allocationValues.push({
        allocationId: alloc.allocationId,
        allocationName: allocation.name,
        value: alloc.value,
        mode: alloc.mode
      })
    }

    // Build monthlyTargets with user validation + slab validation
    const preparedMonthlyTargets = []
    for (const mt of monthlyTargets || []) {
      const userTargets = []

      for (const ut of mt.userTargets || []) {
        const user = await Staff.findById(ut.userId).session(session)
        if (!user) {
          throw new Error(`User ${ut.userId} not found`)
        }

        validateSlabs(ut.slabs)

        userTargets.push({
          userId: ut.userId,
          slabs: ut.slabs
        })
      }

      preparedMonthlyTargets.push({
        month: mt.month,
        year: mt.year,
        userTargets
      })
    }

    const normalizedStartDate = new Date(startDate)
    const normalizedEndDate = new Date(endDate)

    // 1) Find any overlapping config for this branch + category + year
    // Overlap rule: existing.startDate <= newEnd && existing.endDate >= newStart
    let config = await TargetConfiguration.findOne({
      branch: branchId,
      categoryId,
      year,
      startDate: { $lte: normalizedEndDate },
      endDate: { $gte: normalizedStartDate }
    }).session(session)

    let message
    let statusCode

    if (config) {
      // Overlap found → always update this existing config
      // Example: existing April–May, new April–June → this doc becomes April–June
      config.periodName = periodName
      config.startDate = normalizedStartDate
      config.endDate = normalizedEndDate
      config.categoryId = categoryId
      config.categoryName = category.category || category.name
      config.measurementType = measurementType
      config.allocationValues = allocationValues
      config.monthlyTargets = preparedMonthlyTargets
      config.status = "draft"
      config.updatedBy = req.user?.id

      await config.save({ session })

      message = "Target configuration updated successfully"
      statusCode = 200
    } else {
      // 2) No overlapping config at all → create brand new period
      config = new TargetConfiguration({
        periodName,
        year,
        branch: branchId,
        startDate: normalizedStartDate,
        endDate: normalizedEndDate,
        categoryId,
        categoryName: category.category || category.name,
        measurementType,
        allocationValues,
        monthlyTargets: preparedMonthlyTargets,
        status: "draft",
        createdBy: req.user?.id
      })

      await config.save({ session })

      message = "Target configuration created successfully"
      statusCode = 201
    }

    await session.commitTransaction()

    return res.status(statusCode).json({
      success: true,
      message,
      data: config
    })
  } catch (error) {
    await session.abortTransaction()
    console.error("Error creating/updating target configuration:", error)
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to save target configuration"
    })
  } finally {
    session.endSession()
  }
}
const deleteTargetConfiguration = async (req, res) => {
  try {
    const { categoryId, branchId, year, periodName } = req.body

    if (!categoryId || !branchId || !year || !periodName) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      })
    }

    const deleted = await TargetConfiguration.deleteOne({
      categoryId,
      branch: branchId,
      year,
      periodName
    })

    return res.status(200).json({
      success: true,
      message: "Target configuration deleted successfully",
      data: deleted
    })
  } catch (error) {
    console.error("Delete Target Error:", error)

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete target configuration"
    })
  }
}
// const createOrUpdateTargetConfiguration = async (req, res) => {
//     const session = await mongoose.startSession()
//     session.startTransaction()

//     try {
//         const {
//             periodName,
//             branchId,
//             year,
//             startDate,
//             endDate,
//             categoryId,
//             measurementType,
//             allocations,
//             monthlyTargets
//         } = req.body

//         if (!periodName || !startDate || !endDate || !categoryId || !measurementType) {
//             await session.abortTransaction()
//             return res.status(400).json({
//                 success: false,
//                 message: "Missing required fields"
//             })
//         }

//         const category = await Category.findById(categoryId).session(session)
//         if (!category) {
//             await session.abortTransaction()
//             return res.status(404).json({
//                 success: false,
//                 message: "Category not found"
//             })
//         }

//         const allocationValues = []
//         for (const alloc of allocations || []) {
//             const allocation = await Task.findById(alloc.allocationId).session(session)
//             if (!allocation) {
//                 throw new Error(`Allocation ${alloc.allocationId} not found`)
//             }

//             allocationValues.push({
//                 allocationId: alloc.allocationId,
//                 allocationName: allocation.name,
//                 value: alloc.value,
//                 mode: alloc.mode
//             })
//         }

//         const preparedMonthlyTargets = []
//         for (const mt of monthlyTargets || []) {
//             const userTargets = []

//             for (const ut of mt.userTargets || []) {
//                 const user = await Staff.findById(ut.userId).session(session)
//                 if (!user) {
//                     throw new Error(`User ${ut.userId} not found`)
//                 }

//                 validateSlabs(ut.slabs)

//                 userTargets.push({
//                     userId: ut.userId,
//                     slabs: ut.slabs
//                 })
//             }

//             preparedMonthlyTargets.push({
//                 month: mt.month,
//                 year: mt.year,
//                 userTargets
//             })
//         }

//         const normalizedStartDate = new Date(startDate)
//         const normalizedEndDate = new Date(endDate)

//         let existingConfig = await TargetConfiguration.findOne({
//             periodName,
//             year,
//             branch: branchId,
//             categoryId,
//             startDate: normalizedStartDate,
//             endDate: normalizedEndDate
//         }).session(session)

//         let message = "Target configuration created successfully"
//         let statusCode = 201

//         if (existingConfig) {
//             existingConfig.periodName = periodName
//             existingConfig.startDate = normalizedStartDate
//             existingConfig.endDate = normalizedEndDate
//             existingConfig.categoryId = categoryId
//             existingConfig.categoryName = category.category || category.name
//             existingConfig.measurementType = measurementType
//             existingConfig.allocationValues = allocationValues
//             existingConfig.monthlyTargets = preparedMonthlyTargets
//             existingConfig.status = "draft"
//             existingConfig.updatedBy = req.user?.id

//             await existingConfig.save({ session })

//             message = "Target configuration updated successfully"
//             statusCode = 200
//         } else {
//             existingConfig = new TargetConfiguration({
//                 periodName,
//                 year,
//                 branch: branchId,
//                 startDate: normalizedStartDate,
//                 endDate: normalizedEndDate,
//                 categoryId,
//                 categoryName: category.category || category.name,
//                 measurementType,
//                 allocationValues,
//                 monthlyTargets: preparedMonthlyTargets,
//                 status: "draft",
//                 createdBy: req.user?.id
//             })

//             await existingConfig.save({ session })
//         }

//         await session.commitTransaction()

//         return res.status(statusCode).json({
//             success: true,
//             message,
//             data: existingConfig
//         })
//     } catch (error) {
//         await session.abortTransaction()
//         console.error("Error creating/updating target configuration:", error)
//         return res.status(500).json({
//             success: false,
//             message: error.message || "Failed to save target configuration"
//         })
//     } finally {
//         session.endSession()
//     }
// }


// =====================================================
// 2. UPDATE USER SLABS FOR SPECIFIC MONTH
// =====================================================

/**
 * Update user slabs for a specific month within a target config
 * @route PUT /api/targets/:id/months/:monthId/users/:userId/slabs
 */
const updateUserSlabs = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id, monthId, userId } = req.params;
    const { slabs } = req.body;

    // Validate slabs
    validateSlabs(slabs);

    // Find target configuration
    const targetConfig = await TargetConfiguration.findById(id);
    if (!targetConfig) {
      return res.status(404).json({
        success: false,
        message: 'Target configuration not found'
      });
    }

    // Find monthly target
    const monthlyTarget = targetConfig.monthlyTargets.id(monthId);
    if (!monthlyTarget) {
      return res.status(404).json({
        success: false,
        message: 'Monthly target not found'
      });
    }

    // Find or create user target
    let userTarget = monthlyTarget.userTargets.find(
      (ut) => ut.userId.toString() === userId
    );

    if (userTarget) {
      userTarget.slabs = slabs;
    } else {
      monthlyTarget.userTargets.push({
        userId,
        slabs
      });
    }

    await targetConfig.save({ session });
    await session.commitTransaction();

    res.json({
      success: true,
      message: 'User slabs updated successfully',
      data: targetConfig
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error updating user slabs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update user slabs'
    });
  } finally {
    session.endSession();
  }
};

// =====================================================
// 3. GET TARGET CONFIGURATION WITH FILTERS
// =====================================================

/**
 * Get target configurations with optional filters
 * @route GET /api/targets
 */



const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const getDateFromPeriod = (periodName) => {
  const match = periodName.match(/^(\w+)\s*-\s*(\w+)\s+(\d{4})$/)

  if (!match) return null

  const [, fromMonth, , year] = match

  const monthIndex = months.indexOf(fromMonth)

  if (monthIndex === -1) return null

  return new Date(Number(year), monthIndex, 1)
}
const getTargetConfigurations = async (req, res) => {
  try {
    const { periodName, branchId, year } = req.query
    console.log('peridnme', periodName)
    console.log("brancid", branchId)
    if (!periodName || !branchId) {
      return res.status(400).json({
        success: false,
        message: "periodName and branchId are required"
      })
    }

    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid branchId"
      })
    }

    const queryDate = getDateFromPeriod(periodName)

    if (!queryDate) {
      return res.status(400).json({
        success: false,
        message: "Invalid period format"
      })
    }

    console.log("queryDate:", queryDate.toISOString())

    const allTargets = await TargetConfiguration.find({
      branch: new mongoose.Types.ObjectId(branchId),
      year
    })
      .populate("categoryId", "name description")
      .populate("allocationValues.allocationId", "name")
      .populate("monthlyTargets.userTargets.userId", "name email")
      .sort({ createdAt: 1 })

    const periodMap = new Map()

    for (const t of allTargets) {
      const start = new Date(t.startDate)
      const end = new Date(t.endDate)
      const key = `${start.getTime()}|${end.getTime()}`

      if (!periodMap.has(key)) {
        periodMap.set(key, {
          _id: key,
          periodName: t.periodName,
          startDate: t.startDate,
          endDate: t.endDate
        })
      }
    }

    const periods = Array.from(periodMap.values()).sort(
      (a, b) => new Date(a.startDate) - new Date(b.startDate)
    )
    console.log("allperiods", periods)

    if (!periods.length) {
      return res.json({
        success: true,
        data: {
          targets: [],
          periods: [],
          effectivePeriod: null,
          effectivePeriodName: null,
          effectiveStartDate: null,
          effectiveEndDate: null
        }
      })
    }

    let effectivePeriod = periods.find((p) => {
      const start = new Date(p.startDate)
      const end = new Date(p.endDate)
      return start <= queryDate && end >= queryDate
    })

    if (!effectivePeriod) {
      effectivePeriod = periods[periods.length - 1]
    }

    const targets = allTargets.filter((t) => {
      return (
        new Date(t.startDate).getTime() === new Date(effectivePeriod.startDate).getTime() &&
        new Date(t.endDate).getTime() === new Date(effectivePeriod.endDate).getTime()
      )
    })
    return res.json({
      success: true,
      data: {
        targets,
        allperiods: periods,
        selectedperiod: effectivePeriod,
        selectedPeriodName: effectivePeriod.periodName,

      }
    })
  } catch (error) {
    console.error("Error fetching target configurations:", error)
    return res.status(500).json({
      success: false,
      message: "Failed to fetch target configurations"
    })
  }
}


// const getTargetConfigurations = async (req, res) => {
//     try {
//         const { periodName, branchId } = req.query

//         const queryDate = getDateFromPeriod(periodName)
//         if (!queryDate) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Invalid period format"
//             })
//         }
//         console.log("querydate", queryDate)
//         const targets = await TargetConfiguration.find({
//             startDate: { $lte: queryDate },
//             endDate: { $gte: queryDate },
//             branchId: new mongoose.Types.ObjectId(branchId)
//         })
//             .populate("categoryId", "name description")
//             .populate("allocationValues.allocationId", "name")
//             .populate("monthlyTargets.userTargets.userId", "name email")
//             .sort({ createdAt: -1 })

//         res.json({
//             success: true,
//             data: targets
//         })
//     } catch (error) {
//         console.error("Error fetching target configurations:", error)
//         res.status(500).json({
//             success: false,
//             message: "Failed to fetch target configurations"
//         })
//     }
// }

// const getTargetConfigurations = async (req, res) => {
//   try {
//     const { periodName, branchId } = req.query

//     if (!branchId) {
//       return res.status(400).json({
//         success: false,
//         message: "branchId is required"
//       })
//     }

//     const queryDate = getDateFromPeriod(periodName)
//     if (!queryDate) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid period format"
//       })
//     }

//     console.log("querydate", queryDate)

//     const allTargets = await TargetConfiguration.find({
//       branchId: new mongoose.Types.ObjectId(branchId)
//     })
//       .populate("categoryId", "name description")
//       .populate("allocationValues.allocationId", "name")
//       .populate("monthlyTargets.userTargets.userId", "name email")
//       .sort({ createdAt: -1 })

//     const targets = allTargets.filter((t) => {
//       const start = new Date(t.startDate)
//       const end = new Date(t.endDate)
//       return start <= queryDate && end >= queryDate
//     })

//     const periodMap = new Map()

//     for (const t of allTargets) {
//       const key = `${new Date(t.startDate).getTime()}|${new Date(t.endDate).getTime()}`
//       if (!periodMap.has(key)) {
//         periodMap.set(key, {
//           _id: key,
//           periodName: t.periodName,
//           startDate: t.startDate,
//           endDate: t.endDate
//         })
//       }
//     }

//     const periods = Array.from(periodMap.values()).sort(
//       (a, b) => new Date(a.startDate) - new Date(b.startDate)
//     )

//     return res.json({
//       success: true,
//       data: {
//         targets,
//         periods
//       }
//     })
//   } catch (error) {
//     console.error("Error fetching target configurations:", error)
//     return res.status(500).json({
//       success: false,
//       message: "Failed to fetch target configurations"
//     })
//   }
// }





/**
 * Get a single target configuration by ID
 * @route GET /api/targets/:id
 */
const getTargetConfigurationById = async (req, res) => {
  try {
    const { id } = req.params;

    const targetConfig = await TargetConfiguration.findById(id)
      .populate('categoryId', 'name description')
      .populate('allocationValues.allocationId', 'name description')
      .populate('createdBy', 'name email');

    if (!targetConfig) {
      return res.status(404).json({
        success: false,
        message: 'Target configuration not found'
      });
    }

    // Populate user details in monthly targets
    const populatedConfig = await TargetConfiguration.populate(targetConfig, {
      path: 'monthlyTargets.userTargets.userId',
      select: 'name email'
    });

    res.json({
      success: true,
      data: populatedConfig
    });
  } catch (error) {
    console.error('Error fetching target configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch target configuration'
    });
  }
};

// =====================================================
// 5. UPDATE TARGET STATUS
// =====================================================

/**
 * Update target configuration status
 * @route PATCH /api/targets/:id/status
 */
const updateTargetStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['draft', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const targetConfig = await TargetConfiguration.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!targetConfig) {
      return res.status(404).json({
        success: false,
        message: 'Target configuration not found'
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: targetConfig
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update status'
    });
  }
};

// =====================================================
// 6. DELETE TARGET CONFIGURATION
// =====================================================

/**
 * Delete a target configuration
 * @route DELETE /api/targets/:id
 */
// const deleteTargetConfiguration = async (req, res) => {
//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try {
//         const { id } = req.params;

//         const targetConfig = await TargetConfiguration.findById(id);
//         if (!targetConfig) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Target configuration not found'
//             });
//         }

//         // Check if there are any achievements
//         const achievementCount = await TargetAchievement.countDocuments({
//             targetConfigId: id
//         });

//         if (achievementCount > 0) {
//             return res.status(400).json({
//                 success: false,
//                 message:
//                     'Cannot delete target with existing achievements. Archive it instead.'
//             });
//         }

//         await targetConfig.deleteOne({ session });
//         await session.commitTransaction();

//         res.json({
//             success: true,
//             message: 'Target configuration deleted successfully'
//         });
//     } catch (error) {
//         await session.abortTransaction();
//         console.error('Error deleting target configuration:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to delete target configuration'
//         });
//     } finally {
//         session.endSession();
//     }
// };//original code from ai-but its not called its need to check

// =====================================================
// 7. GET USER TARGETS FOR SPECIFIC PERIOD
// =====================================================

/**
 * Get all targets for a specific user in a period
 * @route GET /api/targets/user/:userId
 */
const getUserTargets = async (req, res) => {
  try {
    const { userId } = req.params;
    const { month, year, status = 'active' } = req.query;

    const query = {
      'monthlyTargets.userTargets.userId': userId,
      status
    };

    if (month && year) {
      query['monthlyTargets.month'] = parseInt(month);
      query['monthlyTargets.year'] = parseInt(year);
    }

    const targets = await TargetConfiguration.find(query)
      .populate('categoryId', 'name')
      .populate('allocationValues.allocationId', 'name')
      .select(
        'periodName startDate endDate categoryName measurementType allocationValues monthlyTargets status'
      );

    const userTargets = targets.map((target) => {
      const relevantMonths = target.monthlyTargets
        .filter((mt) => {
          const hasUser = mt.userTargets.some(
            (ut) => ut.userId.toString() === userId
          );
          if (!month || !year) return hasUser;
          return (
            hasUser &&
            mt.month === parseInt(month) &&
            mt.year === parseInt(year)
          );
        })
        .map((mt) => ({
          month: mt.month,
          year: mt.year,
          slabs:
            mt.userTargets.find((ut) => ut.userId.toString() === userId)
              ?.slabs || []
        }));

      return {
        targetId: target._id,
        periodName: target.periodName,
        startDate: target.startDate,
        endDate: target.endDate,
        category: target.categoryName,
        measurementType: target.measurementType,
        allocations: target.allocationValues,
        monthlyTargets: relevantMonths,
        status: target.status
      };
    });

    res.json({
      success: true,
      data: userTargets
    });
  } catch (error) {
    console.error('Error fetching user targets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user targets'
    });
  }
};

// =====================================================
// 8. BULK CREATE MONTHLY TARGETS
// =====================================================

/**
 * Add monthly targets to existing configuration
 * @route POST /api/targets/:id/months
 */
const addMonthlyTargets = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { monthlyTargets } = req.body;

    const targetConfig = await TargetConfiguration.findById(id);
    if (!targetConfig) {
      return res.status(404).json({
        success: false,
        message: 'Target configuration not found'
      });
    }

    for (const mt of monthlyTargets) {
      const exists = targetConfig.monthlyTargets.some(
        (existing) =>
          existing.month === mt.month && existing.year === mt.year
      );

      if (exists) {
        throw new Error(`Target for ${mt.month}/${mt.year} already exists`);
      }

      for (const ut of mt.userTargets) {
        validateSlabs(ut.slabs);
      }

      targetConfig.monthlyTargets.push(mt);
    }

    await targetConfig.save({ session });
    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Monthly targets added successfully',
      data: targetConfig
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Error adding monthly targets:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to add monthly targets'
    });
  } finally {
    session.endSession();
  }
};

// =====================================================
// 9. RECORD ACHIEVEMENT
// =====================================================

/**
 * Record achievement against a target
 * @route POST /api/targets/achievements
 */
const recordAchievement = async (req, res) => {
  try {
    const {
      targetConfigId,
      userId,
      month,
      year,
      allocationId,
      achievedValue
    } = req.body;

    const targetConfig = await TargetConfiguration.findById(targetConfigId);
    if (!targetConfig) {
      return res.status(404).json({
        success: false,
        message: 'Target configuration not found'
      });
    }

    const monthlyTarget = targetConfig.monthlyTargets.find(
      (mt) => mt.month === month && mt.year === year
    );

    if (!monthlyTarget) {
      return res.status(404).json({
        success: false,
        message: 'Monthly target not found'
      });
    }

    const userTarget = monthlyTarget.userTargets.find(
      (ut) => ut.userId.toString() === userId
    );

    if (!userTarget) {
      return res.status(404).json({
        success: false,
        message: 'User target not found'
      });
    }

    const matchingSlab = userTarget.slabs.find(
      (slab) =>
        achievedValue >= slab.fromValue && achievedValue < slab.toValue
    );

    const achievement = new TargetAchievement({
      targetConfigId,
      userId,
      month,
      year,
      allocationId,
      achievedValue,
      slabMatched: matchingSlab
        ? {
          slabOrder: matchingSlab.slabOrder,
          fromValue: matchingSlab.fromValue,
          toValue: matchingSlab.toValue
        }
        : null
    });

    await achievement.save();

    res.status(201).json({
      success: true,
      message: 'Achievement recorded successfully',
      data: achievement
    });
  } catch (error) {
    console.error('Error recording achievement:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record achievement'
    });
  }
};

// =====================================================
// 10. GET ACHIEVEMENT REPORT
// =====================================================

/**
 * Get achievement report for user/period
 * @route GET /api/targets/achievements/report
 */
const getAchievementReport = async (req, res) => {
  try {
    const { userId, targetConfigId, month, year } = req.query;

    const query = {};
    if (userId) query.userId = userId;
    if (targetConfigId) query.targetConfigId = targetConfigId;
    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const achievements = await TargetAchievement.find(query)
      .populate('targetConfigId', 'periodName categoryName measurementType')
      .populate('userId', 'name email')
      .populate('allocationId', 'name')
      .sort({ achievementDate: -1 });

    const summary = achievements.reduce((acc, achievement) => {
      const key = `${achievement.allocationId._id}`;
      if (!acc[key]) {
        acc[key] = {
          allocationName: achievement.allocationId.name,
          totalAchieved: 0,
          count: 0
        };
      }
      acc[key].totalAchieved += achievement.achievedValue;
      acc[key].count += 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        achievements,
        summary: Object.values(summary)
      }
    });
  } catch (error) {
    console.error('Error fetching achievement report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievement report'
    });
  }
};

// =====================================================
// EXPORTS (ESM)
// =====================================================

export {
  createOrUpdateTargetConfiguration,
  updateUserSlabs,
  getTargetConfigurations,
  getTargetConfigurationById,
  updateTargetStatus,
  deleteTargetConfiguration,
  getUserTargets,
  addMonthlyTargets,
  recordAchievement,
  getAchievementReport
};
