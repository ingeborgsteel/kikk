import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";
import { captcha } from "better-auth/plugins";

export const betterAuthClient = createAuthClient({
  baseURL:
    (import.meta.env.VITE_BETTER_AUTH_BASE_URL as string | undefined) ||
    window.location.origin,
  plugins: [
    adminClient(),
    captcha({
      provider: "cloudflare-turnstile",
      secretKey: import.meta.env.VITE_TURNSTILE_SITEKEY,
    }),
  ],
});
