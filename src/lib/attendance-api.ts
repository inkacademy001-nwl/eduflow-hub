import { api } from "./api";

export interface ScanEntry {
  id: string;
  facultyName: string;
  type: "Check-In" | "Check-Out";
  timestamp: string;
}

export interface HolidayEntry {
  id: number;
  date: string;
  reason: string | null;
  isActive: boolean;
}

export const attendanceApi = {
  fetchQrToken: async () => {
    return api.get("/api/attendance/qr");
  },

  submitScan: async (payload: { token: string; facultyId: number }) => {
    return api.post("/api/attendance/scan", payload);
  },

  fetchRecentScans: async () => {
    const res = await api.get("/api/attendance/recent");
    if (!res || !res.data) return [];
    return res.data as ScanEntry[];
  },

  fetchHolidays: async () => {
    const res = await api.get("/api/attendance/holiday");
    if (!res || !res.data) return [];
    return res.data as HolidayEntry[];
  },

  setHoliday: async (payload: { date: string; reason?: string }) => {
    return api.post("/api/attendance/holiday", payload);
  },

  removeHoliday: async (payload: { date: string }) => {
    return api.delete("/api/attendance/holiday", { data: payload });
  }
};
