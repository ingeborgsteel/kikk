export interface ExportLog {
  id: string;
  userId?: string; // null for logged-out users
  exportedAt: string; // ISO date string
  observationIds: string[]; // IDs of observations included in the export
  fileName: string;
  filePath?: string; // Path in Supabase Storage (if saved)
  observationCount: number;
  createdAt: string;
}

export interface ObservationExportStatus {
  observationId: string;
  lastExportedAt?: string; // null if never exported
  exportCount: number; // how many times this observation has been exported
}
