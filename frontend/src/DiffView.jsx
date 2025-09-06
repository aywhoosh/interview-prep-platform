import React from "react"

export default function DiffView({ unified }) {
  if (!unified) return null
  const lines = unified.split("\n")
  return (
    <pre className="whitespace-pre-wrap p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800 overflow-x-auto text-sm leading-5">
      {lines.map((line, i) => {
        let cls = ""
        if (line.startsWith("+") && !line.startsWith("+++")) cls = "text-green-700 dark:text-green-400"
        if (line.startsWith("-") && !line.startsWith("---")) cls = "text-red-700 dark:text-red-400"
        if (line.startsWith("@@")) cls = "text-purple-700 dark:text-purple-400"
        if (line.startsWith("+++") || line.startsWith("---")) cls = "text-gray-500"
        return (
          <div key={i} className={cls}>
            {line}
          </div>
        )
      })}
    </pre>
  )
}
