import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{
    username: string;
  }>;
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const { username: rawUsername } = await context.params;
    if (!rawUsername) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const cleanUsername = decodeURIComponent(rawUsername).trim().toLowerCase().replace(/^@/, '');
    const isEmail = cleanUsername.includes('@');
    const supabaseAdmin = createAdminClient();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanUsername);

    // 1. Fetch user profile
    let profile: any = null;

    try {
      // Try querying by username, email, or UUID id
      let query = supabaseAdmin
        .from('profiles')
        .select('*');

      if (isUuid) {
        query = query.or(`id.eq.${cleanUsername},username.ilike.${cleanUsername}`);
      } else if (isEmail) {
        query = query.ilike('email', cleanUsername);
      } else {
        query = query.ilike('username', cleanUsername);
      }

      const { data, error } = await query.maybeSingle();

      if (!error && data) {
        profile = data;
      } else if (error && error.code === '42703') {
        // If username column does not exist yet, find by UUID or email prefix
        if (isUuid) {
          const { data: byId } = await supabaseAdmin.from('profiles').select('*').eq('id', cleanUsername).maybeSingle();
          profile = byId;
        } else {
          // Search by email prefix or name match
          const { data: allProfiles } = await supabaseAdmin.from('profiles').select('*').limit(100);
          if (allProfiles) {
            profile = allProfiles.find((p) => {
              const emailPrefix = p.email ? p.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : '';
              const cleanName = p.name ? p.name.toLowerCase().replace(/[^a-z0-9_]/g, '') : '';
              return emailPrefix === cleanUsername || cleanName === cleanUsername;
            });
          }
        }
      }
    } catch (e) {
      console.warn('[User Profile API] Profile query exception:', e);
    }

    // Fallback: check all profiles if not found yet (for lenient prefix match)
    if (!profile) {
      try {
        const { data: allProfiles } = await supabaseAdmin.from('profiles').select('*').limit(100);
        if (allProfiles) {
          profile = allProfiles.find((p) => {
            const handle = p.username ? p.username.toLowerCase() : '';
            const emailPrefix = p.email ? p.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : '';
            const cleanName = p.name ? p.name.toLowerCase().replace(/[^a-z0-9_]/g, '') : '';
            return handle === cleanUsername || emailPrefix === cleanUsername || cleanName === cleanUsername;
          });
        }
      } catch (err) {
        console.warn('[User Profile API] Fallback search error:', err);
      }
    }

    if (!profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const userId = profile.id;

    // 2. Fetch Participations (from registrations table, joined with events)
    let participations: any[] = [];
    try {
      let regQuery = supabaseAdmin
        .from('registrations')
        .select(`
          id,
          event_id,
          team_name,
          role,
          status,
          registered_at,
          events (
            id,
            slug,
            title,
            category,
            event_type,
            location,
            start_date,
            end_date,
            total_prize_value,
            organizer_name
          )
        `);

      if (profile.email) {
        regQuery = regQuery.or(`user_id.eq.${userId},user_email.eq.${profile.email}`);
      } else {
        regQuery = regQuery.eq('user_id', userId);
      }

      const { data: regs, error: regsError } = await regQuery.order('registered_at', { ascending: false });

      if (!regsError && regs) {
        participations = regs.map((r: any) => ({
          registrationId: r.id,
          eventId: r.event_id,
          role: r.role || 'Participant',
          status: r.status || 'CONFIRMED',
          teamName: r.team_name || null,
          registeredAt: r.registered_at,
          eventTitle: r.events?.title || 'Hackathon Competition',
          eventSlug: r.events?.slug || r.event_id,
          eventType: r.events?.event_type || 'ONLINE',
          category: r.events?.category || 'HACKATHON',
          location: r.events?.location || 'Online',
          startDate: r.events?.start_date,
          endDate: r.events?.end_date,
          totalPrizeValue: r.events?.total_prize_value || 0,
          organizerName: r.events?.organizer_name || 'Hacker\'s Unity',
        }));
      }
    } catch (regErr) {
      console.warn('[User Profile API] Participations fetch warning:', regErr);
    }

    // 3. Fetch Submissions (projects created/submitted by user)
    let submissions: any[] = [];
    try {
      const { data: subs, error: subsError } = await supabaseAdmin
        .from('submissions')
        .select(`
          id,
          event_id,
          project_name,
          tagline,
          description,
          repo_url,
          demo_url,
          video_url,
          track,
          status,
          score,
          created_at,
          events (
            id,
            slug,
            title,
            total_prize_value,
            organizer_name,
            prizes
          )
        `)
        .eq('submitter_id', userId)
        .order('created_at', { ascending: false });

      if (!subsError && subs) {
        submissions = subs.map((s: any) => ({
          id: s.id,
          eventId: s.event_id,
          projectTitle: s.project_name || 'Hackathon Project',
          tagline: s.tagline || '',
          projectDescription: s.description || '',
          projectLink: s.repo_url || '',
          demoVideoUrl: s.demo_url || s.video_url || '',
          track: s.track || 'General Open Track',
          status: s.status || 'SUBMITTED',
          score: s.score || 0,
          feedback: '',
          createdAt: s.created_at,
          eventTitle: s.events?.title || 'Hackathon',
          eventSlug: s.events?.slug || s.event_id,
          totalPrizeValue: s.events?.total_prize_value || 0,
          eventPrizes: s.events?.prizes || [],
        }));
      }
    } catch (subErr) {
      console.warn('[User Profile API] Submissions fetch warning:', subErr);
    }

    // 4. Filter Winnings (submissions with status 'WINNER' or 'ACCEPTED' with top scores)
    const winnings = submissions
      .filter((s) => s.status === 'WINNER')
      .map((s) => ({
        id: s.id,
        projectTitle: s.projectTitle,
        tagline: s.tagline,
        projectDescription: s.projectDescription,
        repoUrl: s.projectLink,
        demoUrl: s.demoVideoUrl,
        track: s.track,
        eventTitle: s.eventTitle,
        eventSlug: s.eventSlug,
        totalPrizeValue: s.totalPrizeValue,
        awardedAt: s.createdAt,
      }));

    // 5. Structure final profile response
    let resolvedBannerUrl = profile.banner_url || null;
    let resolvedAvatarUrl = profile.avatar_url || null;
    let resolvedBio = profile.bio || null;
    let resolvedSkills = Array.isArray(profile.skills) ? profile.skills : [];

    if (!resolvedBannerUrl || !resolvedAvatarUrl || !resolvedBio || resolvedSkills.length === 0) {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
        const meta = authUser?.user?.user_metadata;
        if (meta) {
          if (!resolvedBannerUrl && meta.banner_url) resolvedBannerUrl = meta.banner_url;
          if (!resolvedAvatarUrl && (meta.avatar_url || meta.picture)) resolvedAvatarUrl = meta.avatar_url || meta.picture;
          if (!resolvedBio && meta.bio) resolvedBio = meta.bio;
          if (resolvedSkills.length === 0 && Array.isArray(meta.skills)) resolvedSkills = meta.skills;
        }
      } catch (authErr) {
        // ignore
      }
    }

    const finalUsername =
      profile.username ||
      (profile.email ? profile.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : null) ||
      (profile.name ? profile.name.toLowerCase().replace(/[^a-z0-9_]/g, '') : 'builder');

    return NextResponse.json({
      user: {
        id: profile.id,
        username: finalUsername,
        name: profile.name || 'Anonymous Builder',
        email: profile.email || '',
        avatarUrl: resolvedAvatarUrl,
        bannerUrl: resolvedBannerUrl,
        role: profile.role || 'PARTICIPANT',
        college: profile.college || null,
        organization: profile.organization || null,
        professionType: profile.profession_type || 'STUDENT',
        degree: profile.degree || null,
        branch: profile.branch || null,
        graduationYear: profile.graduation_year || null,
        company: profile.company || null,
        jobTitle: profile.job_title || null,
        experienceYears: profile.experience_years || null,
        industry: profile.industry || null,
        bio: resolvedBio,
        skills: resolvedSkills,
        socialLinks: {
          github: profile.github_url || null,
          linkedin: profile.linkedin_url || null,
          portfolio: profile.portfolio_url || null,
        },
        eloScore: profile.elo_score || 1200,
        createdAt: profile.created_at,
      },
      winnings,
      participations,
      submissions,
      stats: {
        totalParticipations: participations.length,
        totalWinnings: winnings.length,
        totalSubmissions: submissions.length,
      },
    });
  } catch (err: any) {
    console.error('[User Profile Dynamic Route Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
