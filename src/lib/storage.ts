// Simple localStorage-based storage for demo
// In production, replace with proper backend API

export interface Transaction {
  id: string;
  userId: string;
  date: Date;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
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

// Storage keys
const KEYS = {
  TRANSACTIONS: 'couple_fin_transactions',
  BUDGETS: 'couple_fin_budgets',
  GOALS: 'couple_fin_goals',
  DEBTS: 'couple_fin_debts',
  INVESTMENTS: 'couple_fin_investments',
  NOTES: 'couple_fin_notes',
  REMINDERS: 'couple_fin_reminders',
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
    return all.filter(t => t.userId === userId || (includeJoint && t.isJoint));
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
    return all.filter(b => b.userId === userId || (includeJoint && b.isJoint));
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
    return all.filter(g => g.userId === userId || (includeJoint && g.isJoint));
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
      isJoint: true,
    });
    
    transactionStorage.create({
      userId,
      date: new Date(),
      description: 'Salary',
      amount: 4115,
      category: 'Income',
      type: 'income',
      isJoint: false,
    });
  }
  
  if (budgetStorage.getAll().length === 0) {
    budgetStorage.create({
      userId,
      category: 'Food',
      monthlyAmount: 1200,
      weeklyAmount: 300,
      yearlyAmount: 14400,
      spent: 850,
      isJoint: true,
    });
  }
}
