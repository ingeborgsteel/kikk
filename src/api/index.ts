import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import dataApp from "./data";
import * as schema from "./schema";

type AuthEnv = Env & { RESEND_API_KEY?: string; RESEND_FROM_EMAIL?: string };

const app = new Hono<{ Bindings: AuthEnv }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.post("/api/admin/reset-password-link", async (c) => {
  const { email } = await c.req.json<{ email?: string }>();
  if (!email) {
    return c.json({ message: "E-post mangler" }, 400);
  }

  const db = drizzle(c.env.DB);
  const users = await db
    .select()
    .from(schema.user)
    .where(eq(schema.user.email, email.toLowerCase()));
  const user = users[0];
  if (!user) {
    return c.json({ message: "Fant ikke bruker" }, 404);
  }

  const token = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.insert(schema.verification).values({
    id: crypto.randomUUID(),
    identifier: `reset-password:${token}`,
    value: user.id,
    expiresAt,
    createdAt: now,
    updatedAt: now,
  });

  const url = `${new URL(c.req.url).origin}/reset-password?token=${token}`;
  return c.json({ url });
});

app.all("/api/auth/*", async (c) => {
  const db = drizzle(c.env.DB);
  const auth = betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    secret: c.env.BETTER_AUTH_SECRET,
    baseURL: new URL(c.req.url).origin,
    emailAndPassword: {
      enabled: true,
      sendResetPassword: async ({ user, url }) => {
        const message = `Password reset for ${user.email}: ${url}`;
        console.log(message);

        const apiKey = c.env.RESEND_API_KEY;
        const fromEmail = c.env.RESEND_FROM_EMAIL;
        if (apiKey && fromEmail) {
          const emailPromise = fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              from: fromEmail,
              to: user.email,
              subject: "Tilbakestilling av passord for kikk",
              text: `Hei ${user.name || user.email},\n\nBruk denne lenken for å velge et nytt passord:\n${url}\n\nLenken er gyldig i en time.\n\nHilsen kikk`,
            }),
          }).then(async (res) => {
            if (!res.ok) {
              const body = await res.text().catch(() => "");
              console.error("Resend error:", res.status, body);
            }
          });

          if (c.executionCtx) {
            c.executionCtx.waitUntil(emailPromise);
          } else {
            await emailPromise;
          }
        }
      },
      onPasswordReset: async ({ user }) => {
        console.log(`Password reset completed for ${user.email}`);
      },
    },
  });
  return auth.handler(c.req.raw);
});

app.route("/api", dataApp);

export default app;
