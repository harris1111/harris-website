"use client";

import { useEffect } from "react";
import { applyTheme, defaultTheme } from "@/themes/themes";

/**
 * Client component that loads saved theme from localStorage.
 * Add to any page that needs theme support.
 */
export function ThemeLoader() {
  useEffect(() => {
    const saved = localStorage.getItem("harris-cv-theme") || defaultTheme;
    applyTheme(saved);
  }, []);

  return null;
}
