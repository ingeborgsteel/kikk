import { createAuthClient } from "better-auth/react";

export const betterAuthClient = createAuthClient({
  baseURL:
    (import.meta.env.VITE_BETTER_AUTH_BASE_URL as string | undefined) ||
    window.location.origin,
});

export const isAuthConfigured = () => true;
