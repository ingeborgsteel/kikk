# Agent Instructions for kikk

This is the canonical instructions file for AI coding agents working on **kikk** — framework-agnostic guidance that applies regardless of which tool you're using (Claude Code, GitHub Copilot, Windsurf, Cursor, or others). Tool-specific entry points (`.github/copilot-instructions.md`, `.windsurf/`, `CLAUDE.md`) point back here and should only contain content specific to that tool's mechanics (slash commands, hook config, etc.).

## Project Overview

kikk is a nature observation tracking application built with React, TypeScript, and Cloudflare Workers. It helps nature enthusiasts, researchers, and wildlife observers document field observations with precise locations, species details, and rich metadata.

## Technology Stack

- **Frontend**: React 19.2.1 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design tokens
- **UI Components**: shadcn/ui pattern (Radix primitives + Tailwind, copied into `components/ui/`, not an npm package) — the standard for all UI primitives going forward
- **Backend**: Hono (lightweight framework) running on Cloudflare Workers
- **Maps**: Leaflet for interactive mapping, with offline PWA tile caching
- **Authentication**: Supabase (optional)
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
│   ├── lib/            # Pure utility functions
│   └── assets/         # Static assets
└── worker/             # Cloudflare Worker backend
    └── index.ts        # Worker entry point
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

- **React Context** for domain state shared across components (observations, locations, auth) and client-side data needing dual-mode storage (Supabase + localStorage fallback), plus user preferences (theme, map layer)
- **TanStack Query** for server-fetched data with caching, calls to external services (Artsdatabanken, GitHub), and data needing automatic refetching
- **Component State** for ephemeral UI state (form values, toggles, modals)

Context providers:
- `ObservationsContext` – CRUD for nature observations
- `LocationsContext` – CRUD for saved user locations
- `AuthContext` – Supabase authentication state
- `ThemeContext` – Light/dark mode toggle
- `MapPreferencesContext` – Selected map layer (standard/topo/aerial)

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
- **Marker Icons** (`src/react-app/lib/markerIcons.ts`): `createSelectionIcon()` (rust, selections/editable positions), `createObservationIcon()` (forest green, observations), `createUserLocationIcon()` (purple, saved locations)
- **Map Components**: `Map.tsx` (full-page map with layer switching) and `LocationEditor` (embedded 300px editor for forms, no controls) — both share layer preference via `MapPreferencesContext`, persisted to localStorage and synced across tabs

## Dual-Mode Operation (Critical)

Supabase authentication is optional — the app must work fully with local storage alone.

```typescript
if (isSupabaseConfigured()) {
  // Use Supabase
} else {
  // Fallback to localStorage
}
```

localStorage keys: `kikk_observations`, `kikk_user_locations`, `kikk_theme`, `kikk-map-layer`

Never store sensitive data (tokens, passwords) in localStorage or Context — rely on Supabase session handling.

## PWA & Offline Features

- Map tiles cached for current zoom ±2 levels, CacheFirst strategy, 4MB cache limit
- Query cache persists for 7 days
- Offline banner shown when disconnected

## API Integration

- **Artsdatabanken API**: species search (`api/artsdatabanken.ts`) — handle errors gracefully, implement loading states
- **GitHub**: issue submission (component-level), minimal-scope token (`public_repo`)
- **Supabase**: CRUD operations (`api/observations.ts`, etc.)

## When Making Changes

1. Types → define interfaces in `types/`
2. API → add functions in `api/` (no React imports)
3. Queries → wrap API functions in `queries/` with TanStack Query
4. Context → create a provider only if state is shared app-wide
5. Components → build UI using the unified components above
6. Ensure TypeScript compilation succeeds: `npm run build`
7. Run linter before committing: `npm run lint`, and format with `npm run format`
8. Test locally with `npm run dev`
9. Verify responsive design and both light/dark themes
10. Don't break local storage functionality or backward compatibility with existing observations data

## Common Pitfalls to Avoid

1. Breaking localStorage — always test data migration
2. Hardcoding Supabase dependencies — check `isSupabaseConfigured()`
3. Creating new modal components instead of using the unified Modal
4. Custom marker icons instead of `lib/markerIcons.ts`
5. Inline styles instead of Tailwind classes
6. `any` types instead of proper interfaces
7. Breaking responsive design — always test mobile viewports
8. Adding new native `<select>`/unstyled form controls instead of shadcn-style `components/ui/` primitives

## Testing Approach

Manual testing is currently the primary method (no automated test suite yet — if one is introduced, use Vitest to align with the Vite toolchain). Before submitting changes, verify:

1. Desktop and mobile viewports
2. Light and dark mode
3. Map interactions — click-to-select location, marker display, layer switching
4. Form submissions — observation form, location form, species search
5. Data persistence — localStorage read/write, page reload retention
6. With and without Supabase configured
7. Backward compatibility — existing saved observations must still load correctly
8. Offline functionality

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
- Confirm Supabase-dependent features degrade gracefully when Supabase is not configured

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

## Notes

- The app name "kikk" should remain lowercase in code and documentation
- Species data comes from the Norwegian Biodiversity Information Centre
- Location uncertainty is measured in meters
- Observations include: species, gender, count, date/time, location, notes
