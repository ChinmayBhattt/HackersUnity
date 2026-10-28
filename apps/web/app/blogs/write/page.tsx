'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  PenTool,
  Sparkles,
  Image as ImageIcon,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Quote,
  Link as LinkIcon,
  Eye,
  Edit3,
  Send,
  CheckCircle2,
  Clock,
  Tag,
  HelpCircle,
  Layers,
  AlertCircle,
  Loader2,
  RefreshCw,
  Upload,
  ImagePlus,
  Trash2,
  Check,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { uploadHackathonAsset } from '@/lib/supabase-service';

// Client-side image compression utility for instant previews & optimized storage
const compressImage = (file: File, maxWidth = 1600, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to parse image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

// Inline markdown parser for preview and cards
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={index} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={index} className="italic text-slate-800 dark:text-slate-200">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-white/[0.08] text-sky-500 font-mono text-xs"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0099e6] hover:underline font-semibold"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}

const DOMAINS = [
  'Agentic AI',
  'Space',
  'Web3',
  'IoT',
  'Cybersecurity',
  'Cloud',
  'Robotics',
  'Open Source',
  'AR / VR & Spatial',
] as const;

const PRESET_BANNERS = [
  {
    label: 'Agentic AI',
    url: 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189656/hackers-unity/blogs/agentic-ai.jpg',
    category: 'Agentic AI',
  },
  {
    label: 'SpaceTech Cosmos',
    url: 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189625/hackers-unity/blogs/space-domain.jpg',
    category: 'Space Domain',
  },
  {
    label: 'Web3 & ZK Rollups',
    url: 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189624/hackers-unity/blogs/web3.jpg',
    category: 'Web3',
  },
  {
    label: 'Edge IoT Nodes',
    url: 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189628/hackers-unity/blogs/iot.jpg',
    category: 'IoT',
  },
  {
    label: 'Zero-Trust Defense',
    url: 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189613/hackers-unity/blogs/cybersecurity.jpg',
    category: 'Cybersecurity',
  },
  {
    label: 'Cloud Resilience',
    url: 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189611/hackers-unity/blogs/cloud.jpg',
    category: 'Cloud',
  },
  {
    label: 'Robotics & Embodied AI',
    url: 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189628/hackers-unity/blogs/iot.jpg',
    category: 'Robotics',
  },
  {
    label: 'Open Source Community',
    url: 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189611/hackers-unity/blogs/cloud.jpg',
    category: 'Open Source',
  },
  {
    label: 'Spatial & WebXR',
    url: 'https://res.cloudinary.com/p6qljeni/image/upload/v1793189624/hackers-unity/blogs/web3.jpg',
    category: 'AR / VR & Spatial',
  },
];

export default function WriteBlogPage() {
  const router = useRouter();
  const { user, supabaseUser } = useAuth();

  // Form states
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<string>('Agentic AI');
  const [bannerUrl, setBannerUrl] = useState('');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [uploadedBannerName, setUploadedBannerName] = useState<string | null>(null);
  const [bannerMode, setBannerMode] = useState<'upload' | 'url'>('upload');
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState(
    '### Introduction\n\nShare what problem this tech playbook solves, why it matters in production, and key architectural decisions.\n\n### Core Architecture & Implementation\n\nExplain your design patterns, multi-agent flows, or system benchmarks.\n\n- **Pillar 1**: Deterministic tool calling & state graphs.\n- **Pillar 2**: Real-time error handling and graceful fallbacks.\n\n```typescript\n// Example Code snippet\nexport async function runAgentWorkflow(task: string) {\n  console.log("Executing goal:", task);\n}\n```\n\n### Key Takeaways\n\nSummarize the crucial lessons for engineers and builders.'
  );
  const [tagsInput, setTagsInput] = useState('Agentic AI, Architecture, OpenSource');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');

  // UI states
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedBlog, setSubmittedBlog] = useState<any>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // File upload handler for banner
  const handleBannerFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP, GIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Banner image must be under 10MB.');
      return;
    }

    setIsUploadingBanner(true);
    try {
      // 1. Instantly compress and set local data URL so the preview updates immediately
      const compressed = await compressImage(file);
      setBannerUrl(compressed);
      setUploadedBannerName(file.name);
      setBannerMode('upload');

      // 2. Upload to Supabase Storage if available
      try {
        const { url } = await uploadHackathonAsset(file, 'banners');
        if (url) {
          setBannerUrl(url);
        }
      } catch (storageErr) {
        console.warn('Storage upload fallback to data URL:', storageErr);
      }
    } catch (err: any) {
      console.error('Failed to process image:', err);
      alert('Could not process this image. Please try another image.');
    } finally {
      setIsUploadingBanner(false);
      if (bannerFileInputRef.current) {
        bannerFileInputRef.current.value = '';
      }
    }
  };

  // Auto-fill author details if logged in
  useEffect(() => {
    if (user) {
      if (!authorEmail && user.email) setAuthorEmail(user.email);
      if (!authorName) {
        const name =
          user.name ||
          (user as any).full_name ||
          supabaseUser?.user_metadata?.full_name ||
          supabaseUser?.user_metadata?.name ||
          user.email?.split('@')[0];
        if (name) setAuthorName(name);
      }
    }
  }, [user, supabaseUser]);

  // Calculate estimated read time
  const readTime = useMemo(() => {
    const words = `${title} ${subtitle} ${content}`.trim().split(/\s+/).filter(Boolean).length;
    const mins = Math.max(1, Math.ceil(words / 200));
    return `${mins} min read`;
  }, [title, subtitle, content]);

  // Insert or toggle inline markdown (Bold, Italic, Inline Code)
  const applyInlineFormat = (prefix: string, suffix: string, defaultPlaceholder: string = 'text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const val = textarea.value;
    const selected = val.substring(start, end);

    // Case 1: selected text itself is wrapped in prefix & suffix e.g. "**bold**"
    if (
      selected.length >= prefix.length + suffix.length &&
      selected.startsWith(prefix) &&
      selected.endsWith(suffix)
    ) {
      const unwrapped = selected.slice(prefix.length, -suffix.length);
      const newContent = val.substring(0, start) + unwrapped + val.substring(end);
      setContent(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start, start + unwrapped.length);
      }, 0);
      return;
    }

    // Case 2: selection is surrounded by prefix & suffix in document
    if (
      start >= prefix.length &&
      end + suffix.length <= val.length &&
      val.substring(start - prefix.length, start) === prefix &&
      val.substring(end, end + suffix.length) === suffix
    ) {
      const newContent =
        val.substring(0, start - prefix.length) + selected + val.substring(end + suffix.length);
      setContent(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start - prefix.length, end - prefix.length);
      }, 0);
      return;
    }

    // Case 3: text is selected -> wrap it
    if (selected.length > 0) {
      const wrapped = `${prefix}${selected}${suffix}`;
      const newContent = val.substring(0, start) + wrapped + val.substring(end);
      setContent(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
      }, 0);
      return;
    }

    // Case 4: nothing selected -> insert placeholder and select it for quick typing
    const wrapped = `${prefix}${defaultPlaceholder}${suffix}`;
    const newContent = val.substring(0, start) + wrapped + val.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + defaultPlaceholder.length);
    }, 0);
  };

  // Block formatting (Heading 2, Heading 3, Bullet list, Numbered list, Blockquote)
  const applyBlockFormat = (linePrefix: string, defaultPlaceholder: string = 'Heading') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const val = textarea.value;

    const lineStart = val.lastIndexOf('\n', start - 1) + 1;
    let lineEnd = val.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = val.length;

    const currentLine = val.substring(lineStart, lineEnd);
    const selectedText = val.substring(start, end);

    if (start === end && currentLine.trim().length === 0) {
      // Empty line: insert prefix + placeholder
      const replacement = `${linePrefix} ${defaultPlaceholder}`;
      const newContent = val.substring(0, lineStart) + replacement + val.substring(lineEnd);
      setContent(newContent);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(lineStart + linePrefix.length + 1, lineStart + replacement.length);
      }, 0);
      return;
    }

    if (start === end) {
      // Current line has text: replace/add prefix
      const cleanLine = currentLine.replace(/^#{1,6}\s+|^[-*]\s+|^\d+\.\s+|^>\s+/, '');
      const replacement = `${linePrefix} ${cleanLine}`;
      const newContent = val.substring(0, lineStart) + replacement + val.substring(lineEnd);
      setContent(newContent);
      setTimeout(() => {
        textarea.focus();
        const cursor = lineStart + replacement.length;
        textarea.setSelectionRange(cursor, cursor);
      }, 0);
      return;
    }

    // Selection across lines
    const lines = selectedText.split('\n');
    const formatted = lines
      .map((l) => `${linePrefix} ${l.replace(/^#{1,6}\s+|^[-*]\s+|^\d+\.\s+|^>\s+/, '')}`)
      .join('\n');
    const newContent = val.substring(0, start) + formatted + val.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start, start + formatted.length);
    }, 0);
  };

  const applyCodeBlock = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const val = textarea.value;
    const selected = val.substring(start, end);
    const codePlaceholder = selected || '// Write code here\nconsole.log("Hello Hacker");';
    const block = `\n\`\`\`typescript\n${codePlaceholder}\n\`\`\`\n`;
    const newContent = val.substring(0, start) + block + val.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + 15, start + 15 + codePlaceholder.length);
    }, 0);
  };

  const applyLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const val = textarea.value;
    const selected = val.substring(start, end);
    const linkText = selected || 'link text';
    const replacement = `[${linkText}](https://)`;
    const newContent = val.substring(0, start) + replacement + val.substring(end);
    setContent(newContent);
    setTimeout(() => {
      textarea.focus();
      if (!selected) {
        textarea.setSelectionRange(start + 1, start + 1 + linkText.length);
      } else {
        textarea.setSelectionRange(start + linkText.length + 3, start + linkText.length + 11);
      }
    }, 0);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault();
      applyInlineFormat('**', '**', 'bold text');
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault();
      applyInlineFormat('*', '*', 'italic text');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Please enter a headline for your blog.');
      return;
    }

    if (!content.trim()) {
      setErrorMsg('Please write some content for your blog.');
      return;
    }

    if (!authorName.trim()) {
      setErrorMsg('Please enter your author name.');
      return;
    }

    setIsSubmitting(true);

    try {
      const tags = tagsInput
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean);

      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        category,
        image: bannerUrl.trim(),
        rawMarkdown: content.trim(),
        tags,
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim(),
      };

      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit blog');
      }

      setSubmittedBlog(data.blog || payload);
    } catch (err: any) {
      setErrorMsg(err.message || 'Something went wrong while submitting.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen bg-slate-50/70 dark:bg-[#05070d] text-slate-900 dark:text-slate-100 selection:bg-[#0099e6] selection:text-white py-10 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-[#0099e6]/08 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[450px] h-[450px] bg-[#f97316]/06 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/blogs"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-[#0099e6] dark:hover:text-[#0099e6] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Domain Blogs</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#0099e6]/10 text-[#0099e6] border border-[#0099e6]/20">
              Community Writer Portal
            </span>
          </div>
        </div>

        {/* Successful Submission View */}
        {submittedBlog ? (
          <div className="rounded-3xl bg-white/90 dark:bg-[#090e17]/90 border border-slate-200/90 dark:border-white/[0.1] backdrop-blur-2xl p-8 sm:p-12 text-center shadow-2xl space-y-6 animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                Blog Submitted for Moderation!
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Thank you for contributing to Hacker’s Unity! Your playbook &quot;
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {submittedBlog.title}
                </span>
                &quot; has been sent to our Super Admin portal (
                <code className="text-xs bg-slate-100 dark:bg-white/[0.08] px-1.5 py-0.5 rounded font-mono text-[#0099e6]">
                  /admin-csap
                </code>
                ) for quality and domain review.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-50/80 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 max-w-md mx-auto text-xs text-sky-800 dark:text-sky-300 space-y-1">
              <div className="font-bold flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#0099e6]" />
                <span>What happens next?</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Once approved by an admin, your article will immediately be published live on{' '}
                <strong className="text-slate-800 dark:text-slate-200">hackersunity.com/blogs</strong>{' '}
                and accessible worldwide.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/blogs"
                className="px-6 py-2.5 rounded-full bg-[#0099e6] hover:bg-[#0088cc] text-white text-xs sm:text-sm font-bold shadow-lg shadow-sky-500/25 transition-all cursor-pointer"
              >
                Browse Other Blogs
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSubmittedBlog(null);
                  setTitle('');
                  setSubtitle('');
                }}
                className="px-6 py-2.5 rounded-full bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-bold border border-slate-200 dark:border-white/[0.08] transition-all cursor-pointer"
              >
                Write Another Blog
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Header Title Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-[#090e17]/80 border border-slate-200/90 dark:border-white/[0.08] backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/[0.06] pb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                    <PenTool className="w-7 h-7 text-[#0099e6]" />
                    <span>Author a Frontier Tech Playbook</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Publish your engineering insights across AI, Space, Web3, IoT, and Cloud.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] text-xs font-semibold text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-[#0099e6]" />
                    <span>{readTime}</span>
                  </div>
                </div>
              </div>

              {/* Error banner */}
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Title & Subtitle */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Blog Headline <span className="text-[#ea580c]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Autonomous Agentic AI: Building Beyond Single-Prompt Wrappers"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 text-base sm:text-lg font-bold outline-none focus:border-[#0099e6] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Subtitle / Executive Summary
                  </label>
                  <input
                    type="text"
                    placeholder="Brief 1-2 sentence hook explaining the architectural takeaway..."
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm outline-none focus:border-[#0099e6] transition-colors"
                  />
                </div>
              </div>

              {/* Category & Cover Banner Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                {/* Domain Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#0099e6]" />
                    <span>Domain Category</span> <span className="text-[#ea580c]">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {DOMAINS.map((dom) => (
                      <button
                        key={dom}
                        type="button"
                        onClick={() => {
                          setCategory(dom);
                        }}
                        className={`px-3 py-2 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                          category === dom
                            ? 'bg-[#0099e6] text-white border-[#0099e6] shadow-md shadow-sky-500/20 scale-[1.02]'
                            : 'bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.2]'
                        }`}
                      >
                        #{dom}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Banner Cover Selector & Uploader */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#f97316]" />
                      <span>Banner Cover Image</span>
                    </label>

                    {/* Mode Switcher: Upload Photo vs Paste URL */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/[0.05] p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setBannerMode('upload')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          bannerMode === 'upload'
                            ? 'bg-white dark:bg-[#0c1017] text-[#0099e6] shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBannerMode('url')}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          bannerMode === 'url'
                            ? 'bg-white dark:bg-[#0c1017] text-[#0099e6] shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <LinkIcon className="w-3 h-3" />
                        <span>Paste URL</span>
                      </button>
                    </div>
                  </div>

                  {/* 1. Upload Option */}
                  {bannerMode === 'upload' && (
                    <div
                      onClick={() => bannerFileInputRef.current?.click()}
                      className="border-2 border-dashed border-sky-400/40 dark:border-sky-500/30 hover:border-[#0099e6] bg-sky-50/40 dark:bg-sky-500/05 hover:bg-sky-50/70 dark:hover:bg-sky-500/10 rounded-2xl p-4 text-center cursor-pointer transition-all group min-h-[92px] flex flex-col items-center justify-center"
                    >
                      <input
                        ref={bannerFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleBannerFileSelect}
                        className="hidden"
                      />

                      {isUploadingBanner ? (
                        <div className="flex flex-col items-center justify-center py-2 space-y-2">
                          <Loader2 className="w-5 h-5 text-[#0099e6] animate-spin" />
                          <span className="text-xs font-bold text-[#0099e6]">
                            Optimizing &amp; Uploading Banner...
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-500/20 text-[#0099e6] flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Upload className="w-4 h-4" />
                          </div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {uploadedBannerName ? (
                              <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span className="line-clamp-1">Uploaded: {uploadedBannerName} (Click to change)</span>
                              </span>
                            ) : (
                              <span>Click to upload banner photo from your device</span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                            PNG, JPG, WebP up to 10MB • Recommended 16:9 ratio
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. URL Option */}
                  {bannerMode === 'url' && (
                    <div className="space-y-2 min-h-[92px] flex flex-col justify-center">
                      <input
                        type="url"
                        placeholder="Paste image link: https://images.unsplash.com/..."
                        value={bannerUrl}
                        onChange={(e) => {
                          setBannerUrl(e.target.value);
                          setUploadedBannerName(null);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-[#0099e6] transition-colors"
                      />
                      <p className="text-[11px] text-slate-500 font-medium">
                        Paste any public HTTPS image link from Unsplash, Imgur, or your CDN.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Banner Visual Preview with clear spacing */}
              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-white/[0.06] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#0099e6]" />
                    <span>Banner Live Preview</span>
                  </span>

                  {bannerUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setBannerUrl('');
                        setUploadedBannerName(null);
                      }}
                      className="text-rose-500 hover:text-rose-600 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>

                <div className="relative h-48 sm:h-56 w-full rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/[0.08] bg-gradient-to-br from-[#0c1017] via-[#090d16] to-[#05070d] shadow-inner flex flex-col justify-end">
                  {bannerUrl ? (
                    <>
                      <Image
                        src={bannerUrl}
                        alt="Banner preview"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                    </>
                  ) : (
                    <>
                      {/* Subtle futuristic tech grid & ambient glow when no photo is uploaded */}
                      <div className="absolute top-0 right-0 w-80 h-80 bg-[#0099e6]/10 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute bottom-0 left-10 w-64 h-64 bg-sky-500/05 rounded-full blur-2xl pointer-events-none" />
                      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                    </>
                  )}

                  <div className="relative z-10 p-5 sm:p-6 space-y-1.5">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-black uppercase tracking-wider bg-[#0099e6] text-white shadow-md shadow-sky-500/25">
                      #{category}
                    </span>
                    <h3 className="text-base sm:text-xl font-bold text-white line-clamp-1 drop-shadow-sm">
                      {title || 'Your headline will look like this'}
                    </h3>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Editor Card with Formatting Toolbar & Live Preview */}
            <div className="rounded-3xl bg-white/80 dark:bg-[#090e17]/80 border border-slate-200/90 dark:border-white/[0.08] backdrop-blur-xl shadow-xl overflow-hidden">
              {/* Tab Switcher & Formatting Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4 bg-slate-50/80 dark:bg-white/[0.03] border-b border-slate-200/80 dark:border-white/[0.08]">
                {/* Editor / Preview Mode Tabs */}
                <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-white/[0.06] p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab('write')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'write'
                        ? 'bg-white dark:bg-[#0c1017] text-[#0099e6] shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Write</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'preview'
                        ? 'bg-white dark:bg-[#0c1017] text-[#0099e6] shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                </div>

                {/* Markdown Quick Formatting Toolbar (Enabled in Write mode) */}
                {activeTab === 'write' && (
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyInlineFormat('**', '**', 'bold text')}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-[#0099e6] transition-colors cursor-pointer"
                      title="Bold (**text**) [⌘B / Ctrl+B]"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyInlineFormat('*', '*', 'italic text')}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-[#0099e6] transition-colors cursor-pointer"
                      title="Italic (*text*) [⌘I / Ctrl+I]"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/[0.1] mx-0.5" />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyBlockFormat('###', 'Heading 3')}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-[#0099e6] transition-colors cursor-pointer"
                      title="Heading 3 (### Heading)"
                    >
                      <Heading3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyBlockFormat('##', 'Heading 2')}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-[#0099e6] transition-colors cursor-pointer"
                      title="Heading 2 (## Heading)"
                    >
                      <Heading2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-[1px] h-4 bg-slate-200 dark:bg-white/[0.1] mx-0.5" />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyBlockFormat('-', 'List item')}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-[#0099e6] transition-colors cursor-pointer"
                      title="Bullet List (- item)"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyBlockFormat('1.', 'Numbered item')}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-[#0099e6] transition-colors cursor-pointer"
                      title="Numbered List (1. item)"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={applyCodeBlock}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-[#0099e6] transition-colors cursor-pointer"
                      title="Code block (```code```)"
                    >
                      <Code className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applyBlockFormat('>', 'Quote')}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-[#0099e6] transition-colors cursor-pointer"
                      title="Quote (> quote)"
                    >
                      <Quote className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={applyLink}
                      className="p-1.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/[0.08] hover:text-[#0099e6] transition-colors cursor-pointer"
                      title="Link [text](url)"
                    >
                      <LinkIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Editor Workspace */}
              <div className="p-4 sm:p-6 min-h-[380px]">
                {activeTab === 'write' ? (
                  <textarea
                    ref={textareaRef}
                    required
                    rows={16}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    onKeyDown={handleTextareaKeyDown}
                    placeholder="Write your tech playbook using markdown headings, bullets, code blocks..."
                    className="w-full h-full min-h-[360px] bg-transparent text-sm sm:text-base text-slate-900 dark:text-slate-100 font-mono outline-none resize-y leading-relaxed"
                  />
                ) : (
                  <div className="space-y-4 max-w-none text-slate-800 dark:text-slate-200 font-sans text-sm sm:text-base leading-relaxed">
                    {content ? (
                      content.split(/\n\n+/).map((para, idx) => {
                        const trimmed = para.trim();
                        if (trimmed.startsWith('### ')) {
                          return (
                            <h3 key={idx} className="text-lg sm:text-xl font-black text-slate-900 dark:text-white pt-2">
                              {renderInlineMarkdown(trimmed.replace(/^###\s+/, ''))}
                            </h3>
                          );
                        }
                        if (trimmed.startsWith('## ')) {
                          return (
                            <h2 key={idx} className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white pt-3">
                              {renderInlineMarkdown(trimmed.replace(/^##\s+/, ''))}
                            </h2>
                          );
                        }
                        if (trimmed.startsWith('```')) {
                          return (
                            <pre key={idx} className="p-4 rounded-2xl bg-slate-900 text-sky-300 text-xs font-mono overflow-x-auto my-2 border border-slate-800">
                              <code>{trimmed.replace(/```[a-z]*\n?/gi, '')}</code>
                            </pre>
                          );
                        }
                        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                          return (
                            <ul key={idx} className="list-disc list-inside space-y-1 my-2 text-slate-700 dark:text-slate-300">
                              {trimmed.split('\n').map((line, lIdx) => (
                                <li key={lIdx}>{renderInlineMarkdown(line.replace(/^[-*]\s+/, ''))}</li>
                              ))}
                            </ul>
                          );
                        }
                        if (/^\d+\.\s+/.test(trimmed)) {
                          return (
                            <ol key={idx} className="list-decimal list-inside space-y-1 my-2 text-slate-700 dark:text-slate-300">
                              {trimmed.split('\n').map((line, lIdx) => (
                                <li key={lIdx}>{renderInlineMarkdown(line.replace(/^\d+\.\s+/, ''))}</li>
                              ))}
                            </ol>
                          );
                        }
                        if (trimmed.startsWith('> ')) {
                          return (
                            <blockquote key={idx} className="border-l-4 border-[#0099e6] pl-4 py-1 italic text-slate-600 dark:text-slate-400">
                              {renderInlineMarkdown(trimmed.replace(/^>\s+/, ''))}
                            </blockquote>
                          );
                        }
                        return <p key={idx}>{renderInlineMarkdown(trimmed)}</p>;
                      })
                    ) : (
                      <p className="text-slate-400 italic">No content yet. Write something in the Write tab!</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Author & Tags Details */}
            <div className="p-6 sm:p-8 rounded-3xl bg-white/80 dark:bg-[#090e17]/80 border border-slate-200/90 dark:border-white/[0.08] backdrop-blur-xl shadow-xl space-y-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#0099e6]" />
                <span>Author Details & Tags</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Author Name <span className="text-[#ea580c]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Your Name / Handle"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#0099e6] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Contact Email (for approval notification)
                  </label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={authorEmail}
                    onChange={(e) => setAuthorEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#0099e6] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Agentic AI, LangGraph, Architecture, Production"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-[#0099e6] transition-colors"
                />
              </div>

              {/* Moderation Notice & Submit Button */}
              <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <HelpCircle className="w-4 h-4 text-[#0099e6] shrink-0" />
                  <span>Submissions are reviewed by Hacker’s Unity admins before appearing live.</span>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-7 py-3 rounded-full bg-gradient-to-r from-[#0099e6] to-sky-500 hover:from-[#0088cc] hover:to-sky-600 text-white font-bold text-sm shadow-xl shadow-sky-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting for Review...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Publish & Submit for Review</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
