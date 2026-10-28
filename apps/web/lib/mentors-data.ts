export interface VerifiedMentor {
  slug: string;
  name: string;
  currentRole: string;
  company: string;
  headline: string;
  verificationId: string;
  verificationYear: string;
  badgeLabel: string;
  avatarUrl: string;
  quote: string;
  experienceYears: string;
  juryEventsCount: string;
  aboutParagraphs: string[];
  currentResponsibilities: string;
  expertiseList: {
    title: string;
    description: string;
    iconName: string;
  }[];
  techStack: {
    category: string;
    items: string[];
  }[];
  coreStrengths: string[];
  juryEvents: {
    name: string;
    role: string;
    badgeColor?: string;
  }[];
  exploringAndBuilding: string[];
  domains: string[];
}

export const VERIFIED_MENTORS: Record<string, VerifiedMentor> = {
  'tapendra-stf4w4sdg883': {
    slug: 'Tapendra-stf4w4sdg883',
    name: 'Tapendra Singh Ranawat',
    currentRole: 'Project Lead',
    company: 'Metacube Software Pvt Ltd',
    headline:
      'Project Lead | Solution Architecture | Full Stack .NET | AI-Driven Product Development | Construction & Asset Management Domain Expert | Mentor & Hackathon Jury',
    verificationId: 'HU-MTR-TAPENDRA-883',
    verificationYear: '2025 - Present',
    badgeLabel: "Hacker's Unity Verified Mentor",
    avatarUrl: 'https://res.cloudinary.com/p6qljeni/image/upload/v1793190014/hackers-unity/mentors/tapendra.png',
    quote:
      'Building technology is important. Building solutions that create measurable impact is the goal.',
    experienceYears: '12+',
    juryEventsCount: '7+',
    domains: [
      'Solution Architecture',
      'Full Stack .NET',
      'AI & Intelligent Automation',
      'Construction & Asset Management',
    ],
    aboutParagraphs: [
      'With over 12+ years of experience in software engineering, technology leadership, and enterprise application development, I specialize in transforming business challenges into scalable technology solutions across the Construction and Asset Management domains.',
      'Throughout my career journey, I have designed and delivered mission-critical enterprise solutions using technologies including ASP.NET Core, ASP.NET MVC, C#, CSLA, DevExpress, JavaScript, jQuery, REST APIs, SQL Server, and modern software engineering practices.',
      'Beyond technology delivery, I am deeply passionate about innovation, mentorship, and developer community contribution. I actively support the technology ecosystem as a Hackathon Jury Member, Guest Reviewer, and Mentor, contributing to innovation evaluation and technical guidance across national platforms and student communities.',
    ],
    currentResponsibilities:
      'Currently serving as a Project Lead at Metacube Software, I lead cross-functional teams across development and QA, driving complete project lifecycles from requirement analysis and stakeholder collaboration to architecture discussions, development, deployment, and delivery execution.',
    expertiseList: [
      {
        title: 'Solution Architecture & System Design',
        description:
          'Designing robust, distributed, and scalable architectures capable of supporting enterprise workloads and complex business operations.',
        iconName: 'Cpu',
      },
      {
        title: 'Full Stack .NET Development',
        description:
          'Deep expertise in ASP.NET Core, ASP.NET MVC, C#, and enterprise SQL Server optimization.',
        iconName: 'Code2',
      },
      {
        title: 'AI-Driven Product Development',
        description:
          'Integrating intelligent automation, cognitive services, and AI capabilities into enterprise systems.',
        iconName: 'Sparkles',
      },
      {
        title: 'Enterprise Web Applications',
        description:
          'Architecting high-availability web platforms with modern practices, CSLA, and secure RESTful APIs.',
        iconName: 'Layers',
      },
      {
        title: 'Database Design & Optimization',
        description:
          'High-performance SQL schema modeling, query tuning, indexing strategies, and relational database integrity.',
        iconName: 'Database',
      },
      {
        title: 'Agile Delivery & Technical Leadership',
        description:
          'Leading cross-functional engineering teams, mentoring developers, driving sprint goals, and ensuring engineering rigor.',
        iconName: 'Users',
      },
      {
        title: 'Client Engagement & Product Strategy',
        description:
          'Translating high-level executive requirements into actionable roadmaps, architecture blueprints, and business value.',
        iconName: 'Target',
      },
    ],
    techStack: [
      {
        category: 'Backend & Frameworks',
        items: ['ASP.NET Core', 'ASP.NET MVC', 'C#', 'REST APIs', 'CSLA', '.NET Enterprise'],
      },
      {
        category: 'Database & Data Layer',
        items: ['SQL Server', 'Database Tuning', 'Schema Optimization', 'Stored Procedures'],
      },
      {
        category: 'Frontend & UI',
        items: ['JavaScript', 'jQuery', 'DevExpress UI', 'Modern Web Standards'],
      },
      {
        category: 'Architecture & Innovation',
        items: ['System Design', 'AI Applications', 'SaaS Architectures', 'Cloud & Scalability'],
      },
    ],
    coreStrengths: [
      'Building scalable web and business applications',
      'Leading development teams and mentoring engineers',
      'Managing production support, troubleshooting, and optimization initiatives',
      'Driving process improvements and technical excellence',
      'Translating complex business requirements into high-impact software solutions',
    ],
    juryEvents: [
      { name: 'Smart India Hackathon 2025', role: 'Jury Member & Reviewer', badgeColor: 'orange' },
      { name: 'CodeWars', role: 'Jury Member & Evaluator', badgeColor: 'blue' },
      { name: 'Hack Arya Verse 2.0', role: 'Jury Member', badgeColor: 'purple' },
      { name: 'CodeFiesta 4.0', role: 'Hackathon Jury', badgeColor: 'blue' },
      { name: 'CodeFiesta 3.0', role: 'Hackathon Jury', badgeColor: 'indigo' },
      { name: 'HackAryaVerse', role: 'Guest Reviewer & Mentor', badgeColor: 'emerald' },
      { name: 'DevSummit', role: 'Technical Reviewer', badgeColor: 'cyan' },
    ],
    exploringAndBuilding: [
      'AI Applications & Enterprise Integrations',
      'SaaS Platforms & Multi-Tenant Architectures',
      'Cloud & Scalable System Design',
      'Construction Technology (ConTech) Innovation',
    ],
  },
};

export function getMentorBySlug(slug: string): VerifiedMentor | null {
  const normalized = slug.toLowerCase().trim();
  return VERIFIED_MENTORS[normalized] || null;
}

export function findMentorByCredential(query: string): VerifiedMentor | null {
  if (!query || !query.trim()) return null;
  const clean = query.trim().toLowerCase();

  // 1. Direct slug match
  if (VERIFIED_MENTORS[clean]) {
    return VERIFIED_MENTORS[clean];
  }

  // 2. Search through verified mentors
  const mentors = Object.values(VERIFIED_MENTORS);
  for (const mentor of mentors) {
    if (mentor.slug.toLowerCase() === clean) return mentor;
    if (mentor.verificationId.toLowerCase() === clean) return mentor;
    if (mentor.name.toLowerCase() === clean) return mentor;
    // Substring in verification ID or slug
    if (clean.length >= 4 && (mentor.verificationId.toLowerCase().includes(clean) || mentor.slug.toLowerCase().includes(clean))) {
      return mentor;
    }
  }

  return null;
}
