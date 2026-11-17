
import { useState, useEffect, useCallback } from "react"
import api from "../../../api/api"
import { toast } from "react-toastify"
import UseFetch from "../../../hooks/useFetch"
import BarLoader from "react-spinners/BarLoader"

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */

const styles = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap');

.tr-root * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.tr-root {
  font-family: 'DM Sans', sans-serif;

  width: 100%;
  height: 100%;

  background: #ADD8E6;

  padding: 20px;

  overflow: hidden;

  color: #1a1d2e;
}

.tr-container {
  width: 100%;
  height: 100%;

  display: flex;
  flex-direction: column;

  overflow: hidden;

  border-radius: 24px;

  min-height: 0;
}

/* HEADER */

.tr-header {
  background: #1a1d2e;

  padding: 18px 28px;

  display: flex;
  align-items: center;

  flex-shrink: 0;

  border-radius: 24px 24px 0 0;

  box-shadow: 0 1px 0 rgba(255,255,255,.08);
}

.tr-header-title {
  font-size: 15px;
  font-weight: 600;

  color: #ffffff;

  letter-spacing: .5px;
}

.tr-header-badge {
  margin-left: auto;

  background: rgba(99,102,241,.25);

  color: #a5b4fc;

  font-size: 11px;
  font-weight: 600;

  padding: 3px 10px;

  border-radius: 20px;

  letter-spacing: .4px;

  text-transform: uppercase;
}

/* BODY */

.tr-body {
  flex: 1;

  background: #ffffff;

  border-radius: 0 0 24px 24px;

  overflow: hidden;

  display: flex;
  flex-direction: column;

  padding: 20px;

  min-height: 0;
}

/* CARD */

.tr-card {
  width: 63%;
  margin: 0 auto;

  flex: 1;

  background: #ffffff;

  border-radius: 20px;

  overflow: hidden;

  display: flex;
  flex-direction: column;

  border: 1px solid #e8eaf0;

  box-shadow: 0 2px 12px rgba(0,0,0,.05);

  min-height: 0;
}

/* INPUT SECTION */

.tr-input-section {
  padding: 28px 28px 24px;

  border-bottom: 1px solid #f0f1f5;
}

.tr-section-label {
  font-size: 11.5px;

  font-weight: 600;

  letter-spacing: 1px;

  text-transform: uppercase;

  color: #7c8db0;

  margin-bottom: 14px;
}

.tr-input-row {
  display: flex;

  gap: 10px;

  align-items: center;

  flex-wrap: wrap;
}

.tr-input {
  flex: 1;

  min-width: 200px;

  height: 42px;

  padding: 0 14px;

  border: 1.5px solid #e2e5ee;

  border-radius: 8px;

  font-size: 14px;

  font-family: 'DM Sans', sans-serif;

  color: #1a1d2e;

  background: #f8f9fc;

  outline: none;

  transition: border-color .2s, box-shadow .2s, background .2s;
}

.tr-input:focus {
  border-color: #6366f1;

  background: #fff;

  box-shadow: 0 0 0 3px rgba(99,102,241,.12);
}

.tr-input::placeholder {
  color: #b0b8cc;
}

/* BUTTONS */

.tr-btn {
  height: 42px;

  padding: 0 22px;

  border: none;

  border-radius: 8px;

  font-size: 13px;

  font-weight: 600;

  cursor: pointer;

  letter-spacing: .3px;

  transition: background .18s, transform .12s, box-shadow .18s;

  white-space: nowrap;
}

.tr-btn:active {
  transform: scale(.97);
}

.tr-btn-submit {
  background: #6366f1;

  color: #fff;

  box-shadow: 0 2px 8px rgba(99,102,241,.25);
}

.tr-btn-submit:hover {
  background: #4f46e5;

  box-shadow: 0 4px 14px rgba(99,102,241,.35);
}

.tr-btn-cancel {
  background: #f1f2f6;

  color: #5a6279;
}

.tr-btn-cancel:hover {
  background: #e8eaf0;
}

/* TABLE SECTION */

.tr-table-section {
  display: flex;
  flex-direction: column;

  flex: 1;

  min-height: 0;

  overflow: hidden;
}

.tr-table-header {
  padding: 14px 28px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  background: #f8f9fc;

  border-bottom: 1px solid #f0f1f5;
}

.tr-table-title {
  font-size: 13px;
  font-weight: 600;

  color: #3d4566;

  display: flex;
  align-items: center;
  gap: 8px;
}

.tr-count-badge {
  background: #e8eaf0;

  color: #5a6279;

  border-radius: 20px;

  padding: 2px 9px;

  font-size: 11.5px;
  font-weight: 600;

  font-family: 'DM Mono', monospace;
}

/* TABLE WRAP */

.tr-table-wrap {
  flex: 1;

  min-height: 0;

  overflow-y: auto;
  overflow-x: auto;
}

/* TABLE */

.tr-table {
  width: 100%;

  border-collapse: collapse;

  table-layout: fixed;

  font-size: 13.5px;
}

.tr-table thead tr {
  background: #f8f9fc;

  border-bottom: 1px solid #e8eaf0;
}

.tr-table thead th {
  position: sticky;

  top: 0;

  z-index: 5;

  background: #f8f9fc;
}

.tr-table th,
.tr-table td {
  padding: 13px 20px;

  vertical-align: middle;
}

.tr-table th {
  font-size: 11px;

  font-weight: 700;

  letter-spacing: .8px;

  text-transform: uppercase;

  color: #9099b3;
}

.tr-table td {
  color: #2d3352;
}

.tr-table tbody tr {
  border-bottom: 1px solid #f3f4f8;

  transition: background .15s;
}

.tr-table tbody tr:hover {
  background: #fafbff;
}

/* COLUMNS */

.tr-col-task {
  width: 60%;
  text-align: left;
}

.tr-col-edit {
  width: 20%;
  text-align: center;
}

.tr-col-delete {
  width: 20%;
  text-align: right;
}

/* ITEM */

.tr-item-name {
  display: flex;

  align-items: center;

  gap: 10px;
}

.tr-item-dot {
  width: 8px;
  height: 8px;

  border-radius: 50%;

  background: #6366f1;

  opacity: .55;

  flex-shrink: 0;
}

.tr-item-text {
  font-weight: 500;

  color: #1a1d2e;
}

/* ACTIONS */

.tr-actions {
  display: flex;

  align-items: center;
}

.tr-actions-center {
  justify-content: center;
}

.tr-actions-right {
  justify-content: flex-end;
}

.tr-action-btn {
  width: 32px;
  height: 32px;

  border-radius: 7px;

  border: none;

  cursor: pointer;

  display: flex;
  align-items: center;
  justify-content: center;

  transition: background .15s, transform .12s;

  font-size: 14px;
}

.tr-action-btn:hover {
  transform: scale(1.05);
}

.tr-action-edit {
  background: #eef2ff;

  color: #6366f1;
}

.tr-action-delete {
  background: #fff1f2;

  color: #f43f5e;
}

/* EMPTY */

.tr-empty {
  padding: 56px 20px;

  text-align: center;

  color: #9099b3;
}

.tr-empty-icon {
  font-size: 36px;

  margin-bottom: 12px;

  opacity: .55;
}

.tr-empty-text {
  font-size: 14px;

  font-weight: 500;
}

.tr-empty-sub {
  font-size: 12.5px;

  margin-top: 4px;

  color: #b0b8cc;
}

/* MOBILE */

@media (max-width: 600px) {

  .tr-root {
    padding: 12px;
  }

  .tr-body {
    padding: 12px;
  }

  .tr-input-row {
    flex-direction: column;

    align-items: stretch;
  }

  .tr-btn,
  .tr-input {
    width: 100%;

    min-width: unset;
  }

  .tr-input-section {
    padding: 20px 18px;
  }

  .tr-table th,
  .tr-table td {
    padding: 11px 14px;
  }
}
`

/* ICONS */

const PencilIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const TrashIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)

/* COMPONENT */

export default function TaskRegistration() {

  const [value, setValue] = useState("")
  const [items, setItems] = useState([])
  const [editId, setEditId] = useState(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)

  const { data, loading, refreshHook } =
    UseFetch("/lead/getallTask")

  useEffect(() => {
    setItems(data || [])
  }, [data])

  /* EDIT */

  const handleEdit = useCallback((id) => {

    const itemToEdit = items.find(
      (item) => item._id === id
    )

    if (itemToEdit) {

      setValue(
        itemToEdit.task ||
        itemToEdit.taskName ||
        ""
      )

      setEditId(id)

      setIsEditMode(true)
    }

  }, [items])

  /* DELETE */

  const handleDelete = async (id) => {

    try {

      await api.delete(`/lead/taskDelete?id=${id}`)

      setItems((prev) =>
        prev.filter((item) => item._id !== id)
      )

      toast.success("Task deleted successfully")

    } catch (error) {

      console.log(error)

      toast.error("Failed to delete task")
    }
  }

  /* SUBMIT */

  const handleSubmit = async () => {

    if (!value.trim()) {
      toast.error("Task name is required")
      return
    }

    setLoadingSubmit(true)

    try {

      const payload = {
        task: value.trim()
      }

      if (editId) {

        await api.put(
          `/lead/taskEdit?id=${editId}`,
          payload
        )

        toast.success("Task updated successfully")

      } else {
console.log("hhh")
        await api.post(
          "/lead/taskRegistration",
          payload
        )
console.log("hh")
        toast.success("Task created successfully")
console.log("hhh")
      }

      refreshHook()

      setValue("")
      setEditId(null)
      setIsEditMode(false)

    } catch (error) {

      console.log(error)

      toast.error("Something went wrong")

    } finally {

      setLoadingSubmit(false)
    }
  }

  /* CANCEL */

  const handleCancel = () => {

    setValue("")
    setEditId(null)
    setIsEditMode(false)
  }

  return (
    <>
      <style>{styles}</style>

      <div className="tr-root">

        <div className="tr-container">

          {/* HEADER */}

          <header className="tr-header">

            <span className="tr-header-title">
              Manage Tasks
            </span>

            <span className="tr-header-badge">
              LEAD
            </span>

          </header>

          {/* LOADER */}

          {loading && (
            <BarLoader
              cssOverride={{
                width: "100%",
                height: "3px"
              }}
              color="#6366f1"
            />
          )}

          {/* BODY */}

          <div className="tr-body">

            <div className="tr-card">

              {/* INPUT */}

              <div className="tr-input-section">

                <p className="tr-section-label">

                  {isEditMode
                    ? "Edit Task"
                    : "Add New Task"}

                </p>

                <div className="tr-input-row">

                  <input
                    type="text"
                    className="tr-input"
                    placeholder="Task name..."
                    value={value}
                    onChange={(e) =>
                      setValue(e.target.value)
                    }
                  />

                  <button
                    className="tr-btn tr-btn-submit"
                    onClick={handleSubmit}
                    disabled={loadingSubmit}
                  >
                    {loadingSubmit
                      ? "Saving..."
                      : isEditMode
                      ? "Update Task"
                      : "Add Task"}
                  </button>

                  {isEditMode && (
                    <button
                      className="tr-btn tr-btn-cancel"
                      onClick={handleCancel}
                    >
                      Cancel
                    </button>
                  )}

                </div>

              </div>

              {/* TABLE */}

              <div className="tr-table-section">

                <div className="tr-table-header">

                  <span className="tr-table-title">

                    All Tasks

                    <span className="tr-count-badge">
                      {loading ? "—" : items.length}
                    </span>

                  </span>

                </div>

                <div className="tr-table-wrap">

                  <table className="tr-table">

                    <thead>

                      <tr>

                        <th className="tr-col-task">
                          Task Name
                        </th>

                        <th className="tr-col-edit">
                          Edit
                        </th>

                        <th className="tr-col-delete">
                          Delete
                        </th>

                      </tr>

                    </thead>

                    <tbody>

                      {items.length > 0 ? (

                        items.map((item) => (

                          <tr key={item._id}>

                            <td className="tr-col-task">

                              <div className="tr-item-name">

                                <span className="tr-item-dot" />

                                <span className="tr-item-text">
                                  {item.taskName}
                                </span>

                              </div>

                            </td>

                            <td className="tr-col-edit">

                              <div className="tr-actions tr-actions-center">

                                {item.taskName !== "Lead" &&
                                  item.taskName !== "Allocation" &&
                                  item.taskName !== "Reallocation" &&
                                  item.taskName !== "Followup" && (

                                    <button
                                      className="tr-action-btn tr-action-edit"
                                      onClick={() =>
                                        handleEdit(item._id)
                                      }
                                    >
                                      <PencilIcon />
                                    </button>

                                  )}

                              </div>

                            </td>

                            <td className="tr-col-delete">

                              <div className="tr-actions tr-actions-right">

                                {item.taskName !== "Lead" &&
                                  item.taskName !== "Allocation" &&
                                  item.taskName !== "Reallocation" &&
                                  item.taskName !== "Followup" && (

                                    <button
                                      className="tr-action-btn tr-action-delete"
                                      onClick={() =>
                                        handleDelete(item._id)
                                      }
                                    >
                                      <TrashIcon />
                                    </button>

                                  )}

                              </div>

                            </td>

                          </tr>

                        ))

                      ) : (

                        <tr>

                          <td colSpan={3}>

                            <div className="tr-empty">

                              <div className="tr-empty-icon">
                                📋
                              </div>

                              <div className="tr-empty-text">
                                No Tasks Found
                              </div>

                              <div className="tr-empty-sub">
                                Create your first task above
                              </div>

                            </div>

                          </td>

                        </tr>

                      )}

                    </tbody>

                  </table>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </>
  )
}