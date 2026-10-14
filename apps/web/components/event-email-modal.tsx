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
  initialSelectedIds?: string[];
  initialFilter?: 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED';
}

type TemplateType =
  | 'selection'
  | 'approval'
  | 'rejection'
  | 'certificate'
  | 'rsvp'
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
  initialSelectedIds = [],
  initialFilter = 'ALL',
}: EmailModalProps) {
  // Mode: single participant vs broadcast
  const [isSingleMode, setIsSingleMode] = useState<boolean>(Boolean(singleRecipient));
  const [recipientFilter, setRecipientFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'CUSTOM'>(
    initialSelectedIds.length > 0 ? 'CUSTOM' : initialFilter
  );

  // Selected template
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('selection');
  const [subject, setSubject] = useState<string>(TEMPLATES[0].subject);
  const [bodyText, setBodyText] = useState<string>(() => textToHtml(TEMPLATES[0].body));
  const [actionButtonText, setActionButtonText] = useState<string>(TEMPLATES[0].ctaText);

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

  // Calculate target audience based on filter or single mode
  const targetRecipients = useMemo(() => {
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
  }, [isSingleMode, singleRecipient, recipientFilter, registrations, selectedRecipientIds]);

  // Filtered list for search box
  const searchFilteredList = useMemo(() => {
    const q = recipientSearch.toLowerCase().trim();
    if (!q) return targetRecipients;
    return targetRecipients.filter(
      (r) =>
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        (r.college && r.college.toLowerCase().includes(q))
    );
  }, [targetRecipients, recipientSearch]);

  // Sync editor content with bodyText when opening or switching back to editor tab
  useEffect(() => {
    if (isOpen && activeTab === 'compose' && editorRef.current) {
      if (editorRef.current.innerHTML !== bodyText) {
        editorRef.current.innerHTML = bodyText;
      }
    }
  }, [isOpen, activeTab, selectedTemplate]);

  if (!isOpen || !event) return null;

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
          testRecipientName: previewRecipient?.userName || 'Chinmay Bhatt',
          testTeamName: (previewRecipient as any)?.teamName || 'hcj',
          testCollege: previewRecipient?.college || '',
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
      const payloadRecipients = targetRecipients.map((r) => ({
        name: r.userName,
        email: r.userEmail,
        teamName: (r as any).teamName || (r as any).team_name || r.userName,
        college: r.college,
        status: r.status,
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

  // Sample preview rendering
  const previewRecipient = targetRecipients[0] || {
    userName: 'Aarav Sharma',
    userEmail: 'aarav.sharma@example.com',
    college: 'IIT Bombay',
    status: 'APPROVED',
  };

  const previewSubject = subject
    .replace(/\{name\}/gi, previewRecipient.userName)
    .replace(/\{user\}/gi, previewRecipient.userName)
    .replace(/\{team_name\}/gi, (previewRecipient as any).teamName || `${previewRecipient.userName}'s Squad`)
    .replace(/\{team\}/gi, `${previewRecipient.userName}'s Squad`)
    .replace(/\{event_title\}/gi, event.title);

  const previewBody = bodyText
    .replace(/\{name\}/gi, previewRecipient.userName)
    .replace(/\{user\}/gi, previewRecipient.userName)
    .replace(/\{team_name\}/gi, (previewRecipient as any).teamName || `${previewRecipient.userName}'s Squad`)
    .replace(/\{team\}/gi, `${previewRecipient.userName}'s Squad`)
    .replace(/\{event_title\}/gi, event.title)
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

          {/* Audience Filter Bar (Unstop style) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] space-y-3">
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
                      {searchFilteredList.map((rec) => (
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

              {/* Quick Subject Suggestion Chips (As requested by user) */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-0.5">
                  Suggestions:
                </span>
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => handleSelectTemplate(tmpl.id)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-sky-50 dark:bg-white/[0.06] dark:hover:bg-sky-950/30 text-slate-600 hover:text-[#0099e6] dark:text-slate-300 transition-colors cursor-pointer border border-slate-200 dark:border-white/[0.08]"
                  >
                    {tmpl.badge}
                  </button>
                ))}
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

                  {/* CTA button inside preview */}
                  <div className="pt-2 text-center">
                    <span className="inline-block px-5 py-2.5 rounded-xl bg-[#0099e6] text-white font-bold text-xs shadow-md">
                      {actionButtonText}
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
              className="px-5 py-2.5 rounded-xl bg-[#0099e6] hover:bg-[#0088cc] text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isSending
                  ? 'Dispatching Emails...'
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
