"use client";

import { useEffect, useCallback, useRef } from "react";
import { TerminalOutput } from "./terminal-output";
import { TerminalInput } from "./terminal-input";
import { useTerminal } from "@/hooks/use-terminal";
import { useTextScramble } from "@/hooks/use-text-scramble";
import { WELCOME_LINES, SECRET_HINT } from "@/data/ascii-banner";
import { registerAllCommands } from "@/commands/builtin";
import { CrtOverlay } from "./crt-overlay";
import { applyTheme, defaultTheme, isHackerUnlocked, unlockHackerTheme } from "@/themes/themes";

// Register commands once on module load
let commandsRegistered = false;
function ensureCommands() {
  if (!commandsRegistered) {
    registerAllCommands();
    commandsRegistered = true;
  }
}

/** All welcome lines combined for the scramble animation */
const ALL_WELCOME = [...WELCOME_LINES, ...SECRET_HINT, ""];

/** Index where secret hint lines start (for color split) */
const HINT_START = WELCOME_LINES.length;

export function Terminal() {
  ensureCommands();

  const terminal = useTerminal();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load theme from localStorage on mount + restore hacker theme if unlocked
  useEffect(() => {
    if (isHackerUnlocked()) unlockHackerTheme();
    const saved = localStorage.getItem("harris-cv-theme") || defaultTheme;
    applyTheme(saved);
    terminal.setTheme(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [terminal.outputs.length, terminal.isReady]);

  const onWelcomeComplete = useCallback(() => {
    terminal.setIsReady(true);
  }, [terminal]);

  // Hacker-style text scramble — all lines appear at once, chars resolve in ~3s
  const { displayedLines, isComplete } = useTextScramble({
    lines: ALL_WELCOME,
    duration: 3000,
    startDelay: 300,
    onComplete: onWelcomeComplete,
  });

  // Click anywhere in terminal to focus input
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) return;

      const input = scrollRef.current?.querySelector("input");
      if (input && e.target !== input) {
        input.focus();
      }
    },
    []
  );

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      ref={scrollRef}
      className="h-full overflow-y-auto bg-term-bg text-term-fg text-sm md:text-base transition-colors duration-300 px-4 pt-4 pb-2"
      onClick={handleContainerClick}
    >
      {terminal.theme === "matrix" && <CrtOverlay variant="matrix" />}
      {terminal.theme === "hacker" && <CrtOverlay variant="hacker" />}

      {/* Welcome banner — scramble animation then static */}
      {!isComplete ? (
        <>
          {displayedLines.map((line, i) => (
            <div
              key={i}
              className={`whitespace-pre-wrap ${i >= HINT_START ? "text-term-warning" : "text-term-accent"}`}
            >
              {line}
            </div>
          ))}
        </>
      ) : (
        <>
          {/* Static banner (always visible, survives clear) */}
          {WELCOME_LINES.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap text-term-accent">
              {line}
            </div>
          ))}
          {/* Secret hint with distinct warning color */}
          {SECRET_HINT.map((line, i) => (
            <div key={`hint-${i}`} className="whitespace-pre-wrap text-term-warning">
              {line}
            </div>
          ))}
          <div className="whitespace-pre-wrap">{""}</div>

          {/* Output + inline input */}
          <TerminalOutput entries={terminal.outputs} />
          <TerminalInput
            cwd={terminal.cwd}
            value={terminal.inputValue}
            disabled={!terminal.isReady}
            onChange={terminal.setInputValue}
            onSubmit={terminal.submitCommand}
            onHistoryNav={terminal.navigateHistory}
            onAutocomplete={terminal.autocomplete}
            onClear={terminal.clearTerminal}
          />
          <div ref={bottomRef} />
        </>
      )}
    </div>
  );
}
