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
  MdWorkOutline,
  // MdAnalytics, // restore with the Analytics menu item
  MdSwapHoriz,
  MdMailOutline,
  MdAttachMoney,
  MdExpandMore,
  MdExpandLess,
  MdPersonOutline,
} from "react-icons/md";
import { isMemberRole } from "@/lib/rbac";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useMemo, useState } from "react";
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

interface MenuGroup {
  /** Optional header. When absent, the items render with no separator. */
  name?: string;
  items: MenuItem[];
  /** If true, the group can be expanded / collapsed by the user. */
  collapsible?: boolean;
  /** Icon for the collapsible header. */
  headerIcon?: React.ComponentType<{ className?: string }>;
  /** Stable key used to persist collapsed state in component state. */
  key: string;
}

const STAFF_ITEMS: MenuItem[] = [
  {
    name: "Dashboard",
    icon: MdInsertChart,
    href: "/nnak/dashboard",
    show: nnakCan.viewDashboard,
  },
  {
    name: "Members",
    icon: MdPeople,
    href: "/nnak/members",
    show: nnakCan.manageMembers,
  },
  {
    name: "By-Product",
    icon: MdHowToReg,
    href: "/nnak/byproduct",
    show: nnakCan.reconcileByProduct,
  },
  {
    name: "Events",
    icon: MdEvent,
    href: "/nnak/events",
    show: nnakCan.manageEvents,
  },
  {
    name: "Payments",
    icon: MdPayments,
    href: "/nnak/payments",
    show: nnakCan.viewFinancials,
  },
  // Temporarily hidden.
  // {
  //   name: "Reports",
  //   icon: MdReceipt,
  //   href: "/nnak/reports",
  //   show: nnakCan.viewReports,
  // },
  {
    name: "Branches",
    icon: MdBusiness,
    href: "/nnak/branches",
    show: nnakCan.manageBranches,
  },
  {
    name: "Branch Invites",
    icon: MdMailOutline,
    href: "/nnak/branch-invites",
    show: nnakCan.viewAdminInvites,
  },
  {
    name: "Member Transfers",
    icon: MdSwapHoriz,
    href: "/nnak/branch-transfers",
    show: nnakCan.viewAdminInvites,
  },
  {
    name: "Invite Members",
    icon: MdMailOutline,
    href: "/nnak/branch/invites",
    show: nnakCan.manageBranchInvites,
  },
  {
    name: "Transfers",
    icon: MdSwapHoriz,
    href: "/nnak/branch/transfers",
    show: nnakCan.manageBranchInvites,
  },
  {
    name: "Monthly Batches",
    icon: MdReceipt,
    href: "/nnak/branch/batches",
    show: nnakCan.viewBranchBatches,
  },
  {
    name: "Categories",
    icon: MdCategory,
    href: "/nnak/categories",
    show: nnakCan.upgradeCategory,
  },
  {
    name: "Institutions",
    icon: MdBusiness,
    href: "/nnak/institutions",
    show: nnakCan.manageMembers,
  },
  {
    name: "M-Pesa Transactions",
    icon: MdPayments,
    href: "/nnak/mpesa-transactions",
    show: nnakCan.viewFinancials,
  },
  {
    name: "Branch Batching",
    icon: MdAttachMoney,
    href: "/nnak/finance/batches",
    show: nnakCan.viewFinancials,
  },
  // Temporarily hidden.
  // {
  //   name: "Analytics",
  //   icon: MdAnalytics,
  //   href: "/nnak/analytics",
  //   show: nnakCan.viewReports,
  // },
  {
    name: "Check-In",
    icon: MdQrCodeScanner,
    href: "/nnak/checkin",
    show: nnakCan.checkInAttendees,
  },
  {
    name: "Admins",
    icon: MdShield,
    href: "/nnak/admins",
    show: nnakCan.manageRoles,
  },
  {
    name: "Audit Log",
    icon: MdHistory,
    href: "/nnak/ilm/audit",
    show: nnakCan.viewAuditLog,
  },
  {
    name: "Data Exports",
    icon: MdFolderShared,
    href: "/nnak/ilm/exports",
    show: nnakCan.approveDataExport,
  },
  {
    name: "Erasure",
    icon: MdShield,
    href: "/nnak/ilm/erasure",
    show: nnakCan.manageILM,
  },
];

const FINANCE_ITEMS: MenuItem[] = [
  { name: "Dashboard", icon: MdInsertChart, href: "/nnak/finance/dashboard" },
  { name: "Members", icon: MdPeople, href: "/nnak/finance/members" },
  { name: "Branches", icon: MdBusiness, href: "/nnak/finance/branches" },
  { name: "Batches", icon: MdAttachMoney, href: "/nnak/finance/batches" },
  { name: "Payments", icon: MdPayments, href: "/nnak/finance/payments" },
  { name: "Remittances", icon: MdSwapHoriz, href: "/nnak/finance/remittances" },
  { name: "By-Product", icon: MdReceipt, href: "/nnak/finance/byproducts" },
];

const MEMBER_ITEMS: MenuItem[] = [
  { name: "My Portal", icon: MdInsertChart, href: "/nnak/dashboard" },
  {
    name: "My Membership",
    icon: MdBadge,
    href: "/nnak/me/membership",
    show: nnakCan.viewMyMembership,
  },
  {
    name: "Invites",
    icon: MdMailOutline,
    href: "/nnak/me/invites",
    show: nnakCan.viewMyInvites,
  },
  {
    name: "Workstations",
    icon: MdWorkOutline,
    href: "/nnak/me/workstations",
    show: nnakCan.viewMyWorkstations,
  },
  {
    name: "Subscriptions",
    icon: MdReceipt,
    href: "/nnak/me/subscriptions",
    show: nnakCan.viewMyPayments,
  },
  {
    name: "Events",
    icon: MdEvent,
    href: "/nnak/me/events",
    show: nnakCan.viewMyMembership,
  },
  {
    name: "Bookings",
    icon: MdReceipt,
    href: "/nnak/me/bookings",
    show: (u) => u?.role === "student",
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isMobileMenuOpen, onClose }) => {
  const pathname = usePathname();
  const { data: user } = useMe();
  const logoutMutation = useLogout();

  const groups = useMemo<MenuGroup[]>(() => {
    const isMember = isMemberRole(user);
    const isBranchManager = user?.role === "branch_manager";
    const isFinance = user?.role === "finance";

    if (isMember) {
      return [{ key: "member", items: MEMBER_ITEMS }];
    }
    if (isFinance) {
      return [{ key: "finance", items: FINANCE_ITEMS }];
    }
    if (isBranchManager) {
      // Member-portal items live alongside the manager's branch items.
      // Drop the duplicated dashboard entry from the member list — staff
      // already get one at the top.
      const memberItems = MEMBER_ITEMS.filter(
        (i) => i.href !== "/nnak/dashboard",
      );
      return [
        { key: "branch", items: STAFF_ITEMS },
        {
          key: "my-portal",
          name: "My Member Portal",
          headerIcon: MdPersonOutline,
          items: memberItems,
          collapsible: true,
        },
      ];
    }
    return [{ key: "staff", items: STAFF_ITEMS }];
  }, [user]);

  // Auto-expand the My Member Portal group when the user is on a /me/* page.
  const onMyPortalRoute = pathname?.startsWith("/nnak/me/") ?? false;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const renderItem = (item: MenuItem) => {
    const active = pathname?.startsWith(item.href) ?? false;
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={() => onClose?.()}
          className={`group flex items-center gap-2 rounded-lg px-2 py-1 transition-all ${
            active
              ? "bg-white text-primary shadow-sm"
              : "text-white/90 hover:bg-white/10 hover:text-white"
          }`}
        >
          <div
            className={`flex items-center justify-center w-6 h-6 rounded-md shrink-0 ${
              active ? "bg-primary text-white" : "bg-white/15 text-white"
            }`}
          >
            <item.icon className="w-4 h-4" />
          </div>
          <span className="font-medium text-[13px]">{item.name}</span>
        </Link>
      </li>
    );
  };

  return (
    <div
      className={`bg-primary-dark text-white flex flex-col min-h-0 overflow-hidden transition-all duration-300 fixed md:relative inset-y-0 left-0 z-50 w-64 md:w-56 ${
        isMobileMenuOpen
          ? "translate-x-0"
          : "-translate-x-full md:translate-x-0"
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

      <nav className="flex-1 min-h-0 py-2 px-3 overflow-y-auto">
        {groups.map((g) => {
          const visible = g.items.filter((i) =>
            i.show ? i.show(user) : true,
          );
          if (visible.length === 0) return null;

          if (!g.collapsible) {
            return (
              <ul key={g.key} className="flex flex-col space-y-0.5 mb-2">
                {g.name && (
                  <li className="px-2 pt-2 pb-1 text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                    {g.name}
                  </li>
                )}
                {visible.map(renderItem)}
              </ul>
            );
          }

          // Collapsible: default open if user is on a member-portal route.
          const isOpen =
            collapsed[g.key] === undefined
              ? onMyPortalRoute
              : !collapsed[g.key];
          const Icon = g.headerIcon;
          return (
            <div key={g.key} className="mt-3">
              <button
                type="button"
                onClick={() =>
                  setCollapsed((c) => ({ ...c, [g.key]: isOpen }))
                }
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition"
              >
                <span className="flex items-center gap-2">
                  {Icon && (
                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-white/15">
                      <Icon className="w-4 h-4" />
                    </span>
                  )}
                  <span className="text-[11px] uppercase tracking-wider font-semibold">
                    {g.name}
                  </span>
                </span>
                {isOpen ? (
                  <MdExpandLess className="w-4 h-4" />
                ) : (
                  <MdExpandMore className="w-4 h-4" />
                )}
              </button>
              {isOpen && (
                <ul className="flex flex-col space-y-0.5 mt-1 pl-2 border-l border-white/15 ml-3">
                  {visible.map(renderItem)}
                </ul>
              )}
            </div>
          );
        })}
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
