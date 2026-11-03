import { useState, useEffect, useMemo, useRef } from "react"
import DeleteAlert from "../../../components/common/DeleteAlert"
import BarLoader from "react-spinners/BarLoader"
import Edit from "../../../components/common/Edit"
import api from "../../../api/api"
import UseFetch from "../../../hooks/useFetch"
import { toast } from "react-toastify"

const partnerStyles = `
  .pr-root, .pr-root * { box-sizing: border-box; }
  .pr-root { height: calc(100dvh - 74px); min-height: 0; max-height: calc(100dvh - 74px); overflow: hidden; background: #ADD8E6; padding: 10px; font-family: 'DM Sans', sans-serif; }
  .pr-shell { height: 100%; min-height: 0; overflow: hidden; border-radius: 18px; background: #fff; box-shadow: 0 8px 24px rgba(15, 23, 42, .08); display: flex; flex-direction: column; }
  .pr-header { height: 50px; flex-shrink: 0; display: flex; align-items: center; gap: 14px; padding: 0 18px; background: #1a1d2e; }
  .pr-title { color: #fff; font-size: 15px; font-weight: 600; letter-spacing: .5px; }
  .pr-badge { margin-left: auto; border-radius: 999px; padding: 4px 10px; background: rgba(99,102,241,.25); color: #c7d2fe; font-size: 11px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; }
  .pr-body { flex: 1; min-height: 0; overflow: hidden; padding: 10px; background: #f4f7fb; }
  .pr-card { height: 100%; min-height: 0; overflow: hidden; display: flex; flex-direction: column; border: 1px solid #e6ebf3; border-radius: 14px; background: #fff; }
  .pr-form { flex-shrink: 0; padding: 12px 14px; border-bottom: 1px solid #edf1f7; }
  .pr-label { margin-bottom: 8px; color: #7c8db0; font-size: 10px; font-weight: 700; letter-spacing: .8px; text-transform: uppercase; }
  .pr-form-grid { display: grid; grid-template-columns: minmax(180px, 1.1fr) minmax(180px, 1fr) minmax(210px, 1.2fr) auto; gap: 10px; align-items: start; }
  .pr-input, .pr-select, .pr-branch-trigger { width: 100%; height: 38px; border: 1.5px solid #dfe5ef; border-radius: 8px; padding: 0 11px; background: #f8f9fc; color: #1e293b; font-size: 13px; outline: none; transition: .2s; }
  .pr-input:focus, .pr-select:focus, .pr-branch-trigger:focus { border-color: #6366f1; background: #fff; box-shadow: 0 0 0 4px rgba(99,102,241,.12); }
  .pr-branch-trigger { display: flex; align-items: center; justify-content: space-between; text-align: left; cursor: pointer; }
  .pr-branch-menu { position: absolute; z-index: 50; top: calc(100% + 6px); left: 0; right: 0; max-height: 220px; overflow-y: auto; border: 1px solid #e2e8f0; border-radius: 10px; background: #fff; padding: 6px; box-shadow: 0 12px 24px rgba(15,23,42,.12); }
  .pr-branch-option { display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 7px; color: #475569; font-size: 13px; cursor: pointer; }
  .pr-branch-option:hover { background: #f8fafc; }
  .pr-submit, .pr-cancel { height: 38px; border: 0; border-radius: 8px; padding: 0 14px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: .2s; }
  .pr-submit { background: #6366f1; color: #fff; }.pr-submit:hover { background: #4f46e5; }
  .pr-cancel { background: #eef1f6; color: #4b5563; }.pr-cancel:hover { background: #e2e8f0; }
  .pr-error { margin-top: 5px; color: #ef4444; font-size: 11px; }
  .pr-table-section { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
  .pr-table-header { display: flex; align-items: center; padding: 10px 14px; border-bottom: 1px solid #edf1f7; background: #f8f9fc; }
  .pr-table-title { color: #374151; font-size: 13px; font-weight: 600; }.pr-count { margin-left: 8px; border-radius: 999px; padding: 2px 9px; background: #e5e7eb; color: #4b5563; font-size: 11px; }
  .pr-table-wrap { flex: 1; min-height: 0; overflow: auto; }.pr-table { width: 100%; min-width: 720px; border-collapse: collapse; table-layout: fixed; }
  .pr-table th { position: sticky; top: 0; z-index: 2; padding: 10px 14px; border-bottom: 1px solid #e5e7eb; background: #f8f9fc; color: #94a3b8; font-size: 10px; font-weight: 700; letter-spacing: .6px; text-align: left; text-transform: uppercase; }
  .pr-table th:nth-last-child(-n+2), .pr-table td:nth-last-child(-n+2) { width: 76px; text-align: center; }
  .pr-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: .15s; }.pr-table tbody tr:hover { background: #fafbff; }
  .pr-table td { padding: 9px 14px; color: #1e293b; font-size: 12px; vertical-align: middle; }.pr-partner { display: flex; align-items: center; gap: 8px; font-weight: 600; }.pr-dot { width: 7px; height: 7px; flex-shrink: 0; border-radius: 50%; background: #6366f1; }
  .pr-empty { padding: 40px 20px; text-align: center; color: #64748b; font-size: 13px; font-weight: 600; }
  @media (max-width: 900px) { .pr-root { height: calc(100dvh - 64px); max-height: calc(100dvh - 64px); padding: 10px; }.pr-shell { border-radius: 18px; }.pr-body { padding: 10px; }.pr-form-grid { grid-template-columns: 1fr 1fr; }.pr-submit, .pr-cancel { width: 100%; } }
  @media (max-width: 560px) { .pr-header { padding: 0 16px; }.pr-form { padding: 16px; }.pr-form-grid { grid-template-columns: 1fr; }.pr-table-header { padding: 14px 16px; } }
`
export const PartnerRegistration = () => {
  // const [value, setValue] = useState("")
  const [items, setItems] = useState([])
  const [loader, setLoader] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [submitError, setSubmiterror] = useState("")
  const [selectedCompany, setSelectedCompany] = useState("")
  const [editState, seteditState] = useState(true)
  const [editId, setEditId] = useState("")
  const [formData, setFormData] = useState({
    partnerName: "",
    companyName: "",
    branchName: ""
  })

  const dropdownbranchRef = useRef(null)

  const { data: companyData } = UseFetch(
    "/company/getCompany"
  )
  const { data, refreshHook } = UseFetch(
    "/customer/getallpartners"
  )
  useEffect(() => {
    if (data) {
      setItems(data)
    }
  }, [data])
  useEffect(() => {
    const defaultCompany = companyData?.find(
      (company) => company.selectedCompany
    )
    if (defaultCompany) {
      setFormData((prev) => ({
        ...prev,
        companyName: defaultCompany._id
      }))
      setSelectedCompany(defaultCompany._id)
    }
  }, [companyData])
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownbranchRef.current &&
        !dropdownbranchRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])
  const filteredBranches = useMemo(
    () =>
      companyData?.find((company) => company._id === selectedCompany)
        ?.branches || [],
    [companyData, selectedCompany]
  )
  const partnerRows = useMemo(
    () =>
      items.flatMap((partnerItem) =>
        (partnerItem?.relationBranches || []).map((relation) => ({
          partnerId: partnerItem._id,
          partnerName: partnerItem.partner,
          relation,
          relationCount: partnerItem.relationBranches?.length || 0
        }))
      ),
    [items]
  )

  const handleEdit = (id) => {
    seteditState(false)
    const itemToEdit = items.find((item) => item._id === id)

const branches=itemToEdit.relationBranches.map((item)=>item.branchName?._id)
    if (itemToEdit) {
      setFormData((prev) => ({ ...prev, partnerName: itemToEdit.partner,companyName:itemToEdit.relationBranches[0]?.companyName?._id,branchName:branches }))
      setEditId(id)

      // Store the ID of the brand being edited
    }
  }
  const handleDelete = async (id) => {

    try {
      const response = await api.delete(`/customer/partnerDelete?id=${id}`)

      // Remove the deleted item from the items array
      setItems((prevItems) => prevItems.filter((item) => item._id !== id))
      toast.success(response.data.message)
      return true
    } catch (error) {
      console.error("Failed to delete item", error)
      toast.error("Failed to delete item. Please try again.")
      return false
    }
  }
  const handleBranchDelete = async (id, branchId) => {
    try {
      const response = await api.delete(
        `/customer/partnerBranchDelete?branchId=${branchId}&docId=${id}`
      )
      toast.success(response.data.message)
      setItems(response.data.data)
      return true
    } catch (error) {
      toast.error("Failed to delete item. Please try again.")
      console.log(error.message)
      return false
    }
  }

  // const handleChange = (e) => {
  //   setValue(e.target.value)
  // }

  const handleSubmit = async () => {
    const newError = {}
    if (formData.partnerName === "")
      newError.partnerError = "Partner Name is required"
    if (formData.companyName === "")
      newError.companyError = "Company is required"
    if (
      !formData.branchName || // covers undefined, null, empty string, empty array
      (Array.isArray(formData.branchName) && formData.branchName.length === 0)
    )
      newError.branchError = "Branch is required"
    if (Object.keys(newError).length > 0) {
      setSubmiterror(newError)
      return
    }
  
    const isDuplicate = formData.branchName.some((newBranchId) => {
      return items.some(
        (item) =>
          item.partner === formData.partnerName &&
          item.relationBranches.some(
            (rb) =>
              rb.companyName._id === formData.companyName &&
              rb.branchName._id === newBranchId
          )
      )
    })
    if (isDuplicate) {
      setSubmiterror((prev) => ({
        ...prev,
        duplicateError: "Already Exist"
      }))
      return
    }

    try {
      setLoader(true)
      if (editId) {
        // Update the existing item

        await api.put(`/customer/partnerEdit?id=${editId}`, formData)

        toast.success("Partner updated successfully")
        seteditState(true)
      } else {
        // Create a new item

        await api.post("/customer/partnerRegistration", formData)

        toast.success("partner created successfully")
      }

      refreshHook()
      setFormData({
        partnerName: "",
        companyName: selectedCompany,
        branchName: []
      })
      setEditId(null)
      setLoader(false)
    } catch (error) {
      console.error(error)
      toast.error("Something went wrong")
      setLoader(false)
    }
  }
  return (
    <>
      <style>{partnerStyles}</style>
      <div className="pr-root">
        <div className="pr-shell">
          <header className="pr-header">
            <span className="pr-title">Manage Partners</span>
            <span className="pr-badge">Customer</span>
          </header>
          <div className="pr-body">
            <div className="pr-card">
      {loader && (
        <BarLoader
          cssOverride={{ width: "100%", height: "4px" }}
          color="#6366f1"
        />
      )}
      <div className="pr-form">
        <p className="pr-label">{editId ? "Edit Partner" : "Add New Partner"}</p>
      <div className="md:flex md:items-start">
        <div className="grid grid-cols-1 md:grid-cols-4 w-full gap-3 mb-2">
          {/* Partner Name Input */}
          <div className="flex flex-col w-full">
            <input
              type="text"
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  partnerName: e.target.value
                }))
                setSubmiterror((prev) => ({
                  ...prev,
                  partnerError: "",
                  duplicateError: ""
                }))
              }}
              placeholder="Enter your brand name"
              className="pr-input"
              value={formData.partnerName || ""}
            />
            {submitError.partnerError && (
              <p className="text-red-500 text-sm">{submitError.partnerError}</p>
            )}
          </div>

          {/* Company Select */}
          <div className="flex flex-col w-full ">
            <select
              className="pr-select"
              value={selectedCompany || ""}
              onChange={(e) => {
                const companyName = e.target.value
                setSelectedCompany(companyName)
                setFormData((prev) => ({
                  ...prev,
                  companyName,
                  branchName: []
                }))
                setSubmiterror({})
              }}
            >
              <option value="">Select Company</option>
              {companyData?.map((company) => (
                <option key={company._id} value={company._id}>
                  {company.companyName}
                </option>
              ))}
            </select>
            {submitError.companyError && (
              <p className="text-red-500 text-sm">{submitError.companyError}</p>
            )}
          </div>

          <div className=" w-full relative" ref={dropdownbranchRef}>
            <div
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="pr-branch-trigger"
            >
              <span>
                {Array.isArray(formData.branchName) && formData.branchName.length
                  ? `${formData.branchName.length} branch${
                      formData.branchName.length > 1 ? "es" : ""
                    } selected`
                  : "Select Branch"}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transform transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : "rotate-0"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            {submitError.branchError && (
              <p className="text-red-500 text-sm">{submitError.branchError}</p>
            )}
            {isDropdownOpen && (
              <div className="pr-branch-menu">
                {filteredBranches?.map((branch) => (
                  <label
                    key={branch._id}
                    className="pr-branch-option"
                  >
                    <input
                      type="checkbox"
                      className="h-3 w-3"
                      value={branch._id}
                      checked={formData.branchName?.includes(branch._id)}
                      onChange={(e) => {
                        const isChecked = e.target.checked
                        setFormData((prev) => {
                          const prevSelected = prev.branchName || []
                          return {
                            ...prev,
                            branchName: isChecked
                              ? [...prevSelected, branch._id] // add
                              : prevSelected.filter((id) => id !== branch._id) // remove
                          }
                        })
                        setSubmiterror((prev) => ({
                          ...prev,
                          branchError: "",
                          duplicateError: ""
                        }))
                      }}
                      disabled={!selectedCompany}
                    />
                    <span>{branch.branchName}</span>
                  </label>
                ))}
              </div>
            )}

            {/* {submitError.branchError && (
              <p className="text-red-500 text-sm">{submitError.branchError}</p>
            )} */}
          </div>
        </div>
        <div className="flex md:justify-end">
          <button
            onClick={handleSubmit}
            className="pr-submit"
          >
            {editState ? "ADD" : "UPDATE"}
          </button>
        </div>
      </div>
      <div className="text-center">
        {submitError.duplicateError && (
          <p className="text-red-500">{submitError.duplicateError}</p>
        )}
      </div>

      </div>

      <section className="pr-table-section">
          <div className="pr-table-header">
            <span className="pr-table-title">All Partners <span className="pr-count">{partnerRows.length}</span></span>
          </div>
              <div className="pr-table-wrap">
                <table className="pr-table">
                  <thead>
                    <tr>
                      <th>
                        SNO.
                      </th>
                      <th>
                        Partner
                      </th>
                      <th>
                        Company Name
                      </th>
                      <th>
                        Branch Name
                      </th>
                      <th>
                        Edit
                      </th>
                      <th>
                        Delete
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {partnerRows.length === 0 ? (
                      <tr>
                        <td colSpan="6">
                          <div className="pr-empty">No partners found</div>
                        </td>
                      </tr>
                    ) : items?.map((el, Index) =>
                      el.relationBranches.map((item, index) => (
                        <tr key={`${el._id}-${index}`}>
                          <td>
                            {index === 0 ? Index + 1 : ""}
                          </td>
                          <td>
                            <div className="pr-partner">
                              <span className="pr-dot" />
                              <span>{el.partner}</span>
                            </div>
                          </td>
                          <td>
                            {item?.companyName?.companyName}
                          </td>
                          <td>
                            {item?.branchName?.branchName}
                          </td>
                          <td>
                            <div className="flex justify-center">
                              <Edit onEdit={handleEdit} Id={el._id} />
                            </div>
                          </td>
                          <td>
                            <div className="flex justify-center">
                              {el.relationBranches.length === 1 ? (
                                // Only one branch, delete whole partner
                                <DeleteAlert
                                  onDelete={handleDelete}
                                  Id={el._id}
                                />
                              ) : (
                                // Multiple branches, delete only this branch
                                <DeleteAlert
                                  onDelete={handleBranchDelete}
                                  Id={el._id}
                                  branchId={item.branchName?._id}
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
        </section>

            </div>
          </div>
        </div>
      </div>
    </>
  )
}
