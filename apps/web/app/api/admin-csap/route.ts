import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient, authenticateRequest } from '@/lib/api-auth';

export type CsapRole = 'owner' | 'admin' | 'manager' | 'viewer';

export interface CsapAuthResult {
  authenticated: boolean;
  authorized: boolean;
  email: string | null;
  role: CsapRole | null;
  name: string | null;
  avatar_url?: string | null;
  error?: string;
}

export const ROOT_OWNER_EMAIL = (
  process.env.ADMIN_EMAIL ||
  process.env.NEXT_PUBLIC_ADMIN_EMAIL ||
  process.env.CSAP_ROOT_ADMIN_EMAIL ||
  ''
).trim().toLowerCase();
const ADMIN_USER = process.env.ADMIN_CSAP_USER || 'HU';
const ADMIN_PASS = process.env.ADMIN_CSAP_PASS || 'HU269';
const SESSION_COOKIE_NAME = 'admin_csap_session';
const SECRET_SALT = process.env.SUPABASE_SECRET_KEY || 'hackers-unity-admin-csap-secret-salt-2026';

/**
 * Creates a signed token for admin session (legacy fallback support)
 */
function createSessionToken(username: string): string {
  const timestamp = Date.now().toString();
  const signature = crypto
    .createHmac('sha256', SECRET_SALT)
    .update(`${username}:${timestamp}`)
    .digest('hex');
  return Buffer.from(JSON.stringify({ u: username, t: timestamp, s: signature })).toString('base64');
}

/**
 * Validates the admin session token (legacy fallback support)
 */
function verifySessionToken(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const raw = Buffer.from(token, 'base64').toString('utf8');
    const { u, t, s } = JSON.parse(raw);
    if (!u || !t || !s) return false;

    const ageMs = Date.now() - Number(t);
    if (ageMs > 7 * 24 * 60 * 60 * 1000) return false;

    const expectedSig = crypto
      .createHmac('sha256', SECRET_SALT)
      .update(`${u}:${t}`)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expectedSig));
  } catch {
    return false;
  }
}

/**
 * Verifies admin credentials securely (legacy fallback support)
 */
function checkCredentials(user: string, pass: string): boolean {
  if (typeof user !== 'string' || typeof pass !== 'string') return false;
  const userMatch =
    user.length === ADMIN_USER.length &&
    crypto.timingSafeEqual(Buffer.from(user), Buffer.from(ADMIN_USER));
  const passMatch =
    pass.length === ADMIN_PASS.length &&
    crypto.timingSafeEqual(Buffer.from(pass), Buffer.from(ADMIN_PASS));
  return Boolean(userMatch && passMatch);
}

/**
 * Core Database & Session Authorization Checker for CSAP
 * 1. Checks Supabase User (via Cookie or Bearer Token)
 * 2. Roots ADMIN_EMAIL from env automatically with 'owner' role
 * 3. Checks csap_team table in Supabase for user's assigned role
 */
async function verifyCsapAuthorization(req: NextRequest): Promise<CsapAuthResult> {
  let email: string | null = null;
  let authUser: any = null;

  try {
    authUser = await authenticateRequest(req);
    if (authUser?.email) {
      email = authUser.email.trim().toLowerCase();
    }
  } catch (err) {
    console.warn('[CSAP Auth] authenticateRequest exception:', err);
  }

  // Fallback: Check Authorization Bearer header
  if (!email) {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      try {
        const adminClient = createAdminClient();
        const { data: tokenUser } = await adminClient.auth.getUser(token);
        if (tokenUser?.user?.email) {
          email = tokenUser.user.email.trim().toLowerCase();
        }
      } catch (tokenErr) {
        console.warn('[CSAP Auth] Bearer token error:', tokenErr);
      }
    }
  }

  // Fallback: Check legacy session cookie if still present
  if (!email) {
    const legacyToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (verifySessionToken(legacyToken)) {
      email = ROOT_OWNER_EMAIL;
    }
  }

  if (!email) {
    return {
      authenticated: false,
      authorized: false,
      email: null,
      role: null,
      name: null,
      error: 'Authentication required. Please sign in to Hacker\'s Unity with an authorized account.',
    };
  }

  const supabase = createAdminClient();

  // Root Owner from environment is ALWAYS authorized as owner
  if (ROOT_OWNER_EMAIL && email === ROOT_OWNER_EMAIL) {
    return {
      authenticated: true,
      authorized: true,
      email,
      role: 'owner',
      name: 'Chinmay Bhatt',
      avatar_url: 'https://lh3.googleusercontent.com/a/ACg8ocJbKHCPfHalXF3JMBVDHrZJG6DBRv9QelXXavRM5hzt4ulAy4kB=s96-c',
    };
  }

  // Check database table csap_team
  try {
    const { data: member, error } = await supabase
      .from('csap_team')
      .select('*')
      .ilike('email', email)
      .eq('status', 'active')
      .maybeSingle();

    if (error) {
      console.warn('[CSAP Auth] csap_team lookup warning:', error.message);
      return {
        authenticated: true,
        authorized: false,
        email,
        role: null,
        name: null,
        error: 'Access restricted: Database table csap_team needs setup or member record not found.',
      };
    }

    if (!member) {
      return {
        authenticated: true,
        authorized: false,
        email,
        role: null,
        name: null,
        error: `Access denied: ${email} is not listed in the authorized CSAP Administrator Team.`,
      };
    }

    return {
      authenticated: true,
      authorized: true,
      email,
      role: (member.role as CsapRole) || 'viewer',
      name: member.name || email.split('@')[0],
      avatar_url: member.avatar_url || null,
    };
  } catch (err: any) {
    return {
      authenticated: true,
      authorized: false,
      email,
      role: null,
      name: null,
      error: err.message || 'Error verifying CSAP authorization',
    };
  }
}

// ─── GET: Fetch all hackathon, blog, mentor submissions or team members ──────
export async function GET(req: NextRequest) {
  const auth = await verifyCsapAuthorization(req);
  if (!auth.authenticated) {
    return NextResponse.json({ authenticated: false, error: auth.error || 'Unauthorized' }, { status: 401 });
  }
  if (!auth.authorized) {
    return NextResponse.json(
      { authenticated: true, authorized: false, error: auth.error, email: auth.email },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(req.url);
  const resource = searchParams.get('resource');

  try {
    const supabase = createAdminClient();

    // ── Team & Access Governance Query ──
    if (resource === 'team') {
      try {
        const { data: members, error } = await supabase
          .from('csap_team')
          .select('*')
          .order('created_at', { ascending: true });

        const isMissing =
          error &&
          (error.code === '42P01' ||
            error.message?.toLowerCase().includes('relation "csap_team" does not exist') ||
            error.message?.toLowerCase().includes('does not exist'));

        let allMembers = members || [];

        // Always guarantee Root Owner is represented in the list
        const hasRootOwner = allMembers.some(
          (m) => m.email?.trim().toLowerCase() === ROOT_OWNER_EMAIL
        );
        if (!hasRootOwner) {
          allMembers = [
            {
              id: 'root-owner-chinmay',
              email: ROOT_OWNER_EMAIL,
              role: 'owner',
              name: 'Chinmay Bhatt',
              username: 'chinmaybhatt',
              avatar_url:
                'https://lh3.googleusercontent.com/a/ACg8ocJbKHCPfHalXF3JMBVDHrZJG6DBRv9QelXXavRM5hzt4ulAy4kB=s96-c',
              status: 'active',
              added_by: 'system_root',
              created_at: new Date().toISOString(),
            },
            ...allMembers,
          ];
        }

        // Match with profiles table to enrich names, usernames, and avatars
        const emails = Array.from(
          new Set(
            allMembers
              .map((m) => m.email?.trim().toLowerCase())
              .filter(Boolean)
          )
        );

        let profilesMap: Record<string, any> = {};
        if (emails.length > 0) {
          try {
            const { data: profilesList } = await supabase
              .from('profiles')
              .select('id, username, name, email, avatar_url')
              .in('email', emails);

            if (profilesList) {
              for (const p of profilesList) {
                if (p.email) {
                  profilesMap[p.email.trim().toLowerCase()] = p;
                }
              }
            }
          } catch (profErr) {
            console.warn('[Admin CSAP Team] Profiles join warning:', profErr);
          }
        }

        const enrichedMembers = allMembers.map((m) => {
          const emailKey = m.email?.trim().toLowerCase() || '';
          const prof = profilesMap[emailKey];
          return {
            ...m,
            name: prof?.name || m.name || emailKey.split('@')[0],
            username: prof?.username || m.username || null,
            avatar_url: prof?.avatar_url || m.avatar_url || null,
          };
        });

        return NextResponse.json({
          authenticated: true,
          authorized: true,
          team: enrichedMembers,
          currentUser: {
            email: auth.email,
            role: auth.role,
            name: auth.name,
          },
          tableReady: !isMissing,
          error: error ? error.message : null,
          message: isMissing
            ? 'csap_team table not found. Run apps/web/supabase/csap-team-migration.sql in Supabase SQL editor.'
            : undefined,
        });
      } catch (teamErr: any) {
        return NextResponse.json({
          authenticated: true,
          authorized: true,
          team: [
            {
              id: 'root-owner-chinmay',
              email: ROOT_OWNER_EMAIL,
              role: 'owner',
              name: 'Chinmay Bhatt',
              status: 'active',
              added_by: 'system_root',
              created_at: new Date().toISOString(),
            },
          ],
          currentUser: {
            email: auth.email,
            role: auth.role,
            name: auth.name,
          },
          tableReady: false,
          error: teamErr.message,
        });
      }
    }

    // ── Blogs Moderation Query ──
    if (resource === 'blogs') {
      try {
        const { data: blogs, error } = await supabase
          .from('blogs')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          const isTableMissing =
            error.code === '42P01' ||
            error.message?.toLowerCase().includes('relation "blogs" does not exist') ||
            error.message?.toLowerCase().includes('does not exist');

          return NextResponse.json({
            authenticated: true,
            blogs: [],
            stats: { total: 0, pending: 0, approved: 0, rejected: 0 },
            tableReady: !isTableMissing,
            error: error.message,
            message: isTableMissing
              ? 'Blogs table not found. Run apps/web/supabase/blogs-migration.sql in Supabase SQL editor.'
              : error.message,
          });
        }

        const allBlogs = blogs || [];
        const stats = {
          total: allBlogs.length,
          pending: allBlogs.filter((b) => b.status === 'PENDING_APPROVAL').length,
          approved: allBlogs.filter((b) => b.status === 'APPROVED').length,
          rejected: allBlogs.filter((b) => b.status === 'REJECTED').length,
        };

        return NextResponse.json({
          authenticated: true,
          authorized: true,
          currentUser: {
            email: auth.email,
            role: auth.role,
            name: auth.name,
          },
          blogs: allBlogs,
          stats,
          tableReady: true,
        });
      } catch (blogErr: any) {
        return NextResponse.json({
          authenticated: true,
          blogs: [],
          stats: { total: 0, pending: 0, approved: 0, rejected: 0 },
          tableReady: true,
          error: blogErr.message,
        });
      }
    }

    // ── Mentor Applications Moderation Query ──
    if (resource === 'mentors') {
      try {
        const { data: mentors, error } = await supabase
          .from('mentor_applications')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          const isTableMissing =
            error.code === '42P01' ||
            error.message?.toLowerCase().includes('relation "mentor_applications" does not exist') ||
            error.message?.toLowerCase().includes('does not exist');

          return NextResponse.json({
            authenticated: true,
            mentors: [],
            stats: { total: 0, pending: 0, in_review: 0, approved: 0, rejected: 0 },
            tableReady: !isTableMissing,
            error: error.message,
            message: isTableMissing
              ? 'Mentor applications table not found. Run apps/web/supabase/mentor-applications-migration.sql in Supabase SQL editor.'
              : error.message,
          });
        }

        const allMentors = mentors || [];

        // Match applicants with registered profiles in the platform by email
        const emails = Array.from(
          new Set(
            allMentors
              .map((m) => m.email?.trim().toLowerCase())
              .filter(Boolean)
          )
        );

        let profilesMap: Record<string, any> = {};
        if (emails.length > 0) {
          try {
            const { data: profilesList } = await supabase
              .from('profiles')
              .select('id, username, name, email, avatar_url, role, bio, college, organization, company, job_title, skills, github_url, linkedin_url, portfolio_url, elo_score, created_at')
              .in('email', emails);

            if (profilesList) {
              for (const p of profilesList) {
                if (p.email) {
                  profilesMap[p.email.trim().toLowerCase()] = p;
                }
              }
            }
          } catch (profErr) {
            console.warn('[Admin CSAP Mentors] Profiles join warning:', profErr);
          }
        }

        const enrichedMentors = allMentors.map((m) => {
          const emailKey = m.email?.trim().toLowerCase() || '';
          return {
            ...m,
            user_profile: profilesMap[emailKey] || null,
          };
        });

        const stats = {
          total: enrichedMentors.length,
          pending: enrichedMentors.filter((m) => m.status === 'PENDING').length,
          in_review: enrichedMentors.filter((m) => m.status === 'IN_REVIEW').length,
          approved: enrichedMentors.filter((m) => m.status === 'APPROVED').length,
          rejected: enrichedMentors.filter((m) => m.status === 'REJECTED').length,
        };

        return NextResponse.json({
          authenticated: true,
          authorized: true,
          currentUser: {
            email: auth.email,
            role: auth.role,
            name: auth.name,
          },
          mentors: enrichedMentors,
          stats,
          tableReady: true,
        });
      } catch (mentorErr: any) {
        return NextResponse.json({
          authenticated: true,
          mentors: [],
          stats: { total: 0, pending: 0, in_review: 0, approved: 0, rejected: 0 },
          tableReady: true,
          error: mentorErr.message,
        });
      }
    }

    // ── Events / Hackathons Query (Default) ──
    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const allEvents = events || [];

    // Query registration counts
    const { data: regRows } = await supabase
      .from('registrations')
      .select('event_id');

    // Query submission counts
    const { data: subRows } = await supabase
      .from('submissions')
      .select('event_id');

    const regCounts: Record<string, number> = {};
    regRows?.forEach((r: any) => {
      if (r.event_id) {
        regCounts[r.event_id] = (regCounts[r.event_id] || 0) + 1;
      }
    });

    const subCounts: Record<string, number> = {};
    subRows?.forEach((s: any) => {
      if (s.event_id) {
        subCounts[s.event_id] = (subCounts[s.event_id] || 0) + 1;
      }
    });

    let diskOrder: string[] = [];
    try {
      const fs = await import('fs');
      const path = await import('path');
      const orderFile = path.join(process.cwd(), 'data', 'showcase-order.json');
      if (fs.existsSync(orderFile)) {
        const raw = fs.readFileSync(orderFile, 'utf8');
        diskOrder = JSON.parse(raw).orderedEventIds || [];
      }
    } catch {}

    const eventsWithCounts = allEvents.map((evt: any) => {
      const regCount = (regCounts[evt.id] || 0) + (evt.slug ? (regCounts[evt.slug] || 0) : 0);
      const subCount = (subCounts[evt.id] || 0) + (evt.slug ? (subCounts[evt.slug] || 0) : 0);

      let displayOrder: number = 999999;
      if (typeof evt.display_order === 'number' && !isNaN(evt.display_order)) {
        displayOrder = evt.display_order;
      } else if (Array.isArray(evt.tags)) {
        const orderTag = evt.tags.find((t: string) => typeof t === 'string' && t.startsWith('hu_order:'));
        if (orderTag) {
          const parsed = parseInt(orderTag.replace('hu_order:', ''), 10);
          if (!isNaN(parsed)) displayOrder = parsed;
        }
      }

      if (diskOrder.length > 0) {
        const diskIdx = diskOrder.findIndex((id) => id === evt.id || id === evt.slug);
        if (diskIdx !== -1) {
          displayOrder = diskIdx;
        }
      }

      const isRedirectAllowed = Boolean(
        evt.allow_external_redirect === true ||
        (Array.isArray(evt.tags) && evt.tags.includes('allow_external_redirect'))
      );

      const cleanTags = Array.isArray(evt.tags)
        ? evt.tags.filter(
            (t: string) =>
              typeof t === 'string' &&
              !t.startsWith('hu_') &&
              !t.startsWith('#hu_') &&
              t !== 'allow_external_redirect' &&
              t !== 'PENDING_APPROVAL' &&
              !t.startsWith('{') &&
              !t.startsWith('[')
          )
        : [];

      return {
        ...evt,
        allow_external_redirect: isRedirectAllowed,
        registration_link: evt.registration_link || null,
        tags: cleanTags,
        display_order: displayOrder,
        registration_count: regCount,
        submission_count: subCount,
      };
    });

    const stats = {
      total: allEvents.length,
      pending: allEvents.filter(
        (e) =>
          e.status === 'PENDING_APPROVAL' ||
          (e.status === 'DRAFT' && Array.isArray(e.tags) && e.tags.includes('PENDING_APPROVAL'))
      ).length,
      approved: allEvents.filter((e) =>
        ['PUBLISHED', 'REGISTRATION_OPEN', 'LIVE', 'JUDGING', 'COMPLETED', 'ARCHIVED'].includes(
          e.status
        )
      ).length,
      rejected: allEvents.filter((e) => e.status === 'REJECTED').length,
    };

    const res = NextResponse.json({
      authenticated: true,
      authorized: true,
      currentUser: {
        email: auth.email,
        role: auth.role,
        name: auth.name,
      },
      events: eventsWithCounts,
      stats,
    });

    res.cookies.set({
      name: 'is_admin_csap',
      value: '1',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

// ─── POST: Check Access, Add Team Member, Logout, or Login ──────────────────
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyCsapAuthorization(req);
    const body = await req.json().catch(() => ({}));
    const { action, username, password, email, role } = body;

    // ── Check Access Action ──
    if (action === 'check_access') {
      return NextResponse.json({
        authenticated: auth.authenticated,
        authorized: auth.authorized,
        email: auth.email,
        role: auth.role,
        name: auth.name,
        avatar_url: auth.avatar_url,
        error: auth.error,
      });
    }

    // ── Add Team Member Action ──
    if (action === 'add_team_member') {
      if (!auth.authenticated) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      if (!auth.authorized || (auth.role !== 'owner' && auth.role !== 'admin')) {
        return NextResponse.json(
          { error: 'Only Owners and Admins can add team members.' },
          { status: 403 }
        );
      }

      const targetEmail = (email || '').trim().toLowerCase();
      if (!targetEmail || !targetEmail.includes('@')) {
        return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 });
      }

      const validRoles: CsapRole[] = ['owner', 'admin', 'manager', 'viewer'];
      const targetRole: CsapRole = validRoles.includes(role) ? role : 'viewer';

      if (auth.role === 'admin' && targetRole === 'owner') {
        return NextResponse.json(
          { error: 'Admins cannot assign the Owner role. Only an Owner can assign the Owner role.' },
          { status: 403 }
        );
      }

      const supabase = createAdminClient();

      // Check if already in csap_team
      const { data: existing } = await supabase
        .from('csap_team')
        .select('id, email, role')
        .ilike('email', targetEmail)
        .maybeSingle();

      if (existing) {
        return NextResponse.json(
          { error: `User "${targetEmail}" is already a CSAP team member with role "${existing.role}".` },
          { status: 409 }
        );
      }

      // Check profiles table for avatar & name
      let memberName = targetEmail.split('@')[0];
      let avatarUrl: string | null = null;
      let memberUsername: string | null = null;

      try {
        const { data: prof } = await supabase
          .from('profiles')
          .select('name, username, avatar_url')
          .ilike('email', targetEmail)
          .maybeSingle();

        if (prof) {
          if (prof.name) memberName = prof.name;
          if (prof.avatar_url) avatarUrl = prof.avatar_url;
          if (prof.username) memberUsername = prof.username;
        }
      } catch (profErr) {
        console.warn('Profile lookup warning:', profErr);
      }

      const { data: newMember, error: insertError } = await supabase
        .from('csap_team')
        .insert({
          email: targetEmail,
          role: targetRole,
          name: memberName,
          avatar_url: avatarUrl,
          status: 'active',
          added_by: auth.email || 'admin',
        })
        .select('*')
        .single();

      if (insertError) {
        const isTableMissing =
          insertError.code === '42P01' ||
          insertError.message?.toLowerCase().includes('relation "csap_team" does not exist');

        return NextResponse.json(
          {
            error: isTableMissing
              ? 'Database table "csap_team" does not exist yet. Please run apps/web/supabase/csap-team-migration.sql in Supabase SQL editor.'
              : insertError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        member: {
          ...newMember,
          username: memberUsername,
        },
        message: `Granted ${targetRole.toUpperCase()} access to ${targetEmail}`,
      });
    }

    // Logout Action
    if (action === 'logout') {
      const res = NextResponse.json({ success: true, message: 'Logged out successfully' });
      res.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });
      res.cookies.set({
        name: 'is_admin_csap',
        value: '',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      });

      return res;
    }

    // Login Action (legacy fallback)
    if (action === 'login') {
      if (!checkCredentials(username, password)) {
        return NextResponse.json(
          { success: false, error: 'Invalid username or password' },
          { status: 401 }
        );
      }

      const token = createSessionToken(username);
      const res = NextResponse.json({
        success: true,
        message: 'Admin authenticated successfully',
      });

      res.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60, // 7 days
      });

      res.cookies.set({
        name: 'is_admin_csap',
        value: '1',
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return res;
    }

    // Verify Session Action
    if (action === 'verify') {
      return NextResponse.json({ authenticated: auth.authenticated, authorized: auth.authorized });
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

// ─── PATCH: Approve or Reject Hackathon Request ─────────────────────────────
export async function PATCH(req: NextRequest) {
  const auth = await verifyCsapAuthorization(req);
  if (!auth.authenticated) {
    return NextResponse.json({ authenticated: false, error: auth.error || 'Unauthorized' }, { status: 401 });
  }
  if (!auth.authorized) {
    return NextResponse.json(
      { authenticated: true, authorized: false, error: auth.error, email: auth.email },
      { status: 403 }
    );
  }

  // Viewers cannot perform any mutations
  if (auth.role === 'viewer') {
    return NextResponse.json(
      { error: 'Viewer accounts have read-only access and cannot make modifications.' },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { action, eventId, blogId, feedback, memberId, email: targetEmail, role: newRole } = body;

    const supabase = createAdminClient();

    // ── Update Team Member Role ──
    if (action === 'update_team_member_role') {
      if (auth.role !== 'owner' && auth.role !== 'admin') {
        return NextResponse.json({ error: 'Only Owners and Admins can update roles.' }, { status: 403 });
      }

      if (!memberId) {
        return NextResponse.json({ error: 'Missing memberId' }, { status: 400 });
      }

      const normalizedTarget = (targetEmail || '').trim().toLowerCase();
      if (normalizedTarget === ROOT_OWNER_EMAIL) {
        return NextResponse.json(
          { error: 'Root Owner permissions are locked and cannot be changed.' },
          { status: 403 }
        );
      }

      const validRoles: CsapRole[] = ['owner', 'admin', 'manager', 'viewer'];
      if (!validRoles.includes(newRole)) {
        return NextResponse.json({ error: 'Invalid role specified.' }, { status: 400 });
      }

      if (auth.role === 'admin' && newRole === 'owner') {
        return NextResponse.json({ error: 'Admins cannot grant Owner role.' }, { status: 403 });
      }

      const { error: updateErr } = await supabase
        .from('csap_team')
        .update({
          role: newRole,
          updated_at: new Date().toISOString(),
        })
        .eq('id', memberId);

      if (updateErr) {
        return NextResponse.json({ error: updateErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Updated role to ${newRole.toUpperCase()}`,
      });
    }

    // ── Blog Approval / Rejection ──
    if (action === 'approve_blog') {
      const targetId = blogId || eventId;
      if (!targetId) return NextResponse.json({ error: 'Missing blogId' }, { status: 400 });

      const { data, error } = await supabase
        .from('blogs')
        .update({
          status: 'APPROVED',
          admin_feedback: null,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetId)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Blog "${data.title}" approved and published successfully!`,
        blog: data,
      });
    }

    if (action === 'reject_blog') {
      const targetId = blogId || eventId;
      if (!targetId) return NextResponse.json({ error: 'Missing blogId' }, { status: 400 });

      const { data, error } = await supabase
        .from('blogs')
        .update({
          status: 'REJECTED',
          admin_feedback: feedback || 'Article does not meet publishing criteria.',
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetId)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Blog "${data.title}" rejected.`,
        blog: data,
      });
    }

    if (action === 'pending_blog' || action === 'reset_blog') {
      const targetId = blogId || eventId;
      if (!targetId) return NextResponse.json({ error: 'Missing blogId' }, { status: 400 });

      const { data, error } = await supabase
        .from('blogs')
        .update({
          status: 'PENDING_APPROVAL',
          admin_feedback: null,
          reviewed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetId)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Blog "${data.title}" moved back to Pending Review.`,
        blog: data,
      });
    }

    // ── Mentor Applications Actions ──
    if (action === 'approve_mentor') {
      const targetId = body.mentorId || body.id || eventId;
      if (!targetId) return NextResponse.json({ error: 'Missing mentorId' }, { status: 400 });

      const { data, error } = await supabase
        .from('mentor_applications')
        .update({
          status: 'APPROVED',
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetId)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Mentor application for "${data.name}" approved!`,
        mentor: data,
      });
    }

    if (action === 'in_review_mentor') {
      const targetId = body.mentorId || body.id || eventId;
      if (!targetId) return NextResponse.json({ error: 'Missing mentorId' }, { status: 400 });

      const { data, error } = await supabase
        .from('mentor_applications')
        .update({
          status: 'IN_REVIEW',
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetId)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Mentor application for "${data.name}" marked as In-Review.`,
        mentor: data,
      });
    }

    if (action === 'reject_mentor') {
      const targetId = body.mentorId || body.id || eventId;
      if (!targetId) return NextResponse.json({ error: 'Missing mentorId' }, { status: 400 });

      const updatePayload: any = {
        status: 'REJECTED',
        updated_at: new Date().toISOString(),
      };
      if (feedback || body.notes) {
        updatePayload.notes = feedback || body.notes;
      }

      const { data, error } = await supabase
        .from('mentor_applications')
        .update(updatePayload)
        .eq('id', targetId)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Mentor application for "${data.name}" rejected.`,
        mentor: data,
      });
    }

    if (action === 'pending_mentor' || action === 'reset_mentor') {
      const targetId = body.mentorId || body.id || eventId;
      if (!targetId) return NextResponse.json({ error: 'Missing mentorId' }, { status: 400 });

      const { data, error } = await supabase
        .from('mentor_applications')
        .update({
          status: 'PENDING',
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetId)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Mentor application for "${data.name}" moved back to Pending.`,
        mentor: data,
      });
    }

    if (action === 'update_mentor') {
      const targetId = body.mentorId || body.id || eventId;
      if (!targetId) return NextResponse.json({ error: 'Missing mentorId' }, { status: 400 });

      const updates: any = { updated_at: new Date().toISOString() };
      if (body.status) updates.status = body.status;
      if (body.notes !== undefined) updates.notes = body.notes;

      const { data, error } = await supabase
        .from('mentor_applications')
        .update(updates)
        .eq('id', targetId)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Mentor application updated successfully.`,
        mentor: data,
      });
    }

    // ── Reorder Homepage Showcase Hackathons ──
    if (action === 'reorder_showcase' || action === 'reorder_events') {
      const { orderedEventIds } = body;
      if (!Array.isArray(orderedEventIds) || orderedEventIds.length === 0) {
        return NextResponse.json({ error: 'Missing or empty orderedEventIds array' }, { status: 400 });
      }

      // 1. Save ordered list to local data file data/showcase-order.json as reliable backup/cache
      try {
        const fs = await import('fs');
        const path = await import('path');
        const dataDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        fs.writeFileSync(
          path.join(dataDir, 'showcase-order.json'),
          JSON.stringify({ orderedEventIds, updatedAt: new Date().toISOString() }, null, 2)
        );
      } catch (fsErr) {
        console.warn('Could not write data/showcase-order.json:', fsErr);
      }

      // 2. Fetch existing events from Supabase to preserve other tags
      const { data: existingEvents } = await supabase
        .from('events')
        .select('id, slug, tags');

      const eventMap = new Map<string, any>();
      (existingEvents || []).forEach((e: any) => {
        if (e.id) eventMap.set(e.id, e);
        if (e.slug) eventMap.set(e.slug, e);
      });

      // 3. Update each event's display_order and tags with hu_order:<index>
      const updatePromises = orderedEventIds.map(async (idOrSlug: string, index: number) => {
        const existing = eventMap.get(idOrSlug);
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

        const currentTags: string[] = Array.isArray(existing?.tags) ? existing.tags : [];
        const cleanTags = currentTags.filter((t: string) => typeof t === 'string' && !t.startsWith('hu_order:'));
        cleanTags.push(`hu_order:${index}`);

        // Try updating display_order first
        let query = supabase.from('events').update({
          display_order: index,
          tags: cleanTags,
          updated_at: new Date().toISOString(),
        });
        query = isUuid ? query.eq('id', idOrSlug) : query.eq('slug', idOrSlug);
        let { error } = await query;

        // If display_order column doesn't exist yet in postgres, fallback to tags only
        if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('column'))) {
          let retry = supabase.from('events').update({
            tags: cleanTags,
            updated_at: new Date().toISOString(),
          });
          retry = isUuid ? retry.eq('id', idOrSlug) : retry.eq('slug', idOrSlug);
          await retry;
        }
      });

      await Promise.all(updatePromises);

      // 4. Broadcast realtime event
      try {
        const channel = supabase.channel('public:events_realtime');
        await channel.send({
          type: 'broadcast',
          event: 'event_updated',
          payload: { action: 'showcase_reordered', orderedEventIds },
        });
      } catch (broadcastErr) {
        console.warn('Realtime broadcast error:', broadcastErr);
      }

      return NextResponse.json({
        success: true,
        message: 'Homepage showcase order saved successfully!',
        orderedEventIds,
      });
    }

    // ── Hackathon Approval / Rejection ──
    if (!eventId) {
      return NextResponse.json({ error: 'Missing eventId' }, { status: 400 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);

    // ── Update Hackathon Event by Admin ──
    if (action === 'update_event' || action === 'edit_event') {
      const updates = body.updates || {};
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      const allowedFields = [
        'title',
        'tagline',
        'description',
        'category',
        'event_type',
        'location',
        'organizer_name',
        'organizer_email',
        'organizer_phone',
        'institution_name',
        'host_type',
        'start_date',
        'end_date',
        'registration_deadline',
        'registration_start',
        'total_prize_value',
        'currency',
        'status',
        'min_team_size',
        'max_team_size',
        'is_team_event',
        'featured',
        'banner_url',
        'logo_url',
        'rules_text',
        'eligibility',
        'difficulty',
        'timezone',
        'tags',
        'admin_feedback',
        'prizes',
        'tracks',
        'stages',
        'faqs',
        'sponsors',
        'registration_link',
        'allow_external_redirect',
      ];

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateData[field] = updates[field];
        }
      }

      let query = supabase.from('events').update(updateData);
      query = isUuid ? query.eq('id', eventId) : query.eq('slug', eventId);
      let { data, error } = await query.select('*').single();

      // Graceful column fallback if optional columns missing
      if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('column'))) {
        delete updateData.reviewed_at;
        delete updateData.admin_feedback;
        delete updateData.allow_external_redirect;
        let retry = supabase.from('events').update(updateData);
        retry = isUuid ? retry.eq('id', eventId) : retry.eq('slug', eventId);
        const result = await retry.select('*').single();
        data = result.data;
        error = result.error;
      }

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Broadcast update to realtime channel
      try {
        const channel = supabase.channel('public:events_realtime');
        await channel.send({
          type: 'broadcast',
          event: 'event_updated',
          payload: { eventId, status: data.status, event: data },
        });
      } catch (broadcastErr) {
        console.warn('Realtime broadcast warning:', broadcastErr);
      }

      return NextResponse.json({
        success: true,
        message: `Event "${data.title}" updated successfully!`,
        event: data,
      });
    }

    // ── Toggle External Registration Redirect Permission ──
    if (action === 'toggle_external_redirect') {
      const allowed = Boolean(body.allowed ?? body.allowExternalRedirect);

      // 1. Fetch current tags
      let getQuery = supabase.from('events').select('id, tags, title');
      getQuery = isUuid ? getQuery.eq('id', eventId) : getQuery.eq('slug', eventId);
      const { data: currentEvt, error: fetchErr } = await getQuery.single();

      if (fetchErr) {
        return NextResponse.json({ error: fetchErr.message }, { status: 500 });
      }

      let currentTags = Array.isArray(currentEvt?.tags) ? [...currentEvt.tags] : [];
      if (allowed) {
        if (!currentTags.includes('allow_external_redirect')) {
          currentTags.push('allow_external_redirect');
        }
      } else {
        currentTags = currentTags.filter((t: string) => t !== 'allow_external_redirect');
      }

      const updateData: any = {
        tags: currentTags,
        updated_at: new Date().toISOString(),
      };

      // Also set allow_external_redirect column if exists
      updateData.allow_external_redirect = allowed;

      let query = supabase.from('events').update(updateData);
      query = isUuid ? query.eq('id', eventId) : query.eq('slug', eventId);
      let { data, error } = await query.select('*').single();

      // Graceful column fallback if allow_external_redirect column does not exist
      if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('column'))) {
        delete updateData.allow_external_redirect;
        let retry = supabase.from('events').update(updateData);
        retry = isUuid ? retry.eq('id', eventId) : retry.eq('slug', eventId);
        const result = await retry.select('*').single();
        data = result.data;
        error = result.error;
      }

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Realtime broadcast update
      try {
        const channel = supabase.channel('public:events_realtime');
        await channel.send({
          type: 'broadcast',
          event: 'event_updated',
          payload: { eventId, event: data },
        });
      } catch (broadcastErr) {
        console.warn('Realtime broadcast warning:', broadcastErr);
      }

      return NextResponse.json({
        success: true,
        message: allowed
          ? `External redirect unlocked for "${data.title}"`
          : `External redirect locked for "${data.title}"`,
        event: {
          ...data,
          allow_external_redirect: allowed,
        },
      });
    }

    if (action === 'approve') {
      // Transition to PUBLISHED so it appears live across website
      const updateData: any = {
        status: 'PUBLISHED',
        updated_at: new Date().toISOString(),
      };

      // Try updating with extra columns if present
      let query = supabase.from('events').update({
        ...updateData,
        reviewed_at: new Date().toISOString(),
      });
      query = isUuid ? query.eq('id', eventId) : query.eq('slug', eventId);
      let { data, error } = await query.select('*').single();

      // If reviewed_at column doesn't exist yet, retry without it
      if (error && (error.code === '42703' || error.code === 'PGRST204' || error.message?.includes('column'))) {
        let retry = supabase.from('events').update(updateData);
        retry = isUuid ? retry.eq('id', eventId) : retry.eq('slug', eventId);
        const result = await retry.select('*').single();
        data = result.data;
        error = result.error;
      }

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Broadcast update to all clients via Supabase Realtime channel
      try {
        const channel = supabase.channel('public:events_realtime');
        await channel.send({
          type: 'broadcast',
          event: 'event_updated',
          payload: { eventId, status: 'PUBLISHED', event: data },
        });
        await channel.send({
          type: 'broadcast',
          event: 'event_created',
          payload: { event: data },
        });
      } catch (broadcastErr) {
        console.warn('Realtime broadcast warning:', broadcastErr);
      }

      return NextResponse.json({
        success: true,
        message: `Hackathon "${data.title}" approved and published successfully!`,
        event: data,
      });
    }

    if (action === 'reject') {
      // Transition to REJECTED (with graceful fallback to DRAFT + rejected tag if constraint pending)
      const updateData: any = {
        status: 'REJECTED',
        updated_at: new Date().toISOString(),
      };

      let query = supabase.from('events').update({
        ...updateData,
        admin_feedback: feedback || 'Submission does not meet guidelines.',
        reviewed_at: new Date().toISOString(),
      });
      query = isUuid ? query.eq('id', eventId) : query.eq('slug', eventId);
      let { data, error } = await query.select('*').single();

      // If columns or status constraint fail, fallback gracefully
      if (error && (error.code === '42703' || error.code === '23514' || error.code === 'PGRST204' || error.message?.includes('column'))) {
        let retry = supabase.from('events').update({
          status: 'DRAFT',
          updated_at: new Date().toISOString(),
        });
        retry = isUuid ? retry.eq('id', eventId) : retry.eq('slug', eventId);
        const result = await retry.select('*').single();
        data = result.data;
        error = result.error;
      }

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // Broadcast event update so it is removed from any live listings
      try {
        const channel = supabase.channel('public:events_realtime');
        await channel.send({
          type: 'broadcast',
          event: 'event_updated',
          payload: { eventId, status: 'REJECTED', event: data },
        });
      } catch (broadcastErr) {
        console.warn('Realtime broadcast warning:', broadcastErr);
      }

      return NextResponse.json({
        success: true,
        message: `Hackathon rejected.`,
        event: data,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

// ─── DELETE: Delete a hackathon, blog, mentor, or team member ────────────────
export async function DELETE(req: NextRequest) {
  const auth = await verifyCsapAuthorization(req);
  if (!auth.authenticated) {
    return NextResponse.json({ authenticated: false, error: auth.error || 'Unauthorized' }, { status: 401 });
  }
  if (!auth.authorized) {
    return NextResponse.json(
      { authenticated: true, authorized: false, error: auth.error, email: auth.email },
      { status: 403 }
    );
  }

  // Deletions are restricted to Owner and Admin roles
  if (auth.role !== 'owner' && auth.role !== 'admin') {
    return NextResponse.json(
      { error: 'Only Owners and Admins have permission to delete resources.' },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const resource = searchParams.get('resource');
    const memberId = searchParams.get('memberId');
    const targetEmail = searchParams.get('email');
    const eventId = searchParams.get('eventId') || searchParams.get('blogId') || searchParams.get('mentorId');

    const supabase = createAdminClient();

    // ── Team Member Removal ──
    if (resource === 'team') {
      if (auth.role !== 'owner') {
        return NextResponse.json(
          { error: 'Only the Owner can remove team members from CSAP.' },
          { status: 403 }
        );
      }

      const cleanEmail = (targetEmail || '').trim().toLowerCase();
      if (cleanEmail === ROOT_OWNER_EMAIL) {
        return NextResponse.json(
          { error: 'Root Owner account is protected and cannot be removed from CSAP.' },
          { status: 400 }
        );
      }

      let query = supabase.from('csap_team').delete();
      if (memberId) {
        query = query.eq('id', memberId);
      } else if (cleanEmail) {
        query = query.ilike('email', cleanEmail);
      } else {
        return NextResponse.json({ error: 'Missing memberId or email' }, { status: 400 });
      }

      const { error: delErr } = await query;
      if (delErr) {
        return NextResponse.json({ error: delErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Team member removed from CSAP successfully',
      });
    }

    if (!eventId) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
    }

    if (resource === 'mentors') {
      const { error } = await supabase.from('mentor_applications').delete().eq('id', eventId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Mentor application deleted successfully' });
    }

    if (resource === 'blogs') {
      const { error } = await supabase.from('blogs').delete().eq('id', eventId);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Blog deleted successfully' });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);

    let query = supabase.from('events').delete();
    query = isUuid ? query.eq('id', eventId) : query.eq('slug', eventId);
    const { error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Broadcast deletion
    try {
      const channel = supabase.channel('public:events_realtime');
      await channel.send({
        type: 'broadcast',
        event: 'event_deleted',
        payload: { eventId },
      });
    } catch (broadcastErr) {
      console.warn('Broadcast delete error:', broadcastErr);
    }

    return NextResponse.json({ success: true, message: 'Event deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
