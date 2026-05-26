"use client";

import { ReactNode, useState, useEffect } from "react";
import NnakSidebar from "./NnakSidebar";
import NnakHeader from "./NnakHeader";

type NnakAppLayoutProps = {
  children: ReactNode;
};

export default function NnakAppLayout({ children }: NnakAppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden md:block md:w-56 border-r border-slate-200 bg-white">
        <NnakSidebar />
      </aside>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <aside className="absolute inset-y-0 left-0 w-64 bg-white border-r border-slate-200">
            <NnakSidebar onClose={() => setIsMobileMenuOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <NnakHeader
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
