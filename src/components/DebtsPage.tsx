import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { CreditCard, Plus, Edit2, Trash2, Calculator } from 'lucide-react';

interface Debt {
  id: string;
  userId: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: Date;
  isJoint: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Simple storage functions
const getDebts = (): Debt[] => {
  const data = localStorage.getItem('couple_fin_debts');
  if (!data) return [];
  return JSON.parse(data).map((d: any) => ({
    ...d,
    dueDate: new Date(d.dueDate),
    createdAt: new Date(d.createdAt),
    updatedAt: new Date(d.updatedAt),
  }));
};

const saveDebts = (debts: Debt[]) => {
  localStorage.setItem('couple_fin_debts', JSON.stringify(debts));
};

export default function DebtsPage() {
  const { user, viewMode } = useAuth();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);

  useEffect(() => {
    loadDebts();
  }, [user, viewMode]);

  const loadDebts = () => {
    if (!user) return;
    const all = getDebts();
    const filtered = viewMode === 'joint' 
      ? all // In joint mode, show ALL debts from both partners
      : all.filter(d => d.userId === user.id);
    setDebts(filtered);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this debt?')) {
      const all = getDebts();
      saveDebts(all.filter(d => d.id !== id));
      loadDebts();
    }
  };

  const totalDebt = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
  const totalPaid = debts.reduce((sum, d) => sum + (d.totalAmount - d.remainingAmount), 0);
  const totalOriginal = debts.reduce((sum, d) => sum + d.totalAmount, 0);
  const overallProgress = totalOriginal > 0 ? (totalPaid / totalOriginal) * 100 : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Debt Management</h1>
        <p className="text-gray-600 mt-1">
          {viewMode === 'joint' ? 'All debts' : 'Your debts'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 rounded-lg p-6 border border-red-200">
          <p className="text-sm text-red-700 mb-1">Total Remaining</p>
          <p className="text-2xl font-bold text-red-900">₪{totalDebt.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <p className="text-sm text-green-700 mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-green-900">₪{totalPaid.toFixed(2)}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <p className="text-sm text-blue-700 mb-1">Progress</p>
          <p className="text-2xl font-bold text-blue-900">{overallProgress.toFixed(1)}%</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Debt
        </button>
        <button
          onClick={() => setShowCalculator(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Calculator className="w-5 h-5" />
          Payoff Calculator
        </button>
      </div>

      {/* Debts List */}
      {debts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No debts tracked. Great job staying debt-free!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {debts.map((debt) => (
            <DebtCard
              key={debt.id}
              debt={debt}
              onEdit={() => {
                setEditingDebt(debt);
                setShowAddModal(true);
              }}
              onDelete={() => handleDelete(debt.id)}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <DebtModal
          debt={editingDebt}
          onClose={() => {
            setShowAddModal(false);
            setEditingDebt(null);
          }}
          onSave={() => {
            loadDebts();
            setShowAddModal(false);
            setEditingDebt(null);
          }}
        />
      )}

      {showCalculator && (
        <PayoffCalculator onClose={() => setShowCalculator(false)} />
      )}
    </div>
  );
}

function DebtCard({ debt, onEdit, onDelete }: any) {
  const progress = ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100;
  const monthsToPayoff = Math.ceil(debt.remainingAmount / debt.minimumPayment);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{debt.name}</h3>
          <p className="text-sm text-gray-600">Interest Rate: {debt.interestRate}%</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="text-blue-600 hover:text-blue-900">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="text-red-600 hover:text-red-900">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Payoff Progress</span>
          <span className="font-semibold text-gray-900">{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-500 h-full rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Remaining</span>
          <span className="font-semibold text-red-600">₪{debt.remainingAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Original Amount</span>
          <span className="font-semibold text-gray-900">₪{debt.totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Minimum Payment</span>
          <span className="font-semibold text-gray-900">₪{debt.minimumPayment.toFixed(2)}/mo</span>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600">Next Due Date</span>
          <span className="font-semibold text-gray-900">
            {new Date(debt.dueDate).toLocaleDateString()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Est. Payoff Time</span>
          <span className="font-semibold text-gray-900">{monthsToPayoff} months</span>
        </div>
      </div>

      {debt.isJoint && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            Joint Debt
          </span>
        </div>
      )}
    </div>
  );
}

function DebtModal({ debt, onClose, onSave }: any) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: debt?.name || '',
    totalAmount: debt?.totalAmount?.toString() || '',
    remainingAmount: debt?.remainingAmount?.toString() || '',
    interestRate: debt?.interestRate?.toString() || '',
    minimumPayment: debt?.minimumPayment?.toString() || '',
    dueDate: debt?.dueDate ? new Date(debt.dueDate).toISOString().split('T')[0] : '',
    isJoint: debt?.isJoint ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newDebt: Debt = {
      id: debt?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      name: formData.name,
      totalAmount: parseFloat(formData.totalAmount),
      remainingAmount: parseFloat(formData.remainingAmount),
      interestRate: parseFloat(formData.interestRate),
      minimumPayment: parseFloat(formData.minimumPayment),
      dueDate: new Date(formData.dueDate),
      isJoint: formData.isJoint,
      createdAt: debt?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    const all = getDebts();
    if (debt) {
      const index = all.findIndex(d => d.id === debt.id);
      all[index] = newDebt;
    } else {
      all.push(newDebt);
    }
    saveDebts(all);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {debt ? 'Edit Debt' : 'Add Debt'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Debt Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Credit Card, Student Loan"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Original Amount (₪)</label>
            <input
              type="number"
              step="0.01"
              value={formData.totalAmount}
              onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remaining Amount (₪)</label>
            <input
              type="number"
              step="0.01"
              value={formData.remainingAmount}
              onChange={(e) => setFormData({ ...formData, remainingAmount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
            <input
              type="number"
              step="0.01"
              value={formData.interestRate}
              onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Payment (₪/month)</label>
            <input
              type="number"
              step="0.01"
              value={formData.minimumPayment}
              onChange={(e) => setFormData({ ...formData, minimumPayment: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Next Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isJoint}
                onChange={(e) => setFormData({ ...formData, isJoint: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Joint Debt</span>
            </label>
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
              {debt ? 'Update' : 'Add'} Debt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PayoffCalculator({ onClose }: any) {
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [payment, setPayment] = useState('');
  const [result, setResult] = useState<any>(null);

  const calculate = () => {
    const principal = parseFloat(amount);
    const monthlyRate = parseFloat(rate) / 100 / 12;
    const monthlyPayment = parseFloat(payment);

    if (monthlyPayment <= principal * monthlyRate) {
      alert('Payment must be greater than monthly interest!');
      return;
    }

    const months = Math.ceil(Math.log(monthlyPayment / (monthlyPayment - principal * monthlyRate)) / Math.log(1 + monthlyRate));
    const totalPaid = months * monthlyPayment;
    const totalInterest = totalPaid - principal;

    setResult({ months, totalPaid, totalInterest });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Debt Payoff Calculator</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Debt Amount (₪)</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="10000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (% per year)</label>
            <input
              type="number"
              step="0.01"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="15"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Payment (₪)</label>
            <input
              type="number"
              step="0.01"
              value={payment}
              onChange={(e) => setPayment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="500"
            />
          </div>

          <button
            onClick={calculate}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Calculate
          </button>
        </div>

        {result && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-blue-900 mb-3">Results:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Time to Pay Off:</span>
                <span className="font-semibold text-blue-900">{result.months} months ({(result.months / 12).toFixed(1)} years)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Total Paid:</span>
                <span className="font-semibold text-blue-900">₪{result.totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Total Interest:</span>
                <span className="font-semibold text-red-600">₪{result.totalInterest.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          Close
        </button>
      </div>
    </div>
  );
}
