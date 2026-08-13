import ExcelJS from "exceljs";
import { Observation } from "../types/observation";

/**
 * Generate Excel file from observations
 */
export async function generateExcelFromObservations(
  observations: Observation[],
): Promise<Blob> {
  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Observations");

  // Define columns
  worksheet.columns = [
    { header: "Skjul", key: "hide", width: 10 },
    { header: "Artsnavn", key: "speciesName", width: 25 },
    { header: "Lokalitetsnavn", key: "locationName", width: 20 },
    { header: "Nord", key: "latitude", width: 12 },
    { header: "Øst", key: "longitude", width: 12 },
    { header: "Nøyaktighet", key: "uncertainty", width: 15 },
    { header: "Antall", key: "count", width: 10 },
    { header: "Enhet", key: "unit", width: 10 },
    { header: "Kjønn", key: "gender", width: 10 },
    { header: "Alder", key: "age", width: 15 },
    { header: "Metode", key: "method", width: 15 },
    { header: "Aktivitet", key: "activity", width: 15 },
    { header: "Fra klokkeslett", key: "startTime", width: 20 },
    { header: "Til klokkeslett", key: "endTime", width: 20 },
    { header: "Fra dato", key: "startDate", width: 20 },
    { header: "Til dato", key: "endDate", width: 20 },
    { header: "Utsett publisering", key: "delayPublication", width: 20 },
    { header: "Kommentar (synlig for alle)", key: "comment", width: 30 },
    { header: "Privat kommentar", key: "privateComment", width: 30 },
    { header: "Ikke gjenfunnet", key: "notRediscovered", width: 10 },
    { header: "Ikke funnet", key: "notFound", width: 10 },
    { header: "Privat samling", key: "privateCollection", width: 20 },
    { header: "Andrehånds", key: "secondHand", width: 10 },
    {
      header: "Usikker artsbestemming",
      key: "uncertainIdentification",
      width: 10,
    },
    { header: "Biotop", key: "biotope", width: 20 },
    { header: "Beskrivelse av biotop", key: "biotopeDescription", width: 30 },
    { header: "Prosjekt", key: "project", width: 20 },
    { header: "Medobservatør", key: "observerName", width: 20 },
    { header: "Sist eksportert", key: "lastExportedAt", width: 20 },
  ];

  // Style the header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  // Add data rows
  observations.forEach((obs) => {
    obs.species.forEach((spec) => {
      worksheet.addRow({
        observerName: obs.observerName || undefined,
        locationName: obs.locationName,
        latitude: obs.location.lat.toString().replace(",", "."),
        longitude: obs.location.lng.toString().replace(",", "."),
        uncertainty: obs.uncertaintyRadius ? `${obs.uncertaintyRadius} m` : "",
        startDate: parseDateString(obs.startDate),
        startTime: parseTimeString(obs.startDate, true),
        endDate: parseDateString(obs.endDate),
        endTime: parseTimeString(obs.endDate, true),
        lastExportedAt: parseDateString(obs.lastExportedAt),
        speciesName: spec.species.PrefferedPopularname,
        count: spec.count,
        unit: spec.unit || undefined,
        gender: spec.gender || undefined,
        age: spec.age || undefined,
        method: spec.method || undefined,
        activity: spec.activity || undefined,
        comment: spec.comment || undefined,
        privateComment: spec.privateComment || undefined,
        privateCollection: spec.privateCollection || undefined,
        notRediscovered: parseBoolean(spec.notRediscovered),
        notFound: parseBoolean(spec.notFound),
        secondHand: parseBoolean(spec.secondHand),
        uncertainIdentification: parseBoolean(spec.uncertainIdentification),
        biotope: spec.biotope || undefined,
        biotopeDescription: spec.biotopeDescription || undefined,
        project: obs.project || undefined,
        hide: parseBoolean(spec.hide),
        delayPublication: parseDateString(spec.delayPublication),
      });
    });
  });

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

/**
 * Download Excel file
 */
export function downloadExcelFile(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const parseBoolean = (bool?: boolean) => {
  return bool ? "x" : undefined;
};

const parseDateString = (date?: string) => {
  return date ? new Date(date).toLocaleDateString("no-NO") : undefined;
};

const parseTimeString = (date?: string, midnightAsNull?: boolean) => {
  if (!date) return undefined;
  const parsed = new Date(date).toLocaleTimeString("no-NO", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return parsed === "00:00" && midnightAsNull ? undefined : parsed;
};
