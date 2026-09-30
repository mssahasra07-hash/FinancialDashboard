// src/db/helpers.ts
import { db } from './index.ts';
import { users, profiles, budgets, budgetCategories, transactions, savingsGoals, notifications } from './schema.ts';
import { eq, and, desc, sql } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, displayName?: string, photoUrl?: string) {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existing.length > 0) {
      if (displayName || photoUrl) {
        await db.update(users)
          .set({ displayName: displayName || existing[0].displayName, photoUrl: photoUrl || existing[0].photoUrl })
          .where(eq(users.uid, uid));
      }
      return existing[0];
    }

    const inserted = await db.insert(users)
      .values({
        uid,
        email: email || 'user@example.com',
        displayName: displayName || email?.split('@')[0] || 'User',
        photoUrl: photoUrl || '',
      })
      .returning();

    // Default profile for new user - Clean slate with Indian Rupees ₹ and zeroed initial values
    await db.insert(profiles).values({
      userId: uid,
      profileType: 'student',
      monthlyIncome: 0,
      currency: '₹',
      institutionOrEmployer: '',
      savingsTargetMonthly: 0,
      themeMode: 'light',
      accentColor: 'indigo',
      dashboardBg: 'default',
      onboardingCompleted: false,
    });

    // Add a warm, welcoming personal notification to build trust & comfort
    const greetingName = displayName || (email ? email.split('@')[0] : 'friend');
    await db.insert(notifications).values({
      userId: uid,
      title: `Welcome, ${greetingName}! 👋`,
      message: `Your account is secure, encrypted, and isolated. Feel free to manage your income and expenses with 100% confidence and privacy.`,
      type: 'success',
      isRead: false,
    });

    return inserted[0];
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw new Error('Database operation failed', { cause: error });
  }
}

export async function getUserProfile(uid: string) {
  try {
    const profile = await db.select().from(profiles).where(eq(profiles.userId, uid)).limit(1);
    return profile[0] || null;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw new Error('Failed to fetch profile', { cause: error });
  }
}

export async function updateUserProfile(uid: string, data: Partial<typeof profiles.$inferInsert>) {
  try {
    const existing = await db.select().from(profiles).where(eq(profiles.userId, uid)).limit(1);
    if (existing.length === 0) {
      const inserted = await db.insert(profiles).values({
        userId: uid,
        profileType: data.profileType || 'student',
        monthlyIncome: data.monthlyIncome ?? 0,
        currency: data.currency || '₹',
        institutionOrEmployer: data.institutionOrEmployer || '',
        savingsTargetMonthly: data.savingsTargetMonthly ?? 0,
        themeMode: data.themeMode || 'light',
        accentColor: data.accentColor || 'indigo',
        onboardingCompleted: data.onboardingCompleted ?? true,
      }).returning();
      return inserted[0];
    }

    const updated = await db.update(profiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, uid))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Error updating profile:', error);
    throw new Error('Failed to update profile', { cause: error });
  }
}

// Clean user setup with initial realistic rupees budget allocations without duplicating random transactions
export async function seedDemoDataForUser(uid: string, profileType: 'student' | 'employee') {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    // 1. Setup Initial Monthly Budget (in ₹)
    const monthlyTotal = profileType === 'student' ? 15000 : 65000;
    const existingBudget = await db.select().from(budgets).where(and(eq(budgets.userId, uid), eq(budgets.month, currentMonth))).limit(1);
    
    let budgetId = existingBudget[0]?.id;
    if (!budgetId) {
      const [newBudget] = await db.insert(budgets).values({
        userId: uid,
        month: currentMonth,
        totalBudget: monthlyTotal,
      }).returning();
      budgetId = newBudget.id;

      // Realistic category budget limits in INR ₹
      const categories = profileType === 'student' ? [
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
      ];

      for (const cat of categories) {
        await db.insert(budgetCategories).values({
          budgetId,
          userId: uid,
          category: cat.category,
          allocatedAmount: cat.allocatedAmount,
        });
      }
    }

    // 2. Initial Savings Goals (in ₹) - Only if empty
    const goalCount = await db.select({ count: sql<number>`count(*)` }).from(savingsGoals).where(eq(savingsGoals.userId, uid));
    if (Number(goalCount[0]?.count || 0) === 0) {
      const initialGoals: Array<typeof savingsGoals.$inferInsert> = profileType === 'student' ? [
        {
          userId: uid,
          name: 'Semester Break Trip',
          category: 'Trip',
          targetAmount: 8000,
          currentAmount: 2500,
          targetDate: '2026-11-20',
          color: 'emerald',
        },
        {
          userId: uid,
          name: 'Coding Laptop / Tablet',
          category: 'Tech',
          targetAmount: 55000,
          currentAmount: 18000,
          targetDate: '2026-12-15',
          color: 'indigo',
        },
        {
          userId: uid,
          name: 'Student Emergency Reserve',
          category: 'Emergency Fund',
          targetAmount: 10000,
          currentAmount: 4000,
          targetDate: '2026-10-30',
          color: 'amber',
        },
      ] : [
        {
          userId: uid,
          name: '6-Month Emergency Fund',
          category: 'Emergency Fund',
          targetAmount: 150000,
          currentAmount: 65000,
          targetDate: '2027-01-30',
          color: 'amber',
        },
        {
          userId: uid,
          name: 'Smartphone Upgrade',
          category: 'Phone',
          targetAmount: 40000,
          currentAmount: 18000,
          targetDate: '2026-11-15',
          color: 'indigo',
        },
        {
          userId: uid,
          name: 'Goa / Manali Vacation',
          category: 'Trip',
          targetAmount: 35000,
          currentAmount: 14000,
          targetDate: '2027-02-10',
          color: 'emerald',
        },
      ];

      for (const g of initialGoals) {
        await db.insert(savingsGoals).values(g);
      }
    }
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
}
