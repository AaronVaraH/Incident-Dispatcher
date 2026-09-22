'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Prevent hydration mismatch during initial SSR
  if (!mounted) {
    return (
      <div className="w-[68px] h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 animate-pulse" />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      onClick={toggleTheme}
      className="group relative flex items-center h-8 w-[68px] rounded-full p-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 bg-slate-200 hover:bg-slate-300/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-300/80 dark:border-slate-700 shadow-inner"
      title={`Current: ${isDark ? 'Dark' : 'Light'} Mode. Click to toggle.`}
    >
      {/* Background Icons */}
      <span className="absolute left-2 flex items-center justify-center text-amber-500 dark:text-slate-500 transition-colors">
        <Sun className="w-3.5 h-3.5" />
      </span>
      <span className="absolute right-2 flex items-center justify-center text-slate-400 dark:text-indigo-300 transition-colors">
        <Moon className="w-3.5 h-3.5" />
      </span>

      {/* Sliding Knob */}
      <span
        className={`relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white dark:bg-slate-900 shadow-md transition-transform duration-300 ease-in-out border border-slate-200/60 dark:border-slate-700 ${
          isDark ? 'translate-x-[36px]' : 'translate-x-0'
        }`}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-400/20" />
        )}
      </span>
    </button>
  );
}
