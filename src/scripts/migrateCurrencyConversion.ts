/**
 * Migration script to add amountInNIS field to existing transactions
 * Run this once after deploying the currency conversion feature
 */

import { db } from '../lib/firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';
import { convertToNIS } from '../services/currencyService';

export async function migrateCurrencyConversion() {
  console.log('Starting currency conversion migration...');
  
  try {
    const transactionsRef = collection(db, 'transactions');
    const snapshot = await getDocs(transactionsRef);
    
    let updated = 0;
    let skipped = 0;
    let errors = 0;
    
    for (const docSnap of snapshot.docs) {
      const transaction = docSnap.data();
      
      // Skip if already has amountInNIS
      if (transaction.amountInNIS !== undefined) {
        skipped++;
        continue;
      }
      
      try {
        const currency = transaction.currency || 'ILS';
        const amount = transaction.amount || 0;
        
        // Convert to NIS
        const amountInNIS = await convertToNIS(amount, currency);
        
        // Update the document
        await updateDoc(doc(db, 'transactions', docSnap.id), {
          amountInNIS: amountInNIS
        });
        
        updated++;
        console.log(`Updated transaction ${docSnap.id}: ${amount} ${currency} = ${amountInNIS} ILS`);
      } catch (error) {
        errors++;
        console.error(`Error updating transaction ${docSnap.id}:`, error);
      }
    }
    
    console.log('\nMigration complete!');
    console.log(`Updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Errors: ${errors}`);
    console.log(`Total: ${snapshot.docs.length}`);
    
    return {
      success: true,
      updated,
      skipped,
      errors,
      total: snapshot.docs.length
    };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Helper function to run migration from browser console
// Usage: Open browser console and run: window.runCurrencyMigration()
if (typeof window !== 'undefined') {
  (window as any).runCurrencyMigration = migrateCurrencyConversion;
}
