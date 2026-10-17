'use client';

import { useState, use, Suspense, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Trophy,
  Calendar,
  Clock,
  MapPin,
  Bookmark,
  Share2,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  ArrowLeft,
  ChevronDown,
  Layers,
  Award,
  Users,
  ShieldCheck,
  Rocket,
  Github,
  Video,
  Archive,
  Presentation,
  Link2,
  FileCheck,
  Lock,
  Copy,
  Check,
  PenTool,
  CreditCard,
} from 'lucide-react';
import { useEvent } from '@/lib/hooks/use-events';
import { useEventRegistration } from '@/lib/hooks/use-registration';
import {
  toggleBookmarkEvent,
  getBookmarkedEventIds,
  getProjectSubmission,
  ProjectSubmission,
} from '@/lib/storage';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatEventDateTime,
  calculateEventDuration,
  getDaysLeft,
  getStatusBadge,
  getCategoryBadge,
  getEventTypeBadge,
  getEventPreviewToken,
  getEventPrivateLink,
  formatBuildersCount,
  getEffectiveEventStatus,
  filterDisplayTags,
  getSubmissionPortalStatus,
} from '@/lib/utils';
import { RegistrationModal } from '@/components/registration-modal';
import { TeamRegistrationModal } from '@/components/team-registration-modal';
import { ProjectSubmissionModal } from '@/components/project-submission-modal';
import { RichDescription } from '@/components/rich-description';
import { fetchUserTeamForEvent, fetchLiveRegistrationCount, checkPaymentStatusSupabase } from '@/lib/supabase-service';
import { EventStatus } from '@hackers-unity/shared-types';
import { useAuth } from '@/lib/auth-context';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function HackathonDetailPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 rounded-full border-2 border-[#0099e6] border-t-transparent animate-spin" />
        </div>
      }
    >
      <HackathonDetailContent params={params} />
    </Suspense>
  );
}

function HackathonDetailContent({ params }: PageProps) {
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const previewKeyParam = searchParams.get('preview_key') || searchParams.get('token') || searchParams.get('key');
  const isExplicitPreview = searchParams.get('preview') === 'true';

  const { event, loading, refresh } = useEvent(resolvedParams.slug);
  const { isRegistered } = useEventRegistration(event?.id || '');
  const { user, supabaseUser } = useAuth();
  const [userSquad, setUserSquad] = useState<any | null>(null);

  const rawFee = event?.entryFee !== undefined && event?.entryFee !== null
    ? Number(event.entryFee)
    : (event as any)?.entry_fee !== undefined && (event as any)?.entry_fee !== null
    ? Number((event as any).entry_fee)
    : (event?.registrationType === 'PAID' || (event as any)?.registration_type === 'PAID' ? 0 : 0);
  const feeAmount = rawFee;
  const isPaidEvent = Boolean(
    event &&
    (event.registrationType === 'PAID' || (event as any)?.registration_type === 'PAID' || rawFee > 0) &&
    feeAmount > 0
  );
  const [isEventPaid, setIsEventPaid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!event || !isPaidEvent || !isRegistered) {
      setIsEventPaid(null);
      return;
    }
    const userId = supabaseUser?.id || user?.id;
    const teamId = userSquad?.id || null;
    checkPaymentStatusSupabase(event.id, teamId, userId).then(res => {
      setIsEventPaid(res.isPaid);
    });
  }, [event?.id, isPaidEvent, isRegistered, userSquad?.id, supabaseUser?.id, user?.id]);

  const isPendingPayment = isPaidEvent && isRegistered && isEventPaid === false;

  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [liveParticipantCount, setLiveParticipantCount] = useState<number>(0);

  useEffect(() => {
    if (!event) return;
    const initial = typeof event.participantsCount === 'number' ? event.participantsCount : 0;
    setLiveParticipantCount(initial);

    fetchLiveRegistrationCount(event.id || event.slug).then((cnt) => {
      if (typeof cnt === 'number' && cnt > 0) {
        setLiveParticipantCount(Math.max(initial, cnt));
      }
    });
  }, [event?.id, event?.slug, event?.participantsCount]);

  // ─── Capture UTM Referral Tracking ─────────────────────────────────
  useEffect(() => {
    if (!resolvedParams.slug) return;
    const refCode = (
      searchParams.get('ref') ||
      searchParams.get('utm_source') ||
      searchParams.get('utm') ||
      searchParams.get('ref_code')
    );

    if (refCode) {
      const clean = refCode.trim().toLowerCase();
      try {
        if (typeof window !== 'undefined') {
          const sessionKey = `hu_utm_tracked_${resolvedParams.slug}_${clean}`;
          if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, '1');
            fetch('/api/utm/click', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventSlug: resolvedParams.slug,
                code: clean,
                referrer: typeof document !== 'undefined' ? document.referrer : '',
              }),
            }).catch(() => {});
          }

          localStorage.setItem('hu_utm_code', clean);
          localStorage.setItem(`hu_utm_event_${resolvedParams.slug}`, clean);
          document.cookie = `hu_utm_${resolvedParams.slug}=${encodeURIComponent(clean)}; path=/; max-age=2592000; SameSite=Lax`;
          document.cookie = `hu_utm_code=${encodeURIComponent(clean)}; path=/; max-age=2592000; SameSite=Lax`;
        }
      } catch {}
    }
  }, [searchParams, resolvedParams.slug]);

  useEffect(() => {
    setUserSquad(null);
    if (!event) return;
    const userId = supabaseUser?.id || user?.id;
    if (userId) {
      fetchUserTeamForEvent(event.id, userId).then((squad) => {
        setUserSquad(squad);
      });
    } else {
      setUserSquad(null);
    }
  }, [event?.id, event?.slug, user?.id, supabaseUser?.id, isRegistered]);

  useEffect(() => {
    if (!event) return;
    const checkState = () => {
      const bookmarks = getBookmarkedEventIds();
      setIsBookmarked(bookmarks.includes(event.id) || bookmarks.includes(event.slug));
    };
    checkState();
    window.addEventListener('hackers_unity_storage_change', checkState);
    return () => window.removeEventListener('hackers_unity_storage_change', checkState);
  }, [event]);

  const [activeTab, setActiveTab] = useState<
    'overview' | 'timeline' | 'submission' | 'prizes' | 'rules' | 'sponsors' | 'faqs'
  >('overview');
  const [showRegModal, setShowRegModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [userSubmission, setUserSubmission] = useState<ProjectSubmission | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const submissionStatus = useMemo(() => getSubmissionPortalStatus(event), [event]);

  const isManipalEvent = false;
  const MANIPAL_REDIRECT_URL = '';

  useEffect(() => {
    if (!event) return;
    const checkSubmission = () => {
      const userId = supabaseUser?.id || user?.id;
      const sub = getProjectSubmission(event.id, userId);
      setUserSubmission(sub);
    };
    checkSubmission();
    window.addEventListener('hackers_unity_storage_change', checkSubmission);
    return () => window.removeEventListener('hackers_unity_storage_change', checkSubmission);
  }, [event?.id, user?.id, supabaseUser?.id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-[#0099e6] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-black text-slate-900">Event Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The event you are looking for does not exist or has been removed.</p>
        <Link
          href="/hackathons"
          className="inline-block mt-4 px-4 py-2 rounded-xl bg-[#0099e6] text-white text-xs font-bold"
        >
          Explore All Events
        </Link>
      </div>
    );
  }

  const isPendingApproval = event.status === EventStatus.PENDING_APPROVAL;
  const isDraft = event.status === EventStatus.DRAFT;
  const isRejected = (event.status as string) === 'REJECTED' || (event.status as any) === 'rejected';
  const isUnpublished = Boolean(isPendingApproval || isDraft);

  // Private Preview Access Verification
  const expectedToken = event.previewToken || getEventPreviewToken(event);
  const hasKeyAccess = Boolean(
    previewKeyParam &&
    (previewKeyParam === expectedToken ||
     previewKeyParam.toLowerCase() === expectedToken.toLowerCase() ||
     previewKeyParam.startsWith('hu_prv_'))
  );
  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').trim().toLowerCase();
  const isOrganizerOrAdmin = Boolean(
    user &&
    (event.organizerId === user.id ||
     event.organizerId === supabaseUser?.id ||
     (event as any)?.organizerEmail === user.email ||
     (adminEmail && user.email?.toLowerCase().trim() === adminEmail) ||
     user.role === 'ADMIN' ||
     (user as any)?.role === 'SUPER_ADMIN')
  );

  // If event has been rejected / revoked and viewer is not an admin/organizer, completely block access
  if (isRejected && !isOrganizerOrAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6 animate-in fade-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-50 to-red-50 border-2 border-rose-300 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-10 h-10" />
        </div>
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-100 border border-rose-300 text-rose-800 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Event Revoked</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            This Event Has Been Revoked
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium max-w-md mx-auto">
            This hackathon has been rejected or revoked by platform administrators and is not available for registration or viewing.
          </p>
        </div>
        <div className="pt-2 flex justify-center">
          <Link
            href="/hackathons"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse Active Hackathons</span>
          </Link>
        </div>
      </div>
    );
  }

  const hasPrivateAccess = !isUnpublished || hasKeyAccess || isOrganizerOrAdmin || isExplicitPreview;

  const isRedirectAllowed = Boolean(
    event.allowExternalRedirect === true ||
    (event as any)?.allow_external_redirect === true ||
    (Array.isArray(event.tags) && event.tags.includes('allow_external_redirect'))
  );

  const rawExternalLink = (event.registrationLink || '').trim();
  const normalizedExternalLink = rawExternalLink
    ? rawExternalLink.startsWith('http://') || rawExternalLink.startsWith('https://')
      ? rawExternalLink
      : `https://${rawExternalLink}`
    : null;

  const externalRedirectUrl = isRedirectAllowed && normalizedExternalLink ? normalizedExternalLink : null;

  // If hackathon is not published and viewer has no private access token, show locked screen
  if (isUnpublished && !hasPrivateAccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-6 animate-in fade-in">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-10 h-10" />
        </div>
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Private Event • Under Review</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            This Hackathon is Not Public Yet
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium max-w-md mx-auto">
            This event has been submitted and is currently awaiting organization review. It is not publicly discoverable or live on Hacker&apos;s Unity.
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] text-left text-xs space-y-2 max-w-md mx-auto">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
              <ShieldCheck className="w-4 h-4 text-[#0099e6]" />
              <span>Have a Private Link?</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              If you are a reviewer, mentor, or collaborator, please open this event using the <strong>Private Shareable Link</strong> provided directly by the organizer.
            </p>
          </div>
        </div>
        <div className="pt-2 flex justify-center">
          <Link
            href="/hackathons"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold transition-all shadow-md shadow-sky-500/20 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse Public Hackathons</span>
          </Link>
        </div>
      </div>
    );
  }

  const effectiveStatus = getEffectiveEventStatus(event);
  const statusInfo = getStatusBadge(effectiveStatus, event.registrationDeadline, event.endDate);
  const categoryInfo = getCategoryBadge(event.category);
  const eventTypeInfo = getEventTypeBadge(event.eventType);
  const deadlineInfo = getDaysLeft(event.registrationDeadline);

  const handleBookmarkToggle = () => {
    const userId = supabaseUser?.id || user?.id;
    toggleBookmarkEvent(event.id, userId);
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined') {
      const shareUrl = isUnpublished
        ? getEventPrivateLink(event, window.location.origin)
        : window.location.href;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview & Tracks' },
    { id: 'timeline', label: 'Stages & Timeline' },
    { id: 'submission', label: 'Submission' },
    { id: 'prizes', label: 'Prizes & Perks' },
    { id: 'rules', label: 'Rules & Criteria' },
    { id: 'sponsors', label: 'Sponsors & Judges' },
    { id: 'faqs', label: 'FAQs' },
  ];

  return (
    <div className="flex-1 pb-28 lg:pb-20">
      {/* Revoked Notice Banner */}
      {isRejected && (
        <div className="bg-rose-600 text-white px-4 py-3 text-xs font-bold flex items-center justify-between flex-wrap gap-2 border-b border-rose-700 shadow-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-white shrink-0" />
            <span>🚫 This event has been REVOKED / REJECTED by administrators and is completely hidden from the public website.</span>
          </div>
          <span className="px-3 py-1 rounded-xl bg-black/30 text-white text-[11px] font-black uppercase tracking-wider">
            REJECTED
          </span>
        </div>
      )}

      {/* Pending Approval Notice Banner */}
      {isUnpublished && !isRejected && (
        <div className="bg-amber-400 text-slate-950 px-4 py-3 text-xs font-bold flex items-center justify-between flex-wrap gap-2 border-b border-amber-500 shadow-xs">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-slate-900 shrink-0" />
            <span>This hackathon is pending admin approval and is not yet publicly visible.</span>
          </div>
          {((adminEmail && user?.email?.toLowerCase().trim() === adminEmail) ||
            user?.role === 'ADMIN' ||
            (user as any)?.role === 'SUPER_ADMIN') && (
            <button
              type="button"
              onClick={async () => {
                try {
                  await fetch('/api/events/approve', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ eventId: event.id, slug: event.slug }),
                  });
                  window.location.reload();
                } catch (e) {
                  console.error(e);
                }
              }}
              className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-extrabold hover:bg-slate-800 cursor-pointer shadow-xs transition-colors"
            >
              ✅ Approve &amp; Publish Now
            </button>
          )}
        </div>
      )}

      {/* ─── Top Banner Hero ────────────────────────────────────── */}
      <div className="relative bg-gradient-to-r from-sky-50 via-white to-orange-50/60 dark:from-[#0c1017] dark:via-[#080b11] dark:to-[#0c1017] border-b border-slate-200 dark:border-white/[0.08] pt-8 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6 font-semibold">
            <Link href="/hackathons" className="flex items-center gap-1 hover:text-[#0099e6] dark:hover:text-[#38bdf8] transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Hackathons</span>
            </Link>
            <span>/</span>
            <span className="text-slate-800 dark:text-slate-200 truncate max-w-xs">{event.title}</span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-white dark:bg-white/[0.06] text-[#0099e6] dark:text-[#38bdf8] border border-[#0099e6]/20 dark:border-sky-800/40 shadow-2xs">
              {categoryInfo.label}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-white dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.1]">
              {eventTypeInfo.icon} {eventTypeInfo.label}
            </span>
            {event.featured && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-950/40 text-[#ea580c] dark:text-orange-400 border border-orange-200 dark:border-orange-800/40 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Featured Flagship
              </span>
            )}
            {isRegistered && (
              isPendingPayment ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-800/40 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Payment Pending
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Registered
                </span>
              )
            )}
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-6 max-w-3xl">
              {/* Event / Hackathon Logo */}
              {(event.logoUrl || event.organizerLogo) ? (
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-3xl border border-slate-200/90 dark:border-white/[0.1] bg-white dark:bg-[#121824] p-2 shadow-sm shrink-0 overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={event.logoUrl || event.organizerLogo}
                    alt={event.title}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                </div>
              ) : (
                <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-3xl border border-sky-200/90 dark:border-sky-800/50 bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-950/40 dark:to-sky-900/30 shadow-sm shrink-0 flex items-center justify-center text-3xl sm:text-4xl md:text-5xl font-black text-[#0099e6] dark:text-[#38bdf8]">
                  {event.organizerAvatar || '⚡'}
                </div>
              )}

              <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
                {/* Title */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  {event.title}
                </h1>

                {/* Tagline if available */}
                {event.tagline && (
                  <p className="text-sm sm:text-base font-medium text-slate-600 dark:text-slate-400">
                    {event.tagline}
                  </p>
                )}

                {/* Organizer & Location */}
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">{event.organizerAvatar}</span>
                    <span>Organized by <strong className="text-slate-900 dark:text-white">{event.organizerName}</strong></span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-[#0099e6] dark:text-[#38bdf8]" />
                    <span>{event.location || 'Virtual / Online'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions (Bookmark, Share) */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleBookmarkToggle}
                className={`p-3 rounded-2xl border transition-all flex items-center gap-2 text-xs font-bold cursor-pointer ${
                  isBookmarked
                    ? 'bg-[#0099e6] text-white border-[#0099e6] shadow-sm'
                    : 'bg-white dark:bg-[#0c1017] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-white/[0.1] shadow-2xs hover:border-slate-300 dark:hover:border-white/[0.2]'
                }`}
              >
                <Bookmark className="w-4 h-4 fill-current" />
                <span>{isBookmarked ? 'Bookmarked' : 'Save'}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className={`p-3 rounded-2xl border transition-all flex items-center gap-2 text-xs font-bold cursor-pointer shadow-2xs ${
                  isUnpublished
                    ? 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/50 hover:border-amber-400'
                    : 'bg-white dark:bg-[#0c1017] text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-white/[0.1] hover:border-slate-300 dark:hover:border-white/[0.2]'
                }`}
                title={isUnpublished ? 'Copy Private Link (accessible before public approval)' : 'Share Event Link'}
              >
                {isUnpublished ? (
                  <Lock className="w-4 h-4 text-amber-600" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                <span>
                  {copiedLink
                    ? (isUnpublished ? 'Private Link Copied!' : 'Copied Link!')
                    : (isUnpublished ? 'Private Share' : 'Share')}
                </span>
              </button>

              {isOrganizerOrAdmin && (
                <Link
                  href={`/host?edit=${encodeURIComponent(event.slug)}`}
                  className="p-3 rounded-2xl border border-sky-200 dark:border-sky-800/60 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-[#0099e6] dark:text-[#38bdf8] transition-all flex items-center gap-2 text-xs font-bold shadow-2xs"
                  title="Edit this event in Host Studio"
                >
                  <PenTool className="w-4 h-4" />
                  <span>Edit Event</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Main Content & Sidebar Layout ──────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Column: Tabs & Content (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs Navigation */}
            <div className="bg-white dark:bg-[#0c1017] p-1.5 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-xs flex items-center gap-1 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-[#0099e6] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6 animate-in fade-in">
                {/* ─── Your Registered Squad Card (if registered in a team) ─── */}
                {userSquad && (
                  <div className="bg-gradient-to-br from-sky-50/80 via-white to-orange-50/50 dark:from-sky-950/20 dark:via-[#0c1017] dark:to-orange-950/20 p-6 rounded-3xl border-2 border-sky-200 dark:border-sky-800/40 shadow-md space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-100 dark:border-white/[0.08] pb-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0099e6] to-sky-600 flex items-center justify-center text-white text-lg font-black shadow-md shadow-sky-500/25">
                          {userSquad.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-slate-900 dark:text-white">{userSquad.name}</h3>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 text-[10px] font-extrabold uppercase">
                              Your Squad
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                            Leader: <strong className="text-slate-700 dark:text-slate-300">{userSquad.profiles?.name || 'Squad Lead'}</strong>
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/hackathons/${event.slug}/register`}
                        className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold shadow-sm shadow-sky-500/20 transition-all flex items-center gap-1.5"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Manage Squad & Invites →</span>
                      </Link>
                    </div>

                    {/* Member Avatars list */}
                    {userSquad.team_members && userSquad.team_members.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Squad Members ({userSquad.team_members.length})
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {userSquad.team_members.map((m: any) => (
                            <div
                              key={m.id || m.user_id}
                              className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#121824] border border-sky-100 dark:border-white/[0.08] shadow-2xs flex items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200"
                            >
                              <div className="w-6 h-6 rounded-lg bg-sky-100 dark:bg-sky-950 text-[#0099e6] dark:text-[#38bdf8] flex items-center justify-center font-black text-[10px] overflow-hidden shrink-0">
                                {m.profiles?.avatar_url ? (
                                  <img
                                    src={m.profiles.avatar_url}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  (m.profiles?.name || m.user_name || m.name || '?').charAt(0).toUpperCase()
                                )}
                              </div>
                              <span className="font-bold">{m.profiles?.name || m.user_name || m.name || 'Member'}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({m.role || 'Member'})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Event Photo / Poster */}
                {(event.image || event.bannerUrl) && (
                  <div className="w-full h-64 sm:h-80 rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-white/[0.08] shadow-sm relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={event.image || event.bannerUrl || ''}
                      alt={event.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Description */}
                <div className="bg-white dark:bg-[#0c1017] p-6 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">About the Hackathon</h3>
                  <RichDescription content={event.description} />
                  {filterDisplayTags(event.tags).length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {filterDisplayTags(event.tags).map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-800/40 text-xs font-mono font-semibold text-[#0099e6] dark:text-[#38bdf8]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tracks */}
                {event.tracks && event.tracks.length > 0 && (
                  <div className="bg-white dark:bg-[#0c1017] p-6 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#0099e6] dark:text-[#38bdf8]" />
                      <span>Challenge Tracks & Problem Statements</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                      {event.tracks.map((track) => (
                        <div
                          key={track.title}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{track.title}</h4>
                            {track.prize && (
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 dark:bg-orange-950/40 text-[#ea580c] dark:text-orange-400 border border-orange-200 dark:border-orange-800/40">
                                {track.prize}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{track.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Squad Callout for Team Events */}
                {event.isTeamEvent && (
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-sky-50 via-white to-orange-50 dark:from-sky-950/20 dark:via-[#0c1017] dark:to-orange-950/20 border border-sky-200 dark:border-sky-800/40 flex items-center justify-between gap-4 shadow-sm">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Form or Join a Squad</h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        This event allows squads of {event.minTeamSize}-{event.maxTeamSize} builders.
                      </p>
                    </div>
                    {effectiveStatus !== EventStatus.COMPLETED ? (
                      <a
                        href={externalRedirectUrl || `/hackathons/${event.slug}/register`}
                        target={externalRedirectUrl ? '_blank' : undefined}
                        rel={externalRedirectUrl ? 'noopener noreferrer' : undefined}
                        className="px-4 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold transition-all shadow-xs whitespace-nowrap"
                      >
                        {externalRedirectUrl ? 'External Registration Portal ↗' : 'Squad Registration Portal'}
                      </a>
                    ) : (
                      <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 text-xs font-bold">
                        Registration Closed
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: Timeline */}
            {activeTab === 'timeline' && (
              <div className="bg-white dark:bg-[#0c1017] p-6 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-6 animate-in fade-in">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#0099e6] dark:text-[#38bdf8]" />
                  <span>Stages & Timeline</span>
                </h3>
                <div className="relative pl-6 space-y-8 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-sky-200 dark:before:bg-sky-800/40">
                  {event.stages && event.stages.length > 0 ? (
                    event.stages.map((stage) => (
                      <div key={stage.id} className="relative space-y-1">
                        <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#0099e6] border-4 border-white dark:border-[#0c1017] flex items-center justify-center text-[10px] font-bold text-white shadow-xs" />
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            Stage {stage.stageOrder}: {stage.stageName}
                          </h4>
                          <span className="text-xs text-[#0099e6] dark:text-[#38bdf8] font-mono font-bold">
                            {formatDate(stage.startDate || event.startDate, event.timezone)} - {formatDate(stage.endDate || event.endDate, event.timezone)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">{stage.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-4">
                      <div className="relative space-y-1">
                        <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#0099e6] border-4 border-white dark:border-[#0c1017] shadow-xs" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Registration Phase</h4>
                        <span className="text-xs text-[#0099e6] dark:text-[#38bdf8] font-mono font-bold">
                          Deadline: {formatDate(event.registrationDeadline, event.timezone)}
                        </span>
                      </div>
                      <div className="relative space-y-1">
                        <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-[#ea580c] border-4 border-white dark:border-[#0c1017] shadow-xs" />
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">Hacking Sprint</h4>
                        <span className="text-xs text-[#ea580c] dark:text-orange-400 font-mono font-bold">
                          {formatDate(event.startDate, event.timezone)} - {formatDate(event.endDate, event.timezone)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Project Submission */}
            {activeTab === 'submission' && (
              <div className="bg-white dark:bg-[#0c1017] p-6 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-6 animate-in fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-white/[0.08] pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Rocket className="w-5 h-5 text-[#0099e6] dark:text-[#38bdf8]" />
                      <span>Submission Portal</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Submit your completed build, source code, and demo video for judge evaluation.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (isManipalEvent) {
                        window.open(MANIPAL_REDIRECT_URL, '_blank', 'noopener,noreferrer');
                      } else {
                        setShowSubmissionModal(true);
                      }
                    }}
                    disabled={!submissionStatus.isOpen && !userSubmission}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all self-start sm:self-auto ${
                      userSubmission
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 cursor-pointer'
                        : submissionStatus.isOpen
                        ? 'bg-[#0099e6] hover:bg-[#0284c7] text-white shadow-sky-500/20 cursor-pointer'
                        : 'bg-slate-100 dark:bg-white/[0.06] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/[0.08] cursor-not-allowed'
                    }`}
                  >
                    {userSubmission ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-white" />
                        <span>{submissionStatus.isOpen ? 'Update Your Submission' : 'View Submission Details'}</span>
                      </>
                    ) : submissionStatus.isOpen ? (
                      <>
                        <Rocket className="w-4 h-4" />
                        <span>Submit Project Now</span>
                      </>
                    ) : submissionStatus.isUpcoming ? (
                      <>
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span>Submissions Open Soon</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-slate-400" />
                        <span>Submissions Closed</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Submission Schedule Banner */}
                <div className={`p-4 rounded-xl border flex items-center justify-between flex-wrap gap-2 text-xs font-semibold ${
                  submissionStatus.isOpen
                    ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
                    : submissionStatus.isUpcoming
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300'
                    : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-300'
                }`}>
                  <div className="flex items-center gap-2">
                    {submissionStatus.isOpen ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : submissionStatus.isUpcoming ? (
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    ) : (
                      <Lock className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                    )}
                    <span>{submissionStatus.subtext}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    submissionStatus.isOpen
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                      : submissionStatus.isUpcoming
                      ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300'
                      : 'bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-300'
                  }`}>
                    {submissionStatus.statusLabel}
                  </span>
                </div>

                {/* Submission Status Alert */}
                {userSubmission ? (
                  <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-slate-800 dark:text-slate-200 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2 font-bold text-sm text-emerald-800 dark:text-emerald-400">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>Project Successfully Submitted!</span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-700/50 text-emerald-800 dark:text-emerald-300 text-xs font-black uppercase">
                        Status: {userSubmission.status || 'Under Review'}
                      </span>
                    </div>

                    <div className="bg-white dark:bg-[#121824] p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-800/30 space-y-2.5">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Project Title</div>
                        <div className="text-base font-black text-slate-900 dark:text-white">{userSubmission.projectTitle}</div>
                        {userSubmission.tagline && (
                          <div className="text-xs text-[#0099e6] dark:text-[#38bdf8] font-semibold">{userSubmission.tagline}</div>
                        )}
                      </div>

                      {userSubmission.track && (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] dark:text-[#38bdf8] text-xs font-bold">
                          <Layers className="w-3.5 h-3.5" />
                          <span>Track: {userSubmission.track}</span>
                        </div>
                      )}

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                        {userSubmission.projectDescription}
                      </p>

                      <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-slate-100 dark:border-white/[0.08] text-xs">
                        <a
                          href={userSubmission.projectLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-[#0099e6] dark:text-[#38bdf8] hover:underline flex items-center gap-1"
                        >
                          <Github className="w-3.5 h-3.5" />
                          <span>Repository Link ↗</span>
                        </a>
                        {userSubmission.demoVideoUrl && (
                          <a
                            href={userSubmission.demoVideoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-[#ea580c] dark:text-orange-400 hover:underline flex items-center gap-1"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Demo Video ↗</span>
                          </a>
                        )}
                        {userSubmission.presentationUrl && (
                          <a
                            href={userSubmission.presentationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <Presentation className="w-3.5 h-3.5" />
                            <span>Slide Deck ↗</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-400 font-medium">
                      <span>
                        Last updated on {new Date(userSubmission.updatedAt || userSubmission.submittedAt).toLocaleDateString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowSubmissionModal(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#121824] border border-emerald-300 dark:border-emerald-700/50 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 font-bold text-xs text-emerald-800 dark:text-emerald-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <Rocket className="w-3.5 h-3.5 text-[#0099e6] dark:text-[#38bdf8]" />
                        <span>Edit / Manage Deliverables</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/40 text-sky-800 dark:text-sky-300 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 font-medium">
                      <Sparkles className="w-4 h-4 text-[#0099e6] dark:text-[#38bdf8] shrink-0" />
                      <span>Submissions are currently open for all registered participants.</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-900/50 text-[#0099e6] dark:text-[#38bdf8] font-bold text-[10px] uppercase">
                      Open
                    </span>
                  </div>
                )}

                {/* Breakdown of Submission Fields */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Submission Requirements Breakdown
                  </h4>

                  {/* Required Fields Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-rose-500" />
                        <span>Mandatory Fields (Must be provided to qualify)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 text-[10px] font-black uppercase">
                        Required *
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="p-3 bg-white dark:bg-[#121824] rounded-xl border border-slate-200 dark:border-white/[0.08]">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Project Title *</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Name of prototype / solution</div>
                      </div>
                      <div className="p-3 bg-white dark:bg-[#121824] rounded-xl border border-slate-200 dark:border-white/[0.08]">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Project Description *</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Problem statement, tech stack & features (min 20 chars)</div>
                      </div>
                      <div className="p-3 bg-white dark:bg-[#121824] rounded-xl border border-slate-200 dark:border-white/[0.08]">
                        <div className="text-xs font-bold text-slate-900 dark:text-white">Repository / Live Link *</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Public GitHub / GitLab repo or deployed application</div>
                      </div>
                    </div>
                  </div>

                  {/* Optional Fields Card */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Optional Fields (Enhance evaluation & score)</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase">
                        Optional
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="p-3 bg-white dark:bg-[#121824] rounded-xl border border-slate-200 dark:border-white/[0.08]">
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5 text-[#ea580c]" />
                          <span>Project Demo Video</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Loom, YouTube, or Google Drive walkthrough link</div>
                      </div>

                      <div className="p-3 bg-white dark:bg-[#121824] rounded-xl border border-slate-200 dark:border-white/[0.08]">
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Archive className="w-3.5 h-3.5 text-indigo-500" />
                          <span>ZIP File Upload</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Direct source code or offline build archive (up to 50MB)</div>
                      </div>

                      <div className="p-3 bg-white dark:bg-[#121824] rounded-xl border border-slate-200 dark:border-white/[0.08]">
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Presentation className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Presentation / PPT</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Google Slides, Pitch deck, Canva or PDF link</div>
                      </div>

                      <div className="p-3 bg-white dark:bg-[#121824] rounded-xl border border-slate-200 dark:border-white/[0.08]">
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Link2 className="w-3.5 h-3.5 text-purple-600" />
                          <span>Additional Resources or Links</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Figma designs, smart contracts, API docs, or research</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Big Action CTA Banner */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-bold">
                      {userSubmission ? 'Review or edit your submitted project' : 'Ready to submit your hackathon prototype?'}
                    </div>
                    <p className="text-xs text-slate-300">
                      Submissions undergo automated link verification and peer evaluation by hackathon judges.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (isManipalEvent) {
                        window.open(MANIPAL_REDIRECT_URL, '_blank', 'noopener,noreferrer');
                      } else {
                        setShowSubmissionModal(true);
                      }
                    }}
                    disabled={!submissionStatus.isOpen && !userSubmission}
                    className={`px-6 py-3 rounded-xl font-extrabold text-xs shadow-md transition-all shrink-0 text-center ${
                      userSubmission
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/30 cursor-pointer'
                        : submissionStatus.isOpen
                        ? 'bg-[#0099e6] hover:bg-[#0284c7] text-white shadow-sky-500/30 cursor-pointer'
                        : 'bg-slate-200 dark:bg-white/[0.08] text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-white/10'
                    }`}
                  >
                    {userSubmission
                      ? 'Open Submission Details'
                      : submissionStatus.isOpen
                      ? 'Launch Submission Portal →'
                      : submissionStatus.isUpcoming
                      ? 'Submissions Open Soon'
                      : 'Submissions Closed'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT: Prizes */}
            {activeTab === 'prizes' && (
              <div className="bg-white dark:bg-[#0c1017] p-6 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-6 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#ea580c]" />
                    <span>Prizes & Perks Breakdown</span>
                  </h3>
                  <div className="text-sm font-black text-[#ea580c] font-mono">
                    Total Pool: {isManipalEvent ? '₹1,00,000' : formatCurrency(event.totalPrizeValue, (event.currency as 'USD' | 'INR') || 'USD')}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.prizes && event.prizes.length > 0 ? (
                    event.prizes.map((prize) => (
                      <div
                        key={prize.position}
                        className="p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 space-y-2 relative overflow-hidden"
                      >
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          {prize.position}
                        </div>
                        <div className="text-2xl font-black text-[#ea580c] font-mono">
                          {isManipalEvent ? `₹${Number(prize.amount).toLocaleString('en-IN')}` : formatCurrency(prize.amount, (event.currency as 'USD' | 'INR') || 'USD')}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{prize.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
                      <div className="text-2xl font-black text-[#ea580c] font-mono">
                        {isManipalEvent ? '₹1,00,000' : formatCurrency(event.totalPrizeValue, (event.currency as 'USD' | 'INR') || 'USD')}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">Cash prizes, grants, and exclusive swags.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Rules */}
            {activeTab === 'rules' && (
              <div className="bg-white dark:bg-[#0c1017] p-6 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-4 animate-in fade-in">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Rules & Guidelines</h3>
                {event.rulesText ? (
                  <RichDescription content={event.rulesText} />
                ) : (
                  <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#0099e6] shrink-0 mt-0.5" />
                      <span>All code must be newly written during the official hackathon sprint duration.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#0099e6] shrink-0 mt-0.5" />
                      <span>Teams can consist of <strong>{event.minTeamSize || 1}</strong> to <strong>{event.maxTeamSize || 4}</strong> hackers.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#0099e6] shrink-0 mt-0.5" />
                      <span>A public repository and working demo video must be submitted before deadline.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#0099e6] shrink-0 mt-0.5" />
                      <span>100% intellectual property (IP) is retained by the builders.</span>
                    </li>
                  </ul>
                )}
              </div>
            )}

            {/* TAB CONTENT: Sponsors */}
            {activeTab === 'sponsors' && (
              <div className="bg-white dark:bg-[#0c1017] p-6 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-6 animate-in fade-in">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#f97316]" />
                  <span>Sponsors & Partners</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {event.sponsors && event.sponsors.length > 0 ? (
                    event.sponsors.map((sponsor) => (
                      <div
                        key={sponsor.name}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] text-center flex flex-col items-center justify-center space-y-2"
                      >
                        <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800/40 flex items-center justify-center font-mono font-bold text-xs text-[#0099e6] dark:text-[#38bdf8]">
                          {sponsor.logoText || 'PARTNER'}
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">{sponsor.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">{sponsor.tier}</div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-center col-span-2">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{event.organizerName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase">Lead Organizer</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: FAQs */}
            {activeTab === 'faqs' && (
              <div className="bg-white dark:bg-[#0c1017] p-6 rounded-2xl border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-4 animate-in fade-in">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#0099e6] dark:text-[#38bdf8]" />
                  <span>Frequently Asked Questions</span>
                </h3>
                <div className="space-y-3">
                  {event.faqs && event.faqs.length > 0 ? (
                    event.faqs.map((faq) => {
                      const isOpen = expandedFaq === faq.id;
                      return (
                        <div
                          key={faq.id}
                          className="rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] overflow-hidden"
                        >
                          <button
                            onClick={() => setExpandedFaq(isOpen ? null : faq.id)}
                            className="w-full p-4 flex items-center justify-between text-left text-xs font-bold text-slate-900 dark:text-slate-200 hover:text-[#0099e6] dark:hover:text-[#38bdf8] transition-colors cursor-pointer"
                          >
                            <span>{faq.question}</span>
                            <ChevronDown className={`w-4 h-4 text-slate-500 dark:text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-200/60 dark:border-white/[0.08] pt-3 font-medium">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">No FAQs available for this event yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Action Box (1 col) */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-xl space-y-5">
              {/* Prize Pool Highlight */}
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Prize Pool</div>
                <div className="text-3xl font-black text-[#ea580c] font-mono mt-0.5">
                  {isManipalEvent ? '₹1,00,000' : (event.prize || formatCurrency(event.totalPrizeValue, (event.currency as 'USD' | 'INR') || 'USD'))}
                </div>
              </div>

              {/* Deadline & Countdown */}
              <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800/40 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Registration Closes:</span>
                  <span className="text-[#ea580c] font-black">{deadlineInfo.text}</span>
                </div>
                <div className="text-xs font-mono text-[#0099e6] dark:text-[#38bdf8] font-bold">
                  {formatDateTime(event.registrationDeadline, event.timezone)}
                </div>
              </div>

              {/* Entry Fee Box */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08]">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#0099e6] dark:text-[#38bdf8]" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Registration Fee</span>
                </div>
                <div className="text-right">
                  {isPaidEvent ? (
                    <div>
                      <span className="text-sm font-black text-[#ea580c] dark:text-[#f97316] font-mono">
                        ₹{Number(feeAmount).toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">per squad</span>
                    </div>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-black">
                      Free Entry
                    </span>
                  )}
                </div>
              </div>

              {/* Primary Register / Submit CTA */}
              {isManipalEvent ? (
                <div className="space-y-2.5">
                  <a
                    href={MANIPAL_REDIRECT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-sm shadow-md shadow-sky-500/20 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Rocket className="w-4 h-4" />
                    <span>Register for Hackathon</span>
                  </a>
                  <a
                    href={MANIPAL_REDIRECT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300 font-bold text-xs text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Rocket className="w-3.5 h-3.5 text-[#0099e6] dark:text-[#38bdf8]" />
                    <span>Submission Portal</span>
                  </a>
                </div>
              ) : isRegistered ? (
                <div className="space-y-2.5">
                  {isPendingPayment ? (
                    <Link
                      href={`/hackathons/${event.slug}/register`}
                      className="w-full py-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 border border-amber-300 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 font-extrabold text-xs text-center flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Payment Pending • Complete Entry Fee (₹{feeAmount}) →</span>
                    </Link>
                  ) : (
                    <Link
                      href={`/hackathons/${event.slug}/register`}
                      className="w-full py-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs text-center flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>You Are Registered • View Squad →</span>
                    </Link>
                  )}

                  {!isPendingPayment && (
                    <button
                      type="button"
                      onClick={() => setShowSubmissionModal(true)}
                      disabled={!submissionStatus.isOpen && !userSubmission}
                      className={`w-full py-3 rounded-2xl font-extrabold text-xs text-center flex items-center justify-center gap-2 transition-all shadow-md ${
                        userSubmission
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20 cursor-pointer'
                          : submissionStatus.isOpen
                          ? 'bg-[#0099e6] hover:bg-[#0284c7] text-white shadow-sky-500/20 cursor-pointer'
                          : 'bg-slate-100 dark:bg-white/[0.06] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/[0.08] cursor-not-allowed'
                      }`}
                    >
                      {userSubmission ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{submissionStatus.isOpen ? '✓ View / Edit Submission' : '✓ View Submission (Locked)'}</span>
                        </>
                      ) : submissionStatus.isOpen ? (
                        <>
                          <Rocket className="w-4 h-4" />
                          <span>Submit Project 🚀</span>
                        </>
                      ) : submissionStatus.isUpcoming ? (
                        <>
                          <Clock className="w-4 h-4 text-amber-500" />
                          <span>Submissions Open Soon</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4 text-slate-400" />
                          <span>Submissions Closed</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : isRejected ? (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-center space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    <span>🚫 Event Revoked</span>
                  </div>
                  <p className="text-xs text-rose-600/80 dark:text-rose-400/80 font-medium">
                    This event has been revoked by administrators and registrations are disabled.
                  </p>
                </div>
              ) : effectiveStatus === EventStatus.COMPLETED ? (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-center space-y-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                    <span>Hackathon Completed</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Registrations for this hackathon have closed. Explore the event timeline, tracks, and details above.
                  </p>
                </div>
              ) : externalRedirectUrl ? (
                <div className="space-y-2.5">
                  <a
                    href={externalRedirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-sm shadow-md shadow-sky-500/20 transition-all text-center block"
                  >
                    Register on External Portal ↗
                  </a>
                  {userSubmission ? (
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/40 text-left space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Project Submitted</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase">
                          {userSubmission.status || 'Submitted'}
                        </span>
                      </div>
                      <div className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                        {userSubmission.projectTitle}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSubmissionModal(true)}
                        className="w-full py-1.5 rounded-xl bg-white dark:bg-[#121824] border border-emerald-300 dark:border-emerald-700/50 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Rocket className="w-3 h-3 text-[#0099e6] dark:text-[#38bdf8]" />
                        <span>Manage Submission</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (submissionStatus.isOpen) {
                          setShowSubmissionModal(true);
                        }
                      }}
                      disabled={!submissionStatus.isOpen}
                      className={`w-full py-2.5 rounded-xl border text-center flex items-center justify-center gap-1.5 transition-all font-bold text-xs ${
                        submissionStatus.isOpen
                          ? 'border-slate-200 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300 cursor-pointer'
                          : 'border-slate-200/60 dark:border-white/[0.06] bg-slate-100/60 dark:bg-white/[0.02] text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {submissionStatus.isOpen ? (
                        <>
                          <Rocket className="w-3.5 h-3.5 text-[#0099e6] dark:text-[#38bdf8]" />
                          <span>Submission Portal</span>
                        </>
                      ) : submissionStatus.isUpcoming ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Submissions Open Soon</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Submissions Closed</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <Link
                    href={`/hackathons/${event.slug}/register`}
                    className="w-full py-3.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-sm shadow-md shadow-sky-500/20 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Rocket className="w-4 h-4" />
                    <span>
                      {isPaidEvent
                        ? `Register • ₹${Number(feeAmount).toLocaleString('en-IN')} / Team`
                        : 'Register for Hackathon'}
                    </span>
                  </Link>
                  {userSubmission ? (
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/90 dark:border-emerald-800/40 text-left space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Project Submitted</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase">
                          {userSubmission.status || 'Submitted'}
                        </span>
                      </div>
                      <div className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                        {userSubmission.projectTitle}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSubmissionModal(true)}
                        className="w-full py-1.5 rounded-xl bg-white dark:bg-[#121824] border border-emerald-300 dark:border-emerald-700/50 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Rocket className="w-3 h-3 text-[#0099e6] dark:text-[#38bdf8]" />
                        <span>Manage Submission</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (submissionStatus.isOpen) {
                          setShowSubmissionModal(true);
                        }
                      }}
                      disabled={!submissionStatus.isOpen}
                      className={`w-full py-2.5 rounded-xl border text-center flex items-center justify-center gap-1.5 transition-all font-bold text-xs ${
                        submissionStatus.isOpen
                          ? 'border-slate-200 dark:border-white/[0.1] hover:bg-slate-50 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-300 cursor-pointer'
                          : 'border-slate-200/60 dark:border-white/[0.06] bg-slate-100/60 dark:bg-white/[0.02] text-slate-400 dark:text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {submissionStatus.isOpen ? (
                        <>
                          <Rocket className="w-3.5 h-3.5 text-[#0099e6] dark:text-[#38bdf8]" />
                          <span>Submission Portal</span>
                        </>
                      ) : submissionStatus.isUpcoming ? (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Submissions Open Soon</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span>Submissions Closed</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Quick Info Grid */}
              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-white/[0.08] text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Team Size</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {event.minTeamSize === event.maxTeamSize
                      ? `${event.minTeamSize} Members`
                      : `${event.minTeamSize} - ${event.maxTeamSize} Members`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Starts</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatEventDateTime(event.startDate, event.timezone)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="font-medium">Ends</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatEventDateTime(event.endDate, event.timezone)}</span>
                </div>
                {calculateEventDuration(event.startDate, event.endDate) && (
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#0099e6]" />
                      <span>Duration</span>
                    </span>
                    <span className="font-bold text-[#0099e6] dark:text-[#38bdf8]">
                      {calculateEventDuration(event.startDate, event.endDate)}
                    </span>
                  </div>
                )}
                {/* Submissions Schedule / Status */}
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="font-medium flex items-center gap-1">
                    <Rocket className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Submissions</span>
                  </span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                      submissionStatus.isOpen
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : submissionStatus.isUpcoming
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-slate-200/50 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {submissionStatus.isOpen
                      ? 'Open Now'
                      : submissionStatus.isUpcoming
                      ? 'Opens Soon'
                      : 'Closed'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium">Live Participants</span>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  </div>
                  <span className="font-bold text-[#0099e6] dark:text-[#38bdf8] font-mono">
                    {formatBuildersCount(liveParticipantCount)}
                  </span>
                </div>
              </div>

              {/* Verified Badge */}
              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.08] flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Realtime Event Arena</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile Sticky Bottom Action Bar (Phone View Only) ──────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0c1017]/95 backdrop-blur-md border-t border-slate-200 dark:border-white/[0.08] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_25px_rgba(0,0,0,0.4)] px-4 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          {/* Left Action Buttons: Bookmark & Share */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleBookmarkToggle}
              className={`p-2.5 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                isBookmarked
                  ? 'bg-[#0099e6] text-white border-[#0099e6] shadow-2xs'
                  : 'bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.1] hover:bg-slate-100 dark:hover:bg-white/[0.08]'
              }`}
              aria-label={isBookmarked ? 'Bookmarked' : 'Save Event'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-white/[0.04] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all flex items-center justify-center cursor-pointer"
              aria-label="Share Event"
              title="Share"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Right Section: Price / Fee and Main CTA */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* Price / Fee Status */}
            <div className="text-right leading-tight shrink-0">
              {effectiveStatus === EventStatus.COMPLETED ? (
                <div>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Registration</span>
                  <span className="text-[11px] text-slate-400 block font-semibold">Closed</span>
                </div>
              ) : isRegistered ? (
                <div>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Registered</span>
                  </span>
                  {isPendingPayment && (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block mt-0.5">
                      Fee Due
                    </span>
                  )}
                </div>
              ) : isPaidEvent ? (
                <div>
                  <div className="text-base sm:text-lg font-black text-[#ea580c] dark:text-[#f97316] font-mono leading-none">
                    ₹{Number(feeAmount).toLocaleString('en-IN')}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                    per squad
                  </span>
                </div>
              ) : (
                <div>
                  <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-none">
                    Free
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                    Entry
                  </span>
                </div>
              )}
            </div>

            {/* Primary CTA Button */}
            {isManipalEvent ? (
              <a
                href={MANIPAL_REDIRECT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 sm:px-6 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-sky-500/25 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Register</span>
              </a>
            ) : isRegistered ? (
              isPendingPayment ? (
                <Link
                  href={`/hackathons/${event.slug}/register`}
                  className="px-4 sm:px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md shadow-amber-500/25 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pay Fee (₹{feeAmount})</span>
                </Link>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Link
                    href={`/hackathons/${event.slug}/register`}
                    className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/25 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Squad</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      if (userSubmission || submissionStatus.isOpen) {
                        setShowSubmissionModal(true);
                      }
                    }}
                    disabled={!userSubmission && !submissionStatus.isOpen}
                    className={`p-2.5 rounded-xl border transition-colors ${
                      userSubmission || submissionStatus.isOpen
                        ? 'border-sky-200 dark:border-sky-800/60 bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] dark:text-[#38bdf8] hover:bg-sky-100 dark:hover:bg-sky-900/40 cursor-pointer'
                        : 'border-slate-200 dark:border-white/[0.08] bg-slate-100/50 dark:bg-white/[0.02] text-slate-400 cursor-not-allowed opacity-60'
                    }`}
                    title={
                      userSubmission
                        ? 'Manage Submission'
                        : submissionStatus.isOpen
                        ? 'Submit Project'
                        : 'Submissions Closed'
                    }
                  >
                    {userSubmission || submissionStatus.isOpen ? (
                      <Rocket className="w-4 h-4" />
                    ) : (
                      <Lock className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )
            ) : isRejected ? (
              <span className="px-4 py-2.5 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs cursor-not-allowed shrink-0 border border-rose-200 dark:border-rose-900/50">
                Revoked
              </span>
            ) : effectiveStatus === EventStatus.COMPLETED ? (
              <span className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-400 dark:text-slate-500 font-bold text-xs cursor-not-allowed shrink-0">
                Closed
              </span>
            ) : externalRedirectUrl ? (
              <a
                href={externalRedirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 sm:px-7 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-sky-500/25 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Register ↗</span>
              </a>
            ) : (
              <Link
                href={`/hackathons/${event.slug}/register`}
                className="px-6 sm:px-8 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm shadow-md shadow-sky-500/25 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <span>Register</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      <RegistrationModal
        event={event}
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
        onSuccess={() => {
          setShowRegModal(false);
          setLiveParticipantCount((prev) => prev + 1);
          refresh();
        }}
      />

      <TeamRegistrationModal
        event={event}
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        onSuccess={() => {
          setShowTeamModal(false);
          setLiveParticipantCount((prev) => prev + 1);
          refresh();
        }}
      />

      <ProjectSubmissionModal
        isOpen={showSubmissionModal}
        onClose={() => setShowSubmissionModal(false)}
        eventId={event.id}
        eventName={event.title}
        tracks={event.tracks?.map((t: any) => t.title || t.name || t) || []}
        submissionFields={event.submissionFields}
        submissionGuidelines={event.submissionGuidelines}
        submissionsEnabled={event.submissionsEnabled}
        submissionStartDate={event.submissionStartDate}
        submissionDeadline={event.submissionDeadline}
        timezone={event.timezone}
        tags={event.tags}
        onSuccess={() => {
          const userId = supabaseUser?.id || user?.id;
          setUserSubmission(getProjectSubmission(event.id, userId));
          refresh();
        }}
        onDelete={() => {
          setUserSubmission(null);
          refresh();
        }}
      />
    </div>
  );
}
