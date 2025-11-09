import { FirestoreStorage, createTimestamp } from './firestore-storage';

export interface PredictionItem {
  category: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'yearly';
}

export interface Predictions {
  id: string;
  userId: string; // 'joint' for joint predictions, or user ID for individual
  income: PredictionItem[];
  expense: PredictionItem[];
  createdAt: string;
  updatedAt: string;
}

class PredictionsStorage extends FirestoreStorage<Predictions> {
  constructor() {
    super('predictions');
  }

  // Get predictions by user ID or joint
  async getByUserId(userId: string): Promise<Predictions | null> {
    const all = await this.getAll();
    return all.find(p => p.userId === userId) || null;
  }

  // Get joint predictions
  async getJoint(): Promise<Predictions | null> {
    return this.getByUserId('joint');
  }

  // Save predictions (create or update)
  async savePredictions(userId: string, income: PredictionItem[], expense: PredictionItem[]): Promise<void> {
    const existing = await this.getByUserId(userId);
    
    const data = {
      userId,
      income,
      expense,
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

export const predictionsStorage = new PredictionsStorage();
