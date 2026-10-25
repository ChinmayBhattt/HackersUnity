'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  User as UserIcon,
  Shield,
  KeyRound,
  Mail,
  Phone,
  GraduationCap,
  Building,
  Building2,
  Briefcase,
  Code2,
  BookOpen,
  Award,
  Laptop,
  Github,
  Linkedin,
  Globe,
  Plus,
  X as XIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  Bell,
  Radio,
  Sliders,
  ExternalLink,
  Sparkles,
  Lock,
  Compass,
  ArrowLeft,
  Smartphone,
  Trash2,
  Eye,
  Share2,
  ChevronDown,
  Search,
  Landmark,
  RotateCcw,
  Archive,
  Calendar,
  FileText,
  Users,
} from 'lucide-react';
import {
  getRecycleBinItems,
  restoreRecycleBinItem,
  permanentlyDeleteRecycleBinItem,
  clearRecycleBin,
  RecycledItem,
} from '@/lib/storage';
import { validatePassword } from '@/lib/password-validation';
import { useAuth } from '@/lib/auth-context';
import { AvatarUpload } from '@/components/avatar-upload';
import { BannerUpload } from '@/components/banner-upload';
import { AuthModal } from '@/components/auth-modal';
import { RichTextEditor } from '@/components/rich-text-editor';
import { PublicProfileModal } from '@/components/public-profile-modal';
import { ProfileCompletionWidget } from '@/components/certificate/ProfileCompletionWidget';
import { CertificateModal } from '@/components/certificate/CertificateModal';
import { calculateProfileCompletion } from '@/lib/profile-completion';

const POPULAR_DEGREES = [
  'B.Tech / B.E (Engineering)',
  'BCA (Computer Applications)',
  'MCA (Master of Computer Applications)',
  'B.Sc (Computer Science / IT)',
  'M.Sc (Computer Science / IT / AI)',
  'M.Tech / M.E',
  'B.Des / M.Des (Design / UI/UX)',
  'Diploma / Polytechnic',
  'Dual Degree (B.Tech + M.Tech)',
  'PhD / Research Scholar',
  'High School / K-12',
  'Bootcamp / Self-Taught',
  'Other',
];

const POPULAR_BRANCHES = [
  'Computer Science & Engineering (CSE)',
  'Artificial Intelligence & Data Science (AI/DS)',
  'Information Technology (IT)',
  'Electronics & Communication (ECE)',
  'Electrical & Electronics Engineering (EEE)',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical & Biotechnology Engineering',
  'Aerospace & Aeronautical Engineering',
  'Mechatronics & Robotics',
  'Design & Human-Computer Interaction',
  'Mathematics & Computing',
  'Physics & Applied Sciences',
  'Business Administration / Management',
  'Other',
];

const ALL_GRADUATION_YEARS = [
  '2018 or earlier',
  '2019',
  '2020',
  '2021',
  '2022',
  '2023',
  '2024',
  '2025',
  '2026',
  '2027',
  '2028',
  '2029',
  '2030',
  '2031',
  '2032+',
  'Other',
];

const POPULAR_INDUSTRIES = [
  'AI/ML, GenAI & Autonomous Systems',
  'FinTech, Payments & Web3 Blockchain',
  'SaaS, Cloud & Developer Infrastructure',
  'Cybersecurity & Privacy',
  'E-Commerce & Consumer Internet',
  'HealthTech & BioTech',
  'Gaming, AR/VR & Metaverse',
  'EdTech & Learning Platforms',
  'CleanTech, EV & Energy',
  'Other',
];

const POPULAR_FREELANCE_DOMAINS = [
  'Fullstack Web & AI (Next.js, Python, Supabase)',
  'Autonomous AI Agents, RAG & LLM Workflows',
  'Smart Contracts, Solidity & Web3 dApps',
  'Mobile Apps (Flutter, React Native, Swift)',
  'UI/UX Design Systems & Product Strategy',
  'DevOps, Kubernetes & Cloud Architecture',
  'Cybersecurity & Smart Contract Auditing',
  'Data Engineering & MLOps Pipelines',
  'Other',
];

const POPULAR_SKILLS = [
  // Frontend
  'React', 'Next.js', 'Vue.js', 'Angular', 'Svelte', 'HTML5', 'CSS3', 'Tailwind CSS',
  'TypeScript', 'JavaScript', 'jQuery', 'Bootstrap', 'Material UI', 'Chakra UI',
  'Framer Motion', 'Three.js', 'WebGL', 'SASS/SCSS',
  // Backend
  'Node.js', 'Express.js', 'Django', 'Flask', 'FastAPI', 'Spring Boot', 'Ruby on Rails',
  'Laravel', 'ASP.NET', 'NestJS', 'Hono', 'Go', 'Rust', 'PHP',
  // Databases
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Supabase', 'Firebase', 'DynamoDB',
  'Prisma', 'Drizzle ORM', 'SQLite', 'Cassandra', 'Neo4j',
  // Cloud & DevOps
  'AWS', 'Google Cloud', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD',
  'Vercel', 'Netlify', 'Cloudflare', 'Linux', 'Nginx', 'GitHub Actions',
  // AI/ML
  'Python', 'TensorFlow', 'PyTorch', 'OpenAI API', 'LangChain', 'Hugging Face',
  'RAG', 'LLM Fine-tuning', 'Computer Vision', 'NLP', 'Scikit-learn', 'Pandas',
  'NumPy', 'Jupyter', 'Stable Diffusion', 'CrewAI',
  // Mobile
  'React Native', 'Flutter', 'Swift', 'SwiftUI', 'Kotlin', 'Dart', 'Expo',
  // Web3 & Blockchain
  'Solidity', 'Ethereum', 'Web3.js', 'Hardhat', 'Foundry', 'IPFS', 'Rust (Solana)',
  // Design & Tools
  'Figma', 'Adobe XD', 'Photoshop', 'Illustrator', 'Blender', 'Canva',
  // Data & Analytics
  'Power BI', 'Tableau', 'Apache Spark', 'Kafka', 'Elasticsearch', 'GraphQL',
  'REST APIs', 'gRPC', 'WebSockets',
  // Programming Languages
  'C', 'C++', 'Java', 'C#', 'Scala', 'Elixir', 'Haskell', 'R', 'MATLAB',
  // Security
  'Cybersecurity', 'Penetration Testing', 'OWASP', 'Burp Suite', 'Wireshark',
  // Other
  'Git', 'Agile/Scrum', 'System Design', 'Data Structures', 'Algorithms',
  'Open Source', 'Technical Writing', 'Competitive Programming',
];

export default function SettingsPage() {
  const { user, supabaseUser, updateUserProfile, updateUserPassword, signOut, loading } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

  // Settings Tabs
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'socials' | 'notifications' | 'bank' | 'recycle_bin' | 'danger'>('profile');
  const [showPublicPreview, setShowPublicPreview] = useState(false);

  // Recycle Bin / Recovery States
  const [recycledItems, setRecycledItems] = useState<RecycledItem[]>([]);
  const [recycleFilter, setRecycleFilter] = useState<'ALL' | 'REGISTRATION' | 'EVENT' | 'SUBMISSION'>('ALL');
  const [recycleSearch, setRecycleSearch] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [recycleNotification, setRecycleNotification] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const formatDeletedDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  useEffect(() => {
    const loadRecycle = () => {
      setRecycledItems(getRecycleBinItems());
    };
    loadRecycle();
    window.addEventListener('hackers_unity_storage_change', loadRecycle);
    return () => window.removeEventListener('hackers_unity_storage_change', loadRecycle);
  }, []);

  const handleRestore = async (item: RecycledItem) => {
    setRestoringId(item.id);
    try {
      const ok = await restoreRecycleBinItem(item.id);
      if (ok) {
        setRecycleNotification({
          text: `Successfully restored "${item.title}"!`,
          type: 'success',
        });
        setRecycledItems(getRecycleBinItems());
      } else {
        setRecycleNotification({
          text: `Failed to restore "${item.title}".`,
          type: 'error',
        });
      }
    } catch (e: any) {
      setRecycleNotification({
        text: `Error restoring: ${e?.message || 'Unknown error'}`,
        type: 'error',
      });
    } finally {
      setRestoringId(null);
      setTimeout(() => setRecycleNotification(null), 4000);
    }
  };

  const handlePermanentDelete = (item: RecycledItem) => {
    if (confirm(`Permanently erase "${item.title}" from Recycle Bin? This cannot be undone.`)) {
      permanentlyDeleteRecycleBinItem(item.id);
      setRecycledItems(getRecycleBinItems());
      setRecycleNotification({
        text: `Permanently deleted "${item.title}".`,
        type: 'info',
      });
      setTimeout(() => setRecycleNotification(null), 3000);
    }
  };

  const handleEmptyRecycleBin = () => {
    clearRecycleBin();
    setRecycledItems([]);
    setRecycleNotification({
      text: 'Recycle Bin has been completely emptied.',
      type: 'info',
    });
    setTimeout(() => setRecycleNotification(null), 3000);
  };

  // Profile Form States
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [college, setCollege] = useState('');
  const [graduationYear, setGraduationYear] = useState('2026');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [skillsDropdownOpen, setSkillsDropdownOpen] = useState(false);
  const skillsDropdownRef = useRef<HTMLDivElement>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  // Dynamic Profession & Background States
  const [professionType, setProfessionType] = useState<'STUDENT' | 'PROFESSIONAL' | 'FREELANCER'>('STUDENT');

  // Student-specific fields
  const [degree, setDegree] = useState('B.Tech / B.E (Engineering)');
  const [customDegree, setCustomDegree] = useState('');
  const [branch, setBranch] = useState('Computer Science & Engineering (CSE)');
  const [customBranch, setCustomBranch] = useState('');
  const [customGradYear, setCustomGradYear] = useState('');
  const [studentId, setStudentId] = useState('');

  // Working Professional-specific fields
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [experienceYears, setExperienceYears] = useState('1-3 years');
  const [industry, setIndustry] = useState('AI/ML, GenAI & Autonomous Systems');
  const [customIndustry, setCustomIndustry] = useState('');

  // Freelancer-specific fields
  const [freelanceTitle, setFreelanceTitle] = useState('Full Stack AI Builder');
  const [freelanceLevel, setFreelanceLevel] = useState('Intermediate Builder');
  const [freelanceDomain, setFreelanceDomain] = useState('Fullstack Web & AI (Next.js, Python, Supabase)');
  const [customDomain, setCustomDomain] = useState('');

  // Social Links
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [portfolio, setPortfolio] = useState('');

  // Password / Security States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Notification Preferences
  const [notifyHostBroadcast, setNotifyHostBroadcast] = useState(true);
  const [notifyNewEvents, setNotifyNewEvents] = useState(true);
  const [notifyHackathons, setNotifyHackathons] = useState(true);
  const [notifyInvites, setNotifyInvites] = useState(true);
  const [notifyDigest, setNotifyDigest] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [notificationSaved, setNotificationSaved] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(null);

  // Bank & Payout Details States
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountType, setAccountType] = useState<'SAVINGS' | 'CURRENT'>('SAVINGS');
  const [upiId, setUpiId] = useState('');
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);

  // Status & Feedback
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || (user.email ? user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') : ''));
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setCollege(user.college || '');

      const userGradYear = user.graduationYear ? String(user.graduationYear) : '2026';
      if (ALL_GRADUATION_YEARS.includes(userGradYear)) {
        setGraduationYear(userGradYear);
      } else {
        setGraduationYear('Other');
        setCustomGradYear(userGradYear);
      }

      setSkills(user.skills && user.skills.length > 0 ? user.skills : ['Next.js 16', 'TypeScript', 'PostgreSQL']);
      setAvatar(user.avatarUrl || null);
      setBanner(user.bannerUrl || null);
      setGithub(user.socialLinks?.github || '');
      setLinkedin(user.socialLinks?.linkedin || '');
      setPortfolio(user.socialLinks?.portfolio || '');

      // Load dynamic profession fields
      if (user.professionType === 'PROFESSIONAL' || user.professionType === 'FREELANCER' || user.professionType === 'STUDENT') {
        setProfessionType(user.professionType);
      } else if (user.organization && !user.college) {
        setProfessionType('PROFESSIONAL');
      } else {
        setProfessionType('STUDENT');
      }

      const userDegree = user.degree || 'B.Tech / B.E (Engineering)';
      if (POPULAR_DEGREES.includes(userDegree)) {
        setDegree(userDegree);
      } else {
        setDegree('Other');
        setCustomDegree(userDegree);
      }

      const userBranch = user.branch || 'Computer Science & Engineering (CSE)';
      if (POPULAR_BRANCHES.includes(userBranch)) {
        setBranch(userBranch);
      } else {
        setBranch('Other');
        setCustomBranch(userBranch);
      }

      setCompany(user.company || user.organization || '');
      setJobTitle(user.jobTitle || '');
      setExperienceYears(user.experienceYears || '1-3 years');

      const userIndustry = user.industry || 'AI/ML, GenAI & Autonomous Systems';
      if (POPULAR_INDUSTRIES.includes(userIndustry)) {
        setIndustry(userIndustry);
      } else {
        setIndustry('Other');
        setCustomIndustry(userIndustry);
      }

      // Hydrate Bank Details
      if (user.bankDetails) {
        setAccountHolderName(user.bankDetails.accountHolderName || '');
        setBankName(user.bankDetails.bankName || '');
        setAccountNumber(user.bankDetails.accountNumber || '');
        setConfirmAccountNumber(user.bankDetails.accountNumber || '');
        setIfscCode(user.bankDetails.ifscCode || '');
        setAccountType((user.bankDetails.accountType as any) || 'SAVINGS');
        setUpiId(user.bankDetails.upiId || '');
      } else if (user.name) {
        setAccountHolderName((prev) => prev || user.name);
      }

      // Hydrate Notification Preferences
      const rawStoredPrefs = typeof window !== 'undefined' ? localStorage.getItem('hackers_unity_notification_prefs') : null;
      let storedPrefs: any = null;
      if (rawStoredPrefs) {
        try { storedPrefs = JSON.parse(rawStoredPrefs); } catch {}
      }
      const authPrefs = (user as any)?.notificationPreferences || (user as any)?.notification_preferences || (supabaseUser as any)?.user_metadata?.notification_preferences;
      const effectivePrefs = authPrefs || storedPrefs || {};

      if (effectivePrefs.notifyHostBroadcast !== undefined) {
        setNotifyHostBroadcast(Boolean(effectivePrefs.notifyHostBroadcast));
      }
      if (effectivePrefs.notifyNewEvents !== undefined) {
        setNotifyNewEvents(Boolean(effectivePrefs.notifyNewEvents));
      }
      if (effectivePrefs.notifyHackathons !== undefined) {
        setNotifyHackathons(Boolean(effectivePrefs.notifyHackathons));
      }
      if (effectivePrefs.notifyInvites !== undefined) {
        setNotifyInvites(Boolean(effectivePrefs.notifyInvites));
      }
      if (effectivePrefs.notifyDigest !== undefined) {
        setNotifyDigest(Boolean(effectivePrefs.notifyDigest));
      }
    }
  }, [user, supabaseUser]);

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    setNotificationError(null);
    try {
      const prefs = {
        notifyHostBroadcast,
        notifyNewEvents,
        notifyHackathons,
        notifyInvites,
        notifyDigest,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('hackers_unity_notification_prefs', JSON.stringify(prefs));
      }

      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationPreferences: prefs,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save notification preferences');
      }

      setNotificationSaved(true);
      setTimeout(() => setNotificationSaved(false), 3500);
    } catch (err: any) {
      setNotificationError(err.message || 'Network error');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  // Close skills dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (skillsDropdownRef.current && !skillsDropdownRef.current.contains(event.target as Node)) {
        setSkillsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddSkill = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const trimmed = newSkillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setNewSkillInput('');
    }
  };

  const handleSelectSkill = (skill: string) => {
    if (!skills.includes(skill)) {
      setSkills((prev) => [...prev, skill]);
    }
    setNewSkillInput('');
    setSkillsDropdownOpen(false);
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileError(null);
    setProfileSaved(false);

    const finalDegree = degree === 'Other' ? (customDegree.trim() || 'Other') : degree;
    const finalBranch = branch === 'Other' ? (customBranch.trim() || 'Other') : branch;
    const finalGradYear = graduationYear === 'Other' ? (Number(customGradYear) || 2026) : (Number(graduationYear.replace(/\D/g, '')) || 2026);
    const finalIndustry = industry === 'Other' ? (customIndustry.trim() || 'Other') : industry;
    const finalDomain = freelanceDomain === 'Other' ? (customDomain.trim() || 'Other') : freelanceDomain;

    const cleanUrl = (input: string, prefixDomain: string) => {
      const val = input.trim();
      if (!val) return '';
      if (val.startsWith('http://') || val.startsWith('https://')) return val;
      if (val.includes('.') || val.includes('/')) return `https://${val}`;
      if (prefixDomain) return `https://${prefixDomain}/${val.replace(/^@/, '')}`;
      return `https://${val}`;
    };

    const finalGithub = cleanUrl(github, 'github.com');
    const finalLinkedin = cleanUrl(linkedin, 'linkedin.com/in');
    const finalPortfolio = cleanUrl(portfolio, '');

    setGithub(finalGithub);
    setLinkedin(finalLinkedin);
    setPortfolio(finalPortfolio);

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (cleanUsername && !/^[a-z0-9_-]{3,30}$/.test(cleanUsername)) {
      setProfileError('Username must be 3-30 characters with lowercase letters, numbers, hyphens, or underscores.');
      setIsSavingProfile(false);
      return;
    }

    const profilePayload = {
      username: cleanUsername || undefined,
      name: name.trim() || undefined,
      phone: phone.trim() || undefined,
      bio: bio.trim() || undefined,
      professionType: professionType,
      college: professionType === 'STUDENT' ? college.trim() || undefined : undefined,
      organization: professionType === 'PROFESSIONAL' ? company.trim() || undefined : professionType === 'STUDENT' ? college.trim() || undefined : 'Independent',
      graduationYear: professionType === 'STUDENT' ? finalGradYear : undefined,
      degree: professionType === 'STUDENT' ? finalDegree : undefined,
      branch: professionType === 'STUDENT' ? finalBranch : undefined,
      company: professionType === 'PROFESSIONAL' ? company.trim() || undefined : undefined,
      jobTitle: professionType === 'PROFESSIONAL' ? jobTitle.trim() || undefined : professionType === 'FREELANCER' ? freelanceTitle.trim() || undefined : undefined,
      experienceYears: professionType === 'PROFESSIONAL' ? experienceYears : professionType === 'FREELANCER' ? freelanceLevel : undefined,
      industry: professionType === 'PROFESSIONAL' ? finalIndustry : professionType === 'FREELANCER' ? finalDomain : undefined,
      skills: skills,
      avatarUrl: avatar || undefined,
      bannerUrl: banner || null,
      socialLinks: {
        github: finalGithub,
        linkedin: finalLinkedin,
        portfolio: finalPortfolio,
      },
    };

    const completion = calculateProfileCompletion({
      ...profilePayload,
      id: user?.id,
      profileCompletedAt: user?.profileCompletedAt,
      certificateId: user?.certificateId,
    });

    let completedAt = user?.profileCompletedAt;
    let certId = user?.certificateId;
    const isNewlyComplete = completion.isComplete && !user?.profileCompletedAt;

    if (completion.isComplete) {
      if (!completedAt) {
        completedAt = new Date().toISOString();
      }
      if (!certId) {
        certId = completion.certificateId;
      }
    }

    const res = await updateUserProfile({
      ...profilePayload,
      profileCompletedAt: completedAt || undefined,
      certificateId: certId || undefined,
    });

    setIsSavingProfile(false);
    if (res.error) {
      setProfileError(res.error);
    } else {
      setProfileSaved(true);
      if (isNewlyComplete) {
        setShowCertificateModal(true);
      }
      setTimeout(() => setProfileSaved(false), 3000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setPasswordMsg({ type: 'error', text: validation.errors.join('. ') });
      return;
    }

    setIsUpdatingPassword(true);
    const res = await updateUserPassword(newPassword);
    setIsUpdatingPassword(false);

    if (res.error) {
      setPasswordMsg({ type: 'error', text: res.error });
    } else {
      setPasswordMsg({ type: 'success', text: 'Password successfully updated in your account!' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMsg(null), 3000);
    }
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBank(true);
    setBankError(null);
    setBankSaved(false);

    const cleanHolder = accountHolderName.trim();
    const cleanBank = bankName.trim();
    const cleanAcc = accountNumber.trim();
    const cleanConfirm = confirmAccountNumber.trim();
    const cleanIfsc = ifscCode.trim().toUpperCase();
    const cleanUpi = upiId.trim().toLowerCase();

    // Validation
    if (!cleanAcc && !cleanUpi) {
      setBankError('Please enter at least Bank Account details or a valid UPI ID for receiving payouts.');
      setIsSavingBank(false);
      return;
    }

    if (cleanAcc) {
      if (!cleanHolder) {
        setBankError('Account holder name is required for bank payouts.');
        setIsSavingBank(false);
        return;
      }
      if (cleanAcc !== cleanConfirm) {
        setBankError('Account number and Confirm Account number do not match.');
        setIsSavingBank(false);
        return;
      }
      if (cleanAcc.length < 8 || cleanAcc.length > 20) {
        setBankError('Please enter a valid bank account number (8 to 20 digits).');
        setIsSavingBank(false);
        return;
      }
      if (!cleanIfsc || cleanIfsc.length !== 11) {
        setBankError('IFSC code must be exactly 11 characters (e.g. HDFC0001234).');
        setIsSavingBank(false);
        return;
      }
    }

    if (cleanUpi && !cleanUpi.includes('@')) {
      setBankError('Please enter a valid UPI ID format (e.g. username@okhdfcbank or 9876543210@upi).');
      setIsSavingBank(false);
      return;
    }

    try {
      const res = await updateUserProfile({
        bankDetails: {
          accountHolderName: cleanHolder || null,
          bankName: cleanBank || null,
          accountNumber: cleanAcc || null,
          ifscCode: cleanIfsc || null,
          accountType: accountType,
          upiId: cleanUpi || null,
          verified: false,
          updatedAt: new Date().toISOString(),
        },
      });

      if (res?.error) {
        setBankError(res.error);
      } else {
        setBankSaved(true);
        setTimeout(() => setBankSaved(false), 4000);
      }
    } catch (err: any) {
      setBankError(err.message || 'Failed to save bank details.');
    } finally {
      setIsSavingBank(false);
    }
  };

  // If user is not logged in
  if (!loading && !user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center flex-1 flex flex-col items-center justify-center">
        <div className="w-20 h-20 rounded-3xl bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 flex items-center justify-center text-[#0099e6] mb-6 shadow-sm">
          <Shield className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Account & Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md">
          Sign in or create an account to manage your profile, security settings, social handles, and preferences.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <button
            onClick={() => setAuthOpen(true)}
            className="px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer"
          >
            Sign In / Register
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
          >
            Back to Home
          </Link>
        </div>
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </div>
    );
  }

  const currentFormState = {
    name,
    username,
    phone,
    bio,
    avatarUrl: avatar,
    professionType,
    college: professionType === 'STUDENT' ? college : undefined,
    degree: professionType === 'STUDENT' ? (degree === 'Other' ? customDegree : degree) : undefined,
    branch: professionType === 'STUDENT' ? (branch === 'Other' ? customBranch : branch) : undefined,
    graduationYear: professionType === 'STUDENT' ? (graduationYear === 'Other' ? customGradYear : graduationYear) : undefined,
    company: professionType === 'PROFESSIONAL' ? company : undefined,
    jobTitle: professionType === 'PROFESSIONAL' ? jobTitle : professionType === 'FREELANCER' ? freelanceTitle : undefined,
    experienceYears: professionType === 'PROFESSIONAL' ? experienceYears : professionType === 'FREELANCER' ? freelanceLevel : undefined,
    industry: professionType === 'PROFESSIONAL' ? (industry === 'Other' ? customIndustry : industry) : professionType === 'FREELANCER' ? (freelanceDomain === 'Other' ? customDomain : freelanceDomain) : undefined,
    skills,
    socialLinks: {
      github,
      linkedin,
      portfolio,
    },
    profileCompletedAt: user?.profileCompletedAt,
    certificateId: user?.certificateId,
  };

  const completionResult = calculateProfileCompletion({
    ...currentFormState,
    id: user?.id,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
      {/* Toast Notification */}
      {profileSaved && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-slate-950 text-white text-xs font-bold shadow-2xl border border-sky-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 backdrop-blur-xl">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold text-white">Profile Synchronized in Realtime!</div>
            <div className="text-[11px] text-slate-400 font-normal">All updates saved to Supabase cloud.</div>
          </div>
          <button
            onClick={() => setShowPublicPreview(true)}
            className="ml-2 px-3.5 py-1.5 rounded-xl bg-[#0099e6] hover:bg-sky-500 text-white text-[11px] font-black transition-all cursor-pointer whitespace-nowrap"
          >
            View Public Card
          </button>
        </div>
      )}

      {/* Header & Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-[#0099e6] dark:hover:text-[#0099e6] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Account & Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage your personal profile, credentials, public socials, avatar, and security preferences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {completionResult.isComplete && (
            <button
              type="button"
              onClick={() => setShowCertificateModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#0099e6] to-[#f58220] hover:opacity-95 active:scale-[0.98] text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-md shadow-orange-500/20 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Certificate of Completion</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-white text-[#f58220] font-mono">
                100%
              </span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowPublicPreview(true)}
            className="px-4 py-2.5 rounded-2xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 text-[#0099e6] dark:text-sky-400 border border-sky-200 dark:border-sky-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Public Profile</span>
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 dark:border dark:border-white/[0.08] text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <Compass className="w-4 h-4 text-[#0099e6]" />
            <span>Go to Analytics Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar Navigation (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-2">
            {/* User Mini Profile Badge with 100% Progress Border and Certificate Download */}
            <div className="mb-3">
              <ProfileCompletionWidget
                user={user}
                currentFormValues={currentFormState}
                onNavigateTab={(tab) => setActiveTab(tab)}
              />
            </div>

            {/* Nav Tabs */}
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'profile'
                ? 'bg-[#0099e6] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <UserIcon className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Profile Information</div>
                <div className={`text-[10px] font-normal ${activeTab === 'profile' ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                  Avatar, bio, college & skills
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('socials')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'socials'
                ? 'bg-[#0099e6] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Globe className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Socials & Portfolio</div>
                <div className={`text-[10px] font-normal ${activeTab === 'socials' ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                  GitHub, LinkedIn, Website
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'security'
                ? 'bg-[#0099e6] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Lock className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Security & Password</div>
                <div className={`text-[10px] font-normal ${activeTab === 'security' ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                  Password & 2FA credentials
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('notifications')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'notifications'
                ? 'bg-[#0099e6] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Bell className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Notification Alerts</div>
                <div className={`text-[10px] font-normal ${activeTab === 'notifications' ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                  Email & team invite updates
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('bank')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'bank'
                ? 'bg-[#0099e6] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Landmark className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Add Bank Details</div>
                <div className={`text-[10px] font-normal ${activeTab === 'bank' ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
                  Host revenue & payouts
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('recycle_bin')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'recycle_bin'
                ? 'bg-[#0099e6] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span>Recycle Bin</span>
                  {recycledItems.length > 0 && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        activeTab === 'recycle_bin'
                          ? 'bg-white/20 text-white'
                          : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40'
                      }`}
                    >
                      {recycledItems.length}
                    </span>
                  )}
                </div>
                <div
                  className={`text-[10px] font-normal ${
                    activeTab === 'recycle_bin' ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'
                  }`}
                >
                  Restore events, registrations & submissions
                </div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('danger')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${activeTab === 'danger'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10'
                }`}
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Account Management</div>
                <div className={`text-[10px] font-normal ${activeTab === 'danger' ? 'text-white/80' : 'text-rose-400 dark:text-rose-500'}`}>
                  Sign out & account actions
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Right Content Area (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* 1. Tab: Profile Information */}
          {activeTab === 'profile' && (
            <div className="p-7 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 dark:border-white/[0.06] pb-4">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-[#0099e6]" />
                  <span>Public Profile Information</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  This info is displayed to organizers and teammates when you register or form squads.
                </p>
              </div>

              {/* 100% Certificate Unlocked Banner */}
              {completionResult.isComplete && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-500/10 via-amber-500/10 to-orange-500/10 border border-orange-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#0099e6] to-[#f58220] text-white flex items-center justify-center shrink-0 shadow-md shadow-orange-500/20">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Profile 100% Complete!</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#f58220] text-white">Verified</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Your official Certificate of Completion is unlocked and ready to download.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCertificateModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0099e6] to-[#f58220] hover:opacity-95 active:scale-[0.98] text-white text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-orange-500/20 cursor-pointer whitespace-nowrap"
                  >
                    <Award className="w-4 h-4" />
                    <span>View & Download Certificate</span>
                  </button>
                </div>
              )}

              {profileError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Profile Cover Banner */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Profile Cover Banner & Theme
                  </label>
                  <BannerUpload
                    currentBanner={banner}
                    onBannerChange={(newBanner) => setBanner(newBanner)}
                    onBannerRemove={() => setBanner(null)}
                  />
                </div>

                {/* Avatar Uploader */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                    Profile Photo / Logo
                  </label>
                  <AvatarUpload
                    currentAvatar={avatar}
                    onAvatarChange={(newUrl) => setAvatar(newUrl)}
                    onAvatarRemove={() => setAvatar(null)}
                  />
                </div>

                {/* Username (@handle) & Public Profile Link */}
                <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-500/[0.05] border border-sky-100 dark:border-sky-500/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Public Username (@handle) *
                    </label>
                    {username && (
                      <Link
                        href={`/profile/${username.toLowerCase().replace(/^@/, '')}`}
                        target="_blank"
                        className="text-[11px] font-bold text-[#0099e6] hover:underline flex items-center gap-1"
                      >
                        Preview Profile <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#0099e6]">
                      @
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '');
                        setUsername(val);
                      }}
                      placeholder="e.g. chinmaybhatt"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 block">
                    Your public URL:{' '}
                    <span className="font-mono text-[#0099e6]">
                      hackersunity.com/profile/{username || 'your-handle'}
                    </span>
                  </span>
                </div>

                {/* Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Full Name *</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        placeholder="e.g. Chinmay Bhatt"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                      />
                    </div>
                  </div>
                </div>

                {/* Email (Readonly) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] text-xs font-semibold text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Primary login email address cannot be modified directly.</span>
                </div>

                {/* Bio / Summary with Rich Text Toolbar */}
                <RichTextEditor
                  label="Short Bio & Specialties"
                  value={bio}
                  onChange={(val) => setBio(val)}
                  rows={4}
                  placeholder="Tell hackathon organizers and squads what you love building (supports **bold**, *italic*, bullets, headings)..."
                  helperText="Use toolbar or markdown syntax for formatting"
                />

                {/* ═══ Dynamic Profession Selector ═══ */}
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                      Current Occupation / Status *
                    </label>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500">
                      Select your current role so squads and hackathon organizers can discover your background.
                    </span>
                  </div>

                  {/* 3 Profession Toggle Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Student Card */}
                    <button
                      type="button"
                      onClick={() => setProfessionType('STUDENT')}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${professionType === 'STUDENT'
                        ? 'border-[#0099e6] bg-sky-50/60 dark:bg-sky-500/10 shadow-xs ring-2 ring-[#0099e6]/20'
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/20'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-xl ${professionType === 'STUDENT' ? 'bg-[#0099e6] text-white' : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'}`}>
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        {professionType === 'STUDENT' && (
                          <span className="px-2 py-0.5 rounded-full bg-[#0099e6] text-white text-[9px] font-extrabold uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white">Student / Learner</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                          College / School student, fresher & campus builder
                        </div>
                      </div>
                    </button>

                    {/* Working Professional Card */}
                    <button
                      type="button"
                      onClick={() => setProfessionType('PROFESSIONAL')}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${professionType === 'PROFESSIONAL'
                        ? 'border-[#0099e6] bg-sky-50/60 dark:bg-sky-500/10 shadow-xs ring-2 ring-[#0099e6]/20'
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/20'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-xl ${professionType === 'PROFESSIONAL' ? 'bg-[#0099e6] text-white' : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'}`}>
                          <Briefcase className="w-4 h-4" />
                        </div>
                        {professionType === 'PROFESSIONAL' && (
                          <span className="px-2 py-0.5 rounded-full bg-[#0099e6] text-white text-[9px] font-extrabold uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white">Working Professional</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                          Employed at startup, MNC, enterprise or tech lab
                        </div>
                      </div>
                    </button>

                    {/* Independent / Freelancer Card */}
                    <button
                      type="button"
                      onClick={() => setProfessionType('FREELANCER')}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${professionType === 'FREELANCER'
                        ? 'border-[#0099e6] bg-sky-50/60 dark:bg-sky-500/10 shadow-xs ring-2 ring-[#0099e6]/20'
                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-white/[0.03] hover:border-slate-300 dark:hover:border-white/20'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-xl ${professionType === 'FREELANCER' ? 'bg-[#0099e6] text-white' : 'bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300'}`}>
                          <Code2 className="w-4 h-4" />
                        </div>
                        {professionType === 'FREELANCER' && (
                          <span className="px-2 py-0.5 rounded-full bg-[#0099e6] text-white text-[9px] font-extrabold uppercase tracking-wider">
                            Active
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900 dark:text-white">Independent Hacker</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                          Full-time builder, freelancer, or solo founder
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* ═══ Conditional Fields based on Profession ═══ */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-4 animate-in fade-in duration-200">
                  {/* IF STUDENT */}
                  {professionType === 'STUDENT' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <BookOpen className="w-4 h-4 text-[#0099e6]" />
                        <span>Academic & College Details</span>
                      </div>

                      {/* College Name & Passout Year */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">College / University Name *</label>
                          <div className="relative">
                            <GraduationCap className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={college}
                              onChange={(e) => setCollege(e.target.value)}
                              placeholder="e.g. IIT Delhi / BITS Pilani / Stanford"
                              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Passout / Graduation Year *</label>
                          <select
                            value={graduationYear}
                            onChange={(e) => setGraduationYear(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                          >
                            {ALL_GRADUATION_YEARS.map((yr) => (
                              <option key={yr} value={yr} className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white">
                                {yr === '2026' ? '2026 (Pre-Final Year)' : yr === '2025' ? '2025 (Final Year)' : yr === 'Other' ? 'Other (Enter custom year)' : yr}
                              </option>
                            ))}
                          </select>
                          {graduationYear === 'Other' && (
                            <input
                              type="number"
                              placeholder="Type graduation year (e.g. 2017, 2033)"
                              value={customGradYear}
                              onChange={(e) => setCustomGradYear(e.target.value)}
                              className="mt-2 w-full px-4 py-2 rounded-xl bg-white dark:bg-[#0c1017] border border-[#0099e6] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none ring-2 ring-sky-100 dark:ring-sky-500/20"
                            />
                          )}
                        </div>
                      </div>

                      {/* Degree & Branch */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Degree / Program</label>
                          <select
                            value={degree}
                            onChange={(e) => setDegree(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                          >
                            {POPULAR_DEGREES.map((d) => (
                              <option key={d} value={d} className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white">{d}</option>
                            ))}
                          </select>
                          {degree === 'Other' && (
                            <input
                              type="text"
                              placeholder="Specify your Degree / Course (e.g. B.Voc, B.F.A)..."
                              value={customDegree}
                              onChange={(e) => setCustomDegree(e.target.value)}
                              className="mt-2 w-full px-4 py-2 rounded-xl bg-white dark:bg-[#0c1017] border border-[#0099e6] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none ring-2 ring-sky-100 dark:ring-sky-500/20"
                            />
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Branch / Department</label>
                          <select
                            value={branch}
                            onChange={(e) => setBranch(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                          >
                            {POPULAR_BRANCHES.map((b) => (
                              <option key={b} value={b} className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white">{b}</option>
                            ))}
                          </select>
                          {branch === 'Other' && (
                            <input
                              type="text"
                              placeholder="Specify your Branch (e.g. Cyber Forensics, Marine, Petroleum)..."
                              value={customBranch}
                              onChange={(e) => setCustomBranch(e.target.value)}
                              className="mt-2 w-full px-4 py-2 rounded-xl bg-white dark:bg-[#0c1017] border border-[#0099e6] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none ring-2 ring-sky-100 dark:ring-sky-500/20 animate-in fade-in"
                            />
                          )}
                        </div>
                      </div>

                      {/* Optional Student Roll / ID */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Student ID / Roll No (Optional)</label>
                        <input
                          type="text"
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          placeholder="e.g. 21BCE10482 (Optional for campus verification)"
                          className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                        />
                      </div>
                    </div>
                  )}

                  {/* IF WORKING PROFESSIONAL */}
                  {professionType === 'PROFESSIONAL' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <Building2 className="w-4 h-4 text-[#0099e6]" />
                        <span>Workplace & Professional Details</span>
                      </div>

                      {/* Company Name & Role / Designation */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Company / Organization Name *</label>
                          <div className="relative">
                            <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={company}
                              onChange={(e) => setCompany(e.target.value)}
                              placeholder="e.g. Google / Microsoft / Amazon / Startup"
                              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Role / Designation *</label>
                          <div className="relative">
                            <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={jobTitle}
                              onChange={(e) => setJobTitle(e.target.value)}
                              placeholder="e.g. Senior Frontend Engineer / AI Architect"
                              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Experience & Industry */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Total Experience</label>
                          <select
                            value={experienceYears}
                            onChange={(e) => setExperienceYears(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                          >
                            <option value="Fresher (< 1 year)" className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white">Fresher (&lt; 1 year)</option>
                            <option value="1-2 years" className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white">1 - 2 years (Associate / Junior)</option>
                            <option value="3-5 years" className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white">3 - 5 years (Mid-Level / Senior)</option>
                            <option value="5-8 years" className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white">5 - 8 years (Staff / Lead)</option>
                            <option value="8+ years" className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white">8+ years (Principal / Architect / Director)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Industry / Domain</label>
                          <select
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                          >
                            {POPULAR_INDUSTRIES.map((ind) => (
                              <option key={ind} value={ind} className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white">{ind}</option>
                            ))}
                          </select>
                          {industry === 'Other' && (
                            <input
                              type="text"
                              placeholder="Specify your Industry / Sector..."
                              value={customIndustry}
                              onChange={(e) => setCustomIndustry(e.target.value)}
                              className="mt-2 w-full px-4 py-2 rounded-xl bg-white dark:bg-[#0c1017] border border-[#0099e6] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none ring-2 ring-sky-100 dark:ring-sky-500/20"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* IF FREELANCER / INDEPENDENT */}
                  {professionType === 'FREELANCER' && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                        <Code2 className="w-4 h-4 text-[#0099e6]" />
                        <span>Independent Builder & Specialty</span>
                      </div>

                      {/* Title & Level */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Primary Title / Specialty *</label>
                          <input
                            type="text"
                            value={freelanceTitle}
                            onChange={(e) => setFreelanceTitle(e.target.value)}
                            placeholder="e.g. Full-Stack Web3 Builder / AI Consultant"
                            className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Experience Level</label>
                          <select
                            value={freelanceLevel}
                            onChange={(e) => setFreelanceLevel(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                          >
                            <option value="Early Stage Builder" className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white">Early Stage Builder (&lt; 2 yrs)</option>
                            <option value="Intermediate Builder" className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white">Intermediate Builder (2-4 yrs)</option>
                            <option value="Senior Architect / Lead" className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white">Senior Architect / Lead (5+ yrs)</option>
                          </select>
                        </div>
                      </div>

                      {/* Tech Domain */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Primary Focus Domain</label>
                        <select
                          value={freelanceDomain}
                          onChange={(e) => setFreelanceDomain(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0099e6] cursor-pointer"
                        >
                          {POPULAR_FREELANCE_DOMAINS.map((dom) => (
                            <option key={dom} value={dom} className="bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white">{dom}</option>
                          ))}
                        </select>
                        {freelanceDomain === 'Other' && (
                          <input
                            type="text"
                            placeholder="Specify your Focus Domain / Tech Stack..."
                            value={customDomain}
                            onChange={(e) => setCustomDomain(e.target.value)}
                            className="mt-2 w-full px-4 py-2 rounded-xl bg-white dark:bg-[#0c1017] border border-[#0099e6] text-xs font-semibold text-slate-900 dark:text-white focus:outline-none ring-2 ring-sky-100 dark:ring-sky-500/20"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Skills Tag Management */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Skills & Tech Stacks</label>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-[#0099e6] dark:text-sky-400 border border-sky-200 dark:border-sky-500/30 text-xs font-bold"
                        >
                          <span>{skill}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="hover:text-rose-600 transition-colors cursor-pointer"
                          >
                            <XIcon className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="relative" ref={skillsDropdownRef}>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={newSkillInput}
                          onChange={(e) => {
                            setNewSkillInput(e.target.value);
                            setSkillsDropdownOpen(true);
                          }}
                          onFocus={() => setSkillsDropdownOpen(true)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSkill();
                            }
                            if (e.key === 'Escape') {
                              setSkillsDropdownOpen(false);
                            }
                          }}
                          placeholder="Search or type a skill (e.g. Next.js, Rust, Docker)"
                          className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0099e6] focus:border-[#0099e6] transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setSkillsDropdownOpen(!skillsDropdownOpen)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${skillsDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddSkill}
                        disabled={!newSkillInput.trim()}
                        className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add</span>
                      </button>
                    </div>

                    {/* Skills Dropdown */}
                    {skillsDropdownOpen && (() => {
                      const query = newSkillInput.toLowerCase().trim();
                      const filtered = POPULAR_SKILLS.filter(
                        (s) => !skills.includes(s) && (query === '' || s.toLowerCase().includes(query))
                      );
                      const showCustom = query && !POPULAR_SKILLS.some((s) => s.toLowerCase() === query) && !skills.includes(newSkillInput.trim());

                      if (filtered.length === 0 && !showCustom) return null;

                      return (
                        <div className="absolute z-40 left-0 right-0 mt-1.5 max-h-56 overflow-y-auto rounded-2xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-black/70 animate-in fade-in slide-in-from-top-1 duration-150">
                          {showCustom && (
                            <button
                              type="button"
                              onClick={() => {
                                handleAddSkill();
                                setSkillsDropdownOpen(false);
                              }}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors cursor-pointer border-b border-slate-100 dark:border-white/[0.06]"
                            >
                              <div className="w-6 h-6 rounded-lg bg-[#0099e6] text-white flex items-center justify-center shrink-0">
                                <Plus className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">Add &quot;{newSkillInput.trim()}&quot;</span>
                                <span className="text-[10px] text-slate-400 ml-1.5">custom skill</span>
                              </div>
                            </button>
                          )}
                          {filtered.slice(0, 30).map((skill) => (
                            <button
                              type="button"
                              key={skill}
                              onClick={() => handleSelectSkill(skill)}
                              className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors cursor-pointer group"
                            >
                              <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-white/[0.06] group-hover:bg-sky-100 dark:group-hover:bg-sky-500/20 text-slate-500 group-hover:text-[#0099e6] flex items-center justify-center shrink-0 transition-colors">
                                <Code2 className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white">{skill}</span>
                            </button>
                          ))}
                          {filtered.length > 30 && (
                            <div className="px-4 py-2 text-[10px] text-slate-400 font-medium text-center border-t border-slate-100 dark:border-white/[0.06]">
                              Type to filter — {filtered.length - 30} more skills available
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                    ⚡ Saves to Supabase and broadcasts to squads in real-time
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Save Profile Changes</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 2. Tab: Socials & Portfolio */}
          {activeTab === 'socials' && (
            <div className="p-7 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 dark:border-white/[0.06] pb-4">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Globe className="w-5 h-5 text-[#0099e6]" />
                  <span>Social Handles & Proof of Work</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Connect your GitHub repositories, LinkedIn, and personal portfolio links.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">GitHub Profile URL or Handle</label>
                  <div className="relative">
                    <Github className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      placeholder="github.com/your-username or username"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">LinkedIn Profile URL or Handle</label>
                  <div className="relative">
                    <Linkedin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="linkedin.com/in/your-profile or username"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Personal Portfolio or Website</label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={portfolio}
                      onChange={(e) => setPortfolio(e.target.value)}
                      placeholder="yourportfolio.dev or https://..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0099e6]"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-3 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] text-white font-extrabold text-xs shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Save Social Links</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* 3. Tab: Security & Password */}
          {activeTab === 'security' && (
            <div className="p-7 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 dark:border-white/[0.06] pb-4">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Security & Credentials</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Update your authentication credentials and manage session security.
                </p>
              </div>

              {passwordMsg && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2 ${passwordMsg.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                    : 'bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400'
                    }`}
                >
                  {passwordMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      placeholder="Minimum 6 characters"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Re-enter your new password"
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500">Authenticated with Supabase Auth</span>
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    {isUpdatingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>Update Password</span>
                  </button>
                </div>
              </form>

              {/* Two-Factor Info */}
              <div className="pt-6 border-t border-slate-100 dark:border-white/[0.06]">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-500/10 text-[#0099e6] dark:text-sky-400 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Phone Authentication & SMS OTP</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Log in securely with one-time SMS codes.</div>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/20">
                    Active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 4. Tab: Notification Alerts */}
          {activeTab === 'notifications' && (
            <div className="p-7 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 dark:border-white/[0.06] pb-4">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#ea580c]" />
                  <span>Notification &amp; Broadcast Preferences</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Control the communications and alerts you receive, and manage whether your hosted events notify the community.
                </p>
              </div>

              {/* Feedback messages */}
              {notificationSaved && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Notification preferences saved and applied successfully!</span>
                </div>
              )}
              {notificationError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 flex items-center gap-2.5 text-xs font-bold text-rose-700 dark:text-rose-300 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{notificationError}</span>
                </div>
              )}

              {/* Section 1: Host Broadcast Setting */}
              <div className="space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-[#ea580c] flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  <span>Event Host &amp; Community Broadcast Control</span>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-500/[0.04] via-amber-500/[0.02] to-transparent border border-orange-500/20 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Broadcast My Hosted Events to Community</span>
                        {notifyHostBroadcast ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold">
                            Silent Mode
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                        Automatically dispatch email notifications and in-app alerts to all registered members on Hacker’s Unity when you publish a new hackathon or event.
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400/90 font-semibold pt-1">
                        ⚠️ If you turn this OFF, <strong>NO user on the platform will receive email blasts or notifications</strong> when your events go live.
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                      <input
                        type="checkbox"
                        checked={notifyHostBroadcast}
                        onChange={(e) => setNotifyHostBroadcast(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-white/20 peer-checked:bg-[#ea580c]" />
                    </label>
                  </div>
                </div>
              </div>

              {/* Section 2: Incoming Alerts for User */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />
                  <span>Incoming Alerts &amp; Subscriptions</span>
                </div>

                <div className="space-y-3">
                  <label className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 dark:hover:bg-white/[0.06] transition-colors">
                    <div className="space-y-0.5 pr-4">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">New Hackathon &amp; Event Announcements</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Receive email alerts and push notifications when new events and hackathons are published.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyNewEvents}
                      onChange={(e) => setNotifyNewEvents(e.target.checked)}
                      className="w-4 h-4 text-[#0099e6] rounded border-slate-300 dark:border-white/20 dark:bg-white/10 focus:ring-[#0099e6]"
                    />
                  </label>

                  <label className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 dark:hover:bg-white/[0.06] transition-colors">
                    <div className="space-y-0.5 pr-4">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Hackathon Deadlines &amp; Milestones</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Get reminders before registration and submission deadlines end.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyHackathons}
                      onChange={(e) => setNotifyHackathons(e.target.checked)}
                      className="w-4 h-4 text-[#0099e6] rounded border-slate-300 dark:border-white/20 dark:bg-white/10 focus:ring-[#0099e6]"
                    />
                  </label>

                  <label className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 dark:hover:bg-white/[0.06] transition-colors">
                    <div className="space-y-0.5 pr-4">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Team Invites &amp; Squad Requests</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Receive alerts when builders invite you to form hackathon squads.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyInvites}
                      onChange={(e) => setNotifyInvites(e.target.checked)}
                      className="w-4 h-4 text-[#0099e6] rounded border-slate-300 dark:border-white/20 dark:bg-white/10 focus:ring-[#0099e6]"
                    />
                  </label>

                  <label className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex items-center justify-between cursor-pointer hover:bg-slate-100/70 dark:hover:bg-white/[0.06] transition-colors">
                    <div className="space-y-0.5 pr-4">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Weekly Builder Digest</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">A weekly summary of top upcoming hackathons, prizes, and leaderboards.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifyDigest}
                      onChange={(e) => setNotifyDigest(e.target.checked)}
                      className="w-4 h-4 text-[#0099e6] rounded border-slate-300 dark:border-white/20 dark:bg-white/10 focus:ring-[#0099e6]"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={isSavingNotifications}
                  onClick={handleSaveNotifications}
                  className="px-6 py-2.5 rounded-2xl bg-[#ea580c] hover:bg-[#c2410c] text-white font-extrabold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingNotifications ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Preferences...</span>
                    </>
                  ) : (
                    <span>Save Notification Preferences</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 5. Tab: Add Bank Details */}
          {activeTab === 'bank' && (
            <div className="p-7 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-6 animate-in fade-in">
              <div className="border-b border-slate-100 dark:border-white/[0.06] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Landmark className="w-5 h-5 text-[#0099e6]" />
                    <span>Host Bank &amp; Payout Details</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Add your bank account or UPI ID to receive payouts when you host paid hackathons or events.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 self-start sm:self-auto">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Razorpay Payouts Protected</span>
                </div>
              </div>

              {/* Information Banner Explaining the 0.5% cut & Payouts */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50/80 via-blue-50/50 to-indigo-50/80 dark:from-sky-950/20 dark:via-blue-950/10 dark:to-indigo-950/20 border border-sky-200/80 dark:border-sky-500/20 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-sky-900 dark:text-sky-300">
                  <Sparkles className="w-4 h-4 text-[#0099e6]" />
                  <span>How Paid Event Payouts Work on Hacker&apos;s Unity</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  When you host an event with a registration fee (e.g. ₹500/participant), hackers pay securely through Hacker&apos;s Unity Razorpay gateway. Hacker&apos;s Unity deducts a nominal <strong className="text-slate-900 dark:text-white">0.5% platform fee</strong>, and the remaining <strong className="text-emerald-600 dark:text-emerald-400">99.5% event revenue</strong> is automatically disbursed directly into this bank account upon event verification.
                </p>
              </div>

              {bankSaved && (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Bank details saved securely! Payouts for your hosted hackathons will be credited to this account.</span>
                </div>
              )}

              {bankError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bankError}</span>
                </div>
              )}

              <form onSubmit={handleSaveBankDetails} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Account Holder Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Account Holder Name (as per Bank / PAN) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={accountHolderName}
                      onChange={(e) => setAccountHolderName(e.target.value)}
                      placeholder="e.g. Chinmay Bhatt"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#0099e6] transition-colors"
                    />
                  </div>

                  {/* Bank Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Bank Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank / State Bank of India / ICICI"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:border-[#0099e6] transition-colors"
                    />
                  </div>

                  {/* Account Number */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Bank Account Number <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAccountNumber(!showAccountNumber)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{showAccountNumber ? 'Hide' : 'Show'}</span>
                      </button>
                    </div>
                    <input
                      type={showAccountNumber ? 'text' : 'password'}
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 50100458923145"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 font-mono tracking-wider focus:outline-hidden focus:border-[#0099e6] transition-colors"
                    />
                  </div>

                  {/* Confirm Account Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Confirm Account Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={confirmAccountNumber}
                      onChange={(e) => setConfirmAccountNumber(e.target.value.replace(/\D/g, ''))}
                      placeholder="Re-enter bank account number"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 font-mono tracking-wider focus:outline-hidden focus:border-[#0099e6] transition-colors"
                    />
                  </div>

                  {/* IFSC Code */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      IFSC Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={11}
                      value={ifscCode}
                      onChange={(e) => setIfscCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                      placeholder="e.g. HDFC0001234"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 font-mono uppercase tracking-wider focus:outline-hidden focus:border-[#0099e6] transition-colors"
                    />
                  </div>

                  {/* Account Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAccountType('SAVINGS')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${accountType === 'SAVINGS'
                          ? 'bg-[#0099e6]/10 border-[#0099e6] text-[#0099e6]'
                          : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                          }`}
                      >
                        Savings Account
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccountType('CURRENT')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${accountType === 'CURRENT'
                          ? 'bg-[#0099e6]/10 border-[#0099e6] text-[#0099e6]'
                          : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
                          }`}
                      >
                        Current Account
                      </button>
                    </div>
                  </div>
                </div>

                {/* Instant UPI ID (Optional fallback) */}
                <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.08] space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                      <Smartphone className="w-3.5 h-3.5 text-[#0099e6]" />
                      <span>Instant UPI ID / VPA (Optional Backup)</span>
                    </label>
                    <span className="text-[10px] text-slate-400">IMPS / UPI instant payouts</span>
                  </div>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value.trim().toLowerCase())}
                    placeholder="e.g. username@okhdfcbank or 9876543210@upi"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#121824] border border-slate-200 dark:border-white/[0.08] text-xs text-slate-900 dark:text-white placeholder:text-slate-400 font-mono focus:outline-hidden focus:border-[#0099e6] transition-colors"
                  />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    If bank transfer is delayed during bank holidays, secondary prize pool and fast disbursements can be settled via UPI VPA.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-500" />
                    <span>256-bit encrypted &amp; stored strictly for host settlements</span>
                  </div>
                  <button
                    type="submit"
                    disabled={isSavingBank}
                    className="px-6 py-2.5 rounded-2xl bg-[#0099e6] hover:bg-[#0284c7] disabled:opacity-50 text-white font-extrabold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer flex items-center gap-2"
                  >
                    {isSavingBank ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Details...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Save Bank &amp; Payout Details</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab: Recycle Bin & Data Recovery */}
          {activeTab === 'recycle_bin' && (
            <div className="p-7 rounded-3xl bg-white dark:bg-[#0c1017] border border-slate-200 dark:border-white/[0.08] shadow-sm space-y-6 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-white/[0.08] pb-5">
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <RotateCcw className="w-5 h-5 text-[#0099e6]" />
                    <span>Recycle Bin &amp; Data Recovery</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Accidentally cleared an event, registrations, or submissions? Restore them instantly with 1-click.
                  </p>
                </div>

                {recycledItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          'Are you sure you want to permanently clear the Recycle Bin? All backed-up items will be purged.'
                        )
                      ) {
                        handleEmptyRecycleBin();
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Empty Bin</span>
                  </button>
                )}
              </div>

              {/* Notification Banner */}
              {recycleNotification && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-2 animate-in fade-in ${
                    recycleNotification.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200'
                      : recycleNotification.type === 'error'
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/40 text-red-800 dark:text-red-200'
                      : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40 text-blue-800 dark:text-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {recycleNotification.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{recycleNotification.text}</span>
                  </div>
                  <button
                    onClick={() => setRecycleNotification(null)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <XIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Filter Tabs & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.06] overflow-x-auto">
                  {(
                    [
                      { key: 'ALL', label: 'All Items', count: recycledItems.length },
                      {
                        key: 'REGISTRATION',
                        label: 'Registrations',
                        count: recycledItems.filter((i) => i.type === 'REGISTRATION').length,
                        icon: Users,
                      },
                      {
                        key: 'EVENT',
                        label: 'Events',
                        count: recycledItems.filter((i) => i.type === 'EVENT').length,
                        icon: Calendar,
                      },
                      {
                        key: 'SUBMISSION',
                        label: 'Submissions',
                        count: recycledItems.filter((i) => i.type === 'SUBMISSION').length,
                        icon: FileText,
                      },
                    ] as const
                  ).map((tab) => {
                    const IconComp = (tab as any).icon;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setRecycleFilter(tab.key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                          recycleFilter === tab.key
                            ? 'bg-white dark:bg-[#121824] text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {IconComp && <IconComp className="w-3.5 h-3.5" />}
                        <span>{tab.label}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                            recycleFilter === tab.key
                              ? 'bg-slate-100 dark:bg-white/[0.08] text-slate-900 dark:text-white'
                              : 'text-slate-400'
                          }`}
                        >
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={recycleSearch}
                    onChange={(e) => setRecycleSearch(e.target.value)}
                    placeholder="Search in recycle bin..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#0099e6]"
                  />
                  {recycleSearch && (
                    <button
                      onClick={() => setRecycleSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* Items List */}
              {(() => {
                const filtered = recycledItems.filter((item) => {
                  if (recycleFilter !== 'ALL' && item.type !== recycleFilter) return false;
                  if (!recycleSearch) return true;
                  const q = recycleSearch.toLowerCase();
                  return (
                    item.title.toLowerCase().includes(q) ||
                    (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
                    (item.eventName && item.eventName.toLowerCase().includes(q)) ||
                    (item.eventId && item.eventId.toLowerCase().includes(q))
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="p-12 text-center rounded-3xl border border-dashed border-slate-200 dark:border-white/[0.08] bg-slate-50/50 dark:bg-white/[0.01] space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.05] text-slate-400 flex items-center justify-center mx-auto">
                        <Archive className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {recycleSearch || recycleFilter !== 'ALL'
                          ? 'No matching deleted items'
                          : 'Recycle Bin is Empty'}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                        {recycleSearch || recycleFilter !== 'ALL'
                          ? 'Try adjusting your search query or tab filter.'
                          : 'Any deleted events, registrations (cleared individually or in bulk), or submissions will be kept safe here.'}
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {filtered.map((item) => {
                      const isRestoring = restoringId === item.id;
                      const isReg = item.type === 'REGISTRATION';
                      const isEvent = item.type === 'EVENT';

                      return (
                        <div
                          key={item.id}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#121824] hover:border-slate-300 dark:hover:border-white/[0.15] transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs"
                        >
                          <div className="flex items-start gap-3.5">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                                isReg
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40'
                                  : isEvent
                                  ? 'bg-sky-50 dark:bg-sky-950/40 text-[#0099e6] dark:text-sky-400 border-sky-200 dark:border-sky-800/40'
                                  : 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40'
                              }`}
                            >
                              {isReg ? (
                                <Users className="w-5 h-5" />
                              ) : isEvent ? (
                                <Calendar className="w-5 h-5" />
                              ) : (
                                <FileText className="w-5 h-5" />
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                                  {item.title}
                                </h3>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    isReg
                                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                      : isEvent
                                      ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300'
                                      : 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                                  }`}
                                >
                                  {isReg ? 'Registration' : isEvent ? 'Event' : 'Submission'}
                                </span>
                                {item.itemCount !== undefined && item.itemCount > 1 && (
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.08] text-[10px] font-bold font-mono text-slate-600 dark:text-slate-300">
                                    {item.itemCount} items
                                  </span>
                                )}
                              </div>

                              {item.subtitle && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  {item.subtitle}
                                </p>
                              )}

                              <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-2 font-mono">
                                <span>Deleted: {formatDeletedDate(item.deletedAt)}</span>
                                {item.eventId && (
                                  <>
                                    <span>•</span>
                                    <span>Event ID: {item.eventId}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => handleRestore(item)}
                              disabled={isRestoring}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                              title="Restore item back to active database and view"
                            >
                              {isRestoring ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Restoring...</span>
                                </>
                              ) : (
                                <>
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Restore</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handlePermanentDelete(item)}
                              className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.08] hover:border-red-200 dark:hover:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                              title="Permanently remove from Recycle Bin"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 5. Tab: Danger / Account Management */}
          {activeTab === 'danger' && (
            <div className="p-7 rounded-3xl bg-white dark:bg-[#0c1017] border border-rose-200 dark:border-rose-500/20 shadow-sm space-y-6 animate-in fade-in">
              <div className="border-b border-rose-100 dark:border-rose-500/10 pb-4">
                <h2 className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  <span>Account Session & Actions</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Manage active login session or sign out of your account on this device.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/20 space-y-3">
                <div className="text-xs font-bold text-rose-900 dark:text-rose-200">Sign Out of Hacker&apos;s Unity</div>
                <p className="text-[11px] text-rose-700 dark:text-rose-300">
                  This will securely end your current Supabase authenticated session on this browser.
                </p>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out of Account</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Public Profile Preview Modal */}
      <PublicProfileModal
        isOpen={showPublicPreview}
        onClose={() => setShowPublicPreview(false)}
        user={user}
        livePreviewData={{
          name,
          bio,
          avatarUrl: avatar,
          bannerUrl: banner,
          professionType,
          college,
          graduationYear: graduationYear === 'Other' ? customGradYear : graduationYear,
          degree: degree === 'Other' ? customDegree : degree,
          branch: branch === 'Other' ? customBranch : branch,
          company,
          jobTitle,
          experienceYears,
          industry: industry === 'Other' ? customIndustry : industry,
          freelanceTitle,
          freelanceLevel,
          freelanceDomain: freelanceDomain === 'Other' ? customDomain : freelanceDomain,
          skills,
          socialLinks: {
            github,
            linkedin,
            portfolio,
          },
        }}
      />

      {/* Certificate of Completion Modal */}
      <CertificateModal
        isOpen={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        recipientName={name.trim() || user?.name || 'Hacker'}
        completionDate={user?.profileCompletedAt || completionResult.completionDate || new Date().toISOString()}
        certificateId={user?.certificateId || completionResult.certificateId}
        username={username || user?.username}
      />
    </div>
  );
}
