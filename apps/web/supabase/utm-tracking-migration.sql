-- ==============================================================================
-- Hacker's Unity Platform - UTM Tracking & Affiliate/Referral System Migration
-- Run this script in your Supabase SQL Editor: Dashboard -> SQL Editor -> New query
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Main UTM Links Table (Track custom links per event & linked platform user)
CREATE TABLE IF NOT EXISTS public.event_utm_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  event_slug TEXT NOT NULL,
  code TEXT NOT NULL,
  custom_name TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  clicks_count INTEGER DEFAULT 0,
  confirmed_registrations_count INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT event_code_unique UNIQUE (event_id, code)
);

-- 2. UTM Clicks Table (Tracks click activity and unique visits)
CREATE TABLE IF NOT EXISTS public.event_utm_clicks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  utm_link_id UUID REFERENCES public.event_utm_links(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. UTM Registrations Table (Tracks conversions credited to each promoter's link)
CREATE TABLE IF NOT EXISTS public.event_utm_registrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  utm_link_id UUID REFERENCES public.event_utm_links(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  registration_id UUID,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT NOT NULL,
  status TEXT DEFAULT 'CONFIRMED',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT event_utm_registration_unique UNIQUE (utm_link_id, user_email)
);

-- 4. Fast Query Indexes
CREATE INDEX IF NOT EXISTS idx_utm_links_event_id ON public.event_utm_links(event_id);
CREATE INDEX IF NOT EXISTS idx_utm_links_code ON public.event_utm_links(code);
CREATE INDEX IF NOT EXISTS idx_utm_links_user_id ON public.event_utm_links(user_id);
CREATE INDEX IF NOT EXISTS idx_utm_clicks_utm_link ON public.event_utm_clicks(utm_link_id);
CREATE INDEX IF NOT EXISTS idx_utm_reg_utm_link ON public.event_utm_registrations(utm_link_id);
CREATE INDEX IF NOT EXISTS idx_utm_reg_event ON public.event_utm_registrations(event_id);

-- 5. Row Level Security Policies
ALTER TABLE public.event_utm_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_utm_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_utm_registrations ENABLE ROW LEVEL SECURITY;

-- Allow reading UTM links to anyone (needed for link routing & public attribution)
DROP POLICY IF EXISTS "Allow read access to all on event_utm_links" ON public.event_utm_links;
CREATE POLICY "Allow read access to all on event_utm_links" ON public.event_utm_links FOR SELECT USING (true);

-- Allow admins and service role full management
DROP POLICY IF EXISTS "Allow all on event_utm_links to authenticated" ON public.event_utm_links;
CREATE POLICY "Allow all on event_utm_links to authenticated" ON public.event_utm_links FOR ALL USING (true) WITH CHECK (true);

-- Allow logging clicks
DROP POLICY IF EXISTS "Allow insert clicks to all" ON public.event_utm_clicks;
CREATE POLICY "Allow insert clicks to all" ON public.event_utm_clicks FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read clicks to all" ON public.event_utm_clicks;
CREATE POLICY "Allow read clicks to all" ON public.event_utm_clicks FOR SELECT USING (true);

-- Allow recording registrations
DROP POLICY IF EXISTS "Allow insert registrations to all" ON public.event_utm_registrations;
CREATE POLICY "Allow insert registrations to all" ON public.event_utm_registrations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow read registrations to all" ON public.event_utm_registrations;
CREATE POLICY "Allow read registrations to all" ON public.event_utm_registrations FOR SELECT USING (true);
