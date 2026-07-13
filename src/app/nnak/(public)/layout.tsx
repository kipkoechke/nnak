"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Logo from "@/components/common/Logo";

export default function NnakPublicLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "";
  const wide = pathname.includes("/register") || pathname.includes("/onboarding");
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-8">
      <div className={`${wide ? "max-w-2xl" : "max-w-md"} w-full bg-white rounded-lg shadow-lg overflow-hidden`}>
        <div className="bg-primary px-6 py-6 text-white text-center flex justify-center">
          <Logo />
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
