import { Observation, Species } from "../types/observation.ts";

const base = "/api/observations";

export type CreateObservation = Omit<
  Observation,
  "id" | "createdAt" | "updatedAt" | "species"
> & { species: CreateSpecies[] };

export type CreateSpecies = Omit<
  Species,
  "id" | "createdAt" | "count" | "gender"
>;

async function getJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function fetchObservations(
  userId?: string,
): Promise<Observation[]> {
  const url = userId ? `${base}?userId=${encodeURIComponent(userId)}` : base;
  const res = await fetch(url);
  return getJson<Observation[]>(res);
}

export async function createObservation(
  observation: CreateObservation,
  user: { id: string } | null = null,
): Promise<Observation> {
  const res = await fetch(base, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...observation, userId: user?.id }),
  });
  return getJson<Observation>(res);
}

export async function updateObservation(
  updatedObservation: Observation,
): Promise<Observation> {
  const { id, ...body } = updatedObservation;
  const res = await fetch(`${base}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return getJson<Observation>(res);
}

export async function deleteObservation(observationId: string): Promise<void> {
  const res = await fetch(`${base}/${observationId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(res.statusText);
}

export async function markObservationsAsExported(
  observationIds: string[],
): Promise<void> {
  const res = await fetch(`${base}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids: observationIds }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
}
