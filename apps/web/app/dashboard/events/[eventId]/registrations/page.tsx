'use client';

import { useState, useEffect, use, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  ArrowLeft,
  Check,
  X,
  Minus,
  ExternalLink,
  FileSpreadsheet,
  Upload,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Eye,
  Mail,
  Sparkles,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCheck,
  Shield,
  Layers,
  MoreVertical,
} from 'lucide-react';
import {
  getEventRegistrations,
  updateRegistrationStatus,
  getRegistrationStats,
  EventRegistration,
  getAllEvents,
  deleteEventRegistration,
  deleteBulkEventRegistrations,
  clearAllEventRegistrations,
  getCustomEvents,
  addToRecycleBin,
} from '@/lib/storage';
import { ExtendedEvent } from '@/lib/mock-data';
import { formatDate } from '@/lib/utils';
import { BulkRegistrationModal } from '@/components/bulk-registration-modal';
import { EventEmailModal } from '@/components/event-email-modal';
import { EventLiveBroadcastModal } from '@/components/event-live-broadcast-modal';
import { fetchEventBySlug, checkIsUserEventAdminOrHost } from '@/lib/supabase-service';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@hackers-unity/shared-types';

interface PageProps {
  params: Promise<{ eventId: string }>;
}

export default function EventRegistrationsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [event, setEvent] = useState<ExtendedEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'TEAMS' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'RSVP_YES' | 'RSVP_NO'>('ALL');
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, rsvpYes: 0, rsvpNo: 0 });
  const [serverTeams, setServerTeams] = useState<any[]>([]);
  const [expandedTeamNames, setExpandedTeamNames] = useState<Set<string>>(new Set());
  const [teamPaymentFilter, setTeamPaymentFilter] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [confirmClearChecked, setConfirmClearChecked] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Email modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailTargetParticipant, setEmailTargetParticipant] = useState<EventRegistration | null>(null);
  const [emailTargetTeam, setEmailTargetTeam] = useState<any | null>(null);
  const [emailInitialSelectedIds, setEmailInitialSelectedIds] = useState<string[]>([]);
  const [emailInitialFilter, setEmailInitialFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [isLiveBroadcastModalOpen, setIsLiveBroadcastModalOpen] = useState(false);

  // Auth context for authorization checks
  const { user, supabaseUser, loading: authLoading } = useAuth();
  const currentUserId = supabaseUser?.id || user?.id;

  // Co-host state & async verification
  const [isCoHost, setIsCoHost] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  // Authorization check: only event host/organizer, co-hosts, and admins can access
  const isEventHost = useMemo(() => {
    if (typeof document !== 'undefined' && document.cookie.includes('is_admin_csap=1')) return true;
    if (user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) return true;
    if (isCoHost) return true;
    if (!currentUserId || !event) return false;

    if ((event as any).isCoHost) return true;

    if (
      event.organizerId &&
      event.organizerId !== 'usr_organizer' &&
      (event.organizerId === currentUserId || event.organizerId === user?.id || event.organizerId === supabaseUser?.id)
    ) {
      return true;
    }

    if (
      (event as any).organizer_id &&
      ((event as any).organizer_id === currentUserId || (event as any).organizer_id === user?.id || (event as any).organizer_id === supabaseUser?.id)
    ) {
      return true;
    }

    if (
      (event as any).created_by &&
      ((event as any).created_by === currentUserId || (event as any).created_by === user?.id || (event as any).created_by === supabaseUser?.id)
    ) {
      return true;
    }

    const custom = getCustomEvents();
    if (custom.some((ce) => ce.id === event.id || (event.slug && ce.slug === event.slug))) {
      return true;
    }

    if (event.organizerId === 'usr_organizer' && user?.role === UserRole.ORGANIZER) {
      return true;
    }

    return false;
  }, [user?.role, currentUserId, event, user?.id, supabaseUser?.id, isCoHost]);

  // Verify Co-Host and Organizer permissions in real time
  useEffect(() => {
    let isCancelled = false;

    async function verifyAccess() {
      if (typeof document !== 'undefined' && document.cookie.includes('is_admin_csap=1')) {
        setCheckingAccess(false);
        return;
      }
      if (user?.role === UserRole.ADMIN || user?.role === UserRole.SUPER_ADMIN) {
        setCheckingAccess(false);
        return;
      }

      // Check sessionStorage cache from Dashboard navigation for instant unlock
      if (typeof window !== 'undefined') {
        try {
          const cached = sessionStorage.getItem('hackers_unity_current_event');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed && (parsed.id === resolvedParams.eventId || parsed.slug === resolvedParams.eventId)) {
              if (parsed.isCoHost) {
                setIsCoHost(true);
                setCheckingAccess(false);
                return;
              }
            }
          }
        } catch {}
      }

      const uid = currentUserId;
      if (!uid) {
        if (!authLoading) {
          setCheckingAccess(false);
        }
        return;
      }

      if (
        event &&
        (event.organizerId === uid ||
          (event as any).organizer_id === uid ||
          (event as any).created_by === uid ||
          (event as any).isCoHost)
      ) {
        if (!isCancelled) {
          setIsCoHost(true);
          setCheckingAccess(false);
        }
        return;
      }

      const targetParam = event?.id || resolvedParams.eventId;
      if (targetParam && uid) {
        const authorized = await checkIsUserEventAdminOrHost(targetParam, uid, user?.email);
        if (!isCancelled) {
          if (authorized) {
            setIsCoHost(true);
            if (event) (event as any).isCoHost = true;
          }
          setCheckingAccess(false);
        }
      } else {
        if (!isCancelled) setCheckingAccess(false);
      }
    }

    verifyAccess();

    return () => {
      isCancelled = true;
    };
  }, [event?.id, resolvedParams.eventId, currentUserId, authLoading, user?.role, user?.email]);

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewingApplicant, setViewingApplicant] = useState<any | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Email handlers
  const handleOpenEmailAll = (filter: 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED' = 'ALL') => {
    setEmailTargetParticipant(null);
    setEmailTargetTeam(null);
    setEmailInitialSelectedIds([]);
    setEmailInitialFilter(filter);
    setIsEmailModalOpen(true);
  };

  const handleOpenEmailSelected = () => {
    setEmailTargetParticipant(null);
    setEmailTargetTeam(null);
    setEmailInitialSelectedIds(selectedIds);
    setEmailInitialFilter('ALL');
    setIsEmailModalOpen(true);
  };

  const handleOpenEmailSingle = (reg: EventRegistration) => {
    setEmailTargetParticipant(reg);
    setEmailTargetTeam(null);
    setEmailInitialSelectedIds([reg.id]);
    setIsEmailModalOpen(true);
  };

  const loadData = async () => {
    let found = getAllEvents().find((e) => e.id === resolvedParams.eventId || e.slug === resolvedParams.eventId);
    if (!found) {
      found = (await fetchEventBySlug(resolvedParams.eventId)) || undefined;
    }
    if (found) {
      if ((found as any).isCoHost) {
        setIsCoHost(true);
      }
      setEvent(found);

      // 1. Fetch live participant registrations from database via API
      let dbRegistrations: any[] = [];
      try {
        const res = await fetch(`/api/registrations?eventId=${encodeURIComponent(resolvedParams.eventId)}&list=true`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.registrations)) {
            dbRegistrations = json.registrations;
          }
          if (json.success && Array.isArray(json.teams)) {
            setServerTeams(json.teams);
          }
        }
      } catch (apiErr) {
        console.warn('Could not fetch DB registrations, using local storage fallback:', apiErr);
      }

      // 2. Also read localStorage for any locally saved or uploaded applicants
      const localById = getEventRegistrations(found.id);
      const localBySlug = found.slug && found.slug !== found.id ? getEventRegistrations(found.slug) : [];

      // 3. Merge: Database registrations take priority, then local entries
      const map = new Map<string, any>();
      dbRegistrations.forEach((r) => {
        const key = (r.userEmail || r.id || '').toLowerCase().trim();
        if (key) map.set(key, r);
      });

      [...localById, ...localBySlug].forEach((r: any) => {
        const key = (r.userEmail || r.user_email || r.id || '').toLowerCase().trim();
        if (key && !map.has(key)) {
          map.set(key, r);
        }
      });

      const combined = Array.from(map.values());
      setRegistrations(combined);
      setStats({
        total: combined.length,
        approved: combined.filter((r) => r.status === 'APPROVED' || r.status === 'CONFIRMED').length,
        pending: combined.filter((r) => r.status === 'PENDING').length,
        rejected: combined.filter((r) => r.status === 'REJECTED').length,
        rsvpYes: combined.filter((r) => r.rsvpStatus === 'ATTENDING' || r.customAnswers?.rsvpStatus === 'ATTENDING').length,
        rsvpNo: combined.filter((r) => r.rsvpStatus === 'NOT_ATTENDING' || r.customAnswers?.rsvpStatus === 'NOT_ATTENDING').length,
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const handleStorage = () => {
      loadData();
    };
    window.addEventListener('hackers_unity_storage_change', handleStorage);
    return () => window.removeEventListener('hackers_unity_storage_change', handleStorage);
  }, [resolvedParams.eventId, currentUserId]);

  // Status changes
  const handleStatusChange = async (regId: string, newStatus: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    if (!event) return;
    updateRegistrationStatus(event.id, regId, newStatus);
    setRegistrations((prev) =>
      prev.map((r) => (r.id === regId ? { ...r, status: newStatus } : r))
    );

    try {
      await fetch('/api/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          id: regId,
          status: newStatus,
          eventId: event.id,
        }),
      });
    } catch (err) {
      console.warn('Failed to sync status to DB:', err);
    }
    loadData();
  };

  // Single delete
  const handleDeleteSingle = async (regId: string, name: string) => {
    if (!event) return;
    deleteEventRegistration(event.id, regId);
    setSelectedIds((prev) => prev.filter((id) => id !== regId));
    setRegistrations((prev) => prev.filter((r) => r.id !== regId));

    try {
      await fetch(`/api/registrations?id=${encodeURIComponent(regId)}&eventId=${encodeURIComponent(event.id)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.warn('Failed to delete from DB:', err);
    }

    loadData();
    setNotification({
      text: `Deleted registration for ${name}.`,
      type: 'info',
    });
    setTimeout(() => {
      setNotification((curr) => (curr?.type === 'info' ? null : curr));
    }, 4000);
  };

  // Bulk status update
  const handleBulkStatusChange = async (status: 'APPROVED' | 'REJECTED' | 'PENDING') => {
    if (!event || selectedIds.length === 0) return;
    selectedIds.forEach((id) => updateRegistrationStatus(event.id, id, status));
    setRegistrations((prev) =>
      prev.map((r) => (selectedIds.includes(r.id) ? { ...r, status } : r))
    );

    try {
      await fetch('/api/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_status',
          ids: selectedIds,
          status,
          eventId: event.id,
        }),
      });
    } catch (err) {
      console.warn('Failed to bulk sync status to DB:', err);
    }

    loadData();
    setNotification({
      text: `Updated ${selectedIds.length} applicants to ${status === 'PENDING' ? 'None' : status}.`,
      type: 'success',
    });
    setSelectedIds([]);
    setTimeout(() => {
      setNotification((curr) => (curr?.type === 'success' ? null : curr));
    }, 4000);
  };

  // Bulk delete selected
  const handleBulkDeleteSelected = async () => {
    if (!event || selectedIds.length === 0) return;
    const count = deleteBulkEventRegistrations(event.id, selectedIds);
    const toDeleteIds = [...selectedIds];
    setSelectedIds([]);
    setRegistrations((prev) => prev.filter((r) => !toDeleteIds.includes(r.id)));

    try {
      await fetch('/api/registrations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_bulk',
          ids: toDeleteIds,
          eventId: event.id,
        }),
      });
    } catch (err) {
      console.warn('Failed to bulk delete from DB:', err);
    }

    loadData();
    setNotification({
      text: `Successfully deleted ${count} registrations.`,
      type: 'success',
    });
    setTimeout(() => {
      setNotification((curr) => (curr?.type === 'success' ? null : curr));
    }, 5000);
  };

  // Clear all registrations (with safety backup to Recycle Bin)
  const handleClearAll = async () => {
    if (!event) return;

    // Save recovery snapshot to Recycle Bin
    if (registrations.length > 0) {
      addToRecycleBin({
        type: 'REGISTRATION',
        title: `${event.title} - All Registrations (${registrations.length})`,
        subtitle: `Host cleared all ${registrations.length} participants (can be restored from Recycle Bin)`,
        eventId: event.id,
        eventName: event.title,
        itemCount: registrations.length,
        data: [...registrations],
      });
    }

    const count = clearAllEventRegistrations(event.id);
    setShowClearModal(false);
    setConfirmClearChecked(false);
    setSelectedIds([]);
    setRegistrations([]);

    try {
      await fetch('/api/registrations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clear_all',
          eventId: event.id,
        }),
      });
    } catch (err) {
      console.warn('Failed to clear registrations from DB:', err);
    }

    loadData();
    setNotification({
      text: `Cleared all ${registrations.length || count} registrations. Safe backup stored in Recycle Bin!`,
      type: 'info',
    });
    setTimeout(() => {
      setNotification((curr) => (curr?.type === 'success' ? null : curr));
    }, 6000);
  };

  // Aggregated teams list from server and registrations
  const teamsList = useMemo(() => {
    const teamsMap = new Map<string, any>();

    // 1. Seed from serverTeams if provided
    serverTeams.forEach((st: any) => {
      const teamId = st.teamId || st.id;
      const key = teamId ? `team_${teamId}` : (st.teamName || st.name || '').toLowerCase().trim();
      if (key) {
        teamsMap.set(key, {
          id: teamId || key,
          teamId: teamId || null,
          teamName: st.teamName || st.name,
          isPaid: Boolean(st.isPaid || st.paymentStatus === 'PAID'),
          paymentStatus: st.isPaid || st.paymentStatus === 'PAID' ? 'PAID' : 'UNPAID',
          transactionConfirmed: st.isPaid || st.paymentStatus === 'PAID' ? 'Yes' : 'No',
          transactionDate: st.transactionDate || null,
          utrNumber: st.utrNumber || null,
          paymentId: st.paymentId || null,
          paymentAmount: st.paymentAmount || null,
          paymentProofLink: st.paymentProofLink || null,
          paymentMethod: st.paymentMethod || null,
          leaderName: st.leaderName || '',
          leaderEmail: st.leaderEmail || '',
          leaderPhone: st.leaderPhone || '',
          members: Array.isArray(st.members) ? [...st.members] : [],
        });
      }
    });

    // Helper to find existing team in teamsMap for registration r
    const findTeamKey = (r: any): string | null => {
      const regTeamId = r.teamId || (r as any).team_id;
      if (regTeamId && teamsMap.has(`team_${regTeamId}`)) {
        return `team_${regTeamId}`;
      }
      // Check if any team already contains this member by email
      const userEmail = (r.userEmail || (r as any).email || '').toLowerCase().trim();
      if (userEmail) {
        for (const [k, t] of teamsMap.entries()) {
          if (Array.isArray(t.members) && t.members.some((m: any) => (m.userEmail || m.email || '').toLowerCase().trim() === userEmail)) {
            return k;
          }
        }
      }
      if (regTeamId) {
        return `team_${regTeamId}`;
      }
      const rawTeamName = r.teamName?.trim();
      if (rawTeamName && rawTeamName.toLowerCase() !== 'solo builders') {
        const nameKey = rawTeamName.toLowerCase();
        if (teamsMap.has(nameKey)) return nameKey;
        for (const [k, t] of teamsMap.entries()) {
          if ((t.teamName || '').toLowerCase().trim() === nameKey) {
            return k;
          }
        }
        return nameKey;
      }
      return null;
    };

    // 2. Aggregate all combined registrations
    registrations.forEach((r) => {
      const rawTeamName = r.teamName?.trim() || 'Solo Builders';
      const key = findTeamKey(r) || (rawTeamName.toLowerCase() === 'solo builders' ? `solo_${r.id || r.userEmail}` : rawTeamName.toLowerCase());

      if (!teamsMap.has(key)) {
        teamsMap.set(key, {
          id: r.teamId || (r as any).team_id || key,
          teamId: r.teamId || (r as any).team_id || null,
          teamName: rawTeamName,
          isPaid: Boolean(r.paymentConfirmed || r.paymentStatus === 'PAID'),
          paymentStatus: r.paymentConfirmed || r.paymentStatus === 'PAID' ? 'PAID' : 'UNPAID',
          transactionConfirmed: r.paymentConfirmed || r.paymentStatus === 'PAID' ? 'Yes' : 'No',
          transactionDate: r.transactionDate || null,
          utrNumber: r.utrNumber || null,
          paymentId: r.paymentId || null,
          paymentAmount: r.paymentAmount || null,
          paymentProofLink: r.paymentProofLink || null,
          paymentMethod: r.paymentMethod || null,
          leaderName: '',
          leaderEmail: '',
          leaderPhone: '',
          members: [],
        });
      }

      const team = teamsMap.get(key);

      if (r.paymentConfirmed || r.paymentStatus === 'PAID') {
        team.isPaid = true;
        team.paymentStatus = 'PAID';
        team.transactionConfirmed = 'Yes';
        if (!team.transactionDate && r.transactionDate) team.transactionDate = r.transactionDate;
        if (!team.utrNumber && r.utrNumber) team.utrNumber = r.utrNumber;
        if (!team.paymentId && r.paymentId) team.paymentId = r.paymentId;
        if (!team.paymentAmount && r.paymentAmount) team.paymentAmount = r.paymentAmount;
        if (!team.paymentProofLink && r.paymentProofLink) team.paymentProofLink = r.paymentProofLink;
        if (!team.paymentMethod && r.paymentMethod) team.paymentMethod = r.paymentMethod;
      }

      if (r.role?.toLowerCase().includes('lead') || !team.leaderEmail) {
        team.leaderName = r.userName || team.leaderName;
        team.leaderEmail = r.userEmail || team.leaderEmail;
        team.leaderPhone = r.phone || team.leaderPhone;
      }

      // Add member to team if not present (de-duplicate by email or id)
      const rEmail = (r.userEmail || (r as any).email || '').toLowerCase().trim();
      const alreadyIn = team.members.some((m: any) => 
        (m.id && r.id && m.id === r.id) || 
        (rEmail && (m.userEmail || m.email || '').toLowerCase().trim() === rEmail)
      );
      if (!alreadyIn) {
        team.members.push(r);
      }
    });

    // 3. Propagate payment status to all members in that squad
    for (const team of teamsMap.values()) {
      if (team.isPaid) {
        team.members.forEach((m: any) => {
          m.paymentConfirmed = true;
          m.paymentStatus = 'PAID';
          m.transactionConfirmed = 'Yes';
          m.transactionDate = m.transactionDate || team.transactionDate;
          m.utrNumber = m.utrNumber || team.utrNumber;
          m.paymentAmount = m.paymentAmount || team.paymentAmount;
          m.paymentProofLink = m.paymentProofLink || team.paymentProofLink;
          m.paymentMethod = m.paymentMethod || team.paymentMethod;
        });
      }
    }

    return Array.from(teamsMap.values()).sort((a, b) => {
      if (a.isPaid !== b.isPaid) return a.isPaid ? -1 : 1;
      return b.members.length - a.members.length;
    });
  }, [serverTeams, registrations]);

  const paidTeamsCount = useMemo(() => teamsList.filter((t) => t.isPaid).length, [teamsList]);
  const unpaidTeamsCount = useMemo(() => teamsList.filter((t) => !t.isPaid).length, [teamsList]);

  // Filtered teams for the Teams View
  const filteredTeams = useMemo(() => {
    return teamsList.filter((team) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        team.teamName.toLowerCase().includes(q) ||
        (team.leaderName && team.leaderName.toLowerCase().includes(q)) ||
        (team.leaderEmail && team.leaderEmail.toLowerCase().includes(q)) ||
        (team.utrNumber && team.utrNumber.toLowerCase().includes(q)) ||
        team.members.some(
          (m: any) =>
            m.userName?.toLowerCase().includes(q) ||
            m.userEmail?.toLowerCase().includes(q) ||
            (m.college && m.college.toLowerCase().includes(q)) ||
            (m.city && m.city.toLowerCase().includes(q))
        );

      const matchesPayment =
        teamPaymentFilter === 'ALL' ||
        (teamPaymentFilter === 'PAID' && team.isPaid) ||
        (teamPaymentFilter === 'UNPAID' && !team.isPaid);

      return matchesSearch && matchesPayment;
    });
  }, [teamsList, searchQuery, teamPaymentFilter]);

  const toggleTeamExpand = (teamKey: string) => {
    setExpandedTeamNames((prev) => {
      const next = new Set(prev);
      if (next.has(teamKey)) {
        next.delete(teamKey);
      } else {
        next.add(teamKey);
      }
      return next;
    });
  };

  const expandAllTeams = () => {
    setExpandedTeamNames(new Set(filteredTeams.map((t) => t.id || t.teamName)));
  };

  const collapseAllTeams = () => {
    setExpandedTeamNames(new Set());
  };

  const handleCopyUtr = (utr: string) => {
    if (!utr) return;
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleApproveTeam = async (team: any) => {
    if (!event || !team.members || team.members.length === 0) return;
    const memberIds = team.members.map((m: any) => m.id);
    memberIds.forEach((id: string) => updateRegistrationStatus(event.id, id, 'APPROVED'));
    setRegistrations((prev) =>
      prev.map((r) => (memberIds.includes(r.id) ? { ...r, status: 'APPROVED' } : r))
    );

    try {
      await fetch('/api/registrations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk_status',
          ids: memberIds,
          status: 'APPROVED',
          eventId: event.id,
        }),
      });
    } catch {}

    setNotification({
      text: `Approved all ${memberIds.length} members of ${team.teamName}.`,
      type: 'success',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleEmailTeam = (team: any) => {
    const memberIds = (team.members || []).map((m: any) => m.id).filter(Boolean);
    setEmailTargetParticipant(null);
    setEmailTargetTeam(team);
    setEmailInitialSelectedIds(memberIds);
    setEmailInitialFilter('ALL');
    setIsEmailModalOpen(true);
  };

  // Helper for safe RFC 4180 CSV cells without line breaks or quote distortion
  const formatCsvCell = (val: any): string => {
    if (val === null || val === undefined) return '""';
    if (typeof val === 'object') {
      try {
        const str = Array.isArray(val) ? val.join('; ') : JSON.stringify(val);
        return `"${String(str).replace(/"/g, '""').replace(/\r\n|\n|\r/g, ' ')}"`;
      } catch {
        return '""';
      }
    }
    const str = String(val);
    return `"${str.replace(/"/g, '""').replace(/\r\n|\n|\r/g, ' ')}"`;
  };

  // Export Teams CSV (Exports all teams squads with member breakdown)
  const handleExportTeamsCSV = () => {
    if (!event) return;
    const targetTeams = teamsList;
    if (targetTeams.length === 0) {
      setNotification({
        text: 'No teams squads found to export.',
        type: 'error',
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const headers = [
      'Team Name',
      'Payment Confirmed (Yes/No)',
      'Date of Transaction',
      'UTR Proof of Transaction',
      'Payment Status',
      'Payment Amount',
      'Payment Method',
      'Team Leader Name',
      'Team Leader Email',
      'Team Leader Phone',
      'Total Members Count',
      'Members (Name - Email - Phone - Status)',
    ];

    const rows = targetTeams.map((t) => [
      formatCsvCell(t.teamName || 'Squad'),
      formatCsvCell(t.isPaid ? 'Yes' : 'No'),
      formatCsvCell(t.transactionDate ? formatDate(t.transactionDate) : ''),
      formatCsvCell(t.utrNumber || (t.isPaid ? 'CONFIRMED' : '')),
      formatCsvCell(t.isPaid ? 'PAID' : 'UNPAID'),
      formatCsvCell((t.paymentAmount || (t.isPaid ? '₹800' : '')).toString()),
      formatCsvCell(t.paymentMethod || (t.isPaid ? 'UPI' : '')),
      formatCsvCell(t.leaderName || ''),
      formatCsvCell(t.leaderEmail || ''),
      formatCsvCell(t.leaderPhone || ''),
      formatCsvCell(t.members.length),
      formatCsvCell(
        t.members
          .map((m: any) => `${m.userName} (${m.userEmail}${m.phone ? ` • ${m.phone}` : ''} • ${m.status})`)
          .join('; ')
      ),
    ]);

    const csvContent =
      '\uFEFF' +
      [
        headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.slug || event.id}-teams-${targetTeams.length}-squads.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotification({
      text: `Successfully exported CSV with all ${targetTeams.length} teams squads!`,
      type: 'success',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Export CSV (Full Registrations with all 62+ participants, transaction & UTR fields, and expanded custom questions)
  const handleExportCSV = (exportSelectedOnly: boolean = false) => {
    if (!event) return;

    // Use all registrations by default so search filters or active tabs do NOT truncate the export
    let targetData = registrations;
    if (exportSelectedOnly && selectedIds.length > 0) {
      targetData = registrations.filter((r) => selectedIds.includes(r.id));
    }

    if (targetData.length === 0) {
      setNotification({
        text: 'No registrations found to export.',
        type: 'error',
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    // Collect all custom questions defined on the event
    const definedCustomQuestions: { id: string; label: string }[] = [];
    if (Array.isArray(event.customQuestions)) {
      event.customQuestions.forEach((q: any) => {
        if (q && (q.id || q.label)) {
          definedCustomQuestions.push({
            id: q.id || q.label,
            label: q.label || q.id,
          });
        }
      });
    }

    // Also collect any extra custom question keys across all participant registrations
    const reservedKeys = new Set([
      'portfolio_url',
      'portfolioUrl',
      'resume_url',
      'resumeUrl',
      'discord_handle',
      'discordHandle',
      'twitter_url',
      'twitterUrl',
      'tshirt_size',
      'tshirtSize',
      'dietary_preference',
      'dietaryPreference',
      'experience_level',
      'experienceLevel',
      'rsvpStatus',
      'attendanceCount',
      'hardwareRequirement',
      'remarks',
      'declineReason',
    ]);

    const extraCustomKeys: string[] = [];
    targetData.forEach((r) => {
      if (r.customAnswers && typeof r.customAnswers === 'object') {
        Object.keys(r.customAnswers).forEach((k) => {
          if (
            !reservedKeys.has(k) &&
            !definedCustomQuestions.some((q) => q.id === k) &&
            !extraCustomKeys.includes(k)
          ) {
            extraCustomKeys.push(k);
          }
        });
      }
    });

    const headers = [
      'Participant Name',
      'Email Address',
      'Phone Number',
      'Team Name',
      'Team Role',
      'Transaction Confirmed (Yes/No)',
      'Date of Transaction',
      'UTR Proof of Transaction',
      'Payment Status',
      'Payment Amount',
      'Payment Method',
      'Payment Proof Reference',
      'College / University',
      'City',
      'GitHub Profile',
      'LinkedIn Profile',
      'Skills',
      'Portfolio URL',
      'Resume URL',
      'Discord Handle',
      'Twitter / X Profile',
      'T-Shirt Size',
      'Dietary Preference',
      'Experience Level',
      // Dynamically added custom questions as individual spreadsheet columns
      ...definedCustomQuestions.map((q) => `Question: ${q.label}`),
      ...extraCustomKeys.map((k) => `Custom: ${k}`),
      'RSVP Status',
      'RSVP Attendance Count',
      'RSVP Dietary Preference',
      'RSVP T-Shirt Size',
      'RSVP Hardware Requirement',
      'RSVP Remarks / Decline Reason',
      'Application Status',
      'Registered Date',
      'Registered Timestamp (ISO)',
      'Registration ID',
      'Raw Custom Answers (JSON)',
    ];

    const rows = targetData.map((r) => {
      const dynamicCustomValues = definedCustomQuestions.map((q) => {
        const val =
          r.customAnswers?.[q.id] ??
          r.customAnswers?.[q.label] ??
          r.customAnswers?.[q.id.toLowerCase()] ??
          '';
        return formatCsvCell(typeof val === 'object' ? JSON.stringify(val) : val);
      });

      const extraCustomValues = extraCustomKeys.map((k) => {
        const val = r.customAnswers?.[k] ?? '';
        return formatCsvCell(typeof val === 'object' ? JSON.stringify(val) : val);
      });

      return [
        formatCsvCell(r.userName || 'Hacker'),
        formatCsvCell(r.userEmail || ''),
        formatCsvCell(r.phone || ''),
        formatCsvCell(r.teamName || 'Solo Builder'),
        formatCsvCell(r.role || (r.isTeam ? 'Team Leader' : 'Individual Hacker')),
        formatCsvCell(r.paymentConfirmed || r.paymentStatus === 'PAID' ? 'Yes' : 'No'),
        formatCsvCell(r.transactionDate ? formatDate(r.transactionDate) : ''),
        formatCsvCell(r.utrNumber || (r.paymentConfirmed ? 'CONFIRMED' : '')),
        formatCsvCell(r.paymentConfirmed || r.paymentStatus === 'PAID' ? 'PAID' : (r.paymentStatus || 'UNPAID')),
        formatCsvCell((r.paymentAmount || (r.paymentConfirmed ? '₹800' : '')).toString()),
        formatCsvCell(r.paymentMethod || (r.paymentConfirmed ? 'UPI' : '')),
        formatCsvCell((r as any).paymentProofLink || ''),
        formatCsvCell(r.college || ''),
        formatCsvCell(r.city || ''),
        formatCsvCell(r.githubUrl || ''),
        formatCsvCell(r.linkedinUrl || ''),
        formatCsvCell((r.skills || []).join('; ')),
        formatCsvCell((r as any).portfolioUrl || r.customAnswers?.portfolio_url || r.customAnswers?.portfolioUrl || ''),
        formatCsvCell((r as any).resumeUrl || r.customAnswers?.resume_url || r.customAnswers?.resumeUrl || ''),
        formatCsvCell((r as any).discordHandle || r.customAnswers?.discord_handle || r.customAnswers?.discordHandle || ''),
        formatCsvCell((r as any).twitterUrl || r.customAnswers?.twitter_url || r.customAnswers?.twitterUrl || ''),
        formatCsvCell((r as any).tshirtSize || r.customAnswers?.tshirt_size || r.customAnswers?.tshirtSize || r.tshirtSize || ''),
        formatCsvCell((r as any).dietaryPreference || r.customAnswers?.dietary_preference || r.customAnswers?.dietaryPreference || r.dietaryPreference || ''),
        formatCsvCell((r as any).experienceLevel || r.customAnswers?.experience_level || r.customAnswers?.experienceLevel || ''),
        ...dynamicCustomValues,
        ...extraCustomValues,
        formatCsvCell(r.rsvpStatus || r.customAnswers?.rsvpStatus || 'PENDING'),
        formatCsvCell(r.customAnswers?.attendanceCount || ''),
        formatCsvCell(r.dietaryPreference || r.customAnswers?.dietaryPreference || ''),
        formatCsvCell(r.tshirtSize || r.customAnswers?.tshirtSize || ''),
        formatCsvCell(r.customAnswers?.hardwareRequirement || ''),
        formatCsvCell(r.customAnswers?.remarks || r.customAnswers?.declineReason || ''),
        formatCsvCell(r.status),
        formatCsvCell(r.registeredAt ? formatDate(r.registeredAt) : ''),
        formatCsvCell(r.registeredAt || ''),
        formatCsvCell(r.id || ''),
        formatCsvCell(r.customAnswers && Object.keys(r.customAnswers).length > 0 ? JSON.stringify(r.customAnswers) : ''),
      ];
    });

    const csvContent =
      '\uFEFF' +
      [
        headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.slug || event.id}-all-${targetData.length}-participants.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setNotification({
      text: `Successfully downloaded CSV with all ${targetData.length} participants!`,
      type: 'success',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filtered registrations
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((r) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        (r.teamName && r.teamName.toLowerCase().includes(q)) ||
        (r.phone && r.phone.toLowerCase().includes(q)) ||
        (r.utrNumber && r.utrNumber.toLowerCase().includes(q)) ||
        (r.college && r.college.toLowerCase().includes(q)) ||
        (r.city && r.city.toLowerCase().includes(q));

      const rsvp = r.rsvpStatus || r.customAnswers?.rsvpStatus;

      const matchesStatus =
        statusFilter === 'ALL' ||
        statusFilter === 'TEAMS' ||
        (statusFilter === 'APPROVED' && (r.status === 'APPROVED' || r.status === 'CONFIRMED')) ||
        (statusFilter === 'RSVP_YES' && rsvp === 'ATTENDING') ||
        (statusFilter === 'RSVP_NO' && rsvp === 'NOT_ATTENDING') ||
        r.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [registrations, searchQuery, statusFilter]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredRegistrations.length / pageSize));
  const paginatedRegistrations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRegistrations.slice(start, start + pageSize);
  }, [filteredRegistrations, currentPage, pageSize]);

  // Selection handlers
  const isAllPageSelected =
    paginatedRegistrations.length > 0 &&
    paginatedRegistrations.every((r) => selectedIds.includes(r.id));

  const toggleSelectAllPage = () => {
    if (isAllPageSelected) {
      const pageIds = new Set(paginatedRegistrations.map((r) => r.id));
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...paginatedRegistrations.map((r) => r.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (loading || authLoading || checkingAccess) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <div className="w-7 h-7 border-2 border-[#0099e6] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">Loading Registrations...</p>
      </div>
    );
  }

  if (!isEventHost) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#0d121d] border border-rose-500/20 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-5 text-rose-400 shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Organizer Access Only</h1>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            You do not have permission to view or manage participant registrations for{' '}
            <span className="text-white font-medium">{event?.title || 'this event'}</span>.
            This dashboard is strictly reserved for the event organizer and platform administrators.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href={event?.slug ? `/hackathons/${event.slug}` : `/hackathons/${resolvedParams.eventId}`}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0099e6] hover:bg-[#0088cc] text-white font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-[#0099e6]/20"
            >
              <ArrowLeft className="w-4 h-4" /> Go to Hackathon Overview
            </Link>
            <Link
              href="/dashboard"
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-medium text-sm transition-colors flex items-center justify-center"
            >
              Back to My Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1 space-y-8">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-[#0099e6] dark:hover:text-[#0099e6] font-semibold mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Organizer Dashboard</span>
          </Link>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Manage Registrations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            {event ? (
              <>
                Showing hacker applicants for <strong className="text-slate-900 dark:text-white">{event.title}</strong>
              </>
            ) : (
              'Loading hackathon data...'
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-linear-to-r from-[#0099e6] to-[#0077b6] hover:from-[#0088cc] hover:to-[#00669e] text-white text-xs font-bold transition-all shadow-xs hover:shadow flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload</span>
          </button>

          <button
            onClick={() =>
              handleOpenEmailAll(
                statusFilter === 'RSVP_YES'
                  ? 'APPROVED'
                  : statusFilter === 'RSVP_NO'
                  ? 'REJECTED'
                  : statusFilter === 'TEAMS'
                  ? 'ALL'
                  : statusFilter
              )
            }
            disabled={registrations.length === 0}
            className="px-4 py-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-[#0099e6] dark:text-sky-300 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send broadcast email to registered participants"
          >
            <Mail className="w-4 h-4 text-[#0099e6]" />
            <span>Email Participants</span>
          </button>

          <button
            onClick={() => setIsLiveBroadcastModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
            title="Broadcast announcement email to all platform users (118+ users in public.profiles)"
          >
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Announce to Platform</span>
          </button>

          {/* ─── Unified Export Sheet Dropdown ─── */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
              disabled={registrations.length === 0}
              className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isExportDropdownOpen
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-white dark:bg-[#0c1017] border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-200'
              }`}
              title="Download event registration and team spreadsheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Export Sheet</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isExportDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isExportDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsExportDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-[#101622] rounded-2xl border border-slate-200 dark:border-white/[0.12] shadow-2xl py-2 z-40 text-left animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Select Data to Download
                  </div>

                  {/* Option 1: All Participants */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportDropdownOpen(false);
                      handleExportCSV(false);
                    }}
                    disabled={registrations.length === 0}
                    className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-xs text-slate-900 dark:text-white">All Participants</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Complete profile, questions & payment info
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-[10px] font-bold font-mono text-slate-600 dark:text-slate-300">
                      {registrations.length}
                    </span>
                  </button>

                  {/* Option 2: Teams Breakdown */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportDropdownOpen(false);
                      handleExportTeamsCSV();
                    }}
                    disabled={teamsList.length === 0}
                    className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-sky-50 dark:hover:bg-sky-950/30 hover:text-sky-700 dark:hover:text-sky-300 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
                        <Layers className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-xs text-slate-900 dark:text-white">Teams Squads</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          Team squads, members & payments
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-[10px] font-bold font-mono text-slate-600 dark:text-slate-300">
                      {teamsList.length}
                    </span>
                  </button>

                  {/* Option 3: Selected Applicants (if any selected) */}
                  {selectedIds.length > 0 && (
                    <div className="mt-1 pt-1 border-t border-slate-100 dark:border-white/[0.08]">
                      <button
                        type="button"
                        onClick={() => {
                          setIsExportDropdownOpen(false);
                          handleExportCSV(true);
                        }}
                        className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-[#0099e6]/10 hover:text-[#0099e6] flex items-center justify-between gap-3 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-[#0099e6]/10 text-[#0099e6]">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-left">
                            <div className="font-bold text-xs text-slate-900 dark:text-white">Selected Only</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              Only checked applicants
                            </div>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-[#0099e6]/10 text-[#0099e6] text-[10px] font-bold font-mono">
                          {selectedIds.length}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setShowClearModal(true)}
            disabled={registrations.length === 0}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#0c1017] border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-700 dark:text-red-400 text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete all registration data"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            <span>Delete All</span>
          </button>
        </div>
      </div>

      {/* ─── Success / Info Alert Notification ──────────────────── */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            notification.type === 'error'
              ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-200'
              : notification.type === 'info'
              ? 'bg-blue-50 dark:bg-sky-950/30 border-blue-200 dark:border-sky-850/40 text-blue-800 dark:text-sky-200'
              : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-850/40 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
            ) : notification.type === 'info' ? (
              <Users className="w-5 h-5 text-[#0099e6] shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            )}
            <span className="font-semibold">{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Stats Cards ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Applicants</span>
            <Users className="w-4 h-4 text-[#0099e6]" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.total}</div>
        </div>

        <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#0099e6] dark:text-sky-400">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-[#0099e6] dark:text-sky-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{stats.approved}</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">RSVP Confirmed</span>
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-900 dark:text-emerald-200 font-mono">{stats.rsvpYes}</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-900 dark:text-amber-200 font-mono">{stats.pending}</div>
        </div>

        <div className="p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 dark:text-red-400">Rejected / Declined</span>
            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
          </div>
          <div className="text-2xl font-black text-red-900 dark:text-red-200 font-mono">{stats.rejected + stats.rsvpNo}</div>
        </div>
      </div>

      {/* ─── Filter & Search Bar ────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0c1017] p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by hacker name, email, college, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-[#0099e6] dark:focus:border-[#0099e6]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: `All (${registrations.length})` },
            { id: 'TEAMS', label: `Teams (${teamsList.length})` },
            { id: 'RSVP_YES', label: `RSVP Attending (${stats.rsvpYes})` },
            { id: 'RSVP_NO', label: `RSVP Declined (${stats.rsvpNo})` },
            { id: 'APPROVED', label: `Approved (${stats.approved})` },
            { id: 'PENDING', label: `None (${stats.pending})` },
            { id: 'REJECTED', label: `Rejected (${stats.rejected})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-[#0099e6] text-white shadow-2xs'
                  : 'bg-slate-50 dark:bg-[#121824] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.08]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Bulk Action Bar (When rows are selected) ─────────────── */}
      {selectedIds.length > 0 && (
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded-full bg-[#0099e6] text-white text-[11px] font-black font-mono">
              {selectedIds.length}
            </span>
            <span className="text-xs font-bold">applicants selected</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleBulkStatusChange('APPROVED')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve Selected</span>
            </button>

            <button
              onClick={() => handleBulkStatusChange('REJECTED')}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reject Selected</span>
            </button>

            <button
              onClick={() => handleBulkStatusChange('PENDING')}
              className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
              <span>None Selected</span>
            </button>

            <button
              onClick={handleOpenEmailSelected}
              className="px-3 py-1.5 rounded-xl bg-[#0099e6] hover:bg-[#0088cc] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Selected ({selectedIds.length})</span>
            </button>

            <button
              onClick={() => handleExportCSV(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Export only selected participants to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Selected ({selectedIds.length})</span>
            </button>

            <button
              onClick={handleBulkDeleteSelected}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* ─── Main View: Teams View OR Registrations Table ─────────── */}
      {statusFilter === 'TEAMS' ? (
        <div className="space-y-4">
          {/* Teams Header Bar / Sub-filters */}
          <div className="bg-white dark:bg-[#0c1017] p-4 rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Filter Squads:
              </span>
              <button
                onClick={() => setTeamPaymentFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  teamPaymentFilter === 'ALL'
                    ? 'bg-[#0099e6] text-white shadow-2xs'
                    : 'bg-slate-50 dark:bg-[#121824] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08]'
                }`}
              >
                All Teams ({teamsList.length})
              </button>

              <button
                onClick={() => setTeamPaymentFilter('PAID')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  teamPaymentFilter === 'PAID'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800/40'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Payment Confirmed ({paidTeamsCount})</span>
              </button>

              <button
                onClick={() => setTeamPaymentFilter('UNPAID')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  teamPaymentFilter === 'UNPAID'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-200 dark:border-amber-800/40'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Payment Pending ({unpaidTeamsCount})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={expandAllTeams}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#121824] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] text-xs font-bold transition-colors cursor-pointer"
              >
                Expand All
              </button>
              <button
                onClick={collapseAllTeams}
                className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#121824] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08] text-xs font-bold transition-colors cursor-pointer"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Teams Cards List */}
          {filteredTeams.length === 0 ? (
            <div className="bg-white dark:bg-[#0c1017] rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-sm py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">No teams found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No teams match your current search query or payment status filter.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTeams.map((team) => {
                const teamKey = team.id || team.teamName;
                const isExpanded = expandedTeamNames.has(teamKey);
                return (
                  <div
                    key={teamKey}
                    className="bg-white dark:bg-[#0c1017] rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-white/[0.16]"
                  >
                    {/* Header Row: Click to Expand */}
                    <div
                      onClick={() => toggleTeamExpand(teamKey)}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none bg-slate-50/50 dark:bg-white/[0.01] hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm tracking-wider uppercase shrink-0 ${
                            team.isPaid
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {team.teamName.slice(0, 2)}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                              {team.teamName}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 font-mono">
                              {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                            <span>
                              Leader: <strong className="text-slate-700 dark:text-slate-300">{team.leaderName || '—'}</strong>
                            </span>
                            {team.leaderEmail && <span className="font-mono text-[11px]">({team.leaderEmail})</span>}
                            {team.leaderPhone && <span className="text-[11px]">• {team.leaderPhone}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Payment Badge & Expand Toggle */}
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        {team.isPaid ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Payment Confirmed (Yes)</span>
                            </span>
                            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 hidden sm:inline-block">
                              {team.paymentAmount || '₹800'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                              <span>Payment Pending (No)</span>
                            </span>
                          </div>
                        )}

                        <div className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>

                    {/* Accordion Content: Shows team members & payment details */}
                    {isExpanded && (
                      <div className="border-t border-slate-200 dark:border-white/[0.08] p-4 sm:p-5 space-y-4 bg-white dark:bg-[#0c1017]">
                        {/* Squad Transaction & Payment Card */}
                        <div
                          className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                            team.isPaid
                              ? 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-800/30'
                              : 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-800/30'
                          }`}
                        >
                          <div className="flex items-start sm:items-center gap-3">
                            <div
                              className={`p-2.5 rounded-xl shrink-0 ${
                                team.isPaid
                                  ? 'bg-emerald-500/20 text-emerald-500'
                                  : 'bg-amber-500/20 text-amber-500'
                              }`}
                            >
                              <CreditCard className="w-5 h-5" />
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                                  Transaction Status:
                                </span>
                                <span
                                  className={`text-xs font-black uppercase px-2 py-0.5 rounded-md ${
                                    team.isPaid
                                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                      : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                  }`}
                                >
                                  {team.isPaid ? 'YES - CONFIRMED & VERIFIED' : 'NO - UNPAID / NOT RECEIVED'}
                                </span>
                                {team.paymentAmount && (
                                  <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                                    • Amount: {team.paymentAmount}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 flex-wrap">
                                {team.transactionDate && (
                                  <span>
                                    <strong>Date:</strong> {formatDate(team.transactionDate)}
                                  </span>
                                )}

                                {team.utrNumber ? (
                                  <div className="flex items-center gap-1 font-mono">
                                    <strong>UTR Proof:</strong>
                                    <span className="text-slate-900 dark:text-white font-bold">{team.utrNumber}</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCopyUtr(team.utrNumber);
                                      }}
                                      className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors"
                                      title="Copy UTR Proof"
                                    >
                                      {copiedUtr === team.utrNumber ? (
                                        <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                ) : team.isPaid ? (
                                  <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                                    UTR Proof: Verified Online (Razorpay)
                                  </span>
                                ) : (
                                  <span className="italic text-slate-400">UTR Proof: Awaiting payment</span>
                                )}

                                {team.paymentProofLink && (
                                  <a
                                    href={team.paymentProofLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#0099e6] hover:underline font-semibold inline-flex items-center gap-0.5"
                                  >
                                    View Receipt <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Squad Actions */}
                          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproveTeam(team);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                              title="Approve all registered members of this team"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve All Members</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEmailTeam(team);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-[#0099e6] dark:text-sky-300 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                              title="Broadcast email to all members of this squad"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span>Email Squad</span>
                            </button>
                          </div>
                        </div>

                        {/* Members Table */}
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-white/[0.08]">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider">
                              <tr>
                                <th className="py-3 px-4">Member Name & Email</th>
                                <th className="py-3 px-4">Role</th>
                                <th className="py-3 px-4">College / City</th>
                                <th className="py-3 px-4">RSVP Status</th>
                                <th className="py-3 px-4">Payment</th>
                                <th className="py-3 px-4">Status</th>
                                <th className="py-3 px-4 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-slate-700 dark:text-slate-300">
                              {team.members.map((member: any) => {
                                const isLeader =
                                  (member.userEmail && team.leaderEmail && member.userEmail.toLowerCase() === team.leaderEmail.toLowerCase()) ||
                                  (member.role && member.role.toLowerCase() === 'leader');
                                return (
                                  <tr
                                    key={member.id || member.userEmail}
                                    className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors"
                                  >
                                    <td className="py-3 px-4">
                                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                                        <span>{member.userName}</span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setViewingApplicant(member);
                                          }}
                                          title="View Full Profile & Application"
                                          className="p-1 rounded-md text-slate-400 hover:text-[#0099e6] hover:bg-sky-50 dark:hover:bg-sky-950/50 border border-transparent hover:border-sky-200 dark:hover:border-sky-800/40 transition-colors cursor-pointer inline-flex items-center"
                                        >
                                          <Eye className="w-3 h-3" />
                                        </button>
                                        {isLeader && (
                                          <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                            Leader
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                        {member.userEmail}
                                      </div>
                                      {member.phone && (
                                        <div className="text-[10px] text-slate-400">{member.phone}</div>
                                      )}
                                    </td>

                                    <td className="py-3 px-4">
                                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                                        {isLeader ? 'Squad Leader' : 'Team Member'}
                                      </span>
                                    </td>

                                    <td className="py-3 px-4">
                                      <div className="font-medium text-slate-800 dark:text-slate-200">
                                        {member.college || '—'}
                                      </div>
                                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {member.city || '—'}
                                      </div>
                                    </td>

                                    <td className="py-3 px-4">
                                      {member.rsvpStatus === 'ATTENDING' || member.customAnswers?.rsvpStatus === 'ATTENDING' ? (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 inline-flex items-center gap-1">
                                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> Attending
                                        </span>
                                      ) : member.rsvpStatus === 'NOT_ATTENDING' || member.customAnswers?.rsvpStatus === 'NOT_ATTENDING' ? (
                                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 inline-flex items-center gap-1">
                                          <XCircle className="w-2.5 h-2.5 text-rose-500" /> Declined
                                        </span>
                                      ) : (
                                        <span className="text-[11px] text-slate-400 font-mono">Pending</span>
                                      )}
                                    </td>

                                    <td className="py-3 px-4">
                                      {team.isPaid || member.paymentConfirmed || member.paymentStatus === 'PAID' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> Confirmed (Yes)
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                          Pending (No)
                                        </span>
                                      )}
                                    </td>

                                    <td className="py-3 px-4 whitespace-nowrap">
                                      {member.status === 'APPROVED' || member.status === 'CONFIRMED' ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                                          Approved
                                        </span>
                                      ) : member.status === 'REJECTED' ? (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40">
                                          Rejected
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]">
                                          None
                                        </span>
                                      )}
                                    </td>

                                    <td className="py-3 px-4 text-right">
                                      <div className="inline-flex items-center gap-1.5 justify-end">
                                        {/* Email button: as it is */}
                                        <button
                                          type="button"
                                          onClick={() => handleOpenEmailSingle(member)}
                                          title={`Send Email to ${member.userName}`}
                                          className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-[#0099e6] dark:text-sky-300 transition-colors cursor-pointer border border-sky-200 dark:border-sky-800/40"
                                        >
                                          <Mail className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Dropdown Menu for Status */}
                                        <div className="relative">
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setActiveDropdownId(activeDropdownId === `team-${member.id}` ? null : `team-${member.id}`);
                                            }}
                                            className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                                              activeDropdownId === `team-${member.id}`
                                                ? 'bg-slate-200 dark:bg-white/[0.12] text-slate-900 dark:text-white border-slate-300 dark:border-white/20'
                                                : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
                                            }`}
                                            title="Change Status"
                                          >
                                            <MoreVertical className="w-3.5 h-3.5" />
                                          </button>

                                          {activeDropdownId === `team-${member.id}` && (
                                            <>
                                              <div
                                                className="fixed inset-0 z-30"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setActiveDropdownId(null);
                                                }}
                                              />
                                              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-[#121824] rounded-2xl border border-slate-200 dark:border-white/[0.12] shadow-xl py-1.5 z-40 text-left animate-in fade-in zoom-in-95 duration-150">
                                                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                                  Change Status
                                                </div>

                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStatusChange(member.id, 'APPROVED');
                                                    setActiveDropdownId(null);
                                                  }}
                                                  className="w-full px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-2 cursor-pointer transition-colors"
                                                >
                                                  <Check className="w-3.5 h-3.5" />
                                                  <span>Approve</span>
                                                </button>

                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStatusChange(member.id, 'REJECTED');
                                                    setActiveDropdownId(null);
                                                  }}
                                                  className="w-full px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer transition-colors"
                                                >
                                                  <X className="w-3.5 h-3.5" />
                                                  <span>Reject</span>
                                                </button>

                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStatusChange(member.id, 'PENDING');
                                                    setActiveDropdownId(null);
                                                  }}
                                                  className="w-full px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer transition-colors"
                                                >
                                                  <Minus className="w-3.5 h-3.5" />
                                                  <span>Set to None</span>
                                                </button>
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ─── Registrations Table ────────────────────────────────── */
        <div className="bg-white dark:bg-[#0c1017] rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-sm overflow-hidden">
          {filteredRegistrations.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white">No applicants found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'ALL'
                  ? 'Try adjusting your search query or status filter.'
                  : 'Registrations will appear here in real-time as builders apply or when uploaded.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-400 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={isAllPageSelected}
                        onChange={toggleSelectAllPage}
                        className="rounded border-slate-300 dark:border-white/20 text-[#0099e6] focus:ring-[#0099e6] cursor-pointer"
                        title="Select all on this page"
                      />
                    </th>
                    <th className="py-3.5 px-4">Applicant</th>
                    <th className="py-3.5 px-4">College / City</th>
                    <th className="py-3.5 px-4">Profiles & Skills</th>
                    <th className="py-3.5 px-4">Registered Date</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Transaction</th>
                    <th className="py-3.5 px-4 whitespace-nowrap">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.06] text-slate-700 dark:text-slate-300">
                  {paginatedRegistrations.map((reg) => {
                    const isSelected = selectedIds.includes(reg.id);
                    const isPaid = reg.paymentConfirmed || reg.paymentStatus === 'PAID';
                    return (
                      <tr
                        key={reg.id}
                        className={`transition-colors ${
                          isSelected ? 'bg-blue-50/40 dark:bg-sky-950/20' : 'hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRow(reg.id)}
                            className="rounded border-slate-300 dark:border-white/20 text-[#0099e6] focus:ring-[#0099e6] cursor-pointer"
                          />
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                            <span>{reg.userName}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingApplicant(reg);
                              }}
                              title="View Full Profile & Application"
                              className="p-1 rounded-md text-slate-400 hover:text-[#0099e6] hover:bg-sky-50 dark:hover:bg-sky-950/50 border border-transparent hover:border-sky-200 dark:hover:border-sky-800/40 transition-colors cursor-pointer inline-flex items-center"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                            {(reg.rsvpStatus === 'ATTENDING' || reg.customAnswers?.rsvpStatus === 'ATTENDING') && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 inline-flex items-center gap-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> RSVP Yes
                              </span>
                            )}
                            {(reg.rsvpStatus === 'NOT_ATTENDING' || reg.customAnswers?.rsvpStatus === 'NOT_ATTENDING') && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 inline-flex items-center gap-0.5">
                                <XCircle className="w-2.5 h-2.5 text-rose-500" /> RSVP No
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{reg.userEmail}</div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 flex-wrap mt-0.5">
                            {reg.teamName && (
                              <span className="font-semibold text-slate-600 dark:text-slate-300">
                                Team: {reg.teamName}
                              </span>
                            )}
                            {isPaid ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400/80 border border-amber-500/20">
                                Unpaid
                              </span>
                            )}
                            {reg.phone && <span>• {reg.phone}</span>}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800 dark:text-slate-200">{reg.college || '—'}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{reg.city || '—'}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 mb-1">
                            {reg.githubUrl && (
                              <a
                                href={reg.githubUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0099e6] hover:underline text-[11px] font-semibold inline-flex items-center gap-0.5"
                              >
                                GitHub <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                            {reg.linkedinUrl && (
                              <a
                                href={reg.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0099e6] hover:underline text-[11px] font-semibold inline-flex items-center gap-0.5"
                              >
                                LinkedIn <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {(reg.skills || []).slice(0, 3).map((s) => (
                              <span
                                key={s}
                                className="px-1.5 py-0.5 bg-slate-100 dark:bg-white/[0.06] rounded text-[10px] text-slate-600 dark:text-slate-300 font-mono"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          {formatDate(reg.registeredAt)}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isPaid ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" /> Confirmed (Yes)
                              </span>
                              {reg.utrNumber && (
                                <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                  <span>UTR: {reg.utrNumber}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyUtr(reg.utrNumber!)}
                                    className="hover:text-slate-900 dark:hover:text-white p-0.5 rounded cursor-pointer"
                                    title="Copy UTR"
                                  >
                                    {copiedUtr === reg.utrNumber ? (
                                      <CheckCheck className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-slate-400" />
                                    )}
                                  </button>
                                </div>
                              )}
                              {reg.transactionDate && (
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                                  {formatDate(reg.transactionDate)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08]">
                                Pending (No)
                              </span>
                              <div className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                                No UTR
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {reg.status === 'APPROVED' || reg.status === 'CONFIRMED' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                              Approved
                            </span>
                          ) : reg.status === 'REJECTED' ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/40">
                              Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]">
                              None
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5 justify-end">
                            {/* Email button: as it is */}
                            <button
                              type="button"
                              onClick={() => handleOpenEmailSingle(reg)}
                              title={`Send Email to ${reg.userName}`}
                              className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-[#0099e6] dark:text-sky-300 transition-colors cursor-pointer border border-sky-200 dark:border-sky-800/40"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Menu for Status & Actions */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdownId(activeDropdownId === reg.id ? null : reg.id);
                                }}
                                className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                                  activeDropdownId === reg.id
                                    ? 'bg-slate-200 dark:bg-white/[0.12] text-slate-900 dark:text-white border-slate-300 dark:border-white/20'
                                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]'
                                }`}
                                title="Change Status / Actions"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>

                              {activeDropdownId === reg.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-30"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdownId(null);
                                    }}
                                  />
                                  <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#121824] rounded-2xl border border-slate-200 dark:border-white/[0.12] shadow-xl py-1.5 z-40 text-left animate-in fade-in zoom-in-95 duration-150">
                                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                      Change Status
                                    </div>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(reg.id, 'APPROVED');
                                        setActiveDropdownId(null);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Approve</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(reg.id, 'REJECTED');
                                        setActiveDropdownId(null);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                      <span>Reject</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusChange(reg.id, 'PENDING');
                                        setActiveDropdownId(null);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                      <span>Set to None</span>
                                    </button>

                                    <div className="my-1 border-t border-slate-100 dark:border-white/[0.08]" />

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setViewingApplicant(reg);
                                        setActiveDropdownId(null);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-[#0099e6]" />
                                      <span>View Full Profile</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSingle(reg.id, reg.userName);
                                        setActiveDropdownId(null);
                                      }}
                                      className="w-full px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 cursor-pointer transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete Applicant</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ─── Pagination Footer ──────────────────────────────────── */}
          {filteredRegistrations.length > 0 && (
            <div className="p-4 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50/60 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
                <span>
                  Showing{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {(currentPage - 1) * pageSize + 1}
                  </strong>{' '}
                  to{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {Math.min(currentPage * pageSize, filteredRegistrations.length)}
                  </strong>{' '}
                  of{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {filteredRegistrations.length.toLocaleString()}
                  </strong>{' '}
                  applicants
                </span>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400 dark:text-slate-500">Rows:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="px-2 py-1 bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] rounded-lg text-slate-800 dark:text-slate-200 font-bold outline-none cursor-pointer"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={500}>500</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121824] hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <span className="text-slate-600 dark:text-slate-300 font-bold font-mono px-2">
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121824] hover:bg-slate-100 dark:hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 dark:text-slate-200 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Clear All Registrations Confirmation Modal ─────────── */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c1017] rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Delete All Registrations?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                You are about to remove all{' '}
                <strong className="text-slate-800 dark:text-slate-200 font-mono">
                  {registrations.length.toLocaleString()}
                </strong>{' '}
                registrations for <strong className="text-slate-800 dark:text-slate-200">{event?.title}</strong>.
              </p>
            </div>

            {/* Safety Confirmation Checkbox */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-50/80 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 cursor-pointer select-none transition-colors">
              <input
                type="checkbox"
                checked={confirmClearChecked}
                onChange={(e) => setConfirmClearChecked(e.target.checked)}
                className="mt-0.5 rounded text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer accent-red-600 shrink-0"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                I understand this will clear all active registrations. A safe backup will be placed in the{' '}
                <strong className="text-slate-900 dark:text-white font-bold">Recycle Bin</strong> (under My Account & Settings) where you can restore them anytime.
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowClearModal(false);
                  setConfirmClearChecked(false);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121824] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!confirmClearChecked}
                onClick={handleClearAll}
                className={`px-5 py-2.5 rounded-xl text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 ${
                  confirmClearChecked
                    ? 'bg-red-600 hover:bg-red-700 cursor-pointer shadow-red-500/20'
                    : 'bg-red-400 dark:bg-red-900/40 opacity-50 cursor-not-allowed'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Everything</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Bulk Registration Modal ────────────────────────────── */}
      {event && (
        <BulkRegistrationModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          eventId={event.id}
          eventName={event.title}
          onSuccess={({ added, updated, total }) => {
            loadData();
            setNotification({
              text: `Successfully imported registrations! Added ${added} new applicants, updated ${updated} existing. Total now: ${total.toLocaleString()}.`,
              type: 'success',
            });
            setTimeout(() => {
              setNotification((curr) => (curr?.type === 'success' ? null : curr));
            }, 8000);
          }}
        />
      )}

      {/* ─── Send Email Drawer / Modal ───────────────────────────── */}
      {isEmailModalOpen && (
        <EventEmailModal
          isOpen={isEmailModalOpen}
          onClose={() => {
            setIsEmailModalOpen(false);
            setEmailTargetTeam(null);
            setEmailTargetParticipant(null);
          }}
          event={event}
          registrations={registrations}
          singleRecipient={emailTargetParticipant}
          targetTeam={emailTargetTeam}
          initialSelectedIds={emailInitialSelectedIds}
          initialFilter={emailInitialFilter}
        />
      )}

      {/* ─── Platform Live Announcement Modal ────────────────────── */}
      <EventLiveBroadcastModal
        isOpen={isLiveBroadcastModalOpen}
        onClose={() => setIsLiveBroadcastModalOpen(false)}
        event={event}
      />

      {/* ─── Applicant Details Modal ───────────────────────────── */}
      {viewingApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0c1017] rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-2xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/[0.08]">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {viewingApplicant.userName}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300">
                    {viewingApplicant.role || 'Participant'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                  {viewingApplicant.userEmail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setViewingApplicant(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.08] text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Core Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Team Name</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{viewingApplicant.teamName || '—'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Phone Number</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingApplicant.phone || '—'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">College / Institute</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingApplicant.college || '—'}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06] space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Registered At</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{formatDate(viewingApplicant.registeredAt)}</span>
              </div>
            </div>

            {/* Dedicated Transaction & Fee Payment Card */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#0099e6]" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                    Transaction & Fee Payment Details
                  </h4>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                    viewingApplicant.paymentConfirmed || viewingApplicant.paymentStatus === 'PAID'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {viewingApplicant.paymentConfirmed || viewingApplicant.paymentStatus === 'PAID'
                    ? '✓ Transaction Confirmed (Yes)'
                    : '✕ Payment Pending (No)'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 block font-bold">Transaction Confirmed</span>
                  <span
                    className={`font-black text-xs mt-0.5 block ${
                      viewingApplicant.paymentConfirmed || viewingApplicant.paymentStatus === 'PAID'
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {viewingApplicant.paymentConfirmed || viewingApplicant.paymentStatus === 'PAID' ? 'YES' : 'NO'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 block font-bold">Date of Transaction</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 text-[11px] mt-0.5 block">
                    {viewingApplicant.transactionDate ? formatDate(viewingApplicant.transactionDate) : '—'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 block font-bold">Fee Amount</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {viewingApplicant.paymentAmount || (viewingApplicant.paymentConfirmed || viewingApplicant.paymentStatus === 'PAID' ? '₹800' : '₹0')}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.06] sm:col-span-2">
                  <span className="text-[10px] text-slate-400 block font-bold">UTR Proof of Transaction</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-slate-800 dark:text-slate-200 text-xs font-bold">
                      {viewingApplicant.utrNumber || (viewingApplicant.paymentConfirmed || viewingApplicant.paymentStatus === 'PAID' ? 'CONFIRMED' : 'Awaiting Payment Proof')}
                    </span>
                    {viewingApplicant.utrNumber && (
                      <button
                        type="button"
                        onClick={() => handleCopyUtr(viewingApplicant.utrNumber!)}
                        className="p-1 rounded bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="Copy UTR"
                      >
                        {copiedUtr === viewingApplicant.utrNumber ? (
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 block font-bold">Payment Method</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] mt-0.5 block">
                    {viewingApplicant.paymentMethod || 'Razorpay / UPI'}
                  </span>
                </div>
              </div>

              {viewingApplicant.paymentProofLink && (
                <div className="pt-1">
                  <a
                    href={viewingApplicant.paymentProofLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#0099e6] hover:underline text-xs font-semibold inline-flex items-center gap-1"
                  >
                    View Transaction Receipt / Gateway Proof <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>

            {/* Dedicated RSVP Response Info if applicant responded */}
            {(viewingApplicant.rsvpStatus || viewingApplicant.customAnswers?.rsvpStatus) && (
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#0099e6]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      RSVP Spot Confirmation Details
                    </h4>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                      (viewingApplicant.rsvpStatus || viewingApplicant.customAnswers?.rsvpStatus) === 'ATTENDING'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {(viewingApplicant.rsvpStatus || viewingApplicant.customAnswers?.rsvpStatus) === 'ATTENDING'
                      ? '✓ Attending Event'
                      : '✗ Declined Spot'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 block font-bold">Squad Attendance</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {viewingApplicant.customAnswers?.attendanceCount || '1'} Hacker(s)
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 block font-bold">Dietary Choice</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {viewingApplicant.dietaryPreference || viewingApplicant.customAnswers?.dietaryPreference || 'Veg'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 block font-bold">Swag T-Shirt</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {viewingApplicant.tshirtSize || viewingApplicant.customAnswers?.tshirtSize || 'L'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.06] sm:col-span-2">
                    <span className="text-[10px] text-slate-400 block font-bold">Hardware Kit</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                      {viewingApplicant.customAnswers?.hardwareRequirement || 'None'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 block font-bold">RSVP Recorded</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 text-[11px] mt-0.5 block">
                      {viewingApplicant.rsvpAt || viewingApplicant.customAnswers?.rsvpAt
                        ? new Date(viewingApplicant.rsvpAt || viewingApplicant.customAnswers?.rsvpAt).toLocaleDateString()
                        : 'Recorded'}
                    </span>
                  </div>
                </div>

                {viewingApplicant.customAnswers?.remarks && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.06] text-xs">
                    <span className="text-[10px] text-slate-400 block font-bold">Special Requests / Notes:</span>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5 italic">
                      &quot;{viewingApplicant.customAnswers.remarks}&quot;
                    </p>
                  </div>
                )}

                {viewingApplicant.customAnswers?.declineReason && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-xs">
                    <span className="text-[10px] text-rose-500 block font-bold">Decline Feedback:</span>
                    <p className="text-rose-800 dark:text-rose-300 mt-0.5">
                      {viewingApplicant.customAnswers.declineReason}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Profiles & Links */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Profiles & Links
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {viewingApplicant.githubUrl && (
                  <a
                    href={viewingApplicant.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:border-[#0099e6] flex items-center justify-between text-[#0099e6] font-semibold transition-colors"
                  >
                    <span>GitHub Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {viewingApplicant.linkedinUrl && (
                  <a
                    href={viewingApplicant.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:border-[#0099e6] flex items-center justify-between text-[#0099e6] font-semibold transition-colors"
                  >
                    <span>LinkedIn Profile</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {(viewingApplicant.portfolioUrl || viewingApplicant.customAnswers?.portfolio_url || viewingApplicant.customAnswers?.portfolioUrl) && (
                  <a
                    href={viewingApplicant.portfolioUrl || viewingApplicant.customAnswers?.portfolio_url || viewingApplicant.customAnswers?.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:border-[#0099e6] flex items-center justify-between text-[#0099e6] font-semibold transition-colors"
                  >
                    <span>Portfolio Website</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {(viewingApplicant.resumeUrl || viewingApplicant.customAnswers?.resume_url || viewingApplicant.customAnswers?.resumeUrl) && (
                  <a
                    href={viewingApplicant.resumeUrl || viewingApplicant.customAnswers?.resume_url || viewingApplicant.customAnswers?.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:border-[#0099e6] flex items-center justify-between text-[#0099e6] font-semibold transition-colors"
                  >
                    <span>Resume / CV</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {(viewingApplicant.discordHandle || viewingApplicant.customAnswers?.discord_handle || viewingApplicant.customAnswers?.discordHandle) && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
                    <span className="text-slate-500">Discord:</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      {viewingApplicant.discordHandle || viewingApplicant.customAnswers?.discord_handle || viewingApplicant.customAnswers?.discordHandle}
                    </span>
                  </div>
                )}
                {(viewingApplicant.twitterUrl || viewingApplicant.customAnswers?.twitter_url || viewingApplicant.customAnswers?.twitterUrl) && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] flex items-center justify-between">
                    <span className="text-slate-500">Twitter / X:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {viewingApplicant.twitterUrl || viewingApplicant.customAnswers?.twitter_url || viewingApplicant.customAnswers?.twitterUrl}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Fields & Swag */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Preferences & Swag
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 block font-bold">T-Shirt Size</span>
                  <span className="font-black text-slate-900 dark:text-white mt-0.5 block">
                    {viewingApplicant.tshirtSize || viewingApplicant.customAnswers?.tshirt_size || viewingApplicant.customAnswers?.tshirtSize || '—'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 block font-bold">Dietary</span>
                  <span className="font-black text-slate-900 dark:text-white mt-0.5 block">
                    {viewingApplicant.dietaryPreference || viewingApplicant.customAnswers?.dietary_preference || viewingApplicant.customAnswers?.dietaryPreference || '—'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.06]">
                  <span className="text-[10px] text-slate-400 block font-bold">Experience</span>
                  <span className="font-black text-slate-900 dark:text-white mt-0.5 block">
                    {viewingApplicant.experienceLevel || viewingApplicant.customAnswers?.experience_level || viewingApplicant.customAnswers?.experienceLevel || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Skills */}
            {Array.isArray(viewingApplicant.skills) && viewingApplicant.skills.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Skills & Tech Stack
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {viewingApplicant.skills.map((s: string) => (
                    <span
                      key={s}
                      className="px-2 py-0.5 bg-slate-100 dark:bg-white/[0.06] rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Questions & Answers */}
            {viewingApplicant.customAnswers && Object.keys(viewingApplicant.customAnswers).length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-white/[0.08]">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Custom Questions & Answers
                </h4>
                <div className="space-y-2">
                  {Object.entries(viewingApplicant.customAnswers)
                    .filter(([key]) => !['portfolio_url', 'portfolioUrl', 'resume_url', 'resumeUrl', 'discord_handle', 'discordHandle', 'twitter_url', 'twitterUrl', 'tshirt_size', 'tshirtSize', 'dietary_preference', 'dietaryPreference', 'experience_level', 'experienceLevel'].includes(key))
                    .map(([key, val]) => {
                      const questionObj = (event?.customQuestions || []).find((q) => q.id === key);
                      const questionLabel = questionObj ? questionObj.label : key;
                      return (
                        <div
                          key={key}
                          className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] space-y-1"
                        >
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                            {questionLabel}
                          </span>
                          <p className="text-xs text-slate-900 dark:text-white font-medium whitespace-pre-wrap">
                            {String(val) || '—'}
                          </p>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleStatusChange(viewingApplicant.id, 'APPROVED');
                    setViewingApplicant((prev: any) => (prev ? { ...prev, status: 'APPROVED' } : null));
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" /> <span>Approve</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleStatusChange(viewingApplicant.id, 'REJECTED');
                    setViewingApplicant((prev: any) => (prev ? { ...prev, status: 'REJECTED' } : null));
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <X className="w-3.5 h-3.5" /> <span>Reject</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleStatusChange(viewingApplicant.id, 'PENDING');
                    setViewingApplicant((prev: any) => (prev ? { ...prev, status: 'PENDING' } : null));
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <Minus className="w-3.5 h-3.5" /> <span>None</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEmailSingle(viewingApplicant)}
                  className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5" /> <span>Send Email</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setViewingApplicant(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


