"use client";

import {
  MdDashboard,
  MdLogout,
  MdClose,
  MdPeople,
  MdBusiness,
  MdWork,
  MdArticle,
  MdAttachMoney,
  MdContactMail,
  MdRequestQuote,
  MdManageAccounts,
  MdInfoOutline,
  MdMiscellaneousServices,
  MdGroups,
  MdVolunteerActivism,
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
} from "react-icons/md";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo } from "react";
import { useMe, useLogout } from "@/hooks/auth/use-auth";
import { useNnakMe } from "@/hooks/nnak/use-auth";
import { nnakCan } from "@/lib/nnak/rbac";

interface SidebarProps {
  isMobileMenuOpen?: boolean;
  onClose?: () => void;
}

interface MenuItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  adminOnly?: boolean;
  roles?: string[];
}

const ALL_ITEMS: MenuItem[] = [
  { name: "Dashboard", icon: MdDashboard, href: "/dashboard" },
  { name: "About", icon: MdInfoOutline, href: "/about" },
  { name: "Services", icon: MdMiscellaneousServices, href: "/services" },
  { name: "Branches", icon: MdBusiness, href: "/branches" },
  { name: "Team", icon: MdPeople, href: "/team" },
  { name: "Jobs", icon: MdWork, href: "/jobs", roles: ["ADMIN", "HR"] },
  { name: "News", icon: MdArticle, href: "/news" },
  { name: "Community", icon: MdGroups, href: "/community" },
  { name: "Charities", icon: MdVolunteerActivism, href: "/charities" },
  { name: "Fees", icon: MdAttachMoney, href: "/fees" },
  {
    name: "Contact",
    icon: MdContactMail,
    href: "/contact",
    roles: ["ADMIN", "OPERATIONS"],
  },
  {
    name: "Quotes",
    icon: MdRequestQuote,
    href: "/quotes",
    roles: ["ADMIN", "OPERATIONS"],
  },
  { name: "Users", icon: MdManageAccounts, href: "/users", adminOnly: true },
];

interface NnakItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  show?: (u: ReturnType<typeof useNnakMe>["data"]) => boolean;
}

const NNAK_ITEMS: NnakItem[] = [
  { name: "Dashboard", icon: MdInsertChart, href: "/nnak/dashboard", show: nnakCan.viewDashboard },
  { name: "Members", icon: MdPeople, href: "/nnak/members", show: nnakCan.manageMembers },
  { name: "Categories", icon: MdCategory, href: "/nnak/categories", show: nnakCan.upgradeCategory },
  { name: "Branches", icon: MdBusiness, href: "/nnak/branches", show: nnakCan.manageMembers },
  { name: "By-Product", icon: MdHowToReg, href: "/nnak/byproduct", show: nnakCan.reconcileByProduct },
  { name: "Events", icon: MdEvent, href: "/nnak/events", show: nnakCan.manageEvents },
  { name: "Check-In", icon: MdQrCodeScanner, href: "/nnak/checkin", show: nnakCan.checkInAttendees },
  { name: "Payments", icon: MdPayments, href: "/nnak/payments", show: nnakCan.viewFinancials },
  { name: "Reports", icon: MdReceipt, href: "/nnak/reports", show: nnakCan.viewDashboard },
  { name: "Audit Log", icon: MdHistory, href: "/nnak/ilm/audit", show: nnakCan.viewAuditLog },
  { name: "Data Exports", icon: MdFolderShared, href: "/nnak/ilm/exports", show: nnakCan.approveDataExport },
  { name: "Erasure", icon: MdShield, href: "/nnak/ilm/erasure", show: nnakCan.manageILM },
];

const Sidebar: React.FC<SidebarProps> = ({ isMobileMenuOpen, onClose }) => {
  const pathname = usePathname();
  const { data: user } = useMe();
  const { data: nnakUser } = useNnakMe();
  const logoutMutation = useLogout();

  const menuItems = useMemo(() => {
    const role = user?.role;
    const isAdmin = role === "ADMIN";
    return ALL_ITEMS.filter((i) => {
      if (i.adminOnly) return isAdmin;
      if (i.roles) return !!role && i.roles.includes(role);
      return true;
    }).map((i) => ({
      ...i,
      active:
        i.href === "/dashboard"
          ? pathname === "/dashboard"
          : pathname.startsWith(i.href),
    }));
  }, [pathname, user?.role]);

  const nnakItems = useMemo(
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

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div
      className={`bg-primary-dark text-white flex flex-col transition-all duration-300 fixed md:relative inset-y-0 left-0 z-50 w-64 md:w-56 ${
        isMobileMenuOpen
          ? "translate-x-0"
          : "-translate-x-full md:translate-x-0"
      }`}
    >
      {/* Mobile close button */}
      <div className="flex items-center justify-end px-3 py-2 border-b border-white/15 md:hidden">
        <button
          onClick={onClose}
          className="p-2 rounded-md text-white/70 hover:text-white hover:bg-white/10"
          aria-label="Close menu"
        >
          <MdClose className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 px-3 overflow-y-auto">
        {nnakItems.length > 0 && (
          <>
            <div className="px-2 pt-1 pb-1 text-[10px] uppercase tracking-wider text-white/50">
              NNAK Platform
            </div>
            <ul className="flex flex-col space-y-0.5 mb-3">
              {nnakItems.map((item) => (
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
                        item.active
                          ? "bg-primary text-white"
                          : "bg-white/15 text-white"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-[13px]">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="px-2 pt-1 pb-1 text-[10px] uppercase tracking-wider text-white/50">
              Legacy
            </div>
          </>
        )}
        <ul className="flex flex-col space-y-0.5">
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={handleLinkClick}
                className={`group flex items-center gap-2 rounded-lg px-2 py-1 transition-all ${
                  item.active
                    ? "bg-white text-primary shadow-sm"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-md shrink-0 ${
                    item.active
                      ? "bg-primary text-white"
                      : "bg-white/15 text-white"
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

      {/* Bottom Actions */}
      <div className="py-2 px-3 pb-2 border-t border-white/15">
        <button
          onClick={handleLogout}
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
