-- 空き待ちリスト (D1)
CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  desired_time TEXT,
  note TEXT,
  token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active | unsubscribed
  created_at TEXT NOT NULL,
  notified_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
