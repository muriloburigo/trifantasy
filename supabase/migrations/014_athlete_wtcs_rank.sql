-- Add WTCS rank column to athletes
ALTER TABLE athletes ADD COLUMN IF NOT EXISTS wtcs_rank INTEGER;
