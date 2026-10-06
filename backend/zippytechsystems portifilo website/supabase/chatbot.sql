-- =========================================================================
-- ZippyTechSystems Pvt. Ltd. — AI Chatbot & Customer Enquiries Schema
-- =========================================================================
-- Features:
-- 1. Service areas table (with placeholder seed)
-- 2. Business info extensions to public.settings (empty defaults)
-- 3. Chat sessions & chat messages tables with indexing
-- 4. Chatbot settings table with admin-only sensitive fields
-- 5. Secure public view public.chatbot_public (for anon client)
-- 6. Enquiries table source constraint update to include 'chatbot'
-- 7. Strict Row Level Security (RLS) policies
-- =========================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. SERVICE AREAS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    notes TEXT DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed one placeholder row (clearly marked for admin update)
INSERT INTO public.service_areas (name, notes, sort_order, is_active)
SELECT 
    'Online (all India)', 
    'Placeholder: Please add your real operating locations and cities from the Admin Panel.',
    0,
    true
WHERE NOT EXISTS (
    SELECT 1 FROM public.service_areas WHERE name = 'Online (all India)'
);

-- -------------------------------------------------------------------------
-- 2. EXTEND SETTINGS TABLE WITH BUSINESS INFO (EMPTY DEFAULTS)
-- -------------------------------------------------------------------------
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS working_hours TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS office_address TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS email TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS about_text TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS delivery_note TEXT DEFAULT '';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS languages_supported TEXT DEFAULT 'English, Telugu, Hindi';

-- -------------------------------------------------------------------------
-- 3. UPDATE ENQUIRIES TABLE CHECK CONSTRAINT FOR CHATBOT SOURCE
-- -------------------------------------------------------------------------
DO $$
BEGIN
    -- Drop old source check constraint if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'enquiries_source_check' 
        AND table_name = 'enquiries'
    ) THEN
        ALTER TABLE public.enquiries DROP CONSTRAINT enquiries_source_check;
    END IF;

    -- Add updated constraint to allow 'chatbot' as lead source
    ALTER TABLE public.enquiries ADD CONSTRAINT enquiries_source_check 
        CHECK (source IN ('contact', 'quote', 'chatbot'));
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- -------------------------------------------------------------------------
-- 4. CHAT SESSIONS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    started_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_message_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    page_url TEXT DEFAULT '',
    lead_id UUID REFERENCES public.enquiries(id) ON DELETE SET NULL,
    ip_hash TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- 5. CHAT MESSAGES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES public.chat_sessions(session_id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance, rate-limiting & daily quota queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_time ON public.chat_messages(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_daily_quota ON public.chat_messages(role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message ON public.chat_sessions(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_service_areas_sort ON public.service_areas(sort_order, is_active);

-- -------------------------------------------------------------------------
-- 6. CHATBOT SETTINGS TABLE (SINGLE-ROW CONFIGURATION)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chatbot_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    enabled BOOLEAN NOT NULL DEFAULT true,
    welcome_message TEXT NOT NULL DEFAULT 'Hi! I am the ZippyTechSystems AI assistant. How can I help you grow your business with Web Development, App Development, or AI Automation today?',
    fallback_message TEXT NOT NULL DEFAULT 'I would be happy to connect you directly with our founder Lingaswamy on WhatsApp for personalized pricing and consultation!',
    quick_replies JSONB NOT NULL DEFAULT '["Website services", "App for my shop", "AI chatbot / WhatsApp automation", "Prices", "Talk to Lingaswamy"]'::jsonb,
    extra_instructions TEXT NOT NULL DEFAULT '',
    model TEXT NOT NULL DEFAULT 'claude-haiku-4-5-20251001',
    daily_limit INTEGER NOT NULL DEFAULT 500 CHECK (daily_limit >= 1),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed default single-row settings if not present
INSERT INTO public.chatbot_settings (id, enabled, welcome_message, fallback_message, quick_replies, extra_instructions, model, daily_limit)
VALUES (
    1,
    true,
    'Hi! I am the ZippyTechSystems AI assistant. How can I help you grow your business with Web Development, App Development, or AI Automation today?',
    'I would be happy to connect you directly with our founder Lingaswamy on WhatsApp for personalized pricing and consultation!',
    '["Website services", "App for my shop", "AI chatbot / WhatsApp automation", "Prices", "Talk to Lingaswamy"]'::jsonb,
    '',
    'claude-haiku-4-5-20251001',
    500
)
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------------------
-- 7. SECURE PUBLIC VIEW FOR ANON CLIENT (HIDES SENSITIVE COLUMNS)
-- -------------------------------------------------------------------------
-- Exposes ONLY enabled, welcome_message, and quick_replies.
-- extra_instructions, daily_limit, and model are NOT accessible to anon.
CREATE OR REPLACE VIEW public.chatbot_public WITH (security_invoker = false) AS
SELECT
    id,
    enabled,
    welcome_message,
    quick_replies
FROM public.chatbot_settings
WHERE id = 1;

-- Revoke direct anon select on the underlying settings table
REVOKE ALL ON public.chatbot_settings FROM anon;
GRANT SELECT ON public.chatbot_public TO anon, authenticated;

-- -------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_settings ENABLE ROW LEVEL SECURITY;

-- Service Areas: Public can read active areas; admin can manage all
DROP POLICY IF EXISTS "Public read active service areas" ON public.service_areas;
CREATE POLICY "Public read active service areas" ON public.service_areas
    FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage service areas" ON public.service_areas;
CREATE POLICY "Admin manage service areas" ON public.service_areas
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Chatbot Settings: Admin can view & edit full settings
DROP POLICY IF EXISTS "Admin view chatbot_settings" ON public.chatbot_settings;
CREATE POLICY "Admin view chatbot_settings" ON public.chatbot_settings
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin manage chatbot_settings" ON public.chatbot_settings;
CREATE POLICY "Admin manage chatbot_settings" ON public.chatbot_settings
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Chat Sessions: Only admin can select; Edge Function uses service_role
DROP POLICY IF EXISTS "Admin select chat sessions" ON public.chat_sessions;
CREATE POLICY "Admin select chat sessions" ON public.chat_sessions
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin manage chat sessions" ON public.chat_sessions;
CREATE POLICY "Admin manage chat sessions" ON public.chat_sessions
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Chat Messages: Only admin can select; Edge Function uses service_role
DROP POLICY IF EXISTS "Admin select chat messages" ON public.chat_messages;
CREATE POLICY "Admin select chat messages" ON public.chat_messages
    FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin manage chat messages" ON public.chat_messages;
CREATE POLICY "Admin manage chat messages" ON public.chat_messages
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Realtime replication for dynamic updates (optional)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.service_areas;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
