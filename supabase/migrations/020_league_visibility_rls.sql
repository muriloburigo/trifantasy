-- Allow public read for public leagues
CREATE POLICY "leagues_public_read" ON leagues FOR SELECT USING (is_public = true);

-- Allow members to see other members of the same league
CREATE POLICY "league_members_same_league_read" ON league_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM league_members AS m 
    WHERE m.league_id = league_members.league_id 
    AND m.user_id = auth.uid()
  )
);
