'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  Send,
  Users,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Eye,
  AlertCircle,
  HelpCircle,
  CreditCard,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ExternalLink,
  Lock,
  Loader2,
  CheckSquare,
  Square,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export interface PaymentItem {
  id: string;
  event_id?: string;
  eventId?: string;
  event_name?: string;
  eventName?: string;
  slug?: string;
  team_name?: string;
  teamName?: string;
  team_leader_name?: string;
  team_leader_email?: string;
  amount: number | string;
  status: string;
  created_at?: string;
  receipt_number?: string;
  razorpay_payment_id?: string;
  utr_number?: string;
  events?: {
    slug?: string;
    title?: string;
    banner_url?: string;
  };
  [key: string]: any;
}

export interface PaymentReminderSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'single' | 'bulk';
  targetPayment?: PaymentItem | null;
  allPendingPayments?: PaymentItem[];
  allEvents?: any[];
  onSuccess?: () => void;
}

function textToHtml(text: string): string {
  if (!text) return '<p></p>';
  if (/<[a-z][\s\S]*>/i.test(text)) return text;

  const withBold = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  return withBold
    .split(/\n\n+/)
    .map((para) => `<p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: #334155;">${para.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function PaymentReminderSidebar({
  isOpen,
  onClose,
  mode,
  targetPayment,
  allPendingPayments = [],
  allEvents = [],
  onSuccess,
}: PaymentReminderSidebarProps) {
  const { user, supabaseUser } = useAuth();
  const drawerRef = useRef<HTMLDivElement>(null);

  // Helper to resolve clean slug from payment object and allEvents (replaces raw internal IDs like evt_ai_...)
  const resolveEventSlug = (p?: PaymentItem | null): string => {
    if (!p) return 'sphinx-26';
    if (p.slug && !p.slug.startsWith('evt_')) return p.slug;
    if (p.events?.slug && !p.events.slug.startsWith('evt_')) return p.events.slug;

    const targetId = p.event_id || p.eventId;
    const targetTitle = (p.event_name || p.eventName || p.events?.title || '').toLowerCase().trim();

    if (allEvents && allEvents.length > 0) {
      const matched = allEvents.find((e: any) => {
        if (targetId && (e.id === targetId || e.slug === targetId)) return true;
        if (targetTitle && (e.title?.toLowerCase().trim() === targetTitle || e.name?.toLowerCase().trim() === targetTitle)) return true;
        return false;
      });
      if (matched?.slug && !matched.slug.startsWith('evt_')) return matched.slug;
    }

    if (targetTitle.includes('sphinx')) return 'sphinx-26';
    if (p.slug && !p.slug.startsWith('evt_')) return p.slug;
    if (targetId && !targetId.startsWith('evt_')) return targetId;
    return 'sphinx-26';
  };

  // Active tab: compose vs preview
  const [activeTab, setActiveTab] = useState<'compose' | 'preview'>('compose');

  // Recipient selection in bulk mode
  const [recipientSearch, setRecipientSearch] = useState('');
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<Set<string>>(new Set());

  // Email form state
  const [subject, setSubject] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [actionButtonText, setActionButtonText] = useState('Complete Registration Payment ({amount}) →');

  // Test email state
  const [testEmailAddress, setTestEmailAddress] = useState(user?.email || 'chinmaybhatt26@gmail.com');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Send state
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    count?: number;
    message: string;
    warning?: string;
    failedEmails?: { email: string; reason: string }[];
  } | null>(null);

  // Deduplicate and prepare pending payments list
  const uniquePendingPayments = useMemo(() => {
    const map = new Map<string, PaymentItem>();
    allPendingPayments.forEach((p) => {
      if (p.status === 'PENDING' || p.status === 'CREATED') {
        const key = p.id || `${p.team_leader_email}_${p.event_id}`;
        if (!map.has(key)) {
          map.set(key, p);
        }
      }
    });
    return Array.from(map.values());
  }, [allPendingPayments]);

  // Target event info helper
  const eventTitle = useMemo(() => {
    if (mode === 'single' && targetPayment) {
      return targetPayment.event_name || targetPayment.eventName || targetPayment.events?.title || 'Hackathon Arena';
    }
    return 'Hackathon Arena';
  }, [mode, targetPayment]);

  // Reset form when opened or mode/target changes
  useEffect(() => {
    if (!isOpen) return;

    setSendResult(null);
    setTestResult(null);
    setActiveTab('compose');

    if (user?.email) {
      setTestEmailAddress(user.email);
    }

    if (mode === 'single' && targetPayment) {
      const eTitle = targetPayment.event_name || targetPayment.eventName || targetPayment.events?.title || 'Hackathon Arena';
      setSubject(`Action Required: Complete your registration payment for ${eTitle}`);
      setBodyText(
`Thank you for registering for **{event_title}** with squad **{team_name}**!

Your registration has been received and your spot is currently reserved on the arena waitlist awaiting payment verification. To complete your payment process for approval and confirm your squad's slot in the arena, please complete the registration fee of **{amount}**.

Once your payment is verified, your registration status will be confirmed and your entire team will receive full hackathon workspace and discord access.

Please click the button below to complete your payment process:`
      );
      setActionButtonText('Complete Registration Payment ({amount}) →');
    } else {
      // Bulk mode: select all by default
      const allIds = new Set(uniquePendingPayments.map((p) => p.id));
      setSelectedPaymentIds(allIds);

      setSubject(`Action Required: Complete your registration payment for {event_title}`);
      setBodyText(
`Thank you for registering for **{event_title}** with squad **{team_name}**!

Your registration has been received and your spot is currently reserved on the arena waitlist awaiting payment verification. To complete your payment process for approval and confirm your squad's slot in the arena, please complete the registration fee of **{amount}**.

Once your payment is verified, your registration status will be confirmed and your entire team will receive full hackathon workspace access.

Please click the button below to complete your payment process:`
      );
      setActionButtonText('Complete Registration Payment ({amount}) →');
    }
  }, [isOpen, mode, targetPayment, uniquePendingPayments, user?.email]);

  // Filtered recipients in bulk mode
  const filteredBulkRecipients = useMemo(() => {
    if (!recipientSearch.trim()) return uniquePendingPayments;
    const q = recipientSearch.toLowerCase();
    return uniquePendingPayments.filter((p) => {
      const name = (p.team_leader_name || '').toLowerCase();
      const email = (p.team_leader_email || '').toLowerCase();
      const squad = (p.team_name || p.teamName || '').toLowerCase();
      const event = (p.event_name || p.eventName || p.events?.title || '').toLowerCase();
      return name.includes(q) || email.includes(q) || squad.includes(q) || event.includes(q);
    });
  }, [uniquePendingPayments, recipientSearch]);

  // Selected recipients in bulk mode
  const selectedRecipients = useMemo(() => {
    if (mode === 'single') {
      return targetPayment ? [targetPayment] : [];
    }
    return uniquePendingPayments.filter((p) => selectedPaymentIds.has(p.id));
  }, [mode, targetPayment, uniquePendingPayments, selectedPaymentIds]);

  // Active preview recipient
  const previewRecipient = useMemo(() => {
    if (mode === 'single' && targetPayment) return targetPayment;
    if (selectedRecipients.length > 0) return selectedRecipients[0];
    if (uniquePendingPayments.length > 0) return uniquePendingPayments[0];
    return null;
  }, [mode, targetPayment, selectedRecipients, uniquePendingPayments]);

  // Esc key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Bulk selection toggles
  const handleToggleSelectAll = () => {
    if (selectedPaymentIds.size === uniquePendingPayments.length) {
      setSelectedPaymentIds(new Set());
    } else {
      setSelectedPaymentIds(new Set(uniquePendingPayments.map((p) => p.id)));
    }
  };

  const handleToggleRecipient = (id: string) => {
    setSelectedPaymentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const insertVariable = (varName: string, target: 'subject' | 'body') => {
    if (target === 'subject') {
      setSubject((prev) => `${prev} {${varName}}`);
    } else {
      setBodyText((prev) => `${prev} {${varName}}`);
    }
  };

  // Build recipients payload with individual payment checkout links
  const getPayloadRecipients = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hackersunity.com';
    return selectedRecipients.map((p) => {
      const slug = resolveEventSlug(p);
      const eventName = p.event_name || p.eventName || p.events?.title || 'Hackathon Arena';
      const amountVal = Number(p.amount) || 800;

      return {
        name: p.team_leader_name || 'Hacker',
        email: p.team_leader_email || '',
        teamName: p.team_name || p.teamName || 'Solo Builder',
        college: p.college || 'Participant',
        status: 'PENDING',
        amount: amountVal,
        eventTitle: eventName,
        paymentUrl: `${baseUrl}/hackathons/${slug}/register?step=4`,
      };
    }).filter((r) => Boolean(r.email));
  };

  // Send Test Email Handler
  const handleSendTestEmail = async () => {
    if (!testEmailAddress) return;
    setSendingTest(true);
    setTestResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const sampleEventTitle = previewRecipient?.event_name || previewRecipient?.events?.title || eventTitle;
      const sampleAmount = Number(previewRecipient?.amount) || 800;
      const sampleSlug = resolveEventSlug(previewRecipient);
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hackersunity.com';

      const res = await fetch('/api/event-broadcast-email', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          eventId: previewRecipient?.event_id || 'event_test',
          eventTitle: sampleEventTitle,
          subject,
          bodyText,
          templateType: 'payment_reminder',
          actionButtonText,
          isTest: true,
          testEmail: testEmailAddress,
          testRecipientName: previewRecipient?.team_leader_name || 'Chinmay Bhatt',
          testTeamName: previewRecipient?.team_name || 'Solo Builder',
          testAmount: sampleAmount,
          testPaymentUrl: `${baseUrl}/hackathons/${sampleSlug}/register?step=4`,
          senderEmail: user?.email,
          origin: baseUrl,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.warning || `Test reminder email sent to ${testEmailAddress}! Check your inbox.`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to dispatch test email. Please check server settings.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Network error: ${err.message}`,
      });
    } finally {
      setSendingTest(false);
      setTimeout(() => setTestResult(null), 8000);
    }
  };

  // Send Broadcast / Reminder Emails
  const handleSendReminderEmails = async () => {
    const payloadRecipients = getPayloadRecipients();
    if (payloadRecipients.length === 0) {
      setSendResult({
        success: false,
        message: 'No valid recipient email addresses found in selection.',
      });
      return;
    }

    setIsSending(true);
    setSendResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hackersunity.com';

      const res = await fetch('/api/event-broadcast-email', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          eventId: previewRecipient?.event_id || 'payment_reminder',
          eventTitle: mode === 'single' ? eventTitle : 'Hackathon Arena',
          recipients: payloadRecipients,
          subject,
          bodyText,
          templateType: 'payment_reminder',
          actionButtonText,
          isTest: false,
          senderEmail: user?.email,
          origin: baseUrl,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const count = data.sentCount || payloadRecipients.length;
        setSendResult({
          success: true,
          count,
          message: `Successfully dispatched reminder emails to ${count} participant${count === 1 ? '' : 's'}!`,
          warning: data.warning,
          failedEmails: data.failedEmails,
        });
        if (onSuccess) onSuccess();
      } else {
        setSendResult({
          success: false,
          message: data.error || 'Failed to dispatch emails. Please verify email server configuration.',
        });
      }
    } catch (err: any) {
      setSendResult({
        success: false,
        message: `Network exception: ${err.message}`,
      });
    } finally {
      setIsSending(false);
    }
  };

  // Preview substitutions
  const previewName = previewRecipient?.team_leader_name || 'Tanmay';
  const previewTeam = previewRecipient?.team_name || previewRecipient?.teamName || 'Solo Builder';
  const previewEvent = previewRecipient?.event_name || previewRecipient?.eventName || previewRecipient?.events?.title || 'SPHINX \'26';
  const cleanedPreviewAmount = typeof previewRecipient?.amount === 'string'
    ? Number(previewRecipient.amount.replace(/[^0-9.-]+/g, ''))
    : Number(previewRecipient?.amount);
  const previewAmount = !isNaN(cleanedPreviewAmount) && cleanedPreviewAmount > 0 ? cleanedPreviewAmount : 800;
  const formattedPreviewAmount = `₹${previewAmount.toLocaleString('en-IN')}`;
  const previewSlug = resolveEventSlug(previewRecipient);
  const previewPaymentUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/hackathons/${previewSlug}/register?step=4`
    : `https://hackersunity.com/hackathons/${previewSlug}/register?step=4`;

  const renderedPreviewSubject = subject
    .replace(/\{name\}/gi, previewName)
    .replace(/\{user\}/gi, previewName)
    .replace(/\{team_name\}/gi, previewTeam)
    .replace(/\{team\}/gi, previewTeam)
    .replace(/\{event_title\}/gi, previewEvent)
    .replace(/₹\s*\{amount\}/gi, formattedPreviewAmount)
    .replace(/\{amount\}/gi, formattedPreviewAmount)
    .replace(/₹\s*₹+/g, '₹');

  // Strip duplicate greeting and premature sign-off for preview body
  const cleanPreviewBodyText = bodyText
    .replace(/^\s*(hi|hello|dear|hey)\s+[^,\n]+,?\s*/i, '')
    .replace(/\n\s*(best regards|warm regards|regards|sincerely|thanks)\s*,?\s*[\r\n]+.*$/i, '')
    .trim();

  const renderedPreviewBody = cleanPreviewBodyText
    .replace(/\{name\}/gi, previewName)
    .replace(/\{user\}/gi, previewName)
    .replace(/\{team_name\}/gi, previewTeam)
    .replace(/\{team\}/gi, previewTeam)
    .replace(/\{event_title\}/gi, previewEvent)
    .replace(/₹\s*\{amount\}/gi, formattedPreviewAmount)
    .replace(/\{amount\}/gi, formattedPreviewAmount)
    .replace(/₹\s*₹+/g, '₹')
    .replace(/\{payment_url\}/gi, `<a href="${previewPaymentUrl}" target="_blank" class="text-[#0099e6] underline font-bold">${previewPaymentUrl}</a>`);

  const renderedPreviewButton = actionButtonText
    .replace(/₹\s*\{amount\}/gi, formattedPreviewAmount)
    .replace(/\{amount\}/gi, formattedPreviewAmount)
    .replace(/₹\s*₹+/g, '₹')
    .replace(/\{name\}/gi, previewName)
    .replace(/\{team_name\}/gi, previewTeam);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-end animate-in fade-in duration-200">
      {/* Right Slide-Over Drawer Container */}
      <div
        ref={drawerRef}
        className="w-full max-w-2xl h-full bg-white dark:bg-[#0c1017] border-l border-slate-200 dark:border-white/[0.08] shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300"
      >
        {/* ─── 1. Header ────────────────────────────────────────── */}
        <div className="p-5 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/80 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/25">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  {mode === 'single' ? 'Send Payment Reminder Mail' : 'Broadcast Payment Reminder (Mail All)'}
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold border border-amber-200 dark:border-amber-800/40">
                  {mode === 'single' ? 'Single Participant' : `Bulk • ${selectedRecipients.length} Pending`}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-md">
                {mode === 'single'
                  ? `Send direct registration checkout link to ${targetPayment?.team_leader_name || 'Participant'}`
                  : `Automated reminder emails with direct payment links for all pending dues`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── 2. Top Tabs (Compose / Preview) ───────────────────── */}
        <div className="px-5 pt-3 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between bg-white dark:bg-[#0c1017]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('compose')}
              className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'compose'
                  ? 'border-[#ea580c] text-[#ea580c]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Compose Message</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3.5 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'border-[#ea580c] text-[#ea580c]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Inbox Preview</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <Lock className="w-3 h-3 text-emerald-500" />
            <span>Sender: info@hackersunity.com</span>
          </div>
        </div>

        {/* ─── 3. Scrollable Body ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status Alert if send finished */}
          {sendResult && (
            <div
              className={`p-4 rounded-2xl border text-xs flex flex-col gap-2 animate-in fade-in ${
                sendResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-200'
              }`}
            >
              <div className="flex items-center gap-2 font-black text-sm">
                {sendResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span>{sendResult.message}</span>
              </div>
              {sendResult.warning && (
                <div className="text-[11px] opacity-90 pl-6 bg-black/5 dark:bg-white/5 p-2 rounded-lg">
                  {sendResult.warning}
                </div>
              )}
              {sendResult.failedEmails && sendResult.failedEmails.length > 0 && (
                <div className="text-[11px] pl-6 space-y-1">
                  <div className="font-bold">Failed to deliver to:</div>
                  {sendResult.failedEmails.map((f, i) => (
                    <div key={i} className="font-mono text-[10px]">
                      • {f.email}: {f.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Test Email Result Alert */}
          {testResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2 animate-in fade-in ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200 font-medium'
                  : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-200 font-medium'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* ══════════ COMPOSE TAB ══════════ */}
          {activeTab === 'compose' ? (
            <div className="space-y-5">
              {/* Recipient Details Card (Single Mode) */}
              {mode === 'single' && targetPayment && (
                <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Target Recipient & Payment Details</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                      Payment Pending
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="space-y-0.5">
                      <div className="text-[10px] text-slate-400 font-medium">Participant</div>
                      <div className="font-black text-slate-900 dark:text-white truncate">
                        {targetPayment.team_leader_name || 'Hacker'}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[10px] text-slate-400 font-medium">Email</div>
                      <div className="font-mono text-slate-800 dark:text-slate-200 text-[11px] truncate" title={targetPayment.team_leader_email}>
                        {targetPayment.team_leader_email || 'N/A'}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[10px] text-slate-400 font-medium">Squad</div>
                      <div className="font-bold text-[#0099e6] dark:text-[#38bdf8] truncate">
                        {targetPayment.team_name || targetPayment.teamName || 'Solo Builder'}
                      </div>
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-[10px] text-slate-400 font-medium">Amount Due</div>
                      <div className="font-mono font-black text-amber-600 dark:text-amber-400 text-sm">
                        ₹{Number(targetPayment.amount).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-amber-200/60 dark:border-amber-800/30 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="truncate">
                      Destination Link: <strong className="font-mono text-slate-700 dark:text-slate-300">/hackathons/{previewSlug}/register?step=4</strong>
                    </span>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 shrink-0">
                      Direct Checkout
                    </span>
                  </div>
                </div>
              )}

              {/* Bulk Recipients Selector (Bulk Mode) */}
              {mode === 'bulk' && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#ea580c]" />
                        <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                          Select Pending Recipients
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                          {selectedPaymentIds.size} of {uniquePendingPayments.length} Selected
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Each participant will receive their own personalized reminder with their specific team payment link.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-700 dark:text-slate-200 transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      {selectedPaymentIds.size === uniquePendingPayments.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  {/* Search box for recipients */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={recipientSearch}
                      onChange={(e) => setRecipientSearch(e.target.value)}
                      placeholder="Filter by participant, email, squad, or hackathon..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#ea580c]"
                    />
                  </div>

                  {/* Recipient check cards list */}
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {filteredBulkRecipients.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-400">
                        No pending participants match &quot;{recipientSearch}&quot;
                      </div>
                    ) : (
                      filteredBulkRecipients.map((p) => {
                        const isChecked = selectedPaymentIds.has(p.id);
                        const pName = p.team_leader_name || 'Hacker';
                        const pEmail = p.team_leader_email || '';
                        const pSquad = p.team_name || p.teamName || 'Solo Builder';
                        const pEvent = p.event_name || p.eventName || p.events?.title || 'Hackathon';
                        const pAmt = Number(p.amount) || 800;

                        return (
                          <div
                            key={p.id}
                            onClick={() => handleToggleRecipient(p.id)}
                            className={`p-2.5 rounded-xl flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer ${
                              isChecked
                                ? 'bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40'
                                : 'hover:bg-slate-100/60 dark:hover:bg-white/[0.03]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="text-amber-600 dark:text-amber-400 shrink-0">
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-[#ea580c]" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-black text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                                  <span>{pName}</span>
                                  <span className="text-[10px] font-normal text-slate-400 font-mono">({pEmail})</span>
                                </div>
                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                  Squad: <strong className="text-slate-700 dark:text-slate-300">{pSquad}</strong> • Event: {pEvent}
                                </div>
                              </div>
                            </div>

                            <div className="font-mono font-bold text-amber-600 dark:text-amber-400 shrink-0 text-right">
                              ₹{pAmt.toLocaleString('en-IN')}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {/* Subject Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 dark:text-white">
                    Email Subject Line <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {subject.length} chars
                  </span>
                </div>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Action Required: Complete your registration payment for {event_title}"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#ea580c] transition-colors"
                />

                {/* Variable chips for Subject */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-slate-400 font-medium">Insert tag:</span>
                  {['name', 'team_name', 'event_title', 'amount'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertVariable(tag, 'subject')}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      +{`{${tag}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Body Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-900 dark:text-white">
                    Message Body (Supports Markdown &amp; HTML) <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {bodyText.length} chars
                  </span>
                </div>
                <textarea
                  rows={8}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder="Write payment reminder instructions..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#ea580c] font-mono leading-relaxed transition-colors resize-y"
                />

                {/* Variable chips for Body */}
                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-slate-400 font-medium">Insert tag:</span>
                  {['name', 'team_name', 'event_title', 'amount', 'payment_url'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertVariable(tag, 'body')}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      +{`{${tag}}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Button Label */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-900 dark:text-white">
                  Payment CTA Button Label
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={actionButtonText}
                    onChange={(e) => setActionButtonText(e.target.value)}
                    placeholder="e.g. Complete Registration Payment ({amount}) →"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#ea580c]"
                  />
                  <div className="px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-[10px] font-mono text-amber-800 dark:text-amber-300 shrink-0">
                    Target: Step 4 Checkout
                  </div>
                </div>
              </div>

              {/* Test Email Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Send Test Email to Yourself</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Verify format in inbox</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={testEmailAddress}
                    onChange={(e) => setTestEmailAddress(e.target.value)}
                    placeholder="your-email@example.com"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#ea580c]"
                  />
                  <button
                    type="button"
                    disabled={sendingTest || !testEmailAddress}
                    onClick={handleSendTestEmail}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white dark:bg-[#121824] hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                  >
                    {sendingTest ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3 text-[#ea580c]" />}
                    <span>{sendingTest ? 'Sending...' : 'Send Test'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ══════════ PREVIEW TAB ══════════ */
            <div className="space-y-4">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>Rendering preview for: <strong>{previewName}</strong> ({previewTeam})</span>
                <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">Due: ₹{previewAmount}</span>
              </div>

              {/* Mock Email Client Container */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/[0.1] shadow-lg overflow-hidden bg-slate-900 text-slate-100">
                {/* Email Client Header bar */}
                <div className="bg-slate-950 p-4 border-b border-white/[0.08] space-y-1">
                  <div className="text-xs font-semibold text-slate-400">
                    Subject: <strong className="text-white font-bold">{renderedPreviewSubject}</strong>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>From: <strong>Hacker&apos;s Unity &lt;info@hackersunity.com&gt;</strong></span>
                    <span>To: <strong>{previewRecipient?.team_leader_email || 'participant@example.com'}</strong></span>
                  </div>
                </div>

                {/* Simulated Email Body Container */}
                <div className="p-6 bg-[#0b0f19] flex justify-center">
                  <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-xl text-slate-800">
                    {/* Header Banner */}
                    <div className="bg-gradient-to-r from-[#060913] to-[#0c1527] p-5 border-b-2 border-[#ea580c] flex items-center justify-between">
                      <div>
                        <div className="text-lg font-black text-white">Hacker&apos;s Unity</div>
                        <div className="text-[10px] text-slate-400">India&apos;s Fastest Growing Hackathon Community</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-orange-500/15 border border-orange-500/40 text-orange-400 text-[10px] font-black uppercase tracking-wider">
                        Action Required: Complete Payment
                      </span>
                    </div>

                    {/* Event Banner */}
                    <div className="bg-slate-50 px-5 py-3 border-b border-slate-100">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Event</div>
                      <div className="text-sm font-black text-slate-900">{previewEvent}</div>
                    </div>

                    {/* Email Content */}
                    <div className="p-6 space-y-4">
                      <div className="text-sm font-bold text-slate-900">
                        Hi {previewName},
                      </div>

                      <div
                        className="text-xs text-slate-600 leading-relaxed space-y-2"
                        dangerouslySetInnerHTML={{ __html: textToHtml(renderedPreviewBody) }}
                      />

                      {/* Highlight Information Card */}
                      <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200/80 grid grid-cols-3 gap-2 text-center text-xs">
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Leader</div>
                          <div className="font-bold text-slate-900 truncate">{previewName}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Squad</div>
                          <div className="font-bold text-[#0099e6] truncate">{previewTeam}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Pending Due</div>
                          <div className="font-mono font-black text-[#ea580c] text-sm">₹{previewAmount}</div>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <div className="pt-2 text-center">
                        <a
                          href={previewPaymentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-block px-6 py-3 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] text-white text-xs font-black shadow-lg shadow-orange-500/30 transition-all cursor-pointer"
                        >
                          {renderedPreviewButton}
                        </a>
                      </div>

                      {/* Direct Link Fallback */}
                      <div className="text-[11px] text-slate-400 text-center break-all">
                        Direct link: <a href={previewPaymentUrl} target="_blank" rel="noreferrer" className="text-[#0099e6] underline font-semibold">{previewPaymentUrl}</a>
                      </div>

                      {/* Sign-off Block Placed After CTA */}
                      <div className="pt-4 border-t border-slate-100 text-xs text-slate-600 space-y-0.5">
                        <div>Best regards,</div>
                        <div className="font-bold text-slate-900">Hacker&apos;s Unity Organizing Team</div>
                      </div>

                      <div className="text-[11px] text-slate-400 text-center pt-2">
                        Need assistance? Reply directly or contact <span className="text-[#0099e6]">info@hackersunity.com</span>
                      </div>
                    </div>

                    {/* Email Footer */}
                    <div className="bg-slate-50 px-5 py-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
                      © {new Date().getFullYear()} Hacker&apos;s Unity. Sent on behalf of the organizing committee.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── 4. Footer Actions ────────────────────────────────── */}
        <div className="p-4 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSending || selectedRecipients.length === 0 || !subject.trim() || !bodyText.trim()}
              onClick={handleSendReminderEmails}
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shadow-orange-500/25 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching Reminders...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {mode === 'single'
                      ? 'Send Reminder Mail'
                      : `Send Reminder to All (${selectedRecipients.length})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
