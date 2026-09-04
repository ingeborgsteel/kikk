import { AdminUser } from "../types/admin";

const base = "/api/admin";

async function getJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const res = await fetch(`${base}/users`);
  return getJson<AdminUser[]>(res);
}

export async function sendAdminPasswordReset(userId: string): Promise<void> {
  const res = await fetch(`${base}/users/${userId}/reset-password`, {
    method: "POST",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
}
