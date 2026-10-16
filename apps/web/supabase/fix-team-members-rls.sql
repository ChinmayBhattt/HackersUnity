-- ==============================================================================
-- Hacker's Unity Platform - Fix Team Members RLS & Multi-Squad Visibility
-- Run this in Supabase Dashboard -> SQL Editor -> New Query
-- Ensures all squad members and teammates can view the full squad roster
-- ==============================================================================

-- 1. Ensure team_members table has public read access (just like teams, profiles, submissions)
-- Previously, RLS checked: auth.uid() = user_id OR auth.uid() IN (SELECT leader_id FROM teams WHERE id = team_id)
-- which prevented team members from seeing other members who joined their squad!
DROP POLICY IF EXISTS "Team members can view their team" ON public.team_members;
DROP POLICY IF EXISTS "Allow authenticated users to read team_members" ON public.team_members;
DROP POLICY IF EXISTS "Public can view team members" ON public.team_members;

CREATE POLICY "Public can view team members"
  ON public.team_members FOR SELECT
  USING (true);

-- 2. Ensure leader and member insert permissions
DROP POLICY IF EXISTS "Team leaders can add members" ON public.team_members;
CREATE POLICY "Team leaders can add members"
  ON public.team_members FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- 3. Ensure leader and member delete permissions (leave squad or remove member)
DROP POLICY IF EXISTS "Team leaders can remove members" ON public.team_members;
DROP POLICY IF EXISTS "Allow authenticated users to delete team_members" ON public.team_members;
CREATE POLICY "Allow authenticated users to delete team_members"
  ON public.team_members FOR DELETE
  USING (
    auth.uid() = user_id
    OR auth.uid() IN (SELECT leader_id FROM public.teams WHERE id = team_id)
  );

-- 4. Create helpful indexes if missing
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members (team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members (user_id);
