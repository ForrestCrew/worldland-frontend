'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient } from 'wagmi';
import { formatEther, parseAbiItem } from 'viem';
import { RENTAL_CONTRACT_ADDRESS } from '@/lib/contracts/WorldlandRental';

/**
 * Transaction record from on-chain events
 */
export interface Transaction {
  /** Unique identifier (transaction hash) */
  id: string;
  /** Transaction type */
  type: 'deposit' | 'withdraw';
  /** Transaction hash */
  hash: `0x${string}`;
  /** Formatted amount (e.g., "100.5") */
  amount: string;
  /** Raw amount in wei */
  amountRaw: bigint;
  /** Block timestamp (null if unavailable) */
  timestamp: Date | null;
  /** Block number */
  blockNumber: bigint;
  /** Status - events are always confirmed */
  status: 'confirmed';
}

/**
 * Return type for useTransactionHistory hook
 */
export interface UseTransactionHistoryReturn {
  /** List of transactions sorted by block number descending */
  transactions: Transaction[];
  /** Whether data is loading */
  loading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Manually refetch transactions */
  refetch: () => void;
}

// Event signatures for Deposited and Withdrawn
const DEPOSITED_EVENT = parseAbiItem(
  'event Deposited(address indexed user, uint256 amount)'
);
const WITHDRAWN_EVENT = parseAbiItem(
  'event Withdrawn(address indexed user, uint256 amount)'
);

/**
 * Fetch transaction history from on-chain Deposit/Withdraw events
 *
 * Queries Deposited and Withdrawn events from the WorldlandRental contract
 * for the current user's address. Returns transactions sorted by block
 * number (newest first).
 *
 * Features:
 * - Fetches both deposit and withdraw events
 * - Resolves block timestamps for each transaction
 * - Sorted by block number descending (newest first)
 * - Auto-refresh every 2 minutes
 * - Stale after 1 minute
 *
 * @example
 * const { transactions, loading, error, refetch } = useTransactionHistory();
 *
 * if (loading) return <Skeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return (
 *   <ul>
 *     {transactions.map(tx => (
 *       <li key={tx.id}>{tx.type}: {tx.amount} BNB</li>
 *     ))}
 *   </ul>
 * );
 */
export function useTransactionHistory(): UseTransactionHistoryReturn {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const {
    data: transactions = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['transactionHistory', address],
    queryFn: async (): Promise<Transaction[]> => {
      if (!address || !publicClient) {
        return [];
      }

      // Fetch deposit events
      const depositLogs = await publicClient.getLogs({
        address: RENTAL_CONTRACT_ADDRESS,
        event: DEPOSITED_EVENT,
        args: { user: address },
        fromBlock: 'earliest',
      });

      // Fetch withdraw events
      const withdrawLogs = await publicClient.getLogs({
        address: RENTAL_CONTRACT_ADDRESS,
        event: WITHDRAWN_EVENT,
        args: { user: address },
        fromBlock: 'earliest',
      });

      // Convert logs to transaction objects
      const depositTxs: Transaction[] = depositLogs.map((log) => ({
        id: log.transactionHash,
        type: 'deposit' as const,
        hash: log.transactionHash,
        amount: formatEther(log.args.amount ?? BigInt(0)),
        amountRaw: log.args.amount ?? BigInt(0),
        timestamp: null, // Will be resolved below
        blockNumber: log.blockNumber,
        status: 'confirmed' as const,
      }));

      const withdrawTxs: Transaction[] = withdrawLogs.map((log) => ({
        id: log.transactionHash,
        type: 'withdraw' as const,
        hash: log.transactionHash,
        amount: formatEther(log.args.amount ?? BigInt(0)),
        amountRaw: log.args.amount ?? BigInt(0),
        timestamp: null,
        blockNumber: log.blockNumber,
        status: 'confirmed' as const,
      }));

      // Combine and sort by block number descending (newest first)
      const allTxs = [...depositTxs, ...withdrawTxs].sort(
        (a, b) => Number(b.blockNumber - a.blockNumber)
      );

      // Resolve timestamps for each transaction (batch for performance)
      // Limit to first 20 transactions to avoid too many RPC calls
      const txsToResolve = allTxs.slice(0, 20);
      const resolvedTxs = await Promise.all(
        txsToResolve.map(async (tx) => {
          try {
            const block = await publicClient.getBlock({
              blockNumber: tx.blockNumber,
            });
            return {
              ...tx,
              timestamp: new Date(Number(block.timestamp) * 1000),
            };
          } catch {
            // Keep null timestamp if block fetch fails
            return tx;
          }
        })
      );

      return resolvedTxs;
    },
    enabled: !!address && !!publicClient,
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // 2 minutes
  });

  return {
    transactions,
    loading: isLoading || isFetching,
    error: error as Error | null,
    refetch: () => {
      refetch();
    },
  };
}
