import React from "react"
import { IoReorderThreeSharp } from "react-icons/io5"
import ProductSubDetailsForm from "../../../components/primaryUser/ProductSubDetailsForm"

export default function BrandRegistration() {
  return (
    <div className="flex-1 ">
      <div className="bg-[#201450]  sticky top-0 p-3 z-100 text-white text-lg font-bold flex items-center gap-3 z-20">
        <IoReorderThreeSharp
          // onClick={handleToggleSidebar}
          className="block md:hidden text-3xl"
        />
        <p>Add Category</p>
      </div>

      <ProductSubDetailsForm tab={"category"} />
    </div>
  )
}
