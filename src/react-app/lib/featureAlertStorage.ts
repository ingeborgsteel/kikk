const DISMISSED_ALERTS_KEY = "kikk_dismissed_feature_alerts";

function readAll(): Record<string, string[]> {
  try {
    const stored = localStorage.getItem(DISMISSED_ALERTS_KEY);
    return stored ? (JSON.parse(stored) as Record<string, string[]>) : {};
  } catch {
    return {};
  }
}

export function readDismissedFeatureAlerts(userId: string): string[] {
  return readAll()[userId] ?? [];
}

export function writeDismissedFeatureAlerts(
  userId: string,
  alertIds: string[],
): void {
  try {
    const all = readAll();
    all[userId] = alertIds;
    localStorage.setItem(DISMISSED_ALERTS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}
