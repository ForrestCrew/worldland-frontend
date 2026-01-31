'use client';

import { useQuery } from '@tanstack/react-query';

/**
 * Rental status state from Hub API
 */
export type RentalStatusState = 'PENDING' | 'RUNNING' | 'STOPPED' | 'CANCELLED';

/**
 * Rental status data from Hub API
 */
export interface RentalStatusData {
  /** Session unique identifier */
  id: string;
  /** Current session state */
  state: RentalStatusState;
  /** When rental started (ISO timestamp) */
  startTime?: string;
  /** SSH host for connection */
  sshHost?: string;
  /** SSH port for connection */
  sshPort?: number;
  /** SSH username */
  sshUser?: string;
  /** SSH password (only shown during active session) */
  sshPassword?: string;
}

/**
 * Return type for useRentalStatus hook
 */
export interface UseRentalStatusReturn {
  /** Rental status data */
  status: RentalStatusData | undefined;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Manually refetch status */
  refetch: () => void;
  /** Whether rental is in PENDING state (blockchain lag window) */
  isPending: boolean;
  /** Whether rental is actively running */
  isRunning: boolean;
  /** Whether rental has ended (STOPPED or CANCELLED) */
  isEnded: boolean;
}

const HUB_API_URL = process.env.NEXT_PUBLIC_HUB_API_URL || 'http://localhost:8080';

/**
 * Fetch and poll rental status from Hub API with smart intervals
 *
 * Queries GET /api/v1/rentals/:sessionId with SIWE session credentials.
 * Uses adaptive polling based on rental state to handle blockchain lag.
 *
 * Polling Intervals (per RESEARCH.md Pattern 4):
 * - PENDING: 3 seconds (blockchain lag window, 15-30s typical)
 * - RUNNING: 30 seconds (normal monitoring)
 * - STOPPED/CANCELLED: No polling (terminal states)
 *
 * Features:
 * - Smart polling based on rental state
 * - 3s polling during PENDING handles 15-30s blockchain lag window
 * - Stops polling when rental ends (STOPPED/CANCELLED)
 * - Includes credentials for SIWE session auth
 * - State helper booleans (isPending, isRunning, isEnded)
 *
 * @param sessionId - The rental session ID to fetch status for
 * @param enabled - Whether to enable the query (default: true)
 *
 * @example
 * const { status, isPending, isRunning } = useRentalStatus(sessionId);
 *
 * if (isPending) {
 *   return <Spinner>Container starting... (15-30 seconds)</Spinner>;
 * }
 *
 * if (isRunning) {
 *   return <SSHCredentials {...status} />;
 * }
 */
export function useRentalStatus(
  sessionId: string,
  enabled = true
): UseRentalStatusReturn {
  const {
    data: status,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['rental', sessionId, 'status'],
    queryFn: async (): Promise<RentalStatusData> => {
      const response = await fetch(`${HUB_API_URL}/api/v1/rentals/${sessionId}`, {
        method: 'GET',
        credentials: 'include', // SIWE session auth
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || errorData.message || 'Failed to fetch rental status'
        );
      }

      const data = await response.json();
      return (data.data ?? data) as RentalStatusData;
    },
    enabled: enabled && !!sessionId,
    // Smart polling per RESEARCH.md Pattern 4
    refetchInterval: (query) => {
      const data = query.state.data;

      // Poll every 3s during PENDING (blockchain lag window)
      // Blockchain event sync typically takes 15-30s
      if (data?.state === 'PENDING') {
        return 3000;
      }

      // Poll every 30s during RUNNING (normal monitoring)
      if (data?.state === 'RUNNING') {
        return 30000;
      }

      // Stop polling if STOPPED or CANCELLED (terminal states)
      return false;
    },
  });

  // State helper booleans for UI convenience
  const isPending = status?.state === 'PENDING';
  const isRunning = status?.state === 'RUNNING';
  const isEnded = status?.state === 'STOPPED' || status?.state === 'CANCELLED';

  return {
    status,
    isLoading,
    error: error as Error | null,
    refetch: () => {
      refetch();
    },
    isPending,
    isRunning,
    isEnded,
  };
}
