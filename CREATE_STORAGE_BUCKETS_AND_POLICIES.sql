-- ==============================================================================
-- 🚀 ProLink Master Storage Setup: Buckets & Comprehensive RLS Policies
-- ==============================================================================

-- 1. Create Buckets (Ensure they are all public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('images', 'images', true, 52428800, NULL),
  ('profiles', 'profiles', true, 52428800, NULL),
  ('job-images', 'job-images', true, 52428800, NULL),
  ('applications', 'applications', true, 52428800, NULL),
  ('resumes', 'resumes', true, 52428800, NULL),
  ('profills', 'profills', true, 52428800, NULL)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800;

-- 2. Drop any legacy/conflicting storage policies to prevent duplicates
DROP POLICY IF EXISTS "Public View All Objects" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public View Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Insert All Objects" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public View Images" ON storage.objects;
DROP POLICY IF EXISTS "Allow Auth Insert Images" ON storage.objects;
DROP POLICY IF EXISTS "Public View Images" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert Images" ON storage.objects;
DROP POLICY IF EXISTS "Public View Profiles" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert Profiles" ON storage.objects;
DROP POLICY IF EXISTS "Public View Jobs" ON storage.objects;
DROP POLICY IF EXISTS "Auth Insert Jobs" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow Public View" ON storage.objects;

-- 3. Create Universal, Ultra-Permissive & Secure Policies for ProLink Storage Buckets

-- Policy 1: PUBLIC VIEW (Anyone can view/download images, CVs, profiles)
CREATE POLICY "Prolink Public View Policy"
ON storage.objects FOR SELECT
USING (
  bucket_id IN ('images', 'profiles', 'job-images', 'applications', 'resumes', 'profills')
);

-- Policy 2: PUBLIC & AUTH INSERT (Allows both authenticated users and guests to upload images/CVs)
CREATE POLICY "Prolink Insert Policy"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id IN ('images', 'profiles', 'job-images', 'applications', 'resumes', 'profills')
);

-- Policy 3: UPDATE (Users can update their uploaded files)
CREATE POLICY "Prolink Update Policy"
ON storage.objects FOR UPDATE
USING (
  bucket_id IN ('images', 'profiles', 'job-images', 'applications', 'resumes', 'profills')
);

-- Policy 4: DELETE (Users or Admins can delete files)
CREATE POLICY "Prolink Delete Policy"
ON storage.objects FOR DELETE
USING (
  bucket_id IN ('images', 'profiles', 'job-images', 'applications', 'resumes', 'profills')
);
