# Supabase Database Migrations

This directory contains the database migration files for the Kikk application.

## Structure

- `migrations/` - Contains SQL migration files that define the database schema

## Running Migrations

To apply these migrations to your Supabase database, you have several options:

### Option 1: Using Supabase CLI

1. Install Supabase CLI: `npm install -g supabase`
2. Link to your project: `supabase link --project-ref your-project-ref`
3. Apply migrations: `supabase db push`

### Option 2: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of the migration file
4. Execute the SQL

### Option 3: Manual Application

Copy the SQL from `migrations/20260207_create_observations_tables.sql` and run it directly in your Supabase SQL editor.

## Database Schema

### Tables

#### `observations`
Stores the main observation data including location and metadata.

- `id` (UUID, PK) - Unique identifier
- `user_id` (UUID, FK, nullable) - References auth.users, nullable for anonymous observations
- `latitude` (DOUBLE PRECISION) - Location latitude
- `longitude` (DOUBLE PRECISION) - Location longitude
- `uncertainty_radius` (INTEGER) - Location uncertainty in meters
- `observation_date` (TIMESTAMP) - When the observation was made
- `comment` (TEXT) - General observation comment
- `created_at` (TIMESTAMP) - Record creation time
- `updated_at` (TIMESTAMP) - Record last update time

#### `species_observations`
Stores individual species sightings within an observation.

- `id` (UUID, PK) - Unique identifier
- `observation_id` (UUID, FK) - References observations table
- `species_data` (JSONB) - Species information from external API
- `gender` (TEXT) - Species gender: 'male', 'female', or 'unknown'
- `count` (INTEGER) - Number of individuals observed
- `comment` (TEXT) - Per-species comment
- `created_at` (TIMESTAMP) - Record creation time

### Row Level Security (RLS)

Both tables have RLS enabled with the following policies:

**For observations:**
- Users can read their own observations
- Anyone can read anonymous observations (user_id IS NULL)
- Users can insert/update/delete their own observations
- Anonymous users can insert/update/delete observations without user_id

**For species_observations:**
- Users can read/insert/update/delete species observations for observations they have access to

This ensures data privacy while allowing anonymous users to create observations.
