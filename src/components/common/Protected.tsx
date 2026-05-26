"use client";

import { useMe } from "@/hooks/auth/use-auth";
import type { Role } from "@/types/api";
import { ReactNode } from "react";

interface ProtectedProps {
  /** Roles allowed to see the children */
  roles: Role[];
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

  if (!user || !roles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
