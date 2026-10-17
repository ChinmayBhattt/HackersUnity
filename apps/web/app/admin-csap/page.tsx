'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  EyeOff,
  RefreshCw,
  LogOut,
  Check,
  X,
  ExternalLink,
  Calendar,
  MapPin,
  Trophy,
  Users,
  Building2,
  Mail,
  Phone,
  Tag,
  Layers,
  FileText,
  Lock,
  User,
  Sparkles,
  Radio,
  Loader2,
  Globe,
  Trash2,
  ChevronDown,
  Info,
  ArrowRight,
  HelpCircle,
  Award,
  SlidersHorizontal,
  PenTool,
  FileSpreadsheet,
  GripVertical,
  ArrowUpToLine,
  ShieldAlert,
  Crown,
  Flame,
  Link2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency } from '@/lib/utils';
import { deleteHostedEvent } from '@/lib/storage';
import { Logo } from '@/components/logo';
import { AdminBlogsModeration } from '@/components/admin-blogs-moderation';
import { AdminMentorsModeration } from '@/components/admin-mentors-moderation';
import { AdminTeamManagement, CsapRole } from '@/components/admin-team-management';
import { RichDescription } from '@/components/rich-description';
import { AdminEditEventModal } from '@/components/admin-edit-event-modal';
import { AdminShowcaseReorder } from '@/components/admin-showcase-reorder';
import { AdminUtmSection } from '@/components/admin-utm-section';
import { AdminUtmModal } from '@/components/admin-utm-modal';

interface AdminEvent {
  id: string;
  slug: string;
  title: string;
  description: string;
  tagline?: string;
  category: string;
  event_type: string;
  location: string;
  organizer_id?: string;
  organizer_name: string;
  organizer_avatar?: string;
  organizer_email?: string;
  organizer_phone?: string;
  host_type?: string;
  institution_name?: string;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  registration_start?: string;
  total_prize_value: number;
  currency?: string;
  prizes?: any[];
  tracks?: any[];
  stages?: any[];
  faqs?: any[];
  sponsors?: any[];
  tags?: string[];
  min_team_size: number;
  max_team_size: number;
  is_team_event: boolean;
  featured: boolean;
  status: string;
  banner_url?: string;
  logo_url?: string;
  timezone?: string;
  eligibility?: string;
  difficulty?: string;
  rules_text?: string;
  custom_questions?: any[];
  admin_feedback?: string;
  reviewed_at?: string;
  display_order?: number;
  registration_count?: number;
  submission_count?: number;
  registration_link?: string | null;
  allow_external_redirect?: boolean;
  created_at: string;
  updated_at: string;
}

export default function AdminCsapPortal() {
  const { user, supabaseUser, session, loading: contextAuthLoading, signOut } = useAuth();

  // Navigation Section (Hackathons vs Blogs vs Mentors vs Team)
  const [activeSection, setActiveSection] = useState<'hackathons' | 'blogs' | 'mentors' | 'team'>('hackathons');
  const [pendingMentorsCount, setPendingMentorsCount] = useState<number>(0);
  const [teamCount, setTeamCount] = useState<number>(0);

  // Authentication & Database Authorization states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<CsapRole | null>(null);
  const [currentAdminUser, setCurrentAdminUser] = useState<{ email: string; role: CsapRole; name: string } | null>(null);
  const isViewer = currentUserRole === 'viewer';

  // Dashboard states
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'SHOWCASE' | 'UTM' | 'REJECTED' | 'DRAFT'>('PENDING');
  const [selectedEvent, setSelectedEvent] = useState<AdminEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<AdminEvent | null>(null);
  const [utmModalEvent, setUtmModalEvent] = useState<AdminEvent | null>(null);
  const [utmLinksTotalCount, setUtmLinksTotalCount] = useState<number>(0);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [rejectModalEvent, setRejectModalEvent] = useState<AdminEvent | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState('');

  // ─── Fetch Mentor Applications Count ─────────────────────────────────────────
  const fetchMentorCount = useCallback(async () => {
    try {
      const { data: { session: sbSession } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (sbSession?.access_token) {
        headers['Authorization'] = `Bearer ${sbSession.access_token}`;
      }
      const res = await fetch('/api/admin-csap?resource=mentors', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.stats) {
          setPendingMentorsCount(data.stats.pending || 0);
        }
      }
    } catch {}
  }, []);

  // ─── Fetch Team Count ────────────────────────────────────────────────────────
  const fetchTeamCount = useCallback(async () => {
    try {
      const { data: { session: sbSession } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (sbSession?.access_token) {
        headers['Authorization'] = `Bearer ${sbSession.access_token}`;
      }
      const res = await fetch('/api/admin-csap?resource=team', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.team) {
          setTeamCount(data.team.length);
        }
      }
    } catch {}
  }, []);

  // ─── Fetch UTM Summary Total Count ──────────────────────────────────────────
  const fetchUtmSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/utm?summary=true');
      if (res.ok) {
        const data = await res.json();
        const map = data.summary || {};
        let total = 0;
        Object.values(map).forEach((s: any) => {
          total += Number(s.totalLinks || 0);
        });
        setUtmLinksTotalCount(total);
      }
    } catch {}
  }, []);

  // ─── 1. Check existing session & database authorization on load ─────────────
  const checkSession = useCallback(async () => {
    if (contextAuthLoading) return;

    if (!user && !supabaseUser) {
      setIsAuthenticated(false);
      setIsAuthorized(false);
      setAuthLoading(false);
      setLoadingEvents(false);
      return;
    }

    try {
      const { data: { session: sbSession } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (sbSession?.access_token) {
        headers['Authorization'] = `Bearer ${sbSession.access_token}`;
      }

      const res = await fetch('/api/admin-csap', { headers });
      const data = await res.json().catch(() => ({}));

      if (res.status === 401 || !data.authenticated) {
        setIsAuthenticated(false);
        setIsAuthorized(false);
      } else if (res.status === 403 || data.authorized === false) {
        setIsAuthenticated(true);
        setIsAuthorized(false);
        if (data.email) {
          setCurrentAdminUser({ email: data.email, role: 'viewer', name: data.email.split('@')[0] });
        }
      } else if (res.ok && data.authenticated && data.authorized) {
        setIsAuthenticated(true);
        setIsAuthorized(true);
        setCurrentUserRole(data.currentUser?.role || 'viewer');
        setCurrentAdminUser(data.currentUser || null);
        setEvents(data.events || []);
        fetchMentorCount();
        fetchTeamCount();
      } else {
        setIsAuthenticated(false);
        setIsAuthorized(false);
      }
    } catch (err) {
      console.error('Session check error:', err);
      setIsAuthenticated(false);
      setIsAuthorized(false);
    } finally {
      setAuthLoading(false);
      setLoadingEvents(false);
    }
  }, [contextAuthLoading, user, supabaseUser, fetchMentorCount, fetchTeamCount]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // ─── 2. Fetch Events ────────────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const { data: { session: sbSession } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (sbSession?.access_token) {
        headers['Authorization'] = `Bearer ${sbSession.access_token}`;
      }

      const res = await fetch('/api/admin-csap', { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.authorized) {
          setEvents(data.events || []);
          fetchMentorCount();
          fetchTeamCount();
          fetchUtmSummary();
        }
      }
    } catch (err) {
      console.error('Failed to fetch admin events:', err);
    } finally {
      setLoadingEvents(false);
    }
  }, [fetchMentorCount, fetchTeamCount, fetchUtmSummary]);

  // ─── 3. Realtime Supabase Subscription ──────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !isAuthorized) return;

    // Listen to real-time broadcasts and Postgres changes on events
    const channel = supabase
      .channel('public:admin_csap_events_sync')
      .on('broadcast', { event: 'event_created' }, (payload) => {
        setNotificationMsg({
          type: 'success',
          text: `🔔 New hackathon submitted: "${payload?.payload?.event?.title || 'New Hackathon'}"`,
        });
        fetchEvents();
      })
      .on('broadcast', { event: 'event_updated' }, () => {
        fetchEvents();
      })
      .on('broadcast', { event: 'event_deleted' }, () => {
        fetchEvents();
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, isAuthorized, fetchEvents]);

  // Auto-dismiss notification toast
  useEffect(() => {
    if (notificationMsg) {
      const timer = setTimeout(() => setNotificationMsg(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notificationMsg]);

  // ─── 4. Logout Handler ──────────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await fetch('/api/admin-csap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      await signOut();
    } finally {
      setIsAuthenticated(false);
      setIsAuthorized(false);
      setEvents([]);
      setSelectedEvent(null);
    }
  };

  // ─── 6. Approve Hackathon ───────────────────────────────────────────────────
  const handleApprove = async (event: AdminEvent) => {
    setActionLoadingId(event.id);
    try {
      const res = await fetch('/api/admin-csap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', eventId: event.id }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotificationMsg({
          type: 'success',
          text: `✅ "${event.title}" has been APPROVED and is now live on the website!`,
        });
        // Optimistic update
        setEvents((prev) =>
          prev.map((e) => (e.id === event.id ? { ...e, status: 'PUBLISHED' } : e))
        );
        if (selectedEvent?.id === event.id) {
          setSelectedEvent((prev) => (prev ? { ...prev, status: 'PUBLISHED' } : null));
        }
        // Remove from deleted list if previously rejected
        try {
          const rawDel = localStorage.getItem('hackers_unity_deleted_events');
          if (rawDel) {
            const delList: string[] = JSON.parse(rawDel);
            const cleaned = delList.filter((id) => id !== event.id && id !== event.slug);
            localStorage.setItem('hackers_unity_deleted_events', JSON.stringify(cleaned));
            window.dispatchEvent(new Event('hackers_unity_storage_change'));
          }
        } catch {}
      } else {
        setNotificationMsg({
          type: 'error',
          text: `Failed to approve: ${data.error || 'Unknown error'}`,
        });
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // ─── 7. Reject Hackathon ────────────────────────────────────────────────────
  const handleRejectConfirm = async () => {
    if (!rejectModalEvent) return;
    const event = rejectModalEvent;
    setActionLoadingId(event.id);
    try {
      const res = await fetch('/api/admin-csap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          eventId: event.id,
          feedback: rejectFeedback,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotificationMsg({
          type: 'success',
          text: `🚫 "${event.title}" has been rejected and will remain hidden from the website.`,
        });
        setEvents((prev) =>
          prev.map((e) => (e.id === event.id ? { ...e, status: 'REJECTED' } : e))
        );
        if (selectedEvent?.id === event.id) {
          setSelectedEvent((prev) => (prev ? { ...prev, status: 'REJECTED' } : null));
        }

        // Clean up from local storage so it immediately vanishes from all listings
        deleteHostedEvent(event.id, event.slug);
        try {
          const rawDel = localStorage.getItem('hackers_unity_deleted_events');
          const delList: string[] = rawDel ? JSON.parse(rawDel) : [];
          if (event.id && !delList.includes(event.id)) delList.push(event.id);
          if (event.slug && !delList.includes(event.slug)) delList.push(event.slug);
          localStorage.setItem('hackers_unity_deleted_events', JSON.stringify(delList));
          window.dispatchEvent(new Event('hackers_unity_storage_change'));
        } catch {}

        setRejectModalEvent(null);
        setRejectFeedback('');
      } else {
        setNotificationMsg({
          type: 'error',
          text: `Failed to reject: ${data.error || 'Unknown error'}`,
        });
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message || 'Network error' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // ─── 7b. Toggle External Registration Redirect ──────────────────────────────
  const handleToggleExternalRedirect = async (event: AdminEvent) => {
    setActionLoadingId(event.id);
    const nextAllowed = !Boolean(event.allow_external_redirect);
    try {
      const res = await fetch('/api/admin-csap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_external_redirect',
          eventId: event.id,
          allowed: nextAllowed,
          allowExternalRedirect: nextAllowed,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotificationMsg({
          type: 'success',
          text: nextAllowed
            ? `🔓 External redirect UNLOCKED for "${event.title}". Host can now configure custom registration redirect.`
            : `🔒 External redirect LOCKED for "${event.title}". Registrations will now be conducted on HackersUnity platform.`,
        });
        setEvents((prev) =>
          prev.map((e) => (e.id === event.id ? { ...e, allow_external_redirect: nextAllowed } : e))
        );
        if (selectedEvent?.id === event.id) {
          setSelectedEvent((prev) => (prev ? { ...prev, allow_external_redirect: nextAllowed } : null));
        }
      } else {
        setNotificationMsg({
          type: 'error',
          text: `Failed to toggle external redirect: ${data.error || 'Unknown error'}`,
        });
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message || 'Network error toggling redirect permission' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // ─── 8. Edit Event as Admin ────────────────────────────────────────────────
  const handleAdminEditSave = async (updatedEvent: AdminEvent): Promise<boolean> => {
    try {
      const res = await fetch('/api/admin-csap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_event',
          eventId: updatedEvent.id,
          updates: {
            title: updatedEvent.title,
            tagline: updatedEvent.tagline,
            organizer_name: updatedEvent.organizer_name,
            institution_name: updatedEvent.institution_name,
            host_type: updatedEvent.host_type,
            organizer_email: updatedEvent.organizer_email,
            organizer_phone: updatedEvent.organizer_phone,
            category: updatedEvent.category,
            event_type: updatedEvent.event_type,
            location: updatedEvent.location,
            status: updatedEvent.status,
            start_date: updatedEvent.start_date,
            end_date: updatedEvent.end_date,
            registration_deadline: updatedEvent.registration_deadline,
            total_prize_value: updatedEvent.total_prize_value,
            currency: updatedEvent.currency,
            description: updatedEvent.description,
            rules_text: updatedEvent.rules_text,
            eligibility: updatedEvent.eligibility,
            difficulty: updatedEvent.difficulty,
            min_team_size: updatedEvent.min_team_size,
            max_team_size: updatedEvent.max_team_size,
            is_team_event: updatedEvent.is_team_event,
            featured: updatedEvent.featured,
            tags: updatedEvent.tags,
            banner_url: updatedEvent.banner_url,
            logo_url: updatedEvent.logo_url,
            admin_feedback: updatedEvent.admin_feedback,
            registration_link: updatedEvent.registration_link ?? null,
            allow_external_redirect: Boolean(updatedEvent.allow_external_redirect),
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setNotificationMsg({
          type: 'success',
          text: `✅ "${updatedEvent.title}" updated successfully!`,
        });
        // Optimistic local update
        setEvents((prev) =>
          prev.map((e) => (e.id === updatedEvent.id ? { ...e, ...data.event } : e))
        );
        if (selectedEvent?.id === updatedEvent.id) {
          setSelectedEvent((prev) => (prev ? { ...prev, ...data.event } : null));
        }
        return true;
      } else {
        setNotificationMsg({
          type: 'error',
          text: `Failed to update event: ${data.error || 'Unknown error'}`,
        });
        return false;
      }
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message || 'Network error updating event' });
      return false;
    }
  };

  // ─── Statistics ─────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const isPending = (e: AdminEvent) =>
      e.status === 'PENDING_APPROVAL' ||
      (e.status === 'DRAFT' && Array.isArray(e.tags) && e.tags.includes('PENDING_APPROVAL'));

    const isApproved = (e: AdminEvent) =>
      ['PUBLISHED', 'REGISTRATION_OPEN', 'LIVE', 'JUDGING', 'COMPLETED', 'ARCHIVED'].includes(
        e.status
      );

    const isRejected = (e: AdminEvent) => e.status === 'REJECTED';
    const isDraft = (e: AdminEvent) => e.status === 'DRAFT' && !isPending(e);

    return {
      total: events.length,
      pending: events.filter(isPending).length,
      approved: events.filter(isApproved).length,
      rejected: events.filter(isRejected).length,
      draft: events.filter(isDraft).length,
    };
  }, [events]);

  // ─── Filtered Events ────────────────────────────────────────────────────────
  const filteredEvents = useMemo(() => {
    const list = events.filter((e) => {
      // Status filtering
      const isPending =
        e.status === 'PENDING_APPROVAL' ||
        (e.status === 'DRAFT' && Array.isArray(e.tags) && e.tags.includes('PENDING_APPROVAL'));
      const isApproved = [
        'PUBLISHED',
        'REGISTRATION_OPEN',
        'LIVE',
        'JUDGING',
        'COMPLETED',
        'ARCHIVED',
      ].includes(e.status);
      const isRejected = e.status === 'REJECTED';
      const isDraft = e.status === 'DRAFT' && !isPending;

      if (statusFilter === 'PENDING' && !isPending) return false;
      if (statusFilter === 'APPROVED' && !isApproved) return false;
      if (statusFilter === 'SHOWCASE' && !isApproved) return false;
      if (statusFilter === 'REJECTED' && !isRejected) return false;
      if (statusFilter === 'DRAFT' && !isDraft) return false;

      // Query filtering
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = e.title?.toLowerCase().includes(q);
        const matchOrg = e.organizer_name?.toLowerCase().includes(q);
        const matchInst = e.institution_name?.toLowerCase().includes(q);
        const matchSlug = e.slug?.toLowerCase().includes(q);
        const matchDesc = e.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchOrg && !matchInst && !matchSlug && !matchDesc) {
          return false;
        }
      }

      return true;
    });

    if (statusFilter === 'APPROVED' || statusFilter === 'SHOWCASE') {
      return [...list].sort((a, b) => {
        const orderA = typeof a.display_order === 'number' ? a.display_order : 999999;
        const orderB = typeof b.display_order === 'number' ? b.display_order : 999999;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
    }

    return list;
  }, [events, statusFilter, searchQuery]);

  // ─── RENDER: Loading Initial State ──────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-slate-600">
        <Loader2 className="w-10 h-10 text-[#0099e6] animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide">Connecting to Hacker&apos;s Unity CSAP...</p>
      </div>
    );
  }

  // ─── RENDER: Unauthenticated Gate (Prompt to sign in) ───────────────────────
  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:py-20">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 dark:shadow-black/50 relative overflow-hidden">
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0099e6] via-sky-400 to-[#ea580c]" />

            {/* Hacker's Unity Branding Header */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-3">
                <Logo size={80} showText={false} />
              </div>

              <div className="flex items-center justify-center font-black italic tracking-tight select-none text-2xl leading-none whitespace-nowrap mb-2">
                <span className="text-[#0099e6] font-extrabold pr-1">Hacker&apos;s</span>
                <span className="text-[#ea580c] font-extrabold">Unity</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 text-[#0099e6] dark:text-[#38bdf8] text-[11px] font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>CSAP Central Admin Portal</span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-2 mb-1">
                Administrator Sign In Required
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium max-w-xs mx-auto">
                Sign in with your authorized Hacker&apos;s Unity account to access the moderation &amp; approval engine.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/login?redirect=/admin-csap"
                className="w-full py-3.5 px-4 bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-sm rounded-2xl shadow-md shadow-sky-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Sign In to Hacker&apos;s Unity</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/"
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl transition flex items-center justify-center"
              >
                Return to Public Website
              </Link>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Real-time Supabase Database Connected</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER: Unauthorized Gate (Logged in, but email not in CSAP team) ──────
  if (isAuthenticated && !isAuthorized) {
    const userEmail = currentAdminUser?.email || user?.email || supabaseUser?.email || 'Unknown';
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:py-20">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#0c1017] border border-rose-200/80 dark:border-rose-900/40 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 dark:shadow-black/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <ShieldAlert className="w-7 h-7" />
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400 text-[11px] font-bold uppercase tracking-wider mb-3">
                <span>Access Denied • 403 Forbidden</span>
              </div>

              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                Unauthorized Account
              </h2>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#080c14] border border-slate-200/70 dark:border-white/[0.06] mb-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-0.5">
                  Signed in as
                </p>
                <p className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 break-all">
                  {userEmail}
                </p>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm mx-auto">
                Your email is not listed in the authorized CSAP Administrator Team registry. If you require access,
                please contact the platform administrator to add you with an Owner, Admin, or Manager role.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-3.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md shadow-rose-600/20 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Switch to Authorized Account</span>
              </button>

              <Link
                href="/dashboard"
                className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 font-bold text-xs rounded-2xl transition flex items-center justify-center gap-1.5"
              >
                <span>Go to Community Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── RENDER: Hacker's Unity Authenticated Dashboard ─────────────────────────
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-16 sm:pt-14 sm:pb-20 flex-1 flex flex-col space-y-8">
      {/* ─── Top Dashboard Header ────────────────────────────────────────── */}
      <div className="mt-2 sm:mt-4 bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 text-[#0099e6] dark:text-[#38bdf8] text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CSAP Super Admin • Hacker&apos;s Unity</span>
            </div>

            {currentAdminUser && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 text-[11px] font-bold">
                <Crown className="w-3 h-3 text-amber-500" />
                <span>Role: {(currentUserRole || currentAdminUser.role || 'viewer').toUpperCase()}</span>
                <span className="text-slate-400 dark:text-slate-500">•</span>
                <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300">
                  {currentAdminUser.email}
                </span>
              </div>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            {activeSection === 'hackathons'
              ? 'Hackathon Moderation & Approval Engine'
              : activeSection === 'blogs'
              ? 'Community Blogs & Playbooks Moderation'
              : activeSection === 'mentors'
              ? 'Mentor Network & Applications Engine'
              : 'CSAP Team & Access Governance'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-2xl">
            {activeSection === 'hackathons'
              ? 'Review host requests submitted by colleges and organizations in real-time. Approved hackathons instantly become public across the main website.'
              : activeSection === 'blogs'
              ? 'Review tech blogs, tutorials, and ecosystem playbooks submitted by community builders. Approved posts are published live immediately on /blogs.'
              : activeSection === 'mentors'
              ? 'Review mentor and jury applications submitted by industry leaders and domain experts in real-time.'
              : 'Manage administrators, moderation managers, and auditors with role-based database permissions (Owner, Admin, Manager, Viewer).'}
          </p>
        </div>

        {/* Live sync badge & controls */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Live Realtime Sync</span>
          </div>

          <button
            onClick={fetchEvents}
            disabled={loadingEvents}
            title="Refresh submissions"
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loadingEvents ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleLogout}
            title="Logout from admin panel"
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* ─── Floating Toast Notification ──────────────────────────────────── */}
      {notificationMsg && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-md p-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-start gap-3 border transition-all animate-in fade-in slide-in-from-bottom-5 ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-600 shadow-emerald-950/20'
              : 'bg-rose-900 text-white border-rose-600 shadow-rose-950/20'
          }`}
        >
          {notificationMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="text-xs sm:text-sm font-semibold flex-1">{notificationMsg.text}</div>
          <button
            onClick={() => setNotificationMsg(null)}
            className="text-white/70 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Section Switcher: Hackathons vs Blogs vs Mentors vs Team ─────── */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/90 dark:bg-white/[0.04] backdrop-blur-md rounded-2xl border border-slate-200/90 dark:border-white/[0.08] w-fit shadow-xs flex-wrap">
        <button
          type="button"
          onClick={() => setActiveSection('hackathons')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeSection === 'hackathons'
              ? 'bg-white dark:bg-white/[0.1] text-slate-900 dark:text-white shadow-xs border border-slate-200/90 dark:border-white/[0.1]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.04]'
          }`}
        >
          <Sparkles className="w-4 h-4 text-[#0099e6]" />
          <span>Hackathons Review</span>
          {stats.pending > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold shadow-xs">
              {stats.pending}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('blogs')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeSection === 'blogs'
              ? 'bg-white dark:bg-white/[0.1] text-slate-900 dark:text-white shadow-xs border border-slate-200/90 dark:border-white/[0.1]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.04]'
          }`}
        >
          <PenTool className="w-4 h-4 text-[#0099e6]" />
          <span>Blogs Moderation</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('mentors')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeSection === 'mentors'
              ? 'bg-white dark:bg-white/[0.1] text-slate-900 dark:text-white shadow-xs border border-slate-200/90 dark:border-white/[0.1]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.04]'
          }`}
        >
          <Award className="w-4 h-4 text-[#0099e6]" />
          <span>Mentor Applications</span>
          {pendingMentorsCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-extrabold shadow-xs">
              {pendingMentorsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('team')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
            activeSection === 'team'
              ? 'bg-white dark:bg-white/[0.1] text-slate-900 dark:text-white shadow-xs border border-slate-200/90 dark:border-white/[0.1]'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/[0.04]'
          }`}
        >
          <Users className="w-4 h-4 text-[#0099e6]" />
          <span>Team &amp; Access</span>
          {teamCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-sky-500/15 text-[#0099e6] dark:text-[#38bdf8] border border-sky-500/30 text-[10px] font-extrabold shadow-xs">
              {teamCount}
            </span>
          )}
        </button>
      </div>

      {activeSection === 'blogs' ? (
        <AdminBlogsModeration
          onNotification={setNotificationMsg}
          currentUserRole={currentUserRole}
        />
      ) : activeSection === 'mentors' ? (
        <AdminMentorsModeration
          onNotification={setNotificationMsg}
          onPendingCountChange={setPendingMentorsCount}
          currentUserRole={currentUserRole}
        />
      ) : activeSection === 'team' ? (
        <AdminTeamManagement
          onNotification={setNotificationMsg}
          currentUserRole={currentUserRole}
          currentEmail={currentAdminUser?.email || user?.email || supabaseUser?.email}
          onTeamCountUpdate={setTeamCount}
        />
      ) : (
        <>
          {/* ─── Metric Cards (Hacker's Unity Theme) ──────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* Pending Review (Primary Action Item) */}
            <div
              onClick={() => setStatusFilter('PENDING')}
              className={`p-6 rounded-3xl border transition-all cursor-pointer select-none ${
                statusFilter === 'PENDING'
                  ? 'bg-amber-50/90 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 shadow-md shadow-amber-500/10'
                  : 'bg-white dark:bg-[#0c1017] border-slate-200/90 dark:border-white/[0.08] hover:border-amber-200 dark:hover:border-amber-500/30 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Pending Review
                </span>
                <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{stats.pending}</span>
                {stats.pending > 0 && (
                  <span className="text-xs text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 animate-pulse">
                    Needs Action
                  </span>
                )}
              </div>
            </div>

            {/* Live on Website */}
            <div
              onClick={() => setStatusFilter('APPROVED')}
              className={`p-6 rounded-3xl border transition-all cursor-pointer select-none ${
                statusFilter === 'APPROVED'
                  ? 'bg-emerald-50/90 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/40 shadow-md shadow-emerald-500/10'
                  : 'bg-white dark:bg-[#0c1017] border-slate-200/90 dark:border-white/[0.08] hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Live on Website
                </span>
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{stats.approved}</span>
                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">Public</span>
              </div>
            </div>

            {/* Rejected */}
            <div
              onClick={() => setStatusFilter('REJECTED')}
              className={`p-6 rounded-3xl border transition-all cursor-pointer select-none ${
                statusFilter === 'REJECTED'
                  ? 'bg-rose-50/90 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/40 shadow-md shadow-rose-500/10'
                  : 'bg-white dark:bg-[#0c1017] border-slate-200/90 dark:border-white/[0.08] hover:border-rose-200 dark:hover:border-rose-500/30 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  Rejected
                </span>
                <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{stats.rejected}</span>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">Hidden</span>
              </div>
            </div>

            {/* Total Applications */}
            <div
              onClick={() => setStatusFilter('ALL')}
              className={`p-6 rounded-3xl border transition-all cursor-pointer select-none ${
                statusFilter === 'ALL'
                  ? 'bg-sky-50/90 dark:bg-sky-500/10 border-sky-300 dark:border-sky-500/40 shadow-md shadow-sky-500/10'
                  : 'bg-white dark:bg-[#0c1017] border-slate-200/90 dark:border-white/[0.08] hover:border-sky-200 dark:hover:border-sky-500/30 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#0099e6] dark:text-[#38bdf8]">
                  Total Applications
                </span>
                <div className="w-10 h-10 rounded-2xl bg-sky-100 dark:bg-sky-500/20 text-[#0099e6] dark:text-[#38bdf8] flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{stats.total}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">All Time</span>
              </div>
            </div>
          </div>

          {/* ─── Search & Tab Filters ────────────────────────────────────────── */}
          <div className="bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] p-3 rounded-2xl shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {/* Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(
                [
                  { key: 'PENDING', label: 'Pending Review', count: stats.pending },
                  { key: 'APPROVED', label: 'Approved & Live', count: stats.approved },
                  { key: 'SHOWCASE', label: 'Showcase Order', count: stats.approved },
                  { key: 'UTM', label: 'UTM Tracking', count: utmLinksTotalCount },
                  { key: 'REJECTED', label: 'Rejected', count: stats.rejected },
                  { key: 'DRAFT', label: 'Drafts', count: stats.draft },
                  { key: 'ALL', label: 'All Submissions', count: stats.total },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 cursor-pointer ${
                    statusFilter === tab.key
                      ? 'bg-[#0099e6] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      statusFilter === tab.key ? 'bg-white text-[#0099e6]' : 'bg-slate-100 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            {statusFilter !== 'SHOWCASE' && (
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, host, college..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.08] focus:bg-white dark:focus:bg-[#080c14] focus:border-[#0099e6] focus:ring-1 focus:ring-[#0099e6] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-medium transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick banner on Approved tab */}
          {statusFilter === 'APPROVED' && (
            <div className="bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-transparent border border-sky-500/20 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-[#0099e6] dark:text-[#38bdf8] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-[#0099e6]" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    Custom Homepage Showcase Placement
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Want to customize which hackathons appear first, in the center, or at the end on the homepage carousel?
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStatusFilter('SHOWCASE')}
                className="px-4 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 shadow-xs cursor-pointer"
              >
                <GripVertical className="w-4 h-4" />
                <span>Arrange Showcase Order (Drag &amp; Drop)</span>
              </button>
            </div>
          )}

      {/* ─── SHOWCASE REORDER VIEW OR UTM VIEW OR SUBMISSIONS LIST ───────── */}
      {statusFilter === 'SHOWCASE' ? (
        <AdminShowcaseReorder
          events={events}
          onOrderSaved={(updatedList) => {
            setEvents((prev) =>
              prev.map((ev) => {
                const match = updatedList.find((u) => u.id === ev.id);
                return match && typeof match.display_order === 'number'
                  ? { ...ev, display_order: match.display_order }
                  : ev;
              })
            );
          }}
        />
      ) : statusFilter === 'UTM' ? (
        <AdminUtmSection
          events={events}
          initialSelectedEventId={selectedEvent?.id || null}
          onNotification={(msg) => setNotificationMsg(msg)}
          isViewer={isViewer}
        />
      ) : loadingEvents ? (
        <div className="py-20 text-center bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] rounded-3xl p-8">
          <Loader2 className="w-8 h-8 text-[#0099e6] animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Loading hackathon applications...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="py-20 text-center bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] rounded-3xl p-8 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-500/10 text-[#0099e6] dark:text-[#38bdf8] flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">No applications found</h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto font-medium">
            {statusFilter === 'PENDING'
              ? 'All submitted hackathons have been reviewed! New submissions will appear here in real-time.'
              : 'No hackathons match the selected filter or search term.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const isPending =
              event.status === 'PENDING_APPROVAL' ||
              (event.status === 'DRAFT' &&
                Array.isArray(event.tags) &&
                event.tags.includes('PENDING_APPROVAL'));
            const isApproved = [
              'PUBLISHED',
              'REGISTRATION_OPEN',
              'LIVE',
              'JUDGING',
              'COMPLETED',
              'ARCHIVED',
            ].includes(event.status);
            const isRejected = event.status === 'REJECTED';

            return (
              <div
                key={event.id}
                className="bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16] rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left details */}
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Status badge & categories */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {isPending && (
                      <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        PENDING APPROVAL
                      </span>
                    )}
                    {isApproved && (
                      <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        APPROVED &amp; LIVE
                      </span>
                    )}
                    {isApproved && (
                      <button
                        type="button"
                        onClick={() => setStatusFilter('SHOWCASE')}
                        className="px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 font-extrabold text-[11px] flex items-center gap-1 cursor-pointer transition"
                        title="Click to customize homepage showcase order"
                      >
                        <Flame className="w-3 h-3 text-[#f97316]" />
                        <span>Home Slot #{typeof event.display_order === 'number' && event.display_order < 9999 ? event.display_order + 1 : '—'}</span>
                      </button>
                    )}
                    {isRejected && (
                      <span className="px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400 font-bold flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5" />
                        REJECTED
                      </span>
                    )}
                    {!isPending && !isApproved && !isRejected && (
                      <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 font-bold">
                        {event.status}
                      </span>
                    )}

                    <span className="px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-500/10 text-[#0099e6] dark:text-[#38bdf8] font-bold text-[11px]">
                      {event.category || 'HACKATHON'}
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                      {event.event_type || 'ONLINE'}
                    </span>
                    {event.allow_external_redirect ? (
                      <span className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1 border border-emerald-200 dark:border-emerald-500/20" title="External registration redirect allowed">
                        <Globe className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Redirect Allowed</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 font-medium text-[11px] flex items-center gap-1 border border-slate-200 dark:border-white/[0.08]" title="Registrations locked to HackersUnity platform">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Redirect Locked</span>
                      </span>
                    )}
                    <span className="text-slate-400 dark:text-slate-500 text-[11px] font-medium">
                      Submitted {new Date(event.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <div className="min-w-0">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 truncate">
                      <span className="truncate">{event.title}</span>
                      {isApproved && (
                        <Link
                          href={`/hackathons/${event.slug}`}
                          target="_blank"
                          className="text-[#0099e6] hover:text-[#0284c7] transition shrink-0"
                          title="View on main site"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                    </h3>
                    {event.tagline && (
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium line-clamp-1 mt-0.5">
                        {event.tagline}
                      </p>
                    )}
                  </div>

                  {/* Metadata: Host, Dates, Prize, Registrations, Submissions */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 text-xs pt-1">
                    {/* Organizer */}
                    <div className="flex items-center gap-2.5 min-w-0" title={event.organizer_name || 'Independent'}>
                      <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-[#0099e6] dark:text-[#38bdf8] flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="truncate min-w-0">
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Host / Org</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                          {event.organizer_name || 'Independent'}
                        </span>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div className="truncate min-w-0">
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Event Timeline</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                          {new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} -{' '}
                          {new Date(event.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Prize */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-[#ea580c] dark:text-[#fb923c] flex items-center justify-center shrink-0">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div className="truncate min-w-0">
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Prize Pool</span>
                        <span className="font-black text-[#ea580c] dark:text-[#fb923c] truncate block">
                          {formatCurrency(event.total_prize_value || 0, (event.currency as 'INR' | 'USD') || 'INR')}
                        </span>
                      </div>
                    </div>

                    {/* Registrations Stat */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="truncate min-w-0">
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Registrations</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                          {event.registration_count || 0} Registered
                        </span>
                      </div>
                    </div>

                    {/* Submissions Stat */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="truncate min-w-0">
                        <span className="text-slate-400 dark:text-slate-500 block text-[10px] font-bold uppercase tracking-wider">Submissions</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">
                          {event.submission_count || 0} Projects
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="w-full lg:w-[490px] xl:w-[510px] shrink-0 flex flex-col items-stretch lg:items-end justify-center gap-2.5 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-white/[0.06]">
                  {/* Action buttons in uniform 4-column grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="w-full px-2.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs text-center"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#0099e6] shrink-0" />
                      <span className="truncate">Review Details</span>
                    </button>

                    <button
                      onClick={() => setEditingEvent(event)}
                      disabled={isViewer}
                      className={`w-full px-2.5 py-2 rounded-2xl border text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs text-center ${
                        isViewer
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-white/[0.04] text-slate-400 border-slate-200 dark:border-white/[0.06]'
                          : 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 border border-sky-200 dark:border-sky-500/30 text-[#0099e6] dark:text-[#38bdf8] cursor-pointer'
                      }`}
                      title={isViewer ? 'Viewer role has read-only access' : 'Edit this hackathon as platform admin'}
                    >
                      <PenTool className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Edit Event</span>
                    </button>

                    <Link
                      href={`/dashboard/events/${event.id || event.slug}/registrations`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-2 py-2 rounded-2xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs text-center"
                      title="View participant registrations"
                    >
                      <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">Registrations ({event.registration_count || 0})</span>
                    </Link>

                    <Link
                      href={`/dashboard/events/${event.id || event.slug}/submissions`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full px-2 py-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs text-center"
                      title="View project submissions"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span className="truncate">Submissions ({event.submission_count || 0})</span>
                    </Link>
                  </div>

                  {/* Status action control & redirect toggle */}
                  <div className="flex items-center justify-between w-full gap-2 flex-wrap sm:flex-nowrap">
                    {/* Toggle Redirect Permission */}
                    <button
                      type="button"
                      onClick={() => handleToggleExternalRedirect(event)}
                      disabled={actionLoadingId === event.id || isViewer}
                      className={`px-3 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 border shrink-0 ${
                        isViewer
                          ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-white/[0.04] text-slate-400 border-slate-200 dark:border-white/[0.08]'
                          : event.allow_external_redirect
                          ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/40 cursor-pointer'
                          : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40 cursor-pointer'
                      }`}
                      title={
                        isViewer
                          ? 'Viewer role has read-only access'
                          : event.allow_external_redirect
                          ? 'Click to revoke external redirect permission (lock registration to platform)'
                          : 'Click to allow host to redirect registration to external portal'
                      }
                    >
                      {actionLoadingId === event.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : event.allow_external_redirect ? (
                        <Lock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                      ) : (
                        <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      )}
                      <span>{event.allow_external_redirect ? 'Disable Redirect' : 'Allow Redirect'}</span>
                    </button>

                    {/* Quick UTM Referral Link Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEvent(event);
                        setUtmModalEvent(event);
                      }}
                      className="px-3 py-2 rounded-2xl border text-xs font-bold transition flex items-center gap-1.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 border-sky-200 dark:border-sky-500/30 text-[#0099e6] dark:text-[#38bdf8] cursor-pointer shadow-2xs shrink-0"
                      title="Create & Copy Custom UTM Referral Link"
                    >
                      <Link2 className="w-3.5 h-3.5 shrink-0" />
                      <span>UTM Link</span>
                    </button>

                    <div className="flex items-center gap-2 justify-end ml-auto">
                      {isPending && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(event)}
                            disabled={actionLoadingId === event.id || isViewer}
                            className={`px-5 py-2 rounded-2xl text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-md ${
                              isViewer
                                ? 'opacity-40 cursor-not-allowed bg-emerald-600/60'
                                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 cursor-pointer'
                            }`}
                            title={isViewer ? 'Viewer role has read-only access' : 'Approve hackathon'}
                          >
                            {actionLoadingId === event.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => setRejectModalEvent(event)}
                            disabled={actionLoadingId === event.id || isViewer}
                            className={`px-4 py-2 rounded-2xl border font-bold text-xs transition flex items-center gap-1.5 ${
                              isViewer
                                ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                                : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 cursor-pointer'
                            }`}
                            title={isViewer ? 'Viewer role has read-only access' : 'Reject application'}
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}

                      {isApproved && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setStatusFilter('SHOWCASE')}
                            disabled={isViewer}
                            className={`px-3 py-2 rounded-2xl border text-xs font-bold transition flex items-center gap-1.5 ${
                              isViewer
                                ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                                : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 cursor-pointer'
                            }`}
                            title={isViewer ? 'Viewer role has read-only access' : 'Open Drag & Drop Showcase Ordering'}
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                            <span>Showcase Order</span>
                          </button>
                          <button
                            onClick={() => setRejectModalEvent(event)}
                            disabled={isViewer}
                            className={`px-4 py-2 rounded-2xl border text-xs font-bold transition ${
                              isViewer
                                ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                                : 'bg-slate-50 hover:bg-rose-50 dark:bg-white/[0.04] dark:hover:bg-rose-950/30 text-slate-500 hover:text-rose-700 dark:text-slate-400 dark:hover:text-rose-400 border-slate-200 dark:border-white/[0.08] hover:border-rose-200 dark:hover:border-rose-900/40 cursor-pointer'
                            }`}
                            title={isViewer ? 'Viewer role has read-only access' : 'Revoke Live Status'}
                          >
                            Revoke Live Status
                          </button>
                        </div>
                      )}

                      {isRejected && (
                        <button
                          onClick={() => handleApprove(event)}
                          disabled={actionLoadingId === event.id || isViewer}
                          className={`px-4 py-2 rounded-2xl border font-bold text-xs transition flex items-center gap-1.5 ${
                            isViewer
                              ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400 cursor-pointer'
                          }`}
                          title={isViewer ? 'Viewer role has read-only access' : 'Re-Approve'}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Re-Approve</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Detail Review Modal ─────────────────────────────────────────── */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-white/[0.08] flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-white/[0.02]">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span
                    className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                      selectedEvent.status === 'PUBLISHED'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                        : selectedEvent.status === 'REJECTED'
                        ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                        : 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30'
                    }`}
                  >
                    STATUS: {selectedEvent.status}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    Slug: {selectedEvent.slug}
                  </span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{selectedEvent.title}</h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">{selectedEvent.tagline}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                <button
                  onClick={() => {
                    const evtToEdit = selectedEvent;
                    setSelectedEvent(null);
                    setEditingEvent(evtToEdit);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 border border-sky-200 dark:border-sky-500/30 text-[#0099e6] dark:text-[#38bdf8] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  title="Edit this event"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Edit Event</span>
                </button>
                <Link
                  href={`/dashboard/events/${selectedEvent.id || selectedEvent.slug}/registrations`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                  title="View attendee registrations"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Registrations ({selectedEvent.registration_count || 0})</span>
                </Link>
                <Link
                  href={`/dashboard/events/${selectedEvent.id || selectedEvent.slug}/submissions`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                  title="View project submissions"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Submissions ({selectedEvent.submission_count || 0})</span>
                </Link>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {/* Registrations & Submissions Quick Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/30 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">Total Registrations</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {selectedEvent.registration_count || 0}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Builders &amp; team applicants
                    </span>
                  </div>
                  <Link
                    href={`/dashboard/events/${selectedEvent.id || selectedEvent.slug}/registrations`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>Open Table</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/30 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">Project Submissions</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white">
                      {selectedEvent.submission_count || 0}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                      Projects submitted for judging
                    </span>
                  </div>
                  <Link
                    href={`/dashboard/events/${selectedEvent.id || selectedEvent.slug}/submissions`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>Open Sheets</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
              {/* Organizer Card */}
              <div className="p-5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-800/30 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#0099e6] dark:text-[#38bdf8] flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Organizer &amp; Host Institution Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block font-medium">Organizer Name</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedEvent.organizer_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block font-medium">Host Institution</span>
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {selectedEvent.institution_name || 'Independent / Community'} ({selectedEvent.host_type || 'College'})
                    </span>
                  </div>
                  {selectedEvent.organizer_email && (
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block font-medium">Contact Email</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedEvent.organizer_email}</span>
                    </div>
                  )}
                  {selectedEvent.organizer_phone && (
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block font-medium">Contact Phone</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedEvent.organizer_phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Schedule & Format */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.08] space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#0099e6]" />
                  Schedule, Format &amp; Venue
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block font-medium">Category</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedEvent.category}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block font-medium">Format</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedEvent.event_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block font-medium">Location / Discord</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedEvent.location || 'Online'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block font-medium">Start Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(selectedEvent.start_date).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block font-medium">End Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(selectedEvent.end_date).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block font-medium">Reg. Deadline</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(selectedEvent.registration_deadline).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Description &amp; Overview
                </h4>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 text-xs leading-relaxed max-h-60 overflow-y-auto">
                  <RichDescription content={selectedEvent.description} />
                </div>
              </div>

              {/* Prizes & Tracks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Prizes */}
                <div className="p-5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-800/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#ea580c] dark:text-[#fb923c] flex items-center gap-1.5">
                      <Trophy className="w-4 h-4" />
                      Prize Breakdown
                    </h4>
                    <span className="font-black text-[#ea580c] dark:text-[#fb923c] text-base">
                      {formatCurrency(selectedEvent.total_prize_value || 0, (selectedEvent.currency as 'INR' | 'USD') || 'INR')}
                    </span>
                  </div>
                  {Array.isArray(selectedEvent.prizes) && selectedEvent.prizes.length > 0 ? (
                    <div className="space-y-1.5 mt-2">
                      {selectedEvent.prizes.map((p, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#080c14] border border-orange-100 dark:border-orange-900/30 text-xs"
                        >
                          <span className="font-bold text-slate-800 dark:text-slate-200">{p.title || `Rank ${idx + 1}`}</span>
                          <span className="font-bold text-[#ea580c] dark:text-[#fb923c]">
                            {formatCurrency(p.amount || 0, (selectedEvent.currency as 'INR' | 'USD') || 'INR')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">No individual prize tiers configured.</p>
                  )}
                </div>

                {/* Tracks */}
                <div className="p-5 rounded-2xl bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-800/30 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#0099e6] dark:text-[#38bdf8] flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    Tracks ({selectedEvent.tracks?.length || 0})
                  </h4>
                  {Array.isArray(selectedEvent.tracks) && selectedEvent.tracks.length > 0 ? (
                    <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto">
                      {selectedEvent.tracks.map((t, idx) => (
                        <div key={idx} className="p-2 rounded-xl bg-white dark:bg-[#080c14] border border-sky-100 dark:border-sky-900/30 text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">{t.title || t.name}</span>
                          {t.description && (
                            <span className="text-slate-500 dark:text-slate-400 line-clamp-1 text-[11px]">
                              {t.description}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">Open Innovation / General track.</p>
                  )}
                </div>
              </div>

              {/* Team Rules */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between text-xs font-medium">
                <span className="text-slate-500 dark:text-slate-400">Team Size Constraints:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {selectedEvent.min_team_size} to {selectedEvent.max_team_size} Members Per Squad
                </span>
              </div>

              {/* External Registration Redirect Management Card */}
              <div
                className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  selectedEvent.allow_external_redirect
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                    : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40'
                }`}
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-[#0099e6]" />
                      External Registration Redirection
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                        selectedEvent.allow_external_redirect
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                      }`}
                    >
                      {selectedEvent.allow_external_redirect ? 'Allowed / Unlocked' : 'Locked (Admin Approval Required)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {selectedEvent.allow_external_redirect
                      ? 'The host is permitted to redirect the "Register" button to an external URL. Hackers will be routed to their external portal.'
                      : 'External redirect is locked for this event. Registrations will take place directly on the HackersUnity platform.'}
                  </p>
                  {selectedEvent.registration_link ? (
                    <div className="text-xs text-sky-600 dark:text-sky-400 truncate pt-1 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Configured Link:</span>
                      <a
                        href={selectedEvent.registration_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono font-bold hover:underline truncate"
                      >
                        {selectedEvent.registration_link}
                      </a>
                    </div>
                  ) : selectedEvent.allow_external_redirect ? (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                      Unlocked: Host can now input their external link in the Host portal.
                    </p>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleExternalRedirect(selectedEvent)}
                  disabled={actionLoadingId === selectedEvent.id || isViewer}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 border shadow-xs disabled:opacity-50 ${
                    isViewer
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                      : selectedEvent.allow_external_redirect
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/50 cursor-pointer'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent shadow-emerald-600/20 cursor-pointer'
                  }`}
                  title={isViewer ? 'Viewer role has read-only access' : undefined}
                >
                  {actionLoadingId === selectedEvent.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : selectedEvent.allow_external_redirect ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Disable Redirect</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5" />
                      <span>Allow Redirect</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                onClick={() => {
                  const evtToEdit = selectedEvent;
                  setSelectedEvent(null);
                  setEditingEvent(evtToEdit);
                }}
                disabled={isViewer}
                className={`px-5 py-2.5 rounded-2xl border font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs ${
                  isViewer
                    ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-white/[0.04] text-slate-400 border-slate-200 dark:border-white/[0.06]'
                    : 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/40 border-sky-200 dark:border-sky-800/50 text-[#0099e6] dark:text-[#38bdf8] cursor-pointer'
                }`}
                title={isViewer ? 'Viewer role has read-only access' : undefined}
              >
                <PenTool className="w-4 h-4" />
                <span>Edit Event Details</span>
              </button>

              <div className="flex items-center justify-end gap-2.5 flex-wrap">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-5 py-2.5 rounded-2xl bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
                >
                  Close
                </button>

                <button
                  onClick={() => {
                    setRejectModalEvent(selectedEvent);
                    setSelectedEvent(null);
                  }}
                  disabled={isViewer}
                  className={`px-5 py-2.5 rounded-2xl border font-bold text-xs transition ${
                    isViewer
                      ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                      : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 cursor-pointer'
                  }`}
                  title={isViewer ? 'Viewer role has read-only access' : undefined}
                >
                  Reject Request
                </button>

                <button
                  onClick={() => {
                    handleApprove(selectedEvent);
                    setSelectedEvent(null);
                  }}
                  disabled={actionLoadingId === selectedEvent.id || isViewer}
                  className={`px-6 py-2.5 rounded-2xl font-extrabold text-xs transition flex items-center justify-center gap-2 shadow-md ${
                    isViewer
                      ? 'opacity-40 cursor-not-allowed bg-emerald-600/60 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 cursor-pointer'
                  }`}
                  title={isViewer ? 'Viewer role has read-only access' : undefined}
                >
                  {actionLoadingId === selectedEvent.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>Approve &amp; Publish to Website</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Reject Reason Modal ─────────────────────────────────────────── */}
      {rejectModalEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0c1017] border border-rose-200 dark:border-rose-900/40 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Reject Application</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {rejectModalEvent.title}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Setting status to <span className="font-bold text-rose-700 dark:text-rose-400">REJECTED</span> will ensure this event never appears publicly on Hacker&apos;s Unity.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Rejection Reason / Notes (Optional)
              </label>
              <textarea
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                placeholder="e.g. Unverified college credentials or incomplete prize pool documentation..."
                rows={3}
                className="w-full p-3 bg-slate-50 dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.08] focus:bg-white dark:focus:bg-[#080c14] focus:border-rose-400 focus:ring-2 focus:ring-rose-400/20 rounded-2xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-medium transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setRejectModalEvent(null);
                  setRejectFeedback('');
                }}
                className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={actionLoadingId === rejectModalEvent.id}
                className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition flex items-center gap-2 shadow-md shadow-rose-600/20 cursor-pointer"
              >
                {actionLoadingId === rejectModalEvent.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Admin Edit Event Modal ────────────────────────────────────── */}
      <AdminEditEventModal
        isOpen={Boolean(editingEvent)}
        event={editingEvent}
        onClose={() => setEditingEvent(null)}
        onSave={handleAdminEditSave}
      />

      {/* ─── Admin UTM Referral Modal ──────────────────────────────────── */}
      {utmModalEvent && (
        <AdminUtmModal
          isOpen={Boolean(utmModalEvent)}
          onClose={() => setUtmModalEvent(null)}
          event={utmModalEvent}
          onUtmCreated={() => {
            fetchUtmSummary();
          }}
          onViewInUtmSection={(ev) => {
            setUtmModalEvent(null);
            setSelectedEvent(ev);
            setStatusFilter('UTM');
          }}
          onNotification={(msg) => setNotificationMsg(msg)}
        />
      )}
        </>
      )}
    </div>
  );
}
