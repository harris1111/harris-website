/** In-memory rate limiter — 1 entry per IP per hour */

const store = new Map<string, number>();
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

export function isRateLimited(ip: string): boolean {
  const lastEntry = store.get(ip);
  if (!lastEntry) return false;
  return Date.now() - lastEntry < WINDOW_MS;
}

export function recordEntry(ip: string): void {
  store.set(ip, Date.now());

  // Cleanup old entries every 100 writes to prevent memory leak
  if (store.size > 1000) {
    const now = Date.now();
    for (const [key, time] of store) {
      if (now - time > WINDOW_MS) store.delete(key);
    }
  }
}
