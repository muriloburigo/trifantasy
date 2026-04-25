-- 1. Add photo_url to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. Setup storage for avatars (bucket creation happens via API/Console, but policies here)
-- Note: Profiles RLS is usually already handled, but let's ensure photo_url is updatable.
-- Assuming standard profiles table.

-- 3. Storage Policies (Bucket: avatars)
-- We'll assume the bucket 'avatars' is created.
-- Policy: Anyone can view avatars.
-- Policy: Authenticated users can upload their own avatar.

-- These are for reference, normally run in SQL Editor
-- CREATE POLICY "Avatars are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
