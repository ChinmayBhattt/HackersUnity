# Hacker's Unity — Engineering Rules & Code Standards

> **Document Version:** 2.6.0  
> **Applies to:** Entire Monorepo (`apps/web`, `apps/api`, `packages/shared-types`)  
> **Enforcement:** Mandatory for all AI agents, contributors, and core developers  
> **Last Updated:** October 2026  

---

## 1. Core Engineering Principles

1. **Type Safety Across Monorepo Boundaries:** All domain entities, DTOs, and API responses must originate from `packages/shared-types`. Never re-declare ad-hoc types in frontend components or backend controllers.
2. **Dual-Tier Resilience:** Every data mutation and query in the web app should be designed to degrade gracefully. If Supabase is unreachable or missing environment variables in local dev, the app must fall back to `lib/storage.ts` without throwing unhandled exceptions or crashing the UI.
3. **No Silent Failures:** Always wrap asynchronous database and network calls in structured try/catch blocks. Surface human-readable error messages via toasts or form validation states.
4. **Explicit Client/Server Boundaries:** In Next.js 16, be deliberate with `'use client'`. Keep leaf components client-side while keeping layouts, static wrappers, and metadata server-side whenever feasible.

---

## 2. Next.js 16 & React 19 Specific Conventions

### 2.1. Dynamic Route Parameters (`params` are Promises)
In Next.js 16, route parameters (`params`) and search parameters (`searchParams`) are asynchronous Promises. You **MUST** resolve them using React 19 `use()` in Client Components or `await` in Server Components:

```tsx
// ✅ CORRECT (Client Component in Next.js 16)
'use client';
import { use } from 'react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function EventPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  // ...
}
```

```tsx
// ✅ CORRECT (Server Component or Route Handler in Next.js 16)
export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // ...
}
```

```tsx
// ❌ INCORRECT (Will trigger runtime warning/error in Next.js 16)
export default function EventPage({ params }: { params: { slug: string } }) {
  const slug = params.slug; // ERROR: params is a Promise!
}
```

### 2.2. Suspense Wrapping for `useSearchParams`
Any client component calling `useSearchParams()` must be wrapped in a `<Suspense>` boundary to prevent de-opting the entire page into client-side CSR:

```tsx
<Suspense fallback={<LoadingSpinner />}>
  <HostWizardComponent />
</Suspense>
```

---

## 3. Server Route Handlers & Security Architecture

### 3.1. Standardized Server-Side Authentication
Always use the centralized helpers in `@/lib/api-auth`:
- `authenticateRequest(req)`: Validates the caller's Supabase session from HTTP-only cookies or Authorization Bearer tokens.
- `createAdminClient()`: Instantiates the Supabase client with the service role key to perform authorized operations bypassing RLS.
- `unauthorizedResponse()`: Returns standard 401 response.
- `forbiddenResponse()`: Returns standard 403 response.

```ts
import { authenticateRequest, createAdminClient, unauthorizedResponse, forbiddenResponse } from '@/lib/api-auth';

export async function POST(req: Request) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return unauthorizedResponse('You must be signed in.');
  }

  const supabase = createAdminClient();
  // Safe administrative operations...
}
```

### 3.2. Event Authorization Hierarchy
When guarding event management endpoints (`/api/events/*`):
1. **Primary Owner:** `event.organizer_id === auth.userId` (Can edit, delete, regenerate invite links, remove co-hosts).
2. **Co-Host Admin:** Record in `public.event_admins` where `event_id === event.id` and `user_id === auth.userId` (Can edit event, review registrations, view submissions; CANNOT delete event or remove primary owner).
3. **Platform Super Admin:** `auth.user.user_metadata?.role === 'ADMIN'` or `auth.email === process.env.ADMIN_EMAIL`.

### 3.3. Service Role Key Isolation
- `SUPABASE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` is strictly server-only.
- NEVER prefix with `NEXT_PUBLIC_` or import into client components.

---

## 4. TypeScript & Data Contract Rules

1. **Strict Type Checking:** `noImplicitAny: true` is strictly enforced. Avoid using `any`. Use `unknown` with type narrowing or define explicit interfaces.
2. **DTO & Enum Canonical Source:**
   - User Roles: `UserRole` (`PARTICIPANT`, `ORGANIZER`, `ADMIN`, `SUPER_ADMIN`).
   - Event Statuses: `EventStatus` (`DRAFT`, `PUBLISHED`, `REGISTRATION_CLOSED`, `ONGOING`, `COMPLETED`, `ARCHIVED`).
   - Event Formats: `EventType` (`ONLINE`, `OFFLINE`, `HYBRID`).
   - Payment Statuses: `PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`.
3. **Response Envelopes:** Standard API responses should conform to `ApiResponse<T>` from `packages/shared-types`.

---

## 5. Styling & TailwindCSS v4 Conventions

1. **Brand Color Fidelity:** Never invent arbitrary hex codes. Always use the designated brand tokens:
   - Sky Blue: `#00A6DA` / `#0099e6`
   - Signal Orange: `#FF8500` / `#f97316` / `#ea580c`
   - Dark Canvas: `#0c1017` / `#0f172a`
   - Cream: `#EEE5D4` / `#f5f0e8`
   - White: `#FFFFFF`
2. **Dark Mode Parity:** Every UI component must support dark mode classes (`dark:bg-[#0c1017]`, `dark:border-white/[0.08]`, `dark:text-white`, `dark:text-slate-400`).
3. **Mobile-First Layouts:** Design for 375px screens first. Use `sm:`, `md:`, `lg:`, `xl:` responsive prefixes progressively.

---

## 6. Supabase & PostgreSQL Best Practices

1. **Idempotent SQL Scripts:** All migrations must be idempotent:
   ```sql
   CREATE TABLE IF NOT EXISTS public.event_admins (...);
   ALTER TABLE public.events ADD COLUMN IF NOT EXISTS admin_invite_code TEXT;
   DROP POLICY IF EXISTS "Public can view published events" ON public.events;
   CREATE POLICY "Public can view published events" ON public.events ...;
   CREATE INDEX IF NOT EXISTS idx_event_admins_event_user ON public.event_admins (event_id, user_id);
   ```
2. **Mandatory Row Level Security (RLS):** Every single table created in the `public` schema **MUST** have RLS enabled:
   ```sql
   ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;
   ```
3. **Optimized Indexes:** Ensure foreign keys and lookup columns (`slug`, `event_id`, `user_id`, `leader_id`, `status`) have dedicated B-Tree indexes.
4. **Security Definer Functions:** When writing PL/pgSQL functions that bypass RLS (e.g., triggers that update registration counts), declare `SECURITY DEFINER` and specify explicit search paths to prevent search-path injection.
