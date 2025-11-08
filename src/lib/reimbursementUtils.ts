// Reimbursement Utilities
import { EnhancedTransaction, ReimbursementStatusType } from './enhanced-schema';

/**
 * Calculate net expense after reimbursement
 */
export function calculateNetExpense(
  expenseAmount: number,
  reimbursementAmount: number = 0
): number {
  return expenseAmount - reimbursementAmount;
}

/**
 * Calculate total pending reimbursements
 */
export function calculatePendingReimbursements(
  transactions: EnhancedTransaction[]
): {
  totalPending: number;
  count: number;
  oldestDate: Date | null;
  transactions: EnhancedTransaction[];
} {
  const pending = transactions.filter(
    t => t.isReimbursable && t.reimbursementStatus === 'pending'
  );
  
  const totalPending = pending.reduce((sum, t) => sum + t.amount, 0);
  const oldestDate = pending.length > 0
    ? new Date(Math.min(...pending.map(t => t.date.getTime())))
    : null;
  
  return {
    totalPending,
    count: pending.length,
    oldestDate,
    transactions: pending,
  };
}

/**
 * Calculate reimbursement statistics
 */
export function calculateReimbursementStats(
  transactions: EnhancedTransaction[],
  startDate: Date,
  endDate: Date
): {
  totalReimbursable: number;
  totalPending: number;
  totalReceived: number;
  totalDenied: number;
  pendingCount: number;
  receivedCount: number;
  deniedCount: number;
  averageDaysToReimburse: number;
  reimbursementRate: number; // Percentage received vs requested
} {
  const reimbursableTransactions = transactions.filter(
    t => t.isReimbursable && t.date >= startDate && t.date <= endDate
  );
  
  const totalReimbursable = reimbursableTransactions.reduce((sum, t) => sum + t.amount, 0);
  
  const pending = reimbursableTransactions.filter(t => t.reimbursementStatus === 'pending');
  const received = reimbursableTransactions.filter(t => t.reimbursementStatus === 'received');
  const denied = reimbursableTransactions.filter(t => t.reimbursementStatus === 'denied');
  
  const totalPending = pending.reduce((sum, t) => sum + t.amount, 0);
  const totalReceived = received.reduce((sum, t) => sum + (t.reimbursementAmount || t.amount), 0);
  const totalDenied = denied.reduce((sum, t) => sum + t.amount, 0);
  
  // Calculate average days to reimburse
  const receivedWithDates = received.filter(t => t.reimbursementDate);
  const averageDaysToReimburse = receivedWithDates.length > 0
    ? receivedWithDates.reduce((sum, t) => {
        const days = Math.floor(
          (t.reimbursementDate!.getTime() - t.date.getTime()) / (1000 * 60 * 60 * 24)
        );
        return sum + days;
      }, 0) / receivedWithDates.length
    : 0;
  
  // Calculate reimbursement rate
  const totalRequested = totalReceived + totalDenied;
  const reimbursementRate = totalRequested > 0 ? (totalReceived / totalRequested) * 100 : 0;
  
  return {
    totalReimbursable,
    totalPending,
    totalReceived,
    totalDenied,
    pendingCount: pending.length,
    receivedCount: received.length,
    deniedCount: denied.length,
    averageDaysToReimburse: Math.round(averageDaysToReimburse),
    reimbursementRate: Math.round(reimbursementRate * 10) / 10,
  };
}

/**
 * Check if reimbursement is overdue
 */
export function isReimbursementOverdue(
  transaction: EnhancedTransaction,
  daysThreshold: number = 30
): boolean {
  if (!transaction.isReimbursable || transaction.reimbursementStatus !== 'pending') {
    return false;
  }
  
  const daysSinceExpense = Math.floor(
    (new Date().getTime() - transaction.date.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysSinceExpense > daysThreshold;
}

/**
 * Get reimbursement status label
 */
export function getReimbursementStatusLabel(status: ReimbursementStatusType): string {
  switch (status) {
    case 'not_reimbursable':
      return 'Not Reimbursable';
    case 'pending':
      return 'Pending';
    case 'received':
      return 'Received';
    case 'denied':
      return 'Denied';
  }
}

/**
 * Get reimbursement status color
 */
export function getReimbursementStatusColor(status: ReimbursementStatusType): string {
  switch (status) {
    case 'not_reimbursable':
      return '#6B7280'; // gray-500
    case 'pending':
      return '#EAB308'; // yellow-500
    case 'received':
      return '#10B981'; // green-500
    case 'denied':
      return '#EF4444'; // red-500
  }
}

/**
 * Link expense to reimbursement income
 */
export function linkReimbursement(
  expense: EnhancedTransaction,
  income: EnhancedTransaction
): {
  updatedExpense: Partial<EnhancedTransaction>;
  updatedIncome: Partial<EnhancedTransaction>;
} {
  return {
    updatedExpense: {
      linkedReimbursementId: income.id,
      reimbursementStatus: 'received',
      reimbursementAmount: income.amount,
      reimbursementDate: income.date,
    },
    updatedIncome: {
      originalExpenseId: expense.id,
      notes: `Reimbursement for: ${expense.description}`,
    },
  };
}

/**
 * Calculate category reimbursement breakdown
 */
export function getCategoryReimbursementBreakdown(
  transactions: EnhancedTransaction[]
): Array<{
  category: string;
  totalReimbursable: number;
  pending: number;
  received: number;
  denied: number;
}> {
  const categoryMap = new Map<string, {
    totalReimbursable: number;
    pending: number;
    received: number;
    denied: number;
  }>();
  
  transactions
    .filter(t => t.isReimbursable)
    .forEach(t => {
      const existing = categoryMap.get(t.category) || {
        totalReimbursable: 0,
        pending: 0,
        received: 0,
        denied: 0,
      };
      
      existing.totalReimbursable += t.amount;
      
      switch (t.reimbursementStatus) {
        case 'pending':
          existing.pending += t.amount;
          break;
        case 'received':
          existing.received += (t.reimbursementAmount || t.amount);
          break;
        case 'denied':
          existing.denied += t.amount;
          break;
      }
      
      categoryMap.set(t.category, existing);
    });
  
  return Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    ...data,
  }));
}
