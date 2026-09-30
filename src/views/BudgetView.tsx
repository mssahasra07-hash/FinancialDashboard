// src/views/BudgetView.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ALL_CATEGORIES } from '../types/index.ts';
import { PieChart, Save, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

export const BudgetView: React.FC = () => {
  const { apiFetch, profile } = useAuth();
  const currentMonth = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [totalBudget, setTotalBudget] = useState<number>(0);
  const [categories, setCategories] = useState<Array<{ category: string; allocatedAmount: number }>>([]);
  const [spentMap, setSpentMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const currency = profile?.currency || '₹';

  const loadBudgetAndSpending = async () => {
    setLoading(true);
    try {
      // 1. Fetch budget allocations
      const budgetRes = await apiFetch(`/api/budgets?month=${selectedMonth}`);
      if (budgetRes.ok) {
        const bData = await budgetRes.json();
        setTotalBudget(bData.totalBudget);

        // Fill in all categories if not yet set
        const existingCats = bData.categories || [];
        const fullCatList = ALL_CATEGORIES.map((catName) => {
          const found = existingCats.find((c: any) => c.category === catName);
          return {
            category: catName,
            allocatedAmount: found ? found.allocatedAmount : 0,
          };
        });
        setCategories(fullCatList);
      }

      // 2. Fetch spending summary for this month to display spent vs allocated
      const sumRes = await apiFetch(`/api/dashboard/summary?month=${selectedMonth}`);
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSpentMap(sumData.spendingByCategory || {});
      }
    } catch (err) {
      console.error('Failed to load budget:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgetAndSpending();
  }, [selectedMonth]);

  const handleCategoryChange = (category: string, amount: number) => {
    setCategories((prev) =>
      prev.map((c) => (c.category === category ? { ...c, allocatedAmount: Math.max(0, amount) } : c))
    );
  };

  const handleSaveBudget = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await apiFetch('/api/budgets', {
        method: 'POST',
        body: JSON.stringify({
          month: selectedMonth,
          totalBudget: Number(totalBudget),
          categories,
        }),
      });

      if (res.ok) {
        setMessage({ text: 'Monthly and category budgets saved successfully!', type: 'success' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const data = await res.json();
        setMessage({ text: data.error || 'Failed to save budget', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const totalAllocated = categories.reduce((sum, c) => sum + (c.allocatedAmount || 0), 0);
  const totalSpent = Object.values(spentMap).reduce((sum, amt) => sum + amt, 0);

  return (
    <div className="space-y-6">
      {/* Title & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Budget Planner & Caps</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure monthly targets and individual category limits in {currency}. Alerts trigger at 80% and 100%.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-medium shadow-2xs"
          />
          <button
            onClick={handleSaveBudget}
            disabled={saving}
            className="btn-primary px-4 py-2 text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Saving...' : 'Save Budgets'}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Monthly Cap */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Total Monthly Budget Cap
          </label>
          <div className="relative rounded-xl border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 bg-white dark:bg-slate-800">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold text-sm">
              {currency}
            </span>
            <input
              type="number"
              min="0"
              step="any"
              value={totalBudget}
              onChange={(e) => setTotalBudget(Number(e.target.value))}
              className="w-full pl-8 pr-3 py-2 text-sm font-bold text-slate-900 dark:text-white rounded-xl focus:outline-none bg-transparent"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            Total sum of categories: <span className="font-semibold text-slate-700 dark:text-slate-300">{currency}{totalAllocated.toFixed(0)}</span>
          </p>
        </div>

        {/* Current Total Spent */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Total Spent This Month
          </span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {currency}{totalSpent.toFixed(2)}
          </p>
          <div className="mt-2 flex items-center text-xs text-slate-500 dark:text-slate-400 gap-1">
            <span className={totalSpent > totalBudget ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400 font-semibold'}>
              {totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0}%
            </span>{' '}
            of total monthly cap consumed
          </div>
        </div>

        {/* Remaining Budget */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Remaining Balance
          </span>
          <p className={`text-2xl font-bold ${totalBudget - totalSpent < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {currency}{(totalBudget - totalSpent).toFixed(2)}
          </p>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {totalBudget - totalSpent < 0 ? 'Exceeded by limit threshold' : 'Under control and within target'}
          </div>
        </div>
      </div>

      {/* Category-Wise Budget Allocations Grid */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Category Allocations & Status</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Adjust allocated amounts per category for {selectedMonth}</p>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {categories.length} Categories
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const spent = spentMap[cat.category] || 0;
            const allocated = cat.allocatedAmount || 0;
            const remaining = allocated - spent;
            const pct = allocated > 0 ? (spent / allocated) * 100 : 0;
            const isExceeded = allocated > 0 && spent >= allocated;
            const isWarning = allocated > 0 && pct >= 80 && pct < 100;

            return (
              <div
                key={cat.category}
                className={`p-4 rounded-xl border transition-all ${
                  isExceeded
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20'
                    : isWarning
                    ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{cat.category}</span>
                  {isExceeded && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                      <ShieldAlert className="w-3.5 h-3.5" /> Exceeded
                    </span>
                  )}
                  {isWarning && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      <AlertTriangle className="w-3.5 h-3.5" /> 80% Alert
                    </span>
                  )}
                </div>

                {/* Allocated Input */}
                <div className="mb-3">
                  <label className="block text-[11px] text-slate-500 dark:text-slate-400 mb-1">Allocated Budget</label>
                  <div className="relative rounded-lg border border-slate-300 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 bg-white dark:bg-slate-800">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 text-xs font-bold">
                      {currency}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={cat.allocatedAmount}
                      onChange={(e) => handleCategoryChange(cat.category, parseFloat(e.target.value) || 0)}
                      className="w-full pl-6 pr-2 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none bg-transparent"
                    />
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>

                {/* Spent & Remaining */}
                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400">
                  <span>Spent: <span className="font-semibold text-slate-800 dark:text-slate-200">{currency}{spent.toFixed(0)}</span></span>
                  <span>
                    Rem: <span className={`font-semibold ${remaining < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-slate-200'}`}>
                      {currency}{remaining.toFixed(0)}
                    </span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
