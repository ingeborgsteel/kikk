-- Create observations table
-- This table stores the main observation data including location and metadata
CREATE TABLE IF NOT EXISTS observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  uncertainty_radius INTEGER NOT NULL DEFAULT 0,
  observation_date TIMESTAMP WITH TIME ZONE NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create species_observations table
-- This table stores individual species sightings within an observation
CREATE TABLE IF NOT EXISTS species_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_id UUID NOT NULL REFERENCES observations(id) ON DELETE CASCADE,
  -- Species data stored as JSONB since it comes from external API
  species_data JSONB NOT NULL,
  gender TEXT CHECK (gender IN ('male', 'female', 'unknown')) NOT NULL DEFAULT 'unknown',
  count INTEGER NOT NULL DEFAULT 1,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_observations_user_id ON observations(user_id);
CREATE INDEX IF NOT EXISTS idx_observations_created_at ON observations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_species_observations_observation_id ON species_observations(observation_id);

-- Enable Row Level Security
ALTER TABLE observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE species_observations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for observations table
-- Users can read their own observations
CREATE POLICY "Users can read their own observations"
  ON observations FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read observations without user_id (public/anonymous observations)
CREATE POLICY "Anyone can read anonymous observations"
  ON observations FOR SELECT
  USING (user_id IS NULL);

-- Users can insert their own observations
CREATE POLICY "Users can insert their own observations"
  ON observations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can update their own observations
CREATE POLICY "Users can update their own observations"
  ON observations FOR UPDATE
  USING (auth.uid() = user_id OR (user_id IS NULL AND auth.uid() IS NULL));

-- Users can delete their own observations
CREATE POLICY "Users can delete their own observations"
  ON observations FOR DELETE
  USING (auth.uid() = user_id OR (user_id IS NULL AND auth.uid() IS NULL));

-- RLS Policies for species_observations table
-- Users can read species observations that belong to observations they can read
CREATE POLICY "Users can read species observations for accessible observations"
  ON species_observations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM observations 
      WHERE observations.id = species_observations.observation_id 
      AND (observations.user_id = auth.uid() OR observations.user_id IS NULL)
    )
  );

-- Users can insert species observations for their own observations
CREATE POLICY "Users can insert species observations for their observations"
  ON species_observations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM observations 
      WHERE observations.id = species_observations.observation_id 
      AND (observations.user_id = auth.uid() OR observations.user_id IS NULL)
    )
  );

-- Users can update species observations for their own observations
CREATE POLICY "Users can update species observations for their observations"
  ON species_observations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM observations 
      WHERE observations.id = species_observations.observation_id 
      AND (observations.user_id = auth.uid() OR observations.user_id IS NULL)
    )
  );

-- Users can delete species observations for their own observations
CREATE POLICY "Users can delete species observations for their observations"
  ON species_observations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM observations 
      WHERE observations.id = species_observations.observation_id 
      AND (observations.user_id = auth.uid() OR observations.user_id IS NULL)
    )
  );

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on observations
CREATE TRIGGER update_observations_updated_at
  BEFORE UPDATE ON observations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
