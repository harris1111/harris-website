import { register, getAllCommands } from "./registry";
import { c } from "./format-helpers";
import { profile } from "@/data/profile";
import { QUOTES } from "@/data/quotes";
import { HackerAnimation, type HackerLine } from "@/components/hacker-animation";
import { SITE_URL } from "@/lib/site-config";

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
      const linkedin = profile.social.find(s => s.platform === "LinkedIn");
      const github = profile.social.find(s => s.platform === "GitHub");

      const lines: HackerLine[] = [
        { text: "", delay: 0 },
        { text: <>{c("[sudo]", "text-term-warning")} verifying credentials...</>, delay: 400 },
        { text: <>{c("[sudo]", "text-term-warning")} password for {c("recruiter", "text-term-prompt")}: {c("************", "text-term-muted")}</>, delay: 600 },
        { text: <>{c("[sudo]", "text-term-accent")} authentication successful</>, delay: 500 },
        { text: "", delay: 300 },
        { text: <>{c("[*]", "text-term-accent")} Decrypting classified personnel file...</>, delay: 500 },
        { text: <>{c("[*]", "text-term-accent")} Bypassing HR firewall...</>, delay: 400 },
        { text: <>{c("[*]", "text-term-accent")} Extracting candidate profile...</>, delay: 400 },
        { text: <>{c("[+]", "text-term-accent")} File decrypted successfully</>, delay: 500 },
        { text: "", delay: 400 },
        { text: `  ╔════════════════════════════════════════════════╗`, delay: 100, color: "text-term-accent" },
        { text: `  ║                                                ║`, delay: 50, color: "text-term-accent" },
        { text: <>  ║   {c("█ █ █ █▀▄ █▀▀   █▄ ▄█ █▀▀", "text-term-prompt")}                ║</>, delay: 80 },
        { text: <>  ║   {c("█▀█ █ █▀▄ █▀▀   █ ▀ █ █▀▀", "text-term-prompt")}                ║</>, delay: 80 },
        { text: <>  ║   {c("▀ ▀ ▀ ▀ ▀ ▀▀▀   ▀   ▀ ▀▀▀", "text-term-prompt")}                ║</>, delay: 80 },
        { text: `  ║                                                ║`, delay: 50, color: "text-term-accent" },
        { text: <>  ║   {c("ACCESS LEVEL:", "text-term-warning")} {c("MAXIMUM", "text-term-error")}                        ║</>, delay: 200 },
        { text: <>  ║   {c("STATUS:", "text-term-warning")}       {c("AVAILABLE FOR HIRE", "text-term-accent")}               ║</>, delay: 200 },
        { text: <>  ║   {c("THREAT:", "text-term-warning")}       {c("WILL IMPROVE YOUR INFRA", "text-term-prompt")}          ║</>, delay: 200 },
        { text: `  ║                                                ║`, delay: 50, color: "text-term-accent" },
        { text: `  ╚════════════════════════════════════════════════╝`, delay: 100, color: "text-term-accent" },
        { text: "", delay: 300 },
        { text: <>{c("  ── Secure Communication Channels ──", "text-term-warning")}</>, delay: 300 },
        { text: "", delay: 100 },
        { text: <>  {c("Email:", "text-term-warning")}     {c(profile.email, "text-term-link")}</>, delay: 150 },
        { text: <>  {c("Phone:", "text-term-warning")}     {c(profile.phone, "text-term-link")}</>, delay: 150 },
      ];

      if (linkedin) {
        lines.push({ text: <>  {c("LinkedIn:", "text-term-warning")}  {c(linkedin.url, "text-term-link")}</>, delay: 150 });
      }
      if (github) {
        lines.push({ text: <>  {c("GitHub:", "text-term-warning")}    {c(github.url, "text-term-link")}</>, delay: 150 });
      }

      lines.push(
        { text: <>  {c("Web:", "text-term-warning")}       {c(SITE_URL, "text-term-link")}</>, delay: 150 },
        { text: "", delay: 300 },
        { text: <>{c("  ── Mission Brief ──", "text-term-warning")}</>, delay: 300 },
        { text: "", delay: 100 },
        { text: <>  {c("\"I don't just deploy code. I build systems that", "text-term-muted")}</>, delay: 200 },
        { text: <>  {c(" survive at 3 AM when nobody's watching.\"", "text-term-muted")}</>, delay: 200 },
        { text: "", delay: 300 },
        { text: <>  {c("K8s clusters", "text-term-link")} that auto-heal. {c("CI/CD pipelines", "text-term-link")} that never break.</>, delay: 200 },
        { text: <>  {c("99.95%", "text-term-accent")} uptime. {c("10M req/day", "text-term-accent")}. Zero excuses.</>, delay: 200 },
        { text: "", delay: 400 },
        { text: <>  {c("GG WP. Now go send that email.", "text-term-accent")}</>, delay: 500 },
        { text: "", delay: 0 },
      );

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
