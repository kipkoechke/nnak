"use client";
import Header from "./Header";
import Sidebar from "./Sidebar";
import MobileFooterNav from "./MobileFooterNav";

import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/hooks/auth/use-auth";

type AppLayoutProps = {
  children: ReactNode;
};

const AppLayout = ({ children }: AppLayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { data: user, isLoading, isError } = useMe();

  useEffect(() => {
    if (!isLoading && (isError || !user)) {
      router.replace("/login");
    }
  }, [isLoading, isError, user, router]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Show nothing while auth is being determined or if redirecting
  if (isLoading || isError || !user) {
    return null;
  }

  return (
    <div className="h-screen grid grid-cols-1 md:grid-cols-[auto_1fr] grid-rows-[auto_1fr] overflow-hidden">
      <Header
        onMenuToggle={toggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} onClose={closeMobileMenu} />
      <main className="overflow-auto bg-gray-50 md:col-start-2 relative pb-16 md:pb-2">
        {children}
      </main>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Footer Navigation for Customers */}
      <MobileFooterNav />
    </div>
  );
};

export default AppLayout;
