import type { FeedItem } from "../lib/newsfeed";
import { sanitizeText, sanitizeLongText } from "../lib/sanitize";

const AI_BASE = "";

interface BanterResult {
  headline: string;
  subtext: string;
}

interface SearchResult {
  title: string;
  url: string;
  description: string;
  age?: string;
}

/**
 * Send feed items to OpenRouter for AI-enhanced banter.
 * Falls back gracefully — returns null if the service is unavailable.
 */
export async function enhanceBanter(feedItems: FeedItem[]): Promise<BanterResult[] | null> {
  try {
    const res = await fetch(`${AI_BASE}/api/ai/banter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        feedItems: feedItems.map((item) => ({
          type: item.type,
          headline: sanitizeText(item.headline, 120),
          subtext: sanitizeLongText(item.subtext, 240),
          playerName: sanitizeText(item.playerName, 60),
          sport: sanitizeText(item.sport, 40),
          eventName: sanitizeText(item.eventName, 120),
        })),
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.enhanced ?? null;
  } catch {
    // AI enhancement is optional — fail silently
    return null;
  }
}

/**
 * Search for recent news about a sport/event using Brave Web Search.
 * Returns empty array if the service is unavailable.
 */
export async function searchEventNews(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `${AI_BASE}/api/ai/search?q=${encodeURIComponent(query)}`
    );
    if (!res.ok) return [];

    const data = await res.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}

/**
 * Get an AI-generated response about a topic (general chat).
 */
export async function askAI(message: string, context?: string): Promise<string | null> {
  try {
    const res = await fetch(`${AI_BASE}/api/ai/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, context }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    return data.reply ?? null;
  } catch {
    return null;
  }
}
