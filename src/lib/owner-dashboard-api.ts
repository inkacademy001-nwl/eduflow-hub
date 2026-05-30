import { api } from "./api";

export interface DashboardOverview {
  totalRevenue: number;
  netProfit: number;
  activeStudents: number;
  facultyStrength: number;
}

export interface AdmissionData {
  name: string;
  admissions: number;
}

export interface FinancialData {
  name: string;
  value: number;
  color: string;
}

export interface ClassPerformanceData {
  rank: number;
  name: string;
  contribution: number;
  percentage: number;
}

export interface OwnerDashboardResponse {
  overview: DashboardOverview;
  admissionData: AdmissionData[];
  financialData: FinancialData[];
  classPerformanceData: ClassPerformanceData[];
}

export const ownerDashboardApi = {
  getOwnerDashboardData: async (_token: string): Promise<OwnerDashboardResponse> => {
    const res = await api.get("/api/owner-dashboard");
    // Depending on how `api` wrapper behaves, it might return the payload directly or inside .data
    // If we look at attendance-api.ts, for GET requests it returns `res as {...}` directly (meaning interceptors extract data) or `res.data`.
    // I will use `res as OwnerDashboardResponse` or check if it has `.data`
    return res as unknown as OwnerDashboardResponse;
  }
};
