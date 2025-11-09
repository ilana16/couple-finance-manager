// Simple localStorage-based storage for demo
// In production, replace with proper backend API

export interface Transaction {
  id: string;
  userId: string;
  date: Date;
  description: string;
  amount: number;
  currency?: string;
  amountInNIS?: number;
  category: string;
  type: 'income' | 'expense';
  paymentMethod: 'debit' | 'credit';
  accountId?: string; // For debit transactions
  creditSourceId?: string; // For credit transactions
  isRecurring: boolean;
  recurringFrequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly' | 'custom';
  customRecurringValue?: number; // For custom: the number (e.g., 3 for "every 3 days")
  customRecurringUnit?: 'days' | 'weeks' | 'months' | 'years'; // For custom: the unit
  dayOfMonth?: number; // For monthly recurring: 1-31
  recurringEndDate?: Date; // Optional end date for recurring transactions
  parentTransactionId?: string; // Links to parent if this is a generated recurring transaction
  isJoint: boolean;
  notes?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  projectedAmount?: number; // Projected savings by target date
  targetDate: Date;
  isJoint: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
}

export interface Debt {
  id: string;
  userId: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  projectedPayoff?: number; // Projected amount to be paid
  actualPayoff?: number; // Actual amount paid so far
  interestRate: number;
  minimumPayment: number;
  dueDate: Date;
  isJoint: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Investment {
  id: string;
  userId: string;
  name: string;
  type: string;
  amount: number;
  currentValue: number;
  projectedValue?: number; // Projected value
  actualValue?: number; // Actual current value
  purchaseDate: Date;
  isJoint: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SharedNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate: Date;
  isCompleted: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface CreditSource {
  id: string;
  userId: string;
  name: string;
  type: 'credit_card' | 'line_of_credit' | 'loan' | 'other';
  creditLimit: number;
  currentBalance: number;
  availableCredit: number;
  interestRate?: number;
  paymentDayOfMonth: number; // Day of month to pay (1-31)
  paymentOption: 'pay_all' | 'custom_amount'; // Payment preference
  customPaymentAmount?: number; // Custom amount if paymentOption is 'custom_amount'
  isJoint: boolean;
  institution?: string;
  accountNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Storage keys
const KEYS = {
  TRANSACTIONS: 'couple_fin_transactions',
  BUDGETS: 'couple_fin_budgets',
  GOALS: 'couple_fin_goals',
  DEBTS: 'couple_fin_debts',
  INVESTMENTS: 'couple_fin_investments',
  NOTES: 'couple_fin_notes',
  REMINDERS: 'couple_fin_reminders',
  ACCOUNTS: 'couple_fin_accounts',
  CREDIT_SOURCES: 'couple_fin_credit_sources',
};

// Generic storage functions
function getItems<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  if (!data) return [];
  
  try {
    const items = JSON.parse(data);
    // Parse dates
    return items.map((item: any) => ({
      ...item,
      date: item.date ? new Date(item.date) : undefined,
      targetDate: item.targetDate ? new Date(item.targetDate) : undefined,
      dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
      purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : undefined,
      createdAt: new Date(item.createdAt),
      updatedAt: new Date(item.updatedAt),
    }));
  } catch {
    return [];
  }
}

function setItems<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Transactions
export const transactionStorage = {
  getAll: (): Transaction[] => getItems<Transaction>(KEYS.TRANSACTIONS),
  
  getByUser: (userId: string, includeJoint: boolean = true): Transaction[] => {
    const all = transactionStorage.getAll();
    if (includeJoint) {
      // In joint mode, show ALL transactions (from both partners)
      return all;
    }
    // In individual mode, show only current user's transactions
    return all.filter(t => t.userId === userId);
  },
  
  create: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Transaction => {
    const transaction: Transaction = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const all = transactionStorage.getAll();
    setItems(KEYS.TRANSACTIONS, [...all, transaction]);
    return transaction;
  },
  
  update: (id: string, data: Partial<Transaction>): Transaction | null => {
    const all = transactionStorage.getAll();
    const index = all.findIndex(t => t.id === id);
    
    if (index === -1) return null;
    
    const updated = {
      ...all[index],
      ...data,
      updatedAt: new Date(),
    };
    
    all[index] = updated;
    setItems(KEYS.TRANSACTIONS, all);
    return updated;
  },
  
  delete: (id: string): boolean => {
    const all = transactionStorage.getAll();
    const filtered = all.filter(t => t.id !== id);
    
    if (filtered.length === all.length) return false;
    
    setItems(KEYS.TRANSACTIONS, filtered);
    return true;
  },
};

// Budgets
export const budgetStorage = {
  getAll: (): Budget[] => getItems<Budget>(KEYS.BUDGETS),
  
  getByUser: (userId: string, includeJoint: boolean = true): Budget[] => {
    const all = budgetStorage.getAll();
    if (includeJoint) {
      // In joint mode, show ALL budgets (from both partners)
      return all;
    }
    // In individual mode, show only current user's budgets
    return all.filter(b => b.userId === userId);
  },
  
  create: (data: Omit<Budget, 'id' | 'createdAt' | 'updatedAt'>): Budget => {
    const budget: Budget = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const all = budgetStorage.getAll();
    setItems(KEYS.BUDGETS, [...all, budget]);
    return budget;
  },
  
  update: (id: string, data: Partial<Budget>): Budget | null => {
    const all = budgetStorage.getAll();
    const index = all.findIndex(b => b.id === id);
    
    if (index === -1) return null;
    
    const updated = {
      ...all[index],
      ...data,
      updatedAt: new Date(),
    };
    
    all[index] = updated;
    setItems(KEYS.BUDGETS, all);
    return updated;
  },
  
  delete: (id: string): boolean => {
    const all = budgetStorage.getAll();
    const filtered = all.filter(b => b.id !== id);
    
    if (filtered.length === all.length) return false;
    
    setItems(KEYS.BUDGETS, filtered);
    return true;
  },
};

// Savings Goals
export const goalStorage = {
  getAll: (): SavingsGoal[] => getItems<SavingsGoal>(KEYS.GOALS),
  
  getByUser: (userId: string, includeJoint: boolean = true): SavingsGoal[] => {
    const all = goalStorage.getAll();
    if (includeJoint) {
      // In joint mode, show ALL goals (from both partners)
      return all;
    }
    // In individual mode, show only current user's goals
    return all.filter(g => g.userId === userId);
  },
  
  create: (data: Omit<SavingsGoal, 'id' | 'createdAt' | 'updatedAt'>): SavingsGoal => {
    const goal: SavingsGoal = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const all = goalStorage.getAll();
    setItems(KEYS.GOALS, [...all, goal]);
    return goal;
  },
  
  update: (id: string, data: Partial<SavingsGoal>): SavingsGoal | null => {
    const all = goalStorage.getAll();
    const index = all.findIndex(g => g.id === id);
    
    if (index === -1) return null;
    
    const updated = {
      ...all[index],
      ...data,
      updatedAt: new Date(),
    };
    
    all[index] = updated;
    setItems(KEYS.GOALS, all);
    return updated;
  },
  
  delete: (id: string): boolean => {
    const all = goalStorage.getAll();
    const filtered = all.filter(g => g.id !== id);
    
    if (filtered.length === all.length) return false;
    
    setItems(KEYS.GOALS, filtered);
    return true;
  },
};

// Shared Notes
export const noteStorage = {
  getAll: (): SharedNote[] => getItems<SharedNote>(KEYS.NOTES),
  
  create: (data: Omit<SharedNote, 'id' | 'createdAt' | 'updatedAt'>): SharedNote => {
    const note: SharedNote = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const all = noteStorage.getAll();
    setItems(KEYS.NOTES, [...all, note]);
    return note;
  },
  
  update: (id: string, data: Partial<SharedNote>): SharedNote | null => {
    const all = noteStorage.getAll();
    const index = all.findIndex(n => n.id === id);
    
    if (index === -1) return null;
    
    const updated = {
      ...all[index],
      ...data,
      updatedAt: new Date(),
    };
    
    all[index] = updated;
    setItems(KEYS.NOTES, all);
    return updated;
  },
  
  delete: (id: string): boolean => {
    const all = noteStorage.getAll();
    const filtered = all.filter(n => n.id !== id);
    
    if (filtered.length === all.length) return false;
    
    setItems(KEYS.NOTES, filtered);
    return true;
  },
};

// Reminders
export const reminderStorage = {
  getAll: (): Reminder[] => getItems<Reminder>(KEYS.REMINDERS),
  
  create: (data: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>): Reminder => {
    const reminder: Reminder = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const all = reminderStorage.getAll();
    setItems(KEYS.REMINDERS, [...all, reminder]);
    return reminder;
  },
  
  update: (id: string, data: Partial<Reminder>): Reminder | null => {
    const all = reminderStorage.getAll();
    const index = all.findIndex(r => r.id === id);
    
    if (index === -1) return null;
    
    const updated = {
      ...all[index],
      ...data,
      updatedAt: new Date(),
    };
    
    all[index] = updated;
    setItems(KEYS.REMINDERS, all);
    return updated;
  },
  
  delete: (id: string): boolean => {
    const all = reminderStorage.getAll();
    const filtered = all.filter(r => r.id !== id);
    
    if (filtered.length === all.length) return false;
    
    setItems(KEYS.REMINDERS, filtered);
    return true;
  },
};

// Initialize with demo data if empty
export function initializeDemoData(userId: string) {
  if (transactionStorage.getAll().length === 0) {
    // Add some demo transactions
    transactionStorage.create({
      userId,
      date: new Date(),
      description: 'Grocery Shopping',
      amount: 150,
      category: 'Food',
      type: 'expense',
      paymentMethod: 'debit',
      isRecurring: false,
      isJoint: true,
    });
    
    transactionStorage.create({
      userId,
      date: new Date(),
      description: 'Salary',
      amount: 4115,
      category: 'Income',
      type: 'income',
      paymentMethod: 'debit',
      isRecurring: false,
      isJoint: false,
    });
  }
  
  // Budget starts empty - users can add their own or use templates
}

// Accounts
export const accountStorage = {
  getAll: (): Account[] => getItems<Account>(KEYS.ACCOUNTS),
  
  getByUser: (userId: string, includeJoint: boolean = true): Account[] => {
    const all = accountStorage.getAll();
    if (includeJoint) {
      // In joint mode, show ALL accounts (from both partners)
      return all;
    }
    // In individual mode, show only current user's accounts
    return all.filter(a => a.userId === userId);
  },
  
  getById: (id: string): Account | null => {
    return accountStorage.getAll().find(a => a.id === id) || null;
  },
  
  create: (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Account => {
    const account: Account = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const all = accountStorage.getAll();
    setItems(KEYS.ACCOUNTS, [...all, account]);
    return account;
  },
  
  update: (id: string, data: Partial<Account>): Account | null => {
    const all = accountStorage.getAll();
    const index = all.findIndex(a => a.id === id);
    
    if (index === -1) return null;
    
    const updated = {
      ...all[index],
      ...data,
      updatedAt: new Date(),
    };
    
    all[index] = updated;
    setItems(KEYS.ACCOUNTS, all);
    return updated;
  },
  
  delete: (id: string): boolean => {
    const all = accountStorage.getAll();
    const filtered = all.filter(a => a.id !== id);
    
    if (filtered.length === all.length) return false;
    
    setItems(KEYS.ACCOUNTS, filtered);
    return true;
  },
  
  // Update balance when transaction is added/removed
  updateBalance: (accountId: string, amount: number, isIncome: boolean): void => {
    const account = accountStorage.getById(accountId);
    if (!account) return;
    
    const newBalance = isIncome 
      ? account.balance + amount 
      : account.balance - amount;
    
    accountStorage.update(accountId, { balance: newBalance });
  },
};

// Credit Sources
export const creditStorage = {
  getAll: (): CreditSource[] => getItems<CreditSource>(KEYS.CREDIT_SOURCES),
  
  getByUser: (userId: string, includeJoint: boolean = true): CreditSource[] => {
    const all = creditStorage.getAll();
    if (includeJoint) {
      // In joint mode, show ALL credit sources (from both partners)
      return all;
    }
    // In individual mode, show only current user's credit sources
    return all.filter(c => c.userId === userId);
  },
  
  getById: (id: string): CreditSource | null => {
    return creditStorage.getAll().find(c => c.id === id) || null;
  },
  
  create: (data: Omit<CreditSource, 'id' | 'createdAt' | 'updatedAt' | 'availableCredit'>): CreditSource => {
    const availableCredit = data.creditLimit - data.currentBalance;
    
    const creditSource: CreditSource = {
      ...data,
      availableCredit,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const all = creditStorage.getAll();
    setItems(KEYS.CREDIT_SOURCES, [...all, creditSource]);
    return creditSource;
  },
  
  update: (id: string, data: Partial<CreditSource>): CreditSource | null => {
    const all = creditStorage.getAll();
    const index = all.findIndex(c => c.id === id);
    
    if (index === -1) return null;
    
    const updated = {
      ...all[index],
      ...data,
      updatedAt: new Date(),
    };
    
    // Recalculate available credit
    if (data.creditLimit !== undefined || data.currentBalance !== undefined) {
      updated.availableCredit = updated.creditLimit - updated.currentBalance;
    }
    
    all[index] = updated;
    setItems(KEYS.CREDIT_SOURCES, all);
    return updated;
  },
  
  delete: (id: string): boolean => {
    const all = creditStorage.getAll();
    const filtered = all.filter(c => c.id !== id);
    
    if (filtered.length === all.length) return false;
    
    setItems(KEYS.CREDIT_SOURCES, filtered);
    return true;
  },
  
  // Update balance when credit transaction is made
  updateBalance: (creditSourceId: string, amount: number, isPayment: boolean): void => {
    const credit = creditStorage.getById(creditSourceId);
    if (!credit) return;
    
    const newBalance = isPayment 
      ? credit.currentBalance - amount 
      : credit.currentBalance + amount;
    
    creditStorage.update(creditSourceId, { currentBalance: newBalance });
  },
  
  // Make payment on credit account
  makePayment: (creditSourceId: string, payFromAccountId: string): boolean => {
    const credit = creditStorage.getById(creditSourceId);
    const account = accountStorage.getById(payFromAccountId);
    
    if (!credit || !account) return false;
    
    const paymentAmount = credit.paymentOption === 'pay_all' 
      ? credit.currentBalance 
      : (credit.customPaymentAmount || 0);
    
    // Check if account has sufficient funds
    if (account.balance < paymentAmount) return false;
    
    // Update credit balance
    creditStorage.updateBalance(creditSourceId, paymentAmount, true);
    
    // Update account balance
    accountStorage.updateBalance(payFromAccountId, paymentAmount, false);
    
    return true;
  },
};
