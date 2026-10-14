import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createAdminClient } from '@/lib/api-auth';
import { getAllEvents } from '@/lib/storage';

interface RsvpPayload {
  eventId: string;
  email: string;
  teamName: string;
  personName: string;
  attending: boolean;
  attendanceCount?: number;
  dietaryPreference?: string;
  tshirtSize?: string;
  phone?: string;
  hardwareRequirement?: string;
  remarks?: string;
  declineReason?: string;
  origin?: string;
}

/**
 * GET /api/rsvp: Check registration and existing RSVP state
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const eventIdParam = searchParams.get('eventId') || searchParams.get('slug');
    const emailParam = searchParams.get('email');

    if (!eventIdParam) {
      return NextResponse.json({ error: 'Missing eventId or slug' }, { status: 400 });
    }

    const serverSupabase = createAdminClient();

    // 1. Resolve event details
    let resolvedEvent: any = null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventIdParam);

    try {
      if (isUuid) {
        const { data: ev } = await serverSupabase
          .from('events')
          .select('id, title, slug, location, start_date, end_date, banner_url, mode, organizer_id')
          .eq('id', eventIdParam)
          .maybeSingle();
        resolvedEvent = ev;
      } else {
        const { data: ev } = await serverSupabase
          .from('events')
          .select('id, title, slug, location, start_date, end_date, banner_url, mode, organizer_id')
          .eq('slug', eventIdParam)
          .maybeSingle();
        resolvedEvent = ev;
      }

      // If not resolved yet, search by title or slug substring
      if (!resolvedEvent) {
        const { data: evMatches } = await serverSupabase
          .from('events')
          .select('id, title, slug, location, start_date, end_date, banner_url, mode, organizer_id')
          .or(`slug.ilike.%${eventIdParam}%,title.ilike.%${eventIdParam}%`)
          .limit(1);
        if (evMatches && evMatches[0]) {
          resolvedEvent = evMatches[0];
        } else if (/sphinx/i.test(eventIdParam)) {
          const { data: sphinxEv } = await serverSupabase
            .from('events')
            .select('id, title, slug, location, start_date, end_date, banner_url, mode, organizer_id')
            .ilike('title', '%SPHINX%')
            .maybeSingle();
          if (sphinxEv) resolvedEvent = sphinxEv;
        }
      }
    } catch (e) {
      console.warn('[api/rsvp] Supabase event fetch warning:', e);
    }

    // Fallback to mock / local events
    if (!resolvedEvent) {
      const allMocks = getAllEvents();
      resolvedEvent = allMocks.find((e: any) => e.id === eventIdParam || e.slug === eventIdParam) || null;
    }

    // 2. If email provided, fetch registration safely
    let existingRegistration: any = null;
    if (emailParam) {
      const cleanEmail = emailParam.toLowerCase().trim();
      try {
        const targetId = resolvedEvent?.id;
        const isTargetUuid = targetId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetId);

        let query = serverSupabase
          .from('registrations')
          .select('*')
          .eq('user_email', cleanEmail);

        if (isTargetUuid) {
          query = query.eq('event_id', targetId);
        }

        const { data: reg } = await query.order('registered_at', { ascending: false }).limit(1).maybeSingle();

        if (reg) {
          existingRegistration = {
            id: reg.id,
            userName: reg.user_name,
            userEmail: reg.user_email,
            teamName: reg.team_name,
            phone: reg.phone,
            status: reg.status,
            tshirtSize: reg.tshirt_size || reg.custom_answers?.tshirtSize || reg.custom_answers?.tshirt_size,
            dietaryPreference: reg.dietary_preference || reg.custom_answers?.dietaryPreference || reg.custom_answers?.dietary_preference,
            rsvpStatus: reg.custom_answers?.rsvpStatus || (reg.status === 'CONFIRMED' ? 'ATTENDING' : null),
            rsvpAt: reg.custom_answers?.rsvpAt || null,
            rsvpData: reg.custom_answers || {},
          };
        }
      } catch (regErr) {
        console.warn('[api/rsvp] Registration lookup error:', regErr);
      }
    }

    return NextResponse.json({
      success: true,
      event: resolvedEvent ? {
        id: resolvedEvent.id,
        title: resolvedEvent.title,
        slug: resolvedEvent.slug || resolvedEvent.id,
        location: resolvedEvent.location,
        mode: resolvedEvent.mode,
        startDate: resolvedEvent.start_date || resolvedEvent.startDate,
        endDate: resolvedEvent.end_date || resolvedEvent.endDate,
        bannerUrl: resolvedEvent.banner_url || resolvedEvent.bannerUrl,
      } : null,
      registration: existingRegistration,
    });
  } catch (err: any) {
    console.error('[api/rsvp] GET exception:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch RSVP details' }, { status: 500 });
  }
}

/**
 * POST /api/rsvp: Record candidate RSVP confirmation or decline
 */
export async function POST(req: Request) {
  try {
    const body: RsvpPayload = await req.json();
    const {
      eventId,
      eventTitle: inputEventTitle,
      email,
      teamName,
      personName,
      attending,
      attendanceCount = 1,
      dietaryPreference = 'Veg',
      tshirtSize = 'L',
      phone,
      hardwareRequirement,
      remarks,
      declineReason,
      origin,
    } = body as any;

    if (!eventId || !email || !teamName || !personName) {
      return NextResponse.json(
        { error: 'Missing required RSVP fields (eventId, email, teamName, personName)' },
        { status: 400 }
      );
    }

    const cleanPhone = String(phone || '').trim();
    const phoneDigits = cleanPhone.replace(/\D/g, '');
    if (!cleanPhone || phoneDigits.length < 10) {
      return NextResponse.json(
        { error: 'WhatsApp / Contact Number is mandatory and must contain at least 10 digits.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const serverSupabase = createAdminClient();

    // 1. Resolve event UUID
    let targetEventId = eventId;
    let eventTitle = inputEventTitle || 'Hackathon Event';
    let eventSlug = eventId;

    let isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
    try {
      if (isUuid) {
        const { data: evData } = await serverSupabase
          .from('events')
          .select('id, title, slug')
          .eq('id', eventId)
          .maybeSingle();
        if (evData?.id) {
          targetEventId = evData.id;
          eventTitle = evData.title || eventTitle;
          eventSlug = evData.slug || eventSlug;
        }
      } else {
        const { data: evBySlug } = await serverSupabase
          .from('events')
          .select('id, title, slug')
          .eq('slug', eventId)
          .maybeSingle();
        if (evBySlug?.id) {
          targetEventId = evBySlug.id;
          eventTitle = evBySlug.title || eventTitle;
          eventSlug = evBySlug.slug || eventSlug;
        } else {
          const { data: evMatches } = await serverSupabase
            .from('events')
            .select('id, title, slug')
            .or(`slug.ilike.%${eventId}%,title.ilike.%${inputEventTitle || eventId}%`)
            .limit(1);
          if (evMatches && evMatches[0]) {
            targetEventId = evMatches[0].id;
            eventTitle = evMatches[0].title || eventTitle;
            eventSlug = evMatches[0].slug || eventSlug;
          } else if (/sphinx/i.test(eventId) || /sphinx/i.test(inputEventTitle || '')) {
            const { data: sphinxEv } = await serverSupabase
              .from('events')
              .select('id, title, slug')
              .ilike('title', '%SPHINX%')
              .maybeSingle();
            if (sphinxEv?.id) {
              targetEventId = sphinxEv.id;
              eventTitle = sphinxEv.title;
              eventSlug = sphinxEv.slug;
            }
          }
        }
      }
    } catch (e) {
      console.warn('[api/rsvp] Event lookup warning:', e);
    }

    // Fallback: If targetEventId is still not a valid UUID, search by mock or get active event from Supabase
    isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetEventId);
    if (!isUuid) {
      try {
        const { data: latestEv } = await serverSupabase
          .from('events')
          .select('id, title, slug')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latestEv?.id) {
          targetEventId = latestEv.id;
          isUuid = true;
          if (!inputEventTitle) eventTitle = latestEv.title;
          if (!eventSlug) eventSlug = latestEv.slug;
        }
      } catch {}
    }

    const rsvpStatus = attending ? 'ATTENDING' : 'NOT_ATTENDING';
    const finalStatus = attending ? 'CONFIRMED' : 'REJECTED';
    const nowIso = new Date().toISOString();

    // 2. Fetch existing registration to preserve previous fields
    let existingReg: any = null;
    if (isUuid) {
      try {
        const { data: reg } = await serverSupabase
          .from('registrations')
          .select('*')
          .eq('event_id', targetEventId)
          .eq('user_email', cleanEmail)
          .maybeSingle();
        existingReg = reg;
      } catch (err: any) {
        console.warn('[api/rsvp] Reg lookup warning:', err?.message);
      }
    }

    const customAnswers = {
      ...(existingReg?.custom_answers || {}),
      rsvpStatus,
      rsvpAt: nowIso,
      attending,
      attendanceCount: String(attendanceCount),
      dietaryPreference,
      tshirtSize,
      phone: cleanPhone,
      ...(hardwareRequirement ? { hardwareRequirement } : {}),
      ...(remarks ? { remarks } : {}),
      ...(declineReason ? { declineReason } : {}),
    };

    const updatePayload: any = {
      event_id: targetEventId,
      user_name: personName,
      user_email: cleanEmail,
      team_name: teamName,
      phone: cleanPhone,
      status: finalStatus,
      dietary_preference: dietaryPreference,
      tshirt_size: tshirtSize,
      custom_answers: customAnswers,
    };

    // If existing registration, update it
    let dbSuccess = false;
    if (isUuid) {
      try {
        if (existingReg?.id) {
          const { error: updateErr } = await serverSupabase
            .from('registrations')
            .update(updatePayload)
            .eq('id', existingReg.id);

          if (!updateErr) {
            dbSuccess = true;
          } else {
            console.warn('[api/rsvp] Update DB error:', updateErr.message);
          }
        } else {
          // If no registration row exists yet, create one
          updatePayload.registered_at = nowIso;
          updatePayload.role = 'Team Leader';
          const { error: insertErr } = await serverSupabase
            .from('registrations')
            .insert(updatePayload);

          if (!insertErr) {
            dbSuccess = true;
          } else {
            console.warn('[api/rsvp] Insert DB error:', insertErr.message);
          }
        }
      } catch (dbErr: any) {
        console.warn('[api/rsvp] Supabase error:', dbErr?.message);
      }
    }

    // 3. Dispatch an automated RSVP receipt / confirmation email
    const baseUrl = origin || process.env.NEXT_PUBLIC_APP_URL || 'https://hackersunity.com';
    const fromEmail = process.env.RESEND_FROM_EMAIL || "Hacker's Unity <info@hackersunity.com>";

    const emailSubject = attending
      ? `RSVP Confirmed! See you at ${eventTitle} 🚀`
      : `RSVP Status Update: ${eventTitle}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${emailSubject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="560" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #1e293b;">
          <tr>
            <td style="background: linear-gradient(135deg, #060913 0%, #0c1527 100%); padding: 28px 32px; border-bottom: 2px solid ${attending ? '#10b981' : '#f43f5e'};">
              <div style="font-size: 20px; font-weight: 900; color: #ffffff;">
                Hacker&apos;s Unity
              </div>
              <div style="font-size: 12px; color: #94a3b8; margin-top: 4px;">
                ${attending ? '🎉 Spot Confirmed' : 'RSVP Response Recorded'}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0;">
                Hi ${personName},
              </h2>
              <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 18px 0;">
                ${attending
                  ? `Your attendance for <strong>${eventTitle}</strong> is officially locked in! We have notified the organizing committee and reserved your mentor slots and participant swag.`
                  : `We have received your decision that team <strong>${teamName}</strong> cannot attend <strong>${eventTitle}</strong>. Your reserved spot has been respectfully transferred to waitlisted hackers.`}
              </p>

              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin: 20px 0;">
                <tr>
                  <td style="padding: 16px;">
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">Team Name: <strong style="color: #0f172a;">${teamName}</strong></div>
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">Participant: <strong style="color: #0f172a;">${personName}</strong> (${cleanEmail})</div>
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">WhatsApp / Phone: <strong style="color: #0f172a;">${cleanPhone}</strong></div>
                    <div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">Status: <strong style="color: ${attending ? '#059669' : '#dc2626'};">${attending ? 'ATTENDING (CONFIRMED)' : 'DECLINED'}</strong></div>
                    ${attending ? `<div style="font-size: 12px; color: #64748b; margin-bottom: 6px;">Members Attending: <strong style="color: #0f172a;">${attendanceCount}</strong></div>` : ''}
                    ${attending ? `<div style="font-size: 12px; color: #64748b;">Food / Dietary: <strong style="color: #0f172a;">${dietaryPreference}</strong></div>` : ''}
                  </td>
                </tr>
              </table>

              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0 12px 0;">
                <tr>
                  <td align="center">
                    <a href="${baseUrl}/hackathons/${eventSlug}" target="_blank" style="display: inline-block; background-color: #0099e6; color: #ffffff; font-size: 13px; font-weight: 800; text-decoration: none; padding: 12px 28px; border-radius: 10px;">
                      View Event Page →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 18px 32px; text-align: center; font-size: 11px; color: #94a3b8;">
              Hacker&apos;s Unity Platform • Reply to info@hackersunity.com if you need any adjustments.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Attempt email dispatch via Resend or SMTP
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: fromEmail,
          to: cleanEmail,
          subject: emailSubject,
          html: emailHtml,
        });
      } catch (emErr) {
        console.warn('[api/rsvp] Resend confirmation warning:', emErr);
      }
    } else if (process.env.SMTP_HOST || (process.env.GMAIL_USER && process.env.GMAIL_APP_PASS)) {
      try {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASS,
          },
        });
        await transporter.sendMail({
          from: process.env.SMTP_FROM || fromEmail,
          to: cleanEmail,
          subject: emailSubject,
          html: emailHtml,
        });
      } catch (smtpErr) {
        console.warn('[api/rsvp] SMTP confirmation warning:', smtpErr);
      }
    }

    return NextResponse.json({
      success: true,
      attending,
      rsvpStatus,
      status: finalStatus,
      message: attending
        ? `RSVP Confirmed for team "${teamName}"! See you at ${eventTitle}.`
        : `RSVP updated. Thank you for letting us know about team "${teamName}".`,
      dbSynced: dbSuccess,
    });
  } catch (err: any) {
    console.error('[api/rsvp] POST error:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit RSVP' }, { status: 500 });
  }
}
