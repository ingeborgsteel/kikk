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

### ✨ Features

- 🗺️ **Interactive Map** - Click anywhere to record an observation location
- 🔍 **Species Search** - Search species using Artsdatabanken (Norwegian Biodiversity Information Centre) database
- 📝 **Detailed Observations** - Record species, gender, count, location uncertainty, and field notes
- 📋 **Observation Management** - View, edit, and delete your observation records
- 💾 **Local Storage** - Your observations are stored locally in your browser
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
3. **Save**: Your observation is stored locally
4. **View**: Click "My Observations" to see all your recorded observations
5. **Manage**: Edit or delete observations as needed

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/)
- [Hono Documentation](https://hono.dev/)
