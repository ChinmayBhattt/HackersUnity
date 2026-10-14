'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Crown,
  Shield,
  Eye,
  Sliders,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Mail,
  User,
  Clock,
  Sparkles,
  Info,
  Check,
  ExternalLink,
  Copy,
  Lock,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export type CsapRole = 'owner' | 'admin' | 'manager' | 'viewer';

export interface CsapTeamMember {
  id: string;
  email: string;
  role: CsapRole;
  name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  status: 'active' | 'suspended' | 'invited';
  added_by?: string | null;
  created_at: string;
  updated_at?: string;
}

interface AdminTeamManagementProps {
  onNotification: (msg: { type: 'success' | 'error'; text: string }) => void;
  currentUserRole?: CsapRole | null;
  currentEmail?: string | null;
  onTeamCountUpdate?: (count: number) => void;
}

const ROOT_OWNER_EMAIL = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').trim().toLowerCase();

const ROLE_CONFIG: Record<
  CsapRole,
  {
    title: string;
    description: string;
    badgeClass: string;
    icon: React.ReactNode;
    color: string;
    permissions: string[];
  }
> = {
  owner: {
    title: 'Owner / Super Admin',
    description: 'Full unconstrained system authority, team governance, and root management.',
    badgeClass: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    icon: <Crown className="w-3.5 h-3.5 text-amber-500" />,
    color: '#a855f7',
    permissions: [
      'Manage & invite CSAP Team members',
      'Change team member roles & revoke access',
      'Approve, reject, edit & delete hackathons',
      'Approve, reject & delete community blogs',
      'Review & moderate mentor applications',
      'Control showcase order & platform settings',
      'Protected from deletion or role changes',
    ],
  },
  admin: {
    title: 'Administrator',
    description: 'Full content moderation and operational supervision across the platform.',
    badgeClass: 'bg-sky-500/15 text-[#0099e6] dark:text-[#38bdf8] border-sky-500/30',
    icon: <Shield className="w-3.5 h-3.5 text-[#0099e6]" />,
    color: '#0099e6',
    permissions: [
      'View team registry & invite Managers / Viewers',
      'Approve, reject, edit & delete hackathons',
      'Approve, reject & delete community blogs',
      'Review, approve & reject mentor applications',
      'Reorder showcase list for homepage',
      'Cannot remove or modify Owner role',
    ],
  },
  manager: {
    title: 'Moderation Manager',
    description: 'Operational reviewing and approving of hackathons, blogs, and mentors.',
    badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    icon: <Sliders className="w-3.5 h-3.5 text-emerald-500" />,
    color: '#10b981',
    permissions: [
      'Review & approve / reject host hackathon requests',
      'Review & approve / reject submitted blogs',
      'Review & approve / reject mentor applications',
      'Cannot delete hackathons, blogs, or mentors',
      'Cannot manage or invite team members',
      'Cannot reorder homepage showcase',
    ],
  },
  viewer: {
    title: 'Auditor / Viewer',
    description: 'Read-only visibility for reporting, statistics, and auditing.',
    badgeClass: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30',
    icon: <Eye className="w-3.5 h-3.5 text-slate-500" />,
    color: '#64748b',
    permissions: [
      'View all incoming hackathons and host submissions',
      'View registrations count and submission stats',
      'Read draft and pending community blogs',
      'View mentor profiles and application details',
      'All approval, editing, and deletion buttons disabled',
      'Read-only access across all sections',
    ],
  },
};

export function AdminTeamManagement({
  onNotification,
  currentUserRole = 'owner',
  currentEmail,
  onTeamCountUpdate,
}: AdminTeamManagementProps) {
  const [members, setMembers] = useState<CsapTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tableReady, setTableReady] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<CsapRole>('manager');
  const [isAdding, setIsAdding] = useState(false);

  // Edit role modal state
  const [editingMember, setEditingMember] = useState<CsapTeamMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<CsapRole>('viewer');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Delete modal state
  const [deletingMember, setDeletingMember] = useState<CsapTeamMember | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Copy SQL feedback
  const [copiedSql, setCopiedSql] = useState(false);

  // Permissions helpers
  const canManageTeam = currentUserRole === 'owner' || currentUserRole === 'admin';
  const isOwner = currentUserRole === 'owner';

  // ─── Fetch Team Members ──────────────────────────────────────────────────────
  const fetchTeam = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/admin-csap?resource=team', {
        headers,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.authorized) {
          setMembers(data.team || []);
          setTableReady(data.tableReady !== false);
          if (onTeamCountUpdate) {
            onTeamCountUpdate((data.team || []).length);
          }
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        onNotification({
          type: 'error',
          text: errData.error || 'Failed to fetch team members',
        });
      }
    } catch (err: any) {
      console.error('Fetch team error:', err);
      onNotification({
        type: 'error',
        text: err.message || 'Error loading team data',
      });
    } finally {
      setLoading(false);
    }
  }, [onNotification, onTeamCountUpdate]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  // ─── Realtime Supabase Subscription ──────────────────────────────────────────
  useEffect(() => {
    const channel = supabase
      .channel('public:csap_team_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'csap_team' },
        () => {
          fetchTeam();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTeam]);

  // ─── Add Member Handler ──────────────────────────────────────────────────────
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = newEmail.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      onNotification({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    if (newRole === 'owner' && !isOwner) {
      onNotification({
        type: 'error',
        text: 'Only the current Owner can appoint another Owner.',
      });
      return;
    }

    setIsAdding(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/admin-csap', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'add_team_member',
          email: cleanEmail,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onNotification({
          type: 'success',
          text: `🎉 Granted ${newRole.toUpperCase()} access to ${cleanEmail}`,
        });
        setIsAddModalOpen(false);
        setNewEmail('');
        setNewRole('manager');
        fetchTeam();
      } else {
        onNotification({
          type: 'error',
          text: data.error || 'Failed to add team member',
        });
      }
    } catch (err: any) {
      onNotification({
        type: 'error',
        text: err.message || 'Network error adding team member',
      });
    } finally {
      setIsAdding(false);
    }
  };

  // ─── Update Role Handler ─────────────────────────────────────────────────────
  const handleUpdateRole = async () => {
    if (!editingMember) return;

    if (editingMember.email.toLowerCase() === ROOT_OWNER_EMAIL) {
      onNotification({
        type: 'error',
        text: 'Root Owner role is protected and cannot be changed.',
      });
      setEditingMember(null);
      return;
    }

    setIsUpdatingRole(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch('/api/admin-csap', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          action: 'update_team_member_role',
          memberId: editingMember.id,
          email: editingMember.email,
          role: selectedRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onNotification({
          type: 'success',
          text: `Updated role for ${editingMember.email} to ${selectedRole.toUpperCase()}`,
        });
        setEditingMember(null);
        fetchTeam();
      } else {
        onNotification({
          type: 'error',
          text: data.error || 'Failed to update member role',
        });
      }
    } catch (err: any) {
      onNotification({
        type: 'error',
        text: err.message || 'Network error updating role',
      });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // ─── Delete Member Handler ───────────────────────────────────────────────────
  const handleDeleteMember = async () => {
    if (!deletingMember) return;

    if (deletingMember.email.toLowerCase() === ROOT_OWNER_EMAIL) {
      onNotification({
        type: 'error',
        text: 'Root owner cannot be removed.',
      });
      setDeletingMember(null);
      return;
    }

    setIsDeleting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(
        `/api/admin-csap?resource=team&memberId=${deletingMember.id}&email=${encodeURIComponent(
          deletingMember.email
        )}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      const data = await res.json();
      if (res.ok && data.success) {
        onNotification({
          type: 'success',
          text: `Revoked CSAP access for ${deletingMember.email}`,
        });
        setDeletingMember(null);
        fetchTeam();
      } else {
        onNotification({
          type: 'error',
          text: data.error || 'Failed to revoke access',
        });
      }
    } catch (err: any) {
      onNotification({
        type: 'error',
        text: err.message || 'Network error revoking access',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // ─── Copy SQL helper ─────────────────────────────────────────────────────────
  const handleCopySql = () => {
    const rootAdminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@hackersunity.com';
    const sql = `-- Run in Supabase SQL Editor:
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
CREATE UNIQUE INDEX IF NOT EXISTS idx_csap_team_email_lower ON public.csap_team(LOWER(email));
INSERT INTO public.csap_team (email, role, name, status, added_by)
VALUES ('${rootAdminEmail}', 'owner', 'Platform Owner', 'active', 'system_root')
ON CONFLICT (LOWER(email)) DO UPDATE SET role = 'owner', status = 'active', updated_at = NOW();
ALTER TABLE public.csap_team ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access to csap_team" ON public.csap_team;
CREATE POLICY "Service role full access to csap_team" ON public.csap_team FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Active team members can view csap_team" ON public.csap_team;
CREATE POLICY "Active team members can view csap_team" ON public.csap_team FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.csap_team ct WHERE LOWER(ct.email) = LOWER(auth.jwt() ->> 'email') AND ct.status = 'active')
);`;

    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
    onNotification({
      type: 'success',
      text: '📋 SQL migration copied to clipboard! Paste and run it in Supabase SQL Editor.',
    });
  };

  // ─── Filtered Members ────────────────────────────────────────────────────────
  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return members;
    const q = searchQuery.toLowerCase();
    return members.filter(
      (m) =>
        m.email.toLowerCase().includes(q) ||
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.username && m.username.toLowerCase().includes(q)) ||
        m.role.toLowerCase().includes(q)
    );
  }, [members, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: members.length,
      owners: members.filter((m) => m.role === 'owner').length,
      admins: members.filter((m) => m.role === 'admin').length,
      managers: members.filter((m) => m.role === 'manager').length,
      viewers: members.filter((m) => m.role === 'viewer').length,
    };
  }, [members]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ─── Database Migration Notice Banner (if table not created yet) ──────── */}
      {!tableReady && (
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Supabase Database Setup Required for CSAP Team
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                The <code className="px-1.5 py-0.5 rounded bg-amber-500/20 font-mono text-[11px]">csap_team</code>{' '}
                table is not yet created in your Supabase project. You are operating via the hardcoded Root Owner
                safeguard (<span className="font-semibold">{ROOT_OWNER_EMAIL}</span>). Run the migration in your Supabase
                SQL Editor to enable persistent team management.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopySql}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition cursor-pointer shrink-0 shadow-sm"
          >
            {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedSql ? 'Copied SQL!' : 'Copy Migration SQL'}</span>
          </button>
        </div>
      )}

      {/* ─── Top Stats Grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Team
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</p>
          </div>
          <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-[#0099e6]">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Owners
            </p>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{stats.owners}</p>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-500">
            <Crown className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Admins
            </p>
            <p className="text-2xl font-black text-sky-600 dark:text-sky-400 mt-1">{stats.admins}</p>
          </div>
          <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-sky-500">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Managers
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.managers}</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500">
            <Sliders className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] shadow-xs flex items-center justify-between col-span-2 sm:col-span-1">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Viewers
            </p>
            <p className="text-2xl font-black text-slate-600 dark:text-slate-300 mt-1">{stats.viewers}</p>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 dark:bg-white/[0.06] text-slate-500">
            <Eye className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ─── Role Permissions Matrix Breakdown ────────────────────────────── */}
      <div className="bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-[#0099e6]" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Access Control & Role Permissions Matrix
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(ROLE_CONFIG) as CsapRole[]).map((rKey) => {
            const conf = ROLE_CONFIG[rKey];
            return (
              <div
                key={rKey}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-[#080c14] border border-slate-200/70 dark:border-white/[0.06] flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="p-1.5 rounded-xl bg-white dark:bg-white/[0.06] border border-slate-200/60 dark:border-white/[0.06]">
                      {conf.icon}
                    </span>
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      {conf.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {conf.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-white/[0.06] space-y-1.5">
                  {conf.permissions.map((perm, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-tight">{perm}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Search Bar & Add Member Header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search team member by email, name or role..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#0099e6] transition shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchTeam}
            disabled={loading}
            title="Refresh team list"
            className="p-2.5 rounded-2xl bg-white dark:bg-[#0c1017] hover:bg-slate-50 dark:hover:bg-white/[0.06] border border-slate-200/90 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 transition cursor-pointer disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {canManageTeam && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs sm:text-sm transition cursor-pointer shadow-md shadow-sky-500/20"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Team Member</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── Team Members Table ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] rounded-3xl overflow-hidden shadow-xs">
        {loading && members.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-8 h-8 text-[#0099e6] animate-spin mb-3" />
            <p className="text-xs font-semibold">Loading CSAP team members...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-16 text-center text-slate-500 px-4">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-40 text-[#0099e6]" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">No team members found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery ? 'Try matching another name or email search term.' : 'Click "Add Team Member" to grant access.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/70 dark:border-white/[0.06] bg-slate-50/75 dark:bg-white/[0.02] text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-4 px-6">Administrator</th>
                  <th className="py-4 px-6">Role & Permissions</th>
                  <th className="py-4 px-6">Access Status</th>
                  <th className="py-4 px-6">Granted By</th>
                  <th className="py-4 px-6">Date Added</th>
                  {canManageTeam && <th className="py-4 px-6 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                {filteredMembers.map((member) => {
                  const roleConf = ROLE_CONFIG[member.role] || ROLE_CONFIG.viewer;
                  const isRootOwner = member.email.toLowerCase() === ROOT_OWNER_EMAIL;
                  const isCurrentLoggedUser =
                    currentEmail && member.email.toLowerCase() === currentEmail.toLowerCase();

                  return (
                    <tr
                      key={member.id || member.email}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition"
                    >
                      {/* Administrator Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0099e6] to-[#ea580c] p-0.5 shrink-0 shadow-xs overflow-hidden">
                            {member.avatar_url ? (
                              <Image
                                src={member.avatar_url}
                                alt={member.name || member.email}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover rounded-[14px]"
                              />
                            ) : (
                              <div className="w-full h-full bg-slate-100 dark:bg-[#0c1017] rounded-[14px] flex items-center justify-center font-bold text-xs text-slate-800 dark:text-white uppercase">
                                {(member.name || member.email)[0]}
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                                {member.name || member.email.split('@')[0]}
                              </span>
                              {isRootOwner && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-black">
                                  <Crown className="w-3 h-3 text-amber-500" />
                                  <span>ROOT OWNER</span>
                                </span>
                              )}
                              {isCurrentLoggedUser && !isRootOwner && (
                                <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-[#0099e6] text-[10px] font-black">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{member.email}</span>
                              {member.username && (
                                <>
                                  <span>•</span>
                                  <span className="text-sky-600 dark:text-sky-400 font-medium">@{member.username}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role & Permissions Badge */}
                      <td className="py-4 px-6">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${roleConf.badgeClass}`}
                        >
                          {roleConf.icon}
                          <span className="capitalize">{member.role}</span>
                        </div>
                      </td>

                      {/* Access Status */}
                      <td className="py-4 px-6">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active Access</span>
                        </div>
                      </td>

                      {/* Granted By */}
                      <td className="py-4 px-6">
                        <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          {member.added_by || 'system_root'}
                        </span>
                      </td>

                      {/* Date Added */}
                      <td className="py-4 px-6">
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          {member.created_at
                            ? new Date(member.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'Initial Setup'}
                        </span>
                      </td>

                      {/* Actions */}
                      {canManageTeam && (
                        <td className="py-4 px-6 text-right">
                          <div className="inline-flex items-center gap-2">
                            {/* Role edit button */}
                            {isRootOwner ? (
                              <div
                                title="Root owner permissions are locked"
                                className="p-2 rounded-xl text-slate-400 cursor-not-allowed opacity-50"
                              >
                                <Lock className="w-4 h-4" />
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMember(member);
                                    setSelectedRole(member.role);
                                  }}
                                  title="Change role permissions"
                                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 transition cursor-pointer"
                                >
                                  <Sliders className="w-4 h-4" />
                                </button>

                                {isOwner && (
                                  <button
                                    type="button"
                                    onClick={() => setDeletingMember(member)}
                                    title="Revoke access"
                                    className="p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL 1: Add Team Member ─────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.1] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0099e6] via-purple-500 to-[#ea580c]" />

            <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 dark:border-white/[0.06] mb-6">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-[#0099e6]">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Grant CSAP Admin Access
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Add user by email and choose their permission level.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  User Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. member@hackersunity.com"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-[#080c14] border border-slate-200/90 dark:border-white/[0.08] rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0099e6] transition font-medium"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  When this user signs into Hacker&apos;s Unity with this email, they will automatically receive CSAP access.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  Select Permission Role *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {(['owner', 'admin', 'manager', 'viewer'] as CsapRole[]).map((r) => {
                    const isSelected = newRole === r;
                    const rConf = ROLE_CONFIG[r];
                    // Non-owners cannot select 'owner'
                    const disabled = r === 'owner' && !isOwner;

                    return (
                      <button
                        key={r}
                        type="button"
                        disabled={disabled}
                        onClick={() => setNewRole(r)}
                        className={`p-3 rounded-2xl border text-left transition flex items-start gap-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          isSelected
                            ? 'bg-sky-50/50 dark:bg-sky-950/20 border-[#0099e6] shadow-xs'
                            : 'bg-slate-50/60 dark:bg-[#080c14] border-slate-200/70 dark:border-white/[0.06] hover:border-slate-300'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">{rConf.icon}</div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                              {r}
                            </span>
                            {isSelected && <Check className="w-3 h-3 text-[#0099e6]" />}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                            {rConf.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/30 text-sky-800 dark:text-sky-300 text-xs flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#0099e6] shrink-0 mt-0.5" />
                <span className="leading-relaxed text-[11px]">
                  <strong>Security Note:</strong> Only grant <strong>Owner</strong> or <strong>Admin</strong> access to
                  verified leadership. <strong>Manager</strong> is optimal for day-to-day hackathon approval.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isAdding}
                  className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isAdding}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-bold text-xs transition cursor-pointer disabled:opacity-60 shadow-md shadow-sky-500/25"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Granting Access...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Grant Access</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: Edit Member Role ────────────────────────────────────── */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.1] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 dark:border-white/[0.06] mb-5">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#0099e6]" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Modify Permissions</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
              Select new role permissions for{' '}
              <strong className="text-slate-900 dark:text-white">{editingMember.email}</strong>:
            </p>

            <div className="space-y-2 mb-6">
              {(['owner', 'admin', 'manager', 'viewer'] as CsapRole[]).map((r) => {
                const isSelected = selectedRole === r;
                const rConf = ROLE_CONFIG[r];
                const disabled = r === 'owner' && !isOwner;

                return (
                  <button
                    key={r}
                    type="button"
                    disabled={disabled}
                    onClick={() => setSelectedRole(r)}
                    className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/30 border-[#0099e6]'
                        : 'bg-slate-50 dark:bg-[#080c14] border-slate-200/70 dark:border-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {rConf.icon}
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white capitalize">{r}</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">{rConf.title}</p>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#0099e6]" />}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                disabled={isUpdatingRole}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateRole}
                disabled={isUpdatingRole}
                className="px-5 py-2 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold shadow-md shadow-sky-500/25 flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isUpdatingRole && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Role</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: Revoke Access Confirmation ──────────────────────────── */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.1] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Revoke CSAP Admin Access?</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              Are you sure you want to revoke admin access for{' '}
              <strong className="text-slate-900 dark:text-white">{deletingMember.email}</strong>? They will immediately
              lose access to the Central Admin Portal and moderation engine.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 text-xs font-bold cursor-pointer"
              >
                Keep Member
              </button>
              <button
                type="button"
                onClick={handleDeleteMember}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/25 flex items-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Revoke Access</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
