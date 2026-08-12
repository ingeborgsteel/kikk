import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, inArray, desc, isNull } from "drizzle-orm";
import * as schema from "../schema";

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

const observationsApp = new Hono<{ Bindings: Env }>();

observationsApp.get("/", async (c) => {
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

observationsApp.post("/", async (c) => {
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

observationsApp.put("/:id", async (c) => {
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

observationsApp.delete("/:id", async (c) => {
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

export default observationsApp;
