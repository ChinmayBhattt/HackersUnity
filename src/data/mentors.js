/**
 * Hacker's Unity - Official Mentor Registry & Credential Database
 * Scalable data repository for verified mentors, jurists, and advisors.
 */

export const mentors = [
  {
    id: 'tapendra-stf4w4sdg883',
    slug: 'Tapendra-stf4w4sdg883',
    credentialId: 'HU-MNT-2026-TAPENDRA-STF4W4SDG883',
    name: 'Mr. Tapendra Singh Ranawat',
    shortName: 'Tapendra Ranawat',
    photo: '/mentors/tapendra.png',
    company: 'Metacube Software',
    designation: 'Project Lead',
    secondaryTitle: 'Solution Architect & Enterprise .NET Specialist',
    role: 'Official Verified Mentor & Hackathon Jury',
    experienceYears: '11+ Years',
    issueDate: 'August 2026',
    status: 'Verified',
    isActive: true,
    verificationTier: 'Distinguished Technical Mentor',
    headline: 'Project Lead | Solution Architecture | Full Stack .NET | AI-Driven Product Development | Construction & Asset Management Domain Expert | Mentor & Hackathon Jury',
    quote: 'Building technology is important. Building solutions that create measurable impact is the goal.',
    verificationStatement: 'This credential officially recognizes Tapendra Ranawat as a verified Mentor associated with Hacker’s Unity.',
    officialNote: 'Recognized for distinguished contributions to technical mentorship, architecture leadership, and national hackathon jury evaluation across student and developer ecosystems.',
    about: [
      'With over 11+ years of experience in software engineering, technology leadership, and enterprise application development, Tapendra specializes in transforming complex business challenges into scalable, high-performance technology solutions across the Construction and Asset Management domains.',
      'Currently serving as a Project Lead at Metacube Software, he leads cross-functional teams across development and QA, driving complete project lifecycles from requirement analysis and stakeholder collaboration to architecture discussions, development, deployment, and delivery execution.',
      'Beyond enterprise technology delivery, he is deeply passionate about innovation, mentorship, and community contribution. He actively supports the national technology ecosystem as a Hackathon Jury Member, Guest Reviewer, and Mentor, contributing to innovation evaluation and technical guidance across premier student hackathons and developer communities.'
    ],
    highlights: [
      { label: 'Industry Experience', value: '11+ Years', desc: 'Software Engineering & Leadership' },
      { label: 'Current Role', value: 'Project Lead', desc: 'Metacube Software' },
      { label: 'Hackathons Judged', value: '6+ Premier Events', desc: 'Jury Member & Technical Reviewer' },
      { label: 'Domain Specialty', value: 'Asset & Construction', desc: 'Enterprise Systems & AI' },
    ],
    expertise: [
      {
        title: 'Solution Architecture & System Design',
        desc: 'Designing highly scalable, fault-tolerant enterprise architectures and distributed system frameworks.'
      },
      {
        title: 'Full Stack .NET Enterprise Development',
        desc: 'Deep mastery across ASP.NET Core, ASP.NET MVC, C#, SQL Server, REST APIs, CSLA, and DevExpress.'
      },
      {
        title: 'AI-Driven Product Development',
        desc: 'Building intelligent automation workflows and seamlessly embedding modern AI capabilities into production applications.'
      },
      {
        title: 'Enterprise Web Applications',
        desc: 'End-to-end engineering of high-concurrency, multi-tenant enterprise software platforms.'
      },
      {
        title: 'Database Design & Optimization',
        desc: 'Advanced SQL Server relational modeling, indexing strategies, and database query performance tuning.'
      },
      {
        title: 'Agile Delivery & Engineering Leadership',
        desc: 'Leading cross-functional engineering teams, fostering technical excellence, and mentoring developers.'
      },
      {
        title: 'Client Engagement & Product Strategy',
        desc: 'Translating complex stakeholder requirements into high-impact software roadmaps and measurable ROI.'
      },
    ],
    provenCapabilities: [
      'Building scalable web and mission-critical business applications',
      'Leading development teams and mentoring software engineers',
      'Managing production support, troubleshooting, and system optimization initiatives',
      'Driving software engineering process improvements and technical excellence',
      'Translating complex business requirements into high-impact software solutions'
    ],
    juryEvents: [
      { name: 'Hack Arya Verse 2.0', role: 'Hackathon Jury Member', tag: 'Jury' },
      { name: 'Smart India Hackathon 2025', role: 'National Evaluator & Jury', tag: 'National' },
      { name: 'CodeFiesta 4.0', role: 'Guest Reviewer & Judge', tag: 'Judge' },
      { name: 'CodeFiesta 3.0', role: 'Technical Mentor & Judge', tag: 'Mentor' },
      { name: 'HackAryaVerse', role: 'Innovation Reviewer', tag: 'Jury' },
      { name: 'DevSummit', role: 'Technical Mentor & Speaker', tag: 'Summit' },
    ],
    currentBuilding: [
      { title: 'AI Applications & Integrations', desc: 'Leveraging modern LLM & agentic workflows for enterprise automation' },
      { title: 'SaaS Platforms & Multi-Tenant Architectures', desc: 'Designing resilient cloud software for global enterprise tenants' },
      { title: 'Cloud & Scalable System Design', desc: 'Distributed infrastructure and microservices scaling' },
      { title: 'Construction Technology Innovation', desc: 'Digital transformation in construction and asset lifecycle management' }
    ],
    skills: [
      'Solution Architecture',
      'ASP.NET Core',
      'C#',
      'SQL Server',
      'AI Product Development',
      'Enterprise Web Apps',
      'REST APIs',
      'System Design',
      'CSLA Framework',
      'DevExpress',
      'JavaScript / jQuery',
      'Agile Leadership',
      'Performance Optimization',
      'SaaS Architectures'
    ]
  }
];

/**
 * Retrieve a mentor by slug, id, or credential ID (case-insensitive)
 */
export function getMentorBySlug(slug) {
  if (!slug) return null;
  const normalized = decodeURIComponent(slug).toLowerCase().trim();
  return mentors.find(
    (m) =>
      m.slug.toLowerCase() === normalized ||
      m.id.toLowerCase() === normalized ||
      m.credentialId.toLowerCase() === normalized
  ) || null;
}

/**
 * Retrieve a mentor strictly by credential ID
 */
export function getMentorByCredentialId(credentialId) {
  if (!credentialId) return null;
  const normalized = credentialId.toLowerCase().trim();
  return mentors.find((m) => m.credentialId.toLowerCase() === normalized) || null;
}

/**
 * Retrieve all registered mentors
 */
export function getAllMentors() {
  return mentors;
}
