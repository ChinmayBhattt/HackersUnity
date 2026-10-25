'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CertificateOfCompletion from './CertificateOfCompletion';
import { Award, Check, Copy, Download, ExternalLink, Loader2, Share2, X } from 'lucide-react';

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
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // Client-side mount flag for React portal
  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted || !isOpen) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(certificateId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getSafeFileName = (ext: string) => {
    const safeName = (recipientName || 'Hacker')
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    return `HackersUnity-Certificate-${safeName}.${ext}`;
  };

  /**
   * Captures the unscaled 1123x794 certificate element at exact 2x resolution
   * using html-to-image (native browser engine, 100% accurate alignment)
   * with fallback to html2canvas.
   */
  const captureImage = async (): Promise<string> => {
    if (typeof document !== 'undefined' && document.fonts) {
      try {
        await document.fonts.ready;
      } catch {
        // Continue even if font ready promise rejects
      }
    }

    const exportNode = (exportRef.current?.querySelector('.hu-cert') as HTMLElement) || exportRef.current;
    if (!exportNode) {
      throw new Error('Certificate render element not found');
    }

    // Ensure all images are loaded
    const images = Array.from(exportNode.querySelectorAll('img'));
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    );

    try {
      const { toPng } = await import('html-to-image');
      return await toPng(exportNode, {
        pixelRatio: 2, // 2x gives 2246 x 1588 retina resolution
        width: 1123,
        height: 794,
        cacheBust: false,
        style: {
          margin: '0',
          padding: '0',
          boxShadow: 'none',
          transform: 'none',
        },
      });
    } catch (err) {
      console.warn('html-to-image failed, falling back to html2canvas:', err);
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(exportNode, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 1123,
        height: 794,
      });
      return canvas.toDataURL('image/png', 1.0);
    }
  };

  /**
   * Direct PDF Download (no print modal)
   */
  const handleDownloadPdf = async () => {
    if (isDownloadingPdf || isDownloadingPng) return;
    setIsDownloadingPdf(true);

    try {
      const imgData = await captureImage();

      const { jsPDF } = await import('jspdf');

      // A4 Landscape is 297mm x 210mm
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210, undefined, 'FAST');
      pdf.save(getSafeFileName('pdf'));

      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (error) {
      console.error('Direct PDF download failed, falling back to print:', error);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  /**
   * Direct PNG Download
   */
  const handleDownloadPng = async () => {
    if (isDownloadingPdf || isDownloadingPng) return;
    setIsDownloadingPng(true);

    try {
      const imgData = await captureImage();
      const link = document.createElement('a');
      link.download = getSafeFileName('png');
      link.href = imgData;
      link.click();
    } catch (error) {
      console.error('PNG download failed:', error);
    } finally {
      setIsDownloadingPng(false);
    }
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

  const modalContent = (
    <>
      {/* ─── Hidden Off-Screen Unscaled Container for Direct PDF/PNG Export ─── */}
      <div
        ref={exportRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 1123,
          height: 794,
          zIndex: -50,
          pointerEvents: 'none',
          opacity: 1,
          overflow: 'hidden',
          background: '#ffffff',
        }}
      >
        <style>{`
          .hu-export-target .hu-cert {
            box-shadow: none !important;
            margin: 0 !important;
            border-radius: 0 !important;
          }
          .hu-export-target * {
            animation: none !important;
            transition: none !important;
          }
        `}</style>
        <div className="hu-export-target" style={{ width: 1123, height: 794 }}>
          <CertificateOfCompletion
            recipientName={recipientName}
            completionDate={completionDate}
            certificateId={certificateId}
            scaleToFit={false}
          />
        </div>
      </div>

      {/* ─── Visible Interactive Modal (Portaled to document.body) ─── */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="relative w-full max-w-5xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.12] rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
          {/* Modal Top Header */}
          <div className="shrink-0 flex items-center justify-between px-5 sm:px-8 py-4 border-b border-slate-100 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-[#f58220] border border-amber-500/20 flex items-center justify-center shrink-0">
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
          <div className="flex-1 p-3 sm:p-6 bg-slate-100 dark:bg-[#06090e] flex items-center justify-center overflow-auto min-h-0">
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
          <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 px-5 sm:px-8 py-4 border-t border-slate-100 dark:border-white/[0.08] bg-white dark:bg-[#0c1017]">
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
                onClick={handleDownloadPng}
                disabled={isDownloadingPng || isDownloadingPdf}
                className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-60"
                title="Download high-resolution PNG image"
              >
                {isDownloadingPng ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                ) : (
                  <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                )}
                <span className="hidden sm:inline">PNG</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf || isDownloadingPng}
                className="px-5 py-2.5 rounded-2xl bg-[#0099e6] hover:bg-[#0088cc] active:scale-[0.98] text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-70"
              >
                {isDownloadingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating PDF...</span>
                  </>
                ) : pdfSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>PDF Downloaded!</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
}
