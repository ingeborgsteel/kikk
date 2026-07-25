import { describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import { generateExcelFromObservations } from "./exports";
import { Observation } from "../types/observation";

function makeObservation(
  overrides: Partial<Observation["species"][number]>,
): Observation {
  return {
    id: "obs-1",
    location: { lat: 59.9, lng: 10.7 },
    uncertaintyRadius: 10,
    startDate: "2026-01-01T10:00:00.000Z",
    comment: "",
    createdAt: "2026-01-01T10:00:00.000Z",
    updatedAt: "2026-01-01T10:00:00.000Z",
    species: [
      {
        id: "species-1",
        createdAt: "2026-01-01T10:00:00.000Z",
        species: { PrefferedPopularname: "Rådyr" },
        ...overrides,
      },
    ],
  };
}

const COLUMN_HEADERS: Record<string, string> = {
  notFound: "Ikke funnet",
};

async function boolCellIn(observation: Observation, columnKey: string) {
  const blob = await generateExcelFromObservations([observation]);
  const buffer = await blob.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.getWorksheet("Observations")!;

  const headerRow = worksheet.getRow(1);
  const header = COLUMN_HEADERS[columnKey];
  let columnNumber = -1;
  headerRow.eachCell((cell, colNumber) => {
    if (cell.value === header) columnNumber = colNumber;
  });
  if (columnNumber === -1) {
    throw new Error(`Could not find column with header "${header}"`);
  }

  return worksheet.getRow(2).getCell(columnNumber);
}

describe("generateExcelFromObservations - boolean columns", () => {
  it("renders a checked box as a visible mark", async () => {
    const cell = await boolCellIn(makeObservation({ notFound: true }), "notFound");
    expect(cell.value).toBe("x");
  });

  it("renders an unchecked (false) box as a truly empty cell", async () => {
    const cell = await boolCellIn(makeObservation({ notFound: false }), "notFound");

    // A falsy checkbox must produce a genuinely empty cell (value null/undefined),
    // not an empty string - Excel treats "" as populated content, which breaks
    // keyboard navigation (e.g. End-key jump-to-next-empty-cell) even though
    // nothing is visibly rendered.
    expect(cell.value == null).toBe(true);
    expect(cell.type).toBe(ExcelJS.ValueType.Null);
  });

  it("renders an unset (undefined) box as a truly empty cell", async () => {
    const cell = await boolCellIn(makeObservation({}), "notFound");

    expect(cell.value == null).toBe(true);
    expect(cell.type).toBe(ExcelJS.ValueType.Null);
  });
});
