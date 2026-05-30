import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { canAccess } from "@/config/rolePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
  BarChart, Bar
} from "recharts";
import { Download, TrendingUp, TrendingDown, Eye, EyeOff, Settings, Loader2 } from "lucide-react";
import { revenueApi } from "@/lib/revenue-api";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/revenue")({
  component: RevenuePage,
});

function RevenuePage() {
  const { user } = useAuth();
  
  // Gatekeeper states
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  
  // Setup Wizard state
  const [setupStep, setSetupStep] = useState(1);
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");
  const [setupFund, setSetupFund] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  // Unlock state
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [lockedForgotStep, setLockedForgotStep] = useState<0 | 1 | 2>(0);

  // Dashboard Data
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  
  // UI states
  const [showAmounts, setShowAmounts] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("Nov");
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Settings states
  const [settingsTab, setSettingsTab] = useState<"menu" | "fund" | "password" | "forgot">("menu");
  const [settingsForgotStep, setSettingsForgotStep] = useState<1 | 2>(1);
  const [newFund, setNewFund] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  if (!user || !canAccess(user.role, "revenue")) {
    return <Navigate to={user?.role === "Faculty" ? "/" : "/dashboard"} replace />;
  }

  useEffect(() => {
    fetchSetupStatus();
  }, []);

  useEffect(() => {
    if (isUnlocked) {
      loadDashboardData();
    }
  }, [isUnlocked]);

  const fetchSetupStatus = async () => {
    try {
      const res = await revenueApi.getSetupStatus();
      setIsSetupComplete(res.isSetupComplete);
      setNewFund(res.academyFund?.toString() || "");
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to load revenue status");
    } finally {
      setLoadingInitial(false);
    }
  };

  const loadDashboardData = async () => {
    setDashboardLoading(true);
    try {
      const data = await revenueApi.getDashboardData();
      setDashboardData(data);
    } catch (err: any) {
      toast.error("Failed to load dashboard data");
    } finally {
      setDashboardLoading(false);
    }
  };

  // --- Handlers ---

  const handleSetup = async () => {
    if (setupStep === 1) {
      if (!setupPassword || setupPassword.length < 4) return toast.error("Password too short");
      if (setupPassword !== setupConfirm) return toast.error("Passwords do not match");
      setSetupStep(2);
      return;
    }

    setSetupLoading(true);
    try {
      await revenueApi.setupRevenue({
        password: setupPassword,
        academyFund: parseFloat(setupFund) || 0
      });
      toast.success("Setup complete!");
      setIsSetupComplete(true);
      setIsUnlocked(true); // Auto unlock
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Setup failed");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockLoading(true);
    try {
      await revenueApi.verifyPassword(unlockPassword);
      setIsUnlocked(true);
      setUnlockPassword("");
    } catch (err: any) {
      toast.error("Invalid password");
    } finally {
      setUnlockLoading(false);
    }
  };

  const handleLockedForgot = async () => {
    setActionLoading(true);
    try {
      await revenueApi.sendOtp();
      toast.success("OTP sent to your email");
      setLockedForgotStep(1);
    } catch (err: any) {
      toast.error("Failed to send OTP");
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return toast.error("Enter full OTP");
    setActionLoading(true);
    try {
      await revenueApi.verifyOtp(otpCode);
      toast.success("OTP verified!");
      if (settingsOpen) {
        setSettingsForgotStep(2);
      } else {
        setLockedForgotStep(2);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateFund = async () => {
    setActionLoading(true);
    try {
      await revenueApi.updateFund(parseFloat(newFund) || 0);
      toast.success("Fund updated");
      setSettingsTab("menu");
    } catch (err: any) {
      toast.error("Update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) return toast.error("Fill all fields");
    setActionLoading(true);
    try {
      await revenueApi.updatePassword({ oldPassword, newPassword });
      toast.success("Password updated");
      setOldPassword("");
      setNewPassword("");
      setSettingsTab("menu");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setActionLoading(true);
    try {
      await revenueApi.sendOtp();
      toast.success("OTP sent to your email");
      setSettingsTab("forgot");
      setSettingsForgotStep(1);
    } catch (err: any) {
      toast.error("Failed to send OTP");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otpCode || !newPassword) return toast.error("Fill all fields");
    setActionLoading(true);
    try {
      await revenueApi.resetPassword({ otpCode, newPassword });
      toast.success("Password reset successful!");
      setOtpCode("");
      setNewPassword("");
      setSettingsTab("menu");
      setLockedForgotStep(0);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Reset failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      const url = `${import.meta.env.VITE_API_BASE_URL || ""}/api/revenue/export`;
      const token = localStorage.getItem("erp_auth_token");
      
      const res = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `revenue_export.csv`;
      a.click();
      window.URL.revokeObjectURL(objectUrl);
      toast.success("Export ready");
    } catch (err: any) {
      toast.error("Failed to export");
    }
  };

  const formatCurrency = (val: number) => {
    if (!showAmounts) return "₹******";
    return `₹${val.toLocaleString('en-IN')}`;
  };

  // --- Renders ---

  if (loadingInitial) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  // GATEKEEPER: SETUP WIZARD
  if (!isSetupComplete) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <Card className="w-full max-w-md shadow-lg border-primary/20">
          <CardHeader className="text-center bg-primary/5 border-b">
            <CardTitle className="text-2xl font-bold text-primary">Revenue Setup</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {setupStep === 1 ? "Secure this module with a password." : "Set your initial academy fund."}
            </p>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {setupStep === 1 ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <Input type="password" value={setupPassword} onChange={e => setSetupPassword(e.target.value)} placeholder="Enter a secure password" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Confirm Password</label>
                  <Input type="password" value={setupConfirm} onChange={e => setSetupConfirm(e.target.value)} placeholder="Re-enter password" />
                </div>
                <Button className="w-full mt-4" onClick={handleSetup}>Continue</Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Academy Fund (Optional)</label>
                  <Input type="number" value={setupFund} onChange={e => setSetupFund(e.target.value)} placeholder="e.g. 500000" />
                </div>
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setSetupStep(1)} disabled={setupLoading}>Back</Button>
                  <Button className="flex-1" onClick={handleSetup} disabled={setupLoading}>
                    {setupLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Complete Setup"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // GATEKEEPER: UNLOCK
  if (!isUnlocked) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <CardTitle className="text-2xl font-bold">Revenue Locked</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">Enter your revenue password to continue.</p>
          </CardHeader>
          <CardContent className="p-6">
            {lockedForgotStep === 1 && (
              <div className="space-y-4 text-left">
                <p className="text-sm text-muted-foreground bg-primary/10 p-3 rounded-md">
                  An OTP has been sent to the Owner's registered email.
                </p>
                <div className="space-y-4 flex flex-col items-center">
                  <label className="text-sm font-medium w-full">Enter OTP Code</label>
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setLockedForgotStep(0)}>Back</Button>
                  <Button onClick={handleVerifyOtp} className="flex-1" disabled={actionLoading || otpCode.length !== 6}>
                    {actionLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Verify OTP"}
                  </Button>
                </div>
              </div>
            )}
            
            {lockedForgotStep === 2 && (
              <div className="space-y-4 text-left">
                <p className="text-sm text-muted-foreground">
                  OTP Verified. Please enter your new revenue password.
                </p>
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleResetPassword} className="w-full" disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Set New Password"}
                  </Button>
                </div>
              </div>
            )}
            
            {lockedForgotStep === 0 && (
              <form onSubmit={handleUnlock} className="space-y-4">
                <Input type="password" value={unlockPassword} onChange={e => setUnlockPassword(e.target.value)} placeholder="Password" autoFocus />
                <Button type="submit" className="w-full" disabled={unlockLoading}>
                  {unlockLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Unlock"}
                </Button>
                <div className="text-center mt-2">
                  <Button type="button" variant="link" className="text-xs text-muted-foreground" onClick={handleLockedForgot} disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                    Forgot Password?
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // MAIN DASHBOARD
  return (
    <div className="flex flex-col space-y-6 p-4 md:p-6 w-full min-w-0">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Analytics</p>
          <h1 className="text-2xl md:text-4xl font-semibold text-foreground mb-2">Revenue analyzer</h1>
          <p className="text-sm md:text-base text-muted-foreground">Track total revenue, profitability and class-level contribution.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full md:w-auto items-stretch sm:items-center gap-3 mt-2 md:mt-0">
          <Button variant="outline" size="sm" onClick={() => setShowAmounts(!showAmounts)} className="text-muted-foreground w-full sm:w-auto">
            {showAmounts ? <><EyeOff className="w-4 h-4 mr-2" /> Hide Amounts</> : <><Eye className="w-4 h-4 mr-2" /> Show Amounts</>}
          </Button>
          <div className="flex items-center justify-center space-x-2 bg-card p-1.5 rounded-lg border shadow-sm w-full sm:w-auto">
            <Button onClick={handleDownloadExcel} size="sm" variant="ghost" className="hover:bg-primary/10 hover:text-primary flex-1 sm:flex-none">
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button onClick={() => setSettingsOpen(true)} size="icon" variant="ghost">
              <Settings className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        </div>
      </div>

      {dashboardLoading || !dashboardData ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full min-w-0">
            <Card className="bg-primary text-primary-foreground shadow-md relative overflow-hidden group w-full min-w-0">
              <div className="absolute right-0 top-0 opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                <svg className="w-32 h-32 -mt-4 -mr-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              </div>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xs font-medium uppercase tracking-wider opacity-90">Total Revenue (YTD)</CardTitle>
                  <TrendingUp className="h-4 w-4 opacity-70" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl lg:text-4xl font-bold tracking-tight break-all">{formatCurrency(dashboardData.totalRevenue)}</div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border w-full min-w-0">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Expense (YTD)</CardTitle>
                  <TrendingDown className="h-4 w-4 text-destructive" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl lg:text-4xl font-bold tracking-tight break-all text-foreground">{formatCurrency(dashboardData.totalExpense)}</div>
              </CardContent>
            </Card>

            <Card className="shadow-sm border border-border w-full min-w-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Net Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl lg:text-4xl font-bold tracking-tight break-all text-foreground">{formatCurrency(dashboardData.netProfit)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Chart */}
          <Card className="shadow-sm border border-border w-full min-w-0 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-medium">Profit & loss — Trailing 12 months</CardTitle>
              <p className="text-sm text-muted-foreground">Revenue, expense and resulting profit</p>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dashboardData.trailingGraph} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(value) => `${value / 1000}k`} width={40} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} 
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, undefined]}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#2563EB" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="expense" name="Expense" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="profit" name="Profit" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Class Revenue Chart */}
          <Card className="shadow-sm border border-border w-full min-w-0 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-medium">Revenue by class</CardTitle>
            </CardHeader>
            <CardContent className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.classRevenueData} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis type="number" axisLine={true} tickLine={false} tick={{ fontSize: 10, fill: '#6B7280' }} tickFormatter={(value) => `${value / 1000}k`} />
                  <YAxis type="category" dataKey="name" axisLine={true} tickLine={false} tick={{ fontSize: 10, fill: '#374151' }} width={70} />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(107, 114, 128, 0.15)' }} 
                    contentStyle={{ borderRadius: '8px' }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="value" fill="#2563EB" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={(val) => { setSettingsOpen(val); if(!val) setSettingsTab("menu"); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Revenue Settings</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {settingsTab === "menu" && (
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => setSettingsTab("fund")}>Update Academy Fund</Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setSettingsTab("password")}>Change Password</Button>
                <Button variant="outline" className="w-full justify-start text-primary" onClick={handleSendOtp}>
                  {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Forgot Password?
                </Button>
              </div>
            )}

            {settingsTab === "fund" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Academy Fund</label>
                  <Input type="number" value={newFund} onChange={e => setNewFund(e.target.value)} placeholder="0" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSettingsTab("menu")} className="flex-1">Back</Button>
                  <Button onClick={handleUpdateFund} className="flex-1" disabled={actionLoading}>Save</Button>
                </div>
              </div>
            )}

            {settingsTab === "password" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Password</label>
                  <Input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setSettingsTab("menu")} className="flex-1">Back</Button>
                  <Button onClick={handleChangePassword} className="flex-1" disabled={actionLoading}>Update</Button>
                </div>
              </div>
            )}

            {settingsTab === "forgot" && (
              <div className="space-y-4">
                {settingsForgotStep === 1 && (
                  <>
                    <p className="text-sm text-muted-foreground bg-primary/10 p-3 rounded-md">
                      An OTP has been sent to the Owner's registered email.
                    </p>
                    <div className="space-y-4 flex flex-col items-center">
                      <label className="text-sm font-medium w-full text-left">Enter OTP Code</label>
                      <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" onClick={() => setSettingsTab("menu")} className="flex-1">Cancel</Button>
                      <Button onClick={handleVerifyOtp} className="flex-1" disabled={actionLoading || otpCode.length !== 6}>
                        {actionLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Verify OTP"}
                      </Button>
                    </div>
                  </>
                )}
                
                {settingsForgotStep === 2 && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      OTP Verified. Please enter your new revenue password.
                    </p>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">New Password</label>
                      <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleResetPassword} className="w-full" disabled={actionLoading}>
                        {actionLoading ? <Loader2 className="animate-spin w-4 h-4" /> : "Set New Password"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
