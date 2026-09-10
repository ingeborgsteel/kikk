---
name: pre-pr-validation
description: Validate that AI instruction files and project docs are in sync with the codebase before a PR or merge
---

# Pre-PR / Pre-Merge AI Instruction Validation

Use this validation before finishing a pull request or merging directly to `main`. It prevents stale references, structural drift, and tool-specific inconsistencies from landing in the canonical docs.

## When to run

- Before you create a pull request.
- Before you push a feature branch to `origin` for the first time.
- Before you merge a branch directly into `main` (especially fast-forward or `git push` merges).
- Whenever you update `wrangler.json`, `package.json`, the auth stack, or the worker directory structure.

## How to run

The agent performs this analysis directly:

1. Read the **source-of-truth** files for the area you are validating:
   - `package.json` for dependencies and scripts
   - `wrangler.json` for the worker entry point, D1, compatibility date, and asset configuration
   - `vite.config.ts` for PWA / service worker settings
   - `.env.example` for environment variables
   - `src/api/index.ts` for the Hono worker routes
   - `src/react-app/context/AuthContext.tsx` and `src/react-app/lib/guestMode.ts` for auth behavior
   - `src/react-app/main.tsx` for provider hierarchy and query cache persistence
   - `src/react-app/Map.tsx` for offline / tile-download UI
2. Read the **instruction files**: `AGENTS.md`, `ARCHITECTURE.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.windsurf/README.md`, `.windsurf/project-guide.md`, and every `.devin/skills/*/SKILL.md`.
3. Compare the two sets. Use `grep`, `grep -R`, or direct file reads to verify the checks below.
4. If you find drift, update the instruction files (not the source-of-truth code, unless the code itself is wrong) and re-read the updated files to confirm consistency.
5. Only after the analysis passes should you finalize the PR, push the branch, or merge to `main`.

## What to check

1. **Required files exist** — `AGENTS.md`, `ARCHITECTURE.md`, `CLAUDE.md`, `.github/copilot-instructions.md`, `.windsurf/README.md`, `.windsurf/project-guide.md`, and every `.devin/skills/*/SKILL.md` file.
2. **Auth stack** — instruction files must match the current auth implementation:
   - If the code uses Better Auth (see `AuthContext.tsx` and `package.json` `better-auth`), the docs must describe `Better Auth`, `LoginGate`, `bypassGuestLogin`, `isLoginRequired`, and `VITE_FORCE_LOGIN`.
   - The docs must not describe Supabase, `isSupabaseConfigured()`, `VITE_SUPABASE_URL`, or `VITE_SUPABASE_ANON_KEY` unless those are still in use.
3. **Worker / backend** — instruction files must match `wrangler.json` and the actual source tree:
   - The worker entry point in `wrangler.json` `main` must appear in `AGENTS.md`, `ARCHITECTURE.md`, and `.devin/skills/deployment/SKILL.md`.
   - Docs must not reference `src/worker/index.ts` unless that path still exists.
4. **Environment variables** — docs must match `.env.example`:
   - Current keys: `VITE_BETTER_AUTH_BASE_URL`, `VITE_GITHUB_TOKEN`, `VITE_ENABLE_CLOUDFLARE_LOGGING`, `VITE_FORCE_LOGIN`.
   - Reject stale keys like `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` unless they reappear in `.env.example`.
5. **PWA & offline** — docs must match `vite.config.ts`, `public/manifest.json`, `src/react-app/main.tsx`, and `src/react-app/Map.tsx`:
   - Mention `vite-plugin-pwa`, service worker runtime caching, query cache persistence, offline banner, tile download, and manifest icons as appropriate.
6. **localStorage keys** — docs must list the keys the code actually uses:
   - `kikk-guest-user-id`, `kikk_observations`, `kikk_user_locations`, `kikk_theme`, `kikk-map-layer`, `kikk-query-cache`.
7. **`.windsurf` slash command consistency** — if `.windsurf/README.md` or `project-guide.md` reference a slash command like `/feature-development`, the corresponding `.windsurf/workflows/<command>.md` file must exist.

## What to fix if it fails

- **Stale auth / backend references** → update `AGENTS.md`, `ARCHITECTURE.md`, and any affected `.devin/skills/*/SKILL.md` or `.github/copilot-instructions.md` files to match the current `AuthContext.tsx`, `wrangler.json`, and `package.json`.
- **Missing worker path** → ensure the directory tree and worker references in `AGENTS.md`, `ARCHITECTURE.md`, and the deployment skill point to the same path as `wrangler.json` `main`.
- **Missing slash command file** → either add the matching workflow file in `.windsurf/workflows/` or remove the slash command reference from the Windsurf docs.

## Agent rule

An agent must refuse to finalize a PR, push a branch to `origin`, or merge directly to `main` until this skill's analysis passes. If you find drift, update the relevant instruction files and re-run the analysis before proceeding.
