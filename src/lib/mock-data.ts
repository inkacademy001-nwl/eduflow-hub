export interface Student {
  id: string;
  fullName: string;
  dob?: string;
  gender?: string;
  primaryPhone: string;
  secondaryPhone?: string;
  parentName?: string;
  parentPhone?: string;
  address?: string;
  class: number;
  board: string;
  stream?: string;
  subjects: string[];
  extraActivities?: string[];
  extraContacts?: { number: string; relation: string }[];
  previousSchool?: string;
  academicYear?: string;
  admissionDate: string;
  notes?: string;
}

export interface Teacher {
  id: string;
  fullName: string;
  dob?: string;
  gender?: string;
  phone: string;
  email: string;
  address?: string;
  emergencyName?: string;
  emergencyPhone?: string;
  qualification?: string;
  university?: string;
  designation: string;
  subjects: string[];
  classes: number[];
  joiningDate: string;
  experience?: number;
  salaryType: "daily" | "hourly";
  // daily
  monthlySalary?: number;
  basicDaily?: number;
  workingDays?: number;
  hra?: number;
  pf?: number;
  // hourly
  hourlyRate?: number;
  expectedHours?: number;
  overtimeRate?: number;
  // shared
  extraActivities?: string[];
}

const STUDENT_KEY = "erp_students";
const TEACHER_KEY = "erp_teachers";

const seedStudents: Student[] = [
  {
    id: "STU-1001",
    fullName: "Aarav Sharma",
    primaryPhone: "+91 98765 43210",
    parentName: "Rohit Sharma",
    parentPhone: "+91 98765 11111",
    class: 12,
    board: "CBSE",
    stream: "PCM",
    subjects: ["Physics", "Chemistry", "Maths"],
    admissionDate: "2024-06-12",
    address: "12 MG Road, Bengaluru",
    academicYear: "2024-25",
  },
  {
    id: "STU-1002",
    fullName: "Diya Patel",
    primaryPhone: "+91 99887 76655",
    parentName: "Hiren Patel",
    parentPhone: "+91 99887 00000",
    class: 10,
    board: "State Board",
    subjects: ["Maths", "Science", "English"],
    admissionDate: "2024-05-21",
    academicYear: "2024-25",
  },
  {
    id: "STU-1003",
    fullName: "Kabir Rao",
    primaryPhone: "+91 90000 12345",
    parentName: "Anjali Rao",
    parentPhone: "+91 90000 99999",
    class: 8,
    board: "CBSE",
    subjects: ["All Subjects"],
    admissionDate: "2024-04-02",
    academicYear: "2024-25",
  },
  {
    id: "STU-1004",
    fullName: "Meera Iyer",
    primaryPhone: "+91 91111 22222",
    parentName: "Suresh Iyer",
    parentPhone: "+91 91111 33333",
    class: 11,
    board: "ICSE",
    stream: "Commerce",
    subjects: ["Accounts", "Commerce", "Maths"],
    admissionDate: "2024-06-30",
    academicYear: "2024-25",
  },
];

const seedTeachers: Teacher[] = [
  {
    id: "FAC-2001",
    fullName: "Priya Menon",
    phone: "+91 98765 00001",
    email: "priya@center.in",
    designation: "Senior Teacher",
    subjects: ["Physics"],
    classes: [11, 12],
    joiningDate: "2022-04-01",
    experience: 8,
    salaryType: "daily",
    basicDaily: 1200,
    workingDays: 26,
    hra: 4000,
    pf: 1800,
  },
  {
    id: "FAC-2002",
    fullName: "Rahul Verma",
    phone: "+91 98765 00002",
    email: "rahul@center.in",
    designation: "Teacher",
    subjects: ["Maths"],
    classes: [9, 10, 11, 12],
    joiningDate: "2023-06-15",
    experience: 4,
    salaryType: "hourly",
    hourlyRate: 500,
    expectedHours: 80,
    overtimeRate: 700,
  },
  {
    id: "FAC-2003",
    fullName: "Anita Joseph",
    phone: "+91 98765 00003",
    email: "anita@center.in",
    designation: "HOD",
    subjects: ["Chemistry"],
    classes: [11, 12],
    joiningDate: "2020-01-10",
    experience: 12,
    salaryType: "daily",
    basicDaily: 1500,
    workingDays: 26,
    hra: 5000,
    pf: 2000,
  },
  {
    id: "FAC-2004",
    fullName: "Vikram Singh",
    phone: "+91 98765 00004",
    email: "vikram@center.in",
    designation: "Teacher",
    subjects: ["Biology"],
    classes: [11, 12],
    joiningDate: "2024-02-20",
    experience: 3,
    salaryType: "hourly",
    hourlyRate: 450,
    expectedHours: 60,
    overtimeRate: 600,
  },
];

function load<T>(key: string, seed: T[]): T[] {
  if (typeof window === "undefined") return seed;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  } catch {
    return seed;
  }
}

function save<T>(key: string, value: T[]) {
  if (typeof window !== "undefined") localStorage.setItem(key, JSON.stringify(value));
}

export function getStudents(): Student[] {
  return load(STUDENT_KEY, seedStudents);
}
export function addStudent(s: Omit<Student, "id">): Student {
  const list = getStudents();
  const id = `STU-${1000 + list.length + 1}`;
  const created = { ...s, id };
  save(STUDENT_KEY, [created, ...list]);
  return created;
}
export function updateStudent(s: Student) {
  save(
    STUDENT_KEY,
    getStudents().map((x) => (x.id === s.id ? s : x)),
  );
}
export function deleteStudent(id: string) {
  save(
    STUDENT_KEY,
    getStudents().filter((x) => x.id !== id),
  );
}

export function getTeachers(): Teacher[] {
  return load(TEACHER_KEY, seedTeachers);
}
export function addTeacher(t: Omit<Teacher, "id">): Teacher {
  const list = getTeachers();
  const id = `FAC-${2000 + list.length + 1}`;
  const created = { ...t, id };
  save(TEACHER_KEY, [created, ...list]);
  return created;
}
export function updateTeacher(t: Teacher) {
  save(
    TEACHER_KEY,
    getTeachers().map((x) => (x.id === t.id ? t : x)),
  );
}
export function deleteTeacher(id: string) {
  save(
    TEACHER_KEY,
    getTeachers().filter((x) => x.id !== id),
  );
}

// Holiday calendar storage
const HOLIDAY_KEY = "erp_holidays";
export function getHolidays(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HOLIDAY_KEY) || "[]");
  } catch {
    return [];
  }
}
export function setHolidays(d: string[]) {
  if (typeof window !== "undefined") localStorage.setItem(HOLIDAY_KEY, JSON.stringify(d));
}

// Recent scans (mock realtime)
export interface ScanEntry {
  id: string;
  facultyName: string;
  type: "Check-In" | "Check-Out";
  timestamp: string;
}
const SCAN_KEY = "erp_scans";
export function getScans(): ScanEntry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(SCAN_KEY) || "[]");
  } catch {
    return [];
  }
}
export function pushScan(e: ScanEntry) {
  const list = [e, ...getScans()].slice(0, 30);
  if (typeof window !== "undefined") localStorage.setItem(SCAN_KEY, JSON.stringify(list));
}

// Attendance heatmap (deterministic pseudo random per faculty)
export type DayStatus = "present" | "absent" | "late" | "holiday" | "none";
export function getAttendanceFor(facultyId: string, year: number, month: number): DayStatus[] {
  const days = new Date(year, month + 1, 0).getDate();
  const holidays = new Set(getHolidays());
  const seed = facultyId.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const result: DayStatus[] = [];
  for (let d = 1; d <= days; d++) {
    const date = new Date(year, month, d);
    // Use local date parts to avoid UTC timezone shift (e.g. IST +5:30 causes toISOString to return previous day)
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    if (holidays.has(iso)) {
      result.push("holiday");
      continue;
    }
    const dow = date.getDay();
    if (dow === 0) {
      result.push("none");
      continue;
    }
    const r = ((seed + d * 13) % 100) / 100;
    if (r < 0.78) result.push("present");
    else if (r < 0.9) result.push("late");
    else result.push("absent");
  }
  return result;
}
export function attendanceSummary(facultyId: string) {
  const now = new Date();
  const arr = getAttendanceFor(facultyId, now.getFullYear(), now.getMonth());
  return {
    present: arr.filter((x) => x === "present").length,
    absent: arr.filter((x) => x === "absent").length,
    late: arr.filter((x) => x === "late").length,
  };
}
