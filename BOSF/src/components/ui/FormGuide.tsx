import { cn } from "../../lib/cn";

export type FormResult = "W" | "L";

interface FormGuideProps {
  results: FormResult[];
  /** Maximum results to display (default: 10) */
  max?: number;
  /** Compact mode for inline use in leaderboard rows */
  compact?: boolean;
}

export function FormGuide({ results, max = 10, compact = false }: FormGuideProps) {
  const display = results.slice(0, max);

  if (display.length === 0) return null;

  return (
    <div className={cn("flex items-center", compact ? "gap-0.5" : "gap-1")}>
      {!compact && (
        <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mr-1.5">
          Form
        </span>
      )}
      {display.map((result, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center justify-center font-display font-extrabold rounded-sm shrink-0",
            compact
              ? "w-3.5 h-3.5 text-[7px]"
              : "w-5 h-5 text-[9px]",
            result === "W"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-500"
          )}
          title={result === "W" ? "Win" : "Loss"}
        >
          {result}
        </div>
      ))}
    </div>
  );
}
