import "./index.css"
import React from "react"
import { createRoot } from "react-dom/client"
import App from "./App.jsx"
import { initTheme } from "./theme"

initTheme()
createRoot(document.getElementById("root")).render(<App />)
