import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Save, RefreshCw } from 'lucide-react';
import { useAuth } from '../lib/auth';

interface CategoryPrediction {
  category: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
  dayOfMonth?: number; // For monthly items: 1-31
  notes?: string;
}

interface Predictions {
  income: CategoryPrediction[];
  expenses: CategoryPrediction[];
  startDate: string;
  endDate: string;
}

export default function PredictionsPage() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Predictions>({
    income: [],
    expenses: [],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  // Load predictions from localStorage
  useEffect(() => {
    if (!user) return;
    const saved = localStorage.getItem(`predictions_${user.id}`);
    if (saved) {
      setPredictions(JSON.parse(saved));
    }
  }, [user]);

  // Save predictions to localStorage
  const savePredictions = () => {
    if (!user) return;
    localStorage.setItem(`predictions_${user.id}`, JSON.stringify(predictions));
    alert('Predictions saved successfully!');
  };

  // Add income category
  const addIncome = (category: CategoryPrediction) => {
    setPredictions({
      ...predictions,
      income: [...predictions.income, category],
    });
    setShowIncomeForm(false);
  };

  // Add expense category
  const addExpense = (category: CategoryPrediction) => {
    setPredictions({
      ...predictions,
      expenses: [...predictions.expenses, category],
    });
    setShowExpenseForm(false);
  };

  // Remove income category
  const removeIncome = (index: number) => {
    setPredictions({
      ...predictions,
      income: predictions.income.filter((_, i) => i !== index),
    });
  };

  // Remove expense category
  const removeExpense = (index: number) => {
    setPredictions({
      ...predictions,
      expenses: predictions.expenses.filter((_, i) => i !== index),
    });
  };

  // Calculate monthly equivalent
  const toMonthly = (amount: number, frequency: string) => {
    if (frequency === 'weekly') return amount * 4.33;
    if (frequency === 'monthly') return amount;
    if (frequency === 'yearly') return amount / 12;
    return amount;
  };

  // Calculate totals
  const totalMonthlyIncome = predictions.income.reduce(
    (sum, item) => sum + toMonthly(item.amount, item.frequency),
    0
  );
  const totalMonthlyExpenses = predictions.expenses.reduce(
    (sum, item) => sum + toMonthly(item.amount, item.frequency),
    0
  );
  const monthlyBalance = totalMonthlyIncome - totalMonthlyExpenses;

  // Calculate yearly projections
  const yearlyIncome = totalMonthlyIncome * 12;
  const yearlyExpenses = totalMonthlyExpenses * 12;
  const yearlyBalance = yearlyIncome - yearlyExpenses;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Financial Predictions</h1>
        <p className="text-gray-600 mt-2">
          Forecast your future income and expenses by category
        </p>
      </div>

      {/* Date Range */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-semibold">Prediction Period</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={predictions.startDate}
              onChange={(e) => setPredictions({ ...predictions, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={predictions.endDate}
              onChange={(e) => setPredictions({ ...predictions, endDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-green-800">Projected Income</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-900">₪{totalMonthlyIncome.toFixed(2)}</div>
          <div className="text-xs text-green-700 mt-1">per month</div>
          <div className="text-sm text-green-800 mt-2">₪{yearlyIncome.toFixed(2)} / year</div>
        </div>

        <div className="bg-red-50 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-red-800">Projected Expenses</h3>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-900">₪{totalMonthlyExpenses.toFixed(2)}</div>
          <div className="text-xs text-red-700 mt-1">per month</div>
          <div className="text-sm text-red-800 mt-2">₪{yearlyExpenses.toFixed(2)} / year</div>
        </div>

        <div className={`${monthlyBalance >= 0 ? 'bg-blue-50' : 'bg-orange-50'} rounded-lg shadow p-6`}>
          <div className="flex items-center justify-between mb-2">
            <h3 className={`text-sm font-medium ${monthlyBalance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
              Net Balance
            </h3>
            <DollarSign className={`w-5 h-5 ${monthlyBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
          </div>
          <div className={`text-2xl font-bold ${monthlyBalance >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
            ₪{Math.abs(monthlyBalance).toFixed(2)}
          </div>
          <div className={`text-xs ${monthlyBalance >= 0 ? 'text-blue-700' : 'text-orange-700'} mt-1`}>
            {monthlyBalance >= 0 ? 'surplus' : 'deficit'} per month
          </div>
          <div className={`text-sm ${monthlyBalance >= 0 ? 'text-blue-800' : 'text-orange-800'} mt-2`}>
            ₪{Math.abs(yearlyBalance).toFixed(2)} / year
          </div>
        </div>
      </div>

      {/* Income Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <h2 className="text-xl font-semibold">Income Categories</h2>
          </div>
          <button
            onClick={() => setShowIncomeForm(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            + Add Income
          </button>
        </div>

        {predictions.income.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No income categories yet. Click "Add Income" to start!
          </p>
        ) : (
          <div className="space-y-3">
            {predictions.income.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.category}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-gray-600">
                      ₪{item.amount.toFixed(2)} / {item.frequency}
                    </span>
                    <span className="text-sm text-green-700 font-medium">
                      ≈ ₪{toMonthly(item.amount, item.frequency).toFixed(2)} / month
                    </span>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => removeIncome(index)}
                  className="px-3 py-1 text-red-600 hover:bg-red-100 rounded"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Expense Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            <h2 className="text-xl font-semibold">Expense Categories</h2>
          </div>
          <button
            onClick={() => setShowExpenseForm(true)}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            + Add Expense
          </button>
        </div>

        {predictions.expenses.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No expense categories yet. Click "Add Expense" to start!
          </p>
        ) : (
          <div className="space-y-3">
            {predictions.expenses.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.category}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-gray-600">
                      ₪{item.amount.toFixed(2)} / {item.frequency}
                    </span>
                    <span className="text-sm text-red-700 font-medium">
                      ≈ ₪{toMonthly(item.amount, item.frequency).toFixed(2)} / month
                    </span>
                  </div>
                  {item.notes && (
                    <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => removeExpense(index)}
                  className="px-3 py-1 text-red-600 hover:bg-red-100 rounded"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-center gap-4">
        <button
          onClick={savePredictions}
          className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
        >
          <Save className="w-5 h-5" />
          Save Predictions
        </button>
        <button
          onClick={() => {
            if (confirm('Reset all predictions?')) {
              setPredictions({
                income: [],
                expenses: [],
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              });
            }
          }}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Reset
        </button>
      </div>

      {/* Income Form Modal */}
      {showIncomeForm && (
        <CategoryFormModal
          type="income"
          onClose={() => setShowIncomeForm(false)}
          onSubmit={addIncome}
        />
      )}

      {/* Expense Form Modal */}
      {showExpenseForm && (
        <CategoryFormModal
          type="expense"
          onClose={() => setShowExpenseForm(false)}
          onSubmit={addExpense}
        />
      )}
    </div>
  );
}

// Category Form Modal Component
function CategoryFormModal({
  type,
  onClose,
  onSubmit,
}: {
  type: 'income' | 'expense';
  onClose: () => void;
  onSubmit: (category: CategoryPrediction) => void;
}) {
  const [formData, setFormData] = useState<CategoryPrediction>({
    category: '',
    amount: 0,
    frequency: 'monthly',
    notes: '',
  });

  // Get categories from Settings
  const categories = type === 'income' 
    ? JSON.parse(localStorage.getItem('couple_fin_income_categories') || '[]')
    : JSON.parse(localStorage.getItem('couple_fin_expense_categories') || '[]');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">
          Add {type === 'income' ? 'Income' : 'Expense'} Category
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            >
              <option value="">Select a category...</option>
              {categories.map((cat: string) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Categories are managed in Settings → Categories
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₪)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {formData.frequency === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Day of Month
              </label>
              <select
                value={formData.dayOfMonth || 1}
                onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                When this {type} occurs each month
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={2}
              placeholder="Add any additional details..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className={`flex-1 px-4 py-2 text-white rounded-md ${
                type === 'income'
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              }`}
            >
              Add {type === 'income' ? 'Income' : 'Expense'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
