/** Mini easter eggs — hidden arguments for each command.
 *  hint: shown at bottom of normal output to guide discovery
 *  msg: shown when the secret arg is used */

const EGGS: Record<string, { arg: string; hint: string; msg: string }> = {
  about:          { arg: "tldr",     hint: "Try: about tldr",              msg: "TL;DR: DevOps nerd who breaks prod at 2 AM and fixes it by 2:05." },
  skills:         { arg: "flex",     hint: "Try: skills flex",             msg: "kubectl go brrr. terraform apply --auto-approve. I live dangerously." },
  experience:     { arg: "honest",   hint: "Try: experience honest",       msg: "90% YAML, 5% debugging YAML, 5% writing YAML about YAML." },
  education:      { arg: "gpa",      hint: "Try: education gpa",           msg: "High enough to get the degree. Low enough to prove I had a life." },
  certifications: { arg: "worth",    hint: "Try: certifications worth",    msg: "Worth more than the paper? Ask my uptime stats." },
  projects:       { arg: "broke",    hint: "Try: projects broke",          msg: "Every one of these broke prod at least once. That's how you learn." },
  timeline:       { arg: "speedrun", hint: "Try: timeline speedrun",       msg: "Any% career speedrun. No glitches (okay, maybe a few)." },
  contact:        { arg: "spam",     hint: "Try: contact spam",            msg: "Please don't. Unless you're offering a job. Then spam away." },
  social:         { arg: "stalk",    hint: "Try: social stalk",            msg: "I see you're doing your research. Respect." },
  neofetch:       { arg: "btw",      hint: "Try: neofetch btw",            msg: "I use Arch btw. Just kidding. Or am I?" },
  help:           { arg: "42",       hint: "Try: help 42",                 msg: "The answer to life, the universe, and everything: sudo hire-me." },
};

/** Check if args contain a mini easter egg for the given command */
export function checkMiniEgg(command: string, args: string[]): string | null {
  const egg = EGGS[command];
  if (!egg) return null;
  if (args.some(a => a.toLowerCase() === egg.arg)) return egg.msg;
  return null;
}

/** Get the hint text for a command (shown at bottom of output) */
export function getEggHint(command: string): string | null {
  return EGGS[command]?.hint ?? null;
}
