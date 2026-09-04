import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { Context } from "hono";
import { admin, customSession } from "better-auth/plugins";
import * as schema from "./schema";

export type AuthEnv = Env & {
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
};

function createSendResetPassword(
  c: Context<{ Bindings: AuthEnv }>,
): (data: {
  user: { name?: string | null; email: string };
  url: string;
  token: string;
}) => Promise<void> {
  return async ({ user, token }) => {
    const request = c.req.raw;
    const origin = new URL(request.url).origin;
    const resetUrl = `${origin}/reset-password?token=${token}`;

    const apiKey = c.env.RESEND_API_KEY;
    const fromEmail = c.env.RESEND_FROM_EMAIL;
    if (!apiKey || !fromEmail) {
      return;
    }

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
        text: `Hei ${user.name || user.email},\n\nBruk denne lenken for å velge et nytt passord:\n${resetUrl}\n\nLenken er gyldig i en time.\n\nHilsen kikk`,
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
  };
}

export function createAuth(c: Context<{ Bindings: AuthEnv }>) {
  const db = drizzle(c.env.DB);
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    secret: c.env.BETTER_AUTH_SECRET,
    baseURL: new URL(c.req.url).origin,
    emailAndPassword: {
      enabled: true,
      sendResetPassword: createSendResetPassword(c),
      onPasswordReset: async () => {},
    },
    plugins: [
      admin(),
      customSession(async ({ user, session }) => ({ user, session })),
    ],
  });
}
