"use client";

import { useState, useCallback, useRef } from "react";
import type { OutputEntry, TerminalContext } from "@/types";
import { execute, parse, getCompletions, getHintForCommand } from "@/commands/registry";
import { getPathCompletions } from "@/data/filesystem";

const MAX_OUTPUTS = 1000;
const MAX_INPUT_LENGTH = 500;

let outputIdCounter = 0;
function nextId(): string {
  return `out-${++outputIdCounter}`;
}

function createEntry(
  type: OutputEntry["type"],
  content: React.ReactNode
): OutputEntry {
  return { id: nextId(), type, content, timestamp: Date.now() };
}

export function useTerminal() {
  const [outputs, setOutputs] = useState<OutputEntry[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cwd, setCwd] = useState("~");
  const [inputValue, setInputValue] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [theme, setTheme] = useState("dark");

  // Ref for stable context in async execute
  const stateRef = useRef({ history, cwd, theme });
  stateRef.current = { history, cwd, theme };

  const appendOutput = useCallback((entry: OutputEntry) => {
    setOutputs((prev) => {
      const next = [...prev, entry];
      // Trim scrollback buffer
      if (next.length > MAX_OUTPUTS) {
        return next.slice(next.length - MAX_OUTPUTS);
      }
      return next;
    });
  }, []);

  const clearTerminal = useCallback(() => {
    setOutputs([]);
  }, []);

  const submitCommand = useCallback(
    async (input: string) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      // Add command echo to output — stamp cwd at time of entry
      const cmdEntry = createEntry("command", trimmed);
      cmdEntry.cwd = stateRef.current.cwd;
      appendOutput(cmdEntry);

      // Add to history
      setHistory((prev) => {
        const filtered = prev.filter((h) => h !== trimmed);
        return [...filtered, trimmed];
      });
      setHistoryIndex(-1);

      // Build context
      const ctx: TerminalContext = {
        history: stateRef.current.history,
        cwd: stateRef.current.cwd,
        theme: stateRef.current.theme,
        setTheme,
        setCwd,
      };

      // Execute
      const result = await execute(trimmed, ctx);

      if (result.type === "clear") {
        clearTerminal();
        return;
      }

      if (result.content) {
        appendOutput(
          createEntry(
            result.type === "error" ? "error" : "output",
            result.content
          )
        );
      }

      // Show mini easter egg hint after normal output
      const parsed = parse(trimmed);
      const hint = getHintForCommand(parsed.command, parsed.args);
      if (hint && result.type !== "error") {
        appendOutput(createEntry("system", hint));
      }
    },
    [appendOutput, clearTerminal]
  );

  const navigateHistory = useCallback(
    (direction: "up" | "down") => {
      if (history.length === 0) return;

      setHistoryIndex((prev) => {
        let next: number;
        if (direction === "up") {
          next = prev === -1 ? history.length - 1 : Math.max(0, prev - 1);
        } else {
          next = prev === -1 ? -1 : prev + 1;
          if (next >= history.length) next = -1;
        }

        if (next === -1) {
          setInputValue("");
        } else {
          setInputValue(history[next]);
        }
        return next;
      });
    },
    [history]
  );

  const autocomplete = useCallback(
    (partial: string, fullInput: string): string | null => {
      // If input has a space, try path completion for the argument part
      const spaceIdx = fullInput.indexOf(" ");
      if (spaceIdx !== -1) {
        const pathPart = fullInput.slice(spaceIdx + 1).trimStart();
        const completions = getPathCompletions(stateRef.current.cwd, pathPart);
        if (completions.length === 1) return completions[0];
        return null;
      }
      // Otherwise complete command names
      const completions = getCompletions(partial);
      if (completions.length === 1) return completions[0];
      return null;
    },
    []
  );

  const handleInputChange = useCallback((value: string) => {
    if (value.length <= MAX_INPUT_LENGTH) {
      setInputValue(value);
    }
  }, []);

  /** Add a system message to output (used by welcome animation) */
  const addSystemMessage = useCallback(
    (content: React.ReactNode) => {
      appendOutput(createEntry("system", content));
    },
    [appendOutput]
  );

  return {
    outputs,
    history,
    cwd,
    inputValue,
    isReady,
    theme,
    setIsReady,
    setInputValue: handleInputChange,
    submitCommand,
    navigateHistory,
    autocomplete,
    clearTerminal,
    addSystemMessage,
    setCwd,
    setTheme,
  };
}
