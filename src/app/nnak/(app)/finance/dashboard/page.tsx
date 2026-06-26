"use client";
import Link from "next/link";
import {
  MdPeople,
  MdCorporateFare,
  MdPayments,
  MdSwapHoriz,
  MdUpload,
  MdReceipt,
} from "react-icons/md";
import PageHeader from "@/components/common/PageHeader";
import { useFinanceDashboard } from "@/hooks/use-finance";

const NAV_CARDS = [
  {
    href: "/nnak/finance/members",
    icon: MdPeople,
    label: "Members",
    description: "View all members and subscription status",
    color: "bg-blue-50 text-blue-600",
  },
  {
    href: "/nnak/finance/branches",
    icon: MdCorporateFare,
    label: "Branches",
    description: "View branch details and commissions",
    color: "bg-violet-50 text-violet-600",
  },
  {
    href: "/nnak/finance/batches",
    icon: MdReceipt,
    label: "Batches",
    description: "Reconcile monthly branch batches",
    color: "bg-amber-50 text-amber-600",
  },
  {
    href: "/nnak/finance/payments",
    icon: MdPayments,
    label: "Payments",
    description: "Track all invoices and payment status",
    color: "bg-emerald-50 text-emerald-600",
  },
  {
    href: "/nnak/finance/remittances",
    icon: MdSwapHoriz,
    label: "Remittances",
    description: "Review M-Pesa and batch remittances",
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    href: "/nnak/finance/byproducts",
    icon: MdUpload,
    label: "By-Product",
    description: "Upload and track remittance files",
    color: "bg-slate-50 text-slate-600",
  },
];

export default function FinanceDashboardPage() {
  const { data: dash, isLoading } = useFinanceDashboard();

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <PageHeader
        title="Finance Dashboard"
        description="Overview of collections, remittances and branch activity"
      />

      {/* Dynamic stats from API */}
      {!isLoading && dash && Object.keys(dash).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(dash as Record<string, unknown>).map(([key, val]) => {
            if (typeof val !== "number" && typeof val !== "string") return null;
            return (
              <div
                key={key}
                className="bg-white border border-slate-200 rounded-lg p-4"
              >
                <div className="text-[11px] uppercase tracking-wide text-slate-500">
                  {key.replace(/_/g, " ")}
                </div>
                <div className="text-lg font-semibold text-slate-900 mt-1">
                  {typeof val === "number" ? val.toLocaleString() : val}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-lg p-4 animate-pulse"
            >
              <div className="h-3 bg-slate-100 rounded w-2/3 mb-2" />
              <div className="h-6 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Navigation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {NAV_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.href}
              href={card.href}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-primary hover:shadow-sm transition-all flex items-start gap-4 group"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${card.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 group-hover:text-primary transition-colors">
                  {card.label}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {card.description}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
