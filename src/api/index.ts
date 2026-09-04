import { Hono } from "hono";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import dataApp from "./data";
import * as schema from "./schema";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.all("/api/auth/*", async (c) => {
  const db = drizzle(c.env.DB);
  const auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    secret: c.env.BETTER_AUTH_SECRET,
    baseURL: new URL(c.req.url).origin,
    emailAndPassword: { enabled: true },
  });
  return auth.handler(c.req.raw);
});

app.route("/api", dataApp);

export default app;
