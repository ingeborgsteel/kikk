import {TaxonRecord} from "./artsdatabanken.ts";

export interface Species {
  id: string;
  createdAt: string;
  species: TaxonRecord;
  gender: 'male' | 'female' | 'unknown';
  count: number;
  age?: string; // Age of the observed species
  method?: string; // Observation method
  activity?: string; // Activity observed
  comment?: string; // Per-species comment
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
  endDate: string; // ISO date string for end time
  comment: string;
  createdAt: string;
  updatedAt: string;
  lastExportedAt?: string; // ISO date string of last export, null if never exported
  exportCount?: number; // Number of times this observation has been exported
}
