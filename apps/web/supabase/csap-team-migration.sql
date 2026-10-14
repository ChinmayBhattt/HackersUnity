-- ==============================================================================
-- Hacker's Unity Platform - CSAP Admin Team & Role-Based Access Migration
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New Query
-- ==============================================================================

-- 1. Create CSAP Admin Team Table
CREATE TABLE IF NOT EXISTS public.csap_team (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'manager', 'viewer')),
  name TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'invited')),
  added_by TEXT DEFAULT 'system',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Unique Index on lower-cased email
CREATE UNIQUE INDEX IF NOT EXISTS idx_csap_team_email_lower ON public.csap_team(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_csap_team_role ON public.csap_team(role);
CREATE INDEX IF NOT EXISTS idx_csap_team_status ON public.csap_team(status);

-- 3. Seed Root Owner (Replace with your ADMIN_EMAIL from .env.local)
INSERT INTO public.csap_team (email, role, name, status, added_by)
VALUES (
  'admin@hackersunity.com', -- REPLACE with your ADMIN_EMAIL from .env.local
  'owner',
  'Platform Owner',
  'active',
  'system_root'
)
ON CONFLICT (LOWER(email)) DO UPDATE
SET 
  role = 'owner',
  status = 'active',
  name = COALESCE(public.csap_team.name, EXCLUDED.name),
  updated_at = NOW();

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.csap_team ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access
DROP POLICY IF EXISTS "Service role full access to csap_team" ON public.csap_team;
CREATE POLICY "Service role full access to csap_team" ON public.csap_team
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow active CSAP team members to read team members
DROP POLICY IF EXISTS "Active team members can view csap_team" ON public.csap_team;
CREATE POLICY "Active team members can view csap_team" ON public.csap_team
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.csap_team ct
      WHERE LOWER(ct.email) = LOWER(auth.jwt() ->> 'email')
        AND ct.status = 'active'
    )
  );

-- 5. Enable Realtime sync for instant team updates
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'csap_team'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.csap_team;
  END IF;
END $$;
