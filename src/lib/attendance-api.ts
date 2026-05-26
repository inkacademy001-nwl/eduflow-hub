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

export interface CalendarDayData {
  day: number;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "HOLIDAY" | "EMPTY";
  inTime?: string | null;
  outTime?: string | null;
  totalHours?: number | null;
}

export const attendanceApi = {
  fetchQrToken: async () => {
    return api.get(`/api/attendance/qr?t=${Date.now()}`);
  },

  fetchCalendar: async (facultyId: number | string, month: number, year: number) => {
    const rawId = typeof facultyId === "string" ? facultyId.replace("FAC-", "") : facultyId;
    const res = await api.get(`/api/attendance/calendar?facultyId=${rawId}&month=${month}&year=${year}`);
    return res as { data: CalendarDayData[] };
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
    return api.delete("/api/attendance/holiday", payload);
  },

  clearAllHolidays: async () => {
    return api.delete("/api/attendance/holidays/clear");
  },

  fetchSessionStatus: async () => {
    const res = await api.get("/api/attendance/session");
    return res as { isSessionActive: boolean };
  },

  startSession: async () => {
    const res = await api.post("/api/attendance/session/start");
    return res as { message: string; isSessionActive: boolean };
  },

  endSession: async () => {
    const res = await api.post("/api/attendance/session/end");
    return res as { message: string; isSessionActive: boolean };
  }
};
