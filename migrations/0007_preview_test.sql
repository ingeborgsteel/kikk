-- Test migration to verify the preview DB workflow.
-- This table is intentionally left in place so the preview DB change can be inspected.
CREATE TABLE IF NOT EXISTS preview_test (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT
);
