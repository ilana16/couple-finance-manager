import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { transactionStorage } from '../lib/storage';
import { BarChart3, PieChart, TrendingUp, Calendar } from 'lucide-react';

export default function ReportsPage() {
  const { user, viewMode } = useAuth();
  const [dateRange, setDateRange] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    loadReportData();
  }, [user, viewMode, dateRange, startDate, endDate]);

  const loadReportData = () => {
    if (!user) return;
    
    const includeJoint = viewMode === 'joint';
    const transactions = transactionStorage.getByUser(user.id, includeJoint);
    
    // Filter by date range
    const now = new Date();
    let filteredTransactions = transactions;
    
    if (dateRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredTransactions = transactions.filter(t => new Date(t.date) >= weekAgo);
    } else if (dateRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredTransactions = transactions.filter(t => new Date(t.date) >= monthAgo);
    } else if (dateRange === 'year') {
      const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      filteredTransactions = transactions.filter(t => new Date(t.date) >= yearAgo);
    } else if (dateRange === 'custom' && startDate && endDate) {
      filteredTransactions = transactions.filter(t => {
        const date = new Date(t.date);
        return date >= new Date(startDate) && date <= new Date(endDate);
      });
    }

    // Calculate category breakdown
    const categoryMap = new Map<string, { income: number; expense: number }>();
    filteredTransactions.forEach(t => {
      if (!categoryMap.has(t.category)) {
        categoryMap.set(t.category, { income: 0, expense: 0 });
      }
      const cat = categoryMap.get(t.category)!;
      const amt = t.amountInNIS || t.amount;
      if (t.type === 'income') {
        cat.income += amt;
      } else {
        cat.expense += amt;
      }
    });

    const categoryArray = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      income: data.income,
      expense: data.expense,
      net: data.income - data.expense,
    })).sort((a, b) => b.expense - a.expense);

    setCategoryData(categoryArray);

    // Calculate monthly trends
    const monthMap = new Map<string, { income: number; expense: number }>();
    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { income: 0, expense: 0 });
      }
      const month = monthMap.get(monthKey)!;
      const amt = t.amountInNIS || t.amount;
      if (t.type === 'income') {
        month.income += amt;
      } else {
        month.expense += amt;
      }
    });

    const monthArray = Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        income: data.income,
        expense: data.expense,
        net: data.income - data.expense,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    setMonthlyData(monthArray);
  };

  const totalIncome = categoryData.reduce((sum, c) => sum + c.income, 0);
  const totalExpense = categoryData.reduce((sum, c) => sum + c.expense, 0);
  const netAmount = totalIncome - totalExpense;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Financial Reports</h1>
        <p className="text-gray-600 mt-1">
          {viewMode === 'joint' ? 'All financial data' : 'Your financial data'}
        </p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setDateRange('week')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                dateRange === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last Week
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                dateRange === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => setDateRange('year')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                dateRange === 'year'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Last Year
            </button>
            <button
              onClick={() => setDateRange('custom')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                dateRange === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Custom
            </button>
          </div>

          {dateRange === 'custom' && (
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <p className="text-sm text-green-700 mb-1">Total Income</p>
          <p className="text-2xl font-bold text-green-900">₪{totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <p className="text-sm text-red-700 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-900">₪{totalExpense.toFixed(2)}</p>
        </div>
        <div className={`rounded-lg p-6 border ${netAmount >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <p className={`text-sm mb-1 ${netAmount >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net Amount</p>
          <p className={`text-2xl font-bold ${netAmount >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
            ₪{netAmount.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <PieChart className="w-5 h-5" />
            Spending by Category
          </h2>
        </div>
        <div className="p-6">
          {categoryData.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No data available for the selected period</p>
          ) : (
            <div className="space-y-4">
              {categoryData.map((cat) => {
                const maxExpense = Math.max(...categoryData.map(c => c.expense));
                const percentage = maxExpense > 0 ? (cat.expense / maxExpense) * 100 : 0;
                
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium text-gray-900">{cat.category}</span>
                      <span className="text-gray-600">₪{cat.expense.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trends */}
      {monthlyData.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Monthly Trends
            </h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Income</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Expenses</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {monthlyData.map((month) => (
                    <tr key={month.month} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(month.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-green-600 font-semibold">
                        ₪{month.income.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right text-red-600 font-semibold">
                        ₪{month.expense.toFixed(2)}
                      </td>
                      <td className={`px-6 py-4 text-sm text-right font-semibold ${
                        month.net >= 0 ? 'text-blue-600' : 'text-orange-600'
                      }`}>
                        {month.net >= 0 ? '+' : ''}₪{month.net.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
