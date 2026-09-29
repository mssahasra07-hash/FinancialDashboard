// src/views/OverviewView.tsx
import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  ShieldAlert,
  ChevronRight,
  Plus,
  ShieldCheck,
  Sparkles,
  HeartHandshake
} from 'lucide-react';
import { DashboardSummary } from '../types/index.ts';
import { DonutChart } from '../components/DonutChart.tsx';
import { useAuth } from '../context/AuthContext.tsx';

interface OverviewViewProps {
  summary: DashboardSummary | null;
  loading: boolean;
  onOpenAddModal: () => void;
  onNavigateTab: (tab: any) => void;
  onRefresh: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  summary,
  loading,
  onOpenAddModal,
  onNavigateTab,
}) => {
  const { user } = useAuth();

  if (loading || !summary) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl lg:col-span-7" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl lg:col-span-5" />
        </div>
      </div>
    );
  }

  const {
    profile,
    totalIncome,
    totalExpenses,
    remainingBalance,
    savings,
    totalBudget,
    budgetSpentPercentage,
    categoryBreakdown,
    spendingByCategory,
    alerts,
    recentTransactions,
    goals,
  } = summary;

  const currency = profile?.currency || '₹';
  const userName = user?.displayName || user?.email?.split('@')[0] || 'Friend';
  const isStudent = profile?.profileType === 'student';

  return (
    <div className="space-y-6">
      {/* Warm Personal Greeting & Trust Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Welcome back</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Hello, {userName}! 👋
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              Your finances are completely safe, private, and isolated. Feel confident recording all your incomes and expenses in {currency}.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/15 flex items-center gap-2 text-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-100">Private Database</span>
            </div>
            <button
              onClick={onOpenAddModal}
              className="btn-primary px-4 py-2.5 font-semibold text-xs rounded-2xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Log Entry</span>
            </button>
          </div>
        </div>
      </div>

      {/* 80% & 100% Budget Warning Banners */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 2).map((alert, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs transition-all ${
                alert.type === 'danger'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {alert.type === 'danger' ? (
                  <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                )}
                <div>
                  <span className="font-semibold">{alert.title}: </span>
                  <span>{alert.message}</span>
                </div>
              </div>
              <button
                onClick={() => onNavigateTab('budget')}
                className="font-medium underline shrink-0 hover:opacity-80"
              >
                Review Budget
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 4 Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isStudent ? 'Monthly Allowance / Income' : 'Total Monthly Salary'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {currency}{totalIncome.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Available</span> for this month
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Expenses
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {currency}{totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1">
            <span className={budgetSpentPercentage > 80 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-slate-700 dark:text-slate-300 font-medium'}>
              {budgetSpentPercentage}%
            </span>
            of monthly budget used
          </div>
        </div>

        {/* Remaining Balance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Remaining Balance
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-2xl font-bold mt-2 ${remainingBalance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
            {currency}{remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1">
            {remainingBalance >= 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Healthy buffer</span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 font-semibold">Over-budget deficit</span>
            )}
          </div>
        </div>

        {/* Estimated Savings */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Estimated Savings
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
            {currency}{savings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1">
            Target: <span className="font-semibold text-slate-700 dark:text-slate-300">{currency}{profile?.savingsTargetMonthly || 0}</span>
          </div>
        </div>
      </div>

      {/* Monthly Budget Progress Bar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Monthly Budget Progress</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Spent {currency}{totalExpenses.toFixed(0)} of {currency}{totalBudget.toFixed(0)} target budget
            </p>
          </div>
          <div className="text-right">
            <span className={`text-sm font-bold ${
              budgetSpentPercentage >= 100
                ? 'text-rose-600 dark:text-rose-400'
                : budgetSpentPercentage >= 80
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-indigo-600 dark:text-indigo-400'
            }`}>
              {budgetSpentPercentage}% Used
            </span>
          </div>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              budgetSpentPercentage >= 100
                ? 'bg-rose-500'
                : budgetSpentPercentage >= 80
                ? 'bg-amber-500'
                : 'bg-indigo-600'
            }`}
            style={{ width: `${Math.min(100, budgetSpentPercentage)}%` }}
          />
        </div>
      </div>

      {/* Middle Row: Category Progress Bars & Donut Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category-wise Budget Progress Bars (7 cols) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs lg:col-span-7 flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Category Budget Progress</h3>
              <button
                onClick={() => onNavigateTab('budget')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-0.5"
              >
                Manage Budgets <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3.5">
              {categoryBreakdown.slice(0, 6).map((cat) => {
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{cat.category}</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {currency}{cat.spent.toFixed(0)}
                        </span>{' '}
                        / {currency}{cat.budget.toFixed(0)}
                        {cat.budget > 0 && (
                          <span
                            className={`ml-1 font-semibold ${
                              cat.isExceeded
                                ? 'text-rose-600 dark:text-rose-400'
                                : cat.isWarning
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            ({cat.percentage.toFixed(0)}%)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          cat.isExceeded
                            ? 'bg-rose-500'
                            : cat.isWarning
                            ? 'bg-amber-500'
                            : 'bg-indigo-600'
                        }`}
                        style={{ width: `${Math.min(100, cat.percentage || 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Showing top allocations</span>
            <span>Alerts trigger at 80% & 100%</span>
          </div>
        </div>

        {/* Spending-by-category Donut Chart (5 cols) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs lg:col-span-5 flex flex-col justify-between transition-colors">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Expenses by Category</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Breakdown for the current billing cycle</p>
            <DonutChart data={spendingByCategory} currency={currency} />
          </div>
          <button
            onClick={() => onNavigateTab('analytics')}
            className="w-full py-2 mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition-colors"
          >
            Detailed Analytics Breakdown →
          </button>
        </div>
      </div>

      {/* Bottom Row: Recent Transactions & Financial Goals */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Transactions (7 cols) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs lg:col-span-7 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Your latest recorded expenses and inflows</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAddModal}
                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors"
                title="Add Transaction"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigateTab('transactions')}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-0.5"
              >
                View All <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions && recentTransactions.length > 0 ? (
              recentTransactions.map((tx) => (
                <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        tx.type === 'income'
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{tx.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {tx.category} • {tx.paymentMethod} • {tx.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`font-bold ${
                        tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {currency}{tx.amount.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No transactions yet. Click "Log Entry" to add your first expense or allowance!
              </div>
            )}
          </div>
        </div>

        {/* Goals Widget (5 cols) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs lg:col-span-5 transition-colors">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Savings Goals</h3>
            <button
              onClick={() => onNavigateTab('goals')}
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-0.5"
            >
              All Goals <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {goals && goals.length > 0 ? (
              goals.slice(0, 3).map((g) => {
                const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
                return (
                  <div key={g.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{g.name}</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden my-1.5">
                      <div
                        className="bg-indigo-600 h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>
                        {currency}{g.currentAmount.toFixed(0)} saved
                      </span>
                      <span>Target: {currency}{g.targetAmount.toFixed(0)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                No active savings goals. Create one in the Goals tab!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
