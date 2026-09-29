import { relations } from 'drizzle-orm';
import { boolean, doublePrecision, integer, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// User role/profile type: student or employee
export const profileTypeEnum = pgEnum('profile_type', ['student', 'employee']);
export const transactionTypeEnum = pgEnum('transaction_type', ['income', 'expense']);

// Users table with Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase UID
  email: text('email').notNull(),
  displayName: text('display_name'),
  photoUrl: text('photo_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Profiles table storing student vs employee customization, income/allowance
export const profiles = pgTable('profiles', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.uid, { onDelete: 'cascade' }).unique(),
  profileType: profileTypeEnum('profile_type').default('student').notNull(),
  monthlyIncome: doublePrecision('monthly_income').default(0).notNull(),
  currency: text('currency').default('₹').notNull(),
  institutionOrEmployer: text('institution_or_employer').default(''),
  savingsTargetMonthly: doublePrecision('savings_target_monthly').default(0).notNull(),
  themeMode: text('theme_mode').default('light').notNull(), // 'light' | 'dark' | 'system'
  accentColor: text('accent_color').default('indigo').notNull(), // 'indigo' | 'emerald' | 'violet' | 'amber' | 'cyan' | 'rose' | 'blue'
  dashboardBg: text('dashboard_bg').default('default').notNull(), // 'default' | 'slate' | 'navy' | 'charcoal' | 'emerald' | 'sunset' | 'aurora' | 'cosmic'
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Overall monthly budget
export const budgets = pgTable('budgets', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  month: text('month').notNull(), // Format YYYY-MM
  totalBudget: doublePrecision('total_budget').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Category-wise budgets for a month
export const budgetCategories = pgTable('budget_categories', {
  id: serial('id').primaryKey(),
  budgetId: integer('budget_id').notNull().references(() => budgets.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  category: text('category').notNull(), // Food, Transport, Education, Shopping, Entertainment, Hostel/Rent, Subscriptions, Healthcare, Other
  allocatedAmount: doublePrecision('allocated_amount').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  amount: doublePrecision('amount').notNull(),
  type: transactionTypeEnum('type').notNull(), // 'income' | 'expense'
  category: text('category').notNull(),
  date: text('date').notNull(), // YYYY-MM-DD
  notes: text('notes').default(''),
  paymentMethod: text('payment_method').default('Cash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Savings Goals table (Laptop, Emergency Fund, Trip, Course, Phone, etc.)
export const savingsGoals = pgTable('savings_goals', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category').default('General'), // Tech, Travel, Education, Emergency, Gadget
  targetAmount: doublePrecision('target_amount').notNull(),
  currentAmount: doublePrecision('current_amount').default(0).notNull(),
  targetDate: text('target_date'), // YYYY-MM-DD
  isCompleted: boolean('is_completed').default(false).notNull(),
  color: text('color').default('indigo'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Notifications / Alerts table (80% and 100% budget alerts, milestones)
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.uid, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').default('info').notNull(), // 'warning', 'danger', 'success', 'info'
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.uid],
    references: [profiles.userId],
  }),
  budgets: many(budgets),
  budgetCategories: many(budgetCategories),
  transactions: many(transactions),
  savingsGoals: many(savingsGoals),
  notifications: many(notifications),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.uid],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  user: one(users, {
    fields: [budgets.userId],
    references: [users.uid],
  }),
  categories: many(budgetCategories),
}));

export const budgetCategoriesRelations = relations(budgetCategories, ({ one }) => ({
  budget: one(budgets, {
    fields: [budgetCategories.budgetId],
    references: [budgets.id],
  }),
  user: one(users, {
    fields: [budgetCategories.userId],
    references: [users.uid],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.uid],
  }),
}));

export const savingsGoalsRelations = relations(savingsGoals, ({ one }) => ({
  user: one(users, {
    fields: [savingsGoals.userId],
    references: [users.uid],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.uid],
  }),
}));
