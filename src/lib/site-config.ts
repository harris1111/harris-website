/** Site base URL — configurable via NEXT_PUBLIC_SITE_URL env var */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cv.minhan.dev";

/** Hostname extracted from SITE_URL (e.g. "cv.minhan.dev") */
export const SITE_HOST = new URL(SITE_URL).hostname;
