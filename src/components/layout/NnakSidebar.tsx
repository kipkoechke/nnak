"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";
import { useNnakMe } from "@/hooks/nnak/use-auth";
import { nnakCan } from "@/lib/nnak/rbac";
import type { NnakUser } from "@/types/nnak";
import {
  MdDashboard,
  MdPeople,
  MdBusiness,
  MdCategory,
  MdEvent,
  MdQrCodeScanner,
  MdPayments,
  MdInsertChart,
  MdShield,
  MdHistory,
  MdFolderShared,
  MdHowToReg,
  MdClose,
} from "react-icons/md";

interface NnakSidebarProps {
  isMobileMenuOpen?: boolean;
  onClose?: () => void;
}

interface MenuItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  show?: (user: NnakUser | null | undefined) => boolean;
}

const NNAK_ITEMS: MenuItem[] = [
  { name: "Dashboard", icon: MdDashboard, href: "/nnak/dashboard", show: nnakCan.viewDashboard },
  { name: "Members", icon: MdPeople, href: "/nnak/members", show: nnakCan.manageMembers },
  { name: "Categories", icon: MdCategory, href: "/nnak/categories", show: nnakCan.upgradeCategory },
  { name: "Branches", icon: MdBusiness, href: "/nnak/branches", show: nnakCan.manageMembers },
  { name: "By-Product", icon: MdHowToReg, href: "/nnak/byproduct", show: nnakCan.reconcileByProduct },
  { name: "Events", icon: MdEvent, href: "/nnak/events", show: nnakCan.manageEvents },
  { name: "Check-In", icon: MdQrCodeScanner, href: "/nnak/checkin", show: nnakCan.checkInAttendees },
  { name: "Payments", icon: MdPayments, href: "/nnak/payments", show: nnakCan.viewFinancials },
  { name: "Reports", icon: MdInsertChart, href: "/nnak/reports", show: nnakCan.viewDashboard },
  { name: "Audit Log", icon: MdHistory, href: "/nnak/ilm/audit", show: nnakCan.viewAuditLog },
  { name: "Data Exports", icon: MdFolderShared, href: "/nnak/ilm/exports", show: nnakCan.approveDataExport },
  { name: "Erasure", icon: MdShield, href: "/nnak/ilm/erasure", show: nnakCan.manageILM },
];

export default function NnakSidebar({
  isMobileMenuOpen = false,
  onClose,
}: NnakSidebarProps) {
  const pathname = usePathname();
  const { data: nnakUser } = useNnakMe();

  const menuItems = useMemo(
    () =>
      NNAK_ITEMS.filter((i) => (i.show ? i.show(nnakUser) : true)).map((i) => ({
        ...i,
        active: pathname.startsWith(i.href),
      })),
    [pathname, nnakUser],
  );

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  return (
    <nav className="flex flex-col h-full">
      {/* Close button for mobile */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200">
        <span className="font-semibold text-slate-900">Menu</span>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-slate-100"
          aria-label="Close menu"
        >
          <MdClose className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation items */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                item.active
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-sm">{item.name}</span>
            </Link>
          );
        })}
      </div>

      {/* User info */}
      {nnakUser && (
        <div className="border-t border-slate-200 p-4">
          <div className="text-xs text-slate-500">Logged in as</div>
          <div className="text-sm font-medium text-slate-900 truncate">
            {nnakUser.name || nnakUser.email}
          </div>
          <div className="text-xs text-slate-500 truncate">{nnakUser.role}</div>
        </div>
      )}
    </nav>
  );
}
