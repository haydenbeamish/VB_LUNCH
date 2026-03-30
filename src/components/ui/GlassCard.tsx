import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "../../lib/cn";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "accent" | "gold" | "loss" | null;
}

export function GlassCard({ children, className, hover = false, glow = null, ...props }: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "rounded-2xl border border-zinc-200/60 bg-white shadow-sm",
        hover && "cursor-pointer transition-all duration-200 active:scale-[0.98] hover:shadow-md hover:-translate-y-0.5",
        glow === "accent" && "border-emerald-300/40 shadow-[0_0_12px_rgba(22,163,74,0.08)]",
        glow === "gold" && "border-amber-300/40 shadow-[0_0_12px_rgba(217,119,6,0.08)]",
        glow === "loss" && "border-red-300/40 shadow-[0_0_12px_rgba(220,38,38,0.08)]",
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
}
