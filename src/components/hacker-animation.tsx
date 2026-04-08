"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";

export interface HackerLine {
  /** Line content — string or JSX with inline color spans */
  text: ReactNode;
  /** Delay in ms before showing this line (default: 80) */
  delay?: number;
  /** Base CSS color class for the whole line (default: "text-term-fg") */
  color?: string;
}

/**
 * Progressively reveals lines with configurable delays,
 * simulating real terminal output from hacker tools.
 * Auto-scrolls into view as new lines appear.
 */
export function HackerAnimation({ lines }: { lines: HackerLine[] }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visibleCount >= lines.length) return;

    const nextDelay = lines[visibleCount]?.delay ?? 80;
    const timer = setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, nextDelay);

    return () => clearTimeout(timer);
  }, [visibleCount, lines]);

  // Auto-scroll as each new line is revealed
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [visibleCount]);

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
      <div ref={bottomRef} />
    </div>
  );
}
