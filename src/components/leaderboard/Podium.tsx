import { motion } from "framer-motion";
import { Trophy, Crown, Medal } from "lucide-react";
import { Avatar } from "../ui/Avatar";
import type { EnhancedLeaderboardEntry } from "../../hooks/useLeaderboard";

interface PodiumProps {
  entries: EnhancedLeaderboardEntry[];
  onSelect: (id: number) => void;
}

export function Podium({ entries, onSelect }: PodiumProps) {
  const first = entries[0];
  const second = entries[1];
  const third = entries[2];

  if (!first) return null;

  return (
    <div className="px-4 pt-6 pb-2">
      {/* Winner callout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200/50 px-3 py-1 mb-3">
          <Crown size={12} className="text-amber-600" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Leader</span>
        </div>
      </motion.div>

      {/* Podium with connected base */}
      <div className="relative">
        {/* Player info above podium */}
        <div className="flex items-end justify-center gap-3 mb-0">
          {/* 2nd place */}
          {second && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(second.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(second.id); } }}
              aria-label={`${second.name}, 2nd place, ${second.total_points.toFixed(1)} points`}
              className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform w-24"
            >
              <Avatar name={second.name} id={second.id} size="lg" ringColor="silver" />
              <p className="font-display font-bold text-xs text-zinc-600 mt-2 truncate max-w-[80px]">
                {second.name}
              </p>
              <p className="text-lg font-display font-extrabold text-zinc-500">{second.total_points.toFixed(1)}</p>
              {second.penalty > 0 && (
                <p className="text-[10px] font-semibold text-zinc-400">-${second.penalty}</p>
              )}
            </motion.div>
          )}

          {/* 1st place */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(first.id)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(first.id); } }}
            aria-label={`${first.name}, 1st place, ${first.total_points.toFixed(1)} points`}
            className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform w-28"
          >
            <div className="relative">
              <Avatar name={first.name} id={first.id} size="xl" ringColor="gold" />
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center">
                <Crown size={14} className="text-amber-600" />
              </div>
            </div>
            <p className="font-display font-extrabold text-sm text-zinc-900 mt-2 truncate max-w-[90px]">
              {first.name}
            </p>
            <p className="text-2xl font-display font-extrabold text-gradient-gold">{first.total_points.toFixed(1)}</p>
            {first.penalty === 0 ? (
              <p className="text-[10px] font-semibold text-emerald-500">Free lunch!</p>
            ) : (
              <p className="text-[10px] font-semibold text-zinc-400">-${first.penalty}</p>
            )}
          </motion.div>

          {/* 3rd place */}
          {third && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(third.id)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(third.id); } }}
              aria-label={`${third.name}, 3rd place, ${third.total_points.toFixed(1)} points`}
              className="flex flex-col items-center cursor-pointer active:scale-95 transition-transform w-24"
            >
              <Avatar name={third.name} id={third.id} size="lg" ringColor="bronze" />
              <p className="font-display font-bold text-xs text-zinc-600 mt-2 truncate max-w-[80px]">
                {third.name}
              </p>
              <p className="text-lg font-display font-extrabold text-amber-700">{third.total_points.toFixed(1)}</p>
              {third.penalty > 0 && (
                <p className="text-[10px] font-semibold text-zinc-400">-${third.penalty}</p>
              )}
            </motion.div>
          )}
        </div>

        {/* Connected podium blocks */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="flex items-end justify-center gap-0 mt-2"
        >
          {/* 2nd place block */}
          {second && (
            <div className="w-24 h-16 rounded-tl-xl bg-zinc-100 border border-zinc-200/60 border-r-0 border-b-0 flex items-center justify-center">
              <Medal size={20} className="text-zinc-400" />
            </div>
          )}
          {/* 1st place block */}
          <div className="w-28 h-24 rounded-t-xl bg-gradient-to-t from-amber-100/80 to-amber-50/40 border border-amber-200/50 border-b-0 flex items-center justify-center z-10">
            <Trophy size={28} className="text-amber-500" />
          </div>
          {/* 3rd place block */}
          {third && (
            <div className="w-24 h-12 rounded-tr-xl bg-amber-50 border border-amber-200/40 border-l-0 border-b-0 flex items-center justify-center">
              <Medal size={18} className="text-amber-600" />
            </div>
          )}
        </motion.div>

        {/* Podium base */}
        <div className="h-1 rounded-full bg-gradient-to-r from-zinc-200 via-amber-200 to-zinc-200" />
      </div>
    </div>
  );
}
