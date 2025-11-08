// Financial Health Calculator
import { EnhancedTransaction, EnhancedBudget, FinancialHealth } from './enhanced-schema';

interface FinancialData {
  transactions: EnhancedTransaction[];
  budgets: EnhancedBudget[];
  accounts: Array<{ balance: number; type: string }>;
}

/**
 * Calculate overall financial health score
 */
export function calculateFinancialHealth(data: FinancialData): FinancialHealth {
  const savingsRateData = calculateSavingsRate(data.transactions);
  const debtData = calculateDebtScore(data.transactions, data.accounts);
  const budgetData = calculateBudgetAdherence(data.transactions, data.budgets);
  const emergencyFundData = calculateEmergencyFundScore(data.accounts, data.transactions);
  
  // Weighted overall score
  const overallScore = Math.round(
    savingsRateData.score * 0.30 +
    debtData.score * 0.25 +
    budgetData.score * 0.25 +
    emergencyFundData.score * 0.20
  );
  
  // Determine trend (simplified - would compare to previous calculation in real app)
  const trend: 'improving' | 'stable' | 'declining' = 
    overallScore >= 70 ? 'improving' :
    overallScore >= 50 ? 'stable' : 'declining';
  
  const recommendations = generateRecommendations({
    savingsRate: savingsRateData.rate,
    debtToIncomeRatio: debtData.ratio,
    budgetAdherence: budgetData.adherence,
    emergencyFundMonths: emergencyFundData.months,
  });
  
  return {
    userId: 'current-user', // Would come from context
    calculatedAt: new Date(),
    overallScore,
    savingsRate: savingsRateData.rate,
    savingsRateScore: savingsRateData.score,
    debtToIncomeRatio: debtData.ratio,
    debtScore: debtData.score,
    budgetAdherence: budgetData.adherence,
    budgetScore: budgetData.score,
    emergencyFundMonths: emergencyFundData.months,
    emergencyFundScore: emergencyFundData.score,
    scoreChange: 0, // Would calculate from previous score
    trend,
    recommendations,
  };
}

/**
 * Calculate savings rate
 */
function calculateSavingsRate(transactions: EnhancedTransaction[]): {
  rate: number;
  score: number;
} {
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  
  const recentTransactions = transactions.filter(
    t => t.date >= last30Days && t.status === 'actual'
  );
  
  const totalIncome = recentTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpenses = recentTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const savings = totalIncome - totalExpenses;
  const rate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
  
  // Score based on savings rate
  // 20%+ = 100, 15-20% = 80, 10-15% = 60, 5-10% = 40, <5% = 20
  let score: number;
  if (rate >= 20) score = 100;
  else if (rate >= 15) score = 80;
  else if (rate >= 10) score = 60;
  else if (rate >= 5) score = 40;
  else if (rate >= 0) score = 20;
  else score = 0; // Negative savings (deficit)
  
  return { rate: Math.round(rate * 10) / 10, score };
}

/**
 * Calculate debt-to-income ratio and score
 */
function calculateDebtScore(
  transactions: EnhancedTransaction[],
  accounts: Array<{ balance: number; type: string }>
): {
  ratio: number;
  score: number;
} {
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  
  const monthlyIncome = transactions
    .filter(t => t.type === 'income' && t.date >= last30Days && t.status === 'actual')
    .reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate total debt from credit accounts (negative balances)
  const totalDebt = accounts
    .filter(a => a.type === 'credit' || a.type === 'debt')
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);
  
  const ratio = monthlyIncome > 0 ? (totalDebt / monthlyIncome) * 100 : 0;
  
  // Score based on debt-to-income ratio
  // <20% = 100, 20-30% = 80, 30-40% = 60, 40-50% = 40, >50% = 20
  let score: number;
  if (ratio < 20) score = 100;
  else if (ratio < 30) score = 80;
  else if (ratio < 40) score = 60;
  else if (ratio < 50) score = 40;
  else score = 20;
  
  return { ratio: Math.round(ratio * 10) / 10, score };
}

/**
 * Calculate budget adherence
 */
function calculateBudgetAdherence(
  transactions: EnhancedTransaction[],
  budgets: EnhancedBudget[]
): {
  adherence: number;
  score: number;
} {
  if (budgets.length === 0) {
    return { adherence: 0, score: 50 }; // Neutral score if no budgets
  }
  
  const last30Days = new Date();
  last30Days.setDate(last30Days.getDate() - 30);
  
  let totalBudgetedCategories = 0;
  let categoriesWithinBudget = 0;
  
  budgets.forEach(budget => {
    const categorySpending = transactions
      .filter(t => 
        t.category === budget.category &&
        t.type === 'expense' &&
        t.date >= last30Days &&
        t.status === 'actual'
      )
      .reduce((sum, t) => sum + t.amount, 0);
    
    totalBudgetedCategories++;
    if (categorySpending <= budget.monthlyAmount) {
      categoriesWithinBudget++;
    }
  });
  
  const adherence = totalBudgetedCategories > 0
    ? (categoriesWithinBudget / totalBudgetedCategories) * 100
    : 0;
  
  // Score directly correlates with adherence percentage
  const score = Math.round(adherence);
  
  return { adherence: Math.round(adherence * 10) / 10, score };
}

/**
 * Calculate emergency fund score
 */
function calculateEmergencyFundScore(
  accounts: Array<{ balance: number; type: string }>,
  transactions: EnhancedTransaction[]
): {
  months: number;
  score: number;
} {
  // Calculate liquid savings (checking + savings accounts)
  const liquidSavings = accounts
    .filter(a => a.type === 'checking' || a.type === 'savings')
    .reduce((sum, a) => sum + a.balance, 0);
  
  // Calculate average monthly expenses
  const last90Days = new Date();
  last90Days.setDate(last90Days.getDate() - 90);
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense' && t.date >= last90Days && t.status === 'actual')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const avgMonthlyExpenses = totalExpenses / 3;
  
  const months = avgMonthlyExpenses > 0 ? liquidSavings / avgMonthlyExpenses : 0;
  
  // Score based on months of expenses covered
  // 6+ months = 100, 4-6 = 80, 2-4 = 60, 1-2 = 40, <1 = 20
  let score: number;
  if (months >= 6) score = 100;
  else if (months >= 4) score = 80;
  else if (months >= 2) score = 60;
  else if (months >= 1) score = 40;
  else score = 20;
  
  return { months: Math.round(months * 10) / 10, score };
}

/**
 * Generate personalized recommendations
 */
function generateRecommendations(data: {
  savingsRate: number;
  debtToIncomeRatio: number;
  budgetAdherence: number;
  emergencyFundMonths: number;
}): Array<{
  category: string;
  priority: 'high' | 'medium' | 'low';
  message: string;
  actionable: boolean;
}> {
  const recommendations: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    message: string;
    actionable: boolean;
  }> = [];
  
  // Emergency fund recommendations
  if (data.emergencyFundMonths < 3) {
    recommendations.push({
      category: 'Emergency Fund',
      priority: 'high',
      message: `Build your emergency fund to cover at least 3-6 months of expenses. You currently have ${data.emergencyFundMonths.toFixed(1)} months covered.`,
      actionable: true,
    });
  }
  
  // Savings rate recommendations
  if (data.savingsRate < 10) {
    recommendations.push({
      category: 'Savings',
      priority: 'high',
      message: `Increase your savings rate to at least 10-20% of income. Current rate: ${data.savingsRate.toFixed(1)}%.`,
      actionable: true,
    });
  } else if (data.savingsRate < 20) {
    recommendations.push({
      category: 'Savings',
      priority: 'medium',
      message: `Good progress! Try to increase your savings rate to 20% for optimal financial health. Current: ${data.savingsRate.toFixed(1)}%.`,
      actionable: true,
    });
  }
  
  // Debt recommendations
  if (data.debtToIncomeRatio > 40) {
    recommendations.push({
      category: 'Debt',
      priority: 'high',
      message: `Your debt-to-income ratio is ${data.debtToIncomeRatio.toFixed(1)}%. Focus on paying down high-interest debt to get below 30%.`,
      actionable: true,
    });
  } else if (data.debtToIncomeRatio > 30) {
    recommendations.push({
      category: 'Debt',
      priority: 'medium',
      message: `Consider accelerating debt payments to reduce your debt-to-income ratio below 30%. Current: ${data.debtToIncomeRatio.toFixed(1)}%.`,
      actionable: true,
    });
  }
  
  // Budget adherence recommendations
  if (data.budgetAdherence < 70) {
    recommendations.push({
      category: 'Budgeting',
      priority: 'high',
      message: `You're staying within budget only ${data.budgetAdherence.toFixed(0)}% of the time. Review and adjust your budgets to be more realistic.`,
      actionable: true,
    });
  } else if (data.budgetAdherence < 90) {
    recommendations.push({
      category: 'Budgeting',
      priority: 'medium',
      message: `Good budget adherence at ${data.budgetAdherence.toFixed(0)}%. Identify the categories where you're overspending.`,
      actionable: true,
    });
  }
  
  // Positive reinforcement
  if (data.savingsRate >= 20 && data.emergencyFundMonths >= 6) {
    recommendations.push({
      category: 'Overall',
      priority: 'low',
      message: 'Excellent financial health! Consider increasing investments or setting new financial goals.',
      actionable: true,
    });
  }
  
  return recommendations;
}

/**
 * Get health score color
 */
export function getHealthScoreColor(score: number): string {
  if (score >= 80) return '#10B981'; // green-500
  if (score >= 60) return '#EAB308'; // yellow-500
  if (score >= 40) return '#F97316'; // orange-500
  return '#EF4444'; // red-500
}

/**
 * Get health score label
 */
export function getHealthScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Improvement';
}
