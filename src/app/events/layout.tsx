import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/common/Logo";
import { orgName } from "@/utils/logo";

export const metadata: Metadata = {
  title: "Events",
  description: `Upcoming ${orgName} conferences, workshops and CPD events. Browse the programme and register — no account needed.`,
  // The rest of the portal is behind a login and stays out of search results;
  // this section is meant to be found and shared.
  robots: { index: true, follow: true },
};

/**
 * Shell for the public events section.
 *
 * Deliberately not the `(public)` auth layout — that one is a narrow centred
 * card built for sign-in forms, which would squeeze an event listing. This is
 * a full-width page with a way back into the portal.
 */
export default function PublicEventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-primary text-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/events" className="flex items-center gap-2 min-w-0">
            <Logo />
          </Link>
          <Link
            href="/nnak/login"
            className="shrink-0 text-sm font-semibold bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors"
          >
            Member sign in
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            © {new Date().getFullYear()} {orgName}
          </span>
          <Link href="/nnak/privacy" className="hover:text-slate-700">
            Privacy policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
