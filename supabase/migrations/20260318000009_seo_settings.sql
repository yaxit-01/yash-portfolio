-- ==============================================================================
-- 09. SEO MANAGEMENT & METADATA CONFIGURATION
-- Global Search Engine Optimization, Open Graph & Social Card Settings
-- ==============================================================================

-- 1. Create seo_settings table with single-row constraint
CREATE TABLE IF NOT EXISTS seo_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    site_title TEXT NOT NULL DEFAULT 'Yash Dixit | Software Developer Portfolio',
    meta_description TEXT NOT NULL DEFAULT 'Explore Yash Dixit''s software development projects, technical skills, certifications, and experience in full-stack web development, backend engineering, and cloud technologies.',
    keywords TEXT DEFAULT 'Yash Dixit, Software Developer, Full-Stack Developer, Cloud Enthusiast, React, Node.js, Python, Java, Docker, Portfolio',
    author TEXT DEFAULT 'Yash Dixit',
    canonical_url TEXT DEFAULT 'https://yaxit-01.github.io/yash-portfolio/',
    og_title TEXT DEFAULT 'Yash Dixit | Software Developer Portfolio',
    og_description TEXT DEFAULT 'Explore Yash Dixit''s software development projects, technical skills, certifications, and experience in full-stack web development, backend engineering, and cloud technologies.',
    og_image_url TEXT,
    og_type TEXT DEFAULT 'website',
    twitter_card TEXT DEFAULT 'summary_large_image',
    twitter_handle TEXT DEFAULT '@dixityash',
    theme_color TEXT DEFAULT '#08090d',
    is_published BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial default configuration row
INSERT INTO seo_settings (
    id,
    site_title,
    meta_description,
    keywords,
    author,
    canonical_url,
    og_title,
    og_description,
    og_image_url,
    og_type,
    twitter_card,
    twitter_handle,
    theme_color,
    is_published
) VALUES (
    1,
    'Yash Dixit | Software Developer Portfolio',
    'Explore Yash Dixit''s software development projects, technical skills, certifications, and experience in full-stack web development, backend engineering, and cloud technologies.',
    'Yash Dixit, Software Developer, Full-Stack Developer, Cloud Enthusiast, React, Node.js, Python, Java, Docker, Portfolio',
    'Yash Dixit',
    'https://yaxit-01.github.io/yash-portfolio/',
    'Yash Dixit | Software Developer Portfolio',
    'Explore Yash Dixit''s software development projects, technical skills, certifications, and experience in full-stack web development, backend engineering, and cloud technologies.',
    NULL,
    'website',
    'summary_large_image',
    '@dixityash',
    '#08090d',
    true
)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable Row Level Security
ALTER TABLE seo_settings ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Public can read published SEO configuration
DROP POLICY IF EXISTS "Public can view published seo_settings" ON seo_settings;
CREATE POLICY "Public can view published seo_settings"
ON seo_settings FOR SELECT
TO public
USING (is_published = true);

-- Authorized administrator has full access
DROP POLICY IF EXISTS "Admin can manage seo_settings" ON seo_settings;
CREATE POLICY "Admin can manage seo_settings"
ON seo_settings FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'dixityash2999@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'dixityash2999@gmail.com');

