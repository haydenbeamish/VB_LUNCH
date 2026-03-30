import { motion } from "framer-motion";
import { ExternalLink, Globe, Loader2, AlertCircle } from "lucide-react";
import { useEventNews } from "../../hooks/useEventNews";

interface EventNewsProps {
  eventName: string;
  sport: string;
}

export function EventNews({ eventName, sport }: EventNewsProps) {
  const { news, loading, error } = useEventNews(eventName, sport);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 text-zinc-400 text-sm">
        <Loader2 size={14} className="animate-spin" />
        <span>Searching for latest news...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-4 text-zinc-400 text-sm">
        <AlertCircle size={14} />
        <span>News unavailable right now</span>
      </div>
    );
  }

  if (news.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Globe size={13} className="text-zinc-400" />
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Latest News
        </h3>
      </div>
      <div className="flex flex-col gap-2">
        {news.map((item, i) => (
          <motion.a
            key={item.url}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${item.title} (opens in new tab)`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.25 }}
            className="block rounded-xl border border-zinc-200/60 bg-white p-3 hover:shadow-sm hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm text-zinc-800 leading-snug line-clamp-2">
                  {item.title}
                </p>
                <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                  {item.description}
                </p>
                {item.age && (
                  <span className="text-[10px] text-zinc-300 mt-1 inline-block">
                    {item.age}
                  </span>
                )}
              </div>
              <ExternalLink size={12} className="text-zinc-300 shrink-0 mt-1" aria-hidden="true" />
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
}
