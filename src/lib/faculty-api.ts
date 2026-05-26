import { api } from "./api";

export interface SalaryDeductionConfig {
  lateType: 'NONE' | 'PERCENTAGE' | 'PER_DAY' | 'FIXED_AMOUNT';
  lateValue: number | null;
  absentType: 'NONE' | 'PERCENTAGE' | 'PER_DAY' | 'FIXED_AMOUNT';
  absentValue: number | null;
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
  designation: string;
  subjects: string[];
  classes: number[];
  joiningDate: string;
  salaryType: "daily" | "hourly";
  timeSlot?: string;
  monthlySalary?: number;
  hourlyRate?: number;
  extraActivities?: string[];
  attendanceStats?: { present: number; absent: number; late: number };
  expectedHours?: number;
  weekHours?: number;
}

export interface FacultyDashboardData {
  attendanceStats: { present: number; absent: number; late: number };
  calendar: { date: string; status: "Present" | "Absent" | "Late" | "Holiday" | null; inTime?: string | null; outTime?: string | null; totalHours?: number | null }[];
  salary: {
    basicPay: number | null;
    hourlyRate: number | null;
    totalHours: number | null;
    bonus: number;
    deductions: number;
    finalSalary: number;
    isFinalized: boolean;
  };
}

export const facultyApi = {
  fetchFaculty: async (search: string, page: number, limit: number) => {
    // Backend doesn't wrap in { data, pagination }, it returns array directly for now
    const res = await api.get(`/api/faculty?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`);
    return {
      data: Array.isArray(res) ? res.map(mapFacultyResponse) : (res.data ? res.data.map(mapFacultyResponse) : []),
    };
  },
  
  fetchFacultyById: async (id: number | string) => {
    const rawId = typeof id === "string" ? id.replace("FAC-", "") : id;
    const res = await api.get(`/api/faculty/${rawId}`);
    return mapFacultyResponse(res);
  },

  createFaculty: async (payload: any) => {
    return api.post("/api/faculty", payload);
  },

  updateFaculty: async (id: number | string, payload: any) => {
    const rawId = typeof id === "string" ? id.replace("FAC-", "") : id;
    return api.patch(`/api/faculty/${rawId}`, payload);
  },

  deleteFaculty: async (id: number | string) => {
    const rawId = typeof id === "string" ? id.replace("FAC-", "") : id;
    return api.delete(`/api/faculty/${rawId}`);
  },

  fetchFacultyDashboard: async (id: number | string, month: number, year: number) => {
    const rawId = typeof id === "string" ? id.replace("FAC-", "") : id;
    const res = await api.get(`/api/faculty/${rawId}/dashboard?month=${month}&year=${year}`);
    return res as FacultyDashboardData;
  },

  updateFacultySalary: async (id: number | string, payload: { month: number; year: number; bonus: number; deductions: number }) => {
    const rawId = typeof id === "string" ? id.replace("FAC-", "") : id;
    return api.patch(`/api/faculty/${rawId}/salary`, payload);
  },

  fetchDeductionConfig: async () => {
    return api.get("/api/faculty/config/deductions") as Promise<SalaryDeductionConfig>;
  },

  updateDeductionConfig: async (payload: SalaryDeductionConfig) => {
    return api.put("/api/faculty/config/deductions", payload) as Promise<{ message: string, config: SalaryDeductionConfig }>;
  },

  bulkFinalizeSalaries: async (month: number, year: number) => {
    return api.post("/api/faculty/bulk-payslips", { month, year }) as Promise<{ message: string, summary: any }>;
  }
};

export function mapFacultyResponse(backendFaculty: any): Teacher {
  let dob = "";
  if (backendFaculty.dateOfBirth) {
    const d = new Date(backendFaculty.dateOfBirth);
    dob = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  let joiningDate = "";
  if (backendFaculty.academic?.dateOfJoining) {
    const d = new Date(backendFaculty.academic.dateOfJoining);
    joiningDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  let salaryType: "daily" | "hourly" = "daily";
  if (backendFaculty.workConfig?.type === "HOURLY") {
    salaryType = "hourly";
  }

  return {
    id: `FAC-${backendFaculty.id}`,
    fullName: backendFaculty.fullName,
    dob,
    gender: backendFaculty.gender || "",
    phone: backendFaculty.phoneNumber || "",
    email: backendFaculty.email || "",
    address: backendFaculty.address || "",
    emergencyName: backendFaculty.emergencyName || "",
    emergencyPhone: backendFaculty.emergencyPhone || "",
    qualification: backendFaculty.academic?.qualification || "",
    designation: backendFaculty.academic?.designation || "Teacher",
    subjects: backendFaculty.subjects?.map((s: any) => s.subjectName) || [],
    classes: backendFaculty.academic?.classes || [],
    joiningDate,
    salaryType,
    timeSlot: backendFaculty.workConfig?.timeSlot,
    monthlySalary: backendFaculty.workConfig?.basicPay,
    hourlyRate: backendFaculty.workConfig?.hourlyRate,
    extraActivities: backendFaculty.academic?.extraActivities || [],
    attendanceStats: backendFaculty.attendanceStats,
    expectedHours: backendFaculty.expectedHours || 0,
    weekHours: backendFaculty.weekHours || 0
  };
}
