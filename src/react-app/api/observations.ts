import { supabase } from "../lib/supabase.ts";
import { Observation, Species } from "../types/observation.ts";

export async function fetchObservations(
  userId?: string,
): Promise<Observation[]> {
  let query = supabase
    .from("observations")
    .select("*, species (*)")
    .order("createdAt", { ascending: false });

  if (userId) {
    query = query.eq("userId", userId);
  } else {
    query = query.is("userId", null);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []).map((row) => {
    const { medobservatorName, ...rest } = row as typeof row & { medobservatorName?: string };
    return { ...rest, coObserverName: medobservatorName } as Observation;
  });
}

export type CreateObservation = Omit<
  Observation,
  "id" | "createdAt" | "updatedAt" | "species"
> & { species: CreateSpecies[] };

export type CreateSpecies = Omit<
  Species,
  "id" | "createdAt" | "count" | "gender"
>;

export async function createObservation(
  observation: CreateObservation,
  user: { id: string } | null = null,
): Promise<Observation> {
  const { species, coObserverName, ...observationRow } = observation;

  const { data: insertedObs, error: obsError } = await supabase
    .from("observations")
    .insert({ ...observationRow, medobservatorName: coObserverName, userId: user?.id })
    .select(
      `
      *,
      species:species (*)
      `,
    )
    .single();

  if (obsError) throw obsError;
  if (!insertedObs) throw new Error("Failed to insert observation");
  const { medobservatorName: insertedMedo, ...insertedRest } = insertedObs as typeof insertedObs & { medobservatorName?: string };
  const mappedObs = { ...insertedRest, coObserverName: insertedMedo } as Observation;

  // 2) insert child rows (if any)
  if (species.length > 0) {
    const { error: childError } = await supabase
      .from("species")
      .insert(
        species.map((obs) => ({ ...obs, observationId: insertedObs.id })),
      );

    if (childError) throw childError;
  }

  return mappedObs;
}

export async function updateObservation(
  updatedObservation: Observation,
): Promise<Observation> {
  const {
    id: observationId,
    species,
    coObserverName,
    ...observationPatch
  } = updatedObservation;

  // 1) Update parent (only if there are fields to update)
  const { data: observation, error: parentError } = await supabase
    .from("observations")
    .update({
      ...observationPatch,
      medobservatorName: coObserverName,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", observationId)
    .select(
      `
      *,
      species:species (*)
      `,
    )
    .single();

  if (parentError) throw parentError;
  const { medobservatorName: updatedMedo, ...updatedRest } = observation as typeof observation & { medobservatorName?: string };
  const mappedObservation = { ...updatedRest, coObserverName: updatedMedo } as Observation;

  // 2) Replace children if provided
  if (species) {
    // delete existing child rows
    const { error: delError } = await supabase
      .from("species")
      .delete()
      .eq("observationId", observationId);

    if (delError) throw delError;

    // insert new child rows (if any)
    if (species.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const updatedSpecies = species.map(({ id, ...obs }) => ({
        ...obs,
        createdAt: obs.createdAt
          ? new Date(obs.createdAt).toISOString()
          : new Date().toISOString(),
        observationId,
      }));

      const { error: insError } = await supabase
        .from("species")
        .insert(updatedSpecies);

      if (insError) throw insError;
    }
  }

  return mappedObservation;
}

export async function deleteObservation(observationId: string): Promise<void> {
  const { error } = await supabase
    .from("observations")
    .delete()
    .eq("id", observationId);

  if (error) throw error;
}
