'use client';

import React, { useState } from 'react';
import {
  ProfileCompletionResult,
  calculateProfileCompletion,
} from '@/lib/profile-completion';
import { CertificateModal } from './CertificateModal';
import { Award, CheckCircle2, ChevronRight, Sparkles, AlertCircle } from 'lucide-react';

interface ProfileCompletionWidgetProps {
  user: any;
  currentFormValues?: any;
  onNavigateTab?: (tab: 'profile' | 'socials') => void;
  variant?: 'card' | 'badge' | 'avatar-only';
  className?: string;
}

export function ProfileProgressAvatar({
  avatarUrl,
  name,
  percentage,
  size = 54,
  strokeWidth = 3.5,
  onClick,
}: {
  avatarUrl?: string | null;
  name?: string | null;
  percentage: number;
  size?: number;
  strokeWidth?: number;
  onClick?: () => void;
}) {
  const isComplete = percentage >= 100;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const rawId = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const gradId = `ring-grad-${rawId}`;

  return (
    <div
      className="relative shrink-0 select-none group cursor-pointer"
      style={{ width: size, height: size }}
      onClick={onClick}
      title={`Profile: ${percentage}% Complete${isComplete ? ' (Certificate Unlocked!)' : ''}`}
    >
      {/* SVG Progress Ring */}
      <svg
        className="w-full h-full -rotate-90 overflow-visible transition-all duration-700"
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0099e6" />
            <stop offset="50%" stopColor="#0a9ed9" />
            <stop offset="100%" stopColor="#f58220" />
          </linearGradient>
        </defs>

        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-200 dark:text-white/[0.1]"
          strokeWidth={strokeWidth}
        />

        {/* Animated Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${
            isComplete ? 'filter drop-shadow-[0_0_4px_rgba(245,130,32,0.6)]' : ''
          }`}
        />
      </svg>

      {/* Inner Avatar Box */}
      <div
        className="absolute inset-[4px] rounded-full overflow-hidden bg-[#0099e6] flex items-center justify-center text-white font-black text-sm shadow-inner transition-transform group-hover:scale-105"
      >
        {avatarUrl && avatarUrl.startsWith('http') ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={avatarUrl} alt={name || 'Hacker'} className="w-full h-full object-cover" />
        ) : avatarUrl && avatarUrl.length > 2 && avatarUrl !== '⚡' ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={avatarUrl} alt={name || 'Hacker'} className="w-full h-full object-cover" />
        ) : (
          <span>{(name?.charAt(0) || 'H').toUpperCase()}</span>
        )}
      </div>

      {/* 100% Complete Floating Medal / Checkmark Badge */}
      {isComplete ? (
        <div
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-tr from-[#0099e6] to-[#f58220] text-white flex items-center justify-center shadow-md border-2 border-white dark:border-[#0c1017] animate-in zoom-in-75 duration-300"
          title="100% Complete"
        >
          <Award className="w-3 h-3" />
        </div>
      ) : percentage > 0 ? (
        <div
          className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-full bg-slate-900 text-[9px] font-extrabold text-white shadow-sm border border-white/20 font-mono"
        >
          {percentage}%
        </div>
      ) : null}
    </div>
  );
}

export function ProfileCompletionWidget({
  user,
  currentFormValues,
  onNavigateTab,
  variant = 'card',
  className = '',
}: ProfileCompletionWidgetProps) {
  const [showModal, setShowModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate live completion based on form state or user object
  const data = currentFormValues || user;
  const result: ProfileCompletionResult = calculateProfileCompletion(data);

  const recipientName =
    data?.name?.trim() || user?.name?.trim() || 'Hacker';
  const completionDate =
    user?.profileCompletedAt || result.completionDate || new Date().toISOString();
  const certificateId =
    user?.certificateId || result.certificateId;

  if (variant === 'badge') {
    return (
      <>
        {result.isComplete ? (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className={`px-3 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-[#0099e6]/10 to-[#f58220]/10 hover:from-amber-500/20 hover:to-[#f58220]/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${className}`}
          >
            <Award className="w-4 h-4 text-[#f58220]" />
            <span>Certificate of Completion</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-[#f58220] text-white font-mono">
              100%
            </span>
          </button>
        ) : (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-300 font-semibold ${className}`}
          >
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Profile: {result.percentage}%</span>
          </div>
        )}

        <CertificateModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          recipientName={recipientName}
          completionDate={completionDate}
          certificateId={certificateId}
          username={user?.username}
        />
      </>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Mini Profile Badge with Border Progress Ring */}
      <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20">
        <ProfileProgressAvatar
          avatarUrl={data?.avatarUrl || user?.avatarUrl}
          name={recipientName}
          percentage={result.percentage}
          size={52}
          onClick={() => {
            if (result.isComplete) setShowModal(true);
          }}
        />

        <div className="overflow-hidden flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
              {recipientName}
            </div>
            {result.isComplete && (
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-gradient-to-r from-[#0099e6] to-[#f58220] text-white shrink-0">
                100%
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
            {user?.email || 'Hacker Profile'}
          </div>
        </div>
      </div>

      {/* Profile Completion Progress Card */}
      <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.07] space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
            {result.isComplete ? (
              <>
                <Award className="w-4 h-4 text-[#f58220]" />
                <span className="text-slate-900 dark:text-white">Profile 100% Complete</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#0099e6]" />
                <span>Profile Completion</span>
              </>
            )}
          </div>
          <span
            className={`font-black font-mono text-xs ${
              result.isComplete
                ? 'text-[#f58220]'
                : 'text-[#0099e6]'
            }`}
          >
            {result.percentage}%
          </span>
        </div>

        {/* Progress Bar with Gradient */}
        <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-white/[0.08] overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              result.isComplete
                ? 'bg-gradient-to-r from-[#0099e6] via-[#0a9ed9] to-[#f58220] shadow-[0_0_8px_rgba(245,130,32,0.5)]'
                : 'bg-gradient-to-r from-[#0099e6] to-[#0a9ed9]'
            }`}
            style={{ width: `${result.percentage}%` }}
          />
        </div>

        {/* If 100% Complete: Certificate Unlock Call to Action */}
        {result.isComplete ? (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#0099e6] to-[#f58220] hover:opacity-95 active:scale-[0.99] text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-orange-500/15 cursor-pointer transition-all"
            >
              <Award className="w-4 h-4" />
              <span>Download Certificate</span>
            </button>
            <p className="text-[10px] text-center text-slate-500 dark:text-slate-400 mt-1.5">
              Official verifiable credential issued by Hacker&apos;s Unity
            </p>
          </div>
        ) : (
          /* If < 100%: Show remaining fields guide */
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer text-left"
            >
              <span>{result.missingItems.length} items remaining for 100%</span>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            </button>

            {isExpanded && (
              <div className="space-y-1.5 pt-1 border-t border-slate-200/60 dark:border-white/[0.06] animate-in fade-in">
                {result.missingItems.slice(0, 5).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigateTab && onNavigateTab(item.tab)}
                    className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-white/[0.05] text-[11px] text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      +{item.points}%
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        recipientName={recipientName}
        completionDate={completionDate}
        certificateId={certificateId}
        username={user?.username}
      />
    </div>
  );
}
