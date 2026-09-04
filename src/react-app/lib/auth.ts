import { createAuthClient } from "better-auth/react";
import { adminClient } from "better-auth/client/plugins";

export const betterAuthClient = createAuthClient({
  baseURL:
    (import.meta.env.VITE_BETTER_AUTH_BASE_URL as string | undefined) ||
    window.location.origin,
  plugins: [adminClient()],
});
