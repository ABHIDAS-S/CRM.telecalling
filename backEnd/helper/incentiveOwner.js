// A correction changes reward ownership, while submittedUser remains historical.
export const incentiveOwnerId = (activity) =>
  activity.incentiveAssignedUser || activity.submittedUser;

export const incentiveOwnerModel = (activity) =>
  activity.incentiveAssignedUser
    ? activity.incentiveAssignedUserModel
    : activity.submissiondoneByModel;
