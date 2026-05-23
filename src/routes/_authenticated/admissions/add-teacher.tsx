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
import { ArrowLeft, ArrowRight, Check, UserPlus, Clock, Calendar as CalendarIcon } from "lucide-react";
import { addTeacher, getTeachers, updateTeacher } from "@/lib/mock-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Stepper } from "./add-student";

export const Route = createFileRoute("/_authenticated/admissions/add-teacher")({
  component: () => <TeacherForm />,
});

const DESIGNATIONS = ["Teacher", "Senior Teacher", "HOD", "Coordinator"];
const ALL_SUBJECTS = [
  "Maths", "Physics", "Chemistry", "Biology", "English", "Hindi", "Tamil",
  "Social", "Science", "Accounts", "Commerce", "Computer Science",
];

export function TeacherForm({ editId }: { editId?: string }) {
  const existing = editId ? getTeachers().find((t) => t.id === editId) : undefined;
  const isEdit = !!existing;
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Section 1 — General
  const [fullName, setFullName] = useState(existing?.fullName ?? "");
  const [dob, setDob] = useState(existing?.dob ?? "");
  const [gender, setGender] = useState(existing?.gender ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [emergencyName, setEmergencyName] = useState(existing?.emergencyName ?? "");
  const [emergencyPhone, setEmergencyPhone] = useState(existing?.emergencyPhone ?? "");

  // Section 1 — Education
  const [qualification, setQualification] = useState(existing?.qualification ?? "");
  const [university, setUniversity] = useState(existing?.university ?? "");
  const [designation, setDesignation] = useState(existing?.designation ?? "Teacher");
  const [subjects, setSubjects] = useState<string[]>(existing?.subjects ?? []);
  const [classes, setClasses] = useState<number[]>(existing?.classes ?? []);
  const [joiningDate, setJoiningDate] = useState(
    existing?.joiningDate ?? new Date().toISOString().slice(0, 10),
  );
  const [experience, setExperience] = useState<number | "">(existing?.experience ?? "");

  // Section 2 — Salary
  const [salaryType, setSalaryType] = useState<"daily" | "hourly">(existing?.salaryType ?? "daily");
  const [basicDaily, setBasicDaily] = useState<number | "">(existing?.basicDaily ?? "");
  const [workingDays, setWorkingDays] = useState<number | "">(existing?.workingDays ?? 26);
  const [hra, setHra] = useState<number | "">(existing?.hra ?? "");
  const [pf, setPf] = useState<number | "">(existing?.pf ?? "");
  const [hourlyRate, setHourlyRate] = useState<number | "">(existing?.hourlyRate ?? "");
  const [expectedHours, setExpectedHours] = useState<number | "">(existing?.expectedHours ?? "");
  const [overtimeRate, setOvertimeRate] = useState<number | "">(existing?.overtimeRate ?? "");

  const nextId = useMemo(
    () => existing?.id ?? `FAC-${2000 + getTeachers().length + 1}`,
    [existing],
  );

  const toggle = <T,>(setter: React.Dispatch<React.SetStateAction<T[]>>, value: T) =>
    setter((arr) => (arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value]));

  const goNext = () => {
    if (!fullName || !phone || !email || subjects.length === 0) {
      toast.error("Name, phone, email and subjects are required");
      return;
    }
    setStep(2);
  };

  const submit = () => {
    if (salaryType === "daily" && !basicDaily) return toast.error("Enter basic daily pay");
    if (salaryType === "hourly" && !hourlyRate) return toast.error("Enter hourly rate");
    const payload = {
      fullName, dob, gender, phone, email, address,
      emergencyName, emergencyPhone,
      qualification, university, designation, subjects, classes,
      joiningDate, experience: experience === "" ? undefined : Number(experience),
      salaryType,
      basicDaily: basicDaily === "" ? undefined : Number(basicDaily),
      workingDays: workingDays === "" ? undefined : Number(workingDays),
      hra: hra === "" ? undefined : Number(hra),
      pf: pf === "" ? undefined : Number(pf),
      hourlyRate: hourlyRate === "" ? undefined : Number(hourlyRate),
      expectedHours: expectedHours === "" ? undefined : Number(expectedHours),
      overtimeRate: overtimeRate === "" ? undefined : Number(overtimeRate),
    };
    if (isEdit && existing) {
      updateTeacher({ ...payload, id: existing.id });
      toast.success(`${fullName} updated`);
    } else {
      addTeacher(payload);
      toast.success(`${fullName} added to faculty`);
    }
    navigate({ to: "/faculty" });
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Add Teacher</h1>
          <p className="text-sm text-muted-foreground">Profile, designation and salary structure.</p>
        </div>
      </div>

      <Stepper step={step} labels={["Profile & Designation", "Salary Structure"]} />

      <div className="mt-6 space-y-6">
        {step === 1 && (
          <>
            <Card title="General Info">
              <div className="grid gap-5 sm:grid-cols-2">
                <F label="Full Name *"><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></F>
                <F label="Date of Birth"><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} /></F>
                <F label="Gender">
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </F>
                <F label="Phone *"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></F>
                <F label="Email *"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></F>
                <F label="Profile Photo"><Input type="file" accept="image/*" /></F>
                <F label="Emergency Contact Name"><Input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} /></F>
                <F label="Emergency Contact Phone"><Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} /></F>
                <F label="Address" full><Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} /></F>
              </div>
            </Card>

            <Card title="Education & Designation">
              <div className="grid gap-5 sm:grid-cols-2">
                <F label="Highest Qualification"><Input value={qualification} onChange={(e) => setQualification(e.target.value)} placeholder="e.g. M.Sc Physics" /></F>
                <F label="University / Institution"><Input value={university} onChange={(e) => setUniversity(e.target.value)} /></F>
                <F label="Designation">
                  <Select value={designation} onValueChange={setDesignation}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DESIGNATIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </F>
                <F label="Experience (Years)">
                  <Input
                    type="number"
                    value={experience}
                    onChange={(e) => setExperience(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </F>
                <F label="Joining Date"><Input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} /></F>
                <F label="Faculty ID"><Input value={nextId} disabled /></F>

                <F label="Subjects Taught *" full>
                  <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-background p-3">
                    {ALL_SUBJECTS.map((s) => {
                      const a = subjects.includes(s);
                      return (
                        <label key={s} className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition",
                          a ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent",
                        )}>
                          <Checkbox checked={a} onCheckedChange={() => toggle(setSubjects, s)} />
                          {s}
                        </label>
                      );
                    })}
                  </div>
                </F>

                <F label="Classes Handled" full>
                  <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-background p-3">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
                      const a = classes.includes(n);
                      return (
                        <label key={n} className={cn(
                          "flex h-9 w-12 cursor-pointer items-center justify-center rounded-md border text-sm font-medium transition",
                          a ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent",
                        )}>
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={a}
                            onChange={() => toggle(setClasses, n)}
                          />
                          {n}
                        </label>
                      );
                    })}
                  </div>
                </F>
              </div>
            </Card>

            <div className="flex justify-end">
              <Button onClick={goNext}>Next <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
          </>
        )}

        {step === 2 && (
          <Card title="Salary Type">
            <div className="mb-6 inline-flex items-center rounded-full border border-border bg-muted p-1">
              {(["daily", "hourly"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSalaryType(t)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium capitalize transition",
                    salaryType === t
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t === "daily" ? <CalendarIcon className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  {t} Basis
                </button>
              ))}
            </div>

            {salaryType === "daily" ? (
              <div className="grid gap-5 sm:grid-cols-2">
                <F label="Basic Daily Pay (₹) *"><Input type="number" value={basicDaily} onChange={(e) => setBasicDaily(e.target.value === "" ? "" : Number(e.target.value))} /></F>
                <F label="Working Days per Month"><Input type="number" value={workingDays} onChange={(e) => setWorkingDays(e.target.value === "" ? "" : Number(e.target.value))} /></F>
                <F label="HRA / Allowances (₹)"><Input type="number" value={hra} onChange={(e) => setHra(e.target.value === "" ? "" : Number(e.target.value))} /></F>
                <F label="PF / Deduction (₹)"><Input type="number" value={pf} onChange={(e) => setPf(e.target.value === "" ? "" : Number(e.target.value))} /></F>
                <div className="sm:col-span-2 rounded-lg bg-accent/50 p-4 text-sm">
                  <p className="text-muted-foreground">Estimated monthly salary</p>
                  <p className="mt-1 text-2xl font-semibold text-primary">
                    ₹{(((Number(basicDaily) || 0) * (Number(workingDays) || 0)) + (Number(hra) || 0) - (Number(pf) || 0)).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                <F label="Hourly Rate (₹) *"><Input type="number" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value === "" ? "" : Number(e.target.value))} /></F>
                <F label="Expected Hours per Month"><Input type="number" value={expectedHours} onChange={(e) => setExpectedHours(e.target.value === "" ? "" : Number(e.target.value))} /></F>
                <F label="Overtime Rate per Hour (₹)"><Input type="number" value={overtimeRate} onChange={(e) => setOvertimeRate(e.target.value === "" ? "" : Number(e.target.value))} /></F>
                <div className="sm:col-span-2 rounded-lg bg-accent/50 p-4 text-sm">
                  <p className="text-muted-foreground">Estimated monthly salary</p>
                  <p className="mt-1 text-2xl font-semibold text-primary">
                    ₹{((Number(hourlyRate) || 0) * (Number(expectedHours) || 0)).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={submit}>
                <Check className="mr-2 h-4 w-4" /> Submit
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="mb-5 text-base font-semibold">{title}</h2>
      {children}
    </div>
  );
}
function F({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={cn("space-y-1.5", full && "sm:col-span-2")}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
