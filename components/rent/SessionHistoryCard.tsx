'use client';

import { format, formatDistanceStrict } from 'date-fns';
import { ko } from 'date-fns/locale';
import { formatEther } from 'viem';

/**
 * Session state for completed sessions
 */
export type CompletedSessionState = 'STOPPED' | 'CANCELLED';

/**
 * Completed session data
 */
export interface CompletedSession {
  /** Session unique identifier */
  id: string;
  /** GPU model */
  gpuType: string;
  /** Current session state */
  state: CompletedSessionState;
  /** When rental started (ISO timestamp) */
  startTime?: string;
  /** When rental stopped (ISO timestamp) */
  stopTime?: string;
  /** Total settlement amount in wei */
  settlementAmount?: string;
}

/**
 * SessionHistoryCard component props
 */
interface SessionHistoryCardProps {
  /** Completed session data */
  session: CompletedSession;
  /** Additional CSS classes */
  className?: string;
}

/**
 * StatusBadge - Displays session status with appropriate styling
 */
function StatusBadge({ state }: { state: CompletedSessionState }) {
  const statusConfig = {
    STOPPED: {
      label: '완료',
      bgColor: 'bg-gray-500/20',
      textColor: 'text-gray-400',
    },
    CANCELLED: {
      label: '취소됨',
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-400',
    },
  };

  const config = statusConfig[state];

  return (
    <span
      className={`
        inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
        ${config.bgColor} ${config.textColor}
      `}
    >
      {config.label}
    </span>
  );
}

/**
 * Calculate duration between two timestamps
 */
function calculateDuration(startTime?: string, stopTime?: string): string {
  if (!startTime || !stopTime) {
    return '-';
  }

  try {
    const start = new Date(startTime);
    const stop = new Date(stopTime);
    return formatDistanceStrict(start, stop, { locale: ko });
  } catch {
    return '-';
  }
}

/**
 * Format timestamp with Korean locale
 */
function formatTimestamp(timestamp?: string): string {
  if (!timestamp) {
    return '-';
  }

  try {
    const date = new Date(timestamp);
    return format(date, 'yyyy.MM.dd HH:mm', { locale: ko });
  } catch {
    return '-';
  }
}

/**
 * SessionHistoryCard - Displays completed or cancelled rental session
 *
 * Features:
 * - GPU type with status badge (STOPPED or CANCELLED)
 * - Session ID (truncated)
 * - Start/End times formatted with Korean locale
 * - Duration calculated from start/stop times
 * - Settlement amount displayed in WLC
 *
 * State handling:
 * - STOPPED: Shows as "완료" with gray badge
 * - CANCELLED: Shows as "취소됨" with red badge
 *
 * @example
 * <SessionHistoryCard
 *   session={{
 *     id: 'session-123',
 *     gpuType: 'RTX 4090',
 *     state: 'STOPPED',
 *     startTime: '2024-01-15T10:00:00Z',
 *     stopTime: '2024-01-15T12:30:00Z',
 *     settlementAmount: '1000000000000000000',
 *   }}
 * />
 */
export function SessionHistoryCard({
  session,
  className = '',
}: SessionHistoryCardProps) {
  // Calculate duration
  const duration = calculateDuration(session.startTime, session.stopTime);

  // Format settlement amount
  const settlementFormatted = session.settlementAmount
    ? Number(formatEther(BigInt(session.settlementAmount))).toFixed(4)
    : '0.0000';

  // Truncate session ID for display
  const truncatedId =
    session.id.length > 16
      ? `${session.id.slice(0, 8)}...${session.id.slice(-8)}`
      : session.id;

  return (
    <div
      className={`
        bg-gray-900/50 border border-gray-800 rounded-lg p-4
        ${className}
      `}
    >
      {/* Header: GPU type and status */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-white font-medium">{session.gpuType}</h4>
        <StatusBadge state={session.state} />
      </div>

      {/* Session details grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
        {/* Start time */}
        <div>
          <div className="text-gray-500 text-xs mb-0.5">시작</div>
          <div className="text-gray-300">{formatTimestamp(session.startTime)}</div>
        </div>

        {/* End time */}
        <div>
          <div className="text-gray-500 text-xs mb-0.5">종료</div>
          <div className="text-gray-300">{formatTimestamp(session.stopTime)}</div>
        </div>

        {/* Duration */}
        <div>
          <div className="text-gray-500 text-xs mb-0.5">이용 시간</div>
          <div className="text-gray-300">{duration}</div>
        </div>

        {/* Settlement */}
        <div>
          <div className="text-gray-500 text-xs mb-0.5">정산 금액</div>
          <div className="text-white font-medium">{settlementFormatted} WLC</div>
        </div>
      </div>

      {/* Session ID footer */}
      <div className="pt-2 border-t border-gray-800">
        <div className="text-xs text-gray-500 font-mono">
          Session: {truncatedId}
        </div>
      </div>
    </div>
  );
}

export default SessionHistoryCard;
