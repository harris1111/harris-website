"use client";

import { useEffect } from "react";
import { applyTheme, defaultTheme, isHackerUnlocked, unlockHackerTheme } from "@/themes/themes";

/**
 * Client component that loads saved theme from localStorage.
 * Restores hacker theme if previously unlocked.
 * Add to any page that needs theme support.
 */
export function ThemeLoader() {
  useEffect(() => {
    if (isHackerUnlocked()) unlockHackerTheme();
    const saved = localStorage.getItem("harris-cv-theme") || defaultTheme;
    applyTheme(saved);
  }, []);

  return null;
}
