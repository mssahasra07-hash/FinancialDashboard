// src/types/index.ts
export type ProfileType = 'student' | 'employee';
export type TransactionType = 'income' | 'expense';

export interface UserProfile {
  id: number;
  userId: string;
  profileType: ProfileType;
  monthlyIncome: number;
  currency: string;
  institutionOrEmployer: string;
  savingsTargetMonthly: number;
  themeMode: 'light' | 'dark' | 'system';
  accentColor: string;
  dashboardBg: string;
  onboardingCompleted: boolean;
  updatedAt: string;
}

export interface AppUser {
  id: number;
  uid: string;
  email: string;
  displayName?: string;
  photoUrl?: string;
  createdAt: string;
}

export interface Transaction {
  id: number;
  userId: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  notes?: string;
  paymentMethod?: string;
  createdAt?: string;
}

export interface CategoryBudget {
  id?: number;
  budgetId?: number;
  category: string;
  allocatedAmount: number;
}

export interface Budget {
  id?: number;
  month: string;
  totalBudget: number;
  categories: CategoryBudget[];
  isSaved?: boolean;
}

export interface SavingsGoal {
  id: number;
  userId: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  isCompleted: boolean;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationItem {
  id: number;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  isRead: boolean;
  createdAt: string;
}

export interface DashboardSummary {
  profile: UserProfile;
  currentMonth: string;
  totalIncome: number;
  totalExpenses: number;
  remainingBalance: number;
  savings: number;
  totalBudget: number;
  budgetSpentPercentage: number;
  categoryBreakdown: Array<{
    category: string;
    spent: number;
    budget: number;
    percentage: number;
    isWarning: boolean;
    isExceeded: boolean;
  }>;
  spendingByCategory: Record<string, number>;
  alerts: Array<{
    title: string;
    message: string;
    type: 'warning' | 'danger' | 'info';
  }>;
  recentTransactions: Transaction[];
  goals: SavingsGoal[];
  insights: string[];
}

export const ALL_CATEGORIES = [
  'Food',
  'Transport',
  'Education',
  'Shopping',
  'Entertainment',
  'Hostel/Rent',
  'Subscriptions',
  'Healthcare',
  'Other',
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f97316',          // orange-500
  Transport: '#3b82f6',     // blue-500
  Education: '#8b5cf6',     // purple-500
  Shopping: '#ec4899',      // pink-500
  Entertainment: '#eab308', // yellow-500
  'Hostel/Rent': '#06b6d4',  // cyan-500
  Subscriptions: '#a855f7', // violet-500
  Healthcare: '#10b981',    // emerald-500
  Other: '#64748b',        // slate-500
};
