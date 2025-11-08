import React, { useState } from 'react';
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
  startingBalance?: number;
}

export default function EnhancedBudgets() {
  const [selectedPeriod, setSelectedPeriod] = useState<BudgetPeriodType>('monthly');
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [showNewBudget, setShowNewBudget] = useState(false);
  
  // Mock data - would come from API
  const budgets: Budget[] = [
    { id: '1', name: 'Food Budget', category: 'Food', monthlyAmount: 1200, weeklyAmount: 300, yearlyAmount: 14400, spent: 850 },
    { id: '2', name: 'Health Budget', category: 'Health/Medical', monthlyAmount: 1300, weeklyAmount: 325, yearlyAmount: 15600, spent: 1100 },
    { id: '3', name: 'Transport Budget', category: 'Transportation', monthlyAmount: 465, weeklyAmount: 116.25, yearlyAmount: 5580, spent: 420 },
  ];
  
  const totalIncome = selectedPeriod === 'weekly' ? 1028.75 : selectedPeriod === 'monthly' ? 4115 : 49380;
  const startingBalance = 0;
  
  const totalBudgeted = budgets.reduce((sum, b) => {
    switch (selectedPeriod) {
      case 'weekly': return sum + b.weeklyAmount;
      case 'monthly': return sum + b.monthlyAmount;
      case 'yearly': return sum + b.yearlyAmount;
    }
  }, 0);
  
  const totalSpent = budgets.reduce((sum, b) => {
    const periodSpent = convertBudgetAmount(b.spent, 'monthly', selectedPeriod);
    return sum + periodSpent;
  }, 0);
  
  const { whatsLeft, isDeficit, percentageUsed } = calculateWhatsLeft(
    totalIncome,
    totalSpent,
    startingBalance
  );
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Budgets</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Use Template
          </button>
          <button 
            onClick={() => setShowExcelImport(true)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Import from Excel
          </button>
          <button 
            onClick={() => setShowNewBudget(true)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            New Budget
          </button>
        </div>
      </div>
      
      {/* Period Selector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPeriod('weekly')}
              className={`px-4 py-2 rounded ${
                selectedPeriod === 'weekly'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-4 py-2 rounded ${
                selectedPeriod === 'monthly'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPeriod('yearly')}
              className={`px-4 py-2 rounded ${
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
        
        <div className="divide-y">
          {budgets.map(budget => {
            const amount = selectedPeriod === 'weekly' ? budget.weeklyAmount :
                          selectedPeriod === 'monthly' ? budget.monthlyAmount :
                          budget.yearlyAmount;
            
            const spent = convertBudgetAmount(budget.spent, 'monthly', selectedPeriod);
            const remaining = amount - spent;
            const { percentage, status, color } = calculateBudgetProgress(spent, amount);
            
            return (
              <div key={budget.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{budget.category}</h3>
                    <p className="text-sm text-gray-600">{budget.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">₪{spent.toFixed(2)} / ₪{amount.toFixed(2)}</div>
                    <div className="text-sm" style={{ color }}>
                      {remaining >= 0 ? `₪${remaining.toFixed(2)} remaining` : `₪${Math.abs(remaining).toFixed(2)} over`}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div
                    className="h-2.5 rounded-full transition-all"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{percentage.toFixed(1)}% used</span>
                  <span className="font-medium" style={{ color }}>
                    {status === 'on-track' && '✓ On Track'}
                    {status === 'warning' && '⚠ Warning'}
                    {status === 'danger' && '⚠ Danger'}
                    {status === 'over-budget' && '✗ Over Budget'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Budget vs Actual Chart Placeholder */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Budget vs Actual</h2>
        <div className="h-64 flex items-center justify-center text-gray-400">
          Chart visualization would go here
        </div>
      </div>

      {/* Modals */}
      {showTemplates && <TemplateModal onClose={() => setShowTemplates(false)} />}
      {showExcelImport && <ExcelImportModal onClose={() => setShowExcelImport(false)} />}
      {showNewBudget && <NewBudgetModal onClose={() => setShowNewBudget(false)} />}
    </div>
  );
}

// Template Modal Component
function TemplateModal({ onClose }: { onClose: () => void }) {
  const templates = [
    {
      name: '50/30/20 Rule',
      description: '50% Needs, 30% Wants, 20% Savings',
      categories: [
        { name: 'Housing & Utilities', percentage: 30, type: 'needs' },
        { name: 'Food & Groceries', percentage: 15, type: 'needs' },
        { name: 'Transportation', percentage: 5, type: 'needs' },
        { name: 'Entertainment', percentage: 15, type: 'wants' },
        { name: 'Shopping', percentage: 10, type: 'wants' },
        { name: 'Dining Out', percentage: 5, type: 'wants' },
        { name: 'Savings', percentage: 15, type: 'savings' },
        { name: 'Investments', percentage: 5, type: 'savings' },
      ],
    },
    {
      name: 'Zero-Based Budget',
      description: 'Every shekel has a purpose',
      categories: [
        { name: 'Housing', percentage: 25 },
        { name: 'Food', percentage: 15 },
        { name: 'Transportation', percentage: 10 },
        { name: 'Utilities', percentage: 8 },
        { name: 'Insurance', percentage: 7 },
        { name: 'Debt Payments', percentage: 10 },
        { name: 'Entertainment', percentage: 8 },
        { name: 'Savings', percentage: 10 },
        { name: 'Miscellaneous', percentage: 7 },
      ],
    },
    {
      name: 'Your Spreadsheet',
      description: 'Based on your uploaded budget',
      categories: [
        { name: 'Food', amount: 1200 },
        { name: 'Health & Medical', amount: 1300 },
        { name: 'Transportation', amount: 465 },
        { name: 'Housing', amount: 800 },
        { name: 'Utilities', amount: 300 },
        { name: 'Entertainment', amount: 200 },
        { name: 'Shopping', amount: 150 },
        { name: 'Savings', amount: 500 },
      ],
    },
  ];

  const handleSelectTemplate = (template: any) => {
    alert(`Template "${template.name}" selected! This would create budgets based on the template.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Choose a Budget Template</h2>
        <p className="text-gray-600 mb-6">Select a template to quickly set up your budget</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {templates.map((template) => (
            <div
              key={template.name}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer"
              onClick={() => handleSelectTemplate(template)}
            >
              <h3 className="font-bold text-lg mb-2">{template.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              <div className="space-y-1">
                {template.categories.slice(0, 5).map((cat) => (
                  <div key={cat.name} className="text-xs text-gray-700">
                    • {cat.name}
                    {(cat as any).percentage && ` (${(cat as any).percentage}%)`}
                    {(cat as any).amount && ` (₪${(cat as any).amount})`}
                  </div>
                ))}
                {template.categories.length > 5 && (
                  <div className="text-xs text-gray-500">+ {template.categories.length - 5} more...</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Excel Import Modal Component
function ExcelImportModal({ onClose }: { onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleImport = () => {
    if (!file) return;
    setImporting(true);
    
    // Simulate import process
    setTimeout(() => {
      alert(`Successfully imported budget from "${file.name}"!\n\nThis would parse the Excel file and create budgets based on the data.`);
      setImporting(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Import from Excel</h2>
        <p className="text-gray-600 mb-6">
          Upload an Excel file (.xlsx, .xls) with your budget data
        </p>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Excel File
          </label>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          {file && (
            <p className="text-sm text-gray-600 mt-2">
              Selected: {file.name}
            </p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Expected Format:</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• Column A: Category Name</p>
            <p>• Column B: Monthly Amount</p>
            <p>• First row should be headers</p>
            <p>• Example: "Food, 1200"</p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            disabled={importing}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || importing}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? 'Importing...' : 'Import'}
          </button>
        </div>
      </div>
    </div>
  );
}

// New Budget Modal Component
function NewBudgetModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Food',
    monthlyAmount: '',
  });

  const categories = [
    'Food',
    'Transportation',
    'Health & Medical',
    'Housing',
    'Utilities',
    'Entertainment',
    'Shopping',
    'Savings',
    'Income',
    'Other',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Budget created!\n\nName: ${formData.name}\nCategory: ${formData.category}\nMonthly Amount: ₪${formData.monthlyAmount}\n\nThis would save the budget to the database.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Create New Budget</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Budget Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Monthly Food Budget"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monthly Amount (₪)
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.monthlyAmount}
              onChange={(e) => setFormData({ ...formData, monthlyAmount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="0.00"
              required
            />
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-600">
            <p>Weekly and yearly amounts will be calculated automatically:</p>
            <p className="mt-1">
              • Weekly: ₪{formData.monthlyAmount ? (parseFloat(formData.monthlyAmount) / 4.33).toFixed(2) : '0.00'}
            </p>
            <p>
              • Yearly: ₪{formData.monthlyAmount ? (parseFloat(formData.monthlyAmount) * 12).toFixed(2) : '0.00'}
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Budget
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
