import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

// Generic Firestore storage class
export class FirestoreStorage<T extends { id: string }> {
  private collectionName: string;

  constructor(collectionName: string) {
    this.collectionName = collectionName;
  }

  // Get collection reference
  private getCollectionRef() {
    return collection(db, this.collectionName);
  }

  // Get document reference
  private getDocRef(id: string) {
    return doc(db, this.collectionName, id);
  }

  // Create a new document
  async create(data: Omit<T, 'id'>): Promise<T> {
    const docRef = doc(this.getCollectionRef());
    const newData = { ...data, id: docRef.id } as T;
    await setDoc(docRef, newData);
    return newData;
  }

  // Get all documents
  async getAll(): Promise<T[]> {
    const querySnapshot = await getDocs(this.getCollectionRef());
    return querySnapshot.docs.map(doc => doc.data() as T);
  }

  // Get document by ID
  async getById(id: string): Promise<T | null> {
    const docSnap = await getDoc(this.getDocRef(id));
    return docSnap.exists() ? (docSnap.data() as T) : null;
  }

  // Get documents by user ID
  async getByUser(userId: string, includeJoint: boolean = false): Promise<T[]> {
    let q;
    if (includeJoint) {
      // In joint mode, get all documents (no filtering)
      q = query(this.getCollectionRef());
    } else {
      // In individual mode, filter by userId
      q = query(
        this.getCollectionRef(),
        where('userId', '==', userId)
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as T);
  }

  // Update document
  async update(id: string, data: Partial<T>): Promise<void> {
    await updateDoc(this.getDocRef(id), data as any);
  }

  // Delete document
  async delete(id: string): Promise<void> {
    await deleteDoc(this.getDocRef(id));
  }

  // Delete all documents (for clear data functionality)
  async deleteAll(): Promise<void> {
    const querySnapshot = await getDocs(this.getCollectionRef());
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }

  // Delete documents by user ID
  async deleteByUser(userId: string): Promise<void> {
    const q = query(
      this.getCollectionRef(),
      where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  }
}

// Helper function to convert Firestore Timestamp to ISO string
export function timestampToDate(timestamp: any): string {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  return timestamp;
}

// Helper function to convert Date to Firestore Timestamp
export function dateToTimestamp(date: string | Date): Timestamp {
  if (typeof date === 'string') {
    return Timestamp.fromDate(new Date(date));
  }
  return Timestamp.fromDate(date);
}
