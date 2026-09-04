import { UserAccess } from "../types/user_access.ts";

export async function fetchUserAccesses(
  userId: string,
): Promise<UserAccess | undefined> {
  const res = await fetch(
    `/api/user-accesses?userId=${encodeURIComponent(userId)}`,
  );
  if (!res.ok) throw new Error(res.statusText);
  return res.json() as Promise<UserAccess | undefined>;
}
