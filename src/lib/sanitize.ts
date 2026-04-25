// Strip ASCII control chars (00-1F, 7F), zero-width chars, and bidi spoofing chars.
const CTRL_RE = new RegExp(
  "[\\u0000-\\u001F\\u007F\\u200B-\\u200F\\u202A-\\u202E\\u2060-\\u2064\\uFEFF]",
  "g",
);

/**
 * Strip control / zero-width / bidi-spoofing characters and collapse whitespace
 * before sending strings to the LLM or rendering free-form text.
 */
export function sanitizeText(value: unknown, maxLen = 80): string {
  if (value == null) return "";
  return String(value).replace(CTRL_RE, "").replace(/\s+/g, " ").trim().slice(0, maxLen);
}

export function sanitizeLongText(value: unknown, maxLen = 200): string {
  return sanitizeText(value, maxLen);
}
