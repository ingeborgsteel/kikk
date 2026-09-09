/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FORCE_LOGIN?: string;
  // Existing variables used throughout the app
  readonly VITE_BETTER_AUTH_BASE_URL?: string;
  readonly VITE_GITHUB_TOKEN?: string;
  readonly VITE_MAPBOX_TOKEN?: string;
  readonly VITE_ENABLE_CLOUDFLARE_LOGGING?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
