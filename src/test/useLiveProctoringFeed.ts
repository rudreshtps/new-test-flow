import { useCallback, useEffect, useState } from "react";
import type { LiveProctoringEventItem, LiveProctoringStudentItem } from "./types";
import { fetchLiveProctoringFeed } from "./reportApi";

type LiveProctoringStats = {
  active_sessions: number;
  violated_students: number;
  students_with_violations: number;
  total_violation_events: number;
  max_violation_attempts: number;
};

type UseLiveProctoringFeedOptions = {
  testId: string;
  pollIntervalMs?: number;
  paused?: boolean;
  onNewViolations?: () => void;
};

/** Mock live proctoring feed — always loads once; polling respects paused flag */
export function useLiveProctoringFeed({
  testId,
  pollIntervalMs = 3000,
  paused = false,
}: UseLiveProctoringFeedOptions) {
  const [events, setEvents] = useState<LiveProctoringEventItem[]>([]);
  const [students, setStudents] = useState<LiveProctoringStudentItem[]>([]);
  const [stats, setStats] = useState<LiveProctoringStats>({
    active_sessions: 0,
    violated_students: 0,
    students_with_violations: 0,
    total_violation_events: 0,
    max_violation_attempts: 4,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLiveConnected] = useState(false);
  const [isLiveFeedActive, setIsLiveFeedActive] = useState<boolean | null>(null);
  const [isPollingHealthy, setIsPollingHealthy] = useState(false);
  const [latestViolation, setLatestViolation] =
    useState<LiveProctoringEventItem | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!testId) return;
    try {
      setError(null);
      const feed = await fetchLiveProctoringFeed(testId);
      setEvents(feed.events);
      setStudents(feed.students);
      setStats({
        active_sessions: feed.active_sessions,
        violated_students: feed.violated_students,
        students_with_violations: feed.students_with_violations ?? 0,
        total_violation_events: feed.total_violation_events,
        max_violation_attempts: feed.max_violation_attempts ?? 4,
      });
      setIsLiveFeedActive(feed.live_feed_active ?? false);
      setIsPollingHealthy(true);
      setLastFetchedAt(feed.fetched_at ?? new Date().toISOString());
    } catch (err) {
      console.error("Mock proctoring feed failed:", err);
      setError("Unable to load security logs.");
      setIsPollingHealthy(false);
    } finally {
      setLoading(false);
    }
  }, [testId]);

  useEffect(() => {
    if (!testId) return;
    setLoading(true);
    void load();
  }, [load, testId]);

  useEffect(() => {
    if (paused || !testId || isLiveFeedActive === false) return undefined;
    const timer = window.setInterval(() => void load(), pollIntervalMs);
    return () => window.clearInterval(timer);
  }, [load, paused, pollIntervalMs, testId, isLiveFeedActive]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await load();
  }, [load]);

  return {
    events,
    students,
    stats,
    loading,
    error,
    refresh,
    isLiveConnected,
    isLiveFeedActive,
    isPollingHealthy,
    latestViolation,
    setLatestViolation,
    lastFetchedAt,
  };
}
