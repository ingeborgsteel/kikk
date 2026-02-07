export interface Species {
  id: number;
  scientificName: string;
  vernacularName: string;
  scientificNameId: number;
  acceptedScientificName: string;
}

export interface SpeciesObservation {
  species: Species;
  gender: 'male' | 'female' | 'unknown';
  count: number;
  comment: string; // Per-species comment
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

export interface TaxonSearchResponse {
  items: Array<{
    id: number;
    scientificName: string;
    vernacularName: string;
    scientificNameId: number;
    acceptedScientificName: string;
  }>;
}
