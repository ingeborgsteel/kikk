import { Hono } from "hono";

// Lightweight worker-side types — kept in sync with the frontend types.
interface TaxonRecord extends Record<string, unknown> {}

interface SpeciesInput {
  id?: string;
  createdAt?: string;
  species: TaxonRecord;
  gender?: string;
  count?: number;
  unit?: string;
  age?: string;
  method?: string;
  activity?: string;
  comment?: string;
  privateComment?: string;
  notRediscovered?: boolean;
  notFound?: boolean;
  privateCollection?: string;
  secondHand?: boolean;
  uncertainIdentification?: boolean;
  biotope?: string;
  biotopeDescription?: string;
  hide?: boolean;
  delayPublication?: string;
}

interface ObservationInput {
  id?: string;
  location: { lat: number; lng: number };
  locationName?: string;
  uncertaintyRadius: number;
  species: SpeciesInput[];
  startDate: string;
  endDate?: string;
  comment: string;
  userId?: string;
  locationId?: string;
  observerName?: string;
  project?: string;
}

interface ObservationRow {
  id: string;
  userId: string | null;
  location: string;
  locationName: string | null;
  uncertaintyRadius: number;
  startDate: string;
  endDate: string | null;
  comment: string;
  createdAt: string;
  updatedAt: string;
  lastExportedAt: string | null;
  exportCount: number;
  locationId: string | null;
  observerName: string | null;
  project: string | null;
}

interface SpeciesRow {
  id: string;
  observationId: string;
  createdAt: string;
  species: string;
  gender: string | null;
  count: number | null;
  unit: string | null;
  age: string | null;
  method: string | null;
  activity: string | null;
  comment: string | null;
  privateComment: string | null;
  notRediscovered: number;
  notFound: number;
  privateCollection: string | null;
  secondHand: number;
  uncertainIdentification: number;
  biotope: string | null;
  biotopeDescription: string | null;
  hide: number;
  delayPublication: string | null;
}

interface LocationInput {
  id?: string;
  userId?: string;
  name: string;
  location: { lat: number; lng: number };
  uncertaintyRadius: number;
  description?: string;
}

interface LocationRow {
  id: string;
  userId: string | null;
  name: string;
  location: string;
  uncertaintyRadius: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ProfileRow {
  id: string;
  email: string | null;
  display_name: string | null;
  updated_at: string;
}

interface UserAccessRow {
  id: string;
  user_id: string;
  github_token: string;
  created_at: string;
}

const dataApp = new Hono<{ Bindings: Env }>();

function toBool(value: number | null): boolean | undefined {
  return value === null ? undefined : value === 1;
}

function fromBool(value: boolean | undefined): number {
  return value ? 1 : 0;
}

function parseLocation(json: string): { lat: number; lng: number } {
  try {
    return JSON.parse(json) as { lat: number; lng: number };
  } catch {
    return { lat: 0, lng: 0 };
  }
}

function mapObservation(row: ObservationRow, speciesRows: SpeciesRow[]) {
  return {
    id: row.id,
    userId: row.userId ?? undefined,
    location: parseLocation(row.location),
    locationName: row.locationName ?? undefined,
    uncertaintyRadius: row.uncertaintyRadius,
    startDate: row.startDate,
    endDate: row.endDate ?? undefined,
    comment: row.comment,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastExportedAt: row.lastExportedAt ?? undefined,
    exportCount: row.exportCount,
    locationId: row.locationId ?? undefined,
    observerName: row.observerName ?? undefined,
    project: row.project ?? undefined,
    species: speciesRows
      .filter((s) => s.observationId === row.id)
      .map((s) => ({
        id: s.id,
        createdAt: s.createdAt,
        species: JSON.parse(s.species) as TaxonRecord,
        gender: s.gender ?? undefined,
        count: s.count ?? undefined,
        unit: s.unit ?? undefined,
        age: s.age ?? undefined,
        method: s.method ?? undefined,
        activity: s.activity ?? undefined,
        comment: s.comment ?? undefined,
        privateComment: s.privateComment ?? undefined,
        notRediscovered: toBool(s.notRediscovered),
        notFound: toBool(s.notFound),
        privateCollection: s.privateCollection ?? undefined,
        secondHand: toBool(s.secondHand),
        uncertainIdentification: toBool(s.uncertainIdentification),
        biotope: s.biotope ?? undefined,
        biotopeDescription: s.biotopeDescription ?? undefined,
        hide: toBool(s.hide),
        delayPublication: s.delayPublication ?? undefined,
      })),
  };
}

function mapLocation(row: LocationRow) {
  return {
    id: row.id,
    userId: row.userId ?? undefined,
    name: row.name,
    location: parseLocation(row.location),
    uncertaintyRadius: row.uncertaintyRadius,
    description: row.description ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapProfile(row: ProfileRow) {
  return {
    id: row.id,
    email: row.email ?? null,
    display_name: row.display_name ?? null,
    updated_at: row.updated_at,
  };
}

function mapUserAccess(row: UserAccessRow) {
  return {
    id: row.id,
    user_id: row.user_id,
    github_token: row.github_token,
    created_at: row.created_at,
  };
}

// Observations

dataApp.get("/observations", async (c) => {
  const db = c.env.DB;
  const userId = c.req.query("userId");

  const obsQuery = userId
    ? db
        .prepare(
          "SELECT * FROM observations WHERE userId = ? ORDER BY createdAt DESC",
        )
        .bind(userId)
    : db
        .prepare(
          "SELECT * FROM observations WHERE userId IS NULL ORDER BY createdAt DESC",
        );

  const { results: observations } = (await obsQuery.all()) as {
    results: ObservationRow[];
  };

  if (observations.length === 0) {
    return c.json([]);
  }

  const ids = observations.map((o) => o.id);
  const placeholders = ids.map(() => "?").join(", ");
  const speciesResult = (await db
    .prepare(
      `SELECT * FROM species WHERE observationId IN (${placeholders})`,
    )
    .bind(...ids)
    .all()) as { results: SpeciesRow[] };

  const speciesRows = speciesResult.results;
  return c.json(observations.map((o) => mapObservation(o, speciesRows)));
});

dataApp.post("/observations", async (c) => {
  const db = c.env.DB;
  const body = (await c.req.json()) as ObservationInput;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const locationJson = JSON.stringify(body.location);
  const observationValues = [
    id,
    body.userId ?? null,
    locationJson,
    body.locationName ?? null,
    body.uncertaintyRadius,
    body.startDate,
    body.endDate ?? null,
    body.comment,
    now,
    now,
    null,
    0,
    body.locationId ?? null,
    body.observerName ?? null,
    body.project ?? null,
  ];

  await db
    .prepare(
      `INSERT INTO observations (id, userId, location, locationName, uncertaintyRadius, startDate, endDate, comment, createdAt, updatedAt, lastExportedAt, exportCount, locationId, observerName, project)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(...observationValues)
    .run();

  if (body.species.length > 0) {
    const speciesRows = body.species.map((s) => ({
      id: crypto.randomUUID(),
      observationId: id,
      createdAt: now,
      species: JSON.stringify(s.species),
      gender: s.gender ?? null,
      count: s.count ?? null,
      unit: s.unit ?? null,
      age: s.age ?? null,
      method: s.method ?? null,
      activity: s.activity ?? null,
      comment: s.comment ?? null,
      privateComment: s.privateComment ?? null,
      notRediscovered: fromBool(s.notRediscovered),
      notFound: fromBool(s.notFound),
      privateCollection: s.privateCollection ?? null,
      secondHand: fromBool(s.secondHand),
      uncertainIdentification: fromBool(s.uncertainIdentification),
      biotope: s.biotope ?? null,
      biotopeDescription: s.biotopeDescription ?? null,
      hide: fromBool(s.hide),
      delayPublication: s.delayPublication ?? null,
    }));

    const stmt = db.prepare(
      `INSERT INTO species (id, observationId, createdAt, species, gender, count, unit, age, method, activity, comment, privateComment, notRediscovered, notFound, privateCollection, secondHand, uncertainIdentification, biotope, biotopeDescription, hide, delayPublication)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    await db.batch(
      speciesRows.map((row) =>
        stmt.bind(
          row.id,
          row.observationId,
          row.createdAt,
          row.species,
          row.gender,
          row.count,
          row.unit,
          row.age,
          row.method,
          row.activity,
          row.comment,
          row.privateComment,
          row.notRediscovered,
          row.notFound,
          row.privateCollection,
          row.secondHand,
          row.uncertainIdentification,
          row.biotope,
          row.biotopeDescription,
          row.hide,
          row.delayPublication,
        ),
      ),
    );
  }

  const species = (await db
    .prepare("SELECT * FROM species WHERE observationId = ?")
    .bind(id)
    .all()) as { results: SpeciesRow[] };

  const obs = (await db
    .prepare("SELECT * FROM observations WHERE id = ?")
    .bind(id)
    .first()) as ObservationRow;

  return c.json(mapObservation(obs, species.results));
});

dataApp.put("/observations/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = (await c.req.json()) as ObservationInput;
  const now = new Date().toISOString();

  const locationJson = JSON.stringify(body.location);
  await db
    .prepare(
      `UPDATE observations SET
        location = ?, locationName = ?, uncertaintyRadius = ?, startDate = ?, endDate = ?, comment = ?, updatedAt = ?, locationId = ?, observerName = ?, project = ?
       WHERE id = ?`,
    )
    .bind(
      locationJson,
      body.locationName ?? null,
      body.uncertaintyRadius,
      body.startDate,
      body.endDate ?? null,
      body.comment,
      now,
      body.locationId ?? null,
      body.observerName ?? null,
      body.project ?? null,
      id,
    )
    .run();

  await db
    .prepare("DELETE FROM species WHERE observationId = ?")
    .bind(id)
    .run();

  if (body.species.length > 0) {
    const speciesRows = body.species.map((s) => ({
      sid: s.id ?? crypto.randomUUID(),
      observationId: id,
      createdAt: s.createdAt ?? now,
      species: JSON.stringify(s.species),
      gender: s.gender ?? null,
      count: s.count ?? null,
      unit: s.unit ?? null,
      age: s.age ?? null,
      method: s.method ?? null,
      activity: s.activity ?? null,
      comment: s.comment ?? null,
      privateComment: s.privateComment ?? null,
      notRediscovered: fromBool(s.notRediscovered),
      notFound: fromBool(s.notFound),
      privateCollection: s.privateCollection ?? null,
      secondHand: fromBool(s.secondHand),
      uncertainIdentification: fromBool(s.uncertainIdentification),
      biotope: s.biotope ?? null,
      biotopeDescription: s.biotopeDescription ?? null,
      hide: fromBool(s.hide),
      delayPublication: s.delayPublication ?? null,
    }));

    const stmt = db.prepare(
      `INSERT INTO species (id, observationId, createdAt, species, gender, count, unit, age, method, activity, comment, privateComment, notRediscovered, notFound, privateCollection, secondHand, uncertainIdentification, biotope, biotopeDescription, hide, delayPublication)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );

    await db.batch(
      speciesRows.map((row) =>
        stmt.bind(
          row.sid,
          row.observationId,
          row.createdAt,
          row.species,
          row.gender,
          row.count,
          row.unit,
          row.age,
          row.method,
          row.activity,
          row.comment,
          row.privateComment,
          row.notRediscovered,
          row.notFound,
          row.privateCollection,
          row.secondHand,
          row.uncertainIdentification,
          row.biotope,
          row.biotopeDescription,
          row.hide,
          row.delayPublication,
        ),
      ),
    );
  }

  const species = (await db
    .prepare("SELECT * FROM species WHERE observationId = ?")
    .bind(id)
    .all()) as { results: SpeciesRow[] };

  const obs = (await db
    .prepare("SELECT * FROM observations WHERE id = ?")
    .bind(id)
    .first()) as ObservationRow;

  return c.json(mapObservation(obs, species.results));
});

dataApp.delete("/observations/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");

  await db
    .prepare("DELETE FROM species WHERE observationId = ?")
    .bind(id)
    .run();
  await db.prepare("DELETE FROM observations WHERE id = ?").bind(id).run();

  return c.json({ success: true });
});

// Locations

dataApp.get("/locations", async (c) => {
  const db = c.env.DB;
  const userId = c.req.query("userId");

  const query = userId
    ? db
        .prepare(
          "SELECT * FROM locations WHERE userId = ? ORDER BY createdAt DESC",
        )
        .bind(userId)
    : db.prepare(
        "SELECT * FROM locations WHERE userId IS NULL ORDER BY createdAt DESC",
      );

  const { results } = (await query.all()) as { results: LocationRow[] };
  return c.json(results.map(mapLocation));
});

dataApp.post("/locations", async (c) => {
  const db = c.env.DB;
  const body = (await c.req.json()) as LocationInput;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const locationJson = JSON.stringify(body.location);
  const row = [
    id,
    body.userId ?? null,
    body.name,
    locationJson,
    body.uncertaintyRadius,
    body.description ?? null,
    now,
    now,
  ];

  await db
    .prepare(
      "INSERT INTO locations (id, userId, name, location, uncertaintyRadius, description, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(...row)
    .run();

  const inserted = (await db
    .prepare("SELECT * FROM locations WHERE id = ?")
    .bind(id)
    .first()) as LocationRow;

  return c.json(mapLocation(inserted));
});

dataApp.put("/locations/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");
  const body = (await c.req.json()) as LocationInput;
  const now = new Date().toISOString();

  const locationJson = JSON.stringify(body.location);
  await db
    .prepare(
      "UPDATE locations SET name = ?, location = ?, uncertaintyRadius = ?, description = ?, updatedAt = ? WHERE id = ?",
    )
    .bind(
      body.name,
      locationJson,
      body.uncertaintyRadius,
      body.description ?? null,
      now,
      id,
    )
    .run();

  const updated = (await db
    .prepare("SELECT * FROM locations WHERE id = ?")
    .bind(id)
    .first()) as LocationRow;

  return c.json(mapLocation(updated));
});

dataApp.delete("/locations/:id", async (c) => {
  const db = c.env.DB;
  const id = c.req.param("id");

  await db.prepare("DELETE FROM locations WHERE id = ?").bind(id).run();
  return c.json({ success: true });
});

// Profiles

dataApp.get("/profiles", async (c) => {
  const db = c.env.DB;
  const { results } = (await db
    .prepare("SELECT * FROM profiles ORDER BY display_name ASC")
    .all()) as { results: ProfileRow[] };
  return c.json(results.map(mapProfile));
});

// User access

dataApp.get("/user-accesses", async (c) => {
  const db = c.env.DB;
  const userId = c.req.query("userId");
  if (!userId) {
    return c.json(null);
  }

  const row = (await db
    .prepare("SELECT * FROM user_accesses WHERE user_id = ? LIMIT 1")
    .bind(userId)
    .first()) as UserAccessRow | null;

  return c.json(row ? mapUserAccess(row) : null);
});

export default dataApp;
