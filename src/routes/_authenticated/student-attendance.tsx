import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { canAccess } from "@/config/rolePermissions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  ChevronDown,
  X,
  Users,
  UserCheck,
  UserX,
  Clock,
  Pencil,
  Check,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getStudentAttendance, updateStudentAttendance, StudentAttendanceRecord } from "@/lib/student-attendance-api";

export const Route = createFileRoute("/_authenticated/student-attendance")({
  component: StudentAttendancePage,
});

type AttendanceStatus = "Present" | "Late" | "Absent" | null;


interface Filter {
  cls: number;
  subject: string;
}

const subjectsForClass = (cls: number): string[] => {
  if (cls === 10) return ["Maths", "Science", "Social Science", "English", "Tamil", "Hindi"];
  if (cls === 12) return ["Maths", "Physics", "Chemistry", "Biology", "Accountancy"];
  return [];
};

function StudentAttendancePage() {
  const { user } = useAuth();
  if (!user || !canAccess(user.role, "student-attendance")) {
    return <Navigate to="/dashboard" replace />;
  }

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filter[]>([]);
  const [students, setStudents] = useState<StudentAttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getStudentAttendance(selectedDate);
      setStudents(data);
    } catch (err) {
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = students;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)
      );
    }
    if (filters.length) {
      list = list.filter((s) =>
        filters.some((f) => s.class === f.cls && s.subjects.includes(f.subject))
      );
    }
    return list;
  }, [students, search, filters]);

  const addFilter = (cls: number, subject: string) => {
    if (filters.some((f) => f.cls === cls && f.subject === subject)) return;
    setFilters((arr) => [...arr, { cls, subject }]);
  };

  const removeFilter = (i: number) =>
    setFilters((arr) => arr.filter((_, idx) => idx !== i));

  // Stats
  const total = filtered.length;
  const presentCount = filtered.filter((s) => s.attendance === "Present").length;
  const lateCount = filtered.filter((s) => s.attendance === "Late").length;
  const absentCount = filtered.filter((s) => s.attendance === "Absent").length;

  const markAllPresent = async () => {
    const updates = filtered.map(s => ({
      studentId: s.dbId,
      status: "Present" as const
    }));

    setStudents((prev) =>
      prev.map((s) => {
        if (filtered.some((fs) => fs.id === s.id)) {
          return { ...s, attendance: "Present" };
        }
        return s;
      })
    );

    try {
      await updateStudentAttendance(selectedDate, updates);
      toast.success(`Marked ${updates.length} students as present`);
    } catch (err) {
      toast.error("Failed to sync attendance");
      fetchData(); // rollback
    }
  };

  const clearAttendance = async () => {
    const updates = filtered.map(s => ({
      studentId: s.dbId,
      status: null
    }));

    setStudents((prev) =>
      prev.map((s) => {
        if (filtered.some((fs) => fs.id === s.id)) {
          return { ...s, attendance: null };
        }
        return s;
      })
    );

    try {
      await updateStudentAttendance(selectedDate, updates);
      toast.success(`Cleared attendance for ${updates.length} students`);
    } catch (err) {
      toast.error("Failed to sync attendance");
      fetchData();
    }
  };

  const updateAttendance = async (id: string, dbId: number, status: AttendanceStatus) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, attendance: status } : s))
    );

    try {
      await updateStudentAttendance(selectedDate, [{ studentId: dbId, status }]);
    } catch (err) {
      toast.error("Failed to update attendance");
      fetchData();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Student Attendance</h1>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-[160px] h-9 text-sm"
          />
          <ClassFilterDropdown onSelect={addFilter} />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-500/20 blur-2xl" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
              <Users className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight">{total}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/20 blur-2xl" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Present</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <UserCheck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight">{presentCount}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/20 blur-2xl" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Late</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
              <Clock className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight">{lateCount}</div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border border-border/50 bg-card/40 backdrop-blur-xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-rose-500/20 blur-2xl" />
          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Absent</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
              <UserX className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-3xl font-bold tracking-tight">{absentCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by student name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={clearAttendance}>
              Clear Attendance
            </Button>
            <Button size="sm" onClick={markAllPresent}>
              All Present
            </Button>
          </div>
        </div>

        {filters.length > 0 && (
          <div className="border-b border-border p-3 flex flex-wrap gap-2">
            {filters.map((f, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground"
              >
                Class {f.cls} – {f.subject}
                <button onClick={() => removeFilter(i)} className="hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            <button
              onClick={() => setFilters([])}
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-left">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={2} className="p-8 text-center text-muted-foreground">
                    No students found.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => {
                  return (
                    <tr
                      key={s.id}
                      className="border-t border-border transition hover:bg-accent/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar name={s.fullName} />
                          <div>
                            <p className="font-medium">{s.fullName}</p>
                            <p className="text-xs text-muted-foreground">{s.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateAttendance(s.id, s.dbId, "Present")}
                            className={cn(
                              "flex items-center justify-center h-8 w-8 rounded-full transition-colors border",
                              s.attendance === "Present"
                                ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                                : "bg-transparent text-muted-foreground border-border hover:bg-accent"
                            )}
                            title="Present"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => updateAttendance(s.id, s.dbId, "Late")}
                            className={cn(
                              "flex items-center justify-center h-8 w-8 rounded-full transition-colors border",
                              s.attendance === "Late"
                                ? "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
                                : "bg-transparent text-muted-foreground border-border hover:bg-accent"
                            )}
                            title="Late"
                          >
                            <Clock className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => updateAttendance(s.id, s.dbId, "Absent")}
                            className={cn(
                              "flex items-center justify-center h-8 w-8 rounded-full transition-colors border",
                              s.attendance === "Absent"
                                ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                                : "bg-transparent text-muted-foreground border-border hover:bg-accent"
                            )}
                            title="Absent"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => updateAttendance(s.id, s.dbId, null)}
                            className="ml-2 flex items-center justify-center h-8 w-8 rounded-full bg-transparent text-muted-foreground border border-border transition-colors hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                            title="Clear Attendance"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-border md:hidden">
          {filtered.map((s) => {
            return (
              <div key={s.id} className="flex flex-col gap-3 p-4 hover:bg-accent/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.fullName} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{s.fullName}</p>
                      <p className="text-xs text-muted-foreground">{s.id}</p>
                    </div>
                  </div>
                </div>

                <div className="ml-12">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => updateAttendance(s.id, s.dbId, "Present")}
                      className={cn(
                        "flex items-center justify-center h-8 w-8 rounded-full transition-colors border",
                        s.attendance === "Present"
                          ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800"
                          : "bg-transparent text-muted-foreground border-border hover:bg-accent"
                      )}
                      title="Present"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => updateAttendance(s.id, s.dbId, "Late")}
                      className={cn(
                        "flex items-center justify-center h-8 w-8 rounded-full transition-colors border",
                        s.attendance === "Late"
                          ? "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800"
                          : "bg-transparent text-muted-foreground border-border hover:bg-accent"
                      )}
                      title="Late"
                    >
                      <Clock className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => updateAttendance(s.id, s.dbId, "Absent")}
                      className={cn(
                        "flex items-center justify-center h-8 w-8 rounded-full transition-colors border",
                        s.attendance === "Absent"
                          ? "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800"
                          : "bg-transparent text-muted-foreground border-border hover:bg-accent"
                      )}
                      title="Absent"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => updateAttendance(s.id, s.dbId, null)}
                      className="ml-2 flex items-center justify-center h-8 w-8 rounded-full bg-transparent text-muted-foreground border border-border transition-colors hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                      title="Clear Attendance"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">No students found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary">
      {initials}
    </div>
  );
}

function ClassFilterDropdown({ onSelect }: { onSelect: (cls: number, subject: string) => void }) {
  const groups = [
    { label: "Class 10", classes: [10] },
    { label: "Class 12", classes: [12] },
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          Classes <ChevronDown className="ml-1.5 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {groups.map((g, gi) => (
          <div key={g.label}>
            {gi > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {g.label}
            </DropdownMenuLabel>
            {g.classes.map((c) => (
              <DropdownMenuSub key={c}>
                <DropdownMenuSubTrigger>Class {c}</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-44">
                  {subjectsForClass(c).map((s) => (
                    <DropdownMenuItem key={s} onClick={() => onSelect(c, s)}>
                      {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ))}
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
