-- =========================================================================
-- Migration: Design Features, Media Storage & Dynamic Settings
-- ZippyTechSystems Portfolio Platform
-- Idempotent, re-runnable with IF NOT EXISTS and DROP POLICY IF EXISTS
-- =========================================================================

-- 1. DESIGN SETTINGS TABLE (Single row)
CREATE TABLE IF NOT EXISTS public.design_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  hero_style TEXT DEFAULT 'mesh' CHECK (hero_style IN ('3d', 'mesh', 'gradient')),
  video_background_url TEXT,
  video_poster_url TEXT,
  particles_enabled BOOLEAN DEFAULT true,
  cursor_effect_enabled BOOLEAN DEFAULT true,
  magnetic_buttons_enabled BOOLEAN DEFAULT true,
  parallax_enabled BOOLEAN DEFAULT true,
  horizontal_portfolio_enabled BOOLEAN DEFAULT true,
  lottie_enabled BOOLEAN DEFAULT true,
  tooltip_enabled BOOLEAN DEFAULT true,
  quality_override TEXT DEFAULT 'auto' CHECK (quality_override IN ('auto', 'full', 'lite', 'reduced')),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial default row if missing
INSERT INTO public.design_settings (
  id,
  hero_style,
  particles_enabled,
  cursor_effect_enabled,
  magnetic_buttons_enabled,
  parallax_enabled,
  horizontal_portfolio_enabled,
  lottie_enabled,
  tooltip_enabled,
  quality_override
)
VALUES (
  1,
  'mesh',
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  'auto'
)
ON CONFLICT (id) DO NOTHING;

-- 2. CLIENT LOGOS TABLE
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  website TEXT,
  alt_text TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_active_sort ON public.clients (is_active, sort_order);

-- 3. PROCESS STEPS TABLE
CREATE TABLE IF NOT EXISTS public.process_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_key TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_process_steps_active_sort ON public.process_steps (is_active, sort_order);

-- Seed initial default 4 process steps if empty
INSERT INTO public.process_steps (step_number, title, description, icon_key, is_active, sort_order)
SELECT 1, 'Requirement Gathering', 'We discuss your exact business workflow and pricing targets directly on WhatsApp or phone.', 'MessageCircle', true, 1
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE step_number = 1);

INSERT INTO public.process_steps (step_number, title, description, icon_key, is_active, sort_order)
SELECT 2, 'Architecture & Rapid Prototype', 'We design a clean, responsive prototype tailored to your brand colors and Indian customers.', 'Layers', true, 2
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE step_number = 2);

INSERT INTO public.process_steps (step_number, title, description, icon_key, is_active, sort_order)
SELECT 3, 'Full-Stack Development', 'Production code built with modern frameworks, Razorpay/UPI payments, and sub-second load times.', 'Cpu', true, 3
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE step_number = 3);

INSERT INTO public.process_steps (step_number, title, description, icon_key, is_active, sort_order)
SELECT 4, 'Launch & Ongoing Support', 'We deploy on cloud hosting with free SSL, setup your domain, and provide continuous warranty.', 'ShieldCheck', true, 4
WHERE NOT EXISTS (SELECT 1 FROM public.process_steps WHERE step_number = 4);

-- 4. TECHNOLOGIES TABLE
CREATE TABLE IF NOT EXISTS public.technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon_key TEXT,
  category TEXT DEFAULT 'Frontend',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_technologies_active ON public.technologies (is_active, sort_order);

-- 5. SITE STATISTICS TABLE
CREATE TABLE IF NOT EXISTS public.site_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  value_number INT NOT NULL,
  prefix TEXT DEFAULT '',
  suffix TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial stats
INSERT INTO public.site_stats (stat_key, label, value_number, prefix, suffix, sort_order, is_active)
VALUES
  ('projects_delivered', 'Projects Delivered', 24, '', '+', 1, true),
  ('avg_delivery_days', 'Fast Delivery Rate', 7, '<', ' Days', 2, true),
  ('client_satisfaction', 'Client Retention & Satisfaction', 99, '', '%', 3, true),
  ('direct_support', 'Founder Direct Response', 24, '<', 'h', 4, true)
ON CONFLICT (stat_key) DO NOTHING;

-- 6. BEFORE & AFTER CASE STUDIES
CREATE TABLE IF NOT EXISTS public.before_after (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  domain TEXT NOT NULL,
  before_metric TEXT,
  after_metric TEXT,
  before_description TEXT,
  after_description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. EXTEND PROJECTS TABLE (if missing columns)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'video_url') THEN
    ALTER TABLE public.projects ADD COLUMN video_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'poster_url') THEN
    ALTER TABLE public.projects ADD COLUMN poster_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'gallery') THEN
    ALTER TABLE public.projects ADD COLUMN gallery JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'tech_stack') THEN
    ALTER TABLE public.projects ADD COLUMN tech_stack JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'is_featured') THEN
    ALTER TABLE public.projects ADD COLUMN is_featured BOOLEAN DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'alt_text') THEN
    ALTER TABLE public.projects ADD COLUMN alt_text TEXT;
  END IF;
END $$;

-- 8. EXTEND TESTIMONIALS TABLE (if missing columns)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'testimonials' AND column_name = 'photo_url') THEN
    ALTER TABLE public.testimonials ADD COLUMN photo_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'testimonials' AND column_name = 'rating') THEN
    ALTER TABLE public.testimonials ADD COLUMN rating INT DEFAULT 5;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'testimonials' AND column_name = 'is_approved') THEN
    ALTER TABLE public.testimonials ADD COLUMN is_approved BOOLEAN DEFAULT true;
  END IF;
END $$;

-- 9. EXTEND ENQUIRIES TABLE FOR PROJECT BUILDER
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enquiries' AND column_name = 'selected_services') THEN
    ALTER TABLE public.enquiries ADD COLUMN selected_services JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enquiries' AND column_name = 'budget_range') THEN
    ALTER TABLE public.enquiries ADD COLUMN budget_range TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enquiries' AND column_name = 'timeline') THEN
    ALTER TABLE public.enquiries ADD COLUMN timeline TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enquiries' AND column_name = 'business_type') THEN
    ALTER TABLE public.enquiries ADD COLUMN business_type TEXT;
  END IF;
END $$;

-- 10. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.design_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.before_after ENABLE ROW LEVEL SECURITY;

-- 11. RLS POLICIES: PUBLIC READ ACCESS FOR ACTIVE CONTENT
DROP POLICY IF EXISTS "Public can view design settings" ON public.design_settings;
CREATE POLICY "Public can view design settings" ON public.design_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can view active clients" ON public.clients;
CREATE POLICY "Public can view active clients" ON public.clients
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view active process steps" ON public.process_steps;
CREATE POLICY "Public can view active process steps" ON public.process_steps
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view active technologies" ON public.technologies;
CREATE POLICY "Public can view active technologies" ON public.technologies
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view active site stats" ON public.site_stats;
CREATE POLICY "Public can view active site stats" ON public.site_stats
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Public can view active before-after" ON public.before_after;
CREATE POLICY "Public can view active before-after" ON public.before_after
  FOR SELECT USING (is_active = true);

-- 12. RLS POLICIES: ADMIN FULL ACCESS
-- Checks against authenticated email or ID in admins table
DROP POLICY IF EXISTS "Admins manage design settings" ON public.design_settings;
CREATE POLICY "Admins manage design settings" ON public.design_settings
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM public.admins) OR
    auth.uid() IN (SELECT id FROM public.admins)
  );

DROP POLICY IF EXISTS "Admins manage clients" ON public.clients;
CREATE POLICY "Admins manage clients" ON public.clients
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM public.admins) OR
    auth.uid() IN (SELECT id FROM public.admins)
  );

DROP POLICY IF EXISTS "Admins manage process steps" ON public.process_steps;
CREATE POLICY "Admins manage process steps" ON public.process_steps
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM public.admins) OR
    auth.uid() IN (SELECT id FROM public.admins)
  );

DROP POLICY IF EXISTS "Admins manage technologies" ON public.technologies;
CREATE POLICY "Admins manage technologies" ON public.technologies
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM public.admins) OR
    auth.uid() IN (SELECT id FROM public.admins)
  );

DROP POLICY IF EXISTS "Admins manage site stats" ON public.site_stats;
CREATE POLICY "Admins manage site stats" ON public.site_stats
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM public.admins) OR
    auth.uid() IN (SELECT id FROM public.admins)
  );

DROP POLICY IF EXISTS "Admins manage before-after" ON public.before_after;
CREATE POLICY "Admins manage before-after" ON public.before_after
  FOR ALL TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (SELECT email FROM public.admins) OR
    auth.uid() IN (SELECT id FROM public.admins)
  );

-- 13. STORAGE BUCKETS SETUP (Public read, Admin write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('client-logos', 'client-logos', true, 2097152, ARRAY['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp']),
  ('project-media', 'project-media', true, 20971520, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm']),
  ('site-media', 'site-media', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/webp', 'video/mp4', 'video/webm'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Public can view client logos" ON storage.objects;
CREATE POLICY "Public can view client logos" ON storage.objects
  FOR SELECT USING (bucket_id IN ('client-logos', 'project-media', 'site-media'));

DROP POLICY IF EXISTS "Admins can upload media" ON storage.objects;
CREATE POLICY "Admins can upload media" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id IN ('client-logos', 'project-media', 'site-media') AND
    (
      auth.jwt() ->> 'email' IN (SELECT email FROM public.admins) OR
      auth.uid() IN (SELECT id FROM public.admins)
    )
  );
