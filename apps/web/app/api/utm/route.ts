import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

interface UtmLinkPayload {
  eventId: string;
  eventSlug: string;
  code: string;
  customName?: string;
  userId?: string | null;
}

// ─── GET /api/utm ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');
    const summary = searchParams.get('summary') === 'true';

    const supabaseAdmin = createAdminClient();

    // 1. Return summary across all events for left-hand side list badges
    if (summary) {
      try {
        const { data: links, error } = await supabaseAdmin
          .from('event_utm_links')
          .select('id, event_id, clicks_count, confirmed_registrations_count');

        if (error) {
          if (error.code === '42P01' || error.message?.toLowerCase().includes('does not exist')) {
            return NextResponse.json({ summary: {}, tableNeedsMigration: true });
          }
          console.warn('[UTM Summary] Error fetching summary:', error.message);
          return NextResponse.json({ summary: {} });
        }

        const summaryMap: Record<
          string,
          { totalLinks: number; totalClicks: number; totalRegistrations: number }
        > = {};

        (links || []).forEach((l: any) => {
          if (!summaryMap[l.event_id]) {
            summaryMap[l.event_id] = { totalLinks: 0, totalClicks: 0, totalRegistrations: 0 };
          }
          summaryMap[l.event_id].totalLinks += 1;
          summaryMap[l.event_id].totalClicks += Number(l.clicks_count || 0);
          summaryMap[l.event_id].totalRegistrations += Number(l.confirmed_registrations_count || 0);
        });

        return NextResponse.json({ summary: summaryMap, tableNeedsMigration: false });
      } catch (err: any) {
        return NextResponse.json({ summary: {} });
      }
    }

    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId query parameter' }, { status: 400 });
    }

    // 2. Fetch all UTM links for this event
    let rawLinks: any[] = [];
    let tableNeedsMigration = false;

    try {
      const { data, error } = await supabaseAdmin
        .from('event_utm_links')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01' || error.message?.toLowerCase().includes('does not exist')) {
          tableNeedsMigration = true;
          // Fallback to custom_questions on event if table not created yet
          const { data: evData } = await supabaseAdmin
            .from('events')
            .select('custom_questions')
            .eq('id', eventId)
            .maybeSingle();

          const fallbackList = (evData?.custom_questions as any[]) || [];
          const utmEntry = fallbackList.find((item: any) => item?.__is_utm_container);
          rawLinks = utmEntry?.links || [];
        } else {
          console.error('[UTM API] Error fetching links:', error.message);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      } else {
        rawLinks = data || [];
      }
    } catch (err: any) {
      console.warn('[UTM API] Query exception:', err);
      rawLinks = [];
    }

    // 3. Enrich links with user profile information
    const userIds = Array.from(new Set(rawLinks.map((l) => l.user_id).filter(Boolean)));
    const userMap: Record<string, any> = {};

    if (userIds.length > 0) {
      try {
        const { data: profiles } = await supabaseAdmin
          .from('profiles')
          .select('id, name, email, avatar_url, username, college, organization, role')
          .in('id', userIds);

        (profiles || []).forEach((p: any) => {
          userMap[p.id] = p;
        });
      } catch (profErr) {
        console.warn('[UTM API] Profiles fetch warning:', profErr);
      }
    }

    // 4. Query live registrations that used these UTM codes
    const linkCodes = rawLinks.map((l) => l.code).filter(Boolean);
    const registrationsByCode: Record<string, any[]> = {};

    if (linkCodes.length > 0) {
      try {
        // Query registrations table for matching event
        const { data: eventRegs } = await supabaseAdmin
          .from('registrations')
          .select('id, user_name, user_email, registered_at, status, custom_answers')
          .eq('event_id', eventId);

        (eventRegs || []).forEach((r: any) => {
          const ans = r.custom_answers || {};
          const matchedCode = ans.utm_code || ans.utmCode || ans.ref_code || ans.ref;
          if (matchedCode) {
            const clean = String(matchedCode).trim().toLowerCase();
            if (!registrationsByCode[clean]) {
              registrationsByCode[clean] = [];
            }
            registrationsByCode[clean].push({
              id: r.id,
              userName: r.user_name,
              userEmail: r.user_email,
              registeredAt: r.registered_at,
              status: r.status || 'CONFIRMED',
            });
          }
        });
      } catch (regErr) {
        console.warn('[UTM API] Live registrations lookup warning:', regErr);
      }
    }

    // Assemble final response
    const enrichedLinks = rawLinks.map((link) => {
      const cleanCode = (link.code || '').trim().toLowerCase();
      const liveRegs = registrationsByCode[cleanCode] || [];
      const confirmedCount = Math.max(
        liveRegs.filter((r) => r.status === 'CONFIRMED').length,
        Number(link.confirmed_registrations_count || 0)
      );

      return {
        id: link.id,
        eventId: link.event_id,
        eventSlug: link.event_slug,
        code: link.code,
        customName: link.custom_name,
        userId: link.user_id,
        user: link.user_id ? userMap[link.user_id] || null : null,
        clicksCount: Number(link.clicks_count || 0),
        confirmedRegistrationsCount: confirmedCount,
        registeredUsers: liveRegs,
        createdAt: link.created_at,
        updatedAt: link.updated_at,
      };
    });

    return NextResponse.json({
      links: enrichedLinks,
      tableNeedsMigration,
    });
  } catch (error: any) {
    console.error('[UTM API] GET error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

// ─── POST /api/utm ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as UtmLinkPayload;
    const { eventId, eventSlug, code, customName, userId } = body;

    if (!eventId || !eventSlug || !code) {
      return NextResponse.json(
        { error: 'Missing required fields: eventId, eventSlug, and code are required.' },
        { status: 400 }
      );
    }

    // Normalize code (alphanumeric, hyphens, underscores)
    const cleanCode = code
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-');

    if (!cleanCode) {
      return NextResponse.json({ error: 'Invalid custom link slug.' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // 1. Verify user profile exists if userId provided
    let promoterProfile: any = null;
    if (userId) {
      const { data: prof } = await supabaseAdmin
        .from('profiles')
        .select('id, name, email, avatar_url, username, college')
        .eq('id', userId)
        .maybeSingle();

      promoterProfile = prof || null;
    }

    // 2. Try inserting into event_utm_links table
    try {
      const { data: existing } = await supabaseAdmin
        .from('event_utm_links')
        .select('id')
        .eq('event_id', eventId)
        .eq('code', cleanCode)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: `A UTM link with the code "${cleanCode}" already exists for this event.` },
          { status: 409 }
        );
      }

      const { data: inserted, error: insertErr } = await supabaseAdmin
        .from('event_utm_links')
        .insert({
          event_id: eventId,
          event_slug: eventSlug,
          code: cleanCode,
          custom_name: customName || cleanCode,
          user_id: userId || null,
          clicks_count: 0,
          confirmed_registrations_count: 0,
          created_by: 'admin',
        })
        .select('*')
        .single();

      if (insertErr) {
        // Table does not exist (42P01) -> Fall back to events.custom_questions
        if (insertErr.code === '42P01' || insertErr.message?.toLowerCase().includes('does not exist')) {
          console.warn('[UTM API] event_utm_links table missing, using event metadata fallback');
          const fallbackLink = await saveFallbackUtmLink(supabaseAdmin, {
            eventId,
            eventSlug,
            code: cleanCode,
            customName: customName || cleanCode,
            userId: userId || null,
          });

          return NextResponse.json({
            success: true,
            link: {
              ...fallbackLink,
              user: promoterProfile,
            },
            tableNeedsMigration: true,
            message: 'UTM link created successfully! Run apps/web/supabase/utm-tracking-migration.sql in Supabase for full database indexing.',
          });
        }

        console.error('[UTM API] Insert error:', insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        link: {
          ...inserted,
          eventId: inserted.event_id,
          eventSlug: inserted.event_slug,
          customName: inserted.custom_name,
          clicksCount: 0,
          confirmedRegistrationsCount: 0,
          user: promoterProfile,
        },
        message: 'Custom UTM referral link created successfully!',
      });
    } catch (dbErr: any) {
      console.error('[UTM API] DB Exception:', dbErr);
      return NextResponse.json({ error: dbErr.message || 'Database error' }, { status: 500 });
    }
  } catch (err: any) {
    console.error('[UTM API] POST error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

// ─── DELETE /api/utm ─────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const linkId = searchParams.get('id');
    const eventId = searchParams.get('eventId');
    const code = searchParams.get('code');

    if (!linkId && (!eventId || !code)) {
      return NextResponse.json({ error: 'Missing link id or eventId & code' }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    try {
      if (linkId) {
        const { error } = await supabaseAdmin.from('event_utm_links').delete().eq('id', linkId);
        if (error && error.code !== '42P01') {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      } else if (eventId && code) {
        await supabaseAdmin
          .from('event_utm_links')
          .delete()
          .eq('event_id', eventId)
          .eq('code', code);
      }
    } catch {}

    // Also clean up fallback if any
    if (eventId && (code || linkId)) {
      try {
        const { data: evData } = await supabaseAdmin
          .from('events')
          .select('custom_questions')
          .eq('id', eventId)
          .maybeSingle();

        const customQuestions = (evData?.custom_questions as any[]) || [];
        const utmIdx = customQuestions.findIndex((q: any) => q?.__is_utm_container);
        if (utmIdx >= 0) {
          const links = customQuestions[utmIdx].links || [];
          const updatedLinks = links.filter((l: any) => l.id !== linkId && l.code !== code);
          customQuestions[utmIdx].links = updatedLinks;
          await supabaseAdmin
            .from('events')
            .update({ custom_questions: customQuestions })
            .eq('id', eventId);
        }
      } catch {}
    }

    return NextResponse.json({ success: true, message: 'UTM link deleted successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── Fallback Storage in events.custom_questions ─────────────────────────────
async function saveFallbackUtmLink(
  supabaseAdmin: any,
  item: { eventId: string; eventSlug: string; code: string; customName: string; userId: string | null }
) {
  const { data: evData } = await supabaseAdmin
    .from('events')
    .select('custom_questions')
    .eq('id', item.eventId)
    .maybeSingle();

  const customQuestions = (evData?.custom_questions as any[]) || [];
  let utmIdx = customQuestions.findIndex((q: any) => q?.__is_utm_container);

  if (utmIdx < 0) {
    customQuestions.push({
      __is_utm_container: true,
      links: [],
    });
    utmIdx = customQuestions.length - 1;
  }

  const newLink = {
    id: `utm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    eventId: item.eventId,
    event_id: item.eventId,
    eventSlug: item.eventSlug,
    event_slug: item.eventSlug,
    code: item.code,
    customName: item.customName,
    custom_name: item.customName,
    userId: item.userId,
    user_id: item.userId,
    clicksCount: 0,
    clicks_count: 0,
    confirmedRegistrationsCount: 0,
    confirmed_registrations_count: 0,
    createdAt: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };

  customQuestions[utmIdx].links.push(newLink);

  await supabaseAdmin
    .from('events')
    .update({ custom_questions: customQuestions })
    .eq('id', item.eventId);

  return newLink;
}
