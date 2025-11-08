// Enhanced schema with all new features
import { z } from 'zod';

// Budget Period Types
export const BudgetPeriod = z.enum(['weekly', 'monthly', 'yearly']);
export type BudgetPeriodType = z.infer<typeof BudgetPeriod>;

// Reimbursement Status
export const ReimbursementStatus = z.enum(['not_reimbursable', 'pending', 'received', 'denied']);
export type ReimbursementStatusType = z.infer<typeof ReimbursementStatus>;

// Enhanced Transaction Schema with Reimbursement
export const EnhancedTransactionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.date(),
  description: z.string(),
  amount: z.number(),
  category: z.string(),
  account: z.string(),
  type: z.enum(['income', 'expense']),
  status: z.enum(['projected', 'pending', 'actual', 'recurring']),
  currency: z.string().default('ILS'),
  
  // Reimbursement fields
  isReimbursable: z.boolean().default(false),
  reimbursementStatus: ReimbursementStatus.default('not_reimbursable'),
  reimbursementAmount: z.number().optional(),
  reimbursementDate: z.date().optional(),
  linkedReimbursementId: z.string().optional(), // Links expense to income reimbursement
  originalExpenseId: z.string().optional(), // For income that reimburses an expense
  
  // Existing fields
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  partnerId: z.string().optional(),
  isJoint: z.boolean().default(false),
  recurringId: z.string().optional(),
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Enhanced Budget Schema with Period Support
export const EnhancedBudgetSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  category: z.string(),
  
  // Period-based amounts
  period: BudgetPeriod.default('monthly'),
  amount: z.number(), // Primary amount for selected period
  monthlyAmount: z.number(),
  weeklyAmount: z.number(),
  yearlyAmount: z.number(),
  
  // Starting balance
  startingBalance: z.number().default(0),
  currentBalance: z.number().default(0),
  
  // Budget tracking
  spent: z.number().default(0),
  remaining: z.number().default(0),
  percentageUsed: z.number().default(0),
  
  // Alert thresholds
  alertAt80: z.boolean().default(true),
  alertAt90: z.boolean().default(true),
  alertAt100: z.boolean().default(true),
  
  // Metadata
  color: z.string().optional(),
  icon: z.string().optional(),
  isActive: z.boolean().default(true),
  rollover: z.boolean().default(false),
  
  startDate: z.date(),
  endDate: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Budget Template Schema
export const BudgetTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['50-30-20', 'zero-based', 'custom', 'user-spreadsheet']),
  categories: z.array(z.object({
    name: z.string(),
    percentage: z.number().optional(),
    amount: z.number().optional(),
    type: z.enum(['needs', 'wants', 'savings', 'income', 'other']),
  })),
  isPublic: z.boolean().default(false),
  createdBy: z.string(),
  createdAt: z.date(),
});

// Category Group Schema
export const CategoryGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['essential', 'discretionary', 'savings', 'income', 'other']),
  color: z.string(),
  icon: z.string().optional(),
  order: z.number(),
});

// Enhanced Category Schema with Groups
export const EnhancedCategorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  type: z.enum(['income', 'expense']),
  color: z.string(),
  icon: z.string().optional(),
  
  // Category groups and hierarchy
  groupId: z.string().optional(),
  parentCategoryId: z.string().optional(), // For subcategories
  isSubcategory: z.boolean().default(false),
  
  // Budget defaults
  defaultBudgetAmount: z.number().optional(),
  isReimbursable: z.boolean().default(false),
  
  order: z.number(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Financial Health Score Schema
export const FinancialHealthSchema = z.object({
  userId: z.string(),
  calculatedAt: z.date(),
  
  // Overall score (0-100)
  overallScore: z.number(),
  
  // Component scores
  savingsRate: z.number(), // Percentage of income saved
  savingsRateScore: z.number(), // 0-100
  
  debtToIncomeRatio: z.number(), // Percentage
  debtScore: z.number(), // 0-100
  
  budgetAdherence: z.number(), // Percentage staying within budget
  budgetScore: z.number(), // 0-100
  
  emergencyFundMonths: z.number(), // Months of expenses covered
  emergencyFundScore: z.number(), // 0-100
  
  // Trends
  scoreChange: z.number(), // Change from last calculation
  trend: z.enum(['improving', 'stable', 'declining']),
  
  // Recommendations
  recommendations: z.array(z.object({
    category: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
    message: z.string(),
    actionable: z.boolean(),
  })),
});

// Bill Schema
export const BillSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  amount: z.number(),
  currency: z.string().default('ILS'),
  
  // Scheduling
  dueDate: z.date(),
  frequency: z.enum(['one-time', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly']),
  nextDueDate: z.date(),
  
  // Status
  status: z.enum(['upcoming', 'due-soon', 'overdue', 'paid']),
  isPaid: z.boolean().default(false),
  paidDate: z.date().optional(),
  paidAmount: z.number().optional(),
  
  // Automation
  autoPayEnabled: z.boolean().default(false),
  autoPayAccountId: z.string().optional(),
  
  // Reminders
  reminderDaysBefore: z.number().default(3),
  reminderSent: z.boolean().default(false),
  
  // Metadata
  category: z.string(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Receipt OCR Result Schema
export const ReceiptOCRSchema = z.object({
  receiptId: z.string(),
  transactionId: z.string().optional(),
  
  // Extracted data
  merchant: z.string().optional(),
  date: z.date().optional(),
  totalAmount: z.number().optional(),
  currency: z.string().optional(),
  
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().optional(),
    price: z.number().optional(),
  })).optional(),
  
  // Confidence scores
  merchantConfidence: z.number().optional(),
  dateConfidence: z.number().optional(),
  amountConfidence: z.number().optional(),
  
  // OCR metadata
  ocrProvider: z.string(),
  rawText: z.string(),
  imageUrl: z.string(),
  
  processedAt: z.date(),
});

// Enhanced Recurring Transaction Schema
export const EnhancedRecurringSchema = z.object({
  id: z.string(),
  userId: z.string(),
  
  // Transaction details
  description: z.string(),
  amount: z.number(),
  category: z.string(),
  account: z.string(),
  type: z.enum(['income', 'expense']),
  currency: z.string().default('ILS'),
  
  // Recurrence settings
  frequency: z.enum(['daily', 'weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly']),
  startDate: z.date(),
  endDate: z.date().optional(),
  nextOccurrence: z.date(),
  lastGenerated: z.date().optional(),
  
  // Advanced scheduling
  dayOfWeek: z.number().optional(), // 0-6 for weekly
  dayOfMonth: z.number().optional(), // 1-31 for monthly
  monthOfYear: z.number().optional(), // 1-12 for yearly
  
  // Flexibility
  allowAmountAdjustment: z.boolean().default(false),
  nextAmount: z.number().optional(), // Override for next occurrence
  skipNextOccurrence: z.boolean().default(false),
  
  // Status
  isActive: z.boolean().default(true),
  isPaused: z.boolean().default(false),
  pausedUntil: z.date().optional(),
  
  // Metadata
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isJoint: z.boolean().default(false),
  
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Alert Configuration Schema
export const AlertConfigSchema = z.object({
  userId: z.string(),
  
  // Budget alerts
  budgetAlerts: z.object({
    enabled: z.boolean().default(true),
    threshold80: z.boolean().default(true),
    threshold90: z.boolean().default(true),
    threshold100: z.boolean().default(true),
    overBudget: z.boolean().default(true),
  }),
  
  // Spending alerts
  spendingAlerts: z.object({
    enabled: z.boolean().default(true),
    unusualSpending: z.boolean().default(true),
    unusualThreshold: z.number().default(2.0), // 2x average
    largeTransaction: z.boolean().default(true),
    largeTransactionAmount: z.number().default(1000),
  }),
  
  // Bill alerts
  billAlerts: z.object({
    enabled: z.boolean().default(true),
    daysBefore: z.number().default(3),
    overdueAlerts: z.boolean().default(true),
  }),
  
  // Reimbursement alerts
  reimbursementAlerts: z.object({
    enabled: z.boolean().default(true),
    pendingOver30Days: z.boolean().default(true),
    reimbursementReceived: z.boolean().default(true),
  }),
  
  // Goal alerts
  goalAlerts: z.object({
    enabled: z.boolean().default(true),
    milestones: z.boolean().default(true),
    offTrack: z.boolean().default(true),
  }),
  
  updatedAt: z.date(),
});

export type EnhancedTransaction = z.infer<typeof EnhancedTransactionSchema>;
export type EnhancedBudget = z.infer<typeof EnhancedBudgetSchema>;
export type BudgetTemplate = z.infer<typeof BudgetTemplateSchema>;
export type CategoryGroup = z.infer<typeof CategoryGroupSchema>;
export type EnhancedCategory = z.infer<typeof EnhancedCategorySchema>;
export type FinancialHealth = z.infer<typeof FinancialHealthSchema>;
export type Bill = z.infer<typeof BillSchema>;
export type ReceiptOCR = z.infer<typeof ReceiptOCRSchema>;
export type EnhancedRecurring = z.infer<typeof EnhancedRecurringSchema>;
export type AlertConfig = z.infer<typeof AlertConfigSchema>;
