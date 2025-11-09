import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Save, RefreshCw, Download } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { predictionsStorage, PredictionItem } from '../lib/predictions-storage';
import { categoriesStorage } from '../lib/categories-storage';

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
  const [viewMode, setViewMode] = useState<'individual' | 'joint'>('joint');
  const [predictions, setPredictions] = useState<Predictions>({
    income: [],
    expenses: [],
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load predictions from Firestore
  useEffect(() => {
    loadPredictions();
  }, [user, viewMode]);

  const loadPredictions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userId = viewMode === 'joint' ? 'joint' : user.id;
      const data = await predictionsStorage.getByUserId(userId);
      
      if (data) {
        setPredictions({
          income: data.income,
          expenses: data.expense,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
      } else {
        // Initialize empty predictions
        setPredictions({
          income: [],
          expenses: [],
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        });
      }
    } catch (error) {
      console.error('Error loading predictions:', error);
      alert('Failed to load predictions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Save predictions to Firestore
  const savePredictions = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const userId = viewMode === 'joint' ? 'joint' : user.id;
      await predictionsStorage.savePredictions(userId, predictions.income, predictions.expenses);
      
      if (viewMode === 'joint') {
        alert('Joint predictions saved successfully! Both partners can see these changes.');
      } else {
        alert('Predictions saved successfully!');
      }
    } catch (error) {
      console.error('Error saving predictions:', error);
      alert('Failed to save predictions. Please try again.');
    } finally {
      setSaving(false);
    }
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

  // Copy from Joint predictions to Individual
  const copyFromJoint = async () => {
    if (viewMode === 'joint') {
      alert('Already in Joint mode. Switch to Individual mode to copy from Joint.');
      return;
    }

    const jointData = await predictionsStorage.getByUserId('joint');
    if (!jointData) {
      alert('No joint predictions found. Please create joint predictions first.');
      return;
    }

    const jointIncome = jointData.income || [];
    const jointExpenses = jointData.expense || [];

    if (jointIncome.length === 0 && jointExpenses.length === 0) {
      alert('Joint predictions are empty. Nothing to copy.');
      return;
    }

    // Check for duplicates and merge
    const existingIncomeCategories = new Set(predictions.income.map(i => i.category));
    const existingExpenseCategories = new Set(predictions.expenses.map(e => e.category));

    const newIncome = jointIncome.filter((item: CategoryPrediction) => !existingIncomeCategories.has(item.category));
    const newExpenses = jointExpenses.filter((item: CategoryPrediction) => !existingExpenseCategories.has(item.category));

    if (newIncome.length === 0 && newExpenses.length === 0) {
      alert('All joint predictions already exist in your individual predictions. No new items to copy.');
      return;
    }

    setPredictions({
      ...predictions,
      income: [...predictions.income, ...newIncome],
      expenses: [...predictions.expenses, ...newExpenses],
    });

    alert(`Copied ${newIncome.length} income and ${newExpenses.length} expense predictions from Joint. Remember to save!`);
  };

  // Copy from Individual predictions to Joint
  const copyFromIndividual = async () => {
    if (viewMode === 'individual') {
      alert('Already in Individual mode. Switch to Joint mode to copy from Individual.');
      return;
    }

    if (!user) return;

    const individualData = await predictionsStorage.getByUserId(user.id);
    if (!individualData) {
      alert('No individual predictions found. Please create individual predictions first.');
      return;
    }

    const individualIncome = individualData.income || [];
    const individualExpenses = individualData.expense || [];

    if (individualIncome.length === 0 && individualExpenses.length === 0) {
      alert('Individual predictions are empty. Nothing to copy.');
      return;
    }

    // Check for duplicates and merge
    const existingIncomeCategories = new Set(predictions.income.map(i => i.category));
    const existingExpenseCategories = new Set(predictions.expenses.map(e => e.category));

    const newIncome = individualIncome.filter((item: CategoryPrediction) => !existingIncomeCategories.has(item.category));
    const newExpenses = individualExpenses.filter((item: CategoryPrediction) => !existingExpenseCategories.has(item.category));

    if (newIncome.length === 0 && newExpenses.length === 0) {
      alert('All individual predictions already exist in joint predictions. No new items to copy.');
      return;
    }

    setPredictions({
      ...predictions,
      income: [...predictions.income, ...newIncome],
      expenses: [...predictions.expenses, ...newExpenses],
    });

    alert(`Copied ${newIncome.length} income and ${newExpenses.length} expense predictions from Individual. Remember to save!`);
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

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading predictions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Financial Predictions</h1>
          <p className="text-gray-600 mt-2">
            Forecast your future income and expenses by category
          </p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('individual')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'individual'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Individual
          </button>
          <button
            onClick={() => setViewMode('joint')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'joint'
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Joint
          </button>
        </div>
      </div>
      
      {/* Info banner for Joint mode */}
      {viewMode === 'joint' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-900">Joint Predictions (Default)</p>
              <p className="text-sm text-blue-700 mt-1">
                Managing shared predictions for both partners. Changes are visible to both accounts. Switch to Individual mode for personal predictions.
              </p>
            </div>
          </div>
        </div>
      )}

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
      <div className="flex justify-center gap-4 flex-wrap">
        <button
          onClick={savePredictions}
          disabled={saving}
          className={`px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2 ${
            saving ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Predictions
            </>
          )}
        </button>
        {viewMode === 'individual' && (
          <button
            onClick={copyFromJoint}
            className="px-6 py-3 bg-purple-500 text-white rounded-md hover:bg-purple-600 flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Copy from Joint
          </button>
        )}
        {viewMode === 'joint' && (
          <button
            onClick={copyFromIndividual}
            className="px-6 py-3 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Copy from Individual
          </button>
        )}
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
  const [categories, setCategories] = useState<string[]>([]);

  // Load categories from Firestore
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await categoriesStorage.getCategories();
        setCategories(type === 'income' ? (categoriesData?.incomeCategories || []) : (categoriesData?.expenseCategories || []));
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
      }
    };
    loadCategories();
  }, [type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="bg-white rounded-lg max-w-md w-full p-6 my-8">
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
