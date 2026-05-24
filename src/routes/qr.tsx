import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getHolidays,
  setHolidays,
  getScans,
  pushScan,
  getTeachers,
  type ScanEntry,
} from "@/lib/mock-data";
import { ArrowLeft, RefreshCw, QrCode, CalendarDays, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/qr")({
  component: QRDisplay,
});

const REFRESH_SECONDS = 30;

/** Convert YYYY-MM-DD string → local-midnight Date (avoids UTC shift in IST) */
function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Convert Date → YYYY-MM-DD using local time parts (no toISOString timezone shift) */
function dateToLocalIso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** Today at local midnight */
function localMidnightToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function QRDisplay() {
  const [now, setNow] = useState(() => Date.now());
  const [tokenStart, setTokenStart] = useState(() =>
    Math.floor(Date.now() / 1000 / REFRESH_SECONDS) * REFRESH_SECONDS,
  );
  const [scans, setScans] = useState<ScanEntry[]>([]);
  const [holidays, setHolidayState] = useState<Date[]>([]);

  useEffect(() => {
    setScans(getScans());
    setHolidayState(getHolidays().map(isoToLocalDate));
  }, []);

  useEffect(() => {
    const i = setInterval(() => {
      const n = Date.now();
      setNow(n);
      const ts = Math.floor(n / 1000 / REFRESH_SECONDS) * REFRESH_SECONDS;
      setTokenStart((prev) => (ts !== prev ? ts : prev));
    }, 1000);
    return () => clearInterval(i);
  }, []);

  // Simulate incoming scans every ~12s
  useEffect(() => {
    const teachers = getTeachers();
    if (!teachers.length) return;
    const i = setInterval(() => {
      const t = teachers[Math.floor(Math.random() * teachers.length)];
      const entry: ScanEntry = {
        id: `${Date.now()}`,
        facultyName: t.fullName,
        type: Math.random() > 0.5 ? "Check-In" : "Check-Out",
        timestamp: new Date().toISOString(),
      };
      pushScan(entry);
      setScans(getScans());
    }, 12000);
    return () => clearInterval(i);
  }, []);

  const elapsed = Math.floor(now / 1000) - tokenStart;
  const remaining = Math.max(0, REFRESH_SECONDS - elapsed);
  const token = useMemo(
    () =>
      `BMT|t=${tokenStart}|h=${btoa(String(tokenStart * 9973)).slice(0, 10)}`,
    [tokenStart],
  );

  const onSelectHoliday = (date?: Date) => {
    if (!date) return;
    // Block past dates
    if (date < localMidnightToday()) {
      toast.error("Holidays cannot be marked for past days");
      return;
    }
    const iso = dateToLocalIso(date);
    const existing = new Set(getHolidays());
    if (existing.has(iso)) existing.delete(iso);
    else existing.add(iso);
    const next = Array.from(existing);
    setHolidays(next);
    setHolidayState(next.map(isoToLocalDate));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Back
          </Link>
          <div className="flex items-center gap-2 text-sm font-medium">
            <QrCode className="h-4 w-4 text-primary" /> Attendance Station
          </div>
        </div>
      </header>

      <main className="container mx-auto grid gap-6 px-4 py-8 lg:grid-cols-3">
        {/* QR */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Scan to mark attendance</h2>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                remaining <= 5
                  ? "bg-destructive/10 text-destructive"
                  : "bg-accent text-accent-foreground",
              )}
            >
              <RefreshCw className="mr-1 h-3 w-3" /> {remaining}s
            </span>
          </div>
          <div className="mt-6 flex flex-col items-center">
            <div className="rounded-xl border border-border bg-background p-4">
              <QRCodeSVG value={token} size={220} level="M" />
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Code auto-refreshes every {REFRESH_SECONDS} seconds.
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(remaining / REFRESH_SECONDS) * 100}%` }}
              />
            </div>
          </div>
        </section>

        {/* Recent scans */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Recently scanned</h2>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-4 space-y-2">
            {scans.length === 0 && (
              <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Waiting for scans...
              </p>
            )}
            {scans.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-primary">
                    {s.facultyName
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.facultyName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium",
                    s.type === "Check-In"
                      ? "bg-success/15 text-[oklch(0.45_0.15_150)]"
                      : "bg-info/15 text-[oklch(0.45_0.15_230)]",
                  )}
                >
                  {s.type}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Calendar */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:col-span-1">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Tuition leave calendar</h2>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Tap a date to toggle it as a declared holiday.
          </p>
          <div className="mt-4 flex justify-center">
            <Calendar
              mode="multiple"
              selected={holidays}
              onSelect={(dates) => {
                // Use local ISO to avoid timezone shift when diffing
                const prev = new Set(holidays.map(dateToLocalIso));
                const next = new Set((dates ?? []).map(dateToLocalIso));
                const added = [...next].find((x) => !prev.has(x));
                const removed = [...prev].find((x) => !next.has(x));
                onSelectHoliday(
                  added ? isoToLocalDate(added)
                  : removed ? isoToLocalDate(removed)
                  : undefined
                );
              }}
              disabled={(date) => date < localMidnightToday()}
              className="pointer-events-auto rounded-md border border-border p-3"
            />
          </div>
          <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Declared holiday
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7"
              onClick={() => {
                setHolidays([]);
                setHolidayState([]);
              }}
            >
              Clear all
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
