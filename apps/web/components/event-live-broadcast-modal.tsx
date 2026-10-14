'use client';

import { useState } from 'react';
import {
  X,
  Send,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Eye,
  Radio,
} from 'lucide-react';
import { ExtendedEvent } from '@/lib/mock-data';

export interface LiveBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: ExtendedEvent | null;
}

export function EventLiveBroadcastModal({
  isOpen,
  onClose,
  event,
}: LiveBroadcastModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'preview'>('info');
  const [testEmail, setTestEmail] = useState('info@hackersunity.com');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{
    success: boolean;
    count?: number;
    message?: string;
    warning?: string;
  } | null>(null);

  if (!isOpen || !event) return null;

  const category = (event.category || 'HACKATHON').toUpperCase();
  const alreadyAnnounced = Array.isArray(event.tags) && event.tags.includes('hu_live_announced:true');

  const handleSendTest = async () => {
    if (!testEmail) return;
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/events/broadcast-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          slug: event.slug,
          isTest: true,
          testEmail,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: `Test email successfully sent to ${testEmail}! Check your inbox.`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to dispatch test email.',
        });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Network error' });
    } finally {
      setIsSendingTest(false);
      setTimeout(() => setTestResult(null), 8000);
    }
  };

  const handleBroadcastAll = async (force: boolean = false) => {
    setIsBroadcasting(true);
    setBroadcastResult(null);

    try {
      const res = await fetch('/api/events/broadcast-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          slug: event.slug,
          isTest: false,
          force,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setBroadcastResult({
          success: true,
          count: data.recipientCount || data.sentCount,
          message: data.message || 'Broadcast dispatched successfully to all registered users!',
          warning: data.warning,
        });
      } else {
        setBroadcastResult({
          success: false,
          message: data.error || 'Failed to dispatch broadcast email.',
        });
      }
    } catch (err: any) {
      setBroadcastResult({
        success: false,
        message: err.message || 'Network error while dispatching broadcast.',
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-[#0c1017] rounded-3xl border border-slate-200 dark:border-white/[0.08] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-white/[0.08] flex items-center justify-between bg-slate-50/80 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                Announce Live Event to Platform
                <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 text-[10px] font-bold border border-amber-200 dark:border-amber-800/40">
                  {category}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm">
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

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* Status Alert if Broadcast Sent */}
          {broadcastResult && (
            <div
              className={`p-4 rounded-2xl border text-xs flex flex-col gap-2 ${
                broadcastResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/40 text-red-800 dark:text-red-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                {broadcastResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span>{broadcastResult.message}</span>
              </div>
              {broadcastResult.warning && (
                <div className="text-[11px] opacity-90 pl-6 bg-black/5 dark:bg-white/5 p-2 rounded-lg">
                  {broadcastResult.warning}
                </div>
              )}
            </div>
          )}

          {/* Broadcast Information Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#0099e6]" /> Target Audience
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#0099e6]/10 text-[#0099e6] font-bold text-[11px]">
                All Logged-in Platform Users (public.profiles)
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Dispatches a branded email announcement to <strong>every verified member who has logged into Hacker&apos;s Unity</strong>. Contains the event banner, prize pool, deadline, and a direct 1-click registration link.
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>
                Broadcast Status:{' '}
                {alreadyAnnounced ? (
                  <strong className="text-emerald-600 dark:text-emerald-400">Already Broadcasted Once</strong>
                ) : (
                  <strong className="text-amber-600 dark:text-amber-400">Ready to Send (Automated on Live)</strong>
                )}
              </span>
            </div>
          </div>

          {/* Test Email Row */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Send Preview / Test Email First
            </label>
            <div className="flex items-center gap-2">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter test email address..."
                className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:border-[#0099e6]"
              />
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isSendingTest || !testEmail}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.08] dark:hover:bg-white/[0.15] text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
              >
                {isSendingTest ? 'Sending...' : 'Send Test'}
              </button>
            </div>
            {testResult && (
              <div
                className={`text-[11px] font-semibold pt-1 ${
                  testResult.success
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {testResult.message}
              </div>
            )}
          </div>

          {/* Sender Identity Info */}
          <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-xs font-mono text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Sender: info@hackersunity.com</span>
            </div>
            <span className="text-[10px] text-slate-400 font-sans">Official Platform Verified</span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-white/[0.08] bg-slate-50/90 dark:bg-[#0c1017] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            type="button"
            onClick={() => handleBroadcastAll(alreadyAnnounced)}
            disabled={isBroadcasting}
            className="px-5 py-2.5 rounded-xl bg-linear-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {isBroadcasting
                ? 'Dispatching Announcement...'
                : alreadyAnnounced
                ? 'Re-broadcast to Platform Users'
                : 'Send Live Announcement to All Users'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
}
