// Budget Templates
import { BudgetTemplate } from './enhanced-schema';

/**
 * Get predefined budget templates
 */
export function getBudgetTemplates(monthlyIncome: number): BudgetTemplate[] {
  return [
    create50_30_20Template(monthlyIncome),
    createZeroBasedTemplate(monthlyIncome),
    createUserSpreadsheetTemplate(monthlyIncome),
    createEssentialsFirstTemplate(monthlyIncome),
  ];
}

/**
 * 50/30/20 Rule Template
 * 50% Needs, 30% Wants, 20% Savings
 */
function create50_30_20Template(monthlyIncome: number): BudgetTemplate {
  const needs = monthlyIncome * 0.50;
  const wants = monthlyIncome * 0.30;
  const savings = monthlyIncome * 0.20;
  
  return {
    id: '50-30-20-template',
    name: '50/30/20 Rule',
    description: 'Allocate 50% to needs, 30% to wants, and 20% to savings and debt repayment',
    type: '50-30-20',
    categories: [
      // Needs (50%)
      { name: 'Housing', percentage: 25, amount: needs * 0.50, type: 'needs' },
      { name: 'Food', percentage: 10, amount: needs * 0.20, type: 'needs' },
      { name: 'Transportation', percentage: 7.5, amount: needs * 0.15, type: 'needs' },
      { name: 'Utilities', percentage: 5, amount: needs * 0.10, type: 'needs' },
      { name: 'Insurance', percentage: 2.5, amount: needs * 0.05, type: 'needs' },
      
      // Wants (30%)
      { name: 'Entertainment', percentage: 10, amount: wants * 0.33, type: 'wants' },
      { name: 'Dining Out', percentage: 10, amount: wants * 0.33, type: 'wants' },
      { name: 'Shopping', percentage: 5, amount: wants * 0.17, type: 'wants' },
      { name: 'Hobbies', percentage: 5, amount: wants * 0.17, type: 'wants' },
      
      // Savings (20%)
      { name: 'Emergency Fund', percentage: 10, amount: savings * 0.50, type: 'savings' },
      { name: 'Retirement', percentage: 5, amount: savings * 0.25, type: 'savings' },
      { name: 'Debt Repayment', percentage: 5, amount: savings * 0.25, type: 'savings' },
    ],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date(),
  };
}

/**
 * Zero-Based Budgeting Template
 * Every dollar has a job
 */
function createZeroBasedTemplate(monthlyIncome: number): BudgetTemplate {
  return {
    id: 'zero-based-template',
    name: 'Zero-Based Budget',
    description: 'Assign every dollar a specific purpose until income minus expenses equals zero',
    type: 'zero-based',
    categories: [
      // Essential expenses
      { name: 'Housing', amount: monthlyIncome * 0.30, type: 'needs' },
      { name: 'Food & Groceries', amount: monthlyIncome * 0.10, type: 'needs' },
      { name: 'Transportation', amount: monthlyIncome * 0.08, type: 'needs' },
      { name: 'Utilities', amount: monthlyIncome * 0.05, type: 'needs' },
      { name: 'Insurance', amount: monthlyIncome * 0.05, type: 'needs' },
      { name: 'Healthcare', amount: monthlyIncome * 0.05, type: 'needs' },
      
      // Debt & Savings
      { name: 'Debt Payments', amount: monthlyIncome * 0.10, type: 'savings' },
      { name: 'Emergency Fund', amount: monthlyIncome * 0.10, type: 'savings' },
      { name: 'Retirement Savings', amount: monthlyIncome * 0.07, type: 'savings' },
      
      // Discretionary
      { name: 'Entertainment', amount: monthlyIncome * 0.05, type: 'wants' },
      { name: 'Personal Care', amount: monthlyIncome * 0.03, type: 'wants' },
      { name: 'Miscellaneous', amount: monthlyIncome * 0.02, type: 'wants' },
    ],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date(),
  };
}

/**
 * User's Spreadsheet Template
 * Based on the provided monthly budget
 */
function createUserSpreadsheetTemplate(monthlyIncome: number): BudgetTemplate {
  // Based on the user's actual spreadsheet (₪4,115 income, ₪4,325 expenses)
  const scaleFactor = monthlyIncome / 4115; // Scale to user's actual income
  
  return {
    id: 'user-spreadsheet-template',
    name: 'Your Current Budget',
    description: 'Based on your monthly budget spreadsheet with NIS amounts',
    type: 'user-spreadsheet',
    categories: [
      // Expenses from spreadsheet
      { name: 'Food', amount: 1200 * scaleFactor, type: 'needs' },
      { name: 'Health/Medical', amount: 1300 * scaleFactor, type: 'needs' },
      { name: 'Transportation', amount: 465 * scaleFactor, type: 'needs' },
      { name: 'Toiletries', amount: 150 * scaleFactor, type: 'needs' },
      { name: 'Subscriptions', amount: 70 * scaleFactor, type: 'wants' },
      { name: 'Vape', amount: 150 * scaleFactor, type: 'wants' },
      { name: 'Off-Base Food', amount: 500 * scaleFactor, type: 'wants' },
      { name: 'Hostel', amount: 240 * scaleFactor, type: 'needs' },
      { name: 'Other', amount: 250 * scaleFactor, type: 'other' },
      
      // Income sources (for reference)
      { name: 'Allowance', amount: 1350 * scaleFactor, type: 'income' },
      { name: 'Paycheck', amount: 1000 * scaleFactor, type: 'income' },
      { name: 'Meds (Reimbursement)', amount: 1300 * scaleFactor, type: 'income' },
      { name: 'Rav-Kav (Reimbursement)', amount: 465 * scaleFactor, type: 'income' },
    ],
    isPublic: false,
    createdBy: 'user',
    createdAt: new Date(),
  };
}

/**
 * Essentials First Template
 * Prioritize essential expenses
 */
function createEssentialsFirstTemplate(monthlyIncome: number): BudgetTemplate {
  return {
    id: 'essentials-first-template',
    name: 'Essentials First',
    description: 'Cover all essential expenses first, then allocate remaining funds',
    type: 'custom',
    categories: [
      // Tier 1: Absolute Essentials (60%)
      { name: 'Housing/Rent', amount: monthlyIncome * 0.30, type: 'needs' },
      { name: 'Food & Groceries', amount: monthlyIncome * 0.12, type: 'needs' },
      { name: 'Utilities', amount: monthlyIncome * 0.08, type: 'needs' },
      { name: 'Transportation', amount: monthlyIncome * 0.10, type: 'needs' },
      
      // Tier 2: Important (25%)
      { name: 'Insurance', amount: monthlyIncome * 0.05, type: 'needs' },
      { name: 'Healthcare', amount: monthlyIncome * 0.05, type: 'needs' },
      { name: 'Debt Minimum Payments', amount: monthlyIncome * 0.10, type: 'needs' },
      { name: 'Emergency Savings', amount: monthlyIncome * 0.05, type: 'savings' },
      
      // Tier 3: Flexible (15%)
      { name: 'Personal Care', amount: monthlyIncome * 0.03, type: 'wants' },
      { name: 'Entertainment', amount: monthlyIncome * 0.05, type: 'wants' },
      { name: 'Additional Savings', amount: monthlyIncome * 0.05, type: 'savings' },
      { name: 'Miscellaneous', amount: monthlyIncome * 0.02, type: 'other' },
    ],
    isPublic: true,
    createdBy: 'system',
    createdAt: new Date(),
  };
}

/**
 * Apply template to create budgets
 */
export function applyBudgetTemplate(
  template: BudgetTemplate,
  userId: string,
  startDate: Date = new Date()
): Array<{
  name: string;
  category: string;
  amount: number;
  type: string;
}> {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  
  return template.categories
    .filter(c => c.type !== 'income') // Don't create budgets for income categories
    .map(category => ({
      name: `${category.name} Budget`,
      category: category.name,
      amount: category.amount || 0,
      type: category.type,
    }));
}

/**
 * Get template by ID
 */
export function getTemplateById(id: string, monthlyIncome: number): BudgetTemplate | null {
  const templates = getBudgetTemplates(monthlyIncome);
  return templates.find(t => t.id === id) || null;
}

/**
 * Calculate template totals
 */
export function calculateTemplateTotals(template: BudgetTemplate): {
  totalNeeds: number;
  totalWants: number;
  totalSavings: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
} {
  const needs = template.categories
    .filter(c => c.type === 'needs')
    .reduce((sum, c) => sum + (c.amount || 0), 0);
  
  const wants = template.categories
    .filter(c => c.type === 'wants')
    .reduce((sum, c) => sum + (c.amount || 0), 0);
  
  const savings = template.categories
    .filter(c => c.type === 'savings')
    .reduce((sum, c) => sum + (c.amount || 0), 0);
  
  const income = template.categories
    .filter(c => c.type === 'income')
    .reduce((sum, c) => sum + (c.amount || 0), 0);
  
  const expenses = needs + wants + savings;
  const balance = income - expenses;
  
  return {
    totalNeeds: needs,
    totalWants: wants,
    totalSavings: savings,
    totalIncome: income,
    totalExpenses: expenses,
    balance,
  };
}
