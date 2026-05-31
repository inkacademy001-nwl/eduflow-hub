import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { facultyApi, Teacher, FacultyDashboardData } from "@/lib/faculty-api";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_faculty/breakdown")({
  component: BreakdownPage,
});

function BreakdownPage() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [dashboard, setDashboard] = useState<FacultyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (user?.facultyId) {
      const now = new Date();
      const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      setLoading(true);
      Promise.all([
        facultyApi.fetchFacultyById(user.facultyId),
        facultyApi.fetchFacultyDashboard(user.facultyId, targetDate.getMonth() + 1, targetDate.getFullYear())
      ])
        .then(([t, d]) => {
          setTeacher(t);
          setDashboard(d);
          setLoading(false);
        })
        .catch((e) => {
          console.error(e);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user?.facultyId, offset]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Loading salary breakdown...
        </div>
      </div>
    );
  }

  if (!teacher || !dashboard) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Unable to load salary breakdown.
        </div>
      </div>
    );
  }

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  
  const now = new Date();
  const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);

  let isPrevDisabled = false;
  if (teacher?.joiningDate) {
    const joinDate = new Date(teacher.joiningDate);
    if (
      targetDate.getFullYear() < joinDate.getFullYear() ||
      (targetDate.getFullYear() === joinDate.getFullYear() && targetDate.getMonth() <= joinDate.getMonth())
    ) {
      isPrevDisabled = true;
    }
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight">Salary Breakdown</h1>
        <p className="text-sm text-muted-foreground">
          Detailed{" "}
          {teacher.salaryType === "daily" ? "daily-rate" : "hourly-rate"} breakdown
        </p>
      </div>

      <div className="mx-auto max-w-sm">
        {/* Month Navigation */}
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-sm">
          <button
            onClick={() => setOffset((o) => o - 1)}
            disabled={isPrevDisabled}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-25"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">
            {targetDate.toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
              timeZone: "Asia/Kolkata",
            })}
          </span>
          <button
            onClick={() => setOffset((o) => Math.min(0, o + 1))}
            disabled={offset >= 0}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-25"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {/* Pay type badge */}
        <div className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {teacher.salaryType === "daily" ? "📅 Daily Basis" : "⏱️ Hourly Basis"}
        </div>

        {/* Breakdown card */}
        {dashboard.salary?.isFinalized ? (
          <div className="rounded-2xl border border-border bg-card shadow-sm">
            {/* Breakdown rows */}
            <div className="divide-y divide-border">
              {teacher.salaryType === "daily" ? (
                <>
                  <BreakdownRow label="Monthly Salary" value={fmt(dashboard.salary.basicPay || 0)} />
                  <BreakdownRow
                    label="Bonus"
                    value={dashboard.salary.bonus > 0 ? `+ ${fmt(dashboard.salary.bonus)}` : "None"}
                    positive={dashboard.salary.bonus > 0}
                  />
                  <BreakdownRow
                    label="Deductions (PF)"
                    value={dashboard.salary.deductions > 0 ? `- ${fmt(dashboard.salary.deductions)}` : "None"}
                    negative={dashboard.salary.deductions > 0}
                  />
                </>
              ) : (
                <>
                  <BreakdownRow label="Hourly Rate" value={fmt(dashboard.salary.hourlyRate ?? 0)} />
                  <BreakdownRow label="Total Hours Worked" value={String(dashboard.salary.totalHours ?? 0)} />
                  <BreakdownRow
                    label="Base Pay"
                    value={fmt((dashboard.salary.hourlyRate ?? 0) * (dashboard.salary.totalHours ?? 0))}
                    sub="Hourly Rate × Total Hours"
                    bold
                  />
                  <BreakdownRow
                    label="Bonus"
                    value={dashboard.salary.bonus > 0 ? `+ ${fmt(dashboard.salary.bonus)}` : "None"}
                    positive={dashboard.salary.bonus > 0}
                  />
                  <BreakdownRow
                    label="Deductions"
                    value={dashboard.salary.deductions > 0 ? `- ${fmt(dashboard.salary.deductions)}` : "None"}
                    negative={dashboard.salary.deductions > 0}
                  />
                </>
              )}
            </div>

            {/* Final Salary */}
            <div className="border-t-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-primary">Final Salary</span>
                <span className="text-2xl font-extrabold text-primary">
                  {fmt(dashboard.salary.finalSalary || 0)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4 rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">
              Salary details for this month have not been finalized yet.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Please check back after it is processed.
            </p>
          </div>
        )}

        {/* Attendance summary */}
        <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Attendance This Month
          </p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniStat label="Present" value={dashboard.attendanceStats.present} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-500/10" />
            <MiniStat label="Absent" value={dashboard.attendanceStats.absent} color="text-red-600 dark:text-red-400" bg="bg-red-500/10" />
            <MiniStat label="Late" value={dashboard.attendanceStats.late} color="text-amber-600 dark:text-amber-400" bg="bg-amber-500/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  sub,
  bold,
  negative,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  bold?: boolean;
  negative?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <p className={cn("text-sm", bold ? "font-semibold" : "text-muted-foreground")}>
          {label}
        </p>
        {sub && <p className="text-[11px] text-muted-foreground/70">{sub}</p>}
      </div>
      <span
        className={cn(
          "text-sm font-semibold",
          negative && "text-red-600 dark:text-red-400",
          positive && "text-emerald-600 dark:text-emerald-400",
          bold && "text-base",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className={cn("rounded-xl p-2.5", bg)}>
      <p className={cn("text-xl font-bold", color)}>{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
