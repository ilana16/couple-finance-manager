import React from 'react';
import { EnhancedTransaction } from '../lib/enhanced-schema';
import {
  calculatePendingReimbursements,
  getReimbursementStatusLabel,
  getReimbursementStatusColor,
  isReimbursementOverdue,
} from '../lib/reimbursementUtils';

interface ReimbursementWidgetProps {
  transactions: EnhancedTransaction[];
  onViewDetails?: () => void;
}

export default function ReimbursementWidget({ transactions, onViewDetails }: ReimbursementWidgetProps) {
  const { totalPending, count, oldestDate, transactions: pendingTransactions } = 
    calculatePendingReimbursements(transactions);
  
  const overdueCount = pendingTransactions.filter(t => isReimbursementOverdue(t, 30)).length;
  
  if (count === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-2">Pending Reimbursements</h3>
        <div className="text-gray-500 text-center py-4">
          No pending reimbursements
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold">Pending Reimbursements</h3>
        {overdueCount > 0 && (
          <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded">
            {overdueCount} Overdue
          </span>
        )}
      </div>
      
      {/* Summary */}
      <div className="mb-4">
        <div className="text-3xl font-bold text-yellow-600 mb-1">
          ₪{totalPending.toFixed(2)}
        </div>
        <div className="text-sm text-gray-600">
          {count} pending reimbursement{count !== 1 ? 's' : ''}
        </div>
        {oldestDate && (
          <div className="text-xs text-gray-500 mt-1">
            Oldest: {oldestDate.toLocaleDateString()}
          </div>
        )}
      </div>
      
      {/* Recent Pending Items */}
      <div className="space-y-2 mb-4">
        {pendingTransactions.slice(0, 3).map(transaction => {
          const isOverdue = isReimbursementOverdue(transaction, 30);
          const daysSince = Math.floor(
            (new Date().getTime() - transaction.date.getTime()) / (1000 * 60 * 60 * 24)
          );
          
          return (
            <div
              key={transaction.id}
              className={`p-3 rounded border ${
                isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="font-medium text-sm">{transaction.description}</div>
                  <div className="text-xs text-gray-600">{transaction.category}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {daysSince} days ago
                    {isOverdue && <span className="text-red-600 ml-2">• Overdue</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">₪{transaction.amount.toFixed(2)}</div>
                  <div
                    className="text-xs font-medium"
                    style={{ color: getReimbursementStatusColor(transaction.reimbursementStatus) }}
                  >
                    {getReimbursementStatusLabel(transaction.reimbursementStatus)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={onViewDetails}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium"
        >
          View All
        </button>
        <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium">
          Mark Received
        </button>
      </div>
    </div>
  );
}

// Reimbursement Management Page Component
export function ReimbursementManagementPage() {
  const [filter, setFilter] = React.useState<'all' | 'pending' | 'received' | 'denied'>('all');
  
  // Mock data - would come from API
  const transactions: EnhancedTransaction[] = [
    {
      id: '1',
      userId: 'user1',
      date: new Date(2025, 9, 15),
      description: 'Medical prescription',
      amount: 1300,
      category: 'Health/Medical',
      account: 'checking',
      type: 'expense',
      status: 'actual',
      currency: 'ILS',
      isReimbursable: true,
      reimbursementStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      userId: 'user1',
      date: new Date(2025, 10, 1),
      description: 'Rav-Kav monthly pass',
      amount: 465,
      category: 'Transportation',
      account: 'checking',
      type: 'expense',
      status: 'actual',
      currency: 'ILS',
      isReimbursable: true,
      reimbursementStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
  
  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return t.isReimbursable;
    return t.isReimbursable && t.reimbursementStatus === filter;
  });
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Reimbursement Management</h1>
      
      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="flex border-b">
          {(['all', 'pending', 'received', 'denied'] as const).map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-6 py-3 font-medium ${
                filter === status
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="divide-y">
          {filteredTransactions.map(transaction => (
            <div key={transaction.id} className="p-4 hover:bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold">{transaction.description}</h3>
                  <div className="text-sm text-gray-600 mt-1">
                    {transaction.category} • {transaction.date.toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">₪{transaction.amount.toFixed(2)}</div>
                  <div
                    className="text-sm font-medium mt-1"
                    style={{ color: getReimbursementStatusColor(transaction.reimbursementStatus) }}
                  >
                    {getReimbursementStatusLabel(transaction.reimbursementStatus)}
                  </div>
                </div>
              </div>
              
              <div className="mt-3 flex gap-2">
                <button className="px-3 py-1 bg-green-500 text-white text-sm rounded hover:bg-green-600">
                  Mark Received
                </button>
                <button className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600">
                  Mark Denied
                </button>
                <button className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">
                  Link to Income
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
