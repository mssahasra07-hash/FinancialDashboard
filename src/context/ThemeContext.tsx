// src/context/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext.tsx';

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'indigo' | 'emerald' | 'violet' | 'amber' | 'cyan' | 'rose' | 'blue';
export type DashboardBg = 'default' | 'slate' | 'navy' | 'charcoal' | 'emerald' | 'sunset' | 'aurora' | 'cosmic';

interface ThemeContextType {
  themeMode: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  accentColor: AccentColor;
  dashboardBg: DashboardBg;
  setTheme: (mode: ThemeMode) => Promise<void>;
  setAccent: (accent: AccentColor) => Promise<void>;
  setDashboardBg: (bg: DashboardBg) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

// Map background options to their matching recommended button accent
export const BG_TO_ACCENT_MAP: Record<DashboardBg, AccentColor> = {
  default: 'indigo',
  slate: 'blue',
  navy: 'cyan',
  charcoal: 'amber',
  emerald: 'emerald',
  sunset: 'rose',
  aurora: 'emerald',
  cosmic: 'violet',
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, apiFetch, updateProfileState } = useAuth();
  
  const [themeMode, setThemeMode] = useState<ThemeMode>(
    (profile?.themeMode as ThemeMode) || (localStorage.getItem('fintrack_theme') as ThemeMode) || 'light'
  );
  const [accentColor, setAccentColor] = useState<AccentColor>(
    (profile?.accentColor as AccentColor) || (localStorage.getItem('fintrack_accent') as AccentColor) || 'indigo'
  );
  const [dashboardBg, setDashboardBgState] = useState<DashboardBg>(
    (profile?.dashboardBg as DashboardBg) || (localStorage.getItem('fintrack_dashboard_bg') as DashboardBg) || 'default'
  );
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  // Sync state if profile loads from database
  useEffect(() => {
    if (profile?.themeMode) {
      setThemeMode(profile.themeMode as ThemeMode);
    }
    if (profile?.accentColor) {
      setAccentColor(profile.accentColor as AccentColor);
    }
    if (profile?.dashboardBg) {
      setDashboardBgState(profile.dashboardBg as DashboardBg);
    }
  }, [profile?.themeMode, profile?.accentColor, profile?.dashboardBg]);

  // Apply dark class, data-accent, and data-bg to documentElement
  useEffect(() => {
    let activeDark = false;
    if (themeMode === 'dark') {
      activeDark = true;
    } else if (themeMode === 'system') {
      activeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      activeDark = false;
    }

    setResolvedTheme(activeDark ? 'dark' : 'light');

    if (activeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    document.documentElement.setAttribute('data-accent', accentColor);
    document.documentElement.setAttribute('data-dashboard-bg', dashboardBg);

    localStorage.setItem('fintrack_theme', themeMode);
    localStorage.setItem('fintrack_accent', accentColor);
    localStorage.setItem('fintrack_dashboard_bg', dashboardBg);
  }, [themeMode, accentColor, dashboardBg]);

  const setTheme = async (mode: ThemeMode) => {
    setThemeMode(mode);
    if (profile) {
      updateProfileState({ ...profile, themeMode: mode });
      try {
        await apiFetch('/api/profile', {
          method: 'PUT',
          body: JSON.stringify({ themeMode: mode }),
        });
      } catch (e) {
        console.error('Failed to persist theme in database:', e);
      }
    }
  };

  const setAccent = async (accent: AccentColor) => {
    setAccentColor(accent);
    document.documentElement.setAttribute('data-accent', accent);
    if (profile) {
      updateProfileState({ ...profile, accentColor: accent });
      try {
        await apiFetch('/api/profile', {
          method: 'PUT',
          body: JSON.stringify({ accentColor: accent }),
        });
      } catch (e) {
        console.error('Failed to persist accent color in database:', e);
      }
    }
  };

  const setDashboardBg = async (bg: DashboardBg) => {
    setDashboardBgState(bg);
    document.documentElement.setAttribute('data-dashboard-bg', bg);
    
    // Automatically match button accent to the chosen background!
    const matchedAccent = BG_TO_ACCENT_MAP[bg] || accentColor;
    setAccentColor(matchedAccent);
    document.documentElement.setAttribute('data-accent', matchedAccent);

    if (profile) {
      updateProfileState({ ...profile, dashboardBg: bg, accentColor: matchedAccent });
      try {
        await apiFetch('/api/profile', {
          method: 'PUT',
          body: JSON.stringify({ dashboardBg: bg, accentColor: matchedAccent }),
        });
      } catch (e) {
        console.error('Failed to persist dashboard background in database:', e);
      }
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        resolvedTheme,
        accentColor,
        dashboardBg,
        setTheme,
        setAccent,
        setDashboardBg,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
