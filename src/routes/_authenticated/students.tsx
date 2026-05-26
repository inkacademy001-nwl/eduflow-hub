import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useEffect } from "react";
import {
  studentApi,
  type Student,
} from "@/lib/student-api";
import { useAuth } from "@/lib/auth";
import { canAccess } from "@/config/rolePermissions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  Pencil,
  Trash2,
  Search,
  ChevronDown,
  Download,
  Lock,
  X,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/students")({
  component: StudentsPage,
});

interface Filter {
  cls: number;
  subject: string;
}

const subjectsForClass = (cls: number): string[] => {
  if (cls >= 1 && cls <= 8) return ["All Subjects", "Maths Only"];
  if (cls === 9 || cls === 10)
    return ["English", "Maths", "Science", "Social", "Tamil", "Hindi"];
  return ["Physics", "Chemistry", "Maths", "Biology", "Accounts", "Commerce"];
};

function StudentsPage() {
  const { user } = useAuth();
  if (!user || !canAccess(user.role, "students")) {
    return <Navigate to={user?.role === "Faculty" ? "/" : "/dashboard"} replace />;
  }

  const navigate = useNavigate();
  const [, force] = useState({});
  const refresh = () => force({});
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Filter[]>([]);
  const [selected, setSelected] = useState<Student | null>(null);
  const [exporting, setExporting] = useState(false);

  const [all, setAll] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await studentApi.fetchStudents(search, 1, 100);
      setAll(res.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadStudents(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const filtered = useMemo(() => {
    let list = all;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (s) =>
          s.fullName.toLowerCase().includes(q) || s.id.toLowerCase().includes(q),
      );
    }
    if (filters.length) {
      list = list.filter((s) =>
        filters.some(
          (f) =>
            s.class === f.cls &&
            (f.subject === "All Subjects" || s.subjects.includes(f.subject)),
        ),
      );
    }
    return list;
  }, [all, search, filters]);

  const addFilter = (cls: number, subject: string) => {
    if (filters.some((f) => f.cls === cls && f.subject === subject)) return;
    setFilters((arr) => [...arr, { cls, subject }]);
  };
  const removeFilter = (i: number) =>
    setFilters((arr) => arr.filter((_, idx) => idx !== i));

  const onDelete = async (s: Student) => {
    if (!confirm(`Delete ${s.fullName}?`)) return;
    try {
      await studentApi.deleteStudentApi(s.id);
      toast.success("Student deleted");
      loadStudents();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete student");
    }
  };

  const onExport = async () => {
    setExporting(true);
    try {
      const url = `${import.meta.env.VITE_API_BASE_URL || ""}/api/students/download-csv`;
      const token = localStorage.getItem("erp_auth_token");
      
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          throw new Error("You do not have permission to export students.");
        }
        throw new Error("Failed to export students.");
      }
      
      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      // You can extract the filename from the Content-Disposition header if needed,
      // but defaulting to students.csv is fine.
      a.download = "students.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);
      
      toast.success("Export ready");
    } catch (err: any) {
      toast.error(err.message || "Failed to export");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground">
            {all.length} total • Showing {filtered.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ClassFilterDropdown onSelect={addFilter} />
          <Button variant="outline" size="sm" onClick={onExport} disabled={exporting}>
            {exporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export Excel
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name or student ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {filters.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
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
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-left">Class</th>
                <th className="px-4 py-3 text-left">Board</th>
                <th className="px-4 py-3 text-left">Primary Phone</th>
                <th className="px-4 py-3 text-left">Fee Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No students found.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                <tr
                  key={s.id}
                  onClick={() => setSelected(s)}
                  className="cursor-pointer border-t border-border transition hover:bg-accent/30"
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
                    Class {s.class}
                    {s.stream ? ` – ${s.stream}` : ""}
                  </td>
                  <td className="px-4 py-3">{s.board}</td>
                  <td className="px-4 py-3">{s.primaryPhone}</td>
                  <td className="px-4 py-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Lock className="h-3.5 w-3.5" />
                          Locked
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>Coming Soon</TooltipContent>
                    </Tooltip>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          navigate({ to: "/admissions/edit-student/$id", params: { id: s.id } })
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete(s)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    No students found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-border md:hidden">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelected(s)}
              className="flex w-full items-center gap-3 p-4 text-left hover:bg-accent/30"
            >
              <Avatar name={s.fullName} />
              <div className="flex-1 min-w-0">
                <p className="font-medium">{s.fullName}</p>
                <p className="text-xs text-muted-foreground">
                  Class {s.class} • {s.board} • {s.id}
                </p>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">No students found.</p>
          )}
        </div>
      </div>

      <StudentModal student={selected} onClose={() => setSelected(null)} />
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
  const groups: { label: string; classes: number[] }[] = [
    { label: "Classes 1–8", classes: [1, 2, 3, 4, 5, 6, 7, 8] },
    { label: "Classes 9 & 10", classes: [9, 10] },
    { label: "Classes 11 & 12", classes: [11, 12] },
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

function StudentModal({ student, onClose }: { student: Student | null; onClose: () => void }) {
  const [details, setDetails] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student) {
      setLoading(true);
      studentApi.fetchStudentById(student.id)
        .then(setDetails)
        .catch((err) => toast.error(err.message || "Failed to load details"))
        .finally(() => setLoading(false));
    } else {
      setDetails(null);
    }
  }, [student]);

  return (
    <Dialog open={!!student} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : details && (
          <>
            <DialogHeader>
              <DialogTitle>{details.fullName}</DialogTitle>
              <p className="text-xs text-muted-foreground">{details.id}</p>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              {/* Class & Board */}
              <Row label="Class">
                Class {details.class}
                {details.stream ? ` – ${details.stream}` : ""} • {details.board}
              </Row>

              {/* Gender */}
              <Row label="Gender">{details.gender || "—"}</Row>

              {/* Date of Birth */}
              <Row label="Date of Birth">{details.dob || "—"}</Row>

              {/* Primary Phone */}
              <Row label="Primary Phone">{details.primaryPhone}</Row>

              {/* Secondary Phone */}
              {details.secondaryPhone && (
                <Row label="Secondary Phone">{details.secondaryPhone}</Row>
              )}

              {/* Father's Name */}
              <Row label="Father's Name">{details.fatherName || "—"}</Row>

              {/* Mother's Name */}
              <Row label="Mother's Name">{details.motherName || "—"}</Row>

              {/* Parent Phone */}
              <Row label="Parent Phone">{details.parentPhone || "—"}</Row>

              {/* Additional Contacts */}
              {details.extraContacts && details.extraContacts.length > 0 && (
                <Row label="Other Contacts">
                  <div className="space-y-1">
                    {details.extraContacts.map((c, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                          {c.relation}
                        </span>
                        <span>{c.number}</span>
                      </div>
                    ))}
                  </div>
                </Row>
              )}

              {/* Address */}
              <Row label="Address">{details.address || "—"}</Row>

              {/* Previous School */}
              <Row label="School Name">{details.previousSchool || "—"}</Row>

              {/* Subjects */}
              <Row label="Subjects">
                <div className="flex flex-wrap gap-1.5">
                  {details.subjects.map((s) => (
                    <span key={s} className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                      {s}
                    </span>
                  ))}
                </div>
              </Row>

              {/* Extra Curricular Activities */}
              <Row label="Extra Activities">
                {details.extraActivities && details.extraActivities.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {details.extraActivities.map((a) => (
                      <span key={a} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  "—"
                )}
              </Row>

              {/* Admission Date & Academic Year */}
              <Row label="Admission Date">{details.admissionDate}</Row>

              {/* Fees */}
              <Row label="Fees">
                {details.fees != null ? (
                  <span className="font-semibold text-foreground">₹{details.fees.toLocaleString("en-IN")}</span>
                ) : (
                  <span className="text-muted-foreground">Not set</span>
                )}
              </Row>

              {/* Notes */}
              {details.notes && (
                <Row label="Notes">
                  <p className="whitespace-pre-wrap text-muted-foreground">{details.notes}</p>
                </Row>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="col-span-2">{children}</div>
    </div>
  );
}
