import { register } from "./registry";
import { themes, themeNames, applyTheme } from "@/themes/themes";

function listThemes(currentTheme: string) {
  const lines = themeNames.map((t) => {
    const theme = themes[t];
    const marker = t === currentTheme ? " ◄ current" : "";
    return `  ${t.padEnd(14)} ${theme.label}${marker}`;
  });
  return { type: "text" as const, content: ["Themes:", "", ...lines].join("\n") };
}

register({
  name: "theme",
  description: "Change terminal theme",
  usage: "theme [name | --list]",
  execute: (args, ctx, flags) => {
    // --list flag (parsed by registry)
    if (flags.list) {
      return listThemes(ctx.theme);
    }

    // No args → show current theme
    if (args.length === 0) {
      return {
        type: "text",
        content: `Current theme: ${ctx.theme}\nUse 'theme --list' to see all themes.`,
      };
    }

    const name = args[0].toLowerCase();

    // "theme list" (positional arg)
    if (name === "list") {
      return listThemes(ctx.theme);
    }

    // Switch theme
    if (!themes[name]) {
      return {
        type: "error",
        content: `Unknown theme: ${name}. Available: ${themeNames.join(", ")}`,
      };
    }

    applyTheme(name);
    ctx.setTheme(name);

    return {
      type: "text",
      content: `Theme switched to: ${themes[name].label}`,
    };
  },
});
