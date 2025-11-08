import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { TrendingUp, Plus, Edit2, Trash2, DollarSign } from 'lucide-react';

interface Investment {
  id: string;
  userId: string;
  name: string;
  type: string;
  amount: number;
  currentValue: number;
  purchaseDate: Date;
  isJoint: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const getInvestments = (): Investment[] => {
  const data = localStorage.getItem('couple_fin_investments');
  if (!data) return [];
  return JSON.parse(data).map((i: any) => ({
    ...i,
    purchaseDate: new Date(i.purchaseDate),
    createdAt: new Date(i.createdAt),
    updatedAt: new Date(i.updatedAt),
  }));
};

const saveInvestments = (investments: Investment[]) => {
  localStorage.setItem('couple_fin_investments', JSON.stringify(investments));
};

export default function InvestmentsPage() {
  const { user, viewMode } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);

  useEffect(() => {
    loadInvestments();
  }, [user, viewMode]);

  const loadInvestments = () => {
    if (!user) return;
    const all = getInvestments();
    const filtered = viewMode === 'joint' 
      ? all.filter(i => i.userId === user.id || i.isJoint)
      : all.filter(i => i.userId === user.id);
    setInvestments(filtered);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this investment?')) {
      const all = getInvestments();
      saveInvestments(all.filter(i => i.id !== id));
      loadInvestments();
    }
  };

  const totalInvested = investments.reduce((sum, i) => sum + i.amount, 0);
  const totalCurrentValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
  const totalGainLoss = totalCurrentValue - totalInvested;
  const totalReturn = totalInvested > 0 ? ((totalGainLoss / totalInvested) * 100) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Investment Portfolio</h1>
        <p className="text-gray-600 mt-1">
          {viewMode === 'joint' ? 'All investments' : 'Your investments'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <p className="text-sm text-blue-700 mb-1">Total Invested</p>
          <p className="text-2xl font-bold text-blue-900">₪{totalInvested.toFixed(2)}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <p className="text-sm text-purple-700 mb-1">Current Value</p>
          <p className="text-2xl font-bold text-purple-900">₪{totalCurrentValue.toFixed(2)}</p>
        </div>
        <div className={`rounded-lg p-6 border ${totalGainLoss >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-sm mb-1 ${totalGainLoss >= 0 ? 'text-green-700' : 'text-red-700'}`}>Total Gain/Loss</p>
          <p className={`text-2xl font-bold ${totalGainLoss >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {totalGainLoss >= 0 ? '+' : ''}₪{totalGainLoss.toFixed(2)}
          </p>
        </div>
        <div className={`rounded-lg p-6 border ${totalReturn >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <p className={`text-sm mb-1 ${totalReturn >= 0 ? 'text-green-700' : 'text-red-700'}`}>Total Return</p>
          <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-900' : 'text-red-900'}`}>
            {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Add Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Investment
        </button>
      </div>

      {/* Investments List */}
      {investments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No investments tracked yet. Start building your portfolio!</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5" />
            Add Your First Investment
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {investments.map((investment) => (
            <InvestmentCard
              key={investment.id}
              investment={investment}
              onEdit={() => {
                setEditingInvestment(investment);
                setShowAddModal(true);
              }}
              onDelete={() => handleDelete(investment.id)}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <InvestmentModal
          investment={editingInvestment}
          onClose={() => {
            setShowAddModal(false);
            setEditingInvestment(null);
          }}
          onSave={() => {
            loadInvestments();
            setShowAddModal(false);
            setEditingInvestment(null);
          }}
        />
      )}
    </div>
  );
}

function InvestmentCard({ investment, onEdit, onDelete }: any) {
  const gainLoss = investment.currentValue - investment.amount;
  const returnPercent = (gainLoss / investment.amount) * 100;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-900">{investment.name}</h3>
          <p className="text-sm text-gray-600">{investment.type}</p>
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

      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Invested</span>
          <span className="font-semibold text-gray-900">₪{investment.amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Current Value</span>
          <span className="font-semibold text-gray-900">₪{investment.currentValue.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Gain/Loss</span>
          <span className={`font-semibold ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {gainLoss >= 0 ? '+' : ''}₪{gainLoss.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Return</span>
          <span className={`font-semibold ${returnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(2)}%
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Purchase Date</span>
          <span className="font-semibold text-gray-900">
            {new Date(investment.purchaseDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      {investment.isJoint && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
            Joint Investment
          </span>
        </div>
      )}
    </div>
  );
}

function InvestmentModal({ investment, onClose, onSave }: any) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: investment?.name || '',
    type: investment?.type || 'Stocks',
    amount: investment?.amount?.toString() || '',
    currentValue: investment?.currentValue?.toString() || '',
    purchaseDate: investment?.purchaseDate ? new Date(investment.purchaseDate).toISOString().split('T')[0] : '',
    isJoint: investment?.isJoint ?? true,
  });

  const investmentTypes = ['Stocks', 'Bonds', 'Mutual Funds', 'ETFs', 'Real Estate', 'Cryptocurrency', 'Other'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newInvestment: Investment = {
      id: investment?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      name: formData.name,
      type: formData.type,
      amount: parseFloat(formData.amount),
      currentValue: parseFloat(formData.currentValue),
      purchaseDate: new Date(formData.purchaseDate),
      isJoint: formData.isJoint,
      createdAt: investment?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    const all = getInvestments();
    if (investment) {
      const index = all.findIndex(i => i.id === investment.id);
      all[index] = newInvestment;
    } else {
      all.push(newInvestment);
    }
    saveInvestments(all);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 my-8">
        <h2 className="text-2xl font-bold mb-4">
          {investment ? 'Edit Investment' : 'Add Investment'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Investment Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Apple Stock, S&P 500 ETF"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              {investmentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Invested (₪)</label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Value (₪)</label>
            <input
              type="number"
              step="0.01"
              value={formData.currentValue}
              onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
            <input
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
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
              <span className="text-sm font-medium text-gray-700">Joint Investment</span>
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
              {investment ? 'Update' : 'Add'} Investment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
