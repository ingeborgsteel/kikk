# Architecture

This document describes the high-level design, data flow, and conventions used in kikk.

## Overview

kikk is a nature observation tracker built with **React + TypeScript** on the frontend and a minimal **Hono** backend running on **Cloudflare Workers**. Most application logic lives in the React frontend. **Better Auth** handles authentication, and **D1** provides the database. When the user is in guest mode or offline, the app falls back to `localStorage`.

## High-Level Data Flow

```
User Action
    │
    ▼
React Component (form / map interaction)
    │
    ▼
TanStack Query mutation  ──or──  Context (local-only / guest path)
    │                                │
    ▼                                ▼
api/ client (Hono / Better Auth)  localStorage
    │
    ▼
Cloudflare Worker / D1 / Better Auth
```

- **Components** capture user input via React Hook Form and map events.
- **TanStack Query hooks** (`queries/`) call **API clients** (`api/`) that talk to the Hono worker or external services.
- **Contexts** (`context/`) expose domain state and transparently choose between the authenticated Hono API and `localStorage` based on the current auth state (`isGuest` from `useAuth`) and `isLoginRequired()` (see `lib/guestMode.ts`).
- The **Cloudflare Worker** (`src/api/index.ts`) is a Hono app mounted under `/api/*`; it handles Better Auth, data routes, and admin routes, while the frontend remains the primary application surface.

## State Management

### When to Use What

| Mechanism           | Purpose                                              | Examples                                                                                      |
| ------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **React Context**   | App-wide domain state shared by many components      | `ObservationsContext`, `LocationsContext`, `AuthContext`, `FeatureAlertsContext`              |
| **TanStack Query**  | Server cache with automatic refetch and invalidation | `useObservation`, `useUserLocation`, `useSpeciesSearch`, `useExports`                         |
| **`localStorage`**  | Offline/fallback persistence and user preferences    | Observations & locations (guest mode / offline), theme, map layer, guest user id, query cache |
| **Component state** | Ephemeral UI state scoped to a single component      | Form field values, open/closed toggles                                                        |

### Provider Hierarchy

Defined in `src/react-app/main.tsx`:

```
QueryClientProvider          ← TanStack Query (5-min staleTime, 1 retry)
  AuthProvider               ← Better Auth session + guest bypass
    ThemeProvider             ← Light/dark theme
      BrowserRouter
        LoginGate             ← Blocks app until session or guest bypass
          GeolocationProvider   ← Follow-mode geolocation state
            MapPreferencesProvider  ← Map layer preference
              LocationsProvider     ← Saved user locations
                ObservationsProvider  ← Observation records
                  FeatureAlertsProvider ← "Nytt i kikk" alert dismissal state
                    App
```

### Dual-Mode Storage

Contexts use the current auth state (`isGuest` from `useAuth`) and `isLoginRequired()` to decide where to read/write data. Guest sessions store data locally under keys such as `kikk-guest-user-id`, `kikk_observations`, `kikk_user_locations`, `kikk_theme`, `kikk-map-layer`, `kikk-query-cache`, `kikk_dismissed_feature_alerts`, and `kikk-guest-created-at`. Authenticated users persist data via the Hono API and D1 database. This lets the app work fully without a backend for guests.

## API Integration

### External Services

| Service                    | Client file                                                                | Purpose                                                                                 |
| -------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Better Auth / Hono API** | `api/observations.ts`, `api/locations.ts`, `api/exports.ts`, `api/auth.ts` | Authentication, CRUD for observations, locations, and export logs via Cloudflare Worker |
| **Artsdatabanken**         | `api/artsdatabanken.ts`                                                    | Species search (`/publicapi/api/taxon`)                                                 |
| **GitHub**                 | Component-level (`GitHubIssueForm.tsx`)                                    | User suggestion/bug report submission                                                   |

### Conventions

- **`api/`** files export plain async functions that call external services. They contain no React hooks.
- **`queries/`** files wrap those functions in TanStack Query `useQuery` / `useMutation` hooks and handle cache invalidation.
- **`apiService.ts`** provides a generic `callApi` fetch wrapper used by external API calls.

## Directory Structure

```
src/
├── react-app/
│   ├── api/            # API clients (plain async functions, no React)
│   ├── components/     # Feature components (forms, pages, dialogs)
│   │   └── ui/         # Reusable UI primitives (Button, Input, Modal, etc.)
│   ├── context/        # React Context providers for domain state
│   ├── queries/        # TanStack Query hooks (useQuery / useMutation wrappers)
│   ├── types/          # TypeScript interfaces and type definitions
│   ├── data/           # Static registries (e.g. feature alerts)
│   ├── lib/            # Pure utility functions and configuration
│   ├── assets/         # Static images and icons
│   ├── App.tsx         # Route definitions and top-level state coordination
│   ├── Map.tsx         # Main Leaflet map component
│   └── main.tsx        # Entry point and provider hierarchy
└── api/
    └── index.ts        # Hono-based Cloudflare Worker entry point
```

### What Goes Where

| Directory        | Contents                                                                        | Rule of thumb                                                               |
| ---------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `components/ui/` | Generic, reusable UI primitives (button, input, modal, select, label, textarea) | No business logic; accepts props only                                       |
| `components/`    | Feature components that compose UI primitives                                   | One file per feature area (e.g. `ObservationForm`, `StatsDashboard`)        |
| `api/`           | Functions that call external APIs or the Hono worker                            | No React imports; return plain data or promises                             |
| `queries/`       | TanStack Query hooks                                                            | Thin wrappers around `api/` functions with cache keys and invalidation      |
| `context/`       | React Context providers                                                         | Manages domain state; handles localStorage fallback / Better Auth branching |
| `types/`         | TypeScript interfaces                                                           | One file per domain concept (`observation.ts`, `location.ts`, etc.)         |
| `lib/`           | Utility functions and config objects                                            | Pure functions, no React dependencies                                       |

## Adding a New Feature

1. **Types** – Define interfaces in `types/`.
2. **API client** – Add a new file in `api/` with plain async functions that call the Hono worker or an external service.
3. **Query hooks** – Wrap the API functions in `queries/` using `useQuery` / `useMutation`.
4. **Context** _(if needed)_ – Create a provider in `context/` only when the state must be shared app-wide. Add it to the provider hierarchy in `main.tsx`.
5. **Components** – Build UI in `components/`. Extract reusable primitives to `components/ui/`.
6. **Utilities** – Place helper functions in `lib/`.

## Key Patterns

- **React Hook Form** with `Controller` for all forms (`ObservationForm`, `LocationForm`, `LoginForm`).
- **Optional authentication** – Better Auth is required in production builds; the hidden guest bypass lets local development and branch previews work without credentials.
- **Leaflet map** – `Map.tsx` handles click-to-select, markers, and layer switching. `LocationEditor` is a smaller embedded map for forms. Both share the layer preference via `MapPreferencesContext`.
- **Routing** – `react-router-dom` with routes: `/` (map), `/observations`, `/stats`, `/news`, `/profile`, `/admin`, `/menu`, `/reset-password`. Desktop navigates via the `NavMenu` header dropdown (plus Kart/Kikket på quick links); mobile uses the floating `BottomNav` pill and the `/menu` page. Shared items come from `hooks/useNavMenuItems.tsx`.
- **Styling** – Tailwind CSS utility classes with custom design tokens (`forest`, `sand`, `bark`). Use the `dark:` prefix for dark mode.
