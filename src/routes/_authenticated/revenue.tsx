import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/revenue")({
  component: RevenuePage,
});

function RevenuePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (user && user.role !== "Owner") navigate({ to: "/dashboard" });
  }, [user, navigate]);
  return (
    <ComingSoon
      title="Revenue"
      description="Owner-only view of fees collected, dues and forecasts. Coming soon."
      ownerOnly
    />
  );
}
