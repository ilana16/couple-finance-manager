import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Settings, Download, Upload, Trash2, Database, User, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'categories' | 'data'>('profile');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your preferences and data</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="w-5 h-5 inline-block mr-2" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'categories'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-5 h-5 inline-block mr-2" />
              Categories
            </button>
            <button
              onClick={() => setActiveTab('data')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'data'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Database className="w-5 h-5 inline-block mr-2" />
              Data Management
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'categories' && <CategorySettings />}
          {activeTab === 'data' && <DataManagement />}
        </div>
      </div>
    </div>
  );
}

function ProfileSettings() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Information</h2>
        
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900">Current User</p>
                <p className="text-sm text-blue-700 mt-1">
                  Logged in as: <strong>{user?.name}</strong>
                </p>
                <p className="text-sm text-blue-700">
                  Email: <strong>{user?.email}</strong>
                </p>
                <p className="text-sm text-blue-700">
                  Role: <strong>{user?.role === 'partner1' ? 'Partner 1' : 'Partner 2'}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Change Password</h3>
            <p className="text-sm text-gray-600 mb-3">
              To change your password, you need to update the authentication configuration in the code.
            </p>
            <div className="bg-white border border-gray-300 rounded p-3 text-xs font-mono text-gray-700">
              <p>File: <code className="text-blue-600">src/lib/auth.tsx</code></p>
              <p className="mt-2">Update the USERS object with your new password</p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Account Information</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Your data is stored locally in your browser</p>
              <p>• Data persists across sessions on this device</p>
              <p>• To access from another device, export and import your data</p>
              <p>• Clear browser data will delete all your financial information</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CategorySettings() {
  const [expenseCategories, setExpenseCategories] = useState<string[]>([
    'Food',
    'Transportation',
    'Health & Medical',
    'Housing',
    'Utilities',
    'Entertainment',
    'Shopping',
    'Other'
  ]);
  const [incomeCategories, setIncomeCategories] = useState<string[]>([
    'Salary',
    'Freelance',
    'Investment Income',
    'Rental Income',
    'Business Income',
    'Other Income'
  ]);
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [showAddExpenseForm, setShowAddExpenseForm] = useState(false);
  const [showAddIncomeForm, setShowAddIncomeForm] = useState(false);

  const handleAddExpenseCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpenseCategory.trim() && !expenseCategories.includes(newExpenseCategory.trim())) {
      const updated = [...expenseCategories, newExpenseCategory.trim()];
      setExpenseCategories(updated);
      setNewExpenseCategory('');
      setShowAddExpenseForm(false);
      localStorage.setItem('couple_fin_expense_categories', JSON.stringify(updated));
    }
  };

  const handleAddIncomeCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (newIncomeCategory.trim() && !incomeCategories.includes(newIncomeCategory.trim())) {
      const updated = [...incomeCategories, newIncomeCategory.trim()];
      setIncomeCategories(updated);
      setNewIncomeCategory('');
      setShowAddIncomeForm(false);
      localStorage.setItem('couple_fin_income_categories', JSON.stringify(updated));
    }
  };

  const handleDeleteExpenseCategory = (category: string) => {
    if (confirm(`Are you sure you want to delete the expense category "${category}"?`)) {
      const updated = expenseCategories.filter(c => c !== category);
      setExpenseCategories(updated);
      localStorage.setItem('couple_fin_expense_categories', JSON.stringify(updated));
    }
  };

  const handleDeleteIncomeCategory = (category: string) => {
    if (confirm(`Are you sure you want to delete the income category "${category}"?`)) {
      const updated = incomeCategories.filter(c => c !== category);
      setIncomeCategories(updated);
      localStorage.setItem('couple_fin_income_categories', JSON.stringify(updated));
    }
  };

  return (
    <div className="space-y-8">
      {/* Expense Categories */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Expense Categories</h2>
        <p className="text-gray-600 mb-4">
          Categories for tracking expenses and spending
        </p>

        <div className="mb-4">
          {!showAddExpenseForm ? (
            <button
              onClick={() => setShowAddExpenseForm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Add Expense Category
            </button>
          ) : (
            <form onSubmit={handleAddExpenseCategory} className="flex gap-2">
              <input
                type="text"
                value={newExpenseCategory}
                onChange={(e) => setNewExpenseCategory(e.target.value)}
                placeholder="New expense category..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddExpenseForm(false);
                  setNewExpenseCategory('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </form>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {expenseCategories.map((category) => (
            <div
              key={category}
              className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-3"
            >
              <span className="font-medium text-gray-900">{category}</span>
              <button
                onClick={() => handleDeleteExpenseCategory(category)}
                className="text-red-600 hover:text-red-900"
                title="Delete category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Income Categories */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Income Categories</h2>
        <p className="text-gray-600 mb-4">
          Categories for tracking income and earnings
        </p>

        <div className="mb-4">
          {!showAddIncomeForm ? (
            <button
              onClick={() => setShowAddIncomeForm(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Income Category
            </button>
          ) : (
            <form onSubmit={handleAddIncomeCategory} className="flex gap-2">
              <input
                type="text"
                value={newIncomeCategory}
                onChange={(e) => setNewIncomeCategory(e.target.value)}
                placeholder="New income category..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddIncomeForm(false);
                  setNewIncomeCategory('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </form>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {incomeCategories.map((category) => (
            <div
              key={category}
              className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3"
            >
              <span className="font-medium text-gray-900">{category}</span>
              <button
                onClick={() => handleDeleteIncomeCategory(category)}
                className="text-red-600 hover:text-red-900"
                title="Delete category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DataManagement() {
  const [importing, setImporting] = useState(false);

  const handleExportData = () => {
    const data = {
      transactions: localStorage.getItem('couple_fin_transactions'),
      budgets: localStorage.getItem('couple_fin_budgets'),
      goals: localStorage.getItem('couple_fin_goals'),
      debts: localStorage.getItem('couple_fin_debts'),
      investments: localStorage.getItem('couple_fin_investments'),
      notes: localStorage.getItem('couple_fin_notes'),
      reminders: localStorage.getItem('couple_fin_reminders'),
      categories: localStorage.getItem('couple_fin_categories'),
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `couple-finance-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        // Restore all data
        if (data.transactions) localStorage.setItem('couple_fin_transactions', data.transactions);
        if (data.budgets) localStorage.setItem('couple_fin_budgets', data.budgets);
        if (data.goals) localStorage.setItem('couple_fin_goals', data.goals);
        if (data.debts) localStorage.setItem('couple_fin_debts', data.debts);
        if (data.investments) localStorage.setItem('couple_fin_investments', data.investments);
        if (data.notes) localStorage.setItem('couple_fin_notes', data.notes);
        if (data.reminders) localStorage.setItem('couple_fin_reminders', data.reminders);
        if (data.categories) localStorage.setItem('couple_fin_categories', data.categories);
        
        alert('Data imported successfully! Please refresh the page to see your data.');
        setImporting(false);
      } catch (error) {
        alert('Error importing data. Please make sure the file is valid.');
        setImporting(false);
      }
    };
    
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (confirm('⚠️ WARNING: This will delete ALL your financial data permanently. This cannot be undone. Are you sure?')) {
      if (confirm('Are you ABSOLUTELY sure? This will delete all transactions, budgets, goals, debts, investments, notes, and reminders.')) {
        localStorage.removeItem('couple_fin_transactions');
        localStorage.removeItem('couple_fin_budgets');
        localStorage.removeItem('couple_fin_goals');
        localStorage.removeItem('couple_fin_debts');
        localStorage.removeItem('couple_fin_investments');
        localStorage.removeItem('couple_fin_notes');
        localStorage.removeItem('couple_fin_reminders');
        
        alert('All data has been cleared. Please refresh the page.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Data Management</h2>
        <p className="text-gray-600 mb-6">
          Export, import, or clear your financial data
        </p>

        <div className="space-y-4">
          {/* Export Data */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <Download className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">Export Data</h3>
                <p className="text-sm text-green-700 mb-4">
                  Download all your financial data as a JSON file. Use this to backup your data or transfer it to another device.
                </p>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4 inline-block mr-2" />
                  Export All Data
                </button>
              </div>
            </div>
          </div>

          {/* Import Data */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <Upload className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">Import Data</h3>
                <p className="text-sm text-blue-700 mb-4">
                  Restore your financial data from a previously exported JSON file. This will merge with existing data.
                </p>
                <label className="inline-block">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="hidden"
                  />
                  <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer inline-block">
                    <Upload className="w-4 h-4 inline-block mr-2" />
                    {importing ? 'Importing...' : 'Import Data'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Clear Data */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <Trash2 className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">Clear All Data</h3>
                <p className="text-sm text-red-700 mb-4">
                  ⚠️ <strong>Danger Zone:</strong> This will permanently delete all your financial data including transactions, budgets, goals, debts, investments, notes, and reminders. This action cannot be undone.
                </p>
                <button
                  onClick={handleClearAllData}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4 inline-block mr-2" />
                  Clear All Data
                </button>
              </div>
            </div>
          </div>

          {/* Storage Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Storage Information</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• All data is stored locally in your browser's localStorage</p>
              <p>• Data persists across sessions on this device only</p>
              <p>• Maximum storage: ~5-10 MB (varies by browser)</p>
              <p>• To access from multiple devices, use Export/Import</p>
              <p>• Clearing browser data will delete all financial information</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
