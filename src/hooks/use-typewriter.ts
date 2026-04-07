"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface UseTypewriterOptions {
  lines: string[];
  speed?: number;
  lineDelay?: number;
  onComplete?: () => void;
}

interface UseTypewriterReturn {
  displayedLines: string[];
  isComplete: boolean;
  skip: () => void;
}

/**
 * Auto-typing animation hook.
 * Types lines character by character, then calls onComplete.
 */
export function useTypewriter({
  lines,
  speed = 40,
  lineDelay = 300,
  onComplete,
}: UseTypewriterOptions): UseTypewriterReturn {
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const skipRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const skip = useCallback(() => {
    skipRef.current = true;
    setDisplayedLines([...lines]);
    setIsComplete(true);
    onCompleteRef.current?.();
  }, [lines]);

  useEffect(() => {
    if (isComplete) return;

    let cancelled = false;
    let timeoutId: NodeJS.Timeout;

    async function typeLines() {
      const result: string[] = [];

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        if (cancelled || skipRef.current) return;

        const line = lines[lineIdx];
        // For the ASCII banner (multiline), show it all at once
        if (line.includes("\n")) {
          result.push(line);
          setDisplayedLines([...result]);
          await delay(lineDelay);
          continue;
        }

        // Type character by character
        result.push("");
        for (let charIdx = 0; charIdx < line.length; charIdx++) {
          if (cancelled || skipRef.current) return;
          result[result.length - 1] = line.slice(0, charIdx + 1);
          setDisplayedLines([...result]);
          await delay(speed);
        }

        await delay(lineDelay);
      }

      if (!cancelled && !skipRef.current) {
        setIsComplete(true);
        onCompleteRef.current?.();
      }
    }

    function delay(ms: number) {
      return new Promise<void>((resolve) => {
        timeoutId = setTimeout(resolve, ms);
      });
    }

    typeLines();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [lines, speed, lineDelay, isComplete]);

  return { displayedLines, isComplete, skip };
}
