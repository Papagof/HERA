"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  // theme's initial value is read from document.documentElement (set by the
  // pre-hydration inline script in app/layout.tsx) rather than the SSR-only
  // default, so this button's aria-label/icon state can legitimately differ
  // between the server-rendered HTML and the client's first render whenever
  // the resolved theme is "dark" - suppressHydrationWarning is the React-
  // recommended fix for values only knowable on the client (same category as
  // a rendered local time or locale). The page's actual theme never flashes;
  // only this one button's attributes settle a frame after hydration.
  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      suppressHydrationWarning
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-500 dark:hover:text-indigo-400"
    >
      <Sun
        size={16}
        suppressHydrationWarning
        className={`absolute transition-all duration-300 ${isDark ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"}`}
      />
      <Moon
        size={16}
        suppressHydrationWarning
        className={`absolute transition-all duration-300 ${isDark ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0"}`}
      />
    </button>
  );
}
