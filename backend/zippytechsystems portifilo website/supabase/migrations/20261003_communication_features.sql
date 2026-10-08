-- =========================================================================
-- Migration: Communication Features, Enquiries Extension & Notification Log
-- Date: 2026-10-03
-- =========================================================================

-- 1. Extend enquiries table for project builder & communication channels
ALTER TABLE enquiries 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS selected_services JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN DEFAULT false;

-- Update source CHECK constraint safely
ALTER TABLE enquiries DROP CONSTRAINT IF EXISTS enquiries_source_check;
ALTER TABLE enquiries ADD CONSTRAINT enquiries_source_check 
CHECK (source IN ('contact', 'quote', 'project', 'callback', 'chatbot'));

-- 2. Extend settings table for response time, social links, and notifications
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS response_time_text TEXT DEFAULT '24 hours',
ADD COLUMN IF NOT EXISTS facebook_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS linkedin_url TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS notify_email_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS wa_auto_reply_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wa_admin_alert_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wa_template_en TEXT DEFAULT 'Thank you for contacting ZippyTechSystems. We received your enquiry and will contact you within 24 hours.',
ADD COLUMN IF NOT EXISTS wa_template_te TEXT DEFAULT 'ZippyTechSystems ను సంప్రదించినందుకు ధన్యవాదాలు. మీ విచారణ మాకు అందింది, మేము 24 గంటల్లో మిమ్మల్ని సంప్రదిస్తాము.',
ADD COLUMN IF NOT EXISTS wa_template_hi TEXT DEFAULT 'ZippyTechSystems से संपर्क करने के लिए धन्यवाद। हमें आपकी पूछताछ मिल गई है और हम 24 घंटे के भीतर आपसे संपर्क करेंगे।';

-- 3. Notification log table for audit & failure resilience
CREATE TABLE IF NOT EXISTS notification_log (
    id BIGSERIAL PRIMARY KEY,
    enquiry_id BIGINT REFERENCES enquiries(id) ON DELETE SET NULL,
    channel TEXT NOT NULL, -- 'email_admin', 'email_customer', 'wa_customer', 'wa_admin'
    recipient TEXT NOT NULL,
    status TEXT NOT NULL,  -- 'sent', 'failed', 'skipped'
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on notification_log (admin only)
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view notification logs" ON notification_log;
CREATE POLICY "Admins can view notification logs" ON notification_log
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM admins WHERE admins.email = auth.jwt() ->> 'email'));

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_enquiries_created_at_status ON enquiries(created_at, status);
CREATE INDEX IF NOT EXISTS idx_enquiries_source ON enquiries(source);
CREATE INDEX IF NOT EXISTS idx_notification_log_enquiry_id ON notification_log(enquiry_id);
