-- Preserve a fully auditable market history per athlete.
-- Existing rows are backfilled with derived old/new prices and empty breakdown.

ALTER TABLE athlete_price_history
  ADD COLUMN IF NOT EXISTS old_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS new_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS context JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE athlete_price_history
SET
  old_price = COALESCE(old_price, price - change),
  new_price = COALESCE(new_price, price),
  breakdown = COALESCE(breakdown, '[]'::jsonb),
  context = COALESCE(context, '{}'::jsonb)
WHERE
  old_price IS NULL
  OR new_price IS NULL
  OR breakdown IS NULL
  OR context IS NULL;
