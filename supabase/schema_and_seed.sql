-- ==============================================================================
-- MASTER SUPABASE SETUP SCRIPT: Portfolio Database & Storage
-- Run this in the Supabase Dashboard -> SQL Editor -> New Query
-- Authorized Admin Email: dixityash2999@gmail.com
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- ------------------------------------------------------------------------------
-- 2. CREATE TABLES
-- ------------------------------------------------------------------------------
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
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS tr_personal_info_updated_at ON personal_info;
CREATE TRIGGER tr_personal_info_updated_at
BEFORE UPDATE ON personal_info
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS about_me (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    paragraphs TEXT[] NOT NULL DEFAULT '{}',
    stats JSONB NOT NULL DEFAULT '[]'::jsonb,
    focus_areas JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS tr_about_me_updated_at ON about_me;
CREATE TRIGGER tr_about_me_updated_at
BEFORE UPDATE ON about_me
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_number TEXT NOT NULL,
    category_name TEXT NOT NULL,
    title TEXT NOT NULL,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    skills_list TEXT[] NOT NULL DEFAULT '{}',
    sort_order INT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skills_sort_order ON skills(sort_order ASC);

DROP TRIGGER IF EXISTS tr_skills_updated_at ON skills;
CREATE TRIGGER tr_skills_updated_at
BEFORE UPDATE ON skills
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_id TEXT NOT NULL,
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
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_sort_order ON projects(sort_order ASC);

DROP TRIGGER IF EXISTS tr_projects_updated_at ON projects;
CREATE TRIGGER tr_projects_updated_at
BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS hackathons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_id TEXT NOT NULL,
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
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hackathons_sort_order ON hackathons(sort_order ASC);

DROP TRIGGER IF EXISTS tr_hackathons_updated_at ON hackathons;
CREATE TRIGGER tr_hackathons_updated_at
BEFORE UPDATE ON hackathons
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_id TEXT NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    provider TEXT NOT NULL,
    date TEXT NOT NULL,
    filename TEXT NOT NULL,
    image_url TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certificates_sort_order ON certificates(sort_order ASC);

DROP TRIGGER IF EXISTS tr_certificates_updated_at ON certificates;
CREATE TRIGGER tr_certificates_updated_at
BEFORE UPDATE ON certificates
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS tr_education_updated_at ON education;
CREATE TRIGGER tr_education_updated_at
BEFORE UPDATE ON education
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------------------------
-- 3. ENABLE ROW LEVEL SECURITY (RLS) & POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE personal_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_me ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE hackathons ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE education ENABLE ROW LEVEL SECURITY;

-- Clean existing policies if re-running
DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY['personal_info', 'about_me', 'skills', 'projects', 'hackathons', 'certificates', 'education'])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Public can view %I" ON %I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Public can view published %I" ON %I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Admin can view all %I" ON %I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Admin can insert %I" ON %I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Admin can update %I" ON %I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Admin can delete %I" ON %I;', tbl, tbl);

        -- Public anonymous visitors can ONLY view published rows
        EXECUTE format('CREATE POLICY "Public can view published %I" ON %I FOR SELECT TO anon USING (is_published = TRUE);', tbl, tbl);

        -- Authenticated admin can view all rows (both published and drafts)
        EXECUTE format('CREATE POLICY "Admin can view all %I" ON %I FOR SELECT TO authenticated USING (is_admin());', tbl, tbl);

        EXECUTE format('CREATE POLICY "Admin can insert %I" ON %I FOR INSERT TO authenticated WITH CHECK (is_admin());', tbl, tbl);
        EXECUTE format('CREATE POLICY "Admin can update %I" ON %I FOR UPDATE TO authenticated USING (is_admin()) WITH CHECK (is_admin());', tbl, tbl);
        EXECUTE format('CREATE POLICY "Admin can delete %I" ON %I FOR DELETE TO authenticated USING (is_admin());', tbl, tbl);
    END LOOP;
END $$;

-- ------------------------------------------------------------------------------
-- 4. STORAGE SETUP
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'portfolio-assets',
    'portfolio-assets',
    true,
    5242880,
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

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

-- ------------------------------------------------------------------------------
-- 5. SEED DATA (Exact match to current portfolioData.js)
-- ------------------------------------------------------------------------------
INSERT INTO personal_info (
    id, name, headline, subheading, education_degree, institution, location,
    current_level, academic_period, email, github, linkedin, portfolio,
    status_text, hero_description, core_tools
) VALUES (
    1,
    'Yash Dixit',
    'Software Developer | Full-Stack Development | Cloud Enthusiast',
    'Aspiring Cloud & Software Engineer',
    'B.Tech in Computer Science and Engineering',
    'Noida Institute of Engineering and Technology (NIET)',
    'Greater Noida, India',
    'Second Year · 3rd Semester',
    '2025 — Present',
    'dixityash2999@gmail.com',
    'https://github.com/yaxit-01',
    'https://www.linkedin.com/in/yash-dixit-531922387/',
    'https://yaxit-01.github.io/yash-portfolio/',
    'AVAILABLE FOR OPPORTUNITIES',
    'Second-year Computer Science student at NIET Greater Noida passionate about building scalable web applications, robust backend architectures, and exploring cloud technologies and data structures.',
    ARRAY['Java', 'Python', 'React.js', 'Node.js', 'Docker', 'PostgreSQL', 'Linux']
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    headline = EXCLUDED.headline,
    subheading = EXCLUDED.subheading,
    education_degree = EXCLUDED.education_degree,
    institution = EXCLUDED.institution,
    location = EXCLUDED.location,
    current_level = EXCLUDED.current_level,
    academic_period = EXCLUDED.academic_period,
    email = EXCLUDED.email,
    github = EXCLUDED.github,
    linkedin = EXCLUDED.linkedin,
    portfolio = EXCLUDED.portfolio,
    status_text = EXCLUDED.status_text,
    hero_description = EXCLUDED.hero_description,
    core_tools = EXCLUDED.core_tools,
    updated_at = NOW();

INSERT INTO about_me (
    id, paragraphs, stats, focus_areas
) VALUES (
    1,
    ARRAY[
        'I''m Yash Dixit, a Computer Science and Engineering undergraduate at Noida Institute of Engineering and Technology (NIET), Greater Noida. I specialize in full-stack web development, backend engineering, and algorithmic problem solving, with a long-term goal of building scalable cloud-native systems.',
        'I believe the best way to master technology is through practical implementation. Over the course of my academic journey and competitive hackathons, I''ve designed and shipped full-stack platforms, autonomous agent workflows, and desktop database utilities using technologies like React, Node.js, Python, Java, Docker, and PostgreSQL.',
        'Currently, I am actively sharpening my Data Structures and Algorithms, deepening my understanding of system design and DevOps pipelines, and preparing for software engineering and cloud-focused roles.'
    ],
    '[
        {"value": "2nd", "label": "Academic Year"},
        {"value": "4+", "label": "Projects Built"},
        {"value": "3", "label": "Hackathons"},
        {"value": "8", "label": "Certifications"}
    ]'::jsonb,
    '[
        {
            "icon": "cloud",
            "title": "Cloud Computing",
            "description": "Cloud infrastructure, serverless architectures, and AWS/GCP essentials."
        },
        {
            "icon": "server",
            "title": "Backend Engineering",
            "description": "Designing RESTful APIs, microservices, and database query optimization."
        },
        {
            "icon": "docker",
            "title": "DevOps & Tooling",
            "description": "Docker containerization, Linux environments, Git workflows, and CI/CD."
        },
        {
            "icon": "code",
            "title": "Problem Solving",
            "description": "Data Structures & Algorithms, algorithmic complexity, and clean code practices."
        }
    ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    paragraphs = EXCLUDED.paragraphs,
    stats = EXCLUDED.stats,
    focus_areas = EXCLUDED.focus_areas,
    updated_at = NOW();

DELETE FROM skills;
INSERT INTO skills (category_number, category_name, title, is_featured, skills_list, sort_order) VALUES
('01', 'PROGRAMMING', 'Programming Languages', false, ARRAY['Java', 'Python', 'C', 'C++', 'JavaScript'], 1),
('02', 'FRONTEND', 'Frontend Development', false, ARRAY['HTML5', 'CSS3', 'JavaScript (ES6+)', 'React.js', 'Vite', 'Tailwind CSS'], 2),
('03', 'BACKEND', 'Backend Development', false, ARRAY['Node.js', 'Express.js', 'FastAPI', 'RESTful APIs', 'JWT Auth'], 3),
('04', 'DATABASES', 'Databases & Storage', false, ARRAY['MongoDB', 'PostgreSQL', 'SQL', 'Prisma ORM', 'Redis'], 4),
('05', 'CLOUD & DEVOPS', 'Cloud & Infrastructure', true, ARRAY['Docker', 'Linux (RHEL/Ubuntu)', 'Git & GitHub', 'Cloud Computing Basics', 'Vercel'], 5),
('06', 'CORE CS', 'Computer Science', false, ARRAY['Data Structures & Algorithms', 'Object-Oriented Programming (OOP)', 'DBMS', 'Computer Networks', 'Operating Systems'], 6);

DELETE FROM projects;
INSERT INTO projects (
    display_id, name, badge, tagline, problem, description,
    features, role, technologies, live_url, github_url, sort_order
) VALUES
(
    '01',
    'CareerPilot AI',
    'FEATURED AI PLATFORM',
    'Intelligent career roadmap and milestone tracking platform',
    'Navigating software engineering career transitions is overwhelming without personalized, visual milestones and concrete study guidance.',
    'A full-stack, AI-powered platform that converts target roles and career goals into step-by-step visual roadmaps. Integrates Google Gemini API for custom curriculum synthesis and React Flow for interactive graph exploration.',
    ARRAY[
        'Interactive visual roadmap dependency graph powered by React Flow',
        'Dynamic milestone generation tailored to role, availability, and background using Gemini API',
        'Actionable milestone drill-down with required study topics, tips, and practical project prompts',
        'Progress tracking (Not Started, In Progress, Completed) with browser localStorage persistence'
    ],
    'Full-Stack & AI Integration Developer',
    ARRAY['React.js', 'Vite', 'React Flow', 'Node.js', 'Express', 'Google Gemini API', 'CSS3'],
    'https://careerpilot-ai-woad-rho.vercel.app/',
    'https://github.com/yaxit-01/careerpilot-ai',
    1
),
(
    '02',
    'Paytm GrowthPilot',
    'FINTECH & MERCHANT ANALYTICS',
    'Merchant analytics & transaction automation dashboard built for Paytm Hackathon',
    'Merchants and growing businesses often lack real-time visibility into transaction volumes, customer retention patterns, and payment anomalies.',
    'A full-stack merchant intelligence platform engineered during the Paytm Hackathon. Offers real-time visibility into transactions, automated revenue insights, and anomaly alerts across high-velocity payment flows.',
    ARRAY[
        'Real-time merchant dashboard for transaction monitoring, revenue trends, and retention rates',
        'Automated growth recommendations and payment flow anomaly detection',
        'Decoupled dual-stack architecture for high responsiveness, speed, and modularity',
        'Secure RESTful APIs with JWT authentication and MongoDB data persistence'
    ],
    'Full-Stack Developer',
    ARRAY['React.js', 'Vite', 'Node.js', 'Express', 'MongoDB', 'JWT', 'REST APIs'],
    'https://paytm-growthpilot.vercel.app/',
    'https://github.com/yaxit-01/paytm-growthpilot',
    2
),
(
    '03',
    'Smart Hospital Management System',
    'HEALTHCARE DESKTOP APPLICATION',
    'Python GUI application for hospital administration, patient records, and doctor scheduling',
    'Healthcare facilities struggle with operational delays and record discrepancies caused by fragmented manual administration processes.',
    'A desktop application built with Python to streamline core hospital administration tasks. Features patient admission logging, doctor scheduling, and appointment management with persistent database storage.',
    ARRAY[
        'Intuitive Graphical User Interface (GUI) engineered for smooth administrative workflows',
        'Structured CRUD database layer for persistent patient, doctor, and appointment records',
        'JSON data handling for local configuration, data export, and fast retrieval',
        'Modular OOP architecture separating GUI components, database logic, and data models'
    ],
    'Desktop Application Developer',
    ARRAY['Python', 'Desktop GUI', 'SQLite / Database', 'JSON Handling', 'OOP'],
    NULL,
    'https://github.com/yaxit-01/smart_hospital_management_system',
    3
),
(
    '04',
    'Student Grade Calculator',
    'ACADEMIC UTILITY / ALGORITHMS',
    'Object-oriented student performance evaluation tool developed for CodSoft Internship',
    'Manually calculating cumulative academic standing across varying subjects, grade boundaries, and weightages is prone to arithmetic mistakes.',
    'A robust Java console application developed during the CodSoft Java Programming Internship. Accepts multi-subject inputs, computes exact percentages, and determines corresponding letter grades using structured evaluation criteria.',
    ARRAY[
        'Dynamic multi-subject mark ingestion with comprehensive input validation',
        'Instant computation of total marks, average percentage, and standard grade mapping (A+ to F)',
        'Modular, object-oriented design adhering to clean code principles',
        'Interactive command-line interface with formatted performance summaries'
    ],
    'Java Developer (CodSoft Internship)',
    ARRAY['Java', 'OOP', 'Data Validation', 'CLI'],
    NULL,
    'https://github.com/yaxit-01/CodSoft-Grade-Calculator',
    4
);

DELETE FROM hackathons;
INSERT INTO hackathons (
    display_id, event, team, badge, project_name, problem,
    description, contribution, technologies, github_url, live_url, sort_order
) VALUES
(
    '01',
    'Innov8 Battle Arena — IIT Delhi',
    'Team Pixel Minds',
    'IIT DELHI HACKATHON',
    'Innov8 Battle Arena Agents',
    'High-volume technical hiring processes face bottlenecks in candidate screening, resume-to-job matching, and objective qualification assessments.',
    'Collaborated with Team Pixel Minds to engineer an autonomous candidate-selection system. The platform parses job requisitions, processes applicant profiles, and executes automated assessment workflows.',
    'Developed autonomous AI agent evaluation logic, candidate matching workflows, JSON data transformations, and REST API integration verified via Pytest test suites.',
    ARRAY['Python', 'REST APIs', 'Autonomous AI Agents', 'JSON', 'Pytest', 'Git'],
    NULL,
    NULL,
    1
),
(
    '02',
    'Smart India Hackathon',
    'SIH Team',
    'NATIONAL HACKATHON',
    'KisanFlow 360',
    'Agricultural procurement operations suffer from paper-based tracking, opaque coordination between procurement centers, and delayed farmer settlements.',
    'Contributed as a full-stack system developer to KisanFlow 360, a digital workflow platform modernizing communication and logistics between farmers and agricultural procurement centers.',
    'Implemented full-stack features, designed RESTful backend endpoints, structured database schemas, and assisted with containerized deployment using Docker.',
    ARRAY['React.js', 'Node.js', 'Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Redis'],
    NULL,
    NULL,
    2
),
(
    '03',
    'Paytm Hackathon',
    'GrowthPilot Team',
    'FINTECH CHALLENGE',
    'Paytm GrowthPilot',
    'Merchants on digital payment platforms need accessible, real-time analytics to understand customer churn, revenue growth, and transaction health.',
    'Participated in the Paytm Hackathon and developed GrowthPilot, an analytics and automation solution addressing practical merchant operations.',
    'Built interactive dashboard interfaces in React and integrated backend services for merchant metrics visualization and anomaly alerts.',
    ARRAY['React.js', 'Node.js', 'Express', 'MongoDB', 'REST APIs', 'Vercel'],
    'https://github.com/yaxit-01/paytm-growthpilot',
    'https://paytm-growthpilot.vercel.app/',
    3
);

DELETE FROM certificates;
INSERT INTO certificates (
    display_id, type, title, provider, date, filename, image_url, sort_order
) VALUES
('01', 'DSA', 'Data Structures and Algorithms – I', 'iamneo', 'Course completed · May 2026', 'iamneo-dsa.png', NULL, 1),
('02', 'PROGRAMMING', 'Python Programming', 'iamneo', 'Course completed · June 2026', 'iamneo-python.png', NULL, 2),
('03', 'LINUX', 'Getting Started with Linux Fundamentals', 'Red Hat Training', 'RH104 – RHA · Version 9.1 · September 2026', 'red-hat-linux.png', NULL, 3),
('04', 'WEB DEVELOPMENT', 'JavaScript', 'Infosys Springboard', 'Course completion · November 2025', 'infosys-javascript.png', NULL, 4),
('05', 'PYTHON', 'Programming Fundamentals using Python – Part 2', 'Infosys Springboard', 'Course completion · February 2026', 'infosys-python-fundamentals.png', NULL, 5),
('06', 'CYBERSECURITY', 'Introduction to Cybersecurity', 'Cisco Networking Academy · NIET', 'Completed · February 2026', 'cisco-cybersecurity.png', NULL, 6),
('07', 'GENERATIVE AI', 'Master Generative AI & Generative AI Tools (ChatGPT & more)', 'Udemy', '14.5 hours · March 2026', 'udemy-generative-ai.png', NULL, 7),
('08', 'COMMUNICATION', 'The Complete English Grammar Course – Perfect Your English', 'Udemy', '42.5 hours · March 2026', 'udemy-english-grammar.png', NULL, 8);

INSERT INTO education (
    id, degree, major, period, institution, location,
    current_status, program, description, coursework
) VALUES (
    1,
    'Bachelor of Technology (B.Tech)',
    'Computer Science & Engineering',
    '2025 — PRESENT',
    'Noida Institute of Engineering and Technology (NIET)',
    'Greater Noida, Uttar Pradesh, India',
    '2nd Year · 3rd Semester',
    'Undergraduate Degree Program',
    'Rigorous curriculum focusing on computer science foundations, algorithm design, system architecture, database management, and hands-on software development through lab coursework and team projects.',
    ARRAY[
        'Data Structures & Algorithms',
        'Object-Oriented Programming (OOP)',
        'Database Management Systems (DBMS)',
        'Computer Organization & Architecture',
        'Operating Systems',
        'Computer Networks'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    degree = EXCLUDED.degree,
    major = EXCLUDED.major,
    period = EXCLUDED.period,
    institution = EXCLUDED.institution,
    location = EXCLUDED.location,
    current_status = EXCLUDED.current_status,
    program = EXCLUDED.program,
    description = EXCLUDED.description,
    coursework = EXCLUDED.coursework,
    updated_at = NOW();

