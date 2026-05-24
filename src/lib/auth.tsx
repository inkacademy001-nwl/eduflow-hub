import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "@/lib/api";

export type Role = "Owner" | "Coordinator" | "Faculty";
export interface AuthUser {
  name: string;
  email: string;
  role: Role;
  facultyId?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  googleSignIn: (token: string) => Promise<AuthUser>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "erp_auth_user";

/** Map the backend role string to the frontend Role type */
function mapRole(backendRole: string): Role {
  switch (backendRole) {
    case "OWNER":
      return "Owner";
    case "COORDINATOR":
      return "Coordinator";
    case "FACULTY":
      return "Faculty";
    default:
      return "Coordinator";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // corrupted data — clear it
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = (u: AuthUser | null) => {
    setUser(u);
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const googleSignIn: AuthContextValue["googleSignIn"] = async (token) => {
    const res = await api.post("/api/auth/google", { token });

    // Backend returns 403 for unauthorized users
    if (res.message === "User not authorized") {
      throw new Error("User not authorized. Please contact the administrator.");
    }

    // Backend returns 400/500 for other errors
    if (res.message && !res.role) {
      throw new Error(res.message);
    }

    const role = mapRole(res.role);
    const backendUser = res.user;

    const authUser: AuthUser = {
      name: backendUser.fullName || backendUser.name || "User",
      email: backendUser.email,
      role,
      ...(role === "Faculty" ? { facultyId: `FAC-${backendUser.id}` } : {}),
    };

    persist(authUser);
    return authUser;
  };

  const signOut = () => persist(null);

  return (
    <AuthContext.Provider value={{ user, loading, googleSignIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
