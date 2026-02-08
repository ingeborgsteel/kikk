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
- 📊 **Excel Export** - Export observations to Excel spreadsheets with complete metadata
- 🏷️ **Export Tracking** - Track which observations have been exported and when
- 📥 **Export History** - View and re-download previous exports (with Supabase)
- 💾 **Local Storage** - Your observations are stored locally in your browser
- 🔐 **Optional Authentication** - Sign in with email and password for enhanced features
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

To enable authentication features, you'll need to set up Supabase:

1. Create a free account at [Supabase](https://supabase.com/)
2. Create a new project
3. Go to Project Settings > API
4. Copy your project URL and anon/public key
5. Create a `.env` file in the project root (copy from `.env.example`):

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

6. In your Supabase project, configure Email Auth:
   - Go to Authentication > Providers
   - Enable Email provider
   - Disable "Confirm email" if you want to allow immediate login without email confirmation

7. Run the database migration to create export tracking tables:
   - In your Supabase project, go to SQL Editor
   - Run the migration file: `supabase/migrations/20260208_add_export_functionality.sql`
   - This creates the `export_logs` table and storage bucket for exports

The app works fully without authentication - it's completely optional. Local storage will continue to work whether you're logged in or not. Export functionality works locally without Supabase, but export logs and file storage require Supabase.

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

### Recording Observations

1. **Add an Observation**: Click anywhere on the map to select a location
2. **Enter Details**: 
   - Search for and select species from the Artsdatabanken database
   - Specify gender (male/female/unknown) and count
   - Add location uncertainty radius in meters
   - Set observation date and time
   - Add field notes and per-species comments
3. **Save**: Your observation is stored locally
4. **View**: Click "Kikket på" to see all your recorded observations
5. **Manage**: Edit or delete observations as needed

### Exporting Observations

The app provides Excel export functionality to help you share and analyze your observations:

1. **Open Export Dialog**: Click "Eksporter til Excel" button on the observations page
2. **Choose Export Type**:
   - **Kun nye observasjoner**: Export only observations that haven't been exported before (marked with "Ny" badge)
   - **Alle observasjoner**: Export all observations regardless of export status
3. **Download**: Click export button to download the Excel file

**Export Features:**
- Observations are marked with "Ny" (new) badge if never exported
- Previously exported observations show last export date and count
- Excel files include all observation details: location, species, dates, comments, and export history
- With Supabase configured: Export logs are saved and can be re-downloaded later
- Without Supabase: Exports work locally, but history is not saved

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/)
- [Hono Documentation](https://hono.dev/)
