import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { facultyApi, Teacher, FacultyDashboardData } from "@/lib/faculty-api";
import { Download, FileText, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_faculty/payslip")({
  component: PayslipPage,
});

function PayslipPage() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [dashboard, setDashboard] = useState<FacultyDashboardData | null>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.facultyId) {
      const now = new Date();
      const targetDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      setLoading(true);
      Promise.all([
        facultyApi.fetchFacultyById(user.facultyId),
        facultyApi.fetchFacultyDashboard(user.facultyId, targetDate.getMonth() + 1, targetDate.getFullYear())
      ])
        .then(([t, d]) => {
          setTeacher(t);
          setDashboard(d);
          setLoading(false);
        })
        .catch((e) => {
          console.error(e);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user?.facultyId, offset]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Loading payslip data...
        </div>
      </div>
    );
  }

  const salary = dashboard?.salary;
  const attendance = dashboard?.attendanceStats;

  if (!teacher || !salary) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Unable to load payslip data.
        </div>
      </div>
    );
  }

  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + offset);

  const monthYear = targetDate.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  // PDF-safe format: jsPDF default fonts don't have the ₹ glyph
  const pdfFmt = (n: number) => `Rs. ${n.toLocaleString("en-IN")}`;

  const onDownload = async () => {
    setDownloading(true);
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pw = doc.internal.pageSize.getWidth();
      const ph = doc.internal.pageSize.getHeight();

      // Top header band
      doc.setFillColor(59, 91, 219); // Primary blue
      doc.rect(0, 0, pw, 5, "F");

      // Company Info (Left)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(40, 40, 40);
      doc.text("INK ACADEMY", 15, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Tuition Center", 15, 26);
      doc.text("Vivekananda Nagar, Nesapakkam, Chennai, Tamil Nadu 600078, India", 15, 31);

      // Payslip Title (Right)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(59, 91, 219);
      doc.text("PAYSLIP", pw - 15, 20, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Period: ${monthYear}`, pw - 15, 26, { align: "right" });

      let y = 40;

      // Divider
      doc.setDrawColor(200, 200, 200);
      doc.line(15, y, pw - 15, y);
      y += 8;

      // Employee Info Grid
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text("EMPLOYEE DETAILS", 15, y);

      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const leftInfo = [
        ["Name", ": " + teacher.fullName],
        ["Employee ID", ": " + teacher.id],
        ["Designation", ": " + teacher.designation],
      ];

      const rightInfo = [
        ["Date of Joining", ": " + (teacher.joiningDate || "N/A")],
        ["Pay Type", ": " + (teacher.salaryType === "daily" ? "Daily Rate" : "Hourly Rate")],
        ["Days Present", ": " + (attendance?.present ?? 0)],
      ];

      let leftY = y;
      for (const [lbl, val] of leftInfo) {
        doc.setTextColor(120, 120, 120);
        doc.text(lbl, 15, leftY);
        doc.setTextColor(40, 40, 40);
        doc.text(val, 45, leftY);
        leftY += 6;
      }

      let rightY = y;
      for (const [lbl, val] of rightInfo) {
        doc.setTextColor(120, 120, 120);
        doc.text(lbl, pw / 2 + 10, rightY);
        doc.setTextColor(40, 40, 40);
        doc.text(val, pw / 2 + 45, rightY);
        rightY += 6;
      }

      y = Math.max(leftY, rightY) + 6;

      // Salary Table Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text("SALARY BREAKDOWN", 15, y);
      y += 6;

      const tableStartY = y;

      // Table Header Background
      doc.setFillColor(245, 247, 255);
      doc.rect(15, y, pw - 30, 8, "F");

      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      doc.text("EARNINGS", 20, y + 5);
      doc.text("AMOUNT", pw / 2 - 10, y + 5, { align: "right" });

      doc.text("DEDUCTIONS", pw / 2 + 10, y + 5);
      doc.text("AMOUNT", pw - 20, y + 5, { align: "right" });

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(15, y, pw - 15, y); // Top border
      doc.line(15, y + 8, pw - 15, y + 8); // Header bottom border

      y += 14;

      doc.setFont("helvetica", "normal");
      doc.setTextColor(40, 40, 40);

      const earnings = [];
      const deductions = [];

      if (teacher.salaryType === "daily") {
        const workingDays = (attendance?.present || 0) + (attendance?.late || 0);
        const dailyRate = Math.round((salary.basicPay || 0) / Math.max(1, workingDays));
        earnings.push(["Basic Pay", pdfFmt(salary.basicPay || 0)]);
        earnings.push([`Daily Rate (x${workingDays} days)`, pdfFmt(dailyRate)]);
      } else {
        earnings.push(["Basic Pay", pdfFmt(salary.basicPay || 0)]);
        earnings.push([`Hourly Rate (x${salary.totalHours || 0} hrs)`, pdfFmt(salary.hourlyRate || 0)]);
      }

      if ((salary.bonus || 0) > 0) {
        earnings.push(["Bonus / Arrears", pdfFmt(salary.bonus)]);
      }

      if ((salary.deductions || 0) > 0) {
        deductions.push(["Provident Fund / TDS", pdfFmt(salary.deductions)]);
      } else {
        deductions.push(["Total Deductions", "Rs. 0"]);
      }

      let eY = y;
      let totalEarnings = (salary.basicPay || 0) + (salary.bonus || 0);
      for (const [lbl, val] of earnings) {
        doc.text(lbl, 20, eY);
        doc.text(val, pw / 2 - 10, eY, { align: "right" });
        eY += 6;
      }

      let dY = y;
      let totalDeductions = salary.deductions || 0;
      for (const [lbl, val] of deductions) {
        doc.text(lbl, pw / 2 + 10, dY);
        doc.text(val, pw - 20, dY, { align: "right" });
        dY += 6;
      }

      y = Math.max(eY, dY) + 6;

      // Table Borders
      doc.line(15, tableStartY, 15, y + 10); // Left border
      doc.line(pw / 2, tableStartY, pw / 2, y + 10); // Center border
      doc.line(pw - 15, tableStartY, pw - 15, y + 10); // Right border

      // Subtotal Line
      doc.line(15, y, pw - 15, y);

      y += 6;
      doc.setFont("helvetica", "bold");
      doc.text("Total Earnings", 20, y);
      doc.text(pdfFmt(totalEarnings), pw / 2 - 10, y, { align: "right" });

      doc.text("Total Deductions", pw / 2 + 10, y);
      doc.text(pdfFmt(totalDeductions), pw - 20, y, { align: "right" });

      y += 4;
      doc.line(15, y, pw - 15, y); // Bottom border

      y += 10;

      // Net Pay highlight
      doc.setFillColor(59, 91, 219);
      doc.roundedRect(pw / 2, y, pw / 2 - 15, 12, 2, 2, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.text("NET PAY:", pw / 2 + 5, y + 8);
      doc.setFontSize(14);
      doc.text(pdfFmt(salary.finalSalary || 0), pw - 20, y + 8, { align: "right" });

      // Net Pay in words (mock)
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");


      // Footer
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");

      doc.text("This is a computer generated document, no signature required.", pw / 2, ph - 20, { align: "center" });
      doc.text(`Generated on ${targetDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}`, pw / 2, ph - 16, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.text("Powered by NeuralWeb Labs", pw / 2, ph - 10, { align: "center" });

      // Download
      const fileName = `Payslip_${teacher.fullName.replace(/\s+/g, "_")}_${targetDate.getFullYear()}_${String(targetDate.getMonth() + 1).padStart(2, "0")}.pdf`;
      doc.save(fileName);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight">Download Payslip</h1>
        <p className="text-sm text-muted-foreground">
          Generate and download your payslip as PDF
        </p>
      </div>

      <div className="mx-auto max-w-sm">
        {/* Month Navigation */}
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-border bg-card p-3 shadow-sm">
          <button
            onClick={() => setOffset((o) => o - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold">
            {targetDate.toLocaleDateString("en-IN", {
              month: "long",
              year: "numeric",
              timeZone: "Asia/Kolkata",
            })}
          </span>
          <button
            onClick={() => setOffset((o) => Math.min(0, o + 1))}
            disabled={offset >= 0}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground disabled:opacity-25"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Preview card */}
        {dashboard.salary?.isFinalized ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {/* Top accent */}
            <div className="bg-gradient-to-r from-primary to-primary/80 px-5 py-4 text-primary-foreground">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">INK ACADEMY</p>
                  <p className="text-xs opacity-80">Payslip — {monthYear}</p>
                </div>
              </div>
            </div>

            {/* Quick summary */}
            <div className="divide-y divide-border px-5">
              <SummaryRow label="Employee" value={teacher.fullName} />
              <SummaryRow label="ID" value={teacher.id} />
              <SummaryRow
                label="Pay Type"
                value={teacher.salaryType === "daily" ? "Daily Rate" : "Hourly Rate"}
              />
              <SummaryRow label="Basic Pay" value={fmt(salary.basicPay || 0)} />
              <SummaryRow label="Bonus" value={salary.bonus > 0 ? fmt(salary.bonus) : "₹0"} />
              <SummaryRow
                label="Deductions"
                value={salary.deductions > 0 ? fmt(salary.deductions) : "₹0"}
              />
            </div>

            {/* Net salary */}
            <div className="mx-5 my-4 rounded-xl border-2 border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary">Net Salary</span>
                <span className="text-xl font-extrabold text-primary">
                  {fmt(salary.finalSalary || 0)}
                </span>
              </div>
            </div>

            {/* Attendance */}
            {attendance && (
              <div className="mx-5 mb-4 rounded-xl bg-accent/50 p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Attendance
                </p>
                <div className="flex gap-3 text-center text-xs">
                  <div className="flex-1 rounded-lg bg-emerald-500/10 px-2 py-1.5">
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {attendance.present}
                    </p>
                    <p className="text-muted-foreground">Present</p>
                  </div>
                  <div className="flex-1 rounded-lg bg-red-500/10 px-2 py-1.5">
                    <p className="text-sm font-bold text-red-600 dark:text-red-400">
                      {attendance.absent}
                    </p>
                    <p className="text-muted-foreground">Absent</p>
                  </div>
                  <div className="flex-1 rounded-lg bg-amber-500/10 px-2 py-1.5">
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      {attendance.late}
                    </p>
                    <p className="text-muted-foreground">Late</p>
                  </div>
                </div>
              </div>
            )}

            {/* Download button */}
            <div className="p-5 pt-0">
              <button
                onClick={onDownload}
                disabled={downloading}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold transition",
                  downloaded
                    ? "bg-emerald-500 text-white"
                    : "bg-primary text-primary-foreground hover:opacity-90",
                  downloading && "cursor-not-allowed opacity-60",
                )}
              >
                {downloading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                    Generating…
                  </>
                ) : downloaded ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Downloaded!
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Download Payslip
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-sm">
            <p className="text-sm font-medium text-muted-foreground">
              Payslip for this month is not available.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              The salary details have not been finalized yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
