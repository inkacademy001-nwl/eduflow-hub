import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  PlusCircle,
  Wallet,
  TrendingUp,
  QrCode,
  UserPlus,
  ChevronDown,
  LogOut,
  Sun,
  Moon,
  CalendarCheck,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const isActive = (p: string) => pathname === p;
  const isAdmissionsActive = pathname.startsWith("/admissions");
  const [admissionsOpen, setAdmissionsOpen] = useState(isAdmissionsActive);

  const items = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ...(user?.role === "Owner" || user?.role === "Coordinator"
      ? [{ title: "Attendance", url: "/student-attendance", icon: CalendarCheck }]
      : []),
    { title: "Students", url: "/students", icon: Users },
    { title: "Faculty", url: "/faculty", icon: GraduationCap },
  ];
  const trailing = [
    { title: "Expenses", url: "/expenses", icon: Wallet },
    ...(user?.role === "Owner"
      ? [{ title: "Revenue", url: "/revenue", icon: TrendingUp }]
      : []),
    { title: "Attendance QR", url: "/qr", icon: QrCode },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">INK - ACADEMY</p>
              <p className="truncate text-[10px] text-muted-foreground">ERP SYSTEM</p>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((it) => (
                <SidebarMenuItem key={it.url}>
                  <SidebarMenuButton asChild isActive={isActive(it.url)} tooltip={it.title}>
                    <Link to={it.url} className="flex items-center gap-2">
                      <it.icon className="h-4 w-4" />
                      <span>{it.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Admissions with submenu */}
              <Collapsible open={admissionsOpen} onOpenChange={setAdmissionsOpen}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isAdmissionsActive}
                      tooltip="Admissions"
                      className="justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <PlusCircle className="h-4 w-4" />
                        <span>Admissions</span>
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${admissionsOpen ? "rotate-180" : ""}`}
                      />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isActive("/admissions/add-student")}
                        >
                          <Link to="/admissions/add-student">
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Add Student</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isActive("/admissions/add-teacher")}
                        >
                          <Link to="/admissions/add-teacher">
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Add Teacher</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              {trailing.map((it) => (
                <SidebarMenuItem key={it.url}>
                  <SidebarMenuButton asChild isActive={isActive(it.url)} tooltip={it.title}>
                    <Link to={it.url} className="flex items-center gap-2">
                      <it.icon className="h-4 w-4" />
                      <span>{it.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="flex items-center gap-2 p-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary">
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name}</p>
              <p className="truncate text-[10px] text-muted-foreground">{user?.role}</p>
            </div>
          )}
          <button
            onClick={toggle}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => {
              signOut();
              navigate({ to: "/" });
            }}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
