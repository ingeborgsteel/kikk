import { Hono } from "hono";
import { betterAuth } from "better-auth";
import dataApp from "./data";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.all("/api/auth/*", async (c) => {
  const auth = betterAuth({
    database: c.env.DB,
    secret: c.env.BETTER_AUTH_SECRET,
    baseURL: new URL(c.req.url).origin,
    emailAndPassword: { enabled: true },
  });
  return auth.handler(c.req.raw);
});

app.route("/api", dataApp);

export default app;
