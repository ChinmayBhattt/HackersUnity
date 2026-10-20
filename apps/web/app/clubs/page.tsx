'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Building2,
  Sparkles,
  MapPin,
  Trophy,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Rocket,
  HeartHandshake,
  Search,
  Send,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface ClubItem {
  id: string;
  name: string;
  collegeName: string;
  category: string;
  clubLogo: string;
  collegeLogo: string;
  city: string;
  state: string;
  status: 'ACTIVE' | 'ONBOARDING';
  members: string;
  eventsCount: string;
  established: string;
}

const ALL_CLUBS: ClubItem[] = [
  {
    id: 'hu-pcu',
    name: "Hacker's Unity @ PCU",
    collegeName: 'Pimpri Chinchwad University',
    category: 'STUDENT CHAPTER',
    clubLogo: '/clubs/hu-pcu.png',
    collegeLogo: '/clubs/pcet-college.webp',
    city: 'Pune',
    state: 'Maharashtra',
    status: 'ACTIVE',
    members: '500+',
    eventsCount: '12+',
    established: '2024',
  },
];

export default function ClubsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [formState, setFormState] = useState({
    applicant_name: '',
    applicant_email: '',
    applicant_phone: '',
    college_name: '',
    college_city: '',
    college_state: 'Maharashtra',
    role_in_college: 'Student Leader',
    academic_year: '2nd Year',
    club_name: '',
    expected_members: '50-100',
    why_start_club: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ applicationId?: string; message: string } | null>(null);

  const filteredClubs = ALL_CLUBS.filter(
    (club) =>
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.collegeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/clubs/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application. Please try again.');
      }

      setSuccessData({
        applicationId: data.applicationId,
        message: data.message || 'Club application submitted successfully!',
      });

      setFormState({
        applicant_name: '',
        applicant_email: '',
        applicant_phone: '',
        college_name: '',
        college_city: '',
        college_state: 'Maharashtra',
        role_in_college: 'Student Leader',
        academic_year: '2nd Year',
        club_name: '',
        expected_members: '50-100',
        why_start_club: '',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#05070c] text-slate-900 dark:text-white transition-colors duration-200">
      {/* ─── Hero Banner ───────────────────────────────────────────── */}
      <section className="relative pt-12 pb-12 sm:pt-16 sm:pb-16 overflow-hidden border-b border-slate-200/80 dark:border-white/[0.08]">
        {/* Ambient lighting glows (Cyan Blue + Flame Orange) */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 w-96 h-96 bg-[#0099e6]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 translate-x-1/2 w-96 h-96 bg-[#ff7800]/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-grid-pattern opacity-30 dark:opacity-20 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 text-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-[#0099e6] dark:text-sky-400 text-xs font-bold uppercase tracking-wider mb-4 shadow-xs backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <Building2 className="w-3.5 h-3.5 text-[#0099e6] dark:text-sky-400" />
            <span>Campus Chapters &amp; Clubs Directory</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.12] mb-3">
            Student-Led Innovation,{' '}
            <span className="text-gradient-brand">Campus by Campus</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto mb-7">
            Explore official Hacker&apos;s Unity student developer clubs across universities in India, or form an official chapter at your campus.
          </p>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href="#apply-form"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#0099e6] via-[#0284c7] to-[#ff7800] hover:from-[#38bdf8] hover:to-[#ffa040] text-white font-black text-xs sm:text-sm shadow-lg shadow-sky-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Rocket className="w-4 h-4" />
              <span>Form a Club at Your College</span>
              <ArrowRight className="w-4 h-4" />
            </a>

            <a
              href="#directory"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.1] text-slate-800 dark:text-white text-xs sm:text-sm font-bold border border-slate-200 dark:border-white/[0.08] shadow-xs transition-colors"
            >
              <span>Browse Campus Clubs</span>
            </a>
          </div>

          {/* Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mt-8 pt-6 border-t border-slate-200/80 dark:border-white/[0.08]">
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] text-center shadow-xs">
              <div className="text-xl sm:text-2xl font-black text-[#0099e6]">50+</div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Campus Hubs
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] text-center shadow-xs">
              <div className="text-xl sm:text-2xl font-black text-[#ff7800]">50,000+</div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Student Hackers
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] text-center shadow-xs">
              <div className="text-xl sm:text-2xl font-black text-sky-500">₹50L+</div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Grants &amp; Swag
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.08] text-center shadow-xs">
              <div className="text-xl sm:text-2xl font-black text-emerald-500">100%</div>
              <div className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Free Platform
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Clubs Directory Section ─────────────────────────────────── */}
      <section id="directory" className="py-12 md:py-16 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#0099e6] mb-1">
              <Sparkles className="w-3.5 h-3.5 text-[#0099e6]" />
              <span>Verified Chapters</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Active College Chapters
            </h2>
          </div>

          {/* Search Filter Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by college or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#0099e6] shadow-xs"
            />
          </div>
        </div>

        {/* Clubs Cards Grid */}
        <div className="w-full space-y-4 mb-14">
          {filteredClubs.length > 0 ? (
            filteredClubs.map((club) => (
              <div
                key={club.id}
                className="relative rounded-3xl p-5 sm:p-7 bg-white dark:bg-[#0c1017] border border-slate-200/90 dark:border-white/[0.1] shadow-lg shadow-slate-100/80 dark:shadow-black/50 hover:shadow-xl hover:border-[#0099e6]/40 transition-all duration-300 group overflow-hidden"
              >
                {/* Brand top accent */}
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
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#0099e6] dark:text-sky-400">
                          {club.category}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Active</span>
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 dark:text-white leading-tight mt-0.5">
                        {club.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        <MapPin className="w-3 h-3 text-[#ff7800]" />
                        <span>
                          {club.collegeName} • {club.city}, {club.state}
                        </span>
                      </div>
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
            ))
          ) : (
            <div className="text-center py-12 px-4 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10">
              <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                No club matches your search &quot;{searchQuery}&quot;
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Be the first to launch an official Hacker&apos;s Unity Club at your campus!
              </p>
              <a
                href="#apply-form"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0099e6] mt-4 hover:underline"
              >
                <span>Apply to start a chapter</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {/* ─── Why Launch a Hacker's Unity Club? ─────────────────────── */}
        <div className="mb-14">
          <div className="text-center max-w-xl mx-auto mb-8">
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Why Launch a Hacker&apos;s Unity Club on Campus?
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Transform your college tech community with comprehensive backing, software, and industry connections.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200/80 dark:border-white/[0.08] shadow-xs hover:border-[#0099e6]/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-[#0099e6] flex items-center justify-center mb-3">
                <Zap className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                Full Hackathon OS
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Free enterprise software for attendee management, judging rubrics, team matching, and live project submissions.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200/80 dark:border-white/[0.08] shadow-xs hover:border-orange-400/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-[#ff7800] flex items-center justify-center mb-3">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                Industry Mentors &amp; Judges
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Direct speaker sessions, project reviews, and AMAs with engineers &amp; architects from Amazon, Microsoft &amp; top startups.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200/80 dark:border-white/[0.08] shadow-xs hover:border-sky-400/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-[#0099e6] flex items-center justify-center mb-3">
                <Trophy className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                Grants &amp; Swag Boxes
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Prize pool sponsorships, company connections, official club banner kits, stickers, and custom winner trophies.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200/80 dark:border-white/[0.08] shadow-xs hover:border-orange-400/40 transition-all">
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-[#ff7800] flex items-center justify-center mb-3">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1.5">
                Official Charter &amp; Certs
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Accredited institution MoU, verifiable leadership certificates for student council leads, and LinkedIn badges.
              </p>
            </div>
          </div>
        </div>

        {/* ─── Form Your Hacker's Unity Club Form Section (Supabase Connected) ─── */}
        <div id="apply-form" className="relative rounded-3xl p-6 sm:p-10 lg:p-12 bg-gradient-to-br from-slate-950 via-[#070e1c] to-[#0d1b2a] text-white border border-slate-800 dark:border-white/10 shadow-2xl shadow-sky-950/40 overflow-hidden scroll-mt-24">
          {/* Ambient Lighting Orbs (Hacker's Unity Cyan + Orange) */}
          <div className="absolute -top-32 -left-20 w-96 h-96 bg-[#0099e6]/25 rounded-full blur-[110px] pointer-events-none" />
          <div className="absolute -bottom-32 -right-20 w-96 h-96 bg-[#ff7800]/20 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#0099e6] to-[#ff7800] opacity-80" />

          <div className="relative z-10 max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-sky-500/30 text-sky-400 text-[11px] font-black uppercase tracking-wider mb-3 backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff7800] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-gradient-to-r from-[#0099e6] to-[#ff7800]" />
                </span>
                <Rocket className="w-3.5 h-3.5 text-[#ff7800]" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0099e6] via-white to-[#ff7800]">
                  Official Chapter Application • 2026
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug">
                Form Your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-[#0099e6] to-orange-400">
                  Hacker&apos;s Unity Club
                </span>{' '}
                at Your College
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 mt-2 font-normal leading-relaxed max-w-xl mx-auto">
                Fill out the application below. Our community team reviews every submission to help you launch an accredited student chapter with complete platform &amp; mentor access.
              </p>
            </div>

            {/* Success Confirmation Screen */}
            {successData ? (
              <div className="p-8 sm:p-10 rounded-2xl bg-white/[0.05] border border-emerald-400/30 text-center space-y-4 backdrop-blur-md animate-in fade-in duration-300">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-xl sm:text-2xl font-black text-white">
                  Application Submitted Successfully!
                </h4>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                  {successData.message}
                </p>
                {successData.applicationId && (
                  <div className="inline-block px-3 py-1 rounded-lg bg-black/40 border border-white/10 text-xs font-mono text-sky-300">
                    Application Reference ID: {successData.applicationId}
                  </div>
                )}
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => setSuccessData(null)}
                    className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition-colors"
                  >
                    Submit Another Application
                  </button>
                </div>
              </div>
            ) : (
              /* Application Form */
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {errorMsg && (
                  <div className="flex items-center gap-2 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Name & Email Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      Your Full Name <span className="text-[#ff7800]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Raj Kumar"
                      value={formState.applicant_name}
                      onChange={(e) => setFormState({ ...formState, applicant_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0099e6] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      Official / Student Email <span className="text-[#ff7800]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="student@college.edu or your email"
                      value={formState.applicant_email}
                      onChange={(e) => setFormState({ ...formState, applicant_email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0099e6] transition-colors"
                    />
                  </div>
                </div>

                {/* Phone & College Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      WhatsApp / Contact Number <span className="text-[#ff7800]">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 78567 33610"
                      value={formState.applicant_phone}
                      onChange={(e) => setFormState({ ...formState, applicant_phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0099e6] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      College / University Name <span className="text-[#ff7800]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pimpri Chinchwad University (PCU)"
                      value={formState.college_name}
                      onChange={(e) => setFormState({ ...formState, college_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0099e6] transition-colors"
                    />
                  </div>
                </div>

                {/* City, State & Role */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      College City <span className="text-[#ff7800]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Pune"
                      value={formState.college_city}
                      onChange={(e) => setFormState({ ...formState, college_city: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0099e6] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      Your Role at College <span className="text-[#ff7800]">*</span>
                    </label>
                    <select
                      value={formState.role_in_college}
                      onChange={(e) => setFormState({ ...formState, role_in_college: e.target.value })}
                      className="w-full px-3 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-xs sm:text-sm text-white focus:outline-none focus:border-[#0099e6] transition-colors"
                    >
                      <option value="Student Leader">Student Leader</option>
                      <option value="Tech Club President">Tech Club President / Lead</option>
                      <option value="Campus Ambassador">Campus Ambassador</option>
                      <option value="Faculty Coordinator">Faculty Coordinator</option>
                      <option value="Department Head / HOD">Department Head / HOD</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      Academic Year
                    </label>
                    <select
                      value={formState.academic_year}
                      onChange={(e) => setFormState({ ...formState, academic_year: e.target.value })}
                      className="w-full px-3 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-xs sm:text-sm text-white focus:outline-none focus:border-[#0099e6] transition-colors"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                      <option value="Postgraduate">Postgraduate</option>
                      <option value="Faculty">Faculty / Professor</option>
                    </select>
                  </div>
                </div>

                {/* Proposed Club Name & Expected Members */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      Proposed Club Name
                    </label>
                    <input
                      type="text"
                      placeholder={`e.g. Hacker's Unity @ ${formState.college_name || 'My College'}`}
                      value={formState.club_name}
                      onChange={(e) => setFormState({ ...formState, club_name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0099e6] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-200 mb-1.5">
                      Estimated Initial Community Size
                    </label>
                    <select
                      value={formState.expected_members}
                      onChange={(e) => setFormState({ ...formState, expected_members: e.target.value })}
                      className="w-full px-3 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-xs sm:text-sm text-white focus:outline-none focus:border-[#0099e6] transition-colors"
                    >
                      <option value="25-50 Members">25 - 50 Students</option>
                      <option value="50-100 Members">50 - 100 Students</option>
                      <option value="100-250 Members">100 - 250 Students</option>
                      <option value="250-500 Members">250 - 500 Students</option>
                      <option value="500+ Members">500+ Students</option>
                    </select>
                  </div>
                </div>

                {/* Why start a club / Vision */}
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-1.5">
                    Why do you want to start a Hacker&apos;s Unity Club? <span className="text-[#ff7800]">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Tell us about the developer culture at your college, upcoming events you plan to host, or how Hacker's Unity can help your campus thrive..."
                    value={formState.why_start_club}
                    onChange={(e) => setFormState({ ...formState, why_start_club: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0099e6] transition-colors resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#0099e6] via-[#0284c7] to-[#ff7800] hover:from-[#38bdf8] hover:to-[#ffa040] text-white font-black text-sm shadow-xl shadow-sky-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Application to Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Club Application</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-2 text-center text-[11px] text-slate-400 mt-3">
                    <Sparkles className="w-3.5 h-3.5 text-[#ff7800] shrink-0" />
                    <span>
                      100% Free Campus Partnership • All submissions saved directly in Supabase
                    </span>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
