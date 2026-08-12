import { Hono } from "hono";
import { betterAuth } from "better-auth";
import dataApp from "./data";

interface LogEntry {
  level: "info" | "error" | "warn";
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
}

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

app.post("/api/logs", async (c) => {
  try {
    const logEntry: LogEntry = await c.req.json();
    // Log to Cloudflare Workers console
    console.log(
      `[${logEntry.level.toUpperCase()}] ${logEntry.message}`,
      logEntry.context || "",
    );
    return c.json({ success: true });
  } catch (error) {
    console.error("Failed to process log:", error);
    return c.json({ success: false, error: "Invalid log entry" }, 400);
  }
});

export default app;
