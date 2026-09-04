import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { asc } from "drizzle-orm";
import * as schema from "../schema";

const usersApp = new Hono<{ Bindings: Env }>();

usersApp.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  const rows = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
    })
    .from(schema.users)
    .orderBy(asc(schema.users.name));
  return c.json(rows);
});

export default usersApp;
