import { TaxonRecord } from "./artsdatabanken.ts";

export interface Species {
  id: string;
  createdAt: string;
  species: TaxonRecord;
  gender?: string;
  count?: number;
  unit?: string; // Unit for the count (e.g., "individuals", "pairs")
  age?: string; // Age of the observed species
  method?: string; // Observation method
  activity?: string; // Activity observed
  comment?: string; // Per-species comment (visible to all)
  privateComment?: string; // Private comment
  notRediscovered?: boolean; // Not rediscovered
  notFound?: boolean; // Not found
  privateCollection?: string; // Name of collection owner
  secondHand?: boolean; // Second-hand observation
  uncertainIdentification?: boolean; // Uncertain species identification
  hide?: boolean; // Mark species to hide from Artsobservasjoner (but still export to Excel)
  delayPublication?: string; // ISO date string for when to delay publication to
}

export interface Observation {
  id: string;
  location: {
    lat: number;
    lng: number;
  };
  locationName?: string; // Optional human-readable location name
  uncertaintyRadius: number; // in meters
  species: Species[];
  startDate: string; // ISO date string for start time
  endDate?: string; // ISO date string for end time
  comment: string;
  createdAt: string;
  updatedAt: string;
  lastExportedAt?: string; // ISO date string of last export, null if never exported
  exportCount?: number; // Number of times this observation has been exported
  locationId?: string;
  observerName?: string; // Name of the observer (selected user or freetext)
}
