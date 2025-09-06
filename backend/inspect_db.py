import sqlite3

# Connect to the SQLite DB file
conn = sqlite3.connect("dev.db")
cur = conn.cursor()

print("Tables in this DB:")
cur.execute("SELECT name FROM sqlite_master WHERE type='table';")
print(cur.fetchall())

print("\nUsers table content:")
for row in cur.execute("SELECT id, email, full_name, hashed_password, is_active, created_at FROM users;"):
    print(row)

print("\nProblems table content:")
for row in cur.execute("SELECT id, title, slug, domain, difficulty FROM problems;"):
    print(row)

conn.close()
