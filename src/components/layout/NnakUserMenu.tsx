"use client";

import { useState } from "react";
import { useNnakMe, useNnakLogout } from "@/hooks/nnak/use-auth";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { MdKeyboardArrowDown, MdLogout } from "react-icons/md";

export default function NnakUserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: user } = useNnakMe();
  const logoutMutation = useNnakLogout();

  const menuRef = useOutsideClick(() => setIsOpen(false));

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-xs font-semibold text-blue-700">
            {user.name?.charAt(0).toUpperCase() || "U"}
          </span>
        </div>
        <span className="hidden sm:inline text-sm font-medium truncate max-w-[120px]">
          {user.name}
        </span>
        <MdKeyboardArrowDown
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200">
            <div className="text-sm font-medium text-slate-900">{user.name}</div>
            <div className="text-xs text-slate-500">{user.email}</div>
            <div className="text-xs text-slate-500 mt-1">{user.role}</div>
          </div>

          <button
            onClick={() => {
              logoutMutation.mutate();
              setIsOpen(false);
            }}
            disabled={logoutMutation.isPending}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors text-sm disabled:opacity-50"
          >
            <MdLogout className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
