/**
 * NNAK Digital Platform — domain types
 * Sourced from SRS v2 (NNAK-DSE-SRS-001) and backend /api/v1 docs.
 *
 * Roles align to SRS personas (§2.2) and backend lowercase enum:
 *   super_admin | admin | finance | events | branch_manager | branch | executive | member | student
 *
 * Anything not yet in the backend API doc is marked  // MOCK
 * and served by the in-memory mock store in lib/nnak/mock-store.ts.
 */

export type NnakRole =
  | "super_admin"
  | "admin" // HQ Secretariat (Finance/Accounts, Admin, Assistant Admin)
  | "finance"
  | "events" // Events Coordinator
  | "branch_manager"
  | "branch" // NNAK Branch (Chair/Secretariat)
  | "executive" // NNAK Leadership / National Elected Officials
  | "member"
  | "student";

export type NnakMembershipCategory =
  | "student"
  | "individual"
  | "moh"
  | "county"
  | "parastatal"
  | "private"
  | "fbo";

export type MemberStatus =
  | "pending"
  | "active"
  | "suspended"
  | "inactive"
  | "archived";

export type BillingFrequency = "monthly" | "annual";

export type PaymentMethod = "mpesa" | "byproduct" | "manual";

export type PaymentStatus = "pending" | "successful" | "failed" | "refunded";

export interface NnakUser {
  id: string;
  name: string;
  email: string;
  role: NnakRole;
  email_verified_at: string | null;
  profile?: NnakProfile;
}

export interface NnakProfile {
  id: string;
  user_id: string;
  account_number: string;
  phone: string | null;
  nck_number: string | null;
  license_number: string | null;
  identification_type: "national_id" | "passport" | null;
  identification_number: string | null;
  professional_qualification: string | null;
  date_of_birth: string | null;
  gender: "male" | "female";
  /** Matches /employer-types API values (MOH | Parastatal | Private | FBO | Other).
   *  Falls back to plain string so legacy mock data and future values still type-check. */
  employer_type: string | null;
  employer_name?: string | null;
  county?: string | null;
  photo_url?: string | null;
  member_category_id: string | null;
  member_category?: MemberCategory | null;
  branch_id: string | null;
  branch?: Branch | null;
  status?: MemberStatus;
  joined_at?: string;
  subscription_expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface MemberCategory {
  id: string;
  name: string;
  code: NnakMembershipCategory;
  billing_frequency: BillingFrequency;
  annual_fee: number;
  monthly_fee: number | null;
  description?: string;
  created_at: string;
  updated_at: string;
}

/** From GET /api/v1/employer-types. */
export type EmployerType = "MOH" | "Parastatal" | "Private" | "FBO" | "Other";

export interface Branch {
  id: string;
  name: string;
  /** Matches the /api/v1/branches response. */
  employer_type?: EmployerType | string;
  /** Legacy / mock-only field, retained for backward-compat. */
  county?: string;
  chair_user_id?: string | null;
  secretariat_user_id?: string | null;
  member_count?: number;
  created_at: string;
  updated_at: string;
}

// Events --------------------------------------------------
export type EventType = "conference" | "workshop" | "cpd" | "agm" | "training";
export type EventStatus = "draft" | "published" | "closed" | "completed" | "cancelled";

export interface NnakEvent {
  id: string;
  name: string;
  description: string;
  type: EventType;
  status: EventStatus;
  starts_at: string;
  ends_at: string;
  venue: string;
  capacity: number;
  cover_image_url?: string | null;
  pricing: EventPricingTier[];
  speakers?: EventSpeaker[];
  registrants_count?: number;
  attended_count?: number;
  revenue_total?: number;
  multi_day?: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventPricingTier {
  category_code: NnakMembershipCategory | "non_member";
  fee: number;
}

export interface EventSpeaker {
  name: string;
  title?: string;
  bio?: string;
  photo_url?: string | null;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  user?: NnakUser;
  fee: number;
  payment_status: PaymentStatus;
  payment_id?: string;
  qr_token: string;
  attended: boolean;
  attended_at?: string | null;
  certificate_issued: boolean;
  certificate_url?: string | null;
  created_at: string;
}

// Payments ------------------------------------------------
export interface Payment {
  id: string;
  user_id: string;
  user?: NnakUser;
  amount: number;
  currency: "KES";
  method: PaymentMethod;
  status: PaymentStatus;
  reference: string; // M-Pesa code, by-product batch id, etc.
  purpose: "subscription" | "event" | "other";
  related_id?: string | null; // event_id or subscription_id
  receipt_url?: string | null;
  paid_at: string;
  created_at: string;
}

// By-product reconciliation -------------------------------
export interface ByProductUpload {
  id: string;
  branch_id: string;
  branch?: Branch;
  uploaded_by: string;
  period_month: string; // YYYY-MM
  total_records: number;
  matched: number;
  flagged: number; // members not in remittance
  total_amount: number;
  status: "processing" | "completed" | "error";
  created_at: string;
}

export interface ByProductLine {
  id: string;
  upload_id: string;
  member_id?: string | null;
  national_id?: string | null;
  name: string;
  amount: number;
  matched: boolean;
}

// Reporting -----------------------------------------------
export interface DashboardKpis {
  total_active_members: number;
  new_members_this_month: number;
  revenue_mtd: number;
  overdue_renewals: number;
  upcoming_events: number;
  attendance_rate_30d: number;
  by_category: { category: string; count: number }[];
  revenue_trend: { period: string; revenue: number }[];
  membership_growth: { period: string; count: number }[];
}

// ILM -----------------------------------------------------
export interface AuditLogEntry {
  id: string;
  user_id: string;
  user_email?: string;
  action: string;
  resource: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  occurred_at: string;
}

export interface DataExportRequest {
  id: string;
  requested_by: string;
  approved_by?: string | null;
  scope: string;
  reason: string;
  destination: string;
  status: "pending" | "approved" | "rejected" | "completed";
  approved_at?: string | null;
  created_at: string;
}

export interface ErasureRequest {
  id: string;
  user_id: string;
  user_email?: string;
  reason?: string;
  status: "pending" | "anonymised" | "rejected";
  requested_at: string;
  completed_at?: string | null;
}

// API envelope (Laravel-style)
export interface NnakPaginated<T> {
  data: T[];
  meta: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
    from: number;
    to: number;
  };
}

/** Final response of POST /verify-otp (issues the Sanctum token). */
export interface NnakLoginResponse {
  user: NnakUser;
  token: string;
  type: "Bearer";
  expires_in: number;
  expires_at: string;
  otp?: string | null;
}

/** First-leg response of POST /login and POST /register.
 *  The frontend must follow up with POST /verify-otp { pending_token, otp }
 *  to actually receive a Sanctum token. */
export interface PendingOtpResponse {
  pending_token: string;
  expires_in: number;
  /** OTP returned in dev for testing; production hides it. */
  otp?: string | null;
  user?: { id: string; name: string; email: string };
}

/** Standard backend envelope: { success, message?, data, pagination? }. */
export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: NnakPagination;
}

export interface NnakPagination {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

// ── Workstations (GET/POST/PATCH /member/workstations) ─────────────
export interface Workstation {
  id: string;
  name: string;
  country: string;
  city: string;
  start_date: string; // ISO
  user_id: string;
  created_at: string;
  updated_at: string;
}
export interface WorkstationInput {
  name: string;
  country: string;
  city: string;
  start_date: string; // YYYY-MM-DD
}

// ── Subscriptions & Invoices (GET/POST /member/subscriptions) ──────
export type SubscriptionStatusKey =
  | "pending_payment"
  | "active"
  | "expired"
  | "cancelled";

export interface SubscriptionInvoice {
  id: string;
  invoice_number: string;
  amount: string | number;
  status: boolean;
  issue_date: string;
  due_date: string;
  paid_at: string | null;
  payments: SubscriptionPayment[];
}

export interface SubscriptionPayment {
  id: string;
  amount: string | number;
  reference?: string | null;
  method?: string | null;
  status?: string | null;
  paid_at?: string | null;
}

export interface MemberSubscription {
  id: string;
  amount: string | number;
  payment_method: string | null;
  /** Backend uses a boolean here. true = paid/active. */
  status: boolean;
  start_date: string;
  end_date: string;
  member_category: { id: string; name: string };
  invoice?: SubscriptionInvoice;
  created_at: string;
  updated_at: string;
}

// ── Member dashboard (GET /member/dashboard) ───────────────────────
export interface MemberDashboardData {
  member: { id: string; name: string; email: string };
  account_number: string;
  subscription_status: SubscriptionStatusKey | string;
  subscription?: MemberSubscription | null;
}

// ── Admin: create branch payload ───────────────────────────────────
export interface CreateBranchInput {
  name: string;
  employer_type: EmployerType | string;
  branch_manager_email: string;
  branch_manager_name: string;
  branch_manager_phone: string;
}
