---
name: pre-pr-validation
description: Validate that AI instruction files and project docs are in sync with the codebase before a PR or merge
---

# Pre-PR / Pre-Merge Doc-Ownership Validation

Run this skill before you create a PR, push a feature branch to `origin`, or merge directly to `main`. It makes sure that any change that should be reflected in the project's canonical instructions is updated before it lands.

## When to run

- Before you create a pull request.
- Before you push a feature branch to `origin` for the first time.
- Before you merge a branch directly into `main`.
- Whenever you touch code that defines patterns, architecture, dependencies, auth, environment, PWA/offline behavior, or agent-facing workflows.

## How to run

1. Identify the files that are part of the PR/merge:
   - Uncommitted changes: `git status --short`
   - Committed branch vs `main`: `git diff --name-only main...HEAD`
2. For each changed file, decide whether it is **instruction-worthy** using the mapping below.
3. If a change is instruction-worthy, update the relevant `AGENTS.md`, `ARCHITECTURE.md`, `.devin/skills/*`, `.windsurf/*`, or `.github/copilot-instructions.md` section. Do not add noise for pure implementation-only changes.
4. After updating docs, run a focused consistency check: re-read the changed source-of-truth files and the affected instruction files, and confirm they agree.
5. Only proceed with the PR, push, or merge once the doc ownership is correct.

## Instruction-worthiness mapping

| Changed file(s)                                                                                           | Instruction file(s) to consider                                                                       |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `package.json` (deps/scripts)                                                                             | `AGENTS.md` (tech stack / dev commands), `ARCHITECTURE.md` (key patterns), relevant `.devin/skills/*` |
| `wrangler.json` or `src/api/index.ts`                                                                     | `ARCHITECTURE.md`, `AGENTS.md` project structure, `.devin/skills/deployment/SKILL.md`                 |
| `vite.config.ts` or `public/manifest.json`                                                                | `AGENTS.md` PWA & Offline Features                                                                    |
| `src/react-app/context/AuthContext.tsx`, `src/react-app/lib/auth.ts`, or `src/react-app/lib/guestMode.ts` | `AGENTS.md` Dual-Mode Operation, `ARCHITECTURE.md` auth/provider hierarchy, skills that mention auth  |
| `.env.example`                                                                                            | `AGENTS.md`, `.github/copilot-instructions.md`, `.devin/skills/deployment/SKILL.md`                   |
| `src/react-app/components/ui/*` or new shadcn-style primitive                                             | `AGENTS.md` UI Components / shadcn pattern, relevant skills                                           |
| `src/react-app/api/*` or new external service integration                                                 | `ARCHITECTURE.md` API integration, `.devin/skills/feature-development/SKILL.md`                       |
| `src/react-app/types/*` or domain model change                                                            | `ARCHITECTURE.md` conventions, `AGENTS.md` types                                                      |
| `src/react-app/Map.tsx` or map/offline changes                                                            | `AGENTS.md` PWA & Offline Features, `ARCHITECTURE.md` map patterns                                    |
| New `.devin/skills/*` or `.windsurf/workflows/*`                                                          | `.windsurf/README.md`, `.windsurf/project-guide.md`, `AGENTS.md` if skills are referenced             |
| `tailwind.config.js` / tokens or styling changes                                                          | `AGENTS.md` styling / design tokens                                                                   |
| CI files (`.github/workflows/*`)                                                                          | `.devin/skills/code-review/SKILL.md`, `AGENTS.md` testing approach                                    |
| `README.md` or user-facing docs                                                                           | Usually no agent instruction update unless it reveals a changed pattern                               |

## Consistency checks after doc updates

For any instruction file you touched, confirm:

- **Auth** — matches `AuthContext.tsx`, `lib/auth.ts`, `lib/guestMode.ts`, `package.json` dependencies, and `.env.example`.
- **Worker / backend** — matches `wrangler.json` and `src/api/index.ts`. No `src/worker/index.ts` unless it exists.
- **Env vars** — match `.env.example`. No `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` unless reintroduced.
- **PWA & offline** — match `vite.config.ts`, `public/manifest.json`, `src/react-app/main.tsx`, `src/react-app/Map.tsx`.
- **localStorage keys** — include `kikk-guest-user-id`, `kikk_observations`, `kikk_user_locations`, `kikk_theme`, `kikk-map-layer`, `kikk-query-cache` as applicable.
- **`.windsurf` slash commands** — if referenced, corresponding `.windsurf/workflows/<command>.md` files exist.

## Agent rule

Do not create a PR, push a branch to `origin`, or merge to `main` until every instruction-worthy change in the diff has a corresponding doc/skill update and the focused consistency check passes. If a change is not instruction-worthy, briefly note why in your own reasoning and proceed.
