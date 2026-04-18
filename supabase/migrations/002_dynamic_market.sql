-- Dynamic market: current price and last price change per athlete
ALTER TABLE athletes
  ADD COLUMN IF NOT EXISTS current_price numeric(5,2) DEFAULT 10,
  ADD COLUMN IF NOT EXISTS price_change  numeric(5,2) DEFAULT 0;

-- Seed current_price from race_athletes if available
UPDATE athletes a
SET current_price = sub.p
FROM (
  SELECT athlete_id, MAX(price) as p
  FROM race_athletes
  GROUP BY athlete_id
) sub
WHERE a.id = sub.athlete_id;
