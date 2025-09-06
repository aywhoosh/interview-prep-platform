import React from "react"
import Editor from "@monaco-editor/react"

export default function CodeEditor({ value, onChange, language = "python", height = 420 }) {
  const isDark = document.documentElement.classList.contains("dark")
  const theme = isDark ? "vs-dark" : "light"
  // force remount on theme change so Monaco updates
  const key = isDark ? "monaco-dark" : "monaco-light"

  return (
    <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
      <Editor
        key={key}
        height={height}
        defaultLanguage={language}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        theme={theme}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          tabSize: 2,
          automaticLayout: true,
          renderWhitespace: "selection",
        }}
      />
    </div>
  )
}
