-- ==============================================================================
-- Hacker's Unity Platform - External Registration Redirect Migration
-- Run this script in your Supabase SQL Editor: Dashboard -> SQL Editor -> New query
-- ==============================================================================

-- 1. Ensure events table has allow_external_redirect and registration_link columns
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS allow_external_redirect BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS registration_link TEXT;

-- 2. Backfill existing allow_external_redirect and registration_link from tags if stored in tags
UPDATE public.events
SET allow_external_redirect = TRUE
WHERE (allow_external_redirect IS NOT TRUE OR allow_external_redirect IS NULL)
  AND 'allow_external_redirect' = ANY(tags);

-- 3. Comments for documentation
COMMENT ON COLUMN public.events.allow_external_redirect IS 'Whether the event is permitted to redirect registration to an external portal';
COMMENT ON COLUMN public.events.registration_link IS 'The URL of the external registration portal';
