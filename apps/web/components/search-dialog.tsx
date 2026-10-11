'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  X,
  Trophy,
  ArrowRight,
  Zap,
  Users,
  Rocket,
  Github,
  Linkedin,
  ExternalLink,
  GraduationCap,
  Sparkles,
  Flame,
} from 'lucide-react';
import Link from 'next/link';
import { usePublishedEvents } from '@/lib/hooks/use-events';
import { formatCurrency, filterDisplayTags } from '@/lib/utils';
import {
  searchProfilesRealtime,
  subscribeToProfilesRealtime,
  PublicProfileResult,
} from '@/lib/supabase-service';
import { ProfilePreviewModal } from './profile-preview-modal';

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'BUILDERS' | 'HACKATHONS'>('ALL');
  const { events } = usePublishedEvents();

  const [builders, setBuilders] = useState<PublicProfileResult[]>([]);
  const [loadingBuilders, setLoadingBuilders] = useState(false);
  const [selectedBuilder, setSelectedBuilder] = useState<PublicProfileResult | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset search dialog state on close
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setBuilders([]);
      setFilterType('ALL');
      setSelectedBuilder(null);
    }
  }, [isOpen]);

  // Live search builders (only when query has text)
  const fetchBuilders = useCallback((q: string) => {
    const clean = q.trim().replace(/^@/, '');
    if (!clean) {
      setBuilders([]);
      setLoadingBuilders(false);
      return;
    }
    setLoadingBuilders(true);
    searchProfilesRealtime(clean, 15)
      .then((res) => {
        setBuilders(res);
        setLoadingBuilders(false);
      })
      .catch(() => {
        setLoadingBuilders(false);
      });
  }, []);

  // Debounced search on query change
  useEffect(() => {
    if (!isOpen) return;

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    // If query starts with @, auto-focus to BUILDERS tab
    if (query.startsWith('@') && filterType === 'HACKATHONS') {
      setFilterType('BUILDERS');
    }

    const clean = query.trim().replace(/^@/, '');
    if (!clean) {
      setBuilders([]);
      setLoadingBuilders(false);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchBuilders(query);
    }, 200);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [isOpen, query, fetchBuilders, filterType]);

  // Realtime Supabase listener (only when query is active)
  useEffect(() => {
    const clean = query.trim().replace(/^@/, '');
    if (!isOpen || !clean) return;

    fetchBuilders(query);

    const unsub = subscribeToProfilesRealtime(() => {
      fetchBuilders(query);
    });

    return () => {
      unsub();
    };
  }, [isOpen, fetchBuilders, query]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (selectedBuilder) {
          setSelectedBuilder(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, selectedBuilder]);

  if (!isOpen) return null;

  // Filter hackathons
  const cleanQ = query.replace(/^@/, '').toLowerCase().trim();
  const filteredEvents = events.filter(
    (e) =>
      e.title.toLowerCase().includes(cleanQ) ||
      e.description.toLowerCase().includes(cleanQ) ||
      e.tags.some((t) => t.toLowerCase().includes(cleanQ))
  );

  // Realtime Trending Hackathons & Domains derived from live events
  const trendingHackathons = Array.from(
    new Set(events.filter((e) => e.title).map((e) => e.title))
  ).slice(0, 4);

  const trendingDomains = Array.from(
    new Set(
      events
        .flatMap((e) => e.tags || [])
        .filter((t) => t && t.length > 1 && !t.startsWith('@'))
    )
  ).slice(0, 6);

  const fallbackDomains = ['AI & ML', 'Autonomous Agents', 'Web3', 'Blockchain', 'Fullstack', 'DevOps'];
  const displayDomains = trendingDomains.length > 0 ? trendingDomains : fallbackDomains;

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-16 p-3 sm:p-4 bg-slate-900/60 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-150 cursor-pointer"
      >
        <div
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-2xl dark:shadow-black/95 cursor-default flex flex-col max-h-[85vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Header */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.03]">
            <Search className="w-5 h-5 text-[#0099e6] shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder="Search builders by @username, name, or hackathons..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none font-medium"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 dark:bg-white/[0.08] dark:hover:bg-white/[0.15] text-slate-600 dark:text-slate-400 cursor-pointer transition-colors"
              title="Press ESC or click to close"
            >
              ESC
            </button>
          </div>

          {/* Filter Pills (All / Builders / Hackathons) */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-100 dark:border-white/[0.06] bg-white dark:bg-[#0c1017]">
            <button
              type="button"
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:text-slate-400'
              }`}
            >
              All Results
            </button>

            <button
              type="button"
              onClick={() => setFilterType('BUILDERS')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'BUILDERS'
                  ? 'bg-[#0099e6] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:text-slate-400'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Builders & Hackers{cleanQ.length > 0 ? ` (${builders.length})` : ''}</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('HACKATHONS')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === 'HACKATHONS'
                  ? 'bg-[#ea580c] text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] dark:text-slate-400'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Hackathons ({filteredEvents.length})</span>
            </button>
          </div>

          {/* Results Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Realtime Trending Tags when no query */}
            {!cleanQ && (
              <div className="space-y-3.5">
                {/* Realtime Trending Hackathons */}
                {trendingHackathons.length > 0 && (
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-[#ea580c]" />
                      <span>Trending Hackathons</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {trendingHackathons.map((hackathon) => (
                        <button
                          key={hackathon}
                          onClick={() => {
                            setQuery(hackathon);
                            setFilterType('HACKATHONS');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-500/20 hover:border-amber-500/40 transition-colors cursor-pointer"
                        >
                          <Trophy className="w-3 h-3 text-amber-500" />
                          <span>{hackathon}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Realtime Popular Domains & Tracks */}
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#0099e6]" />
                    <span>Popular Domains & Tracks</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {displayDomains.map((domain) => (
                      <button
                        key={domain}
                        onClick={() => {
                          setQuery(domain);
                        }}
                        className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-sky-50 dark:hover:bg-sky-500/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-[#0099e6] border border-slate-200 dark:border-white/[0.08] hover:border-[#0099e6]/30 transition-colors cursor-pointer"
                      >
                        #{domain}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* BUILDERS & HACKERS RESULTS (Only shown when user actively searches for a person or clicks Builders tab) */}
            {filterType === 'BUILDERS' && !cleanQ && (
              <div className="text-center py-10 px-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-[#0099e6] flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                  Search Builders & Profiles
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Type a name or @username in the search box to find builders, hackers, and teammates.
                </p>
              </div>
            )}

            {((filterType === 'ALL' && cleanQ.length > 0 && (builders.length > 0 || loadingBuilders)) ||
              (filterType === 'BUILDERS' && cleanQ.length > 0)) && (
              <div>
                <div className="text-[11px] font-bold text-[#0099e6] uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Builders & Profiles ({builders.length})
                  </span>
                  {loadingBuilders && (
                    <span className="text-[10px] text-slate-400 animate-pulse">
                      Searching live Supabase...
                    </span>
                  )}
                </div>

                {builders.length === 0 ? (
                  !loadingBuilders && (
                    <p className="text-xs text-slate-400 py-2">
                      No builder found matching &quot;{query}&quot;. Try searching with @username or name.
                    </p>
                  )
                ) : (
                  <div className="space-y-2">
                    {builders.slice(0, 6).map((builder) => (
                      <div
                        key={builder.id}
                        onClick={() => setSelectedBuilder(builder)}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] hover:bg-sky-50/70 dark:hover:bg-sky-500/10 border border-slate-100 dark:border-white/[0.06] hover:border-[#0099e6]/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden shadow-xs">
                              {builder.avatarUrl && builder.avatarUrl.length > 4 ? (
                                <img
                                  src={builder.avatarUrl}
                                  alt={builder.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{(builder.name || 'H')[0]?.toUpperCase()}</span>
                              )}
                            </div>

                            {/* Info: Name on line 1, @username + college on line 2 (NO PARTICIPANT TAG) */}
                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#0099e6] transition-colors truncate">
                                {builder.name}
                              </h4>

                              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                {builder.username && (
                                  <span className="font-mono font-semibold text-[#0099e6]">
                                    @{builder.username}
                                  </span>
                                )}
                                {builder.college && (
                                  <>
                                    <span className="text-slate-300 dark:text-white/20">•</span>
                                    <span className="flex items-center gap-1 truncate text-slate-500 dark:text-slate-400">
                                      <GraduationCap className="w-3 h-3 shrink-0" />
                                      <span className="truncate">{builder.college}</span>
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Quick Badges & Social Links */}
                          <div className="flex items-center gap-2 shrink-0">
                            {builder.winningsCount > 0 && (
                              <span className="flex items-center gap-1 text-[11px] font-black px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                <Trophy className="w-3 h-3 fill-amber-500 text-amber-500" />
                                <span>{builder.winningsCount} {builder.winningsCount === 1 ? 'Win' : 'Wins'}</span>
                              </span>
                            )}

                            {builder.participationsCount > 0 && (
                              <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                                <Rocket className="w-3 h-3" />
                                <span>{builder.participationsCount}</span>
                              </span>
                            )}

                            {builder.socialLinks?.github && (
                              <a
                                href={
                                  builder.socialLinks.github.startsWith('http')
                                    ? builder.socialLinks.github
                                    : `https://github.com/${builder.socialLinks.github.replace(/^@/, '')}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
                                title="Open GitHub Profile"
                              >
                                <Github className="w-3.5 h-3.5" />
                              </a>
                            )}

                            {builder.socialLinks?.linkedin && (
                              <a
                                href={
                                  builder.socialLinks.linkedin.startsWith('http')
                                    ? builder.socialLinks.linkedin
                                    : `https://linkedin.com/in/${builder.socialLinks.linkedin.replace(/^@/, '')}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 rounded-lg text-[#0077b5] hover:bg-[#0077b5]/15 transition-colors"
                                title="Open LinkedIn Profile"
                              >
                                <Linkedin className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <span className="text-xs font-bold text-[#0099e6] flex items-center gap-0.5 ml-1 group-hover:translate-x-0.5 transition-transform">
                              View <ArrowRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>

                        {/* Skills summary tags */}
                        {builder.skills && builder.skills.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1 mt-2 pt-1.5 border-t border-slate-100 dark:border-white/[0.04]">
                            {builder.skills.slice(0, 4).map((sk) => (
                              <span
                                key={sk}
                                className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* HACKATHONS & EVENTS RESULTS */}
            {(filterType === 'ALL' || filterType === 'HACKATHONS') && (
              <div>
                <div className="text-[11px] font-bold text-[#ea580c] uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" />
                    {!cleanQ ? `Hackathons & Events (${filteredEvents.length})` : `Hackathons (${filteredEvents.length})`}
                  </span>
                  <Link
                    href="/hackathons"
                    onClick={onClose}
                    className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-[#0099e6] flex items-center gap-1 font-bold"
                  >
                    View all <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
                {filteredEvents.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">No hackathons matching &quot;{query}&quot;</p>
                ) : (
                  <div className="space-y-2">
                    {filteredEvents.slice(0, !cleanQ ? 8 : 5).map((event) => (
                      <Link
                        key={event.id}
                        href={`/hackathons/${event.slug}`}
                        onClick={onClose}
                        className="block p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] hover:bg-sky-50/70 dark:hover:bg-sky-500/10 border border-slate-100 dark:border-white/[0.06] hover:border-[#0099e6]/30 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#0099e6] transition-colors">
                            {event.title}
                          </h4>
                          <span className="text-xs font-black text-[#ea580c]">
                            {formatCurrency(event.totalPrizeValue)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 dark:text-slate-400">
                          <span>{event.organizerName}</span>
                          <span>•</span>
                          <span>{event.eventType}</span>
                          {(() => {
                            const cleanTags = filterDisplayTags(event.tags);
                            if (cleanTags.length === 0) return null;
                            return (
                              <>
                                <span>•</span>
                                <span className="text-[#0099e6] font-semibold">{cleanTags.slice(0, 3).join(', ')}</span>
                              </>
                            );
                          })()}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty state when searching in ALL and nothing found */}
            {filterType === 'ALL' &&
              cleanQ.length > 0 &&
              !loadingBuilders &&
              builders.length === 0 &&
              filteredEvents.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-400">
                    No hackathons or builders found matching &quot;{query}&quot;.
                  </p>
                </div>
              )}
          </div>

          {/* Footer Info */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#0099e6]" />
              Real-time Builder Search connected to Supabase
            </span>
            <span>Press ESC to close</span>
          </div>
        </div>
      </div>

      {/* Selected Builder Profile Preview Modal */}
      {selectedBuilder && (
        <ProfilePreviewModal
          isOpen={!!selectedBuilder}
          onClose={() => setSelectedBuilder(null)}
          onNavigateToFullProfile={onClose}
          initialProfile={selectedBuilder}
          username={selectedBuilder.username}
        />
      )}
    </>
  );
}
