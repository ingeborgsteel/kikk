import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { asc } from "drizzle-orm";
import * as schema from "../schema";

const profilesApp = new Hono<{ Bindings: Env }>();

profilesApp.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  const rows = await db
    .select()
    .from(schema.profiles)
    .orderBy(asc(schema.profiles.display_name));
  return c.json(rows);
});

export default profilesApp;
