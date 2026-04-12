# Copilot Instructions for kikk

## Project Overview

kikk is a nature observation tracking application built with React, TypeScript, and Cloudflare Workers. It helps nature enthusiasts, researchers, and wildlife observers document field observations with precise locations, species details, and rich metadata.

## Technology Stack

- **Frontend**: React 19.2.1 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design tokens
- **Backend**: Hono (lightweight framework) running on Cloudflare Workers
- **Maps**: Leaflet for interactive mapping
- **Authentication**: Supabase (optional)
- **State Management**: React Context API and TanStack Query
- **Forms**: React Hook Form

## Project Structure

```
src/
├── react-app/          # Frontend React application
│   ├── components/     # Reusable UI components
│   ├── context/        # React Context providers
│   ├── hooks/          # Custom React hooks
│   ├── api/            # API client functions
│   ├── types/          # TypeScript type definitions
│   ├── lib/            # Utility functions
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

## Code Style & Best Practices

### TypeScript

- Use strict TypeScript with proper typing
- Avoid `any` types - use specific types or generics
- Define interfaces in `src/react-app/types/` directory
- Use TypeScript's utility types when appropriate

### React Patterns

- Use functional components with hooks
- Prefer React Hook Form for form handling
- Use Context API for global state (e.g., ObservationsContext)
- Use TanStack Query for server state management
- Keep components small and focused on a single responsibility

### Styling

- Use Tailwind CSS utility classes
- Custom design tokens are defined in `tailwind.config.js`
- Follow the existing color scheme: forest (dark green), sand (light), bark (dark)
- Ensure responsive design (mobile-first approach)
- Use `dark:` prefix for dark mode styles

### File Organization

- Place reusable UI components in `src/react-app/components/`
- UI primitives go in `src/react-app/components/ui/`
- Keep business logic in hooks or context providers
- API functions go in `src/react-app/api/`

### Key Unified Components

**These components are standardized across the codebase - always use them:**

- **Modal (`src/react-app/components/ui/Modal.tsx`)**: Universal modal/dialog component for all forms and pop-ups
  - Consistent header with title and X button
  - Automatic close on ESC key
  - Close on click outside
  - Optional submit on Enter key
  - Configurable width via `maxWidth` prop
  - Used by: ExportDialog, MapClickDialog, and other dialogs
- **Marker Icons (`src/react-app/lib/markerIcons.ts`)**: Centralized map marker utilities
  - `createSelectionIcon()`: Rust-colored marker for selections and editable positions
  - `createObservationIcon()`: Forest green marker for observations
  - `createUserLocationIcon()`: Purple marker for saved user locations
  - All markers share consistent styling and sizing
  - Used by: Map.tsx, LocationEditor component

- **Map Components**: Two map components with shared layer preferences
  - **Map.tsx**: Full-page interactive map with layer switching controls (standard/topo/aerial)
  - **LocationEditor**: Embedded map editor (300px) for forms, uses same layer as Map but without controls
  - Both use `MapPreferencesContext` to persist the selected map layer across components and sessions
  - Layer selection is stored in localStorage and syncs across tabs

### ESLint Configuration

- Follow the ESLint rules defined in `eslint.config.js`
- React Hooks rules are enforced
- React Refresh plugin is enabled for HMR

## Key Features to Maintain

1. **Map Interaction**: Users click map to select observation locations
2. **Species Search**: Integration with Artsdatabanken API for species lookup
3. **Local Storage**: Observations stored locally in browser
4. **Optional Auth**: Supabase authentication is optional, not required
5. **Responsive Design**: Works on desktop and mobile
6. **Dark Mode**: Theme toggle between light and dark modes

## Testing Approach

- Manual testing is currently the primary testing method
- Test on both desktop and mobile viewports
- Verify map interactions, form submissions, and data persistence
- Test with and without authentication enabled

## Authentication

- Supabase integration is **optional**
- App works fully without authentication using local storage
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Don't break functionality for users without Supabase setup

## API Integration

- **Artsdatabanken API**: Used for species search
- Handle API errors gracefully
- Implement loading states for async operations

## Deployment

- Target platform: Cloudflare Workers
- Build outputs to `dist/` directory (gitignored)
- Use Wrangler for deployment configuration (`wrangler.json`)

## When Making Changes

1. Ensure TypeScript compilation succeeds: `npm run build`
2. Run linter before committing: `npm run lint`
3. Test locally with `npm run dev`
4. Verify responsive design on different screen sizes
5. Check both light and dark mode themes
6. Don't break local storage functionality
7. Maintain backward compatibility with existing observations data

## Common Patterns in This Codebase

- Custom hooks for data operations (e.g., `useObservations`)
- Context providers wrapping the app for global state
- Conditional rendering based on view state ('map' | 'observations')
- Bottom navigation for mobile-friendly navigation
- Form validation using React Hook Form
- CSS custom properties for theming

## State Management Rules

- **Context API** is the primary state management approach. Each domain has its own context provider:
  - `ObservationsContext` – CRUD for nature observations
  - `LocationsContext` – CRUD for saved user locations
  - `AuthContext` – Supabase authentication state
  - `ThemeContext` – Light/dark mode toggle
  - `MapPreferencesContext` – Selected map layer (standard/topo/aerial)
- Every context must expose a **custom hook** (e.g., `useObservations()`) that throws an error when used outside its provider
- Use **TanStack Query** for server-fetched data (API calls, caching, background refetches) – not Context
- Use **Context** for client-side or local-storage-backed state that needs to be shared across components
- Support **dual-mode operation**: contexts that persist data must work both with Supabase (when configured) and with localStorage (as fallback)
- Persist user preferences (theme, map layer) in `localStorage`
- Never store sensitive data (tokens, passwords) in localStorage or Context – rely on Supabase session handling

## Issue Writing Guidelines

- Use a clear, descriptive title that summarizes the change or problem
- Include a **Problem/Motivation** section explaining why the change is needed
- Include an **Acceptance Criteria** section with a checklist of concrete, testable outcomes
- Label issues appropriately (e.g., `bug`, `enhancement`, `documentation`)
- Reference related issues or PRs when applicable
- For bugs: include steps to reproduce, expected behavior, and actual behavior
- For features: describe the user story or use case
- Keep issues focused on a single concern – split large tasks into sub-issues

## Pull Request Guidelines

- PR title should match or closely follow the issue title
- Reference the related issue(s) in the PR description (e.g., "Closes #42")
- Include a short summary of what changed and why
- Keep PRs small and focused – one logical change per PR
- Ensure all CI checks pass before requesting review:
  1. `npm run lint` – no ESLint errors
  2. `tsc -b` – no TypeScript errors
  3. `npm run build` – successful production build
- Run `npm run format` to ensure consistent formatting
- Test locally with `npm run dev` before pushing
- Add screenshots for any UI changes
- Don't include unrelated changes or formatting-only diffs

## Testing Guidelines

- Manual testing is currently the primary testing method
- Before submitting changes, verify:
  1. **Desktop and mobile viewports** – check responsive layout
  2. **Light and dark mode** – verify theming with `dark:` classes
  3. **Map interactions** – click-to-select location, marker display, layer switching
  4. **Form submissions** – observation form, location form, species search
  5. **Data persistence** – localStorage read/write, page reload retention
  6. **With and without Supabase** – ensure the app works in both modes
  7. **Backward compatibility** – existing saved observations must still load correctly
- When adding new features, document the manual test steps in the PR description
- If automated tests are introduced in the future, use Vitest (aligns with Vite toolchain)

## Code Review Guidelines

- Verify TypeScript strictness: no `any` types, proper interfaces in `src/react-app/types/`
- Check that new components follow existing patterns (functional components, hooks, single responsibility)
- Ensure Tailwind classes use the project's custom design tokens (`forest`, `sand`, `bark`, etc.)
- Confirm responsive design: mobile-first with appropriate breakpoints
- Confirm dark mode support: `dark:` variants for all themed elements
- Verify that unified components are used where applicable (Modal, Marker Icons, Map)
- Check that new state is managed through the correct mechanism (Context vs. TanStack Query)
- Look for potential regressions in localStorage data handling
- Ensure API error states and loading states are handled gracefully
- Confirm that Supabase-dependent features degrade gracefully when Supabase is not configured

## Dependencies Management

- Keep dependencies up to date but test thoroughly
- Vite, React, and TypeScript are core dependencies
- Cloudflare-specific packages required for Workers deployment
- Avoid adding unnecessary dependencies

## Notes

- The app name "kikk" should remain lowercase in code and documentation
- Species data comes from Norwegian Biodiversity Information Centre
- Location uncertainty is measured in meters
- Observations include: species, gender, count, date/time, location, notes
