'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  ArrowUpToLine,
  ArrowDownToLine,
  Target,
  Sparkles,
  Save,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Trophy,
  Building2,
  Loader2,
  Flame,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export interface ShowcaseEvent {
  id: string;
  slug: string;
  title: string;
  description?: string;
  tagline?: string;
  category?: string;
  event_type?: string;
  location?: string;
  organizer_name?: string;
  organizer_avatar?: string;
  start_date?: string;
  end_date?: string;
  total_prize_value?: number;
  currency?: string;
  banner_url?: string;
  logo_url?: string;
  status: string;
  display_order?: number;
  tags?: string[];
  created_at: string;
}

interface AdminShowcaseReorderProps {
  events: ShowcaseEvent[];
  onOrderSaved?: (orderedEvents: ShowcaseEvent[]) => void;
  onClose?: () => void;
}

export function AdminShowcaseReorder({
  events,
  onOrderSaved,
  onClose,
}: AdminShowcaseReorderProps) {
  // Filter for approved / live events only
  const liveEvents = useMemo(() => {
    const isApproved = (e: ShowcaseEvent) =>
      ['PUBLISHED', 'REGISTRATION_OPEN', 'LIVE', 'JUDGING', 'COMPLETED', 'ARCHIVED'].includes(
        e.status
      );
    return events
      .filter(isApproved)
      .sort((a, b) => {
        const orderA = typeof a.display_order === 'number' ? a.display_order : 999999;
        const orderB = typeof b.display_order === 'number' ? b.display_order : 999999;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      });
  }, [events]);

  const [orderedList, setOrderedList] = useState<ShowcaseEvent[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Drag and Drop states
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Initialize ordered list from liveEvents
  useEffect(() => {
    setOrderedList(liveEvents);
    setHasUnsavedChanges(false);
  }, [liveEvents]);

  // Auto-dismiss notification after 4s
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // ─── 1. Position Actions ───────────────────────────────────────────────────

  // Move directly to Position 1 (Start / Beginning)
  const handleMoveToStart = (index: number) => {
    if (index === 0) return;
    setOrderedList((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.unshift(item);
      return copy;
    });
    setHasUnsavedChanges(true);
  };

  // Move directly to Middle (Center of carousel)
  const handleMoveToCenter = (index: number) => {
    setOrderedList((prev) => {
      const centerIndex = Math.floor(prev.length / 2);
      if (index === centerIndex) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(centerIndex, 0, item);
      return copy;
    });
    setHasUnsavedChanges(true);
  };

  // Move directly to the Last position (Ending)
  const handleMoveToEnd = (index: number) => {
    setOrderedList((prev) => {
      if (index === prev.length - 1) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.push(item);
      return copy;
    });
    setHasUnsavedChanges(true);
  };

  // Move 1 position Up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setOrderedList((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    setHasUnsavedChanges(true);
  };

  // Move 1 position Down
  const handleMoveDown = (index: number) => {
    setOrderedList((prev) => {
      if (index === prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    setHasUnsavedChanges(true);
  };

  // ─── 2. Drag & Drop Handlers ────────────────────────────────────────────────
  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', `${index}`);
  };

  const onDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const onDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setOrderedList((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(draggedIndex, 1);
      copy.splice(targetIndex, 0, item);
      return copy;
    });
    setHasUnsavedChanges(true);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const onDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // ─── 3. Save Order ─────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (orderedList.length === 0) return;
    setIsSaving(true);

    try {
      const orderedIds = orderedList.map((e) => e.id);

      const res = await fetch('/api/admin-csap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reorder_showcase',
          orderedEventIds: orderedIds,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Also update local storage for zero-delay client reflection
        if (typeof window !== 'undefined') {
          localStorage.setItem('hackers_unity_showcase_order', JSON.stringify(orderedIds));
        }

        const updatedEvents = orderedList.map((e, idx) => ({
          ...e,
          display_order: idx,
        }));

        setOrderedList(updatedEvents);
        setHasUnsavedChanges(false);
        setNotification({
          type: 'success',
          message: `🎉 Showcase order saved! "${orderedList[0]?.title}" is now at position #1.`,
        });

        if (onOrderSaved) {
          onOrderSaved(updatedEvents);
        }
      } else {
        setNotification({
          type: 'error',
          message: data.error || 'Failed to save showcase order',
        });
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Network error saving order',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // ─── 4. Reset to Newest First ──────────────────────────────────────────────
  const handleResetToNewest = () => {
    const sorted = [...orderedList].sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    );
    setOrderedList(sorted);
    setHasUnsavedChanges(true);
    setNotification({
      type: 'success',
      message: 'Reset to Newest First. Click "Save Order" to apply.',
    });
  };

  const centerIndex = Math.floor(orderedList.length / 2);

  return (
    <div className="space-y-6">
      {/* ─── Notification Alert ────────────────────────────────────────── */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 shadow-sm transition-all animate-in fade-in slide-in-from-top-2 ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-bold opacity-70 hover:opacity-100 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* ─── Control Header Card ───────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] p-5 sm:p-6 rounded-3xl shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-[#ea580c] text-xs font-bold uppercase tracking-wider">
                <Flame className="w-3.5 h-3.5 text-[#f97316]" />
                <span>Homepage Showcase Placement</span>
              </span>
              {hasUnsavedChanges && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-bold animate-pulse">
                  ● Unsaved Changes
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Featured &amp; Trending Hackathons Carousel
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl font-medium">
              Drag and drop any card, or click <strong className="text-slate-700 dark:text-slate-300">Start 🔝</strong>, <strong className="text-slate-700 dark:text-slate-300">Center 🎯</strong>, or <strong className="text-slate-700 dark:text-slate-300">End 🔚</strong> to place it anywhere in the homepage showcase track.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={handleResetToNewest}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Reset order to newest first"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Newest</span>
            </button>

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Open Homepage in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#0099e6]" />
              <span>View Homepage</span>
            </Link>

            <button
              onClick={handleSave}
              disabled={isSaving || !hasUnsavedChanges}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer ${
                hasUnsavedChanges
                  ? 'bg-[#0099e6] hover:bg-[#0284c7] text-white shadow-sky-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60'
              }`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Order...</span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Showcase Order</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Order Saved</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Live Carousel Mini-Preview Ribbon ──────────────────────────── */}
      {orderedList.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl shadow-md text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-xs sm:text-sm font-black tracking-wide uppercase text-slate-300">
                Live Homepage Carousel Preview (Left to Right)
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              Horizontal Scroll Order • {orderedList.length} Events
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 pt-1 [scrollbar-width:thin] snap-x">
            {orderedList.map((event, idx) => {
              const isFirst = idx === 0;
              const isCenter = idx === centerIndex;
              const isLast = idx === orderedList.length - 1;

              return (
                <div
                  key={event.id}
                  className={`w-52 shrink-0 bg-slate-950/80 rounded-2xl p-3 border transition-all relative ${
                    isFirst
                      ? 'border-amber-500/80 shadow-md shadow-amber-500/10'
                      : isCenter
                      ? 'border-sky-500/80 shadow-md shadow-sky-500/10'
                      : isLast
                      ? 'border-purple-500/80 shadow-md shadow-purple-500/10'
                      : 'border-white/[0.08]'
                  }`}
                >
                  {/* Position Tag */}
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isFirst
                          ? 'bg-amber-500 text-black font-extrabold'
                          : isCenter
                          ? 'bg-sky-500 text-black font-extrabold'
                          : isLast
                          ? 'bg-purple-500 text-white font-extrabold'
                          : 'bg-white/[0.1] text-slate-300'
                      }`}
                    >
                      {isFirst ? '#1 START' : isCenter ? `#${idx + 1} CENTER` : isLast ? `#${idx + 1} END` : `#${idx + 1}`}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {event.event_type || 'ONLINE'}
                    </span>
                  </div>

                  {/* Thumbnail */}
                  <div className="relative w-full h-20 rounded-xl overflow-hidden bg-slate-800 mb-2 border border-white/[0.06]">
                    {event.banner_url ? (
                      <Image
                        src={event.banner_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-950 to-slate-900">
                        <Trophy className="w-6 h-6 text-sky-400/60" />
                      </div>
                    )}
                  </div>

                  {/* Title & Prize */}
                  <h4 className="text-xs font-bold text-white truncate mb-0.5" title={event.title}>
                    {event.title}
                  </h4>
                  <p className="text-[11px] font-semibold text-emerald-400 truncate">
                    {event.total_prize_value && event.total_prize_value > 0
                      ? formatCurrency(event.total_prize_value, event.currency === 'USD' ? 'USD' : 'INR')
                      : 'Perks & Swag'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Draggable Cards List ────────────────────────────────────────── */}
      {orderedList.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] rounded-3xl p-8">
          <Trophy className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No live events to order</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Approve hackathons from &ldquo;Pending Review&rdquo; to showcase them on the homepage.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orderedList.map((event, idx) => {
            const isFirst = idx === 0;
            const isCenter = idx === centerIndex;
            const isLast = idx === orderedList.length - 1;
            const isBeingDragged = draggedIndex === idx;
            const isTargeted = dragOverIndex === idx;

            return (
              <div
                key={event.id}
                draggable
                onDragStart={(e) => onDragStart(e, idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDrop={(e) => onDrop(e, idx)}
                onDragEnd={onDragEnd}
                className={`bg-white dark:bg-[#0c1017] border rounded-3xl p-4 sm:p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-grab active:cursor-grabbing select-none ${
                  isBeingDragged
                    ? 'opacity-40 scale-[0.99] border-sky-400 dark:border-sky-500'
                    : isTargeted
                    ? 'border-[#0099e6] dark:border-[#38bdf8] ring-2 ring-[#0099e6]/20 bg-sky-50/50 dark:bg-sky-950/20'
                    : isFirst
                    ? 'border-amber-400/80 dark:border-amber-500/50 shadow-xs'
                    : 'border-slate-200/90 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.16]'
                }`}
              >
                {/* Left Drag Handle + Position Badge + Event Details */}
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  {/* Drag Grip Handle */}
                  <div
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200 rounded-lg shrink-0"
                    title="Drag to reorder"
                  >
                    <GripVertical className="w-5 h-5" />
                  </div>

                  {/* Position Badge */}
                  <div className="shrink-0 flex flex-col items-center">
                    <span
                      className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-sm transition-all shadow-xs ${
                        isFirst
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white font-extrabold ring-2 ring-amber-300 dark:ring-amber-500/30'
                          : isCenter
                          ? 'bg-gradient-to-br from-sky-400 to-blue-600 text-white font-extrabold'
                          : isLast
                          ? 'bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-extrabold'
                          : 'bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase tracking-tight text-slate-400 mt-1">
                      {isFirst ? 'Start' : isCenter ? 'Center' : isLast ? 'End' : `Slot ${idx + 1}`}
                    </span>
                  </div>

                  {/* Banner Image */}
                  <div className="relative w-16 h-14 sm:w-20 sm:h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-white/[0.08]">
                    {event.banner_url ? (
                      <Image
                        src={event.banner_url}
                        alt={event.title}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-500/10 to-blue-500/20 text-[#0099e6]">
                        <Trophy className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  {/* Event Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                        {event.title}
                      </h3>
                      {isFirst && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
                          🏆 1st Card on Homepage
                        </span>
                      )}
                      {isCenter && !isFirst && !isLast && (
                        <span className="px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 text-[#0099e6] dark:text-[#38bdf8] text-[10px] font-black uppercase tracking-wider">
                          🎯 Center of Carousel
                        </span>
                      )}
                      {isLast && !isFirst && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-400 text-[10px] font-black uppercase tracking-wider">
                          🏁 Final Card
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold">
                        <Building2 className="w-3.5 h-3.5 text-[#0099e6]" />
                        {event.organizer_name || "Hacker's Unity"}
                      </span>
                      <span>•</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {event.total_prize_value && event.total_prize_value > 0
                          ? formatCurrency(event.total_prize_value, event.currency === 'USD' ? 'USD' : 'INR')
                          : 'Perks & Swag'}
                      </span>
                      <span>•</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                        {event.event_type || 'ONLINE'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Quick Placement Action Buttons */}
                <div
                  className="flex items-center gap-1.5 shrink-0 self-end md:self-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Start 🔝 */}
                  <button
                    type="button"
                    onClick={() => handleMoveToStart(idx)}
                    disabled={isFirst}
                    title="Place at the very beginning (Position 1 on Homepage)"
                    className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ArrowUpToLine className="w-3.5 h-3.5" />
                    <span>Start</span>
                  </button>

                  {/* Move Up ⬆️ */}
                  <button
                    type="button"
                    onClick={() => handleMoveUp(idx)}
                    disabled={isFirst}
                    title="Move up 1 slot"
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>

                  {/* Center 🎯 */}
                  <button
                    type="button"
                    onClick={() => handleMoveToCenter(idx)}
                    disabled={isCenter}
                    title="Place in the center/middle of the carousel"
                    className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 border border-sky-200 dark:border-sky-500/30 text-[#0099e6] dark:text-[#38bdf8] text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <Target className="w-3.5 h-3.5" />
                    <span>Center</span>
                  </button>

                  {/* Move Down ⬇️ */}
                  <button
                    type="button"
                    onClick={() => handleMoveDown(idx)}
                    disabled={isLast}
                    title="Move down 1 slot"
                    className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center justify-center cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>

                  {/* End 🔚 */}
                  <button
                    type="button"
                    onClick={() => handleMoveToEnd(idx)}
                    disabled={isLast}
                    title="Place at the very end of the carousel"
                    className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-500/10 dark:hover:bg-purple-500/20 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                    <span>End</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
