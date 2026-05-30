export const ROLE_PERMISSIONS = {
  Owner: [
    "dashboard",
    "students",
    "faculty",
    "admissions",
    "expenses",
    "revenue",
    "qr",
    "student-attendance",
  ],
  Coordinator: [
    "dashboard",
    "students",
    "faculty",
    "admissions",
    "expenses",
    "qr",
    "student-attendance",
  ],
  Faculty: [
    "faculty-home",
    "scanner",
    "attendance",
    "salary",
    "payslip",
  ],
};

export const canAccess = (role: string, module: string): boolean => {
  return ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS]?.includes(module) || false;
};
