export interface CategoryInfo {
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
}

export const CATEGORIES: Record<string, CategoryInfo> = {
  F1:             { label: "F1",            emoji: "\u{1F3CE}\u{FE0F}", color: "text-red-600",     bgColor: "bg-red-100" },
  Basketball:     { label: "Basketball",    emoji: "\u{1F3C0}",         color: "text-orange-600",  bgColor: "bg-orange-100" },
  Golf:           { label: "Golf",          emoji: "\u{26F3}",          color: "text-green-600",   bgColor: "bg-green-100" },
  UFC:            { label: "UFC",           emoji: "\u{1F94A}",         color: "text-red-600",     bgColor: "bg-red-100" },
  Surfing:        { label: "Surfing",       emoji: "\u{1F3C4}",         color: "text-cyan-600",    bgColor: "bg-cyan-100" },
  "Horse Racing": { label: "Racing",        emoji: "\u{1F3C7}",         color: "text-emerald-600", bgColor: "bg-emerald-100" },
  Soccer:         { label: "Soccer",        emoji: "\u{26BD}",          color: "text-green-600",   bgColor: "bg-green-100" },
  Darts:          { label: "Darts",         emoji: "\u{1F3AF}",         color: "text-rose-600",    bgColor: "bg-rose-100" },
  Tennis:         { label: "Tennis",         emoji: "\u{1F3BE}",         color: "text-yellow-600",  bgColor: "bg-yellow-100" },
  "World Cup":    { label: "World Cup",     emoji: "\u{1F3C6}",         color: "text-amber-600",   bgColor: "bg-amber-100" },
  "Ice Hockey":   { label: "Ice Hockey",    emoji: "\u{1F3D2}",         color: "text-blue-600",    bgColor: "bg-blue-100" },
  "Rugby League": { label: "NRL",           emoji: "\u{1F3C9}",         color: "text-lime-600",    bgColor: "bg-lime-100" },
  Cricket:        { label: "Cricket",       emoji: "\u{1F3CF}",         color: "text-emerald-600", bgColor: "bg-emerald-100" },
  Cycling:        { label: "Cycling",       emoji: "\u{1F6B4}",         color: "text-yellow-600",  bgColor: "bg-yellow-100" },
  Poker:          { label: "Poker",         emoji: "\u{1F0CF}",         color: "text-purple-600",  bgColor: "bg-purple-100" },
  TV:             { label: "TV",            emoji: "\u{1F4FA}",         color: "text-pink-600",    bgColor: "bg-pink-100" },
  AFL:            { label: "AFL",           emoji: "\u{1F944}",         color: "text-amber-600",   bgColor: "bg-amber-100" },
  WAFL:           { label: "WAFL",          emoji: "\u{1F3C8}",         color: "text-amber-700",   bgColor: "bg-amber-100" },
};

export function getCategoryInfo(sport: string): CategoryInfo {
  return CATEGORIES[sport] ?? { label: sport, emoji: "\u{1F3C6}", color: "text-zinc-600", bgColor: "bg-zinc-100" };
}

export function getAllCategories(): string[] {
  return Object.keys(CATEGORIES);
}
