import { cn } from "../../lib/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "gold" | "loss" | "void" | "outline";
  size?: "sm" | "md";
  className?: string;
}

const variants: Record<string, string> = {
  default: "bg-zinc-100 text-zinc-600",
  accent: "bg-emerald-50 text-emerald-700 border border-emerald-200/50",
  gold: "bg-amber-50 text-amber-700 border border-amber-200/50",
  loss: "bg-red-50 text-red-600 border border-red-200/50",
  void: "bg-indigo-50 text-indigo-600 border border-indigo-200/50",
  outline: "border border-zinc-300 text-zinc-600",
};

export function Badge({ children, variant = "default", size = "sm", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
