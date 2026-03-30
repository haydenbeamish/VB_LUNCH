import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "../../lib/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: number | null;
  trendLabel?: string;
  icon?: React.ReactNode;
  accent?: "default" | "accent" | "gold" | "loss";
  delay?: number;
}

export function StatCard({ label, value, trend, trendLabel, icon, accent = "default", delay = 0 }: StatCardProps) {
  const trendColor = !trend ? "text-zinc-400" : trend > 0 ? "text-emerald-600" : "text-red-500";
  const TrendIcon = !trend ? Minus : trend > 0 ? TrendingUp : TrendingDown;

  const valueColor = {
    default: "text-zinc-900",
    accent: "text-emerald-600",
    gold: "text-gradient-gold",
    loss: "text-red-500",
  }[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          {label}
        </span>
        {icon && <span className="text-zinc-400">{icon}</span>}
      </div>
      <p className={cn("font-display font-extrabold text-2xl tracking-tight", valueColor)}>
        {value}
      </p>
      {trend !== undefined && trend !== null && (
        <div className={cn("flex items-center gap-1 mt-2", trendColor)}>
          <TrendIcon size={12} />
          <span className="text-[11px] font-semibold">
            {trend > 0 ? "+" : ""}{trend}%
          </span>
          {trendLabel && (
            <span className="text-[10px] text-zinc-400 ml-1">{trendLabel}</span>
          )}
        </div>
      )}
    </motion.div>
  );
}
