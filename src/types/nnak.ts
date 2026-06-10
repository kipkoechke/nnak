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
  license_number?: string | null;
  membership_number?: string | null;
  /** Backend may send canonical lower-case or human-friendly "National ID". */
  identification_type: string | null;
  identification_number: string | null;
  professional_qualification: string | null;
  date_of_birth: string | null;
  /** Backend currently sends "male" | "female" | "other"; future may extend. */
  gender: string;
  /** Approval flags from /members + /members/pending. */
  is_approved?: boolean;
  approved_at?: string | null;
  approved_by?: string | null;
  is_verified?: boolean;
  verified_at?: string | null;
  verified_by?: string | null;
  designation?: string | null;
  chapter?: string | null;
  chapter_label?: string | null;
  member_category_name?: string | null;
  /** /member/dashboard surfaces these too. */
  subscription_active?: boolean;
  active_subscription?: unknown | null;
  /** Matches /employer-types API values (MOH | Parastatal | Private | FBO | Other).
   *  Falls back to plain string so legacy mock data and future values still type-check. */
  employer_type?: string | null;
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
  deleted_at?: string | null;
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
  employer_type?: string;
  employer_type_label?: string;
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

export interface EventLocationCoordinates {
  lat: number;
  lng: number;
}

export interface NnakEvent {
  id: string;
  code: string;
  title: string;
  theme?: string | null;
  description: string;
  type: EventType;
  status: EventStatus;
  start_date: string;
  end_date: string;
  location: string;
  location_coordinates?: EventLocationCoordinates | null;
  metadata?: Record<string, unknown> | null;
  cover_image_url?: string | null;
  banner_image_url?: string | null;
  pricing?: EventPricingTier[];
  speakers?: EventSpeaker[];
  agendas?: Agenda[];
  sponsors?: Sponsor[];
  exhibitors?: Exhibitor[];
  registrants_count?: number;
  attended_count?: number;
  revenue_total?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateEventInput {
  code: string;
  title: string;
  theme?: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  location_coordinates?: EventLocationCoordinates;
  type: EventType;
  metadata?: Record<string, unknown>;
  cover_image_url?: string;
  banner_image_url?: string;
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

// ── Agendas ──────────────────────────────────────────────
export interface Agenda {
  id: string;
  event_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  type: "keynote" | "panel" | "workshop" | "breakout" | "general";
  metadata?: Record<string, unknown> | null;
  event?: NnakEvent;
  speakers?: AgendaSpeaker[];
  breakout_rooms?: BreakoutRoom[];
  created_at: string;
  updated_at: string;
}

export interface CreateAgendaInput {
  event_id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  type: string;
  metadata?: Record<string, unknown>;
}

// ── Speakers ─────────────────────────────────────────────
export interface Speaker {
  id: string;
  name: string;
  title: string;
  organization: string;
  bio: string;
  photo_url?: string | null;
  links?: Record<string, string> | null;
  event_id: string;
  metadata?: Record<string, unknown> | null;
  event?: NnakEvent;
  created_at: string;
  updated_at: string;
}

export interface CreateSpeakerInput {
  name: string;
  title: string;
  organization: string;
  bio: string;
  photo_url?: string;
  links?: Record<string, string>;
  event_id: string;
  metadata?: Record<string, unknown>;
}

// ── Agenda Speakers ──────────────────────────────────────
export interface AgendaSpeaker {
  id: string;
  agenda_id: string;
  speaker_id: string;
  role: string;
  metadata?: Record<string, unknown> | null;
  agenda?: Agenda;
  speaker?: Speaker;
  created_at: string;
  updated_at: string;
}

export interface CreateAgendaSpeakerInput {
  agenda_id: string;
  speaker_id: string;
  role: string;
  metadata?: Record<string, unknown>;
}

// ── Breakout Rooms ───────────────────────────────────────
export interface BreakoutRoom {
  id: string;
  name: string;
  description: string;
  tag: string;
  location: string;
  metadata?: Record<string, unknown> | null;
  agenda_id: string;
  agenda?: Agenda;
  speakers?: BreakoutSpeaker[];
  created_at: string;
  updated_at: string;
}

export interface CreateBreakoutRoomInput {
  name: string;
  description: string;
  tag: string;
  location: string;
  metadata?: Record<string, unknown>;
  agenda_id: string;
}

// ── Breakout Room Speakers ───────────────────────────────
export interface BreakoutSpeaker {
  id: string;
  breakout_room_id: string;
  speaker_id: string;
  role: string;
  metadata?: Record<string, unknown> | null;
  breakout_room?: BreakoutRoom;
  speaker?: Speaker;
  created_at: string;
  updated_at: string;
}

export interface CreateBreakoutSpeakerInput {
  breakout_room_id: string;
  speaker_id: string;
  role: string;
  metadata?: Record<string, unknown>;
}

// ── Sponsors ─────────────────────────────────────────────
export interface Sponsor {
  id: string;
  name: string;
  website_url?: string | null;
  category: string;
  is_partner: boolean;
  description: string;
  logo_url?: string | null;
  metadata?: Record<string, unknown> | null;
  event_id: string;
  event?: NnakEvent;
  created_at: string;
  updated_at: string;
}

export interface CreateSponsorInput {
  name: string;
  website_url?: string;
  category: string;
  is_partner: boolean;
  description: string;
  logo_url?: string;
  metadata?: Record<string, unknown>;
  event_id: string;
}

// ── Exhibitors ───────────────────────────────────────────
export interface Exhibitor {
  id: string;
  name: string;
  description: string;
  logo_url?: string | null;
  metadata?: Record<string, unknown> | null;
  event_id: string;
  event?: NnakEvent;
  created_at: string;
  updated_at: string;
}

export interface CreateExhibitorInput {
  name: string;
  description: string;
  logo_url?: string;
  metadata?: Record<string, unknown>;
  event_id: string;
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

// M-Pesa transactions ---------------------------------------
export interface MpesaTransaction {
  id: string;
  TransID: string;
  TransactionType: string;
  TransTime: string | null;
  TransAmount: string;
  BusinessShortCode: string | null;
  BillRefNumber: string | null;
  InvoiceNumber: string | null;
  ThirdPartyTransID: string | null;
  MSISDN: string;
  FirstName: string | null;
  OrgAccountBalance: string | null;
  MpesaReceiptNumber: string;
  CheckoutRequestID: string | null;
  MerchantRequestID: string | null;
  invoice_id: string | null;
  invoice_payment_id: string | null;
  status: string;
  ResultCode: number | null;
  ResultDesc: string | null;
  used: boolean;
  payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface MpesaTransactionListParams {
  page?: number;
  per_page?: number;
  transaction_type?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  used?: boolean | string;
  search?: string;
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
  otp?: string | null;
  email_otp?: string | null;
  phone_otp?: string | null;
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
  county: string;
  start_date: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}
export interface WorkstationInput {
  name: string;
  country: string;
  county: string;
  start_date: string;
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

// ── Admin dashboard (GET /admin/dashboard?start_date&end_date) ─────
export interface AdminDashboardCategoryRow {
  category_id: string | null;
  category_name: string | null;
  total_members: number;
}
export interface AdminDashboardData {
  start_date: string;
  end_date: string;
  supported_params: string[];
  applied_filters: Record<string, string>;
  total_members: number;
  active_members: number;
  inactive_members: number;
  pending_approval_members: number;
  new_members_in_range: number;
  member_category_totals: AdminDashboardCategoryRow[];
  total_collected_amount: number;
}

// ── Branch manager dashboard (GET /branch/dashboard?start_date&end_date)
export interface BranchDashboardData {
  branch_id: string;
  branch_name: string;
  start_date: string;
  end_date: string;
  supported_params: string[];
  applied_filters: Record<string, string>;
  total_members: number;
  active_members: number;
  inactive_members: number;
  pending_approval_members: number;
  member_category_totals: AdminDashboardCategoryRow[];
  total_collected_amount: number;
}

// ── Pending profile (GET /members/pending) ────────────────────────
export interface PendingMemberProfile {
  id: string;
  account_number: string;
  phone?: string | null;
  nck_number?: string | null;
  membership_number?: string | null;
  identification_type?: string | null;
  identification_number?: string | null;
  professional_qualification?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  user_id: string;
  branch_id: string | null;
  member_category_id: string | null;
  is_approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  user?: { id: string; name: string; email: string; role?: string };
  branch?: Branch | null;
  member_category?: {
    id: string;
    code?: string;
    name: string;
    description?: string;
    subscription_fee?: string;
    billing_frequency?: string;
    is_active?: boolean;
  } | null;
}

// ── Branch manager: add member payload (POST /branch/members) ─────
export interface BranchAddMemberInput {
  name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  nck_number: string;
  identification_type: string;
  identification_number: string;
  professional_qualification: string;
  designation?: string;
  place_of_work?: string;
  county?: string;
  employer_type?: string;
  chapter?: string;
}

// ── Branch manager: verify member (POST /branch/members/verify) ───
export interface BranchVerifyMemberInput {
  pending_token: string;
  email_otp: string;
  phone_otp: string;
}

// ── Finance: by-product upload (POST /byproduct/upload) ───────────
export interface ByProductUploadInput {
  /** File handle (csv / xlsx / xls) — sent as multipart/form-data. */
  file: File;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
}
export interface ByProductUploadRecord {
  id: string;
  uploaded_by?: string;
  branch_id?: string | null;
  file_name?: string;
  file_path?: string;
  status: string;
  start_date: string;
  end_date: string;
  total_rows?: number;
  processed_rows?: number;
  failed_rows?: number;
  skipped_count?: number;
  errors?: string | null;
  created_at: string;
  updated_at: string;
}

// ── Member invoice M-Pesa STK Push ─────────────────────────────────
export interface InvoiceStkPushInput {
  phone_number: string;
}

export interface InvoiceStkPushResponse {
  success: boolean;
  message: string;
  data: {
    invoice_id: string;
    invoice_amount: string;
    invoice_number: string;
  };
}

// ── Member invoice M-Pesa STK Query ────────────────────────────────
export interface InvoiceStkQueryResponse {
  success: boolean;
  message: string;
  data: {
    invoice_id: string;
    checkout_request_id: string;
    status: string;
  };
}

// ── M-Pesa C2B register URLs ───────────────────────────────────────
export interface C2bRegisterUrlsInput {
  validation_url?: string;
  confirmation_url?: string;
}

export interface C2bRegisterUrlsResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}
