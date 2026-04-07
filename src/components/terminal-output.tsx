"use client";

import type { OutputEntry } from "@/types";

/** Render a single output entry with appropriate styling */
function OutputLine({ entry }: { entry: OutputEntry }) {
  if (entry.type === "command") {
    // Use the cwd stamped at the time this command was typed
    const promptCwd = entry.cwd || "~";
    return (
      <div className="flex gap-0">
        <span className="text-term-prompt shrink-0">
          harris@cv:{promptCwd}${"\u00A0"}
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

export function TerminalOutput({ entries }: { entries: OutputEntry[] }) {
  return (
    <>
      {entries.map((entry) => (
        <OutputLine key={entry.id} entry={entry} />
      ))}
    </>
  );
}
