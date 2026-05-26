import { PaginationQuery } from "@/types/api";
import { ContactListFilters } from "@/types/contact";
import { FeeCategory } from "@/types/fees";
import { AdminNewsListFilters, NewsListFilters } from "@/types/news";
import { QuoteListFilters } from "@/types/quotes";
import { AwardListFilters } from "@/types/awards";

export const qk = {
  auth: { me: ["auth", "me"] as const },
  branches: {
    all: ["branches"] as const,
    list: (p?: PaginationQuery) => ["branches", "list", p ?? {}] as const,
    detail: (id: string) => ["branches", "detail", id] as const,
  },
  contact: {
    all: ["contact"] as const,
    list: (f: ContactListFilters) => ["contact", "list", f] as const,
    detail: (id: string) => ["contact", "detail", id] as const,
  },
  fees: {
    all: ["fees"] as const,
    byCategory: (c: FeeCategory) => ["fees", c] as const,
  },
  jobs: {
    all: ["jobs"] as const,
    list: (p?: PaginationQuery) => ["jobs", "list", p ?? {}] as const,
    detail: (id: string) => ["jobs", "detail", id] as const,
    qrStats: ["jobs", "qr-code", "stats"] as const,
  },
  news: {
    all: ["news"] as const,
    list: (f: NewsListFilters) => ["news", "list", f] as const,
    detail: (slug: string) => ["news", "detail", slug] as const,
    related: (slug: string) => ["news", "related", slug] as const,
    adminList: (f: AdminNewsListFilters) => ["news", "admin", f] as const,
  },
  quotes: {
    all: ["quotes"] as const,
    list: (f: QuoteListFilters) => ["quotes", "list", f] as const,
    detail: (id: string) => ["quotes", "detail", id] as const,
  },
  team: {
    all: ["team"] as const,
    list: (p?: PaginationQuery) => ["team", "list", p ?? {}] as const,
    detail: (id: string) => ["team", "detail", id] as const,
  },
  users: {
    all: ["users"] as const,
    list: (p?: PaginationQuery) => ["users", "list", p ?? {}] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },
  services: {
    all: ["services"] as const,
    detail: (id: string) => ["services", "detail", id] as const,
  },
  about: { all: ["about"] as const },
  history: {
    all: ["history"] as const,
    detail: (id: string) => ["history", "detail", id] as const,
  },
  awards: {
    all: ["awards"] as const,
    list: (f: AwardListFilters) => ["awards", "list", f] as const,
    detail: (id: string) => ["awards", "detail", id] as const,
  },
  community: {
    pillars: ["community", "pillars"] as const,
    caseStudies: ["community", "case-studies"] as const,
    caseStudy: (id: string) => ["community", "case-studies", id] as const,
  },
  charities: {
    partners: ["charities", "partners"] as const,
    partner: (id: string) => ["charities", "partners", id] as const,
    slides: ["charities", "slides"] as const,
    stats: ["charities", "stats"] as const,
    banner: ["charities", "banner"] as const,
  },
};
