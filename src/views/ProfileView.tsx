// src/views/ProfileView.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme, AccentColor, DashboardBg } from '../context/ThemeContext.tsx';
import { ProfileType } from '../types/index.ts';
import { 
  GraduationCap, 
  Briefcase, 
  Save, 
  CheckCircle2, 
  User, 
  ShieldCheck,
  Moon,
  Sun,
  Laptop,
  HeartHandshake,
  Image as ImageIcon,
  Check
} from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, profile, apiFetch, updateProfileState } = useAuth();
  const { themeMode, accentColor, dashboardBg, setTheme, setAccent, setDashboardBg } = useTheme();

  const [profileType, setProfileType] = useState<ProfileType>(profile?.profileType || 'student');
  const [monthlyIncome, setMonthlyIncome] = useState(String(profile?.monthlyIncome || '15000'));
  const [currency, setCurrency] = useState(profile?.currency || '₹');
  const [institution, setInstitution] = useState(profile?.institutionOrEmployer || '');
  const [savingsTarget, setSavingsTarget] = useState(String(profile?.savingsTargetMonthly || '3000'));

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleProfileSwitch = (type: ProfileType) => {
    setProfileType(type);
    if (type === 'student') {
      if (!monthlyIncome || monthlyIncome === '65000') setMonthlyIncome('15000');
      if (!savingsTarget || savingsTarget === '15000') setSavingsTarget('3000');
      if (!institution || institution.includes('Technologies')) setInstitution('College / Campus');
    } else {
      if (!monthlyIncome || monthlyIncome === '15000') setMonthlyIncome('65000');
      if (!savingsTarget || savingsTarget === '3000') setSavingsTarget('15000');
      if (!institution || institution.includes('College')) setInstitution('Company / Organization');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({
          profileType,
          monthlyIncome: parseFloat(monthlyIncome) || 0,
          currency,
          institutionOrEmployer: institution,
          savingsTargetMonthly: parseFloat(savingsTarget) || 0,
          themeMode,
          accentColor,
          dashboardBg,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        updateProfileState(updated);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };

  const dashboardBgOptions: Array<{ id: DashboardBg; label: string; desc: string; previewClass: string; matchedAccent: string }> = [
    { id: 'default', label: 'Classic Slate Light', desc: 'Crisp minimalist surface with Indigo dynamic buttons', previewClass: 'bg-slate-100 border-slate-300', matchedAccent: '#4f46e5' },
    { id: 'slate', label: 'Soft Sky Mist', desc: 'Gentle pastel blue backdrop with vibrant Blue matched buttons', previewClass: 'bg-sky-100 border-sky-300', matchedAccent: '#2563eb' },
    { id: 'navy', label: 'Midnight Deep Blue', desc: 'Dark nautical twilight theme with glowing Cyan buttons', previewClass: 'bg-slate-900 border-slate-700', matchedAccent: '#06b6d4' },
    { id: 'charcoal', label: 'Obsidian Charcoal', desc: 'Warm sleek dark mode paired with luminous Amber buttons', previewClass: 'bg-zinc-900 border-zinc-700', matchedAccent: '#f59e0b' },
    { id: 'emerald', label: 'Deep Forest Emerald', desc: 'Soothing natural green ambiance with Emerald matched accents', previewClass: 'bg-emerald-950 border-emerald-800', matchedAccent: '#10b981' },
    { id: 'sunset', label: 'Sunset Blush Rose', desc: 'Warm peach-rose backdrop with energetic Rose dynamic buttons', previewClass: 'bg-rose-100 border-rose-300', matchedAccent: '#e11d48' },
    { id: 'aurora', label: 'Nordic Teal Aurora', desc: 'Mystical dark teal theme with Arctic Teal matched buttons', previewClass: 'bg-teal-950 border-teal-800', matchedAccent: '#14b8a6' },
    { id: 'cosmic', label: 'Cosmic Royal Violet', desc: 'Deep galactic indigo background with Neon Purple buttons', previewClass: 'bg-indigo-950 border-indigo-800', matchedAccent: '#8b5cf6' },
  ];

  const accentPalette: Array<{ name: AccentColor; label: string; bgClass: string; color: string }> = [
    { name: 'indigo', label: 'Indigo', bgClass: 'bg-indigo-600', color: '#4f46e5' },
    { name: 'emerald', label: 'Emerald', bgClass: 'bg-emerald-600', color: '#059669' },
    { name: 'violet', label: 'Violet', bgClass: 'bg-violet-600', color: '#7c3aed' },
    { name: 'amber', label: 'Amber', bgClass: 'bg-amber-600', color: '#d97706' },
    { name: 'cyan', label: 'Cyan', bgClass: 'bg-cyan-600', color: '#0891b2' },
    { name: 'rose', label: 'Rose', bgClass: 'bg-rose-600', color: '#e11d48' },
    { name: 'blue', label: 'Blue', bgClass: 'bg-blue-600', color: '#2563eb' },
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Profile & Appearance</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personalize your dashboard background, button color pairing, and manage financial parameters in {currency}
        </p>
      </div>

      {success && (
        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>Profile & theme settings successfully saved to your cloud database!</span>
        </div>
      )}

      {/* Account Info Card & Privacy Trust Seal */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-12 h-12 rounded-full border border-slate-200 dark:border-slate-700" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-base">
              <User className="w-6 h-6" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              {user?.displayName || user?.email?.split('@')[0]}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" /> Private & End-to-End Isolated
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-indigo-500 shrink-0" />
          <p className="text-[11px] text-slate-600 dark:text-slate-300">
            Your data is 100% private to your Google account.
          </p>
        </div>
      </div>

      {/* DASHBOARD BACKGROUND & MATCHED BUTTON THEME CARD */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Dashboard Background & Matched Buttons</h3>
          </div>
          <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-full">
            Persistent Across App
          </span>
        </div>

        {/* 1. Dashboard Background Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Choose Dashboard Background (Buttons Automatically Match)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dashboardBgOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDashboardBg(opt.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                  dashboardBg === opt.id
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md bg-indigo-50/20 dark:bg-indigo-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl border ${opt.previewClass} shrink-0 mt-0.5 shadow-2xs`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{opt.label}</h4>
                    {dashboardBg === opt.id && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Theme Mode selector: Light, Dark, System */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Base Theme Mode
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                themeMode === 'light'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <Sun className="w-5 h-5" />
              <span className="text-xs">Light</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                themeMode === 'dark'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <Moon className="w-5 h-5" />
              <span className="text-xs">Dark</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition-all ${
                themeMode === 'system'
                  ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-bold shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <Laptop className="w-5 h-5" />
              <span className="text-xs">System</span>
            </button>
          </div>
        </div>

        {/* 3. Button Accent Customization Override */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Button Accent Override
          </label>
          <div className="flex flex-wrap items-center gap-2.5">
            {accentPalette.map((item) => (
              <button
                key={item.name}
                type="button"
                onClick={() => setAccent(item.name)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                  accentColor === item.name
                    ? 'border-slate-800 dark:border-white ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full ${item.bgClass}`} />
                <span className="text-slate-800 dark:text-slate-200">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Button Appearance Preview */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
            Live Button Appearance Preview
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="btn-primary px-4 py-2 rounded-xl text-xs font-semibold">
              Primary Action Button
            </button>
            <button type="button" className="btn-secondary px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white">
              Secondary Button
            </button>
            <span className="badge-accent px-3 py-1 rounded-full text-xs font-semibold">
              Active Tag Pill
            </span>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        {/* Role Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Profile Role
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleProfileSwitch('student')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                profileType === 'student'
                  ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 text-slate-900 dark:text-white shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <GraduationCap className={`w-5 h-5 ${profileType === 'student' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="font-bold text-sm">College Student</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Optimized for stipends, allowances, campus hostel, textbooks, and student budgeting.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleProfileSwitch('employee')}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                profileType === 'employee'
                  ? 'border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/40 text-slate-900 dark:text-white shadow-xs'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <Briefcase className={`w-5 h-5 ${profileType === 'employee' ? 'text-indigo-600' : 'text-slate-400'}`} />
                <span className="font-bold text-sm">Salaried Employee</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Optimized for paycheck salary, apartment rent, subscriptions, commute, and emergency funds.
              </p>
            </button>
          </div>
        </div>

        {/* Currency & Income Inputs in Rupees ₹ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
            >
              <option value="₹">₹ (INR - Rupees)</option>
              <option value="$">$ (USD)</option>
              <option value="€">€ (EUR)</option>
              <option value="£">£ (GBP)</option>
              <option value="¥">¥ (JPY)</option>
              <option value="C$">C$ (CAD)</option>
              <option value="A$">A$ (AUD)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {profileType === 'student' ? 'Monthly Allowance / Income' : 'Monthly Salary'}
            </label>
            <div className="relative rounded-xl border border-slate-300 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 bg-white dark:bg-slate-800">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-semibold">
                {currency}
              </span>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 rounded-xl focus:outline-none bg-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Monthly Savings Target
            </label>
            <div className="relative rounded-xl border border-slate-300 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 bg-white dark:bg-slate-800">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 text-xs font-semibold">
                {currency}
              </span>
              <input
                type="number"
                step="any"
                min="0"
                required
                value={savingsTarget}
                onChange={(e) => setSavingsTarget(e.target.value)}
                className="w-full pl-7 pr-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 rounded-xl focus:outline-none bg-transparent"
              />
            </div>
          </div>
        </div>

        {/* Institution / Employer */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {profileType === 'student' ? 'College / University Name' : 'Employer / Company Name'}
          </label>
          <input
            type="text"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            placeholder={profileType === 'student' ? 'e.g. IIT, BITS, Delhi University' : 'e.g. TCS, Infosys, Google, Startup'}
            className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary px-5 py-2.5 text-xs font-semibold rounded-xl shadow-md disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Changes...' : 'Save All Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
};
