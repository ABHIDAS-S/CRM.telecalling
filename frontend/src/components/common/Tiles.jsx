
// import React from "react"

// const Tiles = ({ title, count, style, onClick }) => {
//   return (
//     <div className="w-[130px] text-center mb-2">
//       <h2 className="text-sm font-semibold">{title}</h2>
//       <div
//         // className={`p-4 shadow-lg rounded text-center cursor-pointer  `}
//         className={`flex flex-col items-center justify-center cursor-pointer p-4 rounded-lg shadow-lg transition-all duration-200 ease-in-out   `}
//         style={{
//           ...style // Spread the style prop here
//         }}
//         onClick={onClick}
//       >
//         <p className="text-3xl font-bold">{count}</p>
//       </div>
//     </div>
//   )
// }

// export default Tiles
// import React from "react"

// const Tiles = ({
//   title,
//   count,
//   icon,
//   subtitle,
//   style,
//   onClick,
//   active = false,
// }) => {
//   return (
//     <button
//       type="button"
//       onClick={onClick}
//       className={`group relative min-h-[82px] w-full overflow-hidden rounded-xl border text-left transition-all duration-200 ${
//         active
//           ? "border-slate-900 shadow-[0_8px_18px_rgba(15,23,42,0.18)]"
//           : "border-white/20 shadow-[0_6px_14px_rgba(15,23,42,0.10)] hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(15,23,42,0.14)]"
//       }`}
//       style={style}
//     >
//       <div className="absolute right-0 top-0 h-14 w-14 rounded-full bg-white/10 blur-xl" />

//       <div className="relative flex items-start justify-between px-3 py-2.5">
//         <div className="min-w-0 pr-2">
//           <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85">
//             {title}
//           </p>

//           <p className="mt-1 text-2xl font-bold leading-none text-white">
//             {count}
//           </p>

//           {subtitle ? (
//             <p className="mt-1 line-clamp-1 text-[11px] text-white/80">
//               {subtitle}
//             </p>
//           ) : null}
//         </div>

//         <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white ring-1 ring-white/15">
//           {icon}
//         </div>
//       </div>
//     </button>
//   )
// }

// export default Tiles
import React from "react"

const Tiles = ({
  title,
  count,
  icon,
  subtitle,
  style,
  onClick,
  active = false,
  compact = false,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative ${compact ? "min-h-[62px] rounded-lg" : "min-h-[86px] rounded-xl"} w-full overflow-hidden border text-left transition-all duration-200 ${
        active
          ? "border-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.20)] ring-1 ring-white/20"
          : "border-white/20 shadow-[0_6px_14px_rgba(15,23,42,0.10)] hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(15,23,42,0.16)]"
      }`}
      style={style}
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom_right,rgba(255,255,255,0.16),rgba(255,255,255,0.02))]" />
      <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute bottom-0 left-0 h-px w-full bg-white/20" />

      <div className={`relative flex items-start justify-between ${compact ? "px-2.5 py-2" : "px-3 py-2.5"}`}>
        <div className="min-w-0 pr-2">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-white/85">
            {title}
          </p>

          <p className={`${compact ? "mt-0.5 text-xl" : "mt-1 text-2xl"} font-bold leading-none text-white drop-shadow-sm`}>
            {count}
          </p>

          {subtitle ? (
            <p className={`${compact ? "mt-0.5 text-[10px]" : "mt-1 text-[11px]"} line-clamp-1 text-white/80`}>
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className={`${compact ? "h-7 w-7" : "h-8 w-8"} flex shrink-0 items-center justify-center rounded-lg bg-white/15 text-white shadow-inner ring-1 ring-white/15 backdrop-blur-sm`}>
          {icon}
        </div>
      </div>
    </button>
  )
}

export default Tiles
