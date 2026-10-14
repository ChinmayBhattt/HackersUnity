'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Check,
  X,
  Eye,
  Trash2,
  RefreshCw,
  ExternalLink,
  Mail,
  Phone,
  Linkedin,
  FileText,
  Building2,
  Briefcase,
  Copy,
  MessageSquare,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Send,
  UserCheck,
  RotateCcw,
  Github,
  User,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ProfilePreviewModal } from './profile-preview-modal';

export interface AdminMentorUserProfile {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  role?: string;
  bio?: string | null;
  college?: string | null;
  organization?: string | null;
  company?: string | null;
  job_title?: string | null;
  skills?: string[];
  elo_score?: number;
  github_url?: string | null;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  created_at?: string;
}

export interface AdminMentor {
  id: string;
  name: string;
  company: string;
  designation: string;
  email: string;
  phone: string;
  linkedin_url: string;
  resume_url?: string | null;
  status: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  user_profile?: AdminMentorUserProfile | null;
}

interface AdminMentorsModerationProps {
  onNotification: (msg: { type: 'success' | 'error'; text: string }) => void;
  onPendingCountChange?: (count: number) => void;
  currentUserRole?: string | null;
}

export function AdminMentorsModeration({
  onNotification,
  onPendingCountChange,
  currentUserRole,
}: AdminMentorsModerationProps) {
  const isViewer = currentUserRole === 'viewer';
  const canDelete = currentUserRole === 'owner' || currentUserRole === 'admin';
  const [mentors, setMentors] = useState<AdminMentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedMentor, setSelectedMentor] = useState<AdminMentor | null>(null);
  const [rejectModalMentor, setRejectModalMentor] = useState<AdminMentor | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [tableReady, setTableReady] = useState(true);
  const [dismissedNotice, setDismissedNotice] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [adminNotesInput, setAdminNotesInput] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [previewProfileUsername, setPreviewProfileUsername] = useState<string | null>(null);
  const [fetchingProfileFor, setFetchingProfileFor] = useState<string | null>(null);

  // Fetch mentors from API
  const fetchMentors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin-csap?resource=mentors');
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated) {
          const list: AdminMentor[] = data.mentors || [];
          setMentors(list);
          setTableReady(data.tableReady !== false);
          const pendingCount = list.filter((m) => m.status === 'PENDING').length;
          onPendingCountChange?.(pendingCount);
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin mentors:', err);
    } finally {
      setLoading(false);
    }
  }, [onPendingCountChange]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  // Auto-resolve user profile if missing when a mentor is selected in modal
  useEffect(() => {
    if (selectedMentor && !selectedMentor.user_profile && selectedMentor.email) {
      let isMounted = true;
      const targetId = selectedMentor.id;
      const email = selectedMentor.email;
      setFetchingProfileFor(targetId);

      fetch(`/api/users/${encodeURIComponent(email)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((userData) => {
          if (isMounted && userData?.user) {
            setSelectedMentor((prev) =>
              prev && prev.id === targetId ? { ...prev, user_profile: userData.user } : prev
            );
            setMentors((prev) =>
              prev.map((m) => (m.id === targetId ? { ...m, user_profile: userData.user } : m))
            );
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setFetchingProfileFor(null);
        });

      return () => {
        isMounted = false;
      };
    }
  }, [selectedMentor?.id, selectedMentor?.email, selectedMentor?.user_profile]);

  // Realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('public:admin_csap_mentors_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mentor_applications' },
        () => {
          fetchMentors();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMentors]);

  // Sync admin notes input when mentor selected
  useEffect(() => {
    if (selectedMentor) {
      setAdminNotesInput(selectedMentor.notes || '');
    }
  }, [selectedMentor]);

  // Copy to clipboard helper
  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Approve mentor
  const handleApprove = async (mentor: AdminMentor) => {
    setActionLoadingId(mentor.id);
    try {
      const res = await fetch('/api/admin-csap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve_mentor', mentorId: mentor.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onNotification({
          type: 'success',
          text: `✅ Mentor application for "${mentor.name}" has been APPROVED!`,
        });
        setMentors((prev) =>
          prev.map((m) =>
            m.id === mentor.id
              ? { ...m, status: 'APPROVED', updated_at: new Date().toISOString() }
              : m
          )
        );
        if (selectedMentor?.id === mentor.id) {
          setSelectedMentor((prev) => (prev ? { ...prev, status: 'APPROVED' } : null));
        }
      } else {
        onNotification({
          type: 'error',
          text: data.error || 'Failed to approve mentor',
        });
      }
    } catch (err: any) {
      onNotification({ type: 'error', text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Mark In-Review
  const handleMarkInReview = async (mentor: AdminMentor) => {
    setActionLoadingId(mentor.id);
    try {
      const res = await fetch('/api/admin-csap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'in_review_mentor', mentorId: mentor.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onNotification({
          type: 'success',
          text: `🔍 Application for "${mentor.name}" moved to In-Review.`,
        });
        setMentors((prev) =>
          prev.map((m) =>
            m.id === mentor.id
              ? { ...m, status: 'IN_REVIEW', updated_at: new Date().toISOString() }
              : m
          )
        );
        if (selectedMentor?.id === mentor.id) {
          setSelectedMentor((prev) => (prev ? { ...prev, status: 'IN_REVIEW' } : null));
        }
      } else {
        onNotification({
          type: 'error',
          text: data.error || 'Failed to mark mentor in-review',
        });
      }
    } catch (err: any) {
      onNotification({ type: 'error', text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Reset to Pending
  const handleResetToPending = async (mentor: AdminMentor) => {
    setActionLoadingId(mentor.id);
    try {
      const res = await fetch('/api/admin-csap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pending_mentor', mentorId: mentor.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onNotification({
          type: 'success',
          text: `↩ Application for "${mentor.name}" reset to Pending Review!`,
        });
        setMentors((prev) =>
          prev.map((m) =>
            m.id === mentor.id
              ? { ...m, status: 'PENDING', updated_at: new Date().toISOString() }
              : m
          )
        );
        if (selectedMentor?.id === mentor.id) {
          setSelectedMentor((prev) => (prev ? { ...prev, status: 'PENDING' } : null));
        }
      } else {
        onNotification({
          type: 'error',
          text: data.error || 'Failed to reset application',
        });
      }
    } catch (err: any) {
      onNotification({ type: 'error', text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Confirm Reject
  const handleRejectConfirm = async () => {
    if (!rejectModalMentor) return;
    setActionLoadingId(rejectModalMentor.id);
    try {
      const res = await fetch('/api/admin-csap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject_mentor',
          mentorId: rejectModalMentor.id,
          feedback: rejectFeedback,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onNotification({
          type: 'success',
          text: `❌ Mentor application for "${rejectModalMentor.name}" has been rejected.`,
        });
        setMentors((prev) =>
          prev.map((m) =>
            m.id === rejectModalMentor.id
              ? { ...m, status: 'REJECTED', notes: rejectFeedback || m.notes }
              : m
          )
        );
        setRejectModalMentor(null);
        setRejectFeedback('');
        if (selectedMentor?.id === rejectModalMentor.id) {
          setSelectedMentor((prev) =>
            prev ? { ...prev, status: 'REJECTED', notes: rejectFeedback || prev.notes } : null
          );
        }
      } else {
        onNotification({
          type: 'error',
          text: data.error || 'Failed to reject application',
        });
      }
    } catch (err: any) {
      onNotification({ type: 'error', text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Save notes
  const handleSaveNotes = async () => {
    if (!selectedMentor) return;
    setIsSavingNotes(true);
    try {
      const res = await fetch('/api/admin-csap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_mentor',
          mentorId: selectedMentor.id,
          notes: adminNotesInput,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onNotification({ type: 'success', text: 'Notes updated successfully!' });
        setMentors((prev) =>
          prev.map((m) => (m.id === selectedMentor.id ? { ...m, notes: adminNotesInput } : m))
        );
        setSelectedMentor((prev) => (prev ? { ...prev, notes: adminNotesInput } : null));
      } else {
        onNotification({ type: 'error', text: data.error || 'Failed to save notes' });
      }
    } catch (err: any) {
      onNotification({ type: 'error', text: err.message });
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Delete mentor application
  const handleDelete = async (mentorId: string) => {
    if (!confirm('Are you sure you want to permanently delete this mentor application?')) return;
    setActionLoadingId(mentorId);
    try {
      const res = await fetch(`/api/admin-csap?resource=mentors&mentorId=${mentorId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        onNotification({ type: 'success', text: 'Mentor application deleted.' });
        setMentors((prev) => prev.filter((m) => m.id !== mentorId));
        if (selectedMentor?.id === mentorId) setSelectedMentor(null);
      } else {
        onNotification({ type: 'error', text: data.error || 'Failed to delete' });
      }
    } catch (err: any) {
      onNotification({ type: 'error', text: err.message });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: mentors.length,
      pending: mentors.filter((m) => m.status === 'PENDING').length,
      in_review: mentors.filter((m) => m.status === 'IN_REVIEW').length,
      approved: mentors.filter((m) => m.status === 'APPROVED').length,
      rejected: mentors.filter((m) => m.status === 'REJECTED').length,
    };
  }, [mentors]);

  // Filtered mentors list
  const filteredMentors = useMemo(() => {
    return mentors.filter((m) => {
      // Status filter
      if (statusFilter === 'PENDING' && m.status !== 'PENDING') return false;
      if (statusFilter === 'IN_REVIEW' && m.status !== 'IN_REVIEW') return false;
      if (statusFilter === 'APPROVED' && m.status !== 'APPROVED') return false;
      if (statusFilter === 'REJECTED' && m.status !== 'REJECTED') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesCompany = (m.company || '').toLowerCase().includes(q);
        const matchesDesignation = (m.designation || '').toLowerCase().includes(q);
        const matchesEmail = (m.email || '').toLowerCase().includes(q);
        const matchesPhone = (m.phone || '').toLowerCase().includes(q);
        const matchesNotes = (m.notes || '').toLowerCase().includes(q);
        const matchesUsername = (m.user_profile?.username || '').toLowerCase().includes(q);
        const matchesProfileName = (m.user_profile?.name || '').toLowerCase().includes(q);

        if (
          !matchesName &&
          !matchesCompany &&
          !matchesDesignation &&
          !matchesEmail &&
          !matchesPhone &&
          !matchesNotes &&
          !matchesUsername &&
          !matchesProfileName
        ) {
          return false;
        }
      }

      return true;
    });
  }, [mentors, statusFilter, searchQuery]);

  // Avatar helper
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getGradientByName = (name: string) => {
    const gradients = [
      'from-sky-500 to-blue-600',
      'from-purple-500 to-indigo-600',
      'from-emerald-500 to-teal-600',
      'from-amber-500 to-orange-600',
      'from-rose-500 to-pink-600',
      'from-cyan-500 to-blue-600',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* ─── Migration Notice (If table not created yet) ─────────── */}
      {!loading && !tableReady && mentors.length === 0 && !dismissedNotice && (
        <div className="p-5 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Supabase `mentor_applications` Table Setup Required</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Please execute{' '}
              <code className="px-1.5 py-0.5 rounded bg-amber-500/20 font-mono text-amber-700 dark:text-amber-300">
                apps/web/supabase/mentor-applications-migration.sql
              </code>{' '}
              in your Supabase SQL Editor to enable full table support for mentor applications.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchMentors}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition cursor-pointer"
            >
              Check Again
            </button>
            <button
              type="button"
              onClick={() => setDismissedNotice(true)}
              className="p-1.5 rounded-xl hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 transition cursor-pointer"
              title="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Metric Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Pending Review */}
        <div
          onClick={() => setStatusFilter('PENDING')}
          className={`p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer select-none ${
            statusFilter === 'PENDING'
              ? 'bg-amber-50/90 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 shadow-lg shadow-amber-500/10'
              : 'bg-white dark:bg-[#0c1017] border-slate-200/80 dark:border-white/[0.08] hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
              Pending Review
            </span>
            <div className="w-8 h-8 rounded-2xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {stats.pending}
            </span>
            {stats.pending > 0 && (
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 animate-pulse">
                Needs Action
              </span>
            )}
          </div>
        </div>

        {/* In Review */}
        <div
          onClick={() => setStatusFilter('IN_REVIEW')}
          className={`p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer select-none ${
            statusFilter === 'IN_REVIEW'
              ? 'bg-sky-50/90 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/40 shadow-lg shadow-sky-500/10'
              : 'bg-white dark:bg-[#0c1017] border-slate-200/80 dark:border-white/[0.08] hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-sky-800 dark:text-sky-400 uppercase tracking-wider">
              In Review
            </span>
            <div className="w-8 h-8 rounded-2xl bg-sky-100 dark:bg-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {stats.in_review}
            </span>
            <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
              Evaluating
            </span>
          </div>
        </div>

        {/* Approved Mentors */}
        <div
          onClick={() => setStatusFilter('APPROVED')}
          className={`p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer select-none ${
            statusFilter === 'APPROVED'
              ? 'bg-emerald-50/90 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 shadow-lg shadow-emerald-500/10'
              : 'bg-white dark:bg-[#0c1017] border-slate-200/80 dark:border-white/[0.08] hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider">
              Verified Mentors
            </span>
            <div className="w-8 h-8 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {stats.approved}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              Accredited
            </span>
          </div>
        </div>

        {/* Rejected */}
        <div
          onClick={() => setStatusFilter('REJECTED')}
          className={`p-5 sm:p-6 rounded-3xl border transition-all cursor-pointer select-none ${
            statusFilter === 'REJECTED'
              ? 'bg-rose-50/90 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/40 shadow-lg shadow-rose-500/10'
              : 'bg-white dark:bg-[#0c1017] border-slate-200/80 dark:border-white/[0.08] hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider">
              Rejected
            </span>
            <div className="w-8 h-8 rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              {stats.rejected}
            </span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              Declined
            </span>
          </div>
        </div>
      </div>

      {/* ─── Filter Pills & Search Control ───────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-2 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200/80 dark:border-white/[0.08] shadow-xs">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0 px-2 no-scrollbar">
          <button
            type="button"
            onClick={() => setStatusFilter('PENDING')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'PENDING'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
            }`}
          >
            <span>Pending Review</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">
              {stats.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('IN_REVIEW')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'IN_REVIEW'
                ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
            }`}
          >
            <span>In Review</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">
              {stats.in_review}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('APPROVED')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'APPROVED'
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
            }`}
          >
            <span>Approved</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">
              {stats.approved}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('REJECTED')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'REJECTED'
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
            }`}
          >
            <span>Rejected</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">
              {stats.rejected}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
            }`}
          >
            <span>All Submissions</span>
            <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">
              {stats.total}
            </span>
          </button>
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2 px-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, company, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0099e6]"
            />
          </div>

          <button
            type="button"
            onClick={fetchMentors}
            disabled={loading}
            className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/[0.05] text-slate-600 dark:text-slate-400 transition cursor-pointer"
            title="Refresh mentors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── Applications List ───────────────────────────────────── */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 bg-white dark:bg-[#0c1017] rounded-3xl border border-slate-200/80 dark:border-white/[0.08]">
          <Loader2 className="w-8 h-8 text-[#0099e6] animate-spin" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Fetching mentor submissions...
          </p>
        </div>
      ) : filteredMentors.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-[#0c1017] rounded-3xl border border-slate-200/80 dark:border-white/[0.08]">
          <Award className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            {statusFilter === 'PENDING' && stats.pending === 0
              ? 'All caught up! No pending applications'
              : 'No mentor applications found'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
            {searchQuery
              ? `No mentor profiles match your search "${searchQuery}".`
              : statusFilter === 'PENDING' && stats.pending === 0
              ? `There are currently 0 applications pending review. All received applications have already been processed.`
              : `There are currently no applications matching the "${statusFilter}" filter.`}
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {stats.approved > 0 && statusFilter !== 'APPROVED' && (
              <button
                type="button"
                onClick={() => setStatusFilter('APPROVED')}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition cursor-pointer shadow-md shadow-emerald-500/20"
              >
                View Verified Mentors ({stats.approved})
              </button>
            )}
            {stats.total > 0 && statusFilter !== 'ALL' && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs font-bold transition cursor-pointer"
              >
                View All Applications ({stats.total})
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMentors.map((mentor) => {
            const isActionLoading = actionLoadingId === mentor.id;
            const statusConfig = {
              PENDING: {
                label: 'Pending Review',
                bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
                dot: 'bg-amber-500',
              },
              IN_REVIEW: {
                label: 'In Review',
                bg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
                dot: 'bg-sky-500',
              },
              APPROVED: {
                label: 'Verified Mentor',
                bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
                dot: 'bg-emerald-500',
              },
              REJECTED: {
                label: 'Rejected',
                bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
                dot: 'bg-rose-500',
              },
            }[mentor.status] || {
              label: mentor.status,
              bg: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
              dot: 'bg-slate-500',
            };

            return (
              <div
                key={mentor.id}
                className="group p-5 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.15] transition-all shadow-xs hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Status + Time */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${statusConfig.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                      {statusConfig.label}
                    </span>

                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(mentor.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Applicant Header */}
                  <div className="flex items-start gap-3 mb-3.5">
                    {mentor.user_profile?.avatar_url ? (
                      <img
                        src={mentor.user_profile.avatar_url}
                        alt={mentor.name}
                        className="w-12 h-12 rounded-2xl object-cover shrink-0 shadow-md ring-2 ring-sky-500/20"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getGradientByName(
                          mentor.name
                        )} text-white font-black text-base flex items-center justify-center shrink-0 shadow-md`}
                      >
                        {getInitials(mentor.name)}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                          {mentor.name}
                        </h4>
                        {mentor.user_profile?.username && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewProfileUsername(mentor.user_profile!.username);
                            }}
                            className="text-[10px] font-extrabold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 px-1.5 py-0.5 rounded-md transition cursor-pointer"
                            title="Quick View Platform Profile"
                          >
                            @{mentor.user_profile.username}
                          </button>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 truncate flex items-center gap-1 mt-0.5">
                        <Briefcase className="w-3 h-3 text-[#0099e6] shrink-0" />
                        <span>{mentor.designation || 'Applicant'}</span>
                      </p>
                      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{mentor.company || 'Independent'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Contact Badges */}
                  <div className="space-y-1.5 mb-4 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.04]">
                      <a
                        href={`mailto:${mentor.email}`}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-[#0099e6] truncate text-[11px] font-medium"
                        title={mentor.email}
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{mentor.email}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(mentor.email, `email-${mentor.id}`)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-white/[0.1] rounded text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                        title="Copy email"
                      >
                        {copiedField === `email-${mentor.id}` ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.04]">
                      <a
                        href={`tel:${mentor.phone}`}
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-[#0099e6] truncate text-[11px] font-medium"
                        title={mentor.phone}
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{mentor.phone}</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(mentor.phone, `phone-${mentor.id}`)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-white/[0.1] rounded text-slate-400 hover:text-slate-600 dark:hover:text-white transition"
                        title="Copy phone"
                      >
                        {copiedField === `phone-${mentor.id}` ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Links Row */}
                  <div className="flex items-center gap-2 mb-4">
                    {mentor.linkedin_url && (
                      <a
                        href={mentor.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-[11px] font-bold transition flex-1 justify-center"
                      >
                        <Linkedin className="w-3 h-3 shrink-0" />
                        <span>LinkedIn</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    )}

                    {mentor.resume_url && (
                      <a
                        href={mentor.resume_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-[11px] font-bold transition flex-1 justify-center"
                      >
                        <FileText className="w-3 h-3 shrink-0" />
                        <span>Resume</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    )}
                  </div>

                  {/* Notes snippet if present */}
                  {mentor.notes && (
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] mb-4 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 italic">
                      &quot;{mentor.notes}&quot;
                    </div>
                  )}
                </div>

                {/* Card Actions Bar */}
                <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedMentor(mentor)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#0099e6]" />
                      <span>Review</span>
                    </button>
                    {mentor.user_profile?.username && (
                      <button
                        type="button"
                        onClick={() => setPreviewProfileUsername(mentor.user_profile!.username)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition cursor-pointer"
                        title="View HackersUnity Profile"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Profile</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Approve button */}
                    {mentor.status !== 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() => handleApprove(mentor)}
                        disabled={isActionLoading || isViewer}
                        className={`p-1.5 rounded-xl transition ${
                          isViewer
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                            : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 cursor-pointer'
                        }`}
                        title={isViewer ? 'Viewer role has read-only access' : 'Approve as Verified Mentor'}
                      >
                        {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                    )}

                    {/* In Review button */}
                    {mentor.status !== 'IN_REVIEW' && (
                      <button
                        type="button"
                        onClick={() => handleMarkInReview(mentor)}
                        disabled={isActionLoading || isViewer}
                        className={`p-1.5 rounded-xl transition ${
                          isViewer
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                            : 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 cursor-pointer'
                        }`}
                        title={isViewer ? 'Viewer role has read-only access' : 'Mark In Review'}
                      >
                        {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}

                    {/* Pending button (if not already pending) */}
                    {mentor.status !== 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => handleResetToPending(mentor)}
                        disabled={isActionLoading || isViewer}
                        className={`p-1.5 rounded-xl transition ${
                          isViewer
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                            : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 cursor-pointer'
                        }`}
                        title={isViewer ? 'Viewer role has read-only access' : 'Reset to Pending Review'}
                      >
                        {isActionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                      </button>
                    )}

                    {/* Reject button */}
                    {mentor.status !== 'REJECTED' && (
                      <button
                        type="button"
                        onClick={() => setRejectModalMentor(mentor)}
                        disabled={isActionLoading || isViewer}
                        className={`p-1.5 rounded-xl transition ${
                          isViewer
                            ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                            : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 cursor-pointer'
                        }`}
                        title={isViewer ? 'Viewer role has read-only access' : 'Reject Application'}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete button */}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(mentor.id)}
                        disabled={isActionLoading}
                        className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                        title="Delete Application"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Detailed Mentor Inspection Modal ────────────────────── */}
      {selectedMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.1] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                {selectedMentor.user_profile?.avatar_url ? (
                  <img
                    src={selectedMentor.user_profile.avatar_url}
                    alt={selectedMentor.name}
                    className="w-12 h-12 rounded-2xl object-cover shrink-0 shadow-md ring-2 ring-[#0099e6]/30"
                  />
                ) : (
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getGradientByName(
                      selectedMentor.name
                    )} text-white font-black text-lg flex items-center justify-center shrink-0 shadow-md`}
                  >
                    {getInitials(selectedMentor.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white truncate">
                      {selectedMentor.name}
                    </h3>
                    {selectedMentor.user_profile?.username && (
                      <span className="px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-bold border border-sky-200 dark:border-sky-500/20">
                        @{selectedMentor.user_profile.username}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
                    {selectedMentor.designation} at {selectedMentor.company}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {selectedMentor.user_profile?.username && (
                  <button
                    type="button"
                    onClick={() => setPreviewProfileUsername(selectedMentor.user_profile!.username)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-[#0099e6] text-xs font-bold transition cursor-pointer"
                    title="View HackersUnity platform profile preview"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Platform Profile</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedMentor(null)}
                  className="p-2 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-400 hover:text-slate-700 dark:hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Status Header Bar & Workflow Control */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Current Status:</span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        selectedMentor.status === 'APPROVED'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : selectedMentor.status === 'IN_REVIEW'
                          ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                          : selectedMentor.status === 'REJECTED'
                          ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full animate-pulse bg-current" />
                      {selectedMentor.status}
                    </span>
                  </div>

                  <div className="text-[11px] font-semibold text-slate-400">
                    {actionLoadingId === selectedMentor.id ? (
                      <span className="flex items-center gap-1.5 text-[#0099e6]">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Updating status...</span>
                      </span>
                    ) : (
                      <span>Click to update status:</span>
                    )}
                  </div>
                </div>

                {/* Fixed-position 4-status action switcher */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                  {/* PENDING Button */}
                  <button
                    type="button"
                    onClick={() => handleResetToPending(selectedMentor)}
                    disabled={actionLoadingId === selectedMentor.id || selectedMentor.status === 'PENDING' || isViewer}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                      isViewer
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                        : selectedMentor.status === 'PENDING'
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-400/50 cursor-default'
                        : 'bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-amber-500/10 hover:text-amber-600 border border-slate-200 dark:border-white/[0.08] cursor-pointer'
                    }`}
                    title={isViewer ? 'Viewer role has read-only access' : selectedMentor.status === 'PENDING' ? 'Currently in Pending' : 'Change status to Pending'}
                  >
                    {actionLoadingId === selectedMentor.id && selectedMentor.status !== 'PENDING' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3.5 h-3.5" />
                    )}
                    <span>{selectedMentor.status === 'PENDING' ? '✓ Pending' : 'Pending'}</span>
                  </button>

                  {/* IN_REVIEW Button */}
                  <button
                    type="button"
                    onClick={() => handleMarkInReview(selectedMentor)}
                    disabled={actionLoadingId === selectedMentor.id || selectedMentor.status === 'IN_REVIEW' || isViewer}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                      isViewer
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                        : selectedMentor.status === 'IN_REVIEW'
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25 ring-2 ring-sky-400/50 cursor-default'
                        : 'bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-500/10 hover:text-sky-600 border border-slate-200 dark:border-white/[0.08] cursor-pointer'
                    }`}
                    title={isViewer ? 'Viewer role has read-only access' : selectedMentor.status === 'IN_REVIEW' ? 'Currently In Review' : 'Change status to In Review'}
                  >
                    {actionLoadingId === selectedMentor.id && selectedMentor.status !== 'IN_REVIEW' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                    <span>{selectedMentor.status === 'IN_REVIEW' ? '✓ In Review' : 'In Review'}</span>
                  </button>

                  {/* APPROVE Button */}
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedMentor)}
                    disabled={actionLoadingId === selectedMentor.id || selectedMentor.status === 'APPROVED' || isViewer}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                      isViewer
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                        : selectedMentor.status === 'APPROVED'
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-400/50 cursor-default'
                        : 'bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 border border-slate-200 dark:border-white/[0.08] cursor-pointer'
                    }`}
                    title={isViewer ? 'Viewer role has read-only access' : selectedMentor.status === 'APPROVED' ? 'Currently Approved' : 'Approve application'}
                  >
                    {actionLoadingId === selectedMentor.id && selectedMentor.status !== 'APPROVED' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>{selectedMentor.status === 'APPROVED' ? '✓ Approved' : 'Approve'}</span>
                  </button>

                  {/* REJECT Button */}
                  <button
                    type="button"
                    onClick={() => setRejectModalMentor(selectedMentor)}
                    disabled={actionLoadingId === selectedMentor.id || selectedMentor.status === 'REJECTED' || isViewer}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
                      isViewer
                        ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400'
                        : selectedMentor.status === 'REJECTED'
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25 ring-2 ring-rose-400/50 cursor-default'
                        : 'bg-white dark:bg-white/[0.04] text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-600 border border-slate-200 dark:border-white/[0.08] cursor-pointer'
                    }`}
                    title={isViewer ? 'Viewer role has read-only access' : selectedMentor.status === 'REJECTED' ? 'Currently Rejected' : 'Reject application'}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>{selectedMentor.status === 'REJECTED' ? '✓ Rejected' : 'Reject'}</span>
                  </button>
                </div>
              </div>

              {/* ─── Applicant Platform Profile Section ─── */}
              <div className="p-4 rounded-3xl bg-gradient-to-br from-sky-500/5 via-slate-50 to-indigo-500/5 dark:from-sky-500/10 dark:via-white/[0.02] dark:to-indigo-500/10 border border-sky-100 dark:border-sky-500/20 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    Applicant Platform Profile (HackersUnity)
                  </span>
                  {selectedMentor.user_profile?.username && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPreviewProfileUsername(selectedMentor.user_profile!.username)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#0099e6] hover:bg-[#0088cc] text-white text-[11px] font-bold transition shadow-xs cursor-pointer"
                        title="Quick preview profile"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Quick Preview</span>
                      </button>
                      <Link
                        href={`/profile/${selectedMentor.user_profile.username}`}
                        target="_blank"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-white/[0.1] hover:bg-slate-300 dark:hover:bg-white/[0.15] text-slate-800 dark:text-slate-200 text-[11px] font-bold transition cursor-pointer"
                        title="Open full public profile in new tab"
                      >
                        <span>Full Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>

                {selectedMentor.user_profile ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.08]">
                    <div className="flex items-center gap-3 min-w-0">
                      {selectedMentor.user_profile.avatar_url ? (
                        <img
                          src={selectedMentor.user_profile.avatar_url}
                          alt={selectedMentor.user_profile.name}
                          className="w-12 h-12 rounded-2xl object-cover shrink-0 ring-2 ring-[#0099e6]/30 shadow-md"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${getGradientByName(
                            selectedMentor.user_profile.name || selectedMentor.name
                          )} text-white font-black text-base flex items-center justify-center shrink-0 shadow-md`}
                        >
                          {getInitials(selectedMentor.user_profile.name || selectedMentor.name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                            {selectedMentor.user_profile.name || selectedMentor.name}
                          </span>
                          <span className="text-xs font-bold text-[#0099e6]">
                            @{selectedMentor.user_profile.username}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0099e6]/10 text-[#0099e6] border border-[#0099e6]/20">
                            {selectedMentor.user_profile.role || 'MEMBER'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                          {selectedMentor.user_profile.elo_score !== undefined && (
                            <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                              <span>⚡</span> {selectedMentor.user_profile.elo_score} Elo Rating
                            </span>
                          )}
                          {(selectedMentor.user_profile.college || selectedMentor.user_profile.organization) && (
                            <span className="truncate">
                              🏫 {selectedMentor.user_profile.college || selectedMentor.user_profile.organization}
                            </span>
                          )}
                          {selectedMentor.user_profile.created_at && (
                            <span>
                              Member since {new Date(selectedMentor.user_profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>

                        {selectedMentor.user_profile.skills && selectedMentor.user_profile.skills.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap mt-2">
                            {selectedMentor.user_profile.skills.slice(0, 5).map((sk) => (
                              <span
                                key={sk}
                                className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.05] text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      {selectedMentor.user_profile.github_url && (
                        <a
                          href={selectedMentor.user_profile.github_url.startsWith('http') ? selectedMentor.user_profile.github_url : `https://${selectedMentor.user_profile.github_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 transition"
                          title="GitHub Profile"
                        >
                          <Github className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {selectedMentor.user_profile.linkedin_url && (
                        <a
                          href={selectedMentor.user_profile.linkedin_url.startsWith('http') ? selectedMentor.user_profile.linkedin_url : `https://${selectedMentor.user_profile.linkedin_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-[#0099e6] transition"
                          title="LinkedIn Profile"
                        >
                          <Linkedin className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {selectedMentor.user_profile.portfolio_url && (
                        <a
                          href={selectedMentor.user_profile.portfolio_url.startsWith('http') ? selectedMentor.user_profile.portfolio_url : `https://${selectedMentor.user_profile.portfolio_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 transition"
                          title="Portfolio / Website"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ) : fetchingProfileFor === selectedMentor.id ? (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-100/60 dark:bg-white/[0.02] text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0099e6]" />
                    <span>Checking linked HackersUnity account...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-100/60 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/[0.04] text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                      <span>No platform account linked with {selectedMentor.email} (External applicant)</span>
                    </div>
                    <Link
                      href={`/profile/${encodeURIComponent(selectedMentor.name.toLowerCase().replace(/[^a-z0-9_]/g, ''))}`}
                      target="_blank"
                      className="text-[11px] font-bold text-[#0099e6] hover:underline shrink-0"
                    >
                      Search by name
                    </Link>
                  </div>
                )}
              </div>

              {/* Contact Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Email */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Email Address
                  </span>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {selectedMentor.email}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedMentor.email, 'modal-email')}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-white/[0.1] rounded text-slate-400 hover:text-slate-600 transition"
                        title="Copy Email"
                      >
                        {copiedField === 'modal-email' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <a
                        href={`mailto:${selectedMentor.email}`}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-white/[0.1] rounded text-slate-400 hover:text-[#0099e6] transition"
                        title="Compose Email"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Phone / WhatsApp
                  </span>
                  <div className="flex items-center justify-between gap-2 mt-1">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {selectedMentor.phone}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(selectedMentor.phone, 'modal-phone')}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-white/[0.1] rounded text-slate-400 hover:text-slate-600 transition"
                        title="Copy Phone"
                      >
                        {copiedField === 'modal-phone' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <a
                        href={`https://wa.me/${selectedMentor.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 hover:bg-slate-200 dark:hover:bg-white/[0.1] rounded text-slate-400 hover:text-emerald-500 transition"
                        title="Message on WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* LinkedIn */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    LinkedIn Profile
                  </span>
                  <div className="mt-1">
                    <a
                      href={selectedMentor.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1.5 truncate"
                    >
                      <Linkedin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{selectedMentor.linkedin_url}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                </div>

                {/* Resume */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Resume / Portfolio
                  </span>
                  <div className="mt-1">
                    {selectedMentor.resume_url ? (
                      <a
                        href={selectedMentor.resume_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1.5 truncate"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">View Document</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-xs font-medium text-slate-400 italic">
                        Not provided
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Applicant Statement / Notes */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  Applicant Pitch / Statement
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {selectedMentor.notes ? (
                    selectedMentor.notes
                  ) : (
                    <span className="text-slate-400 italic">
                      No additional pitch submitted with this application.
                    </span>
                  )}
                </div>
              </div>

              {/* Admin Internal Review Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                    Internal Admin Notes / Feedback
                  </h4>
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="flex items-center gap-1 px-3 py-1 rounded-xl bg-[#0099e6] hover:bg-[#0088cc] text-white text-xs font-bold transition cursor-pointer"
                  >
                    {isSavingNotes ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    <span>Save Notes</span>
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  placeholder="Add internal feedback, interview remarks, or approval conditions..."
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0099e6] text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                />
              </div>

              {/* Submission Metadata */}
              <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>
                  Submitted on:{' '}
                  {new Date(selectedMentor.created_at).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
                <span className="font-mono text-[10px]">ID: {selectedMentor.id}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Reject Modal ────────────────────────────────────────── */}
      {rejectModalMentor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.1] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900 dark:text-white">
                  Reject Application
                </h3>
                <p className="text-xs text-slate-500">
                  {rejectModalMentor.name} ({rejectModalMentor.company})
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to decline this mentor application? You can provide optional feedback explaining why.
            </p>

            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Rejection Reason (Optional)
              </label>
              <textarea
                rows={3}
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                placeholder="e.g. Incomplete portfolio, experience criteria not met..."
                className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setRejectModalMentor(null);
                  setRejectFeedback('');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/[0.05] transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectConfirm}
                disabled={actionLoadingId === rejectModalMentor.id}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-500/20"
              >
                {actionLoadingId === rejectModalMentor.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <X className="w-3.5 h-3.5" />
                )}
                <span>Confirm Reject</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Profile Preview Modal ───────────────────────────────── */}
      {previewProfileUsername && (
        <ProfilePreviewModal
          isOpen={Boolean(previewProfileUsername)}
          onClose={() => setPreviewProfileUsername(null)}
          username={previewProfileUsername}
        />
      )}
    </div>
  );
}
