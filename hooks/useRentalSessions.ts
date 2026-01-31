'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

/**
 * Rental session state from Hub API
 */
export type RentalSessionState = 'PENDING' | 'RUNNING' | 'STOPPED' | 'CANCELLED';

/**
 * Rental session data from Hub API
 */
export interface RentalSession {
  /** Session unique identifier */
  id: string;
  /** Node being rented */
  nodeId: string;
  /** Provider wallet address */
  providerId: string;
  /** GPU model */
  gpuType: string;
  /** Price per second in wei */
  pricePerSecond: string;
  /** Current session state */
  state: RentalSessionState;
  /** When rental started (ISO timestamp) */
  startTime?: string;
  /** When rental stopped (ISO timestamp) */
  stopTime?: string;
  /** Total settlement amount in wei */
  settlementAmount?: string;
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
 * Return type for useRentalSessions hook
 */
export interface UseRentalSessionsReturn {
  /** All rental sessions for the user */
  sessions: RentalSession[];
  /** Active rentals (PENDING or RUNNING) */
  active: RentalSession[];
  /** Completed rentals (STOPPED or CANCELLED) */
  completed: RentalSession[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Manually refetch sessions */
  refetch: () => void;
}

const HUB_API_URL = process.env.NEXT_PUBLIC_HUB_API_URL || 'http://localhost:8080';

/**
 * Fetch user's rental sessions from Hub API
 *
 * Queries GET /api/v1/rentals with SIWE session credentials.
 * Returns all rental sessions for the authenticated user with
 * pre-separated active and completed lists for UI convenience.
 *
 * Features:
 * - Auto-refresh every 30 seconds (refetchInterval)
 * - Stale after 10 seconds (staleTime)
 * - Address-scoped query key prevents cross-user data leaks
 * - Only enabled when wallet is connected
 * - Pre-separates active (PENDING/RUNNING) vs completed (STOPPED/CANCELLED)
 * - Includes credentials for SIWE session auth
 *
 * @example
 * const { active, completed, isLoading } = useRentalSessions();
 *
 * if (isLoading) return <Skeleton />;
 *
 * return (
 *   <div>
 *     <h2>Active Rentals ({active.length})</h2>
 *     {active.map(session => (
 *       <RentalCard key={session.id} session={session} />
 *     ))}
 *
 *     <h2>History ({completed.length})</h2>
 *     {completed.map(session => (
 *       <HistoryCard key={session.id} session={session} />
 *     ))}
 *   </div>
 * );
 */
export function useRentalSessions(): UseRentalSessionsReturn {
  const { address } = useAccount();

  const {
    data: sessions = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['rentals', 'user', address],
    queryFn: async (): Promise<RentalSession[]> => {
      if (!address) {
        return [];
      }

      const response = await fetch(`${HUB_API_URL}/api/v1/rentals`, {
        method: 'GET',
        credentials: 'include', // SIWE session auth
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || errorData.message || 'Failed to fetch rental sessions'
        );
      }

      const data = await response.json();
      return (data.sessions ?? data.data ?? []) as RentalSession[];
    },
    enabled: !!address,
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // 30 seconds polling
  });

  // Separate active vs completed for UI convenience
  const active = sessions.filter(
    (s) => s.state === 'RUNNING' || s.state === 'PENDING'
  );

  const completed = sessions.filter(
    (s) => s.state === 'STOPPED' || s.state === 'CANCELLED'
  );

  return {
    sessions,
    active,
    completed,
    isLoading,
    error: error as Error | null,
    refetch: () => {
      refetch();
    },
  };
}
