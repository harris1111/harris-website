import { register, getAllCommands } from "./registry";
import { c } from "./format-helpers";

/** Register built-in commands: help, clear, whoami, echo, man */
export function registerBuiltins() {
  register({
    name: "help",
    description: "Show available commands",
    usage: "help [command]",
    execute: (args) => {
      const cmds = getAllCommands();

      if (args[0]) {
        const target = cmds.find((cmd) => cmd.name === args[0].toLowerCase());
        if (!target) {
          return { type: "error", content: `Unknown command: ${args[0]}` };
        }
        return {
          type: "jsx",
          content: (
            <div className="whitespace-pre-wrap font-mono">
              <div>{c(target.name, "text-term-accent")} — {target.description}</div>
              {target.usage && <div>Usage: {c(target.usage, "text-term-prompt")}</div>}
            </div>
          ),
        };
      }

      return {
        type: "jsx",
        content: (
          <div className="whitespace-pre-wrap font-mono">
            <div>{c("Available commands:", "text-term-accent")}</div>
            <div>{""}</div>
            {cmds.map((cmd) => (
              <div key={cmd.name}>
                {"  "}{c(cmd.name.padEnd(16), "text-term-warning")} {cmd.description}
              </div>
            ))}
            <div>{""}</div>
            <div className="text-term-muted">Tip: {c("<command> --help", "text-term-warning")} for details</div>
          </div>
        ),
      };
    },
  });

  register({
    name: "man",
    description: "Manual page for a command",
    usage: "man <command>",
    execute: (args) => {
      if (!args[0]) {
        return { type: "error", content: "Usage: man <command>" };
      }
      const cmds = getAllCommands();
      const target = cmds.find((cmd) => cmd.name === args[0].toLowerCase());
      if (!target) {
        return { type: "error", content: `No manual entry for ${args[0]}` };
      }
      return {
        type: "jsx",
        content: (
          <div className="whitespace-pre-wrap font-mono">
            <div>{c("NAME", "text-term-accent")}</div>
            <div>    {c(target.name, "text-term-prompt")} — {target.description}</div>
            <div>{""}</div>
            <div>{c("SYNOPSIS", "text-term-accent")}</div>
            <div>    {c(target.usage || target.name, "text-term-warning")}</div>
          </div>
        ),
      };
    },
  });

  register({
    name: "clear",
    description: "Clear the terminal screen",
    execute: () => ({ type: "clear", content: null }),
  });

  register({
    name: "whoami",
    description: "Display current user",
    execute: () => ({
      type: "jsx",
      content: <div>{c("harris", "text-term-prompt")}</div>,
    }),
  });

  register({
    name: "echo",
    description: "Print text to terminal",
    usage: "echo <text>",
    execute: (args) => ({
      type: "text",
      content: args.join(" ") || "",
    }),
  });
}

/** Import all CV command modules (side-effect: registers them) */
export function registerAllCommands() {
  registerBuiltins();
  // These imports register commands as side effects
  require("./about");
  require("./skills");
  require("./experience");
  require("./education");
  require("./contact");
  require("./social");
  require("./certifications");
  require("./projects");
  require("./timeline");
  require("./download-cv");
  require("./history-cmd");
  require("./filesystem");
  require("./theme");
  require("./blog");
  require("./guestbook");
  require("./easter-eggs");
  require("./hacker-sim");
  require("./open");
}
