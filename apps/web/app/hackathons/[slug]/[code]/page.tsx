'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles } from 'lucide-react';

interface UtmRedirectPageProps {
  params: Promise<{ slug: string; code: string }>;
}

export default function UtmRedirectPage({ params }: UtmRedirectPageProps) {
  const { slug, code } = use(params);
  const router = useRouter();

  useEffect(() => {
    if (!slug || !code) return;

    // Avoid intercepting reserved Next.js routes if accessed directly
    if (code === 'register' || code === 'invite' || code === 'promoter' || code === 'partner') return;

    const cleanCode = decodeURIComponent(code).trim().toLowerCase();

    // 1. Record click in database
    try {
      fetch('/api/utm/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventSlug: slug,
          code: cleanCode,
          referrer: typeof document !== 'undefined' ? document.referrer : '',
        }),
      }).catch((e) => console.warn('Failed to record UTM click:', e));
    } catch {}

    // 2. Persist in localStorage and Cookie for attribution at registration time
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('hu_utm_code', cleanCode);
        localStorage.setItem(`hu_utm_event_${slug}`, cleanCode);
        document.cookie = `hu_utm_${slug}=${encodeURIComponent(cleanCode)}; path=/; max-age=2592000; SameSite=Lax`;
        document.cookie = `hu_utm_code=${encodeURIComponent(cleanCode)}; path=/; max-age=2592000; SameSite=Lax`;
      }
    } catch {}

    // 3. Smoothly navigate to the hackathon page with referral parameter
    router.replace(`/hackathons/${slug}?ref=${encodeURIComponent(cleanCode)}`);
  }, [slug, code, router]);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 bg-slate-50/50 dark:bg-[#070b12]">
      <div className="w-16 h-16 rounded-3xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 flex items-center justify-center shadow-lg shadow-sky-500/5 mb-6 animate-pulse">
        <Sparkles className="w-8 h-8 text-[#0099e6]" />
      </div>
      <div className="flex items-center gap-2.5 mb-2">
        <Loader2 className="w-5 h-5 text-[#0099e6] animate-spin" />
        <h3 className="text-base font-black text-slate-900 dark:text-white">Connecting to Event Arena...</h3>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center max-w-sm">
        Verifying referral and preparing hackathon registration portal...
      </p>
    </div>
  );
}
