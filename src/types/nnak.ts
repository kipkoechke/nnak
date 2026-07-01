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
  /** Subscription lifecycle — surfaced on GET /profile. `current_subscription`
   *  is the paid term covering today; `pending_subscription` is a future-dated
   *  extension awaiting payment. `coverage_active` is the authoritative "is the
   *  member active right now" flag (independent of any pending extension). */
  subscription_status?: SubscriptionStatusKey | string;
  coverage_active?: boolean;
  current_coverage_end_date?: string | null;
  subscription_ends_on?: string | null;
  current_subscription?: MemberSubscription | null;
  pending_subscription?: MemberSubscription | null;
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
  professional_cadre: string | null;
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

export interface BranchDetailMember {
  id: string;
  user_id: string;
  name?: string | null;
  email?: string | null;
  account_number?: string | null;
  membership_number?: string | null;
  nck_number?: string | null;
  designation?: string | null;
  chapter?: string | null;
  chapter_label?: string | null;
  is_approved: boolean;
  subscription_active: boolean;
  pending_invoices_total?: number;
  member_category?: { id: string; name: string } | null;
}

export interface Branch {
  id: string;
  name: string;
  employer_type?: string;
  employer_type_label?: string;
  commission_type?: string;
  commission_type_label?: string;
  commission_value?: string;
  county?: string;
  chair_user_id?: string | null;
  secretariat_user_id?: string | null;
  member_count?: number;
  members_count?: number;
  manager?: { id: string; name: string; email?: string | null } | null;
  members?: BranchDetailMember[];
  created_at: string;
  updated_at: string;
}

// Events --------------------------------------------------
export type EventType = "conference" | "workshop" | "cpd" | "agm" | "training";
export type EventStatus =
  | "draft"
  | "published"
  | "closed"
  | "completed"
  | "cancelled";

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
  amount_paid?: string | number;
  pending_amount?: string | number;
  status: boolean;
  issue_date: string;
  due_date: string;
  paid_at: string | null;
  payments: SubscriptionPayment[];
}

export interface SubscriptionPayment {
  id: string;
  amount: string | number;
  payment_method?: string | null;
  payment_reference?: string | null;
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
  /** Legacy single-subscription field; superseded by current/pending below. */
  subscription?: MemberSubscription | null;
  /** Authoritative subscription lifecycle (mirrors GET /profile). */
  coverage_active?: boolean;
  current_coverage_end_date?: string | null;
  subscription_ends_on?: string | null;
  current_subscription?: MemberSubscription | null;
  pending_subscription?: MemberSubscription | null;
}

// ── Admin: create branch payload ───────────────────────────────────
export interface CreateBranchInput {
  name: string;
  employer_type: EmployerType | string;
  commission_type: string;
  commission_value: string;
  branch_manager_email: string;
  branch_manager_name: string;
  branch_manager_phone: string;
}

// ── Admin: verify branch manager (POST /admin/branches/verify) ─────
// Two separate requests: first with email_otp, then with phone_otp.
export interface BranchVerifyManagerInput {
  pending_token: string;
  email_otp?: string;
  phone_otp?: string;
}

// ── Branch invites & transfers ─────────────────────────────────────
export type InviteStatus = "pending" | "accepted" | "rejected" | "expired";

export interface BranchMemberBrief {
  id: string;
  name: string;
  email?: string | null;
  membership_number?: string | null;
}

export interface BranchBrief {
  id: string;
  name: string;
  county?: string | null;
  employer_type?: string;
  employer_type_label?: string;
  commission_type?: string;
  commission_type_label?: string;
  commission_value?: string;
}

export interface BranchInvite {
  id: string;
  type?: string;
  status: InviteStatus | string;
  message?: string | null;
  initiated_by?: string | null;
  actioned_at?: string | null;
  created_at: string;
  expires_at?: string | null;
  /** Admin endpoint uses to_branch; branch-manager endpoint uses branch */
  to_branch?: BranchBrief | null;
  branch?: BranchBrief | null;
  /** Admin endpoint uses user; branch-manager endpoint uses member */
  user?: { id: string; name: string; email?: string | null } | null;
  member?: BranchMemberBrief | null;
  invited_by?: { id: string; name: string } | null;
}

export interface BranchTransfer {
  id: string;
  status: InviteStatus | string;
  message?: string | null;
  created_at: string;
  member?: BranchMemberBrief | null;
  from_branch?: BranchBrief | null;
  to_branch?: BranchBrief | null;
  requested_by?: { id: string; name: string } | null;
}

export interface BranchInviteCreateInput {
  membership_number: string;
  message?: string;
}

export interface BranchTransferCreateInput {
  user_id: string;
  message?: string;
}

// ── Branch monthly batches & finance reconciliation ────────────────
export type BatchStatus =
  | "pending"
  | "draft"
  | "submitted"
  | "partially_paid"
  | "paid"
  | "overdue"
  | string;

export interface BranchBatch {
  id: string;
  reference_code: string;
  period: string;
  status: BatchStatus;
  branch?: BranchBrief | null;
  members_count?: number;
  total_collected: string | number;
  commission_amount: string | number;
  branch_share: string | number;
  outstanding: number;
  paid_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface BranchBatchMember {
  id: string;
  user?: { id: string; name: string; email?: string | null } | null;
  amount_paid: string | number;
  commission_amount: string | number;
  commission_type?: string;
  commission_value?: string;
}

export interface BranchBatchDetail extends BranchBatch {
  members?: BranchBatchMember[];
  payments?: {
    id: string;
    amount_paid: string | number;
    payment_reference?: string;
    payment_method?: string;
    paid_at?: string;
    notes?: string | null;
    attachments?: { id: string; url: string; name?: string }[];
  }[];
}

export interface RecordBatchPaymentInput {
  amount_paid: number | string;
  payment_reference: string;
  payment_method: string;
  notes?: string;
  paid_at: string;
  attachments?: File[];
}

// ── Admin dashboard (GET /admin/dashboard?start_date&end_date) ─────
export interface AdminDashboardCategoryRow {
  category_id: string | null;
  category_name: string | null;
  total_members: number;
}
export interface AdminDashboardChapterRow {
  chapter: string;
  chapter_label: string;
  total_members: number;
}
export interface RecentPendingMember {
  id: string;
  name: string;
  email: string;
  email_verified_at: string | null;
  profile: {
    id: string;
    account_number: string;
    phone?: string | null;
    nck_number?: string | null;
    membership_number?: string | null;
    identification_type?: string | null;
    identification_number?: string | null;
    professional_qualification?: string | null;
    professional_cadre?: string | null;
    designation?: string | null;
    date_of_birth?: string | null;
    gender?: string | null;
    chapter?: string;
    chapter_label?: string;
    member_category_id?: string;
    member_category?: { id: string; name: string } | null;
    is_approved: boolean;
    approved_at: string | null;
    user_id: string;
    branch_id: string | null;
    branch?: {
      id: string;
      name: string;
      employer_type?: string;
      employer_type_label?: string;
    } | null;
    subscription_active: boolean;
    subscription_expires_at: string | null;
    active_subscription: unknown;
    created_at: string;
    updated_at: string;
  } | null;
  created_at: string;
  updated_at: string;
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
  chapter_totals: AdminDashboardChapterRow[];
  recent_pending_members: RecentPendingMember[];
  total_collected_amount: string | number;
}

// ── Branch manager dashboard (GET /branch/dashboard?start_date&end_date)
export interface BranchDashboardBranch {
  id: string;
  name: string;
  employer_type?: string | null;
  commission_type?: string | null;
  commission_value?: string | null;
}

export interface BranchDashboardMembers {
  total: number;
  active: number;
  inactive: number;
  pending_approval: number;
  new_this_period: number;
}

export interface BranchDashboardRevenue {
  collected_this_period: string | number;
  pending_invoices_count: number;
  pending_total: string | number;
}

export interface BranchBatchMetrics {
  count: number;
  paid_count: number;
  pending_count: number;
  total_collected: string | number;
  commission: string | number;
  branch_share: string | number;
}

export interface BranchPeriodBatch {
  batch: BranchBatch | null;
  metrics: BranchBatchMetrics;
}

export interface BranchAllTimeBatch {
  total_collected: string | number;
  total_commission: string | number;
  total_branch_share: string | number;
  paid_total: string | number;
  pending_total: string | number;
}

export interface BranchDashboardBatches {
  current_month: BranchPeriodBatch;
  last_month: BranchPeriodBatch;
  all_time: BranchAllTimeBatch;
}

export interface BranchDashboardInvites {
  pending_invites: number;
  pending_transfers: number;
}

export interface BranchDashboardData {
  branch: BranchDashboardBranch;
  date_range: { start: string; end: string };
  members: BranchDashboardMembers;
  revenue: BranchDashboardRevenue;
  batches: BranchDashboardBatches;
  byproduct: { recent_uploads: unknown[] };
  invites: BranchDashboardInvites;
  chapters: AdminDashboardChapterRow[];
  recent_members: RecentPendingMember[];
  trendline?: PaymentTrendPoint[];
  supported_params: string[];
  applied_filters: Record<string, string>;
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
  professional_cadre?: string | null;
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
  professional_cadre: string;
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
    ResultCode?: number | string | null;
    ResultDesc?: string | null;
    message?: string | null;
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

// ── Finance: Members (/finance/members) ───────────────────────────
export interface FinanceMember {
  id: string;
  name: string;
  email: string;
  membership_number: string;
  membership_type: string;
  chapter: string;
  designation: string | null;
  nck_number: string | null;
  branch_name: string | null;
  branch_id: string | null;
  is_active: boolean;
  aging_months: number | null;
  last_coverage_end: string | null;
  created_at: string;
}

// Detail shape: GET /finance/members/{id}
export interface FinanceMemberDetailProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  membership_number: string | null;
  nck_number: string | null;
  membership_type: string | null;
  chapter: string | null;
  designation: string | null;
  professional_qualification: string | null;
  professional_cadre: string | null;
  gender: string | null;
  is_approved: boolean;
  branch: { id: string; name: string } | null;
  active_subscription: {
    id: string;
    membership_type: string | null;
    amount: number;
    start_date: string | null;
    end_date: string | null;
    payment_method: string | null;
  } | null;
  joined_at: string | null;
}

export interface FinanceMemberContribution {
  id: string;
  invoice_number: string;
  amount: number;
  payment_method: string | null;
  payment_reference: string | null;
  membership_type: string | null;
  paid_at: string | null;
}

export interface FinanceMemberPendingInvoice {
  id: string;
  invoice_number: string;
  amount: number;
  due_date?: string | null;
  membership_type?: string | null;
}

export interface FinanceMemberDetail {
  member: FinanceMemberDetailProfile;
  contributions: {
    lifetime_paid: number;
    lifetime_pending: number;
    history: FinanceMemberContribution[];
    pagination?: NnakPagination;
  };
  pending_invoices: FinanceMemberPendingInvoice[];
}

// ── Finance: Branches (/finance/branches) ─────────────────────────
export interface FinanceBranch {
  id: string;
  name: string;
  employer_type: string;
  commission_type: string;
  commission_value: string;
  member_count: number;
  total_paid_branch_share: number;
  pending_branch_share: number;
  created_at: string;
}

export interface FinanceBranchMember {
  id: string;
  account_number: string;
  phone: string | null;
  nck_number: string | null;
  membership_number: string;
  name: string;
  email: string;
  user_id: string;
  branch_id: string;
  chapter: string;
  chapter_label: string;
  member_category: { id: string; name: string } | null;
  is_approved: boolean;
  subscription_active: boolean;
  subscription_expires_at: string | null;
  pending_invoices_total: number;
  created_at: string;
  updated_at: string;
}

export interface FinanceBranchDetail {
  id: string;
  name: string;
  employer_type: string;
  employer_type_label: string;
  commission_type: string;
  commission_type_label: string;
  commission_value: string;
  manager: unknown | null;
  members: FinanceBranchMember[];
  created_at: string;
  updated_at: string;
}

// ── Finance: Payments (/finance/payments) ─────────────────────────
export interface FinancePayment {
  id: string;
  invoice_number: string;
  member_name: string;
  member_email: string;
  membership_number: string;
  branch_name: string | null;
  amount: number;
  paid: number;
  outstanding: number;
  status: string;
  months_unpaid: number;
  payment_method: string | null;
  issue_date: string;
  due_date: string;
  paid_at: string | null;
}

export interface FinancePaymentsSummary {
  total_invoiced: number;
  total_collected: number;
  pending_count: number;
  pending_amount: number;
  collection_rate: number;
}

// ── Finance: Remittances (/finance/remittances) ────────────────────
export interface FinanceRemittanceItem {
  id: string;
  type: string;
  amount: number;
  branch_name?: string | null;
  member_name?: string | null;
  reference?: string | null;
  created_at: string;
}

export interface FinanceRemittanceSummary {
  total: number;
  mpesa: number;
  batch: number;
  count: number;
}

export interface FinanceRemittanceMeta {
  period: string;
  date_range: { start: string; end: string };
  category: string;
  summary: FinanceRemittanceSummary;
  supported_params: string[];
  applied_filters: Record<string, string>;
}

// Monthly payment-status trend (shared by finance + branch dashboards).
export interface PaymentTrendPoint {
  month: string;
  month_label: string;
  fully_paid: number;
  partially_paid: number;
  not_paid: number;
}

// Monthly revenue trend split by member type.
export interface RevenueTrendPoint {
  month: string;
  month_label: string;
  corporate: number;
  individual: number;
  total: number;
}

// ── Finance: Dashboard (/finance/dashboard) ───────────────────────
export interface FinanceDashboardData {
  date_range?: { start: string; end: string };
  members?: {
    total: number; active: number; inactive: number;
    pending_approval: number; new_this_period: number;
    corporate: number; individual: number; nnak_hq?: number;
    aging?: Record<string, number>;
  };
  remittances?: {
    mpesa_collected: number; batch_payments: number; total: number;
    by_category?: { category: string; label: string; amount: number }[];
    corporate?: { label: string; amount: number };
    individual?: { label: string; amount: number };
  };
  payments?: {
    total_invoiced: number; total_collected: number;
    total_invoices?: number; paid_invoices?: number;
    pending_invoices: number; pending_amount: number; collection_rate: number;
    corporate?: { label: string; collected: number; pending_invoices: number };
    individual?: { label: string; collected: number; pending_invoices: number };
  };
  trendline?: PaymentTrendPoint[];
  revenue_trendline?: RevenueTrendPoint[];
  pending_payments_aging?: { buckets: Record<string, number>; total_pending_amount: number };
  branches?: { id: string; name: string; members: number; employer_type: string; commission_type: string; commission_value: string }[];
  recent_members?: {
    id: string; name: string; email: string; membership_number: string;
    membership_type: string; chapter: string; designation: string | null;
    nck_number: string | null; branch_name: string | null; created_at: string;
  }[];
  batches?: {
    this_month: { count: number; paid_count: number; pending_count: number; total_collected: number; commission: number; branch_share: number; hq_share: number };
    all_time: { total_collected: number; total_commission: number; total_branch_share: number; total_hq_share: number; paid_total: number; pending_total: number };
  };
  byproducts?: { id: string; file_name: string; status: string; total_rows: number; processed_rows: number; created_at: string }[];
  supported_params?: string[];
  applied_filters?: Record<string, string>;
}

// ── Finance: Batches (/finance/batches) ───────────────────────────
export interface FinanceBatch {
  id: string;
  reference_code: string;
  period: string;
  branch: {
    id: string;
    name: string;
    employer_type: string;
    employer_type_label: string;
    commission_type: string;
    commission_type_label: string;
    commission_value: string;
    created_at: string;
    updated_at: string;
  };
  total_collected: string;
  commission_amount: string;
  branch_share: string;
  outstanding: number;
  status: string;
  paid_at: string | null;
  members_count: number;
  payments: FinanceBatchPayment[];
  created_at: string;
  updated_at: string;
}

export interface FinanceBatchMember {
  id: string;
  user: { id: string; name: string; email: string };
  amount_paid: string;
  commission_amount: string;
  commission_type: string;
  commission_value: string;
}

export interface FinanceBatchPayment {
  id: string;
  amount_paid: number;
  payment_method: string;
  payment_reference: string;
  notes?: string | null;
  paid_at: string;
}

export interface FinanceBatchDetail extends FinanceBatch {
  members: FinanceBatchMember[];
}

// ── Member Portal: Events (/member/events) ────────────────────────
export interface MemberEvent {
  id: string;
  title: string;
  code?: string | null;
  type: string;
  status: string;
  theme?: string | null;
  description?: string | null;
  location?: string | null;
  start_date: string;
  end_date: string;
  cover_image_url?: string | null;
  is_registered?: boolean;
  registration?: MemberEventRegistration | null;
  created_at: string;
}

export interface MemberEventRegistration {
  id: string;
  status: string;
  paid_at?: string | null;
  amount?: number;
  ticket_number?: string | null;
}

export interface MemberEventPackage {
  id: string;
  event_id?: string;
  name: string;
  description?: string | null;
  /** API returns cost as string e.g. "5000.00" */
  cost?: number | string | null;
  /** Legacy field — prefer cost */
  price?: number | null;
  currency?: string;
  capacity?: number | null;
  available?: number | null;
  features?: string[];
  benefits?: Record<string, string> | null;
  is_available?: boolean;
  is_member_only?: boolean;
  has_limit?: boolean;
  max_entries?: number | null;
}

export interface MemberEventDetail extends MemberEvent {
  location_coordinates?: { lat: number; lng: number } | null;
  metadata?: {
    expected_attendees?: number;
    tracks?: string[];
    cpd_points?: number;
    [key: string]: unknown;
  } | null;
  speakers?: Array<{ id: string; name: string; bio?: string | null; photo_url?: string | null; role?: string | null }>;
  agenda?: Array<{ id: string; title: string; start_time: string; end_time: string; description?: string | null }>;
  packages?: MemberEventPackage[];
}

// ── Institution ───────────────────────────────────────────
export interface Institution {
  id: string;
  name: string;
  code: string;
  category: string;
  type: string;
  location: string | null;
  created_at?: string;
}

// ── Student registration payload ──────────────────────────
export interface StudentRegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  registration_number: string;
  institution_id: string;
}

// ── Student: Bookings (/student/bookings) ──────────────────
export interface StudentBooking {
  id: string;
  event_id: string;
  event_title?: string | null;
  status: string;
  ticket_number?: string | null;
  amount?: number | null;
  paid_at?: string | null;
  event?: { id: string; title: string; start_date: string; end_date: string; location?: string | null } | null;
  package?: MemberEventPackage | null;
  created_at: string;
}

export interface StudentBookingDetail extends StudentBooking {
  payment?: {
    id: string;
    amount: number;
    status: string;
    method?: string | null;
    reference?: string | null;
    paid_at?: string | null;
  } | null;
}
