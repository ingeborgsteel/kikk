import { Hono } from "hono";
import { createAuth } from "./auth";
import dataApp from "./data";
import adminApp from "./routes/admin";

type AuthEnv = Env & { RESEND_API_KEY?: string; RESEND_FROM_EMAIL?: string };

const app = new Hono<{ Bindings: AuthEnv }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.all("/api/auth/*", async (c) => {
  const auth = createAuth(c);
  return auth.handler(c.req.raw);
});

app.route("/api", dataApp);
app.route("/api/admin", adminApp);

export default app;
