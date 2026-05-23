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
import { ArrowLeft, ArrowRight, Check, UserPlus } from "lucide-react";
import { addStudent, getStudents } from "@/lib/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admissions/add-student")({
  component: AddStudent,
});

const BOARDS = ["CBSE", "State Board", "ICSE", "Other"];

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

function AddStudent() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  // Section 1
  const [fullName, setFullName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [address, setAddress] = useState("");
  // Section 2
  const [cls, setCls] = useState<number | "">("");
  const [board, setBoard] = useState("");
  const [stream, setStream] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [previousSchool, setPreviousSchool] = useState("");
  const [academicYear, setAcademicYear] = useState(
    `${new Date().getFullYear()}-${String((new Date().getFullYear() + 1) % 100).padStart(2, "0")}`,
  );
  const [notes, setNotes] = useState("");

  const nextId = useMemo(() => `STU-${1000 + getStudents().length + 1}`, []);
  const today = new Date().toISOString().slice(0, 10);

  const toggleSubject = (s: string) => {
    setSubjects((arr) => (arr.includes(s) ? arr.filter((x) => x !== s) : [...arr, s]));
  };

  const goNext = () => {
    if (!fullName || !primaryPhone) {
      toast.error("Name and primary phone are required");
      return;
    }
    setStep(2);
  };

  const submit = () => {
    if (!cls || !board || subjects.length === 0) {
      toast.error("Class, board and subjects are required");
      return;
    }
    addStudent({
      fullName,
      dob,
      gender,
      primaryPhone,
      secondaryPhone,
      parentName,
      parentPhone,
      address,
      class: Number(cls),
      board,
      stream,
      subjects,
      previousSchool,
      academicYear,
      admissionDate: today,
      notes,
    });
    toast.success(`Student ${fullName} admitted`);
    navigate({ to: "/students" });
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add Student</h1>
          <p className="text-sm text-muted-foreground">Multi-step admission form.</p>
        </div>
      </div>

      <Stepper step={step} labels={["Common Details", "Academic Profile"]} />

      <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {step === 1 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Full Name *">
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Field>
            <Field label="Date of Birth">
              <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            </Field>
            <Field label="Gender">
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Primary Phone *">
              <Input value={primaryPhone} onChange={(e) => setPrimaryPhone(e.target.value)} placeholder="+91 ..." />
            </Field>
            <Field label="Secondary Phone">
              <Input value={secondaryPhone} onChange={(e) => setSecondaryPhone(e.target.value)} />
            </Field>
            <Field label="Parent / Guardian Name">
              <Input value={parentName} onChange={(e) => setParentName(e.target.value)} />
            </Field>
            <Field label="Parent Phone Number">
              <Input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} />
            </Field>
            <Field label="Profile Photo (optional)">
              <Input type="file" accept="image/*" />
            </Field>
            <Field label="Address" full>
              <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} />
            </Field>
            <div className="sm:col-span-2 flex justify-end">
              <Button onClick={goNext}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Class (1-12) *">
              <Select value={cls === "" ? "" : String(cls)} onValueChange={(v) => { setCls(Number(v)); setSubjects([]); setStream(""); }}>
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                    <SelectItem key={n} value={String(n)}>Class {n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Board *">
              <Select value={board} onValueChange={setBoard}>
                <SelectTrigger><SelectValue placeholder="Select board" /></SelectTrigger>
                <SelectContent>
                  {BOARDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            {cls !== "" && streamsForClass(Number(cls)).length > 0 && (
              <Field label="Stream">
                <Select value={stream} onValueChange={setStream}>
                  <SelectTrigger><SelectValue placeholder="Select stream" /></SelectTrigger>
                  <SelectContent>
                    {streamsForClass(Number(cls)).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            )}
            <Field label="Previous School">
              <Input value={previousSchool} onChange={(e) => setPreviousSchool(e.target.value)} />
            </Field>
            <Field label="Academic Year">
              <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
            </Field>
            <Field label="Student ID">
              <Input value={nextId} disabled />
            </Field>
            <Field label="Admission Date">
              <Input type="date" value={today} disabled />
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
                          "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition",
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
            <Field label="Notes / Remarks" full>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </Field>
            <div className="sm:col-span-2 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={submit}>
                <Check className="mr-2 h-4 w-4" /> Submit Admission
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={cn("space-y-1.5", full && "sm:col-span-2")}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function Stepper({ step, labels }: { step: number; labels: string[] }) {
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
                "flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : done
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border bg-muted text-muted-foreground",
              )}
            >
              {done ? <Check className="h-4 w-4" /> : idx}
            </div>
            <span
              className={cn(
                "text-sm font-medium",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {l}
            </span>
            {idx < labels.length && (
              <span className={cn("h-px flex-1", done ? "bg-primary" : "bg-border")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
