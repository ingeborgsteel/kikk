import { supabase } from "../lib/supabase.ts";
import { Observation, Species } from "../types/observation.ts";
import { logError, logInfo } from "../lib/logger.ts";

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
  return data ?? [];
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
  const { species, ...observationRow } = observation;

  await logInfo(`[createObservation] Creating new observation`, {
    speciesCount: species.length,
    userId: user?.id ?? "anonymous",
    location: observationRow.location,
  });

  const { data: insertedObs, error: obsError } = await supabase
    .from("observations")
    .insert({ ...observationRow, userId: user?.id })
    .select(
      `
      *,
      species:species (*)
      `,
    )
    .single();

  if (obsError) {
    await logError(
      `[createObservation] Failed to create observation`,
      obsError,
    );
    throw obsError;
  }
  if (!insertedObs) {
    await logError(`[createObservation] No data returned after insert`);
    throw new Error("Failed to insert observation");
  }

  await logInfo(`[createObservation] Created observation ${insertedObs.id}`);

  // 2) insert child rows (if any)
  if (species.length > 0) {
    await logInfo(
      `[createObservation] Inserting ${species.length} species for observation ${insertedObs.id}`,
    );

    const { error: childError } = await supabase.from("species").insert(
      species.map((obs) => ({
        ...obs,
        observationId: insertedObs.id,
        // Ensure boolean fields have default values to satisfy NOT NULL constraints
        hide: obs.hide ?? false,
        notRediscovered: obs.notRediscovered ?? false,
        notFound: obs.notFound ?? false,
        secondHand: obs.secondHand ?? false,
        uncertainIdentification: obs.uncertainIdentification ?? false,
      })),
    );

    if (childError) {
      await logError(
        `[createObservation] Failed to insert species for observation ${insertedObs.id}`,
        childError,
      );
      throw childError;
    }

    await logInfo(
      `[createObservation] Successfully inserted ${species.length} species for observation ${insertedObs.id}`,
    );
  }

  await logInfo(
    `[createObservation] Completed creation of observation ${insertedObs.id}`,
  );

  return insertedObs;
}

export async function updateObservation(
  updatedObservation: Observation,
): Promise<Observation> {
  const {
    id: observationId,
    species,
    ...observationPatch
  } = updatedObservation;

  await logInfo(
    `[updateObservation] Starting update for observation ${observationId}`,
    {
      speciesCount: species?.length ?? 0,
      hasSpecies: !!species,
    },
  );

  // 1) Update parent (only if there are fields to update)
  const { data: observation, error: parentError } = await supabase
    .from("observations")
    .update({
      ...observationPatch,
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

  if (parentError) {
    await logError(
      `[updateObservation] Failed to update observation ${observationId}`,
      parentError,
    );
    throw parentError;
  }

  await logInfo(
    `[updateObservation] Updated parent observation ${observationId}`,
  );

  // 2) Replace children if provided
  if (species) {
    await logInfo(
      `[updateObservation] Replacing species for observation ${observationId}`,
      {
        oldSpeciesCount: observation.species?.length ?? 0,
        newSpeciesCount: species.length,
      },
    );

    // Insert new child rows FIRST (safer - if this fails, old data is preserved)
    if (species.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const updatedSpecies = species.map(({ id, ...obs }) => ({
        ...obs,
        createdAt: obs.createdAt
          ? new Date(obs.createdAt).toISOString()
          : new Date().toISOString(),
        observationId,
        // Ensure boolean fields have default values to satisfy NOT NULL constraints
        hide: obs.hide ?? false,
        notRediscovered: obs.notRediscovered ?? false,
        notFound: obs.notFound ?? false,
        secondHand: obs.secondHand ?? false,
        uncertainIdentification: obs.uncertainIdentification ?? false,
      }));

      const { error: insError } = await supabase
        .from("species")
        .insert(updatedSpecies);

      if (insError) {
        await logError(
          `[updateObservation] Failed to insert species for observation ${observationId}`,
          insError,
        );
        throw insError;
      }

      await logInfo(
        `[updateObservation] Inserted ${species.length} species for observation ${observationId}`,
      );
    }

    // Then delete existing child rows (after successful insert)
    const { error: delError } = await supabase
      .from("species")
      .delete()
      .eq("observationId", observationId)
      .not("id", "in", `(${species.map((s) => s.id).join(",")})`);

    if (delError) {
      await logError(
        `[updateObservation] Failed to delete old species for observation ${observationId}`,
        delError,
      );
      throw delError;
    }

    await logInfo(
      `[updateObservation] Deleted old species for observation ${observationId}`,
    );
  }

  await logInfo(
    `[updateObservation] Completed update for observation ${observationId}`,
  );

  return observation;
}

export async function deleteObservation(observationId: string): Promise<void> {
  const { error } = await supabase
    .from("observations")
    .delete()
    .eq("id", observationId);

  if (error) throw error;
}
