ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'pt' CHECK (locale IN ('pt', 'en', 'es'));
