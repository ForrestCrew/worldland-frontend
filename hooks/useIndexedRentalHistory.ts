'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

/**
 * Rental history item from Hub Indexer API
 */
export interface IndexedRentalItem {
  /** Rental ID from blockchain event */
  rental_id: number;
  /** User (renter) wallet address */
  user_address: string;
  /** Provider wallet address */
  provider_address: string;
  /** Rental start time (ISO string) */
  start_time: string;
  /** Rental end time (ISO string, null if active) */
  end_time?: string;
  /** Duration in seconds (null if active) */
  duration_seconds?: number;
  /** Total cost in wei (null if active) */
  cost_wei?: string;
  /** Transaction hash for RentalStarted event */
  start_tx_hash: string;
  /** Transaction hash for RentalStopped event (null if active) */
  stop_tx_hash?: string;
  /** Whether rental is currently active */
  is_active: boolean;
}

/**
 * Cursor for pagination
 */
export interface RentalPageCursor {
  after_timestamp?: string;
  after_id?: number;
}

/**
 * Page info for pagination response
 */
export interface RentalPageInfo {
  limit: number;
  has_more: boolean;
  next_cursor?: RentalPageCursor;
}

/**
 * Response from Hub API /api/history/rentals/:address
 */
export interface IndexedRentalHistoryResponse {
  items: IndexedRentalItem[];
  page: RentalPageInfo;
}

/**
 * Options for useIndexedRentalHistory hook
 */
export interface UseIndexedRentalHistoryOptions {
  /** Number of items per page (default: 50, max: 100) */
  limit?: number;
  /** Cursor: fetch items before this timestamp (RFC3339) */
  afterTimestamp?: string;
  /** Cursor: fetch items before this ID */
  afterId?: number;
}

const HUB_API_URL = process.env.NEXT_PUBLIC_HUB_API_URL || 'http://localhost:8080';

/**
 * Fetch indexed rental history from Hub API
 *
 * Queries GET /api/history/rentals/:address
 * Returns paginated history of rental sessions (started/stopped)
 * indexed by the Hub's blockchain indexer.
 *
 * Features:
 * - Cursor-based pagination for efficient scrolling
 * - Pre-indexed data (faster than on-chain queries)
 * - Shows both active and completed rentals
 * - Includes cost and duration for completed rentals
 * - Stale after 30 seconds
 * - Auto-refresh every 60 seconds
 * - Only enabled when wallet is connected
 *
 * @param options - Pagination options
 *
 * @example
 * // Basic usage
 * const { data, isLoading, error } = useIndexedRentalHistory();
 *
 * // Filter active vs completed
 * const active = data?.items.filter(r => r.is_active) ?? [];
 * const completed = data?.items.filter(r => !r.is_active) ?? [];
 *
 * // With pagination
 * const [cursor, setCursor] = useState<RentalPageCursor>();
 * const { data } = useIndexedRentalHistory({
 *   limit: 20,
 *   afterTimestamp: cursor?.after_timestamp,
 *   afterId: cursor?.after_id,
 * });
 */
export function useIndexedRentalHistory(options: UseIndexedRentalHistoryOptions = {}) {
  const { address } = useAccount();
  const { limit = 50, afterTimestamp, afterId } = options;

  return useQuery({
    queryKey: ['indexedRentalHistory', address, limit, afterTimestamp, afterId],
    queryFn: async (): Promise<IndexedRentalHistoryResponse> => {
      if (!address) {
        return { items: [], page: { limit, has_more: false } };
      }

      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (afterTimestamp) params.set('after_timestamp', afterTimestamp);
      if (afterId) params.set('after_id', String(afterId));

      const response = await fetch(
        `${HUB_API_URL}/api/history/rentals/${address}?${params}`
      );

      if (!response.ok) {
        throw new Error('임대 내역 조회에 실패했습니다');
      }

      const json = await response.json();
      if (!json.success) {
        throw new Error(json.error?.message || '임대 내역 조회에 실패했습니다');
      }

      return json.data;
    },
    enabled: !!address,
    staleTime: 30_000,  // 30 seconds
    refetchInterval: 60_000,  // Refetch every minute
  });
}
