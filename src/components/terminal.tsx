"use client";

import { useEffect, useCallback, useRef } from "react";
import { TerminalOutput } from "./terminal-output";
import { TerminalInput } from "./terminal-input";
import { useTerminal } from "@/hooks/use-terminal";
import { useTypewriter } from "@/hooks/use-typewriter";
import { WELCOME_LINES } from "@/data/ascii-banner";
import { registerAllCommands } from "@/commands/builtin";

// Register commands once on module load
let commandsRegistered = false;
function ensureCommands() {
  if (!commandsRegistered) {
    registerAllCommands();
    commandsRegistered = true;
  }
}

export function Terminal() {
  ensureCommands();

  const terminal = useTerminal();
  const containerRef = useRef<HTMLDivElement>(null);

  const onWelcomeComplete = useCallback(() => {
    terminal.setIsReady(true);
  }, [terminal]);

  const { displayedLines, isComplete, skip } = useTypewriter({
    lines: WELCOME_LINES,
    speed: 30,
    lineDelay: 200,
    onComplete: onWelcomeComplete,
  });

  // Skip welcome animation on any keypress or click
  useEffect(() => {
    if (isComplete) return;

    const handleSkip = () => skip();
    window.addEventListener("keydown", handleSkip, { once: true });
    window.addEventListener("click", handleSkip, { once: true });

    return () => {
      window.removeEventListener("keydown", handleSkip);
      window.removeEventListener("click", handleSkip);
    };
  }, [isComplete, skip]);

  // Click anywhere in terminal to focus input
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't steal focus if user is selecting text
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) return;

      // Focus the input by letting the click propagate to TerminalInput
      const input = containerRef.current?.querySelector("input");
      if (input && e.target !== input) {
        input.focus();
      }
    },
    []
  );

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      ref={containerRef}
      className="flex flex-col h-dvh bg-term-bg text-term-fg text-sm md:text-base"
      onClick={handleContainerClick}
    >
      {/* Welcome animation (before terminal is ready) */}
      {!isComplete && (
        <div className="flex-1 px-4 pt-4 overflow-hidden">
          {displayedLines.map((line, i) => (
            <div key={i} className="whitespace-pre-wrap text-term-accent">
              {line}
            </div>
          ))}
          <span className="inline-block w-2 h-4 bg-term-accent animate-pulse" />
        </div>
      )}

      {/* Terminal output + input (after welcome completes) */}
      {isComplete && (
        <>
          <TerminalOutput entries={terminal.outputs} cwd={terminal.cwd} />
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
        </>
      )}
    </div>
  );
}
