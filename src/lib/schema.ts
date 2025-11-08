import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, index } from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  partnerId: int("partnerId"), // Link to partner user
  preferredCurrency: varchar("preferredCurrency", { length: 3 }).default("ILS"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Accounts - Joint or Individual financial accounts
 */
export const accounts = mysqlTable("accounts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["checking", "savings", "credit", "investment", "cash", "other"]).notNull(),
  ownership: mysqlEnum("ownership", ["joint", "individual"]).notNull(),
  ownerId: int("ownerId").notNull(), // User who owns or created this account
  balance: decimal("balance", { precision: 15, scale: 2 }).default("0.00").notNull(),
  creditLimit: decimal("creditLimit", { precision: 15, scale: 2 }), // For credit accounts
  availableCredit: decimal("availableCredit", { precision: 15, scale: 2 }), // Current available credit
  currency: varchar("currency", { length: 3 }).default("USD"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ownerIdx: index("owner_idx").on(table.ownerId),
}));

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

/**
 * Categories - Customizable transaction categories
 */
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  color: varchar("color", { length: 7 }).default("#3B82F6"), // Hex color
  icon: varchar("icon", { length: 50 }), // Icon name
  userId: int("userId"), // null for default categories, user-specific otherwise
  isDefault: boolean("isDefault").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

/**
 * Transactions - Income and expense records
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId").notNull(),
  categoryId: int("categoryId").notNull(),
  userId: int("userId").notNull(), // User who created the transaction
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("ILS"), // ISO 4217 currency code
  exchangeRate: decimal("exchangeRate", { precision: 10, scale: 6 }).default("1.000000"), // Rate to base currency
  type: mysqlEnum("type", ["income", "expense"]).notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  isRecurring: boolean("isRecurring").default(false),
  recurringFrequency: mysqlEnum("recurringFrequency", ["daily", "weekly", "biweekly", "monthly", "yearly"]),
  lastRecurringDate: timestamp("lastRecurringDate"), // Last time this recurring transaction was created
  nextRecurringDate: timestamp("nextRecurringDate"), // Next scheduled date
  recurringParentId: int("recurringParentId"), // ID of the parent recurring template
  isPending: boolean("isPending").default(false), // For pending debits/credits
  isProjected: boolean("isProjected").default(false), // For projected transactions
  requiresApproval: boolean("requiresApproval").default(false), // Needs partner approval
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]).default("approved"),
  approvedBy: int("approvedBy"), // User ID who approved
  approvedAt: timestamp("approvedAt"), // When it was approved
  attachments: text("attachments"), // JSON array of attachment URLs
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  accountIdx: index("account_idx").on(table.accountId),
  userIdx: index("user_idx").on(table.userId),
  dateIdx: index("date_idx").on(table.date),
}));

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Budgets - Monthly or custom period budgets
 */
export const budgets = mysqlTable("budgets", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("categoryId").notNull(),
  userId: int("userId").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  period: mysqlEnum("period", ["weekly", "monthly", "yearly"]).default("monthly").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate"),
  alertThreshold: int("alertThreshold").default(80), // Alert at 80% of budget
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  categoryIdx: index("category_idx").on(table.categoryId),
}));

export type Budget = typeof budgets.$inferSelect;
export type InsertBudget = typeof budgets.$inferInsert;

/**
 * Savings Goals
 */
export const savingsGoals = mysqlTable("savingsGoals", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  targetAmount: decimal("targetAmount", { precision: 15, scale: 2 }).notNull(),
  currentAmount: decimal("currentAmount", { precision: 15, scale: 2 }).default("0.00").notNull(),
  userId: int("userId").notNull(),
  ownership: mysqlEnum("ownership", ["joint", "individual"]).notNull(),
  targetDate: timestamp("targetDate"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
  isCompleted: boolean("isCompleted").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
}));

export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type InsertSavingsGoal = typeof savingsGoals.$inferInsert;

/**
 * Debts - Credit cards, loans, mortgages, etc.
 */
export const debts = mysqlTable("debts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["credit_card", "student_loan", "car_loan", "mortgage", "personal_loan", "other"]).notNull(),
  originalAmount: decimal("originalAmount", { precision: 15, scale: 2 }).notNull(),
  currentBalance: decimal("currentBalance", { precision: 15, scale: 2 }).notNull(),
  interestRate: decimal("interestRate", { precision: 5, scale: 2 }), // e.g., 5.25%
  minimumPayment: decimal("minimumPayment", { precision: 15, scale: 2 }),
  dueDate: int("dueDate"), // Day of month (1-31)
  userId: int("userId").notNull(),
  ownership: mysqlEnum("ownership", ["joint", "individual"]).notNull(),
  payoffStrategy: mysqlEnum("payoffStrategy", ["snowball", "avalanche", "custom"]),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
}));

export type Debt = typeof debts.$inferSelect;
export type InsertDebt = typeof debts.$inferInsert;

/**
 * Debt Payments - Track payments made toward debts
 */
export const debtPayments = mysqlTable("debtPayments", {
  id: int("id").autoincrement().primaryKey(),
  debtId: int("debtId").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  paymentDate: timestamp("paymentDate").notNull(),
  principalAmount: decimal("principalAmount", { precision: 15, scale: 2 }),
  interestAmount: decimal("interestAmount", { precision: 15, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  debtIdx: index("debt_idx").on(table.debtId),
}));

export type DebtPayment = typeof debtPayments.$inferSelect;
export type InsertDebtPayment = typeof debtPayments.$inferInsert;

/**
 * Investments - Portfolio tracking
 */
export const investments = mysqlTable("investments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["stocks", "bonds", "mutual_funds", "etf", "crypto", "real_estate", "other"]).notNull(),
  symbol: varchar("symbol", { length: 20 }),
  quantity: decimal("quantity", { precision: 15, scale: 4 }),
  purchasePrice: decimal("purchasePrice", { precision: 15, scale: 2 }),
  currentPrice: decimal("currentPrice", { precision: 15, scale: 2 }),
  userId: int("userId").notNull(),
  ownership: mysqlEnum("ownership", ["joint", "individual"]).notNull(),
  purchaseDate: timestamp("purchaseDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
}));

export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = typeof investments.$inferInsert;

/**
 * Shared Notes - Collaborative notes between partners
 */
export const sharedNotes = mysqlTable("sharedNotes", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }),
  content: text("content").notNull(),
  userId: int("userId").notNull(), // Creator
  relatedType: mysqlEnum("relatedType", ["transaction", "budget", "goal", "debt", "general"]),
  relatedId: int("relatedId"), // ID of related entity
  isPinned: boolean("isPinned").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
}));

export type SharedNote = typeof sharedNotes.$inferSelect;
export type InsertSharedNote = typeof sharedNotes.$inferInsert;

/**
 * Reminders - Shared reminders for bills, goals, etc.
 */
export const reminders = mysqlTable("reminders", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  dueDate: timestamp("dueDate").notNull(),
  userId: int("userId").notNull(),
  isCompleted: boolean("isCompleted").default(false),
  notifyBefore: int("notifyBefore").default(1), // Days before to notify
  relatedType: mysqlEnum("relatedType", ["bill", "debt", "goal", "general"]),
  relatedId: int("relatedId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
  dueDateIdx: index("due_date_idx").on(table.dueDate),
}));

export type Reminder = typeof reminders.$inferSelect;
export type InsertReminder = typeof reminders.$inferInsert;

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

/**
 * Documents - Secure document storage
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }), // MIME type
  size: int("size"), // File size in bytes
  storageUrl: text("storageUrl").notNull(), // S3 URL
  category: mysqlEnum("category", ["tax", "receipt", "contract", "statement", "insurance", "other"]),
  userId: int("userId").notNull(),
  relatedType: mysqlEnum("relatedType", ["transaction", "debt", "investment", "general"]),
  relatedId: int("relatedId"),
  uploadDate: timestamp("uploadDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
}));

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Notification Preferences
 */
export const notificationPreferences = mysqlTable("notificationPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  emailNotifications: boolean("emailNotifications").default(true),
  budgetAlerts: boolean("budgetAlerts").default(true),
  billReminders: boolean("billReminders").default(true),
  goalMilestones: boolean("goalMilestones").default(true),
  weeklyReports: boolean("weeklyReports").default(false),
  monthlyReports: boolean("monthlyReports").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/**
 * AI Insights - Store AI-generated insights and predictions
 */
export const aiInsights = mysqlTable("aiInsights", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["spending_pattern", "budget_prediction", "anomaly", "recommendation", "trend"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  data: text("data"), // JSON data for charts/details
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium"),
  isRead: boolean("isRead").default(false),
  validUntil: timestamp("validUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("user_idx").on(table.userId),
}));

export type AIInsight = typeof aiInsights.$inferSelect;
export type InsertAIInsight = typeof aiInsights.$inferInsert;
