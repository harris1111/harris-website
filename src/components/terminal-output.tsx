"use client";

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
          harris@cv:{cwd}${"\u00A0"}
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
  return (
    <>
      {entries.map((entry) => (
        <OutputLine key={entry.id} entry={entry} cwd={cwd} />
      ))}
    </>
  );
}
