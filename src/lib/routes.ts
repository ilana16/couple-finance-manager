import { createServer, type Server } from "http";
import { db } from "../drizzle/db";
import { 
  transactions, 
  accounts, 
  categories,
  budgets,
  savingsGoals,
  debts,
  investments,
  sharedNotes,
  reminders,
  documents,
  notificationPreferences,
  aiInsights
} from "../drizzle/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  // ============================================
  // TRANSACTIONS
  // ============================================
  
  // Get all transactions for the user
  app.get("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const userTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, req.user.id))
        .orderBy(desc(transactions.date));

      res.json(userTransactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Create a new transaction
  app.post("/api/transactions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {