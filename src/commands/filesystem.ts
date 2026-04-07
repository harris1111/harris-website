import { register } from "./registry";
import {
  resolvePath,
  toPathString,
  renderTree,
  fsRoot,
} from "@/data/filesystem";

register({
  name: "pwd",
  description: "Print working directory",
  usage: "pwd",
  execute: (_args, ctx) => ({ type: "text", content: ctx.cwd }),
});

register({
  name: "ls",
  description: "List directory contents",
  usage: "ls [path]",
  execute: (args, ctx) => {
    const targetPath = args[0] || ctx.cwd;
    const node = resolvePath(ctx.cwd, targetPath);

    if (!node) {
      return {
        type: "error",
        content: `ls: cannot access '${targetPath}': No such file or directory`,
      };
    }

    if (node.type === "file") {
      return { type: "text", content: node.name };
    }

    if (!node.children || node.children.length === 0) {
      return { type: "text", content: "(empty directory)" };
    }

    const entries = node.children
      .map((c) => (c.type === "directory" ? `${c.name}/` : c.name))
      .sort((a, b) => {
        // Directories first
        const aDir = a.endsWith("/");
        const bDir = b.endsWith("/");
        if (aDir && !bDir) return -1;
        if (!aDir && bDir) return 1;
        return a.localeCompare(b);
      });

    return { type: "text", content: entries.join("  ") };
  },
});

register({
  name: "cd",
  description: "Change directory",
  usage: "cd [path]",
  execute: (args, ctx) => {
    const targetPath = args[0];

    // cd with no args → home
    if (!targetPath) {
      ctx.setCwd("~");
      return { type: "text", content: "" };
    }

    const node = resolvePath(ctx.cwd, targetPath);

    if (!node) {
      return {
        type: "error",
        content: `cd: no such file or directory: ${targetPath}`,
      };
    }

    if (node.type === "file") {
      return {
        type: "error",
        content: `cd: not a directory: ${targetPath}`,
      };
    }

    ctx.setCwd(toPathString(ctx.cwd, targetPath));
    return { type: "text", content: "" };
  },
});

register({
  name: "cat",
  description: "Display file contents",
  usage: "cat <file>",
  execute: (args, ctx) => {
    if (!args[0]) {
      return { type: "error", content: "cat: missing file operand" };
    }

    const node = resolvePath(ctx.cwd, args[0]);

    if (!node) {
      return {
        type: "error",
        content: `cat: ${args[0]}: No such file or directory`,
      };
    }

    if (node.type === "directory") {
      return {
        type: "error",
        content: `cat: ${args[0]}: Is a directory`,
      };
    }

    const content = node.content ? node.content() : "(empty file)";
    return { type: "text", content };
  },
});

register({
  name: "tree",
  description: "Display directory tree",
  usage: "tree [-L depth] [path]",
  execute: (args, ctx) => {
    let maxDepth = 3;
    let targetPath = ctx.cwd;

    // Parse -L flag
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "-L" && args[i + 1]) {
        maxDepth = parseInt(args[i + 1], 10) || 3;
        i++;
      } else {
        targetPath = args[i];
      }
    }

    const node = resolvePath(ctx.cwd, targetPath);
    if (!node) {
      return {
        type: "error",
        content: `tree: '${targetPath}': No such file or directory`,
      };
    }

    if (node.type === "file") {
      return { type: "text", content: node.name };
    }

    const lines = renderTree(node, "", true, 0, maxDepth);
    return { type: "text", content: lines.join("\n") };
  },
});
