import React, { useState } from 'react';
import { BudgetPeriodType } from '../lib/enhanced-schema';
import {
  convertBudgetAmount,
  calculateWhatsLeft,
  formatPeriodLabel,
  formatPeriodDateRange,
  calculateBudgetProgress,
} from '../lib/budgetPeriodUtils';

interface Budget {
  id: string;
  name: string;
  category: string;
  monthlyAmount: number;
  weeklyAmount: number;
  yearlyAmount: number;
  spent: number;
  startingBalance?: number;
}

export default function EnhancedBudgets() {
  const [selectedPeriod, setSelectedPeriod] = useState<BudgetPeriodType>('monthly');
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Mock data - would come from API
  const budgets: Budget[] = [
    { id: '1', name: 'Food Budget', category: 'Food', monthlyAmount: 1200, weeklyAmount: 300, yearlyAmount: 14400, spent: 850 },
    { id: '2', name: 'Health Budget', category: 'Health/Medical', monthlyAmount: 1300, weeklyAmount: 325, yearlyAmount: 15600, spent: 1100 },
    { id: '3', name: 'Transport Budget', category: 'Transportation', monthlyAmount: 465, weeklyAmount: 116.25, yearlyAmount: 5580, spent: 420 },
  ];
  
  const totalIncome = selectedPeriod === 'weekly' ? 1028.75 : selectedPeriod === 'monthly' ? 4115 : 49380;
  const startingBalance = 0;
  
  const totalBudgeted = budgets.reduce((sum, b) => {
    switch (selectedPeriod) {
      case 'weekly': return sum + b.weeklyAmount;
      case 'monthly': return sum + b.monthlyAmount;
      case 'yearly': return sum + b.yearlyAmount;
    }
  }, 0);
  
  const totalSpent = budgets.reduce((sum, b) => {
    const periodSpent = convertBudgetAmount(b.spent, 'monthly', selectedPeriod);
    return sum + periodSpent;
  }, 0);
  
  const { whatsLeft, isDeficit, percentageUsed } = calculateWhatsLeft(
    totalIncome,
    totalSpent,
    startingBalance
  );
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Budgets</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplates(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Use Template
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            Import from Excel
          </button>
          <button className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
            New Budget
          </button>
        </div>
      </div>
      
      {/* Period Selector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedPeriod('weekly')}
              className={`px-4 py-2 rounded ${
                selectedPeriod === 'weekly'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-4 py-2 rounded ${
                selectedPeriod === 'monthly'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setSelectedPeriod('yearly')}
              className={`px-4 py-2 rounded ${
                selectedPeriod === 'yearly'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Yearly
            </button>
          </div>
          <div className="text-sm text-gray-600">
            {formatPeriodDateRange(selectedPeriod)}
          </div>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Starting Balance</div>
          <div className="text-2xl font-bold">₪{startingBalance.toFixed(2)}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Income {formatPeriodLabel(selectedPeriod)}</div>
          <div className="text-2xl font-bold text-green-600">₪{totalIncome.toFixed(2)}</div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Expenses {formatPeriodLabel(selectedPeriod)}</div>
          <div className="text-2xl font-bold text-red-600">₪{totalSpent.toFixed(2)}</div>
          <div className="text-xs text-gray-500 mt-1">
            {percentageUsed.toFixed(1)}% of income
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">What's Left</div>
          <div className={`text-2xl font-bold ${isDeficit ? 'text-red-600' : 'text-green-600'}`}>
            {isDeficit ? '-' : ''}₪{Math.abs(whatsLeft).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {isDeficit ? 'DEFICIT' : 'SURPLUS'}
          </div>
        </div>
      </div>
      
      {/* Budget List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Budget Categories</h2>
        </div>
        
        <div className="divide-y">
          {budgets.map(budget => {
            const amount = selectedPeriod === 'weekly' ? budget.weeklyAmount :
                          selectedPeriod === 'monthly' ? budget.monthlyAmount :
                          budget.yearlyAmount;
            
            const spent = convertBudgetAmount(budget.spent, 'monthly', selectedPeriod);
            const remaining = amount - spent;
            const { percentage, status, color } = calculateBudgetProgress(spent, amount);
            
            return (
              <div key={budget.id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold">{budget.category}</h3>
                    <p className="text-sm text-gray-600">{budget.name}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">₪{spent.toFixed(2)} / ₪{amount.toFixed(2)}</div>
                    <div className="text-sm" style={{ color }}>
                      {remaining >= 0 ? `₪${remaining.toFixed(2)} remaining` : `₪${Math.abs(remaining).toFixed(2)} over`}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div
                    className="h-2.5 rounded-full transition-all"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">{percentage.toFixed(1)}% used</span>
                  <span className="font-medium" style={{ color }}>
                    {status === 'on-track' && '✓ On Track'}
                    {status === 'warning' && '⚠ Warning'}
                    {status === 'danger' && '⚠ Danger'}
                    {status === 'over-budget' && '✗ Over Budget'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Budget vs Actual Chart Placeholder */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Budget vs Actual</h2>
        <div className="h-64 flex items-center justify-center text-gray-400">
          Chart visualization would go here
        </div>
      </div>
    </div>
  );
}
