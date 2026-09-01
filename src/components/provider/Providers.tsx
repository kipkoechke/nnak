"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";
import ThemeProvider from "./ThemeProvider";
import { clearNnakSession } from "@/lib/auth";
import { isPublicPath } from "@/lib/public-routes";
import { useTokenRefresh } from "@/hooks/use-token-refresh";

export default function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  useTokenRefresh();

  useEffect(() => {
    const handler = () => {
      if (typeof window === "undefined") return;
      // A public page needs no session, so a 401 from one of its reads must
      // not throw a guest out to the login screen.
      if (isPublicPath(window.location.pathname)) return;
      clearNnakSession();
      window.location.href = "/nnak/login";
    };
    window.addEventListener("nnak:auth-expired", handler);
    return () => window.removeEventListener("nnak:auth-expired", handler);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#fff",
              color: "#1e293b",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: "#4ade80",
                secondary: "#fff",
              },
            },
            error: {
              duration: 4000,
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fff",
              },
            },
          }}
        />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
