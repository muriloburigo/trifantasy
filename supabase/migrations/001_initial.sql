-- TriFantasy — Initial Schema
-- Run in Supabase SQL Editor

-- ─────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────

CREATE TABLE races (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  slug         text UNIQUE NOT NULL,
  date         date NOT NULL,
  location     text NOT NULL,
  country      text NOT NULL,
  country_code char(2),
  distance     text NOT NULL CHECK (distance IN ('full', '70.3')),
  has_pro_field boolean DEFAULT false,
  status       text NOT NULL DEFAULT 'upcoming'
               CHECK (status IN ('upcoming', 'open', 'locked', 'finished')),
  image_url    text,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE athletes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  country      text,
  country_code char(2),
  club         text,
  gender       char(1) NOT NULL CHECK (gender IN ('M', 'F')),
  type         text NOT NULL CHECK (type IN ('pro', 'age_grouper')),
  age_group    text,     -- null for PROs, e.g. "M35-39"
  pto_rank     int,
  created_at   timestamptz DEFAULT now(),
  UNIQUE (name, gender, type)
);

-- Athletes registered for a specific race (with price)
CREATE TABLE race_athletes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id    uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  bib        int,
  price      numeric(6,2) NOT NULL DEFAULT 10,
  UNIQUE(race_id, athlete_id)
);

CREATE TABLE results (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id     uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  athlete_id  uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  overall_pos int,
  ag_pos      int,
  pro_pos     int,
  swim_time   int,     -- seconds
  t1_time     int,
  bike_time   int,
  t2_time     int,
  run_time    int,
  finish_time int,
  dnf         boolean DEFAULT false,
  dns         boolean DEFAULT false,
  kona_slot   boolean DEFAULT false,
  UNIQUE(race_id, athlete_id)
);

-- User profiles (extends auth.users)
CREATE TABLE profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text,
  country    text,
  is_admin   boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE teams (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  race_id    uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, race_id)
);

CREATE TABLE team_athletes (
  team_id    uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  athlete_id uuid NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  PRIMARY KEY (team_id, athlete_id)
);

CREATE TABLE scores (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id        uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE UNIQUE,
  total_points   numeric(8,2) DEFAULT 0,
  breakdown      jsonb,
  calculated_at  timestamptz DEFAULT now()
);

CREATE TABLE leagues (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  race_id     uuid NOT NULL REFERENCES races(id) ON DELETE CASCADE,
  invite_code text UNIQUE NOT NULL,
  owner_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE league_members (
  league_id  uuid NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at  timestamptz DEFAULT now(),
  PRIMARY KEY (league_id, user_id)
);

-- ─────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────

CREATE INDEX ON races(date);
CREATE INDEX ON races(status);
CREATE INDEX ON race_athletes(race_id);
CREATE INDEX ON results(race_id);
CREATE INDEX ON teams(user_id);
CREATE INDEX ON teams(race_id);
CREATE INDEX ON league_members(user_id);
CREATE INDEX ON league_members(league_id);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────

ALTER TABLE races          ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_athletes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE results        ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams          ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_athletes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores         ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues        ENABLE ROW LEVEL SECURITY;
ALTER TABLE league_members ENABLE ROW LEVEL SECURITY;

-- ── Races (public read, admin write) ──
CREATE POLICY "races_read"  ON races FOR SELECT USING (true);
CREATE POLICY "races_admin" ON races FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin)
);

-- ── Athletes (public read, admin write) ──
CREATE POLICY "athletes_read"  ON athletes FOR SELECT USING (true);
CREATE POLICY "athletes_admin" ON athletes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin)
);

-- ── Race athletes (public read, admin write) ──
CREATE POLICY "race_athletes_read"  ON race_athletes FOR SELECT USING (true);
CREATE POLICY "race_athletes_admin" ON race_athletes FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin)
);

-- ── Results (public read, admin write) ──
CREATE POLICY "results_read"  ON results FOR SELECT USING (true);
CREATE POLICY "results_admin" ON results FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin)
);

-- ── Profiles ──
CREATE POLICY "profiles_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_own"  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ── Teams ──
CREATE POLICY "teams_own_select" ON teams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "teams_own_insert" ON teams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "teams_own_update" ON teams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "teams_own_delete" ON teams FOR DELETE USING (auth.uid() = user_id);

-- ── Team athletes ──
CREATE POLICY "team_athletes_own" ON team_athletes FOR ALL USING (
  EXISTS (SELECT 1 FROM teams WHERE id = team_id AND user_id = auth.uid())
);

-- ── Scores (public read for leaderboards) ──
CREATE POLICY "scores_read"  ON scores FOR SELECT USING (true);
CREATE POLICY "scores_admin" ON scores FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin)
);

-- ── Leagues ──
CREATE POLICY "leagues_member_read" ON leagues FOR SELECT USING (
  owner_id = auth.uid()
  OR EXISTS (SELECT 1 FROM league_members WHERE league_id = id AND user_id = auth.uid())
);
CREATE POLICY "leagues_insert" ON leagues FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "leagues_owner_update" ON leagues FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "leagues_owner_delete" ON leagues FOR DELETE USING (auth.uid() = owner_id);

-- ── League members ──
CREATE POLICY "league_members_read" ON league_members FOR SELECT USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM leagues WHERE id = league_id AND owner_id = auth.uid())
);
CREATE POLICY "league_members_join"  ON league_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "league_members_leave" ON league_members FOR DELETE USING (auth.uid() = user_id);

-- ─────────────────────────────────────────
-- AUTO-CREATE PROFILE ON SIGNUP
-- ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, name)
  VALUES (new.id, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
