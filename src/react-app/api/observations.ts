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
): Promise<Observation> {
  // Use RPC function for atomic insert
  const {speciesObservations, ...observationRow} = input;

  const {data, error} = await supabase
    .rpc("create_observation_with_species", {
      observation_data: observationRow,
      species_observations_data: speciesObservations,
      user_id: user?.id || null,
    });

  if (error) throw error;
  if (!data) throw new Error("Failed to insert observation");

  return data as Observation;
}

export async function updateObservation(updatedObservation: Observation): Promise<Observation> {
  const {id, speciesObservations, ...observationPatch} = updatedObservation;

  // 1) Update parent (only if there are fields to update)
  const {data: observation, error: parentError} = await supabase
    .from("observations")
    .update({
      ...observationPatch,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .select(`
      *,
      speciesObservations:speciesObservations (*)
      `)
    .single();

  if (parentError) throw parentError;

  // 2) Replace children if provided
  if (speciesObservations) {
    // delete existing child rows
    const {error: delError} = await supabase
      .from("speciesObservations")
      .delete()
      .eq("observationId", id);

    if (delError) throw delError;

    // insert new child rows (if any)
    if (speciesObservations.length > 0) {

      const {error: insError} = await supabase
        .from("speciesObservations")
        .insert(speciesObservations.map((obs) => ({...obs, observationId: id})));

      if (insError) throw insError;
    }
  }

  return observation;
}

export async function deleteObservation(observationId: string): Promise<void> {
  const {error} = await supabase
    .from("observations")
    .delete()
    .eq("id", observationId);

  if (error) throw error;
}