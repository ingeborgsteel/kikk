import {TaxonRecord} from "./artsdatabanken.ts";

export interface SpeciesObservation {
  species: TaxonRecord;
  gender: 'male' | 'female' | 'unknown';
  count: number;
  comment?: string; // Per-species comment
}

export interface Observation {
  id: string;
  location: {
    lat: number;
    lng: number;
  };
  uncertaintyRadius: number; // in meters
  speciesObservations: SpeciesObservation[];
  date: string; // ISO date string
  comment: string;
  createdAt: string;
  updatedAt: string;
}
