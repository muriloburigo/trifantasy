-- Update initial wallet to T$100 for all users
ALTER TABLE profiles ALTER COLUMN wallet SET DEFAULT 100;

-- Reset EVERYONE to 100 for the official start
UPDATE profiles SET wallet = 100;

-- Clear any pre-game test transactions and rosters
DELETE FROM portfolio;
DELETE FROM market_transactions;
