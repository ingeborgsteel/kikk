export interface Export {
  id: string;
  userId?: string; // null for logged-out users
  observationIds: string[]; // IDs of observations included in the export
  fileName: string;
  filePath?: string; // Path in Supabase Storage (if saved)
  createdAt: string;
}
