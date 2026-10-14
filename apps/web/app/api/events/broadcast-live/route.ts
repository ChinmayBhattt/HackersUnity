import { NextResponse } from 'next/server';
import {
  authenticateRequest,
  createAdminClient,
  forbiddenResponse,
  unauthorizedResponse,
} from '@/lib/api-auth';
import { sendLiveEventAnnouncementToAllUsers } from '@/lib/live-event-email-service';

export async function POST(req: Request) {
  try {
    const auth = await authenticateRequest();
    if (!auth) {
      return unauthorizedResponse('You must be logged in to broadcast an event.');
    }

    const body = await req.json();
    const { eventId, slug, isTest, testEmail, force } = body;

    if (!eventId && !slug) {
      return NextResponse.json({ error: 'Missing eventId or slug' }, { status: 400 });
    }

    const serverSupabase = createAdminClient();
    const isUuid = Boolean(eventId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId));

    let query = serverSupabase.from('events').select('*');
    if (isUuid) {
      query = query.eq('id', eventId);
    } else {
      query = query.ilike('slug', slug || eventId);
    }

    const { data: event, error: eventError } = await query.maybeSingle();
    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Authorization: only event organizer or admin can trigger broadcast
    const userRole = auth.user?.user_metadata?.role;
    const userEmail = (auth.email || auth.user?.email || '').toLowerCase().trim();
    const isOwner = event.organizer_id === auth.userId || !event.organizer_id;
    const isAdmin =
      userRole === 'ADMIN' ||
      userRole === 'SUPER_ADMIN' ||
      userEmail === 'chinmaybhatt26@gmail.com' ||
      userEmail === 'info@hackersunity.com' ||
      userEmail === process.env.ADMIN_EMAIL?.toLowerCase();

    if (!isOwner && !isAdmin) {
      return forbiddenResponse('Only the event organizer or platform admins can broadcast this event.');
    }

    const result = await sendLiveEventAnnouncementToAllUsers(event, {
      force: Boolean(force),
      isTest: Boolean(isTest),
      testEmail: testEmail || userEmail || 'info@hackersunity.com',
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[POST /api/events/broadcast-live] Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
