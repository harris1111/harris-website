import { register } from "./registry";
import { profile } from "@/data/profile";
import { QUOTES } from "@/data/quotes";

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
      `harris@cv`,
      `─────────────────`,
      `Name: ${profile.name}`,
      `Role: ${profile.role}`,
      `Location: ${profile.location}`,
      `Experience: 2.5+ years`,
      `Companies: Orochi Network, Smart Loyalty`,
      `Stack: K8s, GCP, AWS, Docker, CI/CD`,
      `Editor: Vim + Claude Code`,
      `Shell: bash/zsh`,
      `Uptime: 99.95%`,
      `Motto: "${profile.motto}"`,
    ];

    const lines = [];
    const maxLines = Math.max(ascii.length, info.length);
    for (let i = 0; i < maxLines; i++) {
      const left = (ascii[i] || "").padEnd(22);
      const right = info[i] || "";
      lines.push(`${left} ${right}`);
    }

    return { type: "text", content: lines.join("\n") };
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
    const cow = [
      ` ${border}`,
      `< ${msg} >`,
      ` ${border}`,
      `        \\   ^__^`,
      `         \\  (oo)\\_______`,
      `            (__)\\       )\\/\\`,
      `                ||----w |`,
      `                ||     ||`,
    ];
    return { type: "text", content: cow.join("\n") };
  },
});

/* === fortune === */
register({
  name: "fortune",
  description: "Random DevOps wisdom",
  execute: () => {
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    return { type: "text", content: `\n  "${quote}"\n` };
  },
});

/* === sudo hire-me === */
register({
  name: "sudo",
  description: "Execute with elevated privileges",
  usage: "sudo <command>",
  execute: (args) => {
    if (args.join("-").toLowerCase() === "hire-me") {
      return {
        type: "text",
        content: [
          "",
          "  ╔══════════════════════════════════════╗",
          "  ║                                      ║",
          "  ║   🚀 HIRE ME — ACCESS GRANTED 🚀    ║",
          "  ║                                      ║",
          "  ║   Email: minhan112001@gmail.com      ║",
          "  ║   Phone: +84 347802611               ║",
          "  ║   LinkedIn: /in/minh-an-nguyen       ║",
          "  ║                                      ║",
          "  ║   Let's build something together!    ║",
          "  ║                                      ║",
          "  ╚══════════════════════════════════════╝",
          "",
        ].join("\n"),
      };
    }

    return {
      type: "error",
      content: `sudo: unknown command: ${args.join(" ")}`,
    };
  },
});

/* === matrix === */
register({
  name: "matrix",
  description: "Enter the Matrix",
  execute: () => ({
    type: "text",
    content: [
      "",
      "  Wake up, Neo...",
      "  The Matrix has you...",
      "",
      "  (Use 'theme matrix' for the full experience)",
      "",
    ].join("\n"),
  }),
});

/* === date === */
register({
  name: "date",
  description: "Display current date and time",
  execute: () => ({
    type: "text",
    content: new Date().toString(),
  }),
});

/* === uname === */
register({
  name: "uname",
  description: "Display system information",
  execute: () => ({
    type: "text",
    content: "HarrisOS 1.0.0 harris-cv x86_64 GNU/Linux (Next.js 16)",
  }),
});
