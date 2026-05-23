import { Construction, Lock } from "lucide-react";

export function ComingSoon({
  title,
  description,
  ownerOnly,
}: {
  title: string;
  description?: string;
  ownerOnly?: boolean;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      </div>
      <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-primary">
          {ownerOnly ? <Lock className="h-7 w-7" /> : <Construction className="h-7 w-7" />}
        </div>
        <h2 className="mt-4 text-xl font-semibold">Coming Soon</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {description ?? "This module is under construction and will be available shortly."}
        </p>
      </div>
    </div>
  );
}
