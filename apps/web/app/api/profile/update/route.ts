import { NextResponse } from 'next/server';
import {
  authenticateRequest,
  createAdminClient,
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/api-auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

export async function POST(req: Request) {
  try {
    // 1. Authenticate the caller
    const auth = await authenticateRequest();
    if (!auth) {
      return unauthorizedResponse('You must be logged in to update your profile.');
    }

    const body = await req.json();
    const {
      userId,
      username,
      name,
      phone,
      bio,
      college,
      organization,
      company,
      graduationYear,
      degree,
      branch,
      professionType,
      jobTitle,
      experienceYears,
      industry,
      skills,
      avatarUrl,
      bannerUrl,
      socialLinks,
      bankDetails,
    } = body;

    // 2. Prevent IDOR: ensure user can only modify their own profile
    if (userId && userId !== auth.userId) {
      return forbiddenResponse('You are not authorized to update another user\'s profile.');
    }

    const effectiveUserId = auth.userId;
    const supabaseAdmin = createAdminClient();

    // 2.5. Sanitize and validate username if provided
    let cleanUsername: string | null = null;
    if (username !== undefined && username !== null) {
      const trimmed = String(username).trim().toLowerCase().replace(/^@/, '');
      if (trimmed.length > 0) {
        if (!/^[a-z0-9_-]{3,30}$/.test(trimmed)) {
          return NextResponse.json(
            { error: 'Username must be 3-30 characters and contain only letters, numbers, underscores, or hyphens.' },
            { status: 400 }
          );
        }
        // Check uniqueness in profiles table
        try {
          const { data: existingUser } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('username', trimmed)
            .neq('id', effectiveUserId)
            .maybeSingle();

          if (existingUser) {
            return NextResponse.json(
              { error: `@${trimmed} is already taken. Please choose another username.` },
              { status: 400 }
            );
          }
        } catch (checkErr) {
          // Continue if column not created yet
          console.warn('[Profile Update] Username uniqueness check warning:', checkErr);
        }
        cleanUsername = trimmed;
      }
    }

    let finalAvatarUrl: string | null = avatarUrl || null;
    let finalBannerUrl: string | null = bannerUrl || null;

    // 3. Process Avatar Image Upload to Supabase Storage if base64 data URL
    if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.startsWith('data:image/')) {
      try {
        const matches = avatarUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1] || 'image/jpeg';
          const buffer = Buffer.from(matches[2], 'base64');
          const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
          const filePath = `profiles/${effectiveUserId}/avatar.${ext}`;

          const { error: uploadError } = await supabaseAdmin.storage
            .from('hackathon-assets')
            .upload(filePath, buffer, {
              contentType,
              upsert: true,
            });

          if (!uploadError) {
            finalAvatarUrl = `${supabaseUrl}/storage/v1/object/public/hackathon-assets/${filePath}?t=${Date.now()}`;
          } else {
            console.warn('[Profile Update] Avatar storage upload warning:', uploadError);
          }
        }
      } catch (uploadErr) {
        console.warn('[Profile Update] Avatar upload exception:', uploadErr);
      }
    }

    // 4. Process Banner Image Upload to Supabase Storage if base64 data URL
    if (bannerUrl && typeof bannerUrl === 'string' && bannerUrl.startsWith('data:image/')) {
      try {
        const matches = bannerUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const contentType = matches[1] || 'image/jpeg';
          const buffer = Buffer.from(matches[2], 'base64');
          const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
          const filePath = `profiles/${effectiveUserId}/banner.${ext}`;

          const { error: uploadError } = await supabaseAdmin.storage
            .from('hackathon-assets')
            .upload(filePath, buffer, {
              contentType,
              upsert: true,
            });

          if (!uploadError) {
            finalBannerUrl = `${supabaseUrl}/storage/v1/object/public/hackathon-assets/${filePath}?t=${Date.now()}`;
          } else {
            console.warn('[Profile Update] Banner storage upload warning:', uploadError);
          }
        }
      } catch (uploadErr) {
        console.warn('[Profile Update] Banner upload exception:', uploadErr);
      }
    }

    const cleanName = name ? String(name).trim() : undefined;
    const cleanPhone = phone ? String(phone).trim() : null;
    const cleanBio = bio ? String(bio).trim() : null;
    const cleanCollege = college ? String(college).trim() : null;
    const cleanOrg = organization ? String(organization).trim() : (company ? String(company).trim() : null);
    const cleanCompany = company ? String(company).trim() : null;
    const cleanGradYear = graduationYear ? Number(graduationYear) : 2026;
    const cleanDegree = degree ? String(degree).trim() : null;
    const cleanBranch = branch ? String(branch).trim() : null;
    const cleanProfessionType = professionType || 'STUDENT';
    const cleanJobTitle = jobTitle ? String(jobTitle).trim() : null;
    const cleanExpYears = experienceYears ? String(experienceYears).trim() : null;
    const cleanIndustry = industry ? String(industry).trim() : null;
    const cleanSkills = Array.isArray(skills) ? skills : [];

    const cleanGithub = socialLinks?.github ? String(socialLinks.github).trim() : null;
    const cleanLinkedin = socialLinks?.linkedin ? String(socialLinks.linkedin).trim() : null;
    const cleanPortfolio = socialLinks?.portfolio ? String(socialLinks.portfolio).trim() : null;

    const cleanBankDetails = bankDetails !== undefined ? (bankDetails ? {
      accountHolderName: bankDetails.accountHolderName ? String(bankDetails.accountHolderName).trim() : null,
      bankName: bankDetails.bankName ? String(bankDetails.bankName).trim() : null,
      accountNumber: bankDetails.accountNumber ? String(bankDetails.accountNumber).trim() : null,
      ifscCode: bankDetails.ifscCode ? String(bankDetails.ifscCode).trim().toUpperCase() : null,
      accountType: bankDetails.accountType || 'SAVINGS',
      upiId: bankDetails.upiId ? String(bankDetails.upiId).trim().toLowerCase() : null,
      verified: Boolean(bankDetails.verified),
      updatedAt: new Date().toISOString(),
    } : null) : undefined;

    // 5. Fetch existing user info from Supabase Auth
    let userEmail = auth.email;
    let existingMeta: Record<string, any> = auth.user.user_metadata || {};

    try {
      const { data: userRes } = await supabaseAdmin.auth.admin.getUserById(effectiveUserId);
      if (userRes?.user) {
        if (!userEmail) userEmail = userRes.user.email || '';
        existingMeta = userRes.user.user_metadata || {};
      }
    } catch (authFetchErr) {
      console.warn('[Profile Update] Auth fetch warning:', authFetchErr);
    }

    // 6. Upsert to Postgres `profiles` table
    const profileUpdateData: Record<string, any> = {
      id: effectiveUserId,
      updated_at: new Date().toISOString(),
    };
    if (userEmail) profileUpdateData.email = userEmail;
    if (cleanUsername !== null) profileUpdateData.username = cleanUsername;
    if (cleanName !== undefined) profileUpdateData.name = cleanName;
    if (cleanCollege !== undefined) profileUpdateData.college = cleanCollege;
    if (cleanOrg !== undefined) profileUpdateData.organization = cleanOrg;
    if (cleanBio !== undefined) profileUpdateData.bio = cleanBio;
    if (cleanSkills !== undefined) profileUpdateData.skills = cleanSkills;
    if (finalAvatarUrl !== undefined) profileUpdateData.avatar_url = finalAvatarUrl;
    if (finalBannerUrl !== undefined) profileUpdateData.banner_url = finalBannerUrl;
    if (cleanGithub !== undefined) profileUpdateData.github_url = cleanGithub;
    if (cleanLinkedin !== undefined) profileUpdateData.linkedin_url = cleanLinkedin;
    if (cleanPortfolio !== undefined) profileUpdateData.portfolio_url = cleanPortfolio;
    if (cleanBankDetails !== undefined) profileUpdateData.bank_details = cleanBankDetails;

    try {
      const { error: profileDbError } = await supabaseAdmin
        .from('profiles')
        .upsert(profileUpdateData, { onConflict: 'id' });

      if (profileDbError) {
        console.warn('[Profile Update] Database profiles upsert warning:', profileDbError);
        // Fallback: If unknown column error occurs in Postgres, retry without unmigrated columns
        if ((profileDbError as any).code === '42703') {
          const fallbackData = { ...profileUpdateData };
          delete fallbackData.username;
          delete fallbackData.bank_details;
          await supabaseAdmin.from('profiles').upsert(fallbackData, { onConflict: 'id' });
        }
      }
    } catch (dbErr) {
      console.warn('[Profile Update] DB upsert exception:', dbErr);
    }

    // 7. Update Supabase Auth user_metadata
    try {
      await supabaseAdmin.auth.admin.updateUserById(effectiveUserId, {
        user_metadata: {
          ...existingMeta,
          username: cleanUsername || existingMeta.username,
          name: cleanName || existingMeta.name,
          full_name: cleanName || existingMeta.full_name,
          phone: cleanPhone !== null ? cleanPhone : existingMeta.phone,
          bio: cleanBio !== null ? cleanBio : existingMeta.bio,
          college: cleanCollege !== null ? cleanCollege : existingMeta.college,
          organization: cleanOrg !== null ? cleanOrg : existingMeta.organization,
          company: cleanCompany !== null ? cleanCompany : existingMeta.company,
          graduation_year: cleanGradYear,
          degree: cleanDegree !== null ? cleanDegree : existingMeta.degree,
          branch: cleanBranch !== null ? cleanBranch : existingMeta.branch,
          profession_type: cleanProfessionType,
          job_title: cleanJobTitle !== null ? cleanJobTitle : existingMeta.job_title,
          experience_years: cleanExpYears !== null ? cleanExpYears : existingMeta.experience_years,
          industry: cleanIndustry !== null ? cleanIndustry : existingMeta.industry,
          skills: cleanSkills,
          avatar_url: finalAvatarUrl || existingMeta.avatar_url,
          banner_url: finalBannerUrl !== null ? finalBannerUrl : (existingMeta.banner_url || null),
          github_url: cleanGithub !== null ? cleanGithub : existingMeta.github_url,
          linkedin_url: cleanLinkedin !== null ? cleanLinkedin : existingMeta.linkedin_url,
          portfolio_url: cleanPortfolio !== null ? cleanPortfolio : existingMeta.portfolio_url,
          bank_details: cleanBankDetails !== undefined ? cleanBankDetails : existingMeta.bank_details,
        },
      });
    } catch (authMetaErr) {
      console.warn('[Profile Update] Auth metadata update exception:', authMetaErr);
    }

    return NextResponse.json({
      success: true,
      username: cleanUsername,
      avatarUrl: finalAvatarUrl,
      bannerUrl: finalBannerUrl,
    });
  } catch (err: any) {
    console.error('[Profile Update Route Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
