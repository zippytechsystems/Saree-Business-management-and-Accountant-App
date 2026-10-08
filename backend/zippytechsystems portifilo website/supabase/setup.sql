-- =========================================================================
-- ZippyTechSystems Pvt. Ltd. — Complete Production Supabase Setup Script
-- =========================================================================
-- Safe to re-run anytime: IF NOT EXISTS, DROP POLICY IF EXISTS.
-- Phone & WhatsApp Number: 6302690251 throughout.
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. SETTINGS TABLE (Single-Row Site Configuration)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    phone TEXT NOT NULL DEFAULT '6302690251',
    whatsapp_number TEXT NOT NULL DEFAULT '6302690251',
    default_whatsapp_message TEXT NOT NULL DEFAULT 'Hi Lingaswamy, I visited ZippyTechSystems and would like to get a quote for my business.',
    tagline TEXT NOT NULL DEFAULT 'Build • Automate • Grow',
    secondary_tagline TEXT NOT NULL DEFAULT 'Smart Technology for a Stronger Tomorrow',
    location TEXT NOT NULL DEFAULT 'Hyderabad, Telangana, India',
    instagram_url TEXT DEFAULT 'https://www.instagram.com/zippytechsystems',
    youtube_url TEXT DEFAULT 'https://www.youtube.com/@zippytechsystems',
    email TEXT DEFAULT '',
    working_hours TEXT DEFAULT '',
    office_address TEXT DEFAULT '',
    about_text TEXT DEFAULT '',
    delivery_note TEXT DEFAULT '',
    languages_supported TEXT DEFAULT 'English, Telugu, Hindi',
    response_time_text TEXT DEFAULT '24 hours',
    facebook_url TEXT DEFAULT '',
    linkedin_url TEXT DEFAULT '',
    notify_email_enabled BOOLEAN DEFAULT true,
    wa_auto_reply_enabled BOOLEAN DEFAULT false,
    wa_admin_alert_enabled BOOLEAN DEFAULT false,
    wa_template_en TEXT DEFAULT 'Thank you for contacting ZippyTechSystems. We received your enquiry and will contact you within 24 hours.',
    wa_template_te TEXT DEFAULT 'ZippyTechSystems ను సంప్రదించినందుకు ధన్యవాదాలు. మీ విచారణ మాకు అందింది, మేము 24 గంటల్లో మిమ్మల్ని సంప్రదిస్తాము.',
    wa_template_hi TEXT DEFAULT 'ZippyTechSystems से संपर्क करने के लिए धन्यवाद। हमें आपकी पूछताछ मिल गई है और हम 24 घंटे के भीतर आपसे संपर्क करेंगे।',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed or update default settings row
INSERT INTO public.settings (
    id, phone, whatsapp_number, default_whatsapp_message, tagline, secondary_tagline, location,
    instagram_url, youtube_url, email, working_hours, office_address, about_text, delivery_note, languages_supported,
    response_time_text, facebook_url, linkedin_url, notify_email_enabled, wa_auto_reply_enabled, wa_admin_alert_enabled
) VALUES (
    1, '6302690251', '6302690251',
    'Hi Lingaswamy, I visited ZippyTechSystems and would like to get a quote for my business.',
    'Build • Automate • Grow', 'Smart Technology for a Stronger Tomorrow',
    'Hyderabad, Telangana, India', 'https://www.instagram.com/zippytechsystems',
    'https://www.youtube.com/@zippytechsystems', '', '', '', '', '', 'English, Telugu, Hindi',
    '24 hours', '', '', true, false, false
) ON CONFLICT (id) DO UPDATE SET
    phone = '6302690251',
    whatsapp_number = '6302690251',
    tagline = EXCLUDED.tagline,
    secondary_tagline = EXCLUDED.secondary_tagline;

-- -------------------------------------------------------------------------
-- 2. DOMAINS TABLE (Web, App, AI - Pure Numeric Starting Prices)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.domains (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL CHECK (key IN ('web', 'app', 'ai')),
    name TEXT NOT NULL,
    intro TEXT NOT NULL,
    color TEXT NOT NULL,
    starting_price NUMERIC NOT NULL CHECK (starting_price >= 0),
    price_label TEXT NOT NULL DEFAULT 'Starting from',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.domains (id, key, name, intro, color, starting_price, price_label, sort_order, is_active)
VALUES
    ('web', 'web', 'Web Development', 'A website that helps your business grow.', '#1d5cf0', 7000, 'Starting from', 1, true),
    ('app', 'app', 'App Development', 'Ready-made business apps for shops, small or big.', '#12a150', 10000, 'Starting from', 2, true),
    ('ai', 'ai', 'AI Automation', 'Never miss a customer enquiry again.', '#7a2fd0', 6000, 'Starting from', 3, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    intro = EXCLUDED.intro,
    color = EXCLUDED.color,
    price_label = EXCLUDED.price_label;

-- -------------------------------------------------------------------------
-- 3. SERVICES TABLE (Main and Additional Deliverables per Domain)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id TEXT NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    type TEXT NOT NULL CHECK (type IN ('main', 'more')) DEFAULT 'main',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed Web Development Services
INSERT INTO public.services (domain_id, name, description, type, sort_order, is_active)
SELECT 'web', 'Business websites and landing pages', 'High-conversion business showcase and landing pages', 'main', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE domain_id = 'web' AND name = 'Business websites and landing pages');

INSERT INTO public.services (domain_id, name, description, type, sort_order, is_active)
SELECT 'web', 'Services / products showcase websites', 'Showcase products and services 24 hours a day to prospective customers', 'main', 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE domain_id = 'web' AND name = 'Services / products showcase websites');

INSERT INTO public.services (domain_id, name, description, type, sort_order, is_active)
SELECT 'web', 'E-commerce business websites', 'Full online storefront with payment gateway and cart', 'main', 3, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE domain_id = 'web' AND name = 'E-commerce business websites');

INSERT INTO public.services (domain_id, name, description, type, sort_order, is_active)
SELECT 'web', 'Custom domain and hosting', 'Reliable deployment, custom domain setup, and cloud hosting', 'main', 4, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE domain_id = 'web' AND name = 'Custom domain and hosting');

INSERT INTO public.services (domain_id, name, description, type, sort_order, is_active)
SELECT 'web', 'Portfolio, restaurant, clinic, school & real estate websites', 'Tailored web solutions for local professionals and service businesses', 'more', 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE domain_id = 'web' AND name LIKE 'Portfolio%');

INSERT INTO public.services (domain_id, name, description, type, sort_order, is_active)
SELECT 'web', 'SEO and Google Business Profile setup', 'Local search visibility so nearby customers can discover you immediately', 'more', 6, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE domain_id = 'web' AND name LIKE 'SEO%');

-- Seed App Development Services
INSERT INTO public.services (domain_id, name, description, type, sort_order, is_active)
SELECT 'app', 'Accountant App', 'Automates billing, accounts and receipts so you can save a full-time accountant salary', 'main', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE domain_id = 'app' AND name = 'Accountant App');

INSERT INTO public.services (domain_id, name, description, type, sort_order, is_active)
SELECT 'app', 'Business Management App', 'Manage day-to-day operations, sales records, and inventory on your phone', 'main', 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE domain_id = 'app' AND name = 'Business Management App');

INSERT INTO public.services (domain_id, name, description, type, sort_order, is_active)
SELECT 'app', 'E-commerce Business App', 'Dedicated mobile shopping application for your store customers', 'main', 3, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE domain_id = 'app' AND name = 'E-commerce Business App');

INSERT INTO public.services (domain_id, name, description, type, sort_order, is_active)
SELECT 'app', 'Staff Management App', 'Attendance, duty logs, and staff salary bookkeeping', 'main', 4, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE domain_id = 'app' AND name = 'Staff Management App');

INSERT INTO public.services (domain_id, name, description, type, sort_order, is_active)
SELECT 'app', 'Billing/POS and inventory app', 'Fast counter checkout with barcode scanner and stock alerts', 'more', 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE domain_id = 'app' AND name LIKE 'Billing/POS%');

-- Seed AI Automation Services
INSERT INTO public.services (domain_id, name, description, type, sort_order, is_active)
SELECT 'ai', 'WhatsApp automation', 'Automatic instant replies to customers 24/7 so no enquiry is lost', 'main', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE domain_id = 'ai' AND name = 'WhatsApp automation');

INSERT INTO public.services (domain_id, name, description, type, sort_order, is_active)
SELECT 'ai', 'AI voice agent', 'Answers business enquiry phone calls automatically with human-like AI voice', 'main', 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE domain_id = 'ai' AND name = 'AI voice agent');

INSERT INTO public.services (domain_id, name, description, type, sort_order, is_active)
SELECT 'ai', 'AI chatbot for your website', 'Engages visitors 24x7, answers questions, and captures phone leads', 'main', 3, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE domain_id = 'ai' AND name LIKE 'AI chatbot%');

INSERT INTO public.services (domain_id, name, description, type, sort_order, is_active)
SELECT 'ai', 'Lead management automation', 'Captures enquiries from all channels and triggers follow-up reminders', 'main', 4, true
WHERE NOT EXISTS (SELECT 1 FROM public.services WHERE domain_id = 'ai' AND name = 'Lead management automation');

-- -------------------------------------------------------------------------
-- 4. PACKAGES TABLE (Pricing Tiers: Basic, Standard, Premium)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id TEXT NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC NOT NULL CHECK (price >= 0),
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_popular BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.packages (domain_id, name, price, features, is_popular, sort_order, is_active)
SELECT 'web', 'Basic', 7000, '["1-3 Responsive Pages", "Mobile & Tablet Optimized", "Contact & WhatsApp Integration", "Free SSL & Fast Cloud Hosting", "1 Year Basic Support"]'::jsonb, false, 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.packages WHERE domain_id = 'web' AND name = 'Basic');

INSERT INTO public.packages (domain_id, name, price, features, is_popular, sort_order, is_active)
SELECT 'web', 'Standard', 15000, '["5-8 Custom Pages", "SEO & Google Business Profile Setup", "Product/Service Showcase Catalog", "Payment Gateway Integration", "Lead Enquiry Form to WhatsApp"]'::jsonb, true, 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.packages WHERE domain_id = 'web' AND name = 'Standard');

INSERT INTO public.packages (domain_id, name, price, features, is_popular, sort_order, is_active)
SELECT 'web', 'Premium', 28000, '["Full E-commerce or Dynamic Web Portal", "Admin Dashboard for Inventory/Products", "Custom Database & User Accounts", "Payment Gateway + SMS/WhatsApp Alerts", "Priority 24/7 Dedicated Support"]'::jsonb, false, 3, true
WHERE NOT EXISTS (SELECT 1 FROM public.packages WHERE domain_id = 'web' AND name = 'Premium');

INSERT INTO public.packages (domain_id, name, price, features, is_popular, sort_order, is_active)
SELECT 'app', 'Basic', 10000, '["Android App (Single Store)", "Billing & Invoicing System", "Daily Cash & Expense Ledger", "WhatsApp Bill Sharing", "Offline-first Database"]'::jsonb, false, 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.packages WHERE domain_id = 'app' AND name = 'Basic');

INSERT INTO public.packages (domain_id, name, price, features, is_popular, sort_order, is_active)
SELECT 'app', 'Standard', 22000, '["Android & iOS App (Flutter)", "Accountant Mode (Auto-Balances)", "Inventory & Stock Low-Alerts", "Staff Attendance & Salary Logs", "Daily Business Reports on Phone"]'::jsonb, true, 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.packages WHERE domain_id = 'app' AND name = 'Standard');

INSERT INTO public.packages (domain_id, name, price, features, is_popular, sort_order, is_active)
SELECT 'ai', 'Basic', 6000, '["WhatsApp Auto-Reply Bot", "Instant Greeting & Menu Navigation", "Direct Enquiry Forwarding to Owner", "Operating Hours & FAQ Automation", "Ready in 2-3 Days"]'::jsonb, false, 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.packages WHERE domain_id = 'ai' AND name = 'Basic');

INSERT INTO public.packages (domain_id, name, price, features, is_popular, sort_order, is_active)
SELECT 'ai', 'Standard', 14000, '["Smart AI Website Chatbot + Voice Agent", "Answers in Telugu, English & Hindi", "Live Lead Capture to Database", "Instant WhatsApp Notification to Lingaswamy", "Full Admin Transcript Dashboard"]'::jsonb, true, 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.packages WHERE domain_id = 'ai' AND name = 'Standard');

-- -------------------------------------------------------------------------
-- 5. PROJECTS TABLE (Portfolio Showcase Items)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    domain_id TEXT NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
    client_category TEXT DEFAULT 'Business Solutions',
    description TEXT NOT NULL,
    technologies TEXT[] DEFAULT '{}',
    metrics TEXT DEFAULT '',
    link TEXT DEFAULT '',
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- 6. TESTIMONIALS TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    company TEXT NOT NULL,
    role TEXT DEFAULT '',
    feedback TEXT NOT NULL,
    rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    domain_id TEXT NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- 7. FAQS TABLE (Frequently Asked Questions)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.faqs (question, answer, category, sort_order, is_active)
SELECT 'How much time does it take to deliver a website?', 'A standard business website typically takes 3 to 5 business days once your requirements and content details are shared.', 'Web Development', 1, true
WHERE NOT EXISTS (SELECT 1 FROM public.faqs WHERE question LIKE 'How much time%');

INSERT INTO public.faqs (question, answer, category, sort_order, is_active)
SELECT 'Are hosting and domain included?', 'Yes, we assist you in purchasing or connecting your custom .com or .in domain, and our standard packages include initial cloud setup and SSL certificate.', 'Web Development', 2, true
WHERE NOT EXISTS (SELECT 1 FROM public.faqs WHERE question LIKE 'Are hosting%');

INSERT INTO public.faqs (question, answer, category, sort_order, is_active)
SELECT 'What is the payment process?', 'We work with clear, milestone-based payments: a small advance to start design and development, followed by balance payment upon your full review and satisfaction before launch.', 'Pricing', 3, true
WHERE NOT EXISTS (SELECT 1 FROM public.faqs WHERE question LIKE 'What is the payment%');

INSERT INTO public.faqs (question, answer, category, sort_order, is_active)
SELECT 'Do you provide support after launch?', 'Yes, every project includes after-launch technical support to ensure your website or app runs smoothly without downtime.', 'Support', 4, true
WHERE NOT EXISTS (SELECT 1 FROM public.faqs WHERE question LIKE 'Do you provide support%');

INSERT INTO public.faqs (question, answer, category, sort_order, is_active)
SELECT 'Can I edit the content myself later?', 'Yes! We provide an easy-to-use Admin Panel where you can update prices, service offerings, business details, and contact numbers anytime with no coding knowledge required.', 'General', 5, true
WHERE NOT EXISTS (SELECT 1 FROM public.faqs WHERE question LIKE 'Can I edit%');

INSERT INTO public.faqs (question, answer, category, sort_order, is_active)
SELECT 'Can I use the accountant app on my phone?', 'Yes, our business management and accountant apps are built mobile-first, allowing shop owners to view daily accounts, stock, and bills directly from their Android or iOS mobile phone.', 'App Development', 6, true
WHERE NOT EXISTS (SELECT 1 FROM public.faqs WHERE question LIKE 'Can I use the accountant app%');

-- -------------------------------------------------------------------------
-- 8. SERVICE AREAS TABLE
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

INSERT INTO public.service_areas (name, notes, sort_order, is_active)
SELECT 'Online (all India)', 'Remote delivery and digital support across all states in India', 0, true
WHERE NOT EXISTS (SELECT 1 FROM public.service_areas WHERE name = 'Online (all India)');

-- -------------------------------------------------------------------------
-- 9. ENQUIRIES TABLE
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT DEFAULT '',
    service TEXT NOT NULL,
    message TEXT NOT NULL,
    selected_services JSONB DEFAULT '[]'::jsonb,
    notes TEXT DEFAULT '',
    whatsapp_opt_in BOOLEAN DEFAULT false,
    status TEXT NOT NULL DEFAULT 'New' CHECK (status IN ('New', 'Contacted', 'Closed')),
    source TEXT NOT NULL DEFAULT 'contact' CHECK (source IN ('contact', 'quote', 'project', 'callback', 'chatbot')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- 9B. NOTIFICATION LOG TABLE (Resend Email & WhatsApp Alerts Audit)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_log (
    id BIGSERIAL PRIMARY KEY,
    enquiry_id UUID REFERENCES public.enquiries(id) ON DELETE SET NULL,
    channel TEXT NOT NULL, -- 'email_admin', 'email_customer', 'wa_customer', 'wa_admin'
    recipient TEXT NOT NULL,
    status TEXT NOT NULL,  -- 'sent', 'failed', 'skipped'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- 10. PRICE HISTORY TABLE & TRIGGER
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item TEXT NOT NULL,
    old_price NUMERIC NOT NULL,
    new_price NUMERIC NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE FUNCTION public.log_price_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_TABLE_NAME = 'domains' THEN
        IF OLD.starting_price IS DISTINCT FROM NEW.starting_price THEN
            INSERT INTO public.price_history (item, old_price, new_price)
            VALUES (NEW.name || ' (Domain Starting Price)', OLD.starting_price, NEW.starting_price);
        END IF;
    ELSIF TG_TABLE_NAME = 'packages' THEN
        IF OLD.price IS DISTINCT FROM NEW.price THEN
            INSERT INTO public.price_history (item, old_price, new_price)
            VALUES (NEW.name || ' Package', OLD.price, NEW.price);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_domain_price_history ON public.domains;
CREATE TRIGGER trg_domain_price_history
    AFTER UPDATE ON public.domains
    FOR EACH ROW
    EXECUTE FUNCTION public.log_price_change();

DROP TRIGGER IF EXISTS trg_package_price_history ON public.packages;
CREATE TRIGGER trg_package_price_history
    AFTER UPDATE ON public.packages
    FOR EACH ROW
    EXECUTE FUNCTION public.log_price_change();

-- -------------------------------------------------------------------------
-- 11. ADMINS TABLE & AUTH HELPER
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed founder admin email
INSERT INTO public.admins (email)
VALUES ('lingaswamymaddeboina@gmail.com')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins
        WHERE lower(email) = lower(auth.jwt() ->> 'email')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- -------------------------------------------------------------------------
-- 12. CHAT SESSIONS & CHAT MESSAGES TABLES
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

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL REFERENCES public.chat_sessions(session_id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    channel TEXT NOT NULL DEFAULT 'text' CHECK (channel IN ('text', 'voice')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session_time ON public.chat_messages(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_daily_quota ON public.chat_messages(role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_message ON public.chat_sessions(last_message_at DESC);

-- -------------------------------------------------------------------------
-- 13. CHATBOT SETTINGS & SECURE PUBLIC VIEW
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chatbot_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    enabled BOOLEAN NOT NULL DEFAULT true,
    welcome_message TEXT NOT NULL DEFAULT 'Hi! I am the ZippyTechSystems AI assistant. How can I help you grow your business with Web Development, App Development, or AI Automation today?',
    fallback_message TEXT NOT NULL DEFAULT 'I would be happy to connect you directly with our founder Lingaswamy on WhatsApp at 6302690251 for personalized pricing and consultation!',
    quick_replies JSONB NOT NULL DEFAULT '["Website services", "App for my shop", "AI chatbot / WhatsApp automation", "Prices", "Talk to Lingaswamy"]'::jsonb,
    extra_instructions TEXT NOT NULL DEFAULT '',
    model TEXT NOT NULL DEFAULT 'claude-haiku-4-5-20251001',
    daily_limit INTEGER NOT NULL DEFAULT 500 CHECK (daily_limit >= 1),
    voice_enabled BOOLEAN NOT NULL DEFAULT true,
    voice_default_lang TEXT NOT NULL DEFAULT 'en-IN',
    voice_rate NUMERIC NOT NULL DEFAULT 1.0 CHECK (voice_rate >= 0.8 AND voice_rate <= 1.2),
    voice_name_en TEXT NOT NULL DEFAULT 'en-IN-NeerjaNeural',
    voice_name_te TEXT NOT NULL DEFAULT 'te-IN-ShrutiNeural',
    voice_name_hi TEXT NOT NULL DEFAULT 'hi-IN-SwaraNeural',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.chatbot_settings (
    id, enabled, welcome_message, fallback_message, quick_replies,
    extra_instructions, model, daily_limit, voice_enabled, voice_default_lang,
    voice_rate, voice_name_en, voice_name_te, voice_name_hi
) VALUES (
    1, true,
    'Hi! I am the ZippyTechSystems AI assistant. How can I help you grow your business with Web Development, App Development, or AI Automation today?',
    'I would be happy to connect you directly with our founder Lingaswamy on WhatsApp at 6302690251 for personalized pricing and consultation!',
    '["Website services", "App for my shop", "AI chatbot / WhatsApp automation", "Prices", "Talk to Lingaswamy"]'::jsonb,
    '', 'claude-haiku-4-5-20251001', 500, true, 'en-IN',
    1.0, 'en-IN-NeerjaNeural', 'te-IN-ShrutiNeural', 'hi-IN-SwaraNeural'
) ON CONFLICT (id) DO NOTHING;

-- Secure View for Anon Client (exposing public config, hiding extra_instructions, model, daily_limit)
CREATE OR REPLACE VIEW public.chatbot_public WITH (security_invoker = false) AS
SELECT
    id,
    enabled,
    welcome_message,
    quick_replies,
    voice_enabled,
    voice_default_lang,
    voice_rate,
    voice_name_en,
    voice_name_te,
    voice_name_hi
FROM public.chatbot_settings
WHERE id = 1;

REVOKE ALL ON public.chatbot_settings FROM anon;
GRANT SELECT ON public.chatbot_public TO anon, authenticated;

-- -------------------------------------------------------------------------
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chatbot_settings ENABLE ROW LEVEL SECURITY;

-- Public SELECT policies (active records only)
DROP POLICY IF EXISTS "Public read settings" ON public.settings;
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin update settings" ON public.settings;
CREATE POLICY "Admin update settings" ON public.settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read active domains" ON public.domains;
CREATE POLICY "Public read active domains" ON public.domains FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage domains" ON public.domains;
CREATE POLICY "Admin manage domains" ON public.domains FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read active services" ON public.services;
CREATE POLICY "Public read active services" ON public.services FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage services" ON public.services;
CREATE POLICY "Admin manage services" ON public.services FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read active packages" ON public.packages;
CREATE POLICY "Public read active packages" ON public.packages FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage packages" ON public.packages;
CREATE POLICY "Admin manage packages" ON public.packages FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read active projects" ON public.projects;
CREATE POLICY "Public read active projects" ON public.projects FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage projects" ON public.projects;
CREATE POLICY "Admin manage projects" ON public.projects FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read active testimonials" ON public.testimonials;
CREATE POLICY "Public read active testimonials" ON public.testimonials FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage testimonials" ON public.testimonials;
CREATE POLICY "Admin manage testimonials" ON public.testimonials FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read active faqs" ON public.faqs;
CREATE POLICY "Public read active faqs" ON public.faqs FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage faqs" ON public.faqs;
CREATE POLICY "Admin manage faqs" ON public.faqs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public read active service areas" ON public.service_areas;
CREATE POLICY "Public read active service areas" ON public.service_areas FOR SELECT USING (is_active = true OR public.is_admin());

DROP POLICY IF EXISTS "Admin manage service areas" ON public.service_areas;
CREATE POLICY "Admin manage service areas" ON public.service_areas FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Public insert enquiries" ON public.enquiries;
CREATE POLICY "Public insert enquiries" ON public.enquiries FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admin select enquiries" ON public.enquiries;
CREATE POLICY "Admin select enquiries" ON public.enquiries FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin manage enquiries" ON public.enquiries;
CREATE POLICY "Admin manage enquiries" ON public.enquiries FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin read price_history" ON public.price_history;
CREATE POLICY "Admin read price_history" ON public.price_history FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin view chatbot_settings" ON public.chatbot_settings;
CREATE POLICY "Admin view chatbot_settings" ON public.chatbot_settings FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin manage chatbot_settings" ON public.chatbot_settings;
CREATE POLICY "Admin manage chatbot_settings" ON public.chatbot_settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin select chat sessions" ON public.chat_sessions;
CREATE POLICY "Admin select chat sessions" ON public.chat_sessions FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin manage chat sessions" ON public.chat_sessions;
CREATE POLICY "Admin manage chat sessions" ON public.chat_sessions FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin select chat messages" ON public.chat_messages;
CREATE POLICY "Admin select chat messages" ON public.chat_messages FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Admin manage chat messages" ON public.chat_messages;
CREATE POLICY "Admin manage chat messages" ON public.chat_messages FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin view notification_log" ON public.notification_log;
CREATE POLICY "Admin view notification_log" ON public.notification_log FOR SELECT USING (public.is_admin());


-- -------------------------------------------------------------------------
-- 15. STORAGE BUCKET FOR PORTFOLIO IMAGES
-- -------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-images', 'portfolio-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read portfolio images" ON storage.objects;
CREATE POLICY "Public read portfolio images" ON storage.objects
    FOR SELECT USING (bucket_id = 'portfolio-images');

DROP POLICY IF EXISTS "Admin upload portfolio images" ON storage.objects;
CREATE POLICY "Admin upload portfolio images" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'portfolio-images' AND public.is_admin());

DROP POLICY IF EXISTS "Admin delete portfolio images" ON storage.objects;
CREATE POLICY "Admin delete portfolio images" ON storage.objects
    FOR DELETE USING (bucket_id = 'portfolio-images' AND public.is_admin());

-- -------------------------------------------------------------------------
-- 16. REALTIME REPLICATION (For Live Price & Content Updates)
-- -------------------------------------------------------------------------
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.domains;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.packages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_contacts;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- -------------------------------------------------------------------------
-- 17. WHATSAPP CHATBOT & AUTOMATION SYSTEM
-- -------------------------------------------------------------------------
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

UPDATE public.settings 
SET founder_name = 'Lingaswamy Maddeboina' 
WHERE founder_name IS NULL OR founder_name = '';

-- Extend service_areas with types and locations
ALTER TABLE public.service_areas 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'online' CHECK (type IN ('office', 'service_area', 'online')),
ADD COLUMN IF NOT EXISTS address TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'Telangana',
ADD COLUMN IF NOT EXISTS map_link TEXT DEFAULT '';

UPDATE public.service_areas 
SET type = 'online' 
WHERE name = 'Online (all India)' AND (type IS NULL OR type = '');

-- WhatsApp Contacts
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
    id BIGSERIAL PRIMARY KEY,
    phone TEXT NOT NULL UNIQUE,
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

-- WhatsApp Messages
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

-- WhatsApp Templates
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

INSERT INTO public.whatsapp_templates (name, language, body, variables, approval_status, is_active)
VALUES
  ('enquiry_confirmation', 'en', 'Hi {{1}}, thank you for contacting ZippyTechSystems Pvt. Ltd. We have received your enquiry for {{2}} and will contact you within 24 hours.', '["name", "service"]'::jsonb, 'not_submitted', true),
  ('enquiry_confirmation', 'te', 'నమస్తే {{1}}, ZippyTechSystems Pvt. Ltd. ని సంప్రదించినందుకు ధన్యవాదాలు. {{2}} కోసం మీ విచారణ అందింది. మేము 24 గంటల్లో మిమ్మల్ని సంప్రదిస్తాము.', '["name", "service"]'::jsonb, 'not_submitted', true),
  ('enquiry_confirmation', 'hi', 'नमस्ते {{1}}, ZippyTechSystems Pvt. Ltd. से संपर्क करने के लिए धन्यवाद। {{2}} के लिए आपकी पूछताछ मिल गई है और हम 24 घंटे के भीतर आपसे संपर्क करेंगे।', '["name", "service"]'::jsonb, 'not_submitted', true),
  ('follow_up', 'en', 'Hi {{1}}, this is Lingaswamy from ZippyTechSystems. Following up on your enquiry for {{2}}. Would you like to schedule a quick call today?', '["name", "service"]'::jsonb, 'not_submitted', true),
  ('follow_up', 'te', 'నమస్తే {{1}}, ZippyTechSystems నుండి లింగస్వామి. మీ {{2}} ప్రాజెక్ట్ వివరాల గురించి మాట్లాడటానికి ఈ రోజు మీకు అనుకూలమైన సమయం చెప్పగలరా?', '["name", "service"]'::jsonb, 'not_submitted', true),
  ('follow_up', 'hi', 'नमस्ते {{1}}, ZippyTechSystems से लिंगस्वामी। आपकी {{2}} पूछताछ के संदर्भ में, क्या आज हम फोन पर संक्षिप्त चर्चा कर सकते हैं?', '["name", "service"]'::jsonb, 'not_submitted', true),
  ('thank_you', 'en', 'Hi {{1}}, thank you for choosing ZippyTechSystems. Your project consultation is confirmed.', '["name"]'::jsonb, 'not_submitted', true),
  ('thank_you', 'te', 'నమస్తే {{1}}, ZippyTechSystems ను ఎంచుకున్నందుకు ధన్యవాదాలు. మీ ప్రాజెక్ట్ సంప్రదింపు ధృవీకరించబడింది.', '["name"]'::jsonb, 'not_submitted', true),
  ('thank_you', 'hi', 'नमस्ते {{1}}, ZippyTechSystems को चुनने के लिए धन्यवाद। आपका प्रोजेक्ट परामर्श कन्फर्म हो गया है।', '["name"]'::jsonb, 'not_submitted', true)
ON CONFLICT (name, language) DO UPDATE 
SET body = EXCLUDED.body, variables = EXCLUDED.variables;

-- WhatsApp Automation Queue
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

-- Enquiries update
ALTER TABLE public.enquiries ADD COLUMN IF NOT EXISTS follow_up_at TIMESTAMPTZ;
ALTER TABLE public.enquiries DROP CONSTRAINT IF EXISTS enquiries_source_check;
ALTER TABLE public.enquiries ADD CONSTRAINT enquiries_source_check 
CHECK (source IN ('contact', 'quote', 'project', 'callback', 'chatbot', 'whatsapp', 'whatsapp-callback'));

-- Enable RLS
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_automation_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view and manage whatsapp_contacts" ON public.whatsapp_contacts;
CREATE POLICY "Admins can view and manage whatsapp_contacts" ON public.whatsapp_contacts
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can view and manage whatsapp_messages" ON public.whatsapp_messages;
CREATE POLICY "Admins can view and manage whatsapp_messages" ON public.whatsapp_messages
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can view and manage whatsapp_templates" ON public.whatsapp_templates;
CREATE POLICY "Admins can view and manage whatsapp_templates" ON public.whatsapp_templates
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can view and manage whatsapp_automation_queue" ON public.whatsapp_automation_queue;
CREATE POLICY "Admins can view and manage whatsapp_automation_queue" ON public.whatsapp_automation_queue
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

