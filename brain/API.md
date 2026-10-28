# Hacker's Unity — Server Route Handlers & API Reference

> **Document Type:** REST API Route Specifications  
> **Target Framework:** Next.js 16 App Router Route Handlers (`app/api/*`)  
> **Authentication Helper:** `@/lib/api-auth` (`authenticateRequest`, `createAdminClient`)  
> **Version:** 2.6.0  
> **Last Updated:** October 2026  

---

## 1. Authentication & Security Headers

All protected endpoints require either:
1. Valid session cookie (`sb-*-auth-token`) set by Supabase Auth, OR
2. Bearer token in the `Authorization` header (`Bearer <access_token>`).

Authentication status is extracted server-side via `authenticateRequest(req)`. When elevated access is needed, handlers use `createAdminClient()` (Service Role Key) to bypass Row Level Security.

---

## 2. Event Management & Co-Hosting Endpoints

### 2.1. `GET /api/events/team`
Retrieves the organizing team (owner and co-host admins) for an event, or resolves a public invite code.

- **Query Parameters:**
  - `eventId`: (Optional) Event slug or UUID (Requires Auth as Owner/Co-Host/Super Admin).
  - `code`: (Optional) Secret admin invite code (Public/Semi-public for invite acceptance preview).
- **Response Shape (Team View):**
  ```json
  {
    "success": true,
    "event": { "id": "evt_ai_...", "slug": "sphinx-26", "title": "SPHINX '26" },
    "isOwner": true,
    "isCoHost": false,
    "inviteCode": "hu_adm_9a8f2...",
    "inviteUrl": "https://hackersunity.com/host/sphinx-26/admin/join/hu_adm_9a8f2...",
    "owner": { "id": "...", "name": "Chinmay Bhatt", "email": "chinmaybhatt26@gmail.com" },
    "admins": [
      {
        "id": "...",
        "userId": "...",
        "fullName": "Amit Kumar",
        "email": "amitkumar.projects@gmail.com",
        "role": "ADMIN",
        "joinedAt": "2026-10-18T12:00:00Z"
      }
    ]
  }
  ```

### 2.2. `POST /api/events/team`
Performs team administrative operations.

- **Auth Required:** Yes
- **Actions:**
  - **`action: "join"`**:
    - Request Body: `{ "action": "join", "code": "hu_adm_..." }`
    - Adds the authenticated caller as a Co-Host Admin in `public.event_admins`.
  - **`action: "regenerate_code"`**:
    - Request Body: `{ "action": "regenerate_code", "eventId": "..." }`
    - Generates a new random invite token (`hu_adm_...`), invalidating the prior link. (Owner / Super Admin only).

### 2.3. `DELETE /api/events/team`
Revokes admin access for a co-host.

- **Auth Required:** Yes (Owner, Super Admin, or Self-leaving)
- **Request Body:** `{ "eventId": "...", "adminUserId": "..." }`
- **Rules:** Cannot remove the primary event owner.

### 2.4. `POST /api/events/broadcast-live`
Dispatches a live notification banner across the platform alerting participants that the hackathon is now live.

- **Auth Required:** Yes (Owner or Co-Host)
- **Request Body:** `{ "eventId": "...", "message": "Opening Ceremony has started!" }`

### 2.5. `POST /api/event-broadcast-email`
Sends transactional mass emails to all approved participants of a hackathon.

- **Auth Required:** Yes (Owner or Super Admin)
- **Request Body:** `{ "eventId": "...", "subject": "Important Venue Instructions", "htmlContent": "..." }`

---

## 3. Registrations & Attendance (RSVP)

### 3.1. `POST /api/registrations`
Submits a solo or team hackathon application.

- **Auth Required:** Yes
- **Request Body:**
  ```json
  {
    "eventId": "evt_ai_...",
    "teamId": "optional-uuid",
    "customAnswers": { "q1": "Answer", "q2": "Answer" },
    "promoterCode": "optional-promoter-tag"
  }
  ```
- **Response:** `{ "success": true, "registrationId": "..." }`

### 3.2. `GET /api/rsvp` & `POST /api/rsvp`
Two-phase attendance confirmation for approved hackers prior to offline events.

- **`GET /api/rsvp?eventId=...`**: Fetches user's RSVP status (`NOT_CONFIRMED`, `RSVP_CONFIRMED`).
- **`POST /api/rsvp`**:
  - Request Body: `{ "eventId": "...", "confirmAttendance": true, "dietaryRequirements": "..." }`
  - Updates `registrations.attendance_status = 'RSVP_CONFIRMED'`.

---

## 4. Submissions & Scoring Endpoints

### 4.1. `POST /api/submissions`
Creates or updates a hackathon project submission.

- **Auth Required:** Yes (Must be approved participant/team leader)
- **Request Body:**
  ```json
  {
    "eventId": "...",
    "teamId": "...",
    "title": "QuantumPulse",
    "tagline": "AI-Powered Medical Diagnostic Assistant",
    "description": "...",
    "track": "Healthcare & AI",
    "githubUrl": "https://github.com/...",
    "demoUrl": "https://quantumpulse.vercel.app",
    "videoUrl": "https://youtube.com/watch?v=...",
    "deckUrl": "https://pitch.com/..."
  }
  ```

### 4.2. `GET /api/submissions/csv?eventId=...`
Generates a downloadable CSV spreadsheet of all project submissions for judges and organizers.

- **Auth Required:** Yes (Event Owner, Co-Host, or Super Admin)
- **Headers:** `Content-Type: text/csv`, `Content-Disposition: attachment; filename="submissions.csv"`

---

## 5. Payments & Financial Endpoints (Razorpay)

### 5.1. `POST /api/payments/create-order`
Creates a Razorpay payment order for paid hackathon tickets.

- **Auth Required:** Yes
- **Request Body:** `{ "eventId": "...", "amount": 499 }`
- **Response:** `{ "orderId": "order_...", "amount": 49900, "currency": "INR", "key": "rzp_..." }`

### 5.2. `POST /api/payments/verify`
Validates Razorpay HMAC-SHA256 signature and marks registration as paid.

- **Request Body:**
  ```json
  {
    "razorpay_order_id": "order_...",
    "razorpay_payment_id": "pay_...",
    "razorpay_signature": "...",
    "eventId": "..."
  }
  ```

### 5.3. `POST /api/webhooks/razorpay`
Asynchronous server-to-server webhook endpoint capturing payment status events (`payment.captured`, `payment.failed`).

- **Verification:** `X-Razorpay-Signature` HMAC header check.

---

## 6. Integrations & Administration

### 6.1. `POST /api/admin/sync-sheets`
Synchronizes event registration records directly to the organizer's configured Google Sheet via Google Apps Script.

### 6.2. `POST /api/ai/groq`
Executes AI-powered product evaluation on project submissions using Groq Llama 3 70B (`brain/judging_evolution.md`).

### 6.3. `POST /api/utm/click`
Logs marketing campaign link clicks and ambassador referral traffic.

### 6.4. `GET /api/users/search?q=...`
Instant lookup for developer profiles, usernames, and skills for teammate matching.
