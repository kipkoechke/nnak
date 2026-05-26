# NNAK Digital Platform — Frontend

Built on top of the existing admin-ehlsolicitors codebase per SRS
[NNAK-DSE-SRS-001](../Software%20Requirements%20Specification%20v2%20NNAK-DSE-SRS-001.docx).
Legacy modules are untouched; NNAK lives under `/nnak/*`.

## Routes

| Route | Purpose | SRS ref |
|-------|---------|---------|
| `/nnak/login` `/register` `/verify-otp` `/forgot-password` `/reset-password` | Auth + OTP | FR-MP-001/003/004 |
| `/nnak/dashboard` | KPIs + charts | FR-RA-001/002 |
| `/nnak/members` `/[id]` `/new` | Register / approve / suspend / digital ID PDF | FR-MP-001/005/009/015/017 |
| `/nnak/categories` | Membership categories & tiered fees | FR-MP-002 |
| `/nnak/branches` | Branch register + member counts | FR-RA-004 |
| `/nnak/byproduct` `/[id]` | Branch monthly check-off CSV upload & reconciliation | FR-MP-010 |
| `/nnak/events` `/[id]` `/new` | Create / publish / view registrants / issue certificates | FR-EM-001..013 |
| `/nnak/checkin` | QR-token check-in | FR-EM-008/009 |
| `/nnak/payments` | Payment history | FR-RA-005 |
| `/nnak/reports` | Member / financial / event CSV exports | FR-RA-005..009 |
| `/nnak/ilm/audit` | Immutable audit log | ILM-004 |
| `/nnak/ilm/exports` | Bulk export approval workflow | ILM-007 |
| `/nnak/ilm/erasure` | DPA 2019 §40 anonymisation | ILM-005 |

## Roles (RBAC)

Defined in [src/lib/nnak/rbac.ts](../src/lib/nnak/rbac.ts):

| Role | Persona (SRS §2.2) |
|------|---------------------|
| `super_admin` | DSE / NNAK System Admin |
| `admin` | HQ Secretariat |
| `finance` | Finance Officer |
| `events` | Events Coordinator |
| `branch_manager` / `branch` | NNAK Branch leadership |
| `executive` | NNAK National Executive (read-only KPIs) |
| `member` / `student` | End users |

Middleware (`middleware.ts`) enforces role gating per route prefix.

## Mock backend

Endpoints not yet exposed by the backend `/api/v1` are served by
[src/lib/nnak/mock-store.ts](../src/lib/nnak/mock-store.ts) — an in-memory
store persisted to `localStorage` so demo state survives reloads. Each mocked
service file links to its suggested HTTP contract; replace `mockStore.*` with
`nnakApi.get/post/...` once the backend lands.

Currently mocked: member-categories CRUD, member approval/status, events
CRUD/registration/check-in/certificate, payments (incl. simulated M-Pesa STK
push), by-product upload+reconciliation, KPIs, audit log, data-export approval,
erasure requests.

Real `/api/v1` endpoints are used for: auth (login, register, OTP, password
flows, profile, logout, refresh), users CRUD, user-profiles CRUD, branches.

## Auth storage

NNAK auth state is kept separate from the legacy `ehl_user` session:
- `localStorage["nnak_user"]` — full user object
- `localStorage["nnak_token"]` — Sanctum bearer token
- Cookie `nnak_user` (non-HTTP-only) — middleware-readable mini user

`NEXT_PUBLIC_NNAK_API_URL` env var configures the API base URL
(default `http://localhost:8000/api/v1`).

## Known gaps / next steps

1. Members module: profile photo upload + NCK number change approval flow (FR-MP-005).
2. Events: speaker management UI (FR-EM-015), multi-day attendance per session
   (FR-EM-014), public registration page (non-member flow).
3. Reports: scheduled email reports (FR-RA-009), historical trend visualisations
   (FR-RA-011), branch-restricted view enforcement (FR-RA-007).
4. Payments: real M-Pesa Daraja STK push (currently simulated). Reconcile
   callbacks. Receipt PDF generation.
5. ILM: automatic 3-year archive job (ILM-006), session timeout enforcement
   (ILM-010) — currently UI only.
6. Renewal reminder emails at 60/30/7 days (FR-MP-012) — needs scheduled job.
7. Replace mock services as backend endpoints come online — search for
   `MOCK` in `src/services/nnak/`.
