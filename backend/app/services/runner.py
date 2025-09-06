import subprocess, tempfile, time, os, sys

MAX_OUTPUT_CHARS = 10000

def _truncate(s: str, limit: int = MAX_OUTPUT_CHARS) -> str:
    if s is None:
        return ""
    if len(s) <= limit:
        return s
    return s[:limit] + "\n...[truncated]"

def run_python(code: str, input_text: str, timeout_sec: float = 2.0):
    with tempfile.TemporaryDirectory() as td:
        script = os.path.join(td, "main.py")
        with open(script, "w", encoding="utf-8") as f:
            f.write(code)
        start = time.perf_counter()
        try:
            proc = subprocess.run(
                [sys.executable, "-I", script],
                input=input_text,
                capture_output=True,
                text=True,
                timeout=timeout_sec
            )
            runtime_ms = (time.perf_counter() - start) * 1000.0
            stdout = _truncate(proc.stdout.strip())
            stderr = _truncate(proc.stderr.strip())
            if proc.returncode != 0:
                return "RTE", stdout, stderr, runtime_ms
            return "OK", stdout, stderr, runtime_ms
        except subprocess.TimeoutExpired as e:
            runtime_ms = (time.perf_counter() - start) * 1000.0
            stdout = _truncate((e.stdout or "").strip())
            stderr = _truncate((e.stderr or "").strip())
            return "TLE", stdout, stderr, runtime_ms

def judge_python(code: str, tests: list[tuple[str, str]], timeout_sec: float = 2.0):
    all_pass = True
    results = []
    total_ms = 0.0
    for idx, (inp, exp) in enumerate(tests, start=1):
        status, out, err, t = run_python(code, inp, timeout_sec=timeout_sec)
        total_ms += t or 0.0
        passed = False
        test_status = status
        if status == "OK":
            norm_out = out.strip()
            norm_exp = exp.strip()
            passed = (norm_out == norm_exp)
            if not passed:
                test_status = "WA"
        else:
            all_pass = False
        if not passed:
            all_pass = False
        results.append({
            "idx": idx,
            "passed": passed,
            "status": test_status,
            "stdout": out,
            "stderr": err,
            "runtime_ms": t,
        })
    overall = "Accepted" if all_pass and len(tests) > 0 else "Wrong Answer"
    return overall, results, total_ms
