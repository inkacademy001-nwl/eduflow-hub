import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  attendanceSummary,
  deleteTeacher,
  getAttendanceFor,
  getTeachers,
  type DayStatus,
  type Teacher,
} from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Pencil,
  Trash2,
  Sheet as SheetIcon,
  Calendar,
  Clock,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/faculty")({
  component: FacultyPage,
});

function FacultyPage() {
  const [, force] = useState({});
  const refresh = () => force({});
  const [tab, setTab] = useState<"daily" | "hourly">("daily");
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const all = getTeachers();
  const list = all.filter((t) => t.salaryType === tab);

  const onExportSheets = () => {
    const teachers = getTeachers();

    const headers = [
      "Faculty ID", "Full Name", "Phone", "Email",
      "Qualification", "Subjects", "Classes",
      "Salary Type", "Salary (Monthly / Per Hour ₹)", "Joining Date",
    ];

    const rows = teachers.map((t) => [
      t.id,
      t.fullName,
      t.phone,
      t.email,
      t.qualification ?? "",
      t.subjects.join("; "),
      t.classes.join(", "),
      t.salaryType === "daily" ? "Daily (Monthly)" : "Hourly",
      t.salaryType === "daily"
        ? (t.monthlySalary ?? (t.basicDaily ?? 0) * (t.workingDays ?? 0))
        : (t.hourlyRate ?? 0),
      t.joiningDate,
    ]);

    // UTF-8 BOM makes Excel auto-detect encoding correctly
    const csv =
      "\uFEFF" +
      [headers, ...rows]
        .map((row) =>
          row
            .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
            .join(","),
        )
        .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `faculty-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${teachers.length} faculty records`, {
      description: "Saved as .csv — open directly in Excel or Sheets",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Faculty</h1>
          <p className="text-sm text-muted-foreground">
            {list.length} {tab} faculty
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onExportSheets}>
          <SheetIcon className="mr-2 h-4 w-4" /> Export to Google Sheets
        </Button>
      </div>

      <div className="mb-6 inline-flex items-center rounded-full border border-border bg-card p-1 shadow-sm">
        {(["daily", "hourly"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium capitalize transition",
              tab === t
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t === "daily" ? (
              <Calendar className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            {t} Based
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          No {tab} faculty yet.
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((t) => (
            <FacultyCard
              key={t.id}
              teacher={t}
              onClick={() => setSelectedTeacher(t)}
            />
          ))}
        </div>
      )}

      {selectedTeacher && (
        <FacultyModal
          teacher={selectedTeacher}
          onClose={() => setSelectedTeacher(null)}
          onChange={() => {
            refresh();
            setSelectedTeacher(null);
          }}
        />
      )}
    </div>
  );
}

/* ─── Faculty Card (click to open modal) ─────────────────────────────────── */
function FacultyCard({
  teacher,
  onClick,
}: {
  teacher: Teacher;
  onClick: () => void;
}) {
  const summary = useMemo(() => attendanceSummary(teacher.id), [teacher.id]);
  const isDaily = teacher.salaryType === "daily";
  const expectedHours = teacher.expectedHours ?? 0;
  const weekHours = Math.round(expectedHours / 4);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
    >
      {/* Header */}
      <div className="border-b border-border bg-gradient-to-br from-accent/40 to-card p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {teacher.fullName
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{teacher.fullName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {teacher.id}
            </p>
          </div>
          <span className="text-xs font-medium text-primary opacity-0 transition group-hover:opacity-100">
            View →
          </span>
        </div>
      </div>

      {/* Mini stats */}
      {isDaily ? (
        <div className="grid grid-cols-3 gap-2 p-4 text-center">
          <Stat color="success" label="Present" value={summary.present} />
          <Stat color="destructive" label="Absent" value={summary.absent} />
          <Stat color="warning" label="Late" value={summary.late} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 p-4 text-center">
          <Stat color="primary" label="Hrs / Week" value={weekHours} />
          <Stat color="primary" label="Hrs / Month" value={expectedHours} />
        </div>
      )}
    </button>
  );
}

/* ─── Glass Modal ────────────────────────────────────────────────────────── */
function FacultyModal({
  teacher,
  onClose,
  onChange,
}: {
  teacher: Teacher;
  onClose: () => void;
  onChange: () => void;
}) {
  const navigate = useNavigate();
  const summary = useMemo(() => attendanceSummary(teacher.id), [teacher.id]);
  const [deductions, setDeductions] = useState<number>(0);
  const [bonus, setBonus] = useState<number>(0);
  const [showDetail, setShowDetail] = useState(false);

  const isDaily = teacher.salaryType === "daily";
  const basic = isDaily
    ? (teacher.monthlySalary ?? ((teacher.basicDaily ?? 0) * (teacher.workingDays ?? 0) + (teacher.hra ?? 0))) +
      bonus
    : (teacher.hourlyRate ?? 0) * (teacher.expectedHours ?? 0);
  const finalSalary = basic - deductions;

  const expectedHours = teacher.expectedHours ?? 0;
  const weekHours = Math.round(expectedHours / 4);

  const onDelete = () => {
    if (!confirm(`Delete ${teacher.fullName}?`)) return;
    deleteTeacher(teacher.id);
    toast.success("Faculty deleted");
    onChange();
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
      onClick={onClose}
    >
      {/* Glass panel */}
      <div
        className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-3xl"
        style={{
          background: "rgba(10, 10, 20, 0.82)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "0 32px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal header ── */}
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
          style={{
            background: "rgba(10,10,20,0.92)",
            backdropFilter: "blur(28px)",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground ring-2 ring-primary/25">
              {teacher.fullName
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {teacher.fullName}
              </h2>
              <p className="text-[11px] text-white/40">
                {teacher.id} · {teacher.designation}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              onClick={() =>
                navigate({
                  to: "/admissions/edit-teacher/$id",
                  params: { id: teacher.id },
                })
              }
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Update
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              onClick={onDelete}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
            </Button>
            <button
              onClick={onClose}
              className="ml-1 flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Modal body ── */}
        <div className="p-6">
          {isDaily ? (
            /* Daily: 3 columns */
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Col 1 – Attendance */}
              <GlassPanel title="Attendance">
                <div className="space-y-3">
                  <AttendancePill
                    color="success"
                    label="Present"
                    value={summary.present}
                  />
                  <AttendancePill
                    color="destructive"
                    label="Absent"
                    value={summary.absent}
                  />
                  <AttendancePill
                    color="warning"
                    label="Late"
                    value={summary.late}
                  />
                </div>

                {/* Detailed Info – unchanged behaviour */}
                <button
                  onClick={() => setShowDetail((v) => !v)}
                  className="mt-4 inline-flex items-center text-xs font-medium text-primary hover:underline"
                >
                  {showDetail ? "Hide details" : "Detailed Info"}
                  {showDetail ? (
                    <ChevronUp className="ml-1 h-3 w-3" />
                  ) : (
                    <ChevronDown className="ml-1 h-3 w-3" />
                  )}
                </button>
                {showDetail && <DetailTable facultyId={teacher.id} />}
              </GlassPanel>

              {/* Col 2 – Salary split */}
              <GlassPanel title="Salary Breakup">
                <div className="space-y-3 text-sm">
                  <SalaryItem
                    label="Monthly Salary"
                    value={`₹${(teacher.monthlySalary ?? ((teacher.basicDaily ?? 0) * (teacher.workingDays ?? 0))).toLocaleString("en-IN")}`}
                  />
                  <div className="flex items-center justify-between border-b border-white/6 pb-2">
                    <span className="text-white/45">Bonus</span>
                    <Input
                      type="number"
                      value={bonus}
                      onChange={(e) => setBonus(Number(e.target.value) || 0)}
                      className="h-8 w-24 border-white/10 bg-white/5 text-right text-white"
                    />
                  </div>
                  <SalaryItem
                    label="Gross Total"
                    value={`₹${basic.toLocaleString("en-IN")}`}
                    bold
                  />

                  <div className="flex items-center justify-between border-t border-white/8 pt-3">
                    <span className="text-white/45">Deductions (PF)</span>
                    <Input
                      type="number"
                      value={deductions}
                      onChange={(e) =>
                        setDeductions(Number(e.target.value) || 0)
                      }
                      className="h-8 w-24 border-white/10 bg-white/5 text-right text-white"
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5">
                    <span className="text-xs font-semibold text-primary">
                      Net Salary
                    </span>
                    <span className="text-lg font-bold text-primary">
                      ₹{finalSalary.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </GlassPanel>

              {/* Col 3 – Attendance calendar */}
              <GlassPanel title="Attendance Calendar">
                <AttendanceCalendar facultyId={teacher.id} />
              </GlassPanel>
            </div>
          ) : (
            /* Hourly: 2 columns */
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Col 1 – Hours */}
              <GlassPanel title="Hours Overview">
                <div className="space-y-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
                    <p className="text-4xl font-bold text-white">{weekHours}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-widest text-white/40">
                      Hours / Week
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-5 text-center">
                    <p className="text-4xl font-bold text-white">
                      {expectedHours}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-widest text-white/40">
                      Hours / Month
                    </p>
                  </div>
                </div>
              </GlassPanel>

              {/* Col 2 – Salary split */}
              <GlassPanel title="Salary Details">
                <div className="space-y-3 text-sm">
                  <SalaryItem
                    label="Salary per Hour"
                    value={`₹${(teacher.hourlyRate ?? 0).toLocaleString("en-IN")}`}
                  />
                  <SalaryItem
                    label="Total Hours (Month)"
                    value={String(expectedHours)}
                  />
                  <SalaryItem
                    label="Overtime Rate"
                    value={`₹${(teacher.overtimeRate ?? 0).toLocaleString("en-IN")}/hr`}
                  />

                  <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/10 px-3 py-2.5 mt-2">
                    <span className="text-xs font-semibold text-primary">
                      Total Salary
                    </span>
                    <span className="text-lg font-bold text-primary">
                      ₹{basic.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <p className="text-[10px] text-white/25">
                    * Based on classes logged this month
                  </p>
                </div>
              </GlassPanel>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Glass panel wrapper ────────────────────────────────────────────────── */
function GlassPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <p className="mb-3 text-[9px] font-bold uppercase tracking-widest text-white/30">
        {title}
      </p>
      {children}
    </div>
  );
}

/* ─── Attendance pill (col 1 daily) ─────────────────────────────────────── */
function AttendancePill({
  color,
  label,
  value,
}: {
  color: "success" | "destructive" | "warning";
  label: string;
  value: number;
}) {
  const styles = {
    success: {
      bg: "bg-emerald-500/12 border-emerald-500/20",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
    },
    destructive: {
      bg: "bg-red-500/12 border-red-500/20",
      text: "text-red-400",
      dot: "bg-red-400",
    },
    warning: {
      bg: "bg-amber-500/12 border-amber-500/20",
      text: "text-amber-400",
      dot: "bg-amber-400",
    },
  };
  const s = styles[color];
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border px-3 py-2.5",
        s.bg,
      )}
    >
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", s.dot)} />
        <span className={cn("text-sm font-medium", s.text)}>{label}</span>
      </div>
      <span className={cn("text-2xl font-bold", s.text)}>{value}</span>
    </div>
  );
}

/* ─── Salary row ─────────────────────────────────────────────────────────── */
function SalaryItem({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/6 pb-2">
      <span className="text-white/45">{label}</span>
      <span
        className={cn(
          "font-medium text-white",
          bold && "font-semibold text-white/90",
        )}
      >
        {value}
      </span>
    </div>
  );
}

/* ─── Attendance Calendar (replicating reference image) ─────────────────── */
function AttendanceCalendar({ facultyId }: { facultyId: string }) {
  const now = new Date();
  const [offset, setOffset] = useState(0);
  const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const arr = getAttendanceFor(
    facultyId,
    targetDate.getFullYear(),
    targetDate.getMonth(),
  );

  // Day-of-week offset so the 1st lands on the correct column
  const firstDow = targetDate.getDay(); // 0=Sun … 6=Sat
  const DAY_HEADERS = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <div>
      {/* Month navigation */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setOffset((o) => o - 1)}
          className="flex h-6 w-6 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs font-semibold text-white/60">
          {targetDate.toLocaleDateString(undefined, {
            month: "long",
            year: "numeric",
          })}
        </span>
        <button
          onClick={() => setOffset((o) => Math.min(0, o + 1))}
          disabled={offset >= 0}
          className="flex h-6 w-6 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white disabled:opacity-25"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="mb-1 grid grid-cols-7">
        {DAY_HEADERS.map((d, i) => (
          <div
            key={i}
            className="py-1 text-center text-[10px] font-bold tracking-wide text-white/25"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {/* Leading empty cells */}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}

        {/* Actual days */}
        {arr.map((status, i) => (
          <CalendarDay key={i} day={i + 1} status={status} />
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-white/6 pt-3 text-[9px] text-white/30">
        <span className="inline-flex items-center gap-1">
          <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border-[1.5px] border-blue-400 bg-blue-400/15">
            <Check className="h-2 w-2 text-blue-400" strokeWidth={3.5} />
          </span>
          Present
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
          Absent
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border-[1.5px] border-yellow-400 bg-yellow-400/15">
            <Check className="h-2 w-2 text-yellow-400" strokeWidth={3.5} />
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
function CalendarDay({ day, status }: { day: number; status: DayStatus }) {
  if (status === "none") {
    // Sunday / future – dim number only
    return (
      <div className="flex flex-col items-center py-0.5">
        <span className="text-[10px] text-white/15">{day}</span>
      </div>
    );
  }

  if (status === "present") {
    // Blue circle with checkmark (matching reference image)
    return (
      <div className="flex flex-col items-center py-0.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-400 bg-blue-400/15">
          <Check className="h-3 w-3 text-blue-400" strokeWidth={3.5} />
        </div>
      </div>
    );
  }

  if (status === "absent") {
    // Day number + red dot below
    return (
      <div className="flex flex-col items-center py-0.5">
        <span className="text-[10px] text-white/45">{day}</span>
        <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-red-400" />
      </div>
    );
  }

  if (status === "late") {
    // Yellow circle with checkmark — same shape as present but amber/yellow
    return (
      <div className="flex flex-col items-center py-0.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-yellow-400 bg-yellow-400/15">
          <Check className="h-3 w-3 text-yellow-400" strokeWidth={3.5} />
        </div>
      </div>
    );
  }

  if (status === "holiday") {
    // Violet-tinted number cell
    return (
      <div className="flex flex-col items-center py-0.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/25">
          <span className="text-[10px] font-semibold text-violet-300">
            {day}
          </span>
        </div>
      </div>
    );
  }

  return null;
}

/* ─── Shared Stat chip (used on cards) ──────────────────────────────────── */
function Stat({
  color,
  label,
  value,
}: {
  color: "success" | "destructive" | "warning" | "primary";
  label: string;
  value: number;
}) {
  const tones: Record<string, string> = {
    success: "bg-[oklch(0.95_0.05_150)] text-[oklch(0.4_0.15_150)]",
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-[oklch(0.95_0.05_80)] text-[oklch(0.45_0.15_80)]",
    primary: "bg-primary/10 text-primary",
  };
  return (
    <div className={cn("rounded-lg px-2 py-2", tones[color])}>
      <p className="text-base font-semibold">{value}</p>
      <p className="text-[10px] uppercase tracking-wide">{label}</p>
    </div>
  );
}

/* ─── Detailed attendance table (unchanged – Detailed Info button) ───────── */
function DetailTable({ facultyId }: { facultyId: string }) {
  const now = new Date();
  const arr = getAttendanceFor(facultyId, now.getFullYear(), now.getMonth());
  return (
    <div className="mt-3 max-h-48 overflow-y-auto rounded-xl border border-white/8">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-white/5 text-[10px] uppercase tracking-wider text-white/35">
          <tr>
            <th className="px-2 py-1.5 text-left">Date</th>
            <th className="px-2 py-1.5 text-left">Check-in</th>
            <th className="px-2 py-1.5 text-left">Check-out</th>
          </tr>
        </thead>
        <tbody>
          {arr.map((s, i) => {
            const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
            const label = d.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            });
            return (
              <tr key={i} className="border-t border-white/5">
                <td className="px-2 py-1.5 text-white/55">{label}</td>
                <td className="px-2 py-1.5 text-white/55">
                  {s === "present" || s === "late"
                    ? "09:" + (s === "late" ? "32" : "02")
                    : "—"}
                </td>
                <td className="px-2 py-1.5 text-white/55">
                  {s === "present" || s === "late" ? "17:05" : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
