'use client';

import Image from 'next/image';
import { ArrowRight, Sparkles, Users, Rocket, Award, HeartHandshake, ExternalLink } from 'lucide-react';

export function JoinTeamSection() {
  const perks = [
    {
      icon: Rocket,
      title: 'National Impact',
      desc: 'Lead track initiatives, mega hackathons & reach 50,000+ builders across colleges & tech hubs.',
    },
    {
      icon: HeartHandshake,
      title: 'Elite Network',
      desc: 'Collaborate with top engineers, CTOs & leaders from Amazon, Microsoft, and high-growth startups.',
    },
    {
      icon: Award,
      title: 'Growth & Recognition',
      desc: 'Official leadership roles, letters of recommendation, speaker slots, and custom swag.',
    },
  ];

  const roles = [
    'Tech & Engineering',
    'Community & Campus Leads',
    'Events & Hackathon Ops',
    'Design, Video & Media',
    'Partnerships & Outreach',
  ];

  return (
    <section className="pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full" id="join-team">
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-gradient-to-br from-slate-950 via-[#070e1c] to-[#0d1b2a] text-white shadow-2xl p-6 sm:p-10 lg:p-12">
        {/* Ambient background glows matching Hacker's Unity brand */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#0099e6]/25 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#f97316]/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          {/* Left Column: Details & CTA */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6">
            {/* Live Hiring Badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.08] border border-white/15 text-sky-300 text-xs font-bold tracking-wide uppercase shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span>We&apos;re Expanding • Core Team Recruitment</span>
            </div>

            {/* Main Headline */}
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.12]">
                Join Hacker&apos;s Unity{' '}
                <span className="bg-gradient-to-r from-sky-400 via-[#0099e6] to-orange-400 bg-clip-text text-transparent">
                  Team
                </span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-medium max-w-2xl">
                Be the driving force behind India&apos;s most active builder community. Help us organize premier hackathons, launch cutting-edge developer platforms, and empower thousands of ambitious developers nationwide.
              </p>
            </div>

            {/* Open Roles Pill Badges */}
            <div className="space-y-2 w-full">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Open Opportunities Across:
              </span>
              <div className="flex flex-wrap gap-2 pt-1">
                {roles.map((role) => (
                  <span
                    key={role}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-slate-200 transition-colors"
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>

            {/* Perks Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full pt-1">
              {perks.map((perk) => {
                const Icon = perk.icon;
                return (
                  <div
                    key={perk.title}
                    className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] hover:border-sky-500/30 transition-all group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-400/20 flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform">
                      <Icon className="w-4 h-4 text-sky-400" />
                    </div>
                    <h3 className="text-xs font-bold text-white mb-1">{perk.title}</h3>
                    <p className="text-[11px] text-slate-400 leading-snug">{perk.desc}</p>
                  </div>
                );
              })}
            </div>

            {/* CTA Button & Meta Info */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full">
              <a
                href="https://tally.so/r/q4o22k"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-[#0099e6] via-[#0284c7] to-[#f97316] text-white font-extrabold text-sm shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 group cursor-pointer"
              >
                <span>Apply to Join Our Team</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Takes ~2 mins to apply • Rolling applications</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Photo Card */}
          <div className="lg:col-span-5 w-full">
            <div className="relative rounded-2xl p-2 bg-gradient-to-b from-white/20 via-white/10 to-transparent backdrop-blur-md shadow-2xl group/img">
              {/* Floating Header Tag */}
              <div className="absolute top-5 left-5 z-20 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-white/20 backdrop-blur-md text-xs font-semibold text-white flex items-center gap-2 shadow-lg">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>Hacker&apos;s Unity Crew</span>
              </div>

              {/* External Apply badge on top right */}
              <a
                href="https://tally.so/r/q4o22k"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-5 right-5 z-20 px-2.5 py-1.5 rounded-xl bg-orange-500/90 hover:bg-orange-500 border border-orange-300/40 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5 shadow-lg transition-transform hover:scale-105"
                title="Open Application Form"
              >
                <span>Apply</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {/* Framed Image */}
              <div className="relative overflow-hidden rounded-xl aspect-[4/3] sm:aspect-[16/11] bg-slate-900">
                <Image
                  src="https://res.cloudinary.com/p6qljeni/image/upload/v1793189663/hackers-unity/team/HuTeam-optimized.jpg"
                  alt="Hacker's Unity Core Team and Community Builders"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 40vw"
                  className="object-cover object-center group-hover/img:scale-105 transition-transform duration-700 ease-out"
                  priority={false}
                />

                {/* Subtle vignette / gradient overlay at bottom for clarity */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />

                {/* Bottom caption */}
                <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-white">
                      Built by Builders, for Builders
                    </p>
                    <p className="text-[11px] text-slate-300 font-medium">
                      Join a family of passionate change-makers
                    </p>
                  </div>
                  <span className="self-start sm:self-auto px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-sky-200 border border-white/20 backdrop-blur-md">
                    #HackersUnity
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
