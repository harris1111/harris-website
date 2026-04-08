import { register, getAllCommands } from "./registry";

/** Register built-in commands: help, clear, whoami, echo, man */
export function registerBuiltins() {
  register({
    name: "help",
    description: "Show available commands",
    usage: "help [command]",
    execute: (args) => {
      const cmds = getAllCommands();

      if (args[0]) {
        const target = cmds.find((c) => c.name === args[0].toLowerCase());
        if (!target) {
          return { type: "error", content: `Unknown command: ${args[0]}` };
        }
        return {
          type: "text",
          content: `${target.name} — ${target.description}${target.usage ? `\nUsage: ${target.usage}` : ""}`,
        };
      }

      const lines = cmds.map(
        (c) => `  ${c.name.padEnd(16)} ${c.description}`
      );
      return {
        type: "text",
        content: [
          "Available commands:",
          "",
          ...lines,
          "",
          "Tip: <command> --help for details",
        ].join("\n"),
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
      const target = cmds.find((c) => c.name === args[0].toLowerCase());
      if (!target) {
        return { type: "error", content: `No manual entry for ${args[0]}` };
      }
      return {
        type: "text",
        content: [
          `NAME`,
          `    ${target.name} — ${target.description}`,
          "",
          `SYNOPSIS`,
          `    ${target.usage || target.name}`,
        ].join("\n"),
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
    execute: () => ({ type: "text", content: "harris" }),
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
