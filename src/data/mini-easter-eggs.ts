/** Mini easter eggs — hidden arguments for each command.
 *  Each command has a unique joke + unique reward/nudge. No repeats. */

const EGGS: Record<string, { arg: string; hint: string; msg: string; reward: string }> = {
  about: {
    arg: "tldr",
    hint: "Try: about tldr",
    msg: "TL;DR: DevOps nerd who breaks prod at 2 AM and fixes it by 2:05.",
    reward: "[1/11] Nice find! There's a hidden file on this server. Try: ls -la",
  },
  skills: {
    arg: "flex",
    hint: "Try: skills flex",
    msg: "kubectl go brrr. terraform apply --auto-approve. I live dangerously.",
    reward: "[2/11] You know what else is dangerous? Hacking this server. Try it.",
  },
  experience: {
    arg: "honest",
    hint: "Try: experience honest",
    msg: "90% YAML, 5% debugging YAML, 5% writing YAML about YAML.",
    reward: "[3/11] The admin who wrote all that YAML left a .classified file somewhere...",
  },
  education: {
    arg: "gpa",
    hint: "Try: education gpa",
    msg: "High enough to get the degree. Low enough to prove I had a life.",
    reward: "[4/11] Speaking of life — there's a secret life to this terminal. Check ls -la",
  },
  certifications: {
    arg: "worth",
    hint: "Try: certifications worth",
    msg: "Worth more than the paper? Ask my uptime stats.",
    reward: "[5/11] Want to see real credentials? The root user has some classified files.",
  },
  projects: {
    arg: "broke",
    hint: "Try: projects broke",
    msg: "Every one of these broke prod at least once. That's how you learn.",
    reward: "[6/11] You know what won't break? The CTF hidden in this terminal.",
  },
  timeline: {
    arg: "speedrun",
    hint: "Try: timeline speedrun",
    msg: "Any% career speedrun. No glitches (okay, maybe a few).",
    reward: "[7/11] Speedrun this: ls -la → cat .classified → follow the rabbit hole.",
  },
  contact: {
    arg: "spam",
    hint: "Try: contact spam",
    msg: "Please don't. Unless you're offering a job. Then spam away.",
    reward: "[8/11] There's a faster way to reach me. It involves sudo...",
  },
  social: {
    arg: "stalk",
    hint: "Try: social stalk",
    msg: "I see you're doing your research. Respect.",
    reward: "[9/11] Research this: what happens when you hack this server?",
  },
  neofetch: {
    arg: "btw",
    hint: "Try: neofetch btw",
    msg: "I use Arch btw. Just kidding. Or am I?",
    reward: "[10/11] Almost there. The final secret requires elevated privileges.",
  },
  help: {
    arg: "42",
    hint: "Try: help 42",
    msg: "The answer to life, the universe, and everything: sudo hire-me.",
    reward: "[11/11] You found them all! Now go claim your prize: sudo hire-me",
  },
};

/** Check if args contain a mini easter egg for the given command */
export function checkMiniEgg(command: string, args: string[]): string | null {
  const egg = EGGS[command];
  if (!egg) return null;
  if (args.some(a => a.toLowerCase() === egg.arg)) {
    return `${egg.msg}\n\n${egg.reward}`;
  }
  return null;
}

/** Get the hint text for a command (shown at bottom of output) */
export function getEggHint(command: string): string | null {
  return EGGS[command]?.hint ?? null;
}
