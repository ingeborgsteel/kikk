import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { Observation } from '../types/observation';
import { ExportLog } from '../types/export';

/**
 * Generate Excel file from observations
 */
export function generateExcelFromObservations(observations: Observation[]): Blob {
  // Flatten observations for Excel format
  const rows = observations.flatMap((obs) =>
    obs.species.map((spec) => ({
      'Observation ID': obs.id,
      'Location Name': obs.locationName || '',
      'Latitude': obs.location.lat,
      'Longitude': obs.location.lng,
      'Uncertainty (m)': obs.uncertaintyRadius,
      'Start Date': new Date(obs.startDate).toLocaleString('no-NO'),
      'End Date': new Date(obs.endDate).toLocaleString('no-NO'),
      'Species (Norwegian)': spec.species.PrefferedPopularname,
      'Species (Scientific)': spec.species.ValidScientificName,
      'Count': spec.count,
      'Gender': spec.gender,
      'Age': spec.age || '',
      'Method': spec.method || '',
      'Activity': spec.activity || '',
      'Species Comment': spec.comment || '',
      'General Comment': obs.comment,
      'Created At': new Date(obs.createdAt).toLocaleString('no-NO'),
      'Updated At': new Date(obs.updatedAt).toLocaleString('no-NO'),
      'Last Exported At': obs.lastExportedAt ? new Date(obs.lastExportedAt).toLocaleString('no-NO') : 'Never',
      'Export Count': obs.exportCount || 0,
    }))
  );

  // Create workbook and worksheet
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Observations');

  // Auto-size columns
  const maxWidth = 50;
  const colWidths = Object.keys(rows[0] || {}).map((key) => {
    const maxLength = Math.max(
      key.length,
      ...rows.map((row) => String(row[key as keyof typeof row] || '').length)
    );
    return { wch: Math.min(maxLength + 2, maxWidth) };
  });
  ws['!cols'] = colWidths;

  // Generate buffer
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * Download Excel file
 */
export function downloadExcelFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Save export log to Supabase
 */
export async function saveExportLog(
  observationIds: string[],
  fileName: string,
  filePath: string | null,
  userId: string | null
): Promise<ExportLog> {
  const exportLog: Omit<ExportLog, 'id' | 'createdAt'> = {
    userId: userId || undefined,
    exportedAt: new Date().toISOString(),
    observationIds,
    fileName,
    filePath: filePath || undefined,
    observationCount: observationIds.length,
  };

  const { data, error } = await supabase
    .from('export_logs')
    .insert(exportLog)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch export logs
 */
export async function fetchExportLogs(userId?: string): Promise<ExportLog[]> {
  let query = supabase
    .from('export_logs')
    .select('*')
    .order('exportedAt', { ascending: false });

  if (userId) {
    query = query.eq('userId', userId);
  } else {
    query = query.is('userId', null);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Update observations as exported
 */
export async function markObservationsAsExported(
  observationIds: string[]
): Promise<void> {
  const now = new Date().toISOString();

  // The trigger will handle incrementing export_count
  const { error } = await supabase
    .from('observations')
    .update({
      lastExportedAt: now,
    })
    .in('id', observationIds);

  if (error) throw error;
}

/**
 * Upload Excel file to Supabase Storage
 */
export async function uploadExcelToStorage(
  blob: Blob,
  fileName: string,
  userId: string | null
): Promise<string> {
  const bucketName = 'exports';
  const folder = userId || 'anonymous';
  const filePath = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, blob, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: false,
    });

  if (error) throw error;
  return filePath;
}

/**
 * Download Excel file from Supabase Storage
 */
export async function downloadExcelFromStorage(filePath: string): Promise<Blob> {
  const bucketName = 'exports';

  const { data, error } = await supabase.storage
    .from(bucketName)
    .download(filePath);

  if (error) throw error;
  if (!data) throw new Error('File not found');

  return data;
}

/**
 * Get public URL for an exported file
 */
export function getExportFileUrl(filePath: string): string {
  const bucketName = 'exports';
  const { data } = supabase.storage.from(bucketName).getPublicUrl(filePath);
  return data.publicUrl;
}
