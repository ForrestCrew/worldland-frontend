'use client';

import { useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useSessionTimer, type SessionUrgency } from '@/hooks/useSessionTimer';

interface SessionCountdownTimerProps {
  extendedUntil: string | null;
  onExpiringSoon?: () => void; // Callback when entering critical zone
  className?: string;
}

/**
 * Urgency-based color styles for session countdown timer
 * - safe: > 60 minutes (green)
 * - warning: 15-60 minutes (yellow)
 * - critical: < 15 minutes (red with pulse)
 */
const urgencyColorClasses: Record<SessionUrgency, string> = {
  safe: 'text-green-400',
  warning: 'text-yellow-400',
  critical: 'text-red-400 animate-pulse',
};

/**
 * SessionCountdownTimer - Color-coded countdown display for session expiration
 *
 * Shows remaining time until session expires with urgency-based color coding.
 * Calls onExpiringSoon callback once when entering critical zone (< 15 minutes).
 *
 * Display format:
 * - > 1 hour: "Xh Ym remaining"
 * - <= 1 hour: "MM:SS"
 * - null extendedUntil: "만료 시간 없음" (gray)
 *
 * Color coding:
 * - Green: > 60 minutes (safe)
 * - Yellow: 15-60 minutes (warning)
 * - Red pulsing: < 15 minutes (critical)
 *
 * @example
 * <SessionCountdownTimer
 *   extendedUntil={rental.extended_until}
 *   onExpiringSoon={() => toast.warning('세션이 곧 만료됩니다')}
 * />
 */
export function SessionCountdownTimer({
  extendedUntil,
  onExpiringSoon,
  className = '',
}: SessionCountdownTimerProps) {
  const { formattedTime, urgency, isExpiringSoon } = useSessionTimer(extendedUntil);
  const hasTriggeredCallback = useRef(false);

  // Trigger onExpiringSoon callback once when entering critical zone
  useEffect(() => {
    if (isExpiringSoon && !hasTriggeredCallback.current && onExpiringSoon) {
      hasTriggeredCallback.current = true;
      onExpiringSoon();
    }

    // Reset if no longer expiring soon (e.g., session extended)
    if (!isExpiringSoon && hasTriggeredCallback.current) {
      hasTriggeredCallback.current = false;
    }
  }, [isExpiringSoon, onExpiringSoon]);

  // If no expiration set, show gray placeholder
  if (!extendedUntil) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <Clock className="w-4 h-4" />
        <span className="text-sm">만료 시간 없음</span>
      </div>
    );
  }

  const colorClass = urgencyColorClasses[urgency];

  return (
    <div className={`flex items-center gap-2 ${colorClass} ${className}`}>
      <Clock className="w-4 h-4" />
      <span className="text-sm font-medium">{formattedTime}</span>
    </div>
  );
}
