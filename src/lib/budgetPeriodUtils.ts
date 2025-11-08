// Budget Period Utilities
import { BudgetPeriodType } from './enhanced-schema';

export const WEEKS_PER_MONTH = 4;
export const WEEKS_PER_YEAR = 52;
export const MONTHS_PER_YEAR = 12;

/**
 * Convert amount from one period to another
 */
export function convertBudgetAmount(
  amount: number,
  fromPeriod: BudgetPeriodType,
  toPeriod: BudgetPeriodType
): number {
  if (fromPeriod === toPeriod) return amount;
  
  // Convert to monthly first
  let monthlyAmount: number;
  switch (fromPeriod) {
    case 'weekly':
      monthlyAmount = amount * WEEKS_PER_MONTH;
      break;
    case 'monthly':
      monthlyAmount = amount;
      break;
    case 'yearly':
      monthlyAmount = amount / MONTHS_PER_YEAR;
      break;
  }
  
  // Convert from monthly to target period
  switch (toPeriod) {
    case 'weekly':
      return monthlyAmount / WEEKS_PER_MONTH;
    case 'monthly':
      return monthlyAmount;
    case 'yearly':
      return monthlyAmount * MONTHS_PER_YEAR;
  }
}

/**
 * Calculate all period amounts from a base amount
 */
export function calculateAllPeriods(
  amount: number,
  basePeriod: BudgetPeriodType
): {
  weekly: number;
  monthly: number;
  yearly: number;
} {
  return {
    weekly: convertBudgetAmount(amount, basePeriod, 'weekly'),
    monthly: convertBudgetAmount(amount, basePeriod, 'monthly'),
    yearly: convertBudgetAmount(amount, basePeriod, 'yearly'),
  };
}

/**
 * Format budget period label
 */
export function formatPeriodLabel(period: BudgetPeriodType): string {
  switch (period) {
    case 'weekly':
      return 'per week';
    case 'monthly':
      return 'per month';
    case 'yearly':
      return 'per year';
  }
}

/**
 * Get period multiplier relative to monthly
 */
export function getPeriodMultiplier(period: BudgetPeriodType): number {
  switch (period) {
    case 'weekly':
      return 1 / WEEKS_PER_MONTH;
    case 'monthly':
      return 1;
    case 'yearly':
      return MONTHS_PER_YEAR;
  }
}

/**
 * Calculate "What's Left" for budget
 */
export function calculateWhatsLeft(
  income: number,
  expenses: number,
  startingBalance: number = 0
): {
  whatsLeft: number;
  isDeficit: boolean;
  percentageUsed: number;
} {
  const whatsLeft = income - expenses + startingBalance;
  const isDeficit = whatsLeft < 0;
  const percentageUsed = income > 0 ? (expenses / income) * 100 : 0;
  
  return {
    whatsLeft,
    isDeficit,
    percentageUsed,
  };
}

/**
 * Get date range for period
 */
export function getPeriodDateRange(
  period: BudgetPeriodType,
  referenceDate: Date = new Date()
): {
  startDate: Date;
  endDate: Date;
} {
  const start = new Date(referenceDate);
  const end = new Date(referenceDate);
  
  switch (period) {
    case 'weekly':
      // Start of week (Sunday)
      start.setDate(start.getDate() - start.getDay());
      start.setHours(0, 0, 0, 0);
      // End of week (Saturday)
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      break;
      
    case 'monthly':
      // Start of month
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      // End of month
      end.setMonth(end.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
      
    case 'yearly':
      // Start of year
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      // End of year
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      break;
  }
  
  return { startDate: start, endDate: end };
}

/**
 * Format period date range as string
 */
export function formatPeriodDateRange(
  period: BudgetPeriodType,
  referenceDate: Date = new Date()
): string {
  const { startDate, endDate } = getPeriodDateRange(period, referenceDate);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: startDate.getFullYear() !== endDate.getFullYear() ? 'numeric' : undefined
    });
  };
  
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

/**
 * Calculate budget progress percentage
 */
export function calculateBudgetProgress(
  spent: number,
  budgetAmount: number
): {
  percentage: number;
  status: 'on-track' | 'warning' | 'danger' | 'over-budget';
  color: string;
} {
  const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
  
  let status: 'on-track' | 'warning' | 'danger' | 'over-budget';
  let color: string;
  
  if (percentage >= 100) {
    status = 'over-budget';
    color = '#EF4444'; // red-500
  } else if (percentage >= 90) {
    status = 'danger';
    color = '#F97316'; // orange-500
  } else if (percentage >= 80) {
    status = 'warning';
    color = '#EAB308'; // yellow-500
  } else {
    status = 'on-track';
    color = '#10B981'; // green-500
  }
  
  return { percentage, status, color };
}
