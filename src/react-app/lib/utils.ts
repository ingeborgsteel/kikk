import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Observation } from "../types/observation";
import { TaxonRecord } from "../types/artsdatabanken";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Checks whether an area polygon has enough vertices to be valid (at least 3).
 */
export function isValidPolygon(
  area: [number, number][] | undefined | null,
): area is [number, number][] {
  return Array.isArray(area) && area.length >= 3;
}

/**
 * Extract the 5 most recently observed unique species from observations
 * Species are ordered by the most recent observation date (updatedAt)
 */
export function getRecentSpecies(
  observations: Observation[],
  limit = 5,
): TaxonRecord[] {
  // Create a map to track the most recent observation for each species
  const speciesMap = new Map<number, { species: TaxonRecord; date: string }>();

  // Iterate through all observations
  for (const obs of observations) {
    for (const speciesObs of obs.species) {
      const speciesId = speciesObs.species.Id;
      const existingEntry = speciesMap.get(speciesId);

      // Keep the species with the most recent observation date
      if (!existingEntry || obs.updatedAt > existingEntry.date) {
        speciesMap.set(speciesId, {
          species: speciesObs.species,
          date: obs.updatedAt,
        });
      }
    }
  }

  // Sort by date (most recent first) and take the top limit
  return Array.from(speciesMap.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit)
    .map((entry) => entry.species);
}

/**
 * Represents a single entry in a user's life list (unique species checklist).
 */
export interface LifeListEntry {
  species: TaxonRecord;
  totalCount: number;
  observationCount: number;
  firstSeen: string; // ISO date string
  lastSeen: string; // ISO date string
  firstLocation?: string;
  lastLocation?: string;
}

/**
 * Build a life list from all observations.
 * Returns an array of unique species with aggregated stats:
 * first/last seen dates, total count, number of observations, and conservation status.
 * Sorted alphabetically by preferred popular name by default.
 */
export function getLifeList(observations: Observation[]): LifeListEntry[] {
  const speciesMap = new Map<
    number,
    {
      species: TaxonRecord;
      totalCount: number;
      observationCount: number;
      firstSeen: string;
      lastSeen: string;
      firstLocation?: string;
      lastLocation?: string;
    }
  >();

  for (const obs of observations) {
    const obsDate = obs.startDate || obs.createdAt;
    for (const speciesObs of obs.species) {
      const speciesId = speciesObs.species.Id;
      const existing = speciesMap.get(speciesId);

      if (existing) {
        existing.totalCount += speciesObs.count;
        existing.observationCount += 1;
        if (obsDate < existing.firstSeen) {
          existing.firstSeen = obsDate;
          existing.firstLocation = obs.locationName;
        }
        if (obsDate > existing.lastSeen) {
          existing.lastSeen = obsDate;
          existing.lastLocation = obs.locationName;
        }
      } else {
        speciesMap.set(speciesId, {
          species: speciesObs.species,
          totalCount: speciesObs.count,
          observationCount: 1,
          firstSeen: obsDate,
          lastSeen: obsDate,
          firstLocation: obs.locationName,
          lastLocation: obs.locationName,
        });
      }
    }
  }

  return Array.from(speciesMap.values()).sort((a, b) =>
    (a.species.PrefferedPopularname || a.species.ValidScientificName).localeCompare(
      b.species.PrefferedPopularname || b.species.ValidScientificName,
      "no",
    ),
  );
}

/**
 * Rank and sort species search results by relevance to the search term.
 * Popular name matching is prioritised over scientific name matching.
 * Shorter names that closely match the search term rank higher
 * (e.g. "kråke" ranks above "kråkefamilien" when searching "kråke").
 * Ties are broken by original API order.
 */
export function rankSpeciesResults(
  results: TaxonRecord[],
  searchTerm: string,
  previouslyObservedIds: Set<number> = new Set(),
): TaxonRecord[] {
  if (!searchTerm || results.length === 0) return results;

  const term = searchTerm.toLowerCase();

  const scored = results.map((species, index) => {
    let score = 0;
    const popular = species.PrefferedPopularname?.toLowerCase() ?? "";
    const scientific = species.ValidScientificName?.toLowerCase() ?? "";
    const matched = species.MatchedName?.toLowerCase() ?? "";

    // Popular name matching (primary criterion)
    if (popular === term) {
      score += 200;
    } else if (popular.startsWith(term)) {
      // Shorter names that closely match the term score higher.
      // Ratio is 1.0 for exact length, approaches 0 for very long names.
      const closeness = term.length / popular.length;
      score += 100 + Math.round(closeness * 50);
    } else if (popular.includes(term)) {
      const closeness = term.length / popular.length;
      score += 40 + Math.round(closeness * 20);
    }

    // Scientific name matching (secondary)
    if (scientific === term) {
      score += 50;
    } else if (scientific.startsWith(term)) {
      score += 35;
    } else if (scientific.includes(term)) {
      score += 15;
    }

    // MatchedName starts with search term
    if (matched.startsWith(term)) {
      const closeness = term.length / matched.length;
      score += 30 + Math.round(closeness * 20);
    }

    // Boost previously observed species
    if (previouslyObservedIds.has(species.Id)) {
      score += 25;
    }

    // Boost species existing in Norway
    if (species.ExistsInCountry) {
      score += 10;
    }

    return { species, score, index };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.species);
}

/**
 * Reverse geocode coordinates to get a human-readable location name
 * Uses OpenStreetMap Nominatim API
 */
export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=no`,
      {
        headers: {
          "User-Agent": "kikk-app/1.0 (+https://github.com/ingeborgsteel/kikk)", // Required by Nominatim usage policy
        },
      },
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    // Build a location name from available data
    // Priority: village/town/city, municipality, county
    const parts: string[] = [];

    if (data.address) {
      const addr = data.address;
      // Add locality (village, town, city, etc.)
      const locality =
        addr.farm ||
        addr.leisure ||
        addr.neighbourhood ||
        addr.hamlet ||
        addr.road ||
        addr.village ||
        addr.town ||
        addr.city ||
        addr.suburb;
      if (locality) parts.push(locality);

      // Add municipality if different from locality
      if (addr.municipality && addr.municipality !== locality) {
        parts.push(addr.municipality);
      }
    }

    // If we have parts, join them; otherwise use display_name
    if (parts.length > 0) {
      return parts.join(", ");
    } else if (data.display_name) {
      // Fallback to first part of display_name (usually the most specific)
      return data.display_name.split(",")[0];
    }

    return null;
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    return null;
  }
}
