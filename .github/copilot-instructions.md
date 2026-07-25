# Copilot Instructions for kikk

Full project and coding instructions live in [`AGENTS.md`](../AGENTS.md) at the repo root — read that first for tech stack, project structure, code style, state management, testing, and PR/issue guidelines.

## Copilot-specific notes

- Environment variables for local Supabase setup: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Deployment target: Cloudflare Workers, via Wrangler (`wrangler.json`); build output goes to `dist/` (gitignored)
- Follow the ESLint rules in `eslint.config.js` (React Hooks rules and React Refresh are enforced)
