import { FirestoreStorage, createTimestamp } from './firestore-storage';

export interface Categories {
  id: string;
  userId: string; // 'shared' for shared categories
  incomeCategories: string[];
  expenseCategories: string[];
  createdAt: string;
  updatedAt: string;
}

class CategoriesStorage extends FirestoreStorage<Categories> {
  constructor() {
    super('categories');
  }

  // Get categories (always shared)
  async getCategories(): Promise<Categories | null> {
    const all = await this.getAll();
    return all.find(c => c.userId === 'shared') || null;
  }

  // Save categories (create or update)
  async saveCategories(incomeCategories: string[], expenseCategories: string[]): Promise<void> {
    const existing = await this.getCategories();
    
    const data = {
      userId: 'shared',
      incomeCategories,
      expenseCategories,
      createdAt: existing?.createdAt || createTimestamp(),
      updatedAt: createTimestamp(),
    };

    if (existing) {
      await this.update(existing.id, data);
    } else {
      await this.create(data);
    }
  }
}

export const categoriesStorage = new CategoriesStorage();
