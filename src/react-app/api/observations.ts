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

  // Use RPC function for atomic update
  const {data, error} = await supabase
    .rpc("update_observation_with_species", {
      observation_id: id,
      observation_data: observationPatch,
      species_observations_data: speciesObservations,
    });

  if (error) throw error;
  if (!data) throw new Error("Failed to update observation");

  return data as Observation;
}

export async function deleteObservation(observationId: string): Promise<void> {
  const {error} = await supabase
    .from("observations")
    .delete()
    .eq("id", observationId);

  if (error) throw error;
}