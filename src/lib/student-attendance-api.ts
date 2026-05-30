

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const getAuthHeaders = () => {
  const token = localStorage.getItem("erp_auth_token");
  return { Authorization: `Bearer ${token}` };
};

export interface StudentAttendanceRecord {
  id: string; // STU-1001
  dbId: number;
  fullName: string;
  class: number;
  subjects: string[];
  attendance: "Present" | "Late" | "Absent" | null;
}

export const getStudentAttendance = async (date: string): Promise<StudentAttendanceRecord[]> => {
  const response = await fetch(`${API_BASE_URL}/api/student-attendance?date=${encodeURIComponent(date)}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error("Failed to fetch attendance");
  }
  return response.json();
};

export interface UpdateAttendancePayload {
  studentId: number;
  status: "Present" | "Late" | "Absent" | null;
}

export const updateStudentAttendance = async (date: string, records: UpdateAttendancePayload[]) => {
  const response = await fetch(`${API_BASE_URL}/api/student-attendance/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ date, records }),
  });
  if (!response.ok) {
    throw new Error("Failed to update attendance");
  }
  return response.json();
};
