-- ==============================================================================
-- 08. ACTIVITY LOGGING & AUDIT TRAIL
-- Genuine Administrative Action History
-- ==============================================================================

-- 1. Create activity_logs table for tracking genuine administrative operations
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type TEXT NOT NULL,         -- 'CREATE', 'UPDATE', 'DELETE', 'PUBLISH', 'UNPUBLISH', 'UPLOAD', 'DELETE_MEDIA'
    content_type TEXT NOT NULL,        -- 'projects', 'certificates', 'hackathons', 'skills', 'education', 'personal_info', 'about_me', 'media'
    record_id TEXT,                    -- Identifier of affected item (UUID, string id, or file path)
    record_title TEXT NOT NULL,        -- Human-readable label / headline
    admin_email TEXT NOT NULL,         -- Authenticated administrator email
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- Contextual data (e.g. fields modified, file size)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient timeline querying and filtering
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_content_type ON activity_logs(content_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action_type ON activity_logs(action_type);

-- 2. Enable Row Level Security
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Public / anon users have NO access to administrative logs
DROP POLICY IF EXISTS "Public cannot access activity logs" ON activity_logs;

-- Authorized administrator can read activity logs
DROP POLICY IF EXISTS "Admin can view activity logs" ON activity_logs;
CREATE POLICY "Admin can view activity logs"
ON activity_logs FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' = 'dixityash2999@gmail.com');

-- Authorized administrator can record new activity entries with verified email
DROP POLICY IF EXISTS "Admin can insert activity logs" ON activity_logs;
CREATE POLICY "Admin can insert activity logs"
ON activity_logs FOR INSERT
TO authenticated
WITH CHECK (
    auth.jwt() ->> 'email' = 'dixityash2999@gmail.com' AND
    admin_email = auth.jwt() ->> 'email'
);

-- Note: No UPDATE or DELETE policies are granted, ensuring activity records
-- remain immutable and tampering-proof.

