'use client';

import React, { useEffect, useState } from 'react';
import CertificateOfCompletion from './CertificateOfCompletion';
import { Award, Check, Copy, Download, ExternalLink, Printer, Share2, Sparkles, X } from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  completionDate?: Date | string;
  certificateId: string;
  username?: string | null;
}

export function CertificateModal({
  isOpen,
  onClose,
  recipientName,
  completionDate,
  certificateId,
  username,
}: CertificateModalProps) {
  const [copied, setCopied] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(certificateId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 150);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(
      `Excited to have completed 100% of my profile on Hacker's Unity! 🚀 Ready to collaborate and build in upcoming hackathons.\n\nCertificate ID: ${certificateId}\n@HackersUnity`
    );
    const url = encodeURIComponent(
      username ? `https://hackersunity.com/profile/${username}` : 'https://hackersunity.com'
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(
      username ? `https://hackersunity.com/profile/${username}` : 'https://hackersunity.com'
    );
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-5xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#0099e6] to-[#f58220] flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  Official Certificate of Completion
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Check className="w-3 h-3" /> 100% Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Issued by Hacker&apos;s Unity &bull; Certificate ID: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{certificateId}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-200/60 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.12] text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Preview Container */}
        <div className="p-3 sm:p-8 bg-slate-100 dark:bg-[#06090e] flex items-center justify-center overflow-hidden">
          <div className="w-full max-w-[1000px] rounded-2xl overflow-hidden shadow-2xl border border-slate-300 dark:border-white/10 bg-white">
            <CertificateOfCompletion
              recipientName={recipientName}
              completionDate={completionDate}
              certificateId={certificateId}
              scaleToFit={true}
            />
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 sm:px-8 py-4 border-t border-slate-100 dark:border-white/[0.08] bg-white dark:bg-[#0c1017]">
          {/* Certificate Verification & ID info */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono text-[11px] px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]">
              {certificateId}
            </span>
            <button
              type="button"
              onClick={handleCopyId}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] text-slate-600 dark:text-slate-300 transition-colors font-medium cursor-pointer"
              title="Copy Certificate ID"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy ID</span>
                </>
              )}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleShareLinkedIn}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Share on LinkedIn"
            >
              <Share2 className="w-4 h-4 text-[#0077b5]" />
              <span className="hidden sm:inline">LinkedIn</span>
            </button>

            <button
              type="button"
              onClick={handleShareTwitter}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Share on X"
            >
              <ExternalLink className="w-4 h-4 text-sky-500" />
              <span className="hidden sm:inline">Share</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#0099e6] to-[#f58220] hover:opacity-90 active:scale-[0.98] text-white text-xs font-black flex items-center gap-2 transition-all shadow-lg shadow-sky-500/20 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Download as PDF / Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
