import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { canAccess } from "@/config/rolePermissions";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/revenue")({
  component: RevenuePage,
});

function RevenuePage() {
  const { user } = useAuth();
  if (!user || !canAccess(user.role, "revenue")) {
    return <Navigate to={user?.role === "Faculty" ? "/" : "/dashboard"} replace />;
  }

  return (
    <ComingSoon
      title="Revenue"
      description="Owner-only view of fees collected, dues and forecasts. Coming soon."
      ownerOnly
    />
  );
}
