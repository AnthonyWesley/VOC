import { createContext, useContext, useEffect, useState } from "react";
import Icon from "../components/Icon";

type Theme = "voc-dark" | "voc-light";

interface ThemeContextType {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "voc-dark", toggle: () => {} });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("voc-theme");
    if (stored === "voc-dark" || stored === "voc-light") return stored;
    return "voc-dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("voc-theme", theme);
  }, [theme]);

  const toggle = () => setTheme(t => (t === "voc-dark" ? "voc-light" : "voc-dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "voc-dark";

  return (
    <button
      onClick={toggle}
      className="flex size-10 items-center justify-center rounded-2xl border border-[var(--card-border)] bg-[var(--card-top)] text-[var(--text-secondary)] shadow-sm transition-all duration-300 hover:scale-105 hover:text-[var(--accent-cyan)]"
      aria-label="Toggle theme"
    >
      <Icon icon={isDark ? "mdi:white-balance-sunny" : "mdi:moon-waning-crescent"} scale={0.6} />
    </button>
  );
}
