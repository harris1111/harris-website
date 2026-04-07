import { register } from "./registry";

const PAGES: Record<string, string> = {
  about: "/about",
  blog: "/blog",
  home: "/",
  terminal: "/",
};

register({
  name: "open",
  description: "Open a page in the browser",
  usage: "open <page>  (about | blog | home)",
  execute: (args) => {
    if (!args[0]) {
      const list = Object.entries(PAGES)
        .map(([name, path]) => `  ${name.padEnd(12)} ${path}`)
        .join("\n");
      return {
        type: "text",
        content: ["Available pages:", "", list, "", "Usage: open <page>"].join("\n"),
      };
    }

    const key = args[0].toLowerCase();
    const path = PAGES[key];

    if (!path) {
      return {
        type: "error",
        content: `Unknown page: ${key}. Available: ${Object.keys(PAGES).join(", ")}`,
      };
    }

    if (typeof window !== "undefined") {
      window.open(path, "_blank");
    }

    return {
      type: "text",
      content: `Opening ${path}...`,
    };
  },
});
