import { NextResponse } from 'next/server';
import {
  createAdminClient,
  rateLimitedResponse,
} from '@/lib/api-auth';
import { checkRateLimit, getClientIp, SIGNUP_RATE_LIMIT } from '@/lib/rate-limit';
import { validatePassword } from '@/lib/password-validation';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    // 1. Rate limiting
    const clientIp = getClientIp(req);
    const rateLimit = checkRateLimit(clientIp, SIGNUP_RATE_LIMIT);
    if (!rateLimit.allowed) {
      return rateLimitedResponse(rateLimit.resetInMs);
    }

    const body = await req.json();
    // SELINE: removed role
    const { email, password, name, phone } = body;

    // 2. Validate presence
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPassword = String(password);
    const cleanName = String(name || '').trim() || cleanEmail.split('@')[0];
    const cleanPhone = phone ? String(phone).trim() : null;

    // SELINE: removed or statement to strictly be participant only
    const cleanRole = 'PARTICIPANT';

    // 3. Validate email format
    if (!EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // 4. Validate password complexity
    const passwordValidation = validatePassword(cleanPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          error: passwordValidation.errors.join('. '),
          details: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // 5. Check if user already exists — PREVENT ACCOUNT TAKEOVER
    const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      console.error('[Signup API] Error checking existing users:', listError);
      return NextResponse.json(
        { error: 'Failed to verify account availability. Please try again later.' },
        { status: 500 }
      );
    }

    const existingUser = usersData?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (existingUser) {
      // Return 409 Conflict without overwriting existing credentials
      return NextResponse.json(
        { error: 'An account with this email already exists. Please log in or reset your password.' },
        { status: 409 }
      );
    }

    // 6. Create new user with email verification requirement
    const shouldAutoConfirm = process.env.AUTO_CONFIRM_EMAIL === 'true';

    // SELINE: removed role: cleanRole as it is NOT A MODIFIABLE FIELD BY EXTERNAL USERS
    const { data: createData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: cleanPassword,
        email_confirm: shouldAutoConfirm,
        user_metadata: {
          name: cleanName,
          full_name: cleanName,
          phone: cleanPhone,
        },
      });

    if (createError) {
      return NextResponse.json(
        { error: createError.message },
        { status: 400 }
      );
    }

    if (!createData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account.' },
        { status: 500 }
      );
    }

    const userId = createData.user.id;

    // 7. Upsert profile in `profiles` table
    try {
      await supabaseAdmin.from('profiles').upsert(
        {
          id: userId,
          email: cleanEmail,
          name: cleanName,
          phone: cleanPhone,
          role: cleanRole,
        },
        { onConflict: 'id' }
      );
    } catch (profileErr) {
      console.warn('[Signup API] Profile upsert warning:', profileErr);
    }

    return NextResponse.json({
      success: true,
      needsEmailConfirmation: !shouldAutoConfirm,
      message: shouldAutoConfirm
        ? 'Account created successfully!'
        : 'Account created! Please check your email to verify your account before logging in.',
      userId,
    });
  } catch (err: any) {
    console.error('[Signup API Error]:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error during registration.' },
      { status: 500 }
    );
  }
}
