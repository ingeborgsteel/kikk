import { parse } from "csv-parse/sync";
import { readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { execSync } from "node:child_process";
import path from "node:path";

const __dirname = new URL(".", import.meta.url).pathname;
const TEMP_DIR = path.resolve(__dirname, "..", "temp");
const OUTPUT_SQL = path.resolve(TEMP_DIR, "import.sql");

const DB_NAME = "kikk-db";
const VERIFICATION_EXPIRY_DAYS = 30;

const USER_OVERRIDES: Record<string, { email: string; name: string }> = {
  "a09b4f4d-c9e0-437e-bf26-a38f0d7de397": {
    email: "christian.steel@nina.no",
    name: "Christian Steel",
  },
  "b8dc10ec-ecb8-4653-bbc3-0186916a50d0": {
    email: "ingeborg@steel.no",
    name: "Ingeborg Steel",
  },
};

const args = process.argv.slice(2);
const target = args.includes("--remote") ? "remote" : "local";
const shouldApply = args.includes("--apply");
const baseURL =
  args.find((a) => a.startsWith("--baseURL="))?.slice("--baseURL=".length) ||
  (target === "local" ? "http://localhost:5173" : "https://kikk.pages.dev");

function readCsv(fileName: string): Record<string, string>[] {
  const filePath = path.join(TEMP_DIR, fileName);
  const content = readFileSync(filePath, "utf-8");
  return parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];
}

function toIso(value: string | undefined | null): string | null {
  if (!value || value.trim() === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function toInt(value: string | undefined | null): number | null {
  if (!value || value.trim() === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function toBool(value: string | undefined | null): 0 | 1 {
  return value?.trim().toLowerCase() === "true" ? 1 : 0;
}

function sqlEscape(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function buildInsert(
  table: string,
  columns: string[],
  rows: (string | number | null | undefined)[][],
): string {
  if (rows.length === 0) return "";
  return chunk(rows, 25)
    .map(
      (batch) =>
        `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(", ")}) VALUES ${batch
          .map((row) => `(${row.map(sqlEscape).join(", ")})`)
          .join(", ")};`,
    )
    .join("\n");
}

const now = new Date().toISOString();
const verificationExpiry = new Date(
  Date.now() + VERIFICATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
).toISOString();

// --- Users ---
const profiles = readCsv("Profiles Table.csv");
const resetLinks: { email: string; url: string }[] = [];

const userRows: (string | number | null)[][] = [];
const verificationRows: (string | number | null)[][] = [];

for (const profile of profiles) {
  const id = profile.id?.trim();
  const override = id ? USER_OVERRIDES[id] : undefined;
  if (!id || !override) continue;

  const updatedAt = toIso(profile.updated_at) || now;
  const email = override.email;
  const name = override.name;

  userRows.push([
    id,
    name,
    email,
    1, // emailVerified
    null, // image
    updatedAt,
    updatedAt,
  ]);

  const token = randomUUID();
  verificationRows.push([
    randomUUID(),
    `reset-password:${token}`,
    id,
    verificationExpiry,
    now,
    now,
  ]);

  resetLinks.push({
    email,
    url: `${baseURL}/reset-password?token=${token}&email=${encodeURIComponent(email)}`,
  });
}

// --- Locations ---
const locations = readCsv("Locations Table.csv");
const locationRows: (string | number | null)[][] = locations.map((row) => [
  row.id?.trim(),
  toIso(row.createdAt) || now,
  row.userId?.trim(),
  row.name?.trim(),
  toInt(row.uncertaintyRadius) ?? 0,
  row.description?.trim() || null,
  toIso(row.updatedAt) || now,
  row.location?.trim(),
]);

// --- Observations ---
const observations = readCsv("Observasjoner kikk steel.csv");
const observationRows: (string | number | null)[][] = observations.map(
  (row) => [
    row.id?.trim(),
    toIso(row.createdAt) || now,
    toIso(row.updatedAt) || now,
    row.userId?.trim(),
    row.location?.trim(),
    row.locationName?.trim() || null,
    toInt(row.uncertaintyRadius) ?? 0,
    toIso(row.startDate) || now,
    toIso(row.endDate),
    row.comment?.trim() || "",
    toIso(row.lastExportedAt),
    toInt(row.exportCount) ?? 0,
    row.locationId?.trim() || null,
    row.observerName?.trim() || null,
    row.project?.trim() || null,
  ],
);

// --- Species ---
const speciesData = readCsv("Species Table.csv");
const speciesRows: (string | number | null | undefined)[][] = speciesData.map(
  (row) => [
    row.id?.trim(),
    row.observationId?.trim(),
    toIso(row.createdAt),
    row.species?.trim(),
    row.gender?.trim() || null,
    toInt(row.count),
    row.unit?.trim() || null,
    row.age?.trim() || null,
    row.method?.trim() || null,
    row.activity?.trim() || null,
    row.comment?.trim() || null,
    toBool(row.hide),
    row.delayPublication?.trim() || null,
    row.privateComment?.trim() || null,
    toBool(row.notRediscovered),
    toBool(row.notFound),
    row.privateCollection?.trim() || null,
    toBool(row.secondHand),
    toBool(row.uncertainIdentification),
    row.biotopeDescription?.trim() || null,
    row.biotope?.trim() || null,
  ],
);

const sql = [
  "-- Reset-password tokens and application data migrated from Supabase CSVs",
  'DELETE FROM "species";',
  'DELETE FROM "observations";',
  'DELETE FROM "locations";',
  'DELETE FROM "verification";',
  'DELETE FROM "account";',
  'DELETE FROM "session";',
  'DELETE FROM "user";',
  "BEGIN TRANSACTION;",
  buildInsert(
    "user",
    ["id", "name", "email", "emailVerified", "image", "createdAt", "updatedAt"],
    userRows,
  ),
  buildInsert(
    "verification",
    ["id", "identifier", "value", "expiresAt", "createdAt", "updatedAt"],
    verificationRows,
  ),
  buildInsert(
    "locations",
    [
      "id",
      "createdAt",
      "userId",
      "name",
      "uncertaintyRadius",
      "description",
      "updatedAt",
      "location",
    ],
    locationRows,
  ),
  buildInsert(
    "observations",
    [
      "id",
      "createdAt",
      "updatedAt",
      "userId",
      "location",
      "locationName",
      "uncertaintyRadius",
      "startDate",
      "endDate",
      "comment",
      "lastExportedAt",
      "exportCount",
      "locationId",
      "observerName",
      "project",
    ],
    observationRows,
  ),
  buildInsert(
    "species",
    [
      "id",
      "observationId",
      "createdAt",
      "species",
      "gender",
      "count",
      "unit",
      "age",
      "method",
      "activity",
      "comment",
      "hide",
      "delayPublication",
      "privateComment",
      "notRediscovered",
      "notFound",
      "privateCollection",
      "secondHand",
      "uncertainIdentification",
      "biotopeDescription",
      "biotope",
    ],
    speciesRows,
  ),
  "COMMIT;",
].join("\n");

writeFileSync(OUTPUT_SQL, sql, "utf-8");

console.log(`Wrote ${OUTPUT_SQL}`);
console.log(
  `\nGenerated reset-password links (valid for ${VERIFICATION_EXPIRY_DAYS} days):`,
);
for (const link of resetLinks) {
  console.log(`  ${link.email} -> ${link.url}`);
}

if (shouldApply) {
  const flag = target === "remote" ? "--remote" : "--local";
  const cmd = `npx wrangler d1 execute ${DB_NAME} ${flag} --file ${OUTPUT_SQL}`;
  console.log(`\nApplying with:\n  ${cmd}`);
  execSync(cmd, { stdio: "inherit" });
} else {
  console.log(
    `\nTo apply, run:\n  npx tsx scripts/migrate-supabase-to-d1.ts --${target} --apply`,
  );
}
