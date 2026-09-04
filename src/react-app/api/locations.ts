import { UserLocation } from "../types/location.ts";

const base = "/api/locations";

export type CreateUserLocation = Omit<
  UserLocation,
  "id" | "createdAt" | "updatedAt"
>;

async function getJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(res.statusText);
  return res.json() as Promise<T>;
}

export async function fetchUserLocations(
  userId?: string,
): Promise<UserLocation[]> {
  const url = userId ? `${base}?userId=${encodeURIComponent(userId)}` : base;
  const res = await fetch(url);
  return getJson<UserLocation[]>(res);
}

export async function createUserLocation(
  location: CreateUserLocation,
  user: { id: string } | null = null,
): Promise<UserLocation> {
  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...location, userId: user?.id }),
  });
  return getJson<UserLocation>(res);
}

export async function updateUserLocation(
  location: UserLocation,
): Promise<UserLocation> {
  const { id, ...body } = location;
  const res = await fetch(`${base}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return getJson<UserLocation>(res);
}

export async function deleteUserLocation(locationId: string): Promise<void> {
  const res = await fetch(`${base}/${locationId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(res.statusText);
}
