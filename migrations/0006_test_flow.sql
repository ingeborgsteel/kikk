-- Test migration to verify the preview DB migration workflow.
-- This creates and immediately drops a throwaway table, leaving no schema changes.
CREATE TABLE IF NOT EXISTS test_flow (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT
);
DROP TABLE IF EXISTS test_flow;
