export const nqk = {
  auth: { me: ["nnak", "auth", "me"] as const },
  enums: {
    genders: ["nnak", "enums", "genders"] as const,
    employerTypes: ["nnak", "enums", "employer-types"] as const,
    billingFrequencies: ["nnak", "enums", "billing-frequencies"] as const,
    paymentMethods: ["nnak", "enums", "payment-methods"] as const,
    userRoles: ["nnak", "enums", "user-roles"] as const,
    chapters: ["nnak", "enums", "chapters"] as const,
  },
  categories: {
    all: ["nnak", "categories"] as const,
    list: () => ["nnak", "categories", "list"] as const,
  },
  branches: {
    all: ["nnak", "branches"] as const,
    list: () => ["nnak", "branches", "list"] as const,
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
};
