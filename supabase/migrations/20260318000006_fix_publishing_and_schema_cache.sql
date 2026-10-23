-- ==============================================================================
-- 06. COMPREHENSIVE PUBLISHING, RLS HARDENING & SCHEMA CACHE RELOAD
-- Non-destructive migration to fix HTTP 400 Bad Request on is_published
-- ==============================================================================

-- 1. Ensure is_admin() function handles case-insensitive email comparison
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT (
    auth.role() = 'authenticated' AND
    LOWER(COALESCE(auth.jwt() ->> 'email', '')) = 'dixityash2999@gmail.com'
  );
$$;

-- 2. Non-destructively add `is_published` column with DEFAULT TRUE to all 7 content tables
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE about_me ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE education ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;

-- 3. Ensure all existing rows have is_published = TRUE (preserving existing public portfolio)
UPDATE personal_info SET is_published = TRUE WHERE is_published IS NULL;
UPDATE about_me SET is_published = TRUE WHERE is_published IS NULL;
UPDATE skills SET is_published = TRUE WHERE is_published IS NULL;
UPDATE projects SET is_published = TRUE WHERE is_published IS NULL;
UPDATE hackathons SET is_published = TRUE WHERE is_published IS NULL;
UPDATE certificates SET is_published = TRUE WHERE is_published IS NULL;
UPDATE education SET is_published = TRUE WHERE is_published IS NULL;

-- 4. Create performance indexes for filtering published items
CREATE INDEX IF NOT EXISTS idx_projects_is_published ON projects(is_published);
CREATE INDEX IF NOT EXISTS idx_certificates_is_published ON certificates(is_published);
CREATE INDEX IF NOT EXISTS idx_hackathons_is_published ON hackathons(is_published);
CREATE INDEX IF NOT EXISTS idx_skills_is_published ON skills(is_published);

-- 5. Harden and update Row Level Security (RLS) policies for Drafts vs Published
DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['personal_info', 'about_me', 'skills', 'projects', 'hackathons', 'certificates', 'education'])
    LOOP
        -- Enable RLS (idempotent)
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);

        -- Clean up existing SELECT policies
        EXECUTE format('DROP POLICY IF EXISTS "Public can view %I" ON %I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public can view published %I" ON %I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Admin can view all %I" ON %I;', tbl, tbl);

        -- Policy 1: Anonymous public visitors can ONLY view published items
        EXECUTE format('CREATE POLICY "Public can view published %I" ON %I FOR SELECT TO anon USING (is_published = TRUE);', tbl, tbl);

        -- Policy 2: Authenticated administrator can view ALL items (both drafts and published)
        EXECUTE format('CREATE POLICY "Admin can view all %I" ON %I FOR SELECT TO authenticated USING (is_admin());', tbl, tbl);

        -- Recreate Write Policies (INSERT, UPDATE, DELETE) strictly for authorized admin
        EXECUTE format('DROP POLICY IF EXISTS "Admin can insert %I" ON %I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Admin can update %I" ON %I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Admin can delete %I" ON %I;', tbl, tbl);

        EXECUTE format('CREATE POLICY "Admin can insert %I" ON %I FOR INSERT TO authenticated WITH CHECK (is_admin());', tbl, tbl);
        EXECUTE format('CREATE POLICY "Admin can update %I" ON %I FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());', tbl, tbl);
        EXECUTE format('CREATE POLICY "Admin can delete %I" ON %I FOR DELETE TO authenticated USING (is_admin());', tbl, tbl);
    END LOOP;
END $$;

-- 6. Reload PostgREST schema cache immediately
NOTIFY pgrst, 'reload schema';

