import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const Route = createFileRoute("/donor")({
  component: () => (
    <ProtectedRoute roles={["donor"]}>
      <Outlet />
    </ProtectedRoute>
  ),
});
