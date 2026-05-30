import { api } from "./api";

export interface Student {
  id: string;
  fullName: string;
  dob?: string;
  gender?: string;
  primaryPhone: string;
  secondaryPhone?: string;
  fatherName?: string;
  motherName?: string;
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
  fees?: number;
  feeStatus?: "Paid" | "Not Paid";
}

export const studentApi = {
  fetchStudents: async (search: string, page: number, limit: number) => {
    const res = await api.get(`/api/students?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`);
    return {
      data: res.data.map(mapStudentListResponse),
      pagination: res.pagination
    };
  },
  
  fetchStudentById: async (id: number | string) => {
    const rawId = typeof id === "string" ? id.replace("STU-", "") : id;
    const res = await api.get(`/api/students/${rawId}`);
    return mapStudentDetailResponse(res);
  },

  createStudent: async (payload: any) => {
    return api.post("/api/students/add-student", payload);
  },

  updateStudentApi: async (id: number | string, payload: any) => {
    const rawId = typeof id === "string" ? id.replace("STU-", "") : id;
    return api.patch(`/api/students/${rawId}`, payload);
  },

  deleteStudentApi: async (id: number | string) => {
    const rawId = typeof id === "string" ? id.replace("STU-", "") : id;
    return api.delete(`/api/students/${rawId}`);
  },

  updateFeeStatusApi: async (id: number | string, status: "Paid" | "Not Paid") => {
    const rawId = typeof id === "string" ? id.replace("STU-", "") : id;
    return api.put(`/api/students/${rawId}/fee-status`, { status });
  }
};

function mapStudentListResponse(backendStudent: any): Student {
  return {
    id: `STU-${backendStudent.id}`,
    fullName: backendStudent.fullName,
    primaryPhone: backendStudent.contacts?.[0]?.phoneNumber || "N/A",
    class: backendStudent.academic?.standard ? parseInt(backendStudent.academic.standard) : 0,
    board: backendStudent.academic?.board || "N/A",
    subjects: backendStudent.academic?.subjects || [],
    admissionDate: "",
    feeStatus: backendStudent.fee?.status || "Not Paid",
    fees: undefined
  };
}

function mapStudentDetailResponse(backendStudent: any): Student {
  const primaryContact = backendStudent.contacts?.find((c: any) => c.isPrimary);
  const parentContact = backendStudent.contacts?.find((c: any) => !c.isPrimary && c.relationType === "parent");
  const otherContacts = backendStudent.contacts?.filter((c: any) => !c.isPrimary && c.relationType !== "parent") || [];
  
  let gender = backendStudent.gender || "";
  if (gender) {
    gender = gender.charAt(0).toUpperCase() + gender.slice(1);
  }

  let dob = "";
  if (backendStudent.dateOfBirth) {
    const d = new Date(backendStudent.dateOfBirth);
    dob = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  let admissionDate = "";
  if (backendStudent.academic?.dateOfJoining) {
    const d = new Date(backendStudent.academic.dateOfJoining);
    admissionDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  return {
    id: `STU-${backendStudent.id}`,
    fullName: backendStudent.fullName,
    dob,
    gender,
    primaryPhone: primaryContact?.phoneNumber || "",
    fatherName: backendStudent.fatherName || "",
    motherName: backendStudent.motherName || "",
    parentPhone: parentContact?.phoneNumber || "",
    address: backendStudent.address || "",
    
    extraContacts: otherContacts.map((c: any) => ({
      number: c.phoneNumber,
      relation: c.relationType
    })),

    class: Number(backendStudent.academic?.standard) || 0,
    board: backendStudent.academic?.board || "",
    subjects: backendStudent.academic?.subjects || [],
    extraActivities: backendStudent.academic?.extraActivities || [],
    previousSchool: backendStudent.academic?.schoolName || "",
    admissionDate,
    
    fees: backendStudent.fee?.finalFee
  };
}
