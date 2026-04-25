-- Push notification subscriptions (one per browser/device per user)
CREATE TABLE push_subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint   text NOT NULL UNIQUE,
  p256dh     text NOT NULL,
  auth       text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON push_subscriptions(user_id);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_sub_owner" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- Dedup log: avoid sending the same notification twice
-- ref_id is context-specific (race_id, athlete_id, etc.)
CREATE TABLE push_notification_log (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type    text NOT NULL,
  ref_id  text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  UNIQUE(user_id, type, ref_id)
);
CREATE INDEX ON push_notification_log(user_id, type);
ALTER TABLE push_notification_log ENABLE ROW LEVEL SECURITY;
-- Only service role can write; no user read needed
CREATE POLICY "push_log_service" ON push_notification_log FOR ALL USING (false);
