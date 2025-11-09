// Migration utility to move data from localStorage to Firestore
import {
  transactionStorage,
  budgetStorage,
  goalStorage,
  accountStorage,
  creditStorage,
  noteStorage,
  reminderStorage,
  createTimestamp
} from './storage-firestore';

export interface MigrationResult {
  success: boolean;
  migrated: {
    transactions: number;
    budgets: number;
    goals: number;
    accounts: number;
    creditSources: number;
    notes: number;
    reminders: number;
  };
  errors: string[];
}

export async function migrateLocalStorageToFirestore(): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migrated: {
      transactions: 0,
      budgets: 0,
      goals: 0,
      accounts: 0,
      creditSources: 0,
      notes: 0,
      reminders: 0
    },
    errors: []
  };

  try {
    // Migrate transactions
    const transactionsData = localStorage.getItem('couple_fin_transactions');
    if (transactionsData) {
      const transactions = JSON.parse(transactionsData);
      for (const transaction of transactions) {
        try {
          await transactionStorage.create({
            ...transaction,
            date: transaction.date || new Date().toISOString(),
            createdAt: transaction.createdAt || createTimestamp(),
            updatedAt: transaction.updatedAt || createTimestamp()
          });
          result.migrated.transactions++;
        } catch (error) {
          result.errors.push(`Transaction ${transaction.id}: ${error}`);
        }
      }
    }

    // Migrate budgets
    const budgetsData = localStorage.getItem('couple_fin_budgets');
    if (budgetsData) {
      const budgets = JSON.parse(budgetsData);
      for (const budget of budgets) {
        try {
          await budgetStorage.create({
            ...budget,
            createdAt: budget.createdAt || createTimestamp(),
            updatedAt: budget.updatedAt || createTimestamp()
          });
          result.migrated.budgets++;
        } catch (error) {
          result.errors.push(`Budget ${budget.id}: ${error}`);
        }
      }
    }

    // Migrate goals
    const goalsData = localStorage.getItem('couple_fin_goals');
    if (goalsData) {
      const goals = JSON.parse(goalsData);
      for (const goal of goals) {
        try {
          await goalStorage.create({
            ...goal,
            targetDate: goal.targetDate || new Date().toISOString(),
            createdAt: goal.createdAt || createTimestamp(),
            updatedAt: goal.updatedAt || createTimestamp()
          });
          result.migrated.goals++;
        } catch (error) {
          result.errors.push(`Goal ${goal.id}: ${error}`);
        }
      }
    }

    // Migrate accounts
    const accountsData = localStorage.getItem('couple_fin_accounts');
    if (accountsData) {
      const accounts = JSON.parse(accountsData);
      for (const account of accounts) {
        try {
          await accountStorage.create({
            ...account,
            createdAt: account.createdAt || createTimestamp(),
            updatedAt: account.updatedAt || createTimestamp()
          });
          result.migrated.accounts++;
        } catch (error) {
          result.errors.push(`Account ${account.id}: ${error}`);
        }
      }
    }

    // Migrate credit sources
    const creditData = localStorage.getItem('couple_fin_credit_sources');
    if (creditData) {
      const creditSources = JSON.parse(creditData);
      for (const credit of creditSources) {
        try {
          await creditStorage.create({
            ...credit,
            createdAt: credit.createdAt || createTimestamp(),
            updatedAt: credit.updatedAt || createTimestamp()
          });
          result.migrated.creditSources++;
        } catch (error) {
          result.errors.push(`Credit source ${credit.id}: ${error}`);
        }
      }
    }

    // Migrate notes
    const notesData = localStorage.getItem('couple_fin_notes');
    if (notesData) {
      const notes = JSON.parse(notesData);
      for (const note of notes) {
        try {
          await noteStorage.create({
            ...note,
            createdAt: note.createdAt || createTimestamp(),
            updatedAt: note.updatedAt || createTimestamp()
          });
          result.migrated.notes++;
        } catch (error) {
          result.errors.push(`Note ${note.id}: ${error}`);
        }
      }
    }

    // Migrate reminders
    const remindersData = localStorage.getItem('couple_fin_reminders');
    if (remindersData) {
      const reminders = JSON.parse(remindersData);
      for (const reminder of reminders) {
        try {
          await reminderStorage.create({
            ...reminder,
            dueDate: reminder.dueDate || new Date().toISOString(),
            createdAt: reminder.createdAt || createTimestamp(),
            updatedAt: reminder.updatedAt || createTimestamp()
          });
          result.migrated.reminders++;
        } catch (error) {
          result.errors.push(`Reminder ${reminder.id}: ${error}`);
        }
      }
    }

    // Set migration flag
    localStorage.setItem('couple_fin_migrated_to_firestore', 'true');
    localStorage.setItem('couple_fin_migration_date', new Date().toISOString());

  } catch (error) {
    result.success = false;
    result.errors.push(`Migration failed: ${error}`);
  }

  return result;
}

// Check if migration has been completed
export function isMigrationComplete(): boolean {
  return localStorage.getItem('couple_fin_migrated_to_firestore') === 'true';
}

// Get migration date
export function getMigrationDate(): string | null {
  return localStorage.getItem('couple_fin_migration_date');
}
