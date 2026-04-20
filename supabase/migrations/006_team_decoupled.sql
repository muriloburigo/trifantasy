-- ── Decouple teams from races ────────────────────────────────────────────────
-- Teams are now global per user (not per race).
-- Scores gain a race_id to preserve the race context.

-- Step 1: Add race_id to scores, backfill from teams.race_id
ALTER TABLE scores ADD COLUMN IF NOT EXISTS race_id UUID REFERENCES races(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'teams'
      AND column_name = 'race_id'
  ) THEN
    UPDATE scores s
    SET race_id = t.race_id
    FROM teams t
    WHERE s.team_id = t.id
      AND s.race_id IS NULL;
  END IF;
END $$;

-- Step 2: Change scores unique constraint from team_id → (team_id, race_id)
ALTER TABLE scores DROP CONSTRAINT IF EXISTS scores_team_id_key;
ALTER TABLE scores ADD CONSTRAINT scores_team_race_key UNIQUE (team_id, race_id);

-- Step 3: Deduplicate teams — keep the most recently updated team per user.
-- First, reassign scores from teams that will be deleted to the survivor.
UPDATE scores s
SET team_id = keep.id
FROM (
  SELECT DISTINCT ON (user_id) id, user_id
  FROM teams
  ORDER BY user_id, updated_at DESC NULLS LAST, id DESC
) keep
JOIN teams del ON del.user_id = keep.user_id AND del.id != keep.id
WHERE s.team_id = del.id
  AND NOT EXISTS (
    SELECT 1 FROM scores s2
    WHERE s2.team_id = keep.id AND s2.race_id = s.race_id
  );

-- Delete duplicate (non-latest) teams; team_athletes cascade automatically
DELETE FROM teams del
WHERE EXISTS (
  SELECT 1 FROM teams newer
  WHERE newer.user_id = del.user_id
    AND (
      newer.updated_at > del.updated_at
      OR (newer.updated_at = del.updated_at AND newer.id > del.id)
    )
);

-- Step 4: Remove race_id from teams, enforce one team per user
ALTER TABLE teams DROP CONSTRAINT IF EXISTS teams_user_id_race_id_key;
ALTER TABLE teams DROP COLUMN IF EXISTS race_id;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'teams_user_id_key'
      AND conrelid = 'public.teams'::regclass
  ) THEN
    ALTER TABLE teams ADD CONSTRAINT teams_user_id_key UNIQUE (user_id);
  END IF;
END $$;
