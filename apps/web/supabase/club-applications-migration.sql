-- ==============================================================================
-- Hacker's Unity Platform - Club & Campus Chapter Applications Migration
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New query
-- ==============================================================================

-- 1. Create Club Applications Table
CREATE TABLE IF NOT EXISTS public.club_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_name TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_phone TEXT NOT NULL,
  college_name TEXT NOT NULL,
  college_city TEXT NOT NULL,
  college_state TEXT NOT NULL,
  role_in_college TEXT NOT NULL,
  academic_year TEXT,
  club_name TEXT,
  expected_members TEXT,
  why_start_club TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_REVIEW', 'APPROVED', 'REJECTED')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.club_applications ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Anyone (including unauthenticated guests / students) can submit a club application
DROP POLICY IF EXISTS "Anyone can submit club application" ON public.club_applications;
CREATE POLICY "Anyone can submit club application"
  ON public.club_applications
  FOR INSERT
  WITH CHECK (true);

-- 4. Policy: Admins can view all club applications
DROP POLICY IF EXISTS "Admins can view club applications" ON public.club_applications;
CREATE POLICY "Admins can view club applications"
  ON public.club_applications
  FOR SELECT
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
  );

-- 5. Policy: Admins can update application status
DROP POLICY IF EXISTS "Admins can update club applications" ON public.club_applications;
CREATE POLICY "Admins can update club applications"
  ON public.club_applications
  FOR UPDATE
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'ADMIN')
  );

-- 6. Indexes for optimized queries
CREATE INDEX IF NOT EXISTS idx_club_applications_email ON public.club_applications(applicant_email);
CREATE INDEX IF NOT EXISTS idx_club_applications_college ON public.club_applications(college_name);
CREATE INDEX IF NOT EXISTS idx_club_applications_status ON public.club_applications(status);
CREATE INDEX IF NOT EXISTS idx_club_applications_created_at ON public.club_applications(created_at DESC);
