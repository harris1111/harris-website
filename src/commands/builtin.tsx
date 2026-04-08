import { register, registerLazy, getAllCommands } from "./registry";
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

      /** Command groups for organized help display */
      const groups: { label: string; names: string[] }[] = [
        { label: "Profile", names: ["about", "skills", "experience", "education", "certifications", "projects", "timeline", "contact", "social"] },
        { label: "Terminal", names: ["help", "man", "clear", "echo", "whoami", "history", "theme", "date", "uname"] },
        { label: "Navigation", names: ["cd", "ls", "cat", "pwd", "tree", "open"] },
        { label: "Content", names: ["blog", "guestbook", "download-cv"] },
        { label: "Hacker Tools", names: ["nmap", "ping", "traceroute", "ssh", "hack", "exploit", "decrypt"] },
        { label: "Fun", names: ["neofetch", "cowsay", "fortune", "sudo", "matrix"] },
      ];

      const cmdMap = new Map(cmds.map((cmd) => [cmd.name, cmd]));

      return {
        type: "jsx",
        content: (
          <div className="whitespace-pre-wrap font-mono">
            {groups.map((group) => {
              const groupCmds = group.names
                .map((n) => cmdMap.get(n))
                .filter(Boolean);
              if (groupCmds.length === 0) return null;
              return (
                <div key={group.label}>
                  <div>{c(`── ${group.label} ──`, "text-term-accent")}</div>
                  {groupCmds.map((cmd) => (
                    <div key={cmd!.name}>
                      {"  "}{c(cmd!.name.padEnd(16), "text-term-warning")} {cmd!.description}
                    </div>
                  ))}
                  <div>{""}</div>
                </div>
              );
            })}
            <div className="text-term-muted">Tip: {c("<command> --help", "text-term-warning")} for details</div>
            {Math.random() < 0.3 && (
              <div className="text-term-muted">Psst: try {c("sudo", "text-term-warning")} with no args...</div>
            )}
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
            {target.name === "sudo" && (
              <>
                <div>{""}</div>
                <div>{c("NOTES", "text-term-accent")}</div>
                <div>    Not all sudo commands are system commands.</div>
                <div>    Try {c("sudo", "text-term-warning")} with no arguments to see what's available.</div>
              </>
            )}
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

  // Core CV commands — always loaded (small, frequently used)
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
  require("./theme");
  require("./open");

  // Lazy-loaded commands — heavy modules loaded on first use
  const hackerLoader = () => import("./hacker-sim");
  registerLazy("nmap", "Network port scanner", hackerLoader, "nmap <target>");
  registerLazy("ping", "Send ICMP ping to a host", hackerLoader, "ping <host>");
  registerLazy("traceroute", "Trace network route to host", hackerLoader, "traceroute <host>");
  registerLazy("ssh", "Open SSH connection to host", hackerLoader, "ssh [user@]<host>");
  registerLazy("hack", "Launch attack on target", hackerLoader, "hack <target>");
  registerLazy("exploit", "Run exploit against target", hackerLoader, "exploit <target>");
  registerLazy("decrypt", "Decrypt an encrypted file", hackerLoader, "decrypt <file>");

  const easterLoader = () => import("./easter-eggs");
  registerLazy("neofetch", "Display system info (profile summary)", easterLoader);
  registerLazy("cowsay", "Make a cow say something", easterLoader, "cowsay <message>");
  registerLazy("fortune", "Random DevOps wisdom", easterLoader);
  registerLazy("sudo", "Execute with elevated privileges", easterLoader, "sudo <command>");
  registerLazy("matrix", "Enter the Matrix", easterLoader);
  registerLazy("date", "Display current date and time", easterLoader);
  registerLazy("uname", "Display system information", easterLoader);

  const fsLoader = () => import("./filesystem");
  registerLazy("cd", "Change directory", fsLoader, "cd [path]");
  registerLazy("ls", "List directory contents", fsLoader, "ls [-la] [path]");
  registerLazy("cat", "Display file contents", fsLoader, "cat <file>");
  registerLazy("pwd", "Print working directory", fsLoader, "pwd");
  registerLazy("tree", "Display directory tree", fsLoader, "tree [-L depth] [path]");

  const blogLoader = () => import("./blog");
  registerLazy("blog", "Read blog posts", blogLoader, "blog [slug]");

  const guestbookLoader = () => import("./guestbook");
  registerLazy("guestbook", "Read or sign the guestbook", guestbookLoader, "guestbook [sign <name> <message>]");
}
