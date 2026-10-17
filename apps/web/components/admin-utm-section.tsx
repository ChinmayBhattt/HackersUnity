'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Link2,
  Users,
  Search,
  ExternalLink,
  Copy,
  Check,
  Plus,
  MousePointerClick,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Trash2,
  Calendar,
  Building2,
  Mail,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Clock,
  ShieldCheck,
  Globe,
  Loader2,
  RefreshCw,
  Share2,
} from 'lucide-react';
import { AdminUtmModal, UtmLinkItem } from './admin-utm-modal';

interface AdminUtmSectionProps {
  events: any[];
  initialSelectedEventId?: string | null;
  onNotification?: (msg: { type: 'success' | 'error'; text: string }) => void;
  isViewer?: boolean;
}

export function AdminUtmSection({
  events,
  initialSelectedEventId,
  onNotification,
  isViewer = false,
}: AdminUtmSectionProps) {
  // Filter out rejected events
  const eligibleEvents = useMemo(() => {
    return (events || []).filter((ev) => {
      const status = (ev.status || '').toUpperCase();
      return status !== 'REJECTED';
    });
  }, [events]);

  // Currently selected event
  const [selectedEventId, setSelectedEventId] = useState<string>(() => {
    if (initialSelectedEventId && eligibleEvents.some((e) => e.id === initialSelectedEventId)) {
      return initialSelectedEventId;
    }
    return eligibleEvents[0]?.id || '';
  });

  // Search in left events list
  const [eventSearch, setEventSearch] = useState('');

  // Search in right promoters list
  const [promoterSearch, setPromoterSearch] = useState('');

  // Event summary map (event_id -> { totalLinks, totalClicks, totalRegistrations })
  const [summaryMap, setSummaryMap] = useState<
    Record<string, { totalLinks: number; totalClicks: number; totalRegistrations: number }>
  >({});
  const [tableNeedsMigration, setTableNeedsMigration] = useState(false);

  // Links for the selected event
  const [utmLinks, setUtmLinks] = useState<UtmLinkItem[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalEvent, setModalEvent] = useState<any | null>(null);

  // Expanded registered hackers accordion: linkId -> boolean
  const [expandedHackers, setExpandedHackers] = useState<Record<string, boolean>>({});

  // Copied state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Resolve currently active event object from eligibleEvents
  const activeEvent = useMemo(() => {
    return eligibleEvents.find((e) => e.id === selectedEventId) || eligibleEvents[0] || null;
  }, [eligibleEvents, selectedEventId]);

  // Sync selected event if initialSelectedEventId changes from parent
  useEffect(() => {
    if (initialSelectedEventId && eligibleEvents.some((e) => e.id === initialSelectedEventId)) {
      setSelectedEventId(initialSelectedEventId);
    }
  }, [initialSelectedEventId, eligibleEvents]);

  // Ensure selectedEventId points to a valid non-rejected event
  useEffect(() => {
    if (eligibleEvents.length > 0) {
      setSelectedEventId((prev) => {
        if (prev && eligibleEvents.some((e) => e.id === prev)) {
          return prev;
        }
        return eligibleEvents[0].id;
      });
    }
  }, [eligibleEvents]);

  // Fetch summary across all events
  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/utm?summary=true');
      if (res.ok) {
        const data = await res.json();
        setSummaryMap(data.summary || {});
        if (data.tableNeedsMigration) {
          setTableNeedsMigration(true);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch UTM summary:', err);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Fetch UTM links for active event
  const fetchActiveEventLinks = useCallback(async () => {
    if (!activeEvent?.id) return;
    setLoadingLinks(true);
    try {
      const res = await fetch(`/api/utm?eventId=${encodeURIComponent(activeEvent.id)}`);
      if (res.ok) {
        const data = await res.json();
        setUtmLinks(data.links || []);
        if (data.tableNeedsMigration) {
          setTableNeedsMigration(true);
        }
      }
    } catch (err) {
      console.warn('Failed to load active event UTM links:', err);
    } finally {
      setLoadingLinks(false);
    }
  }, [activeEvent?.id]);

  useEffect(() => {
    fetchActiveEventLinks();
  }, [fetchActiveEventLinks]);

  // Filter events on left (excluding rejected)
  const filteredEvents = useMemo(() => {
    return eligibleEvents.filter((ev) => {
      const q = eventSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        ev.title?.toLowerCase().includes(q) ||
        ev.slug?.toLowerCase().includes(q) ||
        ev.organizer_name?.toLowerCase().includes(q)
      );
    });
  }, [eligibleEvents, eventSearch]);

  // Filter promoters on right
  const filteredPromoterLinks = useMemo(() => {
    return utmLinks.filter((link) => {
      const q = promoterSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        link.code?.toLowerCase().includes(q) ||
        link.customName?.toLowerCase().includes(q) ||
        link.user?.name?.toLowerCase().includes(q) ||
        link.user?.email?.toLowerCase().includes(q) ||
        link.user?.username?.toLowerCase().includes(q)
      );
    });
  }, [utmLinks, promoterSearch]);

  // Calculate totals for active event
  const activeEventStats = useMemo(() => {
    let totalClicks = 0;
    let totalRegistrations = 0;

    utmLinks.forEach((l) => {
      totalClicks += Number(l.clicksCount || 0);
      totalRegistrations += Number(l.confirmedRegistrationsCount || 0);
    });

    const conversionRate =
      totalClicks > 0 ? ((totalRegistrations / totalClicks) * 100).toFixed(1) : '0.0';

    return {
      totalLinks: utmLinks.length,
      totalClicks,
      totalRegistrations,
      conversionRate,
    };
  }, [utmLinks]);

  // Copy helper
  const handleCopy = async (code: string) => {
    if (!activeEvent) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hackersunity.com';
    const url = `${origin}/hackathons/${activeEvent.slug || activeEvent.id}/${code}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      onNotification?.({
        type: 'success',
        text: `Copied UTM referral link: ${url}`,
      });
    } catch {
      onNotification?.({
        type: 'error',
        text: 'Failed to copy to clipboard',
      });
    }
  };

  // Delete helper
  const handleDelete = async (link: UtmLinkItem) => {
    if (isViewer) return;
    if (!confirm(`Are you sure you want to remove UTM referral link "${link.code}"?`)) return;

    try {
      const res = await fetch(
        `/api/utm?id=${encodeURIComponent(link.id)}&eventId=${encodeURIComponent(link.eventId)}&code=${encodeURIComponent(link.code)}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setUtmLinks((prev) => prev.filter((l) => l.id !== link.id));
        fetchSummary();
        onNotification?.({
          type: 'success',
          text: `Deleted UTM link "${link.code}".`,
        });
      }
    } catch {
      onNotification?.({
        type: 'error',
        text: 'Failed to delete UTM link',
      });
    }
  };

  const toggleHackersList = (linkId: string) => {
    setExpandedHackers((prev) => ({
      ...prev,
      [linkId]: !prev[linkId],
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ─── Top Banner / SQL Notification if needed ─────────────────── */}
      {tableNeedsMigration && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                UTM Migration Ready in Supabase
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                UTM tracking is active with resilient fallback. For high-throughput analytics, run <code className="font-mono text-amber-600 dark:text-amber-400 font-bold">apps/web/supabase/utm-tracking-migration.sql</code> in your Supabase SQL editor.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                'apps/web/supabase/utm-tracking-migration.sql'
              );
              onNotification?.({
                type: 'success',
                text: 'Migration file path copied to clipboard!',
              });
            }}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Migration Path</span>
          </button>
        </div>
      )}

      {/* ─── Main 2-Column Split Layout ──────────────────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ─── LEFT COLUMN: All Events List ─────────────────────────── */}
        <div className="w-full lg:w-[380px] xl:w-[420px] shrink-0 bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col">
          {/* Header & Search */}
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#0099e6]/10 text-[#0099e6] flex items-center justify-center">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Hackathons &amp; Events
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Select an event to view promoter UTM stats
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">
                {eligibleEvents.length}
              </span>
            </div>

            {/* Event Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
                placeholder="Search hackathons..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.08] focus:bg-white dark:focus:bg-[#080c14] focus:border-[#0099e6] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 font-medium transition"
              />
            </div>
          </div>

          {/* Events Scroll List */}
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {filteredEvents.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No events match your search query.
              </div>
            ) : (
              filteredEvents.map((ev) => {
                const isSelected = ev.id === selectedEventId;
                const evStats = summaryMap[ev.id] || { totalLinks: 0, totalClicks: 0, totalRegistrations: 0 };

                return (
                  <div
                    key={ev.id}
                    onClick={() => setSelectedEventId(ev.id)}
                    className={`p-3.5 rounded-2xl border transition text-left cursor-pointer relative group ${
                      isSelected
                        ? 'bg-sky-500/10 border-[#0099e6] dark:border-[#0099e6] shadow-xs'
                        : 'bg-slate-50/60 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/[0.06] hover:bg-slate-100/80 dark:hover:bg-white/[0.05] hover:border-slate-300 dark:hover:border-white/[0.12]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                              ev.status === 'PUBLISHED' || ev.status === 'APPROVED' || ev.status === 'REGISTRATION_OPEN'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                : 'bg-slate-200 dark:bg-white/[0.08] text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {ev.status || 'EVENT'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium truncate">
                            {ev.organizer_name}
                          </span>
                        </div>

                        <h4
                          className={`text-xs font-black truncate transition ${
                            isSelected
                              ? 'text-[#0099e6] dark:text-[#38bdf8]'
                              : 'text-slate-900 dark:text-white group-hover:text-[#0099e6]'
                          }`}
                        >
                          {ev.title}
                        </h4>
                      </div>

                      {/* Quick + UTM Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventId(ev.id);
                          setModalEvent(ev);
                          setModalOpen(true);
                        }}
                        disabled={isViewer}
                        className={`p-1.5 rounded-xl border text-[10px] font-bold transition flex items-center gap-1 shrink-0 ${
                          isSelected
                            ? 'bg-[#0099e6] text-white border-[#0099e6]'
                            : 'bg-white dark:bg-white/[0.06] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:text-[#0099e6]'
                        }`}
                        title="Create or Copy UTM Link for this event"
                      >
                        <Plus className="w-3 h-3" />
                        <span className="hidden sm:inline">UTM</span>
                      </button>
                    </div>

                    {/* Stats pills */}
                    <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-white/[0.04] flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Link2 className="w-3 h-3 text-[#0099e6]" />
                        <span>{evStats.totalLinks} Links</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MousePointerClick className="w-3 h-3 text-amber-500" />
                        <span>{evStats.totalClicks} Clicks</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 ml-auto">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{evStats.totalRegistrations} Regs</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Promoters & UTM Performance ─────────────── */}
        <div className="flex-1 w-full space-y-6">
          {activeEvent ? (
            <>
              {/* Event Header & Quick Stats Card */}
              <div className="bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-white/[0.06]">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#0099e6]/10 text-[#0099e6] dark:text-[#38bdf8] border border-[#0099e6]/20">
                        {activeEvent.category || 'HACKATHON'}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        by {activeEvent.organizer_name}
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white truncate">
                      {activeEvent.title}
                    </h2>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <Link
                        href={`/hackathons/${activeEvent.slug || activeEvent.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[#0099e6] flex items-center gap-1 font-semibold transition"
                      >
                        <Globe className="w-3.5 h-3.5 text-[#0099e6]" />
                        <span>View Live Event Page</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                      <span>•</span>
                      <span className="font-mono text-[11px]">
                        ID: {activeEvent.slug || activeEvent.id}
                      </span>
                    </div>
                  </div>

                  {/* Create Custom UTM Link CTA */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => fetchActiveEventLinks()}
                      disabled={loadingLinks}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 transition cursor-pointer"
                      title="Refresh statistics"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingLinks ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalEvent(activeEvent);
                        setModalOpen(true);
                      }}
                      disabled={isViewer}
                      className="px-4 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Custom UTM Link</span>
                    </button>
                  </div>
                </div>

                {/* 4 Metric Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-5">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#080c14] border border-slate-200/80 dark:border-white/[0.06]">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      <Link2 className="w-3.5 h-3.5 text-[#0099e6]" />
                      <span>Promoter Links</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {activeEventStats.totalLinks}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">
                      <MousePointerClick className="w-3.5 h-3.5" />
                      <span>Total Clicks</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
                      {activeEventStats.totalClicks}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirmed Regs</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                      {activeEventStats.totalRegistrations}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-sky-500/5 dark:bg-sky-500/10 border border-sky-500/20">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#0099e6] dark:text-[#38bdf8] mb-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Conversion Rate</span>
                    </div>
                    <span className="text-xl sm:text-2xl font-black text-[#0099e6] dark:text-[#38bdf8]">
                      {activeEventStats.conversionRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Promoter Users List */}
              <div className="bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#0099e6]" />
                      <span>Promoters &amp; Campus Ambassadors</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Platform profiles bringing registrations via their personalized UTM links
                    </p>
                  </div>

                  {utmLinks.length > 0 && (
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={promoterSearch}
                        onChange={(e) => setPromoterSearch(e.target.value)}
                        placeholder="Search promoter, email, link..."
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.08] focus:bg-white dark:focus:bg-[#080c14] focus:border-[#0099e6] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 font-medium transition"
                      />
                    </div>
                  )}
                </div>

                {loadingLinks ? (
                  <div className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 text-[#0099e6] animate-spin mx-auto mb-2" />
                    <p className="text-xs font-semibold">Loading promoter performance...</p>
                  </div>
                ) : utmLinks.length === 0 ? (
                  /* Empty state */
                  <div className="py-14 text-center bg-slate-50/50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/[0.08] rounded-3xl p-8">
                    <div className="w-14 h-14 rounded-3xl bg-sky-50 dark:bg-sky-500/10 text-[#0099e6] flex items-center justify-center mx-auto mb-3 shadow-inner">
                      <Link2 className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      No UTM Links Created Yet
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-5">
                      Generate a customizable link for this event, assign it to any platform user or ambassador, and share it to track registrations in real time.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setModalEvent(activeEvent);
                        setModalOpen(true);
                      }}
                      disabled={isViewer}
                      className="px-5 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold transition inline-flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create First UTM Link</span>
                    </button>
                  </div>
                ) : filteredPromoterLinks.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No promoter links match &quot;{promoterSearch}&quot;.
                  </div>
                ) : (
                  /* Promoters Cards List */
                  <div className="space-y-4">
                    {filteredPromoterLinks.map((link) => {
                      const isCopied = copiedCode === link.code;
                      const hasRegisteredUsers = Boolean(
                        link.registeredUsers && link.registeredUsers.length > 0
                      );
                      const isExpanded = Boolean(expandedHackers[link.id]);
                      const conversionRate =
                        link.clicksCount > 0
                          ? ((link.confirmedRegistrationsCount / link.clicksCount) * 100).toFixed(1)
                          : '0.0';

                      const origin =
                        typeof window !== 'undefined'
                          ? window.location.origin
                          : 'https://hackersunity.com';
                      const linkUrl = `${origin}/hackathons/${activeEvent.slug || activeEvent.id}/${link.code}`;

                      return (
                        <div
                          key={link.id}
                          className="bg-slate-50/70 dark:bg-[#070b12] border border-slate-200/90 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.14] rounded-2xl p-4 sm:p-5 transition shadow-2xs"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* User Profile Card */}
                            <div className="flex items-center gap-3.5 min-w-0 flex-1">
                              {/* Avatar */}
                              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-blue-500/10 border border-sky-500/20 overflow-hidden shrink-0 flex items-center justify-center relative shadow-xs">
                                {link.user?.avatar_url ? (
                                  <Image
                                    src={link.user.avatar_url}
                                    alt={link.user.name || 'User'}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-sm font-black text-[#0099e6] dark:text-[#38bdf8]">
                                    {(link.user?.name || link.customName || link.code || 'U')[0].toUpperCase()}
                                  </span>
                                )}
                              </div>

                              {/* Details */}
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                                    {link.user?.name || link.customName || 'Community Promoter'}
                                  </h4>
                                  {link.user?.username && (
                                    <span className="text-[11px] font-mono text-slate-400">
                                      @{link.user.username}
                                    </span>
                                  )}
                                  {link.user?.role && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-200/80 dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 uppercase">
                                      {link.user.role}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                                  <span className="flex items-center gap-1 truncate">
                                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                    <span className="truncate">{link.user?.email || 'No linked email'}</span>
                                  </span>
                                  {link.user?.college && (
                                    <>
                                      <span>•</span>
                                      <span className="flex items-center gap-1 text-[11px] truncate">
                                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span className="truncate">{link.user.college}</span>
                                      </span>
                                    </>
                                  )}
                                </div>

                                {/* Custom Link Display with 1-click Copy */}
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-xs font-mono font-bold text-[#0099e6] dark:text-[#38bdf8] bg-sky-500/10 px-2.5 py-1 rounded-xl border border-sky-500/20 truncate max-w-xs sm:max-w-md">
                                    /{link.code}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(link.code)}
                                    className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 border ${
                                      isCopied
                                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                                        : 'bg-white dark:bg-white/[0.06] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-200 hover:text-[#0099e6]'
                                    }`}
                                  >
                                    {isCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    <span>{isCopied ? 'Copied Link' : 'Copy'}</span>
                                  </button>

                                  <Link
                                    href={linkUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                                    title="Open link in new tab"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </Link>
                                </div>
                              </div>
                            </div>

                            {/* Metrics & Actions */}
                            <div className="flex items-center gap-3 shrink-0 justify-between lg:justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200/60 dark:border-white/[0.06]">
                              {/* Clicks */}
                              <div className="text-center px-3 py-1.5 rounded-xl bg-white dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06]">
                                <span className="block text-[10px] font-bold text-slate-400 uppercase">
                                  Clicks
                                </span>
                                <span className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1">
                                  <MousePointerClick className="w-3 h-3 text-amber-500" />
                                  {link.clicksCount}
                                </span>
                              </div>

                              {/* Confirmed Registrations */}
                              <div className="text-center px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                                  Confirmed Regs
                                </span>
                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {link.confirmedRegistrationsCount}
                                </span>
                              </div>

                              {/* Conversion Rate */}
                              <div className="text-center px-3 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 hidden sm:block">
                                <span className="block text-[10px] font-bold text-[#0099e6] dark:text-[#38bdf8] uppercase">
                                  Conv. Rate
                                </span>
                                <span className="text-sm font-black text-[#0099e6] dark:text-[#38bdf8]">
                                  {conversionRate}%
                                </span>
                              </div>

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={() => handleDelete(link)}
                                disabled={isViewer}
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                                title="Delete link"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Collapsible Registered Hackers List */}
                          {hasRegisteredUsers && (
                            <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-white/[0.06]">
                              <button
                                type="button"
                                onClick={() => toggleHackersList(link.id)}
                                className="text-xs font-bold text-[#0099e6] dark:text-[#38bdf8] flex items-center gap-1.5 cursor-pointer hover:underline"
                              >
                                <span>
                                  {isExpanded
                                    ? 'Hide Registered Hackers'
                                    : `View Registered Hackers (${link.registeredUsers?.length})`}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>

                              {isExpanded && (
                                <div className="mt-2.5 bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-white/[0.04]">
                                  {link.registeredUsers?.map((hacker, idx) => (
                                    <div
                                      key={hacker.id || idx}
                                      className="p-2.5 px-3 flex items-center justify-between text-xs gap-3"
                                    >
                                      <div className="min-w-0">
                                        <p className="font-bold text-slate-900 dark:text-white truncate">
                                          {hacker.userName}
                                        </p>
                                        <p className="text-[11px] text-slate-500 truncate">
                                          {hacker.userEmail}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-[10px] text-slate-400 font-mono">
                                          {hacker.registeredAt
                                            ? new Date(hacker.registeredAt).toLocaleDateString()
                                            : ''}
                                        </span>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                          {hacker.status}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-slate-400">
              Select an event from the left list to view its UTM referral links.
            </div>
          )}
        </div>
      </div>

      {/* UTM Generator Modal */}
      {modalOpen && (
        <AdminUtmModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          event={modalEvent}
          onUtmCreated={() => {
            fetchActiveEventLinks();
            fetchSummary();
          }}
          onNotification={onNotification}
        />
      )}
    </div>
  );
}
