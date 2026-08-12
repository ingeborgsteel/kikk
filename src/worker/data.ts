import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, inArray, desc, asc, isNull } from "drizzle-orm";
import * as schema from "./schema";

type ObservationInput = Omit<
  schema.InsertObservation,
  "id" | "createdAt" | "updatedAt" | "lastExportedAt" | "exportCount"
> & {
  species: SpeciesInput[];
};

type SpeciesInput = Omit<
  schema.InsertSpecies,
  "observationId" | "id" | "createdAt"
> & {
  id?: string;
  createdAt?: string;
};

type LocationInput = Omit<
  schema.InsertLocation,
  "id" | "createdAt" | "updatedAt"
>;

const dataApp = new Hono<{ Bindings: Env }>();

// Observations

dataApp.get("/observations", async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.req.query("userId");
  const where = userId
    ? eq(schema.observations.userId, userId)
    : isNull(schema.observations.userId);

  const observations = await db
    .select()
    .from(schema.observations)
    .where(where)
    .orderBy(desc(schema.observations.createdAt));

  if (observations.length === 0) {
    return c.json([]);
  }

  const ids = observations.map((o) => o.id);
  const species = await db
    .select()
    .from(schema.species)
    .where(inArray(schema.species.observationId, ids));

  return c.json(
    observations.map((o) => ({
      ...o,
      species: species.filter((s) => s.observationId === o.id),
    })),
  );
});

dataApp.post("/observations", async (c) => {
  const db = drizzle(c.env.DB);
  const body = (await c.req.json()) as ObservationInput;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .insert(schema.observations)
    .values({
      id,
      userId: body.userId ?? null,
      location: body.location,
      locationName: body.locationName ?? null,
      uncertaintyRadius: body.uncertaintyRadius,
      startDate: body.startDate,
      endDate: body.endDate ?? null,
      comment: body.comment,
      createdAt: now,
      updatedAt: now,
      lastExportedAt: null,
      exportCount: 0,
      locationId: body.locationId ?? null,
      observerName: body.observerName ?? null,
      project: body.project ?? null,
    })
    .run();

  const species = body.species ?? [];
  if (species.length > 0) {
    await db
      .insert(schema.species)
      .values(
        species.map((s) => ({
          id: crypto.randomUUID(),
          observationId: id,
          createdAt: s.createdAt ?? now,
          species: s.species,
          gender: s.gender ?? null,
          count: s.count ?? null,
          unit: s.unit ?? null,
          age: s.age ?? null,
          method: s.method ?? null,
          activity: s.activity ?? null,
          comment: s.comment ?? null,
          privateComment: s.privateComment ?? null,
          notRediscovered: s.notRediscovered ?? false,
          notFound: s.notFound ?? false,
          privateCollection: s.privateCollection ?? null,
          secondHand: s.secondHand ?? false,
          uncertainIdentification: s.uncertainIdentification ?? false,
          biotope: s.biotope ?? null,
          biotopeDescription: s.biotopeDescription ?? null,
          hide: s.hide ?? false,
          delayPublication: s.delayPublication ?? null,
        })),
      )
      .run();
  }

  const obs = (
    await db
      .select()
      .from(schema.observations)
      .where(eq(schema.observations.id, id))
  )[0];
  const speciesRows = await db
    .select()
    .from(schema.species)
    .where(eq(schema.species.observationId, id));
  return c.json({ ...obs, species: speciesRows });
});

dataApp.put("/observations/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param("id");
  const body = (await c.req.json()) as ObservationInput;
  const now = new Date().toISOString();

  await db
    .update(schema.observations)
    .set({
      location: body.location,
      locationName: body.locationName ?? null,
      uncertaintyRadius: body.uncertaintyRadius,
      startDate: body.startDate,
      endDate: body.endDate ?? null,
      comment: body.comment,
      updatedAt: now,
      locationId: body.locationId ?? null,
      observerName: body.observerName ?? null,
      project: body.project ?? null,
    })
    .where(eq(schema.observations.id, id))
    .run();

  await db
    .delete(schema.species)
    .where(eq(schema.species.observationId, id))
    .run();

  const species = body.species ?? [];
  if (species.length > 0) {
    await db
      .insert(schema.species)
      .values(
        species.map((s) => ({
          id: s.id ?? crypto.randomUUID(),
          observationId: id,
          createdAt: s.createdAt ?? now,
          species: s.species,
          gender: s.gender ?? null,
          count: s.count ?? null,
          unit: s.unit ?? null,
          age: s.age ?? null,
          method: s.method ?? null,
          activity: s.activity ?? null,
          comment: s.comment ?? null,
          privateComment: s.privateComment ?? null,
          notRediscovered: s.notRediscovered ?? false,
          notFound: s.notFound ?? false,
          privateCollection: s.privateCollection ?? null,
          secondHand: s.secondHand ?? false,
          uncertainIdentification: s.uncertainIdentification ?? false,
          biotope: s.biotope ?? null,
          biotopeDescription: s.biotopeDescription ?? null,
          hide: s.hide ?? false,
          delayPublication: s.delayPublication ?? null,
        })),
      )
      .run();
  }

  const obs = (
    await db
      .select()
      .from(schema.observations)
      .where(eq(schema.observations.id, id))
  )[0];
  const speciesRows = await db
    .select()
    .from(schema.species)
    .where(eq(schema.species.observationId, id));
  return c.json({ ...obs, species: speciesRows });
});

dataApp.delete("/observations/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param("id");
  await db
    .delete(schema.species)
    .where(eq(schema.species.observationId, id))
    .run();
  await db
    .delete(schema.observations)
    .where(eq(schema.observations.id, id))
    .run();
  return c.json({ success: true });
});

// Locations

dataApp.get("/locations", async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.req.query("userId");
  const where = userId
    ? eq(schema.locations.userId, userId)
    : isNull(schema.locations.userId);
  const rows = await db
    .select()
    .from(schema.locations)
    .where(where)
    .orderBy(desc(schema.locations.createdAt));
  return c.json(rows);
});

dataApp.post("/locations", async (c) => {
  const db = drizzle(c.env.DB);
  const body = (await c.req.json()) as LocationInput;
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db
    .insert(schema.locations)
    .values({
      id,
      userId: body.userId ?? null,
      name: body.name,
      location: body.location,
      uncertaintyRadius: body.uncertaintyRadius,
      description: body.description ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .run();

  const row = (
    await db.select().from(schema.locations).where(eq(schema.locations.id, id))
  )[0];
  return c.json(row);
});

dataApp.put("/locations/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param("id");
  const body = (await c.req.json()) as LocationInput;
  const now = new Date().toISOString();

  await db
    .update(schema.locations)
    .set({
      name: body.name,
      location: body.location,
      uncertaintyRadius: body.uncertaintyRadius,
      description: body.description ?? null,
      updatedAt: now,
    })
    .where(eq(schema.locations.id, id))
    .run();

  const row = (
    await db.select().from(schema.locations).where(eq(schema.locations.id, id))
  )[0];
  return c.json(row);
});

dataApp.delete("/locations/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param("id");
  await db
    .delete(schema.locations)
    .where(eq(schema.locations.id, id))
    .run();
  return c.json({ success: true });
});

// Profiles

dataApp.get("/profiles", async (c) => {
  const db = drizzle(c.env.DB);
  const rows = await db
    .select()
    .from(schema.profiles)
    .orderBy(asc(schema.profiles.display_name));
  return c.json(rows);
});

// User access

dataApp.get("/user-accesses", async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.req.query("userId");
  if (!userId) {
    return c.json(null);
  }
  const rows = await db
    .select()
    .from(schema.userAccesses)
    .where(eq(schema.userAccesses.user_id, userId));
  return c.json(rows[0] ?? null);
});

export default dataApp;
