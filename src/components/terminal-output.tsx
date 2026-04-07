"use client";

import { useEffect, useRef } from "react";
import type { OutputEntry } from "@/types";

interface TerminalOutputProps {
  entries: OutputEntry[];
  cwd: string;
}

/** Render a single output entry with appropriate styling */
function OutputLine({ entry, cwd }: { entry: OutputEntry; cwd: string }) {
  if (entry.type === "command") {
    return (
      <div className="flex gap-0">
        <span className="text-term-prompt shrink-0">
          harris@cv:{cwd}${" "}
        </span>
        <span className="text-term-fg">{entry.content}</span>
      </div>
    );
  }

  if (entry.type === "error") {
    return <div className="text-term-error">{entry.content}</div>;
  }

  if (entry.type === "system") {
    return (
      <div className="text-term-muted italic whitespace-pre-wrap">
        {entry.content}
      </div>
    );
  }

  // type === "output"
  return (
    <div className="text-term-fg whitespace-pre-wrap">{entry.content}</div>
  );
}

export function TerminalOutput({ entries, cwd }: TerminalOutputProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [entries.length]);

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-2">
      {entries.map((entry) => (
        <OutputLine key={entry.id} entry={entry} cwd={cwd} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
