

import { useState, useEffect, useRef, useMemo } from "react"
import ExcelJS from "exceljs"
import { saveAs } from "file-saver"
import api from "../../api/api"
import { CustomSelect } from "../common/CustomSelect"
import { getLocalStorageItem } from "../../helper/localstorage"
import { CiEdit } from "react-icons/ci"
import { PropagateLoader } from "react-spinners"
import { useNavigate } from "react-router-dom"
import UseFetch from "../../hooks/useFetch"
import debounce from "lodash.debounce"
import TooltipIcon from "../TooltipIcon"
import BranchDropdown from "../primaryUser/BranchDropdown"
import { useInfiniteQuery } from "@tanstack/react-query"
import SkeletonTable from "../loader/SkeletonTable"
import { FaUserPlus, FaRegFileExcel, FaFilePdf, FaPrint } from "react-icons/fa"

const CustomerListform = () => {
  const navigate = useNavigate()
  const containerRef = useRef(null)

  const [searchTerm, setsearchTerm] = useState("")
  const [apiSearchTerm, setApiSearchTerm] = useState("")
  const [selectedstatus, setselectedStatus] = useState("Allcustomers")
console.log(selectedstatus)
  const [customerCount, setcustomerCount] = useState(0)
  const [showFullAddress, setShowFullAddress] = useState({})
  const [showFullEmail, setShowFullEmail] = useState({})
  const [user, setUser] = useState(null)
  const [selectedBranch, setselectedBranch] = useState(null)
  const [userBranches, setuserBranches] = useState([])
  const [userRole, setUserRole] = useState(null)
  const [productType, setproductType] = useState("All")

  const { data: dupi } = UseFetch("/customer/duplicate")
  const { data: unwanted } = UseFetch("/customer/getunwanted")
  const { data: productlist } = UseFetch(
    selectedBranch &&
      `/product/getallProducts?branchselected=${encodeURIComponent(
        JSON.stringify(selectedBranch)
      )}`
  )

  const fetchCustomers = async ({ pageParam = 1, queryKey }) => {
    const [_key, { branch, search, status, productfilter }] = queryKey

    const res = await api.get(
      `/customer/getcust?limit=100&page=${pageParam}&search=${encodeURIComponent(
        search
      )}&loggeduserBranches=${branch}&customerType=${status}&productfilter=${productfilter}`
    )

    return res.data.data
  }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    isLoading
  } = useInfiniteQuery({
    queryKey: [
      "customers",
      {
        branch: selectedBranch,
        search: apiSearchTerm,
        status: selectedstatus,
        productfilter: productType
      }
    ],
    queryFn: fetchCustomers,
    getNextPageParam: (lastPage, allPages) =>
      lastPage?.customers?.length === 100 ? allPages.length + 1 : undefined,
    enabled: !!selectedBranch
  })

  useEffect(() => {
    const userData = getLocalStorageItem("user")
    if (!userData) return

    setUser(userData)
    setUserRole(userData?.role?.toLowerCase?.() || null)

    const branches =
      userData?.selected?.map((branch) => ({
        id: branch.branch_id,
        branchName: branch.branchName
      })) || []

    setuserBranches(branches)

    if (userData?.selected?.[0]?.branch_id) {
      setselectedBranch(userData.selected[0].branch_id)
    }
  }, [])

  const allCustomers = useMemo(() => {
    return data?.pages?.flatMap((page) => page?.customers || []) || []
  }, [data])

  const productOptions = useMemo(() => {
    if (!productlist?.length) return []

    return productlist.map((it) => ({
      id: it._id,
      label: (it?.shortName?.trim() || it?.productName || "").toUpperCase()
    }))
  }, [productlist])
  console.log(productlist)

  const normalizedCustomers = useMemo(() => {
    return allCustomers
      .filter((customer) => {
        if (selectedstatus === "Allcustomers" && productType === "All") {
          return true
        }

        if (selectedstatus === "ProductMissing") {
          return (
            !Array.isArray(customer.selected) || customer.selected.length === 0
          )
        }

        if (!Array.isArray(customer.selected)) return false

        if (productType === "All") return customer.selected.length > 0

        return customer.selected.some((item) => {
          const itemProductId =
            item?.product_id?._id || item?.product_id || item?.productid || ""

          return String(itemProductId) === String(productType)
        })
      })
      .map((customer) => {
        if (!Array.isArray(customer.selected)) return customer

        if (productType === "All") return customer

        return {
          ...customer,
          selected: customer.selected.filter((item) => {
            const itemProductId =
              item?.product_id?._id || item?.product_id || item?.productid || ""

            return String(itemProductId) === String(productType)
          })
        }
      })
  }, [allCustomers, productType, selectedstatus])

  const normalize = (value) =>
    String(value ?? "")
      .trim()
      .toLowerCase()

  const customerMatchesSearch = (cust, term) => {
    const matchesCustomer =
      normalize(cust.customerName).includes(term) ||
      normalize(cust.mobile).includes(term) ||
      normalize(cust.email).includes(term) ||
      normalize(cust.address1).includes(term)

    const matchesSelected =
      Array.isArray(cust.selected) &&
      cust.selected.some(
        (sel) =>
          normalize(sel?.licensenumber).includes(term) ||
          normalize(sel?.productName).includes(term) ||
          normalize(sel?.branch_id?.branchName).includes(term)
      )

    return matchesCustomer || matchesSelected
  }

  const debouncedApiSearch = useMemo(
    () =>
      debounce((value) => {
        setApiSearchTerm(value.trim())
      }, 500),
    []
  )

  useEffect(() => {
    return () => {
      debouncedApiSearch.cancel()
    }
  }, [debouncedApiSearch])

  const handleChange = (e) => {
    const value = e.target.value
    setsearchTerm(value)
    debouncedApiSearch(value)
  }

  const effectiveSearchTerm = useMemo(
    () => normalize(apiSearchTerm),
    [apiSearchTerm]
  )

  const filteredCustomers = useMemo(() => {
    if (!effectiveSearchTerm) return normalizedCustomers
    return normalizedCustomers.filter((cust) =>
      customerMatchesSearch(cust, effectiveSearchTerm)
    )
  }, [normalizedCustomers, effectiveSearchTerm])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
  }, [apiSearchTerm, selectedstatus, productType, selectedBranch])

  useEffect(() => {
    if (searchTerm.trim()) {
      setcustomerCount(filteredCustomers.length)
    } else {
      setcustomerCount(data?.pages?.[0]?.selectedbranchCustomercount || 0)
    }
  }, [filteredCustomers, data, searchTerm])

  const handleBranchChange = (branch) => {
    setselectedBranch(branch)
    setsearchTerm("")
    setApiSearchTerm("")
    setShowFullAddress({})
    setShowFullEmail({})
    debouncedApiSearch.cancel()
  }

  const handleScroll = () => {
    const container = containerRef.current
    if (!container) return

    const { clientHeight, scrollHeight, scrollTop } = container

    if (
      scrollTop / (scrollHeight - clientHeight) >= 0.9 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }

  const handleShowMoreAddress = (customerId) => {
    setShowFullAddress((prev) => ({
      ...prev,
      [customerId]: !prev[customerId]
    }))
  }

  const handleShowMoreEmail = (customerId) => {
    setShowFullEmail((prev) => ({
      ...prev,
      [customerId]: !prev[customerId]
    }))
  }

  const truncateText = (value, maxLength = 20) => {
    if (!value) return "-"
    return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value
  }

  const getPageTitle = () => {
    switch (selectedstatus) {
      case "ProductinfoMissing":
        return "Product Details Missing Customer List"
      case "ProductMissing":
        return "Product Missing Customer List"
      case "Deactive":
        return "Deactive Customer List"
      case "Running":
        return "Active Customer List"
      default:
        return "Customer List"
    }
  }

  const handleDownload = async () => {
    const response = await api.get(
      `/customer/downloadcustomerlistexcel?customerType=${selectedstatus}&branchselected=${selectedBranch}&searchTerm=${apiSearchTerm}`
    )

    const exportData = response.data.data
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Customer List")

    let headingText = ""
    let fileName = ""

    switch (selectedstatus) {
      case "Allcustomers":
        headingText = "All Customers"
        fileName = "AllCustomers_Report.xlsx"
        break
      case "ProductMissing":
        headingText = "Product Missing Customers"
        fileName = "ProductMissing_Customers.xlsx"
        break
      case "ProductinfoMissing":
        headingText = "Product Info Missing Customers"
        fileName = "ProductInfoMissing_Customers.xlsx"
        break
      case "Running":
        headingText = "Running Customers"
        fileName = "Running_Customers.xlsx"
        break
      case "Deactive":
        headingText = "Deactive Customer List"
        fileName = "DeactiveCustomerList_Report.xlsx"
        break
      default:
        headingText = "Customer Report"
        fileName = "Customer_Report.xlsx"
    }

    worksheet.mergeCells("A1:I1")
    const headingCell = worksheet.getCell("A1")
    headingCell.value = headingText
    headingCell.font = { size: 18, bold: true, color: { argb: "FFFFFFFF" } }
    headingCell.alignment = { horizontal: "center", vertical: "middle" }
    headingCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF305496" }
    }
    worksheet.getRow(1).height = 30

    worksheet.addRow([])

    worksheet.columns = [
      { header: "BRANCH NAME", key: "branchName", width: 20 },
      { header: "CUSTOMER NAME", key: "customerName", width: 25 },
      { header: "PRODUCT NAME", key: "productName", width: 20 },
      { header: "LICENSE NO", key: "licenseNo", width: 18 },
      { header: "ADDRESS", key: "address", width: 40 },
      { header: "PINCODE", key: "pincode", width: 10 },
      { header: "MOBILE", key: "mobile", width: 15 },
      { header: "EMAIL", key: "email", width: 35 },
      { header: "STATUS", key: "status", width: 12 }
    ]

    const headerRow = worksheet.getRow(3)
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" }
      }
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true
      }
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" }
      }
    })
    headerRow.height = 22

    exportData.forEach((customer) => {
      const row = worksheet.addRow({
        branchName: customer.branchName,
        customerName: customer.customerName,
        productName: customer.productName,
        licenseNo: customer.licenseNo,
        address: customer.address,
        pincode: customer.pincode,
        mobile: customer.mobile,
        email: customer.email,
        status: customer.status
      })

      row.eachCell((cell, colNumber) => {
        const key = worksheet.columns[colNumber - 1].key

        if (["address", "email", "customerName"].includes(key)) {
          cell.alignment = { wrapText: true, vertical: "top" }
        } else {
          cell.alignment = { horizontal: "center", vertical: "middle" }
        }

        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        }

        if (row.number % 2 === 0) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF2F2F2" }
          }
        }
      })
    })

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 3) row.height = 30
    })

    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    })
    saveAs(blob, fileName)
  }

  const isSearching =
    searchTerm.trim() !== apiSearchTerm.trim() ||
    (isFetching && !!searchTerm.trim())

  return (
    <div className="h-full overflow-hidden bg-[#ADD8E6] p-3 md:p-4">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="shrink-0 border-b border-slate-200 bg-gradient-to-r from-white via-slate-50 to-white px-4 py-4 md:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
                {getPageTitle()}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Manage customer records, filters, and exports.
              </p>
            </div>

            <div className="relative w-full max-w-md">
              <input
                type="text"
                value={searchTerm}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-4 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Search customer, product, mobile..."
              />
              {isSearching && (
                <p className="mt-1 text-xs text-blue-600">
                  Searching customers...
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-end gap-2">
              <TooltipIcon
                icon={FaUserPlus}
                tooltip="Add Customer"
                to={
                  user?.role === "Admin"
                    ? "/admin/masters/customerRegistration"
                    : "/staff/masters/customerRegistration"
                }
              />

              {userRole === "admin" && (
                <TooltipIcon
                  icon={FaRegFileExcel}
                  tooltip="Excel Download"
                  button
                  onClick={handleDownload}
                />
              )}

              <TooltipIcon icon={FaFilePdf} tooltip="PDF Download" button />
              <TooltipIcon icon={FaPrint} tooltip="Print" button />

              <BranchDropdown
                branches={userBranches}
                onBranchChange={handleBranchChange}
                branchSelected={selectedBranch}
                className="w-[180px]"
                controlClassName="h-8"
                label="Branch"
                labletrue
              />

              <CustomSelect
                value={selectedstatus}
                onChange={(value) => setselectedStatus(value)}
                options={[
                  { id: "Allcustomers", label: "All Customers" },
                  { id: "Running", label: "Active" },
                  { id: "Deactive", label: "Deactive" },
                  { id: "ProductinfoMissing", label: "Product Info Missing" },
                  { id: "ProductMissing", label: "Product Missing" }
                ]}
                className="w-[190px]"
                label="Customer Status"
                labletrue
              />
              {(selectedstatus !== "ProductinfoMissing" &&
                selectedstatus !== "ProductMissing") && (
                <CustomSelect
                  value={productType}
                  onChange={(value) => setproductType(value)}
                  options={[{ id: "All", label: "All" }, ...productOptions]}
                  className="w-[220px]"
                  label="Product Filter"
                  labletrue
                />
              )}
            </div>

            <div className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-blue-100">
              <span className="text-slate-500">Total</span>
              <span className="text-base font-semibold text-blue-700">
                {customerCount}
              </span>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 p-3 md:p-4">
          {isLoading ? (
            <SkeletonTable />
          ) : (
            <div
              onScroll={handleScroll}
              ref={containerRef}
              className="h-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-inner"
            >
              <table className="min-w-full bg-white">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="text-nowrap">
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      S.No
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Customer Name
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Product Name
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      License
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Address
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Pin Code
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Mobile
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Email
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="border-b border-slate-200 px-4 py-3 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer, index) => {
                      if (
                        !customer.selected ||
                        customer.selected.length === 0
                      ) {
                        return (
                          <tr
                            key={customer._id}
                            className="transition-colors hover:bg-slate-50"
                          >
                            <td className="px-4 py-3 text-sm text-slate-700">
                              {index + 1}
                            </td>
                            <td className="px-4 py-3 text-sm font-semibold uppercase text-slate-900">
                              {customer?.customerName}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-rose-600">
                              Missing Product
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-500">
                              -
                            </td>
                            <td className="max-w-xs px-4 py-3 text-sm text-slate-700">
                              {showFullAddress[customer?._id] ? (
                                <span>
                                  {customer?.address1}{" "}
                                  <button
                                    onClick={() =>
                                      handleShowMoreAddress(customer?._id)
                                    }
                                    className="font-medium text-blue-600 hover:text-blue-800"
                                  >
                                    Show less
                                  </button>
                                </span>
                              ) : (
                                <span>
                                  {truncateText(customer?.address1)}{" "}
                                  {customer?.address1?.length > 20 && (
                                    <button
                                      onClick={() =>
                                        handleShowMoreAddress(customer?._id)
                                      }
                                      className="font-medium text-blue-600 hover:text-blue-800"
                                    >
                                      ...more
                                    </button>
                                  )}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700">
                              {customer?.pincode}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700">
                              {customer?.mobile}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700">
                              {showFullEmail[customer?._id] ? (
                                <span>
                                  {customer?.email}{" "}
                                  <button
                                    onClick={() =>
                                      handleShowMoreEmail(customer?._id)
                                    }
                                    className="font-medium text-blue-600 hover:text-blue-800"
                                  >
                                    Show less
                                  </button>
                                </span>
                              ) : (
                                <span>
                                  {truncateText(customer?.email)}{" "}
                                  {customer?.email?.length > 20 && (
                                    <button
                                      onClick={() =>
                                        handleShowMoreEmail(customer?._id)
                                      }
                                      className="font-medium text-blue-600 hover:text-blue-800"
                                    >
                                      ...more
                                    </button>
                                  )}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                                No Status
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(
                                      userRole === "admin"
                                        ? "/admin/masters/customerEdit"
                                        : "/staff/masters/customerEdit",
                                      { state: { customerId: customer._id } }
                                    )
                                  }
                                  className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 hover:text-blue-800"
                                  title="Edit Customer"
                                >
                                  <CiEdit className="text-xl md:text-2xl" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      }

                      return customer.selected.map((item, itemIndex) => (
                        <tr
                          key={`${customer._id}-${item.licensenumber || itemIndex}-${itemIndex}`}
                          className="transition-colors hover:bg-slate-50"
                        >
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {itemIndex === 0 ? index + 1 : ""}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold uppercase text-slate-900">
                            {customer?.customerName}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {item?.productName || "-"}
                          </td>
                          <td className="px-4 py-3 font-mono text-sm text-slate-700">
                            {item?.licensenumber || "-"}
                          </td>
                          <td className="max-w-xs px-4 py-3 text-sm text-slate-700">
                            {showFullAddress[customer?._id] ? (
                              <span>
                                {customer?.address1}{" "}
                                <button
                                  onClick={() =>
                                    handleShowMoreAddress(customer?._id)
                                  }
                                  className="font-medium text-blue-600 hover:text-blue-800"
                                >
                                  Show less
                                </button>
                              </span>
                            ) : (
                              <span>
                                {truncateText(customer?.address1)}{" "}
                                {customer?.address1?.length > 20 && (
                                  <button
                                    onClick={() =>
                                      handleShowMoreAddress(customer?._id)
                                    }
                                    className="font-medium text-blue-600 hover:text-blue-800"
                                  >
                                    ...more
                                  </button>
                                )}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {customer?.pincode}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {customer?.mobile}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-700">
                            {showFullEmail[customer?._id] ? (
                              <span>
                                {customer?.email}{" "}
                                <button
                                  onClick={() =>
                                    handleShowMoreEmail(customer?._id)
                                  }
                                  className="font-medium text-blue-600 hover:text-blue-800"
                                >
                                  Show less
                                </button>
                              </span>
                            ) : (
                              <span>
                                {truncateText(customer?.email)}{" "}
                                {customer?.email?.length > 20 && (
                                  <button
                                    onClick={() =>
                                      handleShowMoreEmail(customer?._id)
                                    }
                                    className="font-medium text-blue-600 hover:text-blue-800"
                                  >
                                    ...more
                                  </button>
                                )}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center text-sm">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                                item?.isActive === "Running"
                                  ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                  : "bg-rose-50 text-rose-700 ring-rose-200"
                              }`}
                            >
                              {item?.isActive || "No Status"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    userRole === "admin"
                                      ? "/admin/masters/customerEdit"
                                      : "/staff/masters/customerEdit",
                                    {
                                      state: {
                                        customerId: customer._id,
                                        index: itemIndex
                                      }
                                    }
                                  )
                                }
                                className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50 hover:text-blue-800"
                                title="Edit Customer"
                              >
                                <CiEdit className="text-xl md:text-2xl" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="10"
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        {isFetching ? (
                          <div className="flex justify-center">
                            <PropagateLoader color="#3b82f6" size={10} />
                          </div>
                        ) : (
                          <div className="text-lg">No Data Found</div>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {isFetchingNextPage && (
                <div className="flex justify-center border-t border-slate-100 py-3">
                  <PropagateLoader color="#3b82f6" size={8} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomerListform
