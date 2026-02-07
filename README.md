# kikk

En applikasjon for sporing av naturobservasjoner for å registrere og administrere observasjoner av dyreliv. Spor artsobservasjoner med nøyaktig plassering, dato og detaljert informasjon om det du har sett i felt.

## Om

kikk er en kartbasert observasjonssporer som hjelper naturentusiaster, forskere og dyrelivsobservatører med å dokumentere sine feltobservasjoner. Appen tilbyr et intuitivt grensesnitt for å registrere artsobservasjoner med rik metadata, inkludert plassering, dato, artsdetaljer, kjønn, antall og feltnotater.

### Teknologistakk

Bygget med moderne webteknologier for en rask, responsiv opplevelse:

- [**React**](https://react.dev/) - Moderne UI-bibliotek
- [**Vite**](https://vite.dev/) - Lynrask byggeverktøy og utviklingsserver
- [**TypeScript**](https://www.typescriptlang.org/) - Typesikker utvikling
- [**Leaflet**](https://leafletjs.com/) - Interaktiv karttjeneste
- [**Hono**](https://hono.dev/) - Lettvekts backend-rammeverk
- [**Cloudflare Workers**](https://developers.cloudflare.com/workers/) - Edge-deployment
- [**Tailwind CSS**](https://tailwindcss.com/) - Utility-first styling

### ✨ Funksjoner

- 🗺️ **Interaktivt kart** - Klikk hvor som helst for å registrere en observasjonsplassering
- 🔍 **Artssøk** - Søk arter ved hjelp av Artsdatabanken (Norsk institutt for naturforskning) databasen
- 📝 **Detaljerte observasjoner** - Registrer art, kjønn, antall, plasseringsusikkerhet og feltnotater
- 📋 **Observasjonshåndtering** - Se, rediger og slett dine observasjonsregistre
- 💾 **Lokal lagring** - Dine observasjoner lagres lokalt i nettleseren din
- 📱 **Responsiv design** - Fungerer sømløst på stasjonær og mobil

## Komme i gang

### Forutsetninger

- Node.js 18+ installert
- npm eller kompatibel pakkehåndterer

### Utvikling

Installer avhengigheter:

```bash
npm install
```

Start utviklerserveren:

```bash
npm run dev
```

Applikasjonen vil være tilgjengelig på [http://localhost:5173](http://localhost:5173).

### Bygging og linting

Bygg prosjektet ditt for produksjon:

```bash
npm run build
```

Kjør ESLint for å sjekke kodekvalitet:

```bash
npm run lint
```

Forhåndsvis produksjonsbygget ditt lokalt:

```bash
npm run preview
```

## Deployment

Deploy prosjektet ditt til Cloudflare Workers:

```bash
npm run deploy
```

Overvåk din deployede worker:

```bash
npx wrangler tail
```

## Bruk

1. **Legg til en observasjon**: Klikk hvor som helst på kartet for å velge en plassering
2. **Legg inn detaljer**: 
   - Søk etter og velg arter fra Artsdatabanken databasen
   - Spesifiser kjønn (hann/hunn/ukjent) og antall
   - Legg til usikkerhetsradius for plassering i meter
   - Sett observasjonsdato og -klokkeslett
   - Legg til feltnotater og kommentarer per art
3. **Lagre**: Observasjonen din lagres lokalt
4. **Se**: Klikk "Mine observasjoner" for å se alle dine registrerte observasjoner
5. **Administrer**: Rediger eller slett observasjoner etter behov

## Tilleggsressurser

- [Cloudflare Workers-dokumentasjon](https://developers.cloudflare.com/workers/)
- [Vite-dokumentasjon](https://vitejs.dev/guide/)
- [React-dokumentasjon](https://reactjs.org/)
- [Hono-dokumentasjon](https://hono.dev/)
