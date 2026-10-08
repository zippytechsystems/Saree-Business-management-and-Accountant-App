-- =========================================================================
-- ZippyTechSystems Pvt. Ltd. — Complete Production Supabase Schema
-- =========================================================================
-- Tables: settings, domains, services, packages, projects, testimonials, 
--         faqs, enquiries, price_history
-- Features: Strict Constraints, Automated Price History Triggers,
--           Row Level Security (RLS) with Admin Email Check, Realtime Replication
-- =========================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------------------
-- 1. SETTINGS TABLE (Single-Row Site Configuration)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    phone TEXT NOT NULL DEFAULT '6302690251',
    whatsapp_number TEXT NOT NULL DEFAULT '916302690251',
    default_whatsapp_message TEXT NOT NULL DEFAULT 'Hi Lingaswamy, I visited ZippyTechSystems and would like to get a quote for my business.',
    tagline TEXT NOT NULL DEFAULT 'Build • Automate • Grow',
    secondary_tagline TEXT NOT NULL DEFAULT 'Smart Technology for a Stronger Tomorrow',
    location TEXT NOT NULL DEFAULT 'Hyderabad, Telangana, India',
    instagram_url TEXT DEFAULT 'https://www.instagram.com/zippytechsystems',
    youtube_url TEXT DEFAULT 'https://www.youtube.com/@zippytechsystems',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
-- 6. TESTIMONIALS TABLE (Client Reviews & 5-Star Ratings)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    business TEXT NOT NULL,
    domain_id TEXT REFERENCES public.domains(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL DEFAULT 5 CHECK (rating BETWEEN 1 AND 5),
    message TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- 7. FAQS TABLE (Categorized Pre-Sales Answers)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL DEFAULT 'General',
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- 8. ENQUIRIES TABLE (Validated Customer Leads)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL CHECK (length(trim(name)) > 0 AND length(name) <= 150),
    phone TEXT NOT NULL CHECK (length(phone) >= 10),
    service TEXT NOT NULL,
    message TEXT DEFAULT '',
    status TEXT NOT NULL CHECK (status IN ('New', 'Contacted', 'Closed')) DEFAULT 'New',
    source TEXT NOT NULL CHECK (source IN ('contact', 'quote')) DEFAULT 'contact',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- 9. PRICE HISTORY TABLE (Audit Log of Price Changes)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_type TEXT NOT NULL CHECK (item_type IN ('domain', 'package')),
    item_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    old_price NUMERIC NOT NULL,
    new_price NUMERIC NOT NULL,
    changed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- INDEXES FOR FAST QUERY EXECUTION
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_services_domain ON public.services(domain_id, sort_order) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_packages_domain ON public.packages(domain_id, sort_order) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_projects_domain ON public.projects(domain_id, sort_order) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_testimonials_sort ON public.testimonials(sort_order) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs(category, sort_order) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON public.enquiries(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_time ON public.price_history(changed_at DESC);

-- -------------------------------------------------------------------------
-- AUTOMATED TRIGGERS: PRICE HISTORY LOGGING
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_domain_price_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.starting_price IS DISTINCT FROM NEW.starting_price THEN
        INSERT INTO public.price_history (item_type, item_id, item_name, old_price, new_price, changed_at)
        VALUES ('domain', NEW.id, NEW.name, OLD.starting_price, NEW.starting_price, now());
    END IF;
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_domain_price_change ON public.domains;
CREATE TRIGGER trg_domain_price_change
BEFORE UPDATE ON public.domains
FOR EACH ROW EXECUTE FUNCTION public.log_domain_price_change();

CREATE OR REPLACE FUNCTION public.log_package_price_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.price IS DISTINCT FROM NEW.price THEN
        INSERT INTO public.price_history (item_type, item_id, item_name, old_price, new_price, changed_at)
        VALUES ('package', NEW.id::text, NEW.name, OLD.price, NEW.price, now());
    END IF;
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_package_price_change ON public.packages;
CREATE TRIGGER trg_package_price_change
BEFORE UPDATE ON public.packages
FOR EACH ROW EXECUTE FUNCTION public.log_package_price_change();

-- -------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Helper condition: Is authenticated user the authorized admin email?
-- Email: lingaswamymaddeboina@gmail.com
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.role() = 'authenticated' AND
        (
            auth.jwt() ->> 'email' = 'lingaswamymaddeboina@gmail.com' OR
            auth.jwt() ->> 'email' = 'contact@zippysoftwares.in'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Settings Policies
CREATE POLICY "Public read settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Admin update settings" ON public.settings FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 2. Domains Policies
CREATE POLICY "Public read active domains" ON public.domains FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admin manage domains" ON public.domains FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. Services Policies
CREATE POLICY "Public read active services" ON public.services FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admin manage services" ON public.services FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4. Packages Policies
CREATE POLICY "Public read active packages" ON public.packages FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admin manage packages" ON public.packages FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. Projects Policies
CREATE POLICY "Public read active projects" ON public.projects FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admin manage projects" ON public.projects FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 6. Testimonials Policies
CREATE POLICY "Public read active testimonials" ON public.testimonials FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admin manage testimonials" ON public.testimonials FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 7. FAQs Policies
CREATE POLICY "Public read active faqs" ON public.faqs FOR SELECT USING (is_active = true OR public.is_admin());
CREATE POLICY "Admin manage faqs" ON public.faqs FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 8. Enquiries Policies
CREATE POLICY "Public insert enquiries" ON public.enquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin select enquiries" ON public.enquiries FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin manage enquiries" ON public.enquiries FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 9. Price History Policies
CREATE POLICY "Admin view price history" ON public.price_history FOR SELECT USING (public.is_admin());
CREATE POLICY "Admin manage price history" ON public.price_history FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- -------------------------------------------------------------------------
-- STORAGE BUCKET FOR PROJECT IMAGES (Max 2MB, Images Only)
-- -------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'portfolio-images',
    'portfolio-images',
    true,
    2097152, -- 2 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];

CREATE POLICY "Public read portfolio-images" ON storage.objects
FOR SELECT USING (bucket_id = 'portfolio-images');

CREATE POLICY "Admin upload portfolio-images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'portfolio-images' AND public.is_admin());

CREATE POLICY "Admin delete portfolio-images" ON storage.objects
FOR DELETE USING (bucket_id = 'portfolio-images' AND public.is_admin());

-- -------------------------------------------------------------------------
-- ENABLE REALTIME REPLICATION FOR INSTANT AUTO-UPDATE ON LIVE WEBSITE
-- -------------------------------------------------------------------------
-- Tables to publish: domains, packages, settings, services, projects
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.domains;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.packages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- -------------------------------------------------------------------------
-- SEED DATA FROM CURRENT WEBSITE CONTENT
-- -------------------------------------------------------------------------

-- 1. Insert Settings
INSERT INTO public.settings (
    id, phone, whatsapp_number, default_whatsapp_message, tagline, secondary_tagline, location, instagram_url, youtube_url
) VALUES (
    1,
    '6302690251',
    '916302690251',
    'Hi Lingaswamy, I visited ZippyTechSystems and would like to get a quote for my business.',
    'Build • Automate • Grow',
    'Smart Technology for a Stronger Tomorrow',
    'Hyderabad, Telangana, India',
    'https://www.instagram.com/zippytechsystems',
    'https://www.youtube.com/@zippytechsystems'
) ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    whatsapp_number = EXCLUDED.whatsapp_number,
    tagline = EXCLUDED.tagline,
    secondary_tagline = EXCLUDED.secondary_tagline,
    location = EXCLUDED.location;

-- 2. Insert Domains with pure numbers (7000, 10000, 6000)
INSERT INTO public.domains (id, key, name, intro, color, starting_price, price_label, sort_order, is_active)
VALUES
('web', 'web', 'Web Development', 'A modern, high-speed website that brings local customers to your door 24/7.', '#1d5cf0', 7000, 'Starting from', 1, true),
('app', 'app', 'App Development', 'Custom billing, accounts, and inventory apps for retail and wholesale shops.', '#12a150', 10000, 'Starting from', 2, true),
('ai', 'ai', 'AI Automation', 'Never lose another customer enquiry with 24/7 WhatsApp and voice agents.', '#7a2fd0', 6000, 'Starting from', 3, true)
ON CONFLICT (id) DO UPDATE SET
    starting_price = EXCLUDED.starting_price,
    name = EXCLUDED.name,
    intro = EXCLUDED.intro;

-- 3. Insert Main & More Services
INSERT INTO public.services (domain_id, name, description, type, sort_order, is_active) VALUES
-- Web Main Services
('web', 'Business Websites & Landing Pages', 'High-converting, professional web pages that establish immediate credibility and capture customer enquiries.', 'main', 1, true),
('web', 'Services / Products Showcase Websites', 'Visual catalog websites displaying your complete offerings, pricing, and client testimonials.', 'main', 2, true),
('web', 'E-Commerce Business Websites', 'Online shopping stores with fast mobile checkout, UPI / Razorpay payment gateways, and order tracking.', 'main', 3, true),
('web', 'Custom Domain & Hosting Setup', 'End-to-end setup of your custom .com / .in domain, high-speed cloud hosting, and free SSL certificate.', 'main', 4, true),
-- Web More Services
('web', 'Portfolio, restaurant, clinic, school and real estate websites', '', 'more', 5, true),
('web', 'Booking and appointment scheduling websites', '', 'more', 6, true),
('web', 'Website redesign and modernization', '', 'more', 7, true),
('web', 'Search Engine Optimization (SEO) & Google Business Profile setup', '', 'more', 8, true),
('web', 'Payment gateway integration (Razorpay, PhonePe, UPI)', '', 'more', 9, true),
('web', 'Ongoing website maintenance, security updates and yearly support', '', 'more', 10, true),

-- App Main Services
('app', 'Accountant App', 'Automates daily khata, ledger entries, customer credit balance, GST invoicing, and financial reports.', 'main', 1, true),
('app', 'Business Management App', 'Centralized mobile management app tracking inventory, purchases, supplier payments, and shop operations.', 'main', 2, true),
('app', 'E-Commerce Business App', 'Dedicated Android & iOS shopping app for your shop with instant push notifications and fast checkout.', 'main', 3, true),
('app', 'Staff Management App', 'Digital staff attendance, overtime tracker, salary slip calculator, and daily staff shift roster.', 'main', 4, true),
-- App More Services
('app', 'Billing / POS and barcode inventory apps', '', 'more', 5, true),
('app', 'GST invoice & thermal receipt printing app', '', 'more', 6, true),
('app', 'CRM and customer loyalty management app', '', 'more', 7, true),
('app', 'Delivery partner and appointment booking apps', '', 'more', 8, true),
('app', 'School / college administration apps', '', 'more', 9, true),
('app', 'Google Play Store and Apple App Store publishing', '', 'more', 10, true),
('app', 'Continuous app maintenance, feature upgrades and bug fixes', '', 'more', 11, true),

-- AI Automation Main Services
('ai', 'WhatsApp Automation', 'Automatic replies to customers on WhatsApp, greeting new visitors, sharing catalogs, and qualifying leads.', 'main', 1, true),
('ai', 'AI Voice Agent', 'Answers business enquiry calls intelligently, provides details, and schedules callbacks.', 'main', 2, true),
('ai', 'AI Chatbot for Your Website', 'Handles customer enquiries 24x7 directly on your website and captures contact numbers.', 'main', 3, true),
('ai', 'Lead Management Automation', 'Syncs incoming customer enquiries instantly to Google Sheets, CRM, and sales team phones.', 'main', 4, true),
('ai', 'Follow-Up Reminders', 'Automated follow-up messages on WhatsApp for pending quotations and customer decisions.', 'main', 5, true),
('ai', 'Customer Support Automation', 'Resolves frequent customer queries (timings, pricing, location, order status) without manual effort.', 'main', 6, true),
-- AI Automation More Services
('ai', 'Auto invoices and payment reminder workflows', '', 'more', 7, true),
('ai', 'Email and social media inquiry automation', '', 'more', 8, true),
('ai', 'Data entry and document processing automation', '', 'more', 9, true),
('ai', 'AI content and marketing copy tools', '', 'more', 10, true),
('ai', 'Google Sheets, Zoho, Excel and CRM integrations', '', 'more', 11, true),
('ai', 'Custom AI agents tailored for your unique business operations', '', 'more', 12, true);

-- 4. Insert Packages (Basic, Standard, Premium style)
INSERT INTO public.packages (domain_id, name, price, features, is_popular, sort_order, is_active) VALUES
('web', 'Starter Web Presence', 7000, '["Single-page fast responsive landing site", "Direct WhatsApp chat button & Call CTA", "Mobile, tablet & desktop optimized", "Google Maps & Google Business profile link", "Free SSL certificate & fast cloud hosting setup", "7 days turnaround time"]'::jsonb, false, 1, true),
('web', 'Business Growth Showcase', 14500, '["Up to 5 custom pages (Home, About, Services, Gallery, Contact)", "Full service/product visual showcase catalog", "Customer enquiry form with database & WhatsApp sync", "On-page SEO optimization & metadata", "Google Search Console indexing", "30 days free support & maintenance"]'::jsonb, true, 2, true),
('app', 'Shop Billing & Udhar App', 10000, '["Fast barcode scanning & POS billing", "GST & non-GST thermal receipt printing", "Customer credit ledger (Udhar tracking & WhatsApp reminders)", "Daily cash in hand & profit report on mobile", "Tamper-proof calculations & offline support", "Free staff training session"]'::jsonb, true, 3, true),
('app', 'Complete Business Management App', 22000, '["Multi-user roles (Owner, Manager, Cashier)", "Live warehouse stock alerts & supplier order records", "Staff attendance & payroll calculation", "Cloud backup & multi-device sync", "Android APK + Web dashboard included", "3 months priority bugfix guarantee"]'::jsonb, false, 4, true),
('ai', 'WhatsApp 24/7 Auto-Responder', 6000, '["Official or QR WhatsApp automation setup", "Instant replies with price cards & catalog PDF", "Lead qualification & phone number capture", "Instant alert on owner mobile for hot leads", "Custom business greeting & FAQ answering", "Quick 48-hour deployment"]'::jsonb, true, 5, true),
('ai', 'AI Voice & Lead Pipeline Suite', 16000, '["AI Voice Agent for telephone enquiry triage", "Website AI chatbot widget trained on your business", "Sync leads automatically to Google Sheets & CRM", "Automated follow-up WhatsApp reminders for pending quotes", "Weekly analytics of customer questions and conversions", "Dedicated onboarding & testing"]'::jsonb, false, 6, true);

-- 5. Insert Projects
INSERT INTO public.projects (title, domain_id, client_category, description, technologies, metrics, link, image_url, sort_order, is_active) VALUES
('Reddy Multi-Specialty Dental Clinic', 'web', 'Healthcare & Clinics', 'Modern showcase website with online WhatsApp appointment booking and treatment price charts.', ARRAY['React', 'Vite', 'Cloud Hosting', 'SEO'], '3x WhatsApp appointments in 30 days', 'https://wa.me/916302690251', '/projects/clinic-web.svg', 1, true),
('Sri Lakshmi Silks & Sarees POS Billing App', 'app', 'Retail Clothing & Textiles', 'Fast barcode billing and customer credit (udhar) tracker with thermal printing and SMS alerts.', ARRAY['Flutter', 'PostgreSQL', 'Thermal Bluetooth API'], 'Saved ₹18,000/mo in bookkeeping fees', 'https://wa.me/916302690251', '/projects/saree-app.svg', 2, true),
('Varma Logistics 24/7 AI WhatsApp Dispatcher', 'ai', 'Logistics & Cargo', 'Intelligent WhatsApp auto-responder providing instant freight freight quotes and driver status.', ARRAY['Python', 'FastAPI', 'WhatsApp Cloud API', 'GPT-4o'], '35% higher booking rate after hours', 'https://wa.me/916302690251', '/projects/dispatch-ai.svg', 3, true),
('Modern Home Interiors Showcase Portal', 'web', 'Interior Design & Architecture', 'High-resolution project gallery with cost calculator and customer lead capture.', ARRAY['React', 'CSS Modules', 'Supabase'], 'Over 80 qualified local leads generated', 'https://wa.me/916302690251', '/projects/interior-web.svg', 4, true),
('SuperFresh Mart Grocery Delivery & Billing App', 'app', 'Supermarkets & Groceries', 'Android app with barcode scanner, inventory re-ordering, and delivery boy dispatch tracking.', ARRAY['React Native', 'Node.js', 'PostgreSQL'], '50% faster checkout during peak hours', 'https://wa.me/916302690251', '/projects/mart-app.svg', 5, true),
('Apex Solar Solutions Lead Automation', 'ai', 'Renewable Energy', 'Automated solar quote generator syncing directly to Google Sheets and sending instant PDF proposals.', ARRAY['Make.com', 'Google Sheets API', 'WhatsApp Bot'], 'Response time reduced from 4 hours to 30 seconds', 'https://wa.me/916302690251', '/projects/solar-ai.svg', 6, true);

-- 6. Insert Testimonials
INSERT INTO public.testimonials (client_name, business, domain_id, rating, message, sort_order, is_active) VALUES
('Dr. Ramesh Reddy', 'Reddy Multi-Specialty Dental Clinic, Hyderabad', 'web', 5, 'Lingaswamy built our clinic showcase website in just 4 days. Patients can now easily view treatments, doctors, and book appointments directly on WhatsApp. Super fast delivery and extremely affordable!', 1, true),
('Suresh Patel', 'Patel Wholesale Electricals, Secunderabad', 'app', 5, 'The custom billing and stock app replaced our expensive accounting software. We save at least ₹18,000 every month on accountant salaries, and I can check my shop daily sales on my phone from anywhere.', 2, true),
('Vikram Varma', 'Varma Logistics & Transport, Vijayawada', 'ai', 5, 'The 24/7 WhatsApp AI automation handles late-night freight rate queries instantly. We turned 35% more leads into booked orders within the first month itself.', 3, true),
('Ananya Sharma', 'TrendBoutique Ethnic Studio, Bangalore', 'web', 5, 'Great design aesthetic, mobile responsive, and honest pricing. Lingaswamy is always available on phone and WhatsApp without any corporate bureaucracy.', 4, true);

-- 7. Insert FAQs
INSERT INTO public.faqs (category, question, answer, sort_order, is_active) VALUES
('General', 'What makes ZippyTechSystems different from other agencies in India?', 'We eliminate bloated agency overhead and middleman layers. You communicate directly with founder Lingaswamy on WhatsApp or call. We provide transparent starting prices (Web from ₹7k, App from ₹10k, AI from ₹6k) and deliver production-ready software in 48 hours to 7 days.', 1, true),
('Web', 'What is included in the ₹7,000 Web Development starting package?', 'It includes a modern responsive business website, custom domain connection, lightning-fast cloud hosting setup, mobile optimization, WhatsApp direct integration, contact form, and Google Search Console/SEO basics.', 2, true),
('App', 'How does your business app help save on accountant salaries?', 'Our custom mobile & web applications automate day-to-day billing, GST invoice generation, thermal print receipts, customer udhar (credit ledger), and stock levels. Because calculations and reports are automated and tamper-proof, shop owners do not need to hire a full-time accountant for daily entries.', 3, true),
('AI', 'How does WhatsApp AI Automation work when our shop is closed?', 'Our AI agent connects to your WhatsApp business number. When a customer messages at night or during peak rush hours, the AI answers product questions, shares price lists or catalogs, collects their requirements, and syncs their phone number to your dashboard or Google Sheet.', 4, true),
('General', 'What are your payment terms and milestones?', 'We work with clear, risk-free milestones: a small advance to initiate the architecture and wireframing, milestone reviews where you inspect the live demo, and final payment upon your 100% satisfaction and handover.', 5, true),
('General', 'Do you offer ongoing support and maintenance?', 'Yes! All projects come with 30 days of complimentary post-launch support. Afterward, we provide affordable yearly maintenance packages covering security updates, server monitoring, backups, and feature tweaks.', 6, true);
