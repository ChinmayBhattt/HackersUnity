import {
  authenticateRequest,
  createAdminClient,
} from '@/lib/api-auth';

export async function GET(req: Request) {
  try {
    const auth = await authenticateRequest();
    if (!auth) {
      return new Response('Unauthorized: You must be logged in to export submissions.', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return new Response('Error: Missing eventId parameter', { status: 400 });
    }

    const serverSupabase = createAdminClient();
    let resolvedEventId = eventId;
    let eventTitle = 'Hackathon';
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);

    let eventDataQuery = serverSupabase.from('events').select('id, title, organizer_id');
    if (!isUuid) {
      eventDataQuery = eventDataQuery.eq('slug', eventId);
    } else {
      eventDataQuery = eventDataQuery.eq('id', eventId);
    }

    const { data: eventData } = await eventDataQuery.maybeSingle();
    if (eventData?.id) {
      resolvedEventId = eventData.id;
      eventTitle = eventData.title || eventTitle;
    } else {
      return new Response('Error: Event not found', { status: 404 });
    }

    // Verify organizer, co-host, or admin authorization
    const isOwner = eventData.organizer_id === auth.userId;
    const isAdmin = auth.user.user_metadata?.role === 'ADMIN' || auth.email === process.env.ADMIN_EMAIL;

    let isCoHost = false;
    if (!isOwner && !isAdmin) {
      const { data: coHostRecord } = await serverSupabase
        .from('event_admins')
        .select('id')
        .eq('event_id', resolvedEventId)
        .eq('user_id', auth.userId)
        .maybeSingle();
      isCoHost = Boolean(coHostRecord);
    }

    if (!isOwner && !isCoHost && !isAdmin) {
      return new Response('Forbidden: Only the event organizer, co-host, or admin can export submissions.', { status: 403 });
    }

    let submissions: any[] = [];
    if (resolvedEventId) {
      const { data } = await serverSupabase
        .from('submissions')
        .select(`
          *,
          profiles:submitter_id (
            name,
            email,
            college
          )
        `)
        .eq('event_id', resolvedEventId)
        .order('created_at', { ascending: false });
      submissions = data || [];
    }

    // Standard CSV headers compatible with Google Sheets & Excel
    const headers = [
      'Submission ID',
      'Submitted Date',
      'Project Title',
      'Tagline',
      'Track',
      'Submitter Name',
      'Submitter Email',
      'Submitter College',
      'Repository URL',
      'Demo Video URL',
      'Status',
      'Score',
      'Description',
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""').replace(/\r?\n|\r/g, ' ');
      return `"${clean}"`;
    };

    const rows = (submissions || []).map((sub: any) => [
      escapeCsv(sub.id),
      escapeCsv(sub.created_at ? new Date(sub.created_at).toLocaleString() : ''),
      escapeCsv(sub.project_name),
      escapeCsv(sub.tagline || ''),
      escapeCsv(sub.track || 'General'),
      escapeCsv(sub.profiles?.name || 'Participant'),
      escapeCsv(sub.profiles?.email || ''),
      escapeCsv(sub.profiles?.college || ''),
      escapeCsv(sub.repo_url),
      escapeCsv(sub.demo_url || sub.video_url || ''),
      escapeCsv(sub.status || 'SUBMITTED'),
      escapeCsv(sub.score || 0),
      escapeCsv(sub.description || ''),
    ]);

    const csvBody = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    return new Response(csvBody, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${eventId}-submissions.csv"`,
        'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      },
    });
  } catch (err: any) {
    return new Response(`Error generating CSV: ${err.message}`, { status: 500 });
  }
}
