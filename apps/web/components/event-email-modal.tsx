'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
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
  Code,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Award,
  XCircle,
  Bell,
  CreditCard,
  Crown,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Undo,
  Redo,
  RemoveFormatting,
  GripVertical,
} from 'lucide-react';

function textToHtml(text: string): string {
  if (!text) return '<p></p>';
  if (/<[a-z][\s\S]*>/i.test(text)) return text;

  const withBold = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  return withBold
    .split(/\n\n+/)
    .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('');
}
import { EventRegistration } from '@/lib/storage';
import { ExtendedEvent } from '@/lib/mock-data';

export interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ExtendedEvent | null;
  registrations: EventRegistration[];
  // Initial mode or target
  singleRecipient?: EventRegistration | null;
  targetTeam?: {
    id?: string;
    teamId?: string;
    teamName: string;
    leaderName?: string;
    leaderEmail?: string;
    leaderPhone?: string;
    isPaid?: boolean;
    paymentAmount?: number | string | null;
    utrNumber?: string | null;
    members?: any[];
    [key: string]: any;
  } | null;
  initialSelectedIds?: string[];
  initialFilter?: 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED';
}

type TemplateType =
  | 'selection'
  | 'approval'
  | 'rejection'
  | 'certificate'
  | 'rsvp'
  | 'payment_reminder'
  | 'general'
  | 'custom';

interface TemplatePreset {
  id: TemplateType;
  label: string;
  badge: string;
  subject: string;
  body: string;
  ctaText: string;
}

const TEMPLATES: TemplatePreset[] = [
  {
    id: 'selection',
    label: 'Team Selected / Shortlisted',
    badge: 'Shortlisted',
    subject: 'Congratulations! Your team {team_name} is shortlisted for {event_title}',
    body: `We are thrilled to inform you that your team **{team_name}** has been shortlisted for **{event_title}**!

Our evaluation panel reviewed hundreds of innovative project pitches, and your squad's proposal stood out with exceptional technical depth and vision.

Please review your event schedule, coordinate with your squad members, and prepare for the upcoming project kickoff. Stay tuned on your dashboard for mentor allocations and workspace access.

Let's build something phenomenal together!`,
    ctaText: 'Open Event Dashboard →',
  },
  {
    id: 'approval',
    label: 'Application Approved',
    badge: 'Approved',
    subject: 'Your Application for {event_title} has been Approved!',
    body: `Congratulations! Your registration for **{event_title}** has been officially verified and approved by the organizing committee.

You are now confirmed to participate in this hackathon. You will receive live access to the problem statements, project submission portals, and our developer community.

Please ensure you join our official Discord server to connect with mentors and fellow hackers.`,
    ctaText: 'View Approved Registration →',
  },
  {
    id: 'rejection',
    label: 'Application Update (Regret)',
    badge: 'Regret',
    subject: 'Update regarding your application for {event_title}',
    body: `Thank you for taking the time to submit your application for **{event_title}**.

Due to an overwhelming response and venue capacity constraints, we regret to inform you that we are unable to accept your application for this edition of the hackathon.

This was an extremely difficult decision, as we received hundreds of impressive submissions. We strongly encourage you to participate in upcoming hackathons and builder sprints on Hacker's Unity.

Keep hacking, keep building, and we hope to see you in our next event!`,
    ctaText: 'Explore Upcoming Hackathons →',
  },
  {
    id: 'certificate',
    label: 'Certificate of Participation',
    badge: 'Certification',
    subject: 'Your Official Certificate of Participation | {event_title}',
    body: `Congratulations on completing **{event_title}**!

On behalf of the organizing committee and Hacker's Unity, we would like to express our deepest gratitude for your hard work, creativity, and commitment throughout the hackathon.

Your Official Certificate of Participation is now ready. You can view, download, and share your verified credential on LinkedIn, Twitter, and your portfolio.`,
    ctaText: 'Download Your Certificate →',
  },
  {
    id: 'rsvp',
    label: 'RSVP Confirmation Required',
    badge: 'Action Required',
    subject: 'Action Required: Please confirm your RSVP for {event_title}',
    body: `Your spot for **{event_title}** has been reserved!

To finalize venue arrangements, mentor slots, and hardware kits, we require your immediate confirmation. Please confirm whether you and your team will be attending.

**Important:** If we do not receive your RSVP confirmation within 48 hours, your reserved spot will automatically be transferred to the waitlisted teams.`,
    ctaText: 'Confirm Your RSVP Now →',
  },
  {
    id: 'payment_reminder',
    label: 'Payment Pending / Fee Reminder',
    badge: 'Payment Pending',
    subject: 'Action Required: Pending Registration Payment for {team_name} | {event_title}',
    body: `Hello **{name}**,

We noticed that the registration payment and verification for your squad **{team_name}** is currently **pending** for **{event_title}**.

To confirm your squad's slot and unlock full participation in the hackathon, please complete the pending registration fee of **{amount}** and submit your UTR / transaction receipt.

**Important Note:** Team slots are allocated on a strictly limited basis. Unconfirmed registrations may be moved to the waitlist once the payment deadline passes.

If you have already transferred the fee, please reply to this email with your UTR proof so our organizing team can verify and approve your squad immediately.`,
    ctaText: 'Complete Registration Payment ({amount}) →',
  },
  {
    id: 'general',
    label: 'General Announcement',
    badge: 'Announcement',
    subject: 'Important Announcement regarding {event_title} | Hacker\'s Unity',
    body: `We have an important announcement regarding **{event_title}**!

Please make sure you and your squad members check the latest schedule, submission guidelines, and judging rubrics available on the event page.

If you have any questions or need mentor assistance, reach out in our Discord channels or reply directly to this email. Good luck!`,
    ctaText: 'Read Full Announcement →',
  },
];

export function EventEmailModal({
  isOpen,
  onClose,
  event,
  registrations,
  singleRecipient = null,
  targetTeam = null,
  initialSelectedIds = [],
  initialFilter = 'ALL',
}: EmailModalProps) {
  // Target Team squad mode
  const [activeTeam, setActiveTeam] = useState<any | null>(targetTeam || null);
  const [teamRecipientScope, setTeamRecipientScope] = useState<'ENTIRE_TEAM' | 'LEADER_ONLY'>('ENTIRE_TEAM');

  // Mode: single participant vs broadcast
  const [isSingleMode, setIsSingleMode] = useState<boolean>(Boolean(singleRecipient));
  const [recipientFilter, setRecipientFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'CUSTOM'>(
    initialSelectedIds.length > 0 ? 'CUSTOM' : initialFilter
  );

  // Selected template (default to payment_reminder if targeting an unpaid squad)
  const defaultTemplateId: TemplateType =
    targetTeam && targetTeam.isPaid === false ? 'payment_reminder' : 'selection';
  const initialTmpl = TEMPLATES.find((t) => t.id === defaultTemplateId) || TEMPLATES[0];

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>(defaultTemplateId);
  const [subject, setSubject] = useState<string>(initialTmpl.subject);
  const [bodyText, setBodyText] = useState<string>(() => textToHtml(initialTmpl.body));
  const [actionButtonText, setActionButtonText] = useState<string>(initialTmpl.ctaText);

  // Rich-text editor refs & format states
  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    h1: false,
    h2: false,
    ul: false,
    ol: false,
    left: false,
    center: false,
    right: false,
  });

  // Save current caret/selection range inside the editor
  const saveSelection = () => {
    if (typeof window === 'undefined') return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        savedSelectionRef.current = range.cloneRange();
      }
    }
  };

  // Inspect current formatting at selection for toolbar button highlighting
  const updateActiveFormats = () => {
    if (typeof document === 'undefined') return;
    try {
      const block = (document.queryCommandValue('formatBlock') || '').toLowerCase();
      setActiveFormats({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strike: document.queryCommandState('strikeThrough'),
        h1: block === 'h1',
        h2: block === 'h2',
        ul: document.queryCommandState('insertUnorderedList'),
        ol: document.queryCommandState('insertOrderedList'),
        left: document.queryCommandState('justifyLeft'),
        center: document.queryCommandState('justifyCenter'),
        right: document.queryCommandState('justifyRight'),
      });
    } catch {
      // Ignore when selection is outside active document
    }
  };

  // Execute formatting command on editor
  const runCommand = (cmd: string, val: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    }

    document.execCommand(cmd, false, val);
    if (editorRef.current) {
      setBodyText(editorRef.current.innerHTML);
    }
    saveSelection();
    updateActiveFormats();
  };

  // Toggle Heading 1 or Heading 2
  const toggleHeading = (level: 'h1' | 'h2') => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    }

    const currentBlock = (document.queryCommandValue('formatBlock') || '').toLowerCase();
    if (currentBlock === level) {
      document.execCommand('formatBlock', false, '<p>');
    } else {
      document.execCommand('formatBlock', false, `<${level}>`);
    }

    if (editorRef.current) {
      setBodyText(editorRef.current.innerHTML);
    }
    saveSelection();
    updateActiveFormats();
  };

  // Create hyperlink
  const handleCreateLink = () => {
    if (!editorRef.current) return;
    const url = prompt('Enter link URL (e.g. https://...):', 'https://');
    if (!url) return;

    editorRef.current.focus();
    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    }

    document.execCommand('createLink', false, url);
    if (editorRef.current) {
      setBodyText(editorRef.current.innerHTML);
    }
    saveSelection();
    updateActiveFormats();
  };

  // Recipient selection overrides
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>(
    singleRecipient
      ? [singleRecipient.id]
      : targetTeam
      ? (targetTeam.members || []).map((m: any) => m.id).filter(Boolean)
      : initialSelectedIds.length > 0
      ? initialSelectedIds
      : registrations.map((r) => r.id)
  );

  // Search in recipients list
  const [recipientSearch, setRecipientSearch] = useState('');
  const [showRecipientList, setShowRecipientList] = useState(false);

  // Preview tab toggle
  const [activeTab, setActiveTab] = useState<'compose' | 'preview'>('compose');

  // Test email state
  const [testEmailAddress, setTestEmailAddress] = useState('info@hackersunity.com');
  const [sendingTest, setSendingTest] = useState(false);
  const [testSuccessMsg, setTestSuccessMsg] = useState<string | null>(null);

  // Broadcast sending state
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    success: boolean;
    count?: number;
    message?: string;
    warning?: string;
  } | null>(null);

  // Identify Team Leader in active team
  const teamLeader = useMemo(() => {
    if (!activeTeam) return null;
    const members: any[] = activeTeam.members || [];
    const leaderEmail = (activeTeam.leaderEmail || '').toLowerCase().trim();

    if (leaderEmail) {
      const found = members.find((m) => (m.userEmail || '').toLowerCase().trim() === leaderEmail);
      if (found) return found;
    }

    const byRole = members.find((m) => {
      const r = (m.role || '').toLowerCase();
      return r === 'leader' || r.includes('lead');
    });
    if (byRole) return byRole;

    if (members.length > 0) return members[0];

    if (activeTeam.leaderEmail) {
      return {
        id: (activeTeam.id || activeTeam.teamName) + '-leader',
        userName: activeTeam.leaderName || 'Squad Leader',
        userEmail: activeTeam.leaderEmail,
        phone: activeTeam.leaderPhone,
        teamName: activeTeam.teamName,
        role: 'Leader',
        status: 'APPROVED',
      };
    }

    return null;
  }, [activeTeam]);

  // Handle template selection
  const handleSelectTemplate = (tmplId: TemplateType) => {
    setSelectedTemplate(tmplId);
    const tmpl = TEMPLATES.find((t) => t.id === tmplId);
    if (tmpl) {
      setSubject(tmpl.subject);
      const html = textToHtml(tmpl.body);
      setBodyText(html);
      if (editorRef.current) {
        editorRef.current.innerHTML = html;
      }
      setActionButtonText(tmpl.ctaText);
    }
  };

  // Calculate target audience based on squad mode, single mode, or filter
  const targetRecipients = useMemo(() => {
    if (activeTeam) {
      if (teamRecipientScope === 'LEADER_ONLY') {
        return teamLeader ? [teamLeader] : [];
      }
      return activeTeam.members && activeTeam.members.length > 0
        ? activeTeam.members
        : teamLeader
        ? [teamLeader]
        : [];
    }

    if (isSingleMode && singleRecipient) {
      return [singleRecipient];
    }

    if (recipientFilter === 'CUSTOM') {
      return registrations.filter((r) => selectedRecipientIds.includes(r.id));
    }

    if (recipientFilter === 'APPROVED') {
      return registrations.filter((r) => r.status === 'APPROVED' || r.status === 'CONFIRMED');
    }

    if (recipientFilter === 'PENDING') {
      return registrations.filter((r) => r.status === 'PENDING' || !r.status);
    }

    if (recipientFilter === 'REJECTED') {
      return registrations.filter((r) => r.status === 'REJECTED');
    }

    return registrations;
  }, [activeTeam, teamRecipientScope, teamLeader, isSingleMode, singleRecipient, recipientFilter, registrations, selectedRecipientIds]);

  // Filtered list for search box
  const searchFilteredList = useMemo(() => {
    const q = recipientSearch.toLowerCase().trim();
    if (!q) return targetRecipients;
    return targetRecipients.filter(
      (r: any) =>
        (r.userName && r.userName.toLowerCase().includes(q)) ||
        (r.userEmail && r.userEmail.toLowerCase().includes(q)) ||
        (r.college && r.college.toLowerCase().includes(q))
    );
  }, [targetRecipients, recipientSearch]);

  // Sync state whenever modal is opened or target props change
  useEffect(() => {
    if (isOpen) {
      setActiveTeam(targetTeam || null);
      setTeamRecipientScope('ENTIRE_TEAM');
      setIsSingleMode(Boolean(singleRecipient));
      setRecipientSearch('');
      setShowRecipientList(false);
      setSendResult(null);

      if (targetTeam) {
        const memberIds = (targetTeam.members || []).map((m: any) => m.id).filter(Boolean);
        setSelectedRecipientIds(memberIds);
        setRecipientFilter('CUSTOM');
        if (targetTeam.isPaid === false) {
          handleSelectTemplate('payment_reminder');
        } else {
          handleSelectTemplate('selection');
        }
      } else if (singleRecipient) {
        setSelectedRecipientIds([singleRecipient.id]);
        setRecipientFilter('CUSTOM');
        handleSelectTemplate('approval');
      } else if (initialSelectedIds && initialSelectedIds.length > 0) {
        setSelectedRecipientIds(initialSelectedIds);
        setRecipientFilter('CUSTOM');
      } else {
        setSelectedRecipientIds(registrations.map((r) => r.id));
        setRecipientFilter(initialFilter || 'ALL');
      }
    }
  }, [isOpen, targetTeam, singleRecipient, initialSelectedIds, initialFilter]);

  // Sync editor content with bodyText when opening or switching back to editor tab
  useEffect(() => {
    if (isOpen && activeTab === 'compose' && editorRef.current) {
      if (editorRef.current.innerHTML !== bodyText) {
        editorRef.current.innerHTML = bodyText;
      }
    }
  }, [isOpen, activeTab, selectedTemplate]);

  if (!isOpen || !event) return null;

  // Insert variable tag into body text at current cursor / selection
  const handleInsertTag = (tag: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    }

    document.execCommand('insertText', false, tag);
    if (editorRef.current) {
      setBodyText(editorRef.current.innerHTML);
    }
    saveSelection();
    updateActiveFormats();
  };

  // Handle dropping a dragged dynamic tag chip onto editor
  const handleDropTag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const tag = e.dataTransfer.getData('text/plain');
    if (!tag) return;

    if (!editorRef.current) return;
    editorRef.current.focus();

    let range: Range | null = null;
    if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(e.clientX, e.clientY);
    } else if ((document as any).caretPositionFromPoint) {
      const pos = (document as any).caretPositionFromPoint(e.clientX, e.clientY);
      if (pos) {
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
      }
    }

    if (range) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }

    document.execCommand('insertText', false, tag);
    if (editorRef.current) {
      setBodyText(editorRef.current.innerHTML);
    }
    saveSelection();
    updateActiveFormats();
  };

  // Sample preview helper resolution
  const previewRecipient = targetRecipients[0] || {
    userName: activeTeam?.leaderName || 'Aarav Sharma',
    userEmail: activeTeam?.leaderEmail || 'aarav.sharma@example.com',
    college: 'Government Engineering College, Ajmer',
    status: 'APPROVED',
  };

  const previewTeamName =
    (previewRecipient as any).teamName ||
    (previewRecipient as any).team_name ||
    activeTeam?.teamName ||
    `${previewRecipient.userName}'s Squad`;

  const previewAmount =
    (activeTeam && (activeTeam.paymentAmount ? `₹${activeTeam.paymentAmount}` : activeTeam.isPaid ? '₹0' : '₹800')) ||
    ((previewRecipient as any).paymentAmount ? `₹${(previewRecipient as any).paymentAmount}` : ((event as any)?.price ? `₹${(event as any).price}` : '₹800'));

  // Send a test email
  const handleSendTestEmail = async () => {
    if (!testEmailAddress) return;
    setSendingTest(true);
    setTestSuccessMsg(null);

    try {
      const res = await fetch('/api/event-broadcast-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          eventTitle: event.title,
          subject,
          bodyText,
          templateType: selectedTemplate,
          actionButtonText,
          isTest: true,
          testEmail: testEmailAddress,
          testRecipientName: previewRecipient?.userName || activeTeam?.leaderName || 'Chinmay Bhatt',
          testTeamName: previewTeamName,
          testCollege: previewRecipient?.college || '',
          testAmount: previewAmount,
          origin: typeof window !== 'undefined' ? window.location.origin : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestSuccessMsg(`Test email delivered to ${testEmailAddress}! Check your inbox.`);
        if (data.warning) {
          setTestSuccessMsg(data.warning);
        }
      } else {
        setTestSuccessMsg(`Failed: ${data.error || 'Check Resend credentials'}`);
      }
    } catch (err: any) {
      setTestSuccessMsg(`Request error: ${err.message}`);
    } finally {
      setSendingTest(false);
      setTimeout(() => setTestSuccessMsg(null), 6000);
    }
  };

  // Send broadcast / target emails
  const handleSendBroadcast = async () => {
    if (targetRecipients.length === 0) return;
    setIsSending(true);
    setSendResult(null);

    try {
      const payloadRecipients = targetRecipients.map((r: any) => ({
        name: r.userName,
        email: r.userEmail,
        teamName: (r as any).teamName || (r as any).team_name || (activeTeam ? activeTeam.teamName : r.userName),
        college: r.college,
        status: r.status,
        amount: (activeTeam && (activeTeam.paymentAmount || (activeTeam.isPaid ? 0 : 800))) || (r as any).paymentAmount || ((event as any)?.price ? (event as any).price : 800),
      }));

      const res = await fetch('/api/event-broadcast-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          eventTitle: event.title,
          recipients: payloadRecipients,
          subject,
          bodyText,
          templateType: selectedTemplate,
          actionButtonText,
          isTest: false,
          origin: typeof window !== 'undefined' ? window.location.origin : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSendResult({
          success: true,
          count: data.sentCount || payloadRecipients.length,
          message: `Successfully sent email to ${data.sentCount || payloadRecipients.length} participants!`,
          warning: data.warning || data.message,
        });
      } else {
        setSendResult({
          success: false,
          message: data.error || 'Failed to dispatch emails. Please verify Resend credentials.',
        });
      }
    } catch (err: any) {
      setSendResult({
        success: false,
        message: err.message || 'Network error while dispatching broadcast.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const previewSubject = subject
    .replace(/\{name\}/gi, previewRecipient.userName)
    .replace(/\{user\}/gi, previewRecipient.userName)
    .replace(/\{team_name\}/gi, previewTeamName)
    .replace(/\{team\}/gi, previewTeamName)
    .replace(/\{event_title\}/gi, event.title)
    .replace(/\{event\}/gi, event.title)
    .replace(/\{amount\}/gi, String(previewAmount))
    .replace(/\{college\}/gi, previewRecipient.college || 'Participant')
    .replace(/\{status\}/gi, previewRecipient.status || 'Registered');

  const previewBody = bodyText
    .replace(/\{name\}/gi, previewRecipient.userName)
    .replace(/\{user\}/gi, previewRecipient.userName)
    .replace(/\{team_name\}/gi, previewTeamName)
    .replace(/\{team\}/gi, previewTeamName)
    .replace(/\{event_title\}/gi, event.title)
    .replace(/\{event\}/gi, event.title)
    .replace(/\{amount\}/gi, String(previewAmount))
    .replace(/\{college\}/gi, previewRecipient.college || 'Participant')
    .replace(/\{status\}/gi, previewRecipient.status || 'Registered');

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-end animate-in fade-in duration-200">
      {/* Right Slide-Over Drawer Container (similar to Unstop) */}
      <div className="w-full max-w-2xl h-full bg-white dark:bg-[#0c1017] border-l border-slate-200 dark:border-white/[0.08] shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* ─── 1. Header ────────────────────────────────────────── */}
        <div className="p-5 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/80 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0099e6]/10 border border-[#0099e6]/20 flex items-center justify-center text-[#0099e6]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Send Email to Participants
                <span className="px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] text-[10px] font-bold border border-sky-200 dark:border-sky-800/40 font-mono">
                  From: info@hackersunity.com
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                Event: <strong className="text-slate-800 dark:text-slate-200">{event.title}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── 2. Scrollable Body ───────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* Status Alert if send finished */}
          {sendResult && (
            <div
              className={`p-4 rounded-2xl border text-xs flex flex-col gap-2 ${
                sendResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {sendResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
                <span>{sendResult.message}</span>
              </div>
              {sendResult.warning && (
                <div className="text-[11px] opacity-90 pl-6 bg-black/5 dark:bg-white/5 p-2 rounded-lg">
                  {sendResult.warning}
                </div>
              )}
            </div>
          )}

          {/* Audience Filter Bar: Squad Mode vs Single vs Broadcast */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] space-y-3">
            {activeTeam ? (
              /* Squad Mode with Leader vs Entire Squad Toggle */
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-[#0099e6]/10 text-[#0099e6] flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                        <span>Squad: <strong className="text-[#0099e6]">{activeTeam.teamName}</strong></span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-white/[0.08] text-[10px] text-slate-700 dark:text-slate-300 font-mono font-bold">
                          {activeTeam.members?.length || 0} members
                        </span>
                        {activeTeam.isPaid ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800/40">
                            ● Payment Confirmed
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-200 dark:border-amber-800/40">
                            ● Payment Pending
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {targetRecipients.length} {targetRecipients.length === 1 ? 'recipient targeted' : 'recipients targeted'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTeam(null);
                      setSelectedRecipientIds(registrations.map((r) => r.id));
                      setRecipientFilter('ALL');
                    }}
                    className="text-xs font-semibold text-[#0099e6] hover:underline cursor-pointer"
                  >
                    Switch to All Event Participants
                  </button>
                </div>

                {/* Option to send to Whole Team or Leader Only */}
                <div className="space-y-1.5 pt-1">
                  <div className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    Send email to:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Option 1: Entire Squad */}
                    <button
                      type="button"
                      onClick={() => setTeamRecipientScope('ENTIRE_TEAM')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        teamRecipientScope === 'ENTIRE_TEAM'
                          ? 'bg-sky-50/80 dark:bg-sky-950/40 border-[#0099e6] text-[#0099e6] shadow-2xs'
                          : 'bg-white dark:bg-[#0c1017] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
                          teamRecipientScope === 'ENTIRE_TEAM'
                            ? 'border-[#0099e6] bg-[#0099e6]'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {teamRecipientScope === 'ENTIRE_TEAM' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#0099e6]" />
                          <span>Entire Team / Squad</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-sky-100 dark:bg-sky-950/60 text-[#0099e6] text-[10px] font-black font-mono">
                            {activeTeam.members?.length || 0}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Send to all {activeTeam.members?.length || 0} registered members of {activeTeam.teamName}
                        </div>
                      </div>
                    </button>

                    {/* Option 2: Team Leader Only */}
                    <button
                      type="button"
                      onClick={() => setTeamRecipientScope('LEADER_ONLY')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        teamRecipientScope === 'LEADER_ONLY'
                          ? 'bg-sky-50/80 dark:bg-sky-950/40 border-[#0099e6] text-[#0099e6] shadow-2xs'
                          : 'bg-white dark:bg-[#0c1017] border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0 ${
                          teamRecipientScope === 'LEADER_ONLY'
                            ? 'border-[#0099e6] bg-[#0099e6]'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {teamRecipientScope === 'LEADER_ONLY' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                          <span>Team Leader Only</span>
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-black font-mono">
                            1
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                          {teamLeader?.userName || activeTeam.leaderName || 'Leader'} ({teamLeader?.userEmail || activeTeam.leaderEmail || 'No email'})
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Collapsible View / search squad contacts */}
                <button
                  type="button"
                  onClick={() => setShowRecipientList(!showRecipientList)}
                  className="pt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 hover:text-[#0099e6] cursor-pointer"
                >
                  {showRecipientList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{showRecipientList ? 'Hide squad contact details' : `View selected squad contacts (${targetRecipients.length})`}</span>
                </button>

                {showRecipientList && (
                  <div className="mt-2 p-3 rounded-xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] space-y-2">
                    <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.04]">
                      {targetRecipients.map((rec: any) => {
                        const isLeader =
                          (teamLeader && rec.userEmail && teamLeader.userEmail && rec.userEmail.toLowerCase() === teamLeader.userEmail.toLowerCase()) ||
                          (rec.role && rec.role.toLowerCase().includes('lead'));
                        return (
                          <div key={rec.id || rec.userEmail} className="py-1.5 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                <span>{rec.userName}</span>
                                {isLeader && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 flex items-center gap-0.5">
                                    <Crown className="w-2.5 h-2.5" /> Leader
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">{rec.userEmail}</div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-500">
                              {rec.status || 'Active'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#0099e6]" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Target Audience ({targetRecipients.length} Candidates Selected)
                    </span>
                  </div>

                  {singleRecipient && (
                    <button
                      type="button"
                      onClick={() => setIsSingleMode(!isSingleMode)}
                      className="text-xs font-semibold text-[#0099e6] hover:underline cursor-pointer"
                    >
                      {isSingleMode ? 'Switch to All Participants' : 'Switch to Single'}
                    </button>
                  )}
                </div>

                {/* If Single Mode */}
                {isSingleMode && singleRecipient ? (
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08]">
                    <div className="w-7 h-7 rounded-full bg-[#0099e6]/20 text-[#0099e6] font-bold text-xs flex items-center justify-center font-mono">
                      {singleRecipient.userName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        TO: {singleRecipient.userName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono truncate">
                        {singleRecipient.userEmail}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300">
                      {singleRecipient.status}
                    </span>
                  </div>
                ) : (
                  /* If Broadcast Mode: Status Filters */
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      Filter Candidates by Status:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'ALL', label: `All (${registrations.length})` },
                        {
                          id: 'APPROVED',
                          label: `Approved (${
                            registrations.filter((r) => r.status === 'APPROVED' || r.status === 'CONFIRMED').length
                          })`,
                        },
                        {
                          id: 'PENDING',
                          label: `None / Pending (${
                            registrations.filter((r) => r.status === 'PENDING' || !r.status).length
                          })`,
                        },
                        {
                          id: 'REJECTED',
                          label: `Rejected (${registrations.filter((r) => r.status === 'REJECTED').length})`,
                        },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setRecipientFilter(tab.id as any)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            recipientFilter === tab.id
                              ? 'bg-[#0099e6] text-white shadow-2xs'
                              : 'bg-white dark:bg-[#0c1017] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Collapsible View / Edit List */}
                    <button
                      type="button"
                      onClick={() => setShowRecipientList(!showRecipientList)}
                      className="pt-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1 hover:text-[#0099e6] cursor-pointer"
                    >
                      {showRecipientList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      <span>{showRecipientList ? 'Hide contact details' : 'View / search selected contacts'}</span>
                    </button>

                    {showRecipientList && (
                      <div className="mt-2 p-3 rounded-xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] space-y-2">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Search candidates..."
                            value={recipientSearch}
                            onChange={(e) => setRecipientSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-[#121824] rounded-lg text-xs outline-none border border-slate-200 dark:border-white/[0.06]"
                          />
                        </div>

                        <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-white/[0.04]">
                          {searchFilteredList.map((rec: any) => (
                            <div key={rec.id} className="py-1.5 flex items-center justify-between text-xs">
                              <div>
                                <div className="font-bold text-slate-800 dark:text-slate-200">{rec.userName}</div>
                                <div className="text-[11px] text-slate-500 font-mono">{rec.userEmail}</div>
                              </div>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-500">
                                {rec.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ─── 3. Template & Subject Selector ─────────────────────── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0099e6]" /> Select Email Type / Preset
              </label>

              {/* Tabs: Compose vs Preview */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.06] p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveTab('compose')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'compose'
                      ? 'bg-white dark:bg-[#121824] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Editor
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeTab === 'preview'
                      ? 'bg-white dark:bg-[#121824] text-[#0099e6] shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Eye className="w-3 h-3" /> Live Preview
                </button>
              </div>
            </div>

            {/* Template Selector Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TEMPLATES.map((tmpl) => {
                const getTemplateIcon = (id: TemplateType) => {
                  switch (id) {
                    case 'selection':
                      return <Users className="w-4 h-4 text-[#0099e6]" />;
                    case 'approval':
                      return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
                    case 'rejection':
                      return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />;
                    case 'certificate':
                      return <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
                    case 'rsvp':
                      return <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
                    case 'payment_reminder':
                      return <CreditCard className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
                    case 'general':
                      return <Bell className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
                    default:
                      return <Mail className="w-4 h-4 text-slate-500" />;
                  }
                };

                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      selectedTemplate === tmpl.id
                        ? 'bg-[#0099e6]/10 border-[#0099e6] text-slate-900 dark:text-white shadow-xs'
                        : 'bg-white dark:bg-[#0c1017] border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {getTemplateIcon(tmpl.id)}
                      <span className="text-xs font-bold truncate">{tmpl.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 truncate">{tmpl.badge}</span>
                  </button>
                );
              })}
            </div>

            {/* Email Subject Field */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Email Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject line..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white font-medium outline-none focus:border-[#0099e6]"
              />

              {/* Quick Subject Suggestion Chips (Includes Payment Pending as requested) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                    Suggestions:
                  </span>
                  {TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tmpl.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer border ${
                        selectedTemplate === tmpl.id
                          ? 'bg-[#0099e6] text-white border-[#0099e6] shadow-xs'
                          : tmpl.id === 'payment_reminder'
                          ? 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/50'
                          : 'bg-slate-100 hover:bg-sky-50 dark:bg-white/[0.06] dark:hover:bg-sky-950/30 text-slate-600 hover:text-[#0099e6] dark:text-slate-300 border-slate-200 dark:border-white/[0.08]'
                      }`}
                    >
                      {tmpl.badge}
                    </button>
                  ))}
                </div>

                {/* Additional Quick Subject Presets specifically for Payment Pending */}
                {selectedTemplate === 'payment_reminder' && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1.5 animate-in fade-in duration-150">
                    <div className="text-[10px] font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-amber-600" />
                      <span>Pending payment subject suggestions (click to use):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Action Required: Pending Registration Payment for {team_name} | {event_title}',
                        'Urgent Reminder: Complete payment to confirm slot for {event_title}',
                        'Pending Registration Fee & UTR Verification for {team_name}',
                        'Action Required: Complete your team registration payment for {event_title}',
                      ].map((subOption) => (
                        <button
                          key={subOption}
                          type="button"
                          onClick={() => setSubject(subOption)}
                          className={`text-[10px] text-left px-2 py-1 rounded-md transition-colors cursor-pointer border ${
                            subject === subOption
                              ? 'bg-amber-600 text-white font-bold border-amber-600 shadow-2xs'
                              : 'bg-white dark:bg-[#0c1017] text-amber-900 dark:text-amber-200 border-amber-200 dark:border-amber-800/40 hover:bg-amber-100 dark:hover:bg-amber-950/50'
                          }`}
                        >
                          {subOption}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Variable Chips (Draggable to any position, or click to insert at cursor) */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-[#0099e6]" />
                  <span>Dynamic Tags</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">
                  Drag &amp; drop anywhere into body, or click to place at cursor
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { tag: '{name}', label: 'Hacker Name' },
                  { tag: '{team_name}', label: 'Team Name' },
                  { tag: '{event_title}', label: 'Event Title' },
                  { tag: '{amount}', label: 'Fee / Amount' },
                  { tag: '{college}', label: 'College' },
                  { tag: '{status}', label: 'Status' },
                  { tag: '{rsvp_url}', label: 'RSVP Mini Form Link' },
                ].map(({ tag, label }) => (
                  <div
                    key={tag}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', tag);
                      e.dataTransfer.effectAllowed = 'copy';
                    }}
                    onClick={() => handleInsertTag(tag)}
                    title={`Drag into body or click to insert ${tag} (${label})`}
                    className="group px-2.5 py-1 rounded-lg bg-white dark:bg-[#0c1017] hover:bg-sky-50 dark:hover:bg-sky-950/40 text-[11px] font-mono font-bold text-[#0099e6] border border-slate-200 dark:border-white/[0.1] shadow-2xs cursor-grab active:cursor-grabbing hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 select-none"
                  >
                    <GripVertical className="w-3 h-3 text-slate-400 group-hover:text-[#0099e6] transition-colors" />
                    <span>+{tag}</span>
                    <span className="text-[9px] text-slate-400 font-sans font-normal hidden sm:inline">
                      ({label})
                    </span>
                  </div>
                ))}
              </div>

              {/* RSVP Form Preview Notice */}
              {selectedTemplate === 'rsvp' && (
                <div className="mt-2.5 p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-[11px] text-orange-950 dark:text-orange-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span>
                      RSVP Flow Active: The CTA button will automatically open the interactive <strong>RSVP Mini Form</strong> pre-filled with each candidate&apos;s Team Name, Name, and Email.
                    </span>
                  </div>
                  <a
                    href={`/rsvp?eventId=${encodeURIComponent(event.id)}&eventTitle=${encodeURIComponent(event.title)}&name=${encodeURIComponent(previewRecipient.userName)}&team=${encodeURIComponent((previewRecipient as any).teamName || `${previewRecipient.userName}'s Squad`)}&email=${encodeURIComponent(previewRecipient.userEmail)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] shrink-0 inline-flex items-center gap-1 transition-colors"
                  >
                    <span>Test Form</span>
                    <Eye className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Editor or Preview Pane */}
            {activeTab === 'compose' ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Email Message Body (Rich Text)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    Supports rich styling &amp; drag-and-drop tags
                  </span>
                </div>

                {/* Rich Text Formatting Toolbar */}
                <div className="flex items-center flex-wrap gap-1 p-2 bg-slate-100/90 dark:bg-[#151c2c] border border-slate-200 dark:border-white/[0.08] rounded-t-xl">
                  {/* Undo / Redo */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand('undo');
                    }}
                    title="Undo (Ctrl+Z)"
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    <Undo className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand('redo');
                    }}
                    title="Redo (Ctrl+Y)"
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    <Redo className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/[0.1] mx-0.5" />

                  {/* Character Styles */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand('bold');
                    }}
                    title="Bold"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeFormats.bold
                        ? 'bg-[#0099e6] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand('italic');
                    }}
                    title="Italic"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeFormats.italic
                        ? 'bg-[#0099e6] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand('underline');
                    }}
                    title="Underline"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeFormats.underline
                        ? 'bg-[#0099e6] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    <Underline className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand('strikeThrough');
                    }}
                    title="Strikethrough"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeFormats.strike
                        ? 'bg-[#0099e6] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    <Strikethrough className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/[0.1] mx-0.5" />

                  {/* Headings */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      toggleHeading('h1');
                    }}
                    title="Heading 1"
                    className={`px-1.5 py-1 rounded-lg text-[11px] font-black transition-colors cursor-pointer flex items-center gap-0.5 ${
                      activeFormats.h1
                        ? 'bg-[#0099e6] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    <Heading1 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      toggleHeading('h2');
                    }}
                    title="Heading 2"
                    className={`px-1.5 py-1 rounded-lg text-[11px] font-black transition-colors cursor-pointer flex items-center gap-0.5 ${
                      activeFormats.h2
                        ? 'bg-[#0099e6] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    <Heading2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/[0.1] mx-0.5" />

                  {/* Lists */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand('insertUnorderedList');
                    }}
                    title="Bullet List"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeFormats.ul
                        ? 'bg-[#0099e6] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand('insertOrderedList');
                    }}
                    title="Numbered List"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeFormats.ol
                        ? 'bg-[#0099e6] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/[0.1] mx-0.5" />

                  {/* Alignment */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand('justifyLeft');
                    }}
                    title="Align Left"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeFormats.left
                        ? 'bg-[#0099e6] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand('justifyCenter');
                    }}
                    title="Align Center"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeFormats.center
                        ? 'bg-[#0099e6] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand('justifyRight');
                    }}
                    title="Align Right"
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      activeFormats.right
                        ? 'bg-[#0099e6] text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08]'
                    }`}
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/[0.1] mx-0.5" />

                  {/* Link & Clear Format */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleCreateLink();
                    }}
                    title="Insert Link"
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    <LinkIcon className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      runCommand('removeFormat');
                    }}
                    title="Clear Formatting"
                    className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    <RemoveFormatting className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* ContentEditable Rich Text Area with Drag & Drop */}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={() => {
                    if (editorRef.current) {
                      setBodyText(editorRef.current.innerHTML);
                    }
                    updateActiveFormats();
                  }}
                  onKeyUp={() => {
                    saveSelection();
                    updateActiveFormats();
                  }}
                  onMouseUp={() => {
                    saveSelection();
                    updateActiveFormats();
                  }}
                  onFocus={() => {
                    saveSelection();
                    updateActiveFormats();
                  }}
                  onBlur={() => {
                    saveSelection();
                  }}
                  onDragEnter={() => setIsDraggingOver(true)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                  }}
                  onDragLeave={() => setIsDraggingOver(false)}
                  onDrop={handleDropTag}
                  className={`w-full min-h-[220px] max-h-[360px] overflow-y-auto p-4 bg-slate-50 dark:bg-[#121824] border border-t-0 rounded-b-xl text-xs text-slate-900 dark:text-white font-sans leading-relaxed outline-none transition-all prose prose-sm dark:prose-invert max-w-none [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-base [&_h1]:font-black [&_h2]:text-sm [&_h2]:font-bold [&_a]:text-[#0099e6] [&_a]:underline ${
                    isDraggingOver
                      ? 'border-[#0099e6] ring-2 ring-[#0099e6]/30 bg-sky-50/50 dark:bg-sky-950/20'
                      : 'border-slate-200 dark:border-white/[0.08] focus:border-[#0099e6]'
                  }`}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Call to Action Button Text</label>
                    <input
                      type="text"
                      value={actionButtonText}
                      onChange={(e) => setActionButtonText(e.target.value)}
                      placeholder="e.g. Open Event Dashboard"
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] rounded-lg text-xs text-slate-900 dark:text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500">Sender Identity</label>
                    <div className="px-3 py-1.5 bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] rounded-lg text-xs font-mono text-slate-600 dark:text-slate-300 flex items-center justify-between">
                      <span>info@hackersunity.com</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Live Preview Card */
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500">
                  Live Recipient Preview (Sample: {previewRecipient.userName})
                </label>
                <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.1] shadow-lg space-y-4">
                  {/* Email header inside preview */}
                  <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black">Hacker&apos;s Unity</div>
                      <div className="text-[10px] text-sky-400 font-medium">{event.title}</div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold">
                      {selectedTemplate.toUpperCase()}
                    </span>
                  </div>

                  <div className="font-bold text-sm text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/[0.06] pb-2">
                    Subject: {previewSubject}
                  </div>

                  <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                    <p className="font-bold mb-3 text-slate-900 dark:text-white">
                      Hi {previewRecipient.userName},
                    </p>
                    <div
                      className="space-y-3 prose prose-sm dark:prose-invert max-w-none [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-base [&_h1]:font-black [&_h2]:text-sm [&_h2]:font-bold [&_a]:text-[#0099e6] [&_a]:underline"
                      dangerouslySetInnerHTML={{ __html: previewBody }}
                    />
                  </div>

                  {/* Highlight Info Box for Payment Pending in Preview */}
                  {selectedTemplate === 'payment_reminder' && (
                    <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-xs flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">
                          Pending Due
                        </div>
                        <div className="text-sm font-black text-amber-700 dark:text-amber-300">
                          {previewAmount}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 font-medium">Squad</div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{previewTeamName}</div>
                      </div>
                    </div>
                  )}

                  {/* CTA button inside preview */}
                  <div className="pt-2 text-center">
                    <span className={`inline-block px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-md ${
                      selectedTemplate === 'payment_reminder' ? 'bg-amber-600' : 'bg-[#0099e6]'
                    }`}>
                      {actionButtonText.replace(/\{amount\}/gi, String(previewAmount))}
                    </span>
                  </div>

                  <div className="text-center text-[10px] text-slate-400 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                    Sent by Hacker&apos;s Unity on behalf of {event.title} organizers • Reply to: info@hackersunity.com
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── 4. Footer Actions Bar ─────────────────────────────── */}
        <div className="p-4 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50/90 dark:bg-[#0c1017] flex flex-col gap-3">
          
          {/* Send Test Email Row */}
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              placeholder="Enter test email address..."
              className="flex-1 px-3 py-1.5 bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white outline-none"
            />
            <button
              type="button"
              onClick={handleSendTestEmail}
              disabled={sendingTest || !testEmailAddress}
              className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/[0.08] dark:hover:bg-white/[0.15] text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
            >
              {sendingTest ? 'Sending Test...' : 'Send Test Email'}
            </button>
          </div>

          {testSuccessMsg && (
            <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {testSuccessMsg}
            </div>
          )}

          {/* Bottom Primary Action Buttons */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSendBroadcast}
              disabled={isSending || targetRecipients.length === 0}
              className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedTemplate === 'payment_reminder'
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                  : 'bg-[#0099e6] hover:bg-[#0088cc]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isSending
                  ? 'Dispatching Emails...'
                  : activeTeam
                  ? teamRecipientScope === 'LEADER_ONLY'
                    ? 'Send Email to Team Leader (1 Candidate)'
                    : `Send Email to Entire Squad (${targetRecipients.length} Candidates)`
                  : `Send Email to ${targetRecipients.length} ${
                      targetRecipients.length === 1 ? 'Candidate' : 'Candidates'
                    }`}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
