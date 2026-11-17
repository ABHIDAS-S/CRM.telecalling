// import { useEffect, useRef, useState } from "react"

// export function CustomSelect({
//   value,
//   onChange,
//   options = [],
//   label = "Select",
//   labletrue = false,
//   className = "",
//   placeholder = "Select option"
// }) {
// console.log(options)
//   const [open, setOpen] = useState(false)
//   const containerRef = useRef(null)

//   const getOptionValue = (option) => {
//     if (option == null) return ""
//     if (typeof option === "string" || typeof option === "number") return String(option)

//     return String(
//       option.id ?? option.value ?? option.label ?? option.name ?? ""
//     )
//   }

//   const getOptionLabel = (option) => {
//     if (option == null) return ""
//     if (typeof option === "string" || typeof option === "number") return String(option)

//     return String(
//       option.label ?? option.name ?? option.value ?? option.id ?? ""
//     )
//   }

//   const selectedOption = options.find(
//     (item) => getOptionValue(item) === String(value ?? "")
//   )

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         containerRef.current &&
//         !containerRef.current.contains(event.target)
//       ) {
//         setOpen(false)
//       }
//     }

//     document.addEventListener("mousedown", handleClickOutside)
//     return () => document.removeEventListener("mousedown", handleClickOutside)
//   }, [])

//   return (
//     <div className={`relative ${className || "w-full"}`} ref={containerRef}>
//       {labletrue && (
//         <label className="ml-1 mb-1 block text-[11px] font-medium uppercase tracking-wide text-slate-500">
//           {label}
//         </label>
//       )}

//       <button
//         type="button"
//         onClick={() => setOpen((prev) => !prev)}
//         className={`flex h-8 w-full items-center justify-between rounded-xl border bg-white px-3 text-left text-[12px] font-medium text-slate-700 shadow-sm transition ${
//           open
//             ? "border-slate-300 ring-2 ring-slate-200"
//             : "border-slate-200 hover:border-slate-300"
//         }`}
//       >
//         <span className="truncate">
//           {selectedOption ? getOptionLabel(selectedOption) : placeholder}
//         </span>

//         <svg
//           className={`h-4 w-4 text-slate-400 transition-transform ${
//             open ? "rotate-180" : ""
//           }`}
//           viewBox="0 0 20 20"
//           fill="none"
//           stroke="currentColor"
//           strokeWidth="1.8"
//         >
//           <path
//             d="M5 7.5L10 12.5L15 7.5"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//           />
//         </svg>
//       </button>

//       {open && (
//         <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
//           <div className="max-h-56 overflow-y-auto p-1">
//             {options.map((option, index) => {
//               const optionValue = getOptionValue(option)
//               const optionLabel = getOptionLabel(option)
//               const selected = String(value ?? "") === optionValue

//               return (
//                 <button
//                   key={`${optionValue}-${index}`}
//                   type="button"
//                   onClick={() => {
//                     onChange?.(optionValue, option)
//                     setOpen(false)
//                   }}
//                   className={`flex w-full items-center justify-between rounded-lg px-3 py-1 text-[12px] font-medium transition ${
//                     selected
//                       ? "bg-slate-900 text-white"
//                       : "text-slate-700 hover:bg-slate-50"
//                   }`}
//                 >
//                   <span>{optionLabel}</span>

//                   {selected && (
//                     <svg
//                       className="h-4 w-4"
//                       viewBox="0 0 20 20"
//                       fill="none"
//                       stroke="currentColor"
//                       strokeWidth="2"
//                     >
//                       <path
//                         d="M5 10L8.5 13.5L15 7"
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                       />
//                     </svg>
//                   )}
//                 </button>
//               )
//             })}
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

import { useEffect, useRef, useState } from "react"

export function CustomSelect({
  value,
  onChange,
  options = [],
  label = "Select",
  labletrue = false,
  className = "",
  labelClassName = "",
  placeholder = "Select option"
}) {
console.log(options)
console.log(className)
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const getOptionValue = (option) => {
    if (option == null) return ""
    if (typeof option === "string" || typeof option === "number") return String(option)

    return String(
      option.id ?? option.value ?? option.label ?? option.name ?? ""
    )
  }

  const getOptionLabel = (option) => {
    if (option == null) return ""
    if (typeof option === "string" || typeof option === "number") return String(option)

    return String(
      option.label ?? option.name ?? option.value ?? option.id ?? ""
    )
  }

  const selectedOption = options.find(
    (item) => getOptionValue(item) === String(value ?? "")
  )

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className={`relative min-w-[70px] ${className||"" }`} ref={containerRef}>
      {labletrue && (
        <label
          className={`mb-1 ml-1 block text-[11px] font-medium uppercase tracking-wide ${
            labelClassName || "text-slate-500"
          }`}
        >
          {label}
        </label>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-8 w-full items-center justify-between rounded-xl border bg-white px-3 text-left text-[12px] font-medium text-slate-700 shadow-sm transition ${
          open
            ? "border-slate-300 ring-2 ring-slate-200"
            : "border-slate-200 hover:border-slate-300"
        }`}
      >
        <span className="truncate">
          {selectedOption ? getOptionLabel(selectedOption) : placeholder}
        </span>

        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="max-h-56 overflow-y-auto p-1">
            {options.map((option, index) => {
              const optionValue = getOptionValue(option)
              const optionLabel = getOptionLabel(option)
              const selected = String(value ?? "") === optionValue

              return (
                <button
                  key={`${optionValue}-${index}`}
                  type="button"
                  onClick={() => {
                    onChange?.(optionValue, option)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-1 text-[12px] font-medium transition ${
                    selected
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate whitespace-nowrap text-left">
                    {optionLabel}
                  </span>

                  {selected && (
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        d="M5 10L8.5 13.5L15 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
