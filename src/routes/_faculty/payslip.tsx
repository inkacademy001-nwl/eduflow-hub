import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  getTeacherById,
  getFacultySalarySummary,
  attendanceSummary,
} from "@/lib/mock-data";
import { Download, FileText, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_faculty/payslip")({
  component: PayslipPage,
});

function PayslipPage() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const teacher = useMemo(
    () => (user?.facultyId ? getTeacherById(user.facultyId) : undefined),
    [user?.facultyId],
  );
  const salary = useMemo(
    () => (teacher ? getFacultySalarySummary(teacher) : null),
    [teacher],
  );
  const attendance = useMemo(
    () => (teacher ? attendanceSummary(teacher.id) : null),
    [teacher],
  );

  if (!teacher || !salary) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
          Unable to load payslip data.
        </div>
      </div>
    );
  }

  const now = new Date();
  const monthYear = now.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
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
      let y = 20;

      // Header
      doc.setFillColor(59, 91, 219); // primary blue
      doc.rect(0, 0, pw, 38, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("INK ACADEMY", pw / 2, 16, { align: "center" });
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Payslip - " + monthYear, pw / 2, 25, { align: "center" });
      doc.text("Tuition Center ERP", pw / 2, 31, { align: "center" });

      y = 48;

      // Faculty Info
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text("Employee Details", 15, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const info = [
        ["Name", teacher.fullName],
        ["Employee ID", teacher.id],
        ["Designation", teacher.designation],
        ["Pay Type", salary.payType === "daily" ? "Daily Rate" : "Hourly Rate"],
        ["Period", monthYear],
      ];

      for (const [label, value] of info) {
        doc.setTextColor(130, 130, 130);
        doc.text(label, 15, y);
        doc.setTextColor(40, 40, 40);
        doc.text(value, 75, y);
        y += 6;
      }

      y += 6;

      // Divider
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.3);
      doc.line(15, y, pw - 15, y);
      y += 8;

      // Salary Breakdown
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text("Salary Breakdown", 15, y);
      y += 8;

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");

      const rows: [string, string][] = [];

      if (salary.payType === "daily") {
        rows.push(
          ["Daily Rate", pdfFmt(salary.dailyRate ?? 0)],
          ["Working Days", String(salary.workingDays ?? 0)],
          ["Base Pay (Daily x Days)", pdfFmt((salary.dailyRate ?? 0) * (salary.workingDays ?? 0))],
        );
        if ((salary.hra ?? 0) > 0) rows.push(["HRA", pdfFmt(salary.hra ?? 0)]);
        rows.push(["Gross Pay (Basic Pay)", pdfFmt(salary.basicPay)]);
      } else {
        rows.push(
          ["Hourly Rate", pdfFmt(salary.hourlyRate ?? 0)],
          ["Total Hours Worked", String(salary.totalHours ?? 0)],
          ["Base Pay (Rate x Hours)", pdfFmt(salary.basicPay)],
        );
        if ((salary.overtimeRate ?? 0) > 0) {
          rows.push(["Overtime Rate", pdfFmt(salary.overtimeRate ?? 0) + "/hr"]);
        }
      }

      rows.push(
        ["Bonus", salary.bonus > 0 ? pdfFmt(salary.bonus) : "Rs. 0"],
        ["Deductions", salary.deductions > 0 ? `- ${pdfFmt(salary.deductions)}` : "Rs. 0"],
      );

      for (const [label, value] of rows) {
        doc.setTextColor(130, 130, 130);
        doc.text(label, 15, y);
        doc.setTextColor(40, 40, 40);
        doc.text(value, pw - 15, y, { align: "right" });
        y += 6;
      }

      y += 4;

      // Net Salary highlight
      doc.setFillColor(237, 242, 255);
      doc.roundedRect(15, y - 2, pw - 30, 14, 3, 3, "F");
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(59, 91, 219);
      doc.text("Net Salary (Final Pay)", 20, y + 7);
      doc.setFontSize(14);
      doc.text(pdfFmt(salary.netSalary), pw - 20, y + 7, { align: "right" });

      y += 22;

      // Attendance Summary
      doc.setDrawColor(220, 220, 220);
      doc.line(15, y, pw - 15, y);
      y += 8;

      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(60, 60, 60);
      doc.text("Attendance Summary", 15, y);
      y += 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      if (attendance) {
        const attRows: [string, string][] = [
          ["Days Present", String(attendance.present)],
          ["Days Absent", String(attendance.absent)],
          ["Days Late", String(attendance.late)],
        ];

        if (salary.payType === "hourly") {
          attRows.push(["Total Hours Logged", String(salary.totalHours ?? 0)]);
        }

        for (const [label, value] of attRows) {
          doc.setTextColor(130, 130, 130);
          doc.text(label, 15, y);
          doc.setTextColor(40, 40, 40);
          doc.text(value, pw - 15, y, { align: "right" });
          y += 6;
        }
      }

      y += 10;

      // Footer
      doc.setDrawColor(220, 220, 220);
      doc.line(15, y, pw - 15, y);
      y += 6;
      doc.setFontSize(8);
      doc.setTextColor(170, 170, 170);
      doc.text(
        "This is a system-generated payslip from INK Academy ERP. No signature required.",
        pw / 2,
        y,
        { align: "center" },
      );
      doc.text(
        `Generated on ${now.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}`,
        pw / 2,
        y + 5,
        { align: "center" },
      );

      // Download
      const fileName = `Payslip_${teacher.fullName.replace(/\s+/g, "_")}_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}.pdf`;
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
        {/* Preview card */}
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
              value={salary.payType === "daily" ? "Daily Rate" : "Hourly Rate"}
            />
            <SummaryRow label="Basic Pay" value={fmt(salary.basicPay)} />
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
                {fmt(salary.netSalary)}
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
