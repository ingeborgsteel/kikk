export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string | null;
  createdAt: string;
  observationCount: number;
  speciesCount: number;
  individualCount: number;
  lastObservationAt: string | null;
}
