import { useState, useEffect } from 'react';

export type SessionUrgency = 'safe' | 'warning' | 'critical';

interface SessionTimerResult {
  timeRemaining: number; // milliseconds
  formattedTime: string; // "HH:MM:SS" or "Xh Ym remaining"
  urgency: SessionUrgency;
  isExpiringSoon: boolean; // < 15 minutes
  isExpired: boolean;
}

/**
 * Session expiration countdown timer hook
 *
 * Tracks time remaining until session expiration with urgency levels.
 * Different from useCountdown (TTL for pending) - this is for RUNNING session expiration.
 *
 * Urgency levels:
 * - safe: > 60 minutes remaining (green)
 * - warning: 15-60 minutes remaining (yellow)
 * - critical: < 15 minutes remaining (red)
 *
 * Updates every 10 seconds as per 17-RESEARCH.md recommendations.
 *
 * @param extendedUntil - ISO timestamp for session expiration (nullable)
 * @returns Session timer state with formatted time and urgency
 *
 * @example
 * const { formattedTime, urgency, isExpiringSoon } = useSessionTimer(rental.extended_until);
 */
export function useSessionTimer(extendedUntil: string | null): SessionTimerResult {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Update every 10 seconds (balances accuracy vs performance)
    const interval = setInterval(() => {
      setNow(new Date());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // If no expiration set, return default state
  if (!extendedUntil) {
    return {
      timeRemaining: 0,
      formattedTime: '만료 시간 없음',
      urgency: 'safe',
      isExpiringSoon: false,
      isExpired: true,
    };
  }

  const expiryDate = new Date(extendedUntil);
  const timeRemaining = expiryDate.getTime() - now.getTime();
  const isExpired = timeRemaining <= 0;
  const totalSeconds = Math.max(0, Math.floor(timeRemaining / 1000));

  // Calculate urgency level
  const totalMinutes = Math.floor(totalSeconds / 60);
  let urgency: SessionUrgency = 'safe';
  if (totalMinutes < 15) urgency = 'critical';
  else if (totalMinutes < 60) urgency = 'warning';

  const isExpiringSoon = totalMinutes < 15;

  // Format time display
  let formattedTime: string;
  if (isExpired) {
    formattedTime = '만료됨';
  } else if (totalMinutes >= 60) {
    // More than 1 hour: "Xh Ym remaining"
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    formattedTime = `${hours}h ${minutes}m remaining`;
  } else {
    // Less than 1 hour: "MM:SS"
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return {
    timeRemaining: Math.max(0, timeRemaining),
    formattedTime,
    urgency,
    isExpiringSoon,
    isExpired,
  };
}
