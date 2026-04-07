import { register } from "./registry";

register({
  name: "history",
  description: "Show command history",
  usage: "history",
  execute: (_args, ctx) => {
    if (ctx.history.length === 0) {
      return { type: "text", content: "No commands in history." };
    }
    const lines = ctx.history.map(
      (cmd, i) => `  ${String(i + 1).padStart(4)}  ${cmd}`
    );
    return { type: "text", content: lines.join("\n") };
  },
});
