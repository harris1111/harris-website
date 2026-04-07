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

/* === History entry stored in terminal output === */

export interface HistoryEntry {
  id: number;
  command: string;
  output: CommandOutput;
  cwd: string;
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
