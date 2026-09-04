import { useMutation } from "@tanstack/react-query";
import {
  generateExcelFromObservations,
  downloadExcelFile,
} from "../api/exports";
import { markObservationsAsExported } from "../api/observations.ts";
import { Observation } from "../types/observation";

/**
 * Hook to export observations to Excel
 */
export function useExportObservations() {
  return useMutation({
    mutationFn: async ({ observations }: { observations: Observation[] }) => {
      const timestamp = new Date().toISOString();
      const fileName = `observations-export-${timestamp}.xlsx`;
      const blob = await generateExcelFromObservations(observations);
      downloadExcelFile(blob, fileName);

      if (observations.length > 0) {
        await markObservationsAsExported(observations.map((o) => o.id));
      }

      return { fileName, blob };
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
