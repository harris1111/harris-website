"use client";

import { useState, useEffect, useRef } from "react";

const GLITCH_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`0123456789ABCDEFabcdef";

interface UseTextScrambleOptions {
  lines: string[];
  /** Total duration in ms for the scramble to resolve (default: 3000) */
  duration?: number;
  /** Delay before starting (default: 200) */
  startDelay?: number;
  onComplete?: () => void;
}

/**
 * Hacker-style text scramble — all lines appear at once as random chars,
 * then each character resolves to the correct letter over time.
 * Characters resolve left-to-right with some randomness.
 */
export function useTextScramble({
  lines,
  duration = 3000,
  startDelay = 200,
  onComplete,
}: UseTextScrambleOptions) {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (isComplete) return;

    let cancelled = false;
    let rafId: number;
    let startTime: number;

    // For each line, track which characters have been "resolved"
    const lineData = lines.map((line) => ({
      target: line,
      // Each char gets a random resolve time between 0 and duration
      resolveTimes: Array.from({ length: line.length }, (_, i) => {
        // Characters resolve roughly left-to-right with randomness
        const baseProgress = i / Math.max(line.length, 1);
        const jitter = (Math.random() - 0.3) * 0.3;
        return Math.max(0, Math.min(1, baseProgress + jitter));
      }),
    }));

    function randChar() {
      return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
    }

    function tick(timestamp: number) {
      if (cancelled) return;
      if (!startTime) startTime = timestamp;

      const elapsed = timestamp - startTime - startDelay;
      const progress = Math.max(0, elapsed / duration);

      if (progress >= 1) {
        // All resolved
        setDisplayedLines(lines.map((l) => l));
        setIsComplete(true);
        onCompleteRef.current?.();
        return;
      }

      // Build display lines with mix of scrambled + resolved chars
      const result = lineData.map(({ target, resolveTimes }) => {
        if (elapsed < 0) {
          // Still in start delay — show all scrambled (or blank for empty/whitespace-only)
          return target.replace(/\S/g, () => randChar());
        }

        return target
          .split("")
          .map((char, i) => {
            // Whitespace and newlines stay as-is
            if (char === " " || char === "\n") return char;
            // If this char's resolve threshold has been passed, show real char
            if (progress >= resolveTimes[i]) return char;
            // Otherwise show random glitch char
            return randChar();
          })
          .join("");
      });

      setDisplayedLines(result);
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
    };
  }, [lines, duration, startDelay, isComplete]);

  return { displayedLines, isComplete };
}
