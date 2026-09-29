// src/components/Sidebar.tsx
import React from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PieChart, 
  LineChart, 
  Target, 
  UserCircle, 
  LogOut,
  GraduationCap,
  Briefcase,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export type NavTab = 'overview' | 'transactions' | 'budget' | 'analytics' | 'goals' | 'profile';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAIAssistant: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenAIAssistant,
  mobileOpen,
  onCloseMobile,
}) => {
  const { user, profile, signOut } = useAuth();

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
    { id: 'budget', label: 'Budget Planner', icon: PieChart },
    { id: 'analytics', label: 'Analytics', icon: LineChart },
    { id: 'goals', label: 'Savings Goals', icon: Target },
    { id: 'profile', label: 'Profile & Themes', icon: UserCircle },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo & App Brand */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white shadow-md text-base">
                ₹
              </div>
              <div>
                <h1 className="font-extrabold text-lg leading-tight tracking-tight">FinTrack</h1>
                <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider">
                  Finance & Budget
                </span>
              </div>
            </div>
          </div>

          {/* User Profile Pill Indicator */}
          <div className="px-4 py-3 mx-4 my-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                {profile?.profileType === 'student' ? (
                  <GraduationCap className="w-4 h-4" />
                ) : (
                  <Briefcase className="w-4 h-4" />
                )}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 capitalize truncate">
                  {profile?.profileType || 'student'} Profile
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {profile?.institutionOrEmployer || 'Campus Life'}
                </p>
              </div>
            </div>
            <span className="text-[11px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-lg font-bold">
              {profile?.currency || '₹'}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id as NavTab);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'btn-primary text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* AI Advisor Promotion Card in Sidebar */}
          <div className="px-4 py-2">
            <button
              onClick={() => {
                onOpenAIAssistant();
                onCloseMobile();
              }}
              className="w-full p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/80 via-purple-950/60 to-slate-900 border border-indigo-500/30 text-left group hover:border-indigo-400 transition-all shadow-md relative overflow-hidden"
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className="p-1 rounded-lg bg-indigo-500 text-white">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-white">AI Financial Help</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">
                Ask Gemini for budget analysis & savings advice.
              </p>
            </button>
          </div>
        </div>

        {/* User Footer & Logout */}
        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3 px-2">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="Avatar"
                className="w-8 h-8 rounded-full border border-slate-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200">
                {user?.email?.slice(0, 2).toUpperCase() || 'US'}
              </div>
            )}
            <div className="truncate flex-1">
              <p className="text-xs font-medium text-slate-200 truncate">
                {user?.displayName || user?.email?.split('@')[0] || 'My Account'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
