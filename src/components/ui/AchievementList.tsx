import { motion } from "framer-motion";
import {
  Trophy,
  Crown,
  Flame,
  Snowflake,
  Target,
  Shield,
  Medal,
  Coins,
  Zap,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../../lib/cn";
import {
  TONE_CLASSES,
  type Achievement,
  type AchievementId,
} from "../../lib/achievements";

const ICONS: Record<AchievementId, LucideIcon> = {
  first_blood: Target,
  hot_streak_3: Flame,
  hot_streak_5: Flame,
  ice_streak_3: Snowflake,
  ice_streak_5: Snowflake,
  sharpshooter: Target,
  iron_punter: Shield,
  podium_finish: Medal,
  apex: Crown,
  spud_club: Trophy,
  century: Coins,
  half_century: Coins,
  lone_genius: Sparkles,
  consistency: Zap,
  polyglot: Sparkles,
};

interface AchievementListProps {
  achievements: Achievement[];
  className?: string;
}

export function AchievementList({ achievements, className }: AchievementListProps) {
  if (achievements.length === 0) {
    return (
      <div className={cn("text-sm text-zinc-400 italic", className)}>
        No badges earned yet — get picking.
      </div>
    );
  }
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {achievements.map((a, i) => {
        const Icon = ICONS[a.id] ?? Trophy;
        const tone = TONE_CLASSES[a.tone];
        return (
          <motion.div
            key={`${a.id}-${i}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03, duration: 0.25 }}
            title={`${a.label}: ${a.description}`}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 border text-[11px] font-semibold",
              tone.bg,
              tone.text,
              tone.border,
            )}
          >
            <Icon size={11} aria-hidden="true" />
            <span>{a.label}</span>
            {a.qualifier && (
              <span className="opacity-70 font-normal">{a.qualifier}</span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
