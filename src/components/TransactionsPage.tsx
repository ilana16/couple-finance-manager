import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { transactionStorage, accountStorage, creditStorage, Transaction, Account, CreditSource } from '../lib/storage';
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

  useEffect(() => {
    loadTransactions();
  }, [user, viewMode]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, filterType, filterCategory]);

  const loadTransactions = () => {
    if (!user) return;
    const includeJoint = viewMode === 'joint';
    const data = transactionStorage.getByUser(user.id, includeJoint);
    setTransactions(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      transactionStorage.delete(id);
      loadTransactions();
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
  });

  useEffect(() => {
    if (!user) return;
    const includeJoint = viewMode === 'joint';
    setAccounts(accountStorage.getByUser(user.id, includeJoint));
    setCreditSources(creditStorage.getByUser(user.id, includeJoint));
  }, [user, viewMode]);

  // Get categories from Settings based on transaction type
  const expenseCategories = JSON.parse(localStorage.getItem('couple_fin_expense_categories') || '[]');
  const incomeCategories = JSON.parse(localStorage.getItem('couple_fin_income_categories') || '[]');
  const categories = formData.type === 'income' ? incomeCategories : expenseCategories;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const data = {
      userId: user.id,
      date: new Date(formData.date),
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
      recurringEndDate: formData.isRecurring && formData.recurringEndDate ? new Date(formData.recurringEndDate) : undefined,
      isJoint: formData.isJoint,
      notes: formData.notes,
    };

    if (transaction) {
      transactionStorage.update(transaction.id, data);
    } else {
      const newTransaction = transactionStorage.create(data);
      
      // Update account or credit balance
      if (formData.paymentMethod === 'debit' && formData.accountId) {
        accountStorage.updateBalance(formData.accountId, parseFloat(formData.amount), formData.type === 'income');
      } else if (formData.paymentMethod === 'credit' && formData.creditSourceId) {
        creditStorage.updateBalance(formData.creditSourceId, parseFloat(formData.amount), false);
      }
    }

    onSave();
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
                    {credit.name} - Available: ₪{credit.availableCredit.toFixed(2)}
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
