'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  Rocket,
  Github,
  Linkedin,
  Globe,
  ExternalLink,
  Share2,
  Check,
  Building,
  GraduationCap,
  Sparkles,
  Calendar,
  Layers,
  Code2,
  ArrowLeft,
  Edit3,
  Award,
  ShieldCheck,
  Briefcase,
  Flame,
} from 'lucide-react';
import { FullPublicProfileData, getPublicUserProfileByUsername } from '@/lib/supabase-service';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency } from '@/lib/utils';
import { CertificateModal } from '@/components/certificate/CertificateModal';
import { calculateProfileCompletion } from '@/lib/profile-completion';

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const rawUsername = params?.username as string;
  const username = rawUsername ? decodeURIComponent(rawUsername).replace(/^@/, '') : '';

  const { user: currentUser } = useAuth();
  const [data, setData] = useState<FullPublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'winnings' | 'participations' | 'projects'>('winnings');
  const [showCertModal, setShowCertModal] = useState(false);

  useEffect(() => {
    if (!username) return;

    setLoading(true);
    setNotFound(false);

    getPublicUserProfileByUsername(username)
      .then((res) => {
        if (res && res.user) {
          setData(res);
          if (res.winnings.length === 0 && res.participations.length > 0) {
            setActiveTab('participations');
          }
        } else {
          setNotFound(true);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load profile:', err);
        setNotFound(true);
        setLoading(false);
      });
  }, [username]);

  const user = data?.user;
  const winnings = data?.winnings || [];
  const participations = data?.participations || [];
  const submissions = data?.submissions || [];

  const isOwnProfile =
    currentUser &&
    user &&
    (currentUser.id === user.id ||
      currentUser.username?.toLowerCase() === user.username?.toLowerCase() ||
      currentUser.email?.toLowerCase() === user.email?.toLowerCase());

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator?.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const formatExternalLink = (url?: string | null, prefix = '') => {
    if (!url) return null;
    const clean = url.trim();
    if (!clean) return null;
    if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
    if (prefix && !clean.includes('.')) return `https://${prefix}/${clean.replace(/^@/, '')}`;
    return `https://${clean}`;
  };

  const githubLink = formatExternalLink(user?.socialLinks?.github, 'github.com');
  const linkedinLink = formatExternalLink(user?.socialLinks?.linkedin, 'linkedin.com/in');
  const portfolioLink = formatExternalLink(user?.socialLinks?.portfolio);

  return (
    <div className="w-full pb-20 pt-4 sm:pt-6 font-sans">
      {loading ? (
          <div className="max-w-5xl mx-auto px-4 pt-32 pb-20 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full border-3 border-[#0099e6] border-t-transparent animate-spin mb-4" />
            <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300">
              Fetching builder profile...
            </h2>
            <p className="text-xs text-slate-400 mt-1">Connecting to Hacker&apos;s Unity database</p>
          </div>
        ) : notFound || !user ? (
          <div className="max-w-md mx-auto px-4 pt-36 pb-20 text-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-200/60 dark:bg-white/[0.05] border border-slate-300 dark:border-white/10 flex items-center justify-center mx-auto mb-4 text-2xl">
              🔍
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Builder Not Found
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
              We couldn&apos;t find any profile registered with username &quot;@{username}&quot;.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/hackathons"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0099e6] text-white font-bold text-xs hover:bg-[#0088cc] transition-colors"
              >
                Browse Hackathons
              </Link>
              <Link
                href="/"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/[0.08] dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors"
              >
                Go Home
              </Link>
            </div>
          </div>
        ) : (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
            {/* Top breadcrumb & back */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-[#0099e6] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] shadow-2xs transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Link Copied!' : 'Share Profile'}</span>
                </button>

                {isOwnProfile && (
                  <Link
                    href="/settings"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0099e6] hover:bg-[#0088cc] text-xs font-bold text-white shadow-md shadow-sky-500/20 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Profile Hero Card */}
            {(() => {
              const completion = calculateProfileCompletion(user);
              return (
                <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-[#0e131d] border border-slate-200/80 dark:border-white/[0.08] shadow-xl shadow-slate-200/50 dark:shadow-black/60">
                  {/* Banner */}
                  <div className="relative h-44 sm:h-56 w-full bg-gradient-to-r from-sky-600 via-indigo-600 to-cyan-500 overflow-hidden">
                    {user.bannerUrl ? (
                      <img
                        src={user.bannerUrl}
                        alt="Banner"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#fff_1.5px,transparent_1.5px)] [background-size:20px_20px]" />
                    )}
                  </div>

                  {/* Main Info */}
                  <div className="px-6 sm:px-8 pb-8 pt-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5 pt-4 sm:pt-6">
                      {/* Avatar with optional 100% Completion Border Ring */}
                      <div className="relative shrink-0 -mt-20 sm:-mt-24">
                        <div
                          className={`w-28 h-28 sm:w-36 sm:h-36 rounded-3xl shadow-2xl flex items-center justify-center ${
                            completion.isComplete
                              ? 'p-1.5 bg-gradient-to-tr from-[#0099e6] via-[#0a9ed9] to-[#f58220] shadow-[0_0_24px_rgba(245,130,32,0.35)]'
                              : 'border-4 border-white dark:border-[#0e131d]'
                          }`}
                        >
                          <div className="w-full h-full rounded-[20px] bg-gradient-to-br from-slate-800 to-slate-900 overflow-hidden flex items-center justify-center text-white text-4xl font-black">
                            {user.avatarUrl && user.avatarUrl.length > 4 ? (
                              <img
                                src={user.avatarUrl}
                                alt={user.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>{(user.name || 'H')[0]?.toUpperCase()}</span>
                            )}
                          </div>
                        </div>
                        {completion.isComplete ? (
                          <button
                            type="button"
                            onClick={() => setShowCertModal(true)}
                            className="absolute bottom-1 right-1 p-1.5 rounded-xl bg-gradient-to-tr from-[#0099e6] to-[#f58220] text-white shadow-lg border-2 border-white dark:border-[#0e131d] cursor-pointer hover:scale-110 transition-transform"
                            title="100% Profile Complete & Verified Certificate"
                          >
                            <Award className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="absolute bottom-1 right-1 p-1.5 rounded-xl bg-emerald-500 text-white shadow-md" title="Verified Builder">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* High-level stats pill row */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 shrink-0 sm:mt-2">
                        <div className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] text-center">
                          <div className="text-base sm:text-xl font-black text-amber-500 flex items-center justify-center gap-1">
                            <Trophy className="w-4 h-4 fill-amber-500" />
                            <span>{winnings.length}</span>
                          </div>
                          <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                            Winnings
                          </div>
                        </div>

                        <div className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] text-center">
                          <div className="text-base sm:text-xl font-black text-[#0099e6] flex items-center justify-center gap-1">
                            <Rocket className="w-4 h-4" />
                            <span>{participations.length}</span>
                          </div>
                          <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                            Hackathons
                          </div>
                        </div>

                        <div className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/[0.06] text-center">
                          <div className="text-base sm:text-xl font-black text-indigo-500 flex items-center justify-center gap-1">
                            <Code2 className="w-4 h-4" />
                            <span>{submissions.length}</span>
                          </div>
                          <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                            Projects
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Identity & Bio */}
                    <div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                          {user.name}
                        </h1>
                        <span className="text-sm font-mono font-bold text-[#0099e6] bg-sky-50 dark:bg-sky-500/10 px-2.5 py-0.5 rounded-lg border border-sky-200/70 dark:border-sky-500/20">
                          @{user.username || username}
                        </span>

                        {completion.isComplete && (
                          <button
                            type="button"
                            onClick={() => setShowCertModal(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/15 via-[#0099e6]/10 to-[#f58220]/15 hover:from-amber-500/25 hover:to-[#f58220]/25 border border-orange-500/30 text-[#f58220] text-xs font-black transition-all shadow-xs cursor-pointer"
                            title="View Verified Certificate of Completion"
                          >
                            <Award className="w-3.5 h-3.5 text-[#f58220]" />
                            <span>100% Profile Complete &bull; View Certificate</span>
                          </button>
                        )}
                      </div>

                  {/* University & Organization line */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    {user.college && (
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4 text-slate-400" />
                        <span>{user.college}</span>
                        {user.graduationYear && <span>({user.graduationYear})</span>}
                      </span>
                    )}

                    {user.organization && user.organization !== user.college && (
                      <span className="flex items-center gap-1.5">
                        <Building className="w-4 h-4 text-slate-400" />
                        <span>{user.organization}</span>
                      </span>
                    )}

                    {user.company && (
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-slate-400" />
                        <span>{user.jobTitle ? `${user.jobTitle} at ` : ''}{user.company}</span>
                      </span>
                    )}
                  </div>

                  {/* Bio statement */}
                  {user.bio ? (
                    <div
                      className="mt-3 text-sm sm:text-base text-slate-700 dark:text-slate-300 leading-relaxed max-w-3xl [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:my-1"
                      dangerouslySetInnerHTML={{ __html: user.bio }}
                    />
                  ) : (
                    <p className="mt-3 text-xs sm:text-sm text-slate-400 italic">
                      Active builder on Hacker&apos;s Unity competing across AI, Web3, and Fullstack challenges.
                    </p>
                  )}

                  {/* Social badges (LinkedIn, GitHub, Portfolio) */}
                  <div className="flex flex-wrap items-center gap-2.5 mt-5 pt-4 border-t border-slate-100 dark:border-white/[0.06]">
                    {linkedinLink ? (
                      <a
                        href={linkedinLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0077b5] text-white hover:bg-[#006097] text-xs font-bold shadow-md shadow-sky-900/10 transition-all"
                      >
                        <Linkedin className="w-4 h-4" />
                        <span>View LinkedIn</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] text-slate-400 text-xs font-medium border border-slate-200 dark:border-white/[0.05]">
                        <Linkedin className="w-3.5 h-3.5 opacity-40" />
                        <span>LinkedIn Not Linked</span>
                      </span>
                    )}

                    {githubLink ? (
                      <a
                        href={githubLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 text-xs font-bold shadow-md transition-all"
                      >
                        <Github className="w-4 h-4" />
                        <span>GitHub Repositories</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                    ) : (
                      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] text-slate-400 text-xs font-medium border border-slate-200 dark:border-white/[0.05]">
                        <Github className="w-3.5 h-3.5 opacity-40" />
                        <span>GitHub Not Linked</span>
                      </span>
                    )}

                    {portfolioLink && (
                      <a
                        href={portfolioLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-900/10 transition-all"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Portfolio Website</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                    )}
                  </div>

                  {/* Skills tags */}
                  {user.skills && user.skills.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                        Primary Tech Stack
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {user.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.08]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

            {/* Showcase Sections: Tabs */}
            <div className="mt-8">
              {/* Tab Selector */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-white/[0.08] pb-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('winnings')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 -mb-1 transition-all cursor-pointer ${
                    activeTab === 'winnings'
                      ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>Winnings & Awards ({winnings.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('participations')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 -mb-1 transition-all cursor-pointer ${
                    activeTab === 'participations'
                      ? 'border-[#0099e6] text-[#0099e6]'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Rocket className="w-4 h-4 text-[#0099e6]" />
                  <span>Hackathons ({participations.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('projects')}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 -mb-1 transition-all cursor-pointer ${
                    activeTab === 'projects'
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Code2 className="w-4 h-4 text-indigo-500" />
                  <span>All Submissions ({submissions.length})</span>
                </button>
              </div>

              {/* Tab Body */}
              <div className="mt-6">
                {activeTab === 'winnings' ? (
                  winnings.length === 0 ? (
                    <div className="py-16 text-center rounded-3xl bg-white dark:bg-[#0e131d] border border-slate-200/80 dark:border-white/[0.08] p-8 shadow-xs">
                      <Trophy className="w-12 h-12 text-amber-500/30 mx-auto mb-3" />
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                        No Podium Winnings Yet
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                        This builder is on their journey to claim podium placements. Check out their hackathon participations and projects below!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {winnings.map((win) => (
                        <div
                          key={win.id}
                          className="p-5 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 dark:from-amber-500/10 dark:via-[#0e131d] dark:to-transparent border border-amber-500/30 shadow-lg shadow-amber-500/5 hover:border-amber-500/50 transition-all"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/20">
                                  <Trophy className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                  PODIUM WINNER
                                </span>
                                {win.track && (
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300">
                                    {win.track}
                                  </span>
                                )}
                              </div>
                              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-2">
                                {win.projectTitle}
                              </h3>
                            </div>

                            {(win.totalPrizeValue ?? 0) > 0 && (
                              <div className="text-right shrink-0">
                                <span className="text-sm font-black text-amber-600 dark:text-amber-400">
                                  {formatCurrency(win.totalPrizeValue!)}
                                </span>
                              </div>
                            )}
                          </div>

                          {win.tagline && (
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2">
                              {win.tagline}
                            </p>
                          )}

                          {win.projectDescription && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                              {win.projectDescription}
                            </p>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-amber-500/20 text-xs">
                            <span className="text-slate-500 dark:text-slate-400">
                              Hackathon: <strong className="text-slate-800 dark:text-white">{win.eventTitle}</strong>
                            </span>

                            <div className="flex items-center gap-3">
                              {win.repoUrl && (
                                <a
                                  href={formatExternalLink(win.repoUrl) || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 font-bold text-[#0099e6] hover:underline"
                                >
                                  <Github className="w-3.5 h-3.5" /> Source
                                </a>
                              )}
                              {win.demoUrl && (
                                <a
                                  href={formatExternalLink(win.demoUrl) || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" /> Live Demo
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : activeTab === 'participations' ? (
                  participations.length === 0 ? (
                    <div className="py-16 text-center rounded-3xl bg-white dark:bg-[#0e131d] border border-slate-200/80 dark:border-white/[0.08] p-8 shadow-xs">
                      <Rocket className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                        No Hackathon Participations Recorded
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        This user hasn&apos;t joined any competitions on Hacker&apos;s Unity yet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {participations.map((part) => (
                        <div
                          key={part.registrationId}
                          className="p-5 rounded-3xl bg-white dark:bg-[#0e131d] border border-slate-200/80 dark:border-white/[0.08] hover:border-[#0099e6]/40 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-[#0099e6]/10 text-[#0099e6]">
                                {part.eventType} • {part.category}
                              </span>
                              <span className="text-[11px] font-bold text-slate-400">
                                {part.registeredAt ? new Date(part.registeredAt).toLocaleDateString() : ''}
                              </span>
                            </div>

                            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                              {part.eventTitle}
                            </h3>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                              <span>By {part.organizerName}</span>
                              {part.teamName && (
                                <>
                                  <span>•</span>
                                  <span className="text-[#0099e6] font-semibold">Team {part.teamName}</span>
                                </>
                              )}
                              <span>•</span>
                              <span>Role: {part.role}</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                            {part.totalPrizeValue > 0 ? (
                              <span className="text-xs font-black text-[#ea580c]">
                                {formatCurrency(part.totalPrizeValue)} Prize Pool
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">Community Challenge</span>
                            )}

                            <Link
                              href={`/hackathons/${part.eventSlug}`}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0099e6] hover:text-white dark:bg-white/[0.06] dark:hover:bg-[#0099e6] text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
                            >
                              View Hackathon →
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  submissions.length === 0 ? (
                    <div className="py-16 text-center rounded-3xl bg-white dark:bg-[#0e131d] border border-slate-200/80 dark:border-white/[0.08] p-8 shadow-xs">
                      <Code2 className="w-12 h-12 text-slate-400 mx-auto mb-3 opacity-40" />
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                        No Project Submissions
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Projects will appear here once submitted to a hackathon track.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {submissions.map((sub) => (
                        <div
                          key={sub.id}
                          className="p-5 rounded-3xl bg-white dark:bg-[#0e131d] border border-slate-200/80 dark:border-white/[0.08] flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300">
                                {sub.status}
                              </span>
                              {sub.track && (
                                <span className="text-xs font-medium text-slate-400">
                                  {sub.track}
                                </span>
                              )}
                            </div>

                            <h3 className="text-base font-bold text-slate-900 dark:text-white mt-2">
                              {sub.projectTitle}
                            </h3>

                            {sub.tagline && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                {sub.tagline}
                              </p>
                            )}

                            {sub.projectDescription && (
                              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 line-clamp-3 leading-relaxed">
                                {sub.projectDescription}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06] text-xs">
                            <span className="text-slate-400">
                              For: <strong className="text-slate-700 dark:text-slate-300">{sub.eventTitle}</strong>
                            </span>

                            <div className="flex items-center gap-3">
                              {sub.projectLink && (
                                <a
                                  href={formatExternalLink(sub.projectLink) || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 font-bold text-[#0099e6] hover:underline"
                                >
                                  <Github className="w-3.5 h-3.5" /> Repo
                                </a>
                              )}
                              {sub.demoVideoUrl && (
                                <a
                                  href={formatExternalLink(sub.demoVideoUrl) || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" /> Demo
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

      {/* Certificate of Completion Modal */}
      {data?.user && (
        <CertificateModal
          isOpen={showCertModal}
          onClose={() => setShowCertModal(false)}
          recipientName={data.user.name || 'Hacker'}
          completionDate={data.user.profileCompletedAt || new Date().toISOString()}
          certificateId={data.user.certificateId || `HU-${new Date().getFullYear()}-${data.user.id ? data.user.id.slice(-6).toUpperCase() : 'COMP'}`}
          username={data.user.username || username}
        />
      )}
    </div>
  );
}
