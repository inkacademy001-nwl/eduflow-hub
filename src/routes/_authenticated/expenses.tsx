import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { canAccess } from "@/config/rolePermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import { Plus, Edit2, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { expenseApi, Expense } from "@/lib/expense-api";

export const Route = createFileRoute("/_authenticated/expenses")({
  component: ExpensesRoute,
});

const COLORS = ["#1E3A8A", "#2563EB", "#3B82F6", "#60A5FA", "#93C5FD", "#BFDBFE"];

function ExpensesRoute() {
  const { user } = useAuth();
  
  const [expensesList, setExpensesList] = useState<Expense[]>([]);
  const [dashboardData, setDashboardData] = useState<{
    currentMonthTotal: number;
    percentageChange: number;
    monthlyTrend: any[];
    categoryData: any[];
  }>({
    currentMonthTotal: 0,
    percentageChange: 0,
    monthlyTrend: [],
    categoryData: []
  });

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form states
  const [category, setCategory] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  // Salary specific states
  const [isNonTech, setIsNonTech] = useState(false);
  const [nonTechSalary, setNonTechSalary] = useState<string>("");
  const [fetchedFacultySalary, setFetchedFacultySalary] = useState<number>(0);

  const loadData = async () => {
    try {
      const [listRes, dashRes] = await Promise.all([
        expenseApi.getAllExpenses(),
        expenseApi.getDashboardData()
      ]);
      setExpensesList(listRes);
      setDashboardData(dashRes);
    } catch (err: any) {
      toast.error(err.message || "Failed to load expenses");
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Automatically fetch faculty salary when category is salary and date is selected
  useEffect(() => {
    const fetchSalary = async () => {
      if (category === "salary" && date) {
        try {
          const selectedDate = new Date(date);
          const month = selectedDate.getMonth() + 1;
          const year = selectedDate.getFullYear();
          const res = await expenseApi.getFacultySalaryTotal(month, year);
          setFetchedFacultySalary(res.total || 0);
        } catch (err) {
          toast.error("Failed to fetch default faculty salary");
          setFetchedFacultySalary(0);
        }
      } else {
        setFetchedFacultySalary(0);
      }
    };
    fetchSalary();
  }, [category, date]);

  if (!user || !canAccess(user.role, "expenses")) {
    return <Navigate to={user?.role === "Faculty" ? "/" : "/dashboard"} replace />;
  }

  // Calculate dynamic amount for salary category
  const calculatedSalaryAmount = useMemo(() => {
    let total = fetchedFacultySalary;
    if (isNonTech && nonTechSalary) total += Number(nonTechSalary);
    return total;
  }, [fetchedFacultySalary, isNonTech, nonTechSalary]);

  // Use calculated salary if category is salary, else use standard amount input
  const finalAmount = category === "salary" ? calculatedSalaryAmount : Number(amount);

  const resetForm = () => {
    setCategory("");
    setDate("");
    setDescription("");
    setAmount("");
    setIsNonTech(false);
    setNonTechSalary("");
    setFetchedFacultySalary(0);
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (expense: Expense) => {
    resetForm();
    setEditingId(expense.id);
    setCategory(expense.category);
    setDate(new Date(expense.date).toISOString().split('T')[0]);
    setDescription(expense.description || "");

    if (expense.category === "salary") {
      // For editing, we don't know the exact split, so we just put it in non-tech for manual override
      setIsNonTech(true);
      setNonTechSalary(expense.amount.toString());
    } else {
      setAmount(expense.amount.toString());
    }

    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this expense?")) {
      try {
        await expenseApi.deleteExpense(id);
        toast.success("Expense deleted");
        loadData();
      } catch (err: any) {
        toast.error(err.message || "Failed to delete expense");
      }
    }
  };

  const handleSave = async () => {
    if (!category || !date || (!finalAmount && finalAmount !== 0)) {
      toast.error("Please fill in required fields.");
      return;
    }

    try {
      const payload = {
        category,
        date,
        description,
        amount: finalAmount
      };

      if (editingId) {
        await expenseApi.updateExpense(editingId, payload);
        toast.success("Expense updated");
      } else {
        await expenseApi.createExpense(payload);
        toast.success("Expense added");
      }

      setIsModalOpen(false);
      resetForm();
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save expense");
    }
  };

  const handleDownloadCSV = async () => {
    try {
      const token = localStorage.getItem("erp_auth_token");
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + "/api/expenses/export", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `expenses-${new Date().toISOString().slice(0, 7)}.csv`;
      a.click();
    } catch (err) {
      toast.error("Failed to download CSV");
    }
  };

  return (
    <div className="flex flex-col space-y-6 p-6">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Finance</p>
          <h1 className="text-4xl font-semibold text-foreground mb-2">Expense Tracker</h1>
          <p className="text-muted-foreground">Log, categorise and analyse all academy expenditure.</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <Button onClick={handleOpenAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Expense
          </Button>
          <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Expense" : "Add New Expense"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salary">Salary</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="academic">Academic Expense</SelectItem>
                    <SelectItem value="infrastructure">Infrastructure</SelectItem>
                    <SelectItem value="miscellaneous">Miscellaneous</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {category === "salary" && (
                <div className="flex flex-col space-y-4 p-4 bg-muted/50 rounded-lg border">
                  {!date && (
                    <p className="text-xs text-amber-600 mb-2">Select a date below to automatically fetch the default faculty salary.</p>
                  )}
                  
                  {/* Automatic Faculty Salary Display */}
                  <div className="flex flex-col space-y-2">
                    <div className="flex justify-between items-center bg-white p-3 rounded border">
                      <Label className="font-medium text-muted-foreground">Faculty Salary (Auto-fetched):</Label>
                      <div className="font-semibold">₹{fetchedFacultySalary.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Non Tech Salary Checkbox & Input */}
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="non-tech-salary"
                        checked={isNonTech}
                        onCheckedChange={(c) => setIsNonTech(!!c)}
                      />
                      <Label htmlFor="non-tech-salary">Non-technical Staffs Salary</Label>
                    </div>
                    {isNonTech && (
                      <div className="ml-6">
                        <Input
                          placeholder="Enter non-technical salary amount"
                          type="number"
                          value={nonTechSalary}
                          onChange={(e) => setNonTechSalary(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Total Salary Calculation */}
                  <div className="mt-2 pt-3 border-t flex justify-between items-center">
                    <Label className="font-semibold text-primary">Total Salary Amount:</Label>
                    <div className="font-bold text-lg">₹{calculatedSalaryAmount.toLocaleString()}</div>
                  </div>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              {category !== "salary" && (
                <div className="grid gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleSave}>{editingId ? "Update Expense" : "Save Expense"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Expense Card */}
        <Card className="bg-primary text-primary-foreground shadow-md">
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-wider opacity-90">Current Month Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">₹{dashboardData.currentMonthTotal.toLocaleString()}</div>
            <p className="text-sm mt-2 opacity-90">
              {dashboardData.percentageChange > 0 ? "▲" : dashboardData.percentageChange < 0 ? "▼" : ""} 
              {Math.abs(dashboardData.percentageChange).toFixed(1)}% vs Last Month
            </p>
          </CardContent>
        </Card>

        {/* Monthly Trend Chart */}
        <Card className="md:col-span-2 shadow-sm border border-border">
          <CardHeader>
            <CardTitle className="text-xl font-medium">Monthly expense trend</CardTitle>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardData.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#6B7280' }}
                  tickFormatter={(value) => `${value / 1000}k`}
                />
                <RechartsTooltip cursor={{ fill: 'rgba(107, 114, 128, 0.15)' }} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="total" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Category Pie Chart */}
        <Card className="shadow-sm border border-border">
          <CardHeader>
            <CardTitle className="text-xl font-medium">By category</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {dashboardData.categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.categoryData}
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {dashboardData.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted-foreground text-sm">No expenses this month</div>
            )}
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="md:col-span-2 shadow-sm border border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-medium">All expenses</CardTitle>
            <Button variant="outline" size="sm" onClick={handleDownloadCSV}>
              <Download className="mr-2 h-4 w-4" /> Download Excel
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expensesList.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{new Date(expense.date).toISOString().split('T')[0]}</TableCell>
                      <TableCell className="capitalize">{expense.category}</TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>₹{expense.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => handleOpenEdit(expense)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(expense.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {expensesList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        No expenses found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
