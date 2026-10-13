'use client';

import { useState } from 'react';
import {
  X,
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Target,
  Layers,
  Cpu,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Building2,
  Code2,
  ChevronRight,
  Award,
  Download,
} from 'lucide-react';
import { ProductEvaluationReport, ProjectSubmission } from '@/lib/storage';
import { downloadSingleEvaluationPdf } from '@/lib/evaluation-pdf';

interface ProductIntelligenceModalProps {
  submission: ProjectSubmission | null;
  evaluation: ProductEvaluationReport | null;
  isOpen: boolean;
  onClose: () => void;
  onReevaluate?: (sub: ProjectSubmission) => void;
  isEvaluating?: boolean;
  onApplyStatusAndScore?: (subId: string, status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'WINNER' | 'REJECTED', score: number) => void;
  eventTitle?: string;
}

export function ProductIntelligenceModal({
  submission,
  evaluation,
  isOpen,
  onClose,
  onReevaluate,
  isEvaluating = false,
  onApplyStatusAndScore,
  eventTitle,
}: ProductIntelligenceModalProps) {
  const [copied, setCopied] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'SUBMITTED' | 'UNDER_REVIEW' | 'ACCEPTED' | 'WINNER' | 'REJECTED'>(
    submission?.status || 'ACCEPTED'
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'criteria' | 'business' | 'tech'>('overview');

  if (!isOpen || !submission) return null;

  const handleCopySummary = () => {
    if (!evaluation) return;
    const text = `📊 PRODUCT INTELLIGENCE REPORT: ${submission.projectTitle}
Overall Score: ${evaluation.finalScore} / 100
Product Stage: ${evaluation.productStage}
Product Potential: ${evaluation.productPotential?.level || 'N/A'}
Confidence: ${evaluation.evaluationConfidence}

💡 Product Summary:
${evaluation.productSummary}

🏆 Scores:
- Problem Validation: ${evaluation.scores?.problemValidation?.score || 0}/10 (15%)
- Product Value: ${evaluation.scores?.productValue?.score || 0}/10 (15%)
- Innovation: ${evaluation.scores?.innovation?.score || 0}/10 (10%)
- Product Experience: ${evaluation.scores?.productExperience?.score || 0}/10 (10%)
- Market Potential: ${evaluation.scores?.marketPotential?.score || 0}/10 (15%)
- Scalability: ${evaluation.scores?.scalability?.score || 0}/10 (10%)
- Product Execution: ${evaluation.scores?.productExecution?.score || 0}/10 (15%)
- Business Model: ${evaluation.scores?.businessModel?.score || 0}/10 (10%)

✅ Key Strengths:
${evaluation.strengths?.map((s) => `• ${s}`).join('\n') || 'None listed'}

⚠️ Weaknesses:
${evaluation.weaknesses?.map((w) => `• ${w}`).join('\n') || 'None listed'}

💼 Business Potential:
${evaluation.businessPotential?.analysis || 'N/A'}
Possible Models: ${evaluation.businessPotential?.possibleModels?.join(', ') || 'N/A'}

🚀 Recommendations:
${evaluation.recommendations?.map((r) => `• ${r}`).join('\n') || 'None listed'}

Generated via Groq AI on Hacker's Unity`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 dark:text-emerald-400';
    if (score >= 60) return 'text-sky-500 dark:text-sky-400';
    if (score >= 40) return 'text-amber-500 dark:text-amber-400';
    return 'text-rose-500 dark:text-rose-400';
  };

  const getStageBadgeColor = (stage: string = '') => {
    switch (stage.toLowerCase()) {
      case 'early product':
      case 'mvp':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
      case 'functional prototype':
        return 'bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] dark:text-sky-300 border-sky-200 dark:border-sky-800/40';
      case 'concept prototype':
        return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
      default:
        return 'bg-slate-100 dark:bg-white/[0.08] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.1]';
    }
  };

  const getPotentialBadgeColor = (level: string = '') => {
    const l = level.toLowerCase();
    if (l.includes('high')) {
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40';
    }
    if (l.includes('medium')) {
      return 'bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] dark:text-sky-300 border-sky-200 dark:border-sky-800/40';
    }
    if (l.includes('early')) {
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/40';
    }
    return 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40';
  };

  const criteriaList = evaluation
    ? [
        {
          key: 'problemValidation',
          title: 'Problem Validation & Importance',
          weight: '15%',
          data: evaluation.scores?.problemValidation,
        },
        {
          key: 'productValue',
          title: 'Product Value & Usefulness',
          weight: '15%',
          data: evaluation.scores?.productValue,
        },
        {
          key: 'innovation',
          title: 'Innovation & Differentiation',
          weight: '10%',
          data: evaluation.scores?.innovation,
        },
        {
          key: 'productExperience',
          title: 'Product Experience & Usability',
          weight: '10%',
          data: evaluation.scores?.productExperience,
        },
        {
          key: 'marketPotential',
          title: 'Market Potential',
          weight: '15%',
          data: evaluation.scores?.marketPotential,
        },
        {
          key: 'scalability',
          title: 'Scalability & Growth Potential',
          weight: '10%',
          data: evaluation.scores?.scalability,
        },
        {
          key: 'productExecution',
          title: 'Product Execution & Completeness',
          weight: '15%',
          data: evaluation.scores?.productExecution,
        },
        {
          key: 'businessModel',
          title: 'Business Model & Sustainability',
          weight: '10%',
          data: evaluation.scores?.businessModel,
        },
      ]
    : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] bg-white dark:bg-[#0c1017] rounded-3xl shadow-2xl border border-slate-200 dark:border-white/[0.08] flex flex-col overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── Header ───────────────────────────────────────────── */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-white/[0.08] bg-gradient-to-r from-slate-50 via-sky-50/20 to-emerald-50/30 dark:from-white/[0.02] dark:via-sky-950/10 dark:to-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-linear-to-tr from-[#0099e6] to-[#0F9D58] text-white flex items-center justify-center shadow-lg shadow-sky-500/20 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#0099e6]/10 dark:bg-sky-950/50 text-[#0099e6] dark:text-sky-300 border border-sky-200 dark:border-sky-800/50 flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                   AI Product Intelligence
                </span>
                {evaluation?.productStage && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStageBadgeColor(evaluation.productStage)}`}>
                    {evaluation.productStage}
                  </span>
                )}
                {evaluation?.productPotential?.level && (
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getPotentialBadgeColor(evaluation.productPotential.level)}`}>
                    {evaluation.productPotential.level}
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight line-clamp-1">
                {submission.projectTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                By <strong className="text-slate-700 dark:text-slate-300">{submission.submittedByName || 'Builder'}</strong> • Track: <strong className="text-[#0099e6]">{submission.track || 'General'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
            <button
              onClick={() => downloadSingleEvaluationPdf({ submission, evaluation, eventTitle })}
              className="px-3.5 py-2 rounded-xl bg-[#0099e6]/10 hover:bg-[#0099e6]/20 border border-[#0099e6]/30 text-[#0099e6] dark:text-cyan-300 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Download official evaluation report as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {onReevaluate && (
              <button
                onClick={() => onReevaluate(submission)}
                disabled={isEvaluating}
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Re-run product evaluation AI"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#0099e6] ${isEvaluating ? 'animate-spin' : ''}`} />
                <span>{isEvaluating ? 'Analyzing...' : 'Re-Evaluate'}</span>
              </button>
            )}

            <button
              onClick={handleCopySummary}
              className="p-2 rounded-xl bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/[0.08] hover:bg-slate-50 dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
              title="Copy Report Brief"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ─── Navigation Tabs ──────────────────────────────────── */}
        <div className="px-6 border-b border-slate-200/80 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.01] flex items-center gap-2 overflow-x-auto text-xs">
          {[
            { id: 'overview', label: 'Executive Overview', icon: Sparkles },
            { id: 'criteria', label: '8-Factor Score Breakdown', icon: Award },
            { id: 'business', label: 'Market & Business Potential', icon: Building2 },
            { id: 'tech', label: 'Tech Stack & Architecture', icon: Code2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-[#0099e6] text-[#0099e6]'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ─── Scrollable Body ──────────────────────────────────── */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* Loading Overlay */}
          {isEvaluating && (
            <div className="py-16 text-center space-y-3 flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] border border-sky-200 dark:border-sky-800/40 flex items-center justify-center animate-pulse">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Evaluating Product with AI...
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                Analyzing problem validation, product value, market potential, business sustainability, and tech stack suitability.
              </p>
            </div>
          )}

          {!isEvaluating && !evaluation && (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                No AI Product Evaluation Yet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Click below to run an instant, deep product-market intelligence evaluation powered by Groq.
              </p>
              {onReevaluate && (
                <button
                  onClick={() => onReevaluate(submission)}
                  className="px-5 py-2.5 rounded-xl bg-linear-to-r from-[#0099e6] to-[#0077b6] hover:from-[#0088cc] hover:to-[#00669e] text-white font-bold text-xs shadow-md shadow-sky-500/20 cursor-pointer inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Run AI Evaluation</span>
                </button>
              )}
            </div>
          )}

          {!isEvaluating && evaluation && (
            <>
              {/* ─── Hero Score & Confidence Card ─────────────────── */}
              <div className="p-5 sm:p-6 rounded-3xl bg-linear-to-br from-slate-900 via-slate-900 to-slate-950 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 text-[10px] font-bold">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Deterministic Backend Calculation</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    Startup & Product Viability Score
                  </h3>
                  <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
                    Evaluated as a commercial product and business opportunity using weighted multi-factor scoring.
                  </p>
                  <div className="pt-1 flex items-center justify-center md:justify-start gap-2 flex-wrap text-[11px] text-slate-300">
                    <span className="font-semibold text-white">Confidence:</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                      evaluation.evaluationConfidence?.toLowerCase().includes('high')
                        ? 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50'
                        : evaluation.evaluationConfidence?.toLowerCase().includes('medium')
                        ? 'bg-amber-900/40 text-amber-300 border-amber-700/50'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {evaluation.evaluationConfidence || 'Medium Confidence'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0 bg-white/5 p-4 sm:p-5 rounded-2xl border border-white/10">
                  <div className="text-center">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Final Score</div>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${getScoreColor(evaluation.finalScore)}`}>
                        {evaluation.finalScore}
                      </span>
                      <span className="text-slate-500 font-bold text-sm">/ 100</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mt-1">
                      {evaluation.finalScore >= 80 ? 'Exceptional Viability' : evaluation.finalScore >= 65 ? 'Strong Potential' : evaluation.finalScore >= 50 ? 'Promising Prototype' : 'Needs Development'}
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── TAB 1: EXECUTIVE OVERVIEW ─────────────────────── */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Product Summary */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/30 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#0099e6] dark:text-sky-400">
                      <Lightbulb className="w-4 h-4" />
                      <span>Executive Product Summary</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {evaluation.productSummary}
                    </p>
                  </div>

                  {/* Strengths & Weaknesses Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Strengths */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Core Product Strengths</span>
                      </div>
                      <ul className="space-y-2">
                        {evaluation.strengths?.map((strength, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-800 dark:text-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Weaknesses */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-800 dark:text-rose-300">
                        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                        <span>Key Weaknesses & Vulnerabilities</span>
                      </div>
                      <ul className="space-y-2">
                        {evaluation.weaknesses?.map((weakness, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-800 dark:text-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Top Recommendations */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                      <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Actionable Product Recommendations</span>
                    </div>
                    <div className="space-y-2">
                      {evaluation.recommendations?.map((rec, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-[#121824] border border-amber-200/80 dark:border-amber-800/30 flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Missing Information Banner */}
                  {evaluation.missingInformation && evaluation.missingInformation.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] space-y-2">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Information Gaps In Submission</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {evaluation.missingInformation.map((gap, idx) => (
                          <span key={idx} className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] text-slate-700 dark:text-slate-300 text-[11px]">
                            {gap}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── TAB 2: 8-CRITERIA SCORE BREAKDOWN ─────────────── */}
              {activeTab === 'criteria' && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-200 dark:border-white/[0.08] text-slate-500 dark:text-slate-400 text-xs flex items-center justify-between">
                    <span>Evaluated across 8 weighted criteria (Total: 100%)</span>
                    <span className="font-mono font-bold text-slate-800 dark:text-white">Deterministic Algorithm</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {criteriaList.map((crit) => {
                      const score = crit.data?.score ?? 0;
                      const pct = (score / 10) * 100;
                      return (
                        <div
                          key={crit.key}
                          className="p-4 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] space-y-2.5 shadow-2xs hover:border-[#0099e6]/40 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                Weight: {crit.weight}
                              </div>
                              <h4 className="font-black text-slate-900 dark:text-white text-xs mt-0.5">
                                {crit.title}
                              </h4>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-base font-black text-slate-900 dark:text-white">
                                {score}
                              </span>
                              <span className="text-slate-400 text-xs font-bold"> / 10</span>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-white/[0.08] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                score >= 8
                                  ? 'bg-emerald-500'
                                  : score >= 6
                                  ? 'bg-[#0099e6]'
                                  : score >= 4
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                            {crit.data?.reason || 'No specific rationale provided.'}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ─── TAB 3: MARKET & BUSINESS POTENTIAL ────────────── */}
              {activeTab === 'business' && (
                <div className="space-y-5">
                  {/* Target Users */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      <Target className="w-4 h-4 text-[#0099e6]" />
                      <span>Target User Personas</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {evaluation.targetUsers?.map((user, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] dark:text-sky-300 border border-sky-200 dark:border-sky-800/40 font-bold text-xs"
                        >
                          {user}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Market Opportunity */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      <span>Market Opportunity & Demand</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {evaluation.marketOpportunity || 'Market analysis based on the problem statement and current industry landscape.'}
                    </p>
                  </div>

                  {/* Business Potential & Possible Models */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        <Building2 className="w-4 h-4 text-amber-500" />
                        <span>Business & Monetization Potential</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getPotentialBadgeColor(evaluation.businessPotential?.level)}`}>
                        {evaluation.businessPotential?.level || 'Assessment'}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {evaluation.businessPotential?.analysis}
                    </p>

                    {evaluation.businessPotential?.possibleModels && evaluation.businessPotential.possibleModels.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                          Viable Monetization Models:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {evaluation.businessPotential.possibleModels.map((model, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 font-bold text-[11px]"
                            >
                              {model}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── TAB 4: TECH STACK & ARCHITECTURE ──────────────── */}
              {activeTab === 'tech' && (
                <div className="space-y-5">
                  {/* Detected Stack */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] space-y-3">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      <Code2 className="w-4 h-4 text-[#0099e6]" />
                      <span>Detected Technology Stack</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {evaluation.techStackAnalysis?.detectedStack && evaluation.techStackAnalysis.detectedStack.length > 0 ? (
                        evaluation.techStackAnalysis.detectedStack.map((tech, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08] font-mono font-bold text-xs"
                          >
                            {tech}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-xs">No explicit technologies detected in submission metadata.</span>
                      )}
                    </div>
                  </div>

                  {/* Architecture Assessment Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                    <div className="p-4 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stack Suitability</span>
                      <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed">
                        {evaluation.techStackAnalysis?.suitability || 'Appropriate for MVP stage.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Complexity Assessment</span>
                      <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed">
                        {evaluation.techStackAnalysis?.complexity || 'Balanced complexity.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Scalability</span>
                      <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed">
                        {evaluation.techStackAnalysis?.scalability || 'Can scale to early customer cohorts.'}
                      </p>
                    </div>
                  </div>

                  {/* Architecture Recommendations */}
                  {evaluation.techStackAnalysis?.recommendations && evaluation.techStackAnalysis.recommendations.length > 0 && (
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] space-y-2.5">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#0099e6]" />
                        <span>Recommended Architecture Next Steps</span>
                      </span>
                      <ul className="space-y-1.5">
                        {evaluation.techStackAnalysis.recommendations.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0099e6] mt-1.5 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* ─── Footer Action Bar ─────────────────────────────────── */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {evaluation && onApplyStatusAndScore && (
              <>
                <span className="text-slate-500 dark:text-slate-400 font-semibold">Award Status:</span>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] font-bold text-xs text-slate-800 dark:text-white outline-none cursor-pointer"
                >
                  <option value="ACCEPTED">ACCEPTED (Shortlisted)</option>
                  <option value="WINNER">WINNER 🏆 (Podium)</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="REJECTED">REJECTED (Disqualified)</option>
                </select>

                <button
                  type="button"
                  onClick={() => onApplyStatusAndScore(submission.id, selectedStatus, evaluation.finalScore)}
                  className="px-4 py-1.5 rounded-xl bg-[#0F9D58] hover:bg-[#0c8248] text-white font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Score ({evaluation.finalScore})</span>
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => downloadSingleEvaluationPdf({ submission, evaluation, eventTitle })}
              className="px-3.5 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-[#0099e6] dark:text-cyan-300 border border-sky-200 dark:border-sky-800/50 font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer"
              title="Download official evaluation report as PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-800 dark:text-white font-bold transition-colors cursor-pointer text-xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
