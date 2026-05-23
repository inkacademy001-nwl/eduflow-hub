import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, PieChart, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Your tuition center, at a glance.
        </p>
      </div>

      <div className="rounded-2xl border border-dashed border-primary/30 bg-gradient-to-br from-accent/40 to-background p-10 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="mt-4 text-xl font-semibold">Analytics — Coming Soon</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          We're working on your analytics dashboard. Soon you'll see live charts for
          enrolments, attendance, revenue and payroll right here.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Link to="/students">
            <Button variant="outline" size="sm">View Students</Button>
          </Link>
          <Link to="/faculty">
            <Button variant="outline" size="sm">View Faculty</Button>
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { title: "Enrolments by Month", icon: BarChart3 },
          { title: "Attendance Trend", icon: TrendingUp },
          { title: "Subject Distribution", icon: PieChart },
        ].map((c) => (
          <div
            key={c.title}
            className="rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{c.title}</h3>
              <c.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-4 flex h-40 items-end justify-around rounded-lg bg-gradient-to-t from-accent/40 to-transparent p-3">
              {[40, 70, 55, 85, 60, 90].map((h, i) => (
                <div
                  key={i}
                  className="w-4 rounded-t bg-primary/30"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Placeholder — charts go live soon.
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
