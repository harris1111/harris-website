import React from "react";

/** Colored section header */
export function Header({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-term-accent font-bold mt-1 mb-1">{children}</div>
  );
}

/** Indented bullet point */
export function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div className="pl-2">
      <span className="text-term-muted">  • </span>
      <span>{children}</span>
    </div>
  );
}

/** Clickable link styled for terminal */
export function Link({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-term-link underline hover:text-term-accent"
    >
      {children}
    </a>
  );
}

/** Label-value pair with aligned label */
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <span className="text-term-warning w-20 shrink-0">{label}:</span>
      <span>{children}</span>
    </div>
  );
}

/** Dimmed/muted text */
export function Muted({ children }: { children: React.ReactNode }) {
  return <span className="text-term-muted">{children}</span>;
}

/** Simple table with aligned columns */
export function Table({
  rows,
}: {
  rows: [string, string][];
}) {
  const maxLabel = Math.max(...rows.map(([l]) => l.length));
  return (
    <div>
      {rows.map(([label, value], i) => (
        <div key={i}>
          <span className="text-term-warning">{label.padEnd(maxLabel + 2)}</span>
          <span>{value}</span>
        </div>
      ))}
    </div>
  );
}
