import { getDb } from "./db";
import { transactions } from "../drizzle/schema";
import { eq, and, lte, isNotNull } from "drizzle-orm";

/**
 * Process recurring transactions and create new instances
 * This should be called periodically (e.g., daily via cron job)
 */
export async function processRecurringTransactions() {
  const db = await getDb();
  if (!db) {
    console.error("[RecurringProcessor] Database not available");
    return { processed: 0, created: 0, errors: 0 };
  }

  const now = new Date();
  let processed = 0;
  let created = 0;
  let errors = 0;

  try {
    // Find all recurring transactions that are due
    const recurringTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.isRecurring, true),
          isNotNull(transactions.recurringFrequency),
          // Either no next date set, or next date is in the past
          lte(transactions.nextRecurringDate, now)
        )
      );

    console.log(`[RecurringProcessor] Found ${recurringTransactions.length} recurring transactions to process`);

    for (const recurringTx of recurringTransactions) {
      try {
        processed++;

        // Calculate next occurrence date
        const nextDate = calculateNextOccurrence(
          recurringTx.nextRecurringDate || recurringTx.date,
          recurringTx.recurringFrequency!
        );

        // Create new transaction instance
        await db.insert(transactions).values({
          accountId: recurringTx.accountId,
          categoryId: recurringTx.categoryId,
          userId: recurringTx.userId,
          amount: recurringTx.amount,
          type: recurringTx.type,
          description: `${recurringTx.description} (Auto-generated)`,
          date: now,
          isRecurring: false, // The instance is not recurring
          recurringParentId: recurringTx.id,
          isPending: false,
          isProjected: false,
          notes: recurringTx.notes,
        });

        // Update the parent recurring transaction
        await db
          .update(transactions)
          .set({
            lastRecurringDate: now,
            nextRecurringDate: nextDate,
          })
          .where(eq(transactions.id, recurringTx.id));

        created++;
        console.log(`[RecurringProcessor] Created transaction for recurring ID ${recurringTx.id}`);
      } catch (error) {
        errors++;
        console.error(`[RecurringProcessor] Error processing recurring transaction ${recurringTx.id}:`, error);
      }
    }

    console.log(`[RecurringProcessor] Completed: ${processed} processed, ${created} created, ${errors} errors`);
  } catch (error) {
    console.error("[RecurringProcessor] Fatal error:", error);
  }

  return { processed, created, errors };
}

/**
 * Calculate the next occurrence date based on frequency
 */
export function calculateNextOccurrence(currentDate: Date, frequency: string): Date {
  const next = new Date(currentDate);

  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      // Default to monthly if unknown
      next.setMonth(next.getMonth() + 1);
  }

  return next;
}

/**
 * Initialize next recurring dates for existing recurring transactions
 * Call this once to set up dates for transactions that don't have them
 */
export async function initializeRecurringDates() {
  const db = await getDb();
  if (!db) return;

  const recurringWithoutDates = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.isRecurring, true),
        isNotNull(transactions.recurringFrequency)
      )
    );

  for (const tx of recurringWithoutDates) {
    if (!tx.nextRecurringDate) {
      const nextDate = calculateNextOccurrence(tx.date, tx.recurringFrequency!);
      await db
        .update(transactions)
        .set({ nextRecurringDate: nextDate })
        .where(eq(transactions.id, tx.id));
    }
  }

  console.log(`[RecurringProcessor] Initialized ${recurringWithoutDates.length} recurring transactions`);
}
