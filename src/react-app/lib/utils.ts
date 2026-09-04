import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Observation, Species } from "../types/observation";
import { TaxonRecord } from "../types/artsdatabanken";
import { TAXON_GROUP_KEYS } from "./taxonGroups";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Extract the 5 most recently observed unique species from observations
 * Species are ordered by the most recent observation date (updatedAt)
 */
export function getRecentSpecies(
  observations: Observation[],
  limit = 5,
  excludeIds: Set<number | string> = new Set(),
): TaxonRecord[] {
  const speciesMap = new Map<
    number | string,
    { species: TaxonRecord; date: string }
  >();

  for (const obs of observations) {
    for (const speciesObs of obs.species) {
      const speciesId =
        speciesObs.species.Id ??
        speciesObs.species.PrefferedPopularname ??
        speciesObs.species.ValidScientificName ??
        "";
      const existingEntry = speciesMap.get(speciesId);

      if (!existingEntry || obs.updatedAt > existingEntry.date) {
        speciesMap.set(speciesId, {
          species: speciesObs.species,
          date: obs.updatedAt,
        });
      }
    }
  }

  return Array.from(speciesMap.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .filter(
      (entry) =>
        !excludeIds.has(
          entry.species.Id ?? entry.species.PrefferedPopularname ?? "",
        ),
    )
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
    number | string,
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
      const speciesId =
        speciesObs.species.Id ??
        speciesObs.species.PrefferedPopularname ??
        speciesObs.species.ValidScientificName ??
        "";
      const existing = speciesMap.get(speciesId);

      if (existing) {
        existing.totalCount += speciesObs.count ?? 0;
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
          totalCount: speciesObs.count ?? 0,
          observationCount: 1,
          firstSeen: obsDate,
          lastSeen: obsDate,
          firstLocation: obs.locationName,
          lastLocation: obs.locationName,
        });
      }
    }
  }

  return Array.from(speciesMap.values()).sort((a, b) => {
    const nameA =
      a.species.PrefferedPopularname || a.species.ValidScientificName || "";
    const nameB =
      b.species.PrefferedPopularname || b.species.ValidScientificName || "";
    return nameA.localeCompare(nameB, "no");
  });
}

const speciesNameOf = (s: Species): string =>
  s.species.PrefferedPopularname || s.species.ValidScientificName || "";

/**
 * Sort species by taxon group (systematic order from TAXON_GROUP_KEYS),
 * then alphabetically by preferred popular name within each group.
 * Species with an unknown/missing taxon group sort last.
 * Returns a new array; does not mutate the input.
 */
export function sortSpeciesByTaxonGroupAndName(species: Species[]): Species[] {
  const groupIndex = (taxonGroup?: string): number => {
    if (!taxonGroup) return TAXON_GROUP_KEYS.length;
    const index = TAXON_GROUP_KEYS.indexOf(
      taxonGroup.toLowerCase().trim() as (typeof TAXON_GROUP_KEYS)[number],
    );
    return index === -1 ? TAXON_GROUP_KEYS.length : index;
  };

  return [...species].sort((a, b) => {
    const groupDiff =
      groupIndex(a.species.TaxonGroup) - groupIndex(b.species.TaxonGroup);
    if (groupDiff !== 0) return groupDiff;
    return speciesNameOf(a).localeCompare(speciesNameOf(b), "no");
  });
}

/**
 * Sort species alphabetically by preferred popular name (A -> Å),
 * ignoring taxon group. Returns a new array; does not mutate the input.
 */
export function sortSpeciesAlphabetically(species: Species[]): Species[] {
  return [...species].sort((a, b) =>
    speciesNameOf(a).localeCompare(speciesNameOf(b), "no"),
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
    if (species.Id != null && previouslyObservedIds.has(species.Id)) {
      score += 25;
    }

    // Boost species existing in Norway
    if (species.ExistsInCountry === true) {
      score += 10;
    }

    return { species, score, index };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.species);
}
