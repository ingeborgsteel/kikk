import ExcelJS from 'exceljs';
import { supabase } from '../lib/supabase';
import { Observation } from '../types/observation';
import { ExportLog } from '../types/export';

/**
 * Generate Excel file from observations
 */
export async function generateExcelFromObservations(observations: Observation[]): Promise<Blob> {
  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Observations');

  // Define columns
  worksheet.columns = [
    { header: 'Observation ID', key: 'observationId', width: 15 },
    { header: 'Location Name', key: 'locationName', width: 20 },
    { header: 'Latitude', key: 'latitude', width: 12 },
    { header: 'Longitude', key: 'longitude', width: 12 },
    { header: 'Uncertainty (m)', key: 'uncertainty', width: 15 },
    { header: 'Start Date', key: 'startDate', width: 20 },
    { header: 'End Date', key: 'endDate', width: 20 },
    { header: 'Species (Norwegian)', key: 'speciesNorwegian', width: 25 },
    { header: 'Species (Scientific)', key: 'speciesScientific', width: 25 },
    { header: 'Count', key: 'count', width: 10 },
    { header: 'Gender', key: 'gender', width: 10 },
    { header: 'Age', key: 'age', width: 15 },
    { header: 'Method', key: 'method', width: 15 },
    { header: 'Activity', key: 'activity', width: 15 },
    { header: 'Species Comment', key: 'speciesComment', width: 30 },
    { header: 'General Comment', key: 'generalComment', width: 30 },
    { header: 'Created At', key: 'createdAt', width: 20 },
    { header: 'Updated At', key: 'updatedAt', width: 20 },
    { header: 'Last Exported At', key: 'lastExportedAt', width: 20 },
    { header: 'Export Count', key: 'exportCount', width: 12 },
  ];

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add data rows
  observations.forEach((obs) => {
    obs.species.forEach((spec) => {
      worksheet.addRow({
        observationId: obs.id,
        locationName: obs.locationName || '',
        latitude: obs.location.lat,
        longitude: obs.location.lng,
        uncertainty: obs.uncertaintyRadius,
        startDate: new Date(obs.startDate).toLocaleString('no-NO'),
        endDate: new Date(obs.endDate).toLocaleString('no-NO'),
        speciesNorwegian: spec.species.PrefferedPopularname,
        speciesScientific: spec.species.ValidScientificName,
        count: spec.count,
        gender: spec.gender,
        age: spec.age || '',
        method: spec.method || '',
        activity: spec.activity || '',
        speciesComment: spec.comment || '',
        generalComment: obs.comment,
        createdAt: new Date(obs.createdAt).toLocaleString('no-NO'),
        updatedAt: new Date(obs.updatedAt).toLocaleString('no-NO'),
        lastExportedAt: obs.lastExportedAt
          ? new Date(obs.lastExportedAt).toLocaleString('no-NO')
          : 'Never',
        exportCount: obs.exportCount || 0,
      });
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
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
