"use client";

import { useRef, useEffect, useCallback, useMemo, type KeyboardEvent } from "react";
import { getCompletions } from "@/commands/registry";

interface TerminalInputProps {
  cwd: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onHistoryNav: (direction: "up" | "down") => void;
  onAutocomplete: (partial: string, fullInput: string) => string | null;
  onClear: () => void;
}

/** Known flags/options that get colored differently */
const FLAG_REGEX = /(--?\w[\w-]*)/g;

/**
 * Syntax-highlighted input overlay.
 * Mirrors the input value with colored tokens for:
 * - Valid commands (accent), invalid commands (error), partial matches (muted)
 * - Flags/options (warning)
 * - Arguments (link)
 */
function HighlightedValue({ value }: { value: string }) {
  const parts = useMemo(() => {
    if (!value) return null;

    const tokens = value.split(/(\s+)/);
    const cmd = tokens[0]?.toLowerCase() || "";
    const isValidCmd = cmd && getCompletions(cmd).includes(cmd);
    const isPartialCmd = cmd && !isValidCmd && getCompletions(cmd).length > 0;

    return tokens.map((token, i) => {
      // First token = command
      if (i === 0 && token.trim()) {
        if (isValidCmd) {
          return <span key={i} className="text-term-warning">{token}</span>;
        }
        if (isPartialCmd) {
          return <span key={i} className="text-term-link">{token}</span>;
        }
        return <span key={i} className="text-term-error">{token}</span>;
      }

      // Whitespace — preserve as-is
      if (!token.trim()) {
        return <span key={i}>{token}</span>;
      }

      // Flags (--flag or -f)
      if (token.match(FLAG_REGEX)) {
        return <span key={i} className="text-term-warning">{token}</span>;
      }

      // Arguments — use link color
      return <span key={i} className="text-term-link">{token}</span>;
    });
  }, [value]);

  return <>{parts}</>;
}

export function TerminalInput({
  cwd,
  value,
  disabled = false,
  onChange,
  onSubmit,
  onHistoryNav,
  onAutocomplete,
  onClear,
}: TerminalInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const trimmed = value.trim();
        onSubmit(trimmed);
        onChange("");
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        onHistoryNav("up");
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        onHistoryNav("down");
        return;
      }

      if (e.key === "Tab") {
        e.preventDefault();
        const words = value.split(" ");
        const lastWord = words[words.length - 1];
        if (lastWord) {
          const completion = onAutocomplete(lastWord, value);
          if (completion) {
            if (words.length === 1) {
              onChange(completion + " ");
            } else {
              const cmd = words[0];
              onChange(`${cmd} ${completion}`);
            }
          }
        }
        return;
      }

      // Ctrl+L — clear terminal
      if (e.ctrlKey && e.key === "l") {
        e.preventDefault();
        onClear();
        return;
      }

      // Ctrl+C — clear input
      if (e.ctrlKey && e.key === "c") {
        e.preventDefault();
        onChange("");
        return;
      }
    },
    [value, onChange, onSubmit, onHistoryNav, onAutocomplete, onClear]
  );

  if (disabled) return null;

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className="flex items-center cursor-text"
      onClick={focusInput}
    >
      <span className="text-term-prompt shrink-0">
        harris@cv:{cwd}${"\u00A0"}
      </span>
      <div className="relative flex-1">
        {/* Colored overlay — rendered behind cursor, matches input text exactly */}
        <span
          className="absolute inset-0 pointer-events-none whitespace-pre"
          aria-hidden="true"
        >
          <HighlightedValue value={value} />
        </span>
        {/* Actual input — transparent text, visible caret */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-transparent outline-none caret-term-accent"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          inputMode="text"
          aria-label="Terminal input"
        />
      </div>
    </div>
  );
}
