import { lazy, Suspense, useEffect, useRef, useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Header } from "./components/layout/Header";
import { BottomNav } from "./components/layout/BottomNav";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Skeleton } from "./components/ui/Skeleton";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const EventDetailPage = lazy(() => import("./pages/EventDetailPage"));
const PlayerPage = lazy(() => import("./pages/PlayerPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

function PageSkeleton() {
  return (
    <div className="px-4 pt-4 flex flex-col gap-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-24 w-full rounded-2xl" />
    </div>
  );
}

function ScrollToTop({
  scrollRef,
  onRouteChange,
}: {
  scrollRef: React.RefObject<HTMLElement | null>;
  onRouteChange: () => void;
}) {
  const { pathname } = useLocation();
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
    onRouteChange();
  }, [pathname, scrollRef, onRouteChange]);
  return null;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/player/:id" element={<PlayerPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const SCROLL_DELTA = 3;

export default function App() {
  const mainRef = useRef<HTMLElement>(null);
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  const handleScroll = useCallback(() => {
    if (ticking.current) return;
    ticking.current = true;
    requestAnimationFrame(() => {
      const el = mainRef.current;
      if (el) {
        const currentY = el.scrollTop;
        const delta = currentY - lastScrollY.current;
        if (delta > SCROLL_DELTA && currentY > 48) {
          setHeaderHidden(true);
          lastScrollY.current = currentY;
        } else if (delta < -SCROLL_DELTA) {
          setHeaderHidden(false);
          lastScrollY.current = currentY;
        }
      }
      ticking.current = false;
    });
  }, []);

  const resetHeader = useCallback(() => {
    setHeaderHidden(false);
    lastScrollY.current = 0;
  }, []);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <BrowserRouter>
      <div className="flex flex-col h-dvh bg-surface-50 text-zinc-800 max-w-3xl mx-auto app-shell">
        <ScrollToTop scrollRef={mainRef} onRouteChange={resetHeader} />
        <Header hidden={headerHidden} />
        <main ref={mainRef} className="flex-1 overflow-y-auto overscroll-contain scroll-smooth-ios">
          <ErrorBoundary>
            <Suspense fallback={<PageSkeleton />}>
              <AnimatedRoutes />
            </Suspense>
          </ErrorBoundary>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
