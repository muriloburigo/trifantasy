-- Update initial wallet to T$100
ALTER TABLE profiles ALTER COLUMN wallet SET DEFAULT 100;

-- Reset users to the new starting budget if they are below or at old defaults
UPDATE profiles
SET wallet = 100
WHERE wallet < 100;
