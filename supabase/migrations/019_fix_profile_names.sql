-- 1. Ensure photo_url exists (idempotent — migration 015 may not have run)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. Backfill profiles.name from auth.users where it is null or empty
UPDATE profiles p
SET name = COALESCE(
  NULLIF(TRIM(au.raw_user_meta_data->>'name'), ''),
  NULLIF(TRIM(au.raw_user_meta_data->>'full_name'), ''),
  SPLIT_PART(au.email, '@', 1)
)
FROM auth.users au
WHERE au.id = p.id
  AND (p.name IS NULL OR TRIM(p.name) = '');

-- 3. Update handle_new_user trigger to fall back to email prefix if name missing
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, name)
  VALUES (
    new.id,
    COALESCE(
      NULLIF(TRIM(new.raw_user_meta_data->>'name'), ''),
      NULLIF(TRIM(new.raw_user_meta_data->>'full_name'), ''),
      SPLIT_PART(new.email, '@', 1)
    )
  );
  RETURN new;
END;
$$;
