import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Observation } from "../types/observation"
import { TaxonRecord } from "../types/artsdatabanken"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extract the 5 most recently observed unique species from observations
 * Species are ordered by the most recent observation date (updatedAt)
 */
export function getRecentSpecies(observations: Observation[], limit = 5): TaxonRecord[] {
  // Create a map to track the most recent observation for each species
  const speciesMap = new Map<number, { species: TaxonRecord; date: string }>();
  
  // Iterate through all observations
  for (const obs of observations) {
    for (const speciesObs of obs.speciesObservations) {
      const speciesId = speciesObs.species.Id;
      const existingEntry = speciesMap.get(speciesId);
      
      // Keep the species with the most recent observation date
      if (!existingEntry || obs.updatedAt > existingEntry.date) {
        speciesMap.set(speciesId, {
          species: speciesObs.species,
          date: obs.updatedAt
        });
      }
    }
  }
  
  // Sort by date (most recent first) and take the top limit
  return Array.from(speciesMap.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
    .map(entry => entry.species);
}
