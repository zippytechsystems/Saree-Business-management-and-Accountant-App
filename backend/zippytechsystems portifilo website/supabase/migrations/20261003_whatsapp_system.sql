-- =========================================================================
-- MIGRATION: WhatsApp Chatbot & Automation Infrastructure
-- Date: 2026-10-03
-- Features:
--   1. Extend settings with founder_name, bot toggles, quiet hours, pause hours
--   2. Extend service_areas with types (office, service_area, online) and addresses
--   3. Create whatsapp_contacts, whatsapp_messages, whatsapp_templates, whatsapp_automation_queue
--   4. Extend enquiries with follow_up_at and new sources (whatsapp, whatsapp-callback)
--   5. Seed draft templates & ensure single 'Online (all India)' service area
--   6. Enforce RLS (admin-only for WA tables, public read for active service_areas)
-- =========================================================================

-- 1. Extend settings table
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS founder_name TEXT DEFAULT 'Lingaswamy Maddeboina',
ADD COLUMN IF NOT EXISTS whatsapp_bot_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS whatsapp_auto_confirm BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_followups BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_status_updates BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS quiet_hours_start TEXT DEFAULT '22:00',
ADD COLUMN IF NOT EXISTS quiet_hours_end TEXT DEFAULT '08:00',
ADD COLUMN IF NOT EXISTS daily_summary_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS google_sheet_export_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS human_pause_hours INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS wa_admin_to TEXT DEFAULT '';

-- Update default founder name if still blank or old
UPDATE public.settings 
SET founder_name = 'Lingaswamy Maddeboina' 
WHERE founder_name IS NULL OR founder_name = '';

-- 2. Extend service_areas table
ALTER TABLE public.service_areas 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'online' CHECK (type IN ('office', 'service_area', 'online')),
ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Telangana',
ADD COLUMN IF NOT EXISTS map_link TEXT DEFAULT '';

-- Ensure single online row is present and active
INSERT INTO public.service_areas (name, type, notes, sort_order, is_active)
SELECT 'Online (all India)', 'online', 'Remote delivery and digital support across all states in India', 0, true
WHERE NOT EXISTS (SELECT 1 FROM public.service_areas WHERE name = 'Online (all India)');

UPDATE public.service_areas 
SET type = 'online' 
WHERE name = 'Online (all India)' AND (type IS NULL OR type = '');

-- 3. WhatsApp Contacts Table
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
    id BIGSERIAL PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE, -- E.164 digits without plus (e.g. 919876543210)
    name TEXT DEFAULT '',
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'te', 'hi')),
    opted_out BOOLEAN DEFAULT false,
    opt_in_source TEXT DEFAULT 'whatsapp',
    last_customer_message_at TIMESTAMPTZ DEFAULT NOW(),
    ai_paused_until TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'needs_human', 'opted_out')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_contacts_phone ON public.whatsapp_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_wa_contacts_status ON public.whatsapp_contacts(status);

-- 4. WhatsApp Messages Table (Transcript & Audit)
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id BIGSERIAL PRIMARY KEY,
    contact_id BIGINT REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE,
    wa_message_id TEXT UNIQUE,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    source TEXT DEFAULT 'bot' CHECK (source IN ('bot', 'app', 'admin', 'customer', 'automation')),
    type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'interactive', 'template', 'media', 'unsupported')),
    content TEXT NOT NULL,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'sent' CHECK (status IN ('received', 'sent', 'delivered', 'read', 'failed')),
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_messages_contact_created ON public.whatsapp_messages(contact_id, created_at);
CREATE INDEX IF NOT EXISTS idx_wa_messages_wa_id ON public.whatsapp_messages(wa_message_id);

-- 5. WhatsApp Templates Table
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('en', 'te', 'hi')),
    category TEXT DEFAULT 'UTILITY',
    body TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    approval_status TEXT DEFAULT 'not_submitted' CHECK (approval_status IN ('not_submitted', 'pending', 'approved', 'rejected')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT wa_templates_name_lang_key UNIQUE(name, language)
);

-- Seed Draft Templates (English, Telugu, Hindi)
INSERT INTO public.whatsapp_templates (name, language, body, variables, approval_status, is_active)
VALUES
  -- Enquiry Confirmation
  ('enquiry_confirmation', 'en', 'Hi {{1}}, thank you for contacting ZippyTechSystems Pvt. Ltd. We have received your enquiry for {{2}} and will contact you within 24 hours.', '["name", "service"]'::jsonb, 'not_submitted', true),
  ('enquiry_confirmation', 'te', 'నమస్తే {{1}}, ZippyTechSystems Pvt. Ltd. ని సంప్రదించినందుకు ధన్యవాదాలు. {{2}} కోసం మీ విచారణ అందింది. మేము 24 గంటల్లో మిమ్మల్ని సంప్రదిస్తాము.', '["name", "service"]'::jsonb, 'not_submitted', true),
  ('enquiry_confirmation', 'hi', 'नमस्ते {{1}}, ZippyTechSystems Pvt. Ltd. से संपर्क करने के लिए धन्यवाद। {{2}} के लिए आपकी पूछताछ मिल गई है और हम 24 घंटे के भीतर आपसे संपर्क करेंगे।', '["name", "service"]'::jsonb, 'not_submitted', true),
  -- Follow Up
  ('follow_up', 'en', 'Hi {{1}}, this is Lingaswamy from ZippyTechSystems. Following up on your enquiry for {{2}}. Would you like to schedule a quick call today?', '["name", "service"]'::jsonb, 'not_submitted', true),
  ('follow_up', 'te', 'నమస్తే {{1}}, ZippyTechSystems నుండి లింగస్వామి. మీ {{2}} ప్రాజెక్ట్ వివరాల గురించి మాట్లాడటానికి ఈ రోజు మీకు అనుకూలమైన సమయం చెప్పగలరా?', '["name", "service"]'::jsonb, 'not_submitted', true),
  ('follow_up', 'hi', 'नमस्ते {{1}}, ZippyTechSystems से लिंगस्वामी। आपकी {{2}} पूछताछ के संदर्भ में, क्या आज हम फोन पर संक्षिप्त चर्चा कर सकते हैं?', '["name", "service"]'::jsonb, 'not_submitted', true),
  -- Thank You / Status Update
  ('thank_you', 'en', 'Hi {{1}}, thank you for choosing ZippyTechSystems. Your project consultation is confirmed.', '["name"]'::jsonb, 'not_submitted', true),
  ('thank_you', 'te', 'నమస్తే {{1}}, ZippyTechSystems ను ఎంచుకున్నందుకు ధన్యవాదాలు. మీ ప్రాజెక్ట్ సంప్రదింపు ధృవీకరించబడింది.', '["name"]'::jsonb, 'not_submitted', true),
  ('thank_you', 'hi', 'नमस्ते {{1}}, ZippyTechSystems को चुनने के लिए धन्यवाद। आपका प्रोजेक्ट परामर्श कन्फर्म हो गया है।', '["name"]'::jsonb, 'not_submitted', true)
ON CONFLICT (name, language) DO UPDATE 
SET body = EXCLUDED.body, variables = EXCLUDED.variables;

-- 6. WhatsApp Automation Queue Table
CREATE TABLE IF NOT EXISTS public.whatsapp_automation_queue (
    id BIGSERIAL PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('enquiry_confirmation', 'admin_alert', 'follow_up', 'overdue_alert', 'status_update', 'daily_summary')),
    enquiry_id BIGINT REFERENCES public.enquiries(id) ON DELETE SET NULL,
    contact_id BIGINT REFERENCES public.whatsapp_contacts(id) ON DELETE SET NULL,
    template_id BIGINT REFERENCES public.whatsapp_templates(id) ON DELETE SET NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wa_queue_status_run ON public.whatsapp_automation_queue(status, run_at);

-- 7. Update enquiries table constraints and columns
ALTER TABLE public.enquiries 
ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ;

ALTER TABLE public.enquiries DROP CONSTRAINT IF EXISTS enquiries_source_check;
ALTER TABLE public.enquiries ADD CONSTRAINT enquiries_source_check 
CHECK (source IN ('contact', 'quote', 'project', 'callback', 'chatbot', 'whatsapp', 'whatsapp-callback'));

-- 8. Row Level Security Policies
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_automation_queue ENABLE ROW LEVEL SECURITY;

-- whatsapp_contacts RLS: Admins only
DROP POLICY IF EXISTS "Admins can view and manage whatsapp_contacts" ON public.whatsapp_contacts;
CREATE POLICY "Admins can view and manage whatsapp_contacts" ON public.whatsapp_contacts
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- whatsapp_messages RLS: Admins only
DROP POLICY IF EXISTS "Admins can view and manage whatsapp_messages" ON public.whatsapp_messages;
CREATE POLICY "Admins can view and manage whatsapp_messages" ON public.whatsapp_messages
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- whatsapp_templates RLS: Admins only
DROP POLICY IF EXISTS "Admins can view and manage whatsapp_templates" ON public.whatsapp_templates;
CREATE POLICY "Admins can view and manage whatsapp_templates" ON public.whatsapp_templates
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- whatsapp_automation_queue RLS: Admins only
DROP POLICY IF EXISTS "Admins can view and manage whatsapp_automation_queue" ON public.whatsapp_automation_queue;
CREATE POLICY "Admins can view and manage whatsapp_automation_queue" ON public.whatsapp_automation_queue
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());
