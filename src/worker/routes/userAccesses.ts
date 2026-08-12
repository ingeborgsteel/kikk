import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "../schema";

const userAccessesApp = new Hono<{ Bindings: Env }>();

userAccessesApp.get("/", async (c) => {
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

export default userAccessesApp;
