// src/components/OnboardingModal.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { GraduationCap, Briefcase, CheckCircle2, ShieldCheck, Heart } from 'lucide-react';
import { ProfileType } from '../types/index.ts';

interface OnboardingModalProps {
  onComplete: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ onComplete }) => {
  const { user, profile, apiFetch, updateProfileState } = useAuth();
  const [profileType, setProfileType] = useState<ProfileType>(profile?.profileType || 'student');
  const [income, setIncome] = useState<string>(profile?.monthlyIncome ? String(profile.monthlyIncome) : '');
  const [currency, setCurrency] = useState<string>(profile?.currency || '₹');
  const [institution, setInstitution] = useState<string>(profile?.institutionOrEmployer || '');
  const [savingsTarget, setSavingsTarget] = useState<string>(profile?.savingsTargetMonthly ? String(profile.savingsTargetMonthly) : '');
  const [saving, setSaving] = useState(false);

  const userName = user?.displayName || user?.email?.split('@')[0] || 'there';

  const handleTypeSelect = (type: ProfileType) => {
    setProfileType(type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          profileType,
          monthlyIncome: Number(income) || 0,
          currency,
          institutionOrEmployer: institution,
          savingsTargetMonthly: Number(savingsTarget) || 0,
          onboardingCompleted: true,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        updateProfileState(updated);
        onComplete();
      }
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 border border-slate-100 dark:border-slate-800 overflow-hidden relative animate-in fade-in zoom-in duration-200">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mb-3 font-bold text-xl shadow-xs">
            ₹
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Welcome, {userName}! 👋
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-md mx-auto">
            We are glad to have you here. FinTrack is your personal, private space to budget and manage your funds with zero worries.
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted & completely isolated to your account</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Profile Choice: Student vs Employee */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleTypeSelect('student')}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                  profileType === 'student'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${profileType === 'student' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  {profileType === 'student' && <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">College Student</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Allowance, hostel, books, student savings</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleTypeSelect('employee')}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                  profileType === 'employee'
                    ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl ${profileType === 'employee' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
                    <Briefcase className="w-5 h-5" />
                  </div>
                  {profileType === 'employee' && <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Employee</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Monthly salary, rent, investments, emergency funds</p>
                </div>
              </button>
            </div>
          </div>

          {/* Monthly Income in Rupees ₹ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {profileType === 'student' ? 'Monthly Allowance / Funds' : 'Monthly Salary / Income'}
              </label>
              <div className="relative rounded-xl border border-slate-300 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 bg-white dark:bg-slate-800">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold">
                  {currency}
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm text-slate-900 dark:text-white rounded-xl focus:outline-none bg-transparent"
                  placeholder="e.g. 15000"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Monthly Savings Goal
              </label>
              <div className="relative rounded-xl border border-slate-300 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 bg-white dark:bg-slate-800">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500 font-bold">
                  {currency}
                </span>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={savingsTarget}
                  onChange={(e) => setSavingsTarget(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm text-slate-900 dark:text-white rounded-xl focus:outline-none bg-transparent"
                  placeholder="e.g. 3000"
                />
              </div>
            </div>
          </div>

          {/* Institution or Employer */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {profileType === 'student' ? 'College / University Name' : 'Company / Employer Name'}
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              placeholder={profileType === 'student' ? 'e.g. IIT, University Campus' : 'e.g. Tech Corp / Startup'}
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 px-4 btn-primary font-semibold rounded-2xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? 'Preparing your dashboard...' : 'Launch FinTrack Dashboard →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
