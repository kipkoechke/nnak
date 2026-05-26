"use client";

import { ReactNode } from "react";
import { useMe } from "@/hooks/use-auth";
import type { NnakRole } from "@/types/nnak";

interface ProtectedProps {
  /** Roles allowed to see the children */
  roles: NnakRole[];
  /** Rendered when role check fails. Defaults to null. */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * UX-only guard — hides children when the current user's role is not in
 * the `roles` list. Security is enforced server-side.
 */
export function Protected({
  roles,
  fallback = null,
  children,
}: ProtectedProps) {
  const { data: user } = useMe();
  if (!user || !roles.includes(user.role)) return <>{fallback}</>;
  return <>{children}</>;
}
