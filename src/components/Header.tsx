// src/components/Header.tsx
import React, { useState, useEffect } from 'react';
import { Menu, Bell, Plus, Check, Sun, Moon, Sparkles, Palette, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme, AccentColor, DashboardBg } from '../context/ThemeContext.tsx';
import { NotificationItem } from '../types/index.ts';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  onOpenAddTransaction: () => void;
  onOpenAIAssistant: () => void;
  title: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileSidebar,
  onOpenAddTransaction,
  onOpenAIAssistant,
  title,
}) => {
  const { apiFetch } = useAuth();
  const { resolvedTheme, accentColor, dashboardBg, setTheme, setAccent, setDashboardBg } = useTheme();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await apiFetch('/api/notifications');
      if (res.ok) {
        const data: NotificationItem[] = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.isRead).length);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await apiFetch('/api/notifications/read-all', { method: 'PUT' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Error marking notifications as read:', e);
    }
  };

  const toggleTheme = () => {
    const nextMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextMode);
  };

  const backgrounds: Array<{ id: DashboardBg; label: string; previewClass: string; matchedAccent: string }> = [
    { id: 'default', label: 'Clean Slate Light', previewClass: 'bg-slate-100 border-slate-300', matchedAccent: '#4f46e5' },
    { id: 'slate', label: 'Soft Sky Mist', previewClass: 'bg-sky-100 border-sky-300', matchedAccent: '#2563eb' },
    { id: 'navy', label: 'Midnight Blue', previewClass: 'bg-slate-900 border-slate-700', matchedAccent: '#06b6d4' },
    { id: 'charcoal', label: 'Deep Charcoal', previewClass: 'bg-zinc-900 border-zinc-700', matchedAccent: '#f59e0b' },
    { id: 'emerald', label: 'Forest Green', previewClass: 'bg-emerald-950 border-emerald-800', matchedAccent: '#10b981' },
    { id: 'sunset', label: 'Sunset Blush', previewClass: 'bg-rose-100 border-rose-300', matchedAccent: '#e11d48' },
    { id: 'aurora', label: 'Nordic Aurora', previewClass: 'bg-teal-950 border-teal-800', matchedAccent: '#14b8a6' },
    { id: 'cosmic', label: 'Cosmic Violet', previewClass: 'bg-indigo-950 border-indigo-800', matchedAccent: '#8b5cf6' },
  ];

  const accents: Array<{ name: AccentColor; label: string; color: string }> = [
    { name: 'indigo', label: 'Indigo', color: '#4f46e5' },
    { name: 'emerald', label: 'Emerald', color: '#059669' },
    { name: 'violet', label: 'Violet', color: '#7c3aed' },
    { name: 'amber', label: 'Amber', color: '#d97706' },
    { name: 'cyan', label: 'Cyan', color: '#0891b2' },
    { name: 'rose', label: 'Rose', color: '#e11d48' },
    { name: 'blue', label: 'Blue', color: '#2563eb' },
  ];

  return (
    <header className="h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 transition-colors shadow-2xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span>{title}</span>
          </h2>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Theme Background & Color Picker Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowThemePicker(!showThemePicker)}
            title="Customize Dashboard Background & Button Colors"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 shadow-2xs text-xs font-semibold"
          >
            <Palette className="w-4 h-4 text-indigo-500" />
            <span className="hidden sm:inline">Theme</span>
            <span
              className="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900"
              style={{ backgroundColor: accents.find((a) => a.name === accentColor)?.color || '#4f46e5' }}
            />
          </button>

          {showThemePicker && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-4">
              {/* Background Theme Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
                    Dashboard Background
                  </span>
                  <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium">
                    Auto-matches buttons
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {backgrounds.map((bg) => (
                    <button
                      key={bg.id}
                      onClick={() => setDashboardBg(bg.id)}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        dashboardBg === bg.id
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-lg border ${bg.previewClass} shrink-0`} />
                      <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                        {bg.label.split(' ')[0]}
                      </span>
                      {dashboardBg === bg.id && <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400 ml-auto shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Button Color Override Section */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block mb-2">
                  Button Accent Palette
                </span>
                <div className="flex flex-wrap gap-2">
                  {accents.map((a) => (
                    <button
                      key={a.name}
                      onClick={() => setAccent(a.name)}
                      title={a.label}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                        accentColor === a.name
                          ? 'ring-2 ring-offset-2 ring-slate-800 dark:ring-white scale-110 shadow-xs'
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: a.color }}
                    >
                      {accentColor === a.name && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Dark Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Mode`}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* AI Financial Assistant Button */}
        <button
          onClick={onOpenAIAssistant}
          className="btn-secondary px-3 py-1.5 rounded-xl text-xs font-semibold border border-purple-200 dark:border-purple-800/60 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40 text-purple-700 dark:text-purple-300 hover:shadow-sm"
          title="Open AI Financial Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span className="hidden sm:inline">AI Help</span>
        </button>

        {/* Attractive Add Transaction Button */}
        <button
          onClick={onOpenAddTransaction}
          className="btn-primary px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Entry</span>
          <span className="sm:hidden">Add</span>
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Notifications & Alerts
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400">No alerts at this moment.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 transition-colors ${
                        n.isRead ? 'bg-white dark:bg-slate-900 opacity-70' : 'bg-indigo-50/40 dark:bg-indigo-950/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4
                          className={`text-xs font-semibold ${
                            n.type === 'danger'
                              ? 'text-rose-600 dark:text-rose-400'
                              : n.type === 'warning'
                              ? 'text-amber-600 dark:text-amber-400'
                              : n.type === 'success'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-indigo-600 dark:text-indigo-400'
                          }`}
                        >
                          {n.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(n.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
