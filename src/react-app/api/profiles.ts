import { Profile } from "../types/profile.ts";

export async function fetchProfiles(): Promise<Profile[]> {
  const res = await fetch("/api/profiles");
  if (!res.ok) throw new Error(res.statusText);
  return res.json() as Promise<Profile[]>;
}
