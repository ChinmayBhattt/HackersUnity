'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Briefcase,
  Building2,
  User,
  Mail,
  Phone,
  Linkedin,
  FileText,
  Sparkles,
  Send,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { findMentorByCredential, VerifiedMentor } from '@/lib/mentors-data';
import { useAuth } from '@/lib/auth-context';

export function MentorPortalClient() {
  const { user } = useAuth();

  // Verification lookup state
  const [query, setQuery] = useState('');
  const [searched, setSearched] = useState(false);
  const [foundMentor, setFoundMentor] = useState<VerifiedMentor | null>(null);

  // Application form state
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    designation: '',
    email: '',
    phone: '',
    linkedin_url: '',
    resume_url: '',
    notes: '',
  });

  // Automatically prefill applicant details if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
        linkedin_url: prev.linkedin_url || user.socialLinks?.linkedin || '',
        company: prev.company || user.company || user.organization || '',
        designation: prev.designation || user.jobTitle || '',
      }));
    }
  }, [user]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    const result = findMentorByCredential(query.trim());
    setFoundMentor(result);
    setSearched(true);
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/mentor-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application.');
      }

      setSubmitSuccess(true);
      setFormData({
        name: '',
        company: '',
        designation: '',
        email: '',
        phone: '',
        linkedin_url: '',
        resume_url: '',
        notes: '',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#05070c] text-slate-900 dark:text-[#f8fafc] relative overflow-hidden pb-24">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-sky-100/60 dark:from-sky-950/20 via-slate-100/30 dark:via-transparent to-transparent pointer-events-none -z-10" />
      <div className="absolute -top-32 right-1/4 w-96 h-96 bg-[#0099e6]/10 dark:bg-[#0099e6]/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute top-80 left-10 w-80 h-80 bg-[#f97316]/8 dark:bg-[#f97316]/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-12 sm:pt-16 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] dark:text-[#38bdf8] border border-sky-200 dark:border-sky-800/40">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Hacker&apos;s Unity Official Verification Network
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Mentor Credential Verification
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            Verify the authenticity of an official Hacker&apos;s Unity mentor, hackathon jury member, or technical evaluator using their unique Credential ID.
          </p>
        </div>

        {/* 1. Credential Verification Card */}
        <div className="bg-white dark:bg-[#0c1017] rounded-3xl border border-slate-200/90 dark:border-white/[0.08] shadow-xl shadow-slate-900/5 p-6 sm:p-10 relative overflow-hidden">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-1.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                <Search className="w-5 h-5 text-[#0099e6] dark:text-[#38bdf8]" />
                Check Mentor Credential
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Enter the Credential ID or Profile identifier provided by the mentor
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-3">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (searched) setSearched(false);
                  }}
                  placeholder="e.g. HU-MTR-XXXX-XXX or enter Credential ID"
                  className="w-full pl-4 pr-32 py-3.5 rounded-2xl border border-slate-300 dark:border-white/[0.1] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:ring-2 focus:ring-[#0099e6]/20 bg-slate-50/50 dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm font-medium transition-all outline-hidden"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0099e6] to-[#0284c7] hover:opacity-95 text-white text-xs sm:text-sm font-semibold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Verify</span>
                </button>
              </div>

            </form>

            {/* SEARCH RESULT DISPLAY */}
            {searched && foundMentor && (
              <div className="mt-6 p-6 rounded-2xl bg-gradient-to-br from-white dark:from-[#0c1017] via-sky-50/30 dark:via-sky-950/20 to-emerald-50/30 dark:to-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden p-1 bg-gradient-to-tr from-[#0099e6] to-emerald-500 shadow-md shrink-0">
                    <div className="relative w-full h-full rounded-[12px] overflow-hidden bg-slate-100 dark:bg-slate-800">
                      <Image
                        src={foundMentor.avatarUrl}
                        alt={foundMentor.name}
                        fill
                        className="object-cover object-top"
                      />
                    </div>
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" />
                        Officially Verified & Active
                      </span>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                        ID: {foundMentor.verificationId}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {foundMentor.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-medium">
                        {foundMentor.currentRole} @ {foundMentor.company}
                      </p>
                    </div>

                    <div className="pt-2">
                      <Link
                        href={`/mentor/${foundMentor.slug}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs sm:text-sm font-semibold transition-colors shadow-xs"
                      >
                        <span>View Full Verified Profile</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NOT FOUND NOTIFICATION */}
            {searched && !foundMentor && (
              <div className="mt-6 p-5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-slate-800 dark:text-amber-200 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">
                      No Verified Profile Found
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-300/80 leading-relaxed">
                      We could not find any active mentor associated with <strong>&quot;{query}&quot;</strong>. If you are an industry professional or technology leader, you can apply below to join our verified mentor network.
                    </p>
                  </div>
                </div>
                <div className="pl-8">
                  <a
                    href="#apply-form"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 hover:underline"
                  >
                    <span>Jump to Application Form</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. Apply as a Mentor Form Section */}
        <div id="apply-form" className="bg-white dark:bg-[#0c1017] rounded-3xl border border-slate-200/90 dark:border-white/[0.08] shadow-xl shadow-slate-900/5 p-6 sm:p-10 relative overflow-hidden scroll-mt-24">
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-orange-50 dark:bg-orange-950/40 text-[#f97316] dark:text-[#fb923c] border border-orange-200 dark:border-orange-800/40">
                <Sparkles className="w-3.5 h-3.5" />
                Join Hacker&apos;s Unity Mentor Network
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                Apply to Become a Verified Mentor
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                Connect with passionate developers, evaluate hackathon innovations as a jury member, and receive an official verified mentor credential.
              </p>
            </div>

            {submitSuccess ? (
              <div className="p-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-center space-y-4 animate-in zoom-in-95 duration-300">
                <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-300">
                    Application Submitted Successfully!
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-400/80 max-w-md mx-auto leading-relaxed">
                    Thank you for applying. The Hacker&apos;s Unity council will review your profile, verify your credentials, and get in touch with you shortly.
                  </p>
                </div>
                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Submit Another Application
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-5">
                {submitError && (
                  <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#0099e6] dark:text-[#38bdf8]" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:ring-2 focus:ring-[#0099e6]/20 bg-slate-50/50 dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm outline-hidden"
                    />
                  </div>

                  {/* Company */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#0099e6] dark:text-[#38bdf8]" />
                      Company / Organization *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Acme Tech Solutions / Freelance"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:ring-2 focus:ring-[#0099e6]/20 bg-slate-50/50 dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm outline-hidden"
                    />
                  </div>

                  {/* Role / Designation */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#0099e6] dark:text-[#38bdf8]" />
                      Role / Designation *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Software Engineer / Tech Lead"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:ring-2 focus:ring-[#0099e6]/20 bg-slate-50/50 dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm outline-hidden"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#0099e6] dark:text-[#38bdf8]" />
                      Work / Personal Email *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. mentor@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:ring-2 focus:ring-[#0099e6]/20 bg-slate-50/50 dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm outline-hidden"
                    />
                  </div>

                  {/* Contact Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#0099e6] dark:text-[#38bdf8]" />
                      Contact Number / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:ring-2 focus:ring-[#0099e6]/20 bg-slate-50/50 dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm outline-hidden"
                    />
                  </div>

                  {/* LinkedIn / Portfolio */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Linkedin className="w-3.5 h-3.5 text-[#0099e6] dark:text-[#38bdf8]" />
                      LinkedIn Profile / Portfolio *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://linkedin.com/in/username"
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:ring-2 focus:ring-[#0099e6]/20 bg-slate-50/50 dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm outline-hidden"
                    />
                  </div>
                </div>

                {/* Resume (Optional) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#0099e6] dark:text-[#38bdf8]" />
                      Resume / CV Link (Optional)
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">Google Drive, Notion, or Dropbox URL</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://drive.google.com/file/..."
                    value={formData.resume_url}
                    onChange={(e) => setFormData({ ...formData, resume_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:ring-2 focus:ring-[#0099e6]/20 bg-slate-50/50 dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm outline-hidden"
                  />
                </div>

                {/* Additional Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Domains of Expertise & Past Mentorship / Hackathon Experience (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us briefly about your technical background, preferred hackathon domains, and any past jury or mentoring roles..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-white/[0.1] focus:border-[#0099e6] dark:focus:border-[#38bdf8] focus:ring-2 focus:ring-[#0099e6]/20 bg-slate-50/50 dark:bg-white/[0.04] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs sm:text-sm outline-hidden resize-none"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#0099e6] via-[#0284c7] to-[#f97316] text-white font-bold text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Application to Supabase...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Mentor Application</span>
                      </>
                    )}
                  </button>
                  <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                    Your details will be securely reviewed by the Hacker&apos;s Unity leadership team.
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
