-- ==============================================================================
-- 02. ROW LEVEL SECURITY (RLS) POLICIES
-- Portfolio Database Access Controls
-- ==============================================================================

-- 1. Helper function: verify if current request is from authorized admin email
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT (
    auth.role() = 'authenticated' AND
    auth.jwt() ->> 'email' = 'dixityash2999@gmail.com'
  );
$$;

-- 2. Enable Row Level Security on all tables
ALTER TABLE personal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_me ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- POLICIES: personal_info
-- ==============================================================================
CREATE POLICY "Public can view personal_info"
ON personal_info FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admin can insert personal_info"
ON personal_info FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admin can update personal_info"
ON personal_info FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admin can delete personal_info"
ON personal_info FOR DELETE
TO authenticated
USING (is_admin());

-- ==============================================================================
-- POLICIES: about_me
-- ==============================================================================
CREATE POLICY "Public can view about_me"
ON about_me FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admin can insert about_me"
ON about_me FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admin can update about_me"
ON about_me FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admin can delete about_me"
ON about_me FOR DELETE
TO authenticated
USING (is_admin());

-- ==============================================================================
-- POLICIES: skills
-- ==============================================================================
CREATE POLICY "Public can view skills"
ON skills FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admin can insert skills"
ON skills FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admin can update skills"
ON skills FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admin can delete skills"
ON skills FOR DELETE
TO authenticated
USING (is_admin());

-- ==============================================================================
-- POLICIES: projects
-- ==============================================================================
CREATE POLICY "Public can view projects"
ON projects FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admin can insert projects"
ON projects FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admin can update projects"
ON projects FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admin can delete projects"
ON projects FOR DELETE
TO authenticated
USING (is_admin());

-- ==============================================================================
-- POLICIES: hackathons
-- ==============================================================================
CREATE POLICY "Public can view hackathons"
ON hackathons FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admin can insert hackathons"
ON hackathons FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admin can update hackathons"
ON hackathons FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admin can delete hackathons"
ON hackathons FOR DELETE
TO authenticated
USING (is_admin());

-- ==============================================================================
-- POLICIES: certificates
-- ==============================================================================
CREATE POLICY "Public can view certificates"
ON certificates FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admin can insert certificates"
ON certificates FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admin can update certificates"
ON certificates FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admin can delete certificates"
ON certificates FOR DELETE
TO authenticated
USING (is_admin());

-- ==============================================================================
-- POLICIES: education
-- ==============================================================================
CREATE POLICY "Public can view education"
ON education FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admin can insert education"
ON education FOR INSERT
TO authenticated
WITH CHECK (is_admin());

CREATE POLICY "Admin can update education"
ON education FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Admin can delete education"
ON education FOR DELETE
TO authenticated
USING (is_admin());

