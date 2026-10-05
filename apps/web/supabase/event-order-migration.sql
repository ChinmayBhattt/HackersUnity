-- ==============================================================================
-- Hacker's Unity - Event Showcase Ordering Migration
-- Run this in your Supabase SQL Editor: Dashboard -> SQL Editor -> New Query
-- ==============================================================================

-- 1. Add display_order column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 999999;

-- 2. Create index for fast sorting
CREATE INDEX IF NOT EXISTS idx_events_display_order ON public.events (display_order ASC);

-- 3. Comment for documentation
COMMENT ON COLUMN public.events.display_order IS 'Order position for homepage showcase (0 = first / starting event)';
