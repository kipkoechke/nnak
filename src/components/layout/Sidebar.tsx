"use client";

import {
  MdLogout,
  MdClose,
  MdPeople,
  MdBusiness,
  MdEvent,
  MdQrCodeScanner,
  MdInsertChart,
  MdPayments,
  MdReceipt,
  MdShield,
  MdHistory,
  MdCategory,
  MdFolderShared,
  MdHowToReg,
  MdBadge,
  MdEventAvailable,
  MdWorkOutline,
} from "react-icons/md";
import { isMemberRole } from "@/lib/rbac";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";
import { useMe, useLogout } from "@/hooks/use-auth";
import { nnakCan } from "@/lib/rbac";
import type { NnakUser } from "@/types/nnak";

interface SidebarProps {
  isMobileMenuOpen?: boolean;
  onClose?: () => void;
}

interface MenuItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  show?: (u: NnakUser | null | undefined) => boolean;
}

const STAFF_ITEMS: MenuItem[] = [
  { name: "Dashboard", icon: MdInsertChart, href: "/nnak/dashboard", show: nnakCan.viewDashboard },
  { name: "Members", icon: MdPeople, href: "/nnak/members", show: nnakCan.manageMembers },
  { name: "Pending Approvals", icon: MdHowToReg, href: "/nnak/members/pending", show: nnakCan.approveMembers },
  { name: "Categories", icon: MdCategory, href: "/nnak/categories", show: nnakCan.upgradeCategory },
  { name: "Branches", icon: MdBusiness, href: "/nnak/branches", show: nnakCan.manageBranches },
  { name: "By-Product", icon: MdHowToReg, href: "/nnak/byproduct", show: nnakCan.reconcileByProduct },
  { name: "Events", icon: MdEvent, href: "/nnak/events", show: nnakCan.manageEvents },
  { name: "Check-In", icon: MdQrCodeScanner, href: "/nnak/checkin", show: nnakCan.checkInAttendees },
  { name: "Payments", icon: MdPayments, href: "/nnak/payments", show: nnakCan.viewFinancials },
  { name: "Reports", icon: MdReceipt, href: "/nnak/reports", show: nnakCan.viewReports },
  { name: "Audit Log", icon: MdHistory, href: "/nnak/ilm/audit", show: nnakCan.viewAuditLog },
  { name: "Data Exports", icon: MdFolderShared, href: "/nnak/ilm/exports", show: nnakCan.approveDataExport },
  { name: "Erasure", icon: MdShield, href: "/nnak/ilm/erasure", show: nnakCan.manageILM },
];

const MEMBER_ITEMS: MenuItem[] = [
  { name: "My Membership", icon: MdBadge, href: "/nnak/me/membership", show: nnakCan.viewMyMembership },
  { name: "Workstations", icon: MdWorkOutline, href: "/nnak/me/workstations", show: nnakCan.viewMyWorkstations },
  { name: "Subscriptions", icon: MdReceipt, href: "/nnak/me/subscriptions", show: nnakCan.viewMyPayments },
];

const Sidebar: React.FC<SidebarProps> = ({ isMobileMenuOpen, onClose }) => {
  const pathname = usePathname();
  const { data: user } = useMe();
  const logoutMutation = useLogout();

  const menuItems = useMemo(() => {
    const source = isMemberRole(user) ? MEMBER_ITEMS : STAFF_ITEMS;
    return source
      .filter((i) => (i.show ? i.show(user) : true))
      .map((i) => ({ ...i, active: pathname.startsWith(i.href) }));
  }, [pathname, user]);

  return (
    <div
      className={`bg-primary-dark text-white flex flex-col transition-all duration-300 fixed md:relative inset-y-0 left-0 z-50 w-64 md:w-56 ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      }`}
    >
      <div className="flex items-center justify-end px-3 py-2 border-b border-white/15 md:hidden">
        <button
          onClick={onClose}
          className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10"
          aria-label="Close menu"
        >
          <MdClose className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 py-2 px-3 overflow-y-auto">
        <ul className="flex flex-col space-y-0.5">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={() => onClose?.()}
                className={`group flex items-center gap-2 rounded-lg px-2 py-1 transition-all ${
                  item.active
                    ? "bg-white text-primary shadow-sm"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-md shrink-0 ${
                    item.active ? "bg-primary text-white" : "bg-white/15 text-white"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="font-medium text-[13px]">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="py-2 px-3 pb-2 border-t border-white/15">
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="group flex items-center gap-2 rounded-lg px-2 py-1 w-full text-white/90 hover:bg-secondary/30 hover:text-white transition-all disabled:opacity-50"
        >
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-white/15 text-white shrink-0 group-hover:bg-secondary group-hover:text-white">
            <MdLogout className="w-4 h-4" />
          </div>
          <span className="font-medium text-[13px]">
            {logoutMutation.isPending ? "Logging out..." : "Logout"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
