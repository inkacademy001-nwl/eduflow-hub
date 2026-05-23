import { createFileRoute, Link } from "@tanstack/react-router";
import { GraduationCap, QrCode, ArrowRight, Users, Calendar, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bright Minds Tuition — Modern ERP for Tuition Centers" },
      {
        name: "description",
        content:
          "Run your tuition center end-to-end: QR attendance, admissions, student profiles, faculty payroll.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">Bright Minds</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/qr">
              <Button variant="ghost" size="sm">
                <QrCode className="mr-2 h-4 w-4" /> Attendance QR
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Sign In</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="container mx-auto px-4 py-20 lg:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            Modern ERP for Tuition Centers
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Run your tuition center{" "}
            <span className="text-primary">smarter, not harder.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            QR-based faculty attendance, paperless admissions, student records, and payroll —
            all in one clean dashboard.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/auth">
              <Button size="lg" className="w-full sm:w-auto">
                Sign In / Sign Up <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/qr">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                <QrCode className="mr-2 h-4 w-4" /> Open Attendance QR
              </Button>
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-5xl gap-6 sm:grid-cols-3">
          {[
            {
              icon: QrCode,
              title: "Dynamic QR Attendance",
              desc: "Auto-refreshing tokens every 30 seconds. Faculty scan from any phone.",
            },
            {
              icon: Users,
              title: "Smart Admissions",
              desc: "Multi-step student & teacher onboarding with auto-generated IDs.",
            },
            {
              icon: Calendar,
              title: "Payroll & Heatmaps",
              desc: "Daily or hourly faculty pay, with LeetCode-style attendance streaks.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border bg-card">
        <div className="container mx-auto flex flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row">
          <span className="flex items-center gap-1">
            <Shield className="h-3.5 w-3.5" /> © {new Date().getFullYear()} Bright Minds Tuition
          </span>
          <span>Built for modern tuition centers.</span>
        </div>
      </footer>
    </div>
  );
}
