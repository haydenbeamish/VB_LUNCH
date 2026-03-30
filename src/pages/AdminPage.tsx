import { useState, useEffect, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  LogOut,
  Check,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  login,
  logout,
  getStoredToken,
  setEventResult,
  getEvents,
  getEvent,
} from "../data/api";
import type { SetEventResultResponse } from "../data/api";
import type { CompetitionEvent, EventWithPredictions } from "../types";
import { Skeleton } from "../components/ui/Skeleton";
import { EmptyState } from "../components/ui/EmptyState";
import { cn } from "../lib/cn";

// --- Login form ---

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login(password);
      if (result.success) {
        onLogin();
      } else {
        setError(result.error || "Invalid password");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <Shield size={28} className="text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-zinc-800">Admin Login</h1>
          <p className="text-sm text-zinc-400 mt-1">Enter the admin password to manage results</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl border border-zinc-200 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
            autoFocus
          />
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs px-1">
              <AlertCircle size={12} />
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-all"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin mx-auto" />
            ) : (
              "Log In"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function EventResultCard({
  event,
  onSaved,
}: {
  event: CompetitionEvent;
  onSaved: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [customAnswer, setCustomAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmation, setConfirmation] = useState<SetEventResultResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: eventDetail } = useQuery<EventWithPredictions>({
    queryKey: ["event-admin", event.id],
    queryFn: () => getEvent(event.id),
    enabled: expanded,
  });

  const uniquePredictions = useMemo(
    () =>
      eventDetail
        ? [...new Set(eventDetail.predictions.map((p) => p.prediction?.trim()).filter(Boolean))]
        : [],
    [eventDetail]
  );

  const finalAnswer = selectedAnswer === "__custom__" ? customAnswer.trim() : selectedAnswer;

  const handleSave = async () => {
    if (!finalAnswer) return;
    setSaving(true);
    setError(null);
    try {
      const result = await setEventResult(event.id, finalAnswer);
      setConfirmation(result);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (confirmation) {
    const correct = confirmation.predictions?.filter((p) => p.is_correct) ?? [];
    const incorrect = confirmation.predictions?.filter((p) => !p.is_correct) ?? [];
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <h3 className="text-sm font-bold text-emerald-800">Result Saved</h3>
        </div>
        <p className="text-xs text-emerald-700 mb-2">
          <span className="font-semibold">{event.event_name}</span> — Answer:{" "}
          <span className="font-bold">{finalAnswer}</span>
        </p>
        {correct.length > 0 && (
          <div className="mb-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 mb-1">
              Correct ({correct.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {correct.map((p) => (
                <span
                  key={p.participant_name}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold"
                >
                  <Check size={8} /> {p.participant_name}{" "}
                  <span className="text-emerald-600">+{p.points_awarded.toFixed(1)}</span>
                </span>
              ))}
            </div>
          </div>
        )}
        {incorrect.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-1">
              Incorrect ({incorrect.length})
            </p>
            <div className="flex flex-wrap gap-1">
              {incorrect.map((p) => (
                <span
                  key={p.participant_name}
                  className="inline-flex px-2 py-0.5 rounded-full bg-red-50 text-red-400 text-[10px] font-medium"
                >
                  {p.participant_name}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border transition-all",
        expanded
          ? "border-emerald-200 bg-white shadow-sm"
          : "border-zinc-200/60 bg-white"
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-zinc-400">
              #{event.display_order}
            </span>
            <span
              className={cn(
                "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full",
                event.status === "in_progress"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-zinc-100 text-zinc-500"
              )}
            >
              {event.status === "in_progress" ? "Live" : "Upcoming"}
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-800 mt-0.5 line-clamp-2">
            {event.event_name}
          </p>
        </div>
        <ChevronDown
          size={16}
          className={cn(
            "text-zinc-400 transition-transform",
            expanded && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-zinc-100 pt-3">
              {uniquePredictions.length > 0 ? (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Select correct answer
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {uniquePredictions.map((pred) => (
                      <button
                        key={pred}
                        onClick={() => {
                          setSelectedAnswer(pred);
                          setCustomAnswer("");
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95",
                          selectedAnswer === pred
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                        )}
                      >
                        {pred}
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setSelectedAnswer("__custom__");
                      }}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95",
                        selectedAnswer === "__custom__"
                          ? "bg-amber-500 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      )}
                    >
                      Other...
                    </button>
                  </div>

                  {selectedAnswer === "__custom__" && (
                    <input
                      type="text"
                      value={customAnswer}
                      onChange={(e) => setCustomAnswer(e.target.value)}
                      placeholder="Enter correct answer"
                      className="w-full px-3 py-2 rounded-lg border border-zinc-200 text-base mb-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      autoFocus
                    />
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 py-2 text-zinc-400 text-xs">
                  <Loader2 size={12} className="animate-spin" /> Loading predictions...
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-xs mb-2">
                  <AlertCircle size={12} /> {error}
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={!finalAnswer || saving}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-sm disabled:opacity-40 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                Save Result
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Completed event row ---

function CompletedEventRow({ event }: { event: CompetitionEvent }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-100">
      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-600 line-clamp-1">
          <span className="text-zinc-400 mr-1">#{event.display_order}</span>
          {event.event_name}
        </p>
      </div>
      <span className="text-xs font-semibold text-emerald-700 shrink-0 max-w-[120px] truncate">
        {event.correct_answer}
      </span>
    </div>
  );
}

// --- Admin panel ---

function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const queryClient = useQueryClient();

  const {
    data: events = [],
    isLoading,
    error,
    refetch,
  } = useQuery<CompetitionEvent[]>({
    queryKey: ["admin-events"],
    queryFn: () => getEvents(),
  });

  const handleLogout = async () => {
    await logout();
    onLogout();
  };

  const handleEventSaved = useCallback(() => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    queryClient.invalidateQueries({ queryKey: ["results-grid"] });
    queryClient.invalidateQueries({ queryKey: ["events"] });
  }, [refetch, queryClient]);

  if (error) {
    return (
      <EmptyState
        icon={<Shield size={28} />}
        title="Couldn't load events"
        description={error instanceof Error ? error.message : String(error)}
      >
        <button
          onClick={() => refetch()}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-semibold"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </EmptyState>
    );
  }

  const pendingEvents = events
    .filter((e) => e.status !== "completed")
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  const completedEvents = events
    .filter((e) => e.status === "completed")
    .sort((a, b) => (b.display_order ?? 0) - (a.display_order ?? 0));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="pb-20"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-800">Admin Panel</h2>
          <p className="text-xs text-zinc-400">Set results for events</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-500 bg-zinc-100 active:scale-95 transition-transform"
        >
          <LogOut size={12} /> Logout
        </button>
      </div>

      {isLoading ? (
        <div className="px-4 flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="px-4">
          {/* Pending events */}
          {pendingEvents.length > 0 && (
            <div className="mb-6">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3 px-1">
                Pending ({pendingEvents.length})
              </h3>
              <div className="flex flex-col gap-2">
                {pendingEvents.map((event) => (
                  <EventResultCard
                    key={event.id}
                    event={event}
                    onSaved={handleEventSaved}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Completed events */}
          {completedEvents.length > 0 && (
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-3 px-1">
                Completed ({completedEvents.length})
              </h3>
              <div className="flex flex-col gap-1.5">
                {completedEvents.map((event) => (
                  <CompletedEventRow key={event.id} event={event} />
                ))}
              </div>
            </div>
          )}

          {pendingEvents.length === 0 && completedEvents.length === 0 && (
            <EmptyState
              icon={<Shield size={28} />}
              title="No events found"
              description="There are no events to manage."
            />
          )}
        </div>
      )}
    </motion.div>
  );
}

// --- Main admin page ---

export function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setAuthenticated(!!getStoredToken());
  }, []);

  if (!authenticated) {
    return <LoginForm onLogin={() => setAuthenticated(true)} />;
  }

  return <AdminPanel onLogout={() => setAuthenticated(false)} />;
}

export default AdminPage;
