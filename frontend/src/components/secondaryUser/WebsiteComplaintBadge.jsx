import React from "react"
import "./WebsiteComplaintBadge.css"

export default function WebsiteComplaintBadge({ call }) {
  if (!/^\[Website complaint\]/i.test(call?.formdata?.description || "")) return null

  const pending = call?.formdata?.status === "pending"
  return (
    <span className="website-complaint-badge" title="This complaint was submitted through the website">
      <span className={`website-complaint-dot${pending ? " website-complaint-dot-pending" : ""}`} aria-hidden="true" />
      Website complaint
      {pending && <span className="sr-only"> — pending</span>}
    </span>
  )
}
