# kikk

A nature observation tracking application for recording and managing wildlife sightings. Track species observations with precise locations, dates, and detailed information about what you've seen in the field.

## About

kikk is a map-based observation tracker that helps nature enthusiasts, researchers, and wildlife observers document their field observations. The app provides an intuitive interface for recording species sightings with rich metadata including location, date, species details, gender, count, and field notes.

### Technology Stack

Built with modern web technologies for a fast, responsive experience:

- [**React**](https://react.dev/) - Modern UI library
- [**Vite**](https://vite.dev/) - Lightning-fast build tooling and development server
- [**TypeScript**](https://www.typescriptlang.org/) - Type-safe development
- [**Leaflet**](https://leafletjs.com/) - Interactive mapping
- [**Hono**](https://hono.dev/) - Lightweight backend framework
- [**Cloudflare Workers**](https://developers.cloudflare.com/workers/) - Edge deployment
- [**Tailwind CSS**](https://tailwindcss.com/) - Utility-first styling
- [**Supabase**](https://supabase.com/) - Optional authentication backend

### ✨ Features

- 🗺️ **Interactive Map** - Click anywhere to record an observation location
- 🔍 **Species Search** - Search species using Artsdatabanken (Norwegian Biodiversity Information Centre) database
- 📝 **Detailed Observations** - Record species, gender, count, location uncertainty, and field notes
- 📋 **Observation Management** - View, edit, and delete your observation records
- 💾 **Persistent Storage** - Observations stored in Supabase database with localStorage fallback
- 🔐 **Optional Authentication** - Sign in with email and password for user-specific observations
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or compatible package manager

### Development

Install dependencies:

```bash
npm install
```

#### Optional: Supabase Authentication Setup

To enable authentication and persistent storage features, you'll need to set up Supabase:

1. Create a free account at [Supabase](https://supabase.com/)
2. Create a new project
3. Go to Project Settings > API
4. Copy your project URL and anon/public key
5. Create a `.env` file in the project root (copy from `.env.example`):

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

6. **Set up the database schema**: Run the migration file to create the necessary tables
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase/migrations/20260207_create_observations_tables.sql`
   - Execute the SQL to create the `observations` and `species_observations` tables

7. Configure Email Auth:
   - Go to Authentication > Providers
   - Enable Email provider
   - Disable "Confirm email" if you want to allow immediate login without email confirmation

**About Data Storage:**
- When Supabase is configured and you're logged in, your observations are saved to your user account
- Anonymous users (not logged in) can still create observations that are stored in the database without a user ID
- If Supabase is not configured, observations fall back to localStorage
- localStorage is also used as a backup cache for improved performance

The app works fully without authentication - it's completely optional.

Start the development server:

```bash
npm run dev
```

Your application will be available at [http://localhost:5173](http://localhost:5173).

### Building & Linting

Build your project for production:

```bash
npm run build
```

Run ESLint to check code quality:

```bash
npm run lint
```

Preview your production build locally:

```bash
npm run preview
```

## Deployment

Deploy your project to Cloudflare Workers:

```bash
npm run deploy
```

Monitor your deployed worker:

```bash
npx wrangler tail
```

## Usage

1. **Add an Observation**: Click anywhere on the map to select a location
2. **Enter Details**: 
   - Search for and select species from the Artsdatabanken database
   - Specify gender (male/female/unknown) and count
   - Add location uncertainty radius in meters
   - Set observation date and time
   - Add field notes and per-species comments
3. **Save**: Your observation is stored in Supabase (if configured) and localStorage
4. **View**: Click "My Observations" to see all your recorded observations
5. **Manage**: Edit or delete observations as needed
6. **Login** (Optional): Sign in to keep your observations synced across devices

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/)
- [Hono Documentation](https://hono.dev/)
