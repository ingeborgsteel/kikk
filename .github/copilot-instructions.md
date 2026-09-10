# Copilot Instructions for kikk

Full project and coding instructions live in [`AGENTS.md`](../AGENTS.md) at the repo root — read that first for tech stack, project structure, code style, state management, testing, and PR/issue guidelines.

## Copilot-specific notes

- Environment variables for local Better Auth setup: `VITE_BETTER_AUTH_BASE_URL` (defaults to current origin), `VITE_FORCE_LOGIN="false"` to enable the hidden guest bypass for branch previews, and `VITE_GITHUB_TOKEN` for GitHub issue submission
- Deployment target: Cloudflare Workers, via Wrangler (`wrangler.json`); build output goes to `dist/` (gitignored)
- Follow the ESLint rules in `eslint.config.js` (React Hooks rules and React Refresh are enforced)
