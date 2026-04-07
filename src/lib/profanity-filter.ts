/** Lightweight profanity check — blocks obvious slurs/spam */
const BLOCKED_WORDS = [
  "fuck", "shit", "ass", "bitch", "dick", "porn",
  "nigger", "faggot", "retard", "cunt", "whore",
];

export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return BLOCKED_WORDS.some((word) => lower.includes(word));
}

/** Strip HTML tags and limit length */
export function sanitize(input: string, maxLength: number): string {
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}
