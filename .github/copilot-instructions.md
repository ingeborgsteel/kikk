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
