'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  Building2,
  Rocket,
  Zap,
  HeartHandshake,
  Trophy,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export interface ClubChapter {
  id: string;
  name: string;
  collegeName: string;
  category: string;
  clubLogo: string;
  collegeLogo: string;
}

const CLUBS: ClubChapter[] = [
  {
    id: 'hu-pcu',
    name: "Hacker's Unity @ PCU",
    collegeName: 'Pimpri Chinchwad University',
    category: 'STUDENT CHAPTER',
    clubLogo: '/clubs/hu-pcu.png',
    collegeLogo: '/clubs/pcet-college.webp',
  },
];

export function ClubsSection() {
  return (
    <section
      id="clubs"
      className="relative py-14 sm:py-20 w-full overflow-hidden bg-gradient-to-b from-[#f8fafc] via-white to-[#f8fafc]/80 dark:from-[#05070c] dark:via-[#080b12] dark:to-[#05070c] border-t border-slate-100 dark:border-white/[0.08]"
      aria-label="Hacker's Unity Campus Clubs and Chapters"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-[#0099e6]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#ff7800]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-grid-pattern opacity-30 dark:opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-[#0099e6] dark:text-sky-400 text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
            <Building2 className="w-3.5 h-3.5 text-[#0099e6] dark:text-sky-400" />
            <span>Campus Chapters &amp; Clubs</span>
          </div>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Student-Led Innovation,{' '}
            <span className="text-gradient-brand">Campus by Campus</span>
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 mt-3 font-medium leading-relaxed max-w-2xl mx-auto">
            Official Hacker&apos;s Unity university chapters bringing national hackathons, builder incubators, and direct mentorship from industry leaders to college campuses.
          </p>
        </div>

        {/* ─── Clubs Showcase (Exact Clean Match to Screenshot) ─── */}
        <div className="w-full max-w-3xl mx-auto mb-10 sm:mb-12 space-y-4">
          {CLUBS.map((club) => (
            <div
              key={club.id}
              className="relative rounded-3xl p-5 sm:p-7 bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.1] shadow-lg shadow-slate-100/80 dark:shadow-black/50 hover:shadow-xl hover:border-[#0099e6]/40 transition-all duration-300 group overflow-hidden"
            >
              {/* Brand top accent line */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-[#0099e6] via-[#0284c7] to-[#ff7800] opacity-80" />

              <div className="flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6">
                {/* Left: Club Logo & Name */}
                <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 shadow-sm border border-slate-200/80 dark:border-white/20 shrink-0 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                    <Image
                      src={club.clubLogo}
                      alt={`${club.name} Logo`}
                      width={80}
                      height={80}
                      className="w-full h-full object-contain"
                      priority
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#0099e6] dark:text-sky-400">
                      {club.category}
                    </div>
                    <h3 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 dark:text-white leading-tight">
                      {club.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                      {club.collegeName}
                    </p>
                  </div>
                </div>

                {/* Center Divider: Vertical Line + CHAPTER AT pill (Desktop) */}
                <div className="hidden sm:flex flex-col items-center justify-center px-3 shrink-0">
                  <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-[#0c1017] px-3 py-1 rounded-full border border-slate-200 dark:border-white/10 shadow-2xs my-1 whitespace-nowrap">
                    CHAPTER AT
                  </span>
                  <div className="h-6 w-px bg-slate-200 dark:bg-white/10" />
                </div>

                {/* Mobile Divider */}
                <div className="flex sm:hidden items-center justify-center w-full gap-2 py-1">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-white/5 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-white/10 whitespace-nowrap">
                    CHAPTER AT
                  </span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
                </div>

                {/* Right: University Logo */}
                <div className="flex items-center justify-center shrink-0">
                  <div className="h-16 sm:h-20 px-4 py-2 rounded-2xl bg-white shadow-sm border border-slate-200/80 dark:border-white/20 shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Image
                      src={club.collegeLogo}
                      alt={`${club.collegeName} Logo`}
                      width={150}
                      height={75}
                      className="h-full w-auto object-contain"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Explore all clubs directory link */}
          <div className="flex items-center justify-center pt-2">
            <Link
              href="/clubs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-xs font-bold text-slate-800 dark:text-white transition-all border border-slate-200/80 dark:border-white/[0.08] shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Explore All Clubs &amp; Chapters Directory</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#0099e6]" />
            </Link>
          </div>
        </div>

        {/* ─── Hacker's Unity Signature Theme Card (Obsidian + Cyan Blue & Flame Orange) ─── */}
        <div className="relative rounded-3xl p-6 sm:p-9 lg:p-11 bg-gradient-to-br from-slate-950 via-[#070e1c] to-[#0d1b2a] text-white border border-slate-800 dark:border-white/10 shadow-2xl shadow-sky-950/40 overflow-hidden">
          {/* Hacker's Unity Dual Glow (Cyan Blue + Flame Orange) */}
          <div className="absolute -top-32 -left-20 w-96 h-96 bg-[#0099e6]/25 rounded-full blur-[110px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-20 w-96 h-96 bg-[#ff7800]/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />

          {/* Unique Background Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

          {/* Illuminated Cyber Perimeter Accent Lines */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#0099e6] to-[#ff7800] opacity-80" />
          <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#ff7800] to-transparent opacity-40" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 lg:gap-12">
            {/* Left Content Area */}
            <div className="max-w-2xl space-y-4">
              {/* Badge with Live Orange/Cyan Pulse */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-sky-500/30 shadow-md backdrop-blur-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff7800] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-r from-[#0099e6] to-[#ff7800]" />
                </span>
                <Rocket className="w-3.5 h-3.5 text-[#ff7800]" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-[#0099e6] via-white to-[#ff7800]">
                  Expand to Your University • 2026
                </span>
              </div>

              {/* Headline with Hacker's Unity Signature Gradient */}
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-[1.2]">
                Start an Official{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-[#0099e6] to-orange-400">
                  Hacker&apos;s Unity Club
                </span>{' '}
                on Your Campus
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                Are you a student leader or faculty coordinator? Partner with Hacker&apos;s Unity to establish an accredited student chapter with complete operational, sponsorship, and mentorship backing.
              </p>

              {/* 4 Core Perks in a Compact Grid with Hacker's Unity Cyan & Orange Accents */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-sky-400/40 backdrop-blur-md transition-all group">
                  <div className="p-1.5 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-400 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <Zap className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                      Full Hackathon OS Platform
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Free participant registration &amp; judging software.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-orange-400/40 backdrop-blur-md transition-all group">
                  <div className="p-1.5 rounded-xl bg-orange-500/15 border border-orange-400/30 text-orange-400 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <HeartHandshake className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors">
                      Industry Mentors &amp; Judges
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Sessions with engineers from Amazon &amp; Microsoft.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-sky-400/40 backdrop-blur-md transition-all group">
                  <div className="p-1.5 rounded-xl bg-sky-500/15 border border-sky-400/30 text-sky-400 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-sky-300 transition-colors">
                      Prize Pool &amp; Swag Support
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Event grants, sponsor intros &amp; custom merchandise.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] hover:border-orange-400/40 backdrop-blur-md transition-all group">
                  <div className="p-1.5 rounded-xl bg-orange-500/15 border border-orange-400/30 text-orange-400 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-orange-300 transition-colors">
                      Official Chapter Charter
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      Verifiable leadership certificates &amp; MoU affiliation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Action CTA Button (Hacker's Unity Cyan -> Orange) */}
            <div className="w-full lg:w-auto shrink-0 flex flex-col items-stretch lg:items-end justify-center gap-3">
              <Link
                href="/clubs#apply-form"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#0099e6] via-[#0284c7] to-[#ff7800] hover:from-[#38bdf8] hover:to-[#ffa040] text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-sky-500/20 hover:shadow-orange-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
              >
                <span>Apply to Launch a Club</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <div className="flex items-center justify-center lg:justify-end gap-1.5 text-[11px] text-slate-400">
                <Sparkles className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <span>
                  Free campus affiliation • Takes 2 mins to apply
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ClubsSection;
