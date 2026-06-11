import { MdAnalytics } from "react-icons/md";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics — NNAK",
};

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
        <MdAnalytics className="w-8 h-8 text-blue-600" />
      </div>
      <h1 className="text-xl font-semibold text-slate-900 mb-2">Analytics</h1>
      <p className="text-sm text-slate-500 text-center max-w-sm">
        Advanced analytics and insights are coming soon. Stay tuned for detailed
        reports, trends, and visualisations.
      </p>
    </div>
  );
}
