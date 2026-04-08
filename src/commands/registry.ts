import type { CommandHandler, CommandOutput, ParsedCommand, TerminalContext } from "@/types";
import { checkMiniEgg } from "@/data/mini-easter-eggs";

const commands = new Map<string, CommandHandler>();

/** Lazy loaders — resolved on first execution */
const lazyLoaders = new Map<string, () => Promise<unknown>>();

/** Register a command handler */
export function register(handler: CommandHandler) {
  commands.set(handler.name, handler);
}

/**
 * Register a lazy command stub — shows in help/autocomplete immediately,
 * but the module is only imported when the command is first executed.
 * The loader should call register() as a side effect.
 */
export function registerLazy(
  name: string,
  description: string,
  loader: () => Promise<unknown>,
  usage?: string,
) {
  lazyLoaders.set(name, loader);
  commands.set(name, {
    name,
    description,
    usage,
    execute: async (args, ctx, flags) => {
      // Load the real module (its side-effect will re-register the command)
      await loader();
      lazyLoaders.delete(name);
      // Now execute the real handler
      const realHandler = commands.get(name);
      if (realHandler) {
        return realHandler.execute(args, ctx, flags);
      }
      return { type: "error", content: `Failed to load command: ${name}` };
    },
  });
}

/** Parse raw input into command, args, and flags */
export function parse(input: string): ParsedCommand {
  const raw = input.trim();
  if (!raw) return { command: "", args: [], flags: {}, raw };

  const tokens: string[] = [];
  let current = "";
  let inQuote: string | null = null;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (inQuote) {
      if (ch === inQuote) {
        inQuote = null;
      } else {
        current += ch;
      }
    } else if (ch === '"' || ch === "'") {
      inQuote = ch;
    } else if (ch === " ") {
      if (current) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += ch;
    }
  }
  if (current) tokens.push(current);

  const command = tokens[0]?.toLowerCase() ?? "";
  const args: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = tokens[i + 1];
      if (next && !next.startsWith("--")) {
        flags[key] = next;
        i++;
      } else {
        flags[key] = true;
      }
    } else {
      args.push(token);
    }
  }

  return { command, args, flags, raw };
}

/** Execute a parsed command, return output */
export async function execute(
  input: string,
  ctx: TerminalContext
): Promise<CommandOutput> {
  const parsed = parse(input);
  if (!parsed.command) {
    return { type: "text", content: "" };
  }

  const handler = commands.get(parsed.command);
  if (!handler) {
    return {
      type: "error",
      content: `Command not found: ${parsed.command}. Type 'help' for available commands.`,
    };
  }

  // Handle --help flag for any command
  if (parsed.flags.help) {
    return {
      type: "text",
      content: `${handler.name}: ${handler.description}${handler.usage ? `\nUsage: ${handler.usage}` : ""}`,
    };
  }

  // Check for mini easter egg hidden arguments
  const egg = checkMiniEgg(parsed.command, parsed.args);
  if (egg) {
    return { type: "text", content: egg };
  }

  return handler.execute(parsed.args, ctx, parsed.flags);
}

/** Get command name completions for tab */
export function getCompletions(partial: string): string[] {
  const lower = partial.toLowerCase();
  return Array.from(commands.keys())
    .filter((name) => name.startsWith(lower))
    .sort();
}

/** Get all registered commands (for help) */
export function getAllCommands(): CommandHandler[] {
  return Array.from(commands.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );
}
