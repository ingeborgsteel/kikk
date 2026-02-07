// Database types for Supabase tables
import { TaxonRecord } from './artsdatabanken';

export interface DbObservation {
  id: string;
  user_id: string | null;
  latitude: number;
  longitude: number;
  uncertainty_radius: number;
  observation_date: string;
  comment: string;
  created_at: string;
  updated_at: string;
}

export interface DbSpeciesObservation {
  id: string;
  observation_id: string;
  species_data: TaxonRecord; // JSONB field containing TaxonRecord
  gender: 'male' | 'female' | 'unknown';
  count: number;
  comment: string | null;
  created_at: string;
}
