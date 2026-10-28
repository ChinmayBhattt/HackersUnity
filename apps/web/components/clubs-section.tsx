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

export interface CollegeLogoPartner {
  id: string;
  name: string;
  logo: string;
  alt: string;
  width: number;
  height: number;
}

const PARTNER_COLLEGES: CollegeLogoPartner[] = [
  {
    id: 'pcu',
    name: 'Pimpri Chinchwad University (PCU)',
    logo: 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189963/hackers-unity/clubs/pcet-college.webp',
    alt: 'Pimpri Chinchwad University Logo',
    width: 200,
    height: 80,
  },
  {
    id: 'subodh',
    name: 'S.S. Jain Subodh P.G. College',
    logo: 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189967/hackers-unity/clubs/subodh-college.jpg',
    alt: 'S.S. Jain Subodh P.G. College Logo',
    width: 100,
    height: 80,
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

        {/* ─── College Logos Showcase (Centered side-by-side) ─── */}
        <div className="w-full max-w-3xl mx-auto mb-10 sm:mb-12">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-8">
            {PARTNER_COLLEGES.map((college) => (
              <Link
                key={college.id}
                href="/clubs"
                className="group relative flex items-center justify-center h-20 sm:h-24 px-6 sm:px-8 rounded-2xl bg-white border border-slate-200/90 dark:border-white/20 shadow-md shadow-slate-100/80 dark:shadow-black/40 hover:shadow-xl hover:border-[#0099e6]/50 hover:-translate-y-0.5 transition-all duration-300"
                title={college.name}
              >
                <Image
                  src={college.logo}
                  alt={college.alt}
                  width={college.width}
                  height={college.height}
                  className="h-12 sm:h-16 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
                  priority
                />
              </Link>
            ))}
          </div>

          {/* Explore all clubs directory link */}
          <div className="flex items-center justify-center pt-1">
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
