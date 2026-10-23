-- ==============================================================================
-- 10. CONTACT MESSAGE MANAGEMENT & SUBMISSION
-- Public submission and authenticated admin inbox
-- ==============================================================================

-- 1. Create contact_messages table
CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_name TEXT NOT NULL CHECK (char_length(trim(sender_name)) >= 2 AND char_length(sender_name) <= 100),
    sender_email TEXT NOT NULL CHECK (char_length(trim(sender_email)) >= 5 AND char_length(sender_email) <= 150 AND sender_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    subject TEXT NOT NULL CHECK (char_length(trim(subject)) >= 2 AND char_length(subject) <= 200),
    message TEXT NOT NULL CHECK (char_length(trim(message)) >= 5 AND char_length(message) <= 3000),
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'READ', 'REPLIED', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient ordering and status filtering
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);

-- 2. Enable Row Level Security
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Public / anon visitors can ONLY insert messages with 'NEW' status
DROP POLICY IF EXISTS "Public can insert contact messages" ON contact_messages;
CREATE POLICY "Public can insert contact messages"
ON contact_messages FOR INSERT
TO anon, authenticated
WITH CHECK (
    status = 'NEW' AND
    char_length(trim(sender_name)) >= 2 AND
    char_length(trim(sender_email)) >= 5 AND
    char_length(trim(subject)) >= 2 AND
    char_length(trim(message)) >= 5
);

-- Public / anon users CANNOT view or query any contact messages (0 select access)
DROP POLICY IF EXISTS "Public cannot select contact messages" ON contact_messages;

-- Authorized administrator has full access to read, update status, and manage messages
DROP POLICY IF EXISTS "Admin can manage contact messages" ON contact_messages;
CREATE POLICY "Admin can manage contact messages"
ON contact_messages FOR ALL
TO authenticated
USING (auth.jwt() ->> 'email' = 'dixityash2999@gmail.com')
WITH CHECK (auth.jwt() ->> 'email' = 'dixityash2999@gmail.com');
