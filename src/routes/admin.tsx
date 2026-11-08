import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const Route = createFileRoute("/admin")({
  component: () => (
    <ProtectedRoute roles={["admin"]}>
      <Outlet />
    </ProtectedRoute>
  ),
});
