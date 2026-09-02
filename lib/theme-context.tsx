"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "cloth" | "paper";

type ThemeValue = { theme: Theme; toggle: () => void };

const ThemeContext = createContext<ThemeValue | null>(null);

/**
 * In-memory for the session, like the cart — no localStorage or
 * sessionStorage anywhere in this app, so a reload returns to the dark
 * binding. The whole theme is a token swap in globals.css; the cloth colours
 * of the books deliberately do not move.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("cloth");

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "paper") root.setAttribute("data-theme", "paper");
    else root.removeAttribute("data-theme");
  }, [theme]);

  const toggle = useCallback(
    () => setTheme((t) => (t === "cloth" ? "paper" : "cloth")),
    [],
  );

  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
