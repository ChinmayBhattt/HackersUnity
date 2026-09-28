'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Play,
  Search,
  Sparkles,
  X,
  Clock,
  User,
  Headphones,
  ArrowDown,
  ArrowRight,
  Layers,
  Radio,
  Tv,
  CheckCircle2,
} from 'lucide-react';
import { FaSpotify, FaYoutube } from 'react-icons/fa6';
import { PODCAST_EPISODES, PodcastEpisode } from '@/lib/podcasts-data';

const STREAMING_PARTNERS = [
  {
    name: 'Spotify',
    badge: 'Official Channel',
    icon: FaSpotify,
    iconColor: 'text-[#1DB954]',
    color: 'border-emerald-500/20 dark:border-emerald-500/15',
  },
  {
    name: 'YouTube Podcasts',
    badge: 'Video & Audio Episodes',
    icon: FaYoutube,
    iconColor: 'text-[#FF0000]',
    color: 'border-red-500/20 dark:border-red-500/15',
  },
];

const CATEGORIES = [
  { id: 'ALL', label: 'ALL' },
  { id: 'STARTUP & BIG TECH', label: 'STARTUP & BIG TECH', filter: (ep: PodcastEpisode) => ep.category === 'big-tech' },
  { id: 'ENGINEERING & SCALE', label: 'ENGINEERING & SCALE', filter: (ep: PodcastEpisode) => ep.category === 'system-design' },
  { id: 'AI & INNOVATION', label: 'AI & INNOVATION', filter: (ep: PodcastEpisode) => ep.category === 'ai-cloud' },
  { id: 'CAREER & LEADERSHIP', label: 'CAREER & LEADERSHIP', filter: (ep: PodcastEpisode) => ep.category === 'leadership' },
  { id: 'PRODUCT & STRATEGY', label: 'PRODUCT & STRATEGY', filter: (ep: PodcastEpisode) => ep.category === 'product' },
];

function getCategoryBadge(ep: PodcastEpisode) {
  if (ep.category === 'big-tech') return 'STARTUP & BIG TECH';
  if (ep.category === 'ai-cloud') return 'AI & INNOVATION';
  if (ep.category === 'leadership') return 'CAREER & LEADERSHIP';
  if (ep.category === 'system-design') return 'ENGINEERING & SCALE';
  if (ep.category === 'product') return 'PRODUCT & STRATEGY';
  return 'TECH PODCAST';
}

export default function PodcastsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  // Featured episode for the hero card
  const featuredEpisode = PODCAST_EPISODES[0]; // Mihir Shelar - Amazon

  // Filtered episodes
  const filteredEpisodes = useMemo(() => {
    return PODCAST_EPISODES.filter((ep) => {
      let matchesCat = true;
      if (activeCategory !== 'ALL') {
        const catConfig = CATEGORIES.find((c) => c.id === activeCategory);
        if (catConfig && catConfig.filter) {
          matchesCat = catConfig.filter(ep);
        }
      }

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        ep.name.toLowerCase().includes(q) ||
        ep.title.toLowerCase().includes(q) ||
        ep.company.toLowerCase().includes(q) ||
        ep.designation.toLowerCase().includes(q) ||
        ep.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCat && matchesQuery;
    });
  }, [searchQuery, activeCategory]);

  const handleScrollToEpisodes = () => {
    const el = document.getElementById('episodes');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/70 dark:bg-[#05070d] text-slate-900 dark:text-slate-100 selection:bg-[#0099e6] selection:text-white relative overflow-hidden transition-colors duration-300">
      {/* ─── Hero Section (Matching PlayPod Reference) ───────────────── */}
      <div className="relative pt-10 pb-16 lg:pb-20 border-b border-slate-200/80 dark:border-slate-800/80 bg-gradient-to-b from-white/70 via-transparent to-transparent dark:from-[#0c1220] dark:via-[#070a13] dark:to-[#05070d] backdrop-blur-xs">
        {/* Background Ambient Glows, Waves & Watermark */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0099e6]/15 dark:bg-[#0099e6]/12 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-[#f97316]/10 dark:bg-[#f97316]/08 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 right-1/4 w-80 h-80 bg-[#0099e6]/10 dark:bg-[#0099e6]/08 rounded-full blur-3xl pointer-events-none" />

        {/* Decorative Sound Wave SVG in Background */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.035] dark:opacity-[0.06] pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1440 400"
          fill="none"
        >
          <path
            d="M0,160 C320,300 420,-40 720,160 C1020,360 1120,40 1440,180"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="6 6"
          />
          <path
            d="M0,220 C300,100 500,320 800,180 C1100,40 1300,280 1440,200"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>

        <div className="absolute -top-10 -left-10 select-none pointer-events-none text-[120px] sm:text-[180px] font-black tracking-tighter text-slate-900/[0.02] dark:text-white/[0.02] uppercase leading-none">
          PODCASTS
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* ─── Left Content Column ─────────────────────────────── */}
            <div className="lg:col-span-7 space-y-6">
              {/* Category Pill Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-white/[0.05] border border-slate-200/90 dark:border-white/10 text-xs font-mono font-bold text-[#0099e6] dark:text-[#38bdf8] backdrop-blur-xl shadow-xs">
                <span className="text-slate-400 dark:text-slate-500 font-normal">/</span>
                <span className="tracking-[0.25em] uppercase text-[11px]">T E C H &nbsp; P O D C A S T</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.12]">
                Podcasts that{' '}
                <span className="bg-gradient-to-r from-[#0099e6] via-sky-400 to-[#f97316] bg-clip-text text-transparent">
                  inspire to grow
                </span>
              </h1>

              {/* Description */}
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed font-normal">
                Real-world career journeys, engineering leadership, and insider secrets from senior tech leaders across <strong className="text-slate-900 dark:text-white">Amazon, Microsoft, Macy&apos;s, TCS, and IEEE</strong>.
              </p>

              {/* Action Buttons: Discover, Watch on Spotify, Watch on YouTube */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {/* Discover podcasts */}
                <button
                  type="button"
                  onClick={handleScrollToEpisodes}
                  className="px-5 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0088cc] text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-500/20 border border-sky-400/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <span>Discover podcasts</span>
                  <ArrowDown className="w-4 h-4" />
                </button>

                {/* Watch on Spotify */}
                <a
                  href="https://open.spotify.com/show/033xfxrsyIWADgql3syRnL"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-2xl bg-[#1DB954] hover:bg-[#1aa34a] text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-emerald-400/30"
                >
                  <FaSpotify className="w-4 h-4" />
                  <span>Watch on Spotify</span>
                </a>

                {/* Watch on YouTube */}
                <a
                  href="https://youtube.com/@hackerunity"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-2xl bg-[#ea3323] hover:bg-[#d92215] text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-red-400/30"
                >
                  <FaYoutube className="w-4 h-4" />
                  <span>Watch on YouTube</span>
                </a>
              </div>

              {/* Listener Social Proof & Highlights */}
              <div className="pt-4 border-t border-slate-200/80 dark:border-white/[0.08] flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-500 dark:text-slate-400">
                {/* Avatar stack */}
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-[#0c1220] overflow-hidden bg-slate-800 shadow-sm">
                      <Image src="/podcasts/mihirshelar.jpg" alt="Mihir Shelar" width={32} height={32} className="w-full h-full object-cover" />
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-[#0c1220] overflow-hidden bg-slate-800 shadow-sm">
                      <Image src="/podcasts/kirshna.jpg" alt="Krishna Kishor" width={32} height={32} className="w-full h-full object-cover" />
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-[#0c1220] overflow-hidden bg-slate-800 shadow-sm">
                      <Image src="/podcasts/ankur.jpg" alt="Ankur Bhatnagar" width={32} height={32} className="w-full h-full object-cover" />
                    </div>
                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-[#0c1220] overflow-hidden bg-[#0099e6] text-white text-[9px] font-black flex items-center justify-center shadow-sm">
                      50K+
                    </div>
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white text-xs">
                      +50K Worldwide Listeners
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Builders &amp; Engineers tuning in
                    </p>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-3 text-slate-400 dark:text-slate-500 text-[11px]">
                  <span>•</span>
                  <span>Diverse Topics</span>
                  <span>•</span>
                  <span>Amazon, Microsoft, TikTok</span>
                  <span>•</span>
                  <span>High Fidelity</span>
                </div>
              </div>
            </div>

            {/* ─── Right: PlayPod-Inspired Podcast Hero Visual Composition ─── */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-md rounded-[32px] p-5 sm:p-6 bg-slate-900/95 dark:bg-gradient-to-b dark:from-[#101728] dark:via-[#0b101c] dark:to-[#060812] border border-slate-700/60 dark:border-white/10 shadow-2xl shadow-sky-500/10 dark:shadow-black/90 backdrop-blur-2xl overflow-hidden group">
                {/* Background Ambient Glow inside card */}
                <div className="absolute -top-10 -right-10 w-44 h-44 bg-[#0099e6]/25 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-[#f97316]/20 rounded-full blur-3xl pointer-events-none" />

                {/* Top Artwork Card with Green / Cyan Glow */}
                <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-950 border border-emerald-500/30 shadow-lg shadow-emerald-950/40 mb-5">
                  <Image
                    src={featuredEpisode.image}
                    alt={featuredEpisode.title}
                    fill
                    sizes="400px"
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-700 filter brightness-[0.9] contrast-[1.08]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

                  {/* Top Header Tags inside Artwork */}
                  <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                    <span className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/10 text-emerald-300 font-mono font-extrabold text-[10px] tracking-wider uppercase">
                      EPISODE 01 • LIVE
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-[#0099e6]/90 backdrop-blur-md text-white font-extrabold text-[10px] tracking-wider uppercase">
                      {featuredEpisode.company}
                    </span>
                  </div>

                  {/* Play Button Overlay on Artwork */}
                  <a
                    href={featuredEpisode.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center shadow-xl shadow-red-950/60 hover:scale-115 active:scale-95 transition-all cursor-pointer backdrop-blur-xs"
                    title="Play on YouTube"
                  >
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </a>

                  {/* Bottom title bar on artwork */}
                  <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                    <p className="text-white font-black text-sm drop-shadow-md truncate">
                      {featuredEpisode.name}
                    </p>
                    <p className="text-slate-300 text-[11px] font-medium drop-shadow-xs truncate">
                      {featuredEpisode.designation} at {featuredEpisode.company}
                    </p>
                  </div>
                </div>

                {/* Floating Bottom Section: Mini Player (Left) & 3D Vinyl Record (Right) */}
                <div className="relative flex items-center justify-between gap-3 pt-1">
                  {/* Floating Mini Glass Audio Player Bar */}
                  <div className="flex-1 rounded-2xl p-3.5 bg-white/[0.06] border border-white/10 backdrop-blur-xl shadow-lg space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate">
                        <p className="text-[11px] font-extrabold text-white truncate">
                          Into The Tech Hyperscale
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {featuredEpisode.name} • {featuredEpisode.company}
                        </p>
                      </div>

                      {/* Equalizer Waveform Bars Animation */}
                      <div className="flex items-end gap-0.5 h-4 shrink-0 px-1">
                        <span className="w-0.5 h-2 bg-[#0099e6] rounded-full animate-[pulse_1s_ease-in-out_infinite]" />
                        <span className="w-0.5 h-4 bg-emerald-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite]" />
                        <span className="w-0.5 h-3 bg-[#f97316] rounded-full animate-[pulse_1.2s_ease-in-out_infinite]" />
                        <span className="w-0.5 h-4 bg-sky-400 rounded-full animate-[pulse_0.8s_ease-in-out_infinite]" />
                      </div>
                    </div>

                    {/* Progress Scrubber Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-1 bg-white/15 rounded-full overflow-hidden">
                        <div className="w-3/5 h-full bg-gradient-to-r from-[#0099e6] via-sky-400 to-[#f97316] rounded-full" />
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-slate-400">
                        <span>18:42</span>
                        <span>52:10</span>
                      </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex items-center justify-between pt-0.5 text-slate-300">
                      <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        STREAMING
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href="https://open.spotify.com/show/033xfxrsyIWADgql3syRnL"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-[#1DB954] transition-colors cursor-pointer"
                          title="Open Spotify Show"
                        >
                          <FaSpotify className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={featuredEpisode.youtubeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                          title="Open on YouTube"
                        >
                          <FaYoutube className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* 3D Vinyl Record / CD (Overlapping disk matching reference) */}
                  <div className="relative shrink-0 -mr-1">
                    <a
                      href="https://open.spotify.com/show/033xfxrsyIWADgql3syRnL"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group/vinyl relative block w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-[#0b0e14] via-[#1c2436] to-[#0b0e14] shadow-2xl border-2 border-slate-700/80 cursor-pointer overflow-hidden transition-transform duration-500 hover:scale-105 active:scale-95"
                      title="Listen on Spotify"
                    >
                      {/* Concentric Grooves */}
                      <div className="absolute inset-1.5 rounded-full border border-white/[0.08]" />
                      <div className="absolute inset-3.5 rounded-full border border-white/[0.06]" />
                      <div className="absolute inset-5 rounded-full border border-white/[0.08]" />
                      <div className="absolute inset-7 rounded-full border border-white/[0.06]" />

                      {/* Rotating Vinyl Texture */}
                      <div
                        className="absolute inset-0 rounded-full animate-[spin_16s_linear_infinite] group-hover/vinyl:[animation-play-state:paused]"
                        style={{
                          backgroundImage:
                            'conic-gradient(from 0deg, transparent 0deg, rgba(255,255,255,0.06) 60deg, transparent 120deg, rgba(255,255,255,0.08) 240deg, transparent 360deg)',
                        }}
                      />

                      {/* Center Hub / Label */}
                      <div className="absolute inset-0 m-auto w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-[#0099e6] to-[#f97316] p-0.5 shadow-inner flex items-center justify-center">
                        <div className="w-full h-full rounded-full bg-[#0a0f1c] flex items-center justify-center text-white">
                          <Play className="w-3.5 h-3.5 fill-white ml-0.5 group-hover/vinyl:scale-125 transition-transform" />
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Streaming Partners Strip (Centered) ─────────── */}
          <div className="mt-12 pt-8 border-t border-slate-200/80 dark:border-white/[0.08] flex flex-col items-center text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0099e6] animate-pulse" />
                <span className="text-[11px] font-mono uppercase tracking-widest text-slate-600 dark:text-slate-400 font-bold">
                  Official Streaming Partners &amp; Platforms
                </span>
              </div>
              <span className="hidden sm:inline text-slate-400 dark:text-slate-600">•</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Stream free across web, mobile &amp; smart speakers
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5 w-full max-w-2xl mx-auto">
              {STREAMING_PARTNERS.map((partner) => {
                const Icon = partner.icon;
                return (
                  <div
                    key={partner.name}
                    className={`flex items-center justify-center sm:justify-start gap-3.5 p-4 rounded-2xl bg-white/70 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] backdrop-blur-md shadow-xs select-none ${partner.color}`}
                  >
                    <div className={`p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] shrink-0 ${partner.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {partner.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {partner.badge}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── All Podcast Episodes Section ───────────────────────────── */}
      <div id="episodes" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 space-y-8">
        {/* Header & Search Bar Row (Exact reference layout) */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
          <div className="space-y-1.5 max-w-xl">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              All Podcast Episodes
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              Discover the stories, experiences, and insights behind the people creating impact in their fields.
            </p>
          </div>

          {/* Search Box on Right */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search episodes..."
              className="w-full pl-10 pr-9 py-2.5 rounded-full bg-white/80 dark:bg-white/[0.05] border border-slate-200/90 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:outline-none focus:border-[#0099e6] focus:ring-1 focus:ring-[#0099e6] transition-colors shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills (Exact reference pill styling) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer backdrop-blur-xl ${
                activeCategory === cat.id
                  ? 'bg-[#0099e6] text-white shadow-md shadow-sky-500/30 border border-sky-400/40'
                  : 'bg-white/60 dark:bg-white/[0.05] hover:bg-white dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/5 shadow-xs'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Zero Results State */}
        {filteredEpisodes.length === 0 && (
          <div className="py-20 text-center rounded-3xl bg-white/60 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.08] p-8 space-y-4 backdrop-blur-xl">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.06] flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No episodes found</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
              We couldn&apos;t find any episodes matching &quot;{searchQuery}&quot;. Try adjusting your search keywords.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('ALL');
              }}
              className="px-5 py-2 rounded-full bg-[#0099e6] hover:bg-[#0088cc] text-white text-xs font-bold cursor-pointer transition-colors shadow-md shadow-sky-500/20"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Episode Cards Grid (Matching Screenshots 2 & 3) */}
        {filteredEpisodes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredEpisodes.map((ep) => (
              <div
                key={ep.id}
                className="group rounded-3xl bg-white/70 dark:bg-[#0b101b] border border-slate-200/80 dark:border-white/[0.08] hover:border-[#0099e6]/60 shadow-lg shadow-slate-200/50 dark:shadow-xl dark:shadow-black/60 transition-all duration-300 flex flex-col overflow-hidden hover:-translate-y-1 backdrop-blur-xl"
              >
                {/* Card Thumbnail Area */}
                <div className="relative aspect-[4/3] w-full bg-slate-900 overflow-hidden">
                  <Image
                    src={ep.image}
                    alt={ep.name}
                    width={360}
                    height={270}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top-left category badge */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-slate-200 border border-white/10 text-[9px] font-extrabold uppercase tracking-wider">
                    {getCategoryBadge(ep)}
                  </span>

                  {/* Top-right play circle */}
                  <a
                    href={ep.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 text-white flex items-center justify-center transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                  </a>

                  {/* Duration overlay bottom-right */}
                  <span className="absolute bottom-2.5 right-3 text-[10px] font-mono font-bold text-slate-300 bg-black/60 px-2 py-0.5 rounded backdrop-blur-xs">
                    {ep.duration}
                  </span>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-[#0099e6] transition-colors">
                      {ep.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {ep.name} • {ep.designation} ({ep.company})
                    </p>
                  </div>

                  {/* Watch on YouTube Button */}
                  <a
                    href={ep.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-[#ea3323] hover:bg-[#d92215] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <FaYoutube className="w-4 h-4" />
                    <span>Watch on YouTube</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Counter */}
        <div className="pt-6 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
          Showing {filteredEpisodes.length} of {PODCAST_EPISODES.length} Episodes
        </div>

        {/* ─── Bottom Metallic Black / Glass Hacker's Unity CTA Banner ── */}
        <div className="pt-6">
          <div className="rounded-3xl p-8 sm:p-12 lg:p-14 bg-white/70 dark:bg-gradient-to-b dark:from-[#111827] dark:via-[#0b0f19] dark:to-[#06080f] border border-slate-200/90 dark:border-white/[0.1] shadow-xl shadow-slate-200/60 dark:shadow-2xl dark:shadow-black/80 text-center space-y-6 relative overflow-hidden group backdrop-blur-xl">
            {/* Top Cyan Glowing Line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#0099e6] to-transparent opacity-80" />

            {/* Ambient Glows */}
            <div className="absolute -left-16 -bottom-16 w-72 h-72 bg-[#0099e6]/12 dark:bg-[#0099e6]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -right-16 -top-16 w-72 h-72 bg-[#f97316]/10 dark:bg-[#f97316]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-500/5 dark:from-sky-900/15 via-transparent to-transparent pointer-events-none" />

            {/* Brand Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-[11px] font-bold text-slate-700 dark:text-slate-300 backdrop-blur-md relative z-10 shadow-xs">
              <span className="text-[#f97316] font-black tracking-wider">UNITE.</span>
              <span className="text-[#0099e6] font-black tracking-wider">CODE.</span>
              <span className="text-slate-900 dark:text-white font-black tracking-wider">CREATE.</span>
            </div>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white max-w-2xl mx-auto leading-tight relative z-10">
              Hacker&apos;s Unity brings together people who{' '}
              <span className="bg-gradient-to-r from-[#0099e6] via-sky-400 to-[#f97316] bg-clip-text text-transparent">
                educate, inspire and build.
              </span>
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed relative z-10">
              Catch the latest episodes, deep-dive interviews, and engineering insights directly on our official YouTube channel.
            </p>

            <div className="pt-2 relative z-10">
              <a
                href="https://youtube.com/@hackerunity"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-[#ea3323] hover:bg-[#d92215] text-white font-black text-xs sm:text-sm shadow-xl shadow-red-600/25 hover:scale-105 active:scale-95 transition-all border border-red-400/30 cursor-pointer"
              >
                <FaYoutube className="w-4 h-4" />
                <span>Watch on YouTube →</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
