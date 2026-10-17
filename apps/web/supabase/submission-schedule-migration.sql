-- ==============================================================================
-- Hacker's Unity Platform - Submission Window / Schedule Migration
-- Enables organizing teams to configure submission start/end dates and toggle portal
-- Run this script in your Supabase SQL Editor: Dashboard -> SQL Editor -> New query
-- ==============================================================================

-- 1. Ensure events table has submissions_enabled, submission_start_date, and submission_deadline
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS submissions_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS submission_start_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS submission_deadline TIMESTAMPTZ;

-- 2. Update existing events to have submissions_enabled = TRUE if NULL
UPDATE public.events
SET submissions_enabled = TRUE
WHERE submissions_enabled IS NULL;

-- 3. Comments on columns for documentation
COMMENT ON COLUMN public.events.submissions_enabled IS 'Controls whether project submissions are permitted for this hackathon';
COMMENT ON COLUMN public.events.submission_start_date IS 'Start timestamp (with timezone) when project submissions open';
COMMENT ON COLUMN public.events.submission_deadline IS 'End timestamp (with timezone) when project submissions automatically close';
