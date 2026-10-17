'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import {
  X,
  Link2,
  Copy,
  Check,
  Search,
  User,
  Users,
  ExternalLink,
  Trash2,
  Sparkles,
  TrendingUp,
  MousePointerClick,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Share2,
} from 'lucide-react';

export interface UtmLinkItem {
  id: string;
  eventId: string;
  eventSlug: string;
  code: string;
  customName?: string;
  userId?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    avatar_url?: string;
    username?: string;
    college?: string;
    organization?: string;
    role?: string;
  } | null;
  clicksCount: number;
  confirmedRegistrationsCount: number;
  registeredUsers?: Array<{
    id: string;
    userName: string;
    userEmail: string;
    registeredAt: string;
    status: string;
  }>;
  createdAt?: string;
}

interface AdminUtmModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any | null;
  onUtmCreated?: (link: UtmLinkItem) => void;
  onViewInUtmSection?: (event: any) => void;
  onNotification?: (msg: { type: 'success' | 'error'; text: string }) => void;
}

export function AdminUtmModal({
  isOpen,
  onClose,
  event,
  onUtmCreated,
  onViewInUtmSection,
  onNotification,
}: AdminUtmModalProps) {
  const [customSlug, setCustomSlug] = useState('');
  const [customName, setCustomName] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // User search states
  const [userQuery, setUserQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Existing links
  const [existingLinks, setExistingLinks] = useState<UtmLinkItem[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);
  const [deletingLinkId, setDeletingLinkId] = useState<string | null>(null);

  // Copy state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedGeneral, setCopiedGeneral] = useState(false);

  const baseUrl = useMemo(() => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/hackathons/${event?.slug || event?.id || ''}/`;
    }
    return `https://hackersunity.com/hackathons/${event?.slug || event?.id || ''}/`;
  }, [event?.slug, event?.id]);

  const generalInviteUrl = `${baseUrl}promoter`;

  const handleCopyGeneralInvite = async () => {
    try {
      await navigator.clipboard.writeText(generalInviteUrl);
      setCopiedGeneral(true);
      setTimeout(() => setCopiedGeneral(false), 2000);
      onNotification?.({
        type: 'success',
        text: `General Promoter Invite Link copied: ${generalInviteUrl}`,
      });
    } catch {
      onNotification?.({
        type: 'error',
        text: 'Failed to copy link',
      });
    }
  };

  // Clean custom slug generator
  const cleanSlug = useMemo(() => {
    return customSlug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/g, '-');
  }, [customSlug]);

  const fullPreviewUrl = `${baseUrl}${cleanSlug || 'your-name'}`;

  // Fetch existing links for event
  const fetchLinks = useCallback(async () => {
    if (!event?.id) return;
    setLoadingLinks(true);
    try {
      const res = await fetch(`/api/utm?eventId=${encodeURIComponent(event.id)}`);
      if (res.ok) {
        const data = await res.json();
        setExistingLinks(data.links || []);
      }
    } catch (err) {
      console.warn('Failed to fetch existing UTM links:', err);
    } finally {
      setLoadingLinks(false);
    }
  }, [event?.id]);

  useEffect(() => {
    if (isOpen && event?.id) {
      fetchLinks();
      setCustomSlug('');
      setCustomName('');
      setSelectedUser(null);
      setUserQuery('');
      setSearchResults([]);
    }
  }, [isOpen, event?.id, fetchLinks]);

  // Debounced user search
  useEffect(() => {
    if (!userQuery.trim() || userQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(userQuery.trim())}&limit=8`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.users || []);
          setUserDropdownOpen(true);
        }
      } catch (err) {
        console.warn('User search error:', err);
      } finally {
        setSearchingUsers(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [userQuery]);

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setUserDropdownOpen(false);
    setUserQuery('');

    // Pre-fill slug if not set
    if (!customSlug.trim()) {
      const suggested = (user.username || user.name.split(' ')[0] || 'promoter')
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, '-');
      setCustomSlug(suggested);
    }
    if (!customName.trim()) {
      setCustomName(user.name || '');
    }
  };

  const handleCopyLink = async (code: string) => {
    const url = `${baseUrl}${code}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
      onNotification?.({
        type: 'success',
        text: `UTM Link copied to clipboard: ${url}`,
      });
    } catch {
      // Fallback
      onNotification?.({
        type: 'error',
        text: 'Failed to copy to clipboard',
      });
    }
  };

  const handleCreateLink = async () => {
    if (!event?.id || !cleanSlug) {
      onNotification?.({
        type: 'error',
        text: 'Please enter a valid custom name/slug for the UTM link.',
      });
      return;
    }

    setCreatingLink(true);
    try {
      const res = await fetch('/api/utm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          eventSlug: event.slug || event.id,
          code: cleanSlug,
          customName: customName.trim() || selectedUser?.name || cleanSlug,
          userId: selectedUser?.id || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        onNotification?.({
          type: 'error',
          text: data.error || 'Failed to create UTM link',
        });
        return;
      }

      onNotification?.({
        type: 'success',
        text: `🎉 UTM Link created & copied: ${baseUrl}${cleanSlug}`,
      });

      // Auto-copy newly created link
      try {
        await navigator.clipboard.writeText(`${baseUrl}${cleanSlug}`);
        setCopiedCode(cleanSlug);
        setTimeout(() => setCopiedCode(null), 2500);
      } catch {}

      if (data.link) {
        onUtmCreated?.(data.link);
      }

      // Reset form & reload list
      setCustomSlug('');
      setCustomName('');
      setSelectedUser(null);
      fetchLinks();
    } catch (err: any) {
      onNotification?.({
        type: 'error',
        text: err.message || 'Error creating UTM link',
      });
    } finally {
      setCreatingLink(false);
    }
  };

  const handleDeleteLink = async (linkId: string, code: string) => {
    if (!confirm(`Are you sure you want to delete the UTM link "${code}"?`)) return;

    setDeletingLinkId(linkId);
    try {
      const res = await fetch(
        `/api/utm?id=${encodeURIComponent(linkId)}&eventId=${encodeURIComponent(event.id)}&code=${encodeURIComponent(code)}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setExistingLinks((prev) => prev.filter((l) => l.id !== linkId));
        onNotification?.({
          type: 'success',
          text: `UTM link "${code}" deleted.`,
        });
      }
    } catch {
      onNotification?.({
        type: 'error',
        text: 'Failed to delete link',
      });
    } finally {
      setDeletingLinkId(null);
    }
  };

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between gap-4 bg-gradient-to-r from-sky-500/5 via-blue-500/5 to-transparent">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#0099e6]/10 text-[#0099e6] dark:text-[#38bdf8] flex items-center justify-center shrink-0">
              <Link2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  Customizable UTM Referral Link
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Live Tracking
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {event.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition shrink-0 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* General Promoter Invite Link Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-sky-500/10 via-blue-500/5 to-transparent border border-sky-500/20 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0099e6]" />
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  General Promoter Invite Link
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-[#0099e6] dark:text-[#38bdf8] border border-sky-500/20">
                Self-Claimable Link
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Share this general link with users to onboard them as promoters. When they open it, an acceptance card will let them accept with 1-click and automatically generate their personalized referral link!
            </p>
            <div className="flex items-center gap-2 bg-white dark:bg-[#070b12] p-2 rounded-xl border border-sky-500/20">
              <span className="text-xs font-mono font-bold text-[#0099e6] dark:text-[#38bdf8] truncate flex-1 select-all">
                {generalInviteUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyGeneralInvite}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0 ${
                  copiedGeneral
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[#0099e6] hover:bg-[#0284c7] text-white shadow-xs cursor-pointer'
                }`}
              >
                {copiedGeneral ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedGeneral ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Section 1: Create Link */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Custom Link URL Preview
              </label>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-white/[0.08] flex items-center gap-2">
                <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 select-all shrink-0 hidden sm:inline">
                  {baseUrl}
                </span>
                <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 select-all shrink-0 sm:hidden">
                  .../{event.slug || 'event'}/
                </span>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value)}
                  placeholder="e.g. rohit or campus-lead"
                  className="flex-1 bg-white dark:bg-white/[0.06] border border-sky-500/30 focus:border-[#0099e6] rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-[#0099e6] dark:text-[#38bdf8] placeholder-slate-400 focus:outline-hidden transition"
                />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Share this custom link with any user or promoter. When people register through it, clicks and confirmed registrations are tracked automatically.
              </p>
            </div>

            {/* Platform User Association (Common sense: user must be on platform) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#0099e6]" />
                  <span>Assign Platform User (Promoter Profile)</span>
                </label>
                {selectedUser && (
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="text-[11px] text-rose-500 hover:text-rose-600 font-bold cursor-pointer"
                  >
                    Remove user
                  </button>
                )}
              </div>

              {selectedUser ? (
                /* Selected User Card */
                <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 relative">
                      {selectedUser.avatar_url ? (
                        <Image
                          src={selectedUser.avatar_url}
                          alt={selectedUser.name || 'User'}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-black text-xs text-sky-600 dark:text-sky-400">
                          {(selectedUser.name || selectedUser.email || 'U')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {selectedUser.name || 'Platform Hacker'}
                        </span>
                        {selectedUser.username && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            @{selectedUser.username}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {selectedUser.email}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-[#0099e6] dark:text-[#38bdf8] border border-sky-500/20 shrink-0">
                    Linked User
                  </span>
                </div>
              ) : (
                /* Search input */
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => {
                      setUserQuery(e.target.value);
                      setUserDropdownOpen(true);
                    }}
                    onFocus={() => {
                      if (searchResults.length > 0) setUserDropdownOpen(true);
                    }}
                    placeholder="Search platform user by name, email, or @username..."
                    className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-[#080c14] border border-slate-200 dark:border-white/[0.08] focus:bg-white dark:focus:bg-[#080c14] focus:border-[#0099e6] focus:ring-1 focus:ring-[#0099e6] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 font-medium transition"
                  />
                  {searchingUsers && (
                    <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#0099e6] animate-spin" />
                  )}

                  {/* Autocomplete Dropdown */}
                  {userDropdownOpen && searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-20 bg-white dark:bg-[#0e1420] border border-slate-200 dark:border-white/[0.1] rounded-2xl shadow-xl overflow-hidden max-h-52 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.04]">
                      {searchResults.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSelectUser(u)}
                          className="w-full p-2.5 flex items-center gap-3 text-left hover:bg-sky-500/5 dark:hover:bg-white/[0.04] transition cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/[0.06] overflow-hidden shrink-0 flex items-center justify-center">
                            {u.avatar_url ? (
                              <Image
                                src={u.avatar_url}
                                alt={u.name || 'User'}
                                width={32}
                                height={32}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                                {(u.name || u.email || 'U')[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {u.name}
                              </span>
                              {u.username && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  @{u.username}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">{u.email}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Create Action Button */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleCreateLink}
                disabled={creatingLink || !cleanSlug}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0284c7] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingLink ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : copiedCode === cleanSlug ? (
                  <Check className="w-4 h-4 text-emerald-300" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span>
                  {copiedCode === cleanSlug
                    ? 'Created & Copied!'
                    : 'Create & Copy Custom UTM Link'}
                </span>
              </button>
            </div>
          </div>

          {/* Section 2: Existing Links */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#0099e6]" />
                <span>Active UTM Links for this Event ({existingLinks.length})</span>
              </h4>
              {existingLinks.length > 0 && onViewInUtmSection && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewInUtmSection(event);
                  }}
                  className="text-[11px] font-bold text-[#0099e6] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Full UTM Section</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            {loadingLinks ? (
              <div className="py-8 text-center text-slate-400">
                <Loader2 className="w-5 h-5 text-[#0099e6] animate-spin mx-auto mb-2" />
                <p className="text-xs">Loading UTM links...</p>
              </div>
            ) : existingLinks.length === 0 ? (
              <div className="py-6 text-center bg-slate-50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/[0.08] rounded-2xl p-4">
                <Link2 className="w-6 h-6 text-slate-400 mx-auto mb-1.5 opacity-60" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  No custom UTM links yet
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Type a name above and assign a platform user to generate your first link!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {existingLinks.map((link) => {
                  const isCopied = copiedCode === link.code;
                  return (
                    <div
                      key={link.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-[#070b12] border border-slate-200/80 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-white/[0.15] transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* User Avatar */}
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {link.user?.avatar_url ? (
                            <Image
                              src={link.user.avatar_url}
                              alt={link.user.name || 'User'}
                              width={36}
                              height={36}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs font-black text-sky-600 dark:text-sky-400">
                              {(link.user?.name || link.customName || link.code || 'U')[0].toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-[#0099e6] dark:text-[#38bdf8] truncate">
                              /{link.code}
                            </span>
                            {link.user?.name && (
                              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                                • {link.user.name}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 truncate">
                            {link.user?.email || 'Unassigned direct link'}
                          </p>
                        </div>
                      </div>

                      {/* Stats & Actions */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          <MousePointerClick className="w-3 h-3 text-slate-400" />
                          <span>{link.clicksCount}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{link.confirmedRegistrationsCount} Regs</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopyLink(link.code)}
                          className={`p-1.5 rounded-xl border transition cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400'
                              : 'bg-white dark:bg-white/[0.04] border-slate-200 dark:border-white/[0.08] text-slate-600 dark:text-slate-300 hover:text-[#0099e6]'
                          }`}
                          title="Copy UTM Link"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteLink(link.id, link.code)}
                          disabled={deletingLinkId === link.id}
                          className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/30 bg-rose-50 dark:bg-rose-950/30 text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                          title="Delete link"
                        >
                          {deletingLinkId === link.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-[#080c14] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Sparkles className="w-4 h-4 text-[#0099e6]" />
            <span>Real-time clicks & confirmed registrations tracking</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {onViewInUtmSection && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewInUtmSection(event);
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.04] text-xs font-bold text-slate-700 dark:text-slate-200 transition cursor-pointer"
              >
                Go to UTM Section
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-xs font-bold text-slate-800 dark:text-slate-200 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
