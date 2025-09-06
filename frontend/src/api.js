const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000"

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/health`)
  return res.json()
}

export async function fetchProblems(q = "") {
  const url = new URL(`${API_BASE}/problems`)
  if (q) url.searchParams.set("q", q)
  const res = await fetch(url)
  return res.json()
}

export async function createProblem(problem) {
  const token = localStorage.getItem("token")
  const headers = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}/problems`, {
    method: "POST",
    headers,
    body: JSON.stringify(problem),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail || "Failed to create problem")
  }
  return res.json()
}

export async function listTestcases(problemId) {
  const res = await fetch(`${API_BASE}/testcases/${problemId}`)
  return res.json()
}

export async function createTestcase(tc) {
  const token = localStorage.getItem("token")
  const headers = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}/testcases`, {
    method: "POST",
    headers,
    body: JSON.stringify(tc),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail || "Failed to create testcase")
  }
  return res.json()
}

export async function submitCode(payload) {
  const token = localStorage.getItem("token")
  const headers = { "Content-Type": "application/json" }
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}/submissions`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail || "Submission failed")
  }
  return res.json()
}

export async function fetchProblemsPaged(params = {}) {
  const url = new URL(`${API_BASE}/problems/search`)
  const { q, domain, difficulty, sort = "created_desc", limit = 10, offset = 0 } = params
  if (q) url.searchParams.set("q", q)
  if (domain) url.searchParams.set("domain", domain)
  if (difficulty) url.searchParams.set("difficulty", difficulty)
  url.searchParams.set("sort", sort)
  url.searchParams.set("limit", String(limit))
  url.searchParams.set("offset", String(offset))
  const res = await fetch(url)
  return res.json()  // { items, total, limit, offset }
}

export async function listSubmissionHistory(problemId) {
  const token = localStorage.getItem("token")
  const headers = {}
  if (token) headers["Authorization"] = `Bearer ${token}`
  const url = new URL(`${API_BASE}/submissions/history`)
  url.searchParams.set("problem_id", String(problemId))
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error("Failed to load history")
  return res.json()
}

export async function getSubmissionCode(submissionId) {
  const token = localStorage.getItem("token")
  const headers = {}
  if (token) headers["Authorization"] = `Bearer ${token}`
  const res = await fetch(`${API_BASE}/submissions/${submissionId}/code`, { headers })
  if (!res.ok) throw new Error("Failed to load code")
  return res.json()  // { id, problem_id, code }
}

export async function diffSubmissions({ problemId, newId = null, oldId = null }) {
  const token = localStorage.getItem("token")
  const headers = {}
  if (token) headers["Authorization"] = `Bearer ${token}`
  const url = new URL(`${API_BASE}/submissions/diff`)
  url.searchParams.set("problem_id", String(problemId))
  if (newId != null) url.searchParams.set("new_id", String(newId))
  if (oldId != null) url.searchParams.set("old_id", String(oldId))
  const res = await fetch(url, { headers })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail || "Diff failed")
  }
  return res.json() // { summary, unified_diff, ... }
}


