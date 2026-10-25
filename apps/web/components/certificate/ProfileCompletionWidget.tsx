'use client';

import React, { useState } from 'react';
import {
  ProfileCompletionResult,
  calculateProfileCompletion,
} from '@/lib/profile-completion';
import { CertificateModal } from './CertificateModal';
import { Award, ChevronRight, AlertCircle } from 'lucide-react';

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
  size = 48,
  strokeWidth = 2.5,
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
      title={`Profile: ${percentage}% Complete${isComplete ? ' (Certificate Unlocked)' : ''}`}
    >
      {/* SVG Progress Ring */}
      <svg
        className="w-full h-full -rotate-90 overflow-visible transition-all duration-500"
        viewBox={`0 0 ${size} ${size}`}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0099e6" />
            <stop offset="100%" stopColor="#f58220" />
          </linearGradient>
        </defs>

        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-slate-200 dark:text-white/[0.08]"
          strokeWidth={strokeWidth}
        />

        {/* Animated Progress Ring */}
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
          className="transition-all duration-700 ease-out"
        />
      </svg>

      {/* Inner Avatar Box */}
      <div className="absolute inset-[3px] rounded-full overflow-hidden bg-slate-800 flex items-center justify-center text-white font-black text-xs shadow-inner">
        {avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('data:')) ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={avatarUrl} alt={name || 'Hacker'} className="w-full h-full object-cover" />
        ) : avatarUrl && avatarUrl.length > 2 && avatarUrl !== '⚡' ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={avatarUrl} alt={name || 'Hacker'} className="w-full h-full object-cover" />
        ) : (
          <span>{(name?.charAt(0) || 'H').toUpperCase()}</span>
        )}
      </div>

      {/* Subtle Medal Badge if 100% */}
      {isComplete ? (
        <div
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#f58220] text-white flex items-center justify-center shadow-xs border border-white dark:border-[#0c1017]"
          title="100% Complete"
        >
          <Award className="w-2.5 h-2.5" />
        </div>
      ) : percentage > 0 ? (
        <div className="absolute -bottom-0.5 -right-0.5 px-1 rounded-full bg-slate-900 text-[8px] font-bold text-slate-300 border border-white/10 font-mono">
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

  const recipientName = data?.name?.trim() || user?.name?.trim() || 'Hacker';
  const completionDate = user?.profileCompletedAt || result.completionDate || new Date().toISOString();
  const certificateId = user?.certificateId || result.certificateId;

  if (variant === 'badge') {
    return (
      <>
        {result.isComplete ? (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className={`px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${className}`}
          >
            <Award className="w-3.5 h-3.5 text-[#f58220]" />
            <span>Certificate</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-emerald-500/10 text-emerald-400 font-mono font-bold border border-emerald-500/20">
              100%
            </span>
          </button>
        ) : (
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-400 font-medium ${className}`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
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
    <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] space-y-2.5 ${className}`}>
      {/* Top Mini Profile Row */}
      <div className="flex items-center gap-3">
        <ProfileProgressAvatar
          avatarUrl={data?.avatarUrl || user?.avatarUrl}
          name={recipientName}
          percentage={result.percentage}
          size={46}
          onClick={() => {
            if (result.isComplete) setShowModal(true);
          }}
        />

        <div className="overflow-hidden flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
              {recipientName}
            </div>
            {result.isComplete ? (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                100%
              </span>
            ) : (
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                {result.percentage}%
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
            {user?.email || 'Hacker Profile'}
          </div>
        </div>
      </div>

      {/* When 100%: Simple, elegant certificate link */}
      {result.isComplete ? (
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="w-full py-2 px-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] dark:bg-white/[0.04] dark:hover:bg-white/[0.08] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Award className="w-3.5 h-3.5 text-[#f58220]" />
          <span>Certificate of Completion</span>
        </button>
      ) : (
        /* When < 100%: Minimal clean progress bar & items left */
        <div className="space-y-1.5 pt-0.5">
          <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#0099e6] transition-all duration-500 ease-out"
              style={{ width: `${result.percentage}%` }}
            />
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer text-left py-0.5"
          >
            <span>{result.missingItems.length} items to 100%</span>
            <ChevronRight
              className={`w-3 h-3 transition-transform duration-200 ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          </button>

          {isExpanded && (
            <div className="space-y-1 pt-1 border-t border-slate-200/60 dark:border-white/[0.06] animate-in fade-in">
              {result.missingItems.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigateTab && onNavigateTab(item.tab)}
                  className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/[0.04] text-[11px] text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
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
