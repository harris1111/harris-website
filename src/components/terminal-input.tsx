"use client";

import { useRef, useEffect, useCallback, type KeyboardEvent } from "react";

interface TerminalInputProps {
  cwd: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onHistoryNav: (direction: "up" | "down") => void;
  onAutocomplete: (partial: string) => string | null;
  onClear: () => void;
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
          const completion = onAutocomplete(lastWord);
          if (completion) {
            words[words.length - 1] = completion;
            onChange(words.join(" ") + (words.length === 1 ? " " : ""));
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
      className="flex items-center px-4 pb-4 pt-1 shrink-0 cursor-text"
      onClick={focusInput}
    >
      <span className="text-term-prompt shrink-0">
        harris@cv:{cwd}${" "}
      </span>
      <div className="relative flex-1">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-term-fg outline-none caret-term-accent"
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
