import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/api-auth';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const {
      applicant_name,
      applicant_email,
      applicant_phone,
      college_name,
      college_city,
      college_state,
      role_in_college,
      academic_year,
      club_name,
      expected_members,
      why_start_club,
    } = body;

    // Validate required fields
    if (!applicant_name || typeof applicant_name !== 'string' || !applicant_name.trim()) {
      return NextResponse.json({ error: 'Your full name is required.' }, { status: 400 });
    }

    if (!applicant_email || typeof applicant_email !== 'string' || !applicant_email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    if (!applicant_phone || typeof applicant_phone !== 'string' || !applicant_phone.trim()) {
      return NextResponse.json({ error: 'Phone / WhatsApp contact is required.' }, { status: 400 });
    }

    if (!college_name || typeof college_name !== 'string' || !college_name.trim()) {
      return NextResponse.json({ error: 'College / University name is required.' }, { status: 400 });
    }

    if (!college_city || typeof college_city !== 'string' || !college_city.trim()) {
      return NextResponse.json({ error: 'College city is required.' }, { status: 400 });
    }

    if (!role_in_college || typeof role_in_college !== 'string' || !role_in_college.trim()) {
      return NextResponse.json({ error: 'Your role at college is required.' }, { status: 400 });
    }

    if (!why_start_club || typeof why_start_club !== 'string' || !why_start_club.trim()) {
      return NextResponse.json({ error: 'Please explain why you want to start a club.' }, { status: 400 });
    }

    const cleanData = {
      applicant_name: applicant_name.trim(),
      applicant_email: applicant_email.trim().toLowerCase(),
      applicant_phone: applicant_phone.trim(),
      college_name: college_name.trim(),
      college_city: college_city.trim(),
      college_state: (college_state || 'Maharashtra').trim(),
      role_in_college: role_in_college.trim(),
      academic_year: academic_year ? String(academic_year).trim() : null,
      club_name: club_name && typeof club_name === 'string' && club_name.trim()
        ? club_name.trim()
        : `Hacker's Unity @ ${college_name.trim()}`,
      expected_members: expected_members ? String(expected_members).trim() : '50-100',
      why_start_club: why_start_club.trim(),
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    const serverSupabase = createAdminClient();

    // 1. Primary insert: try inserting into club_applications table
    let insertResult = await serverSupabase
      .from('club_applications')
      .insert(cleanData)
      .select('id, created_at')
      .single();

    // 2. Resilience fallback: if club_applications table is not yet migrated in Supabase
    if (
      insertResult.error &&
      (insertResult.error.code === '42P01' ||
        insertResult.error.code === 'PGRST204' ||
        insertResult.error.message?.toLowerCase().includes('club_applications') ||
        insertResult.error.message?.toLowerCase().includes('schema cache'))
    ) {
      console.warn(
        '[Clubs API] club_applications table not yet active, falling back to contact_inquiries resilience store:',
        insertResult.error.message
      );

      const formattedNotes = [
        `=== NEW HACKER'S UNITY CLUB APPLICATION ===`,
        `Applicant: ${cleanData.applicant_name}`,
        `Email: ${cleanData.applicant_email}`,
        `Phone: ${cleanData.applicant_phone}`,
        `College: ${cleanData.college_name}`,
        `City/State: ${cleanData.college_city}, ${cleanData.college_state}`,
        `Role: ${cleanData.role_in_college} (${cleanData.academic_year || 'N/A'})`,
        `Proposed Club Name: ${cleanData.club_name}`,
        `Expected Members: ${cleanData.expected_members}`,
        `Vision & Plan:`,
        cleanData.why_start_club,
      ].join('\n');

      const fallback = await serverSupabase
        .from('contact_inquiries')
        .insert({
          name: cleanData.applicant_name,
          email: cleanData.applicant_email,
          phone: cleanData.applicant_phone,
          inquiry_type: 'host',
          subject: `New Club Application: ${cleanData.club_name}`,
          message: formattedNotes,
          status: 'PENDING',
          created_at: new Date().toISOString(),
        })
        .select('id, created_at')
        .single();

      insertResult = fallback;
    }

    if (insertResult.error) {
      console.error('[Clubs API] Database insert failed:', insertResult.error);
      return NextResponse.json(
        { error: 'Failed to submit application. Please try again or contact us directly.' },
        { status: 500 }
      );
    }

    // Broadcast event for real-time admin monitoring
    try {
      const channel = serverSupabase.channel('public:admin_inquiries');
      await channel.send({
        type: 'broadcast',
        event: 'club_application_created',
        payload: {
          id: insertResult.data?.id || 'new',
          college: cleanData.college_name,
          applicant: cleanData.applicant_name,
          email: cleanData.applicant_email,
          createdAt: new Date().toISOString(),
        },
      });
    } catch (e) {
      console.error('[Clubs API] Broadcast error (non-fatal):', e);
    }

    return NextResponse.json({
      success: true,
      message: "Club application received! Our team will contact you within 48 hours to onboard your college chapter.",
      applicationId: insertResult.data?.id,
    });
  } catch (error: any) {
    console.error('[Clubs API] Unhandled server error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
