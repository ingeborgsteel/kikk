import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { isSupabaseConfigured } from "../lib/supabase";
import {
  downloadExcelFile,
  downloadExcelFromStorage,
  fetchExportLogs,
  generateExcelFromObservations,
  markObservationsAsExported,
  saveExportLog,
  uploadExcelToStorage,
} from "../api/exports";
import { Observation } from "../types/observation";
import { Export } from "../types/export";

/**
 * Hook to fetch export logs
 */
export function useExportLogs() {
  const { user } = useAuth();
  const supabaseConfigured = isSupabaseConfigured();

  return useQuery<Export[]>({
    queryKey: ["exports", user?.id],
    queryFn: () => fetchExportLogs(user?.id),
    enabled: supabaseConfigured,
  });
}

/**
 * Hook to export observations to Excel
 */
export function useExportObservations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const supabaseConfigured = isSupabaseConfigured();

  return useMutation({
    mutationFn: async ({
      observations,
      saveToStorage = true,
    }: {
      observations: Observation[];
      saveToStorage?: boolean;
    }) => {
      // Generate Excel file
      const timestamp = new Date().toLocaleString();
      const fileName = `observations-export-${timestamp}.xlsx`;
      const blob = await generateExcelFromObservations(observations);

      // Download the file locally
      downloadExcelFile(blob, fileName);

      // If Supabase is configured, save to storage and create log
      if (supabaseConfigured && saveToStorage) {
        try {
          // Upload to storage
          const filePath = await uploadExcelToStorage(
            blob,
            fileName,
            user?.id || null,
          );

          // Save export log
          const observationIds = observations.map((obs) => obs.id);
          await saveExportLog(
            observationIds,
            fileName,
            filePath,
            user?.id || null,
          );

          // Mark observations as exported
          await markObservationsAsExported(observationIds);
        } catch (error) {
          console.error("Failed to save export to Supabase:", error);
          // Still return success since local download worked
        }
      }

      return { fileName, blob };
    },
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["exports"] });
      queryClient.invalidateQueries({ queryKey: ["observations"] });
    },
  });
}

/**
 * Hook to download a previous export from storage
 */
export function useDownloadExport() {
  return useMutation({
    mutationFn: async ({
      filePath,
      fileName,
    }: {
      filePath: string;
      fileName: string;
    }) => {
      const blob = await downloadExcelFromStorage(filePath);
      downloadExcelFile(blob, fileName);
      return { fileName };
    },
  });
}

/**
 * Get observations that have never been exported
 */
export function getUnexportedObservations(
  observations: Observation[],
): Observation[] {
  return observations.filter((obs) => !obs.lastExportedAt);
}

/**
 * Get count of unexported observations
 */
export function getUnexportedCount(observations: Observation[]): number {
  return getUnexportedObservations(observations).length;
}
