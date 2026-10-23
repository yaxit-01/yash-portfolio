-- ==============================================================================
-- 03. STORAGE BUCKET & STORAGE POLICIES
-- Portfolio Asset Storage for Certificates and Images
-- ==============================================================================

-- 1. Create public storage bucket for portfolio assets (certificates, badges, avatars)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'portfolio-assets',
    'portfolio-assets',
    true,
    5242880, -- 5 MB limit
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Policies on storage.objects

-- Allow public anonymous read access to everything in 'portfolio-assets'
DROP POLICY IF EXISTS "Public can view portfolio-assets" ON storage.objects;
CREATE POLICY "Public can view portfolio-assets"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'portfolio-assets');

-- Allow only the authorized admin to upload files to 'portfolio-assets'
DROP POLICY IF EXISTS "Admin can upload to portfolio-assets" ON storage.objects;
CREATE POLICY "Admin can upload to portfolio-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'portfolio-assets' AND
    auth.jwt() ->> 'email' = 'dixityash2999@gmail.com'
);

-- Allow only the authorized admin to update files in 'portfolio-assets'
DROP POLICY IF EXISTS "Admin can update files in portfolio-assets" ON storage.objects;
CREATE POLICY "Admin can update files in portfolio-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'portfolio-assets' AND
    auth.jwt() ->> 'email' = 'dixityash2999@gmail.com'
);

-- Allow only the authorized admin to delete files in 'portfolio-assets'
DROP POLICY IF EXISTS "Admin can delete files in portfolio-assets" ON storage.objects;
CREATE POLICY "Admin can delete files in portfolio-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'portfolio-assets' AND
    auth.jwt() ->> 'email' = 'dixityash2999@gmail.com'
);

