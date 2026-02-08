-- Add export tracking fields to observations table
ALTER TABLE observations 
ADD COLUMN IF NOT EXISTS last_exported_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS export_count INTEGER DEFAULT 0;

-- Create export_logs table
CREATE TABLE IF NOT EXISTS export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  exported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  observation_ids UUID[] NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT,
  observation_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on export_logs for faster queries
CREATE INDEX IF NOT EXISTS export_logs_user_id_idx ON export_logs(user_id);
CREATE INDEX IF NOT EXISTS export_logs_exported_at_idx ON export_logs(exported_at DESC);

-- Create storage bucket for exports
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', false)
ON CONFLICT (id) DO NOTHING;

-- RLS (Row Level Security) policies for export_logs
ALTER TABLE export_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own export logs
CREATE POLICY "Users can view own export logs"
  ON export_logs
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR user_id IS NULL
  );

-- Policy: Users can insert their own export logs
CREATE POLICY "Users can insert own export logs"
  ON export_logs
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR user_id IS NULL
  );

-- Storage policies for exports bucket
-- Policy: Users can view their own exports or anonymous exports
CREATE POLICY "Users can view own exports"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'exports'
    AND (
      auth.uid()::text = split_part(name, '/', 1)
      OR split_part(name, '/', 1) = 'anonymous'
    )
  );

-- Policy: Users can upload their own exports
CREATE POLICY "Users can upload own exports"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'exports'
    AND (
      auth.uid()::text = split_part(name, '/', 1)
      OR split_part(name, '/', 1) = 'anonymous'
    )
  );

-- Policy: Users can delete their own exports
CREATE POLICY "Users can delete own exports"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'exports'
    AND auth.uid()::text = split_part(name, '/', 1)
  );

-- Function to increment export count (used by markObservationsAsExported)
CREATE OR REPLACE FUNCTION increment_export_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.last_exported_at IS DISTINCT FROM OLD.last_exported_at THEN
    NEW.export_count := COALESCE(OLD.export_count, 0) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically increment export_count when last_exported_at is updated
CREATE TRIGGER increment_export_count_trigger
  BEFORE UPDATE ON observations
  FOR EACH ROW
  EXECUTE FUNCTION increment_export_count();
