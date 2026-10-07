-- ==============================================================================
-- Hacker's Unity Platform - Payments Migration (Razorpay Integration)
-- File: apps/web/supabase/payments-migration.sql
-- Run this script in your Supabase SQL Editor: Dashboard -> SQL Editor -> New Query
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── 1. ALTER EVENTS TABLE (Fee and Registration Type) ────────────────────────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS entry_fee NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR',
  ADD COLUMN IF NOT EXISTS registration_type TEXT DEFAULT 'FREE';

-- ─── 2. ALTER TEAMS TABLE (Payment tracking at squad level) ───────────────────
ALTER TABLE public.teams
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'UNPAID',
  ADD COLUMN IF NOT EXISTS payment_id UUID;

-- ─── 3. ALTER REGISTRATIONS TABLE (Payment link and team relation) ────────────
ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'UNPAID',
  ADD COLUMN IF NOT EXISTS payment_id UUID;

-- ─── 4. CREATE PAYMENTS TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- Relational Foreign Keys
  event_id UUID REFERENCES public.events(id) ON DELETE RESTRICT NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  registration_id UUID REFERENCES public.registrations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL NOT NULL,
  
  -- Mandatory Display & Ledger Fields
  event_name TEXT NOT NULL,
  team_name TEXT NOT NULL,
  team_type TEXT DEFAULT 'Squad', -- 'Solo' or 'Squad'
  team_size INTEGER DEFAULT 1,
  
  team_leader_name TEXT NOT NULL,
  team_leader_email TEXT NOT NULL,
  team_leader_phone TEXT,
  
  -- Financial Info
  amount NUMERIC NOT NULL, -- In rupees (e.g. 59.00)
  amount_in_paise INTEGER NOT NULL, -- In paise (e.g. 5900)
  currency TEXT DEFAULT 'INR' NOT NULL,
  
  -- Razorpay Transaction Details
  razorpay_order_id TEXT UNIQUE NOT NULL,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  payment_method TEXT, -- 'upi', 'card', 'netbanking', 'wallet'
  utr_number TEXT, -- Acquirer RRN, UPI reference, or bank transaction ID
  receipt_number TEXT UNIQUE NOT NULL,
  
  -- Status Lifecycle
  status TEXT DEFAULT 'CREATED' NOT NULL 
    CHECK (status IN ('CREATED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  
  -- Refund Information
  refund_status TEXT, -- 'PENDING', 'PROCESSED', 'FAILED'
  refund_id TEXT,
  amount_refunded NUMERIC DEFAULT 0,
  
  -- Metadata & Timestamps
  notes JSONB DEFAULT '{}'::jsonb,
  raw_response JSONB DEFAULT '{}'::jsonb,
  transaction_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ─── 5. INDEXES FOR HIGH-PERFORMANCE LOOKUPS ─────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON public.payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_team_id ON public.payments(team_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_order_id ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON public.payments(razorpay_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_registrations_team_id ON public.registrations(team_id);
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status ON public.registrations(payment_status);

-- ─── 6. ROW LEVEL SECURITY (RLS) POLICIES ────────────────────────────────────
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- 1. Participants can view their own payments
DROP POLICY IF EXISTS "Participants can view their own payments" ON public.payments;
CREATE POLICY "Participants can view their own payments" ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Event organizers can view payments for events they organize
DROP POLICY IF EXISTS "Organizers can view payments for their events" ON public.payments;
CREATE POLICY "Organizers can view payments for their events" ON public.payments
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT organizer_id FROM public.events WHERE id = event_id
    )
  );

-- 3. Strict Write Protection:
-- Only service role (server-side Next.js route handlers) can INSERT/UPDATE/DELETE.
-- Normal client users cannot forge payments directly through client-side Supabase SDK.
DROP POLICY IF EXISTS "Service role has full access to payments" ON public.payments;
CREATE POLICY "Service role has full access to payments" ON public.payments
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ─── 7. AUTOMATED UPDATED_AT TIMESTAMP TRIGGER ──────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_payments_updated_at ON public.payments;
CREATE TRIGGER trigger_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_payments_updated_at();
