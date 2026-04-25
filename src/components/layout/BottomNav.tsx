import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, Trophy, CalendarDays, Newspaper, Shield } from "lucide-react";
import { cn } from "../../lib/cn";

const tabs = [
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/news", label: "News", icon: Newspaper },
  { to: "/events", label: "Events", icon: CalendarDays },
  { to: "/leaderboard", label: "Board", icon: Trophy },
  { to: "/admin", label: "Admin", icon: Shield },
];

export function BottomNav() {
  const location = useLocation();
  const activePath = tabs.find((t) =>
    t.to === "/" ? location.pathname === "/" : location.pathname.startsWith(t.to)
  )?.to;

  return (
    <nav
      className="shrink-0 border-t border-zinc-200/60 bg-white/95 backdrop-blur-xl pb-safe shadow-[0_-1px_3px_rgba(0,0,0,0.04)]"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            className={({ isActive }) =>
              cn(
                "relative flex flex-col items-center gap-0.5 px-2 py-2.5 rounded-xl min-w-[48px] min-h-[44px]",
                isActive
                  ? "text-emerald-700"
                  : "text-zinc-400 active:text-zinc-600"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && activePath === tab.to && (
                  <motion.div
                    layoutId="bottomnav-pill"
                    className="absolute inset-0 rounded-xl bg-emerald-50/70"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <div className="relative z-10">
                  <tab.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                </div>
                <span className="relative z-10 text-[10px] font-semibold tracking-wide">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
