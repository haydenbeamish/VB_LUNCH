import { cn } from "../../lib/cn";

const colorPairs = [
  { bg: "bg-rose-100", text: "text-rose-700", ring: "ring-rose-300" },
  { bg: "bg-blue-100", text: "text-blue-700", ring: "ring-blue-300" },
  { bg: "bg-emerald-100", text: "text-emerald-700", ring: "ring-emerald-300" },
  { bg: "bg-purple-100", text: "text-purple-700", ring: "ring-purple-300" },
  { bg: "bg-cyan-100", text: "text-cyan-700", ring: "ring-cyan-300" },
  { bg: "bg-orange-100", text: "text-orange-700", ring: "ring-orange-300" },
  { bg: "bg-pink-100", text: "text-pink-700", ring: "ring-pink-300" },
  { bg: "bg-teal-100", text: "text-teal-700", ring: "ring-teal-300" },
  { bg: "bg-indigo-100", text: "text-indigo-700", ring: "ring-indigo-300" },
  { bg: "bg-amber-100", text: "text-amber-700", ring: "ring-amber-300" },
  { bg: "bg-lime-100", text: "text-lime-700", ring: "ring-lime-300" },
  { bg: "bg-fuchsia-100", text: "text-fuchsia-700", ring: "ring-fuchsia-300" },
  { bg: "bg-sky-100", text: "text-sky-700", ring: "ring-sky-300" },
  { bg: "bg-red-100", text: "text-red-700", ring: "ring-red-300" },
];

interface AvatarProps {
  name: string;
  id: number;
  size?: "sm" | "md" | "lg" | "xl";
  showRing?: boolean;
  ringColor?: "accent" | "gold" | "silver" | "bronze" | null;
  className?: string;
}

const sizes = {
  sm: "w-7 h-7 text-[10px]",
  md: "w-9 h-9 text-xs",
  lg: "w-12 h-12 text-sm",
  xl: "w-16 h-16 text-lg",
};

const ringColors = {
  accent: "ring-2 ring-emerald-500/50",
  gold: "ring-2 ring-amber-400/60",
  silver: "ring-2 ring-zinc-400/50",
  bronze: "ring-2 ring-amber-600/50",
};

export function Avatar({ name, id, size = "md", showRing = false, ringColor = null, className }: AvatarProps) {
  const pair = colorPairs[Math.abs(id) % colorPairs.length];
  const initial = name.charAt(0).toUpperCase();

  return (
    <div
      aria-label={`${name} avatar`}
      className={cn(
        "rounded-full flex items-center justify-center font-display font-bold shrink-0",
        pair.bg, pair.text,
        sizes[size],
        showRing && pair.ring,
        ringColor && ringColors[ringColor],
        className
      )}
    >
      {initial}
    </div>
  );
}
