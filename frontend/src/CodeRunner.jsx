import React from "react"
import {
  listTestcases,
  createTestcase,
  submitCode,
  listSubmissionHistory,
  diffSubmissions,
  getSubmissionCode,
} from "./api"
import { Tabs } from "./components/Tabs.jsx"
import CodeEditor from "./components/CodeEditor.jsx"
import MonacoDiff from "./components/MonacoDiff.jsx"
import DiffView from "./DiffView.jsx"
import Badge from "./components/Badge.jsx"

export default function CodeRunner() {
  const [problemId, setProblemId] = React.useState("")
  const [activeTab, setActiveTab] = React.useState("editor")

  const [code, setCode] = React.useState(`# Read from stdin and print output
import sys
print(sys.stdin.read().strip())`)
  const [tests, setTests] = React.useState([])
  const [history, setHistory] = React.useState([])
  const [msg, setMsg] = React.useState("")
  const [result, setResult] = React.useState(null)

  const [tc, setTc] = React.useState({ input_text: "", expected_output: "" })

  const [oldId, setOldId] = React.useState("")
  const [newId, setNewId] = React.useState("")
  const [diff, setDiff] = React.useState(null)
  const [diffCode, setDiffCode] = React.useState({ old: "", newest: "" })

  React.useEffect(() => {
    function handler(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        onSubmit()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [code, problemId])

  async function load() {
    if (!problemId) return
    const [t] = await Promise.all([listTestcases(problemId)])
    setTests(t || [])
    await loadHistory()
  }

  async function loadHistory() {
    if (!problemId) return
    try {
      const rows = await listSubmissionHistory(problemId)
      setHistory(rows || [])
      if (rows.length >= 2) {
        setNewId(String(rows[rows.length - 1].id))
        setOldId(String(rows[rows.length - 2].id))
      }
    } catch {}
  }

  async function onAddTest(e) {
    e.preventDefault()
    if (!problemId) return setMsg("Pick a problem id")
    try {
      await createTestcase({
        problem_id: Number(problemId),
        input_text: tc.input_text,
        expected_output: tc.expected_output,
      })
      setTc({ input_text: "", expected_output: "" })
      await load()
      setActiveTab("tests")
    } catch (err) {
      setMsg(err.message)
    }
  }

  async function onSubmit(e) {
    if (e) e.preventDefault()
    if (!problemId) return setMsg("Pick a problem id")
    try {
      const res = await submitCode({ problem_id: Number(problemId), language: "python", code })
      setResult(res)
      await loadHistory()
      setActiveTab("attempts")
      // auto diff latest vs previous
      try {
        const d = await diffSubmissions({ problemId: Number(problemId), newId: res.id })
        setDiff(d)
        const [o, n] = await Promise.all([
          getSubmissionCode(d.old_id),
          getSubmissionCode(d.new_id),
        ])
        setDiffCode({ old: o.code, newest: n.code })
      } catch {}
    } catch (err) {
      setMsg(err.message)
    }
  }

  async function runDiffSelected() {
    if (!problemId || !newId || !oldId) return setMsg("Pick both attempts")
    try {
      const d = await diffSubmissions({
        problemId: Number(problemId),
        newId: Number(newId),
        oldId: Number(oldId),
      })
      setDiff(d)
      const [o, n] = await Promise.all([
        getSubmissionCode(d.old_id),
        getSubmissionCode(d.new_id),
      ])
      setDiffCode({ old: o.code, newest: n.code })
      setActiveTab("diff")
    } catch (e) {
      setMsg(e.message)
    }
  }

  function kindFromStatus(s, passed, total) {
    if (s === "accepted") return "success"
    if (s === "failed" && passed > 0) return "partial"
    if (s === "failed") return "failed"
    return "pending"
  }

  return (
    <section className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Code Runner</h2>
        <Tabs
          value={activeTab}
          onChange={setActiveTab}
          tabs={[
            { value: "editor", label: "Editor" },
            { value: "tests", label: "Tests" },
            { value: "attempts", label: "Attempts" },
            { value: "diff", label: "Diff" },
          ]}
        />
      </div>

      {/* Header controls */}
      <div className="flex gap-2 items-center flex-wrap mt-3">
        <input
          placeholder="Problem ID"
          value={problemId}
          onChange={(e) => setProblemId(e.target.value)}
          className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 rounded px-3 py-2 w-32"
        />
        <button onClick={load} className="border border-gray-300 dark:border-gray-700 px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">
          Load
        </button>
        <span className="text-gray-600 dark:text-gray-400">{tests.length} tests</span>
        <span className="text-gray-600 dark:text-gray-400">{history.length} attempts</span>
        {result && (
          <Badge kind={kindFromStatus(result.status, result.passed_count, result.total_count)}>
            {result.status} {result.passed_count}/{result.total_count}
          </Badge>
        )}
      </div>

      {/* Tabs content */}
      {activeTab === "editor" && (
        <div className="mt-3">
          <CodeEditor value={code} onChange={setCode} />
          <div className="sticky bottom-0 mt-2">
            <button
              onClick={onSubmit}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:opacity-90"
              title="Ctrl or Cmd + Enter"
            >
              Submit code
            </button>
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Tip: Ctrl or Cmd + Enter to submit</p>
          </div>
        </div>
      )}

      {activeTab === "tests" && (
        <div className="mt-3">
          {tests.length === 0 && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              No tests yet. Add a few below.
            </div>
          )}
          <ul className="text-sm space-y-2">
            {tests.map((t, idx) => (
              <li key={t.id} className="p-2 rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
                <div className="text-gray-600 dark:text-gray-400">Test {idx + 1}</div>
                <div className="grid md:grid-cols-2 gap-2 mt-1">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Input</div>
                    <pre className="whitespace-pre-wrap text-xs p-2 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">{t.input_text}</pre>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expected</div>
                    <pre className="whitespace-pre-wrap text-xs p-2 rounded bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">{t.expected_output}</pre>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <form onSubmit={onAddTest} className="grid gap-2 max-w-2xl mt-3">
            <textarea
              rows={3}
              placeholder="input"
              value={tc.input_text}
              onChange={(e) => setTc({ ...tc, input_text: e.target.value })}
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 rounded px-3 py-2"
            />
            <textarea
              rows={2}
              placeholder="expected output"
              value={tc.expected_output}
              onChange={(e) => setTc({ ...tc, expected_output: e.target.value })}
              className="border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 rounded px-3 py-2"
            />
            <button type="submit" className="border border-gray-300 dark:border-gray-700 px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 w-fit">
              Add testcase
            </button>
          </form>
        </div>
      )}

      {activeTab === "attempts" && (
        <div className="mt-3 overflow-x-auto">
          {history.length === 0 ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">No attempts yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <th className="py-2">Attempt</th>
                  <th className="py-2">ID</th>
                  <th className="py-2">When</th>
                  <th className="py-2">Result</th>
                  <th className="py-2">Diff</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-b border-gray-200 dark:border-gray-800 last:border-0">
                    <td className="py-2">#{h.attempt_no}</td>
                    <td className="py-2">{h.id}</td>
                    <td className="py-2">{new Date(h.created_at).toLocaleString()}</td>
                    <td className="py-2">
                      <Badge kind={kindFromStatus(h.status, h.passed_count, h.total_count)}>
                        {h.status} {h.passed_count}/{h.total_count}
                      </Badge>
                    </td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setNewId(String(h.id))}
                          className="border border-gray-300 dark:border-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          Pick new
                        </button>
                        <button
                          onClick={() => setOldId(String(h.id))}
                          className="border border-gray-300 dark:border-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          Pick old
                        </button>
                        <button
                          onClick={runDiffSelected}
                          className="border border-gray-300 dark:border-gray-700 px-2 py-1 rounded text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          Diff selected
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "diff" && (
        <div className="mt-3">
          {!diff ? (
            <div className="text-sm text-gray-600 dark:text-gray-400">Choose two attempts to see a diff.</div>
          ) : (
            <>
              <div className="flex gap-2 items-center text-sm">
                <span>new {diff.new_id} vs old {diff.old_id}</span>
                <Badge kind="default">+{diff.summary.added_lines} -{diff.summary.removed_lines}</Badge>
              </div>
              <div className="mt-2">
                {diffCode.newest || diffCode.old ? (
                  <MonacoDiff original={diffCode.old} modified={diffCode.newest} />
                ) : (
                  <DiffView unified={diff.unified_diff} />
                )}
              </div>
            </>
          )}
        </div>
      )}

      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </section>
  )
}
