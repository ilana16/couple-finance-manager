import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, CreditCard, DollarSign, Calendar } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { creditStorage, accountStorage, CreditSource, Account } from '../lib/storage';

export default function CreditPage() {
  const { user, viewMode } = useAuth();
  const [creditSources, setCreditSources] = useState<CreditSource[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCredit, setEditingCredit] = useState<CreditSource | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payingCredit, setPayingCredit] = useState<CreditSource | null>(null);

  useEffect(() => {
    loadData();
  }, [user, viewMode]);

  const loadData = () => {
    if (!user) return;
    const includeJoint = viewMode === 'joint';
    const userCredits = creditStorage.getByUser(user.id, includeJoint);
    const userAccounts = accountStorage.getByUser(user.id, includeJoint);
    setCreditSources(userCredits);
    setAccounts(userAccounts);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      creditStorage.delete(id);
      loadData();
    }
  };

  const handleEdit = (credit: CreditSource) => {
    setEditingCredit(credit);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCredit(null);
    loadData();
  };

  const handlePayment = (credit: CreditSource) => {
    setPayingCredit(credit);
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = () => {
    setShowPaymentModal(false);
    setPayingCredit(null);
    loadData();
  };

  const totalCreditLimit = creditSources.reduce((sum, c) => sum + c.creditLimit, 0);
  const totalBalance = creditSources.reduce((sum, c) => sum + c.currentBalance, 0);
  const totalAvailable = creditSources.reduce((sum, c) => sum + c.availableCredit, 0);
  const utilizationRate = totalCreditLimit > 0 ? (totalBalance / totalCreditLimit) * 100 : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Credit</h1>
          <p className="text-gray-600 mt-1">
            {viewMode === 'joint' ? 'All credit sources' : 'Your credit sources'}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Credit Source
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Total Credit Limit</p>
          <p className="text-2xl font-bold text-gray-900">₪{totalCreditLimit.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Current Balance</p>
          <p className="text-2xl font-bold text-red-600">₪{totalBalance.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Available Credit</p>
          <p className="text-2xl font-bold text-green-600">₪{totalAvailable.toFixed(2)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-600 mb-1">Utilization Rate</p>
          <p className={`text-2xl font-bold ${utilizationRate > 70 ? 'text-red-600' : utilizationRate > 50 ? 'text-yellow-600' : 'text-green-600'}`}>
            {utilizationRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Credit Sources List */}
      {creditSources.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No credit sources yet</h3>
          <p className="text-gray-600 mb-4">Add your credit cards and lines of credit to track your available credit</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Add Credit Source
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {creditSources.map(credit => {
            const utilization = (credit.currentBalance / credit.creditLimit) * 100;
            const daysUntilPayment = credit.paymentDayOfMonth ? 
              (() => {
                const today = new Date();
                const currentDay = today.getDate();
                const paymentDay = credit.paymentDayOfMonth;
                let daysLeft = paymentDay - currentDay;
                if (daysLeft < 0) {
                  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, paymentDay);
                  daysLeft = Math.ceil((nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                }
                return daysLeft;
              })() : null;

            return (
              <div key={credit.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{credit.name}</h3>
                      <p className="text-sm text-gray-600 capitalize">{credit.type.replace(/_/g, ' ')}</p>
                      {credit.institution && (
                        <p className="text-xs text-gray-500 mt-1">{credit.institution}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(credit)}
                        className="text-blue-600 hover:text-blue-900 p-1"
                        title="Edit credit source"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(credit.id, credit.name)}
                        className="text-red-600 hover:text-red-900 p-1"
                        title="Delete credit source"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Credit Limit</p>
                      <p className="text-lg font-semibold text-gray-900">₪{credit.creditLimit.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Current Balance</p>
                      <p className="text-lg font-semibold text-red-600">₪{credit.currentBalance.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Available</p>
                      <p className="text-lg font-semibold text-green-600">₪{credit.availableCredit.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Utilization Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Utilization</span>
                      <span className={utilization > 70 ? 'text-red-600 font-semibold' : ''}>{utilization.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${
                          utilization > 70 ? 'bg-red-500' : utilization > 50 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Payment Day:</span>
                      <span className="font-medium">
                        {credit.paymentDayOfMonth} of each month
                        {daysUntilPayment !== null && (
                          <span className="text-xs text-gray-500 ml-2">
                            ({daysUntilPayment} day{daysUntilPayment !== 1 ? 's' : ''} left)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Payment Option:</span>
                      <span className="font-medium capitalize">
                        {credit.paymentOption === 'pay_all' ? 'Pay Full Balance' : `Custom (₪${credit.customPaymentAmount?.toFixed(2) || '0.00'})`}
                      </span>
                    </div>
                    {credit.interestRate && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Interest Rate:</span>
                        <span className="font-medium">{credit.interestRate}%</span>
                      </div>
                    )}
                  </div>

                  {/* Payment Button */}
                  {credit.currentBalance > 0 && (
                    <button
                      onClick={() => handlePayment(credit)}
                      className="w-full mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center justify-center gap-2"
                    >
                      <DollarSign className="w-4 h-4" />
                      Make Payment
                    </button>
                  )}

                  {/* Tags */}
                  <div className="flex items-center gap-2 mt-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      credit.isJoint 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {credit.isJoint ? 'Joint' : 'Individual'}
                    </span>
                    {credit.accountNumber && (
                      <span className="text-xs text-gray-500">
                        ****{credit.accountNumber.slice(-4)}
                      </span>
                    )}
                  </div>

                  {credit.notes && (
                    <p className="text-xs text-gray-600 mt-3 italic">{credit.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <CreditModal
          credit={editingCredit}
          onClose={handleCloseModal}
          userId={user?.id || ''}
        />
      )}

      {showPaymentModal && payingCredit && (
        <PaymentModal
          credit={payingCredit}
          accounts={accounts}
          onClose={handleClosePaymentModal}
        />
      )}
    </div>
  );
}

// Credit Modal Component
function CreditModal({ credit, onClose, userId }: { credit: CreditSource | null; onClose: () => void; userId: string }) {
  const [formData, setFormData] = useState({
    name: credit?.name || '',
    type: credit?.type || 'credit_card' as 'credit_card' | 'line_of_credit' | 'loan' | 'other',
    creditLimit: credit?.creditLimit || 0,
    currentBalance: credit?.currentBalance || 0,
    interestRate: credit?.interestRate || 0,
    paymentDayOfMonth: credit?.paymentDayOfMonth || 1,
    paymentOption: credit?.paymentOption || 'pay_all' as 'pay_all' | 'custom_amount',
    customPaymentAmount: credit?.customPaymentAmount || 0,
    institution: credit?.institution || '',
    accountNumber: credit?.accountNumber || '',
    isJoint: credit?.isJoint || false,
    notes: credit?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (credit) {
      creditStorage.update(credit.id, formData);
    } else {
      creditStorage.create({
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
            {credit ? 'Edit Credit Source' : 'Add New Credit Source'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Visa Card"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="credit_card">Credit Card</option>
                  <option value="line_of_credit">Line of Credit</option>
                  <option value="loan">Loan</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Credit Limit (₪) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Balance (₪) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.currentBalance}
                  onChange={(e) => setFormData({ ...formData, currentBalance: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Day of Month (1-31) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={formData.paymentDayOfMonth}
                  onChange={(e) => setFormData({ ...formData, paymentDayOfMonth: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Option *
                </label>
                <select
                  value={formData.paymentOption}
                  onChange={(e) => setFormData({ ...formData, paymentOption: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="pay_all">Pay Full Balance</option>
                  <option value="custom_amount">Custom Amount</option>
                </select>
              </div>

              {formData.paymentOption === 'custom_amount' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Custom Payment Amount (₪)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.customPaymentAmount}
                    onChange={(e) => setFormData({ ...formData, customPaymentAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Institution
                </label>
                <input
                  type="text"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Bank Hapoalim"
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
                placeholder="Optional notes"
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
                This is a joint credit source
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium"
              >
                {credit ? 'Save Changes' : 'Add Credit Source'}
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

// Payment Modal Component
function PaymentModal({ credit, accounts, onClose }: { credit: CreditSource; accounts: Account[]; onClose: () => void }) {
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const paymentAmount = credit.paymentOption === 'pay_all' 
    ? credit.currentBalance 
    : (credit.customPaymentAmount || 0);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);
  const canAfford = selectedAccount ? selectedAccount.balance >= paymentAmount : false;

  const handlePayment = () => {
    if (!selectedAccountId || !canAfford) return;

    const success = creditStorage.makePayment(credit.id, selectedAccountId);
    
    if (success) {
      alert(`Payment of ₪${paymentAmount.toFixed(2)} successful!`);
      onClose();
    } else {
      alert('Payment failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4">Make Payment</h2>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-1">Paying to</p>
            <p className="text-lg font-semibold text-gray-900">{credit.name}</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">₪{paymentAmount.toFixed(2)}</p>
            <p className="text-xs text-gray-600 mt-1">
              {credit.paymentOption === 'pay_all' ? 'Full Balance' : 'Custom Amount'}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pay from Account
            </label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select an account</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} - ₪{account.balance.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {selectedAccount && !canAfford && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-800">
                Insufficient funds. Account balance: ₪{selectedAccount.balance.toFixed(2)}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handlePayment}
              disabled={!selectedAccountId || !canAfford}
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Confirm Payment
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
