import { User } from "../types/user.ts";

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error(res.statusText);
  return res.json() as Promise<User[]>;
}
