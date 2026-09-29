// src/views/GoalsView.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { SavingsGoal } from '../types/index.ts';
import { Target, Plus, CheckCircle2, Edit2, Trash2, X, Sparkles, Laptop, Shield, Compass, BookOpen, Smartphone } from 'lucide-react';

export const GoalsView: React.FC = () => {
  const { apiFetch, profile } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);

  // Form inputs
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Tech');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState('indigo');
  const [saving, setSaving] = useState(false);

  const currency = profile?.currency || '₹';
  const isStudent = profile?.profileType === 'student';

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/goals');
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const openCreateModal = (suggestedName?: string, suggestedTarget?: number, suggestedCategory?: string) => {
    setEditingGoal(null);
    setName(suggestedName || '');
    setCategory(suggestedCategory || 'Tech');
    setTargetAmount(suggestedTarget ? String(suggestedTarget) : '');
    setCurrentAmount('0');
    setTargetDate('');
    setColor('indigo');
    setIsModalOpen(true);
  };

  const openEditModal = (g: SavingsGoal) => {
    setEditingGoal(g);
    setName(g.name);
    setCategory(g.category);
    setTargetAmount(String(g.targetAmount));
    setCurrentAmount(String(g.currentAmount));
    setTargetDate(g.targetDate || '');
    setColor(g.color || 'indigo');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount) return;

    setSaving(true);
    try {
      const url = editingGoal ? `/api/goals/${editingGoal.id}` : '/api/goals';
      const method = editingGoal ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify({
          name: name.trim(),
          category,
          targetAmount: parseFloat(targetAmount),
          currentAmount: parseFloat(currentAmount) || 0,
          targetDate: targetDate || null,
          color,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchGoals();
      }
    } catch (err) {
      console.error('Error saving goal:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      const res = await apiFetch(`/api/goals/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setGoals((prev) => prev.filter((g) => g.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete goal:', err);
    }
  };

  const handleAddFunds = async (goal: SavingsGoal, amountToAdd: number) => {
    try {
      const newAmount = goal.currentAmount + amountToAdd;
      const res = await apiFetch(`/api/goals/${goal.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          currentAmount: newAmount,
        }),
      });
      if (res.ok) {
        fetchGoals();
      }
    } catch (err) {
      console.error('Error adding funds to goal:', err);
    }
  };

  // Suggested Goals in Rupees ₹
  const suggestedGoals = isStudent
    ? [
        { name: 'Semester Break Goa/Hill Trip', amount: 8000, category: 'Trip', icon: Compass },
        { name: 'Coding Laptop / Tablet', amount: 55000, category: 'Tech', icon: Laptop },
        { name: 'Student Emergency Buffer', amount: 10000, category: 'Emergency Fund', icon: Shield },
        { name: 'Online Tech Certification', amount: 5000, category: 'Course', icon: BookOpen },
        { name: 'Smartphone Upgrade', amount: 20000, category: 'Phone', icon: Smartphone },
      ]
    : [
        { name: '6-Month Emergency Fund', amount: 150000, category: 'Emergency Fund', icon: Shield },
        { name: 'Family Holiday / Vacation', amount: 45000, category: 'Trip', icon: Compass },
        { name: 'Developer Workstation', amount: 85000, category: 'Tech', icon: Laptop },
        { name: 'Executive Course / Upskilling', amount: 30000, category: 'Course', icon: BookOpen },
        { name: 'Flagship Smartphone', amount: 50000, category: 'Phone', icon: Smartphone },
      ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Savings & Milestone Goals</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Allocate funds toward laptops, trips, emergency reserves, and gadget upgrades in {currency}
          </p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="btn-primary px-4 py-2 text-xs font-semibold rounded-xl shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Create New Goal
        </button>
      </div>

      {/* Suggested Goals Banner */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800">
        <div className="flex items-center gap-2 mb-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Tailored Presets for {isStudent ? 'Students' : 'Employees'}</span>
        </div>
        <p className="text-xs text-slate-300 mb-3">
          Click any preset to instantly launch a new savings target:
        </p>

        <div className="flex flex-wrap gap-2.5">
          {suggestedGoals.map((sg, idx) => {
            const Icon = sg.icon;
            return (
              <button
                key={idx}
                onClick={() => openCreateModal(sg.name, sg.amount, sg.category)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-2 border border-slate-700 transition-all hover:border-indigo-400"
              >
                <Icon className="w-3.5 h-3.5 text-indigo-400" />
                <span>{sg.name}</span>
                <span className="text-indigo-300 font-mono">({currency}{sg.amount.toLocaleString()})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-xs text-slate-400">Loading goals...</div>
        ) : goals.length === 0 ? (
          <div className="col-span-3 py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
            <Target className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">No Savings Goals Yet</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Set your sights on a laptop, trip, emergency reserve, or gadget.
            </p>
            <button
              onClick={() => openCreateModal()}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-xl shadow-xs"
            >
              Add First Goal
            </button>
          </div>
        ) : (
          goals.map((goal) => {
            const percentage = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                  goal.isCompleted 
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {goal.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(goal)}
                        className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md"
                        title="Edit Goal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(goal.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{goal.name}</h3>

                  {goal.targetDate && (
                    <p className="text-[11px] text-slate-400 mt-0.5">Target Date: {goal.targetDate}</p>
                  )}

                  {/* Progress Ring / Bar */}
                  <div className="my-4">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200 text-base">
                        {currency}{goal.currentAmount.toLocaleString()}{' '}
                        <span className="text-slate-400 text-xs font-normal">/ {currency}{goal.targetAmount.toLocaleString()}</span>
                      </span>
                      <span
                        className={`font-bold ${
                          goal.isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'
                        }`}
                      >
                        {percentage}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          goal.isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Quick-Deposit & Status */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  {goal.isCompleted ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 justify-center py-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Target Achieved! 🎯</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                        {currency}{remaining.toLocaleString()} left
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleAddFunds(goal, 500)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-semibold rounded-md transition-colors"
                        >
                          +{currency}500
                        </button>
                        <button
                          onClick={() => handleAddFunds(goal, 1000)}
                          className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-semibold rounded-md transition-colors"
                        >
                          +{currency}1k
                        </button>
                        <button
                          onClick={() => handleAddFunds(goal, 5000)}
                          className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold rounded-md transition-colors"
                        >
                          +{currency}5k
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Goal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl max-w-md w-full p-6 border border-slate-100 dark:border-slate-800 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingGoal ? 'Update Savings Goal' : 'Create New Savings Goal'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Goal Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Laptop, Goa Trip, Emergency Fund"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Tech">Tech / Gadgets</option>
                    <option value="Trip">Trip / Travel</option>
                    <option value="Emergency Fund">Emergency Fund</option>
                    <option value="Course">Course / Cert</option>
                    <option value="Phone">Phone</option>
                    <option value="General">General Savings</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Amount ({currency})</label>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="10000"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Currently Saved ({currency})</label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
