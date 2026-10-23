-- ==============================================================================
-- 05. PUBLISHING & DRAFT SUPPORT MIGRATION
-- Adds is_published column and updates RLS policies for Drafts vs Published
-- ==============================================================================

-- 1. Add is_published to all content tables with DEFAULT TRUE
-- This ensures all existing records remain published and visible.
ALTER TABLE personal_info ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE about_me ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE skills ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE hackathons ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE education ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Update Row Level Security Policies
-- Public visitors (anon) can ONLY select published items (is_published = true).
-- Authenticated admin (dixityash2999@gmail.com) can select ALL items (drafts + published).

DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['personal_info', 'about_me', 'skills', 'projects', 'hackathons', 'certificates', 'education'])
    LOOP
        -- Drop older select policies
        EXECUTE format('DROP POLICY IF EXISTS "Public can view %I" ON %I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public can view published %I" ON %I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Admin can view all %I" ON %I;', tbl, tbl);

        -- Public anonymous users only see published rows
        EXECUTE format('CREATE POLICY "Public can view published %I" ON %I FOR SELECT TO anon USING (is_published = TRUE);', tbl, tbl);

        -- Authenticated admin can view all rows (both drafts and published)
        EXECUTE format('CREATE POLICY "Admin can view all %I" ON %I FOR SELECT TO authenticated USING (is_admin());', tbl, tbl);
    END LOOP;
END $$;

