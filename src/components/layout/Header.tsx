"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HiBars3, HiXMark } from "react-icons/hi2";
import {
  MdPerson,
  MdLogout,
  MdSettings,
  MdKeyboardArrowDown,
} from "react-icons/md";
import { useMe, useLogout } from "@/hooks/use-auth";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { logoSrc, appName } from "@/utils/logo";
import { NNAK_ROLES } from "@/lib/rbac";

interface HeaderProps {
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

const Header = ({ onMenuToggle, isMobileMenuOpen }: HeaderProps) => {
  const router = useRouter();
  const { data: user } = useMe();
  const logoutMutation = useLogout();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useOutsideClick(() => setIsProfileOpen(false));

  const handleLogout = () => logoutMutation.mutate();
  const handleProfileClick = () => {
    setIsProfileOpen(false);
    router.push("/nnak/profile");
  };

  return (
    <div className="border-b border-primary-dark bg-primary flex items-center justify-between px-3 md:px-6 py-2 col-span-full sticky top-0 z-30">
      <div className="flex items-center min-w-0">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2 mr-2 text-white"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <HiXMark className="w-6 h-6" />
          ) : (
            <HiBars3 className="w-6 h-6" />
          )}
        </button>
        <Link href="/nnak/dashboard" className="flex items-center gap-2 min-w-0">
          <Image
            src={logoSrc}
            alt={appName}
            width={140}
            height={56}
            className="h-12 w-auto shrink-0"
            unoptimized
          />
        </Link>
      </div>

      <div className="flex items-center gap-2">
        {user && (
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            >
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <MdPerson className="w-5 h-5 text-white" />
              </div>
              <div className="hidden md:flex items-center gap-1">
                <span className="font-semibold text-sm text-white whitespace-nowrap">
                  {user.name}
                </span>
                <MdKeyboardArrowDown className="w-4 h-4 text-white/80" />
              </div>
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-lg shadow-xl border border-slate-200 bg-white z-50 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary-subtle flex items-center justify-center border-2 border-primary-muted">
                      <MdPerson className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {user.email}
                      </p>
                      <p className="text-[11px] mt-0.5 text-primary font-medium">
                        {NNAK_ROLES[user.role] ?? user.role}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-sm transition-colors"
                  >
                    <MdSettings className="w-4 h-4" />
                    Profile Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-medium text-sm transition-colors disabled:opacity-50"
                  >
                    <MdLogout className="w-4 h-4" />
                    {logoutMutation.isPending ? "Logging out..." : "Logout"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
