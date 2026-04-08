"use client";

import { useState, useEffect } from "react";

export interface HackerLine {
  text: string;
  /** Delay in ms before showing this line (default: 80) */
  delay?: number;
  /** CSS color class (e.g. "text-term-accent", "text-term-error") */
  color?: string;
}

/**
 * Progressively reveals lines with configurable delays,
 * simulating real terminal output from hacker tools.
 */
export function HackerAnimation({ lines }: { lines: HackerLine[] }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= lines.length) return;

    const nextDelay = lines[visibleCount]?.delay ?? 80;
    const timer = setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, nextDelay);

    return () => clearTimeout(timer);
  }, [visibleCount, lines]);

  return (
    <div className="whitespace-pre-wrap font-mono">
      {lines.slice(0, visibleCount).map((line, i) => (
        <div key={i} className={line.color || "text-term-fg"}>
          {line.text}
        </div>
      ))}
      {visibleCount < lines.length && (
        <span className="animate-pulse text-term-accent">█</span>
      )}
    </div>
  );
}
