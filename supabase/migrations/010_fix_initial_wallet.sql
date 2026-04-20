-- Update initial wallet to T$60
ALTER TABLE profiles ALTER COLUMN wallet SET DEFAULT 60;

-- For users that haven't spent anything or are still at the old default, reset to 60
UPDATE profiles
SET wallet = 60
WHERE wallet >= 70;
