import type { ThemeConfig } from "@/types";

export const themes: Record<string, ThemeConfig> = {
  dark: {
    name: "dark",
    label: "Dark (Default)",
    colors: {
      bg: "#1a1b26",
      fg: "#a9b1d6",
      prompt: "#7aa2f7",
      accent: "#9ece6a",
      error: "#f7768e",
      warning: "#e0af68",
      muted: "#565f89",
      selection: "#283457",
      border: "#292e42",
      link: "#7dcfff",
    },
  },
  light: {
    name: "light",
    label: "Light",
    colors: {
      bg: "#fafafa",
      fg: "#383a42",
      prompt: "#4078f2",
      accent: "#50a14f",
      error: "#e45649",
      warning: "#c18401",
      muted: "#a0a1a7",
      selection: "#d7d7ff",
      border: "#e0e0e0",
      link: "#0184bc",
    },
  },
  "nord-dark": {
    name: "nord-dark",
    label: "Nord Dark",
    colors: {
      bg: "#2e3440",
      fg: "#eceff4",
      prompt: "#a3be8c",
      accent: "#88c0d0",
      error: "#bf616a",
      warning: "#ebcb8b",
      muted: "#4c566a",
      selection: "#434c5e",
      border: "#3b4252",
      link: "#81a1c1",
    },
  },
  "nord-light": {
    name: "nord-light",
    label: "Nord Light",
    colors: {
      bg: "#eceff4",
      fg: "#2e3440",
      prompt: "#a3be8c",
      accent: "#5e81ac",
      error: "#bf616a",
      warning: "#d08770",
      muted: "#7b88a1",
      selection: "#d8dee9",
      border: "#d8dee9",
      link: "#5e81ac",
    },
  },
  matrix: {
    name: "matrix",
    label: "Matrix",
    colors: {
      bg: "#0a0a0a",
      fg: "#00ff41",
      prompt: "#00ff41",
      accent: "#33ff33",
      error: "#ff3333",
      warning: "#ccff00",
      muted: "#006600",
      selection: "#003300",
      border: "#004400",
      link: "#66ff66",
    },
    className: "matrix-theme",
  },
};

/** Hacker theme — only available after sudo hire-me */
export const hackerTheme: ThemeConfig = {
  name: "hacker",
  label: "Hacker (unlocked)",
  colors: {
    bg: "#0d0208",
    fg: "#ff2a6d",
    prompt: "#05d9e8",
    accent: "#d1f7ff",
    error: "#ff0055",
    warning: "#f5a623",
    muted: "#4a1942",
    selection: "#1a0a2e",
    border: "#2d1b4e",
    link: "#01c38d",
  },
  className: "hacker-theme",
};

export const themeNames = Object.keys(themes);
export const defaultTheme = "dark";

/** Check if hacker theme is unlocked */
export function isHackerUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("harris-cv-hacker-unlocked") === "true";
}

/** Unlock the hacker theme */
export function unlockHackerTheme(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("harris-cv-hacker-unlocked", "true");
  // Add it to the themes registry
  themes["hacker"] = hackerTheme;
}

/** Apply a theme by setting CSS variables on document root */
export function applyTheme(themeName: string): void {
  const theme = themes[themeName];
  if (!theme) return;

  const root = document.documentElement;
  const { colors } = theme;

  root.style.setProperty("--term-bg", colors.bg);
  root.style.setProperty("--term-fg", colors.fg);
  root.style.setProperty("--term-prompt", colors.prompt);
  root.style.setProperty("--term-accent", colors.accent);
  root.style.setProperty("--term-error", colors.error);
  root.style.setProperty("--term-warning", colors.warning);
  root.style.setProperty("--term-muted", colors.muted);
  root.style.setProperty("--term-selection", colors.selection);
  root.style.setProperty("--term-border", colors.border);
  root.style.setProperty("--term-link", colors.link);

  // Toggle theme-specific CSS classes for CRT/glow effects
  root.classList.remove("matrix-theme", "hacker-theme");
  if (theme.className) {
    root.classList.add(theme.className);
  }

  // Persist
  localStorage.setItem("harris-cv-theme", themeName);
}
