'use client';

import Image from 'next/image';
import { ScrollExpandMedia } from '@/components/ui/scroll-expansion-hero';
import { 
  Rocket, 
  Award, 
  Users, 
  Gift, 
  ArrowRight, 
  ExternalLink 
} from 'lucide-react';

const benefits = [
  {
    icon: Rocket,
    title: 'Host Hackathons',
    desc: 'Platform sponsorship, judging scorecards & prize pool assistance.',
    color: 'bg-blue-950/40 border-blue-500/30 text-sky-400',
  },
  {
    icon: Users,
    title: 'Leader Mentorship',
    desc: 'Direct 1-on-1 AMAs with engineers & CTOs from Amazon & Microsoft.',
    color: 'bg-orange-950/40 border-orange-500/30 text-orange-400',
  },
  {
    icon: Gift,
    title: 'Swag & VIP Perks',
    desc: 'Ambassador hoodies, limited edition stickers & hackathon passes.',
    color: 'bg-purple-950/40 border-purple-500/30 text-purple-400',
  },
  {
    icon: Award,
    title: 'Official LOR & Cert',
    desc: 'Verifiable leadership credentials and LinkedIn endorsements.',
    color: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400',
  },
];

function AmbassadorContent() {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center px-3 sm:px-6 py-2 sm:py-5">
      {/* Animated Header Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 sm:py-1 rounded-full bg-slate-950/90 border border-sky-500/30 shadow-md backdrop-blur-sm mb-1.5 sm:mb-3">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff7800] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-r from-[#0099e6] to-[#ff7800]" />
        </span>
        <span className="text-[9px] sm:text-xs font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#0099e6] via-white to-[#ff7800]">
          Applications Open • Nationwide Chapters 2026
        </span>
      </div>

      {/* Core Headline with Hacker's Unity Metallic Chrome Text */}
      <h2 className="text-xl sm:text-3xl lg:text-5xl font-black tracking-tight leading-[1.15] mb-1 sm:mb-2">
        <span className="metal-text-silver">Become</span>{' '}
        <span className="metal-text-cyan">Campus</span>{' '}
        <span className="metal-text-orange">Ambassador</span>
      </h2>

      <p className="max-w-xl text-[11px] sm:text-sm text-slate-300 font-medium leading-snug mb-2.5 sm:mb-5 line-clamp-2 sm:line-clamp-none">
        Lead Hacker’s Unity at your college. Organize premier campus hackathons, inspire student builders, 
        and unlock exclusive industry mentorship, verified credentials & custom swag.
      </p>

      {/* 4 Feature Cards Grid (2x2 for mobile compactness) */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full text-left mb-2.5 sm:mb-5">
        {benefits.map((b, idx) => {
          const Icon = b.icon;
          return (
            <div
              key={idx}
              className={`relative p-2 sm:p-3.5 rounded-lg sm:rounded-xl border backdrop-blur-sm transition-transform ${b.color}`}
            >
              <div className="flex items-start gap-2 sm:gap-2.5">
                <div className="p-1 sm:p-1.5 rounded-md bg-white/10 border border-white/10 shrink-0 mt-0.5">
                  <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[10px] sm:text-xs font-bold text-white truncate">
                    {b.title}
                  </h3>
                  <p className="text-[9px] sm:text-[11px] text-slate-300 leading-tight line-clamp-2">
                    {b.desc}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg sm:rounded-xl bg-slate-950/80 border border-white/10 mb-2.5 sm:mb-5">
        <div className="text-center">
          <div className="text-xs sm:text-lg font-black text-sky-400">50+</div>
          <div className="text-[8px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Colleges</div>
        </div>
        <div className="text-center">
          <div className="text-xs sm:text-lg font-black text-orange-400">50k+</div>
          <div className="text-[8px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Builders</div>
        </div>
        <div className="text-center">
          <div className="text-xs sm:text-lg font-black text-emerald-400">₹50L+</div>
          <div className="text-[8px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Grants</div>
        </div>
        <div className="text-center">
          <div className="text-xs sm:text-lg font-black text-purple-400">100%</div>
          <div className="text-[8px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Free</div>
        </div>
      </div>

      {/* Action CTAs */}
      <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 w-full">
        <a
          href="https://tally.so/r/q4o22k"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-black text-[11px] sm:text-xs text-white bg-gradient-to-r from-[#0099e6] via-[#0284c7] to-[#ff7800] hover:from-[#38bdf8] hover:to-[#ffa040] shadow-lg shadow-sky-500/20 hover:shadow-orange-500/30 border border-white/20 transition-all active:scale-95 cursor-pointer"
        >
          <span>Apply for Campus Ambassador</span>
          <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </a>

        <a
          href="#join-team"
          className="inline-flex items-center justify-center gap-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-xs text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          <span>Core Roles</span>
          <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </a>
      </div>
    </div>
  );
}

export function CampusAmbassadorSection() {
  return (
    <section id="campus-ambassador" className="relative w-full bg-[#05070f]" aria-label="Campus Ambassador Program">
      {/* ─── Mobile View: Static, Zero-Lag, Directly Shows Final State ───────── */}
      <div className="block md:hidden relative w-full min-h-[100dvh] flex items-center justify-center py-10 px-3 overflow-hidden bg-[#05070f]">
        {/* Hackers background photo */}
        <div className="absolute inset-0 z-0 h-full w-full pointer-events-none">
          <Image
            src="https://res.cloudinary.com/p6qljeni/image/upload/v1793191145/hackers-unity/campus-ambassador/hackstorm-developers.jpg"
            alt="Campus Ambassador"
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          {/* Darkening overlay for readability */}
          <div className="absolute inset-0 bg-black/80 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05070f] via-transparent to-[#05070f]/90 pointer-events-none" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col items-center text-center">
          <AmbassadorContent />
        </div>
      </div>

      {/* ─── Desktop View: Interactive 3D Scroll Media Expansion Hero ──────── */}
      <div className="hidden md:block">
        <ScrollExpandMedia
          mediaType="image"
          mediaSrc="https://res.cloudinary.com/p6qljeni/image/upload/v1793191145/hackers-unity/campus-ambassador/hackstorm-developers.jpg"
          bgImageSrc="https://res.cloudinary.com/p6qljeni/image/upload/v1793191148/hackers-unity/campus-ambassador/bg-arena.jpg"
          title="CAMPUS AMBASSADOR"
          date="Lead Your College Chapter"
        >
          <AmbassadorContent />
        </ScrollExpandMedia>
      </div>
    </section>
  );
}

export default CampusAmbassadorSection;
