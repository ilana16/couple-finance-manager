import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { Settings, Download, Upload, Trash2, Database, User, Shield } from 'lucide-react';
import { categoriesStorage } from '../lib/categories-storage';

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
  const [loading, setLoading] = useState(true);
  // Default categories (used only if nothing is saved)
  const defaultExpenseCategories = [
    'Food',
    'Transportation',
    'Health & Medical',
    'Housing',
    'Utilities',
    'Entertainment',
    'Shopping',
    'Other'
  ];
  const defaultIncomeCategories = [
    'Salary',
    'Freelance',
    'Investment Income',
    'Rental Income',
    'Business Income',
    'Other Income'
  ];

  const [expenseCategories, setExpenseCategories] = useState<string[]>(defaultExpenseCategories);
  const [incomeCategories, setIncomeCategories] = useState<string[]>(defaultIncomeCategories);
  const [newExpenseCategory, setNewExpenseCategory] = useState('');
  const [newIncomeCategory, setNewIncomeCategory] = useState('');
  const [showAddExpenseForm, setShowAddExpenseForm] = useState(false);
  const [showAddIncomeForm, setShowAddIncomeForm] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load categories from Firestore on mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const saved = await categoriesStorage.getCategories();
      
      if (saved) {
        setExpenseCategories(saved.expenseCategories);
        setIncomeCategories(saved.incomeCategories);
      } else {
        // Save defaults if nothing exists
        await categoriesStorage.saveCategories(defaultIncomeCategories, defaultExpenseCategories);
        setExpenseCategories(defaultExpenseCategories);
        setIncomeCategories(defaultIncomeCategories);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      // Fallback to defaults on error
      setExpenseCategories(defaultExpenseCategories);
      setIncomeCategories(defaultIncomeCategories);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpenseCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpenseCategory.trim() && !expenseCategories.includes(newExpenseCategory.trim())) {
      const updated = [...expenseCategories, newExpenseCategory.trim()];
      try {
        await categoriesStorage.saveCategories(incomeCategories, updated);
        setExpenseCategories(updated);
        setNewExpenseCategory('');
        setShowAddExpenseForm(false);
        setSaveMessage('Expense category added and saved!');
        setTimeout(() => setSaveMessage(''), 3000);
      } catch (error) {
        console.error('Error saving category:', error);
        alert('Failed to save category. Please try again.');
      }
    }
  };

  const handleAddIncomeCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newIncomeCategory.trim() && !incomeCategories.includes(newIncomeCategory.trim())) {
      const updated = [...incomeCategories, newIncomeCategory.trim()];
      try {
        await categoriesStorage.saveCategories(updated, expenseCategories);
        setIncomeCategories(updated);
        setNewIncomeCategory('');
        setShowAddIncomeForm(false);
        setSaveMessage('Income category added and saved!');
        setTimeout(() => setSaveMessage(''), 3000);
      } catch (error) {
        console.error('Error saving category:', error);
        alert('Failed to save category. Please try again.');
      }
    }
  };

  const handleDeleteExpenseCategory = async (category: string) => {
    if (confirm(`Are you sure you want to delete the expense category "${category}"?`)) {
      const updated = expenseCategories.filter(c => c !== category);
      try {
        await categoriesStorage.saveCategories(incomeCategories, updated);
        setExpenseCategories(updated);
        setSaveMessage('Expense category deleted and saved!');
        setTimeout(() => setSaveMessage(''), 3000);
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category. Please try again.');
      }
    }
  };

  const handleDeleteIncomeCategory = async (category: string) => {
    if (confirm(`Are you sure you want to delete the income category "${category}"?`)) {
      const updated = incomeCategories.filter(c => c !== category);
      try {
        await categoriesStorage.saveCategories(updated, expenseCategories);
        setIncomeCategories(updated);
        setSaveMessage('Income category deleted and saved!');
        setTimeout(() => setSaveMessage(''), 3000);
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Failed to delete category. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Save Message */}
      {saveMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="font-medium">{saveMessage}</span>
        </div>
      )}
      
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
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<any>(null);

  const handleMigrateToFirebase = async () => {
    if (!confirm('This will migrate all your data from local storage to Firebase cloud storage. This process cannot be undone. Continue?')) {
      return;
    }

    setMigrating(true);
    setMigrationResult(null);

    try {
      const { migrateLocalStorageToFirestore } = await import('../lib/migrate-to-firestore');
      const result = await migrateLocalStorageToFirestore();
      setMigrationResult(result);
      
      if (result.success) {
        alert(`Migration successful! Migrated: ${result.migrated.transactions} transactions, ${result.migrated.budgets} budgets, ${result.migrated.goals} goals, ${result.migrated.accounts} accounts, ${result.migrated.creditSources} credit sources, ${result.migrated.notes} notes, ${result.migrated.reminders} reminders.`);
      } else {
        alert(`Migration completed with errors. Please check the results.`);
      }
    } catch (error) {
      alert(`Migration failed: ${error}`);
      setMigrationResult({ success: false, errors: [String(error)] });
    } finally {
      setMigrating(false);
    }
  };

  const handleExportFirestoreData = async () => {
    try {
      // Import all storage modules
      const { transactionStorage, budgetStorage, goalStorage, accountStorage, creditStorage } = await import('../lib/storage-firestore');
      const { debtStorage } = await import('../lib/storage-firestore');
      const { investmentStorage } = await import('../lib/storage-firestore');
      const { noteStorage } = await import('../lib/storage-firestore');
      const { reminderStorage } = await import('../lib/storage-firestore');
      const { predictionsStorage } = await import('../lib/predictions-storage');
      const { categoriesStorage } = await import('../lib/categories-storage');

      // Fetch all data from Firestore
      const [transactions, budgets, goals, accounts, credits, notes, reminders, categories] = await Promise.all([
        transactionStorage.getAll(),
        budgetStorage.getAll(),
        goalStorage.getAll(),
        accountStorage.getAll(),
        creditStorage.getAll(),
        noteStorage.getAll(),
        reminderStorage.getAll(),
        categoriesStorage.getCategories(),
      ]);

      // Get predictions for both users and joint
      const [predictionsUser1, predictionsUser2, predictionsJoint] = await Promise.all([
        predictionsStorage.getByUserId('user1'),
        predictionsStorage.getByUserId('user2'),
        predictionsStorage.getByUserId('joint'),
      ]);

      const data = {
        transactions,
        budgets,
        goals,
        accounts,
        creditSources: credits,
        notes,
        reminders,
        categories,
        predictions: {
          user1: predictionsUser1,
          user2: predictionsUser2,
          joint: predictionsJoint,
        },
        exportDate: new Date().toISOString(),
        exportSource: 'firestore',
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `couple-finance-firestore-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('Firestore data exported successfully!');
    } catch (error) {
      console.error('Error exporting Firestore data:', error);
      alert('Failed to export Firestore data. Please try again.');
    }
  };

  const handleExportData = () => {
    const data = {
      transactions: localStorage.getItem('couple_fin_transactions'),
      budgets: localStorage.getItem('couple_fin_budgets'),
      goals: localStorage.getItem('couple_fin_goals'),
      debts: localStorage.getItem('couple_fin_debts'),
      investments: localStorage.getItem('couple_fin_investments'),
      notes: localStorage.getItem('couple_fin_notes'),
      reminders: localStorage.getItem('couple_fin_reminders'),
      accounts: localStorage.getItem('couple_fin_accounts'),
      creditSources: localStorage.getItem('couple_fin_credit_sources'),
      expenseCategories: localStorage.getItem('couple_fin_expense_categories'),
      incomeCategories: localStorage.getItem('couple_fin_income_categories'),
      predictions_user1: localStorage.getItem('predictions_user1'),
      predictions_user2: localStorage.getItem('predictions_user2'),
      predictions_joint: localStorage.getItem('predictions_joint'),
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
        if (data.accounts) localStorage.setItem('couple_fin_accounts', data.accounts);
        if (data.creditSources) localStorage.setItem('couple_fin_credit_sources', data.creditSources);
        if (data.expenseCategories) localStorage.setItem('couple_fin_expense_categories', data.expenseCategories);
        if (data.incomeCategories) localStorage.setItem('couple_fin_income_categories', data.incomeCategories);
        if (data.predictions_user1) localStorage.setItem('predictions_user1', data.predictions_user1);
        if (data.predictions_user2) localStorage.setItem('predictions_user2', data.predictions_user2);
        if (data.predictions_joint) localStorage.setItem('predictions_joint', data.predictions_joint);
        // Legacy support for old category format
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
      if (confirm('Are you ABSOLUTELY sure? This will delete all transactions, budgets, goals, debts, investments, notes, reminders, categories, and predictions.')) {
        localStorage.removeItem('couple_fin_transactions');
        localStorage.removeItem('couple_fin_budgets');
        localStorage.removeItem('couple_fin_goals');
        localStorage.removeItem('couple_fin_debts');
        localStorage.removeItem('couple_fin_investments');
        localStorage.removeItem('couple_fin_notes');
        localStorage.removeItem('couple_fin_reminders');
        localStorage.removeItem('couple_fin_accounts');
        localStorage.removeItem('couple_fin_credit_sources');
        localStorage.removeItem('couple_fin_expense_categories');
        localStorage.removeItem('couple_fin_income_categories');
        localStorage.removeItem('predictions_user1');
        localStorage.removeItem('predictions_user2');
        localStorage.removeItem('predictions_joint');
        
        alert('All data has been cleared. The page will now reload.');
        window.location.reload();
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Firebase Migration Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <Database className="w-8 h-8 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Cloud Storage Migration</h2>
            <p className="text-gray-700 mb-4">
              Migrate your data from local browser storage to Firebase cloud storage for universal access across all devices.
            </p>
            
            <div className="bg-white rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Benefits of Cloud Storage:</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>✅ Access your data from any device</li>
                <li>✅ Real-time synchronization between devices</li>
                <li>✅ Automatic backups and data recovery</li>
                <li>✅ Share data seamlessly between partners</li>
                <li>✅ No data loss when clearing browser cache</li>
              </ul>
            </div>

            <button
              onClick={handleMigrateToFirebase}
              disabled={migrating}
              className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
                migrating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Database className="w-5 h-5" />
              {migrating ? 'Migrating...' : 'Migrate to Cloud Storage'}
            </button>

            {migrationResult && (
              <div className={`mt-4 p-4 rounded-lg ${
                migrationResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  migrationResult.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  {migrationResult.success ? 'Migration Successful!' : 'Migration Failed'}
                </h4>
                <div className="text-sm space-y-1">
                  <p>Transactions: {migrationResult.migrated?.transactions || 0}</p>
                  <p>Budgets: {migrationResult.migrated?.budgets || 0}</p>
                  <p>Goals: {migrationResult.migrated?.goals || 0}</p>
                  <p>Accounts: {migrationResult.migrated?.accounts || 0}</p>
                  <p>Credit Sources: {migrationResult.migrated?.creditSources || 0}</p>
                  <p>Notes: {migrationResult.migrated?.notes || 0}</p>
                  <p>Reminders: {migrationResult.migrated?.reminders || 0}</p>
                </div>
                {migrationResult.errors && migrationResult.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-semibold text-red-900">Errors:</p>
                    <ul className="text-xs text-red-700 space-y-1 mt-1">
                      {migrationResult.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Local Data Management</h2>
        <p className="text-gray-600 mb-6">
          Export, import, or clear your local financial data
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
                <div className="flex gap-3">
                  <button
                    onClick={handleExportFirestoreData}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4 inline-block mr-2" />
                    Export Cloud Data
                  </button>
                  <button
                    onClick={handleExportData}
                    className="px-4 py-2 bg-green-100 text-green-700 border border-green-300 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Download className="w-4 h-4 inline-block mr-2" />
                    Export Local Data
                  </button>
                </div>
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
