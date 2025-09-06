import React, { useEffect, useState } from "react"
import { fetchHealth, createProblem, fetchProblemsPaged } from "./api"
import CodeRunner from "./CodeRunner.jsx"
import ThemeToggle from "./components/ThemeToggle.jsx"

function SectionCard({ title, children }) {
  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
      {title ? <h2 className="text-lg font-semibold mb-2">{title}</h2> : null}
      {children}
    </section>
  )
}

export default function App() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState("")

  // Create Problem form
  const [form, setForm] = useState({
    title: "",
    slug: "",
    body: "",
    domain: "dsa",
    difficulty: "easy",
  })

  // Problems search and pagination
  const [q, setQ] = useState("")
  const [filterDomain, setFilterDomain] = useState("")
  const [filterDifficulty, setFilterDifficulty] = useState("")
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(10)
  const [offset, setOffset] = useState(0)
  const [sort, setSort] = useState("created_desc")

  useEffect(() => {
    fetchHealth().then(setHealth).catch(() => setHealth({ status: "error" }))
    loadPaged(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadPaged(nextOffset = offset, nextLimit = limit) {
    const res = await fetchProblemsPaged({
      q,
      domain: filterDomain || undefined,
      difficulty: filterDifficulty || undefined,
      sort,
      limit: nextLimit,
      offset: nextOffset,
    })
    setItems(res.items || [])
    setTotal(res.total || 0)
  }

  async function onCreate(e) {
    e.preventDefault()
    setError("")
    try {
      await createProblem(form)
      setForm({ title: "", slug: "", body: "", domain: "dsa", difficulty: "easy" })
      setOffset(0)
      await loadPaged(0)
    } catch (err) {
      setError(err.message)
    }
  }

  function onSearch() {
    setOffset(0)
    loadPaged(0)
  }
  function onPrev() {
    const n = Math.max(0, offset - limit)
    setOffset(n)
    loadPaged(n)
  }
  function onNext() {
    const n = offset + limit
    setOffset(n)
    loadPaged(n)
  }
  function onChangeLimit(newLimit) {
    setLimit(newLimit)
    setOffset(0)
    loadPaged(0, newLimit)
  }

  return (
    <div className="font-sans min-h-dvh bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-gray-950/70 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-7 rounded-lg bg-blue-600"></div>
            <h1 className="text-xl font-semibold tracking-tight">Interview Prep Platform</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-400">Health: {health ? health.status : "..."}</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 grid gap-6">
        <SectionCard title="Login">
          <Login />
        </SectionCard>

        <SectionCard title="Create problem">
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <form onSubmit={onCreate} className="grid gap-2 max-w-2xl">
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 rounded px-3 py-2"
            />
            <input
              placeholder="Slug (lowercase, hyphens)"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              required
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 rounded px-3 py-2"
            />
            <textarea
              placeholder="Body"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              rows={6}
              required
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 rounded px-3 py-2"
            />
            <div className="flex gap-2 items-center">
              <select
                value={form.domain}
                onChange={(e) => setForm({ ...form, domain: e.target.value })}
                className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 rounded px-3 py-2"
              >
                <option value="dsa">dsa</option>
                <option value="sql">sql</option>
                <option value="probability">probability</option>
                <option value="verbal">verbal</option>
              </select>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 rounded px-3 py-2"
              >
                <option value="easy">easy</option>
                <option value="medium">medium</option>
                <option value="hard">hard</option>
              </select>
              <button className="bg-blue-600 text-white px-4 py-2 rounded hover:opacity-90">Create</button>
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Problems">
          <div className="flex gap-2 mb-3 flex-wrap">
            <input
              placeholder="Search title or body"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 rounded px-3 py-2 min-w-[260px]"
            />
            <select
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 rounded px-3 py-2"
            >
              <option value="">all domains</option>
              <option value="dsa">dsa</option>
              <option value="sql">sql</option>
              <option value="probability">probability</option>
              <option value="verbal">verbal</option>
            </select>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 rounded px-3 py-2"
            >
              <option value="">all difficulties</option>
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value)
                setOffset(0)
                loadPaged(0)
              }}
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 rounded px-3 py-2"
            >
              <option value="created_desc">newest first</option>
              <option value="created_asc">oldest first</option>
              <option value="title_asc">title A to Z</option>
            </select>
            <button onClick={onSearch} className="border border-gray-300 dark:border-gray-700 px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
              Search
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-sm text-gray-600 dark:text-gray-400">
                  <th>ID</th>
                  <th>Title</th>
                  <th>Domain</th>
                  <th>Difficulty</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-2 pr-2">{p.id}</td>
                    <td className="py-2 pr-2">
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{p.body}</div>
                    </td>
                    <td className="py-2 pr-2 capitalize">{p.domain}</td>
                    <td className="py-2 pr-2 capitalize">{p.difficulty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2 items-center mt-3 flex-wrap">
            <button
              disabled={offset === 0}
              onClick={onPrev}
              className="border border-gray-300 dark:border-gray-700 px-3 py-2 rounded disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Prev
            </button>
            <button
              disabled={offset + items.length >= total}
              onClick={onNext}
              className="border border-gray-300 dark:border-gray-700 px-3 py-2 rounded disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Next
            </button>
            <span className="text-gray-600 dark:text-gray-400">
              Showing {items.length ? offset + 1 : 0} to {offset + items.length} of {total}
            </span>
            <select
              value={limit}
              onChange={(e) => onChangeLimit(Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 rounded px-3 py-2"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </SectionCard>

        <CodeRunner />
      </main>
    </div>
  )
}

function Login() {
  const [email, setEmail] = React.useState("demo@example.com")
  const [password, setPassword] = React.useState("secret123")
  const [msg, setMsg] = React.useState("")

  async function ensureDemoUser() {
    try {
      await fetch((import.meta.env.VITE_API_BASE || "http://localhost:8000") + "/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, full_name: "Demo User" }),
      })
    } catch {}
  }

  async function onLogin(e) {
    e.preventDefault()
    await ensureDemoUser()
    const data = new URLSearchParams()
    data.set("username", email)
    data.set("password", password)
    const res = await fetch((import.meta.env.VITE_API_BASE || "http://localhost:8000") + "/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: data.toString(),
    })
    if (!res.ok) {
      setMsg("Login failed")
      return
    }
    const json = await res.json()
    localStorage.setItem("token", json.access_token)
    setMsg("Logged in. Token saved.")
  }

  return (
    <form onSubmit={onLogin} className="flex gap-2 items-center flex-wrap">
      <input
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 rounded px-3 py-2"
      />
      <input
        placeholder="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 rounded px-3 py-2"
      />
      <button className="border border-gray-300 dark:border-gray-700 px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800" type="submit">
        Login
      </button>
      {msg && <span className="ml-2 text-sm">{msg}</span>}
    </form>
  )
}
