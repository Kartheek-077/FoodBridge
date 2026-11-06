import { Navigate, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { homePathForRole, useAuth } from "@/context/AuthContext";
import type { Role } from "@/lib/types";
import { PageSkeleton } from "./Skeletons";

/**
 * Role-based guard. Auth lives in localStorage (JWT), so the check runs after
 * hydration; a skeleton renders until the session is known.
 */
export function ProtectedRoute({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { status, role } = useAuth();
  const location = useLocation();

  if (status === "loading") return <PageSkeleton />;
  if (status === "anonymous") return <Navigate to="/login" search={{ redirect: location.href }} replace />;
  if (roles && role && !roles.includes(role)) return <Navigate to={homePathForRole(role)} replace />;
  return <>{children}</>;
}
