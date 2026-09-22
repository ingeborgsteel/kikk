# kikk

A nature observation tracking application for recording and managing wildlife sightings. Track species observations with
precise locations, dates, and detailed information about what you've seen in the field.

## About

kikk is a map-based observation tracker that helps nature enthusiasts, researchers, and wildlife observers document
their field observations. The app provides an intuitive interface for recording species sightings with rich metadata
including location, date, species details, gender, count, and field notes.

### Technology Stack

Built with modern web technologies for a fast, responsive experience:

- [**React**](https://react.dev/) - Modern UI library
- [**Vite**](https://vite.dev/) - Lightning-fast build tooling and development server
- [**TypeScript**](https://www.typescriptlang.org/) - Type-safe development
- [**Leaflet**](https://leafletjs.com/) - Interactive mapping
- [**Hono**](https://hono.dev/) - Lightweight backend framework
- [**Cloudflare Workers**](https://developers.cloudflare.com/workers/) - Edge deployment
- [**Cloudflare D1**](https://developers.cloudflare.com/d1/) - Serverless SQL database (via Drizzle ORM)
- [**Better Auth**](https://www.better-auth.com/) - Email/password authentication
- [**Tailwind CSS**](https://tailwindcss.com/) - Utility-first styling

### ✨ Features

- 🗺️ **Interactive Map** - Click anywhere to record an observation location
- 🔍 **Species Search** - Search species using Artsdatabanken (Norwegian Biodiversity Information Centre) database
- 📝 **Detailed Observations** - Record species, gender, count, location uncertainty, and field notes
- 📋 **Observation Management** - View, edit, and delete your observation records
- � **Saved Locations** - Save and name your favourite observation spots
- �📊 **Statistics** - Dashboard with stats over your observations
- 📤 **Excel Export** - Export observations to Excel spreadsheets with complete metadata
- 🏷️ **Export Tracking** - Track which observations have been exported and when
- ☁️ **Cloud Sync + Offline** - Observations sync to your account; offline work is queued locally and synced on reconnect
- 📶 **Offline Maps** - Installable PWA with downloadable map tiles for field use
- 🗻 **Map Layers** - Norgeskart, Kart (topo), and Flyfoto (aerial)
- � **Kikkemodus** - Binocular mode that filters the map to observations only
- 🔐 **Authentication** - Email/password sign-in via Better Auth (required in production; hidden guest bypass in dev and branch previews)
- 🌙 **Dark Mode** - Light and dark themes
- 💡 **GitHub Suggestions** - Submit feature requests and bug reports directly from the app
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices

## Getting Started

### Prerequisites

- Node.js 20+ installed
- npm or compatible package manager

### Development

Install dependencies:

```bash
npm install
```

Set up environment files:

```bash
cp .env.example .env            # client env vars (all optional for local dev)
cp .dev.vars.example .dev.vars  # worker secrets — set BETTER_AUTH_SECRET for auth to work locally
```

In local development the login gate allows a hidden guest bypass: triple-click the logo on the login screen to enter without an account.

#### Optional: GitHub Issue Creation Setup

To enable users to submit feature requests and bug reports directly from the app:

1. Create a GitHub Personal Access Token:
   - Go to GitHub Settings > Developer settings > Personal access tokens > Tokens (classic)
   - Click "Generate new token (classic)"
   - Give it a descriptive name (e.g., "kikk suggestions")
   - Select the `public_repo` scope (or `repo` if your repository is private)
   - Generate and copy the token

2. Add the token to your `.env` file:

```bash
VITE_GITHUB_TOKEN=your_github_token_here
```

**Security Note**: This token is exposed in the client-side bundle. Only use a token with minimal permissions (e.g., only `public_repo` scope) and consider it public. For production use, it's recommended to implement a backend endpoint that securely handles token storage and issue creation.

The floating suggestions button will appear on all pages, allowing users to submit issues to the repository.

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

Production deployments and branch previews are handled by Cloudflare Workers Builds (the `Workers Builds: kikk` check). The GitHub Actions workflows that previously ran `wrangler deploy` are no longer needed because Cloudflare already builds and deploys after each push.

Branch previews use [Worker Previews](https://developers.cloudflare.com/workers/previews/) (`wrangler preview`): each branch gets a stable Preview URL that always points to its latest deployment, and Cloudflare posts the URL as a comment on each pull request.

`wrangler.json` defines:

- Top-level `DB` binding with `database_id` → `kikk-db` (production traffic)
- `previews.d1_databases` `DB` binding with `database_id` → `kikk-db-test` (all branch previews share the test database)

Previews do not inherit production settings — the `previews` block must redeclare every binding the Worker needs (`assets`, `compatibility_date`, and `compatibility_flags` stay top-level only).

The preview build also needs `VITE_FORCE_LOGIN=false` so branch previews allow the hidden guest bypass.

### Cloudflare Workers Builds settings

Set these in the Cloudflare dashboard under **Workers & Pages → kikk → Settings → Builds**:

| Field                                     | Command                                         |
| ----------------------------------------- | ----------------------------------------------- |
| Build/deploy command (production, `main`) | `npm run build && npm run deploy`               |
| Preview command (branch previews / PRs)   | `npm run build:preview && npx wrangler preview` |

`npm run build:preview` sets `VITE_FORCE_LOGIN=false` so the preview bundle enables the hidden guest bypass. `npx wrangler preview` creates or updates the Preview named after the current git branch and binds `DB` to `kikk-db-test` via the `previews` block.

If the Worker was connected to Builds before Worker Previews existed, the dashboard shows a **Set up Worker Previews** banner under **Settings → Builds** — complete that one-time switch first (it is not reversible).

### Preview secrets

Secrets are not inherited by Previews. Set shared secrets once in the Previews Base configuration so every new branch Preview gets them:

```bash
npx wrangler preview base-config secret put BETTER_AUTH_SECRET
# optionally, for password-reset emails in previews:
npx wrangler preview base-config secret put RESEND_API_KEY
```

`RESEND_FROM_EMAIL` is not sensitive — it lives in `vars`/`previews.vars` in `wrangler.json`, not in secrets. `VITE_*` variables (`VITE_MAPBOX_TOKEN`, `VITE_GITHUB_TOKEN`) are build-time only: set them under **Settings → Builds → Variables and secrets**, never in `vars`.

Base secrets apply only to Previews created afterwards. To change a secret on an existing Preview: `npx wrangler preview secret put SECRET_NAME --name <branch>`.

### Migrations

Migrations run as separate GitHub Actions workflows so they are visible in the PR / `main` checks:

- `.github/workflows/migrate-preview.yml` runs on PRs and `main` pushes, applying migrations to `kikk-db-test` via `wrangler d1 migrations apply DB --remote --preview` (the `--preview` flag targets the top-level binding's `preview_database_id`, which is `kikk-db-test`).
- `.github/workflows/migrate-prod.yml` runs on `main` pushes, applying migrations to `kikk-db`.

### Manual commands

Deploy to production locally (use with care):

```bash
npm run db:migrate:prod && npm run deploy
```

Create or update the Preview for the current branch, bound to the test database:

```bash
npm run deploy:preview
```

Delete a Preview (e.g. after merging a branch):

```bash
npx wrangler preview delete --name <branch>
```

Monitor a deployed worker:

```bash
npx wrangler tail
```

## Usage

### Recording Observations

1. **Add an Observation**: Click anywhere on the map to select a location
2. **Enter Details**:
   - Search for and select species from the Artsdatabanken database
   - Specify gender and count
   - Add location uncertainty radius in meters
   - Set observation date and time
   - Add field notes and per-species comments
3. **Save**: Your observation is saved to your account (queued locally and synced later when offline)
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

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/)
