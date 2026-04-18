-- Add photo_url to athletes
ALTER TABLE athletes
  ADD COLUMN IF NOT EXISTS photo_url text;
