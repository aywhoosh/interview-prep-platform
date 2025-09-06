import React from "react"
import clsx from "clsx"

export function Tabs({ value, onChange, tabs }) {
  return (
    <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-gray-900 p-1 w-fit">
      {tabs.map(t => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={clsx(
            "px-3 py-1.5 text-sm rounded-md",
            value === t.value
              ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
