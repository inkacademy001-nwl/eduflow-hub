import { api } from "./api";

export const revenueApi = {
  getSetupStatus: async () => {
    const res = await api.get("/api/revenue/setup-status");
    return res;
  },
  setupRevenue: async (payload: { password?: string; academyFund?: number }) => {
    const res = await api.post("/api/revenue/setup", payload);
    return res;
  },
  verifyPassword: async (password: string) => {
    const res = await api.post("/api/revenue/verify-password", { password });
    return res;
  },
  updateFund: async (academyFund: number) => {
    const res = await api.post("/api/revenue/update-fund", { academyFund });
    return res;
  },
  updatePassword: async (payload: any) => {
    const res = await api.post("/api/revenue/update-password", payload);
    return res;
  },
  sendOtp: async () => {
    const res = await api.post("/api/revenue/forgot-password/send-otp");
    return res;
  },
  verifyOtp: async (otpCode: string) => {
    const res = await api.post("/api/revenue/forgot-password/verify-otp", { otpCode });
    return res;
  },
  resetPassword: async (payload: any) => {
    const res = await api.post("/api/revenue/forgot-password/reset", payload);
    return res;
  },
  getDashboardData: async () => {
    const res = await api.get("/api/revenue/dashboard");
    return res;
  }
};
