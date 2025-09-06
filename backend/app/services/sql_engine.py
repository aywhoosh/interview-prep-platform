# backend/app/services/sql_engine.py
import sqlite3, threading, re
from typing import Dict, Any, List

_lock = threading.Lock()
_db_by_dataset: Dict[str, sqlite3.Connection] = {}

FORBIDDEN = re.compile(r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|ATTACH|DETACH|PRAGMA|REINDEX|VACUUM)\b", re.I)

def _connect(dataset: str) -> sqlite3.Connection:
    # Keep one in-memory DB per dataset
    with _lock:
        if dataset in _db_by_dataset:
            return _db_by_dataset[dataset]
        conn = sqlite3.connect(":memory:", check_same_thread=False)
        conn.row_factory = sqlite3.Row
        _seed_dataset(conn, dataset)
        _db_by_dataset[dataset] = conn
        return conn

def _seed_dataset(conn: sqlite3.Connection, dataset: str):
    cur = conn.cursor()
    if dataset == "ecommerce":
        cur.executescript("""
        CREATE TABLE customers(
          id INTEGER PRIMARY KEY,
          name TEXT,
          region TEXT
        );
        CREATE TABLE products(
          id INTEGER PRIMARY KEY,
          name TEXT,
          category TEXT,
          price REAL
        );
        CREATE TABLE orders(
          id INTEGER PRIMARY KEY,
          customer_id INTEGER,
          product_id INTEGER,
          quantity INTEGER,
          order_date TEXT,
          FOREIGN KEY(customer_id) REFERENCES customers(id),
          FOREIGN KEY(product_id) REFERENCES products(id)
        );
        INSERT INTO customers(id,name,region) VALUES
          (1,'Asha','North'),(2,'Rohan','South'),(3,'Meera','West');
        INSERT INTO products(id,name,category,price) VALUES
          (1,'Keyboard','Accessories',1499.0),
          (2,'Mouse','Accessories',799.0),
          (3,'Headphones','Audio',2999.0);
        INSERT INTO orders(id,customer_id,product_id,quantity,order_date) VALUES
          (1,1,1,1,'2025-01-05'),
          (2,1,2,2,'2025-02-10'),
          (3,2,3,1,'2025-03-15'),
          (4,3,1,3,'2025-04-20');
        """)
        conn.commit()
    else:
        # default tiny dataset
        cur.executescript("""
        CREATE TABLE nums(n INTEGER);
        INSERT INTO nums(n) VALUES (1),(2),(3),(4),(5);
        """)
        conn.commit()

def list_datasets() -> List[dict]:
    out = []
    for name in ["ecommerce", "tiny"]:
        conn = _connect(name)
        cur = conn.cursor()
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        tables = [r[0] for r in cur.fetchall()]
        schema = {}
        for t in tables:
            cur.execute(f"PRAGMA table_info({t})")
            cols = [{"cid": r[0], "name": r[1], "type": r[2], "notnull": r[3]} for r in cur.fetchall()]
            schema[t] = cols
        out.append({"name": name, "tables": tables, "schema": schema})
    return out

def _safe(sql: str) -> None:
    s = sql.strip()
    if not s:
        raise ValueError("Empty SQL")
    if not re.match(r"^(WITH|SELECT)\b", s, re.I):
        raise ValueError("Only SELECT or WITH queries are allowed")
    if FORBIDDEN.search(s):
        raise ValueError("Query contains forbidden keywords")

def _english(sql: str) -> str:
    # Very small heuristic translator
    s = " ".join(sql.strip().split())
    m = re.search(r"select\s+(.*?)\s+from\s+([a-zA-Z0-9_]+)(?:\s+where\s+(.*))?$", s, re.I)
    if not m:
        return "Runs a SQL query and returns rows."
    cols, table, where = m.groups()
    cols = cols.strip()
    cols = "all columns" if cols == "*" else cols
    if where:
        return f"Selects {cols} from {table} where {where}."
    return f"Selects {cols} from {table}."

def run_query(dataset: str, sql: str, limit: int = 500):
    _safe(sql)
    conn = _connect(dataset)
    cur = conn.cursor()

    plan = []
    try:
        cur.execute(f"EXPLAIN QUERY PLAN {sql}")
        plan = [ " ".join(str(x) for x in row) for row in cur.fetchall() ]
    except Exception as _:
        plan = ["Plan not available"]

    cur.execute(sql)
    rows = cur.fetchall()
    rows = rows[:limit]
    columns = [d[0] for d in cur.description] if cur.description else []
    english = _english(sql)
    return {
        "columns": columns,
        "rows": [list(r) for r in rows],
        "english": english,
        "plan": plan,
        "row_count": len(rows),
    }
