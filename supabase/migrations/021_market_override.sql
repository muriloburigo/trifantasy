-- Manual market override: allows admins to force-open or force-close the market
-- regardless of race schedule. value = null → auto, true → force open, false → force closed.

CREATE TABLE IF NOT EXISTS public.settings (
  key        text PRIMARY KEY,
  value      jsonb,
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Service role has full access; regular users have no access via RLS.
-- (All writes come from server actions using the admin client.)

INSERT INTO public.settings (key, value)
VALUES ('market_override', 'null')
ON CONFLICT (key) DO NOTHING;
