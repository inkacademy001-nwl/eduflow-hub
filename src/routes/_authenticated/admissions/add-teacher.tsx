import { createFileRoute, useNavigate, Navigate } from "@tanstack/react-router";
import { useState } from "react";
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
import {
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  Check,
  Clock,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Stepper } from "./add-student";
import { useAuth } from "@/lib/auth";
import { canAccess } from "@/config/rolePermissions";
import { facultyApi, Teacher } from "@/lib/faculty-api";

export const Route = createFileRoute("/_authenticated/admissions/add-teacher")(
  {
    component: () => <TeacherForm />,
  },
);

/* ── Subject groups (mirrors student class-based concept) ────────────────── */
const SUBJECT_GROUPS = [
  {
    label: "Classes 1–8",
    subjects: ["All Subjects", "Maths Only"],
  },
  {
    label: "Classes 9–10",
    subjects: ["English", "Maths", "Science", "Social", "Tamil", "Hindi"],
  },
  {
    label: "Classes 11–12",
    subjects: [
      "Physics",
      "Chemistry",
      "Maths",
      "Biology",
      "Accounts",
      "Commerce",
    ],
  },
];

const EXTRA_CURRICULAR = ["Chess"];

/* ── Slide animations (prefixed to avoid collision with add-student) ─────── */
const ANIM_STYLES = `
  @keyframes _tf_slideInRight {
    from { opacity: 0; transform: translateX(56px); }
    to   { opacity: 1; transform: translateX(0);    }
  }
  @keyframes _tf_slideInLeft {
    from { opacity: 0; transform: translateX(-56px); }
    to   { opacity: 1; transform: translateX(0);     }
  }
  ._tf_right { animation: _tf_slideInRight 0.35s cubic-bezier(0.22,1,0.36,1) both; }
  ._tf_left  { animation: _tf_slideInLeft  0.35s cubic-bezier(0.22,1,0.36,1) both; }
`;

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* ── Main form ───────────────────────────────────────────────────────────── */
export function TeacherForm({ initialData }: { initialData?: Teacher }) {
  const { user } = useAuth();
  if (!user || !canAccess(user.role, "admissions")) {
    return <Navigate to={user?.role === "Faculty" ? "/" : "/dashboard"} replace />;
  }

  const existing = initialData;
  const isEdit = !!existing;
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [step, setStep] = useState(1);
  const [animKey, setAnimKey] = useState(0);
  const [animClass, setAnimClass] = useState("_tf_right");

  /* ── Step 1 — General ── */
  const [fullName, setFullName] = useState(existing?.fullName ?? "");
  const [dob, setDob] = useState(existing?.dob ?? "");
  const [gender, setGender] = useState(existing?.gender ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [email, setEmail] = useState(existing?.email ?? "");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [emergencyName, setEmergencyName] = useState(
    existing?.emergencyName ?? "",
  );
  const [emergencyPhone, setEmergencyPhone] = useState(
    existing?.emergencyPhone ?? "",
  );

  /* ── Step 1 — Education & Teaching ── */
  const [qualification, setQualification] = useState(
    existing?.qualification ?? "",
  );
  const [joiningDate, setJoiningDate] = useState(
    existing?.joiningDate ?? localToday(),
  );
  const [subjects, setSubjects] = useState<string[]>(
    existing?.subjects ?? [],
  );
  const [classes, setClasses] = useState<number[]>(existing?.classes ?? []);
  const [extraActivities, setExtraActivities] = useState<string[]>(
    existing?.extraActivities ?? [],
  );

  /* ── Step 2 — Salary ── */
  const [salaryType, setSalaryType] = useState<"daily" | "hourly">(
    existing?.salaryType ?? "daily",
  );
  const [monthlySalary, setMonthlySalary] = useState<number | "">(
    existing?.monthlySalary ?? "",
  );
  const [hourlyRate, setHourlyRate] = useState<number | "">(
    existing?.hourlyRate ?? "",
  );
  const [timeSlot, setTimeSlot] = useState<string>(
    existing?.timeSlot ?? "5:30 PM",
  );

  /* ── helpers ── */
  const toggleStr = (setter: React.Dispatch<React.SetStateAction<string[]>>, v: string) =>
    setter((arr) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]));

  const toggleNum = (setter: React.Dispatch<React.SetStateAction<number[]>>, v: number) =>
    setter((arr) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]));

  const goNext = () => {
    if (!fullName.trim()) {
      toast.error("Full Name is required");
      return;
    }
    if (!phone.trim()) {
      toast.error("Phone is required");
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      toast.error("Phone must be exactly 10 digits (numbers only)");
      return;
    }
    if (emergencyPhone && !/^\d{10}$/.test(emergencyPhone)) {
      toast.error("Emergency Phone must be exactly 10 digits (numbers only)");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    setAnimClass("_tf_right");
    setAnimKey((k) => k + 1);
    setStep(2);
  };

  const goBack = () => {
    setAnimClass("_tf_left");
    setAnimKey((k) => k + 1);
    setStep(1);
  };

  const submit = async () => {
    if (salaryType === "daily" && !monthlySalary) {
      toast.error("Monthly salary is required for daily basis");
      return;
    }
    if (salaryType === "hourly" && !hourlyRate) {
      toast.error("Hourly rate is required for hourly basis");
      return;
    }

    const payload = {
      fullName,
      dateOfBirth: dob || null,
      gender: gender || "Other",
      phoneNumber: phone,
      email: email || null,
      address: address || null,
      emergencyName: emergencyName || null,
      emergencyPhone: emergencyPhone || null,
      academic: {
        qualification: qualification || null,
        designation: existing?.designation ?? "Teacher",
        dateOfJoining: joiningDate || null,
        classes,
        extraActivities
      },
      subjects,
      workConfig: {
        type: salaryType.toUpperCase(),
        timeSlot: salaryType === "daily" ? timeSlot : null,
        basicPay: salaryType === "daily" ? Number(monthlySalary) : null,
        hourlyRate: salaryType === "hourly" ? Number(hourlyRate) : null,
      }
    };

    setIsSubmitting(true);
    try {
      if (isEdit && existing) {
        await facultyApi.updateFaculty(existing.id, payload);
        toast.success(`${fullName} updated`);
      } else {
        await facultyApi.createFaculty(payload);
        toast.success(`${fullName} added to faculty`);
      }
      navigate({ to: "/faculty" });
    } catch (err: any) {
      toast.error(err.message || "Failed to save faculty");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>{ANIM_STYLES}</style>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Page heading */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {isEdit ? "Edit Teacher" : "Add Teacher"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Profile, teaching details and salary structure.
            </p>
          </div>
        </div>

        <Stepper step={step} labels={["Profile & Teaching", "Salary Structure"]} />

        {/* Animated content wrapper */}
        <div className="mt-6">
          <div key={animKey} className={cn("space-y-6", animClass)}>

            {/* ══════════════ STEP 1 ══════════════ */}
            {step === 1 && (
              <>
                {/* General Info */}
                <Card title="General Info">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <F label="Full Name *">
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Priya Menon"
                      />
                    </F>

                    <F label="Date of Birth">
                      <Input
                        type="date"
                        value={dob}
                        max={localToday()}
                        onChange={(e) => setDob(e.target.value)}
                      />
                    </F>

                    <F label="Gender">
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
                    </F>

                    <F label="Phone *">
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    </F>

                    <F label="Email *">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      {email && !email.includes("@") && (
                        <button
                          type="button"
                          onClick={() => setEmail((prev) => prev + "@gmail.com")}
                          className="mt-1.5 w-fit inline-flex items-center rounded-md bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          + @gmail.com
                        </button>
                      )}
                    </F>

                    <F label="Joining Date">
                      <Input
                        type="date"
                        value={joiningDate}
                        max={localToday()}
                        onChange={(e) => setJoiningDate(e.target.value)}
                      />
                    </F>

                    <F label="Highest Qualification">
                      <Input
                        value={qualification}
                        onChange={(e) => setQualification(e.target.value)}
                        placeholder="e.g. M.Sc Physics"
                      />
                    </F>

                    <F label="Emergency Contact Name">
                      <Input
                        value={emergencyName}
                        onChange={(e) => setEmergencyName(e.target.value)}
                      />
                    </F>

                    <F label="Emergency Contact Phone">
                      <Input
                        value={emergencyPhone}
                        onChange={(e) => setEmergencyPhone(e.target.value)}
                      />
                    </F>

                    <F label="Address" full>
                      <Textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={3}
                      />
                    </F>
                  </div>
                </Card>

                {/* Subjects Taught — class-group based */}
                <Card title="Subjects Taught">
                  <div className="space-y-5">
                    {SUBJECT_GROUPS.map((group) => (
                      <div key={group.label}>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {group.label}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {group.subjects.map((s) => {
                            const active = subjects.includes(s);
                            return (
                              <label
                                key={`${group.label}-${s}`}
                                className={cn(
                                  "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition select-none",
                                  active
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border hover:bg-accent",
                                )}
                              >
                                <Checkbox
                                  checked={active}
                                  onCheckedChange={() =>
                                    toggleStr(setSubjects, s)
                                  }
                                />
                                {s}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Extra Curricular */}
                    {EXTRA_CURRICULAR.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          Extra Curricular
                        </p>
                        <div className="flex flex-wrap gap-2">
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
                                  onCheckedChange={() =>
                                    toggleStr(setExtraActivities, a)
                                  }
                                />
                                {a}
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Classes Handled */}
                  <div className="mt-6 border-t border-border pt-5">
                    <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Classes Handled
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => {
                        const active = classes.includes(n);
                        return (
                          <label
                            key={n}
                            className={cn(
                              "flex h-9 w-12 cursor-pointer items-center justify-center rounded-md border text-sm font-medium transition select-none",
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border hover:bg-accent",
                            )}
                          >
                            <input
                              type="checkbox"
                              className="sr-only"
                              checked={active}
                              onChange={() => toggleNum(setClasses, n)}
                            />
                            {n}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </Card>

                <div className="flex justify-end">
                  <Button onClick={goNext} size="lg" className="min-w-32">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {/* ══════════════ STEP 2 ══════════════ */}
            {step === 2 && (
              <Card title="Salary Structure">
                {/* Type toggle */}
                <div className="mb-8 inline-flex items-center rounded-full border border-border bg-muted p-1">
                  {(["daily", "hourly"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setSalaryType(t)}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-medium capitalize transition",
                        salaryType === t
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t === "daily" ? (
                        <CalendarIcon className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                      {t} Basis
                    </button>
                  ))}
                </div>

                <div className="max-w-sm space-y-4">
                  {salaryType === "daily" ? (
                    <>
                      <F label="Time Slot *">
                        <Select
                          value={timeSlot}
                          onValueChange={(val) => setTimeSlot(val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Time Slot" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5:30 PM">5:30 PM</SelectItem>
                            <SelectItem value="6:00 PM">6:00 PM</SelectItem>
                            <SelectItem value="6:30 PM">6:30 PM</SelectItem>
                          </SelectContent>
                        </Select>
                      </F>
                      <F label="Monthly Salary (₹) *">
                        <Input
                          type="number"
                          placeholder="e.g. 35000"
                          value={monthlySalary}
                          onChange={(e) =>
                            setMonthlySalary(
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                            )
                          }
                        />
                      </F>

                      {!!monthlySalary && (
                        <div className="rounded-xl border border-primary/25 bg-primary/8 px-4 py-3">
                          <p className="text-xs text-muted-foreground">
                            Monthly Salary
                          </p>
                          <p className="mt-1 text-2xl font-bold text-primary">
                            ₹{Number(monthlySalary).toLocaleString("en-IN")}
                          </p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <F label="Salary per Hour (₹) *">
                        <Input
                          type="number"
                          placeholder="e.g. 500"
                          value={hourlyRate}
                          onChange={(e) =>
                            setHourlyRate(
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value),
                            )
                          }
                        />
                      </F>

                      {!!hourlyRate && (
                        <div className="rounded-xl border border-primary/25 bg-primary/8 px-4 py-3">
                          <p className="text-xs text-muted-foreground">
                            Rate per Hour
                          </p>
                          <p className="mt-1 text-2xl font-bold text-primary">
                            ₹{Number(hourlyRate).toLocaleString("en-IN")}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="mt-8 flex justify-between">
                  <Button variant="outline" onClick={goBack}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={submit} size="lg" className="min-w-40" disabled={isSubmitting}>
                    <Check className="mr-2 h-4 w-4" />
                    {isEdit ? "Update Faculty" : "Submit"}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Shared sub-components ───────────────────────────────────────────────── */
function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
      <h2 className="mb-5 text-base font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function F({
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
