// server.ts
import express from 'express';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './src/db/index.ts';
import { users, profiles, budgets, budgetCategories, transactions, savingsGoals, notifications } from './src/db/schema.ts';
import { requireAuth, type AuthRequest } from './src/middleware/auth.ts';
import { getOrCreateUser, getUserProfile, updateUserProfile, seedDemoDataForUser } from './src/db/helpers.ts';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';

import { GoogleGenAI } from '@google/genai';

dotenv.config();

const ai = new GoogleGenAI();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// --- AUTH & PROFILE ROUTES ---

// Sync or register user & return profile
app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const email = req.user?.email || '';
    const displayName = req.body.displayName || req.user?.name || '';
    const photoUrl = req.body.photoUrl || req.user?.picture || '';

    const dbUser = await getOrCreateUser(uid, email, displayName, photoUrl);
    let profile = await getUserProfile(uid);

    // If profile is fresh, auto seed demo transactions & goals
    if (!profile) {
      await seedDemoDataForUser(uid, 'student');
      profile = await getUserProfile(uid);
    }

    res.json({ user: dbUser, profile });
  } catch (error: any) {
    console.error('Error syncing user:', error);
    res.status(500).json({ error: error.message || 'Failed to sync user' });
  }
});

// Update Profile (e.g. switch Student <-> Employee, income, savings target, theme, complete onboarding)
app.put('/api/profile', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const { profileType, monthlyIncome, currency, institutionOrEmployer, savingsTargetMonthly, themeMode, accentColor, dashboardBg, onboardingCompleted } = req.body;

    const updated = await updateUserProfile(uid, {
      ...(profileType && { profileType }),
      ...(monthlyIncome !== undefined && { monthlyIncome: Number(monthlyIncome) }),
      ...(currency && { currency }),
      ...(institutionOrEmployer !== undefined && { institutionOrEmployer }),
      ...(savingsTargetMonthly !== undefined && { savingsTargetMonthly: Number(savingsTargetMonthly) }),
      ...(themeMode && { themeMode }),
      ...(accentColor && { accentColor }),
      ...(dashboardBg && { dashboardBg }),
      ...(onboardingCompleted !== undefined && { onboardingCompleted }),
    });

    // If user selected profile in onboarding, initialize budget limits if not set
    if (profileType) {
      await seedDemoDataForUser(uid, profileType);
    }

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

// --- DASHBOARD OVERVIEW SUMMARY ---
app.get('/api/dashboard/summary', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const currentMonth = (req.query.month as string) || new Date().toISOString().slice(0, 7); // YYYY-MM

    const userProfile = await getUserProfile(uid);
    const profileType = userProfile?.profileType || 'student';
    const currency = userProfile?.currency || '$';

    // 1. Transactions in current month
    const startOfMonth = `${currentMonth}-01`;
    const endOfMonth = `${currentMonth}-31`;

    const userTxs = await db.select().from(transactions)
      .where(and(
        eq(transactions.userId, uid),
        gte(transactions.date, startOfMonth),
        lte(transactions.date, endOfMonth)
      ));

    let totalIncome = 0;
    let totalExpenses = 0;
    const spendingByCategory: Record<string, number> = {};

    userTxs.forEach((tx) => {
      if (tx.type === 'income') {
        totalIncome += tx.amount;
      } else {
        totalExpenses += tx.amount;
        spendingByCategory[tx.category] = (spendingByCategory[tx.category] || 0) + tx.amount;
      }
    });

    // If totalIncome is 0, fallback to user's monthly income / allowance from profile
    if (totalIncome === 0 && userProfile?.monthlyIncome) {
      totalIncome = userProfile.monthlyIncome;
    }

    const remainingBalance = totalIncome - totalExpenses;
    const savings = Math.max(0, remainingBalance);

    // 2. Budget information for this month
    const budgetRecord = await db.select().from(budgets)
      .where(and(eq(budgets.userId, uid), eq(budgets.month, currentMonth)))
      .limit(1);

    const totalBudget = budgetRecord[0]?.totalBudget || (profileType === 'student' ? 1200 : 3800);
    const budgetPercentage = totalBudget > 0 ? Math.min(100, (totalExpenses / totalBudget) * 100) : 0;

    // 3. Category budget limits
    let catBudgets: any[] = [];
    if (budgetRecord[0]) {
      catBudgets = await db.select().from(budgetCategories)
        .where(eq(budgetCategories.budgetId, budgetRecord[0].id));
    }

    const categoryBreakdown = Object.keys(spendingByCategory).map((category) => {
      const spent = spendingByCategory[category];
      const alloc = catBudgets.find((c) => c.category === category)?.allocatedAmount || 0;
      const percentage = alloc > 0 ? (spent / alloc) * 100 : 0;
      return {
        category,
        spent,
        budget: alloc,
        percentage: Number(percentage.toFixed(1)),
        isWarning: alloc > 0 && percentage >= 80 && percentage < 100,
        isExceeded: alloc > 0 && percentage >= 100,
      };
    });

    // Also include categories that have allocated budget but 0 spent yet
    catBudgets.forEach((cb) => {
      if (!spendingByCategory[cb.category]) {
        categoryBreakdown.push({
          category: cb.category,
          spent: 0,
          budget: cb.allocatedAmount,
          percentage: 0,
          isWarning: false,
          isExceeded: false,
        });
      }
    });

    // 4. Alerts generation & checks (80% and 100%)
    const alerts: Array<{ title: string; message: string; type: 'warning' | 'danger' | 'info' }> = [];
    if (totalBudget > 0) {
      if (totalExpenses >= totalBudget) {
        alerts.push({
          title: 'Monthly Budget Exceeded',
          message: `You have spent ${currency}${totalExpenses.toFixed(2)}, which exceeds your total monthly budget of ${currency}${totalBudget.toFixed(2)}.`,
          type: 'danger',
        });
      } else if (totalExpenses >= totalBudget * 0.8) {
        alerts.push({
          title: 'Budget Alert (80% Reached)',
          message: `You have used ${budgetPercentage.toFixed(0)}% of your monthly budget. Slow down spending to meet your month-end goal.`,
          type: 'warning',
        });
      }
    }

    categoryBreakdown.forEach((cat) => {
      if (cat.isExceeded) {
        alerts.push({
          title: `${cat.category} Limit Exceeded`,
          message: `Spent ${currency}${cat.spent.toFixed(2)} of ${currency}${cat.budget.toFixed(2)} allocated.`,
          type: 'danger',
        });
      } else if (cat.isWarning) {
        alerts.push({
          title: `${cat.category} Approaching Budget`,
          message: `Spent ${currency}${cat.spent.toFixed(2)} (${cat.percentage.toFixed(0)}% of limit).`,
          type: 'warning',
        });
      }
    });

    // 5. Recent 5 transactions
    const recentTransactions = await db.select().from(transactions)
      .where(eq(transactions.userId, uid))
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(6);

    // 6. Savings Goals summary
    const goals = await db.select().from(savingsGoals)
      .where(eq(savingsGoals.userId, uid))
      .orderBy(desc(savingsGoals.createdAt))
      .limit(4);

    // 7. Spending Insights
    const topCategory = categoryBreakdown.slice().sort((a, b) => b.spent - a.spent)[0];
    const insights: string[] = [];

    if (topCategory && topCategory.spent > 0) {
      insights.push(`Your highest spending category this month is **${topCategory.category}** (${currency}${topCategory.spent.toFixed(2)}, ${( (topCategory.spent / (totalExpenses || 1)) * 100 ).toFixed(0)}% of expenses).`);
    }

    if (remainingBalance > 0) {
      insights.push(`Great discipline! You have a surplus of **${currency}${remainingBalance.toFixed(2)}** that can be directed toward your savings goals.`);
    } else if (remainingBalance < 0) {
      insights.push(`Expenses currently exceed your tracked income by **${currency}${Math.abs(remainingBalance).toFixed(2)}**. Consider adjusting non-essential budgets.`);
    }

    if (profileType === 'student') {
      insights.push(`Student Tip: Check campus textbook buyback and student discounts on software/subscriptions to save ~15-20% each semester.`);
    } else {
      insights.push(`Employee Tip: Aim to maintain at least 3-6 months of essential living costs in an Emergency Fund.`);
    }

    res.json({
      profile: userProfile,
      currentMonth,
      totalIncome,
      totalExpenses,
      remainingBalance,
      savings,
      totalBudget,
      budgetSpentPercentage: Number(budgetPercentage.toFixed(1)),
      categoryBreakdown,
      spendingByCategory,
      alerts,
      recentTransactions,
      goals,
      insights,
    });
  } catch (error: any) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch summary' });
  }
});

// --- TRANSACTIONS CRUD ---

// Get all transactions with search and filter
app.get('/api/transactions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const { search, category, type, startDate, endDate, limit = 100 } = req.query;

    let query = db.select().from(transactions).where(eq(transactions.userId, uid)).$dynamic();

    const conditions: any[] = [eq(transactions.userId, uid)];

    if (category && category !== 'All') {
      conditions.push(eq(transactions.category, String(category)));
    }
    if (type && type !== 'all') {
      conditions.push(eq(transactions.type, type as 'income' | 'expense'));
    }
    if (startDate) {
      conditions.push(gte(transactions.date, String(startDate)));
    }
    if (endDate) {
      conditions.push(lte(transactions.date, String(endDate)));
    }

    const allUserTxs = await db.select().from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.date), desc(transactions.createdAt))
      .limit(Number(limit));

    // In-memory filter for title/notes search
    let filtered = allUserTxs;
    if (search) {
      const q = String(search).toLowerCase();
      filtered = filtered.filter(
        (t) => t.title.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    res.json(filtered);
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
  }
});

// Create Transaction
app.post('/api/transactions', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const { title, amount, type, category, date, notes, paymentMethod } = req.body;

    if (!title || !amount || !type || !category || !date) {
      return res.status(400).json({ error: 'Missing required transaction fields' });
    }

    const inserted = await db.insert(transactions).values({
      userId: uid,
      title,
      amount: Number(amount),
      type: type as 'income' | 'expense',
      category,
      date,
      notes: notes || '',
      paymentMethod: paymentMethod || 'Cash',
    }).returning();

    // Check budget alert if expense
    if (type === 'expense') {
      const month = date.slice(0, 7);
      const budgetRecord = await db.select().from(budgets).where(and(eq(budgets.userId, uid), eq(budgets.month, month))).limit(1);
      if (budgetRecord[0]) {
        // category check
        const catBudget = await db.select().from(budgetCategories)
          .where(and(eq(budgetCategories.budgetId, budgetRecord[0].id), eq(budgetCategories.category, category)))
          .limit(1);

        if (catBudget[0]) {
          const catSum = await db.select({ total: sql<number>`sum(amount)` }).from(transactions)
            .where(and(
              eq(transactions.userId, uid),
              eq(transactions.type, 'expense'),
              eq(transactions.category, category),
              gte(transactions.date, `${month}-01`),
              lte(transactions.date, `${month}-31`)
            ));
          const currentTotal = Number(catSum[0]?.total || 0);
          if (currentTotal >= catBudget[0].allocatedAmount) {
            await db.insert(notifications).values({
              userId: uid,
              title: `Category Budget Limit Reached: ${category}`,
              message: `You have spent $${currentTotal.toFixed(2)}, exceeding your allocation of $${catBudget[0].allocatedAmount.toFixed(2)}.`,
              type: 'danger',
            });
          }
        }
      }
    }

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: error.message || 'Failed to create transaction' });
  }
});

// Update Transaction
app.put('/api/transactions/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const id = Number(req.params.id);
    const { title, amount, type, category, date, notes, paymentMethod } = req.body;

    const updated = await db.update(transactions)
      .set({
        ...(title && { title }),
        ...(amount !== undefined && { amount: Number(amount) }),
        ...(type && { type: type as 'income' | 'expense' }),
        ...(category && { category }),
        ...(date && { date }),
        ...(notes !== undefined && { notes }),
        ...(paymentMethod && { paymentMethod }),
      })
      .where(and(eq(transactions.id, id), eq(transactions.userId, uid)))
      .returning();

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }

    res.json(updated[0]);
  } catch (error: any) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ error: error.message || 'Failed to update transaction' });
  }
});

// Delete Transaction
app.delete('/api/transactions/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const id = Number(req.params.id);

    const deleted = await db.delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, uid)))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Transaction not found or unauthorized' });
    }

    res.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: error.message || 'Failed to delete transaction' });
  }
});

// Bulk Import Transactions (CSV / JSON)
app.post('/api/transactions/import', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const { items } = req.body; // array of transactions

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Valid array of transactions required' });
    }

    const insertedList = [];
    for (const item of items) {
      if (item.title && item.amount && item.type && item.category && item.date) {
        const [inserted] = await db.insert(transactions).values({
          userId: uid,
          title: String(item.title).slice(0, 100),
          amount: Math.abs(Number(item.amount)),
          type: item.type === 'income' ? 'income' : 'expense',
          category: String(item.category),
          date: String(item.date),
          notes: item.notes ? String(item.notes) : 'Imported record',
          paymentMethod: item.paymentMethod || 'Imported',
        }).returning();
        insertedList.push(inserted);
      }
    }

    res.json({ success: true, count: insertedList.length, transactions: insertedList });
  } catch (error: any) {
    console.error('Error importing transactions:', error);
    res.status(500).json({ error: error.message || 'Failed to import transactions' });
  }
});

// --- BUDGETS API ---

// Get budget and category allocations for a specific month
app.get('/api/budgets', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);

    const existingBudget = await db.select().from(budgets)
      .where(and(eq(budgets.userId, uid), eq(budgets.month, month)))
      .limit(1);

    if (!existingBudget[0]) {
      // If none set for this month, return template based on profile
      const profile = await getUserProfile(uid);
      const isStudent = profile?.profileType === 'student';
      const defaultTotal = isStudent ? 15000 : 65000;

      return res.json({
        month,
        totalBudget: defaultTotal,
        categories: isStudent ? [
          { category: 'Food', allocatedAmount: 4500 },
          { category: 'Hostel/Rent', allocatedAmount: 5000 },
          { category: 'Education', allocatedAmount: 2000 },
          { category: 'Transport', allocatedAmount: 1000 },
          { category: 'Entertainment', allocatedAmount: 1000 },
          { category: 'Shopping', allocatedAmount: 800 },
          { category: 'Subscriptions', allocatedAmount: 300 },
          { category: 'Healthcare', allocatedAmount: 400 },
          { category: 'Other', allocatedAmount: 0 },
        ] : [
          { category: 'Hostel/Rent', allocatedAmount: 22000 },
          { category: 'Food', allocatedAmount: 12000 },
          { category: 'Transport', allocatedAmount: 5000 },
          { category: 'Shopping', allocatedAmount: 6000 },
          { category: 'Entertainment', allocatedAmount: 4000 },
          { category: 'Subscriptions', allocatedAmount: 1500 },
          { category: 'Healthcare', allocatedAmount: 3500 },
          { category: 'Education', allocatedAmount: 3000 },
          { category: 'Other', allocatedAmount: 8000 },
        ],
        isSaved: false,
      });
    }

    const categories = await db.select().from(budgetCategories)
      .where(eq(budgetCategories.budgetId, existingBudget[0].id));

    res.json({
      id: existingBudget[0].id,
      month: existingBudget[0].month,
      totalBudget: existingBudget[0].totalBudget,
      categories,
      isSaved: true,
    });
  } catch (error: any) {
    console.error('Error fetching budgets:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch budgets' });
  }
});

// Set or update monthly and category budgets
app.post('/api/budgets', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const { month, totalBudget, categories } = req.body;

    if (!month || totalBudget === undefined || !Array.isArray(categories)) {
      return res.status(400).json({ error: 'Missing budget fields' });
    }

    // Check existing budget
    let budgetId: number;
    const existing = await db.select().from(budgets)
      .where(and(eq(budgets.userId, uid), eq(budgets.month, month)))
      .limit(1);

    if (existing[0]) {
      budgetId = existing[0].id;
      await db.update(budgets)
        .set({ totalBudget: Number(totalBudget), updatedAt: new Date() })
        .where(eq(budgets.id, budgetId));
      
      // Delete existing categories to re-insert
      await db.delete(budgetCategories).where(eq(budgetCategories.budgetId, budgetId));
    } else {
      const [newBudget] = await db.insert(budgets).values({
        userId: uid,
        month,
        totalBudget: Number(totalBudget),
      }).returning();
      budgetId = newBudget.id;
    }

    // Insert category allocations
    for (const cat of categories) {
      if (cat.category && cat.allocatedAmount !== undefined) {
        await db.insert(budgetCategories).values({
          budgetId,
          userId: uid,
          category: cat.category,
          allocatedAmount: Number(cat.allocatedAmount),
        });
      }
    }

    const updatedCategories = await db.select().from(budgetCategories).where(eq(budgetCategories.budgetId, budgetId));

    res.json({
      id: budgetId,
      month,
      totalBudget: Number(totalBudget),
      categories: updatedCategories,
    });
  } catch (error: any) {
    console.error('Error saving budgets:', error);
    res.status(500).json({ error: error.message || 'Failed to save budget' });
  }
});

// --- SAVINGS GOALS API ---
app.get('/api/goals', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const goals = await db.select().from(savingsGoals)
      .where(eq(savingsGoals.userId, uid))
      .orderBy(desc(savingsGoals.createdAt));
    res.json(goals);
  } catch (error: any) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch goals' });
  }
});

app.post('/api/goals', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const { name, category, targetAmount, currentAmount, targetDate, color } = req.body;

    if (!name || targetAmount === undefined) {
      return res.status(400).json({ error: 'Name and target amount are required' });
    }

    const inserted = await db.insert(savingsGoals).values({
      userId: uid,
      name,
      category: category || 'General',
      targetAmount: Number(targetAmount),
      currentAmount: currentAmount ? Number(currentAmount) : 0,
      targetDate: targetDate || null,
      color: color || 'indigo',
      isCompleted: Number(currentAmount || 0) >= Number(targetAmount),
    }).returning();

    res.status(201).json(inserted[0]);
  } catch (error: any) {
    console.error('Error creating goal:', error);
    res.status(500).json({ error: error.message || 'Failed to create goal' });
  }
});

app.put('/api/goals/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const id = Number(req.params.id);
    const { name, category, targetAmount, currentAmount, targetDate, isCompleted, color } = req.body;

    const existing = await db.select().from(savingsGoals).where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, uid))).limit(1);
    if (!existing[0]) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const newTarget = targetAmount !== undefined ? Number(targetAmount) : existing[0].targetAmount;
    const newCurrent = currentAmount !== undefined ? Number(currentAmount) : existing[0].currentAmount;
    const completed = isCompleted !== undefined ? isCompleted : newCurrent >= newTarget;

    const updated = await db.update(savingsGoals)
      .set({
        ...(name && { name }),
        ...(category && { category }),
        targetAmount: newTarget,
        currentAmount: newCurrent,
        ...(targetDate !== undefined && { targetDate }),
        ...(color && { color }),
        isCompleted: completed,
        updatedAt: new Date(),
      })
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, uid)))
      .returning();

    // Trigger milestone alert if just completed
    if (completed && !existing[0].isCompleted) {
      await db.insert(notifications).values({
        userId: uid,
        title: `Goal Achieved: ${name || existing[0].name}! 🎯`,
        message: `Congratulations! You reached your savings target of $${newTarget.toFixed(2)}.`,
        type: 'success',
      });
    }

    res.json(updated[0]);
  } catch (error: any) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: error.message || 'Failed to update goal' });
  }
});

app.delete('/api/goals/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const id = Number(req.params.id);

    const deleted = await db.delete(savingsGoals)
      .where(and(eq(savingsGoals.id, id), eq(savingsGoals.userId, uid)))
      .returning();

    if (!deleted[0]) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: error.message || 'Failed to delete goal' });
  }
});

// --- ANALYTICS API (Monthly spending trends, comparisons, breakdowns) ---
app.get('/api/analytics', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    
    // Fetch last 6 months trends
    const now = new Date();
    const monthlyTrends: Array<{ month: string; income: number; expenses: number; savings: number }> = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStr = d.toISOString().slice(0, 7); // YYYY-MM
      
      const monthTxs = await db.select().from(transactions).where(and(
        eq(transactions.userId, uid),
        gte(transactions.date, `${mStr}-01`),
        lte(transactions.date, `${mStr}-31`)
      ));

      let mIncome = 0;
      let mExpenses = 0;
      monthTxs.forEach((t) => {
        if (t.type === 'income') mIncome += t.amount;
        else mExpenses += t.amount;
      });

      monthlyTrends.push({
        month: mStr,
        income: mIncome,
        expenses: mExpenses,
        savings: Math.max(0, mIncome - mExpenses),
      });
    }

    // Previous month vs current month comparison
    const currentMonthData = monthlyTrends[monthlyTrends.length - 1];
    const prevMonthData = monthlyTrends[monthlyTrends.length - 2];

    const expenseChange = prevMonthData && prevMonthData.expenses > 0
      ? (((currentMonthData.expenses - prevMonthData.expenses) / prevMonthData.expenses) * 100).toFixed(1)
      : '0.0';

    // Current month category distribution
    const curMonthStr = currentMonthData.month;
    const curTxs = await db.select().from(transactions).where(and(
      eq(transactions.userId, uid),
      eq(transactions.type, 'expense'),
      gte(transactions.date, `${curMonthStr}-01`),
      lte(transactions.date, `${curMonthStr}-31`)
    ));

    const categoryTotals: Record<string, number> = {};
    curTxs.forEach((t) => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    res.json({
      monthlyTrends,
      currentMonth: currentMonthData,
      previousMonth: prevMonthData,
      expensePercentageChange: Number(expenseChange),
      categoryBreakdown: categoryTotals,
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch analytics' });
  }
});

// --- NOTIFICATIONS API ---
app.get('/api/notifications', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const notifs = await db.select().from(notifications)
      .where(eq(notifications.userId, uid))
      .orderBy(desc(notifications.createdAt))
      .limit(20);
    res.json(notifs);
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
});

app.put('/api/notifications/read-all', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, uid));
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating notifications:', error);
    res.status(500).json({ error: error.message || 'Failed to update notifications' });
  }
});

// --- AI FINANCIAL ASSISTANCE ADVISOR ---
app.post('/api/ai/advisor', requireAuth, async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.uid!;
    const { question, context } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const userProfile = await getUserProfile(uid);
    const profileRole = userProfile?.profileType || 'student';
    const currency = userProfile?.currency || '₹';

    // Fetch user current month spending and budgets to supply as ground truth context
    const currentMonth = new Date().toISOString().slice(0, 7);
    const userTxs = await db.select().from(transactions)
      .where(and(
        eq(transactions.userId, uid),
        gte(transactions.date, `${currentMonth}-01`),
        lte(transactions.date, `${currentMonth}-31`)
      ))
      .limit(20);

    const userGoals = await db.select().from(savingsGoals)
      .where(eq(savingsGoals.userId, uid))
      .limit(5);

    const totalSpent = userTxs.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const totalIncome = userTxs.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0) || userProfile?.monthlyIncome || 0;

    const systemPrompt = `You are FinTrack AI Assistant, an empathetic, smart, and friendly personal financial advisor for ${profileRole === 'student' ? 'college students' : 'working employees'}.
The user's preferred currency is ${currency}.
Current User Financial Context:
- Role: ${profileRole}
- Monthly Income/Allowance: ${currency}${totalIncome}
- Expenses This Month: ${currency}${totalSpent}
- Active Goals: ${userGoals.map((g) => `${g.name} (${currency}${g.currentAmount}/${currency}${g.targetAmount})`).join(', ') || 'None yet'}
- Recent transactions: ${userTxs.map((t) => `${t.title} (${currency}${t.amount}, ${t.category})`).join(', ') || 'No entries logged yet'}

Guidelines:
- Give concise, highly practical, warm and actionable advice.
- When answering questions about budget, savings, or whether they can afford a purchase, use their real currency (${currency}) and current data.
- Keep responses friendly, encouraging, with bullet points where helpful.
- Respect user privacy and comfort.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUser Question: ${question}` }],
        },
      ],
    });

    const reply = response.text || 'I analyzed your budget and recommend maintaining a small daily emergency buffer.';
    res.json({ reply });
  } catch (error: any) {
    console.error('Error generating AI advice:', error);
    res.status(500).json({ error: error.message || 'Failed to generate financial advice' });
  }
});

// Vite middleware in dev or static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
