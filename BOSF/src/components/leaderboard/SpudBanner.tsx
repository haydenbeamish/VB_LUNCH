import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import type { LeaderboardEntry } from "../../types";

export function SpudBanner({ spud }: { spud: LeaderboardEntry }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.4 }}
      className="mx-4 mb-4 rounded-2xl bg-red-50 border border-red-200/50 px-4 py-3 flex items-center gap-3"
    >
      <div className="relative shrink-0">
        <Avatar name={spud.name} id={spud.id} size="md" />
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center">
          <span className="text-[10px]" role="img" aria-label="potato">{"\u{1F954}"}</span>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <AlertTriangle size={11} className="text-red-500" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">
            The Spud
          </p>
        </div>
        <p className="text-xs text-red-600/70 font-medium truncate mt-0.5">
          {spud.name} {"\u2014"} dead last with {spud.total_points.toFixed(1)} pts
        </p>
      </div>
    </motion.div>
  );
}
