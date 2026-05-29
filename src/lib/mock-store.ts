/**
 * In-memory mock backend for NNAK endpoints not yet exposed by /api/v1.
 * Persisted to localStorage so demo state survives reloads.
 * Replace each `mockX` service call with a real `nnakApi.get/...` when the
 * backend lands.
 */
import type {
  AuditLogEntry,
  Branch,
  ByProductLine,
  ByProductUpload,
  DashboardKpis,
  DataExportRequest,
  ErasureRequest,
  EventRegistration,
  MemberCategory,
  NnakEvent,
  NnakPaginated,
  NnakProfile,
  NnakUser,
  Payment,
} from "@/types/nnak";

// Bump the suffix any time the seed shape changes so existing browsers
// drop their stale cached store and re-seed from the new defaults.
const STORE_KEY = "nnak_mock_store_v3";

interface Store {
  categories: MemberCategory[];
  branches: Branch[];
  members: (NnakUser & { profile: NnakProfile })[];
  events: NnakEvent[];
  registrations: EventRegistration[];
  payments: Payment[];
  byproduct_uploads: ByProductUpload[];
  byproduct_lines: ByProductLine[];
  audit: AuditLogEntry[];
  exports: DataExportRequest[];
  erasures: ErasureRequest[];
}

const now = () => new Date().toISOString();
const uid = () => crypto.randomUUID();

const seed = (): Store => {
  // Categories per the official "NNAK Branch List & Categories" handout.
  const categories: MemberCategory[] = [
    {
      id: uid(),
      name: "Individuals",
      code: "individual",
      billing_frequency: "annual",
      annual_fee: 3000,
      monthly_fee: null,
      description: "All members paying via M-Pesa.",
      created_at: now(),
      updated_at: now(),
    },
    {
      id: uid(),
      name: "Student Nurse",
      code: "student",
      billing_frequency: "annual",
      annual_fee: 500,
      monthly_fee: null,
      description: "Student nurses, registered by the HQ secretariat.",
      created_at: now(),
      updated_at: now(),
    },
    {
      id: uid(),
      name: "Counties Remittance",
      code: "county",
      billing_frequency: "monthly",
      annual_fee: 6000,
      monthly_fee: 500,
      description: "47 Counties NNAK branches paying via monthly check-off.",
      created_at: now(),
      updated_at: now(),
    },
    {
      id: uid(),
      name: "Parastatals Institutions",
      code: "parastatal",
      billing_frequency: "monthly",
      annual_fee: 6000,
      monthly_fee: 500,
      description: "KNH, KMTC, KEMRI, KEMSA, MTRH, KU and UON Clinic.",
      created_at: now(),
      updated_at: now(),
    },
    {
      id: uid(),
      name: "Private Institutions",
      code: "private",
      billing_frequency: "monthly",
      annual_fee: 6000,
      monthly_fee: 500,
      description:
        "Nairobi Hospital, Aga Khan Nairobi & Kisumu, Gertrude's Children's, PNP, Mombasa Private Institutions Branch (MPIB), Avenue Group of Hospitals.",
      created_at: now(),
      updated_at: now(),
    },
    {
      id: uid(),
      name: "Ministry of Health",
      code: "moh",
      billing_frequency: "monthly",
      annual_fee: 6000,
      monthly_fee: 500,
      description:
        "MOH — State Department for Medical Services and Public Health (national facilities, Afya House Blood Bank, Spinal Injury, Mathare Hospital).",
      created_at: now(),
      updated_at: now(),
    },
    {
      id: uid(),
      name: "Faith Based Hospitals",
      code: "fbo",
      billing_frequency: "monthly",
      annual_fee: 6000,
      monthly_fee: 500,
      description: "Mater, AIC Kijabe, PCEA Kikuyu and PCEA TumuTumu.",
      created_at: now(),
      updated_at: now(),
    },
  ];

  // Full branch list per the official handout: 47 counties + 7 private
  // hospital branches + 7 parastatal branches + 4 faith-based + 2 MOH.
  const mkCounty = (name: string): Branch => ({
    id: uid(),
    name: `${name} Branch`,
    county: name,
    member_count: 0,
    created_at: now(),
    updated_at: now(),
  });
  const mkBranch = (name: string): Branch => ({
    id: uid(),
    name,
    member_count: 0,
    created_at: now(),
    updated_at: now(),
  });

  const counties = [
    "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo Marakwet", "Embu",
    "Garissa", "Homabay", "Isiolo", "Kajiado", "Kakamega", "Kericho",
    "Kiambu", "Kilifi", "Mombasa", "Kirinyaga", "Kisii", "Kisumu",
    "Kitui", "Kwale", "Laikipia", "Lamu", "Machakos", "Makueni",
    "Mandera", "Marsabit", "Meru", "Migori", "Muranga", "Nairobi County",
    "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua", "Nyeri",
    "Samburu", "Siaya", "Taita Taveta", "Tana River", "Tharaka Nithi",
    "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot",
  ];

  const privateHospitals = [
    "Aga Khan Kisumu Branch",
    "Aga Khan Nairobi Branch",
    "Avenue Group of Hospitals Branch",
    "Gertrude's Children's Hospital Branch",
    "Mombasa Private Branch",
    "Nairobi Hospital Branch",
    "Nairobi Women Branch",
  ];

  const parastatals = [
    "KEMRI Branch",
    "KEMSA Branch",
    "KMTC Branch",
    "KNH Branch",
    "KU Branch",
    "UON Clinic Branch",
    "MTRH Branch",
  ];

  const faithBased = [
    "Mater Misericordiae Hospital Branch",
    "AIC Kijabe Branch",
    "PCEA Kikuyu Branch",
    "PCEA Tumutumu Branch",
  ];

  const government = [
    "MOH - Medical Services Branch",
    "MOH - Public Health Branch",
  ];

  const branches: Branch[] = [
    ...counties.map(mkCounty),
    ...privateHospitals.map(mkBranch),
    ...parastatals.map(mkBranch),
    ...faithBased.map(mkBranch),
    ...government.map(mkBranch),
  ];
  return {
    categories,
    branches,
    members: [],
    events: [],
    registrations: [],
    payments: [],
    byproduct_uploads: [],
    byproduct_lines: [],
    audit: [],
    exports: [],
    erasures: [],
  };
};

let cache: Store | null = null;

const read = (): Store => {
  if (cache) return cache;
  if (typeof window === "undefined") {
    cache = seed();
    return cache;
  }
  try {
    const raw = localStorage.getItem(STORE_KEY);
    cache = raw ? (JSON.parse(raw) as Store) : seed();
  } catch {
    cache = seed();
  }
  return cache!;
};

const write = (s: Store) => {
  cache = s;
  if (typeof window !== "undefined")
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
};

const paginate = <T,>(items: T[], page = 1, per_page = 15): NnakPaginated<T> => {
  const total = items.length;
  const last_page = Math.max(1, Math.ceil(total / per_page));
  const from = (page - 1) * per_page;
  const slice = items.slice(from, from + per_page);
  return {
    data: slice,
    meta: {
      total,
      per_page,
      current_page: page,
      last_page,
      from: from + 1,
      to: from + slice.length,
    },
  };
};

const logAudit = (entry: Omit<AuditLogEntry, "id" | "occurred_at">) => {
  const s = read();
  s.audit.unshift({ ...entry, id: uid(), occurred_at: now() });
  s.audit = s.audit.slice(0, 500);
  write(s);
};

export const mockStore = {
  // ---- categories ----
  listCategories: () => read().categories,
  createCategory: (c: Omit<MemberCategory, "id" | "created_at" | "updated_at">) => {
    const s = read();
    const item: MemberCategory = { ...c, id: uid(), created_at: now(), updated_at: now() };
    s.categories.push(item);
    write(s);
    return item;
  },
  updateCategory: (id: string, patch: Partial<MemberCategory>) => {
    const s = read();
    const i = s.categories.findIndex((x) => x.id === id);
    if (i < 0) throw new Error("Category not found");
    s.categories[i] = { ...s.categories[i], ...patch, updated_at: now() };
    write(s);
    return s.categories[i];
  },
  deleteCategory: (id: string) => {
    const s = read();
    s.categories = s.categories.filter((x) => x.id !== id);
    write(s);
  },

  // ---- branches ----
  listBranches: () => read().branches,

  // ---- members ----
  listMembers: (params: { page?: number; per_page?: number; search?: string; status?: string; category_id?: string; branch_id?: string } = {}) => {
    const s = read();
    let items = [...s.members];
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.profile.nck_number?.toLowerCase().includes(q) ||
          m.profile.account_number?.toLowerCase().includes(q),
      );
    }
    if (params.status) items = items.filter((m) => m.profile.status === params.status);
    if (params.category_id) items = items.filter((m) => m.profile.member_category_id === params.category_id);
    if (params.branch_id) items = items.filter((m) => m.profile.branch_id === params.branch_id);
    return paginate(items, params.page, params.per_page);
  },
  getMember: (id: string) => read().members.find((m) => m.id === id) || null,
  createMember: (input: { name: string; email: string; role?: "member" | "student"; profile: Partial<NnakProfile> }) => {
    const s = read();
    const userId = uid();
    const profile: NnakProfile = {
      id: uid(),
      user_id: userId,
      account_number: "ACC" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      phone: input.profile.phone ?? null,
      nck_number: input.profile.nck_number ?? null,
      license_number: input.profile.license_number ?? null,
      identification_type: input.profile.identification_type ?? "national_id",
      identification_number: input.profile.identification_number ?? null,
      professional_qualification: input.profile.professional_qualification ?? null,
      date_of_birth: input.profile.date_of_birth ?? null,
      gender: input.profile.gender ?? "female",
      employer_type: input.profile.employer_type ?? null,
      employer_name: input.profile.employer_name ?? null,
      county: input.profile.county ?? null,
      photo_url: input.profile.photo_url ?? null,
      member_category_id: input.profile.member_category_id ?? null,
      branch_id: input.profile.branch_id ?? null,
      status: "pending",
      joined_at: now(),
      subscription_expires_at: null,
      created_at: now(),
      updated_at: now(),
    };
    const user: NnakUser & { profile: NnakProfile } = {
      id: userId,
      name: input.name,
      email: input.email,
      role: input.role ?? "member",
      email_verified_at: null,
      profile,
    };
    s.members.push(user);
    write(s);
    logAudit({ user_id: userId, user_email: user.email, action: "member.created", resource: "member", resource_id: userId });
    return user;
  },
  updateMember: (id: string, patch: { name?: string; email?: string; profile?: Partial<NnakProfile> }) => {
    const s = read();
    const i = s.members.findIndex((m) => m.id === id);
    if (i < 0) throw new Error("Member not found");
    const cur = s.members[i];
    s.members[i] = {
      ...cur,
      name: patch.name ?? cur.name,
      email: patch.email ?? cur.email,
      profile: { ...cur.profile, ...(patch.profile ?? {}), updated_at: now() },
    };
    write(s);
    return s.members[i];
  },
  setMemberStatus: (id: string, status: NnakProfile["status"], reason?: string) => {
    const s = read();
    const m = s.members.find((x) => x.id === id);
    if (!m) throw new Error("Member not found");
    m.profile.status = status;
    m.profile.updated_at = now();
    write(s);
    logAudit({ user_id: id, action: `member.status.${status}`, resource: "member", resource_id: id, metadata: { reason } });
    return m;
  },

  // ---- events ----
  listEvents: (params: { page?: number; per_page?: number; status?: string } = {}) => {
    const s = read();
    let items = [...s.events].sort((a, b) => b.starts_at.localeCompare(a.starts_at));
    if (params.status) items = items.filter((e) => e.status === params.status);
    return paginate(items, params.page, params.per_page);
  },
  getEvent: (id: string) => read().events.find((e) => e.id === id) || null,
  upsertEvent: (input: Partial<NnakEvent> & { id?: string }) => {
    const s = read();
    if (input.id) {
      const i = s.events.findIndex((e) => e.id === input.id);
      if (i < 0) throw new Error("Event not found");
      s.events[i] = { ...s.events[i], ...input, updated_at: now() } as NnakEvent;
      write(s);
      return s.events[i];
    }
    const event: NnakEvent = {
      id: uid(),
      name: input.name || "Untitled",
      description: input.description || "",
      type: input.type || "cpd",
      status: input.status || "draft",
      starts_at: input.starts_at || now(),
      ends_at: input.ends_at || now(),
      venue: input.venue || "",
      capacity: input.capacity || 0,
      pricing: input.pricing || [],
      speakers: input.speakers || [],
      cover_image_url: input.cover_image_url || null,
      multi_day: input.multi_day || false,
      registrants_count: 0,
      attended_count: 0,
      revenue_total: 0,
      created_at: now(),
      updated_at: now(),
    };
    s.events.push(event);
    write(s);
    return event;
  },
  deleteEvent: (id: string) => {
    const s = read();
    s.events = s.events.filter((e) => e.id !== id);
    s.registrations = s.registrations.filter((r) => r.event_id !== id);
    write(s);
  },
  listEventRegistrants: (eventId: string) =>
    read().registrations.filter((r) => r.event_id === eventId),
  registerForEvent: (eventId: string, userId: string, fee: number) => {
    const s = read();
    const reg: EventRegistration = {
      id: uid(),
      event_id: eventId,
      user_id: userId,
      fee,
      payment_status: "pending",
      qr_token: uid(),
      attended: false,
      certificate_issued: false,
      created_at: now(),
    };
    s.registrations.push(reg);
    const ev = s.events.find((e) => e.id === eventId);
    if (ev) ev.registrants_count = (ev.registrants_count || 0) + 1;
    write(s);
    return reg;
  },
  checkInRegistration: (qr_token: string) => {
    const s = read();
    const reg = s.registrations.find((r) => r.qr_token === qr_token);
    if (!reg) throw new Error("Invalid QR token");
    reg.attended = true;
    reg.attended_at = now();
    const ev = s.events.find((e) => e.id === reg.event_id);
    if (ev) ev.attended_count = (ev.attended_count || 0) + 1;
    write(s);
    return reg;
  },
  issueCertificate: (regId: string) => {
    const s = read();
    const reg = s.registrations.find((r) => r.id === regId);
    if (!reg) throw new Error("Registration not found");
    reg.certificate_issued = true;
    reg.certificate_url = `/api/mock/certificate/${regId}`;
    write(s);
    return reg;
  },

  // ---- payments ----
  listPayments: (params: { page?: number; per_page?: number; purpose?: string; status?: string; user_id?: string } = {}) => {
    const s = read();
    let items = [...s.payments].sort((a, b) => b.paid_at.localeCompare(a.paid_at));
    if (params.purpose) items = items.filter((p) => p.purpose === params.purpose);
    if (params.status) items = items.filter((p) => p.status === params.status);
    if (params.user_id) items = items.filter((p) => p.user_id === params.user_id);
    return paginate(items, params.page, params.per_page);
  },

  listMyRegistrations: (userId: string) => {
    const s = read();
    return s.registrations
      .filter((r) => r.user_id === userId)
      .map((r) => ({ ...r, event: s.events.find((e) => e.id === r.event_id) ?? null }))
      .sort((a, b) => (b.event?.starts_at || "").localeCompare(a.event?.starts_at || ""));
  },

  // Ensure a demo user exists as a real member record so the portal has
  // data to show. Idempotent — safe to call on every sign-in. Will also
  // backfill license_number on a pre-existing record if it was created
  // before that field was seeded for member personas.
  ensureDemoMember: (input: {
    id: string;
    name: string;
    email: string;
    role: "member" | "student";
    categoryCode?: "individual" | "student" | "county";
  }) => {
    const s = read();
    const existing = s.members.find((m) => m.id === input.id);
    if (existing) {
      // Backfill license_number on a stale cached record so the digital
      // ID and membership page don't render an empty value.
      if (existing.role !== "student" && !existing.profile.license_number) {
        existing.profile.license_number =
          "LIC" + Math.floor(10000 + Math.random() * 89999);
        existing.profile.updated_at = now();
        write(s);
      }
      return existing;
    }

    const wantedCode = input.categoryCode || (input.role === "student" ? "student" : "individual");
    const cat = s.categories.find((c) => c.code === wantedCode) || s.categories[0];
    // Branch-based members get the first Counties branch for realism;
    // M-Pesa individuals don't need a branch.
    const branch =
      wantedCode === "county"
        ? s.branches.find((b) => b.county && b.county.length > 0) ?? s.branches[0]
        : null;
    const exp = new Date();
    exp.setFullYear(exp.getFullYear() + 1);

    const profile: NnakProfile = {
      id: uid(),
      user_id: input.id,
      account_number: "ACC" + input.id.slice(-4).toUpperCase(),
      phone: "+254700000000",
      nck_number: null,
      license_number: input.role === "student" ? null : "LIC" + Math.floor(10000 + Math.random() * 89999),
      identification_type: "national_id",
      identification_number: "3" + Math.floor(1000000 + Math.random() * 8999999),
      professional_qualification: input.role === "student" ? "Diploma in Nursing (in progress)" : "BScN, Kenya Medical Training College",
      date_of_birth: "1992-04-12",
      gender: "female",
      employer_type: input.role === "student" ? null : "employee",
      employer_name: input.role === "student" ? null : "Kenyatta National Hospital",
      county: "Nairobi",
      photo_url: null,
      member_category_id: cat?.id ?? null,
      branch_id: branch?.id ?? null,
      // override county for branch members so the dashboard says Nakuru etc.
      // (county field above is "Nairobi" by default but the branch wins).
      ...(branch?.county ? { county: branch.county } : {}),
      status: "active",
      joined_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 200).toISOString(),
      subscription_expires_at: exp.toISOString(),
      created_at: now(),
      updated_at: now(),
    };
    const user: NnakUser & { profile: NnakProfile } = {
      id: input.id,
      name: input.name,
      email: input.email,
      role: input.role,
      email_verified_at: new Date().toISOString(),
      profile,
    };
    s.members.push(user);

    // Seed a few historical payments so the payments page has rows.
    const subAmount = cat?.annual_fee ?? 2000;
    const lastYear = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 * 8).toISOString();
    s.payments.unshift({
      id: uid(),
      user_id: input.id,
      amount: subAmount,
      currency: "KES",
      method: "mpesa",
      purpose: "subscription",
      reference: "MPE" + Math.random().toString(36).slice(2, 10).toUpperCase(),
      status: "successful",
      paid_at: lastYear,
      created_at: lastYear,
      receipt_url: `/api/mock/receipt/${uid()}`,
    });

    // Seed one past event registration the member already paid for + attended.
    const pastEvent = s.events.find((e) => new Date(e.starts_at) < new Date());
    if (pastEvent) {
      const fee = pastEvent.pricing.find((p) => p.category_code === (cat?.code || "individual"))?.fee ?? 500;
      const reg: EventRegistration = {
        id: uid(),
        event_id: pastEvent.id,
        user_id: input.id,
        fee,
        payment_status: "successful",
        qr_token: uid(),
        attended: true,
        attended_at: pastEvent.starts_at,
        certificate_issued: true,
        certificate_url: `/api/mock/certificate/${uid()}`,
        created_at: new Date(new Date(pastEvent.starts_at).getTime() - 1000 * 60 * 60 * 24 * 14).toISOString(),
      };
      s.registrations.push(reg);
      s.payments.unshift({
        id: uid(),
        user_id: input.id,
        amount: fee,
        currency: "KES",
        method: "mpesa",
        purpose: "event",
        related_id: pastEvent.id,
        reference: "MPE" + Math.random().toString(36).slice(2, 10).toUpperCase(),
        status: "successful",
        paid_at: reg.created_at,
        created_at: reg.created_at,
        receipt_url: `/api/mock/receipt/${uid()}`,
      });
    }

    write(s);
    return user;
  },
  recordPayment: (input: Omit<Payment, "id" | "created_at" | "paid_at" | "currency"> & { paid_at?: string }) => {
    const s = read();
    const p: Payment = {
      ...input,
      id: uid(),
      currency: "KES",
      paid_at: input.paid_at || now(),
      created_at: now(),
      receipt_url: `/api/mock/receipt/${uid()}`,
    };
    s.payments.unshift(p);
    // mark subscription/registration as paid
    if (p.purpose === "subscription" && p.status === "successful") {
      const m = s.members.find((x) => x.id === p.user_id);
      if (m) {
        m.profile.status = "active";
        const exp = new Date();
        exp.setFullYear(exp.getFullYear() + 1);
        m.profile.subscription_expires_at = exp.toISOString();
      }
    }
    if (p.purpose === "event" && p.related_id && p.status === "successful") {
      const reg = s.registrations.find(
        (r) => r.event_id === p.related_id && r.user_id === p.user_id,
      );
      if (reg) {
        reg.payment_status = "successful";
        reg.payment_id = p.id;
        const ev = s.events.find((e) => e.id === p.related_id);
        if (ev) ev.revenue_total = (ev.revenue_total || 0) + p.amount;
      }
    }
    write(s);
    return p;
  },

  // ---- by-product reconciliation ----
  uploadByProduct: (input: {
    branch_id: string;
    period_month: string;
    uploaded_by: string;
    lines: { national_id: string; name: string; amount: number }[];
  }) => {
    const s = read();
    const branchMembers = s.members.filter((m) => m.profile.branch_id === input.branch_id);
    const upload: ByProductUpload = {
      id: uid(),
      branch_id: input.branch_id,
      uploaded_by: input.uploaded_by,
      period_month: input.period_month,
      total_records: input.lines.length,
      matched: 0,
      flagged: 0,
      total_amount: input.lines.reduce((a, b) => a + b.amount, 0),
      status: "completed",
      created_at: now(),
    };
    const lines: ByProductLine[] = input.lines.map((l) => {
      const m = branchMembers.find((bm) => bm.profile.identification_number === l.national_id);
      return {
        id: uid(),
        upload_id: upload.id,
        member_id: m?.id || null,
        national_id: l.national_id,
        name: l.name,
        amount: l.amount,
        matched: !!m,
      };
    });
    upload.matched = lines.filter((l) => l.matched).length;
    // flag = members in branch NOT included
    const includedIds = new Set(lines.map((l) => l.member_id).filter(Boolean));
    upload.flagged = branchMembers.filter((bm) => !includedIds.has(bm.id)).length;
    s.byproduct_uploads.unshift(upload);
    s.byproduct_lines.push(...lines);
    // mark matched members as active for the period
    lines.forEach((l) => {
      if (!l.member_id) return;
      mockStore.recordPayment({
        user_id: l.member_id,
        amount: l.amount,
        method: "byproduct",
        status: "successful",
        reference: `BP-${upload.id.slice(0, 6)}`,
        purpose: "subscription",
        related_id: upload.id,
      });
    });
    write(s);
    return { upload, lines };
  },
  listByProductUploads: () => read().byproduct_uploads,
  listByProductLines: (uploadId: string) =>
    read().byproduct_lines.filter((l) => l.upload_id === uploadId),

  // ---- dashboard ----
  kpis: (): DashboardKpis => {
    const s = read();
    const active = s.members.filter((m) => m.profile.status === "active");
    const now0 = new Date();
    const startMonth = new Date(now0.getFullYear(), now0.getMonth(), 1).toISOString();
    const newThisMonth = s.members.filter((m) => (m.profile.joined_at || "") >= startMonth).length;
    const revenueMtd = s.payments
      .filter((p) => p.status === "successful" && p.paid_at >= startMonth)
      .reduce((a, b) => a + b.amount, 0);
    const overdue = s.members.filter(
      (m) =>
        m.profile.subscription_expires_at &&
        new Date(m.profile.subscription_expires_at).getTime() < Date.now(),
    ).length;
    const upcoming = s.events.filter(
      (e) => new Date(e.starts_at).getTime() > Date.now() && e.status === "published",
    ).length;

    // group by category
    const by_category = s.categories.map((c) => ({
      category: c.name,
      count: s.members.filter((m) => m.profile.member_category_id === c.id).length,
    }));
    // last 6 months revenue
    const trend: { period: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const rev = s.payments
        .filter((p) => p.status === "successful" && p.paid_at.startsWith(key))
        .reduce((a, b) => a + b.amount, 0);
      trend.push({ period: key, revenue: rev });
    }
    const growth: { period: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const c = s.members.filter((m) => (m.profile.joined_at || "").startsWith(key)).length;
      growth.push({ period: key, count: c });
    }
    // attendance last 30d
    const cutoff = Date.now() - 30 * 86_400_000;
    const recentRegs = s.registrations.filter((r) => new Date(r.created_at).getTime() >= cutoff);
    const attendanceRate =
      recentRegs.length === 0
        ? 0
        : Math.round((recentRegs.filter((r) => r.attended).length / recentRegs.length) * 100);

    return {
      total_active_members: active.length,
      new_members_this_month: newThisMonth,
      revenue_mtd: revenueMtd,
      overdue_renewals: overdue,
      upcoming_events: upcoming,
      attendance_rate_30d: attendanceRate,
      by_category,
      revenue_trend: trend,
      membership_growth: growth,
    };
  },

  // ---- ILM ----
  listAudit: (params: { page?: number; per_page?: number } = {}) =>
    paginate(read().audit, params.page, params.per_page),

  listExports: () => read().exports,
  requestExport: (input: Omit<DataExportRequest, "id" | "status" | "created_at" | "approved_at" | "approved_by">) => {
    const s = read();
    const item: DataExportRequest = {
      ...input,
      id: uid(),
      status: "pending",
      approved_by: null,
      approved_at: null,
      created_at: now(),
    };
    s.exports.unshift(item);
    write(s);
    logAudit({ user_id: input.requested_by, action: "export.requested", resource: "export", resource_id: item.id, metadata: { scope: input.scope } });
    return item;
  },
  decideExport: (id: string, approver: string, approve: boolean) => {
    const s = read();
    const e = s.exports.find((x) => x.id === id);
    if (!e) throw new Error("Export not found");
    e.status = approve ? "approved" : "rejected";
    e.approved_by = approver;
    e.approved_at = now();
    write(s);
    logAudit({ user_id: approver, action: approve ? "export.approved" : "export.rejected", resource: "export", resource_id: id });
    return e;
  },

  listErasures: () => read().erasures,
  requestErasure: (input: { user_id: string; user_email?: string; reason?: string }) => {
    const s = read();
    const e: ErasureRequest = {
      id: uid(),
      user_id: input.user_id,
      user_email: input.user_email,
      reason: input.reason,
      status: "pending",
      requested_at: now(),
      completed_at: null,
    };
    s.erasures.unshift(e);
    write(s);
    logAudit({ user_id: input.user_id, action: "erasure.requested", resource: "erasure", resource_id: e.id });
    return e;
  },
  completeErasure: (id: string) => {
    const s = read();
    const e = s.erasures.find((x) => x.id === id);
    if (!e) throw new Error("Erasure not found");
    const m = s.members.find((x) => x.id === e.user_id);
    if (m) {
      m.name = "Anonymised";
      m.email = `anon-${m.id.slice(0, 8)}@nnak.invalid`;
      m.profile.phone = null;
      m.profile.identification_number = null;
      m.profile.nck_number = null;
      m.profile.photo_url = null;
      m.profile.status = "archived";
    }
    e.status = "anonymised";
    e.completed_at = now();
    write(s);
    logAudit({ user_id: e.user_id, action: "erasure.completed", resource: "erasure", resource_id: id });
    return e;
  },

  // expose audit logging for service callers
  audit: logAudit,
};
