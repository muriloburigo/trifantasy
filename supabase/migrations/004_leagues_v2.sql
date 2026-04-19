-- League v2: remove race dependency, add public/private visibility
ALTER TABLE leagues ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;
ALTER TABLE leagues ALTER COLUMN race_id DROP NOT NULL;
