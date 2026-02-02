import { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';

export type UrgencyLevel = 'normal' | 'warning' | 'critical';

interface CountdownResult {
  timeRemaining: { minutes: number; seconds: number };
  urgency: UrgencyLevel;
  isExpired: boolean;
  totalSeconds: number;
}

/**
 * Countdown timer hook with urgency levels for TTL display
 *
 * Urgency thresholds (from 15-RESEARCH.md):
 * - critical: < 2 minutes (red, animate-pulse)
 * - warning: < 5 minutes (orange/yellow)
 * - normal: >= 5 minutes (default)
 *
 * @param targetDate - The target date/time to count down to
 * @returns Countdown result with time remaining, urgency level, and expiration status
 *
 * @example
 * const ttlExpiry = new Date(rental.created_at);
 * ttlExpiry.setMinutes(ttlExpiry.getMinutes() + 10);
 * const { timeRemaining, urgency, isExpired } = useCountdown(ttlExpiry);
 */
export function useCountdown(targetDate: Date): CountdownResult {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const totalSeconds = differenceInSeconds(targetDate, now);
  const isExpired = totalSeconds <= 0;

  // Calculate urgency level
  let urgency: UrgencyLevel = 'normal';
  if (totalSeconds < 120) urgency = 'critical'; // < 2 min
  else if (totalSeconds < 300) urgency = 'warning'; // < 5 min

  const minutes = Math.floor(Math.abs(totalSeconds) / 60);
  const seconds = Math.abs(totalSeconds) % 60;

  return {
    timeRemaining: { minutes, seconds },
    urgency,
    isExpired,
    totalSeconds: Math.max(0, totalSeconds),
  };
}
