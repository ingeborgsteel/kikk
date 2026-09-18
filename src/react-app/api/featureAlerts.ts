const base = "/api/feature-alert-dismissals";

export async function fetchDismissedFeatureAlerts(
  userId: string,
): Promise<string[]> {
  const res = await fetch(`${base}?userId=${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error(res.statusText);
  return res.json() as Promise<string[]>;
}

export async function dismissFeatureAlert(
  userId: string,
  alertId: string,
): Promise<void> {
  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, alertId }),
  });
  if (!res.ok) throw new Error(res.statusText);
}
