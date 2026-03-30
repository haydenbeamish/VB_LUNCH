import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}

export function EmptyState({ icon, title, description, children }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center min-h-[50dvh]"
    >
      <div className="w-16 h-16 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-4 text-zinc-400">
        {icon}
      </div>
      <h3 className="font-display font-bold text-base text-zinc-700 mb-1">{title}</h3>
      <p className="text-sm text-zinc-500 max-w-xs">{description}</p>
      {children}
    </motion.div>
  );
}
