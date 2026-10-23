-- ==============================================================================
-- 01. SCHEMA MIGRATION: Core Tables, Indexes & Updated_At Trigger
-- Portfolio Management Database
-- ==============================================================================

-- 1. Create automatic updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Table: personal_info (Singleton: strictly 1 row for profile & hero metadata)
CREATE TABLE IF NOT EXISTS personal_info (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    name TEXT NOT NULL,
    headline TEXT NOT NULL,
    subheading TEXT NOT NULL,
    education_degree TEXT NOT NULL,
    institution TEXT NOT NULL,
    location TEXT NOT NULL,
    current_level TEXT NOT NULL,
    academic_period TEXT NOT NULL,
    email TEXT NOT NULL,
    github TEXT NOT NULL,
    linkedin TEXT NOT NULL,
    portfolio TEXT NOT NULL,
    status_text TEXT NOT NULL,
    hero_description TEXT NOT NULL,
    core_tools TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS tr_personal_info_updated_at ON personal_info;
CREATE TRIGGER tr_personal_info_updated_at
BEFORE UPDATE ON personal_info
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Table: about_me (Singleton: bio paragraphs, stats & engineering focus areas)
CREATE TABLE IF NOT EXISTS about_me (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    paragraphs TEXT[] NOT NULL DEFAULT '{}',
    stats JSONB NOT NULL DEFAULT '[]'::jsonb,
    focus_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS tr_about_me_updated_at ON about_me;
CREATE TRIGGER tr_about_me_updated_at
BEFORE UPDATE ON about_me
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. Table: skills (Categorized skills with sorting and featured flag)
CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_number TEXT NOT NULL,          -- e.g. '01', '02'
    category_name TEXT NOT NULL,            -- e.g. 'PROGRAMMING', 'FRONTEND'
    title TEXT NOT NULL,                    -- e.g. 'Programming Languages'
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    skills_list TEXT[] NOT NULL DEFAULT '{}',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skills_sort_order ON skills(sort_order ASC);

DROP TRIGGER IF EXISTS tr_skills_updated_at ON skills;
CREATE TRIGGER tr_skills_updated_at
BEFORE UPDATE ON skills
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Table: projects (Selected portfolio projects)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_id TEXT NOT NULL,               -- e.g. '01', '02'
    name TEXT NOT NULL,
    badge TEXT NOT NULL,
    tagline TEXT NOT NULL,
    problem TEXT NOT NULL,
    description TEXT NOT NULL,
    features TEXT[] NOT NULL DEFAULT '{}',
    role TEXT NOT NULL,
    technologies TEXT[] NOT NULL DEFAULT '{}',
    live_url TEXT,
    github_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_sort_order ON projects(sort_order ASC);

DROP TRIGGER IF EXISTS tr_projects_updated_at ON projects;
CREATE TRIGGER tr_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Table: hackathons (Hackathons and team challenges)
CREATE TABLE IF NOT EXISTS hackathons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_id TEXT NOT NULL,               -- e.g. '01', '02'
    event TEXT NOT NULL,
    team TEXT NOT NULL,
    badge TEXT NOT NULL,
    project_name TEXT NOT NULL,
    problem TEXT NOT NULL,
    description TEXT NOT NULL,
    contribution TEXT NOT NULL,
    technologies TEXT[] NOT NULL DEFAULT '{}',
    github_url TEXT,
    live_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hackathons_sort_order ON hackathons(sort_order ASC);

DROP TRIGGER IF EXISTS tr_hackathons_updated_at ON hackathons;
CREATE TRIGGER tr_hackathons_updated_at
BEFORE UPDATE ON hackathons
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Table: certificates (Credentials with local filename and remote URL support)
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_id TEXT NOT NULL,               -- e.g. '01', '02'
    type TEXT NOT NULL,                     -- e.g. 'DSA', 'LINUX'
    title TEXT NOT NULL,
    provider TEXT NOT NULL,
    date TEXT NOT NULL,
    filename TEXT NOT NULL,                 -- e.g. 'iamneo-dsa.png' (local asset fallback)
    image_url TEXT,                         -- Full CDN URL from Supabase Storage
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificates_sort_order ON certificates(sort_order ASC);

DROP TRIGGER IF EXISTS tr_certificates_updated_at ON certificates;
CREATE TRIGGER tr_certificates_updated_at
BEFORE UPDATE ON certificates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Table: education (Singleton: academic background & coursework)
CREATE TABLE IF NOT EXISTS education (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    degree TEXT NOT NULL,
    major TEXT NOT NULL,
    period TEXT NOT NULL,
    institution TEXT NOT NULL,
    location TEXT NOT NULL,
    current_status TEXT NOT NULL,
    program TEXT NOT NULL,
    description TEXT NOT NULL,
    coursework TEXT[] NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS tr_education_updated_at ON education;
CREATE TRIGGER tr_education_updated_at
BEFORE UPDATE ON education
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

