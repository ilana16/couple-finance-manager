import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { Bell, Plus, Edit2, Trash2, Check, Clock } from 'lucide-react';

interface Reminder {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  dueDate: Date;
  priority: 'low' | 'medium' | 'high';
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const getReminders = (): Reminder[] => {
  const data = localStorage.getItem('couple_fin_reminders');
  if (!data) return [];
  return JSON.parse(data).map((r: any) => ({
    ...r,
    dueDate: new Date(r.dueDate),
    createdAt: new Date(r.createdAt),
    updatedAt: new Date(r.updatedAt),
  }));
};

const saveReminders = (reminders: Reminder[]) => {
  localStorage.setItem('couple_fin_reminders', JSON.stringify(reminders));
};

export default function RemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active');

  useEffect(() => {
    loadReminders();
  }, [user]);

  const loadReminders = () => {
    if (!user) return;
    const all = getReminders();
    setReminders(all.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }));
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this reminder?')) {
      const all = getReminders();
      saveReminders(all.filter(r => r.id !== id));
      loadReminders();
    }
  };

  const toggleComplete = (id: string) => {
    const all = getReminders();
    const reminder = all.find(r => r.id === id);
    if (reminder) {
      reminder.isCompleted = !reminder.isCompleted;
      reminder.updatedAt = new Date();
      saveReminders(all);
      loadReminders();
    }
  };

  const filteredReminders = reminders.filter(r => {
    if (filter === 'active') return !r.isCompleted;
    if (filter === 'completed') return r.isCompleted;
    return true;
  });

  const activeCount = reminders.filter(r => !r.isCompleted).length;
  const overdueCount = reminders.filter(r => !r.isCompleted && new Date(r.dueDate) < new Date()).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Reminders & Tasks</h1>
        <p className="text-gray-600 mt-1">Never miss a bill or important financial task</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <p className="text-sm text-blue-700 mb-1">Active Reminders</p>
          <p className="text-2xl font-bold text-blue-900">{activeCount}</p>
        </div>
        <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
          <p className="text-sm text-orange-700 mb-1">Overdue</p>
          <p className="text-2xl font-bold text-orange-900">{overdueCount}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
          <p className="text-sm text-green-700 mb-1">Completed</p>
          <p className="text-2xl font-bold text-green-900">{reminders.filter(r => r.isCompleted).length}</p>
        </div>
      </div>

      {/* Filter and Add */}
      <div className="flex gap-4 mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('active')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'active'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Reminder
        </button>
      </div>

      {/* Reminders List */}
      {filteredReminders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">
            {filter === 'completed' 
              ? 'No completed reminders yet'
              : filter === 'active'
              ? 'No active reminders. Add one to get started!'
              : 'No reminders yet. Add your first reminder!'}
          </p>
          {filter !== 'completed' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Add Your First Reminder
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onEdit={() => {
                setEditingReminder(reminder);
                setShowAddModal(true);
              }}
              onDelete={() => handleDelete(reminder.id)}
              onToggleComplete={() => toggleComplete(reminder.id)}
            />
          ))}
        </div>
      )}

      {showAddModal && (
        <ReminderModal
          reminder={editingReminder}
          onClose={() => {
            setShowAddModal(false);
            setEditingReminder(null);
          }}
          onSave={() => {
            loadReminders();
            setShowAddModal(false);
            setEditingReminder(null);
          }}
        />
      )}
    </div>
  );
}

function ReminderCard({ reminder, onEdit, onDelete, onToggleComplete }: any) {
  const isOverdue = !reminder.isCompleted && new Date(reminder.dueDate) < new Date();
  const daysUntilDue = Math.ceil((new Date(reminder.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800 border-gray-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-red-100 text-red-800 border-red-200',
  };

  return (
    <div className={`bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow ${
      reminder.isCompleted ? 'opacity-60' : ''
    }`}>
      <div className="flex items-start gap-4">
        <button
          onClick={onToggleComplete}
          className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            reminder.isCompleted
              ? 'bg-green-500 border-green-500'
              : 'border-gray-300 hover:border-blue-500'
          }`}
        >
          {reminder.isCompleted && <Check className="w-4 h-4 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${
                reminder.isCompleted ? 'line-through text-gray-500' : 'text-gray-900'
              }`}>
                {reminder.title}
              </h3>
              {reminder.description && (
                <p className="text-sm text-gray-600 mt-1">{reminder.description}</p>
              )}
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

          <div className="flex items-center gap-3 text-sm">
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${priorityColors[reminder.priority]}`}>
              {reminder.priority} priority
            </span>
            <span className={`flex items-center gap-1 ${
              isOverdue ? 'text-red-600 font-semibold' : 'text-gray-600'
            }`}>
              <Clock className="w-4 h-4" />
              {isOverdue 
                ? `Overdue by ${Math.abs(daysUntilDue)} days`
                : daysUntilDue === 0
                ? 'Due today'
                : daysUntilDue === 1
                ? 'Due tomorrow'
                : `Due in ${daysUntilDue} days`}
            </span>
            <span className="text-gray-500">
              {new Date(reminder.dueDate).toLocaleDateString()}
            </span>
            <span className="text-gray-500">
              by {reminder.userName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReminderModal({ reminder, onClose, onSave }: any) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: reminder?.title || '',
    description: reminder?.description || '',
    dueDate: reminder?.dueDate ? new Date(reminder.dueDate).toISOString().split('T')[0] : '',
    priority: reminder?.priority || 'medium' as 'low' | 'medium' | 'high',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newReminder: Reminder = {
      id: reminder?.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId: user.id,
      userName: user.name,
      title: formData.title,
      description: formData.description,
      dueDate: new Date(formData.dueDate),
      priority: formData.priority,
      isCompleted: reminder?.isCompleted || false,
      createdAt: reminder?.createdAt || new Date(),
      updatedAt: new Date(),
    };

    const all = getReminders();
    if (reminder) {
      const index = all.findIndex(r => r.id === reminder.id);
      all[index] = newReminder;
    } else {
      all.push(newReminder);
    }
    saveReminders(all);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 my-8">
        <h2 className="text-2xl font-bold mb-4">
          {reminder ? 'Edit Reminder' : 'Add Reminder'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Pay electricity bill"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Add any additional details..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
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
              {reminder ? 'Update' : 'Add'} Reminder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
