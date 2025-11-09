import React, { useState, useEffect } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { budgetStorage, transactionStorage, createTimestamp } from '../lib/storage-firestore';
import { BudgetPeriodType } from '../lib/enhanced-schema';
import {
  convertBudgetAmount,
  calculateWhatsLeft,
  formatPeriodLabel,
  formatPeriodDateRange,
  calculateBudgetProgress,
} from '../lib/budgetPeriodUtils';

interface Budget {
  id: string;
  name: string;
  category: string;
  monthlyAmount: number;
  weeklyAmount: number;
  yearlyAmount: number;
  spent: number;
  isJoint: boolean;
  startingBalance?: number;
}

// Edit Budget Modal Component
// New Budget Modal Component
function NewBudgetModal({ onClose }: { onClose: () => void }) {
  const { user, viewMode } = useAuth();
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    category: '',
    monthlyAmount: 0,
    isJoint: true,
  });

  useEffect(() => {
    // Load expense categories from Settings
    const stored = localStorage.getItem('couple_fin_expense_categories');
    if (stored) {
      setExpenseCategories(JSON.parse(stored));
    } else {
      // Default categories if none exist
      setExpenseCategories(['Food', 'Transportation', 'Housing', 'Utilities', 'Entertainment', 'Healthcare', 'Other']);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const weeklyAmount = formData.monthlyAmount / 4.33;
    const yearlyAmount = formData.monthlyAmount * 12;

    try {
      await budgetStorage.create({
        userId: user.id,
        category: formData.category,
        monthlyAmount: formData.monthlyAmount,
        weeklyAmount,
        yearlyAmount,
        spent: 0, // Will be calculated from transactions
        isJoint: formData.isJoint,
        createdAt: createTimestamp(),
        updatedAt: createTimestamp(),
      });
      onClose();
    } catch (error) {
      console.error('Error creating budget:', error);
      alert('Failed to create budget. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="bg-white rounded-lg max-w-md w-full p-6 my-8">
        <h2 className="text-2xl font-bold mb-4">New Budget</h2>
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
              {expenseCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Manage categories in Settings
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Limit (₪/month)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.monthlyAmount}
              onChange={(e) => setFormData({ ...formData, monthlyAmount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Maximum amount to spend"
              required
            />
          </div>
          
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isJoint}
                onChange={(e) => setFormData({ ...formData, isJoint: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Joint Budget</span>
            </label>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Create Budget
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

// Edit Budget Modal Component
function EditBudgetModal({ budget, onClose }: { budget: Budget; onClose: () => void }) {
  const { user } = useAuth();
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    category: budget.category,
    monthlyAmount: budget.monthlyAmount,
    isJoint: budget.isJoint,
  });

  useEffect(() => {
    // Load expense categories from Settings
    const stored = localStorage.getItem('couple_fin_expense_categories');
    if (stored) {
      setExpenseCategories(JSON.parse(stored));
    } else {
      setExpenseCategories(['Food', 'Transportation', 'Housing', 'Utilities', 'Entertainment', 'Healthcare', 'Other']);
    }
  }, []);;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const weeklyAmount = formData.monthlyAmount / 4.33;
    const yearlyAmount = formData.monthlyAmount * 12;

    budgetStorage.update(budget.id, {
      category: formData.category,
      monthlyAmount: formData.monthlyAmount,
      weeklyAmount,
      yearlyAmount,
      spent: budget.spent, // Keep existing calculated spent
      isJoint: formData.isJoint,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="bg-white rounded-lg max-w-md w-full p-6 my-8">
        <h2 className="text-2xl font-bold mb-4">Edit Budget</h2>
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
              {expenseCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Manage categories in Settings
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Limit (₪/month)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.monthlyAmount}
              onChange={(e) => setFormData({ ...formData, monthlyAmount: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Maximum amount to spend"
              required
            />
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Amount Spent</strong> will be calculated automatically from your transactions in this category.
            </p>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Save Changes
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

export default function EnhancedBudgets() {
  const { user, viewMode } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<BudgetPeriodType>('monthly');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [showNewBudget, setShowNewBudget] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [showImportFromPredictions, setShowImportFromPredictions] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBudgets();
  }, [user, viewMode]);

  const loadBudgets = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      const includeJoint = viewMode === 'joint';
      
      // Load budgets and transactions in parallel
      const [storageBudgets, allTransactions] = await Promise.all([
        budgetStorage.getByUser(user.id, includeJoint),
        transactionStorage.getByUser(user.id, includeJoint)
      ]);
      
      const convertedBudgets: Budget[] = storageBudgets.map(b => {
        // Calculate spent from transactions matching this category
        const categoryTransactions = allTransactions.filter(
          t => t.category === b.category && t.type === 'expense'
        );
        
        // Sum up all expense transactions in this category
        const calculatedSpent = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
        
        return {
          id: b.id,
          name: b.category,
          category: b.category,
          monthlyAmount: b.monthlyAmount,
          weeklyAmount: b.weeklyAmount,
          yearlyAmount: b.yearlyAmount,
          spent: calculatedSpent, // Auto-calculated from transactions
          isJoint: b.isJoint,
        };
      });
      
      setBudgets(convertedBudgets);
    } catch (error) {
      console.error('Error loading budgets:', error);
      alert('Failed to load budgets. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await budgetStorage.delete(id);
        await loadBudgets();
      } catch (error) {
        console.error('Error deleting budget:', error);
        alert('Failed to delete budget. Please try again.');
      }
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
  };

  const handleImportFromPredictions = async () => {
    if (!user) return;
    
    let allExpensePredictions: any[] = [];
    
    if (viewMode === 'joint') {
      // In joint mode, import from shared joint predictions
      const jointData = localStorage.getItem('predictions_joint');
      if (jointData) {
        const predictions = JSON.parse(jointData);
        allExpensePredictions = predictions.expenses || [];
      }
    } else {
      // In individual mode, import only from current user
      const saved = localStorage.getItem(`predictions_${user.id}`);
      if (saved) {
        const predictions = JSON.parse(saved);
        allExpensePredictions = predictions.expenses || [];
      }
    }
    
    if (allExpensePredictions.length === 0) {
      alert('No expense predictions found. Please add expense predictions first.');
      return;
    }
    
    // Group predictions by category and sum amounts if duplicates exist
    const categoryMap = new Map<string, number>();
    allExpensePredictions.forEach((pred: any) => {
      let monthlyAmount = pred.amount;
      if (pred.frequency === 'weekly') monthlyAmount = pred.amount * 4.33;
      if (pred.frequency === 'yearly') monthlyAmount = pred.amount / 12;
      
      const existing = categoryMap.get(pred.category) || 0;
      categoryMap.set(pred.category, existing + monthlyAmount);
    });
    
    let importedCount = 0;
    categoryMap.forEach((monthlyAmount, category) => {
      // Check if budget already exists for this category
      const existingBudget = budgets.find(b => b.category === category);
      if (existingBudget) {
        return; // Skip if budget already exists
      }
      
      const weeklyAmount = monthlyAmount / 4.33;
      const yearlyAmount = monthlyAmount * 12;
      
      // Create new budget from prediction
      importedCount++;
    });
    
    try {
      // Create all budgets
      const promises: Promise<any>[] = [];
      categoryMap.forEach((monthlyAmount, category) => {
        const existingBudget = budgets.find(b => b.category === category);
        if (!existingBudget) {
          const weeklyAmount = monthlyAmount / 4.33;
          const yearlyAmount = monthlyAmount * 12;
          promises.push(budgetStorage.create({
            category,
            monthlyAmount,
            weeklyAmount,
            yearlyAmount,
            spent: 0,
            isJoint: viewMode === 'joint',
            userId: user.id,
            createdAt: createTimestamp(),
            updatedAt: createTimestamp(),
          }));
        }
      });
      
      await Promise.all(promises);
      await loadBudgets();
      setShowImportFromPredictions(false);
      alert(`Successfully imported ${importedCount} budget(s) from predictions!`);
    } catch (error) {
      console.error('Error importing budgets:', error);
      alert('Failed to import budgets. Please try again.');
    }
  };

  // Calculate total income from Predictions page
  const calculateTotalIncome = () => {
    if (!user) return 0;
    
    let monthlyIncome = 0;
    
    if (viewMode === 'joint') {
      // In joint mode, use shared joint predictions
      const jointData = localStorage.getItem('predictions_joint');
      if (jointData) {
        const predictions = JSON.parse(jointData);
        const incomePredictions = predictions.income || [];
        
        monthlyIncome = incomePredictions.reduce((sum: number, pred: any) => {
          let amount = pred.amount;
          if (pred.frequency === 'weekly') amount = pred.amount * 4.33;
          if (pred.frequency === 'yearly') amount = pred.amount / 12;
          return sum + amount;
        }, 0);
      }
    } else {
      // In individual mode, show only current user's predictions
      const saved = localStorage.getItem(`predictions_${user.id}`);
      if (saved) {
        const predictions = JSON.parse(saved);
        const incomePredictions = predictions.income || [];
        
        monthlyIncome = incomePredictions.reduce((sum: number, pred: any) => {
          let amount = pred.amount;
          if (pred.frequency === 'weekly') amount = pred.amount * 4.33;
          if (pred.frequency === 'yearly') amount = pred.amount / 12;
          return sum + amount;
        }, 0);
      }
    }
    
    // Convert to selected period
    if (selectedPeriod === 'weekly') return monthlyIncome / 4.33;
    if (selectedPeriod === 'yearly') return monthlyIncome * 12;
    return monthlyIncome;
  };
  
  const totalIncome = calculateTotalIncome();
  const startingBalance = 0;
  
  const totalBudgeted = budgets.reduce((sum, b) => {
    switch (selectedPeriod) {
      case 'weekly': return sum + b.weeklyAmount;
      case 'yearly': return sum + b.yearlyAmount;
      default: return sum + b.monthlyAmount;
    }
  }, 0);
  
  const totalSpent = budgets.reduce((sum, b) => {
    return sum + convertBudgetAmount(b.spent, 'monthly', selectedPeriod);
  }, 0);
  
  const { whatsLeft, isDeficit, percentageUsed } = calculateWhatsLeft(totalIncome, totalSpent, startingBalance);

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading budgets...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budgets</h1>
          <p className="text-gray-600 mt-1">
            {viewMode === 'joint' ? 'All budgets' : 'Your budgets'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowImportFromPredictions(true)}
            className="px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
          >
            Import from Predictions
          </button>
          <button
            onClick={() => setShowTemplates(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
          >
            Use Template
          </button>
          <button
            onClick={() => setShowExcelImport(true)}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
          >
            Import from Excel
          </button>
          <button
            onClick={() => setShowNewBudget(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            + New Budget
          </button>
        </div>
      </div>

      {/* Period Toggle */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPeriod('weekly')}
              className={`px-4 py-2 rounded-md ${
                selectedPeriod === 'weekly'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-4 py-2 rounded-md ${
                selectedPeriod === 'monthly'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPeriod('yearly')}
              className={`px-4 py-2 rounded-md ${
                selectedPeriod === 'yearly'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Yearly
            </button>
          </div>
          <div className="text-sm text-gray-600">
            {formatPeriodDateRange(selectedPeriod)}
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Starting Balance</div>
          <div className="text-2xl font-bold">₪{startingBalance.toFixed(2)}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Income {formatPeriodLabel(selectedPeriod)}</div>
          <div className="text-2xl font-bold text-green-600">₪{totalIncome.toFixed(2)}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Expenses {formatPeriodLabel(selectedPeriod)}</div>
          <div className="text-2xl font-bold text-red-600">₪{totalSpent.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">
            {percentageUsed.toFixed(1)}% of income
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">What's Left</div>
          <div className={`text-2xl font-bold ${isDeficit ? 'text-red-600' : 'text-green-600'}`}>
            {isDeficit ? '-' : ''}₪{Math.abs(whatsLeft).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {isDeficit ? 'DEFICIT' : 'SURPLUS'}
          </div>
        </div>
      </div>
      
      {/* Budget List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Budget Categories</h2>
        </div>
        
        {budgets.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No budgets yet. Click "New Budget" to create one!</p>
          </div>
        ) : (
          <div className="divide-y">
            {budgets.map(budget => {
              const limit = selectedPeriod === 'weekly' ? budget.weeklyAmount :
                           selectedPeriod === 'monthly' ? budget.monthlyAmount :
                           budget.yearlyAmount;
              
              const spent = budget.spent;
              const remaining = limit - spent;
              const percentage = (spent / limit) * 100;
              const isUnderBudget = spent <= limit;
              
              return (
                <div key={budget.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold">{budget.category}</h3>
                      <p className="text-sm text-gray-600">{budget.name}</p>
                    </div>
                    <div className="text-right flex-1">
                      <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                        <div>
                          <div className="text-xs text-gray-500">Limit</div>
                          <div className="font-semibold text-blue-600">₪{limit.toFixed(2)}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Spent</div>
                          <div className="font-semibold text-gray-900">₪{spent.toFixed(2)}</div>
                        </div>
                      </div>
                      <div className="text-sm font-medium" style={{ color: isUnderBudget ? '#10b981' : '#ef4444' }}>
                        {isUnderBudget ? '✓' : '⚠'} {isUnderBudget ? 'Under' : 'Over'} by ₪{Math.abs(remaining).toFixed(2)}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(budget)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Edit budget"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(budget.id, budget.name)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete budget"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div
                      className="h-2.5 rounded-full transition-all"
                      style={{
                        width: `${Math.min(percentage, 100)}%`,
                        backgroundColor: isUnderBudget ? '#10b981' : '#ef4444',
                      }}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">{percentage.toFixed(1)}% used</span>
                    <span className="font-medium" style={{ color: isUnderBudget ? '#10b981' : '#ef4444' }}>
                      {isUnderBudget ? '✓ On Track' : '⚠ Over Budget'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {/* Modals */}
      {showNewBudget && (
        <NewBudgetModal
          onClose={() => {
            setShowNewBudget(false);
            loadBudgets();
          }}
        />
      )}
      
      {editingBudget && (
        <EditBudgetModal
          budget={editingBudget}
          onClose={() => {
            setEditingBudget(null);
            loadBudgets();
          }}
        />
      )}
      
      {showImportFromPredictions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="bg-white rounded-lg max-w-md w-full p-6 my-8">
            <h2 className="text-2xl font-bold mb-4">Import from Predictions</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                This will create budgets for all expense categories in your Predictions page that don't already have budgets.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Budget limits will be set to the predicted monthly expense amounts. Existing budgets will not be modified.
                </p>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={handleImportFromPredictions}
                  className="flex-1 px-4 py-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
                >
                  Import Budgets
                </button>
                <button
                  onClick={() => setShowImportFromPredictions(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
