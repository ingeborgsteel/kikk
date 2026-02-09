-- Create user_locations table
CREATE TABLE IF NOT EXISTS public.user_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    lat DOUBLE PRECISION NOT NULL,
    lng DOUBLE PRECISION NOT NULL,
    uncertainty_radius INTEGER NOT NULL DEFAULT 10,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_user_locations_user_id ON public.user_locations(user_id);

-- Enable Row Level Security
ALTER TABLE public.user_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow users to view their own locations or locations with no user_id (public/local)
CREATE POLICY "Users can view their own locations"
    ON public.user_locations
    FOR SELECT
    USING (
        auth.uid() = user_id OR user_id IS NULL
    );

-- Allow users to insert their own locations
CREATE POLICY "Users can insert their own locations"
    ON public.user_locations
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id OR user_id IS NULL
    );

-- Allow users to update their own locations
CREATE POLICY "Users can update their own locations"
    ON public.user_locations
    FOR UPDATE
    USING (
        auth.uid() = user_id OR user_id IS NULL
    );

-- Allow users to delete their own locations
CREATE POLICY "Users can delete their own locations"
    ON public.user_locations
    FOR DELETE
    USING (
        auth.uid() = user_id OR user_id IS NULL
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_locations_updated_at
    BEFORE UPDATE ON public.user_locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
