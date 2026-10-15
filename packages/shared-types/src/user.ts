import { UserRole } from './auth';

// ─── User types ──────────────────────────────────────────

export interface UserPublic {
  id: string;
  username?: string | null;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  college: string | null;
  organization: string | null;
  graduationYear: number | null;
  bio: string | null;
  avatarUrl: string | null;
  bannerUrl?: string | null;
  skills: string[];
  resumeUrl: string | null;
  socialLinks: SocialLinks | null;
  emailVerified: boolean;
  createdAt: string;
  // Dynamic Profession Fields
  professionType?: 'STUDENT' | 'PROFESSIONAL' | 'FREELANCER' | string;
  degree?: string | null;
  branch?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  experienceYears?: string | null;
  industry?: string | null;
  // Bank & Payout Details for Event Hosts
  bankDetails?: BankDetails | null;
}

export interface BankDetails {
  accountHolderName?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  accountType?: 'SAVINGS' | 'CURRENT' | string | null;
  upiId?: string | null;
  verified?: boolean;
  updatedAt?: string;
}

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  portfolio?: string;
  twitter?: string;
}

export interface UpdateProfileDto {
  username?: string;
  name?: string;
  phone?: string;
  college?: string;
  organization?: string;
  graduationYear?: number;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string | null;
  skills?: string[];
  socialLinks?: SocialLinks;
  // Dynamic Profession Fields
  professionType?: 'STUDENT' | 'PROFESSIONAL' | 'FREELANCER' | string;
  degree?: string;
  branch?: string;
  company?: string;
  jobTitle?: string;
  experienceYears?: string;
  industry?: string;
  // Bank & Payout Details
  bankDetails?: BankDetails | null;
}

// ─── Organizer Profile ───────────────────────────────────

export enum OrganizationType {
  COLLEGE = 'COLLEGE',
  COMPANY = 'COMPANY',
  COMMUNITY = 'COMMUNITY',
}

export interface OrganizerProfile {
  id: string;
  userId: string;
  organizationName: string;
  organizationType: OrganizationType;
  verified: boolean;
  logoUrl: string | null;
  description: string | null;
}
