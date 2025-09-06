import React from "react"
import { toggleTheme } from "../theme"

export default function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(
    document.documentElement.classList.contains("dark")
  )

  function onClick() {
    toggleTheme()
    setIsDark(!isDark)
  }

  return (
    <button
      type="button"
      onClick={onClick}
      title={isDark ? "Switch to light" : "Switch to dark"}
      className="inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" className="text-yellow-300"><path fill="currentColor" d="M21.64 13a1 1 0 0 0-1.05-.14a8 8 0 0 1-10.44-10.44a1 1 0 0 0-1.19-1.33A10 10 0 1 0 22 14.14a1 1 0 0 0-.36-1.14Z"/></svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" className="text-amber-500"><path fill="currentColor" d="M6.76 4.84l-1.8-1.79L3.17 4.84l1.79 1.79zm10.48 14.32l1.79 1.79l1.79-1.79l-1.79-1.8zM12 4a1 1 0 0 0 1-1V1h-2v2a1 1 0 0 0 1 1Zm0 16a1 1 0 0 0-1 1v2h2v-2a1 1 0 0 0-1-1ZM4 11H2v2h2a1 1 0 0 0 0-2Zm18 0h-2a1 1 0 0 0 0 2h2ZM6.76 19.16l-1.8 1.79l1.79 1.79l1.79-1.79zM17.24 4.84l1.79-1.79l-1.79-1.79l-1.8 1.79zM12 6a6 6 0 1 1 0 12a6 6 0 0 1 0-12Z"/></svg>
      )}
      <span className="hidden sm:inline">{isDark ? "Dark" : "Light"}</span>
    </button>
  )
}
