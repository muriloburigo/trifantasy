-- Make the global league self-healing and ensure every profile is represented.

CREATE OR REPLACE FUNCTION public.ensure_global_league(owner_profile_id uuid DEFAULT NULL)
RETURNS uuid AS $$
DECLARE
  global_league_id uuid;
  fallback_owner_id uuid;
BEGIN
  SELECT id INTO global_league_id
  FROM leagues
  WHERE is_global = true
  LIMIT 1;

  IF global_league_id IS NOT NULL THEN
    UPDATE leagues
    SET is_public = true, invite_code = 'GLOBAL'
    WHERE id = global_league_id;

    RETURN global_league_id;
  END IF;

  fallback_owner_id := owner_profile_id;

  IF fallback_owner_id IS NULL THEN
    SELECT id INTO fallback_owner_id
    FROM profiles
    ORDER BY is_admin DESC, created_at ASC
    LIMIT 1;
  END IF;

  IF fallback_owner_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO leagues (name, invite_code, owner_id, is_public, is_global)
  VALUES ('Liga Global Trixer', 'GLOBAL', fallback_owner_id, true, true)
  ON CONFLICT (invite_code) DO UPDATE
    SET is_public = true, is_global = true
  RETURNING id INTO global_league_id;

  RETURN global_league_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.join_global_league()
RETURNS trigger AS $$
DECLARE
  global_league_id uuid;
BEGIN
  global_league_id := public.ensure_global_league(NEW.id);

  IF global_league_id IS NOT NULL THEN
    INSERT INTO league_members (league_id, user_id)
    VALUES (global_league_id, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_profile_created_join_global ON profiles;
CREATE TRIGGER on_profile_created_join_global
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.join_global_league();

DO $$
DECLARE
  global_league_id uuid;
BEGIN
  global_league_id := public.ensure_global_league();

  IF global_league_id IS NOT NULL THEN
    INSERT INTO league_members (league_id, user_id)
    SELECT global_league_id, id
    FROM profiles
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
