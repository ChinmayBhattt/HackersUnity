import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { eventSlug, eventId, code, referrer } = body;

    if (!code || (!eventSlug && !eventId)) {
      return NextResponse.json({ error: 'Missing code or event slug/id' }, { status: 400 });
    }

    const cleanCode = String(code).trim().toLowerCase();
    const supabaseAdmin = createAdminClient();

    // 1. Find the UTM link
    let query = supabaseAdmin
      .from('event_utm_links')
      .select('id, event_id, event_slug, clicks_count, code')
      .eq('code', cleanCode);

    if (eventId) {
      query = query.eq('event_id', eventId);
    } else if (eventSlug) {
      query = query.or(`event_slug.eq.${eventSlug},event_id.eq.${eventSlug}`);
    }

    const { data: link, error } = await query.maybeSingle();

    if (!error && link) {
      // Increment clicks_count in database
      const newCount = Number(link.clicks_count || 0) + 1;
      await supabaseAdmin
        .from('event_utm_links')
        .update({ clicks_count: newCount, updated_at: new Date().toISOString() })
        .eq('id', link.id);

      // Record detailed click in event_utm_clicks
      try {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
        const userAgent = req.headers.get('user-agent') || 'unknown';
        await supabaseAdmin.from('event_utm_clicks').insert({
          utm_link_id: link.id,
          event_id: link.event_id,
          ip_hash: ip,
          user_agent: userAgent,
          referrer: referrer || null,
        });
      } catch {}

      return NextResponse.json({ success: true, clicksCount: newCount, linkId: link.id });
    }

    // Fallback: If table missing or link in custom_questions
    if (eventId || eventSlug) {
      try {
        const evQuery = eventId
          ? supabaseAdmin.from('events').select('id, slug, custom_questions').eq('id', eventId)
          : supabaseAdmin.from('events').select('id, slug, custom_questions').or(`slug.eq.${eventSlug},id.eq.${eventSlug}`);

        const { data: ev } = await evQuery.maybeSingle();
        if (ev) {
          const customQuestions = (ev.custom_questions as any[]) || [];
          const utmIdx = customQuestions.findIndex((q: any) => q?.__is_utm_container);
          if (utmIdx >= 0) {
            const links = customQuestions[utmIdx].links || [];
            const targetLink = links.find((l: any) => l.code === cleanCode);
            if (targetLink) {
              targetLink.clicksCount = Number(targetLink.clicksCount || targetLink.clicks_count || 0) + 1;
              targetLink.clicks_count = targetLink.clicksCount;
              await supabaseAdmin
                .from('events')
                .update({ custom_questions: customQuestions })
                .eq('id', ev.id);

              return NextResponse.json({ success: true, clicksCount: targetLink.clicksCount });
            }
          }
        }
      } catch {}
    }

    return NextResponse.json({ success: false, message: 'Link not found' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
