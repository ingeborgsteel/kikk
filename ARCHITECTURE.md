# Architecture

This document describes the high-level design, data flow, and conventions used in kikk.

## Overview

kikk is a nature observation tracker built with **React + TypeScript** on the frontend and a minimal **Hono** backend running on **Cloudflare Workers**. Most application logic lives in the React frontend. Supabase provides optional authentication and remote storage; when Supabase is not configured the app falls back to `localStorage`.

## High-Level Data Flow

```
User Action
    │
    ▼
React Component (form / map interaction)
    │
    ▼
TanStack Query mutation  ──or──  Context (local-only path)
    │                                │
    ▼                                ▼
api/ client (Supabase SDK)       localStorage
    │
    ▼
Supabase (Postgres + Auth + Storage)
```

- **Components** capture user input via React Hook Form and map events.
- **TanStack Query hooks** (`queries/`) call **API clients** (`api/`) that talk to Supabase or external services.
- **Contexts** (`context/`) expose domain state and transparently choose between Supabase and `localStorage` based on `isSupabaseConfigured()` (see `lib/supabase.ts`).
- The **Cloudflare Worker** (`src/worker/index.ts`) is a minimal Hono app that currently serves a health-check endpoint; the frontend is the primary application surface.

## State Management

### When to Use What

| Mechanism | Purpose | Examples |
|---|---|---|
| **React Context** | App-wide domain state shared by many components | `ObservationsContext`, `LocationsContext`, `AuthContext` |
| **TanStack Query** | Server cache with automatic refetch and invalidation | `useObservation`, `useUserLocation`, `useSpeciesSearch`, `useExports` |
| **`localStorage`** | Offline/fallback persistence and user preferences | Observations & locations (when Supabase is disabled), theme, map layer |
| **Component state** | Ephemeral UI state scoped to a single component | Form field values, open/closed toggles |

### Provider Hierarchy

Defined in `src/react-app/main.tsx`:

```
QueryClientProvider          ← TanStack Query (5-min staleTime, 1 retry)
  AuthProvider               ← Supabase user session
    ThemeProvider             ← Light/dark theme
      MapPreferencesProvider  ← Map layer preference
        LocationsProvider     ← Saved user locations
          ObservationsProvider ← Observation records
            BrowserRouter
              App
```

### Dual-Mode Storage

Contexts check `isSupabaseConfigured()` to decide where to read/write data. When Supabase environment variables are missing, data is stored locally under `localStorage` keys such as `kikk_observations`, `kikk_user_locations`, `kikk_theme`, and `kikk-map-layer`. This lets the app work fully without a backend.

## API Integration

### External Services

| Service | Client file | Purpose |
|---|---|---|
| **Supabase** | `api/observations.ts`, `api/locations.ts`, `api/exports.ts` | CRUD for observations, locations, and export logs |
| **Artsdatabanken** | `api/artsdatabanken.ts` | Species search (`/publicapi/api/taxon`) |
| **GitHub** | Component-level (`GitHubIssueForm.tsx`) | User suggestion/bug report submission |

### Conventions

- **`api/`** files export plain async functions that call external services. They contain no React hooks.
- **`queries/`** files wrap those functions in TanStack Query `useQuery` / `useMutation` hooks and handle cache invalidation.
- **`apiService.ts`** provides a generic `callApi` fetch wrapper used by non-Supabase API calls.

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
│   ├── lib/            # Pure utility functions and configuration
│   ├── assets/         # Static images and icons
│   ├── App.tsx         # Route definitions and top-level state coordination
│   ├── Map.tsx         # Main Leaflet map component
│   └── main.tsx        # Entry point and provider hierarchy
└── worker/
    └── index.ts        # Hono-based Cloudflare Worker
```

### What Goes Where

| Directory | Contents | Rule of thumb |
|---|---|---|
| `components/ui/` | Generic, reusable UI primitives (button, input, modal, select, label, textarea) | No business logic; accepts props only |
| `components/` | Feature components that compose UI primitives | One file per feature area (e.g. `ObservationForm`, `StatsDashboard`) |
| `api/` | Functions that call external APIs or Supabase | No React imports; return plain data or promises |
| `queries/` | TanStack Query hooks | Thin wrappers around `api/` functions with cache keys and invalidation |
| `context/` | React Context providers | Manages domain state; handles localStorage vs Supabase branching |
| `types/` | TypeScript interfaces | One file per domain concept (`observation.ts`, `location.ts`, etc.) |
| `lib/` | Utility functions and config objects | Pure functions, no React dependencies |

## Adding a New Feature

1. **Types** – Define interfaces in `types/`.
2. **API client** – Add a new file in `api/` with plain async functions for the service or Supabase table.
3. **Query hooks** – Wrap the API functions in `queries/` using `useQuery` / `useMutation`.
4. **Context** *(if needed)* – Create a provider in `context/` only when the state must be shared app-wide. Add it to the provider hierarchy in `main.tsx`.
5. **Components** – Build UI in `components/`. Extract reusable primitives to `components/ui/`.
6. **Utilities** – Place helper functions in `lib/`.

## Key Patterns

- **React Hook Form** with `Controller` for all forms (`ObservationForm`, `LocationForm`, `LoginForm`).
- **Optional authentication** – Supabase auth is enabled only when env vars are present; the app degrades gracefully.
- **Leaflet map** – `Map.tsx` handles click-to-select, markers, and layer switching. `LocationEditor` is a smaller embedded map for forms. Both share the layer preference via `MapPreferencesContext`.
- **Routing** – `react-router-dom` with four routes: `/` (map), `/observations`, `/stats`, `/profile`. Mobile uses `BottomNav`; desktop uses header buttons.
- **Styling** – Tailwind CSS utility classes with custom design tokens (`forest`, `sand`, `bark`). Use the `dark:` prefix for dark mode.
