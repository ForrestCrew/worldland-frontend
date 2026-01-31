'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { formatEther } from 'viem';
import { SSHCredentials, type SSHCredentialsData } from './SSHCredentials';

/**
 * Rental status type
 */
export type RentalStatus = 'PENDING' | 'RUNNING' | 'STOPPED';

/**
 * Rental session data
 */
export interface RentalSession {
  /** Rental session ID */
  id: string;
  /** Node/GPU ID */
  node_id: string;
  /** GPU type */
  gpu_type: string;
  /** VRAM in GB */
  vram_gb: number;
  /** Rental status */
  status: RentalStatus;
  /** When rental started */
  started_at: string;
  /** Price per second in wei */
  price_per_sec: string;
  /** SSH credentials (only when RUNNING) */
  ssh_credentials?: SSHCredentialsData;
}

/**
 * RentalStatusCard component props
 */
interface RentalStatusCardProps {
  /** Rental session data */
  rental: RentalSession;
  /** Callback when stop button clicked */
  onStop?: (rentalId: string) => Promise<void>;
  /** Additional CSS classes */
  className?: string;
}

/**
 * StatusBadge - Displays rental status with appropriate styling
 */
function StatusBadge({ status }: { status: RentalStatus }) {
  const statusConfig = {
    PENDING: {
      label: '시작 중',
      bgColor: 'bg-yellow-500/20',
      textColor: 'text-yellow-400',
      dotColor: 'bg-yellow-400',
      animate: true,
    },
    RUNNING: {
      label: '실행 중',
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-400',
      dotColor: 'bg-green-400',
      animate: false,
    },
    STOPPED: {
      label: '중지됨',
      bgColor: 'bg-gray-500/20',
      textColor: 'text-gray-400',
      dotColor: 'bg-gray-400',
      animate: false,
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`
        inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium
        ${config.bgColor} ${config.textColor}
      `}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dotColor} ${config.animate ? 'animate-pulse' : ''}`}
      />
      {config.label}
    </span>
  );
}

/**
 * RentalStatusCard - Active rental card with status, SSH credentials, and actions
 *
 * Features:
 * - Status display for PENDING/RUNNING/STOPPED states
 * - Integration with SSHCredentials component (only shown when RUNNING)
 * - Stop button with loading state
 * - Korean locale for time formatting using formatDistanceToNow
 * - GPU info display (type, VRAM)
 * - Price display (per hour)
 *
 * States:
 * - PENDING: "컨테이너 시작 중" message, no SSH credentials
 * - RUNNING: Full display with SSH credentials and stop action
 * - STOPPED: Rental ended, no actions available
 *
 * @example
 * <RentalStatusCard
 *   rental={rentalSession}
 *   onStop={handleStopRental}
 * />
 */
export function RentalStatusCard({
  rental,
  onStop,
  className = '',
}: RentalStatusCardProps) {
  const [isStopLoading, setIsStopLoading] = useState(false);

  // Format rental started time with Korean locale
  const startedAgo = formatDistanceToNow(new Date(rental.started_at), {
    addSuffix: true,
    locale: ko,
  });

  // Convert per-second price to per-hour for display
  const pricePerSec = BigInt(rental.price_per_sec);
  const pricePerHour = pricePerSec * BigInt(3600);
  const priceFormatted = formatEther(pricePerHour);

  // Handle stop button click
  const handleStop = async () => {
    if (!onStop || isStopLoading) return;

    setIsStopLoading(true);
    try {
      await onStop(rental.id);
    } finally {
      setIsStopLoading(false);
    }
  };

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-6 ${className}`}>
      {/* Card header with GPU info and status badge */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-white">{rental.gpu_type}</h3>
          <p className="text-sm text-gray-400">{rental.vram_gb} GB VRAM</p>
        </div>
        <StatusBadge status={rental.status} />
      </div>

      {/* Rental details */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <div className="text-sm text-gray-400 mb-1">임대 시작</div>
          <div className="text-white">{startedAgo}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">시간당 비용</div>
          <div className="text-white">{Number(priceFormatted).toFixed(4)} WLC/hr</div>
        </div>
      </div>

      {/* Status-specific content */}
      {rental.status === 'PENDING' && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-yellow-400 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <div>
              <div className="text-yellow-400 font-medium">컨테이너 시작 중</div>
              <div className="text-sm text-yellow-400/70">
                SSH 접속 정보가 준비되면 표시됩니다
              </div>
            </div>
          </div>
        </div>
      )}

      {rental.status === 'RUNNING' && rental.ssh_credentials && (
        <SSHCredentials credentials={rental.ssh_credentials} className="mb-6" />
      )}

      {rental.status === 'STOPPED' && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <svg
              className="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
              />
            </svg>
            <div>
              <div className="text-gray-300 font-medium">임대 종료됨</div>
              <div className="text-sm text-gray-500">
                이 세션은 더 이상 활성화되지 않습니다
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {rental.status === 'RUNNING' && onStop && (
        <div className="flex justify-end">
          <button
            onClick={handleStop}
            disabled={isStopLoading}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${isStopLoading
                ? 'bg-red-600/50 text-red-300 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'
              }
            `}
          >
            {isStopLoading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                중지 중...
              </span>
            ) : (
              '임대 종료'
            )}
          </button>
        </div>
      )}

      {/* Node ID footer */}
      <div className="mt-4 pt-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 font-mono">
          Node: {rental.node_id.slice(0, 8)}...{rental.node_id.slice(-8)}
        </div>
      </div>
    </div>
  );
}

export default RentalStatusCard;
