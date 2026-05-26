import { createFileRoute, Navigate } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";
import { useAuth } from "@/lib/auth";
import { canAccess } from "@/config/rolePermissions";

export const Route = createFileRoute("/_authenticated/expenses")({
  component: ExpensesRoute,
});

function ExpensesRoute() {
  const { user } = useAuth();
  if (!user || !canAccess(user.role, "expenses")) {
    return <Navigate to={user?.role === "Faculty" ? "/" : "/dashboard"} replace />;
  }

  return (
    <ComingSoon
      title="Expenses"
      description="Track rent, utilities, supplies and other operational costs. Coming soon."
    />
  );
}
