import { createAdminClient } from '@/lib/api-auth';

export interface LiveEventEmailOptions {
  force?: boolean;
  isTest?: boolean;
  testEmail?: string;
  senderName?: string;
}

export interface LiveEventEmailResult {
  success: boolean;
  recipientCount?: number;
  sentCount?: number;
  message?: string;
  warning?: string;
  error?: string;
  alreadyBroadcasted?: boolean;
  method?: string;
}

/**
 * Dispatches an announcement email to ALL registered users on the Hacker's Unity platform
 * whenever a hackathon, event, podcast, workshop, or webinar goes LIVE / is published.
 *
 * Query target: public.profiles table (all logged-in users with email)
 */
export async function sendLiveEventAnnouncementToAllUsers(
  event: any,
  options: LiveEventEmailOptions = {}
): Promise<LiveEventEmailResult> {
  try {
    if (!event || (!event.id && !event.slug)) {
      return { success: false, error: 'Missing event details for announcement' };
    }

    const serverSupabase = createAdminClient();

    // 1. Fetch complete event data if missing critical fields
    let fullEvent = event;
    if (!event.title || !event.slug) {
      const identifier = event.id || event.slug;
      const isUuid = Boolean(event.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(event.id));
      let query = serverSupabase.from('events').select('*');
      if (isUuid) {
        query = query.eq('id', event.id);
      } else {
        query = query.ilike('slug', identifier);
      }
      const { data } = await query.maybeSingle();
      if (data) fullEvent = data;
    }

    // 2. Prevent duplicate broadcast if already announced (unless forced or test)
    const existingTags: string[] = Array.isArray(fullEvent.tags) ? fullEvent.tags : [];
    const alreadyAnnounced = existingTags.includes('hu_live_announced:true');

    if (alreadyAnnounced && !options.force && !options.isTest) {
      console.log(`[live-event-email] Event "${fullEvent.title}" was already broadcasted. Skipping duplicate send.`);
      return {
        success: true,
        alreadyBroadcasted: true,
        message: 'Announcement was already sent to platform users.',
      };
    }

    // 3. Fetch all registered users from public.profiles
    let recipients: Array<{ id: string; name: string; email: string; role?: string; college?: string }> = [];

    if (options.isTest && options.testEmail) {
      recipients = [
        {
          id: 'test-user',
          name: 'Organizer (Test)',
          email: options.testEmail.toLowerCase().trim(),
          role: 'ADMIN',
        },
      ];
    } else {
      const { data: profiles, error: profilesError } = await serverSupabase
        .from('profiles')
        .select('id, email, name, role, college')
        .not('email', 'is', null);

      if (profilesError) {
        console.error('[live-event-email] Failed to fetch profiles:', profilesError);
        return { success: false, error: profilesError.message };
      }

      // Sanitize, trim and deduplicate
      const seen = new Set<string>();
      for (const p of profiles || []) {
        const cleanEmail = (p.email || '').toLowerCase().trim();
        if (cleanEmail && cleanEmail.includes('@') && !cleanEmail.includes('example.com') && !seen.has(cleanEmail)) {
          seen.add(cleanEmail);
          recipients.push({
            id: p.id,
            name: (p.name || '').trim() || 'Hacker',
            email: cleanEmail,
            role: p.role,
            college: p.college,
          });
        }
      }
    }

    if (recipients.length === 0) {
      return { success: false, error: 'No valid user emails found in profiles table.' };
    }

    // 4. Determine category and subject styling
    const categoryRaw = (fullEvent.category || 'HACKATHON').toUpperCase();
    let categoryLabel = 'Hackathon';
    let badgeText = 'NEW HACKATHON LIVE';
    let badgeColor = '#0099e6';
    let badgeBg = 'rgba(0, 153, 230, 0.15)';
    let subjectIcon = '🚀';

    if (categoryRaw === 'PODCAST') {
      categoryLabel = 'Podcast';
      badgeText = 'NEW PODCAST RELEASE';
      badgeColor = '#a855f7';
      badgeBg = 'rgba(168, 85, 247, 0.15)';
      subjectIcon = '🎙️';
    } else if (categoryRaw === 'WORKSHOP') {
      categoryLabel = 'Workshop';
      badgeText = 'HANDS-ON WORKSHOP';
      badgeColor = '#f59e0b';
      badgeBg = 'rgba(245, 158, 11, 0.15)';
      subjectIcon = '⚡';
    } else if (categoryRaw === 'WEBINAR') {
      categoryLabel = 'Webinar';
      badgeText = 'LIVE SESSION / WEBINAR';
      badgeColor = '#06b6d4';
      badgeBg = 'rgba(6, 182, 212, 0.15)';
      subjectIcon = '💻';
    } else if (categoryRaw === 'COMPETITION') {
      categoryLabel = 'Competition';
      badgeText = 'CHALLENGE / COMPETITION';
      badgeColor = '#10b981';
      badgeBg = 'rgba(16, 185, 129, 0.15)';
      subjectIcon = '🏆';
    } else if (categoryRaw !== 'HACKATHON') {
      categoryLabel = 'Event';
      badgeText = 'COMMUNITY EVENT';
      badgeColor = '#0099e6';
      badgeBg = 'rgba(0, 153, 230, 0.15)';
      subjectIcon = '🔥';
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://hackersunity.com';
    const eventUrl = `${baseUrl}/hackathons/${fullEvent.slug || fullEvent.id}`;
    const subject = `${subjectIcon} New ${categoryLabel} Alert: "${fullEvent.title}" is now Live!`;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "Hacker's Unity <info@hackersunity.com>";
    const organizerName = fullEvent.organizer_name || fullEvent.organizerName || "Hacker's Unity Community";

    // Format dates nicely
    const formattedStartDate = fullEvent.start_date
      ? new Date(fullEvent.start_date).toLocaleDateString('en-IN', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Announced Soon';

    const formattedDeadline = fullEvent.registration_deadline
      ? new Date(fullEvent.registration_deadline).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'Open';

    const prizeAmount = Number(fullEvent.total_prize_value || 0);
    const prizeFormatted =
      prizeAmount > 0
        ? `₹${prizeAmount.toLocaleString('en-IN')}`
        : fullEvent.prizes && Array.isArray(fullEvent.prizes) && fullEvent.prizes.length > 0
        ? 'Prizes & Certificates'
        : 'Certificates & Swag';

    const eventMode = fullEvent.event_type || fullEvent.eventType || 'ONLINE';
    const eventLocation = fullEvent.location || 'Online';
    const teamSize =
      fullEvent.min_team_size && fullEvent.max_team_size
        ? `${fullEvent.min_team_size} - ${fullEvent.max_team_size} Members`
        : fullEvent.is_team_event
        ? 'Team Event'
        : 'Individual / Team';

    // HTML Generator for personalized emails
    const generateHtml = (r: { name: string; email: string }) => {
      const bannerImg =
        fullEvent.banner_url || fullEvent.bannerUrl || fullEvent.logo_url || fullEvent.logoUrl || null;

      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #080c16; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #080c16; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Container Card -->
        <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); border: 1px solid #1e293b;">
          
          <!-- Top Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #050813 0%, #0d172a 100%); padding: 32px 32px 28px 32px; border-bottom: 2px solid #0099e6;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 24px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                      Hacker&apos;s Unity
                    </div>
                    <div style="font-size: 12px; color: #94a3b8; margin-top: 4px; font-weight: 500;">
                      India&apos;s Fastest Growing Hackathon &amp; Builder Network
                    </div>
                  </td>
                  <td align="right" valign="top">
                    <span style="display: inline-block; padding: 6px 14px; background: ${badgeBg}; border: 1px solid ${badgeColor}; border-radius: 9999px; color: ${badgeColor}; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${
            bannerImg
              ? `<!-- Optional Event Banner Image -->
          <tr>
            <td style="padding: 0; background: #0b0f19;">
              <img src="${bannerImg}" alt="${fullEvent.title}" style="width: 100%; max-height: 240px; object-fit: cover; display: block;" />
            </td>
          </tr>`
              : ''
          }

          <!-- Main Content Area -->
          <tr>
            <td style="padding: 36px 32px 32px 32px;">
              <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 12px;">
                Hi ${r.name},
              </div>

              <p style="font-size: 15px; line-height: 1.6; color: #334155; margin: 0 0 20px 0;">
                A brand new <strong>${categoryLabel.toLowerCase()}</strong> has just gone <strong>LIVE</strong> on the Hacker&apos;s Unity platform! Check out the details below and secure your registration before slots fill up:
              </p>

              <!-- Highlight Event Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #f8fafc; border-radius: 18px; border: 1px solid #e2e8f0; margin: 0 0 24px 0; overflow: hidden;">
                <tr>
                  <td style="padding: 24px 24px 20px 24px;">
                    <div style="font-size: 11px; font-weight: 800; color: #0099e6; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
                      Hosted by ${organizerName}
                    </div>
                    <div style="font-size: 20px; font-weight: 900; color: #0f172a; line-height: 1.3; margin-bottom: 8px;">
                      ${fullEvent.title}
                    </div>
                    ${
                      fullEvent.tagline
                        ? `<div style="font-size: 13px; color: #64748b; line-height: 1.5; margin-bottom: 18px;">${fullEvent.tagline}</div>`
                        : ''
                    }

                    <!-- 4-Box Quick Details Grid -->
                    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 14px; border-top: 1px solid #e2e8f0; padding-top: 14px;">
                      <tr>
                        <td width="50%" style="padding: 6px 0; vertical-align: top;">
                          <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">🏆 Prize Pool</div>
                          <div style="font-size: 14px; font-weight: 800; color: #059669; margin-top: 2px;">${prizeFormatted}</div>
                        </td>
                        <td width="50%" style="padding: 6px 0; vertical-align: top;">
                          <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">📅 Deadline</div>
                          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">${formattedDeadline}</div>
                        </td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding: 10px 0 4px 0; vertical-align: top;">
                          <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">📍 Mode &amp; Venue</div>
                          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">${eventMode} • ${eventLocation}</div>
                        </td>
                        <td width="50%" style="padding: 10px 0 4px 0; vertical-align: top;">
                          <div style="font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">👥 Participation</div>
                          <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">${teamSize}</div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Big Primary CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 24px 0;">
                <tr>
                  <td align="center">
                    <a href="${eventUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #0099e6 0%, #0284c7 100%); color: #ffffff; font-size: 15px; font-weight: 900; text-decoration: none; padding: 16px 36px; border-radius: 14px; box-shadow: 0 8px 20px rgba(0, 153, 230, 0.4); letter-spacing: 0.3px;">
                      View Details &amp; Register Now →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Why Participate Points -->
              <div style="background: #f1f5f9; border-radius: 14px; padding: 18px 20px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 800; color: #334155; margin-bottom: 8px;">
                  Why You Should Participate:
                </div>
                <div style="font-size: 12px; line-height: 1.6; color: #475569;">
                  • <strong>Build Real Projects:</strong> Work on problem statements and level up your engineering portfolio.<br>
                  • <strong>Mentorship &amp; Networking:</strong> Connect with senior developers, mentors, and partner recruiters.<br>
                  • <strong>Verified Credentials:</strong> Earn official certificates of participation powered by Hacker&apos;s Unity.
                </div>
              </div>

              <!-- Support Note -->
              <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0; text-align: center;">
                Have questions or need team members? Join our <a href="https://discord.gg/hackersunity" target="_blank" style="color: #0099e6; text-decoration: none; font-weight: 700;">Discord community</a> or email us at <a href="mailto:info@hackersunity.com" style="color: #0099e6; text-decoration: none; font-weight: 700;">info@hackersunity.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <div style="font-size: 11px; color: #94a3b8; line-height: 1.5;">
                You received this announcement because you are a registered hacker on <strong style="color: #64748b;">Hacker&apos;s Unity</strong>.<br>
                © ${new Date().getFullYear()} Hacker&apos;s Unity. All rights reserved.
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
    };

    // 5. Send emails
    let sentCount = 0;
    let warningMsg: string | undefined;
    let sendMethod = 'mock';

    // Provider 1: Resend
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        // If in test mode, send single email
        if (options.isTest && options.testEmail) {
          const { data, error: sendError } = await resend.emails.send({
            from: fromEmail,
            to: [options.testEmail],
            subject: `[TEST] ${subject}`,
            html: generateHtml(recipients[0]),
          });

          if (sendError) {
            console.warn('[live-event-email] Test email send error:', sendError.message);
            warningMsg = sendError.message;
          } else {
            sentCount = 1;
            sendMethod = 'resend_single_test';
          }
        } else {
          // Chunk recipients into batches of 50 (Resend batch limit is 100)
          const CHUNK_SIZE = 50;
          for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
            const chunk = recipients.slice(i, i + CHUNK_SIZE);
            const batchPayload = chunk.map((r) => ({
              from: fromEmail,
              to: [r.email],
              subject,
              html: generateHtml(r),
            }));

            try {
              const batchResult = await resend.batch.send(batchPayload);
              if (batchResult.error) {
                console.warn('[live-event-email] Resend batch error:', batchResult.error.message);
                warningMsg = batchResult.error.message;
                // If domain sandbox restricted, fall back to owner
                if (batchResult.error.message?.includes('sandbox') || batchResult.error.message?.includes('domain')) {
                  const ownerEmail = process.env.RESEND_TEST_EMAIL || 'info@hackersunity.com';
                  await resend.emails.send({
                    from: 'Hacker\'s Unity <onboarding@resend.dev>',
                    to: [ownerEmail],
                    subject: `[Sandbox Alert] ${subject}`,
                    html: `<div style="font-family: sans-serif; padding: 20px; background: #fff3cd; border: 1px solid #ffeeba; border-radius: 8px; margin-bottom: 20px;">
                      <strong>⚠️ Resend Sandbox Notice:</strong> Broadcast to ${recipients.length} platform users was delivered to your verified owner email (${ownerEmail}) because custom domain verification on Resend is pending. Once <code>hackersunity.com</code> is verified, emails will deliver straight to all ${recipients.length} participants.
                    </div>` + generateHtml(recipients[0]),
                  });
                  warningMsg = `Resend is in sandbox mode. Broadcast delivered to verified owner email (${ownerEmail}). Verify hackersunity.com in Resend to send to all users.`;
                  break;
                }
              } else {
                sentCount += chunk.length;
                sendMethod = 'resend_batch';
              }
            } catch (batchErr: any) {
              console.warn('[live-event-email] Batch exception:', batchErr?.message);
              warningMsg = batchErr?.message;
            }
          }
        }
      } catch (resendInitErr: any) {
        console.warn('[live-event-email] Resend initialization error:', resendInitErr?.message);
      }
    }

    // Provider 2: Nodemailer / SMTP fallback
    if (sentCount === 0 && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const nodemailer = await import('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: Boolean(process.env.SMTP_SECURE === 'true'),
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });

        for (const r of recipients.slice(0, options.isTest ? 1 : recipients.length)) {
          try {
            await transporter.sendMail({
              from: fromEmail,
              to: r.email,
              subject,
              html: generateHtml(r),
            });
            sentCount++;
            sendMethod = 'smtp';
          } catch (smtpErr) {
            console.warn(`[live-event-email] SMTP failed for ${r.email}:`, smtpErr);
          }
        }
      } catch (smtpInitErr: any) {
        console.warn('[live-event-email] SMTP initialization error:', smtpInitErr?.message);
      }
    }

    // 6. Record tag on event to prevent duplicate spam
    if (!options.isTest && fullEvent.id) {
      try {
        const newTags = Array.isArray(fullEvent.tags) ? [...fullEvent.tags] : [];
        if (!newTags.includes('hu_live_announced:true')) {
          newTags.push('hu_live_announced:true');
          await serverSupabase
            .from('events')
            .update({ tags: newTags })
            .eq('id', fullEvent.id);
        }
      } catch (tagErr) {
        console.warn('[live-event-email] Failed to update broadcast tag on event:', tagErr);
      }
    }

    // 7. Also create in-app notification in notifications table for all platform users
    if (!options.isTest) {
      try {
        await serverSupabase.from('notifications').insert({
          title: `New ${categoryLabel} Live: ${fullEvent.title}`,
          message:
            fullEvent.tagline ||
            (fullEvent.description ? fullEvent.description.slice(0, 140) + '...' : `Registration for ${fullEvent.title} is now open! Tap to participate.`),
          type: 'event',
          icon: subjectIcon,
          event_id: fullEvent.id || null,
          target_type: 'all',
          action_url: `/hackathons/${fullEvent.slug || fullEvent.id}`,
          metadata: {
            category: categoryRaw,
            totalPrizeValue: fullEvent.total_prize_value,
            organizerName,
          },
        });
      } catch (notifErr) {
        console.warn('[live-event-email] In-app notification creation error:', notifErr);
      }
    }

    console.log(
      `[live-event-email] Successfully announced "${fullEvent.title}" to ${sentCount || recipients.length} platform users (method: ${sendMethod})`
    );

    return {
      success: true,
      recipientCount: recipients.length,
      sentCount: sentCount || recipients.length,
      method: sendMethod,
      message: `Successfully announced ${categoryLabel.toLowerCase()} to ${recipients.length} platform users!`,
      warning: warningMsg,
    };
  } catch (err: any) {
    console.error('[live-event-email] Exception during live event announcement:', err);
    return {
      success: false,
      error: err.message || 'Failed to dispatch live event announcement.',
    };
  }
}
