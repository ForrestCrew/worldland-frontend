'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';

/**
 * Transaction history item from Hub Indexer API
 */
export interface IndexedTransactionItem {
  /** Unique database ID */
  id: number;
  /** Event type: deposit or withdraw */
  event_type: 'deposit' | 'withdraw';
  /** Amount in wei (string for big numbers) */
  amount: string;
  /** Transaction hash */
  tx_hash: string;
  /** Block number */
  block_number: number;
  /** Block timestamp (ISO string) */
  block_timestamp: string;
}

/**
 * Cursor for pagination
 */
export interface PageCursor {
  after_timestamp?: string;
  after_id?: number;
}

/**
 * Page info for pagination response
 */
export interface PageInfo {
  limit: number;
  has_more: boolean;
  next_cursor?: PageCursor;
}

/**
 * Response from Hub API /api/history/deposits-withdraws/:address
 */
export interface IndexedTransactionHistoryResponse {
  items: IndexedTransactionItem[];
  page: PageInfo;
}

/**
 * Options for useIndexedTransactionHistory hook
 */
export interface UseIndexedTransactionHistoryOptions {
  /** Number of items per page (default: 50, max: 100) */
  limit?: number;
  /** Cursor: fetch items before this timestamp (RFC3339) */
  afterTimestamp?: string;
  /** Cursor: fetch items before this ID */
  afterId?: number;
}

const HUB_API_URL = process.env.NEXT_PUBLIC_HUB_API_URL || 'http://localhost:8080';

/**
 * Fetch indexed deposit/withdraw history from Hub API
 *
 * Queries GET /api/history/deposits-withdraws/:address
 * Returns paginated history of deposit and withdraw events
 * indexed by the Hub's blockchain indexer.
 *
 * Features:
 * - Cursor-based pagination for efficient scrolling
 * - Pre-indexed data (faster than on-chain queries)
 * - Stale after 30 seconds
 * - Auto-refresh every 60 seconds
 * - Only enabled when wallet is connected
 *
 * @param options - Pagination options
 *
 * @example
 * // Basic usage
 * const { data, isLoading, error } = useIndexedTransactionHistory();
 *
 * // With pagination
 * const [cursor, setCursor] = useState<PageCursor>();
 * const { data } = useIndexedTransactionHistory({
 *   limit: 20,
 *   afterTimestamp: cursor?.after_timestamp,
 *   afterId: cursor?.after_id,
 * });
 *
 * // Load more
 * const loadMore = () => {
 *   if (data?.page.next_cursor) {
 *     setCursor(data.page.next_cursor);
 *   }
 * };
 */
export function useIndexedTransactionHistory(options: UseIndexedTransactionHistoryOptions = {}) {
  const { address } = useAccount();
  const { limit = 50, afterTimestamp, afterId } = options;

  return useQuery({
    queryKey: ['indexedTransactionHistory', address, limit, afterTimestamp, afterId],
    queryFn: async (): Promise<IndexedTransactionHistoryResponse> => {
      if (!address) {
        return { items: [], page: { limit, has_more: false } };
      }

      const params = new URLSearchParams();
      params.set('limit', String(limit));
      if (afterTimestamp) params.set('after_timestamp', afterTimestamp);
      if (afterId) params.set('after_id', String(afterId));

      const response = await fetch(
        `${HUB_API_URL}/api/history/deposits-withdraws/${address}?${params}`
      );

      if (!response.ok) {
        throw new Error('입출금 내역 조회에 실패했습니다');
      }

      const json = await response.json();
      if (!json.success) {
        throw new Error(json.error?.message || '입출금 내역 조회에 실패했습니다');
      }

      return json.data;
    },
    enabled: !!address,
    staleTime: 30_000,  // 30 seconds
    refetchInterval: 60_000,  // Refetch every minute
  });
}
