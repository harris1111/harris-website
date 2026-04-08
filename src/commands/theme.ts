import { register } from "./registry";
import { themes, themeNames, applyTheme, isHackerUnlocked } from "@/themes/themes";

function listThemes(currentTheme: string) {
  const available = [...themeNames];
  if (isHackerUnlocked()) available.push("hacker");

  const lines = available.map((t) => {
    const theme = themes[t];
    if (!theme) return `  ${t.padEnd(14)} (unknown)`;
    const marker = t === currentTheme ? " << current" : "";
    return `  ${t.padEnd(14)} ${theme.label}${marker}`;
  });
  return { type: "text" as const, content: ["Themes:", "", ...lines].join("\n") };
}

register({
  name: "theme",
  description: "Change terminal theme",
  usage: "theme [name | --list]",
  execute: (args, ctx, flags) => {
    if (flags.list) {
      return listThemes(ctx.theme);
    }

    if (args.length === 0) {
      return {
        type: "text",
        content: `Current theme: ${ctx.theme}\nUse 'theme --list' to see all themes.`,
      };
    }

    const name = args[0].toLowerCase();

    if (name === "list") {
      return listThemes(ctx.theme);
    }

    // Hacker theme gatekeeper
    if (name === "hacker") {
      if (!isHackerUnlocked()) {
        return {
          type: "error",
          content: "theme: 'hacker' is locked. Complete the secret challenge to unlock it.",
        };
      }
    }

    if (!themes[name]) {
      return {
        type: "error",
        content: `Unknown theme: ${name}. Use 'theme --list' to see available themes.`,
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
