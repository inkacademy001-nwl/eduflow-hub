import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "Owner" | "Coordinator";
export interface AuthUser {
  name: string;
  email: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  signUp: (name: string, email: string, password: string, role: Role) => Promise<AuthUser>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "erp_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = (u: AuthUser | null) => {
    setUser(u);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const signIn: AuthContextValue["signIn"] = async (email) => {
    // Mock auth — accept any non-empty creds
    const role: Role = email.toLowerCase().includes("owner") ? "Owner" : "Coordinator";
    const u: AuthUser = { name: email.split("@")[0] || "User", email, role };
    persist(u);
    return u;
  };
  const signUp: AuthContextValue["signUp"] = async (name, email, _password, role) => {
    const u: AuthUser = { name, email, role };
    persist(u);
    return u;
  };
  const signOut = () => persist(null);

  return (
    <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
