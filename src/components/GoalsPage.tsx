import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { goalStorage, SavingsGoal, createTimestamp } from '../lib/storage-firestore';
import { Target, Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';

export default function GoalsPage() {
  const { user, viewMode } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGoals();
  }, [user, viewMode]);

  const loadGoals = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const includeJoint = viewMode === 'joint';
      const data = await goalStorage.getByUser(user.id, includeJoint);
      setGoals(data.sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()));
    } catch (error) {
      console.error('Error loading goals:', error);
      alert('Failed to load goals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      try {
        await goalStorage.delete(id);
        await loadGoals();
      } catch (error) {
        console.error('Error deleting goal:', error);
        alert('Failed to delete goal. Please try again.');
      }
    }
  };

  const totalTargetAmount = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const totalCurrentAmount = goals.reduce((sum, g) => sum + g.currentAmount, 0);
  const overallProgress = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading goals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Savings Goals</h1>
        <p className="text-gray-600 mt-1">
          {viewMode === 'joint' ? 'All savings goals' : 'Your savings goals'}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <p className="text-sm text-blue-700 mb-1">Total Target</p>
          <p className="text-2xl font-bold text-blue-900">₪{totalTargetAmount.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <p className="text-sm text-green-700 mb-1">Total Saved</p>
          <p className="text-2xl font-bold text-green-900">₪{totalCurrentAmount.toFixed(2)}</p>
        </div>
        <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
          <p className="text-sm text-purple-700 mb-1">Overall Progress</p>
          <p className="text-2xl font-bold text-purple-900">{overallProgress.toFixed(1)}%</p>
        </div>
      </div>

      {/* Add Goal Button */}
      <div className="mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Savings Goal
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No savings goals yet. Start by adding your first goal!</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={() => {
                setEditingGoal(goal);
                setShowAddModal(true);
              }}
              onDelete={() => handleDelete(goal.id)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <GoalModal
          goal={editingGoal}
          onClose={() => {
            setShowAddModal(false);
            setEditingGoal(null);
          }}
          onSave={() => {
            loadGoals();
            setShowAddModal(false);
            setEditingGoal(null);
          }}
        />
      )}
    </div>
  );
}

// Goal Card Component
interface GoalCardProps {
  goal: SavingsGoal;
  onEdit: () => void;
  onDelete: () => void;
}

function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const progress = (goal.currentAmount / goal.targetAmount) * 100;
  const remaining = goal.targetAmount - goal.currentAmount;
  const daysRemaining = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800 border-gray-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{goal.name}</h3>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${priorityColors[goal.priority]}`}>
              {goal.priority} priority
            </span>
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

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold text-gray-900">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                progress >= 100 ? 'bg-green-500' : progress >= 75 ? 'bg-blue-500' : progress >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Amounts */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Current</span>
            <span className="font-semibold text-gray-900">₪{goal.currentAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Target</span>
            <span className="font-semibold text-gray-900">₪{goal.targetAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Remaining</span>
            <span className="font-semibold text-blue-600">₪{remaining.toFixed(2)}</span>
          </div>
        </div>

        {/* Target Date */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Target Date</span>
            <span className="font-semibold text-gray-900">
              {new Date(goal.targetDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">Days Remaining</span>
            <span className={`font-semibold ${daysRemaining < 30 ? 'text-red-600' : 'text-gray-900'}`}>
              {daysRemaining > 0 ? daysRemaining : 'Overdue'}
            </span>
          </div>
        </div>

        {goal.isJoint && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
              Joint Goal
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Goal Modal Component
interface GoalModalProps {
  goal: SavingsGoal | null;
  onClose: () => void;
  onSave: () => void;
}

function GoalModal({ goal, onClose, onSave }: GoalModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: goal?.name || '',
    targetAmount: goal?.targetAmount?.toString() || '',
    currentAmount: goal?.currentAmount?.toString() || '0',
    targetDate: goal?.targetDate ? new Date(goal.targetDate).toISOString().split('T')[0] : '',
    priority: goal?.priority || 'medium' as 'low' | 'medium' | 'high',
    isJoint: goal?.isJoint ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const data = {
      userId: user.id,
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount),
      targetDate: new Date(formData.targetDate).toISOString(),
      priority: formData.priority,
      isJoint: formData.isJoint,
      createdAt: goal?.createdAt || createTimestamp(),
      updatedAt: createTimestamp(),
    };

    try {
      if (goal) {
        await goalStorage.update(goal.id, data);
      } else {
        await goalStorage.create(data);
      }
      onSave();
    } catch (error) {
      console.error('Error saving goal:', error);
      alert('Failed to save goal. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 my-8">
        <h2 className="text-2xl font-bold mb-4">
          {goal ? 'Edit Savings Goal' : 'Add Savings Goal'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Goal Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Emergency Fund, Vacation, New Car"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Amount (₪)</label>
            <input
              type="number"
              step="0.01"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Amount (₪)</label>
            <input
              type="number"
              step="0.01"
              value={formData.currentAmount}
              onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isJoint}
                onChange={(e) => setFormData({ ...formData, isJoint: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">Joint Goal</span>
            </label>
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
              {goal ? 'Update' : 'Add'} Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
