# Hacker's Unity — Project Memory & Knowledge Base

> **Document Type:** Living Developer & AI Agent Context Repository  
> **Repository:** `hackers-unity`  
> **Current Platform Version:** 2.6.0  
> **Last Updated:** October 2026  

---

## 1. Project Identity & Monorepo Topology

**Hacker's Unity** is an open-innovation hackathon platform and competitive ecosystem for student developers, technical clubs, and hackathon organizers.

### Workspace Mapping
- **Monorepo Root:** `/Users/chinmaybhatt/HackersUnityPlatform`
- **Frontend Web Application (`@hackers-unity/web`):** `apps/web` (Next.js 16.3.1, React 19.2.8, TailwindCSS v4 with `@tailwindcss/postcss`)
- **Backend API Service (`api`):** `apps/api` (NestJS 11.0.1, Express, Jest)
- **Shared Contracts & DTOs (`@hackers-unity/shared-types`):** `packages/shared-types`
- **Database Engine:** PostgreSQL 16 on Supabase (`apps/web/supabase/`) with 25+ production migrations
- **Local Container Infrastructure:** `docker-compose.yml` (Postgres 16, Redis 7, Meilisearch 1.12)

---

## 2. Architecture Decisions Log (ADRs)

### ADR-001: Next.js 16 App Router with React 19 & Turborepo
- **Decision:** Build client apps on Next.js 16 with React 19 and Turborepo for fast caching.
- **Context:** Requires `use(params)` for route parameters in client components because `params` and `searchParams` are Promises in Next.js 16. Server components use `const { slug } = await params;`.
- **Status:** Adopted.

### ADR-002: Dual-Tier Fallback Storage Engine
- **Decision:** All database queries in `lib/supabase-service.ts` are backed by transparent client-side fallbacks in `lib/storage.ts` and `lib/mock-data.ts`.
- **Rationale:** Ensures zero downtime during local development, demo presentations, or network failures. When Supabase is connected, data syncs seamlessly in the background. Cross-tab reactivity is powered by `hackers_unity_storage_change` custom window events.
- **Status:** Adopted.

### ADR-003: 7-Step Modular Event Hosting Architecture
- **Decision:** Event creation and editing in `/host` is partitioned into 7 sequential steps with persistent state, real-time validation, dynamic questionnaire builders, co-host team management, and live card preview before publishing.
- **Status:** Adopted.

### ADR-004: Two-Tier Realtime Notification System
- **Decision:** Segregate notification generation into `public.notifications` (event/news master) and `public.user_notifications` (per-user inbox). Listen to user inboxes using Supabase Realtime WebSockets for instant toast dispatch.
- **Status:** Adopted.

### ADR-005: Cryptographic 24-Byte Hex Squad Invite Tokens
- **Decision:** Squad invitation links use cryptographically secure 24-byte hex tokens (`gen_random_bytes(24)`). Email invitations contain deep links (`/hackathons/[slug]/invite?token=[token]`), processed by `/api/invite-email`.
- **Status:** Adopted.

### ADR-006: Client-Side Canvas Cropping for Image Uploads
- **Decision:** Avatars and banners are cropped in the browser using `react-easy-crop` and HTML5 canvas before uploading to the Supabase `hackathon-assets` storage bucket.
- **Rationale:** Minimizes bandwidth usage, standardizes image aspect ratios (1:1 for avatars, 16:9 for banners), and eliminates server-side image processing bottlenecks.
- **Status:** Adopted.

### ADR-007: Event Co-Host Admin & Delegation System
- **Decision:** Decouple primary event ownership from administrative delegation via `public.event_admins` and dynamic invite links (`/host/[slug]/admin/join/[code]`).
- **Rationale:** Hackathons are organized by teams, not single individuals. Co-hosts can manage registrations, review submissions, and edit details, while only primary owners can delete the event or regenerate admin invite tokens.
- **Status:** Adopted.

### ADR-008: Razorpay Integration for Paid Hackathons
- **Decision:** Implement Razorpay Order creation (`/api/payments/create-order`), client SDK checkout, and server-side HMAC-SHA256 signature verification (`/api/payments/verify` & `/api/webhooks/razorpay`) with idempotency.
- **Status:** Adopted.

### ADR-009: Automated Real-Time Google Sheets Synchronization
- **Decision:** Deliver real-time participant and submission data to organizers' private Google Sheets using Supabase Database Webhooks (`sheets-sync-webhooks.sql`) and Google Apps Script endpoints.
- **Rationale:** Hackathon organizers rely on Google Sheets for offline judging, on-spot check-ins, and discord bot scripts without needing direct database access.
- **Status:** Adopted.

### ADR-010: Stateless HMAC-Signed CSAP Admin Sessions
- **Decision:** Campus Student Ambassador Program (CSAP) admin access uses tamper-proof signed session tokens stored in HTTP cookies (`admin_csap_session`) signed with SHA256 HMAC using the Supabase secret salt.
- **Status:** Adopted.

### ADR-011: Campaign & Ambassador UTM Attribution
- **Decision:** Track hackathon promotional campaigns, campus ambassador links, and social shares using `public.utm_clicks` and `public.utm_stats` (`/api/utm/click` and `/hackathons/[slug]/promoter`).
- **Status:** Adopted.

### ADR-012: Two-Phase RSVP Attendance Confirmation
- **Decision:** In addition to hackathon registration, introduce an RSVP confirmation step (`/rsvp`, `/confirm-rsvp`, `/api/rsvp`) 48-72 hours before the offline event to avoid ghost seats.
- **Status:** Adopted.

### ADR-013: Dynamic Profile Completion Matrix
- **Decision:** Real-time computation of profile completion score (0-100%) in `lib/profile-completion.ts` evaluating 10 key profile vectors (avatar, bio, skills, college/work, GitHub, LinkedIn, etc.).
- **Status:** Adopted.

### ADR-014: AI Judging Engine via Groq Llama 3
- **Decision:** Standardize automated submission scoring on Groq API (Llama 3 70B) focusing on Product-Market Fit, Problem Urgency, Technical Execution, and Business Feasibility (`brain/judging_evolution.md` & `/api/ai/groq`).
- **Status:** Adopted.

---

## 3. Environment Variables Reference

### Frontend (`apps/web/.env.local` or `.env`)
| Variable | Description | Required | Example |
| :--- | :--- | :---: | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Yes | `https://qifwhjfisipxkytsqxez.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public Supabase Anon Key | Yes | `sb_publishable_...` |
| `SUPABASE_SECRET_KEY` | Supabase Service Role Key (Server-only) | Yes | `eyJhbGciOi...` |
| `NEXT_PUBLIC_APP_URL` | Canonical public application URL | Yes | `https://hackersunity.com` |
| `ADMIN_EMAIL` | Platform Super Admin Email | Yes | `chinmaybhatt26@gmail.com` |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Platform Super Admin Public Email | Yes | `chinmaybhatt26@gmail.com` |
| `RAZORPAY_KEY_ID` | Razorpay Merchant Key ID | Optional | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay Merchant Secret | Optional | Server-only secret |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook verification signature secret | Optional | Webhook secret |
| `GROQ_API_KEY` | Groq Llama-3 AI judging API key | Optional | `gsk_...` |
| `SMTP_HOST` | Transactional email SMTP host | Optional | `smtp.gmail.com` / `smtp.resend.com` |
| `SMTP_PORT` | SMTP port | Optional | `587` or `465` |
| `SMTP_USER` | SMTP username / sender account | Optional | `contact@hackersunity.com` |
| `SMTP_PASS` | SMTP application password | Optional | App password |
| `SMTP_FROM` | Outgoing email display name and address | Optional | `Hacker's Unity <notifications@hackersunity.com>` |

---

## 4. Key Route & Feature Map

| Route | Purpose | Access Level | Key Components / Handlers |
| :--- | :--- | :---: | :--- |
| `/` | Landing page | Public | `<HeroSearch />`, `<HackathonCard />`, Stats Ticker |
| `/hackathons` & `/events` | All events directory | Public | Category, format, date filters, grid/list view |
| `/hackathons/[slug]` | Event details & registration hub | Public | Overview, stages, prizes, rules, submission modal |
| `/hackathons/[slug]/register` | Solo & team registration | Auth | 3-step registration wizard, custom forms, payments |
| `/hackathons/[slug]/invite` | Accept/decline squad invitation | Auth | Token validation, quota check, squad join |
| `/hackathons/[slug]/promoter` | Ambassador referral tracker | Public | Custom promoter tracking, redirect |
| `/host` | 7-step Hackathon Host Wizard | Auth | Form builder, date validation, live preview, co-hosts |
| `/host/[slug]/admin/join/[code]` | Accept co-host admin invite | Auth | Event admin validation & `event_admins` insert |
| `/dashboard` | User & organizer portal | Auth | Overview, participations, hosted events, bookmarks |
| `/dashboard/events/[id]/registrations` | Organizer Applicant Manager | Host/Co-Host | Roster table, approve/reject, 1-click CSV export |
| `/dashboard/events/[id]/submissions` | Organizer Submissions Manager | Host/Co-Host | Submission reviews, GitHub/demo links, scoring |
| `/profile/[username]` & `/u/[username]` | Public Developer Profile | Public | Winnings, participations, projects, certificate modal |
| `/rsvp` & `/confirm-rsvp` | Event Attendance RSVP | Auth | RSVP verification, QR confirmation, seats lock |
| `/blogs` & `/blog` | Platform News & Tech Magazine | Public | Editorial articles, categories, share modal |
| `/blogs/write` | Blog Publishing Studio | Admin/Author | Rich-text writer, cover image upload, tags |
| `/clubs` | Campus Club Network | Public | Club network showcase, club partnership application |
| `/mentor` & `/mentor/[slug]` | Mentorship Network | Public | Mentor profiles, booking, mentor application flow |
| `/teammates` | Hacker Matchmaking Arena | Public/Auth | Builder directory, role filters, squad invite modal |
| `/leaderboard` | Global & College Leaderboard | Public | Top builders, college chapters, Elo ratings |
| `/admin-csap` | CSAP Ambassador Console | CSAP Admin | Ambassador roster, points, referral stats |
| `/admin/notifications` | Admin Broadcast Console | Super Admin | Push notifications, live broadcast trigger |
| `/admin/sheets-sync` | Google Sheets Sync Console | Super Admin | Automated webhook synchronization status |
| `/settings` | Profile & Account Settings | Auth | Canvas avatar/banner croppers, academic/work info |
| `/brand-guidelines` | Official Brand Standards | Public | Logos, lockup clearspace, color palette |

---

## 5. Critical Gotchas & Coding Rules for Agents

1. **Next.js 16 Route Params:**
   - In dynamic route files (`[slug]`, `[eventId]`, `[username]`), `params` is a Promise.
   - Always resolve with `const resolvedParams = use(params);` in client components or `const { slug } = await params;` in server components.
2. **`useSearchParams()` Suspense Boundary:**
   - Always wrap components that call `useSearchParams()` inside `<Suspense>` to prevent client de-opt.
3. **TailwindCSS v4 Architecture:**
   - Uses `@tailwindcss/postcss` and `@import "tailwindcss";` in `globals.css`.
   - Theme variables are configured via `@theme inline`. There is no legacy `tailwind.config.js`.
4. **Service Role Key Security:**
   - Never import or use `SUPABASE_SECRET_KEY` in frontend or shared files. Use `createAdminClient()` strictly inside server route handlers (`app/api/*`).
5. **Database Triggers & Atomicity:**
   - Never update `events.registration_count` manually in client code; it is atomically managed via PostgreSQL trigger `trigger_update_registration_count` on `public.registrations`.
6. **Cross-Tab Reactivity:**
   - If updating local fallback state in `lib/storage.ts`, always invoke:
     ```ts
     window.dispatchEvent(new Event('hackers_unity_storage_change'));
     ```
7. **Event Admin Authorization:**
   - An event can be managed by:
     1. Primary Host (`events.organizer_id == userId`)
     2. Co-Host Admin (`public.event_admins` record exists for `event_id` and `user_id`)
     3. Super Admin (`user.user_metadata.role === 'ADMIN'` or `email === process.env.ADMIN_EMAIL`)
