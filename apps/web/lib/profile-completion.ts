import { UserPublic } from '@hackers-unity/shared-types';

export interface ProfileCompletionItem {
  id: string;
  label: string;
  category: 'basic' | 'education' | 'skills' | 'socials';
  tab: 'profile' | 'socials';
  points: number;
  completed: boolean;
}

export interface ProfileCategoryScore {
  score: number;
  max: number;
  completed: boolean;
  label: string;
}

export interface ProfileCompletionResult {
  percentage: number;
  isComplete: boolean;
  score: number;
  total: number;
  completedCount: number;
  totalCount: number;
  missingItems: ProfileCompletionItem[];
  completedItems: ProfileCompletionItem[];
  categories: {
    basic: ProfileCategoryScore;
    education: ProfileCategoryScore;
    skills: ProfileCategoryScore;
    socials: ProfileCategoryScore;
  };
  completionDate?: string;
  certificateId: string;
}

export interface ProfileFormFields {
  name?: string | null;
  username?: string | null;
  phone?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  professionType?: string | null;
  college?: string | null;
  degree?: string | null;
  branch?: string | null;
  graduationYear?: number | string | null;
  company?: string | null;
  jobTitle?: string | null;
  experienceYears?: string | null;
  industry?: string | null;
  skills?: string[] | null;
  socialLinks?: {
    github?: string | null;
    linkedin?: string | null;
    portfolio?: string | null;
    twitter?: string | null;
  } | null;
  profileCompletedAt?: string | null;
  certificateId?: string | null;
}

/**
 * Generate a clean, verifiable certificate ID
 */
export function generateCertificateId(userId?: string | null): string {
  const year = new Date().getFullYear();
  if (userId && userId.length >= 6) {
    const clean = userId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const suffix = clean.slice(-6).padEnd(6, 'X');
    return `HU-${year}-${suffix}`;
  }
  return `HU-${year}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/**
 * Calculate profile completion percentage and check if 100% complete for Certificate of Completion.
 * 
 * Criteria (100% total):
 * 1. Basic Information (25%):
 *    - Full Name (5%)
 *    - Public Username (5%)
 *    - Mobile Phone (5%)
 *    - Bio / About (5%)
 *    - Avatar Photo (5%)
 * 2. Education & Experience (25%):
 *    - Profession Type selection (5%)
 *    - Student: College (8%), Degree (6%), Branch (6%)
 *    - Professional: Company (8%), Job Title (6%), Experience & Industry (6%)
 *    - Freelancer: Domain/Title (8%), Experience Level (6%), Focus Area (6%)
 * 3. Skills (25%):
 *    - 3+ technical skills added (1 skill = 10%, 2 skills = 18%, 3+ skills = 25%)
 * 4. Socials & Proof of Work (25%):
 *    - GitHub link/handle (10%)
 *    - LinkedIn link/handle (10%)
 *    - Portfolio or Website URL (5%)
 */
export function calculateProfileCompletion(
  data: Partial<UserPublic> | ProfileFormFields | null | undefined
): ProfileCompletionResult {
  if (!data) {
    return {
      percentage: 0,
      isComplete: false,
      score: 0,
      total: 100,
      completedCount: 0,
      totalCount: 0,
      missingItems: [],
      completedItems: [],
      categories: {
        basic: { score: 0, max: 25, completed: false, label: 'Basic Info' },
        education: { score: 0, max: 25, completed: false, label: 'Education & Career' },
        skills: { score: 0, max: 25, completed: false, label: 'Skills' },
        socials: { score: 0, max: 25, completed: false, label: 'Socials & Portfolio' },
      },
      certificateId: generateCertificateId(),
    };
  }

  const items: ProfileCompletionItem[] = [];

  // ─── 1. Basic Information (25 points) ──────────────────────────
  const hasName = Boolean(data.name && data.name.trim().length >= 2);
  items.push({
    id: 'name',
    label: 'Full Name',
    category: 'basic',
    tab: 'profile',
    points: 5,
    completed: hasName,
  });

  const hasUsername = Boolean(data.username && data.username.trim().replace(/^@/, '').length >= 3);
  items.push({
    id: 'username',
    label: 'Public Username (@handle)',
    category: 'basic',
    tab: 'profile',
    points: 5,
    completed: hasUsername,
  });

  const hasPhone = Boolean(data.phone && data.phone.trim().replace(/\s+/g, '').length >= 8);
  items.push({
    id: 'phone',
    label: 'Phone Number',
    category: 'basic',
    tab: 'profile',
    points: 5,
    completed: hasPhone,
  });

  const hasBio = Boolean(data.bio && data.bio.trim().length >= 5);
  items.push({
    id: 'bio',
    label: 'Bio / About You',
    category: 'basic',
    tab: 'profile',
    points: 5,
    completed: hasBio,
  });

  const hasAvatar = Boolean(
    data.avatarUrl &&
    (data.avatarUrl.startsWith('http') ||
      data.avatarUrl.startsWith('data:') ||
      (data.avatarUrl.length > 2 && data.avatarUrl !== '⚡'))
  );
  items.push({
    id: 'avatar',
    label: 'Profile Photo / Avatar',
    category: 'basic',
    tab: 'profile',
    points: 5,
    completed: hasAvatar,
  });

  // ─── 2. Education & Experience (25 points) ──────────────────────
  const profession = (data.professionType || 'STUDENT').toUpperCase();
  items.push({
    id: 'professionType',
    label: 'Profession Type',
    category: 'education',
    tab: 'profile',
    points: 5,
    completed: Boolean(data.professionType),
  });

  if (profession === 'PROFESSIONAL') {
    const hasCompany = Boolean((data.company || (data as any).organization) && (data.company || (data as any).organization)!.trim().length >= 2);
    items.push({
      id: 'company',
      label: 'Company / Organization',
      category: 'education',
      tab: 'profile',
      points: 8,
      completed: hasCompany,
    });

    const hasJobTitle = Boolean(data.jobTitle && data.jobTitle.trim().length >= 2);
    items.push({
      id: 'jobTitle',
      label: 'Current Job Title',
      category: 'education',
      tab: 'profile',
      points: 6,
      completed: hasJobTitle,
    });

    const hasExpOrInd = Boolean(
      (data.experienceYears && data.experienceYears.trim().length > 0) ||
      (data.industry && data.industry.trim().length > 0)
    );
    items.push({
      id: 'experienceYears',
      label: 'Experience & Industry',
      category: 'education',
      tab: 'profile',
      points: 6,
      completed: hasExpOrInd,
    });
  } else if (profession === 'FREELANCER') {
    const hasTitle = Boolean(data.jobTitle && data.jobTitle.trim().length >= 2);
    items.push({
      id: 'jobTitle',
      label: 'Freelance Title / Role',
      category: 'education',
      tab: 'profile',
      points: 8,
      completed: hasTitle,
    });

    const hasLevel = Boolean(data.experienceYears && data.experienceYears.trim().length > 0);
    items.push({
      id: 'experienceYears',
      label: 'Experience Level',
      category: 'education',
      tab: 'profile',
      points: 6,
      completed: hasLevel,
    });

    const hasDomain = Boolean((data.industry || data.bio) && ((data.industry || '').trim().length > 0 || (data.bio || '').trim().length >= 10));
    items.push({
      id: 'industry',
      label: 'Primary Domain / Specialization',
      category: 'education',
      tab: 'profile',
      points: 6,
      completed: hasDomain,
    });
  } else {
    // Default: STUDENT
    const hasCollege = Boolean(data.college && data.college.trim().length >= 2);
    items.push({
      id: 'college',
      label: 'College / University',
      category: 'education',
      tab: 'profile',
      points: 8,
      completed: hasCollege,
    });

    const hasDegree = Boolean(data.degree && data.degree.trim().length >= 2);
    items.push({
      id: 'degree',
      label: 'Degree',
      category: 'education',
      tab: 'profile',
      points: 6,
      completed: hasDegree,
    });

    const hasBranch = Boolean(data.branch && data.branch.trim().length >= 2);
    items.push({
      id: 'branch',
      label: 'Branch / Stream',
      category: 'education',
      tab: 'profile',
      points: 6,
      completed: hasBranch,
    });
  }

  // ─── 3. Skills (25 points) ──────────────────────────────────────
  const skillCount = Array.isArray(data.skills) ? data.skills.length : 0;
  const skillsScore = skillCount >= 3 ? 25 : skillCount === 2 ? 18 : skillCount === 1 ? 10 : 0;
  items.push({
    id: 'skills',
    label: 'Technical Skills (at least 3)',
    category: 'skills',
    tab: 'profile',
    points: 25,
    completed: skillCount >= 3,
  });

  // ─── 4. Socials & Proof of Work (25 points) ─────────────────────
  const socials = data.socialLinks || {};
  const hasGithub = Boolean(socials.github && socials.github.trim().length >= 2);
  items.push({
    id: 'github',
    label: 'GitHub Profile',
    category: 'socials',
    tab: 'socials',
    points: 10,
    completed: hasGithub,
  });

  const hasLinkedin = Boolean(socials.linkedin && socials.linkedin.trim().length >= 2);
  items.push({
    id: 'linkedin',
    label: 'LinkedIn Profile',
    category: 'socials',
    tab: 'socials',
    points: 10,
    completed: hasLinkedin,
  });

  const hasPortfolio = Boolean(
    (socials.portfolio && socials.portfolio.trim().length >= 2) ||
    (socials.twitter && socials.twitter.trim().length >= 2)
  );
  items.push({
    id: 'portfolio',
    label: 'Personal Website or Portfolio',
    category: 'socials',
    tab: 'socials',
    points: 5,
    completed: hasPortfolio,
  });

  // Calculate scores per category
  const categories = {
    basic: { score: 0, max: 25, completed: false, label: 'Basic Info' },
    education: { score: 0, max: 25, completed: false, label: 'Education & Career' },
    skills: { score: skillsScore, max: 25, completed: skillCount >= 3, label: 'Skills' },
    socials: { score: 0, max: 25, completed: false, label: 'Socials & Portfolio' },
  };

  items.forEach((item) => {
    if (item.category === 'skills') return; // Handled dynamically above
    if (item.completed) {
      categories[item.category].score += item.points;
    }
  });

  categories.basic.completed = categories.basic.score >= categories.basic.max;
  categories.education.completed = categories.education.score >= categories.education.max;
  categories.socials.completed = categories.socials.score >= categories.socials.max;

  const totalScore =
    categories.basic.score +
    categories.education.score +
    categories.skills.score +
    categories.socials.score;

  const percentage = Math.min(100, Math.max(0, Math.round(totalScore)));
  const isComplete = percentage === 100;

  const missingItems = items.filter((i) => !i.completed);
  const completedItems = items.filter((i) => i.completed);

  const certId =
    data.certificateId ||
    ((data as any).id ? generateCertificateId((data as any).id) : generateCertificateId());

  return {
    percentage,
    isComplete,
    score: totalScore,
    total: 100,
    completedCount: completedItems.length,
    totalCount: items.length,
    missingItems,
    completedItems,
    categories,
    completionDate: data.profileCompletedAt || (isComplete ? new Date().toISOString() : undefined),
    certificateId: certId,
  };
}
