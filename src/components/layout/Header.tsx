import { useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { useState, useCallback } from "react";
import { cn } from "../../lib/cn";

const PAGE_TITLES: Record<string, string> = {
  "/": "Game Awn",
  "/news": "News Feed",
  "/events": "Events",
  "/leaderboard": "Leaderboard",
  "/members": "Members",
  "/results": "Results Grid",
  "/admin": "Admin",
};

export function Header({ hidden = false }: { hidden?: boolean }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isSubPage = /^\/(player|events)\/\d+/.test(location.pathname);
  const pageTitle = PAGE_TITLES[location.pathname];

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setTimeout(() => setIsRefreshing(false), 600);
  }, [queryClient]);

  function handleBack() {
    if (location.pathname.startsWith("/events/")) {
      if (window.history.state?.idx > 0) {
        navigate(-1);
      } else {
        navigate("/events");
      }
    } else if (location.pathname.startsWith("/player/")) {
      if (window.history.state?.idx > 0) {
        navigate(-1);
      } else {
        navigate("/members");
      }
    } else {
      navigate(-1);
    }
  }

  return (
    <header className={cn(
      "shrink-0 border-b bg-white/80 backdrop-blur-xl pt-safe will-change-transform",
      hidden && !isSubPage
        ? "header-hidden border-transparent"
        : "header-visible border-zinc-200/60"
    )}>
      <div className="flex items-center justify-between h-14 px-4 max-w-3xl mx-auto">
        {isSubPage ? (
          <div className="flex items-center">
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="mr-3 flex items-center justify-center w-11 h-11 rounded-full bg-zinc-100 text-zinc-600 active:scale-95 transition-transform"
            >
              <ChevronLeft size={20} />
            </button>
            <h1 className="font-display font-bold text-sm text-zinc-900">
              {location.pathname.startsWith("/events/") ? "Event Details" : "Player Profile"}
            </h1>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <img
              src="/gameawn.png"
              alt="Game Awn"
              className="w-8 h-8 rounded-full object-cover"
            />
            {pageTitle && (
              <h1 className="font-display font-bold text-sm text-zinc-900">{pageTitle}</h1>
            )}
          </div>
        )}

        {/* Refresh button on all pages */}
        <button
          onClick={handleRefresh}
          aria-label="Refresh data"
          className="flex items-center justify-center w-11 h-11 rounded-full text-zinc-400 hover:bg-zinc-100 active:scale-95 transition-all"
        >
          <RefreshCw size={16} className={cn(isRefreshing && "animate-spin")} />
        </button>
      </div>
    </header>
  );
}
