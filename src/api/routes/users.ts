import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { asc } from "drizzle-orm";
import * as schema from "../schema";

const usersApp = new Hono<{ Bindings: Env }>();

usersApp.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  const rows = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
    })
    .from(schema.user)
    .orderBy(asc(schema.user.name));
  return c.json(rows);
});

export default usersApp;
