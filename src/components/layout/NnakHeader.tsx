"use client";

import { MdMenu } from "react-icons/md";
import NnakUserMenu from "./NnakUserMenu";

interface NnakHeaderProps {
  onMenuToggle?: () => void;
}

export default function NnakHeader({ onMenuToggle }: NnakHeaderProps) {
  return (
    <header className="border-b border-slate-200 bg-white px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 rounded-lg hover:bg-slate-100 text-slate-600"
          aria-label="Toggle menu"
        >
          <MdMenu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">NNAK Platform</h1>
      </div>

      <NnakUserMenu />
    </header>
  );
}
