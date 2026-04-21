-- Add onboarding flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_seen_tour BOOLEAN DEFAULT false;
