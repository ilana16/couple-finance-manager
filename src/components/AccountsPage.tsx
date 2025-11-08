import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, DollarSign, Building2 } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { accountStorage, Account } from '../lib/storage';

export default function AccountsPage() {
  const { user, viewMode } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  useEffect(() => {
    loadAccounts();
  }, [user, viewMode]);

  const loadAccounts = () => {
    if (!user) return;
    const includeJoint = viewMode === 'joint';
    const userAccounts = accountStorage.getByUser(user.id, includeJoint);
    setAccounts(userAccounts);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      accountStorage.delete(id);
      loadAccounts();
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAccount(null);
    loadAccounts();
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Accounts</h1>
          <p className="text-gray-600 mt-1">
            {viewMode === 'joint' ? 'All accounts' : 'Your accounts'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Account
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm mb-1">Total Balance</p>
            <p className="text-4xl font-bold">₪{totalBalance.toFixed(2)}</p>
            <p className="text-blue-100 text-sm mt-2">Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
          </div>
          <DollarSign className="w-16 h-16 text-blue-200 opacity-50" />
        </div>
      </div>

      {/* Accounts List */}
      {accounts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No accounts yet</h3>
          <p className="text-gray-600 mb-4">Add your first bank account to start tracking your finances</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map(account => (
            <div key={account.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{account.type.replace('_', ' ')}</p>
                    {account.institution && (
                      <p className="text-xs text-gray-500 mt-1">{account.institution}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(account)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Edit account"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id, account.name)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Balance</span>
                    <span className={`text-2xl font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₪{account.balance.toFixed(2)}
                    </span>
                  </div>
                  
                  {account.accountNumber && (
                    <div className="text-xs text-gray-500 mt-2">
                      Account: ****{account.accountNumber.slice(-4)}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      account.isJoint 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {account.isJoint ? 'Joint' : 'Individual'}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {account.currency}
                    </span>
                  </div>
                  
                  {account.notes && (
                    <p className="text-xs text-gray-600 mt-3 italic">{account.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <AccountModal
          account={editingAccount}
          onClose={handleCloseModal}
          userId={user?.id || ''}
        />
      )}
    </div>
  );
}

// Account Modal Component
function AccountModal({ account, onClose, userId }: { account: Account | null; onClose: () => void; userId: string }) {
  const [formData, setFormData] = useState({
    name: account?.name || '',
    type: account?.type || 'checking' as 'checking' | 'savings' | 'cash' | 'other',
    balance: account?.balance || 0,
    currency: account?.currency || 'ILS',
    institution: account?.institution || '',
    accountNumber: account?.accountNumber || '',
    isJoint: account?.isJoint || false,
    notes: account?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (account) {
      // Update existing account
      accountStorage.update(account.id, formData);
    } else {
      // Create new account
      accountStorage.create({
        ...formData,
        userId,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {account ? 'Edit Account' : 'Add New Account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Main Checking"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Balance (₪) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <input
                  type="text"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="ILS, USD, EUR"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Institution
                </label>
                <input
                  type="text"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Bank Leumi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Last 4 digits"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Optional notes about this account"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isJoint"
                checked={formData.isJoint}
                onChange={(e) => setFormData({ ...formData, isJoint: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isJoint" className="ml-2 text-sm text-gray-700">
                This is a joint account
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium"
              >
                {account ? 'Save Changes' : 'Add Account'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
