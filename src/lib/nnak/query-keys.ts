export const nqk = {
  auth: { me: ["nnak", "auth", "me"] as const },
  categories: {
    all: ["nnak", "categories"] as const,
    list: () => ["nnak", "categories", "list"] as const,
  },
  branches: {
    all: ["nnak", "branches"] as const,
    list: () => ["nnak", "branches", "list"] as const,
  },
  members: {
    all: ["nnak", "members"] as const,
    list: (p?: Record<string, unknown>) => ["nnak", "members", "list", p ?? {}] as const,
    detail: (id: string) => ["nnak", "members", "detail", id] as const,
  },
  events: {
    all: ["nnak", "events"] as const,
    list: (p?: Record<string, unknown>) => ["nnak", "events", "list", p ?? {}] as const,
    detail: (id: string) => ["nnak", "events", "detail", id] as const,
    registrants: (id: string) => ["nnak", "events", id, "registrants"] as const,
  },
  payments: {
    all: ["nnak", "payments"] as const,
    list: (p?: Record<string, unknown>) => ["nnak", "payments", "list", p ?? {}] as const,
  },
  byProduct: {
    all: ["nnak", "byproduct"] as const,
    list: () => ["nnak", "byproduct", "list"] as const,
    lines: (id: string) => ["nnak", "byproduct", id, "lines"] as const,
  },
  reports: {
    kpis: ["nnak", "reports", "kpis"] as const,
  },
  ilm: {
    audit: (p?: Record<string, unknown>) => ["nnak", "ilm", "audit", p ?? {}] as const,
    exports: ["nnak", "ilm", "exports"] as const,
    erasures: ["nnak", "ilm", "erasures"] as const,
  },
};
