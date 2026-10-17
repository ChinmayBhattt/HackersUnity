'use client';

import React, { useState, useEffect, use, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Link2,
  Users,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  TrendingUp,
  MousePointerClick,
  CheckCircle2,
  Calendar,
  Trophy,
  Building2,
  ExternalLink,
  Loader2,
  ShieldCheck,
  Share2,
  Send,
  MessageCircle,
  AlertCircle,
  User,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useEvent } from '@/lib/hooks/use-events';
import { AuthModal } from '@/components/auth-modal';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PromoterPageProps {
  params: Promise<{ slug: string }>;
}

export default function PromoterOnboardingPage({ params }: PromoterPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { user, supabaseUser, loading: authLoading } = useAuth();
  const { event, loading: eventLoading } = useEvent(slug);

  const [customSlug, setCustomSlug] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeUtmLink, setActiveUtmLink] = useState<any | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const currentUserId = supabaseUser?.id || user?.id;

  // Base origin
  const baseUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/hackathons/${slug}/`;
    }
    return `https://hackersunity.com/hackathons/${slug}/`;
  }, [slug]);

  // Clean custom slug
  const cleanSlug = useMemo(() => {
    return customSlug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-');
  }, [customSlug]);

  // Set default slug once user loads
  useEffect(() => {
    if (user && !customSlug) {
      const defaultName = (
        user.username ||
        user.name?.split(' ')[0] ||
        user.email?.split('@')[0] ||
        'promoter'
      )
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-');
      setCustomSlug(defaultName);
    }
  }, [user, customSlug]);

  // Check if current user already has an active UTM link for this event
  useEffect(() => {
    if (!event?.id || !currentUserId) {
      setCheckingExisting(false);
      return;
    }

    const currentEventId = event.id;

    async function checkExistingLink() {
      setCheckingExisting(true);
      try {
        const res = await fetch(`/api/utm?eventId=${encodeURIComponent(currentEventId)}`);
        if (res.ok) {
          const data = await res.json();
          const existing = (data.links || []).find(
            (l: any) => l.userId === currentUserId || l.user_id === currentUserId
          );
          if (existing) {
            setActiveUtmLink(existing);
          }
        }
      } catch (e) {
        console.warn('Failed to check existing UTM link:', e);
      } finally {
        setCheckingExisting(false);
      }
    }

    checkExistingLink();
  }, [event?.id, currentUserId]);

  // Handle Accept & Generate Link
  const handleAccept = async () => {
    if (!user || !currentUserId) {
      setShowAuthModal(true);
      return;
    }

    if (!event) {
      setErrorMsg('Event details not found. Please refresh and try again.');
      return;
    }

    if (!cleanSlug) {
      setErrorMsg('Please provide a valid custom name/slug.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/utm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          eventSlug: event.slug || slug,
          code: cleanSlug,
          customName: user.name || cleanSlug,
          userId: currentUserId,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        // If code already taken, give friendly message
        if (res.status === 409) {
          setErrorMsg(
            `The slug "${cleanSlug}" is already in use for this event. Try "${cleanSlug}-1" or customize another name below.`
          );
        } else {
          setErrorMsg(data.error || 'Failed to generate referral link.');
        }
        return;
      }

      setActiveUtmLink(data.link || { code: cleanSlug, clicksCount: 0, confirmedRegistrationsCount: 0 });

      // Auto copy
      try {
        await navigator.clipboard.writeText(`${baseUrl}${cleanSlug}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch {}
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fullLinkUrl = activeUtmLink ? `${baseUrl}${activeUtmLink.code}` : `${baseUrl}${cleanSlug || 'your-name'}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullLinkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {}
  };

  const shareText = `Hey! Check out ${event?.title || 'this awesome hackathon'} on Hacker's Unity. Register using my official link here: ${fullLinkUrl}`;

  if (eventLoading || authLoading || checkingExisting) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 bg-slate-50/50 dark:bg-[#070b12]">
        <Loader2 className="w-8 h-8 text-[#0099e6] animate-spin mb-3" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
          Loading referral onboarding portal...
        </p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">Event Not Found</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          This hackathon does not exist or may have been removed.
        </p>
        <Link
          href="/hackathons"
          className="px-4 py-2 rounded-xl bg-[#0099e6] text-white text-xs font-bold"
        >
          Explore All Hackathons
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] py-10 px-4 sm:px-6 bg-gradient-to-b from-sky-500/5 via-transparent to-transparent flex flex-col items-center justify-center">
      <div className="w-full max-w-xl">
        {/* Back Link */}
        <div className="mb-4 flex items-center justify-between">
          <Link
            href={`/hackathons/${slug}`}
            className="text-xs font-bold text-slate-500 hover:text-[#0099e6] flex items-center gap-1.5 transition"
          >
            <span>← Back to Event Page</span>
          </Link>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#0099e6]/10 text-[#0099e6] border border-[#0099e6]/20">
            Ambassador &amp; Referral Partner
          </span>
        </div>

        {/* Event Snapshot Card */}
        <div className="bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xl overflow-hidden mb-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-blue-500/10 border border-sky-500/20 flex items-center justify-center text-[#0099e6] shrink-0 font-black text-lg">
              {event.title?.[0]?.toUpperCase() || 'H'}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">
                {event.category || 'HACKATHON'}
              </span>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate mt-1">
                {event.title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Organized by {event.organizerName || (event as any).organizer_name || "Hacker's Unity"}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-white/[0.06] text-xs">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-[#0099e6] shrink-0" />
              <span className="truncate">{event.startDate ? formatDate(event.startDate) : 'Upcoming'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 justify-end">
              <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="font-bold truncate">
                {event.totalPrizeValue ? formatCurrency(event.totalPrizeValue) : 'Prize Pool'}
              </span>
            </div>
          </div>
        </div>

        {/* ─── CASE A: Active Link Already Exists (Celebration & Share Card) ─── */}
        {activeUtmLink ? (
          <div className="bg-white dark:bg-[#0c1017] border border-emerald-500/30 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    You Are an Official Promoter!
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Active Partner
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Share your link with students &amp; friends. All registrations are tracked to your profile!
                </p>
              </div>
            </div>

            {/* Custom Link Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/90 dark:border-white/[0.08] space-y-2">
              <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Your Exclusive Referral Link
              </label>
              <div className="flex items-center justify-between gap-2 bg-white dark:bg-white/[0.06] p-2.5 rounded-xl border border-sky-500/30">
                <span className="text-xs font-mono font-bold text-[#0099e6] dark:text-[#38bdf8] truncate select-all">
                  {fullLinkUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    copied
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[#0099e6] hover:bg-[#0284c7] text-white shadow-xs'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Real-time Performance Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-center">
                <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                  Total Clicks
                </span>
                <span className="text-xl font-black text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                  <MousePointerClick className="w-4 h-4" />
                  {activeUtmLink.clicksCount || activeUtmLink.clicks_count || 0}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-center">
                <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  Confirmed Regs
                </span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                  {activeUtmLink.confirmedRegistrationsCount || activeUtmLink.confirmed_registrations_count || 0}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/20 text-center col-span-2 sm:col-span-1">
                <span className="block text-[10px] font-bold text-[#0099e6] dark:text-[#38bdf8] uppercase">
                  Conv. Rate
                </span>
                <span className="text-xl font-black text-[#0099e6] dark:text-[#38bdf8] mt-0.5 block">
                  {Number(activeUtmLink.clicksCount || activeUtmLink.clicks_count || 0) > 0
                    ? (
                        (Number(activeUtmLink.confirmedRegistrationsCount || activeUtmLink.confirmed_registrations_count || 0) /
                          Number(activeUtmLink.clicksCount || activeUtmLink.clicks_count || 0)) *
                        100
                      ).toFixed(1)
                    : '0.0'}
                  %
                </span>
              </div>
            </div>

            {/* Quick Share Buttons */}
            <div className="space-y-2 pt-2">
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Quick Share With Your Community:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(fullLinkUrl)}&text=${encodeURIComponent(
                    `Join ${event.title} on Hacker's Unity!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Telegram</span>
                </a>

                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs col-span-2 sm:col-span-1"
                >
                  <span>Share on X</span>
                </a>
              </div>
            </div>
          </div>
        ) : (
          /* ─── CASE B: Not Yet Accepted (Invitation Acceptance Card) ──── */
          <div className="bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#0099e6]/10 text-[#0099e6] flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  Join as Referral Partner
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Get your own custom tracking link and earn recognition for bringing registrations!
                </p>
              </div>
            </div>

            {/* Profile Check */}
            {user ? (
              <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center relative">
                    {user.avatarUrl && (user.avatarUrl.startsWith('http') || user.avatarUrl.startsWith('data:')) ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-black text-sky-600 dark:text-sky-400">
                        {user.avatarUrl || (user.name || user.email || 'U')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-[#0099e6] dark:text-[#38bdf8] border border-sky-500/20 shrink-0">
                  Logged In
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Sign In Required
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Please log in to your platform account so registrations can be attributed to you.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold transition shrink-0 cursor-pointer shadow-xs"
                >
                  Log In / Sign Up
                </button>
              </div>
            )}

            {/* Link Customizer */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Your Custom Link Slug
              </label>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-white/[0.08] flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 select-all shrink-0">
                  .../{slug}/
                </span>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  placeholder="e.g. your-name"
                  className="flex-1 bg-white dark:bg-white/[0.06] border border-sky-500/30 focus:border-[#0099e6] rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-[#0099e6] dark:text-[#38bdf8] placeholder-slate-400 focus:outline-hidden transition"
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500">
                Full URL: <code className="font-mono text-slate-700 dark:text-slate-300">{fullLinkUrl}</code>
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Accept CTA Button */}
            <button
              type="button"
              onClick={handleAccept}
              disabled={submitting}
              className="w-full py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-sm font-extrabold transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>
                {user ? 'Accept & Generate My Referral Link' : 'Log In to Accept & Get Link'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Auth Modal for Unauthenticated Users */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => {
          setShowAuthModal(false);
        }}
      />
    </div>
  );
}
