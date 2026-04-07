import type { CommandHandler, CommandOutput, ParsedCommand, TerminalContext } from "@/types";

const commands = new Map<string, CommandHandler>();

/** Register a command handler */
export function register(handler: CommandHandler) {
  commands.set(handler.name, handler);
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
      // If next token exists and isn't a flag, treat it as the value
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
