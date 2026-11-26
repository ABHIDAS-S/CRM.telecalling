export const getCallDescription = (description) =>
  (description || "").replace(/^\[(?:Accuanet )?Website complaint\]\s*/i, "")

// Website submissions use a WEB reference; retain support for older descriptions.
export const isWebsiteComplaint = (call) =>
  /^WEB-[a-f0-9]{24}$/i.test(call?.timedata?.token || "") ||
  /^WEB-[a-f0-9]{24}$/i.test(call?.formdata?.token || "") ||
  /^\[(?:Accuanet )?Website complaint\]/i.test(call?.formdata?.description || "")
