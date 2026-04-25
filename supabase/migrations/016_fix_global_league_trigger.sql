-- Fix: global league trigger was calling ensure_global_league(NEW.id) which
-- runs an UPDATE on leagues on every signup. Any failure there would silently
-- abort the league_members insert. Simplify: just look up the global league id
-- once and insert — no writes to leagues table inside the trigger.

-- 1. Simplified join function — read-only lookup, no side-effects
CREATE OR REPLACE FUNCTION public.join_global_league()
RETURNS trigger AS $$
DECLARE
  global_league_id uuid;
BEGIN
  SELECT id INTO global_league_id
  FROM leagues
  WHERE is_global = true
  LIMIT 1;

  IF global_league_id IS NOT NULL THEN
    INSERT INTO league_members (league_id, user_id)
    VALUES (global_league_id, NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block profile creation because of a league error
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Re-install the trigger (idempotent)
DROP TRIGGER IF EXISTS on_profile_created_join_global ON profiles;
CREATE TRIGGER on_profile_created_join_global
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.join_global_league();

-- 3. Backfill: add any existing users not yet in the global league
DO $$
DECLARE
  global_id uuid;
BEGIN
  SELECT id INTO global_id FROM leagues WHERE is_global = true LIMIT 1;
  IF global_id IS NOT NULL THEN
    INSERT INTO league_members (league_id, user_id)
    SELECT global_id, id FROM profiles
    ON CONFLICT DO NOTHING;
  END IF;
END $$;
