import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRateLimited, recordEntry } from "@/lib/rate-limit";
import { containsProfanity, sanitize } from "@/lib/profanity-filter";

/** GET /api/guestbook — list approved entries */
export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get("page") || "1", 10);
  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get("limit") || "20", 10),
    50
  );
  const skip = (page - 1) * limit;

  try {
    const entries = await prisma.guestbookEntry.findMany({
      where: { approved: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: { id: true, name: true, message: true, createdAt: true },
    });

    return NextResponse.json(entries);
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 }
    );
  }
}

/** POST /api/guestbook — create a new entry */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = sanitize(body.name || "Anonymous", 100);
    const message = sanitize(body.message || "", 500);

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    if (message.length < 2) {
      return NextResponse.json(
        { error: "Message too short (min 2 chars)" },
        { status: 400 }
      );
    }

    if (containsProfanity(name) || containsProfanity(message)) {
      return NextResponse.json(
        { error: "Message contains inappropriate content" },
        { status: 400 }
      );
    }

    // Rate limit by IP
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Rate limited — try again in an hour" },
        { status: 429 }
      );
    }

    const entry = await prisma.guestbookEntry.create({
      data: { name, message, ip },
      select: { id: true, name: true, message: true, createdAt: true },
    });

    recordEntry(ip);

    return NextResponse.json(entry, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 }
    );
  }
}
