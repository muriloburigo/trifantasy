-- Enforce a 5-athlete roster and sync portfolio -> teams automatically.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS wallet DECIMAL(10,2) NOT NULL DEFAULT 70;

ALTER TABLE profiles
  ALTER COLUMN wallet SET DEFAULT 70;

UPDATE profiles
SET wallet = 70
WHERE wallet IS NULL;

CREATE OR REPLACE FUNCTION public.sync_portfolio_team_for_user(target_user UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  synced_team_id UUID;
BEGIN
  IF target_user IS NULL OR to_regclass('public.portfolio') IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO teams (user_id, updated_at)
  VALUES (target_user, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET updated_at = EXCLUDED.updated_at
  RETURNING id INTO synced_team_id;

  DELETE FROM team_athletes
  WHERE team_id = synced_team_id;

  INSERT INTO team_athletes (team_id, athlete_id)
  SELECT synced_team_id, p.athlete_id
  FROM portfolio p
  WHERE p.user_id = target_user
  ORDER BY p.created_at ASC, p.athlete_id ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_portfolio_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  athlete_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO athlete_count
  FROM portfolio
  WHERE user_id = NEW.user_id;

  IF athlete_count >= 5 THEN
    RAISE EXCEPTION 'Roster limit reached. Sell an athlete before buying another.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_portfolio_team_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.sync_portfolio_team_for_user(OLD.user_id);
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    PERFORM public.sync_portfolio_team_for_user(OLD.user_id);
  END IF;

  PERFORM public.sync_portfolio_team_for_user(NEW.user_id);
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.portfolio') IS NULL THEN
    RETURN;
  END IF;

  DROP TRIGGER IF EXISTS portfolio_limit_guard ON portfolio;
  CREATE TRIGGER portfolio_limit_guard
    BEFORE INSERT ON portfolio
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_portfolio_limit();

  DROP TRIGGER IF EXISTS portfolio_sync_team ON portfolio;
  CREATE TRIGGER portfolio_sync_team
    AFTER INSERT OR UPDATE OR DELETE ON portfolio
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_portfolio_team_trigger();
END $$;

DO $$
DECLARE
  roster_user UUID;
BEGIN
  IF to_regclass('public.portfolio') IS NULL THEN
    RETURN;
  END IF;

  FOR roster_user IN
    SELECT DISTINCT user_id
    FROM portfolio
  LOOP
    PERFORM public.sync_portfolio_team_for_user(roster_user);
  END LOOP;
END $$;
