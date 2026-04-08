import { register } from "./registry";
import { c } from "./format-helpers";
import {
  resolvePath,
  toPathString,
  renderTree,
} from "@/data/filesystem";
import type { FSNode } from "@/types";

/** Generate a fake but realistic file size */
function fakeSize(node: FSNode): string {
  if (node.type === "directory") return "4096";
  if (node.content) return String(node.content().length);
  return String(Math.floor(Math.random() * 8000) + 200);
}

/** Generate a fake date for ls -l */
function fakeDate(): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const m = months[Math.floor(Math.random() * 12)];
  const d = String(Math.floor(Math.random() * 28) + 1).padStart(2, " ");
  const h = String(Math.floor(Math.random() * 24)).padStart(2, "0");
  const min = String(Math.floor(Math.random() * 60)).padStart(2, "0");
  return `${m} ${d} ${h}:${min}`;
}

/** Format a single ls -l row */
function longRow(node: FSNode, showAll: boolean) {
  if (!showAll && node.name.startsWith(".")) return null;
  const isDir = node.type === "directory";
  const perms = isDir ? "drwxr-xr-x" : "-rw-r--r--";
  const size = fakeSize(node).padStart(6);
  const date = fakeDate();
  const name = isDir ? `${node.name}/` : node.name;
  const nameColor = isDir ? "text-term-link" : "text-term-fg";

  return (
    <div key={node.name}>
      {c(perms, "text-term-muted")} {c("harris", "text-term-prompt")} harris {c(size, "text-term-warning")} {c(date, "text-term-muted")} {c(name, nameColor)}
    </div>
  );
}

register({
  name: "pwd",
  description: "Print working directory",
  usage: "pwd",
  execute: (_args, ctx) => ({ type: "text", content: ctx.cwd }),
});

register({
  name: "ls",
  description: "List directory contents",
  usage: "ls [-la] [path]",
  execute: (args, ctx, flags) => {
    // Parse flags from args (support -l, -a, -la, -al)
    let longFormat = !!flags.l || !!flags.la || !!flags.al;
    let showAll = !!flags.a || !!flags.la || !!flags.al;
    const pathArgs: string[] = [];

    for (const arg of args) {
      if (arg.startsWith("-")) {
        if (arg.includes("l")) longFormat = true;
        if (arg.includes("a")) showAll = true;
      } else {
        pathArgs.push(arg);
      }
    }

    const targetPath = pathArgs[0] || ctx.cwd;
    const node = resolvePath(ctx.cwd, targetPath);

    if (!node) {
      return {
        type: "error",
        content: `ls: cannot access '${targetPath}': No such file or directory`,
      };
    }

    if (node.type === "file") {
      if (longFormat) {
        return { type: "jsx", content: <div className="whitespace-pre font-mono">{longRow(node, true)}</div> };
      }
      return { type: "text", content: node.name };
    }

    if (!node.children || node.children.length === 0) {
      return { type: "text", content: "(empty directory)" };
    }

    const sorted = [...node.children].sort((a, b) => {
      if (a.type === "directory" && b.type !== "directory") return -1;
      if (a.type !== "directory" && b.type === "directory") return 1;
      return a.name.localeCompare(b.name);
    });

    // Long format: ls -l / ls -la
    if (longFormat) {
      const dotEntries = showAll ? [
        { name: ".", type: "directory" as const },
        { name: "..", type: "directory" as const },
      ] : [];
      const all = [...dotEntries, ...sorted];
      const total = all.length;
      const rows = all
        .map((n) => longRow(n as FSNode, showAll))
        .filter(Boolean);

      return {
        type: "jsx",
        content: (
          <div className="whitespace-pre font-mono">
            <div className="text-term-muted">total {total}</div>
            {rows}
          </div>
        ),
      };
    }

    // Simple format
    const entries = sorted
      .filter((n) => showAll || !n.name.startsWith("."))
      .map((n) => {
        const name = n.type === "directory" ? `${n.name}/` : n.name;
        const color = n.type === "directory" ? "text-term-link" : "text-term-fg";
        return <span key={n.name}>{c(name, color)}  </span>;
      });

    return { type: "jsx", content: <div className="whitespace-pre-wrap font-mono">{entries}</div> };
  },
});

register({
  name: "cd",
  description: "Change directory",
  usage: "cd [path]",
  execute: (args, ctx) => {
    const targetPath = args[0];

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
