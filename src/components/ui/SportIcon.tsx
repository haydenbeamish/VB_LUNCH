import { getCategoryInfo } from "../../lib/categories";
import { cn } from "../../lib/cn";

export function SportIcon({ sport, size = "md", className }: { sport: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const info = getCategoryInfo(sport);
  const sizeClass = { sm: "w-6 h-6 text-xs", md: "w-8 h-8 text-sm", lg: "w-10 h-10 text-base" }[size];
  return (
    <div
      className={cn("rounded-lg flex items-center justify-center shrink-0", info.bgColor, sizeClass, className)}
      role="img"
      aria-label={info.label}
    >
      {info.emoji}
    </div>
  );
}
