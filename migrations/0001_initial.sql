-- Initial D1 schema for kikk data (observations, locations, profiles, user_accesses).
-- Run with: npx wrangler d1 migrations apply kikk-auth

CREATE TABLE IF NOT EXISTS observations (
  id TEXT PRIMARY KEY,
  userId TEXT,
  location TEXT NOT NULL, -- JSON { lat, lng }
  locationName TEXT,
  uncertaintyRadius INTEGER NOT NULL,
  startDate TEXT NOT NULL,
  endDate TEXT,
  comment TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  lastExportedAt TEXT,
  exportCount INTEGER DEFAULT 0,
  locationId TEXT,
  observerName TEXT,
  project TEXT
);

CREATE TABLE IF NOT EXISTS species (
  id TEXT PRIMARY KEY,
  observationId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  species TEXT NOT NULL, -- JSON TaxonRecord
  gender TEXT,
  count INTEGER,
  unit TEXT,
  age TEXT,
  method TEXT,
  activity TEXT,
  comment TEXT,
  privateComment TEXT,
  notRediscovered INTEGER DEFAULT 0,
  notFound INTEGER DEFAULT 0,
  privateCollection TEXT,
  secondHand INTEGER DEFAULT 0,
  uncertainIdentification INTEGER DEFAULT 0,
  biotope TEXT,
  biotopeDescription TEXT,
  hide INTEGER DEFAULT 0,
  delayPublication TEXT
);

CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  userId TEXT,
  name TEXT NOT NULL,
  location TEXT NOT NULL, -- JSON { lat, lng }
  uncertaintyRadius INTEGER NOT NULL,
  description TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_accesses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  github_token TEXT NOT NULL,
  created_at TEXT NOT NULL
);
