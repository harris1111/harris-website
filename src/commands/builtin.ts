import { register, getAllCommands } from "./registry";

/** Register built-in commands: help, clear, history */
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
