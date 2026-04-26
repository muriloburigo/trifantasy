-- Fix Storage Policies for Avatars
-- Target: bucket 'avatars'

-- 1. Ensure bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Policy: Public Access to Avatars
CREATE POLICY "Avatar Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 3. Policy: Authenticated users can upload their own avatar
-- The path must start with their user ID: 'user_id/filename.ext'
CREATE POLICY "Avatar User Insert"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy: Authenticated users can update their own avatar
CREATE POLICY "Avatar User Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: Authenticated users can delete their own avatar
CREATE POLICY "Avatar User Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
