export function setTheme(theme) {
  const root = document.documentElement
  if (theme === "dark") root.classList.add("dark")
  else root.classList.remove("dark")
  localStorage.setItem("theme", theme)
}

export function initTheme() {
  const stored = localStorage.getItem("theme")
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches
  const theme = stored || (prefersDark ? "dark" : "light")
  setTheme(theme)
}

export function toggleTheme() {
  const isDark = document.documentElement.classList.contains("dark")
  setTheme(isDark ? "light" : "dark")
}
