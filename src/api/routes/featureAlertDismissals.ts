import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import * as schema from "../schema";

const featureAlertDismissalsApp = new Hono<{ Bindings: Env }>();

featureAlertDismissalsApp.get("/", async (c) => {
  const db = drizzle(c.env.DB);
  const userId = c.req.query("userId");
  if (!userId) {
    return c.json([]);
  }
  const rows = await db
    .select({ alertId: schema.featureAlertDismissals.alertId })
    .from(schema.featureAlertDismissals)
    .where(eq(schema.featureAlertDismissals.userId, userId));
  return c.json(rows.map((r) => r.alertId));
});

featureAlertDismissalsApp.post("/", async (c) => {
  const db = drizzle(c.env.DB);
  const body = (await c.req.json()) as { userId?: string; alertId?: string };
  if (!body.userId || !body.alertId) {
    return c.json(
      { success: false, error: "userId and alertId are required" },
      400,
    );
  }

  await db
    .insert(schema.featureAlertDismissals)
    .values({
      id: crypto.randomUUID(),
      userId: body.userId,
      alertId: body.alertId,
      dismissedAt: new Date().toISOString(),
    })
    .onConflictDoNothing()
    .run();

  return c.json({ success: true });
});

export default featureAlertDismissalsApp;
