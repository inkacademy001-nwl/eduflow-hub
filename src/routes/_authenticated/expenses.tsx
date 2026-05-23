import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/expenses")({
  component: () => (
    <ComingSoon
      title="Expenses"
      description="Track rent, utilities, supplies and other operational costs. Coming soon."
    />
  ),
});
