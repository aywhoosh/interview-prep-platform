import React from "react"
import clsx from "clsx"

export default function Badge({ kind = "default", children }) {
  const map = {
    success: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30",
    partial: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30",
    failed: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30",
    pending: "bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30",
    default: "bg-gray-500/15 text-gray-300 ring-1 ring-gray-500/30",
  }
  return (
    <span className={clsx("px-2 py-0.5 rounded text-xs", map[kind] || map.default)}>
      {children}
    </span>
  )
}
