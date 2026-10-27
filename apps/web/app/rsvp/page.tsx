'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Users,
  User,
  Mail,
  Phone,
  Sparkles,
  Calendar,
  MapPin,
  Utensils,
  Shirt,
  Cpu,
  HelpCircle,
  AlertCircle,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Check,
  Clock,
  ExternalLink,
  MessageSquare,
  QrCode,
  PartyPopper,
  Lock,
  Loader2,
} from 'lucide-react';
import { updateRegistrationRsvp } from '@/lib/storage';

function RsvpContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlEventId = searchParams.get('eventId') || searchParams.get('slug') || '';
  const urlEventTitle = searchParams.get('eventTitle') || '';
  const urlEmail = searchParams.get('email') || '';
  const urlName = searchParams.get('name') || '';
  const urlTeam = searchParams.get('team') || '';
  const urlCollege = searchParams.get('college') || '';
  const urlPhone = searchParams.get('phone') || '';

  // Form states
  const [eventId, setEventId] = useState(urlEventId || 'ee511926-1089-4171-9090-684e6d179826');
  const [eventTitle, setEventTitle] = useState(urlEventTitle || "SPHINX '26");
  const [eventLocation, setEventLocation] = useState('Main Auditorium & Builder Labs, Campus');
  const [eventDates, setEventDates] = useState('Upcoming Hackathon');
  const [eventSlug, setEventSlug] = useState('');

  const [teamName, setTeamName] = useState(urlTeam || '');
  const [personName, setPersonName] = useState(urlName || '');
  const [email, setEmail] = useState(urlEmail || '');
  const [phone, setPhone] = useState(urlPhone);

  // Primary decision: 'yes' (Attending) | 'no' (Declined) | null
  const [attending, setAttending] = useState<'yes' | 'no' | null>('yes');

  // Additional fields for Attending
  const [attendanceCount, setAttendanceCount] = useState<number>(4);
  const [dietaryPreference, setDietaryPreference] = useState<string>('Veg');
  const [tshirtSize, setTshirtSize] = useState<string>('L');
  const [hardwareRequirement, setHardwareRequirement] = useState<string>('None');
  const [customHardwareText, setCustomHardwareText] = useState<string>('');
  const [remarks, setRemarks] = useState<string>('');

  // Fields for Declining
  const [declineReason, setDeclineReason] = useState<string>('College / Exam clash');
  const [otherReasonText, setOtherReasonText] = useState<string>('');

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingInfo, setFetchingInfo] = useState<boolean>(true);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [priorRsvp, setPriorRsvp] = useState<any | null>(null);

  // Invitation access status: 'CHECKING' | 'INVITED' | 'UNDER_REVIEW' | 'NOT_FOUND' | 'NO_EMAIL'
  const [inviteStatus, setInviteStatus] = useState<'CHECKING' | 'INVITED' | 'UNDER_REVIEW' | 'NOT_FOUND' | 'NO_EMAIL'>('CHECKING');
  const [lookupEmail, setLookupEmail] = useState<string>(urlEmail || '');
  const [checkingLookup, setCheckingLookup] = useState<boolean>(false);

  // Fetch event and prior registration details from API
  const loadEventData = async (targetEmail?: string) => {
    if (!eventId) {
      setFetchingInfo(false);
      return;
    }

    const queryEmail = (targetEmail !== undefined ? targetEmail : (email || urlEmail)).trim().toLowerCase();

    if (!queryEmail) {
      setInviteStatus('NO_EMAIL');
      setFetchingInfo(false);
      return;
    }

    setFetchingInfo(true);
    setErrorMessage(null);
    try {
      const queryParams = new URLSearchParams();
      if (eventId) queryParams.set('eventId', eventId);
      queryParams.set('email', queryEmail);

      const res = await fetch(`/api/rsvp?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.event) {
            setEventTitle(data.event.title || eventTitle);
            setEventSlug(data.event.slug || '');
            if (data.event.location) setEventLocation(data.event.location);
            if (data.event.startDate) {
              const start = new Date(data.event.startDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
              setEventDates(start);
            }
          }

          if (data.registration) {
            const reg = data.registration;
            setEmail(queryEmail);
            if (!teamName && reg.teamName) setTeamName(reg.teamName);
            if (!personName && reg.userName) setPersonName(reg.userName);
            if (!phone && reg.phone) setPhone(reg.phone);
            if (reg.tshirtSize) setTshirtSize(reg.tshirtSize);
            if (reg.dietaryPreference) setDietaryPreference(reg.dietaryPreference);

            if (reg.rsvpStatus) {
              setPriorRsvp(reg);
              setAttending(reg.rsvpStatus === 'ATTENDING' ? 'yes' : 'no');
            }

            if (reg.isInvited) {
              setInviteStatus('INVITED');
            } else {
              setInviteStatus('UNDER_REVIEW');
            }
          } else {
            setInviteStatus('NOT_FOUND');
          }
        }
      }
    } catch (err) {
      console.warn('Could not fetch RSVP info:', err);
    } finally {
      setFetchingInfo(false);
    }
  };

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupEmail.trim() || !lookupEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    setCheckingLookup(true);
    await loadEventData(lookupEmail.trim().toLowerCase());
    setCheckingLookup(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!teamName.trim()) {
      setErrorMessage('Please enter your Team Name');
      return;
    }
    if (!personName.trim()) {
      setErrorMessage('Please enter your Full Name');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid Email Address');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Please enter your WhatsApp / Contact Number (Mandatory for entry & check-in)');
      return;
    }
    const phoneDigits = phone.trim().replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      setErrorMessage('Please enter a valid 10-digit WhatsApp / Contact Number');
      return;
    }
    if (attending === null) {
      setErrorMessage('Please confirm whether you will be attending or not.');
      return;
    }

    setLoading(true);

    const isAttendingBool = attending === 'yes';
    const finalHardware =
      hardwareRequirement === 'Other' ? customHardwareText || 'Custom Hardware' : hardwareRequirement;
    const finalDeclineReason =
      declineReason === 'Other' ? otherReasonText || 'Other reasons' : declineReason;

    const payload = {
      eventId,
      eventTitle,
      teamName: teamName.trim(),
      personName: personName.trim(),
      email: email.trim().toLowerCase(),
      attending: isAttendingBool,
      attendanceCount: isAttendingBool ? attendanceCount : 0,
      dietaryPreference: isAttendingBool ? dietaryPreference : undefined,
      tshirtSize: isAttendingBool ? tshirtSize : undefined,
      phone: phone.trim(),
      hardwareRequirement: isAttendingBool ? finalHardware : undefined,
      remarks: remarks.trim() || undefined,
      declineReason: !isAttendingBool ? finalDeclineReason : undefined,
      origin: window.location.origin,
    };

    try {
      // 1. Submit to API endpoint
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok && data.error) {
        throw new Error(data.error);
      }

      // 2. Also sync local client storage if active
      updateRegistrationRsvp(eventId, email, {
        attending: isAttendingBool,
        teamName: teamName.trim(),
        personName: personName.trim(),
        email: email.trim().toLowerCase(),
        attendanceCount: isAttendingBool ? attendanceCount : 0,
        dietaryPreference: isAttendingBool ? dietaryPreference : undefined,
        tshirtSize: isAttendingBool ? tshirtSize : undefined,
        phone: phone.trim(),
        hardwareRequirement: isAttendingBool ? finalHardware : undefined,
        remarks: remarks.trim() || undefined,
        declineReason: !isAttendingBool ? finalDeclineReason : undefined,
      });

      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit RSVP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col justify-between relative selection:bg-[#0099e6] selection:text-white">
      {/* Background ambient gradient glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[400px] bg-sky-500/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -right-40 w-[420px] h-[360px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 -left-40 w-[420px] h-[360px] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Top minimal navigation header */}
      <header className="relative z-10 border-b border-white/[0.06] bg-[#0c1222]/80 backdrop-blur-md px-4 py-3.5 sm:px-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-[#0099e6] flex items-center justify-center font-black text-white text-base shadow-[0_0_15px_rgba(0,153,230,0.5)] group-hover:scale-105 transition-transform">
              HU
            </div>
            <div>
              <span className="font-extrabold text-sm text-white tracking-tight">Hacker&apos;s Unity</span>
              <span className="block text-[10px] text-slate-400 font-medium">Participant RSVP Portal</span>
            </div>
          </Link>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-[#38bdf8] border border-sky-500/20">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Check-in
          </span>
        </div>
      </header>

      {/* Main Form Container */}
      <main className="relative z-10 flex-1 max-w-2xl w-full mx-auto px-4 py-8 sm:py-12">
        <AnimatePresence mode="wait">
          {submitted ? (
            /* ─── SUCCESS / CONFIRMATION STATE ─────────────────────── */
            <motion.div
              key="submitted-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="p-8 sm:p-10 rounded-3xl bg-[#0f172a]/90 border border-white/[0.1] shadow-2xl backdrop-blur-xl text-center relative overflow-hidden">
                {/* Glowing accent border */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    attending === 'yes'
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-[#0099e6]'
                      : 'bg-gradient-to-r from-rose-500 to-amber-500'
                  }`}
                />

                <div className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center mb-6 shadow-xl relative">
                  {attending === 'yes' ? (
                    <div className="w-full h-full rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <PartyPopper className="w-10 h-10 animate-bounce" />
                    </div>
                  ) : (
                    <div className="w-full h-full rounded-3xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                      <Check className="w-10 h-10" />
                    </div>
                  )}
                </div>

                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
                    attending === 'yes'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {attending === 'yes' ? 'RSVP Confirmed • Spot Locked' : 'RSVP Response Recorded'}
                </span>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {attending === 'yes'
                    ? `We can't wait to see team "${teamName}"!`
                    : `Thank you for letting us know, ${personName}.`}
                </h1>

                <p className="text-sm text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
                  {attending === 'yes'
                    ? `Your physical attendance for ${eventTitle} is locked in. Mentor slots, venue pass, meals & swag kits have been allocated to your squad.`
                    : `We appreciate your transparency. Your reserved spot has been respectfully allocated to the next squad on the waiting list.`}
                </p>

                {/* Digital Check-in Ticket Card */}
                {attending === 'yes' && (
                  <div className="mt-8 p-5 rounded-2xl bg-[#0b101c] border border-white/[0.08] text-left space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                      <div>
                        <span className="text-[10px] font-bold text-[#0099e6] uppercase tracking-wider">
                          Official Hackathon Pass
                        </span>
                        <div className="text-base font-extrabold text-white">{eventTitle}</div>
                      </div>
                      <div className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> CONFIRMED
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">TEAM NAME</span>
                        <span className="font-bold text-white text-sm">{teamName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">PARTICIPANT</span>
                        <span className="font-bold text-white text-sm">{personName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">WHATSAPP / CONTACT</span>
                        <span className="font-mono text-emerald-400 font-bold text-xs">{phone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">SQUAD COUNT</span>
                        <span className="font-medium text-slate-200">{attendanceCount} Hackers</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">DIETARY / FOOD</span>
                        <span className="font-medium text-slate-200">{dietaryPreference}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">T-SHIRT SIZE</span>
                        <span className="font-medium text-slate-200">{tshirtSize}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">HARDWARE KIT</span>
                        <span className="font-medium text-slate-200">{hardwareRequirement}</span>
                      </div>
                    </div>

                    <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Venue: {eventLocation}</span>
                      <span className="font-mono text-slate-500">{email}</span>
                    </div>
                  </div>
                )}

                {/* Bottom Action Links */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href={`/hackathons/${eventSlug || eventId}/register`}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>View Approved Ticket / Pass</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    href="/dashboard"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0088cc] text-xs font-bold text-white shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Go to My Dashboard</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-slate-300 transition-colors"
                  >
                    Edit Response
                  </button>
                  <Link
                    href="/"
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] text-xs font-bold text-slate-300 transition-colors"
                  >
                    Home
                  </Link>
                </div>
              </div>
            </motion.div>
          ) : fetchingInfo ? (
            <div className="p-16 rounded-3xl bg-[#0f172a]/80 border border-white/[0.08] text-center space-y-4">
              <Loader2 className="w-8 h-8 text-[#0099e6] animate-spin mx-auto" />
              <p className="text-sm text-slate-400">Verifying RSVP invitation status...</p>
            </div>
          ) : inviteStatus === 'UNDER_REVIEW' ? (
            /* ─── UNDER REVIEW STATE ─────────────────────────────────── */
            <motion.div
              key="under-review-state"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 sm:p-10 rounded-3xl bg-[#0f172a]/90 border border-amber-500/30 text-center space-y-5 shadow-2xl backdrop-blur-xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30 shadow-inner">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider inline-block">
                  Invitation Only Event
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white">Application Under Review</h1>
                <p className="text-xs text-[#0099e6] font-semibold">{eventTitle}</p>
              </div>
              <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                Your squad registration is currently under review by the event organizing team.
                RSVP attendance confirmation is strictly reserved for shortlisted teams who have received an official email invitation.
              </p>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] max-w-md mx-auto text-xs text-left space-y-2">
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-[#0099e6] shrink-0" />
                  <span className="truncate">Registered Email: <strong className="text-white font-mono">{email}</strong></span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  If your squad is shortlisted by the organizers, you will receive an official RSVP invitation email with a direct link to lock in your spot.
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0088cc] text-white text-xs font-bold transition-all shadow-md inline-flex items-center gap-1.5"
                >
                  <span>Return to My Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setInviteStatus('NO_EMAIL')}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-xs font-bold text-slate-300 transition-colors"
                >
                  Check Another Email
                </button>
              </div>
            </motion.div>
          ) : (inviteStatus === 'NO_EMAIL' || inviteStatus === 'NOT_FOUND') ? (
            /* ─── VERIFY INVITATION STATE ────────────────────────────── */
            <motion.div
              key="verify-email-state"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 sm:p-10 rounded-3xl bg-[#0f172a]/90 border border-white/[0.08] text-center space-y-5 shadow-2xl backdrop-blur-xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#0099e6]/15 text-[#38bdf8] flex items-center justify-center mx-auto border border-[#0099e6]/30 shadow-inner">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <span className="px-3 py-1 rounded-full text-[10px] font-black bg-[#0099e6]/15 text-[#38bdf8] border border-[#0099e6]/30 uppercase tracking-wider inline-block">
                  Invitation Verification
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white">RSVP by Invitation Only</h1>
                <p className="text-xs text-slate-400">{eventTitle}</p>
              </div>
              <p className="text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
                RSVP attendance is exclusively reserved for candidates who have received an official email invitation.
                Please enter your registered email address to verify your invitation:
              </p>

              {inviteStatus === 'NOT_FOUND' && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 max-w-md mx-auto text-left space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-rose-400">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>No Registration Found</span>
                  </div>
                  <p className="text-[11px] text-rose-200/90 leading-relaxed">
                    No active registration was found for <strong className="font-mono text-white">{lookupEmail}</strong> in this event. Please verify that you entered the exact email address used when registering.
                  </p>
                </div>
              )}

              {errorMessage && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 max-w-md mx-auto">
                  {errorMessage}
                </div>
              )}

              <form onSubmit={handleVerifyEmail} className="max-w-md mx-auto space-y-3">
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    placeholder="Enter your registered email address..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.05] border border-white/[0.12] text-white text-sm placeholder-slate-500 outline-none focus:border-[#0099e6] transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={checkingLookup}
                  className="w-full py-3 rounded-xl bg-[#0099e6] hover:bg-[#0088cc] text-white font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#0099e6]/25 cursor-pointer"
                >
                  {checkingLookup ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying Invitation...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify RSVP Invitation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2">
                <Link href="/dashboard" className="text-xs text-slate-400 hover:text-white transition-colors underline">
                  ← Return to My Dashboard
                </Link>
              </div>
            </motion.div>
          ) : (
            /* ─── INTERACTIVE RSVP FORM ────────────────────────────── */
            <motion.div
              key="form-state"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Event Header Banner Card */}
              <div className="p-6 sm:p-7 rounded-3xl bg-[#0f172a]/80 border border-white/[0.08] shadow-xl backdrop-blur-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-44 h-44 bg-[#0099e6]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0099e6]/20 text-[#38bdf8] border border-[#0099e6]/40 uppercase tracking-wide">
                    Action Required
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> RSVP Confirmation
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {eventTitle}
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                  Your team has been reserved a spot! To finalize badge prints, catering, mentor
                  allocations, and lab hardware, please confirm your attendance.
                </p>

                <div className="mt-4 pt-4 border-t border-white/[0.06] flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#0099e6]" />
                    <span>{eventDates}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#0099e6]" />
                    <span className="truncate max-w-xs">{eventLocation}</span>
                  </div>
                </div>

                {priorRsvp && (
                  <div className="mt-4 p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-sky-400" />
                      <span>
                        You previously submitted RSVP on{' '}
                        <strong>
                          {priorRsvp.rsvpAt ? new Date(priorRsvp.rsvpAt).toLocaleDateString() : 'earlier date'}
                        </strong>
                        . You can modify your responses below.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* ─── 1. Participant & Team Identification ──────────── */}
                <div className="p-6 rounded-3xl bg-[#0f172a]/70 border border-white/[0.08] backdrop-blur-md space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                    <Users className="w-4 h-4 text-[#0099e6]" />
                    <h2 className="text-xs font-black uppercase tracking-wider text-white">
                      1. Squad &amp; Hacker Details
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Team Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                        Team Name <span className="text-[#0099e6]">*</span>
                      </label>
                      <div className="relative">
                        <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder="e.g. hcj, Team Alpha"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090d18] border border-white/[0.1] text-xs font-semibold text-white placeholder-slate-500 outline-none focus:border-[#0099e6] focus:ring-1 focus:ring-[#0099e6]"
                        />
                      </div>
                    </div>

                    {/* Person / Hacker Name */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                        Your Full Name (Representative) <span className="text-[#0099e6]">*</span>
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={personName}
                          onChange={(e) => setPersonName(e.target.value)}
                          placeholder="e.g. Chinmay Bhatt"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090d18] border border-white/[0.1] text-xs font-semibold text-white placeholder-slate-500 outline-none focus:border-[#0099e6] focus:ring-1 focus:ring-[#0099e6]"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-1">
                        Registered Email <span className="text-[#0099e6]">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="e.g. chinmay@example.com"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090d18] border border-white/[0.1] text-xs font-semibold text-white placeholder-slate-500 outline-none focus:border-[#0099e6] focus:ring-1 focus:ring-[#0099e6]"
                        />
                      </div>
                    </div>

                    {/* Contact Number */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          WhatsApp / Contact Number <span className="text-[#0099e6] font-black">*</span>
                        </span>
                        <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          Mandatory for SMS &amp; Check-in
                        </span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. +91 98765 43210"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#090d18] border border-white/[0.1] text-xs font-semibold text-white placeholder-slate-500 outline-none focus:border-[#0099e6] focus:ring-1 focus:ring-[#0099e6]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── 2. Primary Attendance Question (Aap aa rahe ho ya nahi) ─── */}
                <div className="p-6 rounded-3xl bg-[#0f172a]/70 border border-white/[0.08] backdrop-blur-md space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h2 className="text-xs font-black uppercase tracking-wider text-white">
                      2. Attendance Confirmation?
                    </h2>
                  </div>

                  <p className="text-xs text-slate-300">
                    Will you and your team be attending <strong>{eventTitle}</strong> at the venue?
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* YES BUTTON */}
                    <button
                      type="button"
                      onClick={() => setAttending('yes')}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                        attending === 'yes'
                          ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                          : 'bg-[#090d18] border-white/[0.08] hover:border-emerald-500/50 hover:bg-emerald-950/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            attending === 'yes'
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                              : 'bg-white/[0.06] text-emerald-400 group-hover:bg-emerald-500/20'
                          }`}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-white flex items-center gap-2">
                            <span>Yes, We Are Attending!</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-bold">
                              Lock Spot
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                            Confirm our team&apos;s physical check-in, catering slots, and mentor support.
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* NO BUTTON */}
                    <button
                      type="button"
                      onClick={() => setAttending('no')}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                        attending === 'no'
                          ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-500/10 ring-2 ring-rose-500/30'
                          : 'bg-[#090d18] border-white/[0.08] hover:border-rose-500/50 hover:bg-rose-950/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            attending === 'no'
                              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                              : 'bg-white/[0.06] text-rose-400 group-hover:bg-rose-500/20'
                          }`}
                        >
                          <XCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-extrabold text-white flex items-center gap-2">
                            <span>No, We Cannot Attend</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 font-bold">
                              Release Spot
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                            Politely pass our reserved slot to aspiring hackers on the waitlist.
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* ─── 3A. Conditional Section: IF ATTENDING (YES) ───── */}
                <AnimatePresence>
                  {attending === 'yes' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-6 overflow-hidden"
                    >
                      <div className="p-6 rounded-3xl bg-[#0f172a]/70 border border-white/[0.08] backdrop-blur-md space-y-5">
                        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                          <Utensils className="w-4 h-4 text-[#0099e6]" />
                          <h2 className="text-xs font-black uppercase tracking-wider text-white">
                            3. Logistics, Food &amp; Hardware Preferences
                          </h2>
                        </div>

                        {/* Squad Member Count */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-200 block">
                            How many team members will attend in person?
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5].map((cnt) => (
                              <button
                                key={cnt}
                                type="button"
                                onClick={() => setAttendanceCount(cnt)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                  attendanceCount === cnt
                                    ? 'bg-[#0099e6] text-white shadow-md shadow-sky-500/20 ring-1 ring-white/30'
                                    : 'bg-[#090d18] text-slate-300 hover:bg-white/[0.08] border border-white/[0.08]'
                                }`}
                              >
                                {cnt === 5 ? '5+ Hackers' : `${cnt} Hacker${cnt > 1 ? 's' : ''}`}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Dietary Preference & T-Shirt Size */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                          {/* Dietary Choice */}
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Food / Dietary Preference</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                { id: 'Veg', label: 'Veg 🌱' },
                                { id: 'Non-Veg', label: 'Non-Veg 🍗' },
                                { id: 'Jain', label: 'Jain 🥬' },
                                { id: 'Vegan', label: 'Vegan 🥑' },
                              ].map((diet) => (
                                <button
                                  key={diet.id}
                                  type="button"
                                  onClick={() => setDietaryPreference(diet.id)}
                                  className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                                    dietaryPreference === diet.id
                                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 border'
                                      : 'bg-[#090d18] text-slate-300 border border-white/[0.08] hover:border-white/20'
                                  }`}
                                >
                                  {diet.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* T-Shirt Size */}
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              <Shirt className="w-3.5 h-3.5 text-sky-400" />
                              <span>T-Shirt Size (Official Swag)</span>
                            </label>
                            <div className="flex gap-1.5">
                              {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                                <button
                                  key={sz}
                                  type="button"
                                  onClick={() => setTshirtSize(sz)}
                                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                                    tshirtSize === sz
                                      ? 'bg-[#0099e6] text-white shadow-md'
                                      : 'bg-[#090d18] text-slate-300 border border-white/[0.08] hover:border-white/20'
                                  }`}
                                >
                                  {sz}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Hardware Kit Request */}
                        <div className="space-y-2 pt-1">
                          <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Cpu className="w-3.5 h-3.5 text-amber-400" />
                              <span>Do you require any hardware kit or lab equipment?</span>
                            </span>
                            <span className="text-[10px] text-slate-400">Subject to availability</span>
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                              { id: 'None', label: 'None (Software project / own laptops)' },
                              { id: 'IoT_Kit', label: 'IoT / Microcontroller Kit (ESP32/Arduino)' },
                              { id: 'RaspberryPi', label: 'Raspberry Pi / Single Board Computer' },
                              { id: 'Sensors_Actuators', label: 'Sensors & Motors / Hardware Station' },
                              { id: 'Other', label: 'Other Special Requirements' },
                            ].map((hw) => (
                              <button
                                key={hw.id}
                                type="button"
                                onClick={() => setHardwareRequirement(hw.id)}
                                className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                                  hardwareRequirement === hw.id
                                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 border'
                                    : 'bg-[#090d18] text-slate-300 border border-white/[0.08] hover:border-white/20'
                                }`}
                              >
                                {hw.label}
                              </button>
                            ))}
                          </div>

                          {hardwareRequirement === 'Other' && (
                            <input
                              type="text"
                              value={customHardwareText}
                              onChange={(e) => setCustomHardwareText(e.target.value)}
                              placeholder="Please specify hardware component, sensor, or monitor need..."
                              className="mt-2 w-full px-3.5 py-2 rounded-xl bg-[#090d18] border border-white/[0.1] text-xs text-white placeholder-slate-500 outline-none focus:border-amber-400"
                            />
                          )}
                        </div>

                        {/* Special Remarks / Questions */}
                        <div className="space-y-1.5 pt-1">
                          <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                            <span>Special Requests / Arrival Notes (Optional)</span>
                            <span className="text-[10px] text-slate-400">e.g. late arrival, travel queries</span>
                          </label>
                          <textarea
                            rows={2}
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Any dietary allergy, travel arrival time, or notes for the organizing team..."
                            className="w-full p-3 rounded-xl bg-[#090d18] border border-white/[0.1] text-xs text-white placeholder-slate-500 outline-none focus:border-[#0099e6]"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ─── 3B. Conditional Section: IF DECLINING (NO) ───── */}
                <AnimatePresence>
                  {attending === 'no' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-6 overflow-hidden"
                    >
                      <div className="p-6 rounded-3xl bg-[#0f172a]/70 border border-white/[0.08] backdrop-blur-md space-y-4">
                        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3">
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                          <h2 className="text-xs font-black uppercase tracking-wider text-white">
                            3. Reason for Declining (Optional feedback)
                          </h2>
                        </div>

                        <p className="text-xs text-slate-300">
                          Could you briefly let the organizers know why you can&apos;t make it? This helps us
                          schedule better dates in the future.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            'College / Exam clash',
                            'Travel / Distance constraints',
                            'Team member unavailable',
                            'Work / Job commitments',
                            'Personal emergency',
                            'Other',
                          ].map((rsn) => (
                            <button
                              key={rsn}
                              type="button"
                              onClick={() => setDeclineReason(rsn)}
                              className={`p-2.5 rounded-xl text-xs font-semibold text-left transition-all cursor-pointer ${
                                declineReason === rsn
                                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-200 border'
                                  : 'bg-[#090d18] text-slate-300 border border-white/[0.08] hover:border-white/20'
                              }`}
                            >
                              {rsn}
                            </button>
                          ))}
                        </div>

                        {declineReason === 'Other' && (
                          <input
                            type="text"
                            value={otherReasonText}
                            onChange={(e) => setOtherReasonText(e.target.value)}
                            placeholder="Briefly describe why..."
                            className="w-full px-3.5 py-2 rounded-xl bg-[#090d18] border border-white/[0.1] text-xs text-white placeholder-slate-500 outline-none focus:border-rose-400"
                          />
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error Banner */}
                {errorMessage && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* ─── 4. Submit RSVP Action Button ─────────────────── */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 rounded-2xl font-black text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                      attending === 'yes'
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-[#0099e6] hover:brightness-110 text-white shadow-emerald-500/20'
                        : 'bg-gradient-to-r from-rose-600 to-amber-600 hover:brightness-110 text-white shadow-rose-500/20'
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving RSVP Response...</span>
                      </div>
                    ) : attending === 'yes' ? (
                      <>
                        <span>Confirm RSVP &amp; Lock In Spot 🚀</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        <span>Submit Response (Release Spot)</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <p className="text-[11px] text-slate-500 text-center mt-3">
                    By submitting, your response will be safely recorded with the {eventTitle} organizing team.
                  </p>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-[#0c1222]/80 backdrop-blur-md py-4 text-center text-xs text-slate-500 px-4">
        <p>
          Hacker&apos;s Unity Platform • Verified Event Check-In • Questions? Reach us at{' '}
          <a href="mailto:info@hackersunity.com" className="text-[#0099e6] hover:underline">
            info@hackersunity.com
          </a>
        </p>
      </footer>
    </div>
  );
}

export default function RsvpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#080d1a] flex items-center justify-center text-white">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-[#0099e6] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-bold text-slate-300">Loading RSVP Portal...</span>
          </div>
        </div>
      }
    >
      <RsvpContent />
    </Suspense>
  );
}
