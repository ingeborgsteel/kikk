# Windsurf Agent Guide for kikk

## Project Overview

kikk is a nature observation tracking application built with React, TypeScript, and Cloudflare Workers. It helps nature enthusiasts document field observations with precise locations, species details, and rich metadata.

## Technology Stack

- **Frontend**: React 19.2.1 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design tokens (`forest`, `sand`, `bark`)
- **Backend**: Hono running on Cloudflare Workers
- **Maps**: Leaflet for interactive mapping
- **Authentication**: Supabase (optional - app works without it)
- **State Management**: React Context API + TanStack Query
- **Forms**: React Hook Form
- **PWA**: Offline support with tile caching

## Critical Architecture Rules

### State Management Decision Tree

1. **Use React Context** for:
   - Domain state shared across components (observations, locations, auth)
   - Client-side data that needs dual-mode storage (Supabase + localStorage fallback)
   - User preferences (theme, map layer)

2. **Use TanStack Query** for:
   - Server-fetched data with caching
   - API calls to external services (Artsdatabanken, GitHub)
   - Data that needs automatic refetching

3. **Use Component State** for:
   - Ephemeral UI state (form values, toggles, modals)

### Directory Structure & File Placement

```
src/react-app/
├── components/          # Feature components
│   └── ui/             # Reusable UI primitives (Button, Input, Modal)
├── context/            # React Context providers
├── queries/            # TanStack Query hooks
├── api/                # Plain async functions (no React imports)
├── types/              # TypeScript interfaces
├── lib/                # Pure utilities and configuration
└── assets/             # Static assets
```

**Key Rules:**

- `api/` files NEVER import React - they return plain data/promises
- `queries/` files wrap `api/` functions with TanStack Query hooks
- `types/` contains one interface per domain concept
- `components/ui/` contains only generic, reusable primitives

## Mandatory Unified Components

### Modal Component (`components/ui/Modal.tsx`)

- **ALWAYS** use this for all dialogs/pop-ups
- Consistent header with title and X button
- ESC key closes automatically
- Click outside closes automatically
- Configurable width via `maxWidth` prop

### Map Components

- **Map.tsx**: Full-page map with layer controls
- **LocationEditor**: Embedded 300px map for forms
- Both share layer preference via `MapPreferencesContext`
- Layer selection persists in localStorage

### Marker Icons (`lib/markerIcons.ts`)

- `createSelectionIcon()`: Rust-colored for selections/editable positions
- `createObservationIcon()`: Forest green for observations
- `createUserLocationIcon()`: Purple for saved locations
- Use these consistently - never create custom markers

## Code Style Requirements

### TypeScript

- Strict mode enabled - NO `any` types
- Define interfaces in `types/` directory
- Use utility types when appropriate
- All functions must have return types

### React Patterns

- Functional components with hooks only
- React Hook Form for ALL forms
- Custom hooks for complex logic
- Single responsibility principle

### Styling

- Tailwind utility classes only
- Custom design tokens: `forest` (dark green), `sand` (light), `bark` (dark)
- Mobile-first responsive design
- Use `dark:` prefix for dark mode
- No inline styles or CSS files

## Dual-Mode Operation (Critical)

The app must work with AND without Supabase:

```typescript
// Always check this before using Supabase features
if (isSupabaseConfigured()) {
  // Use Supabase
} else {
  // Fallback to localStorage
}
```

**localStorage keys:**

- `kikk_observations`
- `kikk_user_locations`
- `kikk_theme`
- `kikk-map-layer`

## API Integration Patterns

### External Services

- **Artsdatabanken**: Species search (`api/artsdatabanken.ts`)
- **GitHub**: Issue submission (component-level)
- **Supabase**: CRUD operations (`api/observations.ts`, etc.)

### Error Handling

- Always handle API errors gracefully
- Show user-friendly error messages
- Implement loading states for async operations

## Testing Requirements

Before submitting changes, verify:

1. **Desktop and mobile viewports** - responsive layout
2. **Light and dark mode** - `dark:` classes work correctly
3. **Map interactions** - click-to-select, markers, layer switching
4. **Form submissions** - validation, submission, error handling
5. **Data persistence** - localStorage read/write, page reload
6. **Dual-mode operation** - works with and without Supabase
7. **Backward compatibility** - existing data still loads

## Common Pitfalls to Avoid

1. **Breaking localStorage** - Always test data migration
2. **Hardcoding Supabase dependencies** - Check `isSupabaseConfigured()`
3. **Creating new modal components** - Use the unified Modal
4. **Custom marker icons** - Use `lib/markerIcons.ts`
5. **Inline styles** - Use Tailwind classes only
6. **Any types** - Use proper TypeScript interfaces
7. **Breaking responsive design** - Test mobile viewports

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Production build (must succeed)
npm run lint         # ESLint check (must pass)
npm run format       # Prettier formatting
npm run check        # Full check (TypeScript + build + deploy dry-run)
npm run deploy       # Deploy to Cloudflare Workers
```

## When Adding Features

1. **Types** → Define interfaces in `types/`
2. **API** → Add functions in `api/` (no React imports)
3. **Queries** → Wrap API functions in `queries/` with TanStack Query
4. **Context** → Create provider only if state is shared app-wide
5. **Components** → Build UI using unified components
6. **Testing** → Verify all testing requirements above

## Git Workflow & Subtrees

For **complex, cross-cutting features** that touch multiple layers (Worker, API, UI, config), use a **dedicated feature branch** that can be optionally extracted as a subtree:

```bash
# Create feature branch
git checkout -b feature/descriptive-name

# Work on the feature...
git add -A
git commit -m "feat: description (#issue)"

# Push for PR/review
git push origin feature/descriptive-name
```

### When to Use a Subtree

Create a subtree when a feature:

- Touches 3+ different areas (e.g., Worker + API + UI + config)
- Could be extracted as a reusable module later
- Needs isolated testing/review before merge
- Involves external integrations (email, SMS, etc.)

Subtree branches make it easier to:

- Squash/rebase messy commits before merge
- Cherry-pick to other projects
- Rollback if needed
- Review as a cohesive unit

## PWA & Offline Features

The app includes offline support with tile caching:

- Tiles are cached for current zoom ±2 levels
- Cache size limit: 4MB
- Uses CacheFirst strategy for map tiles
- Query cache persists for 7 days
- Offline banner shows when disconnected

## Security Considerations

- Never store sensitive data in localStorage
- Supabase handles authentication securely
- GitHub token has minimal scope (`public_repo`)
- API calls use proper error handling
- No hardcoded credentials in code

Remember: This app must work seamlessly whether Supabase is configured or not. Always test both modes!
