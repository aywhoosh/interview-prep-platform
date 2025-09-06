import React from "react"
import { DiffEditor } from "@monaco-editor/react"

export default function MonacoDiff({ original = "", modified = "", height = 420 }) {
  const isDark = document.documentElement.classList.contains("dark")
  const theme = isDark ? "vs-dark" : "light"
  const key = isDark ? "diff-dark" : "diff-light"

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
      <DiffEditor
        key={key}
        height={height}
        language="python"
        original={original}
        modified={modified}
        theme={theme}
        options={{
          readOnly: true,
          renderSideBySide: true,
          minimap: { enabled: false },
          lineNumbers: "on",
          originalEditable: false,
        }}
      />
    </div>
  )
}
