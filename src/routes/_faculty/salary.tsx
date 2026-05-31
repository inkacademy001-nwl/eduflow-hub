import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { facultyApi, Teacher, FacultyDashboardData } from "@/lib/faculty-api";
import { attendanceApi, CalendarDayData } from "@/lib/attendance-api";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  Clock,
} from "lucide-react";

export const Route = createFileRoute("/_faculty/salary")({
  component: FacultyAttendancePage,
});

function FacultyAttendancePage() {
  const { user } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [dashboard, setDashboard] = useState<FacultyDashboardData | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarDayData[]>([]);
  const [loading, setLoading] = useState(true);

  const [showDetail, setShowDetail] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (user?.facultyId) {
      const now = new Date();
      const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      
      Promise.all([
        facultyApi.fetchFacultyById(user.facultyId),
        facultyApi.fetchFacultyDashboard(user.facultyId, targetDate.getMonth() + 1, targetDate.getFullYear()),
        attendanceApi.fetchCalendar(user.facultyId, targetDate.getMonth() + 1, targetDate.getFullYear())
      ])
        .then(([t, d, cal]) => {
          setTeacher(t);
          setDashboard(d);
          setCalendarData(cal.data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
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
          Loading attendance data...
        </div>
      </div>
    );
  }

  if (!teacher || !dashboard) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Unable to load attendance data.
        </div>
      </div>
    );
  }

  const isDaily = teacher.salaryType === "daily";
  const expectedHours = teacher.expectedHours ?? 0;
  const summary = dashboard.attendanceStats;
  const totalDays = summary.present + summary.absent + summary.late;

  const now = new Date();
  const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const monthHours = calendarData.reduce((acc, curr) => acc + (curr.totalHours || 0), 0);
  const weekHours = offset === 0 
    ? calendarData.reduce((acc, curr) => {
        const d = new Date(curr.date);
        if (d >= startOfWeek && d <= endOfWeek) {
          return acc + (curr.totalHours || 0);
        }
        return acc;
      }, 0)
    : Math.round(monthHours / 4);

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
        <h1 className="text-xl font-semibold tracking-tight">My Attendance</h1>
        <p className="text-sm text-muted-foreground">
          {targetDate.toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "Asia/Kolkata" })} ·{" "}
          {teacher.fullName}
        </p>
      </div>

      <div className="mx-auto max-w-sm space-y-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-sm">
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

        {/* Attendance Stats */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isDaily ? "Attendance Overview" : "Hours Overview"}
          </p>

          {isDaily ? (
            <div className="grid grid-cols-3 gap-2">
              <StatPill color="success" label="Present" value={summary.present} />
              <StatPill color="destructive" label="Absent" value={summary.absent} />
              <StatPill color="warning" label="Late" value={summary.late} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-primary/10 p-4 text-center">
                <p className="text-3xl font-bold text-primary">{weekHours}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Hours / Week
                </p>
              </div>
              <div className="rounded-xl bg-primary/10 p-4 text-center">
                <p className="text-3xl font-bold text-primary">{monthHours}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Hours / Month
                </p>
              </div>
            </div>
          )}

          {/* Summary row */}
          {isDaily && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-accent/50 px-3 py-2">
              <span className="text-xs text-muted-foreground">Total Working Days</span>
              <span className="text-sm font-semibold">{totalDays}</span>
            </div>
          )}
        </div>

        {/* Attendance Percentage */}
        {isDaily && totalDays > 0 && (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Attendance Rate
            </p>
            <div className="flex items-center gap-3">
              <div className="relative h-16 w-16">
                <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                  <circle
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="text-border"
                  />
                  <circle
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeDasharray={`${Math.round((summary.present / totalDays) * 100)} 100`}
                    strokeLinecap="round"
                    className="text-primary"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                  {Math.round((summary.present / totalDays) * 100)}%
                </span>
              </div>
              <div className="flex-1 space-y-1.5">
                <ProgressBar
                  label="Present"
                  value={summary.present}
                  total={totalDays}
                  color="bg-emerald-500"
                />
                <ProgressBar
                  label="Late"
                  value={summary.late}
                  total={totalDays}
                  color="bg-amber-500"
                />
                <ProgressBar
                  label="Absent"
                  value={summary.absent}
                  total={totalDays}
                  color="bg-red-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Attendance Calendar */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Attendance Calendar
          </p>
          <AttendanceCalendar 
            offset={offset} 
            calendarData={calendarData} 
          />
        </div>

        {/* Detailed Info Toggle */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <button
            onClick={() => setShowDetail((v) => !v)}
            className="flex w-full items-center justify-between text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Daily Check-in / Check-out
            </span>
            {showDetail ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {showDetail && (
            <DetailTable 
              calendarData={calendarData} 
              isDaily={isDaily} 
            />
          )}
        </div>

        {/* Faculty Info */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Faculty Info
          </p>
          <div className="space-y-2 text-sm">
            <InfoRow label="Name" value={teacher.fullName} />
            <InfoRow label="ID" value={teacher.id} />
            <InfoRow label="Designation" value={teacher.designation} />
            <InfoRow label="Subjects" value={teacher.subjects.join(", ")} />
            <InfoRow label="Classes" value={teacher.classes.join(", ")} />
            <InfoRow
              label="Pay Type"
              value={isDaily ? "Daily Rate" : "Hourly Rate"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Stat pill ──────────────────────────────────────────────────────────── */
function StatPill({
  color,
  label,
  value,
}: {
  color: "success" | "destructive" | "warning";
  label: string;
  value: number;
}) {
  const styles = {
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    destructive: "bg-red-500/10 text-red-600 dark:text-red-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  };
  return (
    <div className={cn("rounded-xl p-3 text-center", styles[color])}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

/* ─── Progress bar ───────────────────────────────────────────────────────── */
function ProgressBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 text-[10px] text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-5 text-right text-[10px] font-medium">{value}</span>
    </div>
  );
}

/* ─── Info row ───────────────────────────────────────────────────────────── */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  );
}

/* ─── Attendance Calendar ────────────────────────────────────────────────── */
function AttendanceCalendar({ 
  offset, 
  calendarData 
}: { 
  offset: number; 
  calendarData: CalendarDayData[];
}) {
  const now = new Date();
  const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);

  const firstDow = targetDate.getDay();
  const DAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div>
      {/* Day-of-week headers */}
      <div className="mb-1 grid grid-cols-7">
        {DAY_HEADERS.map((d, i) => (
          <div
            key={i}
            className="py-1 text-center text-[10px] font-bold tracking-wide text-muted-foreground/50"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {calendarData.map((d, i) => (
          <CalendarDay key={i} day={d.day} status={d.status === "EMPTY" ? "none" : d.status.toLowerCase() as any} />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-border pt-3 text-[9px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border-[1.5px] border-primary bg-primary/15">
            <Check className="h-2 w-2 text-primary" strokeWidth={3.5} />
          </span>
          Present
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          Absent
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border-[1.5px] border-amber-400 bg-amber-400/15">
            <Check className="h-2 w-2 text-amber-400" strokeWidth={3.5} />
          </span>
          Late
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-sm bg-violet-500/60" />
          Holiday
        </span>
      </div>
    </div>
  );
}

/* ─── Single calendar day cell ──────────────────────────────────────────── */
function CalendarDay({ day, status }: { day: number; status: "present" | "absent" | "late" | "holiday" | "none" }) {
  if (status === "none") {
    return (
      <div className="flex flex-col items-center py-0.5">
        <span className="text-[10px] text-muted-foreground/25">{day}</span>
      </div>
    );
  }
  if (status === "present") {
    return (
      <div className="flex flex-col items-center py-0.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-primary/15">
          <Check className="h-3 w-3 text-primary" strokeWidth={3.5} />
        </div>
      </div>
    );
  }
  if (status === "absent") {
    return (
      <div className="flex flex-col items-center py-0.5">
        <span className="text-[10px] text-muted-foreground/60">{day}</span>
        <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-400" />
      </div>
    );
  }
  if (status === "late") {
    return (
      <div className="flex flex-col items-center py-0.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-400/15">
          <Check className="h-3 w-3 text-amber-400" strokeWidth={3.5} />
        </div>
      </div>
    );
  }
  if (status === "holiday") {
    return (
      <div className="flex flex-col items-center py-0.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/25">
          <span className="text-[10px] font-semibold text-violet-500 dark:text-violet-300">
            {day}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

/* ─── Detailed attendance table ──────────────────────────────────────────── */
function DetailTable({ 
  calendarData,
  isDaily
}: { 
  calendarData: CalendarDayData[];
  isDaily: boolean;
}) {
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return date.toLocaleTimeString(undefined, { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="mt-3 max-h-56 overflow-y-auto rounded-xl border border-border">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-accent text-[10px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2 text-left">Date</th>
            <th className="px-3 py-2 text-left">Status</th>
            <th className="px-3 py-2 text-left">Check-in</th>
            <th className="px-3 py-2 text-left">Check-out</th>
            {!isDaily && <th className="px-3 py-2 text-left">Total Hrs</th>}
          </tr>
        </thead>
        <tbody>
          {calendarData.filter(d => d.status !== "EMPTY").map((d, i) => {
            const dt = new Date(d.date);
            const label = dt.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              timeZone: "Asia/Kolkata",
            });
            const statusLabel =
              d.status === "PRESENT" ? "Present"
              : d.status === "ABSENT" ? "Absent"
              : d.status === "LATE" ? "Late"
              : d.status === "HOLIDAY" ? "Holiday"
              : "—";
            const statusColor =
              d.status === "PRESENT" ? "text-emerald-600 dark:text-emerald-400"
              : d.status === "ABSENT" ? "text-red-600 dark:text-red-400"
              : d.status === "LATE" ? "text-amber-600 dark:text-amber-400"
              : d.status === "HOLIDAY" ? "text-violet-600 dark:text-violet-400"
              : "text-muted-foreground";
              
            return (
              <tr key={i} className="border-t border-border">
                <td className="px-3 py-2 text-muted-foreground">{label}</td>
                <td className={cn("px-3 py-2 font-medium", statusColor)}>
                  {statusLabel}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {formatTime(d.inTime)}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {formatTime(d.outTime)}
                </td>
                {!isDaily && (
                  <td className="px-3 py-2 text-muted-foreground">
                    {d.totalHours ? d.totalHours : "—"}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
      {calendarData.filter(d => d.status !== "EMPTY").length === 0 && (
        <div className="py-4 text-center text-muted-foreground">
          No records found.
        </div>
      )}
    </div>
  );
}
