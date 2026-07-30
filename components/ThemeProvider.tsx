"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ThemeContext } from "@/lib/theme-context";

const THEME_KEY = "hera_theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The inline script in app/layout.tsx already sets the "dark" class on
  // <html> before hydration, so read it back rather than guessing again.
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document === "undefined") return "light";
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}
