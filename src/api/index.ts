import { Hono } from "hono";
import { createAuth } from "./auth";
import dataApp from "./data";
import adminApp from "./routes/admin";

type AuthEnv = Env & { RESEND_API_KEY?: string; RESEND_FROM_EMAIL?: string };

const app = new Hono<{ Bindings: AuthEnv }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// Custom signup endpoint with Turnstile validation
app.post("/api/auth/sign-up/email", async (c) => {
  const body = await c.req.json();
  const turnstileToken = body.turnstileToken;

  if (!turnstileToken) {
    return c.json({ error: "Turnstile token is required" }, 400);
  }

  const secret = c.env.TURNSTILE_SECRET;
  if (!secret) {
    throw new Error("TURNSTILE_SECRET not configured");
  }

  const verifyResponse = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret,
        response: turnstileToken,
        remoteip: c.req.header("CF-Connecting-IP") || "",
      }),
    },
  );

  const verifyResult = (await verifyResponse.json()) as { success: boolean };

  if (!verifyResult.success) {
    throw new Error("Invalid Turnstile token");
  }

  // Remove turnstileToken from body before passing to Better Auth
  const authBody = { ...body };
  delete authBody.turnstileToken;

  // Create auth instance and call signup directly
  const auth = createAuth(c);
  const response = await auth.api.createUser({
    body: authBody,
  });

  return c.json(response);
});

// Handle all other auth routes (signin, password reset, etc.)
app.all("/api/auth/*", async (c) => {
  const auth = createAuth(c);
  return auth.handler(c.req.raw);
});

app.route("/api", dataApp);
app.route("/api/admin", adminApp);

export default app;
