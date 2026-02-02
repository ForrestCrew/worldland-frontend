'use client';

import { useQuery } from '@tanstack/react-query';
import { useAccount } from 'wagmi';
import { useContractBalance } from './useContractBalance';

/**
 * Earnings breakdown for provider
 */
export interface ProviderEarnings {
  /** Total earned from all settlements (in wei) */
  totalEarned: bigint;
  /** Amount withdrawable from contract (on-chain balance in wei) */
  withdrawable: bigint;
  /** Amount pending settlement (Hub API balance not yet on-chain) */
  pendingSettlement: bigint;
}

/**
 * Return type for useProviderEarnings hook
 */
export interface UseProviderEarningsReturn {
  /** Earnings breakdown */
  earnings: ProviderEarnings;
  /** Whether data is loading */
  isLoading: boolean;
  /** Error if fetch failed */
  error: Error | null;
  /** Manually refetch earnings */
  refetch: () => void;
}

/**
 * Balance response from Hub API
 */
interface BalanceResponse {
  /** Available balance in wei (string to handle bigint from API) */
  balance: string;
  /** Total earned from all settlements */
  total_earned?: string;
}

const HUB_API_URL = process.env.NEXT_PUBLIC_HUB_API_URL || 'http://localhost:8080';

/**
 * Fetch provider's earnings from Hub API and contract
 *
 * Queries GET /api/v1/balance with SIWE session credentials and combines
 * with on-chain balance from WorldlandRental contract to provide earnings breakdown.
 *
 * Features:
 * - Auto-refresh every 60 seconds (refetchInterval)
 * - Stale after 55 seconds (staleTime)
 * - Combines Hub API balance with on-chain withdrawable balance
 * - Calculates pending settlement (off-chain earnings not yet on-chain)
 * - Address-scoped query key prevents cross-user data leaks
 * - Only enabled when wallet is connected
 *
 * @example
 * const { earnings, isLoading, error } = useProviderEarnings();
 *
 * if (isLoading) return <Skeleton />;
 * if (error) return <Error message={error.message} />;
 *
 * return (
 *   <div>
 *     <p>Total Earned: {formatEther(earnings.totalEarned)} BNB</p>
 *     <p>Withdrawable: {formatEther(earnings.withdrawable)} BNB</p>
 *     <p>Pending: {formatEther(earnings.pendingSettlement)} BNB</p>
 *   </div>
 * );
 */
export function useProviderEarnings(): UseProviderEarningsReturn {
  const { address } = useAccount();
  const { balance: withdrawable, loading: contractLoading } = useContractBalance();

  const {
    data: balanceData,
    isLoading: apiLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['provider', address, 'earnings'],
    queryFn: async (): Promise<BalanceResponse> => {
      if (!address) {
        return { balance: '0', total_earned: '0' };
      }

      // Get SIWE token from localStorage
      const storedAuth = localStorage.getItem('worldland_auth');
      const token = storedAuth ? JSON.parse(storedAuth).token : null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${HUB_API_URL}/api/v1/balance`, {
        method: 'GET',
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || errorData.message || 'Failed to fetch balance'
        );
      }

      const data = await response.json();
      return data.data ?? data;
    },
    enabled: !!address,
    staleTime: 55000, // 55 seconds
    refetchInterval: 60000, // 60 seconds background refresh
  });

  // Calculate earnings breakdown
  const totalEarned = balanceData?.total_earned
    ? BigInt(balanceData.total_earned)
    : BigInt(0);
  const hubBalance = balanceData?.balance ? BigInt(balanceData.balance) : BigInt(0);

  // Pending settlement = Hub API balance (off-chain) that hasn't been withdrawn on-chain
  // withdrawable = on-chain balance in contract
  // totalEarned = all-time earnings from Hub API
  const pendingSettlement = hubBalance;

  const earnings: ProviderEarnings = {
    totalEarned,
    withdrawable,
    pendingSettlement,
  };

  return {
    earnings,
    isLoading: apiLoading || contractLoading,
    error: error as Error | null,
    refetch: () => {
      refetch();
    },
  };
}
