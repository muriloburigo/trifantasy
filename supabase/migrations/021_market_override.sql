-- Manual market override: allows admins to force-open or force-close the market
-- regardless of race schedule. value = null → auto, true → force open, false → force closed.

CREATE TABLE IF NOT EXISTS public.settings (
  key        text PRIMARY KEY,
  value      jsonb,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (values are non-sensitive public state).
-- Writes are restricted to server actions using the service-role admin client.
CREATE POLICY "settings_public_read" ON public.settings
  FOR SELECT USING (true);

INSERT INTO public.settings (key, value)
VALUES ('market_override', 'null')
ON CONFLICT (key) DO NOTHING;
