// src/components/LoginScreen.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { 
  GraduationCap, 
  Briefcase, 
  ShieldCheck, 
  Lock,
  HeartHandshake,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const { signInWithGoogle, loading } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  const handleLogin = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      console.error(e);
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-indigo-500 selection:text-white transition-colors">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Left Side: Product Showcase (Dark) */}
        <div className="md:col-span-6 bg-slate-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-2.5 mb-8">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center font-bold text-white text-lg shadow-md">
                ₹
              </div>
              <div>
                <h1 className="font-bold text-xl leading-tight">FinTrack</h1>
                <p className="text-[11px] text-indigo-400 font-semibold tracking-wider uppercase">
                  Personal Finance & Budget Hub
                </p>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3">
              Master Your Money with
              <span className="block text-indigo-400">Complete Privacy & Trust.</span>
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-6">
              Tailored specifically for students managing monthly allowances and employees managing salaries in Indian Rupees (₹).
            </p>

            <div className="space-y-3.5 text-xs text-slate-300">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <span>Student Mode: Hostel fees, college books, semester trips</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <span>Employee Mode: Salary, household budgeting, emergency reserve</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>100% Private: Isolated PostgreSQL database per user account</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 flex items-center gap-2 text-[11px] text-slate-400">
            <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Encrypted cloud persistence with Google Authentication</span>
          </div>
        </div>

        {/* Right Side: Sign In Card */}
        <div className="md:col-span-6 p-8 sm:p-12 flex flex-col justify-center bg-white dark:bg-slate-900">
          <div className="max-w-sm mx-auto w-full text-center space-y-6">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-3 font-bold text-xl">
                ₹
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Welcome to Your Space</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                Sign in with your Google account. You will be welcomed directly into your private dashboard.
              </p>
            </div>

            {/* Trust badge */}
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2.5 text-left">
              <HeartHandshake className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-emerald-800 dark:text-emerald-300 text-[11px]">Zero Risk & Full Comfort</p>
                <p className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">Only you have access to your numbers and amounts.</p>
              </div>
            </div>

            {/* Google Sign In Button */}
            <div className="space-y-3 pt-1">
              <button
                onClick={handleLogin}
                disabled={signingIn || loading}
                className="w-full py-3.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-100 font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{signingIn ? 'Connecting to your account...' : 'Continue with Google'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              No passwords to remember. Instant access with Google Sign-In.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
