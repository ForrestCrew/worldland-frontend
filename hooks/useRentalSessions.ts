'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

/**
 * Rental session state from Hub API
 */
export type RentalSessionState = 'PENDING' | 'RUNNING' | 'STOPPED' | 'CANCELLED';

/**
 * Rental session data from Hub API
 *
 * ROOT CAUSE FIX (Phase 12): Added rentalId field for blockchain rental ID.
 * Hub API returns rentalId when session has been started on blockchain.
 * This is needed for stopRental contract call which requires the blockchain rental ID.
 */
export interface RentalSession {
  /** Session unique identifier (Hub database ID) */
  id: string;
  /** Node being rented */
  nodeId: string;
  /** Provider wallet address */
  providerId: string;
  /** GPU model */
  gpuType: string;
  /** GPU VRAM in GB */
  memoryGb: number;
  /** Price per second in wei */
  pricePerSecond: string;
  /** Current session state */
  state: RentalSessionState;
  /** Blockchain rental ID (from contract RentalStarted event) - required for stopRental */
  rentalId?: number;
  /** Transaction hash submitted for confirmation (Phase 14) */
  txHash?: string;
  /** When session was created (ISO timestamp) - used for TTL countdown */
  createdAt: string;
  /** When rental started (ISO timestamp) */
  startTime?: string;
  /** When rental stopped (ISO timestamp) - API returns as endTime */
  stopTime?: string;
  /** Alias for stopTime from API */
  endTime?: string;
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
  /** Extended expiration time (ISO timestamp, nullable) - Phase 16 */
  extendedUntil?: string;
  /** Number of times this session has been extended - Phase 16 */
  extensionCount?: number;
  /** Current deposit balance in USDT - Phase 16 */
  balance?: string;
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

      // ROOT CAUSE FIX (Phase 12): Get SIWE token and throw early if missing.
      // Previously, missing token resulted in 401 error from API which was not clear.
      // Now we throw with clear error message before making API call.
      const storedAuth = localStorage.getItem('worldland_auth');
      if (!storedAuth) {
        throw new Error('인증이 필요합니다. 지갑을 다시 연결해 주세요. (AUTH_MISSING)');
      }

      let token: string | null = null;
      try {
        const parsed = JSON.parse(storedAuth);
        token = parsed.token || null;
      } catch {
        throw new Error('인증 정보가 손상되었습니다. 지갑을 다시 연결해 주세요. (AUTH_INVALID)');
      }

      if (!token) {
        throw new Error('인증 토큰이 없습니다. 지갑을 다시 연결해 주세요. (TOKEN_MISSING)');
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      const response = await fetch(`${HUB_API_URL}/api/v1/rentals`, {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      // ROOT CAUSE FIX (Phase 12): Include HTTP status code in error message.
      // Previously only showed generic message, making debugging difficult.
      // Now error includes status code for proper error handling in UI.
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error?.message || errorData.error || errorData.message || 'Unknown error';
        throw new Error(`API 오류 (${response.status}): ${message}`);
      }

      const data = await response.json();
      // Debug: Log raw API response
      console.log('[useRentalSessions] Raw API response:', JSON.stringify(data, null, 2));
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
