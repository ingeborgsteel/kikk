# Agent Instructions for kikk

This is the canonical instructions file for AI coding agents working on **kikk** — framework-agnostic guidance that applies regardless of which tool you're using (Claude Code, GitHub Copilot, Windsurf, Cursor, or others). Tool-specific entry points (`.github/copilot-instructions.md`, `.devin/`, `CLAUDE.md`) point back here and should only contain content specific to that tool's mechanics (slash commands, hook config, etc.).

## Project Overview

kikk is a nature observation tracking application built with React, TypeScript, and Cloudflare Workers. It helps nature enthusiasts, researchers, and wildlife observers document field observations with precise locations, species details, and rich metadata.

## Technology Stack

- **Frontend**: React 19.2.1 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design tokens
- **UI Components**: shadcn/ui pattern (Radix primitives + Tailwind, copied into `components/ui/`, not an npm package) — the standard for all UI primitives going forward
- **Backend**: Hono (lightweight framework) running on Cloudflare Workers
- **Maps**: Leaflet for interactive mapping, with offline PWA tile caching
- **Authentication**: Better Auth (required in production; local development and branch previews can use a hidden guest bypass)
- **State Management**: React Context API and TanStack Query
- **Forms**: React Hook Form

## Project Structure

```
src/
├── react-app/          # Frontend React application
│   ├── components/     # Reusable UI components
│   │   └── ui/         # Generic, reusable UI primitives (Button, Input, Modal)
│   ├── context/        # React Context providers
│   ├── queries/        # TanStack Query hooks (wrap api/ functions)
│   ├── hooks/          # Custom React hooks
│   ├── api/            # Plain async functions (no React imports)
│   ├── types/          # TypeScript type definitions (one interface per domain concept)
│   ├── data/           # Static registries (e.g. feature alerts)
│   ├── lib/            # Pure utility functions
│   └── assets/         # Static assets
└── api/                # Cloudflare Worker backend (Hono)
    └── index.ts        # Worker entry point (src/api/index.ts)
```

## Development Commands

- `npm run dev` - Start development server (http://localhost:5173)
- `npm run build` - Build for production (TypeScript + Vite)
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run preview` - Preview production build locally
- `npm run deploy` - Deploy to Cloudflare Workers
- `npm run check` - Full check (TypeScript + build + dry-run deploy)

## State Management Decision Tree

- **React Context** for domain state shared across components (observations, locations, auth, user preferences). Auth state now uses Better Auth with a guest-mode fallback for local development; observations/locations still fall back to localStorage when offline.
- **TanStack Query** for server-fetched data with caching, calls to external services (Artsdatabanken, GitHub), and data needing automatic refetching
- **Component State** for ephemeral UI state (form values, toggles, modals)

Context providers:

- `ObservationsContext` – CRUD for nature observations
- `LocationsContext` – CRUD for saved user locations
- `AuthContext` – Better Auth session and guest-mode state
- `ThemeContext` – Light/dark mode toggle
- `MapPreferencesContext` – Selected map layer (standard/topo/aerial)
- `GeolocationContext` – Follow-mode geolocation state
- `FeatureAlertsContext` – "Nytt i kikk" feature alerts and per-user dismissal state
- `SuggestionFormContext` – Global open/close state for the suggestion ("Forslag") modal

Every context must expose a custom hook (e.g., `useObservations()`) that throws an error when used outside its provider.

## Code Style & Best Practices

### TypeScript

- Use strict TypeScript with proper typing; avoid `any` — use specific types or generics
- Define interfaces in `src/react-app/types/`
- All functions must have return types

### React Patterns

- Functional components with hooks only
- React Hook Form for all forms
- Keep components small and focused on a single responsibility
- `api/` files never import React — they return plain data/promises
- `queries/` files wrap `api/` functions with TanStack Query hooks

### Styling

- Tailwind CSS utility classes only — no inline styles or CSS files
- Custom design tokens defined in `tailwind.config.js`: `forest` (dark green), `sand` (light), `bark` (dark)
- Mobile-first responsive design
- Use `dark:` prefix for dark mode styles

### UI Components — shadcn/ui is the standard

- All UI primitives (buttons, inputs, dropdowns, dialogs, etc.) should follow the shadcn/ui pattern: Radix UI primitives + `class-variance-authority` + Tailwind, source copied directly into `src/react-app/components/ui/` — not pulled in as an opaque npm dependency.
- Before building a new primitive, check `components/ui/` for an existing one (e.g. `button.tsx`, `input.tsx`, `combobox.tsx`, `Modal.tsx`) and reuse/extend it rather than hand-rolling a one-off.
- When a needed primitive doesn't exist yet, add it via the shadcn CLI or by porting the relevant shadcn/ui source into `components/ui/`, matching this project's existing token/class conventions (see `combobox.tsx` for a worked example built on `@radix-ui/react-popover` + `cmdk`).
- Native HTML form controls (`<select>`, unstyled `<input>`) should be migrated to shadcn-style components over time — don't introduce new native `<select>` elements.

### Key Unified Components (always use these, never reinvent)

- **Modal** (`src/react-app/components/ui/Modal.tsx`): universal modal/dialog component — consistent header, ESC-to-close, click-outside-to-close, optional submit on Enter, configurable `maxWidth`. Used by ExportDialog, MapClickDialog, etc.
- **Combobox** (`src/react-app/components/ui/combobox.tsx`): shadcn-style searchable dropdown (Radix Popover + cmdk) supporting grouped options and free-text custom entries; the standard replacement for native `<select>`.
- **NavMenu** (`src/react-app/components/NavMenu.tsx`): single dropdown menu in the header (Radix Popover, desktop only) for all app navigation — Kart, Kikket på, Mine lokaliteter, Statistikk, Nyheter, Admin, Logg ut. On mobile, the BottomNav "Meny" button opens the `/menu` page (`components/MenuPage.tsx`) instead. Both surfaces share item definitions from `hooks/useNavMenuItems.tsx` — add new top-level destinations there, not as new header buttons. Items are grouped: `destinations` and `account` (profile-related rows: "Mørk modus" toggle — items with `active` render a switch, `role="switch"` + `aria-checked`; "Forslag…" — ellipsis marks it as a dialog action opening the suggestion modal owned by `SuggestionFormContext`; and Logg ut). The login screen keeps its own separate suggestion button.
- **BottomNav** (`src/react-app/components/BottomNav.tsx`): mobile-only floating glass pill — Kart, Kikket på, Meny/Slutt. Collapsed it is a round button showing the current page's icon (right-anchored); expanding morphs it leftward into a full-width pill (fixed height, width transition only). No collapse button — any `pointerdown` outside the nav collapses it; nav clicks keep it open. `pointer-events-none` on the nav wrapper so the empty strip never blocks map taps. Pages without a permanent slot (Statistikk, Nyheter, Mine lokaliteter, Admin) get a temporary item inserted before Meny that persists until the pill collapses. Keep it below the map's action-button column (`fixed bottom-14 right-4`) so they never overlap.
- **Floating glass surfaces** (`src/react-app/lib/glass.ts`): shared `glassSurface` style for the BottomNav pill, the map's floating action buttons (follow-me, uncertainty, atlas, kikkemodus on mobile), the `MapLayerSwitcher` and "Last ned område" — use it for any floating overlay so they read as one design system.
- **Leaflet overrides** (`index.css`): `.leaflet-*` rules must live OUTSIDE `@layer` — Tailwind v3 tree-shakes `@layer` rules whose selectors never appear in scanned content files, and leaflet classes only exist in the runtime DOM. The scale is registered `bottomleft` but visually centered at the bottom edge — Leaflet only supports corner positions, so `.leaflet-bottom.leaflet-left` is centered via `left: 50%` + `translateX(-50%)`; corners are forced to z-400 so they stay under the z-500 nav.
- **Header** (`src/react-app/components/Header.tsx`): desktop only (`hidden md:block`) — mobile/tablet is fully headerless; pages fill the viewport and navigation is the BottomNav, so never add per-page "Tilbake til kart" buttons or page headers. The title is a button that navigates to `/`. Desktop also gets icon quick-links for Kart and Kikket på (with observation-count badge); active destination is highlighted. The `leftButton` slot holds KikkemodusToggle on the map and ThemeToggle elsewhere — on mobile, kikkemodus is instead a floating glass `MapToggleButton` stacked above the `MapLayerSwitcher` (top-right column in `Map.tsx`), and dark mode is the "Mørk modus" toggle in the menu.
- **SplashScreen** (`src/react-app/components/SplashScreen.tsx`): boot overlay with the kikkert logo + app name — shows for ≥1s and until the auth session check resolves, then fades out. Reads `kikk_theme` synchronously to match light/dark before ThemeProvider applies the `dark` class.
- **Marker Icons** (`src/react-app/lib/markerIcons.ts`): `createSelectionIcon()` (rust, selections/editable positions), `createObservationIcon()` (forest green, observations), `createUserLocationIcon()` (purple, saved locations)
- **Map Components**: `Map.tsx` (full-page map with layer switching) and `LocationEditor` (embedded 300px editor for forms, no controls) — both share layer preference via `MapPreferencesContext`, persisted to localStorage and synced across tabs

## Dual-Mode Operation (Critical)

Production builds require users to sign in via Better Auth. Local development and feature-branch previews can use a hidden guest bypass (triple-click the login logo) so the app remains usable without real credentials.

The app still stores observations and locations in `localStorage` for offline use and as a lightweight fallback, but the auth boundary is now always active:

- `LoginGate` blocks the app until a Better Auth session or a deliberate guest session is present.
- `isLoginRequired()` returns `true` in production builds unless `VITE_FORCE_LOGIN=false` is set.
- `bypassGuestLogin()` creates an isolated guest session that does not mix with authenticated users' data.

localStorage keys: `kikk-guest-user-id`, `kikk-guest-created-at`, `kikk_observations`, `kikk_user_locations`, `kikk_theme`, `kikk-map-layer`, `kikk-query-cache`, `kikk_dismissed_feature_alerts`

Never store sensitive data (tokens, passwords) in localStorage or Context.

## PWA & Offline Features

kikk is built as an installable PWA with offline map support.

- **Service worker**: Workbox-based SW generated by `vite-plugin-pwa` in `vite.config.ts`
  - Precaches build assets (`**/*.{js,css,html,ico,png,svg,woff2}`)
  - Runtime caching for tile URLs with `CacheFirst`:
    - `https://cache.kartverket.no/*` → `tiles-kartverket` cache
    - `https://api.mapbox.com/styles/*` → `tiles-mapbox` cache
  - `maximumFileSizeToCacheInBytes: 4 * 1024 * 1024` (4MB)
  - `skipWaiting: true`, `navigateFallbackDenylist: [/^\/api/]`
- **Manifest**: `public/manifest.json` with `name: kikk`, theme `#2F5D50`, background `#f5f0e8`, and 192x192 / 512x512 / maskable icons
- **Query cache persistence**: `src/react-app/main.tsx` wraps `QueryClient` in `PersistQueryClientProvider` with `createSyncStoragePersister` (localStorage key: `kikk-query-cache`); `gcTime` 7 days. Queries whose `queryFn` reads a dedicated localStorage key (e.g. `feature-alert-dismissals` → `kikk_dismissed_feature_alerts`) must be excluded via `dehydrateOptions.shouldDehydrateQuery` — otherwise a stale hydrated cache (fresh within `staleTime`, no refetch) can shadow the real localStorage value after a quick reload.
- **Offline UI**: `src/react-app/Map.tsx`
  - `useOnlineStatus` hook via `navigator.onLine`
  - Offline banner at top when disconnected
  - "Last ned område" button (bottom-left) to prefetch visible map tiles
  - `downloadVisibleTiles` downloads the active layer for zoom `current - 2` to `current + 3` (max 17) in batches of 8 concurrent fetches

## API Integration

- **Artsdatabanken API**: species search (`api/artsdatabanken.ts`) — handle errors gracefully, implement loading states
- **GitHub**: issue submission (component-level), minimal-scope token (`public_repo`)
- **Better Auth**: session, sign-in, sign-up, and password reset

## When Making Changes

1. Types → define interfaces in `types/`
2. API → add functions in `api/` (no React imports)
3. Queries → wrap API functions in `queries/` with TanStack Query
4. Context → create a provider only if state is shared app-wide
5. Components → build UI using the unified components above
6. Feature alert → if the change is user-facing, add an entry to `src/react-app/data/featureAlerts.ts` (see `.devin/skills/feature-alert/SKILL.md`)
7. Ensure TypeScript compilation succeeds: `npm run build`
8. Run linter before committing: `npm run lint`, and format with `npm run format`
9. Run critical-path e2e tests with `npx playwright test` when the change affects UI, forms, navigation, maps, or localStorage
10. Test locally with `npm run dev`
11. Verify responsive design and both light/dark themes
12. Don't break local storage functionality or backward compatibility with existing observations data

## Common Pitfalls to Avoid

1. Breaking localStorage — always test data migration
2. Hardcoding Better Auth dependencies without verifying the environment is configured
3. Creating new modal components instead of using the unified Modal
4. Custom marker icons instead of `lib/markerIcons.ts`
5. Inline styles instead of Tailwind classes
6. `any` types instead of proper interfaces
7. Breaking responsive design — always test mobile viewports
8. Adding new native `<select>`/unstyled form controls instead of shadcn-style `components/ui/` primitives

## Testing Approach

Unit tests use Vitest (`src/**/*.test.ts`). Critical UI flows are covered by Playwright in `e2e/`. Before submitting changes, verify:

1. Desktop and mobile viewports
2. Light and dark mode
3. Map interactions — click-to-select location, marker display, layer switching
4. Form submissions — observation form, location form, species search
5. Data persistence — localStorage read/write, page reload retention
6. With login enforced and with the guest bypass enabled
7. Backward compatibility — existing saved observations must still load correctly
8. Offline functionality
9. Playwright smoke tests pass (`npx playwright test`) for any map, form, or navigation change

Document manual test steps in the PR description when adding new features.

## Code Review Guidelines

- Verify TypeScript strictness: no `any` types, proper interfaces in `types/`
- Check new components follow existing patterns (functional, hooks, single responsibility)
- Ensure Tailwind classes use the project's custom design tokens
- Confirm responsive design and dark mode support
- Verify unified components are used where applicable (Modal, Combobox, Marker Icons, Map)
- New UI primitives follow the shadcn/ui pattern (Radix + Tailwind, copied source in `components/ui/`) rather than a new one-off or a third-party component library
- Check new state uses the correct mechanism (Context vs. TanStack Query)
- Look for regressions in localStorage data handling
- Confirm the login gate, guest bypass, and sign-out flows work in both production and development builds

## Issue Writing Guidelines

- Clear, descriptive title summarizing the change or problem
- **Problem/Motivation** section explaining why the change is needed
- **Acceptance Criteria** section with a checklist of concrete, testable outcomes
- Label appropriately (`bug`, `enhancement`, `documentation`)
- Reference related issues or PRs when applicable
- For bugs: steps to reproduce, expected vs. actual behavior
- For features: describe the user story or use case
- Keep issues focused on a single concern — split large tasks into sub-issues

## Pull Request Guidelines

- PR title should match or closely follow the issue title
- Reference related issue(s) (e.g., "Closes #42")
- Include a short summary of what changed and why
- Keep PRs small and focused — one logical change per PR
- Ensure all CI checks pass before requesting review: `npm run lint`, `tsc -b`, `npm run build`
- Run `npm run format` for consistent formatting
- Test locally with `npm run dev` before pushing
- Add screenshots for UI changes
- Don't include unrelated changes or formatting-only diffs

## Dependencies Management

- Keep dependencies up to date but test thoroughly
- Vite, React, and TypeScript are core dependencies
- Cloudflare-specific packages required for Workers deployment
- Avoid adding unnecessary dependencies

## Post-Feature Retrospective

At the end of every feature, run the `feature-retrospective` skill (`.devin/skills/feature-retrospective/SKILL.md`). The agent should reflect on friction, missing guidance, outdated examples, or new patterns that should be captured in `AGENTS.md`, `ARCHITECTURE.md`, a `.devin/skills/*` file, or `.github/copilot-instructions.md`. Update the relevant instruction files before moving on.

## Pre-PR / Pre-Merge Validation

Before creating a PR, pushing a feature branch to `origin`, or merging directly to `main`, invoke the `pre-pr-validation` skill (`.devin/skills/pre-pr-validation/SKILL.md`). The agent should review the changed files in the PR/merge, decide whether any of them need to be reflected in `AGENTS.md`, `ARCHITECTURE.md`, a `.devin/skills/*` file, or `.github/copilot-instructions.md`, update the relevant instruction files, and run a focused consistency check against the source of truth (`package.json`, `wrangler.json`, `vite.config.ts`, `src/api/index.ts`, `src/react-app/context/AuthContext.tsx`, `src/react-app/lib/guestMode.ts`, and other relevant code).

Do not finalize a PR or push to `main` until every instruction-worthy change has a corresponding instruction update and the focused consistency check passes.

## Notes

- The app name "kikk" should remain lowercase in code and documentation
- Species data comes from the Norwegian Biodiversity Information Centre
- Location uncertainty is measured in meters
- Observations include: species, gender, count, date/time, location, notes
