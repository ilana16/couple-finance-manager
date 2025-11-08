import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
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
  aiInsights
} from "../drizzle/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { getDb } from "./db";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Transactions
  transactions: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      return await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, ctx.user.id))
        .orderBy(desc(transactions.date));
    }),

    listRecurring: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      return await db
        .select()
        .from(transactions)
        .where(and(
          eq(transactions.userId, ctx.user.id),
          eq(transactions.isRecurring, true)
        ))
        .orderBy(desc(transactions.date));
    }),

    create: protectedProcedure
      .input(z.object({
        accountId: z.number(),
        categoryId: z.number(),
        amount: z.string(),
        type: z.enum(["income", "expense"]),
        description: z.string().optional(),
        date: z.date(),
        isRecurring: z.boolean().optional(),
        recurringFrequency: z.enum(["daily", "weekly", "biweekly", "monthly", "yearly"]).optional(),
        isPending: z.boolean().optional(),
        isProjected: z.boolean().optional(),
        attachments: z.string().optional(), // JSON string of attachment URLs
        notes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [transaction] = await db.insert(transactions).values({
          ...input,
          userId: ctx.user.id,
        });
        
        return transaction;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        accountId: z.number().optional(),
        categoryId: z.number().optional(),
        amount: z.string().optional(),
        type: z.enum(["income", "expense"]).optional(),
        description: z.string().optional(),
        date: z.date().optional(),
        notes: z.string().optional(),
        isPending: z.boolean().optional(),
        isProjected: z.boolean().optional(),
        isRecurring: z.boolean().optional(),
        recurringFrequency: z.enum(["daily", "weekly", "biweekly", "monthly", "yearly"]).optional(),
        attachments: z.string().optional(), // JSON string of attachment URLs
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const { id, ...data } = input;
        const [transaction] = await db
          .update(transactions)
          .set(data)
          .where(
            and(
              eq(transactions.id, id),
              eq(transactions.userId, ctx.user.id)
            )
          );
        
        return transaction;
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        await db
          .delete(transactions)
          .where(
            and(
              eq(transactions.id, input.id),
              eq(transactions.userId, ctx.user.id)
            )
          );
        
        return { success: true };
      }),

    uploadAttachment: protectedProcedure
      .input(z.object({
        file: z.string(), // Base64 encoded file
        filename: z.string(),
        mimeType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { storagePut } = await import("./storage.js");
        
        // Convert base64 to buffer
        const base64Data = input.file.split(',')[1] || input.file;
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Generate unique filename
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(7);
        const fileKey = `transactions/${ctx.user.id}/${timestamp}-${randomSuffix}-${input.filename}`;
        
        // Upload to S3
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        return { url, filename: input.filename };
      }),

    exportCSV: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const allTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, ctx.user.id))
        .orderBy(desc(transactions.date));
      
      // Get categories and accounts for lookup
      const allCategories = await db.select().from(categories);
      const allAccounts = await db.select().from(accounts).where(eq(accounts.ownerId, ctx.user.id));
      
      const categoryMap = Object.fromEntries(allCategories.map(c => [c.id, c.name]));
      const accountMap = Object.fromEntries(allAccounts.map(a => [a.id, a.name]));
      
      // Generate CSV content
      const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Account', 'Status', 'Notes'];
      const rows = allTransactions.map(t => [
        new Date(t.date).toISOString().split('T')[0],
        t.description || '',
        t.amount,
        t.type,
        categoryMap[t.categoryId] || '',
        accountMap[t.accountId] || '',
        t.isProjected ? 'Projected' : t.isPending ? 'Pending' : 'Actual',
        t.notes || ''
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      return { csv: csvContent };
    }),

    importCSV: protectedProcedure
      .input(z.object({
        csvData: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Parse CSV
        const lines = input.csvData.trim().split('\n');
        if (lines.length < 2) {
          throw new Error("CSV file is empty or invalid");
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const dataLines = lines.slice(1);
        
        // Get categories and accounts for lookup
        const allCategories = await db.select().from(categories);
        const allAccounts = await db.select().from(accounts).where(eq(accounts.ownerId, ctx.user.id));
        
        const categoryMap = Object.fromEntries(allCategories.map(c => [c.name.toLowerCase(), c.id]));
        const accountMap = Object.fromEntries(allAccounts.map(a => [a.name.toLowerCase(), a.id]));
        
        let imported = 0;
        let failed = 0;
        
        for (const line of dataLines) {
          try {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const row: Record<string, string> = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            
            const categoryId = categoryMap[row['Category']?.toLowerCase()];
            const accountId = accountMap[row['Account']?.toLowerCase()];
            
            if (!categoryId || !accountId) {
              failed++;
              continue;
            }
            
            const status = row['Status']?.toLowerCase() || 'actual';
            
            await db.insert(transactions).values({
              userId: ctx.user.id,
              accountId,
              categoryId,
              amount: row['Amount'],
              type: (row['Type']?.toLowerCase() === 'income' ? 'income' : 'expense') as 'income' | 'expense',
              description: row['Description'],
              date: new Date(row['Date']),
              notes: row['Notes'] || undefined,
              isProjected: status === 'projected',
              isPending: status === 'pending',
              isRecurring: false,
            });
            
            imported++;
          } catch (error) {
            failed++;
          }
        }
        
        return { imported, failed };
      }),

    generateRecurring: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get all recurring transactions
      const recurringTransactions = await db
        .select()
        .from(transactions)
        .where(and(
          eq(transactions.userId, ctx.user.id),
          eq(transactions.isRecurring, true)
        ));
      
      let generated = 0;
      const today = new Date();
      const futureDate = new Date(today);
      futureDate.setMonth(futureDate.getMonth() + 3); // Generate 3 months ahead
      
      for (const recurring of recurringTransactions) {
        if (!recurring.recurringFrequency) continue;
        
        let nextDate = new Date(recurring.date);
        
        // Generate transactions until 3 months from now
        while (nextDate <= futureDate) {
          // Calculate next occurrence
          switch (recurring.recurringFrequency) {
            case 'daily':
              nextDate.setDate(nextDate.getDate() + 1);
              break;
            case 'weekly':
              nextDate.setDate(nextDate.getDate() + 7);
              break;
            case 'biweekly':
              nextDate.setDate(nextDate.getDate() + 14);
              break;
            case 'monthly':
              nextDate.setMonth(nextDate.getMonth() + 1);
              break;
            case 'yearly':
              nextDate.setFullYear(nextDate.getFullYear() + 1);
              break;
          }
          
          if (nextDate > futureDate) break;
          
          // Check if transaction already exists for this date
          const existing = await db
            .select()
            .from(transactions)
            .where(and(
              eq(transactions.userId, ctx.user.id),
              eq(transactions.description, recurring.description || ''),
              eq(transactions.amount, recurring.amount),
              sql`DATE(${transactions.date}) = DATE(${nextDate.toISOString()})`
            ))
            .limit(1);
          
          if (existing.length === 0) {
            // Create projected transaction
            await db.insert(transactions).values({
              userId: ctx.user.id,
              accountId: recurring.accountId,
              categoryId: recurring.categoryId,
              amount: recurring.amount,
              type: recurring.type,
              description: recurring.description,
              date: new Date(nextDate),
              notes: `Auto-generated from recurring transaction`,
              isProjected: true,
              isPending: false,
              isRecurring: false,
            });
            generated++;
          }
        }
      }
      
      return { generated };
    }),

    suggestCategory: protectedProcedure
      .input(z.object({
        description: z.string(),
        amount: z.string(),
        type: z.enum(["income", "expense"]),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get user's categories
        const userCategories = await db
          .select()
          .from(categories)
          .where(eq(categories.userId, ctx.user.id));

        // Build category list for AI
        const categoryList = userCategories
          .map(cat => `${cat.name} (${cat.type}): ${cat.icon}`)
          .join(", ");

        // Use LLM to suggest category
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a financial categorization assistant. Given a transaction description, amount, and type (income/expense), suggest the most appropriate category from the user's available categories. Respond with JSON containing: categoryName (exact match from list), confidence (0-100), and reason (brief explanation).`
            },
            {
              role: "user",
              content: `Transaction: "${input.description}", Amount: ${input.amount} ILS, Type: ${input.type}\n\nAvailable categories: ${categoryList}\n\nSuggest the best category.`
            }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "category_suggestion",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  categoryName: { type: "string", description: "The suggested category name" },
                  confidence: { type: "number", description: "Confidence score 0-100" },
                  reason: { type: "string", description: "Brief explanation for the suggestion" }
                },
                required: ["categoryName", "confidence", "reason"],
                additionalProperties: false
              }
            }
          }
        });

        const content = response.choices[0].message.content;
        const contentStr = typeof content === 'string' ? content : '{}';
        const suggestion = JSON.parse(contentStr);
        
        // Find the matching category ID
        const matchedCategory = userCategories.find(
          cat => cat.name.toLowerCase() === suggestion.categoryName.toLowerCase()
        );

        return {
          categoryId: matchedCategory?.id || null,
          categoryName: suggestion.categoryName,
          confidence: suggestion.confidence,
          reason: suggestion.reason
        };
      }),

    processRecurring: protectedProcedure.mutation(async ({ ctx }) => {
      // Manual trigger for recurring transaction processing
      const { processRecurringTransactions } = await import('./recurringProcessor');
      const result = await processRecurringTransactions();
      return result;
    }),

    skipNextRecurrence: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get the recurring transaction
        const [recurringTx] = await db
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.id, input.id),
              eq(transactions.userId, ctx.user.id),
              eq(transactions.isRecurring, true)
            )
          )
          .limit(1);

        if (!recurringTx || !recurringTx.nextRecurringDate || !recurringTx.recurringFrequency) {
          throw new Error("Recurring transaction not found");
        }

        // Calculate the date after the next occurrence
        const { calculateNextOccurrence } = await import('./recurringProcessor');
        const skipToDate = calculateNextOccurrence(recurringTx.nextRecurringDate, recurringTx.recurringFrequency);

        // Update to skip next occurrence
        await db
          .update(transactions)
          .set({ nextRecurringDate: skipToDate })
          .where(eq(transactions.id, input.id));

        return { success: true, nextDate: skipToDate };
      }),

    pauseRecurring: protectedProcedure
      .input(z.object({ id: z.number(), pause: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // If pausing, set nextRecurringDate to null
        // If resuming, calculate next date from last occurrence or current date
        let nextDate: Date | null = null;

        if (!input.pause) {
          const [recurringTx] = await db
            .select()
            .from(transactions)
            .where(
              and(
                eq(transactions.id, input.id),
                eq(transactions.userId, ctx.user.id)
              )
            )
            .limit(1);

          if (recurringTx && recurringTx.recurringFrequency) {
            const baseDate = recurringTx.lastRecurringDate || recurringTx.date;
            const { calculateNextOccurrence } = await import('./recurringProcessor');
            nextDate = calculateNextOccurrence(baseDate, recurringTx.recurringFrequency);
          }
        }

        await db
          .update(transactions)
          .set({ nextRecurringDate: nextDate })
          .where(
            and(
              eq(transactions.id, input.id),
              eq(transactions.userId, ctx.user.id)
            )
          );

        return { success: true, paused: input.pause };
      }),

    requestApproval: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Update transaction to require approval
        await db
          .update(transactions)
          .set({
            requiresApproval: true,
            approvalStatus: "pending"
          })
          .where(
            and(
              eq(transactions.id, input.id),
              eq(transactions.userId, ctx.user.id)
            )
          );

        return { success: true };
      }),

    approveTransaction: protectedProcedure
      .input(z.object({ id: z.number(), approve: z.boolean() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const status = input.approve ? "approved" : "rejected";

        await db
          .update(transactions)
          .set({
            approvalStatus: status,
            approvedBy: ctx.user.id,
            approvedAt: new Date()
          })
          .where(eq(transactions.id, input.id));

        return { success: true, status };
      }),

    pendingApprovals: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get transactions pending approval
      // In a real app, you'd filter by partner relationship
      const pending = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.requiresApproval, true),
            eq(transactions.approvalStatus, "pending")
          )
        )
        .orderBy(desc(transactions.createdAt));

      return pending;
    }),
  }),

  // Accounts
  accounts: router({
    // Auto-create default account if user has none
    ensureDefault: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const existing = await db
        .select()
        .from(accounts)
        .where(eq(accounts.ownerId, ctx.user.id))
        .limit(1);
      
      if (existing.length === 0) {
        const [account] = await db.insert(accounts).values({
          name: "Main Account",
          type: "checking",
          ownership: "joint",
          balance: "0.00",
          currency: "USD",
          ownerId: ctx.user.id,
        });
        return account;
      }
      
      return existing[0];
    }),
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      return await db
        .select()
        .from(accounts)
        .where(eq(accounts.ownerId, ctx.user.id));
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(["checking", "savings", "credit", "investment", "cash", "other"]),
        ownership: z.enum(["joint", "individual"]),
        balance: z.string(),
        currency: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [account] = await db.insert(accounts).values({
          ...input,
          ownerId: ctx.user.id,
        });
        
        return account;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string(),
        type: z.enum(["checking", "savings", "credit", "investment", "cash", "other"]),
        ownership: z.enum(["joint", "individual"]),
        balance: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        await db
          .update(accounts)
          .set({
            name: input.name,
            type: input.type,
            ownership: input.ownership,
            balance: input.balance,
          })
          .where(and(eq(accounts.id, input.id), eq(accounts.ownerId, ctx.user.id)));
        
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        await db
          .delete(accounts)
          .where(and(eq(accounts.id, input.id), eq(accounts.ownerId, ctx.user.id)));
        
        return { success: true };
      }),
  }),

  // Categories
  categories: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      return await db
        .select()
        .from(categories)
        .where(
          sql`${categories.isDefault} = true OR ${categories.userId} = ${ctx.user.id}`
        );
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(["income", "expense"]),
        color: z.string().optional(),
        icon: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [category] = await db.insert(categories).values({
          ...input,
          userId: ctx.user.id,
          isDefault: false,
        });
        
        return category;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        type: z.enum(["income", "expense"]).optional(),
        color: z.string().optional(),
        icon: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const { id, ...updates } = input;
        
        // Verify the category belongs to the user
        const [existing] = await db
          .select()
          .from(categories)
          .where(and(
            eq(categories.id, id),
            eq(categories.userId, ctx.user.id)
          ));
        
        if (!existing) {
          throw new Error("Category not found or you don't have permission to edit it");
        }
        
        await db
          .update(categories)
          .set(updates)
          .where(eq(categories.id, id));
        
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        // Verify the category belongs to the user and is not default
        const [existing] = await db
          .select()
          .from(categories)
          .where(and(
            eq(categories.id, input.id),
            eq(categories.userId, ctx.user.id),
            eq(categories.isDefault, false)
          ));
        
        if (!existing) {
          throw new Error("Category not found, is a default category, or you don't have permission to delete it");
        }
        
        await db
          .delete(categories)
          .where(eq(categories.id, input.id));
        
      return { success: true };
    }),

    scanReceipt: protectedProcedure
      .input(z.object({ imageUrl: z.string().url() }))
      .mutation(async ({ input }) => {
        const { extractReceiptData, validateImageUrl } = await import('./receiptOCR');
        
        // Validate image URL
        const isValid = await validateImageUrl(input.imageUrl);
        if (!isValid) {
          throw new Error('Invalid image URL or image not accessible');
        }

        // Extract receipt data
        const receiptData = await extractReceiptData(input.imageUrl);
        return receiptData;
      }),
  }),

  // Budgets
  budgets: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      return await db
        .select()
        .from(budgets)
        .where(eq(budgets.userId, ctx.user.id));
    }),

    create: protectedProcedure
      .input(z.object({
        categoryId: z.number(),
        amount: z.string(),
        period: z.enum(["weekly", "monthly", "yearly"]),
        startDate: z.date(),
        endDate: z.date().optional(),
        alertThreshold: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [budget] = await db.insert(budgets).values({
          ...input,
          userId: ctx.user.id,
        });
        
        return budget;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        amount: z.string(),
        period: z.enum(["weekly", "monthly", "yearly"]),
        alertThreshold: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        await db
          .update(budgets)
          .set({
            amount: input.amount,
            period: input.period,
            alertThreshold: input.alertThreshold,
          })
          .where(and(eq(budgets.id, input.id), eq(budgets.userId, ctx.user.id)));
        
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        await db
          .delete(budgets)
          .where(and(eq(budgets.id, input.id), eq(budgets.userId, ctx.user.id)));
        
        return { success: true };
      }),
  }),

  // Savings Goals
  goals: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      return await db
        .select()
        .from(savingsGoals)
        .where(eq(savingsGoals.userId, ctx.user.id));
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        targetAmount: z.string(),
        currentAmount: z.string().optional(),
        ownership: z.enum(["joint", "individual"]),
        targetDate: z.date().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [goal] = await db.insert(savingsGoals).values({
          ...input,
          userId: ctx.user.id,
        });
        
        return goal;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        targetAmount: z.string().optional(),
        currentAmount: z.string().optional(),
        targetDate: z.date().optional().nullable(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        isCompleted: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const { id, ...data } = input;
        await db
          .update(savingsGoals)
          .set(data)
          .where(
            and(
              eq(savingsGoals.id, id),
              eq(savingsGoals.userId, ctx.user.id)
            )
          );
        
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        await db
          .delete(savingsGoals)
          .where(and(eq(savingsGoals.id, input.id), eq(savingsGoals.userId, ctx.user.id)));
        
      return { success: true };
    }),

    livePrice: protectedProcedure
      .input(z.object({ symbol: z.string() }))
      .query(async ({ input }) => {
        const { callDataApi } = await import('./_core/dataApi');
        
        try {
          const result: any = await callDataApi('YahooFinance/get_stock_chart', {
            query: {
              symbol: input.symbol,
              region: 'US',
              interval: '1d',
              range: '1d'
            }
          });

          if (result && result.chart && result.chart.result && result.chart.result[0]) {
            const data = result.chart.result[0];
            const meta = data.meta;
            
            return {
              symbol: meta.symbol,
              price: meta.regularMarketPrice,
              change: meta.regularMarketPrice - meta.chartPreviousClose,
              changePercent: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100,
              dayHigh: meta.regularMarketDayHigh,
              dayLow: meta.regularMarketDayLow,
              volume: meta.regularMarketVolume,
              currency: meta.currency
            };
          }

          throw new Error('Invalid response from stock API');
        } catch (error) {
          console.error('[Investments] Failed to fetch live price:', error);
          throw new Error('Failed to fetch stock price');
        }
      }),

    performance: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const userInvestments = await db
        .select()
        .from(investments)
        .where(eq(investments.userId, ctx.user.id));

      const { callDataApi } = await import('./_core/dataApi');
      const performanceData = [];

      for (const inv of userInvestments) {
        try {
          if (!inv.symbol) continue;
          
          const result: any = await callDataApi('YahooFinance/get_stock_chart', {
            query: {
              symbol: inv.symbol,
              region: 'US',
              interval: '1d',
              range: '1d'
            }
          });

          if (result && result.chart && result.chart.result && result.chart.result[0]) {
            const meta = result.chart.result[0].meta;
            const currentPrice = meta.regularMarketPrice;
            const purchasePrice = parseFloat(inv.purchasePrice || '0');
            const shares = parseFloat(inv.quantity || '0');
            
            const currentValue = currentPrice * shares;
            const costBasis = purchasePrice * shares;
            const gainLoss = currentValue - costBasis;
            const gainLossPercent = (gainLoss / costBasis) * 100;

            performanceData.push({
              id: inv.id,
              name: inv.name,
              symbol: inv.symbol,
              shares,
              purchasePrice,
              currentPrice,
              currentValue,
              costBasis,
              gainLoss,
              gainLossPercent
            });
          }
        } catch (error) {
          console.error(`[Investments] Failed to fetch price for ${inv.symbol}:`, error);
        }
      }

      return performanceData;
    }),
  }),

  // Debts
  debts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      return await db
        .select()
        .from(debts)
        .where(eq(debts.userId, ctx.user.id));
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(["credit_card", "student_loan", "car_loan", "mortgage", "personal_loan", "other"]),
        originalAmount: z.string(),
        currentBalance: z.string(),
        interestRate: z.string().optional(),
        minimumPayment: z.string().optional(),
        dueDate: z.number().optional(),
        ownership: z.enum(["joint", "individual"]),
        payoffStrategy: z.enum(["snowball", "avalanche", "custom"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [debt] = await db.insert(debts).values({
          ...input,
          userId: ctx.user.id,
        });
        
        return debt;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        currentBalance: z.string().optional(),
        interestRate: z.string().optional(),
        minimumPayment: z.string().optional(),
        dueDate: z.number().optional(),
        payoffStrategy: z.enum(["snowball", "avalanche", "custom"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const { id, ...data } = input;
        await db
          .update(debts)
          .set(data)
          .where(and(eq(debts.id, id), eq(debts.userId, ctx.user.id)));
        
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        await db
          .delete(debts)
          .where(and(eq(debts.id, input.id), eq(debts.userId, ctx.user.id)));
        
        return { success: true };
      }),
  }),

  // Investments
  investments: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      return await db
        .select()
        .from(investments)
        .where(eq(investments.userId, ctx.user.id));
    }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        type: z.enum(["stocks", "bonds", "mutual_funds", "etf", "crypto", "real_estate", "other"]),
        symbol: z.string().optional(),
        quantity: z.string().optional(),
        purchasePrice: z.string().optional(),
        currentPrice: z.string().optional(),
        ownership: z.enum(["joint", "individual"]),
        purchaseDate: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [investment] = await db.insert(investments).values({
          ...input,
          userId: ctx.user.id,
        });
        
        return investment;
      }),
  }),

  // Shared Notes
  notes: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      return await db
        .select()
        .from(sharedNotes)
        .where(eq(sharedNotes.userId, ctx.user.id))
        .orderBy(desc(sharedNotes.createdAt));
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string().optional(),
        content: z.string(),
        relatedType: z.enum(["transaction", "budget", "goal", "debt", "general"]).optional(),
        relatedId: z.number().optional(),
        isPinned: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [note] = await db.insert(sharedNotes).values({
          ...input,
          userId: ctx.user.id,
        });
        
        return note;
      }),
  }),

  // Reminders
  reminders: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      return await db
        .select()
        .from(reminders)
        .where(eq(reminders.userId, ctx.user.id))
        .orderBy(reminders.dueDate);
    }),

    create: protectedProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        dueDate: z.date(),
        notifyBefore: z.number().optional(),
        relatedType: z.enum(["bill", "debt", "goal", "general"]).optional(),
        relatedId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const [reminder] = await db.insert(reminders).values({
          ...input,
          userId: ctx.user.id,
        });
        
        return reminder;
      }),
  }),

  // AI Insights
  insights: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      return await db
        .select()
        .from(aiInsights)
        .where(eq(aiInsights.userId, ctx.user.id))
        .orderBy(desc(aiInsights.createdAt));
    }),
  }),

  // Dashboard Summary
  dashboard: router({
    summary: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get current month's date range
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const daysInMonth = endOfMonth.getDate();
      const daysRemaining = Math.max(1, endOfMonth.getDate() - now.getDate() + 1);

      // Get all transactions for current month
      const monthTransactions = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, ctx.user.id),
            gte(transactions.date, startOfMonth),
            lte(transactions.date, endOfMonth)
          )
        );

      // Separate actual, projected, and pending transactions
      const actualTransactions = monthTransactions.filter(t => !t.isProjected && !t.isPending);
      const projectedTransactions = monthTransactions.filter(t => t.isProjected);
      const pendingTransactions = monthTransactions.filter(t => t.isPending);

      // Calculate actual income and expenses
      const actualIncome = actualTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const actualExpenses = actualTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      // Calculate projected income and expenses
      const projectedIncome = projectedTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const projectedExpenses = projectedTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      // Calculate pending debits and credits
      const pendingDebits = pendingTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const pendingCredits = pendingTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      // Calculate balances
      const actualBalance = actualIncome - actualExpenses;
      const projectedBalance = projectedIncome - projectedExpenses;
      
      // Flexible balance calculations (actual balance minus pending debits plus pending credits)
      const flexibleBalance = actualBalance - pendingDebits + pendingCredits;
      const weeklyFlexibleBalance = flexibleBalance / (daysRemaining / 7);
      const dailyFlexibleBalance = flexibleBalance / daysRemaining;

      const netSavings = actualIncome - actualExpenses;
      const savingsRate = actualIncome > 0 ? (netSavings / actualIncome) * 100 : 0;

      // Get total savings goals progress
      const goals = await db
        .select()
        .from(savingsGoals)
        .where(eq(savingsGoals.userId, ctx.user.id));

      const totalGoalTarget = goals.reduce((sum, g) => sum + parseFloat(g.targetAmount), 0);
      const totalGoalCurrent = goals.reduce((sum, g) => sum + parseFloat(g.currentAmount), 0);

      // Get total debt
      const userDebts = await db
        .select()
        .from(debts)
        .where(eq(debts.userId, ctx.user.id));

      const totalDebt = userDebts.reduce((sum, d) => sum + parseFloat(d.currentBalance), 0);

      // Get credit accounts and calculate total available credit
      const creditAccounts = await db
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.ownerId, ctx.user.id),
            eq(accounts.type, 'credit')
          )
        );

      const totalCreditLimit = creditAccounts.reduce((sum, a) => sum + (a.creditLimit ? parseFloat(a.creditLimit.toString()) : 0), 0);
      const totalAvailableCredit = creditAccounts.reduce((sum, a) => sum + (a.availableCredit ? parseFloat(a.availableCredit.toString()) : 0), 0);

      return {
        // Actual figures
        actualIncome,
        actualExpenses,
        actualBalance,
        
        // Projected figures
        projectedIncome,
        projectedExpenses,
        projectedBalance,
        
        // Pending transactions
        pendingDebits,
        pendingCredits,
        
        // Flexible balance
        flexibleBalance,
        weeklyFlexibleBalance,
        dailyFlexibleBalance,
        daysRemaining,
        
        // Legacy fields for compatibility
        totalIncome: actualIncome,
        totalExpenses: actualExpenses,
        netSavings,
        savingsRate: parseFloat(savingsRate.toFixed(1)),
        
        // Goals and debt
        totalGoalTarget,
        totalGoalCurrent,
        totalDebt,
        
        // Credit
        totalCreditLimit,
        totalAvailableCredit,
        
        // Recent transactions
        recentTransactions: actualTransactions.slice(0, 5),
      };
    }),

    insights: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      // Get recent transactions for analysis
      const now = new Date();
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      
      const recentTransactions = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, ctx.user.id),
            gte(transactions.date, threeMonthsAgo)
          )
        )
        .orderBy(desc(transactions.date))
        .limit(100);

      // Get budgets
      const userBudgets = await db
        .select()
        .from(budgets)
        .where(eq(budgets.userId, ctx.user.id));

      // Prepare data summary for LLM
      const totalIncome = recentTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      
      const totalExpenses = recentTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const categorySpending: Record<string, number> = {};
      for (const t of recentTransactions.filter(t => t.type === 'expense')) {
        const catId = t.categoryId?.toString() || 'uncategorized';
        categorySpending[catId] = (categorySpending[catId] || 0) + parseFloat(t.amount);
      }

      const topCategories = Object.entries(categorySpending)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([cat, amount]) => `Category ${cat}: ₪${amount.toFixed(2)}`);

      // Call LLM for insights
      const prompt = `You are a financial advisor analyzing spending patterns. Based on the following data:

Total Income (last 3 months): ₪${totalIncome.toFixed(2)}
Total Expenses (last 3 months): ₪${totalExpenses.toFixed(2)}
Savings Rate: ${totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : 0}%
Top Spending Categories:
${topCategories.join('\n')}

Number of Transactions: ${recentTransactions.length}
Active Budgets: ${userBudgets.length}

Provide 3-4 concise, actionable financial insights or recommendations. Focus on:
1. Spending patterns and trends
2. Budget optimization opportunities
3. Savings improvement suggestions
4. Any anomalies or concerns

Format as a JSON array of insight objects with "title" and "description" fields. Keep descriptions under 100 characters.`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are a helpful financial advisor. Respond only with valid JSON." },
            { role: "user", content: prompt }
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "financial_insights",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  insights: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" }
                      },
                      required: ["title", "description"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["insights"],
                additionalProperties: false
              }
            }
          }
        });

        const content = response.choices[0]?.message?.content;
        if (content && typeof content === 'string') {
          const parsed = JSON.parse(content);
          return { insights: parsed.insights || [] };
        }
      } catch (error) {
        console.error("Error generating insights:", error);
      }

      // Fallback insights if LLM fails
      return {
        insights: [
          {
            title: "Track Your Spending",
            description: "Start logging transactions to get personalized insights"
          },
          {
            title: "Set Budgets",
            description: "Create category budgets to control spending"
          },
          {
            title: "Build Emergency Fund",
            description: "Aim to save 3-6 months of expenses"
          }
        ]
      };
    }),

    healthScore: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get last 3 months data
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      // Get transactions
      const userTransactions = await db
        .select()
        .from(transactions)
        .where(
          and(
            eq(transactions.userId, ctx.user.id),
            gte(transactions.date, threeMonthsAgo)
          )
        );

      // Calculate income and expenses
      const totalIncome = userTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
      const totalExpenses = userTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

      // 1. Savings Rate (0-40 points)
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) : 0;
      let savingsScore = 0;
      if (savingsRate >= 0.20) savingsScore = 40;
      else if (savingsRate >= 0.15) savingsScore = 30;
      else if (savingsRate >= 0.10) savingsScore = 20;
      else if (savingsRate >= 0.05) savingsScore = 10;

      // 2. Debt-to-Income Ratio (0-30 points)
      const userDebts = await db
        .select()
        .from(debts)
        .where(eq(debts.userId, ctx.user.id));
      
      const totalDebt = userDebts.reduce((sum, d) => sum + parseFloat(d.currentBalance), 0);
      const monthlyIncome = totalIncome / 3;
      const debtToIncomeRatio = monthlyIncome > 0 ? totalDebt / (monthlyIncome * 12) : 0;
      
      let debtScore = 30;
      if (debtToIncomeRatio > 0.40) debtScore = 0;
      else if (debtToIncomeRatio > 0.30) debtScore = 10;
      else if (debtToIncomeRatio > 0.20) debtScore = 20;
      else if (debtToIncomeRatio > 0.10) debtScore = 25;

      // 3. Budget Adherence (0-30 points)
      const userBudgets = await db
        .select()
        .from(budgets)
        .where(eq(budgets.userId, ctx.user.id));

      let budgetScore = 0;
      if (userBudgets.length > 0) {
        budgetScore = 15; // Base score for having budgets
        
        // Calculate adherence (simplified - would need actual spending per category)
        const hasMultipleBudgets = userBudgets.length >= 3;
        if (hasMultipleBudgets) budgetScore += 15;
      }

      // Total Score
      const totalScore = Math.round(savingsScore + debtScore + budgetScore);

      // Generate improvement tips
      const tips: string[] = [];
      if (savingsScore < 30) {
        tips.push("Increase your savings rate to at least 15% of income");
      }
      if (debtScore < 20) {
        tips.push("Focus on reducing debt to improve your debt-to-income ratio");
      }
      if (budgetScore < 20) {
        tips.push("Create budgets for major expense categories to track spending");
      }
      if (totalScore >= 80) {
        tips.push("Excellent financial health! Consider increasing investment contributions");
      }

      return {
        score: totalScore,
        breakdown: {
          savingsRate: {
            score: savingsScore,
            maxScore: 40,
            value: savingsRate,
            label: `${(savingsRate * 100).toFixed(1)}% savings rate`
          },
          debtToIncome: {
            score: debtScore,
            maxScore: 30,
            value: debtToIncomeRatio,
            label: `${(debtToIncomeRatio * 100).toFixed(1)}% debt-to-income`
          },
          budgetAdherence: {
            score: budgetScore,
            maxScore: 30,
            value: userBudgets.length,
            label: `${userBudgets.length} active budgets`
          }
        },
        tips,
        grade: totalScore >= 80 ? 'Excellent' : totalScore >= 60 ? 'Good' : totalScore >= 40 ? 'Fair' : 'Needs Improvement'
      };
    }),
  }),

  // Reports
  reports: router({
    generate: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
        type: z.enum(["monthly", "yearly", "custom"])
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get transactions in date range
        const userTransactions = await db
          .select()
          .from(transactions)
          .where(
            and(
              eq(transactions.userId, ctx.user.id),
              gte(transactions.date, input.startDate),
              lte(transactions.date, input.endDate)
            )
          )
          .orderBy(desc(transactions.date));

        // Get categories for mapping
        const userCategories = await db
          .select()
          .from(categories)
          .where(eq(categories.userId, ctx.user.id));

        const categoryMap = new Map(userCategories.map(c => [c.id, c.name]));

        // Calculate totals
        const totalIncome = userTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        const totalExpenses = userTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

        const netSavings = totalIncome - totalExpenses;
        const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

        // Category breakdown
        const categoryTotals = new Map<string, number>();
        userTransactions
          .filter(t => t.type === 'expense')
          .forEach(t => {
            const catName = categoryMap.get(t.categoryId) || 'Uncategorized';
            categoryTotals.set(catName, (categoryTotals.get(catName) || 0) + Math.abs(parseFloat(t.amount)));
          });

        const categoryBreakdown = Array.from(categoryTotals.entries())
          .map(([category, amount]) => ({
            category,
            amount,
            percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
          }))
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 10);

        // Get goals
        const userGoals = await db
          .select()
          .from(savingsGoals)
          .where(eq(savingsGoals.userId, ctx.user.id));

        const goals = userGoals.map(g => ({
          name: g.name,
          target: parseFloat(g.targetAmount),
          current: parseFloat(g.currentAmount),
          progress: (parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100
        }));

        // Top transactions
        const topTransactions = userTransactions.slice(0, 15).map(t => ({
          date: new Date(t.date).toLocaleDateString(),
          description: t.description || 'No description',
          amount: t.type === 'income' ? parseFloat(t.amount) : -parseFloat(t.amount),
          category: categoryMap.get(t.categoryId) || 'Uncategorized'
        }));

        // Generate period string
        const periodStr = input.type === 'monthly' 
          ? new Date(input.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          : input.type === 'yearly'
          ? new Date(input.startDate).getFullYear().toString()
          : `${new Date(input.startDate).toLocaleDateString()} - ${new Date(input.endDate).toLocaleDateString()}`;

        // Generate PDF
        const { generateFinancialReport } = await import('./pdfReport');
        const pdfBuffer = await generateFinancialReport({
          period: periodStr,
          totalIncome,
          totalExpenses,
          netSavings,
          savingsRate,
          categoryBreakdown,
          goals,
          topTransactions
        });

        // Return base64 encoded PDF
        return {
          pdf: pdfBuffer.toString('base64'),
          filename: `financial-report-${input.type}-${Date.now()}.pdf`
        };
      }),
  }),

  // Currency
  currency: router({
    rates: publicProcedure
      .input(z.object({
        base: z.string().default("ILS"),
        targets: z.array(z.string()).optional()
      }))
      .query(async ({ input }) => {
        const { fetchExchangeRates, SUPPORTED_CURRENCIES } = await import('./currency');
        
        if (input.targets && input.targets.length > 0) {
          const { getMultipleRates } = await import('./currency');
          const rates = await getMultipleRates(input.base, input.targets);
          return { base: input.base, rates, timestamp: new Date() };
        }
        
        const rates = await fetchExchangeRates(input.base);
        return { base: input.base, rates, timestamp: new Date() };
      }),

    convert: publicProcedure
      .input(z.object({
        amount: z.number(),
        from: z.string(),
        to: z.string()
      }))
      .query(async ({ input }) => {
        const { convertCurrency } = await import('./currency');
        return await convertCurrency(input.amount, input.from, input.to);
      }),

    supported: publicProcedure.query(async () => {
      const { SUPPORTED_CURRENCIES } = await import('./currency');
      return SUPPORTED_CURRENCIES;
    }),
  }),

  // Alerts
  alerts: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { spendingAlerts } = await import('../drizzle/schema');
      return await db
        .select()
        .from(spendingAlerts)
        .where(eq(spendingAlerts.userId, ctx.user.id));
    }),

    history: protectedProcedure
      .input(z.object({ limit: z.number().default(20) }))
      .query(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const { alertHistory } = await import('../drizzle/schema');
        return await db
          .select()
          .from(alertHistory)
          .where(eq(alertHistory.userId, ctx.user.id))
          .orderBy(desc(alertHistory.createdAt))
          .limit(input.limit);
      }),

    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { alertHistory } = await import('../drizzle/schema');
      const result = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(alertHistory)
        .where(
          and(
            eq(alertHistory.userId, ctx.user.id),
            eq(alertHistory.isRead, false)
          )
        );

      return result[0]?.count || 0;
    }),

    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const { alertHistory } = await import('../drizzle/schema');
        await db
          .update(alertHistory)
          .set({ isRead: true })
          .where(
            and(
              eq(alertHistory.id, input.id),
              eq(alertHistory.userId, ctx.user.id)
            )
          );

        return { success: true };
      }),

    checkNow: protectedProcedure.mutation(async ({ ctx }) => {
      const { checkUserAlerts } = await import('./alertMonitor');
      return await checkUserAlerts(ctx.user.id);
    }),
  }),
});

export type AppRouter = typeof appRouter;
