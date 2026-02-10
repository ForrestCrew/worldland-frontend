'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { SSHCredentials, type SSHCredentialsData } from './SSHCredentials';
import { SessionExtensionModal } from './SessionExtensionModal';
import { SessionCountdownTimer } from './SessionCountdownTimer';
import { SessionLowBalanceWarning } from './SessionLowBalanceWarning';
import { useCountdown, type UrgencyLevel } from '@/hooks/useCountdown';
import { useConfirmRental } from '@/hooks/useConfirmRental';
import { useCancelSession } from '@/hooks/useCancelSession';
import { toast } from 'sonner';

/**
 * Rental status type
 */
export type RentalStatus = 'PENDING' | 'RUNNING' | 'STOPPED' | 'FAILED';

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
  /** When session was created (ISO timestamp) - used for TTL countdown */
  created_at: string;
  /** Price per second in wei */
  price_per_sec: string;
  /** Price per hour in human-readable WLC (e.g., "1.50") */
  price_per_hour?: string;
  /** Transaction hash submitted for confirmation (Phase 14) */
  tx_hash?: string;
  /** SSH credentials (only when RUNNING) */
  ssh_credentials?: SSHCredentialsData;
  /** Extended expiration time (ISO timestamp, nullable) - Phase 16 */
  extended_until?: string;
  /** Number of times this session has been extended - Phase 16 */
  extension_count?: number;
  /** Current deposit balance in USDT - Phase 16 */
  balance?: string;
  /** Container provisioning status ("Pending"|"Creating"|"Starting"|"Running"|"Failed") */
  container_status?: string;
  /** Error reason when session is in FAILED state */
  error_reason?: string;
  /** Requested resources */
  docker_image?: string;
  gpu_count?: number;
  cpu_cores?: number;
  memory_gb_req?: number;
  storage_gb?: number;
}

/**
 * Urgency-based styles for countdown timer
 * - normal: >= 5 minutes remaining (yellow)
 * - warning: 2-5 minutes remaining (orange)
 * - critical: < 2 minutes remaining (red, pulsing)
 */
const urgencyStyles: Record<UrgencyLevel, string> = {
  normal: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  warning: 'bg-orange-500/10 border-orange-500/30 text-orange-400',
  critical: 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse',
};

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
      label: 'Starting',
      bgColor: 'bg-yellow-500/20',
      textColor: 'text-yellow-400',
      dotColor: 'bg-yellow-400',
      animate: true,
    },
    RUNNING: {
      label: 'Running',
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-400',
      dotColor: 'bg-green-400',
      animate: false,
    },
    STOPPED: {
      label: 'Stopped',
      bgColor: 'bg-gray-500/20',
      textColor: 'text-gray-400',
      dotColor: 'bg-gray-400',
      animate: false,
    },
    FAILED: {
      label: 'Failed',
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-400',
      dotColor: 'bg-red-400',
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
 * PendingContent - Enhanced pending state UI with countdown timer, retry, and cancel
 *
 * Features:
 * - TTL countdown timer (MM:SS format)
 * - Color urgency (yellow > 5min, orange 2-5min, red < 2min with pulse)
 * - Retry button calls /confirm endpoint with same txHash (idempotent)
 * - Cancel button cancels pending session
 * - txHash displayed for reference
 * - Expired state shows "TTL expired" message
 */
function PendingContent({
  rental,
  onRetry,
  onCancel,
}: {
  rental: RentalSession;
  onRetry?: () => void;
  onCancel?: () => void;
}) {
  // Calculate TTL expiry (10 minutes from created_at)
  const ttlExpiry = new Date(rental.created_at);
  ttlExpiry.setMinutes(ttlExpiry.getMinutes() + 10);

  const { timeRemaining, urgency, isExpired } = useCountdown(ttlExpiry);

  const confirmMutation = useConfirmRental();
  const cancelMutation = useCancelSession();

  const handleRetry = () => {
    if (!rental.tx_hash) {
      // No txHash means user hasn't submitted confirmation yet
      // This shouldn't happen in normal flow
      return;
    }
    confirmMutation.mutate({
      sessionId: rental.id,
      txHash: rental.tx_hash,
    });
    onRetry?.();
  };

  const handleCancel = () => {
    cancelMutation.mutate({ sessionId: rental.id });
    onCancel?.();
  };

  if (isExpired) {
    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <div className="text-gray-300 font-medium">TTL Expired</div>
            <div className="text-sm text-gray-500">
              Session will be automatically cancelled. Please start a new rental.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 mb-6 ${urgencyStyles[urgency]}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <div>
            <div className="font-medium">
              {rental.container_status === 'Creating' && 'Creating container'}
              {rental.container_status === 'Starting' && 'Starting SSH server'}
              {rental.container_status === 'Running' && 'Ready'}
              {rental.container_status === 'Failed' && 'Container creation failed'}
              {(!rental.container_status || rental.container_status === 'Pending') && 'Awaiting confirmation'}
            </div>
            <div className="text-sm opacity-70">
              {rental.container_status === 'Creating' && 'Downloading image and creating container'}
              {rental.container_status === 'Starting' && 'SSH server is starting. Connection will be available soon'}
              {rental.container_status === 'Running' && 'Will transition to RUNNING shortly'}
              {rental.container_status === 'Failed' && 'Container creation failed. Please try again'}
              {(!rental.container_status || rental.container_status === 'Pending') && 'SSH credentials will be provided after transaction verification'}
            </div>
          </div>
        </div>

        {/* Countdown timer */}
        <div className="text-right">
          <div className="text-2xl font-mono font-bold">
            {String(timeRemaining.minutes).padStart(2, '0')}:
            {String(timeRemaining.seconds).padStart(2, '0')}
          </div>
          <div className="text-xs opacity-70">remaining</div>
        </div>
      </div>

      {/* Transaction hash (read-only) */}
      {rental.tx_hash && (
        <div className="mb-3 p-2 bg-black/20 rounded font-mono text-xs break-all">
          <span className="opacity-50">tx: </span>
          {rental.tx_hash}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {rental.tx_hash && (
          <button
            onClick={handleRetry}
            disabled={confirmMutation.isPending}
            className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded text-sm font-medium transition-colors"
          >
            {confirmMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Retrying...
              </span>
            ) : (
              'Retry'
            )}
          </button>
        )}

        <button
          onClick={handleCancel}
          disabled={cancelMutation.isPending}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 text-white rounded text-sm font-medium transition-colors"
        >
          {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}

/**
 * FailedContent - Error state UI for failed sessions
 *
 * Shows when backend fails to create container after blockchain TX confirms.
 * Displays error message explaining that TX was successful but container
 * provisioning failed, and that a refund may be needed.
 */
function FailedContent({ rental }: { rental: RentalSession }) {
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <div className="flex-1">
          <div className="text-red-400 font-semibold text-base mb-2">GPU Rental Failed</div>
          <div className="text-sm text-red-300 mb-3">
            Container creation failed due to insufficient resources. The blockchain transaction was completed, but a refund may be needed.
          </div>
          {rental.error_reason && (
            <div className="text-xs text-red-300/70 bg-red-500/10 rounded p-2 font-mono break-all">
              <span className="opacity-70">Details: </span>
              {rental.error_reason}
            </div>
          )}
          {rental.tx_hash && (
            <div className="mt-2 p-2 bg-black/20 rounded font-mono text-xs break-all text-red-300/60">
              <span className="opacity-50">tx: </span>
              {rental.tx_hash}
            </div>
          )}
          <div className="mt-3 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
            Refunds are processed automatically during settlement or contact support.
          </div>
        </div>
      </div>
    </div>
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
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);

  // Format rental started time with Korean locale
  const startedAgo = formatDistanceToNow(new Date(rental.started_at), {
    addSuffix: true,
  });

  // Use backend-provided human-readable price per hour
  const pricePerHourDisplay = rental.price_per_hour || '0.00';

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
        </div>
        <div className="flex items-center gap-3">
          {rental.status === 'RUNNING' && rental.extended_until && (
            <SessionCountdownTimer
              extendedUntil={rental.extended_until}
              onExpiringSoon={() => {
                toast.warning('Session expires in 15 minutes', {
                  description: 'Extend your session or save your work.',
                });
              }}
            />
          )}
          <StatusBadge status={rental.status} />
        </div>
      </div>

      {/* Node ID */}
      <div className="mb-4">
        <span className="text-xs text-gray-500 font-mono">Node: {rental.node_id.slice(0, 8)}...{rental.node_id.slice(-8)}</span>
      </div>

      {/* Rental details */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-sm text-gray-400 mb-1">Started</div>
          <div className="text-white">{startedAgo}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400 mb-1">Price</div>
          <div className="text-white font-mono">{Number(pricePerHourDisplay).toFixed(2)} WLC/hr</div>
        </div>
      </div>

      {/* Requested resources */}
      {(rental.gpu_count || rental.cpu_cores || rental.memory_gb_req || rental.storage_gb) && (
        <div className="grid grid-cols-4 gap-2 mb-6 p-3 bg-gray-800/50 rounded-lg">
          {rental.gpu_count != null && (
            <div className="text-center">
              <div className="text-xs text-gray-500">GPU</div>
              <div className="text-sm text-white font-medium">{rental.gpu_count}</div>
            </div>
          )}
          {rental.cpu_cores != null && (
            <div className="text-center">
              <div className="text-xs text-gray-500">CPU</div>
              <div className="text-sm text-white font-medium">{rental.cpu_cores} cores</div>
            </div>
          )}
          {rental.memory_gb_req != null && (
            <div className="text-center">
              <div className="text-xs text-gray-500">RAM</div>
              <div className="text-sm text-white font-medium">{rental.memory_gb_req} GB</div>
            </div>
          )}
          {rental.storage_gb != null && (
            <div className="text-center">
              <div className="text-xs text-gray-500">Storage</div>
              <div className="text-sm text-white font-medium">{rental.storage_gb} GB</div>
            </div>
          )}
        </div>
      )}

      {/* Status-specific content */}
      {rental.status === 'PENDING' && (
        <PendingContent rental={rental} />
      )}

      {rental.status === 'RUNNING' && rental.balance && (
        <SessionLowBalanceWarning
          balance={rental.balance}
          pricePerSecond={rental.price_per_sec}
          onExtend={() => setIsExtensionModalOpen(true)}
          onDeposit={() => {
            // Navigate to deposit page
            window.location.href = '/balance';
          }}
          className="mb-6"
        />
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
              <div className="text-gray-300 font-medium">Rental Ended</div>
              <div className="text-sm text-gray-500">
                This session is no longer active
              </div>
            </div>
          </div>
        </div>
      )}

      {rental.status === 'FAILED' && (
        <FailedContent rental={rental} />
      )}

      {/* Action buttons */}
      {rental.status === 'RUNNING' && onStop && (
        <div className="flex justify-end gap-3">
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
                Stopping...
              </span>
            ) : (
              'Stop Rental'
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

      {/* Session extension modal */}
      <SessionExtensionModal
        isOpen={isExtensionModalOpen}
        onClose={() => setIsExtensionModalOpen(false)}
        session={rental}
      />
    </div>
  );
}

export default RentalStatusCard;
