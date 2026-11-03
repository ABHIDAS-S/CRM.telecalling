
import React, { useState, useEffect, useRef } from "react"
import api from "../../../api/api"
import UseFetch from "../../../hooks/useFetch"
import { toast } from "react-toastify"

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html,
  body,
  #root {
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .cn-root {
    width: 100%;
    height: 91vh;
    overflow: hidden;
    background: #ADD8E6;
    padding: 18px;
    font-family: 'DM Sans', sans-serif;
  }

  /* ───────────────── MAIN CONTAINER ───────────────── */

  .cn-container {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    overflow: hidden;
  }

  /* FIXED INNER CARD */

  .cn-fixed-wrapper {
    width: 100%;
    max-width: 100%;
    height: 100%;
    overflow: hidden;
    background: #ffffff;
    border-radius: 24px;
    box-shadow: 0 10px 35px rgba(0,0,0,.08);
    display: flex;
    flex-direction: column;
  }

  /* ───────────────── HEADER ───────────────── */

  .cn-header {
    position: sticky;
    top: 0;
    z-index: 40;
    flex-shrink: 0;
    height: 62px;
    background: #1a1d2e;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 0 24px;
  }

  .cn-header-icon {
    display: none;
    border: none;
    background: transparent;
    color: #ffffff;
    cursor: pointer;
  }

  @media (max-width: 768px) {
    .cn-header-icon {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .cn-header-title {
    color: #ffffff;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: .5px;
  }

  .cn-header-badge {
    margin-left: auto;
    background: rgba(99,102,241,.25);
    color: #c7d2fe;
    padding: 4px 10px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .5px;
    text-transform: uppercase;
  }

  /* ───────────────── BODY ───────────────── */

  .cn-body {
    flex: 1;
    overflow: hidden;
    padding: 18px;
    background: #f4f7fb;
    display: flex;
    flex-direction: column;
    min-height: 0;
// max-width: 800px;

  }
// .cn-body {
//   flex: 1;
//   overflow: hidden;
//   padding: 18px;
//   background: #f4f7fb;
//   display: flex;
//   flex-direction: column;
//   min-height: 0;
//   max-width: 800px;

//   /* ADD THESE */
//   width: 100%;
//   margin: 0 auto;
// }

  /* ───────────────── CARD ───────────────── */

  .cn-card {
    flex: 1;
    min-height: 0;
    background: #ffffff;
    border: 1px solid #e6ebf3;
    border-radius: 18px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
width:63%;
  

  margin: 0 auto;
  }

  /* ───────────────── INPUT SECTION ───────────────── */

  .cn-input-section {
    flex-shrink: 0;
    padding: 22px;
    border-bottom: 1px solid #edf1f7;
    background: #ffffff;
  }

  .cn-section-label {
    font-size: 11px;
    font-weight: 700;
    color: #7c8db0;
    margin-bottom: 14px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .cn-input-row {
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .cn-input {
    flex: 1;
    height: 44px;
    border: 1.5px solid #dfe5ef;
    border-radius: 10px;
    padding: 0 14px;
    background: #f8f9fc;
    outline: none;
    font-size: 14px;
    transition: .2s;
  }

  .cn-input:focus {
    border-color: #6366f1;
    background: #ffffff;
    box-shadow: 0 0 0 4px rgba(99,102,241,.12);
  }

  .cn-btn {
    height: 44px;
    border: none;
    border-radius: 10px;
    padding: 0 20px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: .2s;
    white-space: nowrap;
  }

  .cn-btn-submit {
    background: #6366f1;
    color: #ffffff;
  }

  .cn-btn-submit:hover {
    background: #4f46e5;
  }

  .cn-btn-cancel {
    background: #eef1f6;
    color: #4b5563;
  }

  .cn-btn-cancel:hover {
    background: #e2e8f0;
  }

  /* ───────────────── TABLE SECTION ───────────────── */

  .cn-table-section {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .cn-table-header {
    flex-shrink: 0;
    padding: 16px 22px;
    background: #f8f9fc;
    border-bottom: 1px solid #edf1f7;
  }

  .cn-table-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #374151;
    font-size: 13px;
    font-weight: 600;
  }

  .cn-count-badge {
    background: #e5e7eb;
    color: #4b5563;
    border-radius: 999px;
    padding: 2px 9px;
    font-size: 11px;
    font-family: 'DM Mono', monospace;
  }

  /* ONLY TABLE SCROLL */

  .cn-table-wrap {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .cn-table-wrap::-webkit-scrollbar {
    width: 8px;
  }

  .cn-table-wrap::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 20px;
  }

  .cn-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
  }

  .cn-table thead th {
    position: sticky;
    top: 0;
    z-index: 40;
    background: #f8f9fc;
    padding: 14px 18px;
    border-bottom: 1px solid #e5e7eb;
    font-size: 11px;
    font-weight: 700;
    color: #94a3b8;
    letter-spacing: .7px;
    text-transform: uppercase;
  }

  .cn-table tbody tr {
    border-bottom: 1px solid #f1f5f9;
    transition: .15s;
  }

  .cn-table tbody tr:hover {
    background: #fafbff;
  }

  .cn-table td {
    padding: 14px 18px;
    font-size: 13px;
    color: #1e293b;
    vertical-align: middle;
  }

  .cn-table th:first-child,
  .cn-table td:first-child {
    width: 72%;
    text-align: left;
  }

  .cn-table th:nth-child(2),
  .cn-table td:nth-child(2) {
    width: 14%;
    text-align: center;
  }

  .cn-table th:nth-child(3),
  .cn-table td:nth-child(3) {
    width: 14%;
    text-align: center;
  }

  /* ───────────────── ITEM ───────────────── */

  .cn-item-name {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .cn-item-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #6366f1;
    flex-shrink: 0;
  }

  .cn-item-text {
    word-break: break-word;
    font-weight: 500;
  }

  /* ───────────────── ACTIONS ───────────────── */

  .cn-actions {
    display: flex;
    justify-content: center;
  }

  .cn-action-btn {
    width: 34px;
    height: 34px;
    border: none;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: .15s;
  }

  .cn-action-edit {
    background: #eef2ff;
    color: #6366f1;
  }

  .cn-action-edit:hover {
    background: #dfe5ff;
  }

  .cn-action-delete {
    background: #fff1f2;
    color: #f43f5e;
  }

  .cn-action-delete:hover {
    background: #ffe4e6;
  }

  /* ───────────────── EMPTY ───────────────── */

  .cn-empty {
    padding: 70px 20px;
    text-align: center;
  }

  .cn-empty-icon {
    font-size: 34px;
    margin-bottom: 12px;
  }

  .cn-empty-text {
    color: #64748b;
    font-size: 14px;
    font-weight: 600;
  }

  /* ───────────────── MOBILE ───────────────── */

  @media (max-width: 768px) {

    .cn-root {
      padding: 10px;
    }

    .cn-fixed-wrapper {
      border-radius: 18px;
    }

    .cn-body {
      padding: 10px;
    }

    .cn-input-row {
      flex-direction: column;
      align-items: stretch;
    }

    .cn-input,
    .cn-btn {
      width: 100%;
    }

    .cn-table th,
    .cn-table td {
      padding: 12px;
    }

    .cn-table th:first-child,
    .cn-table td:first-child {
      width: 60%;
    }

    .cn-table th:nth-child(2),
    .cn-table td:nth-child(2),
    .cn-table th:nth-child(3),
    .cn-table td:nth-child(3) {
      width: 20%;
    }
  }
`

const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

const MenuIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)

export const CallNoteRegistration = ({ onToggleSidebar }) => {

  const [value, setValue] = useState("")
  const [items, setItems] = useState([])
  const [isEditing, setIsEditing] = useState(false)
  const [editId, setEditId] = useState(null)

  const inputRef = useRef(null)

  const { data, refreshHook } = UseFetch("/customer/getallcallNotes")

  useEffect(() => {
    if (data) {
      setItems(data)
    }
  }, [data])

  const resetForm = () => {
    setValue("")
    setIsEditing(false)
    setEditId(null)
  }

  const handleEdit = (id) => {

    const item = items.find((i) => i._id === id)

    if (!item) return

    setValue(item.callNotes)
    setEditId(id)
    setIsEditing(true)

    inputRef.current?.focus()
  }

  const handleDelete = async (id) => {

    try {

      await api.delete(`/customer/callnoteDelete?id=${id}`)

      setItems((prev) => prev.filter((i) => i._id !== id))

      toast.success("Call note deleted successfully")

    } catch {

      toast.error("Failed to delete")
    }
  }

  const handleSubmit = async () => {

    const trimmed = value.trim()

    if (!trimmed) {
      toast.error("Call note cannot be empty")
      inputRef.current?.focus()
      return
    }

    const formData = {
      callNotes: trimmed
    }

    try {

      if (isEditing && editId) {

        await api.put(
          `/customer/callnotesEdit?id=${editId}`,
          formData
        )

        toast.success("Call note updated successfully")

      } else {

        await api.post(
          "/customer/callnotesRegistration",
          formData
        )

        toast.success("Call note added successfully")
      }

      resetForm()
      refreshHook()

    } catch {

      toast.error("Something went wrong")
    }
  }

  return (
    <>
      <style>{styles}</style>

      <div className="cn-root">

        <div className="cn-container">

          <div className="cn-fixed-wrapper">

            <header className="cn-header">

              <button
                className="cn-header-icon"
                onClick={onToggleSidebar}
              >
                <MenuIcon />
              </button>

              <span className="cn-header-title">
                Manage Call Notes
              </span>

              <span className="cn-header-badge">
                Customer
              </span>

            </header>

            <div className="cn-body">

              <div className="cn-card">

                <div className="cn-input-section">

                  <p className="cn-section-label">
                    {isEditing ? "Edit Call Note" : "Add New Call Note"}
                  </p>

                  <div className="cn-input-row">

                    <input
                      ref={inputRef}
                      type="text"
                      className="cn-input"
                      placeholder="Enter call note..."
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    />

                    <button
                      className="cn-btn cn-btn-submit"
                      onClick={handleSubmit}
                    >
                      {isEditing ? "Update" : "Add Call Note"}
                    </button>

                    {isEditing && (
                      <button
                        className="cn-btn cn-btn-cancel"
                        onClick={resetForm}
                      >
                        Cancel
                      </button>
                    )}

                  </div>

                </div>

                <div className="cn-table-section">

                  <div className="cn-table-header">

                    <span className="cn-table-title">
                      All Call Notes

                      <span className="cn-count-badge">
                        {items.length}
                      </span>
                    </span>

                  </div>

                  <div className="cn-table-wrap">

                    <table className="cn-table">

                      <thead>
                        <tr>
                          <th>Call Note</th>
                          <th>Edit</th>
                          <th>Delete</th>
                        </tr>
                      </thead>

                      <tbody>

                        {items.length === 0 ? (

                          <tr>
                            <td colSpan="3">

                              <div className="cn-empty">

                                <div className="cn-empty-icon">
                                  📂
                                </div>

                                <div className="cn-empty-text">
                                  No Call Notes Found
                                </div>

                              </div>

                            </td>
                          </tr>

                        ) : (

                          items.map((el) => (

                            <tr key={el._id}>

                              <td>

                                <div className="cn-item-name">

                                  <span className="cn-item-dot" />

                                  <span className="cn-item-text">
                                    {el.callNotes}
                                  </span>

                                </div>

                              </td>

                              <td>

                                <div className="cn-actions">

                                  <button
                                    className="cn-action-btn cn-action-edit"
                                    onClick={() => handleEdit(el._id)}
                                  >
                                    <PencilIcon />
                                  </button>

                                </div>

                              </td>

                              <td>

                                <div className="cn-actions">

                                  <button
                                    className="cn-action-btn cn-action-delete"
                                    onClick={() => handleDelete(el._id)}
                                  >
                                    <TrashIcon />
                                  </button>

                                </div>

                              </td>

                            </tr>

                          ))

                        )}

                      </tbody>

                    </table>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </>
  )
}