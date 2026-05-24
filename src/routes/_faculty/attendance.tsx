import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { getHolidays } from "@/lib/mock-data";
import { Camera, CheckCircle2, XCircle, AlertTriangle, CircleDot, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_faculty/attendance")({
  component: AttendancePage,
});

type ScanState =
  | { status: "scanning" }
  | { status: "check-in" }
  | { status: "check-out" }
  | { status: "invalid" }
  | { status: "holiday" }
  | { status: "camera-denied" };

function AttendancePage() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const [scanState, setScanState] = useState<ScanState>({ status: "scanning" });
  const [jsQRModule, setJsQRModule] = useState<any>(null);

  // Dynamically load jsQR
  useEffect(() => {
    import("jsqr").then((mod) => setJsQRModule(() => mod.default));
  }, []);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanState({ status: "scanning" });
    } catch {
      setScanState({ status: "camera-denied" });
    }
  }, []);

  // Mock scan handler
  const handleQRData = useCallback(
    (data: string) => {
      // Check if valid QR (our tokens start with "BMT|")
      if (!data.startsWith("BMT|")) {
        setScanState({ status: "invalid" });
        return;
      }

      // Extract token timestamp
      const match = data.match(/t=(\d+)/);
      if (!match) {
        setScanState({ status: "invalid" });
        return;
      }
      const tokenTime = parseInt(match[1], 10);
      const now = Math.floor(Date.now() / 1000);
      // Token valid for 30s window
      if (Math.abs(now - tokenTime) > 60) {
        setScanState({ status: "invalid" });
        return;
      }

      // Check if today is a holiday
      const today = new Date();
      const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      if (getHolidays().includes(iso)) {
        setScanState({ status: "holiday" });
        return;
      }

      // Mock check-in / check-out toggle
      const lastScanKey = `faculty_last_scan_${user?.facultyId}`;
      const lastScan = localStorage.getItem(lastScanKey);
      if (lastScan === "in") {
        localStorage.setItem(lastScanKey, "out");
        setScanState({ status: "check-out" });
      } else {
        localStorage.setItem(lastScanKey, "in");
        setScanState({ status: "check-in" });
      }
    },
    [user?.facultyId],
  );

  // Scan loop
  useEffect(() => {
    if (scanState.status !== "scanning" || !jsQRModule) return;

    const scan = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        animFrameRef.current = requestAnimationFrame(scan);
        return;
      }
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Try native BarcodeDetector first
      if ("BarcodeDetector" in window) {
        const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
        detector
          .detect(canvas)
          .then((barcodes: any[]) => {
            if (barcodes.length > 0) {
              handleQRData(barcodes[0].rawValue);
              return;
            }
            animFrameRef.current = requestAnimationFrame(scan);
          })
          .catch(() => {
            animFrameRef.current = requestAnimationFrame(scan);
          });
      } else {
        // jsQR fallback
        const code = jsQRModule(imageData.data, imageData.width, imageData.height);
        if (code) {
          handleQRData(code.data);
        } else {
          animFrameRef.current = requestAnimationFrame(scan);
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(scan);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [scanState.status, jsQRModule, handleQRData]);

  // Start camera on mount
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  // Auto-reset after result
  useEffect(() => {
    if (scanState.status === "scanning" || scanState.status === "camera-denied") return;
    const timer = setTimeout(() => {
      setScanState({ status: "scanning" });
    }, 3000);
    return () => clearTimeout(timer);
  }, [scanState]);

  const resultConfig: Record<
    Exclude<ScanState["status"], "scanning" | "camera-denied">,
    { icon: typeof CheckCircle2; label: string; subtitle: string; color: string; bg: string }
  > = {
    "check-in": {
      icon: CheckCircle2,
      label: "Check-in Successful",
      subtitle: "Attendance Marked",
      color: "text-emerald-500",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    "check-out": {
      icon: CircleDot,
      label: "Check-out Successful",
      subtitle: "Attendance Marked",
      color: "text-red-500",
      bg: "bg-red-500/10 border-red-500/20",
    },
    invalid: {
      icon: XCircle,
      label: "Invalid or Expired QR Code",
      subtitle: "Please try again",
      color: "text-destructive",
      bg: "bg-destructive/10 border-destructive/20",
    },
    holiday: {
      icon: AlertTriangle,
      label: "Today is a Holiday",
      subtitle: "No attendance required",
      color: "text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
    },
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight">Attendance</h1>
        <p className="text-sm text-muted-foreground">Scan QR code to mark your attendance</p>
      </div>

      {scanState.status === "camera-denied" ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
            <Camera className="h-8 w-8 text-amber-500" />
          </div>
          <h2 className="mt-4 text-lg font-semibold">Camera Access Required</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
            Camera access is required to scan QR. Please allow camera permission in your browser settings.
          </p>
          <button
            onClick={startCamera}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <RotateCcw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      ) : (
        <div className="mx-auto max-w-sm">
          {/* Camera View */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-black shadow-sm">
            <video
              ref={videoRef}
              className="h-80 w-full object-cover"
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scan frame overlay */}
            {scanState.status === "scanning" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative h-48 w-48">
                  {/* Corner brackets */}
                  <span className="absolute left-0 top-0 h-6 w-6 border-l-[3px] border-t-[3px] border-primary rounded-tl" />
                  <span className="absolute right-0 top-0 h-6 w-6 border-r-[3px] border-t-[3px] border-primary rounded-tr" />
                  <span className="absolute bottom-0 left-0 h-6 w-6 border-b-[3px] border-l-[3px] border-primary rounded-bl" />
                  <span className="absolute bottom-0 right-0 h-6 w-6 border-b-[3px] border-r-[3px] border-primary rounded-br" />
                  {/* Scanning line animation */}
                  <span className="absolute left-2 right-2 top-1/2 h-0.5 -translate-y-1/2 animate-pulse bg-primary/60" />
                </div>
              </div>
            )}

            {/* Result overlay */}
            {scanState.status !== "scanning" && scanState.status !== "camera-denied" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                {(() => {
                  const cfg = resultConfig[scanState.status];
                  const Icon = cfg.icon;
                  return (
                    <div className={cn("rounded-2xl border px-8 py-6 text-center", cfg.bg)}>
                      <Icon className={cn("mx-auto h-14 w-14", cfg.color)} />
                      <p className={cn("mt-3 text-base font-semibold", cfg.color)}>
                        {cfg.label}
                      </p>
                      <p className="mt-1 text-sm font-medium text-white/70">
                        {cfg.subtitle}
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Instruction text */}
          <p className="mt-4 text-center text-sm text-muted-foreground">
            {scanState.status === "scanning"
              ? "Point your camera at the QR code to mark attendance"
              : "Resetting scanner..."}
          </p>
        </div>
      )}
    </div>
  );
}
