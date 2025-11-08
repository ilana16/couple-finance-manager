import React from 'react';
import { FinancialHealth } from '../lib/enhanced-schema';
import { getHealthScoreColor, getHealthScoreLabel } from '../lib/financialHealthCalculator';

interface FinancialHealthWidgetProps {
  healthData: FinancialHealth;
}

export default function FinancialHealthWidget({ healthData }: FinancialHealthWidgetProps) {
  const scoreColor = getHealthScoreColor(healthData.overallScore);
  const scoreLabel = getHealthScoreLabel(healthData.overallScore);
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Financial Health Score</h3>
      
      {/* Overall Score Circle */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-40 h-40">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="#E5E7EB"
              strokeWidth="12"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke={scoreColor}
              strokeWidth="12"
              fill="none"
              strokeDasharray={`${(healthData.overallScore / 100) * 440} 440`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold" style={{ color: scoreColor }}>
              {healthData.overallScore}
            </div>
            <div className="text-sm text-gray-600">{scoreLabel}</div>
          </div>
        </div>
      </div>
      
      {/* Trend Indicator */}
      <div className="flex items-center justify-center mb-6">
        <span className={`flex items-center gap-1 text-sm font-medium ${
          healthData.trend === 'improving' ? 'text-green-600' :
          healthData.trend === 'declining' ? 'text-red-600' :
          'text-gray-600'
        }`}>
          {healthData.trend === 'improving' && '↑ Improving'}
          {healthData.trend === 'stable' && '→ Stable'}
          {healthData.trend === 'declining' && '↓ Declining'}
          {healthData.scoreChange !== 0 && (
            <span className="ml-1">
              ({healthData.scoreChange > 0 ? '+' : ''}{healthData.scoreChange})
            </span>
          )}
        </span>
      </div>
      
      {/* Component Scores */}
      <div className="space-y-4 mb-6">
        <ScoreBar
          label="Savings Rate"
          value={healthData.savingsRate}
          score={healthData.savingsRateScore}
          suffix="%"
        />
        <ScoreBar
          label="Debt-to-Income"
          value={healthData.debtToIncomeRatio}
          score={healthData.debtScore}
          suffix="%"
          inverse
        />
        <ScoreBar
          label="Budget Adherence"
          value={healthData.budgetAdherence}
          score={healthData.budgetScore}
          suffix="%"
        />
        <ScoreBar
          label="Emergency Fund"
          value={healthData.emergencyFundMonths}
          score={healthData.emergencyFundScore}
          suffix=" months"
        />
      </div>
      
      {/* Top Recommendations */}
      {healthData.recommendations.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="font-semibold text-sm mb-3">Top Recommendations</h4>
          <div className="space-y-2">
            {healthData.recommendations.slice(0, 2).map((rec, index) => (
              <div
                key={index}
                className={`p-3 rounded text-sm ${
                  rec.priority === 'high' ? 'bg-red-50 border border-red-200' :
                  rec.priority === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-blue-50 border border-blue-200'
                }`}
              >
                <div className="font-medium mb-1">{rec.category}</div>
                <div className="text-gray-700">{rec.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <button className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium">
        View Detailed Analysis
      </button>
    </div>
  );
}

interface ScoreBarProps {
  label: string;
  value: number;
  score: number;
  suffix?: string;
  inverse?: boolean; // For metrics where lower is better
}

function ScoreBar({ label, value, score, suffix = '', inverse = false }: ScoreBarProps) {
  const displayValue = inverse ? value : value;
  const color = score >= 80 ? '#10B981' :
                score >= 60 ? '#EAB308' :
                score >= 40 ? '#F97316' : '#EF4444';
  
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm font-semibold">
          {displayValue.toFixed(1)}{suffix}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: `${score}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

// Full Financial Health Page
export function FinancialHealthPage() {
  // Mock data - would come from API
  const healthData: FinancialHealth = {
    userId: 'user1',
    calculatedAt: new Date(),
    overallScore: 68,
    savingsRate: 12.5,
    savingsRateScore: 60,
    debtToIncomeRatio: 25.0,
    debtScore: 80,
    budgetAdherence: 75.0,
    budgetScore: 75,
    emergencyFundMonths: 2.5,
    emergencyFundScore: 60,
    scoreChange: 5,
    trend: 'improving',
    recommendations: [
      {
        category: 'Emergency Fund',
        priority: 'high',
        message: 'Build your emergency fund to cover at least 3-6 months of expenses. You currently have 2.5 months covered.',
        actionable: true,
      },
      {
        category: 'Savings',
        priority: 'medium',
        message: 'Good progress! Try to increase your savings rate to 20% for optimal financial health. Current: 12.5%.',
        actionable: true,
      },
      {
        category: 'Budgeting',
        priority: 'medium',
        message: 'Good budget adherence at 75%. Identify the categories where you\'re overspending.',
        actionable: true,
      },
    ],
  };
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Financial Health Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Health Score */}
        <div className="lg:col-span-1">
          <FinancialHealthWidget healthData={healthData} />
        </div>
        
        {/* Detailed Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Savings Rate Detail */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Savings Rate Analysis</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Current Rate</div>
                <div className="text-2xl font-bold">{healthData.savingsRate}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Target Rate</div>
                <div className="text-2xl font-bold text-green-600">20%</div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded">
              <p className="text-sm text-gray-700">
                You're saving {healthData.savingsRate}% of your income. To reach the recommended 20%, 
                try to reduce discretionary spending or increase your income.
              </p>
            </div>
          </div>
          
          {/* Emergency Fund Detail */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Emergency Fund Status</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Current</div>
                <div className="text-2xl font-bold">{healthData.emergencyFundMonths}</div>
                <div className="text-xs text-gray-500">months</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Minimum</div>
                <div className="text-2xl font-bold text-yellow-600">3</div>
                <div className="text-xs text-gray-500">months</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Ideal</div>
                <div className="text-2xl font-bold text-green-600">6</div>
                <div className="text-xs text-gray-500">months</div>
              </div>
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-4">
              <div
                className="h-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                style={{ width: `${Math.min((healthData.emergencyFundMonths / 6) * 100, 100)}%` }}
              />
            </div>
          </div>
          
          {/* All Recommendations */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Personalized Recommendations</h3>
            <div className="space-y-3">
              {healthData.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded border-l-4 ${
                    rec.priority === 'high' ? 'border-red-500 bg-red-50' :
                    rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="font-semibold">{rec.category}</div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      rec.priority === 'high' ? 'bg-red-200 text-red-800' :
                      rec.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                      'bg-blue-200 text-blue-800'
                    }`}>
                      {rec.priority.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{rec.message}</p>
                  {rec.actionable && (
                    <button className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium">
                      Take Action →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
