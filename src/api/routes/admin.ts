import { Hono } from "hono";
import { drizzle } from "drizzle-orm/d1";
import { countDistinct, eq, max, sql } from "drizzle-orm";
import { AuthEnv, createAuth } from "../auth";
import * as schema from "../schema";

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  role: string | null;
  createdAt: string;
  observationCount: number;
  speciesCount: number;
  individualCount: number;
  lastObservationAt: string | null;
}

const adminApp = new Hono<{ Bindings: AuthEnv }>();

adminApp.use("*", async (c, next) => {
  const auth = createAuth(c);
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (role !== "admin") {
    return c.json({ error: "Forbidden" }, 403);
  }
  await next();
});

adminApp.get("/users", async (c) => {
  const db = drizzle(c.env.DB);

  const users = await db
    .select({
      id: schema.user.id,
      name: schema.user.name,
      email: schema.user.email,
      role: schema.user.role,
      createdAt: schema.user.createdAt,
    })
    .from(schema.user)
    .orderBy(schema.user.name)
    .all();

  const rows: AdminUserRow[] = await Promise.all(
    users.map(async (user) => {
      const [agg] = await db
        .select({
          observationCount: countDistinct(schema.observations.id),
          speciesCount: countDistinct(schema.species.id),
          individualCount: sql<number>`coalesce(sum(${schema.species.count}), 0)`,
          lastObservationAt: max(schema.observations.createdAt),
        })
        .from(schema.observations)
        .leftJoin(
          schema.species,
          eq(schema.species.observationId, schema.observations.id),
        )
        .where(eq(schema.observations.userId, user.id));

      const { createdAt, ...base } = user;
      return {
        ...base,
        createdAt: createdAt.toISOString(),
        observationCount: agg?.observationCount ?? 0,
        speciesCount: agg?.speciesCount ?? 0,
        individualCount: agg?.individualCount ?? 0,
        lastObservationAt: agg?.lastObservationAt ?? null,
      };
    }),
  );

  return c.json(rows);
});

adminApp.post("/users/:id/reset-password", async (c) => {
  const userId = c.req.param("id");
  const db = drizzle(c.env.DB);

  const [user] = await db
    .select({ email: schema.user.email })
    .from(schema.user)
    .where(eq(schema.user.id, userId))
    .limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const auth = createAuth(c);
  await auth.api.requestPasswordReset({
    body: {
      email: user.email,
      redirectTo: "/reset-password",
    },
  });

  return c.json({ success: true });
});

export default adminApp;
