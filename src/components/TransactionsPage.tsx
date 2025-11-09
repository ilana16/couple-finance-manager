import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { transactionStorage, accountStorage, creditStorage, goalStorage, Transaction, Account, CreditSource, SavingsGoal, createTimestamp } from '../lib/storage-firestore';
import { categoriesStorage } from '../lib/categories-storage';
import { Plus, Search, Filter, Edit2, Trash2, Download, Upload } from 'lucide-react';

export default function TransactionsPage() {
  const { user, viewMode } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [user, viewMode]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, filterType, filterCategory]);

  const loadTransactions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const includeJoint = viewMode === 'joint';
      const data = await transactionStorage.getByUser(user.id, includeJoint);
      setTransactions(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Error loading transactions:', error);
      alert('Failed to load transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];

    if (searchTerm) {
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory);
    }

    setFilteredTransactions(filtered);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionStorage.delete(id);
        await loadTransactions();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Failed to delete transaction. Please try again.');
      }
    }
  };

  const categories = Array.from(new Set(transactions.map(t => t.category)));

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netAmount = totalIncome - totalExpenses;

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <p className="text-gray-600 mt-1">
          {viewMode === 'joint' ? 'All transactions' : 'Your transactions'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <p className="text-sm text-green-700 mb-1">Total Income</p>
          <p className="text-2xl font-bold text-green-900">₪{totalIncome.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <p className="text-sm text-red-700 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-900">₪{totalExpenses.toFixed(2)}</p>
        </div>
        <div className={`rounded-lg p-6 border ${netAmount >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
          <p className={`text-sm mb-1 ${netAmount >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Net Amount</p>
          <p className={`text-2xl font-bold ${netAmount >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
            ₪{netAmount.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          {/* Category Filter */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Add Button */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Joint</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No transactions found. Click "Add Transaction" to create one.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {transaction.description}
                      {transaction.notes && (
                        <p className="text-xs text-gray-500 mt-1">{transaction.notes}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {transaction.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.type === 'income'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                      <span className={transaction.type === 'income' ? 'text-green-600' : 'text-gray-900'}>
                        {transaction.type === 'income' ? '+' : '-'}₪{transaction.amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {transaction.isJoint && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Joint
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => {
                          setEditingTransaction(transaction);
                          setShowAddModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <TransactionModal
          transaction={editingTransaction}
          onClose={() => {
            setShowAddModal(false);
            setEditingTransaction(null);
          }}
          onSave={() => {
            loadTransactions();
            setShowAddModal(false);
            setEditingTransaction(null);
          }}
        />
      )}
    </div>
  );
}

// Transaction Modal Component
interface TransactionModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onSave: () => void;
}

function TransactionModal({ transaction, onClose, onSave }: TransactionModalProps) {
  const { user, viewMode } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [creditSources, setCreditSources] = useState<CreditSource[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    date: transaction?.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    description: transaction?.description || '',
    amount: transaction?.amount?.toString() || '',
    category: transaction?.category || 'Food',
    type: transaction?.type || 'expense' as 'income' | 'expense',
    paymentMethod: transaction?.paymentMethod || 'debit' as 'debit' | 'credit',
    accountId: transaction?.accountId || '',
    creditSourceId: transaction?.creditSourceId || '',
    isRecurring: transaction?.isRecurring ?? false,
    recurringFrequency: transaction?.recurringFrequency || 'monthly' as 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom',
    customRecurringValue: transaction?.customRecurringValue || 1,
    customRecurringUnit: transaction?.customRecurringUnit || 'days' as 'days' | 'weeks' | 'months' | 'years',
    dayOfMonth: transaction?.dayOfMonth || 1,
    recurringEndDate: transaction?.recurringEndDate ? new Date(transaction.recurringEndDate).toISOString().split('T')[0] : '',
    isJoint: transaction?.isJoint ?? true,
    notes: transaction?.notes || '',
    savingsGoalId: transaction?.savingsGoalId || '',
  });

  useEffect(() => {
    const loadAccountsAndCredits = async () => {
      if (!user) return;
      try {
        const includeJoint = viewMode === 'joint';
        const [accountsData, creditsData, goalsData, categoriesData] = await Promise.all([
          accountStorage.getByUser(user.id, includeJoint),
          creditStorage.getByUser(user.id, includeJoint),
          goalStorage.getByUser(user.id, includeJoint),
          categoriesStorage.getCategories()
        ]);
        setAccounts(accountsData);
        setCreditSources(creditsData);
        setSavingsGoals(goalsData);
        setExpenseCategories(categoriesData?.expenseCategories || []);
        setIncomeCategories(categoriesData?.incomeCategories || []);
      } catch (error) {
        console.error('Error loading accounts/credits/categories:', error);
      }
    };
    loadAccountsAndCredits();
  }, [user, viewMode]);

  // Get categories based on transaction type
  const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const data = {
      userId: user.id,
      date: new Date(formData.date).toISOString(),
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      type: formData.type,
      paymentMethod: formData.paymentMethod,
      accountId: formData.paymentMethod === 'debit' ? formData.accountId : undefined,
      creditSourceId: formData.paymentMethod === 'credit' ? formData.creditSourceId : undefined,
      isRecurring: formData.isRecurring,
      recurringFrequency: formData.isRecurring ? formData.recurringFrequency : undefined,
      customRecurringValue: formData.isRecurring && formData.recurringFrequency === 'custom' ? formData.customRecurringValue : undefined,
      customRecurringUnit: formData.isRecurring && formData.recurringFrequency === 'custom' ? formData.customRecurringUnit : undefined,
      dayOfMonth: formData.isRecurring && formData.recurringFrequency === 'monthly' ? formData.dayOfMonth : undefined,
      recurringEndDate: formData.isRecurring && formData.recurringEndDate ? new Date(formData.recurringEndDate).toISOString() : undefined,
      isJoint: formData.isJoint,
      notes: formData.notes,
      savingsGoalId: formData.savingsGoalId ? formData.savingsGoalId : undefined,
      createdAt: transaction?.createdAt || createTimestamp(),
      updatedAt: createTimestamp(),
    };

    try {
      if (transaction) {
        await transactionStorage.update(transaction.id, data);
        
        // Update savings goal if changed
        if (formData.savingsGoalId && formData.savingsGoalId !== transaction.savingsGoalId) {
          const goal = savingsGoals.find(g => g.id === formData.savingsGoalId);
          if (goal) {
            await goalStorage.update(formData.savingsGoalId, {
              currentAmount: goal.currentAmount + parseFloat(formData.amount),
              updatedAt: createTimestamp()
            });
          }
        }
      } else {
        await transactionStorage.create(data);
        
        // Update savings goal if selected
        if (formData.savingsGoalId) {
          const goal = savingsGoals.find(g => g.id === formData.savingsGoalId);
          if (goal) {
            await goalStorage.update(formData.savingsGoalId, {
              currentAmount: goal.currentAmount + parseFloat(formData.amount),
              updatedAt: createTimestamp()
            });
          }
        }
        
        // Update account or credit balance
        if (formData.paymentMethod === 'debit' && formData.accountId) {
          const account = accounts.find(a => a.id === formData.accountId);
          if (account) {
            const newBalance = formData.type === 'income' 
              ? account.balance + parseFloat(formData.amount)
              : account.balance - parseFloat(formData.amount);
            await accountStorage.update(formData.accountId, { balance: newBalance, updatedAt: createTimestamp() });
          }
        } else if (formData.paymentMethod === 'credit' && formData.creditSourceId) {
          const credit = creditSources.find(c => c.id === formData.creditSourceId);
          if (credit) {
            const newBalance = credit.currentBalance + parseFloat(formData.amount);
            await creditStorage.update(formData.creditSourceId, { currentBalance: newBalance, updatedAt: createTimestamp() });
          }
        }
      }
      onSave();
    } catch (error) {
      console.error('Error saving transaction:', error);
      console.error('Error details:', error instanceof Error ? error.message : error);
      alert(`Failed to save transaction: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 my-8">
        <h2 className="text-2xl font-bold mb-4">
          {transaction ? 'Edit Transaction' : 'Add Transaction'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Grocery Shopping"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₪)</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={(e) => setFormData({ ...formData, type: 'expense' })}
                  className="mr-2"
                />
                Expense
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={(e) => setFormData({ ...formData, type: 'income' })}
                  className="mr-2"
                />
                Income
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="debit"
                  checked={formData.paymentMethod === 'debit'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: 'debit', creditSourceId: '' })}
                  className="mr-2"
                />
                Debit (Bank Account)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="credit"
                  checked={formData.paymentMethod === 'credit'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: 'credit', accountId: '' })}
                  className="mr-2"
                />
                Credit
              </label>
            </div>
          </div>

          {formData.paymentMethod === 'debit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
              <select
                value={formData.accountId}
                onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select an account</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} - ₪{account.balance.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.paymentMethod === 'credit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Credit Source</label>
              <select
                value={formData.creditSourceId}
                onChange={(e) => setFormData({ ...formData, creditSourceId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select a credit source</option>
                {creditSources.map(credit => (
                  <option key={credit.id} value={credit.id}>
                    {credit.name} - Available: ₪{(credit.creditLimit - credit.currentBalance).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Recurring Transaction</span>
            </label>
          </div>

          {formData.isRecurring && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                <select
                  value={formData.recurringFrequency}
                  onChange={(e) => setFormData({ ...formData, recurringFrequency: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              {formData.recurringFrequency === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Day of Month</label>
                  <select
                    value={formData.dayOfMonth || 1}
                    onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Day of the month when this transaction occurs
                  </p>
                </div>
              )}
              {formData.recurringFrequency === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Every</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.customRecurringValue}
                      onChange={(e) => setFormData({ ...formData, customRecurringValue: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., 3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select
                      value={formData.customRecurringUnit}
                      onChange={(e) => setFormData({ ...formData, customRecurringUnit: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
                <input
                  type="date"
                  value={formData.recurringEndDate}
                  onChange={(e) => setFormData({ ...formData, recurringEndDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isJoint}
                onChange={(e) => setFormData({ ...formData, isJoint: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Joint Transaction</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Add to Savings Goal (Optional)</label>
            <select
              value={formData.savingsGoalId}
              onChange={(e) => setFormData({ ...formData, savingsGoalId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">None - Don't add to savings</option>
              {savingsGoals.map(goal => (
                <option key={goal.id} value={goal.id}>
                  {goal.name} (₪{goal.currentAmount.toFixed(2)} / ₪{goal.targetAmount.toFixed(2)})
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Transaction amount will be added to the selected savings goal
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Add any additional notes..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {transaction ? 'Update' : 'Add'} Transaction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
