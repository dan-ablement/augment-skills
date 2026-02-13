'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseAutoRefreshOptions {
  refresh: () => Promise<void>;
  intervalMs?: number;
  idleThresholdMs?: number;
}

export interface UseAutoRefreshReturn {
  isIdle: boolean;
  hasNewData: boolean;
  dismissBanner: () => void;
  manualRefresh: () => void;
  lastRefreshTime: number | null;
}

/**
 * Auto-refresh hook with idle detection and background tab handling.
 *
 * - Active user (interaction within idleThresholdMs): auto-refresh every intervalMs
 * - Idle user (no interaction > idleThresholdMs): pause refresh; show banner on return
 * - Background tab (document.hidden): pause entirely; show banner on focus
 */
export function useAutoRefresh({
  refresh,
  intervalMs = 60000,
  idleThresholdMs = 180000,
}: UseAutoRefreshOptions): UseAutoRefreshReturn {
  const [isIdle, setIsIdle] = useState(false);
  const [hasNewData, setHasNewData] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(null);
  const [showUpdatedToast, setShowUpdatedToast] = useState(false);

  const lastActivityRef = useRef<number>(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const wasIdleOrHiddenRef = useRef(false);

  // Track user activity (throttled to every 2 seconds)
  const throttleRef = useRef<number>(0);
  const handleActivity = useCallback(() => {
    const now = Date.now();
    if (now - throttleRef.current < 2000) return;
    throttleRef.current = now;
    lastActivityRef.current = now;

    if (isIdle) {
      // User returned from idle — show banner instead of auto-refreshing
      setIsIdle(false);
      wasIdleOrHiddenRef.current = true;
      setHasNewData(true);
    }

    // Reset idle timer
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      setIsIdle(true);
    }, idleThresholdMs);
  }, [isIdle, idleThresholdMs]);

  // Set up activity listeners
  useEffect(() => {
    const events = ['mousemove', 'keydown', 'scroll'] as const;
    events.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));

    // Start idle timer
    idleTimerRef.current = setTimeout(() => setIsIdle(true), idleThresholdMs);

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [handleActivity, idleThresholdMs]);

  // Handle visibility change (background tab)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        // Tab going to background — pause
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Tab coming back — show banner
        wasIdleOrHiddenRef.current = true;
        setHasNewData(true);
        lastActivityRef.current = Date.now();
        setIsIdle(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Auto-refresh interval (only when active + visible)
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isIdle && !document.hidden) {
      intervalRef.current = setInterval(async () => {
        // Double-check not idle or hidden at fire time
        if (document.hidden || Date.now() - lastActivityRef.current > idleThresholdMs) return;
        try {
          await refreshRef.current();
          setLastRefreshTime(Date.now());
          setShowUpdatedToast(true);
          setTimeout(() => setShowUpdatedToast(false), 3000);
        } catch {
          // Silently fail on auto-refresh
        }
      }, intervalMs);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isIdle, intervalMs, idleThresholdMs]);

  const dismissBanner = useCallback(() => {
    setHasNewData(false);
  }, []);

  const manualRefresh = useCallback(async () => {
    setHasNewData(false);
    try {
      await refreshRef.current();
      setLastRefreshTime(Date.now());
    } catch {
      // caller handles errors
    }
  }, []);

  return { isIdle, hasNewData, dismissBanner, manualRefresh, lastRefreshTime };
}

