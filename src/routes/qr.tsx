import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, RefreshCw, QrCode, CalendarDays, Clock } from "lucide-react";
import { toast } from "sonner";
import { attendanceApi, type ScanEntry } from "@/lib/attendance-api";

export const Route = createFileRoute("/qr")({
  component: QRDisplay,
});

const REFRESH_SECONDS = 15;

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

/** Normalize any Date to local midnight for reliable comparisons */
function toMidnight(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function QRDisplay() {
  const [now, setNow] = useState(() => Date.now());
  const [token, setToken] = useState<string>("LOADING...");
  const [tokenStart, setTokenStart] = useState(() => Date.now());

  const [scans, setScans] = useState<ScanEntry[]>([]);
  // Store holidays as ISO strings (YYYY-MM-DD) for reliable equality checks
  const [holidayIsos, setHolidayIsos] = useState<Set<string>>(new Set());

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [tokenKey, setTokenKey] = useState(0);

  // Derive Date[] from the ISO set — memoized so reference is stable between renders
  const holidayDates = useMemo<Date[]>(
    () => Array.from(holidayIsos).map(isoToLocalDate),
    [holidayIsos],
  );

  // Initial load
  useEffect(() => {
    loadScans();
    loadHolidays();
  }, []);

  const loadScans = async () => {
    try {
      const data = await attendanceApi.fetchRecentScans();
      setScans(data);
    } catch {
      // quiet fail
    }
  };

  const loadHolidays = async () => {
    try {
      const data = await attendanceApi.fetchHolidays();
      const isos = new Set(data.map((h: { date: string }) => h.date.split("T")[0]));
      setHolidayIsos(isos as Set<string>);
    } catch {
      // quiet fail
    }
  };

  // QR Token Generation Polling
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const res = await attendanceApi.fetchQrToken();
        setToken(res.token);
        setTokenStart(Date.now());
      } catch {
        toast.error("Failed to fetch QR token");
      }
    };

    fetchToken();
    const interval = setInterval(fetchToken, REFRESH_SECONDS * 1000);
    return () => clearInterval(interval);
  }, [tokenKey]);

  const handleRegenerateQR = () => {
    setToken("LOADING...");
    setTokenKey((k) => k + 1);
  };

  // Timer for progress bar
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(i);
  }, []);

  // Poll recent scans every 5 seconds
  useEffect(() => {
    const i = setInterval(loadScans, 5000);
    return () => clearInterval(i);
  }, []);

  const elapsed = Math.max(0, Math.floor((now - tokenStart) / 1000));
  const remaining = Math.max(0, REFRESH_SECONDS - elapsed);

  // -------------------------------------------------------------------
  // Holiday toggle — key fix: operate on ISO strings, not Date objects
  // -------------------------------------------------------------------
  const onSelectHoliday = useCallback(
    async (day: Date | undefined) => {
      if (!day) return;

      const midnight = toMidnight(day);
      const todayMidnight = localMidnightToday();

      if (midnight < todayMidnight) {
        toast.error("Holidays cannot be marked for past days");
        return;
      }

      const iso = dateToLocalIso(midnight);
      const isAdding = !holidayIsos.has(iso);

      // Optimistic update — operate on the ISO set directly
      setHolidayIsos((prev) => {
        const next = new Set(prev);
        if (isAdding) {
          next.add(iso);
        } else {
          next.delete(iso);
        }
        return next;
      });

      try {
        if (!isAdding) {
          await attendanceApi.removeHoliday({ date: iso });
          toast.success("Holiday removed");
        } else {
          await attendanceApi.setHoliday({ date: iso, reason: "Declared Holiday" });
          toast.success("Holiday declared");
        }
      } catch (err: any) {
        // Revert optimistic update on failure
        setHolidayIsos((prev) => {
          const next = new Set(prev);
          if (isAdding) {
            next.delete(iso);
          } else {
            next.add(iso);
          }
          return next;
        });
        toast.error(err.message || "Failed to update holiday");
      }
    },
    [holidayIsos],
  );

  // Stable disabled matcher — memoized to prevent Calendar from re-rendering on every tick
  const isDateDisabled = useCallback(
    (date: Date) => toMidnight(date) < localMidnightToday(),
    [],
  );

  // Stable selected matcher — checks ISO set directly, no Date equality issues
  const isDateSelected = useCallback(
    (date: Date) => holidayIsos.has(dateToLocalIso(toMidnight(date))),
    [holidayIsos],
  );

  const handleClearHolidays = () => {
    toast.info("Please tap individual dates to remove holidays.");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
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
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleRegenerateQR}
              >
                <RefreshCw className="mr-1.5 h-3 w-3" /> Regenerate
              </Button>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  remaining <= 5
                    ? "bg-destructive/10 text-destructive"
                    : "bg-accent text-accent-foreground",
                )}
              >
                {remaining}s
              </span>
            </div>
          </div>
          <div className="mt-6 flex flex-col items-center">
            <div className="rounded-xl border border-border bg-background p-4">
              {token === "LOADING..." ? (
                <div className="flex h-[220px] w-[220px] items-center justify-center border-2 border-dashed border-muted text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <QRCodeSVG value={token} size={220} level="M" />
              )}
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
          <div className="mt-4 max-h-[500px] space-y-2 overflow-y-auto pr-2">
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
          <div className="mt-6 flex w-full justify-center">
            {mounted ? (
              <Calendar
                modifiers={{ selected: isDateSelected }}
                modifiersClassNames={{
                  selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md font-semibold",
                }}
                onDayClick={(day, activeModifiers) => {
                  if (activeModifiers.disabled) return;
                  onSelectHoliday(day);
                }}
                disabled={isDateDisabled}
                className="pointer-events-auto rounded-xl border border-border p-4 shadow-sm"
              />
            ) : (
              <div className="h-[380px] w-[350px] animate-pulse rounded-xl border border-border bg-muted/20" />
            )}
          </div>
          <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Declared holiday
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-7"
              onClick={handleClearHolidays}
            >
              Clear all
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}