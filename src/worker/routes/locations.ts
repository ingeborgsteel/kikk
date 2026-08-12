import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq, desc, isNull } from "drizzle-orm";
import * as schema from "../schema";

type LocationInput = Omit<
  schema.InsertLocation,
  "id" | "createdAt" | "updatedAt"
>;

const locationsApp = new Hono<{ Bindings: Env }>();

locationsApp.get("/", async (c) => {
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

locationsApp.post("/", async (c) => {
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

locationsApp.put("/:id", async (c) => {
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

locationsApp.delete("/:id", async (c) => {
  const db = drizzle(c.env.DB);
  const id = c.req.param("id");
  await db
    .delete(schema.locations)
    .where(eq(schema.locations.id, id))
    .run();
  return c.json({ success: true });
});

export default locationsApp;
