import {supabase} from "../lib/supabase.ts";
import {Observation} from "../types/observation.ts";

export async function fetchObservations(userId?: string): Promise<Observation[]> {
  let query = supabase
    .from("observations")
    .select("*, speciesObservations (*)");

  if (userId) {
    query = query.eq("userId", userId);
  } else {
    query = query.is("userId", null);
  }

  const {data, error} = await query;

  if (error) throw error;
  return data ?? [];
}

export type CreateObservationInput = Omit<
  Observation,
  "id" | "createdAt" | "updatedAt"
>;

export async function createObservation(
  input: CreateObservationInput,
  user: { id: string } | null = null,
): Promise<Omit<Observation, "speciesObservations">> {
  // 1) insert parent observation (WITHOUT speciesObservations)
  const {speciesObservations, ...observationRow} = input;

  const {data: insertedObs, error: obsError} = await supabase
    .from("observations")
    .insert({...observationRow, userId: user?.id})
    .select(
      `
      *,
      speciesObservations:speciesObservations (*)
      `
    )
    .single();

  if (obsError) throw obsError;
  if (!insertedObs) throw new Error("Failed to insert observation");

  // 2) insert child rows (if any)
  if (speciesObservations.length > 0) {
    const {error: childError} = await supabase
      .from("speciesObservations")
      .insert(speciesObservations.map((obs) => ({...obs, observationId: insertedObs.id})));

    if (childError) throw childError;
  }

  return insertedObs;
}

export async function updateObservation(updatedObservation: Observation): Promise<string> {
  const {id, speciesObservations, ...observationPatch} = updatedObservation;

  // 1) Update parent (only if there are fields to update)
  const {error: parentError} = await supabase
    .from("observations")
    .update({
      ...observationPatch,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id);

  if (parentError) throw parentError;

  // 2) Replace children if provided
  if (speciesObservations) {
    // delete existing child rows
    const {error: delError} = await supabase
      .from("speciesObservation")
      .delete()
      .eq("observationId", id);

    if (delError) throw delError;

    // insert new child rows (if any)
    if (speciesObservations.length > 0) {

      const {error: insError} = await supabase
        .from("speciesObservation")
        .insert(speciesObservations.map((obs) => ({...obs, observationId: id})));

      if (insError) throw insError;
    }
  }

  return "ok";
}

export async function deleteObservation(observationId: string): Promise<void> {
  const {error} = await supabase
    .from("observations")
    .delete()
    .eq("id", observationId);

  if (error) throw error;
}