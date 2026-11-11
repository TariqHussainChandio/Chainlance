import React, { createContext, useContext, useState } from "react";

export type ThemeMode = "dark" | "light";

export interface ThemeColors {
  background: string;
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentEmerald: string;
  accentEmeraldBg: string;
  accentAzure: string;
  accentAzureBg: string;
  accentPurple: string;
  accentPurpleBg: string;
  headerBg: string;
  inputBg: string;
  inputBorder: string;
  tabBarBg: string;
  tabBarBorder: string;
  drawerBg: string;
}

export const darkColors: ThemeColors = {
  background: "#030d0a",
  cardBg: "rgba(7, 24, 19, 0.72)",
  cardBorder: "rgba(52, 211, 153, 0.25)",
  cardShadow: "rgba(0, 0, 0, 0.6)",
  textPrimary: "#ffffff",
  textSecondary: "#f1f5f9",
  textMuted: "#94a3b8",
  accentEmerald: "#34d399",
  accentEmeraldBg: "rgba(16, 185, 129, 0.22)",
  accentAzure: "#38bdf8",
  accentAzureBg: "rgba(14, 165, 233, 0.22)",
  accentPurple: "#c084fc",
  accentPurpleBg: "rgba(168, 85, 247, 0.22)",
  headerBg: "#0d1f17",
  inputBg: "rgba(255, 255, 255, 0.08)",
  inputBorder: "rgba(52, 211, 153, 0.3)",
  tabBarBg: "#0d1f17",
  tabBarBorder: "rgba(52, 211, 153, 0.25)",
  drawerBg: "#0d1f17",
};

export const lightColors: ThemeColors = {
  background: "#f3fbf7",
  cardBg: "rgba(255, 255, 255, 0.82)",
  cardBorder: "rgba(16, 185, 129, 0.25)",
  cardShadow: "rgba(16, 185, 129, 0.12)",
  textPrimary: "#0a0a0a",
  textSecondary: "#1e293b",
  textMuted: "#475569",
  accentEmerald: "#059669",
  accentEmeraldBg: "rgba(16, 185, 129, 0.15)",
  accentAzure: "#0369a1",
  accentAzureBg: "rgba(14, 165, 233, 0.15)",
  accentPurple: "#7e22ce",
  accentPurpleBg: "rgba(168, 85, 247, 0.15)",
  headerBg: "#ffffff",
  inputBg: "#ffffff",
  inputBorder: "rgba(16, 185, 129, 0.3)",
  tabBarBg: "#ffffff",
  tabBarBorder: "rgba(16, 185, 129, 0.25)",
  drawerBg: "#ffffff",
};

interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  colors: darkColors,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeMode>("dark");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const colors = theme === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
