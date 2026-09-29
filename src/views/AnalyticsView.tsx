// src/views/AnalyticsView.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { SpendingTrendChart } from '../components/SpendingTrendChart.tsx';
import { DonutChart } from '../components/DonutChart.tsx';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';
import { CATEGORY_COLORS } from '../types/index.ts';

export const AnalyticsView: React.FC = () => {
  const { apiFetch, profile } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const currency = profile?.currency || '₹';

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/analytics');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-16 text-center text-xs text-slate-400 animate-pulse">
        Compiling spending trends and monthly comparisons...
      </div>
    );
  }

  const { monthlyTrends, currentMonth, previousMonth, expensePercentageChange, categoryBreakdown } = data;
  const isIncreased = expensePercentageChange > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Spending Trends & Analytics</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          6-month financial trajectory, previous-month comparisons, and expense categories in {currency}
        </p>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Month Spending */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            Current Month Expenses
          </span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {currency}{currentMonth?.expenses?.toFixed(2) || '0.00'}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span
              className={`inline-flex items-center font-bold px-1.5 py-0.5 rounded ${
                isIncreased 
                  ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400' 
                  : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {isIncreased ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
              {Math.abs(expensePercentageChange)}%
            </span>
            <span className="text-slate-500 dark:text-slate-400">vs previous month</span>
          </div>
        </div>

        {/* Previous Month Spending */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            Previous Month Expenses
          </span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {currency}{previousMonth?.expenses?.toFixed(2) || '0.00'}
          </p>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Total Income logged: {currency}{previousMonth?.income?.toFixed(2) || '0.00'}
          </div>
        </div>

        {/* Current Net Savings */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
            Net Surplus Trajectory
          </span>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {currency}{currentMonth?.savings?.toFixed(2) || '0.00'}
          </p>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Retained surplus after all logged expenses
          </div>
        </div>
      </div>

      {/* 6-Month Income vs Expense Trend */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">6-Month Spending & Income Trend</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Comparing inflows vs outflows over time</p>
          </div>
        </div>

        <SpendingTrendChart data={monthlyTrends} currency={currency} />
      </div>

      {/* Category Breakdown & Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs lg:col-span-6 transition-colors">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Category Distribution</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Proportion of expenditures in current month</p>
          <DonutChart data={categoryBreakdown || {}} currency={currency} />
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs lg:col-span-6 transition-colors">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Expense Category Rankings</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Highest to lowest expenditure areas</p>

          <div className="space-y-3">
            {Object.entries(categoryBreakdown || {})
              .sort(([_, a], [__, b]) => (b as number) - (a as number))
              .map(([cat, amt]) => {
                const totalExp = currentMonth?.expenses || 1;
                const pct = (((amt as number) / totalExp) * 100).toFixed(1);
                const color = CATEGORY_COLORS[cat] || '#64748b';

                return (
                  <div key={cat} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{cat}</span>
                      </div>
                      <span className="text-slate-600 dark:text-slate-400">
                        {currency}{(amt as number).toFixed(2)}{' '}
                        <span className="text-slate-400 dark:text-slate-500 font-normal">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
