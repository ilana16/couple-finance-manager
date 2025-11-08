import { getDb } from "./db";
import { spendingAlerts, alertHistory, budgets, transactions } from "../drizzle/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";

interface AlertCheck {
  userId: number;
  triggered: number;
  alerts: Array<{
    type: string;
    title: string;
    message: string;
    severity: "info" | "warning" | "critical";
  }>;
}

/**
 * Check all active alerts for a user and trigger notifications
 */
export async function checkUserAlerts(userId: number): Promise<AlertCheck> {
  const db = await getDb();
  if (!db) {
    return { userId, triggered: 0, alerts: [] };
  }

  const result: AlertCheck = { userId, triggered: 0, alerts: [] };

  try {
    // Get user's active alerts
    const userAlerts = await db
      .select()
      .from(spendingAlerts)
      .where(
        and(
          eq(spendingAlerts.userId, userId),
          eq(spendingAlerts.enabled, true)
        )
      );

    for (const alert of userAlerts) {
      switch (alert.type) {
        case "budget_threshold":
          await checkBudgetThreshold(db, userId, alert, result);
          break;
        case "unusual_spending":
          await checkUnusualSpending(db, userId, alert, result);
          break;
        case "goal_milestone":
          // Placeholder for goal milestone checks
          break;
        case "recurring_due":
          // Placeholder for recurring transaction checks
          break;
      }
    }

    console.log(`[AlertMonitor] User ${userId}: ${result.triggered} alerts triggered`);
  } catch (error) {
    console.error(`[AlertMonitor] Error checking alerts for user ${userId}:`, error);
  }

  return result;
}

/**
 * Check if budget threshold has been exceeded
 */
async function checkBudgetThreshold(
  db: any,
  userId: number,
  alert: any,
  result: AlertCheck
) {
  if (!alert.budgetId || !alert.threshold) return;

  // Get budget
  const [budget] = await db
    .select()
    .from(budgets)
    .where(
      and(
        eq(budgets.id, alert.budgetId),
        eq(budgets.userId, userId)
      )
    )
    .limit(1);

  if (!budget) return;

  // Calculate spending for this budget's category and period
  const startDate = new Date(budget.startDate);
  const endDate = new Date(budget.endDate);

  const spending = await db
    .select({
      total: sql<number>`COALESCE(SUM(CAST(${transactions.amount} AS DECIMAL(15,2))), 0)`
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.categoryId, budget.categoryId),
        eq(transactions.type, "expense"),
        gte(transactions.date, startDate),
        sql`${transactions.date} <= ${endDate}`
      )
    );

  const totalSpent = spending[0]?.total || 0;
  const budgetAmount = parseFloat(budget.amount);
  const percentage = (totalSpent / budgetAmount) * 100;
  const thresholdValue = parseFloat(alert.threshold);

  if (percentage >= thresholdValue) {
    const severity: "info" | "warning" | "critical" = percentage >= 100 ? "critical" : percentage >= 90 ? "warning" : "info";
    
    const alertData = {
      type: "budget_threshold" as const,
      title: `Budget Alert: ${budget.name}`,
      message: `You've spent ₪${totalSpent.toFixed(2)} (${percentage.toFixed(0)}%) of your ₪${budgetAmount.toFixed(2)} budget for ${budget.name}.`,
      severity
    };

    // Save to history
    await db.insert(alertHistory).values({
      userId,
      alertId: alert.id,
      type: alertData.type,
      title: alertData.title,
      message: alertData.message,
      severity: alertData.severity,
      isRead: false,
      metadata: JSON.stringify({
        budgetId: budget.id,
        budgetName: budget.name,
        spent: totalSpent,
        budgetAmount,
        percentage
      })
    });

    // Update last triggered
    await db
      .update(spendingAlerts)
      .set({ lastTriggered: new Date() })
      .where(eq(spendingAlerts.id, alert.id));

    result.alerts.push(alertData);
    result.triggered++;
  }
}

/**
 * Check for unusual spending patterns
 */
async function checkUnusualSpending(
  db: any,
  userId: number,
  alert: any,
  result: AlertCheck
) {
  // Get last 30 days of transactions
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentTransactions = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, "expense"),
        gte(transactions.date, thirtyDaysAgo)
      )
    )
    .orderBy(desc(transactions.date));

  if (recentTransactions.length < 10) return; // Need enough data

  // Calculate average daily spending
  const totalSpent = recentTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);
  const avgDailySpending = totalSpent / 30;

  // Check today's spending
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaySpending = recentTransactions
    .filter((t: any) => {
      const txDate = new Date(t.date);
      txDate.setHours(0, 0, 0, 0);
      return txDate.getTime() === today.getTime();
    })
    .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0);

  // Alert if today's spending is 2x average
  if (todaySpending > avgDailySpending * 2) {
    const alertData = {
      type: "unusual_spending" as const,
      title: "Unusual Spending Detected",
      message: `Today's spending (₪${todaySpending.toFixed(2)}) is significantly higher than your daily average (₪${avgDailySpending.toFixed(2)}).`,
      severity: "warning" as const
    };

    await db.insert(alertHistory).values({
      userId,
      alertId: alert.id,
      type: alertData.type,
      title: alertData.title,
      message: alertData.message,
      severity: alertData.severity,
      isRead: false,
      metadata: JSON.stringify({
        todaySpending,
        avgDailySpending,
        ratio: todaySpending / avgDailySpending
      })
    });

    await db
      .update(spendingAlerts)
      .set({ lastTriggered: new Date() })
      .where(eq(spendingAlerts.id, alert.id));

    result.alerts.push(alertData);
    result.triggered++;
  }
}

/**
 * Initialize default alerts for a new user
 */
export async function initializeDefaultAlerts(userId: number) {
  const db = await getDb();
  if (!db) return;

  // Create default budget threshold alerts at 80% and 100%
  await db.insert(spendingAlerts).values([
    {
      userId,
      type: "budget_threshold",
      threshold: "80.00",
      enabled: true
    },
    {
      userId,
      type: "unusual_spending",
      enabled: true
    }
  ]);

  console.log(`[AlertMonitor] Initialized default alerts for user ${userId}`);
}
