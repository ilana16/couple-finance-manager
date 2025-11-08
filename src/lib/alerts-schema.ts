import { int, mysqlEnum, mysqlTable, text, timestamp, boolean, decimal } from "drizzle-orm/mysql-core";

/**
 * Spending Alerts - User-configurable alerts for budget monitoring
 */
export const spendingAlerts = mysqlTable("spendingAlerts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["budget_threshold", "unusual_spending", "goal_milestone", "recurring_due"]).notNull(),
  budgetId: int("budgetId"), // For budget threshold alerts
  categoryId: int("categoryId"), // For category-specific alerts
  threshold: decimal("threshold", { precision: 5, scale: 2 }), // Percentage (e.g., 80.00 for 80%)
  enabled: boolean("enabled").default(true).notNull(),
  lastTriggered: timestamp("lastTriggered"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SpendingAlert = typeof spendingAlerts.$inferSelect;
export type InsertSpendingAlert = typeof spendingAlerts.$inferInsert;

/**
 * Alert History - Record of triggered alerts
 */
export const alertHistory = mysqlTable("alertHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  alertId: int("alertId"), // Reference to spendingAlerts
  type: mysqlEnum("type", ["budget_threshold", "unusual_spending", "goal_milestone", "recurring_due"]).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  metadata: text("metadata"), // JSON data about the alert
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlertHistory = typeof alertHistory.$inferSelect;
export type InsertAlertHistory = typeof alertHistory.$inferInsert;
