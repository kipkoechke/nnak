export const nqk = {
  auth: { me: ["nnak", "auth", "me"] as const },
  enums: {
    genders: ["nnak", "enums", "genders"] as const,
    employerTypes: ["nnak", "enums", "employer-types"] as const,
    billingFrequencies: ["nnak", "enums", "billing-frequencies"] as const,
    paymentMethods: ["nnak", "enums", "payment-methods"] as const,
    userRoles: ["nnak", "enums", "user-roles"] as const,
    chapters: ["nnak", "enums", "chapters"] as const,
    professionalCadres: ["nnak", "enums", "professional-cadres"] as const,
    professionalQualifications: [
      "nnak",
      "enums",
      "professional-qualifications",
    ] as const,
    commissionTypes: ["nnak", "enums", "commission-types"] as const,
  },
  categories: {
    all: ["nnak", "categories"] as const,
    list: () => ["nnak", "categories", "list"] as const,
  },
  admins: {
    all: ["nnak", "admins"] as const,
    list: () => ["nnak", "admins", "list"] as const,
  },
  branches: {
    all: ["nnak", "branches"] as const,
    list: () => ["nnak", "branches", "list"] as const,
    detail: (id: string) => ["nnak", "branches", "detail", id] as const,
  },
  workstations: {
    all: ["nnak", "workstations"] as const,
    list: (userId: string) => ["nnak", "workstations", "list", userId] as const,
  },
  subscriptions: {
    all: ["nnak", "subscriptions"] as const,
    list: () => ["nnak", "subscriptions", "list"] as const,
    detail: (id: string) => ["nnak", "subscriptions", "detail", id] as const,
  },
  memberDashboard: ["nnak", "member", "dashboard"] as const,
  members: {
    all: ["nnak", "members"] as const,
    list: (p?: Record<string, unknown>) =>
      ["nnak", "members", "list", p ?? {}] as const,
    detail: (id: string) => ["nnak", "members", "detail", id] as const,
    pending: (p?: Record<string, unknown>) =>
      ["nnak", "members", "pending", p ?? {}] as const,
  },
  adminDashboard: (p?: Record<string, unknown>) =>
    ["nnak", "admin", "dashboard", p ?? {}] as const,
  branchDashboard: (p?: Record<string, unknown>) =>
    ["nnak", "branch", "dashboard", p ?? {}] as const,
  branchMembers: (p?: Record<string, unknown>) =>
    ["nnak", "branch", "members", p ?? {}] as const,
  events: {
    all: ["nnak", "events"] as const,
    list: (p?: Record<string, unknown>) =>
      ["nnak", "events", "list", p ?? {}] as const,
    detail: (id: string) => ["nnak", "events", "detail", id] as const,
    registrants: (id: string) => ["nnak", "events", id, "registrants"] as const,
  },
  agendas: {
    all: ["nnak", "agendas"] as const,
    list: (eventId: string, p?: Record<string, unknown>) =>
      ["nnak", "agendas", "list", eventId, p ?? {}] as const,
    detail: (eventId: string, id: string) =>
      ["nnak", "agendas", "detail", eventId, id] as const,
  },
  speakers: {
    all: ["nnak", "speakers"] as const,
    list: (eventId: string, p?: Record<string, unknown>) =>
      ["nnak", "speakers", "list", eventId, p ?? {}] as const,
    detail: (eventId: string, id: string) =>
      ["nnak", "speakers", "detail", eventId, id] as const,
  },
  breakoutRooms: {
    all: ["nnak", "breakout-rooms"] as const,
    list: (eventId: string, agendaId: string, p?: Record<string, unknown>) =>
      ["nnak", "breakout-rooms", "list", eventId, agendaId, p ?? {}] as const,
    detail: (eventId: string, agendaId: string, id: string) =>
      ["nnak", "breakout-rooms", "detail", eventId, agendaId, id] as const,
  },
  agendaSpeakers: {
    all: ["nnak", "agenda-speakers"] as const,
    list: (eventId: string, agendaId: string, p?: Record<string, unknown>) =>
      ["nnak", "agenda-speakers", "list", eventId, agendaId, p ?? {}] as const,
  },
  breakoutSpeakers: {
    all: ["nnak", "breakout-speakers"] as const,
    list: (
      eventId: string,
      agendaId: string,
      breakoutRoomId: string,
      p?: Record<string, unknown>,
    ) =>
      [
        "nnak",
        "breakout-speakers",
        "list",
        eventId,
        agendaId,
        breakoutRoomId,
        p ?? {},
      ] as const,
  },
  sponsors: {
    all: ["nnak", "sponsors"] as const,
    list: (eventId: string, p?: Record<string, unknown>) =>
      ["nnak", "sponsors", "list", eventId, p ?? {}] as const,
    detail: (eventId: string, id: string) =>
      ["nnak", "sponsors", "detail", eventId, id] as const,
  },
  exhibitors: {
    all: ["nnak", "exhibitors"] as const,
    list: (eventId: string, p?: Record<string, unknown>) =>
      ["nnak", "exhibitors", "list", eventId, p ?? {}] as const,
    detail: (eventId: string, id: string) =>
      ["nnak", "exhibitors", "detail", eventId, id] as const,
  },
  payments: {
    all: ["nnak", "payments"] as const,
    list: (p?: Record<string, unknown>) =>
      ["nnak", "payments", "list", p ?? {}] as const,
  },
  mpesaTransactions: {
    list: (p?: Record<string, unknown>) =>
      ["nnak", "mpesa", "transactions", p ?? {}] as const,
  },
  byProduct: {
    all: ["nnak", "byproduct"] as const,
    list: () => ["nnak", "byproduct", "list"] as const,
    detail: (id: string) => ["nnak", "byproduct", "detail", id] as const,
    lines: (id: string) => ["nnak", "byproduct", id, "lines"] as const,
  },
  reports: {
    kpis: ["nnak", "reports", "kpis"] as const,
  },
  ilm: {
    audit: (p?: Record<string, unknown>) =>
      ["nnak", "ilm", "audit", p ?? {}] as const,
    exports: ["nnak", "ilm", "exports"] as const,
    erasures: ["nnak", "ilm", "erasures"] as const,
  },
  memberPayments: {
    stkQuery: (invoiceId: string) =>
      ["nnak", "member", "payments", "stkquery", invoiceId] as const,
  },
  finance: {
    dashboard: ["nnak", "finance", "dashboard"] as const,
    members: {
      all: ["nnak", "finance", "members"] as const,
      list: (p?: Record<string, unknown>) => ["nnak", "finance", "members", "list", p ?? {}] as const,
      detail: (id: string) => ["nnak", "finance", "members", "detail", id] as const,
    },
    branches: {
      all: ["nnak", "finance", "branches"] as const,
      list: (p?: Record<string, unknown>) => ["nnak", "finance", "branches", "list", p ?? {}] as const,
      detail: (id: string) => ["nnak", "finance", "branches", "detail", id] as const,
    },
    byproducts: {
      all: ["nnak", "finance", "byproducts"] as const,
      list: (p?: Record<string, unknown>) => ["nnak", "finance", "byproducts", "list", p ?? {}] as const,
      detail: (id: string) => ["nnak", "finance", "byproducts", "detail", id] as const,
    },
    batches: {
      all: ["nnak", "finance", "batches"] as const,
      list: (p?: Record<string, unknown>) => ["nnak", "finance", "batches", "list", p ?? {}] as const,
      detail: (id: string) => ["nnak", "finance", "batches", "detail", id] as const,
    },
    payments: {
      all: ["nnak", "finance", "payments"] as const,
      list: (p?: Record<string, unknown>) => ["nnak", "finance", "payments", "list", p ?? {}] as const,
    },
    remittances: {
      all: ["nnak", "finance", "remittances"] as const,
      list: (p?: Record<string, unknown>) => ["nnak", "finance", "remittances", "list", p ?? {}] as const,
    },
  },
  memberEvents: {
    all: ["nnak", "member", "events"] as const,
    list: (p?: Record<string, unknown>) => ["nnak", "member", "events", "list", p ?? {}] as const,
    detail: (id: string) => ["nnak", "member", "events", "detail", id] as const,
    packages: (id: string) => ["nnak", "member", "events", "packages", id] as const,
  },
  institutions: {
    all: ["nnak", "institutions"] as const,
    list: (p?: Record<string, unknown>) => ["nnak", "institutions", "list", p ?? {}] as const,
  },
  studentEvents: {
    all: ["nnak", "student", "events"] as const,
    list: (p?: Record<string, unknown>) => ["nnak", "student", "events", "list", p ?? {}] as const,
    detail: (id: string) => ["nnak", "student", "events", "detail", id] as const,
    packages: (id: string) => ["nnak", "student", "events", "packages", id] as const,
  },
  studentBookings: {
    all: ["nnak", "student", "bookings"] as const,
    list: (p?: Record<string, unknown>) => ["nnak", "student", "bookings", "list", p ?? {}] as const,
    detail: (id: string) => ["nnak", "student", "bookings", "detail", id] as const,
  },
  invites: {
    memberAll: ["nnak", "member", "invites"] as const,
    memberList: (p?: Record<string, unknown>) =>
      ["nnak", "member", "invites", "list", p ?? {}] as const,
    branchSent: (p?: Record<string, unknown>) =>
      ["nnak", "branch", "invites", "sent", p ?? {}] as const,
    branchTransfersReceived: (p?: Record<string, unknown>) =>
      ["nnak", "branch", "transfers", "received", p ?? {}] as const,
    adminInvites: (p?: Record<string, unknown>) =>
      ["nnak", "admin", "branch-invites", p ?? {}] as const,
    adminTransfers: (p?: Record<string, unknown>) =>
      ["nnak", "admin", "branch-transfers", p ?? {}] as const,
  },
  batches: {
    all: ["nnak", "batches"] as const,
    list: (p?: Record<string, unknown>) =>
      ["nnak", "branch", "batches", "list", p ?? {}] as const,
    detail: (id: string) => ["nnak", "branch", "batches", "detail", id] as const,
    adminList: (p?: Record<string, unknown>) =>
      ["nnak", "admin", "branch-batches", p ?? {}] as const,
  },
};
