import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Calendar, Check, Phone, Plus, Trash2, UserPlus } from "lucide-react";
import { addStudent, getStudents, updateStudent } from "@/lib/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admissions/add-student")(
  {
    component: () => <StudentForm />,
  },
);

/* ── helpers ─────────────────────────────────────────────────────────────── */
const BOARDS = ["CBSE", "State Board", "ICSE", "Other"];

const EXTRA_CURRICULAR = [
  "Chess",
];

function subjectsForClass(cls: number): string[] {
  if (cls >= 1 && cls <= 8) return ["All Subjects", "Maths Only"];
  if (cls === 9 || cls === 10)
    return ["English", "Maths", "Science", "Social", "Tamil", "Hindi"];
  return ["Physics", "Chemistry", "Maths", "Biology", "Accounts", "Commerce"];
}

function streamsForClass(cls: number): string[] {
  if (cls >= 11) return ["PCM", "PCB", "Commerce", "Arts"];
  return [];
}

/** Returns today as YYYY-MM-DD in local time (avoids UTC offset shifting date) */
function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ── animation keyframes + date-picker styles injected once ─────────────── */
const ANIM_STYLES = `
  @keyframes _slideInRight {
    from { opacity: 0; transform: translateX(56px); }
    to   { opacity: 1; transform: translateX(0);    }
  }
  @keyframes _slideInLeft {
    from { opacity: 0; transform: translateX(-56px); }
    to   { opacity: 1; transform: translateX(0);     }
  }
  ._anim-right { animation: _slideInRight 0.35s cubic-bezier(0.22,1,0.36,1) both; }
  ._anim-left  { animation: _slideInLeft  0.35s cubic-bezier(0.22,1,0.36,1) both; }

  /* ── Styled native date input ── */
  ._date-input {
    color-scheme: dark;
    appearance: none;
    -webkit-appearance: none;
    width: 100%;
    height: 2.5rem;
    padding: 0 0.75rem 0 2.5rem;
    border-radius: 0.5rem;
    border: 1px solid hsl(var(--border));
    background: hsl(var(--background));
    color: hsl(var(--foreground));
    font-size: 0.875rem;
    cursor: pointer;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  ._date-input:hover {
    border-color: hsl(var(--primary) / 0.6);
  }
  ._date-input:focus {
    border-color: hsl(var(--primary));
    box-shadow: 0 0 0 3px hsl(var(--primary) / 0.15);
  }
  ._date-input::-webkit-calendar-picker-indicator {
    opacity: 0;
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    cursor: pointer;
  }
  ._date-input::-webkit-datetime-edit-fields-wrapper { padding: 0; }
  ._date-input::-webkit-datetime-edit { font-size: 0.875rem; }
`;

/* ── form component ──────────────────────────────────────────────────────── */
export function StudentForm({ editId }: { editId?: string }) {
  const existing = editId
    ? getStudents().find((s) => s.id === editId)
    : undefined;
  const isEdit = !!existing;
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [animKey, setAnimKey] = useState(0);
  const [animClass, setAnimClass] = useState("_anim-right");

  /* ── step-1 state ── */
  const [fullName, setFullName] = useState(existing?.fullName ?? "");
  const [dob, setDob] = useState(existing?.dob ?? "");
  const [gender, setGender] = useState(existing?.gender ?? "");
  const [primaryPhone, setPrimaryPhone] = useState(
    existing?.primaryPhone ?? "",
  );
  const [extraContacts, setExtraContacts] = useState<
    { number: string; relation: string }[]
  >(existing?.extraContacts ?? []);
  const [parentName, setParentName] = useState(existing?.parentName ?? "");
  const [parentPhone, setParentPhone] = useState(existing?.parentPhone ?? "");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [extraActivities, setExtraActivities] = useState<string[]>(
    existing?.extraActivities ?? [],
  );

  /* ── step-2 state ── */
  const [cls, setCls] = useState<number | "">(existing?.class ?? "");
  const [board, setBoard] = useState(existing?.board ?? "");
  const [stream, setStream] = useState(existing?.stream ?? "");
  const [subjects, setSubjects] = useState<string[]>(
    existing?.subjects ?? [],
  );
  const [previousSchool, setPreviousSchool] = useState(
    existing?.previousSchool ?? "",
  );
  const [academicYear, setAcademicYear] = useState(
    existing?.academicYear ??
    `${new Date().getFullYear()}-${String((new Date().getFullYear() + 1) % 100).padStart(2, "0")}`,
  );
  const [admissionDate, setAdmissionDate] = useState(
    existing?.admissionDate ?? localToday(),
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");

  const nextId = useMemo(
    () => existing?.id ?? `STU-${1000 + getStudents().length + 1}`,
    [existing],
  );

  /* ── helpers ── */
  const toggleActivity = (a: string) =>
    setExtraActivities((arr) =>
      arr.includes(a) ? arr.filter((x) => x !== a) : [...arr, a],
    );

  const toggleSubject = (s: string) =>
    setSubjects((arr) =>
      arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s],
    );

  const goNext = () => {
    if (!fullName || !primaryPhone) {
      toast.error("Name and primary phone are required");
      return;
    }
    const incomplete = extraContacts.some((c) => !c.number || !c.relation);
    if (incomplete) {
      toast.error("Each additional contact needs both a number and a relation");
      return;
    }
    setAnimClass("_anim-right");
    setAnimKey((k) => k + 1);
    setStep(2);
  };

  const goBack = () => {
    setAnimClass("_anim-left");
    setAnimKey((k) => k + 1);
    setStep(1);
  };

  const submit = () => {
    if (!cls || !board || subjects.length === 0) {
      toast.error("Class, board and at least one subject are required");
      return;
    }
    if (!admissionDate) {
      toast.error("Admission date is required");
      return;
    }
    const payload = {
      fullName,
      dob,
      gender,
      primaryPhone,
      extraContacts,
      parentName,
      parentPhone,
      address,
      extraActivities,
      class: Number(cls),
      board,
      stream,
      subjects,
      previousSchool,
      academicYear,
      admissionDate,
      notes,
    };
    if (isEdit && existing) {
      updateStudent({ ...payload, id: existing.id });
      toast.success(`Student ${fullName} updated`);
    } else {
      addStudent(payload);
      toast.success(`Student ${fullName} admitted`);
    }
    navigate({ to: "/students" });
  };

  return (
    <>
      {/* Inject animation keyframes */}
      <style>{ANIM_STYLES}</style>

      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {isEdit ? "Edit Student" : "Add Student"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEdit ? `Editing ${existing?.id}` : "Multi-step admission form."}
            </p>
          </div>
        </div>

        <Stepper step={step} labels={["Common Details", "Academic Profile"]} />

        <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* animated wrapper — key changes on every step transition */}
          <div key={animKey} className={cn("grid gap-5 p-6 sm:grid-cols-2 sm:p-8", animClass)}>

            {/* ═══════════════ STEP 1 ═══════════════ */}
            {step === 1 && (
              <>
                <Field label="Full Name *">
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Aarav Sharma"
                  />
                </Field>

                <Field label="Date of Birth">
                  <DateField
                    value={dob}
                    max={localToday()}
                    onChange={setDob}
                  />
                </Field>

                <Field label="Gender">
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Primary Phone *">
                  <Input
                    value={primaryPhone}
                    onChange={(e) => setPrimaryPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </Field>

                {/* Dynamic extra contacts */}
                <div className="sm:col-span-2 space-y-2">
                  {extraContacts.length > 0 && (
                    <div className="space-y-2">
                      {extraContacts.map((contact, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 rounded-xl border border-border bg-background/50 p-2.5 animate-in fade-in slide-in-from-top-2 duration-200"
                        >
                          <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <Input
                            className="h-8 flex-1"
                            placeholder="+91 98765 43210"
                            value={contact.number}
                            onChange={(e) =>
                              setExtraContacts((arr) =>
                                arr.map((c, i) =>
                                  i === idx ? { ...c, number: e.target.value } : c,
                                ),
                              )
                            }
                          />
                          <Select
                            value={contact.relation}
                            onValueChange={(v) =>
                              setExtraContacts((arr) =>
                                arr.map((c, i) =>
                                  i === idx ? { ...c, relation: v } : c,
                                ),
                              )
                            }
                          >
                            <SelectTrigger className="h-8 w-36 shrink-0">
                              <SelectValue placeholder="Relation *" />
                            </SelectTrigger>
                            <SelectContent>
                              {["Father","Mother","Guardian","Sibling","Spouse","Relative","Friend","Other"].map((r) => (
                                <SelectItem key={r} value={r}>{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <button
                            type="button"
                            onClick={() =>
                              setExtraContacts((arr) => arr.filter((_, i) => i !== idx))
                            }
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total contacts = primary + extra; cap at 5 */}
                  {extraContacts.length < 4 && (
                    <button
                      type="button"
                      onClick={() =>
                        setExtraContacts((arr) => [...arr, { number: "", relation: "" }])
                      }
                      className="flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition w-full"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Contact
                      <span className="ml-auto text-[10px] text-muted-foreground/60">
                        {1 + extraContacts.length}/5
                      </span>
                    </button>
                  )}
                </div>

                <Field label="Parent / Guardian Name">
                  <Input
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                  />
                </Field>

                <Field label="Parent Phone Number">
                  <Input
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                  />
                </Field>

                <Field label="Address" full>
                  <Textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    placeholder="House/Flat, Street, City, PIN"
                  />
                </Field>

                <div className="flex justify-end sm:col-span-2">
                  <Button onClick={goNext} size="lg" className="min-w-32">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {/* ═══════════════ STEP 2 ═══════════════ */}
            {step === 2 && (
              <>
                <Field label="Class (1–12) *">
                  <Select
                    value={cls === "" ? "" : String(cls)}
                    onValueChange={(v) => {
                      setCls(Number(v));
                      setSubjects([]);
                      setStream("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(
                        (n) => (
                          <SelectItem key={n} value={String(n)}>
                            Class {n}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Board *">
                  <Select value={board} onValueChange={setBoard}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select board" />
                    </SelectTrigger>
                    <SelectContent>
                      {BOARDS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {b}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {cls !== "" && streamsForClass(Number(cls)).length > 0 && (
                  <Field label="Stream">
                    <Select value={stream} onValueChange={setStream}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select stream" />
                      </SelectTrigger>
                      <SelectContent>
                        {streamsForClass(Number(cls)).map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}

                <Field label="Previous School">
                  <Input
                    value={previousSchool}
                    onChange={(e) => setPreviousSchool(e.target.value)}
                  />
                </Field>

                <Field label="Academic Year">
                  <Input
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    placeholder="e.g. 2024-25"
                  />
                </Field>

                <Field label="Admission Date *">
                  <DateField
                    value={admissionDate}
                    max={localToday()}
                    onChange={setAdmissionDate}
                  />
                </Field>

                {cls !== "" && (
                  <Field label="Subjects Enrolled (Tuition) *" full>
                    <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-background p-3">
                      {subjectsForClass(Number(cls)).map((s) => {
                        const active = subjects.includes(s);
                        return (
                          <label
                            key={s}
                            className={cn(
                              "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition select-none",
                              active
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border hover:bg-accent",
                            )}
                          >
                            <Checkbox
                              checked={active}
                              onCheckedChange={() => toggleSubject(s)}
                            />
                            {s}
                          </label>
                        );
                      })}
                    </div>
                  </Field>
                )}

                {/* Extra Curricular Activities – Academic Profile */}
                <Field label="Extra Curricular Activities" full>
                  <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-background p-3">
                    {EXTRA_CURRICULAR.map((a) => {
                      const active = extraActivities.includes(a);
                      return (
                        <label
                          key={a}
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition select-none",
                            active
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:bg-accent",
                          )}
                        >
                          <Checkbox
                            checked={active}
                            onCheckedChange={() => toggleActivity(a)}
                          />
                          {a}
                        </label>
                      );
                    })}
                  </div>
                </Field>

                <Field label="Notes / Remarks" full>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                </Field>

                <div className="flex justify-between sm:col-span-2">
                  <Button variant="outline" onClick={goBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={submit} size="lg" className="min-w-40">
                    <Check className="mr-2 h-4 w-4" />
                    {isEdit ? "Update Student" : "Submit Admission"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Field wrapper ───────────────────────────────────────────────────────── */
function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", full && "sm:col-span-2")}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

/* ── Styled date picker ──────────────────────────────────────────────────── */
function DateField({
  value,
  onChange,
  max,
  min,
}: {
  value: string;
  onChange: (v: string) => void;
  max?: string;
  min?: string;
}) {
  return (
    <div className="relative">
      {/* Calendar icon – decorative, click goes to input */}
      <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="date"
        className="_date-input"
        value={value}
        max={max}
        min={min}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/* ── Stepper (exported so edit page can reuse) ───────────────────────────── */
export function Stepper({
  step,
  labels,
}: {
  step: number;
  labels: string[];
}) {
  return (
    <ol className="flex items-center gap-3">
      {labels.map((l, i) => {
        const idx = i + 1;
        const active = step === idx;
        const done = step > idx;
        return (
          <li key={l} className="flex flex-1 items-center gap-3">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300",
                active
                  ? "border-primary bg-primary text-primary-foreground scale-110"
                  : done
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="h-4 w-4" /> : idx}
            </div>
            <span
              className={cn(
                "text-sm font-medium transition-colors duration-300",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {l}
            </span>
            {idx < labels.length && (
              <span
                className={cn(
                  "h-px flex-1 transition-all duration-500",
                  done ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
