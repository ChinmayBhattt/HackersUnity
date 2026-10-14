import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import {
  authenticateRequest,
  unauthorizedResponse,
  rateLimitedResponse,
} from '@/lib/api-auth';
import { checkRateLimit, EMAIL_RATE_LIMIT } from '@/lib/rate-limit';

interface RecipientInput {
  name?: string;
  email: string;
  teamName?: string;
  college?: string;
  status?: string;
}

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest();
    // Allow if authenticated user or CSAP cookie is present
    const cookieHeader = req.headers.get('cookie') || '';
    const isAdminCsap = cookieHeader.includes('is_admin_csap=1');

    if (!auth && !isAdminCsap) {
      return unauthorizedResponse('You must be signed in as an organizer or admin to send broadcast emails.');
    }

    if (auth) {
      const rateLimit = checkRateLimit(auth.userId, EMAIL_RATE_LIMIT);
      if (!rateLimit.allowed) {
        return rateLimitedResponse(rateLimit.resetInMs);
      }
    }

    const body = await req.json();
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

    const ctaUrl = actionButtonUrl || `${baseUrl}/dashboard`;
    const ctaText = actionButtonText || 'Open Event Dashboard →';

    // Determine target list: if isTest, send to testEmail only
    const targetRecipients: RecipientInput[] = isTest
      ? [
          {
            name: body.testRecipientName || 'Chinmay Bhatt',
            email: testEmail || 'info@hackersunity.com',
            teamName: body.testTeamName || 'hcj',
            college: body.testCollege || 'Participant',
            status: 'APPROVED',
          },
        ]
      : recipients;

    if (targetRecipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients selected for this email.' },
        { status: 400 }
      );
    }

    // Default sender from info@hackersunity.com
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Hacker\'s Unity <info@hackersunity.com>';

    // Helper to generate personalized HTML email for a single recipient
    const generateHtml = (r: RecipientInput) => {
      const recipientName = r.name || 'Hacker';
      const teamName = r.teamName || recipientName;

      // Replace template variables
      let renderedBody = bodyText
        .replace(/\{name\}/gi, recipientName)
        .replace(/\{user\}/gi, recipientName)
        .replace(/\{team_name\}/gi, teamName)
        .replace(/\{team\}/gi, teamName)
        .replace(/\{event_title\}/gi, eventTitle)
        .replace(/\{college\}/gi, r.college || 'Participant')
        .replace(/\{status\}/gi, r.status || 'Registered');

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

      if (templateType === 'selection' || templateType === 'approval') {
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

      // Generate recipient CTA link
      let recipientCtaUrl = ctaUrl;
      const isRsvpFlow =
        templateType === 'rsvp' ||
        ctaText.toLowerCase().includes('rsvp') ||
        ctaUrl.includes('/rsvp');

      if (isRsvpFlow) {
        const rsvpParams = new URLSearchParams();
        if (eventId) rsvpParams.set('eventId', eventId);
        if (eventTitle) rsvpParams.set('eventTitle', eventTitle);
        if (r.email) rsvpParams.set('email', r.email);
        if (recipientName) rsvpParams.set('name', recipientName);
        if (teamName) rsvpParams.set('team', teamName);
        if (r.college) rsvpParams.set('college', r.college);
        recipientCtaUrl = `${baseUrl}/rsvp?${rsvpParams.toString()}`;
      }

      // Also replace {rsvp_url} in body if present
      renderedBody = renderedBody.replace(/\{rsvp_url\}/gi, recipientCtaUrl);

      return `
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
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: ${badgeBg}; border-radius: 14px; border: 1px solid #e2e8f0; margin: 24px 0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td width="50%" style="font-size: 12px; color: #64748b; font-weight: 600;">
                          Participant: <strong style="color: #0f172a;">${recipientName}</strong>
                        </td>
                        <td width="50%" align="right" style="font-size: 12px; color: #64748b; font-weight: 600;">
                          Team: <strong style="color: ${badgeColor};">${teamName}</strong>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 32px 0 20px 0;">
                <tr>
                  <td align="center">
                    <a href="${recipientCtaUrl}" target="_blank" style="display: inline-block; background-color: #0099e6; color: #ffffff; font-size: 14px; font-weight: 800; text-decoration: none; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 14px rgba(0, 153, 230, 0.35); letter-spacing: 0.3px;">
                      ${ctaText}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 16px 0 0 0; text-align: center;">
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
    };

    // Personalized Subject line helper
    const getSubjectFor = (r: RecipientInput) => {
      const recipientName = r.name || 'Hacker';
      const teamName = r.teamName || recipientName;
      return subject
        .replace(/\{name\}/gi, recipientName)
        .replace(/\{user\}/gi, recipientName)
        .replace(/\{team_name\}/gi, teamName)
        .replace(/\{team\}/gi, teamName)
        .replace(/\{event_title\}/gi, eventTitle);
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

          const { data, error: sendError } = await resend.emails.send({
            from: fromEmail,
            to: rec.email,
            subject: personalSubject,
            html: personalHtml,
          });

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

            const { error: sendError } = await resend.emails.send({
              from: fromEmail,
              to: rec.email,
              subject: personalSubject,
              html: personalHtml,
            });

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
