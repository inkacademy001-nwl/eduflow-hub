import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Wallet, Users, GraduationCap, Eye, EyeOff, QrCode, Power, Loader2 } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { useAuth } from "@/lib/auth";
import { ownerDashboardApi, OwnerDashboardResponse } from "@/lib/owner-dashboard-api";

interface OwnerDashboardProps {
  sessionActive: boolean;
  isLoadingSession: boolean;
  toggleSession: () => void;
}

export function OwnerDashboard({ sessionActive, isLoadingSession, toggleSession }: OwnerDashboardProps) {
  const [isMetricsVisible, setIsMetricsVisible] = useState(false);
  const [isChartsVisible, setIsChartsVisible] = useState(false);
  const { user } = useAuth();

  const [data, setData] = useState<OwnerDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.token) {
      ownerDashboardApi.getOwnerDashboardData(user.token)
        .then(res => {
          setData(res);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch dashboard data:", err);
          setIsLoading(false);
        });
    }
  }, [user?.token]);

  if (isLoading || !data) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const { overview, admissionData, financialData, classPerformanceData } = data;

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);


  return (
    <div className="space-y-6">
      {/* 1. Start Attendance Section */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <QrCode className="h-5 w-5 text-primary" />
            QR Attendance Session
          </h2>
          <p className="text-sm text-muted-foreground">
            Control the active state of the QR attendance system.
            Status: {isLoadingSession ? "Loading..." : (sessionActive ? <span className="font-semibold text-green-600">Active</span> : <span className="font-semibold text-destructive">Inactive</span>)}
          </p>
        </div>
        <Button
          variant={sessionActive ? "destructive" : "default"}
          onClick={toggleSession}
          disabled={isLoadingSession}
          className="w-full sm:w-auto"
        >
          <Power className="mr-2 h-4 w-4" />
          {sessionActive ? "End Session" : "Start Attendance Session"}
        </Button>
      </div>

      {/* Header section (Not Blurred) */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-blue-950 dark:text-blue-100">Overview</h1>
      </div>

      {/* 2. Glass UI Wrapper for Top Row Metrics */}
      <div className="relative rounded-2xl overflow-hidden transition-all duration-500 border border-transparent">
        {!isMetricsVisible && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-md rounded-2xl">
            <Button
              size="lg"
              variant="outline"
              className="gap-2 rounded-full shadow-lg border-primary/20 bg-background/80 hover:bg-background"
              onClick={() => setIsMetricsVisible(true)}
            >
              <Eye className="h-5 w-5 text-primary" />
              <span>Reveal Overview Metrics</span>
            </Button>
          </div>
        )}
        <div className={`transition-all duration-500 ${!isMetricsVisible ? "opacity-40 select-none pointer-events-none blur-sm" : ""}`}>
          <div className="mb-2 flex justify-end">
            {isMetricsVisible && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => setIsMetricsVisible(false)}
              >
                <EyeOff className="h-4 w-4" />
                Hide Metrics
              </Button>
            )}
          </div>
          {/* Top Row Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-blue-600 text-white border-blue-500 shadow-sm relative overflow-hidden">
              <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
                <TrendingUp className="w-24 h-24" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium tracking-wide uppercase text-blue-100">Total Revenue</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatCurrency(overview.totalRevenue)}</div>
                <p className="text-xs text-blue-200 mt-1">
                  {/* Optional: Add percentage change logic here later */}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-blue-100 dark:border-slate-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium tracking-wide uppercase text-slate-500 dark:text-slate-400">Net Profit</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-slate-800 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{formatCurrency(overview.netProfit)}</div>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1 font-medium">
                  {/* Optional: Add percentage change logic here later */}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-blue-100 dark:border-slate-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium tracking-wide uppercase text-slate-500 dark:text-slate-400">Active Students</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-slate-800 flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{overview.activeStudents}</div>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1 font-medium">
                  {/* Optional: Add new this month logic here later */}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-slate-900 border-blue-100 dark:border-slate-800 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium tracking-wide uppercase text-slate-500 dark:text-slate-400">Faculty Strength</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-slate-800 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">{overview.facultyStrength}</div>
                <p className="text-xs text-green-600 dark:text-green-500 mt-1 font-medium">
                  {/* Optional: Add new this month logic here later */}
                </p>
              </CardContent>
            </Card>
          </div>

        </div> {/* End of Top Metrics blur wrapper */}
      </div> {/* End of Top Metrics relative container */}

      {/* 3. Glass UI Wrapper for Charts & Performance */}
      <div className="relative rounded-2xl overflow-hidden transition-all duration-500 border border-transparent mt-2">
        {!isChartsVisible && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/50 backdrop-blur-md rounded-2xl">
            <Button
              size="lg"
              variant="outline"
              className="gap-2 rounded-full shadow-lg border-primary/20 bg-background/80 hover:bg-background"
              onClick={() => setIsChartsVisible(true)}
            >
              <Eye className="h-5 w-5 text-primary" />
              <span>Reveal Detailed Charts</span>
            </Button>
          </div>
        )}
        <div className={`space-y-6 transition-all duration-500 ${!isChartsVisible ? "opacity-40 select-none pointer-events-none blur-sm" : ""}`}>
          <div className="mb-2 flex justify-end">
            {isChartsVisible && (
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => setIsChartsVisible(false)}
              >
                <EyeOff className="h-4 w-4" />
                Hide Charts
              </Button>
            )}
          </div>
          {/* Middle Row Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="col-span-1 bg-white dark:bg-slate-900 shadow-sm border-blue-100 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">Student Admissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={admissionData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12 }}
                      />
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--card, #fff)', color: 'var(--card-foreground, #000)' }}
                        itemStyle={{ color: 'var(--card-foreground, #000)' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="admissions"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2, fill: '#ffffff', stroke: '#2563eb' }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#1d4ed8' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-1 bg-white dark:bg-slate-900 shadow-sm border-blue-100 dark:border-slate-800">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">Financial Distribution</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center">
                <div className="h-[300px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={financialData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {financialData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value)}
                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--card, #fff)', color: 'var(--card-foreground, #000)' }}
                        itemStyle={{ color: 'var(--card-foreground, #000)' }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-sm text-slate-600 dark:text-slate-400">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center text for Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Total Revenue</span>
                    <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{formatCurrency(overview.totalRevenue)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row - Class Performance */}
          <Card className="bg-white dark:bg-slate-900 shadow-sm border-blue-100 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100">Top performing classes</CardTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400">Ranked by net contribution</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {classPerformanceData.map((cls) => (
                  <div key={cls.rank} className="flex items-center gap-4 bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 p-3 rounded-xl shadow-sm">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold flex items-center justify-center text-sm">
                      {cls.rank}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{cls.name}</span>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(cls.contribution)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${cls.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div> {/* End of blur wrapper */}
      </div> {/* End of relative container */}
    </div>
  );
}
