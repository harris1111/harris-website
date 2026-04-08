import { register, getAllCommands } from "./registry";
import { c } from "./format-helpers";
import { profile } from "@/data/profile";
import { QUOTES } from "@/data/quotes";
import { HackerAnimation } from "@/components/hacker-animation";
import { getHireMeScenario } from "@/data/hire-me-scenarios";
import { unlockHackerTheme } from "@/themes/themes";

/* === neofetch === */
register({
  name: "neofetch",
  description: "Display system info (profile summary)",
  execute: () => {
    const ascii = [
      "        .--.        ",
      "       |o_o |       ",
      "       |:_/ |       ",
      "      //   \\ \\      ",
      "     (|     | )     ",
      "    /'\\_   _/`\\     ",
      "    \\___)=(___/     ",
    ];

    const info = [
      <>{c("harris", "text-term-prompt")}@{c("cv", "text-term-link")}</>,
      <>{c("─────────────────", "text-term-muted")}</>,
      <>{c("Name:", "text-term-warning")} {c(profile.name, "text-term-accent")}</>,
      <>{c("Role:", "text-term-warning")} {c(profile.role, "text-term-prompt")}</>,
      <>{c("Location:", "text-term-warning")} {profile.location}</>,
      <>{c("Experience:", "text-term-warning")} {c("2.5+ years", "text-term-accent")}</>,
      <>{c("Companies:", "text-term-warning")} Orochi Network, Smart Loyalty</>,
      <>{c("Stack:", "text-term-warning")} {c("K8s", "text-term-link")}, {c("GCP", "text-term-link")}, {c("AWS", "text-term-link")}, {c("Docker", "text-term-link")}, {c("CI/CD", "text-term-link")}</>,
      <>{c("Editor:", "text-term-warning")} {c("Vim", "text-term-prompt")} + {c("Claude Code", "text-term-accent")}</>,
      <>{c("Shell:", "text-term-warning")} bash/zsh</>,
      <>{c("Uptime:", "text-term-warning")} {c("99.95%", "text-term-accent")}</>,
      <>{c("Motto:", "text-term-warning")} {c(`"${profile.motto}"`, "text-term-muted")}</>,
    ];

    const maxLines = Math.max(ascii.length, info.length);
    const rows = [];
    for (let i = 0; i < maxLines; i++) {
      const left = (ascii[i] || "").padEnd(22);
      rows.push(
        <div key={i}>
          <span className="text-term-accent">{left}</span> {info[i] || ""}
        </div>
      );
    }

    return { type: "jsx", content: <div className="whitespace-pre-wrap font-mono">{rows}</div> };
  },
});

/* === cowsay === */
register({
  name: "cowsay",
  description: "Make a cow say something",
  usage: "cowsay <message>",
  execute: (args) => {
    const msg = args.join(" ") || "Moo!";
    const border = "─".repeat(msg.length + 2);
    return {
      type: "jsx",
      content: (
        <div className="whitespace-pre-wrap font-mono">
          <div className="text-term-muted">{` ${border}`}</div>
          <div>&lt; {c(msg, "text-term-accent")} &gt;</div>
          <div className="text-term-muted">{` ${border}`}</div>
          <div>{"        \\   ^__^"}</div>
          <div>{"         \\  "}{c("(oo)", "text-term-warning")}{"\\_______"}</div>
          <div>{"            "}{c("(__)", "text-term-warning")}{"\\       )\\/\\"}</div>
          <div>{"                ||----w |"}</div>
          <div>{"                ||     ||"}</div>
        </div>
      ),
    };
  },
});

/* === fortune === */
register({
  name: "fortune",
  description: "Random DevOps wisdom",
  execute: () => {
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    return {
      type: "jsx",
      content: (
        <div className="whitespace-pre-wrap font-mono">
          {"\n  "}{c(`"${quote}"`, "text-term-accent")}{"\n"}
        </div>
      ),
    };
  },
});

/* === sudo hire-me === */
register({
  name: "sudo",
  description: "Execute with elevated privileges",
  usage: "sudo <command>",
  execute: (args) => {
    // No args → obvious hint
    if (args.length === 0) {
      return {
        type: "jsx",
        content: (
          <div className="whitespace-pre-wrap font-mono">
            <div>usage: {c("sudo", "text-term-warning")} {c("<command>", "text-term-muted")}</div>
            <div>{""}</div>
            <div>{c("Available sudo commands:", "text-term-accent")}</div>
            <div>  {c("sudo <cmd>", "text-term-warning")}        Run a command as root</div>
            <div>  {c("sudo ████-me", "text-term-muted")}      {c("[CLASSIFIED]", "text-term-error")} — requires root access</div>
            <div>{""}</div>
            <div className="text-term-muted">Looks familiar? You might have seen this in a script somewhere...</div>
          </div>
        ),
      };
    }

    if (args.join("-").toLowerCase() === "hire-me") {
      // Unlock hacker theme as reward
      unlockHackerTheme();
      // Pick a random scenario from 5 options
      const lines = getHireMeScenario();
      return { type: "jsx", content: <HackerAnimation lines={lines} /> };
    }

    // Check if the argument is a known command
    const cmdName = args[0]?.toLowerCase();
    const knownCmd = cmdName && getAllCommands().some((cmd) => cmd.name === cmdName);

    if (knownCmd) {
      return {
        type: "jsx",
        content: (
          <div className="whitespace-pre-wrap font-mono">
            <div>{c("[sudo]", "text-term-error")} user {c("harris", "text-term-prompt")} is not in the sudoers file.</div>
            <div>{c("[sudo]", "text-term-error")} This incident will be reported.</div>
            <div>{""}</div>
            <div>Contact {c(profile.email, "text-term-link")} to request elevated access.</div>
          </div>
        ),
      };
    }

    return {
      type: "error",
      content: `sudo: ${args.join(" ")}: command not found`,
    };
  },
});

/* === matrix === */
register({
  name: "matrix",
  description: "Enter the Matrix",
  execute: () => ({
    type: "jsx",
    content: (
      <div className="whitespace-pre-wrap font-mono">
        {"\n"}
        <div>{c("  Wake up, Neo...", "text-term-accent")}</div>
        <div>{c("  The Matrix has you...", "text-term-accent")}</div>
        {"\n"}
        <div>  (Use {c("'theme matrix'", "text-term-prompt")} for the full experience)</div>
        {"\n"}
      </div>
    ),
  }),
});

/* === date === */
register({
  name: "date",
  description: "Display current date and time",
  execute: () => {
    const d = new Date();
    return {
      type: "jsx",
      content: (
        <div>
          {c(d.toLocaleDateString("en-US", { weekday: "short" }), "text-term-prompt")}{" "}
          {c(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), "text-term-accent")}{" "}
          {c(d.toLocaleTimeString(), "text-term-warning")}{" "}
          {c(String(d.getFullYear()), "text-term-muted")}
        </div>
      ),
    };
  },
});

/* === uname === */
register({
  name: "uname",
  description: "Display system information",
  execute: () => ({
    type: "jsx",
    content: (
      <div>
        {c("HarrisOS", "text-term-prompt")} {c("1.0.0", "text-term-warning")} {c("harris-cv", "text-term-link")} {c("x86_64", "text-term-muted")} {c("GNU/Linux", "text-term-accent")} ({c("Next.js 16", "text-term-prompt")})
      </div>
    ),
  }),
});
