import { db } from './client';

export function ensureSchema() {
  db.run(`CREATE TABLE IF NOT EXISTS feedback_sessions (
    id TEXT PRIMARY KEY,
    project_name TEXT NOT NULL,
    target_url TEXT,
    tester_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS feedback_pins (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    x REAL NOT NULL,
    y REAL NOT NULL,
    message TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'note',
    screenshot_url TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(session_id) REFERENCES feedback_sessions(id) ON DELETE CASCADE
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS timeline_events (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    type TEXT NOT NULL,
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(session_id) REFERENCES feedback_sessions(id) ON DELETE CASCADE
  )`);
}
