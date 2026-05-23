import { createFileRoute } from "@tanstack/react-router";
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
  ChevronDown,
  ChevronUp,
  Sheet as SheetIcon,
  Calendar,
  Clock,
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
  const all = getTeachers();
  const list = all.filter((t) => t.salaryType === tab);

  const onExportSheets = () => {
    toast.success("Export to Google Sheets started", {
      description: "Connecting to Sheets API…",
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
            {t === "daily" ? <Calendar className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
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
            <FacultyCard key={t.id} teacher={t} onChange={refresh} />
          ))}
        </div>
      )}
    </div>
  );
}

function FacultyCard({ teacher, onChange }: { teacher: Teacher; onChange: () => void }) {
  const summary = useMemo(() => attendanceSummary(teacher.id), [teacher.id]);
  const [expanded, setExpanded] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [deductions, setDeductions] = useState<number>(teacher.pf ?? 0);

  const onDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Delete ${teacher.fullName}?`)) return;
    deleteTeacher(teacher.id);
    toast.success("Faculty deleted");
    onChange();
  };

  const isDaily = teacher.salaryType === "daily";
  const basic = isDaily
    ? (teacher.basicDaily ?? 0) * (teacher.workingDays ?? 0) + (teacher.hra ?? 0)
    : (teacher.hourlyRate ?? 0) * (teacher.expectedHours ?? 0);
  const finalSalary = basic - deductions;

  // Hourly stats for collapsed view
  const expectedHours = teacher.expectedHours ?? 0;
  const monthHours = expectedHours;
  const weekHours = Math.round(expectedHours / 4);

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition hover:shadow-md"
      >
        {/* Header */}
        <div className="border-b border-border bg-gradient-to-br from-accent/40 to-card p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {teacher.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{teacher.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{teacher.id}</p>
            </div>
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Collapsed mini stats */}
        {isDaily ? (
          <div className="grid grid-cols-3 gap-2 p-4 text-center">
            <Stat color="success" label="Present" value={summary.present} />
            <Stat color="destructive" label="Absent" value={summary.absent} />
            <Stat color="warning" label="Late" value={summary.late} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 p-4 text-center">
            <Stat color="primary" label="Hrs / Week" value={weekHours} />
            <Stat color="primary" label="Hrs / Month" value={monthHours} />
          </div>
        )}

        {/* Expanded sections */}
        {expanded && (
          <div onClick={(e) => e.stopPropagation()}>
            {isDaily && (
              <Partition label="Attendance Summary">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat color="success" label="Present" value={summary.present} />
                  <Stat color="destructive" label="Absent" value={summary.absent} />
                  <Stat color="warning" label="Late" value={summary.late} />
                </div>
                <button
                  onClick={() => setShowDetail((v) => !v)}
                  className="mt-3 inline-flex items-center text-xs font-medium text-primary hover:underline"
                >
                  {showDetail ? "Hide details" : "Detailed Info"}
                  {showDetail ? (
                    <ChevronUp className="ml-1 h-3 w-3" />
                  ) : (
                    <ChevronDown className="ml-1 h-3 w-3" />
                  )}
                </button>
                {showDetail && <DetailTable facultyId={teacher.id} />}
              </Partition>
            )}

            <Partition label={isDaily ? "Salary Breakup" : "Salary Details"}>
              {isDaily ? (
                <div className="space-y-2 text-sm">
                  <SalaryRow label="Basic Fee" value={`₹${basic.toLocaleString("en-IN")}`} />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Deductions</span>
                    <Input
                      type="number"
                      value={deductions}
                      onChange={(e) => setDeductions(Number(e.target.value) || 0)}
                      className="h-8 w-24 text-right"
                    />
                  </div>
                  <SalaryRow
                    label="Final Salary"
                    value={`₹${finalSalary.toLocaleString("en-IN")}`}
                    strong
                  />
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <SalaryRow label="Total Hours" value={String(expectedHours)} />
                  <SalaryRow label="Salary per Hour" value={`₹${teacher.hourlyRate ?? 0}`} />
                  <SalaryRow
                    label="Total Salary"
                    value={`₹${basic.toLocaleString("en-IN")}`}
                    strong
                  />
                </div>
              )}
              <Button size="sm" className="mt-3 w-full" onClick={() => toast.success("Saved")}>
                Save / Update
              </Button>
            </Partition>

            <Partition label="Attendance Calendar">
              <Heatmap facultyId={teacher.id} />
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                <Legend color="bg-[oklch(0.65_0.18_150)]" label="Present" />
                <Legend color="bg-[oklch(0.6_0.22_25)]" label="Absent" />
                <Legend color="bg-[oklch(0.78_0.18_80)]" label="Late" />
                <Legend color="bg-[oklch(0.55_0.22_260)]" label="Holiday" />
              </div>
            </Partition>
          </div>
        )}
      </button>

      {/* Outside actions */}
      <div className="mt-3 flex items-center justify-end rounded-xl border border-border bg-card px-4 py-2.5 text-xs">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); toast("Update coming soon"); }}>
            <Pencil className="mr-1 h-3.5 w-3.5" /> Update
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
          </Button>
        </div>
      </div>
    </div>
  );
}

function Partition({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border p-4">
      <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  );
}
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
function SalaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn(strong ? "text-base font-semibold text-primary" : "font-medium")}>
        {value}
      </span>
    </div>
  );
}

function DetailTable({ facultyId }: { facultyId: string }) {
  const now = new Date();
  const arr = getAttendanceFor(facultyId, now.getFullYear(), now.getMonth());
  return (
    <div className="mt-3 max-h-48 overflow-y-auto rounded-md border border-border">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted/70 text-[10px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-2 py-1.5 text-left">Date</th>
            <th className="px-2 py-1.5 text-left">Check-in</th>
            <th className="px-2 py-1.5 text-left">Check-out</th>
          </tr>
        </thead>
        <tbody>
          {arr.map((s, i) => {
            const d = new Date(now.getFullYear(), now.getMonth(), i + 1);
            const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
            return (
              <tr key={i} className="border-t border-border">
                <td className="px-2 py-1.5">{label}</td>
                <td className="px-2 py-1.5">{s === "present" || s === "late" ? "09:" + (s === "late" ? "32" : "02") : "—"}</td>
                <td className="px-2 py-1.5">{s === "present" || s === "late" ? "17:05" : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Heatmap({ facultyId }: { facultyId: string }) {
  const now = new Date();
  const [offset, setOffset] = useState(0);
  const month = now.getMonth() + offset;
  const year = now.getFullYear();
  const date = new Date(year, month, 1);
  const arr = getAttendanceFor(facultyId, date.getFullYear(), date.getMonth());
  const colors: Record<DayStatus, string> = {
    present: "bg-[oklch(0.65_0.18_150)] text-white",
    absent: "bg-[oklch(0.6_0.22_25)]",
    late: "bg-[oklch(0.78_0.18_80)]",
    holiday: "bg-[oklch(0.55_0.22_260)]",
    none: "bg-muted",
  };
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <button
          onClick={() => setOffset((o) => o - 1)}
          className="text-muted-foreground hover:text-foreground"
        >
          ← Prev
        </button>
        <span className="font-medium">
          {date.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </span>
        <button
          onClick={() => setOffset((o) => Math.min(0, o + 1))}
          disabled={offset >= 0}
          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
        >
          Next →
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {arr.map((s, i) => (
          <div
            key={i}
            className={cn(
              "flex aspect-square items-center justify-center rounded-sm",
              colors[s],
            )}
            title={`Day ${i + 1}: ${s}`}
          >
            {s === "present" && <Check className="h-3 w-3" strokeWidth={3} />}
            {s === "absent" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
            {s === "late" && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-2 w-2 rounded-sm", color)} />
      {label}
    </span>
  );
}
