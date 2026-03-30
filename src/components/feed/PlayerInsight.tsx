import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { askAI } from "../../data/ai";

interface PlayerInsightProps {
  name: string;
  wins: number;
  losses: number;
  pending: number;
  totalPoints: number;
  winRate: number;
}

export function PlayerInsight({ name, wins, losses, pending, totalPoints, winRate }: PlayerInsightProps) {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const context = `Player stats for ${name}: ${wins} wins, ${losses} losses, ${pending} pending, ${totalPoints} total points, ${winRate}% win rate.`;
    const message = `Give a one-liner roast or hype-up (depending on their stats) for ${name} in the BOSF punting competition. Keep it under 100 characters. Be funny, savage but good-natured. Australian style banter. Just the one-liner, no quotes.`;

    askAI(message, context).then((reply) => {
      if (cancelled) return;
      if (reply) setInsight(reply);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) {
        setError(true);
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [name, wins, losses, pending, totalPoints, winRate]);

  if (!loading && !insight && !error) return null;
  if (error) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.3 }}
      className="mt-3 mx-4 mb-4 rounded-xl bg-gradient-to-r from-violet-50 to-sky-50 border border-violet-200/30 px-4 py-3"
    >
      <div className="flex items-start gap-2">
        <Bot size={14} className="text-violet-400 shrink-0 mt-0.5" aria-hidden="true" />
        {loading ? (
          <p className="text-xs text-violet-400 italic animate-pulse" aria-live="polite">Generating roast...</p>
        ) : (
          <p className="text-sm text-violet-700 font-medium leading-snug">{insight}</p>
        )}
      </div>
    </motion.div>
  );
}
