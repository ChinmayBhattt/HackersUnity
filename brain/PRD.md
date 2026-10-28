# Hacker's Unity — Product Requirements Document (PRD)

> **Document Version:** 2.6.0  
> **Target Release:** Production 2026  
> **Product Name:** Hacker's Unity (HU Platform)  
> **Repository:** `hackers-unity`  
> **Status:** Active / In Production & Continuous Expansion  

---

## 1. Executive Summary & Vision

**Hacker's Unity** is an all-in-one hackathon operating system and competitive innovation ecosystem engineered to empower student technologists, independent developers, collegiate clubs, and industry organizers.

Existing hackathon platforms suffer from fragmented communication, opaque team formation, rigid registration schemas, lack of co-organizer delegation, and detached evaluation mechanisms. Hacker's Unity resolves these pain points by providing:
- A modular **7-Step Event Hosting & Delegation Engine** with customizable dynamic questionnaires, live preview, and multi-admin co-host access.
- Frictionless **Squad Formation & Matchmaking** backed by cryptographic invite tokens and automated transactional emails.
- **Financial Infrastructure** supporting both Free and Paid hackathons via Razorpay order creation, status verification, and webhook reconciliation.
- **Organizer Operations Suite** including real-time applicant screening, waitlisting, one-click CSV export, and bi-directional Google Sheets live sync.
- **Two-Phase RSVP Attendance System** ensuring high physical turnouts for offline and hybrid events.
- **Campus & Ambassador Network** driving grassroots engagement through the Campus Student Ambassador Program (CSAP), Club partnerships, and Mentorship.
- **AI Product Evaluation Engine** powered by Groq Llama 3 assessing submissions for genuine product-market fit, feasibility, and technical execution.

---

## 2. Target Audience & Personas

### 2.1. The Student & Independent Builder (Hacker)
- **Profile:** College student (B.Tech, BCA, MCA, BS) or self-taught developer looking to build real-world products, find compatible teammates, win cash prizes, and secure job/internship opportunities.
- **Pain Points:** Hard to find dedicated teammates matching required tech stacks; missing critical deadlines; lack of visibility into application status.
- **Platform Features:** 1-click registration, automated squad matchmaking, profile portfolio with verified hackathon wins, real-time in-app and email notifications, certificate generation.

### 2.2. Event Organizers & College Chapters
- **Profile:** Collegiate tech clubs (GDG, ACM, IEEE), university hackathon directors, and corporate innovation teams.
- **Pain Points:** Google Forms + Discord management is chaotic; screening thousands of applicants is manual; collecting submission links lacks standardized validation; organizing teams need shared admin permissions.
- **Platform Features:** 7-step host wizard, custom form builder, co-host admin invite links, applicant approval/waitlist workflow, branded landing pages, live Google Sheets sync, participant broadcast emails, and submissions grading suite.

### 2.3. Campus Ambassadors & Club Leaders
- **Profile:** Student tech leads representing Hacker's Unity on university campuses across India.
- **Platform Features:** Dedicated CSAP admin dashboard, referral UTM tracking links, club collaboration applications, and ambassador leaderboard.

### 2.4. Platform Administrators
- **Profile:** Hacker's Unity core team and community moderators.
- **Platform Features:** Global announcement broadcast console, event review & approval pipeline, news publishing CMS, and ecosystem telemetry.

---

## 3. Key Feature Modules & Functional Requirements

### 3.1. Authentication & Profile Identity
- **Multi-Method Authentication:**
  - Supabase Auth: Email & Password (`signUp`, `signInWithPassword`).
  - Passwordless Email Magic Link & Phone SMS OTP (`signInWithOtp`).
  - OAuth Providers: GitHub & Google for rapid developer onboarding.
- **Adaptive Developer Profile:**
  - Profession Selector: `STUDENT`, `PROFESSIONAL`, or `FREELANCER`.
  - Academic Metadata: Degree, Branch, College/University, Roll Number, Graduation Year.
  - Work Metadata: Company, Job Title, Years of Experience, Domain.
  - Media: Profile Avatar & Banner upload with client-side canvas cropping (`react-easy-crop`) stored in Supabase Storage (`hackathon-assets`).
  - Developer Footprint: GitHub, LinkedIn, Twitter, Portfolio URLs, and skill tags.
  - Profile Completion Score: 0-100% computed dynamically based on completeness matrix (`lib/profile-completion.ts`).
  - Public Profile Showcase (`/profile/[username]` & `/u/[username]`): Highlights hackathon winnings, project submissions, participation history, and shareable certificates (`<CertificateModal />`).

### 3.2. Hackathon Discovery & Directory Engine (`/hackathons` & `/events`)
- **Search & Multi-Dimensional Filtering:**
  - Instant debounced search querying event title, description, tags, and organizer names.
  - Category Filters: `HACKATHON`, `COMPETITION`, `WORKSHOP`, `HIRING_CHALLENGE`, `QUIZ`.
  - Format Filters: `ONLINE`, `OFFLINE`, `HYBRID`.
  - Status Indicators: `LIVE`, `REGISTRATION_OPEN`, `REGISTRATION_CLOSED`, `COMPLETED`.
  - Sorting Options: `newest`, `deadline`, `popular`, `prize_high_to_low`.
- **Display Modes:**
  - Responsive 3-column glassmorphic cards grid.
  - Streamlined compact list view.
  - Interactive cards with countdown timers, prize badges, and bookmarking.

### 3.3. Hackathon Detail Showcase (`/hackathons/[slug]`)
- **Branded Event Experience:** Dynamic gradient banner, organizer credentials, registration countdown, and prize pool highlight.
- **Comprehensive Tab Navigation:**
  - **Overview:** Tagline, rich HTML description, eligibility rules, tags.
  - **Timeline & Stages:** Step-by-step milestones (Registration, Hackathon Sprints, Judging, Awards).
  - **Prizes & Tracks:** Categorized prize tiers (1st, 2nd, 3rd, Track Bounties, Best Beginner).
  - **Rules & Conduct:** Full guidelines, submission requirements, code of conduct.
  - **Sponsors & Partners:** Tiered sponsor recognition (Title, Associate, Community).
  - **FAQs:** Interactive accordion.
- **Contextual Actions:** Solo registration, team squad creation, join via invite code, project submission modal, bookmark toggle, and social link sharing.

### 3.4. 7-Step Hackathon Hosting & Delegation Engine (`/host`)
A comprehensive wizard for drafting, editing, and delegating hackathon management:
1. **Step 1 — Basic Info:** Event title, slug auto-generation, tagline, host organization, host type (`COLLEGE`, `COMPANY`, `COMMUNITY`), category, format, and venue picker.
2. **Step 2 — Schedule & Timezone:** Registration start/deadline, event start/end datetimes, timezone selection with automated chronological validation.
3. **Step 3 — Details & Rules:** Rich text editor (`<RichTextEditor />`) for detailed description, eligibility requirements, difficulty level, and tags.
4. **Step 4 — Prizes & Tracks:** Total prize pool calculator, track-specific bounties, sponsor profiles with tiered badges.
5. **Step 5 — Registration Settings:** Capacity limit, pricing (`FREE` vs `PAID` with Razorpay fee configuration), approval mode (`AUTO` vs `MANUAL`), team size limits (min/max), default fields toggle, and dynamic Custom Question Builder (text, textarea, dropdown with options).
6. **Step 6 — Submission Deliverables:** Configurable mandatory and optional deliverables (Title, Description, GitHub repo, Live URL, Demo Video, Pitch Deck, ZIP file).
7. **Step 7 — Organizing Team & Review:** 
   - Co-Host Admin delegation via secure invite links (`/host/[slug]/admin/join/[code]`).
   - Co-Host management table with removal controls and invite code regeneration.
   - Live interactive card preview before publishing.

### 3.5. Paid Events & Financial Settlement Engine
- **Razorpay Integration:**
  - Server-side order creation (`/api/payments/create-order`).
  - Seamless Razorpay Checkout modal on the registration flow.
  - HMAC-SHA256 signature verification (`/api/payments/verify`).
  - Webhook listener (`/api/webhooks/razorpay`) ensuring payment status reconciliation even if client drops connection.
  - Order audit logging in `public.payments` table.

### 3.6. Squad Formation & Hacker Matchmaking (`/teammates` & `/hackathons/[slug]/invite`)
- **Squad Formation:** Team creation tied to specific hackathons with customizable squad names and skill requisites.
- **Cryptographic Invites:**
  - 24-byte hex token generation (`gen_random_bytes(24)`).
  - Transactional HTML email dispatch via Nodemailer (`/api/invite-email`).
  - Deep-link invite acceptance engine (`/hackathons/[slug]/invite?token=[token]`).
- **Hacker Matchmaking Arena (`/teammates`):**
  - Public directory of hackers marked open for teams (`openForTeams = true`).
  - Domain search (`Frontend`, `Backend`, `AI/ML`, `Blockchain`, `Mobile`).
  - Direct squad invite modal.

### 3.7. Organizer Operations & Applicant Management (`/dashboard/events/[id]/*`)
- **Registration Roster (`/registrations`):**
  - Comprehensive table with search, status filters (Pending, Approved, Rejected, Waitlisted).
  - Instant status change toggles.
  - Custom questions viewer modal.
  - 1-Click CSV export containing applicant details, team members, and custom answers.
- **Submissions Manager (`/submissions`):**
  - Project review table with direct GitHub, Live Demo, and Video links.
  - Qualitative scoring and track evaluations.
- **Mass Participant Communications:**
  - Event broadcast email tool (`/api/event-broadcast-email`) for instant updates.
  - Live event banner broadcast (`/api/events/broadcast-live`).

### 3.8. Two-Phase RSVP Attendance System (`/rsvp` & `/confirm-rsvp`)
- **Pre-Event Confirmation:** Automatic RSVP invitation sent to approved participants 48-72 hours prior to offline events.
- **QR / Token Verification:** Secure verification endpoint (`/api/rsvp`) that confirms attendance, updates badge state, and prevents venue overcrowding.

### 3.9. Automated Google Sheets Synchronization
- Bi-directional sync connecting Supabase database events with organizers' private Google Sheets via webhook endpoints (`/api/webhooks/supabase-to-sheets` & `/api/admin/sync-sheets`).
- Eliminates manual CSV exports during rapid on-ground check-ins.

### 3.10. Campus Ambassador (CSAP) & Club Network
- **CSAP Console (`/admin-csap`):** Ambassador verification, referral link tracking, and leaderboard points management protected by HMAC session cookies.
- **Campus Club Network (`/clubs`):** Directory of partner student clubs with partnership application flow (`/api/clubs/apply`).
- **Mentorship Portal (`/mentor`):** Directory of industry mentors and booking workflows (`/api/mentor-application`).

### 3.11. Content & Editorial Engine (`/blogs`)
- Comprehensive blog platform featuring tech articles, hackathon guides, and winner spotlights.
- Built-in writer studio (`/blogs/write`) with markdown formatting, cover image uploads, and SEO slug generation.

---

## 4. Non-Functional Requirements

| Metric | Target | Verification Method |
| :--- | :--- | :--- |
| **First Contentful Paint (FCP)** | `< 1.2s` | Lighthouse & Core Web Vitals |
| **Time to Interactive (TTI)** | `< 2.0s` | Turbopack / Next.js Bundle Analyzer |
| **Search Debounce Latency** | `150ms` | Client-side reactive input tests |
| **Database Query SLA (P95)** | `< 80ms` | Supabase Postgres query insights & B-Tree indexes |
| **Uptime & Resilience** | `99.9%` | Dual-Tier fallback engine (`lib/storage.ts`) |
| **Mobile Responsiveness** | Fully responsive from 375px up | Cross-device testing (iOS Safari, Android Chrome) |
| **Security & Privacy** | Strict RLS on all tables, server-only secret keys | Automated security audits & API auth guards |
