'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  CheckCircle2,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@hackers-unity/shared-types';
import {
  validatePassword,
  PASSWORD_STRENGTH_LABELS,
  PASSWORD_STRENGTH_COLORS,
} from '@/lib/password-validation';
import { CountryCodeSelector } from '@/components/country-code-selector';
import { formatAndValidatePhone } from '@/lib/phone-utils';

function SignupForm({ initialMode }: { initialMode?: 'login' | 'register' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    user: currentUser,
    loading: authLoading,
    signInWithEmail,
    signUpWithEmail,
    signInWithOAuth,
  } = useAuth();

  const modeFromQuery = searchParams.get('mode');
  const [mode, setMode] = useState<'login' | 'register'>(
    initialMode || (modeFromQuery === 'login' ? 'login' : 'register')
  );

  const rawRedirect = searchParams.get('redirectTo') || searchParams.get('redirect');
  const safeRedirect =
    rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/dashboard';

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phonePlaceholder, setPhonePlaceholder] = useState('95561 47082');

  // Status State
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && currentUser) {
      router.push(safeRedirect);
    }
  }, [currentUser, authLoading, router, safeRedirect]);

  // Handle Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setErrorMessage(validation.errors[0]);
      return;
    }

    const role = UserRole.PARTICIPANT;
    let fullPhone: string | undefined = undefined;
    if (phone.trim()) {
      const phoneValidation = formatAndValidatePhone(phone, countryCode);
      if (!phoneValidation.isValid) {
        setErrorMessage(phoneValidation.error || 'Please enter a valid mobile number');
        return;
      }
      fullPhone = phoneValidation.formattedPhone;
    }

    setSubmitting(true);
    try {
      const res = await signUpWithEmail(email, password, name, fullPhone, role);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        if (res.needsEmailConfirmation) {
          setSuccessMessage(res.message || 'Check your inbox to verify your email.');
        } else {
          router.push(safeRedirect);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setSubmitting(true);

    try {
      const res = await signInWithEmail(email, password);
      if (res.error) {
        setErrorMessage(res.error);
      } else {
        router.push(safeRedirect);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#05070c] flex items-center justify-center p-3 sm:p-6 lg:p-10">
      <div className="w-full max-w-6xl bg-white dark:bg-[#0c1017] rounded-[32px] shadow-2xl border border-slate-200/80 dark:border-white/[0.08] overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[720px]">
        {/* ─── Left Column: Dark Branded Hero Card ─────────────────── */}
        <div className="lg:col-span-5 m-3 sm:m-4 rounded-[28px] bg-gradient-to-br from-[#080d1e] via-[#0d142b] to-[#050814] text-white p-7 sm:p-10 flex flex-col justify-between relative overflow-hidden border border-slate-800/80">
          {/* Ambient Lighting Gradients */}
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#0099e6]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#f97316]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Top Header */}
          <div className="relative z-10 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center overflow-hidden p-1 shadow-sm group-hover:border-[#0099e6]/60 transition-colors">
                <Image
                  src="https://res.cloudinary.com/p6qljeni/image/upload/v1793189609/hackers-unity/branding/logo-main.png"
                  alt="Hacker's Unity"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-base font-black text-white tracking-tight">
                Hacker&apos;s Unity
              </span>
            </Link>

            {/* Mode Switcher Pill */}
            <div className="flex items-center p-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`px-3 py-1.5 rounded-full transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-slate-950 shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Join Us
              </button>
            </div>
          </div>

          {/* Middle Value Proposition */}
          <div className="relative z-10 py-10 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-[#0099e6] text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-[#0099e6]" />
              <span>India&apos;s Premier Hackathon Platform</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-[1.15]">
              Your Growth Starts Here.
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              Build production-grade projects, discover high-stakes hackathons, find elite teammates, and win venture-backed prize pools with Hacker&apos;s Unity.
            </p>

            {/* Features list with checkmarks */}
            <ul className="space-y-3 pt-2">
              {[
                'Discover premier AI, Web3, and Fullstack hackathons',
                'Match with world-class teammates & build squads',
                'Compete for $350K+ in escrow-backed prize pools',
                'Explore hands-on workshops, mentorship & summits',
                'Get scouted by venture funds & top tech employers',
              ].map((feat, idx) => (
                <li key={idx} className="flex items-start gap-3 text-xs sm:text-[13px] text-slate-200 font-medium leading-snug">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom Stats Row */}
          <div className="relative z-10 pt-6 border-t border-white/10 grid grid-cols-3 gap-4">
            <div>
              <div className="text-xl sm:text-2xl font-black text-white tracking-tight">50K+</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-semibold mt-0.5 leading-tight">
                Builders & Hackers
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-[#ea580c] tracking-tight">120+</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-semibold mt-0.5 leading-tight">
                Hackathons & Events
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">$350K+</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-semibold mt-0.5 leading-tight">
                Prizes Distributed
              </div>
            </div>
          </div>
        </div>

        {/* ─── Right Column: Clean Form ───────────────────────────── */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-14 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-6">
            {/* Form Header */}
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                {mode === 'register' ? 'Hi there,' : 'Welcome back,'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {mode === 'register'
                  ? "Welcome to Hacker's Unity — it's free, always."
                  : "Sign in to access your hackathons, teams & dashboard."}
              </p>
            </div>

            {/* Error / Success Feedback */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Standard Email Auth Flow */}
            <div className="space-y-5">
                {/* Form Inputs */}
                <form onSubmit={mode === 'register' ? handleSignUp : handleSignIn} className="space-y-3.5">
                  {mode === 'register' && (
                    <div className="space-y-1">
                      <input
                        required
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:bg-white dark:focus:bg-white/[0.06] text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
                      />
                    </div>
                  )}

                  <div className="space-y-1">
                    <input
                      required
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:bg-white dark:focus:bg-white/[0.06] text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
                    />
                  </div>

                  <div className="relative">
                    <input
                      required
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:bg-white dark:focus:bg-white/[0.06] text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {mode === 'login' && (
                    <div className="flex justify-end -mt-1 pb-1">
                      <Link
                        href="/forgot-password"
                        className="text-[11px] font-semibold text-[#0099e6] dark:text-[#38bdf8] hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                  )}

                  {mode === 'register' && password && (() => {
                    const strengthRes = validatePassword(password);
                    return (
                      <div className="space-y-1.5 px-1 py-0.5">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-slate-500 dark:text-slate-400">Password Strength:</span>
                          <span style={{ color: PASSWORD_STRENGTH_COLORS[strengthRes.strength] }}>
                            {PASSWORD_STRENGTH_LABELS[strengthRes.strength]}
                          </span>
                        </div>
                        <div className="flex gap-1 h-1.5 w-full bg-slate-100 dark:bg-white/[0.08] rounded-full overflow-hidden">
                          {[0, 1, 2, 3].map((step) => (
                            <div
                              key={step}
                              className="flex-1 rounded-full transition-all duration-300"
                              style={{
                                backgroundColor:
                                  step < strengthRes.strength
                                    ? PASSWORD_STRENGTH_COLORS[strengthRes.strength]
                                    : 'rgba(255,255,255,0.1)',
                              }}
                            />
                          ))}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                          Requires 8+ characters, uppercase, lowercase, and a number.
                        </p>
                      </div>
                    );
                  })()}

                  {mode === 'register' && (
                    <div className="relative">
                      <input
                        required
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-4 pr-10 py-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:bg-white dark:focus:bg-white/[0.06] text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  )}

                  {mode === 'register' && (
                    <div className="flex gap-2 items-center">
                      <CountryCodeSelector
                        value={countryCode}
                        onChange={(selected) => {
                          setCountryCode(selected.code);
                          if (selected.placeholder) {
                            setPhonePlaceholder(selected.placeholder);
                          }
                        }}
                      />
                      <input
                        type="tel"
                        placeholder={phonePlaceholder ? `e.g. ${phonePlaceholder}` : "Mobile Number"}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:bg-white dark:focus:bg-white/[0.06] text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
                      />
                    </div>
                  )}

                  {/* Primary Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full mt-2 py-3.5 rounded-2xl bg-[#eb3e45] hover:bg-[#d93037] text-white font-extrabold text-sm shadow-md shadow-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : mode === 'register' ? (
                      'Create Account'
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                {/* Social Sign Up / Sign In Options */}
                <div className="space-y-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() =>
                      signInWithOAuth(
                        'google',
                        safeRedirect !== '/dashboard' ? safeRedirect : undefined
                      )
                    }
                    className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.2] hover:bg-slate-50 dark:hover:bg-white/[0.04] text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-3 transition-all cursor-pointer shadow-2xs"
                  >
                    {/* Google G SVG */}
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.02 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>{mode === 'register' ? 'Sign up with Google' : 'Sign in with Google'}</span>
                  </button>
                </div>

                {/* Footer Switcher */}
                <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {mode === 'register' ? (
                    <p>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setErrorMessage(null);
                        }}
                        className="font-bold text-slate-900 dark:text-white hover:underline cursor-pointer"
                      >
                        Sign in
                      </button>
                    </p>
                  ) : (
                    <p>
                      Don&apos;t have an account yet?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('register');
                          setErrorMessage(null);
                        }}
                        className="font-bold text-slate-900 dark:text-white hover:underline cursor-pointer"
                      >
                        Create Account
                      </button>
                    </p>
                  )}
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage({ initialMode }: { initialMode?: 'login' | 'register' }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#05070c]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0099e6]" />
        </div>
      }
    >
      <SignupForm initialMode={initialMode} />
    </Suspense>
  );
}
