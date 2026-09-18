-- Per-user dismissal of "Nytt i kikk" feature alerts so each alert is only
-- shown once per user (guest users persist dismissals in localStorage).
CREATE TABLE feature_alert_dismissals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  alert_id TEXT NOT NULL,
  dismissed_at TEXT NOT NULL
);

CREATE UNIQUE INDEX feature_alert_dismissals_user_alert_uidx
  ON feature_alert_dismissals(user_id, alert_id);
