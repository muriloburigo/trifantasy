-- ── Market transactions: every buy and sell ─────────────────────────────────
CREATE TABLE IF NOT EXISTS market_transactions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  athlete_id   UUID        NOT NULL REFERENCES athletes(id)  ON DELETE CASCADE,
  type         TEXT        NOT NULL CHECK (type IN ('buy', 'sell')),
  price        DECIMAL(10,2) NOT NULL,
  wallet_before DECIMAL(10,2) NOT NULL,
  wallet_after  DECIMAL(10,2) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mkt_txn_user    ON market_transactions(user_id,    created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_txn_athlete ON market_transactions(athlete_id, created_at DESC);

-- ── Athlete price history: every price change ────────────────────────────────
CREATE TABLE IF NOT EXISTS athlete_price_history (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id  UUID        NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  price       DECIMAL(10,2) NOT NULL,
  change      DECIMAL(10,2) NOT NULL DEFAULT 0,
  reason      TEXT        NOT NULL DEFAULT 'manual',
  -- reason: 'reprice_pto' | 'race_result' | 'manual'
  race_id     UUID        REFERENCES races(id) ON DELETE SET NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_hist_athlete ON athlete_price_history(athlete_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_hist_race    ON athlete_price_history(race_id)    WHERE race_id IS NOT NULL;

-- ── Track when team was last saved ──────────────────────────────────────────
ALTER TABLE teams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
