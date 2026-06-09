"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MdInsertChart,
  MdPeople,
  MdEvent,
  MdPayments,
  MdReceipt,
  MdBadge,
  MdWorkOutline,
} from "react-icons/md";
import { useMe } from "@/hooks/use-auth";
import { isMemberRole } from "@/lib/rbac";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STAFF_NAV: NavItem[] = [
  { name: "Dashboard", href: "/nnak/dashboard", icon: MdInsertChart },
  { name: "Members", href: "/nnak/members", icon: MdPeople },
  { name: "Events", href: "/nnak/events", icon: MdEvent },
  { name: "Payments", href: "/nnak/payments", icon: MdPayments },
  { name: "Reports", href: "/nnak/reports", icon: MdReceipt },
];

const MEMBER_NAV: NavItem[] = [
  { name: "Portal", href: "/nnak/dashboard", icon: MdInsertChart },
  { name: "Membership", href: "/nnak/me/membership", icon: MdBadge },
  { name: "Workstations", href: "/nnak/me/workstations", icon: MdWorkOutline },
  { name: "Subscriptions", href: "/nnak/me/subscriptions", icon: MdReceipt },
];

const MobileFooterNav: React.FC = () => {
  const pathname = usePathname();
  const { data: user } = useMe();
  const items = isMemberRole(user) ? MEMBER_NAV : STAFF_NAV;
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active ? "text-primary" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <item.icon
                className={`w-6 h-6 ${active ? "scale-110" : ""} transition-transform`}
              />
              <span
                className={`text-[10px] mt-0.5 font-medium ${active ? "font-semibold" : ""}`}
              >
                {item.name}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileFooterNav;
