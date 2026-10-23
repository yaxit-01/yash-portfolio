-- ==============================================================================
-- 07. STORAGE BUCKET CONFIGURATION UPDATE
-- Portfolio Asset Storage: Add PDF Support and Update File Size Limit
-- ==============================================================================

-- 1. Update existing portfolio-assets bucket configuration
-- Adds 'application/pdf' to allowed MIME types for credentials and portfolio documents.
-- Sets file size limit to 10 MB (10485760 bytes).
UPDATE storage.buckets
SET
    file_size_limit = 10485760, -- 10 MB
    allowed_mime_types = ARRAY[
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/svg+xml',
        'application/pdf'
    ]
WHERE id = 'portfolio-assets';

-- If the bucket was not yet initialized in the local environment, insert it cleanly
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'portfolio-assets',
    'portfolio-assets',
    true,
    10485760, -- 10 MB
    ARRAY[
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/svg+xml',
        'application/pdf'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY[
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/webp',
        'image/svg+xml',
        'application/pdf'
    ];

-- 2. Ensure existing RLS policies on storage.objects are preserved
-- (Public can view; Only authorized administrator 'dixityash2999@gmail.com' can insert, update, or delete)
DROP POLICY IF EXISTS "Public can view portfolio-assets" ON storage.objects;
CREATE POLICY "Public can view portfolio-assets"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'portfolio-assets');

DROP POLICY IF EXISTS "Admin can upload to portfolio-assets" ON storage.objects;
CREATE POLICY "Admin can upload to portfolio-assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'portfolio-assets' AND
    auth.jwt() ->> 'email' = 'dixityash2999@gmail.com'
);

DROP POLICY IF EXISTS "Admin can update files in portfolio-assets" ON storage.objects;
CREATE POLICY "Admin can update files in portfolio-assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'portfolio-assets' AND
    auth.jwt() ->> 'email' = 'dixityash2999@gmail.com'
);

DROP POLICY IF EXISTS "Admin can delete files in portfolio-assets" ON storage.objects;
CREATE POLICY "Admin can delete files in portfolio-assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'portfolio-assets' AND
    auth.jwt() ->> 'email' = 'dixityash2999@gmail.com'
);

