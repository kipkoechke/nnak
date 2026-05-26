"use client";
import { use } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import { useByProductLines } from "@/hooks/nnak/use-byproduct";

export default function ByProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data = [], isLoading } = useByProductLines(id);

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <PageHeader title="By-Product Detail" back={() => router.back()} />
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr><th className="px-3 py-2">National ID</th><th className="px-3 py-2">Name</th><th className="px-3 py-2">Amount</th><th className="px-3 py-2">Match</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((l) => (
                <tr key={l.id}>
                  <td className="px-3 py-2">{l.national_id}</td>
                  <td className="px-3 py-2">{l.name}</td>
                  <td className="px-3 py-2">KES {l.amount.toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${l.matched ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                      {l.matched ? "Matched" : "Unmatched"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
