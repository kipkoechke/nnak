import { ReactNode } from "react";

export default function NnakPublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-primary px-6 py-6 text-white text-center">
          <div className="text-2xl font-bold">NNAK Digital Platform</div>
          <div className="text-xs text-white/80 mt-1">
            National Nurses Association of Kenya
          </div>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
