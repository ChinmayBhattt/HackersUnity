import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import {
  authenticateRequest,
  unauthorizedResponse,
  rateLimitedResponse,
  createAdminClient,
} from '@/lib/api-auth';
import { checkRateLimit, EMAIL_RATE_LIMIT } from '@/lib/rate-limit';

interface RecipientInput {
  name?: string;
  email: string;
  teamName?: string;
  college?: string;
  status?: string;
  amount?: number | string;
  paymentUrl?: string;
  ctaUrl?: string;
  eventTitle?: string;
}

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest(req);
    // Allow if authenticated user or CSAP cookie is present
    const cookieHeader = req.headers.get('cookie') || '';
    const isAdminCsap = cookieHeader.includes('is_admin_csap=1');
    const adminEmail = (process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || '').toLowerCase().trim();

    const body = await req.json();
    const isCallerAdmin = Boolean(
      isAdminCsap ||
      (adminEmail && (
        (auth?.email && auth.email.toLowerCase().trim() === adminEmail) ||
        (body?.senderEmail && body.senderEmail.toLowerCase().trim() === adminEmail)
      )) ||
      (auth?.user?.user_metadata?.role === 'ADMIN' ||
       auth?.user?.user_metadata?.role === 'SUPER_ADMIN' ||
       auth?.user?.user_metadata?.role === 'ORGANIZER')
    );

    if (!auth && !isCallerAdmin) {
      return unauthorizedResponse('You must be signed in as an organizer or admin to send broadcast emails.');
    }

    if (auth && !isCallerAdmin) {
      const rateLimit = checkRateLimit(auth.userId, EMAIL_RATE_LIMIT);
      if (!rateLimit.allowed) {
        return rateLimitedResponse(rateLimit.resetInMs);
      }
    }

    const {
      eventId,
      eventTitle = 'Hackathon Event',
      recipients = [],
      subject,
      bodyText,
      templateType = 'general',
      actionButtonText,
      actionButtonUrl,
      isTest = false,
      testEmail,
      origin,
    } = body;

    if (!subject || !bodyText) {
      return NextResponse.json(
        { error: 'Email subject and body text are required.' },
        { status: 400 }
      );
    }

    // Resolve accurate base URL from request origin/headers so local dev points to localhost:3000
    const hostHeader = req.headers.get('x-forwarded-host') || req.headers.get('host') || '';
    const protoHeader =
      req.headers.get('x-forwarded-proto') || (hostHeader.includes('localhost') ? 'http' : 'https');
    const headerOrigin = req.headers.get('origin') || (hostHeader ? `${protoHeader}://${hostHeader}` : '');

    const baseUrl =
      origin ||
      headerOrigin ||
      (hostHeader.includes('localhost') ? `http://${hostHeader}` : null) ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://hackersunity.com';

    // 0. Query clean event slug from DB if eventId is provided (e.g. resolve evt_ai_... to sphinx-26)
    let resolvedEventSlug: string | null = null;
    if (eventId) {
      try {
        const adminSupabase = createAdminClient();
        const { data: eventData } = await adminSupabase
          .from('events')
          .select('id, slug, title')
          .or(`id.eq.${eventId},slug.eq.${eventId}`)
          .maybeSingle();

        if (eventData?.slug && !eventData.slug.startsWith('evt_')) {
          resolvedEventSlug = eventData.slug;
        }
      } catch (dbErr) {
        console.warn('[event-broadcast-email] Could not query event slug:', dbErr);
      }
    }
    if (!resolvedEventSlug && eventTitle && eventTitle.toLowerCase().includes('sphinx')) {
      resolvedEventSlug = 'sphinx-26';
    }

    const ctaUrl = actionButtonUrl || `${baseUrl}/dashboard`;
    const ctaText = actionButtonText || (templateType === 'payment_reminder' ? 'Complete Payment ({amount}) →' : 'Open Event Dashboard →');

    // Clean test payment URL with resolved slug
    const defaultTestSlug = resolvedEventSlug || 'sphinx-26';
    const rawTestPaymentUrl = body.testPaymentUrl || `${baseUrl}/hackathons/${defaultTestSlug}/register?step=4`;
    const cleanTestPaymentUrl = rawTestPaymentUrl.replace(/\/hackathons\/evt_[^/?#]+/g, `/hackathons/${defaultTestSlug}`);

    // Determine target list: if isTest, send to testEmail only
    const targetRecipients: RecipientInput[] = isTest
      ? [
          {
            name: body.testRecipientName || 'Chinmay Bhatt',
            email: testEmail || 'info@hackersunity.com',
            teamName: body.testTeamName || 'Solo Builder',
            college: body.testCollege || 'Participant',
            status: 'PENDING',
            amount: body.testAmount || 800,
            paymentUrl: cleanTestPaymentUrl,
            eventTitle: eventTitle,
          },
        ]
      : recipients;

    if (targetRecipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients selected for this email.' },
        { status: 400 }
      );
    }

    // Determine if this broadcast is an RSVP invitation
    const isRsvpFlow =
      templateType === 'rsvp' ||
      Boolean(ctaText && ctaText.toLowerCase().includes('rsvp')) ||
      Boolean(ctaUrl && ctaUrl.includes('/rsvp')) ||
      Boolean(subject && subject.toLowerCase().includes('rsvp'));

    // When organizers send an RSVP email, explicitly authorize/invite these participants in the database
    if (isRsvpFlow && !isTest && targetRecipients.length > 0 && eventId) {
      try {
        const adminSupabase = createAdminClient();
        const emails = targetRecipients.map((r) => r.email?.toLowerCase().trim()).filter(Boolean);
        if (emails.length > 0) {
          const isTargetUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
          let q = adminSupabase.from('registrations').select('id, user_email, custom_answers');
          if (isTargetUuid) {
            q = q.eq('event_id', eventId);
          }
          q = q.in('user_email', emails);
          const { data: matchedRegs } = await q;

          if (matchedRegs && matchedRegs.length > 0) {
            const nowIso = new Date().toISOString();
            for (const r of matchedRegs) {
              await adminSupabase
                .from('registrations')
                .update({
                  custom_answers: {
                    ...(r.custom_answers || {}),
                    rsvpInvited: true,
                    rsvpInvitedAt: nowIso,
                  },
                })
                .eq('id', r.id);
            }
          }
        }
      } catch (flagErr) {
        console.warn('[event-broadcast-email] Error setting rsvpInvited flag:', flagErr);
      }
    }

    // Default sender from info@hackersunity.com
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Hacker\'s Unity <info@hackersunity.com>';

    // Helper to generate personalized HTML email for a single recipient
    const generateHtml = (r: RecipientInput) => {
      const recipientName = r.name || 'Hacker';
      const teamName = r.teamName || recipientName;
      const recEventTitle = r.eventTitle || eventTitle;
      const cleanedAmount = typeof r.amount === 'string'
        ? Number(r.amount.replace(/[^0-9.-]+/g, ''))
        : Number(r.amount);
      const validAmount = !isNaN(cleanedAmount) && cleanedAmount > 0 ? cleanedAmount : 800;
      const formattedAmount = `₹${validAmount.toLocaleString('en-IN')}`;

      // Generate recipient CTA link (supports recipient-specific paymentUrl)
      let recipientCtaUrl = r.paymentUrl || r.ctaUrl || ctaUrl;
      const isRsvpFlow =
        templateType === 'rsvp' ||
        ctaText.toLowerCase().includes('rsvp') ||
        ctaUrl.includes('/rsvp');

      if (isRsvpFlow) {
        const rsvpParams = new URLSearchParams();
        if (eventId) rsvpParams.set('eventId', eventId);
        if (recEventTitle) rsvpParams.set('eventTitle', recEventTitle);
        if (r.email) rsvpParams.set('email', r.email);
        if (recipientName) rsvpParams.set('name', recipientName);
        if (teamName) rsvpParams.set('team', teamName);
        if (r.college) rsvpParams.set('college', r.college);
        recipientCtaUrl = `${baseUrl}/rsvp?${rsvpParams.toString()}`;
      }

      // Sanitize any raw evt_ internal IDs in URL
      const fallbackCleanSlug = resolvedEventSlug || (recEventTitle.toLowerCase().includes('sphinx') ? 'sphinx-26' : null);
      if (fallbackCleanSlug) {
        recipientCtaUrl = recipientCtaUrl.replace(/\/hackathons\/evt_[^/?#]+/g, `/hackathons/${fallbackCleanSlug}`);
      }

      // Styled clickable fallback link for any in-text {payment_url}
      const styledPaymentLink = `<a href="${recipientCtaUrl}" target="_blank" style="color: #0099e6; text-decoration: underline; font-weight: 600; word-break: break-all;">${recipientCtaUrl}</a>`;

      // Replace template variables
      let renderedBody = bodyText
        .replace(/\{name\}/gi, recipientName)
        .replace(/\{user\}/gi, recipientName)
        .replace(/\{team_name\}/gi, teamName)
        .replace(/\{team\}/gi, teamName)
        .replace(/\{event_title\}/gi, recEventTitle)
        .replace(/\{college\}/gi, r.college || 'Participant')
        .replace(/₹\s*\{amount\}/gi, formattedAmount)
        .replace(/\{amount\}/gi, formattedAmount)
        .replace(/₹\s*₹+/g, '₹')
        .replace(/\{payment_url\}/gi, styledPaymentLink)
        .replace(/\{rsvp_url\}/gi, styledPaymentLink)
        .replace(/\{status\}/gi, r.status || 'Registered');

      // Sanitize internal event IDs if in body text
      if (fallbackCleanSlug) {
        renderedBody = renderedBody.replace(/\/hackathons\/evt_[^/?#]+/g, `/hackathons/${fallbackCleanSlug}`);
      }

      // 1. Strip any leading greeting from bodyText to avoid "Hi Tanmay, Hi Tanmay," duplicate greeting
      renderedBody = renderedBody.replace(/^\s*(hi|hello|dear|hey)\s+[^,\n]+,?\s*/i, '').trim();

      // 2. Strip premature sign-off from bodyText so it doesn't appear awkwardly before the CTA button
      renderedBody = renderedBody.replace(/\n\s*(best regards|warm regards|regards|sincerely|thanks)\s*,?\s*[\r\n]+.*$/i, '').trim();

      // Handle rich HTML or markdown formatting for email clients
      const isHtml = /<[a-z][\s\S]*>/i.test(renderedBody);
      let bodyParagraphs = '';

      if (isHtml) {
        bodyParagraphs = renderedBody
          .replace(/<p(\s[^>]*)?>/gi, '<p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">')
          .replace(/<h1(\s[^>]*)?>/gi, '<h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 14px 0;">')
          .replace(/<h2(\s[^>]*)?>/gi, '<h2 style="font-size: 16px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">')
          .replace(/<ul(\s[^>]*)?>/gi, '<ul style="margin: 0 0 16px 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: #334155;">')
          .replace(/<ol(\s[^>]*)?>/gi, '<ol style="margin: 0 0 16px 0; padding-left: 20px; font-size: 14px; line-height: 1.6; color: #334155;">')
          .replace(/<li(\s[^>]*)?>/gi, '<li style="margin-bottom: 6px; font-size: 14px; color: #334155;">')
          .replace(/<a /gi, '<a style="color: #0099e6; text-decoration: underline;" ');
      } else {
        bodyParagraphs = renderedBody
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .split('\n\n')
          .map((p: string) => `<p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">${p.replace(/\n/g, '<br/>')}</p>`)
          .join('');
      }

      // Status/Type badge color
      let badgeBg = '#f1f5f9';
      let badgeColor = '#0284c7';
      let badgeLabel = 'Event Update';

      if (templateType === 'payment_reminder') {
        badgeBg = '#fff7ed';
        badgeColor = '#ea580c';
        badgeLabel = 'Action Required: Complete Payment';
      } else if (templateType === 'selection' || templateType === 'approval') {
        badgeBg = '#ecfdf5';
        badgeColor = '#059669';
        badgeLabel = 'Application Approved / Shortlisted';
      } else if (templateType === 'rejection') {
        badgeBg = '#fef2f2';
        badgeColor = '#dc2626';
        badgeLabel = 'Application Update';
      } else if (templateType === 'certificate') {
        badgeBg = '#eff6ff';
        badgeColor = '#2563eb';
        badgeLabel = 'Official Certificate';
      } else if (templateType === 'rsvp') {
        badgeBg = '#fffbeb';
        badgeColor = '#d97706';
        badgeLabel = 'Action Required: RSVP';
      }

      const personalCtaText = (ctaText || 'Complete Payment →')
        .replace(/₹\s*\{amount\}/gi, formattedAmount)
        .replace(/\{amount\}/gi, formattedAmount)
        .replace(/₹\s*₹+/g, '₹')
        .replace(/\{name\}/gi, recipientName)
        .replace(/\{team_name\}/gi, teamName);

      const htmlOutput = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="580" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.2); border: 1px solid #1e293b;">
          
          <!-- Modern Header Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #060913 0%, #0c1527 100%); padding: 32px 32px 28px 32px; border-bottom: 2px solid #0099e6;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; display: inline-flex; align-items: center;">
                      Hacker&apos;s Unity
                    </div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 4px; font-weight: 500;">
                      India&apos;s Fastest Growing Hackathon &amp; Builder Network
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 6px 12px; background: rgba(0, 153, 230, 0.15); border: 1px solid rgba(0, 153, 230, 0.4); border-radius: 9999px; color: #38bdf8; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${badgeLabel}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Event Headline Banner -->
          <tr>
            <td style="background: #f8fafc; padding: 18px 32px; border-bottom: 1px solid #e2e8f0;">
              <div style="font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                Event Name
              </div>
              <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-top: 2px;">
                ${eventTitle}
              </div>
            </td>
          </tr>

          <!-- Main Email Content Body -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 18px;">
                Hi ${recipientName},
              </div>

              ${bodyParagraphs}

              <!-- Highlight Information Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${badgeBg}; border-radius: 14px; border: 1px solid ${templateType === 'payment_reminder' ? '#fed7aa' : '#e2e8f0'}; margin: 24px 0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="34%" style="font-size: 12px; color: #64748b; font-weight: 600;">
                          Leader: <strong style="color: #0f172a;">${recipientName}</strong>
                        </td>
                        <td width="33%" align="center" style="font-size: 12px; color: #64748b; font-weight: 600;">
                          Squad: <strong style="color: ${badgeColor};">${teamName}</strong>
                        </td>
                        ${templateType === 'payment_reminder' ? `
                        <td width="33%" align="right" style="font-size: 12px; color: #64748b; font-weight: 600;">
                          Pending Due: <strong style="color: #ea580c; font-size: 13px;">${formattedAmount}</strong>
                        </td>` : ''}
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 16px 0;">
                <tr>
                  <td align="center">
                    <a href="${recipientCtaUrl}" target="_blank" style="display: inline-block; background-color: ${templateType === 'payment_reminder' ? '#ea580c' : '#0099e6'}; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px ${templateType === 'payment_reminder' ? 'rgba(234, 88, 12, 0.35)' : 'rgba(0, 153, 230, 0.35)'}; letter-spacing: 0.3px;">
                      ${personalCtaText}
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Direct Link Fallback -->
              <div style="font-size: 11px; color: #64748b; line-height: 1.5; text-align: center; margin: 12px 0 24px 0; word-break: break-all;">
                Direct link: <a href="${recipientCtaUrl}" target="_blank" style="color: #0099e6; text-decoration: underline; font-weight: 500;">${recipientCtaUrl}</a>
              </div>

              <!-- Sign-off Block Placed After CTA -->
              <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 14px; color: #475569; line-height: 1.6;">
                Best regards,<br/>
                <strong style="color: #0f172a; font-weight: 700;">Hacker&apos;s Unity Organizing Team</strong>
              </div>

              <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 20px 0 0 0; text-align: center;">
                Need assistance? Reply directly to this email or reach us at <a href="mailto:info@hackersunity.com" style="color: #0099e6; text-decoration: none; font-weight: 600;">info@hackersunity.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center;">
              <p style="font-size: 12px; font-weight: 700; color: #475569; margin: 0 0 6px 0;">
                Hacker&apos;s Unity Platform
              </p>
              <p style="font-size: 11px; color: #94a3b8; margin: 0; line-height: 1.5;">
                This email was sent on behalf of the organizing team of <strong>${eventTitle}</strong>.<br/>
                &copy; ${new Date().getFullYear()} Hacker&apos;s Unity. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;
      return htmlOutput.replace(/₹\s*₹+/g, '₹');
    };

    // Personalized Subject line helper
    const getSubjectFor = (r: RecipientInput) => {
      const recipientName = r.name || 'Hacker';
      const teamName = r.teamName || recipientName;
      const recEventTitle = r.eventTitle || eventTitle;
      const cleanedAmount = typeof r.amount === 'string'
        ? Number(r.amount.replace(/[^0-9.-]+/g, ''))
        : Number(r.amount);
      const validAmount = !isNaN(cleanedAmount) && cleanedAmount > 0 ? cleanedAmount : 800;
      const formattedAmount = `₹${validAmount.toLocaleString('en-IN')}`;
      return subject
        .replace(/\{name\}/gi, recipientName)
        .replace(/\{user\}/gi, recipientName)
        .replace(/\{team_name\}/gi, teamName)
        .replace(/\{team\}/gi, teamName)
        .replace(/\{event_title\}/gi, recEventTitle)
        .replace(/₹\s*\{amount\}/gi, formattedAmount)
        .replace(/\{amount\}/gi, formattedAmount)
        .replace(/₹\s*₹+/g, '₹');
    };

    // 1. Send via Resend if RESEND_API_KEY is configured
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        let sentSuccessCount = 0;
        const failedEmails: { email: string; reason: string }[] = [];

        // If single recipient or test email
        if (targetRecipients.length === 1) {
          const rec = targetRecipients[0];
          const personalSubject = getSubjectFor(rec);
          const personalHtml = generateHtml(rec);

          let { data, error: sendError } = await resend.emails.send({
            from: fromEmail,
            to: rec.email,
            subject: personalSubject,
            html: personalHtml,
          });

          // If domain unverified, attempt fallback to onboarding@resend.dev
          if (sendError && (sendError.message?.toLowerCase().includes('domain') || sendError.message?.toLowerCase().includes('verify'))) {
            const fallbackSend = await resend.emails.send({
              from: 'Hacker\'s Unity <onboarding@resend.dev>',
              to: rec.email,
              subject: personalSubject,
              html: personalHtml,
            });
            if (!fallbackSend.error) {
              sendError = null;
              data = fallbackSend.data;
            }
          }

          if (sendError) {
            console.warn('[event-broadcast-email] Resend error:', sendError.message);
            // Sandbox fallback check
            return NextResponse.json({
              success: true,
              isTest,
              sentCount: 1,
              method: 'resend_sandbox_restricted',
              warning: `Resend is in sandbox mode: emails can only be sent to verified addresses. To send from info@hackersunity.com to all participants, verify hackersunity.com on your Resend dashboard. (Error: ${sendError.message})`,
              data,
            });
          }

          return NextResponse.json({
            success: true,
            isTest,
            sentCount: 1,
            method: 'resend',
            sentTo: [rec.email],
            data,
          });
        }

        // Multiple recipients: batch dispatch
        for (const rec of targetRecipients) {
          try {
            const personalSubject = getSubjectFor(rec);
            const personalHtml = generateHtml(rec);

            let { error: sendError } = await resend.emails.send({
              from: fromEmail,
              to: rec.email,
              subject: personalSubject,
              html: personalHtml,
            });

            if (sendError && (sendError.message?.toLowerCase().includes('domain') || sendError.message?.toLowerCase().includes('verify'))) {
              const fallbackSend = await resend.emails.send({
                from: 'Hacker\'s Unity <onboarding@resend.dev>',
                to: rec.email,
                subject: personalSubject,
                html: personalHtml,
              });
              if (!fallbackSend.error) {
                sendError = null;
              }
            }

            if (sendError) {
              failedEmails.push({ email: rec.email, reason: sendError.message });
            } else {
              sentSuccessCount++;
            }
          } catch (itemErr: any) {
            failedEmails.push({ email: rec.email, reason: itemErr.message });
          }
        }

        return NextResponse.json({
          success: true,
          isTest: false,
          sentCount: sentSuccessCount,
          total: targetRecipients.length,
          failedCount: failedEmails.length,
          failedEmails: failedEmails.slice(0, 5),
          method: 'resend_batch',
        });
      } catch (resendErr: any) {
        console.warn('[event-broadcast-email] Resend send exception:', resendErr?.message);
      }
    }

    // 2. Fallback to SMTP if configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASS;

    if (smtpHost || (process.env.GMAIL_USER && process.env.GMAIL_APP_PASS)) {
      try {
        const transportConfig: any = smtpHost
          ? {
              host: smtpHost,
              port: Number(process.env.SMTP_PORT) || 587,
              secure: process.env.SMTP_SECURE === 'true',
              auth: { user: smtpUser, pass: smtpPass },
            }
          : {
              service: 'gmail',
              auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASS,
              },
            };

        const transporter = nodemailer.createTransport(transportConfig);

        let sentCount = 0;
        for (const rec of targetRecipients) {
          await transporter.sendMail({
            from: process.env.SMTP_FROM || fromEmail,
            to: rec.email,
            subject: getSubjectFor(rec),
            html: generateHtml(rec),
          });
          sentCount++;
        }

        return NextResponse.json({
          success: true,
          isTest,
          sentCount,
          method: 'smtp',
        });
      } catch (smtpErr: any) {
        console.warn('[event-broadcast-email] SMTP failed:', smtpErr);
      }
    }

    // 3. Fallback simulation if no email credentials configured
    console.log(`[EMAIL BROADCAST SIMULATION] Target: ${targetRecipients.length} recipients | Subject: ${subject}`);
    return NextResponse.json({
      success: true,
      isTest,
      sentCount: targetRecipients.length,
      method: 'simulated',
      message: `Simulated dispatch to ${targetRecipients.length} recipients. Add RESEND_API_KEY with verified domain hackersunity.com to deliver live to inboxes.`,
    });
  } catch (err: any) {
    console.error('[event-broadcast-email] Handler exception:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to dispatch broadcast email.' },
      { status: 500 }
    );
  }
}
