import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
import { homePathForRole, useAuth } from "@/context/AuthContext";
import type { Role } from "@/lib/types";
import { PageSkeleton } from "./Skeletons";

/**
 * Role-based guard. Auth lives in localStorage (JWT), so the check runs after
 * hydration; a skeleton renders until the session is known.
 *
 * Redirects fire once from an effect (not a <Navigate> element): a <Navigate>
 * whose `redirect` search is built from the live location re-fires on every
 * location change while this layout is still mounted, which looped forever on logout.
 */
export function ProtectedRoute({ roles, children }: { roles?: Role[]; children: ReactNode }) {
  const { status, role } = useAuth();
  const navigate = useNavigate();
  const redirected = useRef(false);

  const needsLogin = status === "anonymous";
  const wrongRole = status === "authenticated" && !!roles && !!role && !roles.includes(role);

  useEffect(() => {
    if (status === "authenticated" && !wrongRole) {
      redirected.current = false;
      return;
    }
    if (redirected.current) return;
    if (needsLogin) {
      redirected.current = true;
      const here = window.location.pathname + window.location.search;
      const redirect = here.startsWith("/login") || here === "/" ? undefined : here;
      void navigate({ to: "/login", search: { redirect }, replace: true });
    } else if (wrongRole) {
      redirected.current = true;
      void navigate({ to: homePathForRole(role), replace: true });
    }
  }, [status, needsLogin, wrongRole, role, navigate]);

  if (status !== "authenticated" || wrongRole) return <PageSkeleton />;
  return <>{children}</>;
}
