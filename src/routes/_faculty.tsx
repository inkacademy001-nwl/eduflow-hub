import { createFileRoute, Outlet, useNavigate, Link, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Camera, CalendarDays, BarChart3, Download, LogOut, Sun, Moon, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_faculty")({
  component: FacultyLayout,
});

const tabs = [
  { label: "Scanner", icon: Camera, path: "/attendance" },
  { label: "Attendance", icon: CalendarDays, path: "/salary" },
  { label: "Salary", icon: BarChart3, path: "/breakdown" },
  { label: "Payslip", icon: Download, path: "/payslip" },
] as const;

function FacultyLayout() {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    if (user === null) {
      const t = setTimeout(() => {
        const raw = typeof window !== "undefined" ? localStorage.getItem("erp_auth_user") : null;
        if (!raw) navigate({ to: "/auth" });
        else {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.role !== "Faculty") navigate({ to: "/auth" });
          } catch {
            navigate({ to: "/auth" });
          }
        }
      }, 50);
      return () => clearTimeout(t);
    }
    if (user && user.role !== "Faculty") {
      navigate({ to: "/dashboard" });
    }
  }, [user, navigate]);

  if (!user || user.role !== "Faculty") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-[10px] text-muted-foreground">Faculty · {user.facultyId}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggle}
            className="rounded-md p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => {
              signOut();
              navigate({ to: "/" });
            }}
            className="rounded-md p-2 text-muted-foreground transition hover:bg-accent hover:text-foreground"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 bg-background pb-20">
        <Outlet />
      </main>

      {/* Bottom Tab Bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur safe-area-bottom">
        <div className="mx-auto flex h-16 max-w-lg items-stretch">
          {tabs.map((tab) => {
            const isActive = pathname === tab.path;
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  "relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isActive && (
                  <span className="absolute top-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary" />
                )}
                <tab.icon className={cn("h-5 w-5", isActive && "scale-110")} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
