import { ReactNode } from "react";

/* === Terminal Core === */

export interface CommandOutput {
  type: "text" | "jsx" | "error" | "clear" | "matrix";
  content: ReactNode;
}

export interface TerminalContext {
  history: string[];
  cwd: string;
  theme: string;
  setTheme: (theme: string) => void;
}

export interface CommandHandler {
  name: string;
  description: string;
  usage?: string;
  execute: (
    args: string[],
    ctx: TerminalContext
  ) => CommandOutput | Promise<CommandOutput>;
}

/* === Terminal output entries rendered in scrollback === */

export interface OutputEntry {
  id: string;
  type: "command" | "output" | "error" | "system";
  content: ReactNode;
  timestamp: number;
}

export interface TerminalState {
  outputs: OutputEntry[];
  history: string[];
  historyIndex: number;
  cwd: string;
  inputValue: string;
  isTyping: boolean;
}

/* === Parsed command from user input === */

export interface ParsedCommand {
  command: string;
  args: string[];
  flags: Record<string, string | boolean>;
  raw: string;
}

/* === Theming === */

export interface ThemeColors {
  bg: string;
  fg: string;
  prompt: string;
  accent: string;
  error: string;
  warning: string;
  muted: string;
  selection: string;
  border: string;
  link: string;
}

export interface ThemeConfig {
  name: string;
  label: string;
  colors: ThemeColors;
  /** Extra CSS class applied to root element (e.g. CRT scanlines) */
  className?: string;
}

/* === Virtual Filesystem === */

export interface FSNode {
  name: string;
  type: "file" | "directory";
  children?: FSNode[];
  /** For files: returns formatted content */
  content?: () => string;
}

/* === Blog === */

export interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  description: string;
  readingTime: number;
  published: boolean;
}

export interface BlogPost extends BlogPostMeta {
  content: string;
}

/* === Guestbook === */

export interface GuestbookEntry {
  id: number;
  name: string;
  message: string;
  createdAt: Date;
}
