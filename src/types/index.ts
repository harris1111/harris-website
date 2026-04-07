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
  setCwd: (cwd: string) => void;
}

export interface CommandHandler {
  name: string;
  description: string;
  usage?: string;
  execute: (
    args: string[],
    ctx: TerminalContext,
    flags: Record<string, string | boolean>
  ) => CommandOutput | Promise<CommandOutput>;
}

/* === Terminal output entries rendered in scrollback === */

export interface OutputEntry {
  id: string;
  type: "command" | "output" | "error" | "system";
  content: ReactNode;
  timestamp: number;
  /** cwd at the time this entry was created (for command prompt display) */
  cwd?: string;
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

/* === Profile Data === */

export interface Skill {
  category: string;
  technologies: string[];
}

export interface Experience {
  company: string;
  slug: string;
  role: string;
  period: string;
  location: string;
  bullets: string[];
}

export interface Education {
  institution: string;
  degree: string;
  period: string;
  gpa: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  label: string;
}

export interface Profile {
  name: string;
  role: string;
  location: string;
  phone: string;
  email: string;
  summary: string;
  skills: Skill[];
  experience: Experience[];
  education: Education;
  certifications: string[];
  languages: { name: string; score: string }[];
  social: SocialLink[];
  motto: string;
}

/* === Guestbook === */

export interface GuestbookEntry {
  id: number;
  name: string;
  message: string;
  createdAt: Date;
}
