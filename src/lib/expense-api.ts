import { api } from "./api";

export interface Expense {
  id: number;
  category: string;
  amount: number;
  date: string;
  description: string;
}

export const expenseApi = {
  getDashboardData: async () => {
    const res = await api.get("/api/expenses/dashboard");
    return res;
  },
  
  getFacultySalaryTotal: async (month: number, year: number) => {
    const res = await api.get(`/api/expenses/faculty-salary?month=${month}&year=${year}`);
    return res;
  },

  getAllExpenses: async () => {
    const res = await api.get("/api/expenses");
    return res;
  },

  createExpense: async (payload: { category: string; amount: number; date: string; description: string }) => {
    const res = await api.post("/api/expenses", payload);
    return res;
  },

  updateExpense: async (id: number, payload: { category: string; amount: number; date: string; description: string }) => {
    const res = await api.patch(`/api/expenses/${id}`, payload);
    return res;
  },

  deleteExpense: async (id: number) => {
    const res = await api.delete(`/api/expenses/${id}`);
    return res;
  }
};
