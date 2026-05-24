import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAuth } from "@/lib/auth";
import { getTeacherById, getFacultySalarySummary, attendanceSummary } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_faculty/breakdown")({
  component: BreakdownPage,
});

function BreakdownPage() {
  const { user } = useAuth();
  const teacher = useMemo(
    () => (user?.facultyId ? getTeacherById(user.facultyId) : undefined),
    [user?.facultyId],
  );
  const salary = useMemo(
    () => (teacher ? getFacultySalarySummary(teacher) : null),
    [teacher],
  );
  const attendance = useMemo(
    () => (teacher ? attendanceSummary(teacher.id) : null),
    [teacher],
  );

  if (!teacher || !salary) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Unable to load salary breakdown.
        </div>
      </div>
    );
  }

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight">Salary Breakdown</h1>
        <p className="text-sm text-muted-foreground">
          Detailed{" "}
          {salary.payType === "daily" ? "daily-rate" : "hourly-rate"} breakdown ·{" "}
          {new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="mx-auto max-w-sm">
        {/* Pay type badge */}
        <div className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          {salary.payType === "daily" ? "📅 Daily Rate" : "⏱️ Hourly Rate"}
        </div>

        {/* Breakdown card */}
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          {/* Breakdown rows */}
          <div className="divide-y divide-border">
            {salary.payType === "daily" ? (
              <>
                <BreakdownRow label="Daily Rate" value={fmt(salary.dailyRate ?? 0)} />
                <BreakdownRow label="Working Days" value={String(salary.workingDays ?? 0)} />
                <BreakdownRow
                  label="Base Pay"
                  value={fmt((salary.dailyRate ?? 0) * (salary.workingDays ?? 0))}
                  sub="Daily Rate × Working Days"
                />
                {(salary.hra ?? 0) > 0 && (
                  <BreakdownRow label="HRA" value={fmt(salary.hra ?? 0)} />
                )}
                <BreakdownRow
                  label="Gross Pay (Basic Pay)"
                  value={fmt(salary.basicPay)}
                  bold
                />
                <BreakdownRow
                  label="Deductions (PF)"
                  value={salary.deductions > 0 ? `- ${fmt(salary.deductions)}` : "None"}
                  sub={salary.pf ? `Provident Fund: ${fmt(salary.pf)}` : undefined}
                  negative={salary.deductions > 0}
                />
                <BreakdownRow
                  label="Bonus"
                  value={salary.bonus > 0 ? `+ ${fmt(salary.bonus)}` : "None"}
                  positive={salary.bonus > 0}
                />
              </>
            ) : (
              <>
                <BreakdownRow label="Hourly Rate" value={fmt(salary.hourlyRate ?? 0)} />
                <BreakdownRow label="Total Hours Worked" value={String(salary.totalHours ?? 0)} />
                <BreakdownRow
                  label="Base Pay"
                  value={fmt(salary.basicPay)}
                  sub="Hourly Rate × Total Hours"
                  bold
                />
                {(salary.overtimeRate ?? 0) > 0 && (
                  <BreakdownRow
                    label="Overtime Rate"
                    value={`${fmt(salary.overtimeRate ?? 0)}/hr`}
                    sub="For hours beyond expected"
                  />
                )}
                <BreakdownRow
                  label="Bonus"
                  value={salary.bonus > 0 ? `+ ${fmt(salary.bonus)}` : "None"}
                  positive={salary.bonus > 0}
                />
                <BreakdownRow
                  label="Deductions"
                  value={salary.deductions > 0 ? `- ${fmt(salary.deductions)}` : "None"}
                  negative={salary.deductions > 0}
                />
              </>
            )}
          </div>

          {/* Final Salary */}
          <div className="border-t-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-primary">Final Salary</span>
              <span className="text-2xl font-extrabold text-primary">
                {fmt(salary.netSalary)}
              </span>
            </div>
          </div>
        </div>

        {/* Attendance summary */}
        {attendance && (
          <div className="mt-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Attendance This Month
            </p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <MiniStat label="Present" value={attendance.present} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-500/10" />
              <MiniStat label="Absent" value={attendance.absent} color="text-red-600 dark:text-red-400" bg="bg-red-500/10" />
              <MiniStat label="Late" value={attendance.late} color="text-amber-600 dark:text-amber-400" bg="bg-amber-500/10" />
            </div>
          </div>
        )}
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
