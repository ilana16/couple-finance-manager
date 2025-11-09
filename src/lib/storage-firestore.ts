// Firestore-based storage implementation
// Replaces localStorage with cloud storage

import { FirestoreStorage } from './firestore-storage';

export interface Transaction {
  id: string;
  userId: string;
  date: string; // ISO string for Firestore
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  paymentMethod: 'debit' | 'credit';
  accountId?: string;
  creditSourceId?: string;
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom';
  customRecurringValue?: number;
  customRecurringUnit?: 'days' | 'weeks' | 'months' | 'years';
  dayOfMonth?: number;
  recurringEndDate?: string;
  parentTransactionId?: string;
  isJoint: boolean;
  notes?: string;
  attachments?: string[];
  savingsGoalId?: string; // Optional: link transaction to a savings goal
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  monthlyAmount: number;
  weeklyAmount: number;
  yearlyAmount: number;
  spent: number;
  isRecurring?: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  customRecurringValue?: number;
  customRecurringUnit?: 'days' | 'weeks' | 'months' | 'years';
  isJoint: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  projectedAmount?: number;
  targetDate: string;
  isJoint: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface Debt {
  id: string;
  userId: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  projectedPayoff?: number;
  actualPayoff?: number;
  interestRate: number;
  minimumPayment: number;
  dueDate: string;
  isJoint: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Investment {
  id: string;
  userId: string;
  name: string;
  type: string;
  amount: number;
  currentValue: number;
  projectedValue?: number;
  actualValue?: number;
  purchaseDate: string;
  isJoint: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SharedNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
  isJoint: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: 'checking' | 'savings' | 'cash' | 'other';
  balance: number;
  currency: 'NIS' | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF';
  isJoint: boolean;
  institution?: string;
  accountNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreditSource {
  id: string;
  userId: string;
  name: string;
  type: 'credit_card' | 'line_of_credit' | 'loan' | 'other';
  creditLimit: number;
  currentBalance: number;
  interestRate?: number;
  paymentDayOfMonth: number;
  paymentOption: 'pay_all' | 'custom_amount';
  customPaymentAmount?: number;
  isJoint: boolean;
  institution?: string;
  accountNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Initialize Firestore storage instances
export const transactionStorage = new FirestoreStorage<Transaction>('transactions');
export const budgetStorage = new FirestoreStorage<Budget>('budgets');
export const goalStorage = new FirestoreStorage<SavingsGoal>('goals');
export const debtStorage = new FirestoreStorage<Debt>('debts');
export const investmentStorage = new FirestoreStorage<Investment>('investments');
export const noteStorage = new FirestoreStorage<SharedNote>('notes');
export const reminderStorage = new FirestoreStorage<Reminder>('reminders');
export const accountStorage = new FirestoreStorage<Account>('accounts');
export const creditStorage = new FirestoreStorage<CreditSource>('creditSources');

// Helper function to create timestamp
export function createTimestamp(): string {
  return new Date().toISOString();
}
