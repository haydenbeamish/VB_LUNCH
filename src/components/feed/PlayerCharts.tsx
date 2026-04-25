import { useMemo } from "react";
import { motion } from "framer-motion";
import { LineChart, PieChart as PieIcon } from "lucide-react";
import { cn } from "../../lib/cn";
import { isCorrect } from "../../lib/predictions";
import { getCategoryInfo } from "../../lib/categories";
import type { Prediction } from "../../types";

interface PlayerChartsProps {
  predictions: Prediction[];
}

export function PlayerCharts({ predictions }: PlayerChartsProps) {
  const decided = useMemo(
    () =>
      predictions
        .filter((p) => p.is_correct !== null && p.is_correct !== undefined)
        .sort((a, b) => (a.event_id ?? 0) - (b.event_id ?? 0)),
    [predictions],
  );

  const { cumulative, maxValue, minValue } = useMemo(() => {
    let running = 0;
    let maxValue = 0;
    let minValue = 0;
    const points: number[] = [];
    for (const p of decided) {
      running += p.points_earned || 0;
      const v = Number(running.toFixed(2));
      points.push(v);
      if (v > maxValue) maxValue = v;
      if (v < minValue) minValue = v;
    }
    return { cumulative: points, maxValue, minValue };
  }, [decided]);

  const { sportMix, sportTotal } = useMemo(() => {
    const map = new Map<string, { total: number; wins: number }>();
    for (const p of predictions) {
      if (!p.sport) continue;
      if (p.is_correct === null || p.is_correct === undefined) continue;
      const entry = map.get(p.sport) ?? { total: 0, wins: 0 };
      entry.total += 1;
      if (isCorrect(p.is_correct)) entry.wins += 1;
      map.set(p.sport, entry);
    }
    const rows = [...map.entries()]
      .map(([sport, s]) => ({
        sport,
        total: s.total,
        wins: s.wins,
        winRate: s.total > 0 ? Math.round((s.wins / s.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);
    const total = rows.reduce((sum, r) => sum + r.total, 0);
    return { sportMix: rows, sportTotal: total };
  }, [predictions]);

  if (decided.length < 3 && sportMix.length === 0) return null;

  const width = 320;
  const height = 80;
  const padX = 4;
  const padY = 8;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;
  const range = Math.max(1, maxValue - minValue);
  const xStep =
    cumulative.length > 1 ? usableW / (cumulative.length - 1) : usableW;
  const path = cumulative
    .map((v, i) => {
      const x = padX + i * xStep;
      const y = padY + usableH - ((v - minValue) / range) * usableH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const areaPath = path
    ? `${path} L${(padX + (cumulative.length - 1) * xStep).toFixed(1)} ${(padY + usableH).toFixed(1)} L${padX} ${(padY + usableH).toFixed(1)} Z`
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="px-4 mb-4"
    >
      <div className="rounded-2xl border border-zinc-200/60 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <LineChart size={12} className="text-zinc-400" />
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Points over time
          </h3>
          <span className="text-[10px] text-zinc-300 ml-auto">
            {decided.length} pick{decided.length !== 1 ? "s" : ""}
          </span>
        </div>
        {cumulative.length >= 2 ? (
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-20"
            role="img"
            aria-label={`Cumulative points chart, final ${cumulative[cumulative.length - 1]} points`}
          >
            <defs>
              <linearGradient id="vb-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
              </linearGradient>
            </defs>
            {areaPath && <path d={areaPath} fill="url(#vb-area)" />}
            {path && (
              <path
                d={path}
                fill="none"
                stroke="#16a34a"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {cumulative.length > 0 && (
              <circle
                cx={padX + (cumulative.length - 1) * xStep}
                cy={
                  padY +
                  usableH -
                  ((cumulative[cumulative.length - 1] - minValue) / range) * usableH
                }
                r={2.5}
                fill="#16a34a"
              />
            )}
          </svg>
        ) : (
          <p className="text-xs text-zinc-400 italic">
            Need a couple more decided picks to chart this.
          </p>
        )}

        {sportMix.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-4 mb-2 pt-3 border-t border-zinc-100">
              <PieIcon size={12} className="text-zinc-400" />
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Sport mix
              </h3>
            </div>
            <div className="flex flex-col gap-1.5">
              {sportMix.slice(0, 6).map((row) => {
                const info = getCategoryInfo(row.sport);
                const pct = Math.round((row.total / Math.max(1, sportTotal)) * 100);
                return (
                  <div key={row.sport} className="flex items-center gap-2">
                    <span
                      className={cn(
                        "w-6 h-6 shrink-0 rounded-md flex items-center justify-center text-xs",
                        info.bgColor,
                      )}
                      aria-hidden="true"
                    >
                      {info.emoji}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-zinc-700 truncate">
                          {info.label}
                        </span>
                        <span className="text-[11px] tabular-nums text-zinc-500">
                          {row.wins}/{row.total} &middot; {row.winRate}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-100 mt-1 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          className={cn(
                            "h-full rounded-full",
                            row.winRate >= 50 ? "bg-emerald-400" : "bg-zinc-300",
                          )}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
