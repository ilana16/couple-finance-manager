import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, PieChart, Calendar, Download, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Reports() {
  const [dateRange, setDateRange] = useState("30");
  const [comparisonPeriod, setComparisonPeriod] = useState("previous");
  const [reportType, setReportType] = useState<"monthly" | "yearly" | "custom">("monthly");
  const [generating, setGenerating] = useState(false);

  const { data: transactions, isLoading } = trpc.transactions.list.useQuery();
  const { data: categories } = trpc.categories.list.useQuery();

  const generateReport = trpc.reports.generate.useMutation({
    onSuccess: (data) => {
      // Convert base64 to blob and download
      const byteCharacters = atob(data.pdf);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setGenerating(false);
      toast.success('Report generated successfully!');
    },
    onError: () => {
      setGenerating(false);
      toast.error('Failed to generate report');
    }
  });

  const handleGenerateReport = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    if (reportType === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (reportType === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
    } else {
      // Custom - last 30 days
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    setGenerating(true);
    generateReport.mutate({
      startDate,
      endDate,
      type: reportType
    });
  };

  // Process data for charts
  const processedData = transactions ? {
    // Spending trends by month
    spendingTrends: processSpendingTrends(transactions),
    // Category breakdown
    categoryBreakdown: processCategoryBreakdown(transactions, categories || []),
    // Income vs Expenses
    incomeVsExpenses: processIncomeVsExpenses(transactions),
    // Monthly comparison
    monthlyComparison: processMonthlyComparison(transactions),
  } : null;

  function processSpendingTrends(transactions: any[]) {
    const monthlyData: Record<string, { month: string; income: number; expenses: number; net: number }> = {};
    
    transactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthKey, income: 0, expenses: 0, net: 0 };
      }
      
      const amount = parseFloat(t.amount);
      if (t.type === 'income') {
        monthlyData[monthKey].income += amount;
      } else {
        monthlyData[monthKey].expenses += amount;
      }
      monthlyData[monthKey].net = monthlyData[monthKey].income - monthlyData[monthKey].expenses;
    });
    
    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }

  function processCategoryBreakdown(transactions: any[], categories: any[]) {
    const categoryTotals: Record<number, number> = {};
    
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const amount = parseFloat(t.amount);
      categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + amount;
    });
    
    return Object.entries(categoryTotals).map(([catId, total]) => {
      const category = categories.find(c => c.id === parseInt(catId));
      return {
        name: category?.name || 'Unknown',
        value: total,
      };
    }).sort((a, b) => b.value - a.value).slice(0, 8);
  }

  function processIncomeVsExpenses(transactions: any[]) {
    const last6Months: any[] = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getFullYear() === date.getFullYear() && tDate.getMonth() === date.getMonth();
      });
      
      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      last6Months.push({ month: monthName, income, expenses });
    }
    
    return last6Months;
  }

  function processMonthlyComparison(transactions: any[]) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const currentMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });
    
    const previousMonthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
    });
    
    const currentIncome = currentMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const currentExpenses = currentMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const previousIncome = previousMonthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const previousExpenses = previousMonthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return {
      current: { income: currentIncome, expenses: currentExpenses, net: currentIncome - currentExpenses },
      previous: { income: previousIncome, expenses: previousExpenses, net: previousIncome - previousExpenses },
      incomeChange: previousIncome > 0 ? ((currentIncome - previousIncome) / previousIncome) * 100 : 0,
      expensesChange: previousExpenses > 0 ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : 0,
    };
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-500 mt-1">Comprehensive financial insights and trends</p>
          </div>
          <div className="flex gap-3">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="custom">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleGenerateReport}
              disabled={generating}
              className="gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate PDF
                </>
              )}
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
          </div>
        ) : !processedData ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No data available for reports</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Monthly Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500">Current Month Income</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(processedData.monthlyComparison.current.income)}
                  </div>
                  <p className={`text-sm mt-1 ${processedData.monthlyComparison.incomeChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {processedData.monthlyComparison.incomeChange >= 0 ? '↑' : '↓'} {Math.abs(processedData.monthlyComparison.incomeChange).toFixed(1)}% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500">Current Month Expenses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(processedData.monthlyComparison.current.expenses)}
                  </div>
                  <p className={`text-sm mt-1 ${processedData.monthlyComparison.expensesChange <= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {processedData.monthlyComparison.expensesChange >= 0 ? '↑' : '↓'} {Math.abs(processedData.monthlyComparison.expensesChange).toFixed(1)}% from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-500">Net Savings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${processedData.monthlyComparison.current.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(processedData.monthlyComparison.current.net)}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Previous: {formatCurrency(processedData.monthlyComparison.previous.net)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Income vs Expenses Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <CardTitle>Income vs Expenses</CardTitle>
                </div>
                <CardDescription>Monthly comparison of income and expenses</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={processedData.incomeVsExpenses}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="income" fill="#10b981" name="Income" />
                    <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Spending Trends Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <CardTitle>Spending Trends</CardTitle>
                </div>
                <CardDescription>Track your financial trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={processedData.spendingTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} name="Income" />
                    <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                    <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} name="Net" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Breakdown Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-purple-600" />
                  <CardTitle>Spending by Category</CardTitle>
                </div>
                <CardDescription>Breakdown of expenses by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={processedData.categoryBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {processedData.categoryBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </RePieChart>
                  </ResponsiveContainer>
                  
                  <div className="space-y-2 min-w-[200px]">
                    {processedData.categoryBreakdown.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm text-gray-700">{item.name}</span>
                        </div>
                        <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
