# Security Best Practices Review Report

## Executive Summary
This codebase has one critical privilege escalation path and several high-risk configuration and workflow issues in public endpoints. The most urgent fix is to block public `admin` role registration, then lock down unauthenticated diagnostic/migration routes and replace state-changing `GET` token flows with one-time, expiring `POST` flows.

## Scope
- Backend: Express/TypeScript in `server/src`
- Frontend: React/TypeScript in `seal-guardian-58321-main/src`
- Review focus: secure-by-default posture and exploitability of current code paths

## Critical Findings

### SBP-001: Public users can self-register as `admin` (privilege escalation)
- Severity: Critical
- Location: `server/src/utils/schemas.ts:44`, `server/src/controllers/auth.controller.ts:23`, `server/src/controllers/auth.controller.ts:243`, `server/src/controllers/auth.controller.ts:316`, `seal-guardian-58321-main/src/pages/Register.tsx:43`, `seal-guardian-58321-main/src/pages/Register.tsx:239`
- Evidence:
  - Public registration schema allows `role: 'admin'`.
  - OTP verification persists `pending.role` directly into `user_roles`.
  - Non-vendor branch immediately signs JWT using that role.
  - Frontend role is query-driven (`?role=...`) and sent to backend.
- Impact: Any unauthenticated user can create an administrator account and gain full admin API access.
- Fix:
  - Remove `admin` from public registration schema/flow (allow only `customer`, `vendor`).
  - Enforce server-side allowlist in controller regardless of frontend input.
  - Keep admin creation only behind authenticated admin endpoint (`/api/admin/admins`).
  - Add a regression test that registration with `role=admin` is rejected.

## High Findings

### SBP-002: Unauthenticated migration endpoint can alter production schema
- Severity: High
- Location: `server/src/routes/public.routes.ts:33`, `server/src/controllers/diagnostic.controller.ts:57`, `server/src/controllers/diagnostic.controller.ts:69`
- Evidence:
  - Public route exposes `/api/public/migrate` without auth.
  - Handler executes `ALTER TABLE` statements.
- Impact: Any internet client can trigger schema changes, risking data integrity and outage.
- Fix:
  - Remove this route from runtime, or gate by `authenticateToken + requireRole('admin')` and env guard (`NODE_ENV !== 'production'`).
  - Keep migration tooling out of public API surface.

### SBP-003: State-changing token actions are performed via `GET` URLs
- Severity: High
- Location: `server/src/routes/public.routes.ts:35`, `server/src/routes/public.routes.ts:36`, `server/src/routes/vendor.routes.ts:8`, `server/src/controllers/public.controller.ts:132`, `server/src/controllers/public.controller.ts:206`, `server/src/controllers/vendor.controller.ts:10`, `server/src/services/email.service.ts:248`, `server/src/services/email.service.ts:850`
- Evidence:
  - `GET` endpoints mutate state (verify/reject/approve flows) using query tokens.
  - Email links embed tokens in URL query strings.
- Impact: Link prefetchers/scanners can trigger approvals/rejections unintentionally; tokens leak via logs/history/referrers.
- Fix:
  - Use `GET` only for confirmation page; perform mutation via `POST` with one-time token.
  - Store hashed token + `expires_at` + `used_at`; reject replay/expired tokens.
  - Prefer short TTLs and explicit user confirmation.

### SBP-004: JWT secret fallback to hardcoded `'your-secret-key'`
- Severity: High
- Location: `server/src/controllers/warranty.controller.ts:190`, `server/src/controllers/public.controller.ts:141`, `server/src/controllers/public.controller.ts:215`, `server/src/controllers/public.controller.ts:418`
- Evidence:
  - Multiple sign/verify operations fallback to a known static secret.
- Impact: If `JWT_SECRET` is unset/misconfigured, tokens become trivially forgeable.
- Fix:
  - Remove all fallback secrets.
  - Validate required secrets at startup and crash fast if missing.

## Medium Findings

### SBP-005: Socket.io allows all origins
- Severity: Medium
- Location: `server/src/socket.ts:13`
- Evidence:
  - Socket server uses `origin: "*"`.
- Impact: Increases cross-origin abuse surface and connection probing; weak origin control for real-time channel.
- Fix:
  - Reuse strict origin allowlist from HTTP CORS env config.
  - Restrict methods/transports as required.

### SBP-006: Auth token persisted in `localStorage`
- Severity: Medium
- Location: `seal-guardian-58321-main/src/lib/api.ts:19`, `seal-guardian-58321-main/src/lib/api.ts:39`, `seal-guardian-58321-main/src/contexts/AuthContext.tsx:79`
- Evidence:
  - Access token read/written from `localStorage`.
- Impact: Any successful XSS can exfiltrate bearer tokens.
- Fix:
  - Move auth to HttpOnly, Secure, SameSite cookies with short-lived access tokens + rotation.
  - If migration is staged, tighten CSP and reduce token lifetime immediately.

### SBP-007: Public assignment tokens appear long-lived and reusable
- Severity: Medium
- Location: `server/src/controllers/grievance.controller.ts:1193`, `server/src/controllers/grievance.controller.ts:1232`, `server/src/services/assignment-scheduler.service.ts:112`, `server/src/services/assignment-scheduler.service.ts:136`
- Evidence:
  - Update token is used directly with no expiry/one-time checks.
  - Scheduler intentionally reuses same token in follow-up emails.
- Impact: A leaked old email link can continue to mutate grievance state.
- Fix:
  - Add `expires_at` and `used_at` semantics (or rolling token per follow-up).
  - Validate allowed status transitions and invalidate token after completion.

## Low Findings

### SBP-008: Internal diagnostics and error details are exposed publicly
- Severity: Low
- Location: `server/src/routes/public.routes.ts:34`, `server/src/controllers/public.controller.ts:116`, `server/src/controllers/public.controller.ts:128`, `server/src/controllers/public.controller.ts:198`, `server/src/controllers/vendor.controller.ts:346`, `server/src/controllers/diagnostic.controller.ts:86`
- Evidence:
  - Public schema-inspection endpoint.
  - Error responses embed raw `error.message`/`sqlMessage` in public-facing responses.
- Impact: Increases reconnaissance value for attackers.
- Fix:
  - Remove debug endpoints from public API.
  - Return generic errors externally; log detailed diagnostics server-side only.

## Secure-by-Default Improvement Plan (Priority Order)
1. Block admin self-registration immediately (SBP-001).
2. Remove/lock migration and schema diagnostic routes (SBP-002, SBP-008).
3. Replace all state-changing email-link `GET` flows with expiring one-time `POST` confirmations (SBP-003, SBP-007).
4. Enforce mandatory secret configuration at startup; remove fallback secrets (SBP-004).
5. Tighten real-time and frontend auth posture (SBP-005, SBP-006).
