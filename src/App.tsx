// src/App.tsx
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { Sidebar, NavTab } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { OnboardingModal } from './components/OnboardingModal.tsx';
import { AddTransactionModal } from './components/AddTransactionModal.tsx';
import { AIAssistantModal } from './components/AIAssistantModal.tsx';
import { OverviewView } from './views/OverviewView.tsx';
import { TransactionsView } from './views/TransactionsView.tsx';
import { BudgetView } from './views/BudgetView.tsx';
import { AnalyticsView } from './views/AnalyticsView.tsx';
import { GoalsView } from './views/GoalsView.tsx';
import { ProfileView } from './views/ProfileView.tsx';
import { DashboardSummary } from './types/index.ts';
import { Sparkles } from 'lucide-react';

function MainApp() {
  const { user, profile, loading, apiFetch, refreshProfile } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Fetch Dashboard Summary whenever user or tab changes
  const fetchSummary = async () => {
    if (!user) return;
    setSummaryLoading(true);
    try {
      const res = await apiFetch('/api/dashboard/summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Failed to fetch summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (user && profile) {
      fetchSummary();
    }
  }, [user, profile?.updatedAt]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Loading FinTrack...
          </p>
        </div>
      </div>
    );
  }

  // Not logged in -> Show Google Login screen
  if (!user) {
    return <LoginScreen />;
  }

  // Logged in but not finished onboarding -> Show profile chooser
  const showOnboarding = profile && !profile.onboardingCompleted;

  const tabTitles: Record<NavTab, string> = {
    overview: 'Overview Dashboard',
    transactions: 'Transactions Ledger',
    budget: 'Budgeting & Allocations',
    analytics: 'Spending Trends & Analytics',
    goals: 'Savings & Milestone Goals',
    profile: 'Profile & Appearance Settings',
  };

  return (
    <div className="min-h-screen app-dashboard-wrapper flex font-sans antialiased text-slate-900 dark:text-slate-100 relative">
      {/* Sidebar (Desktop sticky & Mobile drawer) */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAIAssistant={() => setIsAIOpen(true)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-w-0 min-h-screen">
        <Header
          title={tabTitles[currentTab]}
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenAddTransaction={() => setIsAddTxOpen(true)}
          onOpenAIAssistant={() => setIsAIOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24">
          {currentTab === 'overview' && (
            <OverviewView
              summary={summary}
              loading={summaryLoading}
              onOpenAddModal={() => setIsAddTxOpen(true)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onRefresh={fetchSummary}
            />
          )}

          {currentTab === 'transactions' && <TransactionsView />}

          {currentTab === 'budget' && <BudgetView />}

          {currentTab === 'analytics' && <AnalyticsView />}

          {currentTab === 'goals' && <GoalsView />}

          {currentTab === 'profile' && <ProfileView />}
        </main>
      </div>

      {/* Floating Action AI Button for quick access on every screen */}
      <button
        onClick={() => setIsAIOpen(true)}
        title="Ask FinTrack AI Assistant"
        className="fixed bottom-6 right-6 z-40 btn-primary px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 group hover:scale-105 transition-all text-xs font-bold"
      >
        <Sparkles className="w-4 h-4 animate-pulse" />
        <span>Ask AI Help</span>
      </button>

      {/* AI Assistant Chat Modal */}
      <AIAssistantModal
        isOpen={isAIOpen}
        onClose={() => setIsAIOpen(false)}
      />

      {/* Quick Add Transaction Modal */}
      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        onSuccess={() => {
          fetchSummary();
        }}
      />

      {/* First-time Onboarding Modal */}
      {showOnboarding && (
        <OnboardingModal
          onComplete={() => {
            refreshProfile();
            fetchSummary();
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </AuthProvider>
  );
}
